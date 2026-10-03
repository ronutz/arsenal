// ============================================================================
// src/lib/tools/f5-irules-script-stepper/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES SCRIPT STEPPER: run a short iRule snippet one command at a time
// and see each command three ways - as written, as the words it actually
// received after substitution, and what it returned - along with every
// variable it changed, every line it logged, and every action it asked for.
//
// It is built for the questions that trip people up when combining strings:
// what "$a$b" produces, why concat drops spaces that append keeps, why a
// value built with spaces becomes several list elements in foreach, what
// incr does to "010", and where && stops. Control flow (if, switch, while,
// for, foreach, catch, break, continue) runs too, so the branch actually taken
// is visible.
//
// Engine: src/lib/tcl84/interp.ts (checked against a real Tcl 8.4.6
// interpreter); iRules commands come from F5's documentation via irules.ts.
// ============================================================================

import { runScript, type Code, type LogLine, type VarChange } from "@/lib/tcl84/interp";
import { irulesCommands, type Action, type DataGroup, type SampleRequest } from "@/lib/tcl84/irules";
import { toTraceNode, type TraceNode } from "@/lib/tcl84/trace";
import { limitInput } from "@/lib/tcl84/value";

/** The input. */
export interface ScriptStepperInput {
  // The script.
  script: string;
  // "tcl" (plain Tcl 8.4.6) or "irules" (adds F5's commands and operators).
  mode: "tcl" | "irules";
  // The request iRules commands read (iRules mode).
  sample?: SampleRequest;
  // Data groups for class match (iRules mode).
  groups?: Record<string, DataGroup>;
}

/** One executed command, for display. */
export interface StepEvent {
  // Nesting depth.
  depth: number;
  // Line in the script it came from (1-based, within its own body).
  line: number;
  // The command as written.
  source: string;
  // The words it received.
  words: string[];
  // Its result.
  result?: string;
  // Its error.
  error?: string;
  // Variables it changed.
  changes: VarChange[];
  // Notes (codes the UI translates).
  notes: { code: string; params?: Record<string, string | number | boolean> }[];
  // The expressions it evaluated (expr, if, while, for), flattened, in order.
  exprs: { text: string; tree: TraceNode }[];
}

/** The stepper's answer. */
export interface ScriptStepperResult {
  // How the script ended: ok, error, return, break, continue.
  code: Code;
  // Its result, or the error message.
  result: string;
  // Every command, in execution order.
  events: StepEvent[];
  // The variables at the end.
  vars: { name: string; value: string }[];
  // Lines written by log (or puts).
  logs: LogLine[];
  // Actions requested (pool, HTTP::redirect, ...), recorded rather than performed.
  actions: Action[];
}

/** A neutral sample request, used when none is given. */
export const DEFAULT_SAMPLE: SampleRequest = { uri: "/login.php?user=abc", host: "www.example.com", method: "GET", headers: { "User-Agent": "curl/8.0" }, clientAddr: "192.0.2.10" };

/** Run the stepper. */
export function run(input: ScriptStepperInput): ScriptStepperResult {
  // Bounded input: the iRule size limit (64 KB).
  limitInput("The script", input.script, 65536);
  // Actions requested by the script.
  const actions: Action[] = [];
  // A private copy of the sample (HTTP::uri can change it).
  const sample = { ...(input.sample ?? DEFAULT_SAMPLE), headers: { ...(input.sample ?? DEFAULT_SAMPLE).headers } };
  // Run.
  const r = runScript(input.script, { mode: input.mode, maxSteps: 2000, commands: input.mode === "irules" ? irulesCommands(sample, input.groups ?? {}, actions) : {} });
  // Flatten the events (expression traces become plain JSON).
  const events: StepEvent[] = r.events.map((e) => ({ depth: e.depth, line: e.line, source: e.source, words: e.words, result: e.result, error: e.error, changes: e.changes, notes: e.notes, exprs: e.exprs.map((x) => ({ text: x.text, tree: toTraceNode(x.text, x.trace) })) }));
  // The outcome.
  return { code: r.code, result: r.result, events, vars: Object.entries(r.vars).map(([name, value]) => ({ name, value })), logs: r.logs, actions };
}
