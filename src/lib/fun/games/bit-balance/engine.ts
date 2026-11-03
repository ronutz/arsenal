// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/bit-balance/engine.ts
// ----------------------------------------------------------------------------
// BIT BALANCE, the daily 6 x 6 bit puzzle of /dev/fun (PRIME 03/11/2026).
//
// Fill every cell with a 0 or a 1 so that each row and each column holds
// three of each, no more than two equal bits sit next to each other in a row
// or column, and every "=" (equal) or "×" (different) sign between two
// neighbouring cells holds. A few cells are given.
//
// The day's puzzle comes from dailyRng("bit-balance", day), built in three
// bounded steps:
//   1. a random valid grid of bits (the answer);
//   2. clues added until the solver finds exactly one answer: each time it
//      finds a second answer, one given or one sign that the second answer
//      breaks is added (a cell where the two differ, or a pair whose relation
//      differs);
//   3. every clue tried for removal, in a random order, and dropped when the
//      answer stays unique.
// A logic solver then rates the result; the weekday sets how many clues are
// added back and which rating is accepted (Monday gentle, Sunday hard).
//
// nextHint() (the Hint button, PRIME 03/11/2026) applies the rater's rules to
// the player's board, simplest first, and returns the first step they force
// with the reason in data: a wrong bit comes first; only when no rule applies
// does it fall back to the answer, and says so. The self-test walks every
// day's grid from its givens by hints alone.
//
// Pure and deterministic: no DOM, no clock, no Math.random.
// ============================================================================

// The daily seed, the seeded generator, the day arithmetic.
import { addDays, dailyRng, epochDay, makeRng, type Rng } from "../../daily";
// The report shape every engine's self-test returns.
import type { SelfTestReport } from "../../registry";

/** The game's stable id. */
export const BB_ID = "bit-balance";

/** The side of the grid. */
export const BB_N = 6;

/** The first day the self-test rebuilds. */
const SELFTEST_FROM = "2026-11-03";

/** How many days the self-test rebuilds. */
const SELFTEST_DAYS = 400;

/** Cells in the grid. */
const CELLS = BB_N * BB_N;

/** A sign between two neighbours: none, equal, different. */
export type BbSign = 0 | 1 | 2;

/** One day's puzzle. */
export interface BbPuzzle {
  /** The UTC day, YYYY-MM-DD. */
  day: string;
  /** 0 = Monday to 6 = Sunday. */
  weekday: number;
  /** The given bits, row by row: -1 for an empty cell, else 0 or 1. */
  given: number[];
  /** Signs between (r, c) and (r, c + 1), index r * 5 + c. */
  h: BbSign[];
  /** Signs between (r, c) and (r + 1, c), index r * 6 + c. */
  v: BbSign[];
  /** The answer, row by row. */
  solution: number[];
  /** The logic level a person needs: 1 basic rules, 2 plus one-step trial, 3 deeper search. */
  level: number;
  /** True when the built-in puzzle was used. */
  fallback: boolean;
}

/** The weekday plan: clues added back after minimising, the accepted levels, and how often a new clue is a given. */
const WEEKDAY_PLAN: readonly { extra: number; minLevel: number; maxLevel: number; givenShare: number }[] = [
  // Monday: four clues back, basic rules only, mostly givens.
  { extra: 4, minLevel: 1, maxLevel: 1, givenShare: 0.6 },
  // Tuesday.
  { extra: 3, minLevel: 1, maxLevel: 1, givenShare: 0.55 },
  // Wednesday.
  { extra: 2, minLevel: 1, maxLevel: 1, givenShare: 0.5 },
  // Thursday: one-step trial allowed.
  { extra: 1, minLevel: 1, maxLevel: 2, givenShare: 0.45 },
  // Friday.
  { extra: 1, minLevel: 1, maxLevel: 2, givenShare: 0.4 },
  // Saturday: needs one-step trial.
  { extra: 0, minLevel: 2, maxLevel: 2, givenShare: 0.35 },
  // Sunday: needs one-step trial, more signs than givens.
  { extra: 0, minLevel: 2, maxLevel: 2, givenShare: 0.3 },
];

/** Attempts per day before the best near miss (or the built-in puzzle) is used. */
const MAX_ATTEMPTS = 16;

/** A clue: a given cell, a horizontal sign or a vertical sign, by index. */
interface Clue {
  /** "g" given, "h" sign to the right, "v" sign below. */
  kind: "g" | "h" | "v";
  /** The cell (for "g") or the sign's index. */
  at: number;
}

