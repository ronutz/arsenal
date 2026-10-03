// ============================================================================
// src/lib/tcl84/strings.ts
// ----------------------------------------------------------------------------
// TCL 8.4 `string` SUBCOMMANDS used to parse values in iRules, with the
// details each tool needs to EXPLAIN its answer, not just state it.
//
// Every function mirrors the 8.4.6 C implementation (tclCmdMZ.c):
//
//   length / bytelength  characters versus the bytes Tcl stores (its internal
//                        UTF-8, in which U+0000 takes two bytes);
//   tolower / toupper    optional first/last indices, clamped as Tcl clamps;
//   range                indices clamped to the string, "" when first > last;
//   index                one character, "" when out of range;
//   first / last         an optional start index; for `last` the WHOLE match
//                        must end at or before it;
//   map                  ONE left-to-right pass; at each position the keys are
//                        tried in the order given and the first match wins;
//                        replaced text is never rescanned;
//   compare / equal      character-by-character, optionally -nocase;
//   match                glob matching (glob.ts).
//
// Strings are handled as Tcl 8.4 holds them: 16-bit characters. Text outside
// the Basic Multilingual Plane (most emoji, for instance) is refused rather
// than counted wrongly, because Tcl 8.4 cannot represent it as one character.
// ============================================================================

import { readIndex, type IndexReading } from "./index";
import { parseList } from "./list";
import { globMatch } from "./glob";
import { tclToLower, tclToUpper } from "./casemap";
import { MAX_VALUE_CHARS, tooLarge } from "./value";

/** A string command that failed, with Tcl 8.4's own message. */
export class TclStringError extends Error {
  /** Build the error. */
  constructor(message: string) {
    // Error carries the message.
    super(message);
    // A stable name.
    this.name = "TclStringError";
  }
}

/** Refuse text that Tcl 8.4 cannot hold one character per code point. */
export function assertBmp(s: string): void {
  // A surrogate code unit means a character beyond U+FFFF.
  if (/[\uD800-\uDFFF]/.test(s)) throw new TclStringError("characters beyond U+FFFF (such as most emoji) cannot be held as single characters by Tcl 8.4; not modelled");
}

/**
 * Tcl_UniCharIsSpace in Tcl 8.4.6: C isspace() for ASCII, and the Unicode
 * space-separator, line-separator and paragraph-separator categories of the
 * tables Tcl 8.4.6 ships. The set below was read out of the real interpreter
 * (every BMP character run through `string is space`), so it includes U+200B
 * (zero width space, a space separator in those older tables) and excludes
 * U+0085 (next line, a control character there).
 */
const UNI_SPACE = /[\t\n\v\f\r \u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u3000]/;

/** True when Tcl 8.4.6 treats the character as white space (scan, string is space). */
export function isUniSpace(ch: string | undefined): boolean {
  // Undefined (past the end) is not space; otherwise test the fixed set.
  return ch !== undefined && UNI_SPACE.test(ch);
}

/** Number of characters, as `string length` counts them. */
export function strLength(s: string): number {
  // BMP text: one JavaScript code unit per Tcl character.
  return s.length;
}

/** Bytes in Tcl's internal (modified) UTF-8, as `string bytelength` counts them. */
export function strByteLength(s: string): number {
  // Sum the encoded size of each character.
  let n = 0;
  // Walk the 16-bit characters.
  for (let i = 0; i < s.length; i++) {
    // The code unit.
    const c = s.charCodeAt(i);
    // U+0000 is stored as two bytes (C0 80) so it never ends a C string.
    if (c === 0) n += 2;
    // ASCII: one byte.
    else if (c < 0x80) n += 1;
    // Up to U+07FF: two bytes.
    else if (c < 0x800) n += 2;
    // The rest of the BMP: three bytes.
    else n += 3;
  }
  // The byte count.
  return n;
}

/** One-to-one case mapping with Tcl 8.4.6's own tables (casemap.ts). */
export function caseMap(ch: string, upper: boolean): string {
  // The generated tables give exactly what the interpreter gives.
  return upper ? tclToUpper(ch) : tclToLower(ch);
}

/** The outcome of tolower/toupper, with the span that was converted. */
export interface CaseResult {
  // The converted string.
  value: string;
  // The first converted index, or null when nothing was in range.
  first: number | null;
  // The last converted index, or null.
  last: number | null;
  // How the indices were read, for explanations.
  firstReading?: IndexReading;
  // How the last index was read, if given.
  lastReading?: IndexReading;
}

