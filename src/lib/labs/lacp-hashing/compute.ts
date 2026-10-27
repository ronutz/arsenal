// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/lacp-hashing/compute.ts
// ----------------------------------------------------------------------------
// THE LACP HASHING LAB'S MODEL (2026-10-26), the interactive companion of the
// article "Link aggregation and LACP". A Linux server, 192.0.2.10, sends over
// an 802.3ad (LACP) bond of two to eight 1 Gb/s members, numbered from 0 in
// the order they were added. It has six flows it may send: two backup streams
// to the same host behind the router, a database replication stream and a web
// reply behind the router, and two transfers to hosts on its own LAN. The
// reader picks the member count, the transmit hash policy, which flows are
// running and which member (if any) has failed. The model hashes every flow
// with the Linux bonding driver's documented formula for that policy, reduces
// the hash modulo the number of members up, and gives each flow's member, the
// load on each member, and which flows move when a member fails.
//
// IEEE 802.1AX leaves the choice of member to the implementation, so this is
// ONE implementation's documented scheme, the Linux bonding driver's, and the
// lab says so. The rules, from the kernel's "Linux Ethernet Bonding Driver
// HOWTO" (Documentation/networking/bonding.rst, read on docs.kernel.org and
// kernel.org on 2026-10-26), section xmit_hash_policy:
//   layer2:   hash = source MAC[5] XOR destination MAC[5] XOR packet type ID;
//             slave number = hash modulo slave count.
//   layer2+3: hash = source MAC[5] XOR destination MAC[5] XOR packet type ID;
//             hash = hash XOR source IP XOR destination IP;
//             hash = hash XOR (hash RSHIFT 16); hash = hash XOR (hash RSHIFT 8);
//             then reduced modulo slave count.
//   layer3+4: hash = source port, destination port (as in the header);
//             hash = hash XOR source IP XOR destination IP;
//             hash = hash XOR (hash RSHIFT 16); hash = hash XOR (hash RSHIFT 8);
//             hash = hash RSHIFT 1; then reduced modulo slave count.
//   The default is layer2.
// Two details the HOWTO leaves implicit were read in the driver's own source
// (drivers/net/bonding/bond_main.c, torvalds/linux master, read on
// 2026-10-26): the packet type ID is the EtherType, be16_to_cpu(h_proto), so
// 0x0800 for IPv4 (bond_eth_hash); and the members a hash is reduced over are
// the usable ones, rebuilt in the bond's own order when one goes down
// (bond_update_slave_arr), the member picked being arr[hash % count]
// (bond_xmit_3ad_xor_slave_get). So after a failure the surviving members are
// numbered again from 0 in their original order.
//
// Byte order: the lab reads the addresses and the two ports as they are written
// in the formulas and in the header, most significant byte first, as 32-bit
// unsigned numbers. The driver XORs the same header bytes as the processor
// loads them (bond_ip_hash casts the big-endian address to u32; the ports are
// copied with memcpy), so on a little-endian processor the hash values, and
// which member a given flow lands on, differ from the lab's. Which fields count,
// the folding, the modulo and the reshuffle after a failure are the same; the
// lab's scope note says so.
//
// What the model leaves out: IPv6 (ipv6_addr_hash), fragments and non-IP
// traffic, the encap and vlan+srcmac policies, the switch's own hash for the
// traffic coming back, the 802.3ad aggregator selection, and flows whose rate
// changes over time.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The transmit hash policies the lab models. */
export type HashPolicy = "layer2" | "layer2+3" | "layer3+4";
/** Every value the policy control can take. */
export const POLICIES: readonly HashPolicy[] = Object.freeze(["layer2", "layer2+3", "layer3+4"]);
/** The fewest members the lab offers. */
export const MIN_MEMBERS = 2;
/** The most members the lab offers (the Catalyst 9300's active LACP limit, as the article quotes). */
export const MAX_MEMBERS = 8;
/** Each member's speed in Mb/s: the lab's bond is made of 1 Gb/s links. */
export const MEMBER_MBPS = 1000;
/** The packet type ID of IPv4: the EtherType 0x0800 (bond_eth_hash: be16_to_cpu(h_proto)). */
export const ETHERTYPE_IPV4 = 0x0800;
/** The server's MAC address (RFC 9542 documentation range) and IPv4 address (RFC 5737). */
export const SERVER = Object.freeze({ mac: "00:00:5e:00:53:0a", ip: "192.0.2.10" });
/** The router's MAC address: every flow to another network goes to it. */
export const ROUTER_MAC = "00:00:5e:00:53:01";

