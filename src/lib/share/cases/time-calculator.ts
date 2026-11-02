// ============================================================================
// src/lib/share/cases/time-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the time calculator: a form, each mode's fields always
// written, nothing of the other mode.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TIME_SHARE, type TimeShareState } from "../../tools/time-calculator/share"; // the spec

/** The cases. */
export const TIME_CALCULATOR_SHARE_CASES = defineShareCases<TimeShareState, TimeShareState>({
  spec: TIME_SHARE, // the spec
  accept: [
    { id: "diff-example", state: { mode: "diff", first: "2024-02-28T00:00Z", second: "2024-03-01T00:00Z" }, params: { mode: "diff", first: "2024-02-28T00:00Z", second: "2024-03-01T00:00Z" }, restored: { mode: "diff", first: "2024-02-28T00:00Z", second: "2024-03-01T00:00Z" } }, // the diff Example: a leap day between
    { id: "shift-example", state: { mode: "shift", start: "2026-01-01T00:00Z", duration: "P1DT2H", op: "add" }, params: { mode: "shift", start: "2026-01-01T00:00Z", duration: "P1DT2H", op: "add" }, restored: { mode: "shift", start: "2026-01-01T00:00Z", duration: "P1DT2H", op: "add" } }, // the shift Example
    { id: "shift-subtract", state: { mode: "shift", start: "2026-03-29T01:30:00+01:00", duration: "PT90M", op: "subtract" }, params: { mode: "shift", start: "2026-03-29T01:30:00+01:00", duration: "PT90M", op: "subtract" }, restored: { mode: "shift", start: "2026-03-29T01:30:00+01:00", duration: "PT90M", op: "subtract" } }, // an offset and a subtraction
  ],
  empty: [
    { id: "diff-blank", state: { mode: "diff", first: "", second: "" } }, // nothing typed
    { id: "diff-refused", state: { mode: "diff", first: "yesterday", second: "2024-03-01T00:00Z" } }, // not an instant
    { id: "shift-months", state: { mode: "shift", start: "2026-01-31T00:00Z", duration: "P1M", op: "add" } }, // calendar units are refused, by design
  ],
  reject: [
    { id: "no-mode", values: { first: "2024-02-28T00:00Z", second: "2024-03-01T00:00Z" } }, // the mode is always written
    { id: "unknown-mode", values: { mode: "between", first: "2024-02-28T00:00Z", second: "2024-03-01T00:00Z" } }, // an unknown mode
    { id: "diff-missing", values: { mode: "diff", first: "2024-02-28T00:00Z" } }, // one instant
    { id: "diff-with-shift-field", values: { mode: "diff", first: "2024-02-28T00:00Z", second: "2024-03-01T00:00Z", op: "add" } }, // a field of the other mode
    { id: "shift-bad-op", values: { mode: "shift", start: "2026-01-01T00:00Z", duration: "P1D", op: "plus" } }, // an unknown operation
    { id: "shift-no-op", values: { mode: "shift", start: "2026-01-01T00:00Z", duration: "P1D" } }, // the operation is always written
    { id: "shift-with-diff-field", values: { mode: "shift", start: "2026-01-01T00:00Z", duration: "P1D", op: "add", first: "x" } }, // a field of the other mode
  ],
});
