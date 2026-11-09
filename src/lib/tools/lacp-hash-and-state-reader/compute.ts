// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/lacp-hash-and-state-reader/compute.ts
// ----------------------------------------------------------------------------
// LACP MEMBER LINK AND STATE READER - the pure, deterministic engine
// (08/11/2026, written for chapter 2.2 of the open course "LAN Switch
// Operations and Maintenance" and the Learn article link-aggregation-and-lacp).
//
// TWO QUESTIONS, TWO MODES.
//   link   Which member of a bundle carries a flow? Computed ONLY for the one
//          hash an implementation publishes precisely enough to compute: the
//          Linux bonding driver's transmit hash, whose policies the kernel's
//          bonding HOWTO gives as formulas and whose code
//          (drivers/net/bonding/bond_main.c) fixes every detail. For the
//          member count chosen, the reading also gives the spread Cisco
//          documents for the Catalyst 6500/6000 (8 hash values shared out
//          among the ports), which shows why 2, 4 and 8 members split evenly
//          and 3, 5, 6 and 7 do not. Other vendors publish the fields they
//          hash, not the function, and are not computed (index.ts lists them).
//   state  The Actor_State and Partner_State octets of a LACPDU, or the flags
//          a show command prints, decoded bit by bit, with the timers that
//          follow and a verdict for the pair. Huawei's form (08/11/2026,
//          second set): the PortState strings of display eth-trunk, typed
//          alone or read from the whole pasted output, every member row of
//          its Local and Partner tables with Huawei's Status words.
//
// THE RULES, each from a document read on 2026-11-08 (sources in index.ts):
//   - Linux bonding HOWTO (docs.kernel.org/networking/bonding.html),
//     xmit_hash_policy: layer2 "hash = source MAC[5] XOR destination MAC[5]
//     XOR packet type ID", reduced "modulo slave count"; layer2+3 then "hash
//     XOR source IP XOR destination IP", "hash XOR (hash RSHIFT 16)", "hash XOR
//     (hash RSHIFT 8)"; layer3+4 starts from "source port, destination port (as
//     in the header)" and ends with "hash RSHIFT 1"; IPv6 addresses "first
//     hashed using ipv6_addr_hash"; vlan+srcmac "hash = (vlan ID) XOR (source
//     MAC vendor) XOR (source MAC dev)"; the default is layer2.
//   - bond_main.c (torvalds/linux master): bond_eth_hash XORs h_dest[5],
//     h_source[5] and be16_to_cpu(h_proto) (the EtherType as a number);
//     bond_ip_hash XORs flow_get_u32_dst and flow_get_u32_src, which are the
//     raw 32 bits of the IPv4 address (or ipv6_addr_hash of an IPv6 one,
//     include/net/ipv6.h: the XOR of its four 32-bit words), and the ports are
//     memcpy'd from flow_keys.ports (source port first, include/net/
//     flow_dissector.h): so the driver reads addresses and ports in the
//     PROCESSOR's byte order, and a little-endian processor gets a different
//     hash from the HOWTO read most significant byte first (which is what a
//     big-endian processor computes); bond_vlan_srcmac_hash builds vendor and
//     device byte by byte and XORs skb_vlan_tag_get(), which is vlan_tci, the
//     whole tag control information (include/linux/if_vlan.h), priority
//     included; bond_update_slave_arr lists the members that can transmit (in
//     802.3ad mode, those of the active aggregator) in the bond's order, and
//     bond_xmit_3ad_xor_slave_get picks arr[hash % count].
//   - Cisco document 12023 (30 November 2023), Catalyst 6500/6000: "The
//     Cisco-proprietary hash algorithm computes a value in the range 0 to 7",
//     ports accept 1:1:1:1:1:1:1:1 (8 ports) down to 4:4 (2 ports), and perfect
//     balance needs "two, four, or eight ports".
//   - State bits: IEEE8023-LAG-MIB (the IEEE 802.1AX-2020 module) LacpState,
//     bit 0 lacpActivity to bit 7 expired, "corresponding to bit 0 of the
//     Actor_State (LACP_Activity)" and so on; the Linux masks LACP_STATE_* in
//     include/uapi/linux/if_bonding.h (0x01 LACP_Activity to 0x80 Expired);
//     RFC 3417 s8: a BITS value puts the first named bit in the high-order bit,
//     so SNMP shows the octet bit-reversed; the meanings from Juniper's show
//     lacp interfaces; Extreme Switch Engine's flag legend "A-Activity,
//     T-Timeout, G-Aggregation, S-Synchronization C-Collecting, D-Distributing,
//     F-Defaulted, E-Expired" with "A-GSCD--" in its sample output; Arista
//     EOS's legend "A = Active, P = Passive; S=ShortTimeout, L=LongTimeout; G =
//     Aggregable, I = Individual; s+=InSync, s-=OutOfSync; C = Collecting, X =
//     state machine expired, D = Distributing, d = default neighbor state".
//   - Huawei S5700 and S6700 V200R025C00 Command Reference, Link Aggregation
//     Commands, display eth-trunk (read in a browser on 2026-11-08: the site
//     refuses automated reads): PortState "is eight bits, such as 10111100";
//     Bit 1 "Whether the member interface is an Actor. This bit has a fixed
//     value 1", Bit 2 the timeout (1 short, 0 long, long by default, 90 s),
//     Bit 3 aggregatable, Bit 4 "added to the link aggregation group (LAG)",
//     Bits 5 and 6 receiving and sending LACPDUs, Bit 7 default parameter
//     values, Bit 8 the actor's receive machine Expired. Those are IEEE
//     802.1AX's bits 0 (LACP_Activity) to 7 (Expired) written lowest first, so
//     10111100 is the octet 0x3D (the SNMP BITS value 0xBC written in binary).
//     The Status column: Selected (active), Unselect (inactive), ForceFwd (can
//     forward Layer 2 traffic). Its example (read a second time that evening,
//     verbatim) opens with "Eth-Trunk10's state information is:", then
//     "Local:", header lines, a rule of 80 hyphens and the Local table
//     (port, Status, PortType, PortPri, PortNo, PortKey, PortState, Weight),
//     then a blank line, "Partner:", the rule and the Partner table under
//     "ActorPortName SysPri SystemID PortPri PortNo PortKey PortState"; the
//     parser reads rows by those shapes, not by header words, and an output of
//     several trunks trunk by trunk.
//   - Timers: fast 1 s and slow 30 s, timeouts 3 s and 90 s (Juniper, Cisco
//     lacp rate, Extreme, the Linux driver's AD_FAST_PERIODIC_TIME,
//     AD_SLOW_PERIODIC_TIME, AD_SHORT_TIMEOUT_TIME and AD_LONG_TIMEOUT_TIME);
//     an end transmits at the rate its PARTNER's timeout bit asks for and times
//     the partner out by its OWN bit (ad_periodic_machine, ad_rx_machine; the
//     HOWTO's lacp_rate "Request partner to transmit LACPDUs every 30 seconds"
//     or "every 1 second"); no periodic transmission when both are passive.
//
// IEEE 802.1AX-2020 itself is offered through the IEEE GET Program, behind an
// IEEE account: it was not read, and the engine relies on its published MIB
// module and on vendor and Linux documentation, as the notes say.
//
// PAGE LANGUAGE. Every sentence is an EngineText from the catalogue SENTENCES
// below (pack keys tools.lacp-hash-and-state-reader.engine.<id>, whose English
// is the template exactly); run() and runApi() return plainText() of the same
// reading. Numbers never sit inside a sentence when the page prints them.
//
// Pure: no clock, no network, no randomness. Parsing uses anchored patterns
// with bounded repetition only (linear, ReDoS-safe); every field is at most
// MAX_FIELD characters; a pasted display eth-trunk output at most MAX_DISPLAY
// characters and MAX_DISPLAY_LINES non-blank lines, each read only when it is
// at most MAX_LINE characters; a spread computes at most MAX_SPREAD flows.
// ============================================================================

import { say, plainText, withEngineText, EngineText } from "../engine-text"; // sentences with ids, and the API's English projection

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

/** The Linux transmit hash policies the tool computes (the HOWTO's names). */
export type LinkPolicy = "layer2" | "layer2+3" | "layer3+4" | "vlan+srcmac"; // encap2+3 and encap3+4 read tunnels' inner headers: refused

/** The processor's byte order, which decides how the driver reads addresses and ports. */
export type ByteOrder = "little" | "big"; // little-endian or big-endian

/** The fields a spread can vary. */
export type SpreadField = "srcPort" | "dstPort" | "srcIp" | "dstIp" | "srcMac" | "dstMac" | "vlan"; // one field, upward from its typed value

/** How a state value is written. */
export type StateFormat = "octet" | "snmp" | "extreme" | "arista" | "huawei"; // as carried, as SNMP shows it, a vendor's letters, or Huawei's PortState

/** The link-mode request: one flow and the bond. Unused fields (for the policy) are not read. */
export interface LinkRequest {
  /** Selects this mode. */
  mode: "link";
  /** layer2 (the driver's default when absent), layer2+3, layer3+4 or vlan+srcmac. */
  policy?: string;
  /** "little" (when absent) or "big". */
  byteOrder?: string;
  /** How many members can transmit, 2 to 8. */
  members: string | number;
  /** The frame's source MAC (layer2, layer2+3, vlan+srcmac). */
  srcMac?: string;
  /** The frame's destination MAC (layer2, layer2+3). */
  dstMac?: string;
  /** The packet's source address, IPv4 or IPv6 (every policy but vlan+srcmac; for layer2 it sets the EtherType). */
  srcIp?: string;
  /** The packet's destination address, of the same family. */
  dstIp?: string;
  /** "tcp" (when absent) or "udp" (layer3+4). */
  protocol?: string;
  /** The source port, 0 to 65535 (layer3+4). */
  srcPort?: string | number;
  /** The destination port, 0 to 65535 (layer3+4). */
  dstPort?: string | number;
  /** The VLAN ID, 1 to 4094, or blank for an untagged frame (vlan+srcmac). */
  vlan?: string | number;
  /** The tag's priority, 0 (when absent) to 7 (vlan+srcmac, tagged frames only). */
  priority?: string | number;
  /** Optionally, one field to vary upward from its typed value, and how many flows. */
  spread?: { field: string; count: string | number } | null;
}

/** The state-mode request: one or two state values. */
export interface StateRequest {
  /** Selects this mode. */
  mode: "state";
  /** How the values are written: "octet" (when absent), "snmp", "extreme", "arista" or "huawei". */
  format?: string;
  /** The actor's state: the end whose output is read (blank when a Huawei display output is pasted instead). */
  actor?: string;
  /** The partner's state as that end reports it, or blank. */
  partner?: string;
  /** Huawei only: the whole display eth-trunk output, pasted instead of the two values (read only with format "huawei"). */
  display?: string;
  /** Huawei only: which member of the pasted output to read in detail, by its port name (the first row when blank). */
  port?: string;
}

/** Any request. */
export type LacpRequest = LinkRequest | StateRequest; // the API body names its mode

/** One step of a hash, as a 32-bit value. */
export interface HashStep {
  /** Which step (the page labels it): eth, ports, src, dst, ips, fold16, fold8, shift1, vendor, dev, tci, xor. */
  id: string;
  /** The value after the step, eight hexadecimal digits with 0x. */
  value: string;
}

