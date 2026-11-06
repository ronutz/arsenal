// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/storage.ts
// ----------------------------------------------------------------------------
// WHAT THE /dev/fun GAMES REMEMBER, and where: one localStorage key,
// "ronutz:fun:v1", in this browser only. Nothing is ever sent anywhere; the
// Privacy page names the key (its revision of 3 November 2026).
//
// Per game it keeps: how many rounds were played and won (and, apart, how many
// daily puzzles), the current and best daily streak, the best score, the last
// day played, and the state of the last few daily puzzles so a reload does not
// lose a half-solved one (kept for seven days, then dropped, so the key cannot
// grow without bound). "Reset my stats" clears the numbers but keeps those
// daily states and the game's own progress, so a finished daily puzzle cannot be
// played again for a better result (review R2-11, 03/11/2026).
//
// Earlier puzzles (PRIME 05/11/2026): every daily puzzle finished on its own
// day also leaves a one-number result for that day (1 solved, 0 played but not
// solved), so the list of earlier puzzles can mark it. When a page plays an
// earlier puzzle (?day=, see archive.ts), that puzzle is kept apart with no
// change to the games: the record a game reads shows the earlier puzzle's own
// saved state under its day (or, when there is none, the state left on its
// own day, so a puzzle finished then is shown finished); whatever the game
// writes under that day is filed with the earlier puzzles, and the real daily
// states are put back as they were. A daily result for that day counts as one
// more round played and leaves an earlier-puzzle result; it touches no streak,
// no best score, no "Played" of daily puzzles and no on-the-day result. Earlier
// puzzles keep their saved state for the fourteen most recently played; both
// kinds of result are kept for 400 days. Days played before the results
// existed get theirs once, from the daily states still kept and the marks the
// games' old practice lists left (backfillResults, run by GameShell).
//
// Every read and write is wrapped: storage can be full, disabled, or throw in a
// private window, and a game must still play without it, it just will not
// remember.
// ============================================================================

// The day arithmetic used for streaks and for pruning old daily states.
import { addDays, epochDay, utcDayKey } from "./daily";
// The earlier puzzle in play, read from the page's address (null on today's puzzle).
import { earlierDayInPlay } from "./archive";

/** The one key every game shares. */
export const FUN_STORAGE_KEY = "ronutz:fun:v1";

/** How many days of daily-puzzle state are kept. */
const KEEP_DAYS = 7;

/** How many earlier puzzles keep their saved state: the most recently played ones. */
const KEEP_EARLIER_STATES = 14;

/** How many days of results are kept, on the day and for earlier puzzles alike. */
const KEEP_RESULT_DAYS = 400;

/** One game's record. */
export interface GameRecord {
  /** Rounds started and finished (won or lost), daily and practice alike: what a score or free game shows. */
  played: number;
  /** Daily puzzles finished (won or lost): what a daily game shows as "Played", so practice does not inflate it. */
  dailyPlayed: number;
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
  /** The last UTC day a daily puzzle was finished, won or not (the /dev/fun shelf's "played today"). */
  lastDailyDay: string | null;
  /** Saved state of recent daily puzzles, by day: whatever the game needs to resume or show a finished result. */
  daily: Record<string, unknown>;
  /** Small per-game settings or progress (an idle game's save, a level reached); the game owns the shape. */
  extra: Record<string, unknown>;
  /** Daily puzzles finished on their own day, by day: 1 solved (or won), 0 played but not solved. */
  results: Record<string, number>;
  /** Saved state of earlier puzzles played after their day (?day=), by day, the most recently played last. */
  earlier: Record<string, unknown>;
  /** Earlier puzzles finished after their day, by day: 1 solved (or won), 0 played but not solved. */
  earlierResults: Record<string, number>;
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
  return { played: 0, dailyPlayed: 0, wins: 0, streak: 0, bestStreak: 0, best: null, lastDay: null, lastWinDay: null, lastDailyDay: null, daily: {}, extra: {}, results: {}, earlier: {}, earlierResults: {} };
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
  // Defaults first, the stored fields over them, as the game sees it on this page.
  return asSeen({ ...emptyRecord(), ...(stored ?? {}) }, earlierDayInPlay());
}

/**
 * A record as a game sees it: unchanged on today's puzzle; on an earlier puzzle's page, with that day's daily state
 * replaced by the earlier puzzle's own saved state when there is one (otherwise the state left on its own day shows).
 *
 * @param r the stored record, with defaults
 * @param earlier the earlier day in play, or null
 * @returns the record the game reads
 */
function asSeen(r: GameRecord, earlier: string | null): GameRecord {
  // Today's puzzle, or no earlier state yet: the record as stored.
  if (earlier === null || !(earlier in r.earlier)) return r;
  // The earlier puzzle's own state under its day.
  return { ...r, daily: { ...r.daily, [earlier]: r.earlier[earlier] } };
}

