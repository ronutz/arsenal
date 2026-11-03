// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/phish-or-legit/punycode.ts
// ----------------------------------------------------------------------------
// PUNYCODE, RFC 3492, for Phish or Legit (PRIME 03/11/2026). A label that
// starts with "xn--" is an A-label (RFC 5890, section 2.3.2.1): the rest is a
// Unicode name written in ASCII by the Punycode algorithm. The game shows such
// labels and says what they decode to, so it carries its own small encoder and
// decoder, written from the RFC's section 6 pseudocode and proved against the
// RFC's own sample strings (section 7.1) by selfTest().
// Pure: no DOM, no clock, no randomness. Every loop is bounded by its input.
// ============================================================================

/** The bootstring parameters Punycode uses (RFC 3492, section 5). */
const BASE = 36;
/** The smallest threshold. */
const TMIN = 1;
/** The largest threshold. */
const TMAX = 26;
/** The bias adaptation skew. */
const SKEW = 38;
/** The damping factor of the first adaptation. */
const DAMP = 700;
/** The starting bias. */
const INITIAL_BIAS = 72;
/** The first non-basic code point. */
const INITIAL_N = 0x80;
/** The delimiter between the basic code points and the encoded deltas. */
const DELIMITER = "-";
/** The ACE prefix of an A-label (RFC 5890, section 2.3.2.5). */
export const ACE_PREFIX = "xn--";

/**
 * The bias adaptation function (RFC 3492, section 6.1).
 *
 * @param delta the delta just encoded or decoded
 * @param numPoints the number of code points handled so far, plus one
 * @param first whether this is the first adaptation
 * @returns the new bias
 */
function adapt(delta: number, numPoints: number, first: boolean): number {
  // Scale the delta down, a lot the first time.
  let d = first ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
  // Compensate for the length of the string so far.
  d += Math.floor(d / numPoints);
  // The number of whole BASE steps taken.
  let k = 0;
  // Divide until the delta fits; each pass shrinks it by a factor of 35, so this ends.
  while (d > ((BASE - TMIN) * TMAX) >> 1) {
    // One step down.
    d = Math.floor(d / (BASE - TMIN));
    // One more BASE.
    k += BASE;
  }
  // The bias.
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}

/**
 * The value of a Punycode digit character: a-z (or A-Z) are 0-25, 0-9 are 26-35.
 *
 * @param code the character's code
 * @returns its digit value, or BASE when it is not a digit
 */
function digitValue(code: number): number {
  // 0-9.
  if (code >= 48 && code <= 57) return code - 22;
  // A-Z.
  if (code >= 65 && code <= 90) return code - 65;
  // a-z.
  if (code >= 97 && code <= 122) return code - 97;
  // Not a digit.
  return BASE;
}

/**
 * The lower-case character of a Punycode digit value.
 *
 * @param d a digit value, 0-35
 * @returns its character
 */
function digitChar(d: number): string {
  // 0-25 are a-z, 26-35 are 0-9.
  return String.fromCharCode(d < 26 ? d + 97 : d + 22);
}

/**
 * The threshold t for a position k (RFC 3492, section 6.2 and 6.3).
 *
 * @param k the current multiple of BASE
 * @param bias the current bias
 * @returns t, clamped between TMIN and TMAX
 */
function threshold(k: number, bias: number): number {
  // Below the bias: the minimum.
  if (k <= bias) return TMIN;
  // Past bias + TMAX: the maximum.
  if (k >= bias + TMAX) return TMAX;
  // In between: the distance from the bias.
  return k - bias;
}

/**
 * Decode a Punycode string (without the xn-- prefix) into Unicode (RFC 3492, section 6.2).
 *
 * @param input the Punycode string
 * @returns the decoded string
 * @throws on a malformed input
 */
