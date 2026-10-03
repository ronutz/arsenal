// ============================================================================
// src/lib/tools/f5-irules-conditional-builder/index.ts
// ----------------------------------------------------------------------------
// THE iRULES if / switch / class BUILDER: the self-describing {manifest, run, vectors} triple.
//
// Describe one decision as ordered rules and get it written three ways: an
// if / elseif chain, a switch, and a class match on data groups (with the
// tmsh definitions). A test value runs through each generated rule in the
// teaching interpreter, so the page shows where they disagree: if and
// switch take the first match, class match takes the longest.
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type ConditionalBuilderInput, type ConditionalBuilderResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { ConditionalBuilderInput, ConditionalBuilderResult, Rule, RuleOp, Subject, Form } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-irules-conditional-builder",
  // Other names it answers to.
  canonicalAliases: ["irules-conditional-builder", "irules-if-switch-class", "irule-switch-generator", "irule-data-group-builder"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 3, pattern: "\\bclass\\s+match\\b", example: "{\"subject\":\"path\",\"lowercase\":true,\"rules\":[{\"op\":\"starts_with\",\"value\":\"/api\",\"pool\":\"api_pool\"}],\"defaultPool\":\"web_pool\",\"testValue\":\"/api/v2/users\",\"dataGroup\":\"path_pools\"}" },
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
  dangerousInputHandling: ["generated-code-only", "step-limit", "value-size-limit", "never-fetches"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/irules-branching-and-lookups"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-style-checker", "f5-irules-performance-linter"],
  // Sources, each read live on its access date.
  sources: [
    // F5 iRules reference: class
    { id: "f5-class", label: "F5 iRules reference: class", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/class.html", access_date: "2026-10-02", scope: "class match and class search operators and options; starts_with and ends_with return the longest matching entry", status: "active" },
    // F5 iRules reference: Operators
    { id: "f5-operators", label: "F5 iRules reference: Operators", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/Operators.html", access_date: "2026-10-02", scope: "the Tcl operators by precedence and the operators F5 adds: contains, ends_with, equals, matches_glob, matches_regex, starts_with, and, not, or", status: "active" },
    // Tcl 8.4 manual: switch
    { id: "tcl84-switch", label: "Tcl 8.4 manual: switch", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm", access_date: "2026-10-03", scope: "the -exact, -glob, -regexp and -- options, fall-through bodies, default, and comments only inside bodies", status: "active" },
    // F5 K15650046: Tcl code injection security exposure
    { id: "k15650046", label: "F5 K15650046: Tcl code injection security exposure", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K15650046", access_date: "2026-10-03", scope: "always brace expressions; always put -- before the switch string; the bad option error a value starting with - produces", status: "active" },
    // F5 DevCentral: iRules Style Guide (JRahm with Jim_Deucker, 2022-12-22)
    { id: "devcentral-style", label: "F5 DevCentral: iRules Style Guide (JRahm with Jim_Deucker, 2022-12-22)", type: "vendor-community", url: "https://community.f5.com/t/irules-style-guide/71151", access_date: "2026-10-03", scope: "the editor settings and the numbered rules R1 to R20 the checker reads an iRule against", status: "active" },
    // F5 iRules reference: priority
    { id: "f5-priority", label: "F5 iRules reference: priority", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/priority.html", access_date: "2026-10-03", scope: "event priority runs from 0 to 1000, defaults to 500, and lower numbers run first", status: "active" },
    // F5 K6091: The version of Tcl used to develop iRules
    { id: "k6091", label: "F5 K6091: The version of Tcl used to develop iRules", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K6091", access_date: "2026-10-03", scope: "the iRules command set was developed from Tcl base version 8.4.6, which is used in all BIG-IP versions; the engine models that version", status: "active" },
    // F5 iRules reference: HTTP::path
    { id: "f5-http-path", label: "F5 iRules reference: HTTP::path", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/HTTP__path.html", access_date: "2026-10-03", scope: "HTTP::path returns the path part of the request and does not include the query string", status: "active" },
    // Tcl 8.4 manual: Tcl (the substitution rules)
    { id: "tcl84-tcl", label: "Tcl 8.4 manual: Tcl (the substitution rules)", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm", access_date: "2026-10-03", scope: "quotes allow substitution, braces prevent it, brackets run a command, and each character is processed exactly once; inside braces, braces nest and a brace quoted with a backslash is not counted, even between double quotes", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: ConditionalBuilderInput): ConditionalBuilderResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
