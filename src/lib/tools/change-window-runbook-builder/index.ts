// ============================================================================
// src/lib/tools/change-window-runbook-builder/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the Change Window Runbook
// Builder - Operations & Fieldcraft tool 2 (D-86), built on the shared
// fieldcraft foundation the FHB pilot established.
// ============================================================================

export {
  run,
  runFromJson,
  validateInput,
  artifactToMarkdown,
  RunbookError,
  PHASE_ORDER,
  RULE_COUNT,
  STEP_COUNT,
  RISK_COUNT,
  PHASE_COUNT,
  RULE_REASONS,
} from "./compute";
export type {
  RunbookInput,
  RunbookResult,
  RunbookStep,
  RunbookNotes,
  PhaseId,
  ChangeType,
  Environment,
  BlastRadius,
  Reversibility,
  Window,
  Safeguard,
  PresetId,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  RUNBOOK_SNAPSHOT_VECTORS,
  RUNBOOK_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the Change Window Runbook Builder. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Operations & Fieldcraft",
  toolSlug: "change-window-runbook-builder",
  canonicalAliases: ["change runbook", "maintenance runbook", "change window plan", "cutover runbook", "change checklist"],

  // OMNIBOX EXEMPTION (D-86 §3.3, deliberate): this is a structured-form
  // tool, not a pasteable-artifact tool. There is nothing to detect in a
  // paste, so the detector list is empty BY DESIGN - the cluster-wide choice
  // the FHB pilot recorded, not an inconsistency.
  inputDetectors: [] as const,

  capabilityBadge: "browser", // runs entirely client-side
  executionClass: ["localOnly"], // fixed rule registry; no network, no clock in the engine
  apiCapabilityClass: "local-equivalent",

  // -- Verification (D-86 §3.1 - the pilot's ruling, cluster-wide) --
  // Advisory output has no single "correct" runbook, but the engine is fully
  // deterministic. The verification model is RULE-FIRING SNAPSHOT VECTORS:
  // per structured input, assert exactly which rules fire (registry order),
  // the exact ordered step ids per phase (phases in PHASE_ORDER), the exact
  // risk-factor ids, and the exact readiness-warning ids.
  verificationModel: "rule-firing-snapshot",
  goldenVectors: "change-window-runbook-builder/2026-07-08",

  // -- Safety & sharing --
  // D-86 §3.5 guardrails: no approval of a change, no execution, no live
  // network calls, no credential prompts, no secret upload, and no
  // replacement for the change-approval process or production review. The
  // engine assembles a runbook to review and adapt; a human runs it.
  dangerousInputHandling: ["closed-enum-validation"], // free text never enters rule matching
  shareSafetyDefault: "fragment", // change context is sensitive; no share params in v1

  learnLinks: ["learn/change-windows-that-do-not-become-incidents"],

  sources: [
    {
      id: "original-ruleset-d18",
      label: "Original change-runbook ruleset (D-18: original by construction)",
      type: "original",
      access_date: "2026-07-08",
      scope:
        "the 22-rule registry, 30 runbook steps across six fixed phases, 11 risk factors, and six readiness warnings are original editorial work encoding standard change-management practice (pre-flight, approvals and comms, phased execution, verification, back-out triggers, close-out); no external specification is claimed or reproduced",
      status: "active",
    },
  ],
  credits: [{ name: "Rodolfo Nützmann", role: "method & review" }],
});
