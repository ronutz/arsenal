// ============================================================================
// csr-decoder / index.ts
// ----------------------------------------------------------------------------
// Public surface for the CSR decoder: the deterministic compute, the golden
// vectors, and the tool manifest (learn links + reference sources surfaced on
// the tool page).
// ============================================================================

export {
  decodeCsr,
  run,
  CsrDecodeError,
} from "./compute";
export type {
  DecodedCsr,
  DistinguishedName,
  DnAttribute,
  PublicKeyInfo,
  SanEntry,
  RequestedExtensions,
  CsrAttribute,
  CsrInput,
  CsrDecodeErrorCode,
} from "./compute";

export {
  verifyVectors,
  GOLDEN_VECTOR_SET_ID,
} from "./golden-vectors";
export type { VectorResult } from "./golden-vectors";

/**
 * Tool manifest. `learnLinks` point at the explainer articles that are most
 * relevant to a CSR; `sources` are the specs surfaced as reference links on
 * the tool page. Frozen so it cannot be mutated at runtime.
 */
export const manifest = Object.freeze({
  toolSlug: "csr-decoder",
  learnLinks: [
    "learn/certificate-signing-request",
    "learn/certificate-formats",
    "learn/x509-anatomy",
    "learn/certificate-validation",
    "learn/public-vs-private-pki",
  ],
  sources: [
    {
      id: "rfc2986",
      label: "RFC 2986 — PKCS #10: Certification Request Syntax Specification v1.7",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc2986",
      access_date: "2026-06-30",
      scope: "CertificationRequest / CertificationRequestInfo structure",
      status: "active",
    },
    {
      id: "rfc2985",
      label: "RFC 2985 — PKCS #9: Selected Object Classes and Attribute Types",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc2985",
      access_date: "2026-06-30",
      scope: "extensionRequest, challengePassword, unstructuredName attributes",
      status: "active",
    },
    {
      id: "rfc5280",
      label: "RFC 5280 — Internet X.509 PKI Certificate and CRL Profile",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc5280",
      access_date: "2026-06-30",
      scope: "Name, SubjectPublicKeyInfo, Extensions encodings reused by CSRs",
      status: "active",
    },
    {
      id: "itu-x690",
      label: "ITU-T X.690 — ASN.1 encoding rules (BER/CER/DER)",
      type: "spec",
      url: "https://www.itu.int/rec/T-REC-X.690",
      access_date: "2026-06-30",
      scope: "DER tag-length-value encoding the decoder parses",
      status: "active",
    },
  ],
});
