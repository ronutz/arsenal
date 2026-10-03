// ============================================================================
// src/lib/tcl84/glob.ts
// ----------------------------------------------------------------------------
// TCL 8.4 GLOB MATCHING - `string match`, `switch -glob`, and the iRules
// operators F5 defines in its terms (`contains` is documented as equivalent
// to `string match *string2* string1`, and `matches_glob` is glob matching).
//
// Semantics follow Tcl_StringCaseMatch in tclUtil.c (Tcl 8.4.6):
//   *        any run of characters, including none
//   ?        exactly one character
//   [chars]  one character from the set; "a-z" is a range, and a reversed
//            range ("z-a") matches too; a backslash inside a set is just a
//            backslash; an empty set "[]" matches nothing; in "[a-]" the "]"
//            is read as the END OF THE RANGE, so that set does not close
//            where it seems to (a quirk of 8.4.6, reproduced here)
//   \x       the character x itself (so "\*" matches a literal star)
//   -nocase  both sides are compared after Tcl 8.4.6's own lower-casing.
//
// Tcl's own implementation backtracks recursively on "*". This one walks the
// tokens between stars in a loop and memoises each (string position, pattern
// position) a star can hand over to, so a hostile pattern such as
// "*a*a*a*a*a*b" cannot stall the page and the call depth never exceeds the
// number of stars.
// ============================================================================

import { tclToLower } from "./casemap";

/** Does `s` match the glob `pattern`? `nocase` folds case as Tcl does. */
export function globMatch(pattern: string, s: string, nocase = false): boolean {
  // Memo of results keyed by (string index, pattern index after a star).
  const memo = new Map<number, boolean>();
  // Width of the key space for the pattern index.
  const W = pattern.length + 1;
  // Fold case when asked (Tcl_UniCharToLower, which tolower() equals for ASCII).
  const fold = (c: string) => (nocase ? tclToLower(c) : c);
  // Match the pattern from pi against the string from si.
  const match = (si0: number, pi0: number): boolean => {
    // The memo key for this starting point.
    const key = si0 * W + pi0;
    // Reuse a cached answer.
    const hit = memo.get(key);
    // Return it when present.
    if (hit !== undefined) return hit;
    // Current positions.
    let si = si0, pi = pi0;
    // The answer, decided inside the loop.
    let result: boolean;
    // Walk tokens until the answer is known.
    for (;;) {
      // The pattern character.
      const p = pattern[pi];
      // End of pattern: a match only at the end of the string.
      if (p === undefined) { result = si >= s.length; break; }
      // End of string: only a "*" can still match.
      if (si >= s.length && p !== "*") { result = false; break; }
      // A star (a run of stars counts once).
      if (p === "*") {
        // Skip consecutive stars.
        let q = pi;
        // Advance past every "*".
        while (pattern[q] === "*") q++;
        // A trailing star matches whatever is left.
        if (q >= pattern.length) { result = true; break; }
        // Try every remaining suffix of the string, shortest skip first.
        result = false;
        // Each candidate start for the rest of the pattern.
        for (let k = si; k <= s.length; k++) if (match(k, q)) { result = true; break; }
        // The star decided it.
        break;
      }
      // A question mark consumes exactly one character.
      if (p === "?") { si++; pi++; continue; }
      // A character set.
      if (p === "[") {
        // The string character being tested (consumed whatever happens).
        const ch = fold(s[si]);
        // Walk the set's items.
        let q = pi + 1;
        // Whether an item matched.
        let found = false;
        // Loop over items until one matches or the set ends.
        for (;;) {
          // "]" or the end of the pattern before any match: no match.
          if (pattern[q] === "]" || pattern[q] === undefined) break;
          // The item's first character.
          const start = fold(pattern[q++]);
          // A range "a-z" (the end may even be "]").
          if (pattern[q] === "-") {
            // Step over the dash.
            q++;
            // A dash at the very end of the pattern: no match.
            if (pattern[q] === undefined) break;
            // The range's end character.
            const end = fold(pattern[q++]);
            // Ranges match in either direction.
            if ((start <= ch && ch <= end) || (end <= ch && ch <= start)) { found = true; break; }
          } else if (start === ch) {
            // A single character matched.
            found = true;
            // Stop scanning items.
            break;
          }
        }
        // No item matched: the whole match fails here.
        if (!found) { result = false; break; }
        // Skip to the next "]" (from just after the matching item).
        while (pattern[q] !== "]" && pattern[q] !== undefined) q++;
        // Continue after it, or at the end of the pattern if there is none.
        pi = pattern[q] === "]" ? q + 1 : q;
        // One string character was consumed.
        si++;
        // Next token.
        continue;
      }
      // A backslash makes the next character literal.
      let pp = pi;
      // Strip the backslash.
      if (p === "\\") {
        // Step past it.
        pp++;
        // A trailing backslash matches nothing.
        if (pattern[pp] === undefined) { result = false; break; }
      }
      // Plain character comparison.
      if (fold(s[si]) !== fold(pattern[pp])) { result = false; break; }
      // Both advance by one character.
      si++;
      // Past the compared pattern character.
      pi = pp + 1;
    }
    // Remember the answer for this starting point.
    memo.set(key, result);
    // Done.
    return result;
  };
  // Start at the beginning of both.
  return match(0, 0);
}
