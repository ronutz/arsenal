// ============================================================================
// src/lib/tools/pyproject-toml-explainer/toml.ts
// ----------------------------------------------------------------------------
// A TOML parser for the pyproject.toml explainer, written for this site. No
// package in package.json parses TOML (gray-matter reads YAML and JSON only;
// js-yaml is YAML), and Pyodide's CPython carries tomllib but only inside the
// 13.5 MB engine the Python playground downloads on request, so the explainer
// has its own parser.
//
// THE RULES: TOML v1.0.0 (toml.io/en/v1.0.0, published 2021-01-11) and its
// ABNF (github.com/toml-lang/toml, tag 1.0.0, toml.abnf), both read
// 2026-10-27. The whole language is implemented, not a subset: pyproject.toml
// files carry any TOML in their [tool] tables. Key/value pairs and the rule
// that a newline (or the end) follows each; bare keys [A-Za-z0-9_-]+, quoted
// keys, dotted keys with white space around the dots; the four string kinds,
// escapes (\b \t \n \f \r \" \\ \uXXXX \UXXXXXXXX, which must be Unicode
// scalar values; every other escape is an error), the line-ending backslash,
// the first newline after an opening triple quote trimmed, control characters
// refused (tab allowed; LF and CR LF inside multi-line strings); integers
// (no leading zeros, underscores only between digits, 0x 0o 0b with no sign,
// any size kept exactly); floats (a fractional part needs digits on both
// sides of the point, exponents, inf and nan with a sign or not); true and
// false; offset and local date-times, local dates and local times (T, t or a
// space between date and time; Z, z or +HH:MM; days checked against the
// month and leap years); arrays (mixed types, newlines, comments and a
// trailing comma); inline tables (one line, no trailing comma, closed to
// later additions); tables and arrays of tables with the definition rules of
// the "Table", "Inline Table" and "Array of Tables" sections (no table or key
// defined twice, dotted keys cannot reopen a [table] and a [table] cannot
// reopen a table a dotted key defined, sub-tables may be added under dotted
// tables, an inline table or a static array cannot be extended, [[a]]
// cannot append to a static array and [a] cannot reopen an array of tables).
// CR LF is read as LF before anything else; a lone CR is an error.
//
// WHERE THE TEXT IS SILENT OR LOOSE this parser behaves as Python's tomllib
// (CPython 3.13.16, TOML 1.0.0, installed in this container), which the
// golden vectors and a differential test were checked against on 2026-10-27:
// a byte order mark is refused; DEL (U+007F) is refused in comments (the 1.0.0
// prose refuses it, its ABNF allowed it, TOML 1.1.0's ABNF fixed that);
// second 60 is refused (the ABNF comment allows a leap second; tomllib cannot
// represent one, so pip-based tools refuse it).
//
// TOML 1.1.0 (published 2025-12-18, read the same day): Python 3.15's tomllib
// reads it; 3.11 to 3.14 read 1.0.0 only. A document that fails as 1.0.0 is
// read again as 1.1.0 (newlines, comments and a trailing comma in inline
// tables; \xHH and \e escapes; seconds optional in times); when that works,
// the result says which 1.1.0 features were used and where, because a build
// running on Python 3.14 or older (or any TOML 1.0.0 parser) refuses the file.
// The 1.1.0 reading was checked against tomli 2.5.0 (the project tomllib
// comes from), installed in a throwaway environment.
//
// SAFETY: input bounded (MAX_TOML_CHARS), nesting of arrays and inline tables
// bounded (MAX_TOML_DEPTH, so no stack exhaustion), every scan a loop over
// characters (no regular expression with nested quantifiers).
// ============================================================================

// ---------------------------------------------------------------------------
// Limits and types
// ---------------------------------------------------------------------------

/** The longest document read (characters). */
export const MAX_TOML_CHARS = 500_000; // far above any real pyproject.toml
/** The deepest nesting of arrays and inline tables. */
export const MAX_TOML_DEPTH = 100; // far above any real document
/** The most parts one dotted key or header may have (each part is a table level; checks per key stay small). */
export const MAX_KEY_PARTS = 128; // far above any real document

/** The two grammars. */
export type TomlVersion = "1.0.0" | "1.1.0";

/** The four date and time kinds. */
export type DateTimeKind = "offset-date-time" | "local-date-time" | "local-date" | "local-time";

/** How a table came to exist. */
export type TableOrigin =
  | "root" // the document itself
  | "header" // [table]
  | "implicit" // a super-table created by a header or a dotted key, never defined itself
  | "dotted" // created by a dotted key
  | "inline" // { ... }
  | "array-element"; // one element of [[array]]

/** A parsed value with the position where it starts (1-based line and column, in characters). */
export type TomlValue =
  | { t: "string"; v: string; line: number; col: number; multiline: boolean; literal: boolean }
  | { t: "integer"; v: string; raw: string; line: number; col: number }
  | { t: "float"; v: number; raw: string; line: number; col: number }
  | { t: "boolean"; v: boolean; line: number; col: number }
  | { t: "datetime"; kind: DateTimeKind; raw: string; line: number; col: number }
  | { t: "array"; items: TomlValue[]; aot: boolean; line: number; col: number }
  | TomlTable;

/** A table: its entries in insertion order, and where it was opened. */
export interface TomlTable {
  /** The tag. */
  t: "table";
  /** Key to value, in the order keys were first written. */
  entries: Map<string, TomlValue>;
  /** How the table came to exist. */
  origin: TableOrigin;
  /** Where it was opened (header, dotted key, brace or document start). */
  line: number;
  /** The column. */
  col: number;
} // TomlTable

