// ============================================================================
// src/lib/tools/oui-lookup/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the OUI / MAC vendor lookup (posture "input"):
// a link carries the MAC address or OUI as typed, after the "#"
// (#input=00%3A1b%3A54%3A11%3A22%3A33), and nothing else. The manifest calls
// a MAC or OUI a non-sensitive hardware identifier (shareSafetyDefault
// "param"), so the popover shows the standard warning only.
//
// Arrival: NOT useShareArrival. OuiLookupTool already reads #input= with
// usePrefill (the serial console and other handoffs depend on it), which fills
// the field and looks it up as a paste would (loading the same-origin vendor
// table on the first lookup, as a paste does); that arrival is kept exactly as
// it is. encode gives exactly what usePrefill's apply accepts (one string), and
// decode mirrors readHandoff (any non-empty value).
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the field as typed. */
export interface OuiLookupShareState {
  /** The MAC address or OUI as typed. */
  input: string;
}

/** The spec. */
export const OUI_LOOKUP_SHARE: ShareSpec<OuiLookupShareState> = Object.freeze({
  tool: "oui-lookup", // the slug
  posture: "input", // the address as typed, with the standard warning
  carriesKey: "share.carries", // tools.oui-lookup.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The field as typed, or nothing while it is blank. */
  encode(state: OuiLookupShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value usePrefill's apply takes
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill (the page refuses a malformed address with its message). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v ? { input: v } : null; // the text, or nothing
  },
});
