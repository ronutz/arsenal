// ============================================================================
// src/lib/tools/pyproject-toml-explainer/pep508.ts
// ----------------------------------------------------------------------------
// Dependency specifiers (originally PEP 508): parse one requirement string into
// its name, extras, version specifier set or direct URL, and environment
// marker, and say what the specification says about each part.
//
// THE RULES: Python Packaging User Guide, "Dependency specifiers"
// (packaging.python.org/en/latest/specifications/dependency-specifiers/),
// read 2026-10-27 (history to "July 2026: Explain that extra != "name" is not
// (properly) supported"). PEP 508 (Final) was read the same day.
//   - The grammar: specification = wsp* ( url_req | name_req ) wsp*;
//     name_req = name wsp* extras? wsp* versionspec? wsp* quoted_marker?;
//     url_req = name wsp* extras? wsp* urlspec (wsp+ | end) quoted_marker?;
//     names and extras are identifiers (letters and digits, with runs of
//     "-", "_", "." only between them); versionspec is version_many, or
//     version_many in parentheses (accepted for PEP 345, "should not be
//     generated"); version_many allows a trailing comma (June 2024);
//     "===" is tried before "==" (December 2025).
//   - Markers: marker_or / marker_and / marker_expr with parentheses; "and"
//     binds tighter than "or"; comparison chaining is not supported;
//     operators ==, !=, <, <=, >, >=, ~=, ===, in, not in; user supplied
//     constants in ' or ", no triple quotes.
//   - Marker fields and their types (String, Version, Version | String, Set
//     of strings, extra) and the comparison rules of "Marker comparisons":
//     ordered comparisons and ~= / === on String fields, in / not in on
//     Version fields, constants that are not valid versions for Version
//     fields, comparisons with no marker field, "extra" with anything but
//     ==, and the lock-file-only fields extras and dependency_groups are
//     reported as findings (publishing tools SHOULD emit an error for them).
//   - Extras in a requirement: core metadata 2.3 names (PEP 685); publishing
//     tools SHOULD enforce them.
//
// WHERE packaging 26.3 (the oracle) IS MORE LENIENT THAN THE GRAMMAR, this
// module accepts what packaging accepts and reports a finding instead of an
// error: the legacy marker names os.name, sys.platform, platform.version,
// platform.machine, platform.python_implementation and python_implementation;
// constants holding characters outside the grammar's python_str_c set
// (the specification says tools MAY accept non-ASCII; backslash escapes are
// "not specified"). Where packaging is stricter it is followed: a URL ends at
// the first space or tab, so a ";" written straight after a URL is part of the
// URL (the explainer warns about it). Where packaging departs from the grammar it is NOT followed: a "==="
// clause followed by a comma is accepted here (packaging's requirement parser
// reads the comma into the arbitrary version), and "===" needs a version.
//
// Every scan is a character loop (no regular expression with nested
// quantifiers); input length is bounded by the caller.
// ============================================================================

import { isAsciiAlnum, normalizeName, isStrictExtraName } from "../wheel-filename-explainer/names"; // names
import { parseSpecifierSet, parseClause, trimWsp, type SpecifierSetParse } from "../wheel-filename-explainer/pep440"; // versions

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The marker fields the specification defines, and the legacy names packaging accepts. */
export const MARKER_FIELDS = [
  "python_version", "python_full_version", "os_name", "sys_platform", "platform_release", "platform_system", "platform_version",
  "platform_machine", "platform_python_implementation", "implementation_name", "implementation_version", "extra", "extras", "dependency_groups",
] as const; // the specification's table
/** One defined marker field. */
export type MarkerField = (typeof MARKER_FIELDS)[number];
/** Legacy names packaging maps to defined fields. */
export const LEGACY_FIELDS: Record<string, MarkerField> = {
  "os.name": "os_name", "sys.platform": "sys_platform", "platform.version": "platform_version", "platform.machine": "platform_machine",
  "platform.python_implementation": "platform_python_implementation", python_implementation: "platform_python_implementation",
}; // packaging's VARIABLE token
/** The type of each field ("Marker field types"). */
export const FIELD_TYPE: Record<MarkerField, "string" | "version" | "version-or-string" | "set" | "extra"> = {
  python_version: "version", python_full_version: "version", implementation_version: "version", // Version
  platform_release: "version-or-string", platform_version: "version-or-string", // Version | String
  os_name: "string", sys_platform: "string", platform_machine: "string", platform_python_implementation: "string", platform_system: "string", implementation_name: "string", // String
  extras: "set", dependency_groups: "set", // Set of strings (lock files only)
  extra: "extra", // special
}; // FIELD_TYPE

