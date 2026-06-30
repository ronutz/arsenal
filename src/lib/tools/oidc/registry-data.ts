// ============================================================================
// src/lib/tools/oidc/registry-data.ts
// ----------------------------------------------------------------------------
// REFERENCE DATA for the OIDC decoder: the standard OpenID Connect claim names
// grouped by category, the claims an ID token is required to carry, the standard
// discovery-document (.well-known/openid-configuration) fields, and the common
// amr (authentication method reference) values - all as short, stable technical
// tokens. User-facing explanation text is localized in the message pack via the
// stable codes the engine emits; this file only categorizes and labels.
//
// Sources: OpenID Connect Core 1.0 (sections 2, 3.1.3.6, 3.3.2.11, 5.1),
// OpenID Connect Discovery 1.0, RFC 6749 (OAuth 2.0), RFC 8176 (amr values).
// ============================================================================

export const REGISTRY_SNAPSHOT = "oidc-reference-2026-06-29";

// -- Claim categories ---------------------------------------------------------
export type ClaimCategory =
  | "core"
  | "binding"
  | "profile"
  | "email"
  | "address"
  | "phone"
  | "oauth"
  | "other";

/**
 * Standard OIDC / JWT claim name -> category. Drives how the decoder groups the
 * claims it shows. "core" = the ID token claims of OIDC Core section 2; "binding"
 * = the access-token / code hash claims; the rest are standard profile and OAuth
 * claims. Unknown claims fall through to "other".
 */
export const CLAIM_CATEGORY: Record<string, ClaimCategory> = {
  // Core ID token claims (OIDC Core 2)
  iss: "core",
  sub: "core",
  aud: "core",
  exp: "core",
  iat: "core",
  auth_time: "core",
  nonce: "core",
  acr: "core",
  amr: "core",
  azp: "core",
  nbf: "core",
  // Token / code binding hashes (OIDC Core 3.1.3.6, 3.3.2.11; FAPI s_hash)
  at_hash: "binding",
  c_hash: "binding",
  s_hash: "binding",
  // Standard profile claims (OIDC Core 5.1)
  name: "profile",
  given_name: "profile",
  family_name: "profile",
  middle_name: "profile",
  nickname: "profile",
  preferred_username: "profile",
  profile: "profile",
  picture: "profile",
  website: "profile",
  gender: "profile",
  birthdate: "profile",
  zoneinfo: "profile",
  locale: "profile",
  updated_at: "profile",
  email: "email",
  email_verified: "email",
  address: "address",
  phone_number: "phone",
  phone_number_verified: "phone",
  // Common OAuth 2.0 / session extras
  scope: "oauth",
  scp: "oauth",
  client_id: "oauth",
  cid: "oauth",
  jti: "oauth",
  sid: "oauth",
  typ: "oauth",
  token_use: "oauth",
};

/** Look up a claim's category, defaulting to "other" for unknown claims. */
export function claimCategory(name: string): ClaimCategory {
  return CLAIM_CATEGORY[name] ?? "other";
}

/** The claims an OIDC ID token is required to contain (OIDC Core section 2). */
export const REQUIRED_ID_TOKEN_CLAIMS = ["iss", "sub", "aud", "exp", "iat"] as const;

// -- Signing algorithm posture ------------------------------------------------
/**
 * JWS "alg" header values that are asymmetric, which is what an ID token from a
 * public IdP should use (the SP verifies with the IdP public key from the JWKS).
 */
export const ASYMMETRIC_ALGS = new Set([
  "RS256", "RS384", "RS512",
  "ES256", "ES384", "ES512", "ES256K",
  "PS256", "PS384", "PS512",
  "EdDSA",
]);
/** Symmetric (HMAC) JWS algs: valid but unusual for a public-IdP ID token. */
export const SYMMETRIC_ALGS = new Set(["HS256", "HS384", "HS512"]);

// -- amr (authentication method reference) values, RFC 8176 ------------------
/** Common amr values -> short label. Unknown values are shown as-is. */
export const AMR_VALUES: Record<string, string> = {
  pwd: "password",
  otp: "one-time password",
  mfa: "multi-factor",
  sms: "SMS",
  tel: "telephone",
  hwk: "hardware key",
  swk: "software key",
  pin: "PIN",
  face: "facial recognition",
  fpt: "fingerprint",
  iris: "iris scan",
  geo: "geolocation",
  kba: "knowledge-based",
  mca: "multi-channel",
  user: "user presence",
  pop: "proof of possession",
  rba: "risk-based",
};

// -- Discovery document fields (OIDC Discovery 1.0) ---------------------------
export type DiscoveryCategory = "metadata" | "endpoint" | "capability";

/** Standard .well-known/openid-configuration field -> category. */
export const DISCOVERY_FIELDS: Record<string, DiscoveryCategory> = {
  issuer: "metadata",
  jwks_uri: "endpoint",
  authorization_endpoint: "endpoint",
  token_endpoint: "endpoint",
  userinfo_endpoint: "endpoint",
  registration_endpoint: "endpoint",
  end_session_endpoint: "endpoint",
  introspection_endpoint: "endpoint",
  revocation_endpoint: "endpoint",
  device_authorization_endpoint: "endpoint",
  pushed_authorization_request_endpoint: "endpoint",
  scopes_supported: "capability",
  response_types_supported: "capability",
  response_modes_supported: "capability",
  grant_types_supported: "capability",
  subject_types_supported: "capability",
  id_token_signing_alg_values_supported: "capability",
  userinfo_signing_alg_values_supported: "capability",
  request_object_signing_alg_values_supported: "capability",
  token_endpoint_auth_methods_supported: "capability",
  claims_supported: "capability",
  code_challenge_methods_supported: "capability",
  acr_values_supported: "capability",
  require_pushed_authorization_requests: "capability",
};

/** Fields a discovery document is required to provide (OIDC Discovery 3). */
export const DISCOVERY_REQUIRED = [
  "issuer",
  "authorization_endpoint",
  "jwks_uri",
  "response_types_supported",
  "subject_types_supported",
  "id_token_signing_alg_values_supported",
] as const;

/** Discovery markers used to recognize a config document from arbitrary JSON. */
export const DISCOVERY_MARKERS = [
  "issuer",
  "authorization_endpoint",
  "jwks_uri",
  "id_token_signing_alg_values_supported",
] as const;
