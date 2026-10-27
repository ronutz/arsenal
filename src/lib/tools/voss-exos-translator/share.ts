// ============================================================================
// src/lib/tools/voss-exos-translator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the VOSS / EXOS command translator (posture
// "input"): a link carries the search words as typed, after the "#"
// (#input=i-sid), and nothing else; whoever opens it sees the same mappings.
//
// Arrival: NOT useShareArrival. VossExosTranslatorTool already reads #input=
// with usePrefill, which fills the search field as a paste would; that arrival
// is kept exactly as it is. encode gives exactly what usePrefill's apply
// accepts (one string), and decode mirrors readHandoff (any non-empty value).
// The page offers the button only when the search finds something (an empty
// search lists every mapping, which needs no link).
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the search field as typed. */
export interface VossExosTranslatorShareState {
  /** The search words as typed. */
  input: string;
}

/** The spec. */
export const VOSS_EXOS_TRANSLATOR_SHARE: ShareSpec<VossExosTranslatorShareState> = Object.freeze({
  tool: "voss-exos-translator", // the slug
  posture: "input", // the search as typed, with the standard warning
  carriesKey: "share.carries", // tools.voss-exos-translator.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The search as typed, or nothing while it is blank (a blank search lists everything). */
  encode(state: VossExosTranslatorShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value usePrefill's apply takes
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill. */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v ? { input: v } : null; // the text, or nothing
  },
});
