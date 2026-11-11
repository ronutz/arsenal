// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/radius-packet-decoder/compute.ts
// ----------------------------------------------------------------------------
// RADIUS PACKET DECODER - the pure, deterministic engine (08/11/2026, written
// for chapter 4.6, AAA: RADIUS and TACACS+, of the open course "LAN Switch
// Operations and Maintenance" and the Learn article radius-end-to-end).
//
// WHAT IT DOES. The hexadecimal of a RADIUS packet, as a capture shows it
// (plain hex, bytes separated by spaces, colons, hyphens or dots, or a hex
// dump with offsets), becomes: the Code, named from IANA's RADIUS Packet Type
// Codes; the Identifier; the Length, checked against the octets given; the
// Authenticator, with what it is for this Code; and every attribute as type,
// length and value, named from IANA's RADIUS Attribute Types with the value
// read in the RFC 8044 data type IANA gives it (text, string, integer, enum
// with IANA's value names, time, addresses, prefixes, ifid, integer64, tlv,
// vsa, extended, long-extended, evs). Vendor-Specific is split into the
// vendor's Private Enterprise Number (named from IANA's registry for the
// vendors in vendors.ts) and the vendor's sub-attributes where the vendor's
// own documentation defines them. Attributes hidden with the shared secret
// (User-Password, Tunnel-Password, the MPPE keys) and the Message-
// Authenticator are explained, never decrypted: no shared secret is ever asked
// for. "Attributes only" reads attribute octets without the 20-octet header
// (RFC 6929's examples are attributes, not packets).
//
// THE RULES, each from a document read on 2026-11-08 (sources in index.ts):
//   - RFC 2865 s3 (packet format: Code, Identifier, Length 20 to 4096, octets
//     beyond the Length are padding, a packet shorter than its Length is
//     silently discarded, the Request and Response Authenticators), s4.1, s5
//     (attribute format: Length counts Type and Length, so at least 2; the
//     five data types), s5.2, s5.3, s5.26, s5.44 (table of attributes);
//     verified errata 1469 and 6486 (two of its section 7 examples), erratum
//     9034 (held for document update since 2026-08-26: Message-Authenticator in
//     Access-Request; the requirement comes from CVE-2024-3596 and from
//     draft-ietf-radext-deprecating-radius, revision 10 of 2026-07-03, an
//     Internet-Draft and not an RFC, re-checked with the datatracker API on
//     2026-11-08 at 20:02 São Paulo; RFC 2865 as published does not ask for it).
//   - RFC 2866 s3 (accounting maximum 4095, the zeroed Request Authenticator),
//     s4.1, s5.13; RFC 2868 s3.1 to s3.10 (tags, Tunnel-Password), s4; RFC
//     2869 s5.19; RFC 3162 s2.1, s3; RFC 3579 s3.1, s3.2, s3.3; RFC 3580 s3.31
//     (VLAN assignment); RFC 5176 s2.3; RFC 5997 s3, s5; RFC 6929 s2.1, s2.2,
//     s2.3, s2.8 (malformed packets versus invalid attributes); RFC 8044 s3
//     (the data types); RFC 2548 (Microsoft sub-attributes); RFC 3748 s4 (the
//     EAP header inside EAP-Message); RFC 9765 s4.1 (RADIUS/1.1).
//   - IANA RADIUS Types, IANA EAP Registry (iana-data.ts, generated); IANA
//     Private Enterprise Numbers and the vendors' documents (vendors.ts),
//     Huawei's Table 1-11 among them since 2026-11-08b (read in a browser:
//     the site refuses automated reads): its integer, string, ipaddr and hex
//     types, and HW-Exec-Privilege (26-29), "The value ranges from 0 to 15.
//     The priority that is greater than or equal to 16 is ineffective."
//     Rows 26-158 and 26-253 (read in a browser at 21:05 the same day, R29):
//     HW-DHCP-Option is a "DHCP Option, encapsulated in Type-Length-Value (TLV)
//     format" and "Only Option 82 can be delivered", so its value is read as
//     DHCP options, Option 82 as RFC 3046 s2.0 defines it (sub-options 1,
//     Agent Circuit ID, and 2, Agent Remote ID); HW-Framed-IPv6-Address is the
//     "IPv6 address to be configured for the user".
//   - RFC 5997 s6.2: the reply's text says Accounting-Response (5), its first
//     octet is 02; its Response Authenticator is the MD5 of RFC 2866 s3 taken
//     over Code 5 with the RFC's shared secret "xyzzy5461" (computed on
//     2026-11-08 from the RFC's own octets: 0f6f9214...), so 02 is the misprint.
//   - Hex dumps: the format text2pcap 4.6.9 documents (an offset of 3 to 8
//     hex digits, optional 0x and colon, then the bytes; text after the bytes
//     is an ASCII column and is ignored).
//   - Pasted frames: RFC 894 and RFC 2464 (EtherType 0x0800 and 0x86DD, also
//     in IANA's IEEE 802 Numbers), RFC 791 and RFC 8200 (the IP headers),
//     RFC 768 (UDP) and IANA's Protocol Numbers (17 = UDP); RFC 8907 s4.1
//     (the TACACS+ header, recognised so it can be refused with a reason).
//
// MALFORMED OR INVALID (RFC 6929 s2.8). A packet whose Length or attribute
// lengths cannot be followed is malformed: the engine refuses it, saying where
// and why. An attribute whose length can be followed but whose value does not
// fit its data type is an "invalid attribute": it is decoded as octets and
// flagged with the reason, and the rest of the packet is read as usual.
//
// SHARE RESULTS (2026-11-08b). shareableCopy() makes the copy a link carries:
// the packet with the value octets of every attribute that hides a credential,
// or that lets a reader test guesses of the shared secret or a password
// offline, replaced by zero octets of the same length, so the structure still
// decodes (the rules and their sources are in redactionFields() and in the
// tool's docs). A request with redacted: true (an arriving link) marks every
// such field whose octets are all zero "redacted in this link". The RFCs'
// published examples go as typed: their octets and secret are in the RFC.
//
// PAGE LANGUAGE. Every sentence is an EngineText (../engine-text.ts):
// runLocalisable() returns the reading with them in place for the page (pack
// keys tools.radius-packet-decoder.engine.<id>); run() and runApi() return
// plainText() of the same reading. IANA's and the vendors' names are data,
// shown as published (English) on every page.
//
// Pure: no clock, no network, no randomness. Parsing uses anchored patterns
// with bounded repetition only (linear, ReDoS-safe); the text is at most
// MAX_INPUT characters and the bytes at most MAX_OCTETS.
// ============================================================================

import { say, resolvePlurals, plainText, withEngineText, EngineText } from "../engine-text"; // sentences with ids, and the API's English projection
import { PACKET_CODES, ATTRIBUTE_TYPES, EXTENDED_TYPES, VALUE_NAMES, EAP_CODES, EAP_TYPES } from "./iana-data"; // IANA's tables, generated
import { VENDORS, type SubType } from "./vendors"; // the vendors the decoder names
import { RFC_EXAMPLES } from "./examples"; // the RFCs' own example packets, recognised by their octets

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/** The longest text the engine reads (a 4096-octet packet as a hex dump with an ASCII column fits). */
export const MAX_INPUT = 24000; // characters
/** The most octets the engine reads: RFC 2865's maximum packet length. */
export const MAX_OCTETS = 4096; // RFC 2865 s3
/** The fixed header: Code, Identifier, Length and the 16-octet Authenticator. */
export const HEADER_OCTETS = 20; // RFC 2865 s3

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

/** What the bytes are: a whole packet, or attributes without the header. */
export type DecodeMode = "packet" | "attributes"; // the two readings

/** The request: the text as pasted, and the mode (packet when absent). */
export interface DecodeRequest {
  /** The packet as hexadecimal text. */
  input: string;
  /** "packet" (the default) or "attributes". */
  mode?: DecodeMode | string;
  /** True when the octets come from a Share results link: zeroed fields are then marked "redacted in this link". */
  redacted?: boolean;
}

/** How the text was written. */
export type InputFormat = "hex" | "dump"; // plain hex, or a hex dump with offsets

/** What the Authenticator is in this packet type. */
export type AuthenticatorKind = "request-random" | "request-md5" | "response" | "unknown"; // RFC 2865, 2866, 5176, 5997

/** The 20-octet header. */
export interface PacketHeader {
  /** The Code octet. */
  code: number;
  /** IANA's name for the Code, or null when IANA lists none. */
  codeName: string | null;
  /** The IANA row the Code falls in. */
  codeRow: "assigned" | "unassigned" | "reserved" | "experimental" | "unlisted";
  /** The Identifier octet. */
  identifier: number;
  /** The Length field. */
  length: number;
  /** The Authenticator, 32 lower-case hex digits. */
  authenticator: string;
  /** What the Authenticator is for this Code. */
  authenticatorKind: AuthenticatorKind;
  /** True when a Share results link replaced the Authenticator with zeros (only with a redacted request). */
  authenticatorRedacted: boolean;
}

/** One TLV inside a tlv value (RFC 6929 s2.3). */
export interface TlvReading {
  /** TLV-Type. */
  type: number;
  /** TLV-Length. */
  length: number;
  /** TLV-Data, lower-case hex. */
  hex: string;
  /** TLV-Data as text when every octet is printable ASCII, else null. */
  text: string | null;
}

/** One vendor sub-attribute (RFC 2865 s5.26's suggested format). */
export interface VendorSubReading<S = string> {
  /** The vendor type octet. */
  type: number;
  /** The vendor length octet. */
  length: number;
  /** The vendor's name for it, or null when the vendor's documentation gives none here. */
  name: string | null;
  /** How the vendor's documentation types it ("" when it gives no type, null when the sub-attribute is not listed). */
  dataType: SubType | null;
  /** The value, lower-case hex. */
  hex: string;
  /** The value as text: the text itself, a number, an address; null when it has no such reading. */
  value: string | null;
  /** Notes on this sub-attribute. */
  notes: S[];
  /** Huawei's HW-DHCP-Option (2011, 158) read as DHCP options, when its value divides into them; else null. */
  dhcp: DhcpOption[] | null;
}

/** One sub-option of DHCP Option 82, the Relay Agent Information option (RFC 3046 s2.0). */
export interface DhcpSubOption {
  /** SubOpt, the sub-option code. */
  code: number;
  /** Its length (the value's octets only). */
  length: number;
  /** RFC 3046's name ("Agent Circuit ID", "Agent Remote ID"), or null for a code it does not define. */
  name: string | null;
  /** The value, lower-case hex. */
  hex: string;
  /** The value as text when every octet is printable ASCII, else null. */
  text: string | null;
}

/** One DHCP option inside Huawei's HW-DHCP-Option (code, length, value). */
export interface DhcpOption {
  /** The option code. */
  code: number;
  /** The option length. */
  length: number;
  /** "Relay Agent Information" for 82 (RFC 3046), else null. */
  name: string | null;
  /** The value, lower-case hex. */
  hex: string;
  /** Option 82's sub-options when they divide as RFC 3046 s2.0 defines them, else null. */
  subs: DhcpSubOption[] | null;
}

/** A Vendor-Specific or Extended-Vendor-Specific reading. */
export interface VendorReading<S = string> {
  /** The Vendor-Id (the Private Enterprise Number). */
  id: number;
  /** IANA's organisation name, when the vendor is one the decoder names; else null. */
  name: string | null;
  /** How the String was read: as sub-attributes, or as undistinguished octets. */
  format: "subattributes" | "octets";
  /** The sub-attributes (empty when the String is read as octets). */
  subs: VendorSubReading<S>[];
}

/** An extended attribute's own fields (RFC 6929 s2.1, s2.2). */
export interface ExtendedReading {
  /** The container's IANA name ("Extended-Attribute-1" ...). */
  container: string;
  /** The Extended-Type octet. */
  extType: number;
  /** Long Extended Type: the More flag; null for the short format. */
  more: boolean | null;
  /** Long Extended Type: the Truncation flag; null for the short format. */
  truncation: boolean | null;
  /** How many attributes the value was reassembled from (1 unless fragmented). */
  fragments: number;
  /** Extended-Vendor-Specific: the Vendor-Type octet; null otherwise. */
  vendorType: number | null;
}

/** One decoded attribute. S: string for the API, EngineText for the page. */
export interface DecodedAttribute<S = string> {
  /** Its position, from 1. */
  index: number;
  /** The octet it starts at, counted from 0 in the octets given. */
  offset: number;
  /** The Type octet. */
  type: number;
  /** Its identifier: "1", "26", "241.1", "245.26.1.6" (RFC 6929 s2.7 dotted form). */
  id: string;
  /** IANA's name (the vendor's for an extended vendor attribute), or null. */
  name: string | null;
  /** The Length octet. */
  length: number;
  /** The RFC 8044 data type IANA gives it, or null when IANA gives none. */
  dataType: string | null;
  /** The value octets (after Type and Length), lower-case hex. */
  hex: string;
  /** The value as read: text, a number, an address, a date; null when hidden, opaque or invalid. */
  value: string | null;
  /** IANA's name for an enumerated value, or null. */
  valueName: string | null;
  /** The decimal number of an integer, enum, time or integer64 value, else null. */
  number: string | null;
  /** The RFC 2868 Tag, for the tunnel attributes that carry one, else null. */
  tag: number | null;
  /** Why it is an invalid attribute (RFC 6929 s2.8), or null. */
  invalid: S | null;
  /** Notes on this attribute (hidden values, CHAP, Message-Authenticator, ranges). */
  notes: S[];
  /** The vendor reading of a Vendor-Specific or Extended-Vendor-Specific attribute, else null. */
  vendor: VendorReading<S> | null;
  /** The extended fields of types 241 to 246, else null. */
  extended: ExtendedReading | null;
  /** The TLVs of a tlv value, else null. */
  tlvs: TlvReading[] | null;
  /** For a later fragment of a fragmented long extended attribute: the index of its first fragment; else null. */
  fragmentOf: number | null;
  /** True when a Share results link replaced value octets of this attribute with zeros (only with a redacted request). */
  redacted: boolean;
}

/** The EAP packet carried in the EAP-Message attributes (RFC 3579 s3.1; RFC 3748 s4). */
export interface EapReading {
  /** How many EAP-Message attributes carried it. */
  attributes: number;
  /** Whether they were consecutive, as RFC 3579 requires. */
  consecutive: boolean;
  /** The octets joined, as hex. */
  hex: string;
  /** The EAP Code, or null when fewer than 4 octets. */
  code: number | null;
  /** IANA's name for the EAP Code, or null. */
  codeName: string | null;
  /** The EAP Identifier, or null. */
  identifier: number | null;
  /** The EAP Length, or null. */
  length: number | null;
  /** The EAP Type of a Request or Response, or null. */
  type: number | null;
  /** IANA's name for the Type, or null. */
  typeName: string | null;
  /** An Identity's type-data as text, or null. */
  identity: string | null;
}

/** VLAN assignment as RFC 3580 s3.31 describes it. */
export interface VlanReading {
  /** The Tunnel-Private-Group-ID string. */
  group: string;
  /** The tag the three attributes share (0 when unused). */
  tag: number;
  /** The VLAN ID when the string is a decimal number from 1 to 4094, else null. */
  vlanId: number | null;
}

/** The reading of a whole packet. */
export interface PacketResult<S = string> {
  /** The mode. */
  mode: "packet";
  /** How the text was written. */
  format: InputFormat;
  /** The octets given. */
  octets: number;
  /** The header. */
  header: PacketHeader;
  /** Octets beyond the Length field (padding), 0 when none. */
  padding: number;
  /** True when a Share results link replaced that padding with zeros (only with a redacted request). */
  paddingRedacted: boolean;
  /** The attributes. */
  attributes: DecodedAttribute<S>[];
  /** The EAP packet, when the packet carries EAP-Message attributes. */
  eap: EapReading | null;
  /** The VLAN assignment, when the tunnel attributes describe one. */
  vlan: VlanReading | null;
  /** The RFC example these octets are, or null. */
  example: string | null;
  /** Whether an attribute holds a hidden password, a CHAP response or an encrypted key. */
  holdsSecret: boolean;
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** The reading of attributes without a header. */
export interface AttributesResult<S = string> {
  /** The mode. */
  mode: "attributes";
  /** How the text was written. */
  format: InputFormat;
  /** The octets given. */
  octets: number;
  /** The attributes. */
  attributes: DecodedAttribute<S>[];
  /** The EAP packet, when there are EAP-Message attributes. */
  eap: EapReading | null;
  /** The VLAN assignment, when the tunnel attributes describe one. */
  vlan: VlanReading | null;
  /** The RFC example these octets are, or null. */
  example: string | null;
  /** Whether an attribute holds a hidden password, a CHAP response or an encrypted key. */
  holdsSecret: boolean;
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** Any reading. */
export type DecodeResult<S = string> = PacketResult<S> | AttributesResult<S>; // by mode

/** An input the engine refuses: its message is the English, its sentence travels with it for the page. */
export class RadiusInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "RadiusInputError"; // a readable name in stack traces
  } // constructor
} // RadiusInputError