/** A spread: one field varied over a run of values. */
export interface SpreadResult {
  /** The field varied. */
  field: SpreadField;
  /** How many flows. */
  count: number;
  /** The first value, as text. */
  from: string;
  /** The last value, as text. */
  to: string;
  /** How many flows each member carries, member 0 first. */
  counts: number[];
  /** The fewest on any member. */
  min: number;
  /** The most on any member. */
  max: number;
  /** True when no member carries more than one flow more than another. */
  even: boolean;
  /** The member of each of the first 16 flows, in order. */
  first: number[];
}

/** The link-mode reading. S: string for the API, EngineText for the page. */
export interface LinkResult<S = string> {
  /** The mode. */
  mode: "link";
  /** The policy computed. */
  policy: LinkPolicy;
  /** Whether the policy was the driver's default because none was given. */
  policyDefault: boolean;
  /** The byte order computed. */
  byteOrder: ByteOrder;
  /** Whether the byte order changes this policy's result (layer2+3 and layer3+4 only). */
  byteOrderMatters: boolean;
  /** How many members can transmit. */
  members: number;
  /** The address family, or null for vlan+srcmac. */
  family: "ipv4" | "ipv6" | null;
  /** The EtherType taken as the packet type ID, "0x0800" or "0x86DD", or null when the policy does not read it. */
  etherType: string | null;
  /** The request fields the policy reads, in the order the formula uses them. */
  used: string[];
  /** The HOWTO's formula for the policy, line by line (formula text, not prose). */
  formula: string[];
  /** Every intermediate value. */
  steps: HashStep[];
  /** The hash, eight hexadecimal digits with 0x. */
  hash: string;
  /** The hash in decimal. */
  hashDecimal: string;
  /** The member that carries the flow, counted from 0. */
  member: number;
  /** For each member k going down, the member (in the same numbering) the flow then uses. */
  ifDown: number[];
  /** Cisco's documented share of the 8 hash values per port for this many members (Catalyst 6500/6000). */
  ciscoValues: number[];
  /** Whether that split is even (2, 4 or 8 members). */
  ciscoEven: boolean;
  /** The spread, when one was asked for. */
  spread: SpreadResult | null;
  /** Notes. */
  notes: S[];
}

/** One bit of a state octet. */
export interface StateBit<S = string> {
  /** Its position, 0 (LACP_Activity) to 7 (Expired). */
  bit: number;
  /** Its name as the LACPDU field names it. */
  name: string;
  /** Its mask in the octet as carried, "0x01" to "0x80". */
  mask: string;
  /** Whether it is set. */
  set: boolean;
  /** What its value means. */
  text: S;
}

/** One end's state, in every form the tool reads. */
export interface StateSide<S = string> {
  /** The octet as carried, 0 to 255. */
  octet: number;
  /** As hexadecimal with 0x (Cisco's form). */
  hex: string;
  /** As decimal (Linux's form). */
  decimal: string;
  /** As eight binary digits, bit 7 first. */
  binary: string;
  /** As SNMP shows the BITS value: the octet bit-reversed, hexadecimal with 0x. */
  snmp: string;
  /** As Extreme Switch Engine prints its flags: ATGSCDFE, a hyphen for a bit not set. */
  extreme: string;
  /** As Huawei's display eth-trunk prints PortState: eight characters of 0 and 1, Bit 1 (the octet's bit 0) first. */
  huawei: string;
  /** The eight bits, bit 0 first. */
  bits: StateBit<S>[];
}

/** Huawei's Status words for a member interface (display eth-trunk). */
export type HuaweiStatus = "Selected" | "Unselect" | "ForceFwd"; // active, inactive, forwarding Layer 2 traffic

/** One member row of a pasted display eth-trunk output: its Local row and, when pasted, its Partner row. */
export interface HuaweiMember<S = string> {
  /** The port name, as printed (the first column of both tables). */
  port: string;
  /** The Status column. */
  status: HuaweiStatus;
  /** What Huawei says that status means. */
  statusText: S;
  /** PortType, as printed (1GE in Huawei's example). */
  portType: string;
  /** PortPri, as printed. */
  portPri: string;
  /** PortNo, as printed. */
  portNo: string;
  /** PortKey, as printed. */
  portKey: string;
  /** Weight, as printed. */
  weight: string;
  /** This end's PortState, as printed (Bit 1 first). */
  portState: string;
  /** The same state as an octet, hexadecimal with 0x. */
  hex: string;
  /** The Partner row for the same port, or null when the Partner table was not pasted or has no row for it. */
  partner: {
    /** The partner's system priority. */
    systemPriority: string;
    /** The partner's system ID, as printed (00e0-fc6e-bb11). */
    systemId: string;
    /** The partner's PortPri. */
    portPri: string;
    /** The partner's PortNo. */
    portNo: string;
    /** The partner's PortKey. */
    portKey: string;
    /** The partner's PortState, as printed. */
    portState: string;
    /** The same state as an octet, hexadecimal with 0x. */
    hex: string;
  } | null;
  /** The verdict for this member's pair, by the same rule as the reading's status. */
  verdict: "bundled" | "bundled-this-end" | "not-bundled";
}

/** What a pasted display eth-trunk output holds, beyond the member read in detail. */
export interface HuaweiReading<S = string> {
  /** The Eth-Trunk read, from its title line ("Eth-Trunk10's state information is:"), or null when no title was pasted. */
  trunk: string | null;
  /** The other Eth-Trunks the output holds, not read (an output of display eth-trunk without a number lists every trunk). */
  otherTrunks: string[];
  /** "LAG ID:", or null when not pasted. */
  lagId: string | null;
  /** "WorkingMode:", or null. */
  workingMode: string | null;
  /** "Hash arithmetic:", as printed (the label only: Huawei does not publish the function), or null. */
  hashArithmetic: string | null;
  /** This end's "System Priority:", or null. */
  systemPriority: string | null;
  /** This end's "System ID:", or null. */
  systemId: string | null;
  /** Every member row, in the Local table's order. */
  members: HuaweiMember<S>[];
  /** The member read in detail (its port name). */
  port: string;
  /** Whether that is the first row because no port was chosen. */
  portDefault: boolean;
}

/** A finding about the pair. */
export interface StateFinding<S = string> {
  /** A stable id. */
  id: string;
  /** "warn" stops or weakens the bundle; "info" is worth knowing. */
  level: "warn" | "info";
  /** The finding in a sentence or two. */
  text: S;
}

/** The state-mode reading. */
export interface StateResult<S = string> {
  /** The mode. */
  mode: "state";
  /** How the values were written. */
  format: StateFormat;
  /** Whether the format was the default because none was given. */
  formatDefault: boolean;
  /** The actor. */
  actor: StateSide<S>;
  /** The partner, or null when not given. */
  partner: StateSide<S> | null;
  /** Huawei only: what the pasted display eth-trunk output holds, or null when none was pasted. */
  huawei: HuaweiReading<S> | null;
  /** The timers that follow from the two Timeout bits and the two Activity bits. */
  timers: {
    /** Seconds without a LACPDU after which the actor times the partner out: 3 or 90. */
    actorTimeout: number;
    /** The same for the partner, or null without a partner. */
    partnerTimeout: number | null;
    /** How often the actor sends, in seconds (1 or 30), or null without a partner or when neither end sends periodically. */
    actorSends: number | null;
    /** How often the partner sends, in seconds, or null. */
    partnerSends: number | null;
    /** Whether LACPDUs are sent periodically at all (false when both are passive), or null without a partner. */
    periodic: boolean | null;
  };
  /** The verdict: bundled (both ends), bundled-this-end (actor only given), or not-bundled. */
  status: "bundled" | "bundled-this-end" | "not-bundled";
  /** The verdict in a sentence. */
  verdictText: S;
  /** What stops or weakens the bundle, in order. */
  findings: StateFinding<S>[];
  /** Notes. */
  notes: S[];
}

/** Any reading. */
export type LacpResult<S = string> = LinkResult<S> | StateResult<S>; // by mode

/** An input the engine refuses: its message is the English, its sentence travels with it for the page. */
export class LacpInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "LacpInputError"; // a readable name in stack traces
  } // constructor
} // LacpInputError

// ----------------------------------------------------------------------------
// The sentences (the en pack carries each template exactly)
// ----------------------------------------------------------------------------

