// ============================================================================
// src/lib/tools/f5-gslb-decision-flow/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING GSLB DECISION-FLOW EXPLAINER - a self-contained
// {manifest, run, vectors} triple. Paste gtm wideip and gtm pool stanzas
// (or a method name, or "methods") and get the two-tier BIG-IP DNS decision
// flow explained in the vendor's terms: pool selection at the wide IP, then
// the preferred/alternate/fallback chain inside the pool, with deterministic
// cross-checks of the configuration against the documented grammar and the
// Load Balancing manual's rules. Bounded, resolves nothing, contacts nothing.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, GSLB_VECTORS } from "./golden-vectors";

export { run, GTM_METHODS, WIDEIP_METHODS } from "./compute";
export type {
  GslbResult,
  GtmMethodExplain,
  GtmPoolReading,
  WideipReading,
  ChainStep,
  FieldNote,
  MetricSource,
  ToolRunResult,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, GSLB_VECTORS, verifyVectors } from "./golden-vectors";
export type { GslbVector } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-gslb-decision-flow tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 GTM, AFM & APM",
  toolSlug: "f5-gslb-decision-flow",
  canonicalAliases: [
    "gslb-decision-flow" /* pre-prefix catalogue slug; never shipped publicly */,
    "gtm-decision-flow",
    "gtm-load-balancing",
    "bigip-dns-load-balancing",
    "preferred-alternate-fallback",
  ],
  inputDetectors: [
    {
      kind: "regex",
      // A gtm wideip or gtm pool stanza is this tool's sharpest home;
      // priority sits above the generic tmsh explainer's 6.
      pattern: "^\\s*gtm (wideip|pool)\\b",
      priority: 8,
      example: "gtm pool a pool_dc1 { load-balancing-mode topology }",
    },
    {
      kind: "regex",
      pattern: "\\b(alternate-mode|fallback-mode|pool-lb-mode)\\b",
      priority: 7,
      example: "fallback-mode return-to-dns",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "irule-not-executed"], // reuses the tmsh parser
  shareSafetyDefault: "fragment", // wide IP names and pool names identify infrastructure

  // -- Teaching & provenance --
  learnLinks: ["learn/gtm-load-balancing-methods", "learn/gtm-topology-records-and-longest-match"],
  relatedTools: ["f5-topology-longest-match", "f5-lb-method-chooser", "f5-tmsh-config-explainer"],
  sources: [
    {
      id: "tmsh-gtm-pool-a",
      label: "F5 TMSH Reference: gtm pool a (load-balancing-mode, alternate-mode, fallback-mode, dynamic-ratio, qos-* coefficients)",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/cli/tmsh-reference/v15/modules/gtm/gtm_pool_a.html",
      access_date: "2026-07-03",
      scope: "the three-tier mode grammars with per-token descriptions, the chain defaults, the dynamic-ratio applicability set, and the pool options the observations cross-check",
      status: "active",
    },
    {
      id: "tmsh-gtm-wideip-a",
      label: "F5 TMSH Reference: gtm wideip a (pool-lb-mode, persistence, last-resort-pool, decision-log verbosity)",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/gtm/gtm_wideip_a.html",
      access_date: "2026-07-03",
      scope: "the wide-IP pool-selection grammar and semantics, including the v13 reference's version-dependent random token",
      status: "active",
    },
    {
      id: "dns-lb-manual",
      label: "BIG-IP DNS: Load Balancing - About load balancing and resource availability (and the Topology chapter's both-tiers warning)",
      type: "vendor-docs",
      url: "https://techdocs.f5.com/en-us/bigip-15-0-0/big-ip-dns-load-balancing/about-load-balancing-and-resource-availability.html",
      access_date: "2026-07-03",
      scope: "the chain semantics: alternate is static-only, fallback ignores availability, the None cascade and the BIND aggregate, the dynamic-ratio proportional example, and the topology-at-both-tiers fallback rule",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = GSLB_VECTORS;
