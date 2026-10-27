// ============================================================================
// src/lib/share/cases/voss-exos-translator.ts
// ----------------------------------------------------------------------------
// Share cases of the VOSS / EXOS command translator: the search goes as typed,
// alone, as the #input= handoff usePrefill reads.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { VOSS_EXOS_TRANSLATOR_SHARE } from "../../tools/voss-exos-translator/share"; // the spec

/** The cases. */
export const VOSS_EXOS_TRANSLATOR_SHARE_CASES = defineShareCases(Object.freeze({
  spec: VOSS_EXOS_TRANSLATOR_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "i-sid" }, params: { input: "i-sid" }, restored: { input: "i-sid" } }, // the page's Example
    { id: "two-words", state: { input: "fabric attach" }, params: { input: "fabric attach" }, restored: { input: "fabric attach" } }, // a space inside the value
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank search lists everything: no link
    { id: "white-space", state: { input: "  " } }, // only spaces, the same
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
