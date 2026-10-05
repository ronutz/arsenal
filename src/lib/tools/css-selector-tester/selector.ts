// ============================================================================
// src/lib/tools/css-selector-tester/selector.ts
// ----------------------------------------------------------------------------
// A SELECTOR PARSER for matching: Selectors Level 4 syntax (W3C Working Draft
// 22 January 2026) read into a small tree the matcher walks right to left.
//
// Grammar covered: selector lists; complex selectors with the four combinators
// (descendant, >, +, ~); compound selectors of type / universal (with an
// optional namespace prefix, read but not resolved), #id, .class, [attr],
// [attr op value i|s] with the seven operators of 6.1 and 6.2, pseudo-classes
// with or without arguments (the arguments of :is(), :not(), :where() are
// selector lists; of :has() relative selectors; of :nth-child() and friends
// An+B with an optional "of S"; of :lang() a list of ranges), and
// pseudo-elements (::name, ::name(arg), and the four CSS2 single-colon ones).
// CSS escapes (\XX hex, \c) are decoded; strings may be single- or
// double-quoted. An invalid selector throws SelectorError with a position,
// because "An invalid selector represents, and therefore matches, nothing"
// (3.9) and the page says where it broke.
// ============================================================================

/** A simple selector. */
export type Simple =
  | { kind: "type"; name: string; ns: string | null }
  | { kind: "universal"; ns: string | null }
  | { kind: "id"; value: string }
  | { kind: "class"; value: string }
  | { kind: "attr"; name: string; op: "" | "=" | "~=" | "|=" | "^=" | "$=" | "*="; value: string | null; flag: "i" | "s" | null }
  | { kind: "pseudo"; name: string; arg: string | null; list: SelectorList | null; relative: Relative[] | null; nth: Nth | null; langs: string[] | null };

/** An An+B expression with an optional "of S" list. */
export interface Nth {
  /** The step. */
  a: number;
  /** The offset. */
  b: number;
  /** The "of S" selector list, or null. */
  of: SelectorList | null;
}

/** A pseudo-element at the end of a compound. */
export interface PseudoElement {
  /** The name without colons. */
  name: string;
  /** The argument text, or null. */
  arg: string | null;
  /** True for the single-colon CSS2 spelling. */
  legacy: boolean;
}

/** A compound selector: simple selectors with no combinator between them, plus an optional trailing pseudo-element. */
export interface Compound {
  /** The simple selectors. */
  simples: Simple[];
  /** The pseudo-element, if the compound ends in one. */
  pseudoElement: PseudoElement | null;
}

/** The combinators. */
export type Combinator = " " | ">" | "+" | "~";

/** A complex selector: compounds joined by combinators (combinators[i] sits between compounds[i] and compounds[i + 1]). */
export interface Complex {
  compounds: Compound[];
  combinators: Combinator[];
}

/** A relative selector (the argument of :has()): a leading combinator and a complex selector. */
export interface Relative {
  combinator: Combinator;
  complex: Complex;
}

/** A selector list. */
export type SelectorList = Complex[];

/** A parse error with its position. */
export class SelectorError extends Error {
  /** Zero-based position in the selector text. */
  readonly at: number;
  /** A short code for the message key. */
  readonly code: "empty" | "unexpected" | "bad-attr" | "bad-nth" | "bad-pseudo" | "pseudo-element-position" | "pseudo-element-in-argument" | "nested-has" | "dangling-combinator" | "undeclared-namespace" | "unknown-pseudo";
  constructor(code: SelectorError["code"], at: number, message: string) {
    super(message);
    this.code = code;
    this.at = at;
  }
}

