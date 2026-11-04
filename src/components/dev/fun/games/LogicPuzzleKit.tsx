// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/LogicPuzzleKit.tsx
// ----------------------------------------------------------------------------
// WHAT THE THREE GRID PUZZLES SHARE (Access Points, Bit Balance, Patch Path;
// PRIME 03/11/2026): the daily-or-practice switch, the clock that starts on the
// first move, the "Check" and "Hint" counters and their time penalty (a hint
// costs what a check costs; each game's engine finds the hint, the kit counts
// it, saves it with the round and shows its sentence under the buttons), undo
// and clear, the saved state of today's puzzle (restored on load, a finished
// one shown again), recording the result, a polite live line for screen
// readers, and the switch that stands the site's single-key shortcuts down
// while a board has the keyboard (useBoardKeys).
//
// The clock (review R1-01, 03/11/2026) counts only the time the page is
// visible: it pauses while the tab is hidden, the elapsed time is saved when
// the page is hidden or closed and every five seconds, and an unfinished daily
// round that comes back after a reload is running again at once, so a reload
// no longer wins time. Spanning Tree borrows the same clock (useRoundClock).
//
// Practice offers the previous seven days' puzzles (rebuilt from their seeds),
// never a future one, and does not touch the streak or the saved daily state;
// a practice round is framed as free play (review R1-09): no countdown or
// streak, and "Play again" moves on to another earlier day. The list of days
// marks the ones solved as the daily puzzle with a tick and the time, read
// from the saved daily states the record keeps for seven days (practice
// rounds themselves are not stored). Check and Clear wait for a first move
// (review R1-13): an untouched board has nothing to check and nothing to
// clear; Hint does not wait, since an empty board has a first step too.
// Each game keeps its own board, rules and drawing; this file holds no strings
// of its own: the game passes its labels in.
// ============================================================================

"use client";

// React's state, effects, refs and memo.
import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from "react";
// The day arithmetic.
import { addDays } from "@/lib/fun/daily";
// The time format.
import { formatDuration } from "@/lib/fun/share";
// The one storage key's helpers.
import { loadRecord, recordResult, saveDailyState, updateRecord } from "@/lib/fun/storage";
// The switch that stands the site's single-key shortcuts down.
import { setSiteShortcutsSuppressed } from "@/lib/pageCapabilities";

/** How many earlier days practice offers. */
export const PRACTICE_DAYS = 7;

/** How often a running clock saves itself, in milliseconds. */
const PERSIST_EVERY_MS = 5000;

/** A round's clock that counts only the time the page is visible. */
export interface RoundClock {
  /** Milliseconds counted, refreshed four times a second while it runs. */
  ms: number;
  /** Whether it is on (started and not stopped); it still pauses while the tab is hidden. */
  running: boolean;
  /** Start, or start again from a total already counted (a restored round); without a total, a clock already on carries on. */
  start: (from?: number) => void;
  /** Stop for good and return the exact total. */
  stop: () => number;
  /** The exact total at this instant. */
  now: () => number;
  /** Stopped, showing a total (zero by default). */
  reset: (to?: number) => void;
}

/**
 * A clock for one round: it counts only while the page is visible, and tells its owner when to save (the page being
 * hidden or closed, and every few seconds while it runs), so neither a reload nor a hidden tab changes the time.
 *
 * @param onPersist called with the exact total when the clock should be saved (only while it is on)
 * @returns the clock
 */
