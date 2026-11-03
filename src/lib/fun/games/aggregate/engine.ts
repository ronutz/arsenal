// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/aggregate/engine.ts
// ----------------------------------------------------------------------------
// AGGREGATE, the rules (PRIME 03/11/2026): a sliding-tile game about route
// summarisation.
//
// A 4x4 board of tiles, each a real IPv4 prefix inside one private /16. A move
// slides every tile as far as it goes in one direction. Two tiles that meet
// merge ONLY when they are siblings: the same length, side by side in the
// address space and aligned, so that together they are exactly their parent
// prefix (10.0.0.0/26 + 10.0.0.64/26 = 10.0.0.0/25). Two /26s that are not
// siblings (10.0.0.64/26 and 10.0.0.128/26) block each other, which is the
// lesson: equal length is not enough to summarise. A tile made by a merge does
// not merge again in the same move, and tiles closest to the wall merge first.
//
// After every move that changes the board, a new /26 or /27 appears in an
// empty cell. Every prefix on the board covers its own addresses (no two tiles
// overlap, so no prefix is ever on the board twice), which also guarantees a
// sibling for the new tile can still appear: whatever overlaps its sibling's
// space is smaller and can merge up into it. Seven times in ten, when the
// board holds a lone /26 or /27 (its sibling's space empty), the new tile is
// that sibling, dropped in the lone tile's row or column; otherwise it comes
// from the lowest /24 of the /16 that still has free space, with a bias
// towards exact siblings. The rates were set by playing 400 daily rounds with
// a greedy bot (see NOTES): most reach a /24, a third a /23, a few a /22.
//
// Score: every merge adds the size of the block it makes (a /25 adds 128), so
// the score is the number of addresses summarised. The game ends when no move
// changes the board.
//
// Randomness: each spawn draws from its own generator, derived from the round's
// source and the spawn's number. For the daily challenge that is
// dailyRng("aggregate", day, "s<k>"), so everyone who plays the same moves on
// the same UTC day sees the same tiles; free play uses a seed the page picks.
// The state is plain data, so it can be saved and resumed as it is.
// ============================================================================

// The seeded generators and the day arithmetic.
import { addDays, dailyRng, fnv1a, LAUNCH_DAY, makeRng, type Rng } from "../../daily";
// The self-test report shape.
import type { SelfTestReport } from "../../registry";
// The site's CIDR engine, the independent check of the merge rule.
import { aggregate as cidrAggregate } from "../../../tools/cidr/compute";

/** The game's stable id. */
export const GAME_ID = "aggregate";

/** The board is SIDE x SIDE. */
export const SIDE = 4;

/** Cells on the board. */
export const CELLS = SIDE * SIDE;

/** A move direction. */
export type Dir = "left" | "right" | "up" | "down";

/** The four directions. */
export const DIRS: readonly Dir[] = ["left", "right", "up", "down"];

/** One tile: a prefix, with an id that stays with it while it slides (for the page's keys). */
export interface Tile {
  /** A stable id within the round. */
  id: number;
  /** The network address, unsigned 32-bit. */
  net: number;
  /** The prefix length. */
  len: number;
}

/** Where a round's randomness comes from. */
export type Source = { kind: "daily"; day: string } | { kind: "free"; seed: number };

/** A round, as plain data. */
export interface State {
  /** The randomness source. */
  source: Source;
  /** The /16 the round plays in (its network address). */
  base: number;
  /** The board, row by row; null is an empty cell. */
  cells: (Tile | null)[];
  /** Addresses summarised so far. */
  score: number;
  /** The shortest prefix length on the board so far (the largest block). */
  bestLen: number;
  /** How many tiles have been spawned (the next spawn's number). */
  spawned: number;
  /** The next tile id. */
  nextId: number;
  /** Moves that changed the board. */
  moves: number;
  /** True when no move changes the board. */
  over: boolean;
  /** Cells that received a merged tile on the last move. */
  merged: number[];
  /** The cell of the last new tile, or -1. */
  spawnedAt: number;
}

/** The outcome of a move. */
export interface MoveResult {
  /** The state after the move (and its spawn). */
  state: State;
  /** Whether the board changed (an unchanged board gets no new tile). */
  changed: boolean;
  /** The addresses this move summarised. */
  gain: number;
  /** The blocks this move made, with the pairs they came from. */
  merges: { from: [Tile, Tile]; to: Tile }[];
  /** The new tile, if any. */
  spawn: Tile | null;
}

