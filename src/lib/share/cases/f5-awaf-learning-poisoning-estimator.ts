// ============================================================================
// src/lib/share/cases/f5-awaf-learning-poisoning-estimator.ts
// ----------------------------------------------------------------------------
// Share cases of the Automatic-learning poisoning estimator: every field goes
// by name, as the engine reads it (clamped to its bounds, rounded where it
// rounds); an arrival sets the whole form; a value the form cannot hold
// within those bounds makes the share malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { POISONING_SHARE } from "../../tools/f5-awaf-learning-poisoning-estimator/share"; // the spec
import { DEFAULTS, type PoisoningInput } from "../../tools/f5-awaf-learning-poisoning-estimator/compute"; // the form's starting values

/** The starting form, as a link writes it. */
const DEFAULT_PARAMS = { mode: "automatic", untrusted: "1", trusted: "0", rating: "3", usources: "10", usessions: "10", tsessions: "1", spread: "24", factor: "1", asources: "25", rate: "120" }; // F5's documented defaults

/** The cases. */
export const F5_POISONING_SHARE_CASES = defineShareCases<PoisoningInput, PoisoningInput>({
  spec: POISONING_SHARE, // the spec
  accept: [
    { id: "defaults", state: { ...DEFAULTS }, params: DEFAULT_PARAMS, restored: { ...DEFAULTS } }, // the starting form, written out in full
    { id: "example-trusted-attacker", state: { ...DEFAULTS, attackerIsTrusted: true }, params: { ...DEFAULT_PARAMS, trusted: "1" }, restored: { ...DEFAULTS, attackerIsTrusted: true } }, // the Example
    { id: "manual-trusted-only", state: { ...DEFAULTS, learningMode: "manual", loosenFromUntrustedTraffic: false, targetViolationRating: 5, ratingSlowdownFactor: 2.5 }, params: { ...DEFAULT_PARAMS, mode: "manual", untrusted: "0", rating: "5", factor: "2.5" }, restored: { ...DEFAULTS, learningMode: "manual", loosenFromUntrustedTraffic: false, targetViolationRating: 5, ratingSlowdownFactor: 2.5 } }, // choices and a fractional factor
    { id: "clamped-as-engine-reads", state: { ...DEFAULTS, untrustedDifferentSources: 2_000_000_000, timeSpreadHours: -5, requestsPerSourcePerHour: 99_999_999, attackerDistinctSources: 0 }, params: { ...DEFAULT_PARAMS, usources: "1000000000", spread: "0", rate: "1000000", asources: "1" }, restored: { ...DEFAULTS, untrustedDifferentSources: 1_000_000_000, timeSpreadHours: 0, requestsPerSourcePerHour: 1_000_000, attackerDistinctSources: 1 } }, // outside the bounds: as the engine reads them
  ],
  arrive: [
    { id: "rating-only", values: { rating: "5" }, restored: { ...DEFAULTS, targetViolationRating: 5 } }, // a field the link lacks takes the starting value
  ],
  reject: [
    { id: "unknown-mode", values: { ...DEFAULT_PARAMS, mode: "learning" } }, // automatic, manual or disabled
    { id: "switch-not-bit", values: { ...DEFAULT_PARAMS, untrusted: "yes" } }, // 1 or 0
    { id: "rating-out-of-range", values: { ...DEFAULT_PARAMS, rating: "6" } }, // 1 to 5
    { id: "sources-below-bound", values: { ...DEFAULT_PARAMS, usources: "0" } }, // at least 1
    { id: "sources-fraction", values: { ...DEFAULT_PARAMS, usessions: "1.5" } }, // a count is whole
    { id: "spread-above-bound", values: { ...DEFAULT_PARAMS, spread: "8761" } }, // at most a year of hours
    { id: "factor-exponent", values: { ...DEFAULT_PARAMS, factor: "1e3" } }, // plain decimals only
    { id: "negative", values: { ...DEFAULT_PARAMS, asources: "-1" } }, // no sign
    { id: "rate-not-number", values: { ...DEFAULT_PARAMS, rate: "fast" } }, // a number
  ],
});
