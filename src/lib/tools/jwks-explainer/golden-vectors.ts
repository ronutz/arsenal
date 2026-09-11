// ============================================================================
// src/lib/tools/jwks-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the JWKS explainer and key matcher. Parse vectors use the public
// and private example JWK Sets from RFC 7517 Appendix A, plus a symmetric (oct)
// key, a weak RSA key, and the error cases. Match vectors check kid hits and
// misses and the no-kid fallback.
// ============================================================================

import { parseJwks, matchJwtToJwks, type JwksResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "jwks-explainer-golden-v1";

// RFC 7517 Appendix A.1 public modulus (2048-bit RSA).
const RFC_RSA_N =
  "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw";

const PUBLIC_JWKS = JSON.stringify({
  keys: [
    { kty: "EC", crv: "P-256", x: "MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4", y: "4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM", use: "enc", kid: "1" },
    { kty: "RSA", n: RFC_RSA_N, e: "AQAB", alg: "RS256", use: "sig", kid: "2011-04-29" },
  ],
});

const PRIVATE_JWKS = JSON.stringify({
  keys: [{ kty: "EC", crv: "P-256", x: "MKBC", y: "4Etl", d: "870MB6gfuTJ4HtUnUvYMyJpr5eUZNP4Bk43bVdj3eAE", kid: "ec-priv" }],
});

const OCT_JWKS = JSON.stringify({ keys: [{ kty: "oct", k: "GawgguFyGrWKav7AX4VKUg", kid: "sym" }] });

// A deliberately small RSA modulus (~960-bit) to trigger the weak-key warning.
const WEAK_RSA_JWKS = JSON.stringify({ keys: [{ kty: "RSA", n: "f".repeat(160), e: "AQAB", kid: "weak" }] });

function b64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  // browser-safe base64url without Buffer
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = (typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64"));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeJwt(header: Record<string, unknown>): string {
  return `${b64url(header)}.${b64url({ sub: "user" })}.signature`;
}

export interface ParseVector {
  id: string;
  description: string;
  input: string;
  expectOk: boolean;
  expectKeyCount?: number;
  expectAnyPrivate?: boolean;
  expectWasSingle?: boolean;
  expectKeyHasWarningIncluding?: { index: number; text: string };
  expectKeyBits?: { index: number; bits: number };
  expectErrorIncludes?: string;
}

export interface MatchVector {
  id: string;
  description: string;
  jwksInput: string;
  header: Record<string, unknown>;
  expectMatchCount: number;
  expectNoteIncludes: string;
}

export const PARSE_VECTORS: ParseVector[] = [
  { id: "rfc-public", description: "RFC 7517 public JWKS (EC + RSA), no private material", input: PUBLIC_JWKS, expectOk: true, expectKeyCount: 2, expectAnyPrivate: false },
  { id: "rsa-2048-bits", description: "RSA modulus measured as exactly 2048 bits", input: PUBLIC_JWKS, expectOk: true, expectKeyBits: { index: 1, bits: 2048 } },
  { id: "private-ec", description: "EC key with d is flagged as private", input: PRIVATE_JWKS, expectOk: true, expectAnyPrivate: true, expectKeyHasWarningIncluding: { index: 0, text: "PRIVATE material" } },
  { id: "oct-secret", description: "oct key is flagged as a symmetric secret", input: OCT_JWKS, expectOk: true, expectKeyHasWarningIncluding: { index: 0, text: "symmetric secret" } },
  { id: "weak-rsa", description: "Small RSA modulus triggers the weak-key warning", input: WEAK_RSA_JWKS, expectOk: true, expectKeyHasWarningIncluding: { index: 0, text: "below the 2048-bit minimum" } },
  { id: "single-jwk", description: "A single JWK (not wrapped in keys) is accepted", input: JSON.stringify({ kty: "RSA", n: RFC_RSA_N, e: "AQAB", kid: "solo" }), expectOk: true, expectKeyCount: 1, expectWasSingle: true },
  { id: "not-json", description: "Non-JSON input is rejected", input: "not a jwks", expectOk: false, expectErrorIncludes: "valid JSON" },
  { id: "no-keys", description: "Object without keys or kty is rejected", input: '{"foo":1}', expectOk: false, expectErrorIncludes: "No keys found" },
  { id: "empty-array", description: "Empty keys array is rejected", input: '{"keys":[]}', expectOk: false, expectErrorIncludes: "empty" },
];

export const MATCH_VECTORS: MatchVector[] = [
  { id: "kid-hit", description: "JWT kid matches a key", jwksInput: PUBLIC_JWKS, header: { alg: "RS256", kid: "2011-04-29" }, expectMatchCount: 1, expectNoteIncludes: "Matched the key" },
  { id: "kid-miss", description: "JWT kid matches no key", jwksInput: PUBLIC_JWKS, header: { alg: "RS256", kid: "ghost" }, expectMatchCount: 0, expectNoteIncludes: "No key in this JWKS" },
  { id: "no-kid-fallback", description: "No kid falls back to alg", jwksInput: PUBLIC_JWKS, header: { alg: "RS256" }, expectMatchCount: 1, expectNoteIncludes: "falls back to alg" },
  { id: "no-kid-no-alg", description: "Neither kid nor alg selects nothing", jwksInput: PUBLIC_JWKS, header: { typ: "JWT" }, expectMatchCount: 0, expectNoteIncludes: "neither a kid nor an alg" },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of PARSE_VECTORS) {
    const r: JwksResult = parseJwks(v.input);
    const errs: string[] = [];
    if (r.ok !== v.expectOk) errs.push(`ok: got ${r.ok} want ${v.expectOk}`);
    if (v.expectKeyCount !== undefined && r.keys.length !== v.expectKeyCount) errs.push(`count: got ${r.keys.length} want ${v.expectKeyCount}`);
    if (v.expectAnyPrivate !== undefined && r.anyPrivate !== v.expectAnyPrivate) errs.push(`anyPrivate: got ${r.anyPrivate} want ${v.expectAnyPrivate}`);
    if (v.expectWasSingle !== undefined && r.wasSingleKey !== v.expectWasSingle) errs.push(`wasSingle: got ${r.wasSingleKey} want ${v.expectWasSingle}`);
    if (v.expectKeyBits) {
      const got = r.keys[v.expectKeyBits.index]?.bits;
      if (got !== v.expectKeyBits.bits) errs.push(`bits[${v.expectKeyBits.index}]: got ${got} want ${v.expectKeyBits.bits}`);
    }
    if (v.expectKeyHasWarningIncluding) {
      const k = r.keys[v.expectKeyHasWarningIncluding.index];
      if (!k || !k.warnings.some((w) => w.includes(v.expectKeyHasWarningIncluding!.text))) errs.push(`warning[${v.expectKeyHasWarningIncluding.index}] missing ${JSON.stringify(v.expectKeyHasWarningIncluding.text)}`);
    }
    if (v.expectErrorIncludes !== undefined && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`error missing ${JSON.stringify(v.expectErrorIncludes)}`);
    if (errs.length) failures.push(`[parse:${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  for (const v of MATCH_VECTORS) {
    const jwks = parseJwks(v.jwksInput);
    const m = matchJwtToJwks(makeJwt(v.header), jwks);
    const errs: string[] = [];
    if (m.matches.length !== v.expectMatchCount) errs.push(`matches: got ${m.matches.length} want ${v.expectMatchCount}`);
    if (!m.note.includes(v.expectNoteIncludes)) errs.push(`note missing ${JSON.stringify(v.expectNoteIncludes)}: got ${JSON.stringify(m.note)}`);
    if (errs.length) failures.push(`[match:${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}
