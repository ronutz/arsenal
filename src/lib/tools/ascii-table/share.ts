// ============================================================================
// src/lib/tools/ascii-table/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the ASCII table explorer (posture "input"): a
// link carries the value in the look-up box (a code in any notation, a name
// or a character), the page's main result. The "Text to codes" box below is
// a second, separate tool on the page and is not carried; the popover says so.
//
// Arrival: this page already reads #input= with usePrefill (the handoff the
// Unicode inspector's links use to open a code here), and keeps it exactly
// as it was: the link IS that handoff, so no second arrival hook is added
// (ROLLOUT.md section 5). Encode gives what usePrefill's apply takes, the
// look-up box's text; decode mirrors what readHandoff accepts (any non-empty
// value), for the central harness. A single space is a value here (SP).
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the look-up box. */
export interface AsciiTableShareState {
  /** The look-up box as typed. */
  input: string;
}

/** The spec. */
export const ASCII_TABLE_SHARE: ShareSpec<AsciiTableShareState> = Object.freeze({
  tool: "ascii-table", // the slug
  posture: "input", // the value as typed
  carriesKey: "share.carries", // tools.ascii-table.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The look-up value, when there is one (a space counts: it is SP). */
  encode(s: AsciiTableShareState): ShareEncoding {
    if (s.input === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill. */
  decode(v: Readonly<Record<string, string | null>>): AsciiTableShareState | null {
    return v.input ? { input: v.input } : null; // the value, or nothing
  },
});