/** Every sentence the engine writes, by id; {name} placeholders are ICU arguments. */
export const SENTENCES = Object.freeze({
  // ---- Refusals: both modes ----
  "err.mode": "Choose a mode: link (which member carries a flow) or state (read LACP state flags).", // no mode
  "err.json": "The request body is not valid JSON: send one JSON object that names its mode, link or state.", // the API body
  "err.tooLong": "A field is longer than this tool reads (64 characters).", // bounded before any pattern runs
  // ---- Refusals: link mode ----
  "err.policy": "Choose a transmit hash policy the Linux bonding driver documents and this tool computes: layer2, layer2+3, layer3+4 or vlan+srcmac. encap2+3 and encap3+4 can read the inner headers of a tunnel, which this tool does not take.", // the four policies
  "err.byteOrder": "Choose the processor's byte order: little (little-endian) or big (big-endian).", // two values
  "err.membersEmpty": "Enter how many members can transmit, a whole number from 2 to 8.", // nothing typed
  "err.membersBad": "\"{value}\" is not a member count: enter a whole number from 2 to 8.", // not a whole number
  "err.membersRange": "The tool reads 2 to 8 members: with one there is nothing to choose, and eight is as far as it goes.", // the bounds
  "err.srcMacEmpty": "Enter the source MAC address: this policy reads it.", // required by layer2, layer2+3, vlan+srcmac
  "err.dstMacEmpty": "Enter the destination MAC address: this policy reads it.", // required by layer2, layer2+3
  "err.macBad": "\"{value}\" is not a MAC address: write six octets in hexadecimal, as 00:00:5e:00:53:0a, 00-00-5E-00-53-0A or 0000.5e00.530a.", // malformed
  "err.srcIpEmpty": "Enter the source IP address: this policy reads it (for layer2, it sets the EtherType).", // required
  "err.dstIpEmpty": "Enter the destination IP address: this policy reads it (for layer2, it sets the EtherType).", // required
  "err.ipBad": "\"{value}\" is not an IPv4 or IPv6 address this tool reads (write it without a prefix length or a zone).", // malformed
  "err.familyMix": "The source and destination addresses mix IPv4 and IPv6: one packet carries one family.", // one family
  "err.protocol": "Choose the transport protocol: tcp or udp. layer3+4 reads the ports of unfragmented TCP and UDP only.", // the HOWTO's scope
  "err.srcPortEmpty": "Enter the source port: layer3+4 reads it.", // required
  "err.dstPortEmpty": "Enter the destination port: layer3+4 reads it.", // required
  "err.portBad": "\"{value}\" is not a port: enter a whole number from 0 to 65535.", // 16 bits
  "err.vlanBad": "\"{value}\" is not a VLAN ID: enter a whole number from 1 to 4094, or leave it blank for an untagged frame (the IEEE 802.1 MIBs do not permit 0 and 4095 as VLAN identifiers).", // IEEE8021-TC-MIB IEEE8021VlanIndex
  "err.priorityBad": "\"{value}\" is not a priority: enter a whole number from 0 to 7.", // IEEE8021PriorityValue
  "err.priorityNoTag": "A priority travels in a VLAN tag: enter the VLAN ID too, or leave the priority blank.", // no tag, no priority
  "err.spreadField": "{policy} does not read {field}, so varying it would move nothing: choose a field the policy reads.", // a field the hash ignores
  "err.spreadFieldBad": "Choose the field to vary: srcPort, dstPort, srcIp, dstIp, srcMac, dstMac or vlan.", // an unknown field
  "err.spreadCount": "\"{value}\" is not a flow count: enter a whole number from 1 to 4096.", // the bound
  "err.spreadVlan": "To vary the VLAN, start from a VLAN ID: an untagged frame has none.", // vlan+srcmac untagged
  "err.spreadOverflow": "That run of values goes past the last {field} there is: start lower or count fewer.", // past 65535, 4094, the last address
  // ---- Refusals: state mode ----
  "err.format": "Choose how the values are written: octet, snmp, extreme, arista or huawei.", // five formats (huawei added 2026-11-08)
  "err.actorEmpty": "Enter the actor's state: the value for the end whose output you are reading.", // required
  "err.octetBad": "\"{value}\" is not a state octet: write it in hexadecimal with 0x (0x3D, as Cisco prints it), in decimal (61, as Linux prints it in /proc/net/bonding) or in binary with 0b (0b00111101).", // malformed
  "err.octetBits": "\"{value}\" is eight characters of 0 and 1: for the PortState that Huawei's display eth-trunk prints (Bit 1 first), choose the huawei format; for an octet in binary, written bit 7 first, put 0b in front.", // a Huawei PortState typed as an octet
  "err.huaweiBad": "\"{value}\" is not a Huawei PortState: write the eight characters display eth-trunk prints, each 0 or 1, Bit 1 first (10111100 is an active member in the bundle).", // malformed
  "err.huaweiBoth": "Paste the display eth-trunk output or type the PortState values, not both.", // one source of values
  "err.displayLong": "The pasted output is longer than this tool reads (8192 characters, or 96 lines that are not blank).", // MAX_DISPLAY, MAX_DISPLAY_LINES
  "err.displayRows": "No member rows were found in the pasted output: paste display eth-trunk from an Eth-Trunk in LACP mode, with its Local table (port, Status, PortType, PortPri, PortNo, PortKey, PortState, Weight) and, if you have it, its Partner table.", // nothing to read
  "err.displayRowBad": "The row for {port} does not read as a member row of display eth-trunk: after the port name come Status (Selected, Unselect or ForceFwd), PortType, PortPri, PortNo, PortKey, a PortState of eight characters 0 or 1, and Weight.", // a Local row that does not parse
  "err.displayPartnerBad": "The Partner row for {port} does not read as one: after the port name come the system priority, the system ID (as 00e0-fc6e-bb11), PortPri, PortNo, PortKey and a PortState of eight characters 0 or 1.", // a Partner row that does not parse
  "err.displayTwice": "{port} has two rows in the same table: paste one display eth-trunk output at a time.", // a duplicate
  "err.displayOrphan": "The Partner table has a row for {port}, which the Local table does not list: paste the whole display eth-trunk output.", // a Partner row with no Local row
  "err.displayPort": "\"{value}\" is not a member port in the pasted output: choose one of the ports its Local table lists.", // an unknown port
  "err.octetHex": "\"{value}\" looks hexadecimal: write it with 0x in front (0x{value}), so it is not read as decimal.", // bare hex
  "err.octetRange": "\"{value}\" is more than one octet can hold: a state is 0 to 255 (0x00 to 0xFF).", // past 255
  "err.snmpBad": "\"{value}\" is not an SNMP BITS value of one octet: write two hexadecimal digits, with or without 0x (0xBC), or binary with 0b.", // malformed
  "err.extremeBad": "\"{value}\" is not an Extreme flags string: write eight positions, each its letter or a hyphen, in the order A T G S C D F E (A-GSCD-- is an active member in the bundle).", // malformed
  "err.aristaBad": "\"{value}\" is not an Arista state: write A or P, S or L, G or I, s+ or s-, and any of C, X, D and d, each once (ALGs+CD is an active member in the bundle).", // malformed
  // ---- Bits: what each value means ----
  "bit.0.set": "Active: the port takes part in the protocol whatever its partner's setting, and sends LACPDUs on its own.", // Juniper Activity
  "bit.0.clear": "Passive: the port does not send LACPDUs unless its partner is active.", // Juniper Activity
  "bit.1.set": "Short timeout: the port asks its partner for a LACPDU every second, and gives up on it after 3 seconds without one.", // Juniper Timeout; Linux lacp_rate fast
  "bit.1.clear": "Long timeout: the port asks its partner for a LACPDU every 30 seconds, and gives up on it after 90 seconds without one.", // Juniper Timeout; Linux lacp_rate slow
  "bit.2.set": "Aggregatable: the link can join an aggregation.", // Juniper Aggr
  "bit.2.clear": "Individual: the link can operate only as an individual link.", // Juniper Aggr
  "bit.3.set": "In sync: the link is allocated to the correct link aggregation group, the group is associated with a compatible aggregator, and its identity is consistent with the system ID and key transmitted.", // Juniper Syn
  "bit.3.clear": "Out of sync: the link is not, or not yet, in the right aggregation.", // Juniper Syn
  "bit.4.set": "Collecting: frames received on the link are passed to the aggregator.", // Juniper Col
  "bit.4.clear": "Not collecting: the receive function of the link is not enabled for the aggregation.", // Juniper Col
  "bit.5.set": "Distributing: the aggregator may send frames on the link.", // Juniper Dist
  "bit.5.clear": "Not distributing: distribution of outgoing frames on the link is disabled.", // Juniper Dist
  "bit.6.set": "Defaulted: the port is using partner information configured by default, not information received in a LACPDU.", // Juniper Def
  "bit.6.clear": "Not defaulted: the partner information in use was received in a LACPDU.", // Juniper Def
  "bit.7.set": "Expired: the port's receive machine is in the Expired state, because no LACPDU arrived before its timer ran out.", // Juniper Exp, Receive State
  "bit.7.clear": "Not expired.", // the bit clear
  // ---- Verdicts ----
  "verdict.bundled": "Bundled: both ends are aggregatable, in sync, collecting and distributing, and each is using what it heard from the other.", // all good
  "verdict.bundledThisEnd": "This end is bundled: aggregatable, in sync, collecting and distributing, on partner information received in a LACPDU. Add the partner's state to read the other direction.", // actor only
  "verdict.notBundled": "Not fully bundled: the findings below say why.", // something is off
  "verdict.notBundledThisEnd": "This end is not bundled: the findings below say why.", // actor only, something is off
  // ---- Findings ----
  "f.bothPassive": "Both ends are passive (LACP_Activity clear on each): neither sends a LACPDU until it hears one, so none are exchanged and the aggregation does not form. Juniper: \"If both links are in passive mode, they won't exchange LACP packets\"; Cisco: a port in the passive mode \"cannot form an EtherChannel with another port that is also in the passive mode\". Set at least one end to active.", // Juniper, Cisco, Linux periodic machine
  "f.actorExpired": "This end is Expired: no LACPDU arrived before its timeout ran out. If none arrives before the timer runs out again, it moves to Defaulted (Juniper, show lacp interfaces). While Expired, the Linux driver treats the partner as asking for the short timeout, so it sends every second.", // Juniper Receive State; Linux ad_rx_machine
  "f.actorDefaulted": "This end is Defaulted: it has received no LACPDU in time and is using partner information configured by default (Juniper), so the partner values beside it are those defaults, not what the far end said. Check that the far end runs LACP on this link and that at least one end is active.", // Juniper Def
  "f.partnerExpired": "The partner reports Expired: LACPDUs from this end stopped reaching it before its timeout ran out.", // the partner's own bit
  "f.partnerDefaulted": "The partner reports Defaulted: it has received no LACPDU from this end in time and uses default information for it, so LACPDUs from this end are not reaching it.", // the partner's own bit
  "f.actorIndividual": "This end's link is individual (Aggregation clear): it can operate only as an individual link and does not join the aggregation.", // Juniper Aggr
  "f.partnerIndividual": "The partner's link is individual (Aggregation clear): the far end will not aggregate it.", // Juniper Aggr
  "f.actorOutOfSync": "This end is out of sync: the link is not in the right aggregation. Synchronization means the link is in the correct group and the group's identity matches the system ID and key transmitted (Juniper), so compare the system IDs and keys: ports form one aggregation when they have \"the same actor system ID, actor key, partner system ID, and partner key\" (HPE Aruba). A member cabled to another switch, or to a port of another group there, shows a different partner system ID or key from the other members.", // Juniper Syn, Aruba
  "f.partnerOutOfSync": "The partner reports out of sync: on the far end this link is not in the right aggregation. Compare the system IDs and keys of the members on both ends.", // Juniper Syn
  "f.actorNotForwarding": "This end is in sync but not both collecting and distributing: it is still being attached to the aggregator, or waiting for the partner (the mux state in show lacp interfaces says which).", // Juniper Mux State
  "f.partnerNotForwarding": "The partner is in sync but not both collecting and distributing: on the far end the link is still being attached.", // Juniper Mux State
  "f.timeoutsDiffer": "The two ends ask for different timeouts. Each sends at the rate its partner asks for and times its partner out by its own setting, so a silent failure is noticed after a different time in each direction. LACP still works.", // Linux ad_periodic_machine, ad_rx_machine
  // ---- Huawei's Status column (display eth-trunk) ----
  "status.Selected": "Selected: Huawei defines a member interface in this state as active.", // Huawei display eth-trunk, Status
  "status.Unselect": "Unselect: Huawei defines a member interface in this state as inactive.", // idem
  "status.ForceFwd": "ForceFwd: Huawei defines a member interface in this state as one that can forward Layer 2 traffic.", // idem
  // ---- Notes: state ----
  "note.state.order": "Bit 0 is LACP_Activity and bit 7 is Expired, the order of the Actor_State and Partner_State fields of a LACPDU as IEEE 802.1AX's MIB module and the Linux driver give it; the hexadecimal and decimal forms read the octet with bit 0 as its lowest bit, 0x01.", // MIB, if_bonding.h
  "note.state.snmp": "Read through SNMP, dot3adAggPortActorOperState and dot3adAggPortPartnerOperState are BITS values: the first bit, LACP_Activity, is the high-order bit of the octet (RFC 3417, section 8), so the octet appears bit-reversed there.", // MIB, RFC 3417
  "note.state.timers": "Each end asks its partner for LACPDUs every second (short timeout) or every 30 seconds (long), and gives up on the partner after three intervals without one, 3 or 90 seconds (Juniper; Cisco, lacp rate; the Linux driver). Both ends passive means no periodic LACPDUs at all.", // Juniper, Cisco, Linux
  "note.state.actor": "The actor is the end whose output you are reading; the partner values are what it last received from the far end, or its defaults when Defaulted is set.", // Juniper Role
  "note.state.standard": "IEEE 802.1AX-2020 is offered through the IEEE GET Program behind an IEEE account and was not read: the bit names come from its published MIB module, and the meanings from Juniper's documentation and the Linux driver.", // availability
  "note.state.snmpRead": "You entered SNMP BITS values: each was reversed into the octet the LACPDU carries before it was read.", // the snmp format
  "note.state.extremeRead": "You entered Extreme Switch Engine flags: A, T, G, S, C, D, F and E are bits 0 to 7, a hyphen a bit not set (configure sharing, show lacp member-port).", // the extreme format
  "note.state.aristaRead": "You entered Arista EOS letters: A or P, S or L, G or I and s+ or s- give bits 0 to 3; C, D, d and X set Collecting, Distributing, Defaulted and Expired.", // the arista format
  "note.state.huaweiRead": "You entered Huawei PortState strings, as display eth-trunk prints them: each was read from Bit 1, its first character, which is bit 0 of the octet.", // the huawei format, values typed
  "note.state.huaweiTrunks": "The pasted output holds more than one Eth-Trunk: only the first with member rows is read. Paste display eth-trunk with a trunk's number to read another.", // several trunks pasted
  "note.state.huaweiDisplay": "From the pasted display eth-trunk output, the Local table gives each member's own PortState (the actor) and the Partner table the partner's, matched by port name; the bits, timers and findings are for the member read in detail.", // the huawei format, output pasted
  "note.state.huaweiOrder": "Huawei prints PortState as eight characters that read left to right from Bit 1 to Bit 8: Bit 1 is LACP_Activity, the octet's lowest bit (0x01), and Bit 8 is Expired, its highest (0x80). An octet is usually written the other way round, bit 7 first, so 10111100 as printed is 0b00111101, which is 0x3D; it is the same eight digits as the SNMP BITS value written in binary.", // Huawei display eth-trunk, PortState; RFC 3417
  "note.state.huaweiTable": "Huawei's table describes Bit 1 as whether the member interface is an Actor, with a fixed value 1: it sits where the IEEE 802.1AX MIB module puts LACP_Activity, so it is read as Activity here. Huawei words Bits 5 and 6 as whether the interface can receive and can send LACPDUs, where the MIB module names Collecting and Distributing. By default an Eth-Trunk member interface uses the long timeout, 90 seconds.", // Huawei display eth-trunk, PortState table
  // ---- Notes: link ----
  "note.link.linux": "This is the Linux bonding driver's transmit hash, as the kernel's bonding HOWTO gives it and drivers/net/bonding/bond_main.c computes it. Each end chooses the member only for what it sends: the switch picks the member for the return traffic with its own hash, which is not computed here.", // HOWTO, bond_main.c
  "note.link.policyDefault": "No policy given: layer2, the driver's default, is used.", // HOWTO
  "note.link.order": "The driver reads the IP addresses and the ports as the processor holds them in memory: a little-endian processor reads their bytes in the reverse order of the header, so its hash differs from the HOWTO's formula read most significant byte first, which is what a big-endian processor computes. The member changes with it only when the member count is not a power of two: the two folds of bond_ip_hash leave in the lowest byte the XOR of the word's four bytes, which their order does not change, and a modulo by 2, 4 or 8 reads only bits from that byte. Which fields count, the folds, the shift and the modulo are the same.", // bond_ip_hash, flow_dissector.h; the lowest byte after the folds (second set)
  "note.link.orderNone": "This policy reads single bytes, or builds its numbers byte by byte, so little-endian and big-endian processors get the same result.", // bond_eth_hash, bond_vlan_srcmac_hash
  "note.link.members": "Members are numbered from 0 in the order they joined the bond, counting only those that can transmit (in 802.3ad mode, those of the active aggregator); the driver picks the member at position hash modulo count (bond_update_slave_arr, bond_xmit_3ad_xor_slave_get).", // bond_main.c
  "note.link.ifDown": "When a member goes down, the list is rebuilt without it and the modulo runs over one member fewer, so flows on members that stayed up can move too.", // bond_update_slave_arr
  "note.link.layer2": "layer2 reads only the last byte of each MAC address and the EtherType, so all traffic between two MAC addresses, such as every flow sent to the default gateway, uses one member.", // HOWTO
  "note.link.layer23": "layer2+3 keeps each pair of hosts on one member: two connections between the same two addresses always share it.", // HOWTO
  "note.link.layer34": "layer3+4 reads the ports of unfragmented TCP and UDP only: fragments and other protocols hash without ports, and the HOWTO warns that a conversation with both fragmented and unfragmented packets can be striped over two members. The last shift drops the lowest bit, so two ports that differ only in their last bit usually hash alike.", // HOWTO, bond_ip_hash comment
  "note.link.vlan": "vlan+srcmac XORs the tag's whole tag control information, priority included (the driver reads vlan_tci, not only the VLAN ID), and counts an untagged frame as 0. It reads nothing of the destination, so every flow from one MAC address in one VLAN uses one member.", // bond_vlan_srcmac_hash, if_vlan.h
  "note.link.ipv6": "For IPv6, each address is first folded to 32 bits by XORing its four 32-bit words (ipv6_addr_hash).", // ipv6.h
  "note.link.cisco": "Cisco publishes the spread, not the hash: on the Catalyst 6500/6000 its proprietary hash gives one of 8 values and each port accepts some of them, so only 2, 4 or 8 ports split traffic evenly, \"even with random addresses\" (document 12023). The split below is that table, not a computation of Cisco's hash.", // Cisco 12023
  "note.link.notPublished": "Cisco's current Catalyst switches, Juniper, Arista, HPE Aruba, Extreme, Huawei and MikroTik's switch chips document which fields they hash, not the function, so the member they pick for a flow is not computed here; IEEE 802.1AX's own MIB module calls the description of the distribution algorithm vendor specific.", // the vendors' pages, the MIB
} as const); // the catalogue

