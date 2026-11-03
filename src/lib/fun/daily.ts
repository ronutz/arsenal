// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/daily.ts
// ----------------------------------------------------------------------------
// THE DAILY SEED for the /dev/fun games (PRIME 03/11/2026: "I want all of them",
// with ideas taken from LinkedIn's daily games).
//
// A daily puzzle is the same for everyone on the same UTC day, with no server:
// the day's date and the game's id are hashed into a 32-bit seed, and a small
// seeded generator draws every random choice from it. The same date always
// gives the same puzzle, on every device and in every language, so two players
// can compare results by sharing them, and a check before every build can
// regenerate any day's puzzle and prove it solvable (scripts/check-fun-games.mts).
//
// The day turns at 00:00 UTC (21:00 in São Paulo), one fixed instant for the
// whole world, which is what makes "today's puzzle" one puzzle.
//
// Everything here is pure: no Date.now() inside the generators, no Math.random.
// The caller passes the date; the page reads the clock once, after mount.
// ============================================================================

/** The first day of the daily games, as a UTC calendar date; puzzle #1 is this day. */
export const LAUNCH_DAY = "2026-11-03";

/** Milliseconds in one day. */
const DAY_MS = 86_400_000;

/**
 * The UTC calendar date of an instant, as YYYY-MM-DD.
 *
 * @param at the instant (a Date)
 * @returns the date in UTC, zero-padded
 */
export function utcDayKey(at: Date): string {
  // ISO strings are always UTC, and their first ten characters are the date.
  return at.toISOString().slice(0, 10);
}

/**
 * Days since 1970-01-01 for a YYYY-MM-DD date, counted in UTC.
 *
 * @param dayKey the date as YYYY-MM-DD
 * @returns the whole number of days since the Unix epoch
 */
export function epochDay(dayKey: string): number {
  // The three parts of the date.
  const [y, m, d] = dayKey.split("-").map(Number);
  // Date.UTC takes a zero-based month and gives milliseconds; whole days divide exactly.
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

/**
 * The puzzle number of a day: 1 on LAUNCH_DAY, 2 the day after, and so on.
 *
 * @param dayKey the date as YYYY-MM-DD
 * @returns the puzzle number (0 or less before launch)
 */
export function puzzleNumber(dayKey: string): number {
  // Days after launch, plus one so the launch day is #1.
  return epochDay(dayKey) - epochDay(LAUNCH_DAY) + 1;
}

/**
 * The YYYY-MM-DD date a given number of days after another.
 *
 * @param dayKey the starting date
 * @param days how many days to add (negative goes back)
 * @returns the resulting date in UTC
 */
export function addDays(dayKey: string, days: number): string {
  // Through epoch days, so month and year boundaries take care of themselves.
  return utcDayKey(new Date((epochDay(dayKey) + days) * DAY_MS));
}

/**
 * Milliseconds from an instant to the next 00:00 UTC, for the "next puzzle in" countdown.
 *
 * @param at the instant
 * @returns milliseconds until the next UTC midnight
 */
export function msToNextDay(at: Date): number {
  // The start of the following UTC day.
  const next = (epochDay(utcDayKey(at)) + 1) * DAY_MS;
  // What is left of today.
  return next - at.getTime();
}

/**
 * FNV-1a, 32-bit: a small, well-known string hash, used only to turn "game:date" into a seed.
 *
 * @param text the string to hash
 * @returns an unsigned 32-bit integer
 */
export function fnv1a(text: string): number {
  // The FNV offset basis.
  let h = 0x811c9dc5;
  // Each UTF-16 code unit in turn.
  for (let i = 0; i < text.length; i++) {
    // XOR the unit in.
    h ^= text.charCodeAt(i);
    // Multiply by the FNV prime, kept to 32 bits.
    h = Math.imul(h, 0x01000193);
  }
  // As an unsigned value.
  return h >>> 0;
}

/**
 * The seed of a game on a day.
 *
 * @param gameId the game's stable id (for example "prefix-of-the-day")
 * @param dayKey the date as YYYY-MM-DD
 * @param variant an optional extra word, for a game that draws several independent things in a day
 * @returns an unsigned 32-bit seed
 */
export function dailySeed(gameId: string, dayKey: string, variant = ""): number {
  // The game, the date and the variant, joined so that no two combinations collide by concatenation.
  return fnv1a(`${gameId}|${dayKey}|${variant}`);
}

/** A seeded source of randomness: every method draws from the same sequence. */
export interface Rng {
  /** A float in [0, 1). */
  next(): number;
  /** An integer in [0, n). */
  int(n: number): number;
  /** An integer in [lo, hi], both included. */
  range(lo: number, hi: number): number;
  /** One element of a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** A shuffled copy of an array (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** True with probability p. */
  chance(p: number): boolean;
}

/**
 * A seeded generator: mulberry32, a 32-bit generator small enough to read and good enough for games.
 *
 * @param seed an unsigned 32-bit seed
 * @returns an Rng drawing from that seed's sequence
 */
export function makeRng(seed: number): Rng {
  // The state, kept as an unsigned 32-bit integer.
  let a = seed >>> 0;
  // One step of mulberry32: advance the state and mix it into a float in [0, 1).
  const next = (): number => {
    // Advance by the golden-ratio increment.
    a = (a + 0x6d2b79f5) >>> 0;
    // Mix: two multiply-xorshift rounds.
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    // The top bits, scaled to [0, 1).
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // An integer in [0, n).
  const int = (n: number): number => Math.floor(next() * n);
  // The generator's methods, all drawing from next().
  return {
    next,
    int,
    // Inclusive range: lo plus an offset of up to hi - lo.
    range: (lo, hi) => lo + int(hi - lo + 1),
    // A uniformly chosen element.
    pick: (items) => items[int(items.length)],
    // Fisher-Yates on a copy, from the end.
    shuffle: (items) => {
      // The copy.
      const out = items.slice();
      // Swap each position with a random earlier-or-same one.
      for (let i = out.length - 1; i > 0; i--) {
        // The partner.
        const j = int(i + 1);
        // The swap.
        [out[i], out[j]] = [out[j], out[i]];
      }
      // The shuffled copy.
      return out;
    },
    // A weighted coin.
    chance: (p) => next() < p,
  };
}

/**
 * The generator for a game on a day: makeRng(dailySeed(...)).
 *
 * @param gameId the game's stable id
 * @param dayKey the date as YYYY-MM-DD
 * @param variant an optional extra word
 * @returns the day's Rng for that game
 */
export function dailyRng(gameId: string, dayKey: string, variant = ""): Rng {
  // Seed, then generator.
  return makeRng(dailySeed(gameId, dayKey, variant));
}
