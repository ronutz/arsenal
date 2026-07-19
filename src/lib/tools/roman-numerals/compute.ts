// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/roman-numerals/compute.ts
// ----------------------------------------------------------------------------
// ROMAN NUMERALS - a bidirectional converter and builder for the classical
// (subtractive) system, range 1..3999.
//
// Design decisions, stated openly (tools that compute, never guess):
// - RANGE: 1..3999. The classical seven-symbol system has no zero, no
//   negatives, and no standard single-glyph symbol above M (1000); values
//   >= 4000 historically used the vinculum (overline), which has no plain-text
//   form, so the tool refuses them with an explanation instead of inventing
//   a convention.
// - PARSING is permissive-but-honest: additive forms the Romans themselves
//   used on monuments and clock faces (IIII, VIIII, MDCCCCX) are ACCEPTED and
//   valued correctly, but flagged non-canonical with the canonical spelling
//   shown. Truly malformed strings (IL, VX, IIIII, XM) are REJECTED with the
//   specific rule they break.
// - The BUILDER decomposes a value place by place (1994 -> M + CM + XC + IV),
//   which is both how the canonical form is constructed and how it is read.
// ============================================================================

/** One place-value step of the canonical construction. */
export interface RomanPlace {
  /** The decimal contribution of this place (e.g. 900). */
  value: number;
  /** The numeral chunk for it (e.g. "CM"). */
  numeral: string;
}

/** The full analysis returned for either direction of conversion. */
export interface RomanAnalysis {
  /** Which direction ran: a number was converted, or a numeral was parsed. */
  kind: "fromNumber" | "fromNumeral";
  /** The decimal value. */
  value: number;
  /** The canonical (subtractive) numeral for that value. */
  canonical: string;
  /** For fromNumeral: the input as normalized (uppercased, trimmed). */
  input?: string;
  /** For fromNumeral: true when the input already was the canonical form. */
  isCanonical?: boolean;
  /** Place-by-place construction of the canonical form. */
  places: RomanPlace[];
  /** Human-readable notes (non-canonical warnings, etc.). */
  notes: string[];
}

/** Thrown for invalid input; `message` names the exact rule broken. */
export class RomanInputError extends Error {}

/** Symbol values, and the 13 canonical chunks in descending order. */
const SYMBOLS: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const CHUNKS: RomanPlace[] = [
  { value: 1000, numeral: "M" }, { value: 900, numeral: "CM" },
  { value: 500, numeral: "D" }, { value: 400, numeral: "CD" },
  { value: 100, numeral: "C" }, { value: 90, numeral: "XC" },
  { value: 50, numeral: "L" }, { value: 40, numeral: "XL" },
  { value: 10, numeral: "X" }, { value: 9, numeral: "IX" },
  { value: 5, numeral: "V" }, { value: 4, numeral: "IV" },
  { value: 1, numeral: "I" },
];

/** Convert 1..3999 to the canonical numeral, with its place breakdown. */
export function toRoman(n: number): { canonical: string; places: RomanPlace[] } {
  if (!Number.isInteger(n)) throw new RomanInputError("Only whole numbers have Roman numerals.");
  if (n < 1) throw new RomanInputError("Roman numerals have no zero and no negatives: the smallest value is I (1).");
  if (n > 3999) throw new RomanInputError("Above 3999 the classical system needed the vinculum (an overline multiplying by 1000), which has no plain-text form. This tool stays within 1..3999.");
  const places: RomanPlace[] = [];
  let rest = n;
  let out = "";
  for (const c of CHUNKS) {
    while (rest >= c.value) {
      // Each chunk may repeat (M, C, X, I up to three times); subtractive
      // chunks (CM, CD, XC, ...) can mathematically appear only once.
      places.push(c);
      out += c.numeral;
      rest -= c.value;
    }
  }
  return { canonical: out, places };
}

/**
 * Parse a numeral string. Accepts canonical AND historical additive forms
 * (IIII, VIIII) - valued correctly, flagged non-canonical. Rejects malformed
 * strings with the specific rule broken.
 */
export function fromRoman(raw: string): RomanAnalysis {
  const input = raw.trim().toUpperCase();
  if (!input) throw new RomanInputError("Enter a Roman numeral (for example MMXXVI) or a number (for example 2026).");
  for (const ch of input) {
    if (!(ch in SYMBOLS)) throw new RomanInputError(`"${ch}" is not a Roman symbol. The seven symbols are I, V, X, L, C, D, M.`);
  }
  // Structural validation, symbol by symbol:
  // - a smaller symbol before a larger one must be a legal subtractive pair
  //   (I before V/X; X before L/C; C before D/M), and only ONE such symbol
  //   may be subtracted at a time (IIX is invalid);
  // - V, L, D never repeat and are never subtracted.
  let value = 0;
  let repeats = 1;
  for (let i = 0; i < input.length; i++) {
    const cur = SYMBOLS[input[i]];
    const next = i + 1 < input.length ? SYMBOLS[input[i + 1]] : 0;
    repeats = i > 0 && input[i] === input[i - 1] ? repeats + 1 : 1;
    if ("VLD".includes(input[i]) && repeats > 1) {
      throw new RomanInputError(`${input[i]} never repeats: ${input[i]} is a "five" symbol (5, 50, 500), and two of them are written as the next "ten" symbol instead.`);
    }
    if (cur < next) {
      const pairOk =
        (input[i] === "I" && (input[i + 1] === "V" || input[i + 1] === "X")) ||
        (input[i] === "X" && (input[i + 1] === "L" || input[i + 1] === "C")) ||
        (input[i] === "C" && (input[i + 1] === "D" || input[i + 1] === "M"));
      if (!pairOk) throw new RomanInputError(`"${input[i]}${input[i + 1]}" is not a legal subtractive pair. Only IV, IX, XL, XC, CD, CM subtract.`);
      if (repeats > 1) throw new RomanInputError(`"${input.slice(i - 1, i + 2)}" subtracts a repeated symbol; only a single symbol may be subtracted (IIX is not 8; VIII is).`);
      value += next - cur;
      i++; // consume the pair
      repeats = 1;
    } else {
      value += cur;
    }
  }
  if (value > 3999) throw new RomanInputError("That numeral values above 3999, past the classical plain-text range.");
  const { canonical, places } = toRoman(value);
  const isCanonical = input === canonical;
  const notes: string[] = [];
  if (!isCanonical) {
    notes.push(`"${input}" is a valid additive spelling (the Romans used forms like IIII on monuments and clock faces), but the canonical subtractive form is ${canonical}.`);
  }
  return { kind: "fromNumeral", value, canonical, input, isCanonical, places, notes };
}

/** Auto-detect direction: digits -> toRoman; letters -> fromRoman. */
export function analyzeRoman(raw: string): RomanAnalysis {
  const s = raw.trim();
  if (!s) throw new RomanInputError("Enter a Roman numeral (for example MMXXVI) or a number (for example 2026).");
  if (/^[0-9\s.,-]+$/.test(s)) {
    const n = Number(s.replace(/[\s.,]/g, (m) => (m === "-" ? "-" : "")));
    const clean = Number(s.replace(/\s/g, ""));
    const num = Number.isNaN(clean) ? n : clean;
    const { canonical, places } = toRoman(num);
    return { kind: "fromNumber", value: num, canonical, places, notes: [] };
  }
  return fromRoman(s);
}

/** API entrypoint (D-72): one string, auto-detected direction. */
export function run(input: string): RomanAnalysis {
  return analyzeRoman(String(input ?? ""));
}