/** A sentence id. */
type SentenceId = keyof typeof SENTENCES; // the catalogue's keys

/**
 * A sentence from its id and values: the English is the template filled, and the page fills the pack's own template
 * with the same values (one id, never fragments).
 * @param id the stable id (the pack key under engine.*)
 * @param args the values the template names
 * @returns the sentence
 */
function s(id: SentenceId, args?: Record<string, string>): EngineText {
  const tpl: string = SENTENCES[id]; // the English template
  const text = args ? tpl.replace(/\{(\w+)\}/g, (m: string, k: string) => (k in args ? args[k] : m)) : tpl; // filled for the API
  return say(id, text, args); // the values kept for the page
} // s

/**
 * Throw-ready input error carrying its sentence.
 * @param id the sentence id
 * @param args its values
 * @returns the error
 */
function refuse(id: SentenceId, args?: Record<string, string>): LacpInputError {
  const m = s(id, args); // the sentence
  return withEngineText(new LacpInputError(m), m); // the class, the English message, and the sentence
} // refuse

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/** The longest text any field may hold. */
export const MAX_FIELD = 64; // characters
/** The fewest members the tool reads. */
export const MIN_MEMBERS = 2; // one member leaves nothing to choose
/** The most members the tool reads. */
export const MAX_MEMBERS = 8; // a bound on the form
/** The most flows a spread computes. */
export const MAX_SPREAD = 4096; // a bound on the work
/** The EtherType of IPv4 (IANA IEEE 802 Numbers: 0800, Internet Protocol version 4). */
export const ETHERTYPE_IPV4 = 0x0800; // the packet type ID bond_eth_hash reads
/** The EtherType of IPv6 (IANA IEEE 802 Numbers: 86DD, Internet Protocol version 6). */
export const ETHERTYPE_IPV6 = 0x86dd; // idem

/** The policies, in the HOWTO's order. */
export const POLICIES: readonly LinkPolicy[] = Object.freeze(["layer2", "layer2+3", "layer3+4", "vlan+srcmac"]); // the four computed

/** The request fields each policy reads, in the formula's order. */
const USED: Readonly<Record<LinkPolicy, readonly string[]>> = Object.freeze({
  "layer2": ["srcMac", "dstMac", "srcIp", "dstIp"], // the MACs; the IP family only for the EtherType
  "layer2+3": ["srcMac", "dstMac", "srcIp", "dstIp"], // the MACs and the addresses
  "layer3+4": ["srcPort", "dstPort", "srcIp", "dstIp"], // the ports and the addresses
  "vlan+srcmac": ["vlan", "srcMac"], // the tag and the source MAC
}); // by policy

/** The fields a spread may vary for each policy (the IP addresses only change the EtherType's family under layer2). */
const SPREADABLE: Readonly<Record<LinkPolicy, readonly SpreadField[]>> = Object.freeze({
  "layer2": ["srcMac", "dstMac"], // only the MAC bytes move the hash
  "layer2+3": ["srcMac", "dstMac", "srcIp", "dstIp"], // MACs and addresses
  "layer3+4": ["srcPort", "dstPort", "srcIp", "dstIp"], // ports and addresses
  "vlan+srcmac": ["srcMac", "vlan"], // the source MAC and the tag
}); // by policy

/** The HOWTO's formula for each policy, line by line (bonding.html, xmit_hash_policy). */
const FORMULA: Readonly<Record<LinkPolicy, readonly string[]>> = Object.freeze({
  "layer2": ["hash = source MAC[5] XOR destination MAC[5] XOR packet type ID", "slave number = hash modulo slave count"], // layer2
  "layer2+3": ["hash = source MAC[5] XOR destination MAC[5] XOR packet type ID", "hash = hash XOR source IP XOR destination IP", "hash = hash XOR (hash RSHIFT 16)", "hash = hash XOR (hash RSHIFT 8)", "And then hash is reduced modulo slave count."], // layer2+3
  "layer3+4": ["hash = source port, destination port (as in the header)", "hash = hash XOR source IP XOR destination IP", "hash = hash XOR (hash RSHIFT 16)", "hash = hash XOR (hash RSHIFT 8)", "hash = hash RSHIFT 1", "And then hash is reduced modulo slave count."], // layer3+4
  "vlan+srcmac": ["hash = (vlan ID) XOR (source MAC vendor) XOR (source MAC dev)"], // vlan+srcmac
}); // by policy

/** Cisco document 12023, Catalyst 6500/6000: how many of the 8 hash values each port accepts, by port count. */
export const CISCO_SPLIT: Readonly<Record<number, readonly number[]>> = Object.freeze({
  2: [4, 4], // 4:4
  3: [3, 3, 2], // 3:3:2
  4: [2, 2, 2, 2], // 2:2:2:2
  5: [2, 2, 2, 1, 1], // 2:2:2:1:1
  6: [2, 2, 1, 1, 1, 1], // 2:2:1:1:1:1
  7: [2, 1, 1, 1, 1, 1, 1], // 2:1:1:1:1:1:1
  8: [1, 1, 1, 1, 1, 1, 1, 1], // 1:1:1:1:1:1:1:1
}); // the documented table

/** The eight state bits' names, bit 0 first (Linux LACP_STATE_* masks; the MIB's lacpActivity(0) to expired(7)). */
export const BIT_NAMES: readonly string[] = Object.freeze(["LACP_Activity", "LACP_Timeout", "Aggregation", "Synchronization", "Collecting", "Distributing", "Defaulted", "Expired"]); // 0x01 to 0x80

/** Arista EOS's state tokens: which bit each speaks for ("A = Active, P = Passive; S=ShortTimeout, L=LongTimeout; G = Aggregable, I = Individual; s+=InSync, s-=OutOfSync; C = Collecting, X = state machine expired, D = Distributing, d = default neighbor state"). */
const ARISTA_GROUP: Readonly<Record<string, string>> = Object.freeze({ A: "act", P: "act", S: "tmo", L: "tmo", G: "agg", I: "agg", "s+": "syn", "s-": "syn", C: "col", D: "dis", d: "def", X: "exp" }); // token -> bit group

/** The bit each Arista token sets in the octet (0 for the token that means the bit is clear). */
const ARISTA_BIT: Readonly<Record<string, number>> = Object.freeze({ A: 0x01, P: 0, S: 0x02, L: 0, G: 0x04, I: 0, "s+": 0x08, "s-": 0, C: 0x10, D: 0x20, d: 0x40, X: 0x80 }); // token -> mask

/** Extreme Switch Engine's flag letters, bit 0 first ("A-Activity, T-Timeout, G-Aggregation, S-Synchronization C-Collecting, D-Distributing, F-Defaulted, E-Expired"). */
const EXTREME_LETTERS = "ATGSCDFE"; // one per position

