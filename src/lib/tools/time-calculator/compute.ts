// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/time-calculator/compute.ts
// ----------------------------------------------------------------------------
// TIME CALCULATOR - exact time arithmetic on the UTC timeline:
//   diff  - the exact span between two instants;
//   shift - an instant plus or minus a duration.
//
// Design decisions, stated openly (tools that compute, never guess):
// - EXACT TIME ONLY. A duration here is a fixed number of milliseconds; days
//   are exactly 24 h and weeks exactly 7 d. CALENDAR arithmetic ("plus one
//   month") is deliberately not offered: a month is 28-31 days and a year 365
//   or 366, so "+1 month" has no single exact answer - the tool says so
//   instead of picking a convention silently.
// - DURATION INPUT accepts ISO 8601 (P2DT3H30M, PT90M, P1W) and the human
//   shorthand ("2d 3h 30m", "90min", "1w 2d"). Months/years in ISO durations
//   (P1M, P1Y) are rejected with the explanation above.
// - INSTANTS are ISO 8601 timestamps; a missing offset means UTC and is noted,
//   so the answer never depends on the machine's local zone.
// ============================================================================

export interface DurationBreakdown { weeks: number; days: number; hours: number; minutes: number; seconds: number; ms: number }
export interface DurationTotals { days: number; hours: number; minutes: number; seconds: number; ms: number }

export interface TimeAnalysis {
  kind: "diff" | "shift";
  /** diff: the two parsed instants; shift: start and result. */
  aIso: string;
  bIso: string;
  /** Signed duration in milliseconds (diff: b - a; shift: the applied delta). */
  ms: number;
  sign: 1 | -1;
  /** |ms| split largest-unit-first (weeks..ms). */
  breakdown: DurationBreakdown;
  /** |ms| expressed fully in each unit. */
  totals: DurationTotals;
  /** The canonical ISO 8601 duration for |ms| (PnDTnHnMnS). */
  iso: string;
  notes: string[];
}

export class TimeInputError extends Error {}

const MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 } as const;

/** Parse an ISO timestamp; missing offset = UTC (noted by the caller). */
function parseInstant(raw: string, label: string): { ms: number; assumedUtc: boolean } {
  const s = raw.trim();
  if (!s) throw new TimeInputError(`Enter the ${label} timestamp (ISO 8601, for example 2026-07-18T15:00Z).`);
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
  const hasTime = /T|\d:\d/.test(s);
  const normalized = hasOffset || !hasTime ? s : s + "Z";
  const ms = Date.parse(normalized);
  if (Number.isNaN(ms)) throw new TimeInputError(`"${s}" is not a parseable ISO 8601 timestamp (${label}).`);
  return { ms, assumedUtc: hasTime && !hasOffset };
}

/**
 * Parse a duration: ISO 8601 (P2DT3H30M / PT90M / P1W) or shorthand
 * ("2d 3h 30m", "90min", "1w", "45s"). Rejects P#M / P#Y honestly.
 */
export function parseDuration(raw: string): number {
  const s = raw.trim();
  if (!s) throw new TimeInputError("Enter a duration (for example P1DT2H30M, or: 1d 2h 30m).");
  // ISO 8601 form.
  if (/^P/i.test(s)) {
    if (/^\s*P(?=[^T]*[0-9]+\s*[YM])[^T]*[0-9]+\s*(Y|M)/i.test(s)) {
      throw new TimeInputError("Months and years are calendar units (28-31 and 365-366 days), so 'P1M'/'P1Y' has no single exact length. Use exact units: weeks, days, hours, minutes, seconds.");
    }
    const m = /^P(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(s);
    if (!m || (m[1] === undefined && m[2] === undefined && m[3] === undefined && m[4] === undefined && m[5] === undefined)) {
      throw new TimeInputError(`"${s}" is not a valid ISO 8601 duration. The form is PnW / PnDTnHnMnS, for example P1DT2H30M.`);
    }
    const [w, d, h, min, sec] = [m[1], m[2], m[3], m[4], m[5]].map((x) => (x ? Number(x) : 0));
    return Math.round(w * MS.w + d * MS.d + h * MS.h + min * MS.m + sec * MS.s);
  }
  // Human shorthand: number + unit tokens.
  const tokens = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(weeks?|w|days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s|ms)\b/gi)];
  if (tokens.length === 0) throw new TimeInputError(`"${s}" is not a duration I can read. Try "1d 2h 30m", "90min", or ISO 8601 like PT90M.`);
  let ms = 0;
  for (const t of tokens) {
    const n = Number(t[1]);
    const u = t[2].toLowerCase();
    if (u.startsWith("w")) ms += n * MS.w;
    else if (u.startsWith("d")) ms += n * MS.d;
    else if (u.startsWith("h")) ms += n * MS.h;
    else if (u === "ms") ms += n;
    else if (u.startsWith("m")) ms += n * MS.m;
    else ms += n * MS.s;
  }
  return Math.round(ms);
}

