// ============================================================================
// src/lib/share/cases/f5xc-http-lb-route-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC HTTP LB route explainer (2026-11-01, wave 4B): a
// copy goes, with every SecretType secret (a private key in clear or
// blindfolded) and every added header or cookie value as [redacted], plus the
// simulator's method and path when a path is typed; a credential the page
// shows (an Authorization header matcher's value, a JWT in the path) blocks
// the link; text without routes has nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ROUTE_SHARE, type RouteShareState } from "../../tools/f5xc-http-lb-route-explainer/share"; // the spec

/** The page's Example, built as the component builds it. */
const ROUTE_EXAMPLE = JSON.stringify(
  {
    metadata: { name: "shop-lb" }, // the load balancer
    spec: {
      routes: [
        { simple_route: { http_method: "ANY", path: { regex: "/trading/.*" }, origin_pools: [{ pool: { name: "trading-pool" }, weight: 100 }], advanced_options: { app_firewall: { name: "blocking-waf" }, request_headers_to_add: [{ name: "X-Route", value: "trading" }] } } }, // a header added
        { redirect_route: { http_method: "GET", path: { prefix: "/old" }, route_redirect: { host_redirect: "www.example.com", path_redirect: "/new", response_code: 301, proto_redirect: "https" } } }, // a redirect
        { direct_response_route: { path: { prefix: "/health" }, route_direct_response: { response_code: 200, response_body: "OK" } } }, // a direct response
        { simple_route: { path: { prefix: "/" }, origin_pools: [{ pool: { name: "default-pool" } }], advanced_options: { disable_waf: {} } } }, // the catch-all
      ],
    },
  },
  null,
  2,
); // as the component holds it

/** The XC API reference's own example of a clear secret (read 2026-11-01). */
const XC_CLEAR = "string:///U2VjcmV0SW5mb3JtYXRpb24="; // never in a link
/** The XC Wingman guide's sample Blindfold secret (read 2026-11-01). */
const XC_BLINDFOLD = "string:///AAAACWN1c3RvbWVyMQAAAAEAAAAAAAAAaAIAAAAFA6ur/XkAAAEArc3DxZa69sWeIn9NRrHGcZlZaXLHWYjc57jIS76Z47AcU0jDmodz3lNEysVO2s"; // never in a link
/** RFC 7617 section 2's example credentials (read 2026-11-01). */
const BASIC = "QWxhZGRpbjpvcGVuIHNlc2FtZQ=="; // never in a link
/** RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** A spec with HTTPS on custom certificates: one key in clear, one blindfolded, and a cookie the load balancer adds. */
const ROUTE_KEYS = JSON.stringify({ metadata: { name: "tls-lb" }, spec: { https: { tls_parameters: { tls_certificates: [{ certificate_url: "string:///LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t", private_key: { clear_secret_info: { url: XC_CLEAR } } }, { certificate_url: "string:///LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t", private_key: { blindfold_secret_info: { location: XC_BLINDFOLD } } }] } }, routes: [{ simple_route: { path: { prefix: "/" }, origin_pools: [{ pool: { name: "web" } }], advanced_options: { request_cookies_to_add: [{ name: "edge", value: "eu-1" }] } } }] } }, null, 2); // three values replaced
/** The copy of ROUTE_KEYS. */
const ROUTE_KEYS_COPY = ROUTE_KEYS.replace(XC_CLEAR, "[redacted]").replace(XC_BLINDFOLD, "[redacted]").replace("\"value\": \"eu-1\"", "\"value\": \"[redacted]\""); // as the scanner writes it

/** A routes array whose route adds an Authorization header toward the origin (RFC 7617's credentials). */
const ROUTE_AUTHZ = JSON.stringify([{ simple_route: { path: { prefix: "/api" }, origin_pools: [{ pool: { name: "api" } }], advanced_options: { request_headers_to_add: [{ name: "Authorization", value: `Basic ${BASIC}` }] } } }], null, 2); // one value replaced

/** The cases. */
export const F5XC_HTTP_LB_ROUTE_SHARE_CASES = defineShareCases<RouteShareState, RouteShareState>({
  spec: ROUTE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: ROUTE_EXAMPLE, method: "GET", path: "" }, params: { input: ROUTE_EXAMPLE.replace("\"value\": \"trading\"", "\"value\": \"[redacted]\"") }, restored: { input: ROUTE_EXAMPLE.replace("\"value\": \"trading\"", "\"value\": \"[redacted]\""), method: "GET", path: "" }, mustNotContain: ["\"trading\""] }, // the header's value replaced, its name kept
    { id: "example-with-request", state: { input: ROUTE_EXAMPLE, method: "POST", path: "/trading/AAPL" }, params: { input: ROUTE_EXAMPLE.replace("\"value\": \"trading\"", "\"value\": \"[redacted]\""), method: "POST", path: "/trading/AAPL" }, restored: { input: ROUTE_EXAMPLE.replace("\"value\": \"trading\"", "\"value\": \"[redacted]\""), method: "POST", path: "/trading/AAPL" } }, // the simulator's request goes too
    { id: "keys-and-cookie", state: { input: ROUTE_KEYS, method: "GET", path: "" }, params: { input: ROUTE_KEYS_COPY }, restored: { input: ROUTE_KEYS_COPY, method: "GET", path: "" }, mustNotContain: [XC_CLEAR, XC_BLINDFOLD, "U2VjcmV0SW5mb3JtYXRpb24=", "eu-1"] }, // SecretType in clear and blindfolded, and a cookie value
    { id: "authorization-added", state: { input: ROUTE_AUTHZ, method: "GET", path: "/api/v1" }, params: { input: ROUTE_AUTHZ.replace(`Basic ${BASIC}`, "[redacted]"), method: "GET", path: "/api/v1" }, restored: { input: ROUTE_AUTHZ.replace(`Basic ${BASIC}`, "[redacted]"), method: "GET", path: "/api/v1" }, mustNotContain: [BASIC] }, // a credential added toward the origin
  ],
  arrive: [
    { id: "path-without-method", values: { input: ROUTE_EXAMPLE, path: "/old", method: null }, restored: { input: ROUTE_EXAMPLE, method: "GET", path: "/old" } }, // the page's default method
  ],
  empty: [
    { id: "blank", state: { input: "", method: "GET", path: "/x" } }, // nothing pasted
    { id: "not-json", state: { input: "routes: []", method: "GET", path: "" } }, // the page's parse error
    { id: "no-routes", state: { input: "{\"spec\": {\"domains\": [\"a.example.com\"]}}", method: "GET", path: "" } }, // no routes array
  ],
  blocked: [
    { id: "authorization-matcher", state: { input: JSON.stringify([{ simple_route: { path: { prefix: "/admin" }, headers: [{ name: "Authorization", exact: `Bearer ${JWT}` }], origin_pools: [{ pool: { name: "admin" } }] } }], null, 2), method: "GET", path: "" }, code: "secret" }, // the page shows a matcher's value
    { id: "jwt-in-path", state: { input: ROUTE_EXAMPLE, method: "GET", path: `/trading/x?t=${JWT}` }, code: "secret" }, // a JWS in the simulator's path
  ],
  reject: [
    { id: "empty", values: { input: "", method: null, path: null } }, // nothing
    { id: "method-alone", values: { input: ROUTE_EXAMPLE, method: "POST", path: null } }, // a method is written only with a path
    { id: "unknown-method", values: { input: ROUTE_EXAMPLE, method: "BREW", path: "/x" } }, // not one of the page's methods
    { id: "lower-method", values: { input: ROUTE_EXAMPLE, method: "get", path: "/x" } }, // ids are exact
  ],
});
