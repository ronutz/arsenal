// ============================================================================
// src/lib/tools/bigip-ltm-lb-simulator/index.ts
// ----------------------------------------------------------------------------
// THE BIG-IP LTM LOAD BALANCING SIMULATOR - a {manifest, run, vectors} triple.
// Configure pool members (ratio, node + node ratio, priority group, persistence
// records), pick a method and a request count, and see where the next N
// connections land. Static and connection/session methods are simulated
// deterministically; dynamic (metric-driven) methods are explained, not faked.
// The BIG-IP counterpart to the F5XC LB algorithm chooser. Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { simulate, run, SIMULABLE_METHODS, DYNAMIC_METHODS } from "./compute";
export type { SimInput, SimResult, Member, MemberResult, Method } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 BIG-IP LTM",
  toolSlug: "bigip-ltm-lb-simulator",
  canonicalAliases: ["ltm-lb-simulator", "bigip-pool-simulator", "f5-load-balancing-simulator", "where-do-requests-go", "ltm-distribution"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-compute"],
  shareSafetyDefault: "param",

  learnLinks: ["learn/bigip-ltm-request-distribution"],
  sources: [
    {
      id: "f5-pools-priority-activation",
      label: "F5 BIG-IP LTM: Pools (priority group activation - minimum available members per group; ratio methods)",
      type: "docs",
      url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/ltm-concepts-11-5-1/6.html",
      access_date: "2026-07-11",
      scope: "priority group activation semantics (minimum members that must remain available for traffic to stay confined; 0 = disabled); the ratio-based methods (Ratio node/member/sessions, Dynamic Ratio, Ratio Least Connections)",
      status: "active",
    },
    {
      id: "f5-lb-methods",
      label: "F5 BIG-IP LTM load balancing methods (static vs dynamic; Round Robin, Ratio, Least Connections, Least Sessions, Observed, Predictive)",
      type: "reference",
      url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/ltm-concepts-11-5-1/5.html",
      access_date: "2026-07-11",
      scope: "the definition of each method: Round Robin (sequential), Ratio (by weight), Least Connections (fewest active connections; ties round-robin), Least Sessions (fewest persistence records), and the dynamic methods that require performance metrics",
      status: "active",
    },
    {
      id: "owasp-na",
      label: "F5 DevCentral / community references on Least Sessions and persistence (fewest persistence-table records; cookie persistence falls back to round-robin)",
      type: "article",
      url: "https://my.f5.com/manage/s/article/K000160443",
      access_date: "2026-07-11",
      scope: "Least Sessions distributes to the member with the fewest persistence records; cookie-based persistence falls back to round-robin",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 BIG-IP documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
