// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/netskope-dlp-match-predictor/compute.ts
// ----------------------------------------------------------------------------
// WHY A DLP RULE FIRED, OR DID NOT.
//
// Predefined data identifiers are not regular expressions. A pattern that
// looks like a credit card number is a CANDIDATE; whether it counts as a match
// depends on a checksum, and that difference is where nearly every DLP tuning
// argument actually lives.
//
// "It flagged a purchase order number" is usually a sixteen-digit string that
// happens to pass Luhn. "It missed a real card" is usually a number with a
// transposed digit, which fails Luhn and is therefore not a card as far as the
// engine is concerned. Both complaints are about the checksum, and neither is
// resolvable by arguing about the regex.
//
// So this computes three things, separately, because they fail separately:
//   1. how many CANDIDATES the shape finds
//   2. how many of those PASS the checksum and are therefore matches
//   3. whether the count of matches reaches the rule's THRESHOLD
//
// A rule that does not fire has failed at exactly one of those, and knowing
// which one tells you what to change.
//
// THE IDENTIFIERS IMPLEMENTED are the ones whose validation is a published,
// unambiguous algorithm:
//   * payment cards - the Luhn algorithm (ISO/IEC 7812)
//   * Brazilian CPF  - the two mod-11 check digits
//   * Brazilian CNPJ - the two mod-11 check digits with the documented weights
// CPF and CNPJ are here deliberately: this site's readers work in Brazil, and
// Netskope ships predefined identifiers for both.
//
// WHAT THIS IS NOT: it is not Netskope's engine, and it does not model
// proximity keywords, dictionaries, fingerprinting, exact data match, OCR, or
// file-type detection. It models the checksum step, which is the one that
// surprises people, and it says so rather than implying completeness.
//
// PAGE LANGUAGE (02/11/2026): every reason, explanation, finding and error is
// built as an EngineText (src/lib/tools/engine-text.ts): a stable id, the
// English as before, and its values. predictMatchesLocalisable() returns them
// as such for the page (pack keys tools.netskope-dlp-match-predictor.engine.<id>);
// predictMatches() returns plainText() of the same reading, so the API, the
// share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

export type IdentifierKind = "payment-card" | "cpf" | "cnpj";

/** S is string in the API's reading and EngineText in the page's (predictMatchesLocalisable). */
export interface DlpCandidate<S = string> {
  /** The digits as found, separators removed. */
  digits: string;
  /** As it appeared in the text. */
  raw: string;
  /** Did it pass the checksum? */
  valid: boolean;
  /** Why not, when it did not. */
  reason: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface DlpResult<S = string> {
  kind: IdentifierKind;
  threshold: number;
  candidates: DlpCandidate<S>[]; // each candidate
  matchCount: number;
  /** Would the rule fire? */
  fires: boolean;
  /** Which stage failed, when it did not fire. */
  failedStage: "no-candidates" | "checksum" | "threshold" | null;
  explanation: S; // a sentence
  findings: S[]; // each a sentence
}

export class DlpParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DlpParseError";
  }
}

/** Luhn, as used for payment cards. Doubles every second digit from the right. */
export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** CPF: eleven digits, two mod-11 check digits, rejecting all-same sequences. */
export function cpfValid(digits: string): boolean {
  if (!/^\d{11}$/.test(digits)) return false;
  // 111.111.111-11 and its siblings satisfy the arithmetic but are not issued.
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const d = digits.split("").map(Number);
  for (const [len, pos] of [
    [9, 9],
    [10, 10],
  ] as const) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += d[i] * (len + 1 - i);
    const rest = (sum * 10) % 11;
    const check = rest === 10 ? 0 : rest;
    if (check !== d[pos]) return false;
  }
  return true;
}

/** CNPJ: fourteen digits, two mod-11 check digits with the documented weights. */
export function cnpjValid(digits: string): boolean {
  if (!/^\d{14}$/.test(digits)) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const d = digits.split("").map(Number);
  const check = (weights: number[], upTo: number, pos: number): boolean => {
    let sum = 0;
    for (let i = 0; i < upTo; i++) sum += d[i] * weights[i];
    const rest = sum % 11;
    const expected = rest < 2 ? 0 : 11 - rest;
    return expected === d[pos];
  };
  if (!check([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], 12, 12)) return false;
  return check([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], 13, 13);
}

/** Shapes that produce candidates, before any checksum is applied. */
const SHAPES: Record<IdentifierKind, { re: RegExp; label: string; expect: number }> = {
  "payment-card": {
    // 13-19 digits, optionally grouped by spaces or hyphens.
    re: /\b(?:\d[ -]?){12,18}\d\b/g,
    label: "payment card",
    expect: 16,
  },
  cpf: { re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, label: "CPF", expect: 11 },
  cnpj: { re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, label: "CNPJ", expect: 14 },
};

/** Each identifier's name as a sentence argument (the page translates "payment card"; CPF and CNPJ stay as written). */
const LABEL_TEXT: Record<IdentifierKind, EngineText> = {
  "payment-card": say("label.card", "payment card"), // a card
  cpf: say("label.cpf", "CPF"), // the Brazilian individual taxpayer number
  cnpj: say("label.cnpj", "CNPJ"), // the Brazilian company registration number
};

const VALIDATORS: Record<IdentifierKind, (d: string) => boolean> = {
  "payment-card": luhnValid,
  cpf: cpfValid,
  cnpj: cnpjValid,
};

