// ============================================================================
// src/lib/tcl84/interp.ts
// ----------------------------------------------------------------------------
// A SMALL TCL 8.4 INTERPRETER for the iRules teaching tools: enough of the
// language to run the snippets the tools explain (variables, string and list
// commands, expr, if, switch, while, for, foreach, catch) and to show each
// step: the command as written, its words after substitution, its result,
// and every variable it changed.
//
// How it runs, and why:
//   * The top level runs ONE COMMAND AT A TIME, as tclsh runs a script: a
//     syntax error in the fifth command is reported after the first four ran.
//   * A BODY (of if, while, for, foreach, switch or catch) is COMPILED as a
//     whole before it runs, as Tcl 8.4 compiles it: a syntax error, an
//     expression that cannot compile, or a wrong argument count anywhere in
//     the body stops it before its first command.
//   * Values are Tcl_Obj-like (value.ts): numbers keep their internal form,
//     so results print the way Tcl prints them.
//
// Out of scope, and refused with a clear message rather than guessed: arrays
// ($a(x)), procedures, namespaces beyond plain names, uplevel/upvar, regexp
// and regsub, format, string is, and anything that touches files, sockets or
// time. iRules-only commands (log, findstr, substr, getfield, class match,
// HTTP::*, IP::*) are emulated from F5's documentation, in irules.ts.
//
// Every behaviour here was checked against a Tcl 8.4.6 interpreter.
// ============================================================================

import { parseScript, parseScriptPartial, isSimpleWord, literalText, TclParseError, type Command, type Word } from "./parse";
import { compileCheck, parseExpr, runExpr, evalExpr, type ExprMode, type Step } from "./expr";
import { TclError, TclObj, getInt, getBoolean, truncBytes, MAX_VALUE_CHARS, tooLarge, errorMessage } from "./value";
import { formatList, parseList } from "./list";
import { readIndex } from "./index";
import { strByteLength, strCase, strCompare, strFirst, strIndex, strLast, strMap, strMatch, strRange, assertBmp } from "./strings";
import { runScan } from "./scan";
import { globMatch } from "./glob";
import { isCSpace } from "./numbers";
import { areMatch } from "./are";

/** A completed command's return code (TCL_OK ... TCL_CONTINUE). */
export type Code = "ok" | "error" | "return" | "break" | "continue";

/** Non-local exits travel as exceptions carrying their code and value. */
export class TclControl {
  /** Build one. */
  constructor(readonly code: "return" | "break" | "continue", readonly value: TclObj) {}
}

/** A variable change made by one command. */
export interface VarChange {
  // The variable.
  name: string;
  // Its value before (null: did not exist).
  before: string | null;
  // Its value after (null: unset).
  after: string | null;
}

/** One executed command, for the step-by-step view. */
export interface TraceEvent {
  // Nesting depth (0 = top level, 1 = inside a body, ...).
  depth: number;
  // 1-based line in the script being run.
  line: number;
  // The command exactly as written.
  source: string;
  // The words after substitution (what the command actually received).
  words: string[];
  // The result, when it succeeded.
  result?: string;
  // The error, when it failed.
  error?: string;
  // Variables it changed.
  changes: VarChange[];
  // Teaching notes (codes the UI translates).
  notes: { code: string; params?: Record<string, string | number | boolean> }[];
  // For expr / if / while / for: each expression evaluated, with its text
  // (if/elseif evaluates several; a loop re-evaluates its test; at most 20 kept).
  exprs: { text: string; trace: Step }[];
}

/** A line written by `log` (iRules) or `puts` (tclsh). */
export interface LogLine {
  // The facility ("local0." etc.), or "stdout" for puts.
  facility: string;
  // The text.
  message: string;
}

/** Options for a run. */
export interface InterpOptions {
  // Plain Tcl 8.4.6 or iRules.
  mode: ExprMode;
  // Stop after this many commands (protects the page from endless loops).
  maxSteps?: number;
  // Regular-expression test for switch -regexp and matches_regex (unsupported when absent).
  regexMatch?: (subject: string, pattern: string) => boolean;
  // Extra commands (iRules emulation, sample request data).
  commands?: Record<string, CommandFn>;
  // Initial variables.
  vars?: Record<string, string>;
}

/** A command implementation: receives the words (name first) and returns the result. */
export type CommandFn = (it: Interp, args: TclObj[], ev: TraceEvent) => TclObj;

/** Tcl_WrongNumArgs wording. */
export function wrongArgs(prefix: string, usage?: string): TclError {
  // "wrong # args: should be "<prefix> <usage>"".
  return new TclError(`wrong # args: should be "${prefix}${usage ? " " + usage : ""}"`);
}

/** Tcl_GetIndexFromObj's error: bad/ambiguous option with the table listed. */
function badOption(kind: string, key: string, table: string[], ambiguous: boolean): TclError {
  // The listed choices: "a, b, or c" / "a or b".
  const list = table.length === 1 ? table[0] : table.length === 2 ? `${table[0]} or ${table[1]}` : `${table.slice(0, -1).join(", ")}, or ${table[table.length - 1]}`;
  // The message.
  return new TclError(`${ambiguous ? "ambiguous" : "bad"} ${kind} "${key}": must be ${list}`);
}

/** Tcl_GetIndexFromObj: exact match, or a unique prefix. */
export function getIndex(key: string, table: string[], kind = "option"): number {
  // Exact match first.
  const exact = table.indexOf(key);
  // Found exactly.
  if (exact >= 0) return exact;
  // Unique abbreviations (an empty key abbreviates everything).
  const hits = table.map((t, i) => (t.startsWith(key) ? i : -1)).filter((i) => i >= 0);
  // Exactly one: accepted.
  if (hits.length === 1) return hits[0];
  // Otherwise an error.
  throw badOption(kind, key, table, hits.length > 1);
}

/** Tcl_GetIntFromObj with Tcl's message, as a JavaScript number (32-bit int). */
export function getInt32(o: TclObj): number {
  // Read the integer (64-bit path).
  const v = getInt(o);
  // An int must fit 32 bits.
  if (v > 2147483647n || v < -2147483648n) throw new TclError("integer value too large to represent");
  // The int.
  return Number(v);
}

