// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/expect-buffer-matching/are.ts
// ----------------------------------------------------------------------------
// TCL'S REGULAR EXPRESSIONS, A STATED SUBSET, MATCHED BY TCL'S OWN RULES
// (2026-10-27), for the expect-buffer-matching lab. `expect -re` hands its
// pattern to Tcl's regexp engine as an Advanced Regular Expression (expect.c in
// Expect 5.45.4 compiles it with TCL_REG_ADVANCED, adding TCL_REG_NOCASE for
// -nocase; read 2026-10-27 at core.tcl-lang.org/expect). JavaScript's RegExp is
// NOT that engine: Tcl picks the match that starts earliest and then, by the
// "preference" rules of re_syntax(n), the longest or the shortest one, where
// JavaScript takes the first alternative that succeeds. On "aab", Tcl's
// a*(ab)? matches all three characters with "ab" in the group; JavaScript
// matches "aa" and leaves the group empty. This module therefore does not
// translate to RegExp. It parses the pattern and matches it itself:
//
//   1. THE MATCH STARTS AS EARLY AS POSSIBLE (re_syntax, MATCHING: "the RE
//      matches the one starting earliest in the string").
//   2. FROM THAT START IT IS THE LONGEST OR THE SHORTEST, by the whole RE's
//      preference: a quantified atom with *, +, ?, {m,} or {m,n} prefers
//      longest, with *?, +?, ??, {m,}? or {m,n}? shortest, {m} and {m}? take the
//      atom's own; a branch has the preference of its first quantified atom
//      that has one; two or more branches joined by | prefer longest.
//   3. SUBEXPRESSIONS then "match the longest or shortest possible substrings,
//      based on their preferences, with subexpressions starting earlier in the
//      RE taking priority over ones starting later". The way this module
//      applies rule 3 follows the structure Henry Spencer's engine builds (a
//      branch is cut at each capturing group and at each atom whose preference
//      differs from the one gathered so far; at each cut the left part takes
//      the longest end that lets the rest still match, or the shortest when it
//      prefers shortest). It was checked against Tcl 8.6.14 and Expect 5.45.4
//      on 27/10/2026 with thousands of generated patterns and buffers, and on
//      every example in the lab's vectors (runs saved as evidence).
//
// THE SUBSET. Literals; "."; bracket expressions with ranges, negation, a
// leading "]" and the escapes \d \s \w \t \n \r and backslash before
// punctuation; \d \D \s \S \w \W \t \n \r outside brackets; ^ and $ (which in
// Expect mean the ends of the buffer, not of a line: the buffer is matched
// without TCL_REG_NEWLINE); groups ( ) and (?: ); | ; and the quantifiers
// * + ? {m} {m,} {m,n} with their non-greedy forms. "." and a negated bracket
// expression match a newline too, as re_syntax says they do outside
// newline-sensitive matching.
//
// REFUSED AS "NOT MODELLED" (Tcl accepts them; this module does not claim to
// match them exactly): back-references, the escapes \x \u \U \0 \e \a \b \B
// \c \f \v and the constraint escapes \A \Z \m \M \y \Y, embedded options such
// as (?i), look-ahead, the ***= and ***: directors, POSIX classes such as
// [[:digit:]] and collating elements, a "{" that does not start a bound, a
// lone "}", a quantifier on a group that captures or that mixes preferences,
// a capturing group inside one of several | branches, and more than nine
// capturing groups (Expect keeps nine).
//
// REFUSED AS "INVALID", with Tcl's own reason (the words of Tcl 8.6.14's
// "couldn't compile regular expression pattern" errors, run 27/10/2026): a
// quantifier with nothing to repeat, unbalanced parentheses, brackets or
// braces, a repetition count above 255 or a minimum above the maximum, an
// unknown escape, a reversed character range.
//
// The subject is ASCII (the lab refuses other characters), so case folding is
// ASCII folding. Pure and deterministic; a work budget bounds the matcher so
// no pattern can stall the page: past it the pattern is refused, never guessed.
// ============================================================================

/** Why Tcl itself would refuse the pattern: the reason in Tcl's own words. */
export type AreInvalidReason =
  | "quantifier operand invalid"
  | "parentheses () not balanced"
  | "brackets [] not balanced"
  | "braces {} not balanced"
  | "invalid repetition count(s)"
  | "invalid escape \\ sequence"
  | "invalid character range";

/** What the lab leaves out, by construct. */
export type AreNotModelled =
  | "backreference"
  | "escape"
  | "embedded-option"
  | "director"
  | "posix-class"
  | "literal-brace"
  | "quantified-group"
  | "capture-in-alternation"
  | "lookahead"
  | "too-many-captures";

