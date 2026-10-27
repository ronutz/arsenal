// ============================================================================
// src/lib/share/cases/acme-dns01.ts
// ----------------------------------------------------------------------------
// Share cases of the ACME dns-01 TXT computer: the token, the thumbprint and
// the domain go; the account key as pasted never does, not even its public
// members. The private key is RFC 7515 Appendix A.3's P-256 example (its "d"
// member included), whose thumbprint is the tool's own pinned EC thumbprint
// (RFC 7638 section 3.2.1: a private key's thumbprint is its public key's).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ACME_DNS01_SHARE, type AcmeDns01ShareInput, type AcmeDns01ShareState } from "../../tools/acme-dns01/share"; // the spec
import { ACME_DNS01_GOLDEN_VECTORS } from "../../tools/acme-dns01/golden-vectors"; // the tool's own vectors

/** The EC vector (token, public JWK, thumbprint), the Example's. */
const EC = ACME_DNS01_GOLDEN_VECTORS.find((v) => v.name === "ec-p256-computed")!; // pinned there
/** The RSA vector (RFC 7638 section 3.1's key). */
const RSA = ACME_DNS01_GOLDEN_VECTORS.find((v) => v.name === "rfc7638-rsa-kat")!; // pinned there
/** RFC 7515 Appendix A.3's private key: the EC vector's public members and "d". */
const PRIVATE_EC = '{"kty":"EC","crv":"P-256","x":"f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU","y":"x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0","d":"jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI"}'; // as an account key file holds it
/** The EC thumbprint, as the engine pins it. */
const EC_THUMB = EC.expected.thumbprint as string; // oKIy...
/** The RSA thumbprint, RFC 7638 section 3.1's. */
const RSA_THUMB = RSA.expected.thumbprint as string; // NzbL...

/** The cases. */
export const ACME_DNS01_SHARE_CASES = defineShareCases<AcmeDns01ShareInput, AcmeDns01ShareState>({
  spec: ACME_DNS01_SHARE, // the spec
  accept: [
    { // a private account key pasted: only the thumbprint goes
      id: "private-jwk", state: { token: EC.input.token, accountKey: PRIVATE_EC, domain: "example.org", thumbprint: EC_THUMB },
      params: { input: EC.input.token, thumbprint: EC_THUMB, domain: "example.org" }, restored: { token: EC.input.token, thumbprint: EC_THUMB, domain: "example.org" },
      mustNotContain: ["jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI", "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU", '"kty"'], // d, x, and the JWK itself
    },
    { // the RSA key, no domain: two values
      id: "rsa-no-domain", state: { token: RSA.input.token, accountKey: RSA.input.accountKey, domain: "  ", thumbprint: RSA_THUMB },
      params: { input: RSA.input.token, thumbprint: RSA_THUMB }, restored: { token: RSA.input.token, thumbprint: RSA_THUMB, domain: "" },
      mustNotContain: ['"n"', '"kty"'], // the modulus member and the JWK
    },
    { // a thumbprint typed in the key box, and a wildcard domain with spaces around the token
      id: "thumbprint-wildcard", state: { token: `  ${EC.input.token} `, accountKey: EC_THUMB, domain: "*.example.org", thumbprint: EC_THUMB },
      params: { input: EC.input.token, thumbprint: EC_THUMB, domain: "*.example.org" }, restored: { token: EC.input.token, thumbprint: EC_THUMB, domain: "*.example.org" },
    },
  ],
  arrive: [
    { id: "no-domain", values: { input: EC.input.token, thumbprint: EC_THUMB, domain: null }, restored: { token: EC.input.token, thumbprint: EC_THUMB, domain: "" } }, // absent domain: none
  ],
  empty: [
    { id: "no-result", state: { token: EC.input.token, accountKey: "not a key", domain: "", thumbprint: null } }, // the engine refused the key: no result
    { id: "no-token", state: { token: " ", accountKey: PRIVATE_EC, domain: "", thumbprint: EC_THUMB } }, // no token
  ],
  reject: [
    { id: "no-thumbprint", values: { input: EC.input.token, thumbprint: null, domain: null } }, // the thumbprint is required
    { id: "no-token", values: { input: null, thumbprint: EC_THUMB, domain: null } }, // the token is required
    { id: "token-not-base64url", values: { input: "has spaces", thumbprint: EC_THUMB, domain: null } }, // the engine's own refusal
    { id: "jwk-as-thumbprint", values: { input: EC.input.token, thumbprint: PRIVATE_EC, domain: null } }, // a key never arrives in the thumbprint's place
    { id: "padded-thumbprint", values: { input: EC.input.token, thumbprint: `${EC_THUMB}=`, domain: null } }, // padding is not base64url here
    { id: "domain-with-space", values: { input: EC.input.token, thumbprint: EC_THUMB, domain: "example .org" } }, // not a domain name
  ],
});
