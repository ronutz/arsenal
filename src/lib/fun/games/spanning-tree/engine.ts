// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/spanning-tree/engine.ts
// ----------------------------------------------------------------------------
// SPANNING TREE (PRIME 03/11/2026): a puzzle on the classic IEEE 802.1D
// Spanning Tree Protocol, the one the owner's LAN switching course teaches.
// A small switched network (4 to 8 switches, links with their port path cost
// written on them, every switch with a bridge ID, every port with a port ID)
// is solved in four steps: the root bridge, each non-root switch's root port,
// each link's designated port, and the ports left over, which block.
//
// THE RULES, as the sources in SOURCES.md state them:
//   - Root bridge: the lowest bridge ID (priority first, then MAC address).
//   - Root port of a non-root switch: among the ports that receive the BPDU of
//     another switch, the lowest root path cost (the sender's cost plus the
//     receiving port's cost); then the lowest sender bridge ID; then the lowest
//     sender port ID; then the lowest receiving port ID.
//   - Designated port of a link: the port whose switch has the lowest root path
//     cost; then the lowest bridge ID; then the lowest port ID.
//   - Every other port blocks (an alternate port, or a backup port when a
//     switch has two ports on one shared segment).
// Port path costs are per port; a link here has one cost, used by both its
// ends, and it is written on the link, so no speed table is needed.
//
// Bridge IDs are a priority (a multiple of 4096) and a MAC address from the
// documentation block of RFC 7042 (00-00-5E-00-53-00 to 00-00-5E-00-53-FF);
// port IDs are a port priority (a multiple of 16) and a port number, shown as
// 128.2. Every comparison is a total order on distinct values, so each puzzle
// has exactly one answer; the self-test proves it for 400 days of each level.
//
// Pure and deterministic: no DOM, no clock, no Math.random.
// ============================================================================

// The daily seed, the seeded generators (a fixed seed for the self-test's practice boards) and the day arithmetic.
import { addDays, dailyRng, LAUNCH_DAY, makeRng, type Rng } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";

/** The game's stable id. */
export const STP_ID = "spanning-tree";

/** The two sizes of puzzle. */
export type StpLevel = "easy" | "hard";

/** One switch. */
export interface StpSwitch {
  /** Its label, SW1 to SW8. */
  name: string;
  /** Its bridge priority (a multiple of 4096; 32768 by default). */
  prio: number;
  /** The last byte of its MAC address (the first five are 00-00-5E-00-53, RFC 7042's documentation block). */
  mac: number;
  /** Its place on the layout grid: the position along the long side (0 to 3). */
  gx: number;
  /** Its place across the short side (0 or 1); the page draws the grid portrait on a phone, landscape when wide. */
  gy: number;
}

/** One port. */
export interface StpPort {
  /** The switch it belongs to (index). */
  sw: number;
  /** Its port number on that switch, from 1. */
  num: number;
  /** Its port priority (a multiple of 16; 128 by default). */
  prio: number;
  /** The segment it attaches to (index). */
  seg: number;
  /** Its port path cost. */
  cost: number;
}

/** One segment: a point-to-point link (two ports), or a shared segment (more) in the hand-written cases. */
export interface StpSegment {
  /** The ports on it (indices). */
  ports: number[];
  /** Its cost, as written on the link. */
  cost: number;
  /** For a second link between the same two switches: which of the pair it is (0 or 1), for drawing apart. */
  lane: number;
}

/** A puzzle. */
export interface StpPuzzle {
  /** easy or hard. */
  level: StpLevel;
  /** The switches. */
  switches: StpSwitch[];
  /** The ports. */
  ports: StpPort[];
  /** The segments. */
  segments: StpSegment[];
}

/** What decided a choice: the first field of the comparison that differed. */
export type StpTie = "only" | "cost" | "senderBid" | "senderPort" | "receivingPort" | "bid" | "portId";

/** The answer to a puzzle. */
export interface StpAnswer {
  /** The root bridge (switch index). */
  root: number;
  /** Each switch's root path cost. */
  rpc: number[];
  /** Each switch's root port (port index), null for the root. */
  rootPort: (number | null)[];
  /** What decided each root port. */
  rootPortTie: (StpTie | null)[];
  /** Each segment's designated port (port index). */
  designated: number[];
  /** What decided each designated port. */
  designatedTie: StpTie[];
  /** The ports that block, ascending. */
  blocked: number[];
}

// ---------------------------------------------------------------------------
// Identifiers and comparisons.
// ---------------------------------------------------------------------------

/**
 * A bridge ID as one comparable number: priority in the high bits, the MAC's last byte below (the other MAC bytes
 * are the same documentation prefix on every switch, so they never decide).
 *
 * @param s the switch
 * @returns the number
 */
function bidValue(s: StpSwitch): number {
  // Priority above, MAC below.
  return s.prio * 256 + s.mac;
}

/**
 * A port ID as one comparable number: priority in the high bits, the port number below.
 *
 * @param p the port
 * @returns the number
 */
function pidValue(p: StpPort): number {
  // Priority above, number below (port numbers stay under 4096).
  return p.prio * 4096 + p.num;
}

/**
 * The MAC address of a switch in Cisco's dotted form.
 *
 * @param s the switch
 * @returns 0000.5e00.53xx
 */
export function macText(s: StpSwitch): string {
  // RFC 7042's documentation prefix and the switch's byte, two hex digits.
  return `0000.5e00.53${s.mac.toString(16).padStart(2, "0")}`;
}

/**
 * A bridge ID as shown: priority, then the MAC.
 *
 * @param s the switch
 * @returns 32768.0000.5e00.53xx
 */
export function bidText(s: StpSwitch): string {
  // The two parts, dotted.
  return `${s.prio}.${macText(s)}`;
}

/**
 * A port ID as shown: priority, then number.
 *
 * @param p the port
 * @returns 128.2
 */
export function pidText(p: StpPort): string {
  // The two parts, dotted, as show spanning-tree prints them.
  return `${p.prio}.${p.num}`;
}

/**
 * Compare two vectors field by field and say which field decided.
 *
 * @param a one vector
 * @param b the other
 * @returns the sign of a - b at the first differing field, and that field's index (-1 when equal)
 */
function compareVec(a: readonly number[], b: readonly number[]): { sign: number; at: number } {
  // Field by field.
  for (let i = 0; i < a.length; i++) {
    // The first difference decides.
    if (a[i] !== b[i]) return { sign: a[i] < b[i] ? -1 : 1, at: i };
  }
  // Equal throughout.
  return { sign: 0, at: -1 };
}

// ---------------------------------------------------------------------------
// The reference solver.
// ---------------------------------------------------------------------------

/**
 * The other ports on a port's segment.
 *
 * @param pz the puzzle
 * @param p the port index
 * @returns the other ports' indices
 */
function peers(pz: StpPuzzle, p: number): number[] {
  // Everyone on the segment but the port itself.
  return pz.segments[pz.ports[p].seg].ports.filter((q) => q !== p);
}

/**
 * Root path costs: the cheapest sum of receiving-port costs from the root to each switch (Dijkstra; at most eight
 * switches, so a simple scan is enough).
 *
 * @param pz the puzzle
 * @param root the root switch
 * @returns each switch's root path cost (Infinity when unreachable)
 */
