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
//     "!", a broken sign turns red;
//   - Hint (PRIME 03/11/2026) asks the engine for the next step reasoning
//     forces (nextHint), rings the cells to fill, outlines the cells or line
//     the reason is about, and says why in one sentence, on screen and aloud;
//     a wrong bit is pointed out first. It costs what Check costs.
// The two bits differ by digit as well as by colour. The day's difficulty sits
// beside the clock under the grid, so the grid starts higher on a phone; the
// share card says the checks and hints in words (review R1-10, R1-13, 03/11/2026).
// Until Start (PRIME 06/11/2026) the grid is not drawn at all: the kit's
// StartCover holds its place, and Start shows it and starts the clock together.
// ============================================================================

"use client";

// React's state, refs, memo and callbacks.
import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
// Strings.
import { useTranslations } from "next-intl";
// The frame every game sits in.
import GameShell, { type ShellResult } from "./GameShell";
// The shared session, its bars, the hint holder and the live line.
import { LiveLine, PuzzleHud, StartCover, gradeSavedRound, legacyPracticeMarks, useBoardHint, useBoardKeys, usePuzzleSession, type KitLabels } from "./LogicPuzzleKit";
// The engine.
import { BB_ID, BB_N, checkErrors, generate, isSolved, nextHint, ruleErrors, type BbHint, type BbPuzzle } from "@/lib/fun/games/bit-balance/engine";
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

