// ============================================================================
// src/lib/tools/json-formatter/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING JSON FORMATTER MODULE - a self-contained {manifest, run, vectors}
// triple. Validate, pretty-print, minify, and sort JSON, with precise error
// locations (line, column, and JSON Pointer), duplicate-key detection, and
// big-number fidelity that a JSON.parse round-trip would destroy.
//
// Pure and offline. shareSafetyDefault: "fragment", because JSON often carries
// secrets (an F5 AS3 declaration embeds passwords), so input stays out of the
// query string and server logs.
// ============================================================================

import { formatJson, type FormatResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, JSON_GOLDEN_VECTORS, JSON_REJECT_VECTORS } from "./golden-vectors";

export { formatJson, parseJson, JsonParseError } from "./compute";
export type {
  JsonNode,
  JsonError,
  DuplicateKey,
  JsonStats,
  IndentStyle,
  FormatOptions,
  FormatResult,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  JSON_GOLDEN_VECTORS,
  JSON_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { JsonGoldenVector, JsonRejectVector } from "./golden-vectors";

/** The D-49 declarative manifest for the json-formatter tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities",
  toolSlug: "json-formatter",
  canonicalAliases: ["json-pretty", "json-beautify", "json-validator", "json-minify", "json-lint"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*[{\\[]",
      priority: 7,
      example: '{"name":"value","list":[1,2,3]}',
    },
    {
      kind: "regex",
      pattern: '"[^"\\\\]*"\\s*:',
      priority: 4,
      example: '{"key": "value"}',
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard"], // recursion is bounded at a fixed nesting depth
  shareSafetyDefault: "fragment", // JSON often embeds secrets

  // -- Teaching & provenance --
  learnLinks: ["learn/json-grammar", "learn/json-numbers-and-precision", "learn/json-duplicate-keys", "learn/json-string-escapes", "learn/json-comments-and-trailing-commas", "learn/json-formatting-and-canonical"],
  sources: [
    {
      id: "rfc8259",
      label: "RFC 8259 - The JavaScript Object Notation (JSON) Data Interchange Format",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8259",
      access_date: "2026-06-29",
      scope: "the JSON grammar: value types, structural characters, strings, and numbers",
      status: "active",
    },
    {
      id: "ecma404",
      label: "ECMA-404 - The JSON Data Interchange Syntax",
      type: "standard",
      url: "https://ecma-international.org/publications-and-standards/standards/ecma-404/",
      access_date: "2026-06-29",
      scope: "the formal JSON syntax, equivalent to RFC 8259",
      status: "active",
    },
    {
      id: "rfc6901",
      label: "RFC 6901 - JavaScript Object Notation (JSON) Pointer",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc6901",
      access_date: "2026-06-29",
      scope: "the pointer path syntax used to locate errors and duplicate keys",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Validates and pretty-prints with a
 * two-space indent by default. Never throws; a parse failure is returned in the
 * FormatResult as { ok: false, error }.
 */
export function run(input: string): FormatResult {
  return formatJson(input, { mode: "pretty", indent: 2, sortKeys: false });
}

export const goldenVectors = JSON_GOLDEN_VECTORS;
export const rejectVectors = JSON_REJECT_VECTORS;
