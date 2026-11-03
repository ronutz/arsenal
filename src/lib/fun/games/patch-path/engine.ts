// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/patch-path/engine.ts
// ----------------------------------------------------------------------------
// PATCH PATH, the daily cable puzzle of /dev/fun (PRIME 03/11/2026).
//
// An N x N patch panel has numbered ports 1 to k. The player runs one
// continuous cable from port 1 to port k that passes through every cell
// exactly once, moving up, down, left or right, and reaches the ports in
// order. On some days cable ducts (walls) block the way between two cells.
//
// The day's puzzle comes from dailyRng("patch-path", day), built in three
// bounded steps:
//   1. a random cable through every cell (a Hamiltonian path), made by many
//      "backbite" moves from a zigzag; on duct days, walls go on edges the
//      cable does not use;
//   2. ports added along that cable until the solver finds exactly one cable:
//      each time it finds a second one, a port the second cable reaches out of
//      order (or both ends of where the two part ways) is added;
//   3. every middle port tried for removal, in a random order, and dropped
//      when the cable stays unique; the weekday then adds a few back.
//
// Pure and deterministic: no DOM, no clock, no Math.random.
// ============================================================================

// The daily seed, the seeded generator, the day arithmetic.
import { addDays, dailyRng, epochDay, makeRng, type Rng } from "../../daily";
// The report shape every engine's self-test returns.
import type { SelfTestReport } from "../../registry";

/** The game's stable id. */
export const PP_ID = "patch-path";

/** The first day the self-test rebuilds. */
const SELFTEST_FROM = "2026-11-03";

/** How many days the self-test rebuilds. */
const SELFTEST_DAYS = 400;

/** One day's puzzle. */
export interface PpPuzzle {
  /** The UTC day, YYYY-MM-DD. */
  day: string;
  /** 0 = Monday to 6 = Sunday. */
  weekday: number;
  /** The side of the panel. */
  n: number;
  /** The cells of ports 1 to k, in order. */
  ports: number[];
  /** Ducts between (r, c) and (r, c + 1): index r * (n - 1) + c, 1 when blocked. */
  wallsH: number[];
  /** Ducts between (r, c) and (r + 1, c): index r * n + c, 1 when blocked. */
  wallsV: number[];
  /** The answer: every cell, in cable order. */
  solution: number[];
  /** True when the built-in puzzle was used. */
  fallback: boolean;
}

/** The weekday plan: side, number of ducts, ports added back after trimming. */
const WEEKDAY_PLAN: readonly { n: number; walls: number; extra: number }[] = [
  // Monday: six by six, no ducts, five ports back.
  { n: 6, walls: 0, extra: 5 },
  // Tuesday.
  { n: 6, walls: 0, extra: 3 },
  // Wednesday: ducts appear.
  { n: 6, walls: 5, extra: 2 },
  // Thursday: seven by seven.
  { n: 7, walls: 0, extra: 3 },
  // Friday.
  { n: 7, walls: 0, extra: 1 },
  // Saturday: ducts.
  { n: 7, walls: 6, extra: 1 },
  // Sunday: ducts, nothing added back.
  { n: 7, walls: 6, extra: 0 },
];

/** Attempts per day before the built-in puzzle is used. */
const MAX_ATTEMPTS = 6;

/** Search nodes one solver call may visit before it gives up (an answer of "unknown" counts as not unique). */
const NODE_BUDGET = 60_000;

/** The built-in puzzle (a 6 x 6 zigzag with every fourth cell a port), proven unique by the self-test. */
const FALLBACK_N = 6;

/**
 * The weekday of a day, Monday first.
 *
 * @param day the date as YYYY-MM-DD
 * @returns 0 for Monday to 6 for Sunday
 */
export function weekdayOf(day: string): number {
  // 1970-01-01 was a Thursday (index 3 when Monday is 0).
  return (((epochDay(day) + 3) % 7) + 7) % 7;
}

/**
 * Whether the cable may step between two cells: they share a side and no duct is between them.
 *
 * @param p the puzzle (only n and the walls are read)
 * @param a one cell
 * @param b the other
 * @returns true when the step is allowed
 */
