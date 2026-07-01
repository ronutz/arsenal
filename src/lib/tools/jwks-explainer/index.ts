// ============================================================================
// src/lib/tools/jwks-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING JWKS EXPLAINER - a self-contained {manifest, run, vectors}
// triple. Parse a JSON Web Key Set, explain every key, flag private material,
// and match a JWT to its key by kid. It completes the JWT and OIDC verification
// story already on the site, and it never fetches a jwks_uri: it only reads
// what you paste. Bounded, offline, no cryptography performed.
// ============================================================================

import { parseJwks, type JwksResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, PARSE_VECTORS, MATCH_VECTORS } from "./golden-vectors";

export { parseJwks, explainKey, matchJwtToJwks, parseJwtHeader, rsaModulusBits, run, KTY_INFO, CRV_BITS, ALG_INFO } from "./compute";
export type { JwksResult, KeyExplanation, MatchResult, JwtHeaderResult, KtyInfo, AlgInfo } from "./compute";
export { GOLDEN_VECTOR_SET_ID, PARSE_VECTORS, MATCH_VECTORS, verifyVectors } from "./golden-vectors";
export type { ParseVector, MatchVector } from "./golden-vectors";

/** The D-49 declarative manifest for the jwks-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identity & tokens",
  toolSlug: "jwks-explainer",
  canonicalAliases: ["jwks", "json-web-key-set", "jwk-explainer", "jwks-key-matcher"],
  inputDetectors: [
    { kind: "regex", pattern: "\"keys\"\\s*:\\s*\\[", priority: 6, example: '{ "keys": [ ... ] }' },
    { kind: "regex", pattern: "\"kty\"\\s*:\\s*\"(RSA|EC|OKP|oct)\"", priority: 5, example: '{ "kty": "RSA", ... }' },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse", "no-network"],
  shareSafetyDefault: "ephemeral", // a pasted JWKS may contain private key material

  // -- Teaching & provenance --
  learnLinks: ["learn/jwks-and-key-rotation", "learn/jwk-key-types", "learn/verifying-a-jwt-with-jwks", "learn/jwk-parameters-and-thumbprints", "learn/jwt-algorithm-confusion"],
  sources: [
    {
      id: "rfc7517",
      label: "RFC 7517: JSON Web Key (JWK)",
      type: "rfc",
      url: "https://datatracker.ietf.org/doc/html/rfc7517",
      access_date: "2026-06-29",
      scope: "the JWK and JWK Set formats and their parameters",
      status: "active",
    },
    {
      id: "rfc7518",
      label: "RFC 7518: JSON Web Algorithms (JWA)",
      type: "rfc",
      url: "https://datatracker.ietf.org/doc/html/rfc7518",
      access_date: "2026-06-29",
      scope: "the key-type parameters and the signature and encryption algorithms",
      status: "active",
    },
    {
      id: "rfc8037",
      label: "RFC 8037: CFRG Curves for JOSE (OKP, EdDSA)",
      type: "rfc",
      url: "https://datatracker.ietf.org/doc/html/rfc8037",
      access_date: "2026-06-29",
      scope: "the OKP key type and EdDSA",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = [...PARSE_VECTORS, ...MATCH_VECTORS];

export type ToolRunResult = JwksResult;
