// ============================================================================
// src/lib/tools/css-specificity-calculator/compute.ts
// ----------------------------------------------------------------------------
// THE CSS SPECIFICITY CALCULATOR: the pure engine (rank 10 of the 2026-10 campaign).
//
// One or more CSS selectors in, and out comes each one's specificity as the
// triple (A, B, C) of Selectors Level 4, with every simple selector named and
// its contribution shown, the selectors ranked against each other the way the
// cascade would rank them, and the cases people get wrong under pressure
// called out: :where() counting as nothing, :is(), :not() and :has() taking
// the most specific of their arguments, :nth-child(... of S) adding its
// argument, the universal selector counting as nothing, a repeated class
// counting twice, a legacy single-colon pseudo-element counting as one, and
// the reminder that !important, inline styles and cascade layers are decided
// before specificity is ever consulted.
//
// FACTS. Selectors Level 4 (W3C Working Draft 22 January 2026), "Calculating a
// selector's specificity": count ID selectors (A); class selectors, attribute
// selectors and pseudo-classes (B); type selectors and pseudo-elements (C);
// ignore the universal selector; :is(), :not(), :has() take the specificity of
// their most specific argument; :nth-child() and :nth-last-child() count as one
// pseudo-class plus their most specific argument; :where() is zero; "Repeated
// occurrences of the same simple selector are allowed and do increase
// specificity"; the examples table. CSS Cascading and Inheritance Level 5
// (Candidate Recommendation Snapshot 13 January 2022), 6.1 Cascade Sorting
// Order: origin and importance, context, element-attached styles, layers,
// specificity, order of appearance. CSS Shadow Module Level 1 (Editor's Draft
// 28 April 2026): :host() and :host-context() count as a pseudo-class plus the
// argument; ::slotted() as a pseudo-element plus the argument. All read
// 2026-10-05; the manifest carries the citations.
//
// Pure parsing, nothing fetched, nothing evaluated against a document.
// ============================================================================

/** The input: one or more selectors, separated by commas or line breaks. */
export interface SpecificityInput {
  /** The selectors as typed. */
  selectors: string;
}

/** The upper bound on the input. */
export const SELECTORS_MAX_CHARS = 20000;

/** The triple. */
export type Specificity = [number, number, number];

/** What a piece of a compound selector is. */
export type PieceKind = "type" | "universal" | "id" | "class" | "attribute" | "pseudo-class" | "pseudo-element" | "combinator";

/** One piece of a selector with its contribution. */
export interface Piece {
  /** The kind. */
  kind: PieceKind;
  /** The text as written. */
  text: string;
  /** Which column it adds to, or null for none (universal, combinator, :where()). */
  adds: "A" | "B" | "C" | null;
  /** The contribution, when the piece is a functional pseudo-class or pseudo-element whose argument counts. */
  contribution: Specificity;
  /** A note id explaining a special rule, or null. */
  note: "universal" | "where-zero" | "is-max" | "not-max" | "has-max" | "nth-of" | "legacy-pseudo-element" | "host-plus" | "slotted-plus" | "part" | "repeated" | null;
  /** For functional pseudo-classes with selector arguments: the arguments analysed. */
  args?: SelectorAnalysis[];
}

/** One selector analysed. */
export interface SelectorAnalysis {
  /** As written, trimmed. */
  selector: string;
  /** The pieces in order, combinators included. */
  pieces: Piece[];
  /** The specificity. */
  specificity: Specificity;
  /** The specificity written as "A,B,C". */
  text: string;
  /** The specificity as a single comparable number for display only (A*65536 + B*256 + C; the comparison itself is lexicographic). */
  weight: number;
  /** An error that stopped parsing, or null. */
  error: { what: "unbalanced" | "empty-compound" | "dangling-combinator" | "unexpected"; at: number } | null;
}

/** The result. */
export interface SpecificityResult {
  /** The selectors in the order given. */
  selectors: SelectorAnalysis[];
  /** Indexes into `selectors`, most specific first; ties keep their order of appearance. */
  ranking: number[];
  /** Groups of indexes with equal specificity (only groups of two or more). */
  ties: number[][];
  /** The highest specificity among the valid selectors, or null. */
  top: Specificity | null;
}

