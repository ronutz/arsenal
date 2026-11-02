// ============================================================================
// src/lib/share/cases/f5xc-rate-limit-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC rate-limit calculator (2026-11-01, wave 4B): a form;
// every field goes, always, as the calculation reads it (Number() of each
// field, an empty burst as 1); a form the page shows no result for has nothing
// to share; a malformed number, an unknown unit or a refused value is
// malformed on arrival.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { RATE_LIMIT_SHARE, type RateLimitShareState } from "../../tools/f5xc-rate-limit-calculator/share"; // the spec

/** The page as it opens (its default fields). */
const OPENING: RateLimitShareState = { number: "15", per: "Seconds", periods: "1", burst: "1", mitigation: "Disabled", lockout: "30", unit: "Seconds" }; // useState defaults
/** The page's Example. */
const EXAMPLE: RateLimitShareState = { number: "15", per: "Seconds", periods: "1", burst: "3", mitigation: "Block", lockout: "30", unit: "Seconds" }; // loadExample
/** The form's values in a link. */
const P = (s: RateLimitShareState) => ({ number: s.number, per: s.per, periods: s.periods, burst: s.burst, mitigation: s.mitigation, lockout: s.lockout, unit: s.unit }); // every field

/** The cases. */
export const F5XC_RATE_LIMIT_SHARE_CASES = defineShareCases<RateLimitShareState, RateLimitShareState>({
  spec: RATE_LIMIT_SHARE, // the spec
  accept: [
    { id: "opening", state: OPENING, params: P(OPENING), restored: OPENING }, // the page as it opens: a result already
    { id: "example", state: EXAMPLE, params: P(EXAMPLE), restored: EXAMPLE }, // the Example
    { id: "as-read", state: { number: " 0100", per: "Minutes", periods: "1e1", burst: "", mitigation: "Block", lockout: "2", unit: "Hours" }, params: { number: "100", per: "Minutes", periods: "10", burst: "1", mitigation: "Block", lockout: "2", unit: "Hours" }, restored: { number: "100", per: "Minutes", periods: "10", burst: "1", mitigation: "Block", lockout: "2", unit: "Hours" } }, // numbers as the calculation reads them
    { id: "fraction-burst-over-max", state: { number: "7", per: "Hours", periods: "2", burst: "1.5", mitigation: "Block", lockout: "49", unit: "Hours" }, params: { number: "7", per: "Hours", periods: "2", burst: "1.5", mitigation: "Block", lockout: "49", unit: "Hours" }, restored: { number: "7", per: "Hours", periods: "2", burst: "1.5", mitigation: "Block", lockout: "49", unit: "Hours" } }, // a lockout over F5's 48 hours is a result too
    { id: "disabled-empty-lockout", state: { number: "5", per: "Seconds", periods: "3", burst: "2", mitigation: "Disabled", lockout: "", unit: "Minutes" }, params: { number: "5", per: "Seconds", periods: "3", burst: "2", mitigation: "Disabled", lockout: "0", unit: "Minutes" }, restored: { number: "5", per: "Seconds", periods: "3", burst: "2", mitigation: "Disabled", lockout: "0", unit: "Minutes" } }, // the lockout is not read while Disabled
  ],
  empty: [
    { id: "cleared", state: { number: "", per: "Seconds", periods: "", burst: "1", mitigation: "Disabled", lockout: "30", unit: "Seconds" } }, // Clear
    { id: "number-zero", state: { ...OPENING, number: "0" } }, // the page's min-number error
    { id: "block-without-lockout", state: { ...EXAMPLE, lockout: "" } }, // the page's block-lockout error
  ],
  blocked: [],
  reject: [
    { id: "missing-unit", values: { ...P(OPENING), unit: null } }, // every field is written
    { id: "unknown-per", values: { ...P(OPENING), per: "Days" } }, // not a unit
    { id: "unknown-mitigation", values: { ...P(OPENING), mitigation: "Challenge" } }, // not a mitigation
    { id: "not-a-number", values: { ...P(OPENING), number: "fifteen" } }, // malformed
    { id: "refused-burst", values: { ...P(OPENING), burst: "0.5" } }, // the page refuses it
    { id: "refused-lockout", values: { ...P(EXAMPLE), lockout: "0" } }, // Block needs a lockout of at least 1
  ],
});
