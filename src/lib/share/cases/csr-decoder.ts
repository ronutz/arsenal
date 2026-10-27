// ============================================================================
// src/lib/share/cases/csr-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the CSR decoder: the request goes as pasted, as the #input=
// handoff usePrefill already reads; no link when the box also holds a
// private key or the request carries a challenge password.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CSR_DECODER_SHARE, type CsrDecoderShareInput, type CsrDecoderShareState } from "../../tools/csr-decoder/share"; // the spec

/** An Ed25519 request for ed25519.example.com (the tool's golden vector v4). */
const ED25519 = "-----BEGIN CERTIFICATE REQUEST-----\nMIGdMFECAQAwHjEcMBoGA1UEAwwTZWQyNTUxOS5leGFtcGxlLmNvbTAqMAUGAytl\ncAMhAAYWsf+ml3oKhyD/YWW3gdjTrWwyKiJYq9UGMbnKTtfpoAAwBQYDK2VwA0EA\n4TJjgztrU5nxn9CfBC/xAnyTU9RluGe47XDCw8Lfd4r9BsWSwBZGb40EyJqIQW9i\n87/BOkqS4qXAScW8hlvZAg==\n-----END CERTIFICATE REQUEST-----"; // verbatim

/** The cases. */
export const CSR_DECODER_SHARE_CASES = defineShareCases<CsrDecoderShareInput, CsrDecoderShareState>({
  spec: CSR_DECODER_SHARE, // the spec
  accept: [
    { id: "ed25519", state: { input: ED25519, challengePassword: false }, params: { input: ED25519 }, restored: { input: ED25519 } }, // PEM with "+", "/" and "="
    { id: "bare-base64", state: { input: ED25519.split("\n").slice(1, -1).join("") , challengePassword: false }, params: { input: ED25519.split("\n").slice(1, -1).join("") }, restored: { input: ED25519.split("\n").slice(1, -1).join("") } }, // the base64 body alone
  ],
  empty: [
    { id: "nothing", state: { input: "", challengePassword: false } }, // no paste
  ],
  blocked: [
    { id: "key-with-request", state: { input: `${ED25519}\n-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----`, challengePassword: false }, code: "private-key" }, // a generator's two files pasted together
    { id: "challenge-password", state: { input: ED25519, challengePassword: true }, code: "challenge-password" }, // the decoded request carries a password
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
