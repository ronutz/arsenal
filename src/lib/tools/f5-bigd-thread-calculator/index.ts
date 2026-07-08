// ============================================================================
// src/lib/tools/f5-bigd-thread-calculator/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the BigD thread
// calculator (BIG-IP 21.1 multi-threaded bigd sizing).
// ============================================================================

import { run, type BigdCalcResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  BIGD_CALC_GOLDEN_VECTORS,
  BIGD_CALC_REJECT_VECTORS,
} from "./golden-vectors";

export { run, parseInput, htThreads, normalThreads, BigdCalcError } from "./compute";
export type {
  BigdCalcResult,
  ThreadFormulaResult,
  SystemMode,
  BigdCalcErrorCode,
  PlatformId,
  PlatformInfo,
  ParsedInput,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  BIGD_CALC_GOLDEN_VECTORS,
  BIGD_CALC_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the BigD thread calculator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-bigd-thread-calculator",
  canonicalAliases: ["bigd threads", "bigd numprocs", "monitor threads", "bigd hyperthreading"],
  inputDetectors: [
    // Deliberately narrow: a bare small integer is far too ambiguous for the
    // OMNIBOX, so only an explicit vCPU-count phrase routes here. Anchored,
    // single quantifier per field -> linear, ReDoS-safe.
    {
      kind: "regex",
      pattern: "^\\s*\\d{1,4}\\s*v?[Cc][Pp][Uu]s?\\s*(ht|hyper-?threaded|normal)?\\s*$",
      priority: 6,
      example: "8 vCPUs ht",
    },
    {
      // A vCPU count followed by an F5 platform token (rSeries model, VELOS,
      // iSeries model, VIPRION, VE). Anchored, one alternation - linear.
      kind: "regex",
      pattern:
        "^\\s*\\d{1,4}\\s+(r\\d{4,5}(-[dD][sSfF])?|velos|bx110|bx520|iseries|i\\d{4,5}|viprion|b\\d{4}|ve|rseries)\\s*$",
      priority: 7,
      example: "8 r10900",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // two documented formulas; no network, no clock
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // anchored linear parser
  shareSafetyDefault: "param", // a vCPU count is non-sensitive

  // -- Teaching & provenance --
  learnLinks: ["learn/bigip-inplace-upgrade-and-64bit", "learn/bigip-21x-whats-new"],
  sources: [
    {
      id: "f5-techdocs-21-1-new-features-bigd",
      label:
        "F5 techdocs - New Features in BIG-IP Version 21.1.0: BigD enhancements for large-scale configurations",
      type: "vendor-doc",
      url: "https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-release-notes/big-ip-new-features.html",
      access_date: "2026-07-08",
      scope:
        "the multi-threaded single-instance bigd, the 15,000 control-plane monitor ceiling, the two verbatim thread-count formulas (HT: (vCPUs × 6) ÷ 10; normal: (vCPUs ÷ 2) − 1), and the bigd.numprocs manual override capped at the vCPU count with 0 meaning automatic",
      status: "active",
    },
    {
      id: "f5-clouddocs-rseries-multitenancy",
      label: "F5 clouddocs - rSeries Training: Multitenancy (CPU allocation per model)",
      type: "vendor-doc",
      url: "https://clouddocs.f5.com/training/community/rseries-training/html/rseries_multitenancy.html",
      access_date: "2026-07-08",
      scope:
        "the platform hyperthreading split: r5000/r10000 (and the r12000 family in the sizing tables) count each Intel core as two vCPUs via hyperthreading, while r2000/r4000 use a CPU class without hyperthreading and count physical cores only",
      status: "active",
    },
    {
      id: "f5-clouddocs-velos-points-of-management",
      label: "F5 clouddocs - VELOS Training: Points of Management (tenant vCPUs and HT-Split)",
      type: "vendor-doc",
      url: "https://clouddocs.f5.com/training/community/velos-training/html/velos_points_of_management.html",
      access_date: "2026-07-08",
      scope:
        "VELOS tenant vCPUs are hyperthreads (two per physical core; 22 vCPUs = 11 physical CPUs), with BIG-IP tenants using HT-Split per K15003; also the iSeries/VIPRION sizing language counting vCPUs as hyperthreads",
      status: "active",
    },
    {
      id: "f5-k15003",
      label: "F5 K15003 - Data and control plane tasks use separate logical cores under Intel Hyper-Threading",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K15003",
      access_date: "2026-07-08",
      scope:
        "the HT-Split model: on hyperthreaded BIG-IP hardware, TMM runs on one hyperthread of each core while control-plane daemons share the sibling, the architecture behind F5's hyperthreaded-formula rationale",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * runTool - the registry-facing entry point.
 * @param input a vCPU count with optional system type, e.g. "8 ht", "16 normal", or "6"
 * @returns both formula results, the requested mode, the numprocs cap, and the monitor ceiling
 */
export function runTool(input: string): BigdCalcResult {
  return run(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = BIGD_CALC_GOLDEN_VECTORS;
export const rejectVectors = BIGD_CALC_REJECT_VECTORS;
