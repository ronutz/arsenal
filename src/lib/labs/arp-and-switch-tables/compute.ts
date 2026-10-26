// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/arp-and-switch-tables/compute.ts
// ----------------------------------------------------------------------------
// THE ARP AND SWITCH TABLES LAB'S MODEL (2026-10-26), the interactive
// companion of the article "ARP and MAC Addresses: How IP Finds Ethernet". Host A (192.0.2.10, on
// switch port 1) sends one IPv4 packet, either to host B on its own subnet
// (192.0.2.20, port 2) or to an address on another network, which goes to the
// router (192.0.2.1, port 4). Two tables decide what happens: A's ARP cache,
// which maps the next hop's IP address to its MAC address, and the switch's
// MAC address table (its forwarding database), which maps a MAC address to a
// port. The reader sets whether A's cache already holds the mapping, whether
// the next hop answers ARP, and what the switch's table says about the next
// hop: nothing, the right port, or port 3, where the next hop was before it
// moved. The model lists every event in order and says whether the packet
// arrives.
//
// The rules, with their sources (the article's, read again on 2026-10-26):
//   - A host resolves a destination on its own subnet directly, and for
//     anything else resolves its default gateway (the article, "The service
//     ARP provides").
//   - Without a mapping, A broadcasts an ARP request; the owner answers with a
//     reply, and A caches the mapping (RFC 826). With no answer there is no
//     mapping and the packet is not sent.
//   - A switch learns the source MAC address of every frame on the port it
//     arrived on, refreshing or replacing the entry; a broadcast, and a
//     unicast for an address it has not learned, go out of every port but the
//     one they came in on; an entry is forgotten 300 seconds after the address
//     was last heard, the Linux bridge's default (Linux kernel, Ethernet
//     bridging).
//   - A known address is forwarded out of the port in the table, whether or
//     not the host is still there.
// What the model leaves out (the lab's scope note): ARP entry timers and
// retries, gratuitous ARP, proxy ARP, VLANs, spanning tree, and the reply
// traffic after the first packet.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** Where the packet is going: host B on the same subnet, or off the subnet through the router. */
export type Target = "peer" | "gateway";
/** Every value the target control can take. */
export const TARGETS: readonly Target[] = ["peer", "gateway"];
/** What the switch's table says about the next hop's MAC address. */
export type FdbState = "none" | "correct" | "stale";
/** Every value the table control can take. */
export const FDB_STATES: readonly FdbState[] = ["none", "correct", "stale"];

/** Host A's port. */
export const PORT_A = 1;
/** The port a stale entry points at: where the next hop used to be. */
export const PORT_OLD = 3;
/** The switch's ageing time in seconds (Linux bridge default). */
export const AGEING_SECONDS = 300;

/** One device on the segment. */
export interface Device {
  /** Its IPv4 address. */
  ip: string;
  /** Its MAC address (documentation range of RFC 9542). */
  mac: string;
  /** The switch port it is on now. */
  port: number;
}

/** Host A. */
export const HOST_A: Device = Object.freeze({ ip: "192.0.2.10", mac: "00-00-5E-00-53-10", port: PORT_A });
/** Host B, on A's subnet. */
export const HOST_B: Device = Object.freeze({ ip: "192.0.2.20", mac: "00-00-5E-00-53-20", port: 2 });
/** The router, A's default gateway. */
export const ROUTER: Device = Object.freeze({ ip: "192.0.2.1", mac: "00-00-5E-00-53-01", port: 4 });
/** The off-subnet destination used when the target is the gateway. */
export const REMOTE_DESTINATION = "198.51.100.7";

/** The reader's settings. */
export interface ArpSwitchInput {
  /** Same subnet or through the gateway. */
  target: Target;
  /** True when A's ARP cache already holds the next hop's mapping. */
  arpCached: boolean;
  /** True when the next hop answers an ARP request. */
  answers: boolean;
  /** What the switch's table holds for the next hop. */
  fdb: FdbState;
}

/** One event, in order. */
export type EventCode =
  | "arp-request"
  | "learn-a"
  | "flood-broadcast"
  | "arp-reply"
  | "learn-next-hop"
  | "reply-forwarded"
  | "arp-cached"
  | "arp-silent"
  | "data-sent"
  | "flood-unknown"
  | "forward-known"
  | "forward-stale";

/** How it ends. */
export type Outcome = "delivered" | "delivered-flooded" | "misdelivered" | "no-mapping";

