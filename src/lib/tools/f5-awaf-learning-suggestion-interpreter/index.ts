// ============================================================================
// src/lib/tools/f5-awaf-learning-suggestion-interpreter/index.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF LEARNING-SUGGESTION INTERPRETER. A {manifest, run,
// vectors} triple. Characterise a Traffic Learning suggestion (its action, its
// learning score, the violation rating, the learning mode, and the source
// trust) and it says whether accepting it loosens or tightens the policy,
// whether a loosening is a false-positive fix or a security relaxation, and
// whether Automatic learning is about to enforce it for you - the poisoning
// vector. It bridges the poisoning estimator and the false-positive triage.
//
// Pure and deterministic (D-49): a model of F5's documented learning behaviour,
// never a probe. It never contacts a BIG-IP and never fetches.
// ============================================================================

import { interpretSuggestion } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { interpretSuggestion, DEFAULTS, ACTIONS } from "./compute";
export type { ActionType, LearningMode, SourceTrust, Rating, SuggInput, Direction, Assessment, SuggNote, SuggResult } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Security & WAF",
  toolSlug: "f5-awaf-learning-suggestion-interpreter",
  canonicalAliases: ["asm-learning-suggestion", "awaf-suggestion-interpreter", "tightening-loosening", "asm-traffic-learning"],
  inputDetectors: [], // form-driven

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  shareSafetyDefault: "full",

  learnLinks: [
    "learn/awaf-automatic-learning-poisoning",
    "learn/awaf-false-positives",
    "learn/awaf-signature-staging-and-enforcement-readiness",
  ],
  sources: [
    { id: "f5-k03513854", label: "F5 K03513854: ASM Learning Suggestions (tightening and loosening)", url: "https://my.f5.com/manage/s/article/K03513854" },
    { id: "f5-asm-learning", label: "F5 BIG-IP ASM: Refining Security Policies with Learning (learning score, violation-rating influence, auto-apply at 100% in Automatic, relax only genuine false positives)", url: "https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-implementations-14-1-0/refining-security-policies-with-learning.html" },
    { id: "f5-k70544352", label: "F5 K70544352: Reducing false positive violations", url: "https://my.f5.com/manage/s/article/K70544352" },
  ],
});

export function run(input: string) {
  return interpretSuggestion(JSON.parse(input));
}

export const __selftest = verifyVectors;
