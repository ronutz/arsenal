// ============================================================================
// src/lib/tools/charset-equivalency/compute.ts
// ----------------------------------------------------------------------------
// CHARSET CONVERTER AND MOJIBAKE REPAIR: the pure engine.
//
// Three jobs, all on bytes and code points, nothing fetched:
//
//   encode   text -> bytes in one of fourteen charsets (UTF-8, UTF-16LE/BE,
//            UTF-32LE/BE, US-ASCII, ISO-8859-1, windows-1252, ISO-8859-15,
//            macintosh, IBM 437, IBM 850, IBM 037, IBM 500), with what
//            happens to characters a charset cannot hold, the same text in
//            every charset, and how the bytes read back in every charset.
//   decode   bytes (hex, a hex dump, C/Python/git escapes, %XX or Base64)
//            -> text, with every ill-formed sequence replaced and explained,
//            a byte order mark honoured, a guess at the charset, and the same
//            bytes read in every charset.
//   repair   text that was decoded with the wrong charset (mojibake) -> the
//            text it was, by encoding it back with the charset that misread
//            it and decoding with the right one, up to three rounds.
//
// The UTF-8 and UTF-16 decoders follow the WHATWG Encoding Standard step by
// step, so U+FFFD replaces exactly what a browser replaces (one per maximal
// subpart, the practice described in Unicode 18.0.0 section 3.9.6). UTF-32,
// which browsers do not decode, follows the Unicode Standard's D99 to D100.
// The single-byte tables are in ./tables.ts.
// ============================================================================

import { TABLES, type TableCharset } from "./tables";

// ---------------------------------------------------------------------------
// Charsets
// ---------------------------------------------------------------------------

/** Every charset the tool reads and writes. */
export type CharsetId =
  | "utf-8" | "utf-16le" | "utf-16be" | "utf-32le" | "utf-32be"
  | "us-ascii" | "iso-8859-1" | TableCharset;

/** The charsets in the order the page lists them. */
export const CHARSETS: readonly CharsetId[] = [
  // The Unicode encoding schemes.
  "utf-8", "utf-16le", "utf-16be", "utf-32le", "utf-32be",
  // ASCII and the Latin code pages a browser knows.
  "us-ascii", "iso-8859-1", "windows-1252", "iso-8859-15", "macintosh",
  // DOS code pages.
  "ibm437", "ibm850",
  // EBCDIC code pages.
  "ibm037", "ibm500",
];

/** What a browser does with a charset's name (WHATWG Encoding Standard, section 4.2). */
export type BrowserSupport = "decodes" | "means-windows-1252" | "no";

/** Facts about one charset. */
export interface CharsetFacts {
  // Unicode (a UTF) or a legacy single-byte code page.
  kind: "utf" | "single";
  // Bytes per code unit.
  unit: 1 | 2 | 4;
  // Whether bytes 0x00 to 0x7F are ASCII (false for UTF-16, UTF-32 and EBCDIC).
  asciiCompatible: boolean;
  // EBCDIC (letters are not contiguous; space is 0x40).
  ebcdic: boolean;
  // What a browser does with the name.
  browser: BrowserSupport;
}

/** The facts, per charset. */
export const FACTS: Readonly<Record<CharsetId, CharsetFacts>> = {
  // UTF-8: the encoding the WHATWG standard requires for new content.
  "utf-8": { kind: "utf", unit: 1, asciiCompatible: true, ebcdic: false, browser: "decodes" },
  // UTF-16LE: a browser decodes it ("utf-16" is one of its labels) but never encodes it.
  "utf-16le": { kind: "utf", unit: 2, asciiCompatible: false, ebcdic: false, browser: "decodes" },
  // UTF-16BE: likewise.
  "utf-16be": { kind: "utf", unit: 2, asciiCompatible: false, ebcdic: false, browser: "decodes" },
  // UTF-32LE: not in the WHATWG standard.
  "utf-32le": { kind: "utf", unit: 4, asciiCompatible: false, ebcdic: false, browser: "no" },
  // UTF-32BE: not in the WHATWG standard.
  "utf-32be": { kind: "utf", unit: 4, asciiCompatible: false, ebcdic: false, browser: "no" },
  // US-ASCII: seven bits; to a browser "ascii" and "us-ascii" are labels of windows-1252.
  "us-ascii": { kind: "single", unit: 1, asciiCompatible: true, ebcdic: false, browser: "means-windows-1252" },
  // ISO-8859-1: all 256 bytes as U+0000 to U+00FF; to a browser "iso-8859-1" and "latin1" mean windows-1252.
  "iso-8859-1": { kind: "single", unit: 1, asciiCompatible: true, ebcdic: false, browser: "means-windows-1252" },
  // windows-1252: the browser's reading of every Latin-1 label.
  "windows-1252": { kind: "single", unit: 1, asciiCompatible: true, ebcdic: false, browser: "decodes" },
  // ISO-8859-15: Latin-9, Latin-1 with the euro sign.
  "iso-8859-15": { kind: "single", unit: 1, asciiCompatible: true, ebcdic: false, browser: "decodes" },
  // macintosh: Mac OS Roman.
  "macintosh": { kind: "single", unit: 1, asciiCompatible: true, ebcdic: false, browser: "decodes" },
  // IBM 437: the original IBM PC code page.
  "ibm437": { kind: "single", unit: 1, asciiCompatible: true, ebcdic: false, browser: "no" },
  // IBM 850: DOS Western Europe (and Brazil).
  "ibm850": { kind: "single", unit: 1, asciiCompatible: true, ebcdic: false, browser: "no" },
  // IBM 037: EBCDIC US/Canada.
  "ibm037": { kind: "single", unit: 1, asciiCompatible: false, ebcdic: true, browser: "no" },
  // IBM 500: EBCDIC International.
  "ibm500": { kind: "single", unit: 1, asciiCompatible: false, ebcdic: true, browser: "no" },
};

