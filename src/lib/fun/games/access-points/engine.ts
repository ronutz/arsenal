// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/access-points/engine.ts
// ----------------------------------------------------------------------------
// ACCESS POINTS, the daily floor-plan puzzle of /dev/fun (PRIME 03/11/2026).
//
// An N x N office floor is split into N zones. The player places exactly one
// wireless access point in every row, every column and every zone, and no two
// access points may touch, diagonals included (they would interfere).
//
// The day's puzzle comes from dailyRng("access-points", day) and is built in
// three bounded steps:
//   1. a random valid answer: one access point per row and column, no two in
//      neighbouring rows closer than two columns;
//   2. zones grown outwards from those access points, then refined: while the
//      solver still finds a second answer, one cell that second answer relies
//      on moves to a neighbouring zone, which always breaks that answer;
//   3. the zone map is the only clue this puzzle has, so there is nothing to
//      drop afterwards: refinement stops the moment the count reaches one.
// Each finished map is rated by a logic solver (which rules a person needs)
// and the weekday decides the size and the rating it must reach.
//
// Pure and deterministic: no DOM, no clock, no Math.random. selfTest() rebuilds
// 400 days from 2026-11-03 and proves each puzzle well formed, deterministic and
// uniquely solvable, with the generator's answer equal to the solver's.
// ============================================================================

// The daily seed, the seeded generator, the day arithmetic.
import { addDays, dailyRng, epochDay, makeRng, type Rng } from "../../daily";
// The report shape every engine's self-test returns.
import type { SelfTestReport } from "../../registry";

/** The game's stable id (storage key, seed word, folder name). */
export const AP_ID = "access-points";

/** The first day the self-test rebuilds. */
const SELFTEST_FROM = "2026-11-03";

/** How many days the self-test rebuilds. */
const SELFTEST_DAYS = 400;

/** One day's puzzle. */
export interface ApPuzzle {
  /** The UTC day it belongs to, YYYY-MM-DD. */
  day: string;
  /** The weekday, 0 = Monday to 6 = Sunday. */
  weekday: number;
  /** The side of the floor plan. */
  n: number;
  /** The zone of every cell, row by row (0 to n - 1, numbered in reading order of their first cell). */
  zones: number[];
  /** The answer: the column of the access point in each row. */
  solution: number[];
  /** The logic level a person needs: 1 singles only, 2 plus confinement, 3 plus look-ahead, 4 trial and error. */
  level: number;
  /** True when the generator ran out of attempts and used the built-in puzzle. */
  fallback: boolean;
}

/** What each weekday asks for: the side and the accepted logic levels. */
const WEEKDAY_PLAN: readonly { n: number; minLevel: number; maxLevel: number }[] = [
  // Monday: small floor, singles only.
  { n: 6, minLevel: 1, maxLevel: 1 },
  // Tuesday: small floor, confinement allowed.
  { n: 6, minLevel: 1, maxLevel: 2 },
  // Wednesday: seven by seven, up to confinement.
  { n: 7, minLevel: 1, maxLevel: 2 },
  // Thursday: seven by seven, needs at least confinement.
  { n: 7, minLevel: 2, maxLevel: 3 },
  // Friday: eight by eight, up to look-ahead.
  { n: 8, minLevel: 2, maxLevel: 3 },
  // Saturday: eight by eight, needs look-ahead.
  { n: 8, minLevel: 3, maxLevel: 3 },
  // Sunday: eight by eight, the hardest the logic solver still rates.
  { n: 8, minLevel: 3, maxLevel: 3 },
];

/** Attempts per day before the best near miss (or the built-in puzzle) is used. */
const MAX_ATTEMPTS = 40;

/** The built-in puzzle, used only if every attempt fails: a 6 x 6 map proven unique by the self-test. */
const FALLBACK = {
  // Six by six.
  n: 6,
  // The zones, row by row.
  zones: [0, 1, 2, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 3, 3, 4, 2, 2, 0, 3, 3, 4, 2, 5, 0, 3, 3, 3, 2, 2],
  // The access point's column in each row.
  solution: [1, 4, 0, 3, 5, 2],
};

