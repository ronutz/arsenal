// ============================================================================
// src/lib/tools/f5xc-origin-pool-explainer/index.ts
// ----------------------------------------------------------------------------
// THE F5XC ORIGIN POOL EXPLAINER - a {manifest, run, vectors} triple. Paste an
// origin_pool spec; get origin-server types + addresses, the pool port, the LB
// algorithm and endpoint selection, health-check references, and TLS-to-origin
// settings (security level reused from W1-2, SNI, server verification, mTLS).
// Defensive decode. Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { explainOriginPool, run } from "./compute";
export type { PoolView, OriginServerView, TlsView, PortKind, SniMode, ServerVerify } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-origin-pool-explainer",
  canonicalAliases: ["xc-origin-pool", "f5xc-pool-decoder", "xc-origin-servers", "f5xc-origin-tls", "distributed-cloud-origin-pool"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse", "json-only"],
  shareSafetyDefault: "manual",

  learnLinks: ["learn/f5xc-origin-pool-anatomy"],
  sources: [
    {
      id: "xc-create-origin-pools",
      label: "F5 Distributed Cloud: Create Origin Pools (origin-server types, port, TLS, SNI, server verification, mTLS)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/app-networking/origin-pools",
      access_date: "2026-07-11",
      scope: "the origin-server types, Port vs Automatic Port (443 with TLS / 80 without), the TLS block (Enable, SNI Selection, TLS Security Level with High default, Origin Server Verification incl. Skip, mTLS)",
      status: "active",
    },
    {
      id: "xc-endpoint-selection",
      label: "F5 K000161240: control which Regional Edges health-check origins (Endpoint Selection)",
      type: "kb",
      url: "https://my.f5.com/manage/s/article/K000161240",
      access_date: "2026-07-11",
      scope: "Endpoint Selection default Local Preferred; behavior when the local RE origin entry is DOWN; health-check routing",
      status: "active",
    },
    {
      id: "xc-lb-mesh-endpoints",
      label: "F5 Distributed Cloud: Load Balancing and Service Mesh (endpoint discovery: IP/port, DNS, K8s, Consul)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/platform/concepts/load-balancing-and-mesh",
      access_date: "2026-07-11",
      scope: "the where (site/virtual-site/virtual-network) and how (IP+port, DNS, K8s, Consul) of endpoint configuration",
      status: "active",
    },
    {
      id: "xc-waap-cdn-yaml",
      label: "DevCentral: service-chain WAAP and CDN (real origin_pool + LB spec YAML)",
      type: "article",
      url: "https://community.f5.com/kb/technicalarticles/use-f5-distributed-cloud-to-service-chain-waap-and-cdn/303142",
      access_date: "2026-07-11",
      scope: "verified spec shape: origin_servers/public_name, port, no_tls/use_tls, healthcheck, and default_route_pools with pool + weight + priority (where weights actually live)",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
