// ============================================================================
// src/lib/tools/cipher/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the cipher suite decoder (posture "input"): a
// link carries the cipher suite as typed (an IANA or OpenSSL name, or a code
// point), public protocol data.
//
// Arrival: this page already reads #input= with usePrefill (the handoff of
// src/lib/handoff.ts), and keeps it exactly as it was: the link IS that
// handoff, so no second arrival hook is added (ROLLOUT.md section 5). Encode
// gives what usePrefill's apply takes, the box's text; decode mirrors what
// readHandoff accepts (any non-empty value), for the central harness.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box. */
export interface CipherShareState {
  /** The cipher suite as typed. */
  input: string;
}

/** The spec. */
export const CIPHER_SHARE: ShareSpec<CipherShareState> = Object.freeze({
  tool: "cipher", // the slug
  posture: "input", // the suite as typed
  carriesKey: "share.carries", // tools.cipher.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The box, when it holds something. */
  encode(s: CipherShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill. */
  decode(v: Readonly<Record<string, string | null>>): CipherShareState | null {
    return v.input ? { input: v.input } : null; // the value, or nothing
  },
});