/** One flow the server can send. */
export interface FlowDef {
  /** Stable id, F1 to F6. */
  id: string;
  /** What it is, as a message key suffix. */
  kind: "backup" | "replication" | "web" | "nfs" | "smb";
  /** Destination IPv4 address. */
  dstIp: string;
  /** Destination MAC: the router's for other networks, the host's own on the LAN. */
  dstMac: string;
  /** True when the destination is on the server's own LAN. */
  onLan: boolean;
  /** Source TCP port. */
  srcPort: number;
  /** Destination TCP port. */
  dstPort: number;
  /** Its rate in Mb/s. */
  mbps: number;
}

/** The six flows (documentation addresses: RFC 5737 for IPv4, RFC 9542 for MACs). */
export const FLOWS: readonly FlowDef[] = Object.freeze([
  // Backup stream 1 to the backup server behind the router (rsync, TCP 873).
  { id: "F1", kind: "backup", dstIp: "198.51.100.20", dstMac: ROUTER_MAC, onLan: false, srcPort: 50001, dstPort: 873, mbps: 900 },
  // Backup stream 2 to the same server, from the next source port.
  { id: "F2", kind: "backup", dstIp: "198.51.100.20", dstMac: ROUTER_MAC, onLan: false, srcPort: 50002, dstPort: 873, mbps: 900 },
  // Database replication to another host behind the router (TCP 5432).
  { id: "F3", kind: "replication", dstIp: "198.51.100.21", dstMac: ROUTER_MAC, onLan: false, srcPort: 50003, dstPort: 5432, mbps: 300 },
  // A web reply to a client on another network, from TCP 443.
  { id: "F4", kind: "web", dstIp: "203.0.113.30", dstMac: ROUTER_MAC, onLan: false, srcPort: 443, dstPort: 51000, mbps: 100 },
  // NFS to a filer on the same LAN (TCP 2049).
  { id: "F5", kind: "nfs", dstIp: "192.0.2.20", dstMac: "00:00:5e:00:53:14", onLan: true, srcPort: 50005, dstPort: 2049, mbps: 400 },
  // SMB to another host on the same LAN (TCP 445).
  { id: "F6", kind: "smb", dstIp: "192.0.2.21", dstMac: "00:00:5e:00:53:15", onLan: true, srcPort: 50006, dstPort: 445, mbps: 200 },
]);

/** The reader's settings. */
export interface LacpInput {
  /** How many members the bond has, 2 to 8. */
  members: number;
  /** The transmit hash policy. */
  policy: HashPolicy;
  /** Which of F1 to F6 are running, by id. */
  flows: readonly string[];
  /** The failed member (0-based), or null for none. */
  failed: number | null;
}

/** How one flow's hash was worked out, step by step (each value a 32-bit unsigned number). */
export interface HashWork {
  /** The policy it was worked for. */
  policy: HashPolicy;
  /** The starting value: MAC bytes XOR EtherType (layer2, layer2+3), or the ports word (layer3+4). */
  start: number;
  /** After XOR with both IP addresses (null for layer2). */
  afterIps: number | null;
  /** After the two folds (null for layer2). */
  afterFold: number | null;
  /** The final hash (after the shift right by one for layer3+4). */
  hash: number;
}

/** One flow in the result. */
export interface FlowResult {
  /** The flow's definition. */
  flow: FlowDef;
  /** Its hash under the chosen policy. */
  hash: number;
  /** The member it uses with every member up. */
  member: number;
  /** The member it uses after the failure, or null when no member failed. */
  memberAfter: number | null;
  /** True when a failure moved it, although its own member is still up (or because its member is the failed one). */
  moved: boolean;
  /** Its member under each policy with every member up (for the comparison note). */
  byPolicy: Readonly<Record<HashPolicy, number>>;
}

/** The model's answer. */
export interface LacpResult {
  /** Every running flow, in id order. */
  flows: FlowResult[];
  /** The load on each member with every member up, in Mb/s. */
  load: number[];
  /** The load on each member after the failure (the failed one at 0), or null. */
  loadAfter: number[] | null;
  /** The total offered, in Mb/s. */
  total: number;
  /** The busiest member with every member up (the lowest-numbered on a tie), or null when no flow runs. */
  busiest: number | null;
  /** The worked hash of the first running flow, or null when no flow runs. */
  work: HashWork | null;
}

/** The stable codes an invalid input is refused with. */
export type LacpErrorCode = "bad-members" | "bad-policy" | "bad-flow" | "bad-failed";

