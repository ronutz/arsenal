// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/rib-to-fib/compute.ts
// ----------------------------------------------------------------------------
// THE RIB-TO-FIB LAB'S MODEL (2026-10-26), the interactive companion of the
// article "Static routes, longest prefix match and administrative distance".
// One router, Cisco's default distances, and up to six candidate routes:
//
//   default    0.0.0.0/0          static, distance 1,   via 192.0.2.1
//   ospf-20    203.0.113.0/24     OSPF,   distance 110, cost 20, via 192.0.2.2
//   ospf-40    203.0.113.0/24     OSPF,   distance 110, cost 40, via 192.0.2.3
//   static-24  203.0.113.0/24     static, distance 1 or 250 (floating), via 192.0.2.9
//   bgp-25     203.0.113.128/25   BGP (internal), distance 200, via 192.0.2.4
//   discard-26 203.0.113.192/26   static, distance 1, discard (a blackhole route)
//
// The reader switches routes on and off, picks the static route's distance and
// whether its next hop resolves, and types a destination. The model works in
// the article's two moments:
//   1. Installation, per prefix: a static route whose next hop does not
//      resolve is not installed; within one protocol the lower metric wins
//      (OSPF's cost 20 over cost 40); between sources for the same prefix the
//      lower administrative distance wins (Cisco, administrative distance;
//      RFC 1812, 5.2.4.4). The static route's two distances, 1 and 250, never
//      tie with OSPF's 110, so no vendor tie-break is needed.
//   2. Forwarding, per packet: of the installed routes that contain the
//      destination, the longest prefix wins (RFC 1812, 5.2.4.3); distance and
//      metric play no part. A discard route drops the packet; no match at all
//      drops it with an ICMP destination unreachable (RFC 1812, as above).
// What the model leaves out (the lab's scope note): equal-cost multipath,
// recursion through other routes, other vendors' distances, route
// redistribution, and how the routes were learned.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The static /24's distance: the default 1, or a floating 250. */
export type StaticChoice = "none" | "ad1" | "ad250";
/** Every value the static control can take. */
export const STATIC_CHOICES: readonly StaticChoice[] = ["none", "ad1", "ad250"];

/** The reader's settings. */
export interface RibToFibInput {
  /** The destination address, as typed. */
  destination: string;
  /** True when the static default route is configured. */
  defaultRoute: boolean;
  /** True when OSPF currently offers 203.0.113.0/24. */
  ospf: boolean;
  /** The static 203.0.113.0/24, absent or at distance 1 or 250. */
  staticRoute: StaticChoice;
  /** True when the static route's next hop, 192.0.2.9, resolves. */
  staticResolves: boolean;
  /** True when BGP offers 203.0.113.128/25. */
  bgp25: boolean;
  /** True when the discard route for 203.0.113.192/26 is configured. */
  discard26: boolean;
}

/** Where a candidate came from. */
export type Source = "static" | "ospf" | "bgp";
/** Why a candidate is or is not in the routing table. */
export type Status = "installed" | "lost-metric" | "lost-distance" | "unresolved";

/** One candidate route and its fate. */
export interface Candidate {
  /** Stable id. */
  id: "default" | "ospf-20" | "ospf-40" | "static-24" | "bgp-25" | "discard-26";
  /** The prefix, in CIDR notation. */
  prefix: string;
  /** Its prefix length. */
  length: number;
  /** Its source. */
  source: Source;
  /** Its administrative distance. */
  distance: number;
  /** Its metric (0 for static and BGP here). */
  metric: number;
  /** Its next hop, or "discard". */
  nextHop: string;
  /** In the table, or why not. */
  status: Status;
}

/** What happens to the packet. */
export type Verdict = "forward" | "discard" | "no-route";

/** The model's answer. */
export interface RibToFibResult {
  /** Every candidate offered, with its fate, in the table's order. */
  candidates: Candidate[];
  /** The installed routes that contain the destination, longest first. */
  matches: string[];
  /** The winning route's id, or null. */
  winner: Candidate["id"] | null;
  /** What happens to the packet. */
  verdict: Verdict;
}

/** The stable codes an invalid input is refused with. */
export type RibToFibErrorCode = "bad-destination" | "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class RibToFibError extends Error {
  /** The stable code. */
  readonly code: RibToFibErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: RibToFibErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** A dotted-quad IPv4 address as a 32-bit number, or null if it is not one. */
export function ipv4ToNumber(text: string): number | null {
  // Four decimal parts, each one to three digits.
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text.trim());
  // Not the shape of an address.
  if (!m) return null;
  // The four octets.
  const parts = m.slice(1).map(Number);
  // Each octet must be 0 to 255.
  if (parts.some((p) => p > 255)) return null;
  // Combine without bitwise operators, which would turn the result negative.
  return parts.reduce((n, p) => n * 256 + p, 0);
}

/** True when the address lies inside the prefix. */
function contains(prefix: string, address: number): boolean {
  // The network part and the length.
  const [net, len] = prefix.split("/");
  // The network as a number (the lab's own prefixes always parse).
  const base = ipv4ToNumber(net) ?? 0;
  // The block size.
  const size = 2 ** (32 - Number(len));
  // Inside when between the first and last address of the block.
  return address >= base && address < base + size;
}