/** Why the document is not TOML. */
export type TomlErrorCode =
  | "too-large" // longer than MAX_TOML_CHARS
  | "too-deep" // nested deeper than MAX_TOML_DEPTH, or a key with more than MAX_KEY_PARTS parts
  | "bom" // a leading U+FEFF
  | "bad-character" // a lone surrogate or a control character where none is allowed
  | "bare-cr" // a CR not followed by LF
  | "expected-key" // a statement that does not start with a key, "[" or "#"
  | "expected-equals" // a key without "="
  | "expected-value" // "=" without a value
  | "expected-newline" // something after a value or header on the same line
  | "unterminated-string" // a string with no closing quote
  | "newline-in-string" // a newline inside a single-line string
  | "control-in-string" // a control character inside a string
  | "bad-escape" // a reserved escape
  | "bad-unicode-escape" // \u or \U not followed by enough hex digits, or not a scalar value
  | "bad-number" // a number that breaks the integer or float rules
  | "bad-date-time" // a date or time out of range or malformed
  | "bad-value" // something that is no value at all
  | "unterminated-array" // no "]"
  | "expected-array-comma" // two array values without a comma
  | "unterminated-inline-table" // no "}"
  | "inline-table-newline" // a newline inside an inline table (TOML 1.0.0)
  | "inline-table-trailing-comma" // a comma before "}" (TOML 1.0.0)
  | "expected-inline-comma" // two inline pairs without a comma
  | "bad-header" // a table header that is not closed by "]" or "]]"
  | "duplicate-key" // a key written twice
  | "table-redefined" // a [table] defined twice, or a [table] over a table defined otherwise
  | "dotted-redefines-table" // a dotted key that reopens a table defined by a header or another section's dotted key
  | "immutable" // an addition to an inline table or a static array
  | "not-a-table"; // a key used as a table that holds another kind of value

/** A failure, with where. */
export interface TomlError {
  /** The stable code. */
  code: TomlErrorCode;
  /** 1-based line. */
  line: number;
  /** 1-based column (characters). */
  col: number;
  /** The dotted key concerned, when there is one. */
  key: string;
} // TomlError

/** A TOML 1.1.0 feature, where it was used. */
export interface Toml11Feature {
  /** Which feature. */
  feature: "inline-newline" | "inline-trailing-comma" | "escape-x" | "escape-e" | "time-without-seconds";
  /** 1-based line. */
  line: number;
  /** 1-based column. */
  col: number;
} // Toml11Feature

/** The parse result. */
export type TomlParse =
  | { ok: true; root: TomlTable; version: TomlVersion; features: Toml11Feature[]; crlf: boolean }
  | { ok: false; error: TomlError };

// ---------------------------------------------------------------------------
// The definition-state model (which paths a header or a dotted key defined)
// ---------------------------------------------------------------------------

/** The flags kept per key path (paths ignore array-of-tables element numbers, as the spec's rules do per element). */
interface FlagNode { explicit: boolean; frozen: boolean; frozenAll: boolean; children: Map<string, FlagNode>; } // per path

/** Path flags: EXPLICIT (defined by a header or by a dotted key of a closed section) and FROZEN (inline table or static array). */
class PathFlags {
  /** The root of the flag tree. */
  private root: FlagNode = { explicit: false, frozen: false, frozenAll: false, children: new Map() }; // empty
  /** Paths whose dotted keys become explicit when the current section ends. */
  private pending: string[][] = []; // queued

  /**
   * Find a node, creating the path when asked.
   * @param path the key path
   * @param create true to create missing nodes
   * @returns the node, or null
   */
  private node(path: string[], create: boolean): FlagNode | null {
    // Walk down the tree.
    let n = this.root; // start at the root
    for (const k of path) { // each part
      let c = n.children.get(k); // the child
      if (!c) { if (!create) return null; c = { explicit: false, frozen: false, frozenAll: false, children: new Map() }; n.children.set(k, c); } // created
      n = c; // down
    } // parts
    return n; // the node
  } // node

  /**
   * Is the path explicitly defined?
   * @param path the key path
   * @returns true when a header or a closed section's dotted key defined it
   */
  isExplicit(path: string[]): boolean {
    // Only the node's own flag counts.
    return this.node(path, false)?.explicit ?? false; // flag
  } // isExplicit

  /**
   * Is the path frozen (inside an inline table or a static array)?
   * @param path the key path
   * @returns true when the path or an ancestor is frozen recursively
   */
  isFrozen(path: string[]): boolean {
    // An ancestor frozen recursively freezes everything below it.
    let n = this.root; // start
    for (const k of path) { // each part
      const c = n.children.get(k); // child
      if (!c) return false; // never flagged
      if (c.frozenAll) return true; // a frozen ancestor (or the node itself)
      n = c; // down
    } // parts
    return n.frozen; // the node's own flag
  } // isFrozen

  /**
   * Mark a path explicitly defined.
   * @param path the key path
   */
  setExplicit(path: string[]): void {
    // Create and flag.
    (this.node(path, true) as FlagNode).explicit = true; // flagged
  } // setExplicit

  /**
   * Mark a path frozen with everything below it.
   * @param path the key path
   */
  freeze(path: string[]): void {
    // Create and flag recursively.
    (this.node(path, true) as FlagNode).frozenAll = true; // flagged
  } // freeze

  /**
   * Forget every flag at and below a path (a new array-of-tables element starts fresh).
   * @param path the key path
   */
  clear(path: string[]): void {
    // Remove the node from its parent.
    const parent = this.node(path.slice(0, -1), false); // the parent
    parent?.children.delete(path[path.length - 1]); // forgotten
  } // clear

  /**
   * Queue a path to become explicit when the current section closes.
   * @param path the key path
   */
  addPending(path: string[]): void {
    // Kept until the next header.
    this.pending.push(path); // queued
  } // addPending

  /** Make every queued path explicit (a header was reached). */
  finalizePending(): void {
    // Flag and empty the queue.
    for (const p of this.pending) this.setExplicit(p); // flagged
    this.pending = []; // emptied
  } // finalizePending
} // PathFlags

// ---------------------------------------------------------------------------
// The parser
// ---------------------------------------------------------------------------

/** Thrown inside the parser; turned into a TomlParse at the top. */
class TomlFail extends Error {
  /**
   * @param code the stable code
   * @param pos the index in the (CR LF normalized) text
   * @param key the dotted key concerned
   */
  constructor(public code: TomlErrorCode, public pos: number, public key = "") {
    super(code); // the message is the code
  } // constructor
} // TomlFail