export function useRoundClock(onPersist?: (ms: number) => void): RoundClock {
  // The time counted before the current visible stretch.
  const acc = useRef(0);
  // When the current visible stretch began (performance.now()), or null while paused or stopped.
  const since = useRef<number | null>(null);
  // Whether the round's clock is on.
  const on = useRef(false);
  // The owner's save, read through a ref so the listeners below never go stale.
  const persist = useRef(onPersist);
  // Kept current on every render.
  persist.current = onPersist;
  // The total shown.
  const [ms, setMs] = useState(0);
  // Whether it is on, for rendering.
  const [running, setRunning] = useState(false);

  // The exact total: what was counted, plus the visible stretch in progress.
  const now = useCallback(() => acc.current + (since.current !== null ? performance.now() - since.current : 0), []);

  // Start, or start again from a total.
  const start = useCallback(
    (from?: number) => {
      // Already on and no new total: carry on.
      if (on.current && from === undefined) return;
      // A restored total replaces what was counted.
      if (from !== undefined) acc.current = from;
      // On.
      on.current = true;
      // Counting at once when the page is visible, or from the moment it is shown.
      since.current = typeof document !== "undefined" && document.visibilityState === "hidden" ? null : performance.now();
      // Shown.
      setMs(now());
      // Running.
      setRunning(true);
    },
    [now],
  );

  // Stop for good.
  const stop = useCallback(() => {
    // The exact total.
    const total = now();
    // Kept.
    acc.current = total;
    // No stretch in progress.
    since.current = null;
    // Off.
    on.current = false;
    // Shown.
    setMs(total);
    // Not running.
    setRunning(false);
    // For the caller's result.
    return total;
  }, [now]);

  // Stopped at a total.
  const reset = useCallback((to = 0) => {
    // The total.
    acc.current = to;
    // No stretch in progress.
    since.current = null;
    // Off.
    on.current = false;
    // Shown.
    setMs(to);
    // Not running.
    setRunning(false);
  }, []);

  // Pause while the page is hidden (saving the total), resume when it is shown again.
  useEffect(() => {
    // Hidden or closing: bank the visible stretch and save.
    const pause = () => {
      // A stretch in progress ends now.
      if (since.current !== null) {
        // Added to the total.
        acc.current += performance.now() - since.current;
        // Paused.
        since.current = null;
        // Shown.
        setMs(acc.current);
      }
      // Saved while the round is on (a stopped round was saved when it finished).
      if (on.current) persist.current?.(acc.current);
    };
    // Shown again: a round that is on counts again.
    const resume = () => {
      // Only when on, paused and visible.
      if (on.current && since.current === null && document.visibilityState !== "hidden") since.current = performance.now();
    };
    // The tab hidden or shown.
    const onVisibility = () => (document.visibilityState === "hidden" ? pause() : resume());
    // Subscribed: visibility, closing, and coming back from the back-forward cache.
    document.addEventListener("visibilitychange", onVisibility);
    // Closing or navigating away.
    window.addEventListener("pagehide", pause);
    // Restored from the back-forward cache.
    window.addEventListener("pageshow", resume);
    // Unsubscribed on unmount.
    return () => {
      // Visibility.
      document.removeEventListener("visibilitychange", onVisibility);
      // Closing.
      window.removeEventListener("pagehide", pause);
      // Restoring.
      window.removeEventListener("pageshow", resume);
    };
  }, []);

  // While on: the display ticks four times a second, and the total is saved every few seconds.
  useEffect(() => {
    // Nothing while off.
    if (!running) return;
    // When the last save happened.
    let saved = performance.now();
    // The tick.
    const id = window.setInterval(() => {
      // The display.
      setMs(now());
      // A save every few seconds of visible play.
      if (since.current !== null && performance.now() - saved >= PERSIST_EVERY_MS) {
        // Reset the interval's own count.
        saved = performance.now();
        // Saved.
        persist.current?.(now());
      }
    }, 250);
    // Cleared when stopped or unmounted.
    return () => window.clearInterval(id);
  }, [running, now]);

  // The clock.
  return { ms, running, start, stop, now, reset };
}

/**
 * Whether two boards are the same (boards are small arrays of numbers or plain values).
 *
 * @param a one board
 * @param b the other
 * @returns true when equal
 */
function sameBoard(a: unknown, b: unknown): boolean {
  // Their JSON forms compared: enough for the kit's boards.
  return JSON.stringify(a) === JSON.stringify(b);
}

/** What a game saves for a daily puzzle. */
interface SavedRound<B> {
  /** The board. */
  b: B;
  /** Milliseconds on the clock (without penalties). */
  e: number;
  /** Checks used. */
  k: number;
  /** Hints used (missing in a round saved before hints existed: none). */
  h?: number;
  /** Finished. */
  d: boolean;
  /** The final time with penalties, once finished. */
  t: number | null;
}

/**
 * A usable count from a saved round (a missing or damaged field counts as none).
 *
 * @param x the stored value
 * @returns a whole number, zero or more
 */
function savedCount(x: unknown): number {
  // A whole number of zero or more, or none.
  return typeof x === "number" && Number.isInteger(x) && x >= 0 ? x : 0;
}