/** `string tolower|toupper string ?first? ?last?` with Tcl 8.4's clamping. */
export function strCase(s: string, upper: boolean, firstText?: string, lastText?: string): CaseResult {
  // Without indices, the whole string converts.
  if (firstText === undefined) return { value: [...s].map((c) => caseMap(c, upper)).join(""), first: s.length ? 0 : null, last: s.length ? s.length - 1 : null };
  // "end" means the last character.
  const endValue = s.length - 1;
  // Read the first index.
  const fr = readIndex(firstText, endValue);
  // A negative first index becomes 0.
  let first = Math.max(0, fr.value);
  // The last index defaults to the first.
  const lr = lastText === undefined ? undefined : readIndex(lastText, endValue);
  // Read it when given.
  let last = lr ? lr.value : first;
  // A last index past the end becomes the end.
  if (last >= endValue) last = endValue;
  // Nothing to convert when the span is empty: the string comes back unchanged.
  if (last < first) return { value: s, first: null, last: null, firstReading: fr, lastReading: lr };
  // Convert the span and keep the rest.
  const mid = [...s.slice(first, last + 1)].map((c) => caseMap(c, upper)).join("");
  // Reassemble.
  return { value: s.slice(0, first) + mid + s.slice(last + 1), first, last, firstReading: fr, lastReading: lr };
}

/** The outcome of string range, with the clamped span. */
export interface RangeResult {
  // The extracted text.
  value: string;
  // The first index after clamping.
  first: number;
  // The last index after clamping.
  last: number;
  // Index readings for explanations.
  firstReading: IndexReading;
  // How the last index was read.
  lastReading: IndexReading;
}

/** `string range string first last` with Tcl 8.4's clamping. */
export function strRange(s: string, firstText: string, lastText: string): RangeResult {
  // "end" means the last character.
  const endValue = s.length - 1;
  // Read both indices.
  const fr = readIndex(firstText, endValue);
  // The last index.
  const lr = readIndex(lastText, endValue);
  // A negative first becomes 0.
  const first = Math.max(0, fr.value);
  // A last past the end becomes the end.
  const last = Math.min(endValue, lr.value);
  // An empty span gives the empty string.
  const value = last < first ? "" : s.slice(first, last + 1);
  // The result and the clamped span.
  return { value, first, last, firstReading: fr, lastReading: lr };
}

/** `string index string charIndex`: one character, or "" out of range. */
export function strIndex(s: string, indexText: string): { value: string; index: number; reading: IndexReading } {
  // Read the index.
  const r = readIndex(indexText, s.length - 1);
  // Out of range gives "".
  const value = r.value >= 0 && r.value < s.length ? s[r.value] : "";
  // The character and where it came from.
  return { value, index: r.value, reading: r };
}

/** The outcome of string first/last, with the searched window. */
export interface SearchResult {
  // The match index, or -1.
  value: number;
  // The first index of the window that was searched.
  windowStart: number;
  // The last index a match could START at (inclusive), or -1 if none.
  windowLastStart: number;
  // The start index reading, when one was given.
  reading?: IndexReading;
}

/** `string first needle haystack ?startIndex?` per Tcl 8.4.6. */
export function strFirst(needle: string, hay: string, startText?: string): SearchResult {
  // Search from the beginning unless told otherwise.
  let start = 0;
  // Read the optional start index.
  const reading = startText === undefined ? undefined : readIndex(startText, hay.length - 1);
  // Apply it.
  if (reading) {
    // At or past the end: nothing to search.
    if (reading.value >= hay.length) return { value: -1, windowStart: reading.value, windowLastStart: -1, reading };
    // Negative starts are treated as 0 (Tcl bug #423581 fix).
    start = Math.max(0, reading.value);
  }
  // The last position a match of this length could start at.
  const lastStart = hay.length - needle.length;
  // An empty needle never matches.
  if (needle.length === 0) return { value: -1, windowStart: start, windowLastStart: lastStart, reading };
  // Scan forward.
  for (let p = start; p <= lastStart; p++) if (hay.startsWith(needle, p)) return { value: p, windowStart: start, windowLastStart: lastStart, reading };
  // Not found.
  return { value: -1, windowStart: start, windowLastStart: lastStart, reading };
}

/** `string last needle haystack ?lastIndex?` per Tcl 8.4.6: the match must END at or before lastIndex. */
export function strLast(needle: string, hay: string, lastText?: string): SearchResult {
  // The last position a match could start at, before any limit.
  let p = hay.length - needle.length;
  // Read the optional limit.
  const reading = lastText === undefined ? undefined : readIndex(lastText, hay.length - 1);
  // Apply it.
  if (reading) {
    // A negative limit finds nothing.
    if (reading.value < 0) return { value: -1, windowStart: 0, windowLastStart: -1, reading };
    // Within the string: the whole match must fit before the limit.
    if (reading.value < hay.length) p = reading.value + 1 - needle.length;
  }
  // The window searched (backwards from p).
  const lastStart = p;
  // An empty needle never matches.
  if (needle.length === 0) return { value: -1, windowStart: 0, windowLastStart: lastStart, reading };
  // Scan backward.
  for (; p >= 0; p--) if (hay.startsWith(needle, p)) return { value: p, windowStart: 0, windowLastStart: lastStart, reading };
  // Not found.
  return { value: -1, windowStart: 0, windowLastStart: lastStart, reading };
}

