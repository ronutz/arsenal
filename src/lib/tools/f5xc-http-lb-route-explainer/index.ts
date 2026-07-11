// ============================================================================
// src/lib/tools/f5xc-http-lb-route-explainer/index.ts
// ----------------------------------------------------------------------------
// THE F5XC HTTP LB ROUTE EXPLAINER - a {manifest, run, vectors} triple. Paste an
// http_loadbalancer spec (or its routes array); get each route's type, match,
// action, mutations, and per-route WAF decoded, plus first-match simulation for
// a test method + path. Defensive decode - renders what it recognizes, flags the
// rest. Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { explainRoutes, simulateRequest, run } from "./compute";
export type {
  RouteType,
  PathKind,
  WafMode,
  HostRewrite,
  HeaderCond,
  HeaderMutation,
  PoolRef,
  RouteView,
  ExplainResult,
  MatchResult,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-http-lb-route-explainer",
  canonicalAliases: ["xc-route-explainer", "f5xc-lb-routes", "xc-http-routes", "f5xc-route-decoder", "distributed-cloud-routes"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse", "json-only"],
  shareSafetyDefault: "manual",

  learnLinks: ["learn/f5xc-http-lb-route-evaluation"],
  sources: [
    {
      id: "xc-create-http-lb",
      label: "F5 Distributed Cloud: Create HTTP Load Balancer (route types, path match, redirect/direct-response, request/response manipulation)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/load-balance/create-http-load-balancer",
      access_date: "2026-07-11",
      scope: "Simple / Redirect / Direct Response / Custom route types; Prefix/Regex path match; redirect parameters; add/remove request & response headers",
      status: "active",
    },
    {
      id: "xc-route-api",
      label: "F5 Distributed Cloud API: ves.io.schema.route (match / action / custom JS)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/api/route",
      access_date: "2026-07-11",
      scope: "a route = match condition + action + custom-JS flag",
      status: "active",
    },
    {
      id: "xc-per-route-waf",
      label: "F5 Distributed Cloud: Per-Route WAF Policy",
      type: "kb",
      url: "https://community.f5.com/kb/technicalarticles/introduction-to-f5-distributed-cloud-platform-per-route-waf-policy/304079",
      access_date: "2026-07-11",
      scope: "a simple route can attach its own App Firewall (Advanced Options > Security > WAF), overriding the LB-level policy",
      status: "active",
    },
    {
      id: "xc-host-rewrite",
      label: "F5 K000146653: Host rewrite behavior in F5 Distributed Cloud HTTP Load Balancers",
      type: "kb",
      url: "https://my.f5.com/manage/s/article/K000146653",
      access_date: "2026-07-11",
      scope: "default host rewrite for DNS-name origins; a route can override host-rewrite behavior",
      status: "active",
    },
    {
      id: "xc-route-order",
      label: "DevCentral: hiding internal URLs / dynamic redirection with the XC HTTP LB (route ordering)",
      type: "article",
      url: "https://community.f5.com/kb/communityarticles/how-to-achieve-hiding-internal-urls-and-http-dynamic-redirection-with-f5-xc-http/342126",
      access_date: "2026-07-11",
      scope: "routes are evaluated in order - drag a route to the top to have it evaluated first (first-match)",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
