// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vlan-tag-and-trunk-calculator/compute.ts
// ----------------------------------------------------------------------------
// 802.1Q TAG DECODER AND TRUNK VLAN CALCULATOR - the pure, deterministic
// engine (08/11/2026, written for chapter 2.3 (VLAN) of the open course "LAN
// Switch Operations and Maintenance" and the Learn article
// vlans-and-8021q-trunking).
//
// TWO QUESTIONS, TWO MODES.
//   tag     Hex octets of a tag, or of a frame's start (destination and source
//           MAC, then tags): each tag's TPID, PCP, DEI and VID with the bits
//           laid out, stacked tags (802.1ad), and the EtherType or length that
//           follows, named from IANA's list.
//   trunk   The trunk port lines of the two ends of a link, each in its own
//           vendor's syntax: the VLANs each end carries, the native (untagged)
//           VLAN of each, and, VLAN by VLAN and in both directions, whether a
//           frame arrives in the same VLAN, in another one, is dropped, or
//           depends on behaviour the vendor pages read do not state.
//
// THE RULES, each from a document read on 2026-11-08 (sources in index.ts):
//   - The tag (IEEE P802.1ad/D2.4, the public IEEE 802.1 draft of 2004 that
//     carries the 802.1Q text as amended, clause 9): a two-octet TPID, then a
//     two-octet TCI: PCP in bits 8 to 6 of the first octet, then one bit (CFI
//     in a C-TAG of that edition, DE in an S-TAG), then the 12-bit VID. Table
//     9-1: C-TAG 81-00. Table 9-2: VID 0 is the null VLAN ID (priority only),
//     1 the default PVID, FFF reserved for implementation use and never
//     transmitted. Table 6-5: how a PCP decodes under 8P0D, 7P1D, 6P2D and
//     5P3D. Table G-2: the traffic type of each priority (1 Background is
//     lower than 0 Best Effort). The current IEEE YANG (ieee802-dot1q-types,
//     revision 2023-10-26): c-vlan "using the 81-00 EtherType", s-vlan "using
//     the 88-A8 EtherType originally introduced in 802.1ad, and incorporated
//     into 802.1Q (2011)", vlanid 1..4094; ieee802-dot1q-bridge: the bit is
//     now the Drop Eligible Indicator (DEI), used only when use-dei is True.
//     HPE Aruba's AOS-CX QoS guide gives the same eight traffic types today.
//   - EtherType or length (RFC 9542 s3, BCP 141): EtherTypes are 0x0600 and
//     above, a length is below 0x05DD, and 0x8870 is the LLC encapsulation
//     EtherType; names from IANA's Ethertypes list (ethertypes.ts); 0x9100 is
//     read as a tag only because Juniper's bridging page names it as the TPID
//     Junos switches support for Q-in-Q (it is in neither IANA's list nor
//     802.1Q).
//   - MAC addresses (RFC 9542 s2.1.1, s2.1.4): the M bit makes a group
//     address, the X bit a local one; 00-00-5E-00-53-00 to -FF and
//     01-00-5E-90-10-00 to -FF are for documentation.
//   - Trunks, per vendor (each line's rule is cited where it is applied):
//     Cisco IOS XE 17.18 (VLAN configuration guide and command reference) and
//     the 17.17 command reference; Juniper Junos ELS (bridging and VLANs; the
//     Ethernet Switching User Guide of 2026-09-23); HPE Aruba AOS-CX 10.16
//     (vlan trunk allowed, vlan trunk native, vlan trunk native tag); MikroTik
//     RouterOS 7.24 (bridge VLAN filtering); Extreme Switch Engine 33.7.1 and
//     Fabric Engine 9.4 (command references and user guide); Arista EOS
//     4.37.0F (the User Manual's VLAN chapter); Huawei VRP, S5700 and S6700
//     V200R025C00 (the command reference's VLAN commands and the Ethernet
//     Switching configuration guide's Table 4-2). The Arista, Huawei, Cisco
//     17.18 command reference and AOS-CX native pages were read in a browser
//     on 2026-11-08 (their sites refuse automated reads). The IEEE MIB
//     (IEEE8021-Q-BRIDGE-MIB): the PVID is "the VLAN-ID assigned to untagged
//     frames or Priority-tagged frames received on this port".
//   - A native VLAN left out of its own end's allowed list: not carried on
//     AOS-CX (HPE Aruba's own example removes native VLAN 20 from the allowed
//     list, "Only allow VLAN 10 on the trunk"), on Arista EOS (Arista's own
//     example output prints "Trunking Native Mode VLAN: 1 (inactive)" for an
//     allowed list of 6-10: an example, not a sentence, and the tool says so),
//     on Huawei VRP (a trunk forwards the default VLAN's frames "only after it
//     is added to the default VLAN") and on Junos (the interface must be a
//     member of its native VLAN); not confirmed on Cisco IOS XE and Fabric
//     Engine, whose pages read do not say.
//
// PAGE LANGUAGE. Every sentence the engine writes is an EngineText
// (../engine-text.ts): runLocalisable() returns the reading with them in place
// (pack keys tools.vlan-tag-and-trunk-calculator.engine.<id>); run() and
// runApi() return plainText() of the same reading for the API and the golden
// vectors. Numbers and VLAN lists are fields; the page prints them itself.
//
// Pure: no clock, no network, no randomness. Parsing uses anchored patterns
// with bounded repetition only (linear, ReDoS-safe); every input is bounded
// (MAX_TEXT characters, MAX_LINES lines, MAX_LINE characters a line,
// MAX_OCTETS octets, MAX_TAGS tags).
// ============================================================================

import { say, resolvePlurals, plainText, withEngineText, EngineText, type EngineList } from "../engine-text"; // sentences with ids, lists, and the API's English projection
import { ETHERTYPES } from "./ethertypes"; // IANA's Ethertypes list, packed

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

/** The two modes. */
export type Mode = "tag" | "trunk"; // what is asked

/** Where the tag mode's octets start: decided by the engine, at a TPID, or at a destination MAC. */
export type TagStart = "auto" | "tpid" | "mac"; // the start choice

/** The tag-mode request. */
export interface TagRequest {
  /** Selects this mode. */
  mode: "tag";
  /** The octets as hexadecimal text: spaces, colons, hyphens, dots or commas between them, 0x prefixes allowed. */
  input: string;
  /** Where they start; "auto" when absent. */
  start?: TagStart | string;
}

/** The vendors the trunk mode reads, by stable id. */
export type VendorId = "cisco-ios-xe" | "juniper-junos" | "aruba-aos-cx" | "mikrotik-routeros" | "extreme-switch-engine" | "extreme-fabric-engine" | "arista-eos" | "huawei-vrp"; // eight syntaxes, the course's eight vendors

/** The vendor ids in the order the page lists them. */
export const VENDORS: readonly VendorId[] = Object.freeze(["cisco-ios-xe", "juniper-junos", "aruba-aos-cx", "mikrotik-routeros", "extreme-switch-engine", "extreme-fabric-engine", "arista-eos", "huawei-vrp"] as const); // the page's order (the two added on 2026-11-08 last, so earlier links keep their meaning)

/** The vendor names as the vendors write them (never translated). */
export const VENDOR_NAMES: Readonly<Record<VendorId, string>> = Object.freeze({
  "cisco-ios-xe": "Cisco IOS XE", // Catalyst 9300, 17.18
  "juniper-junos": "Juniper Junos (ELS)", // EX switches, Enhanced Layer 2 Software
  "aruba-aos-cx": "HPE Aruba AOS-CX", // CX 6300/6400, 10.16
  "mikrotik-routeros": "MikroTik RouterOS", // 7.24 manual
  "extreme-switch-engine": "Extreme Switch Engine", // 33.7.1
  "extreme-fabric-engine": "Extreme Fabric Engine", // 9.4
  "arista-eos": "Arista EOS", // User Manual 4.37.0F
  "huawei-vrp": "Huawei VRP", // S5700 and S6700, V200R025C00
}); // names

/** One end of the trunk: its vendor and its trunk port lines. */
export interface TrunkEndRequest {
  /** The vendor id (VENDORS). */
  vendor: VendorId | string;
  /** The trunk port's lines in that vendor's syntax, one command per line, or a bare list such as 10,20,30-40. */
  config: string;
}

/** The trunk-mode request: the two ends. */
export interface TrunkRequest {
  /** Selects this mode. */
  mode: "trunk";
  /** End A. */
  a: TrunkEndRequest;
  /** End B. */
  b: TrunkEndRequest;
}

/** Any request. */
export type VlanRequest = TagRequest | TrunkRequest; // the API body names its mode

/** One MAC address of a frame's start. */
export interface MacReading {
  /** Hyphens, upper case, as RFC 9542 writes addresses: 00-00-5E-00-53-01. */
  hex: string;
  /** Colons, lower case: 00:00:5e:00:53:01. */
  colon: string;
  /** The M bit (0x01 of the first octet): a group address (multicast or broadcast). */
  group: boolean;
  /** The X bit (0x02 of the first octet): a local address. */
  local: boolean;
  /** In one of RFC 9542's documentation ranges. */
  documentation: boolean;
}

/** The three tag types the decoder reads. */
export type TagKind = "c-tag" | "s-tag" | "junos-9100"; // 0x8100, 0x88A8, 0x9100

/** How one PCP value decodes under one of the four PCP selections (P802.1ad/D2.4 Table 6-5). */
export interface PcpDecoding {
  /** The selection: 8P0D (the default), 7P1D, 6P2D or 5P3D. */
  scheme: "8P0D" | "7P1D" | "6P2D" | "5P3D";
  /** The priority it decodes to. */
  priority: number;
  /** Whether it decodes as drop eligible. */
  dropEligible: boolean;
}

/** What a VID means. */
export type VidMeaning = "null" | "default-pvid" | "reserved" | "vlan"; // 0, 1, 4095, anything else

/** One tag. S: string for the API, EngineText for the page. */
export interface TagReading<S = string> {
  /** Its place in the stack, from 1 (the outermost). */
  index: number;
  /** The octet its TPID starts at, from 0. */
  offset: number;
  /** The TPID, as 0x8100. */
  tpid: string;
  /** The tag type. */
  kind: TagKind;
  /** The tag type's name in a sentence. */
  name: S;
  /** The TCI, as 0xA014. */
  tci: string;
  /** The 32 bits of TPID and TCI, as "0" and "1". */
  bits: string;
  /** The PCP, 0 to 7. */
  pcp: number;
  /** The PCP's three bits. */
  pcpBits: string;
  /** The traffic type's acronym for the PCP's priority under 8P0D (P802.1ad/D2.4 Table G-2): BK, BE, EE, CA, VI, VO, IC or NC. */
  acronym: string;
  /** The traffic type in a sentence. */
  trafficType: S;
  /** The PCP under the four PCP selections. */
  decodings: PcpDecoding[];
  /** The fourth bit of the TCI: DEI (the C-TAG's CFI in P802.1ad/D2.4), 0 or 1. */
  dei: 0 | 1;
  /** The VID, 0 to 4095. */
  vid: number;
  /** The VID as three hexadecimal digits: 014. */
  vidHex: string;
  /** The VID's twelve bits. */
  vidBits: string;
  /** What the VID means. */
  vidMeaning: VidMeaning;
  /** Notes on this tag. */
  notes: S[];
}

/** What follows the tags. */
export interface NextReading<S = string> {
  /** The two octets, as 0x0800. */
  value: string;
  /** The same as a number. */
  number: number;
  /** An EtherType (0x0600 and above), a length (below 0x05DD), or neither (0x05DD to 0x05FF). */
  kind: "ethertype" | "length" | "neither";
  /** IANA's description (or RFC 9542's, for 0x8870), or null when neither has one. */
  name: string | null;
  /** The reading in a sentence. */
  text: S;
}

/** The tag-mode reading. */
export interface TagResult<S = string> {
  /** The mode. */
  mode: "tag";
  /** Where the octets were read from. */
  start: "tpid" | "mac";
  /** Whether the engine chose the start (the request said auto). */
  startAuto: boolean;
  /** How many octets were read. */
  octets: number;
  /** The octets as lower-case hexadecimal pairs separated by spaces. */
  hex: string;
  /** The destination MAC, when the octets start at one. */
  destination: MacReading | null;
  /** The source MAC, when the octets start at a destination MAC. */
  source: MacReading | null;
  /** The tags, outermost first. */
  tags: TagReading<S>[];
  /** What follows the tags, or null when the octets end before it. */
  next: NextReading<S> | null;
  /** Octets after the EtherType or length, not decoded. */
  after: number;
  /** The reading in one sentence. */
  verdict: S;
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** A run of VLAN IDs, both ends included. */
export type Range = [number, number]; // [low, high]

/** One line of an end's configuration that the engine read, with what it did. */
export interface LineReading<S = string> {
  /** Its line number, from 1. */
  line: number;
  /** The line as typed (trimmed). */
  text: string;
  /** What it did, in a sentence. */
  effect: S;
}

/** What one end does with untagged frames that arrive. */
export type UntaggedIn = "vlan" | "dropped" | "unconfirmed"; // into a VLAN, dropped, or not stated

/** One end of the trunk as read. */
export interface EndReading<S = string> {
  /** The end: "A" or "B". */
  end: "A" | "B";
  /** The vendor id. */
  vendor: VendorId;
  /** The vendor's name. */
  vendorName: string;
  /** The VLANs this end carries, tagged or untagged. */
  allowed: Range[];
  /** How many. */
  allowedCount: number;
  /** The same as text: 10,20,30-40. */
  allowedText: string;
  /** The VLANs it sends tagged. */
  tagged: Range[];
  /** The same as text. */
  taggedText: string;
  /** The VLANs it sends untagged (usually one, its native VLAN). */
  untaggedOut: number[];
  /** What it does with an untagged arrival. */
  untaggedIn: UntaggedIn;
  /** The VLAN an untagged arrival is placed in, when untaggedIn is "vlan". */
  untaggedInVlan: number | null;
  /** The native VLAN configured (or the vendor's default), or null when the end has none. */
  native: number | null;
  /** Whether the native VLAN's handling is stated by the vendor pages read. */
  nativeConfirmed: boolean;
  /** Whether "all" on this end means "every VLAN configured on the switch" (AOS-CX) rather than 1 to 4094. */
  allConfigured: boolean;
  /** The lines read. */
  read: LineReading<S>[];
  /** The lines not read (other interface settings), by number. */
  notRead: number[];
  /** Warnings about this end. */
  warnings: S[];
  /** Notes about this end. */
  notes: S[];
}

/** What happens to a VLAN's frames in one direction. */
export type Outcome = "same" | "other" | "dropped" | "unconfirmed" | "not-sent"; // the five outcomes

/** One direction of one run of VLANs. */
export interface Direction {
  /** How the sender sends them: tagged, untagged, or null when it does not send them (or it is not stated). */
  as: "tagged" | "untagged" | null;
  /** What happens at the receiver. */
  outcome: Outcome;
  /** The VLAN they arrive in, for "other" (in a run row, "same" arrives in each VLAN itself and into is null). */
  into: number | null;
}

/** A run of VLANs with the same fate in both directions. */
export interface FateRow {
  /** The first VLAN of the run. */
  from: number;
  /** The last. */
  to: number;
  /** From end A to end B. */
  ab: Direction;
  /** From end B to end A. */
  ba: Direction;
}

/** The trunk-mode reading. */
export interface TrunkResult<S = string> {
  /** The mode. */
  mode: "trunk";
  /** End A. */
  a: EndReading<S>;
  /** End B. */
  b: EndReading<S>;
  /** VLANs that arrive in the same VLAN in both directions. */
  carried: Range[];
  /** How many. */
  carriedCount: number;
  /** As text. */
  carriedText: string;
  /** VLANs end A sends that end B drops (or does not carry back). */
  aOnly: Range[];
  /** As text. */
  aOnlyText: string;
  /** VLANs end B sends that end A drops (or does not carry back). */
  bOnly: Range[];
  /** As text. */
  bOnlyText: string;
  /** VLANs whose frames arrive in another VLAN in at least one direction. */
  crossed: Range[];
  /** As text. */
  crossedText: string;
  /** VLANs whose fate depends on behaviour the vendor pages read do not state. */
  unconfirmed: Range[];
  /** As text. */
  unconfirmedText: string;
  /** Every VLAN either end sends, in runs with the same fate. */
  rows: FateRow[];
  /** Whether the two ends place untagged frames in different VLANs. */
  nativeMismatch: boolean;
  /** The reading in one sentence. */
  verdict: S;
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** Any reading. */
export type VlanResult<S = string> = TagResult<S> | TrunkResult<S>; // by mode

/** An input the engine refuses: its message is the English, its sentence travels with it for the page. */
export class VlanInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "VlanInputError"; // a readable name in stack traces
  } // constructor
} // VlanInputError