/** One step of a string map pass, for the trace. */
export interface MapStep {
  // Index in the ORIGINAL string where this step happened.
  at: number;
  // "replace" when a key matched; "keep" when a character was copied.
  action: "replace" | "keep";
  // The key that matched (replace) or the character kept.
  text: string;
  // The replacement written (replace only).
  value?: string;
  // Which pair matched, 0-based (replace only).
  pair?: number;
}

/** The outcome of string map. */
export interface MapResult {
  // The mapped string.
  value: string;
  // The key/value pairs as parsed from the map list.
  pairs: [string, string][];
  // The single-pass trace.
  steps: MapStep[];
}

/** How many steps a string map trace keeps (the result itself is always complete). */
export const MAP_TRACE_STEPS = 500;

/** `string map ?-nocase? mapping string` per Tcl 8.4.6. */
export function strMap(mapping: string, s: string, nocase = false): MapResult {
  // The mapping is a Tcl list of key value key value ...
  const items = parseList(mapping);
  // An odd count is Tcl's "unbalanced" error.
  if (items.length % 2 === 1) throw new TclStringError("char map list unbalanced");
  // Group into pairs.
  const pairs: [string, string][] = [];
  // Two items at a time.
  for (let i = 0; i < items.length; i += 2) pairs.push([items[i], items[i + 1]]);
  // An empty mapping returns the string unchanged.
  if (pairs.length === 0) return { value: s, pairs, steps: [] };
  // Case folding for -nocase compares lower-cased characters.
  const fold = (t: string) => (nocase ? [...t].map((c) => caseMap(c, false)).join("") : t);
  // The output being built.
  let out = "";
  // The trace.
  const steps: MapStep[] = [];
  // One pass over the input.
  for (let i = 0; i < s.length; ) {
    // Try the keys in order.
    let matched = -1;
    // Each pair.
    for (let k = 0; k < pairs.length; k++) {
      // The key.
      const key = pairs[k][0];
      // Empty keys never match.
      if (key.length === 0) continue;
      // Compare the key with the text at this position (folded only with -nocase).
      if (i + key.length <= s.length && (nocase ? fold(s.slice(i, i + key.length)) === fold(key) : s.startsWith(key, i))) {
        // First match wins.
        matched = k;
        // Stop trying keys.
        break;
      }
    }
    // A key matched here.
    if (matched >= 0) {
      // The matching pair.
      const [key, value] = pairs[matched];
      // Emit the replacement.
      out += value;
      // The tool's size limit (each replacement can be longer than what it replaces).
      if (out.length > MAX_VALUE_CHARS) throw tooLarge();
      // Record the step (the trace keeps the first MAP_TRACE_STEPS).
      if (steps.length < MAP_TRACE_STEPS) steps.push({ at: i, action: "replace", text: s.slice(i, i + key.length), value, pair: matched });
      // Skip past the matched text; the replacement is never rescanned.
      i += key.length;
    } else {
      // No key here: copy the character.
      out += s[i];
      // Merge consecutive kept characters into one trace step.
      const prev = steps[steps.length - 1];
      // Extend the previous keep step when adjacent.
      if (prev && prev.action === "keep" && prev.at + prev.text.length === i) prev.text += s[i];
      // Otherwise start a new one (the trace keeps the first MAP_TRACE_STEPS).
      else if (steps.length < MAP_TRACE_STEPS) steps.push({ at: i, action: "keep", text: s[i] });
      // Next character.
      i++;
    }
  }
  // The mapped string, the pairs and the trace.
  return { value: out, pairs, steps };
}

/** `string compare ?-nocase? a b`: -1, 0 or 1 by character code. */
export function strCompare(a: string, b: string, nocase = false): number {
  // Fold case when asked.
  const x = nocase ? [...a].map((c) => caseMap(c, false)).join("") : a;
  // Same for the second string.
  const y = nocase ? [...b].map((c) => caseMap(c, false)).join("") : b;
  // Compare 16-bit characters in order.
  const n = Math.min(x.length, y.length);
  // First difference decides.
  for (let i = 0; i < n; i++) {
    // Character codes.
    const d = x.charCodeAt(i) - y.charCodeAt(i);
    // Report the sign.
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  // Equal prefixes: the shorter string is smaller.
  return x.length === y.length ? 0 : x.length < y.length ? -1 : 1;
}

/** `string equal ?-nocase? a b`: 1 or 0. */
export function strEqual(a: string, b: string, nocase = false): number {
  // Equal means compare returns 0.
  return strCompare(a, b, nocase) === 0 ? 1 : 0;
}

/** `string match ?-nocase? pattern string`: 1 or 0. */
export function strMatch(pattern: string, s: string, nocase = false): number {
  // Glob semantics live in glob.ts.
  return globMatch(pattern, s, nocase) ? 1 : 0;
}
