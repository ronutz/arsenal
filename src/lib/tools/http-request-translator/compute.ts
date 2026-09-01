// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/http-request-translator/compute.ts
// ----------------------------------------------------------------------------
// Parse a RAW HTTP/1.1 request and emit the equivalent command or code.
//
// This is the exact inverse of curl-command-explainer, which takes a curl
// command and produces a raw request among its outputs. The pair exists because
// the two directions are needed by different people at different moments: a raw
// message is what a capture, a proxy log or an RFC example gives you, and a
// curl command is what you can paste into a terminal to reproduce it.
//
// WHAT THIS DELIBERATELY DOES NOT DO
// It does not decode responses, chunked bodies or transfer encodings. That is
// the queued http-message-decoder's job, and duplicating it here would produce
// two half-tools that disagree. This one accepts a REQUEST and translates it.
//
// Everything is pure and local: the parse never fetches, never executes, and
// never leaves the browser. A pasted request routinely carries an Authorization
// header or a session cookie, which is why that matters.
// ============================================================================

export interface KV {
  readonly name: string;
  readonly value: string;
}

export interface RequestParse {
  readonly ok: boolean;
  /** Message ids for problems found while parsing; rendered as prose by the UI. */
  readonly warnings: readonly string[];
  readonly method: string;
  /** The request target exactly as written on the request line. */
  readonly target: string;
  readonly version: string;
  /** Absolute URL, assembled from the target and the Host header. */
  readonly url: string;
  readonly headers: readonly KV[];
  readonly body: string;
  readonly translations: {
    readonly curl: string;
    readonly fetch: string;
    readonly httpie: string;
    readonly python: string;
    readonly powershell: string;
  };
}

/** Methods defined in RFC 9110 plus PATCH (RFC 5789), for the sanity warning. */
const KNOWN_METHODS = new Set([
  "GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH", "QUERY",
]);

/** Single-quote for a POSIX shell: end the quote, escape, reopen. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function jsString(value: string): string {
  return JSON.stringify(value);
}

function pyString(value: string): string {
  return JSON.stringify(value);
}

/**
 * Split a pasted message into its start line, header block and body.
 *
 * Accepts CRLF and bare LF. RFC 9112 requires CRLF, but nothing that a human
 * pastes into a box preserves it reliably - editors, chat clients and PDFs all
 * rewrite line endings - so accepting LF is a usability decision rather than a
 * standards one, and it is recorded here so nobody later "fixes" it.
 */
function splitMessage(raw: string): { lines: string[]; body: string } {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blank = text.indexOf("\n\n");
  if (blank === -1) return { lines: text.split("\n").filter((l) => l.trim() !== ""), body: "" };
  return {
    lines: text.slice(0, blank).split("\n").filter((l) => l.trim() !== ""),
    body: text.slice(blank + 2),
  };
}