/** The longest display eth-trunk output the tool reads. */
export const MAX_DISPLAY = 8192; // characters: an output for many members fits several times over
/** The most non-blank lines it may hold. */
export const MAX_DISPLAY_LINES = 96; // lines
/** A line longer than this is not a row or a header line of display eth-trunk, and is not read. */
export const MAX_LINE = 200; // characters

/** Huawei's Status words, in the order its table defines them. */
export const HUAWEI_STATUSES: readonly HuaweiStatus[] = Object.freeze(["Selected", "Unselect", "ForceFwd"]); // display eth-trunk, Status

/** A Huawei PortState: eight characters of 0 and 1, Bit 1 first. Anchored. */
const PORTSTATE_RE = /^[01]{8}$/; // e.g. 10111100

/** A Local row of display eth-trunk in LACP mode: port, Status, PortType, PortPri, PortNo, PortKey, PortState, Weight. Anchored, bounded. */
const LOCAL_ROW_RE = /^(\S{1,48})\s{1,32}(Selected|Unselect|ForceFwd)\s{1,32}(\S{1,16})\s{1,32}(\d{1,5})\s{1,32}(\d{1,5})\s{1,32}(\d{1,5})\s{1,32}([01]{8})\s{1,32}(\d{1,5})$/; // GigabitEthernet0/0/2 Selected 1GE 10 262 2609 10111100 1

/** A line that starts like a Local row (a port name, then a Status word), whether or not the rest reads. */
const LOCAL_LIKE_RE = /^(\S{1,48})\s{1,32}(?:Selected|Unselect|ForceFwd)(?:\s|$)/; // for the refusal of a broken row

/** A Partner row: port, system priority, system ID, PortPri, PortNo, PortKey, PortState. Anchored, bounded. */
const PARTNER_ROW_RE = /^(\S{1,48})\s{1,32}(\d{1,5})\s{1,32}([0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4})\s{1,32}(\d{1,5})\s{1,32}(\d{1,5})\s{1,32}(\d{1,5})\s{1,32}([01]{8})$/; // GigabitEthernet0/0/2 32768 00e0-fc6e-bb11 32768 262 2609 10111100

/** A line that starts like a Partner row (a port name, a number, a system ID), whether or not the rest reads. */
const PARTNER_LIKE_RE = /^(\S{1,48})\s{1,32}\d{1,5}\s{1,32}[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}(?:\s|$)/; // for the refusal of a broken row

/** The title that opens each Eth-Trunk's part of display eth-trunk: "Eth-Trunk10's state information is:". Anchored, bounded. */
const TRUNK_RE = /^(Eth-Trunk\d{1,5})'s state information is:$/; // Huawei's example prints it before Local:

/** The header fields of display eth-trunk, each found anywhere in a line (bounded, no nested ambiguity). */
const HEADER_RE = Object.freeze({
  lagId: /LAG ID:\s{0,8}(\d{1,5})/, // LAG ID: 10
  workingMode: /WorkingMode:\s{0,8}([A-Za-z][A-Za-z-]{0,15})/, // WorkingMode: LACP
  hashArithmetic: /Hash arithmetic:\s{0,8}(\S{1,32}(?: \S{1,32}){0,7})/, // Hash arithmetic: According to SIP-XOR-DIP (words up to a double space)
  systemPriority: /System Priority:\s{0,8}(\d{1,5})/, // System Priority: 120
  systemId: /System ID:\s{0,8}([0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4})/, // System ID: 00e0-fcd4-04c3
}); // the five header fields the reading shows

// ----------------------------------------------------------------------------
// Parsing (anchored, bounded patterns; every refusal is a sentence)
// ----------------------------------------------------------------------------

/**
 * Text from a field that may arrive as a number, bounded in length.
 * @param v the raw value
 * @returns the trimmed text ("" for anything that is neither text nor a number)
 */
function fieldText(v: unknown): string {
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NaN"; // a JSON number as its decimal text
  const t = typeof v === "string" ? v.trim() : ""; // text, trimmed; anything else counts as blank
  if (t.length > MAX_FIELD) throw refuse("err.tooLong"); // bounded before any pattern runs
  return t; // the text
} // fieldText

/** A MAC address in colon or hyphen notation (six pairs) or Cisco dot notation (three groups of four). Anchored. */
const MAC_RE = /^(?:([0-9A-Fa-f]{2})([:-])([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})|([0-9A-Fa-f]{4})\.([0-9A-Fa-f]{4})\.([0-9A-Fa-f]{4}))$/; // e.g. 00:00:5e:00:53:0a

/**
 * A MAC address as six bytes.
 * @param raw the text
 * @param emptyId the refusal when blank
 * @returns the bytes
 */
function parseMac(raw: unknown, emptyId: SentenceId): number[] {
  const t = fieldText(raw); // trimmed and bounded
  if (t === "") throw refuse(emptyId); // required
  const m = MAC_RE.exec(t); // the groups
  if (!m) throw refuse("err.macBad", { value: t }); // malformed
  const hex = m[1] !== undefined ? [m[1], m[3], m[4], m[5], m[6], m[7]].join("") : m[8] + m[9] + m[10]; // twelve hex digits
  return Array.from({ length: 6 }, (_, i) => parseInt(hex.slice(2 * i, 2 * i + 2), 16)); // six bytes
} // parseMac

/** An IPv4 address: four dotted decimals. Anchored, bounded. */
const V4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/; // e.g. 192.0.2.10

/**
 * An IPv4 address as four bytes.
 * @param t the text
 * @returns the bytes, or null when it is not an IPv4 address (an octet over 255, or with a leading zero)
 */
function parseV4(t: string): number[] | null {
  const m = V4_RE.exec(t); // four parts
  if (!m) return null; // not dotted decimal
  const out: number[] = []; // the bytes
  for (const part of m.slice(1, 5)) { // each octet
    if (part.length > 1 && part.startsWith("0")) return null; // a leading zero reads as octal in some parsers: refused
    const o = Number(part); // the octet
    if (o > 255) return null; // not an octet
    out.push(o); // kept
  } // octets
  return out; // network order
} // parseV4

/**
 * An IPv6 address (RFC 4291 s2.2 text forms: eight groups, "::" once, an IPv4 tail) as sixteen bytes.
 * @param t the text (no zone, no prefix length)
 * @returns the bytes, or null when it is not an IPv6 address
 */
function parseV6(t: string): number[] | null {
  if (t.length > 45 || !/^[0-9A-Fa-f:.]{2,45}$/.test(t)) return null; // the longest text form is 45 characters
  const halves = t.split("::"); // the compressed run, at most once
  if (halves.length > 2) return null; // "::" twice
  /** One side of the "::" as 16-bit groups (an IPv4 tail counts as two), or null. */
  const side = (x: string, last: boolean): number[] | null => {
    if (x === "") return []; // nothing on this side
    const parts = x.split(":"); // the groups
    const out: number[] = []; // the values
    for (let i = 0; i < parts.length; i++) { // each group
      const p = parts[i]; // its text
      if (p.includes(".")) { // an embedded IPv4 address
        if (!last || i !== parts.length - 1) return null; // only as the very last part
        const v4 = parseV4(p); // its bytes
        if (v4 === null) return null; // not IPv4
        out.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]); // two groups
      } else { // a hexadecimal group
        if (!/^[0-9A-Fa-f]{1,4}$/.test(p)) return null; // one to four hex digits
        out.push(parseInt(p, 16)); // its value
      } // group
    } // groups
    return out; // the values
  }; // side
  const head = side(halves[0], halves.length === 1); // before "::" (or the whole address)
  const tail = halves.length === 2 ? side(halves[1], true) : []; // after "::"
  if (!head || !tail) return null; // a bad group
  let groups: number[]; // the eight groups
  if (halves.length === 1) { // no compression
    if (head.length !== 8) return null; // exactly eight
    groups = head; // as written
  } else { // "::" stands for one or more zero groups
    if (head.length + tail.length > 7) return null; // it must stand for at least one
    groups = [...head, ...Array<number>(8 - head.length - tail.length).fill(0), ...tail]; // filled
  } // forms
  return groups.flatMap((g) => [g >> 8, g & 0xff]); // network order, sixteen bytes
} // parseV6

/**
 * An IP address as bytes in network order.
 * @param raw the text
 * @param emptyId the refusal when blank
 * @returns four or sixteen bytes
 */
function parseIp(raw: unknown, emptyId: SentenceId): number[] {
  const t = fieldText(raw); // trimmed and bounded
  if (t === "") throw refuse(emptyId); // required
  const b = parseV4(t) ?? parseV6(t); // IPv4, else IPv6
  if (b === null) throw refuse("err.ipBad", { value: t }); // neither
  return b; // the bytes
} // parseIp

/**
 * A port.
 * @param raw the text or a JSON number
 * @param emptyId the refusal when blank
 * @returns 0 to 65535
 */
function parsePort(raw: unknown, emptyId: SentenceId): number {
  const t = fieldText(raw); // trimmed and bounded
  if (t === "") throw refuse(emptyId); // required
  if (!/^\d{1,5}$/.test(t) || Number(t) > 65535) throw refuse("err.portBad", { value: t }); // 16 bits
  return Number(t); // the port
} // parsePort

/**
 * The member count.
 * @param raw the text or a JSON number
 * @returns 2 to 8
 */
function parseMembers(raw: unknown): number {
  const t = fieldText(raw); // trimmed and bounded
  if (t === "") throw refuse("err.membersEmpty"); // required
  if (!/^\d{1,6}$/.test(t)) throw refuse("err.membersBad", { value: t }); // not a whole number
  const n = Number(t); // exact at six digits
  if (n < MIN_MEMBERS || n > MAX_MEMBERS) throw refuse("err.membersRange"); // the bounds
  return n; // 2 to 8
} // parseMembers

/**
 * The VLAN ID.
 * @param raw the text, a JSON number, or blank for an untagged frame
 * @returns 1 to 4094, or null when untagged
 */
function parseVlan(raw: unknown): number | null {
  const t = fieldText(raw); // trimmed and bounded
  if (t === "") return null; // untagged
  if (!/^\d{1,4}$/.test(t) || Number(t) < 1 || Number(t) > 4094) throw refuse("err.vlanBad", { value: t }); // IEEE8021VlanIndex: not 0, not 4095
  return Number(t); // the VID
} // parseVlan

/**
 * The tag's priority.
 * @param raw the text, a JSON number, or blank (0)
 * @param tagged whether the frame carries a tag
 * @returns 0 to 7
 */
function parsePcp(raw: unknown, tagged: boolean): number {
  const t = fieldText(raw); // trimmed and bounded
  if (t === "") return 0; // no priority given
  if (!/^[0-7]$/.test(t)) throw refuse("err.priorityBad", { value: t }); // IEEE8021PriorityValue: 0..7
  if (!tagged && t !== "0") throw refuse("err.priorityNoTag"); // a priority needs a tag
  return Number(t); // 0 to 7
} // parsePcp

// ----------------------------------------------------------------------------
// The Linux transmit hash
// ----------------------------------------------------------------------------

/** One flow, parsed into the bytes and numbers the hash reads. */
interface Frame {
  /** The source MAC, six bytes (empty when the policy does not read it). */
  srcMac: number[];
  /** The destination MAC, six bytes (empty when not read). */
  dstMac: number[];
  /** The source address, four or sixteen bytes (empty when not read). */
  srcIp: number[];
  /** The destination address, the same length (empty when not read). */
  dstIp: number[];
  /** The source port (0 when not read). */
  srcPort: number;
  /** The destination port (0 when not read). */
  dstPort: number;
  /** The VLAN ID, or null when untagged. */
  vlan: number | null;
  /** The tag's priority. */
  pcp: number;
}