/**
 * Throw-ready input error carrying its sentence.
 * @param m the sentence
 * @returns the error
 */
function inputError(m: EngineText): RadiusInputError {
  return withEngineText(new RadiusInputError(m), m); // the class, the English message, and the sentence
} // inputError

/** A value a sentence template takes: plain text or another sentence. */
type Arg = string | EngineText; // what a {placeholder} holds

/**
 * A sentence from an id, an English template with {placeholders} and its values (one id, never fragments).
 * @param id the stable id (the pack key under engine.*)
 * @param tpl the English template, with ICU-style {names}
 * @param args the values
 * @returns the sentence
 */
function sayT(id: string, tpl: string, args: Record<string, Arg>): EngineText {
  return say(id, resolvePlurals(tpl, args).replace(/\{(\w+)\}/g, (m: string, k: string) => (k in args ? String(args[k] instanceof EngineText ? (args[k] as EngineText).text : args[k]) : m)), args); // filled for the API, values kept for the page
} // sayT

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------

/**
 * Octets as lower-case hex without separators.
 * @param b the octets
 * @returns the hex
 */
export function toHex(b: readonly number[]): string {
  return b.map((x) => x.toString(16).padStart(2, "0")).join(""); // two digits each
} // toHex

/**
 * A big-endian unsigned number of up to 6 octets (exact in a double).
 * @param b the octets
 * @param at the first
 * @param n how many
 * @returns the number
 */
function uint(b: readonly number[], at: number, n: number): number {
  let v = 0; // the accumulator
  for (let i = 0; i < n; i++) v = v * 256 + b[at + i]; // most significant first
  return v; // the number
} // uint

/**
 * The octets as text when every one is printable ASCII (0x20 to 0x7E), else null.
 * @param b the octets
 * @returns the text, or null
 */
function printable(b: readonly number[]): string | null {
  if (b.length === 0 || b.some((x) => x < 0x20 || x > 0x7e)) return null; // empty, or not printable
  return String.fromCharCode(...b); // ASCII
} // printable

/**
 * Strict UTF-8 (RFC 3629): the text, or null when the octets are not well-formed UTF-8.
 * @param b the octets
 * @returns the text, or null
 */
function utf8(b: readonly number[]): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(new Uint8Array(b)); // throws on ill-formed input (overlongs, surrogates, above U+10FFFF); ignoreBOM false is the default, spelled out because the Worker's typings require both fields
  } catch {
    return null; // not UTF-8
  } // try
} // utf8

/**
 * Four octets as a dotted IPv4 address.
 * @param b the octets
 * @param at the first
 * @returns a.b.c.d
 */
function ipv4(b: readonly number[], at: number): string {
  return [b[at], b[at + 1], b[at + 2], b[at + 3]].join("."); // dotted decimal
} // ipv4

/**
 * Sixteen octets as RFC 5952 canonical IPv6 text (lower case, no leading zeros, the longest run of two or more zero
 * groups compressed, the first on a tie; IPv4-mapped addresses with a dotted tail, section 5).
 * @param b the octets
 * @param at the first
 * @returns the text
 */
function ipv6(b: readonly number[], at: number): string {
  const g: number[] = []; // eight 16-bit groups
  for (let i = 0; i < 8; i++) g.push(b[at + 2 * i] * 256 + b[at + 2 * i + 1]); // big-endian
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return `::ffff:${ipv4(b, at + 12)}`; // RFC 5952 s5: IPv4-mapped
  let best = -1, bestLen = 0; // the longest zero run
  for (let i = 0; i < 8; ) { // scan runs
    if (g[i] !== 0) { i++; continue; } // not zero
    let j = i; // the run's end
    while (j < 8 && g[j] === 0) j++; // extend
    if (j - i > bestLen) { best = i; bestLen = j - i; } // longer (the first wins a tie)
    i = j; // past the run
  } // runs
  const h = g.map((x) => x.toString(16)); // no leading zeros, lower case (s4.1, s4.3)
  if (bestLen < 2) return h.join(":"); // s4.2.2: one zero group is not compressed
  return `${h.slice(0, best).join(":")}::${h.slice(best + bestLen).join(":")}`; // compressed
} // ipv6

/**
 * Seconds since 1970-01-01T00:00:00Z as ISO 8601 UTC text (RFC 8044 s3.3; unsigned, so past 2038).
 * @param s the seconds
 * @returns YYYY-MM-DDTHH:MM:SSZ
 */
function utcText(s: number): string {
  return new Date(s * 1000).toISOString().replace(".000Z", "Z"); // pure arithmetic on a given number, no clock
} // utcText

/**
 * The IANA row a number falls in.
 * @param rows [first, last, name] rows
 * @param n the number
 * @returns the row's name, or null when no row holds it
 */
function rowName(rows: readonly (readonly [number, number, string])[], n: number): string | null {
  for (const r of rows) if (n >= r[0] && n <= r[1]) return r[2]; // the first row that holds it
  return null; // not listed
} // rowName

/** IANA's placeholder row names, which name no assignment. */
const PLACEHOLDER = /^(Unassigned|Reserved|Experimental Use|Implementation Specific|Allocated)$/; // as IANA writes them

/**
 * An attribute as a sentence argument: "State (24)", or "type 17" when IANA names none.
 * @param name the name, or null
 * @param id the type or dotted identifier
 * @returns the label
 */
function label(name: string | null, id: string): EngineText {
  return name ? say("label.named", `${name} (${id})`, { name, id }) : say("label.unnamed", `type ${id}`, { id }); // named or numbered
} // label

// ----------------------------------------------------------------------------
// Reading the text (plain hex, or a hex dump with offsets)
// ----------------------------------------------------------------------------

/** A dump line: an offset of 3 to 8 hex digits, optionally 0x and a colon, then blanks (text2pcap 4.6.9). */
const DUMP_LINE = /^(?:0[xX])?([0-9A-Fa-f]{3,8}):?[ \t]+(.*)$/; // anchored; one bounded quantifier, one tail
/** A byte group in a dump: one to four bytes (text2pcap: "Byte groups of two to four bytes are also supported"). */
const DUMP_GROUP = /^(?:[0-9A-Fa-f]{2}){1,4}$/; // anchored, bounded
/** A plain token: hex digits, optionally prefixed with 0x. */
const PLAIN_TOKEN = /^(?:0[xX])?([0-9A-Fa-f]+)$/; // anchored, one quantifier

/**
 * The text as octets.
 * @param text the text as pasted
 * @returns the octets and how they were written
 */
export function parseHex(text: unknown): { bytes: number[]; format: InputFormat } {
  if (typeof text !== "string") throw inputError(say("err.notText", "Paste the packet as text: hexadecimal digits.")); // not text
  if (text.length > MAX_INPUT) throw inputError(sayT("err.tooLong", "The text is longer than this tool reads ({max} characters).", { max: String(MAX_INPUT) })); // bounded before any pattern runs
  const lines = text.split(/\r\n|\r|\n/).map((l) => l.trim()); // lines, trimmed
  const live = lines.map((l, i) => ({ l, n: i + 1 })).filter((x) => x.l !== "" && !x.l.startsWith("#")); // blank and comment lines out (text2pcap ignores '#' lines)
  if (live.length === 0) throw inputError(say("err.empty", "Paste a RADIUS packet in hexadecimal, as a capture shows it: plain hex, bytes separated by spaces or colons, or a hex dump with offsets.")); // nothing
  const first = DUMP_LINE.exec(live[0].l); // does the first line begin with an offset?
  if (first && parseInt(first[1], 16) === 0 && /\S/.test(first[2])) return { bytes: parseDump(live), format: "dump" }; // offset zero, then bytes: a dump
  const bytes: number[] = []; // the octets
  for (const { l, n } of live) { // each line
    for (const tok of l.split(/[\s:.,-]+/)) { // tokens between separators
      if (tok === "") continue; // separators at the ends
      const m = PLAIN_TOKEN.exec(tok); // hex digits?
      if (!m) throw inputError(sayT("err.token", 'Line {line}: "{token}" is not hexadecimal. Bytes are pairs of hex digits, separated by spaces, colons, hyphens or dots, or run together; a 0x prefix is allowed.', { line: String(n), token: tok.slice(0, 24) })); // not hex
      if (m[1].length % 2 !== 0) throw inputError(sayT("err.oddToken", 'Line {line}: "{token}" has an odd number of hex digits; write every byte as two digits (05, not 5).', { line: String(n), token: tok.slice(0, 24) })); // half a byte
      for (let i = 0; i < m[1].length; i += 2) bytes.push(parseInt(m[1].slice(i, i + 2), 16)); // the bytes
      if (bytes.length > MAX_OCTETS) throw tooMany(bytes.length); // bounded as it grows
    } // tokens
  } // lines
  if (bytes.length === 0) throw inputError(say("err.empty", "Paste a RADIUS packet in hexadecimal, as a capture shows it: plain hex, bytes separated by spaces or colons, or a hex dump with offsets.")); // only prefixes
  return { bytes, format: "hex" }; // plain hex
} // parseHex

/**
 * The refusal for too many octets.
 * @param n how many
 * @returns the error
 */
function tooMany(n: number): RadiusInputError {
  return inputError(sayT("err.tooMany", "These are more than {max} octets ({octets} so far): a RADIUS packet is at most 4096 octets (RFC 2865, section 3), and this tool reads no more.", { max: String(MAX_OCTETS), octets: String(n) })); // over the bound
} // tooMany

/**
 * A hex dump with offsets: every line begins with the offset of its first byte; the bytes follow, single or in groups of
 * up to four; anything after them (an ASCII column) is ignored. A line holds no more bytes than the next line's offset
 * leaves room for, so an ASCII column that happens to look like hex is not read as bytes.
 * @param live the non-blank lines with their numbers
 * @returns the octets
 */
function parseDump(live: readonly { l: string; n: number }[]): number[] {
  const parsed = live.map(({ l, n }) => { // offset and the rest of each line
    const m = DUMP_LINE.exec(l); // the offset
    if (!m) throw inputError(sayT("err.dumpLine", "Line {line} does not begin with an offset, but the first line did: in a hex dump every line begins with the offset of its first byte (the format text2pcap reads).", { line: String(n) })); // a stray line
    return { n, offset: parseInt(m[1], 16), rest: m[2] }; // parsed
  }); // lines
  const bytes: number[] = []; // the octets
  for (let k = 0; k < parsed.length; k++) { // each line
    const { n, offset, rest } = parsed[k]; // this line
    if (offset !== bytes.length) throw inputError(sayT("err.dumpOffset", "Line {line} begins with offset {found}, but {expected, plural, one {{expected} byte} other {{expected} bytes}} came before it: a hex dump's offsets count the bytes (the format text2pcap reads).", { line: String(n), found: `0x${offset.toString(16)}`, expected: `0x${bytes.length.toString(16)}` })); // offsets must be right
    const room = k + 1 < parsed.length ? parsed[k + 1].offset - offset : Infinity; // how many bytes this line holds
    let got = 0; // bytes read on this line
    for (const tok of rest.split(/[ \t]+/)) { // the tokens after the offset
      if (tok === "" ) continue; // runs of blanks
      if (!DUMP_GROUP.test(tok) || got >= room) break; // the ASCII column begins (or the line is full)
      for (let i = 0; i < tok.length && got < room; i += 2) { bytes.push(parseInt(tok.slice(i, i + 2), 16)); got++; } // the group's bytes
      if (bytes.length > MAX_OCTETS) throw tooMany(bytes.length); // bounded
    } // tokens
    if (got === 0) throw inputError(sayT("err.dumpBytes", "Line {line} has an offset but no bytes after it.", { line: String(n) })); // an empty line of a dump
  } // lines
  return bytes; // the octets
} // parseDump

// ----------------------------------------------------------------------------
// Bytes that are not a RADIUS packet: a pasted frame, an IP packet, TACACS+
// ----------------------------------------------------------------------------

/**
 * Refuse, with the reason, bytes that are plainly something else: an Ethernet frame, an IPv4 or IPv6 packet carrying
 * UDP, or a TACACS+ packet. Every test needs its first octet to be a Code IANA does not assign (0x45, 0x6X, 0xC0/0xC1)
 * or a matching length field, so a RADIUS packet never trips one.
 * @param b the octets
 */
function refuseOtherProtocols(b: readonly number[]): void {
  const n = b.length; // how many
  /** UDP source and destination ports at an offset (RFC 768). */
  const ports = (at: number) => ({ src: String(uint(b, at, 2)), dst: String(uint(b, at + 2, 2)) }); // the two ports
  /** An IPv4 header at `at` carrying UDP, whose Total Length covers the rest (RFC 791). */
  const v4 = (at: number) => n >= at + 28 && b[at] >> 4 === 4 && (b[at] & 15) >= 5 && b[at + 9] === 17 && uint(b, at + 2, 2) === n - at && n >= at + (b[at] & 15) * 4 + 8; // version 4, IHL, protocol 17, Total Length
  /** An IPv6 header at `at` with Next Header UDP, whose Payload Length covers the rest (RFC 8200). */
  const v6 = (at: number) => n >= at + 48 && b[at] >> 4 === 6 && b[at + 6] === 17 && uint(b, at + 4, 2) === n - at - 40; // version 6, Next Header 17, Payload Length
  if (n >= 14 + 28 && uint(b, 12, 2) === 0x0800 && v4(14)) { // Ethernet II, IPv4 (RFC 894)
    const off = 14 + (b[14] & 15) * 4 + 8; // Ethernet, IPv4 and UDP headers
    throw inputError(sayT("err.ether4", "These octets begin with an Ethernet header (EtherType 0x0800, RFC 894), then an IPv4 header carrying UDP (protocol 17: RFC 791, IANA's Protocol Numbers) from port {src} to port {dst} (RFC 768). The RADIUS packet starts at octet {offset}: copy only the RADIUS layer, or delete the first {offset} octets.", { offset: String(off), ...ports(off - 8) })); // a whole frame
  } // Ethernet IPv4
  if (n >= 14 + 48 && uint(b, 12, 2) === 0x86dd && v6(14)) { // Ethernet II, IPv6 (RFC 2464)
    throw inputError(sayT("err.ether6", "These octets begin with an Ethernet header (EtherType 0x86DD, RFC 2464), then an IPv6 header with Next Header 17, UDP (RFC 8200, IANA's Protocol Numbers), from port {src} to port {dst} (RFC 768). The RADIUS packet starts at octet {offset}: copy only the RADIUS layer, or delete the first {offset} octets.", { offset: "62", ...ports(54) })); // a whole frame
  } // Ethernet IPv6
  if (v4(0)) { // a bare IPv4 packet
    const off = (b[0] & 15) * 4 + 8; // IPv4 and UDP headers
    throw inputError(sayT("err.ipv4", "These octets begin with an IPv4 header carrying UDP (protocol 17: RFC 791, IANA's Protocol Numbers) from port {src} to port {dst} (RFC 768). The RADIUS packet starts at octet {offset}: copy only the RADIUS layer, or delete the first {offset} octets.", { offset: String(off), ...ports(off - 8) })); // an IP packet
  } // IPv4
  if (v6(0)) { // a bare IPv6 packet
    throw inputError(sayT("err.ipv6", "These octets begin with an IPv6 header with Next Header 17, UDP (RFC 8200, IANA's Protocol Numbers), from port {src} to port {dst} (RFC 768). The RADIUS packet starts at octet {offset}: copy only the RADIUS layer, or delete the first {offset} octets.", { offset: "48", ...ports(40) })); // an IP packet
  } // IPv6
  if (n >= 12 && (b[0] === 0xc0 || b[0] === 0xc1) && b[1] >= 1 && b[1] <= 3) { // a TACACS+ header (RFC 8907 s4.1)
    const types = { 1: say("tacacs.authen", "authentication"), 2: say("tacacs.author", "authorization"), 3: say("tacacs.acct", "accounting") } as const; // TAC_PLUS_AUTHEN, AUTHOR, ACCT
    const body = uint(b, 8, 4); // the body length
    const args = { first: `0x${b[0].toString(16)}`, version: `${b[0] >> 4}.${b[0] & 15}`, type: `${b[1]}`, typeName: types[b[1] as 1 | 2 | 3], seq: String(b[2]), flags: `0x${b[3].toString(16).padStart(2, "0")}`, session: `0x${toHex(b.slice(4, 8))}`, length: String(body), given: String(n - 12) }; // the header's fields
    throw inputError(body === n - 12
      ? sayT("err.tacacs", "These octets are not a RADIUS packet: the first octet, {first}, is not a Code IANA assigns, and the first 12 read as a TACACS+ header (RFC 8907, section 4.1): version {version}, type {type} ({typeName}), seq_no {seq}, flags {flags}, session_id {session}, body length {length}, which is the number of octets that follow. A TACACS+ body is obfuscated with the shared secret (section 4.5), so this tool does not decode it; the comparison below sets the two protocols side by side.", args)
      : sayT("err.tacacsPartial", "These octets are not a RADIUS packet: the first octet, {first}, is not a Code IANA assigns, and the first 12 read as a TACACS+ header (RFC 8907, section 4.1): version {version}, type {type} ({typeName}), seq_no {seq}, flags {flags}, session_id {session}, body length {length}, though {given} octets follow. A TACACS+ body is obfuscated with the shared secret (section 4.5), so this tool does not decode it; the comparison below sets the two protocols side by side.", args)); // TACACS+
  } // TACACS+
} // refuseOtherProtocols

