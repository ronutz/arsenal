// ============================================================================
// src/lib/tools/f5-irules-string-extract/compute.ts
// ----------------------------------------------------------------------------
// findstr, substr AND getfield, SHOWN ON THE STRING: the three iRules commands
// F5 added for cutting pieces out of a value, run on your input with the
// match, the skipped characters, the terminator and the result marked on a
// ruler - plus the plain Tcl that does the same job, run through the same
// engine so you can see whether it really agrees.
//
// F5 publishes reference pages for these commands but not every case. Each
// case the pages do not cover (findstr when the search string is absent, a
// skip past the end, a zero count, a getfield field number out of range, ...)
// is flagged in the result with the assumption the tool made, so you know to
// check it on a BIG-IP before relying on it.
// ============================================================================

import { Interp, getInt32, type TraceEvent } from "@/lib/tcl84/interp";
import { irulesCommands, type Action } from "@/lib/tcl84/irules";
import { formatElement } from "@/lib/tcl84/list";
import { TclObj, TclError, errorMessage, limitInput } from "@/lib/tcl84/value";

/** The command being explained. */
export type ExtractCommand = "findstr" | "substr" | "getfield";

/** The input. */
export interface StringExtractInput {
  // Which command.
  command: ExtractCommand;
  // The string to cut from.
  string: string;
  // The command's other arguments, in order:
  //   findstr: search_string ?skip_count? ?terminator?
  //   substr:  skip_count ?terminator?
  //   getfield: split field_number
  args: string[];
}

/** A marked region of the string. */
export interface Segment {
  // First character (inclusive).
  from: number;
  // Last character (inclusive).
  to: number;
  // What it is.
  role: "match" | "skipped" | "result" | "terminator" | "separator" | "field";
}

/** The answer. */
export interface StringExtractResult {
  // True when the command ran.
  ok: boolean;
  // The result.
  result?: string;
  // The error message.
  error?: string;
  // The paste-ready iRule command.
  command: string;
  // Regions to mark on the string.
  segments: Segment[];
  // Notes, including "undocumented-*" codes with the assumption made.
  notes: { code: string; params?: Record<string, string | number | boolean> }[];
  // The plain-Tcl equivalent and what it gives (absent when there is no faithful one).
  equivalent?: { script: string; result?: string; error?: string; agrees: boolean };
}

/** Run one script in a plain Tcl interpreter (no iRules commands). */
function runTcl(script: string): { result?: string; error?: string } {
  // A fresh interpreter.
  const it = new Interp({ mode: "tcl", maxSteps: 200 });
  // Run.
  try { return { result: it.evalDirect(script, 0).string }; } catch (e) { return { error: errorMessage(e) }; }
}

/** The integer a word reads as (Tcl_GetIntFromObj), or null when it is not one. */
function intOf(text: string): number | null {
  // Tcl's integer reading of a fresh value.
  try { return getInt32(TclObj.fromString(text)); } catch { return null; }
}

/** True when a word reads as an integer (how a count terminator is told apart from text). */
function isInt(text: string): boolean {
  // An integer reading exists.
  return intOf(text) !== null;
}

