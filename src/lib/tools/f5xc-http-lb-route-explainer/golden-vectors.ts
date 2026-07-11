// ============================================================================
// src/lib/tools/f5xc-http-lb-route-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: a representative http_loadbalancer routes block decoded into
// asserted route views, plus first-match simulations and an ordering-warning
// case.
// ============================================================================

import { explainRoutes, simulateRequest } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-http-lb-route-explainer/2026-07-11";

const SAMPLE = JSON.stringify({
  metadata: { name: "shop-lb" },
  spec: {
    routes: [
      { custom_route_object: { route_ref: { name: "js-page-rewrite", namespace: "shared" } } },
      {
        simple_route: {
          http_method: "ANY",
          path: { regex: "/trading/.*" },
          origin_pools: [{ pool: { name: "trading-pool" }, weight: 100 }],
          advanced_options: {
            app_firewall: { name: "blocking-waf" },
            request_headers_to_add: [{ name: "X-Route", value: "trading" }],
            response_headers_to_remove: ["Server"],
          },
        },
      },
      {
        redirect_route: {
          http_method: "GET",
          path: { prefix: "/old" },
          route_redirect: { host_redirect: "www.example.com", path_redirect: "/new", response_code: 301, proto_redirect: "https" },
        },
      },
      { direct_response_route: { path: { prefix: "/health" }, route_direct_response: { response_code: 200, response_body: "OK" } } },
      { simple_route: { path: { prefix: "/" }, origin_pools: [{ pool: { name: "default-pool" } }], advanced_options: { disable_waf: {} } } },
    ],
  },
});

// catch-all BEFORE a specific route -> ordering warning
const MISORDERED = JSON.stringify({
  routes: [
    { simple_route: { path: { prefix: "/" }, origin_pools: [{ pool: { name: "p" } }] } },
    { simple_route: { path: { prefix: "/api" }, origin_pools: [{ pool: { name: "api" } }] } },
  ],
});

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const ok = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  const r = explainRoutes(SAMPLE);
  ok("recognized", r.ok && r.recognized, JSON.stringify(r.warnings));
  ok("route-count", r.routes.length === 5, `got ${r.routes.length}`);

  const [c, t, red, dr, def] = r.routes;
  ok("custom", c.type === "custom" && c.customRef === "js-page-rewrite", JSON.stringify(c));
  ok("simple-regex", t.type === "simple" && t.path.kind === "regex" && t.path.value === "/trading/.*", JSON.stringify(t.path));
  ok("simple-method-any", t.method === "ANY");
  ok("simple-pool-weight", t.pools.length === 1 && t.pools[0].name === "trading-pool" && t.pools[0].weight === 100, JSON.stringify(t.pools));
  ok("simple-waf-app", t.waf === "app_firewall" && t.wafRef === "blocking-waf", `${t.waf}/${t.wafRef}`);
  ok("simple-req-add", t.requestHeadersAdd.length === 1 && t.requestHeadersAdd[0].name === "X-Route", JSON.stringify(t.requestHeadersAdd));
  ok("simple-resp-remove", t.responseHeadersRemove.length === 1 && t.responseHeadersRemove[0] === "Server", JSON.stringify(t.responseHeadersRemove));
  ok("redirect", red.type === "redirect" && red.method === "GET" && red.path.kind === "prefix" && red.path.value === "/old", JSON.stringify(red.path));
  ok("redirect-params", red.redirect?.host === "www.example.com" && red.redirect?.pathRewrite === "/new" && red.redirect?.responseCode === 301 && red.redirect?.proto === "https", JSON.stringify(red.redirect));
  ok("direct-response", dr.type === "direct_response" && dr.directResponse?.responseCode === 200 && dr.directResponse?.hasBody === true, JSON.stringify(dr.directResponse));
  ok("default-waf-disabled", def.type === "simple" && def.waf === "disabled" && def.path.value === "/", JSON.stringify(def));
  ok("warn-waf-disabled", r.warnings.some((w) => w.includes("route 5 disables WAF")), JSON.stringify(r.warnings));

  // first-match simulations
  ok("sim-trading", simulateRequest(r.routes, "GET", "/trading/AAPL").matchedIndex === 1, JSON.stringify(simulateRequest(r.routes, "GET", "/trading/AAPL")));
  ok("sim-old-get", simulateRequest(r.routes, "GET", "/old").matchedIndex === 2);
  ok("sim-old-post", simulateRequest(r.routes, "POST", "/old").matchedIndex === 4, "POST /old should skip GET-only redirect and hit default");
  ok("sim-health", simulateRequest(r.routes, "GET", "/health").matchedIndex === 3);
  ok("sim-custom-caveat", (simulateRequest(r.routes, "GET", "/trading/AAPL").note || "").includes("custom route"), "should flag custom route ahead");

  // ordering warning
  const mis = explainRoutes(MISORDERED);
  ok("ordering-warning", mis.warnings.some((w) => w.includes("first-match")), JSON.stringify(mis.warnings));

  // negatives
  ok("reject-bad-json", explainRoutes("{not json").ok === false, "bad JSON not rejected");
  ok("no-routes", explainRoutes(JSON.stringify({ spec: { domains: ["x.com"] } })).recognized === false, "missing routes not flagged");
  ok("reject-empty", explainRoutes("").ok === false, "empty not rejected");

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "recognized", "route-count", "custom", "simple-regex", "simple-method-any", "simple-pool-weight", "simple-waf-app",
  "simple-req-add", "simple-resp-remove", "redirect", "redirect-params", "direct-response", "default-waf-disabled",
  "warn-waf-disabled", "sim-trading", "sim-old-get", "sim-old-post", "sim-health", "sim-custom-caveat",
  "ordering-warning", "reject-bad-json", "no-routes", "reject-empty",
];
