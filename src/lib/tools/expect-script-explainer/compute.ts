// ============================================================================
// src/lib/tools/expect-script-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE EXPECT SCRIPT EXPLAINER: the pure engine (rank 7 of the 2026-10 campaign).
//
// An Expect script is a Tcl script that drives an interactive program: spawn
// starts it, expect waits for its output to match a pattern, send types at it,
// interact hands the keyboard to the user. Network engineers write them to log
// in to a switch, run a command and read the answer, and the same four verbs
// hide the same half-dozen mistakes: a password typed in clear text in a send,
// a timeout left at its default or set to never, a pattern that fires on the
// first character, a script that exits before the program has finished
// talking, a send without the carriage return a line-buffered program waits
// for. This engine reads the script with the site's Tcl 8.4 parser
// (src/lib/tcl84/parse.ts: Expect is Tcl, and Expect's own syntax is Tcl's,
// with array references accepted since $env(...) and $expect_out(buffer) are
// everywhere in these scripts), walks every command including the bodies of
// expect, if, foreach, while, switch, catch and proc, and returns two things:
// an explanation of each command as a typed record (the UI words it in the
// reader's language) and a list of findings against rules E1 to E18, each tied
// to a line.
//
// STATIC ONLY. Nothing is spawned, nothing is run; a send's text is read, never
// sent. The explanation is of what the script WOULD do, from its text alone.
//
// FACTS. Every rule that states a fact about Expect quotes expect(1), the
// manual page of Expect version 5 (Don Libes, NIST), read 2026-10-05 at
// tcl-lang.org/man/expect5.31/expect.1.html: "The default timeout period is 10
// seconds"; "An infinite timeout may be designated by the value -1"; "If no
// timeout keyword is used, an implicit null action is executed upon timeout";
// "The pattern "*" (and -re ".*") will flush the output buffer without reading
// any more output from the process"; "programs with line-buffered input will
// not read the characters until a return character is sent. A return character
// is denoted "\r""; "close does not call wait since there is no guarantee that
// closing a process connection will cause it to exit"; "Upon exiting, all
// connections to spawned processes are closed"; "It is a good idea to precede
// the first send to a process by an expect. expect will wait for the process
// to start, while send cannot"; "variables written are always in the local
// scope (unless a "global" command has been issued)"; and, on the one-argument
// form of expect, "the usual Tcl substitutions will occur despite the braces".
// The manifest carries the citation.
// ============================================================================

import { parseScriptPartial, parseQuotedAt, type Command, type Word } from "@/lib/tcl84/parse";

/** The input: one script. */
export interface ExpectInput {
  /** The script's text. */
  script: string;
}

/** The upper bound on the script's size, so a pasted log cannot stall the page. */
export const SCRIPT_MAX_CHARS = 65536;

/** The parser options this tool uses: arrays accepted (see the header). */
const PARSE = { arrays: true } as const;

/** How a pattern was given to expect. */
export type PatternFlag = "glob" | "re" | "ex";

/** The keyword patterns expect(1) defines. */
export type SpecialPattern = "eof" | "timeout" | "full_buffer" | "null" | "default";

/** One pattern of an expect command, as the script wrote it. */
export interface ExpectPattern {
  /** The pattern text, with backslashes resolved where Tcl would resolve them (a keyword is repeated here too). */
  pattern: string;
  /** glob (the default), re (-re) or ex (-ex). */
  flag: PatternFlag;
  /** A keyword pattern, or null for an ordinary one. */
  special: SpecialPattern | null;
  /** Whether a body follows it (the last pattern of an expect may have none). */
  hasBody: boolean;
  /** Whether -nocase was given for it. */
  nocase: boolean;
  /** The 1-based line the pattern sits on. */
  line: number;
}

/** The typed explanation of one command; `kind` picks the sentence, the other fields fill it. */
export type Explained =
  | { kind: "shebang"; interpreter: string }
  | { kind: "spawn"; program: string; args: string; noecho: boolean }
  | { kind: "expect"; patterns: ExpectPattern[]; timeout: number | null; variant: "expect" | "expect_before" | "expect_after" | "expect_user" }
  | { kind: "send"; text: string; literal: boolean; endsWithCR: boolean; endsWithLF: boolean; target: "process" | "user" | "error" | "tty"; slow: boolean; human: boolean }
  | { kind: "set-timeout"; value: string; infinite: boolean; numeric: boolean }
  | { kind: "set"; name: string; value: string; fromArgv: number | null }
  | { kind: "global"; names: string }
  | { kind: "interact" }
  | { kind: "exp_continue" }
  | { kind: "log_user"; on: boolean }
  | { kind: "log_file"; args: string }
  | { kind: "close" }
  | { kind: "wait" }
  | { kind: "exit"; code: string }
  | { kind: "sleep"; seconds: string }
  | { kind: "stty"; args: string; echoOff: boolean; echoOn: boolean }
  | { kind: "proc"; name: string; params: string }
  | { kind: "control"; name: string }
  | { kind: "puts"; text: string }
  | { kind: "match_max"; value: string }
  | { kind: "exp_internal"; on: boolean }
  | { kind: "catch" }
  | { kind: "other"; name: string; argc: number };

/** One explained command with its place and nesting. */
export interface ExplainedCommand {
  /** 1-based line of the command's first word. */
  line: number;
  /** Nesting depth: 0 at the top, 1 inside an expect body, if branch, loop or proc, and so on. */
  depth: number;
  /** The command's first word as written. */
  name: string;
  /** The source of the command, first line only, trimmed to 120 characters. */
  text: string;
  /** The typed explanation. */
  explained: Explained;
}

/** How serious a finding is. */
export type Severity = "error" | "warning" | "info";

/** One finding against a rule. */
export interface ExpectFinding {
  /** E1 to E18, or "syntax". */
  rule: string;
  /** How serious. */
  severity: Severity;
  /** 1-based line. */
  line: number;
  /** The trimmed source line. */
  snippet: string;
  /** Details for the message; `what` picks the variant of the rule's sentence when the rule has several. */
  params?: Record<string, string | number>;
}

