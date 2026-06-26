// ============================================================================
// src/lib/tools/jwt/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING JWT MODULE - a netcore {manifest, run, vectors} triple.
//
// This mirrors the reference cidr module in @ronutz/netcore exactly, so it can
// be promoted into the published engine unchanged (copy the folder into
// netcore/src/tools/jwt, add it to the package exports + registry, cut a minor
// bump). Until then it lives here and is consumed locally by the JWT tool UI.
//
// The manifest is a real D-49 manifest: validateManifest() from @ronutz/netcore
// accepts it (asserted in the build step), the inputDetectors[] regex is what
// would let an omnibox route a pasted token to this tool, and because a JWT is a
// sensitiveArtifact (it carries claims and often secrets) the manifest declares
// shareSafetyDefault: "fragment" - the validator REQUIRES fragment-or-stricter
// for sensitive tools, so a result permalink keeps the token in the URL
// fragment, never transmitted.
// ============================================================================

import { decodeJwt, type DecodedJwt } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  JWT_GOLDEN_VECTORS,
  JWT_REJECT_VECTORS,
} from "./golden-vectors";

// Re-export vector metadata at the module boundary (CI / host wiring reads it).
export {
  GOLDEN_VECTOR_SET_ID,
  JWT_GOLDEN_VECTORS,
  JWT_REJECT_VECTORS,
} from "./golden-vectors";
export type { DecodedJwt, JwtTime, JwtDecodeErrorCode } from "./compute";
export { JwtDecodeError } from "./compute";

/** The D-49 declarative manifest for the JWT tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identity & Tokens",
  toolSlug: "jwt",
  canonicalAliases: ["jwt-decode", "jws", "token-decode"],
  inputDetectors: [
    {
      // Three base64url segments separated by dots; the signature segment may be
      // empty (alg:none). Linear, no nested quantifiers, so it is ReDoS-safe.
      kind: "regex",
      pattern: "^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]*$",
      priority: 10,
      example:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly", "sensitiveArtifact"], // local, but carries secrets/PII
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard", "secret-redaction"],
  shareSafetyDefault: "fragment", // required for sensitiveArtifact

  // -- Teaching & provenance --
  learnLinks: ["learn/jwt-anatomy"],
  sources: [
    {
      id: "rfc7519",
      label: "RFC 7519 - JSON Web Token (JWT)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7519",
      access_date: "2026-06-26",
      scope: "claims set + registered claim names",
      status: "active",
    },
    {
      id: "rfc7515",
      label: "RFC 7515 - JSON Web Signature (JWS)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7515",
      access_date: "2026-06-26",
      scope: "compact serialization + signing input",
      status: "active",
    },
    {
      id: "rfc7518",
      label: "RFC 7518 - JSON Web Algorithms (JWA)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7518",
      access_date: "2026-06-26",
      scope: "alg values (HS256, RS256, ES256, none)",
      status: "active",
    },
    {
      id: "rfc8725",
      label: "RFC 8725 - JWT Best Current Practices",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8725",
      access_date: "2026-06-26",
      scope: "alg confusion + validation guidance",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
  license: { code: "Apache-2.0", content: "CC-BY-4.0" },
});

/**
 * run - the registry-facing entry point. Deterministic decode only; throws a
 * JwtDecodeError on malformed input (the UI catches and localizes it).
 * @param input a compact JWS string
 * @returns the decoded structure
 */
export function run(input: string): DecodedJwt {
  return decodeJwt(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = JWT_GOLDEN_VECTORS;
export const rejectVectors = JWT_REJECT_VECTORS;
