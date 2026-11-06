// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/WhackABug.tsx
// ----------------------------------------------------------------------------
// WHACK-A-BUG, the board (PRIME 03/11/2026). A code editor with nine panes:
// bugs crawl out for a moment and must be hit; features must be left alone; a
// rare golden bug is worth more; consecutive hits build a multiplier. Sixty
// seconds a round. Mouse, touch, or the keys Q W E / A S D / Z X C and the
// number pad.
//
// The round itself is decided by the engine (src/lib/fun/games/whack-a-bug):
// the daily run is the same 60 seconds for everyone on a UTC day; practice
// rounds use a seed picked here. This component only keeps the clock, turns
// taps and keys into engine calls, and draws. The daily run counts once, from
// the moment it starts: its running score is saved on every hit, so a run left
// or reloaded mid-round ends with the score it had (PRIME 03/11/2026, "Close
// the open items": a reload used to give a fresh daily run).
//
// A hidden tab pauses the round and the 3-2-1 countdown brings it back where it
// stopped (review R3-17, 03/11/2026: the clock used to run on while the tab was
// away). Pausing never restarts anything: the daily run's save stays as it was,
// so a reload while paused still ends the run with its score. The readouts sit
// in three fixed columns, so the board no longer jumps when the combo grows
// (R3-03). The daily run shows the puzzle number and the streak in the frame,
// practice the best score (R3-I1).
// ============================================================================

"use client";

// React's state, effects, refs and memoisation.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// The frame around every game.
import GameShell, { type ShellResult } from "./GameShell";
// Today's UTC day, the reduced-motion preference, the frame loop.
import { useEarlierDay, useFrameLoop, useReducedMotion, useToday } from "@/lib/fun/hooks";
// The puzzle number for the share card.
import { puzzleNumber } from "@/lib/fun/daily";
// The site's own letter shortcuts stand down while a round owns the keyboard.
import { setSiteShortcutsSuppressed } from "@/lib/pageCapabilities";
// The share card.
import { shareText } from "@/lib/fun/share";
// What this browser remembers.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The rules.
import {
  GAME_ID,
  ROUND_MS,
  SLOTS,
  PENALTY_FEATURE,
  accuracy,
  applyTap,
  advance,
  dailySchedule,
  endOrder,
  initScore,
  itemAt,
  multiplier,
  practiceSchedule,
  type ScoreState,
  type Spawn,
  type TapOutcome,
} from "@/lib/fun/games/whack-a-bug/engine";

/** The key shown on each slot, row by row (the number pad's digits follow the same layout). */
const SLOT_KEYS = ["Q", "W", "E", "A", "S", "D", "Z", "X", "C"];
/** The number pad digit of each slot. */
const SLOT_PAD = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];
/** KeyboardEvent.code to slot: the letter block and the number pad, by position. */
const CODE_TO_SLOT: Record<string, number> = {
  KeyQ: 0, KeyW: 1, KeyE: 2, KeyA: 3, KeyS: 4, KeyD: 5, KeyZ: 6, KeyX: 7, KeyC: 8,
  Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8,
};
/** The countdown before a round, in milliseconds. */
const COUNTDOWN_MS = 3000;
/** How long a hit's mark stays on its slot. */
const MARK_MS = 450;

/** The saved daily run: finished, or in progress (saved on every hit so that leaving does not reset it). */
interface DailySave {
  /** The run is over (false while it is being played). */
  done: boolean;
  /** The run ended because the page was left or reloaded mid-round. */
  interrupted?: boolean;
  /** Points. */
  score: number;
  /** Accuracy, percent. */
  acc: number;
  /** Longest run of hits. */
  bestCombo: number;
  /** Bugs hit. */
  hits: number;
  /** Golden bugs hit. */
  goldens: number;
  /** Features hit. */
  features: number;
}

/**
 * A daily run in progress, as saved after each hit.
 *
 * @param st the running score
 * @returns the save, marked not done
 */
function liveSave(st: ScoreState): DailySave {
  // The same numbers a finished run keeps.
  return { done: false, score: st.score, acc: accuracy(st), bestCombo: st.bestCombo, hits: st.hits, goldens: st.goldens, features: st.features };
}

/** The round's phase: "paused" while the tab is hidden (the countdown then brings the round back). */
type Phase = "idle" | "countdown" | "playing" | "paused" | "done";