/**
 * The weekday of a day, Monday first.
 *
 * @param day the date as YYYY-MM-DD
 * @returns 0 for Monday to 6 for Sunday
 */
export function weekdayOf(day: string): number {
  // 1970-01-01 was a Thursday (index 3 when Monday is 0), so shift by three.
  return (((epochDay(day) + 3) % 7) + 7) % 7;
}

/**
 * The cells that share a side with a cell.
 *
 * @param n the side of the grid
 * @param i the cell
 * @returns its orthogonal neighbours
 */
function orth(n: number, i: number): number[] {
  // Row and column of the cell.
  const r = Math.floor(i / n), c = i % n;
  // The list being built.
  const out: number[] = [];
  // Up, down, left, right, each only inside the grid.
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  // The neighbours.
  return out;
}

/**
 * The cells an access point at i rules out by touching it (the eight around it).
 *
 * @param n the side of the grid
 * @param i the cell
 * @returns the touching cells
 */
export function touching(n: number, i: number): number[] {
  // Row and column of the cell.
  const r = Math.floor(i / n), c = i % n;
  // The list being built.
  const out: number[] = [];
  // Every offset in the three by three block around it.
  for (let dr = -1; dr <= 1; dr++) {
    // Each column offset.
    for (let dc = -1; dc <= 1; dc++) {
      // The cell itself is not its own neighbour.
      if (dr === 0 && dc === 0) continue;
      // The neighbour's coordinates.
      const rr = r + dr, cc = c + dc;
      // Kept when inside the grid.
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
    }
  }
  // The touching cells.
  return out;
}

/**
 * A random valid answer: one access point per row and column, none touching.
 *
 * @param n the side
 * @param rng the day's generator
 * @returns the column of each row's access point
 */
function randomAnswer(n: number, rng: Rng): number[] {
  // The columns chosen so far.
  const cols: number[] = [];
  // Depth-first placement, row by row, columns in a random order.
  const place = (r: number, used: number): boolean => {
    // Every row has its access point.
    if (r === n) return true;
    // The columns in a shuffled order.
    for (const c of rng.shuffle(Array.from({ length: n }, (_, k) => k))) {
      // A column already used is out.
      if (used & (1 << c)) continue;
      // Touching the previous row's access point (same or next column) is out.
      if (r > 0 && Math.abs(cols[r - 1] - c) < 2) continue;
      // Try it.
      cols[r] = c;
      // Deeper; success ends the search.
      if (place(r + 1, used | (1 << c))) return true;
    }
    // No column works here: back up.
    return false;
  };
  // Boards of side four and more always have an answer.
  place(0, 0);
  // The answer.
  return cols.slice(0, n);
}

/**
 * Grow n zones outwards from the answer's access points, each zone at its own random pace.
 *
 * @param n the side
 * @param answer the access point column per row
 * @param rng the day's generator
 * @returns the zone of every cell (zone k holds row k's access point)
 */