/** Split |ms| largest-unit-first, and total it in each unit. */
function splitMs(absMs: number): { breakdown: DurationBreakdown; totals: DurationTotals; iso: string } {
  let rest = absMs;
  const weeks = Math.floor(rest / MS.w); rest -= weeks * MS.w;
  const days = Math.floor(rest / MS.d); rest -= days * MS.d;
  const hours = Math.floor(rest / MS.h); rest -= hours * MS.h;
  const minutes = Math.floor(rest / MS.m); rest -= minutes * MS.m;
  const seconds = Math.floor(rest / MS.s); rest -= seconds * MS.s;
  const totals: DurationTotals = {
    days: absMs / MS.d, hours: absMs / MS.h, minutes: absMs / MS.m, seconds: absMs / MS.s, ms: absMs,
  };
  // Canonical ISO duration (days-based; weeks folded into days for one form).
  const dAll = weeks * 7 + days;
  const secPart = seconds + rest / 1000;
  let iso = "P";
  if (dAll) iso += `${dAll}D`;
  if (hours || minutes || secPart) {
    iso += "T";
    if (hours) iso += `${hours}H`;
    if (minutes) iso += `${minutes}M`;
    if (secPart) iso += `${Number(secPart.toFixed(3))}S`;
  }
  if (iso === "P") iso = "PT0S";
  return { breakdown: { weeks, days, hours, minutes, seconds, ms: rest }, totals, iso };
}

const fmt = (ms: number) => new Date(ms).toISOString().replace(".000Z", "Z");

/** Exact span between two instants (b - a, sign preserved). */
export function diff(aRaw: string, bRaw: string): TimeAnalysis {
  const a = parseInstant(aRaw, "first");
  const b = parseInstant(bRaw, "second");
  const notes: string[] = [];
  if (a.assumedUtc || b.assumedUtc) notes.push("A timestamp without an offset was read as UTC. Add Z or an offset (-03:00) to be explicit.");
  const ms = b.ms - a.ms;
  const sign: 1 | -1 = ms < 0 ? -1 : 1;
  const { breakdown, totals, iso } = splitMs(Math.abs(ms));
  if (sign < 0) notes.push("The second instant is earlier than the first; the span is shown as a positive duration with the direction noted.");
  return { kind: "diff", aIso: fmt(a.ms), bIso: fmt(b.ms), ms, sign, breakdown, totals, iso, notes };
}

/** An instant shifted by ±duration. */
export function shift(startRaw: string, durationRaw: string, op: "add" | "subtract"): TimeAnalysis {
  const start = parseInstant(startRaw, "start");
  const dur = parseDuration(durationRaw);
  const notes: string[] = [];
  if (start.assumedUtc) notes.push("A timestamp without an offset was read as UTC. Add Z or an offset (-03:00) to be explicit.");
  const signed = op === "subtract" ? -dur : dur;
  const result = start.ms + signed;
  const { breakdown, totals, iso } = splitMs(Math.abs(signed));
  return { kind: "shift", aIso: fmt(start.ms), bIso: fmt(result), ms: signed, sign: signed < 0 ? -1 : 1, breakdown, totals, iso, notes };
}

/** API entrypoint (D-72): mode-tagged input. */
export function run(input: { mode: "diff" | "shift"; a?: string; b?: string; start?: string; duration?: string; op?: "add" | "subtract" }): TimeAnalysis {
  if (input?.mode === "shift") return shift(String(input.start ?? ""), String(input.duration ?? ""), input.op === "subtract" ? "subtract" : "add");
  return diff(String(input?.a ?? ""), String(input?.b ?? ""));
}
