// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/ethernet-frame-builder/compute.ts
// ----------------------------------------------------------------------------
// THE ETHERNET FRAME BUILDER LAB'S MODEL (2026-10-26), the interactive
// companion of the article "The Ethernet frame, field by field". The reader
// types a destination MAC address, chooses an 802.1Q tag or none, the protocol
// inside and the size of the packet it carries, and a link speed; the model
// lays the frame out field by field, reads the destination's two special bits,
// and gives the frame's size, its size on the wire and the most frames per
// second the link can carry. The source address is fixed at a documentation
// address, 00-00-5E-00-53-02.
//
// The rules are the article's, each with its source there:
//   - The frame is preamble (7), start frame delimiter (1), destination (6),
//     source (6), an optional 802.1Q tag (4), Length/Type (2), payload, FCS
//     (4); the sizes people quote count from the destination to the FCS
//     (IEEE 802.3 overview; Juniper).
//   - The least significant bit of the first octet is I/G: 0 for one station,
//     1 for a group; the next is U/L: 0 for an address assigned under an IEEE
//     block, 1 for a local one; all ones is broadcast (IEEE RA guidelines;
//     RFC 9542).
//   - The Type is 0x0800 for IPv4, 0x86DD for IPv6, 0x0806 for ARP (IANA, IEEE
//     802 Numbers); a tag is TPID 0x8100 and twelve bits of VID, 1 to 4094
//     usable (Cisco, 802.1Q frame format).
//   - A packet shorter than 46 octets is padded with zeros to 46 (RFC 894);
//     Cisco gives the smallest tagged frame as 68 bytes, 46 of payload plus
//     22, so the lab pads tagged frames to 46 as well.
//   - Every frame is preceded by 8 octets of preamble and delimiter and
//     followed by an interpacket gap of 96 bit times, 12 octets (IEEE 802.3
//     interpretation; Nokia).
// What the model leaves out (the lab's scope note): the FCS value itself,
// jumbo and envelope frames, LLC and SNAP, double tags, the priority and DEI
// bits, and half duplex.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The protocol inside the frame. */
export type Protocol = "ipv4" | "ipv6" | "arp";
/** Every value the protocol control can take. */
export const PROTOCOLS: readonly Protocol[] = ["ipv4", "ipv6", "arp"];
/** The EtherType of each protocol. */
export const ETHERTYPE: Readonly<Record<Protocol, string>> = Object.freeze({ ipv4: "0x0800", ipv6: "0x86DD", arp: "0x0806" });
/** The link speed. */
export type Rate = "10M" | "100M" | "1G" | "10G";
/** Every value the rate control can take. */
export const RATES: readonly Rate[] = ["10M", "100M", "1G", "10G"];
/** Each rate in bits per second. */
export const RATE_BPS: Readonly<Record<Rate, number>> = Object.freeze({ "10M": 1e7, "100M": 1e8, "1G": 1e9, "10G": 1e10 });

/** The fixed source address (documentation range of RFC 9542). */
export const SOURCE_MAC = "00-00-5E-00-53-02";
/** Preamble and start frame delimiter, in octets. */
export const PREAMBLE_SFD = 8;
/** The interpacket gap, in octets (96 bit times). */
export const GAP = 12;
/** The smallest payload field, in octets. */
export const MIN_PAYLOAD = 46;
/** The largest payload field, in octets. */
export const MAX_PAYLOAD = 1500;

/** The reader's settings. */
export interface FrameInput {
  /** The destination MAC address, as typed. */
  destination: string;
  /** True when the frame carries an 802.1Q tag. */
  tagged: boolean;
  /** The VLAN id in the tag (ignored when untagged). */
  vid: number;
  /** The protocol inside. */
  protocol: Protocol;
  /** The size of the packet carried, in octets. */
  packet: number;
  /** The link speed. */
  rate: Rate;
}

/** One field of the frame. */
export interface Field {
  /** Stable id. */
  id: "preamble" | "sfd" | "destination" | "source" | "tag" | "type" | "payload" | "fcs" | "gap";
  /** Its size in octets. */
  octets: number;
}

/** The model's answer. */
export interface FrameResult {
  /** The destination in canonical form, upper-case and hyphenated. */
  destination: string;
  /** The first octet in binary, most significant bit first. */
  firstOctetBits: string;
  /** The I/G bit: true for a group address. */
  group: boolean;
  /** The U/L bit: true for a locally administered address. */
  local: boolean;
  /** True for FF-FF-FF-FF-FF-FF. */
  broadcast: boolean;
  /** The EtherType of the protocol inside. */
  etherType: string;
  /** Zero octets added to reach the 46-octet minimum. */
  pad: number;
  /** The fields in wire order, the gap last. */
  fields: Field[];
  /** The frame from destination to FCS, in octets. */
  frame: number;
  /** The frame on the wire with preamble, delimiter and gap, in octets. */
  wire: number;
  /** The most such frames per second the link carries. */
  maxFramesPerSecond: number;
  /** The packet's share of the wire time, in per cent. */
  packetShare: number;
}

