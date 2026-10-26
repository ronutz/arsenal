// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/vlsm-allocation-order/compute.ts
// ----------------------------------------------------------------------------
// THE VLSM ALLOCATION-ORDER LAB'S MODEL (2026-10-26), the interactive
// companion of the article "A VLSM allocation, worked end to end". The article's parent block,
// 203.0.113.0/24, and its five requests, in the order they arrived: Link A
// and Link B (router to router, 2 hosts each), Management, Office and Guest
// Wi-Fi. The reader sets the three host counts, numbers the links as /30 or
// /31, and picks the placement order: largest first, as the requests arrived,
// or smallest first. The model places each block and accounts for every
// address of the parent.
//
// The rules are the article's, each with its source there:
//   - A segment gets the smallest power of two that holds its hosts plus two
//     (the network and broadcast addresses): RFC 4632, 3.1; RFC 1812,
//     4.2.2.11; RFC 1122, 3.2.1.3. A link numbered as a /31 takes exactly two
//     addresses, both hosts (RFC 3021, 2.1).
//   - A block can start only on a multiple of its own size, because its
//     network address has every host bit at zero (RFC 1812, 2.2.5.2). Each
//     block is placed at the first such address at or after the end of the
//     previous one; the addresses skipped on the way are a gap.
//   - A block that would run past the parent does not fit. The model does not
//     go back to fill a gap: backtracking is where overlaps come from.
//   - The leftover is written as aligned blocks, largest possible first.
// What the model leaves out (the lab's scope note): growth allowances,
// backtracking into gaps, other parents, IPv6, and how the routers are
// configured.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The parent block's first address as a number: 203.0.113.0. */
export const PARENT_BASE = 203 * 2 ** 24 + 0 * 2 ** 16 + 113 * 2 ** 8 + 0;
/** The parent block's size: a /24, 256 addresses. */
export const PARENT_SIZE = 256;
/** The parent in CIDR notation. */
export const PARENT = "203.0.113.0/24";
/** The most hosts a segment can ask for: a whole /24 less its network and broadcast addresses. */
export const MAX_HOSTS = 254;

/** How the two router-to-router links are numbered. */
export type LinkPrefix = "30" | "31";
/** Every value the link control can take. */
export const LINK_PREFIXES: readonly LinkPrefix[] = ["30", "31"];
/** The order the blocks are placed in. */
export type Order = "largest" | "arrival" | "smallest";
/** Every value the order control can take. */
export const ORDERS: readonly Order[] = ["largest", "arrival", "smallest"];
/** The five segments, by stable id, in the order the requests arrived. */
export type SegmentId = "link-a" | "link-b" | "management" | "office" | "guest";
/** The arrival order. */
export const ARRIVAL: readonly SegmentId[] = ["link-a", "link-b", "management", "office", "guest"];

/** The reader's settings. */
export interface VlsmInput {
  /** Hosts on the office LAN. */
  office: number;
  /** Hosts on the guest Wi-Fi. */
  guest: number;
  /** Hosts on the management segment. */
  management: number;
  /** /30 or /31 for the two links. */
  links: LinkPrefix;
  /** The placement order. */
  order: Order;
}

/** One placed (or refused) segment. */
export interface Placement {
  /** Which segment. */
  id: SegmentId;
  /** Hosts asked for. */
  hosts: number;
  /** The block size in addresses. */
  size: number;
  /** The prefix length. */
  length: number;
  /** The block in CIDR notation, or null when it did not fit. */
  block: string | null;
  /** The first usable address, or null. */
  firstHost: string | null;
  /** The last usable address, or null. */
  lastHost: string | null;
  /** The addresses skipped just before this block, as "first to last", or null. */
  skipped: { from: string; to: string; count: number } | null;
}

/** The model's answer. */
export interface VlsmResult {
  /** The segments in the order they were placed. */
  placements: Placement[];
  /** Addresses taken by the placed blocks. */
  used: number;
  /** Addresses left free. */
  free: number;
  /** Used as a share of the parent, in per cent. */
  utilisation: number;
  /** The free space as aligned blocks, in address order. */
  freeBlocks: string[];
  /** The segments that did not fit. */
  notFitted: SegmentId[];
}

/** The stable codes an invalid input is refused with. */
export type VlsmErrorCode = "bad-hosts" | "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class VlsmError extends Error {
  /** The stable code. */
  readonly code: VlsmErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: VlsmErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** An address as dotted quad, from its number. */
export function ipText(n: number): string {
  // Four octets, most significant first, without bitwise operators.
  return [2 ** 24, 2 ** 16, 2 ** 8, 1].map((d) => Math.floor(n / d) % 256).join(".");
}

/** The smallest power of two that holds the hosts plus the network and broadcast addresses. */
export function blockSize(hosts: number): number {
  // Start at 4 (a /30, the smallest block with two hosts and both reserved addresses).
  let size = 4;
  // Double until hosts + 2 fit.
  while (size < hosts + 2) size *= 2;
  // The block.
  return size;
}

