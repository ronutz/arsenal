// ============================================================================
// src/lib/tools/ja3-tls-fingerprint/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: the two published Salesforce JA3 string->hash examples
// (authoritative), plus GREASE-invariance (stripping GREASE reproduces the
// clean hash), JA3N permutation-invariance (sorting extensions reproduces the
// canonical hash), version decoding, and negatives.
// ============================================================================

import { computeJa3, run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "ja3-tls-fingerprint/2026-07-11";

// Salesforce's own published examples (engineering.salesforce.com JA3 spec)
const SF1 = "769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0";
const SF1_HASH = "ada70206e40642a3e4461f35503241d5";
const SF2 = "769,4-5-10-9-100-98-3-6-19-18-99,,,";
const SF2_HASH = "de350869b8c85de67a350c8d186f11e6";

// SF1 with a GREASE value (2570 = 0x0a0a) injected into ciphers and extensions
const SF1_GREASE = "769,2570-47-53-5-10-49161-49162-49171-49172-50-56-19-4,2570-0-10-11,23-24-25,0";
// SF1 with the extension list permuted (11-0-10 instead of 0-10-11)
const SF1_PERMUTED = "769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,11-0-10,23-24-25,0";

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const ok = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  const a = computeJa3(SF1);
  ok("sf1-hash", a.ja3Hash === SF1_HASH, a.ja3Hash);
  ok("sf1-version", a.version === 769 && a.versionName === "TLS 1.0", JSON.stringify([a.version, a.versionName]));
  ok("sf1-counts", a.counts.ciphers === 12 && a.counts.extensions === 3 && a.counts.curves === 3 && a.counts.formats === 1, JSON.stringify(a.counts));
  ok("sf1-not-permuted", a.permuted === false && a.ja3nHash === SF1_HASH, JSON.stringify([a.permuted, a.ja3nHash]));

  const b = computeJa3(SF2);
  ok("sf2-hash", b.ja3Hash === SF2_HASH, b.ja3Hash);
  ok("sf2-empty-fields", b.counts.extensions === 0 && b.counts.curves === 0 && b.counts.formats === 0, JSON.stringify(b.counts));

  const g = computeJa3(SF1_GREASE);
  ok("grease-found", g.greaseFound.length === 2 && g.greaseFound.every((v) => v === 2570), JSON.stringify(g.greaseFound));
  ok("grease-invariant", g.ja3Hash === SF1_HASH, `${g.ja3Hash} (GREASE strip should reproduce SF1)`);

  const p = computeJa3(SF1_PERMUTED);
  ok("permuted-flag", p.permuted === true, JSON.stringify(p.permuted));
  ok("permuted-ja3-differs", p.ja3Hash !== SF1_HASH, "permuted JA3 should differ from canonical");
  ok("ja3n-stable", p.ja3nHash === SF1_HASH, `${p.ja3nHash} (JA3N should reproduce SF1 after sorting extensions)`);

  // TLS 1.2 version decode
  const v = computeJa3("771,4865-4866,0-23,29,0");
  ok("tls12", v.versionName === "TLS 1.2", v.versionName);

  // run() + negatives
  ok("run-string", run(SF1).ja3Hash === SF1_HASH);
  ok("reject-wrong-fieldcount", computeJa3("769,47-53,0-10").ok === false, "3 fields should be rejected");
  ok("reject-empty", computeJa3("").ok === false);
  ok("reject-bad-version", computeJa3("abc,4-5,0,23,0").ok === false, "non-integer version should be rejected");

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "sf1-hash", "sf1-version", "sf1-counts", "sf1-not-permuted", "sf2-hash", "sf2-empty-fields",
  "grease-found", "grease-invariant", "permuted-flag", "permuted-ja3-differs", "ja3n-stable", "tls12",
  "run-string", "reject-wrong-fieldcount", "reject-empty", "reject-bad-version",
];
