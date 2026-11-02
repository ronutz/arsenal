// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/greek-alphabet/compute.ts
// ----------------------------------------------------------------------------
// GREEK ALPHABET - the 24 letters as engineers meet them: glyph <-> name
// conversion, per-character decomposition of Greek text, transliteration, and
// the "where you have seen it" usage note (Ω ohms, λ wavelength, μ micro...).
//
// Design decisions, stated openly:
// - TRANSLITERATION follows the widely taught modern scheme (β->v, η->i,
//   ου->ou); where classical romanization differs (β->b, η->e), the letter
//   table carries BOTH so the tool explains instead of silently choosing.
// - FINAL SIGMA: ς is recognized as sigma's word-final form and said so.
// - Input auto-detection: Greek characters -> decomposition; otherwise the
//   input is matched against letter names ("lambda", "mu omega") -> glyphs.
//
// PAGE LANGUAGE (02/11/2026): the note and the input errors are built as
// EngineTexts (src/lib/tools/engine-text.ts): a stable id, the English exactly
// as before, and its values. analyzeGreekLocalisable() returns the reading
// with them in place; analyzeGreek() and run(), the API's and the vectors'
// entries, return plainText() of the same reading, byte for byte what they
// returned. Input errors keep their class and message and carry their
// sentence. The usage lines stay in LETTERS; the page looks them up by the
// letter's name (engine.letter.<name>.usage). The letter names themselves are
// the tool's input vocabulary and stay as they are.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** One letter of the alphabet, fully described. */
export interface GreekLetter {
  /** Position 1..24. */
  index: number;
  upper: string;
  lower: string;
  /** English letter name, lowercase ("alpha"). */
  name: string;
  /** Modern transliteration (what you would type). */
  translit: string;
  /** Classical romanization where it differs, else null. */
  classical: string | null;
  /** One-line "where engineers meet it" note. */
  usage: string;
}

