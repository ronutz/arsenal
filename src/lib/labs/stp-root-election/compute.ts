// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/stp-root-election/compute.ts
// ----------------------------------------------------------------------------
// THE SPANNING TREE LAB'S MODEL (2026-10-26), the interactive companion of the
// article "Spanning tree in one article". Four switches, A to D, and five
// links: A-B, A-C, B-C, B-D and C-D, a square with one diagonal, so there are
// loops to break. Every switch keeps the default bridge priority, 32768,
// unless the reader sets one of them to 4096 to make it the root on purpose;
// their MAC addresses rise from A to D (documentation addresses
// 00-00-5E-00-53-01 to -04). Every link runs at 1 Gb/s except B-D, whose speed
// the reader picks, and the reader can fail any one link. The model runs the
// article's four decisions and gives each switch's root path cost and root
// port, each link end's role, and which links forward.
//
// The rules, with their sources (the article's, read again on 2026-10-26):
//   1. The lowest bridge ID is the root; the ID is the priority, then the MAC
//      address, so with equal priorities the lowest MAC wins (Cisco, STP
//      configuration guide; Juniper, spanning tree overview).
//   2. Path cost is the sum of port costs, by link speed on the short scale of
//      802.1D-1998: 10 Mb/s 100, 100 Mb/s 19, 1 Gb/s 4, 10 Gb/s 2 (the
//      article's table). Each non-root switch's root port is the port on its
//      lowest-cost path to the root. When two ports tie on cost, the one with
//      the lowest interface number is chosen (Cisco, STP configuration guide:
//      "If all interfaces have the same cost value, spanning tree puts the
//      interface with the lowest interface number in the forwarding state").
//      The lab numbers each switch's ports in the order of its neighbours'
//      MAC addresses, so that choice also goes to the neighbour with the lower
//      bridge ID.
//   3. Each link's designated port is the end on the switch with the lower
//      root path cost; on a tie, the switch with the lower bridge ID (Juniper,
//      spanning tree overview: "If two bridges have the same path cost to the
//      root bridge, the bridge with the lowest bridge ID becomes the
//      designated bridge"). Every port of the root is designated.
//   4. Every other port is an alternate port and blocks; a link forwards only
//      when neither end blocks.
// What the model leaves out (the lab's scope note): port priorities, timers
// and convergence, the long cost scale, backup ports, MSTP regions and
// per-VLAN trees, and edge ports.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The four switches. */
export type SwitchName = "A" | "B" | "C" | "D";
/** All four, in MAC order. */
export const SWITCHES: readonly SwitchName[] = ["A", "B", "C", "D"];
/** The five links. */
export type LinkId = "A-B" | "A-C" | "B-C" | "B-D" | "C-D";
/** Which switch is set to 4096: none (all at the default) or one of them. */
export type RootChoice = "default" | SwitchName;
/** Every value the root control can take. */
export const ROOT_CHOICES: readonly RootChoice[] = ["default", "A", "B", "C", "D"];
/** The B-D link's speed. */
export type Speed = "10M" | "100M" | "1G" | "10G";
/** Every value the speed control can take. */
export const SPEEDS: readonly Speed[] = ["10M", "100M", "1G", "10G"];
/** The failed link, or none. */
export type Failure = "none" | LinkId;
/** Every value the failure control can take. */
export const FAILURES: readonly Failure[] = ["none", "A-B", "A-C", "B-C", "B-D", "C-D"];

/** Short-scale port costs by speed (802.1D-1998, the article's table). */
export const COST: Readonly<Record<Speed, number>> = Object.freeze({ "10M": 100, "100M": 19, "1G": 4, "10G": 2 });
/** The default bridge priority. */
export const DEFAULT_PRIORITY = 32768;
/** The priority the reader can give one switch to make it the root. */
export const ROOT_PRIORITY = 4096;
/** Each switch's MAC address (documentation range of RFC 9542). */
export const MAC: Readonly<Record<SwitchName, string>> = Object.freeze({ A: "00-00-5E-00-53-01", B: "00-00-5E-00-53-02", C: "00-00-5E-00-53-03", D: "00-00-5E-00-53-04" });

