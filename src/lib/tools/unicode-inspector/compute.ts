// ============================================================================
// src/lib/tools/unicode-inspector/compute.ts
// ----------------------------------------------------------------------------
// THE UNICODE INSPECTOR: what is really in a piece of text, one code point at a
// time, and what each code point is.
//
//   Inspect a text   counts (code points, UTF-16 units, UTF-8 bytes, lines),
//                    every code point with its name and flags, and the ones
//                    that hide or deceive: bidirectional controls (the Trojan
//                    Source characters, with any left open at the end of a
//                    line), invisible characters, controls, line breaks other
//                    than LF and CR, non-ASCII spaces, quotes and dashes,
//                    characters UTS #39 lists as confusable with ASCII, words
//                    that mix scripts, private-use, noncharacter, unassigned
//                    and surrogate code points. A cleaned copy and the text
//                    written as escapes in eight languages come with it.
//   One code point   its name, aliases, General_Category, block, script and
//                    Script_Extensions, the version that added it, UTF-8,
//                    UTF-16 and UTF-32, escapes in nine forms and every flag.
//   Find by name     every code point whose name or alias has words starting
//                    with the words typed.
//
// Data: the Unicode Character Database 18.0.0 (src/lib/unicode/*), UTS #39
// confusables 18.0.0, WHATWG named references. The full name table is about a
// megabyte, so it is passed in (UnicodeData) by index.ts and by the page once
// loaded; without it, names come from the small table of hidden characters.
// Deterministic and local.
// ============================================================================

import { generalCategory, blockOf, ageOf, scriptOf, scriptExtensionsOf, SCRIPT_CODE } from "@/lib/unicode/props";
import { hiddenName, codePointLabel, inRanges, DEFAULT_IGNORABLE, WHITE_SPACE, QUOTATION_MARK, DASH, ASCII_LOOKALIKE } from "@/lib/unicode/hidden";
import { asciiPrototype, asciiSharing, isBidiControl } from "@/lib/unicode/confusables";
import { namedReferencesFor } from "@/lib/unicode/html-entities";
import { lookup, type NameData } from "@/lib/tools/ascii-table/compute";

/** The full Unicode data the page loads lazily: names, aliases and name search. */
export interface UnicodeData extends NameData {
  // Every formal alias of a code point.
  aliases: (cp: number) => { alias: string; type: string }[];
  // Code points whose name or alias has words starting with these words.
  search: (words: string[], limit: number) => number[];
}

/** What can be said about a code point, in the order the page lists it. */
export type Flag =
  | "bidi" | "invisible" | "control" | "line-break" | "surrogate" | "noncharacter" | "private-use" | "unassigned" | "replacement"
  | "space" | "quote" | "dash" | "confusable" | "compat-ascii" | "combining" | "format" | "ascii";

/** The flags that make a code point a finding in a text (the others only describe it). */
export const FINDING_FLAGS: readonly Flag[] = ["bidi", "invisible", "control", "line-break", "surrogate", "noncharacter", "private-use", "unassigned", "replacement", "space", "quote", "dash", "confusable", "compat-ascii"];

/** The escape forms the page shows for one code point. */
export type EscapeStyle = "json" | "javascript" | "python" | "html" | "css" | "url" | "c" | "tcl";

/** The escape styles, in display order. */
export const ESCAPE_STYLES: readonly EscapeStyle[] = ["json", "javascript", "python", "html", "css", "url", "c", "tcl"];

/** Everything about one code point. */
export interface CodePointInfo {
  // The code point.
  cp: number;
  // U+XXXX.
  label: string;
  // The Name property, or a control's first alias, or the code point label (<control-0085>).
  name?: string;
  // Which of the three the name is.
  nameKind?: "name" | "alias" | "label";
  // Every formal alias.
  aliases: { alias: string; type: string }[];
  // General_Category (two letters).
  gc: string;
  // Block.
  block: string;
  // Script (long name) and its four-letter code.
  script: string;
  scriptCode: string;
  // Script_Extensions (codes).
  scx: string[];
  // The version that assigned it ("Unassigned" otherwise).
  age: string;
  // UTF-8 bytes (absent for surrogates), UTF-16 code units and UTF-32, in hexadecimal.
  utf8?: string;
  utf16: string;
  utf32: string;
  // Escapes (absent where the form cannot express it).
  escapes: Partial<Record<EscapeStyle, string>>;
  // HTML references: decimal, hexadecimal and named, and why a numeric one does not give this code point.
  html: { dec: string; hex: string; named: string[]; note?: "null" | "surrogate" | "c1" | "control" | "noncharacter" };
  // What can be said about it.
  flags: Flag[];
  // UTS #39: the ASCII text it is confusable with, and the ASCII characters that share it.
  prototype?: string;
  sharing?: string[];
  // Its compatibility decomposition, when that is ASCII.
  compat?: string;
}

