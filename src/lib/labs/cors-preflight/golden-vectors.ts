// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/cors-preflight/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the CORS preflight lab (set 2026-10-26a). Each case is
// worked by hand from the WHATWG Fetch Standard (read 2026-10-26, "Last Updated
// 19 October 2026") and pins: the verdict on every request header, the unsafe
// names, whether a preflight is sent and its exact headers, why the preflight
// or the actual response fails, the cache lifetime, and what the script gets.
// The cases follow the standard's own credentials table (section 3.3.5: "*"
// with "include" fails, a trailing slash fails, an exact origin with `true`
// passes) and its rules for methods, Authorization and the wildcards. The
// reject vector pins the stable error code. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails on any drift.
// ============================================================================

import { compute, CorsError, DEFAULT_INPUT, EXAMPLE_INPUT, LONG_ACCEPT, type CorsErrorCode, type CorsInput, type CorsResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "cors-preflight/2026-10-26a";

/** The scalar fields a case can pin. */
type Scalars = Omit<CorsResult, "headers" | "unsafeNames" | "preflightRequest">;

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings (changes from the opening state). */
  input: Partial<CorsInput>;
  /** The scalar fields that must match. */
  expect: Partial<Scalars>;
  /** Every judged header as "Name=verdict", joined with " | " ("" when none). */
  headers: string;
  /** The preflight's headers as "Name: value", joined with " | " ("" when no preflight). */
  preflight: string;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast, as the interface could never send them). */
  input: CorsInput;
  /** The code the refusal must carry. */
  code: CorsErrorCode;
}

/** The judged headers of a result as one string. */
function headersOf(r: CorsResult): string {
  // Name and verdict, in the order the script set them.
  return r.headers.map((h) => `${h.name}=${h.verdict}`).join(" | ");
}

/** The preflight request of a result as one string. */
function preflightOf(r: CorsResult): string {
  // Empty when no preflight is sent.
  return r.preflightRequest ? r.preflightRequest.map(([n, v]) => `${n}: ${v}`).join(" | ") : "";
}

