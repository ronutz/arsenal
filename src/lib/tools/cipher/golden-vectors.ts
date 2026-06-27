// ============================================================================
// src/lib/tools/cipher/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the cipher-suite decoder.
//
// Each accept vector pins a real, well-known suite: the INPUT exercises a
// resolution path (hex code point in several spellings, IANA name, OpenSSL
// name), and the expectation pins the decoded structure + the rule-based
// security rating. Code points and IANA names are cross-checked against the
// authoritative IANA TLS Cipher Suites registry (the vendored snapshot), so
// these tie the decoder to an independent reference, not to itself.
//
// Reject vectors assert that bad input throws the right stable code.
//
// `verifyVectors()` runs the whole set and returns a pass/fail report (used by
// the build/CI check and runnable standalone).
// ============================================================================

import { decodeCipherSuite, CipherDecodeError, type CipherDecodeErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "cipher-golden-v1";

/** The subset of decoded fields a golden vector asserts. */
export interface CipherExpectation {
  code: number;
  name: string;
  tls13: boolean;
  forwardSecrecy: boolean;
  aead: boolean;
  cipherAlgorithm: string;
  cipherKeyBits?: number;
  cipherMode: string;
  macOrPrf: string;
  rating: string;
  ianaRecommended: "Y" | "N" | "D";
}

export interface CipherGoldenVector {
  id: string;
  description: string;
  /** What the user types - exercises a resolution path. */
  input: string;
  expect: CipherExpectation;
}

export const CIPHER_GOLDEN_VECTORS: CipherGoldenVector[] = [
  {
    id: "tls13-aes128gcm",
    description: "TLS 1.3 AES-128-GCM, by hex",
    input: "0x1301",
    expect: { code: 0x1301, name: "TLS_AES_128_GCM_SHA256", tls13: true, forwardSecrecy: true, aead: true, cipherAlgorithm: "AES", cipherKeyBits: 128, cipherMode: "GCM", macOrPrf: "SHA-256", rating: "recommended", ianaRecommended: "Y" },
  },
  {
    id: "tls13-chacha",
    description: "TLS 1.3 ChaCha20-Poly1305, by IANA name",
    input: "TLS_CHACHA20_POLY1305_SHA256",
    expect: { code: 0x1303, name: "TLS_CHACHA20_POLY1305_SHA256", tls13: true, forwardSecrecy: true, aead: true, cipherAlgorithm: "ChaCha20", cipherKeyBits: 256, cipherMode: "Poly1305", macOrPrf: "SHA-256", rating: "recommended", ianaRecommended: "Y" },
  },
  {
    id: "ecdhe-rsa-gcm-openssl",
    description: "ECDHE-RSA-AES128-GCM, by OpenSSL name",
    input: "ECDHE-RSA-AES128-GCM-SHA256",
    expect: { code: 0xc02f, name: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", tls13: false, forwardSecrecy: true, aead: true, cipherAlgorithm: "AES", cipherKeyBits: 128, cipherMode: "GCM", macOrPrf: "SHA-256", rating: "recommended", ianaRecommended: "Y" },
  },
  {
    id: "ecdhe-ecdsa-chacha-commahex",
    description: "ECDHE-ECDSA-ChaCha20, by comma hex (lower-case)",
    input: "0xcc,0xa9",
    expect: { code: 0xcca9, name: "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256", tls13: false, forwardSecrecy: true, aead: true, cipherAlgorithm: "ChaCha20", cipherKeyBits: 256, cipherMode: "Poly1305", macOrPrf: "SHA-256", rating: "recommended", ianaRecommended: "Y" },
  },
  {
    id: "rsa-aes-cbc-sha1",
    description: "Static-RSA AES-128-CBC-SHA1 (no FS, CBC) -> weak",
    input: "TLS_RSA_WITH_AES_128_CBC_SHA",
    expect: { code: 0x002f, name: "TLS_RSA_WITH_AES_128_CBC_SHA", tls13: false, forwardSecrecy: false, aead: false, cipherAlgorithm: "AES", cipherKeyBits: 128, cipherMode: "CBC", macOrPrf: "SHA-1", rating: "weak", ianaRecommended: "D" },
  },
  {
    id: "3des-openssl",
    description: "3DES-EDE-CBC (Sweet32) by OpenSSL name -> weak",
    input: "DES-CBC3-SHA",
    expect: { code: 0x000a, name: "TLS_RSA_WITH_3DES_EDE_CBC_SHA", tls13: false, forwardSecrecy: false, aead: false, cipherAlgorithm: "3DES", cipherKeyBits: 168, cipherMode: "CBC", macOrPrf: "SHA-1", rating: "weak", ianaRecommended: "D" },
  },
  {
    id: "rc4",
    description: "RC4-128 (prohibited, RFC 7465) -> insecure",
    input: "0x0005",
    expect: { code: 0x0005, name: "TLS_RSA_WITH_RC4_128_SHA", tls13: false, forwardSecrecy: false, aead: false, cipherAlgorithm: "RC4", cipherKeyBits: 128, cipherMode: "stream", macOrPrf: "SHA-1", rating: "insecure", ianaRecommended: "D" },
  },
  {
    id: "null-cipher",
    description: "NULL encryption -> insecure",
    input: "TLS_RSA_WITH_NULL_SHA",
    expect: { code: 0x0002, name: "TLS_RSA_WITH_NULL_SHA", tls13: false, forwardSecrecy: false, aead: false, cipherAlgorithm: "NULL", cipherKeyBits: undefined, cipherMode: "none", macOrPrf: "SHA-1", rating: "insecure", ianaRecommended: "D" },
  },
  {
    id: "anon",
    description: "Anonymous DH (no authentication) -> insecure",
    input: "0x0034",
    expect: { code: 0x0034, name: "TLS_DH_anon_WITH_AES_128_CBC_SHA", tls13: false, forwardSecrecy: false, aead: false, cipherAlgorithm: "AES", cipherKeyBits: 128, cipherMode: "CBC", macOrPrf: "SHA-1", rating: "insecure", ianaRecommended: "D" },
  },
  {
    id: "dhe-rsa-gcm-discouraged",
    description: "DHE-RSA-AES256-GCM: strong crypto but IANA-discouraged (D) -> secure",
    input: "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384",
    expect: { code: 0x009f, name: "TLS_DHE_RSA_WITH_AES_256_GCM_SHA384", tls13: false, forwardSecrecy: true, aead: true, cipherAlgorithm: "AES", cipherKeyBits: 256, cipherMode: "GCM", macOrPrf: "SHA-384", rating: "secure", ianaRecommended: "D" },
  },
  {
    id: "psk-gcm-no-fs",
    description: "Plain PSK AES-128-GCM (AEAD but no forward secrecy) -> weak",
    input: "TLS_PSK_WITH_AES_128_GCM_SHA256",
    expect: { code: 0x00a8, name: "TLS_PSK_WITH_AES_128_GCM_SHA256", tls13: false, forwardSecrecy: false, aead: true, cipherAlgorithm: "AES", cipherKeyBits: 128, cipherMode: "GCM", macOrPrf: "SHA-256", rating: "weak", ianaRecommended: "N" },
  },
  {
    id: "tls13-ccm8",
    description: "TLS 1.3 AES-128-CCM_8 (truncated tag) -> weak, by bare hex",
    input: "1305",
    expect: { code: 0x1305, name: "TLS_AES_128_CCM_8_SHA256", tls13: true, forwardSecrecy: true, aead: true, cipherAlgorithm: "AES", cipherKeyBits: 128, cipherMode: "CCM_8", macOrPrf: "SHA-256", rating: "weak", ianaRecommended: "N" },
  },
];

export interface CipherRejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: CipherDecodeErrorCode;
}

export const CIPHER_REJECT_VECTORS: CipherRejectVector[] = [
  { id: "empty", description: "empty input", input: "   ", expectCode: "empty" },
  { id: "gibberish", description: "not a suite or hex", input: "hello world", expectCode: "format" },
  { id: "unassigned-hex", description: "valid hex but unassigned code point", input: "0xFFFF", expectCode: "unknown" },
];

export interface VectorFailure {
  id: string;
  field: string;
  expected: unknown;
  actual: unknown;
}

/** Run all vectors; returns counts + structured failures. */
export function verifyVectors(): { passed: number; failed: number; failures: VectorFailure[] } {
  const failures: VectorFailure[] = [];
  let passed = 0;

  for (const v of CIPHER_GOLDEN_VECTORS) {
    let d;
    try {
      d = decodeCipherSuite(v.input);
    } catch (e) {
      failures.push({ id: v.id, field: "throw", expected: "decoded", actual: String(e) });
      continue;
    }
    const checks: Array<[string, unknown, unknown]> = [
      ["code", v.expect.code, d.code],
      ["name", v.expect.name, d.name],
      ["tls13", v.expect.tls13, d.tls13],
      ["forwardSecrecy", v.expect.forwardSecrecy, d.components.forwardSecrecy],
      ["aead", v.expect.aead, d.components.aead],
      ["cipherAlgorithm", v.expect.cipherAlgorithm, d.components.cipherAlgorithm],
      ["cipherKeyBits", v.expect.cipherKeyBits, d.components.cipherKeyBits],
      ["cipherMode", v.expect.cipherMode, d.components.cipherMode],
      ["macOrPrf", v.expect.macOrPrf, d.components.macOrPrf],
      ["rating", v.expect.rating, d.security.rating],
      ["ianaRecommended", v.expect.ianaRecommended, d.ianaRecommended],
    ];
    let ok = true;
    for (const [field, expected, actual] of checks) {
      if (expected !== actual) {
        failures.push({ id: v.id, field, expected, actual });
        ok = false;
      }
    }
    if (ok) passed++;
  }

  for (const v of CIPHER_REJECT_VECTORS) {
    try {
      decodeCipherSuite(v.input);
      failures.push({ id: v.id, field: "noThrow", expected: v.expectCode, actual: "decoded ok" });
    } catch (e) {
      const code = e instanceof CipherDecodeError ? e.code : "unknown";
      if (code === v.expectCode) passed++;
      else failures.push({ id: v.id, field: "code", expected: v.expectCode, actual: code });
    }
  }

  return { passed, failed: failures.length, failures };
}