// ---- Prefix arithmetic -------------------------------------------------------

/**
 * The number of addresses in a prefix length.
 *
 * @param len 0 to 32
 * @returns 2^(32 - len)
 */
export function blockSize(len: number): number {
  // A power of two.
  return Math.pow(2, 32 - len);
}

/**
 * Whether two tiles are siblings: same length, and their union is exactly the parent prefix.
 *
 * Two aligned blocks of one length are siblings exactly when their addresses differ only in the bit that the
 * parent prefix gives up, so their XOR is the block size.
 *
 * @param a one tile
 * @param b the other
 * @returns true when they merge
 */
export function areSiblings(a: Tile, b: Tile): boolean {
  // Different lengths never merge; a /0 has no parent.
  if (a.len !== b.len || a.len <= 0) return false;
  // The difference, unsigned.
  return ((a.net ^ b.net) >>> 0) === blockSize(a.len);
}

/**
 * The parent of two siblings.
 *
 * @param a one sibling
 * @param b the other
 * @param id the new tile's id
 * @returns the merged tile
 */
function parentOf(a: Tile, b: Tile, id: number): Tile {
  // The lower address, one bit shorter.
  return { id, net: Math.min(a.net, b.net), len: a.len - 1 };
}

/**
 * An address in dotted-quad form.
 *
 * @param n an unsigned 32-bit number
 * @returns "a.b.c.d"
 */
export function dotted(n: number): string {
  // Unsigned.
  const u = n >>> 0;
  // The four octets.
  return [(u >>> 24) & 255, (u >>> 16) & 255, (u >>> 8) & 255, u & 255].join(".");
}

/**
 * A tile as text: "10.0.1.64/26".
 *
 * @param t the tile
 * @returns its prefix
 */
export function tileText(t: Tile): string {
  // Address, slash, length.
  return `${dotted(t.net)}/${t.len}`;
}

/**
 * Whether two blocks overlap.
 *
 * @param aNet one block's network
 * @param aLen its length
 * @param bNet the other's network
 * @param bLen its length
 * @returns true when they share any address
 */
function overlaps(aNet: number, aLen: number, bNet: number, bLen: number): boolean {
  // Prefixes are nested or disjoint: they overlap when one's range starts inside the other's.
  return aNet < bNet + blockSize(bLen) && bNet < aNet + blockSize(aLen);
}

// ---- Randomness --------------------------------------------------------------

/**
 * The generator for one draw of a round.
 *
 * @param source the round's source
 * @param word which draw ("base", or "s<k>" for the k-th spawn)
 * @returns a generator
 */
function rngFor(source: Source, word: string): Rng {
  // The daily challenge: the day's generator with the draw as its variant.
  if (source.kind === "daily") return dailyRng(GAME_ID, source.day, word);
  // Free play: the page's seed and the draw, hashed together.
  return makeRng(fnv1a(`${GAME_ID}|free|${source.seed}|${word}`));
}

/**
 * The /16 a round plays in: 10.0-63.0.0, 172.16-31.0.0 or 192.168.0.0 (all RFC 1918).
 *
 * @param source the round's source
 * @returns the /16's network address
 */
function pickBase(source: Source): number {
  // Its own generator.
  const rng = rngFor(source, "base");
  // Mostly 10/8, which keeps the tiles' text short.
  const roll = rng.next();
  // 10.x.0.0/16 with x from 0 to 63.
  if (roll < 0.6) return 10 * 16777216 + rng.range(0, 63) * 65536;
  // 172.x.0.0/16 with x from 16 to 31.
  if (roll < 0.85) return 172 * 16777216 + rng.range(16, 31) * 65536;
  // 192.168.0.0/16.
  return 192 * 16777216 + 168 * 65536;
}

// ---- Spawning ----------------------------------------------------------------

/** The spawn window's prefix length: new tiles come from the lowest window of this size with free space. */
const WIN_LEN = 24;

/** The window's size in addresses. */
const WINDOW = blockSize(WIN_LEN);

/** How many /27 units a window holds. */
const UNITS = WINDOW / 32;

/** The mask with every unit of a window covered. */
const FULL = UNITS === 32 ? 0xffffffff : (1 << UNITS) - 1;

/** How often a new tile completes the pair of a lone /26 or /27 already on the board (when there is one). */
const PAIR_CHANCE = 0.7;

