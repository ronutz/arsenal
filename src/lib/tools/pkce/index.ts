// ============================================================================
// src/lib/tools/pkce/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING PKCE MODULE - a self-contained {manifest, run, vectors} triple.
//
// run() is async (Web Crypto SHA-256) but single-input (a code_verifier), so it
// fits the standard contract. The verifier is exchanged for tokens, so it is a
// secret: executionClass includes sensitiveArtifact and shareSafetyDefault is
// "fragment". The inputDetector is a real regex - a code_verifier has a
// distinctive shape (43-128 unreserved characters), unlike the hash/hmac inputs.
// ============================================================================

import { computeChallenge, type PkceResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  PKCE_GOLDEN_VECTORS,
  PKCE_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  PKCE_GOLDEN_VECTORS,
  PKCE_REJECT_VECTORS,
} from "./golden-vectors";
export { generateVerifier, PKCE_MIN_LENGTH, PKCE_MAX_LENGTH } from "./compute";
export type { PkceResult } from "./compute";

/** The D-49 declarative manifest for the PKCE tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identity & Tokens",
  toolSlug: "pkce",
  canonicalAliases: ["code-verifier", "code-challenge", "oauth-pkce", "s256"],
  inputDetectors: [
    {
      // A code_verifier is 43-128 unreserved characters (RFC 7636 4.1).
      kind: "regex",
      pattern: "^[A-Za-z0-9._~-]{43,128}$",
      priority: 5,
      example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly", "sensitiveArtifact"], // the code_verifier is a secret
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["secret-redaction"],
  shareSafetyDefault: "fragment", // keep the verifier out of indexable URLs

  // -- Teaching & provenance --
  learnLinks: ["learn/pkce"],
  sources: [
    {
      id: "rfc7636",
      label: "RFC 7636 - Proof Key for Code Exchange (PKCE)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7636",
      access_date: "2026-06-26",
      scope: "verifier, challenge, and S256 derivation",
      status: "active",
    },
    {
      id: "rfc6749",
      label: "RFC 6749 - The OAuth 2.0 Authorization Framework",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc6749",
      access_date: "2026-06-26",
      scope: "the authorization-code flow PKCE protects",
      status: "active",
    },
    {
      id: "rfc9700",
      label: "RFC 9700 - Best Current Practice for OAuth 2.0 Security",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc9700",
      access_date: "2026-06-26",
      scope: "PKCE required for authorization-code clients",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. ASYNC, single-input: validates the
 * code_verifier and derives its S256 and plain code_challenges.
 * @param codeVerifier the PKCE code_verifier
 */
export async function run(codeVerifier: string): Promise<PkceResult> {
  return computeChallenge(codeVerifier);
}

export const goldenVectors = PKCE_GOLDEN_VECTORS;
export const rejectVectors = PKCE_REJECT_VECTORS;