// ----------------------------------------------------------------------------
// Walking the attributes (malformed packets are refused here)
// ----------------------------------------------------------------------------

/** One attribute as found: where, which type, how long, and its value octets. */
interface RawAttr {
  /** Position, from 1. */
  index: number;
  /** Starting octet in the octets given. */
  offset: number;
  /** The Type octet. */
  type: number;
  /** The Length octet. */
  length: number;
  /** The value octets. */
  value: number[];
}

/**
 * Type-length-value attributes from `start` to `end`; a length that cannot be followed is a malformed packet.
 * @param b the octets
 * @param start the first attribute's octet
 * @param end one past the last octet that holds attributes
 * @returns the attributes
 */
function walk(b: readonly number[], start: number, end: number): RawAttr[] {
  const out: RawAttr[] = []; // the attributes
  let o = start; // the current octet
  while (o < end) { // until the end the Length gives
    const index = out.length + 1; // this attribute's position
    if (end - o === 1) throw inputError(sayT("err.attrHeader", "Attribute {index} would start at octet {offset}, but only one octet is left: an attribute needs at least a Type and a Length octet (RFC 2865, section 5). The packet is malformed.", { index: String(index), offset: String(o) })); // a lone octet
    const type = b[o]; // Type
    const length = b[o + 1]; // Length
    const lab = label(stdInfo(type).name, String(type)); // for the sentences
    if (length < 2) throw inputError(sayT("err.attrLength", "Attribute {index} at octet {offset}, {label}, has Length {length}. An attribute's Length counts its Type and Length octets, so it is at least 2 (RFC 2865, section 5): the packet is malformed, and RFC 2865 has an Access-Request with an invalid attribute Length answered with an Access-Reject, and a reply with one treated as an Access-Reject or silently discarded.", { index: String(index), offset: String(o), label: lab, length: String(length) })); // below 2
    if (o + length > end) { // runs past the end
      const args = { index: String(index), offset: String(o), label: lab, length: String(length), end: String(end), over: String(o + length - end) }; // the sentence's values
      if (exampleOf(b) === "rfc2865-7.3-request-2-published") throw inputError(sayT("err.rfc2865erratum6486", "Attribute {index} at octet {offset}, {label}, has Length {length}, which runs {over, plural, one {{over} octet} other {{over} octets}} past the end of the packet at octet {end}. These are the octets of RFC 2865's example in section 7.3 as published: its last attribute, State, says 0x10 where 10 octets (0x0a) follow, and verified erratum 6486 corrects it to 0x0a.", args)); // the RFC's own misprint
      throw inputError(sayT("err.attrOverrun", "Attribute {index} at octet {offset}, {label}, has Length {length}, which runs {over, plural, one {{over} octet} other {{over} octets}} past the end of the packet at octet {end} (RFC 2865, section 5): the packet is malformed. The capture may be cut short, or the Length field of the packet or of the attribute is wrong.", args)); // the general case
    } // overrun
    out.push({ index, offset: o, type, length, value: b.slice(o + 2, o + length) }); // the attribute
    o += length; // the next one
  } // attributes
  return out; // all of them
} // walk

// ----------------------------------------------------------------------------
// IANA lookups
// ----------------------------------------------------------------------------

/** What IANA says about a standard-space Type. */
interface TypeInfo {
  /** IANA's name, or null for a placeholder row or no row. */
  name: string | null;
  /** The data type ("" when none). */
  dataType: string;
  /** The row. */
  row: "assigned" | "unassigned" | "experimental" | "implementation" | "reserved" | "unlisted";
}

/**
 * IANA's row for a standard-space Type.
 * @param t the Type
 * @returns the name, data type and row
 */
function stdInfo(t: number): TypeInfo {
  for (const r of ATTRIBUTE_TYPES) { // IANA's rows
    if (t < r[0] || t > r[1]) continue; // not this row
    if (r[2] === "Unassigned") return { name: null, dataType: "", row: "unassigned" }; // unassigned
    if (r[2] === "Experimental Use") return { name: null, dataType: "", row: "experimental" }; // 192 to 223
    if (r[2] === "Implementation Specific") return { name: null, dataType: "", row: "implementation" }; // 224 to 240
    if (r[2] === "Reserved") return { name: null, dataType: "", row: "reserved" }; // 247 to 255
    return { name: r[2], dataType: r[3], row: "assigned" }; // an assignment
  } // rows
  return { name: null, dataType: "", row: "unlisted" }; // 0: IANA's registry starts at 1
} // stdInfo

/**
 * IANA's row for an extended-space Type.Extended-Type.
 * @param t the Type (241 to 246)
 * @param e the Extended-Type
 * @returns the name and data type, and whether it is a placeholder row
 */
function extInfo(t: number, e: number): { name: string | null; dataType: string; row: "assigned" | "unassigned" | "reserved" } {
  for (const r of EXTENDED_TYPES) { // IANA's rows
    if (r[0] !== t || e < r[1] || e > r[2]) continue; // not this row
    if (r[3] === "Unassigned") return { name: null, dataType: "", row: "unassigned" }; // unassigned
    if (r[3] === "Reserved") return { name: null, dataType: "", row: "reserved" }; // 241 to 255
    return { name: r[3], dataType: r[4], row: "assigned" }; // an assignment
  } // rows
  return { name: null, dataType: "", row: "unassigned" }; // 0 is in no row
} // extInfo

/**
 * IANA's row for a Code.
 * @param c the Code
 * @returns its name (null for a placeholder or no row) and row
 */
function codeInfo(c: number): { name: string | null; row: PacketHeader["codeRow"] } {
  const n = rowName(PACKET_CODES, c); // the row's name
  if (n === null) return { name: null, row: "unlisted" }; // 0, 14 to 20
  if (n === "Unassigned") return { name: null, row: "unassigned" }; // unassigned
  if (n === "Reserved") return { name: null, row: "reserved" }; // reserved
  if (n === "Experimental Use") return { name: null, row: "experimental" }; // 250 to 253
  return { name: n, row: "assigned" }; // an assignment
} // codeInfo

/** The attributes IANA lists as enum whose values are capability bit flags, not names (131, 132). */
const FLAG_ENUMS = new Set(["131", "132"]); // Location-Capable, Requested-Location-Info

// ----------------------------------------------------------------------------
// Reading one value by its RFC 8044 data type
// ----------------------------------------------------------------------------

/** A value's reading. */
interface ValueReading {
  /** The value as text, or null. */
  value: string | null;
  /** IANA's name for it, or null. */
  valueName: string | null;
  /** The decimal number, or null. */
  number: string | null;
  /** Why the attribute is invalid, or null. */
  invalid: EngineText | null;
  /** Notes. */
  notes: EngineText[];
  /** TLVs, for a tlv value. */
  tlvs: TlvReading[] | null;
}

/** An empty reading, to fill in. */
const blank = (): ValueReading => ({ value: null, valueName: null, number: null, invalid: null, notes: [], tlvs: null }); // nothing read yet

/** The RFC 8044 section of each fixed-size data type, and its size in octets. */
const FIXED: Readonly<Record<string, readonly [number, string]>> = { integer: [4, "3.1"], enum: [4, "3.2"], time: [4, "3.3"], ifid: [8, "3.7"], ipv4addr: [4, "3.8"], ipv6addr: [16, "3.9"], ipv4prefix: [6, "3.11"], integer64: [8, "3.12"] }; // sizes from RFC 8044 s3

/**
 * The invalid-attribute sentence for a value of the wrong size.
 * @param dataType the data type
 * @param got the octets it has
 * @returns the sentence
 */
function wrongSize(dataType: string, got: number): EngineText {
  const [want, sec] = FIXED[dataType]; // what it should be
  return sayT("attr.size", "A value of data type {dataType} is {want} octets (RFC 8044, section {section}); this one has {got}, so it is an invalid attribute (RFC 6929, section 2.8) and is shown as octets.", { dataType, want: String(want), section: sec, got: String(got) }); // the reason
} // wrongSize

/**
 * Read a value in a data type.
 * @param dataType the RFC 8044 data type ("" for none)
 * @param v the value octets
 * @param id the attribute id, for IANA's value names
 * @returns the reading
 */
function readValue(dataType: string, v: readonly number[], id: string): ValueReading {
  const r = blank(); // to fill
  if (v.length === 0 && dataType !== "") { r.invalid = say("attr.empty", "The value is empty: text and string values of length zero MUST NOT be sent (RFC 8044, sections 3.4 and 3.5; RFC 2865, section 5), and the fixed-size types cannot be empty, so it is an invalid attribute (RFC 6929, section 2.8)."); return r; } // nothing
  if (dataType in FIXED && v.length !== FIXED[dataType][0]) { r.invalid = wrongSize(dataType, v.length); r.value = printable(v); return r; } // wrong size
  switch (dataType) { // by type
    case "text": { // UTF-8 (RFC 8044 s3.4)
      const t = utf8(v); // strict
      if (t === null) r.invalid = say("attr.utf8", "The value is not well-formed UTF-8, which a text value must be (RFC 8044, section 3.4; RFC 3629), so it is an invalid attribute (RFC 6929, section 2.8) and is shown as octets."); // not UTF-8
      else r.value = t; // the text
      return r; // read
    } // text
    case "integer": case "enum": { // 32 bits unsigned (s3.1, s3.2)
      const n = uint(v, 0, 4); // the number
      r.number = String(n); r.value = r.number; // as text
      const rows = VALUE_NAMES[id]; // IANA's values, if it lists any
      if (rows && !FLAG_ENUMS.has(id)) { // named values
        const nm = rowName(rows, n); // the row
        if (nm !== null && !PLACEHOLDER.test(nm)) r.valueName = nm; // a name
        else if (dataType === "enum") r.invalid = sayT("attr.enumUnknown", "{value} is not a value IANA lists for this attribute; RFC 8044 (section 3.2) says an enum outside its defined values SHOULD be treated as an invalid attribute.", { value: r.number }); // unknown value
      } else if (dataType === "enum" && !FLAG_ENUMS.has(id)) r.notes.push(say("attr.enumNoList", "IANA's RADIUS Types registry lists no value names for this attribute, so the number is shown as it is.")); // no list
      return r; // read
    } // integer, enum
    case "time": { // seconds since 1970 (s3.3)
      const n = uint(v, 0, 4); // the seconds
      r.number = String(n); r.value = utcText(n); // the date
      if (n < 1483228800) r.notes.push(say("attr.timeEarly", "A date before 2017 is likely to mean a configuration error or a clock without the correct time (RFC 8044, section 3.3).")); // before 2017-01-01
      return r; // read
    } // time
    case "ipv4addr": r.value = ipv4(v, 0); return r; // s3.8
    case "ipv6addr": r.value = ipv6(v, 0); return r; // s3.9, printed per RFC 5952
    case "ifid": r.value = [0, 2, 4, 6].map((i) => toHex(v.slice(i, i + 2))).join(":"); return r; // s3.7: eight octets, in four groups
    case "integer64": { // s3.12
      const n = (BigInt(uint(v, 0, 4)) << 32n) + BigInt(uint(v, 4, 4)); // 64 bits
      r.number = n.toString(); r.value = r.number; // as text
      return r; // read
    } // integer64
    case "ipv6prefix": return readPrefix6(v); // s3.10
    case "ipv4prefix": return readPrefix4(v); // s3.11
    case "tlv": { // s3.13
      const tl = readTlvs(v); // the TLVs
      if (tl === null) r.invalid = say("attr.tlv", "The value does not divide into TLVs whose TLV-Length is 3 to 255 (RFC 8044, section 3.13), so it is an invalid attribute (RFC 6929, section 2.8) and is shown as octets."); // not TLVs
      else r.tlvs = tl; // the TLVs
      return r; // read
    } // tlv
    case "string": case "concat": default: { // undistinguished octets (s3.5, s3.6), and any type IANA does not give
      r.value = printable(v); // a text reading when printable
      return r; // read
    } // string
  } // types
} // readValue

/**
 * An ipv6prefix value (RFC 8044 s3.10): Reserved, Prefix-Length, then up to 16 octets of prefix.
 * @param v the value octets
 * @returns the reading
 */
function readPrefix6(v: readonly number[]): ValueReading {
  const r = blank(); // to fill
  if (v.length < 2 || v.length > 18) { r.invalid = sayT("attr.prefixSize", "An ipv6prefix value is 2 to 18 octets (RFC 8044, section 3.10); this one has {got}, so it is an invalid attribute (RFC 6929, section 2.8).", { got: String(v.length) }); return r; } // wrong size
  const plen = v[1]; // Prefix-Length
  if (plen > 128) { r.invalid = sayT("attr.prefixLen", "Prefix-Length {plen} is above {max}, so the value MUST be treated as an invalid attribute (RFC 8044, section {section}).", { plen: String(plen), max: "128", section: "3.10" }); return r; } // too long
  const need = Math.ceil(plen / 8); // octets the prefix needs
  if (v.length - 2 < need) { r.invalid = sayT("attr.prefixShort", "Prefix-Length {plen} needs {need, plural, one {{need} octet} other {{need} octets}} of prefix, and only {got} follow, so the prefix cannot be read and the attribute is invalid (RFC 8044, section {section}; RFC 6929, section 2.8).", { plen: String(plen), need: String(need), got: String(v.length - 2), section: "3.10" }); return r; } // too few octets
  const a = [...v.slice(2), ...new Array(18 - v.length).fill(0)]; // padded to 16 octets
  r.value = `${ipv6(a, 0)}/${plen}`; // the prefix
  if (v[0] !== 0) r.notes.push(sayT("attr.reserved", "The Reserved octet is {value}; RFC 8044 says it is always zero (section {section}).", { value: String(v[0]), section: "3.10" })); // non-zero Reserved
  if (bitsBeyond(a, plen)) r.notes.push(sayT("attr.prefixBits", "Bits beyond the prefix length are set; RFC 8044 says they MUST be zero (section {section}).", { section: "3.10" })); // stray bits
  return r; // read
} // readPrefix6

/**
 * An ipv4prefix value (RFC 8044 s3.11): Reserved, Prefix-Length, then four octets.
 * @param v the value octets (six, checked by the caller)
 * @returns the reading
 */
function readPrefix4(v: readonly number[]): ValueReading {
  const r = blank(); // to fill
  const plen = v[1]; // Prefix-Length
  if (plen > 32) { r.invalid = sayT("attr.prefixLen", "Prefix-Length {plen} is above {max}, so the value MUST be treated as an invalid attribute (RFC 8044, section {section}).", { plen: String(plen), max: "32", section: "3.11" }); return r; } // too long
  r.value = `${ipv4(v, 2)}/${plen}`; // the prefix
  if (v[0] !== 0) r.notes.push(sayT("attr.reserved", "The Reserved octet is {value}; RFC 8044 says it is always zero (section {section}).", { value: String(v[0]), section: "3.11" })); // non-zero Reserved
  if (bitsBeyond(v.slice(2), plen)) r.notes.push(sayT("attr.prefixBits", "Bits beyond the prefix length are set; RFC 8044 says they MUST be zero (section {section}).", { section: "3.11" })); // stray bits
  if (v.slice(2).every((x) => x === 0) && plen !== 32) r.notes.push(say("attr.prefixZero", "The address is 0.0.0.0, for which RFC 8044 says the Prefix-Length MUST be 32 (section 3.11).")); // the zero rule
  return r; // read
} // readPrefix4

/**
 * Whether any bit beyond the prefix length is set.
 * @param a the address octets
 * @param plen the prefix length
 * @returns true when a stray bit is set
 */
function bitsBeyond(a: readonly number[], plen: number): boolean {
  for (let i = 0; i < a.length; i++) { // each octet
    const keep = Math.max(0, Math.min(8, plen - 8 * i)); // bits of this octet inside the prefix
    if ((a[i] & (0xff >> keep)) !== 0) return true; // a bit outside is set
  } // octets
  return false; // clean
} // bitsBeyond

