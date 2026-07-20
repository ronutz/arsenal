// ============================================================================
// src/lib/tools/http-methods-comparison/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the HTTP methods
// comparison tool.
// ============================================================================

import { run, type MethodCompareResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  HTTP_METHODS_GOLDEN_VECTORS,
  HTTP_METHODS_REJECT_VECTORS,
} from "./golden-vectors";

export { run, MethodCompareError, METHOD_TABLE, KNOWN_METHODS } from "./compute";
export type {
  MethodCompareResult,
  MethodCompareErrorCode,
  MethodProperties,
  Cacheability,
  BodySemantics,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  HTTP_METHODS_GOLDEN_VECTORS,
  HTTP_METHODS_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the HTTP methods comparison tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "HTTP & web",
  toolSlug: "http-methods-comparison",
  canonicalAliases: [
    "http methods",
    "http verbs",
    "query method",
    "http query",
    "safe idempotent",
    "get vs post",
  ],
  inputDetectors: [
    {
      // Two to four known method names, optionally joined by "vs" or commas.
      // A single bare word is far too ambiguous for the OMNIBOX. Anchored,
      // bounded alternation, linear - ReDoS-safe.
      kind: "regex",
      pattern:
        "^\\s*(get|head|post|put|delete|connect|options|trace|patch|query|propfind|report|search)((\\s+vs\\s+|\\s*,\\s*|\\s+)(get|head|post|put|delete|connect|options|trace|patch|query|propfind|report|search)){1,3}\\s*$",
      priority: 7,
      example: "get vs query",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // a fixed registry table; no network, no clock
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // anchored linear parser
  shareSafetyDefault: "param", // method names are non-sensitive

  // -- Teaching & provenance --
  learnLinks: ["learn/http-query-method", "learn/bigip-http-query-method"],
  sources: [
    {
      id: "rfc-9110-methods",
      label: "RFC 9110 (HTTP Semantics) §9 - method definitions, safe/idempotent/cacheable properties, body-semantics warnings for GET/HEAD/DELETE, content prohibitions for CONNECT/TRACE",
      type: "standard",
      url: "https://www.rfc-editor.org/rfc/rfc9110.html",
      access_date: "2026-07-20",
      scope: "the nine core-method rows: safety, idempotency, cacheability (GET/HEAD; POST with explicit freshness), and request-body semantics",
      status: "active",
    },
    {
      id: "rfc-10008-query",
      label: "RFC 10008 (The HTTP QUERY Method, June 2026) - QUERY registered safe + idempotent; cacheable with the cache key incorporating the request content (§2.7); Accept-Query field; CORS preflight required; Content-Type enforced, sniffing forbidden",
      type: "standard",
      url: "https://www.rfc-editor.org/rfc/rfc10008.html",
      access_date: "2026-07-20",
      scope: "the QUERY row and its notes: the first new HTTP method registration since PATCH (2010)",
      status: "active",
    },
    {
      id: "iana-method-registry",
      label: "IANA Hypertext Transfer Protocol (HTTP) Method Registry - the authoritative safe/idempotent columns per registered method, including QUERY (added by RFC 10008) and the WebDAV trio PROPFIND/REPORT/SEARCH",
      type: "registry",
      url: "https://www.iana.org/assignments/http-methods/http-methods.xhtml",
      access_date: "2026-07-20",
      scope: "cross-check of every safe/idempotent value in the table",
      status: "active",
    },
    {
      id: "rfc-5789-patch",
      label: "RFC 5789 (PATCH Method for HTTP, 2010) - neither safe nor idempotent; responses cacheable only with explicit freshness information",
      type: "standard",
      url: "https://www.rfc-editor.org/rfc/rfc5789.html",
      access_date: "2026-07-20",
      scope: "the PATCH row",
      status: "active",
    },
    {
      id: "webdav-safe-trio",
      label: "RFC 4918 (PROPFIND), RFC 3253 (REPORT), RFC 5323 (SEARCH) - the WebDAV-lineage safe, idempotent, body-carrying methods that preceded QUERY; RFC 10008 Appendix B explains why QUERY got a clean start instead",
      type: "standard",
      url: "https://www.rfc-editor.org/rfc/rfc4918.html",
      access_date: "2026-07-20",
      scope: "the PROPFIND/REPORT/SEARCH rows and the naming-history note",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * runTool - the registry-facing entry point.
 * @param input 1-4 method names, e.g. "QUERY", "get vs query", "get,post,put"
 * @returns each method's registry properties plus the differing-property list
 */
export function runTool(input: string): MethodCompareResult {
  return run(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = HTTP_METHODS_GOLDEN_VECTORS;
export const rejectVectors = HTTP_METHODS_REJECT_VECTORS;
