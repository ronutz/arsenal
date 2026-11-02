// ============================================================================
// src/lib/share/cases/f5xc-http-lb-route-explainer-revealed.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC HTTP LB route explainer's reveal switch
// (2026-11-01, wave 4B; THE REVEAL SWITCH of 01/11/2026). Ticked in the
// popover, the link carries the object as pasted, its header and cookie
// values included, with the simulator's request. It is offered only when the
// copy replaced header or cookie values alone: never for a SecretType secret,
// never for an Authorization value, never for an object that shows nothing
// to replace.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ROUTE_SHARE_REVEALED, type RouteShareState } from "../../tools/f5xc-http-lb-route-explainer/share"; // the spec

// The redacted copy's inputs, repeated here (one export per case file).
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

/** A spec with HTTPS on custom certificates: one key in clear, one blindfolded, and a cookie the load balancer adds. */
const ROUTE_KEYS = JSON.stringify({ metadata: { name: "tls-lb" }, spec: { https: { tls_parameters: { tls_certificates: [{ certificate_url: "string:///LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t", private_key: { clear_secret_info: { url: XC_CLEAR } } }, { certificate_url: "string:///LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t", private_key: { blindfold_secret_info: { location: XC_BLINDFOLD } } }] } }, routes: [{ simple_route: { path: { prefix: "/" }, origin_pools: [{ pool: { name: "web" } }], advanced_options: { request_cookies_to_add: [{ name: "edge", value: "eu-1" }] } } }] } }, null, 2); // three values replaced

/** A routes array whose route adds an Authorization header toward the origin (RFC 7617's credentials). */
const ROUTE_AUTHZ = JSON.stringify([{ simple_route: { path: { prefix: "/api" }, origin_pools: [{ pool: { name: "api" } }], advanced_options: { request_headers_to_add: [{ name: "Authorization", value: `Basic ${BASIC}` }] } } }], null, 2); // one value replaced

/** The cases. */
export const F5XC_HTTP_LB_ROUTE_REVEALED_SHARE_CASES = defineShareCases<RouteShareState, RouteShareState>({
  spec: ROUTE_SHARE_REVEALED, // the spec
  variant: "revealed", // registers as f5xc-http-lb-route-explainer:revealed
  accept: [
    { id: "example-as-pasted", state: { input: ROUTE_EXAMPLE, method: "GET", path: "" }, params: { input: ROUTE_EXAMPLE }, restored: { input: ROUTE_EXAMPLE, method: "GET", path: "" } }, // the header's value included, by choice
    { id: "example-with-request", state: { input: ROUTE_EXAMPLE, method: "DELETE", path: "/old/page" }, params: { input: ROUTE_EXAMPLE, method: "DELETE", path: "/old/page" }, restored: { input: ROUTE_EXAMPLE, method: "DELETE", path: "/old/page" } }, // with the simulator's request
  ],
  empty: [
    { id: "blank", state: { input: "", method: "GET", path: "" } }, // nothing pasted
    { id: "secret-types", state: { input: ROUTE_KEYS, method: "GET", path: "" } }, // a private key: never revealed
    { id: "authorization", state: { input: ROUTE_AUTHZ, method: "GET", path: "" } }, // a credential: never revealed
    { id: "nothing-replaced", state: { input: JSON.stringify([{ simple_route: { path: { prefix: "/" }, origin_pools: [{ pool: { name: "web" } }] } }], null, 2), method: "GET", path: "" } }, // nothing to reveal
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "", method: null, path: null } }, // nothing
    { id: "method-alone", values: { input: ROUTE_EXAMPLE, method: "PUT", path: null } }, // the same rule as the copy's
  ],
});