/** One link: its ends, and each end's port number on its switch. */
interface LinkDef {
  /** Stable id. */
  id: LinkId;
  /** One end. */
  a: SwitchName;
  /** That end's port number. */
  pa: number;
  /** The other end. */
  b: SwitchName;
  /** That end's port number. */
  pb: number;
}

/** The topology: ports numbered on each switch in the order of its neighbours' MACs. */
export const LINKS: readonly LinkDef[] = Object.freeze([
  // A's port 1 to B's port 1.
  { id: "A-B", a: "A", pa: 1, b: "B", pb: 1 },
  // A's port 2 to C's port 1.
  { id: "A-C", a: "A", pa: 2, b: "C", pb: 1 },
  // B's port 2 to C's port 2.
  { id: "B-C", a: "B", pa: 2, b: "C", pb: 2 },
  // B's port 3 to D's port 1.
  { id: "B-D", a: "B", pa: 3, b: "D", pb: 1 },
  // C's port 3 to D's port 2.
  { id: "C-D", a: "C", pa: 3, b: "D", pb: 2 },
]);

/** The reader's settings. */
export interface StpInput {
  /** Which switch is set to 4096, if any. */
  root: RootChoice;
  /** The B-D link's speed. */
  speedBD: Speed;
  /** The failed link, if any. */
  failed: Failure;
}

/** A port's role. */
export type Role = "root" | "designated" | "alternate" | "down";

/** One switch in the result. */
export interface SwitchResult {
  /** Its name. */
  name: SwitchName;
  /** Its priority. */
  priority: number;
  /** Its MAC address. */
  mac: string;
  /** Its root path cost. */
  cost: number;
  /** Its root port number, or null for the root. */
  rootPort: number | null;
  /** The neighbour its root port faces, or null for the root. */
  rootVia: SwitchName | null;
  /** True when its root port was chosen on an equal-cost tie. */
  tie: boolean;
}

/** One link in the result. */
export interface LinkResult {
  /** Its id. */
  id: LinkId;
  /** Its port cost. */
  cost: number;
  /** The first end's switch. */
  a: SwitchName;
  /** The first end's role. */
  roleA: Role;
  /** The second end's switch. */
  b: SwitchName;
  /** The second end's role. */
  roleB: Role;
  /** True when frames cross it. */
  forwards: boolean;
}

/** The model's answer. */
export interface StpResult {
  /** The root bridge. */
  root: SwitchName;
  /** The four switches. */
  switches: SwitchResult[];
  /** The five links. */
  links: LinkResult[];
  /** How many links block (excluding the failed one). */
  blocked: number;
}

/** The stable codes an invalid input is refused with. */
export type StpErrorCode = "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class StpError extends Error {
  /** The stable code. */
  readonly code: StpErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: StpErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Elect the root, then give every port its role. */
