// ============================================================================
// src/lib/tools/ja4-fingerprint-decoder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Byte-exact golden vectors, taken from the FoxIO JA4 specification's own
// worked example (technical_details/JA4.md) and verified against it:
//   - full example:        t13d1516h2_8daaf6152771_e5627efa2ab1
//   - cipher hash (JA4_b):  8daaf6152771
//   - ext hash (JA4_c):     e5627efa2ab1  (extensions + signature algorithms)
//   - ext hash, no sigalgs: 6d807ffa2a79  (spec's second worked example)
//   - empty-list sentinels: 000000000000
// The raw compute vector uses the spec's ORIGINAL-ORDER (JA4_ro) values to prove
// the pipeline sorts and GREASE-filters correctly, arriving at the same hashes.
// ============================================================================

import { decodeJa4, computeCipherHash, computeExtensionHash, computeJa3 } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "ja4-fingerprint-decoder/2026-07-10";

// Spec worked example (original order, less GREASE) - the -o raw form.
const RAW_CIPHERS_ORIG = "1301,1302,1303,c02b,c02f,c02c,c030,cca9,cca8,c013,c014,009c,009d,002f,0035";
const RAW_EXTS_ORIG = "001b,0000,0033,0010,4469,0017,002d,000d,0005,0023,0012,002b,ff01,000b,000a,0015";
const RAW_SIGALGS = "0403,0804,0401,0503,0805,0501,0806,0601";

interface HashVector {
  id: string;
  fn: () => string;
  expect: string;
}
const HASH_VECTORS: HashVector[] = [
  { id: "cipher-hash", fn: () => computeCipherHash(RAW_CIPHERS_ORIG), expect: "8daaf6152771" },
  { id: "ext-hash-with-sigalgs", fn: () => computeExtensionHash(RAW_EXTS_ORIG, RAW_SIGALGS), expect: "e5627efa2ab1" },
  { id: "ext-hash-no-sigalgs", fn: () => computeExtensionHash(RAW_EXTS_ORIG, ""), expect: "6d807ffa2a79" },
  { id: "cipher-hash-empty-sentinel", fn: () => computeCipherHash(""), expect: "000000000000" },
  { id: "ext-hash-empty-sentinel", fn: () => computeExtensionHash("", ""), expect: "000000000000" },
];

interface DecodeVector {
  id: string;
  input: string;
  expectOk: boolean;
  expectMode?: "decoded" | "computed";
  expectFingerprint?: string;
  expectProtocol?: string; // JA4_a[0]
  expectVersion?: string; // label
  expectSni?: string; // code
  expectCiphers?: number;
  expectExtensions?: number;
  expectAlpn?: string; // code
  expectCipherHash?: string;
  expectExtHash?: string;
  expectErrorIncludes?: string;
}
const DECODE_VECTORS: DecodeVector[] = [
  {
    id: "decode-hashed-canonical",
    input: "t13d1516h2_8daaf6152771_e5627efa2ab1",
    expectOk: true,
    expectMode: "decoded",
    expectFingerprint: "t13d1516h2_8daaf6152771_e5627efa2ab1",
    expectProtocol: "t",
    expectVersion: "TLS 1.3",
    expectSni: "d",
    expectCiphers: 15,
    expectExtensions: 16,
    expectAlpn: "h2",
    expectCipherHash: "8daaf6152771",
    expectExtHash: "e5627efa2ab1",
  },
  {
    id: "compute-from-raw-original-order",
    input: `t13d1516h2_${RAW_CIPHERS_ORIG}_${RAW_EXTS_ORIG}_${RAW_SIGALGS}`,
    expectOk: true,
    expectMode: "computed",
    expectFingerprint: "t13d1516h2_8daaf6152771_e5627efa2ab1",
    expectCipherHash: "8daaf6152771",
    expectExtHash: "e5627efa2ab1",
  },
  {
    id: "reject-short-ja4a",
    input: "t13d15_8daaf6152771_e5627efa2ab1",
    expectOk: false,
    expectErrorIncludes: "10 characters",
  },
  {
    id: "reject-non-hex-bc",
    input: "t13d1516h2_nothexvalue0_e5627efa2ab1",
    expectOk: false,
    expectErrorIncludes: "12 lowercase hex",
  },
];