/** The sibling bias: a free slot whose exact sibling is on the board is this many times as likely. */
const SIB_WEIGHT = 4;

/**
 * Which /27 units of a spawn window are covered by tiles, as a bit mask.
 *
 * @param tiles the tiles on the board
 * @param win the window's network address
 * @returns bit u set when unit u (addresses win + 32u to win + 32u + 31) is covered
 */
function coveredUnits(tiles: Tile[], win: number): number {
  // Nothing covered yet.
  let mask = 0;
  // Each tile.
  for (const t of tiles) {
    // Only tiles touching the window.
    if (!overlaps(t.net, t.len, win, WIN_LEN)) continue;
    // A tile as large as the window or larger covers all of it.
    if (t.len <= WIN_LEN) return FULL;
    // The first unit it covers.
    const first = (t.net - win) / 32;
    // How many units it covers.
    const count = blockSize(t.len) / 32;
    // Each of them.
    for (let u = first; u < first + count; u++) mask |= 1 << u;
  }
  // The mask, unsigned.
  return mask >>> 0;
}

/**
 * Spawn the next tile into a state (in place); returns the tile, or null when there is no empty cell or no room.
 *
 * @param s the state to change
 * @returns the new tile, or null
 */
function spawnInto(s: State): Tile | null {
  // The empty cells, in board order.
  const empty: number[] = [];
  // Each cell.
  for (let i = 0; i < CELLS; i++) if (!s.cells[i]) empty.push(i);
  // A full board gets nothing.
  if (empty.length === 0) return null;
  // This spawn's generator.
  const rng = rngFor(s.source, `s${s.spawned}`);
  // Counted whether or not it finds room, so the sequence never depends on luck elsewhere.
  s.spawned++;
  // The tiles on the board.
  const tiles = s.cells.filter((c): c is Tile => c !== null);
  // Lone /26 and /27 tiles: their sibling's space is entirely free (no tile overlaps it).
  const lone = tiles.filter((t) => t.len >= 26 && !tiles.some((o) => overlaps(o.net, o.len, (t.net ^ blockSize(t.len)) >>> 0, t.len)));
  // Most of the time the next tile completes a lone tile's pair, in that tile's row or column.
  if (lone.length > 0 && rng.chance(PAIR_CHANCE)) {
    // The lone tile.
    const mate = lone[rng.int(lone.length)];
    // Its cell.
    const at = s.cells.indexOf(mate);
    // Empty cells in the same row or column, where one slide can bring the two together.
    const near = empty.filter((i) => Math.floor(i / SIDE) === Math.floor(at / SIDE) || i % SIDE === at % SIDE);
    // Any empty cell when the row and column are full.
    const pool = near.length > 0 ? near : empty;
    // The cell.
    const cell = pool[rng.int(pool.length)];
    // The sibling.
    const tile: Tile = { id: s.nextId++, net: (mate.net ^ blockSize(mate.len)) >>> 0, len: mate.len };
    // Placed.
    s.cells[cell] = tile;
    // Remembered for the page's pulse.
    s.spawnedAt = cell;
    // The largest block follows.
    s.bestLen = Math.min(s.bestLen, tile.len);
    // The new tile.
    return tile;
  }
  // The lowest window with a free /27, and its coverage.
  let win = -1;
  // Its covered units.
  let covered = 0;
  // The windows of the /16, lowest first.
  for (let w = 0; w < 65536 / WINDOW; w++) {
    // The window's address.
    const addr = s.base + w * WINDOW;
    // Its coverage.
    const c = coveredUnits(tiles, addr);
    // Some room.
    if (c !== FULL) {
      // This window.
      win = addr;
      // Its coverage.
      covered = c;
      // Stop at the first.
      break;
    }
  }
  // The whole /16 summarised: nothing left to spawn.
  if (win < 0) return null;
  // The free slots: /26s (two free units) and /27s (one free unit), each with a weight.
  const slots: { net: number; len: number; w: number }[] = [];
  // Every /27 unit.
  for (let u = 0; u < UNITS; u++) {
    // A free unit is a /27 slot.
    if ((covered & (1 << u)) === 0) slots.push({ net: win + u * 32, len: 27, w: 1 });
    // An even unit and its neighbour, both free, are a /26 slot.
    if (u % 2 === 0 && (covered & (3 << u)) === 0) slots.push({ net: win + u * 32, len: 26, w: 1 });
  }
  // A slot whose exact sibling is on the board is four times as likely: it can merge as soon as they meet.
  for (const slot of slots) {
    // The sibling's network.
    const sib = (slot.net ^ blockSize(slot.len)) >>> 0;
    // On the board with the same length.
    if (tiles.some((t) => t.len === slot.len && t.net === sib)) slot.w = SIB_WEIGHT;
  }
  // The cell.
  const cell = empty[rng.int(empty.length)];
  // The total weight.
  const total = slots.reduce((sum, x) => sum + x.w, 0);
  // A weighted draw.
  let roll = rng.next() * total;
  // The chosen slot, the last one if rounding runs past the end.
  let chosen = slots[slots.length - 1];
  // Walk the weights.
  for (const slot of slots) {
    // Inside this slot's share.
    if (roll < slot.w) {
      // Chosen.
      chosen = slot;
      // Stop.
      break;
    }
    // Past it.
    roll -= slot.w;
  }
  // The tile.
  const tile: Tile = { id: s.nextId++, net: chosen.net, len: chosen.len };
  // Placed.
  s.cells[cell] = tile;
  // Remembered for the page's pulse.
  s.spawnedAt = cell;
  // The largest block follows (a /26 spawn is larger than the /27 start).
  s.bestLen = Math.min(s.bestLen, tile.len);
  // The new tile.
  return tile;
}