/**
 * Throw-ready input error carrying its sentence.
 * @param m the sentence
 * @returns the error
 */
function inputError(m: EngineText): VlanInputError {
  return withEngineText(new VlanInputError(m), m); // the class, the English message, and the sentence
} // inputError

/** A value a sentence template takes: plain text, a sentence, or a list. */
type Arg = string | EngineText | EngineList; // what a {placeholder} holds

/**
 * A value as the English reads it.
 * @param a the value
 * @returns its English text
 */
function argText(a: Arg): string {
  if (typeof a === "string") return a; // plain text
  if (a instanceof EngineText) return a.text; // a sentence
  return a.items.map((i) => i.text).join(typeof a.sep === "string" ? a.sep : a.sep.text); // a list, joined as the English joins it
} // argText

/**
 * A sentence from an id, an English template with {placeholders} and its values (one id, never fragments).
 * @param id the stable id (the pack key under engine.*)
 * @param tpl the English template, with ICU-style {names}
 * @param args the values
 * @returns the sentence
 */
function sayT(id: string, tpl: string, args: Record<string, Arg>): EngineText {
  return say(id, resolvePlurals(tpl, args).replace(/\{(\w+)\}/g, (m: string, k: string) => (k in args ? argText(args[k]) : m)), args); // filled for the API, values kept for the page
} // sayT

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/** The longest text any field may hold. */
export const MAX_TEXT = 4000; // characters
/** The most lines one end's configuration may have. */
export const MAX_LINES = 64; // lines
/** The longest line of a configuration. */
export const MAX_LINE = 256; // characters
/** The most octets the tag mode reads. */
export const MAX_OCTETS = 128; // a frame's start is far shorter
/** The most tags the tag mode reads in one stack. */
export const MAX_TAGS = 8; // bounded
/** The lowest and highest VID a VLAN can have (IEEE 802.1Q YANG vlanid 1..4094). */
export const VID_MIN = 1; // VID 0 is the null VLAN ID
/** The highest. */
export const VID_MAX = 4094; // FFF is reserved

/** The three TPIDs the decoder reads as tags. */
const TPIDS: Readonly<Record<number, TagKind>> = Object.freeze({ 0x8100: "c-tag", 0x88a8: "s-tag", 0x9100: "junos-9100" }); // by value

/** The traffic types of P802.1ad/D2.4 Table G-2, by priority: [acronym, English]. */
const TRAFFIC: readonly (readonly [string, string])[] = Object.freeze([
  ["BE", "Best Effort (the default priority)"], // 0
  ["BK", "Background (1 is lower than 0)"], // 1
  ["EE", "Excellent Effort"], // 2
  ["CA", "Critical Applications"], // 3
  ["VI", "Video, under 100 ms latency and jitter"], // 4
  ["VO", "Voice, under 10 ms latency and jitter"], // 5
  ["IC", "Internetwork Control"], // 6
  ["NC", "Network Control"], // 7
]); // by priority

/** P802.1ad/D2.4 Table 6-5, by PCP: the priority and drop eligibility under 8P0D, 7P1D, 6P2D and 5P3D ("4DE" written as [4, true]). */
const PCP_DECODING: readonly (readonly (readonly [number, boolean])[])[] = Object.freeze([
  [[0, false], [0, false], [0, false], [0, false]], // PCP 0
  [[1, false], [1, false], [1, false], [0, true]], // PCP 1: 5P3D reads 0DE
  [[2, false], [2, false], [2, true], [2, true]], // PCP 2: 6P2D and 5P3D read 2DE
  [[3, false], [3, false], [2, false], [2, false]], // PCP 3: 6P2D and 5P3D read 2
  [[4, false], [4, true], [4, true], [4, true]], // PCP 4: 7P1D, 6P2D and 5P3D read 4DE
  [[5, false], [4, false], [4, false], [4, false]], // PCP 5: 7P1D, 6P2D and 5P3D read 4
  [[6, false], [6, false], [6, false], [6, false]], // PCP 6
  [[7, false], [7, false], [7, false], [7, false]], // PCP 7
]); // by PCP
/** The four selections, in the table's order. */
const SCHEMES = ["8P0D", "7P1D", "6P2D", "5P3D"] as const; // Table 6-5's rows

// ----------------------------------------------------------------------------
// Tag mode
// ----------------------------------------------------------------------------

/**
 * The octets of a hexadecimal text, strictly.
 * @param raw the text as typed
 * @returns the octets
 */
function parseHex(raw: unknown): number[] {
  const text = typeof raw === "string" ? raw : raw == null ? "" : String(raw); // the text
  if (text.trim() === "") throw inputError(say("err.tag.empty", "Enter the octets in hexadecimal: a tag (81 00 00 0a) or a frame's start, destination and source MAC first.")); // nothing typed
  if (text.length > MAX_TEXT) throw inputError(sayT("err.tag.long", "The text is {n} characters long; the decoder reads at most {max}.", { n: String(text.length), max: String(MAX_TEXT) })); // bounded
  const tokens = text.split(/[\s:.,;-]+/).filter((x) => x !== ""); // separators out
  let hex = ""; // the digits, joined
  for (const tok of tokens) { // each group
    const body = /^0x/i.test(tok) ? tok.slice(2) : tok; // a 0x prefix allowed
    const bad = /[^0-9a-fA-F]/.exec(body); // the first character that is not a hexadecimal digit
    if (bad) throw inputError(sayT("err.tag.char", "\"{c}\" is not a hexadecimal digit: write the octets with 0 to 9 and a to f, separated by spaces, colons, hyphens or dots.", { c: bad[0] })); // refused
    hex += body; // kept
  } // tokens
  if (hex === "") throw inputError(say("err.tag.empty", "Enter the octets in hexadecimal: a tag (81 00 00 0a) or a frame's start, destination and source MAC first.")); // only separators
  if (hex.length % 2 !== 0) throw inputError(sayT("err.tag.odd", "The text holds {n, plural, one {{n} hexadecimal digit} other {{n} hexadecimal digits}}, an odd number: every octet is two digits.", { n: String(hex.length) })); // half an octet
  if (hex.length / 2 > MAX_OCTETS) throw inputError(sayT("err.tag.octets", "That is {n} octets; the decoder reads at most {max}, which is far more than a frame's MACs, tags and EtherType take.", { n: String(hex.length / 2), max: String(MAX_OCTETS) })); // bounded
  const out: number[] = []; // the octets
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16)); // two digits each
  return out; // the octets
} // parseHex

/**
 * Two octets as a number.
 * @param o the octets
 * @param at the first one's index
 * @returns the 16-bit value
 */
const u16 = (o: readonly number[], at: number): number => (o[at] << 8) | o[at + 1]; // network byte order

/**
 * A 16-bit value as 0xABCD.
 * @param v the value
 * @returns the text
 */
const hex4 = (v: number): string => `0x${v.toString(16).toUpperCase().padStart(4, "0")}`; // upper case, four digits

/**
 * A value's bits.
 * @param v the value
 * @param n how many bits
 * @returns "0" and "1", most significant first
 */
const bitsOf = (v: number, n: number): string => v.toString(2).padStart(n, "0"); // padded

/**
 * One MAC address of the frame's start.
 * @param o the octets
 * @param at the first octet's index
 * @returns the reading
 */
function macAt(o: readonly number[], at: number): MacReading {
  const six = o.slice(at, at + 6); // the address
  const pairs = six.map((b) => b.toString(16).padStart(2, "0")); // two digits each
  const v = six.reduce((acc, b) => acc * 256 + b, 0); // as one number (48 bits fit a double exactly)
  const docUnicast = v >= 0x00005e005300 && v <= 0x00005e0053ff; // RFC 9542 s2.1.4: 00-00-5E-00-53-00 to -FF
  const docGroup = v >= 0x01005e901000 && v <= 0x01005e9010ff; // RFC 9542 s2.1.4: 01-00-5E-90-10-00 to -FF
  return {
    hex: pairs.join("-").toUpperCase(), // RFC 9542's form
    colon: pairs.join(":"), // colons
    group: (six[0] & 0x01) === 1, // the M bit
    local: (six[0] & 0x02) === 2, // the X bit
    documentation: docUnicast || docGroup, // a documentation address
  }; // the reading
} // macAt

/**
 * IANA's description of an EtherType: the narrowest row that holds it.
 * @param v the value
 * @returns the description, or null
 */
export function ianaEthertype(v: number): string | null {
  let best: readonly [number, number, string] | null = null; // the narrowest match so far
  for (const row of ETHERTYPES) { // every row
    if (v < row[0] || v > row[1]) continue; // not this one
    if (best === null || row[1] - row[0] < best[1] - best[0]) best = row; // narrower wins
  } // rows
  return best ? best[2] : null; // the description
} // ianaEthertype

/**
 * What follows the tags.
 * @param v the two octets as a number
 * @returns the reading
 */
function nextOf(v: number): NextReading<EngineText> {
  const value = hex4(v); // as text
  if (v <= 0x05dc) { // RFC 9542 s3: a length "must ... be less than 0x5DD"
    return { value, number: v, kind: "length", name: ianaEthertype(v), text: sayT("next.length", "{value} is a length, {n, plural, one {{n} octet} other {{n} octets}}, not an EtherType: an IEEE 802.3 frame whose data starts with LLC (DSAP, SSAP, control) (RFC 9542, section 3).", { value, n: String(v) }) }; // a length
  } // length
  if (v < 0x0600) { // between the two ranges
    return { value, number: v, kind: "neither", name: null, text: sayT("next.neither", "{value} is neither a length (below 0x05DD) nor an EtherType (0x0600 and above) (RFC 9542, section 3).", { value }) }; // neither
  } // neither
  if (v === 0x8870) { // RFC 9542 s3 names it; IANA's list does not
    return { value, number: v, kind: "ethertype", name: "LLC encapsulation EtherType", text: sayT("next.llc", "{value} is the LLC encapsulation EtherType, used in place of a length as a \"length indication\" of nonspecific length (RFC 9542, section 3).", { value }) }; // 0x8870
  } // 0x8870
  const name = ianaEthertype(v); // IANA's description
  if (name === null) return { value, number: v, kind: "ethertype", name: null, text: sayT("next.unlisted", "{value} is an EtherType that IANA's list does not name; the IEEE Registration Authority keeps the full public list (IANA, IEEE 802 Numbers).", { value }) }; // not listed
  return { value, number: v, kind: "ethertype", name, text: sayT("next.named", "{value} is the EtherType IANA's list describes as \"{name}\".", { value, name }) }; // named
} // nextOf

/**
 * The sentence naming a tag type.
 * @param kind the type
 * @returns the sentence
 */
function tagName(kind: TagKind): EngineText {
  if (kind === "c-tag") return say("tag.name.c", "C-TAG, an 802.1Q Customer VLAN tag (TPID 0x8100; IANA: \"Customer VLAN Tag Type (C-Tag, formerly called the Q-Tag)\")."); // 0x8100
  if (kind === "s-tag") return say("tag.name.s", "S-TAG, an 802.1Q Service VLAN tag, introduced by 802.1ad and incorporated into 802.1Q in 2011 (TPID 0x88A8)."); // 0x88A8
  return say("tag.name.junos", "0x9100: the TPID Juniper's bridging page says Junos switches support for Q-in-Q. It is not an IEEE 802.1Q tag type and IANA's list does not name it."); // 0x9100
} // tagName

