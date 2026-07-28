// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Vectors for the NGINX proxy_pass rewriter. They pin the binary switch (URI
// part present or absent), the rewrite form, the doubled slash a mismatched
// location produces, the two configurations NGINX outright refuses, and the
// variable exception that suspends the whole rule.
// ============================================================================

import { rewriteProxyPass, type ProxyResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "nginx-proxy-pass-rewriter-golden-v1";

export interface ProxyVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectBackendUri?: string | null;
  expectRule?: string;
  expectFindingIncludes?: string;
  expectCounterpartUri?: string | null;
}

export const PROXY_VECTORS: ProxyVector[] = [
  {
    id: "no-uri-part-keeps-prefix",
    description: "No URI part after the host: the original request URI goes through unchanged.",
    input: "location /app/\nproxy_pass http://backend;\nrequest /app/page",
    expectOk: true,
    expectBackendUri: "/app/page",
    expectRule: "passthrough",
    expectCounterpartUri: "/page",
  },
  {
    id: "trailing-slash-strips-prefix",
    description: "One trailing slash is a URI part, so the location prefix is replaced by it.",
    input: "location /app/\nproxy_pass http://backend/;\nrequest /app/page",
    expectOk: true,
    expectBackendUri: "/page",
    expectRule: "prefix-replaced",
    expectCounterpartUri: "/app/page",
  },
  {
    id: "uri-part-rewrites-prefix",
    description: "A fuller URI part does in one line what people reach for rewrite to do.",
    input: "location /app/\nproxy_pass http://backend/v2/;\nrequest /app/page",
    expectOk: true,
    expectBackendUri: "/v2/page",
    expectRule: "prefix-replaced",
  },
  {
    id: "mismatched-slash-doubles-it",
    description:
      "A location without a trailing slash plus a URI part really does send a doubled slash upstream - the tool reproduces it rather than tidying it.",
    input: "location /app\nproxy_pass http://backend/;\nrequest /app/page",
    expectOk: true,
    expectBackendUri: "//page",
    expectRule: "prefix-replaced",
    expectFindingIncludes: "DOUBLED slash",
  },
  {
    id: "regex-location-without-uri-is-legal",
    description: "A regular-expression location is fine as long as proxy_pass carries no URI part.",
    input: "location ~ ^/api/\nproxy_pass http://backend;\nrequest /api/x",
    expectOk: true,
    expectBackendUri: "/api/x",
    expectRule: "passthrough",
  },
  {
    id: "regex-location-with-uri-is-refused",
    description:
      "With a URI part it is not a runtime surprise, it is a configuration NGINX refuses: there is no literal prefix to replace.",
    input: "location ~ ^/api/\nproxy_pass http://backend/v2/;\nrequest /api/x",
    expectOk: true,
    expectBackendUri: null,
    expectRule: "rejected",
  },
  {
    id: "named-location-with-uri-is-refused",
    description: "A named location has no prefix either, and is refused for the same reason.",
    input: "location @fallback\nproxy_pass http://backend/v2/;\nrequest /x",
    expectOk: true,
    expectBackendUri: null,
    expectRule: "rejected",
  },
  {
    id: "variable-suspends-the-rule",
    description:
      "A variable in proxy_pass turns off the prefix substitution entirely, which is what catches people who add one to a working config.",
    input: "location /app/\nproxy_pass http://$upstream/;\nrequest /app/page",
    expectOk: true,
    expectRule: "variable",
    expectFindingIncludes: "resolver directive",
  },
  {
    id: "exact-location-strips-too",
    description: "An exact-match location still has a literal prefix, so the rule applies normally.",
    input: "location = /ping\nproxy_pass http://backend/health;\nrequest /ping",
    expectOk: true,
    expectBackendUri: "/health",
    expectRule: "prefix-replaced",
  },
  {
    id: "error-missing-request",
    description: "Nothing to rewrite is not a rewrite.",
    input: "location /app/\nproxy_pass http://backend;",
    expectOk: false,
    expectErrorIncludes: 'no "request <uri>" line',
  },
  {
    id: "error-missing-proxy-pass",
    description: "The directive under test has to be present.",
    input: "location /app/\nrequest /app/page",
    expectOk: false,
    expectErrorIncludes: "no proxy_pass line",
  },
  {
    id: "error-request-without-slash",
    description: "A request URI is a path.",
    input: "location /app/\nproxy_pass http://backend;\nrequest app/page",
    expectOk: false,
    expectErrorIncludes: 'must start with "/"',
  },
];

/** Run every vector. Returns failures, empty when all pass. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of PROXY_VECTORS) {
    let r: ProxyResult | null = null;
    let error: string | null = null;
    try {
      r = rewriteProxyPass(v.input);
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
    if (v.expectBackendUri !== undefined && r.backendUri !== v.expectBackendUri) {
      failures.push(`${v.id}: backend ${r.backendUri}, expected ${v.expectBackendUri}`);
    }
    if (v.expectRule && r.rule !== v.expectRule) {
      failures.push(`${v.id}: rule ${r.rule}, expected ${v.expectRule}`);
    }
    if (v.expectFindingIncludes && !r.findings.some((f) => f.includes(v.expectFindingIncludes!))) {
      failures.push(`${v.id}: no finding mentioning "${v.expectFindingIncludes}"`);
    }
    if (v.expectCounterpartUri !== undefined && r.counterpart?.backendUri !== v.expectCounterpartUri) {
      failures.push(
        `${v.id}: counterpart ${r.counterpart?.backendUri ?? "(none)"}, expected ${v.expectCounterpartUri}`,
      );
    }
  }
  return failures;
}