function rootPathCosts(pz: StpPuzzle, root: number): number[] {
  // Distances, all unknown but the root's.
  const dist = pz.switches.map((_, i) => (i === root ? 0 : Infinity));
  // Settled switches.
  const done = pz.switches.map(() => false);
  // One switch settled per round.
  for (let round = 0; round < pz.switches.length; round++) {
    // The nearest unsettled switch.
    let u = -1;
    // Scan.
    for (let i = 0; i < dist.length; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    // Nothing reachable is left.
    if (u < 0 || dist[u] === Infinity) break;
    // Settled.
    done[u] = true;
    // Its ports: a BPDU it sends reaches every other port on the segment, which adds its own cost.
    pz.ports.forEach((p, pi) => {
      // Only u's ports.
      if (p.sw !== u) return;
      // Each port that hears it.
      for (const q of peers(pz, pi)) {
        // The receiving switch.
        const v = pz.ports[q].sw;
        // Its own ports hear its own BPDU; that is no path.
        if (v === u) continue;
        // The cost through this port.
        const via = dist[u] + pz.ports[q].cost;
        // Keep the cheapest.
        if (via < dist[v]) dist[v] = via;
      }
    });
  }
  // The costs.
  return dist;
}

/**
 * The vector a port offers on its segment when it is a candidate for designated port: its switch's root path cost,
 * its bridge ID, its port ID.
 *
 * @param pz the puzzle
 * @param rpc the root path costs
 * @param q the port
 * @returns the vector
 */
function designatedVec(pz: StpPuzzle, rpc: readonly number[], q: number): number[] {
  // The port and its switch.
  const p = pz.ports[q];
  // Cost, bridge, port.
  return [rpc[p.sw], bidValue(pz.switches[p.sw]), pidValue(p)];
}

/** The tie names of the designated vector's fields. */
const DESIGNATED_TIES: readonly StpTie[] = ["cost", "bid", "portId"];
/** The tie names of the root-port vector's fields. */
const ROOT_PORT_TIES: readonly StpTie[] = ["cost", "senderBid", "senderPort", "receivingPort"];

/**
 * The vector a port receives, as a root-port candidate: the cost through it, the sender's bridge ID, the sender's
 * port ID, its own port ID. The sender is the designated port of its segment.
 *
 * @param pz the puzzle
 * @param rpc the root path costs
 * @param designated each segment's designated port
 * @param p the receiving port
 * @returns the vector, or null when the port does not receive another switch's BPDU (it is designated itself, or the
 *          designated port is on its own switch)
 */
export function rootPortVec(pz: StpPuzzle, rpc: readonly number[], designated: readonly number[], p: number): number[] | null {
  // The designated port of the segment: the sender.
  const d = designated[pz.ports[p].seg];
  // The port itself sends on its segment, or its own switch does: nothing better is heard.
  if (d === p || pz.ports[d].sw === pz.ports[p].sw) return null;
  // The sender's port and switch.
  const sp = pz.ports[d];
  // Cost through this port, sender bridge, sender port, own port.
  return [rpc[sp.sw] + pz.ports[p].cost, bidValue(pz.switches[sp.sw]), pidValue(sp), pidValue(pz.ports[p])];
}

/**
 * The best of several candidates by vector, with the field that decided against the runner-up.
 *
 * @param items the candidates and their vectors
 * @param ties the names of the vector's fields
 * @returns the best and the deciding field ("only" for a single candidate); null when there are none, and an exact
 *          tie is reported as a "tie" so the self-test can refuse it
 */
function best(items: { id: number; vec: number[] }[], ties: readonly StpTie[]): { id: number; tie: StpTie | "tie" } | null {
  // None.
  if (items.length === 0) return null;
  // Sorted by vector.
  const sorted = items.slice().sort((a, b) => compareVec(a.vec, b.vec).sign);
  // One candidate.
  if (sorted.length === 1) return { id: sorted[0].id, tie: "only" };
  // The winner against the runner-up.
  const c = compareVec(sorted[0].vec, sorted[1].vec);
  // The deciding field, or an exact tie.
  return { id: sorted[0].id, tie: c.at < 0 ? "tie" : ties[c.at] };
}

/**
 * Solve a puzzle by the 802.1D rules.
 *
 * @param pz the puzzle
 * @returns the answer, and whether any choice was an exact tie (which a well-formed puzzle never has)
 */
export function solveStp(pz: StpPuzzle): { answer: StpAnswer; exactTie: boolean } {
  // An exact tie anywhere.
  let exactTie = false;
  // The root: the lowest bridge ID.
  let root = 0;
  // Scan the switches.
  pz.switches.forEach((s, i) => {
    // A lower bridge ID wins.
    if (bidValue(s) < bidValue(pz.switches[root])) root = i;
    // Two equal bridge IDs would be an exact tie.
    if (i !== root && bidValue(s) === bidValue(pz.switches[root])) exactTie = true;
  });
  // Root path costs.
  const rpc = rootPathCosts(pz, root);
  // Designated ports, one per segment.
  const designatedTie: StpTie[] = [];
  // Each segment.
  const designated = pz.segments.map((seg) => {
    // The best port on the segment.
    const b = best(seg.ports.map((q) => ({ id: q, vec: designatedVec(pz, rpc, q) })), DESIGNATED_TIES)!;
    // An exact tie is a defect.
    if (b.tie === "tie") exactTie = true;
    // What decided.
    designatedTie.push(b.tie === "tie" ? "portId" : b.tie);
    // The port.
    return b.id;
  });
  // Root ports.
  const rootPort: (number | null)[] = [];
  // What decided each.
  const rootPortTie: (StpTie | null)[] = [];
  // Each switch.
  pz.switches.forEach((_, sw) => {
    // The root has none.
    if (sw === root) { rootPort.push(null); rootPortTie.push(null); return; }
    // Its ports that hear another switch's BPDU.
    const cands = pz.ports.map((_, p) => p).filter((p) => pz.ports[p].sw === sw).map((p) => ({ id: p, vec: rootPortVec(pz, rpc, designated, p) })).filter((c): c is { id: number; vec: number[] } => c.vec !== null);
    // The best.
    const b = best(cands, ROOT_PORT_TIES);
    // A switch cut off from the root would have none: a defect in a puzzle.
    if (!b) { rootPort.push(null); rootPortTie.push(null); exactTie = true; return; }
    // An exact tie is a defect.
    if (b.tie === "tie") exactTie = true;
    // Kept.
    rootPort.push(b.id);
    rootPortTie.push(b.tie === "tie" ? "receivingPort" : b.tie);
  });
  // Every port that is neither a root port nor designated blocks.
  const forwarding = new Set<number>([...designated, ...rootPort.filter((p): p is number => p !== null)]);
  // The blocked ones, ascending.
  const blocked = pz.ports.map((_, p) => p).filter((p) => !forwarding.has(p));
  // The answer.
  return { answer: { root, rpc, rootPort, rootPortTie, designated, designatedTie, blocked }, exactTie };
}

/**
 * A second, independent solver for the self-test: BPDUs exchanged round after round until nothing changes, the way
 * the protocol converges, instead of shortest paths computed in one go.
 *
 * @param pz the puzzle
 * @returns the root, the root ports and the designated ports it converges on
 */
function convergeStp(pz: StpPuzzle): { root: number; rootPort: (number | null)[]; designated: number[] } {
  // Each switch's belief: the root's bridge ID, its cost to it, and its root port.
  const belief = pz.switches.map((s) => ({ rootBid: bidValue(s), cost: 0, rp: null as number | null }));
  // The vector a port sends: what its switch believes, then its bridge and port IDs.
  const sent = (q: number): number[] => {
    // The port and its switch.
    const p = pz.ports[q];
    // Root, cost, bridge, port.
    return [belief[p.sw].rootBid, belief[p.sw].cost, bidValue(pz.switches[p.sw]), pidValue(p)];
  };
  // Each segment's designated port this round.
  let designated: number[] = [];
  // At most a generous number of rounds (eight switches converge in far fewer).
  for (let round = 0; round < 64; round++) {
    // The designated port of each segment: the best vector sent on it.
    designated = pz.segments.map((seg) => seg.ports.slice().sort((a, b) => compareVec(sent(a), sent(b)).sign)[0]);
    // Whether anything changed.
    let changed = false;
    // Each switch looks at what its ports hear.
    pz.switches.forEach((s, sw) => {
      // Its own claim: itself as root at cost 0.
      let bestVec = [bidValue(s), 0, bidValue(s), 0, 0];
      // No root port.
      let rp: number | null = null;
      // Each of its ports.
      pz.ports.forEach((p, pi) => {
        // Only its own.
        if (p.sw !== sw) return;
        // The segment's sender.
        const d = designated[p.seg];
        // Its own port or its own switch sends: nothing heard.
        if (d === pi || pz.ports[d].sw === sw) return;
        // What it hears, plus its own cost, plus its own port ID.
        const v = sent(d);
        // Root, cost through this port, sender bridge, sender port, own port.
        const vec = [v[0], v[1] + p.cost, v[2], v[3], pidValue(p)];
        // Better than the best so far.
        if (compareVec(vec, bestVec).sign < 0) { bestVec = vec; rp = pi; }
      });
      // The new belief.
      const next = { rootBid: bestVec[0], cost: bestVec[1], rp };
      // A change.
      if (next.rootBid !== belief[sw].rootBid || next.cost !== belief[sw].cost || next.rp !== belief[sw].rp) changed = true;
      // Adopted.
      belief[sw] = next;
    });
    // Stable: done.
    if (!changed) break;
  }
  // The root: the switch whose belief is itself.
  const root = pz.switches.findIndex((s, i) => belief[i].rootBid === bidValue(s));
  // The answer it converged on.
  return { root, rootPort: belief.map((b) => b.rp), designated };
}

// ---------------------------------------------------------------------------
// The generator.
// ---------------------------------------------------------------------------

/**
 * Where switch slot i of n sits on the layout grid: two lines of up to four, the first line with the extra switch
 * when n is odd. Links are drawn only between grid neighbours (and one diagonal per cell), so they never cross.
 *
 * @param n how many switches
 * @returns each slot's line (r, 0 or 1) and position along it (c)
 */
function slots(n: number): { r: number; c: number }[] {
  // Positions in the first line.
  const cols = Math.ceil(n / 2);
  // The slots.
  const out: { r: number; c: number }[] = [];
  // Each slot: first line, then second.
  for (let i = 0; i < n; i++) {
    // Its line.
    const r = i < cols ? 0 : 1;
    // Its position along the line.
    out.push({ r, c: r === 0 ? i : i - cols });
  }
  // The slots.
  return out;
}

/**
 * Generate a puzzle.
 *
 * @param rng the generator
 * @param level easy (4 or 5 switches, varied costs) or hard (6 to 8 switches, equal costs, more ties)
 * @returns the puzzle
 */
export function generateStp(rng: Rng, level: StpLevel): StpPuzzle {
  // How many switches.
  const n = level === "easy" ? rng.range(4, 5) : rng.range(6, 8);
  // Their slots.
  const sl = slots(n);
  // The slot of a row and column, or -1.
  const at = (r: number, c: number) => sl.findIndex((s) => s.r === r && s.c === c);
  // The links that can be drawn without crossing: neighbours in a row, under each other, and one diagonal per cell.
  const cand: [number, number][] = [];
  // Every slot.
  sl.forEach((s, i) => {
    // The neighbour to the right.
    const right = at(s.r, s.c + 1);
    // A horizontal link.
    if (right >= 0) cand.push([i, right]);
    // The switch below (top row only).
    const below = s.r === 0 ? at(1, s.c) : -1;
    // A vertical link.
    if (below >= 0) cand.push([i, below]);
    // One diagonal in the cell to the right, in a random direction.
    if (s.r === 0 && right >= 0) {
      // The two bottom corners of the cell.
      const bl = at(1, s.c);
      // The other corner.
      const br = at(1, s.c + 1);
      // Down-right or down-left, when both ends exist.
      if (rng.chance(0.5) && br >= 0) cand.push([i, br]);
      // The other diagonal.
      else if (bl >= 0) cand.push([right, bl]);
    }
  });
  // A random spanning tree over the candidates: grow from one switch.
  const inTree = new Array<boolean>(n).fill(false);
  // The first switch.
  inTree[rng.int(n)] = true;
  // The links chosen.
  const links: [number, number][] = [];
  // Links per switch so far: the drawing has room for four ports a switch.
  const degree = new Array<number>(n).fill(0);
  // Whether a link still fits at both ends.
  const fits = ([a, b]: [number, number]) => degree[a] < 4 && degree[b] < 4;
  // Until every switch is in (a grid's candidates always connect it).
  for (let guard = 0; guard < n * 4 && inTree.some((x) => !x); guard++) {
    // The candidates that join a new switch, preferring those with room at both ends.
    const joining = cand.filter(([a, b]) => inTree[a] !== inTree[b]);
    // With room, when any has it.
    const frontier = joining.some(fits) ? joining.filter(fits) : joining;
    // None would be a disconnected layout (cannot happen on these grids).
    if (frontier.length === 0) break;
    // One at random.
    const [a, b] = rng.pick(frontier);
    // Taken.
    links.push([a, b]);
    // Counted at both ends.
    degree[a]++;
    degree[b]++;
    // Both ends in.
    inTree[a] = inTree[b] = true;
  }
  // The unused candidates, for loops.
  const spare = rng.shuffle(cand.filter(([a, b]) => !links.some(([x, y]) => (x === a && y === b) || (x === b && y === a))));
  // Loops: easy one or two extra links, hard two or three.
  const extra = level === "easy" ? rng.range(1, 2) : rng.range(2, 3);
  // Added while they fit.
  for (const l of spare) {
    // Enough.
    if (links.length >= n - 1 + extra) break;
    // No room at one end.
    if (!fits(l)) continue;
    // Taken and counted.
    links.push(l);
    degree[l[0]]++;
    degree[l[1]]++;
  }
  // A parallel link (two cables between the same pair) on some days: the sender-port tie-breaker's case.
  const parallel = rng.chance(level === "easy" ? 0.25 : 0.45);
  // The pair doubled: a horizontal or vertical one with room at both ends (diagonals stay single).
  const straight = links.filter(([a, b]) => (sl[a].r === sl[b].r || sl[a].c === sl[b].c) && fits([a, b]));
  // Doubled when wanted and possible.
  const doubled = parallel && straight.length > 0 ? rng.pick(straight) : null;
  // The segments in order, each a pair and a lane.
  const pairs: { a: number; b: number; lane: number }[] = links.map(([a, b]) => ({ a, b, lane: 0 }));
  // The second cable.
  if (doubled) pairs.push({ a: doubled[0], b: doubled[1], lane: 1 });
  // Costs: easy draws varied costs; hard gives every link the same cost, with one exception on some days.
  const hardCost = rng.pick([4, 19]);
  // The odd link out in hard mode (or -1).
  const odd = level === "hard" && rng.chance(0.4) ? rng.int(pairs.length) : -1;
  // Parallel cables share their cost, so the tie comes down to port IDs.
  const costs = pairs.map((_, i) => (level === "easy" ? rng.pick([2, 4, 4, 19]) : i === odd ? rng.pick([2, 100]) : hardCost));
  // A doubled pair's second cable costs the same as its first.
  if (doubled) costs[pairs.length - 1] = costs[links.findIndex(([a, b]) => a === doubled[0] && b === doubled[1])];
  // Bridge priorities: all default, or one or two lowered (equal), so that the MAC breaks the tie on some days.
  const prios = new Array<number>(n).fill(32768);
  // The lowered ones.
  const lowered = rng.pick(level === "easy" ? [0, 1, 1] : [0, 1, 2]);
  // The lowered priority.
  const low = rng.pick([4096, 8192, 24576]);
  // The switches that get it.
  for (const i of rng.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, lowered)) prios[i] = low;
  // Distinct MAC bytes.
  const macs = rng.shuffle(Array.from({ length: 256 }, (_, i) => i)).slice(0, n);
  // The switches.
  const switches: StpSwitch[] = sl.map((s, i) => ({ name: `SW${i + 1}`, prio: prios[i], mac: macs[i], gx: s.c, gy: s.r }));
  // The ports and segments.
  const ports: StpPort[] = [];
  // The segments.
  const segments: StpSegment[] = [];
  // Each switch's ports, numbered in a shuffled order later.
  const perSwitch: number[][] = switches.map(() => []);
  // Each pair becomes a segment with two ports.
  pairs.forEach((pr, si) => {
    // The two ports.
    const pa = ports.length;
    // The far end.
    const pb = pa + 1;
    // Both ends, numbered later.
    ports.push({ sw: pr.a, num: 0, prio: 128, seg: si, cost: costs[si] }, { sw: pr.b, num: 0, prio: 128, seg: si, cost: costs[si] });
    // Remembered per switch.
    perSwitch[pr.a].push(pa);
    perSwitch[pr.b].push(pb);
    // The segment.
    segments.push({ ports: [pa, pb], cost: costs[si], lane: pr.lane });
  });
  // Port numbers 1 to k on each switch, in a shuffled order so the layout does not give them away.
  perSwitch.forEach((list) => rng.shuffle(list).forEach((p, i) => { ports[p].num = i + 1; }));
  // On a doubled pair in hard mode, sometimes lower one port's priority so the lower number does not win.
  if (doubled && level === "hard" && rng.chance(0.5)) {
    // The two segments of the pair.
    const segs = segments.filter((_, si) => pairs[si].a === doubled[0] && pairs[si].b === doubled[1]);
    // The higher-numbered of the two ports on the first switch.
    const two = segs.map((s) => s.ports[0]).sort((a, b) => ports[b].num - ports[a].num);
    // Its priority lowered.
    ports[two[0]].prio = 64;
  }
  // The puzzle.
  return { level, switches, ports, segments };
}

