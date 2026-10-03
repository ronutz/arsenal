// ============================================================================
// src/lib/tools/f5-irules-string-extract/index.ts
// ----------------------------------------------------------------------------
// findstr, substr AND getfield, SHOWN ON THE STRING: the self-describing {manifest, run, vectors} triple.
//
// Run one of the three string-cutting commands F5 adds to iRules and see
// the match, the skipped characters, the terminator and the result on a
// ruler, beside the plain Tcl that does the same job. Cases F5's pages do
// not cover are flagged with the assumption made.
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type StringExtractInput, type StringExtractResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { StringExtractInput, StringExtractResult, ExtractCommand, Segment } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-irules-string-extract",
  // Other names it answers to.
  canonicalAliases: ["irules-string-extract", "irules-findstr", "irules-substr", "irules-getfield"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 7, pattern: "^\\s*\\[?(findstr|substr|getfield)\\s+", example: "{\"command\":\"findstr\",\"string\":\"/login.php?user=abcdefg&lang=en\",\"args\":[\"user=\",\"5\",\"&\"]}" },
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
  learnLinks: ["learn/irules-findstr-substr-getfield"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-string-workbench", "f5-irules-scan-explainer"],
  // Sources, each read live on its access date.
  sources: [
    // F5 tmsh reference: findstr
    { id: "f5-findstr", label: "F5 tmsh reference: findstr", type: "vendor-docs", url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html", access_date: "2026-10-03", scope: "findstr syntax, skip_count and terminator rules, and the two published examples the vectors reproduce", status: "active" },
    // F5 tmsh reference: substr
    { id: "f5-substr", label: "F5 tmsh reference: substr", type: "vendor-docs", url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html", access_date: "2026-10-03", scope: "substr syntax, the count and terminator rules, and the five published examples the vectors reproduce", status: "active" },
    // F5 tmsh reference: getfield
    { id: "f5-getfield", label: "F5 tmsh reference: getfield", type: "vendor-docs", url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html", access_date: "2026-10-03", scope: "getfield syntax: field numbers start at 1 and the separator may be a character or a string", status: "active" },
    // F5 iRules reference: substr (API reference page)
    { id: "f5-substr-api", label: "F5 iRules reference: substr (API reference page)", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/substr.html", access_date: "2026-10-02", scope: "the same examples, with a contributor note that the 0 count did not work for them on 11.5.4 and 11.6.0", status: "active" },
    // F5 K6091: The version of Tcl used to develop iRules
    { id: "k6091", label: "F5 K6091: The version of Tcl used to develop iRules", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K6091", access_date: "2026-10-03", scope: "the iRules command set was developed from Tcl base version 8.4.6, which is used in all BIG-IP versions; the engine models that version", status: "active" },
    // Tcl 8.4 manual: string
    { id: "tcl84-string", label: "Tcl 8.4 manual: string", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm", access_date: "2026-10-03", scope: "the subcommands, index forms (integer, end, end-N), map ordering and its single pass, compare and bytelength", status: "active" },
    // Tcl 8.4.6 source code, tag core-8-4-6 on GitHub
    { id: "tcl846-source", label: "Tcl 8.4.6 source code, tag core-8-4-6 on GitHub", type: "implementation", url: "https://github.com/tcltk/tcl/tree/core-8-4-6", access_date: "2026-10-03", scope: "the reference interpreter: the engine was differential-tested against tclsh built from this tag (commit bf3eeadc)", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: StringExtractInput): StringExtractResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
