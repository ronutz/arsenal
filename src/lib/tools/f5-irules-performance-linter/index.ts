// ============================================================================
// src/lib/tools/f5-irules-performance-linter/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING iRULES PERFORMANCE LINTER — a {manifest, run, vectors} triple.
//
// Pure local pattern scan over pasted iRule text: no network, no secrets, so
// executionClass is "localOnly", dangerousInputHandling is empty, and
// shareSafetyDefault is "review" (a pasted iRule can carry site-specific names
// like pool or data-group names, so the default posture is to review before
// sharing, even though nothing leaves the browser).
// ============================================================================

import { run as computeLint, type LinterResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  F5_IRULES_PERFORMANCE_LINTER_GOLDEN_VECTORS,
} from "./golden-vectors";

export { GOLDEN_VECTOR_SET_ID, F5_IRULES_PERFORMANCE_LINTER_GOLDEN_VECTORS } from "./golden-vectors";
export type { LinterResult, LintFinding, LintSeverity, LinterInput } from "./compute";

/** The D-49 declarative manifest for the iRules performance linter. */
export const manifest = Object.freeze({
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-irules-performance-linter",
  canonicalAliases: [
    "irules-performance-linter",
    "irule-linter",
    "irule-anti-patterns",
    "irule-cmp-check",
    "tcl-irule-lint",
  ],
  inputDetectors: [
    {
      // The "when <EVENT> {" shape of an iRule.
      kind: "regex",
      priority: 2,
      pattern: "when\\s+[A-Z_]+\\s*\\{",
      example: "when HTTP_REQUEST { set ::x 1 }",
    },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [],
  shareSafetyDefault: "review",
  learnLinks: ["learn/irules-cmp-and-static-namespace"],
  sources: [
    {
      id: "cmp-compat",
      label: "F5 clouddocs — iRules CMP Compatibility",
      type: "reference",
      url: "https://clouddocs.f5.com/api/irules/CMPCompatibility.html",
      access_date: "2026-07-07",
      scope: "the global keyword is caught by the validator as of v10 and demotes the virtual server; static:: variables were added for CMP-safe shared values; persistence and tables are CMP-compatible on modern versions",
      status: "active",
    },
    {
      id: "rule-init",
      label: "F5 clouddocs — RULE_INIT",
      type: "reference",
      url: "https://clouddocs.f5.com/api/irules/RULE_INIT.html",
      access_date: "2026-07-07",
      scope: "global variables modified by an iRule demote the virtual to a single processor core; see CMP Compatibility",
      status: "active",
    },
    {
      id: "class-cmd",
      label: "F5 clouddocs — class (and matchclass)",
      type: "reference",
      url: "https://clouddocs.f5.com/api/irules/class.html",
      access_date: "2026-07-07",
      scope: "the class command deprecates findclass and matchclass (better functionality and performance); the obsolete $::datagroup access demotes CMP on 9.4.4-10 and raises a TCL runtime error, resetting the client, on v11+",
      status: "active",
    },
    {
      id: "fast-rules",
      label: "F5 clouddocs — How To Write Fast Rules",
      type: "reference",
      url: "https://clouddocs.f5.com/api/irules/HowToWriteFastRules.html",
      access_date: "2026-07-07",
      scope: "brace expr expressions so the bytecode compiler can optimize them, rather than paying for string re-substitution; general iRule performance guidance",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/** run — the registry-facing entry point. */
export function run(input: { irule: string }): LinterResult {
  return computeLint(input);
}

export const goldenVectors = F5_IRULES_PERFORMANCE_LINTER_GOLDEN_VECTORS;
export const rejectVectors = [];