/** Tcl_ConcatObj's string path: trim each argument, drop empty ones, join with spaces. */
export function concatStrings(parts: string[]): string {
  // The kept, trimmed pieces.
  const kept: string[] = [];
  // Each argument.
  for (const p of parts) {
    // Start and end of the kept part.
    let a = 0, b = p.length;
    // Leading ASCII white space.
    while (a < b && p.charCodeAt(a) < 127 && isCSpace(p[a])) a++;
    // Trailing ASCII white space, unless backslash-escaped.
    while (b > a && p.charCodeAt(b - 1) < 127 && isCSpace(p[b - 1]) && (b - a < 2 || p[b - 2] !== "\\")) b--;
    // Keep non-empty pieces.
    if (b > a) kept.push(p.slice(a, b));
  }
  // Joined with single spaces.
  return kept.join(" ");
}

/** The interpreter. */
export class Interp {
  /** Variables (global scope only). */
  readonly vars = new Map<string, TclObj>();
  /** Lines written by log / puts. */
  readonly logs: LogLine[] = [];
  /** Executed commands, in order. */
  readonly events: TraceEvent[] = [];
  /** Options. */
  readonly opts: InterpOptions;
  /** Commands run so far. */
  steps = 0;
  /** The command table. */
  readonly cmds: Record<string, CommandFn>;

  /** Create an interpreter. */
  constructor(opts: InterpOptions) {
    // Keep the options.
    this.opts = opts;
    // Built-in commands plus any extras.
    this.cmds = { ...BUILTINS, ...(opts.commands ?? {}) };
    // Initial variables.
    for (const [k, v] of Object.entries(opts.vars ?? {})) this.vars.set(k, TclObj.fromString(v));
  }

  /** A variable's name as stored (a leading "::" means global, which is all there is here). */
  varKey(name: string): string {
    // Arrays are not modelled.
    if (/\(.*\)$/.test(name)) throw new TclError(`array variables ("${name}") are not modelled by this tool`);
    // Strip the global qualifier.
    return name.startsWith("::") ? name.replace(/^:+/, "") : name;
  }

  /** Read a variable (Tcl's message when it does not exist). */
  getVar(name: string): TclObj {
    // Look it up.
    const v = this.vars.get(this.varKey(name));
    // Missing.
    if (!v) throw new TclError(`can't read "${name}": no such variable`);
    // The value object.
    return v;
  }

  /** Set a variable, recording the change on the event. */
  setVar(name: string, value: TclObj, ev?: TraceEvent): TclObj {
    // Values past the tool's size limit are refused.
    if (value.string.length > MAX_VALUE_CHARS) throw tooLarge();
    // The stored key.
    const key = this.varKey(name);
    // The value before.
    const before = this.vars.get(key);
    // Store.
    this.vars.set(key, value);
    // Record the change (the printed form, generated on demand).
    if (ev) ev.changes.push({ name, before: before ? before.string : null, after: value.string });
    // The new value.
    return value;
  }

  /** Remove a variable. */
  unsetVar(name: string, ev?: TraceEvent): boolean {
    // The stored key.
    const key = this.varKey(name);
    // The value before.
    const before = this.vars.get(key);
    // Missing.
    if (!before) return false;
    // Remove it.
    this.vars.delete(key);
    // Record it.
    if (ev) ev.changes.push({ name, before: before.string, after: null });
    // Done.
    return true;
  }

  /** Substitute one word into its value. */
  substWord(w: Word, depth: number): TclObj {
    // Braced words are literal.
    if (w.kind === "braced") return TclObj.fromString(literalText(w));
    // A single variable or command is that value itself.
    if (w.parts.length === 1 && w.parts[0].kind !== "text") {
      // The part.
      const p = w.parts[0];
      // A variable.
      if (p.kind === "var") return this.getVar(p.name);
      // A command.
      return this.evalNested(p.script, depth);
    }
    // Otherwise concatenate the parts in order.
    let s = "";
    // Each part.
    for (const p of w.parts) {
      // Add the part's text.
      s += p.kind === "text" ? p.text : p.kind === "var" ? this.getVar(p.name).string : this.evalNested(p.script, depth).string;
      // Stop a word that grows past the tool's size limit.
      if (s.length > MAX_VALUE_CHARS) throw tooLarge();
    }
    // A fresh string.
    return TclObj.fromString(s);
  }

  /** Evaluate a [command] substitution. */
  evalNested(script: string, depth: number): TclObj {
    // Nested scripts run like the top level, one command at a time.
    return this.evalDirect(script, depth + 1);
  }

  /** Run a script one command at a time (the top level and [substitutions]). */
  evalDirect(script: string, depth: number): TclObj {
    // Characters beyond the BMP cannot be held as one character in Tcl 8.4.
    assertBmp(script);
    // Parse the commands before any syntax error.
    const { commands, error } = parseScriptPartial(script);
    // The result of the last command.
    let result = TclObj.fromString("");
    // Run each.
    for (const c of commands) result = this.evalCommand(c, script, depth);
    // Then the syntax error, if there was one.
    if (error) throw new TclError(error.message);
    // The result.
    return result;
  }

  /** Run a body: compile-check it as a whole, then run its commands. */
  evalBody(script: string, depth: number): TclObj {
    // Characters beyond the BMP cannot be held as one character in Tcl 8.4.
    assertBmp(script);
    // Parse all of it (a syntax error anywhere stops it before it starts).
    let commands: Command[];
    // Tcl's wording.
    try { commands = parseScript(script); } catch (e) { throw new TclError((e as Error).message); }
    // Compile-time checks, in Tcl's order.
    checkCommands(commands, this.opts.mode);
    // The result of the last command.
    let result = TclObj.fromString("");
    // Run each.
    for (const c of commands) result = this.evalCommand(c, script, depth);
    // The result.
    return result;
  }

