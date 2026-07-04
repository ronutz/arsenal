// ============================================================================
// src/lib/tools/f5-awaf-evasion-explainer/index.ts
// ----------------------------------------------------------------------------
// F5 ADVANCED WAF EVASION-TECHNIQUE EXPLAINER — a {manifest, run, vectors}
// triple. The decode side of "evasion technique detected" (VIOL_EVASION):
// type a sub-violation name (or "evasions") for F5's eight sub-violations
// explained, or paste the `evasions` block of a declarative policy to read
// each one back as enabled or disabled with the Multiple-decoding pass count
// surfaced and bounds-checked.
//
// Decode-only (D-49, zero egress). It reads what you paste; it never fetches,
// never validates against a live BIG-IP, and never evaluates traffic. Grounded
// in F5's own K7929 and the current BIG-IP ASM 17.5 "Working with Violations"
// evasion sub-violation table, plus the Declarative WAF schema's evasions
// section for the field names and the 2..5 pass bound (see `sources`).
// ============================================================================

import { explainEvasions } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { explainEvasions, EVASION_TECHNIQUES, PASS_MIN, PASS_MAX, PASS_DEFAULT } from "./compute";
export type { Mode, EvasionTechnique, TechniqueState, Note, EvasionResult } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-awaf-evasion-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "f5-awaf-evasion-explainer",
  canonicalAliases: [
    "awaf-evasion-explainer",
    "asm-evasion-techniques",
    "viol-evasion",
    "evasion-technique-detected",
    "f5-evasion-techniques",
    "waf-evasion-sub-violations",
  ],
  inputDetectors: [
    // The evasions array with its description enum is unique to this block.
    { kind: "regex", pattern: '"evasions"\\s*:\\s*\\[', priority: 8, example: '{ "blocking-settings": { "evasions": [ { "description": "Multiple decoding", "enabled": true } ] } }' },
    // The Multiple-decoding pass-count field is highly specific.
    { kind: "regex", pattern: '"maxDecodingPasses"\\s*:', priority: 7, example: '[ { "description": "Multiple decoding", "maxDecodingPasses": 3 } ]' },
    // A bare sub-violation name typed directly.
    { kind: "regex", pattern: "^(%u decoding|Apache whitespace|Bad unescape|Bare byte decoding|Directory traversals|IIS backslashes|IIS Unicode codepoints|Multiple decoding)$", priority: 5, example: "Multiple decoding" },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // A pasted evasions block is low-sensitivity, but a whole policy can carry
  // internal names -> default to a shareable fragment, never the raw input.
  shareSafetyDefault: "fragment",

  // -- Teaching & provenance --
  learnLinks: [
    "learn/awaf-evasion-techniques",
    "learn/awaf-enforcement-mode-blocking-vs-transparent",
    "learn/awaf-declarative-policy-structure",
  ],
  sources: [
    { id: "f5-k7929", label: "F5 K7929: Working with evasion technique detected violations", url: "https://my.f5.com/manage/s/article/K7929" },
    { id: "f5-asm-violations-17_5", label: "F5 BIG-IP ASM 17.5: Working with Violations (Evasion Techniques Sub-Violations table)", url: "https://techdocs.f5.com/en-us/bigip-17-5-0/big-ip-asm-implementations/working-with-violations.html" },
    { id: "f5-awaf-schema-v17_1", label: "F5 BIG-IP Declarative WAF v17.1 Schema (blocking-settings.evasions: description, enabled, maxDecodingPasses 2..5)", url: "https://clouddocs.f5.com/products/waf-declarative-policy/schema_v17_1.html" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, decode-only engine. */
export function run(input: string) {
  return explainEvasions(input);
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
