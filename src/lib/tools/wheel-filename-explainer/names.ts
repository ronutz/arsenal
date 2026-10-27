// ============================================================================
// src/lib/tools/wheel-filename-explainer/names.ts
// ----------------------------------------------------------------------------
// Project names, extra names and Python identifiers, as the Python Packaging
// User Guide defines them. Shared by the wheel filename explainer and the
// pyproject.toml explainer (which imports this module).
//
// THE RULES (all read 2026-10-27):
//   - Names and normalization (packaging.python.org/en/latest/specifications/
//     name-normalization/): "A valid name consists only of ASCII letters and
//     numbers, period, underscore and hyphen. It must start and end with a
//     letter or number" (regex ^([A-Z0-9]|[A-Z0-9][A-Z0-9._-]*[A-Z0-9])\Z,
//     case-insensitive); the normalized form is lower case with "all runs of
//     the characters ., -, or _ replaced with a single - character".
//   - Binary distribution format, "Escaping and Unicode": in a wheel file name
//     the distribution is the normalized name with "-" replaced by "_"; tools
//     consuming wheels "must be prepared to accept . (FULL STOP) and uppercase
//     letters" from the earlier version of the rule.
//   - Core metadata, Provides-Extra (2.3 and later, PEP 685): a valid extra is
//     ^[a-z0-9]+(-[a-z0-9]+)*$; older metadata normalizes extras like names.
//   - Entry points specification: each dotted part of an object reference is
//     "a valid Python identifier"; Python's own rule is XID_Start or "_", then
//     XID_Continue (Python language reference, Identifiers and keywords). The
//     check here uses the Unicode tables of the JavaScript engine running it,
//     which may be a different Unicode version from a given CPython's.
//
// Every function is a plain character loop or one anchored pattern of single
// character classes (linear time, no backtracking): ReDoS-safe.
// ============================================================================

/**
 * Is the character an ASCII letter or digit?
 * @param c one UTF-16 code unit as a string
 * @returns true for A-Z, a-z, 0-9
 */
export function isAsciiAlnum(c: string): boolean {
  // Compare code points: digits, upper case, lower case.
  const n = c.charCodeAt(0); // the code unit
  return (n >= 48 && n <= 57) || (n >= 65 && n <= 90) || (n >= 97 && n <= 122); // 0-9, A-Z, a-z
} // isAsciiAlnum

/**
 * Lower-case ASCII letters only; every other character is kept as it is (so the length never changes).
 * @param s any text
 * @returns the text with A-Z turned into a-z
 */
export function asciiLower(s: string): string {
  // One pass; String.prototype.toLowerCase is avoided because it also maps non-ASCII letters (and can change length).
  let out = ""; // the result
  for (let i = 0; i < s.length; i++) { // each code unit
    const n = s.charCodeAt(i); // its value
    out += n >= 65 && n <= 90 ? String.fromCharCode(n + 32) : s[i]; // A-Z lowered, the rest copied
  } // characters
  return out; // the lowered text
} // asciiLower

/** Why a project name is not valid, as a stable code (the component words it). */
export type NameProblem =
  | "empty" // no characters at all
  | "bad-character" // a character other than ASCII letters, digits, ".", "_", "-"
  | "bad-start" // starts with ".", "_" or "-"
  | "bad-end"; // ends with ".", "_" or "-"

/** The verdict on one project name. */
export interface NameCheck {
  /** True when the name matches the name format. */
  valid: boolean;
  /** The first problem found, when not valid. */
  problem: NameProblem | null;
  /** 0-based index of the offending character (or -1). */
  at: number;
  /** The normalized form (lower case, runs of ., - and _ as one "-"); computed even for an invalid name. */
  normalized: string;
} // NameCheck

/**
 * Normalize a project name (or a dependency group name): lower case, every run of ".", "-" or "_" as one "-".
 * @param name the name as written
 * @returns the normalized name
 */
export function normalizeName(name: string): string {
  // Walk once; a run of separators becomes a single hyphen.
  let out = ""; // the result
  let inRun = false; // inside a run of separators
  for (const ch of asciiLower(name)) { // each character, ASCII letters lowered
    if (ch === "." || ch === "-" || ch === "_") { // a separator
      if (!inRun) out += "-"; // the first of a run writes one hyphen
      inRun = true; // and the rest of the run writes nothing
    } else { // any other character
      out += ch; // copied
      inRun = false; // the run, if any, has ended
    } // separator or not
  } // characters
  return out; // the normalized name
} // normalizeName

/**
 * Check a project name against the name format.
 * @param name the name as written
 * @returns the verdict, the first problem and the normalized form
 */
