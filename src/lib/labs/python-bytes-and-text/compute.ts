// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/python-bytes-and-text/compute.ts
// ----------------------------------------------------------------------------
// THE BYTES-AND-TEXT LAB'S MODEL (Python run, 2026-10-27), the interactive
// companion of the article "Python's bytes and text: encode, decode and the
// bugs in between" (its section on error handlers). The reader types a text,
// encodes it with one codec and an error handler, then decodes the bytes with
// a codec and a handler of their choice, as this Python expression would:
//
//     text.encode(codec_a, errors=handler_a).decode(codec_b, errors=handler_b)
//
// and the model answers, as CPython 3.13 does, with the bytes, the text that
// comes back, and the exception and its message where a strict step fails.
//
// THE RULES, each stated in the article with its source (read 2026-10-27):
//   1. A str is a sequence of Unicode code points; bytes are a sequence of
//      integers 0 to 255 (Python library reference, Built-in Types).
//   2. UTF-8 writes a code point in 1 to 4 octets by the ranges of RFC 3629,
//      section 3, and a decoder accepts only the well-formed sequences of
//      RFC 3629, section 4 (no overlong forms, no surrogates, nothing above
//      U+10FFFF). When a sequence is not well formed, CPython reports as one
//      error the longest start of a well-formed sequence it found, with one of
//      three reasons: "invalid start byte", "invalid continuation byte" or
//      "unexpected end of data" (the decoder's own messages, recorded from
//      CPython 3.13.16 in the article's runs).
//   3. UTF-16-LE and UTF-16-BE write a code point below U+10000 as one 16-bit
//      unit and the others as a surrogate pair (RFC 2781, section 2.1), in the
//      byte order their name gives (Python library reference, codecs: Encodings
//      and Unicode). Decoding refuses a lone trailing byte ("truncated data"),
//      a low surrogate on its own ("illegal encoding"), a high surrogate not
//      followed by a low one ("illegal UTF-16 surrogate") and a high surrogate
//      at the end ("unexpected end of data"), as CPython 3.13 reports them.
//   4. Latin-1 maps code points 0 to 255 to bytes 0x00 to 0xFF one to one, so
//      it encodes nothing above U+00FF and never fails to decode (codecs:
//      Encodings and Unicode). ASCII stops at 127 ("ordinal not in range(128)").
//      Windows-1252 (cp1252) is Unicode's published mapping table CP1252.TXT:
//      Latin-1 except 0x80 to 0x9F, where 27 bytes are typographic characters
//      and 0x81, 0x8D, 0x8F, 0x90 and 0x9D are undefined; CPython names its
//      errors "charmap" ... "character maps to <undefined>".
//   5. The error handlers do what the codecs documentation's table says:
//      strict raises; ignore drops; replace puts "?" when encoding and one
//      U+FFFD per error when decoding; backslashreplace writes \xhh, \uxxxx or
//      \Uxxxxxxxx when encoding and \xhh per byte when decoding;
//      xmlcharrefreplace (encoding only) writes &#num; in decimal;
//      surrogateescape (PEP 383) turns each undecodable byte of 128 or more into
//      U+DC80 to U+DCFF and refuses to escape a byte below 128, and the same
//      handler on encoding turns those surrogates back into the bytes.
//   6. A strict failure raises UnicodeEncodeError or UnicodeDecodeError, whose
//      message names the codec, the character or byte, the position and the
//      reason; a run of characters the codec cannot encode is one error
//      ("characters in position a-b"), as CPython reports it.
//   7. repr() of a str escapes what is not printable (Unicode categories Other
//      and Separator, except the ASCII space) as \xhh, \uxxxx or \Uxxxxxxxx;
//      repr() of bytes shows printable ASCII as itself and every other byte as
//      \xhh (Built-in Types, str.isprintable and the bytes representation).
//
// WHAT IT LEAVES OUT, stated in the lab's scope note: every other codec
// (UTF-32, the utf-16 codec that writes a byte order mark, utf-8-sig, the
// other code pages), the namereplace handler (it needs the Unicode name
// database), surrogatepass, incremental decoding, and normalisation. Whether a
// character is printable follows the browser's Unicode tables, which can be a
// version apart from Python's (3.13 uses Unicode 15.1) for characters assigned
// since. The text is limited to 48 code points and may not hold a lone
// surrogate, which a typed text cannot carry.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The codecs the lab offers, by the names Python accepts for them. */
export const CODECS = ["utf-8", "utf-16-le", "utf-16-be", "latin-1", "cp1252", "ascii"] as const;
/** One of the lab's codecs. */
export type Codec = (typeof CODECS)[number];
/** The error handlers the lab offers on the encoding side. */
export const ENCODE_HANDLERS = ["strict", "ignore", "replace", "backslashreplace", "xmlcharrefreplace"] as const;
/** One encoding-side handler. */
export type EncodeHandler = (typeof ENCODE_HANDLERS)[number];
/** The error handlers the lab offers on the decoding side. */
export const DECODE_HANDLERS = ["strict", "ignore", "replace", "backslashreplace", "surrogateescape"] as const;
/** One decoding-side handler. */
export type DecodeHandler = (typeof DECODE_HANDLERS)[number];
/** The longest text the lab accepts, in code points (a bound of the lab, not of Python). */
export const MAX_TEXT_CODE_POINTS = 48;