/** Whether a value names a charset. */
export function isCharset(v: unknown): v is CharsetId {
  // One of the fourteen.
  return typeof v === "string" && (CHARSETS as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** The most code points encoded or repaired at once. */
export const MAX_CODE_POINTS = 20000;
/** The most code points the repair search works on (it decodes many candidates). */
export const MAX_REPAIR_CODE_POINTS = 2000;
/** The most bytes decoded at once. */
export const MAX_BYTES = 65536;
/** The most rows a per-character table lists. */
export const MAX_ROWS = 2000;
/** The most code points of each reading shown in a comparison. */
export const MAX_PREVIEW = 400;

// ---------------------------------------------------------------------------
// Single-byte tables: decode and encode
// ---------------------------------------------------------------------------

/** Reverse maps (code point -> byte), built once per table when first needed. */
const REVERSE = new Map<TableCharset, Map<number, number>>();

/** The code point a byte decodes to in a single-byte charset, or null when the byte is not defined. */
export function byteToCodePoint(cs: CharsetId, b: number): number | null {
  // US-ASCII defines only 0x00 to 0x7F.
  if (cs === "us-ascii") return b < 0x80 ? b : null;
  // ISO-8859-1 is the identity on all 256 bytes.
  if (cs === "iso-8859-1") return b;
  // A table charset.
  const t = TABLES[cs as TableCharset];
  // Not a single-byte charset.
  if (!t) return null;
  // An ASCII-compatible table stores only the upper half.
  if (t.covers === "upper") return b < 0x80 ? b : t.cps[b - 0x80];
  // An EBCDIC table stores every byte.
  return t.cps[b];
}

/** The byte a code point encodes to in a single-byte charset, or null when the charset cannot hold it. */
export function codePointToByte(cs: CharsetId, cp: number): number | null {
  // US-ASCII holds U+0000 to U+007F.
  if (cs === "us-ascii") return cp < 0x80 ? cp : null;
  // ISO-8859-1 holds U+0000 to U+00FF.
  if (cs === "iso-8859-1") return cp < 0x100 ? cp : null;
  // A table charset.
  const t = TABLES[cs as TableCharset];
  // Not a single-byte charset.
  if (!t) return null;
  // ASCII is itself in an ASCII-compatible table.
  if (t.covers === "upper" && cp < 0x80) return cp;
  // The reverse map, built on first use.
  let rev = REVERSE.get(cs as TableCharset);
  // Build it.
  if (!rev) {
    // Empty.
    rev = new Map<number, number>();
    // Every stored byte.
    t.cps.forEach((v, i) => rev!.set(v, t.covers === "upper" ? i + 0x80 : i));
    // Keep it.
    REVERSE.set(cs as TableCharset, rev);
  }
  // The byte, if any.
  return rev.get(cp) ?? null;
}

// ---------------------------------------------------------------------------
// Encoding one code point
// ---------------------------------------------------------------------------

/** The bytes of one Unicode scalar value in a charset, or null when the charset cannot hold it. */
export function encodeCodePoint(cp: number, cs: CharsetId): number[] | null {
  // Each charset.
  switch (cs) {
    // UTF-8 (RFC 3629, section 3; the WHATWG UTF-8 encoder).
    case "utf-8": {
      // One byte for ASCII.
      if (cp < 0x80) return [cp];
      // Two bytes up to U+07FF.
      if (cp < 0x800) return [0xc0 | (cp >> 6), 0x80 | (cp & 0x3f)];
      // Three bytes up to U+FFFF.
      if (cp < 0x10000) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
      // Four bytes up to U+10FFFF.
      return [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
    }
    // UTF-16 (RFC 2781, section 2.1), little- or big-endian.
    case "utf-16le":
    case "utf-16be": {
      // The code units: one in the BMP, a surrogate pair beyond it.
      const units = cp < 0x10000 ? [cp] : [0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff)];
      // Each unit as two bytes in the scheme's order.
      return units.flatMap((u) => (cs === "utf-16be" ? [u >> 8, u & 0xff] : [u & 0xff, u >> 8]));
    }
    // UTF-32: one 32-bit unit, in the scheme's order.
    case "utf-32le":
      // Least significant byte first.
      return [cp & 0xff, (cp >> 8) & 0xff, (cp >> 16) & 0xff, cp >>> 24];
    // Big-endian.
    case "utf-32be":
      // Most significant byte first.
      return [cp >>> 24, (cp >> 16) & 0xff, (cp >> 8) & 0xff, cp & 0xff];
    // Every single-byte charset.
    default: {
      // Its byte, if any.
      const b = codePointToByte(cs, cp);
      // One byte or nothing.
      return b === null ? null : [b];
    }
  }
}

// ---------------------------------------------------------------------------
// Encoding a text
// ---------------------------------------------------------------------------

/** What to write for a character the charset cannot hold. */
export type Unencodable = "replace" | "html" | "strict";

/** The code points of a text, with any lone surrogate made U+FFFD (as TextEncoder does). */
export function scalarValues(text: string): { cps: number[]; loneSurrogates: number } {
  // The code points.
  const cps: number[] = [];
  // Lone surrogates met.
  let lone = 0;
  // Each code point (a lone surrogate comes out of the iterator on its own).
  for (const ch of text) {
    // Its value.
    const cp = ch.codePointAt(0)!;
    // A surrogate on its own is not a scalar value.
    if (cp >= 0xd800 && cp <= 0xdfff) { cps.push(0xfffd); lone++; } else cps.push(cp);
  }
  // Both.
  return { cps, loneSurrogates: lone };
}

/** One character of an encoded text. */
export interface EncodedChar {
  // Position, in code points.
  at: number;
  // The code point.
  cp: number;
  // Its bytes, or null when the charset cannot hold it.
  bytes: number[] | null;
  // What was written instead (a "?" or an HTML reference), when it could not be held.
  instead?: number[];
}

/** An encoded text. */
export interface EncodeResult {
  // The charset.
  charset: CharsetId;
  // The byte order mark written first, if one was asked for and the charset is a UTF.
  bom: number[] | null;
  // Every byte, the BOM included; empty in strict mode when a character could not be held.
  bytes: number[];
  // The characters, up to MAX_ROWS.
  chars: EncodedChar[];
  // How many code points were encoded.
  codePoints: number;
  // How many could not be held.
  unencodable: number;
  // Lone surrogates in the input, written as U+FFFD.
  loneSurrogates: number;
  // Strict mode met a character it could not hold.
  failed: boolean;
  // The input was longer than MAX_CODE_POINTS.
  truncated: boolean;
}

/** The bytes of U+FEFF in a UTF, which are its byte order mark. */
export function bomBytes(cs: CharsetId): number[] | null {
  // Only the UTFs have one.
  return FACTS[cs].kind === "utf" ? encodeCodePoint(0xfeff, cs) : null;
}

/** Encode a text. */
export function encodeText(text: string, cs: CharsetId, opts: { bom?: boolean; unencodable?: Unencodable } = {}): EncodeResult {
  // The policy for characters the charset cannot hold.
  const policy = opts.unencodable ?? "replace";
  // The scalar values.
  const { cps: all, loneSurrogates } = scalarValues(text);
  // Capped.
  const cps = all.slice(0, MAX_CODE_POINTS);
  // The BOM, when asked for and possible.
  const bom = opts.bom ? bomBytes(cs) : null;
  // The bytes, starting with the BOM.
  const bytes: number[] = bom ? [...bom] : [];
  // The rows.
  const chars: EncodedChar[] = [];
  // Characters that could not be held.
  let unencodable = 0;
  // Each code point.
  cps.forEach((cp, at) => {
    // Its bytes.
    const b = encodeCodePoint(cp, cs);
    // Held: append.
    if (b) { bytes.push(...b); if (chars.length < MAX_ROWS) chars.push({ at, cp, bytes: b }); return; }
    // Not held.
    unencodable++;
    // What to write instead: a "?" in the charset, or the decimal HTML reference (WHATWG "html" error mode).
    const instead = policy === "html" ? Array.from(`&#${cp};`).flatMap((c) => encodeCodePoint(c.codePointAt(0)!, cs) ?? []) : policy === "replace" ? encodeCodePoint(0x3f, cs) ?? [] : [];
    // Append it.
    bytes.push(...instead);
    // The row.
    if (chars.length < MAX_ROWS) chars.push({ at, cp, bytes: null, instead: policy === "strict" ? undefined : instead });
  });
  // Strict mode writes nothing when anything could not be held.
  const failed = policy === "strict" && unencodable > 0;
  // The result.
  return { charset: cs, bom, bytes: failed ? [] : bytes, chars, codePoints: cps.length, unencodable, loneSurrogates, failed, truncated: all.length > cps.length };
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

/** Why a sequence could not be decoded. */
export type DecodeError =
  // UTF-8: a continuation byte (0x80-0xBF) where a character should start.
  | "continuation"
  // UTF-8: 0xC0 or 0xC1, which could only start an overlong two-byte form.
  | "overlong-lead"
  // UTF-8: 0xF5 to 0xFF, which never appear.
  | "invalid-lead"
  // UTF-8: E0 80-9F or F0 80-8F, a longer form of a code point that has a shorter one.
  | "overlong"
  // UTF-8: ED A0-BF, a surrogate (U+D800 to U+DFFF).
  | "surrogate"
  // UTF-8: F4 90-BF, beyond U+10FFFF.
  | "too-large"
  // UTF-8: the sequence was cut short by a byte that cannot continue it.
  | "truncated"
  // UTF-8, UTF-16: the data ended in the middle of a character.
  | "truncated-end"
  // UTF-16: a leading surrogate not followed by a trailing one.
  | "unpaired-lead"
  // UTF-16: a trailing surrogate with no leading one.
  | "unpaired-trail"
  // UTF-16: one byte left over at the end.
  | "odd-byte"
  // UTF-32: a unit that is a surrogate or beyond U+10FFFF.
  | "utf32-invalid"
  // UTF-32: one to three bytes left over at the end.
  | "utf32-incomplete"
  // US-ASCII: a byte of 0x80 or more.
  | "not-ascii";

/** One decoded character, or one replaced sequence. */
export interface DecodedUnit {
  // Offset of its first byte.
  at: number;
  // How many bytes it took.
  len: number;
  // The code point (U+FFFD for an error).
  cp: number;
  // Why it was replaced.
  error?: DecodeError;
}

/** UTF-8, as the WHATWG Encoding Standard's UTF-8 decoder (section 8.1.1), with each error named. */
function decodeUtf8(b: Uint8Array): DecodedUnit[] {
  // The output.
  const out: DecodedUnit[] = [];
  // The read position.
  let i = 0;
  // Until the end.
  while (i < b.length) {
    // Where this character starts.
    const start = i;
    // Its first byte.
    const lead = b[i];
    // ASCII: one byte.
    if (lead < 0x80) { out.push({ at: i, len: 1, cp: lead }); i++; continue; }
    // Bytes still needed, the code point so far, and the range the next byte must be in.
    let need = 0, cp = 0, lower = 0x80, upper = 0xbf;
    // A two-byte lead.
    if (lead >= 0xc2 && lead <= 0xdf) { need = 1; cp = lead & 0x1f; }
    // A three-byte lead (E0 needs A0-BF next, ED needs 80-9F).
    else if (lead >= 0xe0 && lead <= 0xef) { if (lead === 0xe0) lower = 0xa0; if (lead === 0xed) upper = 0x9f; need = 2; cp = lead & 0xf; }
    // A four-byte lead (F0 needs 90-BF next, F4 needs 80-8F).
    else if (lead >= 0xf0 && lead <= 0xf4) { if (lead === 0xf0) lower = 0x90; if (lead === 0xf4) upper = 0x8f; need = 3; cp = lead & 0x7; }
    // Anything else cannot start a character: one replacement for this byte.
    else { out.push({ at: i, len: 1, cp: 0xfffd, error: lead <= 0xbf ? "continuation" : lead <= 0xc1 ? "overlong-lead" : "invalid-lead" }); i++; continue; }
    // The lead is taken.
    i++;
    // Continuation bytes taken so far, and the error if one comes.
    let seen = 0;
    // The error, if any.
    let err: DecodeError | undefined;
    // Take the continuation bytes.
    while (seen < need) {
      // The data ended inside the character.
      if (i >= b.length) { err = "truncated-end"; break; }
      // The next byte.
      const x = b[i];
      // Outside the allowed range: an error, and the byte is read again as a new start (it is not taken).
      if (x < lower || x > upper) {
        // A continuation byte outside the narrowed range of the first one names the problem;
        // anything else simply cut the sequence short.
        err = seen === 0 && x >= 0x80 && x <= 0xbf ? (lead === 0xed ? "surrogate" : lead === 0xf4 ? "too-large" : "overlong") : "truncated";
        // Stop here.
        break;
      }
      // The range is the usual one after the first continuation byte.
      lower = 0x80; upper = 0xbf;
      // Add six bits.
      cp = (cp << 6) | (x & 0x3f);
      // Taken.
      seen++; i++;
    }
    // One replacement for the maximal subpart, or the character.
    out.push(err ? { at: start, len: i - start, cp: 0xfffd, error: err } : { at: start, len: i - start, cp });
  }
  // Done.
  return out;
}

/** UTF-16, as the WHATWG shared UTF-16 decoder (section 14.2.1), with each error named. */
function decodeUtf16(b: Uint8Array, be: boolean): DecodedUnit[] {
  // The output.
  const out: DecodedUnit[] = [];
  // The read position.
  let i = 0;
  // The code unit at a position, in the scheme's byte order.
  const unit = (k: number) => (be ? (b[k] << 8) | b[k + 1] : (b[k + 1] << 8) | b[k]);
  // While a whole code unit is left.
  while (i + 1 < b.length) {
    // The code unit.
    const u = unit(i);
    // A leading surrogate.
    if (u >= 0xd800 && u <= 0xdbff) {
      // Fewer than two more bytes: the data ends inside the pair (one replacement for the rest).
      if (i + 3 >= b.length) { out.push({ at: i, len: b.length - i, cp: 0xfffd, error: "truncated-end" }); return out; }
      // The next unit.
      const v = unit(i + 2);
      // A trailing surrogate completes the pair.
      if (v >= 0xdc00 && v <= 0xdfff) { out.push({ at: i, len: 4, cp: 0x10000 + ((u - 0xd800) << 10) + (v - 0xdc00) }); i += 4; continue; }
      // Anything else: the leading surrogate is replaced and the next unit is read again.
      out.push({ at: i, len: 2, cp: 0xfffd, error: "unpaired-lead" }); i += 2; continue;
    }
    // A trailing surrogate on its own.
    if (u >= 0xdc00 && u <= 0xdfff) { out.push({ at: i, len: 2, cp: 0xfffd, error: "unpaired-trail" }); i += 2; continue; }
    // Any other unit is a code point.
    out.push({ at: i, len: 2, cp: u }); i += 2;
  }
  // One byte left over.
  if (i < b.length) out.push({ at: i, len: 1, cp: 0xfffd, error: "odd-byte" });
  // Done.
  return out;
}

/** UTF-32 (Unicode Standard D99 and D100): one four-byte unit per scalar value. */
function decodeUtf32(b: Uint8Array, be: boolean): DecodedUnit[] {
  // The output.
  const out: DecodedUnit[] = [];
  // The read position.
  let i = 0;
  // While a whole unit is left.
  while (i + 3 < b.length) {
    // The unit.
    const v = be ? ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0 : ((b[i + 3] << 24) | (b[i + 2] << 16) | (b[i + 1] << 8) | b[i]) >>> 0;
    // A scalar value, or not.
    out.push(v > 0x10ffff || (v >= 0xd800 && v <= 0xdfff) ? { at: i, len: 4, cp: 0xfffd, error: "utf32-invalid" } : { at: i, len: 4, cp: v });
    // Next.
    i += 4;
  }
  // One to three bytes left over.
  if (i < b.length) out.push({ at: i, len: b.length - i, cp: 0xfffd, error: "utf32-incomplete" });
  // Done.
  return out;
}

/** A single-byte charset: one byte, one code point (US-ASCII alone has undefined bytes). */
function decodeSingle(b: Uint8Array, cs: CharsetId): DecodedUnit[] {
  // Each byte.
  return Array.from(b, (x, i) => {
    // Its code point.
    const cp = byteToCodePoint(cs, x);
    // Defined, or not.
    return cp === null ? { at: i, len: 1, cp: 0xfffd, error: "not-ascii" as const } : { at: i, len: 1, cp };
  });
}

/** Decode bytes in a charset, without looking for a byte order mark. */
export function decodeWith(b: Uint8Array, cs: CharsetId): DecodedUnit[] {
  // Each family of decoder.
  switch (cs) {
    // UTF-8.
    case "utf-8": return decodeUtf8(b);
    // UTF-16.
    case "utf-16le": return decodeUtf16(b, false);
    // Big-endian.
    case "utf-16be": return decodeUtf16(b, true);
    // UTF-32.
    case "utf-32le": return decodeUtf32(b, false);
    // Big-endian.
    case "utf-32be": return decodeUtf32(b, true);
    // Every single-byte charset.
    default: return decodeSingle(b, cs);
  }
}

/** The text of decoded units. */
export function textOf(units: readonly DecodedUnit[]): string {
  // Each code point, in order.
  return units.map((u) => String.fromCodePoint(u.cp)).join("");
}

/** A byte order mark at the start of the data. */
export interface BomFound {
  // The UTF it marks.
  charset: CharsetId;
  // Its length in bytes.
  length: number;
}

/**
 * Look for a byte order mark. The UTF-8 and UTF-16 marks are the three the WHATWG "BOM sniff"
 * looks for; the two UTF-32 marks come from the Unicode BOM FAQ and are checked first, because
 * FF FE 00 00 also starts with UTF-16LE's FF FE.
 */
export function sniffBom(b: Uint8Array): BomFound | null {
  // EF BB BF.
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return { charset: "utf-8", length: 3 };
  // FF FE 00 00.
  if (b[0] === 0xff && b[1] === 0xfe && b[2] === 0x00 && b[3] === 0x00 && b.length >= 4) return { charset: "utf-32le", length: 4 };
  // 00 00 FE FF.
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0xfe && b[3] === 0xff) return { charset: "utf-32be", length: 4 };
  // FE FF.
  if (b[0] === 0xfe && b[1] === 0xff) return { charset: "utf-16be", length: 2 };
  // FF FE.
  if (b[0] === 0xff && b[1] === 0xfe) return { charset: "utf-16le", length: 2 };
  // None.
  return null;
}

/** Why the tool guessed a charset. */
export type GuessReason =
  // Nothing to read.
  | "empty"
  // A byte order mark.
  | "bom"
  // Every byte is ASCII (and none is 0x00), so every ASCII-compatible charset reads the same text.
  | "ascii"
  // Well-formed UTF-8 with at least one multi-byte character.
  | "utf8-valid"
  // Zero bytes in the pattern of ASCII text in UTF-16 or UTF-32.
  | "zeros"
  // The byte pattern of EBCDIC text (0x40 spaces, letters at 0x81 and up).
  | "ebcdic"
  // No single answer.
  | "none";

/** A guess at the charset of some bytes. */
export interface Guess {
  // The charset, or null when there is no single answer.
  charset: CharsetId | null;
  // Why.
  reason: GuessReason;
}

/** Guess the charset of some bytes, saying why. */
export function guessCharset(b: Uint8Array): Guess {
  // Nothing.
  if (b.length === 0) return { charset: null, reason: "empty" };
  // A byte order mark decides.
  const bom = sniffBom(b);
  // Found one.
  if (bom) return { charset: bom.charset, reason: "bom" };
  // Count zero bytes by position modulo 4, and bytes of 0x80 and up.
  const zeros = [0, 0, 0, 0];
  // High bytes.
  let high = 0;
  // Each byte.
  b.forEach((x, i) => { if (x === 0) zeros[i % 4]++; if (x >= 0x80) high++; });
  // All zero bytes.
  const zeroTotal = zeros[0] + zeros[1] + zeros[2] + zeros[3];
  // Pure ASCII without NULs: every ASCII-compatible charset agrees.
  if (high === 0 && zeroTotal === 0) return { charset: "us-ascii", reason: "ascii" };
  // Units of each size.
  const units4 = Math.floor(b.length / 4), units2 = Math.floor(b.length / 2);
  // UTF-32: three of every four bytes zero, at fixed positions.
  if (units4 >= 1 && b.length % 4 === 0) {
    // Little-endian ASCII text: bytes 1, 2 and 3 of each unit are zero.
    if (zeros[1] === units4 && zeros[2] === units4 && zeros[3] === units4 && zeros[0] < units4) return { charset: "utf-32le", reason: "zeros" };
    // Big-endian: bytes 0, 1 and 2 are zero.
    if (zeros[0] === units4 && zeros[1] === units4 && zeros[2] === units4 && zeros[3] < units4) return { charset: "utf-32be", reason: "zeros" };
  }
  // UTF-16: every other byte zero (Latin text), at odd positions (LE) or even ones (BE).
  if (units2 >= 1 && b.length % 2 === 0) {
    // Zeros at even and odd positions.
    const even = zeros[0] + zeros[2], odd = zeros[1] + zeros[3];
    // Mostly zero at odd positions, never at even ones.
    if (odd >= units2 * 0.6 && even === 0) return { charset: "utf-16le", reason: "zeros" };
    // The reverse.
    if (even >= units2 * 0.6 && odd === 0) return { charset: "utf-16be", reason: "zeros" };
  }
  // Well-formed UTF-8 with something beyond ASCII.
  if (high > 0 && decodeUtf8(b).every((u) => !u.error)) return { charset: "utf-8", reason: "utf8-valid" };
  // EBCDIC: 0x40 is its space and the most common byte, and most bytes are high.
  const count40 = b.filter((x) => x === 0x40).length;
  // Spaces common, ASCII spaces rare, high bytes the majority.
  if (count40 >= b.length * 0.05 && b.filter((x) => x === 0x20).length === 0 && high >= b.length * 0.5) return { charset: "ibm037", reason: "ebcdic" };
  // No single answer.
  return { charset: null, reason: "none" };
}

/** A decoded text. */
export interface DecodeResult {
  // The charset asked for ("auto" lets the guess decide).
  requested: CharsetId | "auto";
  // The charset used.
  charset: CharsetId | null;
  // The guess, when "auto" was asked for.
  guess?: Guess;
  // The byte order mark found, if looked for and present.
  bom: BomFound | null;
  // Whether the mark changed the charset from the one asked for (it is more authoritative, WHATWG).
  bomOverride: boolean;
  // The text.
  text: string;
  // The units, up to MAX_ROWS.
  units: DecodedUnit[];
  // How many sequences were replaced.
  errors: number;
  // How many bytes were read.
  byteCount: number;
  // How many code points came out.
  codePoints: number;
  // The input was longer than MAX_BYTES.
  truncated: boolean;
}

/** Decode bytes: honour a byte order mark (unless told not to), guess when asked, replace what is ill-formed. */
export function decodeBytes(input: Uint8Array | readonly number[], requested: CharsetId | "auto", opts: { sniffBom?: boolean } = {}): DecodeResult {
  // The bytes, capped.
  const all = input instanceof Uint8Array ? input : Uint8Array.from(input);
  // Capped.
  const b = all.subarray(0, MAX_BYTES);
  // Look for a mark unless told not to.
  const bom = opts.sniffBom === false ? null : sniffBom(b);
  // The guess, when asked for.
  const guess = requested === "auto" ? guessCharset(b) : undefined;
  // The charset: the mark's, else the one asked for, else the guess's.
  const charset: CharsetId | null = bom ? bom.charset : requested === "auto" ? guess!.charset : requested;
  // No charset (an "auto" with no answer): nothing decoded, the comparison has to answer.
  if (!charset) return { requested, charset: null, guess, bom, bomOverride: false, text: "", units: [], errors: 0, byteCount: b.length, codePoints: 0, truncated: all.length > b.length };
  // Decode what follows the mark.
  const units = decodeWith(b.subarray(bom ? bom.length : 0), charset).map((u) => (bom ? { ...u, at: u.at + bom.length } : u));
  // The result.
  return {
    // As asked.
    requested,
    // As used.
    charset,
    // The guess.
    guess,
    // The mark.
    bom,
    // Whether the mark overrode the request.
    bomOverride: !!bom && requested !== "auto" && requested !== bom.charset,
    // The text.
    text: textOf(units),
    // The rows.
    units: units.slice(0, MAX_ROWS),
    // The errors.
    errors: units.filter((u) => u.error).length,
    // The size.
    byteCount: b.length,
    // The code points.
    codePoints: units.length,
    // Capped or not.
    truncated: all.length > b.length,
  };
}

/** One charset's reading of the same bytes. */
export interface Reading {
  // The charset.
  charset: CharsetId;
  // The text, up to MAX_PREVIEW code points.
  text: string;
  // How many code points it has in all.
  codePoints: number;
  // How many sequences were replaced.
  errors: number;
}

/** Read the same bytes in every charset (no byte order mark handling: the mark is read as data). */
export function readEverywhere(input: Uint8Array | readonly number[]): Reading[] {
  // The bytes, capped.
  const b = (input instanceof Uint8Array ? input : Uint8Array.from(input)).subarray(0, MAX_BYTES);
  // Each charset.
  return CHARSETS.map((cs) => {
    // Its reading.
    const units = decodeWith(b, cs);
    // The row.
    return { charset: cs, text: textOf(units.slice(0, MAX_PREVIEW)), codePoints: units.length, errors: units.filter((u) => u.error).length };
  });
}

/** One charset's encoding of the same text. */
export interface Writing {
  // The charset.
  charset: CharsetId;
  // The bytes (all of them; the page shortens the display).
  bytes: number[];
  // How many characters it could not hold (written as "?").
  unencodable: number;
}

/** Write the same text in every charset (no BOM, unholdable characters as "?"). */
export function writeEverywhere(text: string): Writing[] {
  // Each charset.
  return CHARSETS.map((cs) => {
    // The encoding.
    const r = encodeText(text, cs, { unencodable: "replace" });
    // The row.
    return { charset: cs, bytes: r.bytes, unencodable: r.unencodable };
  });
}

// ---------------------------------------------------------------------------
// Reading bytes from text: hex, hex dumps, escapes, %XX, Base64
// ---------------------------------------------------------------------------

/** How bytes are written in the input box. */
export type ByteFormat = "auto" | "hex" | "escaped" | "percent" | "base64";

/** What kind of hex dump was recognised. */
export type DumpKind = "hexdump" | "xxd" | "offsets";

/** Why bytes could not be read. */
export type ParseError = "odd-hex" | "bad-char" | "bad-escape" | "bad-base64" | "unrecognised" | "too-long";

/** Bytes read from text. */
export interface ParsedBytes {
  // The bytes.
  bytes: number[];
  // The format used (what "auto" settled on).
  format: Exclude<ByteFormat, "auto">;
  // The dump layout, when the hex was a dump.
  dump?: DumpKind;
  // An error, with the character position it was found at.
  error?: { kind: ParseError; at: number };
  // Literal characters outside ASCII were taken as their UTF-8 bytes.
  utf8Literals: boolean;
  // Base64 used the URL-safe alphabet (RFC 4648 section 5).
  urlSafe: boolean;
}

/** Hex digit value, or -1. */
function hexVal(c: string): number {
  // 0-9.
  if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
  // a-f.
  if (c >= "a" && c <= "f") return c.charCodeAt(0) - 87;
  // A-F.
  if (c >= "A" && c <= "F") return c.charCodeAt(0) - 55;
  // Not hex.
  return -1;
}

/** The UTF-8 bytes of a string (for literal characters in escaped and percent input). */
function utf8Of(s: string): number[] {
  // Each scalar value's bytes.
  return scalarValues(s).cps.flatMap((cp) => encodeCodePoint(cp, "utf-8")!);
}

/** A line of a hex dump: its offset and the text after it. */
interface DumpLine {
  // The offset, as a number.
  offset: number;
  // The text after the offset.
  rest: string;
  // Where the rest starts in the line (for the ASCII column's position).
  restAt: number;
}

/** The offset at the start of a dump line: 4 to 16 hex digits, an optional 0x and an optional colon. */
const DUMP_OFFSET = /^(\s*(?:0x)?([0-9a-fA-F]{4,16}):?)(?=\s|$)/;
/** A hex group in a dump: one to eight bytes written as an even number of hex digits. */
const HEX_GROUP = /^(?:[0-9a-fA-F]{2}){1,8}$/;

/**
 * Read a hex dump (the layouts of hexdump -C, xxd and od -Ax -tx1): every line starts with an
 * offset, the offsets step by the line width, and an ASCII column at the end of a line is skipped
 * (between |bars|, at the column where it starts on the full lines, or, on a dump of one line,
 * after a gap of two spaces). A closing line holding only the total (hexdump and od print one) is
 * checked against the bytes read. Returns null when the text is not such a dump.
 */
function parseDump(text: string): { bytes: number[]; dump: DumpKind } | null {
  // The non-empty lines.
  const raw = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  // At least one line.
  if (raw.length === 0) return null;
  // Each line's offset and rest.
  const lines: DumpLine[] = [];
  // Parse each.
  for (const l of raw) {
    // The offset.
    const m = DUMP_OFFSET.exec(l);
    // Not a dump line: not a dump.
    if (!m) return null;
    // Keep it.
    lines.push({ offset: parseInt(m[2], 16), rest: l.slice(m[1].length), restAt: m[1].length });
  }
  // The layout: bars mean hexdump -C, a colon after the offset means xxd, else bare offsets.
  const dump: DumpKind = raw.some((l) => /\|[^|]*\|\s*$/.test(l)) ? "hexdump" : /^\s*(?:0x)?[0-9a-fA-F]{4,16}:/.test(raw[0]) ? "xxd" : "offsets";
  // A closing line: the last line, with nothing after its offset.
  const closing = lines.length >= 2 && lines[lines.length - 1].rest.trim() === "" ? lines.length - 1 : -1;
  // The data lines.
  const data = closing >= 0 ? lines.slice(0, closing) : lines;
  // One data line is a dump only if it starts at offset 0 and looks like one (bars, a colon, or a long offset).
  if (data.length === 1 && closing < 0 && !(data[0].offset === 0 && (dump !== "offsets" || /^\s*(?:0x)?[0-9a-fA-F]{6,}/.test(raw[0])))) return null;
  // The width: the step between the first two data lines (0 when there is one).
  const width = data.length >= 2 ? data[1].offset - data[0].offset : 0;
  // A sensible width.
  if (data.length >= 2 && (width <= 0 || width > 64)) return null;
  // The bytes.
  const bytes: number[] = [];
  // The column where the ASCII text starts, learned from the full lines.
  let asciiCol = -1;
  // Each data line.
  for (let k = 0; k < data.length; k++) {
    // The line.
    const ln = data[k];
    // The offsets must step by the width (the first line may start anywhere).
    if (k > 0 && ln.offset !== data[0].offset + k * width) return null;
    // The text to read: without a |bar| column.
    const rest = ln.rest.replace(/\|[^|]*\|\s*$/, "");
    // The tokens, with their columns and the gap before each.
    const tokens: { s: string; col: number; gap: number }[] = [];
    // The end of the previous token.
    let prevEnd = -1;
    // Find them.
    for (const m of rest.matchAll(/\S+/g)) { tokens.push({ s: m[0], col: ln.restAt + m.index!, gap: prevEnd < 0 ? 0 : m.index! - prevEnd }); prevEnd = m.index! + m[0].length; }
    // Bytes on this line.
    const lineBytes: number[] = [];
    // A full line is every data line but the last.
    const full = k < data.length - 1;
    // Read groups.
    for (const tk of tokens) {
      // A full line stops after its width, and the next token marks the ASCII column.
      if (full && lineBytes.length >= width) { if (asciiCol < 0) asciiCol = tk.col; break; }
      // The last line stops at the ASCII column learned from the full lines.
      if (!full && asciiCol >= 0 && tk.col >= asciiCol) break;
      // On a one-line xxd dump, two spaces after the bytes start the ASCII column.
      if (!full && asciiCol < 0 && dump === "xxd" && lineBytes.length > 0 && tk.gap >= 2) break;
      // Not a hex group: the ASCII column (or junk) starts here.
      if (!HEX_GROUP.test(tk.s)) break;
      // The group's bytes.
      for (let j = 0; j < tk.s.length; j += 2) lineBytes.push(parseInt(tk.s.slice(j, j + 2), 16));
    }
    // A full line must hold exactly its width.
    if (full && lineBytes.length !== width) return null;
    // Keep them.
    bytes.push(...lineBytes);
  }
  // A closing offset must equal the start plus the bytes read.
  if (closing >= 0 && lines[closing].offset !== data[0].offset + bytes.length) return null;
  // A dump with no bytes is not a dump.
  return bytes.length ? { bytes, dump } : null;
}

/** Read plain hex: pairs of hex digits with any separators, 0x and \x prefixes allowed. */
function parsePlainHex(text: string): { bytes: number[]; error?: { kind: ParseError; at: number } } {
  // The digits, with their positions.
  const digits: { v: number; at: number }[] = [];
  // Walk.
  for (let i = 0; i < text.length; i++) {
    // The character.
    const c = text[i];
    // A 0x or \x prefix is skipped.
    if ((c === "0" || c === "\\") && (text[i + 1] === "x" || text[i + 1] === "X") && hexVal(text[i + 2] ?? "") >= 0 && (c === "\\" || i === 0 || !/[0-9a-fA-F]/.test(text[i - 1]))) { i++; continue; }
    // A hex digit.
    const v = hexVal(c);
    // Keep it.
    if (v >= 0) { digits.push({ v, at: i }); continue; }
    // Separators: white space and common punctuation between bytes.
    if (/[\s,;:.\-_{}[\]()"']/.test(c)) continue;
    // Anything else is an error.
    return { bytes: [], error: { kind: "bad-char", at: i } };
  }
  // An odd number of digits.
  if (digits.length % 2) return { bytes: [], error: { kind: "odd-hex", at: digits[digits.length - 1].at } };
  // Pairs.
  const bytes: number[] = [];
  // Each pair.
  for (let k = 0; k < digits.length; k += 2) bytes.push(digits[k].v * 16 + digits[k + 1].v);
  // Done.
  return { bytes };
}

/** Read escapes as C, Python and git write them: \xHH, octal \NNN, \n \t and friends, literal ASCII. */
function parseEscaped(input: string): { bytes: number[]; error?: { kind: ParseError; at: number }; utf8Literals: boolean } {
  // Strip a b'...' or "..." wrapper, if the whole input is one quoted literal.
  const m = /^\s*b?(['"])([\s\S]*)\1\s*$/.exec(input);
  // The body and where it starts.
  const body = m ? m[2] : input;
  // Offset of the body in the input.
  const base = m ? input.indexOf(m[1]) + 1 : 0;
  // The bytes.
  const bytes: number[] = [];
  // Literal non-ASCII seen.
  let utf8Literals = false;
  // The simple escapes.
  const SIMPLE: Record<string, number> = { n: 10, t: 9, r: 13, a: 7, b: 8, f: 12, v: 11, "\\": 92, "'": 39, '"': 34, "?": 63 };
  // Walk.
  for (let i = 0; i < body.length; ) {
    // The character.
    const c = body[i];
    // Not an escape: a literal character.
    if (c !== "\\") {
      // Its bytes (UTF-8 for anything beyond ASCII).
      const cp = body.codePointAt(i)!;
      // Literal non-ASCII.
      if (cp > 0x7f) utf8Literals = true;
      // Append.
      bytes.push(...utf8Of(String.fromCodePoint(cp)));
      // Next.
      i += cp > 0xffff ? 2 : 1;
      // Continue.
      continue;
    }
    // The escape letter.
    const e = body[i + 1];
    // \x and one or two hex digits.
    if (e === "x" && hexVal(body[i + 2] ?? "") >= 0) {
      // One or two digits.
      const two = hexVal(body[i + 3] ?? "") >= 0;
      // The value.
      bytes.push(two ? hexVal(body[i + 2]) * 16 + hexVal(body[i + 3]) : hexVal(body[i + 2]));
      // Past it.
      i += two ? 4 : 3;
      // Continue.
      continue;
    }
    // Octal: one to three digits, at most 0o377.
    if (e !== undefined && e >= "0" && e <= "7") {
      // Up to three digits.
      let j = i + 1, v = 0;
      // Read them.
      while (j < body.length && j < i + 4 && body[j] >= "0" && body[j] <= "7") { v = v * 8 + (body.charCodeAt(j) - 48); j++; }
      // Above a byte.
      if (v > 0xff) return { bytes: [], error: { kind: "bad-escape", at: base + i }, utf8Literals };
      // Append.
      bytes.push(v);
      // Past it.
      i = j;
      // Continue.
      continue;
    }
    // A simple escape.
    if (e !== undefined && e in SIMPLE) { bytes.push(SIMPLE[e]); i += 2; continue; }
    // Anything else is not understood.
    return { bytes: [], error: { kind: "bad-escape", at: base + i }, utf8Literals };
  }
  // Done.
  return { bytes, utf8Literals };
}

/** Percent-decode as the WHATWG URL Standard does: %XX is a byte, anything else is its UTF-8 bytes. */
function parsePercent(input: string): { bytes: number[]; utf8Literals: boolean } {
  // The bytes.
  const bytes: number[] = [];
  // Literal non-ASCII seen.
  let utf8Literals = false;
  // Walk the code points.
  for (let i = 0; i < input.length; ) {
    // A percent sign followed by two hex digits.
    if (input[i] === "%" && hexVal(input[i + 1] ?? "") >= 0 && hexVal(input[i + 2] ?? "") >= 0) { bytes.push(hexVal(input[i + 1]) * 16 + hexVal(input[i + 2])); i += 3; continue; }
    // Any other character, a lone % included, is its UTF-8 bytes.
    const cp = input.codePointAt(i)!;
    // Beyond ASCII.
    if (cp > 0x7f) utf8Literals = true;
    // Append.
    bytes.push(...utf8Of(String.fromCodePoint(cp)));
    // Next.
    i += cp > 0xffff ? 2 : 1;
  }
  // Done.
  return { bytes, utf8Literals };
}

/** The Base64 alphabet (RFC 4648 section 4). */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Base64 as the WHATWG "forgiving-base64 decode", also accepting the URL-safe alphabet. */
function parseBase64(input: string): { bytes: number[]; error?: { kind: ParseError; at: number }; urlSafe: boolean } {
  // Remove ASCII white space.
  let s = input.replace(/[\t\n\f\r ]/g, "");
  // The URL-safe alphabet (RFC 4648 section 5) uses - and _ for + and /.
  const urlSafe = /[-_]/.test(s);
  // Map it to the standard one.
  if (urlSafe) s = s.replace(/-/g, "+").replace(/_/g, "/");
  // A length divisible by 4 may end in one or two = signs.
  if (s.length % 4 === 0) s = s.replace(/={1,2}$/, "");
  // A remainder of 1 cannot be Base64.
  if (s.length % 4 === 1) return { bytes: [], error: { kind: "bad-base64", at: input.length }, urlSafe };
  // Any character outside the alphabet.
  const bad = s.search(/[^A-Za-z0-9+/]/);
  // Report where it is in the input.
  if (bad >= 0) return { bytes: [], error: { kind: "bad-base64", at: Math.max(0, input.indexOf(s[bad])) }, urlSafe };
  // The bytes.
  const bytes: number[] = [];
  // Bits waiting, and how many.
  let acc = 0, n = 0;
  // Each character gives six bits.
  for (const c of s) {
    // Add six bits.
    acc = (acc << 6) | B64.indexOf(c); n += 6;
    // A whole byte.
    if (n >= 8) { n -= 8; bytes.push((acc >> n) & 0xff); }
  }
  // Done.
  return { bytes, urlSafe };
}

/** Read bytes written as text, in a format or by detecting it. */
export function parseBytes(input: string, format: ByteFormat = "auto"): ParsedBytes {
  // Too long to be a byte string this tool reads.
  if (input.length > MAX_BYTES * 4) return { bytes: [], format: "hex", error: { kind: "too-long", at: MAX_BYTES * 4 }, utf8Literals: false, urlSafe: false };
  // The format to use.
  let f: Exclude<ByteFormat, "auto">;
  // Detect.
  if (format === "auto") {
    // %XX anywhere: percent-encoding.
    if (/%[0-9a-fA-F]{2}/.test(input)) f = "percent";
    // \x.. or \NNN: escapes.
    else if (/\\x[0-9a-fA-F]|\\[0-7]{1,3}/.test(input)) f = "escaped";
    // A dump, or nothing but hex digits, prefixes and separators (an odd digit count is then a hex error, not Base64).
    else if (parseDump(input) || /^[\s0-9a-fA-FxX,;:.\-_{}[\]()"'\\]+$/.test(input)) f = "hex";
    // The Base64 alphabet only.
    else if (/^[\sA-Za-z0-9+/=_-]+$/.test(input)) f = "base64";
    // Nothing fits.
    else return { bytes: [], format: "hex", error: { kind: "unrecognised", at: 0 }, utf8Literals: false, urlSafe: false };
  } else f = format;
  // Each format.
  switch (f) {
    // Hex: a dump first, then plain hex.
    case "hex": {
      // A dump.
      const d = parseDump(input);
      // Found.
      if (d) return { bytes: d.bytes, format: "hex", dump: d.dump, utf8Literals: false, urlSafe: false };
      // Plain hex.
      const p = parsePlainHex(input);
      // Done.
      return { bytes: p.bytes, format: "hex", error: p.error, utf8Literals: false, urlSafe: false };
    }
    // Escapes.
    case "escaped": {
      // Read.
      const p = parseEscaped(input);
      // Done.
      return { bytes: p.bytes, format: "escaped", error: p.error, utf8Literals: p.utf8Literals, urlSafe: false };
    }
    // Percent-encoding.
    case "percent": {
      // Read.
      const p = parsePercent(input);
      // Done.
      return { bytes: p.bytes, format: "percent", utf8Literals: p.utf8Literals, urlSafe: false };
    }
    // Base64.
    default: {
      // Read.
      const p = parseBase64(input);
      // Done.
      return { bytes: p.bytes, format: "base64", error: p.error, utf8Literals: false, urlSafe: p.urlSafe };
    }
  }
}

// ---------------------------------------------------------------------------
// Writing bytes as text
// ---------------------------------------------------------------------------

/** The ways bytes can be written out. */
export type ByteStyle = "hex" | "dump" | "c" | "python" | "base64" | "percent";

/** Every byte style, in the order the page offers them. */
export const BYTE_STYLES: readonly ByteStyle[] = ["hex", "dump", "c", "python", "base64", "percent"];

/** Two hex digits. */
const hh = (b: number, upper = true) => (upper ? b.toString(16).toUpperCase() : b.toString(16)).padStart(2, "0");

/** Write bytes in a style. */
export function formatBytes(bytes: readonly number[], style: ByteStyle): string {
  // Each style.
  switch (style) {
    // Upper-case pairs separated by spaces.
    case "hex": return bytes.map((b) => hh(b)).join(" ");
    // The layout of hexdump -C (util-linux): offset, 16 bytes in two groups of 8, |ASCII|, a closing offset.
    case "dump": {
      // No bytes, no output (as hexdump prints nothing for an empty file).
      if (bytes.length === 0) return "";
      // The lines.
      const lines: string[] = [];
      // Sixteen bytes per line.
      for (let off = 0; off < bytes.length; off += 16) {
        // This line's bytes.
        const row = bytes.slice(off, off + 16);
        // The hex area: each byte as "xx ", an extra space after the eighth, padded to full width.
        let hex = "";
        // Each of the sixteen positions.
        for (let i = 0; i < 16; i++) hex += (i === 8 ? " " : "") + (i < row.length ? hh(row[i], false) + " " : "   ");
        // Printable ASCII as itself, anything else as a dot.
        const ascii = row.map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : ".")).join("");
        // The line.
        lines.push(`${off.toString(16).padStart(8, "0")}  ${hex} |${ascii}|`);
      }
      // The closing offset.
      lines.push(bytes.length.toString(16).padStart(8, "0"));
      // Done.
      return lines.join("\n");
    }
    // A C array initialiser.
    case "c": return `{ ${bytes.map((b) => "0x" + hh(b)).join(", ")} }`;
    // Python's repr() of a bytes object.
    case "python": {
      // Double quotes only when the bytes hold a ' and no ".
      const q = bytes.includes(0x27) && !bytes.includes(0x22) ? '"' : "'";
      // Each byte.
      const body = bytes.map((b) => {
        // The quote in use and the backslash are escaped.
        if (b === q.charCodeAt(0) || b === 0x5c) return "\\" + String.fromCharCode(b);
        // Tab, line feed and carriage return have short escapes.
        if (b === 9) return "\\t";
        // Line feed.
        if (b === 10) return "\\n";
        // Carriage return.
        if (b === 13) return "\\r";
        // Other controls and bytes of 0x7F and up: \xhh in lower case.
        if (b < 0x20 || b >= 0x7f) return "\\x" + hh(b, false);
        // Printable ASCII is itself.
        return String.fromCharCode(b);
      }).join("");
      // The literal.
      return `b${q}${body}${q}`;
    }
    // Base64 with padding (RFC 4648 section 4).
    case "base64": {
      // The output.
      let out = "";
      // Three bytes at a time.
      for (let i = 0; i < bytes.length; i += 3) {
        // Up to 24 bits.
        const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
        // Four characters, padded with = when the group is short.
        out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=") + (i + 2 < bytes.length ? B64[n & 63] : "=");
      }
      // Done.
      return out;
    }
    // Percent-encoding: RFC 3986 unreserved characters as themselves, every other byte as %XX.
    default: return bytes.map((b) => (/[A-Za-z0-9\-._~]/.test(String.fromCharCode(b)) && b < 0x80 ? String.fromCharCode(b) : "%" + hh(b))).join("");
  }
}

// ---------------------------------------------------------------------------
// Mojibake repair
// ---------------------------------------------------------------------------

/** Charsets that commonly misread text (the "wrong" decoder), in the order tried (ties go to the earlier). */
export const MISREADERS: readonly CharsetId[] = ["windows-1252", "iso-8859-1", "ibm850", "ibm437", "iso-8859-15", "macintosh"];
/** Single-byte charsets the bytes may really have been in (UTF-8 is tried first, on its own). */
export const SINGLE_ORIGINALS: readonly CharsetId[] = ["windows-1252", "ibm850", "ibm437", "iso-8859-15", "macintosh", "ibm037", "ibm500"];

/** Letters. */
const RE_LETTER = /\p{L}/u;
/** Upper-case letters. */
const RE_UPPER = /\p{Lu}/u;
/** Lower-case letters. */
const RE_LOWER = /\p{Ll}/u;
/** Symbols. */
const RE_SYMBOL = /\p{S}/u;
/** Punctuation. */
const RE_PUNCT = /\p{P}/u;
/** Punctuation that belongs inside words: right and left single quotation marks, the modifier apostrophe, the Catalan middle dot. */
const WORD_PUNCT = new Set([0x2019, 0x2018, 0x02bc, 0x00b7].map((c) => String.fromCharCode(c)));
/** Dashes (general category Pd), which join words and ranges (an en dash in PPA-PYZ or 1990-2000). */
const RE_DASH = /\p{Pd}/u;
/** What windows-1252 shows for bytes 0x80 to 0x9F (the characters UTF-8 continuation bytes become), from its own table, C1 controls left out. */
const W1252_C1_GLYPHS: ReadonlySet<string> = new Set(TABLES["windows-1252"].cps.slice(0, 0x20).filter((cp) => cp > 0x9f).map((cp) => String.fromCharCode(cp)));
/** Characters beyond ASCII that ordinary Western European text uses: accented letters, then quotation marks, dashes, the ellipsis, guillemets, inverted marks, ordinals, the degree sign, euro, pound, copyright, registered and the no-break space. */
const COMMON: ReadonlySet<string> = new Set([...Array.from("áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑß"), ...[0x2019, 0x2018, 0x201c, 0x201d, 0x2013, 0x2014, 0x2026, 0x00ab, 0x00bb, 0x00bf, 0x00a1, 0x00ba, 0x00aa, 0x00b0, 0x20ac, 0x00a3, 0x00a9, 0x00ae, 0x00a0].map((c) => String.fromCharCode(c))]);

/** Whether a character is what a UTF-8 continuation byte (0x80-0xBF) looks like in Latin-1 or windows-1252. */
function looksLikeContinuation(ch: string): boolean {
  // Nothing.
  if (!ch) return false;
  // The code point.
  const cp = ch.codePointAt(0)!;
  // U+0080 to U+00BF (Latin-1), or a windows-1252 symbol from 0x80-0x9F.
  return (cp >= 0x80 && cp <= 0xbf) || W1252_C1_GLYPHS.has(ch);
}

/** The script group of a letter, for the mixed-script check (Han, kana and Hangul count as one group, as CJK text mixes them). */
function scriptGroup(ch: string): string {
  // Latin.
  if (/\p{Script=Latin}/u.test(ch)) return "Latn";
  // Greek.
  if (/\p{Script=Greek}/u.test(ch)) return "Grek";
  // Cyrillic.
  if (/\p{Script=Cyrillic}/u.test(ch)) return "Cyrl";
  // Arabic.
  if (/\p{Script=Arabic}/u.test(ch)) return "Arab";
  // Hebrew.
  if (/\p{Script=Hebrew}/u.test(ch)) return "Hebr";
  // Chinese, Japanese and Korean scripts together.
  if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}]/u.test(ch)) return "CJK";
  // Anything else.
  return "Other";
}

/**
 * How much a text looks like mojibake: a sum of penalties, zero for ordinary text. Replacement
 * characters, controls other than tab, line feed and carriage return, private-use characters,
 * box-drawing characters, the pairs UTF-8 leaves behind when read as Latin-1 or windows-1252 (a
 * UTF-8 lead byte, U+00C2 to U+00F4, followed by what a continuation byte looks like: Ã© for é, â€
 * for the start of ’), a symbol or stray punctuation mark inside a word, a currency sign glued to
 * a letter, a capital letter inside a lower-case word, a word mixing scripts, and a word made only
 * of accented Latin letters.
 */
export function mojibakeScore(text: string): number {
  // The characters.
  const chars = Array.from(text);
  // The total.
  let score = 0;
  // Each character with its neighbours.
  chars.forEach((ch, i) => {
    // The code point.
    const cp = ch.codePointAt(0)!;
    // Neighbours.
    const prev = chars[i - 1] ?? "", next = chars[i + 1] ?? "";
    // A replacement character.
    if (cp === 0xfffd) { score += 10; return; }
    // C0 controls other than tab, line feed and carriage return; DEL; C1 controls.
    if ((cp < 0x20 && cp !== 9 && cp !== 10 && cp !== 13) || (cp >= 0x7f && cp <= 0x9f)) { score += 5; return; }
    // Private use and unassigned code points (what a wrong UTF-8 reading of Mac or DOS text often lands on).
    if ((cp >= 0xe000 && cp <= 0xf8ff) || cp >= 0xf0000 || /\p{Cn}/u.test(ch)) { score += 6; return; }
    // Box drawing and block elements (what DOS code pages put in their upper half).
    if (cp >= 0x2500 && cp <= 0x259f) { score += 3; return; }
    // Beyond ASCII here or on either side (plain ASCII words such as McDonald are not judged).
    const nearHigh = cp > 0x7f || (prev !== "" && prev.codePointAt(0)! > 0x7f) || (next !== "" && next.codePointAt(0)! > 0x7f);
    // An upper-case letter right after a lower-case one.
    if (nearHigh && RE_UPPER.test(ch) && RE_LOWER.test(prev)) score += 2;
    // An upper-case letter after a letter and before a lower-case one (a capital inside a word).
    else if (nearHigh && RE_UPPER.test(ch) && RE_LETTER.test(prev) && RE_LOWER.test(next)) score += 2;
    // ASCII is not suspect by itself.
    if (cp < 0x80) return;
    // A UTF-8 lead byte read as Latin-1 or windows-1252, followed by a continuation byte read the same way.
    if (cp >= 0xc2 && cp <= 0xf4 && looksLikeContinuation(next)) score += 4;
    // A currency sign directly followed by a letter.
    if (/\p{Sc}/u.test(ch) && RE_LETTER.test(next)) score += 2;
  });
  // Inside each run of non-space characters: a symbol, or punctuation that does not belong in words,
  // with a letter somewhere before it and somewhere after it.
  for (const m of text.matchAll(/\S+/gu)) {
    // The run's characters.
    const run = Array.from(m[0]);
    // The first and last letters.
    const first = run.findIndex((c) => RE_LETTER.test(c)), last = run.length - 1 - [...run].reverse().findIndex((c) => RE_LETTER.test(c));
    // No letters, or one.
    if (first < 0 || last <= first) continue;
    // Each character between them.
    for (let k = first + 1; k < last; k++) {
      // The character.
      const c = run[k];
      // Beyond ASCII, a symbol, or punctuation that is neither a dash nor an apostrophe.
      if (c.codePointAt(0)! > 0x7f && (RE_SYMBOL.test(c) || (RE_PUNCT.test(c) && !RE_DASH.test(c) && !WORD_PUNCT.has(c)))) score += 3;
    }
  }
  // Each word (a run of letters).
  for (const m of text.matchAll(/\p{L}+/gu)) {
    // Its letters.
    const letters = Array.from(m[0]);
    // Letters from more than one script group.
    if (new Set(letters.map(scriptGroup)).size > 1) score += 4;
    // Two letters or more, all accented Latin (U+00C0 to U+017F).
    if (letters.length >= 2 && letters.every((c) => c.codePointAt(0)! >= 0xc0 && c.codePointAt(0)! <= 0x17f)) score += 2;
  }
  // Done.
  return score;
}

/** Whether a text holds a UTF-8 lead byte followed by a continuation byte, both read as Latin-1 or windows-1252. */
export function hasUtf8Pairs(text: string): boolean {
  // The characters.
  const chars = Array.from(text);
  // Any pair.
  return chars.some((ch, i) => { const cp = ch.codePointAt(0)!; return cp >= 0xc2 && cp <= 0xf4 && looksLikeContinuation(chars[i + 1] ?? ""); });
}

/** How many characters beyond ASCII are not ones ordinary Western European text uses. */
export function rareCount(text: string): number {
  // Count them.
  return Array.from(text).filter((c) => c.codePointAt(0)! > 0x7f && !COMMON.has(c)).length;
}

/** One step of a repair: the text was read as `misread` when its bytes were really `original`. */
export interface RepairStep {
  // The charset that misread the bytes (the text is encoded back with it).
  misread: CharsetId;
  // The charset the bytes were really in (they are decoded with it).
  original: CharsetId;
}

/** One repair candidate. */
export interface RepairCandidate {
  // The repaired text.
  text: string;
  // The steps, first undone first.
  steps: RepairStep[];
  // Its mojibake score.
  score: number;
  // How strong the evidence is: well-formed UTF-8 came out ("utf8"), or only a better-looking text ("looks").
  evidence: "utf8" | "looks";
  // Whether some bytes could not be recovered (U+FFFD stands in for them).
  lossy: boolean;
  // How many replacement characters the repair had to insert.
  lost: number;
}

/** A repair. */
export interface RepairResult {
  // The input's mojibake score.
  inputScore: number;
  // The candidates, best first (at most five).
  candidates: RepairCandidate[];
  // The input was longer than MAX_REPAIR_CODE_POINTS.
  truncated: boolean;
}

/**
 * Undo one misreading: encode with the charset that misread, decode with the original. Strictly, no
 * replacement is allowed. Leniently, a replacement is allowed only where a multi-byte sequence lost
 * bytes (a lead byte and at least one continuation byte, then the data ends or breaks off), which is
 * what remains when a misread character was dropped; a single byte that cannot start a sequence was a
 * correct character, and makes the lenient repair fail.
 */
export function undoStep(text: string, step: RepairStep, lenient = false): { text: string; lost: number } | null {
  // Encode back strictly: a character the misreader could not have produced means this was not it.
  const enc = encodeText(text, step.misread, { unencodable: "strict" });
  // Not possible.
  if (enc.failed) return null;
  // Decode with the original charset.
  const units = decodeWith(Uint8Array.from(enc.bytes), step.original);
  // The replacements made.
  const errors = units.filter((u) => u.error);
  // A strict repair allows none.
  if (errors.length > 0 && !lenient) return null;
  // A lenient one allows only cut-short sequences of two bytes or more.
  if (errors.some((u) => !((u.error === "truncated" || u.error === "truncated-end") && u.len >= 2))) return null;
  // The text.
  return { text: textOf(units), lost: errors.length };
}

/**
 * Whether a text looks like EBCDIC bytes read as Latin-1 or windows-1252: at least half of it U+0080
 * to U+00FF (or windows-1252 symbols), no ASCII space (EBCDIC's space, 0x40, reads as @), and either
 * few ASCII letters (EBCDIC letters all land above 0x80) or many C1 controls (EBCDIC's lower-case
 * letters a to r land on them in Latin-1).
 */
function looksLikeEbcdicMisread(text: string): boolean {
  // The characters.
  const chars = Array.from(text);
  // Nothing.
  if (chars.length === 0 || text.includes(" ")) return false;
  // In U+0080 to U+00FF, or one of windows-1252's symbols.
  const high = chars.filter((c) => (c.codePointAt(0)! >= 0x80 && c.codePointAt(0)! <= 0xff) || W1252_C1_GLYPHS.has(c)).length;
  // ASCII letters.
  const asciiLetters = chars.filter((c) => /[A-Za-z]/.test(c)).length;
  // C1 controls.
  const c1 = chars.filter((c) => c.codePointAt(0)! >= 0x80 && c.codePointAt(0)! <= 0x9f).length;
  // The test.
  return high >= chars.length * 0.5 && (asciiLetters <= chars.length * 0.25 || c1 >= chars.length * 0.25);
}

/**
 * Repair mojibake in two tiers. First, UTF-8 read as a single-byte charset: encode back with that
 * charset and decode as UTF-8; well-formed UTF-8 coming out of bytes beyond ASCII is strong
 * evidence, so a result is kept when it looks no worse, and up to three rounds undo text that was
 * misread more than once. Second, one single-byte charset read as another (an IBM 850 file shown as
 * windows-1252, EBCDIC shown as Latin-1): every byte decodes, so a result is kept only when its
 * mojibake score is lower. Ties in the ranking go to the text with fewer unusual characters. When
 * nothing else works, a lenient UTF-8 pass recovers what it can and counts the bytes that were lost.
 */
export function repairText(input: string): RepairResult {
  // Capped.
  const cps = Array.from(input).slice(0, MAX_REPAIR_CODE_POINTS);
  // The text.
  const text = cps.join("");
  // Its score.
  const inputScore = mojibakeScore(text);
  // Best candidate per distinct text, in the order found.
  const found = new Map<string, RepairCandidate>();
  // Tier 1: UTF-8, up to three rounds.
  let frontier: RepairCandidate[] = [{ text, steps: [], score: inputScore, evidence: "utf8", lossy: false, lost: 0 }];
  // Each round.
  for (let round = 0; round < 3 && frontier.length; round++) {
    // The next frontier.
    const next: RepairCandidate[] = [];
    // Each text so far.
    for (const c of frontier) {
      // Each misreader.
      for (const misread of MISREADERS) {
        // Undo strictly.
        const r = undoStep(c.text, { misread, original: "utf-8" });
        // Not possible, or no change.
        if (!r || r.text === c.text || r.text === text) continue;
        // The candidate.
        const cand: RepairCandidate = { text: r.text, steps: [...c.steps, { misread, original: "utf-8" }], score: mojibakeScore(r.text), evidence: "utf8", lossy: false, lost: 0 };
        // It must look no worse than what it came from.
        if (cand.score > c.score) continue;
        // Keep the first way to each text.
        if (!found.has(cand.text)) { found.set(cand.text, cand); next.push(cand); }
      }
    }
    // The best few go on.
    frontier = next.sort((a, b) => a.score - b.score).slice(0, 6);
  }
  // Tier 2: one single-byte charset read as another, one round. EBCDIC originals when the text looks
  // like EBCDIC misread; the others only when the text shows no UTF-8 misread (a text mixing correct
  // characters with such pairs is left as it is).
  const utf8Pairs = hasUtf8Pairs(text), ebcdicLike = looksLikeEbcdicMisread(text);
  // Each misreader.
  for (const misread of MISREADERS) {
    // Each original.
    for (const original of SINGLE_ORIGINALS) {
      // Not the same charset.
      if (misread === original) continue;
      // The gates.
      if (FACTS[original].ebcdic ? !ebcdicLike : utf8Pairs) continue;
      // Undo.
      const r = undoStep(text, { misread, original });
      // Not possible, no change, or already found.
      if (!r || r.text === text || found.has(r.text)) continue;
      // Its score.
      const score = mojibakeScore(r.text);
      // It must look better (every byte decodes in these charsets, so looking no worse is not enough).
      if (score >= inputScore) continue;
      // Keep it.
      found.set(r.text, { text: r.text, steps: [{ misread, original }], score, evidence: "looks", lossy: false, lost: 0 });
    }
  }
  // Nothing at all: a lenient UTF-8 pass.
  if (found.size === 0) {
    // Characters beyond ASCII in the input.
    const high = cps.filter((c) => c.codePointAt(0)! > 0x7f).length;
    // Each misreader.
    for (const misread of MISREADERS) {
      // Undo with replacement.
      const r = undoStep(text, { misread, original: "utf-8" }, true);
      // Not possible, no change, nothing lost (that would have been found above), or too much lost.
      if (!r || r.text === text || r.lost === 0 || r.lost > Math.max(1, Math.floor(high / 4))) continue;
      // Its score, counting each marked replacement as one point instead of ten.
      const score = mojibakeScore(r.text) - 9 * r.lost;
      // It must look better.
      if (score < inputScore && !found.has(r.text)) found.set(r.text, { text: r.text, steps: [{ misread, original: "utf-8" }], score, evidence: "utf8", lossy: true, lost: r.lost });
    }
  }
  // Rank: lossless before lossy, then score, UTF-8 evidence before looks, fewer unusual characters, fewer steps; keep the order found otherwise.
  const ranked = [...found.values()].map((c, i) => ({ c, i })).sort((a, b) =>
    Number(a.c.lossy) - Number(b.c.lossy) || a.c.score - b.c.score || Number(a.c.evidence === "looks") - Number(b.c.evidence === "looks") || rareCount(a.c.text) - rareCount(b.c.text) || a.c.steps.length - b.c.steps.length || a.i - b.i);
  // When a lossless UTF-8 repair leads, the weaker "looks better" readings are left out; of the lossy
  // readings, only the best is kept.
  const lead = ranked[0]?.c;
  // Keep the rest.
  const kept = (lead && !lead.lossy && lead.evidence === "utf8" ? ranked.filter((x) => x.c.evidence === "utf8") : ranked).filter((x, k, all) => !x.c.lossy || all.findIndex((y) => y.c.lossy) === k);
  // Done.
  return { inputScore, candidates: kept.slice(0, 5).map((x) => x.c), truncated: Array.from(input).length > cps.length };
}

// ---------------------------------------------------------------------------
// The tool's entry point
// ---------------------------------------------------------------------------

/** The tool's input. */
export type CharsetInput =
  // Text to bytes.
  | { mode: "encode"; text: string; charset: CharsetId; bom?: boolean; unencodable?: Unencodable }
  // Bytes to text.
  | { mode: "decode"; bytes: string; format?: ByteFormat; charset: CharsetId | "auto"; sniffBom?: boolean }
  // Mojibake to text.
  | { mode: "repair"; text: string };

/** The tool's output. */
export type CharsetResult =
  // Encoded: the result, every byte style, the same text in every charset, the bytes read back in every charset.
  | { mode: "encode"; result: EncodeResult; styles: Record<ByteStyle, string>; everywhere: Writing[]; readBack: Reading[] }
  // Decoded: what was read from the box, the decoding, and the same bytes in every charset.
  | { mode: "decode"; parsed: ParsedBytes; result: DecodeResult | null; everywhere: Reading[] }
  // Repaired.
  | { mode: "repair"; result: RepairResult }
  // A malformed request.
  | { mode: "error"; error: string };

/** Run the tool. */
export function run(input: CharsetInput): CharsetResult {
  // The mode.
  switch (input?.mode) {
    // Encode.
    case "encode": {
      // A charset is required.
      if (!isCharset(input.charset)) return { mode: "error", error: "unknown charset" };
      // Encode.
      const result = encodeText(String(input.text ?? ""), input.charset, { bom: !!input.bom, unencodable: input.unencodable ?? "replace" });
      // Every style of the bytes.
      const styles = Object.fromEntries(BYTE_STYLES.map((s) => [s, formatBytes(result.bytes, s)])) as Record<ByteStyle, string>;
      // The rest.
      return { mode: "encode", result, styles, everywhere: writeEverywhere(String(input.text ?? "")), readBack: readEverywhere(result.bytes) };
    }
    // Decode.
    case "decode": {
      // A charset or "auto" is required.
      if (input.charset !== "auto" && !isCharset(input.charset)) return { mode: "error", error: "unknown charset" };
      // Read the bytes.
      const parsed = parseBytes(String(input.bytes ?? ""), input.format ?? "auto");
      // Unreadable: no decoding.
      if (parsed.error) return { mode: "decode", parsed, result: null, everywhere: [] };
      // Decode.
      const result = decodeBytes(parsed.bytes, input.charset, { sniffBom: input.sniffBom !== false });
      // With every reading.
      return { mode: "decode", parsed, result, everywhere: readEverywhere(parsed.bytes) };
    }
    // Repair.
    case "repair": return { mode: "repair", result: repairText(String(input.text ?? "")) };
    // Anything else.
    default: return { mode: "error", error: "mode must be encode, decode or repair" };
  }
}