/** Install the candidates, then look the destination up. */
export function compute(input: RibToFibInput): RibToFibResult {
  // The selects can only send these values.
  if (!STATIC_CHOICES.includes(input.staticRoute) || [input.defaultRoute, input.ospf, input.staticResolves, input.bgp25, input.discard26].some((b) => typeof b !== "boolean")) throw new RibToFibError("bad-choice", "unknown route setting");
  // The destination must be a dotted-quad IPv4 address.
  const dest = ipv4ToNumber(input.destination);
  // Refuse anything else.
  if (dest === null) throw new RibToFibError("bad-destination", "destination must be a dotted-quad IPv4 address");

  // The candidates the reader switched on, before any decision.
  const offered: Omit<Candidate, "status">[] = [];
  // The static default route.
  if (input.defaultRoute) offered.push({ id: "default", prefix: "0.0.0.0/0", length: 0, source: "static", distance: 1, metric: 0, nextHop: "192.0.2.1" });
  // OSPF's two paths to the /24.
  if (input.ospf) offered.push({ id: "ospf-20", prefix: "203.0.113.0/24", length: 24, source: "ospf", distance: 110, metric: 20, nextHop: "192.0.2.2" }, { id: "ospf-40", prefix: "203.0.113.0/24", length: 24, source: "ospf", distance: 110, metric: 40, nextHop: "192.0.2.3" });
  // The static /24, at the distance chosen.
  if (input.staticRoute !== "none") offered.push({ id: "static-24", prefix: "203.0.113.0/24", length: 24, source: "static", distance: input.staticRoute === "ad1" ? 1 : 250, metric: 0, nextHop: "192.0.2.9" });
  // The BGP /25.
  if (input.bgp25) offered.push({ id: "bgp-25", prefix: "203.0.113.128/25", length: 25, source: "bgp", distance: 200, metric: 0, nextHop: "192.0.2.4" });
  // The discard /26.
  if (input.discard26) offered.push({ id: "discard-26", prefix: "203.0.113.192/26", length: 26, source: "static", distance: 1, metric: 0, nextHop: "discard" });

  // Moment 1, installation. First, a static route whose next hop does not resolve is out.
  const status = new Map<string, Status>();
  // Mark the unresolved static route.
  for (const c of offered) if (c.id === "static-24" && !input.staticResolves) status.set(c.id, "unresolved");
  // The rest compete per prefix.
  const prefixes = [...new Set(offered.map((c) => c.prefix))];
  // Each prefix in turn.
  for (const p of prefixes) {
    // The eligible candidates for this prefix.
    const pool = offered.filter((c) => c.prefix === p && !status.has(c.id));
    // Within one source, the lower metric wins; the others lose on metric.
    const bestPerSource = new Map<Source, Omit<Candidate, "status">>();
    // Each candidate against the best of its source so far.
    for (const c of pool) {
      // The current best of this source.
      const best = bestPerSource.get(c.source);
      // A lower metric replaces it.
      if (!best || c.metric < best.metric) bestPerSource.set(c.source, c);
    }
    // Everything that is not its source's best lost on metric.
    for (const c of pool) if (bestPerSource.get(c.source)?.id !== c.id) status.set(c.id, "lost-metric");
    // Between sources, the lower distance wins (the lab's distances never tie).
    const finalists = [...bestPerSource.values()].sort((a, b) => a.distance - b.distance);
    // The winner is installed; the other finalists lost on distance.
    finalists.forEach((c, i) => status.set(c.id, i === 0 ? "installed" : "lost-distance"));
  }
  // Every candidate with its fate.
  const candidates: Candidate[] = offered.map((c) => ({ ...c, status: status.get(c.id) ?? "installed" }));

  // Moment 2, forwarding: the installed routes that contain the destination, longest first.
  const matching = candidates.filter((c) => c.status === "installed" && contains(c.prefix, dest)).sort((a, b) => b.length - a.length);
  // The longest match, if any.
  const win = matching[0] ?? null;
  // The full answer.
  return {
    // Every candidate.
    candidates,
    // The matches, as prefixes.
    matches: matching.map((c) => c.prefix),
    // The winner's id.
    winner: win ? win.id : null,
    // Forwarded, discarded or unroutable.
    verdict: win === null ? "no-route" : win.nextHop === "discard" ? "discard" : "forward",
  };
}

/** The opening state: a packet for 203.0.113.150 follows the BGP /25, whatever its distance. */
export const DEFAULT_INPUT: RibToFibInput = { destination: "203.0.113.150", defaultRoute: true, ospf: true, staticRoute: "none", staticResolves: true, bgp25: true, discard26: false };
/** The Example: OSPF has lost the /24, so the floating static route at 250 is installed and carries 203.0.113.10. */
export const EXAMPLE_INPUT: RibToFibInput = { destination: "203.0.113.10", defaultRoute: true, ospf: false, staticRoute: "ad250", staticResolves: true, bgp25: true, discard26: false };
