// ============================================================================
// src/lib/tools/packet-capture-plan-builder/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the Packet Capture Plan
// Builder - Operations & Fieldcraft tool 6 (D-86 wave A).
// ============================================================================

export {
  run,
  runFromJson,
  validateInput,
  artifactToMarkdown,
  PcpbError,
  RULE_COUNT,
  POINT_CATALOG_COUNT,
} from "./compute";
export type {
  PcpbInput,
  PcpbResult,
  PcpbNotes,
  PathArchetype,
  CaptureSymptom,
  TrafficClass,
  Intermediaries,
  Transformation,
  CaptureAccess,
  TimeBehavior,
  PresetId,
  MatrixCandidate,
  FiredRule,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  PCPB_SNAPSHOT_VECTORS,
  PCPB_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the Packet Capture Plan Builder. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Operations & Fieldcraft",
  toolSlug: "packet-capture-plan-builder",
  canonicalAliases: ["capture plan", "where to capture", "pcap plan", "packet evidence plan", "tcpdump plan"],

  // OMNIBOX EXEMPTION (D-86 §3.3, deliberate): a structured-form tool, not a
  // pasteable-artifact tool - the detector list is empty BY DESIGN, the
  // conscious cluster-wide choice recorded at the pilot.
  inputDetectors: [] as const,

  capabilityBadge: "browser", // runs entirely client-side
  executionClass: ["localOnly"], // fixed rule registry; no network, no clock in the engine
  apiCapabilityClass: "local-equivalent",

  // -- Verification (D-86 §3.1 cluster ruling) --
  // Rule-firing snapshot vectors: per structured input, assert exactly which
  // rules fire (registry order), the exact ranked capture-point list (score +
  // signal band), the exact warning set, and - PCPB-specific - the exact
  // phase-1 point set. Expectations pinned from engine execution (tsx
  // harness) at authoring time, per the pilot's honest convention.
  verificationModel: "rule-firing-snapshot",
  goldenVectors: "packet-capture-plan-builder/2026-07-16",

  // -- Safety & sharing --
  // Cluster guardrails, plus PCPB's own: the tool PLANS collection and never
  // ingests captures (privacy boundary, MVP); no interception/evasion or
  // decryption-bypass guidance; filter hints are vendor-neutral TEMPLATES
  // with <placeholders>, never claimed version-accurate; authorization and
  // retention are named as the operator's responsibility on every plan
  // (R-BASE-AUTHZ fires unconditionally).
  dangerousInputHandling: ["closed-enum-validation"], // free text never enters rule matching
  shareSafetyDefault: "fragment", // incident/topology context is sensitive; no share params in v1

  learnLinks: ["learn/capture-points-before-packets"],

  sources: [
    {
      id: "original-ruleset-d18",
      label: "Original capture-planning ruleset (D-18: original by construction)",
      type: "original",
      access_date: "2026-07-16",
      scope:
        "the 35-rule registry, 13-point capture catalog, 9 interpretation-matrix candidates, scoring weights, signal bands, phase construction, and quality warnings are original editorial work encoding standard capture practice (boundary pairing, absence-as-evidence, clock synchronization, minimal exposure); no external specification is claimed or reproduced",
      status: "active",
    },
  ],
  credits: [{ name: "Rodolfo Nützmann", role: "method & review" }],
});