/** The model's answer. */
export interface ArpSwitchResult {
  /** The packet's destination address. */
  destination: string;
  /** The next hop A resolves. */
  nextHop: Device;
  /** The events, in order. */
  events: EventCode[];
  /** A's ARP entry for the next hop at the end: its MAC, or null when unresolved. */
  arpEntry: string | null;
  /** The switch's port for A at the end, or null. */
  fdbA: number | null;
  /** The switch's port for the next hop at the end, or null. */
  fdbNextHop: number | null;
  /** The port the data frame went out of (null when flooded or never sent). */
  sentToPort: number | null;
  /** How it ends. */
  outcome: Outcome;
}

/** The stable codes an invalid input is refused with. */
export type ArpSwitchErrorCode = "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class ArpSwitchError extends Error {
  /** The stable code. */
  readonly code: ArpSwitchErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: ArpSwitchErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Follow one packet from A through the two tables. */
export function compute(input: ArpSwitchInput): ArpSwitchResult {
  // Every field comes from a select: anything else is a programming error.
  if (!TARGETS.includes(input.target) || !FDB_STATES.includes(input.fdb) || typeof input.arpCached !== "boolean" || typeof input.answers !== "boolean") throw new ArpSwitchError("bad-choice", "unknown setting");

  // The next hop: B itself, or the router for an off-subnet destination.
  const nextHop = input.target === "peer" ? HOST_B : ROUTER;
  // The packet's destination address.
  const destination = input.target === "peer" ? HOST_B.ip : REMOTE_DESTINATION;
  // The events, in order.
  const events: EventCode[] = [];
  // The switch's entry for A: unknown until A sends a frame.
  let fdbA: number | null = null;
  // The switch's entry for the next hop, as the reader set it.
  let fdbNextHop: number | null = input.fdb === "none" ? null : input.fdb === "correct" ? nextHop.port : PORT_OLD;
  // A's ARP entry.
  let arpEntry: string | null = input.arpCached ? nextHop.mac : null;

  // No mapping yet: ask.
  if (!input.arpCached) {
    // A broadcasts "who has" the next hop's address.
    events.push("arp-request");
    // The switch learns A's address on port 1.
    events.push("learn-a");
    // Learned.
    fdbA = PORT_A;
    // A broadcast goes out of every port but port 1.
    events.push("flood-broadcast");
    // Silence: no mapping, nothing sent.
    if (!input.answers) {
      // Nobody answered.
      events.push("arp-silent");
      // The packet never leaves A.
      return { destination, nextHop, events, arpEntry: null, fdbA, fdbNextHop, sentToPort: null, outcome: "no-mapping" };
    }
    // The next hop answers with a unicast reply to A.
    events.push("arp-reply");
    // The switch learns the next hop on the port the reply came in on, replacing any stale entry.
    events.push("learn-next-hop");
    // Learned or corrected.
    fdbNextHop = nextHop.port;
    // A is known on port 1, so the reply goes there.
    events.push("reply-forwarded");
    // A caches the mapping.
    events.push("arp-cached");
    // Resolved.
    arpEntry = nextHop.mac;
  }

  // A sends the data frame to the next hop's MAC address.
  events.push("data-sent");
  // The switch learns, or refreshes, A on port 1 (once is enough to list).
  if (fdbA === null) {
    // Listed the first time.
    events.push("learn-a");
    // Learned.
    fdbA = PORT_A;
  }
  // Unknown destination: flooded, so the next hop gets it, and so does every other port.
  if (fdbNextHop === null) {
    // Flooded.
    events.push("flood-unknown");
    // Delivered by flooding.
    return { destination, nextHop, events, arpEntry, fdbA, fdbNextHop, sentToPort: null, outcome: "delivered-flooded" };
  }
  // Known on the right port: forwarded and delivered.
  if (fdbNextHop === nextHop.port) {
    // Forwarded.
    events.push("forward-known");
    // Delivered.
    return { destination, nextHop, events, arpEntry, fdbA, fdbNextHop, sentToPort: fdbNextHop, outcome: "delivered" };
  }
  // Known on the wrong port: forwarded where the next hop used to be.
  events.push("forward-stale");
  // Lost until the next hop sends a frame or the entry ages out.
  return { destination, nextHop, events, arpEntry, fdbA, fdbNextHop, sentToPort: fdbNextHop, outcome: "misdelivered" };
}

/** The opening state: an empty cache and an empty table; ARP, then a flooded first frame. */
export const DEFAULT_INPUT: ArpSwitchInput = { target: "peer", arpCached: false, answers: true, fdb: "none" };
/** The Example: B has moved to port 2, A's cache is warm and the switch still says port 3. */
export const EXAMPLE_INPUT: ArpSwitchInput = { target: "peer", arpCached: true, answers: true, fdb: "stale" };
