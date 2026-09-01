// ============================================================================
// src/lib/tools/http-request-translator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Locked cases: each raw HTTP request has expected parse facts. verifyVectors()
// checks the request line, header handling, URL assembly from Host, the
// warnings that matter operationally, and that each translation contains the
// load-bearing substrings.
//
// The cases are deliberately unglamorous: an origin-form GET, a POST with a
// body, absolute-form (proxy) targets, CRLF and bare-LF line endings, a
// Content-Length that lies, and a chunked body we decline to decode. Those are
// the shapes a capture actually produces.
// ============================================================================

import { parseRequest } from "./compute";

export const SET_ID = "http-request-translator/2026-09-01";

interface Vector {
  name: string;
  input: string;
  check: (p: ReturnType<typeof parseRequest>) => string | null; // null = pass
}

export const VECTORS: Vector[] = [
  {
    name: "origin-form-get",
    input: "GET /users HTTP/1.1\r\nHost: api.example.com\r\n\r\n",
    check: (p) =>
      !p.ok ? "should parse"
      : p.method !== "GET" ? "method should be GET"
      : p.url !== "https://api.example.com/users" ? `url wrong: ${p.url}`
      : !p.translations.curl.includes("curl -X GET") ? "curl missing method"
      : null,
  },
  {
    name: "bare-lf-accepted",
    input: "GET /a HTTP/1.1\nHost: h.example\n\n",
    check: (p) => (!p.ok ? "bare LF should still parse" : p.target !== "/a" ? "target wrong" : null),
  },
  {
    name: "post-with-body",
    input:
      "POST /v1/users HTTP/1.1\r\nHost: api.example.com\r\nContent-Type: application/json\r\nContent-Length: 26\r\n\r\n{\"name\":\"Alice\",\"a\":true}",
    check: (p) =>
      p.method !== "POST" ? "method wrong"
      : p.body === "" ? "body should be captured"
      : !p.translations.curl.includes("--data-raw") ? "curl should carry the body"
      : !p.translations.fetch.includes("body:") ? "fetch should carry the body"
      : null,
  },
  {
    name: "host-header-not-re-emitted",
    input: "GET / HTTP/1.1\r\nHost: h.example\r\nAccept: */*\r\n\r\n",
    check: (p) =>
      p.translations.curl.includes("Host:") ? "Host must not be re-emitted as -H"
      : !p.translations.curl.includes("Accept") ? "other headers must survive"
      : null,
  },
  {
    name: "content-length-mismatch-warns",
    input: "POST /x HTTP/1.1\r\nHost: h.example\r\nContent-Length: 999\r\n\r\nshort",
    check: (p) =>
      !p.warnings.includes("content-length-mismatch") ? "should warn on a lying Content-Length" : null,
  },
  {
    name: "chunked-declined",
    input: "POST /x HTTP/1.1\r\nHost: h.example\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nhello\r\n0\r\n\r\n",
    check: (p) => (!p.warnings.includes("chunked-body") ? "should warn that chunked is not decoded" : null),
  },
  {
    name: "absolute-form-target",
    input: "GET http://proxy.example/a HTTP/1.1\r\nHost: proxy.example\r\n\r\n",
    check: (p) =>
      p.url !== "http://proxy.example/a" ? `absolute-form should win: ${p.url}`
      : !p.warnings.includes("cleartext") ? "http:// should warn"
      : null,
  },
  {
    name: "credentials-surfaced",
    input: "GET /a HTTP/1.1\r\nHost: h.example\r\nAuthorization: Bearer tok\r\nCookie: s=1\r\n\r\n",
    check: (p) =>
      !p.warnings.includes("carries-authorization") ? "should flag Authorization"
      : !p.warnings.includes("carries-cookie") ? "should flag Cookie"
      : null,
  },
  {
    name: "missing-host-warns",
    input: "GET /a HTTP/1.1\r\n\r\n",
    check: (p) => (!p.warnings.includes("no-host") ? "origin-form without Host should warn" : null),
  },
  {
    name: "unknown-method-warns",
    input: "FROB /a HTTP/1.1\r\nHost: h.example\r\n\r\n",
    check: (p) => (!p.warnings.includes("unknown-method") ? "should flag an unknown method" : null),
  },
  {
    name: "all-five-translations-present",
    input: "PUT /a HTTP/1.1\r\nHost: h.example\r\nX-A: b\r\n\r\nbody",
    check: (p) => {
      const t = p.translations;
      if (!t.curl || !t.fetch || !t.httpie || !t.python || !t.powershell) return "all five must be produced";
      if (!t.python.includes("requests.request")) return "python should use requests";
      if (!t.httpie.includes("http PUT")) return "httpie should carry the method";
      if (!t.powershell.includes("Invoke-WebRequest")) return "powershell should use Invoke-WebRequest";
      return null;
    },
  },
  {
    name: "not-a-request",
    input: "hello there",
    check: (p) => (p.ok ? "prose should not parse as a request" : null),
  },
];

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    const msg = v.check(parseRequest(v.input));
    if (msg) failures.push(`${v.name}: ${msg}`);
  }
  return { ok: failures.length === 0, failures };
}
