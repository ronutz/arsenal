// ============================================================================
// src/lib/tools/json-yaml-convert/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING JSON <-> YAML CONVERTER MODULE - a self-contained
// {manifest, run, vectors} triple. Convert a JSON document to block-style YAML,
// or YAML back to JSON, in the browser. The JSON side is validated with the
// precise json-formatter parser; the YAML side is handled by js-yaml under its
// JSON-compatible schema, which expands anchors and aliases and refuses the
// non-JSON YAML type extensions.
//
// Built for the F5 and platform audience: AS3 and Declarative Onboarding
// declarations are JSON, while Kubernetes, Ansible, and CI pipelines are YAML.
//
// Pure and offline. shareSafetyDefault: "fragment", because configuration often
// embeds secrets.
// ============================================================================

import { convert, detectFormat, type ConvertResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, CONV_GOLDEN_VECTORS, CONV_REJECT_VECTORS } from "./golden-vectors";

export { convert, detectFormat } from "./compute";
export type { Direction, IndentWidth, ConvertOptions, ConvertError, ConvertResult } from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  CONV_GOLDEN_VECTORS,
  CONV_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { ConvGoldenVector, ConvRejectVector } from "./golden-vectors";

/** The D-49 declarative manifest for the json-yaml-convert tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities",
  toolSlug: "json-yaml-convert",
  canonicalAliases: ["yaml-to-json", "json-to-yaml", "yaml-converter", "json-yaml", "yaml2json", "json2yaml"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*[{\\[]",
      priority: 6,
      example: '{"class":"ADC","schemaVersion":"3.45.0"}',
    },
    {
      kind: "regex",
      pattern: "^---\\s",
      priority: 6,
      example: "---\napiVersion: apps/v1",
    },
    {
      kind: "regex",
      pattern: "^[\\w.-]+:\\s",
      priority: 4,
      example: "kind: Deployment",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "yaml-restricted-schema"], // JSON_SCHEMA blocks non-JSON YAML type construction
  shareSafetyDefault: "fragment", // configuration often embeds secrets

  // -- Teaching & provenance --
  learnLinks: ["learn/json-vs-yaml", "learn/yaml-type-coercion", "learn/config-formats-in-practice"],
  sources: [
    {
      id: "yaml-1-2-2",
      label: "YAML Ain't Markup Language (YAML) 1.2.2 Specification",
      type: "spec",
      url: "https://yaml.org/spec/1.2.2/",
      access_date: "2026-06-29",
      scope: "the YAML data model, its relationship to JSON, and core/JSON schemas",
      status: "active",
    },
    {
      id: "rfc8259",
      label: "RFC 8259 - The JavaScript Object Notation (JSON) Data Interchange Format",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc8259",
      access_date: "2026-06-29",
      scope: "the JSON side of the conversion",
      status: "active",
    },
    {
      id: "js-yaml",
      label: "js-yaml - YAML parser and serializer for JavaScript",
      type: "implementation",
      url: "https://github.com/nodeca/js-yaml",
      access_date: "2026-06-29",
      scope: "the YAML parser and emitter, used under the JSON-compatible schema",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Auto-detects the direction from the
 * input shape (defaulting to JSON to YAML) and converts with a two-space indent.
 * Never throws; failures are returned in the ConvertResult.
 */
export function run(input: string): ConvertResult {
  const detected = detectFormat(input);
  const direction = detected === "yaml" ? "yaml-to-json" : "json-to-yaml";
  return convert(input, { direction, indent: 2 });
}

export const goldenVectors = CONV_GOLDEN_VECTORS;
export const rejectVectors = CONV_REJECT_VECTORS;