/** The accept cases. */
export const CORS_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: GET with Accept: application/json is a simple request; the exact origin lets the script read.
  {
    id: "default-simple-get",
    input: {},
    expect: { safelistedMethod: true, preflight: false, preflightOk: null, actualSent: true, credentialsSent: false, actualOk: true, actualFailure: null, outcome: "readable" },
    headers: "Accept=safelisted",
    preflight: "",
  },
  // "*" without credentials passes the CORS check (section 3.3.5, first row).
  {
    id: "simple-star",
    input: { extraHeader: "none", allowOrigin: "star" },
    expect: { preflight: false, actualOk: true, outcome: "readable" },
    headers: "",
    preflight: "",
  },
  // "*" with "include" fails, after the request (with cookies) has reached the server.
  {
    id: "simple-star-with-credentials",
    input: { extraHeader: "none", credentials: "include", allowOrigin: "star", allowCredentials: "true" },
    expect: { preflight: false, actualSent: true, credentialsSent: true, actualOk: false, actualFailure: "acao-wildcard-credentials", outcome: "blocked-response" },
    headers: "",
    preflight: "",
  },
  // An exact origin with "include" still needs Access-Control-Allow-Credentials: true.
  {
    id: "simple-credentials-no-acac",
    input: { credentials: "include" },
    expect: { credentialsSent: true, actualOk: false, actualFailure: "acac-missing", outcome: "blocked-response" },
    headers: "Accept=safelisted",
    preflight: "",
  },
  // An exact origin and `true`: shared with credentials.
  {
    id: "simple-credentials-ok",
    input: { credentials: "include", allowCredentials: "true" },
    expect: { credentialsSent: true, actualOk: true, outcome: "readable" },
    headers: "Accept=safelisted",
    preflight: "",
  },
  // No Access-Control-Allow-Origin at all: the response arrived, the script reads nothing.
  {
    id: "simple-no-acao",
    input: { allowOrigin: "absent" },
    expect: { preflight: false, actualSent: true, actualOk: false, actualFailure: "acao-missing", outcome: "blocked-response" },
    headers: "Accept=safelisted",
    preflight: "",
  },
  // A trailing slash is not the serialized origin (section 3.3.5).
  {
    id: "simple-trailing-slash",
    input: { allowOrigin: "trailing-slash" },
    expect: { actualOk: false, actualFailure: "acao-mismatch", outcome: "blocked-response" },
    headers: "Accept=safelisted",
    preflight: "",
  },
  // Another origin: a mismatch.
  {
    id: "simple-other-origin",
    input: { allowOrigin: "other" },
    expect: { actualOk: false, actualFailure: "acao-mismatch", outcome: "blocked-response" },
    headers: "Accept=safelisted",
    preflight: "",
  },
  // HEAD is safelisted too.
  {
    id: "head-simple",
    input: { method: "HEAD" },
    expect: { safelistedMethod: true, preflight: false, outcome: "readable" },
    headers: "Accept=safelisted",
    preflight: "",
  },
  // POST with a form's Content-Type: no preflight.
  {
    id: "post-form",
    input: { method: "POST", contentType: "form", extraHeader: "none" },
    expect: { preflight: false, outcome: "readable" },
    headers: "Content-Type=safelisted",
    preflight: "",
  },
  // POST with multipart/form-data: no preflight.
  {
    id: "post-multipart",
    input: { method: "POST", contentType: "multipart", extraHeader: "none" },
    expect: { preflight: false, outcome: "readable" },
    headers: "Content-Type=safelisted",
    preflight: "",
  },
  // A charset parameter does not change the essence text/plain: no preflight.
  {
    id: "post-text-plain-charset",
    input: { method: "POST", contentType: "text", extraHeader: "none" },
    expect: { preflight: false, outcome: "readable" },
    headers: "Content-Type=safelisted",
    preflight: "",
  },
  // The Example: application/json forces a preflight, and a server that never lists Content-Type fails it.
  {
    id: "example-post-json-no-allow-headers",
    input: { method: "POST", contentType: "json", extraHeader: "none" },
    expect: { safelistedMethod: true, preflight: true, preflightOk: false, preflightFailure: "header-not-allowed", failedHeader: "Content-Type", maxAge: null, actualSent: false, credentialsSent: false, actualOk: null, outcome: "blocked-preflight" },
    headers: "Content-Type=content-type-essence",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: POST | Access-Control-Request-Headers: content-type",
  },
  // The same request when the server lists Content-Type: the preflight passes, cached for the default 5 seconds.
  {
    id: "post-json-allowed",
    input: { method: "POST", contentType: "json", extraHeader: "none", allowHeaders: "content-type" },
    expect: { preflight: true, preflightOk: true, preflightFailure: null, maxAge: 5, maxAgeDefault: true, actualSent: true, actualOk: true, outcome: "readable" },
    headers: "Content-Type=content-type-essence",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: POST | Access-Control-Request-Headers: content-type",
  },
  // "*" covers content-type when the credentials mode is not "include".
  {
    id: "post-json-star",
    input: { method: "POST", contentType: "json", extraHeader: "none", allowHeaders: "star", maxAge: "600" },
    expect: { preflightOk: true, maxAge: 600, maxAgeDefault: false, outcome: "readable" },
    headers: "Content-Type=content-type-essence",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: POST | Access-Control-Request-Headers: content-type",
  },
  // With "include", "*" in Access-Control-Allow-Headers is only a header name, so content-type is not allowed.
  {
    id: "post-json-star-with-credentials",
    input: { method: "POST", contentType: "json", extraHeader: "none", credentials: "include", allowCredentials: "true", allowHeaders: "star" },
    expect: { preflightOk: false, preflightFailure: "header-wildcard-credentials", failedHeader: "Content-Type", actualSent: false, outcome: "blocked-preflight" },
    headers: "Content-Type=content-type-essence",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: POST | Access-Control-Request-Headers: content-type",
  },
  // PUT is not safelisted: a preflight with no Access-Control-Request-Headers, failed for want of Allow-Methods.
  {
    id: "put-no-allow-methods",
    input: { method: "PUT", extraHeader: "none" },
    expect: { safelistedMethod: false, preflight: true, preflightOk: false, preflightFailure: "method-not-allowed", failedHeader: null, outcome: "blocked-preflight" },
    headers: "",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: PUT",
  },
  // PUT listed: the preflight passes and the actual PUT is sent.
  {
    id: "put-allowed",
    input: { method: "PUT", extraHeader: "none", allowMethods: "put-delete", maxAge: "86400" },
    expect: { preflightOk: true, maxAge: 86400, actualSent: true, actualOk: true, outcome: "readable" },
    headers: "",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: PUT",
  },
  // PATCH is not in "PUT, DELETE".
  {
    id: "patch-not-listed",
    input: { method: "PATCH", extraHeader: "none", allowMethods: "put-delete" },
    expect: { preflightOk: false, preflightFailure: "method-not-allowed", outcome: "blocked-preflight" },
    headers: "",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: PATCH",
  },
  // DELETE under "*" without credentials: allowed.
  {
    id: "delete-star",
    input: { method: "DELETE", extraHeader: "none", allowMethods: "star" },
    expect: { preflightOk: true, outcome: "readable" },
    headers: "",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: DELETE",
  },
  // DELETE under "*" with "include": "*" is only a method name then.
  {
    id: "delete-star-with-credentials",
    input: { method: "DELETE", extraHeader: "none", allowMethods: "star", credentials: "include", allowCredentials: "true" },
    expect: { preflightOk: false, preflightFailure: "method-wildcard-credentials", outcome: "blocked-preflight" },
    headers: "",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: DELETE",
  },
  // A preflight whose response has no Access-Control-Allow-Origin fails the CORS check before anything else.
  {
    id: "put-preflight-no-acao",
    input: { method: "PUT", extraHeader: "none", allowOrigin: "absent", allowMethods: "put-delete" },
    expect: { preflightOk: false, preflightFailure: "acao-missing", actualSent: false, actualOk: null, actualFailure: null, outcome: "blocked-preflight" },
    headers: "",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: PUT",
  },
  // Authorization is never covered by "*" (a CORS non-wildcard request-header name).
  {
    id: "authorization-star",
    input: { extraHeader: "authorization", allowHeaders: "star" },
    expect: { preflight: true, preflightOk: false, preflightFailure: "authorization-not-listed", failedHeader: "Authorization", outcome: "blocked-preflight" },
    headers: "Authorization=not-safelisted-name",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: GET | Access-Control-Request-Headers: authorization",
  },
  // Authorization listed by name: the preflight passes.
  {
    id: "authorization-listed",
    input: { extraHeader: "authorization", allowHeaders: "content-type-authorization" },
    expect: { preflightOk: true, outcome: "readable" },
    headers: "Authorization=not-safelisted-name",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: GET | Access-Control-Request-Headers: authorization",
  },
  // Accept is safelisted only up to 128 bytes of value.
  {
    id: "accept-too-long",
    input: { extraHeader: "accept-long" },
    expect: { preflight: true, preflightOk: false, preflightFailure: "header-not-allowed", failedHeader: "Accept", outcome: "blocked-preflight" },
    headers: "Accept=too-long",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: GET | Access-Control-Request-Headers: accept",
  },
  // Content-Language with letters and a hyphen is safelisted.
  {
    id: "content-language",
    input: { extraHeader: "content-language" },
    expect: { preflight: false, outcome: "readable" },
    headers: "Content-Language=safelisted",
    preflight: "",
  },
  // A custom header that the server's list does not name.
  {
    id: "x-requested-with-not-listed",
    input: { extraHeader: "x-requested-with", allowHeaders: "content-type" },
    expect: { preflightOk: false, preflightFailure: "header-not-allowed", failedHeader: "X-Requested-With", outcome: "blocked-preflight" },
    headers: "X-Requested-With=not-safelisted-name",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: GET | Access-Control-Request-Headers: x-requested-with",
  },
  // Two unsafe names, sorted and joined with "," and no space; both listed.
  {
    id: "json-and-authorization",
    input: { method: "POST", contentType: "json", extraHeader: "authorization", allowHeaders: "content-type-authorization", credentials: "include", allowCredentials: "true" },
    expect: { preflightOk: true, maxAge: 5, credentialsSent: true, actualOk: true, outcome: "readable" },
    headers: "Content-Type=content-type-essence | Authorization=not-safelisted-name",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: POST | Access-Control-Request-Headers: authorization,content-type",
  },
  // Wildcards for both lists without credentials: PUT with two unsafe headers passes.
  {
    id: "put-json-custom-stars",
    input: { method: "PUT", contentType: "json", extraHeader: "x-requested-with", allowMethods: "star", allowHeaders: "star", maxAge: "86400" },
    expect: { preflightOk: true, maxAge: 86400, outcome: "readable" },
    headers: "Content-Type=content-type-essence | X-Requested-With=not-safelisted-name",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: PUT | Access-Control-Request-Headers: content-type,x-requested-with",
  },
  // A listed PUT with credentials and `true` passes both checks (the lab's server sends the same headers on both responses).
  {
    id: "put-credentials-listed",
    input: { method: "PUT", extraHeader: "none", allowMethods: "put-delete", credentials: "include", allowCredentials: "true" },
    expect: { preflightOk: true, credentialsSent: true, actualOk: true, outcome: "readable" },
    headers: "",
    preflight: "Origin: https://app.example | Accept: */* | Access-Control-Request-Method: PUT",
  },
]);

