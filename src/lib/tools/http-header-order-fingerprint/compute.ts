// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/http-header-order-fingerprint/compute.ts
// ----------------------------------------------------------------------------
// Paste a raw HTTP request header block; this explains how the ORDER and
// casing of headers fingerprints a client - the passive-HTTP analog of JA3's
// cipher ordering. Browsers, HTTP libraries, and bots each emit headers in a
// characteristic sequence; a request whose header order does not match the
// User-Agent it claims is a classic bot / proxy tell.
//
// DECODE/EXPLAIN ONLY. Input is a header block the user already holds (copied
// from devtools, a capture, or a curl -v). Nothing is read from the visitor and
// nothing is sent. A short stable order-hash is shown for display only.
// ============================================================================

export class HeaderInputError extends Error {}

export interface ParsedHeader {
  name: string;         // as written (preserves casing)
  lower: string;        // lowercased key
  value: string;
}

export interface OrderNote {
  position: number;
  name: string;
  note: string;
}

export interface ClientHint {
  label: string;
  confidence: "strong" | "weak" | "none";
  rationale: string;
}

export interface HeaderAnalysis {
  raw: string;
  method: string | null;
  path: string | null;
  version: string | null;
  headers: ParsedHeader[];
  orderHash: string;          // FNV-1a of the lowercased-name sequence
  orderList: string[];        // lowercased names, in order
  casingNote: string;         // Title-Case vs lowercase (HTTP/2) signal
  hostFirst: boolean;         // does Host lead? (curl/library habit)
  orderNotes: OrderNote[];
  clientHint: ClientHint;
  missingCommon: string[];    // common browser headers absent
}

// FNV-1a over the joined lowercased order — display-only stable id.
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// A representative Chromium request-header order (documented shape; Blink emits
// pseudo-headers first in HTTP/2, then this rough sequence).
const CHROME_ORDER = ["host", "connection", "sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform", "upgrade-insecure-requests", "user-agent", "accept", "sec-fetch-site", "sec-fetch-mode", "sec-fetch-user", "sec-fetch-dest", "accept-encoding", "accept-language"];
const FIREFOX_ORDER = ["host", "user-agent", "accept", "accept-language", "accept-encoding", "connection", "upgrade-insecure-requests", "sec-fetch-dest", "sec-fetch-mode", "sec-fetch-site", "sec-fetch-user"];
const BROWSER_COMMON = ["host", "user-agent", "accept", "accept-language", "accept-encoding"];

function orderSimilarity(seq: string[], ref: string[]): number {
  // Longest common subsequence length / ref length — a rough order match.
  const a = seq.filter((x) => ref.includes(x));
  const b = ref.filter((x) => a.includes(x));
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return n === 0 ? 0 : dp[m][n] / n;
}

export function parseHeaderBlock(raw: string): { method: string | null; path: string | null; version: string | null; headers: ParsedHeader[] } {
  const s = raw.replace(/\r\n/g, "\n").trim();
  if (!s) throw new HeaderInputError("Paste a raw HTTP request header block (a request line and one \"Name: value\" per line).");
  const lines = s.split("\n").filter((l) => l.trim() !== "");
  let method: string | null = null, path: string | null = null, version: string | null = null;
  let start = 0;
  const reqLine = lines[0].match(/^([A-Z]+)\s+(\S+)\s+(HTTP\/[\d.]+)$/);
  if (reqLine) { method = reqLine[1]; path = reqLine[2]; version = reqLine[3]; start = 1; }
  const headers: ParsedHeader[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf(":");
    if (idx < 1) throw new HeaderInputError(`Line ${i + 1} is not a valid header ("Name: value" expected): ${line.slice(0, 40)}`);
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    headers.push({ name, lower: name.toLowerCase(), value });
  }
  if (headers.length === 0) throw new HeaderInputError("No headers found. Include at least one \"Name: value\" line.");
  return { method, path, version, headers };
}

