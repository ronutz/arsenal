// ============================================================================
// src/lib/tools/oidc/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden + reject vectors for the OIDC decoder, covering both modes (ID token
// and discovery document) and the rule-based assessment. verifyVectors() runs
// the set and returns a pass/fail summary; the build and the dev-time check call
// it. All inputs are self-contained and deterministic.
// ============================================================================

import { analyzeOidc, OidcParseError, type OidcParseErrorCode, type AlgClass } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "oidc-golden-v1";

interface GoldenExpect {
  mode: "id-token" | "discovery";
  alg?: string;
  algClass?: AlgClass;
  signed?: boolean;
  iss?: string;
  sub?: string;
  audienceCount?: number;
  nonce?: string;
  amrLabels?: string[];
  claimCount?: number;
  discIssuer?: string;
  endpointCount?: number;
  capabilityCount?: number;
  signingAlgs?: string[];
  requiredReasons: string[];
  forbiddenReasons?: string[];
}

export interface OidcGoldenVector {
  id: string;
  description: string;
  input: string;
  expect: GoldenExpect;
}

export interface OidcRejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: OidcParseErrorCode;
}

// btoa is a global in modern Node (16+) and browsers; the JSON here is ASCII.
function b64u(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function jwt(header: unknown, payload: unknown, sig = "sig"): string {
  return `${b64u(header)}.${b64u(payload)}.${sig}`;
}

const ISS = "https://idp.example.com";

export const OIDC_GOLDEN_VECTORS: OidcGoldenVector[] = [
  {
    id: "id-token-rs256-full",
    description: "RS256 ID token with core, profile, and email claims",
    input: jwt(
      { alg: "RS256", typ: "JWT", kid: "k1" },
      {
        iss: ISS,
        sub: "248289761001",
        aud: "client-app",
        exp: 1900000000,
        iat: 1899996400,
        auth_time: 1899996000,
        nonce: "n-0S6_WzA2Mj",
        acr: "urn:mace:incommon:iap:silver",
        amr: ["pwd", "mfa"],
        email: "jane@example.com",
        email_verified: true,
        name: "Jane Doe",
      },
    ),
    expect: {
      mode: "id-token",
      alg: "RS256",
      algClass: "asymmetric",
      signed: true,
      iss: ISS,
      sub: "248289761001",
      audienceCount: 1,
      nonce: "n-0S6_WzA2Mj",
      amrLabels: ["password", "multi-factor"],
      claimCount: 12,
      requiredReasons: ["SIGNED_ASYMMETRIC"],
      forbiddenReasons: ["ALG_NONE", "NO_NONCE", "MISSING_REQUIRED_CLAIM", "MULTI_AUD_NO_AZP"],
    },
  },
  {
    id: "id-token-alg-none",
    description: "Unsecured ID token (alg none) -> ALG_NONE",
    input: jwt({ alg: "none", typ: "JWT" }, { iss: ISS, sub: "s", aud: "a", exp: 1900000000, iat: 1899996400 }, ""),
    expect: { mode: "id-token", alg: "none", algClass: "none", signed: false, requiredReasons: ["ALG_NONE", "NO_NONCE"], forbiddenReasons: ["SIGNED_ASYMMETRIC"] },
  },
  {
    id: "id-token-symmetric",
    description: "HS256 ID token -> ALG_SYMMETRIC (unusual for a public IdP)",
    input: jwt({ alg: "HS256", typ: "JWT" }, { iss: ISS, sub: "s", aud: "a", exp: 1900000000, iat: 1899996400, nonce: "n" }),
    expect: { mode: "id-token", alg: "HS256", algClass: "symmetric", signed: true, requiredReasons: ["ALG_SYMMETRIC"], forbiddenReasons: ["SIGNED_ASYMMETRIC", "ALG_NONE"] },
  },
  {
    id: "id-token-missing-claims",
    description: "ID token missing sub/aud/exp/iat -> MISSING_REQUIRED_CLAIM",
    input: jwt({ alg: "RS256" }, { iss: ISS }),
    expect: { mode: "id-token", requiredReasons: ["MISSING_REQUIRED_CLAIM", "NO_NONCE"] },
  },
  {
    id: "id-token-multi-aud-no-azp",
    description: "Multiple audiences without azp -> MULTI_AUD_NO_AZP",
    input: jwt({ alg: "RS256" }, { iss: ISS, sub: "s", aud: ["a", "b"], exp: 1900000000, iat: 1899996400, nonce: "n" }),
    expect: { mode: "id-token", audienceCount: 2, requiredReasons: ["MULTI_AUD_NO_AZP"] },
  },
  {
    id: "id-token-multi-aud-with-azp",
    description: "Multiple audiences WITH azp -> no MULTI_AUD_NO_AZP",
    input: jwt({ alg: "RS256" }, { iss: ISS, sub: "s", aud: ["a", "b"], azp: "a", exp: 1900000000, iat: 1899996400, nonce: "n" }),
    expect: { mode: "id-token", audienceCount: 2, requiredReasons: ["SIGNED_ASYMMETRIC"], forbiddenReasons: ["MULTI_AUD_NO_AZP"] },
  },
  {
    id: "discovery-clean",
    description: "Discovery doc with all required fields + PKCE S256, no weak algs",
    input: JSON.stringify({
      issuer: ISS,
      authorization_endpoint: ISS + "/authorize",
      token_endpoint: ISS + "/token",
      userinfo_endpoint: ISS + "/userinfo",
      jwks_uri: ISS + "/jwks",
      response_types_supported: ["code", "id_token", "code id_token"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256", "ES256"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["openid", "profile", "email"],
    }),
    expect: {
      mode: "discovery",
      discIssuer: ISS,
      endpointCount: 4,
      signingAlgs: ["RS256", "ES256"],
      requiredReasons: [],
      forbiddenReasons: ["DISCOVERY_ALG_NONE", "DISCOVERY_NO_PKCE", "DISCOVERY_MISSING_FIELD", "DISCOVERY_NO_PKCE_S256"],
    },
  },
  {
    id: "discovery-alg-none",
    description: "Discovery advertises the none signing alg -> DISCOVERY_ALG_NONE",
    input: JSON.stringify({
      issuer: ISS,
      authorization_endpoint: ISS + "/authorize",
      jwks_uri: ISS + "/jwks",
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256", "none"],
      code_challenge_methods_supported: ["S256"],
    }),
    expect: { mode: "discovery", signingAlgs: ["RS256", "none"], requiredReasons: ["DISCOVERY_ALG_NONE"] },
  },
  {
    id: "discovery-no-pkce",
    description: "Discovery without code_challenge_methods_supported -> DISCOVERY_NO_PKCE",
    input: JSON.stringify({
      issuer: ISS,
      authorization_endpoint: ISS + "/authorize",
      jwks_uri: ISS + "/jwks",
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
    }),
    expect: { mode: "discovery", requiredReasons: ["DISCOVERY_NO_PKCE"], forbiddenReasons: ["DISCOVERY_ALG_NONE"] },
  },
  {
    id: "discovery-missing-fields",
    description: "Discovery missing required fields -> DISCOVERY_MISSING_FIELD",
    input: JSON.stringify({
      issuer: ISS,
      authorization_endpoint: ISS + "/authorize",
      code_challenge_methods_supported: ["S256"],
    }),
    expect: { mode: "discovery", requiredReasons: ["DISCOVERY_MISSING_FIELD"] },
  },
];

export const OIDC_REJECT_VECTORS: OidcRejectVector[] = [
  { id: "empty", description: "Empty input", input: "   ", expectCode: "empty" },
  { id: "malformed-json", description: "Starts with { but is not valid JSON", input: '{ "issuer": ', expectCode: "malformed-json" },
  { id: "json-not-oidc", description: "Valid JSON object but not a discovery document", input: '{"hello":"world"}', expectCode: "json-not-oidc" },
  { id: "json-array", description: "A JSON array is not an OIDC document", input: "[1,2,3]", expectCode: "not-jwt" },
  { id: "not-jwt", description: "Plain text, not a JWT", input: "this is not a token", expectCode: "not-jwt" },
  { id: "jwt-bad-header", description: "JWT whose header segment is not base64url JSON", input: "!!!." + b64u({ iss: ISS }) + ".sig", expectCode: "jwt-header" },
  { id: "jwt-bad-payload", description: "JWT whose payload segment is not base64url JSON", input: b64u({ alg: "RS256" }) + ".@@@.sig", expectCode: "jwt-payload" },
];

/** Run all vectors. Returns a pass/fail summary with human-readable failures. */
export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of OIDC_GOLDEN_VECTORS) {
    try {
      const r = analyzeOidc(v.input);
      const e = v.expect;
      const codes = new Set(r.reasons.map((x) => x.code));
      const errs: string[] = [];
      const eq = (name: string, got: unknown, want: unknown) => {
        if (want !== undefined && got !== want) errs.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
      };
      eq("mode", r.mode, e.mode);
      if (r.mode === "id-token") {
        const t = r.idToken;
        eq("alg", t?.alg, e.alg);
        eq("algClass", t?.algClass, e.algClass);
        eq("signed", t?.signed, e.signed);
        eq("iss", t?.core.iss, e.iss);
        eq("sub", t?.core.sub, e.sub);
        eq("nonce", t?.core.nonce, e.nonce);
        if (e.audienceCount !== undefined) eq("audienceCount", t?.core.aud?.length, e.audienceCount);
        if (e.claimCount !== undefined) eq("claimCount", t?.claims.length, e.claimCount);
        if (e.amrLabels !== undefined) {
          const got = JSON.stringify(t?.core.amrLabels ?? []);
          if (got !== JSON.stringify(e.amrLabels)) errs.push(`amrLabels: got ${got} want ${JSON.stringify(e.amrLabels)}`);
        }
      } else {
        const d = r.discovery;
        eq("discIssuer", d?.issuer, e.discIssuer);
        if (e.endpointCount !== undefined) eq("endpointCount", d?.endpoints.length, e.endpointCount);
        if (e.capabilityCount !== undefined) eq("capabilityCount", d?.capabilities.length, e.capabilityCount);
        if (e.signingAlgs !== undefined) {
          const got = JSON.stringify(d?.signingAlgs ?? []);
          if (got !== JSON.stringify(e.signingAlgs)) errs.push(`signingAlgs: got ${got} want ${JSON.stringify(e.signingAlgs)}`);
        }
      }
      for (const code of e.requiredReasons) if (!codes.has(code)) errs.push(`missing reason ${code}`);
      for (const code of e.forbiddenReasons ?? []) if (codes.has(code)) errs.push(`unexpected reason ${code}`);
      if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
      else passed++;
    } catch (err) {
      failures.push(`[${v.id}] threw ${err instanceof OidcParseError ? err.code : String(err)}`);
    }
  }

  for (const v of OIDC_REJECT_VECTORS) {
    try {
      analyzeOidc(v.input);
      failures.push(`[${v.id}] expected reject ${v.expectCode} but parsed successfully`);
    } catch (err) {
      if (err instanceof OidcParseError && err.code === v.expectCode) passed++;
      else failures.push(`[${v.id}] got ${err instanceof OidcParseError ? err.code : String(err)} want ${v.expectCode}`);
    }
  }

  return { passed, failed: failures.length, failures };
}