/**
 * TLVs (RFC 6929 s2.3; RFC 8044 s3.13): TLV-Type, TLV-Length 3 to 255, TLV-Data; null when they do not divide exactly.
 * @param v the octets
 * @returns the TLVs, or null
 */
function readTlvs(v: readonly number[]): TlvReading[] | null {
  const out: TlvReading[] = []; // the TLVs
  for (let o = 0; o < v.length; ) { // each TLV
    if (v.length - o < 3) return null; // too short for one
    const len = v[o + 1]; // TLV-Length
    if (len < 3 || o + len > v.length) return null; // invalid length
    const data = v.slice(o + 2, o + len); // TLV-Data
    out.push({ type: v[o], length: len, hex: toHex(data), text: printable(data) }); // one TLV
    o += len; // next
  } // TLVs
  return out; // all of them
} // readTlvs

// ----------------------------------------------------------------------------
// Attributes with their own layouts
// ----------------------------------------------------------------------------

/** Tunnel attributes with a fixed Tag and a three-octet Value (RFC 2868 s3.1, s3.2, s3.8). */
const TAG_FIXED = new Set([64, 65, 83]); // Tunnel-Type, Tunnel-Medium-Type, Tunnel-Preference
/** Tunnel attributes whose first octet is a Tag when it is 0x00 to 0x1F (RFC 2868 s3.3, s3.4, s3.6, s3.7, s3.9, s3.10; RFC 3580 s3.31). */
const TAG_OPTIONAL = new Set([66, 67, 81, 82, 90, 91]); // the string tunnel attributes
/** The section of RFC 2868 for each tagged attribute. */
const RFC2868_SECTION: Readonly<Record<number, string>> = { 64: "3.1", 65: "3.2", 66: "3.3", 67: "3.4", 69: "3.5", 81: "3.6", 82: "3.7", 83: "3.8", 90: "3.9", 91: "3.10" }; // by type

/**
 * A blank decoded attribute for a raw one, with IANA's name and data type.
 * @param a the raw attribute
 * @param id its identifier
 * @param name its name
 * @param dataType its data type ("" for none)
 * @returns the attribute, to complete
 */
function shell(a: RawAttr, id: string, name: string | null, dataType: string): DecodedAttribute<EngineText> {
  return { index: a.index, offset: a.offset, type: a.type, id, name, length: a.length, dataType: dataType || null, hex: toHex(a.value), value: null, valueName: null, number: null, tag: null, invalid: null, notes: [], vendor: null, extended: null, tlvs: null, fragmentOf: null, redacted: false }; // the shape, empty
} // shell

/**
 * Copy a value reading into an attribute.
 * @param d the attribute
 * @param r the reading
 * @returns the attribute
 */
function fill(d: DecodedAttribute<EngineText>, r: ValueReading): DecodedAttribute<EngineText> {
  d.value = r.value; d.valueName = r.valueName; d.number = r.number; d.tlvs = r.tlvs; // the reading
  if (r.invalid) d.invalid = r.invalid; // the reason
  d.notes.push(...r.notes); // the notes
  return d; // filled
} // fill

/**
 * Decode one standard-space attribute (the extended ones and the continuation fragments are handled by the caller).
 * @param a the raw attribute
 * @returns the decoded attribute
 */
function decodeStd(a: RawAttr): DecodedAttribute<EngineText> {
  const info = stdInfo(a.type); // IANA's row
  const id = String(a.type); // its identifier
  const d = shell(a, id, info.name, info.dataType); // the attribute
  const v = a.value; // its value octets
  if (info.row !== "assigned") { // no assignment
    d.value = printable(v); // a text reading, at most
    if (info.row === "experimental") d.notes.push(sayT("attr.experimental", "Type {type} is in the range IANA keeps for experimental use (192 to 223): its meaning is local to whoever uses it, so the value is shown as octets.", { type: id })); // 192 to 223
    else if (info.row === "implementation") d.notes.push(sayT("attr.implementation", "Type {type} is in the range IANA keeps for implementation-specific use (224 to 240): its meaning is up to the implementation, so the value is shown as octets.", { type: id })); // 224 to 240
    else if (info.row === "reserved") d.invalid = sayT("attr.reservedType", "Type {type} is reserved in IANA's registry, so the attribute is invalid (RFC 6929, section 2.8) and is shown as octets.", { type: id }); // 247 to 255
    else d.invalid = sayT("attr.unassigned", "IANA's registry assigns no attribute of Type {type}; RFC 6929 (section 2.8) recommends treating an attribute of unknown Type as an invalid attribute, so it is shown as octets.", { type: id }); // unassigned or 0
    return d; // done
  } // not assigned
  switch (a.type) { // the attributes with their own layouts
    case 2: { // User-Password (RFC 2865 s5.2)
      if (v.length < 16 || v.length > 128 || v.length % 16 !== 0) d.invalid = sayT("attr.userPasswordSize", "A User-Password String is 16 to 128 octets, a multiple of 16 (RFC 2865, section 5.2); this one has {got}, so it is an invalid attribute (RFC 6929, section 2.8).", { got: String(v.length) }); // wrong size
      else d.notes.push(sayT("attr.userPassword", "Hidden: the password, padded with zeros to a multiple of 16 octets, is XORed 16 octets at a time with MD5 of the shared secret and the Request Authenticator, then of the shared secret and the previous 16 octets (RFC 2865, section 5.2). These {octets} octets hold a password of {min} to {octets} octets; reading it needs the shared secret, which this tool never asks for.", { octets: String(v.length), min: String(v.length - 15) })); // explained
      return d; // never decrypted
    } // 2
    case 3: { // CHAP-Password (RFC 2865 s5.3)
      if (a.length !== 19) d.invalid = sayT("attr.chapSize", "A CHAP-Password has Length 19, a CHAP Ident and a 16-octet response (RFC 2865, section 5.3); this one has {length}, so it is an invalid attribute (RFC 6929, section 2.8).", { length: String(a.length) }); // wrong size
      else d.notes.push(sayT("attr.chap", "CHAP Ident {ident}, then the 16-octet CHAP response of the user (RFC 2865, section 5.3). The challenge it answers is the CHAP-Challenge attribute when the packet has one, otherwise the Request Authenticator.", { ident: String(v[0]) })); // explained
      return d; // read
    } // 3
    case 69: { // Tunnel-Password (RFC 2868 s3.5)
      if (v.length < 3 || (v.length - 3) % 16 !== 0 || v.length === 3) { d.invalid = sayT("attr.tunnelPasswordSize", "A Tunnel-Password is a Tag, a two-octet Salt and a String that is a multiple of 16 octets, since the plaintext is padded to one before it is encrypted (RFC 2868, section 3.5); these {got} octets do not divide that way, so it is an invalid attribute (RFC 6929, section 2.8).", { got: String(v.length) }); return d; } // wrong size
      d.tag = v[0]; // the Tag
      d.notes.push(sayT("attr.tunnelPassword", "Encrypted: Tag {tag}, Salt 0x{salt}, then {octets} octets holding the password's length, the password and padding, XORed with MD5 of the shared secret, the Request Authenticator of the Access-Request and the Salt (RFC 2868, section 3.5). Reading it needs the shared secret, which this tool never asks for.", { tag: String(v[0]), salt: toHex(v.slice(1, 3)), octets: String(v.length - 3) })); // explained
      if ((v[1] & 0x80) === 0) d.notes.push(say("attr.saltBit", "The Salt's most significant bit is 0, but RFC 2868 (section 3.5) says it MUST be set.")); // the Salt rule
      if (v[0] > 0x1f) d.notes.push(sayT("attr.tagRange", "Tag 0x{tag} is not 0x00 (unused) or 0x01 to 0x1F, the valid values (RFC 2868, section {section}).", { tag: v[0].toString(16).padStart(2, "0"), section: "3.5" })); // tag range
      return d; // never decrypted
    } // 69
    case 80: { // Message-Authenticator (RFC 3579 s3.2)
      if (a.length !== 18) d.invalid = sayT("attr.maSize", "A Message-Authenticator has Length 18, a 16-octet HMAC-MD5 (RFC 3579, section 3.2); this one has {length}, so it is an invalid attribute (RFC 6929, section 2.8).", { length: String(a.length) }); // wrong size
      else d.notes.push(say("attr.ma", "An HMAC-MD5 of the whole packet, keyed with the shared secret and computed with these 16 octets set to zero (RFC 3579, section 3.2). A receiver that holds the secret recomputes it and silently discards the packet when it does not match; this tool has no secret, so it cannot check it.")); // explained
      return d; // read
    } // 80
    case 26: return decodeVsa(a, d); // Vendor-Specific (RFC 2865 s5.26)
  } // special layouts
  if (TAG_FIXED.has(a.type)) { // Tag + three-octet value (RFC 2868)
    if (a.length !== 6) { d.invalid = sayT("attr.taggedSize", "{name} has Length 6, a Tag and a three-octet Value (RFC 2868, section {section}); this one has {length}, so it is an invalid attribute (RFC 6929, section 2.8).", { name: info.name ?? id, section: RFC2868_SECTION[a.type], length: String(a.length) }); d.value = null; return d; } // wrong size
    d.tag = v[0]; // the Tag
    if (v[0] > 0x1f) d.notes.push(sayT("attr.tagRange", "Tag 0x{tag} is not 0x00 (unused) or 0x01 to 0x1F, the valid values (RFC 2868, section {section}).", { tag: v[0].toString(16).padStart(2, "0"), section: RFC2868_SECTION[a.type] })); // tag range
    return fill(d, readValue(info.dataType, [0, ...v.slice(1)], id)); // the three-octet Value as a 32-bit number
  } // fixed tag
  if (TAG_OPTIONAL.has(a.type)) { // an optional Tag before a string (RFC 2868; RFC 3580 s3.31)
    const tagged = v.length > 0 && v[0] <= 0x1f; // a Tag when the first octet is 0x00 to 0x1F
    if (tagged) d.tag = v[0]; // the Tag
    const rest = tagged ? v.slice(1) : v; // the String
    if (rest.length === 0) { d.invalid = sayT("attr.taggedEmpty", "{name} has a Tag but no String, which RFC 2868 says must be present (section {section}), so it is an invalid attribute (RFC 6929, section 2.8).", { name: info.name ?? id, section: RFC2868_SECTION[a.type] }); return d; } // nothing after the Tag
    return fill(d, readValue(info.dataType, rest, id)); // the String
  } // optional tag
  return fill(d, readValue(info.dataType, v, id)); // by data type
} // decodeStd

/**
 * Microsoft's sub-attributes that hold a password, a challenge response or a key (RFC 2548): the MS-CHAP and MS-CHAP-V2
 * responses and password changes, the MPPE keys, the old and new ARAP passwords (s2.6.1, s2.6.2: "DES-encrypted"), and
 * MS-CHAP2-Success (s2.3.3), whose 42-octet authenticator response RFC 2759 computes from the password (s8.7).
 */
const MS_SECRET = new Set([1, 3, 4, 5, 6, 12, 16, 17, 19, 20, 25, 26, 27]); // CHAP responses, encrypted passwords, MPPE keys

/**
 * A Vendor-Specific attribute (RFC 2865 s5.26; RFC 8044 s3.14): the Vendor-Id, then the String, read as the vendor's
 * sub-attributes when it divides into vendor type / vendor length / value fields.
 * @param a the raw attribute
 * @param d the attribute so far
 * @returns the attribute
 */
function decodeVsa(a: RawAttr, d: DecodedAttribute<EngineText>): DecodedAttribute<EngineText> {
  const v = a.value; // Vendor-Id and String
  if (a.length < 7) { d.invalid = sayT("attr.vsaSize", "A Vendor-Specific attribute has Length 7 or more: Type, Length, a four-octet Vendor-Id and at least one octet of String (RFC 2865, section 5.26); this one has {length}, so it is an invalid attribute (RFC 6929, section 2.8).", { length: String(a.length) }); return d; } // too short
  if (v[0] !== 0) d.invalid = sayT("attr.vsaHigh", "The Vendor-Id's high-order octet is {value}; RFC 2865 (section 5.26) has it 0, with the Private Enterprise Number in the low three octets, and RFC 8044 (section 3.14) says a vsa that does not match its format SHOULD be treated as an invalid attribute.", { value: String(v[0]) }); // high octet
  d.vendor = readVendor(uint(v, 0, 4), v.slice(4), d); // the vendor and its sub-attributes
  return d; // read
} // decodeVsa

/**
 * The vendor and its String.
 * @param pen the Private Enterprise Number
 * @param s the String octets
 * @param d the attribute, for its notes
 * @returns the vendor reading
 */
function readVendor(pen: number, s: readonly number[], d: DecodedAttribute<EngineText>): VendorReading<EngineText> {
  const def = VENDORS[pen] ?? null; // a vendor the decoder names?
  const subs: VendorSubReading<EngineText>[] = []; // the sub-attributes
  let fits = s.length >= 2; // whether the String divides into sub-attributes
  for (let o = 0; fits && o < s.length; ) { // each sub-attribute
    const len = s[o + 1]; // vendor length
    if (s.length - o < 2 || len < 2 || o + len > s.length) { fits = false; break; } // does not divide
    subs.push(readSub(def, s[o], len, s.slice(o + 2, o + len), pen)); // one sub-attribute
    o += len; // the next
  } // sub-attributes
  if (!def) d.notes.push(sayT("attr.vendorUnknown", "Private Enterprise Number {pen} is not one of the vendors this tool names; IANA's Private Enterprise Numbers registry gives its owner.", { pen: String(pen) })); // not named
  else if (def.missing === "offline") d.notes.push(sayT("attr.vendorOffline", "{vendor}'s configuration guides are no longer published online, so its sub-attributes are shown by number.", { vendor: def.name })); // Enterasys
  else if (def.missing === "not-read") d.notes.push(sayT("attr.vendorNotRead", "This tool has no sub-attribute list from {vendor}'s documentation, so its sub-attributes are shown by number.", { vendor: def.name })); // not read
  if (!fits) { d.notes.push(say("attr.vsaOctets", "The String does not divide into vendor type, vendor length and value fields, the format RFC 2865 says it SHOULD use (section 5.26), so it is shown as undistinguished octets.")); return { id: pen, name: def?.name ?? null, format: "octets", subs: [] }; } // opaque
  return { id: pen, name: def?.name ?? null, format: "subattributes", subs }; // the reading
} // readVendor

/**
 * One vendor sub-attribute.
 * @param def the vendor, or null
 * @param type the vendor type
 * @param length the vendor length
 * @param v the value octets
 * @param pen the vendor's number
 * @returns the reading
 */
