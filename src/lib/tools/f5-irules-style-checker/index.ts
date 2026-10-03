// ============================================================================
// src/lib/tools/f5-irules-style-checker/index.ts
// ----------------------------------------------------------------------------
// THE iRULES STYLE CHECKER: the self-describing {manifest, run, vectors} triple.
//
// Paste an iRule and read it against the DevCentral iRules Style Guide
// (editor settings and rules R1 to R20) plus a real Tcl 8.4 syntax check.
// The rule is parsed, never run; each finding names the guide rule it
// comes from.
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type StyleCheckerResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { StyleCheckerResult, StyleFinding, Severity } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-irules-style-checker",
  // Other names it answers to.
  canonicalAliases: ["irules-style-checker", "irule-style-guide", "irule-lint-style", "devcentral-style-guide"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 3, pattern: "^\\s*when\\s+[A-Z][A-Z0-9_]+(\\s+priority\\s+\\d+)?\\s*\\{", example: "{\"irule\":\"when HTTP_REQUEST {\\n    pool web_pool\\n}\\n\"}" },
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
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "irule-not-executed", "never-fetches"],
  // The default for share links.
  shareSafetyDefault: "review",
  // The Learn articles written for it.
  learnLinks: ["learn/irules-style-guide-explained"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-performance-linter", "f5-irules-conditional-builder"],
  // Sources, each read live on its access date.
  sources: [
    // F5 DevCentral: iRules Style Guide (JRahm with Jim_Deucker, 2022-12-22)
    { id: "devcentral-style", label: "F5 DevCentral: iRules Style Guide (JRahm with Jim_Deucker, 2022-12-22)", type: "vendor-community", url: "https://community.f5.com/t/irules-style-guide/71151", access_date: "2026-10-03", scope: "the editor settings and the numbered rules R1 to R20 the checker reads an iRule against", status: "active" },
    // F5 K15650046: Tcl code injection security exposure
    { id: "k15650046", label: "F5 K15650046: Tcl code injection security exposure", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K15650046", access_date: "2026-10-03", scope: "always brace expressions; always put -- before the switch string; the bad option error a value starting with - produces", status: "active" },
    // F5 K57410758: warning [use curly braces to avoid double substitution]
    { id: "k57410758", label: "F5 K57410758: warning [use curly braces to avoid double substitution]", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K57410758", access_date: "2026-10-03", scope: "expr, if and while substitute an unbraced argument a second time; the validator warning and the braced fix", status: "active" },
    // F5 iRules reference: priority
    { id: "f5-priority", label: "F5 iRules reference: priority", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/priority.html", access_date: "2026-10-03", scope: "event priority runs from 0 to 1000, defaults to 500, and lower numbers run first", status: "active" },
    // F5 iRules reference: table
    { id: "f5-table", label: "F5 iRules reference: table", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/table.html", access_date: "2026-10-03", scope: "a table entry gets a default timeout of 180 seconds and an indefinite lifetime when none is given (the R17 finding)", status: "active" },
    // F5 iRules reference: How To Write Fast Rules
    { id: "f5-fast-rules", label: "F5 iRules reference: How To Write Fast Rules", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/HowToWriteFastRules.html", access_date: "2026-10-03", scope: "switch over if, chained elseif over separate ifs, switch over matchclass up to 100 elements, and braced expr (about a factor of 20)", status: "active" },
    // Tcl 8.4 manual: switch
    { id: "tcl84-switch", label: "Tcl 8.4 manual: switch", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm", access_date: "2026-10-03", scope: "the -exact, -glob, -regexp and -- options, fall-through bodies, default, and comments only inside bodies", status: "active" },
    // F5 K6091: The version of Tcl used to develop iRules
    { id: "k6091", label: "F5 K6091: The version of Tcl used to develop iRules", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K6091", access_date: "2026-10-03", scope: "the iRules command set was developed from Tcl base version 8.4.6, which is used in all BIG-IP versions; the engine models that version", status: "active" },
    // Tcl 8.4.6 source code, tag core-8-4-6 on GitHub
    { id: "tcl846-source", label: "Tcl 8.4.6 source code, tag core-8-4-6 on GitHub", type: "implementation", url: "https://github.com/tcltk/tcl/tree/core-8-4-6", access_date: "2026-10-03", scope: "the reference interpreter: the engine was differential-tested against tclsh built from this tag (commit bf3eeadc)", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: { irule: string }): StyleCheckerResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
