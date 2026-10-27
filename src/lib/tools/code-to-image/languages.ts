// ============================================================================
// src/lib/tools/code-to-image/languages.ts
// ----------------------------------------------------------------------------
// The highlighters of the code-to-image tool: one small tokenizer per language,
// for colouring only. None of them parses, validates or runs anything; each one
// walks the text once and paints character ranges with a token kind (comment,
// string, number, keyword, variable, prompt, key), and whatever it does not
// paint stays plain. Every loop advances, every regular expression is sticky
// and built from character classes whose repetitions cannot overlap, so the
// work is linear in the length of the text (ReDoS-safe).
//
// The rules come from each language's own reference, read on 2026-10-27:
//   - POSIX shell: The Open Group Base Specifications Issue 8 (POSIX.1-2024),
//     Shell Command Language, sections 2.2 (quoting, including the new
//     dollar-single-quotes of 2.2.4), 2.3 (token recognition: "#" starts a
//     comment only where a word could start), 2.4 (reserved words), 2.5.2
//     (special parameters), 2.5.3 (PS1 defaults to "$ ") and 2.6.2 (parameter
//     expansion).
//   - Python 3.15 (docs.python.org/3, the current bugfix release, end of life
//     2031-10): Lexical analysis 2.1.3 (comments), 2.3.1 and 2.3.2 (keywords
//     and soft keywords), 2.5 (string prefixes, triple quotes, escapes), 2.6
//     (integer, float and imaginary literals); sys.ps1 and sys.ps2 (">>> " and
//     "... ").
//   - JSON: RFC 8259 sections 2 (structural characters, literal names), 6
//     (numbers) and 7 (strings).
//   - YAML 1.2.2: 5.3 (indicators), 6.6 (comments must be separated from other
//     tokens by white space), 6.8 (directives), 6.9 (tags and anchors), 7.3
//     (quoted and plain scalars), 8.1 (block scalars), 9.1.2 (document
//     markers), 10.3.2 (core schema: null, booleans, integers, floats).
//   - Tcl 9.0 (the stable series; 8.6 and 8.4 state the same rules): the Tcl(n)
//     dodekalogue (commands, double quotes, braces, brackets, $ substitution,
//     backslashes, "#" only where a command starts), expr(n) numeric operands,
//     if(n) for then, elseif and else, tclsh(1) for the "% " prompt. F5 iRules
//     are written in Tcl ("based on the Tool Command Language (Tcl)", F5
//     clouddocs, What Is An iRule) and begin with "when" (F5 clouddocs, when);
//     Expect scripts are Tcl with Expect's commands (expect(1)).
//   - F5 tmsh: TMSH Reference v17 (the newest reference F5 publishes): tmsh(1)
//     for the module list, the "(tmos)#" prompts, quoting with quotation marks,
//     apostrophes or a backslash and ";" between commands; the commands index;
//     "#" comments as the reference's own syntax examples write them; the
//     "[root@bigip-1:Active:Standalone] config #" bash prompt from the PDF.
//   - FortiOS 7.6.8 Administration Guide: CLI basics (quotes, backslash escapes,
//     the $USERFROM, $USERNAME and $SerialNum variables, "#" as a character most
//     commands cannot use), Command syntax, Subcommands (config, edit, set,
//     unset, next, end ... and the "(admin)#" and "(27) #" prompts).
//   - Cisco-style CLI: Cisco IOS XE 17.x System Management Configuration Guide
//     ("Precede a comment with an exclamation point (!)"; command modes and
//     their Router>, Router#, Router(config)# and Router(config-if)# prompts;
//     the no and default forms) and the Catalyst 8400 Using Cisco IOS XE
//     Software chapter (the same prompt table).
// The manifest in index.ts carries the URLs and dates.
// ============================================================================

/** The languages the reader can choose. */
export type LanguageId = "plain" | "shell" | "python" | "json" | "yaml" | "tcl" | "tmsh" | "fortios" | "cisco";

/** Every language id, in the order the page lists them. */
export const LANGUAGES: readonly LanguageId[] = Object.freeze(["plain", "shell", "python", "json", "yaml", "tcl", "tmsh", "fortios", "cisco"]); // the select's order

/** Token kinds as small integers, so a whole text can be painted into one Uint8Array. */
export const K = Object.freeze({
  plain: 0, // not coloured
  comment: 1, // comments
  string: 2, // quoted text and YAML block scalars
  number: 3, // numeric literals and addresses
  keyword: 4, // reserved words, commands and literal names
  variable: 5, // $substitutions, YAML anchors, aliases and tags
  prompt: 6, // shell, interpreter and CLI prompts
  key: 7, // JSON member names, YAML keys, tmsh and FortiOS attribute names, iRule event names
  masked: 8, // a value the secrets check masked (painted later, by compute.ts)
}); // K

/** The names of the kinds, indexed by their number. */
export const KIND_NAMES = Object.freeze(["plain", "comment", "string", "number", "keyword", "variable", "prompt", "key", "masked"] as const); // index = code
/** A kind name. */
export type TokenKind = (typeof KIND_NAMES)[number];

/** The painter a tokenizer calls: paint the half-open range [start, end) of its own text with a kind. */
type Emit = (start: number, end: number, kind: number) => void;

// ---------------------------------------------------------------------------
// Small shared helpers.
// ---------------------------------------------------------------------------

/** True for a space or a tab (the blanks every language here separates words with). */
const isBlank = (c: string | undefined): boolean => c === " " || c === "\t"; // space or tab

/** The index of the next line feed at or after i, or the end of the text. */
function eol(s: string, i: number): number {
  const j = s.indexOf("\n", i); // the next line break
  return j === -1 ? s.length : j; // or the end
} // eol

/** True for an ASCII letter, digit or underscore. */
const isWordAscii = (c: string | undefined): boolean => c !== undefined && /[A-Za-z0-9_]/.test(c); // one character, no backtracking