function growZones(n: number, answer: number[], rng: Rng): number[] {
  // Every cell starts unassigned.
  const zones: number[] = new Array(n * n).fill(-1);
  // Each access point seeds the zone with its row's number.
  for (let r = 0; r < n; r++) zones[r * n + answer[r]] = r;
  // A pace per zone: some stay small, some sprawl.
  const pace = Array.from({ length: n }, () => 0.15 + rng.next() * 1.7);
  // Cells still to assign.
  let left = n * n - n;
  // One cell per round; at most n * n rounds.
  for (let round = 0; left > 0 && round < n * n; round++) {
    // The candidate (cell, zone) pairs on the frontier, and their total weight.
    const cells: number[] = [], owners: number[] = [];
    // The running weight.
    let total = 0;
    // Each unassigned cell next to an assigned one.
    for (let i = 0; i < n * n; i++) {
      // Only unassigned cells grow.
      if (zones[i] >= 0) continue;
      // Each neighbouring zone may claim it.
      for (const j of orth(n, i)) {
        // An unassigned neighbour claims nothing.
        if (zones[j] < 0) continue;
        // The pair.
        cells.push(i);
        owners.push(zones[j]);
        // Its weight is the zone's pace.
        total += pace[zones[j]];
      }
    }
    // A point on the weight line picks the pair.
    let x = rng.next() * total;
    // Walk the pairs until the point is passed.
    let k = 0;
    // Subtract each weight in turn.
    for (; k < cells.length - 1; k++) {
      // The point lands in this pair.
      if ((x -= pace[owners[k]]) < 0) break;
    }
    // The chosen cell joins the chosen zone.
    zones[cells[k]] = owners[k];
    // One fewer to go.
    left--;
  }
  // The grown map.
  return zones;
}

/**
 * Renumber zones in reading order of their first cell, so zone labels run A, B, C down the page.
 *
 * @param zones a zone map
 * @returns the same partition, renumbered
 */
function renumber(zones: number[]): number[] {
  // Old number to new number.
  const map = new Map<number, number>();
  // Each cell in reading order gives its zone the next free number.
  return zones.map((z) => {
    // First time this zone is seen: the next number.
    if (!map.has(z)) map.set(z, map.size);
    // The new number.
    return map.get(z) as number;
  });
}

/**
 * Whether a zone stays in one piece once a cell leaves it.
 *
 * @param n the side
 * @param zones the zone map
 * @param z the zone
 * @param without the cell that would leave
 * @returns true when the rest of the zone is still connected (and not empty)
 */
function staysConnected(n: number, zones: number[], z: number, without: number): boolean {
  // The zone's other cells.
  const members = zones.map((v, i) => (v === z && i !== without ? i : -1)).filter((i) => i >= 0);
  // A zone may not vanish.
  if (members.length === 0) return false;
  // Flood from the first member.
  const seen = new Set<number>([members[0]]);
  // The flood's queue.
  const queue = [members[0]];
  // Until the queue empties.
  while (queue.length) {
    // The next cell.
    const i = queue.pop() as number;
    // Its neighbours in the same zone, not the leaving cell.
    for (const j of orth(n, i)) {
      // Same zone, still a member, not seen yet.
      if (zones[j] === z && j !== without && !seen.has(j)) {
        // Seen.
        seen.add(j);
        // To expand.
        queue.push(j);
      }
    }
  }
  // Connected when the flood reached every member.
  return seen.size === members.length;
}

/**
 * Count the answers of a zone map, stopping at a limit: backtracking row by row, with a forward check that every
 * zone still has a free cell below.
 *
 * @param n the side
 * @param zones the zone map
 * @param limit stop after this many answers (2 is enough to tell unique from not)
 * @returns the answers found (each a column per row), at most `limit`
 */
export function solveAll(n: number, zones: number[], limit = 2): number[][] {
  // The answers found.
  const found: number[][] = [];
  // The columns chosen so far.
  const cols: number[] = new Array(n).fill(-1);
  // Each zone's cells, for the forward check.
  const zoneCells: number[][] = Array.from({ length: n }, () => []);
  // Filled from the map.
  zones.forEach((z, i) => zoneCells[z].push(i));
  // Depth-first, row by row.
  const go = (r: number, colMask: number, zoneMask: number): boolean => {
    // A full answer.
    if (r === n) {
      // Kept.
      found.push(cols.slice());
      // Stop once the limit is reached.
      return found.length >= limit;
    }
    // Each column in turn.
    for (let c = 0; c < n; c++) {
      // Column already used.
      if (colMask & (1 << c)) continue;
      // Touching the access point above.
      if (r > 0 && Math.abs(cols[r - 1] - c) < 2) continue;
      // The cell's zone.
      const z = zones[r * n + c];
      // Zone already served.
      if (zoneMask & (1 << z)) continue;
      // The new masks.
      const cm = colMask | (1 << c), zm = zoneMask | (1 << z);
      // Forward check: every unserved zone needs a cell in a lower row with a free column.
      let alive = true;
      // Each zone.
      for (let k = 0; k < n && alive; k++) {
        // Served zones need nothing.
        if (zm & (1 << k)) continue;
        // Look for one usable cell.
        alive = zoneCells[k].some((i) => Math.floor(i / n) > r && !(cm & (1 << (i % n))));
      }
      // A dead end: try the next column.
      if (!alive) continue;
      // Place it.
      cols[r] = c;
      // Deeper; stop when the limit is reached.
      if (go(r + 1, cm, zm)) return true;
    }
    // This row is exhausted.
    return false;
  };
  // From the top row.
  go(0, 0, 0);
  // The answers.
  return found;
}