/** The reader's settings. */
export interface BytesTextInput {
  /** The text, as typed. */
  text: string;
  /** The codec that turns the text into bytes. */
  encodeCodec: Codec;
  /** What the encoder does with a character its codec cannot write. */
  encodeErrors: EncodeHandler;
  /** The codec that turns the bytes back into text. */
  decodeCodec: Codec;
  /** What the decoder does with bytes its codec cannot read. */
  decodeErrors: DecodeHandler;
}

/** A failed step, as Python reports it. */
export interface CodecFailure {
  /** The exception Python raises. */
  exception: "UnicodeEncodeError" | "UnicodeDecodeError";
  /** The codec name CPython puts in the message ("charmap" for cp1252). */
  codecName: string;
  /** The first position the error covers (code points when encoding, bytes when decoding). */
  start: number;
  /** One past the last position it covers. */
  end: number;
  /** The reason, in CPython's words. */
  reason: string;
  /** The whole message, as str() of the exception prints it. */
  message: string;
}

/** One character of the text and what the encoder made of it. */
export interface CharRow {
  /** The character's code point. */
  cp: number;
  /** The bytes written for it (the handler's bytes when the codec cannot write it; empty when dropped). */
  bytes: number[];
  /** True when the codec could not write it and a handler stepped in (or would have, under strict). */
  unencodable: boolean;
}

/** How the round trip ended. */
export type Verdict = "round-trip" | "mojibake" | "lossy-encode" | "lossy-decode" | "escaped" | "encode-error" | "decode-error";

/** The second encoding of a surrogateescape decode: do the original bytes come back? */
export interface BytesBack {
  /** The bytes written by encoding the decoded text with the decoding codec and surrogateescape (null when it fails). */
  bytes: number[] | null;
  /** Whether they equal the bytes that were decoded (null when the encoding fails). */
  same: boolean | null;
  /** The failure, when the encoding fails. */
  failure: CodecFailure | null;
}

/** The model's answer. */
export interface BytesTextResult {
  /** The text as code points. */
  codePoints: number[];
  /** Python's repr() of the text. */
  textRepr: string;
  /** Every character and the bytes it became, in order. */
  rows: CharRow[];
  /** The encoding failure, when the encode handler is strict and a character cannot be written. */
  encodeFailure: CodecFailure | null;
  /** The bytes (null when encoding failed). */
  bytes: number[] | null;
  /** Python's repr() of the bytes (null when encoding failed). */
  bytesRepr: string | null;
  /** The bytes in lower-case hex, one space between bytes, as bytes.hex(" ") prints them. */
  bytesHex: string | null;
  /** How many characters the encode handler replaced or dropped. */
  encodeHandled: number;
  /** The decoding failure, when a strict (or refused surrogateescape) step fails. */
  decodeFailure: CodecFailure | null;
  /** The decoded text as code points (null when a step failed). */
  decoded: number[] | null;
  /** Python's repr() of the decoded text (null when a step failed). */
  decodedRepr: string | null;
  /** How many error ranges the decode handler dealt with. */
  decodeHandled: number;
  /** Whether the decoded text equals the text (null when a step failed). */
  sameText: boolean | null;
  /** For a surrogateescape decode that succeeded: the bytes written back. */
  bytesBack: BytesBack | null;
  /** How it ended. */
  verdict: Verdict;
  /** The same operation as one Python expression. */
  python: string;
}

/** The stable codes an invalid input is refused with. */
export type BytesTextErrorCode = "too-long" | "lone-surrogate" | "bad-codec" | "bad-handler";

/** The error a refused input throws, with its stable code. */
export class BytesTextError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: BytesTextErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: BytesTextErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

// ---- rule 4: the single-byte tables --------------------------------------------------------------------------------

/** cp1252 bytes 0x80 to 0x9F, from Unicode's CP1252.TXT (null where the table says UNDEFINED); the rest is Latin-1. */
const CP1252_HIGH: readonly (number | null)[] = [
  // 0x80 euro sign, 0x81 undefined, 0x82 single low-9 quotation mark, 0x83 f with hook.
  0x20ac, null, 0x201a, 0x0192,
  // 0x84 double low-9 quotation mark, 0x85 horizontal ellipsis, 0x86 dagger, 0x87 double dagger.
  0x201e, 0x2026, 0x2020, 0x2021,
  // 0x88 modifier circumflex, 0x89 per mille sign, 0x8A S with caron, 0x8B single left-pointing angle quotation mark.
  0x02c6, 0x2030, 0x0160, 0x2039,
  // 0x8C capital ligature OE, 0x8D undefined, 0x8E Z with caron, 0x8F undefined.
  0x0152, null, 0x017d, null,
  // 0x90 undefined, 0x91 and 0x92 single quotation marks, 0x93 left double quotation mark.
  null, 0x2018, 0x2019, 0x201c,
  // 0x94 right double quotation mark, 0x95 bullet, 0x96 the en dash, 0x97 the em dash (written as a number here).
  0x201d, 0x2022, 0x2013, 0x2014,
  // 0x98 small tilde, 0x99 trade mark sign, 0x9A s with caron, 0x9B single right-pointing angle quotation mark.
  0x02dc, 0x2122, 0x0161, 0x203a,
  // 0x9C small ligature oe, 0x9D undefined, 0x9E z with caron, 0x9F capital Y with diaeresis.
  0x0153, null, 0x017e, 0x0178,
];

