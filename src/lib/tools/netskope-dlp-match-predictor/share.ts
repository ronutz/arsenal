// ============================================================================
// src/lib/tools/netskope-dlp-match-predictor/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the DLP match predictor (posture "derived",
// specified on 2026-11-01, wave 4B; the inventory had "none": "no share until
// a derived form is specified"). The box holds what the reader suspects is
// sensitive: payment card numbers (a PAN "identifies the issuer and the
// cardholder account", PCI SSC glossary, read 2026-11-01), CPF and CNPJ
// numbers, and the text around them. The manifest: "Text pasted here is
// never transmitted, stored or logged". A link never carries that text. What
// the page diagnoses is structural: how many candidates the shape found, which
// passed the checksum, and whether the count reached the threshold; so a link
// carries STAND-INS:
//   - one line per candidate, in the page's order, each with the candidate's
//     own separators and length, and digits the page makes: zeros, the
//     candidate's number in the list, and check digits chosen so the checksum
//     passes or fails exactly as the candidate's did (Luhn for cards, the two
//     mod-11 digits for CPF and CNPJ, the engine's own validators confirming);
//   - a repeated-digit sequence (1111 ...), which is no one's number, goes as
//     it is, so the page gives the same reason for it;
//   - the identifier and the threshold, as the page reads them;
//   - never the text around the numbers, never a digit of a number.
// The stand-ins are read again by the page's own engine and must give the same
// diagnosis (the same candidates by length, separators, result and reason,
// the same count, verdict, failed stage, explanation and findings), or there
// is no link (code "copy"). A text with no candidate gets no link (code
// "none"): its diagnosis depends on the text, which never goes.
//
// Names: `input` (the stand-ins), `kind` (payment-card, cpf, cnpj) and
// `threshold` (a whole number from 1). decode accepts only what encode
// writes: every line a stand-in of its place in the list, so the arrival note
// ("these are stand-ins") is always true.
//
// Arrival: the stand-ins fill the box, the identifier and the threshold are
// set, the page evaluates, and a note says the numbers are stand-ins.
// ============================================================================

