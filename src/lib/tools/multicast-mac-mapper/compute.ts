// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/multicast-mac-mapper/compute.ts
// ----------------------------------------------------------------------------
// MULTICAST GROUP <-> ETHERNET MAC MAPPER - the pure, deterministic engine
// (02/11/2026, written for chapter 4.7 of the open course "LAN Switch
// Operations and Maintenance" and the Learn article
// multicast-what-it-costs-to-not-flood).
//
// ONE FIELD, FOUR READINGS, picked by what is typed:
//   IPv4 group -> MAC   the MAC, the 23 bits that survive and the 5 that are
//                       lost, the IANA block and RFC 2365 scope, IANA's name,
//                       and the 32 groups that share the MAC;
//   IPv6 group -> MAC   the MAC, the 32 bits that survive and the 96 that are
//                       lost, the flags and scope, what the address is (SSM,
//                       unicast-prefix-based, embedded RP, solicited-node,
//                       documentation, IANA's name);
//   01-00-5E MAC -> IPv4  the 32 candidate groups, each with its block, scope
//                       and IANA's name where it has one;
//   33-33 MAC -> IPv6   the pattern of every group that maps to it, and the
//                       addresses IANA names with those last 32 bits.
// A MAC is read in colon (01:00:5e:01:01:01), hyphen (01-00-5E-01-01-01) or
// Cisco dot (0100.5e01.0101) notation and always shown in all three.
//
// THE RULES, each from a document read on 2026-11-02 (sources in index.ts):
//   - RFC 1112 s4: host groups have "1110" as their high-order four bits,
//     224.0.0.0 to 239.255.255.255; "1111" is reserved "for future addressing
//     modes"; 224.0.0.0 "is guaranteed not to be assigned to any group".
//   - RFC 1112 s6.4: a group maps "by placing the low-order 23-bits of the IP
//     address into the low-order 23 bits of the Ethernet multicast address
//     01-00-5E-00-00-00 (hex)"; with 28 significant bits, "more than one host
//     group address may map to the same Ethernet multicast address": 2^5.
//   - RFC 2464 s7: an IPv6 group goes to 33-33 followed by "the last four
//     octets" of the address.
//   - RFC 9542 s2.1.1: the group (M) bit is the lowest bit of the first octet;
//     s2.1.3: IANA's 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF is IPv4 multicast
//     (so the 25th bit is 0), the upper half carries other assignments; s2.3.1:
//     33-33-00-00-00-00 to 33-33-FF-FF-FF-FF is IPv6 multicast. RFC 9542
//     obsoletes RFC 7042 (rfc-index.xml, read the same day).
//   - IANA's IPv4 Multicast Address Space (2026-08-20) and RFC 5771 s3 to s10:
//     the blocks; RFC 2365 s6 and s8: the IPv4 scopes; s9 with IANA's relative
//     addresses: the top /24 of a scope; RFC 3180 s3: GLOP; RFC 6034 s3: UBM;
//     RFC 4607 s1 and s4.3: SSM; RFC 6676: documentation addresses.
//   - RFC 4291 s2.7 and s2.7.1 with RFC 7346 s2 (scope 3) and RFC 7371 s2 to
//     s4 (flags as separate bits): IPv6 flags, scope, reserved and
//     solicited-node addresses; RFC 3306 s4: unicast-prefix-based addresses;
//     RFC 3956 s3, s4 and s6.3 as updated by RFC 7371 s4.2: embedded RP;
//     RFC 3307 s4 and RFC 10028 s3: group ID ranges; IANA's IPv6 Multicast
//     Address Space (2026-04-07): names.
//   - RFC 4541 s2.1.2, s3 and s4: what a snooping switch does with the
//     ambiguity (IP-based tables preferred; 224.0.0.x and ff02::1 flooded).
//
// PAGE LANGUAGE. Every sentence is an EngineText (../engine-text.ts):
// runLocalisable() returns the reading with them in place for the page (pack
// keys tools.multicast-mac-mapper.engine.<id>); run() returns plainText() of the
// same reading for the API and the golden vectors. Block, scope and table names
// travel as ids (the page has its own labels) beside their English for the API.
//
// Pure: no clock, no network, no randomness. Every pattern is anchored with
// bounded repetition only (linear, ReDoS-safe), and the input is at most
// MAX_INPUT characters before any pattern runs.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids, and the API's English projection
import { IPV4_ROWS, IPV4_RELATIVE, IPV6_ROWS, IPV6_DYNAMIC } from "./iana-data"; // IANA's names, packed

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

/** How a MAC address was written. */
export type MacNotation = "colon" | "hyphen" | "dot"; // 01:00:5e:.., 01-00-5E-.., 0100.5e..

/** A MAC address in the three notations the tool reads. */
export interface MacForms {
  /** Colon notation, lower case, as the Learn article's Linux and tcpdump captures print it: 01:00:5e:7c:00:01. */
  colon: string;
  /** Hyphen notation, upper case, as RFC 1112 and RFC 9542 write it: 01-00-5E-7C-00-01. */
  hyphen: string;
  /** Cisco dot notation, three groups of four hex digits, lower case: 0100.5e7c.0001. */
  dot: string;
}

/** IANA's registration groups of the IPv4 multicast space (registry of 2026-08-20; RFC 5771 s3). */
export type Ipv4BlockId =
  | "local-network-control" // 224.0.0.0/24
  | "internetwork-control" // 224.0.1.0/24
  | "ad-hoc-1" // 224.0.2.0 to 224.0.255.255
  | "reserved" // 224.1.0.0/16, 224.5.0.0 to 224.251.255.255, 225.0.0.0 to 231.255.255.255, 235.0.0.0 to 238.255.255.255
  | "sdp-sap" // 224.2.0.0/16
  | "ad-hoc-2" // 224.3.0.0 to 224.4.255.255
  | "dis-transient" // 224.252.0.0/14
  | "ssm" // 232.0.0.0/8
  | "glop" // 233.0.0.0 to 233.251.255.255
  | "ad-hoc-3" // 233.252.0.0/14
  | "ubm" // 234.0.0.0/8
  | "admin-scoped"; // 239.0.0.0/8

/** RFC 2365's scopes of the IPv4 space (sections 6 and 8). */
export type Ipv4ScopeId =
  | "link-local" // 224.0.0.0/24, "statically assigned link-local scope"
  | "global" // 224.0.1.0 to 238.255.255.255
  | "local" // 239.255.0.0/16, the IPv4 Local Scope
  | "local-expansion" // 239.253.0.0/16 and 239.254.0.0/16, reserved for the Local Scope to grow into
  | "organisation" // 239.192.0.0/14, the IPv4 Organization Local Scope
  | "organisation-expansion" // 239.0.0.0/10, 239.64.0.0/10, 239.128.0.0/10
  | "admin-other"; // the rest of 239.0.0.0/8 (239.196.0.0 to 239.252.255.255)

/** Which of IANA's tables named an IPv4 group. */
export type Ipv4Table =
  | "lnc" // Local Network Control Block
  | "inc" // Internetwork Control Block
  | "sdp" // SDP/SAP Block
  | "ssm" // Source-Specific Multicast Block
  | "test" // MCAST-TEST-NET (AD-HOC Block III)
  | "relative-local" // relative address of the IPv4 Local Scope
  | "relative-organisation"; // relative address of the IPv4 Organization Local Scope

/** One IPv4 group with what the registries say about it. */
export interface Ipv4Group {
  /** Dotted quad. */
  group: string;
  /** Its IANA block. */
  block: Ipv4BlockId;
  /** Its RFC 2365 scope. */
  scope: Ipv4ScopeId;
  /** IANA's name for it (or the row that covers it), as published; null when none. */
  registered: string | null;
  /** The table that named it; null when none. */
  table: Ipv4Table | null;
}

/** An IPv4 group mapped to its MAC. S: string for the API, EngineText for the page. */
export interface Ipv4Forward<S = string> {
  /** Group to MAC. */
  direction: "forward";
  /** IPv4. */
  family: "ipv4";
  /** The group, dotted quad. */
  group: string;
  /** The group as 8 hex digits, upper case. */
  groupHex: string;
  /** The group's 32 bits: the class D prefix (4), the bits the MAC loses (5) and the bits it keeps (23). */
  bits: { prefix: string; lost: string; kept: string };
  /** The 23 kept bits as 6 hex digits, upper case (the MAC's last three octets). */
  keptHex: string;
  /** The MAC in three notations. */
  mac: MacForms;
  /** The MAC's 48 bits. */
  macBits: string;
  /** The group's IANA block. */
  block: Ipv4BlockId;
  /** The block's name in English (the page uses its own label for the id). */
  blockName: string;
  /** The block's range. */
  blockRange: string;
  /** The group's RFC 2365 scope. */
  scope: Ipv4ScopeId;
  /** The scope's name in English. */
  scopeName: string;
  /** IANA's name for the group, or null. */
  registered: string | null;
  /** The table that named it, or null. */
  table: Ipv4Table | null;
  /** GLOP block: the 16-bit AS number in the middle two octets (RFC 3180 s3); null elsewhere. */
  glopAs: number | null;
  /** UBM block: the group shifted left by 8 bits, as a /24 (RFC 6034 s3); null elsewhere. */
  ubmPrefix: string | null;
  /** In the top /24 of the Local or the Organization Local Scope: the relative offset (RFC 2365 s9); null elsewhere. */
  relativeOffset: number | null;
  /** The 32 groups that share the MAC, in numeric order, this one included. */
  sharing: Ipv4Group[];
  /** Whether one of the other 31 is in the Local Network Control Block (224.0.0.0/24). */
  sharesLocalControl: boolean;
  /** Warnings. */
  warnings: S[];
  /** Notes, with their sources. */
  notes: S[];
}

