// ============================================================================
// src/lib/share/cases/mtu-mss.ts
// ----------------------------------------------------------------------------
// Share cases of the MTU / MSS calculator: the input line goes as typed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { MTU_MSS_SHARE, type MtuMssShareState } from "../../tools/mtu-mss/share"; // the spec

/** The cases. */
export const MTU_MSS_SHARE_CASES = defineShareCases<MtuMssShareState, MtuMssShareState>({
  spec: MTU_MSS_SHARE, // the spec
  accept: [
    { id: "example", state: { input: "1500 vxlan" }, params: { input: "1500 vxlan" }, restored: { input: "1500 vxlan" } }, // the Example (golden vector vxlan-1500)
    { id: "stack-and-bytes", state: { input: "1500 gre v6 vlan +8" }, params: { input: "1500 gre v6 vlan +8" }, restored: { input: "1500 gre v6 vlan +8" } }, // tokens, a shim and extra bytes
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no line
    { id: "white-space", state: { input: "   " } }, // nothing but spaces
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "white-space", values: { input: "  " } }, // nothing but spaces
    { id: "absent", values: { input: null } }, // not there
  ],
});