/**
 * The daily puzzle of a level on a day.
 *
 * @param dayKey the UTC day
 * @param level easy or hard
 * @returns the puzzle
 */
export function dailyStp(dayKey: string, level: StpLevel): StpPuzzle {
  // The day's generator for this level.
  return generateStp(dailyRng(STP_ID, dayKey, level), level);
}

// ---------------------------------------------------------------------------
// Feedback for a wrong move.
// ---------------------------------------------------------------------------

/** Why a move was wrong: an id the page translates, and its values. */
export interface StpWhy {
  /** The sentence id (devFun.games.spanning-tree.why.<id>). */
  id: string;
  /** Its values. */
  args: Record<string, string>;
}

/**
 * Why the clicked switch is not the root.
 *
 * @param pz the puzzle
 * @param a the answer
 * @param clicked the switch clicked
 * @returns the reason
 */
export function whyRoot(pz: StpPuzzle, a: StpAnswer, clicked: number): StpWhy {
  // The real root and the clicked switch.
  const r = pz.switches[a.root];
  // The clicked one.
  const c = pz.switches[clicked];
  // Lower priority decides first; with equal priorities, the MAC.
  return { id: r.prio < c.prio ? "rootPrio" : "rootMac", args: { root: r.name, rootBid: bidText(r), other: c.name, otherBid: bidText(c) } };
}

