// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/SpanningTree.tsx
// ----------------------------------------------------------------------------
// SPANNING TREE, the board (PRIME 03/11/2026). A small switched network drawn
// as an inline SVG that fits a 390 px phone: switches with their bridge IDs,
// links with their costs, a port ID at each end of each link. Four steps:
// click the root bridge, mark every root port, mark every link's designated
// port; the ports that are left block, and the board marks them itself (no
// decision is left by then; review R1-13, 03/11/2026). A wrong move says why,
// with the tie-breaker that decided. The rules are IEEE 802.1D's, applied by
// src/lib/fun/games/spanning-tree/engine.ts, which also places everything on
// the board (stpLayout) and proves that no port marker covers a cost, another
// marker or a switch on any daily puzzle (review R1-03).
//
// The clock (review R1-01) is the logic puzzles' visible-time clock: it pauses
// while the tab is hidden, saves itself when the page is hidden or closed and
// every few seconds, and an unfinished daily round runs again as soon as it is
// restored. "Show the answer" takes two presses (review R1-07). On a phone the
// controls above the board fit on two lines, and the clock sits under the
// board as in the other logic puzzles (review R1-10).
// Keyboard: the targets of the current step take focus in reading order; the
// arrow keys move between them; Enter or Space marks.
// ============================================================================

"use client";

// React's state, memo, effects, refs and callbacks.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
// Strings.
import { useTranslations } from "next-intl";
// The frame every game sits in.
import GameShell, { type ShellResult } from "./GameShell";
// The visible-time clock the logic puzzles share.
import { useRoundClock } from "./LogicPuzzleKit";
// Today's day.
import { useToday } from "@/lib/fun/hooks";
// The puzzle number, and practice seeds.
import { makeRng, puzzleNumber } from "@/lib/fun/daily";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// The one storage key.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The rules of the game, and where the board puts everything.
import {
  STP_DRAW, STP_ID, bidText, dailyStp, generateStp, macText, pidText, solveStp, stpLayout, stpScore, whyDesignated, whyRoot, whyRootPort,
  type StpLevel, type StpPt, type StpPuzzle, type StpWhy,
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
  /** Milliseconds spent so far (visible time only). */
  ms: number;
  /** Finished. */
  done: boolean;
  /** Solved (not given up). */
  won: boolean;
}

/**
 * The mark of a kept daily state, for days played before the marks existed (GameShell's gradeSaved): any level solved marks the day solved, a level given up marks it played.
 *
 * @param _day the puzzle's day (the saved levels say it all)
 * @param state the kept state
 * @returns 1 a level solved, 0 a level given up and none solved, null none finished
 */
function gradeSaved(_day: string, state: unknown): 0 | 1 | null {
  // The saved levels.
  const levels = state !== null && typeof state === "object" ? Object.values(state as Record<string, Partial<StpSave> | null>) : [];
  // A level solved.
  if (levels.some((l) => l?.done === true && l.won === true)) return 1;
  // A level finished (given up).
  return levels.some((l) => l?.done === true) ? 0 : null;
}

/** No marks yet. */
const NO_MARKS: Marks = { root: null, rp: [], dp: [], bk: [] };

/** How long the first press of "Show the answer" waits for the second, in milliseconds. */
const GIVE_UP_ARM_MS = 4000;

