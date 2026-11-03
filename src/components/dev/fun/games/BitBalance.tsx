// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/BitBalance.tsx
// ----------------------------------------------------------------------------
// BIT BALANCE, the board (PRIME 03/11/2026). A 6 x 6 grid of bits: three 0s
// and three 1s in every row and column, never three equal bits in a line, and
// every "=" or "×" sign between two cells obeyed. The engine
// (src/lib/fun/games/bit-balance/engine.ts) builds the day's grid; this
// component draws it and takes the moves:
//   - tap cycles empty, 0, 1;
//   - keyboard: arrows move, Space or Enter cycles, 0 and 1 set, Backspace or
//     Delete empties;
//   - a broken rule shows at once: the cells involved get a red edge and a
//     "!", a broken sign turns red.
// The two bits differ by digit as well as by colour.
// ============================================================================

"use client";

// React's state, refs, memo and callbacks.
import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
// Strings.
import { useTranslations } from "next-intl";
// The frame every game sits in.
import GameShell, { type ShellResult } from "./GameShell";
// The shared session, its bars and the live line.
import { LiveLine, PuzzleHud, PuzzleModeBar, dayLabel, usePuzzleSession, type KitLabels } from "./LogicPuzzleKit";
// The engine.
import { BB_ID, BB_N, checkErrors, generate, isSolved, ruleErrors, type BbPuzzle } from "@/lib/fun/games/bit-balance/engine";
// The puzzle number.
import { puzzleNumber } from "@/lib/fun/daily";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// Today's UTC day, after mount.
import { useToday } from "@/lib/fun/hooks";

/** Seconds added per Check. */
const PENALTY_S = 10;

/** The weekday's difficulty word, Monday first. */
const DIFFICULTY = ["gentle", "gentle", "medium", "medium", "tricky", "hard", "hard"] as const;

/**
 * Whether a stored value is a board for this puzzle (and keeps its givens).
 *
 * @param p the puzzle
 * @param x the stored value
 * @returns true when usable
 */
function isBoard(p: BbPuzzle, x: unknown): x is number[] {
  // 36 values, each -1, 0 or 1, the givens untouched.
  return Array.isArray(x) && x.length === BB_N * BB_N && x.every((v, i) => (v === -1 || v === 0 || v === 1) && (p.given[i] < 0 || v === p.given[i]));
}

/**
 * The Bit Balance game.
 *
 * @param props the page's locale
 * @returns the game in its shell
 */