/**
 * Why the clicked port is not its switch's root port.
 *
 * @param pz the puzzle
 * @param a the answer
 * @param clicked the port clicked
 * @returns the reason
 */
export function whyRootPort(pz: StpPuzzle, a: StpAnswer, clicked: number): StpWhy {
  // The switch.
  const sw = pz.ports[clicked].sw;
  // The root has no root port.
  if (sw === a.root) return { id: "rpOnRoot", args: { sw: pz.switches[sw].name } };
  // The right port.
  const right = a.rootPort[sw]!;
  // The clicked port's vector (null: it sends, it does not hear another switch).
  const vc = rootPortVec(pz, a.rpc, a.designated, clicked);
  // The right port's vector.
  const vr = rootPortVec(pz, a.rpc, a.designated, right)!;
  // The names.
  const base = { sw: pz.switches[sw].name, port: pidText(pz.ports[clicked]), right: pidText(pz.ports[right]) };
  // The clicked port is the designated port of its link: this switch is the one closer to the root there.
  if (!vc) {
    // The far end's switch.
    const far = pz.ports[peers(pz, clicked)[0]].sw;
    // The reason.
    return { id: "rpIsDesignated", args: { ...base, far: pz.switches[far].name } };
  }
  // The first field that differs.
  const cmp = compareVec(vr, vc);
  // The sender of each.
  const sr = pz.ports[a.designated[pz.ports[right].seg]];
  // The clicked port's sender.
  const sc = pz.ports[a.designated[pz.ports[clicked].seg]];
  // Cost decided.
  if (cmp.at === 0) return { id: "rpCost", args: { ...base, costRight: String(vr[0]), costPort: String(vc[0]) } };
  // The sender's bridge ID decided.
  if (cmp.at === 1) return { id: "rpSenderBid", args: { ...base, cost: String(vr[0]), senderRight: pz.switches[sr.sw].name, bidRight: bidText(pz.switches[sr.sw]), senderPort: pz.switches[sc.sw].name, bidPort: bidText(pz.switches[sc.sw]) } };
  // The sender's port ID decided.
  if (cmp.at === 2) return { id: "rpSenderPort", args: { ...base, cost: String(vr[0]), sender: pz.switches[sr.sw].name, pidRight: pidText(sr), pidPort: pidText(sc) } };
  // The receiving port ID decided.
  return { id: "rpReceiving", args: { ...base, cost: String(vr[0]), sender: pz.switches[sr.sw].name } };
}

/**
 * Why the clicked port is not the designated port of its link.
 *
 * @param pz the puzzle
 * @param a the answer
 * @param clicked the port clicked
 * @returns the reason
 */