/** The reject cases. */
export const CORS_REJECTS: readonly RejectVector[] = Object.freeze([
  // A method the control cannot produce.
  { id: "bad-method", input: { ...DEFAULT_INPUT, method: "TRACE" as unknown as "GET" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // The long Accept value must stay past the 128-byte limit, or the too-long case proves nothing.
  if (LONG_ACCEPT.length <= 128) failures.push(`LONG_ACCEPT is ${LONG_ACCEPT.length} bytes, not more than 128`);
  // The Example button must load the Example vector's settings.
  const ex = CORS_VECTORS.find((v) => v.id === "example-post-json-no-allow-headers");
  // Compared field by field through JSON (flat objects of strings).
  if (!ex || JSON.stringify({ ...DEFAULT_INPUT, ...ex.input }) !== JSON.stringify(EXAMPLE_INPUT)) failures.push("EXAMPLE_INPUT differs from the example vector");
  // Each accept case: compute, compare every expected field, then the headers and the preflight.
  for (const v of CORS_VECTORS) {
    // The model's answer for the opening state with the case's changes.
    const got = compute({ ...DEFAULT_INPUT, ...v.input });
    // Each expected scalar in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof Scalars];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
    // The judged headers.
    const h = headersOf(got);
    // A difference is a failure showing both.
    if (h !== v.headers) failures.push(`${v.id}: headers are "${h}", expected "${v.headers}"`);
    // The preflight request.
    const p = preflightOf(got);
    // A difference is a failure showing both.
    if (p !== v.preflight) failures.push(`${v.id}: preflight is "${p}", expected "${v.preflight}"`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of CORS_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof CorsError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads (the two guards above count as checks too).
  const total = CORS_VECTORS.length + CORS_REJECTS.length + 2;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
