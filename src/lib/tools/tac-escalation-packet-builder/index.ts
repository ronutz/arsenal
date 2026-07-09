// ============================================================================
// src/lib/tools/tac-escalation-packet-builder/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the TAC Escalation Packet
// Builder - Operations & Fieldcraft tool 5 (D-86), built on the shared
// fieldcraft foundation.
// ============================================================================

export {
  run,
  runFromJson,
  validateInput,
  artifactToMarkdown,
  PacketError,
  SECTION_ORDER,
  RULE_COUNT,
  COLLECT_COUNT,
  SECTION_COUNT,
  RULE_REASONS,
} from "./compute";
export type {
  PacketInput,
  PacketResult,
  PacketNotes,
  PacketSection,
  PacketLine,
  ToCollectItem,
  SectionId,
  VendorDomain,
  Severity,
  Reproducibility,
  Collected,
  Tried,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  PACKET_SNAPSHOT_VECTORS,
  PACKET_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the TAC Escalation Packet Builder. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Operations & Fieldcraft",
  toolSlug: "tac-escalation-packet-builder",
  canonicalAliases: ["tac case", "support escalation", "vendor case", "escalation packet", "open a support case"],

  inputDetectors: [] as const, // OMNIBOX EXEMPTION (D-86 §3.3): structured-form tool

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Verification (D-86 §3.1, the pilot's ruling) --
  // Rule-firing snapshot vectors: per input, assert exactly which rules fire,
  // the packet section ids (fixed order), the to-collect ids (with already-
  // collected artifacts dropped), the readiness-risk ids, the warning ids, and
  // the coarse readiness read.
  verificationModel: "rule-firing-snapshot",
  goldenVectors: "tac-escalation-packet-builder/2026-07-08",

  // -- Safety & sharing --
  // D-86 §3.5 guardrails: it structures the escalation hand-off and lists the
  // artifacts to collect; it does NOT open a case, contact any vendor, make
  // network calls, ask for credentials, or collect diagnostics from your
  // systems (it names which to attach). It does not diagnose. Vendor names are
  // nominative (D-27); no preset implies training or support-partner
  // authorization.
  dangerousInputHandling: ["closed-enum-validation", "no-credential-collection"],
  shareSafetyDefault: "fragment",

  learnLinks: ["learn/tac-cases-that-get-triaged-fast"],

  sources: [
    {
      id: "original-ruleset-d18",
      label: "Original TAC-escalation ruleset (D-18: original by construction)",
      type: "original",
      access_date: "2026-07-08",
      scope:
        "the 12-rule registry, 11 to-collect diagnostic artifacts with vendor-flavored command hints, the collected-satisfies mapping, 8 fixed packet sections, 5 readiness notes, and the readiness derivation are original editorial work encoding standard vendor-support hand-off practice (problem statement, exact error, timeline, environment, diagnostics, reproduction, impact, the ask); the diagnostic artifact names are generic operational captures and no vendor procedure or specification is reproduced",
      status: "active",
    },
  ],
  credits: [{ name: "Rodolfo Nützmann", role: "method & review" }],
});