export function punyDecode(input: string): string {
  // The decoder's state.
  let n = INITIAL_N;
  // The insertion index.
  let i = 0;
  // The bias.
  let bias = INITIAL_BIAS;
  // The last delimiter splits the basic code points from the deltas.
  const b = input.lastIndexOf(DELIMITER);
  // The basic code points, copied as they are.
  const output: number[] = [];
  // Each one must be ASCII.
  for (let j = 0; j < Math.max(b, 0); j++) {
    // Its code.
    const c = input.charCodeAt(j);
    // Basic code points are below 0x80.
    if (c >= 0x80) throw new Error("punycode: non-basic code point before the delimiter");
    // Copied.
    output.push(c);
  }
  // The deltas start after the delimiter, or at the start when there is none.
  let pos = b > 0 ? b + 1 : 0;
  // Each pass decodes one delta and inserts one code point; each pass consumes at least one character.
  while (pos < input.length) {
    // Remember i, to compute the delta.
    const oldi = i;
    // The weight of the next digit.
    let w = 1;
    // Read a generalised variable-length integer, one digit at a time.
    for (let k = BASE; ; k += BASE) {
      // Ran out of digits in the middle of a number.
      if (pos >= input.length) throw new Error("punycode: truncated input");
      // The digit's value.
      const digit = digitValue(input.charCodeAt(pos++));
      // Not a digit at all.
      if (digit >= BASE) throw new Error("punycode: bad digit");
      // Add it, weighted.
      i += digit * w;
      // The threshold at this position.
      const t = threshold(k, bias);
      // A digit below the threshold ends the number.
      if (digit < t) break;
      // The next digit weighs more.
      w *= BASE - t;
    }
    // The new bias, from this delta.
    bias = adapt(i - oldi, output.length + 1, oldi === 0);
    // The code point advances by the whole wraps of i.
    n += Math.floor(i / (output.length + 1));
    // And i is what is left: the insertion position.
    i %= output.length + 1;
    // A code point beyond Unicode is malformed.
    if (n > 0x10ffff) throw new Error("punycode: code point out of range");
    // Insert it.
    output.splice(i, 0, n);
    // The next insertion goes after it.
    i++;
  }
  // The code points as a string.
  return String.fromCodePoint(...output);
}

/**
 * Encode a Unicode string as Punycode (without the xn-- prefix), RFC 3492, section 6.3.
 *
 * @param input the Unicode string
 * @returns its Punycode, with lower-case digits
 */
export function punyEncode(input: string): string {
  // The input's code points (not UTF-16 units).
  const cps = Array.from(input, (ch) => ch.codePointAt(0) as number);
  // The encoder's state.
  let n = INITIAL_N;
  // The running delta.
  let delta = 0;
  // The bias.
  let bias = INITIAL_BIAS;
  // The basic code points come first, as they are.
  let output = cps.filter((c) => c < 0x80).map((c) => String.fromCharCode(c)).join("");
  // How many basic code points there are.
  const b = output.length;
  // How many code points have been handled.
  let h = b;
  // A delimiter follows the basic part when there is one.
  if (b > 0) output += DELIMITER;
  // Each pass handles every code point equal to the next smallest one not yet handled; h grows every pass.
  while (h < cps.length) {
    // The smallest code point not yet handled.
    const m = Math.min(...cps.filter((c) => c >= n));
    // Skip the delta forward to it.
    delta += (m - n) * (h + 1);
    // Now at m.
    n = m;
    // Walk the input in order.
    for (const c of cps) {
      // Smaller code points count towards the delta.
      if (c < n) delta++;
      // This one is encoded now.
      if (c === n) {
        // The delta to write.
        let q = delta;
        // As a generalised variable-length integer.
        for (let k = BASE; ; k += BASE) {
          // The threshold at this position.
          const t = threshold(k, bias);
          // The last digit.
          if (q < t) break;
          // One digit.
          output += digitChar(t + ((q - t) % (BASE - t)));
          // What is left.
          q = Math.floor((q - t) / (BASE - t));
        }
        // The final digit.
        output += digitChar(q);
        // The new bias.
        bias = adapt(delta, h + 1, h === b);
        // The delta starts again.
        delta = 0;
        // One more handled.
        h++;
      }
    }
    // Past this code point.
    delta++;
    // The next one up.
    n++;
  }
  // The encoded string.
  return output;
}

