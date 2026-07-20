// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// http-header-order-fingerprint / golden-vectors.ts
// ----------------------------------------------------------------------------
// Known-answer vectors. Each block is a representative request-header order for
// a known client; the expected classification is derived from the documented
// header sequences of those clients, independent of this tool's own logic.
// ============================================================================

import { analyzeHeaders, parseHeaderBlock, HeaderInputError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "http-header-order-fingerprint-v1";

const CHROME = [
  "GET / HTTP/1.1",
  "Host: example.com",
  "Connection: keep-alive",
  "sec-ch-ua: \"Chromium\";v=\"120\"",
  "sec-ch-ua-mobile: ?0",
  "sec-ch-ua-platform: \"Windows\"",
  "Upgrade-Insecure-Requests: 1",
  "User-Agent: Mozilla/5.0 Chrome/120.0.0.0",
  "Accept: text/html",
  "Sec-Fetch-Site: none",
  "Sec-Fetch-Mode: navigate",
  "Sec-Fetch-Dest: document",
  "Accept-Encoding: gzip, deflate, br",
  "Accept-Language: en-US,en;q=0.9",
].join("\n");

const FIREFOX = [
  "GET / HTTP/1.1",
  "Host: example.com",
  "User-Agent: Mozilla/5.0 Firefox/121.0",
  "Accept: text/html",
  "Accept-Language: en-US,en;q=0.5",
  "Accept-Encoding: gzip, deflate, br",
  "Connection: keep-alive",
  "Upgrade-Insecure-Requests: 1",
  "Sec-Fetch-Dest: document",
  "Sec-Fetch-Mode: navigate",
  "Sec-Fetch-Site: none",
].join("\n");

const CURL = [
  "GET / HTTP/1.1",
  "Host: example.com",
  "User-Agent: curl/8.4.0",
  "Accept: */*",
].join("\n");

const HTTP2_LOWER = [
  "host: example.com",
  "user-agent: python-requests/2.31.0",
  "accept-encoding: gzip, deflate",
  "accept: */*",
  "connection: keep-alive",
].join("\n");

export interface HeaderVector {
  id: string;
  input: string;
  expect: {
    headerCount?: number;
    hostFirst?: boolean;
    clientIncludes?: string;
    confidence?: "strong" | "weak" | "none";
    method?: string;
    errorIncludes?: string;
  };
}

export const GOLDEN_VECTORS: HeaderVector[] = [
  { id: "v1", input: CHROME, expect: { headerCount: 13, hostFirst: true, clientIncludes: "Chromium", confidence: "strong", method: "GET" } },
  { id: "v2", input: FIREFOX, expect: { headerCount: 10, hostFirst: true, clientIncludes: "Firefox", confidence: "strong" } },
  { id: "v3", input: CURL, expect: { headerCount: 3, clientIncludes: "library", confidence: "strong" } },
  { id: "v4", input: HTTP2_LOWER, expect: { headerCount: 5, clientIncludes: "library" } },
  { id: "e1", input: "GET / HTTP/1.1", expect: { errorIncludes: "No headers found" } },
  { id: "e2", input: "this is not a header block\nnor is this", expect: { errorIncludes: "not a valid header" } },
  { id: "e3", input: "", expect: { errorIncludes: "Paste a raw HTTP" } },
];

export interface VerifyReport { pass: boolean; failures: string[] }

export function verifyVectors(): VerifyReport {
  const failures: string[] = [];
  for (const v of GOLDEN_VECTORS) {
    try {
      const a = analyzeHeaders(v.input);
      if (v.expect.errorIncludes) { failures.push(`${v.id}: expected error but parsed`); continue; }
      if (v.expect.headerCount !== undefined && a.headers.length !== v.expect.headerCount) failures.push(`${v.id}: headerCount ${a.headers.length} != ${v.expect.headerCount}`);
      if (v.expect.hostFirst !== undefined && a.hostFirst !== v.expect.hostFirst) failures.push(`${v.id}: hostFirst ${a.hostFirst} != ${v.expect.hostFirst}`);
      if (v.expect.method !== undefined && a.method !== v.expect.method) failures.push(`${v.id}: method ${a.method} != ${v.expect.method}`);
      if (v.expect.clientIncludes !== undefined && !a.clientHint.label.toLowerCase().includes(v.expect.clientIncludes.toLowerCase())) failures.push(`${v.id}: client "${a.clientHint.label}" lacks "${v.expect.clientIncludes}"`);
      if (v.expect.confidence !== undefined && a.clientHint.confidence !== v.expect.confidence) failures.push(`${v.id}: confidence ${a.clientHint.confidence} != ${v.expect.confidence}`);
    } catch (e) {
      if (!(e instanceof HeaderInputError)) { failures.push(`${v.id}: unexpected ${String(e)}`); continue; }
      if (!v.expect.errorIncludes) { failures.push(`${v.id}: unexpected error ${e.message}`); continue; }
      if (!e.message.includes(v.expect.errorIncludes)) failures.push(`${v.id}: error "${e.message}" lacks "${v.expect.errorIncludes}"`);
    }
  }
  try { parseHeaderBlock(CHROME); } catch { failures.push("parse: chrome block failed"); }
  return { pass: failures.length === 0, failures };
}
