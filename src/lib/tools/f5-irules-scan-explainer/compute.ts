// ============================================================================
// src/lib/tools/f5-irules-scan-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES scan EXPLAINER: give a value and a scan format, and see each
// format directive line up against the characters it consumed, the value it
// produced, which variable received it, and the exact reason scanning stopped.
//
// `scan` is the cheap way to take a value apart in an iRule (F5's matches_regex
// reference says a string command is more efficient than a regular expression,
// and that most cases can use string match or scan). Its rules are short but sharp:
// %d skips leading space and reads decimal; %i lets a leading 0 mean octal; %s
// stops at white space; %[^:] reads up to a colon; the result counts the
// variables that were assigned, or is -1 when the input ran out first.
//
// Engine: src/lib/tcl84/scan.ts (Tcl_ScanObjCmd of Tcl 8.4.6), checked against
// a real Tcl 8.4.6 interpreter.
// ============================================================================

import { runScan, type ScanDirective, type ScanStep } from "@/lib/tcl84/scan";
import { parseList, formatElement } from "@/lib/tcl84/list";
import { errorMessage, limitInput } from "@/lib/tcl84/value";

/** The input. */
export interface ScanExplainerInput {
  // The value to take apart.
  input: string;
  // The scan format.
  format: string;
  // Variable names, separated by spaces (empty: inline mode, scan returns a list).
  vars: string;
}

/** One directive, described for display. */
export interface DirectiveView {
  // The directive as written in the format.
  text: string;
  // "space", "literal" or "conv".
  kind: "space" | "literal" | "conv";
  // The conversion letter.
  conv?: string;
  // True for %*.
  suppress?: boolean;
  // The field width (0: none).
  width?: number;
  // The XPG position (%2$d).
  xpg?: number;
  // The variable slot it fills (0-based).
  slot?: number;
  // For %[...]: the set, written out.
  set?: string;
}

/** One step: a directive against the input. */
export interface StepView {
  // Which directive (index into directives).
  directive: number;
  // Input offsets: before, start of the value, after.
  inputStart: number;
  // Where the value text started.
  valueStart: number;
  // Just past what was consumed.
  inputEnd: number;
  // The characters consumed for the value.
  consumed: string;
  // What happened.
  outcome: ScanStep["outcome"];
  // The value produced.
  value?: string;
  // The variable it went to.
  variable?: string;
  // For numbers: the digits handed to the C conversion.
  digits?: string;
  // For integers: the base used.
  base?: number;
  // True when the integer is outside 32 bits (platform-dependent in Tcl 8.4).
  platformDependent?: boolean;
}

/** The explainer's answer. */
export interface ScanExplainerResult {
  // True when the format was valid and scan ran.
  ok: boolean;
  // Tcl's error message (bad format, variable count mismatch).
  error?: string;
  // The command's result: a count (with variables) or a list (inline).
  result?: string;
  // The paste-ready command.
  command: string;
  // The directives.
  directives: DirectiveView[];
  // The steps, in order, until scanning stopped.
  steps: StepView[];
  // Each variable and what it received (null: not assigned).
  assignments: { name: string; value: string | null }[];
  // Why scanning ended: "format-end", "mismatch", "no-chars" or "input-end".
  stopped?: "format-end" | "mismatch" | "no-chars" | "input-end";
  // Notes (codes).
  notes: string[];
}

/** Describe a %[...] set compactly. */
function describeSet(d: ScanDirective): string | undefined {
  // Only sets.
  if (!d.set) return undefined;
  // Characters and ranges.
  const parts = [...d.set.chars.map((c) => JSON.stringify(c)), ...d.set.ranges.map(([a, b]) => `${JSON.stringify(a)}-${JSON.stringify(b)}`)];
  // Negation.
  return (d.set.exclude ? "not " : "") + parts.join(", ");
}