/**
 * Whether a person using a given set of rules solves the map without guessing.
 *   Level 1: a row, column or zone with one possible cell takes it; an access point rules out its row, column,
 *            zone and the eight cells around it.
 *   Level 2: plus confinement: a zone whose possible cells sit in one row (or column) rules out the rest of that
 *            row; a row (or column) whose possible cells sit in one zone rules out the rest of that zone.
 *   Level 3: plus the same for groups (k zones confined to k rows), and look-ahead: a cell that would leave some
 *            row, column or zone with nowhere to go is ruled out.
 *
 * @param n the side
 * @param zones the zone map
 * @param level 1, 2 or 3
 * @returns true when those rules alone reach the answer
 */
function logicSolves(n: number, zones: number[], level: number): boolean {
  // Which cells may still hold an access point.
  const cand = new Uint8Array(n * n).fill(1);
  // Units served so far: rows, columns, zones.
  const rowDone = new Uint8Array(n), colDone = new Uint8Array(n), zoneDone = new Uint8Array(n);
  // Access points placed.
  let placed = 0;
  // The cells of each kind of unit.
  const rowCells = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c));
  // Columns.
  const colCells = Array.from({ length: n }, (_, c) => Array.from({ length: n }, (_, r) => r * n + c));
  // Zones.
  const zoneCells: number[][] = Array.from({ length: n }, () => []);
  // Filled from the map.
  zones.forEach((z, i) => zoneCells[z].push(i));
  // Everything an access point at i rules out, as a list.
  const rulesOut = (i: number): number[] => {
    // Its row, column, zone and the eight around it.
    const r = Math.floor(i / n), c = i % n;
    // Joined; duplicates do no harm.
    return [...rowCells[r], ...colCells[c], ...zoneCells[zones[i]], ...touching(n, i)];
  };
  // Place an access point.
  const place = (i: number): void => {
    // Every cell it rules out.
    for (const j of rulesOut(i)) cand[j] = 0;
    // Its units are served.
    rowDone[Math.floor(i / n)] = 1;
    colDone[i % n] = 1;
    zoneDone[zones[i]] = 1;
    // One more placed.
    placed++;
  };
  // The open units as [cells, done flag] pairs, for the single and empty checks.
  const units = (): number[][] => [
    ...rowCells.filter((_, k) => !rowDone[k]),
    ...colCells.filter((_, k) => !colDone[k]),
    ...zoneCells.filter((_, k) => !zoneDone[k]),
  ];
  // A bounded loop: every pass that changes nothing ends it.
  for (let pass = 0; pass < n * n * 4 && placed < n; pass++) {
    // Singles: an open unit with one possible cell.
    let progress = false;
    // Each open unit.
    for (const u of units()) {
      // Its possible cells.
      const live = u.filter((i) => cand[i]);
      // A unit with none: these rules contradict themselves (a broken map).
      if (live.length === 0) return false;
      // Exactly one: place it, and start the pass again.
      if (live.length === 1) {
        // Placed.
        place(live[0]);
        // Something changed.
        progress = true;
        // Re-read the units.
        break;
      }
    }
    // A placement restarts the loop.
    if (progress) continue;
    // Level 1 stops here.
    if (level < 2) return false;
    // Confinement, for groups up to this size.
    const maxGroup = level >= 3 ? n - 1 : 1;
    // The four pairings: zones over rows, zones over columns, rows over zones, columns over zones.
    const pairings: { groups: number[][]; key: (i: number) => number; owner: (i: number) => number }[] = [
      // Zones confined to rows.
      { groups: zoneCells.map((u, k) => (zoneDone[k] ? [] : u)), key: (i) => Math.floor(i / n), owner: (i) => zones[i] },
      // Zones confined to columns.
      { groups: zoneCells.map((u, k) => (zoneDone[k] ? [] : u)), key: (i) => i % n, owner: (i) => zones[i] },
      // Rows confined to zones.
      { groups: rowCells.map((u, k) => (rowDone[k] ? [] : u)), key: (i) => zones[i], owner: (i) => Math.floor(i / n) },
      // Columns confined to zones.
      { groups: colCells.map((u, k) => (colDone[k] ? [] : u)), key: (i) => zones[i], owner: (i) => i % n },
    ];
    // Each pairing in turn.
    for (const p of pairings) {
      // The open groups and the keys their possible cells touch, as bit masks.
      const open: number[] = [], masks: number[] = [];
      // Each group.
      p.groups.forEach((u, k) => {
        // Served groups are skipped.
        if (u.length === 0) return;
        // The mask of keys.
        let m = 0;
        // Each possible cell adds its key.
        for (const i of u) if (cand[i]) m |= 1 << p.key(i);
        // Kept.
        open.push(k);
        masks.push(m);
      });
      // Every subset of open groups, as a bit mask over `open`.
      for (let s = 1; s < 1 << open.length && !progress; s++) {
        // The subset's size.
        let size = 0, union = 0, members = 0;
        // Its groups.
        for (let b = 0; b < open.length; b++) {
          // Not in the subset.
          if (!(s & (1 << b))) continue;
          // Counted.
          size++;
          // Their keys joined.
          union |= masks[b];
          // Their ids.
          members |= 1 << open[b];
        }
        // Too big for this level.
        if (size > maxGroup) continue;
        // Count the keys.
        let keys = 0;
        // Popcount by hand.
        for (let v = union; v; v &= v - 1) keys++;
        // Confined: as many keys as groups.
        if (keys !== size) continue;
        // Every possible cell with one of those keys outside the subset is ruled out.
        for (let i = 0; i < n * n; i++) {
          // Possible, keyed into the union, owned by a group outside the subset.
          if (cand[i] && union & (1 << p.key(i)) && !(members & (1 << p.owner(i)))) {
            // Ruled out.
            cand[i] = 0;
            // Something changed.
            progress = true;
          }
        }
      }
      // A change restarts the loop.
      if (progress) break;
    }
    // A change restarts the loop.
    if (progress) continue;
    // Level 2 stops here.
    if (level < 3) return false;
    // Look-ahead: a cell whose access point would empty an open unit is ruled out.
    for (let i = 0; i < n * n && !progress; i++) {
      // Only possible cells.
      if (!cand[i]) continue;
      // What it would rule out.
      const gone = new Set(rulesOut(i));
      // Its own units, which it would serve.
      const r = Math.floor(i / n), c = i % n, z = zones[i];
      // Each other open unit must keep a possible cell.
      const starves =
        rowCells.some((u, k) => !rowDone[k] && k !== r && !u.some((j) => cand[j] && !gone.has(j))) ||
        colCells.some((u, k) => !colDone[k] && k !== c && !u.some((j) => cand[j] && !gone.has(j))) ||
        zoneCells.some((u, k) => !zoneDone[k] && k !== z && !u.some((j) => cand[j] && !gone.has(j)));
      // A starving placement is impossible.
      if (starves) {
        // Ruled out.
        cand[i] = 0;
        // Something changed.
        progress = true;
      }
    }
    // Nothing more these rules can do.
    if (!progress) return false;
  }
  // Solved when every access point is placed.
  return placed === n;
}