/** The stable codes an invalid input is refused with. */
export type FrameErrorCode = "bad-mac" | "bad-vid" | "bad-packet" | "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class FrameError extends Error {
  /** The stable code. */
  readonly code: FrameErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: FrameErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Read a MAC address written with colons, hyphens, Cisco-style dots or nothing; null if it is not one. */
export function parseMac(text: string): number[] | null {
  // Keep only the hex digits once the usual separators are removed.
  const hex = text.trim().replace(/[:.-]/g, "");
  // Exactly twelve hex digits, nothing else (a fixed-length test: no backtracking).
  if (!/^[0-9a-fA-F]{12}$/.test(hex)) return null;
  // Six octets.
  return [0, 2, 4, 6, 8, 10].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

/** Build the frame and measure it. */
export function compute(input: FrameInput): FrameResult {
  // The selects can only send these values.
  if (!PROTOCOLS.includes(input.protocol) || !RATES.includes(input.rate) || typeof input.tagged !== "boolean") throw new FrameError("bad-choice", "unknown protocol, rate or tag setting");
  // The destination must be a MAC address.
  const octets = parseMac(input.destination);
  // Refuse anything else.
  if (!octets) throw new FrameError("bad-mac", "destination must be a 48-bit MAC address");
  // A tagged frame needs a usable VLAN id.
  if (input.tagged && (!Number.isInteger(input.vid) || input.vid < 1 || input.vid > 4094)) throw new FrameError("bad-vid", "vid must be an integer from 1 to 4094");
  // The packet must fit the payload field.
  if (!Number.isInteger(input.packet) || input.packet < 1 || input.packet > MAX_PAYLOAD) throw new FrameError("bad-packet", `packet must be an integer from 1 to ${MAX_PAYLOAD}`);

  // The first octet, which carries both special bits.
  const first = octets[0];
  // I/G: the least significant bit.
  const group = first % 2 === 1;
  // U/L: the next bit.
  const local = Math.floor(first / 2) % 2 === 1;
  // Broadcast: every octet 0xFF.
  const broadcast = octets.every((o) => o === 255);
  // Padding up to the 46-octet minimum.
  const pad = Math.max(0, MIN_PAYLOAD - input.packet);
  // The tag's size.
  const tag = input.tagged ? 4 : 0;
  // The fields in wire order.
  const fields: Field[] = [
    // Preamble.
    { id: "preamble", octets: 7 },
    // Start frame delimiter.
    { id: "sfd", octets: 1 },
    // Destination address.
    { id: "destination", octets: 6 },
    // Source address.
    { id: "source", octets: 6 },
    // The tag, when present.
    ...(input.tagged ? [{ id: "tag" as const, octets: 4 }] : []),
    // Length/Type.
    { id: "type", octets: 2 },
    // The packet and its padding.
    { id: "payload", octets: input.packet + pad },
    // Frame check sequence.
    { id: "fcs", octets: 4 },
    // The silence after it.
    { id: "gap", octets: GAP },
  ];
  // From destination to FCS.
  const frame = 6 + 6 + tag + 2 + input.packet + pad + 4;
  // On the wire, with preamble, delimiter and gap.
  const wire = frame + PREAMBLE_SFD + GAP;
  // The full answer.
  return {
    // Canonical spelling.
    destination: octets.map((o) => o.toString(16).toUpperCase().padStart(2, "0")).join("-"),
    // The first octet's bits.
    firstOctetBits: first.toString(2).padStart(8, "0"),
    // I/G.
    group,
    // U/L.
    local,
    // Broadcast.
    broadcast,
    // The type.
    etherType: ETHERTYPE[input.protocol],
    // Padding.
    pad,
    // The layout.
    fields,
    // Frame size.
    frame,
    // Wire size.
    wire,
    // Frames per second at line rate.
    maxFramesPerSecond: RATE_BPS[input.rate] / (wire * 8),
    // How much of the wire time is the packet.
    packetShare: (input.packet / wire) * 100,
  };
}

/** The opening state: a full-size IPv4 packet to one station, untagged, at 1 Gb/s. */
export const DEFAULT_INPUT: FrameInput = { destination: "00-00-5E-00-53-01", tagged: false, vid: 10, protocol: "ipv4", packet: 1500, rate: "1G" };
/** The Example: an ARP request on VLAN 10, broadcast, 28 octets padded to 46: the smallest tagged frame. */
export const EXAMPLE_INPUT: FrameInput = { destination: "FF-FF-FF-FF-FF-FF", tagged: true, vid: 10, protocol: "arp", packet: 28, rate: "1G" };
