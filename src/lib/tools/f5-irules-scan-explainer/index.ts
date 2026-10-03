// ============================================================================
// src/lib/tools/f5-irules-scan-explainer/index.ts
// ----------------------------------------------------------------------------
// THE iRULES scan EXPLAINER: the self-describing {manifest, run, vectors} triple.
//
// Give a value, a scan format and variable names, and see each directive
// line up against the characters it consumed, the value it produced, the
// variable it filled, and exactly why scanning stopped.
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type ScanExplainerInput, type ScanExplainerResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { ScanExplainerInput, ScanExplainerResult, DirectiveView, StepView } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-irules-scan-explainer",
  // Other names it answers to.
  canonicalAliases: ["irules-scan-explainer", "tcl-scan", "irule-scan-format"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 6, pattern: "^\\s*\\[?scan\\s+\\S+\\s+\\S*%", example: "{\"input\":\"10:30\",\"format\":\"%d:%d\",\"vars\":\"hours minutes\"}" },
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
  dangerousInputHandling: ["bounded-parse", "never-fetches"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/irules-scan-command"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-string-extract", "f5-irules-string-workbench"],
  // Sources, each read live on its access date.
  sources: [
    // F5 K6091: The version of Tcl used to develop iRules
    { id: "k6091", label: "F5 K6091: The version of Tcl used to develop iRules", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K6091", access_date: "2026-10-03", scope: "the iRules command set was developed from Tcl base version 8.4.6, which is used in all BIG-IP versions; the engine models that version", status: "active" },
    // Tcl 8.4 manual: scan
    { id: "tcl84-scan", label: "Tcl 8.4 manual: scan", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/scan.htm", access_date: "2026-10-03", scope: "the conversions, the -1 result, and %n (which the manual describes as characters; Tcl 8.4.6 counts bytes)", status: "active" },
    // F5 iRules reference: matches_regex
    { id: "f5-matches-regex", label: "F5 iRules reference: matches_regex", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/matches_regex.html", access_date: "2026-10-02", scope: "F5's note that a string command is more efficient than a regular expression, and that most cases can use string match or scan", status: "active" },
    // Tcl 8.4.6 source code, tag core-8-4-6 on GitHub
    { id: "tcl846-source", label: "Tcl 8.4.6 source code, tag core-8-4-6 on GitHub", type: "implementation", url: "https://github.com/tcltk/tcl/tree/core-8-4-6", access_date: "2026-10-03", scope: "the reference interpreter: the engine was differential-tested against tclsh built from this tag (commit bf3eeadc)", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: ScanExplainerInput): ScanExplainerResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