export function canStep(p: Pick<PpPuzzle, "n" | "wallsH" | "wallsV">, a: number, b: number): boolean {
  // The side.
  const n = p.n;
  // Coordinates.
  const ra = Math.floor(a / n), ca = a % n, rb = Math.floor(b / n), cb = b % n;
  // Same row, neighbouring columns: the horizontal duct between them.
  if (ra === rb && Math.abs(ca - cb) === 1) return !p.wallsH[ra * (n - 1) + Math.min(ca, cb)];
  // Same column, neighbouring rows: the vertical duct between them.
  if (ca === cb && Math.abs(ra - rb) === 1) return !p.wallsV[Math.min(ra, rb) * n + ca];
  // Not neighbours.
  return false;
}

/**
 * The cells a cell may step to, ducts respected.
 *
 * @param p the puzzle's side and walls
 * @param i the cell
 * @returns the reachable neighbours
 */
export function steps(p: Pick<PpPuzzle, "n" | "wallsH" | "wallsV">, i: number): number[] {
  // The side.
  const n = p.n;
  // Row and column.
  const r = Math.floor(i / n), c = i % n;
  // The four candidates inside the grid.
  const out: number[] = [];
  // Up.
  if (r > 0) out.push(i - n);
  // Down.
  if (r < n - 1) out.push(i + n);
  // Left.
  if (c > 0) out.push(i - 1);
  // Right.
  if (c < n - 1) out.push(i + 1);
  // Only those without a duct.
  return out.filter((j) => canStep(p, i, j));
}

/**
 * A random cable through every cell: a zigzag, then many backbite moves (each move joins an end to one of its other
 * neighbours and reverses the loose piece, which keeps the path Hamiltonian).
 *
 * @param n the side
 * @param rng the generator
 * @returns the cells in cable order
 */
function randomCable(n: number, rng: Rng): number[] {
  // The zigzag: left to right, then right to left, row by row.
  const path: number[] = [];
  // Each row.
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) path.push(r * n + (r % 2 === 0 ? k : n - 1 - k));
  // The plain grid, for neighbours.
  const open = { n, wallsH: new Array(n * (n - 1)).fill(0), wallsV: new Array((n - 1) * n).fill(0) };
  // Each cell's position in the path.
  const pos = new Int32Array(n * n);
  // Filled.
  path.forEach((cell, k) => (pos[cell] = k));
  // The last index.
  const last = n * n - 1;
  // Many moves: enough to forget the zigzag.
  for (let m = 0; m < n * n * 40; m++) {
    // Work on the tail end; half the time flip the path so the head end moves too.
    if (rng.chance(0.5)) {
      // Reversed in place.
      path.reverse();
      // Positions follow.
      path.forEach((cell, k) => (pos[cell] = k));
    }
    // The tail.
    const tail = path[last];
    // Its neighbours other than the one before it on the path.
    const nbs = steps(open, tail).filter((j) => j !== path[last - 1]);
    // A corner may have none.
    if (nbs.length === 0) continue;
    // One at random.
    const j = rng.pick(nbs);
    // Its place on the path.
    const at = pos[j];
    // Reverse everything after it, so the tail joins j.
    for (let a = at + 1, b = last; a < b; a++, b--) {
      // Swap.
      const t = path[a];
      path[a] = path[b];
      path[b] = t;
      // Positions follow.
      pos[path[a]] = a;
      pos[path[b]] = b;
    }
  }
  // The cable.
  return path;
}

/**
 * Count the cables a puzzle allows, stopping at a limit: depth-first from port 1, refusing a port out of order,
 * with two prunings after every step: no unvisited cell may be left with fewer free neighbours than it needs (two,
 * or one for the last port), and the unvisited cells must stay in one piece.
 *
 * @param p the puzzle (side, ports, walls)
 * @param limit stop after this many cables
 * @param shortcuts true (the default) adds the forced-step rule and the local ring test; the self-test turns them
 *                  off so that its proof does not rest on the same shortcuts the generator used
 * @returns the cables found (each the cells in order), and whether the node budget ran out first
 */
