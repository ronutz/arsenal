// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/nginx-location-matcher/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING NGINX LOCATION MATCHER - the {manifest, run, vectors}
// triple, and the first native NGINX tool on this site.
//
// Paste your location blocks and a request URI, and watch NGINX's documented
// five-step selection run: exact match, longest prefix, the ^~ early exit,
// regular expressions in file order, then the prefix fallback. Each step says
// what happened and why, because the answer on its own does not teach the
// thing worth learning - that reading the file top to bottom actively misleads
// you about which block wins.
//
// Bounded, evaluates nothing, contacts nothing. Paired article:
// learn/nginx-location-matching-order.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, NGINX_VECTORS } from "./golden-vectors";

export { matchLocation, parseLocations, NginxParseError } from "./compute";
export type { NginxLocation, NginxMatchStep, NginxMatchReport } from "./compute";
export { GOLDEN_VECTOR_SET_ID, NGINX_VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "NGINX",
  toolSlug: "nginx-location-matcher",
  /** The Learn article written for this tool. Added 2026-08-12: this manifest
   *  had no learnLinks key at all, so the tool page offered no route back into
   *  the explanation. The link is the tool's OWN article, which is guaranteed
   *  to exist (check-tool-articles enforces it) rather than a judgement call. */
  learnLinks: [
    "learn/apache-httpd-and-what-nginx-was-written-against",
    "learn/nginx-configuration-tree-and-includes",
    "learn/nginx-limiting-connections-and-rate",
    "learn/nginx-location-matching-order",
    "learn/nginx-proxy-pass-uri-rewriting",
    "learn/nginx-reload-signals-and-first-troubleshooting",
  ],
  canonicalAliases: ["nginx-location", "location-block-order", "nginx-match-order"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*location\\s+(=|\\^~|~\\*|~)?\\s*\\S+",
      priority: 6,
      example: "location ~ \\.php$ {",
    },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "Nothing is executed: location lines are parsed into a fixed shape and only compared against the URI.",
    "Regular expressions are compiled with the JavaScript engine and run only against the single URI supplied, so a pathological pattern cannot escape one short string.",
    "No network access and no filesystem access. Nothing is resolved, fetched, or read.",
  ],
  shareSafetyDefault: "fragment",

  knownLimitations: [
    "One server block: no server_name selection and no listen-port matching.",
    "~ and ~* compile to JavaScript regular expressions. PCRE and JS agree on the syntax used in ordinary location blocks, but they are different engines - trust NGINX itself for anything exotic.",
    "No rewrite, try_files, or internal redirects. This answers which location block is selected, not what the whole request does.",
    "The URI is matched as written: NGINX decodes before matching, and doing half of that here would be worse than doing none.",
  ],

  sources: [
    {
      id: "nginx-http-core-location",
      label: "NGINX documentation: ngx_http_core_module, location directive",
      type: "vendor-docs",
      url: "https://nginx.org/en/docs/http/ngx_http_core_module.html#location",
      access_date: "2026-07-27",
      scope:
        "the selection algorithm: exact match, longest prefix remembered, ^~ suppressing regular expressions, regular expressions in order of appearance, prefix fallback",
      status: "active",
    },
    {
      id: "nginx-request-processing",
      label: "NGINX documentation: how NGINX processes a request",
      type: "vendor-docs",
      url: "https://nginx.org/en/docs/http/request_processing.html",
      access_date: "2026-07-27",
      scope: "server and location selection order for an incoming request",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

export const goldenVectors = NGINX_VECTORS;