/** A port's touch area's half width and half height: 52 by 44 units, a finger's width on a phone. */
const HIT = { w: 26, h: 22 } as const;

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
  // "Show the answer" pressed once and waiting for the second press.
  const [armed, setArmed] = useState(false);

  // The latest round, for the clock's saves, which come from event listeners between renders.
  const latest = useRef({ mode, level, today, marks, mistakes, over });
  // Kept current on every render.
  latest.current = { mode, level, today, marks, mistakes, over };

  /**
   * Save the daily state of a level (both levels share one stored day).
   *
   * @param lvl the level
   * @param next what to save
   */
  const saveLevel = useCallback((lvl: StpLevel, next: StpSave) => {
    // The day.
    const day = latest.current.today;
    // Only the daily is saved.
    if (latest.current.mode !== "daily" || !day) return;
    // Both levels' states.
    const stored = (loadRecord(STP_ID).daily[day] ?? {}) as Partial<Record<StpLevel, StpSave>>;
    // This one replaced.
    saveDailyState(STP_ID, day, { ...stored, [lvl]: next });
  }, []);

  // The clock saves the round in progress when the page is hidden or closed, and every few seconds.
  const persist = useCallback(
    (ms: number) => {
      // The round as it stands.
      const r = latest.current;
      // Only an unfinished round (a finished one was saved at the end).
      if (r.over) return;
      // Saved with the clock's exact total.
      saveLevel(r.level, { marks: r.marks, mistakes: r.mistakes, ms, done: false, won: false });
    },
    [saveLevel],
  );
  // The clock: visible time only.
  const clock = useRoundClock(persist);
  // Its latest functions, for the switches and the unmount below.
  const clockRef = useRef(clock);
  // Kept current.
  clockRef.current = clock;
  // Save now, before the round leaves the screen (another level or mode, or another page of the site).
  const persistNow = useCallback(() => {
    // Only while the clock is on.
    if (clockRef.current.running) persist(clockRef.current.now());
  }, [persist]);
  // Leaving the page inside the site: the round in progress is saved.
  useEffect(() => () => persistNow(), [persistNow]);

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
    // The clock back to zero, stopped.
    clock.reset(0);
    // No reason shown.
    setWhy(null);
    // Not armed.
    setArmed(false);
    // The daily restores today's state for this level.
    if (mode === "daily" && today && pz) {
      // Both levels' states.
      const day = (loadRecord(STP_ID).daily[today] ?? {}) as Partial<Record<StpLevel, StpSave>>;
      // This level's.
      const saved = day[level];
      // Restored when present.
      if (saved && saved.marks) {
        // Its time so far.
        const ms = typeof saved.ms === "number" && Number.isFinite(saved.ms) && saved.ms >= 0 ? saved.ms : 0;
        // The marks.
        setMarks(saved.marks);
        // The mistakes.
        setMistakes(saved.mistakes ?? [0, 0, 0]);
        // Finished or not.
        setOver(saved.done ? { won: saved.won, ms } : null);
        // A finished round shows its time; an unfinished one is running again at once (a reload wins no time).
        if (saved.done) clock.reset(ms);
        // Running from where it was saved.
        else clock.start(ms);
        // Restored.
        return;
      }
    }
    // A fresh board.
    setMarks(NO_MARKS);
    // No mistakes.
    setMistakes([0, 0, 0]);
    // Playing.
    setOver(null);
    // The clock's functions are stable; listing the clock itself would restart this on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, level, today, pz]);

  // The first press of "Show the answer" disarms itself after a few seconds.
  useEffect(() => {
    // Nothing armed.
    if (!armed) return;
    // Disarmed later.
    const id = window.setTimeout(() => setArmed(false), GIVE_UP_ARM_MS);
    // Cleared on the second press or a new puzzle.
    return () => window.clearTimeout(id);
  }, [armed]);

  // The time shown.
  const ms = over ? over.ms : clock.ms;

  /**
   * Save the daily state of the level on screen.
   *
   * @param next what to save
   */
  const save = (next: StpSave) => saveLevel(level, next);

  /**
   * Accept a move: new marks, maybe the end. Once the last designated port is marked, the ports left are exactly
   * the blocked ones: the board marks them itself and the round ends.
   *
   * @param picked the new marks
   * @param said what to announce
   */
  const accept = (picked: Marks, said: string) => {
    // Every root port and designated port marked: nothing is left to decide.
    const decided = picked.root !== null && picked.rp.length === pz!.switches.length - 1 && picked.dp.length === pz!.segments.length;
    // The blocked ports, marked by the board when they were not yet.
    const next = decided && picked.bk.length < ans!.blocked.length ? { ...picked, bk: ans!.blocked.slice() } : picked;
    // Said when the board did it: "The 2 ports left block: SW3 128.2, SW4 128.1."
    const auto = next !== picked ? ` ${t("live.bkAll", { n: ans!.blocked.length, ports: ans!.blocked.map((q) => `${pz!.switches[pz!.ports[q].sw].name} ${pidText(pz!.ports[q])}`).join(", ") })}` : "";
    // The marks.
    setMarks(next);
    // The reason box clears.
    setWhy(null);
    // Done when every blocked port is marked.
    const done = decided && next.bk.length === ans!.blocked.length;
    // The time now: exact (the clock stops at the end).
    const now = done ? clock.stop() : clock.now();
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
      setLive(`${said}${auto} ${t("live.solved", { time: formatDuration(now) })}`);
      // Done.
      return;
    }
    // Saved in progress; the clock keeps running.
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
    // The clock starts on the first move (a running clock carries on).
    clock.start();
    // Announced.
    setLive(t(`why.${w.id}`, w.args));
    // Saved.
    save({ marks, mistakes: next, ms: clock.now(), done: false, won: false });
  };

  /**
   * A switch clicked.
   *
   * @param s the switch
   */
  const onSwitch = (s: number) => {
    // Only in step 1, while playing.
    if (!pz || !ans || over || step !== 1) return;
    // The clock starts on the first move.
    clock.start();
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
    // The clock starts on the first move.
    clock.start();
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
      // Step 4 (only a round saved half way through step 4 before the board marked them itself): blocked.
      accept({ ...marks, bk: [...marks.bk, p] }, t("live.bk", { port: label }));
    }
  };

  /** Show the answer: the first press arms, the second sets every mark and ends the round, lost. */
  const giveUp = () => {
    // Only while playing.
    if (!pz || !ans || over) return;
    // The first press only arms it.
    if (!armed) {
      // Armed.
      setArmed(true);
      // Wait for the second press.
      return;
    }
    // Disarmed.
    setArmed(false);
    // Every mark.
    const all: Marks = { root: ans.root, rp: ans.rootPort.filter((p): p is number => p !== null), dp: ans.designated, bk: ans.blocked };
    // The time now (the clock stops; a round never started shows what it had).
    const now = clock.stop();
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
    // A fresh seed from chance: practice rounds need not repeat.
    setSeed(Math.floor(Math.random() * 4294967296));
  };

  /**
   * Switch mode or level, saving the daily round on screen first.
   *
   * @param nextMode the mode
   * @param nextLevel the level
   */
  const switchTo = (nextMode: "daily" | "practice", nextLevel: StpLevel) => {
    // Nothing changes.
    if (nextMode === mode && nextLevel === level) return;
    // The round on screen saved with its exact time.
    persistNow();
    // A fresh practice puzzle when practice starts.
    if (nextMode === "practice" && mode !== "practice") newRound();
    // The mode.
    setMode(nextMode);
    // The level.
    setLevel(nextLevel);
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
    // The level, always named, so an easy card and a hard card of the same day read apart.
    const levelWord = level === "hard" ? t("hard") : t("easy");
    // The title: the daily's number, or practice.
    const title = mode === "daily" && today ? `${t("cardName")} #${puzzleNumber(today)} · ${levelWord}` : `${t("cardName")} · ${tc("practice")} · ${levelWord}`;
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
  const reading = (a: StpPt, b: StpPt) => (a.y - b.y) * 1000 + (a.x - b.x);

  /**
   * The network drawn in one orientation.
   *
   * @param portrait two columns going down (a phone) or two rows going across (a wide screen)
   * @returns the SVG
   */
  const board = (portrait: boolean) => {
    // Nothing before the puzzle exists.
    if (!pz || !ans) return null;
    // Where everything goes (the engine's geometry, proven clear by its self-test).
    const lay = stpLayout(pz, portrait);
    // The ports in reading order, so that Tab and the arrows walk the board sensibly.
    const order = pz.ports.map((_, pi) => pi).sort((x, y) => reading(lay.ports[x], lay.ports[y]));
    // A port's role, once marked.
    const roleOf = (pi: number) => (marks.rp.includes(pi) ? "rp" : marks.dp.includes(pi) ? "dp" : marks.bk.includes(pi) ? "bk" : null);
    // Whether a port is a target now: steps 2 to 4, unmarked, while playing.
    const isTarget = (pi: number) => !over && step >= 2 && step <= 4 && roleOf(pi) === null;
    // The SVG.
    return (
      <svg className="fg-stp-board" viewBox={`0 0 ${lay.w} ${lay.h}`} style={{ "--fg-stp-w": `${lay.w * 1.1}px` } as CSSProperties} role="group" aria-label={t("boardLabel")} onKeyDown={onBoardKey}>
        {/* Links first, under everything, each with its cost. */}
        {pz.segments.map((seg, si) => {
          // The line and the cost's place.
          const l = lay.links[si];
          // A link with a blocked end is drawn dashed once marked.
          const cut = seg.ports.some((q) => marks.bk.includes(q));
          // The link and its cost.
          return (
            <g key={`l${si}`}>
              <line x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} className={`fg-stp-link${cut ? " fg-stp-link-cut" : ""}`} />
              <rect x={l.cost.x - STP_DRAW.costW} y={l.cost.y - STP_DRAW.costH} width={STP_DRAW.costW * 2} height={STP_DRAW.costH * 2} rx={4} className="fg-stp-cost-bg" />
              <text x={l.cost.x} y={l.cost.y + 4} textAnchor="middle" className="fg-stp-cost">{seg.cost}</text>
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
              <rect x={c.x - STP_DRAW.boxW} y={c.y - STP_DRAW.boxH} width={STP_DRAW.boxW * 2} height={STP_DRAW.boxH * 2} rx={6} className="fg-stp-box" />
              <text x={c.x} y={c.y - 8} textAnchor="middle" className="fg-stp-name">{s.name}{isRoot ? ` · ${t("rootShort")}` : ""}</text>
              <text x={c.x} y={c.y + 6} textAnchor="middle" className="fg-stp-bid">{s.prio}</text>
              <text x={c.x} y={c.y + 18} textAnchor="middle" className="fg-stp-bid">…{macText(s).slice(-4)}</text>
            </g>
          );
        })}

        {/* The ports' touch areas, under every marker, so a tap on a marker always reaches that marker's port. */}
        <g aria-hidden="true">
          {order.filter(isTarget).map((pi) => (
            <rect key={`h${pi}`} x={lay.ports[pi].x - HIT.w} y={lay.ports[pi].y - HIT.h} width={HIT.w * 2} height={HIT.h * 2} className="fg-stp-hit" onClick={() => onPort(pi)} />
          ))}
        </g>

        {/* The ports' markers, in reading order. */}
        {order.map((pi) => {
          // Where.
          const pos = lay.ports[pi];
          // Its role, once marked.
          const role = roleOf(pi);
          // A target now.
          const target = isTarget(pi);
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
              <rect x={pos.x - STP_DRAW.pillW} y={pos.y - STP_DRAW.pillH} width={STP_DRAW.pillW * 2} height={STP_DRAW.pillH * 2} rx={10} className="fg-stp-pill" />
              <text x={pos.x} y={pos.y + 3.5} textAnchor="middle" className="fg-stp-pid">{text}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  // The game.
  return (
    <GameShell gameId={STP_ID} kind={mode === "daily" ? "daily" : "score"} today={today} rules={rules} result={result} onPlayAgain={newRound} formatBest={(b) => t("bestScore", { n: b })} version={version} gradeSaved={gradeSaved}>
      <div className="fg-stp">
        {/* Daily or practice, easy or hard: two compact groups, on one line on a phone. */}
        <div className="fg-stp-toolbar">
          <div className="fg-buttons fg-stp-group" role="group" aria-label={t("modeLabel")}>
            <button type="button" className={`fg-button fg-stp-tool${mode === "daily" ? " fg-button-primary" : ""}`} aria-pressed={mode === "daily"} onClick={() => switchTo("daily", level)}>
              {tc("daily")}
            </button>
            <button type="button" className={`fg-button fg-stp-tool${mode === "practice" ? " fg-button-primary" : ""}`} aria-pressed={mode === "practice"} onClick={() => switchTo("practice", level)}>
              {tc("practice")}
            </button>
          </div>
          <div className="fg-buttons fg-stp-group" role="group" aria-label={t("levelLabel")}>
            <button type="button" className={`fg-button fg-stp-tool${level === "easy" ? " fg-button-primary" : ""}`} aria-pressed={level === "easy"} onClick={() => switchTo(mode, "easy")}>
              {t("easy")}
            </button>
            <button type="button" className={`fg-button fg-stp-tool${level === "hard" ? " fg-button-primary" : ""}`} aria-pressed={level === "hard"} onClick={() => switchTo(mode, "hard")}>
              {t("hard")}
            </button>
          </div>
        </div>

        {/* Before mount the daily has no day: a neutral board. */}
        {(!pz || !ans) && <p className="fg-muted">{tc("loading")}</p>}

        {pz && ans && (
          <>
            {/* The steps: on a phone the step in progress is written out and the others shrink to their number. */}
            <ol className="fg-stp-steps">
              {[1, 2, 3, 4].map((s) => (
                <li key={s} className={`fg-stp-step${step === s ? " fg-stp-step-now" : ""}${step > s ? " fg-stp-step-done" : ""}`} aria-current={step === s ? "step" : undefined}>
                  <span className="fg-stp-step-full">
                    {t(`step${s}`, {
                      done: s === 2 ? marks.rp.length : s === 3 ? marks.dp.length : marks.bk.length,
                      total: s === 2 ? pz.switches.length - 1 : s === 3 ? pz.segments.length : ans.blocked.length,
                    })}
                  </span>
                  <span className="fg-stp-step-num" aria-hidden="true">
                    {s}
                  </span>
                </li>
              ))}
            </ol>

            {/* The network: portrait on a phone, landscape on a wide screen (the hidden one is out of the tab order). */}
            <div className="fg-stp-narrow">{board(true)}</div>
            <div className="fg-stp-wide">{board(false)}</div>

            {/* The clock and the mistakes, under the board as in the other logic puzzles (the board starts higher on a phone). */}
            <div className="fg-hud">
              <span className="fg-readout">{tc("time")} {formatDuration(ms)}</span>
              <span className="fg-chip">{t("mistakes", { n: mistakes.reduce((a, b) => a + b, 0) })}</span>
            </div>

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

            {/* The controls: "Show the answer" in two presses; a new practice round while playing (the result offers "Play again" after). */}
            <div className="fg-buttons">
              {!over && (
                <button type="button" className={`fg-button${armed ? " fg-stp-armed" : ""}`} onClick={giveUp}>
                  {armed ? t("giveUpConfirm") : tc("giveUp")}
                </button>
              )}
              {mode === "practice" && !over && (
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