export function whyDesignated(pz: StpPuzzle, a: StpAnswer, clicked: number): StpWhy {
  // The right port on that segment.
  const right = a.designated[pz.ports[clicked].seg];
  // Their switches.
  const sr = pz.switches[pz.ports[right].sw];
  // The clicked one's switch.
  const sc = pz.switches[pz.ports[clicked].sw];
  // The two vectors.
  const cmp = compareVec(designatedVec(pz, a.rpc, right), designatedVec(pz, a.rpc, clicked));
  // The names.
  const base = { right: `${sr.name} ${pidText(pz.ports[right])}`, port: `${sc.name} ${pidText(pz.ports[clicked])}` };
  // Root path cost decided.
  if (cmp.at === 0) return { id: "dpCost", args: { ...base, swRight: sr.name, costRight: String(a.rpc[pz.ports[right].sw]), swPort: sc.name, costPort: String(a.rpc[pz.ports[clicked].sw]) } };
  // Bridge ID decided.
  if (cmp.at === 1) return { id: "dpBid", args: { ...base, cost: String(a.rpc[pz.ports[right].sw]), swRight: sr.name, bidRight: bidText(sr), swPort: sc.name, bidPort: bidText(sc) } };
  // Port ID decided (two ports of one switch on a shared segment).
  return { id: "dpPort", args: { ...base, pidRight: pidText(pz.ports[right]), pidPort: pidText(pz.ports[clicked]) } };
}

/**
 * The score of a solved puzzle: whole seconds plus 10 for each mistake (lower is better).
 *
 * @param ms the time taken
 * @param mistakes the mistakes made
 * @returns the score
 */
export function stpScore(ms: number, mistakes: number): number {
  // Seconds, then the penalty.
  return Math.floor(ms / 1000) + 10 * mistakes;
}

// ---------------------------------------------------------------------------
// The drawing (review R1-03, 03/11/2026): where the page puts every switch, link, cost and port marker, in board
// units (about one CSS pixel on a phone). Kept here, pure, so that the self-test can prove for every daily puzzle
// that no marker covers a cost, another marker or a switch, and that nothing touches the board's edge.
// ---------------------------------------------------------------------------

/** Half sizes of what the board draws: a switch box, a port marker (pill), a cost label. */
export const STP_DRAW = {
  /** A switch box's half width. */
  boxW: 38,
  /** Its half height (room for three lines of text, and for a doubled link's two lanes on its side). */
  boxH: 28,
  /** A port marker's half width ("R 128.2" fits). */
  pillW: 24,
  /** Its half height. */
  pillH: 10,
  /** A cost label's half width ("100" fits). */
  costW: 14,
  /** Its half height. */
  costH: 10,
} as const;

/** A point on the board. */
export interface StpPt {
  /** Across. */
  x: number;
  /** Down. */
  y: number;
}

/** A board's geometry. */
export interface StpLayout {
  /** Width in board units. */
  w: number;
  /** Height. */
  h: number;
  /** Each switch's centre, by index. */
  at: StpPt[];
  /** Each segment's line (a doubled link's lane already shifted) and its cost label's centre, by index. */
  links: { a: StpPt; b: StpPt; cost: StpPt }[];
  /** Each port's marker centre, by index. */
  ports: StpPt[];
}

/** The two orientations: portrait (two columns going down, for a phone) and landscape (two rows going across). */
const GRID = {
  /** Portrait: column centres at 60 and 300 of a 360-wide board (a link across has room for two markers and its cost), rows 140 apart. */
  portrait: { x0: 60, col: 240, y0: 46, row: 140 },
  /** Landscape: columns 230 apart, the two rows 180 apart. */
  landscape: { x0: 60, col: 230, y0: 46, row: 180 },
} as const;

/** A doubled link's lanes: 18 above and below for a level link (inside the box's side), 26 left and right for an upright one (two markers side by side). */
const LANE = { level: 18, upright: 26 } as const;

/** How far a diagonal's end sits from its box's corner, down the side, when a doubled upright link leaves that side (its outer marker would cover the corner). */
const SIDE_ATTACH = 12;

/**
 * Where everything goes on a board.
 *
 * Straight links run between switch centres (a doubled pair shifted into two lanes), their markers just clear of
 * the boxes and the cost at the middle. Diagonals run corner to corner (or from the side when a doubled upright link
 * takes the corner), each marker at the first spot along the line that is clear of every other marker, the boxes and
 * the diagonal's own cost.
 *
 * @param pz the puzzle
 * @param portrait two columns going down (a phone) or two rows going across (a wide screen)
 * @returns the geometry
 */
