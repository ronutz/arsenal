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
//
// 2026-10-27: share vectors added (SHARE_VECTORS, the copy a Share results link
// carries, made by shareableRequest), so the set id moved from
// "http-request-translator/2026-09-01" (scripts/api-sync.json records it; the
// re-check is in the wave's notes).
// ============================================================================

import { parseRequest, shareableRequest, type RequestParse } from "./compute";

export const SET_ID = "http-request-translator/2026-10-27";

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

/** A share vector: a request, the copy a link carries, how many values it replaces, and what must not be in it. */
export interface RequestShareVector {
  /** The vector's name. */
  name: string;
  /** What it shows. */
  note: string;
  /** The request as pasted. */
  input: string;
  /** The copy, byte for byte (null for a refusal). */
  expect: string | null;
  /** How many values are replaced. */
  redacted: number;
  /** Strings the copy must not hold. */
  secrets: string[];
  /** For a refusal: the rule of the secret left in the copy. */
  residual?: "pem-private-key" | "jwt" | "url-password";
}

/** RFC 6749 section 4.1.3's token request body (112 octets, the Content-Length below). */
const TOKEN_BODY = "grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb"; // as in the RFC

/** The share vectors (2026-10-27). */
export const SHARE_VECTORS: readonly RequestShareVector[] = Object.freeze([
  {
    name: "share-example-bearer",
    note: "The page's Example: the Bearer credentials go, the scheme and the JSON body stay (RFC 9110 11.6.2)",
    input: `POST /v1/users HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\nAuthorization: Bearer tok_abc123\n\n{"name":"Alice","role":"admin"}`,
    expect: `POST /v1/users HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\nAuthorization: Bearer REDACTED\n\n{"name":"Alice","role":"admin"}`,
    redacted: 1,
    secrets: ["tok_abc123"],
  },
  {
    name: "share-form-access-token",
    note: "RFC 6750 section 2.2: access_token in a form body is filled octet for octet, so the body keeps its length",
    input: "POST /resource HTTP/1.1\r\nHost: server.example.com\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\naccess_token=mF_9.B5f-4.1JqM",
    expect: "POST /resource HTTP/1.1\r\nHost: server.example.com\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\naccess_token=***************",
    redacted: 1,
    secrets: ["mF_9.B5f-4.1JqM"],
  },
  {
    name: "share-token-request",
    note: "RFC 6749 section 4.1.3: Basic keeps its user-id (RFC 7617), the code is filled, and Content-Length still matches",
    input: `POST /token HTTP/1.1\r\nHost: server.example.com\r\nAuthorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 112\r\n\r\n${TOKEN_BODY}`,
    expect: `POST /token HTTP/1.1\r\nHost: server.example.com\r\nAuthorization: Basic czZCaGRSa3F0MzpSRURBQ1RFRA==\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 112\r\n\r\n${TOKEN_BODY.replace("SplxlOBeZQQYbYS6WxSbIA", "*".repeat(22))}`,
    redacted: 2,
    secrets: ["czZCaGRSa3F0MzpnWDFmQmF0M2JW", "gX1fBat3bV", "SplxlOBeZQQYbYS6WxSbIA"],
  },
  {
    name: "share-query-and-cookies",
    note: "A secret query parameter and every cookie value go; names stay",
    input: "GET /dashboard?api_key=abcd1234 HTTP/1.1\nHost: app.example.com\nCookie: session=38afes7a8; theme=dark",
    expect: "GET /dashboard?api_key=REDACTED HTTP/1.1\nHost: app.example.com\nCookie: session=REDACTED; theme=REDACTED",
    redacted: 3,
    secrets: ["abcd1234", "38afes7a8"],
  },
  {
    name: "share-proxy-request",
    note: "Absolute form: the target's password (RFC 3986 3.2.1) and Proxy-Authorization's (RFC 9110 11.7.2) go",
    input: "GET http://admin:hunter2@intranet.example/status HTTP/1.1\r\nProxy-Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==\r\n\r\n",
    expect: "GET http://admin:REDACTED@intranet.example/status HTTP/1.1\r\nProxy-Authorization: Basic QWxhZGRpbjpSRURBQ1RFRA==\r\n\r\n",
    redacted: 2,
    secrets: ["hunter2", "QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "open sesame"],
  },
  {
    name: "share-nothing-to-replace",
    note: "A request with no credential: the copy is the request",
    input: "GET /users HTTP/1.1\r\nHost: api.example.com\r\n\r\n",
    expect: "GET /users HTTP/1.1\r\nHost: api.example.com\r\n\r\n",
    redacted: 0,
    secrets: [],
  },
  {
    name: "share-refused-bare-token",
    note: "A JWT pasted as a plain-text body has no name to be found by: the net finds it, and no link is offered",
    input: "POST /v1/verify HTTP/1.1\nHost: api.example.com\nContent-Type: text/plain\n\neyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl",
    expect: null,
    redacted: 0,
    secrets: [],
    residual: "jwt",
  },
]);

/** What the receiving page reads, without the values the copy replaces: the request line's shape, the warnings, the field names, the body's length. */
function readingShape(p: RequestParse): string {
  const target = p.target.split("?")[0].replace(/\/\/[^/?#@]*@/, "//"); // the target without its query or userinfo
  return JSON.stringify([p.ok, p.warnings, p.method, p.version, target, p.headers.map((h) => h.name), new TextEncoder().encode(p.body).length]); // compact
} // readingShape

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    const msg = v.check(parseRequest(v.input));
    if (msg) failures.push(`${v.name}: ${msg}`);
  }
  // The share vectors: the copy, the count, no secret in it, the same reading on the receiving page, a stable copy.
  for (const v of SHARE_VECTORS) {
    try {
      const out = shareableRequest(v.input); // the copy
      if (v.residual) { if (out.residual?.rule !== v.residual) failures.push(`${v.name}: residual ${out.residual?.rule ?? "none"} != ${v.residual}`); continue; } // a refusal
      if (out.residual) failures.push(`${v.name}: unexpected residual ${out.residual.rule}`); // nothing may be left
      if (out.text !== v.expect) failures.push(`${v.name}: copy ${JSON.stringify(out.text)}`); // byte for byte
      if (out.redacted !== v.redacted) failures.push(`${v.name}: redacted ${out.redacted} != ${v.redacted}`); // the count
      for (const secret of v.secrets) if (out.text.includes(secret)) failures.push(`${v.name}: the copy contains ${JSON.stringify(secret)}`); // never travels
      if (readingShape(parseRequest(v.input)) !== readingShape(parseRequest(out.text))) failures.push(`${v.name}: the copy reads differently`); // the same request
      const again = shareableRequest(out.text); // the copy of the copy
      if (again.text !== out.text || again.redacted !== 0) failures.push(`${v.name}: the copy of the copy differs`); // stable
    } catch (e) {
      failures.push(`${v.name}: threw ${(e as Error).message}`); // a defect
    }
  }
  return { ok: failures.length === 0, failures };
}
