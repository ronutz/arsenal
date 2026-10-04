// ============================================================================
// src/lib/tools/ascii-table/compute.ts
// ----------------------------------------------------------------------------
// THE ASCII TABLE, EXPLAINED. Every one of the 128 codes with:
//
//   * its number in decimal, hexadecimal, octal and binary, and its
//     column/row position in the original table (RFC 20: "K" is 4/11);
//   * its names in three traditions: RFC 20 / USA Standard X3.4-1968
//     ("Slant", "Reverse Slant", "Overline"), Unicode 1.0 ("SLASH",
//     "BACKSLASH") and Unicode 18.0.0 ("SOLIDUS", "REVERSE SOLIDUS"), with the
//     ISO 6429 control names Unicode keeps as formal aliases;
//   * how to write it in C, JSON, JavaScript, Python, Tcl (iRules), HTML and a
//     URL, each from its own specification;
//   * which languages and formats treat it as white space, measured, not
//     assumed: Python counts FS, GS, RS and US as white space, JSON does not
//     count VT or FF, the WHATWG definition leaves out VT;
//   * the bit patterns that explain the layout: upper and lower case differ in
//     one bit (0x20), digits are 0x30 plus their value, and a control is the
//     character 64 positions above it with the top bits cleared (caret
//     notation, ^A for 1).
//
// A look-up box accepts the code in any of those notations (65, 0x41, 0o101,
// 0b1000001, 4/1, U+0041, &#65;, &#x41;, &excl;, %41, \x41, \101, \n, ^A,
// NUL, a character, a Unicode name) and says when something is NOT ASCII:
// &tilde; is U+02DC SMALL TILDE and &minus; is U+2212 MINUS SIGN, not the
// characters 126 and 45, which have no named reference at all.
//
// Sources (all read 2026-10-03): RFC 20; Unicode 18.0.0 UnicodeData.txt and
// NameAliases.txt; WHATWG HTML entities.json and the numeric character
// reference end state; ISO/IEC 9899:2011 (N1570) 6.4.4.4 and 7.4.1.10;
// RFC 8259; ECMA-262; the Python language reference; the Tcl 8.4 manual;
// RFC 3986; WHATWG Infra; RFC 5234. Local and deterministic.
// ============================================================================

import { ASCII, type AsciiCode } from "./data";
import { HTML_ENTITIES } from "@/lib/unicode/html-entities";
import { hiddenClass, hiddenName, codePointLabel, ASCII_LOOKALIKE } from "@/lib/unicode/hidden";
import { asciiPrototype, asciiSharing, ASCII_SKELETON } from "@/lib/unicode/confusables";

/**
 * The full Unicode name data, passed in rather than imported: src/lib/unicode/names.ts is about a
 * megabyte, so the API entry point (index.ts) and the vectors pass it, and the page passes it once
 * its dynamic import has loaded. Without it, names come from the small hidden-character table.
 */
export interface NameData {
  // The Name property of a code point (undefined for controls and unassigned code points).
  nameOf: (cp: number) => string | undefined;
  // The first formal alias of a code point (controls are named only by aliases).
  aliasOf: (cp: number) => string | undefined;
  // The code point a name or alias stands for, matched loosely (UAX #44, UAX44-LM2).
  cpOf: (name: string) => number | undefined;
}

/** The kind of code, for filters and colouring. */
export type AsciiKind = "control" | "space" | "digit" | "upper" | "lower" | "punct" | "delete";

/** Where a character stands in RFC 3986. */
export type UrlClass = "unreserved" | "gen-delim" | "sub-delim" | "other";

/** The languages and formats whose white space is compared. */
export const WHITESPACE_SETS = ["c", "json", "whatwg", "abnf", "tcl", "python", "javascript"] as const;

/** One of the white-space definitions. */
export type WhitespaceSet = (typeof WHITESPACE_SETS)[number];

