// ============================================================================
// src/lib/tools/oidc/compute.ts
// ----------------------------------------------------------------------------
// THE OIDC DECODER ENGINE. Two modes, auto-detected from the input:
//
//   * ID TOKEN  - a compact JWS (an ID token is a signed JWT). Decoded via the
//     JWT module's decodeJwt (reused, not reimplemented), then interpreted with
//     OIDC Core semantics: the core ID token claims, the standard profile / email
//     / address / phone claims, the access-token and code binding hashes, and a
//     security assessment (required claims, signing posture, nonce, audience).
//
//   * DISCOVERY - a .well-known/openid-configuration JSON document. Parsed and
//     summarized into issuer, endpoints, and capabilities, with a check for the
//     "none" signing algorithm and PKCE S256 support.
//
// The engine NEVER fetches anything (it does not call the jwks_uri or any
// endpoint), NEVER verifies or forges a signature, and is clock-independent: it
// surfaces exp / iat / auth_time for the reader to judge and never compares them
// to the current time. It decodes and explains.
// ============================================================================

import {
  decodeJwt,
  JwtDecodeError,
  type DecodedJwt,
  type JwtTime,
} from "../jwt/compute";
import {
  claimCategory,
  REQUIRED_ID_TOKEN_CLAIMS,
  ASYMMETRIC_ALGS,
  SYMMETRIC_ALGS,
  AMR_VALUES,
  DISCOVERY_FIELDS,
  DISCOVERY_REQUIRED,
  DISCOVERY_MARKERS,
  type ClaimCategory,
  type DiscoveryCategory,
} from "./registry-data";

// -- Errors -------------------------------------------------------------------
export type OidcParseErrorCode =
  | "empty"
  | "malformed-json"
  | "json-not-oidc"
  | "not-jwt"
  | "jwt-header"
  | "jwt-payload";

export class OidcParseError extends Error {
  code: OidcParseErrorCode;
  constructor(code: OidcParseErrorCode, message?: string) {
    super(message ?? code);
    this.name = "OidcParseError";
    this.code = code;
  }
}

// -- Public report shape ------------------------------------------------------
export interface OidcReason {
  code: string;
  value?: string;
}

export interface OidcClaimEntry {
  name: string;
  category: ClaimCategory;
  value: unknown;
}

export interface OidcCoreClaims {
  iss?: string;
  sub?: string;
  aud?: string[];
  azp?: string;
  nonce?: string;
  acr?: string;
  amr?: string[];
  amrLabels?: string[];
  auth_time?: JwtTime | null;
}

export type AlgClass = "asymmetric" | "symmetric" | "none" | "unknown";

export interface IdTokenReport {
  alg: string | null;
  typ: string | null;
  kid: string | null;
  algClass: AlgClass;
  signed: boolean;
  core: OidcCoreClaims;
  times: { iat: JwtTime | null; nbf: JwtTime | null; exp: JwtTime | null };
  claims: OidcClaimEntry[];
}

export interface DiscoveryEndpoint {
  name: string;
  url: string;
}
export interface DiscoveryCapability {
  name: string;
  values: string[];
}
export interface DiscoveryMetadata {
  name: string;
  value: string;
}
export interface DiscoveryReport {
  issuer?: string;
  endpoints: DiscoveryEndpoint[];
  capabilities: DiscoveryCapability[];
  metadata: DiscoveryMetadata[];
  signingAlgs: string[];
}

export interface OidcReport {
  mode: "id-token" | "discovery";
  idToken?: IdTokenReport;
  discovery?: DiscoveryReport;
  reasons: OidcReason[];
}

// -- Helpers ------------------------------------------------------------------
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
/** Normalize an aud claim (string or string[]) into an array of strings. */
function audToArray(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}
/** Convert a NumericDate value to {epoch, iso}, or null. */
function toTime(v: unknown): JwtTime | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return { epoch: v, iso: new Date(v * 1000).toISOString() };
}

// -- ID token interpretation --------------------------------------------------
function classifyAlg(alg: string | null): AlgClass {
  if (alg === null) return "unknown";
  if (alg === "none") return "none";
  if (ASYMMETRIC_ALGS.has(alg)) return "asymmetric";
  if (SYMMETRIC_ALGS.has(alg)) return "symmetric";
  return "unknown";
}

