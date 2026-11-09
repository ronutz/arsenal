// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/lacp-hash-and-state-reader/examples.ts
// ----------------------------------------------------------------------------
// The page's two Examples (D-83) and its samples, in one small module that both
// the golden vectors (which pin their readings: example-link, example-state
// and the sample-* vectors) and the component (whose Example button and sample
// chips fill them) import, so the buttons can never drift from the vectors and
// the page does not carry the whole vector set.
//
// The course "LAN Switch Operations and Maintenance" (chapter 2.2, deck slides
// 205 to 220 and the lab of slide 249) bundles two cables, ports 47 and 48,
// and its vendor slides configure the LACP fast rate; it gives no flows or
// addresses for the bundle. So:
//   - the link Example is a two-member bond, as the course's lab bundles two
//     cables, carrying the first flow of the Learn article's lab (a backup
//     stream from 192.0.2.10, TCP 50001, to 198.51.100.20, TCP 873, through
//     the router 00:00:5e:00:53:01), with the policy that separates
//     connections (layer3+4) and a spread over the next 64 source ports;
//   - the state Example is a member of that bundle with LACP active and the
//     fast rate on both ends, in the bundle: 0x3F on each side.
// Addresses are documentation values only: MACs from RFC 9542 s2.1.4
// (00-00-5E-00-53-00 to 00-00-5E-00-53-FF), IPv4 from RFC 5737 and IPv6 from
// RFC 3849 (2001:db8::/32).
//
// The Huawei sample (second set, 08/11/2026) is the example of display
// eth-trunk in Huawei's S5700 and S6700 V200R025C00 Command Reference, Link
// Aggregation Commands (read in a browser on 2026-11-08: the site refuses
// automated reads), byte for byte as the page's text gives it, single spaces
// included: Eth-Trunk10's section, from its title line to its last Partner
// row (the command line before it and the next Eth-Trunk after it are left
// out). Its two system IDs are the example's own values, as the document
// prints them, not documentation addresses: the sample is the vendor's
// example, kept verbatim.
// ============================================================================

/** The link Example: the Learn lab's first flow over the course lab's two members, layer3+4, little-endian, with a spread. */
export const EXAMPLE_LINK_REQUEST = Object.freeze({
  mode: "link", // which member
  policy: "layer3+4", // the policy that separates connections
  byteOrder: "little", // a little-endian processor
  members: "2", // the course lab's two cables
  srcMac: "00:00:5e:00:53:0a", // the server (not read by layer3+4)
  dstMac: "00:00:5e:00:53:01", // the router (not read by layer3+4)
  srcIp: "192.0.2.10", // the server
  dstIp: "198.51.100.20", // the backup host behind the router
  protocol: "tcp", // rsync over TCP
  srcPort: "50001", // the stream's source port
  dstPort: "873", // rsync
  vlan: "", // untagged (not read by layer3+4)
  priority: "", // none (not read by layer3+4)
  spread: Object.freeze({ field: "srcPort", count: "64" }), // the next 64 source ports
} as const); // member 0; the 64 ports split 32 and 32, in pairs

/** The state Example: a member of the bundle with LACP active and the fast rate on both ends. */
export const EXAMPLE_STATE_REQUEST = Object.freeze({ mode: "state", format: "octet", actor: "0x3F", partner: "0x3F" } as const); // bundled

/** The link samples: the default policy, IPv6 over three members, the VLAN policy, and the lab's own byte order. */
export const LINK_SAMPLES = Object.freeze([
  Object.freeze({ id: "layer2", request: Object.freeze({ mode: "link", policy: "layer2", byteOrder: "little", members: "4", srcMac: "00:00:5e:00:53:0a", dstMac: "00:00:5e:00:53:01", srcIp: "192.0.2.10", dstIp: "198.51.100.20", protocol: "tcp", srcPort: "50001", dstPort: "873", vlan: "", priority: "", spread: Object.freeze({ field: "dstMac", count: "256" }) }) }), // layer2, the default: every flow to one router on one member
  Object.freeze({ id: "ipv6", request: Object.freeze({ mode: "link", policy: "layer3+4", byteOrder: "little", members: "3", srcMac: "00:00:5e:00:53:0a", dstMac: "00:00:5e:00:53:01", srcIp: "2001:db8::10", dstIp: "2001:db8:1::20", protocol: "tcp", srcPort: "443", dstPort: "51000", vlan: "", priority: "", spread: Object.freeze({ field: "dstPort", count: "300" }) }) }), // IPv6 over three members, against Cisco's 3:3:2
  Object.freeze({ id: "vlan", request: Object.freeze({ mode: "link", policy: "vlan+srcmac", byteOrder: "little", members: "2", srcMac: "00:00:5e:00:53:0a", dstMac: "", srcIp: "", dstIp: "", protocol: "tcp", srcPort: "", dstPort: "", vlan: "10", priority: "", spread: Object.freeze({ field: "vlan", count: "16" }) }) }), // the course's VLAN 10, per-VLAN balancing
  Object.freeze({ id: "big-endian", request: Object.freeze({ mode: "link", policy: "layer3+4", byteOrder: "big", members: "4", srcMac: "00:00:5e:00:53:0a", dstMac: "00:00:5e:00:53:01", srcIp: "192.0.2.10", dstIp: "198.51.100.20", protocol: "tcp", srcPort: "50001", dstPort: "873", vlan: "", priority: "", spread: null }) }), // the Learn lab's reading: member 2 of 4
] as const); // four samples

