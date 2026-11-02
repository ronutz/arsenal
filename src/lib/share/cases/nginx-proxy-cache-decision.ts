// ============================================================================
// src/lib/share/cases/nginx-proxy-cache-decision.ts
// ----------------------------------------------------------------------------
// Share cases of the NGINX proxy_cache decision engine (2026-11-01, wave 4B): a
// copy goes, with cookie values, Authorization credentials and secret-looking
// header values as [redacted], every other byte as typed (comments and CR LF
// line ends included), and decides as the box does; a credential left in it
// (a JWT in the URI) blocks the link; a box the page refuses has nothing to
// share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PROXY_CACHE_SHARE, type ProxyCacheShareState } from "../../tools/nginx-proxy-cache-decision/share"; // the spec

/** The page's Example, as the component joins it. */
const EXAMPLE = [
  "# Ignoring Set-Cookie while the key ignores cookies: the classic leak.", // a comment
  "proxy_cache zone1;", // caching on
  "proxy_cache_valid 200 10m;", // a lifetime
  "proxy_ignore_headers Set-Cookie;", // the mistake
  "", // a blank line
  "request GET /account", // the request
  "request_header Cookie: session=abc", // its cookie
  "", // a blank line
  "response 200", // the response
  "response_header Set-Cookie: id=1", // its cookie
].join("\n"); // as the component holds it

/** RFC 6265 section 4.2.1's session identifier and RFC 7617 section 2's credentials (read 2026-11-01). */
const SID = "31d4d96e407aad42"; // never in a link
const BASIC = "QWxhZGRpbjpvcGVuIHNlc2FtZQ=="; // never in a link
/** RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** A per-user key: the cookie's value is in the rendered key, so the copy's key shows the mark. */
const KEYED = `proxy_cache zone1;\r\nproxy_cache_key $scheme$host$request_uri$cookie_SID;\r\nproxy_cache_valid 200 5m;\r\nrequest GET /cart?x=1\r\nrequest_header Host: shop.example.com\r\nrequest_header Cookie: SID=${SID}; lang=en-US   # the browser's cookies\r\nrequest_header Authorization: Basic ${BASIC};\r\nrequest_header X-Api-Key: k-123-sample\r\nresponse 200\r\nresponse_header Cache-Control: public, max-age=60`; // CR LF, a comment, a trailing ";"
/** Its copy. */
const KEYED_COPY = KEYED.replace(`SID=${SID}; lang=en-US`, "SID=[redacted]; lang=[redacted]").replace(`Basic ${BASIC};`, "Basic [redacted];").replace("X-Api-Key: k-123-sample", "X-Api-Key: [redacted]"); // four values

/** An exchange with nothing to replace. */
const PLAIN = "proxy_cache zone1;\nproxy_cache_valid 200 10m;\nrequest GET /logo.png\nresponse 200\nresponse_header Cache-Control: max-age=3600"; // stored and served

/** The cases. */
export const NGINX_PROXY_CACHE_SHARE_CASES = defineShareCases<ProxyCacheShareState, ProxyCacheShareState>({
  spec: PROXY_CACHE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE.replace("session=abc", "session=[redacted]").replace("Set-Cookie: id=1", "Set-Cookie: id=[redacted]") }, restored: { input: EXAMPLE.replace("session=abc", "session=[redacted]").replace("Set-Cookie: id=1", "Set-Cookie: id=[redacted]") } }, // the two cookie values
    { id: "keyed-credentials", state: { input: KEYED }, params: { input: KEYED_COPY }, restored: { input: KEYED_COPY }, mustNotContain: [SID, BASIC, "k-123-sample", "en-US"] }, // cookies, Basic credentials and an API key header
    { id: "nothing-to-replace", state: { input: PLAIN }, params: { input: PLAIN }, restored: { input: PLAIN } }, // the copy is the box
    { id: "scheme-alone-kept", state: { input: "proxy_cache z;\nrequest GET /\nrequest_header Authorization: Negotiate\nresponse 404" }, params: { input: "proxy_cache z;\nrequest GET /\nrequest_header Authorization: Negotiate\nresponse 404" }, restored: { input: "proxy_cache z;\nrequest GET /\nrequest_header Authorization: Negotiate\nresponse 404" } }, // a scheme alone holds no credentials
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "no-response", state: { input: "proxy_cache zone1;\nrequest GET /" } }, // the page's error
    { id: "unknown-directive", state: { input: "proxy_buffering off;\nrequest GET /\nresponse 200" } }, // the page's error
  ],
  blocked: [
    { id: "jwt-in-uri", state: { input: `proxy_cache zone1;\nrequest GET /feed?access_token=${JWT}\nresponse 200` }, code: "secret" }, // a JWS the copy does not replace
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
