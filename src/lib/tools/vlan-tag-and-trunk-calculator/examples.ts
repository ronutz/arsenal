// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vlan-tag-and-trunk-calculator/examples.ts
// ----------------------------------------------------------------------------
// The page's Examples (D-83) and its chips, in one small module that both the
// golden vectors (which pin every one of them) and the component (whose
// Example button and chips fill them) import, so a button can never drift from
// its vector and the page does not carry the whole vector set.
//
// The values are the VLAN lab of chapter 2.3 of the course "LAN Switch
// Operations and Maintenance" (its MODERN CLI block B12, slides 230 to 247):
// VLAN 10 USERS, 20 VOICE and 99 MGMT tagged on the trunk port, 999 as the
// native (untagged) VLAN, written in each vendor's own lines as the deck
// writes them (the Junos VLAN names are resolved by their "set vlans" lines,
// which the deck gives on slide 240). Since 2026-11-08 the deck's "Trunk
// native/untagged VLAN (999)" blocks add 999 to each allowed list (Cisco
// slide 236, AOS-CX 238, Arista 244, Huawei 246), and the lab lines here
// follow them; two chips keep the earlier lines, without 999 in the allowed
// list, to show that pitfall on four vendors. The frames use RFC 9542's
// documentation MAC addresses (00-00-5E-00-53-01 and -02; 01-00-5E-90-10-00
// for a group destination); the tag Example is the lab's VOICE VLAN, 20, at
// priority 5, the Voice traffic type.
// ============================================================================

/** The tag Example: documentation MACs, a C-TAG with PCP 5 and VID 20 (the lab's VOICE VLAN), then IPv4. */
export const EXAMPLE_TAG_REQUEST = Object.freeze({ mode: "tag", input: "00 00 5e 00 53 01 00 00 5e 00 53 02 81 00 a0 14 08 00", start: "auto" } as const); // VID 20, PCP 5, EtherType 0x0800

/** The tag chips: each one a golden vector. */
export const TAG_CHIPS = Object.freeze([
  Object.freeze({ id: "qinq", input: "88 a8 00 64 81 00 00 0a 86 dd" }), // S-TAG VID 100 outside a C-TAG VID 10, then IPv6
  Object.freeze({ id: "priority", input: "81 00 a0 00 08 06" }), // a priority tag: VID 0, PCP 5, then ARP
  Object.freeze({ id: "reserved", input: "81 00 0f ff 08 00" }), // VID 4095, reserved
  Object.freeze({ id: "junos9100", input: "91 00 00 64 81 00 00 0a 08 00" }), // the Junos Q-in-Q TPID outside a C-TAG
  Object.freeze({ id: "llc", input: "01 00 5e 90 10 00 00 00 5e 00 53 02 81 00 20 0a 00 2e 42 42 03" }), // a group destination, PCP 1 (Background), then a length
] as const); // five chips

/** End A of the trunk Example: the lab's Cisco IOS XE trunk port (slide 236), allowed 10, 20 and 99, native 999 added to the list. */
const LAB_CISCO = ["interface GigabitEthernet1/0/24", " switchport mode trunk", " switchport trunk allowed vlan 10,20,99", " switchport trunk native vlan 999", " switchport trunk allowed vlan add 999"].join("\n"); // as the corrected deck writes it

/** The lab's Arista EOS trunk port (slide 244, corrected deck): 999 native and added to the allowed list. */
const LAB_ARISTA = [
  "interface ethernet 24", // the trunk port
  " switchport mode trunk", // trunk
  " switchport trunk allowed vlan 10,20,99", // the tagged VLANs
  " switchport trunk native vlan 999", // the native VLAN
  " switchport trunk allowed vlan add 999", // and carried
  " switchport trunk allowed vlan remove 1", // the deck's "Remove the port from default VLAN 1"
].join("\n"); // as the corrected deck writes it

/** The lab's Huawei VRP trunk port (slide 246, corrected deck): PVID 999, allowed, VLAN 1 removed. */
const LAB_HUAWEI = [
  "vlan batch 10 20 99 999", // the VLANs, created first
  "interface GigabitEthernet0/0/24", // the trunk port
  " port link-type trunk", // trunk
  " port trunk allow-pass vlan 10 20 99", // the tagged VLANs
  " port trunk pvid vlan 999", // the default VLAN (PVID)
  " port trunk allow-pass vlan 999", // and permitted
  " undo port trunk allow-pass vlan 1", // out of VLAN 1
].join("\n"); // as the corrected deck writes it

/** The pitfall on Cisco IOS XE: the deck's earlier lines, native 999 outside the allowed list. */
const PIT_CISCO = ["interface GigabitEthernet1/0/24", " switchport mode trunk", " switchport trunk allowed vlan 10,20,99", " switchport trunk native vlan 999"].join("\n"); // not confirmed on Cisco

/** The pitfall on AOS-CX: the deck's earlier lines (slide 238). */
const PIT_ARUBA = ["interface 1/1/24", " vlan trunk native 999", " vlan trunk allowed 10,20,99"].join("\n"); // not carried on AOS-CX

/** The pitfall on Arista EOS: the deck's earlier lines (slide 244). */
const PIT_ARISTA = ["interface ethernet 24", " switchport mode trunk", " switchport trunk allowed vlan 10,20,99", " switchport trunk native vlan 999"].join("\n"); // not carried on Arista EOS