export const LETTERS: GreekLetter[] = [
  { index: 1, upper: "Α", lower: "α", name: "alpha", translit: "a", classical: null, usage: "angles, alpha particles, software alpha releases, significance level in statistics" },
  { index: 2, upper: "Β", lower: "β", name: "beta", translit: "v", classical: "b", usage: "beta releases, beta particles, the beta of a stock" },
  { index: 3, upper: "Γ", lower: "γ", name: "gamma", translit: "g", classical: null, usage: "gamma rays, gamma correction in displays" },
  { index: 4, upper: "Δ", lower: "δ", name: "delta", translit: "d", classical: null, usage: "Δ = change or difference; river deltas; delta encoding" },
  { index: 5, upper: "Ε", lower: "ε", name: "epsilon", translit: "e", classical: null, usage: "an arbitrarily small quantity; machine epsilon in floating point" },
  { index: 6, upper: "Ζ", lower: "ζ", name: "zeta", translit: "z", classical: null, usage: "the Riemann zeta function; damping ratio in control theory" },
  { index: 7, upper: "Η", lower: "η", name: "eta", translit: "i", classical: "e", usage: "efficiency in engineering; refractive index contexts" },
  { index: 8, upper: "Θ", lower: "θ", name: "theta", translit: "th", classical: null, usage: "angles; Big-Theta complexity bounds" },
  { index: 9, upper: "Ι", lower: "ι", name: "iota", translit: "i", classical: null, usage: "'not one iota' - the smallest letter as the smallest amount" },
  { index: 10, upper: "Κ", lower: "κ", name: "kappa", translit: "k", classical: null, usage: "curvature; Cohen's kappa in statistics" },
  { index: 11, upper: "Λ", lower: "λ", name: "lambda", translit: "l", classical: null, usage: "wavelength; anonymous functions and the lambda calculus; AWS Lambda" },
  { index: 12, upper: "Μ", lower: "μ", name: "mu", translit: "m", classical: null, usage: "micro- (μs, μm); the mean in statistics; coefficient of friction" },
  { index: 13, upper: "Ν", lower: "ν", name: "nu", translit: "n", classical: null, usage: "frequency in physics; looks like a Latin v - a classic mix-up" },
  { index: 14, upper: "Ξ", lower: "ξ", name: "xi", translit: "x", classical: null, usage: "random variables; the hardest one to handwrite" },
  { index: 15, upper: "Ο", lower: "ο", name: "omicron", translit: "o", classical: null, usage: "'small o' (vs omega, 'big o'); little-o notation's namesake shape" },
  { index: 16, upper: "Π", lower: "π", name: "pi", translit: "p", classical: null, usage: "π = 3.14159...; Π for products, as Σ is for sums" },
  { index: 17, upper: "Ρ", lower: "ρ", name: "rho", translit: "r", classical: null, usage: "density; resistivity; correlation coefficient" },
  { index: 18, upper: "Σ", lower: "σ", name: "sigma", translit: "s", classical: null, usage: "Σ sums; σ standard deviation; six sigma; word-final form is ς" },
  { index: 19, upper: "Τ", lower: "τ", name: "tau", translit: "t", classical: null, usage: "time constants; torque; the 2π-partisans' circle constant" },
  { index: 20, upper: "Υ", lower: "υ", name: "upsilon", translit: "y", classical: "u/y", usage: "the ancestor of Latin U, V, W and Y - one Greek letter, four descendants" },
  { index: 21, upper: "Φ", lower: "φ", name: "phi", translit: "f", classical: "ph", usage: "the golden ratio; magnetic flux; phase angles" },
  { index: 22, upper: "Χ", lower: "χ", name: "chi", translit: "ch", classical: null, usage: "the chi-squared test; the X in Xmas is this letter, not the Latin X" },
  { index: 23, upper: "Ψ", lower: "ψ", name: "psi", translit: "ps", classical: null, usage: "wavefunctions in quantum mechanics; psychology's emblem" },
  { index: 24, upper: "Ω", lower: "ω", name: "omega", translit: "o", classical: null, usage: "Ω ohms - electrical resistance; ω angular frequency; 'big o' vs omicron" },
];

/** Fast lookup maps (built once at module load). */
const BY_GLYPH = new Map<string, { letter: GreekLetter; finalForm?: boolean }>();
for (const L of LETTERS) {
  BY_GLYPH.set(L.upper, { letter: L });
  BY_GLYPH.set(L.lower, { letter: L });
}
BY_GLYPH.set("ς", { letter: LETTERS[17], finalForm: true }); // final sigma
const BY_NAME = new Map<string, GreekLetter>(LETTERS.map((L) => [L.name, L]));

/** One decomposed character of a Greek input. */
export interface GreekChar {
  glyph: string;
  name: string;
  translit: string;
  finalForm: boolean;
  /** Non-letter passthrough (spaces, punctuation) has name "". */
  isLetter: boolean;
}

/** S is string in the API's reading and EngineText in the page's (analyzeGreekLocalisable). */
export interface GreekAnalysis<S = string> {
  kind: "decompose" | "byName";
  /** decompose: per-character breakdown of the Greek input. */
  chars?: GreekChar[];
  /** decompose: the transliterated string. */
  transliteration?: string;
  /** byName: the letters matched from name input. */
  letters?: GreekLetter[];
  notes: S[];
}

export class GreekInputError extends Error {}

/**
 * An input error carrying its sentence (02/11/2026): the message is the English, as before.
 * @param m the sentence
 * @returns the error to throw
 */
function inputError(m: EngineText): GreekInputError {
  return withEngineText(new GreekInputError(m.text), m); // the same class and message, plus the sentence
} // inputError

/** Strip combining accents so ά, έ, ή... resolve to their base letters. */
function baseChar(ch: string): string {
  return ch.normalize("NFD").replace(/[\u0300-\u036f\u0342-\u0345]/g, "").normalize("NFC");
}

