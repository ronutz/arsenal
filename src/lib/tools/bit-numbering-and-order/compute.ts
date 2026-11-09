// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bit-numbering-and-order/compute.ts
// ----------------------------------------------------------------------------
// BIT NUMBERING AND BIT ORDER - the pure, deterministic engine (08/11/2026,
// written with the Learn article least-and-most-significant-bit).
//
// THREE QUESTIONS, THREE MODES.
//   value    A number (hexadecimal with 0x, binary with 0b, or decimal) and a
//            width of 1 to 64 bits: every bit with its weight and its number
//            under LSB 0, MSB 0 and 1-based numbering, the set bits under each,
//            the count of ones and the parity bits, the lowest and highest set
//            bits, the two's complement reading, the value bit-reversed (whole
//            width and octet by octet) and byte-swapped, the order its bits
//            take on a least-significant-bit-first and on a
//            most-significant-bit-first link, optionally a known layout (the
//            LACP state octet, a MAC address's first octet, the TCP flags, the
//            DNS flags word, the IPv4 ToS octet, the 802.1Q TCI) with every
//            field named, and optionally "bits i to j" under a chosen
//            numbering, with its mask, shift and value.
//   printed  A string of 0s and 1s as a device printed it, and the order it
//            was printed in (most or least significant bit first): the value,
//            and the value the same string gives when read the other way; then
//            the same reading as value mode.
//   mac      A 48-bit MAC address, written in canonical form or bit-reversed
//            (non-canonical, Token Ring's "MSB format"): both forms, the I/G
//            and U/L bits, the SLAP quadrant of a local address, and the 48
//            bits in the order an Ethernet link sends them.
//
// THE RULES, each from a document read on 2026-11-08 (sources in index.ts):
//   - LSB 0: "Bit positions are numbered from right to left. The numerical
//     value of a set bit is equal to two raised to the power of the bit
//     position" (Intel SDM vol. 1, 1.3.1); the sign bit of a two's complement
//     integer "is located in bit 7 in a byte integer, bit 15 in a word
//     integer, bit 31 in a doubleword integer, and bit 63 in a quadword
//     integer" (4.2.1.2); Linux BIT(nr) is (1 << nr) and GENMASK(h, l) is "a
//     contiguous bitmask starting at bit position @l and ending at position
//     @h" (include/vdso/bits.h, include/linux/bits.h).
//   - MSB 0: "the bit labeled 0 is the most significant bit", so the octet
//     drawn 1 0 1 0 1 0 1 0 is 170 (RFC 791 Appendix B; RFC 1035 s2.3.2).
//   - 1-based: BITS values go into "bits 8 (high order bit) to 1 (low order
//     bit)" of each octet (RFC 3417 s8); Huawei's display eth-trunk prints the
//     LACP state as Bit 1 to Bit 8, Bit 1 first (chrome read R9).
//   - Wire order: "the physical order of bit transmission within an octet on
//     an IEEE [802.3] link is from the lowest order bit to the highest order
//     bit (i.e., the reverse of the IETF's ordering)" (RFC 9542 s1.1); PPP's
//     octets are "transmitted least significant bit first" (RFC 1662 s4.5.2,
//     s5.5); a UART's "Bit 0 is the least significant bit. It is the first bit
//     serially transmitted or received" (TI TL16C550D); on an I2C bus "Data is
//     transferred with the Most Significant Bit (MSB) first" (NXP UM10204 Rev.
//     7.0, 3.1.5, read in a browser); SPI's default is "MSB first" for each
//     word unless SPI_LSB_FIRST (Linux include/linux/spi/spi.h).
//   - Parity: even parity is "an even number of logic 1s in the data and
//     parity bits", odd parity "an odd number" (TI TL16C550D, LCR bit 4).
//   - MAC addresses: the I/G bit is "The least significant bit of Octet 0",
//     the U/L bit "the second least significant bit" (IEEE RA guidelines);
//     RFC 9542 s2.1 draws them as M and X, with Y and Z above them, and splits
//     the local space into four SLAP quadrants by Y and Z; canonical form maps
//     "The first bit of each byte that appears on the LAN" to "the least
//     significant (i.e., right-most) bit of each byte in memory", Token Ring
//     the other way, so 12-34-56-78-9A-BC sat in such an adapter's memory as
//     48-2C-6A-1E-59-3D (RFC 2469 s2).
//   - Layouts: LACP Actor_State bits 0 (LACP_Activity) to 7 (Expired)
//     (IEEE8023-LAG-MIB; Linux masks 0x01 to 0x80 in if_bonding.h); TCP flags
//     CWR to FIN in IANA's TCP Header Flags registry as bits 8 to 15, and
//     TCPHDR_FIN = BIT(0) to TCPHDR_CWR = BIT(7) in Linux include/net/tcp.h;
//     the DNS flags word as RFC 1035 s4.1.1 draws it, with AD and CD from RFC
//     6895 s2 and IANA's DNS Header Flags registry (bits 5 to 11); DSCP in
//     bits 0 to 5 of the DS field (RFC 2474 s3) and ECN in "Bits 6 and 7"
//     (RFC 3168 s5); the 802.1Q TCI masks VLAN_PRIO_MASK 0xe000 (shift 13),
//     VLAN_CFI_MASK 0x1000 and VLAN_VID_MASK 0x0fff (Linux if_vlan.h).
//
// PAGE LANGUAGE. Every sentence is an EngineText from the catalogue SENTENCES
// (pack keys tools.bit-numbering-and-order.engine.<id>); runLocalisable()
// returns the reading with them in place for the page, run() and runApi()
// return plainText() of it for the API and the golden vectors. Numbers never
// sit inside a sentence unless the sentence is about them; the page prints
// the reading's own fields.
//
// Pure: no clock, no network, no randomness. Every field is at most MAX_FIELD
// characters, checked before any pattern runs; the patterns are anchored and
// each repetition is separated by a mandatory, distinct separator, so every
// match is linear (ReDoS-safe). Values are BigInts, so 64 bits are exact.
// ============================================================================

import { say, plainText, withEngineText, EngineText } from "../engine-text"; // sentences with ids, and the API's English projection

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

/** The three modes. */
export type BitMode = "value" | "printed" | "mac"; // a number, a printed bit string, a MAC address

/** The three numberings. */
export type Numbering = "lsb0" | "msb0" | "one"; // bit 0 least significant, bit 0 most significant, bit 1 least significant

/** The order a bit string was printed in. */
export type PrintOrder = "msb-first" | "lsb-first"; // most significant first (the usual), or least significant first (Huawei's PortState)

/** How a MAC address was written. */
export type MacForm = "canonical" | "reversed"; // canonical (Ethernet) or bit-reversed (Token Ring's MSB format)

/** The known layouts a value can be read as. */
export type LayoutId = "none" | "lacp" | "mac-octet" | "tcp-flags" | "dns-flags" | "tos" | "vlan-tci"; // none, or one of six

/** Every layout id, in the order the page offers them. */
export const LAYOUTS: readonly LayoutId[] = Object.freeze(["none", "lacp", "mac-octet", "tcp-flags", "dns-flags", "tos", "vlan-tci"] as LayoutId[]); // the choices

/** The longest field the engine reads, in characters (checked before any pattern runs). */
export const MAX_FIELD = 80; // a 64-bit binary value with separators fits

/** The widest value, in bits. */
export const MAX_WIDTH = 64; // a quadword

/** A request in value mode. */
export interface ValueRequest {
  /** Selects this mode. */
  mode: "value";
  /** The number: 0x hexadecimal, 0b binary or decimal (a minus sign for a two's complement value). */
  input: string;
  /** The width in bits, 1 to 64 (a number or its text); inferred from the input when blank. */
  width?: string | number;
  /** A known layout to name the fields with; "none" when absent. */
  layout?: string;
  /** The numbering "from" and "to" are given in; "lsb0" when absent and a field is asked for. */
  numbering?: string;
  /** The first bit of a field to extract (a number or its text); no field when blank. */
  from?: string | number;
  /** The last bit of the field; the same as "from" when blank (a single bit). */
  to?: string | number;
}