/** A hint on show: its sentence, the cells to fill (or empty), the cells its reason is about, and whether it is a mistake. */
interface ShownHint {
  /** The sentence. */
  text: string;
  /** The cells to fill (or, for a mistake, to empty). */
  target: Set<number>;
  /** The cells the reason is about. */
  area: Set<number>;
  /** Whether the hint points at mistakes. */
  wrong: boolean;
}

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
  // The hint on show, put away as soon as the board changes.
  const [hint, setHint] = useBoardHint<number[], ShownHint>(board);
  // While the grid has focus, 0 and 1 set bits instead of reaching the site's shortcuts (0 and 1 open other pages).
  const boardKeys = useBoardKeys();
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

  // A hint's sentence.
  const hintText = (h: BbHint): string => {
    // The first cell it settles, its row and column from one, and the bit it gets.
    const first = h.set[0] ?? { i: 0, v: 0 };
    // Row and column.
    const r = Math.floor(first.i / BB_N) + 1, c = (first.i % BB_N) + 1, w = first.v;
    // The line the reason names: a row or a column, numbered from one.
    const lk = h.line < BB_N ? "row" : "column", li = (h.line % BB_N) + 1;
    // A wrong bit (or several) on the board.
    if (h.rule === "mistake") return t("hint.mistake", { n: h.set.length });
    // A sign next to a known bit.
    if (h.rule === "sign") return t("hint.sign", { sign: h.sign === 1 ? "equal" : "different", r, c, b: h.bit, w });
    // Two equal bits side by side.
    if (h.rule === "pair") return t("hint.pair", { b: h.bit, lk, li, r, c, w });
    // A cell between two equal bits.
    if (h.rule === "gap") return t("hint.gap", { b: h.bit, lk, li, r, c, w });
    // A line with three of a bit.
    if (h.rule === "count") return t("hint.count", { lk, li, b: h.bit, n: h.set.length, w });
    // A bit that soon breaks a rule.
    if (h.rule === "trial") return t("hint.trial", { r, c, b: h.bit, lk, li, w });
    // Read from the answer, and said so.
    return t("hint.answer", { r, c, w });
  };

  // Hint: find the next step, light its cells, say why, and count it (it costs what a check costs).
  const onHint = () => {
    // Nothing yet, or finished.
    if (!p || !board || s.done) return;
    // The step.
    const h = nextHint(p, board);
    // A solved board has none.
    if (!h) return;
    // Its sentence.
    const text = hintText(h);
    // Counted (adds the penalty and starts the clock).
    s.hint();
    // Shown until the board changes.
    setHint({ text, target: new Set(h.set.map((x) => x.i)), area: new Set(h.area), wrong: h.rule === "mistake" });
    // The first cell to act on becomes the grid's tab stop, so the keyboard lands on it.
    if (h.set.length) setFocus(h.set[0].i);
    // Said, with its cost.
    setSay(`${text} ${tc("hintCost", { s: PENALTY_S })}`);
  };

  // The kit's labels.
  // Start: the grid and the clock together, then the keyboard on the grid's first cell.
  const onStart = () => {
    // Started (the kit saves the round at once).
    s.start();
    // Said.
    setSay(tc("startSay"));
    // The roving tab stop takes focus once the grid is drawn.
    window.setTimeout(() => cellRefs.current[focus]?.focus(), 0);
  };

  // The kit's labels.
  const labels: KitLabels = {
    // The bar.
    time: tc("time"),
    check: tc("check"),
    undo: tc("undo"),
    clear: tc("clear"),
    checksUsed: t("checksUsed", { n: s.checks, s: s.checks * PENALTY_S }),
    // Hints.
    hint: tc("hint"),
    hintsUsed: tc("hintsUsed", { n: s.hints, s: s.hints * PENALTY_S }),
  };

  // The result.
  const result: ShellResult | null = useMemo(() => {
    // Not finished.
    if (!s.done || s.finalMs === null || !s.day || !p) return null;
    // The time.
    const time = formatDuration(s.finalMs);
    // The title line: the puzzle's number (on an earlier puzzle's page, share.ts adds that it was played later).
    const title = t("shareTitle", { n: puzzleNumber(s.day) });
    // A balanced line of bits that says nothing about the grid, then the time and the checks and hints in words (an
    // emoji count meant nothing in a chat).
    const lines = ["⚖️ 0️⃣1️⃣0️⃣1️⃣1️⃣0️⃣", `⏱️ ${time} · ${t("shareChecks", { n: s.checks, s: s.checks * PENALTY_S })} · ${tc("shareHints", { n: s.hints, s: s.hints * PENALTY_S })}`];
    // The time line: the time, then the checks and hints used, when there were any.
    const detail = [tc("solvedIn", { time }), ...(s.checks > 0 ? [t("checksUsed", { n: s.checks, s: s.checks * PENALTY_S })] : []), ...(s.hints > 0 ? [tc("hintsUsed", { n: s.hints, s: s.hints * PENALTY_S })] : [])].join(" · ");
    // The card.
    return {
      // Solved.
      won: true,
      // Headline.
      headline: t("solvedHeadline"),
      // Detail.
      detail,
      // Share text.
      share: shareText({ title, lines, locale: props.locale, slug: BB_ID }),
    };
  }, [s.done, s.finalMs, s.day, s.checks, s.hints, p, t, tc, props.locale]);

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
        <li>{tc("hintRule", { s: PENALTY_S })}</li>
      </ul>
      <p>{t("rules.week")}</p>
    </>
  );

  // Words for a sign, for the cell labels.
  const signWord = (sg: number) => (sg === 1 ? t("signEqual") : t("signDiff"));

  // The game.
  return (
    <GameShell gameId={BB_ID} kind="daily" today={today} rules={rules} result={result} version={s.version} formatBest={(ms) => formatDuration(ms)} gradeSaved={gradeSavedRound} legacyMarks={legacyPracticeMarks}>
      {!p || !board ? (
        // Before mount: a neutral board.
        <div className="fg-grid fg-bb-board fg-bb-loading" style={{ ["--fg-cols" as string]: BB_N }} aria-busy="true">
          <p className="fg-muted fg-small fg-bb-loading-text">{tc("loading")}</p>
        </div>
      ) : (
        <>
          {/* Before Start: the grid's place, empty (none of the grid is on the page yet). */}
          {!s.started ? (
            <StartCover label={tc("start")} note={tc("startNote")} onStart={onStart} className="fg-grid" style={{ ["--fg-cols" as string]: BB_N }} />
          ) : (
          /* The grid. */
          <div className={`fg-grid fg-bb-board${s.done ? " fg-bb-solved" : ""}`} style={{ ["--fg-cols" as string]: BB_N }} role="group" aria-label={t("boardLabel")} {...boardKeys}>
            {board.map((v, i) => {
              // Row and column.
              const r = Math.floor(i / BB_N), c = i % BB_N;
              // The sign to the right and the one below.
              const right = c < BB_N - 1 ? p.h[r * (BB_N - 1) + c] : 0, below = r < BB_N - 1 ? p.v[r * BB_N + c] : 0;
              // Given.
              const given = p.given[i] >= 0;
              // In error: a live rule or a Check.
              const bad = errs.cells.has(i) || checked.has(i);
              // A cell the hint on show acts on (rung, or rung red for a mistake), or one its reason is about (outlined).
              const hinted = hint?.target.has(i) ? (hint.wrong ? " fg-lpk-hint-wrong" : " fg-lpk-hint-target") : hint?.area.has(i) ? " fg-lpk-hint-area" : "";
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
                    className={`fg-cell fg-bb-cell${v === 0 ? " fg-bb-zero" : v === 1 ? " fg-bb-one" : ""}${given ? " fg-cell-given fg-bb-given" : ""}${bad ? " fg-cell-error fg-bb-bad" : ""}${s.done ? " fg-cell-done" : ""}${hinted}`}
                    tabIndex={i === focus ? 0 : -1}
                    aria-label={[t("cellLabel", { r: r + 1, c: c + 1 }), v < 0 ? t("stateEmpty") : t("stateBit", { v }), ...(given ? [t("stateGiven")] : []), ...(bad ? [t("stateBad")] : []), ...(hint?.target.has(i) ? [tc(hint.wrong ? "hintCellWrong" : "hintCellTarget")] : []), ...near].join(", ")}
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
          )}
          {/* Clock, checks, hints, the day's difficulty, the buttons and the hint on show. */}
          <PuzzleHud
            session={s}
            labels={labels}
            onCheck={onCheck}
            onHint={onHint}
            hintNote={hint?.text ?? null}
            info={<span className="fg-chip fg-bb-info">{t("sizeLine", { level: DIFFICULTY[p.weekday] })}</span>}
          />
        </>
      )}
      <LiveLine message={say} />
    </GameShell>
  );
}