/** One step of the dialogue: what the script waits for, then what it types. */
export interface DialogueStep {
  /** The expect's line. */
  line: number;
  /** The patterns waited for (ordinary ones as written; keywords by name). */
  waitsFor: string[];
  /** The text of the send that answers it, or null when nothing is sent before the next expect. A secret typed in clear is shown masked. */
  thenSends: string | null;
}

/** The result. */
export interface ExpectResult {
  /** The commands, in source order, bodies included. */
  commands: ExplainedCommand[];
  /** The findings, in line order. */
  findings: ExpectFinding[];
  /** Counts by severity. */
  counts: { error: number; warning: number; info: number };
  /** The programs spawned, in order. */
  spawned: string[];
  /** The dialogue: each expect on the process, with the send that follows it. */
  dialogue: DialogueStep[];
  /** The timeout in force at the first expect: "default" (10 s), "infinite", or the number as written. */
  timeoutAtFirstExpect: string;
  /** Whether the script ever hands control to the user. */
  interactive: boolean;
  /** Whether an eof pattern appears anywhere. */
  waitsForEof: boolean;
  /** Lines in the script. */
  lines: number;
  /** Commands explained, bodies included. */
  commandCount: number;
  /** Where the parser stopped, when the script is not valid Tcl; the commands before it are still explained. */
  syntaxError: { line: number; message: string } | null;
}

/** Refuse an oversized script with a message the page can show. */
function limit(script: string): void {
  // The bound exists so a pasted log cannot stall the page; the number is the one the docs quote.
  if (script.length > SCRIPT_MAX_CHARS) throw new Error(`The script is longer than ${SCRIPT_MAX_CHARS} characters.`);
}

/** The literal text of a word when it has no substitutions; null when it has a $variable or [command] in it. */
function literalOf(w: Word): string | null {
  // A word with any non-text part is not literal.
  if (w.parts.some((p) => p.kind !== "text")) return null;
  // Join the text parts.
  return w.parts.map((p) => (p.kind === "text" ? p.text : "")).join("");
}

/** The text of a word for display: its literal, or its raw spelling when it substitutes. */
function shown(w: Word): string {
  // The literal when there is one.
  const lit = literalOf(w);
  // Otherwise the spelling, quotes and all.
  return lit === null ? w.raw : lit;
}

/** Control characters written back as escapes, so a result reads on a page: \r, \n, \t, \e, \xNN. */
function visible(text: string): string {
  // Each control character (and DEL) becomes its escape.
  return text.replace(/[\x00-\x1f\x7f]/g, (c) => c === "\r" ? "\\r" : c === "\n" ? "\\n" : c === "\t" ? "\\t" : c === "\x1b" ? "\\e" : "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0"));
}

/** A word's spelling without its delimiters: the quotes or braces are dropped, the content kept as written. */
function spelled(w: Word): string {
  // Bare words are their own spelling.
  if (w.kind === "bare") return w.raw;
  // Quoted and braced: drop one character at each end.
  return w.raw.slice(1, -1);
}

/** A word for display: its literal text made visible, or its spelling when it substitutes. */
function display(w: Word): string {
  // The literal when there is one.
  const lit = literalOf(w);
  // Visible either way.
  return visible(lit === null ? spelled(w) : lit);
}

/** 1-based line of an offset in the source. */
function lineAt(src: string, offset: number): number {
  // Count newlines before the offset.
  let n = 1;
  // Walk the prefix.
  for (let i = 0; i < offset && i < src.length; i++) if (src.charCodeAt(i) === 10) n++;
  // The line.
  return n;
}

/** The source line an offset sits on, trimmed. */
function snippetAt(src: string, offset: number): string {
  // The line's start.
  const start = src.lastIndexOf("\n", offset - 1) + 1;
  // The line's end.
  let end = src.indexOf("\n", offset);
  // The last line has none.
  if (end < 0) end = src.length;
  // Trimmed and bounded.
  return src.slice(start, end).trim().slice(0, 160);
}

/** The trimmed text of a 1-based line. */
function snippetOfLine(src: string, line: number): string {
  // The lines.
  const lines = src.split("\n");
  // The one asked for, trimmed and bounded.
  return (lines[line - 1] ?? "").trim().slice(0, 160);
}

/** Mask a secret for display: one bullet per character. */
function mask(text: string): string {
  // Keep the length, hide the characters.
  return text.replace(/[\r\n]+$/, "").replace(/./g, "•");
}

/** One element of the one-argument form of expect, with where it starts. */
interface ListItem {
  /** The element's content: braces or quotes removed, backslashes resolved in quoted elements. */
  text: string;
  /** Offset of the element's first content character in the source. */
  start: number;
  /** How it was written. */
  kind: "braced" | "quoted" | "bare";
  /** Whether the element substitutes a [command] (quoted or bare elements only). */
  hasCommand: boolean;
  /** Whether the element substitutes a $variable (quoted or bare elements only). */
  hasVariable: boolean;
}

/**
 * Split the content of expect's one braced argument into its elements with their offsets, by the
 * word rules expect(1) applies there ("the usual Tcl substitutions will occur despite the braces"):
 * white space separates (newlines included), {braces} group and substitute nothing, "quotes" group
 * and substitute, a backslash protects the next character. Offsets are absolute in the source, so a
 * body's commands can be given their true line numbers. Unbalanced input returns what was read.
 */