/**
 * Scan a quoted run that ends at the next unescaped quote character q, with a backslash escaping the character after it.
 * @param s the text
 * @param i the index of the opening quote
 * @param q the quote character
 * @param stopAtEol true when a line break ends an unterminated run (the CLI languages keep strings on one line)
 * @returns the index just past the closing quote, or where the run stops
 */
function quotedEnd(s: string, i: number, q: string, stopAtEol: boolean): number {
  let j = i + 1; // after the opening quote
  while (j < s.length) {
    const c = s[j]; // the current character
    if (c === "\\") { j += 2; continue; } // an escape takes the next character with it
    if (c === q) return j + 1; // the closing quote
    if (c === "\n" && stopAtEol) return j; // unterminated: the run stops at the line end
    j++; // an ordinary character
  } // while
  return s.length; // unterminated at the end of the text
} // quotedEnd

// ---------------------------------------------------------------------------
// POSIX shell (sh).
// ---------------------------------------------------------------------------

/** Reserved words (POSIX 2.4) that the highlighter colours; "!", "{" and "}" stay plain. */
const SH_RESERVED = new Set(["if", "then", "else", "elif", "fi", "do", "done", "case", "esac", "while", "until", "for", "in"]); // 2.4
/** Characters that start an operator token in the shell (2.3, 2.10.1). */
const SH_OPERATOR = new Set([";", "&", "|", "(", ")", "<", ">"]); // operator starts
/** Operators after which the next word is in command position. */
const SH_CMD_RESET = new Set([";", "&", "|", "(", ")"]); // list and pipeline separators

/**
 * The end of a parameter expansion that starts with "$" at i (POSIX 2.5.2, 2.6.2), or i when "$" is literal here.
 * @param s the text
 * @param i the index of "$"
 * @returns the index just past the expansion, or i
 */
