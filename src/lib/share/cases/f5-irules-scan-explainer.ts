// ============================================================================
// src/lib/share/cases/f5-irules-scan-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules scan explainer: the value, the format and the
// variable names go as typed, each left out when empty.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_SCAN_EXPLAINER_SHARE, type ScanExplainerShareState } from "../../tools/f5-irules-scan-explainer/share"; // the spec and its state
import { VECTORS } from "../../tools/f5-irules-scan-explainer/golden-vectors"; // the tool's own vectors

/** The page's Example (the time vector, which the page opens on). */
const TIME = VECTORS.find((v) => v.id === "time")!.input; // { input: "10:30", format: "%d:%d", vars: "hours minutes" }

/** The cases. */
export const IRULES_SCAN_EXPLAINER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<ScanExplainerShareState, ScanExplainerShareState>>({ // typed, so the cases check as one list
  spec: IRULES_SCAN_EXPLAINER_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "time", state: TIME, params: { input: "10:30", format: "%d:%d", vars: "hours minutes" }, restored: TIME }, // the page's Example
    { id: "inline", state: { input: "v2.15.1", format: "v%d.%d.%d", vars: "" }, params: { input: "v2.15.1", format: "v%d.%d.%d" }, restored: { input: "v2.15.1", format: "v%d.%d.%d", vars: "" } }, // no names: inline mode
    { id: "format-only", state: { input: "", format: "%[^&]&%s", vars: "a b" }, params: { format: "%[^&]&%s", vars: "a b" }, restored: { input: "", format: "%[^&]&%s", vars: "a b" } }, // an empty value; "%", "&" and "^" travel
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "", format: "", vars: "" } }, // after Clear
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "all-empty", values: { input: "", format: "", vars: "" } }, // nothing to fill
  ],
}));