/** One side of a marker comparison. */
export type MarkerOperand = { field: MarkerField; written: string } | { value: string; quote: "'" | '"' };

/** A parsed marker expression. */
export type MarkerNode =
  | { k: "and" | "or"; left: MarkerNode; right: MarkerNode }
  | { k: "cmp"; left: MarkerOperand; op: string; right: MarkerOperand; text: string };

/** What the specification says about a marker comparison (findings, not syntax errors). */
export type MarkerFindingCode =
  | "legacy-field" // os.name and the like: not in the grammar
  | "no-field" // both sides are constants (tools MAY error)
  | "string-ordered" // <, <=, >, >= on a String field
  | "string-version-op" // ~= or === on a String field
  | "version-in" // in or not in on a Version field
  | "version-bad-constant" // a constant that is not a valid version for a Version field
  | "set-misuse" // a Set field with anything but "constant" in / not in field
  | "lock-file-field" // extras or dependency_groups outside a lock file
  | "extra-not-equal" // extra != "name": SHOULD NOT be used
  | "extra-other-op" // extra with any other operator
  | "extra-not-normalized" // extra == "Name" (compared after normalization)
  | "string-characters"; // a constant with characters outside python_str_c

/** One marker finding. */
export interface MarkerFinding {
  /** The stable code. */
  code: MarkerFindingCode;
  /** The comparison it concerns, as written. */
  text: string;
  /** Extra values for the message. */
  params: Record<string, string>;
} // MarkerFinding

/** Why a requirement string is not a dependency specifier. */
export type RequirementErrorCode =
  | "empty" // nothing
  | "expected-name" // does not start with a name
  | "bad-extras" // "[" not followed by identifiers separated by commas and "]"
  | "bad-specifier" // a version clause that is not valid
  | "unclosed-parenthesis" // "(" without ")"
  | "expected-url" // "@" without a URL
  | "expected-marker" // ";" without a marker
  | "bad-marker" // a marker that does not follow the grammar
  | "unterminated-string" // a constant without its closing quote
  | "too-deep" // parentheses nested deeper than MAX_MARKER_DEPTH
  | "trailing"; // text after the end of the specifier

/** A parse failure. */
export interface RequirementError {
  /** The stable code. */
  code: RequirementErrorCode;
  /** 0-based index where it was found. */
  at: number;
} // RequirementError

/** A parsed requirement. */
export interface Requirement {
  /** The text as given. */
  text: string;
  /** The name as written. */
  name: string;
  /** Its normalized form. */
  normalizedName: string;
  /** Extras as written. */
  extras: string[];
  /** Extras that are not core metadata 2.3 names, with their normalized forms. */
  extrasToNormalize: Array<{ written: string; normalized: string }>;
  /** The version specifier set, or null. */
  specifier: SpecifierSetParse | null;
  /** The specifier was written in parentheses (PEP 345 style). */
  parenthesized: boolean;
  /** The direct URL, or null. */
  url: string | null;
  /** The URL's scheme (lower case), or "". */
  urlScheme: string;
  /** The URL carries a #<hash-algorithm>=<value> fragment. */
  urlHasHash: boolean;
  /** The marker, or null. */
  marker: MarkerNode | null;
  /** The marker as written. */
  markerText: string;
  /** Findings about the marker. */
  markerFindings: MarkerFinding[];
} // Requirement

/** The outcome of parseRequirement. */
export type RequirementParse = { ok: true; req: Requirement } | { ok: false; error: RequirementError; versionClause: string };

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/** Thrown inside the parser. */
class ReqFail extends Error {
  /**
   * @param code the stable code
   * @param at the index
   */
  constructor(public code: RequirementErrorCode, public at: number) {
    super(code); // the message is the code
  } // constructor
} // ReqFail