export function solveAll(p: Pick<PpPuzzle, "n" | "ports" | "wallsH" | "wallsV">, limit = 2, shortcuts = true): { found: number[][]; exhausted: boolean } {
  // Cells.
  const N = p.n * p.n;
  // Neighbour lists, flat: up to four per cell.
  const nb = new Int32Array(N * 4).fill(-1);
  // Their counts.
  const deg = new Int32Array(N);
  // Filled from the walls.
  for (let i = 0; i < N; i++) {
    // Each allowed step.
    for (const j of steps(p, i)) nb[i * 4 + deg[i]++] = j;
  }
  // The port number of each cell (-1 for none).
  const portOf = new Int32Array(N).fill(-1);
  // Filled.
  p.ports.forEach((cell, k) => (portOf[cell] = k));
  // The first and last port.
  const start = p.ports[0], end = p.ports[p.ports.length - 1];
  // Visited cells.
  const seen = new Uint8Array(N);
  // The path so far.
  const path = new Int32Array(N);
  // A scratch stamp array for the flood fill.
  const mark = new Int32Array(N);
  // The current stamp.
  let stamp = 0;
  // A queue for the flood fill.
  const queue = new Int32Array(N);
  // The cables found.
  const found: number[][] = [];
  // Nodes visited.
  let nodes = 0;
  // Whether the budget ran out.
  let exhausted = false;
  // Free neighbours of an unvisited cell: unvisited ones, plus the head.
  const freeAround = (u: number, head: number): number => {
    // The count.
    let f = 0;
    // Each neighbour.
    for (let k = 0; k < deg[u]; k++) {
      // The neighbour.
      const w = nb[u * 4 + k];
      // Unvisited, or the head the cable can come from.
      if (!seen[w] || w === head) f++;
    }
    // The count.
    return f;
  };
  // Whether the cells still to visit form one piece reachable from the head.
  const connected = (head: number, left: number): boolean => {
    // A fresh stamp.
    stamp++;
    // The queue's ends.
    let qh = 0, qt = 0;
    // Start from the head.
    queue[qt++] = head;
    // Stamped.
    mark[head] = stamp;
    // Unvisited cells reached.
    let reached = 0;
    // Until the queue empties.
    while (qh < qt) {
      // The next cell.
      const u = queue[qh++];
      // Each neighbour.
      for (let k = 0; k < deg[u]; k++) {
        // The neighbour.
        const w = nb[u * 4 + k];
        // Unvisited and unstamped.
        if (!seen[w] && mark[w] !== stamp) {
          // Stamped.
          mark[w] = stamp;
          // Queued.
          queue[qt++] = w;
          // Counted.
          reached++;
        }
      }
    }
    // One piece when every unvisited cell was reached.
    return reached === left;
  };
  // Without ducts, a cheaper local test often settles connectivity (see ringSafe).
  const noWalls = shortcuts && !p.wallsH.some(Boolean) && !p.wallsV.some(Boolean);
  // The side, for the ring arithmetic.
  const n = p.n;
  // The eight cells around a cell, clockwise from the one above; even entries share a side with it.
  const RING: readonly [number, number][] = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]];
  // Ring flags, reused.
  const ringFree = new Uint8Array(8);
  // When the old head leaves the searched region, the rest stays in one piece if its free side-neighbours are
  // joined around its ring of eight (a local test from digital topology; valid only on a grid without ducts).
  const ringSafe = (h: number, w: number): boolean => {
    // Row and column of the old head.
    const r = Math.floor(h / n), c = h % n;
    // The first ring cell that is not free.
    let start = -1;
    // Each ring cell.
    for (let k = 0; k < 8; k++) {
      // Its coordinates.
      const rr = r + RING[k][0], cc = c + RING[k][1];
      // Inside the panel.
      const inside = rr >= 0 && rr < n && cc >= 0 && cc < n;
      // Its index.
      const idx = rr * n + cc;
      // Free: unvisited, or the new head.
      ringFree[k] = inside && (!seen[idx] || idx === w) ? 1 : 0;
      // The first blocked one starts the walk.
      if (!ringFree[k] && start < 0) start = k;
    }
    // A fully free ring is one piece.
    if (start < 0) return true;
    // Runs of free ring cells that touch a side-neighbour.
    let groups = 0;
    // Walk state.
    let inRun = false, touches = false;
    // Once round, ending on the blocked start cell, which closes the last run.
    for (let t = 1; t <= 8; t++) {
      // The ring index.
      const k = (start + t) % 8;
      // A free cell extends (or opens) a run.
      if (ringFree[k]) {
        // A new run.
        if (!inRun) {
          // Opened.
          inRun = true;
          // Not touching yet.
          touches = false;
        }
        // An even index shares a side with the old head.
        if (k % 2 === 0) touches = true;
      } else if (inRun) {
        // A run closes; it counts when it touches a side.
        if (touches) groups++;
        // Closed.
        inRun = false;
      }
    }
    // One piece when at most one such run exists.
    return groups <= 1;
  };
  // Depth-first search; depth is the index of the head on the path.
  const go = (head: number, depth: number, nextPort: number): boolean => {
    // Budget (four times larger for the plain search).
    if (++nodes > (shortcuts ? NODE_BUDGET : 4 * NODE_BUDGET)) {
      // Out of budget.
      exhausted = true;
      // Stop.
      return true;
    }
    // Every cell visited: a cable (the end port is only entered last, so the head is the end).
    if (depth === N - 1) {
      // Kept.
      found.push(Array.from(path));
      // Stop at the limit.
      return found.length >= limit;
    }
    // A forced step: an unvisited neighbour (not the last port) whose only other way out is one cell must be
    // entered now, or it would be left with a single free side. Two such neighbours cannot both be served.
    let forced = -1;
    // Each neighbour of the head.
    for (let k = 0; k < deg[head]; k++) {
      // The cell.
      const u = nb[head * 4 + k];
      // Visited cells and the last port are exempt; so is everything when the shortcuts are off.
      if (!shortcuts || seen[u] || u === end) continue;
      // Two free sides or fewer, the head being one of them.
      if (freeAround(u, head) <= 2) {
        // A second forced cell: a dead end.
        if (forced >= 0) return false;
        // Remembered.
        forced = u;
      }
    }
    // Each step from the head.
    for (let k = 0; k < deg[head]; k++) {
      // The cell.
      const w = nb[head * 4 + k];
      // Visited.
      if (seen[w]) continue;
      // Only the forced cell, when there is one.
      if (forced >= 0 && w !== forced) continue;
      // A port out of order.
      if (portOf[w] >= 0 && portOf[w] !== nextPort) continue;
      // The last port before every other cell is visited.
      if (w === end && depth + 1 !== N - 1) continue;
      // Step.
      seen[w] = 1;
      // Recorded.
      path[depth + 1] = w;
      // Pruning 1: the old head's unvisited neighbours lost a free neighbour.
      let ok = true;
      // Each of them.
      for (let q = 0; q < deg[head] && ok; q++) {
        // The neighbour.
        const u = nb[head * 4 + q];
        // Only unvisited ones matter.
        if (seen[u]) continue;
        // It needs two ways (in and out), or one if it is the last port.
        if (freeAround(u, w) < (u === end ? 1 : 2)) ok = false;
      }
      // Pruning 2: the rest is one piece.
      if (ok && depth + 1 < N - 1) ok = (noWalls && ringSafe(head, w)) || connected(w, N - (depth + 2));
      // Deeper.
      if (ok && go(w, depth + 1, portOf[w] >= 0 ? nextPort + 1 : nextPort)) return true;
      // Undo.
      seen[w] = 0;
    }
    // Exhausted here.
    return false;
  };
  // From the first port.
  seen[start] = 1;
  // Recorded.
  path[0] = start;
  // Search; port 1 is already reached, so port 2 is next.
  go(start, 0, 1);
  // The result.
  return { found, exhausted };
}