/** cp1252 in the encoding direction: code point to byte, for the 0x80 to 0x9F row. */
const CP1252_ENCODE_HIGH: ReadonlyMap<number, number> = new Map(
  // Every defined entry of the row, turned round.
  CP1252_HIGH.flatMap((cp, i) => (cp === null ? [] : [[cp, 0x80 + i] as [number, number]])),
);

/** The code point a cp1252 byte stands for, or null when the table leaves it undefined. */
function cp1252Decode(b: number): number | null {
  // 0x80 to 0x9F come from the table; every other byte is its Latin-1 value.
  return b >= 0x80 && b <= 0x9f ? CP1252_HIGH[b - 0x80] : b;
}

/** The cp1252 byte for a code point, or null when the table has none. */
function cp1252Encode(cp: number): number | null {
  // Latin-1 values outside 0x80 to 0x9F map to themselves.
  if (cp <= 0xff && !(cp >= 0x80 && cp <= 0x9f)) return cp;
  // The typographic row, or nothing.
  return CP1252_ENCODE_HIGH.get(cp) ?? null;
}

// ---- rule 6: the names and reasons CPython uses --------------------------------------------------------------------

/** The codec name CPython puts in its error messages. */
const ERROR_NAME: Readonly<Record<Codec, string>> = {
  // The UTF codecs use their own names.
  "utf-8": "utf-8",
  // Little-endian UTF-16.
  "utf-16-le": "utf-16-le",
  // Big-endian UTF-16.
  "utf-16-be": "utf-16-be",
  // Latin-1 reports as latin-1.
  "latin-1": "latin-1",
  // cp1252 is a charmap codec and reports as one.
  cp1252: "charmap",
  // ASCII.
  ascii: "ascii",
};

/** The reason an encoder gives for a character it cannot write. */
const ENCODE_REASON: Readonly<Record<Codec, string>> = {
  // The UTF codecs fail only on surrogates, which the lab refuses at the input.
  "utf-8": "surrogates not allowed",
  // The same for UTF-16.
  "utf-16-le": "surrogates not allowed",
  // And its big-endian twin.
  "utf-16-be": "surrogates not allowed",
  // Latin-1 stops at 255.
  "latin-1": "ordinal not in range(256)",
  // cp1252 has no byte for the character.
  cp1252: "character maps to <undefined>",
  // ASCII stops at 127.
  ascii: "ordinal not in range(128)",
};

/** Two lower-case hex digits. */
function hex2(n: number): string {
  // Padded to two.
  return n.toString(16).padStart(2, "0");
}

/** A code point as Python escapes it: \xhh, \uxxxx or \Uxxxxxxxx (lower-case hex). */
function pyEscape(cp: number): string {
  // Up to 0xFF: two hex digits.
  if (cp <= 0xff) return `\\x${hex2(cp)}`;
  // Up to 0xFFFF: four.
  if (cp <= 0xffff) return `\\u${cp.toString(16).padStart(4, "0")}`;
  // Beyond: eight.
  return `\\U${cp.toString(16).padStart(8, "0")}`;
}

/** str() of a UnicodeEncodeError (rule 6): one character, or a run of them. */
function encodeMessage(codec: Codec, cps: readonly number[], start: number, end: number, reason: string): string {
  // One character: it is named, escaped as Python escapes it.
  if (end - start === 1) return `'${ERROR_NAME[codec]}' codec can't encode character '${pyEscape(cps[start])}' in position ${start}: ${reason}`;
  // A run: its first and last positions.
  return `'${ERROR_NAME[codec]}' codec can't encode characters in position ${start}-${end - 1}: ${reason}`;
}

/** str() of a UnicodeDecodeError (rule 6): one byte, or a range of them. */
function decodeMessage(codec: Codec, bytes: readonly number[], start: number, end: number, reason: string): string {
  // One byte: its value in hex.
  if (end - start === 1) return `'${ERROR_NAME[codec]}' codec can't decode byte 0x${hex2(bytes[start])} in position ${start}: ${reason}`;
  // A range: its first and last positions.
  return `'${ERROR_NAME[codec]}' codec can't decode bytes in position ${start}-${end - 1}: ${reason}`;
}