function readSub(def: (typeof VENDORS)[number] | null, type: number, length: number, v: readonly number[], pen: number): VendorSubReading<EngineText> {
  const known = def?.subs[type] ?? null; // the vendor's entry
  const sub: VendorSubReading<EngineText> = { type, length, name: known?.[0] ?? null, dataType: known ? known[1] : null, hex: toHex(v), value: null, notes: [], dhcp: null }; // the shape
  const kind = known?.[1] ?? null; // how to read it
  if (kind === "salted-key") { // RFC 2548 s2.4.2, s2.4.3
    sub.notes.push(sayT("sub.mppe", "Encrypted session key: Salt 0x{salt}, then the key's length, the key and padding, XORed with MD5 of the shared secret, the Request Authenticator and the Salt (RFC 2548, sections 2.4.2 and 2.4.3). Reading it needs the shared secret, which this tool never asks for.", { salt: toHex(v.slice(0, 2)) })); // explained
    return sub; // never decrypted
  } // MPPE keys
  if (kind === "integer") { // four octets
    if (v.length === 4) sub.value = String(uint(v, 0, 4)); // the number
    else if (pen === 2011) sub.notes.push(sayT("sub.sizeHuaweiInteger", "Huawei's table types this sub-attribute integer, which RADIUS writes as four octets, most significant first (RFC 2865, section 5); it has {got}.", { got: String(v.length) })); // Huawei's table gives a type, not a size
    else sub.notes.push(sayT("sub.size", "The vendor's documentation gives this sub-attribute four octets; it has {got}.", { got: String(v.length) })); // wrong size
    if (pen === 2011 && type === 29 && v.length === 4) sub.notes.push(hwPrivilege(uint(v, 0, 4))); // HW-Exec-Privilege (26-29)
    return sub; // read
  } // integer
  if (kind === "ipaddr") { // Huawei's ipaddr: an IPv4 or an IPv6 address by its size
    if (v.length === 4) sub.value = ipv4(v, 0); // IPv4
    else if (v.length === 16) sub.value = ipv6(v, 0); // IPv6, printed per RFC 5952
    else sub.notes.push(sayT("sub.sizeHuaweiIpaddr", "Huawei's table types this sub-attribute ipaddr: four octets are read as an IPv4 address and sixteen as an IPv6 address; it has {got}.", { got: String(v.length) })); // neither size
    if (pen === 2011 && type === 253) sub.notes.push(say("sub.hwFramedIpv6", "Huawei's table describes HW-Framed-IPv6-Address as the \"IPv6 address to be configured for the user\": an address, not a prefix.")); // R29
    return sub; // read
  } // ipaddr
  if (kind === "hex" && pen === 2011 && type === 158) { readHwDhcp(v, sub); return sub; } // HW-DHCP-Option: DHCP options (R29)
  if (kind === "hex") { // Huawei's hex: octets, no text reading
    sub.notes.push(say("sub.hexHuawei", "Huawei's table types this sub-attribute hex: its octets are shown as they are.")); // what hex means here
    return sub; // read
  } // hex
  if (kind === "ipv4addr") { // four octets
    if (v.length === 4) sub.value = ipv4(v, 0); // the address
    else sub.notes.push(sayT("sub.size", "The vendor's documentation gives this sub-attribute four octets; it has {got}.", { got: String(v.length) })); // wrong size
    return sub; // read
  } // address
  if (kind === "text") { sub.value = utf8(v); return sub; } // printable text
  sub.value = printable(v); // string, avpair and undocumented: a text reading when printable
  if (kind === "avpair" && sub.value) { // Cisco's protocol : attribute sep value
    const m = /^([^:=*]{1,64}):([^=*]{1,128})([=*])([\s\S]*)$/.exec(sub.value); // anchored, bounded; the first separator decides
    if (m) sub.notes.push(sayT(m[3] === "=" ? "sub.avpairMandatory" : "sub.avpairOptional", m[3] === "=" ? "Cisco's protocol:attribute sep value format: protocol {protocol}, attribute {attribute}, value {value}; the separator \"=\" makes it mandatory (\"*\" would make it optional)." : "Cisco's protocol:attribute sep value format: protocol {protocol}, attribute {attribute}, value {value}; the separator \"*\" makes it optional (\"=\" would make it mandatory).", { protocol: m[1].trim(), attribute: m[2].trim(), value: m[4].trim() })); // the parts
  } // avpair
  if (kind === "" ) sub.notes.push(say("sub.untyped", "The vendor's table gives this sub-attribute's name but not its data type: the octets are shown, as text when they are printable.")); // undocumented type
  if (!known && pen === 2011) sub.notes.push(sayT("sub.unlistedHuawei", "Vendor type {type} is not in Huawei's table of proprietary RADIUS attributes (Table 1-11 of the S5700 and S6700 V200R025C00 configuration guide), so it is shown as octets.", { type: String(type) })); // not in Huawei's table
  else if (!known && def && def.source) sub.notes.push(sayT("sub.unlisted", "Vendor type {type} is not in the list this tool has from {vendor}'s documentation.", { type: String(type), vendor: def.name })); // not listed
  if (pen === 311 && MS_SECRET.has(type)) sub.notes.push(say("sub.msSecret", "This Microsoft sub-attribute carries a challenge response, an encrypted password or key material (RFC 2548); it is shown as octets.")); // sensitive
  return sub; // read
} // readSub

/**
 * Code, length and value tuples from octets (DHCP options, or Option 82's sub-options): the tuples, or where they stop
 * dividing (the tuple's start, the octets it needs, the octets left).
 * @param v the octets
 * @returns the tuples, or the fault
 */
function tlvs(v: readonly number[]): { ok: true; items: [number, number, number[]][] } | { ok: false; at: number; need: number; left: number } {
  const items: [number, number, number[]][] = []; // [code, length, value]
  for (let o = 0; o < v.length; ) { // each tuple
    if (v.length - o < 2) return { ok: false, at: o, need: 2, left: v.length - o }; // a code with no length octet
    const len = v[o + 1]; // its length
    if (o + 2 + len > v.length) return { ok: false, at: o, need: 2 + len, left: v.length - o }; // runs past the end
    items.push([v[o], len, v.slice(o + 2, o + 2 + len)]); // one tuple
    o += 2 + len; // the next
  } // tuples
  return { ok: true, items }; // all of them
} // tlvs

/** RFC 3046's sub-options of Option 82 (section 2.0, "The initial assignment of DHCP Relay Agent Sub-options"). */
const RFC3046_SUBS: Readonly<Record<number, string>> = Object.freeze({ 1: "Agent Circuit ID", 2: "Agent Remote ID" }); // the two it defines

/**
 * Huawei's HW-DHCP-Option (vendor ID 2011, type 158): "DHCP Option, encapsulated in Type-Length-Value (TLV) format. A
 * packet may contain multiple HW-DHCP-Option attributes to carry Option information." and "Only Option 82 can be
 * delivered." (Table 1-11, read in a browser on 2026-11-08: the site refuses automated reads). Each option is a code, a
 * length and a value; Option 82 is RFC 3046's Relay Agent Information option, whose value is sub-options (s2.0).
 * @param v the value octets
 * @param sub the sub-attribute reading, filled in
 */
function readHwDhcp(v: readonly number[], sub: VendorSubReading<EngineText>): void {
  const opts = tlvs(v); // the options
  if (!opts.ok) { sub.notes.push(sayT("sub.dhcpBad", "Huawei's table describes this value as DHCP options in Type-Length-Value form, but the option starting at octet {at} of the value needs {need, plural, one {{need} octet} other {{need} octets}} and only {left} remain, so the value is shown as octets.", { at: String(opts.at), need: String(opts.need), left: String(opts.left) })); return; } // does not divide
  sub.notes.push(say("sub.dhcpRead", "Read as DHCP options, as Huawei's table describes this value: \"DHCP Option, encapsulated in Type-Length-Value (TLV) format\".")); // how it is read
  sub.dhcp = opts.items.map(([code, length, val]) => { // each option
    const o: DhcpOption = { code, length, name: code === 82 ? "Relay Agent Information" : null, hex: toHex(val), subs: null }; // the shape
    if (code !== 82) { sub.notes.push(sayT("sub.dhcpOnly82", "Option {code} is not Option 82, and Huawei's table says \"Only Option 82 can be delivered.\"", { code: String(code) })); return o; } // not deliverable
    if (length < 2) { sub.notes.push(sayT("sub.dhcp82Short", "Option 82 has length {length}, but RFC 3046 (section 2.0) gives the Relay Agent Information option a minimum length of two, since at least one sub-option must be present, so its value is shown as octets.", { length: String(length) })); return o; } // too short
    const s = tlvs(val); // its sub-options
    if (!s.ok) { sub.notes.push(sayT("sub.dhcp82Bad", "Option 82's value does not divide into the sub-options of RFC 3046 (section 2.0): the sub-option starting at octet {at} of the option's value needs {need, plural, one {{need} octet} other {{need} octets}} and only {left} remain, so the value is shown as octets.", { at: String(s.at), need: String(s.need), left: String(s.left) })); return o; } // does not divide
    o.subs = s.items.map(([sc, sl, sv]) => ({ code: sc, length: sl, name: RFC3046_SUBS[sc] ?? null, hex: toHex(sv), text: printable(sv) })); // the sub-options
    for (const x of o.subs) if (x.name === null) sub.notes.push(sayT("sub.dhcp82Unknown", "Sub-option {code} of Option 82 is not one RFC 3046 defines (section 2.0 assigns 1, Agent Circuit ID, and 2, Agent Remote ID), so its value is shown as octets.", { code: String(x.code) })); // not RFC 3046's
    return o; // read
  }); // options
} // readHwDhcp

/**
 * HW-Exec-Privilege (Huawei vendor ID 2011, type 29), read as Huawei's Table 1-11 describes it: "Privilege level of an
 * administrator (such as a Telnet user). The value ranges from 0 to 15. The priority that is greater than or equal to 16
 * is ineffective." (read in a browser on 2026-11-08: the site refuses automated reads).
 * @param n the level
 * @returns the note
 */
function hwPrivilege(n: number): EngineText {
  return n <= 15 // the documented range
    ? sayT("sub.hwPrivilege", "Privilege level {level} of an administrator, such as a Telnet user: Huawei's table gives HW-Exec-Privilege the range 0 to 15.", { level: String(n) })
    : sayT("sub.hwPrivilegeHigh", "Level {level} is outside the range 0 to 15 that Huawei's table gives HW-Exec-Privilege, and the table says a level \"greater than or equal to 16 is ineffective\".", { level: String(n) }); // ineffective
} // hwPrivilege

/**
 * An extended attribute (types 241 to 244, RFC 6929 s2.1) or a long extended one (245, 246, s2.2), with the data of
 * any later fragments when the More flag says it continues.
 * @param raws every raw attribute
 * @param i this one's position in the list
 * @param cont the continuation map to fill (index of a later fragment -> index of its first)
 * @returns the decoded attribute
 */
function decodeExtended(raws: readonly RawAttr[], i: number, cont: Map<number, number>): DecodedAttribute<EngineText> {
  const a = raws[i]; // this attribute
  const long = a.type >= 245; // the long format
  const container = stdInfo(a.type).name ?? `Type ${a.type}`; // "Extended-Attribute-1"
  const min = long ? 5 : 4; // Type, Length, Extended-Type, (flags,) one octet of data
  if (a.length < min) { // too short to read
    const d = shell(a, String(a.type), container, long ? "long-extended" : "extended"); // the attribute
    d.invalid = sayT("ext.size", "This extended attribute has Length {length}; its format needs at least {min}: Type, Length, Extended-Type{flags} and one octet of data (RFC 6929, sections 2.1 and 2.2), so it is an invalid attribute (section 2.8).", { length: String(a.length), min: String(min), flags: long ? say("ext.flagsWord", ", the M and T flags") : "" }); // too short
    return d; // done
  } // short
  const et = a.value[0]; // Extended-Type
  const more = long ? (a.value[1] & 0x80) !== 0 : null; // M
  const trunc = long ? (a.value[1] & 0x40) !== 0 : null; // T
  let data = a.value.slice(long ? 2 : 1); // Ext-Data
  let fragments = 1; // how many attributes hold the data
  let broken: EngineText | null = null; // a fragmentation fault
  if (more) { // fragmented: More set
    let k = i; // the current fragment
    while (true) { // follow the chain
      const cur = raws[k]; // this fragment
      const curMore = (cur.value[1] & 0x80) !== 0; // its M flag
      if (!curMore) break; // the last fragment
      if (cur.length !== 255) { broken = sayT("ext.moreLength", "The More flag is set, but the Length is {length}, not 255: with More set the Length MUST be 255 (RFC 6929, section 2.2), so the fragmented attribute is invalid.", { length: String(cur.length) }); break; } // the 255 rule
      const nx = raws[k + 1]; // the next attribute
      if (!nx || nx.type !== a.type || nx.length < 4 || nx.value[0] !== et) { broken = say("ext.moreMissing", "The More flag is set, but the next attribute is not a fragment with the same Type and Extended-Type, so the fragmented attribute is an invalid attribute (RFC 6929, section 2.2)."); break; } // the next fragment is missing
      data = [...data, ...nx.value.slice(2)]; // its Ext-Data
      cont.set(k + 1, a.index); // a continuation
      fragments++; // counted
      k++; // on
    } // chain
  } // fragmented
  const info = extInfo(a.type, et); // IANA's row for Type.Extended-Type
  const base = `${a.type}.${et}`; // the dotted identifier
  const extended: ExtendedReading = { container, extType: et, more, truncation: trunc, fragments, vendorType: null }; // the fields
  if (info.dataType === "evs") { // Extended-Vendor-Specific (RFC 6929 s2.4; RFC 8044 s3.17)
    if (data.length < 6) { const d = shell(a, base, info.name, "evs"); d.extended = extended; d.invalid = sayT("ext.evsSize", "An Extended-Vendor-Specific value is at least 6 octets, a four-octet Vendor-Id, a Vendor-Type and data (RFC 8044, section 3.17); this one has {got}, so it is an invalid attribute (RFC 6929, section 2.8).", { got: String(data.length) }); return d; } // too short
    const pen = uint(data, 0, 4); // Vendor-Id
    const vt = data[4]; // Vendor-Type
    const d = shell(a, `${base}.${pen}.${vt}`, info.name, "evs"); // 241.26.1.4, named Extended-Vendor-Specific-N by IANA
    d.hex = toHex(data); // the reassembled data
    d.extended = { ...extended, vendorType: vt }; // with the Vendor-Type
    const def = VENDORS[pen] ?? null; // a vendor the decoder names?
    d.vendor = { id: pen, name: def?.name ?? null, format: "octets", subs: [] }; // the vendor
    d.value = printable(data.slice(5)); // EVS-Data, as text when printable
    if (!def) d.notes.push(sayT("attr.vendorUnknown", "Private Enterprise Number {pen} is not one of the vendors this tool names; IANA's Private Enterprise Numbers registry gives its owner.", { pen: String(pen) })); // not named
    d.notes.push(say("ext.evsData", "The vendor defines what its Vendor-Type means and how its data is encoded (RFC 8044, section 3.17); the data is shown as octets, and as text when it is printable.")); // what EVS-Data is
    if (fragments > 1) d.notes.push(sayT("ext.fragments", "Reassembled from {n} fragments: the More flag is set on every fragment but the last, and the data is their Ext-Data fields joined in order (RFC 6929, section 2.2).", { n: String(fragments) })); // reassembled
    if (broken) d.invalid = broken; // a fault in the chain
    return d; // done
  } // EVS
  const d = shell(a, base, info.name, info.dataType); // the attribute
  d.extended = extended; // its fields
  d.hex = toHex(data); // the (reassembled) data
  if (info.row === "reserved") { d.invalid = sayT("ext.reserved", "Extended-Type {ext} is reserved (241 to 255 are, RFC 8044 section 3.15), so the attribute is invalid (RFC 6929, section 2.8).", { ext: String(et) }); d.value = printable(data); } // reserved: octets, as text when printable
  else if (info.row === "unassigned") { d.invalid = sayT("ext.unassigned", "IANA's registry assigns nothing at {id}; RFC 6929 (section 2.8) recommends treating an attribute of unknown Extended-Type as an invalid attribute.", { id: base }); d.value = printable(data); } // unassigned: the same
  else fill(d, readValue(info.dataType, data, base)); // an assignment: by its data type
  if (fragments > 1) d.notes.push(sayT("ext.fragments", "Reassembled from {n} fragments: the More flag is set on every fragment but the last, and the data is their Ext-Data fields joined in order (RFC 6929, section 2.2).", { n: String(fragments) })); // reassembled
  if (trunc) d.notes.push(say("ext.truncation", "The T (Truncation) flag is set: this chunk is intentionally truncated and continues in a later one (RFC 8044, section 3.16).")); // truncated
  if (broken) d.invalid = broken; // a fault in the chain
  return d; // done
} // decodeExtended

/**
 * Decode every attribute of a list.
 * @param raws the raw attributes
 * @returns the decoded ones
 */
function decodeAll(raws: readonly RawAttr[]): DecodedAttribute<EngineText>[] {
  const cont = new Map<number, number>(); // later fragments -> their first
  const out: DecodedAttribute<EngineText>[] = []; // the attributes
  for (let i = 0; i < raws.length; i++) { // each one
    const a = raws[i]; // this attribute
    if (cont.has(i)) { // a later fragment of a long extended attribute
      const d = shell(a, `${a.type}.${a.value[0]}`, extInfo(a.type, a.value[0]).name, ""); // its identity
      d.fragmentOf = cont.get(i) ?? null; // which attribute it continues
      d.notes.push(sayT("ext.fragmentOf", "A later fragment of attribute {first}: its data is read there.", { first: String(d.fragmentOf) })); // read with the first
      out.push(d); // listed
      continue; // next
    } // continuation
    out.push(a.type >= 241 && a.type <= 246 ? decodeExtended(raws, i, cont) : decodeStd(a)); // extended or standard
  } // attributes
  return out; // decoded
} // decodeAll

// ----------------------------------------------------------------------------
// Packet-level readings: EAP, VLAN, the RFC examples, secrets
// ----------------------------------------------------------------------------

/**
 * The EAP packet the EAP-Message attributes carry (RFC 3579 s3.1; RFC 3748 s4), with its warnings.
 * @param raws the raw attributes
 * @param warnings where warnings go
 * @returns the reading, or null when there is no EAP-Message
 */