/**
 * Whether a set of ports (path indices) pins the cable down to one, within the node budget.
 *
 * @param base the side and walls
 * @param cable the answer
 * @param idx the path indices that carry ports, ascending
 * @returns "unique", or the other cable found, or "unknown" when the budget ran out
 */
function uniqueness(base: Pick<PpPuzzle, "n" | "wallsH" | "wallsV">, cable: number[], idx: number[]): "unique" | "unknown" | number[] {
  // The search.
  const r = solveAll({ ...base, ports: idx.map((k) => cable[k]) }, 2);
  // Out of budget: not proven.
  if (r.exhausted) return "unknown";
  // One cable.
  if (r.found.length === 1) return "unique";
  // The other one.
  return r.found.find((f) => f.some((c, k) => c !== cable[k])) ?? "unknown";
}

/**
 * Random ducts on edges the cable does not use.
 *
 * @param n the side
 * @param cable the answer
 * @param count how many
 * @param rng the generator
 * @returns wallsH and wallsV
 */
function randomWalls(n: number, cable: number[], count: number, rng: Rng): { wallsH: number[]; wallsV: number[] } {
  // Empty walls.
  const wallsH: number[] = new Array(n * (n - 1)).fill(0), wallsV: number[] = new Array((n - 1) * n).fill(0);
  // The edges the cable uses, as "a-b" with a < b.
  const used = new Set<string>();
  // Each step of the cable.
  for (let k = 0; k + 1 < cable.length; k++) used.add(`${Math.min(cable[k], cable[k + 1])}-${Math.max(cable[k], cable[k + 1])}`);
  // Every free edge, as [kind, index].
  const free: ["h" | "v", number][] = [];
  // Horizontal edges.
  for (let r = 0; r < n; r++) for (let c = 0; c + 1 < n; c++) if (!used.has(`${r * n + c}-${r * n + c + 1}`)) free.push(["h", r * (n - 1) + c]);
  // Vertical edges.
  for (let r = 0; r + 1 < n; r++) for (let c = 0; c < n; c++) if (!used.has(`${r * n + c}-${(r + 1) * n + c}`)) free.push(["v", r * n + c]);
  // A random choice of them.
  for (const [kind, at] of rng.shuffle(free).slice(0, count)) {
    // Set.
    if (kind === "h") wallsH[at] = 1;
    // Set.
    else wallsV[at] = 1;
  }
  // The walls.
  return { wallsH, wallsV };
}