// ---- rules 2 to 4: one code point to bytes -------------------------------------------------------------------------

/** The bytes a codec writes for one code point, or null when it cannot write it. */
export function encodeCodePoint(codec: Codec, cp: number): number[] | null {
  // Surrogates are never written by the lab's codecs (strict UTF rules; the single-byte ones stop below them).
  const surrogate = cp >= 0xd800 && cp <= 0xdfff;
  // UTF-8: one to four octets by RFC 3629's ranges.
  if (codec === "utf-8") {
    // A surrogate has no UTF-8 form.
    if (surrogate) return null;
    // 0xxxxxxx.
    if (cp < 0x80) return [cp];
    // 110xxxxx 10xxxxxx.
    if (cp < 0x800) return [0xc0 | (cp >> 6), 0x80 | (cp & 0x3f)];
    // 1110xxxx 10xxxxxx 10xxxxxx.
    if (cp < 0x10000) return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
    // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx.
    return [0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
  }
  // UTF-16 in either byte order (RFC 2781, section 2.1).
  if (codec === "utf-16-le" || codec === "utf-16-be") {
    // A surrogate on its own is not a character.
    if (surrogate) return null;
    // One unit below U+10000, two (a surrogate pair) above.
    const units = cp < 0x10000 ? [cp] : [0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff)];
    // Each unit's two bytes, low first for -le and high first for -be.
    return units.flatMap((u) => (codec === "utf-16-le" ? [u & 0xff, u >> 8] : [u >> 8, u & 0xff]));
  }
  // Latin-1: the code point is the byte, up to 255.
  if (codec === "latin-1") return cp <= 0xff ? [cp] : null;
  // ASCII: up to 127.
  if (codec === "ascii") return cp < 0x80 ? [cp] : null;
  // cp1252: the published table.
  const b = cp1252Encode(cp);
  // One byte, or nothing.
  return b === null ? null : [b];
}

// ---- rules 5 and 6: encoding a text --------------------------------------------------------------------------------

/** What encoding a text produced: the bytes and rows, or the failure. */
interface EncodeOutcome {
  /** The bytes, or null on failure. */
  bytes: number[] | null;
  /** Every character's row. */
  rows: CharRow[];
  /** The failure under strict. */
  failure: CodecFailure | null;
  /** Characters a handler replaced or dropped. */
  handled: number;
}

/** The bytes an encode handler writes for one character the codec cannot write (rule 5). */
function encodeReplacement(codec: Codec, handler: Exclude<EncodeHandler, "strict">, cp: number): number[] {
  // ignore: nothing at all.
  if (handler === "ignore") return [];
  // The replacement as text: "?", a backslash escape, or a decimal character reference.
  const rep = handler === "replace" ? "?" : handler === "backslashreplace" ? pyEscape(cp) : `&#${cp};`;
  // The replacement is ASCII, which every lab codec writes; encode it with the same codec.
  return Array.from(rep).flatMap((ch) => encodeCodePoint(codec, ch.codePointAt(0) ?? 0) ?? []);
}

/** Encode code points with a codec and a handler, as str.encode does. */
function encodeText(cps: readonly number[], codec: Codec, handler: EncodeHandler): EncodeOutcome {
  // The bytes so far, the rows so far and the handled count.
  const out: number[] = [];
  // One row per character.
  const rows: CharRow[] = [];
  // Characters a handler stood in for.
  let handled = 0;
  // The first strict failure, if any.
  let failure: CodecFailure | null = null;
  // Walk the text.
  let i = 0;
  // Until every character has its row.
  while (i < cps.length) {
    // The character's bytes, if the codec has them.
    const b = encodeCodePoint(codec, cps[i]);
    // Writable: append and move on.
    if (b) {
      // Its bytes go out.
      if (!failure) out.push(...b);
      // Its row records them.
      rows.push({ cp: cps[i], bytes: b, unencodable: false });
      // Next character.
      i++;
      // Back to the top.
      continue;
    }
    // A run of characters the codec cannot write is one error (rule 6).
    let j = i;
    // Extend the run while the next character is unwritable too.
    while (j < cps.length && encodeCodePoint(codec, cps[j]) === null) j++;
    // Under strict the first run raises; the rows still show every character.
    if (handler === "strict") {
      // Only the first failure counts: Python stops there.
      if (!failure) failure = { exception: "UnicodeEncodeError", codecName: ERROR_NAME[codec], start: i, end: j, reason: ENCODE_REASON[codec], message: encodeMessage(codec, cps, i, j, ENCODE_REASON[codec]) };
      // The run's rows, with nothing written.
      for (let k = i; k < j; k++) rows.push({ cp: cps[k], bytes: [], unencodable: true });
    } else {
      // Every character of the run gets the handler's bytes.
      for (let k = i; k < j; k++) {
        // The handler's replacement for this character.
        const rep = encodeReplacement(codec, handler, cps[k]);
        // Written out.
        out.push(...rep);
        // Recorded in its row.
        rows.push({ cp: cps[k], bytes: rep, unencodable: true });
        // Counted.
        handled++;
      }
    }
    // Past the run.
    i = j;
  }
  // The outcome: no bytes when a strict step failed.
  return { bytes: failure ? null : out, rows, failure, handled };
}

