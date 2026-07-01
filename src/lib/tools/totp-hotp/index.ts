// ============================================================================
// src/lib/tools/totp-hotp/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING OTP MODULE - a {manifest, run, vectors} triple for the
// TOTP (RFC 6238) / HOTP (RFC 4226) tool.
//
// Like the HMAC tool, run() is async (Web Crypto) and takes an OBJECT, because
// an OTP needs a secret plus parameters, not a single pasted string. The secret
// is a credential, so executionClass carries sensitiveArtifact and the default
// share-safety is "fragment" (a permalink must keep the secret out of any
// indexable path). inputDetector is a low-priority heuristic: an OTP cannot be
// routed from one pasted token because the parameters are separate.
// ============================================================================

import { computeOtp, OTP_ALGORITHMS, OTP_MODES, SECRET_ENCODINGS, type OtpInput, type OtpResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  TOTP_HOTP_GOLDEN_VECTORS,
  TOTP_HOTP_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  TOTP_HOTP_GOLDEN_VECTORS,
  TOTP_HOTP_REJECT_VECTORS,
} from "./golden-vectors";
export { OTP_ALGORITHMS, OTP_MODES, SECRET_ENCODINGS } from "./compute";
export type { OtpInput, OtpResult, OtpAlgorithm, OtpMode, SecretEncoding } from "./compute";

/** The D-49 declarative manifest for the TOTP / HOTP tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identity & tokens",
  toolSlug: "totp-hotp",
  canonicalAliases: [
    "totp",
    "hotp",
    "otp",
    "one-time-password",
    "2fa-code",
    "authenticator-code",
    "fortitoken",
    "google-authenticator",
  ],
  inputDetectors: [
    {
      // An OTP needs a secret + parameters, so it cannot be routed from one
      // pasted string. A low-priority heuristic carries the schema's example.
      kind: "heuristic",
      priority: 1,
      example: "JBSWY3DPEHPK3PXP",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly", "sensitiveArtifact"], // the secret is a credential
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["secret-redaction"],
  shareSafetyDefault: "fragment", // keep the secret out of indexable URLs

  // -- Teaching & provenance --
  learnLinks: ["learn/totp-and-hotp", "learn/validating-totp-codes", "learn/totp-provisioning-uris-and-qr"],
  sources: [
    {
      id: "rfc6238",
      label: "RFC 6238 - TOTP: Time-Based One-Time Password Algorithm",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc6238",
      access_date: "2026-06-30",
      scope: "the TOTP construction and its Appendix B test vectors",
      status: "active",
    },
    {
      id: "rfc4226",
      label: "RFC 4226 - HOTP: An HMAC-Based One-Time Password Algorithm",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4226",
      access_date: "2026-06-30",
      scope: "the HOTP construction, dynamic truncation, and Appendix D vectors",
      status: "active",
    },
    {
      id: "rfc4648",
      label: "RFC 4648 - The Base16, Base32, and Base64 Data Encodings",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4648",
      access_date: "2026-06-30",
      scope: "Base32 decoding of the shared secret",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. ASYNC and object-input: computes the
 * HOTP (counter-based) or TOTP (time-based) code for the given secret and
 * parameters, with the intermediate values the UI surfaces.
 */
export async function run(input: OtpInput): Promise<OtpResult> {
  return computeOtp(input);
}

export const goldenVectors = TOTP_HOTP_GOLDEN_VECTORS;
export const rejectVectors = TOTP_HOTP_REJECT_VECTORS;
