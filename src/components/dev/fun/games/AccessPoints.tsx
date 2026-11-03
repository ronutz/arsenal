// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/AccessPoints.tsx
// ----------------------------------------------------------------------------
// ACCESS POINTS, the board (PRIME 03/11/2026). An office floor plan split into
// zones; one wireless access point per row, column and zone, none touching.
// The engine (src/lib/fun/games/access-points/engine.ts) builds the day's
// floor; this component draws it and takes the moves:
//   - tap cycles empty, mark (×), access point; a quick second tap or a long
//     press places an access point directly; dragging from a cell marks every
//     empty cell it crosses;
//   - keyboard: arrows move, Space or Enter cycles, A places, X marks,
//     Backspace or Delete empties;
//   - an option marks the cells the placed access points rule out;
//   - clashes show at once (a red edge and a "!" on both access points).
// Zones carry a letter as well as a colour, and thick walls between them, so
// colour is never the only cue.
// ============================================================================

"use client";

// React's state, refs, memo and callbacks.
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
// Strings.
import { useTranslations } from "next-intl";
// The frame every game sits in.
import GameShell, { type ShellResult } from "./GameShell";
// The shared session, its bars and the live line.
import { LiveLine, PuzzleHud, PuzzleModeBar, dayLabel, usePuzzleSession, type KitLabels } from "./LogicPuzzleKit";
// The engine.
import { AP_ID, checkErrors, conflicts, generate, isSolved, ruledOut, type ApMark, type ApPuzzle } from "@/lib/fun/games/access-points/engine";
// The puzzle number.
import { puzzleNumber } from "@/lib/fun/daily";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// Today's UTC day, after mount.
import { useToday } from "@/lib/fun/hooks";

/** Seconds added per Check. */
const PENALTY_S = 10;

/** A quick second tap, in milliseconds. */
const DOUBLE_TAP_MS = 320;

/** A long press, in milliseconds. */
const LONG_PRESS_MS = 450;

/** Each zone's class (full names, so every class is written out in the source). */
const ZONE_CLASS = ["fg-ap-z0", "fg-ap-z1", "fg-ap-z2", "fg-ap-z3", "fg-ap-z4", "fg-ap-z5", "fg-ap-z6", "fg-ap-z7"] as const;

/** The weekday's difficulty word, Monday first. */
const DIFFICULTY = ["gentle", "gentle", "medium", "medium", "tricky", "hard", "hard"] as const;

/**
 * Whether a stored value is a board for this puzzle.
 *
 * @param p the puzzle
 * @param x the stored value
 * @returns true when it is an array of n * n marks
 */
function isBoard(p: ApPuzzle, x: unknown): x is ApMark[] {
  // An array of the right length, every entry 0, 1 or 2.
  return Array.isArray(x) && x.length === p.n * p.n && x.every((v) => v === 0 || v === 1 || v === 2);
}

/**
 * The wireless access point glyph: a dot with two arcs above it, in the current colour.
 *
 * @returns the inline SVG
 */
function ApGlyph() {
  // Drawn on a 24-unit square.
  return (
    <svg className="fg-ap-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {/* The outer arc. */}
      <path d="M4.5 10a10.6 10.6 0 0 1 15 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* The inner arc. */}
      <path d="M8 13.5a5.6 5.6 0 0 1 8 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* The access point itself. */}
      <circle cx="12" cy="17.5" r="2.4" fill="currentColor" />
    </svg>
  );
}

/**
 * The Access Points game.
 *
 * @param props the page's locale
 * @returns the game in its shell
 */