// ---- rules 2 to 4: one step of a decoder ---------------------------------------------------------------------------

/** One step of a decoder: a code point and the bytes it took, or an error range and its reason. */
type Step = { cp: number; len: number } | { start: number; end: number; reason: string };

/** Whether a byte is a UTF-8 continuation byte, 10xxxxxx. */
function cont(b: number): boolean {
  // The top two bits are 10.
  return (b & 0xc0) === 0x80;
}

/** One UTF-8 step at pos (rule 2): RFC 3629's well-formed sequences, CPython's error ranges and reasons. */
function utf8Step(bytes: readonly number[], pos: number): Step {
  // The lead byte and how many bytes remain.
  const b0 = bytes[pos];
  // Bytes from pos to the end.
  const avail = bytes.length - pos;
  // The reasons, as CPython words them.
  const START = "invalid start byte";
  // A byte where a continuation byte had to be.
  const CONT = "invalid continuation byte";
  // The input stopped inside a sequence.
  const EOD = "unexpected end of data";
  // ASCII: one byte.
  if (b0 < 0x80) return { cp: b0, len: 1 };
  // 0x80 to 0xC1: a continuation byte, or the lead of an overlong two-byte form.
  if (b0 < 0xc2) return { start: pos, end: pos + 1, reason: START };
  // Two-byte sequences, C2 to DF.
  if (b0 < 0xe0) {
    // Cut short: everything left is the error.
    if (avail < 2) return { start: pos, end: bytes.length, reason: EOD };
    // The second byte must be a continuation byte.
    if (!cont(bytes[pos + 1])) return { start: pos, end: pos + 1, reason: CONT };
    // The code point from the payload bits.
    return { cp: ((b0 & 0x1f) << 6) | (bytes[pos + 1] & 0x3f), len: 2 };
  }
  // Three-byte sequences, E0 to EF.
  if (b0 < 0xf0) {
    // The second byte's allowed range depends on the lead: A0-BF after E0 (no overlong), 80-9F after ED (no surrogates).
    const badSecond = (b1: number) => !cont(b1) || (b0 === 0xe0 && b1 < 0xa0) || (b0 === 0xed && b1 >= 0xa0);
    // Cut short.
    if (avail < 3) {
      // A wrong second byte is reported as such even at the end.
      if (avail >= 2 && badSecond(bytes[pos + 1])) return { start: pos, end: pos + 1, reason: CONT };
      // Otherwise the input simply stopped.
      return { start: pos, end: bytes.length, reason: EOD };
    }
    // A wrong second byte: the lead alone is the error.
    if (badSecond(bytes[pos + 1])) return { start: pos, end: pos + 1, reason: CONT };
    // A wrong third byte: the first two are the error.
    if (!cont(bytes[pos + 2])) return { start: pos, end: pos + 2, reason: CONT };
    // The code point from the payload bits.
    return { cp: ((b0 & 0x0f) << 12) | ((bytes[pos + 1] & 0x3f) << 6) | (bytes[pos + 2] & 0x3f), len: 3 };
  }
  // Four-byte sequences, F0 to F4.
  if (b0 < 0xf5) {
    // The second byte's allowed range: 90-BF after F0 (no overlong), 80-8F after F4 (nothing above U+10FFFF).
    const badSecond = (b1: number) => !cont(b1) || (b0 === 0xf0 && b1 < 0x90) || (b0 === 0xf4 && b1 >= 0x90);
    // Cut short.
    if (avail < 4) {
      // A wrong second byte is reported even at the end.
      if (avail >= 2 && badSecond(bytes[pos + 1])) return { start: pos, end: pos + 1, reason: CONT };
      // So is a wrong third byte.
      if (avail >= 3 && !cont(bytes[pos + 2])) return { start: pos, end: pos + 2, reason: CONT };
      // Otherwise the input simply stopped.
      return { start: pos, end: bytes.length, reason: EOD };
    }
    // A wrong second byte.
    if (badSecond(bytes[pos + 1])) return { start: pos, end: pos + 1, reason: CONT };
    // A wrong third byte.
    if (!cont(bytes[pos + 2])) return { start: pos, end: pos + 2, reason: CONT };
    // A wrong fourth byte.
    if (!cont(bytes[pos + 3])) return { start: pos, end: pos + 3, reason: CONT };
    // The code point from the payload bits.
    return { cp: ((b0 & 0x07) << 18) | ((bytes[pos + 1] & 0x3f) << 12) | ((bytes[pos + 2] & 0x3f) << 6) | (bytes[pos + 3] & 0x3f), len: 4 };
  }
  // F5 to FF never start a sequence.
  return { start: pos, end: pos + 1, reason: START };
}

