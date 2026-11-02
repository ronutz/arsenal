// ============================================================================
// src/lib/share/cases/netskope-dlp-match-predictor.ts
// ----------------------------------------------------------------------------
// Share cases of the DLP match predictor (2026-11-01, wave 4B): stand-ins go,
// one per candidate, with its separators and length and digits the page
// makes (zeros, its place, check digits that pass or fail as it did), with the
// identifier and the threshold; never the text or a digit of a number; a
// repeated-digit sequence goes as it is; a text with no candidate gets no
// link; decode accepts only stand-ins of their place.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { DLP_SHARE, type DlpShareState } from "../../tools/netskope-dlp-match-predictor/share"; // the spec

/** The page's Example: a published test card, one that fails Luhn, and an order number. */
const EXAMPLE = "Cards 4111111111111111 and 4111111111111112 were submitted with order 1234567812345678."; // as the component holds it
/** Its stand-ins: place 1 passes, places 2 and 3 fail, as the three candidates did. */
const EXAMPLE_STANDINS = "0000000000000018\n0000000000000027\n0000000000000035"; // Luhn: 18 passes; 27 and 35 fail

/** A note with two CPFs (a valid one and one with a wrong check digit) and a person's name. */
const CPF_NOTE = "Cliente Maria Souza, CPF 123.456.789-09; dependente 987.654.321-01."; // the first passes the two mod-11 digits
/** Its stand-ins. */
const CPF_STANDINS = "000.000.001-91\n000.000.002-73"; // place 1 passes (91); place 2 would pass with 72, its last digit moved to 73, so it fails

/** The cases. */
export const NETSKOPE_DLP_SHARE_CASES = defineShareCases<DlpShareState, DlpShareState>({
  spec: DLP_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE, kind: "payment-card", threshold: "1" }, params: { input: EXAMPLE_STANDINS, kind: "payment-card", threshold: "1" }, restored: { input: EXAMPLE_STANDINS, kind: "payment-card", threshold: "1" }, mustNotContain: ["4111111111111111", "4111111111111112", "1234567812345678", "Cards", "order"] }, // never a digit of a number, never the text
    { id: "cpf-threshold", state: { input: CPF_NOTE, kind: "cpf", threshold: "02" }, params: { input: CPF_STANDINS, kind: "cpf", threshold: "2" }, restored: { input: CPF_STANDINS, kind: "cpf", threshold: "2" }, mustNotContain: ["123.456.789-09", "12345678909", "987.654.321-01", "Maria", "Souza"] }, // separators kept, the threshold as read
    { id: "repeated-kept", state: { input: "test card 4444 4444 4444 4444 then 5500-0000-0000-0004", kind: "payment-card", threshold: "1" }, params: { input: "4444 4444 4444 4444\n0000-0000-0000-0026", kind: "payment-card", threshold: "1" }, restored: { input: "4444 4444 4444 4444\n0000-0000-0000-0026", kind: "payment-card", threshold: "1" }, mustNotContain: ["5500"] }, // a repeated-digit sequence is no one's number
  ],
  empty: [
    { id: "blank", state: { input: "", kind: "payment-card", threshold: "1" } }, // nothing typed
    { id: "threshold-zero", state: { input: EXAMPLE, kind: "payment-card", threshold: "0" } }, // the page's error
  ],
  blocked: [
    { id: "no-candidate", state: { input: "Nothing that looks like a card here.", kind: "payment-card", threshold: "1" }, code: "none" }, // the diagnosis is about the text itself
  ],
  reject: [
    { id: "unknown-kind", values: { input: EXAMPLE_STANDINS, kind: "iban", threshold: "1" } }, // not an identifier
    { id: "threshold-zero", values: { input: EXAMPLE_STANDINS, kind: "payment-card", threshold: "0" } }, // a whole number from 1
    { id: "missing-threshold", values: { input: EXAMPLE_STANDINS, kind: "payment-card", threshold: null } }, // all three are written
    { id: "real-number", values: { input: "4111111111111111", kind: "payment-card", threshold: "1" } }, // not place 1's stand-in
    { id: "text", values: { input: "Cards 0000000000000018", kind: "payment-card", threshold: "1" } }, // the link never carries text
    { id: "wrong-place", values: { input: "0000000000000027", kind: "payment-card", threshold: "1" } }, // place 2's stand-in on line 1
  ],
});
