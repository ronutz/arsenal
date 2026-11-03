// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/storage.ts
// ----------------------------------------------------------------------------
// WHAT THE /dev/fun GAMES REMEMBER, and where: one localStorage key,
// "ronutz:fun:v1", in this browser only. Nothing is ever sent anywhere; the
// Privacy page names the key (its revision of 3 November 2026).
//
// Per game it keeps: how many rounds were played and won, the current and best
// daily streak, the best score, the last day played, and the state of the last
// few daily puzzles so a reload does not lose a half-solved one (kept for
// seven days, then dropped, so the key cannot grow without bound).
//
// Every read and write is wrapped: storage can be full, disabled, or throw in a
// private window, and a game must still play without it, it just will not
// remember.
// ============================================================================

// The day arithmetic used for streaks and for pruning old daily states.
import { addDays, epochDay } from "./daily";

/** The one key every game shares. */
export const FUN_STORAGE_KEY = "ronutz:fun:v1";

/** How many days of daily-puzzle state are kept. */
const KEEP_DAYS = 7;

/** One game's record. */
export interface GameRecord {
  /** Rounds started and finished (won or lost). */
  played: number;
  /** Rounds won (for a daily puzzle: solved). */
  wins: number;
  /** Consecutive days with a win, ending on lastWinDay. */
  streak: number;
  /** The longest streak ever. */
  bestStreak: number;
  /** The best score, or null before the first scored round. */
  best: number | null;
  /** The last UTC day (YYYY-MM-DD) a round was finished. */
  lastDay: string | null;
  /** The last UTC day a daily puzzle was won, for the streak. */
  lastWinDay: string | null;
  /** Saved state of recent daily puzzles, by day: whatever the game needs to resume or show a finished result. */
  daily: Record<string, unknown>;
  /** Small per-game settings or progress (an idle game's save, a level reached); the game owns the shape. */
  extra: Record<string, unknown>;
}

/** The whole stored object. */
interface FunStore {
  /** The format version. */
  v: 1;
  /** One record per game id. */
  games: Record<string, GameRecord>;
}

/**
 * A fresh, empty record.
 *
 * @returns a record with nothing played
 */
export function emptyRecord(): GameRecord {
  // Every counter at zero, nothing remembered.
  return { played: 0, wins: 0, streak: 0, bestStreak: 0, best: null, lastDay: null, lastWinDay: null, daily: {}, extra: {} };
}

/**
 * Read the whole store, or an empty one when storage is missing, unreadable or malformed.
 *
 * @returns the store
 */
function readStore(): FunStore {
  // On the server, or in a build, there is no storage.
  if (typeof window === "undefined") return { v: 1, games: {} };
  // Storage access can throw (disabled, private mode); malformed JSON can throw.
  try {
    // The raw text.
    const raw = window.localStorage.getItem(FUN_STORAGE_KEY);
    // Nothing stored yet.
    if (!raw) return { v: 1, games: {} };
    // The parsed object.
    const parsed = JSON.parse(raw) as Partial<FunStore>;
    // Only the version this code understands, with a games object.
    if (parsed && parsed.v === 1 && parsed.games && typeof parsed.games === "object") return parsed as FunStore;
  } catch {
    // Unreadable: behave as if nothing were stored.
  }
  // Anything else starts afresh.
  return { v: 1, games: {} };
}

/**
 * Write the whole store, silently doing nothing when storage refuses.
 *
 * @param store the store to write
 */
