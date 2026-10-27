// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tcl-substitution/compute.ts
// ----------------------------------------------------------------------------
// THE TCL SUBSTITUTION LAB'S MODEL (2026-10-27), the interactive companion of
// the article "Tcl for Expect writers". The reader types one line of an Expect
// script; the model reads it the way Tcl does, by the twelve rules of the
// Tcl(n) manual page (the same rules in Tcl 8.6.18, 9.0.4 and 9.1.0, read and
// compared on 27/10/2026; Tcl 9 only rewords rules 2 and 9), and shows each word: how it was written (bare, in
// double quotes, in braces, or expanded with {*}), which substitutions Tcl made
// in it, and the value the command receives. Where Tcl would stop with an
// error, the model says so with Tcl's own message, at the point Tcl stops.
//
// THE RULES MODELLED, by their number in Tcl(n):
//   [1] a newline or ";" ends a command (the lab reads the first command and
//       says what follows); [3] words are separated by white space; [4] a word
//       that starts with a double quote ends at the next double quote, with
//       command, variable and backslash substitution inside; [5] a word that
//       starts with {*} and a non-space character is substituted, then read
//       as a list whose elements become separate words; [6] a word that starts
//       with a brace ends at the matching brace and nothing inside is
//       substituted; [7] [script] is replaced by the script's result; [8] $name,
//       $name(index) and ${name} are replaced by a variable's value; [9] the
//       backslash sequences; [10] # starts a comment only where a command could
//       start; [11] each character is processed once, so a value is never
//       substituted again; [12] a substitution never splits a word, except {*}.
//   After a close quote or close brace only white space, the end, ";" or (inside
//   brackets) "]" may follow; Tcl's errors for that and for an unclosed quote,
//   brace or bracket are reproduced word for word (run r01, Tcl 8.6.14).
//
// WHAT IT DOES NOT DO: it never runs a command. A [script] keeps its place in
// the word as "the result of [script]"; the model checks only that Tcl knows
// the command (the commands of a fresh expect 5.45.4 on Tcl 8.6.14, listed by
// `info commands` in run r11, plus the procedures its unknown handler loads on
// first use), so [Pp] is the "invalid command name" error the article
// describes. Variables are a fixed set the lab shows (VARIABLES and ARRAYS
// below). \U escapes above U+FFFF are refused: Tcl 8.6.14 turns them into
// U+FFFD (run r13) where Tcl 9 keeps the character, so the two releases differ.
//
// Pure and deterministic; an input outside the lab's range is refused with a
// stable code; Tcl's own errors are part of the result, not refusals.
// ============================================================================

/** The longest line the lab reads. */
export const LINE_MAX = 200;

/** The lab's scalar variables, as `set` would have left them. */
export const VARIABLES: Readonly<Record<string, string>> = Object.freeze({
  // A documentation address (RFC 5737), the device to log in to.
  host: "192.0.2.10",
  // The account.
  user: "netops",
  // expect(1)'s own default prompt expression: set prompt "(%|#|\\$) $".
  prompt: "(%|#|\\$) $",
  // ssh options, for {*} expansion.
  sshopts: "-o StrictHostKeyChecking=accept-new -p 22",
});

/** The lab's arrays: the environment and what a previous expect left in expect_out. */
export const ARRAYS: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  // One environment variable.
  env: Object.freeze({ HOME: "/home/netops" }),
  // A subexpression a previous expect -re captured.
  expect_out: Object.freeze({ "1,string": "17.9.4" }),
});