/**
 * The record to store after a game changed what it saw on an earlier puzzle's page: what the game wrote under the
 * earlier day is filed with the earlier puzzles (moved to the end, as the most recently played), and that day's real
 * daily state is put back as it was; every other change stands.
 *
 * @param next the record as the game left it
 * @param stored the record as stored before the change
 * @param seen the record the game was given
 * @param earlier the earlier day in play
 * @returns the record to store
 */
function fromSeen(next: GameRecord, stored: GameRecord, seen: GameRecord, earlier: string): GameRecord {
  // The real daily states: as the game left them, except the earlier day's, which goes back to what was stored.
  const daily = { ...next.daily };
  // Put back, or left out when there was none.
  if (earlier in stored.daily) daily[earlier] = stored.daily[earlier];
  else delete daily[earlier];
  // The earlier puzzles' states, as the game left them.
  const earlierStates = { ...next.earlier };
  // The game wrote a new state under the earlier day (a save is always a new value).
  if (earlier in next.daily && next.daily[earlier] !== seen.daily[earlier]) {
    // Taken out first, so it goes back in at the end: the most recently played.
    delete earlierStates[earlier];
    // Filed with the earlier puzzles.
    earlierStates[earlier] = next.daily[earlier];
  }
  // The record to store.
  return { ...next, daily, earlier: earlierStates };
}

/**
 * Keep the days of a result map that are no older than KEEP_RESULT_DAYS.
 *
 * @param results a map from day to result
 * @param cutoff the oldest day kept, YYYY-MM-DD
 * @returns the map without older days
 */