/**
 * Four bytes read as an unsigned 32-bit number in the processor's byte order (how the C code reads raw memory).
 * @param b four bytes, in memory order
 * @param order the processor's byte order
 * @returns the number
 */
function word(b: readonly number[], order: ByteOrder): number {
  return order === "big" // most significant byte at the lowest address
    ? ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0 // big-endian
    : ((b[3] << 24) | (b[2] << 16) | (b[1] << 8) | b[0]) >>> 0; // little-endian
} // word

/**
 * An address as flow_get_u32_src/dst gives it: IPv4 as its raw 32 bits; IPv6 through ipv6_addr_hash.
 * @param b four or sixteen bytes
 * @param order the processor's byte order
 * @returns the 32-bit value
 */
function addr32(b: readonly number[], order: ByteOrder): number {
  if (b.length === 4) return word(b, order); // IPv4: the address as stored
  let w = 0; // IPv6: XOR of the four 32-bit words (include/net/ipv6.h)
  for (let i = 0; i < 16; i += 4) w = (w ^ word(b.slice(i, i + 4), order)) >>> 0; // each word as the processor reads it
  return w; // folded
} // addr32

/** Eight hexadecimal digits with 0x. */
const hex8 = (v: number): string => `0x${(v >>> 0).toString(16).padStart(8, "0")}`; // e.g. 0x0000080b

/**
 * The hash of one flow, step by step (bond_main.c: __bond_xmit_hash and the helpers it calls).
 * @param f the flow
 * @param policy the policy
 * @param order the processor's byte order
 * @returns the hash and every intermediate value
 */
function hashOf(f: Frame, policy: LinkPolicy, order: ByteOrder): { hash: number; steps: HashStep[] } {
  const steps: HashStep[] = []; // the account
  const put = (id: string, v: number): number => { steps.push({ id, value: hex8(v) }); return v >>> 0; }; // record a step
  if (policy === "vlan+srcmac") { // bond_vlan_srcmac_hash
    const vendor = put("vendor", (f.srcMac[0] << 16) | (f.srcMac[1] << 8) | f.srcMac[2]); // the first three octets, byte by byte
    const dev = put("dev", (f.srcMac[3] << 16) | (f.srcMac[4] << 8) | f.srcMac[5]); // the last three
    const tci = put("tci", f.vlan === null ? 0 : (f.pcp << 13) | f.vlan); // vlan_tci: priority, DEI (taken as 0) and VID; 0 untagged
    const h = put("xor", (tci ^ vendor ^ dev) >>> 0); // the hash
    return { hash: h, steps }; // no folds, no byte order
  } // vlan+srcmac
  let h: number; // the running value
  if (policy === "layer3+4") { // the ports, memcpy'd from flow_keys.ports: source port, then destination port
    h = put("ports", word([f.srcPort >> 8, f.srcPort & 0xff, f.dstPort >> 8, f.dstPort & 0xff], order)); // as the processor reads them
  } else { // bond_eth_hash: h_dest[5] ^ h_source[5] ^ be16_to_cpu(h_proto)
    const ethertype = f.srcIp.length === 16 ? ETHERTYPE_IPV6 : ETHERTYPE_IPV4; // the packet type ID
    h = put("eth", (f.dstMac[5] ^ f.srcMac[5] ^ ethertype) >>> 0); // one byte each, and the EtherType as a number
    if (policy === "layer2") return { hash: h, steps }; // layer2 stops here
  } // first step
  const src = put("src", addr32(f.srcIp, order)); // the source address as read
  const dst = put("dst", addr32(f.dstIp, order)); // the destination address as read
  h = put("ips", (h ^ dst ^ src) >>> 0); // hash XOR destination XOR source
  h = put("fold16", (h ^ (h >>> 16)) >>> 0); // hash XOR (hash RSHIFT 16)
  h = put("fold8", (h ^ (h >>> 8)) >>> 0); // hash XOR (hash RSHIFT 8)
  if (policy === "layer3+4") h = put("shift1", h >>> 1); // discard the lowest bit (layer3+4 only)
  return { hash: h, steps }; // the hash
} // hashOf

/**
 * Bytes as an unsigned integer, most significant first.
 * @param b the bytes
 * @returns the value
 */
const toBig = (b: readonly number[]): bigint => b.reduce((acc, x) => (acc << 8n) | BigInt(x), 0n); // big-endian value

/**
 * An unsigned integer back to a given number of bytes.
 * @param v the value
 * @param n how many bytes
 * @returns the bytes, most significant first
 */
const fromBig = (v: bigint, n: number): number[] => Array.from({ length: n }, (_, i) => Number((v >> BigInt(8 * (n - 1 - i))) & 0xffn)); // n bytes

/**
 * A MAC as text, colons, lower case.
 * @param b six bytes
 * @returns the text
 */
const macText = (b: readonly number[]): string => b.map((x) => x.toString(16).padStart(2, "0")).join(":"); // 00:00:5e:00:53:0a

/**
 * An IP address as text: dotted decimal, or RFC 5952 form for IPv6.
 * @param b four or sixteen bytes
 * @returns the text
 */
function ipText(b: readonly number[]): string {
  if (b.length === 4) return b.join("."); // IPv4
  const g = Array.from({ length: 8 }, (_, i) => (b[2 * i] << 8) | b[2 * i + 1]); // eight groups
  let best = -1; // where the longest run of zero groups starts
  let bestLen = 0; // its length
  for (let i = 0; i < 8; ) { // find runs
    if (g[i] !== 0) { i++; continue; } // not zero
    let j = i; // the run's end
    while (j < 8 && g[j] === 0) j++; // extend it
    if (j - i > bestLen) { best = i; bestLen = j - i; } // the first longest wins (RFC 5952 s4.2.3)
    i = j; // past it
  } // runs
  const hx = g.map((x) => x.toString(16)); // lower case, no leading zeros (RFC 5952 s4.1, s4.3)
  if (bestLen < 2) return hx.join(":"); // "::" never stands for a single group (RFC 5952 s4.2.2)
  return `${hx.slice(0, best).join(":")}::${hx.slice(best + bestLen).join(":")}`; // compressed
} // ipText

/**
 * The flow with one field moved i steps up from its value, or null when that runs past the field's last value.
 * @param f the flow
 * @param field the field
 * @param i how many steps
 * @returns the moved flow, or null
 */
function bump(f: Frame, field: SpreadField, i: number): Frame | null {
  if (field === "srcPort" || field === "dstPort") { // a port
    const v = f[field] + i; // moved
    return v > 65535 ? null : { ...f, [field]: v }; // 16 bits
  } // ports
  if (field === "vlan") { // the VID
    const v = (f.vlan ?? 0) + i; // moved
    return v > 4094 ? null : { ...f, vlan: v }; // the last VID
  } // vlan
  const b = f[field]; // the bytes of an address or a MAC
  const v = toBig(b) + BigInt(i); // moved
  if (v >> BigInt(8 * b.length) !== 0n) return null; // past the last value of the field
  return { ...f, [field]: fromBig(v, b.length) }; // the new bytes
} // bump

/**
 * A field's value as text, for the spread's ends.
 * @param f the flow
 * @param field the field
 * @returns the text
 */
function fieldValueText(f: Frame, field: SpreadField): string {
  if (field === "srcPort" || field === "dstPort") return String(f[field]); // a port
  if (field === "vlan") return String(f.vlan); // the VID
  if (field === "srcMac" || field === "dstMac") return macText(f[field]); // a MAC
  return ipText(f[field]); // an address
} // fieldValueText

/**
 * The link-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function linkLocalisable(r: LinkRequest): LinkResult<EngineText> {
  const pText = fieldText(r.policy); // the policy as given
  const policy = (pText === "" ? "layer2" : pText) as LinkPolicy; // layer2 when absent (the driver's default)
  if (!POLICIES.includes(policy)) throw refuse("err.policy"); // the four computed
  const oText = fieldText(r.byteOrder); // the byte order as given
  const order = (oText === "" ? "little" : oText) as ByteOrder; // little-endian when absent
  if (order !== "little" && order !== "big") throw refuse("err.byteOrder"); // two values
  const n = parseMembers(r.members); // 2 to 8
  const reads = (k: string): boolean => USED[policy].includes(k); // whether the policy reads a field
  const srcMac = reads("srcMac") ? parseMac(r.srcMac, "err.srcMacEmpty") : []; // the source MAC
  const dstMac = reads("dstMac") ? parseMac(r.dstMac, "err.dstMacEmpty") : []; // the destination MAC
  const srcIp = reads("srcIp") ? parseIp(r.srcIp, "err.srcIpEmpty") : []; // the source address
  const dstIp = reads("dstIp") ? parseIp(r.dstIp, "err.dstIpEmpty") : []; // the destination address
  if (srcIp.length !== dstIp.length) throw refuse("err.familyMix"); // one family per packet
  let srcPort = 0; // read by layer3+4 only
  let dstPort = 0; // idem
  if (policy === "layer3+4") { // the ports of TCP or UDP
    const proto = fieldText(r.protocol).toLowerCase(); // the protocol as given
    if (proto !== "" && proto !== "tcp" && proto !== "udp") throw refuse("err.protocol"); // the HOWTO's scope
    srcPort = parsePort(r.srcPort, "err.srcPortEmpty"); // required
    dstPort = parsePort(r.dstPort, "err.dstPortEmpty"); // required
  } // ports
  const vlan = policy === "vlan+srcmac" ? parseVlan(r.vlan) : null; // the VID, or untagged
  const pcp = policy === "vlan+srcmac" ? parsePcp(r.priority, vlan !== null) : 0; // the priority, 0 by default
  const frame: Frame = { srcMac, dstMac, srcIp, dstIp, srcPort, dstPort, vlan, pcp }; // the flow
  const { hash, steps } = hashOf(frame, policy, order); // the hash
  const member = hash % n; // arr[hash % count]
  const ifDown = Array.from({ length: n }, (_, k) => { // member k down: the list rebuilt without it
    const survivors = Array.from({ length: n }, (_, i) => i).filter((i) => i !== k); // in the bond's order
    return survivors[hash % survivors.length]; // arr[hash % (count - 1)], in the original numbering
  }); // every member in turn

  // ---- The spread, when asked for. ----
  let spread: SpreadResult | null = null; // none by default
  if (r.spread && typeof r.spread === "object") { // asked for
    const field = fieldText(r.spread.field) as SpreadField; // the field
    if (!(["srcPort", "dstPort", "srcIp", "dstIp", "srcMac", "dstMac", "vlan"] as string[]).includes(field)) throw refuse("err.spreadFieldBad"); // unknown
    if (!SPREADABLE[policy].includes(field)) throw refuse("err.spreadField", { policy, field }); // the hash ignores it
    const cText = fieldText(r.spread.count); // the count
    if (!/^\d{1,5}$/.test(cText) || Number(cText) < 1 || Number(cText) > MAX_SPREAD) throw refuse("err.spreadCount", { value: cText }); // 1 to 4096
    const count = Number(cText); // the flows
    if (field === "vlan" && vlan === null) throw refuse("err.spreadVlan"); // no VID to start from
    const counts = Array<number>(n).fill(0); // flows per member
    const first: number[] = []; // the first members, in order
    let last: Frame = frame; // the last flow computed
    for (let i = 0; i < count; i++) { // each flow
      const g = bump(frame, field, i); // the moved flow
      if (g === null) throw refuse("err.spreadOverflow", { field }); // past the field's last value
      const m = hashOf(g, policy, order).hash % n; // its member
      counts[m]++; // counted
      if (i < 16) first.push(m); // the first sixteen, for the page
      last = g; // remembered
    } // flows
    const min = Math.min(...counts); // the quietest member
    const max = Math.max(...counts); // the busiest
    spread = { field, count, from: fieldValueText(frame, field), to: fieldValueText(last, field), counts, min, max, even: max - min <= 1, first }; // the spread
  } // spread

  // ---- Notes. ----
  const notes: EngineText[] = []; // in order
  notes.push(s("note.link.linux")); // whose hash this is
  if (pText === "") notes.push(s("note.link.policyDefault")); // the default policy
  const orderMatters = policy === "layer2+3" || policy === "layer3+4"; // only these read 32-bit words
  notes.push(orderMatters ? s("note.link.order") : s("note.link.orderNone")); // the byte order
  notes.push(s(policy === "layer2" ? "note.link.layer2" : policy === "layer2+3" ? "note.link.layer23" : policy === "layer3+4" ? "note.link.layer34" : "note.link.vlan")); // the policy's consequence
  if (srcIp.length === 16 && policy !== "layer2") notes.push(s("note.link.ipv6")); // IPv6 folding
  notes.push(s("note.link.members")); // the numbering
  notes.push(s("note.link.ifDown")); // what a failure moves
  notes.push(s("note.link.cisco")); // the documented spread
  notes.push(s("note.link.notPublished")); // everyone else
  return {
    mode: "link", // the mode
    policy, // the policy
    policyDefault: pText === "", // the default was used
    byteOrder: order, // the byte order
    byteOrderMatters: orderMatters, // whether it changes the result
    members: n, // the count
    family: srcIp.length === 0 ? null : srcIp.length === 4 ? "ipv4" : "ipv6", // the family
    etherType: policy === "layer2" || policy === "layer2+3" ? (srcIp.length === 16 ? "0x86DD" : "0x0800") : null, // the packet type ID
    used: [...USED[policy]], // the fields read
    formula: [...FORMULA[policy]], // the HOWTO's lines
    steps, // every intermediate value
    hash: hex8(hash), // the hash
    hashDecimal: String(hash), // in decimal
    member, // the member
    ifDown, // after a failure
    ciscoValues: [...CISCO_SPLIT[n]], // the documented split
    ciscoEven: n === 2 || n === 4 || n === 8, // even only at 2, 4 and 8
    spread, // the spread
    notes, // notes
  }; // the reading
} // linkLocalisable

// ----------------------------------------------------------------------------
// State mode
// ----------------------------------------------------------------------------

/**
 * An octet with its bits in the reverse order (SNMP BITS to the octet as carried, and back).
 * @param v 0 to 255
 * @returns the reversed octet
 */