/** Every command a fresh expect 5.45.4 on Tcl 8.6.14 knows (run r11: `info commands`, then the auto-loadable ones). */
export const KNOWN_COMMANDS: ReadonlySet<string> = new Set(
  (
    // info commands, global namespace.
    "_close.pre_expect after append apply array auto_execok auto_import auto_load auto_load_index auto_qualify binary break case catch cd chan clock close close_on_eof concat continue coroutine debug dict disconnect encoding eof error eval exec exit exp_close exp_close_on_eof exp_configure exp_continue exp_debug exp_disconnect exp_exit exp_fork exp_getpid exp_inter_return exp_interact exp_internal exp_interpreter exp_log_file exp_log_user exp_match_max exp_open exp_overlay exp_parity exp_pid exp_remove_nulls exp_send exp_send_error exp_send_log exp_send_tty exp_send_user exp_sleep exp_spawn exp_strace exp_stty exp_system exp_timestamp exp_trap exp_version exp_wait expect expect_after expect_background expect_before expect_tty expect_user expr fblocked fconfigure fcopy file fileevent flush for foreach fork format getpid gets glob global if incr info inter_return interact interp interpreter join lappend lassign lindex linsert list llength lmap load log_file log_user lrange lrepeat lreplace lreverse lsearch lset lsort match_max namespace open overlay package parity pid proc prompt1 prompt2 puts pwd read regexp regsub remove_nulls rename return scan seek send send_error send_log send_tty send_user set sleep socket source spawn split strace string stty subst switch system tailcall tclLog tell throw time timestamp trace trap try unknown unload unset update uplevel upvar variable vwait wait while yield yieldto zlib " +
    // Loaded by the unknown handler on first use (auto_index).
    "auto_mkindex auto_mkindex_old auto_reset history parray pkg_mkIndex tclPkgSetup tclPkgUnknown tcl_endOfWord tcl_findLibrary tcl_startOfNextWord tcl_startOfPreviousWord tcl_wordBreakAfter tcl_wordBreakBefore timerate"
  ).split(" "),
);

/** The reader's setting. */
export interface TclSubstInput {
  /** One line of Tcl. */
  line: string;
}

/** A piece of a word, in order. */
export type Part =
  // Literal characters as written.
  | { kind: "text"; text: string }
  // A backslash sequence and what it stands for.
  | { kind: "backslash"; raw: string; text: string }
  // A variable reference and its value.
  | { kind: "var"; raw: string; name: string; value: string }
  // A command substitution: its script and the command it names (null when the name itself is substituted).
  | { kind: "cmd"; raw: string; script: string; name: string | null };

/** One word as written and as substituted. */
export interface TclWord {
  /** How it was written. */
  written: "bare" | "quoted" | "braced";
  /** Whether it starts with {*} (rule 5). */
  expand: boolean;
  /** The word exactly as written, {*} included. */
  raw: string;
  /** The pieces, after substitution (a braced word is one text piece). */
  parts: Part[];
  /** The value, or null when it holds the result of a command the lab does not run. */
  value: string | null;
}

/** One argument the command receives, after expansion. */
export interface Arg {
  /** The value, or null when it is (or holds) the result of a command. */
  value: string | null;
  /** The index of the word it came from. */
  word: number;
  /** For an unexpandable {*} word: true (its words are those of a command's result). */
  unknownExpansion?: boolean;
}

/** Tcl's errors the model reproduces, by a stable code. */
export type TclErrorCode =
  | "missing-quote"
  | "missing-close-brace"
  | "missing-close-bracket"
  | "extra-after-quote"
  | "extra-after-brace"
  | "missing-varname-brace"
  | "missing-paren"
  | "no-such-variable"
  | "no-such-element"
  | "not-array"
  | "variable-is-array"
  | "invalid-command"
  | "list-brace-extra"
  | "list-quote-extra"
  | "list-unmatched-brace"
  | "list-unmatched-quote";

/** Tcl's error: its code, Tcl's own message, and the word it stopped in (null for a command lookup). */
export interface TclErrorOutcome {
  /** The code. */
  code: TclErrorCode;
  /** Tcl's message, exactly as Tcl 8.6.14 prints it. */
  message: string;
  /** The 0-based word Tcl was reading, or null. */
  word: number | null;
}

/** Notes the lab adds for Expect writers. */
export type NoteCode =
  | "braced-escape"
  | "braced-dollar"
  | "braced-bracket"
  | "send-ends-cr"
  | "send-ends-backslash-r"
  | "send-no-return"
  | "expect-one-line-block"
  | "rest-comment"
  | "rest-command";

/** The model's answer. */
export interface TclSubstResult {
  /** A command, a comment line, or nothing at all. */
  kind: "command" | "comment" | "empty";
  /** The words as Tcl split and substituted them (up to the error, when there is one). */
  words: TclWord[];
  /** What the command receives, after {*} expansion (empty after an error). */
  args: Arg[];
  /** The command's name (the first argument), when known. */
  command: string | null;
  /** Whether a fresh expect knows that command (null when the name is not known before running something). */
  commandKnown: boolean | null;
  /** Tcl's error, or null. */
  error: TclErrorOutcome | null;
  /** The notes, in order. */
  notes: { code: NoteCode; word?: number }[];
}

