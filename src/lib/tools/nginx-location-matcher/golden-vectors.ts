// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/nginx-location-matcher/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the NGINX location matcher. They pin all six branches of the
// documented algorithm - exact, longest-prefix, ^~ early exit, regex-in-file-
// order, predicate-in-file-order (nginx 1.31.5+), and prefix fallback - plus
// the two results that surprise people: a regex beating a LONGER prefix, and
// ^~ preventing exactly that.
//
// Set 2026-10-26 adds the predicate round. Its first six vectors reproduce,
// request for request, the worked example in nginx.org ngx_http_core_module
// "location" (configurations A to F, read 2026-10-26), so the engine is pinned
// to NGINX's own answers rather than to this file's reading of the prose.
// ============================================================================

import { matchLocation, type NginxMatchReport } from "./compute";

/** Dated set id (D-49): bumped from golden-v1 when predicate locations were added. */
export const GOLDEN_VECTOR_SET_ID = "nginx-location-matcher-golden-2026-10-26";

const CFG = [
  "location / {",
  "location /images/ {",
  "location ^~ /static/ {",
  "location = /favicon.ico {",
  "location ~ \\.(gif|jpg|png)$ {",
  "location ~* \\.php$ {",
].join("\n");

/** nginx.org's own worked example (configurations A to F), in the documented order. */
const DOC_CFG = [
  "location = / {",
  "location / {",
  "location /documents/ {",
  "location ^~ /images/ {",
  "location ~* \\.(gif|jpg|jpeg)$ {",
  "location $arg_pred {",
].join("\n");

export interface NginxVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  /** Winning location pattern, or null for no match. */
  expectWinner?: string | null;
  expectDecisiveStage?: string;
  expectFindingIncludes?: string;
  /** The path actually matched, when the request line carried arguments. */
  expectUri?: string;
}

