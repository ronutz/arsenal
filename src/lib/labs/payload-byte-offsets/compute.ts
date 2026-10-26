// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/payload-byte-offsets/compute.ts
// ----------------------------------------------------------------------------
// THE PAYLOAD BYTE-OFFSETS LAB'S MODEL (2026-10-26), the interactive companion
// of the article "Rewriting Content on BIG-IP" (its section "iRules: headers
// and payloads by hand"). The reader types a body text and a piece of it to
// find, and sets how much body an iRule collects and on how many connections at
// once. The model answers three questions:
//
//   1. How long is the text in characters (Unicode code points) and in UTF-8
//      octets? UTF-8 encodes a code point in 1 octet up to U+007F, 2 up to
//      U+07FF, 3 up to U+FFFF and 4 up to U+10FFFF (RFC 3629, section 3), and
//      U+D800 to U+DFFF are surrogates that UTF-8 does not encode (RFC 3629,
//      section 3), so a lone surrogate is refused.
//   2. Where does the piece to find start, counted in characters and counted
//      in octets, and how long is it in each? HTTP::payload replace takes its
//      offset and length in bytes and treats its string as a byte array (F5
//      iRules reference, HTTP::payload), and Content-Length counts octets
//      (RFC 9110, section 8.6), so the octet figures are the ones an edit needs.
//   3. What is the most a collect can hold at once? Each connection that
//      collects holds up to the collected amount (F5 iRules reference,
//      HTTP::collect), so the upper bound is the collect size multiplied by the
//      connections collecting at the same moment.
//
// What it leaves out, stated in the lab's scope note: grapheme clusters (a
// letter and a combining accent are two code points here), Unicode
// normalisation, chunked and compressed bodies, and the platform's own memory
// accounting. Bounds on the inputs are the lab's, not the platform's.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The longest text (and piece to find) the lab accepts, in code points. */
export const MAX_TEXT_CODE_POINTS = 200;
/** The largest collect the lab accepts, in KiB (1 GiB: a bound for the lab, not a platform limit). */
export const MAX_COLLECT_KIB = 1048576;
/** The most concurrent collecting connections the lab accepts. */
export const MAX_CONNECTIONS = 10000000;
/** Bytes in one KiB. */
export const KIB = 1024;
/** Bytes in one MiB. */
export const MIB = 1048576;

/** The reader's settings. */
export interface PayloadInput {
  /** The body text, as typed. */
  text: string;
  /** The piece of the body to find (empty: no search). */
  find: string;
  /** How much body one connection collects, in whole KiB. */
  collectKiB: number;
  /** How many connections collect at the same moment. */
  connections: number;
}

/** The model's answer. */
export interface PayloadResult {
  /** Rule 1: the text's length in Unicode code points. */
  codePoints: number;
  /** Rule 1: the text's length in UTF-8 octets. */
  octets: number;
  /** True when at least one character of the text takes more than one octet. */
  multibyte: boolean;
  /** Rule 2: null when there is nothing to find, otherwise whether the piece occurs in the text. */
  found: boolean | null;
  /** Rule 2: where the first occurrence starts, counted in code points from 0 (null when not found). */
  charIndex: number | null;
  /** Rule 2: where the first occurrence starts, counted in octets from 0 (null when not found). */
  byteOffset: number | null;
  /** Rule 2: the piece's length in code points (null when there is nothing to find). */
  findCodePoints: number | null;
  /** Rule 2: the piece's length in octets (null when there is nothing to find). */
  findOctets: number | null;
  /** Rule 2: true when the character figures and the octet figures of the occurrence differ. */
  offsetsDiffer: boolean;
  /** Rule 3: one connection's collect, in bytes. */
  collectBytes: number;
  /** Rule 3: the upper bound for all collecting connections at once, in bytes. */
  memoryBytes: number;
  /** Rule 3: the same bound in MiB. */
  memoryMiB: number;
}

/** The stable codes an invalid input is refused with. */
export type PayloadErrorCode = "too-long" | "bad-text" | "bad-collect" | "bad-connections";

/** The error a refused input throws, with its stable code. */
export class PayloadError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: PayloadErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: PayloadErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** Rule 1: the number of UTF-8 octets one code point takes (RFC 3629, section 3). */
export function utf8Octets(cp: number): number {
  // U+0000 to U+007F: one octet.
  if (cp <= 0x7f) return 1;
  // U+0080 to U+07FF: two octets.
  if (cp <= 0x7ff) return 2;
  // U+0800 to U+FFFF: three octets.
  if (cp <= 0xffff) return 3;
  // U+10000 to U+10FFFF: four octets.
  return 4;
}