/** An 01-00-5E MAC read back to its 32 candidate IPv4 groups. */
export interface Ipv4Reverse<S = string> {
  /** MAC to groups. */
  direction: "reverse";
  /** IPv4. */
  family: "ipv4";
  /** How the MAC was written. */
  notation: MacNotation;
  /** The MAC in three notations. */
  mac: MacForms;
  /** The MAC's 48 bits. */
  macBits: string;
  /** The 23 bits the MAC carries. */
  kept: string;
  /** The same as 6 hex digits, upper case. */
  keptHex: string;
  /** Every candidate's 32 bits: 1110, five unknown bits as "?", then the 23 kept bits. */
  pattern: string;
  /** The 32 candidate groups, in numeric order. */
  candidates: Ipv4Group[];
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** RFC 4291 s2.7 and RFC 7346 s2's scope names, by id. */
export type Ipv6ScopeId =
  | "reserved" // 0 and F
  | "interface-local" // 1
  | "link-local" // 2
  | "realm-local" // 3 (RFC 7346)
  | "admin-local" // 4
  | "site-local" // 5
  | "unassigned" // 6, 7, 9 to D
  | "organisation-local" // 8
  | "global"; // E

/** RFC 3307 s4's group ID ranges (the last 32 bits). */
export type GroupIdRange = "zero" | "permanent-address" | "permanent-group-id" | "dynamic"; // 0; 1 to 3FFFFFFF; 40000000 to 7FFFFFFF; 80000000 and above

/** RFC 4607 s1 and s4.3's ranges of SSM group IDs in ff3x::/96. */
export type SsmRange = "invalid" | "reserved" | "iana" | "dynamic"; // 0 to 3FFFFFFF; 40000000; 40000001 to 7FFFFFFF; 80000000 and above

/** An IPv6 address IANA names. */
export interface Ipv6Named {
  /** The address, ff0X where the name holds for every scope. */
  address: string;
  /** IANA's name, as published. */
  name: string;
  /** The registry table: node-local, link-local, site-local or variable scope. */
  table: "node" | "link" | "site" | "var";
}

/** An IPv6 group mapped to its MAC. */
export interface Ipv6Forward<S = string> {
  /** Group to MAC. */
  direction: "forward";
  /** IPv6. */
  family: "ipv6";
  /** The group in RFC 5952's canonical text. */
  group: string;
  /** All eight groups of four hex digits. */
  exploded: string;
  /** The zone index typed after "%" (RFC 4007 s11), or null; it does not change the MAC. */
  zone: string | null;
  /** ff1, the four flag bits X R P T (RFC 4291 s2.7, RFC 7371 s4). */
  flags: { bits: string; x: boolean; r: boolean; p: boolean; t: boolean };
  /** The scope nibble, one hex digit. */
  scope: string;
  /** The scope's id. */
  scopeId: Ipv6ScopeId;
  /** The scope's name in English. */
  scopeName: string;
  /** The first 96 bits, which the MAC loses, as 24 hex digits. */
  lostHex: string;
  /** The last 32 bits, which the MAC keeps (RFC 3307's group ID), as 8 hex digits. */
  low32Hex: string;
  /** The MAC in three notations. */
  mac: MacForms;
  /** The MAC's 48 bits. */
  macBits: string;
  /** RFC 3307 s4's range for the group ID. */
  groupId: GroupIdRange;
  /** For a group ID of 0x80000000 or more: IANA's Dynamic Multicast Group IDs row (RFC 10028); otherwise null. */
  dynamicRow: string | null;
  /** P = 1, T = 1 and plen = 0 (RFC 4607 s1): the SSM range of the group ID; otherwise null. */
  ssm: SsmRange | null;
  /** P = 1 with plen 1 to 64 (RFC 3306 s4): the unicast prefix; otherwise null. */
  unicastPrefix: string | null;
  /** P = 1: plen, whatever its value; otherwise null. */
  plen: number | null;
  /** R = 1, P = 1, T = 1, plen 1 to 64 (RFC 3956 s4, RFC 7371 s4.2): the RP address; otherwise null. */
  embeddedRp: string | null;
  /** With R = 1: the RIID (RFC 3956 s3); otherwise null. */
  riid: number | null;
  /** A solicited-node address: the 24 bits of the unicast or anycast address it serves, as xx:xxxx; otherwise null. */
  solicitedLow24: string | null;
  /** In ff0X::db8:0:0/96 (RFC 6676 s3). */
  documentation: boolean;
  /** IANA's name for the address, or null. */
  registered: string | null;
  /** Other addresses IANA names that map to the same MAC. */
  sameMac: Ipv6Named[];
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** A 33-33 MAC read back to its IPv6 pattern. */
export interface Ipv6Reverse<S = string> {
  /** MAC to groups. */
  direction: "reverse";
  /** IPv6. */
  family: "ipv6";
  /** How the MAC was written. */
  notation: MacNotation;
  /** The MAC in three notations. */
  mac: MacForms;
  /** The MAC's 48 bits. */
  macBits: string;
  /** The last 32 bits of every group that maps here, as 8 hex digits. */
  low32Hex: string;
  /** Every candidate's text: ff, then 88 bits not carried (X), then the 32 kept bits. */
  pattern: string;
  /** RFC 3307 s4's range for these 32 bits as a group ID. */
  groupId: GroupIdRange;
  /** IANA's Dynamic Multicast Group IDs row (RFC 10028) for a group ID of 0x80000000 or more; otherwise null. */
  dynamicRow: string | null;
  /** The SSM range an ff3x::/96 group with these 32 bits would fall in (RFC 4607 s1). */
  ssm: SsmRange;
  /** The solicited-node address with these bits (when they begin with ff), or null. */
  solicited: string | null;
  /** The addresses IANA names that end in these 32 bits. */
  candidates: Ipv6Named[];
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** Any of the four readings. */
export type MapperResult<S = string> = Ipv4Forward<S> | Ipv4Reverse<S> | Ipv6Forward<S> | Ipv6Reverse<S>; // by direction and family

/** An input the engine refuses: its message is the English, its sentence travels with it for the page. */
export class MulticastMacInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "MulticastMacInputError"; // a readable name in stack traces
  } // constructor
} // MulticastMacInputError

/**
 * A throw-ready input error carrying its sentence.
 * @param m the sentence
 * @returns the error
 */
function inputError(m: EngineText): MulticastMacInputError {
  return withEngineText(new MulticastMacInputError(m), m); // the class, the English message and the sentence
} // inputError

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/** The longest input read: an IPv6 address with an embedded IPv4 part (45 characters) and a zone index. */
export const MAX_INPUT = 80; // characters

/** 01-00-5E-00-00-00: the base of the IPv4 mapping (RFC 1112 s6.4). */
const IPV4_MAC_BASE = 0x01005e000000; // 48 bits fit a double exactly (2^48 < 2^53)

/** 33-33-00-00-00-00: the base of the IPv6 mapping (RFC 2464 s7). */
const IPV6_MAC_BASE = 0x333300000000; // likewise exact

/** The low-order 23 bits (RFC 1112 s6.4). */
const LOW23 = 0x7fffff; // 23 ones

/**
 * IANA's rows for the upper half of 01-00-5E (IANA OUI Ethernet Numbers, "IANA Multicast 48-bit MAC Addresses", last
 * updated 2026-10-13; RFC 9542 s2.1.3), as [first, last, usage] over the last three octets. Read on 2026-11-02.
 */
const IANA_UPPER: readonly [number, number, string][] = [
  [0x800000, 0x8fffff, "MPLS Multicast"], // RFC 5332
  [0x900000, 0x900000, "MPLS-TP p2p"], // RFC 7213
  [0x900001, 0x900001, "Bidirectional Forwarding Detection (BFD) on Link Aggregation Group (LAG) Interfaces"], // RFC 7130
  [0x900002, 0x900002, "AllL1MI-ISs"], // RFC 8202
  [0x900003, 0x900003, "AllL2MI-ISs"], // RFC 8202
  [0x900004, 0x9000ff, "Unassigned (small allocations)"], // unassigned
  [0x900100, 0x900100, "TRILL OAM"], // RFC 7455
  [0x900101, 0x9001ff, "Unassigned (small allocations requiring both unicast and multicast)"], // unassigned
  [0x900200, 0x900fff, "Unassigned"], // unassigned
  [0x901000, 0x9010ff, "Documentation"], // RFC 9542 s2.1.4
  [0x901100, 0xffffff, "Unassigned"], // to the end of the OUI's multicast space
]; // 11 rows, covering 80-00-00 to FF-FF-FF without a gap

/** IANA's IPv4 blocks (registry of 2026-08-20), as [first, last, id, English name, range text]. */
const IPV4_BLOCKS: readonly [number, number, Ipv4BlockId, string, string][] = [
  [0xe0000000, 0xe00000ff, "local-network-control", "Local Network Control Block", "224.0.0.0/24"], // RFC 5771 s4
  [0xe0000100, 0xe00001ff, "internetwork-control", "Internetwork Control Block", "224.0.1.0/24"], // RFC 5771 s5
  [0xe0000200, 0xe000ffff, "ad-hoc-1", "AD-HOC Block I", "224.0.2.0-224.0.255.255"], // RFC 5771 s6
  [0xe0010000, 0xe001ffff, "reserved", "Reserved", "224.1.0.0/16"], // RFC 5771 s3
  [0xe0020000, 0xe002ffff, "sdp-sap", "SDP/SAP Block", "224.2.0.0/16"], // RFC 5771 s7
  [0xe0030000, 0xe004ffff, "ad-hoc-2", "AD-HOC Block II", "224.3.0.0-224.4.255.255"], // RFC 5771 s6
  [0xe0050000, 0xe0fbffff, "reserved", "Reserved", "224.5.0.0-224.251.255.255"], // RFC 5771 s3
  [0xe0fc0000, 0xe0ffffff, "dis-transient", "DIS Transient Groups", "224.252.0.0/14"], // IANA; RFC 2365 s6.3
  [0xe1000000, 0xe7ffffff, "reserved", "Reserved", "225.0.0.0-231.255.255.255"], // RFC 5771 s3
  [0xe8000000, 0xe8ffffff, "ssm", "Source-Specific Multicast Block", "232.0.0.0/8"], // RFC 5771 s8, RFC 4607
  [0xe9000000, 0xe9fbffff, "glop", "GLOP Block", "233.0.0.0-233.251.255.255"], // RFC 5771 s9, RFC 3180
  [0xe9fc0000, 0xe9ffffff, "ad-hoc-3", "AD-HOC Block III", "233.252.0.0/14"], // RFC 5771 s9.2
  [0xea000000, 0xeaffffff, "ubm", "Unicast-Prefix-based IPv4 Multicast Addresses", "234.0.0.0/8"], // RFC 6034
  [0xeb000000, 0xeeffffff, "reserved", "Reserved", "235.0.0.0-238.255.255.255"], // RFC 5771 s3
  [0xef000000, 0xefffffff, "admin-scoped", "Administratively Scoped Block", "239.0.0.0/8"], // RFC 5771 s10, RFC 2365
]; // 15 rows, covering 224.0.0.0/4 without a gap

/** The English names of the IPv4 scopes (RFC 2365), for the API. */
const IPV4_SCOPE_NAMES: Readonly<Record<Ipv4ScopeId, string>> = {
  "link-local": "Link-local scope (224.0.0.0/24)", // RFC 2365 s6.3
  global: "Global scope (224.0.1.0-238.255.255.255)", // RFC 2365 s8
  local: "IPv4 Local Scope (239.255.0.0/16)", // RFC 2365 s6.1
  "local-expansion": "Reserved for expansion of the IPv4 Local Scope (239.253.0.0/16, 239.254.0.0/16)", // RFC 2365 s6.1.1
  organisation: "IPv4 Organization Local Scope (239.192.0.0/14)", // RFC 2365 s6.2
  "organisation-expansion": "Unassigned, for expansion of the Organization Local Scope (239.0.0.0/10, 239.64.0.0/10, 239.128.0.0/10)", // RFC 2365 s6.2.1
  "admin-other": "Administratively scoped, no scope defined by RFC 2365", // RFC 2365 s4
}; // by id

/** The IPv6 scope ids and English names by nibble (RFC 4291 s2.7 as updated by RFC 7346 s2). */
const IPV6_SCOPES: readonly [Ipv6ScopeId, string][] = [
  ["reserved", "Reserved"], // 0
  ["interface-local", "Interface-Local scope"], // 1
  ["link-local", "Link-Local scope"], // 2
  ["realm-local", "Realm-Local scope"], // 3 (RFC 7346)
  ["admin-local", "Admin-Local scope"], // 4
  ["site-local", "Site-Local scope"], // 5
  ["unassigned", "Unassigned"], // 6
  ["unassigned", "Unassigned"], // 7
  ["organisation-local", "Organization-Local scope"], // 8
  ["unassigned", "Unassigned"], // 9
  ["unassigned", "Unassigned"], // A
  ["unassigned", "Unassigned"], // B
  ["unassigned", "Unassigned"], // C
  ["unassigned", "Unassigned"], // D
  ["global", "Global scope"], // E
  ["reserved", "Reserved"], // F
]; // 16 entries, one per nibble

/** Four decimal octets, one to three digits each. Anchored, bounded: linear. */
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/; // dotted quad (declared before the tables below, which use it)

/** Colon notation: six pairs of hex digits. */
const MAC_COLON = /^[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}$/; // 01:00:5e:01:01:01
/** Hyphen notation: six pairs of hex digits. */
const MAC_HYPHEN = /^[0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2}){5}$/; // 01-00-5E-01-01-01
/** Dot notation: three groups of four hex digits. */
const MAC_DOT = /^[0-9A-Fa-f]{4}(?:\.[0-9A-Fa-f]{4}){2}$/; // 0100.5e01.0101

