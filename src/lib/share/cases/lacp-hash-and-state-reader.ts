// ============================================================================
// src/lib/share/cases/lacp-hash-and-state-reader.ts
// ----------------------------------------------------------------------------
// Share cases of the LACP member link and state reader (08/11/2026): a form,
// the mode's fields as typed, only the fields the link policy reads, nothing of
// the other mode. Values are the page's Examples and samples (golden vectors
// example-link, example-state and sample-*: documentation addresses only,
// RFC 9542, RFC 5737 and RFC 3849) and other golden-vector shapes. Second set
// (08/11/2026): Huawei's format, with a pasted display eth-trunk output (the
// page's Huawei sample, Huawei's own documented example) or PortState values.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LACP_SHARE, type LacpShareState } from "../../tools/lacp-hash-and-state-reader/share"; // the spec
import { HUAWEI_DISPLAY_EXAMPLE } from "../../tools/lacp-hash-and-state-reader/examples"; // the page's Huawei sample

/** The link Example as the form holds it. */
const EXAMPLE_LINK: LacpShareState = { mode: "link", policy: "layer3+4", byteOrder: "little", members: "2", srcMac: "00:00:5e:00:53:0a", dstMac: "00:00:5e:00:53:01", srcIp: "192.0.2.10", dstIp: "198.51.100.20", protocol: "tcp", srcPort: "50001", dstPort: "873", vlan: "", priority: "", spreadField: "srcPort", spreadCount: "64" }; // the course lab's two members

/** The same flow as decode restores it: the fields layer3+4 does not read are not carried, so they come back blank. */
const EXAMPLE_LINK_RESTORED: LacpShareState = { ...EXAMPLE_LINK, srcMac: "", dstMac: "" }; // the page keeps its own MACs on arrival

