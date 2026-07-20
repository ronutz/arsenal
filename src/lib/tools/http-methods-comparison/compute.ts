// ============================================================================
// src/lib/tools/http-methods-comparison/compute.ts
// ----------------------------------------------------------------------------
// HTTP methods comparison - the pure engine (D-49: deterministic, local, no
// network, no clock). Enter one to four method names ("QUERY", "get vs post",
// "get post put delete") and get each method's protocol-level properties plus,
// for two or more, the exact list of properties where they differ.
//
// THE DATA IS THE TOOL. Every row below is a registry fact, not an opinion:
//
//   * Safe / idempotent come from RFC 9110 §9.2.1/§9.2.2 and the IANA HTTP
//     Method Registry, which records exactly those two columns per method.
//     QUERY's row (Safe: yes, Idempotent: yes) was added by RFC 10008
//     (June 2026) - the first new method registration since PATCH (RFC 5789,
//     2010).
//   * Cacheable: GET and HEAD are the cacheable pair (RFC 9110 §9.3.1/9.3.2);
//     POST and PATCH responses are cacheable only when explicit freshness
//     information is present (RFC 9110 §9.3.3, RFC 5789 §2) - "conditional"
//     below; QUERY is cacheable with the defining twist that the cache key
//     must incorporate the request content (RFC 10008 §2.7).
//   * Request-body semantics: "expected" (the body is the point), "undefined"
//     (RFC 9110 warns a body "has no generally defined semantics" and may get
//     the request rejected - GET/HEAD/DELETE), "allowed" (OPTIONS: permitted
//     but meaningless without a spec), "none" (CONNECT/TRACE: a client MUST
//     NOT send content).
//   * CORS-safelisted: only GET, HEAD, POST skip the preflight (Fetch spec);
//     QUERY explicitly requires one (RFC 10008 security considerations).
//   * HTML forms: only GET and POST are declarative form methods;
//     <form method="query"> falls back to GET and drops the body (WHATWG
//     HTML issue 12594, open as of July 2026).
//
// Sources live-verified 2026-07-20; see the manifest in ./index.ts.
// ============================================================================

/** Stable error codes (the UI maps them to localized messages). */
export type MethodCompareErrorCode =
  | "format" // empty input or a token that is not a method-shaped word
  | "unknown-method" // a method-shaped token not in the table
  | "too-many"; // more than 4 methods at once

/** Typed error carrying a stable code plus the offending token, if any. */
export class MethodCompareError extends Error {
  readonly code: MethodCompareErrorCode;
  readonly token?: string;
  constructor(code: MethodCompareErrorCode, message: string, token?: string) {
    super(message);
    this.name = "MethodCompareError";
    this.code = code;
    this.token = token;
  }
}

/** Cacheability, per the registry facts above. */
export type Cacheability = "yes" | "conditional" | "no";
/** Request-body semantics, per the registry facts above. */
export type BodySemantics = "expected" | "undefined" | "allowed" | "none";

/** One method's protocol-level properties. */
export interface MethodProperties {
  /** Canonical method name, upper-case (e.g. "QUERY"). */
  id: string;
  safe: boolean;
  idempotent: boolean;
  cacheable: Cacheability;
  body: BodySemantics;
  corsSafelisted: boolean;
  htmlForm: boolean;
  /** Defining specification, as cited in the IANA registry. */
  spec: string;
  /** Year the defining spec (or original definition) landed. */
  year: number;
}

/** The result the UI renders. */
export interface MethodCompareResult {
  methods: MethodProperties[];
  /** Property keys whose values differ across the requested methods (2+). */
  differences: ("safe" | "idempotent" | "cacheable" | "body" | "corsSafelisted" | "htmlForm")[];
}