/** Three to seven short groups split by ":" or "-": a mistyped MAC (an IPv6 address without "::" has eight groups). */
const MAC_LIKE = /^[0-9A-Za-z]{1,2}(?:[:-][0-9A-Za-z]{1,2}){2,6}$/; // e.g. 01:00:5e:01:01 or 01:00:5e:01:01:0g

/** A zone index: letters, digits, ".", "_" or "-", 1 to 32 of them. */
const ZONE_RE = /^[A-Za-z0-9._-]{1,32}$/; // e.g. eth0, 2, en0

// ----------------------------------------------------------------------------
// IANA's names, unpacked once
// ----------------------------------------------------------------------------

/** One IPv4 row: an inclusive range of groups and its name. */
interface V4Row {
  /** First group, as an unsigned 32-bit number. */
  from: number;
  /** Last group. */
  to: number;
  /** The table it came from. */
  table: Ipv4Table;
  /** IANA's name. */
  name: string;
}

/** One IPv6 row: the fixed first 96 bits (X = any scope) and a range of last 32 bits. */
interface V6Row {
  /** 24 hex digits, lower case, with X in the scope nibble for the variable-scope table. */
  upper: string;
  /** First low 32 bits. */
  from: number;
  /** Last low 32 bits. */
  to: number;
  /** The table it came from. */
  table: "node" | "link" | "site" | "var";
  /** IANA's name. */
  name: string;
}

/** The IPv4 rows, unpacked from IPV4_ROWS. */
const V4_ROWS: readonly V4Row[] = IPV4_ROWS.split("\n").map((line) => {
  const [a, b, table, name] = line.split("|"); // first|last|table|name
  return { from: dotted(a) as number, to: dotted(b) as number, table: table as Ipv4Table, name }; // the row (the generator wrote valid quads)
}); // the rows

/** The relative addresses: offset -> name. */
const V4_RELATIVE: ReadonlyMap<number, string> = new Map(IPV4_RELATIVE.split("\n").map((line) => {
  const [o, name] = line.split("|"); // offset|name
  return [Number(o), name] as [number, string]; // the entry
})); // the map

/** The IPv6 rows, unpacked from IPV6_ROWS. */
const V6_ROWS: readonly V6Row[] = IPV6_ROWS.split("\n").map((line) => {
  const [upper, from, to, table, name] = line.split("|"); // upper96|lowFirst|lowLast|table|name
  return { upper, from: parseInt(from, 16), to: parseInt(to, 16), table: table as V6Row["table"], name }; // the row
}); // the rows

/** IANA's Dynamic Multicast Group IDs rows (RFC 10028), as [first, last, name]. */
const V6_DYNAMIC: readonly [number, number, string][] = IPV6_DYNAMIC.split("\n").map((line) => {
  const [a, b, name] = line.split("|"); // first|last|name
  return [parseInt(a, 16), parseInt(b, 16), name] as [number, number, string]; // the row
}); // the rows

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------

/**
 * A dotted quad as an unsigned 32-bit number, or null when it is not one (no leading zeros, each octet 0 to 255).
 * @param s the text
 * @returns the number, or null
 */
function dotted(s: string): number | null {
  const m = IPV4_RE.exec(s); // four octets
  if (!m) return null; // not a quad
  let n = 0; // the value
  for (let i = 1; i <= 4; i++) { // each octet
    if (m[i].length > 1 && m[i][0] === "0") return null; // a leading zero: refused (some systems read it as octal)
    const o = Number(m[i]); // its value
    if (o > 255) return null; // out of range
    n = n * 256 + o; // shifted in (multiplication keeps it unsigned)
  } // octets
  return n; // the address
} // dotted

/**
 * An unsigned 32-bit number as a dotted quad.
 * @param n the number
 * @returns the text
 */
function quad(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); // four octets
} // quad

/**
 * A number as binary text of a fixed width.
 * @param n the number (at most 48 bits)
 * @param width how many digits
 * @returns the bits
 */
function bin(n: number, width: number): string {
  return n.toString(2).padStart(width, "0"); // left-padded
} // bin

/**
 * A number as hex text of a fixed width, lower case.
 * @param n the number (at most 48 bits)
 * @param width how many digits
 * @returns the hex
 */
function hex(n: number, width: number): string {
  return n.toString(16).padStart(width, "0"); // left-padded
} // hex

/**
 * A 48-bit MAC in the three notations.
 * @param mac the address as a number
 * @returns colon (lower), hyphen (upper) and dot (lower) forms
 */
export function macForms(mac: number): MacForms {
  const h = hex(mac, 12); // twelve hex digits
  const pairs = [0, 2, 4, 6, 8, 10].map((i) => h.slice(i, i + 2)); // six octets
  return { colon: pairs.join(":"), hyphen: pairs.join("-").toUpperCase(), dot: [h.slice(0, 4), h.slice(4, 8), h.slice(8, 12)].join(".") }; // three notations
} // macForms

// ----------------------------------------------------------------------------
// IPv4: blocks, scopes, names
// ----------------------------------------------------------------------------

/**
 * The IANA block of an IPv4 group.
 * @param n the group (224.0.0.0/4)
 * @returns the block row
 */
function v4Block(n: number): (typeof IPV4_BLOCKS)[number] {
  return IPV4_BLOCKS.find(([a, b]) => n >= a && n <= b) as (typeof IPV4_BLOCKS)[number]; // the table covers 224.0.0.0/4 without a gap
} // v4Block

/**
 * RFC 2365's scope of an IPv4 group.
 * @param n the group
 * @returns the scope id
 */
