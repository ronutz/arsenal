// ============================================================================
// src/lib/tcl84/parse.ts
// ----------------------------------------------------------------------------
// TCL 8.4 SCRIPT PARSER - the rules that decide what a line of an iRule MEANS
// before any command runs.
//
// Tcl's whole syntax is a dozen rules (the Tcl(n) manual page). They are short,
// and nearly every surprise an iRule writer meets comes from one of them:
//
//   * words are separated by white space; a newline or ";" ends a command;
//   * "double quotes" group a word and still substitute $variables,
//     [commands] and \backslashes inside it;
//   * {braces} group a word and substitute NOTHING (except backslash-newline),
//     which is why scan formats and expr expressions are usually braced;
//   * [brackets] run a command and put its result in place;
//   * $name puts a variable's value in place;
//   * # starts a comment only where a command could start.
//
// The parser produces a structured view (commands, words, and the parts each
// word is built from) so the teaching tools can SHOW how a line was read, not
// just what it produced. It never runs anything: evaluation is interp.ts.
//
// Character classes and error messages follow tclParse.c in Tcl 8.4.6, the base
// F5 names for iRules (K6091). Array variables ($name(index)) are recognised
// and reported, not modelled: the teaching tools do not need them, and a tool
// that half-supported them would mislead.
// ============================================================================

/** A piece of a word: literal text, a variable reference, or a nested command. */
export type Part =
  // Literal text, already backslash-substituted where Tcl would do so.
  | { kind: "text"; text: string }
  // A $variable reference; `raw` is how it was written.
  | { kind: "var"; name: string; raw: string }
  // A [command] substitution; `script` is the text between the brackets.
  | { kind: "cmd"; script: string; raw: string };

/** One word of a command and how it was quoted. */
export interface Word {
  // "bare": unquoted; "quoted": in double quotes; "braced": in braces.
  kind: "bare" | "quoted" | "braced";
  // The parts the word's value is assembled from.
  parts: Part[];
  // The word exactly as written, quotes or braces included.
  raw: string;
  // Character offset where the word starts in the parsed source.
  start: number;
  // Character offset just after the word.
  end: number;
}

/** One command: its words and where it sits in the source. */
export interface Command {
  // The words, command name first.
  words: Word[];
  // Offset of the first character of the first word.
  start: number;
  // Offset just after the last word.
  end: number;
  // 1-based line number of the first word.
  line: number;
}

/** A syntax error, with the offset where the parser stopped. */
export class TclParseError extends Error {
  /** Offset in the source where the problem was found. */
  readonly pos: number;
  /** Build the error with Tcl's own wording. */
  constructor(message: string, pos: number) {
    // Error carries the message.
    super(message);
    // Keep the offset for highlighting.
    this.pos = pos;
    // A stable name for instanceof-free checks.
    this.name = "TclParseError";
  }
}

/** Tcl's word-separating white space (TYPE_SPACE in tclParse.c). */
export function isWordSpace(ch: string | undefined): boolean {
  // Space, tab, vertical tab, form feed and carriage return; NOT newline.
  return ch === " " || ch === "\t" || ch === "\v" || ch === "\f" || ch === "\r";
}

/** True for a character allowed in a bare $variable name. */
function isVarNameChar(ch: string | undefined): boolean {
  // Letters, digits and underscore (the "::" separator is handled separately).
  return ch !== undefined && /^[A-Za-z0-9_]$/.test(ch);
}

/** True for a hexadecimal digit. */
function isHex(ch: string | undefined): boolean {
  // The digits strtol-style hex parsing accepts.
  return ch !== undefined && /^[0-9a-fA-F]$/.test(ch);
}

/**
 * Decode one backslash sequence starting at src[i] (which is the backslash),
 * exactly as TclParseBackslash does in Tcl 8.4.6. Returns the text it stands
 * for and how many source characters it used.
 */
