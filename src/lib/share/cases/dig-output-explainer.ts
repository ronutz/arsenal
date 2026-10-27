// ============================================================================
// src/lib/share/cases/dig-output-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the dig output explainer: the paste goes as typed, alone
// (posture input-caution: the popover adds the tool's caution line).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { DIG_OUTPUT_SHARE } from "../../tools/dig-output-explainer/share"; // the spec
import { DIG_VECTORS } from "../../tools/dig-output-explainer/golden-vectors"; // the tool's own vectors

/** The page's Example: golden vector dnssec-rrsig, real dig 9.20.29 output (";", "@", "#", line breaks, tabs). */
const EXAMPLE = DIG_VECTORS.find((v) => v.id === "dnssec-rrsig")?.input ?? ""; // byte for byte

/** The cases. */
export const DIG_OUTPUT_SHARE_CASES = defineShareCases(Object.freeze({
  spec: DIG_OUTPUT_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the whole capture, exactly
    ...DIG_VECTORS.filter((v) => v.id !== "dnssec-rrsig").slice(0, 3).map((v) => ({ id: `vector-${v.id}`, state: { input: v.input }, params: { input: v.input }, restored: { input: v.input } })), // three more captures
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: "\n\t " } }, // only white space
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "\n\n" } }, // only line breaks
  ],
}));
