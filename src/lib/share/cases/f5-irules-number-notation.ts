// ============================================================================
// src/lib/share/cases/f5-irules-number-notation.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules number notation converter: the value goes as typed
// (spaces kept), with the value it is compared with when that field is set.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_NUMBER_NOTATION_SHARE, type NumberNotationShareState } from "../../tools/f5-irules-number-notation/share"; // the spec and its state
import { VECTORS } from "../../tools/f5-irules-number-notation/golden-vectors"; // the tool's own vectors

/** The page's Example (the octal-010 vector, which the page opens on). */
const EXAMPLE = VECTORS.find((v) => v.id === "octal-010")!.input; // { text: "010", other: "8" }

/** The cases. */
export const IRULES_NUMBER_NOTATION_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<NumberNotationShareState, NumberNotationShareState>>({ // typed, so the cases check as one list
  spec: IRULES_NUMBER_NOTATION_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "octal-010", state: { input: EXAMPLE.text, other: EXAMPLE.other ?? "8" }, params: { input: "010", other: "8" }, restored: { input: "010", other: "8" } }, // the page's Example
    { id: "spaces-kept", state: { input: " 0x1F ", other: "" }, params: { input: " 0x1F " }, restored: { input: " 0x1F ", other: "" } }, // the spaces are part of the value; an empty comparison is left out
    { id: "plus-and-exponent", state: { input: "+1e3", other: "1000.0" }, params: { input: "+1e3", other: "1000.0" }, restored: { input: "+1e3", other: "1000.0" } }, // "+" travels as itself
  ],
  arrive: [ // decode only
    { id: "other-absent", values: { input: "08", other: null }, restored: { input: "08", other: "" } }, // the comparison field empty, as sent
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "", other: "8" } }, // no value: the page reads nothing
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "other-alone", values: { input: null, other: "8" } }, // a comparison with no value
  ],
}));