/** One UTF-16 step at pos (rule 3), little- or big-endian. */
function utf16Step(bytes: readonly number[], pos: number, little: boolean): Step {
  // Bytes from pos to the end.
  const avail = bytes.length - pos;
  // A lone trailing byte cannot be a unit.
  if (avail < 2) return { start: pos, end: bytes.length, reason: "truncated data" };
  // A 16-bit unit at an offset, in the codec's byte order.
  const unit = (at: number) => (little ? bytes[at] | (bytes[at + 1] << 8) : (bytes[at] << 8) | bytes[at + 1]);
  // The unit here.
  const u = unit(pos);
  // Not a surrogate: the unit is the code point.
  if (u < 0xd800 || u > 0xdfff) return { cp: u, len: 2 };
  // A low surrogate on its own.
  if (u >= 0xdc00) return { start: pos, end: pos + 2, reason: "illegal encoding" };
  // A high surrogate with no room for its partner.
  if (avail < 4) return { start: pos, end: bytes.length, reason: "unexpected end of data" };
  // The next unit.
  const u2 = unit(pos + 2);
  // A low surrogate completes the pair.
  if (u2 >= 0xdc00 && u2 <= 0xdfff) return { cp: 0x10000 + ((u - 0xd800) << 10) + (u2 - 0xdc00), len: 4 };
  // Anything else: the high surrogate alone is the error, and decoding resumes at the next unit.
  return { start: pos, end: pos + 2, reason: "illegal UTF-16 surrogate" };
}

/** One step of any lab codec at pos. */
function decodeStep(codec: Codec, bytes: readonly number[], pos: number): Step {
  // The byte here, for the single-byte codecs.
  const b = bytes[pos];
  // UTF-8.
  if (codec === "utf-8") return utf8Step(bytes, pos);
  // UTF-16, little-endian.
  if (codec === "utf-16-le") return utf16Step(bytes, pos, true);
  // UTF-16, big-endian.
  if (codec === "utf-16-be") return utf16Step(bytes, pos, false);
  // Latin-1 never fails.
  if (codec === "latin-1") return { cp: b, len: 1 };
  // ASCII fails above 127, one byte at a time.
  if (codec === "ascii") return b < 0x80 ? { cp: b, len: 1 } : { start: pos, end: pos + 1, reason: "ordinal not in range(128)" };
  // cp1252 fails on its five undefined bytes, one at a time.
  const cp = cp1252Decode(b);
  // Defined, or not.
  return cp === null ? { start: pos, end: pos + 1, reason: "character maps to <undefined>" } : { cp, len: 1 };
}

// ---- rules 5 and 6: decoding bytes ---------------------------------------------------------------------------------

/** What decoding produced: code points, or the failure. */
interface DecodeOutcome {
  /** The code points, or null on failure. */
  cps: number[] | null;
  /** The failure, if any. */
  failure: CodecFailure | null;
  /** Error ranges a handler dealt with. */
  handled: number;
}

/** Decode bytes with a codec and a handler, as bytes.decode does. */
export function decodeBytes(bytes: readonly number[], codec: Codec, handler: DecodeHandler): DecodeOutcome {
  // The text so far.
  const out: number[] = [];
  // Ranges a handler dealt with.
  let handled = 0;
  // The position in the bytes.
  let pos = 0;
  // Until every byte is read.
  while (pos < bytes.length) {
    // One step.
    const s = decodeStep(codec, bytes, pos);
    // A character: keep it and move on.
    if ("cp" in s) {
      // Into the text.
      out.push(s.cp);
      // Past its bytes.
      pos += s.len;
      // Next step.
      continue;
    }
    // The failure Python would raise for this range.
    const failure: CodecFailure = { exception: "UnicodeDecodeError", codecName: ERROR_NAME[codec], start: s.start, end: s.end, reason: s.reason, message: decodeMessage(codec, bytes, s.start, s.end, s.reason) };
    // strict raises at the first error.
    if (handler === "strict") return { cps: null, failure, handled };
    // surrogateescape (PEP 383): escape up to four bytes of 128 or more from the start of the range, then resume.
    if (handler === "surrogateescape") {
      // How many bytes it escapes.
      let consumed = 0;
      // Stop at the range's end, at four bytes, or at a byte below 128.
      while (consumed < 4 && s.start + consumed < s.end && bytes[s.start + consumed] >= 0x80) {
        // The byte becomes U+DC80 to U+DCFF.
        out.push(0xdc00 + bytes[s.start + consumed]);
        // One more escaped.
        consumed++;
      }
      // A first byte below 128 cannot be escaped: the original error is raised.
      if (consumed === 0) return { cps: null, failure, handled };
      // Counted, and decoding resumes after the escaped bytes.
      handled++;
      // The next position.
      pos = s.start + consumed;
      // Next step.
      continue;
    }
    // replace: one U+FFFD for the whole range.
    if (handler === "replace") out.push(0xfffd);
    // backslashreplace: \xhh for every byte of the range.
    if (handler === "backslashreplace") for (let k = s.start; k < s.end; k++) out.push(...Array.from(`\\x${hex2(bytes[k])}`, (c) => c.codePointAt(0) ?? 0));
    // ignore writes nothing; every handler resumes after the range.
    handled++;
    // Past the range.
    pos = s.end;
  }
  // The text.
  return { cps: out, failure: null, handled };
}

