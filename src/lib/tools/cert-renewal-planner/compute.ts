// ============================================================================
// src/lib/tools/cert-renewal-planner/compute.ts
// ----------------------------------------------------------------------------
// CERTIFICATE RENEWAL PLANNER — pure, deterministic validity + cadence math.
//
// Given a certificate's notBefore and notAfter (the only inputs), this works
// out: the validity length, which CA/Browser Forum SC-081v3 phase the cert was
// issued under and whether its length is within that phase's cap, how many
// renewals per year that cadence implies (now and at every future cap), the
// domain-validation (DCV) and identity (SII) reuse windows for the issuance
// era, and a recommended renewal lead time and "renew by" date.
//
// DETERMINISTIC by construction: every output is a pure function of the two
// input dates and the fixed SC-081v3 schedule below. There is NO clock here —
// "days remaining" / "expired" are time-relative and would break golden
// vectors, so the component layers those on top using the device clock. Same
// input always yields the same output in any JS runtime. Written so the whole
// folder could be lifted into an open library unchanged if the project is ever
// opened.
//
// SCOPE: this models the rules for PUBLICLY TRUSTED TLS certificates (those
// chaining to a browser/OS root program). Private/internal PKI is not governed
// by SC-081v3 and is out of scope; a note flags this.
//
// Sources: CA/Browser Forum Ballot SC-081v3 (phased validity + DCV/SII reuse
// reductions, 2026-2029) and RFC 5280 (validity period semantics).
// ============================================================================

const MAX_INPUT = 64; // an ISO date or datetime is short
const DAY = 86_400_000; // ms in a day

export class RenewalInputError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RenewalInputError";
    this.code = code;
  }
}

/** One phase of the SC-081v3 schedule. Caps apply by ISSUANCE (notBefore) date. */
export interface Sc081Phase {
  /** Phase start — the issuance-date cutoff, UTC midnight. */
  fromIso: string;
  /** Maximum certificate validity, in days, for certs issued in this phase. */
  maxValidityDays: number;
  /** Maximum Domain Control Validation (DCV) data reuse window, in days. */
  dcvReuseDays: number;
  /** Maximum Subject Identity Information (OV/EV) reuse window, in days. */
  siiReuseDays: number;
  /** Stable id for i18n / display. */
  id: string;
}

/** Renewals-per-year a given cap implies (the escalation curve). */
export interface PhaseProjection {
  id: string;
  maxValidityDays: number;
  renewalsPerYear: number;
}

export interface RenewalAnalysis {
  notBeforeIso: string; // normalized YYYY-MM-DD (UTC)
  notAfterIso: string;
  validityDays: number;
  /** Index into `schedule` of the phase the cert was issued under. */
  issuancePhaseIndex: number;
  maxAllowedDays: number;
  compliant: boolean;
  /** Days over the issuance-phase cap; 0 when compliant. */
  overByDays: number;
  /** 365.25 / validityDays, rounded to one decimal. */
  renewalsPerYear: number;
  dcvReuseDays: number;
  siiReuseDays: number;
  /** Suggested days-before-expiry to renew (≈ one third of life, capped 2–30). */
  recommendedLeadDays: number;
  /** notAfter minus the recommended lead, YYYY-MM-DD. */
  renewByIso: string;
  schedule: Sc081Phase[];
  projection: PhaseProjection[];
  notes: { level: "info" | "warn"; code: string }[];
}

// SC-081v3 schedule. Approved April 2025; caps key off certificate issuance
// (notBefore) date. Phase 0 is the pre-ballot status quo carried forward.
const SCHEDULE: readonly Sc081Phase[] = Object.freeze([
  { id: "p0", fromIso: "2020-09-01", maxValidityDays: 398, dcvReuseDays: 398, siiReuseDays: 825 },
  { id: "p1", fromIso: "2026-03-15", maxValidityDays: 200, dcvReuseDays: 200, siiReuseDays: 398 },
  { id: "p2", fromIso: "2027-03-15", maxValidityDays: 100, dcvReuseDays: 100, siiReuseDays: 398 },
  { id: "p3", fromIso: "2029-03-15", maxValidityDays: 47, dcvReuseDays: 10, siiReuseDays: 398 },
]);

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Parse a UTC instant from an ISO date (YYYY-MM-DD) or ISO datetime. */
function parseDateUtc(raw: string): number {
  const s = raw.trim();
  if (!s) throw new RenewalInputError("empty", "empty input");
  if (s.length > MAX_INPUT) throw new RenewalInputError("tooLong", "input too long");
  let ms: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    ms = Date.parse(s + "T00:00:00Z");
  } else if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?$/.test(s)) {
    ms = Date.parse(s);
  } else {
    throw new RenewalInputError("invalidDate", "not an ISO date");
  }
  if (Number.isNaN(ms)) throw new RenewalInputError("invalidDate", "not an ISO date");
  return ms;
}

function isoDay(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function phaseIndexFor(ms: number): number {
  let idx = 0;
  for (let i = 0; i < SCHEDULE.length; i++) {
    if (ms >= Date.parse(SCHEDULE[i].fromIso + "T00:00:00Z")) idx = i;
  }
  return idx;
}

/**
 * analyzeRenewal — the deterministic core. Pure: no clock, no I/O, no DOM.
 */
export function analyzeRenewal(notBefore: string, notAfter: string): RenewalAnalysis {
  const nbMs = parseDateUtc(notBefore);
  const naMs = parseDateUtc(notAfter);
  if (naMs <= nbMs) throw new RenewalInputError("order", "notAfter must be after notBefore");

  const validityDays = Math.round((naMs - nbMs) / DAY);
  const pIdx = phaseIndexFor(nbMs);
  const phase = SCHEDULE[pIdx];
  const maxAllowedDays = phase.maxValidityDays;
  const compliant = validityDays <= maxAllowedDays;
  const overByDays = compliant ? 0 : validityDays - maxAllowedDays;
  const renewalsPerYear = round1(365.25 / validityDays);
  const recommendedLeadDays = Math.max(2, Math.min(30, Math.round(validityDays / 3)));
  const renewByIso = isoDay(naMs - recommendedLeadDays * DAY);

  const projection: PhaseProjection[] = SCHEDULE.map((p) => ({
    id: p.id,
    maxValidityDays: p.maxValidityDays,
    renewalsPerYear: round1(365.25 / p.maxValidityDays),
  }));

  const notes: { level: "info" | "warn"; code: string }[] = [];
  if (!compliant) notes.push({ level: "warn", code: "overCap" });
  // Compliant today but longer than the eventual 47-day cap → will tighten.
  if (compliant && validityDays > 47) notes.push({ level: "info", code: "future47" });
  notes.push({ level: "info", code: "publicOnly" });
  notes.push({ level: "info", code: "automate" });

  return {
    notBeforeIso: isoDay(nbMs),
    notAfterIso: isoDay(naMs),
    validityDays,
    issuancePhaseIndex: pIdx,
    maxAllowedDays,
    compliant,
    overByDays,
    renewalsPerYear,
    dcvReuseDays: phase.dcvReuseDays,
    siiReuseDays: phase.siiReuseDays,
    recommendedLeadDays,
    renewByIso,
    schedule: SCHEDULE.slice(),
    projection,
    notes,
  };
}

/** D-49 tool entry point. Deterministic; mirrors analyzeRenewal. */
export function run(input: { notBefore: string; notAfter: string }): RenewalAnalysis {
  return analyzeRenewal(input.notBefore, input.notAfter);
}
