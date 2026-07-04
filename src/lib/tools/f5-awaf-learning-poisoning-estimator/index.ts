// ============================================================================
// src/lib/tools/f5-awaf-learning-poisoning-estimator/index.ts
// ----------------------------------------------------------------------------
// F5 ADVANCED WAF — AUTOMATIC-LEARNING POISONING ESTIMATOR. A {manifest, run,
// vectors} triple. Given a BIG-IP Advanced WAF (ASM) Policy Builder Loosen
// configuration (Learning Mode, loosen scope, the different-sources/sessions/
// time thresholds, and the target manipulation's violation rating) plus the
// attacker's resources (distinct source IPs and per-source request rate), it
// computes the minimum effort to force ONE automatic policy relaxation — and
// gates hard on the documented rules that make it impossible (Manual/Disabled
// learning, unlearnable rating-5 violations, trusted-only loosening).
//
// Pure and deterministic (D-49): a model of F5's documented Policy Builder
// behaviour, never a probe. It never contacts a BIG-IP and never fetches.
// ============================================================================

import { estimatePoisoning } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { estimatePoisoning, DEFAULTS } from "./compute";
export type { PoisoningInput, PoisoningResult, LearningMode, ViolationRating, Gate, Note, Mitigation } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-awaf-learning-poisoning-estimator tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "f5-awaf-learning-poisoning-estimator",
  canonicalAliases: [
    "awaf-poisoning-estimator",
    "policy-builder-loosening-estimator",
    "asm-automatic-learning-risk",
    "waf-learning-poisoning",
    "how-many-requests-to-drill-a-hole",
  ],
  // Structured/form tool: no free-text omnibox detectors (driven by its form).
  inputDetectors: [],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  shareSafetyDefault: "full", // inputs are generic thresholds, not secrets

  // -- Teaching & provenance --
  learnLinks: [
    "learn/awaf-automatic-learning-poisoning",
    "learn/awaf-enforcement-mode-blocking-vs-transparent",
    "learn/awaf-signature-staging-and-enforcement-readiness",
  ],
  sources: [
    { id: "f5-k000134503", label: "F5 K000134503: Overview of Fully Automatic Policy Building learning mode", url: "https://my.f5.com/manage/s/article/K000134503" },
    { id: "f5-asm-learning", label: "F5 BIG-IP ASM Implementations: Refining Security Policies with Learning (learning score; 100% auto-accept/enforce; unlearnable violations)", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_asm/manuals/product/asm-implementations-12-1-0/23.html" },
    { id: "f5-asm-build", label: "F5 BIG-IP ASM Implementations: Changing How a Security Policy is Built (Loosen/Tighten/Track Site Changes; trusted vs untrusted thresholds; trusted default 1 session)", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_asm/manuals/product/asm-implementations-12-1-0/24.html" },
    { id: "f5-next-pb-ref", label: "F5 BIG-IP Next: Reference: WAF Policy Builder (Learning Mode Automatic/Manual/Disabled; auto-accept at 100%; Learning Speed)", url: "https://clouddocs.f5.com/bigip-next/20-0-1/waf_management/awaf_policy_builder_ref.html" },
  ],
});

/** Tool entry point. Structured input arrives as JSON (see registry wiring). */
export function run(input: string) {
  return estimatePoisoning(JSON.parse(input));
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