// ---------------------------------------------------------------------------
// The table. Order here is the display order for the "all" overview in docs;
// the engine returns methods in the order the user asked for them.
// ---------------------------------------------------------------------------
const M = (
  id: string,
  safe: boolean,
  idempotent: boolean,
  cacheable: Cacheability,
  body: BodySemantics,
  corsSafelisted: boolean,
  htmlForm: boolean,
  spec: string,
  year: number,
): MethodProperties => ({ id, safe, idempotent, cacheable, body, corsSafelisted, htmlForm, spec, year });

export const METHOD_TABLE: readonly MethodProperties[] = Object.freeze([
  M("GET", true, true, "yes", "undefined", true, true, "RFC 9110 §9.3.1", 1991),
  M("HEAD", true, true, "yes", "undefined", true, false, "RFC 9110 §9.3.2", 1992),
  M("POST", false, false, "conditional", "expected", true, true, "RFC 9110 §9.3.3", 1992),
  M("PUT", false, true, "no", "expected", false, false, "RFC 9110 §9.3.4", 1992),
  M("DELETE", false, true, "no", "undefined", false, false, "RFC 9110 §9.3.5", 1992),
  M("CONNECT", false, false, "no", "none", false, false, "RFC 9110 §9.3.6", 1997),
  M("OPTIONS", true, true, "no", "allowed", false, false, "RFC 9110 §9.3.7", 1997),
  M("TRACE", true, true, "no", "none", false, false, "RFC 9110 §9.3.8", 1997),
  M("PATCH", false, false, "conditional", "expected", false, false, "RFC 5789", 2010),
  M("QUERY", true, true, "yes", "expected", false, false, "RFC 10008", 2026),
  M("PROPFIND", true, true, "no", "expected", false, false, "RFC 4918 (WebDAV)", 2007),
  M("REPORT", true, true, "no", "expected", false, false, "RFC 3253 (WebDAV)", 2002),
  M("SEARCH", true, true, "no", "expected", false, false, "RFC 5323 (WebDAV)", 2008),
]);

const BY_ID = new Map(METHOD_TABLE.map((m) => [m.id, m]));

/** Every method name the tool knows, for error messages and docs. */
export const KNOWN_METHODS: readonly string[] = Object.freeze(METHOD_TABLE.map((m) => m.id));

/**
 * run - parse one input line and return the requested methods' properties.
 *
 * Grammar: 1..4 method names separated by whitespace, commas, or the word
 * "vs" (case-insensitive). "GET vs QUERY", "get,post", "query" all work.
 * Duplicates are collapsed, preserving first position. Anchored, linear,
 * single pass - ReDoS-safe by construction.
 */
export function run(raw: string): MethodCompareResult {
  const tokens = raw
    .trim()
    .split(/[\s,]+/)
    .filter((t) => t !== "" && t.toLowerCase() !== "vs" && t.toLowerCase() !== "versus");
  if (tokens.length === 0) {
    throw new MethodCompareError("format", "empty input");
  }

  const picked: MethodProperties[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    if (!/^[A-Za-z][A-Za-z-]{0,15}$/.test(t)) {
      throw new MethodCompareError("format", `not a method name: "${t}"`, t);
    }
    const id = t.toUpperCase();
    if (seen.has(id)) continue; // duplicates collapse silently
    const m = BY_ID.get(id);
    if (!m) {
      throw new MethodCompareError("unknown-method", `unknown method "${id}"`, id);
    }
    seen.add(id);
    picked.push(m);
    if (picked.length > 4) {
      throw new MethodCompareError("too-many", "compare at most 4 methods");
    }
  }

  // Which properties differ across the selection (only meaningful for 2+).
  const differences: MethodCompareResult["differences"] = [];
  if (picked.length > 1) {
    const keys = ["safe", "idempotent", "cacheable", "body", "corsSafelisted", "htmlForm"] as const;
    for (const k of keys) {
      const first = picked[0][k];
      if (picked.some((m) => m[k] !== first)) differences.push(k);
    }
  }

  return { methods: picked, differences };
}
