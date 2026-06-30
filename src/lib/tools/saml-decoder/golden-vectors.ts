// ============================================================================
// src/lib/tools/saml-decoder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden + reject vectors for the SAML decoder. The golden vectors pin the
// extraction and the rule-based assessment for representative messages; the
// reject vectors pin the safety behaviour, including the MANDATORY XXE-hardened
// vector required by the catalogue (a SAML message carrying an external-entity
// DOCTYPE must be REJECTED, never expanded).
//
// All inputs are self-contained and deterministic. verifyVectors() runs the set
// and returns a pass/fail summary; the build and the dev-time check call it.
// ============================================================================

import { analyzeSaml, SamlParseError, type SamlParseErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "saml-decoder-golden-v1";

interface GoldenExpect {
  rootLocal?: string;
  docType?: string;
  signedResponse?: boolean;
  assertionCount?: number;
  firstSigned?: boolean;
  sigLabel?: string;
  weakSig?: boolean;
  weakDigest?: boolean;
  statusSuccess?: boolean;
  encryptedAssertionCount?: number;
  issuer?: string;
  nameId?: string;
  nameIdFormatLabel?: string;
  audiences?: string[];
  attributeCount?: number;
  authnContextLabel?: string;
  requiredReasons: string[];
  forbiddenReasons?: string[];
}

export interface SamlGoldenVector {
  id: string;
  description: string;
  input: string;
  expect: GoldenExpect;
}

export interface SamlRejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: SamlParseErrorCode;
}

const NS = `xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"`;
const DS = `xmlns:ds="http://www.w3.org/2000/09/xmldsig#"`;
const SUCCESS = `<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>`;

/** A ds:Signature naming the given signature + digest algorithm URIs. */
function sig(sigAlgo: string, digestAlgo: string): string {
  return `<ds:Signature ${DS}><ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/><ds:SignatureMethod Algorithm="${sigAlgo}"/><ds:Reference URI="#a"><ds:DigestMethod Algorithm="${digestAlgo}"/><ds:DigestValue>x</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>x</ds:SignatureValue></ds:Signature>`;
}
const RSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
const RSA_SHA1 = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
const D_SHA256 = "http://www.w3.org/2001/04/xmlenc#sha256";
const D_SHA1 = "http://www.w3.org/2000/09/xmldsig#sha1";

const SIGNED_RESPONSE = `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z" Destination="https://sp.example.com/acs" InResponseTo="_q"><saml:Issuer>https://idp.example.com</saml:Issuer>${SUCCESS}<saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Issuer>https://idp.example.com</saml:Issuer>${sig(RSA_SHA256, D_SHA256)}<saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">user@example.com</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="2026-06-29T12:05:00Z" Recipient="https://sp.example.com/acs" InResponseTo="_q"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="2026-06-29T11:55:00Z" NotOnOrAfter="2026-06-29T12:05:00Z"><saml:AudienceRestriction><saml:Audience>https://sp.example.com</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="2026-06-29T12:00:00Z" SessionIndex="_s"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="email"><saml:AttributeValue>user@example.com</saml:AttributeValue></saml:Attribute><saml:Attribute Name="role"><saml:AttributeValue>admin</saml:AttributeValue><saml:AttributeValue>user</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`;

function b64(s: string): string {
  // btoa is a global in modern Node (16+) and browsers; the vector strings are
  // ASCII, so no UTF-8 handling is needed. Keeps this module browser-safe.
  return btoa(s);
}