export function parseRequest(raw: string): RequestParse {
  const warnings: string[] = [];
  const empty: RequestParse = {
    ok: false, warnings: ["empty"], method: "", target: "", version: "", url: "",
    headers: [], body: "",
    translations: { curl: "", fetch: "", httpie: "", python: "", powershell: "" },
  };
  if (!raw || raw.trim() === "") return empty;

  const { lines, body } = splitMessage(raw);
  if (lines.length === 0) return empty;

  // ---- Request line -------------------------------------------------------
  // "METHOD SP request-target SP HTTP-version" (RFC 9112 section 3).
  const parts = lines[0].trim().split(/\s+/);
  // A request line needs more than "two words": the golden vectors caught
  // "hello there" parsing as a request because token count alone accepted it.
  // Require either an explicit HTTP-version token, or a target that is at
  // least shaped like one - origin-form starts with "/", absolute-form with a
  // scheme, and asterisk-form is exactly "*" (RFC 9112 section 3.2).
  const versionish = parts.length >= 3 && /^HTTP\/\d/i.test(parts[2]);
  const targetish = parts.length >= 2 && /^(\/|https?:\/\/|\*$)/i.test(parts[1]);
  if (parts.length < 2 || (!versionish && !targetish)) {
    return { ...empty, warnings: ["not-a-request-line"] };
  }
  const method = parts[0].toUpperCase();
  const target = parts[1];
  const version = parts[2] ?? "HTTP/1.1";

  if (!KNOWN_METHODS.has(method)) warnings.push("unknown-method");
  if (parts[2] && !/^HTTP\/\d(\.\d)?$/i.test(parts[2])) warnings.push("odd-version");

  // ---- Headers ------------------------------------------------------------
  const headers: KV[] = [];
  for (const line of lines.slice(1)) {
    const colon = line.indexOf(":");
    if (colon <= 0) {
      warnings.push("header-without-colon");
      continue;
    }
    headers.push({ name: line.slice(0, colon).trim(), value: line.slice(colon + 1).trim() });
  }

  const find = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  const host = find("host");
  if (!host && !/^https?:\/\//i.test(target)) warnings.push("no-host");

  // ---- URL ----------------------------------------------------------------
  // Absolute-form targets appear in proxy requests and are already complete;
  // origin-form targets are the common case and need the Host header to become
  // an address anything can dial.
  let url: string;
  if (/^https?:\/\//i.test(target)) {
    url = target;
  } else {
    const scheme = /^443$|:443$/.test(host) ? "https" : "https";
    url = `${scheme}://${host || "HOST-MISSING"}${target.startsWith("/") ? target : `/${target}`}`;
  }

  // Content-Length that disagrees with the body is the classic smuggling
  // ingredient, so it is surfaced rather than silently corrected.
  const declared = find("content-length");
  if (declared && body && String(new TextEncoder().encode(body).length) !== declared.trim()) {
    warnings.push("content-length-mismatch");
  }
  if (find("transfer-encoding").toLowerCase().includes("chunked")) warnings.push("chunked-body");
  if (url.startsWith("http://")) warnings.push("cleartext");
  if (find("authorization")) warnings.push("carries-authorization");
  if (find("cookie")) warnings.push("carries-cookie");

  // Headers a client library sets for itself; emitting them causes duplicates
  // or, worse, a mismatch between the declared and the actual body.
  const SKIP = new Set(["host", "content-length", "connection"]);
  const emit = headers.filter((h) => !SKIP.has(h.name.toLowerCase()));

  // ---- Translations -------------------------------------------------------
  const curlParts = [`curl -X ${method} ${shellQuote(url)}`];
  for (const h of emit) curlParts.push(`  -H ${shellQuote(`${h.name}: ${h.value}`)}`);
  if (body) curlParts.push(`  --data-raw ${shellQuote(body)}`);
  const curl = curlParts.join(" \\\n");

  const fetchHeaders = emit.map((h) => `    ${jsString(h.name)}: ${jsString(h.value)},`).join("\n");
  const fetch =
    `await fetch(${jsString(url)}, {\n` +
    `  method: ${jsString(method)},\n` +
    (emit.length ? `  headers: {\n${fetchHeaders}\n  },\n` : "") +
    (body ? `  body: ${jsString(body)},\n` : "") +
    `});`;

  const httpieHeaders = emit.map((h) => ` ${shellQuote(`${h.name}:${h.value}`)}`).join("");
  const httpie =
    body
      ? `echo ${shellQuote(body)} | http ${method} ${shellQuote(url)}${httpieHeaders}`
      : `http ${method} ${shellQuote(url)}${httpieHeaders}`;

  const pyHeaders = emit.map((h) => `    ${pyString(h.name)}: ${pyString(h.value)},`).join("\n");
  const python =
    `import requests\n\n` +
    `resp = requests.request(\n` +
    `    ${pyString(method)},\n` +
    `    ${pyString(url)},\n` +
    (emit.length ? `    headers={\n${pyHeaders}\n    },\n` : "") +
    (body ? `    data=${pyString(body)},\n` : "") +
    `)`;

  const psHeaders = emit.map((h) => `    ${jsString(h.name)} = ${jsString(h.value)}`).join("\n");
  const powershell =
    (emit.length ? `$headers = @{\n${psHeaders}\n}\n` : "") +
    `Invoke-WebRequest -Method ${method} -Uri ${jsString(url)}` +
    (emit.length ? ` -Headers $headers` : "") +
    (body ? ` -Body ${jsString(body)}` : "");

  return {
    ok: true,
    warnings,
    method,
    target,
    version,
    url,
    headers,
    body,
    translations: { curl, fetch, httpie, python, powershell },
  };
}