function v4Scope(n: number): Ipv4ScopeId {
  if (n <= 0xe00000ff) return "link-local"; // 224.0.0.0/24 (s6.3)
  if (n < 0xef000000) return "global"; // 224.0.1.0 to 238.255.255.255 (s8)
  const second = (n >>> 16) & 255; // 239.<second>.x.x
  if (second === 255) return "local"; // 239.255.0.0/16 (s6.1)
  if (second === 253 || second === 254) return "local-expansion"; // 239.253.0.0/16, 239.254.0.0/16 (s6.1.1)
  if (second >= 192 && second <= 195) return "organisation"; // 239.192.0.0/14 (s6.2)
  if (second < 192) return "organisation-expansion"; // 239.0.0.0/10, 239.64.0.0/10, 239.128.0.0/10 (s6.2.1)
  return "admin-other"; // 239.196.0.0 to 239.252.255.255 (s4)
} // v4Scope

/**
 * The relative offset of a group in the top /24 of a scope (RFC 2365 s9), or null.
 * @param n the group
 * @returns the scope and offset, or null
 */
function v4Relative(n: number): { scope: "local" | "organisation"; offset: number } | null {
  if (n >= 0xefffff00) return { scope: "local", offset: 0xefffffff - n }; // 239.255.255.0/24: counted down from 239.255.255.255
  if (n >= 0xefc3ff00 && n <= 0xefc3ffff) return { scope: "organisation", offset: 0xefc3ffff - n }; // 239.195.255.0/24: down from 239.195.255.255
  return null; // not a relative address
} // v4Relative

/**
 * Describe one IPv4 group.
 * @param n the group
 * @returns what the registries say
 */
function v4Group(n: number): Ipv4Group {
  const [, , block] = v4Block(n); // its block
  const row = V4_ROWS.find((r) => n >= r.from && n <= r.to); // a named row
  let registered: string | null = row ? row.name : null; // IANA's name
  let table: Ipv4Table | null = row ? row.table : null; // its table
  const rel = v4Relative(n); // a relative address?
  if (!row && rel && V4_RELATIVE.has(rel.offset)) { // named by offset
    registered = V4_RELATIVE.get(rel.offset) as string; // the name
    table = rel.scope === "local" ? "relative-local" : "relative-organisation"; // the scope it is relative to
  } // relative
  return { group: quad(n), block, scope: v4Scope(n), registered, table }; // the description
} // v4Group

/**
 * The 32 groups that share an IPv4 MAC: 1110, every value of the five lost bits, the 23 kept bits.
 * @param kept the low-order 23 bits
 * @returns the groups in numeric order
 */
function v4Sharing(kept: number): number[] {
  const out: number[] = []; // the groups
  for (let lost = 0; lost < 32; lost++) out.push((0xe0000000 + lost * 0x800000 + kept) >>> 0); // 1110 | lost << 23 | kept, unsigned
  return out; // already in numeric order: lost is the most significant varying part
} // v4Sharing

/** The sentence that names RFC 4541's position on MAC-keyed and IP-keyed tables (both directions, IPv4). */
const v4SnoopingNote = (): EngineText => say("note.v4.snooping", 'A switch that keeps its multicast table by MAC address cannot tell these 32 groups apart, and one that keeps it by IP address can: IGMP snooping switches "may maintain forwarding tables based on either MAC addresses or IP addresses", and IP is preferred "because the mapping between IP multicast addresses and link-layer multicast addresses is ambiguous" (RFC 4541, section 2.1.2). Its questionnaire asks the same of 224.1.2.3 and 239.129.2.3, which share a MAC (section 4).'); // the brief's teaching point

/** The sentence about the hosts on the segment (RFC 1112 s7.2 and s7.3). */
const v4HostNote = (): EngineText => say("note.v4.host", 'A host that joins one of them can receive frames for the others: a network interface "may deliver up packets destined to more addresses" than it joined, and the IP layer discards datagrams for groups the host does not belong to "without generating any error report or log entry" (RFC 1112, sections 7.2 and 7.3).'); // why hosts cope

/**
 * The block's note for a forward reading.
 * @param n the group
 * @param g its description
 * @returns the sentences, in order
 */
function v4BlockNotes(n: number, g: Ipv4Group): EngineText[] {
  const out: EngineText[] = []; // in order
  switch (g.block) { // one note per block
    case "local-network-control": out.push(say("note.block.localControl", 'Local Network Control Block (224.0.0.0/24): IANA says multicast routers "should not forward any multicast datagram with destination addresses in this range, regardless of its TTL", and snooping switches must forward packets to these addresses "on all ports" unless they are IGMP (RFC 4541, section 2.1.2).')); break; // never routed, always flooded
    case "internetwork-control": out.push(say("note.block.internetwork", 'Internetwork Control Block (224.0.1.0/24): protocol control traffic that "MAY be forwarded through the Internet" (RFC 5771, section 5).')); break; // routable control
    case "ad-hoc-1": case "ad-hoc-2": out.push(say("note.block.adhoc", 'AD-HOC block: addresses IANA assigns to applications that fit neither control block; they "MAY be globally routed" (RFC 5771, section 6). The registry names each assignment; this tool names the block.')); break; // named by block only
    case "ad-hoc-3": // AD-HOC Block III, with the documentation /24
      if (g.table === "test") out.push(say("note.block.testNet", 'MCAST-TEST-NET (233.252.0.0/24) is "for use in documentation and example code", and its addresses "MUST NOT appear on the public Internet" (RFC 5771, section 9.2; RFC 6676, section 2).')); // documentation
      else out.push(say("note.block.adhoc", 'AD-HOC block: addresses IANA assigns to applications that fit neither control block; they "MAY be globally routed" (RFC 5771, section 6). The registry names each assignment; this tool names the block.')); // named by block only
      break; // done
    case "reserved": out.push(say("note.block.reserved", "IANA lists this range as RESERVED (RFC 5771, section 3).")); break; // reserved
    case "sdp-sap": out.push(say("note.block.sdp", 'SDP/SAP Block (224.2.0.0/16): addresses "explicitly for use by SDP/SAP" that "MUST NOT be used for other purposes" (RFC 5771, section 7).')); break; // session announcements
    case "dis-transient": out.push(say("note.block.dis", "DIS Transient Groups (224.252.0.0/14), as IANA's registry lists them (RFC 2365, section 6.3).")); break; // DIS
    case "ssm": out.push(say("note.block.ssm", 'Source-Specific Multicast Block (232.0.0.0/8): a receiver subscribes to a channel (S,G), one source and this group (RFC 4607, section 1); IANA reserves 232.0.0.1 to 232.0.0.255 for its own allocation and leaves the rest to "local host allocation".')); break; // SSM
    case "glop": { // GLOP
      const as = (n >>> 8) & 0xffff; // the middle two octets (RFC 3180 s3)
      out.push(say("note.block.glop", `GLOP Block (RFC 3180, section 3): 233.X.Y.0/24 belongs to the autonomous system whose 16-bit number is 256 x X + Y, so this group is in the /24 of AS ${as}.`, { as: String(as) })); // the AS
      if (as >= 64496 && as <= 64511) out.push(say("note.block.glopDoc", "AS 64496 to 64511 are reserved for documentation, so their GLOP prefixes, 233.251.240.0/24 to 233.251.255.0/24, are for examples (RFC 6676, section 2.2).")); // documentation ASes
      break; // done
    } // glop
    case "ubm": { // unicast-prefix-based
      const prefix = `${quad((n * 256) >>> 0)}/24`; // shifted left by 8 bits (RFC 6034 s3)
      out.push(say("note.block.ubm", `Unicast-prefix-based (RFC 6034, section 3): shifting the group left by 8 bits gives ${prefix}, inside the unicast space of the organisation that may use this group.`, { prefix })); // the prefix
      break; // done
    } // ubm
    case "admin-scoped": { // 239.0.0.0/8
      out.push(say("note.block.admin", 'Administratively Scoped Block (239.0.0.0/8): "for local use within a domain" (RFC 5771, section 10); packets to these groups "do not cross configured administrative boundaries", and the addresses "are not required to be unique across administrative boundaries" (RFC 2365, section 3).')); // what admin scoping is
      if (g.scope === "local") out.push(say("note.scope.local", 'IPv4 Local Scope (239.255.0.0/16): "the minimal enclosing scope" (RFC 2365, section 6.1).')); // local
      if (g.scope === "local-expansion") out.push(say("note.scope.localExpansion", '239.253.0.0/16 and 239.254.0.0/16 are kept for the Local Scope to grow into and "should not be utilized until the 239.255.0.0/16 space is no longer sufficient" (RFC 2365, section 6.1.1).')); // expansion
      if (g.scope === "organisation") out.push(say("note.scope.organisation", 'IPv4 Organization Local Scope (239.192.0.0/14): "the space from which an organization should allocate sub-ranges when defining scopes for private use" (RFC 2365, section 6.2).')); // organisation
      if (g.scope === "organisation-expansion") out.push(say("note.scope.organisationExpansion", '239.0.0.0/10, 239.64.0.0/10 and 239.128.0.0/10 "are unassigned and available for expansion" of the Organization Local Scope and "should be left unassigned until the 239.192.0.0/14 space is no longer sufficient" (RFC 2365, section 6.2.1).')); // expansion
      if (g.scope === "admin-other") out.push(say("note.scope.adminOther", "RFC 2365 names no scope for this part of 239.0.0.0/8; it is administratively scoped like the rest of the block (section 4).")); // the rest
      const rel = v4Relative(n); // a relative address?
      if (rel) out.push(rel.scope === "local" // which scope it counts from
        ? say("note.relative.local", `Relative address ${rel.offset} of the Local Scope: the top /24 of every scope "is reserved for relative assignments", counted down from its highest address, 239.255.255.255 (RFC 2365, section 9).`, { offset: String(rel.offset) }) // the first choice; the second follows
        : say("note.relative.organisation", `Relative address ${rel.offset} of the Organization Local Scope: the top /24 of every scope "is reserved for relative assignments", counted down from its highest address, 239.195.255.255 (RFC 2365, section 9).`, { offset: String(rel.offset) })); // the offset
      break; // done
    } // admin
  } // blocks
  return out; // the notes
} // v4BlockNotes