/** The deepest nesting of parentheses read in a marker (no stack exhaustion on hostile input). */
export const MAX_MARKER_DEPTH = 64; // far above any real marker

/** Is the character a grammar white space (space or tab)? */
const isWsp = (c: string | undefined): boolean => c === " " || c === "\t"; // wsp
/** The marker fields, longest name first. */
const FIELDS_LONGEST_FIRST: MarkerField[] = [...MARKER_FIELDS].sort((a, b) => b.length - a.length); // computed once
/** The grammar's python_str_c characters (besides letters and digits): its punctuation list. */
const PY_STR_PUNCT = new Set([..." \t().{}-_*#:;,/?[]!~`@$%^&=+|<>"]); // python_str_c without letters and digits

/** The requirement parser state. */
class ReqParser {
  /** The cursor. */
  i = 0;
  /** Marker findings. */
  findings: MarkerFinding[] = []; // collected
  /** The current parenthesis depth. */
  depth = 0; // nesting
  /**
   * @param s the requirement text
   */
  constructor(readonly s: string) {} // the text

  /** Skip spaces and tabs. */
  ws(): void {
    // Advance past wsp.
    while (isWsp(this.s[this.i])) this.i++; // spaces and tabs
  } // ws

  /**
   * Read an identifier: letterOrDigit, then runs of "-", "_", "." followed by letterOrDigit.
   * @returns the identifier, or "" when none starts here
   */
  identifier(): string {
    // First character must be a letter or digit.
    const start = this.i; // start
    if (!isAsciiAlnum(this.s[this.i] ?? "")) return ""; // none
    this.i++; // past it
    for (;;) { // the rest
      if (isAsciiAlnum(this.s[this.i] ?? "")) { this.i++; continue; } // a letter or digit
      let j = this.i; // a run of separators
      while (this.s[j] === "-" || this.s[j] === "_" || this.s[j] === ".") j++; // the run
      if (j > this.i && isAsciiAlnum(this.s[j] ?? "")) { this.i = j + 1; continue; } // must be followed by a letter or digit
      break; // the identifier ends
    } // rest
    return this.s.slice(start, this.i); // the identifier
  } // identifier

