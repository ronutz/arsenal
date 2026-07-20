// ============================================================================
// src/lib/tools/http-methods-comparison/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the HTTP methods comparison tool.
//
// Accept vectors pin the registry facts: QUERY's safe+idempotent+cacheable+
// body row exactly as RFC 10008 registered it with IANA (June 2026), GET's
// classic row, POST's unsafe/conditional-cache row, PATCH's non-idempotent
// registration (RFC 5789), TRACE's body prohibition, the WebDAV safe trio,
// CORS-safelist membership (GET/HEAD/POST only), and the difference engine
// for the canonical "GET vs QUERY" question. Sources live-verified
// 2026-07-20 (see manifest). Reject vectors pin stable error codes.
// verifyVectors() runs the whole set and throws on the first drift.
// ============================================================================

import { run, MethodCompareError, type MethodCompareErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "http-methods-comparison/2026-07-20a";

interface AcceptVector {
  id: string;
  input: string;
  expect: {
    count?: number;
    firstId?: string;
    safe?: boolean;
    idempotent?: boolean;
    cacheable?: string;
    body?: string;
    corsSafelisted?: boolean;
    htmlForm?: boolean;
    spec?: string;
    differences?: string[];
  };
}

interface RejectVector {
  id: string;
  input: string;
  code: MethodCompareErrorCode;
}

export const HTTP_METHODS_GOLDEN_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The headline row: QUERY exactly as IANA now lists it.
  { id: "query-row", input: "QUERY", expect: { count: 1, firstId: "QUERY", safe: true, idempotent: true, cacheable: "yes", body: "expected", corsSafelisted: false, htmlForm: false, spec: "RFC 10008" } },
  // The classics.
  { id: "get-row", input: "get", expect: { firstId: "GET", safe: true, idempotent: true, cacheable: "yes", body: "undefined", corsSafelisted: true, htmlForm: true } },
  { id: "post-row", input: "post", expect: { firstId: "POST", safe: false, idempotent: false, cacheable: "conditional", body: "expected", corsSafelisted: true, htmlForm: true } },
  { id: "put-idempotent-not-safe", input: "put", expect: { safe: false, idempotent: true, body: "expected" } },
  { id: "delete-idempotent-not-safe", input: "delete", expect: { safe: false, idempotent: true, body: "undefined" } },
  { id: "patch-neither", input: "PATCH", expect: { safe: false, idempotent: false, cacheable: "conditional", spec: "RFC 5789" } },
  { id: "trace-no-body", input: "trace", expect: { safe: true, idempotent: true, body: "none" } },
  { id: "connect-no-body", input: "connect", expect: { safe: false, idempotent: false, body: "none" } },
  { id: "options-body-allowed", input: "options", expect: { safe: true, idempotent: true, body: "allowed", corsSafelisted: false } },
  { id: "propfind-webdav-safe", input: "propfind", expect: { safe: true, idempotent: true, body: "expected", spec: "RFC 4918 (WebDAV)" } },
  // The canonical comparison: GET vs QUERY differ on exactly body, CORS, forms.
  { id: "get-vs-query", input: "get vs query", expect: { count: 2, differences: ["body", "corsSafelisted", "htmlForm"] } },
  // POST vs QUERY: the migration question - differ on safe/idempotent/cache/CORS/forms, agree on body.
  { id: "post-vs-query", input: "post,query", expect: { count: 2, differences: ["safe", "idempotent", "cacheable", "corsSafelisted", "htmlForm"] } },
  // Case-insensitivity + duplicate collapse.
  { id: "case-and-dupes", input: "GeT get GET query", expect: { count: 2, firstId: "GET" } },
  // Four methods accepted.
  { id: "four-ok", input: "get post put delete", expect: { count: 4 } },
]);

export const HTTP_METHODS_REJECT_VECTORS: readonly RejectVector[] = Object.freeze([
  { id: "empty", input: "   ", code: "format" },
  { id: "garbage-token", input: "get 1500", code: "format" },
  { id: "unknown", input: "FETCH", code: "unknown-method" },
  { id: "unknown-second", input: "get vs BREW", code: "unknown-method" },
  { id: "five-methods", input: "get post put delete patch", code: "too-many" },
]);

/** Run every vector; throw with a precise message on the first mismatch. */
export function verifyVectors(): { accepted: number; rejected: number } {
  for (const v of HTTP_METHODS_GOLDEN_VECTORS) {
    const r = run(v.input);
    const first = r.methods[0];
    const flat: Record<string, unknown> = {
      count: r.methods.length,
      firstId: first.id,
      safe: first.safe,
      idempotent: first.idempotent,
      cacheable: first.cacheable,
      body: first.body,
      corsSafelisted: first.corsSafelisted,
      htmlForm: first.htmlForm,
      spec: first.spec,
      differences: r.differences,
    };
    for (const [k, want] of Object.entries(v.expect)) {
      const got = flat[k];
      const eq = Array.isArray(want) ? JSON.stringify(want) === JSON.stringify(got) : got === want;
      if (!eq) throw new Error(`[${v.id}] ${k}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
    }
  }
  for (const v of HTTP_METHODS_REJECT_VECTORS) {
    try {
      run(v.input);
      throw new Error(`[${v.id}] expected rejection "${v.code}", but input was accepted`);
    } catch (e) {
      if (!(e instanceof MethodCompareError) || e.code !== v.code) {
        throw new Error(`[${v.id}] expected code "${v.code}", got ${e instanceof MethodCompareError ? e.code : e}`);
      }
    }
  }
  return { accepted: HTTP_METHODS_GOLDEN_VECTORS.length, rejected: HTTP_METHODS_REJECT_VECTORS.length };
}