/**
 * One attempt at a day's puzzle.
 *
 * @param plan the weekday's plan
 * @param rng the generator
 * @returns the puzzle parts, or null when the bounded steps ran out
 */
function attempt(plan: (typeof WEEKDAY_PLAN)[number], rng: Rng): { cable: number[]; idx: number[]; wallsH: number[]; wallsV: number[] } | null {
  // The side.
  const n = plan.n;
  // Cells.
  const N = n * n;
  // Step 1: the cable.
  const cable = randomCable(n, rng);
  // Its ducts.
  const walls = randomWalls(n, cable, plan.walls, rng);
  // The base (side and walls).
  const base = { n, ...walls };
  // Step 2: ports at the two ends, plus one every five to eight cells, so the first search is short.
  const idx = new Set<number>([0, N - 1]);
  // Walking along the cable.
  for (let k = rng.range(4, 7); k < N - 2; k += rng.range(5, 8)) idx.add(k);
  // Sorted list.
  let list = [...idx].sort((a, b) => a - b);
  // Bounded refinement.
  let unique = false;
  // At most one port per cell.
  for (let step = 0; step < N && !unique; step++) {
    // The verdict.
    const u = uniqueness(base, cable, list);
    // Done.
    if (u === "unique") {
      // Unique.
      unique = true;
      // Stop.
      break;
    }
    // Unknown: add a port at random to tighten the search.
    if (u === "unknown") {
      // A cell without a port.
      const freeIdx = Array.from({ length: N }, (_, k) => k).filter((k) => !idx.has(k));
      // Added.
      idx.add(rng.pick(freeIdx));
    } else {
      // Where the other cable first parts from the answer.
      const at = u.findIndex((c, k) => c !== cable[k]);
      // The other cable's position of each cell.
      const otherPos = new Int32Array(N);
      // Filled.
      u.forEach((c, k) => (otherPos[c] = k));
      // A single port that the other cable reaches out of order breaks it: try them at random.
      const ordered = list.map((k) => otherPos[cable[k]]);
      // Candidates.
      let added = false;
      // Each free index in a random order.
      for (const k of rng.shuffle(Array.from({ length: N }, (_, q) => q).filter((q) => !idx.has(q)))) {
        // Where this port would sit among the existing ones on the answer.
        const ins = list.findIndex((q) => q > k);
        // The other cable's positions with it inserted.
        const seq = [...ordered.slice(0, ins), otherPos[cable[k]], ...ordered.slice(ins)];
        // Out of order on the other cable.
        if (seq.some((v, q) => q > 0 && v < seq[q - 1])) {
          // Added.
          idx.add(k);
          // Done.
          added = true;
          // Stop.
          break;
        }
      }
      // None alone: the cell where they part, on both cables, as two ports.
      if (!added) {
        // On the answer.
        idx.add(at);
        // The other cable's cell there, on the answer.
        idx.add(cable.indexOf(u[at]));
      }
    }
    // Sorted again.
    list = [...idx].sort((a, b) => a - b);
  }
  // Ran out.
  if (!unique) return null;
  // Step 3: drop the middle ports the cable does not need, in a random order.
  for (const k of rng.shuffle(list.filter((q) => q !== 0 && q !== N - 1))) {
    // Without it.
    const without = list.filter((q) => q !== k);
    // Still unique: dropped.
    if (uniqueness(base, cable, without) === "unique") list = without;
  }
  // The weekday's extras, spread along the longest gaps.
  for (let e = 0; e < plan.extra; e++) {
    // The longest gap between consecutive ports.
    let gapAt = 0, gapLen = 0;
    // Each gap.
    for (let q = 0; q + 1 < list.length; q++) {
      // Its length.
      const len = list[q + 1] - list[q];
      // Longer.
      if (len > gapLen) {
        // Remembered.
        gapLen = len;
        gapAt = q;
      }
    }
    // Too short to split.
    if (gapLen < 3) break;
    // A port somewhere in its middle third.
    const k = list[gapAt] + Math.max(1, Math.floor(gapLen / 3)) + rng.int(Math.max(1, Math.floor(gapLen / 3)));
    // Inserted, sorted.
    list = [...list, k].sort((a, b) => a - b);
  }
  // The parts.
  return { cable, idx: list, ...walls };
}

