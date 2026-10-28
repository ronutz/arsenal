// ============================================================================
// src/lib/tools/f5-release-cadence-calendar/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 release cadence calendar (posture
// "input"; the manifest: "nothing sensitive; the schedule is public"). The
// tool is a form with nothing to paste, so a link carries named values only
// (no "input"):
//   from     the start date the schedule was computed from (YYYY-MM-DD), only
//            when it is not the sender's today: a calendar opened on today is
//            best opened on the reader's own today;
//   months   how many dates are listed (1 to 24), only when not 6, as the
//            engine uses it (it keeps 1 to 24).
// The untouched form (today, 6 months) has nothing to share, and the button
// is disabled. "In N days" stays relative to the reader's own today.
//
// Arrival: the date and the count are set, and the page lists the dates; an
// absent date keeps the reader's today, an absent count is 6. A date that is
// not a real calendar day, or a count outside 1 to 24, makes the share
// malformed: ignored.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The months listed when the reader changes nothing. */
const DEFAULT_MONTHS = 6; // the form's start value

/** The state to encode. */
export interface CadenceShareState {
  /** The date the schedule was computed from (the engine's referenceDate). */
  reference: string;
  /** The months field, as the page holds it. */
  months: number;
  /** The sender's today (YYYY-MM-DD), the form's start value. */
  today: string;
}

/** The state an arrival restores: null for a value the link does not carry. */
export interface CadenceArrival {
  /** The start date, or null (keep the reader's today). */
  from: string | null;
  /** The number of months. */
  months: number;
}

/**
 * Whether a text is a real calendar day in the YYYY-MM-DD form (the date field's value).
 * @param s the text
 * @returns true for a day that exists
 */
export function isCalendarDay(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); // the form
  if (!m) return false; // not the form
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))); // as a UTC day
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]); // round trips only when it exists
} // isCalendarDay

/** The spec. */
export const CADENCE_SHARE: ShareSpec<CadenceShareState, CadenceArrival> = Object.freeze({
  tool: "f5-release-cadence-calendar", // the slug
  posture: "input", // a date and a count, nothing sensitive
  carriesKey: "share.carries", // tools.f5-release-cadence-calendar.share.carries (an ICU select on whether the date goes)
  names: ["from", "months"], // no "input": a form
  /** The date unless it is today, the count unless it is 6; nothing for the untouched form. */
  encode(s: CadenceShareState): ShareEncoding {
    const params: Record<string, string> = {}; // the values
    if (s.reference !== s.today) params.from = s.reference; // a chosen start date
    const months = Math.max(1, Math.min(24, Math.trunc(Number.isFinite(s.months) ? s.months : DEFAULT_MONTHS))); // as the engine uses it
    if (months !== DEFAULT_MONTHS) params.months = String(months); // a chosen count
    if (Object.keys(params).length === 0) return { ok: false, reason: "empty" } as const; // today and 6: the button is disabled
    return { ok: true, params } as const; // the values
  },
  /** A real day and a count from 1 to 24, each optional; anything else is malformed. */
  decode(v: Readonly<Record<string, string | null>>): CadenceArrival | null {
    const from = v.from ?? null; // the date, if carried
    if (from !== null && !isCalendarDay(from)) return null; // not a real day
    const raw = v.months ?? null; // the count, if carried
    if (raw !== null && !/^\d{1,2}$/.test(raw)) return null; // not a small whole number
    const months = raw === null ? DEFAULT_MONTHS : Number(raw); // the count
    if (months < 1 || months > 24) return null; // outside what the page lists
    if (from === null && raw === null) return null; // nothing to fill
    return { from, months }; // the values
  },
});