/**
 * The codes each definition treats as white space. Measured on 2026-10-03:
 * C isspace() in the "C" locale (gcc, N1570 7.4.1.10), Python str.isspace(),
 * JavaScript /\s/ and trim() in Node, and Tcl 8.4.6 script parsing (which code
 * separates the words of a command); JSON, WHATWG and ABNF from their text.
 */
export const WHITESPACE: Readonly<Record<WhitespaceSet, readonly number[]>> = {
  // N1570 7.4.1.10: space, form feed, new-line, carriage return, horizontal tab, vertical tab.
  c: [9, 10, 11, 12, 13, 32],
  // RFC 8259 section 2: space, horizontal tab, line feed, carriage return.
  json: [9, 10, 13, 32],
  // WHATWG Infra: TAB, LF, FF, CR, SPACE (no VT).
  whatwg: [9, 10, 12, 13, 32],
  // RFC 5234 B.1: WSP = SP / HTAB.
  abnf: [9, 32],
  // Tcl 8.4.6: words are separated by these; newline ends the command instead.
  tcl: [9, 11, 12, 13, 32],
  // Python str.isspace(): bidi classes WS, B, S also take in FS, GS, RS and US.
  python: [9, 10, 11, 12, 13, 28, 29, 30, 31, 32],
  // JavaScript WhiteSpace and LineTerminator (ECMA-262), as /\s/ and trim() see them.
  javascript: [9, 10, 11, 12, 13, 32],
};

/** How one language writes a character inside a string (or why it needs nothing). */
export interface EscapeForm {
  // The text to write.
  text: string;
  // "simple": a named escape; "numeric": a code escape; "plain": the character itself; "required": must be escaped.
  how: "simple" | "numeric" | "plain";
  // An extra remark key (for example the C hex-escape pitfall, or JSON's must-escape rule).
  note?: string;
}

/** Everything the page shows about one code. */
export interface AsciiDetail {
  // The data row.
  row: AsciiCode;
  // Its kind.
  kind: AsciiKind;
  // Decimal, hexadecimal, octal and binary forms.
  dec: string;
  hex: string;
  oct: string;
  bin7: string;
  bin8: string;
  // RFC 20 column/row ("4/11").
  columnRow: string;
  // Caret notation for controls (^@ to ^_, ^? for DEL).
  caret?: string;
  // The printable character a control is paired with in caret notation.
  caretOf?: string;
  // The letter of the other case, for letters.
  otherCase?: string;
  // The value of a digit.
  digitValue?: number;
  // Escapes by language.
  escapes: Record<"c" | "json" | "javascript" | "python" | "tcl", EscapeForm>;
  // HTML references: decimal, hexadecimal, named, and the parse-error note for controls.
  html: { dec: string; hex: string; named: string[]; note?: "null" | "control" };
  // URL: the percent-encoding and the RFC 3986 class.
  url: { encoded: string; cls: UrlClass };
  // Which definitions count it as white space.
  whitespace: WhitespaceSet[];
  // Unicode notation.
  unicode: string;
  // The code reached by flipping each bit, b1 (value 1) to b7 (value 64).
  flips: number[];
  // UTS #39: the prototype this character shares with other ASCII text it is confusable with.
  confusable?: { prototype: string; with: string[] };
}

/** The ASCII text a printable ASCII character is confusable with under UTS #39 (1, I, l and | share "l"). */
function confusableOf(code: number): AsciiDetail["confusable"] {
  // Printable characters only.
  if (code < 33 || code > 126) return undefined;
  // The character.
  const ch = String.fromCharCode(code);
  // Its prototype (itself when confusables.txt gives it none).
  const prototype = ASCII_SKELETON[ch] ?? ch;
  // The other single characters with the same prototype.
  const others = asciiSharing(prototype).filter((x) => x !== ch);
  // A prototype of two or more characters is itself confusable text ("rn" for m, two apostrophes for ").
  const all = prototype.length > 1 ? [...others, prototype] : others;
  // Nothing shares it.
  return all.length ? { prototype, with: all } : undefined;
}