  /**
   * Parse the whole specification.
   * @returns the requirement
   */
  parse(): Requirement {
    // wsp* name.
    this.ws(); // leading white space
    const nameAt = this.i; // for errors
    const name = this.identifier(); // the name
    if (name === "") throw new ReqFail(this.s.trim() === "" ? "empty" : "expected-name", nameAt); // none
    this.ws(); // white space
    const extras: string[] = []; // the extras
    if (this.s[this.i] === "[") { // extras
      const open = this.i; // for errors
      this.i++; // past "["
      this.ws(); // white space
      if (this.s[this.i] !== "]") { // a non-empty list
        for (;;) { // each extra
          const e = this.identifier(); // the extra
          if (e === "") throw new ReqFail("bad-extras", this.i); // not an identifier
          extras.push(e); // kept
          this.ws(); // white space
          if (this.s[this.i] === ",") { this.i++; this.ws(); continue; } // another
          break; // the list ends
        } // extras
      } // list
      if (this.s[this.i] !== "]") throw new ReqFail("bad-extras", this.s[this.i] === undefined ? open : this.i); // not closed
      this.i++; // past "]"
      this.ws(); // white space
    } // extras
    let specifier: SpecifierSetParse | null = null; // the version specifier
    let parenthesized = false; // in parentheses
    let url: string | null = null; // the direct URL
    if (this.s[this.i] === "@") { // a URL requirement
      this.i++; // past "@"
      this.ws(); // white space
      const u = this.i; // the URL's start
      while (this.i < this.s.length && !isWsp(this.s[this.i])) this.i++; // to the first space or tab
      if (this.i === u) throw new ReqFail("expected-url", u); // nothing
      url = this.s.slice(u, this.i); // the URL
      this.ws(); // white space (a ";" with none before it stayed inside the URL, as packaging reads it)
    } else { // a name requirement: an optional version specifier
      const paren = this.s[this.i] === "("; // PEP 345 style
      if (paren) { this.i++; this.ws(); } // past "("
      const vs = this.i; // the specifier's start
      while (this.i < this.s.length && this.s[this.i] !== ";" && this.s[this.i] !== ")" && !(this.s[this.i] === "@")) this.i++; // to ";", ")" or the end
      const text = this.s.slice(vs, this.i); // the specifier text
      if (text.trim() !== "" || paren) { // a specifier is written
        if (!/^[ \t]*[~=!<>]/.test(text)) { // not an operator: the name or extras ended badly
          throw new ReqFail("trailing", vs + (text.length - text.replace(/^[ \t]+/, "").length)); // unexpected text
        } // no operator
        specifier = parseSpecifierSet(text); // the set
        if (!specifier.ok) throw new ReqFail("bad-specifier", vs); // an invalid clause
        parenthesized = paren; // remembered
      } // specifier
      if (paren) { // the closing parenthesis
        if (this.s[this.i] !== ")") throw new ReqFail("unclosed-parenthesis", this.i); // missing
        this.i++; // past ")"
      } // paren
      this.ws(); // white space
    } // name requirement
    let marker: MarkerNode | null = null; // the marker
    let markerText = ""; // as written
    if (this.s[this.i] === ";") { // a marker
      this.i++; // past ";"
      this.ws(); // white space
      const ms = this.i; // its start
      if (this.i >= this.s.length) throw new ReqFail("expected-marker", this.i); // nothing after ";"
      marker = this.markerOr(); // the marker
      markerText = trimWsp(this.s.slice(ms, this.i)); // as written
      this.ws(); // trailing white space
    } // marker
    if (this.i < this.s.length) throw new ReqFail("trailing", this.i); // anything left
    const extrasToNormalize = extras.filter((e) => !isStrictExtraName(e)).map((e) => ({ written: e, normalized: normalizeName(e) })); // PEP 685
    const scheme = url ? (/^([A-Za-z][A-Za-z0-9+.-]*):/.exec(url)?.[1] ?? "").toLowerCase() : ""; // the URL's scheme (one class run before ":")
    const fragment = url !== null && url.includes("#") ? url.slice(url.indexOf("#") + 1) : ""; // the URL fragment
    const urlHasHash = fragment.split("&").some((entry) => /^(md5|sha1|sha224|sha256|sha384|sha512)=[0-9A-Fa-f]+$/.test(entry)); // a <hash-algorithm>=<expected-hash> entry (anchored, linear)
    return { text: this.s, name, normalizedName: normalizeName(name), extras, extrasToNormalize, specifier, parenthesized, url, urlScheme: scheme, urlHasHash, marker, markerText, markerFindings: this.findings }; // the requirement
  } // parse

  /**
   * marker_or = marker_and (wsp* "or" marker_and)*
   * @returns the expression
   */
  markerOr(): MarkerNode {
    // Left-associative "or".
    let left = this.markerAnd(); // the first operand
    for (;;) { // more
      const save = this.i; // to step back
      this.ws(); // white space
      if (this.word("or")) { left = { k: "or", left, right: this.markerAnd() }; continue; } // another operand
      this.i = save; // not "or"
      return left; // done
    } // operands
  } // markerOr

  /**
   * marker_and = marker_expr (wsp* "and" marker_expr)*
   * @returns the expression
   */
  markerAnd(): MarkerNode {
    // Left-associative "and".
    let left = this.markerExpr(); // the first operand
    for (;;) { // more
      const save = this.i; // to step back
      this.ws(); // white space
      if (this.word("and")) { left = { k: "and", left, right: this.markerExpr() }; continue; } // another operand
      this.i = save; // not "and"
      return left; // done
    } // operands
  } // markerAnd

  /**
   * Is a whole word at the cursor (followed by something that is not a letter, digit or "_")? Consumes it when so.
   * @param w the word
   * @returns true when consumed
   */
  word(w: string): boolean {
    // The word, then a boundary.
    if (!this.s.startsWith(w, this.i)) return false; // not here
    const after = this.s[this.i + w.length]; // the next character
    if (after !== undefined && (isAsciiAlnum(after) || after === "_")) return false; // part of a longer word
    this.i += w.length; // consumed
    return true; // found
  } // word