  /** Run one parsed command. */
  evalCommand(c: Command, script: string, depth: number): TclObj {
    // Count it, and stop runaway loops.
    if (++this.steps > (this.opts.maxSteps ?? 5000)) throw new TclError(`this tool stops after ${this.opts.maxSteps ?? 5000} commands (a loop that never ends?)`);
    // Nesting has a limit too. Tcl's own limit is 1000 with this message; the
    // teaching interpreter stops at 200, well inside the browser's call stack.
    if (depth > 200) throw new TclError("too many nested evaluations (infinite loop?)");
    // The event for the trace.
    const ev: TraceEvent = { depth, line: c.line, source: script.slice(c.start, c.end), words: [], changes: [], notes: [], exprs: [] };
    // Record it now so nested commands appear after it.
    this.events.push(ev);
    // Substitute the words, left to right.
    const args: TclObj[] = [];
    // Errors during substitution belong to this command.
    try {
      // Each word.
      for (const w of c.words) args.push(this.substWord(w, depth));
      // All the words together are bounded too (concat, join and list add them up).
      if (args.reduce((n, a) => n + a.string.length, 0) > 4 * MAX_VALUE_CHARS) throw tooLarge();
      // The printed words (shortened for display).
      ev.words = args.map((a) => (a.string.length > 300 ? a.string.slice(0, 300) + "…" : a.string));
      // The command name.
      const name = args[0].string.replace(/^::/, "");
      // Look it up.
      const fn = this.cmds[name];
      // Unknown commands.
      if (!fn) throw new TclError(`invalid command name "${args[0].string}"`);
      // Run it.
      const r = fn(this, args, ev);
      // A result past the tool's size limit is refused.
      if (r.string.length > MAX_VALUE_CHARS) throw tooLarge();
      // Record the result.
      ev.result = r.string;
      // Done.
      return r;
    } catch (e) {
      // Control flow passes through unrecorded.
      if (e instanceof TclControl) throw e;
      // Record the error once (the innermost command keeps it).
      if (ev.error === undefined) ev.error = errorMessage(e);
      // Propagate.
      throw e;
    }
  }

  /** Tcl_ExprObj: compile and evaluate an expression, recording its trace. */
  expr(text: string, ev: TraceEvent, depth: number): TclObj {
    // Parse and compile-check (errors carry Tcl's wording).
    const r = runExpr(text, { mode: this.opts.mode, getVar: (n) => this.getVar(n), runCommand: (s) => this.evalNested(s, depth), regexMatch: this.opts.regexMatch ?? areMatch });
    // Keep the trace (bounded, so a long loop does not grow without limit).
    if (ev.exprs.length < 20) ev.exprs.push({ text, trace: r.trace });
    // Failure.
    if (r.error !== undefined) throw new TclError(r.error);
    // The value.
    return r.value!;
  }

  /** Tcl_ExprBooleanObj: an expression's truth (if, while, for). */
  exprBoolean(text: string, ev: TraceEvent, depth: number): boolean {
    // The value.
    const v = this.expr(text, ev, depth);
    // Integers and doubles directly.
    if (v.type === "int") return v.int !== 0n;
    // A double.
    if (v.type === "double") return v.dbl !== 0;
    // Anything else through Tcl_GetBooleanFromObj (with its error message).
    return getBoolean(v) === 1;
  }
}

// ---------------------------------------------------------------------------
// COMPILE-TIME CHECKS (the compile procedures of tclCompCmds.c)
// ---------------------------------------------------------------------------

/** Check the [command] substitutions inside a word (they are compiled with it). */
function checkWordSubs(w: Word, mode: ExprMode): void {
  // Braced words have no substitutions.
  if (w.kind === "braced") return;
  // Each nested command is compiled as a nested script.
  for (const p of w.parts) if (p.kind === "cmd") checkCommands(parseScript(p.script), mode);
}

/** Compile-check a braced expression word. */
function checkExprWord(w: Word, mode: ExprMode): void {
  // Only simple words are compiled inline; others are compiled when they run.
  if (!isSimpleWord(w)) { checkWordSubs(w, mode); return; }
  // Parse and check the expression (errors are compile errors).
  const tree = parseExpr(literalText(w), mode);
  // Unknown functions and argument counts.
  compileCheck(tree);
}

/** Compile-check a body word. */
function checkBodyWord(w: Word, mode: ExprMode): void {
  // Only simple words are compiled inline.
  if (!isSimpleWord(w)) { checkWordSubs(w, mode); return; }
  // The body as a script: syntax, then its commands.
  let cmds: Command[];
  // Syntax errors.
  try { cmds = parseScript(literalText(w)); } catch (e) { throw new TclError((e as TclParseError).message); }
  // Its commands.
  checkCommands(cmds, mode);
}

