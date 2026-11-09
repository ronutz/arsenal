// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bit-numbering-and-order/examples.ts
// ----------------------------------------------------------------------------
// The page's Examples (D-83) and sample chips, in one small module that both
// the golden vectors (which fail when one of these is not a vector) and the
// component (whose Example button and chips fill them) import, so a button can
// never drift from the vectors and the page does not carry the vector set.
//   value    the DNS answer flags 0x81a0 of the Learn article "The DNS Header:
//            Opcode, Status, and Flags", read with the dns-flags layout;
//   printed  Huawei's PortState 10111100 from the display eth-trunk example of
//            the S5700 and S6700 V200R025C00 command reference, printed Bit 1
//            first (chrome read R9): the octet 0x3D;
//   mac      RFC 2469's canonical 12-34-56-78-9A-BC, whose bit-reversed form is
//            48-2C-6A-1E-59-3D.
// ============================================================================

import type { BitRequest } from "./compute"; // the request shape

/** One button: a stable id (its label's pack key) and the request it fills. */
export interface BitExample {
  /** The id: example.<mode> or sample.<id> in the pack. */
  id: string;
  /** The request, exactly as a golden vector pins it. */
  request: BitRequest;
}

/** The three Examples, one per mode. */
export const EXAMPLES: readonly BitExample[] = Object.freeze([
  { id: "value", request: { mode: "value", input: "0x81A0", width: "16", layout: "dns-flags" } }, // golden vector example-value
  { id: "printed", request: { mode: "printed", input: "10111100", order: "lsb-first", layout: "lacp" } }, // golden vector example-printed
  { id: "mac", request: { mode: "mac", input: "12-34-56-78-9A-BC" } }, // golden vector example-mac
] as BitExample[]); // by mode

/** The sample chips under each mode's field. */
export const SAMPLES: readonly BitExample[] = Object.freeze([
  { id: "dnsQuery", request: { mode: "value", input: "0x0120", width: "16", layout: "dns-flags" } }, // golden vector sample-dns-query
  { id: "tcpSynAck", request: { mode: "value", input: "0x12", layout: "tcp-flags" } }, // golden vector sample-tcp-synack
  { id: "tos", request: { mode: "value", input: "0xB8", layout: "tos", numbering: "msb0", from: "0", to: "5" } }, // golden vector field-example
  { id: "tci", request: { mode: "value", input: "0xA014", layout: "vlan-tci" } }, // golden vector sample-tci
  { id: "crc32", request: { mode: "value", input: "0x04C11DB7" } }, // golden vector sample-crc32
  { id: "pppFcs", request: { mode: "value", input: "0x8408" } }, // golden vector sample-ppp-fcs
  { id: "cisco7", request: { mode: "value", input: "0b0111101", width: "8", layout: "lacp" } }, // golden vector sample-cisco-7-digits
  { id: "huaweiUnselect", request: { mode: "printed", input: "10100000", order: "lsb-first", layout: "lacp" } }, // golden vector sample-huawei-unselect
  { id: "huaweiPartner", request: { mode: "printed", input: "10110000", order: "lsb-first", layout: "lacp" } }, // golden vector sample-huawei-partner
  { id: "rfc791", request: { mode: "printed", input: "1 0 1 0 1 0 1 0", order: "msb-first" } }, // golden vector sample-printed-170
  { id: "macReversed", request: { mode: "mac", input: "48-2C-6A-1E-59-3D", form: "reversed" } }, // golden vector sample-mac-reversed
  { id: "macDoc", request: { mode: "mac", input: "00-00-5E-00-53-01" } }, // golden vector sample-mac-doc
  { id: "macIpv6", request: { mode: "mac", input: "33-33-00-00-00-01" } }, // golden vector sample-mac-ipv6-multicast
  { id: "macBroadcast", request: { mode: "mac", input: "FF-FF-FF-FF-FF-FF" } }, // golden vector sample-mac-broadcast
] as BitExample[]); // by mode, in the order the chips show
