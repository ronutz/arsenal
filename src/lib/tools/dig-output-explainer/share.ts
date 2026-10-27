// ============================================================================
// src/lib/tools/dig-output-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the dig output explainer (posture
// "input-caution"): a link carries the dig output as pasted, after the "#",
// and nothing else. The manifest says dig output "can reveal internal names
// and resolver IPs" (shareSafetyDefault "fragment"), so the popover adds the
// tool's own caution line (tools.dig-output-explainer.share.caution) to the
// standard warning.
//
// Arrival (useShareArrival in DigOutputExplainerTool): the text fills the box
// as a paste would and the page explains it. Nothing is resolved: the tool
// never contacts a server. Any non-blank text is accepted here; text that is
// not dig output gets the page's own note, as a paste does.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the box as pasted. */
export interface DigOutputShareState {
  /** The dig output text. */
  input: string;
}

/** The spec. */
export const DIG_OUTPUT_SHARE: ShareSpec<DigOutputShareState> = Object.freeze({
  tool: "dig-output-explainer", // the slug
  posture: "input-caution", // the paste as typed, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.dig-output-explainer.share.carries
  names: ["input"], // #input=
  /** The paste, or nothing while the box is blank. */
  encode(state: DigOutputShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value
  },
  /** Any non-blank text: the page reads it as a paste (and says so there if it is not dig output). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