function readEap(raws: readonly RawAttr[], warnings: EngineText[]): EapReading | null {
  const eaps = raws.filter((a) => a.type === 79); // the EAP-Message attributes
  if (eaps.length === 0) return null; // none
  const consecutive = eaps.every((a, k) => k === 0 || a.index === eaps[k - 1].index + 1); // in a row?
  if (!consecutive) warnings.push(say("warn.eapSplit", "The EAP-Message attributes are not consecutive: when there are several, they MUST be in order and consecutive (RFC 3579, section 3.1). The EAP packet below joins them in the order they appear.")); // split
  const data = eaps.flatMap((a) => a.value); // joined
  const r: EapReading = { attributes: eaps.length, consecutive, hex: toHex(data), code: null, codeName: null, identifier: null, length: null, type: null, typeName: null, identity: null }; // the shape
  if (data.length < 4) { warnings.push(sayT("warn.eapShort", "The EAP-Message data is {octets, plural, one {{octets} octet} other {{octets} octets}}, shorter than an EAP header: Code, Identifier and a two-octet Length (RFC 3748, section 4).", { octets: String(data.length) })); return r; } // too short
  r.code = data[0]; r.identifier = data[1]; r.length = uint(data, 2, 2); // the header
  const cn = rowName(EAP_CODES, data[0]); // IANA's name
  r.codeName = cn && !PLACEHOLDER.test(cn) ? cn : null; // assigned only
  if (r.codeName === null) warnings.push(sayT("warn.eapCode", "EAP Code {code} is not one IANA's EAP registry assigns; RFC 3748 (section 4) has EAP packets with codes it does not define silently discarded.", { code: String(data[0]) })); // unknown code
  if (r.length > data.length) warnings.push(sayT("warn.eapLength", "The EAP Length says {length}, but the EAP-Message attributes hold {octets, plural, one {{octets} octet} other {{octets} octets}}: an EAP message with a Length larger than the octets received MUST be silently discarded (RFC 3748, section 4).", { length: String(r.length), octets: String(data.length) })); // too long
  else if (r.length < data.length) warnings.push(sayT("warn.eapPadding", "The EAP Length says {length}, and the EAP-Message attributes hold {octets, plural, one {{octets} octet} other {{octets} octets}}: octets beyond the Length are padding and are ignored (RFC 3748, section 4).", { length: String(r.length), octets: String(data.length) })); // padding
  if ((data[0] === 1 || data[0] === 2) && r.length >= 5 && data.length >= 5) { // a Request or Response has a Type
    r.type = data[4]; // the Type
    const tn = rowName(EAP_TYPES, data[4]); // IANA's name
    r.typeName = tn && !PLACEHOLDER.test(tn) && tn !== "Allocated" ? tn : null; // assigned only
    if (data[4] === 1) r.identity = utf8(data.slice(5, Math.min(r.length, data.length))); // an Identity's type-data
  } // typed
  return r; // read
} // readEap

/**
 * VLAN assignment (RFC 3580 s3.31): Tunnel-Type VLAN (13), Tunnel-Medium-Type 802 (6) and Tunnel-Private-Group-ID,
 * with the same Tag.
 * @param attrs the decoded attributes
 * @returns the reading, or null
 */
function readVlan(attrs: readonly DecodedAttribute<EngineText>[]): VlanReading | null {
  for (const t of attrs) { // each Tunnel-Type
    if (t.type !== 64 || t.number !== "13" || t.invalid) continue; // VLAN only
    const m = attrs.find((x) => x.type === 65 && x.number === "6" && x.tag === t.tag && !x.invalid); // 802, same Tag
    const g = attrs.find((x) => x.type === 81 && (x.tag ?? 0) === t.tag && x.value !== null && !x.invalid); // the group, same Tag
    if (!m || !g || g.value === null) continue; // incomplete
    const n = /^[0-9]{1,4}$/.test(g.value) ? Number(g.value) : NaN; // a decimal VLAN ID?
    return { group: g.value, tag: t.tag ?? 0, vlanId: n >= 1 && n <= 4094 ? n : null }; // the reading
  } // Tunnel-Types
  return null; // none
} // readVlan

/**
 * Which RFC example the octets are, if any.
 * @param b the octets
 * @returns the example's id, or null
 */
export function exampleOf(b: readonly number[]): string | null {
  const h = toHex(b); // as hex
  for (const [id, ex] of Object.entries(RFC_EXAMPLES)) if (ex.hex.replace(/\s+/g, "").toLowerCase() === h) return id; // the same octets
  return null; // not an example
} // exampleOf

/**
 * Whether an attribute holds a hidden password, a CHAP response or an encrypted key.
 * @param attrs the decoded attributes
 * @returns true when one does
 */
function holdsSecret(attrs: readonly DecodedAttribute<EngineText>[]): boolean {
  return attrs.some((a) => [2, 3, 69, 70].includes(a.type) || (a.vendor?.id === 311 && a.vendor.subs.some((s) => MS_SECRET.has(s.type)))); // User-, CHAP-, Tunnel-, ARAP-Password; Microsoft's
} // holdsSecret

// ----------------------------------------------------------------------------
// Which attributes a packet type may carry (warnings)
// ----------------------------------------------------------------------------

/** An occurrence rule of an RFC's table of attributes. */
type Rule = "0" | "0+" | "0-1" | "1"; // MUST NOT, any, at most one, exactly one

/** One table: its RFC and section, the codes it covers (in column order), and rows of attribute -> rules. */
interface Table {
  /** The RFC. */
  rfc: string;
  /** The section. */
  section: string;
  /** The packet codes of its columns. */
  codes: readonly number[];
  /** Attribute type -> rule per column. */
  rows: Readonly<Record<number, readonly Rule[]>>;
}

/** Expand "a b c" into a rule list. */
const R = (s: string): Rule[] => s.split(" ") as Rule[]; // one rule per column

/** RFC 2865 section 5.44: Access-Request, Access-Accept, Access-Reject, Access-Challenge. */
const T2865: Table = { rfc: "RFC 2865", section: "5.44", codes: [1, 2, 3, 11], rows: {
  1: R("0-1 0-1 0 0"), 2: R("0-1 0 0 0"), 3: R("0-1 0 0 0"), 4: R("0-1 0 0 0"), 5: R("0-1 0 0 0"), 6: R("0-1 0-1 0 0"), 7: R("0-1 0-1 0 0"), 8: R("0-1 0-1 0 0"), // 1 to 8
  9: R("0-1 0-1 0 0"), 10: R("0 0-1 0 0"), 11: R("0 0+ 0 0"), 12: R("0-1 0-1 0 0"), 13: R("0+ 0+ 0 0"), 14: R("0+ 0+ 0 0"), 15: R("0 0-1 0 0"), 16: R("0 0-1 0 0"), // 9 to 16
  18: R("0 0+ 0+ 0+"), 19: R("0-1 0-1 0 0"), 20: R("0 0-1 0 0"), 22: R("0 0+ 0 0"), 23: R("0 0-1 0 0"), 24: R("0-1 0-1 0 0-1"), 25: R("0 0+ 0 0"), 26: R("0+ 0+ 0 0+"), // 18 to 26
  27: R("0 0-1 0 0-1"), 28: R("0 0-1 0 0-1"), 29: R("0 0-1 0 0"), 30: R("0-1 0 0 0"), 31: R("0-1 0 0 0"), 32: R("0-1 0 0 0"), 33: R("0+ 0+ 0+ 0+"), 34: R("0-1 0-1 0 0"), // 27 to 34
  35: R("0-1 0-1 0 0"), 36: R("0-1 0-1 0 0"), 37: R("0 0-1 0 0"), 38: R("0 0+ 0 0"), 39: R("0 0-1 0 0"), 60: R("0-1 0 0 0"), 61: R("0-1 0 0 0"), 62: R("0-1 0-1 0 0"), 63: R("0-1 0-1 0 0"), // 35 to 63
} }; // the table as printed

/** RFC 2866 section 5.13: Accounting-Request. */
const T2866: Table = { rfc: "RFC 2866", section: "5.13", codes: [4], rows: {
  1: R("0-1"), 2: R("0"), 3: R("0"), 4: R("0-1"), 5: R("0-1"), 6: R("0-1"), 7: R("0-1"), 8: R("0-1"), 9: R("0-1"), 10: R("0-1"), 11: R("0+"), 12: R("0-1"), 13: R("0+"), 14: R("0+"), 15: R("0-1"), 16: R("0-1"), // 1 to 16
  18: R("0"), 19: R("0-1"), 20: R("0-1"), 22: R("0+"), 23: R("0-1"), 24: R("0"), 25: R("0+"), 26: R("0+"), 27: R("0-1"), 28: R("0-1"), 29: R("0-1"), 30: R("0-1"), 31: R("0-1"), 32: R("0-1"), 33: R("0+"), // 18 to 33
  34: R("0-1"), 35: R("0-1"), 36: R("0-1"), 37: R("0-1"), 38: R("0-1"), 39: R("0-1"), 40: R("1"), 41: R("0-1"), 42: R("0-1"), 43: R("0-1"), 44: R("1"), 45: R("0-1"), 46: R("0-1"), 47: R("0-1"), 48: R("0-1"), // 34 to 48
  49: R("0-1"), 50: R("0+"), 51: R("0+"), 60: R("0"), 61: R("0-1"), 62: R("0-1"), 63: R("0-1"), // 49 to 63
} }; // the table as printed

/** RFC 2868 section 4: the tunnel attributes, in Access-Request, -Accept, -Reject, -Challenge and Accounting-Request. */
const T2868: Table = { rfc: "RFC 2868", section: "4", codes: [1, 2, 3, 11, 4], rows: {
  64: R("0+ 0+ 0 0 0-1"), 65: R("0+ 0+ 0 0 0-1"), 66: R("0+ 0+ 0 0 0-1"), 67: R("0+ 0+ 0 0 0-1"), 69: R("0 0+ 0 0 0"), // 64 to 69
  81: R("0+ 0+ 0 0 0-1"), 82: R("0 0+ 0 0 0-1"), 83: R("0+ 0+ 0 0 0"), 90: R("0+ 0+ 0 0 0-1"), 91: R("0+ 0+ 0 0 0-1"), // 81 to 91
} }; // the table as printed

/** RFC 3162 section 3: the IPv6 attributes, in the same five packet types. */
const T3162: Table = { rfc: "RFC 3162", section: "3", codes: [1, 2, 3, 11, 4], rows: {
  95: R("0-1 0 0 0 0-1"), 96: R("0-1 0-1 0 0 0-1"), 97: R("0+ 0+ 0 0 0+"), 98: R("0+ 0+ 0 0 0+"), 99: R("0 0+ 0 0 0+"), 100: R("0 0-1 0 0 0-1"), // 95 to 100
} }; // the table as printed

/** RFC 2869 section 5.19: Message-Authenticator at most once (the rest of that table is not applied). */
const T2869: Table = { rfc: "RFC 2869", section: "5.19", codes: [1, 2, 3, 11], rows: { 80: R("0-1 0-1 0-1 0-1") } }; // one row

/** RFC 3579 section 3.3: packets that carry EAP-Message (EAP-Message and Message-Authenticator are checked on their own). */
const T3579: Table = { rfc: "RFC 3579", section: "3.3", codes: [1, 2, 3, 11], rows: {
  1: R("0-1 0-1 0 0"), 2: R("0 0 0 0"), 3: R("0 0 0 0"), 18: R("0 0 0 0"), 60: R("0 0 0 0"), 70: R("0 0 0 0"), 75: R("0 0 0 0"), 94: R("0-1 0 0 0"), 101: R("0 0 0-1 0-1"), // the rows that differ
} }; // the table as printed

/** RFC 3579 section 3.3: EAP-Message and Message-Authenticator MUST NOT be in an Accounting-Request. */
const T3579ACCT: Table = { rfc: "RFC 3579", section: "3.3", codes: [4], rows: { 79: R("0"), 80: R("0") } }; // the sentence above the table

/** RFC 5997 section 5: Status-Server. */
const T5997: Table = { rfc: "RFC 5997", section: "5", codes: [12], rows: {
  1: R("0"), 2: R("0"), 3: R("0"), 4: R("0-1"), 18: R("0"), 26: R("0+"), 32: R("0-1"), 79: R("0"), 80: R("1"), 95: R("0-1"), // the listed rows
  ...Object.fromEntries(Array.from({ length: 19 }, (_, k) => [103 + k, R("0")])), // 103 to 121, Digest-*
} }; // the table as printed

/**
 * The warnings the tables give for a packet.
 * @param code the Code
 * @param attrs the decoded attributes (later fragments not counted)
 * @param eap whether the packet carries EAP-Message
 * @returns the warnings
 */
function tableWarnings(code: number, attrs: readonly DecodedAttribute<EngineText>[], eap: boolean): EngineText[] {
  const rules = new Map<number, { rule: Rule; rfc: string; section: string }>(); // attribute -> the rule that applies
  for (const t of [T2865, T2866, T2868, T3162, T2869, T3579ACCT, T5997, ...(eap ? [T3579] : [])]) { // later tables override earlier ones
    const col = t.codes.indexOf(code); // this packet type's column
    if (col < 0) continue; // not covered
    for (const [k, rs] of Object.entries(t.rows)) rules.set(Number(k), { rule: rs[col], rfc: t.rfc, section: t.section }); // the rule
  } // tables
  const counts = new Map<number, number>(); // attribute -> occurrences
  for (const a of attrs) if (a.fragmentOf === null) counts.set(a.type, (counts.get(a.type) ?? 0) + 1); // counted
  const out: EngineText[] = []; // the warnings
  const nameOf = (t: number) => label(stdInfo(t).name, String(t)); // the attribute as an argument
  for (const [t, { rule, rfc, section }] of [...rules].sort((x, y) => x[0] - y[0])) { // in type order
    const n = counts.get(t) ?? 0; // how many
    if (code === 12 && t === 80 && n === 0) continue; // a Status-Server without Message-Authenticator gets its own, plainer warning (packetWarnings)
    const args = { label: nameOf(t), n: String(n), rfc, section }; // the sentence's values
    if (rule === "0" && n > 0) out.push(sayT("warn.mustNot", "{label} is present, but {rfc}'s table of attributes (section {section}) says it MUST NOT be in this packet type.", args)); // forbidden
    else if (rule === "0-1" && n > 1) out.push(sayT("warn.atMostOne", "{label} appears {n} times, but {rfc}'s table of attributes (section {section}) allows at most one in this packet type.", args)); // too many
    else if (rule === "1" && n !== 1) out.push(sayT("warn.exactlyOne", "This packet type needs exactly one {label} ({rfc}, table of attributes in section {section}); it has {n}.", args)); // not exactly one
  } // rules
  return out; // the warnings
} // tableWarnings

// ----------------------------------------------------------------------------
// The readings
// ----------------------------------------------------------------------------

/**
 * The checks that need the packet type, as warnings.
 * @param code the Code
 * @param attrs the decoded attributes
 * @param warnings where they go
 */
function packetWarnings(code: number, attrs: readonly DecodedAttribute<EngineText>[], warnings: EngineText[]): void {
  const has = (t: number) => attrs.some((a) => a.type === t && a.fragmentOf === null); // present?
  const eap = has(79); // EAP in the packet
  warnings.push(...tableWarnings(code, attrs, eap)); // the tables
  if (code === 1) { // Access-Request (RFC 2865 s4.1)
    if (!has(4) && !has(32) && !has(95)) warnings.push(say("warn.reqNas", "An Access-Request MUST contain a NAS-IP-Address or a NAS-Identifier (RFC 2865, section 4.1), or a NAS-IPv6-Address (RFC 3162, section 2.1); this one has none of them.")); // NAS identity
    const kinds = [2, 3, 70, 79].filter(has); // the credential attributes present
    if (kinds.length === 0 && !has(24)) warnings.push(say("warn.reqCredential", "An Access-Request MUST contain a User-Password, a CHAP-Password or a State (RFC 2865, section 4.1), or another kind of authentication information such as EAP-Message (RFC 3579); this one has none of them.")); // nothing to authenticate with
    if (kinds.length > 1) warnings.push(sayT("warn.reqKinds", "An Access-Request MUST NOT contain more than one of User-Password, CHAP-Password, ARAP-Password and EAP-Message (RFC 3579, section 3.3, Note 1); this one has {list}.", { list: kinds.map((t) => stdInfo(t).name ?? String(t)).join(", ") })); // two kinds
    if (!eap && !has(80)) warnings.push(say("warn.reqNoMa", "This Access-Request has no Message-Authenticator. RFC 2865 as published does not ask for one, and RFC 3579 makes it optional without EAP-Message (section 3.2): the requirement comes from CVE-2024-3596 and from draft-ietf-radext-deprecating-radius, an Internet-Draft (revision 10 of 3 July 2026), not an RFC. RFC 2865 erratum 9034 records it for readers, \"Access-Request packets MUST contain a Message-Authenticator attribute\", with the status Held for Document Update (since 26 August 2026), not Verified.")); // BlastRADIUS: a warning, its status stated
  } // 1
  if (eap && [1, 2, 3, 11].includes(code) && !has(80)) warnings.push(say("warn.eapNoMa", "This packet carries EAP-Message but no Message-Authenticator: one MUST protect every Access-Request, Access-Challenge, Access-Accept and Access-Reject that contains an EAP-Message, and a receiver SHOULD silently discard the packet without it (RFC 3579, section 3.1).")); // RFC 3579 s3.1
  if (code === 4 && !has(4) && !has(32)) warnings.push(say("warn.acctNas", "An Accounting-Request MUST contain a NAS-IP-Address or a NAS-Identifier, or both (RFC 2866, sections 4.1 and 5.13); this one has neither.")); // RFC 2866 s4.1
  if (code === 5) { // Accounting-Response (RFC 2866 s5.13)
    const extra = [...new Set(attrs.filter((a) => a.type !== 33 && a.type !== 26).map((a) => a.name ?? String(a.type)))]; // anything else
    if (extra.length) warnings.push(sayT("warn.acctResponse", "RFC 2866 (section 5.13) says no attributes should be in an Accounting-Response except Proxy-State and possibly Vendor-Specific; this one has {list}.", { list: extra.join(", ") })); // extra attributes
  } // 5
  if (code === 12 && !has(80)) warnings.push(say("warn.statusNoMa", "A Status-Server packet MUST include a Message-Authenticator, without which it could be trivially spoofed (RFC 5997, section 3); this one has none.")); // RFC 5997 s3
} // packetWarnings