/** A refusal: the pattern is invalid in Tcl, outside the modelled subset, or too costly to match here. */
export class AreRefusal extends Error {
  /** Which kind of refusal. */
  readonly kind: "invalid" | "not-modelled" | "too-complex";
  /** The detail: Tcl's reason for "invalid", the construct for "not-modelled", empty for "too-complex". */
  readonly detail: AreInvalidReason | AreNotModelled | "";
  /** Build a refusal from its kind and detail. */
  constructor(kind: "invalid" | "not-modelled" | "too-complex", detail: AreInvalidReason | AreNotModelled | "") {
    // The message for developers.
    super(`${kind}: ${detail}`);
    // The kind, for the lab's words.
    this.kind = kind;
    // The detail, for the lab's words.
    this.detail = detail;
  }
}

/** Spencer's preference and structure flags: prefers longer, prefers shorter, mixed below, captures below. */
const LONGER = 1;
/** Prefers the shorter match. */
const SHORTER = 2;
/** Preferences of both kinds below this node. */
const MIXED = 4;
/** A capturing group below this node. */
const CAP = 8;
/** The two preference bits. */
const LOCAL = LONGER | SHORTER;

/** UP: lift flags to a parent: both preferences together become MIXED, and the preference bits are dropped. */
function up(f: number): number {
  // Both preferences present: mixed.
  const mixed = (f & LONGER) !== 0 && (f & SHORTER) !== 0 ? MIXED : 0;
  // The non-preference bits, plus MIXED when it applies.
  return (f & ~LOCAL) | mixed;
}

/** PREF2: the first operand's preference when it has one, else the second's. */
function pref2(a: number, b: number): number {
  // The first preference wins.
  return (a & LOCAL) !== 0 ? a & LOCAL : b & LOCAL;
}

/** COMBINE: the lifted union of two flag sets, keeping the first preference found. */
function combine(a: number, b: number): number {
  // Lifted union, then the first preference.
  return up(a | b) | pref2(a, b);
}

/** A set of ASCII characters as a 128-entry table (1 = member). */
type CharTable = Uint8Array;

/** One atom: a character set (a literal, ".", a class), a constraint, or a group. */
type Atom =
  | { t: "set"; table: CharTable }
  | { t: "bos" }
  | { t: "eos" }
  | { t: "group"; cap: number; alt: Alt };

/** An atom with its quantifier: min and max repetitions (max -1 = no limit), greedy or not, and the quantifier's form. */
interface Piece {
  /** A stable number, for the memo. */
  id: number;
  /** The atom repeated. */
  atom: Atom;
  /** The fewest repetitions. */
  min: number;
  /** The most repetitions, or -1 for no limit. */
  max: number;
  /** Greedy (true) or non-greedy (false). */
  greedy: boolean;
  /** "none" for no quantifier, "exact" for {m} or {m}?, "range" for every other quantifier. */
  quant: "none" | "exact" | "range";
}

/** A branch: pieces in a row. */
interface Branch {
  /** A stable number, for the memo. */
  id: number;
  /** The pieces in order. */
  items: Piece[];
}

/** An alternation: one or more branches. */
interface Alt {
  /** The branches, in order. */
  branches: Branch[];
}

/** A compiled pattern: its tree, its number of capturing groups and the flags of the whole. */
export interface CompiledAre {
  /** The whole pattern. */
  root: Alt;
  /** How many capturing groups it has. */
  groups: number;
  /** Whether matching folds case (-nocase). */
  nocase: boolean;
}

/** An empty character table. */
function emptyTable(): CharTable {
  // 128 zeroes: no member.
  return new Uint8Array(128);
}

/** A table holding exactly one character. */
function charTable(ch: number): CharTable {
  // Start empty.
  const t = emptyTable();
  // The one member.
  t[ch] = 1;
  // Done.
  return t;
}