/**
 * The tag-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function tagLocalisable(r: TagRequest): TagResult<EngineText> {
  const startRaw = r.start == null || r.start === "" ? "auto" : String(r.start); // auto when absent
  if (startRaw !== "auto" && startRaw !== "tpid" && startRaw !== "mac") throw inputError(say("err.tag.start", "Choose where the octets start: auto, tpid or mac.")); // unknown start
  const o = parseHex(r.input); // the octets
  const warnings: EngineText[] = []; // in order
  const notes: EngineText[] = []; // in order
  let start: "tpid" | "mac"; // decided below
  if (startRaw === "auto") { // the engine decides
    const first = o.length >= 2 ? u16(o, 0) : -1; // the first two octets
    if (first in TPIDS) { start = "tpid"; notes.push(sayT("note.autoTpid", "Read as a tag because the octets start with {tpid}; choose \"Destination MAC\" if they are the start of a frame.", { tpid: hex4(first) })); } // a TPID first; 09/11/2026: the quoted option is written as its label, start.mac "Destination MAC"
    else if (o.length >= 14) start = "mac"; // long enough for two MACs and a type
    else throw inputError(sayT("err.tag.short", "{n, plural, one {{n} octet that does not start} other {{n} octets that do not start}} with 0x8100, 0x88A8 or 0x9100: too short for a frame's start (6 + 6 octets of MAC, then 2 of type) and not a tag.", { n: String(o.length) })); // neither
  } else start = startRaw; // as chosen
  let at = 0; // the next octet to read
  let destination: MacReading | null = null; // filled for a frame
  let source: MacReading | null = null; // filled for a frame
  if (start === "mac") { // a frame's start
    if (o.length < 14) throw inputError(sayT("err.tag.frameShort", "A frame's start needs at least 14 octets (destination MAC, source MAC, then 2 octets of type); these are {n}.", { n: String(o.length) })); // too short
    destination = macAt(o, 0); // octets 0 to 5
    source = macAt(o, 6); // octets 6 to 11
    at = 12; // the type comes next
    if (source.group) warnings.push(say("warn.sourceGroup", "The source address has the M bit set, which makes it a group address (RFC 9542, section 2.1.1); a frame's source is normally an individual address, so check where these octets start.")); // a group source
    if (destination.documentation || source.documentation) notes.push(say("note.docMac", "These are documentation MAC addresses (RFC 9542, section 2.1.4: 00-00-5E-00-53-00 to -FF and 01-00-5E-90-10-00 to -FF).")); // documentation values
  } // frame
  const tags: TagReading<EngineText>[] = []; // outermost first
  let next: NextReading<EngineText> | null = null; // what follows
  while (at + 2 <= o.length) { // a type to read
    const t = u16(o, at); // the two octets
    const kind = TPIDS[t]; // a tag?
    if (!kind) { next = nextOf(t); at += 2; break; } // the EtherType or length
    if (tags.length >= MAX_TAGS) throw inputError(sayT("err.tag.many", "More than {max} tags in one stack: the decoder stops there.", { max: String(MAX_TAGS) })); // bounded
    if (at + 4 > o.length) throw inputError(sayT("err.tag.cut", "The tag that starts at octet {at} is cut short: a TPID is followed by two octets of TCI.", { at: String(at) })); // half a tag
    const tci = u16(o, at + 2); // the TCI
    const pcp = tci >> 13; // bits 8 to 6 of the first octet
    const dei = ((tci >> 12) & 1) as 0 | 1; // bit 5
    const vid = tci & 0x0fff; // the twelve low bits
    const tagNotes: EngineText[] = []; // this tag's notes
    let vidMeaning: VidMeaning = "vlan"; // most VIDs
    if (vid === 0) { vidMeaning = "null"; tagNotes.push(say("tag.vid0", "VID 0 is the null VLAN ID: the tag carries only priority information, no VLAN identifier (P802.1ad/D2.4, Table 9-2). A port places such a priority-tagged frame in its PVID (IEEE8021-Q-BRIDGE-MIB, ieee8021QBridgePvid), and Junos reserves VLAN ID 0 \"for tagging the priority of frames\".")); } // priority-tagged
    else if (vid === 1) { vidMeaning = "default-pvid"; tagNotes.push(say("tag.vid1", "VID 1 is the default PVID, the VLAN untagged frames are placed in on a port nobody has changed (P802.1ad/D2.4, Table 9-2; the IEEE YANG pvid default 1).")); } // VLAN 1
    else if (vid === 0xfff) { vidMeaning = "reserved"; warnings.push(sayT("warn.vid4095", "Tag {i} carries VID 4095 (FFF), which 802.1Q reserves for implementation use: it shall not be \"transmitted in a tag header\" (P802.1ad/D2.4, Table 9-2), and Junos reserves it too.", { i: String(tags.length + 1) })); } // reserved
    if (dei === 1) tagNotes.push(kind === "s-tag" // the bit is set
      ? say("tag.dei.s", "DEI is 1: in an S-TAG this bit has always been the drop eligible bit (P802.1ad/D2.4, section 9.7). A port that uses DEI marks the frame drop eligible; one that does not ignores the bit on receipt (IEEE YANG, use-dei).")
      : say("tag.dei.c", "DEI is 1. The bit is now the Drop Eligible Indicator (IEEE YANG, use-dei: a port that uses it marks the frame drop eligible, one that does not ignores it on receipt); in the C-TAG of 2004 it was the CFI, the Canonical Format Indicator (P802.1ad/D2.4, section 9.6).")); // C-TAG or 0x9100
    const [acronym, english] = TRAFFIC[pcp]; // Table G-2, under 8P0D
    tags.push({
      index: tags.length + 1, // from 1
      offset: at, // the TPID's octet
      tpid: hex4(t), // the TPID
      kind, // the type
      name: tagName(kind), // in a sentence
      tci: hex4(tci), // the TCI
      bits: bitsOf(t, 16) + bitsOf(tci, 16), // 32 bits
      pcp, // the priority code point
      pcpBits: bitsOf(pcp, 3), // its bits
      acronym, // BK, BE ...
      trafficType: say(`pcp.type.${pcp}`, english), // the traffic type
      decodings: SCHEMES.map((scheme, i) => ({ scheme, priority: PCP_DECODING[pcp][i][0], dropEligible: PCP_DECODING[pcp][i][1] })), // Table 6-5
      dei, // the bit
      vid, // the VID
      vidHex: vid.toString(16).toUpperCase().padStart(3, "0"), // three digits
      vidBits: bitsOf(vid, 12), // twelve bits
      vidMeaning, // its meaning
      notes: tagNotes, // notes
    }); // the tag
    at += 4; // past TPID and TCI
  } // the stack
  if (start === "tpid" && tags.length === 0) throw inputError(sayT("err.tag.notTag", "The octets start with {value}, which is not 0x8100, 0x88A8 or 0x9100: choose \"Destination MAC\" if they are a frame's start.", { value: o.length >= 2 ? hex4(u16(o, 0)) : "?" })); // no tag where one was asked for; 09/11/2026: the quoted option is written as its label, start.mac "Destination MAC"
  if (next === null) notes.push(say("note.endAfterTags", "The octets end after the last tag, so the EtherType that follows is not in them.")); // tag only
  const after = o.length - at; // octets not decoded
  if (next !== null && after > 0) notes.push(sayT("note.after", "{n, plural, one {{n} octet after the EtherType or length is} other {{n} octets after the EtherType or length are}} not decoded.", { n: String(after) })); // the rest
  // Stacking checks: P802.1ad/D2.4 9.7 puts a C-TAG inside an S-TAG ("the MSDU ... can contain a Customer VLAN tag").
  for (let i = 1; i < tags.length; i++) { // each inner tag
    const outer = tags[i - 1].kind; // the one outside it
    const inner = tags[i].kind; // this one
    if (outer === "c-tag" && inner === "s-tag") warnings.push(sayT("warn.order", "Tag {i} is an S-TAG inside a C-TAG: provider bridging puts the S-TAG outside and the customer's C-TAG inside (P802.1ad/D2.4, section 9.7).", { i: String(i + 1) })); // reversed
    if (outer === "c-tag" && inner === "c-tag") warnings.push(sayT("warn.cc", "Tags {o} and {i} are both C-TAGs (0x8100). 802.1ad stacks a C-TAG inside an S-TAG (0x88A8); two C-TAGs is also the shape of the double-tagging case the VLAN article describes.", { o: String(i), i: String(i + 1) })); // two C-TAGs
  } // pairs
  if (tags.some((x) => x.kind === "junos-9100")) warnings.push(say("warn.9100", "0x9100 is read with the 802.1Q TCI layout (PCP, DEI, VID) because Juniper names it beside 0x8100 and 0x88A8 as a TPID; the page names the value, not its layout.")); // vendor TPID
  if (tags.length > 0) notes.push(say("note.pcp", "The traffic type is the one P802.1ad/D2.4 Table G-2 gives for the priority the PCP decodes to under the default 8P0D selection; HPE Aruba's AOS-CX QoS guide lists the same eight today. A port set to 7P1D, 6P2D or 5P3D decodes some values differently (Table 6-5).")); // the table's source
  const verdict = tags.length === 0 // no tag
    ? sayT("verdict.untagged", "An untagged frame: no 802.1Q tag; the type field reads {value}.", { value: next ? next.value : "?" })
    : sayT("verdict.tags", "Tags: {n}; the outermost has VID {vid} and PCP {pcp}; then {next}.", { n: String(tags.length), vid: String(tags[0].vid), pcp: String(tags[0].pcp), next: next ? next.value : say("verdict.noNext", "the octets end") }); // the stack
  return {
    mode: "tag", // the mode
    start, // where it started
    startAuto: startRaw === "auto", // chosen by the engine
    octets: o.length, // how many
    hex: o.map((b) => b.toString(16).padStart(2, "0")).join(" "), // normalised
    destination, // or null
    source, // or null
    tags, // outermost first
    next, // or null
    after, // not decoded
    verdict, // one sentence
    warnings, // warnings
    notes, // notes
  }; // the reading
} // tagLocalisable

// ----------------------------------------------------------------------------
// VLAN sets (a bitmap of 4096 VIDs)
// ----------------------------------------------------------------------------

/** A set of VIDs, index 0 to 4095. */
type VidSet = Uint8Array; // 1 = in the set

/** An empty set. */
const emptySet = (): VidSet => new Uint8Array(4096); // all zero

/** Every VLAN, 1 to 4094. */
const allSet = (): VidSet => { const s = emptySet(); for (let v = VID_MIN; v <= VID_MAX; v++) s[v] = 1; return s; }; // filled

/**
 * Runs of a set.
 * @param s the set
 * @returns its runs, ascending
 */
function rangesOf(s: VidSet): Range[] {
  const out: Range[] = []; // the runs
  let lo = -1; // the open run's start
  for (let v = 0; v <= 4096; v++) { // one past the end closes the last run
    const on = v < 4096 && s[v] === 1; // in the set
    if (on && lo < 0) lo = v; // a run opens
    if (!on && lo >= 0) { out.push([lo, v - 1]); lo = -1; } // a run closes
  } // VIDs
  return out; // the runs
} // rangesOf

/**
 * Runs as text: 10,20,30-40 (the empty set is "none").
 * @param rs the runs
 * @returns the text
 */
export function rangesText(rs: readonly Range[]): string {
  if (rs.length === 0) return "none"; // nothing
  return rs.map(([a, b]) => (a === b ? String(a) : `${a}-${b}`)).join(","); // joined
} // rangesText

/**
 * How many VIDs a set holds.
 * @param s the set
 * @returns the count
 */
const countOf = (s: VidSet): number => s.reduce((n, x) => n + x, 0); // summed

// ----------------------------------------------------------------------------
// Trunk mode: shared parsing
// ----------------------------------------------------------------------------

/** What every vendor parser keeps while it reads an end. */
interface EndState {
  /** The end. */
  end: "A" | "B";
  /** The vendor. */
  vendor: VendorId;
  /** The lines read, with their effect. */
  read: LineReading<EngineText>[];
  /** The lines not read. */
  notRead: number[];
  /** Warnings. */
  warnings: EngineText[];
  /** Notes. */
  notes: EngineText[];
}

/** One end's answer from its vendor parser. */
interface EndModel {
  /** The VLANs carried, tagged or untagged. */
  allowed: VidSet;
  /** The VLANs sent untagged. */
  untaggedOut: number[];
  /** What an untagged arrival meets. */
  untaggedIn: UntaggedIn;
  /** Its VLAN, when untaggedIn is "vlan". */
  untaggedInVlan: number | null;
  /** The native VLAN, or null. */
  native: number | null;
  /** Whether the native VLAN's handling is stated by the pages read. */
  nativeConfirmed: boolean;
  /** A native VLAN whose handling is not stated (sent and received "unconfirmed"), or null. */
  nativeUnconfirmed: number | null;
  /** Whether "all" means every VLAN configured on the switch. */
  allConfigured: boolean;
}

/**
 * An error at one line of one end.
 * @param st the end's state
 * @param line the line number
 * @param m the reason
 * @returns the error
 */
function lineError(st: EndState, line: number, m: EngineText): VlanInputError {
  return inputError(sayT("err.at", "End {end}, line {line}: {reason}", { end: st.end, line: String(line), reason: m })); // located
} // lineError

/**
 * One VLAN ID, strictly, inside a vendor's range.
 * @param st the end's state
 * @param line the line number
 * @param tok the token
 * @param max the vendor's highest VID
 * @returns the VID
 */
function vidOf(st: EndState, line: number, tok: string, max: number): number {
  if (!/^\d{1,5}$/.test(tok)) throw lineError(st, line, sayT("err.vid.form", "\"{tok}\" is not a VLAN ID: VLAN IDs are whole numbers from 1 to 4094.", { tok })); // not a number
  if (tok.length > 1 && tok.startsWith("0")) throw lineError(st, line, sayT("err.vid.zero", "\"{tok}\": write VLAN IDs without leading zeros.", { tok })); // 010
  const v = Number(tok); // the number
  if (v === 0) throw lineError(st, line, say("err.vid.0", "VLAN 0 is the null VLAN ID, for priority-tagged frames only: it is never configured as a VLAN (P802.1ad/D2.4, Table 9-2).")); // VID 0
  if (v === 4095) throw lineError(st, line, say("err.vid.4095", "VLAN 4095 (FFF) is reserved for implementation use and is never configured or transmitted (P802.1ad/D2.4, Table 9-2); the IEEE YANG vlanid range is 1 to 4094.")); // VID 4095
  if (v > 4095) throw lineError(st, line, sayT("err.vid.big", "{v} is beyond the 12-bit VID: VLAN IDs run from 1 to 4094.", { v: String(v) })); // too big
  if (v > max) throw lineError(st, line, st.vendor === "extreme-fabric-engine" // a vendor range
    ? sayT("err.vid.fe", "{v}: Fabric Engine configures VLAN IDs 1 to 4059 and reserves 4060 to 4094 for internal use (Fabric Engine 9.4 User Guide, Add or Remove Ports in a VLAN).", { v: String(v) })
    : sayT("err.vid.max", "{v} is above {max}, the highest VLAN ID this syntax takes.", { v: String(v), max: String(max) }));
  return v; // the VID
} // vidOf

