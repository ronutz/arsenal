// ============================================================================
// src/lib/tools/base64/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING CODEC MODULE - a self-contained {manifest, run, vectors} triple
// (same shape as the cidr reference and the jwt module), liftable into an open
// library unchanged. Merge M5 generalized it from base64/base64url to a
// unified codec over base64, base64url, base32, base16/hex, and percent-encoding.
//
// An encoded string very often carries credentials (HTTP Basic auth is
// base64(user:pass)), tokens, or keys, so this tool is a sensitiveArtifact:
// the manifest declares shareSafetyDefault: "fragment" (the validator requires
// fragment-or-stricter for sensitive tools) and secret-redaction.
// ============================================================================

import { analyzeCodec, type CodecResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  BASE64_GOLDEN_VECTORS,
  BASE64_REJECT_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  BASE64_GOLDEN_VECTORS,
  BASE64_REJECT_VECTORS,
} from "./golden-vectors";
export { CODECS } from "./compute";
export type {
  Codec,
  CodecResult,
  CodecDecoded,
  CodecDecodeFailure,
  CodecDecodeReason,
} from "./compute";

/** The D-49 declarative manifest for the Base64 tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Encoding",
  toolSlug: "base64",
  canonicalAliases: ["b64", "base64url", "base32", "base16", "hex", "hex-encode", "hex-decode", "percent-encode", "percent-decode", "url-encode", "url-decode", "base64-decode", "base64-encode"],
  inputDetectors: [
    {
      // base64-ish: base64 / base64url alphabet with optional trailing padding.
      // Low priority - base64 routing is inherently low-confidence (plain words
      // also match). Linear pattern, ReDoS-safe.
      kind: "regex",
      pattern: "^[A-Za-z0-9+/_-]+={0,2}$",
      priority: 3,
      example: "SGVsbG8gV29ybGQ=",
    },
    {
      // hex / Base16: pairs of hex digits, even length enforced by the group.
      // Low confidence (also matches the base64 alphabet). Linear, ReDoS-safe.
      kind: "regex",
      pattern: "^([0-9A-Fa-f]{2})+$",
      priority: 3,
      example: "666F6F626172",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly", "sensitiveArtifact"], // commonly carries creds/tokens
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard", "secret-redaction"],
  shareSafetyDefault: "fragment", // required for sensitiveArtifact

  // -- Teaching & provenance --
  learnLinks: ["learn/base64", "learn/base64url", "learn/base32", "learn/hex-encoding", "learn/percent-encoding", "learn/text-encodings-compared"],
  sources: [
    {
      id: "rfc4648",
      label: "RFC 4648 - The Base16, Base32, and Base64 Data Encodings",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4648",
      access_date: "2026-06-28",
      scope: "base64 (section 4), base64url (section 5), base32 (section 6), base16/hex (section 8) alphabets and padding",
      status: "active",
    },
    {
      id: "rfc3986",
      label: "RFC 3986 - Uniform Resource Identifier (URI): Generic Syntax",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc3986",
      access_date: "2026-06-28",
      scope: "percent-encoding (section 2.1) and the unreserved set (section 2.3)",
      status: "active",
    },
    {
      id: "rfc7617",
      label: "RFC 7617 - The Basic HTTP Authentication Scheme",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc7617",
      access_date: "2026-06-26",
      scope: "base64(user:password) - a common reason to decode base64",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Deterministic; encodes and attempts to
 * decode the input. Never throws (a failed decode is reported in the result).
 * @param input arbitrary text (to encode) or an encoded string (to decode)
 */
export function run(input: string): CodecResult {
  return analyzeCodec(input);
}

export const goldenVectors = BASE64_GOLDEN_VECTORS;
export const rejectVectors = BASE64_REJECT_VECTORS;
