// ============================================================================
// src/lib/share/cases/css-specificity-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the CSS specificity calculator: the selectors go as typed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { CSS_SPECIFICITY_SHARE, type CssSpecificityShareState } from "../../tools/css-specificity-calculator/share"; // the spec and its state
import { VECTORS } from "../../tools/css-specificity-calculator/golden-vectors"; // the page's Example is a vector

/** The page's Example (CssSpecificityCalculatorTool's EXAMPLE_ID). */
const EXAMPLE = VECTORS.find((v) => v.id === "spec-examples")!.input.selectors; // verbatim

/** A stylesheet with the characters a link must escape: "#", "&", "+", "%" and a line break. */
const SHEET = "#main > .card:hover, a[href$=\".pdf\"] { color: red }\n.a + .b ~ .c & .d { width: 100% }"; // as typed

/** The cases. */
export const CSS_SPECIFICITY_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<CssSpecificityShareState, CssSpecificityShareState>>({ // typed, so the cases check as one list
  spec: CSS_SPECIFICITY_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the page's Example
    { id: "one-selector", state: { input: "a:is(#x, .y) > b::before" }, params: { input: "a:is(#x, .y) > b::before" }, restored: { input: "a:is(#x, .y) > b::before" } }, // one line
    { id: "stylesheet", state: { input: SHEET }, params: { input: SHEET }, restored: { input: SHEET } }, // a stylesheet
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // after Clear
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