export const NGINX_VECTORS: NginxVector[] = [
  {
    id: "exact-wins-immediately",
    description: "An exact match ends the search before anything else is considered.",
    input: `${CFG}\nrequest /favicon.ico`,
    expectOk: true,
    expectWinner: "/favicon.ico",
    expectDecisiveStage: "exact",
  },
  {
    id: "regex-beats-longer-prefix",
    description:
      "THE surprise: /images/ is a longer, more specific prefix, and the regex still wins because regexes are tried after the prefix round and beat it.",
    input: `${CFG}\nrequest /images/logo.gif`,
    expectOk: true,
    expectWinner: "\\.(gif|jpg|png)$",
    expectDecisiveStage: "regex-scan",
  },
  {
    id: "caret-tilde-stops-before-regex",
    description:
      "Same file extension under /static/, but ^~ exits before the regexes run. This is the fix for the previous case.",
    input: `${CFG}\nrequest /static/logo.gif`,
    expectOk: true,
    expectWinner: "/static/",
    expectDecisiveStage: "prefix-priority",
  },
  {
    id: "prefix-fallback-when-no-regex-matches",
    description: "No regex matches, so the remembered longest prefix wins after all.",
    input: `${CFG}\nrequest /images/readme.txt`,
    expectOk: true,
    expectWinner: "/images/",
    expectDecisiveStage: "fallback",
  },
  {
    id: "case-insensitive-regex",
    description: "~* matches regardless of case.",
    input: `${CFG}\nrequest /index.PHP`,
    expectOk: true,
    expectWinner: "\\.php$",
    expectDecisiveStage: "regex-scan",
  },
  {
    id: "longest-prefix-not-first-prefix",
    description:
      "File order does not decide the prefix round: the longer prefix wins even though it is written second.",
    input: "location / {\nlocation /a/b/c/ {\nrequest /a/b/c/d",
    expectOk: true,
    expectWinner: "/a/b/c/",
    expectDecisiveStage: "fallback",
  },
  {
    id: "no-match-at-all",
    description: "With no catch-all, a request can match nothing.",
    input: "location /only/ {\nrequest /elsewhere",
    expectOk: true,
    expectWinner: null,
    expectDecisiveStage: "fallback",
  },
  {
    id: "finding-regex-can-steal-a-prefix",
    description:
      "The config analysis warns when a regex can take over a prefix block, and names the fix.",
    input: "location /images/ {\nlocation ~ /images {\nrequest /images/x",
    expectOk: true,
    expectFindingIncludes: "can be taken over by",
  },
  {
    id: "finding-duplicate-location",
    description: "A repeated location is dead configuration and is called out.",
    input: "location /a/ {\nlocation /a/ {\nrequest /a/x",
    expectOk: true,
    expectFindingIncludes: "repeats",
  },
  {
    id: "error-no-request-line",
    description: "A config with nothing to match is not a match.",
    input: "location / {",
    expectOk: false,
    expectErrorIncludes: 'no "request <uri>" line',
  },
  {
    id: "error-uri-without-slash",
    description: "A request URI must be a path.",
    input: "location / {\nrequest images/logo.gif",
    expectOk: false,
    expectErrorIncludes: 'must start with "/"',
  },
  {
    id: "error-bad-regex",
    description: "An unusable regular expression is named rather than silently ignored.",
    input: "location ~ [unclosed {\nrequest /x",
    expectOk: false,
    expectErrorIncludes: "not a usable regular expression",
  },
  // ---- nginx.org worked example, configurations A to F (read 2026-10-26) ----
  {
    id: "doc-a-exact-root",
    description: "nginx.org example: the \"/\" request matches configuration A, the exact location.",
    input: `${DOC_CFG}\nrequest /`,
    expectOk: true,
    expectWinner: "/",
    expectDecisiveStage: "exact",
  },
  {
    id: "doc-b-catch-all-prefix",
    description: "nginx.org example: \"/index.html\" matches configuration B, the \"/\" prefix, because no regex or predicate matches.",
    input: `${DOC_CFG}\nrequest /index.html`,
    expectOk: true,
    expectWinner: "/",
    expectDecisiveStage: "fallback",
  },
  {
    id: "doc-c-longer-prefix",
    description: "nginx.org example: \"/documents/document.html\" matches configuration C, the longest prefix.",
    input: `${DOC_CFG}\nrequest /documents/document.html`,
    expectOk: true,
    expectWinner: "/documents/",
    expectDecisiveStage: "fallback",
  },
  {
    id: "doc-d-caret-tilde",
    description: "nginx.org example: \"/images/1.gif\" matches configuration D; ^~ stops the search before the regex and the predicate.",
    input: `${DOC_CFG}\nrequest /images/1.gif`,
    expectOk: true,
    expectWinner: "/images/",
    expectDecisiveStage: "prefix-priority",
  },
  {
    id: "doc-e-regex",
    description: "nginx.org example: \"/documents/1.jpg\" matches configuration E, the case-insensitive regex.",
    input: `${DOC_CFG}\nrequest /documents/1.jpg`,
    expectOk: true,
    expectWinner: "\\.(gif|jpg|jpeg)$",
    expectDecisiveStage: "regex-scan",
  },
  {
    id: "doc-f-predicate",
    description: "nginx.org example: \"/documents/index.html?pred=1\" matches configuration F, the predicate on $arg_pred.",
    input: `${DOC_CFG}\nrequest /documents/index.html?pred=1`,
    expectOk: true,
    expectWinner: "$arg_pred",
    expectDecisiveStage: "predicate-scan",
    expectUri: "/documents/index.html",
  },
  // ---- predicate rules beyond the worked example ----
  {
    id: "predicate-zero-is-false",
    description: "A predicate whose variable is \"0\" does not match, so the prefix wins.",
    input: `${DOC_CFG}\nrequest /documents/index.html?pred=0`,
    expectOk: true,
    expectWinner: "/documents/",
    expectDecisiveStage: "fallback",
  },
  {
    id: "regex-before-predicate",
    description: "Regexes are tried before predicates: a matching regex wins even when the predicate is true.",
    input: `${DOC_CFG}\nrequest /documents/1.jpg?pred=1`,
    expectOk: true,
    expectWinner: "\\.(gif|jpg|jpeg)$",
    expectDecisiveStage: "regex-scan",
  },
  {
    id: "caret-tilde-skips-predicate",
    description: "^~ skips the predicate round too: /images/ wins although $arg_pred is true.",
    input: `${DOC_CFG}\nrequest /images/readme.txt?pred=1`,
    expectOk: true,
    expectWinner: "/images/",
    expectDecisiveStage: "prefix-priority",
  },
  {
    id: "declared-variable-predicate",
    description: "A variable given a value on a variable line drives its predicate location.",
    input: "location / {\nlocation $is_api {\nvariable $is_api 1\nrequest /orders",
    expectOk: true,
    expectWinner: "$is_api",
    expectDecisiveStage: "predicate-scan",
  },
  {
    id: "undeclared-variable-is-empty",
    description: "A variable with no value here is treated as empty, the predicate does not match, and a finding says how to test it.",
    input: "location / {\nlocation $is_api {\nrequest /orders",
    expectOk: true,
    expectWinner: "/",
    expectDecisiveStage: "fallback",
    expectFindingIncludes: "has no value here",
  },
  {
    id: "finding-predicate-version",
    description: "A config with a predicate location is told which nginx version it needs.",
    input: "location / {\nlocation $arg_debug {\nrequest /x",
    expectOk: true,
    expectFindingIncludes: "1.31.5",
  },
  {
    id: "query-string-not-matched",
    description: "Locations test the path without arguments, so a regex anchored at the end still matches when a query string follows.",
    input: "location / {\nlocation ~ \\.jpg$ {\nrequest /a.jpg?size=small",
    expectOk: true,
    expectWinner: "\\.jpg$",
    expectDecisiveStage: "regex-scan",
    expectUri: "/a.jpg",
  },
  {
    id: "error-bad-variable-line",
    description: "A variable line must name a variable the way NGINX writes it.",
    input: "location / {\nvariable is_api 1\nrequest /x",
    expectOk: false,
    expectErrorIncludes: "is not a variable name",
  },
];

/** Run every vector. Returns failures, empty when all pass. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of NGINX_VECTORS) {
    let report: NginxMatchReport | null = null;
    let error: string | null = null;
    try {
      report = matchLocation(v.input);
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
    if (!report) {
      failures.push(`${v.id}: no report`);
      continue;
    }
    if (v.expectWinner !== undefined) {
      const got = report.winner ? report.winner.pattern : null;
      if (got !== v.expectWinner) {
        failures.push(`${v.id}: winner ${got ?? "(none)"}, expected ${v.expectWinner ?? "(none)"}`);
      }
    }
    if (v.expectDecisiveStage) {
      const d = report.steps.find((s) => s.decisive);
      if (!d || d.stage !== v.expectDecisiveStage) {
        failures.push(`${v.id}: decisive stage ${d?.stage ?? "none"}, expected ${v.expectDecisiveStage}`);
      }
    }
    if (v.expectFindingIncludes && !report.findings.some((f) => f.includes(v.expectFindingIncludes!))) {
      failures.push(`${v.id}: no finding mentioning "${v.expectFindingIncludes}"`);
    }
    // The matched path excludes the request line's arguments.
    if (v.expectUri !== undefined && report.uri !== v.expectUri) {
      failures.push(`${v.id}: matched path ${report.uri}, expected ${v.expectUri}`);
    }
  }
  return failures;
}
