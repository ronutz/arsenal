// ============================================================================
// src/lib/tools/flow-path-reasoner/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the Flow Path Reasoner -
// Operations & Fieldcraft tool 11 (D-86 wave A-2).
// ============================================================================

export {
  run,
  runFromJson,
  validateInput,
  artifactToMarkdown,
  FprError,
  RULE_COUNT,
  DOMAIN_COUNT,
} from "./compute";
export type {
  FprInput,
  FprResult,
  FprNotes,
  FprArchetype,
  NameResolution,
  IntermediarySet,
  AddressTransformation,
  TlsBehavior,
  AuthFlow,
  ReturnPath,
  PresetId,
  RankedDomain,
  TlsSegment,
  FiredRule,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  FPR_SNAPSHOT_VECTORS,
  FPR_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the Flow Path Reasoner. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Operations & Fieldcraft",
  toolSlug: "flow-path-reasoner",
  canonicalAliases: ["request path map", "flow map", "path model", "hop map", "traffic path"],

  // OMNIBOX EXEMPTION (D-86 §3.3, deliberate): a structured-form tool, not a
  // pasteable-artifact tool - the detector list is empty BY DESIGN, the
  // conscious cluster-wide choice recorded at the pilot.
  inputDetectors: [] as const,

  capabilityBadge: "browser", // runs entirely client-side
  executionClass: ["localOnly"], // fixed rule registry; no network, no clock in the engine
  apiCapabilityClass: "local-equivalent",

  // -- Verification (D-86 §3.1 cluster ruling) --
  // Rule-firing snapshot vectors, plus the FPR-specific pin: the exact
  // forward hop sequence (the canonical chain is itself an output surface).
  // Expectations pinned from engine execution (tsx harness) at authoring
  // time, per the cluster's honest convention.
  verificationModel: "rule-firing-snapshot",
  goldenVectors: "flow-path-reasoner/2026-07-16",

  // -- Safety & sharing --
  // Cluster guardrails, plus FPR's own: the map is a PROPOSED MODEL from the
  // user's selections, never discovered topology (R-BASE-MODEL fires
  // unconditionally and says so); no control-bypass paths, no vendor
  // packet-processing-order claims; exports reveal topology, so the
  // topology-sensitivity warning also fires on every run and share defaults
  // stay conservative.
  dangerousInputHandling: ["closed-enum-validation"], // free text never enters rule matching
  shareSafetyDefault: "fragment", // topology context is sensitive; no share params in v1

  learnLinks: ["learn/map-the-path-before-you-troubleshoot"],

  sources: [
    {
      id: "original-ruleset-d18",
      label: "Original path-reasoning ruleset (D-18: original by construction)",
      type: "original",
      access_date: "2026-07-16",
      scope:
        "the 27-rule registry, 13 failure-domain candidates, canonical chain construction, TLS segmentation, side-flow modeling, scoring weights, signal bands, and quality warnings are original editorial work encoding standard path-reasoning practice (resolution as part of the path, separate return-path reasoning, identity side-flows, transformation boundaries); no external specification is claimed or reproduced",
      status: "active",
    },
  ],
  credits: [{ name: "Rodolfo Nützmann", role: "method & review" }],
});