/**
 * Map an IPv4 group to its MAC.
 * @param n the group (224.0.0.0/4)
 * @returns the reading
 */
function v4Forward(n: number): Ipv4Forward<EngineText> {
  const kept = n & LOW23; // the low-order 23 bits (RFC 1112 s6.4)
  const mac = IPV4_MAC_BASE + kept; // into 01-00-5E-00-00-00
  const g = v4Group(n); // the registries
  const [, , , blockName, blockRange] = v4Block(n); // the block's English and range
  const bits = bin(n, 32); // the group's 32 bits
  const sharing = v4Sharing(kept).map(v4Group); // the 32 groups on this MAC
  const lnc = kept >= 1 && kept <= 0xff && n > 0xe00000ff ? sharing[0] : undefined; // 224.0.0.1 to 224.0.0.255 among the other 31 (224.0.0.0 is never a destination: RFC 1112 s4)
  const warnings: EngineText[] = []; // in order
  if (n === 0xe0000000) warnings.push(say("warn.v4.base", '224.0.0.0 "is guaranteed not to be assigned to any group" (RFC 1112, section 4).')); // the base address
  if (n === 0xe8000000) warnings.push(say("warn.v4.ssmZero", '232.0.0.0 "is reserved, and it must not be used as a destination address" (RFC 4607, section 4.3).')); // SSM's null value
  if (lnc) warnings.push(say("warn.v4.sharesLocalControl", `This MAC is also the mapping of ${lnc.group}, in the Local Network Control Block, which snooping switches must forward on all ports (RFC 4541, section 2.1.2). RFC 4541's questionnaire asks whether a switch forwards frames to 01:00:5E:00:00:01 to 01:00:5E:00:00:FF on all ports (section 4); one that does floods this group with it.`, { group: lnc.group })); // flooded with a control group
  const notes: EngineText[] = [say("note.v4.mapping", 'RFC 1112 maps a group "by placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00 (hex)" (section 6.4). Every group begins with 1110 (section 4), so the five bits after those four never reach the MAC.')]; // the rule
  notes.push(...v4BlockNotes(n, g)); // the block and scope
  if (g.block === "ssm" && ((n >>> 8) & 0x7fff) === 0) notes.push(say("note.v4.ssmLinkLayer", 'RFC 4607 warns that "SSM destinations in 232.0.0.0/24 and 232.128.0.0/24 use the same link-layer addresses as the reserved IP multicast group range 224.0.0.0/24" (section 9).')); // 232.0.0.0/24 and 232.128.0.0/24
  notes.push(say("note.v4.collision", 'Because "there are 28 significant bits in an IP host group address, more than one host group address may map to the same Ethernet multicast address" (RFC 1112, section 6.4): 2^5 = 32 groups share each MAC.')); // the collision
  notes.push(v4SnoopingNote(), v4HostNote()); // switches and hosts
  const rel = g.block === "admin-scoped" ? v4Relative(n) : null; // a relative address of a scope
  return { // the reading
    direction: "forward", // group to MAC
    family: "ipv4", // IPv4
    group: g.group, // dotted quad
    groupHex: hex(n, 8).toUpperCase(), // 8 hex digits
    bits: { prefix: bits.slice(0, 4), lost: bits.slice(4, 9), kept: bits.slice(9) }, // 4 + 5 + 23
    keptHex: hex(kept, 6).toUpperCase(), // the MAC's last three octets
    mac: macForms(mac), // three notations
    macBits: bin(mac, 48), // 48 bits
    block: g.block, // the block id
    blockName, // its English
    blockRange, // its range
    scope: g.scope, // the scope id
    scopeName: IPV4_SCOPE_NAMES[g.scope], // its English
    registered: g.registered, // IANA's name
    table: g.table, // the table that named it
    glopAs: g.block === "glop" ? (n >>> 8) & 0xffff : null, // RFC 3180
    ubmPrefix: g.block === "ubm" ? `${quad((n * 256) >>> 0)}/24` : null, // RFC 6034
    relativeOffset: rel ? rel.offset : null, // RFC 2365 s9
    sharing, // the 32 groups
    sharesLocalControl: !!lnc, // a control group among them
    warnings, // warnings
    notes, // notes
  }; // the reading
} // v4Forward

/**
 * Read an 01-00-5E MAC (25th bit zero) back to its 32 groups.
 * @param mac the address
 * @param notation how it was written
 * @returns the reading
 */
function v4Reverse(mac: number, notation: MacNotation): Ipv4Reverse<EngineText> {
  const kept = mac % 0x1000000 & LOW23; // the last three octets, top bit known to be 0
  const candidates = v4Sharing(kept).map(v4Group); // the 32 groups
  const warnings: EngineText[] = []; // in order
  if (kept >= 1 && kept <= 0xff) warnings.push(say("warn.v4r.localControl", `One of these groups, ${quad(0xe0000000 + kept)}, is in the Local Network Control Block, which snooping switches must forward on all ports (RFC 4541, section 2.1.2). RFC 4541's questionnaire asks whether a switch forwards frames to 01:00:5E:00:00:01 to 01:00:5E:00:00:FF on all ports (section 4); one that does floods the other 31 groups with it.`, { group: quad(0xe0000000 + kept) })); // flooded by MAC
  const kb = bin(kept, 23); // the kept bits
  return { // the reading
    direction: "reverse", // MAC to groups
    family: "ipv4", // IPv4
    notation, // as typed
    mac: macForms(mac), // three notations
    macBits: bin(mac, 48), // 48 bits
    kept: kb, // 23 bits
    keptHex: hex(kept, 6).toUpperCase(), // 6 hex digits
    pattern: `1110?????${kb}`, // 4 + 5 unknown + 23
    candidates, // the 32 groups
    warnings, // warnings
    notes: [ // the notes, in order
      say("note.v4r.mapping", "The top bit of the fourth octet is 0, so this is the IPv4 mapping: IANA gives 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF to IPv4 multicast (RFC 9542, section 2.1.3). Its last 23 bits are the group's low-order 23 bits (RFC 1112, section 6.4); the five bits after 1110 are not carried, so any of these 32 groups could be the one."), // the rule
      v4SnoopingNote(), // switches
      v4HostNote(), // hosts
    ], // notes
  }; // the reading
} // v4Reverse

// ----------------------------------------------------------------------------
// IPv6: parsing, classification, names
// ----------------------------------------------------------------------------

/**
 * Parse IPv6 text (RFC 4291 s2.2: groups of up to four hex digits, "::" at most once for one or more zero groups, an
 * optional dotted IPv4 tail) into its 32 hex digits, or null when it is not an address.
 * @param s the text, already trimmed and without a zone
 * @returns 32 lower-case hex digits, or null
 */
function parseIpv6(s: string): string | null {
  if (!/^[0-9A-Fa-f:.]{2,45}$/.test(s)) return null; // only address characters, bounded
  let body = s; // the text the groups are read from
  let tail: number | null = null; // an embedded IPv4 value
  const lastColon = s.lastIndexOf(":"); // where the last group starts
  if (lastColon < 0) return null; // no colon: not IPv6
  if (s.slice(lastColon + 1).includes(".")) { // a dotted IPv4 tail
    tail = dotted(s.slice(lastColon + 1)); // its value
    if (tail === null) return null; // not a quad
    body = `${s.slice(0, lastColon + 1)}0:0`; // two placeholder groups
  } // tail
  if (body.includes(":::")) return null; // three colons in a row
  const first = body.indexOf("::"); // the compression
  if (first >= 0 && body.indexOf("::", first + 1) >= 0) return null; // "::" twice
  let groups: string[]; // eight groups
  if (first >= 0) { // compressed
    const left = body.slice(0, first); // before ::
    const right = body.slice(first + 2); // after ::
    const l = left === "" ? [] : left.split(":"); // groups before
    const r = right === "" ? [] : right.split(":"); // groups after
    if (l.length + r.length > 7) return null; // "::" stands for one group at least
    groups = [...l, ...Array<string>(8 - l.length - r.length).fill("0"), ...r]; // expanded
  } else { // not compressed
    groups = body.split(":"); // as written
    if (groups.length !== 8) return null; // exactly eight
  } // groups
  if (!groups.every((g) => /^[0-9A-Fa-f]{1,4}$/.test(g))) return null; // one to four hex digits each
  let out = groups.map((g) => g.toLowerCase().padStart(4, "0")).join(""); // 32 hex digits
  if (tail !== null) out = out.slice(0, 24) + hex(tail, 8); // the IPv4 tail as the last 32 bits
  return out; // the address
} // parseIpv6

/**
 * RFC 5952's canonical text of an address given as 32 hex digits: leading zeros suppressed, the longest run of two or
 * more zero groups (the first on a tie) as "::", lower case.
 * @param h32 32 hex digits
 * @returns the text
 */
export function canonicalIpv6(h32: string): string {
  const groups = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => h32.slice(i * 4, i * 4 + 4).replace(/^0{1,3}/, "")); // leading zeros out (s4.1)
  let bestAt = -1; // start of the longest zero run
  let bestLen = 0; // its length
  for (let i = 0; i < 8;) { // scan
    if (groups[i] !== "0") { i++; continue; } // not zero
    let j = i; // run end
    while (j < 8 && groups[j] === "0") j++; // extend
    if (j - i > bestLen) { bestAt = i; bestLen = j - i; } // longer only: the first wins a tie (s4.2.3)
    i = j; // past the run
  } // scanned
  if (bestLen < 2) return groups.join(":"); // one zero group is not compressed (s4.2.2)
  return `${groups.slice(0, bestAt).join(":")}::${groups.slice(bestAt + bestLen).join(":")}`; // compressed (s4.2.1)
} // canonicalIpv6