/**
 * The lowest logic level that solves a map.
 *
 * @param n the side
 * @param zones the zone map
 * @returns 1, 2 or 3, or 4 when guessing is needed
 */
export function rateLevel(n: number, zones: number[]): number {
  // Each level in turn.
  for (let level = 1; level <= 3; level++) if (logicSolves(n, zones, level)) return level;
  // None: trial and error.
  return 4;
}

/**
 * One attempt: an answer, zones grown from it, refined until unique.
 *
 * @param n the side
 * @param rng the day's generator
 * @returns the unique map and its answer, or null when refinement ran out of steps
 */
function attempt(n: number, rng: Rng): { zones: number[]; solution: number[] } | null {
  // Step 1: the answer.
  const answer = randomAnswer(n, rng);
  // The access point cells, which never change zone.
  const apCells = new Set(answer.map((c, r) => r * n + c));
  // Step 2a: the grown map.
  const zones = growZones(n, answer, rng);
  // Step 2b: refinement, bounded.
  for (let step = 0; step < 4 * n * n; step++) {
    // Up to two answers.
    const found = solveAll(n, zones, 2);
    // Unique: done.
    if (found.length === 1) return { zones: renumber(zones), solution: found[0] };
    // The other answer (the generator's own is always among the answers).
    const other = found.find((f) => f.some((c, r) => c !== answer[r]));
    // Should not happen: no other answer to break.
    if (!other) return null;
    // The cells the other answer uses that the real one does not.
    const moves: { cell: number; to: number }[] = [];
    // Each row where the two differ.
    other.forEach((c, r) => {
      // The other answer's cell in this row.
      const cell = r * n + c;
      // Same as the real answer: nothing to move.
      if (c === answer[r] || apCells.has(cell)) return;
      // Its zone.
      const from = zones[cell];
      // The zone must stay in one piece without it.
      if (!staysConnected(n, zones, from, cell)) return;
      // Each neighbouring zone could take it.
      for (const j of orth(n, cell)) if (zones[j] !== from) moves.push({ cell, to: zones[j] });
    });
    // Nowhere to move: this attempt is stuck.
    if (moves.length === 0) return null;
    // One move, at random: the cell joins a zone that already has the other answer's access point elsewhere.
    const mv = rng.pick(moves);
    // Applied.
    zones[mv.cell] = mv.to;
  }
  // Ran out of steps.
  return null;
}

