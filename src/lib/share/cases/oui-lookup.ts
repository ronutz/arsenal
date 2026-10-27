// ============================================================================
// src/lib/share/cases/oui-lookup.ts
// ----------------------------------------------------------------------------
// Share cases of the OUI / MAC vendor lookup: the field goes as typed, alone,
// as the #input= handoff usePrefill reads.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { OUI_LOOKUP_SHARE } from "../../tools/oui-lookup/share"; // the spec

/** The cases. */
export const OUI_LOOKUP_SHARE_CASES = defineShareCases(Object.freeze({
  spec: OUI_LOOKUP_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "00:1b:54:11:22:33" }, params: { input: "00:1b:54:11:22:33" }, restored: { input: "00:1b:54:11:22:33" } }, // the page's Example (colons)
    { id: "cisco-dots", state: { input: "001b.5411.2233" }, params: { input: "001b.5411.2233" }, restored: { input: "001b.5411.2233" } }, // the dotted form
    { id: "vrrp", state: { input: "00-00-5E-00-01-07" }, params: { input: "00-00-5E-00-01-07" }, restored: { input: "00-00-5E-00-01-07" } }, // a VRRP address, hyphens
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank field
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
