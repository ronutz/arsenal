// ============================================================================
// src/lib/share/cases/f5-awaf-false-positive-triage.ts
// ----------------------------------------------------------------------------
// Share cases of the AWAF false-positive triage: the three choices go by
// their ids; a choice the page does not offer makes the share malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FP_TRIAGE_SHARE } from "../../tools/f5-awaf-false-positive-triage/share"; // the spec
import { DEFAULTS, type FpInput } from "../../tools/f5-awaf-false-positive-triage/compute"; // the form's shape and starting values

/** The cases. */
export const F5_FP_TRIAGE_SHARE_CASES = defineShareCases<FpInput, FpInput>({
  spec: FP_TRIAGE_SHARE, // the spec
  accept: [
    { id: "defaults", state: { ...DEFAULTS }, params: { category: "attack-signature", rating: "2", state: "enforced-blocking" }, restored: { ...DEFAULTS } }, // the starting choices
    { id: "example", state: { category: "attack-signature", violationRating: 5, enforcementState: "enforced-blocking" }, params: { category: "attack-signature", rating: "5", state: "enforced-blocking" }, restored: { category: "attack-signature", violationRating: 5, enforcementState: "enforced-blocking" } }, // the Example: rating 5
    { id: "cookie-staged", state: { category: "cookie", violationRating: 1, enforcementState: "staged" }, params: { category: "cookie", rating: "1", state: "staged" }, restored: { category: "cookie", violationRating: 1, enforcementState: "staged" } }, // another category and state
  ],
  arrive: [
    { id: "category-only", values: { category: "url" }, restored: { ...DEFAULTS, category: "url" } }, // the others take the starting values
  ],
  reject: [
    { id: "unknown-category", values: { category: "sql", rating: "2", state: "staged" } }, // not one the page lists
    { id: "rating-zero", values: { category: "url", rating: "0", state: "staged" } }, // 1 to 5
    { id: "rating-decimal", values: { category: "url", rating: "2.0", state: "staged" } }, // a whole number
    { id: "unknown-state", values: { category: "url", rating: "2", state: "blocking" } }, // not one the page lists
  ],
});