/** Is the character a TOML white space (space or tab)? */
const isWs = (c: string | undefined): boolean => c === " " || c === "\t"; // space or tab
/** Is the character allowed in a bare key? */
const isBare = (c: string | undefined): boolean => c !== undefined && ((c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c === "_" || c === "-"); // A-Za-z0-9_-
/** Is the character an ASCII digit? */
const isDig = (c: string | undefined): boolean => c !== undefined && c >= "0" && c <= "9"; // 0-9
/** Is the character a hexadecimal digit? */
const isHex = (c: string | undefined): boolean => c !== undefined && ((c >= "0" && c <= "9") || (c >= "a" && c <= "f") || (c >= "A" && c <= "F")); // 0-9a-fA-F
/**
 * Is the code a control character TOML refuses (U+0000-U+0008, U+000A-U+001F, U+007F)?
 * @param code a UTF-16 code unit
 * @returns true for a forbidden control character (tab is allowed)
 */
const isCtrl = (code: number): boolean => (code <= 0x1f && code !== 0x09) || code === 0x7f; // controls except tab

/** The parser state for one document. */
class Parser {
  /** The text, CR LF read as LF. */
  readonly s: string;
  /** The grammar in force. */
  readonly version: TomlVersion;
  /** Where each line starts (for positions). */
  private lineStarts: number[] = [0]; // line 1 starts at 0
  /** The cursor. */
  pos = 0;
  /** The 1.1.0 features used. */
  features: Toml11Feature[] = []; // none yet
  /** The definition flags. */
  private flags = new PathFlags(); // empty
  /** The root table. */
  readonly root: TomlTable = { t: "table", entries: new Map(), origin: "root", line: 1, col: 1 }; // the document

  /**
   * @param text the normalized text
   * @param version the grammar
   */
  constructor(text: string, version: TomlVersion) {
    // Keep the text and index the line starts.
    this.s = text; // the text
    this.version = version; // the grammar
    for (let i = 0; i < text.length; i++) if (text[i] === "\n") this.lineStarts.push(i + 1); // each line
  } // constructor

  /**
   * Turn an index into a line and column.
   * @param pos the index
   * @returns 1-based line and column
   */
  where(pos: number): { line: number; col: number } {
    // Binary search for the line.
    let lo = 0; // low bound
    let hi = this.lineStarts.length - 1; // high bound
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (this.lineStarts[mid] <= pos) lo = mid; else hi = mid - 1; } // narrow
    return { line: lo + 1, col: pos - this.lineStarts[lo] + 1 }; // 1-based
  } // where

  /**
   * Record a 1.1.0 feature at a position.
   * @param feature which feature
   * @param pos where
   */
  private use11(feature: Toml11Feature["feature"], pos: number): void {
    // Only reachable in 1.1.0 mode.
    const w = this.where(pos); // position
    this.features.push({ feature, line: w.line, col: w.col }); // recorded
  } // use11

  /** Skip spaces and tabs. */
  private skipWs(): void {
    // Advance while white space.
    while (isWs(this.s[this.pos])) this.pos++; // spaces and tabs
  } // skipWs

  /** Skip a comment to the end of the line, refusing control characters. */
  private skipComment(): void {
    // Only when at "#".
    if (this.s[this.pos] !== "#") return; // no comment
    this.pos++; // past "#"
    while (this.pos < this.s.length && this.s[this.pos] !== "\n") { // to the end of the line
      if (isCtrl(this.s.charCodeAt(this.pos))) throw new TomlFail("bad-character", this.pos); // forbidden in comments
      this.pos++; // next
    } // characters
  } // skipComment

  /** Skip white space, comments and newlines (inside arrays, and inline tables in 1.1.0). */
  private skipWsCommentNewline(): void {
    // Any mix of the three.
    for (;;) { // until something else
      this.skipWs(); // white space
      if (this.s[this.pos] === "#") { this.skipComment(); continue; } // a comment
      if (this.s[this.pos] === "\n") { this.pos++; continue; } // a newline
      return; // something else
    } // loop
  } // skipWsCommentNewline

  /** Parse the whole document. */
  parseDocument(): void {
    // One statement per line.
    let header: string[] = []; // the current table's path
    for (;;) { // each line
      this.skipWs(); // indentation
      const c = this.s[this.pos]; // the first character
      if (c === undefined) return; // the end
      if (c === "\n") { this.pos++; continue; } // an empty line
      if (c === "#") { this.skipComment(); continue; } // a comment line (the newline is read next turn)
      if (c === "[") { // a header
        this.flags.finalizePending(); // the previous section's dotted keys are now defined
        header = this.s[this.pos + 1] === "[" ? this.arrayHeader() : this.tableHeader(); // [[x]] or [x]
      } else this.keyValueStatement(header); // a key/value pair
      this.skipWs(); // trailing white space
      this.skipComment(); // a trailing comment
      const e = this.s[this.pos]; // what follows
      if (e !== undefined && e !== "\n") throw new TomlFail("expected-newline", this.pos); // more on the same line
    } // lines
  } // parseDocument

  /**
   * Parse a key (bare, quoted or dotted).
   * @returns the key parts
   */
  private parseKey(): string[] {
    // One part, then more after dots.
    const parts: string[] = [this.keyPart()]; // the first part
    for (;;) { // dotted parts
      const save = this.pos; // to step back
      this.skipWs(); // white space before a dot
      if (this.s[this.pos] !== ".") { this.pos = save; return parts; } // no more parts
      this.pos++; // past the dot
      this.skipWs(); // white space after it
      if (parts.length >= MAX_KEY_PARTS) throw new TomlFail("too-deep", this.pos); // bounded
      parts.push(this.keyPart()); // the next part
    } // parts
  } // parseKey

  /**
   * Parse one key part.
   * @returns the key text
   */
  private keyPart(): string {
    // Bare or quoted.
    const c = this.s[this.pos]; // first character
    if (c === '"') { if (this.s.startsWith('"""', this.pos)) throw new TomlFail("expected-key", this.pos); return this.basicString(false); } // a basic-string key (never multi-line)
    if (c === "'") { if (this.s.startsWith("'''", this.pos)) throw new TomlFail("expected-key", this.pos); return this.literalString(false); } // a literal-string key
    const start = this.pos; // a bare key
    while (isBare(this.s[this.pos])) this.pos++; // its characters
    if (this.pos === start) throw new TomlFail("expected-key", this.pos); // empty bare keys are not allowed
    return this.s.slice(start, this.pos); // the key
  } // keyPart

  /**
   * Parse [table].
   * @returns the table's path
   */
  private tableHeader(): string[] {
    // "[", key, "]".
    const at = this.pos; // the header's position
    this.pos++; // past "["
    this.skipWs(); // white space
    const key = this.parseKey(); // the path
    this.skipWs(); // white space
    if (this.s[this.pos] !== "]") throw new TomlFail("bad-header", this.pos); // not closed
    this.pos++; // past "]"
    if (this.flags.isExplicit(key) || this.flags.isFrozen(key)) throw new TomlFail("table-redefined", at, key.join(".")); // defined before
    this.flags.setExplicit(key); // now defined
    const t = this.nest(key, at); // created or reopened (an implicit super-table becomes this table)
    const w = this.where(at); // the header's position
    t.origin = "header"; t.line = w.line; t.col = w.col; // recorded
    return key; // the current section
  } // tableHeader

  /**
   * Parse [[array]].
   * @returns the element's path
   */
  private arrayHeader(): string[] {
    // "[[", key, "]]".
    const at = this.pos; // the header's position
    this.pos += 2; // past "[["
    this.skipWs(); // white space
    const key = this.parseKey(); // the path
    this.skipWs(); // white space
    if (!this.s.startsWith("]]", this.pos)) throw new TomlFail("bad-header", this.pos); // not closed
    this.pos += 2; // past "]]"
    if (this.flags.isFrozen(key)) throw new TomlFail("immutable", at, key.join(".")); // a static array or inside an inline table
    this.flags.clear(key); // a new element starts with no definitions
    this.flags.setExplicit(key); // but [key] may not reopen it
    const parent = this.nest(key.slice(0, -1), at); // the containing table
    const last = key[key.length - 1]; // the array's key
    const w = this.where(at); // position
    const el: TomlTable = { t: "table", entries: new Map(), origin: "array-element", line: w.line, col: w.col }; // the new element
    const existing = parent.entries.get(last); // what is there
    if (existing === undefined) parent.entries.set(last, { t: "array", items: [el], aot: true, line: w.line, col: w.col }); // a new array of tables
    else if (existing.t === "array" && existing.aot) existing.items.push(el); // one more element
    else throw new TomlFail(existing.t === "table" ? "table-redefined" : "not-a-table", at, key.join(".")); // a table or a value is there
    return key; // the current section
  } // arrayHeader

  /**
   * Walk to (creating) the table at a path; the last element of an array of tables stands for the array.
   * @param path the key path
   * @param at the position for errors and new tables
   * @returns the table
   */
  private nest(path: string[], at: number): TomlTable {
    // Walk down, creating implicit tables.
    let t = this.root; // start
    const w = this.where(at); // position for new tables
    for (let i = 0; i < path.length; i++) { // each part
      const k = path[i]; // the key
      let v = t.entries.get(k); // what is there
      if (v === undefined) { v = { t: "table", entries: new Map(), origin: "implicit", line: w.line, col: w.col }; t.entries.set(k, v); } // created
      if (v.t === "array" && v.aot) v = v.items[v.items.length - 1]; // the latest element
      if (v.t !== "table") throw new TomlFail("not-a-table", at, path.slice(0, i + 1).join(".")); // a value is there
      t = v; // down
    } // parts
    return t; // the table
  } // nest

  /**
   * Parse key = value inside the current section.
   * @param header the current section's path
   */
  private keyValueStatement(header: string[]): void {
    // Key, "=", value.
    const at = this.pos; // the statement's position
    const key = this.parseKey(); // the key
    this.skipWs(); // white space
    if (this.s[this.pos] !== "=") throw new TomlFail("expected-equals", this.pos); // no "="
    this.pos++; // past "="
    this.skipWs(); // white space
    const value = this.parseValue(0); // the value
    const parentRel = key.slice(0, -1); // the dotted part
    for (let i = 1; i < key.length; i++) { // each table a dotted key creates or uses
      const cont = [...header, ...key.slice(0, i)]; // its absolute path
      if (this.flags.isExplicit(cont)) throw new TomlFail("dotted-redefines-table", at, cont.join(".")); // defined elsewhere
      this.flags.addPending(cont); // defined when this section closes
    } // dotted parts
    const parentAbs = [...header, ...parentRel]; // the table that receives the key
    if (this.flags.isFrozen(parentAbs)) throw new TomlFail("immutable", at, parentAbs.join(".")); // an inline table or a static array
    const t = this.nestDotted(header, parentRel, at); // the receiving table
    const stem = key[key.length - 1]; // the last part
    if (t.entries.has(stem)) throw new TomlFail("duplicate-key", at, [...header, ...key].join(".")); // written twice
    if (value.t === "array" || value.t === "table") this.flags.freeze([...header, ...key]); // inline tables and arrays are closed
    t.entries.set(stem, value); // stored
  } // keyValueStatement

  /**
   * Walk to the table a dotted key writes into, creating dotted tables.
   * @param header the current section's path
   * @param rel the dotted part of the key
   * @param at the position
   * @returns the receiving table
   */
  private nestDotted(header: string[], rel: string[], at: number): TomlTable {
    // The section's table first, then the dotted parts.
    let t = this.nest(header, at); // the section
    const w = this.where(at); // position for new tables
    for (let i = 0; i < rel.length; i++) { // each dotted part
      const k = rel[i]; // the key
      let v = t.entries.get(k); // what is there
      if (v === undefined) { v = { t: "table", entries: new Map(), origin: "dotted", line: w.line, col: w.col }; t.entries.set(k, v); } // created by the dotted key
      if (v.t === "array" && v.aot) v = v.items[v.items.length - 1]; // the latest element
      if (v.t !== "table") throw new TomlFail("not-a-table", at, [...header, ...rel.slice(0, i + 1)].join(".")); // a value is there
      t = v; // down
    } // parts
    return t; // the table
  } // nestDotted

  /**
   * Parse a value.
   * @param depth the nesting depth of arrays and inline tables
   * @returns the value
   */
  parseValue(depth: number): TomlValue {
    // Dispatch on the first character.
    if (depth > MAX_TOML_DEPTH) throw new TomlFail("too-deep", this.pos); // bounded
    const at = this.pos; // the value's position
    const w = this.where(at); // its line and column
    const c = this.s[this.pos]; // the first character
    if (c === undefined || c === "\n" || c === "#") throw new TomlFail("expected-value", this.pos); // nothing
    if (c === '"') { const ml = this.s.startsWith('"""', this.pos); return { t: "string", v: this.basicString(ml), line: w.line, col: w.col, multiline: ml, literal: false }; } // basic
    if (c === "'") { const ml = this.s.startsWith("'''", this.pos); return { t: "string", v: this.literalString(ml), line: w.line, col: w.col, multiline: ml, literal: true }; } // literal
    if (c === "[") return this.array(depth, w); // an array
    if (c === "{") return this.inlineTable(depth, w); // an inline table
    if (this.s.startsWith("true", this.pos) && !isBare(this.s[this.pos + 4])) { this.pos += 4; return { t: "boolean", v: true, line: w.line, col: w.col }; } // true
    if (this.s.startsWith("false", this.pos) && !isBare(this.s[this.pos + 5])) { this.pos += 5; return { t: "boolean", v: false, line: w.line, col: w.col }; } // false
    const dt = this.dateTime(w); // a date or time, if one starts here
    if (dt) return dt; // found
    return this.number(w); // a number (or an error)
  } // parseValue

  /**
   * Parse a basic string, single- or multi-line.
   * @param multiline true for """ ... """
   * @returns the decoded text
   */
  private basicString(multiline: boolean): string {
    // Opening delimiter, body with escapes, closing delimiter.
    const start = this.pos; // for errors
    this.pos += multiline ? 3 : 1; // past the opening quotes
    if (multiline && this.s[this.pos] === "\n") this.pos++; // the first newline is trimmed
    let out = ""; // the decoded text
    for (;;) { // each character
      const c = this.s[this.pos]; // the character
      if (c === undefined) throw new TomlFail("unterminated-string", start); // never closed
      if (c === '"') { // a quote
        if (!multiline) { this.pos++; return out; } // the end
        if (this.s.startsWith('"""', this.pos)) { // a closing run
          let n = 3; // count the quotes in the run
          while (this.s[this.pos + n] === '"') n++; // more quotes
          if (n > 5) throw new TomlFail("unterminated-string", this.pos); // at most two extra quotes before the delimiter
          out += '"'.repeat(n - 3); // the extra quotes belong to the content
          this.pos += n; // past the run
          return out; // the end
        } // closing run
        out += '"'; this.pos++; continue; // one or two quotes inside the content
      } // quote
      if (c === "\\") { // an escape
        const e = this.s[this.pos + 1]; // the escape character
        if (multiline) { // the line-ending backslash
          let j = this.pos + 1; // after the backslash
          while (isWs(this.s[j])) j++; // white space before the newline
          if (this.s[j] === "\n") { // it ends the line
            this.pos = j; // at the newline
            while (isWs(this.s[this.pos]) || this.s[this.pos] === "\n") this.pos++; // trim white space and newlines
            continue; // go on
          } // line ending
        } // multiline
        out += this.escape(e); // a normal escape
        continue; // go on
      } // escape
      if (c === "\n") { if (!multiline) throw new TomlFail("newline-in-string", this.pos); out += "\n"; this.pos++; continue; } // newlines only in multi-line strings
      if (isCtrl(c.charCodeAt(0))) throw new TomlFail("control-in-string", this.pos); // controls refused
      out += c; this.pos++; // an ordinary character
    } // characters
  } // basicString

  /**
   * Decode one escape after a backslash (the cursor is on the backslash).
   * @param e the character after the backslash
   * @returns the decoded text
   */
  private escape(e: string | undefined): string {
    // The fixed escapes first.
    const at = this.pos; // the backslash
    const simple: Record<string, string> = { b: "\b", t: "\t", n: "\n", f: "\f", r: "\r", '"': '"', "\\": "\\" }; // TOML 1.0.0
    if (e !== undefined && e in simple) { this.pos += 2; return simple[e]; } // decoded
    if (this.version === "1.1.0" && e === "e") { this.use11("escape-e", at); this.pos += 2; return "\x1b"; } // TOML 1.1.0: escape
    const len = e === "u" ? 4 : e === "U" ? 8 : this.version === "1.1.0" && e === "x" ? 2 : 0; // hex digits needed
    if (len === 0) throw new TomlFail("bad-escape", at); // reserved
    const hex = this.s.slice(this.pos + 2, this.pos + 2 + len); // the digits
    if (hex.length !== len || ![...hex].every(isHex)) throw new TomlFail("bad-unicode-escape", at); // too few or not hex
    const cp = parseInt(hex, 16); // the code point
    if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) throw new TomlFail("bad-unicode-escape", at); // not a scalar value
    if (e === "x") this.use11("escape-x", at); // TOML 1.1.0
    this.pos += 2 + len; // past the escape
    return String.fromCodePoint(cp); // the character
  } // escape

  /**
   * Parse a literal string, single- or multi-line.
   * @param multiline true for ''' ... '''
   * @returns the text
   */
  private literalString(multiline: boolean): string {
    // No escapes at all.
    const start = this.pos; // for errors
    this.pos += multiline ? 3 : 1; // past the opening quotes
    if (multiline && this.s[this.pos] === "\n") this.pos++; // the first newline is trimmed
    let out = ""; // the text
    for (;;) { // each character
      const c = this.s[this.pos]; // the character
      if (c === undefined) throw new TomlFail("unterminated-string", start); // never closed
      if (c === "'") { // an apostrophe
        if (!multiline) { this.pos++; return out; } // the end
        if (this.s.startsWith("'''", this.pos)) { // a closing run
          let n = 3; // count them
          while (this.s[this.pos + n] === "'") n++; // more
          if (n > 5) throw new TomlFail("unterminated-string", this.pos); // at most two extra
          out += "'".repeat(n - 3); // extras belong to the content
          this.pos += n; // past the run
          return out; // the end
        } // closing run
        out += "'"; this.pos++; continue; // one or two apostrophes inside
      } // apostrophe
      if (c === "\n") { if (!multiline) throw new TomlFail("newline-in-string", this.pos); out += "\n"; this.pos++; continue; } // newlines only in multi-line
      if (isCtrl(c.charCodeAt(0))) throw new TomlFail("control-in-string", this.pos); // controls refused (tab allowed)
      out += c; this.pos++; // an ordinary character
    } // characters
  } // literalString

  /**
   * Parse an array.
   * @param depth the nesting depth
   * @param w the opening bracket's position
   * @returns the array
   */
  private array(depth: number, w: { line: number; col: number }): TomlValue {
    // "[", values separated by commas, optional trailing comma, "]".
    const start = this.pos; // for errors
    this.pos++; // past "["
    const items: TomlValue[] = []; // the values
    for (;;) { // each value
      this.skipWsCommentNewline(); // anything between values
      if (this.s[this.pos] === "]") { this.pos++; return { t: "array", items, aot: false, line: w.line, col: w.col }; } // closed (also after a trailing comma)
      if (this.s[this.pos] === undefined) throw new TomlFail("unterminated-array", start); // never closed
      items.push(this.parseValue(depth + 1)); // a value
      this.skipWsCommentNewline(); // anything after it
      const c = this.s[this.pos]; // comma or close
      if (c === ",") { this.pos++; continue; } // next value
      if (c === "]") { this.pos++; return { t: "array", items, aot: false, line: w.line, col: w.col }; } // closed
      if (c === undefined) throw new TomlFail("unterminated-array", start); // never closed
      throw new TomlFail("expected-array-comma", this.pos); // something else
    } // values
  } // array

  /**
   * Parse an inline table (closed to later additions).
   * @param depth the nesting depth
   * @param w the opening brace's position
   * @returns the table
   */
  private inlineTable(depth: number, w: { line: number; col: number }): TomlValue {
    // "{", key/value pairs separated by commas, "}".
    const start = this.pos; // for errors
    this.pos++; // past "{"
    const table: TomlTable = { t: "table", entries: new Map(), origin: "inline", line: w.line, col: w.col }; // the table
    const local = new PathFlags(); // definitions inside this table
    const v11 = this.version === "1.1.0"; // newlines, comments and a trailing comma allowed
    /** Skip the white space allowed between pairs, recording 1.1.0 newlines. */
    const gap = (): void => { // between pairs
      const before = this.pos; // to detect a newline
      if (v11) this.skipWsCommentNewline(); else this.skipWs(); // 1.1.0 or 1.0.0
      if (v11) for (let i = before; i < this.pos; i++) if (this.s[i] === "\n" || this.s[i] === "#") { this.use11("inline-newline", i); break; } // record once per gap
      if (!v11 && (this.s[this.pos] === "\n" || this.s[this.pos] === "#")) throw new TomlFail("inline-table-newline", this.pos); // 1.0.0: one line only
    }; // gap
    gap(); // after "{"
    if (this.s[this.pos] === "}") { this.pos++; return table; } // empty
    for (;;) { // each pair
      if (this.s[this.pos] === undefined) throw new TomlFail("unterminated-inline-table", start); // never closed
      const at = this.pos; // the pair's position
      const key = this.parseKey(); // the key
      this.skipWs(); // white space
      if (this.s[this.pos] !== "=") throw new TomlFail("expected-equals", this.pos); // no "="
      this.pos++; // past "="
      this.skipWs(); // white space
      const value = this.parseValue(depth + 1); // the value
      if (local.isFrozen(key)) throw new TomlFail("immutable", at, key.join(".")); // inside a nested inline table or array
      let t = table; // walk to the receiving table
      for (let i = 0; i < key.length - 1; i++) { // the dotted parts
        let v = t.entries.get(key[i]); // what is there
        if (v === undefined) { const pw = this.where(at); v = { t: "table", entries: new Map(), origin: "dotted", line: pw.line, col: pw.col }; t.entries.set(key[i], v); } // created
        if (v.t !== "table") throw new TomlFail("not-a-table", at, key.slice(0, i + 1).join(".")); // a value is there
        t = v; // down
      } // dotted parts
      const stem = key[key.length - 1]; // the last part
      if (t.entries.has(stem)) throw new TomlFail("duplicate-key", at, key.join(".")); // written twice
      t.entries.set(stem, value); // stored
      if (value.t === "array" || value.t === "table") local.freeze(key); // nested inline tables and arrays are closed
      gap(); // before a comma or "}"
      const c = this.s[this.pos]; // what follows
      if (c === "}") { this.pos++; return table; } // closed
      if (c !== ",") throw new TomlFail(c === undefined ? "unterminated-inline-table" : "expected-inline-comma", c === undefined ? start : this.pos); // something else
      this.pos++; // past ","
      gap(); // after the comma
      if (this.s[this.pos] === "}") { // a trailing comma
        if (!v11) throw new TomlFail("inline-table-trailing-comma", this.pos); // not in 1.0.0
        this.use11("inline-trailing-comma", this.pos); // recorded
        this.pos++; // past "}"
        return table; // closed
      } // trailing comma
    } // pairs
  } // inlineTable

  /**
   * Read a run of digits.
   * @param n how many are needed exactly
   * @returns the digits, or null when fewer are present
   */
  private digits(n: number): string | null {
    // Exactly n digits at the cursor (not advancing on failure).
    for (let i = 0; i < n; i++) if (!isDig(this.s[this.pos + i])) return null; // missing
    const d = this.s.slice(this.pos, this.pos + n); // the digits
    this.pos += n; // past them
    return d; // the digits
  } // digits

  /**
   * Try to read a time (HH:MM:SS[.frac], or HH:MM in 1.1.0) at the cursor.
   * @returns the end index, or -1 when no time starts here; throws when one starts but is invalid
   */
  private timePart(): number {
    // Two digits and a colon start a time.
    const start = this.pos; // to step back
    const hh = this.digits(2); // hours
    if (hh === null || this.s[this.pos] !== ":") { this.pos = start; return -1; } // not a time
    this.pos++; // past ":"
    const mm = this.digits(2); // minutes
    if (mm === null) throw new TomlFail("bad-date-time", start); // malformed
    let ss = "00"; // seconds when omitted (1.1.0)
    if (this.s[this.pos] === ":") { // seconds
      this.pos++; // past ":"
      const s2 = this.digits(2); // seconds
      if (s2 === null) throw new TomlFail("bad-date-time", start); // malformed
      ss = s2; // kept
      if (this.s[this.pos] === "." ) { // a fraction
        this.pos++; // past "."
        if (!isDig(this.s[this.pos])) throw new TomlFail("bad-date-time", start); // digits needed
        while (isDig(this.s[this.pos])) this.pos++; // the fraction
      } // fraction
    } else if (this.version === "1.1.0") this.use11("time-without-seconds", start); // TOML 1.1.0
    else throw new TomlFail("bad-date-time", start); // seconds required in 1.0.0
    if (Number(hh) > 23 || Number(mm) > 59 || Number(ss) > 59) throw new TomlFail("bad-date-time", start); // out of range (second 60 refused, as tomllib)
    return this.pos; // the end
  } // timePart

  /**
   * Try to read a date, date-time or time value at the cursor.
   * @param w the value's position
   * @returns the value, or null when none starts here
   */
  private dateTime(w: { line: number; col: number }): TomlValue | null {
    // A local time: HH:MM...
    const start = this.pos; // the value's start
    if (isDig(this.s[start]) && isDig(this.s[start + 1]) && this.s[start + 2] === ":") { // a time
      this.timePart(); // read and checked
      return { t: "datetime", kind: "local-time", raw: this.s.slice(start, this.pos), line: w.line, col: w.col }; // local time
    } // time
    if (!(isDig(this.s[start]) && isDig(this.s[start + 1]) && isDig(this.s[start + 2]) && isDig(this.s[start + 3]) && this.s[start + 4] === "-")) return null; // not a date
    this.pos += 5; // past YYYY-
    const mo = this.digits(2); // month
    if (mo === null || this.s[this.pos] !== "-") throw new TomlFail("bad-date-time", start); // malformed
    this.pos++; // past "-"
    const da = this.digits(2); // day
    if (da === null) throw new TomlFail("bad-date-time", start); // malformed
    const y = Number(this.s.slice(start, start + 4)); // year
    const m = Number(mo); // month
    const d = Number(da); // day
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; // leap year
    const dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; // days in the month
    if (m < 1 || m > 12 || d < 1 || d > (dim ?? 0)) throw new TomlFail("bad-date-time", start); // out of range
    const delim = this.s[this.pos]; // T, t, space or nothing
    if (delim === "T" || delim === "t" || delim === " ") { // maybe a time follows
      const save = this.pos; // to step back (a space may be just white space)
      this.pos++; // past the delimiter
      if (this.timePart() < 0) { // no time after all
        if (delim !== " ") throw new TomlFail("bad-date-time", start); // T must be followed by a time
        this.pos = save; // the space is not part of the value
        return { t: "datetime", kind: "local-date", raw: this.s.slice(start, this.pos), line: w.line, col: w.col }; // a date
      } // no time
      const z = this.s[this.pos]; // an offset?
      if (z === "Z" || z === "z") { this.pos++; return { t: "datetime", kind: "offset-date-time", raw: this.s.slice(start, this.pos), line: w.line, col: w.col }; } // UTC
      if (z === "+" || z === "-") { // a numeric offset
        this.pos++; // past the sign
        const oh = this.digits(2); // hours
        if (oh === null || this.s[this.pos] !== ":") throw new TomlFail("bad-date-time", start); // malformed
        this.pos++; // past ":"
        const om = this.digits(2); // minutes
        if (om === null || Number(oh) > 23 || Number(om) > 59) throw new TomlFail("bad-date-time", start); // malformed or out of range
        return { t: "datetime", kind: "offset-date-time", raw: this.s.slice(start, this.pos), line: w.line, col: w.col }; // with offset
      } // offset
      return { t: "datetime", kind: "local-date-time", raw: this.s.slice(start, this.pos), line: w.line, col: w.col }; // local date-time
    } // delimiter
    return { t: "datetime", kind: "local-date", raw: this.s.slice(start, this.pos), line: w.line, col: w.col }; // a date
  } // dateTime

  /**
   * Parse an integer, a float, inf or nan.
   * @param w the value's position
   * @returns the value
   */
  private number(w: { line: number; col: number }): TomlValue {
    // Special floats, prefixed integers, then decimal integers and floats.
    const start = this.pos; // the value's start
    let i = this.pos; // cursor
    const sign = this.s[i] === "+" || this.s[i] === "-" ? this.s[i] : ""; // an optional sign
    if (sign) i++; // past it
    for (const word of ["inf", "nan"]) { // the special floats
      if (this.s.startsWith(word, i) && !isBare(this.s[i + 3])) { // whole word
        this.pos = i + 3; // past it
        const v = word === "nan" ? NaN : sign === "-" ? -Infinity : Infinity; // the value
        return { t: "float", v, raw: this.s.slice(start, this.pos), line: w.line, col: w.col }; // special
      } // word
    } // specials
    if (!sign && this.s[i] === "0" && (this.s[i + 1] === "x" || this.s[i + 1] === "o" || this.s[i + 1] === "b")) { // a prefixed integer
      const base = this.s[i + 1] === "x" ? 16 : this.s[i + 1] === "o" ? 8 : 2; // the base
      const ok = (c: string | undefined) => base === 16 ? isHex(c) : base === 8 ? c !== undefined && c >= "0" && c <= "7" : c === "0" || c === "1"; // digit test
      i += 2; // past the prefix
      if (!ok(this.s[i])) throw new TomlFail("bad-number", start); // a digit must follow the prefix
      let digits = ""; // collected digits
      while (ok(this.s[i]) || (this.s[i] === "_" && ok(this.s[i + 1]) && ok(this.s[i - 1]))) { if (this.s[i] !== "_") digits += this.s[i]; i++; } // digits and single underscores between digits
      if (isBare(this.s[i]) || this.s[i] === ".") throw new TomlFail("bad-number", start); // anything number-like after it
      this.pos = i; // past the number
      const prefix = base === 16 ? "0x" : base === 8 ? "0o" : "0b"; // BigInt's own prefix
      return { t: "integer", v: BigInt(prefix + digits).toString(), raw: this.s.slice(start, i), line: w.line, col: w.col }; // exact
    } // prefixed
    /**
     * Read digits with single underscores between digits.
     * @returns the digits without underscores
     */
    const run = (): string => { // one digit run
      if (!isDig(this.s[i])) throw new TomlFail(this.s[i] === undefined || this.s[i] === "\n" ? "expected-value" : "bad-value", start === i ? start : start); // a digit is needed
      let d = ""; // digits
      while (isDig(this.s[i]) || (this.s[i] === "_" && isDig(this.s[i - 1]) && isDig(this.s[i + 1]))) { if (this.s[i] !== "_") d += this.s[i]; i++; } // digits and underscores
      return d; // the run
    }; // run
    if (!isDig(this.s[i])) throw new TomlFail(sign ? "bad-number" : "bad-value", start); // not a number at all
    const intPart = run(); // the integer part
    if (intPart.length > 1 && intPart[0] === "0") throw new TomlFail("bad-number", start); // leading zeros
    let isFloat = false; // a fraction or an exponent
    if (this.s[i] === "." ) { // a fraction
      i++; // past "."
      if (!isDig(this.s[i])) throw new TomlFail("bad-number", start); // digits needed after the point
      run(); // the fraction
      isFloat = true; // a float
    } // fraction
    if (this.s[i] === "e" || this.s[i] === "E") { // an exponent
      i++; // past "e"
      if (this.s[i] === "+" || this.s[i] === "-") i++; // its sign
      if (!isDig(this.s[i])) throw new TomlFail("bad-number", start); // digits needed
      run(); // the exponent (leading zeros allowed)
      isFloat = true; // a float
    } // exponent
    if (isBare(this.s[i]) || this.s[i] === "." || this.s[i] === ":") throw new TomlFail("bad-number", start); // trailing number-like characters (a malformed date, "1.2.3", "1_")
    this.pos = i; // past the number
    const raw = this.s.slice(start, i); // as written
    const clean = raw.replace(/_/g, ""); // without underscores
    if (isFloat) return { t: "float", v: Number(clean), raw, line: w.line, col: w.col }; // IEEE 754 double
    return { t: "integer", v: BigInt(clean).toString(), raw, line: w.line, col: w.col }; // exact, any size
  } // number
} // Parser