/** The built-in puzzle, used only if every attempt fails (proven unique by the self-test). */
const FALLBACK: { given: number[]; h: BbSign[]; v: BbSign[]; solution: number[] } = {
  // Givens: -1 empty.
  given: [-1, 0, -1, -1, -1, 0, 0, 0, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, 0, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1, -1, 1, 1, -1, -1, -1],
  // Horizontal signs.
  h: [0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
  // Vertical signs.
  v: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // The answer.
  solution: [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1],
};

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
 * A random valid grid: three of each bit per row and column, never three equal in a line.
 *
 * @param rng the day's generator
 * @returns 36 bits, row by row
 */
function randomGrid(rng: Rng): number[] {
  // The grid being filled.
  const g: number[] = new Array(CELLS).fill(-1);
  // Bits per row and column so far: [row][bit], [col][bit].
  const rowCount = Array.from({ length: BB_N }, () => [0, 0]);
  // Columns.
  const colCount = Array.from({ length: BB_N }, () => [0, 0]);
  // Depth-first, cell by cell.
  const fill = (i: number): boolean => {
    // Every cell has a bit.
    if (i === CELLS) return true;
    // Its row and column.
    const r = Math.floor(i / BB_N), c = i % BB_N;
    // The two bits in a random order.
    const order = rng.chance(0.5) ? [0, 1] : [1, 0];
    // Each bit.
    for (const b of order) {
      // Three already in the row or column.
      if (rowCount[r][b] === 3 || colCount[c][b] === 3) continue;
      // Three in a row horizontally.
      if (c >= 2 && g[i - 1] === b && g[i - 2] === b) continue;
      // Three in a column.
      if (r >= 2 && g[i - BB_N] === b && g[i - 2 * BB_N] === b) continue;
      // Place it.
      g[i] = b;
      // Count it.
      rowCount[r][b]++;
      colCount[c][b]++;
      // Deeper.
      if (fill(i + 1)) return true;
      // Undo.
      rowCount[r][b]--;
      colCount[c][b]--;
      g[i] = -1;
    }
    // Neither bit fits.
    return false;
  };
  // From the first cell (a grid always exists).
  fill(0);
  // The grid.
  return g;
}

/**
 * Count the answers of a set of clues, stopping at a limit: backtracking cell by cell with every rule checked as
 * soon as it can be.
 *
 * @param given the given bits (-1 empty)
 * @param h horizontal signs
 * @param v vertical signs
 * @param limit stop after this many answers
 * @returns the answers found, at most `limit`
 */
export function solveAll(given: readonly number[], h: readonly BbSign[], v: readonly BbSign[], limit = 2): number[][] {
  // The answers.
  const found: number[][] = [];
  // The grid being filled.
  const g: number[] = new Array(CELLS).fill(-1);
  // Counts per row and column.
  const rowCount = Array.from({ length: BB_N }, () => [0, 0]);
  // Columns.
  const colCount = Array.from({ length: BB_N }, () => [0, 0]);
  // Depth-first.
  const go = (i: number): boolean => {
    // A full grid.
    if (i === CELLS) {
      // Kept.
      found.push(g.slice());
      // Stop at the limit.
      return found.length >= limit;
    }
    // Row and column.
    const r = Math.floor(i / BB_N), c = i % BB_N;
    // Each bit.
    for (let b = 0; b <= 1; b++) {
      // A given forces its bit.
      if (given[i] >= 0 && given[i] !== b) continue;
      // Counts.
      if (rowCount[r][b] === 3 || colCount[c][b] === 3) continue;
      // Three in a line.
      if (c >= 2 && g[i - 1] === b && g[i - 2] === b) continue;
      // Three in a column.
      if (r >= 2 && g[i - BB_N] === b && g[i - 2 * BB_N] === b) continue;
      // The sign to the left.
      if (c >= 1) {
        // Its kind.
        const s = h[r * (BB_N - 1) + c - 1];
        // Equal must match, different must not.
        if ((s === 1 && g[i - 1] !== b) || (s === 2 && g[i - 1] === b)) continue;
      }
      // The sign above.
      if (r >= 1) {
        // Its kind.
        const s = v[(r - 1) * BB_N + c];
        // Equal must match, different must not.
        if ((s === 1 && g[i - BB_N] !== b) || (s === 2 && g[i - BB_N] === b)) continue;
      }
      // Place.
      g[i] = b;
      // Count.
      rowCount[r][b]++;
      colCount[c][b]++;
      // Deeper; stop at the limit.
      if (go(i + 1)) return true;
      // Undo.
      rowCount[r][b]--;
      colCount[c][b]--;
      g[i] = -1;
    }
    // Exhausted.
    return false;
  };
  // From the first cell.
  go(0);
  // The answers.
  return found;
}

/** The twelve lines (six rows then six columns), each as its six cells. */
const LINES: number[][] = [
  // Rows.
  ...Array.from({ length: BB_N }, (_, r) => Array.from({ length: BB_N }, (_, c) => r * BB_N + c)),
  // Columns.
  ...Array.from({ length: BB_N }, (_, c) => Array.from({ length: BB_N }, (_, r) => r * BB_N + c)),
];

/** Every sign as [cell, cell, index into h or v, "h" or "v"]. */
const PAIRS: { a: number; b: number; at: number; kind: "h" | "v" }[] = [
  // Horizontal pairs.
  ...Array.from({ length: BB_N * (BB_N - 1) }, (_, k) => {
    // The row and the left column.
    const r = Math.floor(k / (BB_N - 1)), c = k % (BB_N - 1);
    // The pair.
    return { a: r * BB_N + c, b: r * BB_N + c + 1, at: k, kind: "h" as const };
  }),
  // Vertical pairs.
  ...Array.from({ length: (BB_N - 1) * BB_N }, (_, k) => ({ a: k, b: k + BB_N, at: k, kind: "v" as const })),
];

/** Where the basic rules broke, for a hint's reason (filled in by propagate when asked). */
interface BreakReport {
  /** The line the contradiction showed up in: 0 to 5 are rows, 6 to 11 columns (-1 until one does). */
  line: number;
  /** How many passes it took: fewer is easier to follow. */
  passes: number;
}

/**
 * The line a sign sits in: its row for a sign between side neighbours, its column for one between cells one above
 * the other.
 *
 * @param pr the sign's pair
 * @returns the line's index into LINES
 */
function lineOfPair(pr: { at: number; kind: "h" | "v" }): number {
  // A horizontal sign's row, or a vertical sign's column (after the six rows).
  return pr.kind === "h" ? Math.floor(pr.at / (BB_N - 1)) : BB_N + (pr.at % BB_N);
}

/**
 * Apply the basic rules to a partial grid until nothing changes.
 *   counts: a line with three of a bit takes the other bit everywhere else;
 *   pairs: two equal bits side by side (or with one gap) force the other bit next to (or between) them;
 *   signs: "=" copies a known bit, "×" flips it.
 *
 * @param g the partial grid (changed in place)
 * @param h horizontal signs
 * @param v vertical signs
 * @param why optional: filled in with where a contradiction showed up and after how many passes (for a hint)
 * @returns false on a contradiction
 */
function propagate(g: number[], h: readonly BbSign[], v: readonly BbSign[], why?: BreakReport): boolean {
  // Bounded passes; each pass that changes nothing ends the loop.
  for (let pass = 0; pass < CELLS + 1; pass++) {
    // Whether this pass changed anything.
    let changed = false;
    // A contradiction in a line: noted for a hint when asked, and reported.
    const fail = (line: number): boolean => {
      // Noted.
      if (why) {
        // The line.
        why.line = line;
        // The passes so far, this one included.
        why.passes = pass + 1;
      }
      // A contradiction.
      return false;
    };
    // Set a cell, or report a clash.
    const set = (i: number, b: number): boolean => {
      // Already that bit: fine.
      if (g[i] === b) return true;
      // The other bit: a contradiction.
      if (g[i] >= 0) return false;
      // Set.
      g[i] = b;
      // A change.
      changed = true;
      // Fine.
      return true;
    };
    // Each line, by its index.
    for (let L = 0; L < LINES.length; L++) {
      // Its cells.
      const line = LINES[L];
      // Its counts.
      const n0 = line.filter((i) => g[i] === 0).length, n1 = line.filter((i) => g[i] === 1).length;
      // Too many of a bit.
      if (n0 > 3 || n1 > 3) return fail(L);
      // Three of one bit: the rest take the other.
      if (n0 === 3 || n1 === 3) {
        // The bit to fill.
        const fillBit = n0 === 3 ? 1 : 0;
        // Every empty cell.
        for (const i of line) if (g[i] < 0 && !set(i, fillBit)) return fail(L);
      }
      // Each window of three.
      for (let k = 0; k + 2 < BB_N; k++) {
        // Its cells.
        const x = line[k], y = line[k + 1], z = line[k + 2];
        // Three equal is a contradiction.
        if (g[x] >= 0 && g[x] === g[y] && g[y] === g[z]) return fail(L);
        // Two known and equal force the third.
        if (g[x] >= 0 && g[x] === g[y] && g[z] < 0 && !set(z, 1 - g[x])) return fail(L);
        // Same, the other way.
        if (g[y] >= 0 && g[y] === g[z] && g[x] < 0 && !set(x, 1 - g[y])) return fail(L);
        // A gap between two equal bits.
        if (g[x] >= 0 && g[x] === g[z] && g[y] < 0 && !set(y, 1 - g[x])) return fail(L);
      }
    }
    // Each sign.
    for (const p of PAIRS) {
      // Its kind.
      const s = p.kind === "h" ? h[p.at] : v[p.at];
      // No sign, nothing to do.
      if (s === 0) continue;
      // Known bits.
      const ga = g[p.a], gb = g[p.b];
      // Both known: check it.
      if (ga >= 0 && gb >= 0) {
        // Equal must match, different must not.
        if ((s === 1) !== (ga === gb)) return fail(lineOfPair(p));
        // Fine.
        continue;
      }
      // One known: copy or flip it.
      if (ga >= 0 && !set(p.b, s === 1 ? ga : 1 - ga)) return fail(lineOfPair(p));
      // The other way round.
      if (gb >= 0 && !set(p.a, s === 1 ? gb : 1 - gb)) return fail(lineOfPair(p));
    }
    // A quiet pass ends it.
    if (!changed) return true;
  }
  // Settled.
  return true;
}

/**
 * The lowest logic level that solves a puzzle.
 *
 * @param given the given bits
 * @param h horizontal signs
 * @param v vertical signs
 * @returns 1 (basic rules), 2 (plus trying a bit and seeing the basic rules break) or 3 (deeper search)
 */
export function rateLevel(given: readonly number[], h: readonly BbSign[], v: readonly BbSign[]): number {
  // The working grid.
  const g = given.slice();
  // Basic rules.
  if (!propagate(g, h, v)) return 3;
  // Solved by them alone.
  if (g.every((b) => b >= 0)) return 1;
  // One-step trial, repeated while it makes progress (bounded by the cell count).
  for (let round = 0; round < CELLS; round++) {
    // Whether a trial settled a cell.
    let progress = false;
    // Each empty cell.
    for (let i = 0; i < CELLS && !progress; i++) {
      // Only empty cells.
      if (g[i] >= 0) continue;
      // Each bit.
      for (let b = 0; b <= 1 && !progress; b++) {
        // A copy with the trial bit.
        const t = g.slice();
        // The trial.
        t[i] = b;
        // The basic rules break: the other bit is forced.
        if (!propagate(t, h, v)) {
          // Set.
          g[i] = 1 - b;
          // Follow it through.
          if (!propagate(g, h, v)) return 3;
          // Progress.
          progress = true;
        }
      }
    }
    // Solved.
    if (g.every((b) => b >= 0)) return 2;
    // Stuck.
    if (!progress) return 3;
  }
  // Out of rounds.
  return 3;
}

/**
 * The puzzle a set of clues describes.
 *
 * @param clues the clues
 * @param solution the answer the clues are read from
 * @returns given, h and v arrays
 */
function render(clues: readonly Clue[], solution: readonly number[]): { given: number[]; h: BbSign[]; v: BbSign[] } {
  // Empty arrays.
  const given: number[] = new Array(CELLS).fill(-1);
  // Horizontal signs.
  const h: BbSign[] = new Array(BB_N * (BB_N - 1)).fill(0);
  // Vertical signs.
  const v: BbSign[] = new Array((BB_N - 1) * BB_N).fill(0);
  // Each clue.
  for (const cl of clues) {
    // A given takes the answer's bit.
    if (cl.kind === "g") given[cl.at] = solution[cl.at];
    // A horizontal sign: equal or different, read from the answer.
    else if (cl.kind === "h") {
      // Its cells.
      const r = Math.floor(cl.at / (BB_N - 1)), c = cl.at % (BB_N - 1);
      // Equal is 1, different is 2.
      h[cl.at] = solution[r * BB_N + c] === solution[r * BB_N + c + 1] ? 1 : 2;
    } else {
      // A vertical sign: equal is 1, different is 2.
      v[cl.at] = solution[cl.at] === solution[cl.at + BB_N] ? 1 : 2;
    }
  }
  // The arrays.
  return { given, h, v };
}

/**
 * Count the answers of a clue set.
 *
 * @param clues the clues
 * @param solution the answer they come from
 * @param limit the stop
 * @returns the answers found
 */
function solveClues(clues: readonly Clue[], solution: readonly number[], limit = 2): number[][] {
  // The arrays.
  const p = render(clues, solution);
  // Solved.
  return solveAll(p.given, p.h, p.v, limit);
}

/**
 * Pick a random clue the puzzle does not have yet, given or sign by the weekday's share.
 *
 * @param have the clues already in the puzzle
 * @param rng the generator
 * @param givenShare the chance it is a given
 * @returns a new clue
 */
function randomClue(have: readonly Clue[], rng: Rng, givenShare: number): Clue {
  // The keys already used.
  const used = new Set(have.map((c) => `${c.kind}${c.at}`));
  // Givens or signs first, by the share.
  const kind = rng.chance(givenShare) ? "g" : rng.chance(0.5) ? "h" : "v";
  // The free choices of that kind.
  const pool = (kind === "g" ? Array.from({ length: CELLS }, (_, i) => ({ kind, at: i })) : PAIRS.filter((p) => p.kind === kind).map((p) => ({ kind, at: p.at }))).filter((c) => !used.has(`${c.kind}${c.at}`)) as Clue[];
  // Any free clue at all, if that kind is used up.
  const all = [
    // Givens.
    ...Array.from({ length: CELLS }, (_, i) => ({ kind: "g" as const, at: i })),
    // Signs.
    ...PAIRS.map((p) => ({ kind: p.kind, at: p.at })),
  ].filter((c) => !used.has(`${c.kind}${c.at}`)) as Clue[];
  // From the preferred pool when it has any.
  return rng.pick(pool.length ? pool : all);
}

/**
 * One attempt: an answer, clues added until unique, then trimmed, then the weekday's extras.
 *
 * @param plan the weekday's plan
 * @param rng the generator
 * @returns the clue set and the answer, or null when the bounded loop ran out
 */
function attempt(plan: (typeof WEEKDAY_PLAN)[number], rng: Rng): { clues: Clue[]; solution: number[]; level: number } | null {
  // Step 1: the answer.
  const solution = randomGrid(rng);
  // Step 2: clues, starting from none.
  let clues: Clue[] = [];
  // Bounded.
  let unique = false;
  // At most one clue per cell and pair.
  for (let step = 0; step < CELLS + PAIRS.length && !unique; step++) {
    // Up to two answers.
    const found = solveClues(clues, solution, 2);
    // One answer: done.
    if (found.length === 1) {
      // Unique.
      unique = true;
      // Stop adding.
      break;
    }
    // The other answer.
    const other = found.find((f) => f.some((b, i) => b !== solution[i]));
    // None (cannot happen with a valid answer): give up.
    if (!other) return null;
    // Clues that break the other answer: cells where it differs, pairs whose relation differs.
    const breakers: Clue[] = [];
    // Givens.
    const cells: Clue[] = [];
    // Each cell.
    for (let i = 0; i < CELLS; i++) if (other[i] !== solution[i]) cells.push({ kind: "g", at: i });
    // Signs.
    const signs: Clue[] = [];
    // Each pair whose relation differs.
    for (const p of PAIRS) if ((other[p.a] === other[p.b]) !== (solution[p.a] === solution[p.b])) signs.push({ kind: p.kind, at: p.at });
    // The weekday's share decides which kind is tried first.
    breakers.push(...(rng.chance(plan.givenShare) || signs.length === 0 ? cells : signs));
    // One of them.
    clues.push(rng.pick(breakers));
  }
  // Ran out.
  if (!unique) return null;
  // Step 3: drop every clue the answer does not need, in a random order.
  for (const cl of rng.shuffle(clues)) {
    // Without it.
    const without = clues.filter((c) => c !== cl);
    // Still unique: drop it.
    if (solveClues(without, solution, 2).length === 1) clues = without;
  }
  // Both kinds appear: at least two givens.
  while (clues.filter((c) => c.kind === "g").length < 2) clues.push(randomClue(clues, rng, 1));
  // And at least four signs.
  while (clues.filter((c) => c.kind !== "g").length < 4) clues.push(randomClue(clues, rng, 0));
  // The weekday's extras.
  for (let k = 0; k < plan.extra; k++) clues.push(randomClue(clues, rng, plan.givenShare));
  // The puzzle as arrays.
  const first = render(clues, solution);
  // The rating.
  let level = rateLevel(first.given, first.h, first.v);
  // Too hard for the day: add clues until it is not (bounded).
  for (let k = 0; k < 12 && level > plan.maxLevel; k++) {
    // One more.
    clues.push(randomClue(clues, rng, plan.givenShare));
    // Re-rated.
    const r = render(clues, solution);
    // The new level.
    level = rateLevel(r.given, r.h, r.v);
  }
  // The attempt.
  return { clues, solution, level };
}

/**
 * The puzzle of a day (or, with a seed, a practice round).
 *
 * @param day the date as YYYY-MM-DD
 * @param seed optional seed for a non-daily round
 * @returns the puzzle
 */
export function generate(day: string, seed?: number): BbPuzzle {
  // The weekday and its plan.
  const weekday = weekdayOf(day);
  // The plan.
  const plan = WEEKDAY_PLAN[weekday];
  // The generator.
  const rng = seed === undefined ? dailyRng(BB_ID, day) : makeRng(seed);
  // The closest near miss.
  let best: { clues: Clue[]; solution: number[]; level: number; miss: number } | null = null;
  // Bounded attempts.
  for (let k = 0; k < MAX_ATTEMPTS; k++) {
    // One attempt.
    const got = attempt(plan, rng);
    // Failed: next.
    if (!got) continue;
    // Distance from the plan.
    const miss = got.level < plan.minLevel ? plan.minLevel - got.level : got.level > plan.maxLevel ? got.level - plan.maxLevel : 0;
    // In range, or the closest so far.
    if (!best || miss < best.miss) best = { ...got, miss };
    // In range: stop.
    if (miss === 0) break;
  }
  // None at all: the built-in puzzle.
  if (!best) {
    // The puzzle.
    return { day, weekday, given: FALLBACK.given.slice(), h: FALLBACK.h.slice(), v: FALLBACK.v.slice(), solution: FALLBACK.solution.slice(), level: rateLevel(FALLBACK.given, FALLBACK.h, FALLBACK.v), fallback: true };
  }
  // The arrays.
  const r = render(best.clues, best.solution);
  // The puzzle.
  return { day, weekday, given: r.given, h: r.h, v: r.v, solution: best.solution.slice(), level: best.level, fallback: false };
}

/**
 * The cells that break a rule on a board, and the signs that are broken.
 *
 * @param p the puzzle
 * @param board one value per cell: -1 empty, 0 or 1
 * @returns the cells in error and the broken signs ("h12", "v3")
 */
export function ruleErrors(p: BbPuzzle, board: readonly number[]): { cells: Set<number>; signs: Set<string> } {
  // The bad cells.
  const cells = new Set<number>();
  // The bad signs.
  const signs = new Set<string>();
  // Each line.
  for (const line of LINES) {
    // Each bit.
    for (let b = 0; b <= 1; b++) {
      // Its cells in this line.
      const has = line.filter((i) => board[i] === b);
      // More than three: all of them are flagged.
      if (has.length > 3) for (const i of has) cells.add(i);
    }
    // Each window of three.
    for (let k = 0; k + 2 < BB_N; k++) {
      // Its cells.
      const x = line[k], y = line[k + 1], z = line[k + 2];
      // Three equal bits.
      if (board[x] >= 0 && board[x] === board[y] && board[y] === board[z]) {
        // All three flagged.
        cells.add(x);
        cells.add(y);
        cells.add(z);
      }
    }
  }
  // Each sign.
  for (const pr of PAIRS) {
    // Its kind.
    const s = pr.kind === "h" ? p.h[pr.at] : p.v[pr.at];
    // Only signs with both bits filled can break.
    if (s === 0 || board[pr.a] < 0 || board[pr.b] < 0) continue;
    // Broken when the relation is wrong.
    if ((s === 1) !== (board[pr.a] === board[pr.b])) {
      // The sign.
      signs.add(`${pr.kind}${pr.at}`);
      // Its two cells.
      cells.add(pr.a);
      cells.add(pr.b);
    }
  }
  // The errors.
  return { cells, signs };
}

/**
 * Whether a board is solved: full and breaking no rule (the answer is unique, so that is the answer).
 *
 * @param p the puzzle
 * @param board the board
 * @returns true when solved
 */
export function isSolved(p: BbPuzzle, board: readonly number[]): boolean {
  // Full.
  if (board.some((b) => b < 0)) return false;
  // No broken rule.
  const e = ruleErrors(p, board);
  // Clean.
  return e.cells.size === 0 && e.signs.size === 0;
}

/**
 * What "Check" marks: filled cells that differ from the answer.
 *
 * @param p the puzzle
 * @param board the board
 * @returns the wrong cells
 */
export function checkErrors(p: BbPuzzle, board: readonly number[]): Set<number> {
  // Each filled, wrong cell.
  return new Set(board.map((b, i) => (b >= 0 && b !== p.solution[i] ? i : -1)).filter((i) => i >= 0));
}

/** A hint: the next step that reasoning forces on a board, what it changes, and why (see nextHint). */
export interface BbHint {
  /**
   * The rule that found it: "mistake" (the board has a wrong bit), "sign" (an = or × next to a known bit), "pair"
   * (two equal bits side by side), "gap" (a cell between two equal bits), "count" (a line already holds three of a
   * bit), "trial" (one bit here soon breaks a rule), or "answer" (no rule applies, so the step is read from the answer).
   */
  rule: "mistake" | "sign" | "pair" | "gap" | "count" | "trial" | "answer";
  /** The cells the hint settles, with their bits; for a mistake, the cells to empty (bit -1). */
  set: { i: number; v: number }[];
  /** The cells the reason is about: the pair, the two around the gap, the known neighbour, the line. */
  area: number[];
  /** The line the reason names: 0 to 5 are rows, 6 to 11 columns (-1 when none). */
  line: number;
  /** The bit the reason is about: the pair's, the gap's, the known neighbour's, the counted one, the trial's (-1 when none). */
  bit: number;
  /** For a sign: 1 equal, 2 different (0 for the other rules). */
  sign: BbSign;
}

/**
 * The next step reasoning forces on a board, simplest rule first, from the rules the rater uses (rateLevel): a wrong
 * bit first; then a sign next to a known bit; two equal bits side by side; a cell between two equal bits; a line
 * with three of a bit; and then the one-step trial (a bit that makes the basic rules break, the quickest break
 * first). Only when no rule applies is the step read from the answer.
 *
 * @param p the puzzle
 * @param board one value per cell: -1 empty, 0 or 1
 * @returns the hint, or null when the board is full and right
 */
export function nextHint(p: BbPuzzle, board: readonly number[]): BbHint | null {
  // Mistakes first: every wrong bit, in reading order.
  const wrong = [...checkErrors(p, board)].sort((a, b) => a - b);
  // Pointed at before anything else.
  if (wrong.length) return { rule: "mistake", set: wrong.map((i) => ({ i, v: -1 })), area: [], line: -1, bit: -1, sign: 0 };
  // Full and right: solved.
  if (board.every((b) => b >= 0)) return null;
  // Signs: a known bit across an = is copied, across a × flipped.
  for (const pr of PAIRS) {
    // The sign.
    const s = pr.kind === "h" ? p.h[pr.at] : p.v[pr.at];
    // None here.
    if (s === 0) continue;
    // The two bits.
    const ga = board[pr.a], gb = board[pr.b];
    // One known, the other empty: the empty one follows.
    if (ga >= 0 && gb < 0) return { rule: "sign", set: [{ i: pr.b, v: s === 1 ? ga : 1 - ga }], area: [pr.a], line: lineOfPair(pr), bit: ga, sign: s };
    // The other way round.
    if (gb >= 0 && ga < 0) return { rule: "sign", set: [{ i: pr.a, v: s === 1 ? gb : 1 - gb }], area: [pr.b], line: lineOfPair(pr), bit: gb, sign: s };
  }
  // Pairs: two equal bits side by side force the other bit on either side of them.
  for (let L = 0; L < LINES.length; L++) {
    // The line's cells.
    const line = LINES[L];
    // Each window of three.
    for (let k = 0; k + 2 < BB_N; k++) {
      // Its cells.
      const x = line[k], y = line[k + 1], z = line[k + 2];
      // A pair, then an empty cell.
      if (board[x] >= 0 && board[x] === board[y] && board[z] < 0) return { rule: "pair", set: [{ i: z, v: 1 - board[x] }], area: [x, y], line: L, bit: board[x], sign: 0 };
      // An empty cell, then a pair.
      if (board[y] >= 0 && board[y] === board[z] && board[x] < 0) return { rule: "pair", set: [{ i: x, v: 1 - board[y] }], area: [y, z], line: L, bit: board[y], sign: 0 };
    }
  }
  // Gaps: a cell between two equal bits takes the other bit.
  for (let L = 0; L < LINES.length; L++) {
    // The line's cells.
    const line = LINES[L];
    // Each window of three.
    for (let k = 0; k + 2 < BB_N; k++) {
      // Its cells.
      const x = line[k], y = line[k + 1], z = line[k + 2];
      // Equal ends, empty middle.
      if (board[x] >= 0 && board[x] === board[z] && board[y] < 0) return { rule: "gap", set: [{ i: y, v: 1 - board[x] }], area: [x, z], line: L, bit: board[x], sign: 0 };
    }
  }
  // Counts: a line with three of a bit takes the other bit in every empty cell.
  for (let L = 0; L < LINES.length; L++) {
    // The line's cells.
    const line = LINES[L];
    // Its empty cells.
    const empty = line.filter((i) => board[i] < 0);
    // Nothing to fill.
    if (!empty.length) continue;
    // Each bit.
    for (let b = 0; b <= 1; b++) {
      // Three already: the rest are the other bit.
      if (line.filter((i) => board[i] === b).length === 3) return { rule: "count", set: empty.map((i) => ({ i, v: 1 - b })), area: line.filter((i) => board[i] === b), line: L, bit: b, sign: 0 };
    }
  }
  // The one-step trial: a bit that makes the basic rules break forces the other; the quickest break is the clearest.
  let best: { i: number; b: number; line: number; passes: number } | null = null;
  // Each empty cell, until a trial breaks in the first pass (nothing is quicker than that).
  for (let i = 0; i < CELLS && !(best && best.passes === 1); i++) {
    // Only empty cells.
    if (board[i] >= 0) continue;
    // Each bit.
    for (let b = 0; b <= 1; b++) {
      // A copy with the trial bit.
      const t = board.slice();
      // The trial.
      t[i] = b;
      // Where it breaks, if it does.
      const why: BreakReport = { line: -1, passes: 0 };
      // Broken: a candidate, kept when it breaks sooner than the best so far.
      if (!propagate(t, p.h, p.v, why) && (!best || why.passes < best.passes)) best = { i, b, line: why.line, passes: why.passes };
    }
  }
  // A trial settles a cell.
  if (best) return { rule: "trial", set: [{ i: best.i, v: 1 - best.b }], area: LINES[best.line] ?? [], line: best.line, bit: best.b, sign: 0 };
  // No rule applies: the first empty cell, read from the answer.
  const i = board.findIndex((b) => b < 0);
  // Labelled so.
  return { rule: "answer", set: [{ i, v: p.solution[i] }], area: [], line: -1, bit: -1, sign: 0 };
}

/**
 * Walk a puzzle from its givens by hints alone (the self-test's proof that Hint always leads to the answer).
 *
 * @param p the puzzle
 * @returns how many hints it took, how many had to fall back to the answer, the rules used, and any problem
 */
export function hintWalk(p: BbPuzzle): { steps: number; fallbacks: number; rules: Record<string, number>; problem: string | null } {
  // The board: the givens.
  const board = p.given.slice();
  // Counters.
  let steps = 0, fallbacks = 0;
  // Hints by rule.
  const rules: Record<string, number> = {};
  // Bounded: every hint fills at least one cell.
  for (let guard = 0; guard <= CELLS; guard++) {
    // Full: solved (every hinted bit was checked against the answer on the way).
    if (board.every((b) => b >= 0)) return { steps, fallbacks, rules, problem: isSolved(p, board) ? null : "the walk filled a grid that breaks a rule" };
    // The hint.
    const h = nextHint(p, board);
    // None on an unfinished board.
    if (!h) return { steps, fallbacks, rules, problem: "no hint on an unfinished board" };
    // A correct board has no mistakes.
    if (h.rule === "mistake") return { steps, fallbacks, rules, problem: "a hint saw a mistake on a correct board" };
    // Counted.
    rules[h.rule] = (rules[h.rule] ?? 0) + 1;
    // A fallback is counted too.
    if (h.rule === "answer") fallbacks++;
    // Nothing to do would loop forever.
    if (!h.set.length) return { steps, fallbacks, rules, problem: `an empty ${h.rule} hint` };
    // Every hinted bit agrees with the answer, on an empty cell.
    if (h.set.some((x) => board[x.i] >= 0 || x.v !== p.solution[x.i])) return { steps, fallbacks, rules, problem: `a ${h.rule} hint disagrees with the answer` };
    // Applied.
    for (const x of h.set) board[x.i] = x.v;
    // One more step.
    steps++;
  }
  // Ran out of steps.
  return { steps, fallbacks, rules, problem: "the walk did not finish" };
}

/**
 * Whether a puzzle is well formed: lengths, value ranges, givens and signs agreeing with a valid answer.
 *
 * @param p the puzzle
 * @returns a problem, or null
 */
export function wellFormed(p: BbPuzzle): string | null {
  // Lengths.
  if (p.given.length !== CELLS || p.solution.length !== CELLS || p.h.length !== 30 || p.v.length !== 30) return "wrong lengths";
  // Ranges.
  if (p.given.some((b) => b < -1 || b > 1) || p.solution.some((b) => b !== 0 && b !== 1)) return "value out of range";
  // Signs in range.
  if ([...p.h, ...p.v].some((s) => s < 0 || s > 2)) return "sign out of range";
  // Givens agree with the answer.
  if (p.given.some((b, i) => b >= 0 && b !== p.solution[i])) return "a given disagrees with the answer";
  // The answer obeys every rule.
  if (!isSolved(p, p.solution)) return "answer breaks a rule";
  // At least two givens and four signs, so both mechanics appear.
  if (p.given.filter((b) => b >= 0).length < 2 || [...p.h, ...p.v].filter((s) => s > 0).length < 4) return "too few givens or signs";
  // All well.
  return null;
}

/**
 * The self-test: 400 days from 2026-11-03, plus the built-in puzzle. Each day's grid is also walked from its givens
 * by hints alone (every hinted bit agreeing with the answer, none read from the answer), and a wrong bit is pointed
 * out before anything else.
 *
 * @returns the report (hint walks included in the count), with timing and the hints' rules
 */
export function selfTest(): SelfTestReport & { timing: { worstMs: number; meanMs: number; fallbacks: number; levels: Record<string, number>; clues: [number, number]; hints: { walks: number; steps: number; fallbacks: number; rules: Record<string, number> } } } {
  // Problems.
  const failures: string[] = [];
  // Timing.
  let worst = 0, sum = 0, fallbacks = 0;
  // Levels by weekday.
  const levels: Record<string, number> = {};
  // The hint walks: how many finished, their steps, fallbacks to the answer, and the rules used.
  const hints = { walks: 0, steps: 0, fallbacks: 0, rules: {} as Record<string, number> };
  // Fewest and most clues.
  let minClues = Infinity, maxClues = 0;
  // The built-in puzzle must be unique.
  const fb = solveAll(FALLBACK.given, FALLBACK.h, FALLBACK.v, 2);
  // Exactly one answer, equal to the stored one.
  if (fb.length !== 1 || fb[0].join() !== FALLBACK.solution.join()) failures.push("built-in puzzle is not uniquely solved by its answer");
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
    // Solved independently.
    const found = solveAll(a.given, a.h, a.v, 2);
    // Exactly one.
    if (found.length !== 1) failures.push(`${day}: ${found.length} answers`);
    // The generator's.
    else if (found[0].join() !== a.solution.join()) failures.push(`${day}: solver and generator disagree`);
    // The rules page promises the basic rules plus one-step trials: anything deeper fails.
    if (a.level > 2) failures.push(`${day}: needs a deeper search (level ${a.level})`);
    // Fallbacks.
    if (a.fallback) fallbacks++;
    // Levels.
    const key = `wd${a.weekday}:L${a.level}`;
    // Counted.
    levels[key] = (levels[key] ?? 0) + 1;
    // Clue count.
    const n = a.given.filter((b) => b >= 0).length + [...a.h, ...a.v].filter((s) => s > 0).length;
    // Range.
    minClues = Math.min(minClues, n);
    maxClues = Math.max(maxClues, n);
    // The hint walk from the givens.
    const walk = hintWalk(a);
    // A walk that stalls, or a hint that disagrees with the answer.
    if (walk.problem) failures.push(`${day}: hint walk: ${walk.problem}`);
    // A step no rule settles breaks the promise of the rules page.
    else if (walk.fallbacks) failures.push(`${day}: hint walk needed the answer ${walk.fallbacks} time(s)`);
    // Counted.
    else hints.walks++;
    // Steps.
    hints.steps += walk.steps;
    // Fallbacks.
    hints.fallbacks += walk.fallbacks;
    // Rules.
    for (const [rule, k] of Object.entries(walk.rules)) hints.rules[rule] = (hints.rules[rule] ?? 0) + k;
    // A wrong bit in the first empty cell.
    const bad = a.given.slice();
    // The cell.
    const at = bad.findIndex((b) => b < 0);
    // The wrong bit.
    bad[at] = 1 - a.solution[at];
    // The hint must point at it, and at nothing else.
    const mh = nextHint(a, bad);
    // Checked.
    if (!mh || mh.rule !== "mistake" || mh.set.length !== 1 || mh.set[0].i !== at) failures.push(`${day}: a hint did not point at the mistake first`);
  }
  // The report: the puzzles, the built-in one, and the hint walks that finished.
  return { checked: SELFTEST_DAYS + 1 + hints.walks, failures, timing: { worstMs: worst, meanMs: sum / SELFTEST_DAYS, fallbacks, levels, clues: [minClues, maxClues], hints } };
}
