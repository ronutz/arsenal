// ============================================================================
// src/lib/tools/hash-preimage-finder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Two kinds of vectors, so the tool is proven correct rather than merely
// self-consistent:
//   1. HASH CORRECTNESS - each in-house MD5/SHA-1/SHA-256 is pinned to its
//      published digest (RFC 1321 / RFC 3174 / FIPS 180-4 test vectors). If a
//      hash were subtly wrong, the search would still be "consistent" with
//      itself, so these external pins are what actually guarantee correctness.
//   2. SEARCH BEHAVIOR - the bounded search finds known weak inputs, exhausts a
//      keyspace without a false positive, and reports a spent budget correctly.
// ============================================================================

import { run, hashString, detectAlgorithm, keyspaceSize, CHARSETS } from "./compute";
import type { HashAlgo } from "./compute";

export const SET_ID = "hash-preimage-finder/2026-07-01";

interface Vector {
  name: string;
  exec: () => string | null; // null = pass, string = failure detail
}

const eq = (label: string, got: unknown, want: unknown): string | null =>
  got === want ? null : `${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`;
const all = (...rs: (string | null)[]): string | null => rs.filter((r) => r !== null).join("; ") || null;

// Published digests (external ground truth).
const HASH_PINS: Array<[HashAlgo, string, string]> = [
  ["md5", "", "d41d8cd98f00b204e9800998ecf8427e"],
  ["md5", "abc", "900150983cd24fb0d6963f7d28e17f72"],
  ["md5", "The quick brown fox jumps over the lazy dog", "9e107d9d372bb6826bd81d3542a419d6"],
  ["sha1", "", "da39a3ee5e6b4b0d3255bfef95601890afd80709"],
  ["sha1", "abc", "a9993e364706816aba3e25717850c26c9cd0d89d"],
  ["sha256", "", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
  ["sha256", "abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
  ["sha256", "hello", "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"],
];

export const VECTORS: Vector[] = [
  // ---- 1. hash correctness ----
  ...HASH_PINS.map(([algo, input, want]): Vector => ({
    name: `${algo}("${input.slice(0, 12)}")`,
    exec: () => eq("digest", hashString(algo, input), want),
  })),

  // ---- 2. detection ----
  { name: "detect-md5", exec: () => eq("algo", detectAlgorithm("d41d8cd98f00b204e9800998ecf8427e"), "md5") },
  { name: "detect-sha1", exec: () => eq("algo", detectAlgorithm("a9993e364706816aba3e25717850c26c9cd0d89d"), "sha1") },
  { name: "detect-sha256", exec: () => eq("algo", detectAlgorithm("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"), "sha256") },
  { name: "detect-garbage-null", exec: () => eq("algo", detectAlgorithm("not-a-hash"), null) },
  { name: "detect-wrong-length-null", exec: () => eq("algo", detectAlgorithm("abcdef"), null) },

  // ---- 3. cracking known weak inputs ----
  {
    name: "crack-md5-pin-1234",
    exec: () => {
      const r = run({ hash: hashString("md5", "1234"), charset: "digits", maxLength: 4 });
      return all(eq("found", r.found, true), eq("preimage", r.preimage, "1234"), eq("broken", r.broken, true));
    },
  },
  {
    name: "crack-sha1-word-abc",
    exec: () => {
      const r = run({ hash: hashString("sha1", "abc"), charset: "lower", maxLength: 3 });
      return all(eq("found", r.found, true), eq("preimage", r.preimage, "abc"));
    },
  },
  {
    name: "crack-sha256-42",
    exec: () => {
      const r = run({ hash: hashString("sha256", "42"), charset: "digits", maxLength: 2 });
      return all(eq("found", r.found, true), eq("preimage", r.preimage, "42"), eq("fast", r.fast, true), eq("broken", r.broken, false));
    },
  },
  {
    name: "crack-single-char",
    exec: () => {
      const r = run({ hash: hashString("md5", "7"), charset: "digits", maxLength: 1 });
      return all(eq("found", r.found, true), eq("preimage", r.preimage, "7"));
    },
  },
  {
    name: "crack-lower-digits-alphabet",
    exec: () => {
      const r = run({ hash: hashString("md5", "a1"), charset: "lower-digits", maxLength: 2 });
      return all(eq("found", r.found, true), eq("preimage", r.preimage, "a1"));
    },
  },

  // ---- 4. exhaustion without a false positive ----
  {
    name: "miss-exhausts-clean",
    exec: () => {
      // Target is a lowercase string; searching the digit keyspace must exhaust
      // it entirely and report no match (no false positive).
      const r = run({ hash: hashString("md5", "zz"), charset: "digits", maxLength: 2 });
      return all(eq("found", r.found, false), eq("exhausted", r.exhausted, true), eq("budgetReached", r.budgetReached, false),
        eq("attempts", r.attempts, keyspaceSize(10, 2)));
    },
  },

  // ---- 5. budget accounting + resumability ----
  {
    name: "budget-stops-and-resumes",
    exec: () => {
      const target = hashString("md5", "9999"); // near the end of the digit/4 keyspace
      const r = run({ hash: target, charset: "digits", maxLength: 4, maxCandidates: 3, startIndex: 0 });
      return all(eq("found", r.found, false), eq("budgetReached", r.budgetReached, true),
        eq("attempts", r.attempts, 3), eq("nextIndex", r.nextIndex, 3), eq("exhausted", r.exhausted, false));
    },
  },
  {
    name: "keyspace-size-reported",
    exec: () => {
      const r = run({ hash: hashString("md5", "5"), charset: "digits", maxLength: 3 });
      // digits, len 1..3 = 10 + 100 + 1000 = 1110
      return all(eq("keyspaceSize", r.keyspaceSize, 1110), eq("maxLength", r.maxLength, 3));
    },
  },
  {
    name: "maxLength-clamped-to-charset-ceiling",
    exec: () => {
      // mixed-alnum ceiling is 5; asking for 9 must clamp.
      const r = run({ hash: hashString("md5", "ab"), charset: "mixed-alnum", maxLength: 9, maxCandidates: 1 });
      return eq("maxLength", r.maxLength, CHARSETS["mixed-alnum"].maxLength);
    },
  },
];

export function verifyVectors(): { setId: string; passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.exec();
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.name}: ${msg}`);
  }
  return { setId: SET_ID, passed: VECTORS.length - failures.length, failed: failures.length, failures };
}