/**
 * A 32 hex-digit address in its exploded text.
 * @param h32 32 hex digits
 * @returns eight groups of four
 */
function explode(h32: string): string {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => h32.slice(i * 4, i * 4 + 4)).join(":"); // xxxx:xxxx:...
} // explode

/**
 * RFC 3307 s4's range for a group ID (the last 32 bits).
 * @param low the 32 bits
 * @returns the range
 */
function groupIdRange(low: number): GroupIdRange {
  if (low === 0) return "zero"; // no group ID
  if (low <= 0x3fffffff) return "permanent-address"; // s4.1
  if (low <= 0x7fffffff) return "permanent-group-id"; // s4.2
  return "dynamic"; // s4.3
} // groupIdRange

/**
 * IANA's Dynamic Multicast Group IDs row (RFC 10028) for a group ID, or null below 0x80000000.
 * @param low the 32 bits
 * @returns the row's name, or null
 */
function dynamicRow(low: number): string | null {
  const row = V6_DYNAMIC.find(([a, b]) => low >= a && low <= b); // the row
  return row ? row[2] : null; // its name
} // dynamicRow

/**
 * RFC 4607's range for an SSM group ID (s1, s4.3).
 * @param low the 32 bits
 * @returns the range
 */
function ssmRange(low: number): SsmRange {
  if (low <= 0x3fffffff) return "invalid"; // "invalid IPv6 SSM addresses"
  if (low === 0x40000000) return "reserved"; // ff3x::4000:0000, the null value
  if (low <= 0x7fffffff) return "iana"; // reserved for IANA allocation
  return "dynamic"; // dynamic allocation by hosts
} // ssmRange

/**
 * Whether a row's fixed upper 96 bits match an address's.
 * @param pattern 24 hex digits with X for any scope
 * @param upper the address's 24 hex digits
 * @returns true when they match
 */
function matchUpper(pattern: string, upper: string): boolean {
  for (let i = 0; i < 24; i++) if (pattern[i] !== "X" && pattern[i] !== upper[i]) return false; // digit by digit
  return true; // every digit matched
} // matchUpper

/**
 * The named addresses that end in given 32 bits (rows spanning every 32-bit value are left out: they would name
 * every MAC).
 * @param low the 32 bits
 * @returns the addresses, in registry order
 */
function v6Named(low: number): Ipv6Named[] {
  return V6_ROWS.filter((r) => low >= r.from && low <= r.to && !(r.from === 0 && r.to === 0xffffffff)).map((r) => { // rows covering these bits, then each as an address
    const anyScope = r.upper[3] === "X"; // a variable-scope row
    const text = canonicalIpv6(r.upper.replace("X", "0") + hex(low, 8)); // the address with these 32 bits
    return { address: anyScope ? `ff0X${text.slice(4)}` : text, name: r.name, table: r.table }; // ff0X for any scope
  }); // the rows
} // v6Named

/** The sentence on IPv6 overlap (RFC 4541 s3, RFC 3307 s2). */
const v6CollisionNote = (): EngineText => say("note.v6.collision", 'Every IPv6 multicast address with the same last 32 bits maps to this MAC: 2^(112 - 32) for each flags and scope value, "more than 1.2e24" (RFC 4541, section 3), and 2^88 in all. RFC 3307 keeps group IDs within 32 bits so that they "will generate unique link-layer addresses within a given multicast scope" (section 2); the same group ID in another scope, such as ff02::101 and ff05::101, shares the MAC.'); // the overlap

/** The sentence on RFC 4541's preference for IPv6 address tables. */
const v6SnoopingNote = (): EngineText => say("note.v6.snooping", 'Because of that overlap, RFC 4541 recommends that "IPv6 address based forwarding is preferred to MAC address based forwarding" in MLD snooping switches (section 3).'); // MLD snooping

/**
 * The note for a group ID's range.
 * @param low the 32 bits
 * @returns the sentence, or null for a group ID of 0
 */
function groupIdNote(low: number): EngineText | null {
  const r = groupIdRange(low); // the range
  if (r === "permanent-address") return say("note.v6.gid.permanent", "The last 32 bits, the group ID, are in 0x00000001 to 0x3FFFFFFF, the range IANA assigns to permanent addresses, which have T = 0 and P = 0 (RFC 3307, section 4.1)."); // s4.1
  if (r === "permanent-group-id") return say("note.v6.gid.service", 'The last 32 bits, the group ID, are in 0x40000000 to 0x7FFFFFFF, for permanent group IDs that name a service "regardless of the upper 96 bits of the multicast address" (RFC 3307, section 4.2).'); // s4.2
  if (r === "dynamic") { // s4.3 and RFC 10028
    const row = dynamicRow(low) as string; // the registry row (the table covers 0x80000000 to 0xFFFFFFFF)
    return say("note.v6.gid.dynamic", `The last 32 bits, the group ID, are in 0x80000000 to 0xFFFFFFFF, for dynamic allocation (RFC 3307, section 4.3); IANA's Dynamic Multicast Group IDs registry (RFC 10028) lists this value under "${row}".`, { row }); // the row
  } // dynamic
  return null; // group ID 0: the reserved-address warning says it
} // groupIdNote

/**
 * Map an IPv6 group to its MAC.
 * @param h32 the address as 32 hex digits (ff...)
 * @param zone the zone index, or null
 * @returns the reading
 */
