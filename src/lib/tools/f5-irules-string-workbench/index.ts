// ============================================================================
// src/lib/tools/f5-irules-string-workbench/index.ts
// ----------------------------------------------------------------------------
// THE iRULES STRING WORKBENCH: the self-describing {manifest, run, vectors} triple.
//
// Run one Tcl 8.4.6 string subcommand (length, range, index, first, last,
// map, match, compare, equal, trim, replace, ...) and see the result on a
// character ruler: which characters were searched, matched, returned or
// replaced, and how each index argument was read.
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type StringWorkbenchInput, type StringWorkbenchResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { StringWorkbenchInput, StringWorkbenchResult, StringOp, Span, Reading } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-irules-string-workbench",
  // Other names it answers to.
  canonicalAliases: ["irules-string-workbench", "tcl-string-commands", "tcl-string-map", "irule-string-range"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 6, pattern: "^\\s*\\[?string\\s+(length|bytelength|tolower|toupper|range|index|first|last|map|match|compare|equal|trim|trimleft|trimright|replace|repeat)\\b", example: "{\"op\":\"range\",\"args\":[\"/login.php?user=abc\",\"0\",\"9\"]}" },
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
  dangerousInputHandling: ["bounded-parse", "value-size-limit", "never-fetches"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/irules-string-commands"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-string-extract", "f5-irules-scan-explainer"],
  // Sources, each read live on its access date.
  sources: [
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
export function run(input: StringWorkbenchInput): StringWorkbenchResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
