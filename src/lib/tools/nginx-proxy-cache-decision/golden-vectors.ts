// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Vectors for the NGINX proxy_cache decision engine. They pin every store rule
// in the order NGINX applies them, the store-versus-serve distinction that
// proxy_cache_bypass makes visible, and above all the ASYMMETRY that leaks
// data: NGINX excludes cookied RESPONSES from storage by default but does not
// exclude cookied REQUESTS from being served a shared entry.
// ============================================================================

import { decideCache, type CacheDecision } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "nginx-proxy-cache-decision-golden-v1";

export interface CacheVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectStored?: boolean;
  expectServed?: boolean;
  expectKey?: string;
  expectWarningIncludes?: string;
}

export const CACHE_VECTORS: CacheVector[] = [
  {
    id: "no-proxy-cache-means-nothing-happens",
    description: "Without a proxy_cache zone every other cache directive is inert.",
    input: "proxy_cache_valid 200 10m;\nrequest GET /a\nresponse 200",
    expectOk: true,
    expectStored: false,
    expectServed: false,
  },
  {
    id: "happy-path",
    description: "A zone, a lifetime, a GET and a clean 200: stored and served.",
    input: "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nrequest GET /a\nresponse 200",
    expectOk: true,
    expectStored: true,
    expectServed: true,
  },
  {
    id: "post-is-not-cached-by-default",
    description: "proxy_cache_methods defaults to GET and HEAD, so a POST is never cached unless added.",
    input: "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nrequest POST /a\nresponse 200",
    expectOk: true,
    expectStored: false,
  },
  {
    id: "set-cookie-blocks-storage",
    description: "A response carrying Set-Cookie is assumed user-specific and is not stored.",
    input: "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nrequest GET /a\nresponse 200\nresponse_header Set-Cookie: id=1",
    expectOk: true,
    expectStored: false,
  },
  {
    id: "ignoring-set-cookie-stores-it",
    description: "proxy_ignore_headers overrides that safety default - and this is how the leak is built.",
    input:
      "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nproxy_ignore_headers Set-Cookie;\nrequest GET /a\nresponse 200\nresponse_header Set-Cookie: id=1",
    expectOk: true,
    expectStored: true,
    expectWarningIncludes: "cache-poisoning-by-configuration",
  },
  {
    id: "upstream-no-store-blocks",
    description: "The origin's own Cache-Control is respected unless explicitly ignored.",
    input: "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nrequest GET /a\nresponse 200\nresponse_header Cache-Control: no-store",
    expectOk: true,
    expectStored: false,
  },
  {
    id: "no-lifetime-no-storage",
    description: "With neither proxy_cache_valid nor a freshness header there is no lifetime to store under.",
    input: "proxy_cache zone1;\nrequest GET /a\nresponse 200",
    expectOk: true,
    expectStored: false,
  },
  {
    id: "upstream-max-age-supplies-the-lifetime",
    description: "A response carrying its own freshness needs no proxy_cache_valid.",
    input: "proxy_cache zone1;\nrequest GET /a\nresponse 200\nresponse_header Cache-Control: max-age=60",
    expectOk: true,
    expectStored: true,
  },
  {
    id: "bypass-skips-lookup-but-still-stores",
    description:
      "THE distinction: proxy_cache_bypass skips the LOOKUP and still writes the result; proxy_no_cache prevents the WRITE.",
    input: "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nproxy_cache_bypass 1;\nrequest GET /a\nresponse 200",
    expectOk: true,
    expectStored: true,
    expectServed: false,
  },
  {
    id: "no-cache-prevents-the-write",
    description: "Its counterpart, so the pair can be compared directly.",
    input: "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nproxy_no_cache 1;\nrequest GET /a\nresponse 200",
    expectOk: true,
    expectStored: false,
  },
  {
    id: "cookied-request-served-a-shared-entry",
    description:
      "The asymmetry that leaks: a request with a Cookie is NOT excluded from being served a shared entry, only cookied RESPONSES are excluded from storage.",
    input:
      "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nrequest GET /account\nrequest_header Cookie: session=abc\nresponse 200",
    expectOk: true,
    expectStored: true,
    expectServed: true,
    expectWarningIncludes: "another user's cached page",
  },
  {
    id: "key-without-query-collides",
    description: "A key built from $uri alone makes two different queries share one entry.",
    input:
      "proxy_cache zone1;\nproxy_cache_key $scheme$proxy_host$uri;\nproxy_cache_valid 200 10m;\nrequest GET /search?q=secret\nresponse 200",
    expectOk: true,
    expectKey: "httpbackend/search",
    expectWarningIncludes: "share a cache entry",
  },
  {
    id: "key-can-vary-by-cookie",
    description: "Adding the cookie to the key is the fix for per-user content.",
    input:
      "proxy_cache zone1;\nproxy_cache_key $scheme$proxy_host$request_uri$cookie_session;\nproxy_cache_valid 200 10m;\nrequest GET /account\nrequest_header Cookie: session=abc\nresponse 200",
    expectOk: true,
    expectKey: "httpbackend/accountabc",
  },
  {
    id: "error-missing-request",
    description: "There has to be a request to decide about.",
    input: "proxy_cache zone1;\nresponse 200",
    expectOk: false,
    expectErrorIncludes: 'no "request',
  },
  {
    id: "error-unknown-directive",
    description: "An unrecognised directive is named rather than ignored.",
    input: "proxy_cache zone1;\nproxy_cache_wibble 1;\nrequest GET /a\nresponse 200",
    expectOk: false,
    expectErrorIncludes: "unknown directive",
  },
];

/** Run every vector. Returns failures, empty when all pass. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of CACHE_VECTORS) {
    let r: CacheDecision | null = null;
    let error: string | null = null;
    try {
      r = decideCache(v.input);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    if (v.expectOk === false) {
      if (!error) failures.push(`${v.id}: expected an error, got a result`);
      else if (v.expectErrorIncludes && !error.includes(v.expectErrorIncludes)) {
        failures.push(`${v.id}: error "${error}" does not mention "${v.expectErrorIncludes}"`);
      }
      continue;
    }
    if (error) {
      failures.push(`${v.id}: unexpected error "${error}"`);
      continue;
    }
    if (!r) {
      failures.push(`${v.id}: no result`);
      continue;
    }
    if (v.expectStored !== undefined && r.stored !== v.expectStored) {
      failures.push(`${v.id}: stored ${r.stored}, expected ${v.expectStored}`);
    }
    if (v.expectServed !== undefined && r.servedFromCache !== v.expectServed) {
      failures.push(`${v.id}: served ${r.servedFromCache}, expected ${v.expectServed}`);
    }
    if (v.expectKey !== undefined && r.computedKey !== v.expectKey) {
      failures.push(`${v.id}: key "${r.computedKey}", expected "${v.expectKey}"`);
    }
    if (v.expectWarningIncludes && !r.warnings.some((w) => w.includes(v.expectWarningIncludes!))) {
      failures.push(`${v.id}: no warning mentioning "${v.expectWarningIncludes}"`);
    }
  }
  return failures;
}
