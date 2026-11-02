// ============================================================================
// src/lib/share/cases/roman-numerals.ts
// ----------------------------------------------------------------------------
// Share cases of the roman-numerals tool: a value the page reads goes as typed; one
// it refuses has no reading to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ROMAN_SHARE, type RomanShareState } from "../../tools/roman-numerals/share"; // the spec

/** The page's Example. */
const EXAMPLE = "1994"; // verbatim
/** A second reading: the numeral. */
const SECOND = "MCMXCIV"; // as typed

/** The cases. */
export const ROMAN_SHARE_CASES = defineShareCases<RomanShareState, RomanShareState>({
  spec: ROMAN_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example
    { id: "second", state: { input: SECOND }, params: { input: SECOND }, restored: { input: SECOND } }, // the numeral
    { id: "spaces-kept", state: { input: " " + EXAMPLE + " " }, params: { input: " " + EXAMPLE + " " }, restored: { input: " " + EXAMPLE + " " } }, // the box as typed, spaces and all
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "refused", state: { input: "ABC" } }, // the page refuses it: no reading
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