/**
 * Whether a string is plain ASCII.
 *
 * @param s the string
 * @returns true when every code unit is below 0x80
 */
export function isAscii(s: string): boolean {
  // Any code unit at or above 0x80 is not ASCII.
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) >= 0x80) return false;
  // All ASCII.
  return true;
}

/**
 * One label in A-label form: unchanged when ASCII, xn-- plus Punycode otherwise.
 *
 * @param label one DNS label
 * @returns the ASCII form
 */
export function labelToAscii(label: string): string {
  // ASCII labels are their own form (lower-cased: DNS labels compare without case).
  if (isAscii(label)) return label.toLowerCase();
  // A Unicode label becomes an A-label.
  return ACE_PREFIX + punyEncode(label);
}

/**
 * One label in U-label form: an A-label decoded, anything else unchanged.
 *
 * @param label one DNS label
 * @returns the Unicode form
 */
export function labelToUnicode(label: string): string {
  // Only labels with the ACE prefix are decoded (the prefix is case independent).
  if (label.toLowerCase().startsWith(ACE_PREFIX)) return punyDecode(label.slice(ACE_PREFIX.length));
  // Everything else stays.
  return label;
}

/**
 * A host name in ASCII form, label by label.
 *
 * @param host a host name, Unicode or ASCII
 * @returns its ASCII form
 */
export function hostToAscii(host: string): string {
  // Each label converted, dots kept.
  return host.split(".").map(labelToAscii).join(".");
}

/**
 * A host name in Unicode form, label by label.
 *
 * @param host a host name, possibly with A-labels
 * @returns its Unicode form
 */
export function hostToUnicode(host: string): string {
  // Each label converted, dots kept.
  return host.split(".").map(labelToUnicode).join(".");
}

