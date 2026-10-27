// ============================================================================
// src/lib/tools/cidr/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the CIDR calculator (posture "input"): a link
// carries the block the Subnet result was calculated from, after the "#"
// (#input=192.168.1.0%2F24), and nothing else. Only the Subnet mode shares:
// it is the mode the calculator's address handoff fills, and the other three
// modes (VLSM, supernet, overlap) have several fields that #input= cannot
// carry today (NOTES.md of the rollout, foundation proposal).
//
// Arrival: NOT useShareArrival. CidrTool already reads #input= with usePrefill
// (the home page's quick CIDR box depends on it), which fills the Subnet field
// and calculates through the same validator as Calculate; that arrival is kept
// exactly as it is. encode therefore gives exactly what usePrefill's apply
// accepts (one string), and decode mirrors readHandoff (any non-empty value),
// so the central harness checks the same rule the page applies.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the block the Subnet result shows. */
export interface CidrShareState {
  /** The block as analysed (cidrAnalyze's input: the field's text, trimmed). */
  input: string;
}

/** The spec. */
export const CIDR_SHARE: ShareSpec<CidrShareState> = Object.freeze({
  tool: "cidr", // the slug
  posture: "input", // the block as typed, with the standard warning
  carriesKey: "share.carries", // tools.cidr.share.carries
  names: ["input"], // #input=, the handoff the home page's quick box already uses
  /** The block, or nothing while there is none. */
  encode(state: CidrShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value usePrefill's apply takes
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill (the page refuses a malformed block with its message). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v ? { input: v } : null; // the text, or nothing
  },
});