/** The pitfall on Huawei VRP: the deck's earlier lines (slide 246), PVID 999 never permitted. */
const PIT_HUAWEI = ["interface GigabitEthernet0/0/24", " port link-type trunk", " port trunk allow-pass vlan 10 20 99", " port trunk pvid vlan 999", " undo port trunk allow-pass vlan 1"].join("\n"); // not forwarded on Huawei VRP

/** End B of the trunk Example: the lab's Juniper Junos trunk port (slide 240), with the VLAN names' set vlans lines. */
const LAB_JUNOS = [
  "set vlans USERS vlan-id 10", // the deck's VLAN names
  "set vlans VOICE vlan-id 20", // VOICE
  "set vlans MGMT vlan-id 99", // MGMT
  "set vlans NATIVE vlan-id 999", // the native VLAN
  "edit interfaces ge-0/0/23 unit 0 family ethernet-switching", // the trunk port
  " set interface-mode trunk", // trunk
  " set vlan members [ USERS VOICE MGMT ]", // the tagged VLANs
  "top", // back to the top
  "set interfaces ge-0/0/23 native-vlan-id 999", // the native VLAN
  "set interfaces ge-0/0/23 unit 0 family ethernet-switching vlan members 999", // and its membership
].join("\n"); // as the deck writes it

/** The lab's Switch Engine trunk port (slide 232). */
const LAB_EXOS = [
  "create vlan USERS tag 10", // USERS
  "create vlan VOICE tag 20", // VOICE
  "create vlan MGMT99 tag 99", // MGMT99 (MGMT would clash with Mgmt)
  "configure vlan USERS add ports 24 tagged", // tagged
  "configure vlan VOICE add ports 24 tagged", // tagged
  "configure vlan MGMT99 add ports 24 tagged", // tagged
  "create vlan NATIVE999 tag 999", // the native VLAN
  "configure vlan NATIVE999 add ports 24 untagged", // untagged (auto-moved from Default)
  "configure vlan Default delete ports 1,24", // out of the Default VLAN
].join("\n"); // as the deck writes it

/** The lab's RouterOS trunk port (slide 242). */
const LAB_MIKROTIK = [
  "/interface bridge port add bridge=bridge1 interface=ether24", // the port
  "/interface bridge vlan set [find vlan-ids=10] tagged=ether24", // VLAN 10 tagged
  "/interface bridge vlan add bridge=bridge1 tagged=ether24 vlan-ids=20,99", // 20 and 99 tagged
  "/interface bridge port set [find interface=ether24] pvid=999", // the PVID
  "/interface bridge vlan add bridge=bridge1 untagged=ether24 vlan-ids=999", // 999 untagged
].join("\n"); // as the deck writes it

/** The trunk Example: the lab's Cisco and Junos ends. */
export const EXAMPLE_TRUNK_REQUEST = Object.freeze({
  mode: "trunk", // the mode
  a: Object.freeze({ vendor: "cisco-ios-xe", config: LAB_CISCO }), // end A
  b: Object.freeze({ vendor: "juniper-junos", config: LAB_JUNOS }), // end B
} as const); // 10, 20 and 99 cross tagged, 999 untagged

/** The trunk chips: each one a golden vector. */
export const TRUNK_CHIPS = Object.freeze([
  Object.freeze({ id: "labExosMikrotik", a: Object.freeze({ vendor: "extreme-switch-engine", config: LAB_EXOS }), b: Object.freeze({ vendor: "mikrotik-routeros", config: LAB_MIKROTIK }) }), // the lab on two other vendors: everything matches
  Object.freeze({ id: "labAristaHuawei", a: Object.freeze({ vendor: "arista-eos", config: LAB_ARISTA }), b: Object.freeze({ vendor: "huawei-vrp", config: LAB_HUAWEI }) }), // the lab on Arista and Huawei: everything matches
  Object.freeze({ id: "pitfallCiscoAruba", a: Object.freeze({ vendor: "cisco-ios-xe", config: PIT_CISCO }), b: Object.freeze({ vendor: "aruba-aos-cx", config: PIT_ARUBA }) }), // 999 left out: not confirmed on Cisco, not carried on AOS-CX
  Object.freeze({ id: "pitfallAristaHuawei", a: Object.freeze({ vendor: "arista-eos", config: PIT_ARISTA }), b: Object.freeze({ vendor: "huawei-vrp", config: PIT_HUAWEI }) }), // 999 left out: not carried on Arista, not forwarded on Huawei
  Object.freeze({ id: "nativeMismatch", a: Object.freeze({ vendor: "cisco-ios-xe", config: "switchport mode trunk\nswitchport trunk allowed vlan 1,10,20" }), b: Object.freeze({ vendor: "aruba-aos-cx", config: "vlan trunk native 10\nvlan trunk allowed 1,10,20" }) }), // native 1 against native 10
  Object.freeze({ id: "editsAndFabric", a: Object.freeze({ vendor: "cisco-ios-xe", config: "switchport trunk allowed vlan 10-30\nswitchport trunk allowed vlan add 99\nswitchport trunk allowed vlan remove 25\nswitchport trunk native vlan 30" }), b: Object.freeze({ vendor: "extreme-fabric-engine", config: "interface gigabitEthernet 1/24\nencapsulation dot1q\nvlan members add 10 1/24\nvlan members add 20 1/24\nvlan members add 25 1/24\nvlan members add 30 1/24\nvlan members add 99 1/24\ndefault-vlan-id 30\nuntag-port-default-vlan enable" }) }), // add and remove against a Fabric Engine end; native 30 on both
] as const); // six chips