/** The stable codes an input is refused with. */
export type TclSubstErrorCode = "line-too-long" | "bad-char" | "not-modelled-unicode";

/** A refusal of the input. */
export class TclSubstError extends Error {
  /** The stable code. */
  readonly code: TclSubstErrorCode;
  /** Build it. */
  constructor(code: TclSubstErrorCode) {
    // The message for developers.
    super(code);
    // The code.
    this.code = code;
  }
}

/** Tcl's error, thrown inside the reader and caught in compute(). */
class TclStop extends Error {
  /** The outcome. */
  readonly outcome: TclErrorOutcome;
  /** Build it. */
  constructor(code: TclErrorCode, message: string, word: number | null) {
    // The message.
    super(message);
    // The outcome.
    this.outcome = { code, message, word };
  }
}

/** Tcl's word-separating white space (newline excepted): space, tab, vertical tab, form feed, carriage return. */
function isSpace(c: string | undefined): boolean {
  // The five characters.
  return c === " " || c === "\t" || c === "\v" || c === "\f" || c === "\r";
}

/** A character allowed in a $name: ASCII letter, digit or underscore (rule 8). */
function isNameChar(c: string | undefined): boolean {
  // The ASCII set only.
  return c !== undefined && /^[A-Za-z0-9_]$/.test(c);
}

/** A hexadecimal digit. */
function isHex(c: string | undefined): boolean {
  // 0-9, a-f, A-F.
  return c !== undefined && /^[0-9a-fA-F]$/.test(c);
}

/** The parsed form of a piece before evaluation. */
type RawPart =
  | { kind: "text"; text: string }
  | { kind: "backslash"; raw: string; text: string }
  | { kind: "var"; raw: string; name: string; index: RawPart[] | null }
  | { kind: "cmd"; raw: string; script: string; commands: RawCommand[] };

/** A parsed word before evaluation. */
interface RawWord {
  /** How it was written. */
  written: "bare" | "quoted" | "braced";
  /** {*} in front. */
  expand: boolean;
  /** As written. */
  raw: string;
  /** Its pieces. */
  parts: RawPart[];
}

/** A parsed command before evaluation. */
interface RawCommand {
  /** Its words. */
  words: RawWord[];
}

