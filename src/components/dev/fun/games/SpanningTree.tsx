// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/SpanningTree.tsx
// ----------------------------------------------------------------------------
// SPANNING TREE, the board (PRIME 03/11/2026). A small switched network drawn
// as an inline SVG that fits a 390 px phone: switches with their bridge IDs,
// links with their costs, a port ID at each end of each link. Four steps:
// click the root bridge, mark every root port, mark every link's designated
// port, then mark the ports that are left, which block. A wrong move says why,
// with the tie-breaker that decided. The rules are IEEE 802.1D's, applied by
// src/lib/fun/games/spanning-tree/engine.ts.
// Keyboard: the targets of the current step take focus in reading order; the
// arrow keys move between them; Enter or Space marks.
// ============================================================================

"use client";

// React's state, memo, effects and refs.
import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
// Strings.
import { useTranslations } from "next-intl";
// The frame every game sits in.
import GameShell, { type ShellResult } from "./GameShell";
// Today's day and the stopwatch.
import { useStopwatch, useToday } from "@/lib/fun/hooks";
// The puzzle number, and practice seeds.
import { makeRng, puzzleNumber } from "@/lib/fun/daily";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// The one storage key.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The rules of the game.
import {
  STP_ID, bidText, dailyStp, generateStp, macText, pidText, solveStp, stpScore, whyDesignated, whyRoot, whyRootPort,
  type StpLevel, type StpPuzzle, type StpWhy,
} from "@/lib/fun/games/spanning-tree/engine";

/** What the player has marked. */
interface Marks {
  /** The root bridge clicked right, or null. */
  root: number | null;
  /** Root ports marked. */
  rp: number[];
  /** Designated ports marked. */
  dp: number[];
  /** Blocked ports marked. */
  bk: number[];
}

/** What a daily puzzle keeps in storage, per level. */
interface StpSave {
  /** The marks. */
  marks: Marks;
  /** Mistakes per step (root, root ports, designated). */
  mistakes: number[];
  /** Milliseconds spent so far. */
  ms: number;
  /** Finished. */
  done: boolean;
  /** Solved (not given up). */
  won: boolean;
}

/** No marks yet. */
const NO_MARKS: Marks = { root: null, rp: [], dp: [], bk: [] };

/** A switch box's half width and half height in board units. */
const HW = 38;
/** Half height. */
const HH = 23;

/** A point on the board. */
interface Pt {
  /** Across. */
  x: number;
  /** Down. */
  y: number;
}

/** A drawn board: each switch's centre and the board's size. */
interface Layout {
  /** Switch centres, by index. */
  at: Pt[];
  /** Width in board units. */
  w: number;
  /** Height. */
  h: number;
}

/**
 * Place the layout grid on a board: portrait (two columns, the grid's long side going down) for a phone, landscape
 * (two rows, the long side going across) for a wide screen. Spacing keeps two port markers and their touch areas
 * apart on every link.
 *
 * @param pz the puzzle
 * @param portrait which orientation
 * @returns the layout
 */
function layout(pz: StpPuzzle, portrait: boolean): Layout {
  // The grid's length along its long side.
  const long = Math.max(...pz.switches.map((s) => s.gx)) + 1;
  // Portrait: columns 180 apart, rows 140 apart (room for two markers and the cost between them).
  if (portrait) return { at: pz.switches.map((s) => ({ x: 90 + s.gy * 180, y: 50 + s.gx * 140 })), w: 360, h: 100 + (long - 1) * 140 };
  // Landscape: columns 230 apart (room for two markers and the cost between them), rows 180 apart.
  return { at: pz.switches.map((s) => ({ x: 70 + s.gx * 230, y: 55 + s.gy * 180 })), w: 140 + (long - 1) * 230, h: 290 };
}

/**
 * The sideways shift of a link: 0 for a single cable, -22 and +22 for a pair (far enough that their markers' touch
 * areas do not cover each other).
 *
 * @param pz the puzzle
 * @param s the segment
 * @returns the shift in board units
 */
