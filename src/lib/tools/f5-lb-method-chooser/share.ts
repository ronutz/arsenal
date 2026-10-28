// ============================================================================
// src/lib/tools/f5-lb-method-chooser/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the LB-method chooser (posture
// "input-caution"): the page has two ways in with two answers, and each gets
// its own button, so each link carries one of them:
//   - the box (an ltm pool, a method name, "methods", or a "choose" line):
//     #input=, as typed. The manifest: "pool and member names identify
//     infrastructure", so that popover adds the tool's caution line. A pool
//     holds no secret setting (F5's tmsh reference, ltm pool, read
//     2026-10-27), so nothing is derived;
//   - the chooser panel's two answers: capacity and react, by their stable
//     ids (equal, ratio, connlimit, measured; none, connections, trend,
//     sessions, response), only when both are chosen (the panel answers only
//     then). They name nothing, so that popover has no caution line.
// Names: input, capacity, react; a link built here never mixes the two parts.
//
// Arrival: what the link carries is filled in (the box as a paste would, the
// two selects as chosen); what it does not carry keeps its value. An answer
// the selects do not offer, or one answer without the other, makes the whole
// share malformed: ignored. Any non-empty box is accepted, as a paste is.
// ============================================================================

import type { CapacityAnswer, ReactAnswer } from "./compute"; // the two answers' types
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The capacity answers the panel offers. */
const CAPACITY: readonly CapacityAnswer[] = ["equal", "ratio", "connlimit", "measured"]; // the select's options
/** The react answers the panel offers. */
const REACT: readonly ReactAnswer[] = ["none", "connections", "trend", "sessions", "response"]; // the select's options

/** The state to encode: one part filled, the other empty (each button encodes its own). */
export interface LbShareState {
  /** The box as typed, or "" when this button shares the panel. */
  input: string;
  /** The capacity answer, or "". */
  capacity: CapacityAnswer | "";
  /** The react answer, or "". */
  react: ReactAnswer | "";
}

/** The state an arrival restores: null for a part the link does not carry. */
export interface LbArrival {
  /** The box, or null. */
  input: string | null;
  /** The capacity answer, or null. */
  capacity: CapacityAnswer | null;
  /** The react answer, or null. */
  react: ReactAnswer | null;
}

/** The spec. */
export const LB_METHOD_SHARE: ShareSpec<LbShareState, LbArrival> = Object.freeze({
  tool: "f5-lb-method-chooser", // the slug
  posture: "input-caution", // the box as typed (with a caution line), or the two answers
  carriesKey: "share.carries", // tools.f5-lb-method-chooser.share.carries (an ICU select on the part)
  names: ["input", "capacity", "react"], // the box first
  /** The box when it holds something; the two answers when both are chosen. */
  encode(s: LbShareState): ShareEncoding {
    const params: Record<string, string> = {}; // the values
    if (s.input.trim() !== "") params.input = s.input; // the box, as typed
    if (s.capacity !== "" && s.react !== "") { params.capacity = s.capacity; params.react = s.react; } // the panel's two answers
    if (Object.keys(params).length === 0) return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params } as const; // the values
  },
  /** The parts carried, each validated; anything else is malformed. */
  decode(v: Readonly<Record<string, string | null>>): LbArrival | null {
    const input = v.input !== null && v.input !== undefined && v.input.trim() !== "" ? v.input : null; // the box, if carried
    if (v.input !== null && v.input !== undefined && input === null) return null; // a blank box is not a share
    const c = v.capacity ?? null; // the capacity answer, if carried
    const r = v.react ?? null; // the react answer, if carried
    if ((c === null) !== (r === null)) return null; // one answer without the other
    if (c !== null && !(CAPACITY as readonly string[]).includes(c)) return null; // an answer the select does not offer
    if (r !== null && !(REACT as readonly string[]).includes(r)) return null; // the same
    if (input === null && c === null) return null; // nothing to fill
    return { input, capacity: c as CapacityAnswer | null, react: r as ReactAnswer | null }; // the parts
  },
});