/**
 * A comma-and-hyphen list (10,20,30-40) into a set, strictly.
 * @param st the end's state
 * @param line the line number
 * @param text the list
 * @param max the vendor's highest VID
 * @returns the set
 */
function listOfVids(st: EndState, line: number, text: string, max: number): VidSet {
  const s = emptySet(); // the set
  for (const atom of text.split(",")) { // each atom
    if (atom === "") throw lineError(st, line, sayT("err.list.empty", "\"{text}\" has an empty item between commas.", { text })); // 10,,20
    const m = /^(\d{1,5})(?:-(\d{1,5}))?$/.exec(atom); // N or N-M
    if (!m) throw lineError(st, line, sayT("err.list.atom", "\"{atom}\" is not a VLAN ID or a range such as 30-40.", { atom })); // not an atom
    const lo = vidOf(st, line, m[1], max); // the first VID
    const hi = m[2] === undefined ? lo : vidOf(st, line, m[2], max); // the last VID
    if (hi < lo) throw lineError(st, line, sayT("err.list.order", "The range {atom} runs backwards: write the lower VLAN ID first.", { atom })); // 40-30
    for (let v = lo; v <= hi; v++) s[v] = 1; // the run
  } // atoms
  return s; // the set
} // listOfVids

/** A bare list line: digits, commas and hyphens only. */
const BARE_RE = /^\d{1,5}(?:-\d{1,5})?(?:,\d{1,5}(?:-\d{1,5})?){0,200}$/; // 10,20,30-40

/**
 * Union into a set.
 * @param into the set to grow
 * @param s the set to add
 */
const addAll = (into: VidSet, s: VidSet): void => { for (let v = 0; v < 4096; v++) if (s[v]) into[v] = 1; }; // in place

/**
 * Difference from a set.
 * @param from the set to shrink
 * @param s the set to remove
 */
const removeAll = (from: VidSet, s: VidSet): void => { for (let v = 0; v < 4096; v++) if (s[v]) from[v] = 0; }; // in place

/**
 * A set as a sentence argument.
 * @param s the set
 * @returns the text
 */
const setText = (s: VidSet): string => rangesText(rangesOf(s)); // 10,20

/**
 * Record a line the parser read.
 * @param st the end's state
 * @param line the line number
 * @param text the line
 * @param effect what it did
 */
function readLine(st: EndState, line: number, text: string, effect: EngineText): void {
  st.read.push({ line, text, effect }); // kept in order
} // readLine

/**
 * The lines of an end's configuration, bounded, with their numbers; blank lines and comments dropped.
 * @param st the end's state
 * @param config the text
 * @returns the lines
 */
function linesOf(st: EndState, config: unknown): { n: number; text: string }[] {
  const text = typeof config === "string" ? config : config == null ? "" : String(config); // the text
  if (text.trim() === "") throw inputError(sayT("err.end.empty", "End {end}: paste the trunk port's lines in {vendor} syntax, or a VLAN list such as 10,20,30-40.", { end: st.end, vendor: VENDOR_NAMES[st.vendor] })); // nothing
  if (text.length > MAX_TEXT) throw inputError(sayT("err.end.long", "End {end}: {n} characters; at most {max} are read.", { end: st.end, n: String(text.length), max: String(MAX_TEXT) })); // bounded
  const raw = text.replace(/\r/g, "").split("\n"); // the lines
  if (raw.length > MAX_LINES) throw inputError(sayT("err.end.lines", "End {end}: {n} lines; at most {max} are read. Paste only the trunk port's lines.", { end: st.end, n: String(raw.length), max: String(MAX_LINES) })); // bounded
  const out: { n: number; text: string }[] = []; // kept lines
  raw.forEach((l, i) => { // each line
    if (l.length > MAX_LINE) throw lineError(st, i + 1, sayT("err.line.long", "the line is {n} characters long; at most {max} are read.", { n: String(l.length), max: String(MAX_LINE) })); // bounded
    const t = l.trim().replace(/\s+/g, " "); // trimmed, spaces collapsed
    if (t === "" || t.startsWith("!") || t.startsWith("#")) return; // blank or a comment
    out.push({ n: i + 1, text: t }); // kept
  }); // lines
  return out; // the lines
} // linesOf

// ----------------------------------------------------------------------------
// Trunk mode: one parser per vendor
// ----------------------------------------------------------------------------

/**
 * Cisco IOS XE: switchport trunk allowed vlan and native vlan (17.17 command reference; 17.18 VLAN guide).
 * @param st the end's state
 * @param lines the lines
 * @returns the model
 */
function readCisco(st: EndState, lines: { n: number; text: string }[]): EndModel {
  const allowed = allSet(); // "The default for all VLAN lists is to include all VLANs."
  let native = 1; // "VLAN 1 is the default native VLAN ID on the port."
  let any = false; // a trunk line read
  for (const { n, text } of lines) { // each line
    const low = text.toLowerCase(); // keywords in any case
    let m: RegExpExecArray | null; // a match
    if ((m = /^switchport trunk allowed vlan (.{1,240})$/.exec(low))) { // the allowed list
      any = true; // a trunk line
      const arg = m[1]; // what follows
      if (arg === "all") { allowed.set(allSet()); readLine(st, n, text, say("cisco.all", "All VLANs, 1 to 4094 (all \"specifies all VLANs from 1 to 4094\").")); continue; } // all
      if (arg === "none") { allowed.fill(0); readLine(st, n, text, say("cisco.none", "No VLANs (none \"specifies an empty list\").")); continue; } // none
      const op = /^(add|remove|except) (.{1,230})$/.exec(arg); // an edit
      const listText = op ? op[2] : arg; // the list
      if (/\s/.test(listText)) throw lineError(st, n, say("cisco.spaces", "Cisco's guide says: \"Do not enter any spaces between comma-separated VLAN parameters or in hyphen-specified ranges.\"")); // spaces
      if (!BARE_RE.test(listText)) throw lineError(st, n, sayT("err.list.atom", "\"{atom}\" is not a VLAN ID or a range such as 30-40.", { atom: listText })); // not a list
      const s = listOfVids(st, n, listText, VID_MAX); // the set
      if (!op) { allowed.set(s); readLine(st, n, text, sayT("cisco.set", "The allowed list becomes {list}.", { list: setText(s) })); } // replaced
      else if (op[1] === "add") { addAll(allowed, s); readLine(st, n, text, sayT("cisco.add", "Adds {list} (add \"adds the defined list of VLANs to those currently set\").", { list: setText(s) })); } // added
      else if (op[1] === "remove") { removeAll(allowed, s); readLine(st, n, text, sayT("cisco.remove", "Removes {list}.", { list: setText(s) })); } // removed
      else { const all = allSet(); removeAll(all, s); allowed.set(all); readLine(st, n, text, sayT("cisco.except", "Every VLAN except {list} (except \"lists the VLANs that should be calculated by inverting the defined list\").", { list: setText(s) })); } // except
      continue; // next line
    } // allowed
    if (/^no switchport trunk allowed vlan$/.test(low)) { any = true; allowed.set(allSet()); readLine(st, n, text, say("cisco.noAllowed", "Back to the default list, all VLANs (\"The no form of the allowed vlan command resets the list to the default list\").")); continue; } // reset
    if ((m = /^switchport trunk native vlan (\d{1,5})$/.exec(low))) { any = true; native = vidOf(st, n, m[1], VID_MAX); readLine(st, n, text, sayT("cisco.native", "The native VLAN is {v}: frames of VLAN {v} leave untagged, and untagged arrivals go to VLAN {v}.", { v: String(native) })); continue; } // native
    if (/^no switchport trunk native vlan$/.test(low)) { any = true; native = 1; readLine(st, n, text, say("cisco.noNative", "The native VLAN goes back to VLAN 1, the default.")); continue; } // reset
    if (BARE_RE.test(text)) { any = true; const s = listOfVids(st, n, text, VID_MAX); allowed.set(s); readLine(st, n, text, sayT("bare.set", "Read as the allowed list typed alone: {list}.", { list: setText(s) })); continue; } // a bare list
    st.notRead.push(n); // another interface setting
  } // lines
  if (!any) throw noTrunkLine(st); // nothing to read
  const member = allowed[native] === 1; // the native VLAN in the list
  if (allowed[1] === 1) st.notes.push(say("cisco.vlan1", "Cisco IOS XE: \"VLAN 1 is the default VLAN on all trunk ports\"; it can be removed from the allowed list, and the interface \"continues to send and receive management traffic\" (17.18 VLAN guide).")); // VLAN 1
  if ([1002, 1003, 1004, 1005].some((v) => allowed[v] === 1)) st.notes.push(say("cisco.100x", "VLANs 1002 to 1005 are in this list, but on a Catalyst 9300 they are the default Token Ring and FDDI VLANs: \"reserved for Token Ring and FDDI VLANs\", and the device \"does not forward FDDI, FDDI-Net, TrCRF, or TrBRF traffic\" (17.18 VLAN guide).")); // reserved
  if (!member) st.warnings.push(sayT("cisco.nativeOut", "The native VLAN {v} is not in the allowed list. Cisco's pages read (the 17.18 command reference and VLAN guide, every sentence on the native VLAN) say the allowed list is for traffic \"in tagged format\" and the native VLAN is for \"sending and receiving untagged traffic\", but not whether a native VLAN missing from the list is carried; the tool marks VLAN {v} as not confirmed. Adding it to the allowed list removes the doubt.", { v: String(native) })); // not stated (17.18 command reference and VLAN guide, read in a browser on 2026-11-08: no sentence on it)
  return { allowed, untaggedOut: member ? [native] : [], untaggedIn: member ? "vlan" : "unconfirmed", untaggedInVlan: member ? native : null, native, nativeConfirmed: member, nativeUnconfirmed: member ? null : native, allConfigured: false }; // the model
} // readCisco

/**
 * Juniper Junos with ELS: vlan members and native-vlan-id, VLAN names resolved from "set vlans NAME vlan-id N".
 * @param st the end's state
 * @param lines the lines
 * @returns the model
 */