/** A request in printed mode. */
export interface PrintedRequest {
  /** Selects this mode. */
  mode: "printed";
  /** The 0s and 1s as printed (spaces, underscores or dots between groups are allowed). */
  input: string;
  /** The order they were printed in; "msb-first" when absent. */
  order?: string;
  /** A known layout, as in value mode. */
  layout?: string;
  /** The numbering of a field to extract, as in value mode. */
  numbering?: string;
  /** The first bit of the field, as in value mode. */
  from?: string | number;
  /** The last bit of the field, as in value mode. */
  to?: string | number;
}

/** A request in MAC mode. */
export interface MacRequest {
  /** Selects this mode. */
  mode: "mac";
  /** A 48-bit MAC address: hyphens, colons, Cisco dots or twelve hexadecimal digits. */
  input: string;
  /** How it was written; "canonical" when absent. */
  form?: string;
}

/** Any request (the API body names its mode). */
export type BitRequest = ValueRequest | PrintedRequest | MacRequest; // the union

/** One bit of a value, with its three numbers. */
export interface BitRow {
  /** Its number under LSB 0 (its weight is 2 to that power). */
  lsb0: number;
  /** Its number under MSB 0 (0 is the most significant bit). */
  msb0: number;
  /** Its number under 1-based numbering (1 is the least significant bit). */
  one: number;
  /** Its weight, 2^lsb0, in decimal. */
  weight: string;
  /** Whether it is 1. */
  set: boolean;
}

/** One named field of a layout. S: string for the API, EngineText for the page. */
export interface LayoutField<S = string> {
  /** Its stable id (the protocol's own name, lower case). */
  id: string;
  /** Its name as the protocol writes it (QR, LACP_Activity, I/G ...). */
  name: string;
  /** What the name stands for, in the page's language (null when the name is all there is). */
  gloss: S | null;
  /** Its highest bit under LSB 0. */
  lsb0Hi: number;
  /** Its lowest bit under LSB 0. */
  lsb0Lo: number;
  /** Its first (most significant) bit under MSB 0. */
  msb0From: number;
  /** Its last bit under MSB 0. */
  msb0To: number;
  /** Its highest bit under 1-based numbering. */
  oneHi: number;
  /** Its lowest bit under 1-based numbering. */
  oneLo: number;
  /** The bits as the layout's own documents number them. */
  doc: S;
  /** Its mask in the value's width, hexadecimal with 0x. */
  mask: string;
  /** Its value (the bits shifted down), in decimal. */
  value: string;
  /** Its bits, most significant first. */
  bits: string;
  /** The name of its value where the source names values (an ECN codepoint), else null. */
  valueName: S | null;
}

/** A layout applied to a value. */
export interface LayoutResult<S = string> {
  /** The layout. */
  id: Exclude<LayoutId, "none">;
  /** Its width in bits. */
  width: number;
  /** Its fields, most significant first. */
  fields: LayoutField<S>[];
  /** How the layout's documents number its bits. */
  numberingNote: S;
}

/** A field extracted by "bits i to j". */
export interface FieldResult {
  /** The numbering i and j were given in. */
  numbering: Numbering;
  /** i, as given. */
  from: number;
  /** j, as given (equal to i for one bit). */
  to: number;
  /** The field's highest bit under LSB 0. */
  lsb0Hi: number;
  /** Its lowest bit under LSB 0 (the shift). */
  lsb0Lo: number;
  /** Its first bit under MSB 0. */
  msb0From: number;
  /** Its last bit under MSB 0. */
  msb0To: number;
  /** Its highest bit under 1-based numbering. */
  oneHi: number;
  /** Its lowest bit under 1-based numbering. */
  oneLo: number;
  /** How many bits it spans. */
  span: number;
  /** Its mask in the value's width, hexadecimal with 0x. */
  mask: string;
  /** The shift that brings it down: its lowest LSB 0 bit. */
  shift: number;
  /** Its value, in decimal. */
  value: string;
  /** Its value, hexadecimal with 0x. */
  valueHex: string;
  /** Its bits, most significant first. */
  bits: string;
  /** The extraction as code: (v >> shift) & mask. */
  expression: string;
  /** The same mask as the Linux kernel writes it: GENMASK(hi, lo), or BIT(n) for one bit. */
  kernel: string;
}

/** What printed mode adds. */
export interface PrintedInfo {
  /** The order the string was printed in. */
  order: PrintOrder;
  /** The bits as typed, separators removed. */
  typed: string;
  /** The value the same string gives read in the other order, hexadecimal with 0x. */
  otherHex: string;
  /** The same, in decimal. */
  otherDecimal: string;
}

/** The value-mode and printed-mode reading. S: string for the API, EngineText for the page. */
export interface ValueResult<S = string> {
  /** The mode. */
  mode: "value" | "printed";
  /** The width in bits. */
  width: number;
  /** Whether the width was inferred from the input. */
  widthInferred: boolean;
  /** The value, hexadecimal with 0x, padded to the width. */
  hex: string;
  /** The value as an unsigned number, in decimal. */
  decimal: string;
  /** The value read as a two's complement signed number, in decimal. */
  signed: string;
  /** The bits, most significant first. */
  binary: string;
  /** The same bits, least significant first (how Huawei prints its PortState). */
  binaryLsbFirst: string;
  /** The octets, most significant first, as two hex digits each; null unless the width is a multiple of 8. */
  octets: string[] | null;
  /** Every bit, most significant first. */
  bits: BitRow[];
  /** The set bits under each numbering, in ascending order. */
  setBits: { lsb0: number[]; msb0: number[]; one: number[] };
  /** How many bits are 1. */
  ones: number;
  /** The bit an even-parity link adds (it makes the count of ones even). */
  parityEven: 0 | 1;
  /** The bit an odd-parity link adds. */
  parityOdd: 0 | 1;
  /** The lowest set bit under LSB 0, null for zero. */
  lowestSet: number | null;
  /** The highest set bit under LSB 0, null for zero. */
  highestSet: number | null;
  /** The whole width bit-reversed, hexadecimal with 0x. */
  reversed: string;
  /** Each octet bit-reversed in place, octets kept in order; null unless the width is a multiple of 8. */
  reversedPerOctet: string | null;
  /** The octets in reverse order, bits kept (byte order, not bit order); null unless the width is 16, 24 ... 64. */
  byteSwapped: string | null;
  /** The bits in the order a link sends them, octet by octet; null unless the width is a multiple of 8. */
  wire: { lsbFirst: string; msbFirst: string } | null;
  /** What printed mode adds; null in value mode. */
  printed: PrintedInfo | null;
  /** The layout, when one was asked for. */
  layout: LayoutResult<S> | null;
  /** The field, when "bits i to j" was asked for. */
  field: FieldResult | null;
  /** The sentences that carry the rules. */
  notes: S[];
}

/** The MAC-mode reading. */
export interface MacResult<S = string> {
  /** The mode. */
  mode: "mac";
  /** How the address was written. */
  form: MacForm;
  /** Whether the form was the default because none was given. */
  formDefault: boolean;
  /** The canonical form, upper-case hexadecimal with hyphens (IEEE and RFC 9542 notation). */
  canonical: string;
  /** The canonical form with colons, lower case. */
  canonicalColon: string;
  /** The bit-reversed (non-canonical, MSB format) form, with hyphens. */
  reversed: string;
  /** The first octet of the canonical form, most significant bit first. */
  firstOctetBits: string;
  /** The I/G bit: true for a group (multicast or broadcast) address. */
  group: boolean;
  /** The U/L bit: true for a locally administered address. */
  local: boolean;
  /** True for FF-FF-FF-FF-FF-FF. */
  broadcast: boolean;
  /** The SLAP quadrant of a local address (Y and Z bits), null for a universal one. */
  slap: null | { y: 0 | 1; z: 0 | 1; quadrant: "aai" | "eli" | "reserved" | "sai"; name: S };
  /** The 48 bits in the order an Ethernet link sends them, octet by octet, least significant bit first. */
  wire: string;
  /** The first bit on the wire (the I/G bit). */
  firstBitOnWire: 0 | 1;
  /** The I/G and U/L bits a reader would see who took the reversed form for the canonical one. */
  reversedMisread: { group: boolean; local: boolean };
  /** The sentences that carry the rules. */
  notes: S[];
}

