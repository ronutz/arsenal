// ============================================================================
// src/lib/tools/ja4-fingerprint-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the JA4 / JA3 fingerprint decoder (posture
// "input"): a link carries the fingerprint as pasted (a JA4, a raw JA4_r, a
// JA3 string or a JA3 hash), after the "#", and nothing else. The manifest
// calls a fingerprint a non-sensitive identifier (shareSafetyDefault "param").
//
// Arrival (useShareArrival in Ja4FingerprintDecoderTool): the text fills the
// box as a paste would and the page analyses it. Any non-blank text is accepted
// here; the page refuses a malformed fingerprint with its own message.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the box as pasted. */
export interface Ja4ShareState {
  /** The fingerprint text. */
  input: string;
}

/** The spec. */
export const JA4_FINGERPRINT_SHARE: ShareSpec<Ja4ShareState> = Object.freeze({
  tool: "ja4-fingerprint-decoder", // the slug
  posture: "input", // the fingerprint as pasted, with the standard warning
  carriesKey: "share.carries", // tools.ja4-fingerprint-decoder.share.carries
  names: ["input"], // #input=
  /** The text as pasted, or nothing while the box is blank. */
  encode(state: Ja4ShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value
  },
  /** Any non-blank text: the page reads it as a paste (and refuses it there, with the reason, if it is malformed). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