/** Huawei's documented display eth-trunk example (Eth-Trunk10, LACP mode, three members: two Selected, one Unselect), line by line, verbatim. */
export const HUAWEI_DISPLAY_EXAMPLE = [
  "Eth-Trunk10's state information is:", // the trunk
  "Local:", // this end's section
  "LAG ID: 10 WorkingMode: LACP", // the aggregation and its mode
  "Preempt Delay Time: 10 Hash arithmetic: According to SIP-XOR-DIP", // the label Huawei prints (the function is not published)
  "System Priority: 120 System ID: 00e0-fcd4-04c3", // this end's system
  "Least Active-linknumber: 1 Max Active-linknumber: 2", // the active-link bounds
  "Operate status: up Number Of Up Port In Trunk: 2", // the trunk's state
  "--------------------------------------------------------------------------------", // Huawei's rule of 80 hyphens
  "ActorPortName Status PortType PortPri PortNo PortKey PortState Weight", // the Local table's header
  "GigabitEthernet0/0/2 Selected 1GE 10 262 2609 10111100 1", // in the bundle: 0x3D
  "GigabitEthernet0/0/3 Selected 1GE 10 263 2609 10111100 1", // in the bundle: 0x3D
  "GigabitEthernet0/0/4 Unselect 1GE 32768 264 2609 10100000 1", // left out: 0x05
  "", // the blank line before Partner:
  "Partner:", // what this end received
  "--------------------------------------------------------------------------------", // the rule again
  "ActorPortName SysPri SystemID PortPri PortNo PortKey PortState", // the Partner table's header (it too says ActorPortName)
  "GigabitEthernet0/0/2 32768 00e0-fc6e-bb11 32768 262 2609 10111100", // its partner: 0x3D
  "GigabitEthernet0/0/3 32768 00e0-fc6e-bb11 32768 263 2609 10111100", // its partner: 0x3D
  "GigabitEthernet0/0/4 32768 00e0-fc6e-bb11 32768 264 2609 10110000", // its partner: 0x0D
].join("\n"); // one pasted output

/** The state samples: Cisco's expected value, both passive (Linux's decimal), expired, different timeouts, three vendors' forms, and Huawei's display eth-trunk. */
export const STATE_SAMPLES = Object.freeze([
  Object.freeze({ id: "slow", request: Object.freeze({ mode: "state", format: "octet", actor: "0x3D", partner: "0x3D" }) }), // Cisco's expected 0x3D: in the bundle, slow rate
  Object.freeze({ id: "passive", request: Object.freeze({ mode: "state", format: "octet", actor: "68", partner: "0" }) }), // both passive, as /proc/net/bonding prints it
  Object.freeze({ id: "expired", request: Object.freeze({ mode: "state", format: "octet", actor: "0x85", partner: "0x37" }) }), // this end stopped hearing
  Object.freeze({ id: "timeouts", request: Object.freeze({ mode: "state", format: "octet", actor: "0x3F", partner: "0x3D" }) }), // fast on one end, slow on the other
  Object.freeze({ id: "extreme", request: Object.freeze({ mode: "state", format: "extreme", actor: "A-GSCD--", partner: "A-GSCD--" }) }), // Extreme Switch Engine's flags
  Object.freeze({ id: "arista", request: Object.freeze({ mode: "state", format: "arista", actor: "ALGs+CD", partner: "ALGs+CD" }) }), // Arista EOS's letters
  Object.freeze({ id: "snmp", request: Object.freeze({ mode: "state", format: "snmp", actor: "0xBC", partner: "0xBC" }) }), // the MIB's BITS values
  Object.freeze({ id: "huawei", request: Object.freeze({ mode: "state", format: "huawei", actor: "", partner: "", display: HUAWEI_DISPLAY_EXAMPLE, port: "" }) }), // Huawei's documented output, verbatim, both tables
] as const); // eight samples
