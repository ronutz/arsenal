// ============================================================================
// src/lib/share/cases/http-header-order-fingerprint.ts
// ----------------------------------------------------------------------------
// Share cases of the HTTP header-order fingerprint (wave 4C, 2026-11-01): the
// link carries a copy of the block with every credential replaced by REDACTED
// (the HTTP rules of src/lib/tools/http-message-decoder/http-secrets.ts),
// names, order, casing and the User-Agent kept. The secrets used are published
// examples only: RFC 7617's Basic credentials, RFC 6265's SID, RFC 6749's
// authorization code, RFC 7519's example JWT, AWS's example access key ID.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { HEADER_ORDER_SHARE, type HeaderOrderShareState } from "../../tools/http-header-order-fingerprint/share"; // the spec

/** The page's Example (the "v1" golden vector's Chrome block, as the component holds it). */
const CHROME = ["GET / HTTP/1.1", "Host: example.com", "Connection: keep-alive", 'sec-ch-ua: "Chromium";v="120"', "sec-ch-ua-mobile: ?0", 'sec-ch-ua-platform: "Windows"', "Upgrade-Insecure-Requests: 1", "User-Agent: Mozilla/5.0 Chrome/120.0.0.0", "Accept: text/html", "Sec-Fetch-Site: none", "Sec-Fetch-Mode: navigate", "Sec-Fetch-Dest: document", "Accept-Encoding: gzip, deflate, br", "Accept-Language: en-US,en;q=0.9"].join("\n"); // verbatim
/** RFC 7519 section 3.1's example JWT (published). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // header.claims.signature
/** A browser request copied from devtools, with cookies, Basic credentials and an authorization code in the Referer. */
const SIGNED_IN = ["GET /account?tab=orders HTTP/1.1", "Host: shop.example.com", "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0", "Accept: text/html", "Accept-Language: en-US,en;q=0.5", "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "Cookie: SID=31d4d96e407aad42; lang=en-US", "Referer: https://shop.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz", "Sec-Fetch-Dest: document"].join("\r\n"); // CR LF, as copied
/** Its copy: Basic keeps its user (base64 of "Aladdin:REDACTED"), every cookie value and the code go. */
const SIGNED_IN_COPY = ["GET /account?tab=orders HTTP/1.1", "Host: shop.example.com", "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0", "Accept: text/html", "Accept-Language: en-US,en;q=0.5", "Authorization: Basic QWxhZGRpbjpSRURBQ1RFRA==", "Cookie: SID=REDACTED; lang=REDACTED", "Referer: https://shop.example.com/cb?code=REDACTED&state=xyz", "Sec-Fetch-Dest: document"].join("\r\n"); // CR LF kept
/** A curl request with a bearer JWT, an API key header and a token in the query. */
const CURL = "GET /v1/items?access_token=abc123def&page=2 HTTP/1.1\nHost: api.example.com\nUser-Agent: curl/8.5.0\nAccept: */*\nAuthorization: Bearer " + JWT + "\nX-API-Key: AKIAIOSFODNN7EXAMPLE"; // a library client
/** Its copy: the JWT keeps its header (the algorithm still reads), the rest go. */
const CURL_COPY = "GET /v1/items?access_token=REDACTED&page=2 HTTP/1.1\nHost: api.example.com\nUser-Agent: curl/8.5.0\nAccept: */*\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.REDACTED.REDACTED\nX-API-Key: REDACTED"; // names and order kept

/** The cases. */
export const HEADER_ORDER_SHARE_CASES = defineShareCases<HeaderOrderShareState, HeaderOrderShareState>({
  spec: HEADER_ORDER_SHARE, // the spec
  accept: [
    { id: "example-nothing-to-replace", state: { input: CHROME }, params: { input: CHROME }, restored: { input: CHROME } }, // the Example holds no credential: the copy is the block
    { id: "signed-in-browser", state: { input: SIGNED_IN }, params: { input: SIGNED_IN_COPY }, restored: { input: SIGNED_IN_COPY }, mustNotContain: ["QWxhZGRpbjpvcGVuIHNlc2FtZQ==", "31d4d96e407aad42", "SplxlOBeZQQYbYS6WxSbIA", "en-US; "] }, // credentials, cookies and the code go
    { id: "curl-with-tokens", state: { input: CURL }, params: { input: CURL_COPY }, restored: { input: CURL_COPY }, mustNotContain: ["abc123def", "AKIAIOSFODNN7EXAMPLE", "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk", "eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ"] }, // the token, the key, the claims and the signature go
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-header", state: { input: "GET / HTTP/1.1" } }, // the engine refuses it: nothing to share
    { id: "not-a-header-block", state: { input: "this is not a header block" } }, // the engine refuses it
  ],
  blocked: [
    { id: "jwt-in-the-path", state: { input: "GET /reset/" + JWT + " HTTP/1.1\nHost: app.example.com\nUser-Agent: curl/8.5.0" }, code: "secret" }, // a token where no name says so: the net finds it, no link
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "   " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
