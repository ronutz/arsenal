// ============================================================================
// src/lib/tools/time-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the time calculator (posture "input": the
// manifest declares no share default, and instants and durations name nothing
// of the reader's). A form (ROLLOUT 11.3): the link carries named values only,
// every field of the mode shown, as the page reads them:
//   mode=diff   first, second (the two instants);
//   mode=shift  start, duration, op (add or subtract).
// The fields of the other mode are not carried (the page does not read them).
// A link is offered once the page has a result; an input it refuses has none.
//
// Arrival: the mode is chosen and its fields fill as the reader would type
// them, and the page computes. An unknown mode or operation, a missing field,
// or a field of the other mode makes the whole share malformed; the fields of
// the other mode keep what the opener had.
// ============================================================================

import { diff, shift } from "./compute"; // the page's own engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the mode and its fields. */
export type TimeShareState =
  | { mode: "diff"; first: string; second: string } // the span between two instants
  | { mode: "shift"; start: string; duration: string; op: "add" | "subtract" }; // an instant plus or minus a duration

/**
 * Encode from a result the page already made.
 * @param s the state
 * @param computed whether the page has a result (false while blank or refused)
 * @returns the mode's fields, or nothing
 */
export function encodeTimeShare(s: TimeShareState, computed: boolean): ShareEncoding {
  if (!computed) return { ok: false, reason: "empty" }; // no result: nothing to share
  if (s.mode === "diff") return { ok: true, params: { mode: "diff", first: s.first, second: s.second } }; // the two instants
  return { ok: true, params: { mode: "shift", start: s.start, duration: s.duration, op: s.op } }; // the instant, the duration, the operation
} // encodeTimeShare

/** The spec. */
export const TIME_SHARE: ShareSpec<TimeShareState> = Object.freeze({
  tool: "time-calculator", // the slug
  posture: "input", // instants and durations
  carriesKey: "share.carries", // tools.time-calculator.share.carries
  names: ["mode", "first", "second", "start", "duration", "op"], // a form: no input (11.3)
  /** The mode's fields, or nothing (the spec computes them itself). */
  encode(s: TimeShareState): ShareEncoding {
    let computed = false; // whether the engine reads them
    try { computed = s.mode === "diff" ? !!diff(s.first, s.second) : !!shift(s.start, s.duration, s.op); } catch { computed = false; } // the engine throws on what it refuses
    return encodeTimeShare(s, computed); // encoded
  },
  /** One mode's fields, all present and non-blank, and nothing of the other mode. */
  decode(v: Readonly<Record<string, string | null>>): TimeShareState | null {
    const filled = (x: string | null): x is string => x !== null && x.trim() !== ""; // present and not blank
    if (v.mode === "diff") { // the span
      if (v.start !== null || v.duration !== null || v.op !== null) return null; // a field of the other mode
      return filled(v.first) && filled(v.second) ? { mode: "diff", first: v.first, second: v.second } : null; // both instants
    } // diff
    if (v.mode === "shift") { // the shift
      if (v.first !== null || v.second !== null) return null; // a field of the other mode
      if (v.op !== "add" && v.op !== "subtract") return null; // an unknown operation
      return filled(v.start) && filled(v.duration) ? { mode: "shift", start: v.start, duration: v.duration, op: v.op } : null; // the instant and the duration
    } // shift
    return null; // an unknown or missing mode
  },
});