  /**
   * marker_expr = marker_var marker_op marker_var | wsp* "(" marker wsp* ")"
   * @returns the expression
   */
  markerExpr(): MarkerNode {
    // Parentheses first.
    this.ws(); // white space
    if (this.s[this.i] === "(") { // a group
      const open = this.i; // for errors
      if (++this.depth > MAX_MARKER_DEPTH) throw new ReqFail("too-deep", open); // bounded
      this.i++; // past "("
      const inner = this.markerOr(); // the group
      this.depth--; // back out
      this.ws(); // white space
      if (this.s[this.i] !== ")") throw new ReqFail(this.s[this.i] === undefined ? "bad-marker" : "bad-marker", this.s[this.i] === undefined ? open : this.i); // not closed
      this.i++; // past ")"
      return inner; // the group
    } // group
    const start = this.i; // the comparison's start
    const left = this.markerVar(); // the left side
    const op = this.markerOp(); // the operator
    const right = this.markerVar(); // the right side
    const node: MarkerNode = { k: "cmp", left, op, right, text: this.s.slice(start, this.i) }; // the comparison
    this.check(node); // the specification's comparison rules
    return node; // done
  } // markerExpr

  /**
   * marker_var = wsp* (env_var | python_str)
   * @returns the operand
   */
  markerVar(): MarkerOperand {
    // A quoted constant or a field name.
    this.ws(); // white space
    const q = this.s[this.i]; // a quote?
    if (q === "'" || q === '"') { // a constant
      const start = this.i; // for errors
      const end = this.s.indexOf(q, this.i + 1); // the closing quote
      if (end < 0) throw new ReqFail("unterminated-string", start); // never closed
      const value = this.s.slice(this.i + 1, end); // the constant
      this.i = end + 1; // past it
      return { value, quote: q }; // the constant
    } // constant
    for (const name of Object.keys(LEGACY_FIELDS)) { // legacy names first (longest forms contain dots)
      if (this.word(name)) return { field: LEGACY_FIELDS[name], written: name }; // a legacy spelling
    } // legacy
    for (const name of FIELDS_LONGEST_FIRST) { // longest first, so "extras" is tried before "extra"
      if (this.word(name)) return { field: name, written: name }; // a field
    } // fields
    throw new ReqFail("bad-marker", this.i); // neither
  } // markerVar

  /**
   * marker_op = version_cmp | wsp* "in" | wsp* "not" wsp+ "in"
   * @returns the operator
   */
  markerOp(): string {
    // Comparison operators, then the words.
    this.ws(); // white space
    for (const op of ["===", "==", "~=", "!=", "<=", ">=", "<", ">"]) if (this.s.startsWith(op, this.i)) { this.i += op.length; return op; } // a comparison
    if (this.word("in")) return "in"; // membership
    if (this.word("not")) { // "not in"
      const before = this.i; // white space is required
      this.ws(); // wsp+
      if (this.i > before && this.word("in")) return "not in"; // found
    } // not in
    throw new ReqFail("bad-marker", this.i); // no operator
  } // markerOp