/** Pseudo-classes that take a selector list. */
const LIST_PSEUDOS = new Set(["is", "not", "where", "matches", "-webkit-any"]);
/** The list pseudo-classes whose argument is a <forgiving-selector-list> (16.1): invalid members are dropped, not fatal; :not() is not among them. */
const FORGIVING_PSEUDOS = new Set(["is", "where", "matches", "-webkit-any"]);
/** Pseudo-classes that are valid but can never match in a static document: user action (section 9), :visited, location, resource and display states, shadow-tree hosts, custom states. */
export const NEVER_MATCH_PSEUDOS: ReadonlySet<string> = new Set(["hover", "active", "focus", "focus-visible", "focus-within", "visited", "target", "target-within", "current", "past", "future", "playing", "paused", "seeking", "buffering", "stalled", "muted", "volume-locked", "popover-open", "modal", "fullscreen", "picture-in-picture", "autofill", "user-valid", "user-invalid", "host", "host-context", "local-link", "blank", "state", "active-view-transition", "active-view-transition-type"]);
/** Pseudo-classes that depend on form state this tester does not evaluate (constraint validation, placeholders, defaults): valid, treated as matching nothing. */
export const NOT_EVALUATED_PSEUDOS: ReadonlySet<string> = new Set(["valid", "invalid", "in-range", "out-of-range", "indeterminate", "default", "placeholder-shown"]);
/** Pseudo-classes the matcher evaluates from the tree and the attributes. */
const EVALUATED_PSEUDOS = new Set(["is", "matches", "-webkit-any", "where", "not", "has", "root", "scope", "empty", "first-child", "last-child", "only-child", "first-of-type", "last-of-type", "only-of-type", "nth-child", "nth-last-child", "nth-of-type", "nth-last-of-type", "any-link", "link", "checked", "disabled", "enabled", "open", "required", "optional", "read-only", "read-write", "defined", "lang", "dir"]);
/** Every pseudo-class this tester knows; any other name makes the selector invalid (3.9), as it does in a browser without support for it. */
export const KNOWN_PSEUDO_CLASSES: ReadonlySet<string> = new Set([...EVALUATED_PSEUDOS, ...NEVER_MATCH_PSEUDOS, ...NOT_EVALUATED_PSEUDOS]);
/** Pseudo-classes that take An+B [of S]. */
const NTH_PSEUDOS = new Set(["nth-child", "nth-last-child", "nth-of-type", "nth-last-of-type", "nth-col", "nth-last-col"]);
/** The CSS2 pseudo-elements that may be written with one colon. */
const LEGACY_PSEUDO_ELEMENTS = new Set(["before", "after", "first-line", "first-letter"]);

/** Whether a code point can start an identifier (letters, underscore, non-ASCII, or an escape handled by the caller). */
const isNameStart = (c: string) => /[A-Za-z_]/.test(c) || c.charCodeAt(0) >= 0x80;
/** Whether a code point can continue an identifier. */
const isNameChar = (c: string) => isNameStart(c) || /[0-9-]/.test(c);
/** Selectors whitespace (3.7). */
const isSpace = (c: string) => c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f";

/** The parser. */
class Parser {
  /** The text. */
  private readonly s: string;
  /** The cursor. */
  private i = 0;
  /** Nesting depth inside :has(), which may not nest. */
  private hasDepth = 0;
  /** Non-fatal observations, as "code:what" keys: a block or string closed at the end of input (CSS Syntax 5.5.9, 5.5.10, 4.3.5). Shared with sub-parsers. */
  warnings: Set<string>;
  constructor(s: string, warnings: Set<string> = new Set()) { this.s = s; this.warnings = warnings; }

  /** Parse a whole selector list. */
  list(): SelectorList {
    // The members.
    const out: SelectorList = [];
    // Each complex selector.
    for (;;) {
      this.ws();
      // An empty selector is invalid (3.9).
      if (this.i >= this.s.length || this.s[this.i] === ",") throw new SelectorError("empty", this.i, "empty selector");
      out.push(this.complex(false));
      this.ws();
      // More?
      if (this.i < this.s.length && this.s[this.i] === ",") { this.i++; continue; }
      break;
    }
    // Anything left is an error.
    if (this.i < this.s.length) throw new SelectorError("unexpected", this.i, `unexpected "${this.s[this.i]}"`);
    return out;
  }

  /** Parse a relative selector list (the argument of :has()). */
  relativeList(): Relative[] {
    // The members.
    const out: Relative[] = [];
    for (;;) {
      this.ws();
      // An optional leading combinator; descendant when absent.
      let comb: Combinator = " ";
      if (this.i < this.s.length && (this.s[this.i] === ">" || this.s[this.i] === "+" || this.s[this.i] === "~")) { comb = this.s[this.i] as Combinator; this.i++; this.ws(); }
      if (this.i >= this.s.length || this.s[this.i] === "," || this.s[this.i] === ")") throw new SelectorError("empty", this.i, "empty relative selector");
      out.push({ combinator: comb, complex: this.complex(true) });
      this.ws();
      if (this.i < this.s.length && this.s[this.i] === ",") { this.i++; continue; }
      break;
    }
    return out;
  }

