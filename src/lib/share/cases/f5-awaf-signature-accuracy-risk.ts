// ============================================================================
// src/lib/share/cases/f5-awaf-signature-accuracy-risk.ts
// ----------------------------------------------------------------------------
// Share cases of the AWAF signature accuracy and risk reader: the four
// choices go by their ids; a choice the page does not offer makes the share
// malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SIGNATURE_RISK_SHARE } from "../../tools/f5-awaf-signature-accuracy-risk/share"; // the spec
import { DEFAULTS, type SigInput } from "../../tools/f5-awaf-signature-accuracy-risk/compute"; // the form's shape and starting values

/** The cases. */
export const F5_SIGNATURE_RISK_SHARE_CASES = defineShareCases<SigInput, SigInput>({
  spec: SIGNATURE_RISK_SHARE, // the spec
  accept: [
    { id: "defaults", state: { ...DEFAULTS }, params: { accuracy: "low", risk: "low", system: "unknown", enforcement: "enforced-blocking" }, restored: { ...DEFAULTS } }, // the starting choices
    { id: "example", state: { accuracy: "high", risk: "high", systemRelevance: "in-stack", enforcement: "enforced-blocking" }, params: { accuracy: "high", risk: "high", system: "in-stack", enforcement: "enforced-blocking" }, restored: { accuracy: "high", risk: "high", systemRelevance: "in-stack", enforcement: "enforced-blocking" } }, // the Example: do not relax
    { id: "staged-not-in-stack", state: { accuracy: "medium", risk: "low", systemRelevance: "not-in-stack", enforcement: "staged" }, params: { accuracy: "medium", risk: "low", system: "not-in-stack", enforcement: "staged" }, restored: { accuracy: "medium", risk: "low", systemRelevance: "not-in-stack", enforcement: "staged" } }, // other choices
  ],
  arrive: [
    { id: "risk-only", values: { risk: "medium" }, restored: { ...DEFAULTS, risk: "medium" } }, // the others take the starting values
  ],
  reject: [
    { id: "unknown-accuracy", values: { accuracy: "very-high", risk: "low", system: "unknown", enforcement: "staged" } }, // low, medium or high
    { id: "unknown-system", values: { accuracy: "low", risk: "low", system: "yes", enforcement: "staged" } }, // in-stack, not-in-stack or unknown
    { id: "unknown-enforcement", values: { accuracy: "low", risk: "low", system: "unknown", enforcement: "block" } }, // not one the page offers
  ],
});
