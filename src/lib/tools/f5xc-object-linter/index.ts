// ============================================================================
// src/lib/tools/f5xc-object-linter/index.ts
// ----------------------------------------------------------------------------
// THE F5XC OBJECT LINTER - a {manifest, run, vectors} triple. Paste an
// origin_pool, http_loadbalancer, or app_firewall object; get a list of risky
// or surprising settings, each grounded in a verified source. Reuses schema
// knowledge already verified for this family; introduces no new schema. Pure.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { lintObject, run } from "./compute";
export type { LintResult, LintFinding, Severity, ObjectType } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-object-linter",
  canonicalAliases: ["xc-object-linter", "f5xc-config-linter", "xc-config-check", "f5xc-hazard-check", "distributed-cloud-linter"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse", "json-only"],
  shareSafetyDefault: "manual",

  learnLinks: ["learn/f5xc-config-hazards"],
  sources: [
    {
      id: "xc-create-origin-pools",
      label: "F5 Distributed Cloud: Create Origin Pools (TLS-to-origin, Skip Verification, SNI, health checks)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/app-networking/origin-pools",
      access_date: "2026-07-11",
      scope: "grounds the origin-pool rules: skip-verification risk, no_tls cleartext, disabled SNI, absent health checks",
      status: "active",
    },
    {
      id: "xc-create-http-lb",
      label: "F5 Distributed Cloud: Create HTTP Load Balancer (WAF attachment, HTTP->HTTPS redirect, routes)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/load-balance/create-http-load-balancer",
      access_date: "2026-07-11",
      scope: "grounds the LB rules: WAF is opt-in, http_redirect, plain-HTTP listener, and per-route WAF disable",
      status: "active",
    },
    {
      id: "xc-listener-logic",
      label: "DevCentral: F5 Distributed Cloud - Listener Logic + first-match routing (route shadowing, wildcard vs apex)",
      type: "article",
      url: "https://community.f5.com/kb/technicalarticles/f5-distributed-cloud---listener-logic/326096",
      access_date: "2026-07-11",
      scope: "grounds the catch-all route-shadowing rule (first-match) and the wildcard+apex caution",
      status: "active",
    },
    {
      id: "xc-create-waf",
      label: "F5 Distributed Cloud: Create Web Application Firewall (Blocking vs Monitoring enforcement, threat campaigns)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/web-app-and-api-protection/how-to/app-security/application-firewall",
      access_date: "2026-07-11",
      scope: "grounds the WAF rule: monitoring mode detects but does not block; disabled threat campaigns",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