function laneOffset(pz: StpPuzzle, s: number): number {
  // The link's two switches.
  const [pa, pb] = pz.segments[s].ports.map((q) => pz.ports[q].sw);
  // Another link between the same two.
  const twin = pz.segments.some((g, i) => i !== s && g.ports.map((q) => pz.ports[q].sw).sort().join() === [pa, pb].sort().join());
  // Shifted only when doubled; both cables of a pair share their direction, so opposite signs part them.
  return twin ? (pz.segments[s].lane === 0 ? -22 : 22) : 0;
}

/**
 * The perpendicular of a link, from its first port's switch to its second's, so both ends shift the same way.
 *
 * @param pz the puzzle
 * @param lay the layout
 * @param s the segment
 * @returns the unit perpendicular
 */
function normal(pz: StpPuzzle, lay: Layout, s: number): Pt {
  // The two ends.
  const [a, b] = pz.segments[s].ports.map((q) => lay.at[pz.ports[q].sw]);
  // The length.
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  // Turned a quarter.
  return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
}

/**
 * Where a port is drawn: on its cable, just clear of its switch's box.
 *
 * @param pz the puzzle
 * @param lay the layout
 * @param p the port index
 * @returns the centre of its marker
 */
function portPos(pz: StpPuzzle, lay: Layout, p: number): Pt {
  // The port and its link.
  const port = pz.ports[p];
  // Its switch's centre.
  const a = lay.at[port.sw];
  // The far end's centre.
  const b = lay.at[pz.ports[pz.segments[port.seg].ports.find((q) => q !== p)!].sw];
  // The direction from a to b.
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  // Unit vector, across.
  const ux = (b.x - a.x) / len;
  // Down.
  const uy = (b.y - a.y) / len;
  // Distance from the centre to the box edge along it.
  const edge = Math.min(ux === 0 ? Infinity : HW / Math.abs(ux), uy === 0 ? Infinity : HH / Math.abs(uy));
  // The cable's sideways shift.
  const off = laneOffset(pz, port.seg);
  // Its perpendicular.
  const n = normal(pz, lay, port.seg);
  // A diagonal cable's marker sits a little further out, clear of the straight cable's marker beside it.
  const out = edge + (Math.abs(ux) > 0.2 && Math.abs(uy) > 0.2 ? 36 : 24);
  // Clear of the box by the marker's half size, shifted with its cable.
  return { x: a.x + ux * out + n.x * off, y: a.y + uy * out + n.y * off };
}

/**
 * The board.
 *
 * @param props the page's locale, for the share card's address
 * @returns the game
 */