/** Encode decoded text back with surrogateescape (rule 5): escaped surrogates return as their bytes. */
function encodeSurrogateEscape(cps: readonly number[], codec: Codec): { bytes: number[] | null; failure: CodecFailure | null } {
  // The bytes so far.
  const out: number[] = [];
  // Walk the text.
  for (let i = 0; i < cps.length; i++) {
    // The character's bytes in this codec, if any.
    const b = encodeCodePoint(codec, cps[i]);
    // Writable: out it goes.
    if (b) {
      // Appended.
      out.push(...b);
      // Next.
      continue;
    }
    // An escaped byte, U+DC80 to U+DCFF.
    const escaped = cps[i] >= 0xdc80 && cps[i] <= 0xdcff;
    // UTF-16 writes in 16-bit units: one escaped byte is an odd length, which its encoder refuses.
    const utf16 = codec === "utf-16-le" || codec === "utf-16-be";
    // The other codecs write the byte back.
    if (escaped && !utf16) {
      // The original byte.
      out.push(cps[i] - 0xdc00);
      // Next.
      continue;
    }
    // Anything else fails here, as one character (the lab's decoded texts hold only escapes as surrogates).
    const reason = ENCODE_REASON[codec];
    // The failure, as Python would raise it.
    return { bytes: null, failure: { exception: "UnicodeEncodeError", codecName: ERROR_NAME[codec], start: i, end: i + 1, reason, message: encodeMessage(codec, cps, i, i + 1, reason) } };
  }
  // The bytes.
  return { bytes: out, failure: null };
}

// ---- rule 7: repr ----------------------------------------------------------------------------------------------------

/** Whether Python's repr() shows a non-ASCII code point as itself (not in Unicode's Other or Separator groups). */
function printable(cp: number): boolean {
  // Surrogates are Other (Cs) and never printable; String.fromCodePoint makes a lone unit for them.
  return !/^[\p{C}\p{Z}]$/u.test(String.fromCodePoint(cp));
}

/** The quote Python's repr() picks: single, unless the content has single quotes and no double ones. */
function quoteFor(units: readonly number[]): number {
  // Whether each quote occurs.
  const single = units.includes(0x27);
  // Double quotes.
  const double = units.includes(0x22);
  // Double quotes only when they avoid escaping.
  return single && !double ? 0x22 : 0x27;
}

/** Python's repr() of a str given as code points. */
export function pyStrRepr(cps: readonly number[]): string {
  // The quote character.
  const q = quoteFor(cps);
  // The pieces of the representation.
  let s = String.fromCharCode(q);
  // Each code point in turn.
  for (const cp of cps) {
    // The quote in use and the backslash are escaped with a backslash.
    if (cp === q || cp === 0x5c) s += "\\" + String.fromCharCode(cp);
    // Tab, newline and carriage return have their short escapes.
    else if (cp === 0x09) s += "\\t";
    // Newline.
    else if (cp === 0x0a) s += "\\n";
    // Carriage return.
    else if (cp === 0x0d) s += "\\r";
    // Other ASCII controls and DEL as \xhh.
    else if (cp < 0x20 || cp === 0x7f) s += `\\x${hex2(cp)}`;
    // Printable ASCII as itself.
    else if (cp < 0x7f) s += String.fromCharCode(cp);
    // Non-ASCII: itself when printable, escaped otherwise.
    else s += printable(cp) ? String.fromCodePoint(cp) : pyEscape(cp);
  }
  // Closed with the same quote.
  return s + String.fromCharCode(q);
}

/** Python's repr() of bytes. */
export function pyBytesRepr(bytes: readonly number[]): string {
  // The quote character.
  const q = quoteFor(bytes);
  // b and the opening quote.
  let s = "b" + String.fromCharCode(q);
  // Each byte in turn.
  for (const b of bytes) {
    // The quote in use and the backslash are escaped.
    if (b === q || b === 0x5c) s += "\\" + String.fromCharCode(b);
    // Tab.
    else if (b === 0x09) s += "\\t";
    // Newline.
    else if (b === 0x0a) s += "\\n";
    // Carriage return.
    else if (b === 0x0d) s += "\\r";
    // Printable ASCII as itself.
    else if (b >= 0x20 && b < 0x7f) s += String.fromCharCode(b);
    // Everything else as \xhh.
    else s += `\\x${hex2(b)}`;
  }
  // Closed.
  return s + String.fromCharCode(q);
}

