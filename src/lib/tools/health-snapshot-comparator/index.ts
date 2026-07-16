// ============================================================================
// src/lib/tools/health-snapshot-comparator/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the Before/After Health
// Snapshot Comparator - Operations & Fieldcraft tool 7 (D-86 wave A-3, the
// last of wave A).
// ============================================================================

export {
  run,
  runFromJson,
  validateInput,
  artifactToMarkdown,
  HscError,
  RULE_COUNT,
  DIMENSION_COUNT,
} from "./compute";
export type {
  HscInput,
  HscResult,
  HscNotes,
  ComparisonContext,
  TargetClass,
  SnapshotScope,
  BeforeConfidence,
  AfterState,
  ObservationWindow,
  ExpectedChurn,
  PresetId,
  FiredRule,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  HSC_SNAPSHOT_VECTORS,
  HSC_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the Snapshot Comparator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Operations & Fieldcraft",
  toolSlug: "health-snapshot-comparator",
  canonicalAliases: ["before after comparison", "snapshot compare", "change validation", "health comparison", "baseline check"],

  // OMNIBOX EXEMPTION (D-86 §3.3, deliberate): a structured-form tool, not a
  // pasteable-artifact tool - the detector list is empty BY DESIGN, the
  // conscious cluster-wide choice recorded at the pilot.
  inputDetectors: [] as const,

  capabilityBadge: "browser", // runs entirely client-side
  executionClass: ["localOnly"], // fixed rule registry; no network, no clock in the engine
  apiCapabilityClass: "local-equivalent",

  // -- Verification (D-86 §3.1 cluster ruling) --
  // Rule-firing snapshot vectors, plus the tool-specific pins: the exact
  // GATE VERDICT (the severity ladder and the rollback-decision conversion
  // are frozen) and the exact selected DIMENSION SET. Expectations pinned
  // from engine execution (tsx harness) at authoring time, per the
  // cluster's honest convention.
  verificationModel: "rule-firing-snapshot",
  goldenVectors: "health-snapshot-comparator/2026-07-16",

  // -- Safety & sharing --
  // Cluster guardrails, plus the tool's own naming-honesty contract: it
  // never ingests state data and never diffs anything - YOU DECLARE THE
  // STATES, THE TOOL GATES THE CONCLUSION (R-BASE-DECLARED fires
  // unconditionally and says so), and the canon risk rule is structural:
  // never label a change successful on green components alone
  // (R-SVC-VS-STATE also fires unconditionally). No diagnosis, no
  // success/failure verdicts about systems the tool has not seen.
  dangerousInputHandling: ["closed-enum-validation"], // free text never enters rule matching
  shareSafetyDefault: "fragment", // change context is sensitive; no share params in v1

  learnLinks: ["learn/baselines-before-you-need-them"],

  sources: [
    {
      id: "original-ruleset-d18",
      label: "Original comparison-gating ruleset (D-18: original by construction)",
      type: "original",
      access_date: "2026-07-16",
      scope:
        "the 27-rule registry, 14-dimension snapshot catalog with churn classes, delta-expectation matrix, severity ladder, rollback-decision conversion, and quality warnings are original editorial work encoding standard change-validation practice (baseline discipline, observation windows, churn literacy, state-versus-service pairing); no external specification is claimed or reproduced",
      status: "active",
    },
  ],
  credits: [{ name: "Rodolfo Nützmann", role: "method & review" }],
});
