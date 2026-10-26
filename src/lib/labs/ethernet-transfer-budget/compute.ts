// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/ethernet-transfer-budget/compute.ts
// ----------------------------------------------------------------------------
// THE ETHERNET TRANSFER BUDGET LAB'S MODEL (2026-10-26), the interactive
// companion of the article "Bits, bytes and the two kinds of kilo". One file,
// cut into packets and sent in Ethernet frames over one link. The reader sets
// the file's size and unit (decimal MB or GB, binary MiB or GiB), the link's
// speed, the transport (TCP or UDP, over IPv4 or IPv6), the MTU and whether the
// frames carry an 802.1Q tag; the model counts the packets, sizes the last,
// short one, adds every frame's overhead and gives the bytes on the wire, the
// time they take and the share that is the file.
//
// The rules are the article's, each with its source there:
//   - Kilo, mega and giga are powers of 1000; kibi, mebi and gibi powers of
//     1024 (BIPM SI Brochure; NIST; IEC 80000-13).
//   - Each packet carries the MTU less the IPv4 header (at least 20 octets,
//     RFC 791) or the IPv6 header (40, RFC 8200), less the TCP header (at
//     least 20, RFC 9293) or the UDP header (8, RFC 768). The file fills full
//     packets and the remainder goes in a last, shorter one.
//   - A packet shorter than 46 octets is padded to 46 (RFC 894). Every frame
//     adds 14 octets of header and 4 of FCS, 4 more with an 802.1Q tag
//     (Cisco, 802.1Q frame format), and on the wire 64 bits of preamble and 96
//     bits of gap (RFC 2544, Appendix B).
//   - IPv6 needs a link MTU of at least 1280 octets (RFC 8200, section 5).
//   - Time on the wire is the bits on the wire divided by the link's rate.
// What the model leaves out (the lab's scope note): acknowledgements, TCP
// options, the window and the round trip, slow start, loss and
// retransmission, and anything the application adds.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The size unit. */
export type SizeUnit = "MB" | "MiB" | "GB" | "GiB";
/** Every value the unit control can take. */
export const SIZE_UNITS: readonly SizeUnit[] = ["MB", "MiB", "GB", "GiB"];
/** Bytes in each unit. */
export const UNIT_BYTES: Readonly<Record<SizeUnit, number>> = Object.freeze({ MB: 1e6, MiB: 1048576, GB: 1e9, GiB: 1073741824 });
/** The link speed. */
export type Rate = "10M" | "100M" | "1G" | "10G";
/** Every value the rate control can take. */
export const RATES: readonly Rate[] = ["10M", "100M", "1G", "10G"];
/** Each rate in bits per second. */
export const RATE_BPS: Readonly<Record<Rate, number>> = Object.freeze({ "10M": 1e7, "100M": 1e8, "1G": 1e9, "10G": 1e10 });
/** The transport and IP version. */
export type Transport = "tcp4" | "tcp6" | "udp4";
/** Every value the transport control can take. */
export const TRANSPORTS: readonly Transport[] = ["tcp4", "tcp6", "udp4"];

/** The smallest MTU the lab accepts: IPv4's 576-octet datagram. */
export const MIN_MTU = 576;
/** The largest MTU: Ethernet's 1500-octet payload field. */
export const MAX_MTU = 1500;
/** IPv6's minimum link MTU (RFC 8200, section 5). */
export const IPV6_MIN_MTU = 1280;
/** The largest size the lab accepts, in units. */
export const MAX_SIZE = 1000000;
/** Ethernet header (14) and FCS (4), in octets. */
export const FRAME_OVERHEAD = 18;
/** Preamble (64 bits) and gap (96 bits), in octets. */
export const WIRE_OVERHEAD = 20;
/** The smallest payload field, in octets. */
export const MIN_PAYLOAD = 46;

/** The reader's settings. */
export interface TransferInput {
  /** The file's size, in the unit chosen. */
  size: number;
  /** Decimal or binary megabytes or gigabytes. */
  unit: SizeUnit;
  /** The link's speed. */
  rate: Rate;
  /** The transport and IP version. */
  transport: Transport;
  /** The link MTU, in octets. */
  mtu: number;
  /** True when every frame carries an 802.1Q tag. */
  tagged: boolean;
}