function writeStore(store: FunStore): void {
  // No storage outside a browser.
  if (typeof window === "undefined") return;
  // Quota or privacy settings can make this throw; the game goes on without remembering.
  try {
    // The whole object, as JSON.
    window.localStorage.setItem(FUN_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Nothing to do: storage is a convenience here.
  }
}

/**
 * One game's record, filled in with defaults for any missing field.
 *
 * @param gameId the game's stable id
 * @returns its record
 */
export function loadRecord(gameId: string): GameRecord {
  // The stored record, if any.
  const stored = readStore().games[gameId];
  // Defaults first, the stored fields over them.
  return { ...emptyRecord(), ...(stored ?? {}) };
}

/**
 * Change one game's record and write it back; returns the record as written.
 *
 * @param gameId the game's stable id
 * @param change a function from the current record to the new one
 * @returns the new record
 */
export function updateRecord(gameId: string, change: (r: GameRecord) => GameRecord): GameRecord {
  // The current store.
  const store = readStore();
  // The new record.
  const next = change({ ...emptyRecord(), ...(store.games[gameId] ?? {}) });
  // Daily states older than KEEP_DAYS are dropped on every write.
  const newest = Object.keys(next.daily).sort().pop();
  // With at least one day stored, keep only the recent ones.
  if (newest) {
    // The oldest day still kept.
    const cutoff = addDays(newest, -(KEEP_DAYS - 1));
    // Keep the days on or after the cutoff (YYYY-MM-DD sorts as a date).
    next.daily = Object.fromEntries(Object.entries(next.daily).filter(([day]) => day >= cutoff));
  }
  // Put the record back and save.
  store.games[gameId] = next;
  writeStore(store);
  // The record as saved.
  return next;
}

/**
 * Save the state of one day's daily puzzle (in progress or finished), without touching the counters.
 *
 * @param gameId the game's stable id
 * @param dayKey the puzzle's day
 * @param state whatever the game needs to resume or show the result
 * @returns the new record
 */
export function saveDailyState(gameId: string, dayKey: string, state: unknown): GameRecord {
  // The record with that day's state replaced.
  return updateRecord(gameId, (r) => ({ ...r, daily: { ...r.daily, [dayKey]: state } }));
}

/**
 * Record a finished round: counters, best score and, for a won daily puzzle, the streak.
 *
 * @param gameId the game's stable id
 * @param opts what happened: the day it was played, whether it was won, an optional score, whether higher scores
 *             are better, and whether this round was the day's daily puzzle (only those count for the streak)
 * @returns the new record
 */
export function recordResult(
  gameId: string,
  opts: { dayKey: string; won: boolean; score?: number; higherIsBetter?: boolean; daily?: boolean },
): GameRecord {
  // Everything happens inside one read-change-write.
  return updateRecord(gameId, (r) => {
    // One more round played, and one more win if it was won.
    const out: GameRecord = { ...r, played: r.played + 1, wins: r.wins + (opts.won ? 1 : 0), lastDay: opts.dayKey };
    // A score updates the best when it beats it (or when there is none yet).
    if (typeof opts.score === "number" && Number.isFinite(opts.score)) {
      // Which direction counts as better.
      const higher = opts.higherIsBetter !== false;
      // The comparison.
      const better = out.best === null || (higher ? opts.score > out.best : opts.score < out.best);
      // Keep the better one.
      if (better) out.best = opts.score;
    }
    // Streaks count won daily puzzles on consecutive days, once per day.
    if (opts.daily && opts.won && out.lastWinDay !== opts.dayKey) {
      // Yesterday's win continues the streak; anything else starts a new one.
      const continues = out.lastWinDay !== null && epochDay(opts.dayKey) - epochDay(out.lastWinDay) === 1;
      // The new streak.
      out.streak = continues ? out.streak + 1 : 1;
      // The best streak follows it.
      out.bestStreak = Math.max(out.bestStreak, out.streak);
      // Today is now the last win.
      out.lastWinDay = opts.dayKey;
    }
    // The updated record.
    return out;
  });
}

/**
 * The streak to show today: the stored streak, or 0 when the last win is older than yesterday.
 *
 * @param r a game's record
 * @param todayKey today's UTC date
 * @returns the live streak
 */
export function liveStreak(r: GameRecord, todayKey: string): number {
  // No win yet, no streak.
  if (!r.lastWinDay) return 0;
  // Days since the last win.
  const gap = epochDay(todayKey) - epochDay(r.lastWinDay);
  // Today or yesterday keeps it alive; older breaks it.
  return gap <= 1 ? r.streak : 0;
}

/**
 * Forget one game's record entirely (the "Reset my stats" button).
 *
 * @param gameId the game's stable id
 */
export function forgetGame(gameId: string): void {
  // The current store.
  const store = readStore();
  // The game's entry removed.
  delete store.games[gameId];
  // Saved back (an empty games object is fine).
  writeStore(store);
}
