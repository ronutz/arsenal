// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/LogicPuzzleKit.tsx
// ----------------------------------------------------------------------------
// WHAT THE THREE GRID PUZZLES SHARE (Access Points, Bit Balance, Patch Path;
// PRIME 03/11/2026): the clock that starts on the first move, the "Check" and "Hint" counters and their time penalty (a hint
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
// There is no practice mode of its own (PRIME 05/11/2026, folding practice
// into Earlier puzzles): the seven-day practice list this kit used to show is
// gone, and an earlier day is played from GameShell's Earlier puzzles list,
// which reaches back to puzzle #1. On such a page useToday() returns that
// day, so the session plays it as a daily puzzle and the store files its
// state and result apart (src/lib/fun/storage.ts). Check and Clear wait for a first move
// (review R1-13): an untouched board has nothing to check and nothing to
// clear; Hint does not wait, since an empty board has a first step too.
// Each game keeps its own board, rules and drawing; this file holds no strings
// of its own: the game passes its labels in.
// ============================================================================

"use client";

// React's state, effects, refs and memo.
import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from "react";
// The time format.
import { formatDuration } from "@/lib/fun/share";
// The one storage key's helpers.
import { loadRecord, recordResult, saveDailyState, type GameRecord, type LegacyMarks } from "@/lib/fun/storage";
// The switch that stands the site's single-key shortcuts down.
import { setSiteShortcutsSuppressed } from "@/lib/pageCapabilities";

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
 * The mark of a kept daily round, for days played before the marks existed (GameShell's gradeSaved): a finished
 * round is always a solved one (the round ends only when the board is solved); anything else is not finished.
 *
 * @param _day the round's day (not needed: the saved round says it all)
 * @param state the kept state
 * @returns 1 for a finished round, null otherwise
 */
export function gradeSavedRound(_day: string, state: unknown): 0 | 1 | null {
  // Only a saved round marked finished.
  return state !== null && typeof state === "object" && (state as Partial<SavedRound<unknown>>).d === true ? 1 : null;
}

/**
 * The marks the old practice list left (GameShell's legacyMarks): the earlier days solved in practice, kept as
 * extra.practiceSolved (day to best time) until the list was folded into Earlier puzzles (PRIME 05/11/2026), become
 * results of earlier puzzles played later, and the old map leaves the record.
 *
 * @param r the record as stored
 * @returns the marks and the extra field without the map, or null when there is no map
 */
export function legacyPracticeMarks(r: GameRecord): LegacyMarks | null {
  // No map, nothing to do.
  if (!("practiceSolved" in r.extra)) return null;
  // The stored map, if it is one.
  const map = r.extra.practiceSolved && typeof r.extra.practiceSolved === "object" ? (r.extra.practiceSolved as Record<string, unknown>) : {};
  // Each day with a usable time was solved.
  const later = Object.fromEntries(Object.entries(map).filter(([d, ms]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && typeof ms === "number" && Number.isFinite(ms) && ms >= 0).map(([d]) => [d, 1]));
  // The extra field without the map.
  const extra = Object.fromEntries(Object.entries(r.extra).filter(([k]) => k !== "practiceSolved"));
  // Both.
  return { later, extra };
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
  /** The day being played (today, or the earlier day of an earlier puzzle's page), or null before mount. */
  day: string | null;
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
  /** Whether the round is finished. */
  done: boolean;
  /** The final time with penalties, once finished. */
  finalMs: number | null;
  /** The time to show now, penalties included. */
  shownMs: number;
  /** Whether the clock has started. */
  started: boolean;
  /** Bumped after each recorded result, for GameShell's version prop. */
  version: number;
}

/**
 * The shared session: day, puzzle, board with undo, clock, checks, saving and recording.
 *
 * @param cfg see PuzzleSessionConfig
 * @returns the session
 */
export function usePuzzleSession<P, B>(cfg: PuzzleSessionConfig<P, B>): PuzzleSession<P, B> {
  // The config, read through a ref so callbacks stay stable.
  const cfgRef = useRef(cfg);
  // Kept current.
  cfgRef.current = cfg;
  // The day being played: the game's day in play (today, or an earlier puzzle's day on a ?day= page).
  const day = cfg.today;
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
  const live = useRef({ day, board, checks, hints, done, started });
  // Kept current on every render.
  live.current = { day, board, checks, hints, done, started };

  // Save the round in progress with the clock's exact total (the page hidden or closed, a timer, leaving the page).
  const persist = useCallback((ms: number) => {
    // The round as it stands.
    const r = live.current;
    // Only an unfinished round that has started (a finished one was saved at the end).
    if (!r.day || r.board === null || !r.started || r.done) return;
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

  // A new puzzle: restore the day's saved round, or start fresh.
  useEffect(() => {
    // Nothing before mount.
    if (!puzzle || !day) return;
    // The clock back to zero, stopped.
    clock.reset(0);
    // Undo history cleared.
    setHistory([]);
    // The saved round (on an earlier puzzle's page the store shows that day's own round, kept apart).
    const saved = loadRecord(cfgRef.current.gameId).daily[day] as SavedRound<B> | undefined;
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
    // The clock's functions are stable; the effect follows the puzzle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, day]);

  // Save the day's round: board, clock, checks, hints, finished, final time.
  const save = useCallback(
    (b: B, e: number, k: number, h: number, d: boolean, t: number | null) => {
      // Nothing before mount.
      if (!day) return;
      // The round.
      const saved: SavedRound<B> = { b, e, k, h, d, t };
      // Into the one storage key.
      saveDailyState(cfgRef.current.gameId, day, saved);
    },
    [day],
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
      // Recorded as the daily puzzle: today's counts for the streak and the best time; an earlier puzzle's only for
      // the played count and its mark in Earlier puzzles (storage.ts tells the two apart by the page's ?day=).
      if (day) recordResult(cfgRef.current.gameId, { dayKey: day, won: true, score: Math.round(total), higherIsBetter: false, daily: true });
      // The shell re-reads the record.
      setVersion((v) => v + 1);
    },
    [clock, save, day],
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

  // The time shown: final once finished, else clock plus penalties (checks and hints).
  const shownMs = done && finalMs !== null ? finalMs : clock.ms + (checks + hints) * cfg.penaltyMs;

  // The session.
  return {
    // The day.
    day, puzzle, board,
    // The moves.
    move, undo, canUndo: history.length > 0 && !done, clear, untouched,
    // Checks, hints and the clock.
    checks, check, hints, hint, done, finalMs, shownMs, started,
    // The record's version.
    version,
  };
}

/** The labels the kit's controls show (the game reads them from its own namespace). */
export interface KitLabels {
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
