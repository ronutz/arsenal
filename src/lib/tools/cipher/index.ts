// ============================================================================
// src/lib/tools/cipher/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING CIPHER-SUITE MODULE - a self-contained {manifest, run, vectors}
// triple, mirroring the jwt / x509 / cidr reference modules, written so the
// whole folder could be lifted into an open library unchanged if the project
// is ever opened. For now it lives here and powers the cipher-suite tool UI.
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
// Named groups (TLS supported_groups): classical ECDHE/FFDHE + the PQ hybrids.
export {
  NAMED_GROUPS,
  NAMED_GROUPS_SNAPSHOT,
  decodeNamedGroup,
  formatCodepoint,
  isGreaseGroup,
  NAMED_GROUP_VECTORS,
  verifyNamedGroupVectors,
} from "./named-groups";
export type {
  NamedGroupRecord,
  NamedGroupKind,
  PqStatus,
  NamedGroupLookup,
  NamedGroupVector,
} from "./named-groups";

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
      id: "illustrated-tls12",
      label: "The Illustrated TLS 1.2 Connection (Michael Driscoll)",
      type: "guide",
      url: "https://tls12.xargs.org/",
      access_date: "2026-07-17",
      scope: "a byte-by-byte annotated TLS 1.2 handshake, showing where the negotiated cipher suite appears on the wire",
      status: "active",
    },
    {
      id: "illustrated-tls13",
      label: "The Illustrated TLS 1.3 Connection (Michael Driscoll)",
      type: "guide",
      url: "https://tls13.xargs.org/",
      access_date: "2026-07-17",
      scope: "a byte-by-byte annotated TLS 1.3 handshake, showing the short suite and the separated key_share negotiation",
      status: "active",
    },
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
      id: "iana-tls-supported-groups",
      label: "IANA TLS Supported Groups registry",
      type: "registry",
      url: "https://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#tls-parameters-8",
      access_date: "2026-06-30",
      scope: "authoritative code point ↔ name mapping for named groups, including the ML-KEM hybrids and the obsolete pre-standard groups",
      status: "active",
    },
    {
      id: "draft-ietf-tls-ecdhe-mlkem",
      label: "draft-ietf-tls-ecdhe-mlkem - Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLS 1.3",
      type: "draft",
      url: "https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem",
      access_date: "2026-06-30",
      scope: "defines X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024; their code points, share sizes, and Recommended flags",
      status: "active",
    },
    {
      id: "rfc7919",
      label: "RFC 7919 - Negotiated Finite Field Diffie-Hellman Ephemeral Parameters for TLS",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7919",
      access_date: "2026-06-30",
      scope: "the ffdhe2048..ffdhe8192 named groups and their code points",
      status: "active",
    },
    {
      id: "nist-fips-203",
      label: "NIST FIPS 203 - Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM)",
      type: "standard",
      url: "https://csrc.nist.gov/pubs/fips/203/final",
      access_date: "2026-06-30",
      scope: "the ML-KEM standard (2024) that the hybrid groups embed; basis for the post-quantum status",
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