interface Ja3Vector {
  id: string;
  input: string;
  expectOk: boolean;
  expectHash?: string;
  expectSslVersion?: string;
  expectCiphers?: number;
  expectExtensions?: number;
  expectOpaque?: boolean;
  expectErrorIncludes?: string;
}
// Both string->MD5 pairs are the official salesforce/ja3 README examples.
const JA3_VECTORS: Ja3Vector[] = [
  {
    id: "ja3-canonical",
    input: "769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0",
    expectOk: true,
    expectHash: "ada70206e40642a3e4461f35503241d5",
    expectSslVersion: "TLS 1.0",
    expectCiphers: 12,
    expectExtensions: 3,
  },
  {
    id: "ja3-empty-extensions",
    input: "769,4-5-10-9-100-98-3-6-19-18-99,,,",
    expectOk: true,
    expectHash: "de350869b8c85de67a350c8d186f11e6",
    expectCiphers: 11,
    expectExtensions: 0,
  },
  {
    id: "ja3-bare-md5-opaque",
    input: "ada70206e40642a3e4461f35503241d5",
    expectOk: true,
    expectOpaque: true,
    expectHash: "ada70206e40642a3e4461f35503241d5",
  },
  {
    id: "ja3-reject-wrong-field-count",
    input: "769,47-53,0-10",
    expectOk: false,
    expectErrorIncludes: "five comma-separated",
  },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of HASH_VECTORS) {
    const got = v.fn();
    if (got !== v.expect) failures.push(`[hash:${v.id}] got ${got} want ${v.expect}`);
    else passed++;
  }

  for (const v of DECODE_VECTORS) {
    const r = decodeJa4(v.input);
    const errs: string[] = [];
    if (r.ok !== v.expectOk) errs.push(`ok: got ${r.ok} want ${v.expectOk}`);
    if (v.expectMode !== undefined && r.mode !== v.expectMode) errs.push(`mode: got ${r.mode} want ${v.expectMode}`);
    if (v.expectFingerprint !== undefined && r.fingerprint !== v.expectFingerprint) errs.push(`fingerprint: got ${r.fingerprint} want ${v.expectFingerprint}`);
    if (v.expectProtocol !== undefined && r.protocol?.code !== v.expectProtocol) errs.push(`protocol: got ${r.protocol?.code} want ${v.expectProtocol}`);
    if (v.expectVersion !== undefined && r.tlsVersion?.label !== v.expectVersion) errs.push(`version: got ${r.tlsVersion?.label} want ${v.expectVersion}`);
    if (v.expectSni !== undefined && r.sni?.code !== v.expectSni) errs.push(`sni: got ${r.sni?.code} want ${v.expectSni}`);
    if (v.expectCiphers !== undefined && r.cipherCount !== v.expectCiphers) errs.push(`ciphers: got ${r.cipherCount} want ${v.expectCiphers}`);
    if (v.expectExtensions !== undefined && r.extensionCount !== v.expectExtensions) errs.push(`extensions: got ${r.extensionCount} want ${v.expectExtensions}`);
    if (v.expectAlpn !== undefined && r.alpn?.code !== v.expectAlpn) errs.push(`alpn: got ${r.alpn?.code} want ${v.expectAlpn}`);
    if (v.expectCipherHash !== undefined && r.cipherHash !== v.expectCipherHash) errs.push(`cipherHash: got ${r.cipherHash} want ${v.expectCipherHash}`);
    if (v.expectExtHash !== undefined && r.extensionHash !== v.expectExtHash) errs.push(`extHash: got ${r.extensionHash} want ${v.expectExtHash}`);
    if (v.expectErrorIncludes !== undefined && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`error missing ${JSON.stringify(v.expectErrorIncludes)}`);
    if (errs.length) failures.push(`[decode:${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  for (const v of JA3_VECTORS) {
    const r = computeJa3(v.input);
    const errs: string[] = [];
    if (r.ok !== v.expectOk) errs.push(`ok: got ${r.ok} want ${v.expectOk}`);
    if (v.expectHash !== undefined && r.hash !== v.expectHash) errs.push(`hash: got ${r.hash} want ${v.expectHash}`);
    if (v.expectSslVersion !== undefined && r.sslVersion?.label !== v.expectSslVersion) errs.push(`sslVersion: got ${r.sslVersion?.label} want ${v.expectSslVersion}`);
    if (v.expectCiphers !== undefined && r.cipherCount !== v.expectCiphers) errs.push(`ciphers: got ${r.cipherCount} want ${v.expectCiphers}`);
    if (v.expectExtensions !== undefined && r.extensionCount !== v.expectExtensions) errs.push(`extensions: got ${r.extensionCount} want ${v.expectExtensions}`);
    if (v.expectOpaque !== undefined && !!r.opaque !== v.expectOpaque) errs.push(`opaque: got ${!!r.opaque} want ${v.expectOpaque}`);
    if (v.expectErrorIncludes !== undefined && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`error missing ${JSON.stringify(v.expectErrorIncludes)}`);
    if (errs.length) failures.push(`[ja3:${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  ...HASH_VECTORS.map((v) => v.id),
  ...DECODE_VECTORS.map((v) => v.id),
  ...JA3_VECTORS.map((v) => v.id),
];
