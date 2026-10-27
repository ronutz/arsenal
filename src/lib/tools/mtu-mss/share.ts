// ============================================================================
// src/lib/tools/mtu-mss/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the MTU / MSS calculator (posture "input"): a
// link carries the one input line as typed ("1500 vxlan vlan"), a link MTU
// and stack tokens, which name no host and hold nothing secret.
//
// Arrival: the line fills the box as a paste would, and the page computes.
// Any non-empty line is accepted, exactly as a paste is: a line the engine
// cannot read shows the page's own error message, as it would when pasted.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the input line. */
export interface MtuMssShareState {
  /** The line as typed. */
  input: string;
}

/** The spec. */
export const MTU_MSS_SHARE: ShareSpec<MtuMssShareState> = Object.freeze({
  tool: "mtu-mss", // the slug
  posture: "input", // the line as typed
  carriesKey: "share.carries", // tools.mtu-mss.share.carries
  names: ["input"], // #input=
  /** The line, when it holds something. */
  encode(s: MtuMssShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty line: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): MtuMssShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the line, or nothing
  },
});
