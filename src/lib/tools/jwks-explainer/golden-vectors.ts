// ============================================================================
// src/lib/tools/jwks-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the JWKS explainer and key matcher. Parse vectors use the public
// and private example JWK Sets from RFC 7517 Appendix A, plus a symmetric (oct)
// key, a weak RSA key, and the error cases. Match vectors check kid hits and
// misses and the no-kid fallback. Share vectors (2026-11-01) pin the copy a
// Share results link carries: every private value replaced, the reading kept.
// ============================================================================

import { parseJwks, matchJwtToJwks, shareableJwks, SHARE_REDACTED, type JwksResult } from "./compute"; // the engine, and its shareable copy (Share results, 2026-10-27)

export const GOLDEN_VECTOR_SET_ID = "jwks-explainer-golden-2026-11-01"; // 2026-11-01: the Share results vectors (SHARE_VECTORS) added; was jwks-explainer-golden-v1

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
  // Runtime-neutral base64url. btoa is a global on every target this module
  // ships to - browsers, the Cloudflare Worker (workerd), and Node 22 - so no
  // Node Buffer fallback is needed. One was here until 2026-09-09; it could
  // never execute, and Buffer is undeclared on the Worker, which the worker
  // type-check (tsconfig.worker.json) rightly rejected.
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
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

// ---- Share results (2026-10-27): the shareable copy ------------------------
// Each vector pins shareableJwks byte for byte: the copy, the count of values
// replaced, that no private value is left in it, that a copy of the copy is
// the copy, and that parseJwks reads the copy exactly as it reads the paste
// (every key's explanation, the private flag, the single-key flag; rawKeys
// aside, which holds the values themselves and is never shown).

/** What replaces a private value (the JSON scanner's word). */
const R = SHARE_REDACTED; // "[redacted]"