  /**
   * Apply the "Marker comparisons" rules to one comparison and record findings.
   * @param n the comparison
   */
  check(n: Extract<MarkerNode, { k: "cmp" }>): void {
    // Collect findings for this comparison.
    /** Record one finding. */
    const add = (code: MarkerFindingCode, params: Record<string, string> = {}) => this.findings.push({ code, text: n.text, params }); // push
    for (const side of [n.left, n.right]) { // each operand
      if ("field" in side && side.written !== side.field) add("legacy-field", { written: side.written, field: side.field }); // a legacy spelling
      if ("value" in side && [...side.value].some((c) => !isAsciiAlnum(c) && !PY_STR_PUNCT.has(c) && c !== (side.quote === "'" ? '"' : "'"))) add("string-characters", { value: side.value }); // outside python_str_c
    } // operands
    const lf = "field" in n.left ? n.left.field : null; // the left field
    const rf = "field" in n.right ? n.right.field : null; // the right field
    if (!lf && !rf) { add("no-field"); return; } // two constants
    const field = (lf ?? rf) as MarkerField; // the field compared
    const constant = "value" in n.left ? n.left.value : "value" in n.right ? n.right.value : null; // the constant, if any
    const type = FIELD_TYPE[field]; // its type
    const member = n.op === "in" || n.op === "not in"; // a membership test
    const ordered = ["<", "<=", ">", ">="].includes(n.op); // an ordered comparison
    if (type === "set") { // extras, dependency_groups
      add("lock-file-field", { field }); // lock files only
      if (!member || rf !== field || lf !== null) add("set-misuse", { field }); // only "constant" in field
      return; // nothing more
    } // set
    if (type === "extra") { // extra
      if (n.op === "!=") add("extra-not-equal"); // SHOULD NOT be used
      else if (n.op !== "==") add("extra-other-op", { op: n.op }); // undefined
      if (constant !== null && constant !== normalizeName(constant)) add("extra-not-normalized", { normalized: normalizeName(constant) }); // compared after normalization
      return; // nothing more
    } // extra
    if (type === "string") { // String fields
      if (ordered) add("string-ordered", { field, op: n.op }); // SHOULD emit an error
      if (n.op === "~=" || n.op === "===") add("string-version-op", { field, op: n.op }); // SHOULD emit an error
      return; // nothing more
    } // string
    if (type === "version") { // Version fields
      if (member) { add("version-in", { field }); return; } // not valid for Version fields
      if (n.op !== "===" && constant !== null && rf === null) { // field op "constant"
        const c = parseClause(`${n.op}${constant}`); // as a version clause
        if ("code" in c) add("version-bad-constant", { field, value: constant }); // not a valid version
      } // constant
    } // version
  } // check
} // ReqParser

/**
 * Parse one dependency specifier.
 * @param text the requirement string
 * @returns the requirement, or the error and where
 */
export function parseRequirement(text: string): RequirementParse {
  // Run the parser; turn failures into results.
  const p = new ReqParser(text); // a fresh parser
  try {
    return { ok: true, req: p.parse() }; // parsed
  } catch (e) { // a failure
    if (!(e instanceof ReqFail)) throw e; // a defect
    let versionClause = ""; // the failing clause, for bad-specifier
    if (e.code === "bad-specifier") { // find the clause
      const rest = text.slice(e.at); // from the specifier on
      const end = rest.search(/[;)]/); // to ";" or ")" (one class)
      const set = parseSpecifierSet(end < 0 ? rest : rest.slice(0, end)); // re-read
      versionClause = set.errors[0]?.text ?? ""; // the first bad clause
    } // clause
    return { ok: false, error: { code: e.code, at: e.at }, versionClause }; // the failure
  } // try
} // parseRequirement

/**
 * Write a marker back in its normal form, as packaging prints it: single spaces, the canonical field names, each
 * constant in double quotes (single quotes when it holds a double quote), the value compared with "extra" (and the
 * value on the left of "in" / "not in" extras or dependency_groups) normalized like a name, and parentheses only
 * where "or" sits inside "and" or where the writer grouped.
 * @param n the marker
 * @param parent the enclosing operator ("" at the top)
 * @returns the text
 */
export function markerToString(n: MarkerNode, parent = ""): string {
  // Comparisons first.
  if (n.k === "cmp") { // a comparison
    const isField = (o: MarkerOperand, names: string[]) => "field" in o && names.includes(o.field); // a field test
    const normLeft = isField(n.right, ["extra", "extras", "dependency_groups"]) || isField(n.left, ["extra"]); // packaging normalizes these
    const normRight = isField(n.left, ["extra"]); // and this one
    const side = (o: MarkerOperand, norm: boolean) => { // one side
      if ("field" in o) return o.field; // the canonical field name
      const v = norm ? normalizeName(o.value) : o.value; // the constant
      return v.includes('"') ? `'${v}'` : `"${v}"`; // quoted
    }; // side
    return `${side(n.left, normLeft)} ${n.op} ${side(n.right, normRight)}`; // the comparison
  } // cmp
  const inner = `${markerToString(n.left, n.k)} ${n.k} ${markerToString(n.right, n.k)}`; // both sides
  return parent === "and" && n.k === "or" ? `(${inner})` : inner; // parentheses where precedence needs them
} // markerToString