// ---- Moving ------------------------------------------------------------------

/**
 * The cell indexes of each line in a direction, the cell nearest the wall first.
 *
 * @param dir the direction
 * @returns four lines of four cell indexes
 */
export function linesFor(dir: Dir): number[][] {
  // The lines.
  const out: number[][] = [];
  // Each row or column.
  for (let k = 0; k < SIDE; k++) {
    // Its four cells, from the wall the tiles slide towards.
    const line: number[] = [];
    // Each position along it.
    for (let i = 0; i < SIDE; i++) {
      // Left: along the row from column 0; right: from column 3; up: down the column from row 0; down: from row 3.
      if (dir === "left") line.push(k * SIDE + i);
      else if (dir === "right") line.push(k * SIDE + (SIDE - 1 - i));
      else if (dir === "up") line.push(i * SIDE + k);
      else line.push((SIDE - 1 - i) * SIDE + k);
    }
    // One line.
    out.push(line);
  }
  // All four.
  return out;
}

/**
 * Slide one line towards its first cell, merging siblings once per move.
 *
 * @param line the tiles of the line, the wall end first (null for empty)
 * @param nextId the id the first merged tile gets
 * @returns the new line, the gain, the merges and the next free id
 */
export function slideLine(
  line: (Tile | null)[],
  nextId: number,
): { line: (Tile | null)[]; gain: number; merges: { from: [Tile, Tile]; to: Tile }[]; nextId: number } {
  // The tiles, gaps closed.
  const tiles = line.filter((t): t is Tile => t !== null);
  // The result so far, each with whether it was made by a merge in this move.
  const out: { tile: Tile; merged: boolean }[] = [];
  // Addresses summarised.
  let gain = 0;
  // The merges.
  const merges: { from: [Tile, Tile]; to: Tile }[] = [];
  // The next id.
  let id = nextId;
  // Each tile, from the wall outwards.
  for (const t of tiles) {
    // The tile it would meet.
    const last = out[out.length - 1];
    // It merges with a sibling that was not itself made by a merge in this move.
    if (last && !last.merged && areSiblings(last.tile, t)) {
      // The parent.
      const parent = parentOf(last.tile, t, id++);
      // Recorded.
      merges.push({ from: [last.tile, t], to: parent });
      // Its size is the gain.
      gain += blockSize(parent.len);
      // In place of the tile it met.
      out[out.length - 1] = { tile: parent, merged: true };
    } else {
      // Otherwise it stops against what is there.
      out.push({ tile: t, merged: false });
    }
  }
  // The new line: the tiles, then empty cells.
  const result: (Tile | null)[] = out.map((x) => x.tile);
  // Padded to the line's length.
  while (result.length < line.length) result.push(null);
  // Everything the caller needs.
  return { line: result, gain, merges, nextId: id };
}

/**
 * Slide the whole board, without spawning.
 *
 * @param s the state (not changed)
 * @param dir the direction
 * @returns the new cells, whether they changed, the gain, the merges, the merged cells and the next id
 */
