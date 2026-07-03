// ============================================================================
// src/lib/tools/f5-lb-method-chooser/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING LB-METHOD CHOOSER - a self-contained {manifest, run,
// vectors} triple. Paste an ltm pool (or a method name, or answer two chooser
// questions) and get BIG-IP's load-balancing modes explained in the vendor's
// own terms, with deterministic cross-checks of the mode against the rest of
// the pool configuration.
//
// It reuses the tmsh parser and complements the persistence-method explainer:
// that tool explains how returning clients bypass load balancing, this one
// explains how the load-balancing decision itself is made. Bounded, evaluates
// nothing, contacts nothing.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, LB_VECTORS } from "./golden-vectors";

export { run, recommend, catalogRows, METHODS } from "./compute";
export type {
  LbResult,
  MethodExplain,
  MethodBrief,
  PoolReading,
  MemberReading,
  Recommendation,
  FieldNote,
  CapacityAnswer,
  ReactAnswer,
  ToolRunResult,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, LB_VECTORS, verifyVectors } from "./golden-vectors";
export type { LbVector } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-lb-method-chooser tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-lb-method-chooser",
  canonicalAliases: [
    "lb-method-chooser" /* pre-prefix catalogue slug; never shipped publicly */,
    "ltm-lb-methods",
    "load-balancing-methods",
    "f5-load-balancing",
    "pool-lb-mode",
  ],
  inputDetectors: [
    {
      kind: "regex",
      // A pool stanza is this tool's sharpest home; priority sits above the
      // generic tmsh explainer's 6 so pools route here first.
      pattern: "^\\s*ltm pool\\b",
      priority: 8,
      example: "ltm pool web_pool { load-balancing-mode least-connections-member }",
    },
    {
      kind: "regex",
      pattern: "\\bload-balancing-mode\\b",
      priority: 7,
      example: "load-balancing-mode observed-member",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "irule-not-executed"], // reuses the tmsh parser
  shareSafetyDefault: "fragment", // pool and member names identify infrastructure

  // -- Teaching & provenance --
  learnLinks: ["learn/ltm-load-balancing-methods", "learn/ltm-virtual-server-types"],
  sources: [
    {
      id: "tmsh-ltm-pool",
      label: "F5 TMSH Reference: ltm pool (load-balancing-mode, slow-ramp-time, min-active-members, ignore-persisted-weight)",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/cli/tmsh-reference/v14/modules/ltm/ltm_pool.html",
      access_date: "2026-07-03",
      scope: "the 19 documented mode tokens with per-mode descriptions, and the pool options the observations cross-check",
      status: "active",
    },
    {
      id: "k42275060",
      label: "F5 K42275060: There are several Load Balancing Methods. Which one is best for your environment?",
      type: "vendor-kb",
      url: "https://my.f5.com/manage/s/article/K42275060",
      access_date: "2026-07-03",
      scope: "per-method when-to-use guidance, the least-sessions persistence prerequisite, and the pending-sessions note",
      status: "active",
    },
    {
      id: "k6406",
      label: "F5 K6406: Overview of Least Connections, Fastest, Observed, and Predictive pool member load balancing",
      type: "vendor-kb",
      url: "https://my.f5.com/manage/s/article/K6406",
      access_date: "2026-07-03",
      scope: "dynamic-mode mechanics: at-the-moment counting, per-second L4 ratios, trend ranking, outstanding-L7 requests, the OneConnect exclusion, and the ratios-need-a-ratio-method rule",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = LB_VECTORS;
