// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// THE SELF-DESCRIBING NGINX proxy_pass REWRITER - {manifest, run, vectors}.
//
// One trailing slash decides whether the backend sees /app/page or /page, and
// the tool shows BOTH answers side by side so the switch is visible rather
// than described. It also reproduces the doubled slash a mismatched location
// produces, refuses the configurations NGINX refuses, and flags the variable
// exception that suspends the rule entirely.
//
// Paired article: learn/nginx-proxy-pass-uri-rewriting.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, PROXY_VECTORS } from "./golden-vectors";

export { rewriteProxyPass, parseProxyCase, ProxyParseError } from "./compute";
export type { ProxyCase, ProxyResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, PROXY_VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "NGINX",
  toolSlug: "nginx-proxy-pass-rewriter",
  canonicalAliases: ["proxy-pass-slash", "nginx-proxy-uri", "proxy-pass-trailing-slash"],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*proxy_pass\\s+[a-z]+://", priority: 6, example: "proxy_pass http://backend/;" },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "Nothing is executed or fetched: the directive is parsed into a fixed shape and the path is computed by string replacement.",
    "No network access. The upstream name is never resolved or contacted - only its position in the value matters.",
    "Bounded work: one substitution against one URI.",
  ],
  shareSafetyDefault: "fragment",

  knownLimitations: [
    "No rewrite, try_files or internal redirects: this answers what path the backend receives, not what the whole request does.",
    "Upstream blocks are not resolved to servers; the host portion is treated as opaque.",
    "Query strings pass through untouched and are not modelled.",
    "The join is LITERAL, matching NGINX: a mismatched trailing slash really does send a doubled slash upstream, and the tool shows it rather than tidying it.",
  ],

  sources: [
    {
      id: "nginx-proxy-pass",
      label: "NGINX documentation: ngx_http_proxy_module, proxy_pass directive",
      type: "vendor-docs",
      url: "https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass",
      access_date: "2026-07-27",
      scope:
        "URI-part semantics: with a URI the matched location prefix is replaced; without one the original request URI is passed; the regex/named-location restriction; variable handling",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = PROXY_VECTORS;
