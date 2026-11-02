// ============================================================================
// src/lib/share/cases/jwt.ts
// ----------------------------------------------------------------------------
// Share cases of the JWT decoder: a link carries "header.payload." and a flag,
// never the signature, never the token as pasted. The tokens are the tool's
// own golden vectors (decoded by the engine there), plus a header carrying a
// public "jwk" (allowed) and one carrying RFC 7515 Appendix A.3's private
// P-256 key, "d" included (blocked).
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { JWT_SHARE, type JwtShareInput, type JwtShareState } from "../../tools/jwt/share"; // the spec
import { JWT_GOLDEN_VECTORS } from "../../tools/jwt/golden-vectors"; // the tool's own vectors
import { decodeJwt } from "../../tools/jwt/compute"; // the engine, for the two tokens built here

/** A vector by name (pinned in the tool's set). */
const vec = (name: string) => JWT_GOLDEN_VECTORS.find((v) => v.name === name)!; // found there
/** jwt.io's HS256 example, the page's Example. */
const CLASSIC = vec("hs256-classic"); // alg HS256, typ JWT
/** Registered claims with a kid. */
const CLAIMS = vec("registered-claims"); // iss, sub, aud, times, jti
/** An unsecured token: no signature to leave out. */
const NONE = vec("alg-none"); // alg none

/**
 * base64url of a JSON value (RFC 7515 section 2), for the two tokens built here.
 * @param v the value
 * @returns its base64url text without padding
 */
const b64u = (v: unknown): string => btoa(JSON.stringify(v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); // ASCII JSON only

/** RFC 7515 Appendix A.3's P-256 key: public members, and its private "d". */
const A3 = { kty: "EC", crv: "P-256", x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU", y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0" }; // public
/** Its private member. */
const A3_D = "jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI"; // never in a link
/** A token whose header carries the public key: allowed (RFC 7515 section 4.1.3). */
const PUBLIC_JWK_TOKEN = `${b64u({ alg: "ES256", jwk: A3 })}.${b64u({ sub: "x" })}.c2lnbmF0dXJl`; // a placeholder signature
/** The same with "d" in the header's key: blocked. */
const PRIVATE_JWK_TOKEN = `${b64u({ alg: "ES256", jwk: { ...A3, d: A3_D } })}.${b64u({ sub: "x" })}.c2lnbmF0dXJl`; // a key in the header

/** The copy of a token: its first two segments and an empty signature. */
const copyOf = (token: string): string => token.split(".").slice(0, 2).join(".") + "."; // as shareableToken builds it

/** The cases. */
const CASES: ShareCases<JwtShareInput, JwtShareState> = {
  spec: JWT_SHARE, // the spec
  accept: [
    { // the Example: header and claims go, the signature does not
      id: "hs256-example", state: { input: CLASSIC.input, decoded: CLASSIC.expected },
      params: { input: copyOf(CLASSIC.input), signed: "1" }, restored: { input: copyOf(CLASSIC.input), signed: true },
      mustNotContain: [CLASSIC.expected.signature, CLASSIC.input], // the signature, and the token as pasted
    },
    { // registered claims and a kid, pasted with spaces and a line break around it
      id: "claims-trimmed", state: { input: `  ${CLAIMS.input}\n`, decoded: CLAIMS.expected },
      params: { input: copyOf(CLAIMS.input), signed: "1" }, restored: { input: copyOf(CLAIMS.input), signed: true },
      mustNotContain: [CLAIMS.expected.signature], // "c2lnbmF0dXJlLWJ5dGVz"
    },
    { // an unsecured token is its own copy, with no flag
      id: "alg-none", state: { input: NONE.input, decoded: NONE.expected },
      params: { input: NONE.input }, restored: { input: NONE.input, signed: false },
    },
    { // a public key in the header goes with the header
      id: "public-jwk-header", state: { input: PUBLIC_JWK_TOKEN, decoded: decodeJwt(PUBLIC_JWK_TOKEN) },
      params: { input: copyOf(PUBLIC_JWK_TOKEN), signed: "1" }, restored: { input: copyOf(PUBLIC_JWK_TOKEN), signed: true },
      mustNotContain: ["c2lnbmF0dXJl"], // the signature
    },
  ],
  arrive: [
    { id: "flag-absent", values: { input: copyOf(CLASSIC.input), signed: null }, restored: { input: copyOf(CLASSIC.input), signed: false } }, // no flag: no signature shown as left out
  ],
  empty: [
    { id: "nothing-decoded", state: { input: "not a token", decoded: null } }, // the engine refused it
    { id: "blank", state: { input: "", decoded: null } }, // nothing typed
  ],
  blocked: [
    { id: "private-jwk-header", state: { input: PRIVATE_JWK_TOKEN, decoded: decodeJwt(PRIVATE_JWK_TOKEN) }, code: "private-key" }, // RFC 7515 A.3's d in the header
  ],
  reject: [
    { id: "whole-token", values: { input: CLASSIC.input, signed: "1" } }, // a signature never opens
    { id: "no-trailing-dot", values: { input: copyOf(CLASSIC.input).slice(0, -1), signed: null } }, // not the copy's shape
    { id: "flag-not-1", values: { input: copyOf(CLASSIC.input), signed: "yes" } }, // "1" or absent only
    { id: "signed-alg-none", values: { input: NONE.input, signed: "1" } }, // an unsecured token was never signed
    { id: "not-json", values: { input: "aGVsbG8.aGVsbG8.", signed: null } }, // the engine refuses its header
    { id: "private-jwk-copy", values: { input: copyOf(PRIVATE_JWK_TOKEN), signed: "1" } }, // a key never opens
    { id: "empty", values: { input: "", signed: null } }, // nothing
  ],
};

/** The runner. */
export const JWT_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