  /** Parse a complex selector up to a comma, a closing parenthesis or the end. */
  private complex(inArg: boolean): Complex {
    // The parts.
    const compounds: Compound[] = [this.compound()];
    const combinators: Combinator[] = [];
    // Combinator, compound, repeat.
    for (;;) {
      // Whitespace may be a descendant combinator or just padding before a real one.
      const before = this.i;
      const sawSpace = this.ws();
      // The end of this complex selector.
      if (this.i >= this.s.length || this.s[this.i] === "," || (inArg && this.s[this.i] === ")")) break;
      // An explicit combinator.
      let comb: Combinator = " ";
      if (this.s[this.i] === ">" || this.s[this.i] === "+" || this.s[this.i] === "~") { comb = this.s[this.i] as Combinator; this.i++; this.ws(); }
      else if (!sawSpace) { this.i = before; throw new SelectorError("unexpected", this.i, `unexpected "${this.s[this.i]}"`); }
      // The next compound must exist.
      if (this.i >= this.s.length || this.s[this.i] === "," || this.s[this.i] === ")") throw new SelectorError("dangling-combinator", this.i, "a combinator with nothing after it");
      // A pseudo-element may only end the whole selector (3.6.1).
      if (compounds[compounds.length - 1].pseudoElement) throw new SelectorError("pseudo-element-position", this.i, "a pseudo-element must be the last part of a selector");
      combinators.push(comb);
      compounds.push(this.compound());
    }
    return { compounds, combinators };
  }

  /** Parse a compound selector. */
  private compound(): Compound {
    // The parts.
    const simples: Simple[] = [];
    let pseudoElement: PseudoElement | null = null;
    // Type or universal first, with an optional namespace prefix: ns|name, *|*, |name.
    const t = this.typeOrUniversal();
    if (t) simples.push(t);
    // Then the rest.
    for (;;) {
      if (this.i >= this.s.length) break;
      const c = this.s[this.i];
      // A pseudo-element already ended the compound: only pseudo-classes may follow it (3.6.3), which the matcher treats as never matching statically.
      if (c === "#") {
        this.i++;
        const v = this.ident();
        if (v === null) throw new SelectorError("unexpected", this.i, "an id selector needs a name");
        simples.push({ kind: "id", value: v });
      } else if (c === ".") {
        this.i++;
        const v = this.ident();
        if (v === null) throw new SelectorError("unexpected", this.i, "a class selector needs a name");
        simples.push({ kind: "class", value: v });
      } else if (c === "[") {
        simples.push(this.attribute());
      } else if (c === ":") {
        // Pseudo-element (::name or a legacy single-colon one) or pseudo-class.
        const dbl = this.s[this.i + 1] === ":";
        // Where this pseudo begins (for the position in an error about it).
        const pStart = this.i;
        this.i += dbl ? 2 : 1;
        const name = this.ident();
        if (name === null) throw new SelectorError("bad-pseudo", this.i, "a pseudo-class needs a name");
        const lower = name.toLowerCase();
        // Argument?
        let arg: string | null = null;
        let argStart = -1;
        if (this.s[this.i] === "(") {
          this.i++;
          argStart = this.i;
          arg = this.balanced();
        }
        if (dbl || LEGACY_PSEUDO_ELEMENTS.has(lower)) {
          // A pseudo-element: must be last in its compound; one per compound.
          if (pseudoElement) throw new SelectorError("pseudo-element-position", pStart, "two pseudo-elements in one compound");
          pseudoElement = { name: lower, arg, legacy: !dbl };
        } else {
          simples.push(this.pseudoClass(lower, arg, argStart, pStart));
        }
      } else break;
    }
    // Nothing at all here.
    if (simples.length === 0 && !pseudoElement) throw new SelectorError("unexpected", this.i, this.i < this.s.length ? `unexpected "${this.s[this.i]}"` : "unexpected end");
    return { simples, pseudoElement };
  }

  /** Read [ns|]name or [ns|]* at the start of a compound. */
  private typeOrUniversal(): Simple | null {
    const save = this.i;
    // A prefix: ident | or * | or just |.
    let ns: string | null = null;
    let first: string | null = null;
    if (this.s[this.i] === "*") { first = "*"; this.i++; }
    else { const id = this.ident(); if (id !== null) first = id; }
    // A namespace separator (not followed by = which would be an attribute operator; here we are outside brackets).
    if (this.s[this.i] === "|" && this.s[this.i + 1] !== "|") {
      ns = first ?? "";
      // No @namespace declarations exist here, so a named prefix is undeclared and the selector invalid (3.9); "*|" and "|" are fine.
      if (ns !== "" && ns !== "*") throw new SelectorError("undeclared-namespace", save, `the namespace prefix "${ns}" is not declared`);
      this.i++;
      if (this.s[this.i] === "*") { this.i++; return { kind: "universal", ns }; }
      const name = this.ident();
      if (name === null) { this.i = save; throw new SelectorError("unexpected", this.i, "a namespace prefix needs an element name"); }
      return { kind: "type", name, ns };
    }
    if (first === null) { this.i = save; return null; }
    if (first === "*") return { kind: "universal", ns: null };
    return { kind: "type", name: first, ns: null };
  }

