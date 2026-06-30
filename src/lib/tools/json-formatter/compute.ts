// ============================================================================
// src/lib/tools/json-formatter/compute.ts
// ----------------------------------------------------------------------------
// THE JSON FORMATTER & VALIDATOR ENGINE.
//
// A hand-written, position-tracking JSON parser, plus a formatter built on the
// parsed tree. Going beyond JSON.parse buys three things that matter in
// practice:
//
//   1. Precise errors. On a parse failure you get the line, column, byte
//      offset, a human message, AND the JSON Pointer (RFC 6901) path to the
//      location, instead of an engine-dependent one-line SyntaxError.
//   2. Duplicate-key detection. JSON technically allows repeated object keys
//      and JSON.parse silently keeps the last; this engine reports every
//      duplicate with its pointer, because duplicates are almost always a bug.
//   3. Big-number fidelity. Numbers are preserved as their original literal
//      text, so a 20-digit integer or a high-precision decimal is never lost to
//      a float round-trip.
//
// Pure and deterministic. Runs entirely in the browser.
//
// Grammar: RFC 8259 (JSON). Pointers: RFC 6901.
// ============================================================================

// -- AST ----------------------------------------------------------------------
export type JsonNode =
  | { type: "object"; members: { key: string; value: JsonNode }[] }
  | { type: "array"; elements: JsonNode[] }
  | { type: "string"; value: string }
  | { type: "number"; raw: string }
  | { type: "bool"; value: boolean }
  | { type: "null" };

// -- Errors & results ---------------------------------------------------------
export interface JsonError {
  message: string;
  line: number; // 1-based
  column: number; // 1-based
  offset: number; // 0-based char index
  pointer: string; // RFC 6901
}

export class JsonParseError extends Error {
  line: number;
  column: number;
  offset: number;
  pointer: string;
  constructor(message: string, line: number, column: number, offset: number, pointer: string) {
    super(message);
    this.name = "JsonParseError";
    this.line = line;
    this.column = column;
    this.offset = offset;
    this.pointer = pointer;
  }
}

export interface DuplicateKey {
  pointer: string;
  key: string;
}

export interface JsonStats {
  bytes: number;
  objects: number;
  arrays: number;
  keys: number;
  maxDepth: number;
}

export type IndentStyle = 2 | 3 | 4 | "tab";

export interface FormatOptions {
  mode: "pretty" | "minify";
  indent: IndentStyle;
  sortKeys: boolean;
}

export interface FormatResult {
  ok: boolean;
  output?: string;
  error?: JsonError;
  duplicateKeys: DuplicateKey[];
  stats?: JsonStats;
}

