// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/PatchPath.tsx
// ----------------------------------------------------------------------------
// PATCH PATH, the board (PRIME 03/11/2026). A patch panel with numbered
// ports; one cable from port 1 to the last port through every cell, the ports
// in order, around any cable ducts. The engine
// (src/lib/fun/games/patch-path/engine.ts) builds the day's panel; this
// component draws it and takes the moves:
//   - drag from port 1 (or from the cable's end) to run the cable; drag back
//     over it to pull it back; press any cell of the cable to cut it there;
//   - or click a cell next to the cable's end to extend it;
//   - keyboard: the panel takes focus; arrows extend the cable (an arrow back
//     along it pulls it back), Backspace undoes a step;
//   - a port reached out of order, or the last port before every cell is
//     covered, is refused and said why.
// The cable and the ducts are drawn in one inline SVG over the cells.
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
import { PP_ID, canStep, checkErrors, generate, isSolved, type PpPuzzle } from "@/lib/fun/games/patch-path/engine";
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

/** Why a step was refused. */
type Refusal = "order" | "last" | "wall" | "far" | "start" | null;

/**
 * Whether a stored value is a legal partial cable for this puzzle.
 *
 * @param p the puzzle
 * @param x the stored value
 * @returns true when usable
 */
function isBoard(p: PpPuzzle, x: unknown): x is number[] {
  // An array of distinct in-range cells.
  if (!Array.isArray(x) || x.length > p.n * p.n || !x.every((v) => Number.isInteger(v) && v >= 0 && v < p.n * p.n)) return false;
  // Starting at port 1 and stepping legally, when not empty.
  return x.length === 0 || (x[0] === p.ports[0] && x.every((v, k) => k === 0 || canStep(p, x[k - 1], v)) && new Set(x).size === x.length);
}

/**
 * The Patch Path game.
 *
 * @param props the page's locale
 * @returns the game in its shell
 */