/**
 * The Authenticator's kind for a Code.
 * @param code the Code
 * @returns the kind and the note that explains it
 */
function authenticatorOf(code: number): { kind: AuthenticatorKind; note: EngineText } {
  if (code === 1) return { kind: "request-random", note: say("note.authRequest", "In an Access-Request the Authenticator is the Request Authenticator, a 16-octet random number that SHOULD be unpredictable and unique over the lifetime of a shared secret; it is also the input that hides User-Password (RFC 2865, section 3).") }; // RFC 2865 s3
  if (code === 12) return { kind: "request-random", note: say("note.authStatus", "In a Status-Server packet the Authenticator is a 16-octet random Request Authenticator, made as in an Access-Request (RFC 5997, section 3).") }; // RFC 5997 s3
  if (code === 2 || code === 3 || code === 11) return { kind: "response", note: say("note.authResponse", "In a reply the Authenticator is the Response Authenticator: MD5 over the Code, Identifier, Length, the request's Request Authenticator, the reply's attributes and the shared secret (RFC 2865, section 3). Checking it needs the request and the shared secret; this tool asks for neither.") }; // RFC 2865 s3
  if (code === 4) return { kind: "request-md5", note: say("note.authAcctRequest", "In an Accounting-Request the Request Authenticator is MD5 over the Code, Identifier, Length, 16 zero octets, the attributes and the shared secret (RFC 2866, section 3); checking it needs the shared secret, which this tool never asks for.") }; // RFC 2866 s3
  if (code === 5) return { kind: "response", note: say("note.authAcctResponse", "In an Accounting-Response the Authenticator is the Response Authenticator: MD5 over the Code, Identifier, Length, the request's Request Authenticator, the reply's attributes and the shared secret (RFC 2866, section 3).") }; // RFC 2866 s3
  if (code === 40 || code === 43) return { kind: "request-md5", note: say("note.authDynRequest", "In a Disconnect-Request or a CoA-Request the Request Authenticator is computed as for an Accounting-Request, and the request goes to UDP port 3799 (RFC 5176, section 2.3).") }; // RFC 5176 s2.3
  if (code >= 41 && code <= 45) return { kind: "response", note: say("note.authDynResponse", "In a Disconnect-ACK, Disconnect-NAK, CoA-ACK or CoA-NAK the Authenticator is the Response Authenticator, over the reply and the request's Request Authenticator (RFC 5176, section 2.3).") }; // RFC 5176 s2.3
  return { kind: "unknown", note: sayT("note.authOther", "This tool does not know how the Authenticator of Code {code} is formed; it shows the 16 octets as they are.", { code: String(code) }) }; // anything else
} // authenticatorOf

/**
 * The notes every reading shares: the RFC example, the VLAN, the EAP pass-through.
 * @param example the RFC example id, or null
 * @param vlan the VLAN reading, or null
 * @param eap the EAP reading, or null
 * @param notes where they go
 * @param warnings where warnings go
 */
function commonNotes(example: string | null, vlan: VlanReading | null, eap: EapReading | null, notes: EngineText[], warnings: EngineText[]): void {
  if (example) { // an RFC example
    const ex = RFC_EXAMPLES[example]; // its record
    notes.push(ex.secret // the shared secret the RFC computed it with, when it says
      ? sayT("note.example", "These are the octets of an example in {rfc}, section {section}, which the RFC computed with the shared secret \"{secret}\".", { rfc: ex.rfc, section: ex.section, secret: ex.secret })
      : sayT("note.exampleNoSecret", "These are the octets of an example in {rfc}, section {section}.", { rfc: ex.rfc, section: ex.section })); // the source
    if (example === "rfc2865-7.2-accept") notes.push(say("note.erratum1469", "RFC 2865 verified erratum 1469: this example's text says Framed-Routing None (0), but its octets carry 2, Listen for routing packets; the decoder reads the octets.")); // the erratum
    if (example === "rfc2865-7.3-request-2-corrected") notes.push(say("note.erratum6486", "These are the octets as RFC 2865 verified erratum 6486 corrects them: State's Length is 0x0a, where the RFC as published printed 0x10.")); // the corrected octets
    if (example.startsWith("rfc6929-")) notes.push(say("note.rfc6929", "RFC 6929 says its examples show the format of the attributes, not a consistent meaning: read against IANA's registry as it stands, some of them are invalid attributes.")); // the RFC's own caveat (section 9)
    if (example === "rfc5997-6.2-reply") notes.push(say("note.rfc5997reply", "RFC 5997's text calls this reply an Accounting-Response (5), but its first octet is 02, Access-Accept. Its Response Authenticator is the MD5 the RFC describes taken over Code 5 with the RFC's shared secret, so the 02 is the misprint; the RFC Editor listed no erratum on it on 2026-11-08.")); // a discrepancy, settled by the RFC's own octets
  } // example
  if (vlan) notes.push(vlan.tag // VLAN assignment (RFC 3580 s3.31)
    ? sayT("note.vlanTagged", "VLAN assignment as RFC 3580 describes it (section 3.31): Tunnel-Type VLAN (13), Tunnel-Medium-Type 802 (6) and Tunnel-Private-Group-ID \"{group}\", all with Tag {tag}.", { group: vlan.group, tag: String(vlan.tag) })
    : sayT("note.vlan", "VLAN assignment as RFC 3580 describes it (section 3.31): Tunnel-Type VLAN (13), Tunnel-Medium-Type 802 (6) and Tunnel-Private-Group-ID \"{group}\".", { group: vlan.group }));
  if (vlan && vlan.vlanId === null && /^[0-9]+$/.test(vlan.group)) warnings.push(sayT("warn.vlanRange", "Tunnel-Private-Group-ID \"{group}\" is not a VLAN ID: RFC 3580 (section 3.31) carries a VLAN ID from 1 to 4094 as its decimal string.", { group: vlan.group })); // a number out of range
  if (vlan && vlan.vlanId === null && !/^[0-9]+$/.test(vlan.group)) notes.push(sayT("note.vlanName", "Tunnel-Private-Group-ID \"{group}\" is not a number: RFC 3580 (section 3.31) carries a VLAN ID from 1 to 4094 as its decimal string; whether a switch also accepts a VLAN name is up to the switch.", { group: vlan.group })); // a name
  if (eap) notes.push(say("note.eap", "The NAS passes the EAP packet through without understanding the method (RFC 3579, section 3.1): the conversation inside is between the supplicant and the server.")); // pass-through
} // commonNotes

/**
 * A whole packet.
 * @param b the octets
 * @param format how they were written
 * @returns the reading
 */
function decodePacket(b: number[], format: InputFormat, redacted: boolean): PacketResult<EngineText> {
  if (b.length < HEADER_OCTETS) { // shorter than the header
    refuseOtherProtocols(b); // a TACACS+ header fits in 12
    throw inputError(sayT("err.short", "These are {octets, plural, one {{octets} octet} other {{octets} octets}}; a RADIUS packet has at least 20: Code (1), Identifier (1), Length (2) and the Authenticator (16) (RFC 2865, section 3). If they are attributes without the header, choose Attributes only.", { octets: String(b.length) })); // too short
  } // short
  refuseOtherProtocols(b); // a frame, an IP packet, TACACS+
  const code = b[0]; // Code
  const identifier = b[1]; // Identifier
  const length = uint(b, 2, 2); // Length
  if (length < HEADER_OCTETS) throw inputError(sayT("err.lengthSmall", "The Length field says {length}, below the minimum of 20 (RFC 2865, section 3): the header alone takes 20 octets.", { length: String(length) })); // too small
  if (length > MAX_OCTETS) throw inputError(sayT("err.lengthLarge", "The Length field says {length}, above the maximum of 4096 (RFC 2865, section 3).", { length: String(length) })); // too large
  if (length > b.length) throw inputError(sayT("err.truncated", "The Length field says {length} octets, but only {octets} were given: the packet is shorter than its Length, and a receiver MUST silently discard it (RFC 2865, section 3). The capture may be cut short.", { length: String(length), octets: String(b.length) })); // truncated
  const raws = walk(b, HEADER_OCTETS, length); // the attributes, or a refusal
  const attributes = decodeAll(raws); // decoded
  const ci = codeInfo(code); // IANA's row
  const auth = authenticatorOf(code); // what the Authenticator is
  const warnings: EngineText[] = []; // in order
  const notes: EngineText[] = []; // in order
  if (ci.row === "unassigned" || ci.row === "unlisted") warnings.push(sayT("warn.codeUnassigned", "Code {code} is not assigned in IANA's RADIUS Packet Type Codes registry; a receiver silently discards a packet with an invalid Code (RFC 2865, section 3).", { code: String(code) })); // invalid Code
  if (ci.row === "reserved") warnings.push(sayT("warn.codeReserved", "Code {code} is reserved in IANA's RADIUS Packet Type Codes registry; a receiver silently discards a packet with an invalid Code (RFC 2865, section 3).", { code: String(code) })); // reserved
  if (ci.row === "experimental") notes.push(sayT("note.codeExperimental", "Code {code} is in the range IANA keeps for experimental use (250 to 253).", { code: String(code) })); // experimental
  if ((code === 4 || code === 5) && length > 4095) warnings.push(say("warn.acctMax", "An accounting packet is at most 4095 octets (RFC 2866, section 3); this one's Length is 4096.")); // RFC 2866 s3
  if (length < b.length) warnings.push(sayT("warn.padding", "{n, plural, one {{n} octet follows} other {{n} octets follow}} the end the Length field gives ({length}): RFC 2865 (section 3) has them treated as padding and ignored, so they are not decoded.", { n: String(b.length - length), length: String(length) })); // padding
  packetWarnings(code, attributes, warnings); // the packet type's rules
  for (const a of attributes) if (a.invalid) warnings.push(sayT("warn.invalidAttr", "Attribute {index}, {label}, is an invalid attribute; RFC 6929 (section 2.8) says a receiver SHOULD silently discard it, and MUST NOT discard the whole packet for it.", { index: String(a.index), label: label(a.name, a.id) })); // invalid attributes
  const eap = readEap(raws, warnings); // the EAP packet
  const vlan = readVlan(attributes); // VLAN assignment
  const example = exampleOf(b); // an RFC example?
  const marks = redacted ? markRedacted(b, raws, attributes, { code, length }) : { authenticator: false, padding: 0, any: false }; // a Share results copy's zeroed fields (the page says where it came from, above the reading)
  notes.push(auth.note); // the Authenticator
  if (marks.authenticator) notes.push(say("note.redactedAuthenticator", "Redacted in this link: the Authenticator is 16 zero octets, since the original is an MD5 with the shared secret, against which a reader could test guesses of the secret offline.")); // the header field
  if (marks.padding > 0) notes.push(sayT("note.redactedPadding", "Redacted in this link: {n, plural, one {the {n} octet after the Length is zero, since this tool does not read it and cannot tell what it held} other {the {n} octets after the Length are zeros, since this tool does not read them and cannot tell what they held}}.", { n: String(marks.padding) })); // the padding
  commonNotes(example, vlan, eap, notes, warnings); // example, VLAN, EAP
  return {
    mode: "packet", // the mode
    format, // hex or dump
    octets: b.length, // given
    header: { code, codeName: ci.name, codeRow: ci.row, identifier, length, authenticator: toHex(b.slice(4, 20)), authenticatorKind: auth.kind, authenticatorRedacted: marks.authenticator }, // the header
    padding: b.length - length, // beyond the Length
    paddingRedacted: marks.padding > 0, // zeroed by a Share results copy
    attributes, // decoded
    eap, // EAP
    vlan, // VLAN
    example, // RFC example
    holdsSecret: holdsSecret(attributes), // for Share results
    warnings, // warnings
    notes, // notes
  }; // the reading
} // decodePacket

/**
 * Attributes without the header.
 * @param b the octets
 * @param format how they were written
 * @returns the reading
 */
function decodeAttributes(b: number[], format: InputFormat, redacted: boolean): AttributesResult<EngineText> {
  const raws = walk(b, 0, b.length); // the attributes, or a refusal
  const attributes = decodeAll(raws); // decoded
  const warnings: EngineText[] = []; // in order
  if (redacted) markRedacted(b, raws, attributes, null); // a Share results copy's zeroed fields, marked on the attributes
  const notes: EngineText[] = [say("note.attributesMode", "Attributes only: there is no header, so the checks that depend on the packet type and the Authenticator are not made.")]; // the mode (the page says where a zeroed copy came from, above the reading)
  for (const a of attributes) if (a.invalid) warnings.push(sayT("warn.invalidAttr", "Attribute {index}, {label}, is an invalid attribute; RFC 6929 (section 2.8) says a receiver SHOULD silently discard it, and MUST NOT discard the whole packet for it.", { index: String(a.index), label: label(a.name, a.id) })); // invalid attributes
  const eap = readEap(raws, warnings); // the EAP packet
  const vlan = readVlan(attributes); // VLAN assignment
  const example = exampleOf(b); // an RFC example?
  commonNotes(example, vlan, eap, notes, warnings); // example, VLAN, EAP
  return { mode: "attributes", format, octets: b.length, attributes, eap, vlan, example, holdsSecret: holdsSecret(attributes), warnings, notes }; // the reading
} // decodeAttributes

// ----------------------------------------------------------------------------
// Share results: the copy a link carries, with the hidden octets zeroed
// ----------------------------------------------------------------------------

/**
 * Why a field of the shared copy is zeroed. Each rule names what the octets are and the document that says so (the
 * tool's docs and the build notes give the reasoning in full):
 *   - authenticator: the Request Authenticator of an Accounting-Request, Disconnect-Request or CoA-Request is an MD5 over
 *     the packet and the shared secret (RFC 2866 s3; RFC 5176 s2.3), and a reply's Response Authenticator is the value
 *     RFC 3579 s4.3.3 names: "The RADIUS shared secret is vulnerable to offline dictionary attack, based on capture of
 *     the Response Authenticator or Message-Authenticator attribute". Access-Request and Status-Server keep theirs: a
 *     random number (RFC 2865 s3; RFC 5997 s3) that every secret-keyed value built on it, zeroed here, would need.
 *     Any other Code is zeroed too, since the tool does not know how its Authenticator is formed.
 *   - padding: octets after the Length, which the tool does not read (RFC 2865 s3); a capture may run into the next
 *     packet, so it cannot tell what they hold;
 *   - user-password: the hidden password (RFC 2865 s5.2 and s8; RFC 3579 s4.3.4, known plaintext);
 *   - chap-password: the CHAP response (RFC 2865 s5.3; RFC 3579 s3.2: a captured CHAP challenge and response allow a
 *     dictionary attack offline); the CHAP Ident stays;
 *   - tunnel-password: the encrypted String (RFC 2868 s3.5; RFC 3579 s4.3.4); the Tag and the Salt stay;
 *   - arap-password: the dial-in user's challenge and response (RFC 2869 s5.4), the plaintext and the result of
 *     arap-challenge-response: the server's response, DES of that challenge "with the authenticating user's password
 *     as the key" (RFC 2869 s5.15);
 *   - arap-security-data: "the security module challenge or response" (RFC 2869 s5.8), whose computation the RFC leaves
 *     to the module;
 *   - message-authenticator: the HMAC-MD5 keyed with the shared secret (RFC 3579 s3.2 and s4.3.3);
 *   - digest-response, digest-response-auth: each lets one side "prove possession of the password" (RFC 5090 s3.1,
 *     s3.4); digest-ha1: H(A1), which "makes offline dictionary attacks easier" (s3.19, s8.2);
 *   - pkm-auth-key: the authorisation key, "encrypted under the public key" of the subscriber station (RFC 5904 s3.7);
 *     the Lifetime and the Sequence stay;
 *   - eap-method: the type-data of an EAP Request or Response other than Identity, Notification and Nak: RFC 3748 gives
 *     MD5-Challenge, OTP and GTC "Dictionary attack prot.: No" (s5.4 to s5.6) and GTC's Response "the Token Card
 *     information necessary for authentication"; other methods are defined outside the RFCs this tool reads, so it
 *     cannot tell what their data holds; eap-data: the octets after the header of an EAP packet that is neither;
 *   - ms-credential: Microsoft's challenge responses, encrypted passwords, password changes, MPPE keys and
 *     MS-CHAP2-Success (RFC 2548; RFC 2759 s8.7); the Salt of MS-MPPE-Send-Key and -Recv-Key stays;
 *   - mikrotik-key: Mikrotik-Wireless-Enc-Key, "WEP encryption key for the client", and MIKROTIK_WIRELESS_PSK and
 *     MIKROTIK_WIRELESS_MPKEY, which MikroTik's RouterOS 7.24 table names without a description;
 *   - dhcp-relay-agent: in Huawei's HW-DHCP-Option, the values of Option 82's sub-options (codes and lengths stay):
 *     the Agent Circuit ID names the port ("Switching Hub port number", RFC 3046 s3.1) and the Agent Remote ID the
 *     subscriber ("MUST be globally unique", a "caller ID" telephone number or a "user name", s3.2); the whole Option 82
 *     value when its sub-options do not divide, and the whole HW-DHCP-Option value when it does not divide into options
 *     (Huawei: "Only Option 82 can be delivered"). Options other than 82 stay.
 */