  /** Read an attribute selector from "[" to "]". */
  private attribute(): Simple {
    const start = this.i;
    this.i++; // [
    this.ws();
    // Name with optional namespace prefix.
    let name = this.ident();
    if (name === null && this.s[this.i] === "*") { this.i++; name = "*"; }
    if (this.s[this.i] === "|" && this.s[this.i + 1] !== "=") {
      // A namespace prefix on the attribute name: only "*|" and "|" can be declared here (3.9).
      if (name !== null && name !== "*") throw new SelectorError("undeclared-namespace", start, `the namespace prefix "${name}" is not declared`);
      this.i++;
      const local = this.ident();
      if (local === null) throw new SelectorError("bad-attr", this.i, "an attribute name is missing");
      name = (name ?? "") + "|" + local;
    }
    if (name === null) throw new SelectorError("bad-attr", this.i, "an attribute name is missing");
    this.ws();
    // Operator.
    let op: Extract<Simple, { kind: "attr" }>["op"] = "";
    const two = this.s.slice(this.i, this.i + 2);
    if (["~=", "|=", "^=", "$=", "*="].includes(two)) { op = two as typeof op; this.i += 2; }
    else if (this.s[this.i] === "=") { op = "="; this.i++; }
    let value: string | null = null;
    let flag: "i" | "s" | null = null;
    if (op !== "") {
      this.ws();
      // A string or an identifier.
      if (this.s[this.i] === '"' || this.s[this.i] === "'") value = this.string();
      else { value = this.ident(); if (value === null) throw new SelectorError("bad-attr", this.i, "an attribute value is missing"); }
      this.ws();
      // The i or s flag.
      const f = this.s[this.i];
      // The flag is a lone i or s before "]", whitespace or the end of input.
      if (f && /[isIS]/.test(f) && (this.i + 1 >= this.s.length || this.s[this.i + 1] === "]" || isSpace(this.s[this.i + 1]))) { flag = f.toLowerCase() as "i" | "s"; this.i++; this.ws(); }
    }
    if (this.i >= this.s.length) {
      // The end of input closes the block, as CSS Syntax does ("<eof-token>: Discard a token from input. Return block.", 5.5.9); noted, not fatal.
      this.warnings.add("eof:[");
      return { kind: "attr", name, op, value, flag };
    }
    if (this.s[this.i] !== "]") throw new SelectorError("bad-attr", this.i, `unexpected "${this.s[this.i]}" in an attribute selector`);
    this.i++;
    return { kind: "attr", name, op, value, flag };
  }

