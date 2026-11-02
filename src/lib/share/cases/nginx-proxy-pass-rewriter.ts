// ============================================================================
// src/lib/share/cases/nginx-proxy-pass-rewriter.ts
// ----------------------------------------------------------------------------
// Share cases of the NGINX proxy_pass rewriter (2026-11-01, wave 4B): the box
// goes as typed once the page has a result, with a caution line (the upstream
// names a backend); a password in the upstream's URL blocks the link; a box
// the page refuses has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PROXY_PASS_SHARE, type ProxyPassShareState } from "../../tools/nginx-proxy-pass-rewriter/share"; // the spec

/** The page's Example, as the component joins it. */
const EXAMPLE = [
  "# No URI part after the host - the prefix is KEPT.", // a comment
  "location /app/", // the location
  "proxy_pass http://backend;", // no URI part
  "", // a blank line
  "request /app/page", // the request
].join("\n"); // as the component holds it

/** An internal upstream with a URI part. */
const INTERNAL = "location /api/\nproxy_pass http://10.20.30.40:8080/v2/;\nrequest /api/orders?page=2"; // the prefix replaced

/** RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** The cases. */
export const NGINX_PROXY_PASS_SHARE_CASES = defineShareCases<ProxyPassShareState, ProxyPassShareState>({
  spec: PROXY_PASS_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as typed
    { id: "internal-upstream", state: { input: INTERNAL }, params: { input: INTERNAL }, restored: { input: INTERNAL } }, // an address goes, with the caution line
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "no-proxy-pass", state: { input: "location /app/\nrequest /app/x" } }, // the page's error
  ],
  blocked: [
    { id: "jwt-in-request", state: { input: `location /app/\nproxy_pass http://backend/;\nrequest /app/cb?id_token=${JWT}` }, code: "secret" }, // a JWS in the request
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "  \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
