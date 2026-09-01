// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/http-request-translator/index.ts
// ----------------------------------------------------------------------------
// HTTP request translator: paste a raw HTTP/1.1 request, get the equivalent
// curl command, fetch call, HTTPie invocation, Python requests snippet and
// PowerShell one-liner.
//
// The exact inverse of curl-command-explainer, and the name it now carries was
// freed by that tool being renamed on 2026-09-01 - it had been called the
// translator while only ever accepting curl as input.
//
// Boundary with the queued http-message-decoder: that one decodes raw messages
// including RESPONSES, chunked bodies and transfer encodings. This one accepts
// a REQUEST and translates it, and declines to decode chunked bodies rather
// than half-implementing the other tool.
// ============================================================================

import { parseRequest } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { parseRequest } from "./compute";
export type { RequestParse, KV } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "HTTP & web",
  toolSlug: "http-request-translator",
  canonicalAliases: [
    "http-request-translator",
    "raw-http-to-curl",
    "request-to-curl",
    "http-to-fetch",
    "paste-a-request",
  ],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE|CONNECT|QUERY)\\s+\\S+\\s+HTTP/\\d",
      priority: 8,
      example: "GET /users HTTP/1.1\nHost: api.example.com",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-fetches", "never-executes"],
  shareSafetyDefault: "caution", // a captured request routinely carries Authorization or Cookie

  // -- Teaching & provenance --
  learnLinks: [
    "learn/http-headers-anatomy",
    "learn/http-methods-the-verbs",
    "learn/curl-to-fetch",
    "learn/reading-a-curl-command",
  ],
  sources: [
    { id: "rfc-9112", label: "RFC 9112 - HTTP/1.1 message syntax and routing", url: "https://www.rfc-editor.org/rfc/rfc9112" },
    { id: "rfc-9110", label: "RFC 9110 - HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110" },
    { id: "curl-manpage", label: "curl - man page (command options)", url: "https://curl.se/docs/manpage.html" },
    { id: "mdn-fetch", label: "MDN - Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" },
    { id: "requests-docs", label: "Requests - Quickstart", url: "https://requests.readthedocs.io/en/latest/user/quickstart/" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, local engine. */
export function run(input: string) {
  return parseRequest(input);
}

// Surface verifyVectors for the test harness.
export const __selftest = verifyVectors;
