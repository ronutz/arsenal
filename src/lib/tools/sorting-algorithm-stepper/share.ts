// ============================================================================
// src/lib/tools/sorting-algorithm-stepper/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the sorting algorithm stepper (posture "input";
// the manifest: "number lists carry no secrets"). A link carries the numbers
// as typed and the strategy, once the page has stepped through them; the
// steps themselves are not carried, since the page recomputes them exactly.
// The strategy is always written (a form carries every field, so an old link
// keeps its meaning if the default changes).
//
// Arrival: the numbers fill the box and the strategy is chosen, as the reader
// would, and the page steps through them. Any non-blank list is accepted, as a
// paste is (one the page refuses shows its error); an unknown strategy makes
// the whole share malformed.
// ============================================================================

import { run, type Strategy } from "./compute"; // the page's own engine and its strategies
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The strategies, by their stable ids (the page's select lists them in this order). */
export const SORT_STRATEGIES: readonly Strategy[] = Object.freeze(["bubble", "selection", "insertion", "merge", "quick"] as Strategy[]); // the five

/** The state: the numbers and the strategy. */
export interface SortShareState {
  /** The numbers as typed. */
  input: string;
  /** The strategy. */
  strategy: Strategy;
}

/**
 * Encode from a trace the page already made.
 * @param s the state
 * @param traced whether the page has a trace (false while blank or refused)
 * @returns both values, or nothing
 */
export function encodeSortShare(s: SortShareState, traced: boolean): ShareEncoding {
  if (s.input.trim() === "" || !traced) return { ok: false, reason: "empty" }; // no trace: nothing to share
  return { ok: true, params: { input: s.input, strategy: s.strategy } }; // the numbers and the strategy
} // encodeSortShare

/** The spec. */
export const SORT_SHARE: ShareSpec<SortShareState> = Object.freeze({
  tool: "sorting-algorithm-stepper", // the slug
  posture: "input", // numbers only
  carriesKey: "share.carries", // tools.sorting-algorithm-stepper.share.carries
  names: ["input", "strategy"], // the numbers first
  /** Both values, or nothing (the spec steps through them itself). */
  encode(s: SortShareState): ShareEncoding {
    let traced = false; // whether the engine reads them
    try { traced = s.input.trim() !== "" && !!run({ text: s.input, strategy: s.strategy }); } catch { traced = false; } // the engine throws on what it refuses
    return encodeSortShare(s, traced); // encoded
  },
  /** The numbers (any non-blank text) and a known strategy; anything else is malformed. */
  decode(v: Readonly<Record<string, string | null>>): SortShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing to sort
    const strategy = SORT_STRATEGIES.find((x) => x === v.strategy); // a known id, exactly
    return strategy ? { input: v.input, strategy } : null; // both, or malformed
  },
});