const reverse8 = (v: number): number => { let r = 0; for (let i = 0; i < 8; i++) if ((v >> i) & 1) r |= 1 << (7 - i); return r; }; // bit i to bit 7 - i

/**
 * A Huawei PortState as the octet: its first character is Bit 1, the octet's bit 0 (0x01), and its eighth is Bit 8,
 * bit 7 (0x80).
 * @param ps eight characters of 0 and 1, already checked
 * @returns 0 to 255
 */
function huaweiOctet(ps: string): number {
  let v = 0; // the octet
  for (let i = 0; i < 8; i++) if (ps[i] === "1") v |= 1 << i; // character i + 1 is bit i
  return v; // e.g. 10111100 -> 0x3D
} // huaweiOctet

/**
 * One state value, in the format given, as the octet the LACPDU carries.
 * @param raw the text
 * @param format how it is written
 * @returns 0 to 255
 */
function parseState(raw: unknown, format: StateFormat): number {
  const t = fieldText(raw); // trimmed and bounded
  if (format === "octet") { // hexadecimal, decimal or binary
    let m = /^0[xX]([0-9A-Fa-f]{1,2})$/.exec(t); // hexadecimal with 0x
    if (m) return parseInt(m[1], 16); // e.g. 0x3D
    if (/^0[xX][0-9A-Fa-f]{3,62}$/.test(t)) throw refuse("err.octetRange", { value: t }); // more than one octet
    m = /^0[bB]([01]{1,8})$/.exec(t); // binary with 0b
    if (m) return parseInt(m[1], 2); // e.g. 0b00111101
    if (/^0[bB][01]{9,62}$/.test(t)) throw refuse("err.octetRange", { value: t }); // more than eight bits
    if (/^(?:0|[1-9]\d{0,2})$/.test(t)) { // decimal
      if (Number(t) > 255) throw refuse("err.octetRange", { value: t }); // past one octet
      return Number(t); // e.g. 61
    } // decimal
    if (/^[0-9A-Fa-f]{1,2}$/.test(t)) throw refuse("err.octetHex", { value: t }); // bare hexadecimal (it has a letter, or a leading zero)
    if (PORTSTATE_RE.test(t)) throw refuse("err.octetBits", { value: t }); // eight 0s and 1s: a Huawei PortState, or binary without 0b
    throw refuse("err.octetBad", { value: t }); // anything else
  } // octet
  if (format === "huawei") { // display eth-trunk's PortState
    if (!PORTSTATE_RE.test(t)) throw refuse("err.huaweiBad", { value: t }); // eight characters of 0 and 1
    return huaweiOctet(t); // Bit 1 first
  } // huawei
  if (format === "snmp") { // a BITS value of one octet
    let m = /^(?:0[xX])?([0-9A-Fa-f]{1,2})$/.exec(t); // hexadecimal, with or without 0x
    if (m) return reverse8(parseInt(m[1], 16)); // bit 0 is the high-order bit (RFC 3417 s8)
    m = /^0[bB]([01]{8})$/.exec(t); // eight binary digits
    if (m) return reverse8(parseInt(m[1], 2)); // the same, written in binary
    throw refuse("err.snmpBad", { value: t }); // anything else
  } // snmp
  if (format === "extreme") { // eight positions
    if (!/^[A-][T-][G-][S-][C-][D-][F-][E-]$/.test(t)) throw refuse("err.extremeBad", { value: t }); // the legend's order
    let v = 0; // the octet
    for (let i = 0; i < 8; i++) if (t[i] === EXTREME_LETTERS[i]) v |= 1 << i; // a letter sets its bit
    return v; // the octet
  } // extreme
  if (!/^[APSLGIsCXDd+-]{1,16}$/.test(t)) throw refuse("err.aristaBad", { value: t }); // Arista's letters only
  const seen = new Set<string>(); // the groups seen
  let v = 0; // the octet
  for (let i = 0; i < t.length; ) { // tokens
    const two = t.slice(i, i + 2); // a two-character token?
    let token: string; // the token
    if (two === "s+" || two === "s-") { token = two; i += 2; } // in sync or out of sync
    else { token = t[i]; i += 1; } // one letter
    const group = ARISTA_GROUP[token]; // which bit it speaks for
    if (group === undefined || seen.has(group)) throw refuse("err.aristaBad", { value: t }); // a stray character, or a bit twice
    seen.add(group); // counted
    v |= ARISTA_BIT[token]; // its bit, or none
  } // tokens
  if (!["act", "tmo", "agg", "syn"].every((g) => seen.has(g))) throw refuse("err.aristaBad", { value: t }); // A/P, S/L, G/I and s+/s- are always printed
  return v; // the octet
} // parseState

/**
 * One end's state in every form, with its bits read.
 * @param v the octet as carried
 * @returns the side
 */
function sideOf(v: number): StateSide<EngineText> {
  return {
    octet: v, // the number
    hex: `0x${v.toString(16).toUpperCase().padStart(2, "0")}`, // Cisco's form
    decimal: String(v), // Linux's form
    binary: v.toString(2).padStart(8, "0"), // bit 7 first
    snmp: `0x${reverse8(v).toString(16).toUpperCase().padStart(2, "0")}`, // the BITS value
    extreme: Array.from({ length: 8 }, (_, i) => ((v >> i) & 1 ? EXTREME_LETTERS[i] : "-")).join(""), // Extreme's flags
    huawei: Array.from({ length: 8 }, (_, i) => ((v >> i) & 1 ? "1" : "0")).join(""), // Huawei's PortState: bit 0 first
    bits: BIT_NAMES.map((name, i) => { // each bit
      const set = ((v >> i) & 1) === 1; // its value
      return { bit: i, name, mask: `0x${(1 << i).toString(16).toUpperCase().padStart(2, "0")}`, set, text: s(`bit.${i}.${set ? "set" : "clear"}` as SentenceId) }; // read
    }), // the eight bits
  }; // the side
} // sideOf

/**
 * The verdict for a pair (or for one end): bundled when each end given is aggregatable, in sync, collecting and
 * distributing on received information (neither Defaulted nor Expired), and not both passive.
 * @param a the actor's octet
 * @param p the partner's octet, or null
 * @returns bundled, bundled-this-end (actor only) or not-bundled
 */
function statusOf(a: number, p: number | null): "bundled" | "bundled-this-end" | "not-bundled" {
  const bit = (v: number, i: number): boolean => ((v >> i) & 1) === 1; // one bit
  const clean = (v: number): boolean => bit(v, 2) && bit(v, 3) && bit(v, 4) && bit(v, 5) && !bit(v, 6) && !bit(v, 7); // in the bundle, on received information
  if (p === null) return clean(a) ? "bundled-this-end" : "not-bundled"; // one end only
  return clean(a) && clean(p) && (bit(a, 0) || bit(p, 0)) ? "bundled" : "not-bundled"; // both ends, at least one active
} // statusOf

/** An octet as two hexadecimal digits with 0x, upper case (Cisco's form). */
const octetHex = (v: number): string => `0x${v.toString(16).toUpperCase().padStart(2, "0")}`; // e.g. 0x3D

/**
 * A pasted display eth-trunk output, bounded before any pattern runs.
 * @param raw the text, as pasted
 * @returns the text, or "" when blank or not text
 */
function displayText(raw: unknown): string {
  const t = typeof raw === "string" ? raw : ""; // text only
  if (t.length > MAX_DISPLAY) throw refuse("err.displayLong"); // bounded first
  return t.trim() === "" ? "" : t; // blank counts as not pasted
} // displayText

/** One Eth-Trunk's part of a pasted output: its title (null before any title), its header fields and its rows. */
interface DisplaySection {
  /** The trunk named by its title line, or null for lines before any title. */
  trunk: string | null;
  /** The header fields, first occurrence in the section. */
  head: Record<keyof typeof HEADER_RE, string | null>;
  /** The Local rows, in order. */
  locals: HuaweiMember<EngineText>[];
  /** The Partner rows, by port. */
  partners: Map<string, NonNullable<HuaweiMember["partner"]>>;
} // DisplaySection

/**
 * Every member row of a pasted display eth-trunk output (Huawei VRP, LACP mode), with the header fields.
 * Rows are read by their shape (Huawei's example: a Local row is port, Status, PortType, PortPri, PortNo, PortKey,
 * PortState, Weight; a Partner row, under the header "ActorPortName SysPri SystemID PortPri PortNo PortKey PortState",
 * is port, system priority, system ID, PortPri, PortNo, PortKey, PortState), so the header words, the titles Local and
 * Partner and the rules of hyphens are not needed. A line that starts like a row but does not read as one is refused,
 * never skipped. An output of several Eth-Trunks ("Eth-Trunk10's state information is:" opens each, as in Huawei's
 * example of display eth-trunk) is read trunk by trunk, and the first with member rows is the one shown.
 * @param text the output (bounded)
 * @param portText the port to read in detail, or "" for the first row
 * @returns the reading
 */
