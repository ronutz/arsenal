// ============================================================================
// src/lib/tools/hash/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING HASH MODULE - a self-contained {manifest, run, vectors} triple.
// run() is async here (Web Crypto digest is a Promise); the manifest is
// otherwise the same D-49 shape as the other tools.
//
// inputDetector is a heuristic, not a regex: any text can be hashed, so there
// is no distinctive pattern to route on. executionClass is localOnly (the
// digest is one-way and safe to publish), but shareSafetyDefault is "fragment"
// because the INPUT may be a secret (e.g. a password being hashed), so a result
// permalink should keep it in the URL fragment, never an indexable path.
// ============================================================================

import { hashAll, HASH_ALGORITHMS, type HashResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  HASH_GOLDEN_VECTORS,
  HASH_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  HASH_GOLDEN_VECTORS,
  HASH_REJECT_VECTORS,
} from "./golden-vectors";
export { HASH_ALGORITHMS } from "./compute";
export type { HashResult, HashDigest, HashAlgorithm } from "./compute";

/** The D-49 declarative manifest for the Hash tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Hashing",
  toolSlug: "hash",
  canonicalAliases: ["sha256", "sha", "digest", "checksum", "sha512"],
  inputDetectors: [
    {
      // Any text is hashable, so there is no distinctive pattern. A low-priority
      // heuristic carries the example the schema requires.
      kind: "heuristic",
      priority: 1,
      example: "hash this text",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"], // the digest is one-way; nothing leaves the device
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["secret-redaction"], // input may be a secret
  shareSafetyDefault: "fragment", // keep a (possibly secret) input out of indexable URLs

  // -- Teaching & provenance --
  learnLinks: ["learn/hashing"],
  sources: [
    {
      id: "fips180-4",
      label: "FIPS 180-4 - Secure Hash Standard (SHA-1/256/384/512)",
      type: "nist",
      url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final",
      access_date: "2026-06-26",
      scope: "definitions of the SHA family",
      status: "active",
    },
    {
      id: "rfc6234",
      label: "RFC 6234 - US Secure Hash Algorithms",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc6234",
      access_date: "2026-06-26",
      scope: "SHA + HMAC reference and test vectors",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. ASYNC: computes every supported
 * digest of the input's UTF-8 bytes via Web Crypto. Never throws.
 * @param input arbitrary text to hash
 */
export async function run(input: string): Promise<HashResult> {
  return hashAll(input);
}

export const goldenVectors = HASH_GOLDEN_VECTORS;
export const rejectVectors = HASH_REJECT_VECTORS;
