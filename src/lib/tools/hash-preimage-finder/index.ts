// ============================================================================
// src/lib/tools/hash-preimage-finder/index.ts
// ----------------------------------------------------------------------------
// HASH PREIMAGE FINDER - a {manifest, run, vectors} triple. Paste an MD5, SHA-1,
// or SHA-256 hash, pick a candidate alphabet and length, and watch a bounded,
// local brute-force search either recover a weak input in seconds or run out of
// keyspace on anything with real entropy. No dictionary, no wordlist, no
// precomputed table - just deterministic enumeration and hashing, in the
// browser, with a hard candidate budget.
//
// This is a TEACHING tool (see the compute.ts header for the D-53 rationale): it
// demonstrates why fast, unsalted hashes fail for low-entropy inputs, and it
// pairs every result with the standard defenses - salting (which defeats
// precomputed tables like crackstation), slow KDFs (which defeat brute force),
// and algorithm choice. It is browser-only by design and is NOT exposed over the
// HTTP API, because an unbounded search endpoint on a shared edge is
// compute-abusable (recorded as the API exclusion in registry.ts, D-72).
// ============================================================================

import { run as search } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { hashString, detectAlgorithm, candidateAt, keyspaceSize, CHARSETS, ALGO_META, MAX_CANDIDATES_PER_CALL } from "./compute";
export type { HashAlgo, CharsetId, PreimageInput, PreimageResult } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the hash-preimage-finder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Hashing",
  toolSlug: "hash-preimage-finder",
  canonicalAliases: [
    "hash-cracker",
    "hash-reverse",
    "reverse-hash",
    "md5-cracker",
    "md5-reverse",
    "sha1-cracker",
    "sha256-cracker",
    "hash-brute-force",
    "preimage-finder",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^[0-9a-fA-F]{32}$", priority: 3, example: "5f4dcc3b5aa765d61d8327deb882cf99" },
    { kind: "regex", pattern: "^[0-9a-fA-F]{40}$", priority: 3, example: "5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8" },
    { kind: "regex", pattern: "^[0-9a-fA-F]{64}$", priority: 3, example: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  // Browser-only by design: a bounded search is compute-heavy and abuse-prone on
  // a shared edge, so it is intentionally NOT exposed over the HTTP API. The
  // exclusion is enforced in registry.ts (D-72).
  apiCapabilityClass: "browser-only",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-search", "capped-keyspace", "never-fetches"],
  // A hash digest is not itself a secret, and nothing ever leaves the browser.
  shareSafetyDefault: "safe",

  // -- Teaching & provenance --
  learnLinks: [
    "learn/why-hashes-are-one-way",
    "learn/brute-force-vs-lookup-tables",
    "learn/why-salting-defeats-precomputed-tables",
    "learn/slow-kdfs-bcrypt-scrypt-argon2",
    "learn/keyspace-entropy-and-crack-time",
    "learn/choosing-a-password-hash",
  ],
  sources: [
    { id: "rfc1321", label: "RFC 1321 - The MD5 Message-Digest Algorithm", url: "https://www.rfc-editor.org/rfc/rfc1321" },
    { id: "rfc3174", label: "RFC 3174 - US Secure Hash Algorithm 1 (SHA1)", url: "https://www.rfc-editor.org/rfc/rfc3174" },
    { id: "fips180-4", label: "FIPS 180-4 - Secure Hash Standard (SHA-256)", url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final" },
    { id: "owasp-password-storage", label: "OWASP - Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" },
    { id: "nist-800-63b", label: "NIST SP 800-63B - Digital Identity Guidelines (Authentication)", url: "https://pages.nist.gov/800-63-3/sp800-63b.html" },
  ],
});

/** Tool entry point. Deterministic given (hash, charset, length, budget, start);
 *  delegates to the pure, bounded, local search engine. */
export function run(input: Parameters<typeof search>[0]) {
  return search(input);
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
