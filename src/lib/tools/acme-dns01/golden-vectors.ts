// ============================================================================
// src/lib/tools/acme-dns01/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the ACME dns-01 tool (set id: "acme-dns01/golden@1").
//
// GENERATED and frozen (Web Crypto). Correctness is anchored on the RFC 7638
// §3.1 KNOWN-ANSWER TEST: the RSA example key MUST thumbprint to
// "NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs" (vector rfc7638-rsa-kat). The
// remaining vectors exercise an EC key, the "provided thumbprint" path (which
// must reproduce the EC chain), and wildcard-domain record naming. Reject
// vectors cover empty/badly-formed input. Regenerate via /tmp with the same
// canonicalization if ever needed.
// ============================================================================

import type { AcmeDns01Input, AcmeDns01Result } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "acme-dns01/golden@1";

/** A success case: `input` must produce a result matching `expected`. */
export interface AcmeDns01GoldenVector {
  name: string;
  input: AcmeDns01Input;
  expected: AcmeDns01Result;
}

/** A rejection case: `input` must return { ok:false }. */
export interface AcmeDns01RejectVector {
  name: string;
  input: AcmeDns01Input;
}

// The RFC 7515/7517 example P-256 public key (real example coordinates).
const EC_JWK =
  '{"kty":"EC","crv":"P-256","x":"f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU","y":"x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0"}';
const EC_TOKEN = "evaGxfADs6pSRb2LAv9IZf17Dt3juxGJ-PCt92wr-oA";
const EC_THUMB = "oKIywvGUpTVTyxMQ3bwIIeQUudfr_CkLMjCE19ECD-U";
const EC_KEYAUTH = `${EC_TOKEN}.${EC_THUMB}`;
const EC_TXT = "ZaJgFtIV4WA0t2MzN7kbSk0sfRd2GZjaxRqaSTAK6lI";

// The RFC 7638 §3.1 example RSA public key (the known-answer test).
const RSA_JWK =
  '{"kty":"RSA","n":"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw","e":"AQAB"}';
const RSA_TOKEN = "DGyRejmCefe7v4NfDGDKfA";
const RSA_THUMB = "NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs"; // RFC 7638 §3.1
const RSA_KEYAUTH = `${RSA_TOKEN}.${RSA_THUMB}`;
const RSA_TXT = "Bs72Q7B-BSSQo4oDjA2qBR07GB6sc3hiG9zqaqvHx7U";

export const ACME_DNS01_GOLDEN_VECTORS: AcmeDns01GoldenVector[] = [
  {
    name: "rfc7638-rsa-kat",
    input: { token: RSA_TOKEN, accountKey: RSA_JWK },
    expected: {
      ok: true,
      keyType: "RSA",
      thumbprint: RSA_THUMB,
      thumbprintSource: "computed",
      keyAuthorization: RSA_KEYAUTH,
      txtValue: RSA_TXT,
    },
  },
  {
    name: "ec-p256-computed",
    input: { token: EC_TOKEN, accountKey: EC_JWK },
    expected: {
      ok: true,
      keyType: "EC",
      thumbprint: EC_THUMB,
      thumbprintSource: "computed",
      keyAuthorization: EC_KEYAUTH,
      txtValue: EC_TXT,
    },
  },
  {
    name: "provided-thumbprint-reproduces-ec",
    input: { token: EC_TOKEN, accountKey: EC_THUMB },
    expected: {
      ok: true,
      thumbprint: EC_THUMB,
      thumbprintSource: "provided",
      keyAuthorization: EC_KEYAUTH,
      txtValue: EC_TXT,
    },
  },
  {
    name: "wildcard-domain-record-name",
    input: { token: EC_TOKEN, accountKey: EC_JWK, domain: "*.example.org" },
    expected: {
      ok: true,
      keyType: "EC",
      thumbprint: EC_THUMB,
      thumbprintSource: "computed",
      keyAuthorization: EC_KEYAUTH,
      txtValue: EC_TXT,
      recordName: "_acme-challenge.example.org",
    },
  },
];

export const ACME_DNS01_REJECT_VECTORS: AcmeDns01RejectVector[] = [
  { name: "empty-token", input: { token: "", accountKey: EC_THUMB } },
  { name: "empty-key", input: { token: EC_TOKEN, accountKey: "" } },
  { name: "token-not-base64url", input: { token: "has spaces", accountKey: EC_THUMB } },
  {
    name: "jwk-missing-required-member",
    input: { token: EC_TOKEN, accountKey: '{"kty":"EC","crv":"P-256","x":"f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU"}' },
  },
  { name: "key-neither-jwk-nor-thumbprint", input: { token: EC_TOKEN, accountKey: "not a key!" } },
];