function shParamEnd(s: string, i: number): number {
  const c = s[i + 1]; // the character after "$"
  if (c === "{") { // ${...}: to the matching "}", nested braces counted, never past the line end
    let depth = 0; // brace depth
    for (let j = i + 1; j < s.length; j++) {
      const d = s[j]; // the current character
      if (d === "\n") return j; // unterminated on this line
      if (d === "\\") { j++; continue; } // an escaped character never closes
      if (d === "{") depth++; // one level deeper
      else if (d === "}" && --depth === 0) return j + 1; // the matching close
    } // for
    return s.length; // unterminated at the end
  } // braces
  if (c !== undefined && /[A-Za-z_]/.test(c)) { // $name: the longest valid name (XBD 3.216)
    let j = i + 2; // after the first name character
    while (isWordAscii(s[j])) j++; // the rest of the name
    return j; // the end of the name
  } // name
  if (c !== undefined && /[0-9@*#?\-$!]/.test(c)) return i + 2; // a positional or special parameter (2.5.1, 2.5.2)
  return i; // "$(", "$((" and a lone "$" are not variables
} // shParamEnd

/**
 * Highlight POSIX shell code.
 * @param s the code (a script, or the commands of a transcript joined by line feeds)
 * @param emit the painter
 */
function tokShell(s: string, emit: Emit): void {
  const n = s.length; // the length
  let i = 0; // the cursor
  let cmdPos = true; // the next word is in command position (2.4)
  let wordStart = true; // the cursor is where a word could start ("#" is a comment only there: 2.3 rule 9)
  let expect = 0; // after "for" or "case": 1 = the name or word comes next, 2 = "in" may come next
  while (i < n) {
    const c = s[i]; // the current character
    if (c === "\n") { i++; cmdPos = true; wordStart = true; expect = 0; continue; } // a new command line
    if (isBlank(c)) { i++; wordStart = true; continue; } // a blank delimits a word
    if (c === "#" && wordStart) { const e = eol(s, i); emit(i, e, K.comment); i = e; continue; } // a comment to the line end
    if (c === "\\") { i = Math.min(n, i + 2); wordStart = false; continue; } // the escape character (2.2.1)
    if (c === "'") { // single quotes: no escape inside (2.2.2)
      const close = s.indexOf("'", i + 1); // the closing quote
      const e = close === -1 ? n : close + 1; // or the end
      emit(i, e, K.string); i = e; wordStart = false; cmdPos = false; continue; // a string
    } // single quotes
    if (c === "$" && s[i + 1] === "'") { const e = quotedEnd(s, i + 1, "'", false); emit(i, e, K.string); i = e; wordStart = false; cmdPos = false; continue; } // $'...' (2.2.4)
    if (c === '"') { // double quotes: $ expansions stay live inside (2.2.3)
      let j = i + 1; // inside the quotes
      let seg = i; // the start of the current string segment
      while (j < n && s[j] !== '"') {
        if (s[j] === "\\") { j += 2; continue; } // an escaped character
        if (s[j] === "$") { const pe = shParamEnd(s, j); if (pe > j) { emit(seg, j, K.string); emit(j, pe, K.variable); j = pe; seg = j; continue; } } // a live expansion
        j++; // an ordinary character
      } // while
      const e = Math.min(n, j + 1); // past the closing quote (or the end)
      emit(seg, e, K.string); i = e; wordStart = false; cmdPos = false; continue; // the last segment
    } // double quotes
    if (c === "$") { const e = shParamEnd(s, i); if (e > i) { emit(i, e, K.variable); i = e; wordStart = false; cmdPos = false; continue; } i++; wordStart = false; continue; } // an expansion
    if (c === "`") { i++; wordStart = true; cmdPos = true; continue; } // backquoted command substitution: its first word is a command
    if (SH_OPERATOR.has(c)) { i++; wordStart = true; if (SH_CMD_RESET.has(c)) { cmdPos = true; expect = 0; } continue; } // an operator
    // An ordinary word: read to the next delimiter.
    const ws = i; // the word's start
    while (i < n) {
      const d = s[i]; // the current character
      if (d === "\n" || isBlank(d) || SH_OPERATOR.has(d) || d === "'" || d === '"' || d === "\\" || d === "$" || d === "`") break; // a delimiter
      i++; // part of the word
    } // while
    const w = s.slice(ws, i); // the word text
    const whole = wordStart && (i >= n || s[i] === "\n" || isBlank(s[i]) || SH_OPERATOR.has(s[i])); // nothing quoted or expanded inside it
    wordStart = false; // inside a word now
    if (whole && expect === 1) { expect = 2; cmdPos = false; continue; } // the loop variable or the case word: plain
    if (whole && expect === 2 && (w === "in" || w === "do")) { emit(ws, i, K.keyword); expect = 0; cmdPos = w === "do"; continue; } // "in" (or "do" straight after the name)
    if (whole && cmdPos && SH_RESERVED.has(w) && w !== "in") { // a reserved word where reserved words are recognised (2.4)
      emit(ws, i, K.keyword); // colour it
      if (w === "for" || w === "case") expect = 1; // the name or word follows
      cmdPos = w !== "for" && w !== "case"; // after the others a command follows
      continue; // next token
    } // reserved word
    const eq = w.indexOf("="); // an assignment word (2.10.2 rule 7)?
    if (cmdPos && eq > 0 && /^[A-Za-z_][A-Za-z0-9_]*$/.test(w.slice(0, eq))) { emit(ws, ws + eq, K.variable); continue; } // the name is a variable; the command follows
    if (whole && /^[0-9]+$/.test(w)) emit(ws, i, K.number); // a number
    cmdPos = false; // the command name has been read
  } // while
} // tokShell

// ---------------------------------------------------------------------------
// Python 3.15.
// ---------------------------------------------------------------------------

/** The 35 keywords (Python 3.15 Lexical analysis 2.3.1). */
const PY_KEYWORDS = new Set(["False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"]); // 2.3.1
/** The soft keywords coloured when they open a line (2.3.2: match, case, type, lazy; "_" is left plain). */
const PY_SOFT = new Set(["match", "case", "type", "lazy"]); // 2.3.2
/** Valid string prefixes, lower-cased (2.5.2: b, r, u, f, t and the r combinations). */
const PY_PREFIX = new Set(["", "r", "u", "b", "br", "rb", "f", "fr", "rf", "t", "tr", "rt"]); // 2.5.2
/** A Python identifier: a letter or underscore, then letters, digits, marks and connectors (Unicode-aware, linear). */
const PY_IDENT = /[\p{L}\p{Nl}_][\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}]*/uy; // sticky
/** Hexadecimal, octal and binary integers with single underscores (2.6.1). */
const PY_RADIX = /0(?:[xX](?:_?[0-9a-fA-F])+|[oO](?:_?[0-7])+|[bB](?:_?[01])+)/y; // sticky
/** Decimal integers and floats with an optional exponent and imaginary suffix (2.6.1 to 2.6.3). */
const PY_DECIMAL = /(?:[0-9](?:_?[0-9])*(?:\.(?:[0-9](?:_?[0-9])*)?)?|\.[0-9](?:_?[0-9])*)(?:[eE][+-]?[0-9](?:_?[0-9])*)?[jJ]?/y; // sticky

/**
 * Highlight Python code.
 * @param s the code (a script, or the statements of an interactive session joined by line feeds)
 * @param emit the painter
 */
function tokPython(s: string, emit: Emit): void {
  const n = s.length; // the length
  let i = 0; // the cursor
  let lineStart = true; // no token yet on this line (for soft keywords)
  while (i < n) {
    const c = s[i]; // the current character
    if (c === "\n") { i++; lineStart = true; continue; } // a new line
    if (isBlank(c) || c === "\f") { i++; continue; } // white space
    if (c === "#") { const e = eol(s, i); emit(i, e, K.comment); i = e; continue; } // a comment to the line end (2.1.3)
    if (c === "\\") { i = Math.min(n, i + 2); continue; } // explicit line joining or a stray backslash
    // A string, with or without a prefix.
    let p = i; // where the quote would be
    while (p < n && p - i < 2 && /[rRuUbBfFtT]/.test(s[p])) p++; // up to two prefix letters
    if ((s[p] === "'" || s[p] === '"') && PY_PREFIX.has(s.slice(i, p).toLowerCase()) && !(i > 0 && isWordAscii(s[i - 1]))) {
      const q = s[p]; // the quote character
      const triple = s.startsWith(q + q + q, p); // a triple-quoted string (2.5.1)
      let j = p + (triple ? 3 : 1); // inside
      while (j < n) {
        if (s[j] === "\\") { j += 2; continue; } // an escape sequence takes the next character, even in raw strings (2.5.3)
        if (triple ? s.startsWith(q + q + q, j) : s[j] === q) { j += triple ? 3 : 1; break; } // the end
        if (!triple && s[j] === "\n") break; // a short string cannot cross a line: stop at its end
        j++; // an ordinary character
      } // while
      const e = Math.min(j, n); // the end
      emit(i, e, K.string); i = e; lineStart = false; continue; // a string literal
    } // string
    PY_IDENT.lastIndex = i; // try an identifier here
    const id = PY_IDENT.exec(s); // the identifier, if any
    if (id) {
      const w = id[0]; // its text
      const e = i + w.length; // its end
      if (PY_KEYWORDS.has(w)) emit(i, e, K.keyword); // a keyword
      else if (lineStart && PY_SOFT.has(w) && isBlank(s[e])) { // a soft keyword opening a statement
        let k = e; while (isBlank(s[k])) k++; // the next non-blank character
        if (k < n && !/[=.:,)\]\n]/.test(s[k])) emit(i, e, K.keyword); // not an assignment, attribute or argument
      } // soft keyword
      i = e; lineStart = false; continue; // next token
    } // identifier
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(s[i + 1] ?? ""))) { // a number (2.6)
      PY_RADIX.lastIndex = i; // radix forms first
      const r = PY_RADIX.exec(s); // 0x, 0o, 0b
      PY_DECIMAL.lastIndex = i; // then decimal forms
      const m = r ?? PY_DECIMAL.exec(s); // the literal
      const e = i + (m ? m[0].length : 1); // its end
      emit(i, e, K.number); i = e; lineStart = false; continue; // a number
    } // number
    i++; lineStart = false; // an operator or delimiter
  } // while
} // tokPython

