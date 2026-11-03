// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/LogicPuzzleKit.tsx
// ----------------------------------------------------------------------------
// WHAT THE THREE GRID PUZZLES SHARE (Access Points, Bit Balance, Patch Path;
// PRIME 03/11/2026): the daily-or-practice switch, the clock that starts on the
// first move, the "Check" counter and its time penalty, undo and clear, the
// saved state of today's puzzle (restored on load, a finished one shown again),
// recording the result, and a polite live line for screen readers.
//
// Practice offers the previous seven days' puzzles (rebuilt from their seeds),
// never a future one, and does not touch the streak or the saved daily state.
// Each game keeps its own board, rules and drawing; this file holds no strings
// of its own: the game passes its labels in.
// ============================================================================

"use client";

// React's state, effects, refs and memo.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
// The day arithmetic.
import { addDays } from "@/lib/fun/daily";
// The stopwatch.
import { useStopwatch } from "@/lib/fun/hooks";
// The time format.
import { formatDuration } from "@/lib/fun/share";
// The one storage key's helpers.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";

/** How many earlier days practice offers. */
export const PRACTICE_DAYS = 7;

/** What a game saves for a daily puzzle. */
interface SavedRound<B> {
  /** The board. */
  b: B;
  /** Milliseconds on the clock (without penalties). */
  e: number;
  /** Checks used. */
  k: number;
  /** Finished. */
  d: boolean;
  /** The final time with penalties, once finished. */
  t: number | null;
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
  /** Milliseconds added to the time per "Check". */
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
  /** Checks used. */
  checks: number;
  /** Count a check (the game shows the errors). */
  check: () => void;
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
  // The day's puzzle, built once per day.
  const puzzle = useMemo(() => (day ? cfgRef.current.generate(day) : null), [day]);
  // The board.
  const [board, setBoard] = useState<B | null>(null);
  // Earlier boards, for undo.
  const [history, setHistory] = useState<B[]>([]);
  // Checks used.
  const [checks, setChecks] = useState(0);
  // Finished.
  const [done, setDone] = useState(false);
  // The final time.
  const [finalMs, setFinalMs] = useState<number | null>(null);
  // Time already on the clock from a restored round.
  const [offset, setOffset] = useState(0);
  // The record version for GameShell.
  const [version, setVersion] = useState(0);
  // The clock for this sitting.
  const sw = useStopwatch();
  // Whether the clock has started for this round (a restored round counts as started).
  const [started, setStarted] = useState(false);

  // A new puzzle: restore today's saved round, or start fresh.
  useEffect(() => {
    // Nothing before mount.
    if (!puzzle || !day) return;
    // The clock back to zero for this sitting.
    sw.reset();
    // Undo history cleared.
    setHistory([]);
    // The saved round, for the daily puzzle only.
    const saved = mode === "daily" ? (loadRecord(cfgRef.current.gameId).daily[day] as SavedRound<B> | undefined) : undefined;
    // A usable saved round.
    if (saved && typeof saved === "object" && cfgRef.current.isBoard(puzzle, saved.b)) {
      // Its board.
      setBoard(saved.b);
      // Its clock.
      setOffset(typeof saved.e === "number" ? saved.e : 0);
      // Its checks.
      setChecks(typeof saved.k === "number" ? saved.k : 0);
      // Finished or not.
      setDone(saved.d === true);
      // Its final time.
      setFinalMs(typeof saved.t === "number" ? saved.t : null);
      // It had started.
      setStarted(true);
      // Restored.
      return;
    }
    // A fresh board.
    setBoard(cfgRef.current.empty(puzzle));
    // Nothing on the clock.
    setOffset(0);
    // No checks.
    setChecks(0);
    // Not finished.
    setDone(false);
    // No time.
    setFinalMs(null);
    // Not started.
    setStarted(false);
    // The stopwatch's reset is stable; the effect follows the puzzle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, day, mode]);

  // Save today's round (daily only).
  const save = useCallback(
    (b: B, e: number, k: number, d: boolean, t: number | null) => {
      // Practice rounds are not saved.
      if (mode !== "daily" || !day) return;
      // The round.
      const round: SavedRound<B> = { b, e, k, d, t };
      // Into the one storage key.
      saveDailyState(cfgRef.current.gameId, day, round);
    },
    [mode, day],
  );

  // Finish: stop the clock, record, save.
  const finish = useCallback(
    (b: B, k: number) => {
      // The exact time of this sitting, plus what was restored.
      const raw = offset + sw.stop();
      // Penalties added.
      const total = raw + k * cfgRef.current.penaltyMs;
      // Finished.
      setDone(true);
      // Its time.
      setFinalMs(total);
      // Saved.
      save(b, raw, k, true, total);
      // Recorded: a daily round counts for the streak and the best time; practice only counts as played.
      if (day) recordResult(cfgRef.current.gameId, mode === "daily" ? { dayKey: day, won: true, score: Math.round(total), higherIsBetter: false, daily: true } : { dayKey: day, won: true, daily: false });
      // The shell re-reads the record.
      setVersion((v) => v + 1);
    },
    [offset, sw, save, day, mode],
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
      // The clock starts on the first move (or resumes after a reload).
      if (!sw.running) sw.start();
      // Started.
      setStarted(true);
      // Solved: finish.
      if (cfgRef.current.isSolved(puzzle, next)) finish(next, checks);
      // Otherwise saved as it stands.
      else save(next, offset + sw.elapsed, checks, false, null);
    },
    [done, board, puzzle, sw, finish, save, offset, checks],
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
    save(prev, offset + sw.elapsed, checks, false, null);
  }, [done, history, save, offset, sw.elapsed, checks]);