/** The model's answer. */
export interface TransferResult {
  /** The file in bytes. */
  bytes: number;
  /** IP header octets per packet. */
  ipHeader: number;
  /** Transport header octets per packet. */
  l4Header: number;
  /** File bytes per full packet. */
  perPacket: number;
  /** Full packets. */
  fullPackets: number;
  /** File bytes in the last, short packet (0 when the file divides exactly). */
  lastBytes: number;
  /** Packets in all. */
  packets: number;
  /** Zero octets padding the last frame. */
  pad: number;
  /** Octets on the wire for the whole file. */
  wireBytes: number;
  /** Octets on the wire that are not the file. */
  overheadBytes: number;
  /** Time on the wire, in milliseconds. */
  wireMs: number;
  /** Time if only the file's bits crossed, in milliseconds. */
  nominalMs: number;
  /** The file's share of the wire, in per cent. */
  efficiency: number;
}

/** The stable codes an invalid input is refused with. */
export type TransferErrorCode = "bad-size" | "bad-mtu" | "ipv6-mtu" | "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class TransferError extends Error {
  /** The stable code. */
  readonly code: TransferErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: TransferErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Cut the file into frames and measure the wire. */
export function compute(input: TransferInput): TransferResult {
  // The selects can only send these values.
  if (!SIZE_UNITS.includes(input.unit) || !RATES.includes(input.rate) || !TRANSPORTS.includes(input.transport) || typeof input.tagged !== "boolean") throw new TransferError("bad-choice", "unknown unit, rate, transport or tag setting");
  // The size: a positive number within range.
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_SIZE) throw new TransferError("bad-size", `size must be above 0 and at most ${MAX_SIZE}`);
  // The file in whole bytes.
  const bytes = Math.round(input.size * UNIT_BYTES[input.unit]);
  // At least one byte.
  if (bytes < 1) throw new TransferError("bad-size", "the file must be at least one byte");
  // The MTU: a whole number in the lab's range.
  if (!Number.isInteger(input.mtu) || input.mtu < MIN_MTU || input.mtu > MAX_MTU) throw new TransferError("bad-mtu", `mtu must be an integer from ${MIN_MTU} to ${MAX_MTU}`);
  // IPv6 links carry at least 1280.
  if (input.transport === "tcp6" && input.mtu < IPV6_MIN_MTU) throw new TransferError("ipv6-mtu", `IPv6 needs an mtu of at least ${IPV6_MIN_MTU}`);

  // The IP header: 40 for IPv6, 20 for IPv4.
  const ipHeader = input.transport === "tcp6" ? 40 : 20;
  // The transport header: 8 for UDP, 20 for TCP.
  const l4Header = input.transport === "udp4" ? 8 : 20;
  // File bytes per full packet.
  const perPacket = input.mtu - ipHeader - l4Header;
  // Full packets.
  const fullPackets = Math.floor(bytes / perPacket);
  // What is left for the last one.
  const lastBytes = bytes % perPacket;
  // Packets in all.
  const packets = fullPackets + (lastBytes > 0 ? 1 : 0);
  // The last packet's size, headers included (none when the file divides exactly).
  const lastPacket = lastBytes > 0 ? lastBytes + ipHeader + l4Header : 0;
  // Padding to the 46-octet minimum, for the last packet only (a full one is at least 576).
  const pad = lastBytes > 0 ? Math.max(0, MIN_PAYLOAD - lastPacket) : 0;
  // Per-frame overhead around the packet: header, FCS, tag, preamble and gap.
  const around = FRAME_OVERHEAD + (input.tagged ? 4 : 0) + WIRE_OVERHEAD;
  // Every full frame, then the last.
  const wireBytes = fullPackets * (input.mtu + around) + (lastBytes > 0 ? lastPacket + pad + around : 0);
  // The full answer.
  return {
    // The file.
    bytes,
    // Headers.
    ipHeader,
    // Transport header.
    l4Header,
    // Per packet.
    perPacket,
    // Full packets.
    fullPackets,
    // The remainder.
    lastBytes,
    // All packets.
    packets,
    // Padding.
    pad,
    // On the wire.
    wireBytes,
    // Not the file.
    overheadBytes: wireBytes - bytes,
    // Wire time.
    wireMs: (wireBytes * 8 * 1000) / RATE_BPS[input.rate],
    // Bare file time.
    nominalMs: (bytes * 8 * 1000) / RATE_BPS[input.rate],
    // Share.
    efficiency: (bytes / wireBytes) * 100,
  };
}

/** The opening state: 1 GB over 1 Gb/s, TCP over IPv4, MTU 1500, untagged. */
export const DEFAULT_INPUT: TransferInput = { size: 1, unit: "GB", rate: "1G", transport: "tcp4", mtu: 1500, tagged: false };
/** The Example: 10 MiB over IPv6 with a 1280 MTU, tagged, at 1 Gb/s. */
export const EXAMPLE_INPUT: TransferInput = { size: 10, unit: "MiB", rate: "1G", transport: "tcp6", mtu: 1280, tagged: true };