/** What the session needs from a game. */
export interface PuzzleSessionConfig<P, B> {
  /** The game's stable id. */
  gameId: string;
  /** Today's UTC day, or null before mount. */
  today: string | null;
  /** The puzzle of a day. */
  generate: (day: string) => P;
  /** A fresh board for a puzzle. */
  empty: (p: P) => B;
  /** Whether a stored value is a usable board for this puzzle. */
  isBoard: (p: P, x: unknown) => x is B;
  /** Whether a board is solved. */
  isSolved: (p: P, b: B) => boolean;
  /** Milliseconds added to the time per "Check", and per "Hint" (a hint costs what a check costs). */
  penaltyMs: number;
}

/** The session a game plays in. */
export interface PuzzleSession<P, B> {
  /** "daily" or "practice". */
  mode: "daily" | "practice";
  /** The day being played (today, or a practice day), or null before mount. */
  day: string | null;
  /** The earlier days practice offers, most recent first. */
  practiceDays: string[];
  /** The puzzle, or null before mount. */
  puzzle: P | null;
  /** The board, or null before mount. */
  board: B | null;
  /** Make a move: the new board (ignored once finished). */
  move: (next: B) => void;
  /** Undo the last move. */
  undo: () => void;
  /** Whether there is anything to undo. */
  canUndo: boolean;
  /** Clear the board (undoable). */
  clear: () => void;
  /** Whether the board is still as the puzzle gave it (nothing to check, nothing to clear). */
  untouched: boolean;
  /** Checks used. */
  checks: number;
  /** Count a check (the game shows the errors). */
  check: () => void;
  /** Hints used. */
  hints: number;
  /** Count a hint (the game finds it with its engine and shows it); it starts the clock like a move. */
  hint: () => void;
  /** The earlier days already solved as the daily puzzle, with their final times (read from the saved daily states). */
  solvedDays: Record<string, number>;
  /** The earlier days solved in practice, with the best final time (extra.practiceSolved, the last seven days). */
  practiceSolved: Record<string, number>;
  /** Whether the round is finished. */
  done: boolean;
  /** The final time with penalties, once finished. */
  finalMs: number | null;
  /** The time to show now, penalties included. */
  shownMs: number;
  /** Whether the clock has started. */
  started: boolean;
  /** Switch to today's puzzle. */
  playDaily: () => void;
  /** Switch to a practice day. */
  playPractice: (day: string) => void;
  /** Bumped after each recorded result, for GameShell's version prop. */
  version: number;
  /** What GameShell needs to frame the round: a daily puzzle, or practice as free play with "Play again". */
  shell: { kind: "daily" | "free"; onPlayAgain?: () => void };
}

/**
 * The shared session: mode, day, puzzle, board with undo, clock, checks, saving and recording.
 *
 * @param cfg see PuzzleSessionConfig
 * @returns the session
 */