// ---------------------------------------------------------------------------
// JSON (RFC 8259).
// ---------------------------------------------------------------------------

/** A JSON number (RFC 8259 section 6): minus, int, frac, exp. */
const JSON_NUMBER = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y; // sticky

/**
 * Highlight JSON: member names as keys, strings, numbers, and the three literal names as keywords.
 * @param s the text
 * @param emit the painter
 */
function tokJson(s: string, emit: Emit): void {
  const n = s.length; // the length
  let i = 0; // the cursor
  while (i < n) {
    const c = s[i]; // the current character
    if (c === '"') { // a string (section 7): raw line breaks are not allowed inside, so it stops at one
      const e = quotedEnd(s, i, '"', true); // its end
      let k = e; // look past insignificant white space (section 2)
      while (k < n && (isBlank(s[k]) || s[k] === "\n" || s[k] === "\r")) k++; // skip it
      emit(i, e, s[k] === ":" ? K.key : K.string); // a member name is followed by ":" (section 4)
      i = e; continue; // next token
    } // string
    if (c === "-" || /[0-9]/.test(c)) { JSON_NUMBER.lastIndex = i; const m = JSON_NUMBER.exec(s); if (m) { emit(i, i + m[0].length, K.number); i += m[0].length; continue; } } // a number
    if (c === "t" || c === "f" || c === "n") { // a literal name (section 3)
      const lit = s.startsWith("true", i) ? 4 : s.startsWith("false", i) ? 5 : s.startsWith("null", i) ? 4 : 0; // its length
      if (lit > 0 && !isWordAscii(s[i + lit])) { emit(i, i + lit, K.keyword); i += lit; continue; } // not part of a longer word
    } // literal
    i++; // structural characters, white space and anything that is not JSON
  } // while
} // tokJson

// ---------------------------------------------------------------------------
// YAML 1.2.2.
// ---------------------------------------------------------------------------