/** The compile procedures' errors for a list of commands, in order. */
export function checkCommands(cmds: Command[], mode: ExprMode): void {
  // Each command in turn.
  for (const c of cmds) {
    // The name, when it is a simple word.
    const nameWord = c.words[0];
    // A computed command name is compiled as a generic call.
    const name = isSimpleWord(nameWord) ? literalText(nameWord) : null;
    // The number of words.
    const n = c.words.length;
    // The words after the name.
    const w = c.words;
    // Compile-procedure commands.
    switch (name) {
      // expr arg ?arg ...?
      case "expr":
        // No expression.
        if (n === 1) throw wrongArgs("expr", "arg ?arg ...?");
        // One simple word: compiled inline.
        if (n === 2) checkExprWord(w[1], mode);
        // Several words: substitutions are compiled.
        else w.slice(1).forEach((x) => checkWordSubs(x, mode));
        // Next command.
        continue;
      // set varName ?newValue?
      case "set":
        // Wrong count is a compile error.
        if (n !== 2 && n !== 3) throw wrongArgs("set", "varName ?newValue?");
        // The words' substitutions.
        w.slice(1).forEach((x) => checkWordSubs(x, mode));
        // Next.
        continue;
      // incr varName ?increment?
      case "incr":
        // Wrong count.
        if (n !== 2 && n !== 3) throw wrongArgs("incr", "varName ?increment?");
        // Substitutions.
        w.slice(1).forEach((x) => checkWordSubs(x, mode));
        // Next.
        continue;
      // append / lappend varName ?value ...?
      case "append": case "lappend":
        // No variable name.
        if (n === 1) throw wrongArgs(name, "varName ?value value ...?");
        // Substitutions.
        w.slice(1).forEach((x) => checkWordSubs(x, mode));
        // Next.
        continue;
      // llength list
      case "llength":
        // Exactly one argument.
        if (n !== 2) throw wrongArgs("llength", "list");
        // Substitutions.
        checkWordSubs(w[1], mode);
        // Next.
        continue;
      // break / continue
      case "break": case "continue":
        // No arguments allowed.
        if (n !== 1) throw wrongArgs(name);
        // Next.
        continue;
      // catch command ?varName? (a body that will not compile is caught at run time)
      case "catch":
        // Wrong count.
        if (n !== 2 && n !== 3) throw wrongArgs("catch", "command ?varName?");
        // Next.
        continue;
      // while test command
      case "while":
        // Wrong count.
        if (n !== 3) throw wrongArgs("while", "test command");
        // The test.
        checkExprWord(w[1], mode);
        // The body.
        checkBodyWord(w[2], mode);
        // Next.
        continue;
      // for start test next command
      case "for":
        // Wrong count.
        if (n !== 5) throw wrongArgs("for", "start test next command");
        // start, test, next, body in Tcl's compile order.
        checkBodyWord(w[1], mode);
        // The test.
        checkExprWord(w[2], mode);
        // The body.
        checkBodyWord(w[4], mode);
        // The next script.
        checkBodyWord(w[3], mode);
        // Next.
        continue;
      // foreach varList list ?varList list ...? command
      case "foreach":
        // Wrong count (an odd number of words, at least four).
        if (n < 4 || n % 2 !== 0) throw wrongArgs("foreach", "varList list ?varList list ...? command");
        // The lists' substitutions.
        w.slice(1, -1).forEach((x) => checkWordSubs(x, mode));
        // The body.
        checkBodyWord(w[n - 1], mode);
        // Next.
        continue;
      // if expr1 ?then? body1 elseif ... ?else? ?bodyN?
      case "if":
        // The clause structure, as TclCompileIfCmd reads it.
        checkIf(c, mode);
        // Next.
        continue;
      // Any other command: its words' substitutions are compiled.
      default:
        // Each word.
        w.forEach((x) => checkWordSubs(x, mode));
    }
  }
}

/** TclCompileIfCmd's checks. */
function checkIf(c: Command, mode: ExprMode): void {
  // The words.
  const w = c.words;
  // Position of the next clause.
  let i = 1;
  // Conditions and bodies.
  for (;;) {
    // A condition is required.
    if (i >= w.length) throw new TclError(`wrong # args: no expression after "${wordText(w[i - 1])}" argument`);
    // Compile it.
    checkExprWord(w[i], mode);
    // Then the body (an optional "then" first).
    i++;
    // No body.
    if (i >= w.length) throw new TclError(`wrong # args: no script following "${wordText(w[i - 1])}" argument`);
    // An optional "then".
    if (isSimpleWord(w[i]) && literalText(w[i]) === "then") {
      // Skip it.
      i++;
      // No body after "then".
      if (i >= w.length) throw new TclError('wrong # args: no script following "then" argument');
    }
    // Compile the body.
    checkBodyWord(w[i], mode);
    // Next clause.
    i++;
    // End of the command.
    if (i >= w.length) return;
    // elseif continues the loop.
    if (isSimpleWord(w[i]) && literalText(w[i]) === "elseif") { i++; continue; }
    // Otherwise an else part.
    break;
  }
  // An optional "else".
  if (isSimpleWord(w[i]) && literalText(w[i]) === "else") {
    // Skip it.
    i++;
    // A body is required.
    if (i >= w.length) throw new TclError('wrong # args: no script following "else" argument');
  }
  // The else body.
  checkBodyWord(w[i], mode);
  // Nothing may follow.
  if (i < w.length - 1) throw new TclError('wrong # args: extra words after "else" clause in "if" command');
}

/** A word's text for messages (literal text, or the raw source). */
function wordText(w: Word): string {
  // Simple words have plain text.
  return isSimpleWord(w) ? literalText(w) : w.raw;
}

// ---------------------------------------------------------------------------
// BUILT-IN COMMANDS
// ---------------------------------------------------------------------------

/** Shorthand for a string result. */
const S = (s: string) => TclObj.fromString(s);

/** Run a loop body, translating break/continue; returns "break" to stop. */
function runLoopBody(it: Interp, body: string, depth: number): "next" | "break" {
  // Run it.
  try { it.evalBody(body, depth + 1); } catch (e) {
    // break ends the loop.
    if (e instanceof TclControl && e.code === "break") return "break";
    // continue goes on.
    if (e instanceof TclControl && e.code === "continue") return "next";
    // Anything else propagates.
    throw e;
  }
  // Normal completion.
  return "next";
}

