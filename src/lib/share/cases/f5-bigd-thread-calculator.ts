// ============================================================================
// src/lib/share/cases/f5-bigd-thread-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the BigD thread calculator: the one line goes as typed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { BIGD_SHARE, type BigdShareState } from "../../tools/f5-bigd-thread-calculator/share"; // the spec
import { BIGD_CALC_GOLDEN_VECTORS } from "../../tools/f5-bigd-thread-calculator/golden-vectors"; // the tool's own vectors

/** A vector's line by id. */
const line = (id: string) => BIGD_CALC_GOLDEN_VECTORS.find((v) => v.id === id)!.input; // pinned there

/** The cases. */
export const F5_BIGD_SHARE_CASES = defineShareCases<BigdShareState, BigdShareState>({
  spec: BIGD_SHARE, // the spec
  accept: [
    { id: "example", state: { input: "8 r10900" }, params: { input: "8 r10900" }, restored: { input: "8 r10900" } }, // the page's Example (platform-r10900)
    { id: "ht", state: { input: line("ht-8") }, params: { input: line("ht-8") }, restored: { input: line("ht-8") } }, // a count and "ht"
    { id: "words", state: { input: line("ht-10") }, params: { input: line("ht-10") }, restored: { input: line("ht-10") } }, // a spelled-out mode, with its space
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // nothing typed
    { id: "spaces", state: { input: "   " } }, // spaces only
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