/** A string as its list of code points, refusing what is too long or holds a lone surrogate. */
function codePointsOf(s: string): number[] {
  // Iterating a string yields code points, pairing surrogates that belong together.
  const cps = Array.from(s, (ch) => ch.codePointAt(0) ?? 0);
  // Too long for the lab.
  if (cps.length > MAX_TEXT_CODE_POINTS) throw new PayloadError("too-long", `more than ${MAX_TEXT_CODE_POINTS} code points`);
  // A surrogate left on its own has no UTF-8 encoding.
  if (cps.some((cp) => cp >= 0xd800 && cp <= 0xdfff)) throw new PayloadError("bad-text", "a lone surrogate has no UTF-8 encoding");
  // The code points.
  return cps;
}

/** The sum of the UTF-8 octets of a list of code points. */
function octetsOf(cps: number[]): number {
  // Each code point's octets, added up.
  return cps.reduce((sum, cp) => sum + utf8Octets(cp), 0);
}

/** The first position where needle occurs in hay, both as code points, or -1. */
function indexOfCodePoints(hay: number[], needle: number[]): number {
  // Every start position where the needle still fits.
  for (let i = 0; i + needle.length <= hay.length; i++) {
    // Compare the needle against the hay from this position.
    let same = true;
    // Each code point of the needle in turn.
    for (let j = 0; j < needle.length; j++) {
      // One difference rules this position out.
      if (hay[i + j] !== needle[j]) {
        // Not here.
        same = false;
        // Stop comparing.
        break;
      }
    }
    // The first full match wins.
    if (same) return i;
  }
  // Nowhere.
  return -1;
}

/** Measure the text, place the piece to find, and bound the collect memory. */
export function compute(input: PayloadInput): PayloadResult {
  // The collect size must be a whole number of KiB within the lab's range.
  if (!Number.isInteger(input.collectKiB) || input.collectKiB < 1 || input.collectKiB > MAX_COLLECT_KIB) throw new PayloadError("bad-collect", `collect must be 1 to ${MAX_COLLECT_KIB} KiB`);
  // The connection count must be a whole number within the lab's range.
  if (!Number.isInteger(input.connections) || input.connections < 1 || input.connections > MAX_CONNECTIONS) throw new PayloadError("bad-connections", `connections must be 1 to ${MAX_CONNECTIONS}`);
  // Rule 1: the text as code points (refusing what the lab cannot measure).
  const text = codePointsOf(input.text);
  // Its octets.
  const octets = octetsOf(text);
  // Rule 2: the piece to find, as code points.
  const needle = codePointsOf(input.find);
  // Nothing to find means no search.
  const searching = needle.length > 0;
  // Where it starts in code points, or -1.
  const at = searching ? indexOfCodePoints(text, needle) : -1;
  // Found only when searching and present.
  const found = searching ? at >= 0 : null;
  // Its start in octets: the octets of everything before it.
  const byteOffset = found ? octetsOf(text.slice(0, at)) : null;
  // Its length in octets.
  const findOctets = searching ? octetsOf(needle) : null;
  // The two counts disagree when the start or the length differs.
  const offsetsDiffer = found === true && (byteOffset !== at || findOctets !== needle.length);
  // Rule 3: one connection's collect in bytes.
  const collectBytes = input.collectKiB * KIB;
  // The upper bound for all of them at once.
  const memoryBytes = collectBytes * input.connections;
  // Every figure, for the result panel.
  return {
    codePoints: text.length,
    octets,
    multibyte: octets !== text.length,
    found,
    charIndex: found ? at : null,
    byteOffset,
    findCodePoints: searching ? needle.length : null,
    findOctets,
    offsetsDiffer,
    collectBytes,
    memoryBytes,
    memoryMiB: memoryBytes / MIB,
  };
}

/** The lab's opening state: plain ASCII, where characters and octets agree, collecting 8 KiB on 1,000 connections. */
export const DEFAULT_INPUT: PayloadInput = { text: "Hello, world", find: "world", collectKiB: 8, connections: 1000 };

/** The Example button's state: a euro sign and an accented letter push the octet offset past the character index. */
export const EXAMPLE_INPUT: PayloadInput = { text: "Price: €100, café included", find: "café", collectKiB: 64, connections: 2000 };
