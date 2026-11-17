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
//     over it to pull it back, in one of two modes (PRIME 11/11/2026 23:39):
//     Classic, the default, where a drag over any cell of the cable cuts it
//     back there, and Careful pull-back, a switch under the panel kept in this
//     browser, where a drag pulls back at most two cells per move so brushing
//     an earlier stretch leaves it alone (23:18); press any cell of the cable
//     to cut it there;
//   - or click a cell next to the cable's end to extend it;
//   - on a touch screen (PRIME 05/11/2026: swiping "means moving the screen")
//     a finger draws only when it lands on the pen, the cable's end or a cell
//     beside it (or port 1 before the cable starts; the zone widened on
//     11/11/2026, when a finger a little off the end scrolled the page);
//     anywhere else the page scrolls, and a tap (a touch that ends where it
//     began) cuts or extends when the finger lifts; while a finger draws, a
//     native non-passive touchmove listener keeps the page from scrolling;
//   - keyboard: the panel takes focus; arrows extend the cable (an arrow back
//     along it pulls it back), Backspace undoes a step;
//   - a port reached out of order, or the last port before every cell is
//     covered, is refused and said why: aloud, and for two seconds in place
//     of the progress line under the panel (review R1-06, 03/11/2026).
// The cable and the ducts are drawn in one inline SVG over the cells. For a
// screen reader (review R1-11) the panel is described in words (where every
// port and every duct is), and each step says where the cable ends, which port
// it has just plugged into, and which ways are free from there.
// The day's size and difficulty sit beside the clock under the panel, so the
// panel starts higher on a phone; the share card says the checks and hints in
// words. Hint (PRIME 03/11/2026) asks the engine for the cable's next step
// (nextHint), rings that cell, outlines the cells the reason is about (the
// ways ruled out, a cell's last way out), and says why in one sentence, on
// screen and aloud; a cable off the route is pointed out first, where it
// leaves. It costs what Check costs.
// Until Start (PRIME 06/11/2026) the panel is not drawn at all: the kit's
// StartCover holds its place, and Start shows it and starts the clock together.
// ============================================================================

"use client";

// React's state, effects, refs, memo, callbacks and stable ids.
// English dates and lists in British form, through one helper (PRIME 11/11/2026 00:09).
import { intlLocale } from "@/i18n/locales";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
// Strings.
import { useTranslations } from "next-intl";
// The game's own keys, for the site's keyboard help (? or h; 16/11/2026).
import { usePageKeys } from "@/components/PageKeys";
// The frame every game sits in.
import GameShell, { type ShellResult } from "./GameShell";
// The shared session, its bars, the hint holder and the live line.
import { LiveLine, PuzzleHud, StartCover, gradeSavedRound, legacyPracticeMarks, useBoardHint, useBoardKeys, usePuzzleSession, type KitLabels } from "./LogicPuzzleKit";
// The engine.
import { PP_ID, canStep, checkErrors, generate, isSolved, nextHint, type PpHint, type PpPuzzle } from "@/lib/fun/games/patch-path/engine";
// The puzzle number.
import { puzzleNumber } from "@/lib/fun/daily";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// Today's UTC day, after mount.
import { useToday } from "@/lib/fun/hooks";
// The game's record in this browser, where the pull-back switch is kept beside the board view (11/11/2026).
import { loadRecord, updateRecord } from "@/lib/fun/storage";

/** How far a finger may wobble and still tap, in CSS pixels; further is a scroll. */
const TAP_SLOP_PX = 10;

/** How many cells one move of a drag may pull the cable back (PRIME 11/11/2026 23:18: brushing an early cell on the way to
 *  the last ports cut the cable back to it). Pulling back further takes the drag back along the cable, cell by cell; a
 *  deliberate press on a cable cell still cuts there at once. Two, not one, so a quick pull-back that skips a cell holds. */
const DRAG_PULLBACK_MAX = 2;

/** Seconds added per Check. */
const PENALTY_S = 10;

/** The weekday's difficulty word, Monday first. */
const DIFFICULTY = ["gentle", "gentle", "medium", "medium", "tricky", "hard", "hard"] as const;

