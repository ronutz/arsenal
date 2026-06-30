// ============================================================================
// src/lib/tools/oidc/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING OIDC MODULE - a self-contained {manifest, run, vectors} triple,
// mirroring the jwt / cipher reference modules. Catalogue rank 3 (Identity &
// tokens), with direct F5 APM federation relevance: APM is frequently an OIDC
// relying party or provider, and reading an ID token or an IdP's discovery
// document by hand is a routine troubleshooting step.
//
// The decoder reuses the JWT module's decodeJwt for the ID token path rather
// than reimplementing JWS parsing, then layers OIDC Core semantics on top. It
// also reads a .well-known/openid-configuration document. It NEVER fetches the
// jwks_uri or any endpoint, NEVER verifies a signature, and is clock-independent.
//
// shareSafetyDefault: "fragment" - an ID token is a credential carrying PII
// claims, so it is kept out of the query string, server logs, and the Referer
// header.
// ============================================================================

import { analyzeOidc, type OidcReport } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  OIDC_GOLDEN_VECTORS,
  OIDC_REJECT_VECTORS,
} from "./golden-vectors";

// Re-export the compute surface + types at the module boundary.
export { analyzeOidc, OidcParseError } from "./compute";
export { REGISTRY_SNAPSHOT } from "./registry-data";
export type {
  OidcReport,
  OidcReason,
  OidcClaimEntry,
  OidcCoreClaims,
  AlgClass,
  IdTokenReport,
  DiscoveryEndpoint,
  DiscoveryCapability,
  DiscoveryMetadata,
  DiscoveryReport,
  OidcParseErrorCode,
} from "./compute";
export type { ClaimCategory } from "./registry-data";
export {
  GOLDEN_VECTOR_SET_ID,
  OIDC_GOLDEN_VECTORS,
  OIDC_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { OidcGoldenVector, OidcRejectVector } from "./golden-vectors";

/** The D-49 declarative manifest for the oidc tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identity & tokens",
  toolSlug: "oidc",
  canonicalAliases: [
    "openid-connect",
    "oidc-decoder",
    "id-token-decoder",
    "openid-configuration",
    "well-known-openid",
  ],
  inputDetectors: [
    {
      // An OIDC discovery document: a unique discovery field name appearing in
      // the JSON text. Anchored on the quoted key, linear, ReDoS-safe.
      kind: "regex",
      pattern: '"(?:authorization_endpoint|id_token_signing_alg_values_supported|jwks_uri)"',
      priority: 8,
      example: '{"issuer":"https://idp.example.com","authorization_endpoint":"..."}',
    },
    {
      // A compact JWS (the ID token shape). Lower priority than the dedicated JWT
      // tool, since a bare JWT is that tool's domain; this catches OIDC context.
      kind: "regex",
      pattern: "eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.",
      priority: 4,
      example: "eyJhbGciOiJSUzI1Ni... .eyJpc3MiOiJodHRwczov... .signature",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // local decode + rule evaluation; never calls jwks_uri
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // anchored, linear detectors + decoder
  shareSafetyDefault: "fragment", // an ID token is a credential carrying PII

  // -- Teaching & provenance --
  learnLinks: [
    "learn/oidc-overview",
    "learn/id-token-claims",
    "learn/oidc-vs-oauth",
    "learn/oidc-discovery",
  ],
  sources: [
    {
      id: "oidc-core",
      label: "OpenID Connect Core 1.0",
      type: "spec",
      url: "https://openid.net/specs/openid-connect-core-1_0.html",
      access_date: "2026-06-29",
      scope: "ID token claims, the auth flows, nonce / aud / azp, at_hash / c_hash",
      status: "active",
    },
    {
      id: "oidc-discovery",
      label: "OpenID Connect Discovery 1.0",
      type: "spec",
      url: "https://openid.net/specs/openid-connect-discovery-1_0.html",
      access_date: "2026-06-29",
      scope: "the .well-known/openid-configuration document fields and requirements",
      status: "active",
    },
    {
      id: "rfc6749",
      label: "RFC 6749 - The OAuth 2.0 Authorization Framework",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc6749",
      access_date: "2026-06-29",
      scope: "the OAuth 2.0 layer OIDC builds on: scopes, grants, the token endpoint",
      status: "active",
    },
    {
      id: "rfc7519",
      label: "RFC 7519 - JSON Web Token (JWT)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7519",
      access_date: "2026-06-29",
      scope: "the JWT container an ID token uses: registered claims, NumericDate",
      status: "active",
    },
    {
      id: "rfc8176",
      label: "RFC 8176 - Authentication Method Reference Values",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8176",
      access_date: "2026-06-29",
      scope: "the amr values (pwd, otp, mfa, hwk, ...) carried in an ID token",
      status: "active",
    },
    {
      id: "rfc7636",
      label: "RFC 7636 - Proof Key for Code Exchange (PKCE)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7636",
      access_date: "2026-06-29",
      scope: "PKCE and the S256 code challenge method advertised in discovery",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Deterministic decode only; throws an
 * OidcParseError on empty input, malformed JSON, non-OIDC JSON, or input that is
 * not a valid JWT (the UI catches and localizes it).
 * @param input an ID token (compact JWS) or a discovery JSON document
 * @returns the decoded OIDC report
 */
export function run(input: string): OidcReport {
  return analyzeOidc(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = OIDC_GOLDEN_VECTORS;
export const rejectVectors = OIDC_REJECT_VECTORS;
