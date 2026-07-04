// ============================================================================
// src/lib/tools/f5-awaf-false-positive-triage/index.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF FALSE-POSITIVE TRIAGE. A {manifest, run, vectors}
// triple. Pick a violation category, its average violation rating, and whether
// it is enforced/staged/transparent, and get F5's rating-based verdict (accept
// a confirmed false positive, investigate, or clear a likely attack), the
// scoped remediation for that category, and the discipline that keeps you from
// relaxing a real attack.
//
// Pure and deterministic (D-49): a model of F5's documented triage behaviour,
// never a probe. It never contacts a BIG-IP and never fetches.
// ============================================================================

import { triageFalsePositive } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { triageFalsePositive, DEFAULTS, CATEGORIES } from "./compute";
export type { FpInput, FpResult, ViolationCategory, ViolationRating, EnforcementState, Triage, FpNote } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Security & WAF",
  toolSlug: "f5-awaf-false-positive-triage",
  canonicalAliases: ["awaf-false-positive", "asm-false-positive-tuning", "waf-fp-triage", "reducing-false-positives"],
  inputDetectors: [], // form-driven

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  shareSafetyDefault: "full",

  learnLinks: [
    "learn/awaf-false-positives",
    "learn/awaf-signature-staging-and-enforcement-readiness",
    "learn/awaf-automatic-learning-poisoning",
  ],
  sources: [
    { id: "f5-k70544352", label: "F5 K70544352: Reducing false positive violations", url: "https://my.f5.com/manage/s/article/K70544352" },
    { id: "f5-asm-violations", label: "F5 BIG-IP ASM/Advanced WAF: Working with Violations (violation rating -> block behaviour; rating 4-5 blocks even with Block off; unlearnable rating-5 set)", url: "https://techdocs.f5.com/en-us/bigip-17-5-0/big-ip-asm-implementations/working-with-violations.html" },
    { id: "f5-asm-learning", label: "F5 BIG-IP ASM: Refining Security Policies with Learning (accept vs clear by rating; relax only genuine false positives)", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_asm/manuals/product/asm-implementations-11-6-0/25.html" },
    { id: "f5-k13050156", label: "F5 K13050156: Policy tuning and enhancement", url: "https://my.f5.com/manage/s/article/K13050156" },
  ],
});

export function run(input: string) {
  return triageFalsePositive(JSON.parse(input));
}

export const __selftest = verifyVectors;
