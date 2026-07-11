// ============================================================================
// src/lib/tools/f5xc-domain-sni-match-resolver/index.ts
// ----------------------------------------------------------------------------
// THE F5XC DOMAIN / SNI MATCH RESOLVER - a {manifest, run, vectors} triple.
// Given the domain lists of one or more HTTP LBs and a test hostname, resolve
// which LB and domain entry wins (exact > wildcard > default), with wildcard vs
// apex semantics and the auto-cert conflict warning. Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { resolve, run } from "./compute";
export type { LB, MatchType, MatchCandidate, ResolveResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-domain-sni-match-resolver",
  canonicalAliases: ["xc-domain-match", "f5xc-sni-resolver", "xc-which-lb-wins", "f5xc-wildcard-apex", "distributed-cloud-domain-precedence"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param",

  learnLinks: ["learn/f5xc-domain-matching-and-listener-logic"],
  sources: [
    {
      id: "xc-listener-logic",
      label: "DevCentral: F5 Distributed Cloud - Listener Logic (most-specific domain match, Default LB per advertise policy)",
      type: "article",
      url: "https://community.f5.com/kb/technicalarticles/f5-distributed-cloud---listener-logic/326096",
      access_date: "2026-07-11",
      scope: "the most-specific match wins (exact over wildcard); SNI (HTTPS) or Host header (HTTP); one Default LB per advertise policy (IP+port) catches unmatched",
      status: "active",
    },
    {
      id: "xc-lb-mesh-domains",
      label: "F5 Distributed Cloud: Load Balancing and Service Mesh (domains as partial match, port in domain)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/platform/concepts/load-balancing-and-mesh",
      access_date: "2026-07-11",
      scope: "domains are DNS names, wildcard *.foo.com partial match, must match certs and host headers, includes port for non-standard ports (*.foo.com:8080)",
      status: "active",
    },
    {
      id: "xc-tcp-lb-conflict",
      label: "F5 Distributed Cloud: Create TCP Load Balancer (wildcard + apex auto-cert warning)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/load-balance/create-tcp-load-balancer",
      access_date: "2026-07-11",
      scope: "do not add both a wildcard and the top-level (apex) domain if using an automatic certificate for different load balancers",
      status: "active",
    },
    {
      id: "xc-multi-cert",
      label: "F5 K000161238: multiple custom TLS certificates on a single HTTP or TCP Load Balancer",
      type: "kb",
      url: "https://my.f5.com/s/article/K000161238",
      access_date: "2026-07-11",
      scope: "several domains/certs on one LB, host-header routing per domain - context for multi-domain LBs",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