/**
 * The built-in puzzle: a 6 x 6 zigzag with a port every fourth cell, which pins the zigzag down.
 *
 * @param day the day it stands in for
 * @returns the puzzle
 */
function fallback(day: string): PpPuzzle {
  // The side.
  const n = FALLBACK_N;
  // The zigzag.
  const cable: number[] = [];
  // Row by row, alternating direction.
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) cable.push(r * n + (r % 2 === 0 ? k : n - 1 - k));
  // Ports every fourth cell, and the last.
  const ports = cable.filter((_, k) => k % 4 === 0 || k === n * n - 1);
  // The puzzle.
  return { day, weekday: weekdayOf(day), n, ports, wallsH: new Array(n * (n - 1)).fill(0), wallsV: new Array((n - 1) * n).fill(0), solution: cable, fallback: true };
}

/**
 * The puzzle of a day (or, with a seed, a practice round).
 *
 * @param day the date as YYYY-MM-DD
 * @param seed optional seed for a non-daily round
 * @returns the puzzle
 */
export function generate(day: string, seed?: number): PpPuzzle {
  // The weekday and its plan.
  const weekday = weekdayOf(day);
  // The plan.
  const plan = WEEKDAY_PLAN[weekday];
  // The generator.
  const rng = seed === undefined ? dailyRng(PP_ID, day) : makeRng(seed);
  // Bounded attempts.
  for (let a = 0; a < MAX_ATTEMPTS; a++) {
    // One attempt.
    const got = attempt(plan, rng);
    // Failed: next.
    if (!got) continue;
    // The puzzle.
    return { day, weekday, n: plan.n, ports: got.idx.map((k) => got.cable[k]), wallsH: got.wallsH, wallsV: got.wallsV, solution: got.cable, fallback: false };
  }
  // The built-in puzzle.
  return fallback(day);
}

/**
 * Whether a partial cable is legal so far: starts at port 1, steps between neighbours without ducts, visits each
 * cell once and reaches ports in order.
 *
 * @param p the puzzle
 * @param path the cells so far
 * @returns true when legal
 */
export function legalPrefix(p: PpPuzzle, path: readonly number[]): boolean {
  // Empty is legal.
  if (path.length === 0) return true;
  // Starts at port 1.
  if (path[0] !== p.ports[0]) return false;
  // Ports by cell.
  const portOf = new Map(p.ports.map((c, k) => [c, k]));
  // Cells seen.
  const seen = new Set<number>();
  // The next port expected.
  let next = 0;
  // Each cell.
  for (let k = 0; k < path.length; k++) {
    // Repeated.
    if (seen.has(path[k])) return false;
    // Seen.
    seen.add(path[k]);
    // A step from the previous cell.
    if (k > 0 && !canStep(p, path[k - 1], path[k])) return false;
    // A port must be the next one.
    const port = portOf.get(path[k]);
    // Out of order.
    if (port !== undefined && port !== next) return false;
    // Advanced.
    if (port !== undefined) next++;
  }
  // Legal.
  return true;
}

