// ============================================================================
// src/lib/share/cases/secure-headers.ts
// ----------------------------------------------------------------------------
// Share cases of the secure-headers analyser: the link carries a copy of the
// response with every header by name, the graded values kept, each cookie's
// value and every other value replaced by [redacted] (a session identifier,
// an authorization code in a Location never travel); a credential in a graded
// value blocks the link; text with no header line has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SECURE_HEADERS_SHARE, type SecureHeadersShareState } from "../../tools/secure-headers/share"; // the spec

/** The page's Example (golden vector, verbatim). */
const EXAMPLE = "HTTP/2 200\nstrict-transport-security: max-age=63072000; includeSubDomains; preload\ncontent-security-policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\nx-content-type-options: nosniff\nx-frame-options: DENY\nreferrer-policy: strict-origin-when-cross-origin\npermissions-policy: geolocation=(), camera=(), microphone=()\ncross-origin-opener-policy: same-origin\ncross-origin-resource-policy: same-origin\nset-cookie: __Host-session=abc; Secure; HttpOnly; SameSite=Lax; Path=/"; // as the component holds it
/** Its copy: the cookie's value replaced. */
const EXAMPLE_COPY = EXAMPLE.replace("__Host-session=abc;", "__Host-session=[redacted];"); // one value
/** RFC 6265 section 4.2.1's two cookies and RFC 6749 section 4.1.2's authorization code, standing in for live ones. */
const REDIRECT = "HTTP/1.1 302 Found\r\nLocation: https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz\r\nContent-Type: text/html\r\nX-Frame-Options: DENY\r\nSet-Cookie: SID=31d4d96e407aad42; Path=/; Secure; HttpOnly\r\nSet-Cookie: lang=en-US; Path=/; Domain=example.com"; // CR LF, as copied from a client
/** Its copy. */
const REDIRECT_COPY = "HTTP/1.1 302 Found\nLocation: [redacted]\nContent-Type: [redacted]\nX-Frame-Options: DENY\nSet-Cookie: SID=[redacted]; Path=/; Secure; HttpOnly\nSet-Cookie: lang=[redacted]; Path=/; Domain=example.com"; // four values replaced
/** A response with no graded header at all (graded F): every value replaced, the names kept. */
const BARE = "HTTP/1.1 200 OK\nContent-Type: text/html\nContent-Length: 12"; // nothing graded
/** A header block without a status line, one value folded over two lines. */
const FOLDED = "Strict-Transport-Security: max-age=31536000;\n includeSubDomains\nServer: nginx"; // obsolete folding
/** RFC 7519 section 3.1's example JWT (read 2026-10-27), standing in for a live token. */
const RFC7519_JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // three base64url segments

/** The cases. */
export const SECURE_HEADERS_SHARE_CASES = defineShareCases<SecureHeadersShareState, SecureHeadersShareState>({
  spec: SECURE_HEADERS_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE_COPY }, restored: { input: EXAMPLE_COPY }, mustNotContain: ["__Host-session=abc"] }, // the cookie's value replaced
    { id: "redirect-with-code-and-cookies", state: { input: REDIRECT }, params: { input: REDIRECT_COPY }, restored: { input: REDIRECT_COPY }, mustNotContain: ["SplxlOBeZQQYbYS6WxSbIA", "31d4d96e407aad42", "en-US", "client.example.com"] }, // the code and the cookie values never travel
    { id: "nothing-graded", state: { input: BARE }, params: { input: "HTTP/1.1 200 OK\nContent-Type: [redacted]\nContent-Length: [redacted]" }, restored: { input: "HTTP/1.1 200 OK\nContent-Type: [redacted]\nContent-Length: [redacted]" } }, // still graded F
    { id: "folded", state: { input: FOLDED }, params: { input: "Strict-Transport-Security: max-age=31536000; includeSubDomains\nServer: nginx" }, restored: { input: "Strict-Transport-Security: max-age=31536000; includeSubDomains\nServer: nginx" } }, // the folded value on one line
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-header-line", state: { input: "just some text" } }, // the page shows its error
  ],
  blocked: [
    { id: "jwt-in-graded-value", state: { input: `HTTP/1.1 200 OK\nContent-Security-Policy: default-src 'self'; report-uri https://r.example.com/csp?jwt=${RFC7519_JWT}` }, code: "secret" }, // a JWS in a value the page grades
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "   " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
