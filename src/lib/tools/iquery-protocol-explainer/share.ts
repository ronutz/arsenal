// ============================================================================
// src/lib/tools/iquery-protocol-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iQuery protocol explainer (posture
// "input-caution", raised from "input" on 2026-10-27): a link carries the box
// as typed (iqdump output, /var/log/gtm lines, or a topic), after the "#", and
// nothing else. The manifest says "iqdump output can carry internal hostnames /
// self IPs" (shareSafetyDefault "fragment"), so the popover adds the tool's
// caution line (tools.iquery-protocol-explainer.share.caution); the inventory
// had read only the comment on the shareSafetyDefault line, which is empty.
//
// The topic index is not a result: an empty box shows it, and so does "list" or
// text the tool does not recognise (with a note). In those cases the button is
// disabled (state.listing). Neither iqdump output nor these log lines carry
// credentials: the iQuery trust is certificates exchanged on the devices.
//
// Arrival (useShareArrival in the component): the text fills the box as a
// paste would and the page reads it. Nothing is contacted, as always: the tool
// never opens a socket. Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** What encode reads: the box, and whether the page shows only the topic index for it. */
export interface IqueryShareInput {
  /** The paste. */
  input: string;
  /** True when the reading is the topic index (an empty box, "list", or unrecognised text). */
  listing: boolean;
}

/** What an arrival restores: the box. */
export interface IqueryShareState {
  /** The paste. */
  input: string;
}

/** The spec. */
export const IQUERY_SHARE: ShareSpec<IqueryShareInput, IqueryShareState> = Object.freeze({
  tool: "iquery-protocol-explainer", // the slug
  posture: "input-caution", // the paste as typed, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.iquery-protocol-explainer.share.carries
  names: ["input"], // #input=
  /** The paste, once it reads as iqdump output, a log line or a topic. */
  encode(state: IqueryShareInput): ShareEncoding {
    if (state.input.trim() === "" || state.listing) return { ok: false, reason: "empty" }; // the index is not a result: the button is disabled
    return { ok: true, params: { input: state.input } }; // the one value
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(values: Readonly<Record<string, string | null>>): IqueryShareState | null {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