export default function AccessPoints(props: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.access-points");
  // The shell's strings.
  const tc = useTranslations("devFun.games.common");
  // Today, after mount.
  const today = useToday();
  // The session.
  const s = usePuzzleSession<ApPuzzle, ApMark[]>({
    // Storage and seed id.
    gameId: AP_ID,
    // Today.
    today,
    // The day's puzzle.
    generate: (day) => generate(day),
    // A fresh board.
    empty: (p) => new Array(p.n * p.n).fill(0) as ApMark[],
    // Stored-board test.
    isBoard,
    // Solved test.
    isSolved,
    // The penalty.
    penaltyMs: PENALTY_S * 1000,
  });
  // The puzzle and board.
  const p = s.puzzle, board = s.board;
  // Auto-mark ruled-out cells.
  const [autoMark, setAutoMark] = useState(false);
  // Cells the last Check marked as wrong (cleared on the next move).
  const [checked, setChecked] = useState<Set<number>>(new Set());
  // The live line.
  const [say, setSay] = useState("");
  // The focused cell (roving tab stop).
  const [focus, setFocus] = useState(0);
  // The cell buttons, for moving focus.
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // The last tap: cell and time, for the double tap.
  const lastTap = useRef<{ cell: number; at: number }>({ cell: -1, at: 0 });
  // Pointer gesture state: the cell pressed, whether it became a drag or a long press, the long-press timer.
  const gesture = useRef<{ cell: number; drag: boolean; long: boolean; timer: number | null; marked: Set<number> }>({ cell: -1, drag: false, long: false, timer: null, marked: new Set() });

  // Live clashes.
  const clash = useMemo(() => (p && board ? conflicts(p, board) : new Set<number>()), [p, board]);
  // Cells ruled out, when the option is on.
  const auto = useMemo(() => (p && board && autoMark ? ruledOut(p, board) : new Set<number>()), [p, board, autoMark]);

  // Coordinates for messages, counted from one.
  const where = useCallback((i: number) => ({ r: Math.floor(i / (p?.n ?? 1)) + 1, c: (i % (p?.n ?? 1)) + 1 }), [p]);

  // Set one cell to a value (a move).
  const setCell = useCallback(
    (i: number, v: ApMark) => {
      // Nothing to do before mount, after the finish, or when unchanged.
      if (!p || !board || s.done || board[i] === v) return;
      // The new board.
      const next = board.slice() as ApMark[];
      // The change.
      next[i] = v;
      // Any Check marks fade on a move.
      setChecked(new Set());
      // Made.
      s.move(next);
      // Its coordinates.
      const { r, c } = where(i);
      // Solved: the shell's result speaks; otherwise describe the move.
      if (isSolved(p, next)) setSay(t("sayDone"));
      // A clash.
      else if (v === 2 && conflicts(p, next).has(i)) setSay(t("sayClash", { r, c }));
      // Placed.
      else if (v === 2) setSay(t("sayPlaced", { r, c }));
      // Marked.
      else if (v === 1) setSay(t("sayMarked", { r, c }));
      // Emptied.
      else setSay(t("sayCleared", { r, c }));
    },
    [p, board, s, where, t],
  );

  // Mark several cells at once (a drag), as one move.
  const markMany = useCallback(
    (cells: Set<number>) => {
      // Before mount or after the finish.
      if (!p || !board || s.done) return;
      // The new board.
      const next = board.slice() as ApMark[];
      // Only empty cells take a mark.
      let changed = 0;
      // Each cell crossed.
      for (const i of cells) {
        // Empty ones.
        if (next[i] === 0) {
          // Marked.
          next[i] = 1;
          // Counted.
          changed++;
        }
      }
      // Nothing new.
      if (!changed) return;
      // Check marks fade.
      setChecked(new Set());
      // One move.
      s.move(next);
      // Said.
      setSay(t("sayMarkedMany", { n: changed }));
    },
    [p, board, s, t],
  );

  // The cell under a pointer.
  const cellAt = (e: PointerEvent<HTMLDivElement>): number => {
    // No puzzle, no cell.
    if (!p) return -1;
    // The board's box.
    const box = e.currentTarget.getBoundingClientRect();
    // Column and row under the pointer.
    const c = Math.floor(((e.clientX - box.left) / box.width) * p.n), r = Math.floor(((e.clientY - box.top) / box.height) * p.n);
    // Inside, or none.
    return r >= 0 && r < p.n && c >= 0 && c < p.n ? r * p.n + c : -1;
  };

  // Pointer down: arm the long press and the drag.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    // Only the primary button or a touch.
    if (e.button !== 0 || !p || s.done) return;
    // The cell.
    const cell = cellAt(e);
    // Outside the cells.
    if (cell < 0) return;
    // The gesture.
    const g = gesture.current;
    // A fresh one.
    g.cell = cell;
    g.drag = false;
    g.long = false;
    g.marked = new Set();
    // The long-press timer places an access point.
    g.timer = window.setTimeout(() => {
      // Became a long press.
      g.long = true;
      // Placed directly.
      setCell(cell, 2);
    }, LONG_PRESS_MS);
  };

  // Pointer move: crossing into another cell turns the press into a marking drag.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    // Only during a press.
    const g = gesture.current;
    // No press.
    if (g.cell < 0 || g.long) return;
    // The cell under the pointer.
    const cell = cellAt(e);
    // Same cell, or outside: nothing yet.
    if (cell < 0 || (cell === g.cell && !g.drag)) return;
    // Now a drag: the long press is off.
    if (!g.drag) {
      // A drag.
      g.drag = true;
      // No long press.
      if (g.timer !== null) window.clearTimeout(g.timer);
      // The starting cell is marked too.
      g.marked.add(g.cell);
    }
    // This cell is marked.
    g.marked.add(cell);
  };

  // Pointer up: a drag marks what it crossed; a tap is left to the click.
  const onUp = () => {
    // The gesture.
    const g = gesture.current;
    // The long-press timer is no longer needed.
    if (g.timer !== null) window.clearTimeout(g.timer);
    // A drag ends as one marking move.
    if (g.drag) markMany(g.marked);
    // Released (the click that follows reads drag and long to know whether to act).
    g.timer = null;
  };

  // A click (mouse, tap, Enter or Space): cycle, or place on a quick second tap.
  const onCellClick = (i: number) => {
    // The gesture that led here.
    const g = gesture.current;
    // A drag or a long press already acted.
    if ((g.drag || g.long) && g.cell === i) {
      // Forget the gesture.
      g.cell = -1;
      g.drag = false;
      g.long = false;
      // Done.
      return;
    }
    // Forget the gesture.
    g.cell = -1;
    // No board yet.
    if (!board) return;
    // Now.
    const now = performance.now();
    // A quick second tap on the same cell places an access point.
    const dbl = lastTap.current.cell === i && now - lastTap.current.at < DOUBLE_TAP_MS;
    // Remembered for the next tap (a double tap does not chain into a triple).
    lastTap.current = dbl ? { cell: -1, at: 0 } : { cell: i, at: now };
    // Roving focus follows.
    setFocus(i);
    // Place, or cycle empty, mark, access point.
    setCell(i, dbl ? 2 : (((board[i] + 1) % 3) as ApMark));
  };

  // Keys on a cell.
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    // No puzzle.
    if (!p) return;
    // Row and column.
    const r = Math.floor(i / p.n), c = i % p.n;
    // The cell to move to, if an arrow was pressed.
    let to = -1;
    // Arrows.
    if (e.key === "ArrowUp" && r > 0) to = i - p.n;
    else if (e.key === "ArrowDown" && r < p.n - 1) to = i + p.n;
    else if (e.key === "ArrowLeft" && c > 0) to = i - 1;
    else if (e.key === "ArrowRight" && c < p.n - 1) to = i + 1;
    // A move of focus.
    if (to >= 0) {
      // No scrolling.
      e.preventDefault();
      // The tab stop moves.
      setFocus(to);
      // And the focus.
      cellRefs.current[to]?.focus();
      // Done.
      return;
    }
    // A places an access point.
    if (e.key === "a" || e.key === "A") {
      // Handled.
      e.preventDefault();
      // Placed (or removed when already there).
      setCell(i, board?.[i] === 2 ? 0 : 2);
    } else if (e.key === "x" || e.key === "X") {
      // Handled.
      e.preventDefault();
      // Marked (or unmarked).
      setCell(i, board?.[i] === 1 ? 0 : 1);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      // Handled.
      e.preventDefault();
      // Emptied.
      setCell(i, 0);
    }
  };

  // Check: mark the wrong cells and count the check.
  const onCheck = () => {
    // Nothing yet.
    if (!p || !board || s.done) return;
    // The errors.
    const bad = checkErrors(p, board);
    // Shown until the next move.
    setChecked(bad);
    // Counted (adds the penalty).
    s.check();
    // Said.
    setSay(t("sayChecked", { n: bad.size, s: PENALTY_S }));
  };

  // The kit's labels.
  const labels: KitLabels = {
    // Mode switch.
    daily: tc("daily"),
    practice: tc("practice"),
    modeLabel: t("modeLabel"),
    // Practice.
    practiceNote: t("practiceNote"),
    practiceDaysLabel: t("practiceDaysLabel"),
    // The bar.
    time: tc("time"),
    check: tc("check"),
    undo: tc("undo"),
    clear: tc("clear"),
    checksUsed: t("checksUsed", { n: s.checks, s: s.checks * PENALTY_S }),
  };

  // The result, once solved.
  const result: ShellResult | null = useMemo(() => {
    // Not finished.
    if (!s.done || s.finalMs === null || !s.day || !p) return null;
    // The time.
    const time = formatDuration(s.finalMs);
    // The title line: number for a daily, date for practice.
    const title = s.mode === "daily" ? t("shareTitle", { n: puzzleNumber(s.day) }) : t("shareTitlePractice", { date: dayLabel(s.day, props.locale) });
    // The emoji line: one signal per access point, then the time and either a bolt (no checks) or the checks used.
    const lines = ["📶".repeat(p.n), `⏱️ ${time} ${s.checks === 0 ? "⚡" : "🔍".repeat(Math.min(s.checks, 5))}`];
    // The card.
    return {
      // Always a win: the round ends only when solved.
      won: true,
      // The headline.
      headline: t("solvedHeadline"),
      // The time line.
      detail: s.checks === 0 ? tc("solvedIn", { time }) : `${tc("solvedIn", { time })} · ${t("checksUsed", { n: s.checks, s: s.checks * PENALTY_S })}`,
      // The share card.
      share: shareText({ title, lines, locale: props.locale, slug: AP_ID }),
    };
  }, [s.done, s.finalMs, s.day, s.mode, s.checks, p, t, tc, props.locale]);

  // The rules.
  const rules = (
    <>
      <p>{t("rules.goal")}</p>
      <ul>
        <li>{t("rules.one")}</li>
        <li>{t("rules.touch")}</li>
        <li>{t("rules.tap")}</li>
        <li>{t("rules.keys")}</li>
        <li>{t("rules.check", { s: PENALTY_S })}</li>
      </ul>
      <p>{t("rules.week")}</p>
    </>
  );

  // The game in its shell.
  return (
    <GameShell gameId={AP_ID} kind="daily" today={today} rules={rules} result={result} version={s.version} formatBest={(ms) => formatDuration(ms)}>
      <PuzzleModeBar session={s} labels={labels} locale={props.locale} />
      {!p || !board ? (
        // Before mount: a neutral board, the same on the server and the first client render.
        <div className="fg-grid fg-ap-board fg-ap-loading" style={{ ["--fg-cols" as string]: 6 }} aria-busy="true">
          <p className="fg-muted fg-small fg-ap-loading-text">{tc("loading")}</p>
        </div>
      ) : (
        <>
          {/* The day's size and difficulty. */}
          <p className="fg-chip fg-ap-info">{t("sizeLine", { n: p.n, level: DIFFICULTY[p.weekday] })}</p>
          {/* The floor plan. */}
          <div
            className={`fg-grid fg-ap-board${s.done ? " fg-ap-solved" : ""}`}
            style={{ ["--fg-cols" as string]: p.n }}
            role="group"
            aria-label={t("boardLabel", { n: p.n })}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            {board.map((v, i) => {
              // Row, column and zone.
              const r = Math.floor(i / p.n), c = i % p.n, z = p.zones[i];
              // Walls on the sides that face another zone (or the outside).
              const walls = [
                // Top.
                r === 0 || p.zones[i - p.n] !== z ? " fg-ap-wt" : "",
                // Right.
                c === p.n - 1 || p.zones[i + 1] !== z ? " fg-ap-wr" : "",
                // Bottom.
                r === p.n - 1 || p.zones[i + p.n] !== z ? " fg-ap-wb" : "",
                // Left.
                c === 0 || p.zones[i - 1] !== z ? " fg-ap-wl" : "",
              ].join("");
              // Shown as a mark: a real mark, or an automatic one on an empty cell.
              const autoX = v === 0 && auto.has(i);
              // In clash, or marked wrong by Check.
              const bad = (v === 2 && clash.has(i)) || checked.has(i);
              // The zone's letter.
              const letter = String.fromCharCode(65 + z);
              // What the cell holds, in words.
              const state = v === 2 ? t("stateAp") : v === 1 ? t("stateMark") : autoX ? t("stateRuledOut") : t("stateEmpty");
              // The cell.
              return (
                <button
                  key={i}
                  ref={(el) => {
                    // Kept for focus moves.
                    cellRefs.current[i] = el;
                  }}
                  type="button"
                  className={`fg-cell fg-ap-cell ${ZONE_CLASS[z % ZONE_CLASS.length]}${walls}${v === 2 ? " fg-ap-has" : ""}${bad ? " fg-cell-error fg-ap-bad" : ""}${s.done && v === 2 ? " fg-cell-done" : ""}`}
                  tabIndex={i === focus ? 0 : -1}
                  aria-label={`${t("cellLabel", { r: r + 1, c: c + 1, zone: letter })}: ${state}${bad ? `, ${t("stateBad")}` : ""}`}
                  onClick={() => onCellClick(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  onFocus={() => setFocus(i)}
                  disabled={s.done}
                >
                  <span className="fg-ap-tag" aria-hidden="true">
                    {letter}
                  </span>
                  {v === 2 && <ApGlyph />}
                  {(v === 1 || autoX) && (
                    <span className={autoX ? "fg-ap-x fg-ap-x-auto" : "fg-ap-x"} aria-hidden="true">
                      ×
                    </span>
                  )}
                  {bad && (
                    <span className="fg-ap-alert" aria-hidden="true">
                      !
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Clock, checks and buttons, with the auto-mark option. */}
          <PuzzleHud
            session={s}
            labels={labels}
            onCheck={onCheck}
            extra={
              <label className="fg-ap-option">
                <input type="checkbox" className="fg-ap-check" checked={autoMark} onChange={(e) => setAutoMark(e.target.checked)} />
                <span>{t("autoMark")}</span>
              </label>
            }
          />
          {/* Before the first move: the clock waits. */}
          {!s.started && <p className="fg-small fg-muted fg-ap-hint">{t("clockHint")}</p>}
        </>
      )}
      <LiveLine message={say} />
    </GameShell>
  );
}

