// ============================================================================
// src/lib/share/cases/voss-fabric-id.ts
// ----------------------------------------------------------------------------
// Share cases of the VOSS fabric identifier decoder: the field goes as typed,
// alone, as the #input= handoff usePrefill reads.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { VOSS_FABRIC_ID_SHARE } from "../../tools/voss-fabric-id/share"; // the spec

/** The cases. */
export const VOSS_FABRIC_ID_SHARE_CASES = defineShareCases(Object.freeze({
  spec: VOSS_FABRIC_ID_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "nickname", state: { input: "C.30.00" }, params: { input: "C.30.00" }, restored: { input: "C.30.00" } }, // the page's Example
    { id: "isid", state: { input: "16777215" }, params: { input: "16777215" }, restored: { input: "16777215" } }, // the largest 24-bit I-SID
    { id: "system-id", state: { input: "0200.0000.0001" }, params: { input: "0200.0000.0001" }, restored: { input: "0200.0000.0001" } }, // a locally administered system ID
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank field
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
