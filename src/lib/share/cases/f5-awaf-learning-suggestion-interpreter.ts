// ============================================================================
// src/lib/share/cases/f5-awaf-learning-suggestion-interpreter.ts
// ----------------------------------------------------------------------------
// Share cases of the AWAF learning-suggestion interpreter: the five choices
// go by their ids (a rating of none as "na"); a choice the page does not
// offer makes the share malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SUGGESTION_SHARE } from "../../tools/f5-awaf-learning-suggestion-interpreter/share"; // the spec
import { DEFAULTS, type SuggInput } from "../../tools/f5-awaf-learning-suggestion-interpreter/compute"; // the form's shape and starting values

/** The cases. */
export const F5_SUGGESTION_SHARE_CASES = defineShareCases<SuggInput, SuggInput>({
  spec: SUGGESTION_SHARE, // the spec
  accept: [
    { id: "defaults", state: { ...DEFAULTS }, params: { action: "disable-signature", score: "80", rating: "2", mode: "automatic", trust: "untrusted" }, restored: { ...DEFAULTS } }, // the starting choices: the poisoning vector
    { id: "example", state: { action: "add-entity", learningScore: 100, violationRating: null, mode: "manual", sourceTrust: "trusted" }, params: { action: "add-entity", score: "100", rating: "na", mode: "manual", trust: "trusted" }, restored: { action: "add-entity", learningScore: 100, violationRating: null, mode: "manual", sourceTrust: "trusted" } }, // the Example: no rating
    { id: "tightening", state: { action: "remove-wildcard", learningScore: 0, violationRating: 4, mode: "automatic", sourceTrust: "mixed" }, params: { action: "remove-wildcard", score: "0", rating: "4", mode: "automatic", trust: "mixed" }, restored: { action: "remove-wildcard", learningScore: 0, violationRating: 4, mode: "automatic", sourceTrust: "mixed" } }, // a tightening at score 0
  ],
  arrive: [
    { id: "action-only", values: { action: "enforce-entity" }, restored: { ...DEFAULTS, action: "enforce-entity" } }, // the others take the starting values
  ],
  reject: [
    { id: "unknown-action", values: { action: "delete", score: "80", rating: "2", mode: "manual", trust: "trusted" } }, // not one the page lists
    { id: "score-over", values: { action: "add-entity", score: "101", rating: "2", mode: "manual", trust: "trusted" } }, // 0 to 100
    { id: "score-negative", values: { action: "add-entity", score: "-5", rating: "2", mode: "manual", trust: "trusted" } }, // no sign
    { id: "rating-zero", values: { action: "add-entity", score: "80", rating: "0", mode: "manual", trust: "trusted" } }, // 1 to 5 or na
    { id: "rating-word", values: { action: "add-entity", score: "80", rating: "none", mode: "manual", trust: "trusted" } }, // "na" is the word
    { id: "unknown-mode", values: { action: "add-entity", score: "80", rating: "2", mode: "auto", trust: "trusted" } }, // automatic or manual
    { id: "unknown-trust", values: { action: "add-entity", score: "80", rating: "2", mode: "manual", trust: "partly" } }, // trusted, untrusted or mixed
  ],
});
