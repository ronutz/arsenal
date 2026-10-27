// ============================================================================
// src/lib/tools/bits-bytes/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of bits, bytes and throughput (posture "input"): a
// link carries the four fields as typed (size, rate, time, efficiency), the
// filled ones only: any one of size, rate and time is explained alone, and
// any two give the third. Quantities hold nothing secret.
//
// The names: "size", "rate", "time" and "eff", not "input". This page reads
// #input= with usePrefill (a value handed over fills the size field), and a
// share that restores the four fields together needs an arrival of its own
// (useShareArrival); with "input" among its names both hooks would read the
// same value (ROLLOUT.md section 5). So the share uses names usePrefill
// never reads, and #input= keeps working exactly as before.
//
// Arrival: the four fields are set together (an absent one is emptied, so
// the result is the sender's) and the page computes. A value longer than its
// field holds (64 characters; 8 for a typed efficiency that is not one of the
// preset ids) makes the whole share malformed; any other text is accepted as
// a paste is, and a field the engine cannot read shows the page's own
// message, as it would when typed.
// ============================================================================

import { EFFICIENCY_PRESETS } from "./compute"; // the efficiency presets (their ids travel as they are)
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the four fields as typed ("" when empty). */
export interface BitsBytesShareState {
  /** The size field. */
  size: string;
  /** The rate field. */
  rate: string;
  /** The time field. */
  time: string;
  /** The efficiency: a preset id, a percentage, or "" for line rate. */
  efficiency: string;
}

/** The longest value each field holds (the page's maxLength). */
const MAX_FIELD = 64; // size, rate and time
/** The longest efficiency the typed field holds (a preset id is chosen with a button and may be longer). */
const MAX_EFF = 8; // the efficiency field's maxLength

/** The spec. */
export const BITS_BYTES_SHARE: ShareSpec<BitsBytesShareState> = Object.freeze({
  tool: "bits-bytes", // the slug
  posture: "input", // the fields as typed
  carriesKey: "share.carries", // tools.bits-bytes.share.carries
  names: ["size", "rate", "time", "eff"], // names usePrefill never reads
  /** The filled fields, when at least one quantity is filled. */
  encode(s: BitsBytesShareState): ShareEncoding {
    if (s.size.trim() === "" && s.rate.trim() === "" && s.time.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to compute
    const params: Record<string, string> = {}; // the filled fields
    if (s.size.trim() !== "") params.size = s.size; // size
    if (s.rate.trim() !== "") params.rate = s.rate; // rate
    if (s.time.trim() !== "") params.time = s.time; // time
    if (s.efficiency.trim() !== "") params.eff = s.efficiency; // efficiency other than line rate
    return { ok: true, params } as const; // the values
  },
  /** At least one quantity; each within its field's length; absent fields empty. */
  decode(v: Readonly<Record<string, string | null>>): BitsBytesShareState | null {
    const size = v.size ?? ""; // absent: empty
    const rate = v.rate ?? ""; // absent: empty
    const time = v.time ?? ""; // absent: empty
    const efficiency = v.eff ?? ""; // absent: line rate
    if (size.trim() === "" && rate.trim() === "" && time.trim() === "") return null; // nothing to compute
    if (size.length > MAX_FIELD || rate.length > MAX_FIELD || time.length > MAX_FIELD) return null; // longer than a field holds: malformed
    if (efficiency.length > MAX_EFF && !EFFICIENCY_PRESETS.some((p) => p.id === efficiency)) return null; // neither a preset nor what the field holds
    return { size, rate, time, efficiency }; // the state to fill
  },
});