/** Four hexadecimal digits at least, upper case. */
const hex = (n: number, w = 4) => n.toString(16).toUpperCase().padStart(w, "0");

/** True for a noncharacter (U+FDD0..U+FDEF and the last two code points of every plane). */
export function isNoncharacter(cp: number): boolean {
  // The two kinds.
  return (cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe;
}

/** True for a surrogate code point. */
const isSurrogate = (cp: number) => cp >= 0xd800 && cp <= 0xdfff;

/** The line breaks other than LF and CR (LineBreak.txt: BK for VT, FF, LS, PS; NL for NEL). */
const OTHER_BREAKS = new Set([0x0b, 0x0c, 0x85, 0x2028, 0x2029]);

/** UTF-8 bytes of a code point (RFC 3629), or undefined for a surrogate. */
export function utf8Bytes(cp: number): number[] | undefined {
  // Surrogates cannot be encoded.
  if (isSurrogate(cp)) return undefined;
  // One byte.
  if (cp < 0x80) return [cp];
  // Two bytes.
  if (cp < 0x800) return [0xc0 | (cp >> 6), 0x80 | (cp & 0x3f)];
  // Three bytes.
  if (cp < 0x10000) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
  // Four bytes.
  return [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
}

/** UTF-16 code units of a code point (RFC 2781); a surrogate is its own unit. */
export function utf16Units(cp: number): number[] {
  // One unit.
  if (cp < 0x10000) return [cp];
  // A surrogate pair.
  const v = cp - 0x10000;
  // High, then low.
  return [0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff)];
}

/** The code point label of a code point with no name (Unicode core specification, 4.8). */
function labelOf(cp: number, gc: string): string {
  // The type.
  const type = gc === "Cc" ? "control" : gc === "Co" ? "private-use" : gc === "Cs" ? "surrogate" : isNoncharacter(cp) ? "noncharacter" : "reserved";
  // <type-XXXX>.
  return `<${type}-${hex(cp)}>`;
}

/** Every flag of a code point. */
export function flagsOf(cp: number, gc: string): Flag[] {
  // The flags found.
  const f: Flag[] = [];
  // Steers the bidirectional algorithm.
  if (isBidiControl(cp)) f.push("bidi");
  // Default_Ignorable_Code_Point: draws as nothing.
  if (inRanges(cp, DEFAULT_IGNORABLE)) f.push("invisible");
  // A control other than TAB, LF and CR (those are ordinary text).
  if (gc === "Cc" && cp !== 9 && cp !== 10 && cp !== 13 && !OTHER_BREAKS.has(cp)) f.push("control");
  // A line break other than LF and CR.
  if (OTHER_BREAKS.has(cp)) f.push("line-break");
  // Surrogates, noncharacters, private use, unassigned.
  if (gc === "Cs") f.push("surrogate");
  // Noncharacters.
  if (isNoncharacter(cp)) f.push("noncharacter");
  // Private use.
  if (gc === "Co") f.push("private-use");
  // Reserved.
  if (gc === "Cn" && !isNoncharacter(cp)) f.push("unassigned");
  // The replacement character: something failed to decode upstream.
  if (cp === 0xfffd) f.push("replacement");
  // Outside ASCII: spaces, quotes, dashes, lookalikes.
  if (cp > 0x7f) {
    // A space that is not the ASCII space (line breaks are reported as such).
    if (inRanges(cp, WHITE_SPACE) && !OTHER_BREAKS.has(cp)) f.push("space");
    // A quotation mark.
    if (inRanges(cp, QUOTATION_MARK)) f.push("quote");
    // A dash.
    if (inRanges(cp, DASH)) f.push("dash");
    // UTS #39 says it is confusable with ASCII text.
    if (asciiPrototype(cp) !== undefined) f.push("confusable");
    // Its compatibility decomposition is ASCII.
    if (ASCII_LOOKALIKE.has(cp)) f.push("compat-ascii");
  }
  // Combining marks (normal in many scripts; listed, not reported).
  if (gc === "Mn" || gc === "Mc" || gc === "Me") f.push("combining");
  // Other format characters not already counted.
  if (gc === "Cf" && !f.includes("bidi") && !f.includes("invisible")) f.push("format");
  // Plain ASCII.
  if (cp < 0x80 && f.length === 0) f.push("ascii");
  // Done.
  return f;
}

/** The escapes of one code point. */
export function escapesOf(cp: number): Partial<Record<EscapeStyle, string>> {
  // UTF-16 units, as \uXXXX each.
  const u16 = utf16Units(cp).map((u) => "\\u" + hex(u)).join("");
  // UTF-8 bytes.
  const b = utf8Bytes(cp);
  // The forms.
  return {
    // JSON (RFC 8259, section 7): \uXXXX, a surrogate pair beyond the BMP.
    json: u16,
    // JavaScript (ECMA-262): \uXXXX, or \u{...} beyond the BMP.
    javascript: cp < 0x10000 ? "\\u" + hex(cp) : "\\u{" + hex(cp, 1) + "}",
    // Python: \uXXXX, or \UXXXXXXXX beyond the BMP.
    python: cp < 0x10000 ? "\\u" + hex(cp) : "\\U" + hex(cp, 8),
    // HTML: the hexadecimal reference, except where the WHATWG parser turns it into another character
    // (0 and surrogates become U+FFFD; 0x80 to 0x9F are read as Windows-1252).
    html: cp === 0 || isSurrogate(cp) || (cp >= 0x80 && cp <= 0x9f) ? undefined : `&#x${hex(cp, 1)};`,
    // CSS: a backslash and the hexadecimal digits (a space ends it when a hex digit or a space follows);
    // CSS Syntax turns an escaped 0 or surrogate into U+FFFD.
    css: cp === 0 || isSurrogate(cp) ? undefined : "\\" + hex(cp, 1),
    // URL: the UTF-8 bytes, percent-encoded (RFC 3986); a surrogate has none.
    url: b ? b.map((x) => "%" + hex(x, 2)).join("") : undefined,
    // C11 universal character name: not below U+00A0 except $ @ `, never a surrogate (N1570 6.4.3).
    c: isSurrogate(cp) || (cp < 0xa0 && cp !== 0x24 && cp !== 0x40 && cp !== 0x60) ? undefined : cp < 0x10000 ? "\\u" + hex(cp) : "\\U" + hex(cp, 8),
    // Tcl 8.4 and iRules: \uXXXX within the BMP only (Tcl 8.4.6 reads a 4-byte UTF-8 character as four).
    tcl: cp < 0x10000 ? "\\u" + hex(cp) : undefined,
  };
}

/** Why a numeric HTML reference to this code point is a parse error, or gives another character (WHATWG). */
function htmlNote(cp: number, gc: string): CodePointInfo["html"]["note"] {
  // 0 becomes U+FFFD.
  if (cp === 0) return "null";
  // Surrogates become U+FFFD.
  if (isSurrogate(cp)) return "surrogate";
  // 0x80 to 0x9F: 27 of the 32 are replaced by the Windows-1252 character, the rest are parse errors.
  if (cp >= 0x80 && cp <= 0x9f) return "c1";
  // Other controls (CR and those that are not ASCII white space) are parse errors.
  if (gc === "Cc" && (cp === 0x0d || ![9, 10, 12, 32].includes(cp))) return "control";
  // Noncharacters are parse errors too.
  if (isNoncharacter(cp)) return "noncharacter";
  // Fine.
  return undefined;
}

/** Everything about one code point. */
export function info(cp: number, data?: UnicodeData): CodePointInfo {
  // General_Category.
  const gc = generalCategory(cp);
  // The name, from the full table when loaded.
  const name = data ? data.nameOf(cp) : hiddenName(cp);
  // A control's first alias.
  const alias = name ? undefined : data?.aliasOf(cp);
  // The script.
  const script = scriptOf(cp);
  // UTS #39 prototype.
  const prototype = asciiPrototype(cp);
  // UTF-8.
  const b = utf8Bytes(cp);
  // The record.
  return {
    cp,
    label: codePointLabel(cp),
    name: name ?? alias ?? labelOf(cp, gc),
    nameKind: name ? "name" : alias ? "alias" : "label",
    aliases: data ? data.aliases(cp) : [],
    gc,
    block: blockOf(cp),
    script,
    scriptCode: SCRIPT_CODE[script] ?? "Zzzz",
    scx: scriptExtensionsOf(cp),
    age: ageOf(cp),
    utf8: b ? b.map((x) => hex(x, 2)).join(" ") : undefined,
    utf16: utf16Units(cp).map((u) => hex(u)).join(" "),
    utf32: hex(cp, 8),
    escapes: escapesOf(cp),
    html: { dec: `&#${cp};`, hex: `&#x${hex(cp, 1)};`, named: namedReferencesFor(cp), note: htmlNote(cp, gc) },
    flags: flagsOf(cp, gc),
    prototype,
    sharing: prototype !== undefined ? asciiSharing(prototype) : undefined,
    compat: ASCII_LOOKALIKE.get(cp),
  };
}

// ---------------------------------------------------------------------------
// One code point, read from any notation
// ---------------------------------------------------------------------------

/** What the code point box read. */
export type ReadResult = { cp: number; readAs: string } | { cp?: undefined; readAs?: undefined };

/** Read a code point: U+XXXX, 0x, decimal, an escape, a reference, a name, or the character itself. */
export function readCodePoint(raw: string, data?: UnicodeData): ReadResult {
  // The ASCII table's reader takes every notation, and names when the data is loaded.
  const r = lookup(raw, data);
  // ASCII.
  if (r.kind === "ascii") return { cp: r.code, readAs: r.readAs };
  // Outside ASCII.
  if (r.kind === "outside") return { cp: r.cp, readAs: r.readAs };
  // Nothing.
  return {};
}

// ---------------------------------------------------------------------------
// A text, code point by code point
// ---------------------------------------------------------------------------

/** One code point of a text. */
export interface TextRow {
  // Position, counted in code points from 0.
  at: number;
  // Line and column, both from 1 (columns counted in code points).
  line: number;
  col: number;
  // The code point.
  cp: number;
  // U+XXXX.
  label: string;
  // Name (or alias, or label).
  name?: string;
  // General_Category and script code.
  gc: string;
  script: string;
  // Flags.
  flags: Flag[];
  // The ASCII text UTS #39 says it imitates.
  prototype?: string;
}

/** A bidirectional control left open at the end of a line. */
export interface OpenBidi {
  // The line (from 1).
  line: number;
  // The controls still open, in order (U+XXXX).
  open: string[];
}

/** A word whose letters come from scripts that never share a writing system. */
export interface MixedWord {
  // The word.
  word: string;
  // Where it starts.
  at: number;
  line: number;
  col: number;
  // The scripts of its letters (codes).
  scripts: string[];
}

/** What the cleaning may change. */
export interface CleanOptions {
  // Remove Default_Ignorable code points (zero-width characters, bidirectional controls, the BOM).
  removeInvisible: boolean;
  // Replace non-ASCII spaces with SPACE, and LS, PS and NEL with LF.
  asciiSpaces: boolean;
  // Replace typographic quotes with ' or " and dashes with the hyphen-minus.
  asciiPunctuation: boolean;
  // Replace lookalikes with the ASCII they imitate (compatibility forms and UTS #39 prototypes).
  foldLookalikes: boolean;
}

/** The default cleaning: everything except folding lookalikes, which would also change real words. */
export const DEFAULT_CLEAN: CleanOptions = { removeInvisible: true, asciiSpaces: true, asciiPunctuation: true, foldLookalikes: false };

/** The report on a text. */
export interface TextReport {
  // Counts.
  codePoints: number;
  utf16Units: number;
  utf8Bytes: number;
  lines: number;
  ascii: number;
  // The first 2,000 code points, one row each.
  rows: TextRow[];
  // Whether the text was cut at 10,000 code points.
  truncated: boolean;
  // Findings: positions of each kind (code point indexes), in text order.
  findings: Partial<Record<Flag, number[]>>;
  // Bidirectional controls left open at the end of a line.
  openBidi: OpenBidi[];
  // Words mixing scripts.
  mixed: MixedWord[];
  // The cleaned text and what changed.
  cleaned: string;
  changes: { removed: number; spaces: number; punctuation: number; folded: number };
  // The text written as escapes in each language (absent where impossible).
  escaped: Partial<Record<EscapeStyle, string>>;
}

/** Embedding and override openers (closed by PDF, U+202C). */
const EMBED_OPEN = new Set([0x202a, 0x202b, 0x202d, 0x202e]);
/** Isolate openers (closed by PDI, U+2069). */
const ISOLATE_OPEN = new Set([0x2066, 0x2067, 0x2068]);

/** The scripts that add a combined writing system in UTS #39's augmented script set. */
const AUGMENT: Readonly<Record<string, string[]>> = { Hani: ["Hanb", "Hntl", "Jpan", "Kore"], Hira: ["Jpan"], Kana: ["Jpan"], Hang: ["Kore"], Bopo: ["Hanb"], Latn: ["Hntl"] };

/** A character's augmented script set (UTS #39, 5.1), or null for ALL (Common or Inherited). */
function augmented(cp: number): Set<string> | null {
  // Script_Extensions.
  const scx = scriptExtensionsOf(cp);
  // Common or Inherited: ALL.
  if (scx.includes("Zyyy") || scx.includes("Zinh")) return null;
  // The set with the combined writing systems added.
  const s = new Set(scx);
  // Each addition.
  for (const c of scx) for (const a of AUGMENT[c] ?? []) s.add(a);
  // Done.
  return s;
}

/** True for a character that belongs in a word (letters, marks, digits and connector punctuation). */
const isWordChar = (gc: string) => gc[0] === "L" || gc[0] === "M" || gc[0] === "N" || gc === "Pc";

/** The cleaned text and its change counts. */
function clean(cps: number[], o: CleanOptions): { text: string; changes: TextReport["changes"] } {
  // The output pieces.
  const out: string[] = [];
  // The counts.
  const changes = { removed: 0, spaces: 0, punctuation: 0, folded: 0 };
  // Each code point.
  for (const cp of cps) {
    // Invisible characters (bidirectional controls are Default_Ignorable too).
    if (o.removeInvisible && inRanges(cp, DEFAULT_IGNORABLE)) { changes.removed++; continue; }
    // Line separators become LF.
    if (o.asciiSpaces && (cp === 0x85 || cp === 0x2028 || cp === 0x2029)) { out.push("\n"); changes.spaces++; continue; }
    // Other non-ASCII spaces become SPACE.
    if (o.asciiSpaces && cp > 0x7f && inRanges(cp, WHITE_SPACE)) { out.push(" "); changes.spaces++; continue; }
    // Quotation marks: double ones (by name) become ", the rest '.
    if (o.asciiPunctuation && cp > 0x7f && inRanges(cp, QUOTATION_MARK)) { out.push(/DOUBLE/.test(hiddenName(cp) ?? "") ? '"' : "'"); changes.punctuation++; continue; }
    // Dashes become the hyphen-minus.
    if (o.asciiPunctuation && cp > 0x7f && inRanges(cp, DASH)) { out.push("-"); changes.punctuation++; continue; }
    // Lookalikes become the ASCII they imitate.
    if (o.foldLookalikes && cp > 0x7f) {
      // The compatibility form first, then the UTS #39 prototype.
      const to = ASCII_LOOKALIKE.get(cp) ?? asciiPrototype(cp);
      // Replace.
      if (to !== undefined) { out.push(to); changes.folded++; continue; }
    }
    // Kept as it is (a lone surrogate stays a lone surrogate).
    out.push(String.fromCodePoint(cp));
  }
  // Done.
  return { text: out.join(""), changes };
}

/** A text written as escapes in one language (undefined when the language cannot hold it). */
export function escapeText(text: string, style: EscapeStyle): string | undefined {
  // The code points.
  const cps = Array.from(text, (ch) => ch.codePointAt(0)!);
  // The pieces.
  const out: string[] = [];
  // Each code point, with the next one (CSS needs to know).
  for (let i = 0; i < cps.length; i++) {
    // This one.
    const cp = cps[i];
    // Its character.
    const ch = String.fromCodePoint(cp);
    // By style.
    switch (style) {
      // JSON: " \ and controls escaped, everything outside ASCII as \uXXXX (pairs beyond the BMP).
      case "json":
        out.push(cp === 0x22 ? '\\"' : cp === 0x5c ? "\\\\" : cp === 10 ? "\\n" : cp === 13 ? "\\r" : cp === 9 ? "\\t" : cp < 0x20 || cp > 0x7e ? utf16Units(cp).map((u) => "\\u" + hex(u)).join("") : ch);
        break;
      // JavaScript: the same, with \u{...} beyond the BMP and ' escaped too.
      case "javascript":
        out.push(cp === 0x22 ? '\\"' : cp === 0x27 ? "\\'" : cp === 0x5c ? "\\\\" : cp === 10 ? "\\n" : cp === 13 ? "\\r" : cp === 9 ? "\\t" : cp < 0x20 || (cp > 0x7e && cp < 0x10000) ? "\\u" + hex(cp) : cp >= 0x10000 ? "\\u{" + hex(cp, 1) + "}" : ch);
        break;
      // Python: \xHH up to 0xFF, \uXXXX, \UXXXXXXXX.
      case "python":
        out.push(cp === 0x22 ? '\\"' : cp === 0x27 ? "\\'" : cp === 0x5c ? "\\\\" : cp === 10 ? "\\n" : cp === 13 ? "\\r" : cp === 9 ? "\\t" : cp < 0x20 || (cp > 0x7e && cp < 0x100) ? "\\x" + hex(cp, 2) : cp >= 0x100 && cp < 0x10000 ? "\\u" + hex(cp) : cp >= 0x10000 ? "\\U" + hex(cp, 8) : ch);
        break;
      // HTML text: & < > " ' as references, everything else outside printable ASCII as a hexadecimal
      // reference, except what a reference cannot carry: a lone surrogate (no HTML at all) and
      // U+0080 to U+009F (kept as themselves, because the parser reads those references as Windows-1252).
      case "html":
        // A lone surrogate cannot be written.
        if (isSurrogate(cp)) return undefined;
        // The escape.
        // (CR is written as a reference too: the HTML input stream turns a raw CR into LF.)
        out.push(cp === 0x26 ? "&amp;" : cp === 0x3c ? "&lt;" : cp === 0x3e ? "&gt;" : cp === 0x22 ? "&quot;" : cp === 0x27 ? "&#39;" : cp >= 0x80 && cp <= 0x9f ? ch : (cp < 0x20 && cp !== 9 && cp !== 10) || cp > 0x7e ? `&#x${hex(cp, 1)};` : ch);
        break;
      // CSS string: " \ and everything outside printable ASCII as \HEX, with a space when a hex digit or a space follows.
      case "css": {
        // An escaped 0 or surrogate would become U+FFFD.
        if (cp === 0 || isSurrogate(cp)) return undefined;
        // Printable ASCII other than " and \ stays.
        if (cp >= 0x20 && cp <= 0x7e && cp !== 0x22 && cp !== 0x5c) { out.push(ch); break; }
        // The next code point.
        const next = cps[i + 1];
        // Whether a terminating space is needed.
        const needSpace = next !== undefined && (/[0-9A-Fa-f]/.test(String.fromCodePoint(next)) || next === 0x20 || next === 9 || next === 10);
        // The escape.
        out.push("\\" + hex(cp, 1) + (needSpace ? " " : ""));
        break;
      }
      // URL: unreserved characters stay, everything else is its UTF-8 bytes percent-encoded.
      case "url": {
        // UTF-8.
        const b = utf8Bytes(cp);
        // A lone surrogate cannot be encoded.
        if (!b) return undefined;
        // Unreserved (RFC 3986, 2.3).
        out.push(/[A-Za-z0-9\-._~]/.test(ch) && cp < 0x80 ? ch : b.map((x) => "%" + hex(x, 2)).join(""));
        break;
      }
      // C (u8 string literal): " \ controls in octal, U+0080..U+009F as octal UTF-8 bytes, the rest as universal character names.
      case "c": {
        // A lone surrogate cannot be written.
        if (isSurrogate(cp)) return undefined;
        // ASCII.
        if (cp < 0x80) { out.push(cp === 0x22 ? '\\"' : cp === 0x5c ? "\\\\" : cp === 10 ? "\\n" : cp === 13 ? "\\r" : cp === 9 ? "\\t" : cp < 0x20 || cp === 0x7f ? "\\" + cp.toString(8).padStart(3, "0") : ch); break; }
        // C1 controls: no universal character name exists for them, so their UTF-8 bytes.
        if (cp < 0xa0) { out.push(utf8Bytes(cp)!.map((x) => "\\" + x.toString(8).padStart(3, "0")).join("")); break; }
        // The rest.
        out.push(cp < 0x10000 ? "\\u" + hex(cp) : "\\U" + hex(cp, 8));
        break;
      }
      // Tcl 8.4 quoted word: \ " $ [ ] escaped, controls in octal, \uXXXX in the BMP; nothing beyond it.
      case "tcl": {
        // Beyond the BMP: Tcl 8.4 has no escape for it.
        if (cp >= 0x10000) return undefined;
        // The escape.
        out.push(cp === 0x5c ? "\\\\" : cp === 0x22 ? '\\"' : cp === 0x24 ? "\\$" : cp === 0x5b ? "\\[" : cp === 0x5d ? "\\]" : cp === 10 ? "\\n" : cp === 13 ? "\\r" : cp === 9 ? "\\t" : cp < 0x20 || cp === 0x7f ? "\\" + cp.toString(8).padStart(3, "0") : cp > 0x7e ? "\\u" + hex(cp) : ch);
        break;
      }
    }
  }
  // Done.
  return out.join("");
}

/** Code points read at most, and rows returned at most. */
const MAX_CP = 10000;
/** Rows returned at most. */
const MAX_ROWS = 2000;

/** Inspect a text. */
export function inspectText(text: string, options: CleanOptions = DEFAULT_CLEAN, data?: UnicodeData): TextReport {
  // The code points (a lone surrogate is one of them).
  const all = Array.from(text, (ch) => ch.codePointAt(0)!);
  // Bounded.
  const cps = all.slice(0, MAX_CP);
  // Rows, findings, open bidi controls, mixed words.
  const rows: TextRow[] = [];
  // Findings by flag.
  const findings: Partial<Record<Flag, number[]>> = {};
  // Open bidi controls.
  const openBidi: OpenBidi[] = [];
  // Mixed words.
  const mixed: MixedWord[] = [];
  // Line and column.
  let line = 1, col = 1;
  // The bidi stack for the current line.
  let stack: number[] = [];
  // The current word: start, its characters, and the resolved script set (null = ALL so far).
  let wordStart = -1, wordChars: number[] = [], resolved = null as Set<string> | null, wordLine = 1, wordCol = 1;
  // Close a word: report it when its resolved script set is empty.
  const endWord = () => {
    // A word with letters whose scripts never meet.
    if (wordStart >= 0 && resolved !== null && resolved.size === 0) {
      // The scripts of its letters.
      const scripts = Array.from(new Set(wordChars.filter((c) => generalCategory(c)[0] === "L").map((c) => SCRIPT_CODE[scriptOf(c)] ?? "Zzzz")));
      // Report.
      mixed.push({ word: String.fromCodePoint(...wordChars), at: wordStart, line: wordLine, col: wordCol, scripts });
    }
    // Reset.
    wordStart = -1; wordChars = []; resolved = null;
  };
  // Close a line: report the bidi controls still open.
  const endLine = () => {
    // Still open.
    if (stack.length) openBidi.push({ line, open: stack.map((c) => codePointLabel(c)) });
    // A new line starts with nothing open.
    stack = [];
  };
  // UTF-8 bytes (a lone surrogate counts as the 3 bytes of the U+FFFD an encoder writes for it).
  let bytes = 0;
  // ASCII count.
  let ascii = 0;
  // Each code point.
  for (let i = 0; i < cps.length; i++) {
    // This one.
    const cp = cps[i];
    // Its category.
    const gc = generalCategory(cp);
    // Its flags.
    const flags = flagsOf(cp, gc);
    // Bytes.
    bytes += utf8Bytes(cp)?.length ?? 3;
    // ASCII.
    if (cp < 0x80) ascii++;
    // A row.
    if (rows.length < MAX_ROWS) rows.push({ at: i, line, col, cp, label: codePointLabel(cp), name: data ? data.nameOf(cp) ?? data.aliasOf(cp) ?? labelOf(cp, gc) : hiddenName(cp) ?? (cp < 0x80 ? undefined : labelOf(cp, gc)), gc, script: SCRIPT_CODE[scriptOf(cp)] ?? "Zzzz", flags, prototype: asciiPrototype(cp) });
    // Findings: every finding flag of this code point.
    for (const f of flags) if (FINDING_FLAGS.includes(f)) (findings[f] ??= []).push(i);
    // Bidi: push openers, pop on PDF and PDI (UAX #9: PDF closes the last embedding or override, PDI the last isolate and anything opened after it).
    if (EMBED_OPEN.has(cp) || ISOLATE_OPEN.has(cp)) stack.push(cp);
    // PDF.
    else if (cp === 0x202c) { const k = stack.length - 1; if (k >= 0 && EMBED_OPEN.has(stack[k])) stack.pop(); }
    // PDI.
    else if (cp === 0x2069) { const k = stack.map((c) => ISOLATE_OPEN.has(c)).lastIndexOf(true); if (k >= 0) stack = stack.slice(0, k); }
    // Words.
    if (isWordChar(gc)) {
      // Start one.
      if (wordStart < 0) { wordStart = i; wordLine = line; wordCol = col; }
      // Keep the character.
      wordChars.push(cp);
      // Intersect its augmented script set.
      const a = augmented(cp);
      // ALL changes nothing.
      if (a) resolved = resolved === null ? a : new Set([...resolved].filter((x) => a.has(x)));
    } else endWord();
    // Line ends: LF, a CR not followed by LF, and the other line breaks.
    if (cp === 10 || (cp === 13 && cps[i + 1] !== 10) || OTHER_BREAKS.has(cp)) { endLine(); line++; col = 1; } else col++;
  }
  // The last word and line.
  endWord();
  endLine();
  // The cleaned text.
  const c = clean(cps, options);
  // The escapes of the (bounded) text.
  const bounded = String.fromCodePoint(...cps.slice(0, 2000));
  // Each style.
  const escaped: TextReport["escaped"] = {};
  // Fill.
  for (const s of ESCAPE_STYLES) escaped[s] = escapeText(bounded, s);
  // The report.
  return {
    codePoints: cps.length,
    utf16Units: cps.reduce((n, cp) => n + (cp >= 0x10000 ? 2 : 1), 0),
    utf8Bytes: bytes,
    lines: line,
    ascii,
    rows,
    truncated: all.length > cps.length,
    findings,
    openBidi,
    mixed,
    cleaned: c.text,
    changes: c.changes,
    escaped,
  };
}

// ---------------------------------------------------------------------------
// Name search and the registry-facing entry point
// ---------------------------------------------------------------------------

/** One search result. */
export interface SearchHit {
  // The code point.
  cp: number;
  // U+XXXX.
  label: string;
  // Its name or alias.
  name?: string;
}

/** What the tool takes. */
export type UnicodeInspectorInput =
  // Inspect a text.
  | { mode: "inspect"; text: string; options?: Partial<CleanOptions> }
  // One code point in any notation.
  | { mode: "codepoint"; value: string }
  // Find code points by name.
  | { mode: "search"; query: string; limit?: number };

/** What it returns. */
export type UnicodeInspectorResult =
  // The text report.
  | ({ mode: "inspect" } & TextReport)
  // One code point (info absent when nothing was read).
  | { mode: "codepoint"; readAs?: string; info?: CodePointInfo }
  // Search results.
  | { mode: "search"; hits: SearchHit[]; truncated: boolean };

/** Run the tool (data: the full name table; index.ts and the vectors always pass it). */
export function run(input: UnicodeInspectorInput, data?: UnicodeData): UnicodeInspectorResult {
  // By mode.
  switch (input.mode) {
    // A text.
    case "inspect":
      // With the default cleaning, overridden by any options given.
      return { mode: "inspect", ...inspectText(String(input.text ?? ""), { ...DEFAULT_CLEAN, ...(input.options ?? {}) }, data) };
    // One code point.
    case "codepoint": {
      // Read it.
      const r = readCodePoint(String(input.value ?? ""), data);
      // Nothing read, or the full record.
      return r.cp === undefined ? { mode: "codepoint" } : { mode: "codepoint", readAs: r.readAs, info: info(r.cp, data) };
    }
    // A name search.
    case "search": {
      // At most 200 results.
      const limit = Math.max(1, Math.min(200, Math.floor(Number(input.limit ?? 50)) || 50));
      // The words, bounded.
      const words = String(input.query ?? "").slice(0, 120).split(/\s+/).filter(Boolean);
      // Search one past the limit to know whether there are more.
      const cps = data ? data.search(words, limit + 1) : [];
      // The hits.
      return { mode: "search", hits: cps.slice(0, limit).map((cp) => ({ cp, label: codePointLabel(cp), name: data?.nameOf(cp) ?? data?.aliasOf(cp) })), truncated: cps.length > limit };
    }
  }
}