/** True if the string contains any Greek-block character. */
export function hasGreek(s: string): boolean {
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(s);
}

/** Decompose Greek text character by character; transliterate the whole (02/11/2026: decomposeLocalisable() with every sentence as its English). */
export function decompose(text: string): GreekAnalysis {
  return plainText(decomposeLocalisable(text)); // the same reading, sentences as their English
}

/** decompose()'s reading with its note as an EngineText (02/11/2026). */
function decomposeLocalisable(text: string): GreekAnalysis<EngineText> {
  const chars: GreekChar[] = [];
  let translit = "";
  const notes: EngineText[] = [];
  let sawFinal = false;
  for (const raw of text) {
    const hit = BY_GLYPH.get(baseChar(raw));
    if (hit) {
      const isUpper = raw === raw.toUpperCase() && raw !== raw.toLowerCase();
      const t = isUpper ? hit.letter.translit.toUpperCase() : hit.letter.translit;
      chars.push({ glyph: raw, name: hit.letter.name, translit: t, finalForm: !!hit.finalForm, isLetter: true });
      translit += t;
      if (hit.finalForm) sawFinal = true;
    } else {
      chars.push({ glyph: raw, name: "", translit: raw, finalForm: false, isLetter: false });
      translit += raw;
    }
  }
  if (sawFinal) notes.push(say("note.finalSigma", "ς is sigma's word-final form: the same letter as σ, written differently at the end of a word."));
  return { kind: "decompose", chars, transliteration: translit, notes };
}

/** Look up letters by their names ("lambda", "mu omega", "Pi") (02/11/2026: byNamesLocalisable() with every sentence as its English). */
export function byNames(text: string): GreekAnalysis {
  return plainText(byNamesLocalisable(text)); // the same reading, sentences as their English
}

/** byNames()'s reading; its input errors carry their sentence (02/11/2026). */
function byNamesLocalisable(text: string): GreekAnalysis<EngineText> {
  const words = text.toLowerCase().split(/[\s,;+]+/).filter(Boolean);
  if (words.length === 0) throw inputError(say("err.enter", "Enter Greek text (ΤΕΧΝΗ) or letter names (lambda, mu omega)."));
  const letters: GreekLetter[] = [];
  for (const w of words) {
    const hit = BY_NAME.get(w);
    if (!hit) throw inputError(say("err.notName", `"${w}" is not a Greek letter name. The 24 names run alpha, beta, gamma ... chi, psi, omega.`, { word: w }));
    letters.push(hit);
  }
  return { kind: "byName", letters, notes: [] };
}

/** Auto-detect: Greek characters -> decompose; otherwise names -> letters (02/11/2026: the reading of analyzeGreekLocalisable() with every sentence as its English). */
export function analyzeGreek(raw: string): GreekAnalysis {
  return plainText(analyzeGreekLocalisable(raw)); // the same reading, sentences as their English
}

/**
 * The page's reading (02/11/2026): analyzeGreek()'s reading with its note as an EngineText; input errors carry their
 * sentence.
 * @param raw the box, as typed
 * @returns the reading with sentences as EngineTexts
 */
export function analyzeGreekLocalisable(raw: string): GreekAnalysis<EngineText> {
  const s = raw.trim();
  if (!s) throw inputError(say("err.enter", "Enter Greek text (ΤΕΧΝΗ) or letter names (lambda, mu omega)."));
  return hasGreek(s) ? decomposeLocalisable(s) : byNamesLocalisable(s);
}

/** API entrypoint (D-72): one string, auto-detected direction. */
export function run(input: string): GreekAnalysis {
  return analyzeGreek(String(input ?? ""));
}

/** The page's entry for the same input as run() (02/11/2026): the reading with sentences as EngineTexts. */
export function runLocalisable(input: string): GreekAnalysis<EngineText> {
  return analyzeGreekLocalisable(String(input ?? "")); // the reading with sentence ids
}