/** Run the explainer. */
export function run(input: StringExtractInput): StringExtractResult {
  // Bounded inputs: the string, and at most four short arguments.
  limitInput("The string", input.string, 20000);
  // The argument count.
  if ((input.args ?? []).length > 4) throw new TclError("this tool takes at most four arguments after the string");
  // Each argument.
  for (const x of input.args ?? []) limitInput("An argument", x, 2000);
  // The words.
  const s = input.string, a = input.args;
  // The paste-ready command.
  const command = [input.command, ...[s, ...a].map(formatElement)].join(" ");
  // The result shell.
  const out: StringExtractResult = { ok: false, command, segments: [], notes: [] };
  // Run the iRules command in the emulation.
  const actions: Action[] = [];
  // An interpreter with the iRules commands.
  const it = new Interp({ mode: "irules", maxSteps: 50, commands: irulesCommands({ uri: "/", host: "", method: "GET", headers: {}, clientAddr: "" }, {}, actions) });
  // Run it.
  try {
    // The result.
    out.result = it.evalDirect(command, 0).string;
    // Success.
    out.ok = true;
  } catch (e) {
    // The message.
    out.error = errorMessage(e);
  }
  // The notes the command recorded.
  const ev: TraceEvent | undefined = it.events[0];
  // Copy them.
  if (ev) out.notes = ev.notes;
  // Nothing to mark on failure.
  if (!out.ok) return out;
  // Mark the regions, by command.
  if (input.command === "findstr") {
    // The match.
    const at = a[0] === "" ? -1 : s.indexOf(a[0]);
    // Found.
    if (at >= 0) {
      // The match itself.
      out.segments.push({ from: at, to: at + a[0].length - 1, role: "match" });
      // The skip count.
      const skip = a[1] !== undefined ? Math.max(0, intOf(a[1]) ?? 0) : 0;
      // Where the result starts.
      const start = at + skip;
      // Skipped characters (counted from the start of the match).
      if (skip > 0) out.segments.push({ from: at, to: Math.min(s.length, start) - 1, role: "skipped" });
      // The result.
      if (out.result !== "" && start < s.length) out.segments.push({ from: start, to: start + out.result!.length - 1, role: "result" });
      // A terminating string, when found.
      if (a[2] !== undefined && !isInt(a[2]) && a[2] !== "") { const t = s.indexOf(a[2], start); if (t >= 0) out.segments.push({ from: t, to: t + a[2].length - 1, role: "terminator" }); }
      // The plain-Tcl equivalent F5 gives (only for the two-argument form).
      if (a.length === 1) {
        // F5's stated equivalent.
        const script = `string range ${formatElement(s)} [string first ${formatElement(a[0])} ${formatElement(s)}] end`;
        // Run it.
        const r = runTcl(script);
        // Compare.
        out.equivalent = { script, ...r, agrees: r.result === out.result };
      }
    } else if (a.length === 1) {
      // F5's equivalent differs when the search string is absent.
      const script = `string range ${formatElement(s)} [string first ${formatElement(a[0])} ${formatElement(s)}] end`;
      // Run it.
      const r = runTcl(script);
      // Show the disagreement.
      out.equivalent = { script, ...r, agrees: r.result === out.result };
    }
  } else if (input.command === "substr") {
    // The skip count.
    const skip = Math.max(0, intOf(a[0] ?? "") ?? 0);
    // Skipped characters.
    if (skip > 0) out.segments.push({ from: 0, to: Math.min(s.length, skip) - 1, role: "skipped" });
    // The result.
    if (out.result !== "" && skip < s.length) out.segments.push({ from: skip, to: skip + out.result!.length - 1, role: "result" });
    // A terminating string, when found.
    if (a[1] !== undefined && !isInt(a[1]) && a[1] !== "") { const t = s.indexOf(a[1], skip); if (t >= 0) out.segments.push({ from: t, to: t + a[1].length - 1, role: "terminator" }); }
    // A plain-Tcl equivalent for the common forms.
    if (a[1] !== undefined && (intOf(a[1]) ?? 0) > 0) {
      // A count: a range of that length.
      const script = `string range ${formatElement(s)} ${skip} ${skip + (intOf(a[1]) as number) - 1}`;
      // Run it.
      const r = runTcl(script);
      // Compare.
      out.equivalent = { script, ...r, agrees: r.result === out.result };
    } else if (a[1] !== undefined && !isInt(a[1]) && a[1] !== "") {
      // A terminating string: search from the skip position.
      const script = `set s ${formatElement(s)}; set stop [string first ${formatElement(a[1])} $s ${skip}]; string range $s ${skip} [expr {$stop < 0 ? "end" : $stop - 1}]`;
      // Run it.
      const r = runTcl(script);
      // Compare.
      out.equivalent = { script, ...r, agrees: r.result === out.result };
    }
  } else {
    // getfield: mark separators and the chosen field.
    const sep = a[0] ?? "";
    // The field number.
    const field = intOf(a[1] ?? "") ?? 0;
    // Walk the string.
    if (sep !== "") {
      // Current field start.
      let from = 0, k = 1;
      // Each separator.
      for (let at = s.indexOf(sep); at >= 0; at = s.indexOf(sep, at + sep.length)) {
        // The chosen field.
        if (k === field && at > from) out.segments.push({ from, to: at - 1, role: "field" });
        // The separator.
        out.segments.push({ from: at, to: at + sep.length - 1, role: "separator" });
        // Next field.
        from = at + sep.length;
        // Count it.
        k++;
      }
      // The last field.
      if (k === field && s.length > from) out.segments.push({ from, to: s.length - 1, role: "field" });
      // A one-character separator has a plain-Tcl equivalent with split.
      if (sep.length === 1 && field >= 1) {
        // split + lindex (field numbers start at 1, list indices at 0).
        const script = `lindex [split ${formatElement(s)} ${formatElement(sep)}] ${field - 1}`;
        // Run it.
        const r = runTcl(script);
        // Compare.
        out.equivalent = { script, ...r, agrees: r.result === out.result };
      } else if (sep.length > 1) {
        // split treats EACH character as a separator: worth saying.
        out.notes.push({ code: "split-chars", params: { sep } });
      }
    }
  }
  // Done.
  return out;
}