export type RedactRule = "authenticator" | "padding" | "user-password" | "chap-password" | "tunnel-password" | "arap-password" | "arap-security-data" | "arap-challenge-response" | "message-authenticator" | "digest-response" | "digest-response-auth" | "digest-ha1" | "pkm-auth-key" | "eap-method" | "eap-data" | "ms-credential" | "mikrotik-key" | "dhcp-relay-agent"; // the rules

/** One field the shared copy zeroes. */
export interface RedactedField {
  /** The header's Authenticator, the padding after the Length, or an attribute. */
  where: "authenticator" | "padding" | "attribute";
  /** The attribute's position (from 1), or null for the Authenticator and the padding. */
  index: number | null;
  /** The vendor type of a Vendor-Specific sub-attribute, or null. */
  sub: number | null;
  /** The first octet zeroed, counted from 0 in the octets given. */
  from: number;
  /** How many octets are zeroed. */
  octets: number;
  /** Why. */
  rule: RedactRule;
}

/** The copy a Share results link carries. */
export interface ShareableCopy {
  /** The text the link carries: the box as typed, or the copy as hex, 16 octets a line. */
  text: string;
  /** Whether that is the box as typed. */
  asTyped: boolean;
  /** Why it is as typed (an RFC's published example, or nothing to zero), or null for a copy. */
  reason: "example" | "nothing" | null;
  /** The fields zeroed (empty when as typed). */
  fields: RedactedField[];
}

/** Standard attributes whose value is zeroed: type -> [rule, octets kept at the start of the value]. */
const REDACT_STD: Readonly<Record<number, readonly [RedactRule, number]>> = Object.freeze({
  2: ["user-password", 0], // RFC 2865 s5.2
  3: ["chap-password", 1], // RFC 2865 s5.3: the CHAP Ident stays
  69: ["tunnel-password", 3], // RFC 2868 s3.5: the Tag and the Salt stay
  70: ["arap-password", 0], // RFC 2869 s5.4
  74: ["arap-security-data", 0], // RFC 2869 s5.8
  80: ["message-authenticator", 0], // RFC 3579 s3.2
  84: ["arap-challenge-response", 0], // RFC 2869 s5.15
  103: ["digest-response", 0], // RFC 5090 s3.1
  106: ["digest-response-auth", 0], // RFC 5090 s3.4
  121: ["digest-ha1", 0], // RFC 5090 s3.19
  143: ["pkm-auth-key", 5], // RFC 5904 s3.7: the Lifetime and the Sequence stay
} as Record<number, readonly [RedactRule, number]>); // by type

/** Vendor sub-attributes whose value is zeroed: Vendor-Id -> vendor type -> [rule, octets kept]. */
const REDACT_VENDOR: Readonly<Record<number, Readonly<Record<number, readonly [RedactRule, number]>>>> = Object.freeze({
  311: { 1: ["ms-credential", 0], 3: ["ms-credential", 0], 4: ["ms-credential", 0], 5: ["ms-credential", 0], 6: ["ms-credential", 0], 12: ["ms-credential", 0], 16: ["ms-credential", 2], 17: ["ms-credential", 2], 19: ["ms-credential", 0], 20: ["ms-credential", 0], 25: ["ms-credential", 0], 26: ["ms-credential", 0], 27: ["ms-credential", 0] }, // RFC 2548 (MS_SECRET); the MPPE Salt stays
  14988: { 7: ["mikrotik-key", 0], 16: ["mikrotik-key", 0], 20: ["mikrotik-key", 0] }, // RouterOS 7.24: Enc-Key, PSK, MPKEY
} as Record<number, Record<number, readonly [RedactRule, number]>>); // by vendor

/**
 * The runs of a HW-DHCP-Option value a shared copy zeroes (dhcp-relay-agent): the value of each sub-option of each Option
 * 82; the whole Option 82 value when its sub-options do not divide; the whole value when it does not divide into options.
 * @param v the HW-DHCP-Option value
 * @returns [first octet in the value, octets] runs
 */
function dhcpRelayRuns(v: readonly number[]): [number, number][] {
  const out: [number, number][] = []; // the runs
  const opts = tlvs(v); // the options
  if (!opts.ok) return v.length ? [[0, v.length]] : []; // cannot be read: all of it
  let o = 0; // the option's first octet
  for (const [code, len, val] of opts.items) { // each option
    if (code === 82) { // the one Huawei delivers
      const s = tlvs(val); // its sub-options
      if (len < 2 || !s.ok) { if (len > 0) out.push([o + 2, len]); } // malformed: all of its value
      else { let k = 0; for (const [, sl] of s.items) { if (sl > 0) out.push([o + 2 + k + 2, sl]); k += 2 + sl; } } // each sub-option's value
    } // 82
    o += 2 + len; // the next option
  } // options
  return out; // the runs
} // dhcpRelayRuns

/** EAP Types whose type-data stays: Identity, Notification and Nak (RFC 3748 s5.1 to s5.3). */
const EAP_KEEP = new Set([1, 2, 3]); // nothing a credential or a verifier

/**
 * The fields a shared copy zeroes, from the walked attributes (the same walk the reading makes).
 * @param b the octets
 * @param raws the attributes as walked
 * @param header the Code and the Length of a packet, or null for attributes only
 * @returns the fields, in octet order
 */
function redactionFields(b: readonly number[], raws: readonly RawAttr[], header: { code: number; length: number } | null): RedactedField[] {
  const out: RedactedField[] = []; // the fields
  const add = (where: RedactedField["where"], index: number | null, sub: number | null, from: number, octets: number, rule: RedactRule) => { if (octets > 0) out.push({ where, index, sub, from, octets, rule }); }; // one field, when it has octets
  if (header && header.code !== 1 && header.code !== 12) add("authenticator", null, null, 4, 16, "authenticator"); // an MD5 with the secret, or a kind the tool does not know
  for (const a of raws) { // each attribute
    const std = REDACT_STD[a.type]; // a standard rule?
    if (std) { add("attribute", a.index, null, a.offset + 2 + std[1], a.value.length - std[1], std[0]); continue; } // the value, past what stays
    if (a.type !== 26 || a.length < 7) continue; // only a Vendor-Specific long enough to read (RFC 2865 s5.26)
    const vendor = REDACT_VENDOR[uint(a.value, 0, 4)] ?? (uint(a.value, 0, 4) === 2011 ? {} : null); // a vendor with rules (Huawei: HW-DHCP-Option, below)?
    if (!vendor) continue; // none
    const s = a.value.slice(4); // the String
    const subs: [number, number, number][] = []; // [vendor type, start in the String, vendor length]
    let fits = s.length >= 2; // whether it divides as readVendor() reads it
    for (let o = 0; fits && o < s.length; ) { // each sub-attribute
      const len = s[o + 1]; // vendor length
      if (s.length - o < 2 || len < 2 || o + len > s.length) { fits = false; break; } // does not divide: octets, no sub-attributes
      subs.push([s[o], o, len]); // one
      o += len; // the next
    } // sub-attributes
    if (!fits) continue; // read as octets: no sub-attribute to zero
    for (const [vt, o, len] of subs) { // each sub-attribute
      const r = vendor[vt]; // a rule?
      if (r) add("attribute", a.index, vt, a.offset + 2 + 4 + o + 2 + r[1], len - 2 - r[1], r[0]); // its value, past what stays
      if (uint(a.value, 0, 4) === 2011 && vt === 158) for (const [from, n] of dhcpRelayRuns(s.slice(o + 2, o + len))) add("attribute", a.index, vt, a.offset + 2 + 4 + o + 2 + from, n, "dhcp-relay-agent"); // Option 82's identifiers
    } // rules
  } // attributes
  const eaps = raws.filter((a) => a.type === 79); // the EAP-Message attributes, joined in order as readEap() joins them
  const pos: [number, number][] = []; // each joined octet: [its octet in b, its attribute's index]
  for (const a of eaps) for (let i = 0; i < a.value.length; i++) pos.push([a.offset + 2 + i, a.index]); // the joined data's octets
  if (pos.length >= 4) { // an EAP header at least (RFC 3748 s4)
    const code = b[pos[0][0]]; // the EAP Code
    const start = code === 1 || code === 2 ? (pos.length >= 5 && !EAP_KEEP.has(b[pos[4][0]]) ? 5 : pos.length) : 4; // a method's type-data, or anything after another packet's header
    const rule: RedactRule = code === 1 || code === 2 ? "eap-method" : "eap-data"; // which
    for (let k = start; k < pos.length; ) { // runs, one per attribute
      let e = k; // the run's end
      while (e < pos.length && pos[e][1] === pos[k][1]) e++; // the same attribute
      add("attribute", pos[k][1], null, pos[k][0], e - k, rule); // its zeroed octets
      k = e; // the next attribute
    } // runs
  } // EAP
  if (header && header.length < b.length) add("padding", null, null, header.length, b.length - header.length, "padding"); // after the Length
  return out.sort((x, y) => x.from - y.from); // in octet order
} // redactionFields

/**
 * Octets as the copy's text: lower-case hex, bytes separated by spaces, 16 a line (the RFCs' own layout).
 * @param b the octets
 * @returns the text
 */
function hexLines(b: readonly number[]): string {
  const lines: string[] = []; // the lines
  for (let i = 0; i < b.length; i += 16) lines.push(b.slice(i, i + 16).map((x) => x.toString(16).padStart(2, "0")).join(" ")); // 16 a line
  return lines.join("\n"); // the text
} // hexLines

/**
 * The copy a Share results link carries: the box as typed when it is an RFC's published example or nothing in it needs
 * zeroing; otherwise the octets with every field of redactionFields() set to zero, written as hex. Null when the engine
 * refuses the text (there is no reading to share).
 * @param r the request (the box and the mode)
 * @returns the copy, or null
 */
export function shareableCopy(r: DecodeRequest): ShareableCopy | null {
  let reading: DecodeResult<EngineText>; // the reading
  try { reading = runLocalisable({ input: r.input, mode: r.mode }); } catch { return null; } // refused: nothing to share
  const { bytes } = parseHex(r.input); // the octets (the reading above has parsed them already)
  if (reading.example !== null) return { text: r.input, asTyped: true, reason: "example", fields: [] }; // printed in an RFC with its secret
  const fields = reading.mode === "packet" ? redactionFields(bytes, walk(bytes, HEADER_OCTETS, uint(bytes, 2, 2)), { code: bytes[0], length: uint(bytes, 2, 2) }) : redactionFields(bytes, walk(bytes, 0, bytes.length), null); // what to zero
  if (fields.length === 0) return { text: r.input, asTyped: true, reason: "nothing", fields: [] }; // nothing to zero: as typed
  const copy = bytes.slice(); // the copy
  for (const f of fields) for (let i = f.from; i < f.from + f.octets; i++) copy[i] = 0; // zeros of the same length
  return { text: hexLines(copy), asTyped: false, reason: null, fields }; // the copy
} // shareableCopy

/**
 * Mark, on an arriving Share results copy, every field of redactionFields() whose octets are all zero: the attribute's
 * redacted flag and a note saying how many octets; the Authenticator and the padding are reported to the caller.
 * @param b the octets
 * @param raws the attributes as walked
 * @param attrs the decoded attributes (one per raw attribute, same order)
 * @param header the Code and the Length, or null for attributes only
 * @returns what was marked
 */
function markRedacted(b: readonly number[], raws: readonly RawAttr[], attrs: DecodedAttribute<EngineText>[], header: { code: number; length: number } | null): { authenticator: boolean; padding: number; any: boolean } {
  const zero = (f: RedactedField) => b.slice(f.from, f.from + f.octets).every((x) => x === 0); // all zero?
  const fields = redactionFields(b, raws, header).filter(zero); // the zeroed fields
  const perAttr = new Map<number, number>(); // attribute index -> octets zeroed
  for (const f of fields) if (f.where === "attribute" && f.index !== null) perAttr.set(f.index, (perAttr.get(f.index) ?? 0) + f.octets); // summed per attribute
  for (const [index, octets] of perAttr) { // each marked attribute
    const d = attrs[index - 1]; // its reading (positions count from 1)
    d.redacted = true; // marked
    d.notes.push(sayT("attr.redacted", "Redacted in this link: {octets, plural, one {{octets} octet of this value was replaced by zeros when the link was made, so it is not the original} other {{octets} octets of this value were replaced by zeros when the link was made, so they are not the originals}}.", { octets: String(octets) })); // how many
  } // marked
  const authenticator = fields.some((f) => f.where === "authenticator"); // the header field
  const padding = fields.filter((f) => f.where === "padding").reduce((n, f) => n + f.octets, 0); // the padding octets
  return { authenticator, padding, any: fields.length > 0 }; // what was marked
} // markRedacted

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The mode.
 * @param m "packet", "attributes" or absent
 * @returns the mode
 */
function parseMode(m: unknown): DecodeMode {
  if (m === undefined || m === null || m === "" || m === "packet") return "packet"; // the default
  if (m === "attributes") return "attributes"; // without the header
  throw inputError(say("err.mode", "Choose packet (a whole RADIUS packet) or attributes (attributes only, without the 20-octet header).")); // anything else
} // parseMode

/**
 * The page's entry: the reading with sentences as EngineTexts.
 * @param r the request, or the text alone (packet mode)
 * @returns the reading
 */
export function runLocalisable(r: DecodeRequest | string): DecodeResult<EngineText> {
  const req: DecodeRequest = typeof r === "string" ? { input: r } : r; // the text alone means a packet
  if (!req || typeof req !== "object") throw inputError(say("err.notText", "Paste the packet as text: hexadecimal digits.")); // not a request
  const mode = parseMode(req.mode); // packet or attributes
  const { bytes, format } = parseHex(req.input); // the octets
  const redacted = req.redacted === true; // an arriving Share results copy
  return mode === "packet" ? decodePacket(bytes, format, redacted) : decodeAttributes(bytes, format, redacted); // the reading
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param r the request, or the text alone
 * @returns the reading as the API returns it
 */
export function run(r: DecodeRequest | string): DecodeResult {
  return plainText(runLocalisable(r)) as DecodeResult; // sentences as their English
} // run

/**
 * The API's entry: the body as text, either the hex itself (a packet) or a JSON object {"input", "mode"}.
 * @param input the body
 * @returns the reading
 */
export function runApi(input: string): DecodeResult {
  const t = typeof input === "string" ? input.trim() : ""; // the body
  if (!t.startsWith("{")) return run({ input }); // hex: a packet
  let parsed: unknown; // the object
  try {
    parsed = JSON.parse(t); // parsed
  } catch {
    throw inputError(say("err.json", "The body is not valid JSON: send the hex itself, or one JSON object with \"input\" (the hex) and an optional \"mode\" (packet or attributes).")); // a readable refusal
  } // parsed
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw inputError(say("err.json", "The body is not valid JSON: send the hex itself, or one JSON object with \"input\" (the hex) and an optional \"mode\" (packet or attributes).")); // not an object
  const o = parsed as { input?: unknown; mode?: unknown }; // the two fields the API reads
  return run({ input: o.input as string, mode: o.mode as string | undefined }); // the same engine as the page; "redacted" is the page's own (a Share results arrival), never read from the API
} // runApi