/** The built-in commands. */
const BUILTINS: Record<string, CommandFn> = {
  // set varName ?newValue?
  set(it, a, ev) {
    // Read.
    if (a.length === 2) return it.getVar(a[1].string);
    // Write.
    if (a.length === 3) return it.setVar(a[1].string, a[2], ev);
    // Wrong count.
    throw wrongArgs("set", "varName ?newValue?");
  },
  // unset ?-nocomplain? ?--? ?varName ...?
  unset(it, a, ev) {
    // Nothing to do.
    if (a.length === 1) return S("");
    // Options.
    let i = 1, complain = true;
    // -nocomplain first.
    if (a[i].string === "-nocomplain") { i++; if (i === a.length) return S(""); complain = false; }
    // Then --.
    if (a[i].string === "--") i++;
    // Each name.
    for (; i < a.length; i++) if (!it.unsetVar(a[i].string, ev) && complain) throw new TclError(`can't unset "${a[i].string}": no such variable`);
    // Empty result.
    return S("");
  },
  // append varName ?value value ...?
  append(it, a, ev) {
    // No variable.
    if (a.length < 2) throw wrongArgs("append", "varName ?value value ...?");
    // No values: just read.
    if (a.length === 2) return it.getVar(a[1].string);
    // The existing text, or nothing.
    const cur = it.vars.get(it.varKey(a[1].string));
    // Note when append creates the variable.
    if (!cur) ev.notes.push({ code: "append-creates" });
    // Refuse before building a value past the tool's size limit.
    if ((cur ? cur.string.length : 0) + a.slice(2).reduce((n, x) => n + x.string.length, 0) > MAX_VALUE_CHARS) throw tooLarge();
    // Concatenate.
    const text = (cur ? cur.string : "") + a.slice(2).map((x) => x.string).join("");
    // Store.
    return it.setVar(a[1].string, S(text), ev);
  },
  // lappend varName ?value value ...?
  lappend(it, a, ev) {
    // No variable.
    if (a.length < 2) throw wrongArgs("lappend", "varName ?value value ...?");
    // The existing value.
    const cur = it.vars.get(it.varKey(a[1].string));
    // No values: read, creating an empty variable if needed.
    if (a.length === 2) return cur ?? it.setVar(a[1].string, S(""), ev);
    // The existing elements (an error if it is not a list).
    const els = cur ? parseList(cur.string) : [];
    // Note when lappend creates the variable.
    if (!cur) ev.notes.push({ code: "lappend-creates" });
    // Append each value as one element; the list is rewritten canonically.
    return it.setVar(a[1].string, S(formatList([...els, ...a.slice(2).map((x) => x.string)])), ev);
  },
  // incr varName ?increment?
  incr(it, a, ev) {
    // Wrong count.
    if (a.length !== 2 && a.length !== 3) throw wrongArgs("incr", "varName ?increment?");
    // The increment is read first.
    const by = a.length === 3 ? getInt(a[2]) : 1n;
    // Then the variable.
    const cur = it.getVar(a[1].string);
    // Its integer value (Tcl's message when it is not one).
    const v = getInt(cur);
    // Note an octal or hex reading.
    if (/^\s*[+-]?0[0-7]/.test(cur.string)) ev.notes.push({ code: "incr-octal", params: { text: cur.string } });
    // C long arithmetic wraps.
    const r = BigInt.asIntN(64, v + by);
    // Store the new integer (printed canonically).
    return it.setVar(a[1].string, TclObj.fromInt(r), ev);
  },
  // concat ?arg ...?
  concat(_it, a, ev) {
    // Note the trimming rule.
    ev.notes.push({ code: "concat" });
    // Trim, drop empties, join.
    return S(concatStrings(a.slice(1).map((x) => x.string)));
  },
  // list ?arg ...?
  list(_it, a) {
    // A well-formed list.
    return S(formatList(a.slice(1).map((x) => x.string)));
  },
  // llength list
  llength(_it, a) {
    // Wrong count.
    if (a.length !== 2) throw wrongArgs("llength", "list");
    // Count the elements.
    return TclObj.fromInt(BigInt(parseList(a[1].string).length));
  },
  // lindex list ?index ...?
  lindex(_it, a) {
    // Wrong count.
    if (a.length < 2) throw wrongArgs("lindex", "list ?index...?");
    // No index: the list itself.
    if (a.length === 2) return a[1];
    // One argument is a single index when it reads as one; otherwise a list of
    // indices (Tcl 8.4, TIP 22); neither is reported as a bad index.
    let indices: string[];
    // Several index arguments.
    if (a.length > 3) indices = a.slice(2).map((x) => x.string);
    // One argument that reads as an index.
    else if ((() => { try { readIndex(a[2].string, 0); return true; } catch { return false; } })()) indices = [a[2].string];
    // A list of indices (or, if not even a list, the single bad index).
    else { try { indices = parseList(a[2].string); } catch { indices = [a[2].string]; } }
    // Walk into the list.
    let cur = a[1].string;
    // Each index.
    for (const ix of indices) {
      // The elements.
      const els = parseList(cur);
      // The position.
      const r = readIndex(ix, els.length - 1);
      // Out of range: empty.
      if (r.value < 0 || r.value >= els.length) return S("");
      // Descend.
      cur = els[r.value];
    }
    // The element.
    return S(cur);
  },
  // lrange list first last
  lrange(_it, a) {
    // Wrong count.
    if (a.length !== 4) throw wrongArgs("lrange", "list first last");
    // The elements.
    const els = parseList(a[1].string);
    // First, clamped below.
    const first = Math.max(0, readIndex(a[2].string, els.length - 1).value);
    // Last, clamped above.
    const last = Math.min(els.length - 1, readIndex(a[3].string, els.length - 1).value);
    // Empty range.
    if (first > last) return S("");
    // The sub-list, formatted canonically.
    return S(formatList(els.slice(first, last + 1)));
  },
  // join list ?joinString?
  join(_it, a) {
    // Wrong count.
    if (a.length !== 2 && a.length !== 3) throw wrongArgs("join", "list ?joinString?");
    // The separator.
    const sep = a.length === 3 ? a[2].string : " ";
    // Joined elements.
    return S(parseList(a[1].string).join(sep));
  },
  // split string ?splitChars?
  split(_it, a) {
    // Wrong count.
    if (a.length !== 2 && a.length !== 3) throw wrongArgs("split", "string ?splitChars?");
    // The characters to split on.
    const chars = a.length === 3 ? a[2].string : " \n\t\r";
    // The string.
    const s = a[1].string;
    // Empty string: empty list.
    if (s === "") return S("");
    // No split characters: every character is an element.
    if (chars === "") return S(formatList([...s]));
    // Elements found.
    const out: string[] = [];
    // Start of the current element.
    let start = 0;
    // Each character.
    for (let i = 0; i < s.length; i++) if (chars.includes(s[i])) { out.push(s.slice(start, i)); start = i + 1; }
    // The last element.
    out.push(s.slice(start));
    // The list.
    return S(formatList(out));
  },
  // expr arg ?arg ...?
  expr(it, a, ev) {
    // Wrong count.
    if (a.length < 2) throw wrongArgs("expr", "arg ?arg ...?");
    // Several arguments are joined with spaces (a second round of substitution follows).
    if (a.length > 2) ev.notes.push({ code: "expr-unbraced" });
    // Evaluate.
    return it.expr(a.length === 2 ? a[1].string : a.slice(1).map((x) => x.string).join(" "), ev, ev.depth);
  },
  // if expr1 ?then? body1 elseif expr2 ?then? body2 ... ?else? ?bodyN?
  if(it, a, ev) {
    // The body chosen so far (index into a).
    let chosen = 0;
    // Clause position.
    let i = 1;
    // Clauses.
    for (;;) {
      // A condition is required.
      if (i >= a.length) throw new TclError(`wrong # args: no expression after "${a[i - 1].string}" argument`);
      // Evaluate conditions only until one is true.
      let value = false;
      // Test it.
      if (!chosen) value = it.exprBoolean(a[i].string, ev, ev.depth);
      // Then the body.
      i++;
      // No body.
      if (i >= a.length) throw new TclError(`wrong # args: no script following "${a[i - 1].string}" argument`);
      // An optional "then".
      if (a[i].string === "then") i++;
      // No body after "then".
      if (i >= a.length) throw new TclError(`wrong # args: no script following "${a[i - 1].string}" argument`);
      // Remember the first true branch.
      if (value) { chosen = i; ev.notes.push({ code: "if-branch", params: { index: i } }); }
      // Next clause.
      i++;
      // End of the command.
      if (i >= a.length) {
        // Run the chosen body.
        if (chosen) return it.evalBody(a[chosen].string, ev.depth + 1);
        // No branch taken.
        ev.notes.push({ code: "if-none" });
        // Empty result.
        return S("");
      }
      // elseif.
      if (a[i].string === "elseif") { i++; continue; }
      // Otherwise the else part.
      break;
    }
    // An optional "else".
    if (a[i].string === "else") {
      // Skip it.
      i++;
      // A body is required.
      if (i >= a.length) throw new TclError('wrong # args: no script following "else" argument');
    }
    // Nothing may follow the else body.
    if (i < a.length - 1) throw new TclError('wrong # args: extra words after "else" clause in "if" command');
    // The chosen body, or the else body.
    if (!chosen) ev.notes.push({ code: "if-else" });
    // Run it.
    return it.evalBody(a[chosen || i].string, ev.depth + 1);
  },
  // switch ?switches? string pattern body ... ?default body?
  switch(it, a, ev) {
    // Options.
    const options = ["-exact", "-glob", "-regexp", "--"];
    // The matching mode.
    let mode = 0;
    // Position.
    let i = 1;
    // Every word starting with "-" is an option (the classic trap: a value like "-x").
    for (; i < a.length; i++) {
      // Not an option.
      if (a[i].string[0] !== "-") break;
      // Which one (prefixes allowed).
      const ix = getIndex(a[i].string, options);
      // "--" ends the options.
      if (ix === 3) { i++; break; }
      // The mode.
      mode = ix;
    }
    // At least a string and one pattern/body pair.
    if (a.length - i < 2) throw wrongArgs("switch", "?switches? string pattern body ... ?default body?");
    // The string being switched on.
    const str = a[i].string;
    // The pattern/body words.
    let pairs = a.slice(i + 1).map((x) => x.string);
    // One word: a list of pattern/body pairs.
    if (pairs.length === 1) {
      // Parse it.
      pairs = parseList(pairs[0]);
      // Empty list.
      if (pairs.length < 1) throw wrongArgs("switch", "?switches? string {pattern body ... ?default body?}");
      // Note the braced form.
      ev.notes.push({ code: "switch-list" });
    }
    // An odd count.
    if (pairs.length % 2) {
      // The base message.
      let msg = "extra switch pattern with no body";
      // A hint about comments in a braced switch body.
      if (a.length - i === 2 && pairs.some((p, k) => k % 2 === 0 && p[0] === "#")) msg += ', this may be due to a comment incorrectly placed outside of a switch body - see the "switch" documentation';
      // Raise it.
      throw new TclError(msg);
    }
    // The last body cannot be "-".
    if (pairs[pairs.length - 1] === "-") throw new TclError(`no body specified for pattern "${pairs[pairs.length - 2]}"`);
    // Try each pattern in order.
    for (let k = 0; k < pairs.length; k += 2) {
      // The pattern.
      const pat = pairs[k];
      // "default" only as the last pattern.
      let hit = k === pairs.length - 2 && pat === "default";
      // Otherwise compare by mode.
      if (!hit) {
        // Exact.
        if (mode === 0) hit = str === pat;
        // Glob.
        else if (mode === 1) hit = globMatch(pat, str);
        // Regular expression.
        else {
          // Tcl's regular expressions, the common subset (are.ts refuses the rest).
          hit = (it.opts.regexMatch ?? areMatch)(str, pat);
        }
      }
      // Not this one.
      if (!hit) continue;
      // Skip "-" bodies (fall through to the next body).
      let j = k + 1;
      // Find the body.
      while (pairs[j] === "-") j += 2;
      // Note the match.
      ev.notes.push({ code: "switch-match", params: { pattern: pat, mode: ["exact", "glob", "regexp"][mode], fallthrough: j !== k + 1 } });
      // Run it.
      return it.evalBody(pairs[j], ev.depth + 1);
    }
    // No match.
    ev.notes.push({ code: "switch-none" });
    // Empty result.
    return S("");
  },
  // while test command
  while(it, a, ev) {
    // Wrong count.
    if (a.length !== 3) throw wrongArgs("while", "test command");
    // Loop.
    for (;;) {
      // Test.
      if (!it.exprBoolean(a[1].string, ev, ev.depth)) break;
      // Body.
      if (runLoopBody(it, a[2].string, ev.depth) === "break") break;
    }
    // Empty result.
    return S("");
  },
  // for start test next command
  for(it, a, ev) {
    // Wrong count.
    if (a.length !== 5) throw wrongArgs("for", "start test next command");
    // Start.
    it.evalBody(a[1].string, ev.depth + 1);
    // Loop.
    for (;;) {
      // Test.
      if (!it.exprBoolean(a[2].string, ev, ev.depth)) break;
      // Body.
      if (runLoopBody(it, a[4].string, ev.depth) === "break") break;
      // Next.
      it.evalBody(a[3].string, ev.depth + 1);
    }
    // Empty result.
    return S("");
  },
  // foreach varList list ?varList list ...? command
  foreach(it, a, ev) {
    // Wrong count.
    if (a.length < 4 || a.length % 2 !== 0) throw wrongArgs("foreach", "varList list ?varList list ...? command");
    // The variable lists and value lists.
    const groups: { names: string[]; values: string[] }[] = [];
    // Read each pair.
    for (let i = 1; i < a.length - 1; i += 2) {
      // The variable names.
      const names = parseList(a[i].string);
      // At least one.
      if (names.length < 1) throw new TclError("foreach varlist is empty");
      // The values.
      groups.push({ names, values: parseList(a[i + 1].string) });
    }
    // Iterations: enough to consume the longest list.
    const iters = Math.max(...groups.map((g) => Math.ceil(g.values.length / g.names.length)));
    // Note how the list was read.
    ev.notes.push({ code: "foreach", params: { iterations: iters } });
    // Each iteration.
    for (let k = 0; k < iters; k++) {
      // Assign each variable (missing values are empty).
      for (const g of groups) g.names.forEach((n, j) => it.setVar(n, S(g.values[k * g.names.length + j] ?? ""), ev));
      // The body.
      if (runLoopBody(it, a[a.length - 1].string, ev.depth) === "break") break;
    }
    // Empty result.
    return S("");
  },
  // break
  break(_it, a) {
    // No arguments.
    if (a.length !== 1) throw wrongArgs("break");
    // Leave the loop.
    throw new TclControl("break", S(""));
  },
  // continue
  continue(_it, a) {
    // No arguments.
    if (a.length !== 1) throw wrongArgs("continue");
    // Next iteration.
    throw new TclControl("continue", S(""));
  },
  // return ?value?
  return(_it, a) {
    // Only the plain form is modelled.
    if (a.length > 2) throw new TclError("return with options is not modelled by this tool");
    // Leave with the value.
    throw new TclControl("return", a[1] ?? S(""));
  },
  // catch script ?varName?
  catch(it, a, ev) {
    // Wrong count.
    if (a.length !== 2 && a.length !== 3) throw wrongArgs("catch", "command ?varName?");
    // The return code and value.
    let code = 0, value = S("");
    // Run the script.
    try { value = it.evalBody(a[1].string, ev.depth + 1); } catch (e) {
      // Control flow codes.
      if (e instanceof TclControl) { code = e.code === "return" ? 2 : e.code === "break" ? 3 : 4; value = e.value; }
      // Errors.
      else { code = 1; value = S((e as Error).message); }
    }
    // Save the result or message.
    if (a.length === 3) it.setVar(a[2].string, value, ev);
    // Note the code.
    ev.notes.push({ code: "catch", params: { code } });
    // The code.
    return TclObj.fromInt(BigInt(code));
  },
  // string option arg ?arg ...?
  string(it, a, ev) {
    // At least a subcommand.
    if (a.length < 2) throw wrongArgs("string", "option arg ?arg ...?");
    // Tcl 8.4.6's subcommands, in its order (for the error message).
    const subs = ["bytelength", "compare", "equal", "first", "index", "is", "last", "length", "map", "match", "range", "repeat", "replace", "tolower", "toupper", "totitle", "trim", "trimleft", "trimright", "wordend", "wordstart"];
    // Which one (prefixes allowed).
    const sub = subs[getIndex(a[1].string, subs)];
    // Dispatch.
    return stringCommand(it, sub, a, ev);
  },
  // scan string format ?varName ...?
  scan(it, a, ev) {
    // Wrong count.
    if (a.length < 3) throw wrongArgs("scan", "string format ?varName varName ...?");
    // Run it.
    const r = runScan(a[1].string, a[2].string, a.length - 3);
    // Assign the variables that received values.
    r.values.forEach((v, k) => { if (v !== null && a.length > 3) it.setVar(a[3 + k].string, S(v), ev); });
    // The result: a count, or the list of values.
    return S(r.result);
  },
  // info exists varName (the only info subcommand modelled)
  info(it, a) {
    // Only "exists".
    if (a.length !== 3 || a[1].string !== "exists") throw new TclError("only \"info exists varName\" is modelled by this tool");
    // 1 or 0.
    return TclObj.fromInt(it.vars.has(it.varKey(a[2].string)) ? 1n : 0n);
  },
  // puts ?-nonewline? ?channelId? string (tclsh output)
  puts(it, a) {
    // The text is the last argument.
    if (a.length < 2 || a.length > 4) throw wrongArgs("puts", "?-nonewline? ?channelId? string");
    // Record it.
    it.logs.push({ facility: "stdout", message: a[a.length - 1].string });
    // Empty result.
    return S("");
  },
};

