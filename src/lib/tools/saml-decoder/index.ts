// ============================================================================
// src/lib/tools/saml-decoder/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING SAML-DECODER MODULE - a self-contained {manifest, run, vectors}
// triple, mirroring the cipher / secure-headers reference modules, written so
// it could be lifted into an open library unchanged if the project is ever
// opened. For now it lives here and powers the saml-decoder tool UI.
//
// Catalogue rank 2 (Security & WAF), deliberately kept SEPARATE from the generic
// xml-decoder (merge M6 was rejected): a SAML decoder needs SAML semantics, and
// both tools share the same XXE-hardened parsing discipline rather than the same
// code path.
//
// The manifest is a real D-49 manifest: https-only authoritative sources (OASIS
// SAML 2.0, the W3C XML-DSig / XML-Enc specs, and the OWASP cheat sheets),
// anchored (ReDoS-safe) inputDetectors[], dangerousInputHandling that names the
// xxe-guard explicitly, and - because a decoded assertion carries a NameID, user
// attributes, and a bearer token - shareSafetyDefault: "fragment" (keep the
// input out of the query string, server logs, and the Referer header).
//
// The decode is pure and deterministic (a hardened parse + rule-based, clock-
// independent assessment), so its golden vectors are stable.
// ============================================================================

import { analyzeSaml, type SamlReport } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  SAML_GOLDEN_VECTORS,
  SAML_REJECT_VECTORS,
} from "./golden-vectors";

// Re-export the compute surface + types at the module boundary.
export { analyzeSaml, SamlParseError } from "./compute";
export { REGISTRY_SNAPSHOT } from "./registry-data";
export type {
  SamlReport,
  SamlReason,
  SignatureAlgorithms,
  SubjectInfo,
  ConditionsInfo,
  AuthnInfo,
  SamlAttribute,
  AssertionInfo,
  StatusInfo,
  SamlParseErrorCode,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  SAML_GOLDEN_VECTORS,
  SAML_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { SamlGoldenVector, SamlRejectVector } from "./golden-vectors";

/** The D-49 declarative manifest for the saml-decoder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "saml-decoder",
  canonicalAliases: [
    "saml",
    "saml2",
    "saml-response-decoder",
    "saml-assertion-decoder",
    "sso-decoder",
  ],
  inputDetectors: [
    {
      // A SAML element open tag with a conventional SAML prefix. Single character
      // classes and a bounded alternation, anchored at "<", so it is linear and
      // ReDoS-safe.
      kind: "regex",
      pattern:
        "<(?:samlp|samlp2|saml2p|saml|saml2):(?:Response|Assertion|AuthnRequest|LogoutRequest|LogoutResponse)\\b",
      priority: 9,
      example: '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ...>',
    },
    {
      // The SAML 2.0 namespace URN, which appears in any raw SAML message.
      kind: "regex",
      pattern: "urn:oasis:names:tc:SAML:2\\.0:(?:protocol|assertion)",
      priority: 6,
      example: "urn:oasis:names:tc:SAML:2.0:assertion",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // hardened local parse + rule evaluation; no network
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // Anchored linear detectors + a single-scan parser (redos-guard) and outright
  // rejection of any DOCTYPE / entity declaration (xxe-guard).
  dangerousInputHandling: ["redos-guard", "xxe-guard"],
  shareSafetyDefault: "fragment", // a decoded assertion carries PII + a bearer token

  // -- Teaching & provenance --
  learnLinks: [
    "learn/saml-overview",
    "learn/saml-assertions-and-conditions",
    "learn/saml-signatures",
    "learn/xxe-and-xml-security",
    "learn/saml-bindings-and-sso-initiation",
  ],
  sources: [
    {
      id: "saml-core",
      label: "OASIS - SAML 2.0 Core (assertions and protocols)",
      type: "spec",
      url: "https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf",
      access_date: "2026-06-29",
      scope: "Assertion / Response structure, Subject, Conditions, Status, NameID",
      status: "active",
    },
    {
      id: "saml-bindings",
      label: "OASIS - SAML 2.0 Bindings",
      type: "spec",
      url: "https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf",
      access_date: "2026-06-29",
      scope: "HTTP-POST (base64) and HTTP-Redirect (DEFLATE) message encodings",
      status: "active",
    },
    {
      id: "saml-profiles",
      label: "OASIS - SAML 2.0 Profiles (Web Browser SSO)",
      type: "spec",
      url: "https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf",
      access_date: "2026-06-29",
      scope: "Web Browser SSO profile: bearer confirmation, audience, recipient checks",
      status: "active",
    },
    {
      id: "xmldsig-core1",
      label: "W3C - XML Signature Syntax and Processing 1.1",
      type: "spec",
      url: "https://www.w3.org/TR/xmldsig-core1/",
      access_date: "2026-06-29",
      scope: "ds:Signature, SignatureMethod / DigestMethod / CanonicalizationMethod URIs",
      status: "active",
    },
    {
      id: "xmlenc-core1",
      label: "W3C - XML Encryption Syntax and Processing 1.1",
      type: "spec",
      url: "https://www.w3.org/TR/xmlenc-core1/",
      access_date: "2026-06-29",
      scope: "EncryptedAssertion / EncryptedData structure (detected, not decrypted)",
      status: "active",
    },
    {
      id: "owasp-xxe",
      label: "OWASP - XML External Entity (XXE) Prevention Cheat Sheet",
      type: "guide",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html",
      access_date: "2026-06-29",
      scope: "why a DTD / external entity must be rejected when parsing untrusted XML",
      status: "active",
    },
    {
      id: "owasp-saml",
      label: "OWASP - SAML Security Cheat Sheet",
      type: "guide",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html",
      access_date: "2026-06-29",
      scope: "signature, audience, recipient, and replay checks for SAML responses",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Deterministic, XXE-hardened decode
 * only; throws a SamlParseError on empty / undecodable / deflate-compressed
 * input, or any DOCTYPE (the UI catches and localizes it).
 * @param input a raw SAML XML message, a URL-encoded form value, or base64 (POST binding)
 * @returns the decoded SAML report (message fields, assertions, assessment)
 */
export function run(input: string): SamlReport {
  return analyzeSaml(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = SAML_GOLDEN_VECTORS;
export const rejectVectors = SAML_REJECT_VECTORS;
