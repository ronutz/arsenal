// ============================================================================
// src/lib/share/cases/vlan-tag-and-trunk-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the 802.1Q tag decoder and trunk VLAN calculator
// (08/11/2026): the tag mode carries the octets as input (and start when it is
// not auto); the trunk mode carries mode=trunk and both ends' vendor and lines.
// Values are the page's Examples and chips (golden vectors example-tag,
// example-trunk and the chips: the VLAN lab of the course's chapter 2.3, and
// RFC 9542's documentation MAC addresses). 2026-11-08b: Arista EOS and Huawei
// VRP are vendors the page offers, so a link with them is accepted (the lab on
// those two vendors, a chip), and the rejected vendor is one no page offers.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { VLAN_SHARE, type VlanShareState } from "../../tools/vlan-tag-and-trunk-calculator/share"; // the spec
import { EXAMPLE_TAG_REQUEST, EXAMPLE_TRUNK_REQUEST, TRUNK_CHIPS } from "../../tools/vlan-tag-and-trunk-calculator/examples"; // the Examples

/** The trunk state's own shape. */
type TrunkState = Extract<VlanShareState, { mode: "trunk" }>; // the two ends
/** The trunk Example as the form holds it. */
const LAB: TrunkState = { mode: "trunk", avendor: EXAMPLE_TRUNK_REQUEST.a.vendor, aconfig: EXAMPLE_TRUNK_REQUEST.a.config, bvendor: EXAMPLE_TRUNK_REQUEST.b.vendor, bconfig: EXAMPLE_TRUNK_REQUEST.b.config }; // Cisco and Junos
/** The lab on Switch Engine and RouterOS (a chip). */
const LAB2 = TRUNK_CHIPS[0]; // the first trunk chip
/** The same as the form holds it. */
const LAB2_STATE: VlanShareState = { mode: "trunk", avendor: LAB2.a.vendor, aconfig: LAB2.a.config, bvendor: LAB2.b.vendor, bconfig: LAB2.b.config }; // two Extreme and MikroTik ends
/** The lab on Arista EOS and Huawei VRP (a chip, 2026-11-08b). */
const LAB3 = TRUNK_CHIPS.find((c) => c.id === "labAristaHuawei")!; // the chip
/** The same as the form holds it. */
const LAB3_STATE: VlanShareState = { mode: "trunk", avendor: LAB3.a.vendor, aconfig: LAB3.a.config, bvendor: LAB3.b.vendor, bconfig: LAB3.b.config }; // Arista and Huawei ends

/** The cases. */
export const VLAN_TAG_AND_TRUNK_CALCULATOR_SHARE_CASES = defineShareCases<VlanShareState, VlanShareState>({
  spec: VLAN_SHARE, // the spec
  accept: [
    { id: "tag-example", state: { mode: "tag", input: EXAMPLE_TAG_REQUEST.input, start: "auto" }, params: { input: EXAMPLE_TAG_REQUEST.input }, restored: { mode: "tag", input: EXAMPLE_TAG_REQUEST.input, start: "auto" } }, // the tag Example: input only
    { id: "tag-start-mac", state: { mode: "tag", input: "81 00 5e 00 53 01 00 00 5e 00 53 02 08 00", start: "mac" }, params: { input: "81 00 5e 00 53 01 00 00 5e 00 53 02 08 00", start: "mac" }, restored: { mode: "tag", input: "81 00 5e 00 53 01 00 00 5e 00 53 02 08 00", start: "mac" } }, // a chosen start travels
    { id: "trunk-example", state: LAB, params: { mode: "trunk", avendor: LAB.avendor, aconfig: LAB.aconfig, bvendor: LAB.bvendor, bconfig: LAB.bconfig }, restored: LAB }, // the trunk Example, lines with newlines
    { id: "trunk-chip", state: LAB2_STATE, params: { mode: "trunk", avendor: LAB2.a.vendor, aconfig: LAB2.a.config, bvendor: LAB2.b.vendor, bconfig: LAB2.b.config }, restored: LAB2_STATE }, // a chip
    { id: "trunk-arista-huawei", state: LAB3_STATE, params: { mode: "trunk", avendor: "arista-eos", aconfig: LAB3.a.config, bvendor: "huawei-vrp", bconfig: LAB3.b.config }, restored: LAB3_STATE }, // the two vendors added on 2026-11-08b
  ],
  arrive: [
    { id: "input-only", values: { input: "81 00 00 0a" }, restored: { mode: "tag", input: "81 00 00 0a", start: "auto" } }, // #input= alone: the tag mode, start auto
    { id: "tag-explicit-mode", values: { mode: "tag", input: "81 00 00 0a", start: "tpid" }, restored: { mode: "tag", input: "81 00 00 0a", start: "tpid" } }, // mode=tag is accepted too
  ],
  empty: [
    { id: "tag-blank", state: { mode: "tag", input: "", start: "auto" } }, // nothing typed
    { id: "tag-refused", state: { mode: "tag", input: "81 00 zz", start: "auto" } }, // the page shows its refusal
    { id: "trunk-blank-end", state: { mode: "trunk", avendor: "cisco-ios-xe", aconfig: "10,20", bvendor: "juniper-junos", bconfig: "" } }, // one end empty
  ],
  blocked: [],
  reject: [
    { id: "no-mode-no-input", values: { start: "mac" } }, // nothing to open
    { id: "unknown-mode", values: { mode: "stp", input: "81 00 00 0a" } }, // not a mode the page has
    { id: "unknown-start", values: { input: "81 00 00 0a", start: "ethertype" } }, // not a start the page offers
    { id: "tag-with-trunk-field", values: { input: "81 00 00 0a", avendor: "cisco-ios-xe" } }, // a field of the other mode
    { id: "trunk-with-input", values: { mode: "trunk", input: "81 00", avendor: "cisco-ios-xe", aconfig: "10", bvendor: "cisco-ios-xe", bconfig: "10" } }, // a field of the other mode
    { id: "trunk-unknown-vendor", values: { mode: "trunk", avendor: "cisco-nx-os", aconfig: "10", bvendor: "cisco-ios-xe", bconfig: "10" } }, // a vendor the page does not offer (arista-eos was this case until 2026-11-08b)
    { id: "trunk-vendor-name", values: { mode: "trunk", avendor: "Huawei VRP", aconfig: "10", bvendor: "arista-eos", bconfig: "10" } }, // a vendor's display name is not its id
    { id: "trunk-missing-b", values: { mode: "trunk", avendor: "cisco-ios-xe", aconfig: "10" } }, // end B missing
    { id: "trunk-blank-config", values: { mode: "trunk", avendor: "cisco-ios-xe", aconfig: " ", bvendor: "cisco-ios-xe", bconfig: "10" } }, // a blank end
    { id: "trunk-too-many-lines", values: { mode: "trunk", avendor: "cisco-ios-xe", aconfig: Array(65).fill("10").join("\n"), bvendor: "cisco-ios-xe", bconfig: "10" } }, // over MAX_LINES
    { id: "tag-blank-input", values: { input: "   " } }, // blank
    { id: "vendor-two-lines", values: { mode: "trunk", avendor: "cisco-ios-xe\ncisco-ios-xe", aconfig: "10", bvendor: "cisco-ios-xe", bconfig: "10" } }, // one line each
  ],
});