export function usePuzzleSession<P, B>(cfg: PuzzleSessionConfig<P, B>): PuzzleSession<P, B> {
  // The config, read through a ref so callbacks stay stable.
  const cfgRef = useRef(cfg);
  // Kept current.
  cfgRef.current = cfg;
  // Daily or practice.
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  // The practice day chosen.
  const [practiceDay, setPracticeDay] = useState<string | null>(null);
  // The day being played.
  const day = cfg.today === null ? null : mode === "daily" ? cfg.today : practiceDay;
  // The earlier days, most recent first.
  const practiceDays = useMemo(() => (cfg.today ? Array.from({ length: PRACTICE_DAYS }, (_, k) => addDays(cfg.today as string, -(k + 1))) : []), [cfg.today]);
  // Bumped by "Play again", so a practice day can start afresh even when it is the same day.
  const [round, setRound] = useState(0);
  // The day's puzzle, built once per day.
  const puzzle = useMemo(() => (day ? cfgRef.current.generate(day) : null), [day]);
  // The board.
  const [board, setBoard] = useState<B | null>(null);
  // Earlier boards, for undo.
  const [history, setHistory] = useState<B[]>([]);
  // Checks used.
  const [checks, setChecks] = useState(0);
  // Hints used.
  const [hints, setHints] = useState(0);
  // Finished.
  const [done, setDone] = useState(false);
  // The final time.
  const [finalMs, setFinalMs] = useState<number | null>(null);
  // The record version for GameShell.
  const [version, setVersion] = useState(0);
  // Whether the clock has started for this round (a restored round counts as started).
  const [started, setStarted] = useState(false);
  // The latest round, for the clock's saves, which come from event listeners between renders.
  const live = useRef({ mode, day, board, checks, hints, done, started });
  // Kept current on every render.
  live.current = { mode, day, board, checks, hints, done, started };

  // Save the daily round in progress with the clock's exact total (the page hidden or closed, a timer, a switch away).
  const persist = useCallback((ms: number) => {
    // The round as it stands.
    const r = live.current;
    // Only an unfinished daily round that has started (practice is not saved; a finished one was saved at the end).
    if (r.mode !== "daily" || !r.day || r.board === null || !r.started || r.done) return;
    // The round.
    const saved: SavedRound<B> = { b: r.board, e: ms, k: r.checks, h: r.hints, d: false, t: null };
    // Into the one storage key.
    saveDailyState(cfgRef.current.gameId, r.day, saved);
  }, []);
  // The clock: visible time only, saved through persist.
  const clock = useRoundClock(persist);
  // The clock's latest functions, for the cleanup below.
  const clockRef = useRef(clock);
  // Kept current.
  clockRef.current = clock;
  // Save now, before the round leaves the screen.
  const persistNow = useCallback(() => {
    // Only while the clock is on.
    if (clockRef.current.running) persist(clockRef.current.now());
  }, [persist]);

  // Leaving the page inside the site (no pagehide then): the round in progress is saved.
  useEffect(() => () => persistNow(), [persistNow]);

  // A new puzzle: restore today's saved round, or start fresh.
  useEffect(() => {
    // Nothing before mount.
    if (!puzzle || !day) return;
    // The clock back to zero, stopped.
    clock.reset(0);
    // Undo history cleared.
    setHistory([]);
    // The saved round, for the daily puzzle only.
    const saved = mode === "daily" ? (loadRecord(cfgRef.current.gameId).daily[day] as SavedRound<B> | undefined) : undefined;
    // A usable saved round.
    if (saved && typeof saved === "object" && cfgRef.current.isBoard(puzzle, saved.b)) {
      // Its time so far.
      const e = typeof saved.e === "number" && Number.isFinite(saved.e) && saved.e >= 0 ? saved.e : 0;
      // Its board.
      setBoard(saved.b);
      // Its checks.
      setChecks(typeof saved.k === "number" ? saved.k : 0);
      // Its hints (none in a round saved before hints existed).
      setHints(savedCount(saved.h));
      // Finished or not.
      setDone(saved.d === true);
      // Its final time.
      setFinalMs(typeof saved.t === "number" ? saved.t : null);
      // It had started.
      setStarted(true);
      // A finished round shows its time; an unfinished one is running again at once (a reload wins no time).
      if (saved.d === true) clock.reset(e);
      // Running from where it was saved.
      else clock.start(e);
      // Restored.
      return;
    }
    // A fresh board.
    setBoard(cfgRef.current.empty(puzzle));
    // No checks.
    setChecks(0);
    // No hints.
    setHints(0);
    // Not finished.
    setDone(false);
    // No time.
    setFinalMs(null);
    // Not started.
    setStarted(false);
    // The clock's functions are stable; the effect follows the puzzle and "Play again".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, day, mode, round]);

  // Save today's round (daily only): board, clock, checks, hints, finished, final time.
  const save = useCallback(
    (b: B, e: number, k: number, h: number, d: boolean, t: number | null) => {
      // Practice rounds are not saved.
      if (mode !== "daily" || !day) return;
      // The round.
      const saved: SavedRound<B> = { b, e, k, h, d, t };
      // Into the one storage key.
      saveDailyState(cfgRef.current.gameId, day, saved);
    },
    [mode, day],
  );

  // Finish: stop the clock, record, save.
  const finish = useCallback(
    (b: B, k: number, h: number) => {
      // The exact visible time of the round, restored part included.
      const raw = clock.stop();
      // Penalties added: one per check and one per hint.
      const total = raw + (k + h) * cfgRef.current.penaltyMs;
      // Finished.
      setDone(true);
      // Its time.
      setFinalMs(total);
      // Saved.
      save(b, raw, k, h, true, total);
      // Recorded: a daily round counts for the streak and the best time; practice only counts as played.
      if (day) recordResult(cfgRef.current.gameId, mode === "daily" ? { dayKey: day, won: true, score: Math.round(total), higherIsBetter: false, daily: true } : { dayKey: day, won: true, daily: false });
      // A practice solve is remembered for its day's chip (PRIME 03/11/2026 18:17, "Ok to all"): the best time per day,
      // inside the game's own record (extra.practiceSolved, merged, never replacing extra), kept for the days practice
      // offers and dropped after them, so the record cannot grow without bound.
      if (day && mode === "practice") {
        // The oldest day practice still offers.
        const oldest = cfgRef.current.today ? addDays(cfgRef.current.today, -PRACTICE_DAYS) : day;
        // Read, change, write in one step.
        updateRecord(cfgRef.current.gameId, (r) => {
          // The stored map, if it is one.
          const prev = r.extra.practiceSolved && typeof r.extra.practiceSolved === "object" ? (r.extra.practiceSolved as Record<string, unknown>) : {};
          // The days still on offer, with a usable time, carried over.
          const kept: Record<string, number> = {};
          // Each stored day: kept when practice still offers it and its time is a real duration.
          for (const [d, t] of Object.entries(prev)) if (d >= oldest && typeof t === "number" && Number.isFinite(t) && t >= 0) kept[d] = t;
          // This day's best: the new time when it beats the old one (or there is none).
          kept[day] = kept[day] === undefined ? total : Math.min(kept[day], total);
          // The record with the map merged into extra.
          return { ...r, extra: { ...r.extra, practiceSolved: kept } };
        });
      }
      // The shell re-reads the record.
      setVersion((v) => v + 1);
    },
    [clock, save, day, mode],
  );

  // A move.
  const move = useCallback(
    (next: B) => {
      // Nothing changes after the finish, or before mount.
      if (done || board === null || puzzle === null) return;
      // The old board goes on the undo stack.
      setHistory((h) => [...h, board]);
      // The new board.
      setBoard(next);
      // The clock starts on the first move (a clock already running carries on).
      clock.start();
      // Started.
      setStarted(true);
      // Solved: finish.
      if (cfgRef.current.isSolved(puzzle, next)) finish(next, checks, hints);
      // Otherwise saved as it stands.
      else save(next, clock.now(), checks, hints, false, null);
    },
    [done, board, puzzle, clock, finish, save, checks, hints],
  );

  // Undo.
  const undo = useCallback(() => {
    // Nothing to undo, or finished.
    if (done || history.length === 0) return;
    // The previous board.
    const prev = history[history.length - 1];
    // Popped.
    setHistory((h) => h.slice(0, -1));
    // Shown.
    setBoard(prev);
    // Saved.
    save(prev, clock.now(), checks, hints, false, null);
  }, [done, history, save, clock, checks, hints]);

  // Whether the board is still the puzzle's own (nothing to check or clear).
  const untouched = useMemo(() => puzzle === null || board === null || sameBoard(board, cfgRef.current.empty(puzzle)), [puzzle, board]);

  // Clear (undoable).
  const clear = useCallback(() => {
    // Only while playing, and only when there is something to clear (an empty board pushed no useless undo step).
    if (done || board === null || puzzle === null || untouched) return;
    // The fresh board.
    const fresh = cfgRef.current.empty(puzzle);
    // Pushed and shown.
    setHistory((h) => [...h, board]);
    // Shown.
    setBoard(fresh);
    // Saved.
    save(fresh, clock.now(), checks, hints, false, null);
  }, [done, board, puzzle, untouched, save, clock, checks, hints]);

  // A check.
  const check = useCallback(() => {
    // Only while playing, and never on an untouched board (it would only cost time).
    if (done || board === null || untouched) return;
    // One more.
    const k = checks + 1;
    // Counted.
    setChecks(k);
    // The clock starts if it had not (a check is a move of sorts).
    clock.start();
    // Started.
    setStarted(true);
    // Saved.
    save(board, clock.now(), k, hints, false, null);
  }, [done, board, untouched, checks, hints, clock, save]);

  // A hint: counted and priced like a check, but allowed on an untouched board (its first step is a hint too).
  const hint = useCallback(() => {
    // Only while playing.
    if (done || board === null) return;
    // One more.
    const h = hints + 1;
    // Counted.
    setHints(h);
    // The clock starts if it had not (a hint is a move of sorts).
    clock.start();
    // Started.
    setStarted(true);
    // Saved.
    save(board, clock.now(), checks, h, false, null);
  }, [done, board, hints, checks, clock, save]);

  // The earlier days solved as the daily puzzle, with their final times.
  const [solvedDays, setSolvedDays] = useState<Record<string, number>>({});
  // The earlier days solved in practice, with their best times.
  const [practiceSolved, setPracticeSolved] = useState<Record<string, number>>({});
  // Read after mount, on a switch of mode, and after each recorded result (the record keeps seven days of states).
  useEffect(() => {
    // Nothing before mount.
    if (practiceDays.length === 0) return;
    // The game's record: its saved daily states and its practice solves.
    const rec = loadRecord(cfgRef.current.gameId);
    // The saved daily states.
    const daily = rec.daily;
    // The practice solves, if the stored value is a map.
    const prac = rec.extra.practiceSolved && typeof rec.extra.practiceSolved === "object" ? (rec.extra.practiceSolved as Record<string, unknown>) : {};
    // The days found solved in practice.
    const fromPractice: Record<string, number> = {};
    // The days found solved.
    const found: Record<string, number> = {};
    // Each earlier day on offer.
    for (const d of practiceDays) {
      // Its saved round, if any.
      const sv = daily[d] as Partial<SavedRound<B>> | undefined;
      // Finished, with a usable final time.
      if (sv && typeof sv === "object" && sv.d === true && typeof sv.t === "number" && Number.isFinite(sv.t) && sv.t >= 0) found[d] = sv.t;
      // Its best practice time, if any.
      const pt = prac[d];
      // A usable time.
      if (typeof pt === "number" && Number.isFinite(pt) && pt >= 0) fromPractice[d] = pt;
    }
    // Shown.
    setSolvedDays(found);
    // Shown too.
    setPracticeSolved(fromPractice);
  }, [practiceDays, mode, version]);

  // Switch to today's puzzle (the round on screen saved first).
  const playDaily = useCallback(() => {
    // Saved.
    persistNow();
    // Daily.
    setMode("daily");
  }, [persistNow]);
  // Switch to a practice day.
  const playPractice = useCallback(
    (d: string) => {
      // Saved.
      persistNow();
      // The day.
      setPracticeDay(d);
      // Practice.
      setMode("practice");
    },
    [persistNow],
  );
  // "Play again" after a practice round: the next earlier day, round the list, on a fresh board.
  const playAgain = useCallback(() => {
    // Where the current day sits in the list.
    const at = practiceDays.indexOf(practiceDay ?? "");
    // The next one, wrapping.
    setPracticeDay(practiceDays[(at + 1) % practiceDays.length] ?? null);
    // A fresh round even if it comes back to the same day.
    setRound((r) => r + 1);
  }, [practiceDays, practiceDay]);

  // The time shown: final once finished, else clock plus penalties (checks and hints).
  const shownMs = done && finalMs !== null ? finalMs : clock.ms + (checks + hints) * cfg.penaltyMs;

  // The session.
  return {
    // Mode and day.
    mode, day, practiceDays, puzzle, board,
    // The moves.
    move, undo, canUndo: history.length > 0 && !done, clear, untouched,
    // Checks, hints, the days solved, and the clock.
    checks, check, hints, hint, solvedDays, practiceSolved, done, finalMs, shownMs, started,
    // Switching.
    playDaily, playPractice, version,
    // The frame: a daily puzzle, or practice as free play.
    shell: mode === "daily" ? { kind: "daily" } : { kind: "free", onPlayAgain: playAgain },
  };
}

/** The labels the kit's controls show (the game reads them from its own namespace). */
export interface KitLabels {
  /** "Daily". */
  daily: string;
  /** "Practice". */
  practice: string;
  /** The line above the practice days. */
  practiceNote: string;
  /** The label of the group of practice days. */
  practiceDaysLabel: string;
  /** "Time". */
  time: string;
  /** "Check". */
  check: string;
  /** "Undo". */
  undo: string;
  /** "Clear". */
  clear: string;
  /** "Checks: n". */
  checksUsed: string;
  /** "Hint". */
  hint: string;
  /** "n hints (+s s)". */
  hintsUsed: string;
  /** A solved earlier day's accessible name, from its label and its final time ("Mon 2 Nov, solved in 1:23"). */
  daySolved: (date: string, time: string) => string;
  /** A day solved only in practice: its accessible name ("Mon 2 Nov, solved in practice in 1:40"). */
  daySolvedPractice: (date: string, time: string) => string;
  /** The mode switch's group label. */
  modeLabel: string;
}

/**
 * A short, locale-aware label for a day (weekday, day and month, in UTC).
 *
 * @param day the date as YYYY-MM-DD
 * @param locale the page's locale
 * @returns the label
 */
export function dayLabel(day: string, locale: string): string {
  // Formatting can throw on an unknown locale; English then.
  try {
    // The site writes British English, so "en" dates read the British way (Sun 1 Nov).
    const tag = locale === "en" ? "en-GB" : locale;
    // The day at noon UTC, so no time zone moves it.
    return new Intl.DateTimeFormat(tag, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
  } catch {
    // The plain date.
    return day;
  }
}

/**
 * The mode switch (daily or practice) and, in practice, the earlier days, each one solved as the daily puzzle marked
 * with a tick and its time (and named so for a screen reader).
 *
 * @param props the session, the labels and the locale
 * @returns the switch
 */
export function PuzzleModeBar<P, B>(props: { session: PuzzleSession<P, B>; labels: KitLabels; locale: string }) {
  // Shorthands.
  const { session: s, labels: l } = props;
  // The bar.
  return (
    <div className="fg-lpk-modes">
      {/* Daily or practice, as two pressed-or-not buttons. */}
      <div className="fg-lpk-switch" role="group" aria-label={l.modeLabel}>
        <button type="button" className="fg-button fg-lpk-mode" aria-pressed={s.mode === "daily"} onClick={s.playDaily}>
          {l.daily}
        </button>
        <button type="button" className="fg-button fg-lpk-mode" aria-pressed={s.mode === "practice"} onClick={() => s.playPractice(s.practiceDays[0])} disabled={s.practiceDays.length === 0}>
          {l.practice}
        </button>
      </div>
      {/* In practice, the seven earlier days. */}
      {s.mode === "practice" && (
        <div className="fg-lpk-days-wrap">
          <p className="fg-small fg-muted fg-lpk-note">{l.practiceNote}</p>
          <div className="fg-lpk-days" role="group" aria-label={l.practiceDaysLabel}>
            {s.practiceDays.map((d) => {
              // The day's label.
              const label = dayLabel(d, props.locale);
              // Its final time when it was solved as the daily puzzle.
              const solved = s.solvedDays[d];
              // Its best practice time, shown only when the day was not solved as the daily (the day's own result wins).
              const practised = solved === undefined ? s.practiceSolved[d] : undefined;
              // The day's button: a solved day carries a tick and its time, a day solved in practice a replay mark and
              // its time, and each says so in its name (the marks are not the only signal).
              return (
                <button
                  key={d}
                  type="button"
                  className={`fg-chip fg-lpk-day${solved !== undefined ? " fg-lpk-day-solved" : practised !== undefined ? " fg-lpk-day-practised" : ""}`}
                  aria-pressed={s.day === d}
                  aria-label={solved !== undefined ? l.daySolved(label, formatDuration(solved)) : practised !== undefined ? l.daySolvedPractice(label, formatDuration(practised)) : undefined}
                  onClick={() => s.playPractice(d)}
                >
                  {label}
                  {solved !== undefined && (
                    <span className="fg-lpk-day-mark" aria-hidden="true">
                      ✓ {formatDuration(solved)}
                    </span>
                  )}
                  {practised !== undefined && (
                    <span className="fg-lpk-day-mark fg-lpk-day-mark-practice" aria-hidden="true">
                      ↻ {formatDuration(practised)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The clock, the checks and hints used, and the Check, Hint, Undo and Clear buttons, with the latest hint's sentence
 * under them while it applies, and room for a game's own option and its line about the day's puzzle (size and
 * difficulty, shown beside the clock so that the board sits higher on a phone).
 *
 * @param props the session, the labels, what Check and Hint do, the hint on show (null for none), any extra controls
 *              and any line about the puzzle
 * @returns the bar
 */
export function PuzzleHud<P, B>(props: { session: PuzzleSession<P, B>; labels: KitLabels; onCheck: () => void; onHint: () => void; hintNote: string | null; extra?: ReactNode; info?: ReactNode }) {
  // Shorthands.
  const { session: s, labels: l } = props;
  // The bar.
  return (
    <div className="fg-lpk-hud">
      {/* The readouts, and the line about the day's puzzle if the game gives one. */}
      <div className="fg-hud">
        <span className="fg-readout" aria-label={`${l.time} ${formatDuration(s.shownMs)}`}>
          <span className="fg-small fg-muted fg-lpk-readout-label">{l.time}</span> {formatDuration(s.shownMs)}
        </span>
        {s.checks > 0 && <span className="fg-chip">{l.checksUsed}</span>}
        {s.hints > 0 && <span className="fg-chip">{l.hintsUsed}</span>}
        {props.info}
      </div>
      {/* The buttons: Check and Clear wait for a first move, Undo for something to undo; Hint only for the finish. */}
      <div className="fg-buttons fg-lpk-buttons">
        <button type="button" className="fg-button" onClick={props.onCheck} disabled={s.done || s.untouched}>
          {l.check}
        </button>
        <button type="button" className="fg-button" onClick={props.onHint} disabled={s.done}>
          {l.hint}
        </button>
        <button type="button" className="fg-button" onClick={s.undo} disabled={!s.canUndo}>
          {l.undo}
        </button>
        <button type="button" className="fg-button" onClick={s.clear} disabled={s.done || s.untouched}>
          {l.clear}
        </button>
      </div>
      {/* The hint on show, in words (the game lights its cells and reads it out through the live line). */}
      {props.hintNote && (
        <p className="fg-small fg-lpk-hint-note">
          <span className="fg-lpk-hint-label">{l.hint}</span> {props.hintNote}
        </p>
      )}
      {/* The game's own option, if any. */}
      {props.extra}
    </div>
  );
}

/**
 * The board owns the keyboard while it has focus: the site's single-key shortcuts ("0" opens the vendor hubs, "1"
 * the CIDR tool, letters can be bound too) stand down, so typing a bit, an A or an X plays instead of leaving the
 * page (found while testing Hint, 03/11/2026; Exit the Editor and Whack-a-Bug use the same switch). They come back
 * when focus leaves the board, and when the game goes away.
 *
 * @returns focus and blur handlers to spread on the board's element
 */
export function useBoardKeys(): { onFocus: () => void; onBlur: (e: FocusEvent<HTMLElement>) => void } {
  // Back on when the game unmounts with focus still inside.
  useEffect(() => () => setSiteShortcutsSuppressed(false), []);
  // The handlers, stable.
  return useMemo(
    () => ({
      // Focus inside the board: the site's shortcuts stand down.
      onFocus: () => setSiteShortcutsSuppressed(true),
      // Focus leaving the board (not just moving to another cell): they come back.
      onBlur: (e: FocusEvent<HTMLElement>) => {
        // Still inside the board: nothing changes.
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        // Left.
        setSiteShortcutsSuppressed(false);
      },
    }),
    [],
  );
}

/**
 * Keep a game's hint on show only while the board is the one it was given for: any move, undo or clear (a new
 * board) puts it away, with no effect to run.
 *
 * @param board the board now
 * @returns the hint on show (or null), and the setter that stores a new one against the current board
 */
export function useBoardHint<B, H>(board: B | null): [H | null, (hint: H | null) => void] {
  // The hint and the board it was given for.
  const [held, setHeld] = useState<{ board: B | null; hint: H } | null>(null);
  // The current board, for the setter.
  const boardRef = useRef(board);
  // Kept current.
  boardRef.current = board;
  // Stored against the board now (null puts it away).
  const set = useCallback((hint: H | null) => setHeld(hint === null ? null : { board: boardRef.current, hint }), []);
  // Shown only while the board is unchanged.
  return [held && held.board === board ? held.hint : null, set];
}

/**
 * A polite live line for screen readers: the latest message, read out once.
 *
 * @param props the message
 * @returns the hidden live region
 */
export function LiveLine(props: { message: string }) {
  // Visually hidden, read politely.
  return (
    <p className="fg-lpk-sr" aria-live="polite" role="status">
      {props.message}
    </p>
  );
}