/** Why a step was refused. */
type Refusal = "order" | "last" | "wall" | "far" | "start" | null;

/** How long a refusal stays on screen, in milliseconds. */
const REFUSAL_MS = 2000;

/** The four directions, as row and column offsets, with their names in the strings. */
const DIRS = [
  { key: "up", dr: -1, dc: 0 },
  { key: "down", dr: 1, dc: 0 },
  { key: "left", dr: 0, dc: -1 },
  { key: "right", dr: 0, dc: 1 },
] as const;

/** A hint on show: its sentence, the cell to go to (or the first one off the route), the cells its reason is about. */
interface ShownHint {
  /** The sentence. */
  text: string;
  /** The cell to act on. */
  target: number;
  /** The cells the reason is about. */
  area: Set<number>;
  /** Whether the hint points at a mistake. */
  wrong: boolean;
}

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
  // The keys, told to the site's keyboard help (? or h, PRIME 16/11/2026 03:14): while its board has the keyboard the site's shortcuts are off.
  usePageKeys({ when: "focused", lines: [t("rules.keys")] });
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
  // The hint on show, put away as soon as the cable changes.
  const [hint, setHint] = useBoardHint<number[], ShownHint>(path);
  // While the panel has focus, its keys play here instead of reaching the site's shortcuts.
  const boardKeys = useBoardKeys();
  // The live line.
  const [say, setSay] = useState("");
  // The last refusal, shown under the panel for a moment.
  const [refused, setRefused] = useState<string | null>(null);
  // Its timer.
  const refusedTimer = useRef<number | null>(null);
  // The panel's description's id.
  const descId = useId();
  // The panel, to give it the keyboard after Start.
  const boardRef = useRef<HTMLDivElement>(null);
  // Whether a drag is in progress.
  const dragging = useRef(false);
  // A touch that landed off the pen: a tap if it ends where it began, a scroll otherwise (acted on at pointer up).
  const tap = useRef<{ id: number; cell: number; x: number; y: number } | null>(null);
  // The latest cable, for handlers that run between renders during a drag.
  const live = useRef<number[]>([]);
  // Kept current.
  live.current = path ?? [];
  // The pull-back mode: false is Classic, true is Careful pull-back. Read after mount (the server render has no browser),
  // shown by the switch under the panel and read by the drag through the ref below.
  const [carefulOn, setCarefulOn] = useState(false);
  // For the pointer handlers, which run between renders.
  const careful = useRef(false);
  // Kept current.
  careful.current = carefulOn;
  // This browser's choice, once mounted.
  useEffect(() => {
    // The game's record; the switch lives in its extra field.
    setCarefulOn(loadRecord(PP_ID).extra?.ppCarefulPullback === true);
  }, []);
  /**
   * Turn Careful pull-back on or off, and keep the choice with the game's settings (a reset of the stats keeps it).
   *
   * @param on the new state
   */
  const chooseCareful = (on: boolean) => {
    // Shown.
    setCarefulOn(on);
    // Kept.
    updateRecord(PP_ID, (r) => ({ ...r, extra: { ...r.extra, ppCarefulPullback: on } }));
  };

  // Port number by cell (1-based), for drawing and rules.
  const portOf = useMemo(() => new Map((p?.ports ?? []).map((c, k) => [c, k + 1])), [p]);
  // Ports reached so far on a cable.
  const reached = (cable: readonly number[]) => cable.filter((c) => portOf.has(c)).length;

  // While a drag is in progress the page must not scroll under the finger (PRIME 11/11/2026 23:18: on an iPhone the whole
  // page sometimes moved with the finger instead of the cable). touch-action: none on the pen decides it when the touch
  // lands; this listener is the second line, for a pan the browser would start mid-drag. It is added natively because
  // React registers its touch listeners as passive, and a passive listener cannot cancel the scroll.
  const boardShown = Boolean(s.started && p && path); // the panel is on the page only after Start
  useEffect(() => {
    // The panel, when it is on the page.
    const el = boardRef.current;
    // Not yet.
    if (!el) return;
    // A move of a touch that is drawing: no scroll.
    const hold = (ev: TouchEvent) => {
      // Only during a drag; a touch that is scrolling the page keeps scrolling.
      if (dragging.current && ev.cancelable) ev.preventDefault();
    };
    // Non-passive, so preventDefault is honoured.
    el.addEventListener("touchmove", hold, { passive: false });
    // Removed with the panel.
    return () => el.removeEventListener("touchmove", hold);
  }, [boardShown]);

  // The refusal's timer is cleared when the game goes away.
  useEffect(() => () => {
    // A pending fade.
    if (refusedTimer.current !== null) window.clearTimeout(refusedTimer.current);
  }, []);

  // Say a refusal: aloud through the live line, and on screen under the panel for two seconds.
  const showRefusal = useCallback((text: string) => {
    // Aloud.
    setSay(text);
    // On screen.
    setRefused(text);
    // A previous fade is replaced.
    if (refusedTimer.current !== null) window.clearTimeout(refusedTimer.current);
    // Gone after a moment.
    refusedTimer.current = window.setTimeout(() => setRefused(null), REFUSAL_MS);
  }, []);

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
      // A refusal is only said and shown.
      if (why) {
        // The reason, in words.
        showRefusal(t(`refuse.${why}`, { n: reached(live.current) + 1 }));
        // Nothing changes.
        return;
      }
      // Unchanged.
      if (next.length === live.current.length && next.every((c, k) => c === live.current[k])) return;
      // Check marks fade.
      setChecked(new Set());
      // A refusal on screen gives way to the progress line.
      setRefused(null);
      // Kept for the next event in the same drag.
      live.current = next;
      // Made.
      s.move(next);
      // Solved.
      if (isSolved(p, next)) setSay(t("sayDone"));
      // Otherwise where the cable ends, the port it has just reached, and the ways on.
      else if (next.length > 0) {
        // The end.
        const head = next[next.length - 1];
        // Its row and column.
        const hr = Math.floor(head / p.n), hc = head % p.n;
        // The sentences.
        const parts = [t("sayHead", { r: hr + 1, c: hc + 1, k: next.length, total: p.n * p.n })];
        // A port at the end.
        const port = portOf.get(head);
        // Said when it was just plugged in.
        if (port !== undefined) parts.push(t("sayPort", { p: port }));
        // The free directions: inside the panel, off the cable, and allowed by the rules (ducts, port order, last port).
        const free = DIRS.filter((d) => {
          // The neighbour's row and column.
          const r = hr + d.dr, c = hc + d.dc;
          // Inside, not on the cable, and a legal step.
          return r >= 0 && r < p.n && c >= 0 && c < p.n && !next.includes(r * p.n + c) && refusal(next, r * p.n + c) === null;
        }).map((d) => t(`dir.${d.key}`));
        // Joined the language's way ("up and right"), or a plain comma list where the browser cannot.
        let list = free.join(", ");
        // The locale's list format.
        try {
          // "up, left and right".
          list = new Intl.ListFormat(intlLocale(props.locale), { style: "long", type: "conjunction" }).format(free);
        } catch {
          // The plain list stays.
        }
        // The ways on, or a dead end.
        parts.push(free.length > 0 ? t("sayFree", { dirs: list }) : t("sayStuck"));
        // Said.
        setSay(parts.join(" "));
      } else setSay(t("sayEmpty"));
    },
    // reached() reads portOf, which follows p.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p, s, t, refusal, portOf, showRefusal, props.locale],
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

  /**
   * Start, cut or extend the cable at a cell: what a press does (a mouse at once, a finger off the pen on lifting).
   *
   * @param cell the cell pressed
   * @returns whether a drag may follow from there
   */
  const act = (cell: number): boolean => {
    // The cable now.
    const cable = live.current;
    // Empty: only port 1 starts it.
    if (cable.length === 0) {
      // Allowed?
      const why = refusal(cable, cell);
      // Started, or refused.
      commit(why ? cable : [cell], why);
      // A drag only when started.
      return !why;
    }
    // On the cable: cut back to it, and a drag may go on from there.
    if (cable.includes(cell)) {
      // Cut (or keep).
      reach(cell);
      // A drag.
      return true;
    }
    // Next to the end: extend.
    const why = refusal(cable, cell);
    // Extended or refused.
    commit(why ? cable : [...cable, cell], why);
    // A drag on success.
    return !why;
  };

  /**
   * Whether a cell is the pen, where a finger may start drawing: the cable's end, or port 1 before the cable starts.
   *
   * @param cell the cell
   * @returns true on the pen
   */
  const isPen = (cell: number): boolean => {
    // The cable now.
    const cable = live.current;
    // Port 1 when there is no cable yet.
    if (cable.length === 0) return portOf.get(cell) === 1;
    // The cable's end, or a cell beside it (PRIME 11/11/2026 23:18: a finger that landed a little off the end scrolled the
    // page instead of drawing): the same cells penZone() gives the touch-action: none class to.
    return penZone(cable).has(cell);
  };

  /**
   * The cells a finger may start drawing from: the cable's end and its side neighbours on the panel, or port 1 before the
   * cable starts. Rendered with the fg-pp-pen class (touch-action: none), so the browser never takes a touch there to scroll.
   *
   * @param cable the cable
   * @returns the cells
   */
  function penZone(cable: readonly number[]): Set<number> {
    // No puzzle: nothing.
    if (!p) return new Set();
    // Before the cable: port 1 alone.
    if (cable.length === 0) return new Set([p.ports[0]]);
    // The end and its row and column.
    const head = cable[cable.length - 1], hr = Math.floor(head / p.n), hc = head % p.n;
    // The end itself.
    const zone = new Set([head]);
    // Its side neighbours inside the panel.
    for (const d of DIRS) {
      // The neighbour's row and column.
      const r = hr + d.dr, c = hc + d.dc;
      // Inside.
      if (r >= 0 && r < p.n && c >= 0 && c < p.n) zone.add(r * p.n + c);
    }
    // The zone.
    return zone;
  }

  // Pointer down: a mouse or a pen starts, cuts or extends at once; a finger does so only on the pen.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    // Primary button or touch, while playing.
    if (e.button !== 0 || !p || s.done) return;
    // The cell.
    const cell = cellAt(e);
    // Outside.
    if (cell < 0) return;
    // A finger off the pen: the page may be scrolling; wait for it to lift.
    if (e.pointerType === "touch" && !isPen(cell)) {
      // Remembered as a possible tap.
      tap.current = { id: e.pointerId, cell, x: e.clientX, y: e.clientY };
      // Nothing yet.
      return;
    }
    // Keep the moves coming here.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    // Acted on now; a drag follows when it may. A finger in the pen zone drags on from the cable's end even when its
    // first cell was refused (it landed on the wrong side of a duct, say): the touch did not scroll, so it should draw.
    const ok = act(cell);
    dragging.current = ok || (e.pointerType === "touch" && live.current.length > 0);
  };

  // Pointer move: a waiting tap that travels becomes a scroll; a drag follows the pointer.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    // A touch waiting to be a tap.
    const t0 = tap.current;
    // Moved further than a tap's wobble: a scroll, which does nothing on the panel.
    if (t0 && t0.id === e.pointerId) {
      // Dropped once it travels.
      if (Math.hypot(e.clientX - t0.x, e.clientY - t0.y) > TAP_SLOP_PX) tap.current = null;
      // Nothing else.
      return;
    }
    // Only while dragging.
    if (!dragging.current || !p) return;
    // The cell.
    const cell = cellAt(e);
    // Outside, or the end itself.
    if (cell < 0 || cell === live.current[live.current.length - 1]) return;
    // Classic (the default since PRIME 11/11/2026 23:39): any cell of the cable the drag passes over cuts it back there.
    if (!careful.current) {
      // Cut back, or extend towards it.
      reach(cell);
      // Done.
      return;
    }
    // Careful pull-back (PRIME 11/11/2026 23:18, now a switch): a drag pulls back only a step or two at a time, along the
    // cable. An earlier cell the pointer brushes on its way is ignored, so the cable is never cut back by accident.
    const at = live.current.indexOf(cell);
    // On the cable.
    if (at >= 0) {
      // How far back it is from the end.
      const back = live.current.length - 1 - at;
      // Near: pulled back to it.
      if (back <= DRAG_PULLBACK_MAX) commit(live.current.slice(0, at + 1));
      // Far: ignored.
      return;
    }
    // Off the cable: towards it.
    reach(cell);
  };

  // Pointer up: a waiting tap acts now; a drag ends.
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    // A touch that stayed where it landed.
    const t0 = tap.current;
    // Forgotten either way.
    tap.current = null;
    // A tap: cut or extend there, with no drag after it.
    if (t0 && t0.id === e.pointerId && p && !s.done) act(t0.cell);
    // No longer dragging.
    dragging.current = false;
  };

  // Pointer cancel (the browser took the touch to scroll): nothing happens on the panel.
  const onCancel = () => {
    // No tap.
    tap.current = null;
    // No drag.
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
      // Said and shown.
      showRefusal(t("refuse.used"));
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

  // A hint's sentence.
  const hintText = (h: PpHint, cable: readonly number[]): string => {
    // No puzzle: nothing to say.
    if (!p) return "";
    // The cell's row and column, from one.
    const r = Math.floor(h.cell / p.n) + 1, c = (h.cell % p.n) + 1;
    // The cable's end, for directions.
    const end = cable.length ? cable[cable.length - 1] : -1;
    // The direction from the end to a neighbouring cell, in words.
    const dirTo = (cell: number) => {
      // The offsets.
      const dr = Math.floor(cell / p.n) - Math.floor(end / p.n), dc = (cell % p.n) - (end % p.n);
      // The matching direction (a neighbour always has one).
      const d = DIRS.find((x) => x.dr === dr && x.dc === dc) ?? DIRS[0];
      // Its name.
      return t(`dir.${d.key}`);
    };
    // A cable off the route.
    if (h.rule === "mistake") return t("hint.mistake", { r, c });
    // An empty panel.
    if (h.rule === "start") return t("hint.start", { r, c });
    // The way on.
    const dir = dirTo(h.cell);
    // One open way.
    if (h.rule === "only") return t("hint.only", { dir, r, c });
    // A cell (or port) that would become a dead end.
    if (h.rule === "forced") return h.port > 0 ? t("hint.forcedPort", { p: h.port, dir }) : t("hint.forced", { r, c, dir });
    // Every other way ruled out, each for its reason.
    if (h.rule === "ruledOut") {
      // A list the language's way ("up or left", "A, B and C"), or a plain comma list where the browser has none.
      const list = (items: string[], type: "conjunction" | "disjunction") => {
        // The locale's list format.
        try {
          // Formatted.
          return new Intl.ListFormat(intlLocale(props.locale), { style: "long", type }).format(items);
        } catch {
          // Plain.
          return items.join(", ");
        }
      };
      // The ways that would cut the free cells in two, together ("going up or left would cut ...").
      const split = h.out.filter((o) => o.why === "split").map((o) => dirTo(o.cell));
      // The ways a search proves stuck, together.
      const ahead = h.out.filter((o) => o.why === "ahead").map((o) => dirTo(o.cell));
      // The clauses: the cut first, each forced track with its own count, the search last.
      const reasons = [
        // The cut.
        ...(split.length ? [t("hint.why.split", { dirs: list(split, "disjunction") })] : []),
        // Each forced track.
        ...h.out.filter((o) => o.why === "track").map((o) => t("hint.why.track", { dir: dirTo(o.cell), k: o.steps })),
        // The search.
        ...(ahead.length ? [t("hint.why.ahead", { dirs: list(ahead, "disjunction") })] : []),
      ];
      // Joined ("A, B and C").
      const joined = list(reasons, "conjunction");
      // The sentence, its first letter a capital (the clauses start in lower case for the middle of a list).
      const sentence = t("hint.ruledOut", { reasons: joined, dir, r, c });
      // Capitalised.
      return sentence.charAt(0).toLocaleUpperCase(props.locale) + sentence.slice(1);
    }
    // Read from the answer, and said so.
    return t("hint.answer", { dir, r, c });
  };

  // Hint: find the next step, light its cell, say why, and count it (it costs what a check costs).
  const onHint = () => {
    // Nothing yet, or finished.
    if (!p || !path || s.done) return;
    // The step.
    const h = nextHint(p, path);
    // A finished cable has none.
    if (!h) return;
    // Its sentence.
    const text = hintText(h, path);
    // Counted (adds the penalty and starts the clock).
    s.hint();
    // Shown until the cable changes.
    setHint({ text, target: h.cell, area: new Set(h.area), wrong: h.rule === "mistake" });
    // A refusal on screen gives way.
    setRefused(null);
    // Said, with its cost.
    setSay(`${text} ${tc("hintCost", { s: PENALTY_S })}`);
  };

  // The kit's labels.
  // Start: the panel and the clock together, then the keyboard on the panel.
  const onStart = () => {
    // Started (the kit saves the round at once).
    s.start();
    // Said.
    setSay(tc("startSay"));
    // The panel takes focus once it is drawn.
    window.setTimeout(() => boardRef.current?.focus(), 0);
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
    // Plug, a run of cable as long as the port count, plug; then the time and the checks and hints in words.
    const lines = [`🔌${"〰️".repeat(Math.min(p.ports.length, 12))}🔌 ${p.n}×${p.n}`, `⏱️ ${time} · ${t("shareChecks", { n: s.checks, s: s.checks * PENALTY_S })} · ${tc("shareHints", { n: s.hints, s: s.hints * PENALTY_S })}`];
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
      share: shareText({ title, lines, locale: props.locale, slug: PP_ID }),
    };
  }, [s.done, s.finalMs, s.day, s.checks, s.hints, p, t, tc, props.locale]);

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
        <li>{tc("hintRule", { s: PENALTY_S })}</li>
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
  // The cells a finger may start drawing from (the pen class, touch-action: none).
  const pen = path ? penZone(path) : new Set<number>();
  // The port the player needs next (1-based).
  const nextPort = path ? reached(path) + 1 : 1;
  // The panel in words, for a screen reader: every port and every duct.
  const description = useMemo(() => {
    // Nothing before mount.
    if (!p) return "";
    // Row and column of a cell, from one.
    const rc = (cell: number) => ({ r: Math.floor(cell / p.n) + 1, c: (cell % p.n) + 1 });
    // The ports in order.
    const ports = p.ports.map((cell, k) => t("srPortAt", { p: k + 1, ...rc(cell) })).join("; ");
    // The ducts: between side neighbours, then between cells one above the other.
    const ducts: string[] = [];
    // Side by side.
    p.wallsH.forEach((w, k) => {
      // Only ducts.
      if (!w) return;
      // The left cell.
      const left = Math.floor(k / (p.n - 1)) * p.n + (k % (p.n - 1));
      // Its row and column.
      const a = rc(left);
      // Described.
      ducts.push(t("srDuctAt", { r1: a.r, c1: a.c, r2: a.r, c2: a.c + 1 }));
    });
    // One above the other.
    p.wallsV.forEach((w, k) => {
      // Only ducts.
      if (!w) return;
      // The upper cell's row and column.
      const a = rc(k);
      // Described.
      ducts.push(t("srDuctAt", { r1: a.r, c1: a.c, r2: a.r + 1, c2: a.c }));
    });
    // The two sentences.
    return `${t("srPorts", { list: ports })} ${t("srDucts", { n: ducts.length, list: ducts.join("; ") })}`;
  }, [p, t]);

  // The game.
  return (
    <GameShell gameId={PP_ID} kind="daily" today={today} rules={rules} result={result} version={s.version} formatBest={(ms) => formatDuration(ms)} gradeSaved={gradeSavedRound} legacyMarks={legacyPracticeMarks}>
      {!p || !path ? (
        // Before mount: a neutral panel.
        <div className="fg-grid fg-pp-board fg-pp-loading" style={{ ["--fg-cols" as string]: 6 }} aria-busy="true">
          <p className="fg-muted fg-small fg-pp-loading-text">{tc("loading")}</p>
        </div>
      ) : (
        <>
          {/* Before Start: the panel's place, empty (no port, duct or description is on the page yet). */}
          {!s.started ? (
            <StartCover label={tc("start")} note={tc("startNote")} onStart={onStart} className="fg-grid" style={{ ["--fg-cols" as string]: p.n }} />
          ) : (
          <>
          {/* The panel: cells underneath, the cable and ducts drawn over them. */}
          <div
            ref={boardRef}
            className={`fg-grid fg-pp-board${s.done ? " fg-pp-solved" : ""}`}
            style={{ ["--fg-cols" as string]: p.n }}
            role="application"
            aria-roledescription={t("boardRole")}
            aria-label={t("boardLabel", { n: p.n, next: Math.min(nextPort, p.ports.length), ports: p.ports.length })}
            aria-describedby={descId}
            tabIndex={0}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onCancel}
            onKeyDown={onKey}
            onContextMenu={(e) => e.preventDefault()}
            {...boardKeys}
          >
            {Array.from({ length: p.n * p.n }, (_, i) => {
              // The port number here, if any.
              const port = portOf.get(i);
              // The cell the hint on show acts on (rung, or rung red for a mistake), or one its reason is about (outlined).
              const hinted = hint?.target === i ? (hint.wrong ? " fg-lpk-hint-wrong" : " fg-lpk-hint-target") : hint?.area.has(i) ? " fg-lpk-hint-area" : "";
              // The cell (the panel's words and the live line carry it for a screen reader).
              return (
                <div key={i} className={`fg-cell fg-pp-cell${onCable.has(i) ? " fg-pp-on" : ""}${i === head ? " fg-pp-head" : ""}${pen.has(i) ? " fg-pp-pen" : ""}${checked.has(i) ? " fg-cell-error fg-pp-bad" : ""}${hinted}`} aria-hidden="true">
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
          {/* The panel in words, read by screen readers with the panel. */}
          <p id={descId} className="fg-lpk-sr">
            {description}
          </p>
          {/* Progress in words, or for a moment why the last step was refused. */}
          <p className={`fg-small fg-pp-progress${refused ? " fg-pp-refused" : " fg-muted"}`}>
            {refused ?? (nextPort > p.ports.length ? t("progressDone", { k: path.length, total: p.n * p.n }) : t("progress", { k: path.length, total: p.n * p.n, next: nextPort }))}
          </p>
          {/* The pull-back mode (PRIME 11/11/2026 23:39): Classic by default, Careful pull-back as a choice kept in this
              browser. The site's switch (a native checkbox with the switch role; the label is the whole target), as on
              the sharing switch; the line under it says what the current mode does. */}
          <span className="fg-share-wrap fg-pp-mode">
            <label className="fg-share">
              {/* The control, announced as a switch. */}
              <input type="checkbox" role="switch" className="fg-share-input" checked={carefulOn} onChange={(e) => chooseCareful(e.target.checked)} />
              {/* The drawn track and thumb. */}
              <span className={`fg-share-track${carefulOn ? " fg-share-track-on" : ""}`} aria-hidden="true">
                <span className="fg-share-thumb" />
              </span>
              {/* The words. */}
              <span className="fg-share-label">{t("mode.careful")}</span>
            </label>
            {/* What the mode in force does. */}
            <span className="fg-small fg-muted fg-share-note">{t(carefulOn ? "mode.carefulOn" : "mode.carefulOff")}</span>
          </span>
          </>
          )}
          {/* Clock, checks, hints, the day's size and difficulty, the buttons and the hint on show. */}
          <PuzzleHud
            session={s}
            labels={labels}
            onCheck={onCheck}
            onHint={onHint}
            hintNote={hint?.text ?? null}
            info={<span className="fg-chip fg-pp-info">{t("sizeLine", { n: p.n, ports: p.ports.length, ducts: p.wallsH.filter(Boolean).length + p.wallsV.filter(Boolean).length, level: DIFFICULTY[p.weekday] })}</span>}
          />
        </>
      )}
      <LiveLine message={say} />
    </GameShell>
  );
}
