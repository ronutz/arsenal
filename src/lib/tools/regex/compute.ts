// ============================================================================
// src/lib/tools/regex/compute.ts
// ----------------------------------------------------------------------------
// A REGULAR-EXPRESSION TESTER AND EXPLAINER for the JavaScript (ECMAScript)
// regex engine. Three jobs:
//
//   1. Compile a pattern + flags and report syntax errors clearly.
//   2. Test it against input, returning every match with its capture groups
//      and named groups (capped, so a huge input cannot lock the page up).
//   3. Explain a pattern by breaking it into annotated tokens, so you can read
//      what each piece does without running it.
//   4. (2026-10-26) Compare those tokens against PCRE2 (NGINX) and Tcl's
//      Advanced Regular Expressions (BIG-IP iRules): portabilityReport lists
//      each construct whose support or meaning differs. A static reading of
//      three specifications; nothing but ECMAScript is ever executed.
//
// SAFETY: matching a user regex against user text in the browser can hang on
// catastrophic backtracking (ReDoS). There is no way to interrupt a synchronous
// RegExp call, so this module (a) caps the input length, and (b) ships a static
// heuristic that flags the classic dangerous shapes (nested unbounded
// quantifiers) BEFORE you run, so the UI can warn. Everything is pure and runs
// locally. Reference: the ECMAScript RegExp specification (MDN).
// ============================================================================

export const MAX_INPUT_LENGTH = 50_000;
export const MAX_MATCHES = 1000;

export const VALID_FLAGS = "dgimsuy";

const FLAG_NAMES: Record<string, string> = {
  d: "hasIndices (match start and end offsets)",
  g: "global (find every match, not just the first)",
  i: "ignoreCase",
  m: "multiline (^ and $ match at line breaks)",
  s: "dotAll (. matches newlines too)",
  u: "unicode",
  y: "sticky (match only at lastIndex)",
};

export interface FlagsResult {
  ok: boolean;
  flags: string;
  names: string[];
  error?: { message: string };
}

/** Validate a flags string: only dgimsuy, no duplicates. */
export function parseFlags(flags: string): FlagsResult {
  const seen = new Set<string>();
  for (const ch of flags) {
    if (!VALID_FLAGS.includes(ch)) return { ok: false, flags, names: [], error: { message: `Unknown flag "${ch}". Valid flags are ${VALID_FLAGS.split("").join(", ")}.` } };
    if (seen.has(ch)) return { ok: false, flags, names: [], error: { message: `Duplicate flag "${ch}".` } };
    seen.add(ch);
  }
  return { ok: true, flags, names: [...seen].map((f) => FLAG_NAMES[f]) };
}

export interface CompileResult {
  ok: boolean;
  source?: string;
  flags?: string;
  error?: { message: string };
}

/** Try to compile a pattern; return a clean error on failure. */
export function compileRegex(pattern: string, flags: string): CompileResult {
  const f = parseFlags(flags);
  if (!f.ok) return { ok: false, error: f.error };
  try {
    const re = new RegExp(pattern, flags);
    return { ok: true, source: re.source, flags: re.flags };
  } catch (e) {
    return { ok: false, error: { message: e instanceof Error ? e.message : "Invalid regular expression." } };
  }
}

// ---- matching --------------------------------------------------------------

export interface MatchGroup {
  index: number;
  value: string | undefined;
}

export interface RegexMatch {
  match: string;
  index: number;
  groups: MatchGroup[];
  named: Record<string, string | undefined>;
}

export interface MatchResult {
  ok: boolean;
  matches: RegexMatch[];
  count: number;
  truncated: boolean;
  inputTooLong: boolean;
  error?: { message: string };
}

/**
 * Run a pattern against input. Respects the g and y flags for iteration; caps
 * matches and input length. Pure; the only risk it cannot remove is a
 * catastrophic pattern, which detectReDoS is there to warn about up front.
 */
export function findMatches(pattern: string, flags: string, input: string): MatchResult {
  const compiled = compileRegex(pattern, flags);
  if (!compiled.ok) return { ok: false, matches: [], count: 0, truncated: false, inputTooLong: false, error: compiled.error };

  if (input.length > MAX_INPUT_LENGTH) {
    return { ok: false, matches: [], count: 0, truncated: false, inputTooLong: true, error: { message: `Input is ${input.length.toLocaleString()} characters; the limit is ${MAX_INPUT_LENGTH.toLocaleString()}.` } };
  }

  const re = new RegExp(pattern, flags);
  const iterates = re.global || re.sticky;
  const out: RegexMatch[] = [];
  let truncated = false;

  const pack = (m: RegExpExecArray): RegexMatch => ({
    match: m[0],
    index: m.index,
    groups: m.slice(1).map((g, i) => ({ index: i + 1, value: g })),
    named: m.groups ? { ...m.groups } : {},
  });

  if (!iterates) {
    const m = re.exec(input);
    if (m) out.push(pack(m));
  } else {
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(input)) !== null) {
      out.push(pack(m));
      if (out.length >= MAX_MATCHES) {
        truncated = true;
        break;
      }
      // Avoid an infinite loop on zero-width matches.
      if (m.index === re.lastIndex) re.lastIndex++;
      if (++guard > MAX_MATCHES * 4) {
        truncated = true;
        break;
      }
    }
  }

  return { ok: true, matches: out, count: out.length, truncated, inputTooLong: false };
}

// ---- explanation (tokenizer) ----------------------------------------------

export type TokenType =
  | "literal"
  | "dot"
  | "anchor"
  | "class-shorthand"
  | "char-class"
  | "quantifier"
  | "group-open"
  | "group-close"
  | "alternation"
  | "escape"
  | "backref"
  // A bare inline-option group such as (?i) or (?im-s): PCRE2 and Tcl syntax that
  // opens nothing, so it is not a group-open (added 2026-10-26 for the portability view).
  | "modifier";

export interface RegexToken {
  type: TokenType;
  text: string;
  description: string;
}

const SHORTHAND: Record<string, string> = {
  "\\d": "any digit (0 to 9)",
  "\\D": "any non-digit",
  "\\w": "any word character (letter, digit, or underscore)",
  "\\W": "any non-word character",
  "\\s": "any whitespace",
  "\\S": "any non-whitespace",
};

const ANCHOR: Record<string, string> = {
  "^": "start of string (or line, with the m flag)",
  $: "end of string (or line, with the m flag)",
  "\\b": "a word boundary",
  "\\B": "not a word boundary",
};

const ESCAPE_LITERAL: Record<string, string> = {
  "\\n": "a newline",
  "\\r": "a carriage return",
  "\\t": "a tab",
  "\\f": "a form feed",
  "\\v": "a vertical tab",
  "\\0": "a NUL character",
};

function quantifierDescription(q: string): string {
  const lazy = q.endsWith("?") && q.length > 1 && q !== "?";
  // A trailing + after a quantifier makes it possessive (PCRE2 syntax; a
  // syntax error in JavaScript). A lone "+" is the plain one-or-more quantifier.
  const possessive = !lazy && q.endsWith("+") && q.length > 1;
  // Strip the lazy ? or the possessive + to read the core quantifier.
  const core = lazy || possessive ? q.slice(0, -1) : q;
  let base: string;
  if (core === "*") base = "zero or more times";
  else if (core === "+") base = "one or more times";
  else if (core === "?") base = "optional (zero or one time)";
  else {
    const m = core.match(/^\{(\d+)(,)?(\d+)?\}$/);
    if (m) {
      if (m[2] && m[3]) base = `between ${m[1]} and ${m[3]} times`;
      else if (m[2]) base = `${m[1]} or more times`;
      else base = `exactly ${m[1]} times`;
    } else base = "a quantifier";
  }
  // The possessive form never gives characters back (PCRE2 only; JavaScript rejects it).
  if (possessive) return `${base}, without giving any back (possessive, PCRE2 syntax; not valid in JavaScript)`;
  return lazy ? `${base}, as few as possible (lazy)` : base;
}

/**
 * The quantifier grammar the tokenizer recognises after a unit: *, +, ? or a
 * {n}, {n,} or {n,m} bound, then an optional lazy ? or possessive + suffix.
 * Anchored and free of nested repetition, so it runs in linear time.
 */
const QUANTIFIER_AT = /^(\*|\+|\?|\{\d+(?:,\d*)?\})[?+]?/;

/**
 * Inline options: (?flags:  (?on-off:  (?^flags:  or the bare (?flags) form.
 * Group 1 is the caret, 2 the letters turned on, 3 the hyphen and 4 the letters
 * turned off, 5 the closer (":" opens a group, ")" is the bare form).
 */
const MODIFIER_AT = /^\(\?(\^?)([a-zA-Z]*)(-?)([a-zA-Z]*)([:)])/;

