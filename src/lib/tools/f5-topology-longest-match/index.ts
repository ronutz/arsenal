// ============================================================================
// src/lib/tools/f5-topology-longest-match/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING TOPOLOGY LONGEST-MATCH SCORER - a self-contained
// {manifest, run, vectors} triple. Paste gtm topology records (and optional
// gtm region stanzas), declare a source, and get the decision computed the
// way BIG-IP DNS computes it: the Longest Match SORT, then the first-match-
// per-candidate scoring walk, then highest score wins with ties round-
// robining. Every rank in the sort cites its source; anything the sources
// do not rank is flagged, not guessed. Bounded, resolves nothing.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, TOPO_VECTORS } from "./golden-vectors";

export { run, sortRecords } from "./compute";
export type {
  TopoResult,
  TopoRecord,
  TopoOperand,
  CandidateScore,
  ToolRunResult,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, TOPO_VECTORS, verifyVectors } from "./golden-vectors";
export type { TopoVector } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-topology-longest-match tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 GTM, AFM & APM",
  toolSlug: "f5-topology-longest-match",
  canonicalAliases: [
    "topology-longest-match" /* pre-prefix catalogue slug; never shipped publicly */,
    "gtm-topology-scorer",
    "gtm-topology-records",
    "topology-load-balancing",
  ],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*gtm topology\\b",
      priority: 8,
      example: "gtm topology ldns: subnet 10.0.0.0/8 server: pool /Common/POOL_A { score 100 }",
    },
    {
      kind: "regex",
      pattern: "\\bldns:.*\\bserver:",
      priority: 7,
      example: "ldns: not country US server: datacenter /Common/DC1",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "irule-not-executed"], // reuses the tmsh parser
  shareSafetyDefault: "fragment", // record sets and region names identify infrastructure

  // -- Teaching & provenance --
  learnLinks: ["learn/gtm-topology-records-and-longest-match", "learn/gtm-load-balancing-methods"],
  relatedTools: ["f5-gslb-decision-flow", "f5-tmsh-config-explainer", "cidr-calculator"],
  sources: [
    {
      id: "dns-lb-manual-topology",
      label: "BIG-IP GTM: Load Balancing - Using Topology Load Balancing (record anatomy, the sort keys, scoring the candidates, the both-tiers fallback rule)",
      type: "vendor-docs",
      url: "https://techdocs.f5.com/kb/en-us/products/big-ip_gtm/manuals/product/gtm-lb-configuring-11-5-0/1.html",
      access_date: "2026-07-03",
      scope: "Longest Match as a sort by source statement, destination statement and weight; subnets ranked by mask specificity; weight is called score in tmsh; scores assigned to pools or pool members from the ordered list",
      status: "active",
    },
    {
      id: "k10721",
      label: "F5 K10721: Overview of the Longest Match algorithm",
      type: "vendor-kb",
      url: "https://my.f5.com/manage/s/article/K10721",
      access_date: "2026-07-03",
      scope: "the sorting rules this engine implements: longest netmask first, the type ladder demonstrated in the worked examples, negation buckets (server-side above LDNS-side above wildcards), wildcards last, and weights governing when Longest Match is disabled",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = TOPO_VECTORS;
