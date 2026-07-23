// ============================================================================
// src/lib/tools/digital-transformation-tracker/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING DIGITAL TRANSFORMATION TRACKER - {manifest, run, vectors}.
// A curated milestone dataset with a filtering engine, organized by CERTAINTY
// tier so that a forecast can never be mistaken for a fact. Paired with the
// digital-transformation article. (D-19.)
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, TRACKER_VECTORS } from "./golden-vectors";

export { track, run, findUnattributed, findContestedWithoutNote } from "./compute";
export type { TrackerInput, TrackerResult, TrackerError } from "./compute";
export { MILESTONES, DOMAINS, CERTAINTIES } from "./milestones";
export type { Milestone, Domain, Certainty } from "./milestones";
export { GOLDEN_VECTOR_SET_ID, TRACKER_VECTORS, verifyVectors } from "./golden-vectors";
export type { TrackerVector } from "./golden-vectors";

/** The D-49 declarative manifest for the digital-transformation-tracker. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Industry & context",
  toolSlug: "digital-transformation-tracker",
  canonicalAliases: ["dx-tracker", "transformation-timeline", "milestone-tracker"],
  inputDetectors: [
    {
      kind: "structured-form",
      pattern: "domain / certainty / year-range filters",
      priority: 1,
      example: '{"domains":["money","state"],"certainties":["shipped","inForce"]}',
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "enumerated-domain-and-certainty",
    "year-window-validation",
    "dataset-attribution-invariant",
    "no-network-no-eval",
  ],
  shareSafetyDefault: "safe", // filters carry no personal data

  // -- Teaching & provenance --
  learnLinks: ["learn/digital-transformation"],
  sources: [
    {
      id: "eu-ai-act",
      label: "Regulation (EU) 2024/1689 - the EU Artificial Intelligence Act implementation timeline",
      url: "https://artificialintelligenceact.eu/implementation-timeline/",
    },
    {
      id: "ai-act-desk",
      label: "European Commission - AI Act Service Desk implementation timeline",
      url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act",
    },
    {
      id: "gartner-agents",
      label: "Gartner newsroom - task-specific AI agents in enterprise applications by 2026",
      url: "https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025",
    },
    {
      id: "gartner-da",
      label: "Gartner newsroom - top data and analytics predictions for 2026 and beyond",
      url: "https://www.gartner.com/en/newsroom/press-releases/2026-03-11-gartner-announces-top-predictions-for-data-and-analytics-in-2026",
    },
  ],
  vectorsCount: TRACKER_VECTORS.length,
});