/** Run the explainer. */
export function run(input: ScanExplainerInput): ScanExplainerResult {
  // Bounded inputs.
  limitInput("The value", input.input, 20000);
  // The format.
  limitInput("The format", input.format, 2000);
  // The variable names.
  limitInput("The variable names", input.vars, 2000);
  // The variable names (a Tcl list; plain space separation in practice).
  let names: string[];
  // Parse them.
  try { names = parseList(input.vars ?? ""); } catch { names = (input.vars ?? "").split(/\s+/).filter(Boolean); }
  // The paste-ready command.
  const command = ["scan", formatElement(input.input), formatElement(input.format), ...names.map(formatElement)].join(" ");
  // The result shell.
  const out: ScanExplainerResult = { ok: false, command, directives: [], steps: [], assignments: names.map((name) => ({ name, value: null })), notes: [] };
  // Run scan.
  try {
    // The engine.
    const r = runScan(input.input, input.format, names.length);
    // The directives. Tcl matches literal text one character at a time; runs of
    // literal characters ("user=") are shown as ONE directive so the line-up reads
    // like the format does. viewOf maps each engine directive to its shown one.
    const viewOf: number[] = [];
    // Build the shown directives.
    for (let k = 0; k < r.directives.length; k++) {
      // The engine's directive.
      const d = r.directives[k];
      // The previous shown directive.
      const prev = out.directives[out.directives.length - 1];
      // A literal right after a literal joins it.
      if (d.kind === "literal" && prev && prev.kind === "literal" && k > 0 && r.directives[k - 1].kind === "literal") {
        // Extend the text.
        prev.text += d.text;
        // Same shown directive.
        viewOf.push(out.directives.length - 1);
        // Next.
        continue;
      }
      // A new shown directive.
      out.directives.push({ text: d.text, kind: d.kind, conv: d.conv, suppress: d.suppress, width: d.width, xpg: d.xpg, slot: d.slot, set: describeSet(d) });
      // Map it.
      viewOf.push(out.directives.length - 1);
    }
    // The steps, merged the same way (a literal run is one step).
    for (const s of r.steps) {
      // Which shown directive.
      const view = viewOf[r.directives.indexOf(s.directive)];
      // The previous shown step.
      const last = out.steps[out.steps.length - 1];
      // Part of the same literal run: extend it.
      if (s.directive.kind === "literal" && last && last.directive === view) {
        // It now ends where this character ended.
        last.inputEnd = s.inputEnd;
        // The characters it covered.
        last.consumed = input.input.slice(last.valueStart, s.inputEnd);
        // A mismatch or the end of the input decides the run's outcome.
        last.outcome = s.outcome;
        // Next.
        continue;
      }
      // A new shown step.
      out.steps.push({ directive: view, inputStart: s.inputStart, valueStart: s.valueStart, inputEnd: s.inputEnd, consumed: input.input.slice(s.valueStart, s.inputEnd), outcome: s.outcome, value: s.value, variable: s.slot !== undefined ? names[s.slot] ?? `#${s.slot + 1}` : undefined, digits: s.digits, base: s.base, platformDependent: s.platformDependent });
    }
    // The assignments.
    out.assignments = names.map((name, k) => ({ name, value: r.values[k] ?? null }));
    // The result.
    out.result = r.result;
    // Why it stopped.
    const last = r.steps[r.steps.length - 1];
    // No steps, or every directive ran.
    if (!last || (r.steps.length === r.directives.length && (last.outcome === "matched" || last.outcome === "assigned" || last.outcome === "suppressed"))) out.stopped = "format-end";
    // The input ran out.
    else if (last.outcome === "out-of-input") out.stopped = "input-end";
    // A literal or a number did not match.
    else if (last.outcome === "stopped") out.stopped = last.directive.conv === "[" ? "no-chars" : "mismatch";
    // Otherwise the format ended.
    else out.stopped = "format-end";
    // -1: the input ran out before the first conversion.
    if (r.underflowBeforeAny) out.notes.push("minus-one");
    // %n counts bytes.
    if (r.directives.some((d) => d.conv === "n") && /[^\x01-\x7f]/.test(input.input)) out.notes.push("n-bytes");
    // %i reads a leading zero as octal.
    if (r.directives.some((d) => d.conv === "i")) out.notes.push("i-prefix");
    // Platform-dependent integers.
    if (out.steps.some((s) => s.platformDependent)) out.notes.push("int32");
    // Inline mode.
    if (names.length === 0) out.notes.push("inline");
    // Success.
    out.ok = true;
  } catch (e) {
    // Tcl's message for a bad format or variable mismatch.
    out.error = errorMessage(e);
  }
  // Done.
  return out;
}