function slideBoard(s: State, dir: Dir) {
  // A copy of the board.
  const cells = s.cells.slice();
  // Gain, merges and merged cells.
  let gain = 0;
  // The merges.
  const merges: { from: [Tile, Tile]; to: Tile }[] = [];
  // Cells that hold a merged tile.
  const merged: number[] = [];
  // The next id.
  let nextId = s.nextId;
  // Whether anything moved.
  let changed = false;
  // Each line.
  for (const idx of linesFor(dir)) {
    // Slid.
    const r = slideLine(idx.map((i) => s.cells[i]), nextId);
    // The ids move on.
    nextId = r.nextId;
    // Totals.
    gain += r.gain;
    // Merges.
    merges.push(...r.merges);
    // Written back.
    idx.forEach((cell, k) => {
      // The new occupant.
      const t = r.line[k];
      // A change when the occupant differs.
      if ((t?.id ?? -1) !== (s.cells[cell]?.id ?? -1)) changed = true;
      // Stored.
      cells[cell] = t;
      // A merged tile's cell, for the pulse.
      if (t && r.merges.some((m) => m.to.id === t.id)) merged.push(cell);
    });
  }
  // The result.
  return { cells, changed, gain, merges, merged, nextId };
}

/**
 * Whether any move would change the board.
 *
 * @param s the state
 * @returns true when the game can go on
 */
export function canMove(s: State): boolean {
  // Any direction that changes something.
  return DIRS.some((d) => slideBoard(s, d).changed);
}

/**
 * A new round: an empty board in a private /16 with two tiles.
 *
 * @param source where its randomness comes from
 * @returns the state
 */
export function newGame(source: Source): State {
  // The empty state.
  const s: State = {
    source,
    base: pickBase(source),
    cells: Array.from({ length: CELLS }, () => null),
    score: 0,
    bestLen: 27,
    spawned: 0,
    nextId: 1,
    moves: 0,
    over: false,
    merged: [],
    spawnedAt: -1,
  };
  // Two tiles to start.
  spawnInto(s);
  spawnInto(s);
  // Ready.
  return s;
}

/**
 * Play a move.
 *
 * @param s the state (not changed)
 * @param dir the direction
 * @returns the new state and what happened
 */
export function move(s: State, dir: Dir): MoveResult {
  // A finished round stays finished.
  if (s.over) return { state: s, changed: false, gain: 0, merges: [], spawn: null };
  // The slide.
  const r = slideBoard(s, dir);
  // Nothing moved: no new tile, the same state.
  if (!r.changed) return { state: s, changed: false, gain: 0, merges: [], spawn: null };
  // The next state.
  const next: State = {
    ...s,
    cells: r.cells,
    score: s.score + r.gain,
    bestLen: Math.min(s.bestLen, ...r.merges.map((m) => m.to.len)),
    nextId: r.nextId,
    moves: s.moves + 1,
    merged: r.merged,
    spawnedAt: -1,
  };
  // The new tile.
  const spawn = spawnInto(next);
  // Over when no move changes the board any more.
  next.over = !canMove(next);
  // The outcome.
  return { state: next, changed: true, gain: r.gain, merges: r.merges, spawn };
}

/**
 * Check a stored state before resuming it.
 *
 * @param x whatever the store held
 * @returns true when it is a well-formed round
 */
export function isState(x: unknown): x is State {
  // An object with the right fields.
  const s = x as State;
  // The shape.
  if (!s || typeof s !== "object" || !Array.isArray(s.cells) || s.cells.length !== CELLS) return false;
  // The numbers.
  if (![s.base, s.score, s.bestLen, s.spawned, s.nextId, s.moves].every((n) => typeof n === "number" && Number.isFinite(n))) return false;
  // The source.
  if (!s.source || (s.source.kind !== "daily" && s.source.kind !== "free")) return false;
  // Every tile well formed and inside the /16.
  return s.cells.every((c) => c === null || (typeof c.net === "number" && typeof c.len === "number" && c.len >= 16 && c.len <= 27 && c.net >= s.base && c.net < s.base + 65536));
}

// ---- The greedy bot and the self-test ----------------------------------------

/** The bot's order of preference among equally good moves. */
const BOT_ORDER: readonly Dir[] = ["down", "left", "right", "up"];

/** The most moves the bot plays before stopping a round. */
const BOT_CAP = 2000;

/**
 * A greedy player: the move with the largest immediate gain, then the most empty cells, then a fixed order.
 *
 * @param source the round's source
 * @param check called with each state, for the self-test's invariants
 * @returns the final state and whether the cap stopped it
 */