/**
 * The puzzle of a day (or, with a seed, a practice round).
 *
 * @param day the date as YYYY-MM-DD
 * @param seed optional: a seed for a non-daily round (the day still sets the size and difficulty)
 * @returns the puzzle
 */
export function generate(day: string, seed?: number): ApPuzzle {
  // The weekday and its plan.
  const weekday = weekdayOf(day);
  // Size and accepted levels.
  const plan = WEEKDAY_PLAN[weekday];
  // The generator: the day's, or the practice seed's.
  const rng = seed === undefined ? dailyRng(AP_ID, day) : makeRng(seed);
  // The best near miss so far, by distance from the accepted levels.
  let best: { zones: number[]; solution: number[]; level: number; miss: number } | null = null;
  // Bounded attempts.
  for (let k = 0; k < MAX_ATTEMPTS; k++) {
    // One attempt.
    const got = attempt(plan.n, rng);
    // A failed attempt: next.
    if (!got) continue;
    // Its rating.
    const level = rateLevel(plan.n, got.zones);
    // How far outside the accepted range it is.
    const miss = level < plan.minLevel ? plan.minLevel - level : level > plan.maxLevel ? level - plan.maxLevel : 0;
    // Inside the range: this is the day's puzzle.
    if (miss === 0) return { day, weekday, n: plan.n, zones: got.zones, solution: got.solution, level, fallback: false };
    // Otherwise remember the closest.
    if (!best || miss < best.miss) best = { ...got, level, miss };
  }
  // The closest near miss, if there was any unique map at all.
  if (best) return { day, weekday, n: plan.n, zones: best.zones, solution: best.solution, level: best.level, fallback: false };
  // The built-in puzzle.
  return { day, weekday, n: FALLBACK.n, zones: FALLBACK.zones.slice(), solution: FALLBACK.solution.slice(), level: rateLevel(FALLBACK.n, FALLBACK.zones), fallback: true };
}

