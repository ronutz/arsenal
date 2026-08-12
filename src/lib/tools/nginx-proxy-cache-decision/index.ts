// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// THE SELF-DESCRIBING NGINX proxy_cache DECISION ENGINE - {manifest, run,
// vectors}. Answers two questions that get confused with each other: will THIS
// RESPONSE be stored, and will a LATER REQUEST be served from it. They have
// different answers, and the gap between them is where cached data leaks
// between users.
//
// Paired article: learn/nginx-proxy-cache-what-gets-stored.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, CACHE_VECTORS } from "./golden-vectors";

export { decideCache, parseCacheCase, CacheParseError } from "./compute";
export type { CacheInput, CacheDecision } from "./compute";
export { GOLDEN_VECTOR_SET_ID, CACHE_VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "NGINX",
  toolSlug: "nginx-proxy-cache-decision",
  /** The Learn article written for this tool. Added 2026-08-12: this manifest
   *  had no learnLinks key at all, so the tool page offered no route back into
   *  the explanation. The link is the tool's OWN article, which is guaranteed
   *  to exist (check-tool-articles enforces it) rather than a judgement call. */
  learnLinks: [
    "learn/nginx-proxy-cache-what-gets-stored",
  ],
  canonicalAliases: ["proxy-cache-why", "nginx-cache-key", "cache-hit-explainer"],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*proxy_cache(_valid|_key|_methods)?\\s", priority: 6, example: "proxy_cache_valid 200 10m;" },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "Nothing is executed or fetched: directives and headers are parsed into a fixed shape and evaluated as data.",
    "No network access. The cache key is rendered from the values supplied, never resolved against a real server.",
    "Bounded work: a fixed sequence of rule checks over one exchange.",
  ],
  shareSafetyDefault: "fragment",

  knownLimitations: [
    "One exchange, not the cache lifecycle: no proxy_cache_use_stale, no proxy_cache_lock, no revalidation, no min_uses accounting.",
    "No Vary handling - a response that varies on a request header is not modelled.",
    "Cache key rendering substitutes the common variables ($scheme, $host, $request_uri, $uri, $args, $http_*, $cookie_*); anything else is left as written.",
    "Freshness is treated as present or absent rather than computed, so an expired entry is out of scope.",
  ],

  sources: [
    {
      id: "nginx-proxy-cache",
      label: "NGINX documentation: ngx_http_proxy_module caching directives",
      type: "vendor-docs",
      url: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache",
      access_date: "2026-07-27",
      scope:
        "proxy_cache, proxy_cache_key and its default, proxy_cache_methods defaulting to GET and HEAD, proxy_cache_valid, proxy_no_cache versus proxy_cache_bypass, and the response headers that prevent caching",
      status: "active",
    },
    {
      id: "nginx-ignore-headers",
      label: "NGINX documentation: proxy_ignore_headers",
      type: "vendor-docs",
      url: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_ignore_headers",
      access_date: "2026-07-27",
      scope: "which upstream headers can be disregarded, including Set-Cookie and Cache-Control",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = CACHE_VECTORS;
