// ============================================================================
// src/lib/tools/f5-awaf-policy-diff/index.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF POLICY-DIFF "DID THIS OPEN A HOLE?" CHECKER. A
// {manifest, run, vectors} triple. Paste a before and an after declarative WAF
// policy and it classifies every security-relevant change as a relaxation or a
// tightening, and flags the relaxations that widen protection beyond a single
// entity (Transparent mode, a disabled violation or evasion, Data Guard off,
// trusted X-Forwarded-For, a wildcard entity) apart from a properly-scoped
// single-entity allow.
//
// Pure, decode-only (D-49): it compares the two policy documents you paste and
// never contacts a BIG-IP or fetches. The registry entry is structured; the
// run() input is { "before": {...}, "after": {...} }.
// ============================================================================

import { diffFromJson } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { diffPolicies, diffFromJson } from "./compute";
export type { ChangeKind, Scope, Concern, Change, Verdict, DiffResult } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Security & WAF",
  toolSlug: "f5-awaf-policy-diff",
  canonicalAliases: ["awaf-policy-diff", "asm-policy-diff", "waf-policy-hole-check", "did-this-open-a-hole"],
  inputDetectors: [], // two-input; form/paste driven

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/awaf-declarative-policy-structure",
    "learn/awaf-false-positives",
    "learn/awaf-enforcement-mode-blocking-vs-transparent",
  ],
  sources: [
    { id: "f5-decl-waf-schema", label: "F5 Advanced WAF declarative policy schema (enforcementMode, signature-settings, blocking-settings evasions/violations, data-guard, general.trustXff, entity arrays)", url: "https://clouddocs.f5.com/products/waf-declarative-policy/" },
    { id: "f5-k70544352", label: "F5 K70544352: Reducing false positive violations (relax only where a false positive occurred, and scope it)", url: "https://my.f5.com/manage/s/article/K70544352" },
    { id: "f5-asm-violations", label: "F5 BIG-IP ASM: Working with Violations (a transparent policy and a disabled block flag stop enforcement)", url: "https://techdocs.f5.com/en-us/bigip-17-5-0/big-ip-asm-implementations/working-with-violations.html" },
  ],
});

// Structured entry: parses { before, after }.
export function run(input: string) {
  return diffFromJson(input);
}

export const __selftest = verifyVectors;
