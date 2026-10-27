// ============================================================================
// src/lib/tools/nslookup-output-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the nslookup output explainer (posture
// "input-caution"): a link carries the nslookup output as pasted, after the
// "#", and nothing else. The manifest says nslookup output "can reveal
// internal names and resolver IPs" (shareSafetyDefault "fragment"), so the
// popover adds the tool's own caution line to the standard warning.
//
// Arrival (useShareArrival in NslookupOutputExplainerTool): the text fills the
// box as a paste would and the page explains it. Nothing is resolved. Any
// non-blank text is accepted here; text that is not nslookup output gets the
// page's own note, as a paste does.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the box as pasted. */
export interface NslookupOutputShareState {
  /** The nslookup output text. */
  input: string;
}

/** The spec. */
export const NSLOOKUP_OUTPUT_SHARE: ShareSpec<NslookupOutputShareState> = Object.freeze({
  tool: "nslookup-output-explainer", // the slug
  posture: "input-caution", // the paste as typed, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.nslookup-output-explainer.share.carries
  names: ["input"], // #input=
  /** The paste, or nothing while the box is blank. */
  encode(state: NslookupOutputShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value
  },
  /** Any non-blank text: the page reads it as a paste (and says so there if it is not nslookup output). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