function readDisplay(text: string, portText: string): HuaweiReading<EngineText> {
  const lines = text.split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l !== ""); // the non-blank lines
  if (lines.length > MAX_DISPLAY_LINES) throw refuse("err.displayLong"); // bounded
  const blank = (trunk: string | null): DisplaySection => ({ trunk, head: { lagId: null, workingMode: null, hashArithmetic: null, systemPriority: null, systemId: null }, locals: [], partners: new Map() }); // an empty section
  const sections: DisplaySection[] = [blank(null)]; // the lines before any title, then one per trunk
  for (const line of lines) { // each line
    if (line.length > MAX_LINE) continue; // not a row, a title or a header line of this output
    const tm = TRUNK_RE.exec(line); // a trunk's title?
    if (tm) { sections.push(blank(tm[1])); continue; } // a new section
    const sec = sections[sections.length - 1]; // the section the line belongs to
    for (const k of Object.keys(HEADER_RE) as (keyof typeof HEADER_RE)[]) { // each header field
      if (sec.head[k] !== null) continue; // the first occurrence wins
      const hm = HEADER_RE[k].exec(line); // anywhere in the line
      if (hm) sec.head[k] = hm[1]; // as printed
    } // header
    const lm = LOCAL_ROW_RE.exec(line); // a Local row?
    if (lm) { // yes
      if (sec.locals.some((x) => x.port === lm[1])) throw refuse("err.displayTwice", { port: lm[1] }); // one row per port
      const status = lm[2] as HuaweiStatus; // Selected, Unselect or ForceFwd
      sec.locals.push({ port: lm[1], status, statusText: s(`status.${status}` as SentenceId), portType: lm[3], portPri: lm[4], portNo: lm[5], portKey: lm[6], weight: lm[8], portState: lm[7], hex: octetHex(huaweiOctet(lm[7])), partner: null, verdict: "not-bundled" }); // the row, its pair added below
      continue; // next line
    } // local
    const ll = LOCAL_LIKE_RE.exec(line); // starts like one?
    if (ll) throw refuse("err.displayRowBad", { port: ll[1] }); // a broken Local row
    const pm = PARTNER_ROW_RE.exec(line); // a Partner row?
    if (pm) { // yes
      if (sec.partners.has(pm[1])) throw refuse("err.displayTwice", { port: pm[1] }); // one row per port
      sec.partners.set(pm[1], { systemPriority: pm[2], systemId: pm[3], portPri: pm[4], portNo: pm[5], portKey: pm[6], portState: pm[7], hex: octetHex(huaweiOctet(pm[7])) }); // the row
      continue; // next line
    } // partner
    const pl = PARTNER_LIKE_RE.exec(line); // starts like one?
    if (pl) throw refuse("err.displayPartnerBad", { port: pl[1] }); // a broken Partner row
  } // lines
  for (const sec of sections) for (const port of sec.partners.keys()) if (!sec.locals.some((x) => x.port === port)) throw refuse("err.displayOrphan", { port }); // a Partner row with no Local row in its trunk
  const chosen = sections.find((x) => x.locals.length > 0); // the first trunk with member rows
  if (!chosen) throw refuse("err.displayRows"); // nothing to read
  for (const m of chosen.locals) { // pair each member and judge it
    m.partner = chosen.partners.get(m.port) ?? null; // its Partner row, when pasted
    m.verdict = statusOf(huaweiOctet(m.portState), m.partner === null ? null : huaweiOctet(m.partner.portState)); // the same rule as the reading's
  } // members
  let port = chosen.locals[0].port; // the first row by default
  if (portText !== "") { // a port chosen
    const found = chosen.locals.find((x) => x.port === portText) ?? chosen.locals.find((x) => x.port.toLowerCase() === portText.toLowerCase()); // exactly, else ignoring case
    if (!found) throw refuse("err.displayPort", { value: portText }); // not in the output
    port = found.port; // as printed
  } // chosen
  const otherTrunks = sections.filter((x) => x !== chosen && x.trunk !== null).map((x) => x.trunk as string); // the trunks not read
  return { trunk: chosen.trunk, otherTrunks, lagId: chosen.head.lagId, workingMode: chosen.head.workingMode, hashArithmetic: chosen.head.hashArithmetic, systemPriority: chosen.head.systemPriority, systemId: chosen.head.systemId, members: chosen.locals, port, portDefault: portText === "" }; // the reading
} // readDisplay

/**
 * The state-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function stateLocalisable(r: StateRequest): StateResult<EngineText> {
  const fText = fieldText(r.format); // the format as given
  const format = (fText === "" ? "octet" : fText) as StateFormat; // octet when absent
  if (!["octet", "snmp", "extreme", "arista", "huawei"].includes(format)) throw refuse("err.format"); // five formats
  const dText = format === "huawei" ? displayText(r.display) : ""; // a pasted output is read only in Huawei's format
  let a: number; // the actor's octet
  let p: number | null; // the partner's octet, or null
  let huawei: HuaweiReading<EngineText> | null = null; // what a pasted output holds
  if (dText !== "") { // the whole display eth-trunk output
    if (fieldText(r.actor) !== "" || fieldText(r.partner) !== "") throw refuse("err.huaweiBoth"); // one source of values
    huawei = readDisplay(dText, fieldText(r.port)); // every member row
    const chosen = huawei.port; // the member read in detail
    const m = huawei.members.find((x) => x.port === chosen) as HuaweiMember<EngineText>; // its rows (readDisplay chose it from them)
    a = huaweiOctet(m.portState); // its Local PortState
    p = m.partner === null ? null : huaweiOctet(m.partner.portState); // its Partner PortState
  } else { // the values typed
    if (fieldText(r.actor) === "") throw refuse("err.actorEmpty"); // the actor is required
    a = parseState(r.actor, format); // the actor's octet
    const pText = fieldText(r.partner); // the partner, maybe blank
    p = pText === "" ? null : parseState(pText, format); // the partner's octet
  } // values
  const bit = (v: number, i: number): boolean => ((v >> i) & 1) === 1; // one bit
  const bothPassive = p !== null && !bit(a, 0) && !bit(p, 0); // neither end active
  const timers = { // the timers that follow
    actorTimeout: bit(a, 1) ? 3 : 90, // the actor's own Timeout bit
    partnerTimeout: p === null ? null : bit(p, 1) ? 3 : 90, // the partner's
    actorSends: p === null || bothPassive ? null : bit(p, 1) ? 1 : 30, // at the rate the partner asks for
    partnerSends: p === null || bothPassive ? null : bit(a, 1) ? 1 : 30, // at the rate the actor asks for
    periodic: p === null ? null : !bothPassive, // no periodic transmission when both are passive
  }; // timers
  const findings: StateFinding<EngineText>[] = []; // in order
  const add = (id: string, level: "warn" | "info", sid: SentenceId): void => { findings.push({ id, level, text: s(sid) }); }; // one finding
  if (bothPassive) add("both-passive", "warn", "f.bothPassive"); // no LACPDUs
  if (bit(a, 7)) add("actor-expired", "warn", "f.actorExpired"); // this end stopped hearing
  if (bit(a, 6)) add("actor-defaulted", "warn", "f.actorDefaulted"); // this end heard nothing
  if (p !== null && bit(p, 7)) add("partner-expired", "warn", "f.partnerExpired"); // the far end stopped hearing
  if (p !== null && bit(p, 6)) add("partner-defaulted", "warn", "f.partnerDefaulted"); // the far end heard nothing
  if (!bit(a, 2)) add("actor-individual", "warn", "f.actorIndividual"); // this end will not aggregate
  if (p !== null && !bit(p, 2)) add("partner-individual", "warn", "f.partnerIndividual"); // the far end will not
  if (!bit(a, 3)) add("actor-out-of-sync", "warn", "f.actorOutOfSync"); // this end not in the right group
  if (p !== null && !bit(p, 3)) add("partner-out-of-sync", "warn", "f.partnerOutOfSync"); // the far end not
  if (bit(a, 3) && !(bit(a, 4) && bit(a, 5))) add("actor-not-forwarding", "info", "f.actorNotForwarding"); // still attaching
  if (p !== null && bit(p, 3) && !(bit(p, 4) && bit(p, 5))) add("partner-not-forwarding", "info", "f.partnerNotForwarding"); // the far end still attaching
  if (p !== null && bit(a, 1) !== bit(p, 1)) add("timeouts-differ", "info", "f.timeoutsDiffer"); // different rates
  const status = statusOf(a, p); // the verdict
  const verdictText = status === "bundled" ? s("verdict.bundled") : status === "bundled-this-end" ? s("verdict.bundledThisEnd") : p === null ? s("verdict.notBundledThisEnd") : s("verdict.notBundled"); // in a sentence
  const notes: EngineText[] = []; // in order
  if (format === "snmp") notes.push(s("note.state.snmpRead")); // the values were reversed
  if (format === "extreme") notes.push(s("note.state.extremeRead")); // Extreme's letters
  if (format === "arista") notes.push(s("note.state.aristaRead")); // Arista's letters
  if (format === "huawei") notes.push(s(huawei === null ? "note.state.huaweiRead" : "note.state.huaweiDisplay")); // Huawei's strings, typed or pasted
  if (huawei !== null && huawei.otherTrunks.length > 0) notes.push(s("note.state.huaweiTrunks")); // other trunks left unread
  notes.push(s("note.state.actor")); // who is who
  if (format === "huawei") { notes.push(s("note.state.huaweiOrder")); notes.push(s("note.state.huaweiTable")); } // left to right, and Huawei's own words
  notes.push(s("note.state.order")); // the bit order
  notes.push(s("note.state.snmp")); // SNMP's order
  notes.push(s("note.state.timers")); // the rates
  notes.push(s("note.state.standard")); // the standard was not read
  return {
    mode: "state", // the mode
    format, // the format
    formatDefault: fText === "", // the default was used
    actor: sideOf(a), // the actor
    partner: p === null ? null : sideOf(p), // the partner
    huawei, // a pasted display eth-trunk output, or null
    timers, // the timers
    status, // the verdict
    verdictText, // in a sentence
    findings, // why
    notes, // notes
  }; // the reading
} // stateLocalisable

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The page's entry: either mode, sentences as EngineTexts.
 * @param r the request (its mode picks the computation)
 * @returns the reading
 */
export function runLocalisable(r: LacpRequest): LacpResult<EngineText> {
  if (r && typeof r === "object" && r.mode === "link") return linkLocalisable(r); // which member
  if (r && typeof r === "object" && r.mode === "state") return stateLocalisable(r); // state flags
  throw refuse("err.mode"); // no mode
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param r the request
 * @returns the reading as the API returns it
 */
export function run(r: LacpRequest): LacpResult {
  return plainText(runLocalisable(r)) as LacpResult; // sentences as their English
} // run

/**
 * The API's entry: the request body as JSON text.
 * @param input the JSON text
 * @returns the reading
 */
export function runApi(input: string): LacpResult {
  let parsed: unknown; // the body
  try {
    parsed = JSON.parse(input); // the object
  } catch {
    throw refuse("err.json"); // a readable refusal, passed through by the Worker
  } // parsed
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw refuse("err.json"); // not an object
  return run(parsed as LacpRequest); // the same engine as the page
} // runApi
