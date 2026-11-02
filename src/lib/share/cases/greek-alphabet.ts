// ============================================================================
// src/lib/share/cases/greek-alphabet.ts
// ----------------------------------------------------------------------------
// Share cases of the greek-alphabet tool: a value the page reads goes as typed; one
// it refuses has no reading to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { GREEK_SHARE, type GreekShareState } from "../../tools/greek-alphabet/share"; // the spec

/** The page's Example. */
const EXAMPLE = "ΤΕΧΝΗ"; // verbatim
/** A second reading: the letters by name. */
const SECOND = "alpha beta gamma"; // as typed

/** The cases. */
export const GREEK_SHARE_CASES = defineShareCases<GreekShareState, GreekShareState>({
  spec: GREEK_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example
    { id: "second", state: { input: SECOND }, params: { input: SECOND }, restored: { input: SECOND } }, // the letters by name
    { id: "spaces-kept", state: { input: " " + EXAMPLE + " " }, params: { input: " " + EXAMPLE + " " }, restored: { input: " " + EXAMPLE + " " } }, // the box as typed, spaces and all
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "refused", state: { input: "1994" } }, // the page refuses it: no reading
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
