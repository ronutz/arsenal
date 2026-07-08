// ============================================================================
// src/lib/tools/fault-hypothesis-builder/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the Fault Hypothesis
// Builder - the Operations & Fieldcraft pilot (D-86).
// ============================================================================

export {
  run,
  runFromJson,
  validateInput,
  artifactToMarkdown,
  FhbError,
  RULE_COUNT,
  HYPOTHESIS_COUNT,
} from "./compute";
export type {
  FhbInput,
  FhbResult,
  FhbNotes,
  Symptom,
  Scope,
  Change,
  Timing,
  Clue,
  PresetId,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  FHB_SNAPSHOT_VECTORS,
  FHB_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the Fault Hypothesis Builder. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Operations & Fieldcraft",
  toolSlug: "fault-hypothesis-builder",
  canonicalAliases: ["fault hypotheses", "troubleshooting worksheet", "fault isolation", "incident hypotheses"],

  // OMNIBOX EXEMPTION (D-86 §3.3, deliberate): this is a structured-form
  // tool, not a pasteable-artifact tool. There is nothing to detect in a
  // paste, so the detector list is empty BY DESIGN - recorded as a conscious
  // choice for the whole fieldcraft cluster, not an inconsistency.
  inputDetectors: [] as const,

  capabilityBadge: "browser", // runs entirely client-side
  executionClass: ["localOnly"], // fixed rule registry; no network, no clock in the engine
  apiCapabilityClass: "local-equivalent",

  // -- Verification (D-86 §3.1 - THE PILOT'S RULING, cluster-wide) --
  // Classic golden vectors assert known-correct outputs; advisory output has
  // no "correct" hypothesis set. The engine is fully deterministic, so the
  // verification model is RULE-FIRING SNAPSHOT VECTORS: per structured input,
  // assert exactly which rules fire (registry order), the exact ranked
  // hypothesis list (score + signal band), and the exact warning set.
  // Tools WITHOUT this field keep classic golden-vector semantics.
  verificationModel: "rule-firing-snapshot",
  goldenVectors: "fault-hypothesis-builder/2026-07-08",

  // -- Safety & sharing --
  // D-86 §3.5 guardrails (SCOUT §11.4, adopted as-is): no automatic
  // remediation, no live network calls, no credential prompts, no secret
  // upload, no root-cause claim unless the user marks it confirmed, and no
  // replacement for vendor TAC / change approval / production review.
  dangerousInputHandling: ["closed-enum-validation"], // free text never enters rule matching
  shareSafetyDefault: "fragment", // incident context is sensitive; no share params in v1

  learnLinks: ["learn/fault-isolation-first-hour"],

  sources: [
    {
      id: "original-ruleset-d18",
      label: "Original fault-isolation ruleset (D-18: original by construction)",
      type: "original",
      access_date: "2026-07-08",
      scope:
        "the 25-rule registry, 13 hypothesis domains, scoring weights, signal bands, and quality warnings are original editorial work encoding standard operational practice (change alignment, scope-driven isolation, layer signatures); no external specification is claimed or reproduced",
      status: "active",
    },
  ],
  credits: [{ name: "Rodolfo Nützmann", role: "method & review" }],
});