function interpretIdToken(decoded: DecodedJwt): { report: IdTokenReport; reasons: OidcReason[] } {
  const p = decoded.payload;
  const algClass = classifyAlg(decoded.alg);
  const hasSignature = decoded.signature.length > 0;
  const signed = algClass !== "none" && hasSignature;

  const amr = Array.isArray(p.amr)
    ? p.amr.filter((x): x is string => typeof x === "string")
    : undefined;
  const amrLabels = amr?.map((m) => AMR_VALUES[m] ?? m);
  const audiences = audToArray(p.aud);

  const core: OidcCoreClaims = {
    iss: asString(p.iss),
    sub: asString(p.sub),
    aud: audiences,
    azp: asString(p.azp),
    nonce: asString(p.nonce),
    acr: asString(p.acr),
    amr,
    amrLabels,
    auth_time: toTime(p.auth_time),
  };

  // Every claim, categorized, for grouped display (header claims are separate).
  const claims: OidcClaimEntry[] = Object.keys(p).map((name) => ({
    name,
    category: claimCategory(name),
    value: p[name],
  }));

  const report: IdTokenReport = {
    alg: decoded.alg,
    typ: decoded.typ,
    kid: decoded.kid,
    algClass,
    signed,
    core,
    times: decoded.times,
    claims,
  };

  // -- Assessment (no clock comparison) --
  const reasons: OidcReason[] = [];
  for (const c of REQUIRED_ID_TOKEN_CLAIMS) {
    if (!(c in p)) reasons.push({ code: "MISSING_REQUIRED_CLAIM", value: c });
  }
  if (algClass === "none") reasons.push({ code: "ALG_NONE" });
  else if (algClass === "symmetric") reasons.push({ code: "ALG_SYMMETRIC", value: decoded.alg ?? "" });
  else if (algClass === "unknown" && decoded.alg) reasons.push({ code: "ALG_UNKNOWN", value: decoded.alg });
  else if (algClass === "asymmetric") reasons.push({ code: "SIGNED_ASYMMETRIC", value: decoded.alg ?? "" });

  if (!("nonce" in p)) reasons.push({ code: "NO_NONCE" });
  if (audiences.length > 1 && !core.azp) reasons.push({ code: "MULTI_AUD_NO_AZP" });

  return { report, reasons };
}

// -- Discovery interpretation -------------------------------------------------
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function interpretDiscovery(doc: Record<string, unknown>): {
  report: DiscoveryReport;
  reasons: OidcReason[];
} {
  const endpoints: DiscoveryEndpoint[] = [];
  const capabilities: DiscoveryCapability[] = [];
  const metadata: DiscoveryMetadata[] = [];

  for (const key of Object.keys(doc)) {
    const cat: DiscoveryCategory | undefined = DISCOVERY_FIELDS[key];
    const val = doc[key];
    if (cat === "endpoint" && typeof val === "string") {
      endpoints.push({ name: key, url: val });
    } else if (cat === "capability") {
      const arr = asStringArray(val);
      if (arr.length) capabilities.push({ name: key, values: arr });
      else if (typeof val === "boolean") metadata.push({ name: key, value: String(val) });
    } else if (cat === "metadata" && typeof val === "string") {
      metadata.push({ name: key, value: val });
    }
  }

  const signingAlgs = asStringArray(doc.id_token_signing_alg_values_supported);
  const pkceMethods = asStringArray(doc.code_challenge_methods_supported);

  const report: DiscoveryReport = {
    issuer: asString(doc.issuer),
    endpoints,
    capabilities,
    metadata,
    signingAlgs,
  };

  // -- Assessment --
  const reasons: OidcReason[] = [];
  for (const f of DISCOVERY_REQUIRED) {
    if (!(f in doc)) reasons.push({ code: "DISCOVERY_MISSING_FIELD", value: f });
  }
  if (signingAlgs.includes("none")) reasons.push({ code: "DISCOVERY_ALG_NONE" });
  if (pkceMethods.length === 0) reasons.push({ code: "DISCOVERY_NO_PKCE" });
  else if (!pkceMethods.includes("S256")) reasons.push({ code: "DISCOVERY_NO_PKCE_S256" });

  return { report, reasons };
}

// -- Entry point --------------------------------------------------------------
/** True when the parsed JSON object looks like an OIDC discovery document. */
function looksLikeDiscovery(doc: Record<string, unknown>): boolean {
  if (typeof doc.issuer !== "string") return false;
  return DISCOVERY_MARKERS.some((m) => m !== "issuer" && m in doc);
}

/**
 * analyzeOidc - the engine entry point. Detects an ID token (compact JWS) versus
 * a discovery JSON document and decodes accordingly. Throws OidcParseError for
 * empty input, malformed JSON, JSON that is not a discovery document, or a token
 * that is not a valid JWT.
 */
export function analyzeOidc(input: string): OidcReport {
  const raw = (input ?? "").trim();
  if (!raw) throw new OidcParseError("empty");

  if (raw.startsWith("{")) {
    let doc: unknown;
    try {
      doc = JSON.parse(raw);
    } catch {
      throw new OidcParseError("malformed-json");
    }
    if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
      throw new OidcParseError("json-not-oidc");
    }
    const obj = doc as Record<string, unknown>;
    if (!looksLikeDiscovery(obj)) throw new OidcParseError("json-not-oidc");
    const { report, reasons } = interpretDiscovery(obj);
    return { mode: "discovery", discovery: report, reasons };
  }

  // Otherwise treat as a JWT (ID token).
  let decoded: DecodedJwt;
  try {
    decoded = decodeJwt(raw);
  } catch (e) {
    if (e instanceof JwtDecodeError) {
      const map: Record<string, OidcParseErrorCode> = {
        empty: "empty",
        format: "not-jwt",
        header: "jwt-header",
        payload: "jwt-payload",
      };
      throw new OidcParseError(map[e.code] ?? "not-jwt");
    }
    throw new OidcParseError("not-jwt");
  }
  const { report, reasons } = interpretIdToken(decoded);
  return { mode: "id-token", idToken: report, reasons };
}