/** Break a pattern into annotated tokens. Pure; never executes the pattern. */
export function explainPattern(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  let i = 0;
  let literalRun = "";

  const flushLiteral = () => {
    if (literalRun) {
      tokens.push({ type: "literal", text: literalRun, description: literalRun.length === 1 ? `the character "${literalRun}"` : `the literal text "${literalRun}"` });
      literalRun = "";
    }
  };

  const readQuantifier = () => {
    // Called after a unit; attaches a trailing quantifier if present.
    const rest = pattern.slice(i);
    // 2026-10-26: the shared grammar also takes a possessive + suffix (was \??).
    const m = rest.match(QUANTIFIER_AT);
    if (m) {
      tokens.push({ type: "quantifier", text: m[0], description: `repeat ${quantifierDescription(m[0])}` });
      i += m[0].length;
    }
  };

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === "\\") {
      const two = pattern.slice(i, i + 2);
      flushLiteral();
      // A Unicode property escape \p{...} or \P{...}, read as one unit (2026-10-26).
      const prop = pattern.slice(i).match(/^\\([pP])\{([^}]*)\}/);
      // A hex \xHH, a \uHHHH or a control \cX escape, each one character (2026-10-26).
      const charEscape = pattern.slice(i).match(/^\\(?:x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z])/);
      if (prop) {
        // P negates; the description holds both readings, because explainPattern does not see the flags.
        const neg = prop[1] === "P";
        // Push the whole escape as one class shorthand.
        tokens.push({ type: "class-shorthand", text: prop[0], description: `any character ${neg ? "without" : "with"} the Unicode property ${prop[2]} (with the u flag; without it JavaScript reads the literal text ${prop[0].slice(1)})` });
        // Step past the escape and attach any quantifier that follows.
        i += prop[0].length;
        readQuantifier();
      } else if (charEscape) {
        // The escape's body after the backslash: x41, u00E9 or cJ.
        const body = charEscape[0].slice(1);
        // Describe each form by the character it stands for.
        const description = body[0] === "c" ? `the control character Ctrl-${body[1].toUpperCase()}` : body[0] === "x" ? `the character with hex code ${body.slice(1).toUpperCase()}` : `the character U+${body.slice(1).toUpperCase()}`;
        // One escape token for the whole sequence.
        tokens.push({ type: "escape", text: charEscape[0], description });
        // Step past it and attach any quantifier that follows.
        i += charEscape[0].length;
        readQuantifier();
      } else if (SHORTHAND[two]) {
        tokens.push({ type: "class-shorthand", text: two, description: SHORTHAND[two] });
        i += 2;
        readQuantifier();
      } else if (ANCHOR[two]) {
        tokens.push({ type: "anchor", text: two, description: ANCHOR[two] });
        i += 2;
      } else if (ESCAPE_LITERAL[two]) {
        tokens.push({ type: "escape", text: two, description: ESCAPE_LITERAL[two] });
        i += 2;
        readQuantifier();
      } else if (/\\\d/.test(two)) {
        const m = pattern.slice(i).match(/^\\(\d+)/)!;
        tokens.push({ type: "backref", text: m[0], description: `a backreference to capture group ${m[1]}` });
        i += m[0].length;
      } else if (two === "\\k") {
        const m = pattern.slice(i).match(/^\\k<([^>]+)>/);
        if (m) {
          tokens.push({ type: "backref", text: m[0], description: `a backreference to the named group "${m[1]}"` });
          i += m[0].length;
        } else {
          tokens.push({ type: "escape", text: two, description: "an escaped k" });
          i += 2;
        }
      } else {
        const lit = pattern[i + 1] ?? "";
        tokens.push({ type: "escape", text: two, description: `a literal "${lit}"` });
        i += 2;
        readQuantifier();
      }
      continue;
    }

    if (ch === "[") {
      flushLiteral();
      // read to the matching ] (a ] right after [ or [^ is a literal)
      let j = i + 1;
      const negated = pattern[j] === "^";
      if (negated) j++;
      if (pattern[j] === "]") j++;
      while (j < pattern.length && pattern[j] !== "]") {
        if (pattern[j] === "\\") j++;
        j++;
      }
      const text = pattern.slice(i, j + 1);
      const body = text.replace(/^\[\^?/, "").replace(/\]$/, "");
      tokens.push({ type: "char-class", text, description: `${negated ? "any character NOT in" : "any one character in"} the set: ${body}` });
      i = j + 1;
      readQuantifier();
      continue;
    }

    if (ch === "(") {
      flushLiteral();
      const rest = pattern.slice(i);
      let text = "(";
      let description = "start of a capturing group";
      if (rest.startsWith("(?:")) {
        text = "(?:";
        description = "start of a non-capturing group";
      } else if (rest.startsWith("(?=")) {
        text = "(?=";
        description = "start of a lookahead (followed by)";
      } else if (rest.startsWith("(?!")) {
        text = "(?!";
        description = "start of a negative lookahead (not followed by)";
      } else if (rest.startsWith("(?<=")) {
        text = "(?<=";
        description = "start of a lookbehind (preceded by)";
      } else if (rest.startsWith("(?<!")) {
        text = "(?<!";
        description = "start of a negative lookbehind (not preceded by)";
      } else if (rest.startsWith("(?>")) {
        // 2026-10-26: an atomic group, PCRE2 syntax that JavaScript rejects.
        text = "(?>";
        description = "start of an atomic group (PCRE2 syntax; not valid in JavaScript)";
      } else {
        const named = rest.match(/^\(\?<([^>]+)>/);
        // 2026-10-26: the Python (?P<name>) and Perl (?'name') spellings PCRE2 also accepts.
        const namedAlt = rest.match(/^\(\?(?:P<([^>]+)>|'([^']+)')/);
        // 2026-10-26: the Python backreference (?P=name), a whole token on its own.
        const pyBackref = rest.match(/^\(\?P=([^)]+)\)/);
        // 2026-10-26: inline options, scoped (?i:...) or bare (?i).
        const modifier = rest.match(MODIFIER_AT);
        if (named) {
          text = named[0];
          description = `start of a named capturing group "${named[1]}"`;
        } else if (namedAlt) {
          // Group 1 holds a Python name, group 2 a quoted one.
          text = namedAlt[0];
          // Name the spelling so the reader knows why JavaScript refuses it.
          description = `start of a named capturing group "${namedAlt[1] ?? namedAlt[2]}" (${namedAlt[1] !== undefined ? "Python" : "Perl quote"} spelling, PCRE2 syntax; not valid in JavaScript)`;
        } else if (pyBackref) {
          // The whole (?P=name) is a backreference, not a group: push it and move on.
          tokens.push({ type: "backref", text: pyBackref[0], description: `a backreference to the named group "${pyBackref[1]}" (Python spelling, PCRE2 syntax; not valid in JavaScript)` });
          // Step past the closing parenthesis it already contains.
          i += pyBackref[0].length;
          // Done with this token.
          continue;
        } else if (modifier && (modifier[1] || modifier[2] || modifier[3])) {
          // Letters turned on, and letters turned off after the hyphen.
          const on = modifier[2];
          // The letters after the hyphen, if any.
          const off = modifier[4];
          // A readable summary such as "i on, s off".
          const summary = [on ? `${on} on` : "", off ? `${off} off` : "", modifier[1] ? "all reset first (^)" : ""].filter(Boolean).join(", ");
          if (modifier[5] === ")") {
            // The bare form opens nothing: it is its own token type.
            tokens.push({ type: "modifier", text: modifier[0], description: `inline options (${summary}) for the rest of the enclosing group (PCRE2 and Tcl syntax; JavaScript accepts only the scoped form ending in a colon)` });
            // Step past the closing parenthesis.
            i += modifier[0].length;
            // Done with this token.
            continue;
          }
          // The scoped form opens a group that a later ) closes.
          text = modifier[0];
          // Describe what changes inside the group.
          description = `start of a group with inline modifiers (${summary} inside it)`;
        }
      }
      tokens.push({ type: "group-open", text, description });
      i += text.length;
      continue;
    }

    if (ch === ")") {
      flushLiteral();
      tokens.push({ type: "group-close", text: ")", description: "end of the group" });
      i += 1;
      readQuantifier();
      continue;
    }

    if (ch === "|") {
      flushLiteral();
      tokens.push({ type: "alternation", text: "|", description: "OR (either the left side or the right side)" });
      i += 1;
      continue;
    }

    if (ch === ".") {
      flushLiteral();
      tokens.push({ type: "dot", text: ".", description: "any character (except a newline, unless the s flag is set)" });
      i += 1;
      readQuantifier();
      continue;
    }

    if (ch === "^" || ch === "$") {
      flushLiteral();
      tokens.push({ type: "anchor", text: ch, description: ANCHOR[ch] });
      i += 1;
      continue;
    }

    if (ch === "*" || ch === "+" || ch === "?" || ch === "{") {
      // A quantifier with nothing before it that consumed it: treat the run, then quantify.
      // Most quantifiers are consumed by readQuantifier above; a leading one is shown literally.
      const rest = pattern.slice(i);
      // 2026-10-26: the same quantifier grammar as readQuantifier, possessive + included.
      const m = rest.match(QUANTIFIER_AT);
      if (m && literalRun) {
        // quantify the last literal character: split it off
        const last = literalRun.slice(-1);
        literalRun = literalRun.slice(0, -1);
        flushLiteral();
        tokens.push({ type: "literal", text: last, description: `the character "${last}"` });
        tokens.push({ type: "quantifier", text: m[0], description: `repeat ${quantifierDescription(m[0])}` });
        i += m[0].length;
        continue;
      }
    }

    // default: accumulate as a literal
    literalRun += ch;
    i += 1;
  }

  flushLiteral();
  return tokens;
}

