// ============================================================================
// src/lib/tools/base64/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING BASE64 MODULE - a netcore {manifest, run, vectors} triple
// (same shape as the cidr reference and the jwt module), ready to graduate into
// @ronutz/netcore unchanged.
//
// A base64 string very often carries credentials (HTTP Basic auth is
// base64(user:pass)), tokens, or keys, so this tool is a sensitiveArtifact:
// the manifest declares shareSafetyDefault: "fragment" (the validator requires
// fragment-or-stricter for sensitive tools) and secret-redaction.
// ============================================================================

import { analyzeBase64, type Base64Result } from "./compute";
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
export type {
  Base64Result,
  Base64Decoded,
  Base64DecodeFailure,
  Base64DecodeReason,
} from "./compute";

/** The D-49 declarative manifest for the Base64 tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Encoding & Data",
  toolSlug: "base64",
  canonicalAliases: ["b64", "base64url", "base64-decode", "base64-encode"],
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
  learnLinks: ["learn/base64"],
  sources: [
    {
      id: "rfc4648",
      label: "RFC 4648 - Base16, Base32, Base64 Data Encodings",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4648",
      access_date: "2026-06-26",
      scope: "base64 (section 4) + base64url (section 5) alphabets and padding",
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
  license: { code: "Apache-2.0", content: "CC-BY-4.0" },
});

/**
 * run - the registry-facing entry point. Deterministic; encodes and attempts to
 * decode the input. Never throws (a failed decode is reported in the result).
 * @param input arbitrary text (to encode) or a base64 string (to decode)
 */
export function run(input: string): Base64Result {
  return analyzeBase64(input);
}

export const goldenVectors = BASE64_GOLDEN_VECTORS;
export const rejectVectors = BASE64_REJECT_VECTORS;
