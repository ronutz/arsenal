// ============================================================================
// src/lib/tools/csr-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the CSR decoder (posture "input"): a link
// carries the box as pasted. A certificate signing request is what a
// requester sends to a CA: a subject, a public key and the extensions asked
// for, signed with the private key that stays with the requester.
//
// Two guards, each a "blocked" encoding with its own message:
//   - "private-key": the box also holds a private key (a request and its key
//     pasted together, as some generators print them). Recognised by its PEM
//     boundary, the rule of src/lib/tools/x509/share.ts (RFC 7468).
//   - "challenge-password": the request carries the PKCS #9 challengePassword
//     attribute, which the page shows in clear (a password some CAs use for
//     revocation). The request is signed, so it cannot be shared without it;
//     no link is offered, and the popover says why.
//
// Arrival: this page already reads #input= with usePrefill (the handoff of
// src/lib/handoff.ts), and keeps it exactly as it was: the link IS that
// handoff, so no second arrival hook is added (ROLLOUT.md section 5). Encode
// gives what usePrefill's apply takes, the box's text; decode mirrors what
// readHandoff accepts (any non-empty value), for the central harness.
// ============================================================================

import { PEM_PRIVATE_KEY } from "../x509/share"; // the private-key boundary, one rule for the PKI tools
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** What the page encodes: the box and whether its decoded request holds a challenge password. */
export interface CsrDecoderShareInput {
  /** The box as pasted. */
  input: string;
  /** True when the decoded request carries a challengePassword attribute. */
  challengePassword: boolean;
}

/** What an arrival restores: the box. */
export interface CsrDecoderShareState {
  /** The request as pasted. */
  input: string;
}

/** The spec. */
export const CSR_DECODER_SHARE: ShareSpec<CsrDecoderShareInput, CsrDecoderShareState> = Object.freeze({
  tool: "csr-decoder", // the slug
  posture: "input", // the request as pasted
  carriesKey: "share.carries", // tools.csr-decoder.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The box, unless it holds a private key or the request a challenge password. */
  encode(s: CsrDecoderShareInput): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    if (PEM_PRIVATE_KEY.test(s.input)) return { ok: false, reason: "blocked", code: "private-key" } as const; // never a key in a link
    if (s.challengePassword) return { ok: false, reason: "blocked", code: "challenge-password" } as const; // never a password in a link
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill. */
  decode(v: Readonly<Record<string, string | null>>): CsrDecoderShareState | null {
    return v.input ? { input: v.input } : null; // the value, or nothing
  },
});
