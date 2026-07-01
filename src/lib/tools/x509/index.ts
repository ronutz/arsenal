// ============================================================================
// src/lib/tools/x509/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING X.509 MODULE - a self-contained {manifest, run, vectors} triple.
//
// Mirrors the jwt / cidr reference modules, written so the whole folder could
// be lifted into an open library unchanged if the project is ever opened. For
// now it lives here and is consumed by the X.509 tool UI.
//
// The manifest is a real D-49 manifest, checked against the D-49 contract
// (https-only sources, no raw HTML); the inputDetectors[] regex is
// what would let an omnibox route a pasted PEM block to this tool, and although
// a certificate is public by nature it can still reveal internal hostnames via
// its SANs, so the manifest declares shareSafetyDefault: "fragment" to keep a
// pasted certificate in the URL fragment, never transmitted.
// ============================================================================

import { decodeCertificate, type DecodedCertificate } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  X509_GOLDEN_VECTORS,
  X509_REJECT_VECTORS,
} from "./golden-vectors";

// Re-export vector metadata + types at the module boundary (CI / host wiring).
export {
  GOLDEN_VECTOR_SET_ID,
  X509_GOLDEN_VECTORS,
  X509_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type {
  DecodedCertificate,
  DistinguishedName,
  DnAttribute,
  CertValidity,
  PublicKeyInfo,
  SanEntry,
  CertExtensions,
  X509DecodeErrorCode,
} from "./compute";
export { X509DecodeError } from "./compute";

/** The D-49 declarative manifest for the X.509 tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "PKI",
  toolSlug: "x509",
  canonicalAliases: ["x509-decode", "certificate-decode", "cert-decode", "pem-decode"],
  inputDetectors: [
    {
      // A PEM certificate block. The body is a single character class repeated,
      // anchored on both sides, so it is linear and ReDoS-safe.
      kind: "regex",
      pattern: "-----BEGIN CERTIFICATE-----[A-Za-z0-9+/=\\s]+-----END CERTIFICATE-----",
      priority: 10,
      example: "-----BEGIN CERTIFICATE-----\\nMIIB...\\n-----END CERTIFICATE-----",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // pure local parse; no network, no key material
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard", "depth-limit"], // anchored detectors + MAX_DEPTH DER guard
  shareSafetyDefault: "fragment", // a cert can carry internal hostnames in its SANs

  // -- Teaching & provenance --
  learnLinks: ["learn/x509-anatomy"],
  sources: [
    {
      id: "rfc5280",
      label: "RFC 5280 - Internet X.509 PKI Certificate and CRL Profile",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc5280",
      access_date: "2026-06-26",
      scope: "TBSCertificate fields, validity, standard v3 extensions",
      status: "active",
    },
    {
      id: "x690",
      label: "ITU-T X.690 - ASN.1 encoding rules (BER, CER, DER)",
      type: "spec",
      url: "https://www.itu.int/rec/T-REC-X.690",
      access_date: "2026-06-26",
      scope: "DER tag-length-value encoding the parser walks",
      status: "active",
    },
    {
      id: "rfc4514",
      label: "RFC 4514 - String Representation of Distinguished Names",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4514",
      access_date: "2026-06-26",
      scope: "the most-specific-first DN one-line rendering",
      status: "active",
    },
    {
      id: "rfc5480",
      label: "RFC 5480 - Elliptic Curve Cryptography Subject Public Key Info",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc5480",
      access_date: "2026-06-26",
      scope: "named-curve OIDs (P-256/P-384/P-521) in the key info",
      status: "active",
    },
    {
      id: "rfc6960",
      label: "RFC 6960 - X.509 Internet PKI Online Certificate Status Protocol",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc6960",
      access_date: "2026-06-29",
      scope: "OCSP responder location, surfaced from Authority Information Access",
      status: "active",
    },
    {
      id: "rfc7633",
      label: "RFC 7633 - X.509 TLS Feature Extension (Must-Staple)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7633",
      access_date: "2026-06-29",
      scope: "the TLS Feature extension and the status_request (Must-Staple) flag",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Deterministic decode only; throws an
 * X509DecodeError on malformed input (the UI catches and localizes it).
 * @param input a certificate as PEM, bare base64, or hex
 * @returns the decoded structure
 */
export function run(input: string): DecodedCertificate {
  return decodeCertificate(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = X509_GOLDEN_VECTORS;
export const rejectVectors = X509_REJECT_VECTORS;