/**
 * Parse with one grammar.
 * @param text the normalized text
 * @param version the grammar
 * @returns the result
 */
function parseWith(text: string, version: TomlVersion): TomlParse & { failPos?: number } {
  // Run the parser and turn failures into results.
  const p = new Parser(text, version); // a fresh parser
  try {
    p.parseDocument(); // the whole document
    return { ok: true, root: p.root, version, features: p.features, crlf: false }; // parsed
  } catch (e) { // a failure
    if (!(e instanceof TomlFail)) throw e; // a defect, not a TOML error
    const w = p.where(Math.min(e.pos, text.length)); // where
    return { ok: false, error: { code: e.code, line: w.line, col: w.col, key: e.key } }; // the error
  } // try
} // parseWith

/**
 * Parse a TOML document: as 1.0.0 first; if that fails, as 1.1.0 (the result names the 1.1.0 features used).
 * @param input the document
 * @returns the root table, or the 1.0.0 error
 */
export function parseToml(input: string): TomlParse {
  // Bounds and whole-text checks first.
  if (input.length > MAX_TOML_CHARS) return { ok: false, error: { code: "too-large", line: 1, col: 1, key: "" } }; // refused
  if (input.charCodeAt(0) === 0xfeff) return { ok: false, error: { code: "bom", line: 1, col: 1, key: "" } }; // a byte order mark
  const crlf = input.includes("\r\n"); // CR LF line endings
  const text = crlf ? input.replace(/\r\n/g, "\n") : input; // read as LF (fixed two-character pattern: linear)
  for (let i = 0; i < text.length; i++) { // whole-text checks
    const c = text.charCodeAt(i); // the code unit
    if (c === 0x0d) { const w = new Parser(text, "1.0.0").where(i); return { ok: false, error: { code: "bare-cr", line: w.line, col: w.col, key: "" } }; } // a CR not followed by LF
    if (c >= 0xd800 && c <= 0xdfff) { // a surrogate: must be a valid pair
      const pair = c <= 0xdbff && i + 1 < text.length && text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff; // high then low
      if (!pair) { const w = new Parser(text, "1.0.0").where(i); return { ok: false, error: { code: "bad-character", line: w.line, col: w.col, key: "" } }; } // a lone surrogate is not Unicode text
      i++; // past the low half
    } // surrogates
  } // characters
  const first = parseWith(text, "1.0.0"); // TOML 1.0.0
  if (first.ok) return { ...first, crlf }; // done
  const second = parseWith(text, "1.1.0"); // TOML 1.1.0
  if (second.ok) return { ...second, crlf }; // a 1.1.0 document
  return first; // the 1.0.0 error
} // parseToml

/**
 * The value at a dotted path, or undefined.
 * @param root the root table
 * @param path the key parts
 * @returns the value
 */
export function getPath(root: TomlTable, path: string[]): TomlValue | undefined {
  // Walk down tables only.
  let v: TomlValue | undefined = root; // start
  for (const k of path) { // each part
    if (!v || v.t !== "table") return undefined; // not a table
    v = v.entries.get(k); // down
  } // parts
  return v; // the value
} // getPath