export function stpLayout(pz: StpPuzzle, portrait: boolean): StpLayout {
  // The orientation's spacing.
  const g = portrait ? GRID.portrait : GRID.landscape;
  // The grid's length along its long side.
  const long = Math.max(...pz.switches.map((s) => s.gx)) + 1;
  // Switch centres: portrait puts the long side down the page, landscape across it.
  const at = pz.switches.map((s): StpPt => (portrait ? { x: g.x0 + s.gy * g.col, y: g.y0 + s.gx * g.row } : { x: g.x0 + s.gx * g.col, y: g.y0 + s.gy * g.row }));
  // The board's size: the same margin on both sides of the outer switches.
  const w = portrait ? 2 * g.x0 + g.col : 2 * g.x0 + (long - 1) * g.col;
  // Height.
  const h = portrait ? 2 * g.y0 + (long - 1) * g.row : 2 * g.y0 + g.row;
  // The markers, filled in below.
  const ports: StpPt[] = new Array<StpPt>(pz.ports.length);
  // The links, filled in below.
  const links: StpLayout["links"] = new Array<StpLayout["links"][number]>(pz.segments.length);
  // A link's two switches as an unordered key, to find a doubled pair.
  const pairKey = (si: number) => pz.segments[si].ports.map((q) => pz.ports[q].sw).sort((x, y) => x - y).join();
  // Whether another link joins the same two switches.
  const doubled = (si: number) => pz.segments.some((_, i) => i !== si && pairKey(i) === pairKey(si));
  // Per switch, the vertical directions (-1 up, 1 down) in which a doubled upright link leaves it.
  const uprightPair = new Map<number, Set<number>>();
  // Straight links first: their markers sit at fixed places.
  pz.segments.forEach((seg, si) => {
    // Only point-to-point links are drawn (the generator makes no other kind).
    if (seg.ports.length !== 2) return;
    // The two ends.
    const [pa, pb] = seg.ports;
    // Their switches' centres.
    const A = at[pz.ports[pa].sw], B = at[pz.ports[pb].sw];
    // The direction, as signs.
    const dx = Math.sign(B.x - A.x), dy = Math.sign(B.y - A.y);
    // A diagonal waits for the second pass.
    if (dx !== 0 && dy !== 0) return;
    // Doubled or single.
    const twin = doubled(si);
    // A doubled upright pair is remembered at both ends, for the diagonals.
    if (twin && dx === 0) {
      // Each end and the way the link leaves it.
      for (const [s, dir] of [[pz.ports[pa].sw, dy], [pz.ports[pb].sw, -dy]] as const) {
        // A set per switch.
        if (!uprightPair.has(s)) uprightPair.set(s, new Set<number>());
        // The direction.
        uprightPair.get(s)!.add(dir);
      }
    }
    // The lane: -1 or 1 for a pair (always the same two sides, whichever port comes first), 0 for a single link.
    const lane = twin ? (seg.lane === 0 ? -1 : 1) : 0;
    // The shift: up or down for a level link, left or right for an upright one.
    const off = dy === 0 ? { x: 0, y: lane * LANE.level } : { x: lane * LANE.upright, y: 0 };
    // The line, centre to centre (the boxes hide the inner part).
    const a = { x: A.x + off.x, y: A.y + off.y }, b = { x: B.x + off.x, y: B.y + off.y };
    // The marker's distance from the centre: just past the box's side, or below its bottom with a little air.
    const along = dy === 0 ? STP_DRAW.boxW + STP_DRAW.pillW + 2 : STP_DRAW.boxH + STP_DRAW.pillH + 4;
    // The first end's marker.
    ports[pa] = { x: a.x + dx * along, y: a.y + dy * along };
    // The second end's.
    ports[pb] = { x: b.x - dx * along, y: b.y - dy * along };
    // The link, with its cost halfway along its own lane.
    links[si] = { a, b, cost: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  });
  // Every switch box as a rectangle (centre and half sizes), for the diagonals' clearance test.
  const boxes = at.map((c) => ({ ...c, hw: STP_DRAW.boxW, hh: STP_DRAW.boxH }));
  // Whether two rectangles come closer than a margin.
  const near = (p: StpPt & { hw: number; hh: number }, q: StpPt & { hw: number; hh: number }, m: number) => Math.abs(p.x - q.x) < p.hw + q.hw + m && Math.abs(p.y - q.y) < p.hh + q.hh + m;
  // Then the diagonals.
  pz.segments.forEach((seg, si) => {
    // Done already, or not a link.
    if (links[si] || seg.ports.length !== 2) return;
    // The two ends.
    const [pa, pb] = seg.ports;
    // Their switches.
    const sa = pz.ports[pa].sw, sb = pz.ports[pb].sw;
    // Their centres.
    const A = at[sa], B = at[sb];
    // The direction, as signs.
    const dx = Math.sign(B.x - A.x), dy = Math.sign(B.y - A.y);
    // How far down the side the line leaves a box: the corner, or higher up when a doubled upright pair holds the corner.
    const drop = (s: number, dir: number) => (uprightPair.get(s)?.has(dir) ? SIDE_ATTACH : STP_DRAW.boxH);
    // The line's two ends, on the facing sides of the boxes.
    const a = { x: A.x + dx * STP_DRAW.boxW, y: A.y + dy * drop(sa, dy) }, b = { x: B.x - dx * STP_DRAW.boxW, y: B.y - dy * drop(sb, -dy) };
    // Its length.
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    // Its direction.
    const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
    // The cost, halfway.
    const cost = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    // As a rectangle.
    const costBox = { ...cost, hw: STP_DRAW.costW, hh: STP_DRAW.costH };
    // The first clear spot for a marker, walking along the line from one end (sign 1 from a, -1 from b).
    const spot = (o: StpPt, sign: number): StpPt => {
      // Every marker placed so far, as rectangles.
      const taken = ports.filter((p): p is StpPt => p !== undefined).map((p) => ({ ...p, hw: STP_DRAW.pillW, hh: STP_DRAW.pillH }));
      // Two units at a time, up to just short of the cost.
      for (let s = 18; s <= len / 2 - 20; s += 2) {
        // The candidate.
        const c = { x: o.x + sign * ux * s, y: o.y + sign * uy * s };
        // As a rectangle.
        const r = { ...c, hw: STP_DRAW.pillW, hh: STP_DRAW.pillH };
        // Clear of every marker, every box and the cost: taken.
        if (![...taken, ...boxes, costBox].some((q) => near(r, q, 3))) return c;
      }
      // Never reached on the generator's grids (the self-test proves it); a fixed spot otherwise.
      return { x: o.x + sign * ux * 40, y: o.y + sign * uy * 40 };
    };
    // The first end's marker.
    ports[pa] = spot(a, 1);
    // The second end's.
    ports[pb] = spot(b, -1);
    // The link.
    links[si] = { a, b, cost };
  });
  // The geometry.
  return { w, h, at, ports, links };
}

/**
 * Check a board's geometry: no two of the drawn boxes (switches, markers, costs) within 2 units of each other, all
 * of them at least 6 units inside the board, and no link running under another link's marker or cost or under a
 * switch it does not join.
 *
 * @param pz the puzzle
 * @param lay its geometry
 * @param label for the failure lines
 * @returns the problems
 */
function checkLayout(pz: StpPuzzle, lay: StpLayout, label: string): string[] {
  // The problems.
  const out: string[] = [];
  // Everything drawn as a rectangle, with a name for the failure line.
  const rects = [
    // The switches.
    ...lay.at.map((c, i) => ({ ...c, hw: STP_DRAW.boxW, hh: STP_DRAW.boxH, name: `SW${i + 1}` })),
    // The markers.
    ...lay.ports.map((c, i) => ({ ...c, hw: STP_DRAW.pillW, hh: STP_DRAW.pillH, name: `port ${i}` })),
    // The costs.
    ...lay.links.map((l, i) => ({ ...l.cost, hw: STP_DRAW.costW, hh: STP_DRAW.costH, name: `cost ${i}` })),
  ];
  // Every pair.
  for (let i = 0; i < rects.length; i++) {
    // Against every later one.
    for (let j = i + 1; j < rects.length; j++) {
      // The two.
      const p = rects[i], q = rects[j];
      // Closer than 2 units on both axes.
      if (Math.abs(p.x - q.x) < p.hw + q.hw + 2 && Math.abs(p.y - q.y) < p.hh + q.hh + 2) out.push(`${label}: ${p.name} touches ${q.name}`);
    }
    // At least 6 units inside the board.
    const r = rects[i];
    // On or past an edge.
    if (r.x - r.hw < 6 || r.x + r.hw > lay.w - 6 || r.y - r.hh < 6 || r.y + r.hh > lay.h - 6) out.push(`${label}: ${r.name} at the edge`);
  }
  // Whether a line passes inside a rectangle (sampled every half unit or so).
  const under = (a: StpPt, b: StpPt, r: { x: number; y: number; hw: number; hh: number }) => {
    // Samples along the line.
    for (let k = 0; k <= 400; k++) {
      // The point.
      const x = a.x + ((b.x - a.x) * k) / 400, y = a.y + ((b.y - a.y) * k) / 400;
      // Inside, by more than half a unit.
      if (Math.abs(x - r.x) < r.hw - 0.5 && Math.abs(y - r.y) < r.hh - 0.5) return true;
    }
    // Clear.
    return false;
  };
  // Each link against what is not its own.
  lay.links.forEach((l, si) => {
    // Its ports.
    const own = new Set(pz.segments[si].ports);
    // Its switches.
    const ends = new Set(pz.segments[si].ports.map((q) => pz.ports[q].sw));
    // Other links' markers.
    lay.ports.forEach((c, pi) => { if (!own.has(pi) && under(l.a, l.b, { ...c, hw: STP_DRAW.pillW, hh: STP_DRAW.pillH })) out.push(`${label}: link ${si} runs under port ${pi}`); });
    // Other links' costs.
    lay.links.forEach((m, ci) => { if (ci !== si && under(l.a, l.b, { ...m.cost, hw: STP_DRAW.costW, hh: STP_DRAW.costH })) out.push(`${label}: link ${si} runs under cost ${ci}`); });
    // Switches it does not join.
    lay.at.forEach((c, bi) => { if (!ends.has(bi) && under(l.a, l.b, { ...c, hw: STP_DRAW.boxW, hh: STP_DRAW.boxH })) out.push(`${label}: link ${si} runs under SW${bi + 1}`); });
  });
  // The problems.
  return out;
}

// ---------------------------------------------------------------------------
// The self-test.
// ---------------------------------------------------------------------------

/**
 * A hand-written puzzle from a compact description.
 *
 * @param sw the switches: [priority, MAC byte]
 * @param segs the segments: each a cost and its ports as [switch, port number, port priority]
 * @returns the puzzle
 */
function handPuzzle(sw: [number, number][], segs: [number, [number, number, number][]][]): StpPuzzle {
  // The switches, placed anywhere (the solver does not look).
  const switches = sw.map(([prio, mac], i): StpSwitch => ({ name: `SW${i + 1}`, prio, mac, gx: 0, gy: 0 }));
  // The ports.
  const ports: StpPort[] = [];
  // The segments.
  const segments = segs.map(([cost, ps], si): StpSegment => {
    // Each port of the segment.
    const ids = ps.map(([s, num, prio]) => { ports.push({ sw: s, num, prio, seg: si, cost }); return ports.length - 1; });
    // The segment.
    return { ports: ids, cost, lane: 0 };
  });
  // The puzzle.
  return { level: "easy", switches, ports, segments };
}

/** One hand-written case: a puzzle and what must come out. */
interface HandCase {
  /** What it tests. */
  name: string;
  /** The puzzle. */
  pz: StpPuzzle;
  /** The expected root. */
  root: number;
  /** Switch whose root port is checked, the expected port (as [switch, number]) and the deciding field. */
  rp?: { sw: number; port: [number, number]; tie: StpTie };
  /** Segment whose designated port is checked, the expected port and the deciding field. */
  dp?: { seg: number; port: [number, number]; tie: StpTie };
}

/** The hand-written cases: every rule and every tie-breaker once. */
const HAND_CASES: readonly HandCase[] = [
  // The root by priority: SW2's lower priority beats SW1's lower MAC.
  { name: "root by priority", pz: handPuzzle([[32768, 0x10], [4096, 0x90], [32768, 0x20]], [[4, [[0, 1, 128], [1, 1, 128]]], [4, [[1, 2, 128], [2, 1, 128]]], [4, [[2, 2, 128], [0, 2, 128]]]]), root: 1 },
  // The root by MAC with equal priorities.
  { name: "root by MAC", pz: handPuzzle([[32768, 0x30], [32768, 0x11], [32768, 0x20]], [[4, [[0, 1, 128], [1, 1, 128]]], [4, [[1, 2, 128], [2, 1, 128]]], [4, [[2, 2, 128], [0, 2, 128]]]]), root: 1 },
  // Root port by cost: SW3 reaches SW1 directly at 19, or through SW2 at 4 + 4 = 8.
  { name: "root port by cost", pz: handPuzzle([[32768, 0x01], [32768, 0x02], [32768, 0x03]], [[4, [[0, 1, 128], [1, 1, 128]]], [4, [[1, 2, 128], [2, 1, 128]]], [19, [[0, 2, 128], [2, 2, 128]]]]), root: 0, rp: { sw: 2, port: [2, 1], tie: "cost" } },
  // Root port by sender bridge ID: SW4 hears SW2 and SW3 at the same cost; SW2's bridge ID is lower.
  { name: "root port by sender bridge ID", pz: handPuzzle([[32768, 0x01], [32768, 0x02], [32768, 0x03], [32768, 0x04]], [[4, [[0, 1, 128], [1, 1, 128]]], [4, [[0, 2, 128], [2, 1, 128]]], [4, [[1, 2, 128], [3, 2, 128]]], [4, [[2, 2, 128], [3, 1, 128]]]]), root: 0, rp: { sw: 3, port: [3, 2], tie: "senderBid" } },
  // Root port by sender port ID: two cables from SW1 to SW2; SW1's port 128.1 is on the second one.
  { name: "root port by sender port ID", pz: handPuzzle([[32768, 0x01], [32768, 0x02]], [[4, [[0, 2, 128], [1, 1, 128]]], [4, [[0, 1, 128], [1, 2, 128]]]]), root: 0, rp: { sw: 1, port: [1, 2], tie: "senderPort" } },
  // Sender port priority beats the port number: 64.2 is lower than 128.1.
  { name: "sender port priority", pz: handPuzzle([[32768, 0x01], [32768, 0x02]], [[4, [[0, 1, 128], [1, 1, 128]]], [4, [[0, 2, 64], [1, 2, 128]]]]), root: 0, rp: { sw: 1, port: [1, 2], tie: "senderPort" } },
  // Root port by receiving port ID: SW2 has two ports on one shared segment with SW1's single port.
  { name: "root port by receiving port ID", pz: handPuzzle([[32768, 0x01], [32768, 0x02]], [[4, [[0, 1, 128], [1, 2, 128], [1, 1, 128]]]]), root: 0, rp: { sw: 1, port: [1, 1], tie: "receivingPort" } },
  // Designated port by cost: on the SW2-SW3 link, SW2 is 4 from the root and SW3 is 19.
  { name: "designated port by cost", pz: handPuzzle([[32768, 0x01], [32768, 0x02], [32768, 0x03]], [[4, [[0, 1, 128], [1, 1, 128]]], [19, [[0, 2, 128], [2, 1, 128]]], [100, [[1, 2, 128], [2, 2, 128]]]]), root: 0, dp: { seg: 2, port: [1, 2], tie: "cost" } },
  // Designated port by bridge ID: on the SW2-SW3 link both are 4 from the root; SW2's bridge ID is lower.
  { name: "designated port by bridge ID", pz: handPuzzle([[32768, 0x01], [32768, 0x02], [32768, 0x03]], [[4, [[0, 1, 128], [1, 1, 128]]], [4, [[0, 2, 128], [2, 1, 128]]], [4, [[2, 2, 128], [1, 2, 128]]]]), root: 0, dp: { seg: 2, port: [1, 2], tie: "bid" } },
  // Designated port by port ID: the root has two ports on one shared segment; the lower port ID is designated.
  { name: "designated port by port ID", pz: handPuzzle([[32768, 0x01], [32768, 0x02]], [[4, [[0, 2, 128], [0, 1, 128], [1, 1, 128]]]]), root: 0, dp: { seg: 0, port: [0, 1], tie: "portId" } },
];

/**
 * The index of a port given as [switch, number].
 *
 * @param pz the puzzle
 * @param sp the switch and number
 * @returns the index (-1 when absent)
 */
function portAt(pz: StpPuzzle, sp: [number, number]): number {
  // The matching port.
  return pz.ports.findIndex((p) => p.sw === sp[0] && p.num === sp[1]);
}

/**
 * Check one generated puzzle.
 *
 * @param pz the puzzle
 * @param label for the failure lines
 * @returns the problems
 */
function checkPuzzle(pz: StpPuzzle, label: string): string[] {
  // The problems.
  const out: string[] = [];
  // The size.
  const n = pz.switches.length;
  // Easy has 4 or 5 switches, hard 6 to 8.
  if (pz.level === "easy" ? n < 4 || n > 5 : n < 6 || n > 8) out.push(`${label}: ${n} switches`);
  // Distinct bridge IDs.
  if (new Set(pz.switches.map(bidValue)).size !== n) out.push(`${label}: two switches share a bridge ID`);
  // Distinct port IDs on every switch, and at most four ports a switch (the drawing has room for four).
  pz.switches.forEach((_, sw) => {
    // That switch's ports.
    const mine = pz.ports.filter((p) => p.sw === sw);
    // Distinct IDs.
    if (new Set(mine.map(pidValue)).size !== mine.length) out.push(`${label}: SW${sw + 1} has two equal port IDs`);
    // Room.
    if (mine.length > 4) out.push(`${label}: SW${sw + 1} has ${mine.length} ports`);
  });
  // Every segment is a point-to-point link between two different switches, with a positive cost.
  pz.segments.forEach((s, i) => {
    // Two ports, two switches.
    if (s.ports.length !== 2 || pz.ports[s.ports[0]].sw === pz.ports[s.ports[1]].sw) out.push(`${label}: segment ${i} is not a link between two switches`);
    // A cost.
    if (!(s.cost > 0)) out.push(`${label}: segment ${i} has cost ${s.cost}`);
  });
  // Connected: every switch reachable from switch 0.
  const seen = new Set<number>([0]);
  // A simple flood.
  for (let round = 0; round < n; round++) pz.segments.forEach((s) => { const sws = s.ports.map((p) => pz.ports[p].sw); if (sws.some((x) => seen.has(x))) sws.forEach((x) => seen.add(x)); });
  // All reached.
  if (seen.size !== n) out.push(`${label}: not connected`);
  // At least one loop: more links than a tree has.
  if (pz.segments.length < n) out.push(`${label}: no loop`);
  // The solver.
  const { answer, exactTie } = solveStp(pz);
  // No exact tie anywhere: the answer is unique.
  if (exactTie) out.push(`${label}: an exact tie, so the answer is not unique`);
  // At least one blocked port.
  if (answer.blocked.length === 0) out.push(`${label}: no blocked port`);
  // Forwarding ports: one designated per segment plus one root port per non-root switch.
  if (answer.blocked.length !== 2 * pz.segments.length - pz.segments.length - (n - 1)) out.push(`${label}: blocked count does not add up`);
  // The independent, converging solver agrees.
  const conv = convergeStp(pz);
  // Root.
  if (conv.root !== answer.root) out.push(`${label}: the two solvers disagree on the root`);
  // Root ports.
  if (JSON.stringify(conv.rootPort) !== JSON.stringify(answer.rootPort)) out.push(`${label}: the two solvers disagree on the root ports`);
  // Designated ports.
  if (JSON.stringify(conv.designated) !== JSON.stringify(answer.designated)) out.push(`${label}: the two solvers disagree on the designated ports`);
  // The problems.
  return out;
}

/**
 * Prove the hand-written cases and 400 days of each level.
 *
 * @returns the report
 */
export function selfTest(): SelfTestReport {
  // The problems.
  const failures: string[] = [];
  // Cases and puzzles checked.
  let checked = 0;
  // The hand-written cases.
  for (const hc of HAND_CASES) {
    // Solved.
    const { answer, exactTie } = solveStp(hc.pz);
    // No exact tie.
    if (exactTie) failures.push(`case "${hc.name}": exact tie`);
    // The root.
    if (answer.root !== hc.root) failures.push(`case "${hc.name}": root is SW${answer.root + 1}, expected SW${hc.root + 1}`);
    // A root port.
    if (hc.rp) {
      // The expected port.
      const want = portAt(hc.pz, hc.rp.port);
      // Chosen and why.
      if (answer.rootPort[hc.rp.sw] !== want || answer.rootPortTie[hc.rp.sw] !== hc.rp.tie) failures.push(`case "${hc.name}": root port ${answer.rootPort[hc.rp.sw]} by ${answer.rootPortTie[hc.rp.sw]}, expected ${want} by ${hc.rp.tie}`);
    }
    // A designated port.
    if (hc.dp) {
      // The expected port.
      const want = portAt(hc.pz, hc.dp.port);
      // Chosen and why.
      if (answer.designated[hc.dp.seg] !== want || answer.designatedTie[hc.dp.seg] !== hc.dp.tie) failures.push(`case "${hc.name}": designated ${answer.designated[hc.dp.seg]} by ${answer.designatedTie[hc.dp.seg]}, expected ${want} by ${hc.dp.tie}`);
    }
    // The converging solver agrees on the hand cases too.
    const conv = convergeStp(hc.pz);
    // Root, root ports and designated ports.
    if (conv.root !== answer.root || JSON.stringify(conv.rootPort) !== JSON.stringify(answer.rootPort) || JSON.stringify(conv.designated) !== JSON.stringify(answer.designated)) failures.push(`case "${hc.name}": the two solvers disagree`);
    // Counted.
    checked++;
  }
  // How often the tie-breakers decide something, per level.
  const ties: Record<StpLevel, Record<string, number>> = { easy: {}, hard: {} };
  // 400 days of each level.
  for (const level of ["easy", "hard"] as const) {
    // Each day.
    for (let d = 0; d < 400; d++) {
      // The day.
      const day = addDays(LAUNCH_DAY, d);
      // Generated twice.
      const a = dailyStp(day, level);
      // Again.
      const b = dailyStp(day, level);
      // Identical.
      if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${day} ${level}: two generations differ`);
      // Well formed, unique, agreed.
      failures.push(...checkPuzzle(a, `${day} ${level}`));
      // Drawn clean on a phone and on a wide screen.
      failures.push(...checkLayout(a, stpLayout(a, true), `${day} ${level} portrait`), ...checkLayout(a, stpLayout(a, false), `${day} ${level} landscape`));
      // The tie-breakers that decided.
      const ans = solveStp(a).answer;
      // Each kind once per day.
      for (const t of new Set([...ans.rootPortTie.filter((x): x is StpTie => x !== null).map((x) => `rp:${x}`), ...ans.designatedTie.map((x) => `dp:${x}`)])) ties[level][t] = (ties[level][t] ?? 0) + 1;
      // Counted.
      checked++;
    }
  }
  // Practice rounds draw random seeds: 300 fixed ones per level must draw clean too, in both orientations.
  const seeds = makeRng(0x57b1a7);
  // Each level.
  for (const level of ["easy", "hard"] as const) {
    // Each seed.
    for (let i = 0; i < 300; i++) {
      // The puzzle.
      const pz = generateStp(makeRng(seeds.int(4294967296)), level);
      // Both drawings.
      failures.push(...checkLayout(pz, stpLayout(pz, true), `practice ${level} ${i} portrait`), ...checkLayout(pz, stpLayout(pz, false), `practice ${level} ${i} landscape`));
      // Counted.
      checked++;
    }
  }
  // The tie-breakers must be exercised on some days: sender bridge ID and sender port ID for root ports, bridge ID for
  // designated ports (the receiving port ID and the designated port ID need a shared segment: the hand cases).
  for (const t of ["rp:senderBid", "rp:senderPort", "dp:bid"]) if (!((ties.easy[t] ?? 0) + (ties.hard[t] ?? 0) >= 20)) failures.push(`the tie-breaker ${t} decides on fewer than 20 of 800 daily puzzles`);
  // The report.
  return { checked, failures };
}

/**
 * How often each tie-breaker decides over 400 days of a level (for the notes).
 *
 * @param level easy or hard
 * @returns counts by kind
 */
export function tieStats(level: StpLevel): Record<string, number> {
  // The counts.
  const out: Record<string, number> = {};
  // Each day.
  for (let d = 0; d < 400; d++) {
    // The answer.
    const ans = solveStp(dailyStp(addDays(LAUNCH_DAY, d), level)).answer;
    // Each kind once per day.
    for (const t of new Set([...ans.rootPortTie.filter((x): x is StpTie => x !== null).map((x) => `rp:${x}`), ...ans.designatedTie.map((x) => `dp:${x}`)])) out[t] = (out[t] ?? 0) + 1;
  }
  // The counts.
  return out;
}
