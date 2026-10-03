// ============================================================================
// src/lib/tools/f5-irules-expression-lab/index.ts
// ----------------------------------------------------------------------------
// THE iRULES EXPRESSION LAB: the self-describing {manifest, run, vectors} triple.
//
// Evaluate an expression the way expr, if and while do in an iRule and see
// every step: how each operand was read, which operator ran, numeric or
// string comparison, where && and || stopped, and where an error began.
// Runs a small teaching interpreter in the page, bounded by a step limit
// and a value-size limit; it is not offered over the API (see registry).
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type ExpressionLabInput, type ExpressionLabResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { ExpressionLabInput, ExpressionLabResult, ComparisonView, LabNode } from "./compute";
// Values the page also needs.
export { DEFAULT_SAMPLE, grouping } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-irules-expression-lab",
  // Other names it answers to.
  canonicalAliases: ["irules-expression-lab", "tcl-expr-explainer", "irule-expr-evaluator", "tcl-precedence"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 4, pattern: "^\\s*\\[?expr\\s*\\{[^}]*\\}\\]?\\s*$", example: "{\"expression\":\"$x == $y\",\"setup\":\"set x 012; set y 10\",\"mode\":\"tcl\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled.
  dangerousInputHandling: ["bounded-parse", "step-limit", "value-size-limit", "emulated-commands-only", "never-fetches"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/irules-expression-operators", "learn/irules-tcl-number-notation"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-number-notation", "f5-irules-script-stepper"],
  // Sources, each read live on its access date.
  sources: [
    // F5 K6091: The version of Tcl used to develop iRules
    { id: "k6091", label: "F5 K6091: The version of Tcl used to develop iRules", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K6091", access_date: "2026-10-03", scope: "the iRules command set was developed from Tcl base version 8.4.6, which is used in all BIG-IP versions; the engine models that version", status: "active" },
    // Tcl 8.4 manual: expr
    { id: "tcl84-expr", label: "Tcl 8.4 manual: expr", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm", access_date: "2026-10-03", scope: "operand notation (decimal, octal with a leading 0, hexadecimal with 0x), operator precedence, string comparison, eq and ne, and the sign of a remainder", status: "active" },
    // F5 iRules reference: Operators
    { id: "f5-operators", label: "F5 iRules reference: Operators", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/Operators.html", access_date: "2026-10-02", scope: "the Tcl operators by precedence and the operators F5 adds: contains, ends_with, equals, matches_glob, matches_regex, starts_with, and, not, or", status: "active" },
    // F5 K57410758: warning [use curly braces to avoid double substitution]
    { id: "k57410758", label: "F5 K57410758: warning [use curly braces to avoid double substitution]", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K57410758", access_date: "2026-10-03", scope: "expr, if and while substitute an unbraced argument a second time; the validator warning and the braced fix", status: "active" },
    // F5 K15650046: Tcl code injection security exposure
    { id: "k15650046", label: "F5 K15650046: Tcl code injection security exposure", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K15650046", access_date: "2026-10-03", scope: "always brace expressions; always put -- before the switch string; the bad option error a value starting with - produces", status: "active" },
    // F5 iRules reference: HTTP::uri
    { id: "f5-http-uri", label: "F5 iRules reference: HTTP::uri", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/HTTP__uri.html", access_date: "2026-10-03", scope: "HTTP::uri returns the URI part of the request (path and query); the sample request answers it", status: "active" },
    // F5 iRules reference: HTTP::host
    { id: "f5-http-host", label: "F5 iRules reference: HTTP::host", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/HTTP__host.html", access_date: "2026-10-03", scope: "HTTP::host returns the Host header value (with the port when it is not the standard one); the sample request answers it", status: "active" },
    // Tcl 8.4.6 source code, tag core-8-4-6 on GitHub
    { id: "tcl846-source", label: "Tcl 8.4.6 source code, tag core-8-4-6 on GitHub", type: "implementation", url: "https://github.com/tcltk/tcl/tree/core-8-4-6", access_date: "2026-10-03", scope: "the reference interpreter: the engine was differential-tested against tclsh built from this tag (commit bf3eeadc)", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: ExpressionLabInput): ExpressionLabResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
