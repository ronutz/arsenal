// ============================================================================
// src/lib/tools/f5-irules-script-stepper/index.ts
// ----------------------------------------------------------------------------
// THE iRULES SCRIPT STEPPER: the self-describing {manifest, run, vectors} triple.
//
// Run a short iRule snippet one command at a time and see each command as
// written, as the words it received after substitution, and what it
// returned, with every variable it changed, every log line, and every
// action (pool, redirect, ...) recorded rather than performed. Runs a
// small teaching interpreter in the page, bounded by a step limit and a
// value-size limit; it is not offered over the API (see registry).
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, type ScriptStepperInput, type ScriptStepperResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types.
export type { ScriptStepperInput, ScriptStepperResult, StepEvent } from "./compute";
// Values the page also needs.
export { DEFAULT_SAMPLE } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-irules-script-stepper",
  // Other names it answers to.
  canonicalAliases: ["irules-script-stepper", "tcl-stepper", "irule-tracer", "tcl-substitution-explainer"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "^\\s*(set|append|lappend|concat|incr|foreach)\\s+\\S+", example: "{\"script\":\"set n 010\\nincr n\",\"mode\":\"tcl\"}" },
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
  dangerousInputHandling: ["bounded-parse", "step-limit", "value-size-limit", "nesting-limit", "emulated-commands-only", "never-fetches"],
  // The default for share links.
  shareSafetyDefault: "review",
  // The Learn articles written for it.
  learnLinks: ["learn/irules-building-strings"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-expression-lab", "f5-irules-style-checker"],
  // Sources, each read live on its access date.
  sources: [
    // F5 K6091: The version of Tcl used to develop iRules
    { id: "k6091", label: "F5 K6091: The version of Tcl used to develop iRules", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K6091", access_date: "2026-10-03", scope: "the iRules command set was developed from Tcl base version 8.4.6, which is used in all BIG-IP versions; the engine models that version", status: "active" },
    // Tcl 8.4 manual: Tcl (the substitution rules)
    { id: "tcl84-tcl", label: "Tcl 8.4 manual: Tcl (the substitution rules)", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm", access_date: "2026-10-03", scope: "quotes allow substitution, braces prevent it, brackets run a command, and each character is processed exactly once; inside braces, braces nest and a brace quoted with a backslash is not counted, even between double quotes", status: "active" },
    // Tcl 8.4 manual: append
    { id: "tcl84-append", label: "Tcl 8.4 manual: append", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/append.htm", access_date: "2026-10-03", scope: "append adds text exactly as given and creates the variable when it does not exist", status: "active" },
    // Tcl 8.4 manual: concat
    { id: "tcl84-concat", label: "Tcl 8.4 manual: concat", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/concat.htm", access_date: "2026-10-03", scope: "concat trims each argument's leading and trailing white space and joins them with single spaces", status: "active" },
    // Tcl 8.4 manual: lappend
    { id: "tcl84-lappend", label: "Tcl 8.4 manual: lappend", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/lappend.htm", access_date: "2026-10-03", scope: "lappend adds each value as one list element", status: "active" },
    // Tcl 8.4 manual: incr
    { id: "tcl84-incr", label: "Tcl 8.4 manual: incr", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/incr.htm", access_date: "2026-10-03", scope: "incr requires an integer value and stores the result as a decimal string", status: "active" },
    // Tcl 8.4 manual: switch
    { id: "tcl84-switch", label: "Tcl 8.4 manual: switch", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm", access_date: "2026-10-03", scope: "the -exact, -glob, -regexp and -- options, fall-through bodies, default, and comments only inside bodies", status: "active" },
    // F5 K57410758: warning [use curly braces to avoid double substitution]
    { id: "k57410758", label: "F5 K57410758: warning [use curly braces to avoid double substitution]", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K57410758", access_date: "2026-10-03", scope: "expr, if and while substitute an unbraced argument a second time; the validator warning and the braced fix", status: "active" },
    // F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)
    { id: "k36322151", label: "F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K36322151", access_date: "2026-10-03", scope: "iRules use Tcl 8.4.6 with a subset of commands disabled (file, socket, exec, glob, namespace, rename, time and others)", status: "active" },
    // F5 iRules reference: log
    { id: "f5-log", label: "F5 iRules reference: log", type: "vendor-docs", url: "https://clouddocs.f5.com/api/irules/log.html", access_date: "2026-10-02", scope: "log ?-noname? ?facility.level? message; syslog keeps the first 1024 bytes", status: "active" },
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
export function run(input: ScriptStepperInput): ScriptStepperResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