function splitList(src: string, from: number, to: number): ListItem[] {
  // The elements.
  const items: ListItem[] = [];
  // The cursor.
  let i = from;
  // Element by element.
  while (i < to) {
    // Skip white space between elements.
    while (i < to && /\s/.test(src[i])) i++;
    // Done.
    if (i >= to) break;
    // The first character decides the kind.
    const ch = src[i];
    // Braced: find the matching close brace, honouring nesting and backslashes.
    if (ch === "{") {
      // Nesting depth.
      let depth = 1;
      // The scan position.
      let j = i + 1;
      // Scan to the matching brace.
      while (j < to && depth > 0) {
        // A backslash protects the next character.
        if (src[j] === "\\") { j += 2; continue; }
        // Open.
        if (src[j] === "{") depth++;
        // Close.
        else if (src[j] === "}") depth--;
        // Advance unless the match was found.
        if (depth > 0) j++;
      }
      // The element, substituting nothing.
      items.push({ text: src.slice(i + 1, Math.min(j, to)), start: i + 1, kind: "braced", hasCommand: false, hasVariable: false });
      // Past the close brace.
      i = j + 1;
    } else if (ch === '"') {
      // Quoted: the site's Tcl parser reads it with its substitutions.
      try {
        // Parse the quoted word from the quote.
        const q = parseQuotedAt(src, i, PARSE);
        // The element, with what it substitutes.
        items.push({ text: display(q.word), start: i + 1, kind: "quoted", hasCommand: q.word.parts.some((p) => p.kind === "cmd"), hasVariable: q.word.parts.some((p) => p.kind === "var") });
        // Past the close quote.
        i = q.end;
      } catch {
        // An unterminated quote: take the rest as the element.
        items.push({ text: src.slice(i + 1, to), start: i + 1, kind: "quoted", hasCommand: false, hasVariable: false });
        // Done.
        i = to;
      }
    } else {
      // Bare: up to white space.
      let j = i;
      // Scan, a backslash protecting the next character.
      while (j < to && !/\s/.test(src[j])) { if (src[j] === "\\") j++; j++; }
      // The text.
      const text = src.slice(i, Math.min(j, to));
      // The element, with what a bare word would substitute.
      items.push({ text, start: i, kind: "bare", hasCommand: text.includes("["), hasVariable: /\$[A-Za-z0-9_{:]/.test(text) });
      // Next.
      i = j;
    }
  }
  // Done.
  return items;
}

/** Does a send's text look like a secret typed in clear? A literal, non-empty, one token, not a bare answer or a CLI verb. */
function looksLikeSecret(text: string): boolean {
  // Strip the trailing return/newline the send carries.
  const body = text.replace(/[\r\n]+$/, "");
  // Empty: a bare return.
  if (!body) return false;
  // Several words: a command, not a password.
  if (/\s/.test(body)) return false;
  // Answers and CLI verbs.
  if (/^(exit|quit|logout|enable|configure|conf|show|terminal|term|y|n|yes|no|q)$/i.test(body)) return false;
  // A $reference or [command] kept literal by braces is a reference, not a value.
  if (/^\$|\[/.test(body)) return false;
  // Anything else right after a password prompt is read as the password.
  return true;
}

/** Does a prompt pattern ask for a password? */
function asksForPassword(pattern: string): boolean {
  // The usual spellings, case-insensitive, in English and Portuguese.
  return /assword|assphrase|\bPIN\b|senha|passcode/i.test(pattern);
}

/** The state the walk keeps across commands. */
interface WalkState {
  /** Programs spawned, in order. */
  spawned: string[];
  /** Index in the output of the last spawn, for E10's line. */
  spawnedAt: number;
  /** Whether ssh was spawned without StrictHostKeyChecking=no. */
  sshNeedsHostKey: boolean;
  /** Whether a send to the process has happened since the last spawn (E17). */
  sentSinceSpawn: boolean;
  /** Whether an expect on the process has happened since the last spawn (E17). */
  expectedSinceSpawn: boolean;
  /** Line of the first expect on the process, or null. */
  firstExpect: number | null;
  /** The timeout as last set at the top level ("infinite" for -1), or null when never set. */
  timeoutSet: string | null;
  /** Whether a top-level set timeout came before the first expect. */
  timeoutSetBeforeFirstExpect: boolean;
  /** The timeout in force at the first expect. */
  timeoutAtFirstExpect: string;
  /** The timeout set locally in the current proc (Expect reads the local scope first), or null. */
  procTimeoutSet: string | null;
  /** Line of the first expect that ran on the default timeout, or null. */
  firstDefaultExpect: number | null;
  /** The dialogue steps. */
  dialogue: DialogueStep[];
  /** The step still waiting for its send, with the depth of its expect. */
  openStep: { step: DialogueStep; depth: number } | null;
  /** An eof pattern seen. */
  waitsForEof: boolean;
  /** interact seen. */
  interactive: boolean;
  /** Inside an expect body (exp_continue is legal there). */
  inExpectBody: boolean;
  /** How many proc bodies the walk is inside. */
  procDepth: number;
  /** Whether the current proc declared "global timeout". */
  globalTimeoutInProc: boolean;
  /** The last expect waited for a password prompt. */
  lastPromptWasPassword: boolean;
  /** The last command explained was a send to the process (E4). */
  lastWasSend: boolean;
  /** Line of that last send. */
  lastSendLine: number | null;
  /** Line of log_user 0, or null. */
  logUserOffAt: number | null;
  /** log_user 1 seen after it. */
  logUserRestored: boolean;
  /** Line of stty -echo, or null. */
  echoOffAt: number | null;
  /** stty echo seen after it. */
  echoRestored: boolean;
  /** Line of the last close, or null. */
  closedAt: number | null;
  /** wait seen. */
  waited: boolean;
  /** Expects on ordinary patterns with no timeout handler. */
  expectsWithoutTimeoutHandler: number;
  /** Commands explained. */
  commandCount: number;
  /** A pattern answering the host-key question seen. */
  hostKeyHandled: boolean;
  /** Lines of sends flagged as secrets, so the dialogue can mask them. */
  secretSendLines: Set<number>;
}

/** Re-base a command parsed from a body onto the whole source: offsets shift, lines are recounted. */
function rebase(c: Command, base: number, src: string): Command {
  // Every word moves by the base.
  const words = c.words.map((w) => ({ ...w, start: w.start + base, end: w.end + base }));
  // The command too, with its true line.
  return { words, start: c.start + base, end: c.end + base, line: lineAt(src, c.start + base) };
}

/** Walk the text of a body that sits at `start` in the source. */
function walkBodyText(src: string, body: string, start: number, depth: number, out: ExplainedCommand[], F: ExpectFinding[], state: WalkState, expectBody: boolean): void {
  // Parse the body on its own.
  const parsed = parseScriptPartial(body, PARSE);
  // Move its commands onto the source.
  const rebased = parsed.commands.map((c) => rebase(c, start, src));
  // Inside an expect body exp_continue is legal; remember the nesting so E8 can tell.
  const was = state.inExpectBody;
  // Set for this body.
  state.inExpectBody = expectBody;
  // Walk.
  walk(src, rebased, depth, out, F, state);
  // Restore.
  state.inExpectBody = was;
}

/** The pattern/body pairs and flags of an expect command's arguments, in either form (several words, or one braced list). */
function parseExpectArgs(src: string, args: Word[]): { patterns: (ExpectPattern & { hasCommand: boolean; hasVariable: boolean })[]; bodies: { text: string; start: number; pattern: ExpectPattern }[]; timeout: number | null } {
  // The patterns found.
  const patterns: (ExpectPattern & { hasCommand: boolean; hasVariable: boolean })[] = [];
  // The bodies found, each with the pattern it answers.
  const bodies: { text: string; start: number; pattern: ExpectPattern }[] = [];
  // A -timeout flag's value.
  let timeout: number | null = null;
  // The elements: one braced word holding the list, or the words themselves.
  let items: ListItem[];
  // The one-argument form.
  if (args.length === 1 && args[0].kind === "braced") items = splitList(src, args[0].start + 1, args[0].end - 1);
  // The several-words form: each word is an element.
  else items = args.map((w) => ({ text: w.kind === "braced" ? src.slice(w.start + 1, w.end - 1) : display(w), start: w.kind === "bare" ? w.start : w.start + 1, kind: w.kind, hasCommand: w.parts.some((p) => p.kind === "cmd"), hasVariable: w.parts.some((p) => p.kind === "var") }));
  // The flag in force for the next pattern.
  let flag: PatternFlag = "glob";
  // -nocase in force for the next pattern.
  let nocase = false;
  // The cursor.
  let i = 0;
  // Walk flags, pattern, body.
  while (i < items.length) {
    // The element.
    const it = items[i];
    // Its text.
    const t = it.text;
    // A flag: bare, starts with a dash, is not a lone dash.
    if (it.kind === "bare" && t.startsWith("-") && t !== "-") {
      // The pattern kinds.
      if (t === "-re") flag = "re";
      // Glob, explicitly.
      else if (t === "-gl") flag = "glob";
      // Exact.
      else if (t === "-ex") flag = "ex";
      // Case folding.
      else if (t === "-nocase") nocase = true;
      // A timeout for this expect only.
      else if (t === "-timeout") { timeout = Number(items[i + 1]?.text ?? "") || null; i++; }
      // A spawn id: skip its value.
      else if (t === "-i") i++;
      // -notransfer, -indices, --: no value.
      i++;
      // Next element.
      continue;
    }
    // A keyword pattern.
    const special = it.kind === "bare" && /^(eof|timeout|full_buffer|null|default)$/.test(t) ? (t as SpecialPattern) : null;
    // The element after it.
    const body = items[i + 1];
    // A body follows unless the next element is a flag.
    const hasBody = !!body && !(body.kind === "bare" && body.text.startsWith("-") && body.text !== "-");
    // The pattern, its text made visible.
    const pat = { pattern: visible(t), flag: special ? "glob" : flag, special, hasBody, nocase, line: lineAt(src, it.start), hasCommand: it.hasCommand, hasVariable: it.hasVariable };
    // Record it.
    patterns.push(pat);
    // Its body, walked later, with the pattern it answers.
    if (hasBody) bodies.push({ text: body.text, start: body.start, pattern: pat });
    // Flags reset after each pattern.
    flag = "glob";
    // So does -nocase.
    nocase = false;
    // Past the pattern and its body.
    i += hasBody ? 2 : 1;
  }
  // Done.
  return { patterns, bodies, timeout };
}

/** The main walk: explain a run of commands at a depth, collecting into the result. */
function walk(src: string, commands: Command[], depth: number, out: ExplainedCommand[], F: ExpectFinding[], state: WalkState): void {
  // Command by command.
  for (const cmd of commands) {
    // The command name as written.
    const first = cmd.words[0];
    // Shown.
    const name = shown(first);
    // The source line, bounded.
    const text = snippetAt(src, cmd.start).slice(0, 120);
    // The arguments.
    const args = cmd.words.slice(1);
    // The i-th argument shown, or "".
    const argText = (i: number) => (args[i] ? shown(args[i]) : "");
    // The line.
    const line = cmd.line;
    // Add a finding on this command's line.
    const finding = (rule: string, severity: Severity, params?: Record<string, string | number>) =>
      F.push({ rule, severity, line, snippet: snippetAt(src, cmd.start), ...(params ? { params } : {}) });
    // Walk a braced body word as a nested script with true line numbers.
    const walkBody = (w: Word | undefined, expectBody = false) => {
      // Only braced words are bodies here.
      if (!w || w.kind !== "braced") return;
      // The body's content starts one character after the brace.
      walkBodyText(src, src.slice(w.start + 1, w.end - 1), w.start + 1, depth + 1, out, F, state, expectBody);
    };
    // Whether this command is a send to the process (for E4, decided at the end).
    let sendToProcess = false;
    // The explanation.
    let explained: Explained;
    // By command name.
    switch (name) {
      case "spawn": {
        // spawn [flags] program args...; flags that take a value: -ignore, -open, -leaveopen.
        let i = 0;
        // -noecho seen.
        let noecho = false;
        // Walk the flags.
        while (i < args.length && /^-/.test(shown(args[i]))) {
          // The flag.
          const f = shown(args[i]);
          // Echo suppressed.
          if (f === "-noecho") noecho = true;
          // Flags with a value.
          if (f === "-ignore" || f === "-open" || f === "-leaveopen") i++;
          // Next.
          i++;
        }
        // The program and its arguments.
        const program = args[i] ? display(args[i]) : "";
        // The arguments as written.
        const argStr = args.slice(i + 1).map(display).join(" ");
        // The record.
        explained = { kind: "spawn", program, args: argStr, noecho };
        // Remember.
        state.spawned.push(program);
        // Where, for E10.
        state.spawnedAt = out.length;
        // A fresh process: nothing sent or expected yet (E17).
        state.sentSinceSpawn = false;
        // Nor expected.
        state.expectedSinceSpawn = false;
        // E10: ssh with StrictHostKeyChecking at its default (ask, ssh_config(5)) asks before connecting to a host whose key is not yet known.
        if (/(^|\/)ssh$/.test(program) && !/StrictHostKeyChecking[= ](no|off|accept-new)/i.test(argStr)) state.sshNeedsHostKey = true;
        break;
      }
      case "expect":
      case "expect_before":
      case "expect_after":
      case "expect_user": {
        // The patterns, bodies and -timeout.
        const parsed = parseExpectArgs(src, args);
        // The record (the extra fields stay internal).
        explained = { kind: "expect", patterns: parsed.patterns.map(({ hasCommand: _c, hasVariable: _v, ...p }) => p), timeout: parsed.timeout, variant: name as "expect" | "expect_before" | "expect_after" | "expect_user" };
        // Only a plain expect waits on the process.
        if (name === "expect") {
          // The timeout in force here: -timeout wins, then a proc-local set, then the top-level variable, else the default.
          const inForce = parsed.timeout !== null ? String(parsed.timeout) : state.procTimeoutSet !== null ? state.procTimeoutSet : state.timeoutSet !== null ? state.timeoutSet : "default";
          // The first expect: record it.
          if (state.firstExpect === null) {
            // Its line.
            state.firstExpect = line;
            // What applied.
            state.timeoutAtFirstExpect = inForce;
          }
          // The first expect that ran on the default (E2).
          if (inForce === "default" && state.firstDefaultExpect === null) state.firstDefaultExpect = line;
          // The process has been waited for (E17).
          state.expectedSinceSpawn = true;
          // The dialogue step, closed by the next send at a depth no deeper than its body.
          const step: DialogueStep = { line, waitsFor: parsed.patterns.map((p) => (p.special ? p.special : p.pattern)), thenSends: null };
          // Record it.
          state.dialogue.push(step);
          // Open it.
          state.openStep = { step, depth };
          // Per pattern.
          for (const p of parsed.patterns) {
            // eof waited for.
            if (p.special === "eof") state.waitsForEof = true;
            // A host-key question answered.
            if (!p.special && /continue connecting|yes\/no/i.test(p.pattern)) state.hostKeyHandled = true;
            // E3 flush: "*" or -re ".*" matches whatever is there without waiting.
            if (!p.special && ((p.flag === "glob" && p.pattern === "*") || (p.flag === "re" && (p.pattern === ".*" || p.pattern === ".+")))) {
              F.push({ rule: "E3", severity: "warning", line: p.line, snippet: snippetAt(src, cmd.start), params: { what: "flush", pattern: p.pattern } });
            } else if (!p.special && p.flag !== "ex" && p.pattern.length === 1 && /[>#$%:]/.test(p.pattern)) {
              // E3 short: a one-character prompt that any banner can contain.
              F.push({ rule: "E3", severity: "info", line: p.line, snippet: snippetAt(src, cmd.start), params: { what: "short", pattern: p.pattern } });
            }
            // E9 command: [brackets] in a quoted or bare pattern run a command before Expect sees the pattern.
            if (!p.special && p.hasCommand) F.push({ rule: "E9", severity: "warning", line: p.line, snippet: snippetAt(src, cmd.start), params: { what: "command", pattern: p.pattern } });
            // E9 variable: $name in a quoted regexp is substituted; the $ anchor is safe only at the end or before a non-name character.
            else if (!p.special && p.flag === "re" && p.hasVariable) F.push({ rule: "E9", severity: "info", line: p.line, snippet: snippetAt(src, cmd.start), params: { what: "variable", pattern: p.pattern } });
          }
          // E7: ordinary patterns and no timeout handler: an implicit null action on timeout, then the script carries on.
          const ordinary = parsed.patterns.filter((p) => !p.special);
          // Count it.
          if (ordinary.length > 0 && !parsed.patterns.some((p) => p.special === "timeout" || p.special === "default")) state.expectsWithoutTimeoutHandler++;
        }
        // Push the record before its bodies so the order is the source order.
        out.push({ line, depth, name, text, explained });
        // Counted.
        state.commandCount++;
        // The bodies, each walked as an expect body, each knowing whether its own pattern asked for a password (E1).
        for (const b of parsed.bodies) {
          // This body answers its pattern.
          state.lastPromptWasPassword = name === "expect" && !b.pattern.special && asksForPassword(b.pattern.pattern);
          // Walk it.
          walkBodyText(src, b.text, b.start, depth + 1, out, F, state, true);
        }
        // The command after the expect answers a pattern that has no body of its own.
        state.lastPromptWasPassword = name === "expect" && parsed.patterns.some((p) => !p.special && !p.hasBody && asksForPassword(p.pattern));
        // The last command of the script is now whatever the body ended with; a bare expect is a read.
        state.lastWasSend = parsed.bodies.length === 0 ? false : state.lastWasSend;
        // Done with this command.
        continue;
      }
      case "send":
      case "exp_send":
      case "send_user":
      case "send_error":
      case "send_tty": {
        // Flags: -- (next arg is the string), -s (slow), -h (human), -i id, -null, -break, -raw.
        let i = 0;
        // Slow.
        let slow = false;
        // Human.
        let human = false;
        // Walk the flags.
        while (i < args.length && /^-/.test(shown(args[i])) && shown(args[i]) !== "--") {
          // The flag.
          const f = shown(args[i]);
          // Slowly.
          if (f === "-s") slow = true;
          // Like a human.
          if (f === "-h") human = true;
          // A spawn id has a value.
          if (f === "-i") i++;
          // Next.
          i++;
        }
        // The terminator.
        if (i < args.length && shown(args[i]) === "--") i++;
        // The string.
        const w = args[i];
        // Its literal, when it has one.
        const lit = w ? literalOf(w) : "";
        // What is shown: the literal made visible, or the spelling.
        const textOut = w ? display(w) : "";
        // The last part of the word, which decides how the line ends.
        const last = w?.parts[w.parts.length - 1];
        // The text the string ends with (empty when the last part substitutes).
        const tail = last && last.kind === "text" ? last.text : "";
        // Where it goes.
        const target = name === "send_user" ? "user" : name === "send_error" ? "error" : name === "send_tty" ? "tty" : "process";
        // The record.
        explained = { kind: "send", text: textOut, literal: lit !== null, endsWithCR: /\r$/.test(tail), endsWithLF: /\n$/.test(tail), target, slow, human };
        // Sends to the process carry the rules.
        if (target === "process" && w) {
          // This is a send to the process.
          sendToProcess = true;
          // E17: typed before the process was ever waited for.
          if (state.spawned.length > 0 && !state.expectedSinceSpawn && !state.sentSinceSpawn) finding("E17", "warning");
          // Sent.
          state.sentSinceSpawn = true;
          // E1: a literal secret right after a password prompt.
          const secret = lit !== null && state.lastPromptWasPassword && looksLikeSecret(lit);
          // Flag it.
          if (secret) {
            // The finding, masked.
            finding("E1", "error", { what: "send", preview: mask(lit as string) });
            // Remember the line for the dialogue.
            state.secretSendLines.add(line);
          }
          // Close the open dialogue step with this send (masked when it is a secret).
          if (state.openStep && depth <= state.openStep.depth + 1 && state.openStep.step.thenSends === null) state.openStep.step.thenSends = secret ? mask(lit as string) : textOut;
          // Braced strings substitute nothing: a \r in braces is a backslash and an r, and $name stays a name.
          if (w.kind === "braced" && /\\[rn]$|\$|\[/.test(tail)) finding("E5", "warning", { what: "braced", text: textOut });
          // E5: no return at the end (a bare control character, such as \x03, is a keystroke on its own).
          else if (!/[\r\n]$/.test(tail) && !(lit !== null && /^[\x00-\x1f]+$/.test(lit)) && textOut !== "") finding("E5", "info", { what: "none" });
          // E6: a newline where a return is meant.
          else if (/\n$/.test(tail) && !/\r\n$/.test(tail)) finding("E6", "info");
          // Remember the line (E4).
          state.lastSendLine = line;
          // The password question is answered.
          state.lastPromptWasPassword = false;
        }
        break;
      }
      case "set": {
        // The variable.
        const varName = argText(0);
        // The value word.
        const valueWord = args[1];
        // Shown.
        const value = valueWord ? display(valueWord) : "";
        // The timeout variable is Expect's own.
        if (varName === "timeout") {
          // A number as written.
          const numeric = /^-?\d+$/.test(value);
          // -1 is forever.
          const infinite = value === "-1";
          // The record.
          explained = { kind: "set-timeout", value, infinite, numeric };
          // E2: infinite.
          if (infinite) finding("E2", "warning", { what: "infinite" });
          // Inside a proc the write is local unless global was declared (E18); a local value applies to the proc's own expects.
          if (state.procDepth > 0 && !state.globalTimeoutInProc) {
            // The finding.
            finding("E18", "info");
            // The local value.
            state.procTimeoutSet = infinite ? "infinite" : value;
          }
          // Declared global inside a proc: the write reaches the script's timeout.
          if (state.procDepth > 0 && state.globalTimeoutInProc) state.timeoutSet = infinite ? "infinite" : value;
          // At the top level it is the script's timeout.
          if (state.procDepth === 0) {
            // E13: set after the first expect, which ran on the default.
            if (state.firstExpect !== null && !state.timeoutSetBeforeFirstExpect) finding("E13", "warning", { firstExpectLine: state.firstExpect });
            // Before the first expect: good.
            if (state.firstExpect === null) state.timeoutSetBeforeFirstExpect = true;
            // The value in force.
            state.timeoutSet = infinite ? "infinite" : value;
          }
        } else {
          // lindex $argv N: the value comes from the command line.
          let fromArgv: number | null = null;
          // Look for it.
          if (valueWord) {
            // The command part.
            const cmdPart = valueWord.parts.find((p) => p.kind === "cmd");
            // Match it.
            const m = cmdPart && cmdPart.kind === "cmd" ? /^\s*lindex\s+\$argv\s+(\d+)\s*$/.exec(cmdPart.script) : null;
            // The index.
            if (m) fromArgv = Number(m[1]);
          }
          // The record.
          explained = { kind: "set", name: varName, value, fromArgv };
          // E1: a literal that looks like a secret assigned to a variable named like one.
          const lit = valueWord ? literalOf(valueWord) : null;
          // Flag it.
          if (lit !== null && /pass|pwd|secret|token|senha/i.test(varName) && looksLikeSecret(lit)) finding("E1", "error", { what: "variable", preview: mask(lit), variable: varName });
        }
        break;
      }
      case "global": {
        // The names declared global.
        const names = args.map(shown);
        // The record.
        explained = { kind: "global", names: names.join(" ") };
        // timeout among them, inside a proc.
        if (state.procDepth > 0 && names.includes("timeout")) state.globalTimeoutInProc = true;
        break;
      }
      case "interact": {
        // The user takes over.
        explained = { kind: "interact" };
        // Remember.
        state.interactive = true;
        break;
      }
      case "exp_continue": {
        // Keep expecting.
        explained = { kind: "exp_continue" };
        // E8: outside an expect body it has nothing to continue.
        if (!state.inExpectBody) finding("E8", "error");
        break;
      }
      case "log_user": {
        // 0 hides the dialogue.
        const on = argText(0) !== "0";
        // The record.
        explained = { kind: "log_user", on };
        // Off: remember where.
        if (!on) state.logUserOffAt = line;
        // On again.
        else if (state.logUserOffAt !== null) state.logUserRestored = true;
        break;
      }
      case "log_file": {
        // A transcript file.
        explained = { kind: "log_file", args: args.map(display).join(" ") };
        break;
      }
      case "close": {
        // The connection is closed.
        explained = { kind: "close" };
        // Remember where.
        state.closedAt = line;
        break;
      }
      case "wait": {
        // The process is reaped.
        explained = { kind: "wait" };
        // Remember.
        state.waited = true;
        break;
      }
      case "exit": {
        // The script ends.
        explained = { kind: "exit", code: argText(0) };
        break;
      }
      case "sleep": {
        // A fixed wait.
        explained = { kind: "sleep", seconds: argText(0) };
        // E11: time instead of an event.
        finding("E11", "info", { seconds: argText(0) });
        break;
      }
      case "stty": {
        // The arguments.
        const a = args.map(shown).join(" ");
        // Echo off.
        const echoOff = /(^|\s)-echo(\s|$)/.test(a);
        // Echo on.
        const echoOn = /(^|\s)echo(\s|$)/.test(a) && !echoOff;
        // The record.
        explained = { kind: "stty", args: a, echoOff, echoOn };
        // Off: remember where.
        if (echoOff) state.echoOffAt = line;
        // On again.
        if (echoOn && state.echoOffAt !== null) state.echoRestored = true;
        break;
      }
      case "proc": {
        // A procedure.
        explained = { kind: "proc", name: argText(0), params: argText(1) };
        // Record before the body.
        out.push({ line, depth, name, text, explained });
        // Counted.
        state.commandCount++;
        // The body is a proc body: writes are local.
        state.procDepth++;
        // Fresh declaration state.
        const hadGlobal = state.globalTimeoutInProc;
        // None yet in this proc.
        state.globalTimeoutInProc = false;
        // The enclosing local timeout, if any.
        const hadLocal = state.procTimeoutSet;
        // None yet in this proc.
        state.procTimeoutSet = null;
        // Walk.
        walkBody(args[2]);
        // Restore both.
        state.globalTimeoutInProc = hadGlobal;
        // And the local timeout.
        state.procTimeoutSet = hadLocal;
        // Out of the proc.
        state.procDepth--;
        // Done.
        continue;
      }
      case "if": {
        // A branch.
        explained = { kind: "control", name: "if" };
        // Record before the bodies.
        out.push({ line, depth, name, text, explained });
        // Counted.
        state.commandCount++;
        // if expr body ?elseif expr body? ?else body?: every braced word that is not a condition is a body.
        for (let i = 1; i < args.length; i++) {
          // The previous word decides whether this one is a condition.
          const prev = shown(args[i - 1]);
          // A keyword is not a body.
          const t = shown(args[i]);
          // Skip keywords.
          if (t === "elseif" || t === "else" || t === "then") continue;
          // A braced word after a condition or a keyword that takes a body.
          if (prev !== "elseif" && args[i].kind === "braced") walkBody(args[i]);
        }
        // Done.
        continue;
      }
      case "foreach":
      case "while":
      case "for": {
        // A loop.
        explained = { kind: "control", name };
        // Record before the body.
        out.push({ line, depth, name, text, explained });
        // Counted.
        state.commandCount++;
        // The last argument is the body.
        walkBody(args[args.length - 1]);
        // for's third argument is a script too (the step).
        if (name === "for" && args.length === 4) walkBody(args[2]);
        // Done.
        continue;
      }
      case "switch": {
        // A multiway branch.
        explained = { kind: "control", name: "switch" };
        // Record before the arms.
        out.push({ line, depth, name, text, explained });
        // Counted.
        state.commandCount++;
        // The last argument is the braced pattern/body list.
        const last = args[args.length - 1];
        // Walk every body (the odd elements).
        if (last && last.kind === "braced") {
          // The elements.
          const items = splitList(src, last.start + 1, last.end - 1);
          // Bodies at odd positions.
          for (let i = 1; i < items.length; i += 2) if (items[i].kind === "braced") walkBodyText(src, items[i].text, items[i].start, depth + 1, out, F, state, false);
        }
        // Done.
        continue;
      }
      case "catch": {
        // An error guard.
        explained = { kind: "catch" };
        // Record before the body.
        out.push({ line, depth, name, text, explained });
        // Counted.
        state.commandCount++;
        // The script.
        walkBody(args[0]);
        // Done.
        continue;
      }
      case "puts": {
        // Output to the user (or a channel).
        explained = { kind: "puts", text: args.map(display).join(" ") };
        break;
      }
      case "match_max": {
        // The buffer size.
        explained = { kind: "match_max", value: argText(args.length - 1) };
        break;
      }
      case "exp_internal": {
        // Diagnostics.
        explained = { kind: "exp_internal", on: argText(args.length - 1) !== "0" };
        break;
      }
      default:
        // Any other Tcl or Expect command.
        explained = { kind: "other", name, argc: args.length };
    }
    // Record.
    out.push({ line, depth, name, text, explained });
    // Counted.
    state.commandCount++;
    // The last command so far.
    state.lastWasSend = sendToProcess;
  }
}

/** The engine. */
export function run(input: ExpectInput): ExpectResult {
  // Normalise line ends.
  const src = (input.script ?? "").replace(/\r\n/g, "\n");
  // Refuse the oversized.
  limit(src);
  // The commands.
  const out: ExplainedCommand[] = [];
  // The findings.
  const F: ExpectFinding[] = [];
  // The state.
  const state: WalkState = {
    spawned: [], spawnedAt: -1, sshNeedsHostKey: false, sentSinceSpawn: false, expectedSinceSpawn: false,
    firstExpect: null, timeoutSet: null, timeoutSetBeforeFirstExpect: false, timeoutAtFirstExpect: "default", procTimeoutSet: null, firstDefaultExpect: null,
    dialogue: [], openStep: null, waitsForEof: false, interactive: false, inExpectBody: false, procDepth: 0, globalTimeoutInProc: false,
    lastPromptWasPassword: false, lastWasSend: false, lastSendLine: null, logUserOffAt: null, logUserRestored: false,
    echoOffAt: null, echoRestored: false, closedAt: null, waited: false, expectsWithoutTimeoutHandler: 0, commandCount: 0,
    hostKeyHandled: false, secretSendLines: new Set<number>(),
  };
  // The shebang, when present, is a comment to Tcl and the first fact about the script.
  const firstLine = src.split("\n")[0] ?? "";
  // Record it.
  if (firstLine.startsWith("#!")) out.push({ line: 1, depth: 0, name: "#!", text: firstLine.slice(0, 120), explained: { kind: "shebang", interpreter: firstLine.slice(2).trim() } });
  // Parse the whole script; a syntax error keeps what came before it.
  const parsed = parseScriptPartial(src, PARSE);
  // The error, if any.
  let syntaxError: ExpectResult["syntaxError"] = null;
  // Record it as a finding too.
  if (parsed.error) {
    // Where the parser stopped.
    const off = Math.min(parsed.error.pos, src.length);
    // The record.
    syntaxError = { line: lineAt(src, off), message: parsed.error.message };
    // The finding.
    F.push({ rule: "syntax", severity: "error", line: syntaxError.line, snippet: snippetAt(src, off), params: { message: parsed.error.message } });
  }
  // Walk.
  walk(src, parsed.commands, 0, out, F, state);
  // The last line.
  const lastLine = src.split("\n").length;
  // Whole-script findings, only when something was spawned.
  if (state.spawned.length > 0) {
    // E2 default: an expect ran with no timeout ever set: the default of 10 seconds applied.
    if (state.firstDefaultExpect !== null) F.push({ rule: "E2", severity: "info", line: state.firstDefaultExpect, snippet: snippetOfLine(src, state.firstDefaultExpect), params: { what: "default" } });
    // E4: the script's last act is a send: the connection closes on exit and nothing after it is read.
    if (state.lastWasSend && state.lastSendLine !== null && !state.interactive) F.push({ rule: "E4", severity: "warning", line: state.lastSendLine, snippet: snippetOfLine(src, state.lastSendLine) });
    // E16: close without wait.
    if (state.closedAt !== null && !state.waited) F.push({ rule: "E16", severity: "info", line: state.closedAt, snippet: snippetOfLine(src, state.closedAt) });
    // E10: ssh spawned without StrictHostKeyChecking=no and the host-key question never answered.
    if (state.sshNeedsHostKey && !state.hostKeyHandled) F.push({ rule: "E10", severity: "info", line: out[state.spawnedAt]?.line ?? 1, snippet: out[state.spawnedAt]?.text ?? "" });
    // E7: expects with ordinary patterns and no timeout handler.
    if (state.expectsWithoutTimeoutHandler > 0 && state.firstExpect !== null) F.push({ rule: "E7", severity: "info", line: state.firstExpect, snippet: snippetOfLine(src, state.firstExpect), params: { count: state.expectsWithoutTimeoutHandler } });
  }
  // E12: output hidden and never shown again.
  if (state.logUserOffAt !== null && !state.logUserRestored) F.push({ rule: "E12", severity: "info", line: state.logUserOffAt, snippet: snippetOfLine(src, state.logUserOffAt) });
  // E15: echo turned off and never turned back on.
  if (state.echoOffAt !== null && !state.echoRestored) F.push({ rule: "E15", severity: "warning", line: state.echoOffAt, snippet: snippetOfLine(src, state.echoOffAt) });
  // E14: nothing spawned at all: the script never talks to a program.
  if (state.spawned.length === 0 && parsed.commands.length > 0) F.push({ rule: "E14", severity: "info", line: 1, snippet: firstLine.trim() });
  // Order the findings by line, then by rule, so the output is stable.
  F.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
  // Count by severity.
  const counts = { error: 0, warning: 0, info: 0 };
  // Tally.
  for (const f of F) counts[f.severity]++;
  // The result.
  return {
    commands: out,
    findings: F,
    counts,
    spawned: state.spawned,
    dialogue: state.dialogue,
    timeoutAtFirstExpect: state.timeoutAtFirstExpect,
    interactive: state.interactive,
    waitsForEof: state.waitsForEof,
    lines: lastLine,
    commandCount: state.commandCount,
    syntaxError,
  };
}

/** The rules, for the docs and the UI legend (the severity each carries by default). */
export const RULES: readonly { id: string; severity: Severity }[] = [
  { id: "E1", severity: "error" },
  { id: "E2", severity: "warning" },
  { id: "E3", severity: "warning" },
  { id: "E4", severity: "warning" },
  { id: "E5", severity: "info" },
  { id: "E6", severity: "info" },
  { id: "E7", severity: "info" },
  { id: "E8", severity: "error" },
  { id: "E9", severity: "warning" },
  { id: "E10", severity: "info" },
  { id: "E11", severity: "info" },
  { id: "E12", severity: "info" },
  { id: "E13", severity: "warning" },
  { id: "E14", severity: "info" },
  { id: "E15", severity: "warning" },
  { id: "E16", severity: "info" },
  { id: "E17", severity: "warning" },
  { id: "E18", severity: "info" },
];
