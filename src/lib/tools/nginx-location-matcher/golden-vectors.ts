// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/nginx-location-matcher/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the NGINX location matcher. They pin all five branches of the
// documented algorithm - exact, longest-prefix, ^~ early exit, regex-in-file-
// order, and prefix fallback - plus the two results that surprise people:
// a regex beating a LONGER prefix, and ^~ preventing exactly that.
// ============================================================================

import { matchLocation, type NginxMatchReport } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "nginx-location-matcher-golden-v1";

const CFG = [
  "location / {",
  "location /images/ {",
  "location ^~ /static/ {",
  "location = /favicon.ico {",
  "location ~ \\.(gif|jpg|png)$ {",
  "location ~* \\.php$ {",
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
  }
  return failures;
}