/** The `string` subcommands. */
function stringCommand(_it: Interp, sub: string, a: TclObj[], _ev: TraceEvent): TclObj {
  // The arguments after the subcommand.
  const n = a.length;
  // Dispatch.
  switch (sub) {
    // length / bytelength string
    case "length": case "bytelength":
      // Exactly one argument.
      if (n !== 3) throw wrongArgs(`string ${sub}`, "string");
      // Characters or bytes.
      return TclObj.fromInt(BigInt(sub === "length" ? a[2].string.length : strByteLength(a[2].string)));
    // tolower / toupper string ?first? ?last?
    case "tolower": case "toupper":
      // One to three arguments.
      if (n < 3 || n > 5) throw wrongArgs(`string ${sub}`, "string ?first? ?last?");
      // Convert.
      return S(strCase(a[2].string, sub === "toupper", a[3]?.string, a[4]?.string).value);
    // range string first last
    case "range":
      // Exactly three arguments.
      if (n !== 5) throw wrongArgs("string range", "string first last");
      // Extract.
      return S(strRange(a[2].string, a[3].string, a[4].string).value);
    // index string charIndex
    case "index":
      // Exactly two arguments.
      if (n !== 4) throw wrongArgs("string index", "string charIndex");
      // One character.
      return S(strIndex(a[2].string, a[3].string).value);
    // first / last subString string ?startIndex?
    case "first": case "last":
      // Two or three arguments.
      if (n < 4 || n > 5) throw wrongArgs(`string ${sub}`, "subString string ?startIndex?");
      // Search.
      return TclObj.fromInt(BigInt((sub === "first" ? strFirst : strLast)(a[2].string, a[3].string, a[4]?.string).value));
    // map ?-nocase? charMap string
    case "map": {
      // Two or three arguments.
      if (n < 4 || n > 5) throw wrongArgs("string map", "?-nocase? charMap string");
      // The option, when given (a prefix of -nocase, two characters at least).
      if (n === 5 && !(a[2].string.length > 1 && "-nocase".startsWith(a[2].string))) throw new TclError(`bad option "${a[2].string}": must be -nocase`);
      // Map.
      return S(strMap(a[n - 2].string, a[n - 1].string, n === 5).value);
    }
    // match ?-nocase? pattern string
    case "match": {
      // Two or three arguments.
      if (n < 4 || n > 5) throw wrongArgs("string match", "?-nocase? pattern string");
      // The option.
      if (n === 5 && !(a[2].string.length > 1 && "-nocase".startsWith(a[2].string))) throw new TclError(`bad option "${a[2].string}": must be -nocase`);
      // Match.
      return TclObj.fromInt(BigInt(strMatch(a[n - 2].string, a[n - 1].string, n === 5)));
    }
    // compare / equal ?-nocase? ?-length int? string1 string2
    case "compare": case "equal": {
      // Two to five arguments.
      if (n < 4 || n > 7) throw wrongArgs(`string ${sub}`, "?-nocase? ?-length int? string1 string2");
      // Options.
      let nocase = false, reqlength = -1;
      // Each option word.
      for (let i = 2; i < n - 2; i++) {
        // The word.
        const o = a[i].string;
        // -nocase (a prefix, two characters at least).
        if (o.length > 1 && "-nocase".startsWith(o)) nocase = true;
        // -length int.
        else if (o.length > 1 && "-length".startsWith(o)) {
          // A value must follow before the two strings.
          if (i + 1 >= n - 2) throw wrongArgs(`string ${sub}`, "?-nocase? ?-length int? string1 string2");
          // Read it.
          reqlength = getInt32(a[++i]);
        } else throw new TclError(`bad option "${o}": must be -nocase or -length`);
      }
      // The two strings, cut to the requested length.
      let x = a[n - 2].string, y = a[n - 1].string;
      // -length 0 always matches.
      if (reqlength === 0) return TclObj.fromInt(sub === "equal" ? 1n : 0n);
      // A positive length compares only that many characters.
      if (reqlength > 0) { x = x.slice(0, reqlength); y = y.slice(0, reqlength); }
      // Compare.
      const c = strCompare(x, y, nocase);
      // equal: 1/0; compare: -1/0/1.
      return TclObj.fromInt(BigInt(sub === "equal" ? (c === 0 ? 1 : 0) : c));
    }
    // repeat string count
    case "repeat": {
      // Exactly two arguments.
      if (n !== 4) throw wrongArgs("string repeat", "string count");
      // The count.
      const k = getInt32(a[3]);
      // A sane bound for a web page.
      if (k > 100000 || k * a[2].string.length > 1000000) throw new TclError("string repeat result is too large for this tool");
      // Repeat (zero or negative: empty).
      return S(k > 0 ? a[2].string.repeat(k) : "");
    }
    // replace string first last ?newString?
    case "replace": {
      // Three or four arguments.
      if (n < 5 || n > 6) throw wrongArgs("string replace", "string first last ?string?");
      // The string.
      const s = a[2].string;
      // The last position.
      const end = s.length - 1;
      // The indices.
      let first = readIndex(a[3].string, end).value;
      // The last index.
      const last = readIndex(a[4].string, end).value;
      // Out of range: unchanged.
      if (last < first || last < 0 || first > end) return a[2];
      // Clamp the start.
      if (first < 0) first = 0;
      // Splice.
      return S(s.slice(0, first) + (n === 6 ? a[5].string : "") + (last < end ? s.slice(last + 1) : ""));
    }
    // trim / trimleft / trimright string ?chars?
    case "trim": case "trimleft": case "trimright": {
      // One or two arguments.
      if (n !== 3 && n !== 4) throw wrongArgs(`string ${sub}`, "string ?chars?");
      // The characters to trim (default: space, tab, newline, carriage return).
      const chars = n === 4 ? a[3].string : " \t\n\r";
      // The string.
      let s = a[2].string;
      // Left side.
      if (sub !== "trimright") { let k = 0; while (k < s.length && chars.includes(s[k])) k++; s = s.slice(k); }
      // Right side.
      if (sub !== "trimleft") { let k = s.length; while (k > 0 && chars.includes(s[k - 1])) k--; s = s.slice(0, k); }
      // The trimmed string.
      return S(s);
    }
    // Everything else is out of scope.
    default:
      // Say so.
      throw new TclError(`string ${sub} is not modelled by this tool`);
  }
}

/** The outcome of running a script. */
export interface RunResult {
  // How the script ended.
  code: Code;
  // Its result (or error message).
  result: string;
  // Variables at the end.
  vars: Record<string, string>;
  // Lines logged.
  logs: LogLine[];
  // Every command, in order.
  events: TraceEvent[];
}

/** Run a script at the top level, one command at a time, as tclsh does. */
export function runScript(script: string, opts: InterpOptions): RunResult {
  // A fresh interpreter.
  const it = new Interp(opts);
  // How it ended.
  let code: Code = "ok";
  // The result.
  let result = "";
  // Run.
  try { result = it.evalDirect(script, 0).string; } catch (e) {
    // Control flow at the top level.
    if (e instanceof TclControl) { code = e.code; result = e.value.string; }
    // Errors (JavaScript's own limits get a plain sentence).
    else { code = "error"; result = errorMessage(e); }
  }
  // The final variables.
  const vars: Record<string, string> = {};
  // Copy them out.
  for (const [k, v] of it.vars) vars[k] = v.string;
  // The outcome.
  return { code, result, vars, logs: it.logs, events: it.events };
}

/** Re-export the expression evaluator for tools that only need it. */
export { evalExpr, truncBytes };