export function analyzeHeaders(raw: string): HeaderAnalysis {
  const { method, path, version, headers } = parseHeaderBlock(raw);
  const orderList = headers.map((h) => h.lower);
  const orderHash = fnv1a(orderList.join(","));

  // Casing: HTTP/2 lowercases header names on the wire; a captured HTTP/2
  // request shown in lowercase vs a Title-Cased HTTP/1.1 request is itself a hint.
  const titleCased = headers.filter((h) => /^[A-Z]/.test(h.name)).length;
  const casingNote = titleCased === headers.length
    ? "All header names are Title-Cased, the HTTP/1.1 convention. On the wire HTTP/2 lowercases them, so Title-Case here suggests an HTTP/1.1 capture or a tool that rewrites casing."
    : titleCased === 0
      ? "All header names are lowercase, which is how HTTP/2 carries them on the wire - consistent with an HTTP/2 capture."
      : "Mixed casing across header names, which itself can distinguish a hand-built or library request from a browser.";

  const hostFirst = orderList[0] === "host";

  const orderNotes: OrderNote[] = headers.slice(0, 12).map((h, i) => ({
    position: i + 1,
    name: h.name,
    note:
      h.lower === "host" ? "Host - browsers and libraries differ on whether it leads; HTTP/2 carries it as the :authority pseudo-header" :
      h.lower.startsWith("sec-ch-ua") ? "a User-Agent Client Hint - only browsers that support Client Hints emit these, and only after a site requests them" :
      h.lower.startsWith("sec-fetch") ? "a Fetch Metadata header - emitted by modern browsers, rarely reproduced by scripts" :
      h.lower === "user-agent" ? "User-Agent - its position relative to Accept differs between Chromium and Gecko" :
      h.lower === "accept" ? "Accept - the exact default value and position is browser-characteristic" :
      "ordinary header; its slot in the sequence still contributes to the order fingerprint",
  }));

  const missingCommon = BROWSER_COMMON.filter((c) => !orderList.includes(c));

  // Client hint by order similarity.
  const chrome = orderSimilarity(orderList, CHROME_ORDER);
  const firefox = orderSimilarity(orderList, FIREFOX_ORDER);
  const hasSecCh = orderList.some((x) => x.startsWith("sec-ch-ua"));
  const hasSecFetch = orderList.some((x) => x.startsWith("sec-fetch"));

  // An explicit library/tool token in the UA is decisive on its own.
  const uaVal = headers.find((h) => h.lower === "user-agent")?.value ?? "";
  const libToken = uaVal.match(/\b(curl|wget|python-requests|python-urllib|Go-http-client|okhttp|axios|node-fetch|Java|libwww-perl|PostmanRuntime|HTTPie|Apache-HttpClient)\b/i)?.[1];

  let clientHint: ClientHint;
  if (libToken) {
    clientHint = { label: `HTTP library or tool (${libToken})`, confidence: "strong", rationale: `The User-Agent names ${libToken}, a non-browser HTTP client; its header set and order match a library, not a browser.` };
  } else if (chrome >= 0.75 && hasSecCh) {
    clientHint = { label: "Chromium-family browser (Chrome / Edge / Opera)", confidence: "strong", rationale: "The header order closely matches the Chromium sequence and Sec-CH-UA client hints are present." };
  } else if (firefox >= 0.75 && hasSecFetch && !hasSecCh) {
    clientHint = { label: "Firefox (Gecko)", confidence: "strong", rationale: "The order matches Gecko's sequence, with Fetch Metadata but no Sec-CH-UA (Firefox does not send UA client hints)." };
  } else if (hasSecFetch || hasSecCh) {
    clientHint = { label: "A modern browser (family unclear)", confidence: "weak", rationale: "Browser-only headers are present, but the order does not cleanly match one engine - possibly reordered by a proxy." };
  } else if (missingCommon.length >= 2) {
    clientHint = { label: "Likely a script or HTTP library (curl, requests, Go, etc.)", confidence: "strong", rationale: `Common browser headers are missing (${missingCommon.join(", ")}) and no Sec-Fetch/Sec-CH headers appear - the signature of a non-browser client.` };
  } else {
    clientHint = { label: "Non-browser or minimal client", confidence: "weak", rationale: "No browser-only headers and an order that does not match a known browser; treat as a library or custom client." };
  }

  return { raw: raw.trim(), method, path, version, headers, orderHash, orderList, casingNote, hostFirst, orderNotes, clientHint, missingCommon };
}

export function run(input: string): HeaderAnalysis {
  return analyzeHeaders(input);
}
