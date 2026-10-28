// ============================================================================
// src/lib/tools/icontrol-rest-stats-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iControl REST stats decoder (posture
// "input"): a link carries the stats response as pasted. A stats response
// carries counters and the objects they belong to, never a credential:
// iControl REST sends the token in the X-F5-Auth-Token header, not in a
// response body (F5's AS3 guide, "Authentication and Authorization", read
// 2026-10-27). A response longer than the bound gets no link, and the popover
// says how long it is.
//
// Arrival: the JSON fills the box as a paste would, and the page flattens it.
// Any non-empty text is accepted, exactly as a paste is: text the engine
// cannot read shows the page's own error message.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box. */
export interface IcontrolStatsShareState {
  /** The text as typed or pasted. */
  input: string;
}

/** The spec. */
export const ICONTROL_STATS_SHARE: ShareSpec<IcontrolStatsShareState> = Object.freeze({
  tool: "icontrol-rest-stats-decoder", // the slug
  posture: "input", // the text as typed
  carriesKey: "share.carries", // tools.icontrol-rest-stats-decoder.share.carries
  names: ["input"], // #input=
  /** The text, when it holds something. */
  encode(s: IcontrolStatsShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): IcontrolStatsShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