/** Rule 9: the backslash sequence starting at s[i] (a backslash): what it stands for, as written, and where it ends. */
function backslashAt(s: string, i: number): { raw: string; text: string; next: number } {
  // The character after the backslash.
  const c = s[i + 1];
  // A backslash at the very end stands for itself.
  if (c === undefined) return { raw: "\\", text: "\\", next: i + 1 };
  // The single-letter escapes.
  const simple: Record<string, string> = { a: "\x07", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v" };
  if (c in simple) return { raw: s.slice(i, i + 2), text: simple[c], next: i + 2 };
  // \ooo: one to three octal digits, stopping before the value passes 0377 (run r13: \400 is a space and a 0).
  if (/[0-7]/.test(c)) {
    let j = i + 1;
    let v = 0;
    while (j < i + 4 && /[0-7]/.test(s[j] ?? "") && v * 8 + Number(s[j]) <= 0o377) {
      v = v * 8 + Number(s[j]);
      j++;
    }
    return { raw: s.slice(i, j), text: String.fromCharCode(v), next: j };
  }
  // \xhh (one or two digits), \uhhhh (one to four), \Uhhhhhhhh (one to eight, below U+110000); no digit means the letter.
  if (c === "x" || c === "u" || c === "U") {
    // How many digits each form takes.
    const most = c === "x" ? 2 : c === "u" ? 4 : 8;
    let j = i + 2;
    let v = 0;
    while (j < i + 2 + most && isHex(s[j]) && (c !== "U" || v * 16 + parseInt(s[j], 16) <= 0x10ffff)) {
      v = v * 16 + parseInt(s[j], 16);
      j++;
    }
    // No digits: the letter itself.
    if (j === i + 2) return { raw: s.slice(i, i + 2), text: c, next: i + 2 };
    // Above U+FFFF Tcl 8.6.14 and Tcl 9 differ (run r13): refused.
    if (v > 0xffff) throw new TclSubstError("not-modelled-unicode");
    return { raw: s.slice(i, j), text: String.fromCharCode(v), next: j };
  }
  // Any other character: the backslash is dropped.
  return { raw: s.slice(i, i + 2), text: c, next: i + 2 };
}

/** The reader: Tcl's parsing rules over one line (Tcl_ParseCommand's behaviour, from Tcl(n)). */
class Reader {
  /** The source. */
  private readonly s: string;
  /** The cursor. */
  i = 0;
  /** The word being read at the top level (for error positions). */
  topWord = 0;
  /** Nesting of command substitutions. */
  private depth = 0;

  /** Start on a line. */
  constructor(s: string) {
    // The source.
    this.s = s;
  }

  /** Stop with Tcl's error. */
  private stop(code: TclErrorCode, message: string): never {
    // Thrown, caught in compute().
    throw new TclStop(code, message, this.topWord);
  }

  /** Skip white space (not newlines). */
  private skipSpace(): void {
    // Rule 3's separators.
    while (isSpace(this.s[this.i])) this.i++;
  }

  /** True at a place where a word ends: the end, white space, ";" or "]" inside brackets. */
  private atWordEnd(): boolean {
    // The character there.
    const c = this.s[this.i];
    // End, separator, command end, or the bracket that closes a substitution.
    return c === undefined || isSpace(c) || c === ";" || c === "\n" || (this.depth > 0 && c === "]");
  }

  /** Skip leading white space, empty commands and comments; return what kind of start was found. */
  skipToCommand(): "command" | "comment" | "end" {
    while (true) {
      // White space, newlines and ";" before a command.
      while (isSpace(this.s[this.i]) || this.s[this.i] === "\n" || this.s[this.i] === ";") this.i++;
      // Nothing left.
      if (this.i >= this.s.length || (this.depth > 0 && this.s[this.i] === "]")) return "end";
      // Rule 10: a # where a command starts begins a comment to the end of the line.
      if (this.s[this.i] === "#") {
        // Inside brackets, skip the comment and keep looking.
        if (this.depth > 0) {
          while (this.i < this.s.length && this.s[this.i] !== "\n") this.i++;
          continue;
        }
        return "comment";
      }
      // A command.
      return "command";
    }
  }

  /** Read one command's words, stopping at its end. */
  readCommand(): RawCommand {
    // The words.
    const words: RawWord[] = [];
    while (true) {
      // Between words.
      this.skipSpace();
      // The command ends at the end, a newline, ";" or a closing bracket of a substitution.
      const c = this.s[this.i];
      if (c === undefined || c === "\n" || c === ";" || (this.depth > 0 && c === "]")) break;
      // The word's number at the top level.
      if (this.depth === 0) this.topWord = words.length;
      // One word.
      words.push(this.readWord());
    }
    // Done.
    return { words };
  }

  /** Read one word. */
  private readWord(): RawWord {
    // Where it starts.
    const from = this.i;
    // Rule 5: {*} followed by a non-white-space character.
    let expand = false;
    if (this.s.startsWith("{*}", this.i) && this.s[this.i + 3] !== undefined && !isSpace(this.s[this.i + 3]) && this.s[this.i + 3] !== "\n") {
      expand = true;
      this.i += 3;
    }
    // The first character decides the form.
    const c = this.s[this.i];
    let written: RawWord["written"];
    let parts: RawPart[];
    if (c === "{") {
      // Rule 6: braces.
      written = "braced";
      parts = [{ kind: "text", text: this.readBraced() }];
    } else if (c === '"') {
      // Rule 4: double quotes.
      written = "quoted";
      parts = this.readQuoted();
    } else {
      // A bare word.
      written = "bare";
      parts = this.readParts((ch) => ch === undefined || isSpace(ch) || ch === ";" || ch === "\n" || (this.depth > 0 && ch === "]"));
    }
    // The word as written.
    return { written, expand, raw: this.s.slice(from, this.i), parts };
  }

  /** Rule 6: the content between matching braces, the cursor on "{". */
  private readBraced(): string {
    // Past "{".
    const start = ++this.i;
    // Nesting.
    let level = 1;
    while (this.i < this.s.length) {
      // The character.
      const ch = this.s[this.i];
      // A backslash-quoted brace is not counted.
      if (ch === "\\") {
        this.i += 2;
        continue;
      }
      // Count braces.
      if (ch === "{") level++;
      else if (ch === "}") {
        level--;
        // The matching close.
        if (level === 0) {
          // The content, exactly (backslash-newline cannot occur on one line).
          const text = this.s.slice(start, this.i);
          // Past "}".
          this.i++;
          // Only a word end may follow.
          if (!this.atWordEnd()) this.stop("extra-after-brace", "extra characters after close-brace");
          return text;
        }
      }
      this.i++;
    }
    // Ran off the end.
    return this.stop("missing-close-brace", "missing close-brace");
  }

  /** Rule 4: a quoted word's pieces, the cursor on the opening quote. */
  private readQuoted(): RawPart[] {
    // Past the quote.
    this.i++;
    // The pieces up to the next unescaped quote (a quote inside [..] belongs to the inner script).
    const parts = this.readParts((ch) => ch === undefined || ch === '"');
    // No closing quote.
    if (this.s[this.i] !== '"') this.stop("missing-quote", 'missing "');
    // Past it.
    this.i++;
    // Only a word end may follow.
    if (!this.atWordEnd()) this.stop("extra-after-quote", "extra characters after close-quote");
    // Done.
    return parts;
  }

  /** Read pieces until `end` says stop: text, backslashes, $variables and [commands]. */
  private readParts(end: (ch: string | undefined) => boolean): RawPart[] {
    // The pieces.
    const parts: RawPart[] = [];
    // Literal text gathered so far.
    let text = "";
    // Flush the literal text into a piece.
    const flush = () => {
      if (text) parts.push({ kind: "text", text });
      text = "";
    };
    while (!end(this.s[this.i])) {
      // The character.
      const ch = this.s[this.i];
      if (ch === "\\") {
        // Rule 9.
        flush();
        parts.push(this.readBackslash());
      } else if (ch === "$") {
        // Rule 8, or a lone dollar.
        const v = this.readDollar();
        if (v) {
          flush();
          parts.push(v);
        } else {
          text += "$";
          this.i++;
        }
      } else if (ch === "[") {
        // Rule 7.
        flush();
        parts.push(this.readBracket());
      } else {
        // An ordinary character.
        text += ch;
        this.i++;
      }
    }
    // The last text.
    flush();
    // Done.
    return parts;
  }

  /** Rule 9: one backslash sequence, the cursor on the backslash. */
  private readBackslash(): RawPart {
    // The sequence and where it ends.
    const b = backslashAt(this.s, this.i);
    // Past it.
    this.i = b.next;
    // The piece.
    return { kind: "backslash", raw: b.raw, text: b.text };
  }

  /** Rule 8: a variable reference at "$", or null when the dollar is literal. */
  private readDollar(): RawPart | null {
    // Where it starts.
    const from = this.i;
    // The character after the dollar.
    const c = this.s[this.i + 1];
    // ${name}: anything up to "}", no substitution.
    if (c === "{") {
      const close = this.s.indexOf("}", this.i + 2);
      if (close < 0) this.stop("missing-varname-brace", "missing close-brace for variable name");
      const name = this.s.slice(this.i + 2, close);
      this.i = close + 1;
      // name(index) inside braces names an array element.
      const m = /^([^(}]*)\(([^}]*)\)$/.exec(name);
      if (m) return { kind: "var", raw: this.s.slice(from, this.i), name: m[1], index: [{ kind: "text", text: m[2] }] };
      return { kind: "var", raw: this.s.slice(from, this.i), name, index: null };
    }
    // $name: letters, digits, underscores and "::" separators.
    let j = this.i + 1;
    while (true) {
      if (isNameChar(this.s[j])) j++;
      else if (this.s[j] === ":" && this.s[j + 1] === ":") {
        // Two or more colons are a separator.
        while (this.s[j] === ":") j++;
      } else break;
    }
    // An empty name is allowed only before "(" (the array with the empty name).
    if (j === this.i + 1 && this.s[j] !== "(") return null;
    const name = this.s.slice(this.i + 1, j);
    this.i = j;
    // $name(index): the index is substituted.
    if (this.s[this.i] === "(") {
      this.i++;
      const index = this.readParts((ch) => ch === undefined || ch === ")");
      if (this.s[this.i] !== ")") this.stop("missing-paren", "missing )");
      this.i++;
      return { kind: "var", raw: this.s.slice(from, this.i), name, index };
    }
    // A scalar.
    return { kind: "var", raw: this.s.slice(from, this.i), name, index: null };
  }

  /** Rule 7: a command substitution, the cursor on "[". */
  private readBracket(): RawPart {
    // Where it starts.
    const from = this.i;
    // Past "[".
    this.i++;
    // One level deeper.
    this.depth++;
    // The script's commands.
    const commands: RawCommand[] = [];
    while (true) {
      // The next command (comments and empty commands skipped).
      const k = this.skipToCommand();
      if (k === "end") break;
      commands.push(this.readCommand());
    }
    // It must close.
    if (this.s[this.i] !== "]") this.stop("missing-close-bracket", "missing close-bracket");
    // Back out.
    this.depth--;
    this.i++;
    // The piece.
    return { kind: "cmd", raw: this.s.slice(from, this.i), script: this.s.slice(from + 1, this.i - 1), commands };
  }
}