  /** Build a pseudo-class from its name and raw argument. */
  private pseudoClass(name: string, arg: string | null, argStart: number, pStart: number): Simple {
    const base: Simple = { kind: "pseudo", name, arg, list: null, relative: null, nth: null, langs: null };
    // A name this tester does not know makes the selector invalid (3.9), exactly as in a browser without support for it.
    if (!KNOWN_PSEUDO_CLASSES.has(name)) throw new SelectorError("unknown-pseudo", pStart, `:${name} is not a pseudo-class this tester knows`);
    // Selector-list arguments.
    if (LIST_PSEUDOS.has(name)) {
      if (arg === null) throw new SelectorError("bad-pseudo", this.i, `:${name}() needs an argument`);
      if (FORGIVING_PSEUDOS.has(name)) {
        // A <forgiving-selector-list> (16.1): each member is parsed on its own and the invalid ones are dropped; an empty result is valid and matches nothing (4.2).
        base.list = [];
        for (const piece of splitTopLevel(arg)) {
          const sub = new Parser(piece.text, this.warnings);
          sub.hasDepth = this.hasDepth;
          try {
            const member = sub.list();
            // Pseudo-elements are not valid within :is() or :where() (4.2, 4.4): such a member is invalid, so it is dropped too.
            if (member.some((cx) => cx.compounds.some((c) => c.pseudoElement))) continue;
            base.list.push(...member);
          } catch { /* an invalid member is simply ignored (16.1) */ }
        }
        return base;
      }
      // :not() takes a <complex-real-selector-list> (4.3): one invalid member invalidates the selector.
      const sub = new Parser(arg, this.warnings);
      sub.hasDepth = this.hasDepth;
      try { base.list = sub.list(); } catch (e) { const err = e as SelectorError; throw new SelectorError(err.code, argStart + err.at, err.message); }
      // "Pseudo-elements cannot be represented by the negation pseudo-class; they are not valid within :not()" (4.3).
      if (base.list.some((cx) => cx.compounds.some((c) => c.pseudoElement))) throw new SelectorError("pseudo-element-in-argument", argStart, `a pseudo-element is not valid within :${name}()`);
      return base;
    }
    // :has() takes relative selectors and may not nest.
    if (name === "has") {
      if (arg === null) throw new SelectorError("bad-pseudo", this.i, ":has() needs an argument");
      if (this.hasDepth > 0) throw new SelectorError("nested-has", argStart, ":has() is not valid within :has()");
      const sub = new Parser(arg, this.warnings);
      sub.hasDepth = this.hasDepth + 1;
      try { base.relative = sub.relativeList(); } catch (e) { const err = e as SelectorError; throw new SelectorError(err.code, argStart + err.at, err.message); }
      // "Pseudo-elements are not valid within :has()" (4.5).
      if (base.relative.some((r) => r.complex.compounds.some((c) => c.pseudoElement))) throw new SelectorError("pseudo-element-in-argument", argStart, "a pseudo-element is not valid within :has()");
      return base;
    }
    // An+B [of S].
    if (NTH_PSEUDOS.has(name)) {
      if (arg === null) throw new SelectorError("bad-nth", this.i, `:${name}() needs an argument`);
      base.nth = parseNth(arg, argStart, name === "nth-child" || name === "nth-last-child");
      return base;
    }
    // :lang() ranges.
    if (name === "lang") {
      if (arg === null) throw new SelectorError("bad-pseudo", this.i, ":lang() needs an argument");
      // Each range "must be a valid CSS <ident> or <string>" (7.2): quoted, or an identifier.
      const ranges = arg.split(",").map((x) => x.trim());
      if (ranges.some((x) => x === "" || !(/^(["']).*\1$/.test(x) || /^-?[A-Za-z_][\w-]*$/.test(x)))) throw new SelectorError("bad-pseudo", argStart, ":lang() takes identifiers or quoted strings");
      base.langs = ranges.map((x) => x.replace(/^["']|["']$/g, ""));
      return base;
    }
    // :dir(), :state(), :host() and others keep their raw argument.
    return base;
  }

  /** Read a balanced "(...)" argument; the cursor sits after the opening parenthesis; returns the inside and consumes the closing one. */
  private balanced(): string {
    const start = this.i;
    let depth = 1;
    let quote: string | null = null;
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (quote) {
        if (c === "\\") { this.i += 2; continue; }
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "\\") { this.i += 2; continue; }
      else if (c === "(") depth++;
      else if (c === ")") { depth--; if (depth === 0) { const inside = this.s.slice(start, this.i); this.i++; return inside; } }
      this.i++;
    }
    // The end of input closes the function, as CSS Syntax does ("<eof-token>: Discard a token from input. Return function.", 5.5.10); noted, not fatal.
    this.warnings.add("eof:(");
    return this.s.slice(start);
  }

  /** Read an identifier with CSS escapes; null when none starts here. */
  private ident(): string | null {
    const start = this.i;
    let out = "";
    // Up to two leading hyphens (a custom ident may start with two).
    if (this.s[this.i] === "-") { out += "-"; this.i++; }
    if (this.s[this.i] === "-") { out += "-"; this.i++; }
    // What follows the hyphens: after "--" any name character; otherwise a name-start character or an escape.
    const c0 = this.s[this.i];
    if (c0 === undefined || !(c0 === "\\" || (out === "--" ? isNameChar(c0) : isNameStart(c0)))) { this.i = start; return null; }
    // The body.
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === "\\") { out += this.escape(); continue; }
      if (!isNameChar(c)) break;
      out += c;
      this.i++;
    }
    return out;
  }

  /** Read a CSS escape at a backslash. */
  private escape(): string {
    this.i++; // backslash
    const hex = /^[0-9A-Fa-f]{1,6}/.exec(this.s.slice(this.i));
    if (hex) {
      this.i += hex[0].length;
      // One optional whitespace after a hex escape.
      if (isSpace(this.s[this.i] ?? "")) this.i++;
      const cp = parseInt(hex[0], 16);
      return cp === 0 || cp > 0x10ffff ? "�" : String.fromCodePoint(cp);
    }
    const c = this.s[this.i] ?? "�";
    this.i++;
    return c;
  }

  /** Read a quoted string. */
  private string(): string {
    const q = this.s[this.i];
    this.i++;
    let out = "";
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === q) { this.i++; return out; }
      if (c === "\\") { if (this.s[this.i + 1] === "\n") { this.i += 2; continue; } out += this.escape(); continue; }
      out += c;
      this.i++;
    }
    // "EOF: This is a parse error. Return the <string-token>." (CSS Syntax 4.3.5): the string is read as closed; noted, not fatal.
    this.warnings.add("eof:" + q);
    return out;
  }

  /** Skip whitespace; true when any was skipped. */
  private ws(): boolean {
    const start = this.i;
    while (this.i < this.s.length && isSpace(this.s[this.i])) this.i++;
    return this.i > start;
  }
}

/** Parse An+B [of S] (CSS Syntax 3 section 6; Selectors 4 13.3.1). */
/** Split a selector list at its top-level commas, honouring parentheses, brackets, strings and escapes; each piece keeps its offset. */
export function splitTopLevel(text: string): { text: string; at: number }[] {
  // The pieces.
  const out: { text: string; at: number }[] = [];
  // Nesting depth and the open string quote, if any.
  let depth = 0;
  let quote: string | null = null;
  // Where the current piece began.
  let start = 0;
  // Walk.
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      // Inside a string: an escape skips the next character; the matching quote closes it.
      if (c === "\\") { i++; continue; }
      if (c === quote) quote = null;
    } else if (c === "\\") i++;
    else if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth = Math.max(0, depth - 1);
    else if (c === "," && depth === 0) { out.push({ text: text.slice(start, i), at: start }); start = i + 1; }
  }
  // The last piece.
  out.push({ text: text.slice(start), at: start });
  return out;
}

export function parseNth(text: string, at: number, allowOf: boolean): Nth {
  // Split "of S" when allowed.
  let expr = text.trim();
  let of: SelectorList | null = null;
  const m = /^(.*?)\s+of\s+(.+)$/is.exec(expr);
  if (m && allowOf) { expr = m[1].trim(); of = new Parser(m[2]).list(); }
  else if (m && !allowOf) throw new SelectorError("bad-nth", at, "this pseudo-class takes no \"of\" clause");
  // Keywords.
  const lower = expr.toLowerCase().replace(/\s+/g, "");
  if (lower === "even") return { a: 2, b: 0, of };
  if (lower === "odd") return { a: 2, b: 1, of };
  // An+B.
  const n = /^([+-]?\d*)n(?:([+-])(\d+))?$/.exec(lower) ?? /^([+-]?\d*)n$/.exec(lower);
  if (n) {
    const aText = n[1];
    const a = aText === "" || aText === "+" ? 1 : aText === "-" ? -1 : parseInt(aText, 10);
    const b = n[2] ? (n[2] === "-" ? -1 : 1) * parseInt(n[3], 10) : 0;
    return { a, b, of };
  }
  // B alone.
  if (/^[+-]?\d+$/.test(lower)) return { a: 0, b: parseInt(lower, 10), of };
  throw new SelectorError("bad-nth", at, `"${text.trim()}" is not an An+B expression`);
}

/** Parse a selector list. */
export function parseSelectorList(text: string, warnings: Set<string> = new Set()): SelectorList {
  // Delegate; the caller's set receives the non-fatal observations.
  return new Parser(text, warnings).list();
}

/** Serialise a compound back for display (approximate: as written is kept by the caller). */
export function describeCompound(c: Compound): string {
  // Join the simple selectors.
  return c.simples.map((s) => s.kind === "type" ? s.name : s.kind === "universal" ? "*" : s.kind === "id" ? `#${s.value}` : s.kind === "class" ? `.${s.value}` : s.kind === "attr" ? `[${s.name}${s.op}${s.value === null ? "" : JSON.stringify(s.value)}${s.flag ? " " + s.flag : ""}]` : `:${s.name}${s.arg === null ? "" : `(${s.arg})`}`).join("") + (c.pseudoElement ? `${c.pseudoElement.legacy ? ":" : "::"}${c.pseudoElement.name}${c.pseudoElement.arg === null ? "" : `(${c.pseudoElement.arg})`}` : "");
}
