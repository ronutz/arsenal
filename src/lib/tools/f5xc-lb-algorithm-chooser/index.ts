// ============================================================================
// src/lib/tools/f5xc-lb-algorithm-chooser/index.ts
// ----------------------------------------------------------------------------
// THE F5XC LOAD-BALANCING ALGORITHM CHOOSER - a {manifest, run, vectors} triple.
// A short questionnaire (persistence? by what key? dynamic pool?) recommends an
// XC origin-pool algorithm and explains the XC persistence model for BIG-IP
// people. Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { recommend, run, ALGO_META } from "./compute";
export type { Algo, Distribution, SessionKey, AnswerState, AlgoMeta, RecommendResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-lb-algorithm-chooser",
  canonicalAliases: ["xc-lb-algorithm", "f5xc-load-balancing-method", "xc-persistence-chooser", "f5xc-ring-hash-chooser", "distributed-cloud-lb-algorithm"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param",

  learnLinks: ["learn/f5xc-lb-algorithms-and-persistence"],
  sources: [
    {
      id: "xc-create-http-lb-algos",
      label: "F5 Distributed Cloud: Create HTTP Load Balancer (origin-pool load-balancing algorithm options)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/load-balance/create-http-load-balancer",
      access_date: "2026-07-11",
      scope: "Round Robin, Least Active Request, Random, Source IP Stickiness (hash of source IP), Cookie Based Stickiness (hash of cookie), Ring Hash, Load Balancer Override",
      status: "active",
    },
    {
      id: "xc-ring-hash",
      label: "DevCentral: What is the Ring Hash load-balancing algorithm?",
      type: "article",
      url: "https://community.f5.com/kb/technicalarticles/what-is-the-ring-hash-load-balancing-algorithm/329600",
      access_date: "2026-07-11",
      scope: "consistent hashing IS the persistence method; hashes source IP, cookie, or a custom header; tolerates pool churn with minimal remapping; low client diversity on source IP causes uneven load",
      status: "active",
    },
    {
      id: "xc-persistence",
      label: "DevCentral: Setting up persistence in F5 XC (Load Balancer Override, per-route Load Balancing Control)",
      type: "article",
      url: "https://community.f5.com/kb/communityarticles/setting-up-persistence-in-f5-xc/306913",
      access_date: "2026-07-11",
      scope: "set algorithm to Load Balancer Override, then choose Cookie (name/TTL/path) or Source IP stickiness per route under Advanced Options > Load Balancing Control",
      status: "active",
    },
    {
      id: "xc-mesh-lb",
      label: "F5 Distributed Cloud: Load Balancing and Service Mesh (scheduling algorithms)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/platform/concepts/load-balancing-and-mesh",
      access_date: "2026-07-11",
      scope: "round robin, weighted least request, random, ring-hash as the scheduling algorithms",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
