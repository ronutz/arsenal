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
  | "backref";

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
  const core = lazy ? q.slice(0, -1) : q;
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
  return lazy ? `${base}, as few as possible (lazy)` : base;
}

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
    const m = rest.match(/^(\*|\+|\?|\{\d+(?:,\d*)?\})\??/);
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
      if (SHORTHAND[two]) {
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
      } else {
        const named = rest.match(/^\(\?<([^>]+)>/);
        if (named) {
          text = named[0];
          description = `start of a named capturing group "${named[1]}"`;
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
      const m = rest.match(/^(\*|\+|\?|\{\d+(?:,\d*)?\})\??/);
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
