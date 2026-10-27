// ============================================================================
// src/lib/share/cases/dhcp-option-43.ts
// ----------------------------------------------------------------------------
// Share cases of the DHCP option 43 generator: the address field goes as
// typed, alone, as the #input= handoff usePrefill reads (posture
// input-caution, raised: the popover adds the tool's caution line).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { DHCP_OPTION_43_SHARE } from "../../tools/dhcp-option-43/share"; // the spec
import { OPTION43_GOLDEN_VECTORS } from "../../tools/dhcp-option-43/golden-vectors"; // the tool's own vectors

/** The cases. */
export const DHCP_OPTION_43_SHARE_CASES = defineShareCases(Object.freeze({
  spec: DHCP_OPTION_43_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "192.168.1.10" }, params: { input: "192.168.1.10" }, restored: { input: "192.168.1.10" } }, // the page's Example (Cisco 97066)
    { id: "two-controllers", state: { input: OPTION43_GOLDEN_VECTORS[0].input }, params: { input: OPTION43_GOLDEN_VECTORS[0].input }, restored: { input: OPTION43_GOLDEN_VECTORS[0].input } }, // Cisco 97066's two-controller example, a space between
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank field
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