/** Look a variable up in the lab's set; throw Tcl's error when it is not there. */
function lookup(name: string, index: string | null, word: number | null): string {
  // "::name" is the global name.
  const n = name.startsWith("::") ? name.slice(2) : name;
  if (index === null) {
    // A scalar.
    if (n in VARIABLES) return VARIABLES[n];
    // An array read as a scalar.
    if (n in ARRAYS) throw new TclStop("variable-is-array", `can't read "${name}": variable is array`, word);
    // Nothing.
    throw new TclStop("no-such-variable", `can't read "${name}": no such variable`, word);
  }
  // An element.
  if (n in ARRAYS) {
    const arr = ARRAYS[n];
    if (index in arr) return arr[index];
    // env is traced by Tcl: a missing environment variable reads as "no such variable" (run: $env(X)).
    if (n === "env") throw new TclStop("no-such-variable", `can't read "${name}(${index})": no such variable`, word);
    throw new TclStop("no-such-element", `can't read "${name}(${index})": no such element in array`, word);
  }
  // A scalar used as an array.
  if (n in VARIABLES) throw new TclStop("not-array", `can't read "${name}(${index})": variable isn't array`, word);
  // Nothing.
  throw new TclStop("no-such-variable", `can't read "${name}(${index})": no such variable`, word);
}