/** The operation as one Python expression; a strict handler is Python's default and is left out. */
function pythonExpression(textRepr: string, input: BytesTextInput): string {
  // The errors argument when it is not the default.
  const arg = (codec: Codec, h: string) => (h === "strict" ? `'${codec}'` : `'${codec}', errors='${h}'`);
  // text.encode(...).decode(...).
  return `${textRepr}.encode(${arg(input.encodeCodec, input.encodeErrors)}).decode(${arg(input.decodeCodec, input.decodeErrors)})`;
}

// ---- the model -------------------------------------------------------------------------------------------------------

/** Encode the text, decode the bytes, and say how it ended. */
export function compute(input: BytesTextInput): BytesTextResult {
  // Both codecs must be the lab's.
  if (!CODECS.includes(input.encodeCodec) || !CODECS.includes(input.decodeCodec)) throw new BytesTextError("bad-codec", "unknown codec");
  // Both handlers must be offered on their side.
  if (!ENCODE_HANDLERS.includes(input.encodeErrors) || !DECODE_HANDLERS.includes(input.decodeErrors)) throw new BytesTextError("bad-handler", "unknown error handler");
  // The text as code points (iterating a string pairs surrogates that belong together).
  const cps = Array.from(input.text, (ch) => ch.codePointAt(0) ?? 0);
  // Too long for the lab.
  if (cps.length > MAX_TEXT_CODE_POINTS) throw new BytesTextError("too-long", `more than ${MAX_TEXT_CODE_POINTS} code points`);
  // A lone surrogate cannot be typed and is refused.
  if (cps.some((cp) => cp >= 0xd800 && cp <= 0xdfff)) throw new BytesTextError("lone-surrogate", "the text holds a lone surrogate");
  // Rule 7: the text as Python shows it.
  const textRepr = pyStrRepr(cps);
  // Rules 2 to 6: encode.
  const enc = encodeText(cps, input.encodeCodec, input.encodeErrors);
  // The Python expression for the whole operation.
  const python = pythonExpression(textRepr, input);
  // A strict encoding failure ends the operation there.
  if (!enc.bytes) {
    // Nothing was decoded.
    return { codePoints: cps, textRepr, rows: enc.rows, encodeFailure: enc.failure, bytes: null, bytesRepr: null, bytesHex: null, encodeHandled: enc.handled, decodeFailure: null, decoded: null, decodedRepr: null, decodeHandled: 0, sameText: null, bytesBack: null, verdict: "encode-error", python };
  }
  // The bytes as Python shows them, and as hex.
  const bytesRepr = pyBytesRepr(enc.bytes);
  // Spaced lower-case hex.
  const bytesHex = enc.bytes.map(hex2).join(" ");
  // Rules 2 to 6: decode.
  const dec = decodeBytes(enc.bytes, input.decodeCodec, input.decodeErrors);
  // A decoding failure ends the operation there.
  if (!dec.cps) {
    // The bytes are known; the text is not.
    return { codePoints: cps, textRepr, rows: enc.rows, encodeFailure: null, bytes: enc.bytes, bytesRepr, bytesHex, encodeHandled: enc.handled, decodeFailure: dec.failure, decoded: null, decodedRepr: null, decodeHandled: dec.handled, sameText: null, bytesBack: null, verdict: "decode-error", python };
  }
  // Whether the text came back unchanged.
  const sameText = dec.cps.length === cps.length && dec.cps.every((cp, i) => cp === cps[i]);
  // For surrogateescape, encode the result back with the same codec and handler: the original bytes should return.
  let bytesBack: BytesBack | null = null;
  // Only when that handler was the decoder's.
  if (input.decodeErrors === "surrogateescape") {
    // The second encoding.
    const back = encodeSurrogateEscape(dec.cps, input.decodeCodec);
    // Compared with the bytes that were decoded.
    bytesBack = { bytes: back.bytes, same: back.bytes ? back.bytes.length === enc.bytes.length && back.bytes.every((b, i) => b === enc.bytes![i]) : null, failure: back.failure };
  }
  // How it ended: the same text first, then what changed it.
  const verdict: Verdict = sameText ? "round-trip" : enc.handled > 0 ? "lossy-encode" : dec.handled > 0 ? (input.decodeErrors === "surrogateescape" ? "escaped" : "lossy-decode") : "mojibake";
  // Every figure, for the result panel.
  return { codePoints: cps, textRepr, rows: enc.rows, encodeFailure: null, bytes: enc.bytes, bytesRepr, bytesHex, encodeHandled: enc.handled, decodeFailure: null, decoded: dec.cps, decodedRepr: pyStrRepr(dec.cps), decodeHandled: dec.handled, sameText, bytesBack, verdict, python };
}

/** The lab's opening state: a text with one accented letter, written and read as UTF-8, which comes back unchanged. */
export const DEFAULT_INPUT: BytesTextInput = { text: "café", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" };

/** The Example button's state: UTF-8 bytes read as Windows-1252, the mojibake of a misdeclared file or header. */
export const EXAMPLE_INPUT: BytesTextInput = { text: "café €5", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "cp1252", decodeErrors: "strict" };
