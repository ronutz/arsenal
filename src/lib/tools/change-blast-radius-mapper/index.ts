// ============================================================================
// src/lib/tools/change-blast-radius-mapper/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the Change Blast-Radius
// Mapper - Operations & Fieldcraft tool 4 (D-86), built on the shared
// fieldcraft foundation. The schema's named main consumer of RiskFactor.
// ============================================================================

export {
  run,
  runFromJson,
  validateInput,
  artifactToMarkdown,
  BlastError,
  TIER_ORDER,
  RULE_COUNT,
  ITEM_COUNT,
  RISK_COUNT,
  CONTAINMENT_COUNT,
  RULE_REASONS,
} from "./compute";
export type {
  BlastInput,
  BlastResult,
  BlastNotes,
  BlastTier,
  AffectedItem,
  ContainmentMeasure,
  TierId,
  TargetType,
  Colocation,
  TrafficPath,
  Dependents,
  Redundancy,
  UserReach,
  PresetId,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  BLAST_SNAPSHOT_VECTORS,
  BLAST_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the Change Blast-Radius Mapper. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Operations & Fieldcraft",
  toolSlug: "change-blast-radius-mapper",
  canonicalAliases: ["blast radius", "impact analysis", "change impact map", "what could break", "blast radius assessment"],

  inputDetectors: [] as const, // OMNIBOX EXEMPTION (D-86 §3.3): structured-form tool

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Verification (D-86 §3.1, the pilot's ruling) --
  // Rule-firing snapshot vectors: per input, assert exactly which rules fire,
  // the populated tiers with ordered item ids, the risk ids, the containment
  // ids, the warning ids, and the coarse radius band.
  verificationModel: "rule-firing-snapshot",
  goldenVectors: "change-blast-radius-mapper/2026-07-08",

  // -- Safety & sharing --
  // D-86 §3.5 guardrails: it maps CATEGORIES of affected things from what you
  // describe (it has no topology of its own), it does not approve a change,
  // makes no network calls, asks for no credentials, and replaces neither a
  // real impact analysis nor change review. It maps what could be affected; it
  // never asserts what will break.
  dangerousInputHandling: ["closed-enum-validation"],
  shareSafetyDefault: "fragment",

  learnLinks: ["learn/blast-radius-thinking-before-you-change-anything"],

  sources: [
    {
      id: "original-ruleset-d18",
      label: "Original blast-radius ruleset (D-18: original by construction)",
      type: "original",
      access_date: "2026-07-08",
      scope:
        "the 17-rule registry, 16 affected-category items across four concentric tiers, 11 severity-tagged risk factors, 9 containment measures, and the coarse radius-band derivation are original editorial work encoding standard impact-analysis practice (target/co-located/downstream/human tiering, dependency and traffic-path reasoning, redundancy and containment); no external framework or specification is claimed or reproduced",
      status: "active",
    },
  ],
  credits: [{ name: "Rodolfo Nützmann", role: "method & review" }],
});
