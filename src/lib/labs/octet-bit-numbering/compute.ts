// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/octet-bit-numbering/compute.ts
// ----------------------------------------------------------------------------
// THE OCTET BIT NUMBERING LAB'S MODEL (2026-11-08), the interactive companion
// of the article "Least and most significant bit: bit numbering and bit
// order". The reader sets the eight bits of one octet and chooses what the
// octet is (nothing in particular, the first octet of a MAC address, an LACP
// state octet or the TCP flags octet); the model gives the octet's value, each
// bit's number under LSB 0, MSB 0 and 1-based numbering with its weight and
// its name, the octet as an RFC diagram draws it, the order its bits take on an
// Ethernet link, and the value a receiver that assumed the other order would
// read.
//
// The rules are the article's, each with its source there:
//   - LSB 0: bit k weighs 2 to the power k (Intel SDM vol. 1, 1.3.1); MSB 0:
//     "the bit labeled 0 is the most significant bit" (RFC 791 Appendix B);
//     1-based from the low-order bit, "bits 8 (high order bit) to 1 (low order
//     bit)" (RFC 3417 s8).
//   - Ethernet sends each octet "from the lowest order bit to the highest
//     order bit" (RFC 9542 s1.1); a receiver that assumed most significant bit
//     first would read the octet bit-reversed.
//   - Names: I/G is the least significant bit of a MAC address's first octet
//     and U/L the next (IEEE RA guidelines); 802.1AX's LACP_Activity is bit 0
//     (mask 0x01) and Expired bit 7 (IEEE8023-LAG-MIB; Linux if_bonding.h),
//     and Huawei prints them Bit 1 first (its display eth-trunk); TCP's FIN is
//     BIT(0) and CWR BIT(7) in Linux, bits 15 and 8 in IANA's registry.
// What the model leaves out (the lab's scope note): words of more than one
// octet, byte order, and the bit order of links other than Ethernet.
//
// Pure and deterministic: the same input gives the same result; a value
// outside 0 to 255 or an unknown reading is refused with a stable code.
// ============================================================================

/** What the octet is read as. */
export type ReadAs = "none" | "mac" | "lacp" | "tcp"; // a plain octet, a MAC first octet, an LACP state, the TCP flags
/** Every reading the select offers. */
export const READINGS: readonly ReadAs[] = ["none", "mac", "lacp", "tcp"]; // the choices

/** The bit names of each reading, by LSB 0 number (0 to 7); null for a bit with no name of its own. */
export const NAMES: Readonly<Record<ReadAs, readonly (string | null)[]>> = Object.freeze({
  none: [null, null, null, null, null, null, null, null], // a plain octet
  mac: ["I/G", "U/L", null, null, null, null, null, null], // the two special bits (the rest belong to the prefix)
  lacp: ["LACP_Activity", "LACP_Timeout", "Aggregation", "Synchronization", "Collecting", "Distributing", "Defaulted", "Expired"], // 0x01 to 0x80
  tcp: ["FIN", "SYN", "RST", "PSH", "ACK", "URG", "ECE", "CWR"], // BIT(0) to BIT(7)
});

/** The reader's settings. */
export interface OctetInput {
  /** The octet, 0 to 255. */
  value: number;
  /** What it is read as. */
  readAs: ReadAs;
}

/** One bit of the octet. */
export interface OctetBit {
  /** Its LSB 0 number. */
  lsb0: number;
  /** Its MSB 0 number. */
  msb0: number;
  /** Its 1-based number (1 is the least significant bit). */
  one: number;
  /** Its weight, 2 to the power lsb0. */
  weight: number;
  /** Whether it is 1. */
  set: boolean;
  /** Its name in the chosen reading, or null. */
  name: string | null;
}

/** The model's answer. */
export interface OctetResult {
  /** The octet in hexadecimal with 0x. */
  hex: string;
  /** The octet in decimal. */
  decimal: number;
  /** Its bits, most significant first: how an RFC diagram draws them. */
  rfcDrawing: string;
  /** Its bits least significant first: the order Ethernet sends them, and Huawei prints a PortState. */
  wireOrder: string;
  /** The bits, most significant first (index 0 is MSB 0's bit 0). */
  bits: OctetBit[];
  /** The value a receiver reads that takes the wire order for most significant bit first. */
  misread: { hex: string; decimal: number };
  /** The names of the set bits, least significant first (empty when none or not named). */
  setNames: string[];
  /** How many bits are 1. */
  ones: number;
  /** For a MAC first octet: group and local; null otherwise. */
  mac: null | { group: boolean; local: boolean };
}

/** The stable codes an invalid input is refused with. */
export type OctetErrorCode = "bad-value" | "bad-choice"; // out of range, or a reading the select cannot send

/** An invalid input, refused with a stable code the interface can word. */
export class OctetError extends Error {
  /** The stable code. */
  readonly code: OctetErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: OctetErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Read the octet. */
export function compute(input: OctetInput): OctetResult {
  // The select can only send these readings.
  if (!READINGS.includes(input.readAs)) throw new OctetError("bad-choice", "unknown reading");
  // The toggles can only make 0 to 255.
  if (!Number.isInteger(input.value) || input.value < 0 || input.value > 255) throw new OctetError("bad-value", "value must be an integer from 0 to 255");
  // The bits, most significant first.
  const drawing = input.value.toString(2).padStart(8, "0");
  // The same bits least significant first.
  const wire = [...drawing].reverse().join("");
  // What a receiver reads that takes the wire order for most significant first.
  const misread = parseInt(wire, 2);
  // The names of the chosen reading.
  const names = NAMES[input.readAs];
  // Every bit, most significant first.
  const bits: OctetBit[] = [...drawing].map((c, i) => ({ lsb0: 7 - i, msb0: i, one: 8 - i, weight: 2 ** (7 - i), set: c === "1", name: names[7 - i] }));
  // The full answer.
  return {
    // Hexadecimal, two digits.
    hex: `0x${input.value.toString(16).toUpperCase().padStart(2, "0")}`,
    // Decimal.
    decimal: input.value,
    // The RFC drawing.
    rfcDrawing: drawing,
    // The wire order.
    wireOrder: wire,
    // The bits.
    bits,
    // The misread value.
    misread: { hex: `0x${misread.toString(16).toUpperCase().padStart(2, "0")}`, decimal: misread },
    // The named set bits, least significant first.
    setNames: [...bits].reverse().filter((b) => b.set && b.name !== null).map((b) => b.name as string),
    // How many ones.
    ones: bits.filter((b) => b.set).length,
    // The two MAC bits, for a MAC first octet.
    mac: input.readAs === "mac" ? { group: (input.value & 1) === 1, local: (input.value & 2) === 2 } : null,
  };
}

/** Flip one bit (by its LSB 0 number) of an octet. */
export function toggle(value: number, lsb0: number): number {
  // XOR with the bit's weight.
  return value ^ (1 << lsb0);
}

/** The opening state: RFC 791's own example octet, 1 0 1 0 1 0 1 0, read as a plain octet. */
export const DEFAULT_INPUT: OctetInput = { value: 170, readAs: "none" };
/** The Example: Huawei's PortState 10111100 (printed Bit 1 first), which is the LACP state octet 0x3D. */
export const EXAMPLE_INPUT: OctetInput = { value: 0x3d, readAs: "lacp" };