// ---- ReDoS heuristic -------------------------------------------------------

export interface ReDoSResult {
  risky: boolean;
  reason?: string;
}

/** Find the index of the ) that matches the ( at openIdx, or -1. */
function matchingParen(pattern: string, openIdx: number): number {
  let depth = 0;
  for (let k = openIdx; k < pattern.length; k++) {
    if (pattern[k] === "\\") {
      k++;
      continue;
    }
    if (pattern[k] === "[") {
      // skip a character class
      k++;
      if (pattern[k] === "^") k++;
      if (pattern[k] === "]") k++;
      while (k < pattern.length && pattern[k] !== "]") {
        if (pattern[k] === "\\") k++;
        k++;
      }
      continue;
    }
    if (pattern[k] === "(") depth++;
    else if (pattern[k] === ")") {
      depth--;
      if (depth === 0) return k;
    }
  }
  return -1;
}

const UNBOUNDED_AFTER = /^(\*|\+|\{\d+,\}|\{\d+,\d+\})/;
const UNBOUNDED_INSIDE = /(\*|\+|\{\d+,\d*\})/;

/**
 * A deliberately conservative heuristic for catastrophic backtracking: a group
 * that repeats without an upper bound and whose body itself repeats without an
 * upper bound (the classic (a+)+ shape). It can miss exotic cases and can warn
 * on a pattern that is actually fine, so it advises rather than blocks.
 */
export function detectReDoS(pattern: string): ReDoSResult {
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "\\") {
      i++;
      continue;
    }
    if (pattern[i] === "(") {
      const close = matchingParen(pattern, i);
      if (close === -1) break;
      const after = pattern.slice(close + 1);
      if (UNBOUNDED_AFTER.test(after)) {
        const body = pattern.slice(i + 1, close).replace(/^\?(:|<?[=!]|<[^>]+>)/, "");
        if (UNBOUNDED_INSIDE.test(body)) {
          return { risky: true, reason: "This pattern nests an unbounded quantifier inside another (the (a+)+ shape), which can cause catastrophic backtracking on some inputs. Test it against a short string first." };
        }
      }
    }
  }
  return { risky: false };
}

/** run - the always-safe, deterministic direction is to explain the pattern. */
export function run(pattern: string): RegexToken[] {
  return explainPattern(pattern);
}

// ============================================================================
// ---- portability (added 2026-10-26) ----------------------------------------
// ----------------------------------------------------------------------------
// A STATIC COMPARISON, NOT A SECOND ENGINE. The tester runs only ECMAScript.
// This section reads the tokens explainPattern already produces and lists each
// construct whose support or meaning differs between three flavours:
//
//   ecmascript  ECMA-262 2026 (17th edition), 22.2 RegExp, with Annex B.1.2,
//               which a browser applies (the grammar is unchanged in the 2027
//               draft read the same day).
//   pcre2       the PCRE2 manual (pcre2pattern, pcre2syntax, pcre2api,
//               pcre2build at pcre2.org), the library NGINX uses for regex
//               locations, map and server_name from 1.21.5.
//   tcl         Tcl's Advanced Regular Expressions per the Tcl 8.4 re_syntax
//               manual: BIG-IP iRules were developed from Tcl 8.4.6 (F5 K6091),
//               and regexp and regsub are not on F5's disabled list (K36322151).
//
// Each cell says "same" (supported with the meaning the construct's name gives),
// "different" (supported, but with another meaning or syntax) or "unsupported"
// (an error, or read as something else). The prose for each cell lives in the
// message packs under tools.regex.port.<id>.<note>; this module returns only
// ids, verdicts and the parameters those messages need, so it stays pure and
// testable. Every rule cites the source ids in PORTABILITY_SOURCES.
//
// WHAT IT DOES NOT DO: run the pattern in PCRE2 or Tcl, check engine limits
// (quantifier bounds, pattern size; only the lookbehind default of 255 is part
// of a rule), performance or backtracking, or options a product sets for you.
// ============================================================================

/** The longest pattern the portability view reads (the tokenizer slices per character). */
export const MAX_PORTABILITY_LENGTH = 5000;

/** The three flavours, in the order the view shows them. */
export const FLAVOURS = ["ecmascript", "pcre2", "tcl"] as const;
/** One of the three flavours. */
export type Flavour = (typeof FLAVOURS)[number];

/** same: as the construct's name says; different: another meaning or syntax; unsupported: an error or something else. */
export type PortVerdict = "same" | "different" | "unsupported";

/** One flavour's verdict and the message key suffix that explains it. */
export interface PortCell {
  /** The verdict for this flavour. */
  verdict: PortVerdict;
  /** The note's key under tools.regex.port.<id>. */
  note: string;
}

/** Every construct the view checks, in the order the docs list them. */
export const PORTABILITY_CONSTRUCTS = [
  "lookbehindFixed", // (?<=ab) or (?<=colour|color): every top-level branch has one length
  "lookbehindBounded", // (?<=colou?r): branches vary in length but have a maximum
  "lookbehindUnbounded", // (?<=a+): no maximum length
  "lookaheadGroups", // a lookahead holding a capture group or a backreference
  "namedGroup", // (?<name>...)
  "namedGroupAlt", // (?P<name>...) or (?'name'...)
  "namedBackref", // \k<name>
  "backrefPcreOnly", // \k'name', \k{name}, \g{...}, \gN, (?P=name)
  "inlineFlagsScoped", // (?i:...), (?i-s:...)
  "inlineFlagsGlobal", // bare (?i), (?im-s)
  "possessive", // a++, a*+, a?+, a{2,3}+
  "atomicGroup", // (?>...)
  "anchorStart", // \A
  "anchorEndNewline", // \Z
  "anchorEnd", // \z
  "dollar", // $
  "dot", // .
  "posixClass", // [[:alpha:]]
  "posixWordEdge", // [[:<:]] and [[:>:]]
  "quoteLiteral", // \Q...\E
  "unicodeProperty", // \p{L}, \P{Lu}
  "unicodePropertyShort", // \pL
  "lazy", // *?, +?, ??, {n,m}?
  "wordBoundary", // \b
  "nonWordBoundary", // \B
  "wordClass", // \w and \W
  "classNegatedShorthand", // \D, \S or \W inside a bracket expression
  "tclWordConstraint", // \m, \M, \y, \Y
  "quantifierOmittedMin", // {,n}
] as const; // frozen as a tuple so the ids form a union type
/** One construct id. */
export type PortConstructId = (typeof PORTABILITY_CONSTRUCTS)[number];

/** One construct found in the pattern, with its three verdicts. */
export interface PortFinding {
  /** Which construct. */
  id: PortConstructId;
  /** The first occurrence, as written (shortened past 40 characters). */
  text: string;
  /** Up to three distinct occurrences, as written. */
  examples: string[];
  /** How many times it occurs with these same verdicts. */
  count: number;
  /** The values the notes interpolate (ICU arguments). */
  params: Record<string, string | number>;
  /** The verdict and note per flavour. */
  cells: Record<Flavour, PortCell>;
  /** The source ids (PORTABILITY_SOURCES) the rule rests on. */
  sources: string[];
}

/** The whole report: the findings in pattern order, or tooLong when the pattern exceeds the cap. */
export interface PortabilityReport {
  /** One entry per construct and verdict combination, first occurrence first. */
  findings: PortFinding[];
  /** True when the pattern is longer than MAX_PORTABILITY_LENGTH and was not read. */
  tooLong: boolean;
}

/** A source record in the D-49 manifest shape; index.ts spreads these into manifest.sources. */
export interface PortSource {
  /** Stable id the rules cite. */
  id: string;
  /** Human label. */
  label: string;
  /** Source class. */
  type: string;
  /** Where it was read. */
  url: string;
  /** The day it was read. */
  access_date: string;
  /** What this tool takes from it. */
  scope: string;
  /** Liveness at the read. */
  status: string;
}

