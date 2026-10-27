// ============================================================================
// src/lib/tools/rpki-origin-validation/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the route origin validation calculator (posture
// "input"): a link carries the two inputs as typed, after the "#": the Route
// as the primary value and the VRP list (lines or SLURM JSON, the tool's own
// text form) as a named one, #input=192.0.2.0%2F24+AS64496&vrps=... The
// manifest calls a VRP list "the reader's own data", not a secret: VRPs,
// prefixes and AS numbers are routing data published in the RPKI.
//
// Arrival (useShareArrival in RpkiOriginValidationTool): both fill their boxes
// as a paste would, the preset marker clears, and the page decides the state.
// Nothing is fetched: the verdict holds for the pasted list, as the page says.
// A link missing either value is ignored (the page computes nothing without
// both); the page refuses malformed text with its own message, as a paste.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the two boxes as typed. */
export interface RpkiShareState {
  /** The Route line (a prefix and its origin AS). */
  input: string;
  /** The VRP list, one per line or SLURM JSON. */
  vrps: string;
}

/** The spec. */
export const RPKI_ORIGIN_VALIDATION_SHARE: ShareSpec<RpkiShareState> = Object.freeze({
  tool: "rpki-origin-validation", // the slug
  posture: "input", // the inputs as typed, with the standard warning
  carriesKey: "share.carries", // tools.rpki-origin-validation.share.carries
  names: ["input", "vrps"], // #input=<route>&vrps=<list>
  /** Both boxes as typed, or nothing while either is blank (the page computes only with both). */
  encode(state: RpkiShareState) {
    if (state.input.trim() === "" || state.vrps.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input, vrps: state.vrps } } as const; // the two values
  },
  /** Both values, non-blank; anything else is ignored whole. */
  decode(values: Readonly<Record<string, string | null>>) {
    const input = values.input; // the Route
    const vrps = values.vrps; // the list
    if (!input || input.trim() === "" || !vrps || vrps.trim() === "") return null; // a half share: nothing to fill
    return { input, vrps }; // the state to fill
  },
});