export const SAML_GOLDEN_VECTORS: SamlGoldenVector[] = [
  {
    id: "signed-response-full",
    description: "Signed RSA-SHA256 assertion, bearer subject with data, conditions, attributes",
    input: SIGNED_RESPONSE,
    expect: {
      rootLocal: "Response",
      docType: "SAML Response",
      assertionCount: 1,
      firstSigned: true,
      sigLabel: "RSA-SHA256",
      weakSig: false,
      weakDigest: false,
      statusSuccess: true,
      issuer: "https://idp.example.com",
      nameId: "user@example.com",
      nameIdFormatLabel: "emailAddress",
      audiences: ["https://sp.example.com"],
      attributeCount: 2,
      authnContextLabel: "PasswordProtectedTransport",
      requiredReasons: ["SIGNED_ASSERTION", "STATUS_SUCCESS"],
      forbiddenReasons: ["UNSIGNED", "WEAK_SIG_ALGO", "BEARER_NO_NOTONORAFTER", "NO_CONDITIONS"],
    },
  },
  {
    id: "base64-post-binding",
    description: "The signed response, base64-encoded (HTTP-POST binding)",
    input: b64(SIGNED_RESPONSE),
    expect: { docType: "SAML Response", assertionCount: 1, firstSigned: true, requiredReasons: ["SIGNED_ASSERTION"] },
  },
  {
    id: "unsigned-response",
    description: "Response with no signature anywhere -> UNSIGNED",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Issuer>https://idp.example.com</saml:Issuer>${SUCCESS}<saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Subject><saml:NameID>u</saml:NameID></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>https://sp.example.com</saml:Audience></saml:AudienceRestriction></saml:Conditions></saml:Assertion></samlp:Response>`,
    expect: { signedResponse: false, firstSigned: false, requiredReasons: ["UNSIGNED"], forbiddenReasons: ["SIGNED_ASSERTION", "SIGNED_RESPONSE"] },
  },
  {
    id: "weak-sha1-signature",
    description: "Assertion signed with RSA-SHA1 + SHA-1 digest -> WEAK flags",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z">${SUCCESS}<saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z">${sig(RSA_SHA1, D_SHA1)}<saml:Subject><saml:NameID>u</saml:NameID></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>x</saml:Audience></saml:AudienceRestriction></saml:Conditions></saml:Assertion></samlp:Response>`,
    expect: { firstSigned: true, sigLabel: "RSA-SHA1", weakSig: true, weakDigest: true, requiredReasons: ["SIGNED_ASSERTION", "WEAK_SIG_ALGO", "WEAK_DIGEST_ALGO"] },
  },
  {
    id: "bearer-missing-data",
    description: "Bearer subject with no NotOnOrAfter / Recipient -> BEARER_NO_* cautions",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z">${SUCCESS}<saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Subject><saml:NameID>u</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"/></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>x</saml:Audience></saml:AudienceRestriction></saml:Conditions></saml:Assertion></samlp:Response>`,
    expect: { requiredReasons: ["BEARER_NO_NOTONORAFTER", "BEARER_NO_RECIPIENT", "UNSIGNED"] },
  },
  {
    id: "no-conditions",
    description: "Assertion with no Conditions element -> NO_CONDITIONS",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z">${SUCCESS}<saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Subject><saml:NameID>u</saml:NameID></saml:Subject></saml:Assertion></samlp:Response>`,
    expect: { requiredReasons: ["NO_CONDITIONS"] },
  },
  {
    id: "no-audience-restriction",
    description: "Conditions present but no AudienceRestriction -> NO_AUDIENCE_RESTRICTION",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z">${SUCCESS}<saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Subject><saml:NameID>u</saml:NameID></saml:Subject><saml:Conditions NotBefore="2026-06-29T11:55:00Z" NotOnOrAfter="2026-06-29T12:05:00Z"/></saml:Assertion></samlp:Response>`,
    expect: { requiredReasons: ["NO_AUDIENCE_RESTRICTION"], forbiddenReasons: ["NO_CONDITIONS"] },
  },
  {
    id: "status-not-success",
    description: "Responder failure status -> STATUS_NOT_SUCCESS",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Issuer>https://idp.example.com</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Responder"><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:AuthnFailed"/></samlp:StatusCode></samlp:Status></samlp:Response>`,
    expect: { statusSuccess: false, assertionCount: 0, requiredReasons: ["STATUS_NOT_SUCCESS"], forbiddenReasons: ["STATUS_SUCCESS"] },
  },
  {
    id: "encrypted-assertion",
    description: "EncryptedAssertion present -> ENCRYPTED_ASSERTION, not decoded",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z">${SUCCESS}<saml:EncryptedAssertion><xenc:EncryptedData xmlns:xenc="http://www.w3.org/2001/04/xmlenc#"/></saml:EncryptedAssertion></samlp:Response>`,
    expect: { encryptedAssertionCount: 1, assertionCount: 0, requiredReasons: ["ENCRYPTED_ASSERTION"] },
  },
  {
    id: "bare-assertion",
    description: "Standalone saml:Assertion as the document element",
    input: `<saml:Assertion ${NS} ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Issuer>https://idp.example.com</saml:Issuer>${sig(RSA_SHA256, D_SHA256)}<saml:Subject><saml:NameID>u</saml:NameID></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>x</saml:Audience></saml:AudienceRestriction></saml:Conditions></saml:Assertion>`,
    expect: { rootLocal: "Assertion", docType: "Assertion", assertionCount: 1, firstSigned: true, requiredReasons: ["SIGNED_ASSERTION"] },
  },
  {
    id: "multiple-assertions",
    description: "Two assertions -> MULTIPLE_ASSERTIONS caution",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z">${SUCCESS}<saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Subject><saml:NameID>u1</saml:NameID></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>x</saml:Audience></saml:AudienceRestriction></saml:Conditions></saml:Assertion><saml:Assertion ID="b" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Subject><saml:NameID>u2</saml:NameID></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>x</saml:Audience></saml:AudienceRestriction></saml:Conditions></saml:Assertion></samlp:Response>`,
    expect: { assertionCount: 2, requiredReasons: ["MULTIPLE_ASSERTIONS"] },
  },
  {
    id: "cdata-and-entities",
    description: "Attribute value with CDATA + an &amp; entity decodes correctly",
    input: `<samlp:Response ${NS} ID="_r" Version="2.0" IssueInstant="2026-06-29T12:00:00Z">${SUCCESS}<saml:Assertion ID="a" Version="2.0" IssueInstant="2026-06-29T12:00:00Z"><saml:Subject><saml:NameID>a&amp;b</saml:NameID></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>x</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AttributeStatement><saml:Attribute Name="cn"><saml:AttributeValue><![CDATA[Doe & Co]]></saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`,
    expect: { nameId: "a&b", attributeCount: 1, requiredReasons: ["UNSIGNED"] },
  },
];