/** RFC 3986 2.2: gen-delims. */
const GEN_DELIMS = new Set(":/?#[]@");

/** RFC 3986 2.2: sub-delims. */
const SUB_DELIMS = new Set("!$&'()*+,;=");

/** N1570 6.4.4.4 simple escape sequences, by code. */
const C_SIMPLE: Record<number, string> = { 7: "\\a", 8: "\\b", 12: "\\f", 10: "\\n", 13: "\\r", 9: "\\t", 11: "\\v", 39: "\\'", 34: '\\"', 63: "\\?", 92: "\\\\" };

/** RFC 8259 section 7 two-character escapes, by code. */
const JSON_SIMPLE: Record<number, string> = { 34: '\\"', 92: "\\\\", 8: "\\b", 12: "\\f", 10: "\\n", 13: "\\r", 9: "\\t" };

/** ECMA-262 SingleEscapeCharacter escapes, by code. */
const JS_SIMPLE: Record<number, string> = { 39: "\\'", 34: '\\"', 92: "\\\\", 8: "\\b", 12: "\\f", 10: "\\n", 13: "\\r", 9: "\\t", 11: "\\v" };

/** Python string-literal escapes, by code (language reference 2.5.4). */
const PY_SIMPLE: Record<number, string> = { 92: "\\\\", 39: "\\'", 34: '\\"', 7: "\\a", 8: "\\b", 12: "\\f", 10: "\\n", 13: "\\r", 9: "\\t", 11: "\\v" };

/** Tcl 8.4 backslash substitutions (Tcl.n), by code; $ [ ] need a backslash in a quoted word. */
const TCL_SIMPLE: Record<number, string> = { 7: "\\a", 8: "\\b", 12: "\\f", 10: "\\n", 13: "\\r", 9: "\\t", 11: "\\v", 92: "\\\\", 34: '\\"', 36: "\\$", 91: "\\[", 93: "\\]" };

/** Two hexadecimal digits, upper case. */
const hex2 = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");

/** Three octal digits. */
const oct3 = (n: number) => n.toString(8).padStart(3, "0");

/** The kind of a code. */
export function kindOf(code: number): AsciiKind {
  // Controls 0-31.
  if (code < 32) return "control";
  // Space.
  if (code === 32) return "space";
  // DEL.
  if (code === 127) return "delete";
  // Digits.
  if (code >= 48 && code <= 57) return "digit";
  // Upper case letters.
  if (code >= 65 && code <= 90) return "upper";
  // Lower case letters.
  if (code >= 97 && code <= 122) return "lower";
  // Everything else is punctuation and symbols.
  return "punct";
}

/** Where a code stands in RFC 3986. */
export function urlClass(code: number): UrlClass {
  // The character.
  const ch = String.fromCharCode(code);
  // ALPHA / DIGIT / "-" / "." / "_" / "~" (2.3).
  if (/[A-Za-z0-9\-._~]/.test(ch) && code > 32 && code < 127) return "unreserved";
  // gen-delims (2.2).
  if (GEN_DELIMS.has(ch)) return "gen-delim";
  // sub-delims (2.2).
  if (SUB_DELIMS.has(ch)) return "sub-delim";
  // Controls, space, DEL and " % < > \ ^ ` { | } appear in a URI only percent-encoded.
  return "other";
}