/** Add the class of a shorthand escape (d, s, w) to a table. */
function addShorthand(t: CharTable, letter: "d" | "s" | "w"): void {
  // Each ASCII code.
  for (let c = 0; c < 128; c++) {
    // The character for the class tests.
    const ch = String.fromCharCode(c);
    // \d: the ASCII digits (the subject is ASCII, so Unicode digits never occur).
    if (letter === "d" && ch >= "0" && ch <= "9") t[c] = 1;
    // \s: space, tab, newline, carriage return, vertical tab, form feed.
    if (letter === "s" && (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\v" || ch === "\f")) t[c] = 1;
    // \w: letters, digits and underscore.
    if (letter === "w" && /[A-Za-z0-9_]/.test(ch)) t[c] = 1;
  }
}

/** The complement of a table. */
function complement(t: CharTable): CharTable {
  // A fresh table.
  const out = emptyTable();
  // Every code flipped.
  for (let c = 0; c < 128; c++) out[c] = t[c] ? 0 : 1;
  // Done.
  return out;
}

/** Close a table under ASCII case: if a letter is in, its other case is in too. */
function foldTable(t: CharTable): CharTable {
  // A copy to add to.
  const out = new Uint8Array(t);
  // Each code.
  for (let c = 0; c < 128; c++) {
    // Only members spread.
    if (!t[c]) continue;
    // Upper to lower.
    if (c >= 65 && c <= 90) out[c + 32] = 1;
    // Lower to upper.
    if (c >= 97 && c <= 122) out[c - 32] = 1;
  }
  // Done.
  return out;
}

/** The parser's state over one pattern. */
class Parser {
  /** The pattern. */
  private readonly p: string;
  /** The cursor. */
  private i = 0;
  /** Capturing groups seen so far. */
  groups = 0;
  /** Fold case. */
  private readonly nocase: boolean;
  /** The next piece or branch number. */
  private nextId = 1;

  /** Start on a pattern. */
  constructor(p: string, nocase: boolean) {
    // The pattern.
    this.p = p;
    // The case rule.
    this.nocase = nocase;
  }

  /** Parse the whole pattern: an alternation that must consume everything. */
  parseAll(): Alt {
    // Directors: ***= and ***: are Tcl-only.
    if (this.p.startsWith("***")) throw new AreRefusal("not-modelled", "director");
    // Embedded options at the start: (?i) and its kin.
    if (/^\(\?[a-zA-Z]/.test(this.p)) throw new AreRefusal("not-modelled", "embedded-option");
    // The alternation at depth 0.
    const alt = this.parseAlt(0);
    // A stray ")" stops the alternation before the end.
    if (this.i < this.p.length) throw new AreRefusal("invalid", "parentheses () not balanced");
    // The tree.
    return alt;
  }

  /** Parse branches separated by "|" until ")" or the end. */
  private parseAlt(depth: number): Alt {
    // The branches.
    const branches: Branch[] = [this.parseBranch(depth)];
    // More after each "|".
    while (this.p[this.i] === "|") {
      // Past the bar.
      this.i++;
      // The next branch.
      branches.push(this.parseBranch(depth));
    }
    // Done.
    return { branches };
  }

  /** Parse pieces until "|", ")" or the end. */
  private parseBranch(depth: number): Branch {
    // The pieces.
    const items: Piece[] = [];
    // Until a branch boundary.
    while (this.i < this.p.length && this.p[this.i] !== "|" && this.p[this.i] !== ")") items.push(this.parsePiece(depth));
    // A ")" at depth 0 is unbalanced.
    if (this.p[this.i] === ")" && depth === 0) throw new AreRefusal("invalid", "parentheses () not balanced");
    // The branch.
    return { id: this.nextId++, items };
  }

  /** Parse one atom and its quantifier. */
  private parsePiece(depth: number): Piece {
    // The atom.
    const atom = this.parseAtom(depth);
    // The quantifier, when one follows.
    const q = this.parseQuantifier();
    // A constraint cannot be repeated.
    if (q && (atom.t === "bos" || atom.t === "eos")) throw new AreRefusal("invalid", "quantifier operand invalid");
    // A second quantifier in a row has nothing to repeat.
    if (q && this.atQuantifier()) throw new AreRefusal("invalid", "quantifier operand invalid");
    // The piece without a quantifier.
    if (!q) return { id: this.nextId++, atom, min: 1, max: 1, greedy: true, quant: "none" };
    // The piece with one.
    return { id: this.nextId++, atom, min: q.min, max: q.max, greedy: q.greedy, quant: q.exact ? "exact" : "range" };
  }

  /** True when the cursor sits on a quantifier. */
  private atQuantifier(): boolean {
    // The character there.
    const c = this.p[this.i];
    // *, + and ? always; { only before a digit (the bound syntax).
    return c === "*" || c === "+" || c === "?" || (c === "{" && /[0-9]/.test(this.p[this.i + 1] ?? ""));
  }

  /** Read a quantifier, or return null when none follows. */
  private parseQuantifier(): { min: number; max: number; greedy: boolean; exact: boolean } | null {
    // The character at the cursor.
    const c = this.p[this.i];
    // The bounds and form.
    let min: number;
    let max: number;
    let exact = false;
    if (c === "*") {
      // Zero or more.
      min = 0;
      max = -1;
      this.i++;
    } else if (c === "+") {
      // One or more.
      min = 1;
      max = -1;
      this.i++;
    } else if (c === "?") {
      // Zero or one.
      min = 0;
      max = 1;
      this.i++;
    } else if (c === "{") {
      // A "{" that does not start a bound is Tcl's literal-brace rule, not modelled.
      if (!/[0-9]/.test(this.p[this.i + 1] ?? "")) throw new AreRefusal("not-modelled", "literal-brace");
      // Past the brace.
      this.i++;
      // The first number.
      const m = this.readNumber();
      // {m}
      if (this.p[this.i] === "}") {
        min = m;
        max = m;
        exact = true;
        this.i++;
      } else if (this.p[this.i] === ",") {
        // Past the comma.
        this.i++;
        // {m,} or {m,n}
        if (this.p[this.i] === "}") {
          min = m;
          max = -1;
          this.i++;
        } else if (/[0-9]/.test(this.p[this.i] ?? "")) {
          // The second number.
          const n = this.readNumber();
          // It must close.
          if (this.p[this.i] !== "}") throw this.braceProblem();
          min = m;
          max = n;
          this.i++;
        } else throw this.braceProblem();
      } else throw this.braceProblem();
      // Tcl's limit is 255 and the minimum may not pass the maximum.
      if (min > 255 || max > 255 || (max !== -1 && min > max)) throw new AreRefusal("invalid", "invalid repetition count(s)");
    } else return null;
    // A following "?" makes it non-greedy.
    let greedy = true;
    if (this.p[this.i] === "?") {
      // Past it.
      this.i++;
      greedy = false;
    }
    // The quantifier.
    return { min, max, greedy, exact };
  }

  /** The refusal for a bound that does not close: Tcl's when the pattern ends, not modelled otherwise. */
  private braceProblem(): AreRefusal {
    // The end of the pattern inside a bound is Tcl's "braces {} not balanced" (a{2 in the run).
    if (this.i >= this.p.length) return new AreRefusal("invalid", "braces {} not balanced");
    // Anything else inside a bound is not modelled.
    return new AreRefusal("not-modelled", "literal-brace");
  }

  /** Read a run of decimal digits as a number. */
  private readNumber(): number {
    // Where the digits start.
    const from = this.i;
    // Every digit.
    while (/[0-9]/.test(this.p[this.i] ?? "")) this.i++;
    // The value (capped by its length so a long run cannot overflow anything).
    return Number(this.p.slice(from, Math.min(this.i, from + 6)));
  }

  /** Parse one atom. */
  private parseAtom(depth: number): Atom {
    // The character at the cursor.
    const c = this.p[this.i];
    // A quantifier with nothing before it.
    if (this.atQuantifier()) throw new AreRefusal("invalid", "quantifier operand invalid");
    // The constraints.
    if (c === "^") {
      this.i++;
      return { t: "bos" };
    }
    if (c === "$") {
      this.i++;
      return { t: "eos" };
    }
    // Any character.
    if (c === ".") {
      this.i++;
      return { t: "set", table: complement(emptyTable()) };
    }
    // A group.
    if (c === "(") return this.parseGroup(depth);
    // A bracket expression.
    if (c === "[") return { t: "set", table: this.fold(this.parseBracket()) };
    // An escape.
    if (c === "\\") return { t: "set", table: this.fold(this.parseEscape()) };
    // A brace that does not start a bound, or a lone close brace: Tcl's literal-brace rules.
    if (c === "{" || c === "}") throw new AreRefusal("not-modelled", "literal-brace");
    // A literal character.
    this.i++;
    return { t: "set", table: this.fold(charTable(c.charCodeAt(0))) };
  }

  /** Fold a table under -nocase. */
  private fold(t: CharTable): CharTable {
    // Only with -nocase.
    return this.nocase ? foldTable(t) : t;
  }

  /** Parse "(", "(?:" or a refused "(?" form, the inner alternation, and ")". */
  private parseGroup(depth: number): Atom {
    // Past "(".
    this.i++;
    // The capture number, 0 for a non-capturing group.
    let cap = 0;
    if (this.p[this.i] === "?") {
      // (?: is a non-capturing group.
      if (this.p[this.i + 1] === ":") this.i += 2;
      // (?= and (?! are look-ahead; any other (? form is an option or unknown.
      else throw new AreRefusal("not-modelled", this.p[this.i + 1] === "=" || this.p[this.i + 1] === "!" ? "lookahead" : "embedded-option");
    } else {
      // A capturing group takes the next number.
      cap = ++this.groups;
    }
    // The inside.
    const alt = this.parseAlt(depth + 1);
    // It must close.
    if (this.p[this.i] !== ")") throw new AreRefusal("invalid", "parentheses () not balanced");
    // Past ")".
    this.i++;
    // The group.
    return { t: "group", cap, alt };
  }

  /** Parse an escape outside brackets. */
  private parseEscape(): CharTable {
    // The character after the backslash.
    const n = this.p[this.i + 1];
    // A trailing backslash.
    if (n === undefined) throw new AreRefusal("invalid", "invalid escape \\ sequence");
    // Past both.
    this.i += 2;
    // Shorthand classes.
    if (n === "d" || n === "s" || n === "w") {
      const t = emptyTable();
      addShorthand(t, n);
      return t;
    }
    // Their complements.
    if (n === "D" || n === "S" || n === "W") {
      const t = emptyTable();
      addShorthand(t, n.toLowerCase() as "d" | "s" | "w");
      return complement(t);
    }
    // Control characters.
    if (n === "t") return charTable(9);
    if (n === "n") return charTable(10);
    if (n === "r") return charTable(13);
    // Digits: back-references (and \0, an octal entry).
    if (/[0-9]/.test(n)) throw new AreRefusal("not-modelled", n === "0" ? "escape" : "backreference");
    // Other letters Tcl knows: character entries and constraint escapes, not modelled.
    if (/[abBcefvxuUAZmMyY]/.test(n)) throw new AreRefusal("not-modelled", "escape");
    // Any other letter is not an escape Tcl knows.
    if (/[A-Za-z]/.test(n)) throw new AreRefusal("invalid", "invalid escape \\ sequence");
    // Backslash before anything else: that character itself.
    return charTable(n.charCodeAt(0));
  }

  /** Parse a bracket expression, the cursor on "[". */
  private parseBracket(): CharTable {
    // Past "[".
    this.i++;
    // Negated?
    let negate = false;
    if (this.p[this.i] === "^") {
      negate = true;
      this.i++;
    }
    // The members.
    const t = emptyTable();
    // A "]" first is an ordinary member.
    let first = true;
    while (true) {
      // The character at the cursor.
      const c = this.p[this.i];
      // Ran off the end.
      if (c === undefined) throw new AreRefusal("invalid", "brackets [] not balanced");
      // The close, unless it is the first member.
      if (c === "]" && !first) {
        this.i++;
        break;
      }
      first = false;
      // POSIX classes, collating elements and equivalence classes.
      if (c === "[" && (this.p[this.i + 1] === ":" || this.p[this.i + 1] === "." || this.p[this.i + 1] === "=")) throw new AreRefusal("not-modelled", "posix-class");
      // One member: a code, or null when a shorthand class (\d \s \w) was added to the table.
      const lo = this.bracketMember(t);
      // A "-" that would start a range here (not the last member before "]").
      const rangeNext = this.p[this.i] === "-" && this.p[this.i + 1] !== undefined && this.p[this.i + 1] !== "]";
      // A class cannot start a range: not modelled.
      if (lo === null) {
        if (rangeNext) throw new AreRefusal("not-modelled", "escape");
        continue;
      }
      // A plain member.
      if (!rangeNext) {
        t[lo] = 1;
        continue;
      }
      // A range: past "-", then its upper end.
      this.i++;
      const hi = this.bracketMember(t);
      // A class cannot end a range: not modelled.
      if (hi === null) throw new AreRefusal("not-modelled", "escape");
      // A reversed range is an error in Tcl ([z-a] in the run).
      if (hi < lo) throw new AreRefusal("invalid", "invalid character range");
      // Every code in the range.
      for (let x = lo; x <= hi; x++) t[x] = 1;
      // A second "-" chaining another range is an error in Tcl ([a-c-e] in the run).
      if (this.p[this.i] === "-" && this.p[this.i + 1] !== undefined && this.p[this.i + 1] !== "]") throw new AreRefusal("invalid", "invalid character range");
    }
    // Fold first, then negate, as Tcl's -nocase does for negated sets ([^a] excludes a and A).
    const folded = this.nocase ? foldTable(t) : t;
    // The set.
    return negate ? complement(folded) : folded;
  }

  /** One bracket member: its code, or null when it was a shorthand class, which is added to the table directly. */
  private bracketMember(t: CharTable): number | null {
    // The character at the cursor.
    const c = this.p[this.i];
    // Not an escape: the character itself.
    if (c !== "\\") {
      this.i++;
      return c.charCodeAt(0);
    }
    // The escaped character.
    const n = this.p[this.i + 1];
    // A trailing backslash inside brackets.
    if (n === undefined) throw new AreRefusal("invalid", "brackets [] not balanced");
    // Past both.
    this.i += 2;
    // \D \S \W are invalid inside brackets (run: [\D] is "invalid escape \ sequence").
    if (n === "D" || n === "S" || n === "W") throw new AreRefusal("invalid", "invalid escape \\ sequence");
    // Control characters.
    if (n === "t") return 9;
    if (n === "n") return 10;
    if (n === "r") return 13;
    // Shorthand classes join the set as a whole.
    if (n === "d" || n === "s" || n === "w") {
      addShorthand(t, n);
      return null;
    }
    // Other letters and digits: Tcl escapes or errors; not modelled here.
    if (/[A-Za-z0-9]/.test(n)) throw new AreRefusal("not-modelled", "escape");
    // Backslash before punctuation: the punctuation itself.
    return n.charCodeAt(0);
  }
}

/** Flags of an atom. */
function atomFlags(a: Atom): number {
  // Only groups carry flags.
  if (a.t !== "group") return 0;
  // The inside's flags, plus CAP for a capturing group.
  return altFlags(a.alt) | (a.cap ? CAP : 0);
}

/** The preference a piece's quantifier gives. */
function qprefer(p: Piece): number {
  // Only the range forms have one: greedy prefers longer, non-greedy shorter.
  return p.quant === "range" ? (p.greedy ? LONGER : SHORTER) : 0;
}

/** One node of a branch's chain: a run of merged pieces, or one piece cut out on its own. */
interface ChainNode {
  /** The pieces of the node. */
  pieces: Piece[];
  /** Its flags (preference, mixed, captures). */
  flags: number;
  /** The piece, when the node is a single cut-out piece. */
  item: Piece | null;
}

/** Cut a branch into its chain: merged runs, and the pieces that capture or would mix preferences. */
function buildChain(items: Piece[]): ChainNode[] {
  // The nodes.
  const nodes: ChainNode[] = [];
  // The run being gathered and its flags.
  let run: Piece[] = [];
  let runFlags = 0;
  for (const p of items) {
    // The atom's and the quantifier's flags.
    const af = atomFlags(p.atom);
    const qf = qprefer(p);
    // What the run would become with this piece in it.
    const f = runFlags | qf | af;
    // A plain piece that keeps one preference joins the run.
    const capturing = p.atom.t === "group" && p.atom.cap > 0;
    if (!capturing && (up(f) & (MIXED | CAP)) === 0) {
      run.push(p);
      runFlags = f;
      continue;
    }
    // Otherwise the run so far becomes a node, the piece its own node, and a new run starts.
    nodes.push({ pieces: run, flags: runFlags, item: null });
    nodes.push({ pieces: [p], flags: combine(qf, af), item: p });
    run = [];
    runFlags = 0;
  }
  // The last run (possibly empty).
  nodes.push({ pieces: run, flags: runFlags, item: null });
  // Done.
  return nodes;
}

/** The flags of a branch: its chain's, the first preference winning. */
function branchFlags(b: Branch): number {
  // The chain.
  const nodes = buildChain(b.items);
  // Folded from the end: each node's flags, combined with what follows.
  let acc = nodes[nodes.length - 1].flags;
  for (let k = nodes.length - 2; k >= 0; k--) acc = nodes[k].flags | combine(nodes[k].flags, acc);
  // Done.
  return acc;
}

/** The flags of an alternation: one branch's own, or LONGER for several (MIXED when a branch prefers otherwise). */
function altFlags(a: Alt): number {
  // One branch: its flags.
  if (a.branches.length === 1) return branchFlags(a.branches[0]);
  // Several: longer, lifting each branch's flags into the whole.
  let f = LONGER;
  for (const b of a.branches) f |= up(LONGER | branchFlags(b));
  // Done.
  return f;
}

/** True when an alternation holds a capturing group anywhere. */
function altHasCap(a: Alt): boolean {
  // The CAP flag says it.
  return (altFlags(a) & CAP) !== 0;
}

/** Refuse the structures the dissection below does not model. */
function checkStructure(a: Alt): void {
  // Several branches with a capture inside: which branch took part is not modelled.
  if (a.branches.length > 1 && altHasCap(a)) throw new AreRefusal("not-modelled", "capture-in-alternation");
  // Each piece.
  for (const b of a.branches) {
    for (const p of b.items) {
      // Only groups go deeper.
      if (p.atom.t !== "group") continue;
      // A repeated group that captures or mixes preferences: Tcl's iteration rules, not modelled.
      if (p.quant !== "none" && (up(atomFlags(p.atom)) & (MIXED | CAP)) !== 0) throw new AreRefusal("not-modelled", "quantified-group");
      // Inside the group.
      checkStructure(p.atom.alt);
    }
  }
}

/** Compile a pattern; throws AreRefusal for an invalid or unmodelled one. */
export function compileAre(pattern: string, nocase: boolean): CompiledAre {
  // Parse.
  const parser = new Parser(pattern, nocase);
  const root = parser.parseAll();
  // Expect keeps nine groups; the lab refuses more rather than drop some.
  if (parser.groups > 9) throw new AreRefusal("not-modelled", "too-many-captures");
  // The structures the dissection models.
  checkStructure(root);
  // The compiled pattern.
  return { root, groups: parser.groups, nocase };
}

/** The default work budget: steps of the matcher before it refuses. */
export const ARE_STEP_BUDGET = 2_000_000;

/** A work allowance that matching spends; when it runs out the pattern is refused as too complex. */
export interface WorkBudget {
  /** Steps still allowed. */
  left: number;
}

/** One match: where it starts and ends (end exclusive) and each group's span. */
export interface AreMatch {
  /** Start offset. */
  start: number;
  /** End offset (exclusive). */
  end: number;
  /** Each capturing group's [start, end), in order. */
  groups: [number, number][];
}

/** The matcher over one subject. */
class Matcher {
  /** The subject. */
  private readonly s: string;
  /** Its length. */
  private readonly n: number;
  /** Memo of piece ends: piece id and position. */
  private readonly memoPiece = new Map<number, number[]>();
  /** Memo of range ends, keyed by branch id, from, to and position packed into one number. */
  private readonly memoRange = new Map<number, number[]>();
  /** The work budget, shared with the caller so several subjects can draw on one allowance. */
  private readonly budget: WorkBudget;

  /** Start on a subject with a work budget. */
  constructor(s: string, budget: WorkBudget) {
    // The subject.
    this.s = s;
    // Its length.
    this.n = s.length;
    // The allowance.
    this.budget = budget;
  }

  /** Count work; refuse past the budget. */
  private tick(k = 1): void {
    // Spend.
    this.budget.left -= k;
    // Past the budget: refuse.
    if (this.budget.left < 0) throw new AreRefusal("too-complex", "");
  }

  /** The end positions an atom reaches from a position. */
  private atomEnds(a: Atom, pos: number): number[] {
    // One unit of work.
    this.tick();
    // A character set reads one character.
    if (a.t === "set") return pos < this.n && a.table[this.s.charCodeAt(pos)] ? [pos + 1] : [];
    // ^ at the buffer's start only.
    if (a.t === "bos") return pos === 0 ? [pos] : [];
    // $ at the buffer's end only.
    if (a.t === "eos") return pos === this.n ? [pos] : [];
    // A group: its alternation.
    return this.altEnds(a.alt, pos);
  }

  /** The end positions an alternation reaches from a position. */
  altEnds(a: Alt, pos: number): number[] {
    // The union of the branches.
    const out = new Set<number>();
    for (const b of a.branches) for (const e of this.rangeEnds(b, 0, b.items.length, pos)) out.add(e);
    // Sorted.
    return [...out].sort((x, y) => x - y);
  }

  /** The end positions a piece reaches: its atom repeated between min and max times. */
  private pieceEnds(p: Piece, pos: number): number[] {
    // The memo key.
    const key = p.id * 100003 + pos;
    // Reuse.
    const hit = this.memoPiece.get(key);
    if (hit) return hit;
    // Positions after exactly k repetitions, starting with k = 0.
    let level = new Set<number>([pos]);
    // Positions reachable with at least min repetitions.
    const result = new Set<number>();
    // Zero repetitions count when min is 0.
    if (p.min === 0) result.add(pos);
    // Repeat.
    for (let k = 1; p.max === -1 || k <= p.max; k++) {
      // One more repetition from every position of the previous level.
      const next = new Set<number>();
      for (const q of level) for (const e of this.atomEnds(p.atom, q)) next.add(e);
      // Nothing more is reachable.
      if (next.size === 0) break;
      // Past the minimum, check whether anything new appeared; stop at the fixed point.
      let fresh = false;
      if (k >= p.min) for (const e of next) if (!result.has(e)) { result.add(e); fresh = true; }
      // At or past the minimum with nothing new: later levels add nothing either.
      if (k > p.min && !fresh) break;
      // Guard: no more levels than positions plus one past the minimum.
      if (k > p.min + this.n + 1) break;
      // The next level.
      level = next;
      // Work.
      this.tick(next.size);
    }
    // Sorted and remembered.
    const out = [...result].sort((x, y) => x - y);
    this.memoPiece.set(key, out);
    return out;
  }

  /** The end positions pieces from..to of a branch reach from a position. */
  rangeEnds(b: Branch, from: number, to: number, pos: number): number[] {
    // Nothing to match: here.
    if (from >= to) return [pos];
    // The memo key: positions stay below 4,096 and piece indices below 128 (the lab's limits), so the packing is exact.
    const key = ((b.id * 128 + from) * 128 + to) * 4096 + pos;
    const hit = this.memoRange.get(key);
    if (hit) return hit;
    // The first piece, then the rest from each of its ends.
    const out = new Set<number>();
    for (const e of this.pieceEnds(b.items[from], pos)) for (const f of this.rangeEnds(b, from + 1, to, e)) out.add(f);
    // Work.
    this.tick(out.size + 1);
    // Sorted and remembered.
    const res = [...out].sort((x, y) => x - y);
    this.memoRange.set(key, res);
    return res;
  }

  /** Assign the groups of a branch matched exactly over [b, e]. */
  dissectBranch(br: Branch, b: number, e: number, groups: [number, number][]): void {
    // The chain of nodes.
    const nodes = buildChain(br.items);
    // A branch with nothing to cut holds no group.
    if (nodes.length === 1) return;
    // Piece offsets of each node within the branch.
    const offsets: number[] = [];
    let at = 0;
    for (const nd of nodes) {
      offsets.push(at);
      at += nd.pieces.length;
    }
    // Walk the chain: at each cut the left node takes its preferred end that lets the rest match to e.
    let pos = b;
    for (let k = 0; k < nodes.length; k++) {
      // The node and where its pieces are.
      const nd = nodes[k];
      const from = offsets[k];
      const to = from + nd.pieces.length;
      // The last node takes what is left.
      let mid = e;
      if (k < nodes.length - 1) {
        // The node's possible ends from here.
        const ends = this.rangeEnds(br, from, to, pos);
        // The rest's span.
        const restFrom = to;
        const restTo = br.items.length;
        // Shorter-preferring nodes try the smallest end first, all others the largest.
        const order = (nd.flags & SHORTER) !== 0 ? ends : [...ends].reverse();
        // The first end from which the rest still reaches e.
        const found = order.find((m) => m <= e && this.rangeEnds(br, restFrom, restTo, m).includes(e));
        // The overall match guarantees one exists.
        if (found === undefined) throw new Error("dissection found no cut: a bug in the model");
        mid = found;
      }
      // A cut-out group: record it when it captures, and go inside when it holds groups.
      if (nd.item && nd.item.atom.t === "group") {
        const g = nd.item.atom;
        if (g.cap > 0) groups[g.cap - 1] = [pos, mid];
        if (altHasCap(g.alt)) this.dissectBranch(g.alt.branches[0], pos, mid, groups);
      }
      // On to the next node.
      pos = mid;
    }
  }
}

/** Match a compiled pattern against a subject: the earliest start, then the preferred end, then the groups (budget shared with the caller). */
export function execAre(re: CompiledAre, subject: string, budget: WorkBudget = { left: ARE_STEP_BUDGET }): AreMatch | null {
  // A matcher for this subject.
  const m = new Matcher(subject, budget);
  // The whole pattern's preference.
  const shorter = (altFlags(re.root) & SHORTER) !== 0;
  // Every start, earliest first, up to and including the end (an empty match at the end counts).
  for (let start = 0; start <= subject.length; start++) {
    // The ends from this start.
    const ends = m.altEnds(re.root, start);
    // None: try the next start.
    if (ends.length === 0) continue;
    // The preferred end.
    const end = shorter ? ends[0] : ends[ends.length - 1];
    // The groups, unset until dissected.
    const groups: [number, number][] = Array.from({ length: re.groups }, () => [-1, -1] as [number, number]);
    // Groups exist only in a single-branch root (checkStructure refuses the rest).
    if (re.groups > 0) m.dissectBranch(re.root.branches[0], start, end, groups);
    // The match.
    return { start, end, groups };
  }
  // No start matched.
  return null;
}