export default function PatchPath(props: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.patch-path");
  // The shell's strings.
  const tc = useTranslations("devFun.games.common");
  // Today, after mount.
  const today = useToday();
  // The session: the board is the cable, as cells in order.
  const s = usePuzzleSession<PpPuzzle, number[]>({
    // Storage and seed id.
    gameId: PP_ID,
    // Today.
    today,
    // The day's puzzle.
    generate: (day) => generate(day),
    // No cable yet.
    empty: () => [],
    // Stored-board test.
    isBoard,
    // Solved test.
    isSolved,
    // The penalty.
    penaltyMs: PENALTY_S * 1000,
  });
  // The puzzle and the cable.
  const p = s.puzzle, path = s.board;
  // Cells the last Check marked wrong.
  const [checked, setChecked] = useState<Set<number>>(new Set());
  // The live line.
  const [say, setSay] = useState("");
  // Whether a drag is in progress.
  const dragging = useRef(false);
  // The latest cable, for handlers that run between renders during a drag.
  const live = useRef<number[]>([]);
  // Kept current.
  live.current = path ?? [];

  // Port number by cell (1-based), for drawing and rules.
  const portOf = useMemo(() => new Map((p?.ports ?? []).map((c, k) => [c, k + 1])), [p]);
  // Ports reached so far on a cable.
  const reached = (cable: readonly number[]) => cable.filter((c) => portOf.has(c)).length;

  // Why stepping from the cable's end to a cell is refused (null when allowed).
  const refusal = useCallback(
    (cable: readonly number[], cell: number): Refusal => {
      // No puzzle.
      if (!p) return "far";
      // An empty cable must start on port 1.
      if (cable.length === 0) return cell === p.ports[0] ? null : "start";
      // The end of the cable.
      const head = cable[cable.length - 1];
      // Not a neighbour.
      const r1 = Math.floor(head / p.n), c1 = head % p.n, r2 = Math.floor(cell / p.n), c2 = cell % p.n;
      // Only side neighbours.
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return "far";
      // A duct in the way.
      if (!canStep(p, head, cell)) return "wall";
      // A port must be the next one.
      const port = portOf.get(cell);
      // Out of order.
      if (port !== undefined && port !== reached(cable) + 1) return "order";
      // The last port only as the last cell.
      if (cell === p.ports[p.ports.length - 1] && cable.length !== p.n * p.n - 1) return "last";
      // Allowed.
      return null;
    },
    // The port map follows the puzzle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p, portOf],
  );

  // Apply a new cable as one move, and say what happened.
  const commit = useCallback(
    (next: number[], why: Refusal = null) => {
      // Before mount or after the finish.
      if (!p || s.done) return;
      // A refusal is only said.
      if (why) {
        // The reason, in words.
        setSay(t(`refuse.${why}`, { n: reached(live.current) + 1 }));
        // Nothing changes.
        return;
      }
      // Unchanged.
      if (next.length === live.current.length && next.every((c, k) => c === live.current[k])) return;
      // Check marks fade.
      setChecked(new Set());
      // Kept for the next event in the same drag.
      live.current = next;
      // Made.
      s.move(next);
      // Solved.
      if (isSolved(p, next)) setSay(t("sayDone"));
      // Otherwise where the cable ends.
      else if (next.length > 0) {
        // The end.
        const head = next[next.length - 1];
        // Said.
        setSay(t("sayHead", { r: Math.floor(head / p.n) + 1, c: (head % p.n) + 1, k: next.length, total: p.n * p.n }));
      } else setSay(t("sayEmpty"));
    },
    // reached() reads portOf, which follows p.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p, s, t],
  );

  // Move the cable's end towards a cell: back along the cable, or forward step by step in a straight line.
  const reach = useCallback(
    (cell: number) => {
      // No puzzle.
      if (!p) return;
      // The cable now.
      let cable = live.current.slice();
      // A cell already on the cable: cut back to it.
      const at = cable.indexOf(cell);
      // Cut.
      if (at >= 0) {
        // Shortened (or unchanged when it is the end).
        if (at !== cable.length - 1) commit(cable.slice(0, at + 1));
        // Done.
        return;
      }
      // Forward, at most n steps, towards the cell.
      let why: Refusal = null;
      // Steps.
      for (let k = 0; k < p.n && cable.length > 0; k++) {
        // The end.
        const head = cable[cable.length - 1];
        // Arrived.
        if (head === cell) break;
        // Offsets to the target.
        const dr = Math.floor(cell / p.n) - Math.floor(head / p.n), dc = (cell % p.n) - (head % p.n);
        // The next cell: along the longer axis first.
        const step = Math.abs(dr) >= Math.abs(dc) ? head + Math.sign(dr) * p.n : head + Math.sign(dc);
        // Already on the cable: stop.
        if (cable.includes(step)) break;
        // Allowed?
        why = refusal(cable, step);
        // Refused: stop.
        if (why) break;
        // Taken.
        cable = [...cable, step];
      }
      // Something gained, or a reason.
      if (cable.length > live.current.length) commit(cable);
      // Only a reason.
      else if (why) commit(cable, why);
    },
    [p, commit, refusal],
  );

  // The cell under a pointer.
  const cellAt = (e: PointerEvent<HTMLDivElement>): number => {
    // No puzzle.
    if (!p) return -1;
    // The panel's box.
    const box = e.currentTarget.getBoundingClientRect();
    // Column and row.
    const c = Math.floor(((e.clientX - box.left) / box.width) * p.n), r = Math.floor(((e.clientY - box.top) / box.height) * p.n);
    // Inside, or none.
    return r >= 0 && r < p.n && c >= 0 && c < p.n ? r * p.n + c : -1;
  };

  // Pointer down: start, cut, or extend.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    // Primary button or touch, while playing.
    if (e.button !== 0 || !p || s.done) return;
    // The cell.
    const cell = cellAt(e);
    // Outside.
    if (cell < 0) return;
    // Keep the moves coming here.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    // The cable now.
    const cable = live.current;
    // Empty: only port 1 starts it.
    if (cable.length === 0) {
      // Allowed?
      const why = refusal(cable, cell);
      // Started, or refused.
      commit(why ? cable : [cell], why);
      // Dragging only when started.
      dragging.current = !why;
      // Done.
      return;
    }
    // On the cable: cut back to it and drag from there.
    if (cable.includes(cell)) {
      // Cut (or keep).
      reach(cell);
      // Drag.
      dragging.current = true;
      // Done.
      return;
    }
    // Next to the end: extend.
    const why = refusal(cable, cell);
    // Extended or refused.
    commit(why ? cable : [...cable, cell], why);
    // Drag on success.
    dragging.current = !why;
  };

  // Pointer move: follow the pointer.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    // Only while dragging.
    if (!dragging.current || !p) return;
    // The cell.
    const cell = cellAt(e);
    // Outside, or the end itself.
    if (cell < 0 || cell === live.current[live.current.length - 1]) return;
    // Towards it.
    reach(cell);
  };

  // Pointer up: the drag ends.
  const onUp = () => {
    // No longer dragging.
    dragging.current = false;
  };

  // Keys on the panel.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // No puzzle or finished.
    if (!p || s.done) return;
    // Backspace: one step back.
    if (e.key === "Backspace") {
      // Handled.
      e.preventDefault();
      // One shorter.
      if (live.current.length > 0) commit(live.current.slice(0, -1));
      // Done.
      return;
    }
    // The arrow's offset.
    const d = e.key === "ArrowUp" ? [-1, 0] : e.key === "ArrowDown" ? [1, 0] : e.key === "ArrowLeft" ? [0, -1] : e.key === "ArrowRight" ? [0, 1] : null;
    // Not an arrow.
    if (!d) return;
    // Handled: no scrolling.
    e.preventDefault();
    // The cable now.
    const cable = live.current;
    // Empty: an arrow starts at port 1.
    if (cable.length === 0) {
      // Started.
      commit([p.ports[0]]);
      // Done.
      return;
    }
    // The end.
    const head = cable[cable.length - 1];
    // Its coordinates moved.
    const r = Math.floor(head / p.n) + d[0], c = (head % p.n) + d[1];
    // Off the panel.
    if (r < 0 || r >= p.n || c < 0 || c >= p.n) return;
    // The target.
    const cell = r * p.n + c;
    // Back along the cable.
    if (cable.length >= 2 && cable[cable.length - 2] === cell) {
      // Pulled back.
      commit(cable.slice(0, -1));
      // Done.
      return;
    }
    // On the cable elsewhere: not allowed.
    if (cable.includes(cell)) {
      // Said.
      setSay(t("refuse.used"));
      // Done.
      return;
    }
    // Forward.
    const why = refusal(cable, cell);
    // Extended or refused.
    commit(why ? cable : [...cable, cell], why);
  };

  // Check.
  const onCheck = () => {
    // Nothing yet.
    if (!p || !path || s.done) return;
    // The wrong cells.
    const bad = checkErrors(p, path);
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
    // Plug, a run of cable as long as the port count, plug; then the time.
    const lines = [`🔌${"〰️".repeat(Math.min(p.ports.length, 12))}🔌 ${p.n}×${p.n}`, `⏱️ ${time} ${s.checks === 0 ? "⚡" : "🔍".repeat(Math.min(s.checks, 5))}`];
    // The card.
    return {
      // Solved.
      won: true,
      // Headline.
      headline: t("solvedHeadline"),
      // Detail.
      detail: s.checks === 0 ? tc("solvedIn", { time }) : `${tc("solvedIn", { time })} · ${t("checksUsed", { n: s.checks, s: s.checks * PENALTY_S })}`,
      // Share text.
      share: shareText({ title, lines, locale: props.locale, slug: PP_ID }),
    };
  }, [s.done, s.finalMs, s.day, s.mode, s.checks, p, t, tc, props.locale]);

  // The rules.
  const rules = (
    <>
      <p>{t("rules.goal")}</p>
      <ul>
        <li>{t("rules.order")}</li>
        <li>{t("rules.ducts")}</li>
        <li>{t("rules.draw")}</li>
        <li>{t("rules.keys")}</li>
        <li>{t("rules.check", { s: PENALTY_S })}</li>
      </ul>
      <p>{t("rules.week")}</p>
    </>
  );

  // The cable as SVG points, cell centres in cell units.
  const points = (path ?? []).map((c) => `${(c % (p?.n ?? 1)) + 0.5},${Math.floor(c / (p?.n ?? 1)) + 0.5}`).join(" ");
  // Cells on the cable.
  const onCable = new Set(path ?? []);
  // The end of the cable.
  const head = path && path.length ? path[path.length - 1] : -1;
  // The port the player needs next (1-based).
  const nextPort = path ? reached(path) + 1 : 1;

  // The game.
  return (
    <GameShell gameId={PP_ID} kind="daily" today={today} rules={rules} result={result} version={s.version} formatBest={(ms) => formatDuration(ms)}>
      <PuzzleModeBar session={s} labels={labels} locale={props.locale} />
      {!p || !path ? (
        // Before mount: a neutral panel.
        <div className="fg-grid fg-pp-board fg-pp-loading" style={{ ["--fg-cols" as string]: 6 }} aria-busy="true">
          <p className="fg-muted fg-small fg-pp-loading-text">{tc("loading")}</p>
        </div>
      ) : (
        <>
          {/* The day's size, port count and difficulty. */}
          <p className="fg-chip fg-pp-info">{t("sizeLine", { n: p.n, ports: p.ports.length, ducts: p.wallsH.filter(Boolean).length + p.wallsV.filter(Boolean).length, level: DIFFICULTY[p.weekday] })}</p>
          {/* The panel: cells underneath, the cable and ducts drawn over them. */}
          <div
            className={`fg-grid fg-pp-board${s.done ? " fg-pp-solved" : ""}`}
            style={{ ["--fg-cols" as string]: p.n }}
            role="application"
            aria-roledescription={t("boardRole")}
            aria-label={t("boardLabel", { n: p.n, next: Math.min(nextPort, p.ports.length), ports: p.ports.length })}
            tabIndex={0}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={onKey}
            onContextMenu={(e) => e.preventDefault()}
          >
            {Array.from({ length: p.n * p.n }, (_, i) => {
              // The port number here, if any.
              const port = portOf.get(i);
              // The cell.
              return (
                <div key={i} className={`fg-cell fg-pp-cell${onCable.has(i) ? " fg-pp-on" : ""}${i === head ? " fg-pp-head" : ""}${checked.has(i) ? " fg-cell-error fg-pp-bad" : ""}`} aria-hidden="true">
                  {port !== undefined && <span className={`fg-pp-port${port < nextPort ? " fg-pp-port-done" : port === nextPort ? " fg-pp-port-next" : ""}`}>{port}</span>}
                </div>
              );
            })}
            {/* The cable and the ducts. */}
            <svg className="fg-pp-layer" viewBox={`0 0 ${p.n} ${p.n}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              {path.length > 1 && <polyline className="fg-pp-cable" points={points} fill="none" />}
              {path.length === 1 && <circle className="fg-pp-dot" cx={(path[0] % p.n) + 0.5} cy={Math.floor(path[0] / p.n) + 0.5} r="0.17" />}
              {p.wallsH.map((w, k) => {
                // Only ducts.
                if (!w) return null;
                // Between (r, c) and (r, c + 1): a vertical line at x = c + 1.
                const r = Math.floor(k / (p.n - 1)), c = k % (p.n - 1);
                // The duct.
                return <line key={`h${k}`} className="fg-pp-duct" x1={c + 1} y1={r + 0.04} x2={c + 1} y2={r + 0.96} />;
              })}
              {p.wallsV.map((w, k) => {
                // Only ducts.
                if (!w) return null;
                // Between (r, c) and (r + 1, c): a horizontal line at y = r + 1.
                const r = Math.floor(k / p.n), c = k % p.n;
                // The duct.
                return <line key={`v${k}`} className="fg-pp-duct" x1={c + 0.04} y1={r + 1} x2={c + 0.96} y2={r + 1} />;
              })}
            </svg>
          </div>
          {/* Progress in words. */}
          <p className="fg-small fg-muted fg-pp-progress">
            {nextPort > p.ports.length ? t("progressDone", { k: path.length, total: p.n * p.n }) : t("progress", { k: path.length, total: p.n * p.n, next: nextPort })}
          </p>
          {/* Clock, checks and buttons. */}
          <PuzzleHud session={s} labels={labels} onCheck={onCheck} />
          {/* Before the first move. */}
          {!s.started && <p className="fg-small fg-muted fg-pp-hint">{t("clockHint")}</p>}
        </>
      )}
      <LiveLine message={say} />
    </GameShell>
  );
}
