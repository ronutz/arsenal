// ============================================================================
// src/lib/tcl84/are.ts
// ----------------------------------------------------------------------------
// TCL REGULAR EXPRESSIONS, THE COMMON SUBSET - for `matches_regex` and
// `switch -regexp` in the teaching tools.
//
// Tcl 8.4 uses its own "Advanced Regular Expression" engine (the re_syntax
// manual page F5 links from matches_regex). For the question these tools ask
// ("does the string match anywhere?") the everyday part of that syntax means
// the same thing in JavaScript's engine, so this module TRANSLATES that part
// and REFUSES the rest with a clear message instead of answering wrongly:
//
//   translated: literals, . ^ $ * + ? {m} {m,} {m,n} (and their lazy forms),
//               | ( ) (?: ), bracket expressions with ranges, \d \D \w \W
//               \s \S, \t \n \r, and backslash before punctuation;
//   refused:    back-references, \m \M \y \Y \A \Z \B (Tcl-only anchors),
//               POSIX classes such as [[:alpha:]], look-ahead, embedded
//               options (?i), the ***= and ***: directors, \x \u \e \0 and
//               every other escape.
//
// In Tcl's engine "." also matches a newline (unless -line is used, which
// matches_regex does not offer), so the translation sets JavaScript's "s"
// flag.
// ============================================================================

import { TclError } from "./value";

/** A pattern this module will not translate. */
function refuse(what: string): never {
  // One message shape for every refusal.
  throw new TclError(`the regular expression uses ${what}, which this tool does not model`);
}

/** Translate a Tcl ARE pattern (the common subset) to a JavaScript RegExp. */
export function translateAre(pattern: string): RegExp {
  // Directors and embedded options.
  if (pattern.startsWith("***")) refuse("a *** director");
  // The JavaScript source being built.
  let out = "";
  // Open groups (for balance).
  let depth = 0;
  // Walk the pattern.
  for (let i = 0; i < pattern.length; i++) {
    // The character.
    const c = pattern[i];
    // Escapes.
    if (c === "\\") {
      // The escaped character.
      const n = pattern[i + 1];
      // A trailing backslash.
      if (n === undefined) refuse("a trailing backslash");
      // Class shorthands mean the same.
      if ("dDwWsS".includes(n)) { out += "\\" + n; i++; continue; }
      // Control escapes.
      if (n === "t" || n === "n" || n === "r") { out += "\\" + n; i++; continue; }
      // Any other letter or digit is a Tcl-specific escape.
      if (/[A-Za-z0-9]/.test(n)) refuse(`the escape \\${n}`);
      // Escaped punctuation is literal.
      out += "\\" + n;
      // Skip it.
      i++;
      // Next.
      continue;
    }
    // A bracket expression.
    if (c === "[") {
      // Copy it, translating a leading "]" and refusing POSIX classes.
      let j = i + 1;
      // The translated set.
      let set = "[";
      // Negation.
      if (pattern[j] === "^") { set += "^"; j++; }
      // A leading "]" is a literal member.
      if (pattern[j] === "]") { set += "\\]"; j++; }
      // Members up to the closing "]".
      for (; j < pattern.length && pattern[j] !== "]"; j++) {
        // POSIX classes, equivalence classes and collating elements.
        if (pattern[j] === "[" && (pattern[j + 1] === ":" || pattern[j + 1] === "=" || pattern[j + 1] === ".")) refuse("a POSIX bracket class");
        // Escapes inside brackets.
        if (pattern[j] === "\\") {
          // The escaped character.
          const n = pattern[j + 1];
          // Shorthand classes and control escapes.
          if (n !== undefined && "dDwWsStnr".includes(n)) { set += "\\" + n; j++; continue; }
          // Other letters and digits.
          if (n === undefined || /[A-Za-z0-9]/.test(n)) refuse(`the escape \\${n ?? ""} inside brackets`);
          // Punctuation.
          set += "\\" + n;
          // Skip it.
          j++;
          // Next.
          continue;
        }
        // A literal "[" must be escaped for JavaScript.
        set += pattern[j] === "[" ? "\\[" : pattern[j];
      }
      // Unclosed.
      if (j >= pattern.length) refuse("an unclosed bracket expression");
      // Close it.
      out += set + "]";
      // Continue after "]".
      i = j;
      // Next.
      continue;
    }
    // Groups.
    if (c === "(") {
      // Non-capturing groups are fine; look-ahead and options are not.
      if (pattern[i + 1] === "?") {
        // (?: is the same in both.
        if (pattern[i + 2] === ":") { out += "(?:"; i += 2; depth++; continue; }
        // Anything else.
        refuse("a (? construct other than (?:");
      }
      // A plain group.
      out += "(";
      // Track depth.
      depth++;
      // Next.
      continue;
    }
    // Close a group.
    if (c === ")") {
      // Unbalanced.
      if (depth === 0) refuse("an unbalanced parenthesis");
      // Close it.
      depth--;
      // Copy.
      out += ")";
      // Next.
      continue;
    }
    // Bounds: only well-formed ones.
    if (c === "{") {
      // The bound text.
      const m = /^\{(\d+)(,(\d*))?\}/.exec(pattern.slice(i));
      // Malformed.
      if (!m) refuse("a malformed {m,n} bound");
      // Copy it.
      out += m![0];
      // Skip it.
      i += m![0].length - 1;
      // Next.
      continue;
    }
    // Everything else copies through (. ^ $ * + ? | and literals).
    out += c === "/" ? "\\/" : c;
  }
  // Unclosed groups.
  if (depth !== 0) refuse("an unclosed parenthesis");
  // Compile (JavaScript syntax errors become refusals).
  try { return new RegExp(out, "s"); } catch { return refuse("syntax this tool cannot translate"); }
}

/** Does `subject` match `pattern` anywhere (Tcl's regexp semantics, common subset)? */
export function areMatch(subject: string, pattern: string): boolean {
  // Translate, then search.
  return translateAre(pattern).test(subject);
}
