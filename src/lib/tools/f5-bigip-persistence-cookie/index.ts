// ============================================================================
// src/lib/tools/f5-bigip-persistence-cookie/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING BIG-IP PERSISTENCE COOKIE MODULE - a self-contained
// {manifest, run, vectors} triple. Squarely in the F5 wheelhouse: a BIG-IP
// virtual server with cookie persistence inserts a BIGipServer<pool> cookie that
// encodes the chosen pool member's IP and port, and reading it by hand is a
// routine troubleshooting and security-review step.
//
// The decoder handles all four unencrypted F5 encodings and recognizes the
// AES-encrypted form. It is the prototypical information-disclosure finding: the
// cookie hands an unauthenticated client the address and port of an internal
// backend, so a decoded result points the reader at the mitigation (cookie
// encryption, F5 K7784).
//
// shareSafetyDefault: "fragment" - a decoded cookie reveals internal topology,
// so the input is kept out of the query string and server logs.
// ============================================================================

import { decodeBigipCookie, type BigipReport } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  BIGIP_GOLDEN_VECTORS,
  BIGIP_REJECT_VECTORS,
} from "./golden-vectors";

export { decodeBigipCookie, encodeBigipCookie, BigipParseError, BigipEncodeError } from "./compute";
export { REGISTRY_SNAPSHOT } from "./registry-data";
export type {
  BigipReport,
  BigipReason,
  BigipFormat,
  BigipParseErrorCode,
  BigipEncodeInput,
  BigipEncodeResult,
  BigipEncodeErrorCode,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  BIGIP_GOLDEN_VECTORS,
  BIGIP_REJECT_VECTORS,
  BIGIP_ENCODE_VECTORS,
  BIGIP_ENCODE_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { BigipGoldenVector, BigipRejectVector, BigipEncodeVector, BigipEncodeRejectVector } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-bigip-persistence-cookie tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "f5-bigip-persistence-cookie",
  canonicalAliases: ["bigip-persistence-cookie" /* pre-rename slug, 2026-07-03 */, 
    "bigip-cookie",
    "f5-cookie-decoder",
    "bigipserver",
    "f5-persistence-cookie",
    "bigip-cookie-decoder",
  ],
  inputDetectors: [
    {
      // The cookie name itself: the strongest signal.
      kind: "regex",
      pattern: "BIGipServer",
      priority: 9,
      example: "BIGipServerWEB=1677787402.20480.0000",
    },
    {
      // Default IPv4 value shape: <digits>.<digits>.0000
      kind: "regex",
      pattern: "[0-9]{6,10}\\.[0-9]{1,5}\\.0000",
      priority: 6,
      example: "1677787402.20480.0000",
    },
    {
      // Route-domain forms: rd<n>o<hex>o<port>
      kind: "regex",
      pattern: "rd[0-9]{1,5}o[0-9a-fA-F]{8,32}o[0-9]{1,5}",
      priority: 6,
      example: "rd5o00000000000000000000ffffc0000201o80",
    },
    {
      // IPv6 form: vi<32 hex>.<port>
      kind: "regex",
      pattern: "vi[0-9a-fA-F]{32}\\.[0-9]{1,5}",
      priority: 6,
      example: "vi20010112000000000000000000000030.20480",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"], // pure decode; never contacts a BIG-IP
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"],
  shareSafetyDefault: "fragment", // decoded output reveals internal topology

  // -- Teaching & provenance --
  learnLinks: [
    "learn/f5-bigip-persistence-cookies",
    "learn/bigip-cookie-formats",
    "learn/bigip-cookie-disclosure",
    "learn/bigip-cookie-encryption",
    "learn/bigip-cookie-persistence-methods",
  ],
  sources: [
    {
      id: "k6917",
      label: "F5 K6917 - Overview of BIG-IP persistence cookie encoding",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K6917",
      access_date: "2026-06-29",
      scope: "the four cookie encodings and their byte-order rules",
      status: "active",
    },
    {
      id: "k7784",
      label: "F5 K7784 - Configuring cookie encryption for cookie persistence",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K7784",
      access_date: "2026-06-29",
      scope: "the mitigation: encrypting the persistence cookie so it cannot be decoded",
      status: "active",
    },
    {
      id: "drwetter",
      label: "drwetter/F5-BIGIP-Decoder (reference implementation)",
      type: "implementation",
      url: "https://github.com/drwetter/F5-BIGIP-Decoder",
      access_date: "2026-06-29",
      scope: "battle-tested decode logic for all flavors, cross-checked against this engine",
      status: "active",
    },
    {
      id: "rfc1918",
      label: "RFC 1918 - Address Allocation for Private Internets",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc1918",
      access_date: "2026-06-29",
      scope: "the private IPv4 ranges used to flag an internal pool member",
      status: "active",
    },
    {
      id: "rfc5952",
      label: "RFC 5952 - A Recommendation for IPv6 Address Text Representation",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc5952",
      access_date: "2026-06-29",
      scope: "canonical IPv6 formatting of a decoded IPv6 pool member",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Deterministic decode only; throws a
 * BigipParseError on empty input or a value matching no known cookie format.
 * @param input a BIGipServer cookie (bare value, name=value, or Set-Cookie line)
 * @returns the decoded report
 */
export function run(input: string): BigipReport {
  return decodeBigipCookie(input);
}

export const goldenVectors = BIGIP_GOLDEN_VECTORS;
export const rejectVectors = BIGIP_REJECT_VECTORS;