export function playGreedy(source: Source, check?: (s: State, spawn: Tile | null) => void): { state: State; capped: boolean } {
  // A new round.
  let s = newGame(source);
  // Checked from the start.
  check?.(s, null);
  // Until the end or the cap.
  for (let n = 0; n < BOT_CAP; n++) {
    // Over: done.
    if (s.over) return { state: s, capped: false };
    // The best move so far.
    let bestDir: Dir | null = null;
    // Its value.
    let bestValue = -1;
    // Each direction in the bot's order.
    for (const d of BOT_ORDER) {
      // The slide alone.
      const r = slideBoard(s, d);
      // A move that changes nothing is not a move.
      if (!r.changed) continue;
      // Gain first, then room.
      const value = r.gain * 100 + r.cells.filter((c) => c === null).length;
      // Strictly better replaces; ties keep the earlier direction.
      if (value > bestValue) {
        // Best so far.
        bestValue = value;
        // Its direction.
        bestDir = d;
      }
    }
    // No move at all (the state should already say over).
    if (!bestDir) return { state: s, capped: false };
    // Played.
    const r = move(s, bestDir);
    // The new state.
    s = r.state;
    // Checked.
    check?.(s, r.spawn);
  }
  // Stopped by the cap.
  return { state: s, capped: true };
}

/**
 * The invariants of a state: tiles inside the /16, legal lengths, aligned, no two overlapping.
 *
 * @param s the state
 * @returns the first problem, or null
 */
function invariantProblem(s: State): string | null {
  // The tiles.
  const tiles = s.cells.filter((c): c is Tile => c !== null);
  // Each one.
  for (const t of tiles) {
    // Inside the /16.
    if (t.net < s.base || t.net + blockSize(t.len) > s.base + 65536) return `${tileText(t)} outside the /16`;
    // Aligned to its own length.
    if (t.net % blockSize(t.len) !== 0) return `${tileText(t)} not aligned`;
    // A length the game can make.
    if (t.len < 16 || t.len > 27) return `${tileText(t)} has an impossible length`;
  }
  // Pairwise disjoint (which also rules out duplicates).
  for (let i = 0; i < tiles.length; i++)
    for (let j = i + 1; j < tiles.length; j++)
      if (overlaps(tiles[i].net, tiles[i].len, tiles[j].net, tiles[j].len)) return `${tileText(tiles[i])} overlaps ${tileText(tiles[j])}`;
  // The /16 is RFC 1918.
  const a = s.base >>> 24;
  // Its second octet.
  const b = (s.base >>> 16) & 255;
  // 10/8, 172.16/12 or 192.168/16.
  if (!(a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))) return `base ${dotted(s.base)} is not private`;
  // All well.
  return null;
}

/**
 * The greedy bot's largest block over the 400 days from launch, as a tally by prefix length.
 *
 * @returns how many daily rounds ended with each largest block, and how many hit the move cap
 */
export function botDistribution(): { byLen: Record<number, number>; capped: number; meanScore: number; meanMoves: number } {
  // The tally.
  const byLen: Record<number, number> = {};
  // Rounds stopped by the cap.
  let capped = 0;
  // Totals for the means.
  let score = 0;
  // Moves.
  let moves = 0;
  // Each day.
  for (let i = 0; i < 400; i++) {
    // The bot's round.
    const r = playGreedy({ kind: "daily", day: addDays(LAUNCH_DAY, i) });
    // Tallied.
    byLen[r.state.bestLen] = (byLen[r.state.bestLen] ?? 0) + 1;
    // Capped.
    if (r.capped) capped++;
    // Totals.
    score += r.state.score;
    // Moves.
    moves += r.state.moves;
  }
  // The summary.
  return { byLen, capped, meanScore: Math.round(score / 400), meanMoves: Math.round(moves / 400) };
}

/** A tile for the hand-written cases: an address in 10.0.0.0/16 and a length. */
function T(last: string, len: number, id = 0): Tile {
  // "0.64" means 10.0.0.64.
  const [c, d] = last.split(".").map(Number);
  // The tile.
  return { id, net: 10 * 16777216 + c * 256 + d, len };
}

/**
 * The self-test: the merge rule against the CIDR engine, hand-written slides, 400 daily rounds played twice by the
 * greedy bot (identical both times, every state checked), and the bot reaching at least a /24 in most of them.
 *
 * @returns what was checked and what failed
 */