function recentResults(results: Record<string, number>, cutoff: string): Record<string, number> {
  // YYYY-MM-DD sorts as a date.
  return Object.fromEntries(Object.entries(results).filter(([day]) => day >= cutoff));
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
  // The record as stored, with defaults.
  const stored: GameRecord = { ...emptyRecord(), ...(store.games[gameId] ?? {}) };
  // The earlier puzzle in play on this page, if any.
  const earlier = earlierDayInPlay();
  // What the game sees.
  const seen = asSeen(stored, earlier);
  // The game's change, then, on an earlier puzzle's page, the earlier puzzle's state filed apart.
  const next = earlier === null ? change(seen) : fromSeen(change(seen), stored, seen, earlier);
  // Daily states older than KEEP_DAYS are dropped on every write.
  const newest = Object.keys(next.daily).sort().pop();
  // With at least one day stored, keep only the recent ones.
  if (newest) {
    // The oldest day still kept.
    const cutoff = addDays(newest, -(KEEP_DAYS - 1));
    // Keep the days on or after the cutoff (YYYY-MM-DD sorts as a date).
    next.daily = Object.fromEntries(Object.entries(next.daily).filter(([day]) => day >= cutoff));
  }
  // Earlier puzzles keep the states of the most recently played (the last entries; the object keeps insertion order).
  next.earlier = Object.fromEntries(Object.entries(next.earlier ?? {}).slice(-KEEP_EARLIER_STATES));
  // Results older than KEEP_RESULT_DAYS before today drop out.
  const oldest = addDays(utcDayKey(new Date()), -KEEP_RESULT_DAYS);
  // On the day.
  next.results = recentResults(next.results ?? {}, oldest);
  // Earlier puzzles.
  next.earlierResults = recentResults(next.earlierResults ?? {}, oldest);
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
  // An earlier puzzle's daily result (its page, its day): one more round played and its own result, nothing else.
  if (opts.daily && earlierDayInPlay() === opts.dayKey) {
    // Inside one read-change-write.
    return updateRecord(gameId, (r) => ({
      ...r,
      // A round played.
      played: r.played + 1,
      // Solved once stays solved (a game with several daily rounds a day records each).
      earlierResults: { ...r.earlierResults, [opts.dayKey]: Math.max(r.earlierResults[opts.dayKey] ?? 0, opts.won ? 1 : 0) },
    }));
  }
  // Everything happens inside one read-change-write.
  return updateRecord(gameId, (r) => {
    // One more round played (and one more daily puzzle when it was one), and one more win if it was won.
    const out: GameRecord = { ...r, played: r.played + 1, dailyPlayed: r.dailyPlayed + (opts.daily ? 1 : 0), wins: r.wins + (opts.won ? 1 : 0), lastDay: opts.dayKey };
    // A daily puzzle marks its day as played, for the shelf, and leaves its result for the list of earlier puzzles
    // (solved once stays solved: Spanning Tree's three daily levels each record a round).
    if (opts.daily) {
      // Played on its day.
      out.lastDailyDay = opts.dayKey;
      // Its result.
      out.results = { ...out.results, [opts.dayKey]: Math.max(out.results[opts.dayKey] ?? 0, opts.won ? 1 : 0) };
    }
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

/** A game's grading of a saved daily state: 1 solved, 0 finished but not solved, null unfinished or not understood. */
export type GradeSaved = (day: string, state: unknown) => 0 | 1 | null;

/** What a game's old practice left: marks of earlier days (played later) and the extra field without them. */
export interface LegacyMarks {
  /** Earlier days and their results (1 solved, 0 not solved). */
  later: Record<string, number>;
  /** The game's extra field with the old practice values taken out, or null to leave it as it is. */
  extra: Record<string, unknown> | null;
}

/**
 * Fill in the marks of days played before the results existed (PRIME 05/11/2026, "Ticks for 3–4 Nov from saved
 * rounds"), once: a kept daily state the game grades as finished becomes that day's on-the-day result, and the marks
 * a game's old practice list left become results of earlier puzzles played later. A result already there is never
 * changed (an on-the-day result also wins over a practice mark), so running it again changes nothing. It reads the
 * record as stored, never the earlier puzzle's view: the daily states it grades were all played on their own day.
 *
 * @param gameId the game's stable id
 * @param grade the game's grading of a saved daily state
 * @param legacy the game's old practice marks, if it had any
 * @returns whether anything was filled in (the caller then reads the record again)
 */
export function backfillResults(gameId: string, grade: GradeSaved | undefined, legacy?: (r: GameRecord) => LegacyMarks | null): boolean {
  // The record as stored, with defaults.
  const stored: GameRecord = { ...emptyRecord(), ...(readStore().games[gameId] ?? {}) };
  // The on-the-day results to add.
  const onDay: Record<string, number> = {};
  // Each kept daily state without a result yet.
  for (const [day, state] of Object.entries(grade ? stored.daily : {})) {
    // Already marked.
    if (typeof stored.results?.[day] === "number") continue;
    // The game's grading; a state it cannot read gives nothing (and never stops the page).
    let g: 0 | 1 | null = null;
    // Graded.
    try {
      // Solved, not solved, or not finished.
      g = grade!(day, state);
    } catch {
      // Not understood.
      g = null;
    }
    // A finished day is marked.
    if (g === 0 || g === 1) onDay[day] = g;
  }
  // The old practice marks, if the game had a practice list.
  let old: LegacyMarks | null = null;
  // Read without letting a malformed value stop the page.
  try {
    // The game's reading.
    old = legacy ? legacy(stored) : null;
  } catch {
    // Nothing usable.
    old = null;
  }
  // The earlier-puzzle results to add: a day with no on-the-day result, and only where the mark is better than what is there.
  const later: Record<string, number> = {};
  // Each old mark.
  for (const [day, v] of Object.entries(old?.later ?? {})) {
    // A real 0 or 1 only.
    if (v !== 0 && v !== 1) continue;
    // Played on its day: that result stands.
    if (typeof stored.results?.[day] === "number" || day in onDay) continue;
    // Already as good or better.
    if ((stored.earlierResults?.[day] ?? -1) >= v) continue;
    // Added.
    later[day] = v;
  }
  // Whether the extra field changes (the old marks taken out).
  const extraChanges = old !== null && old.extra !== null;
  // Nothing to do.
  if (Object.keys(onDay).length === 0 && Object.keys(later).length === 0 && !extraChanges) return false;
  // Written in one read-change-write; results already there win over the filled-in ones.
  updateRecord(gameId, (r) => ({
    ...r,
    // On the day.
    results: { ...onDay, ...r.results },
    // Played later: the better of the two.
    earlierResults: { ...r.earlierResults, ...Object.fromEntries(Object.entries(later).map(([d, v]) => [d, Math.max(v, r.earlierResults[d] ?? 0)])) },
    // The extra field without the old practice values, when the game gave one.
    extra: extraChanges ? old!.extra! : r.extra,
  }));
  // Filled in.
  return true;
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
 * Reset one game's stats (the "Reset my stats" button): every counter, the streaks and the best score go back to
 * nothing, while the recent daily states, the game's own progress and the marks of solved days (on the day and
 * earlier puzzles, with their saved states) stay. Wiping the daily states used to let a
 * finished daily puzzle be played again for a better result; wiping the progress used to lock levels again.
 *
 * @param gameId the game's stable id
 */
export function resetStats(gameId: string): void {
  // The record with fresh counters, the kept parts carried over.
  updateRecord(gameId, (r) => ({ ...emptyRecord(), daily: r.daily, extra: r.extra, lastDailyDay: r.lastDailyDay, results: r.results, earlier: r.earlier, earlierResults: r.earlierResults }));
}
