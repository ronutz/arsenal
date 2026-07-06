// ============================================================================
// src/lib/tools/json-yaml-convert/compute.ts
// ----------------------------------------------------------------------------
// THE JSON <-> YAML CONVERTER ENGINE.
//
// Two directions:
//   JSON -> YAML : the JSON is validated with the precise hand-written parser
//                  from json-formatter (so errors carry line, column, and a
//                  JSON Pointer), then emitted as block-style YAML by js-yaml,
//                  which correctly quotes strings that YAML would otherwise
//                  misread (the "Norway problem": NO, yes, on, 1.0, 08...).
//   YAML -> JSON : js-yaml parses the YAML under its JSON-compatible schema
//                  (anchors and aliases are expanded; block scalars become
//                  strings), and the result is serialized to JSON.
//
// Pure and offline; both libraries run in the browser and contact nothing.
//
// Documented edges: YAML comments are presentation only and do not survive a
// round trip; YAML merge keys (<<) are kept as literal keys rather than
// flattened; and number precision follows JavaScript number semantics, so the
// json-formatter is the tool to reach for when exact large integers matter.
// ============================================================================

import * as yaml from "js-yaml";
import { parseJson, JsonParseError } from "../json-formatter/compute";

export type Direction = "json-to-yaml" | "yaml-to-json";
export type IndentWidth = 2 | 4;

export interface ConvertOptions {
  direction: Direction;
  indent: IndentWidth;
}

export interface ConvertError {
  message: string;
  line?: number; // 1-based
  column?: number; // 1-based
  pointer?: string; // RFC 6901, when the source is JSON
}

export interface ConvertResult {
  ok: boolean;
  output?: string;
  error?: ConvertError;
  sourceFormat: "json" | "yaml";
  targetFormat: "json" | "yaml";
  notes: string[];
}

/** A cheap heuristic for the direction hint in the UI (not authoritative). */
export function detectFormat(input: string): "json" | "yaml" | "unknown" {
  const t = input.trim();
  if (t === "") return "unknown";
  if (t[0] === "{" || t[0] === "[") return "json";
  // A leading "---", a "key:" line, or a "- " sequence is YAML-ish.
  if (/^---\s/.test(t) || /^[^\n:]{1,200}:(\s|$)/m.test(t) || /^\s*-\s/m.test(t)) return "yaml";
  return "unknown";
}

// -- JSON -> YAML -------------------------------------------------------------
function jsonToYaml(input: string, indent: IndentWidth): ConvertResult {
  const base: ConvertResult = { ok: false, sourceFormat: "json", targetFormat: "yaml", notes: [] };

  // Validate first, for precise errors.
  try {
    parseJson(input);
  } catch (e) {
    if (e instanceof JsonParseError) {
      return { ...base, error: { message: e.message, line: e.line, column: e.column, pointer: e.pointer } };
    }
    return { ...base, error: { message: "The JSON could not be parsed." } };
  }

  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch (e) {
    return { ...base, error: { message: e instanceof Error ? e.message : "The JSON could not be parsed." } };
  }

  let output: string;
  try {
    output = yaml.dump(value, {
      indent,
      lineWidth: -1, // never wrap long scalars
      noRefs: true, // expand repeated nodes instead of emitting anchors
      sortKeys: false,
      quoteStyle: "double",
      forceQuotes: false,
    });
  } catch (e) {
    return { ...base, error: { message: e instanceof Error ? e.message : "The value could not be emitted as YAML." } };
  }

  const notes: string[] = [];
  if (/(^|[^\w.])-?\d{16,}(?![\d.])/.test(input)) notes.push("LARGE_NUMBER");
  return { ok: true, output, sourceFormat: "json", targetFormat: "yaml", notes };
}

// -- YAML -> JSON -------------------------------------------------------------
interface YamlMark {
  line?: number;
  column?: number;
}
function hasMark(e: unknown): e is { mark: YamlMark; reason?: string; message: string } {
  return typeof e === "object" && e !== null && "mark" in e;
}

function yamlToJson(input: string, indent: IndentWidth): ConvertResult {
  const base: ConvertResult = { ok: false, sourceFormat: "yaml", targetFormat: "json", notes: [] };

  if (!input.trim()) return { ...base, error: { message: "Enter YAML to convert." } };

  let value: unknown;
  try {
    value = yaml.load(input, { schema: yaml.JSON_SCHEMA });
  } catch (e) {
    if (hasMark(e)) {
      const reason = e.reason ?? e.message;
      return {
        ...base,
        error: {
          message: reason ? `Invalid YAML: ${reason}.` : "Invalid YAML.",
          line: e.mark.line !== undefined ? e.mark.line + 1 : undefined,
          column: e.mark.column !== undefined ? e.mark.column + 1 : undefined,
        },
      };
    }
    return { ...base, error: { message: e instanceof Error ? e.message : "The YAML could not be parsed." } };
  }

  if (value === undefined) return { ...base, error: { message: "The YAML document is empty." } };

  const pad = " ".repeat(indent);
  let output: string;
  try {
    output = JSON.stringify(value, null, pad);
  } catch (e) {
    return { ...base, error: { message: e instanceof Error ? e.message : "The value could not be serialized as JSON." } };
  }
  if (output === undefined) {
    return { ...base, error: { message: "This YAML resolves to a value that JSON cannot represent." } };
  }

  const notes: string[] = [];
  if (/(^|\n)\s*#/.test(input) || /[^:]\s#\s/.test(input)) notes.push("COMMENTS_DROPPED");
  if (/[&*]\w/.test(input)) notes.push("ANCHORS_EXPANDED");
  if (/<<\s*:/.test(input)) notes.push("MERGE_KEYS_LITERAL");
  return { ok: true, output, sourceFormat: "yaml", targetFormat: "json", notes };
}

// -- Entry --------------------------------------------------------------------
/** convert - run the requested direction. Never throws; failures are returned. */
export function convert(input: string, opts: ConvertOptions): ConvertResult {
  return opts.direction === "json-to-yaml" ? jsonToYaml(input, opts.indent) : yamlToJson(input, opts.indent);
}