export default function SpanningTree({ locale }: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.spanning-tree");
  // The shell's strings.
  const tc = useTranslations("devFun.games.common");
  // Today's UTC day (null until mount).
  const today = useToday();
  // Daily or practice.
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  // Easy or hard.
  const [level, setLevel] = useState<StpLevel>("easy");
  // The practice seed (picked when a practice round starts).
  const [seed, setSeed] = useState(1);
  // The marks.
  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  // Mistakes per step.
  const [mistakes, setMistakes] = useState<number[]>([0, 0, 0]);
  // The time already spent before this visit (a resumed daily).
  const [offset, setOffset] = useState(0);
  // Over: solved or given up.
  const [over, setOver] = useState<null | { won: boolean; ms: number }>(null);
  // The last wrong move's reason.
  const [why, setWhy] = useState<StpWhy | null>(null);
  // The target that was just wrong, for a brief outline.
  const [wrong, setWrong] = useState<string | null>(null);
  // The polite announcement line.
  const [live, setLive] = useState("");
  // The shell re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // The stopwatch.
  const watch = useStopwatch();

  // The puzzle: today's for the level, or the practice seed's.
  const pz: StpPuzzle | null = useMemo(() => {
    // The daily needs the day.
    if (mode === "daily") return today ? dailyStp(today, level) : null;
    // Practice draws from its seed.
    return generateStp(makeRng(seed), level);
  }, [mode, level, today, seed]);

  // The answer.
  const ans = useMemo(() => (pz ? solveStp(pz).answer : null), [pz]);

  // The step: 1 root, 2 root ports, 3 designated, 4 blocked, 5 done.
  const step = !ans ? 1 : marks.root === null ? 1 : marks.rp.length < pz!.switches.length - 1 ? 2 : marks.dp.length < pz!.segments.length ? 3 : marks.bk.length < ans.blocked.length ? 4 : 5;

  // A new puzzle: fresh marks, or the daily's saved ones.
  useEffect(() => {
    // The stopwatch back to zero.
    watch.reset();
    // No reason shown.
    setWhy(null);
    // The daily restores today's state for this level.
    if (mode === "daily" && today && pz) {
      // Both levels' states.
      const day = (loadRecord(STP_ID).daily[today] ?? {}) as Partial<Record<StpLevel, StpSave>>;
      // This level's.
      const saved = day[level];
      // Restored when present.
      if (saved && saved.marks) {
        // The marks.
        setMarks(saved.marks);
        // The mistakes.
        setMistakes(saved.mistakes ?? [0, 0, 0]);
        // The time spent.
        setOffset(saved.ms ?? 0);
        // Finished or not.
        setOver(saved.done ? { won: saved.won, ms: saved.ms ?? 0 } : null);
        // Restored.
        return;
      }
    }
    // A fresh board.
    setMarks(NO_MARKS);
    // No mistakes.
    setMistakes([0, 0, 0]);
    // No time.
    setOffset(0);
    // Playing.
    setOver(null);
    // The stopwatch's reset is stable enough; listing it would restart this on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, level, today, pz]);

  // The time shown.
  const ms = over ? over.ms : offset + watch.elapsed;

  /**
   * Save the daily state of this level.
   *
   * @param next what to save
   */
  const save = (next: StpSave) => {
    // Only the daily is saved.
    if (mode !== "daily" || !today) return;
    // Both levels' states.
    const day = (loadRecord(STP_ID).daily[today] ?? {}) as Partial<Record<StpLevel, StpSave>>;
    // This one replaced.
    saveDailyState(STP_ID, today, { ...day, [level]: next });
  };

  /**
   * Accept a move: new marks, maybe the end.
   *
   * @param next the new marks
   * @param said what to announce
   */
  const accept = (next: Marks, said: string) => {
    // The marks.
    setMarks(next);
    // The reason box clears.
    setWhy(null);
    // Done when every blocked port is marked.
    const done = next.root !== null && next.rp.length === pz!.switches.length - 1 && next.dp.length === pz!.segments.length && next.bk.length === ans!.blocked.length;
    // The time now: exact at the end (the stopwatch stops), to the quarter second while playing.
    const now = offset + (done && watch.running ? watch.stop() : watch.elapsed);
    // The end.
    if (done) {
      // Over, solved.
      setOver({ won: true, ms: now });
      // The score.
      const score = stpScore(now, mistakes.reduce((a, b) => a + b, 0));
      // Recorded.
      if (today) recordResult(STP_ID, mode === "daily" ? { dayKey: today, won: true, daily: true } : { dayKey: today, won: true, score, higherIsBetter: false });
      // Saved finished.
      save({ marks: next, mistakes, ms: now, done: true, won: true });
      // The shell re-reads.
      setVersion((v) => v + 1);
      // Announced.
      setLive(`${said} ${t("live.solved", { time: formatDuration(now) })}`);
      // Done.
      return;
    }
    // Saved in progress; the stopwatch keeps running.
    save({ marks: next, mistakes, ms: now, done: false, won: false });
    // Announced.
    setLive(said);
  };

  /**
   * Count a mistake and show its reason.
   *
   * @param stepIdx 0 root, 1 root ports, 2 designated
   * @param w the reason
   * @param target the wrong target's key
   */
  const miss = (stepIdx: number, w: StpWhy, target: string) => {
    // One more in that step.
    const next = mistakes.map((m, i) => (i === stepIdx ? m + 1 : m));
    // Kept.
    setMistakes(next);
    // The reason.
    setWhy(w);
    // The brief outline.
    setWrong(target);
    // Cleared after a moment.
    window.setTimeout(() => setWrong(null), 900);
    // The stopwatch starts on the first move.
    if (!watch.running) watch.start();
    // Announced.
    setLive(t(`why.${w.id}`, w.args));
    // Saved.
    save({ marks, mistakes: next, ms: offset + watch.elapsed, done: false, won: false });
  };

  /**
   * A switch clicked.
   *
   * @param s the switch
   */
  const onSwitch = (s: number) => {
    // Only in step 1, while playing.
    if (!pz || !ans || over || step !== 1) return;
    // The stopwatch starts on the first move.
    if (!watch.running) watch.start();
    // Right.
    if (s === ans.root) accept({ ...marks, root: s }, t("live.root", { sw: pz.switches[s].name }));
    // Wrong.
    else miss(0, whyRoot(pz, ans, s), `s${s}`);
  };

  /**
   * A port clicked.
   *
   * @param p the port
   */
  const onPort = (p: number) => {
    // Only in steps 2 to 4, while playing.
    if (!pz || !ans || over || step < 2 || step > 4) return;
    // The stopwatch starts on the first move.
    if (!watch.running) watch.start();
    // Already marked: nothing to do.
    if (marks.rp.includes(p) || marks.dp.includes(p) || marks.bk.includes(p)) return;
    // The port's switch and ID, for the announcement.
    const label = `${pz.switches[pz.ports[p].sw].name} ${pidText(pz.ports[p])}`;
    // Step 2: root ports.
    if (step === 2) {
      // Right.
      if (ans.rootPort[pz.ports[p].sw] === p) accept({ ...marks, rp: [...marks.rp, p] }, t("live.rp", { port: label }));
      // Wrong.
      else miss(1, whyRootPort(pz, ans, p), `p${p}`);
    } else if (step === 3) {
      // Right.
      if (ans.designated[pz.ports[p].seg] === p) accept({ ...marks, dp: [...marks.dp, p] }, t("live.dp", { port: label }));
      // Wrong.
      else miss(2, whyDesignated(pz, ans, p), `p${p}`);
    } else if (ans.blocked.includes(p)) {
      // Step 4: every unmarked port left is blocked.
      accept({ ...marks, bk: [...marks.bk, p] }, t("live.bk", { port: label }));
    }
  };

  /** Show the answer: every mark set, the round lost. */
  const giveUp = () => {
    // Only while playing.
    if (!pz || !ans || over) return;
    // Every mark.
    const all: Marks = { root: ans.root, rp: ans.rootPort.filter((p): p is number => p !== null), dp: ans.designated, bk: ans.blocked };
    // The time now.
    const now = offset + (watch.running ? watch.stop() : watch.elapsed);
    // Shown.
    setMarks(all);
    // Over, not solved.
    setOver({ won: false, ms: now });
    // Recorded as played.
    if (today) recordResult(STP_ID, { dayKey: today, won: false, daily: mode === "daily" });
    // Saved finished.
    save({ marks: all, mistakes, ms: now, done: true, won: false });
    // The shell re-reads.
    setVersion((v) => v + 1);
    // Announced.
    setLive(t("live.answer"));
  };

  /** A new practice round. */
  const newRound = () => {
    // A fresh seed from the clock and chance: practice rounds need not repeat.
    setSeed(Math.floor(Math.random() * 4294967296));
  };

  // The share card and the shell's result.
  const result: ShellResult | null = useMemo(() => {
    // Only when over.
    if (!over || !pz) return null;
    // One square per step: green clean, yellow one or two mistakes, red more (or given up).
    const row = mistakes.map((m) => (!over.won ? "🟥" : m === 0 ? "🟩" : m <= 2 ? "🟨" : "🟥")).join("");
    // The total.
    const total = mistakes.reduce((a, b) => a + b, 0);
    // The summary line.
    const summary = t("share.summary", { time: formatDuration(over.ms), mistakes: total });
    // The title: the daily's number, or practice.
    const title = mode === "daily" && today ? `${t("cardName")} #${puzzleNumber(today)}${level === "hard" ? ` · ${t("hard")}` : ""}` : `${t("cardName")} · ${tc("practice")}${level === "hard" ? ` · ${t("hard")}` : ""}`;
    // The card.
    const share = shareText({ title, lines: [row], summary, locale, slug: STP_ID });
    // The result.
    return over.won
      ? { won: true, headline: tc("solvedIn", { time: formatDuration(over.ms) }), detail: t("result.detail", { mistakes: total, score: stpScore(over.ms, total) }), share }
      : { won: false, headline: t("result.shown"), detail: t("result.shownDetail"), share };
  }, [over, pz, mistakes, mode, today, level, t, tc, locale]);

  /**
   * Arrow keys move focus between the current step's targets.
   *
   * @param e the key event
   */
  const onBoardKey = (e: KeyboardEvent<SVGSVGElement>) => {
    // Only the arrows.
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    // The targets in order, on the board that has focus (the other orientation is hidden).
    const items = Array.from(e.currentTarget.querySelectorAll<SVGGElement>("[data-target='1']"));
    // None.
    if (items.length === 0) return;
    // The focused one.
    const i = items.indexOf(document.activeElement as SVGGElement);
    // Forward or back.
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    // Not the page's scroll.
    e.preventDefault();
    // The next, wrapping.
    items[(i + dir + items.length) % items.length]?.focus();
  };

  /**
   * Enter or Space on a target.
   *
   * @param e the key event
   * @param act what the target does
   */
  const onTargetKey = (e: KeyboardEvent<SVGGElement>, act: () => void) => {
    // Enter or Space.
    if (e.key === "Enter" || e.key === " ") {
      // Not the page's scroll.
      e.preventDefault();
      // The action.
      act();
    }
  };

  // The rules under "How to play".
  const rules = (
    <ul>
      <li>{t("rules.r1")}</li>
      <li>{t("rules.r2")}</li>
      <li>{t("rules.r3")}</li>
      <li>{t("rules.r4")}</li>
      <li>{t("rules.r5")}</li>
    </ul>
  );

  // The order targets take focus in: top to bottom, then left to right.
  const reading = (a: Pt, b: Pt) => (a.y - b.y) * 1000 + (a.x - b.x);

  /**
   * The network drawn in one orientation.
   *
   * @param portrait two columns going down (a phone) or two rows going across (a wide screen)
   * @returns the SVG
   */
  const board = (portrait: boolean) => {
    // Nothing before the puzzle exists.
    if (!pz || !ans) return null;
    // Where everything goes.
    const lay = layout(pz, portrait);
    // The SVG.
    return (
      <svg className="fg-stp-board" viewBox={`0 0 ${lay.w} ${lay.h}`} style={{ "--fg-stp-w": `${lay.w * 1.1}px` } as CSSProperties} role="group" aria-label={t("boardLabel")} onKeyDown={onBoardKey}>
        {/* Links first, under everything. */}
        {pz.segments.map((seg, si) => {
          // The two ends.
          const [a, b] = seg.ports.map((q) => lay.at[pz.ports[q].sw]);
          // The sideways shift of a second cable.
          const off = laneOffset(pz, si);
          // Its perpendicular.
          const n = normal(pz, lay, si);
          // A link with a blocked end is drawn dashed once marked.
          const cut = seg.ports.some((q) => marks.bk.includes(q));
          // The midpoint, for the cost (a pair's costs pushed further apart).
          const mx = (a.x + b.x) / 2 + n.x * off * 1.4;
          // Vertical.
          const my = (a.y + b.y) / 2 + n.y * off * 1.4;
          // The link and its cost.
          return (
            <g key={`l${si}`}>
              <line x1={a.x + n.x * off} y1={a.y + n.y * off} x2={b.x + n.x * off} y2={b.y + n.y * off} className={`fg-stp-link${cut ? " fg-stp-link-cut" : ""}`} />
              <rect x={mx - 14} y={my - 10} width={28} height={20} rx={4} className="fg-stp-cost-bg" />
              <text x={mx} y={my + 4} textAnchor="middle" className="fg-stp-cost">{seg.cost}</text>
            </g>
          );
        })}

        {/* The switches. */}
        {pz.switches.map((s, si) => {
          // Its centre.
          const c = lay.at[si];
          // A target in step 1.
          const target = step === 1 && !over;
          // The root, once found.
          const isRoot = marks.root === si;
          // The switch.
          return (
            <g
              key={`s${si}`}
              className={`fg-stp-switch${isRoot ? " fg-stp-switch-root" : ""}${wrong === `s${si}` ? " fg-stp-wrong" : ""}${target ? " fg-stp-target" : ""}`}
              role="button"
              tabIndex={target ? 0 : -1}
              data-target={target ? "1" : "0"}
              aria-label={t(isRoot ? "switchLabelRoot" : "switchLabel", { sw: s.name, bid: bidText(s) })}
              onClick={() => onSwitch(si)}
              onKeyDown={(e) => onTargetKey(e, () => onSwitch(si))}
            >
              <rect x={c.x - HW} y={c.y - HH} width={HW * 2} height={HH * 2} rx={6} className="fg-stp-box" />
              <text x={c.x} y={c.y - 7} textAnchor="middle" className="fg-stp-name">{s.name}{isRoot ? ` · ${t("rootShort")}` : ""}</text>
              <text x={c.x} y={c.y + 6} textAnchor="middle" className="fg-stp-bid">{s.prio}</text>
              <text x={c.x} y={c.y + 17} textAnchor="middle" className="fg-stp-bid">…{macText(s).slice(-4)}</text>
            </g>
          );
        })}

        {/* The ports, in reading order so that Tab and the arrows walk the board sensibly. */}
        {pz.ports.map((_, pi) => pi).sort((x, y) => reading(portPos(pz, lay, x), portPos(pz, lay, y))).map((pi) => {
          // Where.
          const pos = portPos(pz, lay, pi);
          // Its role, once marked.
          const role = marks.rp.includes(pi) ? "rp" : marks.dp.includes(pi) ? "dp" : marks.bk.includes(pi) ? "bk" : null;
          // A target in steps 2 to 4 while unmarked.
          const target = !over && step >= 2 && step <= 4 && role === null;
          // The port.
          const port = pz.ports[pi];
          // The far end's switch.
          const far = pz.switches[pz.ports[pz.segments[port.seg].ports.find((q) => q !== pi)!].sw];
          // The text in the marker: the role letter and the port ID.
          const text = role ? `${t(`roleShort.${role}`)} ${pidText(port)}` : pidText(port);
          // The marker.
          return (
            <g
              key={`p${pi}`}
              className={`fg-stp-port${role ? ` fg-stp-port-${role}` : ""}${wrong === `p${pi}` ? " fg-stp-wrong" : ""}${target ? " fg-stp-target" : ""}`}
              role="button"
              tabIndex={target ? 0 : -1}
              data-target={target ? "1" : "0"}
              aria-label={t("portLabel", { sw: pz.switches[port.sw].name, pid: pidText(port), far: far.name, cost: port.cost, role: role ? t(`roleLong.${role}`) : t("roleLong.none") })}
              onClick={() => onPort(pi)}
              onKeyDown={(e) => onTargetKey(e, () => onPort(pi))}
            >
              <rect x={pos.x - 26} y={pos.y - 22} width={52} height={44} className="fg-stp-hit" />
              <rect x={pos.x - 24} y={pos.y - 10} width={48} height={20} rx={10} className="fg-stp-pill" />
              <text x={pos.x} y={pos.y + 3.5} textAnchor="middle" className="fg-stp-pid">{text}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  // The game.
  return (
    <GameShell gameId={STP_ID} kind={mode === "daily" ? "daily" : "score"} today={today} rules={rules} result={result} onPlayAgain={newRound} formatBest={(b) => t("bestScore", { n: b })} version={version}>
      <div className="fg-stp">
        {/* Daily or practice, easy or hard. */}
        <div className="fg-stp-toolbar">
          <div className="fg-buttons" role="group" aria-label={t("modeLabel")}>
            <button type="button" className={`fg-button${mode === "daily" ? " fg-button-primary" : ""}`} aria-pressed={mode === "daily"} onClick={() => setMode("daily")}>
              {tc("daily")}
            </button>
            <button type="button" className={`fg-button${mode === "practice" ? " fg-button-primary" : ""}`} aria-pressed={mode === "practice"} onClick={() => { if (mode !== "practice") newRound(); setMode("practice"); }}>
              {tc("practice")}
            </button>
          </div>
          <div className="fg-buttons" role="group" aria-label={t("levelLabel")}>
            <button type="button" className={`fg-button${level === "easy" ? " fg-button-primary" : ""}`} aria-pressed={level === "easy"} onClick={() => setLevel("easy")}>
              {t("easy")}
            </button>
            <button type="button" className={`fg-button${level === "hard" ? " fg-button-primary" : ""}`} aria-pressed={level === "hard"} onClick={() => setLevel("hard")}>
              {t("hard")}
            </button>
          </div>
        </div>

        {/* Before mount the daily has no day: a neutral board. */}
        {(!pz || !ans) && <p className="fg-muted">{tc("loading")}</p>}

        {pz && ans && (
          <>
            {/* The step, the progress and the clock. */}
            <div className="fg-hud">
              <span className="fg-readout">{tc("time")} {formatDuration(ms)}</span>
              <span className="fg-chip">{t("mistakes", { n: mistakes.reduce((a, b) => a + b, 0) })}</span>
            </div>
            <ol className="fg-stp-steps">
              {[1, 2, 3, 4].map((s) => (
                <li key={s} className={`fg-stp-step${step === s ? " fg-stp-step-now" : ""}${step > s ? " fg-stp-step-done" : ""}`} aria-current={step === s ? "step" : undefined}>
                  {t(`step${s}`, {
                    done: s === 2 ? marks.rp.length : s === 3 ? marks.dp.length : marks.bk.length,
                    total: s === 2 ? pz.switches.length - 1 : s === 3 ? pz.segments.length : ans.blocked.length,
                  })}
                </li>
              ))}
            </ol>

            {/* The network: portrait on a phone, landscape on a wide screen (the hidden one is out of the tab order). */}
            <div className="fg-stp-narrow">{board(true)}</div>
            <div className="fg-stp-wide">{board(false)}</div>

            {/* The reason for the last wrong move. */}
            {why && <p className="fg-stp-why" role="note">{t(`why.${why.id}`, why.args)}</p>}

            {/* The bridge IDs in full, the reference the diagram abbreviates. */}
            <details className="fg-stp-ids">
              <summary>{t("idsTitle")}</summary>
              <p className="fg-small fg-muted">{t("idsNote")}</p>
              <ul className="fg-stp-idlist fg-mono">
                {pz.switches.map((s) => (
                  <li key={s.name}>{s.name} {bidText(s)}</li>
                ))}
              </ul>
            </details>

            {/* The controls. */}
            <div className="fg-buttons">
              {!over && (
                <button type="button" className="fg-button" onClick={giveUp}>
                  {tc("giveUp")}
                </button>
              )}
              {mode === "practice" && (
                <button type="button" className="fg-button" onClick={newRound}>
                  {tc("newRound")}
                </button>
              )}
            </div>
          </>
        )}

        {/* The polite announcement line. */}
        <p className="fg-stp-sr" aria-live="polite">{live}</p>
      </div>
    </GameShell>
  );
}