/**
 * The mark of a kept daily state, for days played before the marks existed (GameShell's gradeSaved): a closed run, won with any points as recorded.
 *
 * @param _day the run's day (the saved run says it all)
 * @param state the kept state
 * @returns 1 a closed run with points, 0 one without, null still running
 */
function gradeSaved(_day: string, state: unknown): 0 | 1 | null {
  // The saved run.
  const s = state as Partial<DailySave> | null;
  // Only a closed run.
  if (!s || s.done !== true) return null;
  // Points are a win.
  return typeof s.score === "number" && s.score > 0 ? 1 : 0;
}

/**
 * A bug, drawn in the current colour.
 *
 * @returns the SVG
 */
function BugArt() {
  // A beetle seen from above: head, body, wing line, six legs, two antennae.
  return (
    <svg viewBox="0 0 48 48" className="fg-wab-art" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M14 20 L6 16 M13 28 L5 28 M14 36 L6 40 M34 20 L42 16 M35 28 L43 28 M34 36 L42 40" />
        <path d="M21 9 L17 3 M27 9 L31 3" />
      </g>
      <circle cx="24" cy="12" r="5.5" fill="currentColor" />
      <ellipse cx="24" cy="29" rx="11" ry="13" fill="currentColor" />
      <path d="M24 17 L24 42" stroke="var(--surface-base)" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * A feature: a shipped parcel with a tick on it.
 *
 * @returns the SVG
 */
function FeatureArt() {
  // A box, its lid line, and a tick.
  return (
    <svg viewBox="0 0 48 48" className="fg-wab-art" aria-hidden="true" focusable="false">
      <rect x="7" y="14" width="34" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M7 22 L41 22 M24 14 L24 22" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 32 L22 37 L33 27" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The board.
 *
 * @param props the page's locale (for the share card's address)
 * @returns the game
 */
export default function WhackABug({ locale }: { locale: string }) {
  // The game's strings and the shell's.
  const t = useTranslations("devFun.games.whack-a-bug");
  const tc = useTranslations("devFun.games.common");
  // Today, after mount.
  const today = useToday();
  // The earlier puzzle on the board (?day=), or null: its wording says "this day's" where today's says "today's".
  const earlierDay = useEarlierDay();
  // Reduced motion.
  const reduce = useReducedMotion();
  // Daily or practice.
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  // The phase.
  const [phase, setPhase] = useState<Phase>("idle");
  // The practice seed (picked when a practice round starts).
  const [seed, setSeed] = useState(1);
  // Milliseconds into the round (0 before it starts; where it stopped while paused or resuming).
  const [now, setNow] = useState(0);
  // The countdown's number (3, 2, 1) while counting down.
  const [count, setCount] = useState(3);
  // The running score.
  const [score, setScore] = useState<ScoreState | null>(null);
  // The last hit's mark on its slot, with the points it changed.
  const [mark, setMark] = useState<{ slot: number; outcome: TapOutcome; at: number; delta: number } | null>(null);
  // The finished round, for the shell.
  const [result, setResult] = useState<ShellResult | null>(null);
  // Today's daily already played (restored from storage).
  const [dailyDone, setDailyDone] = useState<DailySave | null>(null);
  // The shell's stats line re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // The polite announcement.
  const [say, setSay] = useState("");
  // The clock: performance.now() at the round's start (moved on by any pause, so the round's time stops with it).
  const startRef = useRef(0);
  // performance.now() at which the countdown ends.
  const countEndRef = useRef(0);
  // Milliseconds into the round where play starts after the countdown: 0 for a new round, the pause point to resume.
  const resumeRef = useRef(0);
  // The live score, read by the key handler and the frame loop.
  const scoreRef = useRef<ScoreState | null>(null);
  // The phase as the frame loop sees it between renders (so a round starts and ends exactly once).
  const phaseRef = useRef<Phase>("idle");
  // The day of the daily run being played, or null (practice, or no round): hits save the running score under it.
  const dailyLiveRef = useRef<string | null>(null);

  // The round's schedule: the day's for the daily run, the seed's for practice.
  const schedule = useMemo<Spawn[]>(() => (mode === "daily" && today ? dailySchedule(today) : practiceSchedule(seed)), [mode, today, seed]);
  // The ids in end order, for the escape sweep.
  const order = useMemo(() => endOrder(schedule), [schedule]);

  /**
   * The share card and the shell's result for a finished round.
   *
   * @param s the final score
   * @param daily whether it was the daily run
   * @returns the result
   */
  const makeResult = useCallback(
    (s: { score: number; acc: number; bestCombo: number; hits: number; goldens: number; features: number; interrupted?: boolean }, daily: boolean): ShellResult => {
      // The title: the puzzle number for the daily, "practice" otherwise.
      const title = daily && today ? t("shareTitleDaily", { n: puzzleNumber(today) }) : t("shareTitlePractice");
      // The card.
      const share = shareText({
        title,
        lines: [`🐛 ${s.hits}  ✨ ${s.goldens}  🚫 ${s.features}`, `🎯 ${s.acc}%  🔗 ${s.bestCombo}`],
        // The score in the page's language, as the panel shows it (3.990 on a pt-BR page; review R3-10).
        summary: t("shareSummary", { score: s.score.toLocaleString(locale) }),
        locale,
        slug: GAME_ID,
      });
      // The shell's panel.
      const detail = t("resultDetail", { acc: s.acc, combo: s.bestCombo, hits: s.hits, features: s.features });
      // An interrupted daily run says so, ahead of the numbers.
      return { won: s.score > 0, headline: t("resultHeadline", { score: s.score.toLocaleString(locale) }), detail: s.interrupted ? `${t("resultInterrupted")} ${detail}` : detail, share };
    },
    [t, today, locale],
  );

  // Today's daily, restored once the day is known.
  useEffect(() => {
    // Not yet known.
    if (!today) return;
    // The stored state for today.
    const saved = loadRecord(GAME_ID).daily[today] as DailySave | undefined;
    // Nothing played today.
    if (!saved) return;
    // A run left mid-round: it ends now, with the score it had reached, and counts as today's run.
    if (!saved.done) {
      // The run, closed.
      const closed: DailySave = { ...saved, done: true, interrupted: true };
      // Saved as finished.
      saveDailyState(GAME_ID, today, closed);
      // Recorded once: counters, streak and best score.
      recordResult(GAME_ID, { dayKey: today, won: closed.score > 0, score: closed.score, daily: true });
      // The stats line re-reads.
      setVersion((v) => v + 1);
      // Remembered.
      setDailyDone(closed);
      // Shown in the shell.
      setResult(makeResult(closed, true));
      // Done here.
      return;
    }
    // A finished run shows its result again.
    setDailyDone(saved);
    // Shown in the shell.
    setResult(makeResult(saved, true));
  }, [today, makeResult]);

  /**
   * Start a round in a mode.
   *
   * @param m daily or practice
   */
  const start = (m: "daily" | "practice") => {
    // The mode.
    setMode(m);
    // A fresh practice seed (the engine stays pure; the page picks the seed).
    if (m === "practice") setSeed(Math.floor(Math.random() * 0x100000000));
    // The countdown ends three seconds from now, and the round then starts from its first millisecond.
    countEndRef.current = performance.now() + COUNTDOWN_MS;
    resumeRef.current = 0;
    // The round's time at zero, the countdown at three.
    setNow(0);
    setCount(Math.ceil(COUNTDOWN_MS / 1000));
    // A clean score (its arrays are sized when the round starts).
    scoreRef.current = null;
    setScore(null);
    // No old marks or result.
    setMark(null);
    setResult(null);
    // Counting down.
    phaseRef.current = "countdown";
    setPhase("countdown");
  };

  /**
   * The round is over: score, storage, result.
   *
   * @param final the final score
   */
  const finish = useCallback(
    (final: ScoreState) => {
      // Over.
      phaseRef.current = "done";
      setPhase("done");
      // The numbers.
      const summary = { score: final.score, acc: accuracy(final), bestCombo: final.bestCombo, hits: final.hits, goldens: final.goldens, features: final.features };
      // The daily run is saved for the day and counts for the streak.
      const daily = mode === "daily" && today !== null && !dailyDone;
      // No longer in progress.
      dailyLiveRef.current = null;
      // Saved.
      if (daily && today) {
        // The day's result.
        const save: DailySave = { done: true, ...summary };
        saveDailyState(GAME_ID, today, save);
        setDailyDone(save);
      }
      // Recorded: counters and best score.
      if (today) recordResult(GAME_ID, { dayKey: today, won: final.score > 0, score: final.score, daily });
      // The stats line re-reads.
      setVersion((v) => v + 1);
      // The shell's panel.
      setResult(makeResult(summary, daily));
      // Announced, the score in the page's language.
      setSay(t("sayEnd", { score: final.score.toLocaleString(locale), acc: summary.acc }));
    },
    [mode, today, dailyDone, makeResult, t, locale],
  );

  // The frame loop while counting down or playing.
  useFrameLoop(phase === "countdown" || phase === "playing", () => {
    // The clock.
    const t0 = performance.now();
    // Counting down, before a round or before it resumes.
    if (phaseRef.current === "countdown") {
      // What is left of the countdown.
      const leftMs = countEndRef.current - t0;
      // Still counting: whole seconds shown.
      if (leftMs > 0) {
        // 3, 2, 1.
        setCount(Math.max(1, Math.ceil(leftMs / 1000)));
        // Done for this frame.
        return;
      }
      // The round's clock picks up where play starts (0, or where the pause stopped it).
      startRef.current = countEndRef.current - resumeRef.current;
      // A new round (no score yet) begins here; a resumed one simply carries on.
      if (!scoreRef.current) {
        // A fresh score for this schedule.
        scoreRef.current = initScore(schedule);
        setScore(scoreRef.current);
        // Today's daily run counts from here: leaving now ends it with the score it has.
        if (mode === "daily" && today && !dailyDone) {
          // Hits save under today.
          dailyLiveRef.current = today;
          // Saved as started, with a score of zero.
          saveDailyState(GAME_ID, today, liveSave(scoreRef.current));
        } else {
          // Practice: nothing saved mid-round.
          dailyLiveRef.current = null;
        }
        // Announced.
        setSay(t("sayStart"));
      } else {
        // Announced: back where it stopped.
        setSay(t("sayResumed"));
      }
      // Playing.
      phaseRef.current = "playing";
      setPhase("playing");
    }
    // Milliseconds into the round.
    const ms = t0 - startRef.current;
    // The time, capped at the round's end.
    const at = Math.min(ROUND_MS, ms);
    setNow(at);
    // Escapes so far.
    if (scoreRef.current) {
      // Swept.
      const next = advance(schedule, order, scoreRef.current, at);
      // Only when something changed (escape counts are the only thing that can).
      if (next.ended !== scoreRef.current.ended) {
        // Kept.
        scoreRef.current = next;
        setScore(next);
      }
    }
    // The end of the round (once).
    if (ms >= ROUND_MS && scoreRef.current && phaseRef.current === "playing") finish(advance(schedule, order, scoreRef.current, ROUND_MS));
  });

  /**
   * A tap or a key on a slot.
   *
   * @param slot the slot
   */
  const hit = useCallback(
    (slot: number) => {
      // Only while playing.
      if (phaseRef.current !== "playing" || !scoreRef.current) return;
      // The time of the tap.
      const at = Math.min(ROUND_MS, performance.now() - startRef.current);
      // The score before.
      const before = scoreRef.current.score;
      // The engine's verdict.
      const { state, outcome } = applyTap(schedule, order, scoreRef.current, at, slot);
      // Kept.
      scoreRef.current = state;
      setScore(state);
      // A daily run saves its running score, so leaving mid-round keeps it.
      if (dailyLiveRef.current) saveDailyState(GAME_ID, dailyLiveRef.current, liveSave(state));
      // The mark on the slot.
      setMark({ slot, outcome, at, delta: state.score - before });
    },
    [schedule, order],
  );

  // A hidden tab pauses the round; shown again, the countdown brings it back where it stopped (review R3-17).
  useEffect(() => {
    // Only while a round is counting down, running or paused.
    if (phase !== "countdown" && phase !== "playing" && phase !== "paused") return;
    // The page hidden or shown.
    const onVis = () => {
      // Hidden: the round stops where it is.
      if (document.visibilityState === "hidden") {
        // Playing: the time reached is kept for the resume.
        if (phaseRef.current === "playing") {
          // Milliseconds into the round, as far as it went.
          const at = Math.min(ROUND_MS, performance.now() - startRef.current);
          // Kept.
          resumeRef.current = at;
          setNow(at);
        }
        // A countdown (to a new round or to a resume) simply starts again later: resumeRef already holds the point.
        // Paused (the frame loop stops; hits and keys are ignored; the daily run's save is left as it was).
        phaseRef.current = "paused";
        setPhase("paused");
        // Done.
        return;
      }
      // Shown again after a pause: three seconds of countdown, then the round goes on.
      if (phaseRef.current === "paused") {
        // The countdown's end.
        countEndRef.current = performance.now() + COUNTDOWN_MS;
        setCount(Math.ceil(COUNTDOWN_MS / 1000));
        // Counting down.
        phaseRef.current = "countdown";
        setPhase("countdown");
        // Announced.
        setSay(t("sayPaused"));
      }
    };
    // Listening.
    document.addEventListener("visibilitychange", onVis);
    // Stopped when the round ends or the page goes.
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase, t]);

  // While a round runs, Q W E and the rest are the game's, not the site's (the search's S, for one).
  useEffect(() => {
    // Only during the countdown, the round and a pause.
    if (phase !== "countdown" && phase !== "playing" && phase !== "paused") return;
    // The site's shortcuts off.
    setSiteShortcutsSuppressed(true);
    // Back on when the round ends or the page goes.
    return () => setSiteShortcutsSuppressed(false);
  }, [phase]);

  // The keys, while playing: the letter block and the number pad, by position.
  useEffect(() => {
    // Only while playing.
    if (phase !== "playing") return;
    // The handler.
    const onKey = (e: KeyboardEvent) => {
      // Shortcuts with modifiers and held-down repeats are not taps.
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      // The slot of this physical key.
      const slot = CODE_TO_SLOT[e.code];
      // Not one of ours.
      if (slot === undefined) return;
      // Ours: no typing or scrolling.
      e.preventDefault();
      // The tap.
      hit(slot);
    };
    // Listening.
    window.addEventListener("keydown", onKey);
    // Stopped when the round ends.
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, hit]);

  // What is up in each slot now.
  const visible: (Spawn | null)[] = [];
  // Each slot.
  for (let s = 0; s < SLOTS; s++) visible.push(phase === "playing" && score ? itemAt(schedule, score, now, s) : null);
  // Seconds left: the whole minute before a round (review R3-17: it read 0 s), none after it, the rest in between.
  const left = phase === "idle" ? ROUND_MS / 1000 : phase === "done" ? 0 : Math.max(0, Math.ceil((ROUND_MS - now) / 1000));
  // Whether a round is under way (counting down, running or paused).
  const busy = phase === "countdown" || phase === "playing" || phase === "paused";
  // The mark, while fresh.
  const freshMark = mark && phase === "playing" && now - mark.at < MARK_MS ? mark : null;

  // The rules.
  const rules = (
    <>
      <p>{t("rule1")}</p>
      <ul>
        <li>{t("rule2", { penalty: PENALTY_FEATURE })}</li>
        <li>{t("rule3")}</li>
        <li>{t("rule4")}</li>
        <li>{t("rule5")}</li>
      </ul>
      <p>{t("rule6")}</p>
    </>
  );

  // The page.
  return (
    <GameShell
      gameId={GAME_ID}
      // The daily run is a daily puzzle in the frame (its number, the streak); practice keeps the best score (R3-I1).
      kind={mode === "daily" ? "daily" : "score"}
      today={today}
      rules={rules}
      // No result while a round is under way.
      result={busy ? null : result}
      onPlayAgain={() => start("practice")}
      // The best score in the page's language.
      formatBest={(b) => b.toLocaleString(locale)}
      version={version}
      gradeSaved={gradeSaved}
    >
      {/* The polite line. */}
      <p className="fg-wab-sr" aria-live="polite">{say}</p>
      {/* Before mount: a neutral board, the same as the static HTML. */}
      {!today ? (
        <p className="fg-muted">{tc("loading")}</p>
      ) : (
        <>
          {/* The readouts: three fixed columns, a label over each value, so nothing wraps mid-round (R3-03). */}
          <div className="fg-wab-hud">
            <span className="fg-wab-stat">
              <span className="fg-wab-stat-label">{tc("time")}</span>
              <span className="fg-readout">{left}s</span>
            </span>
            <span className="fg-wab-stat">
              <span className="fg-wab-stat-label">{tc("score")}</span>
              <span className="fg-readout">{(score?.score ?? 0).toLocaleString(locale)}</span>
            </span>
            <span className="fg-wab-stat">
              <span className="fg-wab-stat-label">{t("comboLabel")}</span>
              <span className={`fg-readout ${score && multiplier(score.combo) > 1 ? "fg-wab-hot" : ""}`}>{t("comboValue", { mult: score ? multiplier(score.combo) : 1, n: score?.combo ?? 0 })}</span>
            </span>
          </div>
          {/* The editor. */}
          <div className={`fg-wab-editor ${reduce ? "fg-wab-still" : ""}`}>
            <div className="fg-wab-titlebar" aria-hidden="true">
              <span className="fg-wab-dot" />
              <span className="fg-wab-dot" />
              <span className="fg-wab-dot" />
              <span className="fg-wab-tab">prod.ts</span>
              <span className="fg-wab-branch">main</span>
            </div>
            <div className="fg-wab-grid" role="group" aria-label={t("boardLabel")}>
              {visible.map((item, s) => (
                <button
                  key={s}
                  type="button"
                  className={`fg-wab-slot ${item ? `fg-wab-has-${item.kind}` : ""} ${freshMark?.slot === s ? `fg-wab-mark-${freshMark.outcome}` : ""}`}
                  aria-label={t("slotLabel", { key: SLOT_KEYS[s], what: item ? t(`kind.${item.kind}`) : t("kind.empty") })}
                  // Touch and mouse hit on press, without waiting for the click.
                  onPointerDown={(e) => {
                    // Only the main button or a touch.
                    if (e.button !== 0) return;
                    // No focus jump or text selection.
                    e.preventDefault();
                    // The tap.
                    hit(s);
                  }}
                  // Keyboard activation (Enter or Space on a focused slot) arrives as a click with no pointer.
                  onClick={(e) => {
                    // detail is 0 for a keyboard click.
                    if (e.detail === 0) hit(s);
                  }}
                >
                  {/* The pane's code: line numbers and faint lines. */}
                  <span className="fg-wab-gutter" aria-hidden="true">
                    {s * 3 + 1}
                    <br />
                    {s * 3 + 2}
                    <br />
                    {s * 3 + 3}
                  </span>
                  <span className="fg-wab-code" aria-hidden="true">
                    <span className="fg-wab-line fg-wab-w1" />
                    <span className="fg-wab-line fg-wab-w2" />
                    <span className="fg-wab-line fg-wab-w3" />
                  </span>
                  {/* What is up. */}
                  {item && (
                    <span className={`fg-wab-item fg-wab-${item.kind}`} aria-hidden="true">
                      {item.kind === "feature" ? <FeatureArt /> : <BugArt />}
                      <span className="fg-wab-tag">{t(`tag.${item.kind}`)}</span>
                    </span>
                  )}
                  {/* The hit's mark. */}
                  {freshMark?.slot === s && (
                    <span className="fg-wab-pop" aria-hidden="true">
                      {freshMark.outcome === "empty" ? "·" : freshMark.delta < 0 ? `−${-freshMark.delta}` : freshMark.delta > 0 ? `+${freshMark.delta}` : "0"}
                    </span>
                  )}
                  {/* The keys. */}
                  <kbd className="fg-wab-key" aria-hidden="true">
                    {SLOT_KEYS[s]}
                    <span className="fg-wab-pad">{SLOT_PAD[s]}</span>
                  </kbd>
                </button>
              ))}
              {/* The countdown (or the pause), over the board. */}
              {(phase === "countdown" || phase === "paused") && (
                <div className="fg-wab-overlay" aria-hidden="true">
                  {phase === "paused" ? <span className="fg-wab-paused">{t("paused")}</span> : <span className="fg-wab-count">{count}</span>}
                </div>
              )}
            </div>
          </div>
          {/* A feature was hit: the old excuse. */}
          <p className="fg-wab-note" aria-live="polite">{freshMark?.outcome === "feature" ? t("featureHit", { penalty: PENALTY_FEATURE }) : " "}</p>
          {/* Start buttons, between rounds. */}
          {(phase === "idle" || phase === "done") && (
            <div className="fg-buttons">
              {!dailyDone && (
                <button type="button" className="fg-button fg-button-primary" onClick={() => start("daily")}>
                  {t(earlierDay ? "startDailyEarlier" : "startDaily")}
                </button>
              )}
              <button type="button" className={`fg-button ${dailyDone ? "fg-button-primary" : ""}`} onClick={() => start("practice")}>
                {t("startPractice")}
              </button>
            </div>
          )}
          {/* The daily is done for today. */}
          {dailyDone && !busy && <p className="fg-muted fg-small">{t(earlierDay ? "dailyDoneEarlier" : "dailyDone")}</p>}
          {/* The keys, for keyboard players. */}
          <p className="fg-muted fg-small">{t("keysHint")}</p>
        </>
      )}
    </GameShell>
  );
}
