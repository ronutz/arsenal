// ============================================================================
// src/lib/tools/f5-oneconnect-source-mask/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the OneConnect source-mask explainer (posture
// "input"): a link carries the box as typed: a one-connect profile, a mask
// simulation line ("mask 255.255.255.0 ips 10.1.1.5 10.1.2.7 snat
// 192.0.2.10") or "settings". A one-connect profile holds no secret setting
// (F5's tmsh reference, ltm profile one-connect, read 2026-10-27), and the
// manifest names nothing sensitive.
//
// Arrival: the text fills the box as a paste would, and the page explains it.
// Any non-empty text is accepted, exactly as a paste is: text the engine
// cannot read shows the page's own error message.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box. */
export interface OneconnectShareState {
  /** The text as typed or pasted. */
  input: string;
}

/** The spec. */
export const ONECONNECT_SHARE: ShareSpec<OneconnectShareState> = Object.freeze({
  tool: "f5-oneconnect-source-mask", // the slug
  posture: "input", // the text as typed
  carriesKey: "share.carries", // tools.f5-oneconnect-source-mask.share.carries
  names: ["input"], // #input=
  /** The text, when it holds something. */
  encode(s: OneconnectShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): OneconnectShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
