// ============================================================================
// src/lib/tools/f5-irules-expression-lab/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES EXPRESSION LAB: evaluate an expression the way `expr`, `if` and
// `while` do in an iRule, and see every step - how each operand was read, which
// operator ran, whether a comparison was numeric or a string comparison, where
// && and || stopped early, and where an error came from.
//
// The variables are set with ordinary `set` commands (a small Tcl script run
// first), so quoting works exactly as it does in an iRule. In iRules mode the
// expression may also use F5's operators (contains, starts_with, ends_with,
// equals, matches_glob, matches_regex, and, or, not) and request commands
// such as [HTTP::uri], answered from a sample request.
//
// Engine: src/lib/tcl84 (parse -> compile check -> evaluate), checked against a
// real Tcl 8.4.6 interpreter. F5's operators are modelled from F5's pages; F5
// does not document their precedence, and the trace says so.
// ============================================================================

import { runExpr } from "@/lib/tcl84/expr";
import { toTraceNode, grouping, type TraceNode } from "@/lib/tcl84/trace";
import { Interp, type LogLine } from "@/lib/tcl84/interp";
import { irulesCommands, type SampleRequest, type Action } from "@/lib/tcl84/irules";
import { TclObj, errorMessage, limitInput } from "@/lib/tcl84/value";
import { peek } from "@/lib/tcl84/expr";
import { areMatch } from "@/lib/tcl84/are";

/** The input. */
export interface ExpressionLabInput {
  // The expression, as written between the braces of expr { ... }.
  expression: string;
  // A small script of `set` commands that gives variables their values.
  setup: string;
  // "tcl" (plain Tcl 8.4.6) or "irules" (adds F5's operators and commands).
  mode: "tcl" | "irules";
  // The request iRules commands read (iRules mode).
  sample?: SampleRequest;
}

/** One node of the evaluation, flattened for display (shared with the script stepper). */
export type LabNode = TraceNode;

/** == and eq side by side, for a top-level comparison. */
export interface ComparisonView {
  // The left operand's source.
  left: string;
  // The right operand's source.
  right: string;
  // Results with each operator family (or Tcl's error).
  results: { op: string; ok: boolean; result: string }[];
}

/** The lab's answer. */
export interface ExpressionLabResult {
  // True when the expression evaluated.
  ok: boolean;
  // The result, as Tcl prints it.
  value?: string;
  // How the result is held.
  held?: string;
  // The error message (Tcl's wording).
  error?: string;
  // Where it failed: setup (the set script), parse, compile or run.
  stage?: "setup" | "parse" | "compile" | "run";
  // Offset of a parse or compile error in the expression.
  errorPos?: number;
  // The evaluation trace.
  tree?: LabNode;
  // The expression fully parenthesised, showing how precedence grouped it.
  grouping?: string;
  // The variables after the setup script.
  vars: { name: string; value: string }[];
  // For a top-level comparison: the other operator family on the same operands.
  comparison?: ComparisonView;
  // Lines written by log (commands run inside the expression).
  logs: LogLine[];
  // Actions requested by commands inside the expression.
  actions: Action[];
}

// The grouping helper is part of this tool's public surface.
export { grouping };

/** A neutral sample request, used when none is given. */
export const DEFAULT_SAMPLE: SampleRequest = { uri: "/login.php?user=abc", host: "www.example.com", method: "GET", headers: { "User-Agent": "curl/8.0" }, clientAddr: "192.0.2.10" };

/** Build an interpreter with the setup script run and the mode's commands. */
function prepare(input: ExpressionLabInput, actions: Action[]): { it: Interp; error?: string } {
  // iRules commands answer from the sample request.
  const sample = { ...(input.sample ?? DEFAULT_SAMPLE) };
  // The interpreter.
  const it = new Interp({ mode: input.mode, commands: input.mode === "irules" ? irulesCommands(sample, {}, actions) : {}, maxSteps: 2000 });
  // Run the setup script.
  try { it.evalDirect(input.setup ?? "", 0); } catch (e) { return { it, error: errorMessage(e) }; }
  // Ready.
  return { it };
}

/** Evaluate one expression text in a prepared interpreter. */
function evaluate(it: Interp, text: string, mode: "tcl" | "irules") {
  // The expression engine with this interpreter's variables and commands.
  return runExpr(text, { mode, getVar: (n) => it.getVar(n), runCommand: (s) => it.evalDirect(s, 1), regexMatch: areMatch });
}

/** Run the lab. */
export function run(input: ExpressionLabInput): ExpressionLabResult {
  // Bounded inputs.
  limitInput("The expression", input.expression, 10000);
  // The setup script too.
  limitInput("The setup script", input.setup, 20000);
  // Actions recorded by commands.
  const actions: Action[] = [];
  // Set up the variables.
  const { it, error } = prepare(input, actions);
  // The variables after setup.
  const vars = [...it.vars.entries()].map(([name, v]) => ({ name, value: v.string }));
  // A failing setup script.
  if (error !== undefined) return { ok: false, error, stage: "setup", vars, logs: it.logs, actions };
  // Evaluate.
  const r = evaluate(it, input.expression, input.mode);
  // The trace (present even when evaluation failed part-way).
  const tree = r.stage === "parse" || r.stage === "compile" ? undefined : toTraceNode(input.expression, r.trace);
  // The result shell.
  const out: ExpressionLabResult = { ok: r.error === undefined, vars, logs: it.logs, actions, tree };
  // Grouping is known once the expression parsed.
  if (r.stage !== "parse") out.grouping = grouping(input.expression, r.tree);
  // Failure.
  if (r.error !== undefined) {
    // The message and stage.
    out.error = r.error;
    // Which stage.
    out.stage = r.stage;
    // Where.
    out.errorPos = r.errorPos;
  } else {
    // The value.
    out.value = peek(r.value as TclObj);
    // How it is held.
    out.held = r.value!.type === "none" ? "string" : r.value!.type;
  }
  // A top-level comparison gets the == / eq side-by-side view.
  if (r.stage !== "parse") {
    // Unwrap parentheses.
    let top = r.tree;
    // Down to the first real node.
    while (top.t === "paren") top = top.e;
    // Comparison operators.
    if (top.t === "bin" && ["==", "!=", "eq", "ne", "<", ">", "<=", ">=", "equals"].includes(top.op)) {
      // The operand sources.
      const left = input.expression.slice(top.l.start, top.l.end), right = input.expression.slice(top.r.start, top.r.end);
      // The operators to compare.
      const ops = ["==", "eq", "<", ">"];
      // Evaluate each in a fresh interpreter (no cached conversions carried over).
      const results = ops.map((op) => {
        // A fresh setup.
        const p = prepare(input, []);
        // Evaluate.
        const e = evaluate(p.it, `${left} ${op} ${right}`, input.mode);
        // The outcome.
        return e.error !== undefined ? { op, ok: false, result: e.error } : { op, ok: true, result: peek(e.value!) };
      });
      // Attach.
      out.comparison = { left, right, results };
    }
  }
  // Done.
  return out;
}