/** RFC 7517 Appendix A.2's private EC key (line breaks inside values removed: the RFC says they are for display only). */
const A2_EC = { kty: "EC", crv: "P-256", x: "MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4", y: "4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM", d: "870MB6gfuTJ4HtUnUvYMyJpr5eUZNP4Bk43bVdj3eAE", use: "enc", kid: "1" }; // public members and d
/** RFC 7517 Appendix A.2's private RSA key. */
const A2_RSA = {
  kty: "RSA", // the key type
  n: RFC_RSA_N, // public modulus (Appendix A.1's)
  e: "AQAB", // public exponent
  d: "X4cTteJY_gn4FYPsXB8rdXix5vwsg1FLN5E3EaG6RJoVH-HLLKD9M7dx5oo7GURknchnrRweUkC7hT5fJLM0WbFAKNLWY2vv7B6NqXSzUvxT0_YSfqijwp3RTzlBaCxWp4doFk5N2o8Gy_nHNKroADIkJ46pRUohsXywbReAdYaMwFs9tv8d_cPVY3i07a3t8MN6TNwm0dSawm9v47UiCl3Sk5ZiG7xojPLu4sbg1U2jx4IBTNBznbJSzFHK66jT8bgkuqsk0GjskDJk19Z4qwjwbsnn4j2WBii3RL-Us2lGVkY8fkFzme1z0HbIkfz0Y6mqnOYtqc0X4jfcKoAC8Q", // private exponent
  p: "83i-7IvMGXoMXCskv73TKr8637FiO7Z27zv8oj6pbWUQyLPQBQxtPVnwD20R-60eTDmD2ujnMt5PoqMrm8RfmNhVWDtjjMmCMjOpSXicFHj7XOuVIYQyqVWlWEh6dN36GVZYk93N8Bc9vY41xy8B9RzzOGVQzXvNEvn7O0nVbfs", // first prime
  q: "3dfOR9cuYq-0S-mkFLzgItgMEfFzB2q3hWehMuG0oCuqnb3vobLyumqjVZQO1dIrdwgTnCdpYzBcOfW5r370AFXjiWft_NGEiovonizhKpo9VVS78TzFgxkIdrecRezsZ-1kYd_s1qDbxtkDEgfAITAG9LUnADun4vIcb6yelxk", // second prime
  dp: "G4sPXkc6Ya9y8oJW9_ILj4xuppu0lzi_H7VTkS8xj5SdX3coE0oimYwxIi2emTAue0UOa5dpgFGyBJ4c8tQ2VF402XRugKDTP8akYhFo5tAA77Qe_NmtuYZc3C3m3I24G2GvR5sSDxUyAN2zq8Lfn9EUms6rY3Ob8YeiKkTiBj0", // first factor CRT exponent
  dq: "s9lAH9fggBsoFR8Oac2R_E2gw282rT2kGOAhvIllETE1efrA6huUUvMfBcMpn8lqeW6vzznYY5SSQF7pMdC_agI3nG8Ibp1BUb0JUiraRNqUfLhcQb_d9GF4Dh7e74WbRsobRonujTYN1xCaP6TO61jvWrX-L18txXw494Q_cgk", // second factor CRT exponent
  qi: "GyM_p6JrXySiz1toFgKbWV-JdI3jQ4ypu9rbMWx3rQJBfmt0FoYzgUIZEVFEcOqwemRN81zoDAaa-Bk0KWNGDjJHZDdDmFhW3AN7lI-puxk_mHZGJ11rxyR8O55XLSe3SPmRfKwZI6yU24ZxvQKFYItdldUKGzO6Ia6zTKhAVRU", // first CRT coefficient
  alg: "RS256", // the algorithm
  kid: "2011-04-29", // the key id
};
/** RFC 7517 Appendix A.3's symmetric keys. */
const A3_OCT = [
  { kty: "oct", alg: "A128KW", k: "GawgguFyGrWKav7AX4VKUg" }, // a key-wrap key
  { kty: "oct", k: "AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow", kid: "HMAC key used in JWS spec Appendix A.1 example" }, // an HMAC key
];
/** RFC 8037 Appendix A.1's Ed25519 private key, pasted alone (a single JWK). */
const OKP_PRIVATE = { kty: "OKP", crv: "Ed25519", d: "nWGxne_9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A", x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo" }; // d private, x public
/** A three-prime RSA key with an "oth" member (RFC 7518 section 6.3.2.7); values made up for this vector. */
const RSA_OTH = { kty: "RSA", n: RFC_RSA_N, e: "AQAB", d: "cHJpdmF0ZS1leHBvbmVudA", p: "Zmlyc3QtcHJpbWUtZmFjdG9y", q: "c2Vjb25kLXByaW1lLWZhY3Rvcg", dp: "Zmlyc3QtY3J0LWV4cG9uZW50", dq: "c2Vjb25kLWNydC1leHBvbmVudA", qi: "Zmlyc3QtY3J0LWNvZWZmaWNpZW50", oth: [{ r: "dGhpcmQtcHJpbWUtZmFjdG9y", d: "dGhpcmQtY3J0LWV4cG9uZW50", t: "dGhpcmQtY3J0LWNvZWZmaWNpZW50" }], kid: "three-primes" }; // every private value distinct

/** A share vector: a paste, its exact copy, how many values were replaced, and the values that must be gone. */
export interface ShareVector {
  /** Stable id. */
  id: string;
  /** What it shows. */
  description: string;
  /** The key set as pasted. */
  input: string;
  /** The copy a link carries, byte for byte. */
  expectCopy: string;
  /** How many values were replaced. */
  expectRedacted: number;
  /** Values that must not appear in the copy. */
  secrets: string[];
}

/** The share vectors. */
export const SHARE_VECTORS: ShareVector[] = [
  {
    id: "share-rfc7517-a2-private", // EC d, and the RSA key's six private members
    description: "RFC 7517 A.2: every private value replaced, member names kept",
    input: JSON.stringify({ keys: [A2_EC, A2_RSA] }), // compact
    expectCopy: JSON.stringify({ keys: [{ ...A2_EC, d: R }, { ...A2_RSA, d: R, p: R, q: R, dp: R, dq: R, qi: R }] }), // the same order
    expectRedacted: 7, // 1 + 6
    secrets: [A2_EC.d, A2_RSA.d, A2_RSA.p, A2_RSA.q, A2_RSA.dp, A2_RSA.dq, A2_RSA.qi], // every private value
  },
  {
    id: "share-rfc7517-a3-symmetric", // two oct keys
    description: "RFC 7517 A.3: each symmetric key's k replaced",
    input: JSON.stringify({ keys: A3_OCT }), // compact
    expectCopy: JSON.stringify({ keys: A3_OCT.map((k) => ({ ...k, k: R })) }), // k replaced in place
    expectRedacted: 2, // two keys
    secrets: A3_OCT.map((k) => k.k), // both secrets
  },
  {
    id: "share-rfc7517-a1-public", // nothing private
    description: "RFC 7517 A.1: a public key set is its own copy",
    input: PUBLIC_JWKS, // the public set
    expectCopy: PUBLIC_JWKS, // unchanged
    expectRedacted: 0, // nothing to replace
    secrets: [], // none
  },
  {
    id: "share-pretty-printed", // spacing as pasted
    description: "An indented paste keeps its spacing; only the value changes",
    input: JSON.stringify({ keys: [A2_EC] }, null, 2), // two-space indent
    expectCopy: JSON.stringify({ keys: [{ ...A2_EC, d: R }] }, null, 2), // the same layout
    expectRedacted: 1, // d
    secrets: [A2_EC.d], // the EC private key
  },
  {
    id: "share-rfc8037-okp-single", // a single JWK
    description: "RFC 8037 A.1: a lone OKP private key's d replaced",
    input: JSON.stringify(OKP_PRIVATE), // not wrapped in keys
    expectCopy: JSON.stringify({ ...OKP_PRIVATE, d: R }), // d replaced
    expectRedacted: 1, // d
    secrets: [OKP_PRIVATE.d], // the Ed25519 private key
  },
  {
    id: "share-rsa-other-primes", // oth's members
    description: "A three-prime RSA key: the six members and oth's r, d and t replaced",
    input: JSON.stringify(RSA_OTH), // a single JWK
    expectCopy: JSON.stringify({ ...RSA_OTH, d: R, p: R, q: R, dp: R, dq: R, qi: R, oth: [{ r: R, d: R, t: R }] }), // nine values
    expectRedacted: 9, // 6 + 3
    secrets: [RSA_OTH.d, RSA_OTH.p, RSA_OTH.q, RSA_OTH.dp, RSA_OTH.dq, RSA_OTH.qi, RSA_OTH.oth[0].r, RSA_OTH.oth[0].d, RSA_OTH.oth[0].t], // every private value
  },
];

/**
 * What the page reads from a key set, without the raw values (rawKeys), as canonical text.
 * @param r a parse result
 * @returns its shown parts as JSON
 */
function shown(r: JwksResult): string {
  const { rawKeys: _raw, ...rest } = r; // the values themselves are never shown
  void _raw; // read, so the compiler sees it used
  return JSON.stringify(rest); // keys, flags and error
} // shown

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

  // Share results (2026-10-27): each share vector's copy, count, leftovers, idempotence and reading.
  for (const v of SHARE_VECTORS) {
    const errs: string[] = []; // this vector's failures
    const copy = shareableJwks(v.input); // the copy a link carries
    if (!copy.ok || !copy.parsed) errs.push(`no copy: ${JSON.stringify(copy).slice(0, 120)}`); // a parsed set always gives one
    else {
      if (copy.text !== v.expectCopy) errs.push(`copy differs: ${copy.text.slice(0, 120)}`); // byte for byte
      if (copy.redacted !== v.expectRedacted) errs.push(`redacted: got ${copy.redacted} want ${v.expectRedacted}`); // the count the popover shows
      for (const s of v.secrets) if (copy.text.includes(s)) errs.push(`a private value is left (${s.slice(0, 6)}...)`); // none may stay
      const again = shareableJwks(copy.text); // a copy of the copy
      if (!again.ok || again.text !== copy.text) errs.push("a copy of the copy differs"); // idempotent
      if (shown(parseJwks(copy.text)) !== shown(parseJwks(v.input))) errs.push("the page reads the copy differently"); // the same reading
    }
    if (errs.length) failures.push(`[share:${v.id}] ${errs.join("; ")}`); // recorded
    else passed++; // passed
  }

  return { passed, failed: failures.length, failures };
}