/** The cases. */
export const LACP_HASH_AND_STATE_READER_SHARE_CASES = defineShareCases<LacpShareState, LacpShareState>({
  spec: LACP_SHARE, // the spec
  accept: [
    { id: "link-example", state: EXAMPLE_LINK, params: { mode: "link", policy: "layer3+4", order: "little", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", protocol: "tcp", srcport: "50001", dstport: "873", spread: "srcPort", count: "64" }, restored: EXAMPLE_LINK_RESTORED, mustNotContain: ["00:00:5e:00:53:0a", "00:00:5e:00:53:01"] }, // the link Example: the MACs layer3+4 ignores stay out
    { id: "state-example", state: { mode: "state", format: "octet", actor: "0x3F", partner: "0x3F", display: "", port: "" }, params: { mode: "state", format: "octet", actor: "0x3F", partner: "0x3F" }, restored: { mode: "state", format: "octet", actor: "0x3F", partner: "0x3F", display: "", port: "" } }, // the state Example
    { id: "state-actor-only", state: { mode: "state", format: "extreme", actor: "A-GSCD--", partner: "", display: "", port: "" }, params: { mode: "state", format: "extreme", actor: "A-GSCD--" }, restored: { mode: "state", format: "extreme", actor: "A-GSCD--", partner: "", display: "", port: "" } }, // one value, Extreme's flags
    { id: "link-layer2", state: { mode: "link", policy: "layer2", byteOrder: "big", members: "4", srcMac: "00:00:5e:00:53:0a", dstMac: "00:00:5e:00:53:01", srcIp: "192.0.2.10", dstIp: "198.51.100.20", protocol: "tcp", srcPort: "50001", dstPort: "873", vlan: "", priority: "", spreadField: "", spreadCount: "" }, params: { mode: "link", policy: "layer2", order: "big", members: "4", srcmac: "00:00:5e:00:53:0a", dstmac: "00:00:5e:00:53:01", srcip: "192.0.2.10", dstip: "198.51.100.20" }, restored: { mode: "link", policy: "layer2", byteOrder: "big", members: "4", srcMac: "00:00:5e:00:53:0a", dstMac: "00:00:5e:00:53:01", srcIp: "192.0.2.10", dstIp: "198.51.100.20", protocol: "tcp", srcPort: "", dstPort: "", vlan: "", priority: "", spreadField: "", spreadCount: "" }, mustNotContain: ["50001"] }, // layer2: no ports in the link
    { id: "link-vlan", state: { mode: "link", policy: "vlan+srcmac", byteOrder: "little", members: "2", srcMac: "00:00:5e:00:53:0a", dstMac: "", srcIp: "", dstIp: "", protocol: "tcp", srcPort: "", dstPort: "", vlan: "10", priority: "5", spreadField: "vlan", spreadCount: "16" }, params: { mode: "link", policy: "vlan+srcmac", order: "little", members: "2", srcmac: "00:00:5e:00:53:0a", vlan: "10", priority: "5", spread: "vlan", count: "16" }, restored: { mode: "link", policy: "vlan+srcmac", byteOrder: "little", members: "2", srcMac: "00:00:5e:00:53:0a", dstMac: "", srcIp: "", dstIp: "", protocol: "tcp", srcPort: "", dstPort: "", vlan: "10", priority: "5", spreadField: "vlan", spreadCount: "16" } }, // the VLAN policy with a priority and a spread
    { id: "state-huawei-display", state: { mode: "state", format: "huawei", actor: "", partner: "", display: HUAWEI_DISPLAY_EXAMPLE, port: "GigabitEthernet0/0/4" }, params: { mode: "state", format: "huawei", display: HUAWEI_DISPLAY_EXAMPLE, port: "GigabitEthernet0/0/4" }, restored: { mode: "state", format: "huawei", actor: "", partner: "", display: HUAWEI_DISPLAY_EXAMPLE, port: "GigabitEthernet0/0/4" } }, // Huawei's pasted output, its lines kept, a member chosen
    { id: "state-huawei-portstate", state: { mode: "state", format: "huawei", actor: "10111100", partner: "10100000", display: "", port: "" }, params: { mode: "state", format: "huawei", actor: "10111100", partner: "10100000" }, restored: { mode: "state", format: "huawei", actor: "10111100", partner: "10100000", display: "", port: "" } }, // PortState values typed
    { id: "state-huawei-display-over-typed", state: { mode: "state", format: "huawei", actor: "11111100", partner: "11111100", display: HUAWEI_DISPLAY_EXAMPLE, port: "" }, params: { mode: "state", format: "huawei", display: HUAWEI_DISPLAY_EXAMPLE }, restored: { mode: "state", format: "huawei", actor: "", partner: "", display: HUAWEI_DISPLAY_EXAMPLE, port: "" }, mustNotContain: ["11111100"] }, // the page reads the output, so values typed before it are not carried
    { id: "link-ipv6-udp", state: { mode: "link", policy: "layer3+4", byteOrder: "little", members: "3", srcMac: "", dstMac: "", srcIp: "2001:db8::10", dstIp: "2001:db8:1::20", protocol: "udp", srcPort: "53", dstPort: "53000", vlan: "", priority: "", spreadField: "", spreadCount: "" }, params: { mode: "link", policy: "layer3+4", order: "little", members: "3", srcip: "2001:db8::10", dstip: "2001:db8:1::20", protocol: "udp", srcport: "53", dstport: "53000" }, restored: { mode: "link", policy: "layer3+4", byteOrder: "little", members: "3", srcMac: "", dstMac: "", srcIp: "2001:db8::10", dstIp: "2001:db8:1::20", protocol: "udp", srcPort: "53", dstPort: "53000", vlan: "", priority: "", spreadField: "", spreadCount: "" } }, // IPv6 and UDP
  ],
  arrive: [
    { id: "link-defaults", values: { mode: "link", members: "2", srcmac: "00:00:5e:00:53:0a", dstmac: "00:00:5e:00:53:01", srcip: "192.0.2.10", dstip: "198.51.100.20" }, restored: { mode: "link", policy: "layer2", byteOrder: "little", members: "2", srcMac: "00:00:5e:00:53:0a", dstMac: "00:00:5e:00:53:01", srcIp: "192.0.2.10", dstIp: "198.51.100.20", protocol: "tcp", srcPort: "", dstPort: "", vlan: "", priority: "", spreadField: "", spreadCount: "" } }, // layer2 and little-endian when absent
    { id: "state-huawei-first-member", values: { mode: "state", format: "huawei", display: HUAWEI_DISPLAY_EXAMPLE }, restored: { mode: "state", format: "huawei", actor: "", partner: "", display: HUAWEI_DISPLAY_EXAMPLE, port: "" } }, // no port: the first row
    { id: "state-default-format", values: { mode: "state", actor: "61" }, restored: { mode: "state", format: "octet", actor: "61", partner: "", display: "", port: "" } }, // octet when absent
  ],
  empty: [
    { id: "state-blank", state: { mode: "state", format: "octet", actor: "", partner: "", display: "", port: "" } }, // nothing typed
    { id: "state-bare-hex", state: { mode: "state", format: "octet", actor: "3D", partner: "", display: "", port: "" } }, // the page shows its refusal
    { id: "state-huawei-no-rows", state: { mode: "state", format: "huawei", actor: "", partner: "", display: "nothing here", port: "" } }, // refused: no member rows
    { id: "link-one-member", state: { ...EXAMPLE_LINK, members: "1" } }, // refused: one member
    { id: "link-blank-port", state: { ...EXAMPLE_LINK, srcPort: "" } }, // refused: layer3+4 needs the ports
  ],
  blocked: [],
  reject: [
    { id: "no-mode", values: { actor: "0x3D" } }, // the mode is always written
    { id: "unknown-mode", values: { mode: "pagp", actor: "0x3D" } }, // not a mode the page has
    { id: "state-unknown-format", values: { mode: "state", format: "juniper", actor: "0x3D" } }, // not a format the page has
    { id: "state-without-actor", values: { mode: "state", partner: "0x3D" } }, // the actor is required
    { id: "state-with-link-field", values: { mode: "state", actor: "0x3D", members: "2" } }, // a field of the other mode
    { id: "link-with-state-field", values: { mode: "link", policy: "layer3+4", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1", dstport: "2", actor: "0x3D" } }, // a field of the other mode
    { id: "link-unknown-policy", values: { mode: "link", policy: "encap3+4", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1", dstport: "2" } }, // not computed
    { id: "link-unknown-order", values: { mode: "link", policy: "layer3+4", order: "middle", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1", dstport: "2" } }, // two orders only
    { id: "link-without-members", values: { mode: "link", policy: "layer3+4", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1", dstport: "2" } }, // the count is required
    { id: "link-unread-field", values: { mode: "link", policy: "layer3+4", members: "2", srcmac: "00:00:5e:00:53:0a", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1", dstport: "2" } }, // layer3+4 does not read MACs
    { id: "link-missing-port", values: { mode: "link", policy: "layer3+4", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1" } }, // a required field
    { id: "link-unknown-protocol", values: { mode: "link", policy: "layer3+4", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", protocol: "sctp", srcport: "1", dstport: "2" } }, // tcp or udp
    { id: "link-spread-without-count", values: { mode: "link", policy: "layer3+4", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1", dstport: "2", spread: "srcPort" } }, // the count is required with a spread
    { id: "link-count-without-spread", values: { mode: "link", policy: "layer3+4", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1", dstport: "2", count: "10" } }, // and the other way round
    { id: "link-spread-unread-field", values: { mode: "link", policy: "layer2", members: "2", srcmac: "00:00:5e:00:53:0a", dstmac: "00:00:5e:00:53:01", srcip: "192.0.2.10", dstip: "198.51.100.20", spread: "srcPort", count: "10" } }, // layer2 ignores ports
    { id: "two-lines-actor", values: { mode: "state", actor: "0x3D\n0x3F" } }, // every field is one line
    { id: "two-lines-port", values: { mode: "state", format: "huawei", display: HUAWEI_DISPLAY_EXAMPLE, port: "GigabitEthernet0/0/2\nGigabitEthernet0/0/4" } }, // the port too (only a pasted output keeps its lines)
    { id: "state-display-octet", values: { mode: "state", format: "octet", display: HUAWEI_DISPLAY_EXAMPLE } }, // a pasted output outside Huawei's format
    { id: "state-display-no-format", values: { mode: "state", display: HUAWEI_DISPLAY_EXAMPLE } }, // octet by default: not Huawei's
    { id: "state-display-with-actor", values: { mode: "state", format: "huawei", display: HUAWEI_DISPLAY_EXAMPLE, actor: "10111100" } }, // the output and a typed value
    { id: "state-display-with-partner", values: { mode: "state", format: "huawei", display: HUAWEI_DISPLAY_EXAMPLE, partner: "10111100" } }, // idem
    { id: "state-port-without-display", values: { mode: "state", format: "huawei", actor: "10111100", port: "GigabitEthernet0/0/2" } }, // a port needs an output
    { id: "state-display-blank", values: { mode: "state", format: "huawei", actor: "10111100", display: "  " } }, // a blank output is not a field to carry
    { id: "link-with-display", values: { mode: "link", policy: "layer3+4", members: "2", srcip: "192.0.2.10", dstip: "198.51.100.20", srcport: "1", dstport: "2", display: HUAWEI_DISPLAY_EXAMPLE } }, // a field of the other mode
  ],
});