function v6Forward(h32: string, zone: string | null): Ipv6Forward<EngineText> {
  const ff1 = parseInt(h32[2], 16); // the flags nibble
  const scopeNibble = parseInt(h32[3], 16); // the scope nibble
  const flags = { bits: bin(ff1, 4), x: (ff1 & 8) !== 0, r: (ff1 & 4) !== 0, p: (ff1 & 2) !== 0, t: (ff1 & 1) !== 0 }; // X R P T, separate bits (RFC 7371 s3)
  const [scopeId, scopeName] = IPV6_SCOPES[scopeNibble]; // RFC 4291, RFC 7346
  const low = parseInt(h32.slice(24), 16); // the last 32 bits
  const mac = IPV6_MAC_BASE + low; // 33-33 and the last four octets (RFC 2464 s7)
  const ff2 = parseInt(h32[4], 16); // bits 17 to 20 (RFC 7371 s2)
  const riidNibble = parseInt(h32[5], 16); // bits 21 to 24: RIID with R = 1 (RFC 3956 s3)
  const plenValue = parseInt(h32.slice(6, 8), 16); // plen (RFC 3306 s4)
  const prefixHex = h32.slice(8, 24); // the 64-bit network prefix field
  const upper96 = h32.slice(0, 24); // the first 96 bits
  const text = canonicalIpv6(h32); // RFC 5952
  const warnings: EngineText[] = []; // in order
  const notes: EngineText[] = [say("note.v6.mapping", 'RFC 2464 sends a packet for an IPv6 multicast address to "the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets" of the address (section 7): the first 96 bits never reach the MAC.')]; // the rule
  if (zone !== null) notes.push(say("note.v6.zone", `The zone index "%${zone}" is set aside: zone identifiers "have purely local meaning within the node in which they are defined" (RFC 9844, section 1; the form is RFC 4007's, section 11), so the group and its MAC are the same without it.`, { zone })); // a zone index
  // ---- Flags (RFC 4291 s2.7; RFC 3306; RFC 3956; RFC 7371) ----
  notes.push(flags.t // the T flag
    ? say("note.v6.t1", 'T = 1: a non-permanently-assigned ("transient" or "dynamically" assigned) multicast address (RFC 4291, section 2.7).') // the first choice; the second follows
    : say("note.v6.t0", 'T = 0: a permanently-assigned ("well-known") multicast address, assigned by IANA (RFC 4291, section 2.7).')); // T
  if (flags.x) notes.push(say("note.v6.x", 'The highest flag bit (X) is set: RFC 7371 keeps it "for future assignment" (section 4.1.1) and requires that "Implementations MUST treat flag bits as separate bits" (section 3).')); // X
  if (flags.p && !flags.t) warnings.push(say("warn.v6.pWithoutT", 'P = 1 with T = 0: "If P = 1, T MUST be set to 1" (RFC 3306, section 4).')); // P needs T
  if (flags.r && !(flags.p && flags.t)) warnings.push(say("warn.v6.rWithoutPT", 'R = 1 without both P and T: an embedded-RP address "MUST have the P-bit and T-bit both set to 1" (RFC 3956, section 4, as updated by RFC 7371, section 4.2.3), so no RP is read from it.')); // R needs P and T
  // ---- Scope (RFC 4291 s2.7; RFC 7346; RFC 4541 s3) ----
  if (scopeNibble === 0) warnings.push(say("warn.v6.scope0", 'Scope 0 is reserved: "Nodes must not originate a packet to a multicast address whose scop field contains the reserved value 0; if such a packet is received, it must be silently dropped" (RFC 4291, section 2.7).')); // scope 0
  if (scopeNibble === 1) notes.push(say("note.v6.scope1", 'Interface-Local scope "spans only a single interface on a node and is useful only for loopback transmission of multicast" (RFC 4291, section 2.7).')); // scope 1
  if (ff1 === 0 && scopeNibble <= 1) notes.push(say("note.v6.notOnLink", 'Addresses in ff00::/15 "should never appear in packets on the link", and no MLD message is sent for them (RFC 4541, section 3).')); // ff00::/15
  if (scopeNibble === 15) notes.push(say("note.v6.scopeF", 'Scope F is reserved: nodes "should not originate" packets to it, and such a packet "must be treated the same as packets destined to a global (scop E) multicast address" (RFC 4291, section 2.7).')); // scope F
  if (scopeId === "unassigned") notes.push(say("note.v6.scopeUnassigned", 'An unassigned scope: these "are available for administrators to define additional multicast regions" (RFC 4291, section 2.7).')); // 6, 7, 9 to D
  // ---- What the address is ----
  const reservedAddress = ff1 === 0 && h32.slice(4) === "0".repeat(28); // ff0X::
  if (reservedAddress) warnings.push(say("warn.v6.reservedAddress", 'ff00:: to ff0f:: "are reserved and shall never be assigned to any multicast group" (RFC 4291, section 2.7.1).')); // reserved
  if (h32 === "ff020000000000000000000000000001") notes.push(say("note.v6.allNodes", 'ff02::1 is the link-local all-nodes address: no MLD message is ever sent for it, so snooping switches should forward it "on all ports" (RFC 4541, section 3).')); // flooded
  const documentation = ff1 === 0 && h32.slice(4, 24) === "00000000000000000db8"; // ff0X::db8:0:0/96
  if (documentation) notes.push(say("note.v6.documentation", 'ff0X::db8:0:0/96 is "allocated for documentation purposes", with T = 0 (RFC 6676, section 3).')); // documentation
  const solicited = upper96 === "ff0200000000000000000001" && h32.slice(24, 26) === "ff"; // ff02::1:ff00:0/104
  const solicitedLow24 = solicited ? `${h32.slice(26, 28)}:${h32.slice(28, 32)}` : null; // xx:xxxx
  if (solicitedLow24) notes.push(say("note.v6.solicited", `A solicited-node address, formed by "taking the low-order 24 bits of an address (unicast or anycast)" (RFC 4291, section 2.7.1): every unicast or anycast address ending in ${solicitedLow24} shares it, and so does its MAC.`, { low24: solicitedLow24 })); // solicited-node
  // ---- P = 1: unicast-prefix-based, SSM, embedded RP (RFC 3306, RFC 4607, RFC 3956, RFC 7371) ----
  let ssm: SsmRange | null = null; // not SSM
  let unicastPrefix: string | null = null; // no prefix
  let embeddedRp: string | null = null; // no RP
  if (flags.p) { // the unicast-prefix-based format
    if (ff2 !== 0) warnings.push(say("warn.v6.ff2", 'Bits 17 to 20 (ff2) are not zero: they "MUST each be sent as zero and MUST be ignored on receipt" (RFC 7371, section 4.1.1).')); // ff2
    if (!flags.r && riidNibble !== 0) warnings.push(say("warn.v6.rsvd", 'With R = 0, the four bits before plen "MUST be sent as zero and MUST be ignored on receipt" (RFC 3956, section 3).')); // reserved bits
    if (flags.t && plenValue === 0) { // SSM (RFC 4607 s1: P = 1, T = 1, plen = 0)
      ssm = ssmRange(low); // its group ID's range
      if (ssm === "invalid") warnings.push(say("warn.v6.ssmInvalid", 'An SSM address whose last 32 bits are 0x00000000 to 0x3FFFFFFF: RFC 4607 calls ff3x::0000:0000 to ff3x::3fff:ffff "invalid IPv6 SSM addresses", and "a router or host MAY choose to drop" packets sent to them (section 1).')); // invalid
      if (ssm === "reserved") warnings.push(say("warn.v6.ssmReserved", 'ff3x::4000:0000 "is also reserved", kept as an invalid SSM destination that can serve as a null value (RFC 4607, section 4.3).')); // null value
      if (ssm === "iana") notes.push(say("note.v6.ssmIana", "An SSM address (P = 1, T = 1, plen = 0: RFC 4607, section 1) in ff3x::4000:0001 to ff3x::7fff:ffff, the range reserved for IANA allocation (section 4.3).")); // IANA
      if (ssm === "dynamic") notes.push(say("note.v6.ssmDynamic", "An SSM address (P = 1, T = 1, plen = 0: RFC 4607, section 1) in ff3x::8000:0000 to ff3x::ffff:ffff, the range for dynamic allocation by hosts (section 1).")); // dynamic
      if (prefixHex !== "0".repeat(16)) notes.push(say("note.v6.ssmPrefix", 'Its network prefix field is not zero: RFC 4607 asks that SSM addresses be allocated within ff3x::/96, while "a system should treat all of FF3x::/32 as SSM addresses" (section 1).')); // outside ff3x::/96
    } // SSM
    if (plenValue > 64) warnings.push(say("warn.v6.plen", `plen is ${plenValue}, more than 64: "plen" higher than 64 "MUST NOT be used, as that would overlap with the high-order bits of multicast group-id" (RFC 3956, section 4), and the network prefix field holds 64 bits (RFC 3306, section 4).`, { plen: String(plenValue) })); // too long
    if (plenValue >= 1 && plenValue <= 64) { // a unicast prefix
      const masked = (BigInt(`0x${prefixHex}`) >> BigInt(64 - plenValue)) << BigInt(64 - plenValue); // the first plen bits of the field
      const prefixH32 = masked.toString(16).padStart(16, "0") + "0".repeat(16); // as a 128-bit address
      unicastPrefix = `${canonicalIpv6(prefixH32)}/${plenValue}`; // the prefix
      notes.push(say("note.v6.prefix", `Unicast-prefix-based (P = 1, RFC 3306, section 4): plen and the network prefix field give ${unicastPrefix}, the unicast prefix of the network that owns the group.`, { prefix: unicastPrefix })); // the prefix
      if (flags.r && flags.t) { // embedded RP (RFC 3956 s4 as updated by RFC 7371 s4.2.3)
        const rpH32 = masked.toString(16).padStart(16, "0") + "0".repeat(15) + h32[5]; // the prefix, zeros, and RIID in the last 4 bits
        embeddedRp = canonicalIpv6(rpH32); // the RP
        notes.push(say("note.v6.rp", `Embedded RP (R = 1, RFC 3956, section 4, as updated by RFC 7371): copying the first plen bits of the network prefix and putting the RIID in the last 4 bits gives the Rendezvous Point ${embeddedRp}.`, { rp: embeddedRp })); // the RP
        if (riidNibble === 0) warnings.push(say("warn.v6.riid0", 'The RIID is 0, which "must not be used, as using it would cause ambiguity with the Subnet-Router Anycast Address" (RFC 3956, section 6.3).')); // RIID 0
        const first16 = parseInt(rpH32.slice(0, 4), 16); // the RP's first 16 bits
        if (first16 === 0 || (first16 & 0xffc0) === 0xfe80 || (first16 & 0xff00) === 0xff00) warnings.push(say("warn.v6.rpExcluded", `The RP this gives, ${embeddedRp}, falls in a range routers must refuse: "At least fe80::/10, ::/16, and ff00::/8 MUST be excluded" (RFC 3956, section 4).`, { rp: embeddedRp })); // an invalid RP
      } // RP
    } // prefix
  } // P = 1
  // ---- IANA's names ----
  const own = ff1 === 0 ? V6_ROWS.find((r) => matchUpper(r.upper, upper96) && low >= r.from && low <= r.to && !(r.from === 0 && r.to === 0xffffffff)) : undefined; // IANA's rows are flags-0 addresses
  const gid = groupIdNote(low); // the group ID's range
  if (gid) notes.push(gid); // when there is a group ID
  notes.push(v6CollisionNote(), v6SnoopingNote()); // overlap and switches
  const sameMac = v6Named(low).filter((x) => !(own && x.name === own.name && x.table === own.table)); // the others on this MAC
  return { // the reading
    direction: "forward", // group to MAC
    family: "ipv6", // IPv6
    group: text, // canonical
    exploded: explode(h32), // eight groups of four
    zone, // as typed, or null
    flags, // X R P T
    scope: h32[3], // the nibble
    scopeId, // its id
    scopeName, // its English
    lostHex: upper96, // the first 96 bits
    low32Hex: h32.slice(24), // the last 32
    mac: macForms(mac), // three notations
    macBits: bin(mac, 48), // 48 bits
    groupId: groupIdRange(low), // RFC 3307
    dynamicRow: low >= 0x80000000 ? dynamicRow(low) : null, // RFC 10028
    ssm, // RFC 4607
    unicastPrefix, // RFC 3306
    plen: flags.p ? plenValue : null, // with P = 1
    embeddedRp, // RFC 3956
    riid: flags.r ? riidNibble : null, // with R = 1
    solicitedLow24, // RFC 4291 s2.7.1
    documentation, // RFC 6676
    registered: own ? own.name : null, // IANA's name
    sameMac, // the other named addresses
    warnings, // warnings
    notes, // notes
  }; // the reading
} // v6Forward

/**
 * Read a 33-33 MAC back to its IPv6 pattern.
 * @param mac the address
 * @param notation how it was written
 * @returns the reading
 */
