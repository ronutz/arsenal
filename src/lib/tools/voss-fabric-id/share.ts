// ============================================================================
// src/lib/tools/voss-fabric-id/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the VOSS fabric identifier decoder (posture
// "input"): a link carries the identifier as typed (an I-SID, a nickname or a
// system ID / B-MAC), after the "#" (#input=C.30.00), and nothing else.
//
// Arrival: NOT useShareArrival. VossFabricIdTool already reads #input= with
// usePrefill, which fills the field and decodes it as a paste would; that
// arrival is kept exactly as it is. encode gives exactly what usePrefill's
// apply accepts (one string), and decode mirrors readHandoff (any non-empty
// value).
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the field as typed. */
export interface VossFabricIdShareState {
  /** The identifier as typed. */
  input: string;
}

/** The spec. */
export const VOSS_FABRIC_ID_SHARE: ShareSpec<VossFabricIdShareState> = Object.freeze({
  tool: "voss-fabric-id", // the slug
  posture: "input", // the identifier as typed, with the standard warning
  carriesKey: "share.carries", // tools.voss-fabric-id.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The field as typed, or nothing while it is blank. */
  encode(state: VossFabricIdShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value usePrefill's apply takes
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill (the page refuses a malformed identifier with its message). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v ? { input: v } : null; // the text, or nothing
  },
});