function readJunos(st: EndState, lines: { n: number; text: string }[]): EndModel {
  const names = new Map<string, number>(); // VLAN name -> ID
  for (const { n, text } of lines) { // names first: a configuration is not ordered
    const m = /^set vlans ([A-Za-z0-9][\w.-]{0,63}) vlan-id (\d{1,5})$/.exec(text); // set vlans USERS vlan-id 10
    if (m) { names.set(m[1].toLowerCase(), vidOf(st, n, m[2], VID_MAX)); } // a name
  } // names
  const members = emptySet(); // the logical interface's VLANs
  let native: number | null = null; // none unless configured
  let any = false; // a trunk line read
  for (const { n, text } of lines) { // each line
    let m: RegExpExecArray | null; // a match
    if ((m = /^set vlans ([A-Za-z0-9][\w.-]{0,63}) vlan-id (\d{1,5})$/.exec(text))) { readLine(st, n, text, sayT("junos.name", "VLAN {name} is VLAN ID {v}.", { name: m[1], v: m[2] })); continue; } // a name, already read
    if ((m = /^(?:set (?:.{0,120} )?)?vlan members (.{1,200}?);?$/.exec(text)) || (m = /^members (.{1,200}?);$/.exec(text))) { // vlan members X
      any = true; // a trunk line
      const body = m[1].trim(); // the value
      const items = body.startsWith("[") ? (body.endsWith("]") ? body.slice(1, -1).trim().split(" ").filter((x) => x !== "") : null) : [body]; // a list or one item
      if (items === null || items.length === 0) throw lineError(st, n, sayT("junos.form", "\"{value}\": vlan members takes one VLAN, or several between [ and ].", { value: body })); // malformed
      const s = emptySet(); // what this line adds
      for (const it of items) { // each member
        if (it.toLowerCase() === "all") throw lineError(st, n, say("junos.all", "vlan members all: the Junos pages read do not say which VLANs \"all\" stands for on a switch with ELS, so the tool does not guess; list the VLAN IDs.")); // all
        const r = /^(\d{1,5})(?:-(\d{1,5}))?$/.exec(it); // an ID or a range (members 120-130, Ethernet Switching User Guide)
        if (r) { const lo = vidOf(st, n, r[1], VID_MAX); const hi = r[2] === undefined ? lo : vidOf(st, n, r[2], VID_MAX); if (hi < lo) throw lineError(st, n, sayT("err.list.order", "The range {atom} runs backwards: write the lower VLAN ID first.", { atom: it })); for (let v = lo; v <= hi; v++) s[v] = 1; continue; } // numeric
        const id = names.get(it.toLowerCase()); // a name
        if (id === undefined) throw lineError(st, n, sayT("junos.unknown", "VLAN name \"{name}\" has no \"set vlans {name} vlan-id N\" line here: add it, or write the VLAN ID.", { name: it })); // unresolved
        s[id] = 1; // the named VLAN
      } // items
      addAll(members, s); // "set" adds to the members (the guide's example ends with members [ 1 sales support ])
      readLine(st, n, text, sayT("junos.members", "Adds {list} to the VLAN members.", { list: setText(s) })); // read
      continue; // next line
    } // members
    if ((m = /^(?:set (?:interfaces \S{1,64} )?)?native-vlan-id (\d{1,5});?$/.exec(text))) { any = true; native = vidOf(st, n, m[1], VID_MAX); readLine(st, n, text, sayT("junos.native", "The native VLAN ID is {v}.", { v: String(native) })); continue; } // native
    if (BARE_RE.test(text)) { any = true; const s = listOfVids(st, n, text, VID_MAX); addAll(members, s); readLine(st, n, text, sayT("bare.add", "Read as VLAN members typed alone: {list}.", { list: setText(s) })); continue; } // a bare list
    st.notRead.push(n); // another statement
  } // lines
  if (!any) throw noTrunkLine(st); // nothing to read
  if (native === null) { // no native VLAN
    st.notes.push(say("junos.noNative", "No native-vlan-id: a Junos trunk with ELS \"recognizes untagged control packets, but it does not recognize untagged data packets\" (Juniper, bridging and VLANs), so untagged data frames arriving here are dropped.")); // dropped
    return { allowed: members, untaggedOut: [], untaggedIn: "dropped", untaggedInVlan: null, native: null, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
  } // no native
  if (members[native] !== 1) { // configured but not a member
    st.warnings.push(sayT("junos.nativeOut", "native-vlan-id {v} is set, but VLAN {v} is not in the VLAN members. Juniper: \"The logical interface on which untagged packets are to be received must be configured with the same VLAN ID as the native VLAN ID\", so untagged data frames are dropped until VLAN {v} is added to the members.", { v: String(native) })); // not received
    return { allowed: members, untaggedOut: [], untaggedIn: "dropped", untaggedInVlan: null, native, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
  } // not a member
  return { allowed: members, untaggedOut: [native], untaggedIn: "vlan", untaggedInVlan: native, native, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
} // readJunos

/**
 * HPE Aruba AOS-CX: vlan trunk allowed, vlan trunk native and its tag form.
 * @param st the end's state
 * @param lines the lines
 * @returns the model
 */
function readAruba(st: EndState, lines: { n: number; text: string }[]): EndModel {
  let allowed: VidSet | null = null; // not set yet
  let isAll = false; // "all" in force
  let native = 1; // "By default, VLAN ID 1 is assigned as the native VLAN ID for all trunk interfaces."
  let tagNative = false; // vlan trunk native tag
  let any = false; // a trunk line read
  for (const { n, text } of lines) { // each line
    const low = text.toLowerCase(); // keywords in any case
    let m: RegExpExecArray | null; // a match
    if (low === "vlan trunk allowed all") { any = true; { allowed = allSet(); isAll = true; } readLine(st, n, text, say("aruba.all", "All VLANs: \"all the VLANs currently configured on the switch and any new VLANs that are configured in the future\".")); continue; } // all
    if ((m = /^vlan trunk allowed (.{1,240})$/.exec(low))) { // a list
      any = true; // a trunk line
      if (!BARE_RE.test(m[1])) throw lineError(st, n, say("aruba.form", "AOS-CX writes the list as \"a single ID, or a series of IDs separated by commas (2, 3, 4), dashes (2-4), or both (2-4,6)\", without spaces in the list.")); // malformed
      const s = listOfVids(st, n, m[1], VID_MAX); // the set
      if (allowed === null || isAll) { allowed = s; isAll = false; readLine(st, n, text, sayT("aruba.set", "The allowed VLANs become {list} (after \"all\", or as the first list: \"To only allow specific VLANs on the trunk, issue the vlan trunk allowed command specifying only specific VLANs\").", { list: setText(s) })); } // replaces all
      else { addAll(allowed, s); readLine(st, n, text, sayT("aruba.add", "Adds {list} (\"Multiple VLAN IDs can be assigned to a trunk interface\").", { list: setText(s) })); } // adds to a list
      continue; // next line
    } // list
    if ((m = /^no vlan trunk allowed(?: (.{1,240}))?$/.exec(low))) { // removal
      any = true; // a trunk line
      if (m[1] !== undefined) { // a list to remove
        if (!BARE_RE.test(m[1])) throw lineError(st, n, say("aruba.form", "AOS-CX writes the list as \"a single ID, or a series of IDs separated by commas (2, 3, 4), dashes (2-4), or both (2-4,6)\", without spaces in the list.")); // malformed
        const s = listOfVids(st, n, m[1], VID_MAX); // the set
        if (allowed === null) { allowed = allSet(); isAll = true; } // nothing listed yet: from all
        removeAll(allowed as unknown as VidSet, s); // removed
        isAll = false; // no longer "all"
        readLine(st, n, text, sayT("aruba.remove", "Removes {list}.", { list: setText(s) })); // read
      } else { allowed = emptySet(); readLine(st, n, text, say("aruba.removeAll", "Removes every listed VLAN.")); } // everything
      if (countOf(allowed as unknown as VidSet) === 0) { { allowed = allSet(); isAll = true; } st.notes.push(say("aruba.lastRemoved", "AOS-CX: \"When the last VLAN is removed from a trunk interface, the interface continues to operate in trunk mode, and will trunk all the VLANs currently defined on the switch\".")); } // empty means all
      continue; // next line
    } // removal
    if ((m = /^vlan trunk native (\d{1,5})$/.exec(low))) { any = true; native = vidOf(st, n, m[1], VID_MAX); { allowed = allSet(); isAll = true; } readLine(st, n, text, sayT("aruba.native", "The native VLAN is {v}; \"the switch automatically executes the vlan trunk allowed all command\", so a list must come after this line.", { v: String(native) })); continue; } // native
    if ((m = /^vlan trunk native(?: (\d{1,5}))? tag$/.exec(low))) { any = true; if (m[1] !== undefined) native = vidOf(st, n, m[1], VID_MAX); tagNative = true; readLine(st, n, text, sayT("aruba.tag", "VLAN {v} is tagged too: \"Incoming packets that are untagged are dropped except for BPDUs\" and \"Egress packets are tagged\".", { v: String(native) })); continue; } // tag
    if ((m = /^no vlan trunk native(?: (\d{1,5}))?( tag)?$/.exec(low))) { any = true; if (m[2]) { tagNative = false; readLine(st, n, text, say("aruba.noTag", "The native VLAN is untagged again.")); } else { native = 1; tagNative = false; readLine(st, n, text, say("aruba.noNative", "The native VLAN goes back to VLAN 1 (the no form \"assigns VLAN ID 1 as its native VLAN\").")); } continue; } // reset
    if (BARE_RE.test(text)) { any = true; const s = listOfVids(st, n, text, VID_MAX); allowed = s; isAll = false; readLine(st, n, text, sayT("bare.set", "Read as the allowed list typed alone: {list}.", { list: setText(s) })); continue; } // a bare list
    st.notRead.push(n); // another setting
  } // lines
  if (!any) throw noTrunkLine(st); // nothing to read
  const set: VidSet = allowed ?? allSet(); // a native line alone runs "allowed all"
  if (allowed === null) isAll = true; // counted as all
  if (isAll) st.notes.push(say("aruba.allMeans", "AOS-CX \"all\" means every VLAN configured on the switch, now and later; the tool counts 1 to 4094, so read this end's list as \"every VLAN that exists on this switch\".")); // all
  const member = set[native] === 1; // the native VLAN listed
  // A native VLAN left out of the allowed list is not carried: the AOS-CX 10.16 vlan trunk native page's own example
  // (read in a browser on 2026-11-08) assigns native VLAN 20 "and then" removes it from the allowed VLANs, "(Only allow
  // VLAN 10 on the trunk.)". Not carried means its frames are neither sent nor accepted, tagged or untagged.
  if (tagNative) { // the native VLAN tagged
    if (!member) st.warnings.push(sayT("aruba.tagOut", "VLAN {v} is the tagged native VLAN but is not in the allowed list, so it is not carried: HPE Aruba's vlan trunk native page assigns a native VLAN \"and then\" removes it \"from the list of allowed VLANs. (Only allow VLAN 10 on the trunk.)\"", { v: String(native) })); // not carried
    return { allowed: set, untaggedOut: [], untaggedIn: "dropped", untaggedInVlan: null, native, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: isAll }; // the model
  } // tag
  if (!member) { // the native VLAN left out
    st.warnings.push(sayT("aruba.nativeOut", "The native VLAN {v} is not in the allowed list, so it is not carried: frames of VLAN {v} are neither sent nor accepted untagged. HPE Aruba's vlan trunk native page gives this as an example: \"Assigning native VLAN ID 20 to trunk interface 1/1/2 and then removing it from the list of allowed VLANs. (Only allow VLAN 10 on the trunk.)\" Add VLAN {v} to the allowed list to carry it.", { v: String(native) })); // not carried
    return { allowed: set, untaggedOut: [], untaggedIn: "dropped", untaggedInVlan: null, native, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: isAll }; // the model
  } // left out
  return { allowed: set, untaggedOut: [native], untaggedIn: "vlan", untaggedInVlan: native, native, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: isAll }; // the model
} // readAruba

/**
 * MikroTik RouterOS: the bridge VLAN table's vlan-ids with tagged= or untagged=, and the bridge port's pvid.
 * @param st the end's state
 * @param lines the lines
 * @returns the model
 */
function readMikrotik(st: EndState, lines: { n: number; text: string }[]): EndModel {
  const tagged = emptySet(); // VLANs where the port is tagged
  const untagged = emptySet(); // VLANs where the port is untagged
  let pvid = 1; // "pvid ( integer 1..4094 ; Default: 1 )"
  let tagOnly = false; // frame-types=admit-only-vlan-tagged on the port
  let any = false; // a trunk line read
  for (const { n, text } of lines) { // each line
    const ids = /(?:^|[\s[])vlan-ids=([0-9,-]{1,200})(?=$|[\s\]])/.exec(text); // vlan-ids=10,20 or [find vlan-ids=10]
    const isPort = /\/interface bridge port\b|(?:^|\s)pvid=/.test(text); // a bridge port line
    if (ids && /(?:^|\s)tagged=\S/.test(text)) { any = true; if (!BARE_RE.test(ids[1])) throw lineError(st, n, sayT("err.list.atom", "\"{atom}\" is not a VLAN ID or a range such as 30-40.", { atom: ids[1] })); const s = listOfVids(st, n, ids[1], VID_MAX); addAll(tagged, s); readLine(st, n, text, sayT("mt.tagged", "The port is a tagged member of {list} (\"Interfaces ... that transmit frames with a VLAN tag\").", { list: setText(s) })); if (/(?:^|\s)untagged=\S/.test(text)) st.warnings.push(sayT("mt.both", "Line {n} has both tagged= and untagged=; the tool reads the trunk port as the tagged one.", { n: String(n) })); continue; } // tagged
    if (ids && /(?:^|\s)untagged=\S/.test(text)) { any = true; if (!BARE_RE.test(ids[1])) throw lineError(st, n, sayT("err.list.atom", "\"{atom}\" is not a VLAN ID or a range such as 30-40.", { atom: ids[1] })); const s = listOfVids(st, n, ids[1], VID_MAX); addAll(untagged, s); readLine(st, n, text, sayT("mt.untagged", "The port is an untagged member of {list}: these frames leave without a tag.", { list: setText(s) })); continue; } // untagged
    const p = /(?:^|\s)pvid=(\d{1,5})(?=$|\s)/.exec(text); // pvid=999
    if (p && isPort) { any = true; pvid = vidOf(st, n, p[1], VID_MAX); readLine(st, n, text, sayT("mt.pvid", "The port's PVID is {v}: \"Port VLAN ID (pvid) specifies which VLAN the untagged ingress traffic is assigned to\".", { v: String(pvid) })); if (/frame-types=admit-only-vlan-tagged/.test(text)) tagOnly = true; continue; } // pvid
    if (/\/interface bridge port\b/.test(text) && /frame-types=admit-only-vlan-tagged/.test(text)) { any = true; tagOnly = true; readLine(st, n, text, say("mt.tagOnly", "frame-types=admit-only-vlan-tagged: the port admits only tagged frames, and it is not added as an untagged member of its PVID.")); continue; } // tagged only
    if (BARE_RE.test(text)) { any = true; const s = listOfVids(st, n, text, VID_MAX); addAll(tagged, s); readLine(st, n, text, sayT("bare.tagged", "Read as the port's tagged VLANs typed alone: {list}.", { list: setText(s) })); continue; } // a bare list
    st.notRead.push(n); // another line
  } // lines
  if (!any) throw noTrunkLine(st); // nothing to read
  for (let v = 1; v < 4096; v++) if (tagged[v] && untagged[v]) throw inputError(sayT("mt.conflict", "End {end}: VLAN {v} is both a tagged and an untagged member of the port.", { end: st.end, v: String(v) })); // contradictory
  if (!tagOnly) { // admit-all is the default
    if (tagged[pvid]) throw inputError(sayT("mt.pvidTagged", "End {end}: the PVID {v} is also listed as tagged; RouterOS adds a port \"as untagged\" for its PVID when frame-types admits untagged frames.", { end: st.end, v: String(pvid) })); // contradictory
    untagged[pvid] = 1; // "Bridge ports with frame-types set to admit-all or admit-only-untagged-and-priority-tagged are automatically added as untagged ports for their configured PVID."
    st.notes.push(sayT("mt.auto", "With frame-types at its default, admit-all, the port is \"automatically added as untagged\" for its PVID, VLAN {v} (RouterOS 7.24, Bridge VLAN Table).", { v: String(pvid) })); // auto untagged
  } // admit-all
  const outs = rangesOf(untagged).flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i)); // every untagged VLAN
  if (outs.length > 1) st.warnings.push(sayT("mt.manyUntagged", "The port leaves untagged in {n} VLANs ({list}); RouterOS warns that several untagged VLANs on one port can send \"tagged packets ... as untagged packets through the wrong access port\". Untagged frames coming back are all placed in the PVID, VLAN {pvid}.", { n: String(outs.length), list: setText(untagged), pvid: String(pvid) })); // several untagged
  const allowed = emptySet(); // tagged and untagged
  addAll(allowed, tagged); // tagged
  addAll(allowed, untagged); // untagged
  st.notes.push(say("mt.assume", "The tool reads every bridge VLAN entry here as one that lists the trunk port; paste only the entries for that port. RouterOS drops a VLAN that is not in the bridge VLAN table (\"VLANs that don't exist in the bridge VLAN table are dropped\").")); // assumption
  return { allowed, untaggedOut: outs, untaggedIn: tagOnly ? "dropped" : "vlan", untaggedInVlan: tagOnly ? null : pvid, native: tagOnly ? null : pvid, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
} // readMikrotik

/**
 * Extreme Switch Engine: create vlan NAME tag N, configure vlan NAME|ID add ports P tagged|untagged, delete ports.
 * @param st the end's state
 * @param lines the lines
 * @returns the model
 */
function readExos(st: EndState, lines: { n: number; text: string }[]): EndModel {
  const names = new Map<string, number>([["default", 1]]); // "A VLAN named Default ... has an 802.1Q tag of 1."
  const untaggedNames = new Set<string>(); // VLANs created without a tag
  let autoMove = true; // configure vlan untagged-ports auto-move: "The default is inform" (on, with a notice)
  for (const { n, text } of lines) { // names and the global auto-move setting first
    let m: RegExpExecArray | null; // a match
    if ((m = /^config(?:ure)? vlan untagged-ports auto-move (on|off|inform)$/i.exec(text))) { autoMove = m[1].toLowerCase() !== "off"; continue; } // the global setting
    if ((m = /^create vlan ([A-Za-z][\w-]{0,31})(?: tag (\d{1,5}))?(?: description .{0,80})?(?: vr \S{1,32})?$/i.exec(text))) { // create vlan NAME tag N
      if (/^\d+$/.test(m[1])) continue; // an ID, not a name
      if (m[2] === undefined) { untaggedNames.add(m[1].toLowerCase()); continue; } // no tag: "A newly-created VLAN has no member ports, is untagged"
      const tag = Number(m[2]); // the tag
      if (!/^\d{1,4}$/.test(m[2]) || tag < 2 || tag > 4094) throw lineError(st, n, sayT("exos.tagRange", "Tag {v}: Switch Engine takes tags from 2 to 4094 (\"tag 1 is assigned to the default VLAN, and tag 4095 is assigned to the management VLAN\").", { v: m[2] })); // range
      names.set(m[1].toLowerCase(), tag); // the name
    } else if ((m = /^config(?:ure)? (?:vlan )?([A-Za-z][\w-]{0,31}) tag (\d{1,5})$/i.exec(text))) { // configure vlan NAME tag N
      const tag = Number(m[2]); // the tag
      if (tag < 2 || tag > 4094) throw lineError(st, n, sayT("exos.tagRange", "Tag {v}: Switch Engine takes tags from 2 to 4094 (\"tag 1 is assigned to the default VLAN, and tag 4095 is assigned to the management VLAN\").", { v: m[2] })); // range
      names.set(m[1].toLowerCase(), tag); untaggedNames.delete(m[1].toLowerCase()); // tagged now
    } // names
  } // names
  const tagged = emptySet(); // VLANs where the port is tagged
  let untaggedVlan: number | null = 1; // "The default VLAN is untagged on all ports."
  let any = false; // a trunk line read
  /** A VLAN by name or ID. */
  const target = (n: number, tok: string): number => {
    if (/^\d{1,5}$/.test(tok)) return vidOf(st, n, tok, VID_MAX); // an ID
    const id = names.get(tok.toLowerCase()); // a name
    if (id !== undefined) return id; // known
    if (untaggedNames.has(tok.toLowerCase())) throw lineError(st, n, sayT("exos.noTag", "VLAN {name} is created without a tag here; Switch Engine: \"If the VLAN is untagged, the ports cannot be tagged\". Add \"configure vlan {name} tag N\".", { name: tok })); // untagged VLAN
    throw lineError(st, n, sayT("exos.unknown", "VLAN name \"{name}\" has no \"create vlan {name} tag N\" line here: add it, or write the VLAN ID.", { name: tok })); // unknown
  }; // target
  for (const { n, text } of lines) { // each line
    let m: RegExpExecArray | null; // a match
    if (/^config(?:ure)? vlan untagged-ports auto-move (on|off|inform)$/i.test(text)) { readLine(st, n, text, autoMove ? say("exos.autoOn", "Untagged ports may move straight from one untagged VLAN to another (auto-move on or inform).") : say("exos.autoOff", "Auto-move off: \"you cannot directly move untagged ports from untagged VLANs without first removing the port VLAN configuration\".")); continue; } // the global setting
    if (/^create vlan /i.test(text) || /^config(?:ure)? (?:vlan )?[A-Za-z][\w-]{0,31} tag \d{1,5}$/i.test(text)) { // a definition, read above
      const d = /^(?:create vlan |config(?:ure)? (?:vlan )?)([A-Za-z0-9][\w-]{0,31})/i.exec(text); // its name or ID
      const nm = d ? d[1] : ""; // the name
      if (/^\d{1,5}$/.test(nm)) readLine(st, n, text, sayT("exos.createdId", "VLAN {v} is created by its ID.", { v: String(vidOf(st, n, nm, VID_MAX)) })); // create vlan 10
      else readLine(st, n, text, names.has(nm.toLowerCase()) ? sayT("exos.name", "VLAN {name} has tag {v}.", { name: nm, v: String(names.get(nm.toLowerCase())) }) : sayT("exos.created", "VLAN {name} is created without a tag.", { name: nm })); // read
      continue; // next line
    } // definitions
    if ((m = /^config(?:ure)? (?:vlan )?([A-Za-z0-9][\w-]{0,31}) add ports? ([^\s,]{1,64}(?:, ?[^\s,]{1,64}){0,31})(?: (tagged|untagged))?(?: .{0,60})?$/i.exec(text))) { // add ports
      any = true; // a trunk line
      const v = target(n, m[1]); // the VLAN
      const mode = (m[3] ?? "untagged").toLowerCase(); // "Default: Untagged."
      if (mode === "tagged") { tagged[v] = 1; readLine(st, n, text, sayT("exos.tagged", "The port is a tagged member of VLAN {v}.", { v: String(v) })); continue; } // tagged
      if (untaggedVlan !== null && untaggedVlan !== v && !autoMove) throw lineError(st, n, sayT("exos.conflict", "the port is still untagged in VLAN {u} and auto-move is off: \"Untagged ports can only be a member of a single VLAN\", and the switch answers \"Protocol conflict when adding untagged port\". Delete the port from that VLAN first.", { u: String(untaggedVlan) })); // refused by the switch
      const moved = untaggedVlan !== null && untaggedVlan !== v ? untaggedVlan : null; // the VLAN it leaves
      untaggedVlan = v; // untagged here
      if (moved !== null) readLine(st, n, text, sayT("exos.moved", "The port becomes the untagged member of VLAN {v} and leaves VLAN {u}: with auto-move at its default, inform, the switch reports \"Port # untagged has been auto-moved\".", { v: String(v), u: String(moved) })); // auto-moved
      else readLine(st, n, text, m[3] === undefined ? sayT("exos.untaggedDefault", "The port is the untagged member of VLAN {v} (untagged is the default when neither keyword is given).", { v: String(v) }) : sayT("exos.untagged", "The port is the untagged member of VLAN {v}.", { v: String(v) })); // untagged
      continue; // next line
    } // add
    if ((m = /^config(?:ure)? (?:vlan )?([A-Za-z0-9][\w-]{0,31}) delete ports? ([^\s,]{1,64}(?:, ?[^\s,]{1,64}){0,31})$/i.exec(text))) { // delete ports
      any = true; // a trunk line
      const v = target(n, m[1]); // the VLAN
      tagged[v] = 0; // no longer tagged
      if (untaggedVlan === v) untaggedVlan = null; // no longer untagged
      readLine(st, n, text, sayT("exos.delete", "The port leaves VLAN {v}.", { v: String(v) })); // read
      continue; // next line
    } // delete
    if (BARE_RE.test(text)) { any = true; const s = listOfVids(st, n, text, VID_MAX); addAll(tagged, s); readLine(st, n, text, sayT("bare.tagged", "Read as the port's tagged VLANs typed alone: {list}.", { list: setText(s) })); continue; } // a bare list
    st.notRead.push(n); // another line
  } // lines
  if (!any) throw noTrunkLine(st); // nothing to read
  if (untaggedVlan !== null && tagged[untaggedVlan]) throw inputError(sayT("exos.both", "End {end}: VLAN {v} is both the untagged and a tagged VLAN of the port.", { end: st.end, v: String(untaggedVlan) })); // contradictory
  if (untaggedVlan === 1) st.notes.push(say("exos.default", "The port is still in the Default VLAN (tag 1), untagged: Default \"initially contains all ports\" and \"is untagged on all ports\" (Switch Engine 33.7.1). The course removes it with configure vlan Default delete ports.")); // still in Default
  const allowed = emptySet(); // tagged and untagged
  addAll(allowed, tagged); // tagged
  if (untaggedVlan !== null) allowed[untaggedVlan] = 1; // untagged
  if (untaggedVlan === null) st.notes.push(say("exos.noUntagged", "The port is untagged in no VLAN; the Switch Engine pages read do not say what it does with an untagged frame that arrives, so the tool marks those frames as not confirmed.")); // not stated
  return { allowed, untaggedOut: untaggedVlan === null ? [] : [untaggedVlan], untaggedIn: untaggedVlan === null ? "unconfirmed" : "vlan", untaggedInVlan: untaggedVlan, native: untaggedVlan, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
} // readExos

/**
 * Extreme Fabric Engine: vlan members add|remove V PORTS, default-vlan-id and untag-port-default-vlan.
 * @param st the end's state
 * @param lines the lines
 * @returns the model
 */
function readFabric(st: EndState, lines: { n: number; text: string }[]): EndModel {
  const FE_MAX = 4059; // "VLAN IDs 1 to 4059 are configurable"
  const members = emptySet(); // the port's VLANs
  let defaultVlan: number | null = null; // default-vlan-id (the reference's Default: None)
  let untag = false; // untag-port-default-vlan: "The default is disabled."
  let any = false; // a trunk line read
  for (const { n, text } of lines) { // each line
    const low = text.toLowerCase(); // keywords in any case
    let m: RegExpExecArray | null; // a match
    if ((m = /^vlan members (add|remove) (\d{1,5}) (\S{1,64})(?: (static|portmember|notallowed))?$/.exec(low))) { // one VID a line
      any = true; // a trunk line
      if (m[4] === "portmember" || m[4] === "notallowed") throw lineError(st, n, sayT("fe.option", "the option {o} is not read: the Fabric Engine pages read do not say how it changes what the port carries.", { o: m[4] })); // not described
      const v = vidOf(st, n, m[2], FE_MAX); // the VLAN
      if (m[1] === "add") { members[v] = 1; readLine(st, n, text, sayT("fe.add", "The port joins VLAN {v}.", { v: String(v) })); } // add
      else { members[v] = 0; readLine(st, n, text, sayT("fe.remove", "The port leaves VLAN {v}.", { v: String(v) })); } // remove
      continue; // next line
    } // members
    if (/^vlan members (add|remove) \S{1,16},/.test(low)) throw lineError(st, n, say("fe.oneVid", "Fabric Engine's vlan members add and remove take one VLAN ID, from 1 to 4059; write one line per VLAN.")); // a list
    if ((m = /^default-vlan-id(?: port \S{1,64})? (\d{1,5})$/.exec(low))) { // the default VLAN
      any = true; // a trunk line
      if (m[1] === "0") throw lineError(st, n, say("fe.zero", "default-vlan-id 0: the command reference gives the range 0 to 4059 but does not say what 0 means, so the tool does not guess.")); // 0
      defaultVlan = vidOf(st, n, m[1], FE_MAX); // the VLAN
      readLine(st, n, text, sayT("fe.default", "The port's default VLAN is {v}.", { v: String(defaultVlan) })); // read
      continue; // next line
    } // default VLAN
    if (/^untag-port-default-vlan(?: enable)?(?: port \S{1,64})?$/.test(low)) { any = true; untag = true; readLine(st, n, text, say("fe.untag", "The default VLAN leaves untagged (untag-port-default-vlan \"Untags the default VLAN for the port\").")); continue; } // untag
    if (/^no untag-port-default-vlan(?: enable)?(?: port \S{1,64})?$/.test(low)) { any = true; untag = false; readLine(st, n, text, say("fe.noUntag", "The default VLAN leaves tagged again.")); continue; } // tagged again
    if (/^encapsulation dot1q(?: port \S{1,64})?$/.test(low)) { readLine(st, n, text, say("fe.encap", "Tagging on (encapsulation dot1q: \"Enable tagging on the ports before configuring Untagged VLANs\").")); continue; } // tagging
    if (BARE_RE.test(text)) { any = true; const s = listOfVids(st, n, text, FE_MAX); addAll(members, s); readLine(st, n, text, sayT("bare.tagged", "Read as the port's tagged VLANs typed alone: {list}.", { list: setText(s) })); continue; } // a bare list
    st.notRead.push(n); // another line
  } // lines
  if (!any) throw noTrunkLine(st); // nothing to read
  if (members[1] !== 1) st.notes.push(say("fe.vlan1", "Fabric Engine: \"VLAN ID 1 is the default VLAN and you cannot create or delete VLAN ID 1.\" Whether this port is still a member of VLAN 1 is not in these lines; add vlan members add 1 if it is.")); // VLAN 1
  if ([3500, 3998].some((v) => members[v] === 1) || rangesOf(members).some(([a, b]) => a <= 3998 && b >= 3500)) st.notes.push(say("fe.3500", "VLANs 3500 to 3998 are in this list: Fabric Engine reserves them too when the vrf-scaling and spbm-config-mode boot flags are on.")); // flags
  if (untag && defaultVlan !== null) { // a native VLAN
    if (members[defaultVlan] === 1) return { allowed: members, untaggedOut: [defaultVlan], untaggedIn: "vlan", untaggedInVlan: defaultVlan, native: defaultVlan, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // confirmed
    st.warnings.push(sayT("fe.nativeOut", "The default VLAN {v} is untagged but the port is not a member of it here; the Fabric Engine pages read do not say whether it is then carried, so the tool marks VLAN {v} as not confirmed.", { v: String(defaultVlan) })); // not stated
    return { allowed: members, untaggedOut: [], untaggedIn: "unconfirmed", untaggedInVlan: null, native: defaultVlan, nativeConfirmed: false, nativeUnconfirmed: defaultVlan, allConfigured: false }; // the model
  } // native
  if (untag && defaultVlan === null) st.warnings.push(say("fe.untagNoDefault", "untag-port-default-vlan is on but no default-vlan-id is set in these lines; the tool does not guess the default VLAN.")); // incomplete
  st.notes.push(say("fe.noNative", "Every VLAN leaves this port tagged (untag-port-default-vlan is off, its default). The Fabric Engine pages read do not say what the port does with untagged frames that arrive, so the tool marks those frames as not confirmed.")); // not stated
  return { allowed: members, untaggedOut: [], untaggedIn: "unconfirmed", untaggedInVlan: null, native: null, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
} // readFabric

/**
 * Arista EOS: switchport mode, switchport trunk allowed vlan with its edit actions, and switchport trunk native vlan
 * (EOS 4.37.0F User Manual, Virtual LANs (VLANs), read in a browser on 2026-11-08: the site refuses automated reads).
 * @param st the end's state
 * @param lines the lines
 * @returns the model
 */
function readArista(st: EndState, lines: { n: number; text: string }[]): EndModel {
  const allowed = allSet(); // "By default, interfaces handle tagged traffic for all VLANs."
  let native = 1; // "The default native VLAN for all interfaces is VLAN 1."
  let tagNative = false; // switchport trunk native vlan tag: "tag interface drops all untagged frames" (the VLAN number stays what it was)
  let modeTrunk = false; // a switchport mode trunk line seen
  let any = false; // a trunk line read
  for (const { n, text } of lines) { // each line
    const low = text.toLowerCase(); // keywords in any case
    let m: RegExpExecArray | null; // a match
    if ((m = /^switchport mode (\S{1,32})$/.exec(low))) { // the switching mode
      if (m[1] !== "trunk") throw lineError(st, n, sayT("arista.notTrunk", "switchport mode {mode}: the tool reads trunk ports (switchport mode trunk).", { mode: m[1] })); // not a trunk
      any = true; modeTrunk = true; // a trunk, with the defaults until other lines change them
      readLine(st, n, text, say("arista.mode", "Trunk switching mode: \"The interface may be a member of multiple VLANs, as configured by the switchport trunk allowed vlan command\".")); // read
      continue; // next line
    } // mode
    if ((m = /^switchport trunk allowed vlan (.{1,240})$/.exec(low))) { // EDIT_ACTION
      any = true; // a trunk line
      const arg = m[1]; // what follows
      if (arg === "all") { allowed.set(allSet()); readLine(st, n, text, say("arista.all", "All VLANs, 1 to 4094 (\"By default, interfaces handle tagged traffic for all VLANs\").")); continue; } // all
      if (arg === "none") { allowed.fill(0); readLine(st, n, text, say("arista.none", "No VLANs (none).")); continue; } // none
      const op = /^(add|remove|except) (.{1,230})$/.exec(arg); // add, remove or except v_range
      const listText = op ? op[2] : arg; // the v_range
      if (!BARE_RE.test(listText)) throw lineError(st, n, sayT("err.list.atom", "\"{atom}\" is not a VLAN ID or a range such as 30-40.", { atom: listText })); // "Valid v_range formats include number, range, or comma-delimited list of numbers and ranges."
      const s = listOfVids(st, n, listText, VID_MAX); // the set
      if (!op) { allowed.set(s); readLine(st, n, text, sayT("arista.set", "The allowed list becomes {list}: the VLANs for which the trunk \"handles tagged traffic\".", { list: setText(s) })); } // replaced
      else if (op[1] === "add") { addAll(allowed, s); readLine(st, n, text, sayT("arista.add", "Adds {list}.", { list: setText(s) })); } // added
      else if (op[1] === "remove") { removeAll(allowed, s); readLine(st, n, text, sayT("arista.remove", "Removes {list}.", { list: setText(s) })); } // removed
      else { const all = allSet(); removeAll(all, s); allowed.set(all); readLine(st, n, text, sayT("arista.except", "Every VLAN except {list}.", { list: setText(s) })); } // except
      continue; // next line
    } // allowed
    if (/^(?:no|default) switchport trunk allowed vlan$/.test(low)) { any = true; allowed.set(allSet()); readLine(st, n, text, say("arista.noAllowed", "Back to all VLANs: the no and default forms restore the default list, all.")); continue; } // reset
    if ((m = /^switchport trunk native vlan (\d{1,5})$/.exec(low))) { // a native VLAN
      any = true; native = vidOf(st, n, m[1], VID_MAX); tagNative = false; // the latest native line wins
      readLine(st, n, text, sayT("arista.native", "The native VLAN is {v}: in trunk mode \"Untagged traffic is associated with the interface's native VLAN\", and its frames leave untagged unless egress priority tagging sends \"priority tagged Ethernet frames in place of untagged frames\".", { v: String(native) })); // read
      continue; // next line
    } // native
    if (/^switchport trunk native vlan tag$/.test(low)) { // untagged frames dropped
      any = true; tagNative = true; // the native VLAN number stays as it was
      readLine(st, n, text, say("arista.tag", "native vlan tag: the \"interface drops all untagged frames\"; Arista's page does not say whether the native VLAN's own frames then leave tagged.")); // read
      continue; // next line
    } // tag
    if (/^(?:no|default) switchport trunk native vlan(?: .{0,32})?$/.test(low)) { // back to the default
      any = true; native = 1; tagNative = false; // the command is removed from running-config
      readLine(st, n, text, say("arista.noNative", "Back to VLAN 1, untagged: the no and default forms \"restore vlan 1 as the trunk mode native VLAN\" by removing the switchport trunk native vlan command.")); // read
      continue; // next line
    } // no or default
    if (BARE_RE.test(text)) { any = true; const s = listOfVids(st, n, text, VID_MAX); allowed.set(s); readLine(st, n, text, sayT("bare.set", "Read as the allowed list typed alone: {list}.", { list: setText(s) })); continue; } // a bare list
    st.notRead.push(n); // another interface setting
  } // lines
  if (!any) throw noTrunkLine(st); // nothing to read
  if (!modeTrunk) st.notes.push(say("arista.noMode", "No switchport mode trunk line here: Arista's default switching mode is access, and the tool reads these lines as a trunk port's.")); // the default mode
  if (tagNative) { // untagged frames dropped
    if (allowed[native] !== 1) return { allowed, untaggedOut: [], untaggedIn: "dropped", untaggedInVlan: null, native: null, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // no native VLAN in play: every allowed VLAN tagged
    // The page states only the ingress side of tag; how the native VLAN's own frames leave is not stated: not confirmed.
    st.warnings.push(sayT("arista.tagNative", "VLAN {v}, the native VLAN, is in the allowed list, but with native vlan tag Arista's page says only that the \"interface drops all untagged frames\": not whether VLAN {v}'s own frames then leave tagged, so the tool marks VLAN {v} as not confirmed in that direction.", { v: String(native) })); // not stated
    return { allowed, untaggedOut: [], untaggedIn: "dropped", untaggedInVlan: null, native, nativeConfirmed: false, nativeUnconfirmed: native, allConfigured: false }; // the model
  } // tag
  if (allowed[native] !== 1) { // the native VLAN left out
    // Arista's manual has no sentence on this case; its own example output, for an allowed list of 6-10, prints
    // "Trunking Native Mode VLAN: 1 (inactive)" (other examples print "1 (default)"): the tool reads "inactive" as not carried.
    st.warnings.push(sayT("arista.nativeOut", "The native VLAN {v} is not in the allowed list. Arista's manual has no sentence on this case; its own example, an allowed list of 6-10, prints \"Trunking Native Mode VLAN: 1 (inactive)\", and the tool reads that as: VLAN {v} is not carried, so no frame of it is sent or accepted untagged. Add VLAN {v} to the allowed list to carry it.", { v: String(native) })); // the example's reading
    return { allowed, untaggedOut: [], untaggedIn: "dropped", untaggedInVlan: null, native, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
  } // left out
  return { allowed, untaggedOut: [native], untaggedIn: "vlan", untaggedInVlan: native, native, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
} // readArista

/**
 * Huawei VRP's VLAN list: { vlan-id1 [ to vlan-id2 ] }&<1-10> | all (S5700 and S6700 V200R025C00 Command Reference,
 * port trunk allow-pass vlan), strictly.
 * @param st the end's state
 * @param line the line number
 * @param arg the text after "vlan"
 * @returns the set, or "all"
 */
function huaweiVids(st: EndState, line: number, arg: string): VidSet | "all" {
  if (arg === "all") return "all"; // the keyword
  const form = (): VlanInputError => lineError(st, line, say("huawei.form", "Huawei writes the VLANs separated by spaces, with to for a range (10 to 30), at most ten items in one command.")); // the syntax
  const toks = arg.split(" "); // spaces were collapsed by linesOf
  const s = emptySet(); // the set
  let items = 0; // how many items
  for (let i = 0; i < toks.length; i++) { // each item
    if (!/^\d{1,5}$/.test(toks[i])) throw form(); // a VLAN ID first (commas, hyphens and a dangling "to" refused)
    const lo = vidOf(st, line, toks[i], VID_MAX); // vlan-id1
    let hi = lo; // a single VLAN unless "to" follows
    if (toks[i + 1] === "to") { // a range
      if (i + 2 >= toks.length || !/^\d{1,5}$/.test(toks[i + 2])) throw form(); // "to" needs vlan-id2
      hi = vidOf(st, line, toks[i + 2], VID_MAX); // vlan-id2
      if (hi < lo) throw lineError(st, line, sayT("err.list.order", "The range {atom} runs backwards: write the lower VLAN ID first.", { atom: `${lo} to ${hi}` })); // 30 to 10
      i += 2; // past "to" and vlan-id2
    } // range
    items++; // one more item
    for (let v = lo; v <= hi; v++) s[v] = 1; // the run
  } // items
  if (items > 10) throw lineError(st, line, sayT("huawei.ten", "{n} items in one command: port trunk allow-pass vlan takes at most ten; write the rest on another line, which adds to this one.", { n: String(items) })); // the syntax's &<1-10>
  return s; // the set
} // huaweiVids

/**
 * Huawei VRP: port link-type trunk, port trunk allow-pass vlan and port trunk pvid vlan, with their undo forms (S5700 and
 * S6700 V200R025C00 Command Reference, VLAN Configuration Commands, and Configuration Guide - Ethernet Switching, Table
 * 4-2, both read in a browser on 2026-11-08: the site refuses automated reads).
 * @param st the end's state
 * @param lines the lines
 * @returns the model
 */
function readHuawei(st: EndState, lines: { n: number; text: string }[]): EndModel {
  const allowed = emptySet(); // the VLANs the trunk permits
  allowed[1] = 1; // "By default, a trunk interface is in VLAN 1."
  let pvid = 1; // "By default, VLAN 1 is the default VLAN of trunk interfaces."
  let linkTrunk = false; // a port link-type trunk line seen
  let any = false; // a trunk line read
  for (const { n, text } of lines) { // each line
    const low = text.toLowerCase(); // keywords in any case
    let m: RegExpExecArray | null; // a match
    if ((m = /^port link-type (\S{1,32})$/.exec(low))) { // the link type
      if (m[1] !== "trunk") throw lineError(st, n, sayT("huawei.notTrunk", "port link-type {type}: the tool reads trunk ports (port link-type trunk).", { type: m[1] })); // access, hybrid, dot1q-tunnel or negotiation
      any = true; linkTrunk = true; // a trunk, in VLAN 1 until other lines change it
      readLine(st, n, text, say("huawei.trunk", "The port is a trunk (port link-type trunk).")); // read
      continue; // next line
    } // link type
    if (/^(?:undo )?port trunk allow-pass only-vlan\b/.test(low)) throw lineError(st, n, say("huawei.onlyVlan", "port trunk allow-pass only-vlan applies only to an interface negotiated as a trunk: it \"configures VLANs allowed by the interface that is configured as a trunk interface through LNP negotiation\", after port link-type negotiation. On a static trunk (port link-type trunk), use port trunk allow-pass vlan.")); // its prerequisite is auto-negotiation; the tool reads static trunks
    if ((m = /^(undo )?port trunk allow-pass vlan (.{1,200})$/.exec(low))) { // add to or remove from the permitted VLANs
      any = true; // a trunk line
      const s = huaweiVids(st, n, m[2]); // the VLANs named
      if (m[1] === undefined) { // the command: cumulative
        if (s === "all") { allowed.set(allSet()); readLine(st, n, text, say("huawei.all", "All VLANs, 1 to 4094 (all \"Adds a trunk interface to all VLANs\").")); } // all
        else { addAll(allowed, s); readLine(st, n, text, sayT("huawei.add", "Adds {list}; allow-pass lines add up: \"the interface is added to all the specified VLANs\".", { list: setText(s) })); } // added
      } else { // the undo form removes
        if (s === "all") { allowed.fill(0); readLine(st, n, text, say("huawei.undoAll", "Removes every VLAN (undo ... all).")); } // all removed
        else { removeAll(allowed, s); readLine(st, n, text, sayT("huawei.undo", "Removes {list} (the undo form).", { list: setText(s) })); } // removed
      } // undo
      continue; // next line
    } // allow-pass
    if ((m = /^port trunk pvid vlan (\d{1,5})$/.exec(low))) { // the default VLAN
      any = true; pvid = vidOf(st, n, m[1], VID_MAX); // "latest wins": a later line replaces it
      readLine(st, n, text, sayT("huawei.pvid", "The default VLAN (PVID) is {v}; a later port trunk pvid vlan line replaces it. The command \"only specifies the default VLAN of a trunk interface but does not add the trunk interface to the default VLAN\".", { v: String(pvid) })); // read
      continue; // next line
    } // pvid
    if (/^undo port trunk pvid vlan(?: \d{1,5})?$/.test(low)) { // back to the default VLAN
      any = true; pvid = 1; // "By default, VLAN 1 is the default VLAN of trunk interfaces."
      readLine(st, n, text, say("huawei.undoPvid", "The PVID goes back to VLAN 1: \"The undo port trunk pvid vlan command restores the default VLAN of a trunk interface to the default setting\", and \"By default, VLAN 1 is the default VLAN of trunk interfaces\".")); // read
      continue; // next line
    } // undo pvid
    if (BARE_RE.test(text)) { any = true; const s = listOfVids(st, n, text, VID_MAX); allowed.set(s); readLine(st, n, text, sayT("bare.set", "Read as the allowed list typed alone: {list}.", { list: setText(s) })); continue; } // a bare list
    st.notRead.push(n); // another line (interface, vlan batch, description, quit ...)
  } // lines
  if (!any) throw noTrunkLine(st); // nothing to read
  if (!linkTrunk) st.notes.push(say("huawei.noType", "No port link-type trunk line here: the default link type is negotiation-desirable (negotiation-auto on the S5736-S), and the tool reads these lines as a trunk port's.")); // the default link type
  if (allowed[1] === 1) st.notes.push(say("huawei.vlan1", "VLAN 1 is allowed on this trunk: \"By default, a trunk interface is in VLAN 1\"; undo port trunk allow-pass vlan 1 removes it, as the course does.")); // the default VLAN 1
  st.notes.push(say("huawei.exist", "Huawei: \"If a specified VLAN does not exist, the configuration does not take effect\", and a PVID that names a VLAN that does not exist puts untagged packets in VLAN 1. The tool cannot see which VLANs exist on the switch and counts every VLAN these lines name.")); // not modelled, said
  if (allowed[pvid] !== 1) { // the PVID not permitted
    st.warnings.push(sayT("huawei.pvidOut", "The PVID {v} is not among the allowed VLANs. Huawei: \"A trunk interface forwards frames with the default VLAN ID only after it is added to the default VLAN using the port trunk allow-pass vlan command\", and an untagged frame is discarded \"if the default VLAN ID is denied by the interface\" (Table 4-2). Add port trunk allow-pass vlan {v}.", { v: String(pvid) })); // not forwarded
    return { allowed, untaggedOut: [], untaggedIn: "dropped", untaggedInVlan: null, native: pvid, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
  } // not permitted
  // Table 4-2: an untagged frame takes the default VLAN ID and is transmitted when it is permitted; on egress the default
  // VLAN's frames leave untagged and every other permitted VLAN tagged.
  return { allowed, untaggedOut: [pvid], untaggedIn: "vlan", untaggedInVlan: pvid, native: pvid, nativeConfirmed: true, nativeUnconfirmed: null, allConfigured: false }; // the model
} // readHuawei

/**
 * The refusal when no trunk line was read.
 * @param st the end's state
 * @returns the error
 */
function noTrunkLine(st: EndState): VlanInputError {
  const hint: Record<VendorId, string> = { // one line each vendor writes
    "cisco-ios-xe": "switchport trunk allowed vlan 10,20,99", // Cisco
    "juniper-junos": "set interfaces ge-0/0/23 unit 0 family ethernet-switching vlan members [ 10 20 99 ]", // Junos
    "aruba-aos-cx": "vlan trunk allowed 10,20,99", // AOS-CX
    "mikrotik-routeros": "/interface bridge vlan add bridge=bridge1 tagged=ether24 vlan-ids=10,20,99", // RouterOS
    "extreme-switch-engine": "configure vlan USERS add ports 24 tagged", // Switch Engine
    "extreme-fabric-engine": "vlan members add 10 1/24", // Fabric Engine
    "arista-eos": "switchport trunk allowed vlan 10,20,99", // Arista EOS
    "huawei-vrp": "port trunk allow-pass vlan 10 20 99", // Huawei VRP
  }; // hints
  return inputError(sayT("err.end.none", "End {end}: no {vendor} trunk line was read. A line such as \"{hint}\", or a VLAN list such as 10,20,30-40.", { end: st.end, vendor: VENDOR_NAMES[st.vendor], hint: hint[st.vendor] })); // nothing read
} // noTrunkLine

/**
 * One end, read by its vendor's parser.
 * @param end "A" or "B"
 * @param r the end's request
 * @returns the reading and the model
 */
function readEnd(end: "A" | "B", r: TrunkEndRequest | undefined): { reading: EndReading<EngineText>; model: EndModel } {
  if (!r || typeof r !== "object") throw inputError(sayT("err.end.missing", "End {end} is missing: give its vendor and its lines.", { end })); // absent
  const vendorRaw = String(r.vendor ?? ""); // the vendor id
  if (!(VENDORS as readonly string[]).includes(vendorRaw)) throw inputError(sayT("err.vendor", "End {end}: choose a vendor: {list}.", { end, list: VENDORS.join(", ") })); // unknown
  const vendor = vendorRaw as VendorId; // known
  const st: EndState = { end, vendor, read: [], notRead: [], warnings: [], notes: [] }; // the state
  const lines = linesOf(st, r.config); // bounded lines
  const model = vendor === "cisco-ios-xe" ? readCisco(st, lines) // Cisco
    : vendor === "juniper-junos" ? readJunos(st, lines) // Junos
      : vendor === "aruba-aos-cx" ? readAruba(st, lines) // AOS-CX
        : vendor === "mikrotik-routeros" ? readMikrotik(st, lines) // RouterOS
          : vendor === "extreme-switch-engine" ? readExos(st, lines) // Switch Engine
            : vendor === "extreme-fabric-engine" ? readFabric(st, lines) // Fabric Engine
              : vendor === "arista-eos" ? readArista(st, lines) // Arista EOS
                : readHuawei(st, lines); // Huawei VRP
  if (countOf(model.allowed) === 0 && model.nativeUnconfirmed === null) st.warnings.push(sayT("warn.emptyEnd", "End {end} carries no VLAN at all.", { end })); // nothing carried
  const tagged = emptySet(); // sent tagged
  addAll(tagged, model.allowed); // all carried ...
  for (const v of model.untaggedOut) tagged[v] = 0; // ... except the untagged ones
  if (model.nativeUnconfirmed !== null) tagged[model.nativeUnconfirmed] = 0; // and the unconfirmed native
  const allowedRanges = rangesOf(model.allowed); // runs
  const taggedRanges = rangesOf(tagged); // runs
  return {
    reading: {
      end, // the end
      vendor, // the vendor
      vendorName: VENDOR_NAMES[vendor], // its name
      allowed: allowedRanges, // carried
      allowedCount: countOf(model.allowed), // how many
      allowedText: rangesText(allowedRanges), // as text
      tagged: taggedRanges, // sent tagged
      taggedText: rangesText(taggedRanges), // as text
      untaggedOut: model.untaggedOut, // sent untagged
      untaggedIn: model.untaggedIn, // untagged arrivals
      untaggedInVlan: model.untaggedInVlan, // their VLAN
      native: model.native, // the native VLAN
      nativeConfirmed: model.nativeConfirmed, // stated or not
      allConfigured: model.allConfigured, // AOS-CX all
      read: st.read, // lines read
      notRead: st.notRead, // lines not read
      warnings: st.warnings, // warnings
      notes: st.notes, // notes
    }, // the reading
    model, // the model
  }; // both
} // readEnd

/**
 * One direction for one VLAN.
 * @param v the VLAN
 * @param s the sender's model
 * @param sTagged the sender's tagged set
 * @param r the receiver's model
 * @returns the direction
 */
function direction(v: number, s: EndModel, sTagged: VidSet, r: EndModel): Direction {
  if (s.nativeUnconfirmed === v) return { as: null, outcome: "unconfirmed", into: null }; // the sender's handling is not stated
  let as: "tagged" | "untagged" | null = null; // how it is sent
  if (s.untaggedOut.includes(v)) as = "untagged"; // its native VLAN
  else if (sTagged[v] === 1) as = "tagged"; // a tagged member
  if (as === null) return { as: null, outcome: "not-sent", into: null }; // not sent
  if (as === "tagged") { // classified by its VID
    if (r.allowed[v] === 1) return { as, outcome: "same", into: v }; // a member: the same VLAN
    if (r.nativeUnconfirmed === v) return { as, outcome: "unconfirmed", into: null }; // the receiver's native, not stated
    return { as, outcome: "dropped", into: null }; // not a member
  } // tagged
  if (r.untaggedIn === "dropped") return { as, outcome: "dropped", into: null }; // untagged data dropped
  if (r.untaggedIn === "unconfirmed" || r.untaggedInVlan === null) return { as, outcome: "unconfirmed", into: null }; // not stated
  return { as, outcome: r.untaggedInVlan === v ? "same" : "other", into: r.untaggedInVlan }; // into the receiver's PVID
} // direction

/**
 * A direction's fate as a key: runs of VLANs merge while their keys stay equal ("same" arrives in each VLAN itself).
 * @param d the direction
 * @returns the key
 */
const dirKey = (d: Direction): string => `${d.as}|${d.outcome}|${d.outcome === "other" ? d.into : ""}`; // as, outcome, and the other VLAN

/**
 * A direction as a run row keeps its VLAN only for "other" (a run of "same" arrives in each VLAN itself).
 * @param d the direction
 * @returns the row's direction
 */
const rowDir = (d: Direction): Direction => (d.outcome === "other" ? d : { ...d, into: null }); // trimmed

/**
 * The trunk-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function trunkLocalisable(r: TrunkRequest): TrunkResult<EngineText> {
  const A = readEnd("A", r.a); // end A
  const B = readEnd("B", r.b); // end B
  const tagA = emptySet(); for (const [x, y] of A.reading.tagged) for (let v = x; v <= y; v++) tagA[v] = 1; // A's tagged set
  const tagB = emptySet(); for (const [x, y] of B.reading.tagged) for (let v = x; v <= y; v++) tagB[v] = 1; // B's tagged set
  const carried = emptySet(); const aOnly = emptySet(); const bOnly = emptySet(); const crossed = emptySet(); const unconf = emptySet(); // the summaries
  const rows: FateRow[] = []; // the runs
  for (let v = VID_MIN; v <= VID_MAX; v++) { // every VLAN
    const ab = direction(v, A.model, tagA, B.model); // A to B
    const ba = direction(v, B.model, tagB, A.model); // B to A
    if (ab.outcome === "not-sent" && ba.outcome === "not-sent") continue; // neither end sends it
    if (ab.outcome === "same" && ba.outcome === "same") carried[v] = 1; // both ways, the same VLAN
    if (ab.outcome === "other" || ba.outcome === "other") crossed[v] = 1; // into another VLAN
    if (ab.outcome === "unconfirmed" || ba.outcome === "unconfirmed") unconf[v] = 1; // not stated
    if (ab.outcome === "dropped" || (ab.outcome === "same" && ba.outcome === "not-sent")) aOnly[v] = 1; // A sends, it does not come back
    if (ba.outcome === "dropped" || (ba.outcome === "same" && ab.outcome === "not-sent")) bOnly[v] = 1; // B sends, it does not come back
    const last = rows[rows.length - 1]; // the open run
    if (last && last.to === v - 1 && dirKey(last.ab) === dirKey(ab) && dirKey(last.ba) === dirKey(ba)) last.to = v; // the same fate: extend the run
    else rows.push({ from: v, to: v, ab: rowDir(ab), ba: rowDir(ba) }); // a new run
  } // VLANs
  const warnings: EngineText[] = []; // in order
  const notes: EngineText[] = []; // in order
  const ua = A.model.untaggedInVlan; // where A puts untagged arrivals
  const ub = B.model.untaggedInVlan; // where B puts untagged arrivals
  const nativeMismatch = ua !== null && ub !== null && ua !== ub; // they differ
  if (nativeMismatch) warnings.push(sayT("warn.native", "Native VLAN mismatch: end A puts untagged frames in VLAN {a}, end B in VLAN {b}, so untagged frames cross between the two VLANs at layer 2. Cisco's guide warns that when the native VLANs of the two ends differ, \"spanning-tree loops might result\", and asks to make sure \"the native VLAN for an IEEE 802.1Q trunk is the same on both ends\".", { a: String(ua), b: String(ub) })); // the classic fault
  for (const [S, R] of [[A, B], [B, A]] as const) { // untagged one way only
    for (const v of S.model.untaggedOut) if (R.model.untaggedIn === "dropped") warnings.push(sayT("warn.untaggedDropped", "End {s} sends VLAN {v} untagged, and end {r} drops untagged data frames ({vendor}).", { s: S.reading.end, r: R.reading.end, v: String(v), vendor: R.reading.vendorName })); // lost
  } // pairs
  for (const E of [A, B]) { // a native VLAN configured but not carried (AOS-CX, Arista EOS, Huawei VRP, Junos), said once at the top
    const m = E.model; // the end's model
    if (m.native !== null && m.allowed[m.native] !== 1 && m.nativeUnconfirmed === null) warnings.push(sayT("warn.nativeNotCarried", "End {end} ({vendor}): its native VLAN {v} is not among the VLANs it carries, so no frame crosses untagged at this end in either direction; the end's reading says why.", { end: E.reading.end, vendor: E.reading.vendorName, v: String(m.native) })); // the pitfall, visible at the top
  } // ends
  if (carried[1] === 1) notes.push(say("note.vlan1", "VLAN 1 crosses this trunk. It is the default PVID of every 802.1Q port (P802.1ad/D2.4, Table 9-2), so devices nobody configured land in it; the VLAN article explains why trunks are often built without it.")); // VLAN 1
  if (countOf(carried) === 0) warnings.push(say("warn.nothing", "No VLAN arrives in the same VLAN in both directions.")); // nothing works
  notes.push(say("note.assume", "The tool compares the configuration lines only: it assumes every VLAN in them exists on both switches, the link is up and a trunk at both ends, and nothing else (pruning, spanning tree, VLAN registration) removes a VLAN.")); // scope
  const cR = rangesOf(carried); const aR = rangesOf(aOnly); const bR = rangesOf(bOnly); const xR = rangesOf(crossed); const uR = rangesOf(unconf); // runs
  const verdict = sayT("verdict.trunk", "Same VLAN in both directions: {carried}. Only from A to B: {aOnly}. Only from B to A: {bOnly}. Into another VLAN: {crossed}. Not confirmed by the vendor pages read: {unconfirmed}.", { carried: String(countOf(carried)), aOnly: String(countOf(aOnly)), bOnly: String(countOf(bOnly)), crossed: String(countOf(crossed)), unconfirmed: String(countOf(unconf)) }); // counts
  return {
    mode: "trunk", // the mode
    a: A.reading, // end A
    b: B.reading, // end B
    carried: cR, // both ways
    carriedCount: countOf(carried), // how many
    carriedText: rangesText(cR), // as text
    aOnly: aR, // A only
    aOnlyText: rangesText(aR), // as text
    bOnly: bR, // B only
    bOnlyText: rangesText(bR), // as text
    crossed: xR, // crossing
    crossedText: rangesText(xR), // as text
    unconfirmed: uR, // not stated
    unconfirmedText: rangesText(uR), // as text
    rows, // the runs
    nativeMismatch, // the flag
    verdict, // one sentence
    warnings, // warnings
    notes, // notes
  }; // the reading
} // trunkLocalisable

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The page's entry: either mode, sentences as EngineTexts.
 * @param r the request (its mode picks the computation)
 * @returns the reading
 */
export function runLocalisable(r: VlanRequest): VlanResult<EngineText> {
  if (r && typeof r === "object" && r.mode === "tag") return tagLocalisable(r); // the tag decoder
  if (r && typeof r === "object" && r.mode === "trunk") return trunkLocalisable(r); // the trunk calculator
  throw inputError(say("err.mode", "Choose a mode: tag or trunk.")); // no mode
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param r the request
 * @returns the reading as the API returns it
 */
export function run(r: VlanRequest): VlanResult {
  return plainText(runLocalisable(r)) as VlanResult; // sentences as their English
} // run

/**
 * The API's entry: the request body as JSON text.
 * @param input the JSON text
 * @returns the reading
 */
export function runApi(input: string): VlanResult {
  let parsed: unknown; // the body
  try {
    parsed = JSON.parse(input); // the object
  } catch {
    throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode: tag or trunk.")); // a readable refusal, passed through by the Worker
  } // parsed
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode: tag or trunk.")); // not an object
  return run(parsed as VlanRequest); // the same engine as the page
} // runApi