/** Find candidates, check them, and decide whether the rule fires. */
export function predictMatches(
  text: string,
  kind: IdentifierKind,
  threshold: number,
): DlpResult {
  return plainText(predictMatchesLocalisable(text, kind, threshold)); // the same reading, as English (the API's and the vectors')
} // predictMatches

/**
 * A parse error that carries its sentence, so the page can show it in its own language.
 * @param m the sentence
 * @returns the error to throw (class and message as before)
 */
function parseError(m: EngineText): DlpParseError {
  return withEngineText(new DlpParseError(m.text), m); // the same class and message, plus the sentence
} // parseError

/** The page's reading: the same as predictMatches(), with every sentence an EngineText (id, English, values). */
export function predictMatchesLocalisable(
  text: string,
  kind: IdentifierKind,
  threshold: number,
): DlpResult<EngineText> {
  if (!Number.isInteger(threshold) || threshold < 1) {
    throw parseError(say("err.threshold", `A threshold is a whole number of matches, at least 1; got ${threshold}.`, { threshold: String(threshold) })); // a bad threshold
  }
  const shape = SHAPES[kind];
  if (!shape) throw parseError(say("err.kind", `Unknown identifier "${kind}".`, { kind })); // an unknown identifier
  const candidates: DlpCandidate<EngineText>[] = []; // each candidate, its reason with an id
  const seen = new Set<string>();
  for (const m of text.matchAll(shape.re)) {
    const raw = m[0];
    const digits = raw.replace(/\D/g, "");
    if (kind === "payment-card" && (digits.length < 13 || digits.length > 19)) continue;
    if (kind !== "payment-card" && digits.length !== shape.expect) continue;
    if (seen.has(digits)) continue;
    seen.add(digits);
    const valid = VALIDATORS[kind](digits);
    candidates.push({
      digits,
      raw,
      valid,
      reason: valid
        ? say("reason.valid", "Passes the checksum.") // valid
        : /^(\d)\1+$/.test(digits)
          ? say("reason.repeated", "A repeated-digit sequence. The arithmetic may work but these are never issued, so the engine rejects them.") // repeated digits
          : say("reason.invalid", "Fails the checksum, so the engine does not treat it as this identifier at all - however much it looks like one."), // invalid
    });
  }

  const matchCount = candidates.filter((c) => c.valid).length;
  const fires = matchCount >= threshold;

  let failedStage: DlpResult["failedStage"] = null;
  let explanation: EngineText; // the verdict's explanation, with its id
  const count = String(candidates.length), matches = String(matchCount), limit = String(threshold); // the figures
  if (candidates.length === 0) {
    failedStage = "no-candidates";
    const label = LABEL_TEXT[kind]; // the identifier's name
    explanation = say("explain.noCandidates", `Nothing in the text has the shape of a ${label}, so the checksum never runs and the rule cannot fire. If you expected a hit, check for formatting the pattern does not accept.`, { label }); // nothing shaped right
  } else if (matchCount === 0) {
    failedStage = "checksum";
    explanation = candidates.length === 1 // one string, or several
      ? say("explain.checksumOne", `${count} string had the right shape and none passed the checksum. The engine does not count these, which is exactly the behaviour that makes people think DLP "missed" something.`, { count }) // one
      : say("explain.checksumMany", `${count} strings had the right shape and none passed the checksum. The engine does not count these, which is exactly the behaviour that makes people think DLP "missed" something.`, { count }); // several
  } else if (!fires) {
    failedStage = "threshold";
    explanation = matchCount === 1 // one match, or several
      ? say("explain.belowOne", `${matches} valid match against a threshold of ${limit}. The identifier worked; the rule is set to require more before it acts.`, { matches, limit }) // one
      : say("explain.belowMany", `${matches} valid matches against a threshold of ${limit}. The identifier worked; the rule is set to require more before it acts.`, { matches, limit }); // several
  } else {
    explanation = matchCount === 1 // one match, or several
      ? say("explain.firesOne", `${matches} valid match meets the threshold of ${limit}, so the rule fires.`, { matches, limit }) // one
      : say("explain.firesMany", `${matches} valid matches meets the threshold of ${limit}, so the rule fires.`, { matches, limit }); // several (the English as the engine has always written it)
  }
  const findings: EngineText[] = []; // each finding with its id
  const rejected = candidates.length - matchCount;
  if (rejected > 0 && matchCount > 0) {
    const n = String(rejected); // how many
    findings.push(rejected === 1 // one candidate, or several
      ? say("find.rejectedOne", `${n} candidate looked right and failed the checksum. That gap is why raising or lowering a threshold rarely fixes a tuning complaint: the count the rule sees is not the count a person reading the document would make.`, { n }) // one
      : say("find.rejectedMany", `${n} candidates looked right and failed the checksum. That gap is why raising or lowering a threshold rarely fixes a tuning complaint: the count the rule sees is not the count a person reading the document would make.`, { n })); // several
  }
  if (kind === "payment-card" && candidates.some((c) => c.valid && c.digits.length !== 16)) {
    findings.push(say("find.length", // card lengths
      "A valid card here is not sixteen digits. Card numbers run from thirteen to nineteen, and rules written around a fixed length miss the rest.",
    ));
  }
  if (matchCount > 0 && threshold > matchCount) {
    findings.push(say("find.blunt", // raising the threshold
      "Raising a threshold is a blunt way to cut false positives, because it also delays the true ones. A proximity keyword or a narrower channel usually costs less accuracy.",
    ));
  }
  return { kind, threshold, candidates, matchCount, fires, failedStage, explanation, findings };
}