  // Clear (undoable).
  const clear = useCallback(() => {
    // Only while playing.
    if (done || board === null || puzzle === null) return;
    // The fresh board.
    const fresh = cfgRef.current.empty(puzzle);
    // Pushed and shown.
    setHistory((h) => [...h, board]);
    // Shown.
    setBoard(fresh);
    // Saved.
    save(fresh, offset + sw.elapsed, checks, false, null);
  }, [done, board, puzzle, save, offset, sw.elapsed, checks]);

  // A check.
  const check = useCallback(() => {
    // Only while playing.
    if (done || board === null) return;
    // One more.
    const k = checks + 1;
    // Counted.
    setChecks(k);
    // The clock starts if it had not (a check is a move of sorts).
    if (!sw.running) sw.start();
    // Started.
    setStarted(true);
    // Saved.
    save(board, offset + sw.elapsed, k, false, null);
  }, [done, board, checks, sw, save, offset]);

  // Switch to today's puzzle.
  const playDaily = useCallback(() => setMode("daily"), []);
  // Switch to a practice day.
  const playPractice = useCallback((d: string) => {
    // The day.
    setPracticeDay(d);
    // Practice.
    setMode("practice");
  }, []);

  // The time shown: final once finished, else clock plus penalties.
  const shownMs = done && finalMs !== null ? finalMs : offset + sw.elapsed + checks * cfg.penaltyMs;

  // The session.
  return { mode, day, practiceDays, puzzle, board, move, undo, canUndo: history.length > 0 && !done, clear, checks, check, done, finalMs, shownMs, started, playDaily, playPractice, version };
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
 * The mode switch (daily or practice) and, in practice, the earlier days.
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
            {s.practiceDays.map((d) => (
              <button key={d} type="button" className="fg-chip fg-lpk-day" aria-pressed={s.day === d} onClick={() => s.playPractice(d)}>
                {dayLabel(d, props.locale)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The clock, the checks used, and the Check, Undo and Clear buttons, with room for a game's own option.
 *
 * @param props the session, the labels, what Check does, and any extra controls
 * @returns the bar
 */
export function PuzzleHud<P, B>(props: { session: PuzzleSession<P, B>; labels: KitLabels; onCheck: () => void; extra?: ReactNode }) {
  // Shorthands.
  const { session: s, labels: l } = props;
  // The bar.
  return (
    <div className="fg-lpk-hud">
      {/* The readouts. */}
      <div className="fg-hud">
        <span className="fg-readout" aria-label={`${l.time} ${formatDuration(s.shownMs)}`}>
          <span className="fg-small fg-muted fg-lpk-readout-label">{l.time}</span> {formatDuration(s.shownMs)}
        </span>
        {s.checks > 0 && <span className="fg-chip">{l.checksUsed}</span>}
      </div>
      {/* The buttons. */}
      <div className="fg-buttons">
        <button type="button" className="fg-button" onClick={props.onCheck} disabled={s.done}>
          {l.check}
        </button>
        <button type="button" className="fg-button" onClick={s.undo} disabled={!s.canUndo}>
          {l.undo}
        </button>
        <button type="button" className="fg-button" onClick={s.clear} disabled={s.done}>
          {l.clear}
        </button>
      </div>
      {/* The game's own option, if any. */}
      {props.extra}
    </div>
  );
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
