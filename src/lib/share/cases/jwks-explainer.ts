// ============================================================================
// src/lib/share/cases/jwks-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the JWKS explainer: the key set travels as its copy, every
// private value replaced (the tool's share vectors, RFC 7517 A.1 to A.3 and
// RFC 8037 A.1); in Match mode the JWT box travels as its header only, an
// opaque token not at all, and a header holding a private key is blocked.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { JWKS_SHARE, type JwksShareInput, type JwksShareState } from "../../tools/jwks-explainer/share"; // the spec
import { SHARE_VECTORS } from "../../tools/jwks-explainer/golden-vectors"; // the tool's share vectors

/** A share vector by id (pinned in the tool's set). */
const vec = (id: string) => SHARE_VECTORS.find((v) => v.id === id)!; // found there
/** RFC 7517 A.2: private EC and RSA keys. */
const A2 = vec("share-rfc7517-a2-private"); // 7 values replaced
/** RFC 7517 A.3: two symmetric keys. */
const A3 = vec("share-rfc7517-a3-symmetric"); // 2 values replaced
/** RFC 7517 A.1: public keys only. */
const A1 = vec("share-rfc7517-a1-public"); // its own copy

/**
 * base64url of a JSON value, for the tokens built here.
 * @param v the value
 * @returns its base64url text without padding
 */
const b64u = (v: unknown): string => btoa(JSON.stringify(v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); // ASCII JSON only

/** A token signed with A.3's HMAC key: its header names the key by kid. */
const HEADER = b64u({ alg: "HS256", kid: "HMAC key used in JWS spec Appendix A.1 example" }); // the first segment
/** Its payload and signature, which a link never carries. */
const PAYLOAD = b64u({ sub: "jdoe", email: "jdoe@example.com" }); // a person's claims
/** A placeholder signature. */
const SIG = "c2lnbmF0dXJlLWJ5dGVz"; // never in a link
/** The whole token, as pasted in the JWT box. */
const TOKEN = `${HEADER}.${PAYLOAD}.${SIG}`; // three segments
/** A raw JSON header, as the JWT box also accepts. */
const RAW_HEADER = '{"alg":"RS256","kid":"2011-04-29"}'; // A.1's RSA key by kid
/** An opaque access token (RFC 6749 section 4.1.4's example): not a JWT, so nothing of it may travel. */
const OPAQUE = "2YotnFZFEjr1zCsicMWpAA"; // a bearer credential
/** A header whose "jwk" holds RFC 7517 A.3's symmetric key. */
const PRIVATE_HEADER_TOKEN = `${b64u({ alg: "HS256", jwk: { kty: "oct", k: "GawgguFyGrWKav7AX4VKUg" } })}.${PAYLOAD}.${SIG}`; // blocked

/** A page state: the box, parsed, in a mode, with the JWT box. */
const st = (jwks: string, mode: "explain" | "match", jwt = ""): JwksShareInput => ({ jwks, parsedOk: true, mode, jwt }); // as the page holds it

/** The cases. */
const CASES: ShareCases<JwksShareInput, JwksShareState> = {
  spec: JWKS_SHARE, // the spec
  accept: [
    { // a public set goes as typed
      id: "public-explain", state: st(A1.input, "explain"),
      params: { input: A1.expectCopy }, restored: { jwks: A1.expectCopy, mode: "explain", jwt: null },
    },
    { // private keys: the copy, never a private value
      id: "private-explain", state: st(A2.input, "explain"),
      params: { input: A2.expectCopy }, restored: { jwks: A2.expectCopy, mode: "explain", jwt: null },
      mustNotContain: A2.secrets, // d, p, q, dp, dq, qi
    },
    { // Match mode: the copy and the token's header, never its payload or signature
      id: "symmetric-match-token", state: st(A3.input, "match", `  ${TOKEN}\n`),
      params: { input: A3.expectCopy, mode: "match", header: HEADER }, restored: { jwks: A3.expectCopy, mode: "match", jwt: HEADER },
      mustNotContain: [...A3.secrets, PAYLOAD, SIG, "jdoe@example.com"], // the keys, the claims and the signature
    },
    { // a raw JSON header goes as typed (trimmed)
      id: "match-raw-header", state: st(A1.input, "match", ` ${RAW_HEADER} `),
      params: { input: A1.expectCopy, mode: "match", header: RAW_HEADER }, restored: { jwks: A1.expectCopy, mode: "match", jwt: RAW_HEADER },
    },
    { // an opaque token in the JWT box: nothing of it goes
      id: "match-opaque-token", state: st(A1.input, "match", OPAQUE),
      params: { input: A1.expectCopy, mode: "match" }, restored: { jwks: A1.expectCopy, mode: "match", jwt: "" },
      mustNotContain: [OPAQUE],
    },
  ],
  arrive: [
    { id: "mode-explicit-explain", values: { input: A1.expectCopy, mode: "explain", header: null }, restored: { jwks: A1.expectCopy, mode: "explain", jwt: null } }, // the default, spelled out
  ],
  empty: [
    { id: "not-parsed", state: { jwks: "not a jwks", parsedOk: false, mode: "explain", jwt: "" } }, // the page shows an error
  ],
  blocked: [
    { id: "private-key-in-header", state: st(A1.input, "match", PRIVATE_HEADER_TOKEN), code: "private-key" }, // an oct key's k in the header
  ],
  reject: [
    { id: "not-json", values: { input: "not a jwks", mode: null, header: null } }, // the page cannot explain it
    { id: "private-value-left", values: { input: A2.input, mode: null, header: null } }, // only a copy opens
    { id: "unknown-mode", values: { input: A1.expectCopy, mode: "verify", header: null } }, // not offered
    { id: "header-in-explain", values: { input: A1.expectCopy, mode: null, header: HEADER } }, // a header belongs to Match mode
    { id: "whole-token-as-header", values: { input: A1.expectCopy, mode: "match", header: TOKEN } }, // one segment only
    { id: "header-not-decodable", values: { input: A1.expectCopy, mode: "match", header: OPAQUE } }, // not a JSON header
    { id: "private-header", values: { input: A1.expectCopy, mode: "match", header: PRIVATE_HEADER_TOKEN.split(".")[0] } }, // never a key
  ],
};

/** The runner. */
export const JWKS_EXPLAINER_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
