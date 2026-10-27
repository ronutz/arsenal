// ============================================================================
// src/lib/tools/cert-renewal-planner/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the certificate renewal planner (posture
// "input"): a link carries the two dates, issued (notBefore) as the primary
// value and expires (notAfter) beside it. Two dates hold nothing secret.
// The "days remaining" lines are the opener's own: the page computes them
// from its clock, so a link opened later shows fewer days, as it should.
//
// Arrival: both dates fill their fields and the page plans. Each must be a
// real calendar date in the date field's form (YYYY-MM-DD), the only form a
// date field holds; anything else makes the whole share malformed.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the two date fields. */
export interface CertRenewalShareState {
  /** Issued (notBefore), YYYY-MM-DD. */
  notBefore: string;
  /** Expires (notAfter), YYYY-MM-DD. */
  notAfter: string;
}

/** A date as the date field gives it. */
const DATE = /^\d{4}-\d{2}-\d{2}$/; // anchored, fixed length: linear

/** Whether a text is a real calendar date in the date field's form (2026-02-30 is not). */
function isDate(s: string): boolean {
  if (!DATE.test(s)) return false; // the form
  const d = new Date(`${s}T00:00:00Z`); // read as UTC midnight
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; // the same day back: a real date
} // isDate

/** The spec. */
export const CERT_RENEWAL_PLANNER_SHARE: ShareSpec<CertRenewalShareState> = Object.freeze({
  tool: "cert-renewal-planner", // the slug
  posture: "input", // the dates as chosen
  carriesKey: "share.carries", // tools.cert-renewal-planner.share.carries
  names: ["input", "notafter"], // #input=<notBefore>&notafter=<notAfter>
  /** Both dates, when both are real dates. */
  encode(s: CertRenewalShareState): ShareEncoding {
    if (!isDate(s.notBefore) || !isDate(s.notAfter)) return { ok: false, reason: "empty" } as const; // no plan without both
    return { ok: true, params: { input: s.notBefore, notafter: s.notAfter } } as const; // the two values
  },
  /** Two real dates, or nothing. */
  decode(v: Readonly<Record<string, string | null>>): CertRenewalShareState | null {
    if (!v.input || !v.notafter || !isDate(v.input) || !isDate(v.notafter)) return null; // a date field cannot hold it: malformed
    return { notBefore: v.input, notAfter: v.notafter }; // the state to fill
  },
});