/** Everything about one code. */
export function detail(code: number): AsciiDetail {
  // The data row.
  const row = ASCII[code];
  // Its kind.
  const kind = kindOf(code);
  // Control or DEL.
  const isControl = kind === "control" || kind === "delete";
  // Caret notation: ^ and the character 64 above (^@ to ^_), and ^? for DEL.
  const caret = code < 32 ? "^" + String.fromCharCode(code + 64) : code === 127 ? "^?" : undefined;
  // The escapes.
  const escapes: AsciiDetail["escapes"] = {
    // C: a simple escape, else three octal digits for a control (hex escapes run on through every following hex digit).
    c: C_SIMPLE[code] ? { text: C_SIMPLE[code], how: "simple" } : isControl ? { text: code === 0 ? "\\0" : "\\" + oct3(code), how: "numeric", note: "c-octal" } : { text: String.fromCharCode(code), how: "plain" },
    // JSON: two-character escapes, \u00XX for the other controls (which must be escaped); DEL may stay as it is.
    json: JSON_SIMPLE[code] ? { text: JSON_SIMPLE[code], how: "simple", note: "json-must" } : code < 32 ? { text: "\\u00" + hex2(code), how: "numeric", note: "json-must" } : code === 47 ? { text: "/", how: "plain", note: "json-solidus" } : code === 127 ? { text: String.fromCharCode(127), how: "plain", note: "json-del" } : { text: String.fromCharCode(code), how: "plain" },
    // JavaScript: single escapes, \0 for NUL (not before a digit), \xHH for the other controls.
    javascript: JS_SIMPLE[code] ? { text: JS_SIMPLE[code], how: "simple" } : code === 0 ? { text: "\\0", how: "simple", note: "js-nul" } : isControl ? { text: "\\x" + hex2(code), how: "numeric" } : { text: String.fromCharCode(code), how: "plain" },
    // Python: the escapes in the language reference, \xhh for the other controls.
    python: PY_SIMPLE[code] ? { text: PY_SIMPLE[code], how: "simple" } : isControl ? { text: "\\x" + hex2(code), how: "numeric" } : { text: String.fromCharCode(code), how: "plain" },
    // Tcl 8.4 (and iRules): backslash substitutions; $ [ ] " \ need a backslash inside a quoted word. Other
    // controls are written as three octal digits: Tcl 8.4's \x reads every hexadecimal digit that follows and
    // keeps the last two, so "\x1Bfoo" is not ESC and "foo" (tested in Tcl 8.4.6 on 2026-10-03).
    tcl: TCL_SIMPLE[code] ? { text: TCL_SIMPLE[code], how: "simple", note: code === 36 || code === 91 || code === 93 || code === 34 ? "tcl-quoted" : undefined } : isControl ? { text: "\\" + oct3(code), how: "numeric", note: "tcl-octal" } : { text: String.fromCharCode(code), how: "plain" },
  };
  // HTML numeric references, and the WHATWG parse errors for NUL and other non-white-space controls (and CR).
  const html: AsciiDetail["html"] = { dec: `&#${code};`, hex: `&#x${code.toString(16).toUpperCase()};`, named: row.html ? [...row.html] : [], note: code === 0 ? "null" : isControl && (code === 13 || ![9, 10, 12, 32].includes(code)) ? "control" : undefined };
  // The detail.
  return {
    row,
    kind,
    dec: String(code),
    hex: "0x" + hex2(code),
    oct: "0o" + oct3(code),
    bin7: code.toString(2).padStart(7, "0"),
    bin8: code.toString(2).padStart(8, "0"),
    columnRow: `${code >> 4}/${code & 15}`,
    caret,
    caretOf: code < 32 ? String.fromCharCode(code + 64) : code === 127 ? "?" : undefined,
    otherCase: kind === "upper" ? String.fromCharCode(code | 0x20) : kind === "lower" ? String.fromCharCode(code & ~0x20) : undefined,
    digitValue: kind === "digit" ? code - 48 : undefined,
    escapes,
    html,
    url: { encoded: "%" + hex2(code), cls: urlClass(code) },
    whitespace: WHITESPACE_SETS.filter((s) => WHITESPACE[s].includes(code)),
    unicode: codePointLabel(code),
    flips: [0, 1, 2, 3, 4, 5, 6].map((b) => code ^ (1 << b)),
    confusable: confusableOf(code),
  };
}

