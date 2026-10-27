// ============================================================================
// src/lib/tools/text-encryption/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of local text encryption (posture "derived"):
// a link carries the encrypted string and nothing else. The state this spec
// encodes holds only that string, so the passphrase and the plaintext cannot
// reach a link through it; the central harness (src/lib/share/cases/
// text-encryption.ts) proves it for every round-trip vector, and the render
// check proves the page hands the button nothing else.
//
// Arrival: only a well-formed string of the tool's own format is accepted; the
// page then opens in Decrypt mode with the string filled in and decrypts only
// when the reader types the passphrase and presses Decrypt. Anything else is
// ignored, and the address loses it either way (resolveArrival).
// ============================================================================

import { shareableCiphertext } from "./compute"; // the only form a link may carry
import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the encrypted string alone. */
export interface TextEncryptionShareState {
  /** An encrypted string (Encrypt's output, or what Decrypt mode holds). */
  encrypted: string;
}

/** The spec. */
export const TEXT_ENCRYPTION_SHARE: ShareSpec<TextEncryptionShareState> = Object.freeze({
  tool: "text-encryption", // the slug
  posture: "derived", // never the passphrase, never the plaintext
  carriesKey: "share.carries", // tools.text-encryption.share.carries
  names: ["input"], // the string travels as #input=
  /** The string, compact, when it is one; otherwise nothing to share. */
  encode(state: TextEncryptionShareState) {
    const c = shareableCiphertext(state.encrypted); // parsed, white space removed
    return c === null ? ({ ok: false, reason: "empty" } as const) : ({ ok: true, params: { input: c } } as const); // the one value
  },
  /** Accepted only as a well-formed string of this tool's format. */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    const c = v ? shareableCiphertext(v) : null; // the same parser as Decrypt mode
    return c === null ? null : { encrypted: c }; // the string, or ignored
  },
});
