// ============================================================================
// src/lib/tools/cipher/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING CIPHER-SUITE MODULE - a netcore {manifest, run, vectors}
// triple, mirroring the jwt / x509 / cidr reference modules so it can be
// promoted into @ronutz/netcore unchanged (copy the folder into
// netcore/src/tools/cipher, add it to the package exports + registry, cut a
// minor bump). Until then it lives here and powers the cipher-suite tool UI.
//
// The manifest is a real D-49 manifest: https-only sources, anchored (ReDoS-safe)
// inputDetectors[] that would let an omnibox route a pasted "TLS_..." name or a
// "0x..,0x.." code point here, and - because a cipher suite identifier is public,
// non-sensitive protocol data - shareSafetyDefault: "param" (it is fine in the
// query string; nothing here ever needs hiding in the fragment).
//
// The decode is pure and deterministic (registry lookup + name parsing + a
// rule-based security assessment), so its golden vectors are stable.
// ============================================================================

import { decodeCipherSuite, type DecodedCipherSuite } from "./compute";
import { GOLDEN_VECTOR_SET_ID, CIPHER_GOLDEN_VECTORS, CIPHER_REJECT_VECTORS } from "./golden-vectors";

// Re-export the compute surface + vector metadata at the module boundary.
export {
  decodeCipherSuite,
  parseComponents,
  parseHexCode,
  CipherDecodeError,
  REGISTRY_SNAPSHOT,
} from "./compute";
export type {
  DecodedCipherSuite,
  CipherComponentInfo,
  SecurityAssessment,
  SecurityRating,
  CipherDecodeErrorCode,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  CIPHER_GOLDEN_VECTORS,
  CIPHER_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export { CIPHER_SUITES, type CipherSuiteRecord } from "./registry-data";

/** The D-49 declarative manifest for the cipher-suite tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "TLS & transport",
  toolSlug: "cipher",
  canonicalAliases: ["cipher-suite", "cipher-suite-decoder", "ciphersuite", "tls-cipher", "cipher-decode"],
  inputDetectors: [
    {
      // An IANA / GnuTLS cipher-suite name. Single character class, anchored,
      // so it is linear and ReDoS-safe.
      kind: "regex",
      pattern: "(?:TLS|SSL)_[A-Z0-9_]{3,}",
      priority: 9,
      example: "TLS_AES_128_GCM_SHA256",
    },
    {
      // A two-byte code point, "0xXX,0xXX" form.
      kind: "regex",
      pattern: "0x[0-9A-Fa-f]{2},?\\s?0x[0-9A-Fa-f]{2}",
      priority: 7,
      example: "0x13,0x01",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // pure local lookup + parse; no network
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // anchored, linear detectors + parser
  shareSafetyDefault: "param", // a cipher-suite identifier is public, non-sensitive

  // -- Teaching & provenance --
  learnLinks: [
    "learn/cipher-suite-anatomy",
    "learn/tls13-cipher-suites",
    "learn/aead-vs-cbc",
    "learn/forward-secrecy",
    "learn/cipher-suite-naming",
  ],
  sources: [
    {
      id: "iana-tls-params",
      label: "IANA TLS Cipher Suites registry",
      type: "registry",
      url: "https://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#tls-parameters-4",
      access_date: "2026-06-29",
      scope: "authoritative code point ↔ name mapping, the Recommended and DTLS-OK flags, and references",
      status: "active",
    },
    {
      id: "rfc8446",
      label: "RFC 8446 - The Transport Layer Security (TLS) Protocol Version 1.3",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8446",
      access_date: "2026-06-29",
      scope: "TLS 1.3 cipher-suite form (symmetric cipher + hash only); ephemeral key exchange",
      status: "active",
    },
    {
      id: "rfc5246",
      label: "RFC 5246 - The Transport Layer Security (TLS) Protocol Version 1.2",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc5246",
      access_date: "2026-06-29",
      scope: "the KX_AUTH_WITH_CIPHER_MAC suite structure for TLS 1.2 and earlier",
      status: "active",
    },
    {
      id: "rfc8447",
      label: "RFC 8447 - IANA Registry Updates for TLS and DTLS",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8447",
      access_date: "2026-06-29",
      scope: 'meaning of the "Recommended" column (Y / N / D); CCM_8 not recommended',
      status: "active",
    },
    {
      id: "rfc7465",
      label: "RFC 7465 - Prohibiting RC4 Cipher Suites",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7465",
      access_date: "2026-06-29",
      scope: "basis for rating any RC4 suite insecure",
      status: "active",
    },
    {
      id: "rfc8429",
      label: "RFC 8429 - Deprecate Triple-DES (3DES) and IDEA Cipher Suites for TLS",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8429",
      access_date: "2026-06-29",
      scope: "basis for rating 3DES (Sweet32) and IDEA suites weak",
      status: "active",
    },
    {
      id: "ciphersuite-info",
      label: "ciphersuite.info - cipher suite catalogue",
      type: "dataset",
      url: "https://ciphersuite.info/",
      access_date: "2026-06-29",
      scope: "OpenSSL and GnuTLS cross-names (the IANA registry lists neither)",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
  license: { code: "Apache-2.0", content: "CC-BY-4.0" },
});

/**
 * run - the registry-facing entry point. Deterministic decode only; throws a
 * CipherDecodeError on input that is empty, unrecognized, or an unassigned code
 * point (the UI catches and localizes it).
 * @param input a hex code point (any common spelling) or an IANA/OpenSSL/GnuTLS name
 * @returns the decoded structure
 */
export function run(input: string): DecodedCipherSuite {
  return decodeCipherSuite(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = CIPHER_GOLDEN_VECTORS;
export const rejectVectors = CIPHER_REJECT_VECTORS;
