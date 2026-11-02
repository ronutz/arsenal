// ============================================================================
// src/lib/share/cases/secure-headers-revealed.ts
// ----------------------------------------------------------------------------
// Share cases of the secure-headers analyser's reveal switch (PRIME 01/11/2026:
// "Add an option-toggle to display the redacted values."). Ticked in the
// popover, the link carries the response as pasted, every value included; the
// arrival is the same paste as the redacted copy's (one decode rule). Text with
// no header line still has nothing to share. The page offers the switch only
// beside a redacted copy that replaced something (SecureHeadersTool), so the
// cases here pin the spec, not when it is offered.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SECURE_HEADERS_SHARE_REVEALED, type SecureHeadersShareState } from "../../tools/secure-headers/share"; // the spec

/** The page's Example (golden vector, verbatim), as in the redacted copy's cases. */
const EXAMPLE = "HTTP/2 200\nstrict-transport-security: max-age=63072000; includeSubDomains; preload\ncontent-security-policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\nx-content-type-options: nosniff\nx-frame-options: DENY\nreferrer-policy: strict-origin-when-cross-origin\npermissions-policy: geolocation=(), camera=(), microphone=()\ncross-origin-opener-policy: same-origin\ncross-origin-resource-policy: same-origin\nset-cookie: __Host-session=abc; Secure; HttpOnly; SameSite=Lax; Path=/"; // as the component holds it
/** RFC 6265 section 4.2.1's cookies and RFC 6749 section 4.1.2's authorization code (read 2026-10-27), with CR LF. */
const REDIRECT = "HTTP/1.1 302 Found\r\nLocation: https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz\r\nContent-Type: text/html\r\nX-Frame-Options: DENY\r\nSet-Cookie: SID=31d4d96e407aad42; Path=/; Secure; HttpOnly\r\nSet-Cookie: lang=en-US; Path=/; Domain=example.com"; // as copied from a client

/** The cases. */
export const SECURE_HEADERS_REVEALED_SHARE_CASES = defineShareCases<SecureHeadersShareState, SecureHeadersShareState>({
  spec: SECURE_HEADERS_SHARE_REVEALED, // the spec
  variant: "revealed", // registers as secure-headers:revealed, beside the redacted copy's set
  accept: [
    { id: "example-as-pasted", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the cookie's value included, by choice
    { id: "redirect-as-pasted", state: { input: REDIRECT }, params: { input: REDIRECT }, restored: { input: REDIRECT } }, // CR LF and every value kept, as pasted
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-header-line", state: { input: "just some text" } }, // nothing graded: no switch, no link
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "   " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