/** Legacy pseudo-elements that CSS2 wrote with one colon and Selectors still accepts that way. */
const LEGACY_PSEUDO_ELEMENTS = new Set(["before", "after", "first-line", "first-letter"]);

/** Pseudo-classes whose argument is a selector list and whose specificity is the most specific argument. */
const MAX_ARG_PSEUDO_CLASSES = new Set(["is", "not", "has", "matches", "-webkit-any", "-moz-any"]);

/** Pseudo-classes that count as one pseudo-class plus their argument. */
const PLUS_ARG_PSEUDO_CLASSES = new Set(["host", "host-context"]);

/** Pseudo-classes of the form An+B [of S]. */
const NTH_OF_PSEUDO_CLASSES = new Set(["nth-child", "nth-last-child"]);

/** Refuse an oversized input. */
function limit(text: string): void {
  // The bound exists so a pasted stylesheet cannot stall the page.
  if (text.length > SELECTORS_MAX_CHARS) throw new Error(`The input is longer than ${SELECTORS_MAX_CHARS} characters.`);
}

/** Add two triples. */
function add(a: Specificity, b: Specificity): Specificity {
  // Column by column.
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Compare two triples lexicographically: negative when a is less specific. */
export function compare(a: Specificity, b: Specificity): number {
  // A, then B, then C.
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/** The most specific of a list (the first on ties), or zero for an empty list. */
function maxOf(list: Specificity[]): Specificity {
  // Fold.
  return list.reduce<Specificity>((m, s) => (compare(s, m) > 0 ? s : m), [0, 0, 0]);
}

/**
 * Split text on a separator at nesting depth zero (outside parentheses, brackets and strings).
 * `sep` is a single character; the pieces keep their surrounding whitespace for the caller to trim.
 */
function splitTop(text: string, sep: string): string[] {
  // The pieces.
  const out: string[] = [];
  // The current piece.
  let cur = "";
  // Nesting of ( and [.
  let depth = 0;
  // Inside a string: the quote character, or null.
  let quote: string | null = null;
  // Walk.
  for (let i = 0; i < text.length; i++) {
    // The character.
    const ch = text[i];
    // An escape takes the next character too.
    if (ch === "\\" && i + 1 < text.length) { cur += ch + text[i + 1]; i++; continue; }
    // Inside a string.
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    // A string starts.
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    // Nesting.
    if (ch === "(" || ch === "[") depth++;
    // Un-nesting.
    else if (ch === ")" || ch === "]") depth--;
    // The separator at the top.
    if (ch === sep && depth === 0) { out.push(cur); cur = ""; continue; }
    // Otherwise part of the piece.
    cur += ch;
  }
  // The last piece.
  out.push(cur);
  // Done.
  return out;
}

/** Find the matching close parenthesis for the open one at `start`; -1 when unbalanced. */
function matchParen(text: string, start: number): number {
  // Depth from the open paren.
  let depth = 0;
  // Inside a string.
  let quote: string | null = null;
  // Walk.
  for (let i = start; i < text.length; i++) {
    // The character.
    const ch = text[i];
    // Escapes.
    if (ch === "\\") { i++; continue; }
    // Strings.
    if (quote) { if (ch === quote) quote = null; continue; }
    // A string starts.
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    // Open.
    if (ch === "(") depth++;
    // Close.
    else if (ch === ")") { depth--; if (depth === 0) return i; }
  }
  // Unbalanced.
  return -1;
}

/** Find the matching close bracket for the open one at `start`; -1 when unbalanced. */
function matchBracket(text: string, start: number): number {
  // Inside a string.
  let quote: string | null = null;
  // Walk.
  for (let i = start + 1; i < text.length; i++) {
    // The character.
    const ch = text[i];
    // Escapes.
    if (ch === "\\") { i++; continue; }
    // Strings.
    if (quote) { if (ch === quote) quote = null; continue; }
    // A string starts.
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    // Close.
    if (ch === "]") return i;
  }
  // Unbalanced.
  return -1;
}

/**
 * An identifier (CSS ident with escapes): letters, digits, hyphens, underscores, non-ASCII and escapes. A hex escape is
 * one to six hex digits and, per CSS Syntax Level 3 4.3.7 ("If the next input code point is whitespace, consume it as
 * well"), the single whitespace that may follow it: `#foo\3e a` is the id "foo>a", not an id followed by a type selector.
 */
const IDENT = /^(?:\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\.|[-\w -￿])+/;

/**
 * Analyse one complex selector (no top-level commas). Pieces are produced in order; the specificity is the sum
 * of the pieces' contributions.
 */
export function analyseSelector(input: string): SelectorAnalysis {
  // Trimmed.
  const selector = input.trim();
  // The pieces.
  const pieces: Piece[] = [];
  // Running total.
  let spec: Specificity = [0, 0, 0];
  // An error.
  let error: SelectorAnalysis["error"] = null;
  // Position.
  let i = 0;
  // Whether a compound has started since the last combinator (to catch dangling combinators and empty compounds).
  let inCompound = false;
  // Whether anything at all was read.
  let any = false;
  // Pieces of the current compound (for the repeated-selector note).
  let seenInCompound = new Set<string>();
  // Push a piece, adding its contribution.
  const push = (p: Piece) => {
    // Record.
    pieces.push(p);
    // Add.
    spec = add(spec, p.contribution);
  };
  // Walk.
  while (i < selector.length) {
    // The character.
    const ch = selector[i];
    // Whitespace: a descendant combinator unless a combinator symbol follows or precedes.
    if (/\s/.test(ch)) {
      // Skip the run.
      let j = i;
      // All whitespace.
      while (j < selector.length && /\s/.test(selector[j])) j++;
      // At the end: trailing whitespace, ignore.
      if (j >= selector.length) break;
      // A combinator symbol next: let it be read.
      if (/[>+~|]/.test(selector[j])) { i = j; continue; }
      // Otherwise the descendant combinator.
      if (inCompound) { push({ kind: "combinator", text: " ", adds: null, contribution: [0, 0, 0], note: null }); inCompound = false; seenInCompound = new Set(); }
      // Continue after the whitespace.
      i = j;
      // Next.
      continue;
    }
    // Explicit combinators: >, +, ~, || (the column combinator).
    if (ch === ">" || ch === "+" || ch === "~" || (ch === "|" && selector[i + 1] === "|")) {
      // The text.
      const text = ch === "|" ? "||" : ch;
      // A combinator with nothing before it.
      if (!inCompound && pieces.length === 0 && !(ch === "+" || ch === "~" || ch === ">")) { error = { what: "dangling-combinator", at: i }; break; }
      // Two combinators in a row.
      if (!inCompound && pieces.length > 0 && pieces[pieces.length - 1].kind === "combinator") { error = { what: "dangling-combinator", at: i }; break; }
      // Push it (a leading combinator is allowed in a relative selector such as the argument of :has()).
      push({ kind: "combinator", text, adds: null, contribution: [0, 0, 0], note: null });
      // A new compound follows.
      inCompound = false;
      // Fresh set.
      seenInCompound = new Set();
      // Past it, and past the whitespace after it.
      i += text.length;
      // Skip whitespace.
      while (i < selector.length && /\s/.test(selector[i])) i++;
      // Next.
      continue;
    }
    // An id selector.
    if (ch === "#") {
      // The name.
      const m = IDENT.exec(selector.slice(i + 1));
      // Nothing after the hash.
      if (!m) { error = { what: "unexpected", at: i }; break; }
      // The text.
      const text = `#${m[0]}`;
      // Repeated?
      const repeated = seenInCompound.has(text);
      // Record.
      seenInCompound.add(text);
      // Push.
      push({ kind: "id", text, adds: "A", contribution: [1, 0, 0], note: repeated ? "repeated" : null });
      // State.
      inCompound = true; any = true;
      // Past.
      i += 1 + m[0].length;
      // Next.
      continue;
    }
    // A class selector.
    if (ch === ".") {
      // The name.
      const m = IDENT.exec(selector.slice(i + 1));
      // Nothing after the dot.
      if (!m) { error = { what: "unexpected", at: i }; break; }
      // The text.
      const text = `.${m[0]}`;
      // Repeated?
      const repeated = seenInCompound.has(text);
      // Record.
      seenInCompound.add(text);
      // Push.
      push({ kind: "class", text, adds: "B", contribution: [0, 1, 0], note: repeated ? "repeated" : null });
      // State.
      inCompound = true; any = true;
      // Past.
      i += 1 + m[0].length;
      // Next.
      continue;
    }
    // An attribute selector.
    if (ch === "[") {
      // The close.
      const end = matchBracket(selector, i);
      // Unbalanced.
      if (end < 0) { error = { what: "unbalanced", at: i }; break; }
      // The text.
      const text = selector.slice(i, end + 1);
      // Repeated?
      const repeated = seenInCompound.has(text);
      // Record.
      seenInCompound.add(text);
      // Push.
      push({ kind: "attribute", text, adds: "B", contribution: [0, 1, 0], note: repeated ? "repeated" : null });
      // State.
      inCompound = true; any = true;
      // Past.
      i = end + 1;
      // Next.
      continue;
    }
    // A pseudo-class or pseudo-element.
    if (ch === ":") {
      // Double colon?
      const dbl = selector[i + 1] === ":";
      // The name.
      const m = IDENT.exec(selector.slice(i + (dbl ? 2 : 1)));
      // Nothing after the colon.
      if (!m) { error = { what: "unexpected", at: i }; break; }
      // Lower-cased name.
      const name = m[0].toLowerCase();
      // Where the name ends.
      let end = i + (dbl ? 2 : 1) + m[0].length;
      // A functional argument.
      let arg: string | null = null;
      // Parenthesis.
      if (selector[end] === "(") {
        // The match.
        const close = matchParen(selector, end);
        // Unbalanced.
        if (close < 0) { error = { what: "unbalanced", at: end }; break; }
        // The argument text.
        arg = selector.slice(end + 1, close);
        // Past it.
        end = close + 1;
      }
      // The text as written.
      const text = selector.slice(i, end);
      // A pseudo-element: double colon, or a legacy single-colon one.
      const isPseudoElement = dbl || LEGACY_PSEUDO_ELEMENTS.has(name);
      // Decide.
      if (isPseudoElement) {
        // ::slotted(S): a pseudo-element plus its argument.
        if (name === "slotted" && arg !== null) {
          // The argument.
          const args = splitTop(arg, ",").map((s) => analyseSelector(s));
          // Contribution.
          const c = add([0, 0, 1], maxOf(args.map((a) => a.specificity)));
          // Push.
          push({ kind: "pseudo-element", text, adds: "C", contribution: c, note: "slotted-plus", args });
        } else {
          // Any other pseudo-element counts as one C; ::part() is noted as such.
          push({ kind: "pseudo-element", text, adds: "C", contribution: [0, 0, 1], note: !dbl ? "legacy-pseudo-element" : name === "part" ? "part" : null });
        }
      } else if (name === "where" && arg !== null) {
        // :where(): zero.
        const args = splitTop(arg, ",").map((s) => analyseSelector(s));
        // Push with nothing.
        push({ kind: "pseudo-class", text, adds: null, contribution: [0, 0, 0], note: "where-zero", args });
      } else if (MAX_ARG_PSEUDO_CLASSES.has(name) && arg !== null) {
        // :is(), :not(), :has(): the most specific argument.
        const args = splitTop(arg, ",").map((s) => analyseSelector(s));
        // Its specificity.
        const c = maxOf(args.map((a) => a.specificity));
        // The column it mostly adds to, for display.
        const adds = c[0] ? "A" : c[1] ? "B" : c[2] ? "C" : null;
        // Push.
        push({ kind: "pseudo-class", text, adds, contribution: c, note: name === "not" ? "not-max" : name === "has" ? "has-max" : "is-max", args });
      } else if (NTH_OF_PSEUDO_CLASSES.has(name) && arg !== null && /\bof\b/i.test(arg)) {
        // :nth-child(An+B of S): one pseudo-class plus the most specific S.
        const ofIdx = arg.search(/\bof\b/i);
        // The selector list after "of".
        const args = splitTop(arg.slice(ofIdx + 2), ",").map((s) => analyseSelector(s));
        // Contribution.
        const c = add([0, 1, 0], maxOf(args.map((a) => a.specificity)));
        // Push.
        push({ kind: "pseudo-class", text, adds: "B", contribution: c, note: "nth-of", args });
      } else if (PLUS_ARG_PSEUDO_CLASSES.has(name) && arg !== null) {
        // :host(S), :host-context(S): one pseudo-class plus the argument.
        const args = splitTop(arg, ",").map((s) => analyseSelector(s));
        // Contribution.
        const c = add([0, 1, 0], maxOf(args.map((a) => a.specificity)));
        // Push.
        push({ kind: "pseudo-class", text, adds: "B", contribution: c, note: "host-plus", args });
      } else {
        // Any other pseudo-class: one B.
        const repeated = seenInCompound.has(text);
        // Record.
        seenInCompound.add(text);
        // Push.
        push({ kind: "pseudo-class", text, adds: "B", contribution: [0, 1, 0], note: repeated ? "repeated" : null });
      }
      // State.
      inCompound = true; any = true;
      // Past.
      i = end;
      // Next.
      continue;
    }
    // A type or universal selector, with an optional namespace prefix (ns|, *|, |).
    const tm = /^(?:(\*|(?:\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\.|[-\w])+)?\|(?!\|))?(\*|(?:\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\.|[-\w -￿])+)/.exec(selector.slice(i));
    // Something readable.
    if (tm) {
      // The text.
      const text = tm[0];
      // Universal when the element part is "*".
      if (tm[2] === "*") push({ kind: "universal", text, adds: null, contribution: [0, 0, 0], note: "universal" });
      // A type selector.
      else push({ kind: "type", text, adds: "C", contribution: [0, 0, 1], note: null });
      // State.
      inCompound = true; any = true;
      // Past.
      i += text.length;
      // Next.
      continue;
    }
    // Anything else is unexpected.
    error = { what: "unexpected", at: i };
    // Stop.
    break;
  }
  // A trailing combinator.
  if (!error && pieces.length > 0 && pieces[pieces.length - 1].kind === "combinator" && pieces[pieces.length - 1].text !== " ") error = { what: "dangling-combinator", at: selector.length };
  // Nothing read.
  if (!error && !any) error = { what: "empty-compound", at: 0 };
  // Done.
  return { selector, pieces, specificity: spec, text: `${spec[0]},${spec[1]},${spec[2]}`, weight: spec[0] * 65536 + spec[1] * 256 + spec[2], error };
}

/** The engine. */
export function run(input: SpecificityInput): SpecificityResult {
  // The text.
  const text = input.selectors ?? "";
  // Refuse the oversized.
  limit(text);
  // Strip CSS comments.
  let clean = text.replace(/\/\*[\s\S]*?\*\//g, " ");
  // A pasted stylesheet: drop every declaration block, innermost first, so nested at-rules empty out too.
  for (let prev = ""; prev !== clean; ) { prev = clean; clean = clean.replace(/\{[^{}]*\}/g, "\n"); }
  // Selectors: top-level commas and line breaks both separate; at-rule preludes and stray braces are not selectors.
  const parts = clean.split(/\r?\n/).flatMap((line) => splitTop(line, ",")).map((s) => s.trim()).filter((s) => s.length > 0 && !/^[{}@]/.test(s));
  // Analyse each (a trailing "{" from an unclosed pasted rule is dropped).
  const selectors = parts.map((s) => analyseSelector(s.replace(/\s*\{[\s\S]*$/, "")));
  // Ranking: valid ones by specificity, most specific first, stable.
  const valid = selectors.map((s, k) => k).filter((k) => !selectors[k].error);
  // Sorted.
  const ranking = [...valid].sort((x, y) => compare(selectors[y].specificity, selectors[x].specificity) || x - y);
  // Ties: consecutive equal specificities in the ranking.
  const ties: number[][] = [];
  // Walk the ranking.
  for (let k = 0; k < ranking.length; ) {
    // The group with this specificity.
    let j = k + 1;
    // Extend while equal.
    while (j < ranking.length && compare(selectors[ranking[j]].specificity, selectors[ranking[k]].specificity) === 0) j++;
    // Groups of two or more.
    if (j - k >= 2) ties.push(ranking.slice(k, j));
    // Next group.
    k = j;
  }
  // The top.
  const top = ranking.length ? selectors[ranking[0]].specificity : null;
  // Done.
  return { selectors, ranking, ties, top };
}