/** What a board cell holds: nothing, a mark (×) or an access point. */
export type ApMark = 0 | 1 | 2;

/**
 * The cells in conflict on a board: access points sharing a row, column or zone, or touching.
 *
 * @param p the puzzle
 * @param board one ApMark per cell
 * @returns the cells whose access point breaks a rule
 */
export function conflicts(p: ApPuzzle, board: readonly ApMark[]): Set<number> {
  // The access points on the board.
  const aps = board.map((v, i) => (v === 2 ? i : -1)).filter((i) => i >= 0);
  // The cells in conflict.
  const bad = new Set<number>();
  // Each pair of access points.
  for (let a = 0; a < aps.length; a++) {
    // Each later one.
    for (let b = a + 1; b < aps.length; b++) {
      // Their coordinates.
      const i = aps[a], j = aps[b];
      // Rows and columns.
      const ri = Math.floor(i / p.n), ci = i % p.n, rj = Math.floor(j / p.n), cj = j % p.n;
      // Same row, column or zone, or touching.
      const clash = ri === rj || ci === cj || p.zones[i] === p.zones[j] || (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1);
      // Both are in conflict.
      if (clash) {
        // The first.
        bad.add(i);
        // The second.
        bad.add(j);
      }
    }
  }
  // The conflicts.
  return bad;
}

/**
 * The cells that the board's access points rule out (for the auto-mark option).
 *
 * @param p the puzzle
 * @param board one ApMark per cell
 * @returns the cells no further access point can take
 */
export function ruledOut(p: ApPuzzle, board: readonly ApMark[]): Set<number> {
  // The set being built.
  const out = new Set<number>();
  // Each access point.
  board.forEach((v, i) => {
    // Only access points rule things out.
    if (v !== 2) return;
    // Its row, column and zone.
    const r = Math.floor(i / p.n), c = i % p.n;
    // Every cell sharing one of them.
    for (let j = 0; j < p.n * p.n; j++) {
      // Same row, column or zone.
      if (Math.floor(j / p.n) === r || j % p.n === c || p.zones[j] === p.zones[i]) out.add(j);
    }
    // And the eight around it.
    for (const j of touching(p.n, i)) out.add(j);
  });
  // Cells holding an access point are not "ruled out" themselves.
  board.forEach((v, i) => {
    // Remove the access points.
    if (v === 2) out.delete(i);
  });
  // The set.
  return out;
}

/**
 * Whether a board is solved: n access points, no conflict.
 *
 * @param p the puzzle
 * @param board one ApMark per cell
 * @returns true when solved
 */
export function isSolved(p: ApPuzzle, board: readonly ApMark[]): boolean {
  // Count the access points.
  const count = board.filter((v) => v === 2).length;
  // n of them, and none in conflict, is the unique answer.
  return count === p.n && conflicts(p, board).size === 0;
}

/**
 * What "Check" marks: access points that are not in the answer, and marks (×) sitting on an answer cell.
 *
 * @param p the puzzle
 * @param board one ApMark per cell
 * @returns the cells in error
 */
export function checkErrors(p: ApPuzzle, board: readonly ApMark[]): Set<number> {
  // The answer's cells.
  const answer = new Set(p.solution.map((c, r) => r * p.n + c));
  // The errors.
  const bad = new Set<number>();
  // Each cell.
  board.forEach((v, i) => {
    // An access point off the answer, or a mark on it.
    if ((v === 2 && !answer.has(i)) || (v === 1 && answer.has(i))) bad.add(i);
  });
  // The errors.
  return bad;
}

