// ============================================================================
// src/lib/tools/incident-timeline-rca-builder/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the Incident Timeline &
// RCA Builder - Operations & Fieldcraft tool 3 (D-86), built on the shared
// fieldcraft foundation.
// ============================================================================

export {
  run,
  runFromJson,
  validateInput,
  artifactToMarkdown,
  RcaError,
  RULE_COUNT,
  FACTOR_COUNT,
  RULE_REASONS,
} from "./compute";
export type {
  RcaInput,
  RcaResult,
  RcaNotes,
  TimelineEvent,
  FactorObservation,
  OrderedEvent,
  DurationBand,
  FactorCandidate,
  EventKind,
  FactorDomain,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  RCA_SNAPSHOT_VECTORS,
  RCA_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the Incident Timeline & RCA Builder. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Operations & Fieldcraft",
  toolSlug: "incident-timeline-rca-builder",
  canonicalAliases: ["incident timeline", "rca scaffold", "post-incident review", "root cause analysis builder", "postmortem timeline"],

  // OMNIBOX EXEMPTION (D-86 §3.3): structured-form tool, nothing to detect in
  // a paste. Empty by design, cluster-wide.
  inputDetectors: [] as const,

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Verification (D-86 §3.1, the pilot's ruling) --
  // Rule-firing snapshot vectors: per input, assert exactly which rules fire,
  // the ordered timeline ids, the milestone bands, the candidate list with
  // each candidate's user-confirmed flag, the structural-risk ids, and the
  // warning ids. The vector runner additionally asserts a language-discipline
  // invariant: no candidate is ever confirmed unless the input confirmed it.
  verificationModel: "rule-firing-snapshot",
  goldenVectors: "incident-timeline-rca-builder/2026-07-08",

  // -- Safety & sharing --
  // D-86 §3.5 guardrails, PLUS the tool's hardest constraint: it NEVER names a
  // root cause. It structures CANDIDATE contributing factors with the evidence
  // each would need; a factor is echoed as "confirmed" only when the user
  // marked it so, always attributed to the user. No diagnosis, no blame, no
  // network, no credentials; replaces neither a real review nor vendor RCA.
  dangerousInputHandling: ["closed-enum-validation", "no-root-cause-assertion"],
  shareSafetyDefault: "fragment", // incident detail is sensitive; no share params in v1

  learnLinks: ["learn/root-cause-is-a-verb-not-a-noun"],

  sources: [
    {
      id: "original-ruleset-d18",
      label: "Original incident-RCA ruleset (D-18: original by construction)",
      type: "original",
      access_date: "2026-07-08",
      scope:
        "the 7-rule registry, 9 contributing-factor domains with confirm/rule-out evidence, milestone/duration-band derivation, structural-completeness notes, and quality warnings are original editorial work encoding standard post-incident-review practice (timeline ordering, milestone spans, contributing-factor structuring, the no-root-cause-without-evidence discipline); no external framework or specification is claimed or reproduced",
      status: "active",
    },
  ],
  credits: [{ name: "Rodolfo Nützmann", role: "method & review" }],
});
