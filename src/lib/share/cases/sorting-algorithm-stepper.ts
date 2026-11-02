// ============================================================================
// src/lib/share/cases/sorting-algorithm-stepper.ts
// ----------------------------------------------------------------------------
// Share cases of the sorting algorithm stepper: the numbers as typed and the
// strategy, always written.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SORT_SHARE, type SortShareState } from "../../tools/sorting-algorithm-stepper/share"; // the spec

/** The page's Example. */
const EXAMPLE = "5 3 8 1 9 2"; // verbatim

/** The cases. */
export const SORTING_ALGORITHM_SHARE_CASES = defineShareCases<SortShareState, SortShareState>({
  spec: SORT_SHARE, // the spec
  accept: [
    { id: "example-bubble", state: { input: EXAMPLE, strategy: "bubble" }, params: { input: EXAMPLE, strategy: "bubble" }, restored: { input: EXAMPLE, strategy: "bubble" } }, // the Example, the default strategy written
    { id: "commas-quick", state: { input: "9, -2, 7.5, 0", strategy: "quick" }, params: { input: "9, -2, 7.5, 0", strategy: "quick" }, restored: { input: "9, -2, 7.5, 0", strategy: "quick" } }, // commas, a negative, a decimal
    { id: "merge", state: { input: "4 4 1", strategy: "merge" }, params: { input: "4 4 1", strategy: "merge" }, restored: { input: "4 4 1", strategy: "merge" } }, // a duplicate
  ],
  empty: [
    { id: "blank", state: { input: "", strategy: "bubble" } }, // nothing typed
    { id: "one-item", state: { input: "7", strategy: "insertion" } }, // refused: already sorted
    { id: "too-many", state: { input: "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17", strategy: "selection" } }, // refused: over 16 items
  ],
  reject: [
    { id: "no-numbers", values: { input: null, strategy: "bubble" } }, // nothing to sort
    { id: "blank", values: { input: " ", strategy: "bubble" } }, // white space
    { id: "no-strategy", values: { input: EXAMPLE, strategy: null } }, // the strategy is always written
    { id: "unknown-strategy", values: { input: EXAMPLE, strategy: "bogo" } }, // not one of the five
    { id: "case", values: { input: EXAMPLE, strategy: "Bubble" } }, // ids are exact
  ],
});