export function backslashAt(src: string, i: number): { text: string; length: number } {
  // The character after the backslash.
  const c = src[i + 1];
  // A backslash at the very end stands for itself.
  if (c === undefined) return { text: "\\", length: 1 };
  // The single-letter escapes.
  const simple: Record<string, string> = { a: "\x07", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v" };
  // One of the C-style control characters.
  if (c in simple) return { text: simple[c], length: 2 };
  // \x: any number of hex digits; only the last two count (one byte).
  if (c === "x") {
    // Count the hex digits.
    let j = i + 2;
    // Consume all of them.
    while (isHex(src[j])) j++;
    // No digits: the sequence is just the letter x.
    if (j === i + 2) return { text: "x", length: 2 };
    // Keep the low byte of the accumulated value, as the C cast does.
    const value = parseInt(src.slice(Math.max(i + 2, j - 2), j), 16);
    // One character in the 0-255 range.
    return { text: String.fromCharCode(value), length: j - i };
  }
  // \u: one to four hex digits give a 16-bit character.
  if (c === "u") {
    // Count up to four hex digits.
    let j = i + 2;
    // Consume at most four.
    while (j < i + 6 && isHex(src[j])) j++;
    // No digits: the sequence is just the letter u.
    if (j === i + 2) return { text: "u", length: 2 };
    // The 16-bit code unit.
    return { text: String.fromCharCode(parseInt(src.slice(i + 2, j), 16)), length: j - i };
  }
  // Backslash-newline, plus any following spaces and tabs, becomes one space.
  if (c === "\n") {
    // Skip the newline and the leading white space of the next line.
    let j = i + 2;
    // Only spaces and tabs are swallowed.
    while (src[j] === " " || src[j] === "\t") j++;
    // A single space replaces the whole run.
    return { text: " ", length: j - i };
  }
  // \ooo: one to three octal digits, truncated to one byte.
  if (c >= "0" && c <= "7") {
    // Collect up to three octal digits.
    let j = i + 1;
    // The accumulated value.
    let v = 0;
    // At most three digits, each 0-7.
    while (j < i + 4 && src[j] !== undefined && src[j] >= "0" && src[j] <= "7") v = v * 8 + (src.charCodeAt(j++) - 48);
    // The C code keeps one byte.
    return { text: String.fromCharCode(v & 0xff), length: j - i };
  }
  // Any other character stands for itself (the backslash is dropped).
  return { text: c, length: 2 };
}

/** Options a caller may pass; every default keeps the iRules tools' behaviour. */
export interface ParseOptions {
  /**
   * Accept array references ($name(index)) as variable parts whose name carries the
   * index text, e.g. name "env(HOME)". Off by default: the iRules tools report arrays
   * as unmodelled (their teaching interpreter has no arrays). The Expect explainer
   * turns it on, since $env(...) and $expect_out(buffer) appear in nearly every script.
   */
  arrays?: boolean;
}

/** Internal parser state over one source string. */
class Parser {
  /** The source text being parsed. */
  readonly src: string;
  /** Current offset. */
  pos = 0;
  /** Whether $name(index) is accepted (see ParseOptions.arrays). */
  readonly arrays: boolean;
  /** Create a parser over the given text. */
  constructor(src: string, opts: ParseOptions = {}) {
    // Keep the source.
    this.src = src;
    // Arrays are refused unless asked for.
    this.arrays = opts.arrays === true;
  }

  /** The character at the current offset (undefined at the end). */
  peek(off = 0): string | undefined {
    // Plain indexing; undefined past the end.
    return this.src[this.pos + off];
  }

  /** 1-based line number of an offset, for traces and messages. */
  lineOf(offset: number): number {
    // Count newlines before the offset.
    let line = 1;
    // Walk the prefix.
    for (let k = 0; k < offset; k++) if (this.src[k] === "\n") line++;
    // The line the offset is on.
    return line;
  }

  /**
   * Parse a script: a sequence of commands. When `nested` is true the script
   * is inside [brackets] and ends at the matching "]".
   */
  parseScript(nested: boolean): Command[] {
    // The commands found.
    const commands: Command[] = [];
    // Loop over commands.
    for (;;) {
      // Skip white space, command separators and comments between commands.
      this.skipCommandGap();
      // End of input.
      if (this.pos >= this.src.length) {
        // Inside brackets, reaching the end means the "]" is missing.
        if (nested) throw new TclParseError("missing close-bracket", this.pos);
        // Otherwise the script is complete.
        return commands;
      }
      // A "]" ends a nested script.
      if (nested && this.peek() === "]") return commands;
      // Parse one command.
      const cmd = this.parseCommand(nested);
      // Keep non-empty commands.
      if (cmd.words.length) commands.push(cmd);
    }
  }

  /** Skip white space, newlines, ";" and comments before a command. */
  skipCommandGap(): void {
    // Loop while something skippable is found.
    for (;;) {
      // The current character.
      const c = this.peek();
      // Word space and command separators are skipped here.
      if (isWordSpace(c) || c === "\n" || c === ";") {
        // Step over it.
        this.pos++;
        // Keep going.
        continue;
      }
      // Backslash-newline counts as white space.
      if (c === "\\" && this.peek(1) === "\n") {
        // Skip it and the indentation after it.
        this.pos += backslashAt(this.src, this.pos).length;
        // Keep going.
        continue;
      }
      // A "#" where a command could start is a comment to the end of the line.
      if (c === "#") {
        // Read to an unescaped newline; backslash-newline continues the comment.
        while (this.pos < this.src.length && this.peek() !== "\n") {
          // A backslash skips the next character, newline included.
          if (this.peek() === "\\") this.pos += 2;
          // Otherwise one character.
          else this.pos++;
        }
        // Keep going after the comment.
        continue;
      }
      // Anything else starts a command.
      return;
    }
  }

  /** Parse one command's words, up to a newline, ";", the end, or "]". */
  parseCommand(nested: boolean): Command {
    // The words of this command.
    const words: Word[] = [];
    // Where the command starts.
    const start = this.pos;
    // Loop over words.
    for (;;) {
      // Skip white space between words (backslash-newline included).
      while (isWordSpace(this.peek()) || (this.peek() === "\\" && this.peek(1) === "\n")) {
        // Backslash-newline is skipped as a unit.
        if (this.peek() === "\\") this.pos += backslashAt(this.src, this.pos).length;
        // A plain space character.
        else this.pos++;
      }
      // The character that starts the next word, or ends the command.
      const c = this.peek();
      // End of input, newline or ";" end the command.
      if (c === undefined || c === "\n" || c === ";") break;
      // Inside brackets, "]" ends the command too.
      if (nested && c === "]") break;
      // Parse the word according to its first character.
      words.push(c === '"' ? this.parseQuoted(nested) : c === "{" ? this.parseBraced(nested) : this.parseBare(nested));
    }
    // The command, with its location.
    return { words, start, end: this.pos, line: this.lineOf(start) };
  }

  /** After a closing quote or brace the word must end. */
  checkWordEnd(nested: boolean, what: "quote" | "brace"): void {
    // The character right after the close.
    const c = this.peek();
    // White space, a command end, or (nested) "]" may follow.
    if (c === undefined || isWordSpace(c) || c === "\n" || c === ";" || (nested && c === "]")) return;
    // Backslash-newline is white space as well.
    if (c === "\\" && this.peek(1) === "\n") return;
    // Anything else is Tcl's "extra characters" error.
    throw new TclParseError(`extra characters after close-${what}`, this.pos);
  }

  /** Parse a word in double quotes (`checkEnd` false inside expressions). */
  parseQuoted(nested: boolean, checkEnd = true): Word {
    // Where the word starts (at the opening quote).
    const start = this.pos;
    // Step over the opening quote.
    this.pos++;
    // Substituting parts, up to the closing quote.
    const parts = this.parseParts((ch) => ch === '"');
    // The closing quote must be there.
    if (this.peek() !== '"') throw new TclParseError('missing "', start);
    // Step over it.
    this.pos++;
    // In a command the word must end here; an expression has no such rule.
    if (checkEnd) this.checkWordEnd(nested, "quote");
    // The finished word.
    return { kind: "quoted", parts, raw: this.src.slice(start, this.pos), start, end: this.pos };
  }

  /** Parse a word in braces: no substitution except backslash-newline. */
  parseBraced(nested: boolean, checkEnd = true): Word {
    // Where the word starts (at the opening brace).
    const start = this.pos;
    // Step over the opening brace.
    this.pos++;
    // Brace nesting depth.
    let depth = 1;
    // The literal text collected.
    let text = "";
    // Scan to the matching close brace.
    for (;;) {
      // The current character.
      const c = this.peek();
      // Running out of text means the brace was never closed.
      if (c === undefined) throw new TclParseError("missing close-brace", start);
      // A backslash: the next character never counts as a brace.
      if (c === "\\") {
        // Backslash-newline is replaced by a single space even in braces.
        if (this.peek(1) === "\n") {
          // Decode the sequence.
          const b = backslashAt(this.src, this.pos);
          // One space.
          text += b.text;
          // Skip it.
          this.pos += b.length;
          // Next character.
          continue;
        }
        // Any other backslash pair is kept literally.
        text += c + (this.peek(1) ?? "");
        // Skip both characters.
        this.pos += this.peek(1) === undefined ? 1 : 2;
        // Next character.
        continue;
      }
      // An opening brace nests.
      if (c === "{") depth++;
      // A closing brace un-nests.
      if (c === "}") {
        // One level up.
        depth--;
        // The matching brace ends the word.
        if (depth === 0) {
          // Step over it.
          this.pos++;
          // In a command the word must end here; an expression has no such rule.
          if (checkEnd) this.checkWordEnd(nested, "brace");
          // The finished word.
          return { kind: "braced", parts: [{ kind: "text", text }], raw: this.src.slice(start, this.pos), start, end: this.pos };
        }
      }
      // Ordinary character.
      text += c;
      // Advance.
      this.pos++;
    }
  }

  /** Parse an unquoted word. */
  parseBare(nested: boolean): Word {
    // Where the word starts.
    const start = this.pos;
    // The word ends at white space, a command end, or (nested) "]".
    const parts = this.parseParts((ch) => ch === undefined || isWordSpace(ch) || ch === "\n" || ch === ";" || (nested && ch === "]") || (ch === "\\" && this.peek(1) === "\n"));
    // The finished word.
    return { kind: "bare", parts, raw: this.src.slice(start, this.pos), start, end: this.pos };
  }

  /**
   * Collect substituting parts until `stop` says the current character ends
   * the word. Handles $variables, [commands] and backslashes.
   */
  parseParts(stop: (ch: string | undefined) => boolean): Part[] {
    // The parts collected.
    const parts: Part[] = [];
    // Literal text waiting to be pushed as one part.
    let text = "";
    // Push pending literal text as a part.
    const flush = () => {
      // Only non-empty text becomes a part.
      if (text) parts.push({ kind: "text", text });
      // Start a new run.
      text = "";
    };
    // Scan characters.
    for (;;) {
      // The current character.
      const c = this.peek();
      // The caller's terminator ends the word.
      if (stop(c)) break;
      // The end of the source also ends it (the caller reports a missing quote).
      if (c === undefined) break;
      // Backslash substitution.
      if (c === "\\") {
        // Decode the sequence.
        const b = backslashAt(this.src, this.pos);
        // Add the character(s) it stands for.
        text += b.text;
        // Skip it.
        this.pos += b.length;
        // Next character.
        continue;
      }
      // Command substitution.
      if (c === "[") {
        // Literal text before it becomes its own part.
        flush();
        // Where the bracket opens.
        const open = this.pos;
        // Step inside.
        this.pos++;
        // Parse the nested script to find the matching "]".
        this.parseScript(true);
        // The close bracket must be there (parseScript throws otherwise).
        this.pos++;
        // Record the text between the brackets.
        parts.push({ kind: "cmd", script: this.src.slice(open + 1, this.pos - 1), raw: this.src.slice(open, this.pos) });
        // Next character.
        continue;
      }
      // Variable substitution.
      if (c === "$") {
        // Try to read a variable reference.
        const v = this.parseVar();
        // A lone "$" is literal text.
        if (v === null) {
          // Keep the dollar sign.
          text += "$";
          // Step over it.
          this.pos++;
          // Next character.
          continue;
        }
        // Literal text before it becomes its own part.
        flush();
        // The variable part.
        parts.push(v);
        // Next character.
        continue;
      }
      // Ordinary character.
      text += c;
      // Advance.
      this.pos++;
    }
    // Push the last literal run.
    flush();
    // The word's parts.
    return parts;
  }

  /** Read a $name or ${name} reference at the current "$", or null if none. */
  parseVar(): Part | null {
    // Where the "$" is.
    const start = this.pos;
    // ${name}: any characters up to the close brace.
    if (this.peek(1) === "{") {
      // Find the closing brace.
      const close = this.src.indexOf("}", start + 2);
      // Tcl's message when it is missing.
      if (close < 0) throw new TclParseError("missing close-brace for variable name", start);
      // Step past it.
      this.pos = close + 1;
      // The braced name is taken literally.
      return { kind: "var", name: this.src.slice(start + 2, close), raw: this.src.slice(start, this.pos) };
    }
    // $name: letters, digits, underscores and "::" separators.
    let p = start + 1;
    // Consume name characters.
    for (;;) {
      // Ordinary name character.
      if (isVarNameChar(this.src[p])) p++;
      // A namespace separator, "::", possibly repeated colons.
      else if (this.src[p] === ":" && this.src[p + 1] === ":") {
        // Skip all consecutive colons.
        p += 2;
        // Tcl allows more than two.
        while (this.src[p] === ":") p++;
      }
      // Anything else ends the name.
      else break;
    }
    // No name characters at all: the "$" is literal.
    if (p === start + 1) return null;
    // An array reference: refused by default (not modelled), or read through its index when asked.
    if (this.src[p] === "(") {
      // The default: recognised but not modelled.
      if (!this.arrays) throw new TclParseError("array variables ($name(index)) are not modelled by this tool", start);
      // Read the index up to the first ")" at the top level, stepping over [commands] and \escapes as Tcl's token parser does.
      let q = p + 1;
      // Nesting depth of [brackets] inside the index.
      let depth = 0;
      // Scan.
      while (q < this.src.length) {
        // The character.
        const ch = this.src[q];
        // A backslash protects the next character.
        if (ch === "\\") { q += 2; continue; }
        // Brackets nest.
        if (ch === "[") depth++;
        // A close bracket ends one level.
        else if (ch === "]" && depth > 0) depth--;
        // The close paren at the top level ends the index.
        else if (ch === ")" && depth === 0) break;
        // Next.
        q++;
      }
      // Tcl's own message when the paren never closes.
      if (q >= this.src.length) throw new TclParseError("missing )", start);
      // Step past the ")".
      this.pos = q + 1;
      // The whole reference, index included, as the name.
      return { kind: "var", name: this.src.slice(start + 1, this.pos), raw: this.src.slice(start, this.pos) };
    }
    // Step past the name.
    this.pos = p;
    // The variable part.
    return { kind: "var", name: this.src.slice(start + 1, p), raw: this.src.slice(start, p) };
  }
}

/** Parse a whole script into commands and words. Throws TclParseError. */
export function parseScript(src: string, opts: ParseOptions = {}): Command[] {
  // A fresh parser over the text, with the caller's options.
  return new Parser(src, opts).parseScript(false);
}

/** True when a word has no substitutions at all (its text is fixed). */
export function isLiteralWord(w: Word): boolean {
  // Braced words are always literal; others when every part is text.
  return w.kind === "braced" || w.parts.every((p) => p.kind === "text");
}

/** The fixed text of a literal word (call only when isLiteralWord is true). */
export function literalText(w: Word): string {
  // Concatenate the text parts.
  return w.parts.map((p) => (p.kind === "text" ? p.text : "")).join("");
}

/** Parse a "quoted" string at src[pos] (a double quote), as an expression operand. */
export function parseQuotedAt(src: string, pos: number, opts: ParseOptions = {}): { word: Word; end: number } {
  // A parser positioned on the quote, with the caller's options.
  const p = new Parser(src, opts);
  // Start at the quote.
  p.pos = pos;
  // Parse without the command-word ending rule.
  const word = p.parseQuoted(false, false);
  // The word and where it ended.
  return { word, end: p.pos };
}

/** Parse a {braced} string at src[pos] (an open brace), as an expression operand. */
export function parseBracedAt(src: string, pos: number): { word: Word; end: number } {
  // A parser positioned on the brace.
  const p = new Parser(src);
  // Start at the brace.
  p.pos = pos;
  // Parse without the command-word ending rule.
  const word = p.parseBraced(false, false);
  // The word and where it ended.
  return { word, end: p.pos };
}

/** Parse a $variable at src[pos] (a dollar sign); part is null for a lone "$". */
export function parseVarAt(src: string, pos: number): { part: Part | null; end: number } {
  // A parser positioned on the dollar sign.
  const p = new Parser(src);
  // Start there.
  p.pos = pos;
  // Read the reference (throws on a missing close brace or an array).
  const part = p.parseVar();
  // A lone "$" consumes just itself.
  return { part, end: part === null ? pos + 1 : p.pos };
}

/** Parse a [command] substitution at src[pos] (an open bracket). */
export function parseCommandAt(src: string, pos: number): { script: string; end: number } {
  // A parser positioned just inside the bracket.
  const p = new Parser(src);
  // Step inside.
  p.pos = pos + 1;
  // Parse the nested script up to the matching "]" (throws when missing).
  p.parseScript(true);
  // The script between the brackets, and the offset after "]".
  return { script: src.slice(pos + 1, p.pos), end: p.pos + 1 };
}

/**
 * Parse as many whole commands as possible, the way Tcl_EvalEx meets them:
 * the commands before a syntax error are returned along with that error, so a
 * caller can run them first and report the error where Tcl would.
 */
export function parseScriptPartial(src: string, opts: ParseOptions = {}): { commands: Command[]; error?: TclParseError } {
  // A parser over the text, with the caller's options.
  const p = new Parser(src, opts);
  // Commands parsed so far.
  const commands: Command[] = [];
  // One command at a time.
  for (;;) {
    // Skip separators and comments.
    try { p.skipCommandGap(); } catch (e) { return { commands, error: e as TclParseError }; }
    // The end of the script.
    if (p.pos >= src.length) return { commands };
    // Parse one command.
    try {
      // The command.
      const cmd = p.parseCommand(false);
      // Keep non-empty commands.
      if (cmd.words.length) commands.push(cmd);
    } catch (e) {
      // A syntax error: return what came before it.
      return { commands, error: e as TclParseError };
    }
  }
}

/** True when a word has no substitutions and no backslashes (TCL_TOKEN_SIMPLE_WORD). */
export function isSimpleWord(w: Word): boolean {
  // Braced: simple unless a backslash-newline was substituted inside.
  if (w.kind === "braced") return !w.raw.includes("\\\n");
  // Quoted or bare: literal text only, and no backslash sequences at all.
  return w.parts.every((p) => p.kind === "text") && !w.raw.includes("\\");
}