/** Any reading. */
export type BitResult<S = string> = ValueResult<S> | MacResult<S>; // by mode

/** An input the engine refuses, with a sentence the page can show in its own language. */
export class BitOrderInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "BitOrderInputError"; // a readable name in stack traces
  } // constructor
} // BitOrderInputError

// ----------------------------------------------------------------------------
// The sentence catalogue (en pack = these templates; pt-BR translates them)
// ----------------------------------------------------------------------------

/** Every sentence the engine writes, by id; {name} marks a value the page fills. */
export const SENTENCES = Object.freeze({
  // ---- Refusals: every mode ----
  "err.mode": "Choose a mode: value (a number and its width), printed (a string of bits as a device printed it) or mac (a MAC address).", // no mode
  "err.json": "The request body is not valid JSON: send one JSON object that names its mode: value, printed or mac.", // the API body
  "err.tooLong": "A field is longer than this tool reads ({max} characters).", // bounded before any pattern runs
  "err.empty": "Type a value first.", // nothing typed
  // ---- Refusals: value mode ----
  "err.value": "\"{value}\" is not a number this tool reads: write hexadecimal with 0x in front (0x3D), binary with 0b in front (0b00111101), or decimal digits (61), with a minus sign for a negative decimal.", // not a number
  "err.bareHex": "\"{value}\" looks hexadecimal: write it with 0x in front (0x{value}), so it is not read as decimal.", // hex without its prefix
  "err.macInValue": "\"{value}\" looks like a MAC address: choose the MAC address mode to read it.", // a MAC in the number field
  "err.tooWide": "The value has more than 64 bits; this tool reads 1 to 64.", // past 64 bits
  "err.width": "\"{value}\" is not a width: write a whole number of bits from 1 to 64.", // a bad width
  "err.fit": "The value needs {need} bits, more than the width of {width}: widen it or check the value.", // does not fit
  "err.negativeFit": "{value} does not fit {width} bits as a two's complement number, which holds {min} to {max}.", // a negative too big for the width
  "err.layout": "Choose a layout: none, lacp, mac-octet, tcp-flags, dns-flags, tos or vlan-tci.", // an unknown layout
  "err.layoutWidth": "The {layout} layout is {need} bits wide, and the value is {width}: set the width to {need}.", // a layout of another width
  "err.numbering": "Choose a numbering: lsb0 (bit 0 is the least significant), msb0 (bit 0 is the most significant) or one (bit 1 is the least significant).", // an unknown numbering
  "err.fieldNumber": "\"{value}\" is not a bit number: write a whole number.", // a bad index
  "err.fieldRange": "Bit {value} does not exist in {width} bits numbered {numbering}: the bits run from {low} to {high}.", // out of range
  "err.toWithoutFrom": "Give the first bit of the field as well as the last.", // to without from
  // ---- Refusals: printed mode ----
  "err.printed": "\"{value}\" is not a printed bit string: write only 0s and 1s, with single spaces, underscores or dots between groups if you like (10111100).", // not bits
  "err.order": "Choose the order the bits were printed in: msb-first or lsb-first.", // an unknown order
  // ---- Refusals: MAC mode ----
  "err.mac": "\"{value}\" is not a 48-bit MAC address: write six octets with hyphens (12-34-56-78-9A-BC) or colons, three dotted groups of four hex digits (1234.5678.9abc), or twelve hex digits.", // not a MAC
  "err.form": "Choose how the address is written: canonical or reversed.", // an unknown form
  // ---- Notes: value and printed modes ----
  "note.lsb0": "LSB 0 numbers the bits from the least significant, so bit k weighs 2 to the power k: Intel's \"Bit positions are numbered from right to left. The numerical value of a set bit is equal to two raised to the power of the bit position\", and the Linux kernel's BIT(n), which is 1 shifted left n times.", // Intel SDM 1.3.1, vdso/bits.h
  "note.msb0": "MSB 0 numbers them from the most significant, as the RFC diagrams do: \"the bit labeled 0 is the most significant bit\", so the octet drawn 1 0 1 0 1 0 1 0 is 170 (RFC 791, Appendix B).", // RFC 791
  "note.one": "1-based numbering counts from 1 at the least significant bit: SNMP places a BITS value in \"bits 8 (high order bit) to 1 (low order bit)\" of each octet (RFC 3417, section 8), and Huawei's display eth-trunk numbers its PortState Bit 1 to Bit 8.", // RFC 3417, Huawei
  "note.inferredHex": "No width was given: {width} bits, four for each hexadecimal digit typed, leading zeros included.", // inferred from hex
  "note.inferredBin": "No width was given: {width} bits, one for each binary digit typed, leading zeros included.", // inferred from binary
  "note.inferredDec": "No width was given: {width} bits, the smallest of 8, 16, 32 and 64 that holds the decimal value.", // inferred from decimal
  "note.sign": "The most significant bit is set, so read as a two's complement signed number the value is negative. Intel: \"The sign bit is located in bit 7 in a byte integer, bit 15 in a word integer, bit 31 in a doubleword integer, and bit 63 in a quadword integer\".", // Intel SDM 4.2.1.2
  "note.parity": "Parity counts the ones: with even parity a link adds the bit that makes \"an even number of logic 1s in the data and parity bits\", with odd parity the bit that makes the count odd (TI TL16C550D UART).", // TI
  "note.wire": "On an Ethernet link each octet goes least significant bit first: \"the physical order of bit transmission within an octet on an IEEE [802.3] link is from the lowest order bit to the highest order bit (i.e., the reverse of the IETF's ordering)\" (RFC 9542). The octets are taken in the order written, most significant first, as network byte order sends a number (RFC 791); a UART and PPP send each octet least significant bit first too. An I2C bus sends most significant bit first: \"Data is transferred with the Most Significant Bit (MSB) first\" (NXP UM10204, 3.1.5), and so does an SPI bus unless set otherwise.", // RFC 9542, RFC 791, TI, RFC 1662, NXP UM10204, Linux spi.h
  "note.reverse": "Reversing the bits of each octet in place is the bit swap RFC 2469 describes between canonical and Token Ring addresses; reversing the whole width also reverses the order of the octets, and that part is byte order, not bit order.", // RFC 2469
  "note.printedMsb": "The string was read most significant bit first, the order numbers are written in. Read least significant bit first, the same string is another value: a misread order changes the number without any error.", // printed msb-first
  "note.printedLsb": "The string was read least significant bit first: its first character is bit 0 of the value. Read most significant bit first, as numbers are usually written, the same string is another value.", // printed lsb-first
  "note.field": "The field is GENMASK({hi}, {lo}) in the Linux kernel's LSB 0 terms, \"a contiguous bitmask starting at bit position @l and ending at position @h\": shift right by {lo}, then keep {span} bits.", // linux/bits.h
  "note.fieldBit": "One bit: BIT({lo}) in the Linux kernel's terms; it is {state}.", // a single bit
  "word.set": "set (1)", // a bit that is 1
  "word.clear": "clear (0)", // a bit that is 0
  // ---- Layouts: how each source numbers its bits ----
  "layout.lacp.note": "IEEE 802.1AX numbers the Actor_State and Partner_State bits 0 (LACP_Activity) to 7 (Expired), and the Linux driver's masks put LACP_Activity at 0x01 and Expired at 0x80, so 802.1AX's bit k weighs 2 to the power k (LSB 0). Huawei's display eth-trunk prints the same eight bits as Bit 1 to Bit 8, Bit 1 (LACP_Activity) first, so its PortState string reads least significant bit first, and SNMP's BITS form puts LACP_Activity in the high-order bit.", // MIB, if_bonding.h, R9, RFC 3417
  "layout.mac-octet.note": "The IEEE RA names \"The least significant bit of Octet 0 (the I/G bit)\" and \"the second least significant bit of Octet 0 (the U/L bit)\"; RFC 9542 draws the octet MSB 0, with M (I/G), X (U/L), Y and Z in positions 7, 6, 5 and 4. Ethernet sends the I/G bit first.", // IEEE RA, RFC 9542
  "layout.tcp-flags.note": "This is the TCP header's fourteenth octet. IANA's TCP Header Flags registry numbers its bits 8 (CWR) to 15 (FIN), counting from the most significant bit of the 16 bits that begin with the Data Offset, while the Linux kernel defines TCPHDR_FIN as BIT(0) and TCPHDR_CWR as BIT(7). AE, IANA's bit 7, is the lowest bit of the octet before.", // IANA, include/net/tcp.h
  "layout.dns-flags.note": "This is the DNS header's second 16-bit word. RFC 1035 draws it MSB 0 (\"the bit labeled 0 is the most significant bit\"), and IANA's DNS Header Flags registry follows it: AA is bit 5, AD bit 10, CD bit 11. Under LSB 0 the same AA is bit 10, and RD (IANA's bit 7) is bit 8.", // RFC 1035, RFC 6895, IANA
  "layout.tos.note": "The IPv4 ToS octet (the IPv6 Traffic Class) holds the DSCP in bits 0 to 5 of RFC 2474's MSB 0 drawing and ECN in \"Bits 6 and 7\" (RFC 3168): the DSCP is the octet shifted right by 2, ECN its two lowest bits.", // RFC 2474, RFC 3168
  "layout.vlan-tci.note": "The 802.1Q TCI as the Linux kernel masks it: VLAN_PRIO_MASK 0xe000 with VLAN_PRIO_SHIFT 13 for the priority, VLAN_CFI_MASK 0x1000, \"Canonical Format Indicator / Drop Eligible Indicator\", and VLAN_VID_MASK 0x0fff for the VLAN ID.", // if_vlan.h
  // ---- Layouts: the numbers each field has in its own documents ----
  "doc.lacp": "bit {k} in 802.1AX, Bit {h} in Huawei's display", // MIB, R9
  "doc.mac": "position {p} in RFC 9542's drawing", // RFC 9542 figure 1
  "doc.macRest": "positions {from} to {to} in RFC 9542's drawing", // the rest of the octet
  "doc.tcp": "bit {i} in IANA's registry, BIT({k}) in Linux", // IANA, tcp.h
  "doc.dnsBit": "bit {p} in RFC 1035 and IANA's registry", // a one-bit flag
  "doc.dnsBits": "bits {from} to {to} in RFC 1035", // a multi-bit field
  "doc.tosDscp": "bits 0 to 5 of RFC 2474's DS field", // RFC 2474
  "doc.tosEcn": "bits 6 and 7 in RFC 3168", // RFC 3168
  "doc.tci": "mask {mask} in Linux's if_vlan.h", // if_vlan.h
  // ---- Layouts: what the names stand for ----
  "gloss.mac.m": "individual/group: 0 for one station, 1 for a group (multicast or broadcast)", // IEEE RA, RFC 9542
  "gloss.mac.x": "universal/local: 0 for an address under an IEEE-assigned prefix, 1 for a local one", // IEEE RA, RFC 9542
  "gloss.mac.y": "the SLAP's Y bit, which with Z picks the quadrant of a local address", // RFC 9542
  "gloss.mac.z": "the SLAP's Z bit", // RFC 9542
  "gloss.mac.rest": "the rest of the first octet, part of the prefix or of the local address", // RFC 9542
  "gloss.tcp.cwr": "Congestion Window Reduced", // RFC 9293, IANA
  "gloss.tcp.ece": "ECN-Echo", // RFC 9293, IANA
  "gloss.tcp.urg": "Urgent Pointer field is significant", // IANA
  "gloss.tcp.ack": "Acknowledgment field is significant", // IANA
  "gloss.tcp.psh": "Push Function", // IANA
  "gloss.tcp.rst": "Reset the connection", // IANA
  "gloss.tcp.syn": "Synchronize sequence numbers", // IANA
  "gloss.tcp.fin": "No more data from sender", // IANA
  "gloss.dns.qr": "query (0) or response (1)", // RFC 1035
  "gloss.dns.opcode": "kind of query: 0 a standard query", // RFC 1035
  "gloss.dns.aa": "Authoritative Answer", // RFC 1035, IANA
  "gloss.dns.tc": "Truncated Response", // IANA
  "gloss.dns.rd": "Recursion Desired", // RFC 1035, IANA
  "gloss.dns.ra": "Recursion Available", // RFC 1035, IANA
  "gloss.dns.z": "reserved, zero", // RFC 1035, IANA
  "gloss.dns.ad": "Authentic Data", // IANA
  "gloss.dns.cd": "Checking Disabled", // IANA
  "gloss.dns.rcode": "response code: 0 no error, 3 name error", // RFC 1035
  "gloss.tos.dscp": "differentiated services codepoint", // RFC 2474
  "gloss.tos.ecn": "Explicit Congestion Notification", // RFC 3168
  "gloss.tci.pcp": "priority", // if_vlan.h
  "gloss.tci.dei": "Drop Eligible Indicator, once the Canonical Format Indicator", // if_vlan.h
  "gloss.tci.vid": "VLAN Identifier", // if_vlan.h
  // ---- The ECN codepoints (RFC 3168, Figure 1) ----
  "ecn.0": "Not-ECT", // 00
  "ecn.1": "ECT(1)", // 01
  "ecn.2": "ECT(0)", // 10
  "ecn.3": "CE", // 11
  // ---- MAC mode ----
  "mac.slap.aai": "Administratively Assigned (Y 0, Z 0)", // RFC 9542 Table 2
  "mac.slap.eli": "Extended Local (Y 0, Z 1)", // RFC 9542 Table 2
  "mac.slap.reserved": "Reserved (Y 1, Z 0)", // RFC 9542 Table 2
  "mac.slap.sai": "Standard Assigned (Y 1, Z 1)", // RFC 9542 Table 2
  "note.mac.canonical": "Canonical form maps \"The first bit of each byte that appears on the LAN\" to \"the least significant (i.e., right-most) bit of each byte in memory\", which \"puts the group address indicator ... in the least significant bit of the first byte\"; Ethernet and 802.3 hardware work this way (RFC 2469).", // RFC 2469 s2
  "note.mac.reversed": "Token Ring, and some FDDI hardware, mapped the first bit to the most significant bit instead (\"MSB format\", \"non-canonical form\"), so an adapter held the address with every octet bit-reversed: RFC 2469's 12-34-56-78-9A-BC is 48-2C-6A-1E-59-3D there.", // RFC 2469 s2
  "note.mac.typedReversed": "You entered the bit-reversed form: the canonical address is each octet with its bits reversed.", // form reversed
  "note.mac.bits": "The I/G bit is \"The least significant bit of Octet 0\" and the U/L bit \"the second least significant bit\" (IEEE RA); Ethernet sends each octet least significant bit first (RFC 9542), so the I/G bit is the first bit of the address on the wire.", // IEEE RA, RFC 9542
  "note.mac.slap": "A local address may follow the IEEE 802 Structured Local Address Plan, whose Y and Z bits split the local space into four quadrants (RFC 9542, section 2.1.1); the plan is optional.", // RFC 9542
  "note.mac.bridges": "Bridges between Token Ring and Ethernet had to \"perform bit swaps of the addresses in the address fields of ARP packets\" (RFC 2469, section 3.2): reading one form as the other names a different station, with other I/G and U/L bits, as the misread line shows.", // RFC 2469 s3.2
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
function s(id: SentenceId, args?: Record<string, string | EngineText>): EngineText {
  const tpl: string = SENTENCES[id]; // the English template
  const text = args ? tpl.replace(/\{(\w+)\}/g, (m: string, k: string) => (k in args ? String(args[k]) : m)) : tpl; // filled for the API (a nested sentence by its English)
  return say(id, text, args); // the values kept for the page
} // s

/**
 * An input error carrying its sentence.
 * @param id the sentence id
 * @param args its values
 * @returns the error, ready to throw
 */
function refuse(id: SentenceId, args?: Record<string, string>): BitOrderInputError {
  const m = s(id, args); // the sentence
  return withEngineText(new BitOrderInputError(m), m); // the class, the English message, and the sentence
} // refuse

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------

/**
 * A field as text, bounded before anything else reads it.
 * @param v the field (a string, a number or absent)
 * @returns the trimmed text ("" when absent)
 */
function text(v: unknown): string {
  if (v === undefined || v === null) return ""; // absent
  const t = typeof v === "number" ? String(v) : typeof v === "string" ? v : ""; // only text and numbers are read
  if (t.length > MAX_FIELD) throw refuse("err.tooLong", { max: String(MAX_FIELD) }); // bounded first
  return t.trim(); // trimmed
} // text

/**
 * The value's bits as text, most significant first.
 * @param v the value
 * @param w the width
 * @returns w characters of 0 and 1
 */
function binOf(v: bigint, w: number): string {
  return v.toString(2).padStart(w, "0"); // padded to the width
} // binOf

/**
 * The value in hexadecimal with 0x, upper case, padded to the width's digits.
 * @param v the value
 * @param w the width in bits
 * @returns the text
 */
function hexOf(v: bigint, w: number): string {
  return `0x${v.toString(16).toUpperCase().padStart(Math.ceil(w / 4), "0")}`; // one digit per four bits
} // hexOf

/**
 * The value with its bits in reverse order within a width.
 * @param v the value
 * @param w the width
 * @returns the reversed value
 */
function reverseBits(v: bigint, w: number): bigint {
  let out = 0n; // the result
  for (let i = 0; i < w; i += 1) if ((v >> BigInt(i)) & 1n) out |= 1n << BigInt(w - 1 - i); // bit i goes to w-1-i
  return out; // reversed
} // reverseBits

/**
 * The octets of a value, most significant first.
 * @param v the value
 * @param w the width (a multiple of 8)
 * @returns the octets as numbers
 */
function octetsOf(v: bigint, w: number): number[] {
  const n = w / 8; // how many
  const out: number[] = []; // most significant first
  for (let i = n - 1; i >= 0; i -= 1) out.push(Number((v >> BigInt(8 * i)) & 0xffn)); // each octet
  return out; // the octets
} // octetsOf

/**
 * A value from octets, most significant first.
 * @param o the octets
 * @returns the value
 */
function fromOctets(o: number[]): bigint {
  return o.reduce((acc, x) => (acc << 8n) | BigInt(x), 0n); // shift in each octet
} // fromOctets

/**
 * One octet with its bits reversed.
 * @param x the octet
 * @returns the reversed octet
 */
function rev8(x: number): number {
  return Number(reverseBits(BigInt(x), 8)); // eight bits
} // rev8

/**
 * A mask of n ones.
 * @param n how many
 * @returns 2^n - 1
 */
function ones(n: number): bigint {
  return (1n << BigInt(n)) - 1n; // n low bits
} // ones

// ----------------------------------------------------------------------------
// Parsing
// ----------------------------------------------------------------------------

/** Hexadecimal with 0x: digit groups separated by one space or underscore (each repetition needs its separator: linear). */
const HEX_RE = /^0[xX][0-9A-Fa-f]+(?:[ _][0-9A-Fa-f]+)*$/; // 0x3D, 0x0000_FFFF, 0x12 34
/** Binary with 0b: the same shape. */
const BIN_RE = /^0[bB][01]+(?:[ _][01]+)*$/; // 0b00111101, 0b0011_1101
/** Decimal: digits, a minus sign allowed. */
const DEC_RE = /^-?[0-9]+$/; // 61, -1
/** Hexadecimal digits without a prefix, at least one letter (only to say "write 0x"). */
const BARE_HEX_RE = /^[0-9A-Fa-f]*[A-Fa-f][0-9A-Fa-f]*$/; // 3D
/** A printed bit string: groups of 0 and 1 separated by one space, underscore or dot. */
const PRINTED_RE = /^[01]+(?:[ _.][01]+)*$/; // 10111100, 1011 1100
/** A MAC address: six octets with one separator kind, Cisco's three dotted groups, or twelve digits. */
const MAC_HYPHEN_RE = /^[0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2}){5}$/; // 12-34-56-78-9A-BC
/** The same with colons. */
const MAC_COLON_RE = /^[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}$/; // 12:34:56:78:9a:bc
/** Cisco's dotted form. */
const MAC_DOT_RE = /^[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}$/; // 1234.5678.9abc
/** Twelve digits, no separator. */
const MAC_PLAIN_RE = /^[0-9A-Fa-f]{12}$/; // 123456789ABC

/** A parsed number. */
interface ParsedValue {
  /** The value (for a negative decimal, its two's complement in the width, filled in once the width is known). */
  magnitude: bigint;
  /** Whether a minus sign was typed. */
  negative: boolean;
  /** The width the input implies, and how. */
  implied: { width: number; how: "hex" | "bin" | "dec" };
}

/**
 * Read the value field.
 * @param raw the field as typed
 * @returns the number and the width it implies
 */
function parseValue(raw: string): ParsedValue {
  if (raw === "") throw refuse("err.empty"); // nothing typed
  if (HEX_RE.test(raw)) { // hexadecimal
    const digits = raw.slice(2).replace(/[ _]/g, ""); // the digits
    if (digits.length > 16) throw refuse("err.tooWide"); // past 64 bits
    return { magnitude: BigInt(`0x${digits}`), negative: false, implied: { width: digits.length * 4, how: "hex" } }; // four bits a digit
  } // hex
  if (BIN_RE.test(raw)) { // binary
    const digits = raw.slice(2).replace(/[ _]/g, ""); // the digits
    if (digits.length > MAX_WIDTH) throw refuse("err.tooWide"); // past 64 bits
    return { magnitude: BigInt(`0b${digits}`), negative: false, implied: { width: digits.length, how: "bin" } }; // one bit a digit
  } // binary
  if (DEC_RE.test(raw)) { // decimal
    const negative = raw.startsWith("-"); // a minus sign
    const magnitude = BigInt(negative ? raw.slice(1) : raw); // the digits
    if (!negative && magnitude > ones(MAX_WIDTH)) throw refuse("err.tooWide"); // past 64 bits
    if (negative && magnitude > 1n << 63n) throw refuse("err.tooWide"); // below -2^63
    const fits = (w: number) => (negative ? magnitude <= 1n << BigInt(w - 1) : magnitude <= ones(w)); // fits a width
    const width = [8, 16, 32, 64].find(fits) ?? 64; // the smallest standard width
    return { magnitude, negative, implied: { width, how: "dec" } }; // decimal
  } // decimal
  if (MAC_HYPHEN_RE.test(raw) || MAC_COLON_RE.test(raw) || MAC_DOT_RE.test(raw)) throw refuse("err.macInValue", { value: raw }); // a MAC address
  if (/^0[xXbB]/.test(raw)) throw refuse("err.value", { value: raw }); // a prefix with digits that do not follow it
  if (BARE_HEX_RE.test(raw)) throw refuse("err.bareHex", { value: raw }); // hex without 0x
  throw refuse("err.value", { value: raw }); // anything else
} // parseValue

/**
 * Read the width field.
 * @param raw the field as typed ("" for none)
 * @returns the width, or null when blank
 */
function parseWidth(raw: string): number | null {
  if (raw === "") return null; // inferred later
  if (!/^[0-9]{1,3}$/.test(raw)) throw refuse("err.width", { value: raw }); // digits only
  const w = Number(raw); // the number
  if (w < 1 || w > MAX_WIDTH) throw refuse("err.width", { value: raw }); // 1 to 64
  return w; // the width
} // parseWidth

/**
 * Read the layout field.
 * @param raw the field as typed
 * @returns the layout id
 */
function parseLayout(raw: string): LayoutId {
  if (raw === "") return "none"; // the default
  if ((LAYOUTS as readonly string[]).includes(raw)) return raw as LayoutId; // a known one
  throw refuse("err.layout"); // anything else
} // parseLayout

/**
 * Read a numbering.
 * @param raw the field as typed
 * @returns the numbering
 */
function parseNumbering(raw: string): Numbering {
  if (raw === "") return "lsb0"; // the default
  if (raw === "lsb0" || raw === "msb0" || raw === "one") return raw; // a known one
  throw refuse("err.numbering"); // anything else
} // parseNumbering

/**
 * Read a bit number.
 * @param raw the field as typed
 * @returns the number, or null when blank
 */
function parseIndex(raw: string): number | null {
  if (raw === "") return null; // blank
  if (!/^[0-9]{1,3}$/.test(raw)) throw refuse("err.fieldNumber", { value: raw }); // digits only
  return Number(raw); // the number
} // parseIndex

/**
 * Read a MAC address.
 * @param raw the field as typed
 * @returns its six octets
 */
function parseMac(raw: string): number[] {
  if (raw === "") throw refuse("err.empty"); // nothing typed
  if (!(MAC_HYPHEN_RE.test(raw) || MAC_COLON_RE.test(raw) || MAC_DOT_RE.test(raw) || MAC_PLAIN_RE.test(raw))) throw refuse("err.mac", { value: raw }); // not one of the forms
  const hex = raw.replace(/[-:.]/g, ""); // twelve digits
  return [0, 2, 4, 6, 8, 10].map((i) => parseInt(hex.slice(i, i + 2), 16)); // six octets
} // parseMac

// ----------------------------------------------------------------------------
// Layouts
// ----------------------------------------------------------------------------

/** One field of a layout, as the engine defines it: its LSB 0 bits, its name and its documents' numbering. */
interface FieldDef {
  /** Stable id. */
  id: string;
  /** The protocol's name for it. */
  name: string;
  /** Its highest LSB 0 bit. */
  hi: number;
  /** Its lowest LSB 0 bit. */
  lo: number;
  /** Its gloss sentence id, or null. */
  gloss: SentenceId | null;
  /** How its documents number it (built from the field's own positions). */
  doc: (f: { hi: number; lo: number; msb0From: number; msb0To: number }) => EngineText;
}

/** The six layouts: width, fields (most significant first) and the note on numbering. */
const LAYOUT_DEFS: Readonly<Record<Exclude<LayoutId, "none">, { width: number; note: SentenceId; fields: FieldDef[] }>> = Object.freeze({
  lacp: {
    width: 8, // one octet
    note: "layout.lacp.note", // 802.1AX, Linux, Huawei, SNMP
    fields: ["Expired", "Defaulted", "Distributing", "Collecting", "Synchronization", "Aggregation", "LACP_Timeout", "LACP_Activity"].map((name, i) => ({
      id: name.toLowerCase(), // a stable id
      name, // the 802.1AX name (the names the LACP reader uses)
      hi: 7 - i, // most significant first
      lo: 7 - i, // one bit each
      gloss: null, // the name says it
      doc: (f: { hi: number }) => s("doc.lacp", { k: String(f.hi), h: String(f.hi + 1) }), // 802.1AX bit k, Huawei Bit k+1
    })), // LACP_Activity 0x01 ... Expired 0x80
  },
  "mac-octet": {
    width: 8, // the first octet
    note: "layout.mac-octet.note", // IEEE RA, RFC 9542
    fields: [
      { id: "rest", name: "", hi: 7, lo: 4, gloss: "gloss.mac.rest", doc: (f) => s("doc.macRest", { from: String(f.msb0From), to: String(f.msb0To) }) }, // the four high bits
      { id: "z", name: "Z", hi: 3, lo: 3, gloss: "gloss.mac.z", doc: (f) => s("doc.mac", { p: String(f.msb0From) }) }, // Z
      { id: "y", name: "Y", hi: 2, lo: 2, gloss: "gloss.mac.y", doc: (f) => s("doc.mac", { p: String(f.msb0From) }) }, // Y
      { id: "x", name: "U/L (X)", hi: 1, lo: 1, gloss: "gloss.mac.x", doc: (f) => s("doc.mac", { p: String(f.msb0From) }) }, // U/L
      { id: "m", name: "I/G (M)", hi: 0, lo: 0, gloss: "gloss.mac.m", doc: (f) => s("doc.mac", { p: String(f.msb0From) }) }, // I/G
    ],
  },
  "tcp-flags": {
    width: 8, // the fourteenth octet of the TCP header
    note: "layout.tcp-flags.note", // IANA, Linux
    fields: ["CWR", "ECE", "URG", "ACK", "PSH", "RST", "SYN", "FIN"].map((name, i) => ({
      id: name.toLowerCase(), // a stable id
      name, // RFC 9293's name
      hi: 7 - i, // most significant first
      lo: 7 - i, // one bit each
      gloss: `gloss.tcp.${name.toLowerCase()}` as SentenceId, // IANA's description
      doc: (f: { hi: number; msb0From: number }) => s("doc.tcp", { i: String(8 + f.msb0From), k: String(f.hi) }), // IANA bit 8+p, Linux BIT(k)
    })), // CWR 0x80 ... FIN 0x01
  },
  "dns-flags": {
    width: 16, // the second word of the header
    note: "layout.dns-flags.note", // RFC 1035, IANA
    fields: [
      { id: "qr", name: "QR", hi: 15, lo: 15, gloss: "gloss.dns.qr", doc: (f) => s("doc.dnsBit", { p: String(f.msb0From) }) }, // bit 0
      { id: "opcode", name: "Opcode", hi: 14, lo: 11, gloss: "gloss.dns.opcode", doc: (f) => s("doc.dnsBits", { from: String(f.msb0From), to: String(f.msb0To) }) }, // bits 1-4
      { id: "aa", name: "AA", hi: 10, lo: 10, gloss: "gloss.dns.aa", doc: (f) => s("doc.dnsBit", { p: String(f.msb0From) }) }, // bit 5
      { id: "tc", name: "TC", hi: 9, lo: 9, gloss: "gloss.dns.tc", doc: (f) => s("doc.dnsBit", { p: String(f.msb0From) }) }, // bit 6
      { id: "rd", name: "RD", hi: 8, lo: 8, gloss: "gloss.dns.rd", doc: (f) => s("doc.dnsBit", { p: String(f.msb0From) }) }, // bit 7
      { id: "ra", name: "RA", hi: 7, lo: 7, gloss: "gloss.dns.ra", doc: (f) => s("doc.dnsBit", { p: String(f.msb0From) }) }, // bit 8
      { id: "z", name: "Z", hi: 6, lo: 6, gloss: "gloss.dns.z", doc: (f) => s("doc.dnsBit", { p: String(f.msb0From) }) }, // bit 9
      { id: "ad", name: "AD", hi: 5, lo: 5, gloss: "gloss.dns.ad", doc: (f) => s("doc.dnsBit", { p: String(f.msb0From) }) }, // bit 10
      { id: "cd", name: "CD", hi: 4, lo: 4, gloss: "gloss.dns.cd", doc: (f) => s("doc.dnsBit", { p: String(f.msb0From) }) }, // bit 11
      { id: "rcode", name: "RCODE", hi: 3, lo: 0, gloss: "gloss.dns.rcode", doc: (f) => s("doc.dnsBits", { from: String(f.msb0From), to: String(f.msb0To) }) }, // bits 12-15
    ],
  },
  tos: {
    width: 8, // the ToS / Traffic Class octet
    note: "layout.tos.note", // RFC 2474, RFC 3168
    fields: [
      { id: "dscp", name: "DSCP", hi: 7, lo: 2, gloss: "gloss.tos.dscp", doc: () => s("doc.tosDscp") }, // six bits
      { id: "ecn", name: "ECN", hi: 1, lo: 0, gloss: "gloss.tos.ecn", doc: () => s("doc.tosEcn") }, // two bits
    ],
  },
  "vlan-tci": {
    width: 16, // the tag control information
    note: "layout.vlan-tci.note", // if_vlan.h
    fields: [
      { id: "pcp", name: "PCP", hi: 15, lo: 13, gloss: "gloss.tci.pcp", doc: () => s("doc.tci", { mask: "0xe000" }) }, // VLAN_PRIO_MASK
      { id: "dei", name: "DEI", hi: 12, lo: 12, gloss: "gloss.tci.dei", doc: () => s("doc.tci", { mask: "0x1000" }) }, // VLAN_CFI_MASK
      { id: "vid", name: "VID", hi: 11, lo: 0, gloss: "gloss.tci.vid", doc: () => s("doc.tci", { mask: "0x0fff" }) }, // VLAN_VID_MASK
    ],
  },
}); // the layouts

/**
 * Apply a layout to a value.
 * @param id the layout
 * @param v the value
 * @param w its width
 * @returns the named fields
 */
function applyLayout(id: Exclude<LayoutId, "none">, v: bigint, w: number): LayoutResult<EngineText> {
  const def = LAYOUT_DEFS[id]; // its definition
  if (def.width !== w) throw refuse("err.layoutWidth", { layout: id, need: String(def.width), width: String(w) }); // the widths must agree
  const fields = def.fields.map((f): LayoutField<EngineText> => {
    const span = f.hi - f.lo + 1; // its bits
    const value = (v >> BigInt(f.lo)) & ones(span); // its value
    const msb0From = w - 1 - f.hi; // its first MSB 0 bit
    const msb0To = w - 1 - f.lo; // its last MSB 0 bit
    return {
      id: f.id, // stable id
      name: f.name, // the protocol's name
      gloss: f.gloss ? s(f.gloss) : null, // what it stands for
      lsb0Hi: f.hi, // LSB 0
      lsb0Lo: f.lo, // LSB 0
      msb0From, // MSB 0
      msb0To, // MSB 0
      oneHi: f.hi + 1, // 1-based
      oneLo: f.lo + 1, // 1-based
      doc: f.doc({ hi: f.hi, lo: f.lo, msb0From, msb0To }), // as its documents number it
      mask: hexOf(ones(span) << BigInt(f.lo), w), // in the value's width
      value: value.toString(), // decimal
      bits: binOf(value, span), // its bits
      valueName: id === "tos" && f.id === "ecn" ? s(`ecn.${Number(value)}` as SentenceId) : null, // RFC 3168's codepoint names
    }; // the field
  }); // fields
  return { id, width: def.width, fields, numberingNote: s(def.note) }; // the layout
} // applyLayout

// ----------------------------------------------------------------------------
// Value and printed modes
// ----------------------------------------------------------------------------

/**
 * The bit field "i to j" under a numbering.
 * @param v the value
 * @param w its width
 * @param numbering the numbering i and j are in
 * @param from i
 * @param to j (equal to i for one bit)
 * @returns the field
 */
function extract(v: bigint, w: number, numbering: Numbering, from: number, to: number): FieldResult {
  const low = numbering === "one" ? 1 : 0; // the lowest number
  const high = numbering === "one" ? w : w - 1; // the highest number
  for (const x of [from, to]) if (x < low || x > high) throw refuse("err.fieldRange", { value: String(x), width: String(w), numbering, low: String(low), high: String(high) }); // in range
  const toLsb0 = (x: number) => (numbering === "lsb0" ? x : numbering === "msb0" ? w - 1 - x : x - 1); // into LSB 0
  const a = toLsb0(from); // i in LSB 0
  const b = toLsb0(to); // j in LSB 0
  const hi = Math.max(a, b); // the field's top bit
  const lo = Math.min(a, b); // its bottom bit
  const span = hi - lo + 1; // its width
  const value = (v >> BigInt(lo)) & ones(span); // its value
  return {
    numbering, // as given
    from, // as given
    to, // as given
    lsb0Hi: hi, // LSB 0
    lsb0Lo: lo, // LSB 0
    msb0From: w - 1 - hi, // MSB 0
    msb0To: w - 1 - lo, // MSB 0
    oneHi: hi + 1, // 1-based
    oneLo: lo + 1, // 1-based
    span, // bits
    mask: hexOf(ones(span) << BigInt(lo), w), // in place
    shift: lo, // the shift
    value: value.toString(), // decimal
    valueHex: `0x${value.toString(16).toUpperCase()}`, // hexadecimal
    bits: binOf(value, span), // its bits
    expression: `(v >> ${lo}) & 0x${ones(span).toString(16).toUpperCase()}`, // as code
    kernel: span === 1 ? `BIT(${lo})` : `GENMASK(${hi}, ${lo})`, // as the kernel writes the mask
  }; // the field
} // extract

/**
 * The reading of a value of a known width (both value and printed modes end here).
 * @param mode the mode
 * @param v the value (0 to 2^w - 1)
 * @param w the width
 * @param inferred how the width was inferred, or null when given
 * @param printed what printed mode adds, or null
 * @param r the request (layout and field)
 * @returns the reading
 */
function readValue(mode: "value" | "printed", v: bigint, w: number, inferred: null | "hex" | "bin" | "dec", printed: PrintedInfo | null, r: ValueRequest | PrintedRequest): ValueResult<EngineText> {
  const layoutId = parseLayout(text(r.layout)); // the layout
  const numberingRaw = text(r.numbering); // the numbering as typed
  const from = parseIndex(text(r.from)); // i
  const to = parseIndex(text(r.to)); // j
  const numbering = parseNumbering(numberingRaw); // checked even without a field, so a bad one is never silently ignored
  if (from === null && to !== null) throw refuse("err.toWithoutFrom"); // j alone
  const bin = binOf(v, w); // most significant first
  const bits: BitRow[] = [...bin].map((c, i) => ({ lsb0: w - 1 - i, msb0: i, one: w - i, weight: (1n << BigInt(w - 1 - i)).toString(), set: c === "1" })); // every bit
  const setRows = bits.filter((b) => b.set); // the ones
  const count = setRows.length; // how many
  const multiple = w % 8 === 0; // whole octets
  const oct = multiple ? octetsOf(v, w) : null; // the octets
  const signed = (v >> BigInt(w - 1)) & 1n ? v - (1n << BigInt(w)) : v; // two's complement
  const notes: EngineText[] = [s("note.lsb0"), s("note.msb0"), s("note.one")]; // the three numberings, always
  if (inferred === "hex") notes.push(s("note.inferredHex", { width: String(w) })); // how the width was found
  if (inferred === "bin") notes.push(s("note.inferredBin", { width: String(w) })); // idem
  if (inferred === "dec") notes.push(s("note.inferredDec", { width: String(w) })); // idem
  if (printed) notes.push(s(printed.order === "lsb-first" ? "note.printedLsb" : "note.printedMsb")); // the printed order
  if (signed < 0n && [8, 16, 32, 64].includes(w)) notes.push(s("note.sign")); // the sign bit
  notes.push(s("note.parity")); // parity
  if (multiple) notes.push(s("note.wire")); // the order on a link
  if (multiple) notes.push(s("note.reverse")); // bit order against byte order
  const layout = layoutId === "none" ? null : applyLayout(layoutId, v, w); // the layout
  if (layout) notes.push(layout.numberingNote); // how its documents number it
  const field = from === null ? null : extract(v, w, numbering, from, to ?? from); // the field
  if (field) notes.push(field.span === 1 ? s("note.fieldBit", { lo: String(field.lsb0Lo), state: field.value === "1" ? s("word.set") : s("word.clear") }) : s("note.field", { hi: String(field.lsb0Hi), lo: String(field.lsb0Lo), span: String(field.span) })); // the field's mask
  const lsbFirstOctets = oct ? oct.map((o) => [...o.toString(2).padStart(8, "0")].reverse().join("")).join(" ") : ""; // each octet least significant bit first
  return {
    mode, // the mode
    width: w, // bits
    widthInferred: inferred !== null, // inferred or given
    hex: hexOf(v, w), // hexadecimal
    decimal: v.toString(), // unsigned
    signed: signed.toString(), // two's complement
    binary: bin, // most significant first
    binaryLsbFirst: [...bin].reverse().join(""), // least significant first
    octets: oct ? oct.map((o) => o.toString(16).toUpperCase().padStart(2, "0")) : null, // the octets
    bits, // every bit
    setBits: { lsb0: setRows.map((b) => b.lsb0).sort((a, b) => a - b), msb0: setRows.map((b) => b.msb0).sort((a, b) => a - b), one: setRows.map((b) => b.one).sort((a, b) => a - b) }, // the set bits
    ones: count, // how many ones
    parityEven: (count % 2) as 0 | 1, // the bit that makes the count even
    parityOdd: (1 - (count % 2)) as 0 | 1, // the bit that makes it odd
    lowestSet: count ? Math.min(...setRows.map((b) => b.lsb0)) : null, // BSF's answer
    highestSet: count ? Math.max(...setRows.map((b) => b.lsb0)) : null, // BSR's answer
    reversed: hexOf(reverseBits(v, w), w), // the whole width
    reversedPerOctet: oct ? hexOf(fromOctets(oct.map(rev8)), w) : null, // each octet in place
    byteSwapped: oct && oct.length > 1 ? hexOf(fromOctets([...oct].reverse()), w) : null, // the octets reversed
    wire: oct ? { lsbFirst: lsbFirstOctets, msbFirst: oct.map((o) => o.toString(2).padStart(8, "0")).join(" ") } : null, // the two link orders
    printed, // printed mode's part
    layout, // the layout
    field, // the field
    notes, // the sentences
  }; // the reading
} // readValue

/**
 * The value-mode reading.
 * @param r the request
 * @returns the reading
 */
function valueLocalisable(r: ValueRequest): ValueResult<EngineText> {
  const p = parseValue(text(r.input)); // the number
  const given = parseWidth(text(r.width)); // the width, if given
  const w = given ?? p.implied.width; // the width
  if (p.negative) { // a two's complement value
    const min = -(1n << BigInt(w - 1)); // the smallest
    const max = (1n << BigInt(w - 1)) - 1n; // the largest
    if (p.magnitude > -min) throw refuse("err.negativeFit", { value: `-${p.magnitude}`, width: String(w), min: min.toString(), max: max.toString() }); // too negative
    const v = p.magnitude === 0n ? 0n : (1n << BigInt(w)) - p.magnitude; // the bits
    return readValue("value", v, w, given === null ? p.implied.how : null, null, r); // read
  } // negative
  if (p.magnitude > ones(w)) throw refuse("err.fit", { need: String(p.magnitude.toString(2).length), width: String(w) }); // too big
  return readValue("value", p.magnitude, w, given === null ? p.implied.how : null, null, r); // read
} // valueLocalisable

/**
 * The printed-mode reading.
 * @param r the request
 * @returns the reading
 */
function printedLocalisable(r: PrintedRequest): ValueResult<EngineText> {
  const raw = text(r.input); // as typed
  if (raw === "") throw refuse("err.empty"); // nothing typed
  if (!PRINTED_RE.test(raw)) throw refuse("err.printed", { value: raw }); // only bits
  const typed = raw.replace(/[ _.]/g, ""); // the bits
  if (typed.length > MAX_WIDTH) throw refuse("err.tooWide"); // past 64 bits
  const orderRaw = text(r.order); // the order as typed
  if (orderRaw !== "" && orderRaw !== "msb-first" && orderRaw !== "lsb-first") throw refuse("err.order"); // unknown
  const order: PrintOrder = orderRaw === "lsb-first" ? "lsb-first" : "msb-first"; // the default is the usual order
  const msbFirst = order === "msb-first" ? typed : [...typed].reverse().join(""); // the bits most significant first
  const other = order === "msb-first" ? [...typed].reverse().join("") : typed; // read the other way
  const w = typed.length; // the width
  const v = BigInt(`0b${msbFirst}`); // the value
  const o = BigInt(`0b${other}`); // the other reading
  return readValue("printed", v, w, null, { order, typed, otherHex: hexOf(o, w), otherDecimal: o.toString() }, r); // read
} // printedLocalisable

// ----------------------------------------------------------------------------
// MAC mode
// ----------------------------------------------------------------------------

/**
 * Six octets in hyphenated upper-case form.
 * @param o the octets
 * @returns the text
 */
function hyphen(o: number[]): string {
  return o.map((x) => x.toString(16).toUpperCase().padStart(2, "0")).join("-"); // 12-34-56-78-9A-BC
} // hyphen

/**
 * The MAC-mode reading.
 * @param r the request
 * @returns the reading
 */
function macLocalisable(r: MacRequest): MacResult<EngineText> {
  const typed = parseMac(text(r.input)); // the six octets as typed
  const formRaw = text(r.form); // the form as typed
  if (formRaw !== "" && formRaw !== "canonical" && formRaw !== "reversed") throw refuse("err.form"); // unknown
  const form: MacForm = formRaw === "reversed" ? "reversed" : "canonical"; // the default is Ethernet's
  const canonical = form === "canonical" ? typed : typed.map(rev8); // each octet reversed back
  const reversed = canonical.map(rev8); // the MSB format
  const first = canonical[0]; // the first octet
  const group = (first & 0x01) === 1; // I/G
  const local = (first & 0x02) === 2; // U/L
  const broadcast = canonical.every((x) => x === 0xff); // all ones
  const y = ((first >> 2) & 1) as 0 | 1; // Y
  const z = ((first >> 3) & 1) as 0 | 1; // Z
  const quadrant = y === 0 ? (z === 0 ? "aai" : "eli") : z === 0 ? "reserved" : "sai"; // RFC 9542 Table 2
  const notes: EngineText[] = [s("note.mac.bits"), s("note.mac.canonical"), s("note.mac.reversed")]; // the rules
  if (form === "reversed") notes.push(s("note.mac.typedReversed")); // the form typed
  if (local) notes.push(s("note.mac.slap")); // the SLAP
  notes.push(s("note.mac.bridges")); // the bridges
  return {
    mode: "mac", // the mode
    form, // as typed
    formDefault: formRaw === "", // the default was used
    canonical: hyphen(canonical), // canonical, hyphens
    canonicalColon: canonical.map((x) => x.toString(16).padStart(2, "0")).join(":"), // canonical, colons
    reversed: hyphen(reversed), // MSB format
    firstOctetBits: first.toString(2).padStart(8, "0"), // the first octet
    group, // I/G
    local, // U/L
    broadcast, // all ones
    slap: local ? { y, z, quadrant, name: s(`mac.slap.${quadrant}` as SentenceId) } : null, // the quadrant of a local address
    wire: canonical.map((x) => [...x.toString(2).padStart(8, "0")].reverse().join("")).join(" "), // Ethernet's order
    firstBitOnWire: (first & 1) as 0 | 1, // the I/G bit
    reversedMisread: { group: (reversed[0] & 1) === 1, local: (reversed[0] & 2) === 2 }, // the reversed form read as if it were canonical
    notes, // the sentences
  }; // the reading
} // macLocalisable

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The page's entry: any mode, sentences as EngineTexts.
 * @param r the request (its mode picks the computation)
 * @returns the reading
 */
export function runLocalisable(r: BitRequest): BitResult<EngineText> {
  if (r && typeof r === "object" && r.mode === "value") return valueLocalisable(r); // a number
  if (r && typeof r === "object" && r.mode === "printed") return printedLocalisable(r); // a printed string
  if (r && typeof r === "object" && r.mode === "mac") return macLocalisable(r); // a MAC address
  throw refuse("err.mode"); // no mode
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param r the request
 * @returns the reading as the API returns it
 */
export function run(r: BitRequest): BitResult {
  return plainText(runLocalisable(r)) as BitResult; // sentences as their English
} // run

/**
 * The API's entry: the request body as JSON text.
 * @param input the JSON text
 * @returns the reading
 */
export function runApi(input: string): BitResult {
  let parsed: unknown; // the body
  try {
    parsed = JSON.parse(input); // the object
  } catch {
    throw refuse("err.json"); // a readable refusal, passed through by the Worker
  } // parsed
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw refuse("err.json"); // not an object
  return run(parsed as BitRequest); // the same engine as the page
} // runApi
