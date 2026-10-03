// ============================================================================
// src/lib/tools/f5-irules-number-notation/index.ts
// ----------------------------------------------------------------------------
// THE iRULES NUMBER NOTATION CONVERTER: the self-describing {manifest, run, vectors} triple.
//
// Type a value the way it appears in an iRule (010, 0x1F, 08, 1e3, " 12 ")
// and see how Tcl 8.4.6 reads it: integer or double, the base it was
// written in, its value in other bases, the literal reading inside an
// expression, and how == and eq compare it with another value.
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type NumberNotationInput, type NumberNotationResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { NumberNotationInput, NumberNotationResult, ExprProbe } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-irules-number-notation",
  // Other names it answers to.
  canonicalAliases: ["irules-number-notation", "tcl-number-notation", "tcl-octal-hex", "irule-octal-converter"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 3, pattern: "^\\s*[+-]?(0[xX][0-9A-Fa-f]+|0[0-7]*[89][0-9]*|0[0-7]+)\\s*$", example: "{\"text\":\"010\",\"other\":\"8\"}" },
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
  dangerousInputHandling: ["bounded-parse", "never-fetches", "never-executes-commands"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/irules-tcl-number-notation", "learn/irules-expression-operators"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-expression-lab", "f5-irules-string-workbench"],
  // Sources, each read live on its access date.
  sources: [
    // F5 K6091: The version of Tcl used to develop iRules
    { id: "k6091", label: "F5 K6091: The version of Tcl used to develop iRules", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K6091", access_date: "2026-10-03", scope: "the iRules command set was developed from Tcl base version 8.4.6, which is used in all BIG-IP versions; the engine models that version", status: "active" },
    // Tcl 8.4 manual: expr
    { id: "tcl84-expr", label: "Tcl 8.4 manual: expr", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm", access_date: "2026-10-03", scope: "operand notation (decimal, octal with a leading 0, hexadecimal with 0x), operator precedence, string comparison, eq and ne, and the sign of a remainder", status: "active" },
    // F5 iRules reference: Operators
    { id: "f5-operators", label: "F5 iRules reference: Operators", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/Operators.html", access_date: "2026-10-02", scope: "the Tcl operators by precedence and the operators F5 adds: contains, ends_with, equals, matches_glob, matches_regex, starts_with, and, not, or", status: "active" },
    // Tcl 8.4.6 source code, tag core-8-4-6 on GitHub
    { id: "tcl846-source", label: "Tcl 8.4.6 source code, tag core-8-4-6 on GitHub", type: "implementation", url: "https://github.com/tcltk/tcl/tree/core-8-4-6", access_date: "2026-10-03", scope: "the reference interpreter: the engine was differential-tested against tclsh built from this tag (commit bf3eeadc)", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: NumberNotationInput): NumberNotationResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