/** The first-party documents the portability rules rest on, all read 2026-10-26. */
export const PORTABILITY_SOURCES: readonly PortSource[] = Object.freeze([
  // ECMAScript: the 2026 edition's grammar.
  { id: "ecma262-2026-patterns", label: "ECMA-262, ECMAScript 2026 Language Specification (17th edition), 22.2.1 Patterns", type: "spec", url: "https://tc39.es/ecma262/2026/#sec-patterns", access_date: "2026-10-26", scope: "the RegExp grammar: lookbehind takes any Disjunction; named groups only as (?<name>) with \\k<name>; modifier groups (?ims-ims:...) with the letters i, m and s only and no bare form; \\p{...} and \\P{...} only in Unicode mode (u or v); no possessive quantifier, atomic group, \\A, \\Z, \\z, \\Q...\\E or POSIX class (the grammar is identical in the 2027 draft read the same day)", status: "active" },
  // ECMAScript: the browser annex.
  { id: "ecma262-2026-annex-b", label: "ECMA-262 2026, Annex B.1.2 Regular Expressions Patterns (required in web browsers)", type: "spec", url: "https://tc39.es/ecma262/2026/#sec-regular-expressions-patterns", access_date: "2026-10-26", scope: "without the u or v flag a browser takes a backslash before a letter with no escape meaning as that letter (IdentityEscape: any SourceCharacter but c, or c and k when the pattern has named groups), and a brace that does not form a quantifier as a literal", status: "active" },
  // ECMAScript: the semantics of the dot, $, \b and \w.
  { id: "ecma262-2026-semantics", label: "ECMA-262 2026, 22.2.2 Pattern Semantics (CompileAtom, CompileAssertion, WordCharacters)", type: "spec", url: "https://tc39.es/ecma262/2026/#sec-pattern-semantics", access_date: "2026-10-26", scope: "the dot excludes the LineTerminator code points LF, CR, U+2028 and U+2029 unless the s flag is set; $ matches at the end of input, and before a line terminator only with the m flag; \\b, \\B, \\w and \\W use the ASCII word characters, plus characters that case-fold into them when i is set with u or v; lookbehind compiles its Disjunction backward, with no length restriction", status: "active" },
  // ECMAScript: when modifiers arrived.
  { id: "ecma262-2026-intro", label: "ECMA-262 2026, Introduction (edition history)", type: "spec", url: "https://tc39.es/ecma262/2026/#sec-intro", access_date: "2026-10-26", scope: "ECMAScript 2025, the 16th edition, added syntax for enabling and disabling modifier flags inline within regular expressions", status: "active" },
  // PCRE2: the pattern manual.
  { id: "pcre2-pattern", label: "PCRE2 manual: pcre2pattern (10.50-DEV manual, page updated 25 October 2025)", type: "vendor-docs", url: "https://www.pcre2.org/doc/pcre2pattern/", access_date: "2026-10-26", scope: "lookbehind (fixed-length branches up to 65,535; from 10.43 variable-length branches up to a caller-set maximum, default 255; unlimited repetition not supported); named groups (?<name>), (?'name') and (?P<name>); backreferences \\k<name>, \\k'name', \\k{name}, \\g{name}, (?P=name), \\gN, \\g{-N}; \\A, \\Z, \\z; $ before a final newline; the dot and the newline convention; POSIX classes, ASCII unless PCRE2_UCP; \\Q...\\E; \\p, \\P and \\pL with loose name matching; possessive quantifiers and atomic groups; (?i) and (?i:...); X{,n} from 10.43; \\w ASCII unless PCRE2_UCP", status: "active" },
  // PCRE2: the quick reference.
  { id: "pcre2-syntax", label: "PCRE2 manual: pcre2syntax (10.50-DEV manual, page updated 14 October 2025)", type: "vendor-docs", url: "https://www.pcre2.org/doc/pcre2syntax/", access_date: "2026-10-26", scope: "the summary tables for anchors, named groups, atomic groups, option letters, lookbehind limits and named backreference spellings", status: "active" },
  // PCRE2: compile options.
  { id: "pcre2-api", label: "PCRE2 manual: pcre2api", type: "vendor-docs", url: "https://www.pcre2.org/doc/pcre2api/", access_date: "2026-10-26", scope: "PCRE2_DOLLAR_ENDONLY (without it $ also matches before a newline at the end); an unrecognised escape such as \\j is a compile-time error unless PCRE2_EXTRA_BAD_ESCAPE_IS_LITERAL is set", status: "active" },
  // PCRE2: the default newline.
  { id: "pcre2-build", label: "PCRE2 manual: pcre2build", type: "vendor-docs", url: "https://www.pcre2.org/doc/pcre2build/", access_date: "2026-10-26", scope: "by default PCRE2 interprets the linefeed (LF) character as the end of a line", status: "active" },
  // Tcl 8.4: the ARE syntax iRules use.
  { id: "tcl84-re-syntax", label: "Tcl 8.4 manual: re_syntax", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/re_syntax.htm", access_date: "2026-10-26", scope: "ARE syntax: one quantifier per atom; non-greedy quantifiers; lookahead (?= and (?! only, with no backreferences and non-capturing parentheses inside; no named groups; an invalid alphanumeric escape is illegal; \\b is backspace and \\B a synonym for backslash; constraint escapes \\A, \\m, \\M, \\y, \\Y, \\Z; \\w is [[:alnum:]_]; \\D, \\S and \\W illegal inside brackets; twelve POSIX class names in the Unicode locale; embedded options only at the start; ***= literal director; longest/shortest preference rules; no special treatment for a trailing newline", status: "active" },
  // Tcl 8.4: the regexp command.
  { id: "tcl84-regexp", label: "Tcl 8.4 manual: regexp", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/regexp.htm", access_date: "2026-10-26", scope: "matching syntax is that of re_syntax; by default newline is a completely ordinary character; -line, -linestop and -lineanchor make the dot, negated brackets, ^ and $ newline-sensitive", status: "active" },
  // Tcl 8.6: checked for changes.
  { id: "tcl86-re-syntax", label: "Tcl 8.6.18 manual: re_syntax", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.6/TclCmd/re_syntax.htm", access_date: "2026-10-26", scope: "still lookahead only and no named groups; \\w adds the connector punctuation characters", status: "active" },
  // Tcl 9.0: checked for changes.
  { id: "tcl90-re-syntax", label: "Tcl 9.0.4 manual: re_syntax", type: "reference", url: "https://www.tcl-lang.org/man/tcl9.0/TclCmd/re_syntax.html", access_date: "2026-10-26", scope: "same ARE constructs as 8.6 for every rule this view applies", status: "active" },
  // F5: the Tcl version behind iRules.
  { id: "f5-k6091", label: "F5 K6091: The version of Tcl used to develop iRules", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K6091", access_date: "2026-10-26", scope: "the BIG-IP iRules command set was developed from Tcl base version 8.4.6, used in all BIG-IP versions", status: "active" },
  // F5: the disabled-command list.
  { id: "f5-k36322151", label: "F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K36322151", access_date: "2026-10-26", scope: "iRules use Tcl 8.4.6 with a subset of commands disabled; regexp and regsub are not on the list", status: "active" },
  // F5: ASM signature regex options.
  { id: "f5-asm-signature-syntax", label: "F5 BIG-IP ASM: Attack and Bot Signatures, Signature Syntax (applies to BIG-IP ASM 14.1.0 to 21.0.0, updated 7 July 2026)", type: "vendor-docs", url: "https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-attack-and-bot-signatures-14-1-0/signature-syntax.html", access_date: "2026-10-26", scope: "signature rules match regular expressions through the pcre option (PCRE syntax; the PCRE library and version are not stated), the re2 option (RE2 syntax, which F5 recommends) and, for bot signatures, the ipp option (an Intel-based engine)", status: "active" },
  // NGINX: the location directive.
  { id: "nginx-location", label: "nginx: ngx_http_core_module, location", type: "vendor-docs", url: "https://nginx.org/en/docs/http/ngx_http_core_module.html#location", access_date: "2026-10-26", scope: "regular-expression locations use the ~ (case-sensitive) and ~* (case-insensitive) modifiers and are checked in configuration order after the prefix locations", status: "active" },
  // NGINX: the map directive.
  { id: "nginx-map", label: "nginx: ngx_http_map_module, map", type: "vendor-docs", url: "https://nginx.org/en/docs/http/ngx_http_map_module.html#map", access_date: "2026-10-26", scope: "map source values may be regular expressions starting with ~ or ~*, with named and positional captures", status: "active" },
  // NGINX: the library choice.
  { id: "nginx-configure", label: "nginx: Building nginx from Sources (configure)", type: "vendor-docs", url: "https://nginx.org/en/docs/configure.html", access_date: "2026-10-26", scope: "the PCRE library is required for regular expressions in location and for ngx_http_rewrite_module; --without-pcre2 (1.21.5) makes nginx use the original PCRE library instead of PCRE2", status: "active" },
  // NGINX: captures and named-group spellings.
  { id: "nginx-regex-captures", label: "nginx: Regular expression captures", type: "vendor-docs", url: "https://nginx.org/en/docs/regex_captures.html", access_date: "2026-10-26", scope: "regular expressions in location, server_name, if, map and other directives may capture; named captures with ?<name>, ?'name' and ?P<name>", status: "active" },
]);

/** The ids above, for the vectors' citation check. */
export const PORTABILITY_SOURCE_IDS: readonly string[] = PORTABILITY_SOURCES.map((s) => s.id);

// ---- the rules -------------------------------------------------------------

/** Shorthand for one cell. */
function cell(verdict: PortVerdict, note: string): PortCell {
  // A plain record: verdict plus note key.
  return { verdict, note };
}

/** Three cells in flavour order. */
function cells(ecmascript: PortCell, pcre2: PortCell, tcl: PortCell): Record<Flavour, PortCell> {
  // Keyed by flavour so the component can iterate FLAVOURS.
  return { ecmascript, pcre2, tcl };
}

/** What a rule needs besides the hit's own parameters. */
interface RuleContext {
  /** True when the flags include u or v (Unicode mode in ECMAScript). */
  unicodeMode: boolean;
}

/** One construct's rule: the sources it rests on and its three cells. */
interface PortRule {
  /** Source ids from PORTABILITY_SOURCES. */
  sources: string[];
  /** The verdicts for one occurrence, given its parameters. */
  decide: (p: Record<string, string | number>, ctx: RuleContext) => Record<Flavour, PortCell>;
}

/** Letters ECMAScript modifier groups accept (ECMA-262 2026, RegularExpressionModifier). */
const ES_MODIFIER_LETTERS = "ims";
/** Option letters PCRE2 accepts in (?...) (pcre2pattern, Internal option setting). */
const PCRE2_OPTION_LETTERS = "imnsxraDSWPTJU";
/** Embedded option letters a Tcl ARE accepts (re_syntax, METASYNTAX). */
const TCL_OPTION_LETTERS = "bceimnpqstwx";
/** Tcl letters whose meaning matches PCRE2's: case-insensitive and expanded syntax. */
const TCL_SAME_LETTERS = "ix";
/** POSIX class names PCRE2 accepts (pcre2pattern, POSIX character classes). */
const PCRE2_POSIX = ["alnum", "alpha", "ascii", "blank", "cntrl", "digit", "graph", "lower", "print", "punct", "space", "upper", "word", "xdigit"];
/** POSIX class names the Tcl Unicode locale supports (re_syntax 8.4 and 8.6). */
const TCL_POSIX = ["alpha", "upper", "lower", "digit", "xdigit", "alnum", "print", "blank", "space", "punct", "graph", "cntrl"];

/** True when every character of s is in allowed and none repeats. */
function lettersFrom(s: string, allowed: string): boolean {
  // Every letter must be allowed.
  return [...s].every((c) => allowed.includes(c));
}

/** True when s has a repeated character. */
function hasRepeat(s: string): boolean {
  // A set shorter than the string means a repeat.
  return new Set(s).size !== s.length;
}

/** The rule table: one entry per construct id. */
const RULES: Record<PortConstructId, PortRule> = {
  // Fixed-length lookbehind: ECMAScript and PCRE2 accept it; Tcl has no lookbehind at all.
  lookbehindFixed: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax", "tcl90-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // Variable but bounded: PCRE2 10.43+ up to its limit (default 255), so the verdict depends on the maximum.
  lookbehindBounded: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "pcre2-syntax", "tcl84-re-syntax", "tcl90-re-syntax"], // the documents this rule rests on
    decide: (p) => cells(cell("same", "es"), Number(p.max) > 255 ? cell("unsupported", "pcre2Over") : cell("different", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // No maximum: only ECMAScript accepts it.
  lookbehindUnbounded: {
    sources: ["ecma262-2026-patterns", "ecma262-2026-semantics", "pcre2-pattern", "tcl84-re-syntax", "tcl90-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("unsupported", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // A lookahead with groups or backreferences: Tcl forbids backreferences there and never captures there.
  lookaheadGroups: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: (p) => cells(cell("same", "es"), cell("same", "pcre2"), p.backref ? cell("unsupported", "tclBackref") : cell("different", "tcl")), // ES, PCRE2, Tcl
  },
  // (?<name>...): ECMAScript's only spelling, one of PCRE2's three, absent from Tcl.
  namedGroup: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "nginx-regex-captures", "tcl84-re-syntax"], // the documents this rule rests on
    decide: (p) => cells(cell("same", "es"), p.nonAscii ? cell("different", "pcre2NonAscii") : cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // (?P<name>...) and (?'name'...): PCRE2 only.
  namedGroupAlt: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "nginx-regex-captures", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // \k<name>: ECMAScript and PCRE2; Tcl has no named groups and \k is not an ARE escape.
  namedBackref: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // The other backreference spellings: PCRE2 only.
  backrefPcreOnly: {
    sources: ["ecma262-2026-patterns", "ecma262-2026-annex-b", "pcre2-pattern", "pcre2-syntax", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // (?i:...): ECMAScript 2025 on for i, m, s; PCRE2 for its letters; never Tcl.
  inlineFlagsScoped: {
    sources: ["ecma262-2026-patterns", "ecma262-2026-intro", "pcre2-pattern", "pcre2-syntax", "tcl84-re-syntax"], // the documents this rule rests on
    decide: (p) => { // verdicts that depend on the occurrence
      // The letters turned on and off, and whether a caret reset them first.
      const on = String(p.on), off = String(p.off), caret = p.caret === 1;
      // ECMA-262 early errors: only i, m, s; no repeats; not both empty; no overlap; no caret in the grammar.
      const esOk = !caret && (on + off).length > 0 && lettersFrom(on + off, ES_MODIFIER_LETTERS) && !hasRepeat(on) && !hasRepeat(off) && ![...on].some((c) => off.includes(c));
      // PCRE2: known letters, and no hyphen after a caret.
      const pcreOk = lettersFrom(on + off, PCRE2_OPTION_LETTERS) && !(caret && off.length > 0);
      // Tcl has no scoped form at all.
      return cells(esOk ? cell("same", "es") : cell("unsupported", "esLetters"), pcreOk ? cell("same", "pcre2") : cell("unsupported", "pcre2Letters"), cell("unsupported", "tcl"));
    },
  },
  // Bare (?i): PCRE2 anywhere; Tcl only at the very start, with its own letters; never ECMAScript.
  inlineFlagsGlobal: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "pcre2-syntax", "tcl84-re-syntax", "tcl84-regexp"], // the documents this rule rests on
    decide: (p) => { // verdicts that depend on the occurrence
      // The letters turned on and off, the caret, and whether it is the first token.
      const on = String(p.on), off = String(p.off), caret = p.caret === 1, atStart = p.atStart === 1;
      // PCRE2: known letters, and no hyphen after a caret.
      const pcreOk = lettersFrom(on + off, PCRE2_OPTION_LETTERS) && !(caret && off.length > 0);
      // Tcl: no hyphen, no caret, only its letters, and only at the start.
      const tclLetters = !caret && off.length === 0 && p.hyphen !== 1 && on.length > 0 && lettersFrom(on, TCL_OPTION_LETTERS);
      // The Tcl cell, from the most to the least specific case.
      const tcl = !tclLetters ? cell("unsupported", "tclLetters") : !atStart ? cell("unsupported", "tclNotStart") : lettersFrom(on, TCL_SAME_LETTERS) ? cell("same", "tclSame") : cell("different", "tclDiffers");
      // ECMAScript has only the scoped form.
      return cells(cell("unsupported", "es"), pcreOk ? cell("same", "pcre2") : cell("unsupported", "pcre2Letters"), tcl);
    },
  },
  // a++: PCRE2 only.
  possessive: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // (?>...): PCRE2 only.
  atomicGroup: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // \A: start of the string in PCRE2 and Tcl; a letter or an error in ECMAScript.
  anchorStart: {
    sources: ["ecma262-2026-patterns", "ecma262-2026-annex-b", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("same", "tcl")), // ES, PCRE2, Tcl
  },
  // \Z: PCRE2 also matches before a final newline; Tcl only at the very end.
  anchorEndNewline: {
    sources: ["ecma262-2026-patterns", "ecma262-2026-annex-b", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("different", "tcl")), // ES, PCRE2, Tcl
  },
  // \z: PCRE2 only; not an ARE escape.
  anchorEnd: {
    sources: ["ecma262-2026-patterns", "ecma262-2026-annex-b", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // $: PCRE2 also matches before a newline that ends the subject.
  dollar: {
    sources: ["ecma262-2026-semantics", "pcre2-pattern", "pcre2-api", "tcl84-re-syntax", "tcl84-regexp"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("different", "pcre2"), cell("same", "tcl")), // ES, PCRE2, Tcl
  },
  // The dot: each flavour draws the newline line differently.
  dot: {
    sources: ["ecma262-2026-semantics", "pcre2-pattern", "pcre2-build", "tcl84-regexp", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("different", "pcre2"), cell("different", "tcl")), // ES, PCRE2, Tcl
  },
  // [[:alpha:]]: PCRE2 (ASCII by default) and Tcl (Unicode locale) by name; never ECMAScript.
  posixClass: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax", "tcl86-re-syntax"], // the documents this rule rests on
    decide: (p) => { // verdicts that depend on the occurrence
      // The class name, with a leading ^ when negated.
      const name = String(p.name);
      // PCRE2 knows its fourteen names, negated or not.
      const pcre = PCRE2_POSIX.includes(name.replace(/^\^/, "")) ? cell("same", "pcre2") : cell("unsupported", "pcre2Unknown");
      // Tcl knows twelve names and no negation.
      const tcl = TCL_POSIX.includes(name) ? cell("different", "tcl") : cell("unsupported", "tclUnknown");
      // ECMAScript reads the characters literally.
      return cells(cell("unsupported", "es"), pcre, tcl);
    },
  },
  // [[:<:]] and [[:>:]]: PCRE2 converts them; Tcl keeps them, deprecated.
  posixWordEdge: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("same", "tcl")), // ES, PCRE2, Tcl
  },
  // \Q...\E: PCRE2 only.
  quoteLiteral: {
    sources: ["ecma262-2026-annex-b", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // \p{...}: ECMAScript only in Unicode mode and with stricter names; PCRE2 by default; never Tcl.
  unicodeProperty: {
    sources: ["ecma262-2026-patterns", "ecma262-2026-annex-b", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: (_p, ctx) => cells(ctx.unicodeMode ? cell("different", "esU") : cell("unsupported", "esNoU"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // \pL: PCRE2 only.
  unicodePropertyShort: {
    sources: ["ecma262-2026-patterns", "ecma262-2026-annex-b", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // Lazy quantifiers: Tcl's preference rules differ.
  lazy: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("same", "pcre2"), cell("different", "tcl")), // ES, PCRE2, Tcl
  },
  // \b: a backspace in Tcl.
  wordBoundary: {
    sources: ["ecma262-2026-semantics", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("same", "pcre2"), cell("different", "tcl")), // ES, PCRE2, Tcl
  },
  // \B: a backslash in Tcl.
  nonWordBoundary: {
    sources: ["ecma262-2026-semantics", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("same", "pcre2"), cell("different", "tcl")), // ES, PCRE2, Tcl
  },
  // \w and \W: ASCII in ECMAScript and default PCRE2; Unicode in Tcl.
  wordClass: {
    sources: ["ecma262-2026-semantics", "pcre2-pattern", "tcl84-re-syntax", "tcl86-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("same", "pcre2"), cell("different", "tcl")), // ES, PCRE2, Tcl
  },
  // \D, \S, \W inside brackets: illegal in an ARE.
  classNegatedShorthand: {
    sources: ["ecma262-2026-patterns", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("same", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
  // \m, \M, \y, \Y: Tcl only.
  tclWordConstraint: {
    sources: ["ecma262-2026-annex-b", "pcre2-pattern", "pcre2-api", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("unsupported", "pcre2"), cell("same", "tcl")), // ES, PCRE2, Tcl
  },
  // {,n}: a quantifier only in PCRE2 10.43 and later.
  quantifierOmittedMin: {
    sources: ["ecma262-2026-annex-b", "pcre2-pattern", "tcl84-re-syntax"], // the documents this rule rests on
    decide: () => cells(cell("unsupported", "es"), cell("same", "pcre2"), cell("unsupported", "tcl")), // ES, PCRE2, Tcl
  },
};

/** The source ids a construct's rule cites (for the docs and the vectors). */
export function portabilitySourcesFor(id: PortConstructId): string[] {
  // A copy, so a caller cannot change the table.
  return [...RULES[id].sources];
}

// ---- token helpers ---------------------------------------------------------

/** The index of the group-close that matches the group-open at openIdx, or -1. */
function closeOf(tokens: RegexToken[], openIdx: number): number {
  // Depth counts nested groups; the opener itself takes it to 1.
  let depth = 0;
  // Walk forward from the opener.
  for (let k = openIdx; k < tokens.length; k++) {
    // An opener goes one level deeper.
    if (tokens[k].type === "group-open") depth++;
    // A closer comes back up; at zero it is ours.
    else if (tokens[k].type === "group-close" && --depth === 0) return k;
  }
  // Unbalanced: no closer.
  return -1;
}

/** Join token texts from a to b inclusive, shortened past 40 characters. */
function joinText(tokens: RegexToken[], a: number, b: number): string {
  // Concatenate the source text of the span.
  const s = tokens.slice(a, b + 1).map((t) => t.text).join("");
  // Keep the view readable: an ellipsis past 40 characters.
  return s.length > 40 ? `${s.slice(0, 39)}…` : s;
}

/** The text of the unit a quantifier at qIdx applies to, plus the quantifier. */
function quantifiedText(tokens: RegexToken[], qIdx: number): string {
  // The token just before the quantifier.
  const prev = tokens[qIdx - 1];
  // Nothing before it: the quantifier alone.
  if (!prev) return tokens[qIdx].text;
  // After a group, show the whole group.
  if (prev.type === "group-close") {
    // Walk back to the matching opener.
    let depth = 0;
    // From the closer backwards.
    for (let k = qIdx - 1; k >= 0; k--) {
      // A closer goes one level deeper going backwards.
      if (tokens[k].type === "group-close") depth++;
      // An opener comes back up; at zero it is the match.
      else if (tokens[k].type === "group-open" && --depth === 0) return joinText(tokens, k, qIdx);
    }
  }
  // Otherwise the single unit and the quantifier.
  return joinText(tokens, qIdx - 1, qIdx);
}

/** True when a group-open token starts a capturing group (plain, named in any spelling). */
function isCapturing(t: RegexToken): boolean {
  // Only group openers can capture.
  if (t.type !== "group-open") return false;
  // A plain ( captures.
  if (t.text === "(") return true;
  // (?<name> captures; (?<= and (?<! are lookbehinds.
  if (/^\(\?<(?![=!])/.test(t.text)) return true;
  // (?P<name> and (?'name' capture.
  return /^\(\?(?:P<|')/.test(t.text);
}

/** The name a capturing opener declares, or undefined. */
function groupName(t: RegexToken): string | undefined {
  // Any of the three spellings.
  const m = t.text.match(/^\(\?(?:P?<([^>=!][^>]*)>|'([^']+)')/);
  // Group 1 for angle brackets, 2 for quotes.
  return m ? m[1] ?? m[2] : undefined;
}

/** A width range in characters; max may be Infinity. */
interface Width {
  /** Fewest characters. */
  min: number;
  /** Most characters (Infinity when unbounded). */
  max: number;
}

/** The repetition range of a quantifier token's text. */
function quantRange(q: string): Width {
  // Drop a lazy ? or possessive + suffix (but not a lone ? or +).
  const core = q.length > 1 && /[?+]$/.test(q) ? q.slice(0, -1) : q;
  // The three single-character quantifiers.
  if (core === "*") return { min: 0, max: Infinity };
  // One or more.
  if (core === "+") return { min: 1, max: Infinity };
  // Optional.
  if (core === "?") return { min: 0, max: 1 };
  // A bound {n}, {n,} or {n,m}.
  const m = core.match(/^\{(\d+)(,)?(\d+)?\}$/);
  // Unknown shapes count as unbounded, the safe side.
  if (!m) return { min: 0, max: Infinity };
  // The lower bound.
  const lo = Number(m[1]);
  // {n} is exact, {n,} is open, {n,m} is closed.
  return { min: lo, max: m[2] ? (m[3] !== undefined ? Number(m[3]) : Infinity) : lo };
}

/** Escapes that are zero-width in PCRE2 or Tcl (or mark \Q...\E), counted as 0. */
const ZERO_WIDTH_ESCAPES = new Set(["\\A", "\\Z", "\\z", "\\G", "\\K", "\\Q", "\\E", "\\m", "\\M", "\\y", "\\Y"]);

/** The state width computation shares: capture openers and the groups being measured. */
interface WidthCtx {
  /** Capture group openers by number (1-based). */
  byNumber: Map<number, number>;
  /** Capture group openers by name. */
  byName: Map<string, number>;
  /** Openers currently being measured (a backreference into one is unbounded). */
  visiting: Set<number>;
}

/** Multiply a unit width by a repetition range, treating 0 * Infinity as 0. */
function times(u: Width, q: Width): Width {
  // The minimum is a plain product.
  const min = u.min * q.min;
  // A zero-width unit stays zero however often it repeats.
  const max = u.max === 0 || q.max === 0 ? 0 : u.max * q.max;
  // The product range.
  return { min, max };
}

/** The width of tokens[from, to), alternation included. */
function rangeWidth(tokens: RegexToken[], from: number, to: number, ctx: WidthCtx): Width {
  // Each top-level branch, measured alone.
  const ws = topBranches(tokens, from, to).map(([a, b]) => seqWidth(tokens, a, b, ctx));
  // An empty range is zero wide.
  if (ws.length === 0) return { min: 0, max: 0 };
  // The shortest branch's minimum and the longest branch's maximum.
  return { min: Math.min(...ws.map((w) => w.min)), max: Math.max(...ws.map((w) => w.max)) };
}

/** The [from, to) spans of the top-level branches of tokens[from, to). */
function topBranches(tokens: RegexToken[], from: number, to: number): Array<[number, number]> {
  // The spans found so far.
  const out: Array<[number, number]> = [];
  // Nesting depth inside the range, and the current branch's start.
  let depth = 0, start = from;
  // Walk the range.
  for (let k = from; k < to; k++) {
    // Track nesting.
    if (tokens[k].type === "group-open") depth++;
    // Back out of a group.
    else if (tokens[k].type === "group-close") depth--;
    // A top-level | ends a branch.
    else if (tokens[k].type === "alternation" && depth === 0) {
      // Record it and start the next.
      out.push([start, k]);
      // The next branch starts after the bar.
      start = k + 1;
    }
  }
  // The last branch.
  out.push([start, to]);
  // All branches.
  return out;
}

/** The width of one branch tokens[from, to) with no top-level alternation. */
function seqWidth(tokens: RegexToken[], from: number, to: number, ctx: WidthCtx): Width {
  // The running total.
  const total: Width = { min: 0, max: 0 };
  // Walk the units.
  let k = from;
  // Until the end of the branch.
  while (k < to) {
    // The current token.
    const t = tokens[k];
    // The unit's width and the index after it.
    let u: Width = { min: 0, max: 0 };
    // Where the next unit starts.
    let next = k + 1;
    // A literal run: all but its last character are fixed; the last may take a quantifier.
    let fixedPrefix = 0;
    // Measure by type.
    if (t.type === "group-open") {
      // Find the end of the group, or run to the end of the range.
      const close = closeOf(tokens, k);
      // The group's last inner index (exclusive).
      const end = close === -1 || close > to ? to : close;
      // Lookarounds consume nothing.
      if (/^\(\?<?[=!]$/.test(t.text)) u = { min: 0, max: 0 };
      // A capture group already being measured would recurse forever: unbounded.
      else if (ctx.visiting.has(k)) u = { min: 0, max: Infinity };
      // Otherwise the inside of the group.
      else {
        // Mark it while measuring.
        ctx.visiting.add(k);
        // Measure the inside.
        u = rangeWidth(tokens, k + 1, end, ctx);
        // Unmark it.
        ctx.visiting.delete(k);
      }
      // Continue after the closer.
      next = end + 1;
    } else if (t.type === "literal") { // a run of literal characters
      // Count code points, not UTF-16 units.
      const n = [...t.text].length;
      // The last character is the one a quantifier would repeat.
      fixedPrefix = n - 1;
      // One character for the quantifiable tail.
      u = { min: 1, max: 1 };
    } else if (t.type === "escape") {
      // Zero-width escapes in PCRE2 or Tcl count nothing; the rest are one character.
      u = ZERO_WIDTH_ESCAPES.has(t.text) ? { min: 0, max: 0 } : { min: 1, max: 1 };
    } else if (t.type === "dot" || t.type === "class-shorthand" || t.type === "char-class") {
      // One character each.
      u = { min: 1, max: 1 };
    } else if (t.type === "backref") {
      // The referenced group's width, by number or by name.
      const num = t.text.match(/^\\(\d+)$/);
      // \k<name> or (?P=name).
      const nm = t.text.match(/^(?:\\k<([^>]+)>|\(\?P=([^)]+)\))$/);
      // The opener index, when it can be found.
      const at = num ? ctx.byNumber.get(Number(num[1])) : nm ? ctx.byName.get(nm[1] ?? nm[2]) : undefined;
      // Unknown or self-referencing groups are unbounded.
      if (at === undefined || ctx.visiting.has(at)) u = { min: 0, max: Infinity };
      else {
        // Measure the referenced group's inside.
        const close = closeOf(tokens, at);
        // Mark it while measuring.
        ctx.visiting.add(at);
        // The group's width is the backreference's width.
        u = close === -1 ? { min: 0, max: Infinity } : rangeWidth(tokens, at + 1, close, ctx);
        // Unmark it.
        ctx.visiting.delete(at);
      }
    }
    // Anchors, modifiers, stray closers and stray quantifiers stay zero.
    // A quantifier right after the unit repeats it.
    if (next < to && tokens[next].type === "quantifier" && t.type !== "quantifier") {
      // Apply the repetition.
      u = times(u, quantRange(tokens[next].text));
      // Skip the quantifier.
      next++;
    }
    // Add the unit and any fixed literal prefix.
    total.min += u.min + fixedPrefix;
    // Infinity absorbs everything.
    total.max += u.max + fixedPrefix;
    // On to the next unit.
    k = next;
  }
  // The branch's range.
  return total;
}

// ---- detection -------------------------------------------------------------

/** One raw occurrence before deduplication. */
interface Hit {
  /** Which construct. */
  id: PortConstructId;
  /** The text as written. */
  text: string;
  /** ICU parameters for the notes. */
  params: Record<string, string | number>;
}

/** Scan a character-class token's text for constructs that live inside brackets. */
function scanClass(text: string, push: (id: PortConstructId, t: string, p?: Record<string, string | number>) => void): void {
  // POSIX names: [:alpha:], [:^digit:], and the word edges [:<:] and [:>:].
  for (const m of text.matchAll(/\[:(\^?[A-Za-z]+|[<>]):/g)) {
    // The class name as written.
    const name = m[1];
    // The word-edge pair is its own construct.
    if (name === "<" || name === ">") push("posixWordEdge", `[[:${name}:]]`);
    // Any other name is a POSIX class.
    else push("posixClass", `[:${name}:]`, { name });
  }
  // Escapes inside the brackets, read pairwise from after the opening [.
  for (let j = 1; j < text.length; j++) {
    // Only backslashes start escapes.
    if (text[j] !== "\\") continue;
    // The escaped character.
    const c = text[j + 1] ?? "";
    // \w keeps its meaning inside brackets.
    if (c === "w") push("wordClass", "\\w");
    // \D, \S and \W are illegal inside an ARE bracket expression.
    else if (c === "D" || c === "S" || c === "W") push("classNegatedShorthand", `\\${c}`);
    // \p{...} or the one-letter \pL.
    else if (c === "p" || c === "P") {
      // The braced form.
      const braced = text.slice(j).match(/^\\[pP]\{[^}]*\}/);
      // Braced, or a letter after it.
      if (braced) push("unicodeProperty", braced[0]);
      // The one-letter form.
      else if (/[A-Za-z]/.test(text[j + 2] ?? "")) push("unicodePropertyShort", text.slice(j, j + 3));
    }
    // \Q opens a literal run in PCRE2.
    else if (c === "Q") push("quoteLiteral", "\\Q");
    // Skip the escaped character.
    j++;
  }
}

/**
 * The portability report for a token list (from explainPattern) and the
 * tester's flags. Pure: reads tokens only, never compiles or runs a pattern.
 */
export function portabilityReport(tokens: RegexToken[], flags = ""): PortabilityReport {
  // The raw hits, in pattern order.
  const hits: Hit[] = [];
  // A small helper so every branch below reads the same.
  const push = (id: PortConstructId, text: string, params: Record<string, string | number> = {}) => hits.push({ id, text, params });
  // Capture openers by number and by name, for backreference widths.
  const byNumber = new Map<number, number>();
  // Names map to opener indexes.
  const byName = new Map<string, number>();
  // Number the capturing groups left to right by their opening parenthesis.
  let n = 0;
  // One pass to index the captures.
  tokens.forEach((t, k) => {
    // Plain and named groups both take a number.
    if (isCapturing(t)) {
      // The next number.
      byNumber.set(++n, k);
      // And the name, if any.
      const name = groupName(t);
      // Remember the first group with that name.
      if (name !== undefined && !byName.has(name)) byName.set(name, k);
    }
  });
  // The shared width context.
  const wctx: WidthCtx = { byNumber, byName, visiting: new Set() };

  // True between \Q and \E: PCRE2 reads that stretch literally, and its row already says so.
  let inQuote = false;
  // The detection pass.
  for (let k = 0; k < tokens.length; k++) {
    // The token, and the next one for two-token constructs.
    const t = tokens[k];
    // Inside \Q...\E only the closing \E matters.
    if (inQuote) {
      // \E ends the literal stretch; everything else in it is skipped.
      if (t.type === "escape" && t.text === "\\E") inQuote = false;
      // Nothing else is compared inside the quote.
      continue;
    }
    // The following token's text, or "".
    const nextText = tokens[k + 1]?.text ?? "";
    // Dispatch on type.
    switch (t.type) {
      case "group-open": {
        // Where this group ends.
        const close = closeOf(tokens, k);
        // The inside's last index (exclusive); an unclosed group runs to the end.
        const end = close === -1 ? tokens.length : close;
        // Lookbehinds: classify by the widths of their top-level branches.
        if (t.text === "(?<=" || t.text === "(?<!") {
          // Each branch's width.
          const ws = topBranches(tokens, k + 1, end).map(([a, b]) => seqWidth(tokens, a, b, wctx));
          // The written text of the whole assertion.
          const text = joinText(tokens, k, Math.min(end, tokens.length - 1));
          // Any branch without a maximum makes it unbounded.
          if (ws.some((w) => w.max === Infinity)) push("lookbehindUnbounded", text);
          // Every branch one length: fixed.
          else if (ws.every((w) => w.min === w.max)) push("lookbehindFixed", text, { max: Math.max(0, ...ws.map((w) => w.max)) });
          // Otherwise bounded, with the longest branch's maximum.
          else push("lookbehindBounded", text, { max: Math.max(...ws.map((w) => w.max)) });
        } else if (t.text === "(?=" || t.text === "(?!") {
          // Look inside the lookahead for captures and backreferences.
          const inner = tokens.slice(k + 1, end);
          // Any backreference inside.
          const backref = inner.some((x) => x.type === "backref") ? 1 : 0;
          // Any capturing group inside.
          const capture = inner.some((x) => isCapturing(x));
          // Only those two shapes differ.
          if (backref || capture) push("lookaheadGroups", joinText(tokens, k, Math.min(end, tokens.length - 1)), { backref });
        } else if (t.text === "(?>") {
          // An atomic group.
          push("atomicGroup", joinText(tokens, k, Math.min(end, tokens.length - 1)));
        } else if (/^\(\?(?:P<|')/.test(t.text)) {
          // The Python or quoted spelling of a named group.
          push("namedGroupAlt", t.text, { name: groupName(t) ?? "" });
        } else if (/^\(\?<(?![=!])/.test(t.text)) {
          // The angle-bracket spelling.
          const name = groupName(t) ?? "";
          // PCRE2 outside UTF mode takes ASCII letters, digits and underscore only.
          push("namedGroup", t.text, { name, nonAscii: /^[_A-Za-z][_A-Za-z0-9]*$/.test(name) ? 0 : 1 });
        } else {
          // A scoped modifier group (?flags:.
          const m = t.text.match(MODIFIER_AT);
          // Only the colon form is a group-open.
          if (m && m[5] === ":" && (m[1] || m[2] || m[3])) push("inlineFlagsScoped", t.text, { on: m[2], off: m[4], caret: m[1] ? 1 : 0, letters: `${m[1]}${m[2]}${m[3]}${m[4]}` });
        }
        break;
      }
      case "modifier": {
        // The bare (?flags) form.
        const m = t.text.match(MODIFIER_AT);
        // Always matches, by construction of the token.
        if (m) push("inlineFlagsGlobal", t.text, { on: m[2], off: m[4], caret: m[1] ? 1 : 0, hyphen: m[3] ? 1 : 0, atStart: k === 0 ? 1 : 0, letters: `${m[1]}${m[2]}${m[3]}${m[4]}` });
        break;
      }
      case "backref": {
        // \k<name> is shared by ECMAScript and PCRE2.
        if (t.text.startsWith("\\k<")) push("namedBackref", t.text);
        // (?P=name) is PCRE2 only.
        else if (t.text.startsWith("(?P=")) push("backrefPcreOnly", t.text);
        break;
      }
      case "escape": {
        // Single escapes with their own construct.
        if (t.text === "\\A") push("anchorStart", t.text);
        // \Z: end, or before a final newline.
        else if (t.text === "\\Z") push("anchorEndNewline", t.text);
        // \z: the very end.
        else if (t.text === "\\z") push("anchorEnd", t.text);
        // \Q opens a literal run, which the next tokens up to \E belong to.
        else if (t.text === "\\Q") {
          // Record the construct once.
          push("quoteLiteral", t.text);
          // Skip what follows until \E.
          inQuote = true;
        }
        // The Tcl word constraints.
        else if (["\\m", "\\M", "\\y", "\\Y"].includes(t.text)) push("tclWordConstraint", t.text, { escape: t.text });
        // \k followed by a quote or a brace: the Perl or .NET spelling.
        else if (t.text === "\\k" && /^['{]/.test(nextText)) push("backrefPcreOnly", `\\k${nextText.match(/^('[^']*'|\{[^}]*\})/)?.[0] ?? nextText.slice(0, 20)}`);
        // \g followed by a brace or a (signed) number.
        else if (t.text === "\\g" && /^(\{|[-+]?\d)/.test(nextText)) push("backrefPcreOnly", `\\g${nextText.match(/^(\{[^}]*\}|[-+]?\d+)/)?.[0] ?? ""}`);
        // \p or \P followed by a letter: the one-letter property form.
        else if ((t.text === "\\p" || t.text === "\\P") && /^[A-Za-z]/.test(nextText)) push("unicodePropertyShort", `${t.text}${nextText[0]}`);
        break;
      }
      case "class-shorthand": {
        // \w and \W outside brackets.
        if (t.text === "\\w" || t.text === "\\W") push("wordClass", t.text);
        // The braced property escape.
        else if (/^\\[pP]\{/.test(t.text)) push("unicodeProperty", t.text);
        break;
      }
      case "anchor": {
        // \b, \B and $ each differ somewhere.
        if (t.text === "\\b") push("wordBoundary", t.text);
        // \B is a backslash in Tcl.
        else if (t.text === "\\B") push("nonWordBoundary", t.text);
        // $ and the trailing newline.
        else if (t.text === "$") push("dollar", t.text);
        break;
      }
      case "dot": {
        // Every dot shares one row.
        push("dot", t.text);
        break;
      }
      case "quantifier": {
        // A possessive suffix: + after a quantifier.
        if (t.text.length > 1 && t.text.endsWith("+")) push("possessive", quantifiedText(tokens, k));
        // A lazy suffix: ? after a quantifier.
        else if (t.text.length > 1 && t.text.endsWith("?")) push("lazy", quantifiedText(tokens, k));
        break;
      }
      case "char-class": {
        // Constructs inside the brackets.
        scanClass(t.text, push);
        break;
      }
      case "literal": {
        // {,n}: a quantifier only in PCRE2 10.43 and later.
        const m = t.text.match(/\{,\d+\}/);
        // Report the brace text itself.
        if (m) push("quantifierOmittedMin", m[0]);
        break;
      }
      default:
        // Alternation, plain closers and the rest carry nothing to compare.
        break;
    }
  }

  // The flags that matter to a rule.
  const ctx: RuleContext = { unicodeMode: /[uv]/.test(flags) };
  // Merge hits that share a construct and identical verdicts.
  const byKey = new Map<string, PortFinding>();
  // In pattern order, so the first occurrence leads.
  for (const h of hits) {
    // The verdicts for this occurrence.
    const decided = RULES[h.id].decide(h.params, ctx);
    // Same construct and same cells merge into one row.
    // The option letters appear in their notes, so rows with other letters stay apart.
    const key = `${h.id}|${FLAVOURS.map((f) => `${decided[f].verdict}:${decided[f].note}`).join(",")}|${h.params.letters ?? ""}`;
    // An existing row for this key, if any.
    const seen = byKey.get(key);
    if (seen) {
      // One more occurrence.
      seen.count++;
      // Keep up to three distinct examples.
      if (!seen.examples.includes(h.text) && seen.examples.length < 3) seen.examples.push(h.text);
      // Numeric parameters keep the largest value (the lookbehind maximum, for one).
      for (const [pk, pv] of Object.entries(h.params)) if (typeof pv === "number" && typeof seen.params[pk] === "number" && pv > (seen.params[pk] as number)) seen.params[pk] = pv;
    } else {
      // A new row, parameters copied so later merges cannot touch the hit.
      byKey.set(key, { id: h.id, text: h.text, examples: [h.text], count: 1, params: { ...h.params }, cells: decided, sources: [...RULES[h.id].sources] });
    }
  }
  // Rows in first-occurrence order (Map keeps insertion order).
  return { findings: [...byKey.values()], tooLong: false };
}

/** The convenience entry the component calls: tokenize, then compare, with the length cap. */
export function portabilityOf(pattern: string, flags = ""): PortabilityReport {
  // Over the cap: report that and read nothing.
  if (pattern.length > MAX_PORTABILITY_LENGTH) return { findings: [], tooLong: true };
  // Otherwise the tokens explainPattern produces, compared.
  return portabilityReport(explainPattern(pattern), flags);
}