/** An invalid input, refused with a stable code the interface can word. */
export class LacpError extends Error {
  /** The stable code. */
  readonly code: LacpErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: LacpErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** A dotted IPv4 address as a 32-bit unsigned number, most significant byte first. */
export function ipToNumber(ip: string): number {
  // The four octets.
  const o = ip.split(".").map(Number);
  // Shifted into place; >>> 0 keeps it unsigned.
  return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
}

/** The last byte of a MAC address, MAC[5] in the HOWTO's notation. */
export function macByte5(mac: string): number {
  // The sixth of six hexadecimal pairs.
  return parseInt(mac.split(":")[5], 16);
}

/** Work out one flow's hash under one policy, every intermediate value kept. */
export function hashFlow(f: FlowDef, policy: HashPolicy): HashWork {
  // layer2 and layer2+3 start from the MAC bytes and the packet type ID.
  const l2 = (macByte5(SERVER.mac) ^ macByte5(f.dstMac) ^ ETHERTYPE_IPV4) >>> 0;
  // layer2 stops there.
  if (policy === "layer2") return { policy, start: l2, afterIps: null, afterFold: null, hash: l2 };
  // layer3+4 starts from the two ports as in the header: source port then destination port.
  const start = policy === "layer3+4" ? ((f.srcPort << 16) | f.dstPort) >>> 0 : l2;
  // XOR with both IP addresses.
  const afterIps = (start ^ ipToNumber(SERVER.ip) ^ ipToNumber(f.dstIp)) >>> 0;
  // Fold: XOR with itself shifted right 16.
  let h = (afterIps ^ (afterIps >>> 16)) >>> 0;
  // Fold again: XOR with itself shifted right 8.
  h = (h ^ (h >>> 8)) >>> 0;
  // The value after both folds.
  const afterFold = h;
  // layer3+4 drops the lowest bit (the driver's comment: "to deal with the common even ports pattern").
  const hash = policy === "layer3+4" ? afterFold >>> 1 : afterFold;
  // Every step.
  return { policy, start, afterIps, afterFold, hash };
}

/** Hash every running flow, place it, and say what a failure moves. */
export function compute(input: LacpInput): LacpResult {
  // The member count must be one the lab offers.
  if (!Number.isInteger(input.members) || input.members < MIN_MEMBERS || input.members > MAX_MEMBERS) throw new LacpError("bad-members", `members must be 2 to 8, got ${String(input.members)}`);
  // The policy must be one of the three.
  if (!POLICIES.includes(input.policy)) throw new LacpError("bad-policy", `not a modelled policy: ${String(input.policy)}`);
  // Every flow id must be one of the six.
  for (const id of input.flows) if (!FLOWS.some((f) => f.id === id)) throw new LacpError("bad-flow", `not a lab flow: ${String(id)}`);
  // The failed member must be none or one of the members.
  if (input.failed !== null && (!Number.isInteger(input.failed) || input.failed < 0 || input.failed >= input.members)) throw new LacpError("bad-failed", `not a member: ${String(input.failed)}`);

  // How many members.
  const n = input.members;
  // The members still up after the failure, in the bond's order (bond_update_slave_arr).
  const survivors = input.failed === null ? null : Array.from({ length: n }, (_, i) => i).filter((i) => i !== input.failed);
  // The running flows, in id order.
  const running = FLOWS.filter((f) => input.flows.includes(f.id));
  // Each flow placed.
  const flows: FlowResult[] = running.map((f) => {
    // Its hash under the chosen policy.
    const hash = hashFlow(f, input.policy).hash;
    // Every member up: arr[hash % count].
    const member = hash % n;
    // After the failure: the survivors renumbered from 0, arr[hash % (count - 1)].
    const memberAfter = survivors === null ? null : survivors[hash % survivors.length];
    // Its member under each policy, for the comparison.
    const byPolicy = { layer2: hashFlow(f, "layer2").hash % n, "layer2+3": hashFlow(f, "layer2+3").hash % n, "layer3+4": hashFlow(f, "layer3+4").hash % n };
    // The flow's line.
    return { flow: f, hash, member, memberAfter, moved: memberAfter !== null && memberAfter !== member, byPolicy };
  });
  // The load on each member with every member up.
  const load = Array.from({ length: n }, (_, i) => flows.filter((x) => x.member === i).reduce((s, x) => s + x.flow.mbps, 0));
  // The load after the failure.
  const loadAfter = survivors === null ? null : Array.from({ length: n }, (_, i) => flows.filter((x) => x.memberAfter === i).reduce((s, x) => s + x.flow.mbps, 0));
  // The total offered.
  const total = flows.reduce((s, x) => s + x.flow.mbps, 0);
  // The busiest member (lowest number on a tie), when anything runs.
  const busiest = flows.length ? load.indexOf(Math.max(...load)) : null;
  // The full answer, with the first running flow's hash worked out.
  return { flows, load, loadAfter, total, busiest, work: running.length ? hashFlow(running[0], input.policy) : null };
}

/** The opening state: four members, layer3+4, four flows of different kinds, nothing failed. */
export const DEFAULT_INPUT: LacpInput = { members: 4, policy: "layer3+4", flows: ["F1", "F3", "F5", "F6"], failed: null };

/** The Example: layer2+3 puts the two backup streams, same hosts, on one member (1,800 Mb/s on a 1 Gb/s link); layer3+4 would separate them. */
export const EXAMPLE_INPUT: LacpInput = { members: 4, policy: "layer2+3", flows: ["F1", "F2", "F3", "F4"], failed: null };