export function selfTest(): SelfTestReport {
  // Problems.
  const failures: string[] = [];
  // Cases checked.
  let checked = 0;

  // 1. Hand-written slides. Each: a line (wall end first), the expected line, the expected gain.
  const cases: { name: string; line: (Tile | null)[]; want: string[]; gain: number }[] = [
    { name: "siblings merge", line: [T("0.0", 26, 1), T("0.64", 26, 2), null, null], want: ["10.0.0.0/25"], gain: 128 },
    { name: "equal length, adjacent, not aligned: blocked", line: [T("0.64", 26, 1), T("0.128", 26, 2), null, null], want: ["10.0.0.64/26", "10.0.0.128/26"], gain: 0 },
    { name: "equal length, not adjacent: blocked", line: [T("0.0", 26, 1), T("0.128", 26, 2), null, null], want: ["10.0.0.0/26", "10.0.0.128/26"], gain: 0 },
    { name: "different lengths: blocked", line: [T("0.0", 26, 1), T("0.64", 27, 2), null, null], want: ["10.0.0.0/26", "10.0.0.64/27"], gain: 0 },
    { name: "higher address first still merges", line: [T("0.64", 26, 1), T("0.0", 26, 2), null, null], want: ["10.0.0.0/25"], gain: 128 },
    { name: "gaps close before merging", line: [null, T("0.0", 26, 1), null, T("0.64", 26, 2)], want: ["10.0.0.0/25"], gain: 128 },
    { name: "four in a row: two pairs, no cascade", line: [T("0.0", 26, 1), T("0.64", 26, 2), T("0.128", 26, 3), T("0.192", 26, 4)], want: ["10.0.0.0/25", "10.0.0.128/25"], gain: 256 },
    { name: "a merged tile does not merge again in the same move", line: [T("0.0", 26, 1), T("0.64", 26, 2), T("0.128", 25, 3), null], want: ["10.0.0.0/25", "10.0.0.128/25"], gain: 128 },
    { name: "three in a row: the pair nearest the wall merges", line: [T("0.0", 27, 1), T("0.32", 27, 2), T("0.64", 27, 3), null], want: ["10.0.0.0/26", "10.0.0.64/27"], gain: 64 },
    { name: "three in a row, wrong pair at the wall", line: [T("0.32", 27, 1), T("0.64", 27, 2), T("0.96", 27, 3), null], want: ["10.0.0.32/27", "10.0.0.64/26"], gain: 64 },
    { name: "a /24 pair across the third octet", line: [T("2.0", 24, 1), T("3.0", 24, 2), null, null], want: ["10.0.2.0/23"], gain: 512 },
    { name: "a /24 pair that is not aligned", line: [T("1.0", 24, 1), T("2.0", 24, 2), null, null], want: ["10.0.1.0/24", "10.0.2.0/24"], gain: 0 },
  ];
  // Each case.
  for (const c of cases) {
    // Slid towards the wall.
    const r = slideLine(c.line, 100);
    // As text, without the empty cells.
    const got = r.line.filter((t): t is Tile => t !== null).map(tileText);
    // Compared.
    if (got.join(",") !== c.want.join(",") || r.gain !== c.gain) failures.push(`slide "${c.name}": got [${got.join(", ")}] +${r.gain}`);
    // The line keeps its length.
    if (r.line.length !== c.line.length) failures.push(`slide "${c.name}": line length changed`);
    // Every merge agrees with the CIDR engine: the two prefixes summarise to exactly one block, the parent.
    for (const m of r.merges) {
      // The CIDR engine's summary of the pair.
      const agg = cidrAggregate([tileText(m.from[0]), tileText(m.from[1])]);
      // One block, equal to the merged tile.
      if (agg.aggregatedCount !== 1 || agg.aggregated[0].cidr !== tileText(m.to)) failures.push(`slide "${c.name}": CIDR engine disagrees on ${tileText(m.to)}`);
    }
    // One more.
    checked++;
  }

  // 2. The sibling rule against the CIDR engine on 2,000 random pairs of equal length inside 10.0.0.0/16.
  const pairs = makeRng(0xa66e6a7e);
  // Each pair.
  for (let i = 0; i < 2000; i++) {
    // A length from /17 to /27.
    const len = pairs.range(17, 27);
    // Blocks of that length in the /16.
    const n = 65536 / blockSize(len);
    // Two different aligned blocks, the second often next to the first.
    const ai = pairs.int(n);
    // Half the time a neighbour, otherwise anywhere.
    let bi = pairs.chance(0.5) ? Math.min(n - 1, ai + 1) : pairs.int(n);
    // Never the same block.
    if (bi === ai) bi = ai === 0 ? 1 : ai - 1;
    // The tiles.
    const a: Tile = { id: 1, net: 10 * 16777216 + ai * blockSize(len), len };
    // The other.
    const b: Tile = { id: 2, net: 10 * 16777216 + bi * blockSize(len), len };
    // The CIDR engine: exactly one block covering both means they summarise.
    const one = cidrAggregate([tileText(a), tileText(b)]).aggregatedCount === 1;
    // The game's rule must agree.
    if (areSiblings(a, b) !== one) failures.push(`sibling rule disagrees with the CIDR engine on ${tileText(a)} + ${tileText(b)}`);
    // One more.
    checked++;
  }

  // 3. A whole-board move: columns slide up and merge independently.
  const board: State = { ...newGame({ kind: "free", seed: 1 }), base: 10 * 16777216, cells: Array.from({ length: CELLS }, () => null) };
  // Column 0: a sibling pair; column 1: a non-sibling pair.
  board.cells[4] = T("0.0", 26, 1);
  board.cells[12] = T("0.64", 26, 2);
  board.cells[1] = T("0.128", 26, 3);
  board.cells[9] = T("1.0", 26, 4);
  // Up.
  const up = move(board, "up");
  // Column 0 merged into its top cell; column 1 kept both, packed upwards.
  if (up.state.cells[0] && tileText(up.state.cells[0]) !== "10.0.0.0/25") failures.push("board move: column 0 did not merge upwards");
  // Column 1.
  if (!up.state.cells[1] || !up.state.cells[5] || tileText(up.state.cells[5]) !== "10.0.1.0/26") failures.push("board move: column 1 did not pack upwards");
  // The gain.
  if (up.gain !== 128) failures.push(`board move: gain ${up.gain}, expected 128`);
  // An unchanged move spawns nothing: a board packed against the top wall, moved up.
  const packed: State = { ...board, cells: Array.from({ length: CELLS }, () => null) };
  // Two non-siblings in the top row.
  packed.cells[0] = T("0.0", 26, 1);
  packed.cells[1] = T("0.128", 26, 2);
  // Up changes nothing.
  const still = move(packed, "up");
  // Nothing.
  if (still.changed || still.spawn) failures.push("board move: an unchanged move spawned a tile");
  // Three more checks.
  checked += 3;

  // 4. 400 daily rounds, each played twice by the bot; identical, and every state well formed.
  const byLen: Record<number, number> = {};
  // Rounds reaching a /24 or larger.
  let reached24 = 0;
  // Each day.
  for (let i = 0; i < 400; i++) {
    // The day.
    const day = addDays(LAUNCH_DAY, i);
    // The first problem in this round, if any.
    let problem: string | null = null;
    // First run, with the invariants checked at every step.
    const a = playGreedy({ kind: "daily", day }, (s, spawn) => {
      // Already failing: skip.
      if (problem) return;
      // The board's invariants.
      problem = invariantProblem(s);
      // A new tile is a /26 or a /27.
      if (!problem && spawn && spawn.len !== 26 && spawn.len !== 27) problem = `spawned ${tileText(spawn)}`;
    });
    // Second run.
    const b = playGreedy({ kind: "daily", day });
    // Identical.
    if (JSON.stringify(a.state) !== JSON.stringify(b.state)) failures.push(`${day}: the daily round is not deterministic`);
    // The invariants held.
    if (problem) failures.push(`${day}: ${problem}`);
    // The first spawns are the same for everyone: the start depends only on the day.
    if (JSON.stringify(newGame({ kind: "daily", day })) !== JSON.stringify(newGame({ kind: "daily", day }))) failures.push(`${day}: the start is not deterministic`);
    // Tallied.
    byLen[a.state.bestLen] = (byLen[a.state.bestLen] ?? 0) + 1;
    // A /24 or larger.
    if (a.state.bestLen <= 24) reached24++;
    // One more.
    checked++;
  }
  // "Most" daily rounds: at least 60% reach a /24 for the greedy bot.
  if (reached24 < 240) failures.push(`the greedy bot reached a /24 in only ${reached24} of 400 daily rounds (${JSON.stringify(byLen)})`);
  // The report.
  return { checked, failures };
}