/** The free space between two offsets, as aligned blocks, largest possible first. */
function alignedBlocks(from: number, to: number): string[] {
  // The blocks found.
  const out: string[] = [];
  // The next free offset.
  let at = from;
  // Until the run is used up.
  while (at < to) {
    // The largest power of two that starts here (alignment) and fits before the end.
    let size = 1;
    // Grow while still aligned and still inside the run.
    while (at % (size * 2) === 0 && at + size * 2 <= to && size * 2 <= PARENT_SIZE) size *= 2;
    // Record it in CIDR notation.
    out.push(`${ipText(PARENT_BASE + at)}/${32 - Math.log2(size)}`);
    // Move past it.
    at += size;
  }
  // In address order.
  return out;
}

/** Place the five blocks in the chosen order and account for the parent. */
export function compute(input: VlsmInput): VlsmResult {
  // Each host count is a whole number from 1 to 254.
  for (const h of [input.office, input.guest, input.management]) if (!Number.isInteger(h) || h < 1 || h > MAX_HOSTS) throw new VlsmError("bad-hosts", `host counts must be integers from 1 to ${MAX_HOSTS}`);
  // The selects can only send these values.
  if (!LINK_PREFIXES.includes(input.links) || !ORDERS.includes(input.order)) throw new VlsmError("bad-choice", "unknown link prefix or order");

  // Hosts per segment.
  const hosts: Record<SegmentId, number> = { "link-a": 2, "link-b": 2, management: input.management, office: input.office, guest: input.guest };
  /** A segment's block size: two addresses for a /31 link, else hosts plus two rounded up. */
  const sizeOf = (id: SegmentId): number => (id.startsWith("link") && input.links === "31" ? 2 : blockSize(hosts[id]));
  // The order to place them in (ties keep the arrival order).
  const order = [...ARRIVAL].sort((a, b) => (input.order === "largest" ? sizeOf(b) - sizeOf(a) : input.order === "smallest" ? sizeOf(a) - sizeOf(b) : 0) || ARRIVAL.indexOf(a) - ARRIVAL.indexOf(b));

  // The placements, in placement order.
  const placements: Placement[] = [];
  // Which offsets are taken, for the leftover.
  const taken: [number, number][] = [];
  // The end of the last placed block, as an offset from the parent's base.
  let cursor = 0;
  // Each segment in turn.
  for (const id of order) {
    // Its size and prefix length.
    const size = sizeOf(id);
    // The prefix length that size implies.
    const length = 32 - Math.log2(size);
    // The first multiple of its size at or after the cursor.
    const start = Math.ceil(cursor / size) * size;
    // Past the parent: it does not fit, and the cursor stays where it was.
    if (start + size > PARENT_SIZE) {
      // Recorded as not fitted.
      placements.push({ id, hosts: hosts[id], size, length, block: null, firstHost: null, lastHost: null, skipped: null });
      // Next segment.
      continue;
    }
    // A /31 has no reserved addresses; any other block keeps its first and last.
    const point = size === 2;
    // Placed.
    placements.push({
      // Which segment.
      id,
      // Hosts asked for.
      hosts: hosts[id],
      // Its size.
      size,
      // Its prefix length.
      length,
      // The block.
      block: `${ipText(PARENT_BASE + start)}/${length}`,
      // The first usable address.
      firstHost: ipText(PARENT_BASE + start + (point ? 0 : 1)),
      // The last usable address.
      lastHost: ipText(PARENT_BASE + start + size - (point ? 1 : 2)),
      // The gap just before it, if alignment skipped any addresses.
      skipped: start > cursor ? { from: ipText(PARENT_BASE + cursor), to: ipText(PARENT_BASE + start - 1), count: start - cursor } : null,
    });
    // Mark it taken.
    taken.push([start, start + size]);
    // Move the cursor to its end.
    cursor = start + size;
  }

  // Addresses used.
  const used = taken.reduce((n, [a, b]) => n + (b - a), 0);
  // The free runs: walk the taken blocks in address order.
  const freeBlocks: string[] = [];
  // The next unexamined offset.
  let at = 0;
  // Each taken block, lowest first.
  for (const [a, b] of [...taken].sort((x, y) => x[0] - y[0])) {
    // A run before it is free.
    if (a > at) freeBlocks.push(...alignedBlocks(at, a));
    // Continue after it.
    at = Math.max(at, b);
  }
  // The tail after the last block.
  if (at < PARENT_SIZE) freeBlocks.push(...alignedBlocks(at, PARENT_SIZE));
  // The full answer.
  return {
    // In placement order.
    placements,
    // Used.
    used,
    // Free.
    free: PARENT_SIZE - used,
    // Utilisation, unrounded.
    utilisation: (used / PARENT_SIZE) * 100,
    // The leftover.
    freeBlocks,
    // Who missed out.
    notFitted: placements.filter((p) => p.block === null).map((p) => p.id),
  };
}

/** The opening state: the article's five requests, largest first, links as /30. */
export const DEFAULT_INPUT: VlsmInput = { office: 100, guest: 25, management: 10, links: "30", order: "largest" };
/** The Example: the same requests in the order they arrived; the guest Wi-Fi does not fit. */
export const EXAMPLE_INPUT: VlsmInput = { office: 100, guest: 25, management: 10, links: "30", order: "arrival" };