function v6Reverse(mac: number, notation: MacNotation): Ipv6Reverse<EngineText> {
  const low = mac % 0x100000000; // the last four octets
  const lowHex = hex(low, 8); // 8 hex digits
  const candidates = v6Named(low); // IANA's names
  const solicited = low >= 0xff000000 ? canonicalIpv6(`ff0200000000000000000001${lowHex}`) : null; // ff02::1:ffxx:xxxx
  const lowText = `${lowHex.slice(0, 4)}:${lowHex.slice(4)}`; // the 32 bits as two hex groups
  const low24 = `${lowHex.slice(2, 4)}:${lowHex.slice(4)}`; // the 24 bits after ff, as a unicast address ends
  const notes: EngineText[] = [say("note.v6r.mapping", `The first two octets are 33-33, the IPv6 mapping (RFC 2464, section 7; RFC 9542, section 2.3.1): the last four octets are the group's last 32 bits, and the first 96 bits are not carried, so any IPv6 multicast address ending in ${lowText} could be the one.`, { low: lowText })]; // the rule
  if (low === 1) notes.push(say("note.v6r.allNodes", 'ff02::1, the link-local all-nodes address, maps here: no MLD message is ever sent for it, so snooping switches should forward it "on all ports" (RFC 4541, section 3).')); // all nodes
  if (solicited) notes.push(say("note.v6r.solicited", `A solicited-node address maps here: ${solicited}, formed from "the low-order 24 bits of an address (unicast or anycast)" (RFC 4291, section 2.7.1), so every unicast or anycast address ending in ${low24} has this solicited-node address, and it maps to this MAC.`, { group: solicited, low24 })); // solicited-node
  const gid = groupIdNote(low); // the group ID's range
  if (gid) notes.push(gid); // when there is one
  if (candidates.length === 0) notes.push(say("note.v6r.none", "IANA's IPv6 multicast registry names no address that ends in these 32 bits.")); // nothing named
  notes.push(v6CollisionNote(), v6SnoopingNote()); // overlap and switches
  return { // the reading
    direction: "reverse", // MAC to groups
    family: "ipv6", // IPv6
    notation, // as typed
    mac: macForms(mac), // three notations
    macBits: bin(mac, 48), // 48 bits
    low32Hex: lowHex, // 32 bits
    pattern: `ffXX:XXXX:XXXX:XXXX:XXXX:XXXX:${lowText}`, // ff, 88 unknown bits, 32 kept
    groupId: groupIdRange(low), // RFC 3307
    dynamicRow: low >= 0x80000000 ? dynamicRow(low) : null, // RFC 10028
    ssm: ssmRange(low), // RFC 4607, for an ff3x::/96 group
    solicited, // ff02::1:ffxx:xxxx, or null
    candidates, // IANA's names
    warnings: [], // none in this direction
    notes, // notes
  }; // the reading
} // v6Reverse

// ----------------------------------------------------------------------------
// MAC refusals
// ----------------------------------------------------------------------------

/**
 * Refuse a MAC that is not an IP multicast mapping, saying why.
 * @param mac the address
 * @returns the error to throw
 */
function macRefusal(mac: number): MulticastMacInputError {
  const forms = macForms(mac); // for the message
  const first = Math.floor(mac / 0x10000000000); // the first octet
  if (first % 2 === 0) return inputError(say("err.mac.unicast", `${forms.hyphen} is a unicast MAC address: its group bit, the lowest bit of the first octet, is 0 (RFC 9542, section 2.1.1). Neither RFC 1112's mapping nor RFC 2464's gives a unicast address.`, { mac: forms.hyphen })); // M bit 0
  if (mac === 0xffffffffffff) return inputError(say("err.mac.broadcast", "FF-FF-FF-FF-FF-FF is the broadcast address, not the mapping of an IP multicast group: IPv4 groups map into 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF (RFC 1112) and IPv6 groups into 33-33-00-00-00-00 to 33-33-FF-FF-FF-FF (RFC 2464).")); // broadcast
  if (Math.floor(mac / 0x1000000) === 0x01005e) { // the upper half of 01-00-5E
    const tail = mac % 0x1000000; // the last three octets
    const [a, b, usage] = IANA_UPPER.find(([x, y]) => tail >= x && tail <= y) as [number, number, string]; // IANA's row (the table has no gap)
    const fa = `01-00-5E-${hex(a, 6).toUpperCase().match(/../g)?.join("-")}`; // its first address
    const fb = `01-00-5E-${hex(b, 6).toUpperCase().match(/../g)?.join("-")}`; // its last
    return a === b // one address or a range
      ? inputError(say("err.mac.ianaUpperOne", `${forms.hyphen} has the 25th bit set (the top bit of the fourth octet), so it is not an IPv4 mapping: RFC 1112 puts a group's low-order 23 bits after 01-00-5E with that bit 0, and IANA gives only 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF to IPv4 multicast (RFC 9542, section 2.1.3). IANA's registry lists ${fa} as "${usage}".`, { mac: forms.hyphen, first: fa, usage })) // the first choice; the second follows
      : inputError(say("err.mac.ianaUpper", `${forms.hyphen} has the 25th bit set (the top bit of the fourth octet), so it is not an IPv4 mapping: RFC 1112 puts a group's low-order 23 bits after 01-00-5E with that bit 0, and IANA gives only 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF to IPv4 multicast (RFC 9542, section 2.1.3). IANA's registry lists ${fa} to ${fb} as "${usage}".`, { mac: forms.hyphen, first: fa, last: fb, usage })); // the row
  } // upper half
  return inputError(say("err.mac.otherGroup", `${forms.hyphen} is a group MAC address outside the two IP multicast mappings, 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF for IPv4 (RFC 1112) and 33-33-00-00-00-00 to 33-33-FF-FF-FF-FF for IPv6 (RFC 2464), so no IP group maps to it.`, { mac: forms.hyphen })); // another group address
} // macRefusal

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The page's entry: read the input and map it, sentences as EngineTexts.
 * @param input an IPv4 or IPv6 group, or a MAC in colon, hyphen or dot notation
 * @returns the reading
 */
export function runLocalisable(input: string): MapperResult<EngineText> {
  const raw = typeof input === "string" ? input : ""; // anything else counts as blank
  if (raw.length > MAX_INPUT * 4) throw inputError(say("err.tooLong", `The input is longer than this tool reads (${MAX_INPUT} characters).`, { max: String(MAX_INPUT) })); // bounded before anything else
  const s = raw.trim(); // surrounding white space is ignored
  if (s === "") throw inputError(say("err.empty", "Enter an IPv4 or IPv6 multicast group, or a multicast MAC address.")); // nothing typed
  if (s.length > MAX_INPUT) throw inputError(say("err.tooLong", `The input is longer than this tool reads (${MAX_INPUT} characters).`, { max: String(MAX_INPUT) })); // too long
  if (/[\r\n]/.test(s)) throw inputError(say("err.lines", "Enter one address, on one line.")); // several lines
  const malformed = () => inputError(say("err.malformed", `"${s}" is not an IPv4 group, an IPv6 group or a MAC address in a notation this tool reads. Write a group as 239.1.1.1 or ff02::1, and a MAC as 01:00:5e:01:01:01, 01-00-5E-01-01-01 or 0100.5e01.0101.`, { value: s })); // the general refusal
  // ---- A MAC address in one of the three notations. ----
  const notation: MacNotation | null = MAC_COLON.test(s) ? "colon" : MAC_HYPHEN.test(s) ? "hyphen" : MAC_DOT.test(s) ? "dot" : null; // which, if any
  if (notation) { // reverse
    const mac = parseInt(s.replace(/[:.-]/g, ""), 16); // 48 bits fit a double exactly
    if (Math.floor(mac / 0x1000000) === 0x01005e && mac % 0x1000000 < 0x800000) return v4Reverse(mac, notation); // 01-00-5E, 25th bit 0
    if (Math.floor(mac / 0x100000000) === 0x3333) return v6Reverse(mac, notation); // 33-33
    throw macRefusal(mac); // anything else, with its reason
  } // MAC
  if (MAC_LIKE.test(s)) throw malformed(); // shaped like a MAC with a typo (never valid IPv6: 3 to 7 groups, no "::")
  if (s.includes("/")) throw inputError(say("err.prefix", `"${s}" has a prefix length: enter one group address, without "/".`, { value: s })); // a prefix
  // ---- An IPv6 address, possibly with a zone index. ----
  if (s.includes(":") || s.includes("%")) { // IPv6
    const pct = s.indexOf("%"); // a zone index
    const addr = pct >= 0 ? s.slice(0, pct) : s; // the address part
    const zone = pct >= 0 ? s.slice(pct + 1) : null; // the zone part
    if (zone !== null && !ZONE_RE.test(zone)) throw inputError(say("err.zone", `"${s}" has an empty or unreadable zone index after "%": write it with letters, digits, ".", "_" or "-", or leave it out.`, { value: s })); // a bad zone
    const h32 = parseIpv6(addr); // the address
    if (!h32) throw inputError(say("err.v6.malformed", `"${addr}" is not an IPv6 address: write eight groups of up to four hex digits separated by colons, with "::" at most once for a run of zero groups, for example ff02::1.`, { value: addr })); // malformed
    if (!h32.startsWith("ff")) throw inputError(say("err.v6.notMulticast", `${canonicalIpv6(h32)} is not an IPv6 multicast address: those begin with the octet ff, binary 11111111 (RFC 4291, section 2.7).`, { value: canonicalIpv6(h32) })); // unicast or other
    return v6Forward(h32, zone); // forward
  } // IPv6
  // ---- An IPv4 address. ----
  const m = IPV4_RE.exec(s); // four octets
  if (!m) throw malformed(); // nothing this tool reads
  if ([1, 2, 3, 4].some((i) => Number(m[i]) > 255)) throw inputError(say("err.v4.octet", `"${s}" is not an IPv4 address: each of the four numbers must be from 0 to 255.`, { value: s })); // out of range
  const n = dotted(s); // the value (null only for a leading zero now)
  if (n === null) throw inputError(say("err.v4.leadingZero", `"${s}" has a number with a leading zero, which some systems read as octal: write each number without leading zeros, for example 239.1.1.1.`, { value: s })); // leading zero
  if (n < 0xe0000000) throw inputError(say("err.v4.unicast", `${s} is not a multicast group: IPv4 groups begin with the bits 1110, from 224.0.0.0 to 239.255.255.255 (RFC 1112, section 4), and this address is below that range.`, { value: s })); // below 224
  if (n >= 0xf0000000) throw inputError(say("err.v4.classE", `${s} begins with the bits 1111, which RFC 1112 reserves "for future addressing modes" (section 4): it is not a multicast group.`, { value: s })); // 240 and above
  return v4Forward(n); // forward
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param input the text
 * @returns the reading as the API returns it
 */
export function run(input: string): MapperResult {
  return plainText(runLocalisable(input)) as MapperResult; // sentences as their English
} // run

/**
 * The API's entry: the request body or ?input= as text (the same as run()).
 * @param input the text
 * @returns the reading
 */
export function runApi(input: string): MapperResult {
  return run(input); // a plain-text tool: the body is the address
} // runApi
