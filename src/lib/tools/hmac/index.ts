// ============================================================================
// src/lib/tools/hmac/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING HMAC MODULE - a netcore {manifest, run, vectors} triple.
//
// Two divergences from the single-string tools, both inherent to HMAC:
//   - run() is async (Web Crypto), like the hash tool.
//   - run() takes an OBJECT (message + key + algorithm), because HMAC is keyed.
// The key is a secret, so executionClass includes sensitiveArtifact and
// shareSafetyDefault is "fragment" (a result permalink must keep the inputs out
// of any indexable path). inputDetector is a heuristic, not a regex: HMAC cannot
// be routed from a single pasted string because it needs a separate key.
// ============================================================================

import { computeHmac, HMAC_ALGORITHMS, type HmacInput, type HmacResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  HMAC_GOLDEN_VECTORS,
  HMAC_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  HMAC_GOLDEN_VECTORS,
  HMAC_REJECT_VECTORS,
} from "./golden-vectors";
export { HMAC_ALGORITHMS } from "./compute";
export type { HmacInput, HmacResult, HmacAlgorithm } from "./compute";

/** The D-49 declarative manifest for the HMAC tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Hashing & Crypto",
  toolSlug: "hmac",
  canonicalAliases: ["hmac-sha256", "hmac-sha512", "keyed-hash", "mac"],
  inputDetectors: [
    {
      // HMAC needs a separate key, so it cannot be routed from one pasted
      // string. A low-priority heuristic carries the example the schema requires.
      kind: "heuristic",
      priority: 1,
      example: "message to authenticate",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly", "sensitiveArtifact"], // the key is a secret
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["secret-redaction"],
  shareSafetyDefault: "fragment", // keep the secret key out of indexable URLs

  // -- Teaching & provenance --
  learnLinks: ["learn/hmac"],
  sources: [
    {
      id: "rfc2104",
      label: "RFC 2104 - HMAC: Keyed-Hashing for Message Authentication",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc2104",
      access_date: "2026-06-26",
      scope: "the HMAC construction",
      status: "active",
    },
    {
      id: "rfc4231",
      label: "RFC 4231 - HMAC-SHA Identifiers and Test Vectors",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4231",
      access_date: "2026-06-26",
      scope: "HMAC-SHA-256/384/512 test vectors",
      status: "active",
    },
    {
      id: "fips198-1",
      label: "FIPS 198-1 - The Keyed-Hash Message Authentication Code (HMAC)",
      type: "nist",
      url: "https://csrc.nist.gov/pubs/fips/198-1/final",
      access_date: "2026-06-26",
      scope: "NIST standard for HMAC",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
  license: { code: "Apache-2.0", content: "CC-BY-4.0" },
});

/**
 * run - the registry-facing entry point. ASYNC and object-input: computes HMAC
 * over the message keyed by the key, for the chosen algorithm.
 */
export async function run(input: HmacInput): Promise<HmacResult> {
  return computeHmac(input);
}

export const goldenVectors = HMAC_GOLDEN_VECTORS;
export const rejectVectors = HMAC_REJECT_VECTORS;