// ---------------------------------------------------------------------------
// Look-up: any notation in, a code (or a reason it is not ASCII) out
// ---------------------------------------------------------------------------

/** What a look-up found. */
export type LookupResult =
  // An ASCII code, and the notation it was read in.
  | { kind: "ascii"; code: number; readAs: string }
  // A character outside ASCII, named.
  // (lookalike: its compatibility decomposition when that is ASCII; prototype: the ASCII text UTS #39 says it is confusable with).
  | { kind: "outside"; cp: number; label: string; name?: string; nameKind?: "name" | "alias"; hidden?: string; lookalike?: string; prototype?: string; readAs: string }
  // Nothing recognised.
  | { kind: "unknown" };

/** Named escapes accepted in the look-up box (the ones C, JSON, JavaScript, Python and Tcl share, plus \e for ESC, which none of the standards above defines but which people type). */
const BACKSLASH_NAMED: Record<string, number> = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, e: 27, "0": 0 };

/** An abbreviation or control name, upper case, to its code. */
const BY_ABBR = new Map<string, number>();

// Fill the abbreviation and control-name index once.
for (const r of ASCII) {
  // The abbreviation and its aliases.
  for (const a of [r.abbr, ...(r.abbrAliases ?? [])]) if (a) BY_ABBR.set(a.toUpperCase(), r.code);
  // The Unicode name, the control aliases and the Unicode 1.0 name.
  for (const n of [r.name, ...(r.aliases ?? []), r.unicode1]) if (n) BY_ABBR.set(n.toUpperCase(), r.code);
  // The RFC 20 name.
  if (r.rfc20) BY_ABBR.set(r.rfc20.name.toUpperCase(), r.code);
}

/** The name of a code point outside ASCII, and whether it is the name or an alias. */
function nameOutside(cp: number, names?: NameData): { name?: string; nameKind?: "name" | "alias" } {
  // The Name property, from the full table when it is loaded, else the small table.
  const name = names ? names.nameOf(cp) : hiddenName(cp);
  // A name.
  if (name) return { name, nameKind: "name" };
  // Controls have only aliases.
  const alias = names?.aliasOf(cp);
  // An alias, or nothing.
  return alias ? { name: alias, nameKind: "alias" } : {};
}

/** Build the result for a code point found by a notation. */
function found(cp: number, readAs: string, names?: NameData): LookupResult {
  // Beyond the last Unicode code point: nothing.
  if (!(cp >= 0 && cp <= 0x10ffff)) return { kind: "unknown" };
  // Inside ASCII.
  if (cp >= 0 && cp <= 127) return { kind: "ascii", code: cp, readAs };
  // Outside: name it, and say whether it hides or imitates ASCII.
  return { kind: "outside", cp, label: codePointLabel(cp), ...nameOutside(cp, names), hidden: hiddenClass(cp) ?? undefined, lookalike: ASCII_LOOKALIKE.get(cp), prototype: asciiPrototype(cp), readAs };
}