/** Evaluate pieces left to right (rule 11): the pieces with values, and the value (null when a command result is in it). */
function evalParts(raw: RawPart[], word: number | null): { parts: Part[]; value: string | null } {
  // The evaluated pieces.
  const parts: Part[] = [];
  // The value, or null once a command result enters it.
  let value: string | null = "";
  for (const p of raw) {
    if (p.kind === "text" || p.kind === "backslash") {
      // Literal and backslash pieces as they are.
      parts.push(p);
      if (value !== null) value += p.text;
    } else if (p.kind === "var") {
      // The index first (it may hold substitutions), then the lookup.
      let index: string | null = null;
      if (p.index) {
        const ev = evalParts(p.index, word);
        // An index made by a command: the lab cannot know which element.
        if (ev.value === null) {
          parts.push({ kind: "var", raw: p.raw, name: p.name, value: "" });
          value = null;
          continue;
        }
        index = ev.value;
      }
      // The value.
      const v = lookup(p.name, index, word);
      parts.push({ kind: "var", raw: p.raw, name: index === null ? p.name : `${p.name}(${index})`, value: v });
      if (value !== null) value += v;
    } else {
      // A command substitution: its commands' words are substituted and each command looked up, never run.
      let name: string | null = null;
      for (const cmd of p.commands) {
        // Each word, left to right.
        const vals = cmd.words.map((w) => evalParts(w.parts, word).value);
        // The command's name, when it is known without running anything.
        const first = vals.length ? vals[0] : null;
        // An unknown command stops Tcl here.
        if (first !== null && cmd.words.length && !cmd.words[0].expand && !KNOWN_COMMANDS.has(first)) throw new TclStop("invalid-command", `invalid command name "${first}"`, word);
        // The first command names the piece.
        if (name === null && first !== null) name = first;
      }
      parts.push({ kind: "cmd", raw: p.raw, script: p.script, name });
      value = null;
    }
  }
  // Done.
  return { parts, value };
}