/** Core schema null and boolean plain scalars (10.3.2). */
const YAML_LITERAL = /^(?:null|Null|NULL|~|true|True|TRUE|false|False|FALSE)$/; // anchored, no repetition
/** Core schema integers and floats (10.3.2). */
const YAML_NUMBER = /^(?:[-+]?[0-9]+|0o[0-7]+|0x[0-9a-fA-F]+|[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$/; // anchored

/**
 * Highlight YAML, line by line: comments, directives and document markers, quoted scalars (which may span lines),
 * mapping keys, anchors, aliases and tags, core-schema values, and the content of block scalars.
 * @param s the text
 * @param emit the painter
 */
function tokYaml(s: string, emit: Emit): void {
  const n = s.length; // the length
  let ls = 0; // the start of the current line
  let blockIndent = -1; // inside a block scalar: the indentation its content must exceed; -1 outside
  let openQuote = ""; // a quoted scalar still open from an earlier line: its quote character
  let flow = 0; // the depth of [ ] and { } flow collections
  while (ls <= n) {
    const le = eol(s, ls); // the end of the line
    let indent = 0; while (s[ls + indent] === " ") indent++; // leading spaces (tabs are not indentation in YAML)
    const blankLine = ls + indent >= le || s[ls + indent] === "\t" && s.slice(ls, le).trim() === ""; // nothing on the line
    if (blockIndent >= 0) { // inside a block scalar (8.1)
      if (blankLine) { ls = le + 1; continue; } // blank lines belong to it
      if (indent > blockIndent) { emit(ls + indent, le, K.string); ls = le + 1; continue; } // more indented: its content
      blockIndent = -1; // less indented: it has ended
    } // block scalar
    let i = ls; // the cursor
    if (openQuote !== "") { // finish a quoted scalar from an earlier line
      const e = openQuote === '"' ? quotedEnd(s, i - 1, '"', true) : yamlSingleEnd(s, i - 1); // where it closes on this line
      const closed = e <= le && s[e - 1] === openQuote && e > i; // it closed here
      emit(i, Math.min(e, le), K.string); i = Math.min(e, le); if (closed) openQuote = ""; // still open: carry it on
      if (!closed) { ls = le + 1; continue; } // the whole line was string
    } // open quote
    if (i === ls && s[i] === "%") { emit(i, le, K.keyword); ls = le + 1; continue; } // a directive (6.8)
    if (i === ls && (s.startsWith("---", i) || s.startsWith("...", i)) && (i + 3 >= le || isBlank(s[i + 3]))) { emit(i, i + 3, K.keyword); i += 3; } // a document marker (9.1.2)
    let valuePos = true; // the next scalar would be a value or a key at the start of a node
    while (i < le) {
      const c = s[i]; // the current character
      if (isBlank(c)) { i++; continue; } // separation space
      if (c === "#" && (i === ls || isBlank(s[i - 1]))) { emit(i, le, K.comment); break; } // a comment: separated by white space (6.6)
      if (c === "-" && (i + 1 >= le || isBlank(s[i + 1]))) { i++; valuePos = true; continue; } // a block sequence entry (5.3)
      if ((c === "?" || c === ":") && (i + 1 >= le || isBlank(s[i + 1]))) { i++; valuePos = true; continue; } // explicit key or value indicator
      if (c === "[" || c === "{") { flow++; i++; valuePos = true; continue; } // a flow collection starts
      if (c === "]" || c === "}") { flow = Math.max(0, flow - 1); i++; continue; } // one ends
      if (c === ",") { i++; valuePos = true; continue; } // a flow entry separator
      if (c === "&" || c === "*" || c === "!") { // an anchor, an alias or a tag (6.9)
        let j = i + 1; while (j < le && !isBlank(s[j]) && !(flow > 0 && /[,\[\]{}]/.test(s[j]))) j++; // its name
        emit(i, j, K.variable); i = j; continue; // coloured as a variable
      } // properties
      if ((c === "|" || c === ">") && valuePos) { // a block scalar header (8.1.1)
        let j = i + 1; while (j < le && /[0-9+-]/.test(s[j])) j++; // indentation and chomping indicators
        if (j >= le || isBlank(s[j])) { emit(i, j, K.keyword); blockIndent = indent; i = j; continue; } // the content follows on the next lines
      } // block scalar
      if (c === '"' || c === "'") { // a quoted scalar (7.3.1, 7.3.2)
        const e = c === '"' ? quotedEnd(s, i, '"', true) : yamlSingleEnd(s, i); // its end on this line
        const closed = e <= le && e > i + 1 && s[e - 1] === c; // closed on this line
        let k = Math.min(e, le); while (k < le && isBlank(s[k])) k++; // what follows
        emit(i, Math.min(e, le), closed && s[k] === ":" ? K.key : K.string); // a key when ":" follows
        if (!closed) { openQuote = c; i = le; break; } // continues on the next line
        i = e; valuePos = false; continue; // next token
      } // quoted
      // A plain scalar (7.3.3): to ": ", " #", a flow indicator inside a flow collection, or the line end.
      const ps = i; // its start
      let pe = i; // its end so far
      let isKey = false; // ends with the value indicator
      while (i < le) {
        const d = s[i]; // the current character
        if (d === ":" && (i + 1 >= le || isBlank(s[i + 1]) || (flow > 0 && /[,\[\]{}]/.test(s[i + 1])))) { isKey = true; break; } // the key ends here
        if (d === "#" && isBlank(s[i - 1])) break; // a comment follows
        if (flow > 0 && /[,\[\]{}]/.test(d)) break; // a flow indicator ends it
        i++; if (!isBlank(d)) pe = i; // trailing blanks are not part of it
      } // while
      const text = s.slice(ps, pe); // the scalar
      if (isKey) emit(ps, pe, K.key); // a mapping key
      else if (YAML_LITERAL.test(text)) emit(ps, pe, K.keyword); // null or a boolean
      else if (YAML_NUMBER.test(text)) emit(ps, pe, K.number); // an integer or a float
      valuePos = false; // a scalar has been read
      if (i === ps) i++; // never stand still
    } // while
    ls = le + 1; // the next line
  } // while
} // tokYaml

/** The end of a single-quoted YAML scalar on its line ("''" is an escaped quote, 7.3.2), or the line end. */
function yamlSingleEnd(s: string, i: number): number {
  let j = i + 1; // inside
  while (j < s.length && s[j] !== "\n") {
    if (s[j] === "'") { if (s[j + 1] === "'") { j += 2; continue; } return j + 1; } // "''" or the close
    j++; // an ordinary character
  } // while
  return j; // unterminated on this line
} // yamlSingleEnd

// ---------------------------------------------------------------------------
// Tcl, F5 iRules and Expect.
// ---------------------------------------------------------------------------

/** Commands coloured as keywords when they are the first word of a command: Tcl 9.0 built-ins (TclCmd index), "when" (iRules) and Expect's commands (expect(1)). */
const TCL_COMMANDS = new Set([
  "after", "append", "apply", "array", "binary", "break", "catch", "cd", "close", "concat", "continue", "dict", "error", "eval", "exec", "exit", "expr", "for", "foreach", "format", "gets", "glob", "global", "if", "incr", "info", "join", "lappend", "lassign", "lindex", "linsert", "list", "llength", "lmap", "lrange", "lreplace", "lsearch", "lset", "lsort", "namespace", "open", "package", "proc", "puts", "read", "regexp", "regsub", "rename", "return", "scan", "set", "source", "split", "string", "subst", "switch", "tailcall", "throw", "try", "unset", "uplevel", "upvar", "variable", "vwait", "while", "yield", // Tcl 9.0
  "when", // F5 iRules: every iRule begins with a when command
  "spawn", "expect", "send", "send_user", "send_error", "interact", "exp_continue", "expect_after", "expect_before", "expect_background", "log_user", "log_file", "match_max", "exp_internal", "wait", // Expect
]); // TCL_COMMANDS
/** Words of the if command coloured wherever they stand as a bare word (if(n)). */
const TCL_IF_WORDS = new Set(["then", "elseif", "else"]); // if(n)
/** A Tcl number as a whole word (expr(n) numeric operands, with underscores between digits). */
const TCL_NUMBER = /^[+-]?(?:0[xX][0-9a-fA-F](?:_*[0-9a-fA-F])*|0[bB][01](?:_*[01])*|0[oO][0-7](?:_*[0-7])*|0[dD][0-9](?:_*[0-9])*|[0-9](?:_*[0-9])*(?:\.(?:[0-9](?:_*[0-9])*)?)?(?:[eE][+-]?[0-9]+)?|\.[0-9]+(?:[eE][+-]?[0-9]+)?)$/; // anchored

/**
 * The end of a variable substitution starting with "$" at i (Tcl(n) rule [8]), or i when "$" is literal.
 * @param s the text
 * @param i the index of "$"
 * @returns the index just past the substitution, or i
 */
function tclVarEnd(s: string, i: number): number {
  if (s[i + 1] === "{") { // ${name}: any characters except a close brace
    const close = s.indexOf("}", i + 2); // the close brace
    const stop = eol(s, i); // never past the line end
    return close === -1 || close > stop ? i : close + 1; // literal when unterminated on the line
  } // braced name
  let j = i + 1; // the name: letters, digits, underscores and namespace separators (two or more colons)
  while (j < s.length) {
    if (isWordAscii(s[j])) { j++; continue; } // a name character
    if (s[j] === ":" && s[j + 1] === ":") { j += 2; while (s[j] === ":") j++; continue; } // a namespace separator
    break; // the end of the name
  } // while
  if (j === i + 1) return i; // no name: a literal "$"
  if (s[j] === "(") { const close = s.indexOf(")", j); const stop = eol(s, j); if (close !== -1 && close < stop) j = close + 1; } // $name(index)
  return j; // the end
} // tclVarEnd

/** A context of the Tcl highlighter: a script (top level, inside brackets or inside braces) or a double-quoted word. */
interface TclCtx { k: "script" | "bracket" | "brace" | "quote"; cmdStart: boolean; afterWhen: boolean }

/**
 * Highlight Tcl, iRules and Expect. Braced words are highlighted as scripts, because the bodies of proc, if, foreach,
 * when and expect are scripts; a braced word that is data is coloured the same way.
 * @param s the code
 * @param emit the painter
 */
function tokTcl(s: string, emit: Emit): void {
  const n = s.length; // the length
  const stack: TclCtx[] = [{ k: "script", cmdStart: true, afterWhen: false }]; // the contexts
  let i = 0; // the cursor
  while (i < n) {
    const top = stack[stack.length - 1]; // the current context
    const c = s[i]; // the current character
    if (top.k === "quote") { // inside "...": substitutions stay live (rule [4])
      if (c === '"') { emit(i, i + 1, K.string); stack.pop(); i++; continue; } // the closing quote
      if (c === "\\") { emit(i, Math.min(n, i + 2), K.string); i += 2; continue; } // a backslash sequence
      if (c === "$") { const e = tclVarEnd(s, i); if (e > i) { emit(i, e, K.variable); i = e; continue; } } // a variable
      if (c === "[") { stack.push({ k: "bracket", cmdStart: true, afterWhen: false }); i++; continue; } // a command substitution
      emit(i, i + 1, K.string); i++; continue; // string text
    } // quote
    if (c === "\n" || c === ";") { top.cmdStart = true; i++; continue; } // a command separator (rule [1])
    if (isBlank(c) || c === "\r") { i++; continue; } // a word separator (rule [3])
    if (c === "\\" && s[i + 1] === "\n") { i += 2; continue; } // backslash-newline is a word separator
    if (c === "#" && top.cmdStart) { // a comment, only where a command starts (rule [10])
      let e = eol(s, i); // the line end
      while (e < n) { let b = 0; while (s[e - 1 - b] === "\\") b++; if (b % 2 === 1) e = eol(s, e + 1); else break; } // a backslash-newline continues it
      emit(i, e, K.comment); i = e; continue; // the comment
    } // comment
    if (c === "]" && top.k === "bracket") { stack.pop(); i++; continue; } // the end of a command substitution (rule [7])
    if (c === "}" && top.k === "brace") { stack.pop(); i++; continue; } // the end of a braced word (rule [6])
    if (c === "[") { stack.push({ k: "bracket", cmdStart: true, afterWhen: false }); top.cmdStart = false; i++; continue; } // a command substitution starts a word
    const first = top.cmdStart; // is this the first word of a command?
    const afterWhen = top.afterWhen; // does it follow "when"?
    top.cmdStart = false; top.afterWhen = false; // a word is being read
    if (c === '"') { emit(i, i + 1, K.string); stack.push({ k: "quote", cmdStart: false, afterWhen: false }); i++; continue; } // a quoted word (rule [4])
    if (c === "{") { // a braced word (rule [6]), or argument expansion {*} (rule [5])
      if (s.startsWith("{*}", i) && i + 3 < n && !isBlank(s[i + 3]) && s[i + 3] !== "\n") { i += 3; top.cmdStart = first; continue; } // {*} then the word
      stack.push({ k: "brace", cmdStart: true, afterWhen: false }); i++; continue; // highlighted as a script
    } // brace
    // A bare word: to white space, a separator, or the bracket or brace that closes the context.
    const ws = i; // its start
    let plain = true; // no substitution inside
    while (i < n) {
      const d = s[i]; // the current character
      if (isBlank(d) || d === "\n" || d === ";" || d === "\r") break; // the word ends
      if (d === "]" && top.k === "bracket") break; // the substitution ends
      if (d === "}" && top.k === "brace") break; // the braced word ends
      if (d === "[") break; // a command substitution inside the word: the main loop opens it
      if (d === "\\") { i += 2; plain = false; continue; } // a backslash sequence
      if (d === "$") { const e = tclVarEnd(s, i); if (e > i) { emit(i, e, K.variable); i = e; plain = false; continue; } } // a variable
      i++; // a word character
    } // while
    const w = s.slice(ws, Math.min(i, n)); // the word
    if (plain && first && TCL_COMMANDS.has(w)) { emit(ws, i, K.keyword); if (w === "when") top.afterWhen = true; } // a command name
    else if (plain && afterWhen && /^[A-Z][A-Z0-9_]*$/.test(w)) emit(ws, i, K.key); // an iRule event name after "when"
    else if (plain && TCL_IF_WORDS.has(w)) emit(ws, i, K.keyword); // then, elseif, else
    else if (plain && TCL_NUMBER.test(w)) emit(ws, i, K.number); // a number
    if (i === ws) i++; // never stand still
  } // while
} // tokTcl

// ---------------------------------------------------------------------------
// The CLI languages: F5 tmsh, Fortinet FortiOS, Cisco-style.
// ---------------------------------------------------------------------------

/** tmsh commands (TMSH Reference v17 commands index) and root modules (tmsh(1) MODULES). */
const TMSH_WORDS = new Set([
  "cd", "cp", "create", "delete", "edit", "exit", "generate", "help", "install", "list", "load", "modify", "mv", "publish", "pwd", "quit", "reboot", "reset-stats", "restart", "run", "save", "send-mail", "show", "shutdown", "start", "stop", "submit", // commands
  "auth", "cli", "gtm", "ltm", "net", "sys", "wom", // the root's modules
]); // TMSH_WORDS
/** FortiOS commands and subcommands (CLI basics, Command syntax, Subcommands). */
const FORTIOS_WORDS = new Set(["config", "edit", "set", "unset", "next", "end", "get", "show", "delete", "purge", "move", "clone", "rename", "append", "select", "unselect", "execute", "diagnose", "abort"]); // FortiOS 7.6.8
/** Cisco IOS XE commands and forms named in the command-mode and CLI chapters. */
const CISCO_WORDS = new Set(["no", "default", "enable", "disable", "configure", "terminal", "interface", "end", "exit", "show", "copy", "logout", "username", "access-list", "ip"]); // IOS XE 17.x
/** An IPv4 address, optionally with a port, a route domain, a prefix length or a mask, or a plain integer: coloured as a number. */
const CLI_NUMBER = /^(?:[0-9]{1,3}(?:\.[0-9]{1,3}){3}(?:%[0-9]+)?(?:[:.][0-9]+)?(?:\/[0-9]{1,2})?|[0-9]+)$/; // anchored

/** A tmsh prompt: "(tmos)# " and its longer forms, or the BIG-IP bash prompt "[root@bigip-1:Active:Standalone] config # ". */
const TMSH_PROMPT = /(?:[^#\n"{]{0,160}?\(tmos[\w./-]*\)# ?|\[[^\]\n]{1,120}\] [^\s#]{1,60} [#$] ?)/y; // sticky, bounded
/** A FortiOS prompt: an optional host name, an optional "(scope)", then "#" and a space ("FGT (admin) # ", "(27) #", "# "). */
const FORTIOS_PROMPT = /(?:[A-Za-z0-9][A-Za-z0-9._-]{0,34} ?)?(?:\([^()\n]{1,64}\) ?)?#(?: |$)/y; // sticky, bounded
/** A Cisco-style prompt: a host name, an optional "(mode)", then ">" or "#" (Router>, Router#, Router(config-if)#). */
const CISCO_PROMPT = /[A-Za-z0-9][A-Za-z0-9._-]{0,62}(?:\([A-Za-z0-9._/-]{1,40}\))?[>#] ?/y; // sticky, bounded; terminals print "Router#show" with no space

/**
 * The length of a prompt at i, or 0.
 * @param re the sticky prompt pattern
 * @param s the text
 * @param i the start of a line
 * @returns the prompt's length
 */
function promptAt(re: RegExp, s: string, i: number): number {
  re.lastIndex = i; // anchor at the line start
  const m = re.exec(s); // try it
  return m && m[0].length > 0 && !m[0].includes("\n") ? m[0].length : 0; // its length
} // promptAt

/**
 * Highlight one of the CLI languages line by line: prompts, comments, quoted strings (on one line), the command words
 * the vendor documents, attribute names, numbers and addresses, and FortiOS's $ variables.
 * @param s the text
 * @param emit the painter
 * @param lang which CLI
 */
function tokCli(s: string, emit: Emit, lang: "tmsh" | "fortios" | "cisco"): void {
  const n = s.length; // the length
  let ls = 0; // the current line's start
  let depth = 0; // tmsh: the brace depth at the cursor
  while (ls <= n) {
    const le = eol(s, ls); // the line end
    let i = ls; // the cursor
    const pl = promptAt(lang === "tmsh" ? TMSH_PROMPT : lang === "fortios" ? FORTIOS_PROMPT : CISCO_PROMPT, s, ls); // a prompt?
    if (pl > 0) { emit(ls, ls + pl, K.prompt); i = ls + pl; } // the prompt
    const depthAtStart = depth; // tmsh: inside an object at the line start?
    let firstWord = true; // the next word is the first of a command
    let afterSet = false; // FortiOS: the previous word was "set" or "unset"
    while (i < le) {
      const c = s[i]; // the current character
      if (isBlank(c) || c === "\r") { i++; continue; } // a blank
      const atWordStart = i === ls || isBlank(s[i - 1]) || i === ls + pl; // nothing before it on the word
      if (lang === "cisco" && c === "!" && firstWord) { emit(i, le, K.comment); break; } // "Precede a comment with an exclamation point"
      if (lang === "tmsh" && c === "#" && atWordStart) { emit(i, le, K.comment); break; } // a tmsh comment
      if (lang === "fortios" && c === "#" && i === ls) { emit(i, le, K.comment); break; } // a line that starts with "#" and is not a prompt
      if (lang !== "cisco" && (c === '"' || c === "'")) { const e = Math.min(quotedEnd(s, i, c, true), le); emit(i, e, K.string); i = e; firstWord = false; afterSet = false; continue; } // a quoted string
      if (lang === "tmsh" && c === "{") { depth++; i++; continue; } // an object or a list opens
      if (lang === "tmsh" && c === "}") { depth = Math.max(0, depth - 1); i++; continue; } // one closes
      if (lang === "tmsh" && c === ";") { firstWord = true; i++; continue; } // tmsh: commands separated by semicolons
      if (lang === "fortios" && c === "$" && /[A-Za-z]/.test(s[i + 1] ?? "")) { let j = i + 1; while (j < le && /[A-Za-z0-9_]/.test(s[j])) j++; emit(i, j, K.variable); i = j; firstWord = false; continue; } // $USERFROM, $USERNAME, $SerialNum
      // A word.
      const ws = i; // its start
      while (i < le && !isBlank(s[i]) && s[i] !== "\r" && !(lang === "tmsh" && (s[i] === "{" || s[i] === "}" || s[i] === ";")) && !((s[i] === '"' || s[i] === "'") && lang !== "cisco")) i++; // its end
      const w = s.slice(ws, i); // the word
      if (lang === "tmsh") {
        if (firstWord && depthAtStart > 0 && depth > 0) emit(ws, i, K.key); // an attribute name inside an object
        else if (depth === 0 && TMSH_WORDS.has(w)) emit(ws, i, K.keyword); // a command or a module
        else if (CLI_NUMBER.test(w)) emit(ws, i, K.number); // an address or a number
      } else if (lang === "fortios") {
        if (afterSet) emit(ws, i, K.key); // the field name after set or unset
        else if (w === "ENC") emit(ws, i, K.keyword); // the marker of an encrypted value
        else if (firstWord && FORTIOS_WORDS.has(w)) emit(ws, i, K.keyword); // a command or subcommand
        else if (CLI_NUMBER.test(w)) emit(ws, i, K.number); // an address or a number
        afterSet = firstWord && (w === "set" || w === "unset"); // the next word is a field name
      } else {
        if (firstWord && CISCO_WORDS.has(w)) emit(ws, i, K.keyword); // a command or the no/default form
        else if (CLI_NUMBER.test(w)) emit(ws, i, K.number); // an address, a mask or a number
      } // languages
      if (!(lang === "cisco" && (w === "no" || w === "default") && firstWord)) firstWord = false; // "no" and "default" prefix a command
      if (i === ws) i++; // never stand still
    } // while
    ls = le + 1; // the next line
  } // while
} // tokCli

// ---------------------------------------------------------------------------
// Transcripts: prompts on some lines, command output on the others.
// ---------------------------------------------------------------------------

/** The shell prompt: POSIX PS1's default "$ ", or the BIG-IP bash prompt "[user@host:State:State] dir # ". */
const SHELL_PROMPT = /(?:\$ |\[[^\]\n]{1,120}\] [^\s#]{1,60} [#$] )/y; // sticky, bounded
/** The Python prompts: sys.ps1 ">>> " (or ">>>" alone on a line). */
const PY_PS1 = />>>(?: |$)/y; // sticky
/** The Python continuation prompt: sys.ps2 "... " (or "..." alone), recognised only in a session. */
const PY_PS2 = /\.\.\.(?: |$)/y; // sticky
/** The tclsh prompt "% ". */
const TCL_PROMPT = /% /y; // sticky

/** One stretch of the original text that the tokenizer sees. */
interface Segment { o: number; len: number }

/**
 * Paint the token kinds of a text into an array with one kind per UTF-16 code unit.
 * For shell, Python and Tcl, a text in which any line starts with that language's prompt is read as a transcript:
 * the prompts are coloured, the code after them is highlighted (consecutive prompt lines together, so a quoted
 * string or a block can continue), and lines without a prompt are command output, left plain. The CLI languages
 * colour their prompts and highlight every line, because their output is usually configuration.
 * @param text the normalised text (line feeds only)
 * @param lang the language
 * @returns the kinds, one per code unit
 */
export function paintKinds(text: string, lang: LanguageId): Uint8Array {
  const kinds = new Uint8Array(text.length); // every code unit starts plain
  if (lang === "plain") return kinds; // nothing to colour
  const paintDirect: Emit = (a, b, k) => { kinds.fill(k, Math.max(0, a), Math.min(text.length, b)); }; // identity mapping
  if (lang === "json") { tokJson(text, paintDirect); return kinds; } // no prompts
  if (lang === "yaml") { tokYaml(text, paintDirect); return kinds; } // no prompts
  if (lang === "tmsh" || lang === "fortios" || lang === "cisco") { tokCli(text, paintDirect, lang); return kinds; } // prompts handled inside
  // shell, python, tcl: script or transcript.
  const starts: number[] = [0]; // line starts
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1); // every line start
  const ps1 = lang === "shell" ? SHELL_PROMPT : lang === "python" ? PY_PS1 : TCL_PROMPT; // the primary prompt
  const prompts = starts.map((ls) => promptAt(ps1, text, ls)); // the primary prompt length per line
  const transcript = prompts.some((p) => p > 0); // a session, not a script
  if (!transcript) { // a script: one segment, identity mapping
    const tok = lang === "shell" ? tokShell : lang === "python" ? tokPython : tokTcl; // the tokenizer
    tok(text, paintDirect); return kinds; // done
  } // script
  const segs: Segment[] = []; // the code after each prompt
  starts.forEach((ls, idx) => {
    const le = eol(text, ls); // the line end
    let p = prompts[idx]; // the primary prompt here
    if (p === 0 && lang === "python") p = promptAt(PY_PS2, text, ls); // a continuation line in a Python session
    if (p === 0) return; // command output: plain
    kinds.fill(K.prompt, ls, ls + p); // the prompt
    segs.push({ o: ls + p, len: le - (ls + p) }); // the code after it
  }); // forEach
  const virtual = segs.map((g) => text.slice(g.o, g.o + g.len)).join("\n"); // the code, joined by line feeds
  const vStarts: number[] = []; // each segment's start in the joined text
  let acc = 0; // the running offset
  for (const g of segs) { vStarts.push(acc); acc += g.len + 1; } // segment k starts at the sum of the earlier lengths plus separators
  const emit: Emit = (a, b, k) => { // map a range of the joined text back to the original
    let lo = 0, hi = segs.length - 1; // binary search for the segment holding a
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (vStarts[mid] <= a) lo = mid; else hi = mid - 1; } // the last segment starting at or before a
    for (let g = lo; g < segs.length && vStarts[g] < b; g++) { // every segment the range touches
      const from = Math.max(a, vStarts[g]) - vStarts[g]; // the range's start inside the segment
      const to = Math.min(b, vStarts[g] + segs[g].len) - vStarts[g]; // its end inside the segment (separators excluded)
      if (to > from) kinds.fill(k, segs[g].o + from, segs[g].o + to); // paint the original characters
    } // for
  }; // emit
  const tok = lang === "shell" ? tokShell : lang === "python" ? tokPython : tokTcl; // the tokenizer
  tok(virtual, emit); // highlight the code only
  return kinds; // the painted kinds
} // paintKinds