export function checkName(name: string): NameCheck {
  // Collect the normalized form first: it is shown even for an invalid name.
  const normalized = normalizeName(name); // the comparison form
  if (name.length === 0) return { valid: false, problem: "empty", at: -1, normalized }; // nothing
  for (let i = 0; i < name.length; i++) { // each character
    const c = name[i]; // the character
    if (!isAsciiAlnum(c) && c !== "." && c !== "_" && c !== "-") return { valid: false, problem: "bad-character", at: i, normalized }; // outside the set
  } // characters
  if (!isAsciiAlnum(name[0])) return { valid: false, problem: "bad-start", at: 0, normalized }; // must start with a letter or digit
  if (!isAsciiAlnum(name[name.length - 1])) return { valid: false, problem: "bad-end", at: name.length - 1, normalized }; // and end with one
  return { valid: true, problem: null, at: -1, normalized }; // a valid name
} // checkName

/**
 * The form a wheel or sdist file name uses for the distribution: the normalized name with "-" replaced by "_".
 * @param name the project name
 * @returns the escaped name
 */
export function wheelEscapedName(name: string): string {
  // Binary distribution format, "Escaping and Unicode".
  return normalizeName(name).replace(/-/g, "_"); // hyphens become underscores
} // wheelEscapedName

/**
 * Is the text a valid extra name under core metadata 2.3 and later (^[a-z0-9]+(-[a-z0-9]+)*$)?
 * @param extra the extra name as written
 * @returns true when it needs no normalization
 */
export function isStrictExtraName(extra: string): boolean {
  // Lower-case letters and digits, single hyphens between runs of them.
  if (extra.length === 0) return false; // empty is not valid
  for (let i = 0; i < extra.length; i++) { // each character
    const c = extra[i]; // the character
    const lowerAlnum = (c >= "a" && c <= "z") || (c >= "0" && c <= "9"); // a-z or 0-9
    if (c === "-") { // a hyphen
      if (i === 0 || i === extra.length - 1 || extra[i - 1] === "-") return false; // not first, not last, never doubled
    } else if (!lowerAlnum) return false; // anything else is refused
  } // characters
  return true; // valid
} // isStrictExtraName

// One identifier: XID_Start or "_", then XID_Continue. Anchored, two single classes: linear (ReDoS-safe).
const IDENTIFIER = /^[\p{XID_Start}_][\p{XID_Continue}]*$/u; // Python's identifier shape

/**
 * Is the text one Python identifier (no dots)?
 * @param s the text
 * @returns true when it has the shape of an identifier
 */
export function isIdentifier(s: string): boolean {
  // The pattern carries the whole rule.
  return IDENTIFIER.test(s); // anchored match
} // isIdentifier

/**
 * Is the text a dotted name whose every part is an identifier (a.b.c)?
 * @param s the text
 * @returns true when every dot-separated part is an identifier
 */
export function isDottedIdentifier(s: string): boolean {
  // Split on dots; each part must be an identifier (an empty part fails).
  return s.length > 0 && s.split(".").every((p) => isIdentifier(p)); // every part
} // isDottedIdentifier

/**
 * Drop spaces (U+0020 only) from both ends, with two index walks (no regular expression).
 * @param s the text
 * @returns the text without leading or trailing spaces
 */
export function trimSpaces(s: string): string {
  // Move the two ends inwards past spaces.
  let a = 0; // first kept index
  let b = s.length; // one past the last kept index
  while (a < b && s[a] === " ") a++; // leading spaces
  while (b > a && s[b - 1] === " ") b--; // trailing spaces
  return s.slice(a, b); // the middle
} // trimSpaces

/** The result of reading an object reference ("module.path:object.attr"). */
export interface ObjectReference {
  /** True when both parts are dotted identifiers. */
  valid: boolean;
  /** The module part, before the colon. */
  module: string;
  /** The object part after the colon, or null when there is no colon. */
  object: string | null;
} // ObjectReference

/**
 * Read an object reference as the entry points specification and PEP 517 define it:
 * importable.module or importable.module:object.attr, every part an identifier. Spaces around the colon are accepted
 * only when asked (the entry points specification tells readers of entry_points.txt to accept and ignore them; PEP
 * 517's build-backend grammar has no spaces).
 * @param ref the reference as written
 * @param allowSpaces true to ignore spaces around the colon and at the ends
 * @returns its parts and whether it is valid
 */
export function parseObjectReference(ref: string, allowSpaces = false): ObjectReference {
  // Split once at the first colon.
  const colon = ref.indexOf(":"); // where the object part starts
  const rawModule = colon < 0 ? ref : ref.slice(0, colon); // the module path as written
  const rawObject = colon < 0 ? null : ref.slice(colon + 1); // the object path as written, if any
  const module = allowSpaces ? trimSpaces(rawModule) : rawModule; // spaces dropped only when allowed
  const object = rawObject === null ? null : allowSpaces ? trimSpaces(rawObject) : rawObject; // the same for the object part
  const valid = isDottedIdentifier(module) && (object === null || isDottedIdentifier(object)); // both parts well formed
  return { valid, module, object }; // the reading
} // parseObjectReference