// -- Pointer helpers (RFC 6901) -----------------------------------------------
function escapePointerToken(token: string): string {
  return token.replace(/~/g, "~0").replace(/\//g, "~1");
}
function pointerOf(path: (string | number)[]): string {
  if (path.length === 0) return "";
  return "/" + path.map((p) => escapePointerToken(String(p))).join("/");
}

// -- Offset -> line/column ----------------------------------------------------
function lineCol(src: string, offset: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  const end = Math.min(offset, src.length);
  for (let i = 0; i < end; i++) {
    if (src[i] === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, column: col };
}

// -- Parser -------------------------------------------------------------------
const WS = new Set([" ", "\t", "\n", "\r"]);

interface ParseState {
  src: string;
  i: number;
  duplicates: DuplicateKey[];
}

function fail(st: ParseState, message: string, at: number, path: (string | number)[]): never {
  const { line, column } = lineCol(st.src, at);
  throw new JsonParseError(message, line, column, at, pointerOf(path));
}

function skipWs(st: ParseState): void {
  while (st.i < st.src.length && WS.has(st.src[st.i])) st.i++;
}

function parseValue(st: ParseState, path: (string | number)[]): JsonNode {
  if (path.length > 10000) fail(st, "Maximum nesting depth exceeded.", st.i, path);
  skipWs(st);
  if (st.i >= st.src.length) fail(st, "Unexpected end of input: a value was expected.", st.i, path);
  const c = st.src[st.i];
  if (c === "{") return parseObject(st, path);
  if (c === "[") return parseArray(st, path);
  if (c === '"') return { type: "string", value: parseString(st, path) };
  if (c === "-" || (c >= "0" && c <= "9")) return parseNumber(st, path);
  if (c === "t" || c === "f") return parseBool(st, path);
  if (c === "n") return parseNull(st, path);
  if (c === "'") fail(st, "Strings must use double quotes, not single quotes.", st.i, path);
  fail(st, `Unexpected character ${JSON.stringify(c)}: a value was expected.`, st.i, path);
}

function parseObject(st: ParseState, path: (string | number)[]): JsonNode {
  st.i++; // consume {
  const members: { key: string; value: JsonNode }[] = [];
  const seen = new Set<string>();
  skipWs(st);
  if (st.src[st.i] === "}") {
    st.i++;
    return { type: "object", members };
  }
  for (;;) {
    skipWs(st);
    if (st.i >= st.src.length) fail(st, "Unexpected end of input inside an object.", st.i, path);
    if (st.src[st.i] !== '"') {
      if (st.src[st.i] === "}") fail(st, "Trailing comma is not allowed before a closing brace.", st.i, path);
      fail(st, "Object keys must be double-quoted strings.", st.i, path);
    }
    const keyAt = st.i;
    const key = parseString(st, path);
    if (seen.has(key)) st.duplicates.push({ pointer: pointerOf(path), key });
    seen.add(key);
    skipWs(st);
    if (st.src[st.i] !== ":") fail(st, "Expected a colon ':' between key and value.", st.i, [...path, key]);
    st.i++; // consume :
    const value = parseValue(st, [...path, key]);
    // last-write-wins for the tree (matches JSON.parse), but every dup was recorded above
    const existing = members.findIndex((m) => m.key === key);
    if (existing >= 0) members[existing] = { key, value };
    else members.push({ key, value });
    void keyAt;
    skipWs(st);
    const ch = st.src[st.i];
    if (ch === ",") {
      st.i++;
      continue;
    }
    if (ch === "}") {
      st.i++;
      return { type: "object", members };
    }
    if (st.i >= st.src.length) fail(st, "Unexpected end of input: expected ',' or '}'.", st.i, path);
    fail(st, "Expected a comma ',' or closing brace '}' after a value.", st.i, path);
  }
}

function parseArray(st: ParseState, path: (string | number)[]): JsonNode {
  st.i++; // consume [
  const elements: JsonNode[] = [];
  skipWs(st);
  if (st.src[st.i] === "]") {
    st.i++;
    return { type: "array", elements };
  }
  for (;;) {
    const value = parseValue(st, [...path, elements.length]);
    elements.push(value);
    skipWs(st);
    const ch = st.src[st.i];
    if (ch === ",") {
      st.i++;
      skipWs(st);
      if (st.src[st.i] === "]") fail(st, "Trailing comma is not allowed before a closing bracket.", st.i, path);
      continue;
    }
    if (ch === "]") {
      st.i++;
      return { type: "array", elements };
    }
    if (st.i >= st.src.length) fail(st, "Unexpected end of input: expected ',' or ']'.", st.i, path);
    fail(st, "Expected a comma ',' or closing bracket ']' after an element.", st.i, path);
  }
}

function parseString(st: ParseState, path: (string | number)[]): string {
  const start = st.i;
  st.i++; // consume opening quote
  let out = "";
  for (;;) {
    if (st.i >= st.src.length) fail(st, "Unterminated string: the closing quote is missing.", start, path);
    const c = st.src[st.i];
    if (c === '"') {
      st.i++;
      return out;
    }
    if (c === "\\") {
      st.i++;
      const e = st.src[st.i];
      switch (e) {
        case '"': out += '"'; break;
        case "\\": out += "\\"; break;
        case "/": out += "/"; break;
        case "b": out += "\b"; break;
        case "f": out += "\f"; break;
        case "n": out += "\n"; break;
        case "r": out += "\r"; break;
        case "t": out += "\t"; break;
        case "u": {
          const hex = st.src.slice(st.i + 1, st.i + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail(st, "Invalid \\u escape: four hex digits are required.", st.i - 1, path);
          out += String.fromCharCode(parseInt(hex, 16));
          st.i += 4;
          break;
        }
        default:
          fail(st, `Invalid escape sequence \\${e ?? ""}.`, st.i - 1, path);
      }
      st.i++;
      continue;
    }
    const code = c.charCodeAt(0);
    if (code < 0x20) fail(st, "Control characters must be escaped inside a string.", st.i, path);
    out += c;
    st.i++;
  }
}

function parseNumber(st: ParseState, path: (string | number)[]): JsonNode {
  const start = st.i;
  const src = st.src;
  if (src[st.i] === "-") st.i++;
  if (src[st.i] === "0") {
    st.i++;
  } else if (src[st.i] >= "1" && src[st.i] <= "9") {
    while (src[st.i] >= "0" && src[st.i] <= "9") st.i++;
  } else {
    fail(st, "Invalid number: a digit was expected.", start, path);
  }
  if (src[st.i] === ".") {
    st.i++;
    if (!(src[st.i] >= "0" && src[st.i] <= "9")) fail(st, "Invalid number: a digit is required after the decimal point.", st.i, path);
    while (src[st.i] >= "0" && src[st.i] <= "9") st.i++;
  }
  if (src[st.i] === "e" || src[st.i] === "E") {
    st.i++;
    if (src[st.i] === "+" || src[st.i] === "-") st.i++;
    if (!(src[st.i] >= "0" && src[st.i] <= "9")) fail(st, "Invalid number: a digit is required in the exponent.", st.i, path);
    while (src[st.i] >= "0" && src[st.i] <= "9") st.i++;
  }
  return { type: "number", raw: src.slice(start, st.i) };
}

function parseLiteral(st: ParseState, word: string, path: (string | number)[]): void {
  if (st.src.slice(st.i, st.i + word.length) !== word) {
    fail(st, `Invalid literal: expected ${word}.`, st.i, path);
  }
  st.i += word.length;
}

function parseBool(st: ParseState, path: (string | number)[]): JsonNode {
  if (st.src[st.i] === "t") {
    parseLiteral(st, "true", path);
    return { type: "bool", value: true };
  }
  parseLiteral(st, "false", path);
  return { type: "bool", value: false };
}

function parseNull(st: ParseState, path: (string | number)[]): JsonNode {
  parseLiteral(st, "null", path);
  return { type: "null" };
}

/** Parse a complete JSON document into an AST. @throws {JsonParseError} */
export function parseJson(input: string): { node: JsonNode; duplicates: DuplicateKey[] } {
  const st: ParseState = { src: input, i: 0, duplicates: [] };
  skipWs(st);
  if (st.i >= st.src.length) fail(st, "Empty input: there is no JSON value to parse.", 0, []);
  const node = parseValue(st, []);
  skipWs(st);
  if (st.i < st.src.length) {
    fail(st, "Unexpected content after the JSON value. A document must contain exactly one value.", st.i, []);
  }
  return { node, duplicates: st.duplicates };
}

// -- Serializer ---------------------------------------------------------------
function serializeString(s: string): string {
  // JSON.stringify on a string produces a correctly escaped JSON string literal.
  return JSON.stringify(s);
}

function indentUnit(indent: IndentStyle): string {
  return indent === "tab" ? "\t" : " ".repeat(indent);
}

function serialize(node: JsonNode, opts: FormatOptions, depth: number): string {
  const pretty = opts.mode === "pretty";
  const unit = indentUnit(opts.indent);
  const nl = pretty ? "\n" : "";
  const pad = pretty ? unit.repeat(depth + 1) : "";
  const padEnd = pretty ? unit.repeat(depth) : "";
  const colon = pretty ? ": " : ":";

  switch (node.type) {
    case "null":
      return "null";
    case "bool":
      return node.value ? "true" : "false";
    case "number":
      return node.raw;
    case "string":
      return serializeString(node.value);
    case "array": {
      if (node.elements.length === 0) return "[]";
      const items = node.elements.map((el) => pad + serialize(el, opts, depth + 1));
      return "[" + nl + items.join("," + nl) + nl + padEnd + "]";
    }
    case "object": {
      if (node.members.length === 0) return "{}";
      const members = opts.sortKeys ? [...node.members].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)) : node.members;
      const items = members.map((m) => pad + serializeString(m.key) + colon + serialize(m.value, opts, depth + 1));
      return "{" + nl + items.join("," + nl) + nl + padEnd + "}";
    }
  }
}

// -- Stats --------------------------------------------------------------------
function collectStats(node: JsonNode): JsonStats {
  let objects = 0;
  let arrays = 0;
  let keys = 0;
  let maxDepth = 0;
  const walk = (n: JsonNode, depth: number) => {
    if (n.type === "object") {
      if (depth > maxDepth) maxDepth = depth;
      objects++;
      keys += n.members.length;
      for (const m of n.members) walk(m.value, depth + 1);
    } else if (n.type === "array") {
      if (depth > maxDepth) maxDepth = depth;
      arrays++;
      for (const el of n.elements) walk(el, depth + 1);
    }
  };
  walk(node, 1);
  return { bytes: 0, objects, arrays, keys, maxDepth };
}

// -- Public entry -------------------------------------------------------------
/**
 * formatJson - validate and (re)format a JSON document. Never throws; a parse
 * failure is returned as { ok: false, error }.
 */
export function formatJson(input: string, opts: FormatOptions): FormatResult {
  let parsed: { node: JsonNode; duplicates: DuplicateKey[] };
  try {
    parsed = parseJson(input);
  } catch (e) {
    if (e instanceof JsonParseError) {
      return {
        ok: false,
        error: { message: e.message, line: e.line, column: e.column, offset: e.offset, pointer: e.pointer },
        duplicateKeys: [],
      };
    }
    throw e;
  }
  const output = serialize(parsed.node, opts, 0);
  const stats = collectStats(parsed.node);
  stats.bytes = input.length;
  return { ok: true, output, duplicateKeys: parsed.duplicates, stats };
}