/**
 * Whether a cable is a solution: every cell, legal, ending at the last port.
 *
 * @param p the puzzle
 * @param path the cable
 * @returns true when solved
 */
export function isSolved(p: PpPuzzle, path: readonly number[]): boolean {
  // Every cell, legal, ending on the last port.
  return path.length === p.n * p.n && legalPrefix(p, path) && path[path.length - 1] === p.ports[p.ports.length - 1];
}

/**
 * What "Check" marks: the cells of the cable from the first one that leaves the answer onwards.
 *
 * @param p the puzzle
 * @param path the cable so far
 * @returns the cells in error
 */
export function checkErrors(p: PpPuzzle, path: readonly number[]): Set<number> {
  // The first difference.
  const at = path.findIndex((c, k) => c !== p.solution[k]);
  // None: no errors.
  if (at < 0) return new Set();
  // That cell and everything after it.
  return new Set(path.slice(at));
}

/**
 * Whether a puzzle is well formed.
 *
 * @param p the puzzle
 * @returns a problem, or null
 */
export function wellFormed(p: PpPuzzle): string | null {
  // Side.
  if (p.n < 5 || p.n > 8) return "side out of range";
  // Lengths.
  if (p.wallsH.length !== p.n * (p.n - 1) || p.wallsV.length !== (p.n - 1) * p.n || p.solution.length !== p.n * p.n) return "wrong lengths";
  // At least three ports.
  if (p.ports.length < 3) return "too few ports";
  // Ports are distinct cells.
  if (new Set(p.ports).size !== p.ports.length) return "repeated port";
  // The answer is a full legal cable.
  if (!isSolved(p, p.solution)) return "answer is not a legal cable";
  // All well.
  return null;
}

/**
 * The self-test: 400 days from 2026-11-03, plus the built-in puzzle.
 *
 * @returns the report, with timing
 */
export function selfTest(): SelfTestReport & { timing: { worstMs: number; meanMs: number; fallbacks: number; ports: Record<string, [number, number]> } } {
  // Problems.
  const failures: string[] = [];
  // Timing.
  let worst = 0, sum = 0, fallbacks = 0;
  // Port counts by weekday: fewest and most.
  const ports: Record<string, [number, number]> = {};
  // The built-in puzzle.
  const fb = fallback(SELFTEST_FROM);
  // Unique, and equal to its answer.
  const fr = solveAll(fb, 2, false);
  // Checked.
  if (fr.exhausted || fr.found.length !== 1 || fr.found[0].join() !== fb.solution.join()) failures.push("built-in puzzle is not uniquely solved by its answer");
  // Each day.
  for (let d = 0; d < SELFTEST_DAYS; d++) {
    // The day.
    const day = addDays(SELFTEST_FROM, d);
    // Timed.
    const t0 = performance.now();
    // First build.
    const a = generate(day);
    // Its time.
    const ms = performance.now() - t0;
    // Slowest.
    worst = Math.max(worst, ms);
    // Total.
    sum += ms;
    // Second build, identical.
    if (JSON.stringify(a) !== JSON.stringify(generate(day))) failures.push(`${day}: not deterministic`);
    // Well formed.
    const wf = wellFormed(a);
    // Reported.
    if (wf) failures.push(`${day}: ${wf}`);
    // Solved independently, without the shortcuts and with a larger budget.
    const r = solveAll(a, 2, false);
    // Within budget, exactly one.
    if (r.exhausted || r.found.length !== 1) failures.push(`${day}: ${r.exhausted ? "search budget ran out" : `${r.found.length} cables`}`);
    // The generator's.
    else if (r.found[0].join() !== a.solution.join()) failures.push(`${day}: solver and generator disagree`);
    // Fallbacks.
    if (a.fallback) fallbacks++;
    // Port counts.
    const key = `wd${a.weekday}`;
    // Range.
    const cur = ports[key] ?? [Infinity, 0];
    // Updated.
    ports[key] = [Math.min(cur[0], a.ports.length), Math.max(cur[1], a.ports.length)];
  }
  // The report.
  return { checked: SELFTEST_DAYS + 1, failures, timing: { worstMs: worst, meanMs: sum / SELFTEST_DAYS, fallbacks, ports } };
}