/** Read the look-up box (names: the full name data, when loaded). */
export function lookup(raw: string, names?: NameData): LookupResult {
  // Bounded input.
  if (raw.length > 200) return { kind: "unknown" };
  // Leading and trailing white space is ignored (a lone space is looked up as the space).
  const s = raw === " " ? raw : raw.trim();
  // Nothing.
  if (s === "") return { kind: "unknown" };
  // A single character (or one code point outside the BMP).
  if ([...s].length === 1) return found(s.codePointAt(0)!, "character", names);
  // A quoted character: 'A' or "A".
  let m = /^(['"])(.)\1$/u.exec(s);
  // Quoted.
  if (m) return found(m[2].codePointAt(0)!, "character", names);
  // Seven or eight binary digits on their own are read as bits, not as a decimal number.
  m = /^([01]{7,8})$/.exec(s);
  // Bits.
  if (m) return found(parseInt(m[1], 2), "binary", names);
  // Decimal.
  if (/^\d{1,7}$/.test(s)) return found(parseInt(s, 10), "decimal", names);
  // Hexadecimal: 0x41, 41h, x41.
  m = /^(?:0x|x)([0-9a-f]{1,6})$/i.exec(s) ?? /^([0-9a-f]{1,6})h$/i.exec(s);
  // Hex.
  if (m) return found(parseInt(m[1], 16), "hexadecimal", names);
  // Octal: 0o101.
  m = /^0o([0-7]{1,8})$/i.exec(s);
  // Octal.
  if (m) return found(parseInt(m[1], 8), "octal", names);
  // Binary with its prefix: 0b1000001.
  m = /^0b([01]{1,21})$/i.exec(s);
  // Binary.
  if (m) return found(parseInt(m[1], 2), "binary", names);
  // Column/row: 4/11.
  m = /^([0-7])\/(1[0-5]|[0-9])$/.exec(s);
  // RFC 20 position.
  if (m) return found(parseInt(m[1], 10) * 16 + parseInt(m[2], 10), "column-row", names);
  // Unicode notation: U+0041, U+1F600.
  m = /^u\+([0-9a-f]{1,6})$/i.exec(s);
  // Unicode.
  if (m) return found(parseInt(m[1], 16), "unicode", names);
  // HTML numeric references: &#65; &#x41;
  m = /^&#(\d{1,7});?$/.exec(s);
  // Decimal reference.
  if (m) return found(parseInt(m[1], 10), "html-decimal", names);
  // Hex reference.
  m = /^&#x([0-9a-f]{1,6});?$/i.exec(s);
  // Hex reference.
  if (m) return found(parseInt(m[1], 16), "html-hex", names);
  // HTML named references (WHATWG): &excl; &tilde;
  m = /^&([A-Za-z][A-Za-z0-9]{0,40});?$/.exec(s);
  // Named reference.
  if (m) {
    // With the semicolon.
    const cps = HTML_ENTITIES.get(m[1]);
    // One code point only (a few references stand for two).
    if (cps && cps.length === 1) return found(cps[0], "html-named", names);
  }
  // Percent-encoding: %41.
  m = /^%([0-9a-f]{2})$/i.exec(s);
  // Percent.
  if (m) return found(parseInt(m[1], 16), "percent", names);
  // Backslash escapes: \n \x41 A \u{1F600} \101 \U0001F600
  m = /^\\(?:x([0-9a-f]{1,2})|u\{([0-9a-f]{1,6})\}|u([0-9a-f]{4})|U([0-9a-f]{8})|([0-7]{1,3})|([abtnvfre0]))$/i.exec(s);
  // An escape.
  if (m) {
    // \xHH.
    if (m[1]) return found(parseInt(m[1], 16), "escape-hex", names);
    // \u{...}, \uHHHH, \UHHHHHHHH.
    if (m[2] || m[3] || m[4]) return found(parseInt(m[2] ?? m[3] ?? m[4], 16), "escape-unicode", names);
    // Octal.
    if (m[5]) return found(parseInt(m[5], 8), "escape-octal", names);
    // A named escape.
    return found(BACKSLASH_NAMED[m[6]], "escape-named", names);
  }
  // Caret notation: ^A, ^[, ^?
  m = /^\^([@A-Z[\\\]^_?a-z])$/.exec(s);
  // Caret.
  if (m) return found(m[1] === "?" ? 127 : m[1].toUpperCase().charCodeAt(0) - 64, "caret", names);
  // An abbreviation or a name.
  const byName = BY_ABBR.get(s.toUpperCase().replace(/\s+/g, " "));
  // Named.
  if (byName !== undefined) return found(byName, "name", names);
  // Any other Unicode name or alias, when the full table is loaded (EN DASH, MINUS SIGN, BOM).
  const byUnicodeName = names?.cpOf(s);
  // Named outside ASCII.
  if (byUnicodeName !== undefined) return found(byUnicodeName, "name", names);
  // Not recognised.
  return { kind: "unknown" };
}

// ---------------------------------------------------------------------------
// Text: every character, ASCII or not
// ---------------------------------------------------------------------------

/** One character of a text. */
export interface TextChar {
  // The character as text.
  char: string;
  // Its code point.
  cp: number;
  // True for ASCII.
  ascii: boolean;
  // U+XXXX.
  label: string;
  // Hexadecimal value (ASCII) or UTF-8 bytes (outside).
  bytes: string;
  // For non-ASCII: the Unicode name (or a control's alias), its hiding class, the ASCII it imitates.
  name?: string;
  // Whether that is the name or an alias.
  nameKind?: "name" | "alias";
  // The hiding class (invisible, space, quote, dash, lookalike).
  hidden?: string;
  // Its compatibility decomposition, when that is ASCII.
  lookalike?: string;
  // The ASCII text UTS #39 says it is confusable with.
  prototype?: string;
}

/** Read a text character by character (at most 2,000 characters). */
export function analyzeText(text: string, names?: NameData): { chars: TextChar[]; ascii: number; outside: number; truncated: boolean } {
  // The code points.
  const all = [...text];
  // Bounded.
  const list = all.slice(0, 2000);
  // Each one.
  const chars = list.map((ch): TextChar => {
    // The code point.
    const cp = ch.codePointAt(0)!;
    // ASCII.
    if (cp <= 127) return { char: ch, cp, ascii: true, label: codePointLabel(cp), bytes: hex2(cp) };
    // Outside: UTF-8 bytes, name, hiding class, lookalike.
    const utf8 = Array.from(new TextEncoder().encode(ch), (b) => hex2(b)).join(" ");
    // The row.
    return { char: ch, cp, ascii: false, label: codePointLabel(cp), bytes: utf8, ...nameOutside(cp, names), hidden: hiddenClass(cp) ?? undefined, lookalike: ASCII_LOOKALIKE.get(cp), prototype: asciiPrototype(cp) };
  });
  // Totals.
  const ascii = chars.filter((c) => c.ascii).length;
  // Done.
  return { chars, ascii, outside: chars.length - ascii, truncated: all.length > list.length };
}

// ---------------------------------------------------------------------------
// The registry-facing entry point
// ---------------------------------------------------------------------------

/** What the tool takes. */
export type AsciiTableInput =
  // Look up one value in any notation.
  | { mode: "lookup"; value: string }
  // Read a text.
  | { mode: "text"; text: string }
  // List the table, optionally one kind.
  | { mode: "table"; kind?: AsciiKind | "agree" };

/** What it returns. */
export type AsciiTableResult =
  // A look-up, with the detail when the value is ASCII.
  | { mode: "lookup"; result: LookupResult; detail?: AsciiDetail }
  // A text.
  | ({ mode: "text" } & ReturnType<typeof analyzeText>)
  // The table.
  | { mode: "table"; codes: number[] };

/** Run the tool (names: the full name data; index.ts and the vectors always pass it). */
export function run(input: AsciiTableInput, names?: NameData): AsciiTableResult {
  // By mode.
  switch (input.mode) {
    // A value.
    case "lookup": {
      // Read it.
      const result = lookup(input.value ?? "", names);
      // With the detail for ASCII.
      return { mode: "lookup", result, detail: result.kind === "ascii" ? detail(result.code) : undefined };
    }
    // A text.
    case "text":
      // Character by character.
      return { mode: "text", ...analyzeText(input.text ?? "", names) };
    // The table.
    case "table": {
      // All codes, or one kind, or the positions RFC 20 note 3 marks.
      const codes = ASCII.filter((r) => !input.kind || (input.kind === "agree" ? !!r.rfc20?.agree : kindOf(r.code) === input.kind)).map((r) => r.code);
      // Done.
      return { mode: "table", codes };
    }
  }
}