export default function BitBalance(props: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.bit-balance");
  // The shell's strings.
  const tc = useTranslations("devFun.games.common");
  // Today, after mount.
  const today = useToday();
  // The session.
  const s = usePuzzleSession<BbPuzzle, number[]>({
    // Storage and seed id.
    gameId: BB_ID,
    // Today.
    today,
    // The day's puzzle.
    generate: (day) => generate(day),
    // A fresh board: the givens.
    empty: (p) => p.given.slice(),
    // Stored-board test.
    isBoard,
    // Solved test.
    isSolved,
    // The penalty.
    penaltyMs: PENALTY_S * 1000,
  });
  // The puzzle and board.
  const p = s.puzzle, board = s.board;
  // Cells the last Check marked wrong (cleared on the next move).
  const [checked, setChecked] = useState<Set<number>>(new Set());
  // The live line.
  const [say, setSay] = useState("");
  // The focused cell.
  const [focus, setFocus] = useState(0);
  // The cell buttons.
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Live rule errors.
  const errs = useMemo(() => (p && board ? ruleErrors(p, board) : { cells: new Set<number>(), signs: new Set<string>() }), [p, board]);

  // Set one cell.
  const setCell = useCallback(
    (i: number, v: number) => {
      // Before mount, after the finish, a given, or no change.
      if (!p || !board || s.done || p.given[i] >= 0 || board[i] === v) return;
      // The new board.
      const next = board.slice();
      // The change.
      next[i] = v;
      // Check marks fade.
      setChecked(new Set());
      // Made.
      s.move(next);
      // Row and column, from one.
      const r = Math.floor(i / BB_N) + 1, c = (i % BB_N) + 1;
      // Solved.
      if (isSolved(p, next)) setSay(t("sayDone"));
      // A rule broken by this cell.
      else if (v >= 0 && ruleErrors(p, next).cells.has(i)) setSay(t("sayBroken", { r, c, v }));
      // Set.
      else if (v >= 0) setSay(t("saySet", { r, c, v }));
      // Emptied.
      else setSay(t("sayCleared", { r, c }));
    },
    [p, board, s, t],
  );

  // Keys on a cell.
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    // Row and column.
    const r = Math.floor(i / BB_N), c = i % BB_N;
    // The arrow target, if any.
    let to = -1;
    // Arrows.
    if (e.key === "ArrowUp" && r > 0) to = i - BB_N;
    else if (e.key === "ArrowDown" && r < BB_N - 1) to = i + BB_N;
    else if (e.key === "ArrowLeft" && c > 0) to = i - 1;
    else if (e.key === "ArrowRight" && c < BB_N - 1) to = i + 1;
    // Focus moves.
    if (to >= 0) {
      // No scrolling.
      e.preventDefault();
      // The tab stop.
      setFocus(to);
      // The focus.
      cellRefs.current[to]?.focus();
      // Done.
      return;
    }
    // 0 and 1 set directly.
    if (e.key === "0" || e.key === "1") {
      // Handled.
      e.preventDefault();
      // Set.
      setCell(i, Number(e.key));
    } else if (e.key === "Backspace" || e.key === "Delete") {
      // Handled.
      e.preventDefault();
      // Emptied.
      setCell(i, -1);
    }
  };

  // Check.
  const onCheck = () => {
    // Nothing yet.
    if (!p || !board || s.done) return;
    // The wrong cells.
    const bad = checkErrors(p, board);
    // Shown.
    setChecked(bad);
    // Counted.
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

  // The result.
  const result: ShellResult | null = useMemo(() => {
    // Not finished.
    if (!s.done || s.finalMs === null || !s.day || !p) return null;
    // The time.
    const time = formatDuration(s.finalMs);
    // Title: number or date.
    const title = s.mode === "daily" ? t("shareTitle", { n: puzzleNumber(s.day) }) : t("shareTitlePractice", { date: dayLabel(s.day, props.locale) });
    // A balanced line of bits that says nothing about the grid, then the time.
    const lines = ["⚖️ 0️⃣1️⃣0️⃣1️⃣1️⃣0️⃣", `⏱️ ${time} ${s.checks === 0 ? "⚡" : "🔍".repeat(Math.min(s.checks, 5))}`];
    // The card.
    return {
      // Solved.
      won: true,
      // Headline.
      headline: t("solvedHeadline"),
      // Detail.
      detail: s.checks === 0 ? tc("solvedIn", { time }) : `${tc("solvedIn", { time })} · ${t("checksUsed", { n: s.checks, s: s.checks * PENALTY_S })}`,
      // Share text.
      share: shareText({ title, lines, locale: props.locale, slug: BB_ID }),
    };
  }, [s.done, s.finalMs, s.day, s.mode, s.checks, p, t, tc, props.locale]);

  // The rules.
  const rules = (
    <>
      <p>{t("rules.goal")}</p>
      <ul>
        <li>{t("rules.balance")}</li>
        <li>{t("rules.run")}</li>
        <li>{t("rules.signs")}</li>
        <li>{t("rules.tap")}</li>
        <li>{t("rules.check", { s: PENALTY_S })}</li>
      </ul>
      <p>{t("rules.week")}</p>
    </>
  );

  // Words for a sign, for the cell labels.
  const signWord = (sg: number) => (sg === 1 ? t("signEqual") : t("signDiff"));

  // The game.
  return (
    <GameShell gameId={BB_ID} kind="daily" today={today} rules={rules} result={result} version={s.version} formatBest={(ms) => formatDuration(ms)}>
      <PuzzleModeBar session={s} labels={labels} locale={props.locale} />
      {!p || !board ? (
        // Before mount: a neutral board.
        <div className="fg-grid fg-bb-board fg-bb-loading" style={{ ["--fg-cols" as string]: BB_N }} aria-busy="true">
          <p className="fg-muted fg-small fg-bb-loading-text">{tc("loading")}</p>
        </div>
      ) : (
        <>
          {/* The day's difficulty. */}
          <p className="fg-chip fg-bb-info">{t("sizeLine", { level: DIFFICULTY[p.weekday] })}</p>
          {/* The grid. */}
          <div className={`fg-grid fg-bb-board${s.done ? " fg-bb-solved" : ""}`} style={{ ["--fg-cols" as string]: BB_N }} role="group" aria-label={t("boardLabel")}>
            {board.map((v, i) => {
              // Row and column.
              const r = Math.floor(i / BB_N), c = i % BB_N;
              // The sign to the right and the one below.
              const right = c < BB_N - 1 ? p.h[r * (BB_N - 1) + c] : 0, below = r < BB_N - 1 ? p.v[r * BB_N + c] : 0;
              // Given.
              const given = p.given[i] >= 0;
              // In error: a live rule or a Check.
              const bad = errs.cells.has(i) || checked.has(i);
              // Signs touching this cell, in words, for its label.
              const near: string[] = [];
              // To the right.
              if (right) near.push(t("signRight", { sign: signWord(right) }));
              // Below.
              if (below) near.push(t("signBelow", { sign: signWord(below) }));
              // To the left.
              if (c > 0 && p.h[r * (BB_N - 1) + c - 1]) near.push(t("signLeft", { sign: signWord(p.h[r * (BB_N - 1) + c - 1]) }));
              // Above.
              if (r > 0 && p.v[(r - 1) * BB_N + c]) near.push(t("signAbove", { sign: signWord(p.v[(r - 1) * BB_N + c]) }));
              // The slot: the cell and its two signs.
              return (
                <div key={i} className="fg-bb-slot">
                  <button
                    ref={(el) => {
                      // Kept for focus moves.
                      cellRefs.current[i] = el;
                    }}
                    type="button"
                    className={`fg-cell fg-bb-cell${v === 0 ? " fg-bb-zero" : v === 1 ? " fg-bb-one" : ""}${given ? " fg-cell-given fg-bb-given" : ""}${bad ? " fg-cell-error fg-bb-bad" : ""}${s.done ? " fg-cell-done" : ""}`}
                    tabIndex={i === focus ? 0 : -1}
                    aria-label={[t("cellLabel", { r: r + 1, c: c + 1 }), v < 0 ? t("stateEmpty") : t("stateBit", { v }), ...(given ? [t("stateGiven")] : []), ...(bad ? [t("stateBad")] : []), ...near].join(", ")}
                    aria-disabled={given || s.done}
                    onClick={() => {
                      // The tab stop follows.
                      setFocus(i);
                      // Cycle empty, 0, 1.
                      setCell(i, v === -1 ? 0 : v === 0 ? 1 : -1);
                    }}
                    onKeyDown={(e) => onKey(e, i)}
                    onFocus={() => setFocus(i)}
                  >
                    {v >= 0 ? v : ""}
                    {bad && (
                      <span className="fg-bb-alert" aria-hidden="true">
                        !
                      </span>
                    )}
                  </button>
                  {right > 0 && (
                    <span className={`fg-bb-sign fg-bb-sign-r${errs.signs.has(`h${r * (BB_N - 1) + c}`) ? " fg-bb-sign-bad" : ""}`} aria-hidden="true">
                      {right === 1 ? "=" : "×"}
                    </span>
                  )}
                  {below > 0 && (
                    <span className={`fg-bb-sign fg-bb-sign-b${errs.signs.has(`v${r * BB_N + c}`) ? " fg-bb-sign-bad" : ""}`} aria-hidden="true">
                      {below === 1 ? "=" : "×"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Clock, checks and buttons. */}
          <PuzzleHud session={s} labels={labels} onCheck={onCheck} />
          {/* Before the first move. */}
          {!s.started && <p className="fg-small fg-muted fg-bb-hint">{t("clockHint")}</p>}
        </>
      )}
      <LiveLine message={say} />
    </GameShell>
  );
}