export function compute(input: StpInput): StpResult {
  // Every field comes from a select: anything else is a programming error.
  if (!ROOT_CHOICES.includes(input.root) || !SPEEDS.includes(input.speedBD) || !FAILURES.includes(input.failed)) throw new StpError("bad-choice", "unknown root, speed or failure");

  /** A switch's priority. */
  const priority = (n: SwitchName): number => (n === input.root ? ROOT_PRIORITY : DEFAULT_PRIORITY);
  /** Compare two bridge IDs: priority first, then MAC (A to D rise). */
  const bidCmp = (x: SwitchName, y: SwitchName): number => priority(x) - priority(y) || SWITCHES.indexOf(x) - SWITCHES.indexOf(y);
  /** A link's port cost. */
  const linkCost = (l: LinkDef): number => (l.id === "B-D" ? COST[input.speedBD] : COST["1G"]);
  // The links still up.
  const up = LINKS.filter((l) => l.id !== input.failed);

  // Decision 1: the lowest bridge ID is the root.
  const root = [...SWITCHES].sort(bidCmp)[0];

  // Root path costs: a shortest-path search from the root over the links that are up.
  const cost: Record<SwitchName, number> = { A: Infinity, B: Infinity, C: Infinity, D: Infinity };
  // The root costs nothing.
  cost[root] = 0;
  // Switches whose cost is final.
  const done = new Set<SwitchName>();
  // Until all four are final (the topology stays connected with any one link down).
  while (done.size < SWITCHES.length) {
    // The cheapest switch not yet final.
    const n = SWITCHES.filter((s) => !done.has(s)).sort((x, y) => cost[x] - cost[y])[0];
    // Make it final.
    done.add(n);
    // Relax each link from it.
    for (const l of up) {
      // Only links that touch n.
      if (l.a !== n && l.b !== n) continue;
      // The neighbour.
      const m = l.a === n ? l.b : l.a;
      // A cheaper way to m through n.
      cost[m] = Math.min(cost[m], cost[n] + linkCost(l));
    }
  }

  // Decision 2: each non-root switch's root port.
  const rootLink: Partial<Record<SwitchName, LinkDef>> = {};
  // The switches in the result.
  const switches: SwitchResult[] = SWITCHES.map((n) => {
    // The root has no root port.
    if (n === root) return { name: n, priority: priority(n), mac: MAC[n], cost: 0, rootPort: null, rootVia: null, tie: false };
    // Its ports on a lowest-cost path: the neighbour's cost plus the link's equals its own.
    const options = up
      // Links that touch n.
      .filter((l) => l.a === n || l.b === n)
      // As (link, local port, neighbour).
      .map((l) => ({ l, port: l.a === n ? l.pa : l.pb, via: (l.a === n ? l.b : l.a) as SwitchName }))
      // On a lowest-cost path.
      .filter((o) => cost[o.via] + linkCost(o.l) === cost[n])
      // The lowest interface number first.
      .sort((x, y) => x.port - y.port);
    // The chosen one.
    const pick = options[0];
    // Remember which link it is.
    rootLink[n] = pick.l;
    // The switch's line.
    return { name: n, priority: priority(n), mac: MAC[n], cost: cost[n], rootPort: pick.port, rootVia: pick.via, tie: options.length > 1 };
  });

  // Decisions 3 and 4: each link end's role.
  const links: LinkResult[] = LINKS.map((l) => {
    // A failed link has no roles.
    if (l.id === input.failed) return { id: l.id, cost: linkCost(l), a: l.a, roleA: "down" as Role, b: l.b, roleB: "down" as Role, forwards: false };
    // The designated end: lower root path cost, then lower bridge ID.
    const designated = cost[l.a] < cost[l.b] || (cost[l.a] === cost[l.b] && bidCmp(l.a, l.b) < 0) ? l.a : l.b;
    /** One end's role. */
    const role = (n: SwitchName): Role => (rootLink[n]?.id === l.id ? "root" : designated === n ? "designated" : "alternate");
    // Both ends.
    const roleA = role(l.a);
    // The other end.
    const roleB = role(l.b);
    // Forwards when neither end blocks.
    return { id: l.id, cost: linkCost(l), a: l.a, roleA, b: l.b, roleB, forwards: roleA !== "alternate" && roleB !== "alternate" };
  });

  // The full answer.
  return { root, switches, links, blocked: links.filter((l) => l.roleA === "alternate" || l.roleB === "alternate").length };
}

/** The opening state: every priority at its default, so A, with the lowest MAC, is root by accident. */
export const DEFAULT_INPUT: StpInput = { root: "default", speedBD: "1G", failed: "none" };
/** The Example: D set to 4096 becomes the root on purpose, and every role moves. */
export const EXAMPLE_INPUT: StpInput = { root: "D", speedBD: "1G", failed: "none" };
