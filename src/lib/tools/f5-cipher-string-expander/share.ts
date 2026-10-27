// ============================================================================
// src/lib/tools/f5-cipher-string-expander/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 cipher-string explainer (posture
// "input"): a link carries the cipher string or rule name as typed. A cipher
// string names suites and keywords; it holds no secret and no host.
//
// Arrival: the string fills the box as a paste would, and the page explains
// it. Any non-empty string is accepted, exactly as a paste is: one the parser
// refuses shows the page's own error, as it would when pasted.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the cipher string. */
export interface F5CipherStringShareState {
  /** The string as typed. */
  input: string;
}

/** The spec. */
export const F5_CIPHER_STRING_SHARE: ShareSpec<F5CipherStringShareState> = Object.freeze({
  tool: "f5-cipher-string-expander", // the slug
  posture: "input", // the string as typed
  carriesKey: "share.carries", // tools.f5-cipher-string-expander.share.carries
  names: ["input"], // #input=
  /** The string, when it holds something. */
  encode(s: F5CipherStringShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty string: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): F5CipherStringShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the string, or nothing
  },
});