/** Rule 5's list reading: a value's elements, or Tcl's error. */
export function splitList(v: string, word: number | null): string[] {
  // Tcl's list white space.
  const ws = (c: string | undefined) => c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\v" || c === "\f";
  // The elements.
  const out: string[] = [];
  let i = 0;
  while (true) {
    // Between elements.
    while (ws(v[i])) i++;
    if (i >= v.length) break;
    if (v[i] === "{") {
      // Braced: to the matching brace, backslash-quoted braces not counted, content kept as is.
      let level = 1;
      let j = i + 1;
      while (j < v.length && level > 0) {
        if (v[j] === "\\") j += 2;
        else {
          if (v[j] === "{") level++;
          else if (v[j] === "}") level--;
          j++;
        }
      }
      if (level > 0) throw new TclStop("list-unmatched-brace", "unmatched open brace in list", word);
      if (j < v.length && !ws(v[j])) throw new TclStop("list-brace-extra", `list element in braces followed by "${v.slice(j, j + 1)}" instead of space`, word);
      out.push(v.slice(i + 1, j - 1));
      i = j;
    } else if (v[i] === '"') {
      // Quoted: to the next quote, backslashes substituted.
      const close = findListQuote(v, i + 1);
      if (close < 0) throw new TclStop("list-unmatched-quote", "unmatched open quote in list", word);
      if (close + 1 < v.length && !ws(v[close + 1])) throw new TclStop("list-quote-extra", `list element in quotes followed by "${v.slice(close + 1, close + 2)}" instead of space`, word);
      out.push(backslashes(v.slice(i + 1, close)));
      i = close + 1;
    } else {
      // Bare: to white space, backslashes substituted (a backslash protects the next character).
      let j = i;
      while (j < v.length && !ws(v[j])) j += v[j] === "\\" ? 2 : 1;
      out.push(backslashes(v.slice(i, Math.min(j, v.length))));
      i = j;
    }
  }
  // Done.
  return out;
}

/** The position of the quote that closes a list element (a backslash protects the next character), or -1. */
function findListQuote(v: string, from: number): number {
  // Scan.
  for (let j = from; j < v.length; j++) {
    if (v[j] === "\\") j++;
    else if (v[j] === '"') return j;
  }
  // None.
  return -1;
}

/** Backslash substitution alone (for list elements), by rule 9. */
function backslashes(t: string): string {
  // The result.
  let out = "";
  // The cursor.
  let i = 0;
  while (i < t.length) {
    if (t[i] === "\\") {
      // The sequence's value.
      const b = backslashAt(t, i);
      out += b.text;
      i = b.next;
    } else {
      // An ordinary character.
      out += t[i];
      i++;
    }
  }
  // Done.
  return out;
}

/** Make control characters visible: \r, \n, \t and \xNN; printable characters as they are. */
export function visible(text: string): string {
  // Each control character (and DEL) becomes its escape.
  return text.replace(/[\x00-\x1f\x7f]/g, (c) => (c === "\r" ? "\\r" : c === "\n" ? "\\n" : c === "\t" ? "\\t" : "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0")));
}