/** RFC 3492's sample strings (section 7.1), as code points and their Punycode, for the self-test. */
export const RFC3492_SAMPLES: ReadonlyArray<{ id: string; cps: number[]; puny: string }> = [
  // (A) Arabic (Egyptian).
  { id: "A", cps: [0x0644, 0x064a, 0x0647, 0x0645, 0x0627, 0x0628, 0x062a, 0x0643, 0x0644, 0x0645, 0x0648, 0x0634, 0x0639, 0x0631, 0x0628, 0x064a, 0x061f], puny: "egbpdaj6bu4bxfgehfvwxn" },
  // (B) Chinese (simplified).
  { id: "B", cps: [0x4ed6, 0x4eec, 0x4e3a, 0x4ec0, 0x4e48, 0x4e0d, 0x8bf4, 0x4e2d, 0x6587], puny: "ihqwcrb4cv8a8dqg056pqjye" },
  // (D) Czech.
  { id: "D", cps: [0x0050, 0x0072, 0x006f, 0x010d, 0x0070, 0x0072, 0x006f, 0x0073, 0x0074, 0x011b, 0x006e, 0x0065, 0x006d, 0x006c, 0x0075, 0x0076, 0x00ed, 0x010d, 0x0065, 0x0073, 0x006b, 0x0079], puny: "Proprostnemluvesky-uyb24dma41a" },
  // (I) Russian (Cyrillic); the RFC's mixed-case digits are only case annotations.
  { id: "I", cps: [0x043f, 0x043e, 0x0447, 0x0435, 0x043c, 0x0443, 0x0436, 0x0435, 0x043e, 0x043d, 0x0438, 0x043d, 0x0435, 0x0433, 0x043e, 0x0432, 0x043e, 0x0440, 0x044f, 0x0442, 0x043f, 0x043e, 0x0440, 0x0443, 0x0441, 0x0441, 0x043a, 0x0438], puny: "b1abfaaepdrnnbgefbaDotcwatmq2g4l" },
  // (J) Spanish.
  { id: "J", cps: [0x0050, 0x006f, 0x0072, 0x0071, 0x0075, 0x00e9, 0x006e, 0x006f, 0x0070, 0x0075, 0x0065, 0x0064, 0x0065, 0x006e, 0x0073, 0x0069, 0x006d, 0x0070, 0x006c, 0x0065, 0x006d, 0x0065, 0x006e, 0x0074, 0x0065, 0x0068, 0x0061, 0x0062, 0x006c, 0x0061, 0x0072, 0x0065, 0x006e, 0x0045, 0x0073, 0x0070, 0x0061, 0x00f1, 0x006f, 0x006c], puny: "PorqunopuedensimplementehablarenEspaol-fmd56a" },
  // (L) 3<nen>B<gumi><kinpachi><sensei>.
  { id: "L", cps: [0x0033, 0x5e74, 0x0042, 0x7d44, 0x91d1, 0x516b, 0x5148, 0x751f], puny: "3B-ww4c5e180e575a65lsy2b" },
  // (M) <amuro><namie>-with-SUPER-MONKEYS.
  { id: "M", cps: [0x5b89, 0x5ba4, 0x5948, 0x7f8e, 0x6075, 0x002d, 0x0077, 0x0069, 0x0074, 0x0068, 0x002d, 0x0053, 0x0055, 0x0050, 0x0045, 0x0052, 0x002d, 0x004d, 0x004f, 0x004e, 0x004b, 0x0045, 0x0059, 0x0053], puny: "-with-SUPER-MONKEYS-pc58ag80a8qai00g7n9n" },
  // (P) Maji<de>Koi<suru>5<byou><mae>.
  { id: "P", cps: [0x004d, 0x0061, 0x006a, 0x0069, 0x3067, 0x004b, 0x006f, 0x0069, 0x3059, 0x308b, 0x0035, 0x79d2, 0x524d], puny: "MajiKoi5-783gue6qz075azm5e" },
  // (Q) <pafii>de<runba>.
  { id: "Q", cps: [0x30d1, 0x30d5, 0x30a3, 0x30fc, 0x0064, 0x0065, 0x30eb, 0x30f3, 0x30d0], puny: "de-jg4avhby1noc0d" },
  // (R) <sono><supiido><de>.
  { id: "R", cps: [0x305d, 0x306e, 0x30b9, 0x30d4, 0x30fc, 0x30c9, 0x3067], puny: "d9juau41awczczp" },
  // (S) an all-ASCII string: the delimiter is still added.
  { id: "S", cps: [0x002d, 0x003e, 0x0020, 0x0024, 0x0031, 0x002e, 0x0030, 0x0030, 0x0020, 0x003c, 0x002d], puny: "-> $1.00 <--" },
];

/**
 * Prove the encoder and decoder against RFC 3492's samples.
 *
 * @returns one line per sample that failed
 */
export function punycodeSelfTest(): string[] {
  // Failures found.
  const out: string[] = [];
  // Each sample both ways.
  for (const s of RFC3492_SAMPLES) {
    // The sample as a string.
    const text = String.fromCodePoint(...s.cps);
    // Decoding must give the code points back exactly.
    let decoded = "";
    // A throw is a failure.
    try {
      // Decode the RFC's string.
      decoded = punyDecode(s.puny);
    } catch (err) {
      // Recorded.
      out.push(`punycode sample ${s.id}: decode threw ${(err as Error).message}`);
    }
    // Compared code point for code point.
    if (decoded !== text) out.push(`punycode sample ${s.id}: decodes to the wrong string`);
    // Encoding must give the RFC's string, ignoring the case annotations of its digits.
    if (punyEncode(text).toLowerCase() !== s.puny.toLowerCase()) out.push(`punycode sample ${s.id}: encodes to ${punyEncode(text)}`);
  }
  // The failures.
  return out;
}