export const SAML_REJECT_VECTORS: SamlRejectVector[] = [
  {
    id: "xxe-external-entity",
    description: "MANDATORY: external-entity DOCTYPE must be rejected, never expanded",
    input: `<?xml version="1.0"?>\n<!DOCTYPE Response [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>\n<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">&xxe;</samlp:Response>`,
    expectCode: "doctype-forbidden",
  },
  {
    id: "xxe-base64",
    description: "Base64-wrapped XXE must also be rejected after decode",
    input: b64(`<!DOCTYPE Response [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">&xxe;</samlp:Response>`),
    expectCode: "doctype-forbidden",
  },
  {
    id: "billion-laughs",
    description: "Internal-DTD entity expansion (billion laughs) rejected at the DOCTYPE",
    input: `<!DOCTYPE lolz [ <!ENTITY lol "lol"> <!ENTITY lol2 "&lol;&lol;&lol;"> ]><samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">&lol2;</samlp:Response>`,
    expectCode: "doctype-forbidden",
  },
  { id: "empty", description: "Empty input", input: "   ", expectCode: "empty" },
  { id: "gibberish", description: "Neither XML nor base64", input: "this is not xml @@@@", expectCode: "not-decodable" },
  {
    id: "deflated-redirect",
    description: "Base64 that decodes to non-XML bytes (deflate / Redirect binding)",
    input: btoa(String.fromCharCode(0x78, 0x9c, 0x4b, 0xcc)),
    expectCode: "deflated",
  },
  {
    id: "malformed-unclosed",
    description: "Unclosed element",
    input: `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">x`,
    expectCode: "malformed",
  },
  {
    id: "not-saml",
    description: "Well-formed XML that is not a SAML message",
    input: `<html><body><p>hello</p></body></html>`,
    expectCode: "no-saml",
  },
];

/** Run all vectors. Returns a pass/fail summary with human-readable failures. */
export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of SAML_GOLDEN_VECTORS) {
    try {
      const r = analyzeSaml(v.input);
      const e = v.expect;
      const codes = new Set(r.reasons.map((x) => x.code));
      const a0 = r.assertions[0];
      const errs: string[] = [];
      const eq = (name: string, got: unknown, want: unknown) => {
        if (want !== undefined && got !== want) errs.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
      };
      eq("rootLocal", r.rootLocal, e.rootLocal);
      eq("docType", r.docType, e.docType);
      eq("signedResponse", r.signedResponse, e.signedResponse);
      eq("assertionCount", r.assertions.length, e.assertionCount);
      eq("statusSuccess", r.message.status?.success, e.statusSuccess);
      eq("encryptedAssertionCount", r.encryptedAssertionCount, e.encryptedAssertionCount);
      eq("issuer", r.message.issuer, e.issuer);
      if (e.firstSigned !== undefined) eq("firstSigned", a0?.signed, e.firstSigned);
      if (e.sigLabel !== undefined) eq("sigLabel", a0?.signatureAlgorithms?.sigLabel, e.sigLabel);
      if (e.weakSig !== undefined) eq("weakSig", a0?.signatureAlgorithms?.weakSig, e.weakSig);
      if (e.weakDigest !== undefined) eq("weakDigest", a0?.signatureAlgorithms?.weakDigest, e.weakDigest);
      if (e.nameId !== undefined) eq("nameId", a0?.subject?.nameId, e.nameId);
      if (e.nameIdFormatLabel !== undefined) eq("nameIdFormatLabel", a0?.subject?.nameIdFormatLabel, e.nameIdFormatLabel);
      if (e.authnContextLabel !== undefined) eq("authnContextLabel", a0?.authn?.contextClassLabel, e.authnContextLabel);
      if (e.attributeCount !== undefined) eq("attributeCount", a0?.attributes.length, e.attributeCount);
      if (e.audiences !== undefined) {
        const got = JSON.stringify(a0?.conditions?.audiences ?? []);
        if (got !== JSON.stringify(e.audiences)) errs.push(`audiences: got ${got} want ${JSON.stringify(e.audiences)}`);
      }
      for (const code of e.requiredReasons) if (!codes.has(code)) errs.push(`missing reason ${code}`);
      for (const code of e.forbiddenReasons ?? []) if (codes.has(code)) errs.push(`unexpected reason ${code}`);
      if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
      else passed++;
    } catch (err) {
      failures.push(`[${v.id}] threw ${err instanceof SamlParseError ? err.code : String(err)}`);
    }
  }

  for (const v of SAML_REJECT_VECTORS) {
    try {
      analyzeSaml(v.input);
      failures.push(`[${v.id}] expected reject ${v.expectCode} but parsed successfully`);
    } catch (err) {
      if (err instanceof SamlParseError && err.code === v.expectCode) passed++;
      else failures.push(`[${v.id}] got ${err instanceof SamlParseError ? err.code : String(err)} want ${v.expectCode}`);
    }
  }

  return { passed, failed: failures.length, failures };
}