import { cnpjValid, cpfValid, luhnValid, predictMatches, type DlpResult, type IdentifierKind } from "./compute"; // the page's own engine and validators
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The identifiers, by their stable ids (the select's values). */
export const DLP_KINDS: readonly IdentifierKind[] = Object.freeze(["payment-card", "cpf", "cnpj"]); // as the page offers them

/** The state: the box, the identifier and the threshold field, as the page holds them. */
export interface DlpShareState {
  /** The box (the paste when encoding; the stand-ins on arrival). */
  input: string;
  /** The identifier. */
  kind: IdentifierKind;
  /** The threshold field, as typed. */
  threshold: string;
}

/** A whole threshold from 1, as a link writes it. */
const THRESHOLD_RE = /^[1-9]\d{0,8}$/; // bounded

/**
 * The Luhn check digit for a body (the digit that makes body + digit pass).
 * @param body the digits before the check digit
 * @returns the check digit
 */
function luhnDigit(body: string): number {
  let sum = 0; // the running sum
  for (let i = body.length - 1, dbl = true; i >= 0; i--, dbl = !dbl) { let d = body.charCodeAt(i) - 48; if (dbl) { d *= 2; if (d > 9) d -= 9; } sum += d; } // the body's rightmost digit is doubled
  return (10 - (sum % 10)) % 10; // what completes it
} // luhnDigit

/**
 * A CPF check digit (the two mod-11 digits, as the engine checks them).
 * @param digits the digits before it (9 or 10)
 * @returns the digit
 */
function cpfDigit(digits: string): number {
  let sum = 0; // the weighted sum
  for (let i = 0; i < digits.length; i++) sum += (digits.charCodeAt(i) - 48) * (digits.length + 1 - i); // weights from length+1 down to 2
  const rest = (sum * 10) % 11; // the remainder
  return rest === 10 ? 0 : rest; // the digit
} // cpfDigit

/**
 * A CNPJ check digit (the documented weights, as the engine checks them).
 * @param digits the digits before it (12 or 13)
 * @returns the digit
 */
function cnpjDigit(digits: string): number {
  const weights = digits.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; // first or second digit
  let sum = 0; // the weighted sum
  for (let i = 0; i < digits.length; i++) sum += (digits.charCodeAt(i) - 48) * weights[i]; // weighted
  const rest = sum % 11; // the remainder
  return rest < 2 ? 0 : 11 - rest; // the digit
} // cnpjDigit

/** The engine's validator per identifier. */
const VALID: Readonly<Record<IdentifierKind, (d: string) => boolean>> = Object.freeze({ "payment-card": luhnValid, cpf: cpfValid, cnpj: cnpjValid }); // the engine's own

/**
 * The stand-in digits for the candidate at a place in the list: zeros, the place, and check digits that pass or fail.
 * @param kind the identifier
 * @param place the candidate's 1-based place in the list
 * @param length how many digits the candidate has
 * @param valid whether its checksum passed
 * @returns the digits, or null when none can be made (a length the place does not fit in)
 */
export function standInDigits(kind: IdentifierKind, place: number, length: number, valid: boolean): string | null {
  const checks = kind === "payment-card" ? 1 : 2; // one Luhn digit, or two mod-11 digits
  const tag = String(place); // the place, in decimal
  if (tag.length > length - checks) return null; // it does not fit
  let d = tag.padStart(length - checks, "0"); // zeros, then the place
  if (kind === "payment-card") d += String(luhnDigit(d)); // the digit that passes
  else if (kind === "cpf") { d += String(cpfDigit(d)); d += String(cpfDigit(d)); } // the two that pass
  else { d += String(cnpjDigit(d)); d += String(cnpjDigit(d)); } // the two that pass
  if (!valid) d = d.slice(0, -1) + String((Number(d[d.length - 1]) + 1) % 10); // the last one moved: it now fails
  return VALID[kind](d) === valid ? d : null; // the engine confirms, or none
} // standInDigits

/**
 * A raw candidate with its digits replaced in order (its separators kept).
 * @param raw the candidate as found
 * @param digits the digits to put in
 * @returns the stand-in as written
 */
function withDigits(raw: string, digits: string): string {
  let k = 0; // the next digit to use
  return raw.replace(/\d/g, () => digits[k++]); // each digit in turn
} // withDigits

/** The diagnosis a reading gives, without the numbers themselves (for comparing a reading with the stand-ins'). */
function diagnosisOf(r: DlpResult): string {
  return JSON.stringify({ kind: r.kind, threshold: r.threshold, cands: r.candidates.map((c) => [c.raw.replace(/\d/g, "9"), c.valid, c.reason]), matchCount: r.matchCount, fires: r.fires, failedStage: r.failedStage, explanation: r.explanation, findings: r.findings }); // shapes, results, verdict, words
} // diagnosisOf

/** What the share of a reading comes to: the stand-ins, or why there is none. */
export type DlpShareCopy =
  | { ok: true; input: string } // the stand-ins, one per line
  | { ok: false; code: "empty" | "none" | "copy" }; // nothing read, no candidate, or stand-ins that would read differently

/**
 * Make the stand-ins of a reading (the page calls this once per change, with its own reading).
 * @param r the page's reading (null when there is none)
 * @returns the stand-ins, or why there are none
 */
export function dlpStandIns(r: DlpResult | null): DlpShareCopy {
  if (!r) return { ok: false, code: "empty" }; // nothing read
  if (r.candidates.length === 0) return { ok: false, code: "none" }; // the diagnosis is about the text itself
  const lines: string[] = []; // one per candidate
  for (let i = 0; i < r.candidates.length; i++) { // in the page's order
    const c = r.candidates[i]; // this candidate
    if (/^(\d)\1+$/.test(c.digits)) { lines.push(c.raw); continue; } // a repeated-digit sequence: no one's number, kept for its reason
    const d = standInDigits(r.kind, i + 1, c.digits.length, c.valid); // the stand-in digits
    if (d === null) return { ok: false, code: "copy" }; // none can be made
    lines.push(withDigits(c.raw, d)); // the candidate's shape, the stand-in's digits
  } // candidates
  const input = lines.join("\n"); // one per line
  let again: DlpResult | null = null; // the stand-ins read again
  try { again = predictMatches(input, r.kind, r.threshold); } catch { again = null; } // never throws for a valid threshold
  return again && diagnosisOf(again) === diagnosisOf(r) ? { ok: true, input } : { ok: false, code: "copy" }; // the same diagnosis, or no link
} // dlpStandIns

/**
 * The encoding of the stand-ins the page already made.
 * @param c the stand-ins, or why there are none
 * @param kind the identifier
 * @param threshold the threshold the page read
 * @returns the stand-ins with the identifier and the threshold, nothing, or blocked
 */
export function encodeDlpShare(c: DlpShareCopy, kind: IdentifierKind, threshold: number): ShareEncoding {
  if (!c.ok) return c.code === "empty" ? { ok: false, reason: "empty" } : { ok: false, reason: "blocked", code: c.code }; // nothing, or why not
  return { ok: true, params: { input: c.input, kind, threshold: String(threshold) } }; // the stand-ins and the settings
} // encodeDlpShare

/**
 * The page's reading of a state, or null when it shows none (a blank box, or a threshold it refuses).
 * @param s the state
 * @returns the reading, or null
 */
export function dlpReading(s: DlpShareState): DlpResult | null {
  if (s.input.trim() === "") return null; // nothing typed
  try { return predictMatches(s.input, s.kind, Number(s.threshold)); } catch { return null; } // an error shows instead
} // dlpReading

/** The spec. */
export const DLP_SHARE: ShareSpec<DlpShareState> = Object.freeze({
  tool: "netskope-dlp-match-predictor", // the slug
  posture: "derived", // stand-ins, never the text or a digit of a number
  carriesKey: "share.carries", // tools.netskope-dlp-match-predictor.share.carries
  names: ["input", "kind", "threshold"], // #input=&kind=&threshold=
  /** The stand-ins and the settings, nothing, or blocked (the spec reads and makes the stand-ins itself). */
  encode(s: DlpShareState): ShareEncoding {
    const r = dlpReading(s); // the reading
    return encodeDlpShare(dlpStandIns(r), s.kind, r ? r.threshold : 1); // made, checked, encoded
  },
  /** Only what encode writes: a known identifier, a whole threshold, and lines that are each a stand-in of their place. */
  decode(v: Readonly<Record<string, string | null>>): DlpShareState | null {
    if (!v.input || !v.kind || !v.threshold) return null; // all three are needed
    if (!(DLP_KINDS as readonly string[]).includes(v.kind) || !THRESHOLD_RE.test(v.threshold)) return null; // unknown or malformed
    const kind = v.kind as IdentifierKind; // the identifier
    const lines = v.input.split("\n"); // one stand-in per line
    for (let i = 0; i < lines.length; i++) { // each line
      if (!/^\d[\d .\/-]{0,40}$/.test(lines[i])) return null; // digits and the shapes' separators only
      const d = lines[i].replace(/\D/g, ""); // its digits
      if (/^(\d)\1+$/.test(d)) continue; // a repeated-digit sequence, kept as it was
      if (d !== standInDigits(kind, i + 1, d.length, true) && d !== standInDigits(kind, i + 1, d.length, false)) return null; // not this place's stand-in
    } // lines
    return { input: v.input, kind, threshold: v.threshold }; // the state
  },
});