/** Read one line. */
export function compute(input: TclSubstInput): TclSubstResult {
  // The line's size.
  if (typeof input.line !== "string" || input.line.length > LINE_MAX) throw new TclSubstError("line-too-long");
  // Printable ASCII and tab only (a line typed in one field).
  if (/[^\t\x20-\x7e]/.test(input.line)) throw new TclSubstError("bad-char");
  // The reader.
  const r = new Reader(input.line);
  // The answer being built.
  const result: TclSubstResult = { kind: "empty", words: [], args: [], command: null, commandKnown: null, error: null, notes: [] };
  // What starts the line.
  const start = r.skipToCommand();
  if (start === "end") return result;
  if (start === "comment") {
    result.kind = "comment";
    return result;
  }
  result.kind = "command";
  // Parse the first command (syntax errors stop here, before any substitution, as in Tcl).
  let cmd: RawCommand;
  try {
    cmd = r.readCommand();
  } catch (e) {
    if (e instanceof TclStop) {
      result.error = e.outcome;
      return result;
    }
    throw e;
  }
  // What follows the first command.
  if (r.i < input.line.length) {
    // Past the ";".
    const rest = input.line.slice(r.i + 1).trimStart();
    if (rest !== "") result.notes.push({ code: rest.startsWith("#") ? "rest-comment" : "rest-command" });
  }
  // Substitute each word, left to right; stop at Tcl's first error.
  try {
    cmd.words.forEach((w, i) => {
      // The word after substitution: a braced word is its text, unsubstituted; quoted and bare words are substituted.
      let word: TclWord;
      if (w.written === "braced") {
        const text = (w.parts[0] as { text: string }).text;
        word = { written: w.written, expand: w.expand, raw: w.raw, parts: [{ kind: "text", text }], value: text };
      } else {
        const ev = evalParts(w.parts, i);
        word = { written: w.written, expand: w.expand, raw: w.raw, parts: ev.parts, value: ev.value };
      }
      result.words.push(word);
      // A plain word is one argument.
      if (!word.expand) {
        result.args.push({ value: word.value, word: i });
        return;
      }
      // Rule 5, word by word in order (a list error stops Tcl before later words are substituted): a command result
      // cannot be expanded without running the command.
      if (word.value === null) {
        result.args.push({ value: null, word: i, unknownExpansion: true });
        return;
      }
      for (const el of splitList(word.value, i)) result.args.push({ value: el, word: i });
    });
    // The command's name and whether Tcl knows it.
    if (result.args.length) {
      const first = result.args[0];
      result.command = first.value;
      result.commandKnown = first.value === null ? null : KNOWN_COMMANDS.has(first.value);
      // An unknown command is Tcl's last error, after every substitution.
      if (first.value !== null && !result.commandKnown) result.error = { code: "invalid-command", message: `invalid command name "${first.value}"`, word: null };
    }
  } catch (e) {
    if (e instanceof TclStop) {
      result.error = e.outcome;
      result.args = [];
    } else throw e;
  }
  // Notes on braced words.
  result.words.forEach((w, i) => {
    if (w.written !== "braced") return;
    const t = w.value ?? "";
    if (/\\[rnt]/.test(t)) result.notes.push({ code: "braced-escape", word: i });
    if (/\$[A-Za-z0-9_{:(]/.test(t)) result.notes.push({ code: "braced-dollar", word: i });
    if (t.includes("[")) result.notes.push({ code: "braced-bracket", word: i });
  });
  // Notes on send: what the last argument ends with.
  if (!result.error && (result.command === "send" || result.command === "exp_send") && result.args.length >= 2) {
    const last = result.args[result.args.length - 1];
    if (last.value !== null) {
      if (/[\r\n]$/.test(last.value)) result.notes.push({ code: "send-ends-cr", word: last.word });
      else if (/\\r$/.test(last.value)) result.notes.push({ code: "send-ends-backslash-r", word: last.word });
      else result.notes.push({ code: "send-no-return", word: last.word });
    }
  }
  // The one-argument braced form on one line: Expect reads it as one pattern (exp_one_arg_braced, run r09 test 3d).
  if (!result.error && result.command === "expect" && result.words.length === 2 && result.words[1].written === "braced" && !result.words[1].expand) result.notes.push({ code: "expect-one-line-block", word: 1 });
  // Done.
  return result;
}

/** The lab's opening state: a send in double quotes, which substitutes the variable and the return. */
export const DEFAULT_INPUT: TclSubstInput = { line: 'send "$user\\r"' };

/** The Example: the quoted pattern whose brackets Tcl runs as a command. */
export const EXAMPLE_INPUT: TclSubstInput = { line: 'expect -re "[Pp]assword: $"' };

/** The lines the lab offers in its menu of cases, each one rule. */
export const PRESETS: readonly string[] = Object.freeze([
  'send "$user\\r"',
  "send {$user\\r}",
  'expect -re "[Pp]assword: $"',
  "expect -re {[Pp]assword: $}",
  "spawn ssh $user@$host",
  'puts "${user}_backup"',
  'puts "$user_backup"',
  "spawn ssh {*}$sshopts $host",
  "expect -re $prompt",
  'send "version $expect_out(1,string)\\r"',
  'set x "a"b',
  "puts ok # not a comment",
  'send "\\x41\\x42\\101\\r"',
  "expect { -re {[>#] $} { send \"exit\\r\" } }",
]);