/**
 * Whether a puzzle is well formed: sizes agree, zones are n connected pieces, the answer obeys every rule.
 *
 * @param p the puzzle
 * @returns a problem description, or null when all is well
 */
export function wellFormed(p: ApPuzzle): string | null {
  // The side is in range.
  if (p.n < 5 || p.n > 9) return `side ${p.n} out of range`;
  // One zone per cell.
  if (p.zones.length !== p.n * p.n) return "zone map has the wrong length";
  // One column per row.
  if (p.solution.length !== p.n) return "answer has the wrong length";
  // Every zone number is in range.
  if (p.zones.some((z) => z < 0 || z >= p.n || !Number.isInteger(z))) return "zone number out of range";
  // Each zone exists and is one piece.
  for (let z = 0; z < p.n; z++) {
    // Connected (and not empty), tested with no cell leaving.
    if (!staysConnected(p.n, p.zones, z, -1)) return `zone ${z} is empty or split`;
  }
  // The answer as a board.
  const board: ApMark[] = new Array(p.n * p.n).fill(0);
  // Its access points.
  p.solution.forEach((c, r) => (board[r * p.n + c] = 2));
  // It must obey every rule.
  if (!isSolved(p, board)) return "answer breaks a rule";
  // All well.
  return null;
}

/**
 * The self-test: 400 days from 2026-11-03, each well formed, deterministic, unique, with the generator's answer
 * equal to the solver's; plus the built-in puzzle. Records the slowest generation.
 *
 * @returns the report (checked count and failures; the timing goes into `timing`)
 */
export function selfTest(): SelfTestReport & { timing: { worstMs: number; meanMs: number; fallbacks: number; levels: Record<string, number> } } {
  // Problems found.
  const failures: string[] = [];
  // Timing.
  let worst = 0, sum = 0, fallbacks = 0;
  // How often each weekday met its plan, by level.
  const levels: Record<string, number> = {};
  // The built-in puzzle first: it must be unique too.
  const fb = solveAll(FALLBACK.n, FALLBACK.zones, 2);
  // Exactly one answer, equal to the stored one.
  if (fb.length !== 1 || fb[0].join() !== FALLBACK.solution.join()) failures.push("built-in puzzle is not uniquely solved by its answer");
  // Each day.
  for (let d = 0; d < SELFTEST_DAYS; d++) {
    // The day.
    const day = addDays(SELFTEST_FROM, d);
    // Timed generation.
    const t0 = performance.now();
    // First build.
    const a = generate(day);
    // Its time.
    const ms = performance.now() - t0;
    // The slowest.
    worst = Math.max(worst, ms);
    // The total.
    sum += ms;
    // Second build.
    const b = generate(day);
    // Identical, field by field.
    if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${day}: not deterministic`);
    // Well formed.
    const wf = wellFormed(a);
    // Reported.
    if (wf) failures.push(`${day}: ${wf}`);
    // Solved independently.
    const found = solveAll(a.n, a.zones, 2);
    // Exactly one answer.
    if (found.length !== 1) failures.push(`${day}: ${found.length} answers`);
    // The same as the generator's.
    else if (found[0].join() !== a.solution.join()) failures.push(`${day}: solver and generator disagree`);
    // The rules page promises reasoning alone: a puzzle that needs trial and error fails.
    if (a.level > 3) failures.push(`${day}: needs trial and error (level ${a.level})`);
    // Fallbacks counted.
    if (a.fallback) fallbacks++;
    // Levels by weekday, for the report.
    const key = `wd${a.weekday}:L${a.level}`;
    // Counted.
    levels[key] = (levels[key] ?? 0) + 1;
  }
  // The report.
  return { checked: SELFTEST_DAYS + 1, failures, timing: { worstMs: worst, meanMs: sum / SELFTEST_DAYS, fallbacks, levels } };
}
