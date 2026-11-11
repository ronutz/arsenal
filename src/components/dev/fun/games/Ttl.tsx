// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/Ttl.tsx
// ----------------------------------------------------------------------------
// TTL, the board (PRIME 08/11/2026, the arcade's first wave). A packet crosses
// a 13 x 13 network: every router it enters takes one off its Time to Live
// and adds a segment to its trail, the router that takes it to zero discards
// it, and the host it is sent to accepts it at any TTL. Twelve packets a run,
// packet n leaving with TTL n; the routers turn red once the TTL is 1. Arrow
// keys or W A S D, a swipe or a tap on the board, or the arrows under it.
//
// The rules live in src/lib/fun/games/ttl/engine.ts; this file keeps the real
// time (a tick every 200 ms for the first packet, 8 ms less for each one
// after), turns keys into turns, draws the board and the trace, and saves the
// daily run after every tick: its turns and the ticks played, which is all
// the engine needs to rebuild it. So a reload, or a hidden tab, pauses the run
// where it was, and Resume (with a 3-2-1) carries on from there; nothing can
// be undone. The day's run counts once, from Start; practice runs never end.
//
// House rules: Start before the network shows, and the run and its clock start
// together after the countdown (the routers and the host appear only then);
// the shell flashes, shakes and buzzes at the end; reduced motion drops the
// small pulses; every control is a 44 px target or more; the board never
// makes the page scroll sideways at 390 px; the share card shows how each
// packet ended, never where anything was.
// ============================================================================

"use client";

// React's state, effects, refs and memoisation.
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// Locale-aware links inside the site.
import { Link } from "@/i18n/navigation";
// The frame around every game.
import GameShell, { type ShellResult } from "./GameShell";
// The Start cover the timed games share.
import { StartCover } from "./LogicPuzzleKit";
// The day in play, the earlier day (if any), the reduced-motion preference, the frame loop.
import { useEarlierDay, useFrameLoop, useReducedMotion, useToday } from "@/lib/fun/hooks";
// The puzzle number for the share card.
import { puzzleNumber } from "@/lib/fun/daily";
// The site's own letter shortcuts stand down while a run owns the keyboard.
import { setSiteShortcutsSuppressed } from "@/lib/pageCapabilities";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// What this browser remembers.
import { loadRecord, recordResult, saveDailyState, updateRecord } from "@/lib/fun/storage";
// The rules.
import {
  COLS,
  GAME_ID,
  PACKETS,
  POINTS_DELIVERY,
  POINTS_HOP,
  ROWS,
  addressOf,
  canTurn,
  cellX,
  cellY,
  dailySeedKey,
  decodeTurns,
  encodeTurns,
  gradeSave,
  newRun,
  practiceSeedKey,
  replayTurns,
  sourceAddress,
  startTtl,
  step,
  tickMs,
  turnsFrom,
  type Dir,
  type PacketLog,
  type Run,
  type Turn,
  type TtlSave,
} from "@/lib/fun/games/ttl/engine";

/** The countdown before a run starts or resumes, in milliseconds. */
const COUNTDOWN_MS = 3000;
/** The pause after a delivery, so the next packet's TTL and host can be read, in milliseconds. */
const NEXT_PACKET_MS = 900;
/** How far a finger must travel to count as a swipe, in CSS pixels. */
const SWIPE_MIN = 24;
/** Turns waiting for the next ticks: two, so a quick double turn between ticks is kept. */
const QUEUE_MAX = 2;
/** KeyboardEvent.code to a direction: the arrows and W A S D, by position. */
const KEY_DIR: Readonly<Record<string, Dir>> = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r", KeyW: "u", KeyS: "d", KeyA: "l", KeyD: "r" };
/** The on-screen arrows, in the order they are laid out. */
const PAD: readonly Dir[] = ["u", "l", "d", "r"];

/** The run's phase: "between" is the short pause after a delivery; "paused" waits for Resume. */
type Phase = "idle" | "countdown" | "playing" | "between" | "paused" | "done";
/** Why a run is paused: the tab was hidden, the player pressed Pause, or the page was reloaded mid-run. */
type PauseCause = "hidden" | "player" | "reload";

/**
 * A random 32-bit seed from the browser's generator, for a practice run (the engine stays pure).
 *
 * @returns an unsigned seed
 */
function freshSeed(): number {
  // One random word.
  const a = new Uint32Array(1);
  // Filled by the platform.
  crypto.getRandomValues(a);
  // The seed.
  return a[0];
}

/**
 * Whether a key press belongs to something else on the page: a text field, a menu, a shortcut with a modifier.
 *
 * @param e the key event
 * @returns true when the run should leave it alone
 */
function keyIsElsewhere(e: KeyboardEvent): boolean {
  // Already handled.
  if (e.defaultPrevented) return true;
  // A shortcut, not a steer.
  if (e.altKey || e.ctrlKey || e.metaKey) return true;
  // The element the key went to.
  const el = e.target instanceof HTMLElement ? e.target : null;
  // Typing in a field, or inside a dialog or a menu, keeps its keys.
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !!el.closest('[role="dialog"], [role="menu"], [role="listbox"], dialog'));
}

/**
 * A packet's outcome as one share-card square: green when it was delivered having taken every hop its TTL allowed,
 * yellow when delivered with TTL to spare, red when a router discarded it, purple for a loop, black off the network.
 *
 * @param p the packet's log line, or undefined for a packet never sent
 * @returns one emoji
 */
function squareFor(p: PacketLog | undefined): string {
  // Never sent.
  if (!p) return "⬜";
  // Delivered: every hop taken (TTL 1 left), or some to spare.
  if (p.end === "delivered") return p.left === 1 ? "🟩" : "🟨";
  // Discarded at TTL zero, looped, off the network, or the time limit.
  return p.end === "expired" ? "🟥" : p.end === "loop" ? "🟪" : p.end === "noroute" ? "⬛" : "⬜";
}

/**
 * The class of a packet's chip under the board: delivered with every hop, with hops to spare, or lost.
 *
 * @param p the packet's log line
 * @returns the class
 */
function chipClass(p: PacketLog): string {
  // Delivered.
  if (p.end === "delivered") return p.left === 1 ? "fg-ttl-pk-full" : "fg-ttl-pk-spare";
  // Lost.
  return "fg-ttl-pk-lost";
}

/**
 * An arrow for the on-screen buttons, drawn in the current colour.
 *
 * @param props the direction
 * @returns the SVG
 */
function Arrow({ dir }: { dir: Dir }) {
  // The rotation of an arrow that points up.
  const turn = dir === "u" ? 0 : dir === "r" ? 90 : dir === "d" ? 180 : 270;
  // Decorative: the button has a label.
  return (
    <svg className="fg-ttl-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" transform={`rotate(${turn} 12 12)`} />
    </svg>
  );
}

/** The faint dots of the network's cells, drawn once. */
const DOTS = Array.from({ length: COLS * ROWS }, (_, c) => <circle key={c} cx={(c % COLS) + 0.5} cy={Math.floor(c / COLS) + 0.5} r={0.06} className="fg-ttl-dot" />);

/**
 * The game: head-up display, board, trace, controls.
 *
 * @param props the page's locale (for numbers and the share card's address)
 * @returns the game in its shell
 */
export default function Ttl({ locale }: { locale: string }) {
  // The game's strings and the shell's.
  const t = useTranslations("devFun.games.ttl");
  const tc = useTranslations("devFun.games.common");
  // The day in play, after mount.
  const today = useToday();
  // The earlier puzzle on the board (?day=), or null.
  const earlierDay = useEarlierDay();
  // Reduced motion.
  const reduce = useReducedMotion();
  // Daily or practice.
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  // The phase.
  const [phase, setPhase] = useState<Phase>("idle");
  // Why the run is paused, while it is.
  const [pauseCause, setPauseCause] = useState<PauseCause>("player");
  // The run on screen (the frame loop works on runRef; this drives the drawing).
  const [run, setRun] = useState<Run | null>(null);
  // The countdown's number.
  const [count, setCount] = useState(3);
  // The run just finished, and whether it was the daily: the result is worked out from it.
  const [final, setFinal] = useState<{ run: Run; daily: boolean } | null>(null);
  // Today's daily run, once finished (from this page or from storage).
  const [dailyDone, setDailyDone] = useState<TtlSave | null>(null);
  // The shell re-reads storage when this changes, and flashes the board.
  const [version, setVersion] = useState(0);
  // The polite announcement.
  const [say, setSay] = useState("");
  // The IPv6 view: Hop Limit and ICMPv6 instead of TTL and ICMP, addresses under 2001:db8::/32.
  const [v6, setV6] = useState(false);
  // The run, read by the frame loop and the keys between renders.
  const runRef = useRef<Run | null>(null);
  // The turns taken so far.
  const turnsRef = useRef<Turn[]>([]);
  // Turns waiting for the next ticks.
  const queueRef = useRef<Dir[]>([]);
  // Milliseconds counted toward the next tick.
  const accRef = useRef(0);
  // The phase, as the frame loop sees it.
  const phaseRef = useRef<Phase>("idle");
  // performance.now() at which the countdown ends, and at which the pause after a delivery ends.
  const countEndRef = useRef(0);
  const betweenEndRef = useRef(0);
  // The day of the daily run being played, or null (practice, or no run): every tick saves under it.
  const dailyLiveRef = useRef<string | null>(null);
  // Where a swipe or a tap on the board started.
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  // The board, for a tap's position.
  const boardRef = useRef<HTMLDivElement>(null);

  /**
   * Set the phase, for the frame loop and for the drawing at once.
   *
   * @param p the new phase
   */
  const goPhase = useCallback((p: Phase) => {
    // The loop's copy.
    phaseRef.current = p;
    // The drawing's.
    setPhase(p);
  }, []);

  /**
   * A cell's address in the view chosen.
   *
   * @param cell the cell
   * @param kind a router or a host
   * @returns the address
   */
  const addr = useCallback((cell: number, kind: "router" | "host") => addressOf(cell, kind, v6), [v6]);

  // Once the day is known: the view chosen before, and today's daily run (finished, or left mid-run).
  useEffect(() => {
    // Not yet known.
    if (!today) return;
    // The stored record.
    const rec = loadRecord(GAME_ID);
    // The view.
    setV6(rec.extra.view === "v6");
    // Today's saved run, if any.
    const saved = rec.daily[today] as Partial<TtlSave> | undefined;
    // Nothing started today.
    if (!saved || typeof saved.turns !== "string" || typeof saved.ticks !== "number") return;
    // Its turns.
    const turns = decodeTurns(saved.turns);
    // Not understood: left alone.
    if (!turns) return;
    // The run rebuilt from them.
    const { run: back } = replayTurns(dailySeedKey(today), turns, saved.ticks);
    // A finished run: shown with its result.
    if (saved.done === true && back.end) {
      // Remembered.
      setDailyDone(saved as TtlSave);
      // Drawn.
      runRef.current = back;
      setRun(back);
      // Its result.
      setFinal({ run: back, daily: true });
      // Over.
      goPhase("done");
      // Done here.
      return;
    }
    // A run left mid-way: back on the board, paused, for Resume.
    runRef.current = back;
    turnsRef.current = turns;
    queueRef.current = [];
    accRef.current = 0;
    // The daily, still counting under today.
    dailyLiveRef.current = today;
    setMode("daily");
    setRun(back);
    // Paused by the reload.
    setPauseCause("reload");
    goPhase("paused");
  }, [today, goPhase]);

  /**
   * Start a run in a mode.
   *
   * @param m daily or practice
   */
  const start = (m: "daily" | "practice") => {
    // Not before the day is known.
    if (!today) return;
    // The run's key: the day's, or a fresh practice seed.
    const fresh = newRun(m === "daily" ? dailySeedKey(today) : practiceSeedKey(freshSeed()));
    // On the board, with no turns, no queue and an empty tick.
    runRef.current = fresh;
    turnsRef.current = [];
    queueRef.current = [];
    accRef.current = 0;
    setRun(fresh);
    // No old result.
    setFinal(null);
    // The mode.
    setMode(m);
    // The daily run counts from this moment: saved as started, so a reload brings it back rather than starting afresh.
    if (m === "daily") {
      // Saved under today.
      dailyLiveRef.current = today;
      saveDailyState(GAME_ID, today, { turns: "", ticks: 0, done: false } satisfies TtlSave);
    } else {
      // Practice saves nothing mid-run.
      dailyLiveRef.current = null;
    }
    // The countdown; the network appears when it ends.
    countEndRef.current = performance.now() + COUNTDOWN_MS;
    setCount(Math.ceil(COUNTDOWN_MS / 1000));
    goPhase("countdown");
    // Announced.
    setSay(t("sayCountdown"));
  };

  /**
   * Carry on after a pause: a 3-2-1, then the run moves again.
   */
  const resume = () => {
    // Only a paused run that is not over.
    if (phaseRef.current !== "paused" || !runRef.current || runRef.current.end) return;
    // The countdown.
    countEndRef.current = performance.now() + COUNTDOWN_MS;
    setCount(Math.ceil(COUNTDOWN_MS / 1000));
    goPhase("countdown");
    // Announced.
    setSay(t("sayCountdown"));
  };

  /**
   * Pause a running run.
   *
   * @param cause why
   */
  const pause = useCallback(
    (cause: PauseCause) => {
      // Only while it runs (or counts down, or waits after a delivery).
      if (phaseRef.current !== "playing" && phaseRef.current !== "between" && phaseRef.current !== "countdown") return;
      // Waiting turns are dropped: the player steers again after the pause.
      queueRef.current = [];
      // The time toward the next tick starts again.
      accRef.current = 0;
      // Why.
      setPauseCause(cause);
      // Paused.
      goPhase("paused");
      // Announced.
      setSay(t("sayPaused"));
    },
    [goPhase, t],
  );

  /**
   * The run is over: saved, recorded, shown.
   *
   * @param end the ended run
   */
  const finish = useCallback(
    (end: Run) => {
      // Over.
      goPhase("done");
      // The day it was the daily run of, if it was.
      const day = dailyLiveRef.current;
      // No longer in progress.
      dailyLiveRef.current = null;
      // The daily run's save, final.
      if (day) {
        // The turns and the ticks, done.
        const save: TtlSave = { turns: encodeTurns(turnsRef.current), ticks: end.tick, done: true };
        // Saved first, so the board sends exactly this.
        saveDailyState(GAME_ID, day, save);
        // Remembered.
        setDailyDone(save);
      }
      // Recorded: counters, the best score and, for the daily run, the streak and the board.
      if (today) recordResult(GAME_ID, { dayKey: today, won: end.end?.kind === "complete", score: end.score, higherIsBetter: true, daily: day !== null });
      // The result.
      setFinal({ run: end, daily: day !== null });
      // The shell re-reads and flashes.
      setVersion((v) => v + 1);
      // Announced.
      setSay(t("sayEnd", { score: end.score, delivered: end.delivered, total: PACKETS }));
    },
    [goPhase, today, t, locale],
  );

  /** One tick: the next waiting turn the engine takes, the move, its consequences, the save. */
  const tick = useCallback(() => {
    // The run.
    const r = runRef.current;
    // Nothing to move.
    if (!r || r.end) return;
    // The first waiting turn that still turns the packet (a stale one is dropped).
    let turn: Dir | null = null;
    // Through the queue.
    while (queueRef.current.length > 0) {
      // The next one.
      const d = queueRef.current.shift() as Dir;
      // Taken.
      if (canTurn(r, d)) {
        // This tick's turn.
        turn = d;
        // One a tick.
        break;
      }
    }
    // The engine's tick.
    const { run: next, event, turned } = step(r, turn);
    // A taken turn is recorded with the tick it was taken on.
    if (turned && turn) turnsRef.current.push({ t: r.tick, d: turn });
    // Kept and drawn.
    runRef.current = next;
    setRun(next);
    // The daily run, saved on every tick, so a reload resumes exactly here and nothing can be undone.
    if (dailyLiveRef.current && !next.end) saveDailyState(GAME_ID, dailyLiveRef.current, { turns: encodeTurns(turnsRef.current), ticks: next.tick, done: false } satisfies TtlSave);
    // A hop: said, with the TTL left (and a warning at 1).
    if (event === "hop") {
      // The router and the TTL.
      const last = next.trace[next.trace.length - 1];
      // Announced.
      setSay(t(next.ttl === 1 ? "sayHopLast" : "sayHop", { n: next.hops, addr: addressOf(last.cell, "router", v6), ttl: next.ttl, field: t(v6 ? "fieldV6" : "fieldV4") }));
    } else if (event === "deliver") {
      // A short pause, so the new TTL and host can be read.
      betweenEndRef.current = performance.now() + NEXT_PACKET_MS;
      goPhase("between");
      // Announced.
      setSay(t("sayDeliver", { done: next.delivered, n: next.packet, ttl: next.ttl, field: t(v6 ? "fieldV6" : "fieldV4") }));
    } else if (next.end) {
      // The run is over.
      finish(next);
    }
  }, [finish, goPhase, t, v6]);

  // The frame loop while the run counts down, moves or waits after a delivery.
  useFrameLoop(phase === "countdown" || phase === "playing" || phase === "between", (dt) => {
    // The clock.
    const now = performance.now();
    // Counting down.
    if (phaseRef.current === "countdown") {
      // What is left of it.
      const left = countEndRef.current - now;
      // Still counting: whole seconds shown.
      if (left > 0) {
        // 3, 2, 1.
        setCount(Math.max(1, Math.ceil(left / 1000)));
        // Done for this frame.
        return;
      }
      // The run moves from here, its first tick a full tick away.
      accRef.current = 0;
      goPhase("playing");
      // Announced: the packet, its TTL, its host.
      const r = runRef.current;
      if (r) setSay(t("sayGo", { n: r.packet, ttl: r.ttl, field: t(v6 ? "fieldV6" : "fieldV4"), dest: addressOf(r.dest, "host", v6) }));
      // Done for this frame.
      return;
    }
    // The pause after a delivery.
    if (phaseRef.current === "between") {
      // Not over yet.
      if (now < betweenEndRef.current) return;
      // Moving again, a full tick from now.
      accRef.current = 0;
      goPhase("playing");
      // Done for this frame.
      return;
    }
    // Only a moving run ticks.
    if (phaseRef.current !== "playing" || !runRef.current) return;
    // The time since the last frame counts toward the next tick (the hook caps it at 100 ms, one tick at most).
    accRef.current += dt;
    // A tick is due.
    if (accRef.current >= tickMs(runRef.current.packet)) {
      // Its length is used up.
      accRef.current -= tickMs(runRef.current.packet);
      // The tick.
      tick();
    }
  });

  /**
   * Steer: a turn waits for the next tick, checked against the turn before it.
   *
   * @param d the direction
   */
  const steer = useCallback((d: Dir) => {
    // Only while the run is under way (a turn may be set during the countdown or the pause after a delivery).
    if (phaseRef.current !== "playing" && phaseRef.current !== "countdown" && phaseRef.current !== "between") return;
    // The run.
    const r = runRef.current;
    // Nothing to steer.
    if (!r || r.end) return;
    // The queue.
    const q = queueRef.current;
    // The direction the packet will have when this turn comes up.
    const after = q.length > 0 ? q[q.length - 1] : r.dir;
    // Not a turn from there, or the queue is full.
    if (!turnsFrom(after, d, r.body.length > 1) || q.length >= QUEUE_MAX) return;
    // Waiting.
    q.push(d);
  }, []);

  // A hidden tab pauses the run; shown again, a 3-2-1 brings it back (a pause the player chose stays until Resume).
  useEffect(() => {
    // The page hidden or shown.
    const onVis = () => {
      // Hidden: paused.
      if (document.visibilityState === "hidden") pause("hidden");
      // Shown after a hidden pause: the countdown.
      else if (phaseRef.current === "paused" && pauseCause === "hidden") resume();
    };
    // Listening.
    document.addEventListener("visibilitychange", onVis);
    // Stopped when the page goes.
    return () => document.removeEventListener("visibilitychange", onVis);
    // resume reads refs only; the effect follows the pause's cause.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pause, pauseCause]);

  // While a run is under way, the arrows and W A S D are the game's, not the site's.
  useEffect(() => {
    // Only during a run.
    if (phase !== "countdown" && phase !== "playing" && phase !== "between" && phase !== "paused") return;
    // The site's shortcuts off.
    setSiteShortcutsSuppressed(true);
    // Back on when the run ends or the page goes.
    return () => setSiteShortcutsSuppressed(false);
  }, [phase]);

  // The keys, anywhere on the page while a run is under way: steering, and P or Escape to pause and resume.
  useEffect(() => {
    // Only during a run.
    if (phase !== "countdown" && phase !== "playing" && phase !== "between" && phase !== "paused") return;
    // The handler.
    const onKey = (e: KeyboardEvent) => {
      // Meant for something else, or a held-down repeat.
      if (keyIsElsewhere(e) || e.repeat) return;
      // P or Escape: pause, or resume.
      if (e.code === "KeyP" || e.code === "Escape") {
        // Ours.
        e.preventDefault();
        // Paused: resume; running: pause.
        if (phaseRef.current === "paused") resume();
        else pause("player");
        // Done.
        return;
      }
      // A steering key.
      const d = KEY_DIR[e.code];
      // Not one of ours.
      if (!d) return;
      // Ours: no scrolling.
      e.preventDefault();
      // The turn.
      steer(d);
    };
    // Listening.
    window.addEventListener("keydown", onKey);
    // Stopped when the run ends.
    return () => window.removeEventListener("keydown", onKey);
    // resume reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pause, steer]);

  // A finger or a pointer goes down on the board.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    // Where.
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };

  // It comes up: a swipe steers along its longer axis; a tap steers toward the tapped side, across the packet's way.
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    // Where it started.
    const s = swipeRef.current;
    // Forgotten.
    swipeRef.current = null;
    // No start, or no run.
    const r = runRef.current;
    if (!s || !r) return;
    // The travel.
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    // A swipe.
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= SWIPE_MIN) {
      // The dominant axis.
      steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : dy > 0 ? "d" : "u");
      // Done.
      return;
    }
    // A tap: its cell, from the board's box.
    const box = boardRef.current?.getBoundingClientRect();
    // No box.
    if (!box || box.width === 0) return;
    // The tap's column and row, as fractions of a cell.
    const tx = ((e.clientX - box.left) / box.width) * COLS;
    const ty = ((e.clientY - box.top) / box.height) * ROWS;
    // The packet's centre.
    const hx = cellX(r.body[0]) + 0.5;
    const hy = cellY(r.body[0]) + 0.5;
    // Moving up or down: a tap left or right of it turns that way; moving sideways: above or below.
    if (r.dir === "u" || r.dir === "d") steer(tx < hx ? "l" : "r");
    else steer(ty < hy ? "u" : "d");
  };

  /**
   * Switch the view between IPv4 and IPv6, remembered with the game's other values.
   *
   * @param on the IPv6 view
   */
  const chooseView = (on: boolean) => {
    // Shown.
    setV6(on);
    // Kept.
    updateRecord(GAME_ID, (r) => ({ ...r, extra: { ...r.extra, view: on ? "v6" : "v4" } }));
  };

  /** "Read the board": where the host and the router are, from the packet, said politely. */
  const describe = () => {
    // The run.
    const r = runRef.current;
    // Nothing to read.
    if (!r) return;
    // The packet's column and row.
    const hx = cellX(r.body[0]);
    const hy = cellY(r.body[0]);
    /**
     * An item's place from the packet, in words.
     *
     * @param c the item's cell
     * @returns "3 right, 2 up" and the like
     */
    const from = (c: number) => {
      // Columns and rows away (right and down are positive).
      const dx = cellX(c) - hx;
      const dy = cellY(c) - hy;
      // The words, across first, then up or down.
      const parts: string[] = [];
      // Across.
      if (dx !== 0) parts.push(t(dx > 0 ? "off.right" : "off.left", { n: Math.abs(dx) }));
      // Up or down.
      if (dy !== 0) parts.push(t(dy > 0 ? "off.down" : "off.up", { n: Math.abs(dy) }));
      // Joined, or "right here" when it is the packet's own cell.
      return parts.length > 0 ? parts.join(", ") : t("off.here");
    };
    // Announced: the packet, its TTL and way, the host and the router.
    setSay(
      t("describeText", {
        x: hx + 1,
        y: hy + 1,
        dir: t(`dir.${r.dir}`),
        ttl: r.ttl,
        field: t(v6 ? "fieldV6" : "fieldV4"),
        trail: r.body.length - 1,
        dest: from(r.dest),
        router: r.router >= 0 ? from(r.router) : "-",
      }),
    );
  };

  // The result, worked out from the finished run in the view chosen.
  const result = useMemo<ShellResult | null>(() => {
    // No finished run.
    if (!final || !today) return null;
    // The run and how it ended.
    const r = final.run;
    const kind = r.end?.kind ?? "cap";
    // The router, the cell or the host the run ended on, as an address.
    const where = r.end ? (kind === "expired" ? addressOf(r.end.cell, "router", v6) : addressOf(r.end.cell, "host", v6)) : "";
    // Why it ended, in the protocol's words.
    const why = t(`why.${kind}${v6 ? "6" : ""}`, { n: r.end?.packet ?? r.packet, addr: where, src: sourceAddress(v6), total: PACKETS });
    // The share card: one square per packet, then the counts; nothing of where anything was.
    const share = shareText({
      title: final.daily ? t("shareTitleDaily", { n: puzzleNumber(today) }) : t("shareTitlePractice"),
      lines: [Array.from({ length: PACKETS }, (_, i) => squareFor(r.log[i])).join(""), t("shareLine", { delivered: r.delivered, total: PACKETS, hops: r.totalHops })],
      summary: t("shareSummary", { score: r.score, time: formatDuration(r.ms) }),
      locale,
      slug: GAME_ID,
    });
    // The panel.
    return {
      won: kind === "complete",
      headline: t(`head.${kind}`, { score: r.score.toLocaleString(locale) }),
      detail: `${t("resultDetail", { delivered: r.delivered, total: PACKETS, hops: r.totalHops, time: formatDuration(r.ms) })} ${why}`,
      share,
    };
  }, [final, today, v6, t, locale]);

  // Whether a run is under way (counting down, moving, between packets or paused).
  const busy = phase === "countdown" || phase === "playing" || phase === "between" || phase === "paused";
  // The run on screen.
  const r = run;
  // The network's items are hidden until the first tick (the first countdown, or a pause before it), so the board and
  // the clock start together.
  const hidden = (phase === "countdown" || phase === "paused") && !!r && r.tick === 0;
  // At TTL 1 the next router would discard the packet.
  const lastHop = !!r && !r.end && r.ttl === 1;
  // The field's name in the view chosen.
  const field = t(v6 ? "fieldV6" : "fieldV4");
  // Whether the daily can still be started.
  const dailyOpen = !dailyDone;

  // The rules.
  const rules = (
    <>
      <p>{t("rule1")}</p>
      <ul>
        <li>{t("rule2")}</li>
        <li>{t("rule3", { hop: POINTS_HOP })}</li>
        <li>{t("rule4", { delivery: POINTS_DELIVERY })}</li>
        <li>{t("rule5")}</li>
      </ul>
      <p>{t("rule6")}</p>
      <p>{t("rule7")}</p>
    </>
  );

  // The game in its shell.
  return (
    <GameShell
      gameId={GAME_ID}
      // The daily run is a daily puzzle in the frame (its number, the streak); practice keeps the best score.
      kind={mode === "daily" ? "daily" : "score"}
      today={today}
      rules={rules}
      // No result while a run is under way.
      result={busy ? null : result}
      onPlayAgain={() => start("practice")}
      // The best score in the page's language.
      formatBest={(b) => b.toLocaleString(locale)}
      version={version}
      gradeSaved={gradeSave}
    >
      {/* The polite line. */}
      <p className="sr-only" aria-live="polite">
        {say}
      </p>
      {/* Before mount: a neutral line, the same as the static HTML. */}
      {!today ? (
        <p className="fg-muted">{tc("loading")}</p>
      ) : (
        <div className="fg-ttl-wrap">
          {/* The readouts: four fixed columns, a label over each value, so nothing jumps as numbers grow. */}
          <div className="fg-ttl-hud">
            <span className="fg-ttl-stat">
              <span className="fg-ttl-stat-label">{t("packetLabel")}</span>
              <span className="fg-readout">{r ? t("packetValue", { n: r.packet, total: PACKETS }) : "-"}</span>
            </span>
            <span className="fg-ttl-stat">
              <span className="fg-ttl-stat-label">{field}</span>
              {/* The TTL, the number that matters: red at 1 (and at 0, once a router discarded the packet), pulsing once on
                  each change unless motion is reduced. */}
              <span key={r ? `${r.packet}-${r.ttl}` : "none"} className={`fg-readout fg-ttl-ttl${lastHop || r?.end?.kind === "expired" ? " fg-ttl-ttl-low" : ""}${!reduce && r && r.tick > 0 ? " fg-pop" : ""}`}>
                {r ? r.ttl : "-"}
              </span>
            </span>
            <span className="fg-ttl-stat">
              <span className="fg-ttl-stat-label">{t("hopsLabel")}</span>
              <span className="fg-readout">{r ? r.hops : "-"}</span>
            </span>
            <span className="fg-ttl-stat">
              <span className="fg-ttl-stat-label">{tc("score")}</span>
              <span className="fg-readout">{r ? r.score.toLocaleString(locale) : "-"}</span>
            </span>
          </div>

          {/* The twelve packets: how each ended, the one in flight outlined. */}
          {r && (
            <ol className="fg-ttl-packets" aria-label={t("packetsLabel")}>
              {Array.from({ length: PACKETS }, (_, i) => {
                // The packet's log line, if it has finished.
                const p = r.log[i];
                // In flight.
                const now = !r.end && r.packet === i + 1;
                // Its chip.
                return (
                  <li key={i} className={`fg-ttl-pk${p ? ` ${chipClass(p)}` : ""}${now ? " fg-ttl-pk-now" : ""}`} aria-label={t("packetChip", { n: i + 1, ttl: startTtl(i + 1), state: p ? t(`chip.${p.end === "delivered" ? (p.left === 1 ? "full" : "spare") : "lost"}`) : now ? t("chip.now") : t("chip.waiting") })}>
                    <span aria-hidden="true">{i + 1}</span>
                  </li>
                );
              })}
            </ol>
          )}

          {/* The board, its controls and the trace: stacked on a phone, the trace beside them on a wide screen. */}
          <div className="fg-ttl-play">
            {!r ? (
              // Before Start: the board's place, empty, with the button (nothing of the network is on the page yet).
              <StartCover
                label={t(dailyOpen ? (earlierDay ? "startDailyEarlier" : "startDaily") : "startPractice")}
                note={t("startNote")}
                onStart={() => start(dailyOpen ? "daily" : "practice")}
                className="fg-ttl-start"
              />
            ) : (
              <div
                ref={boardRef}
                className={`fg-ttl-board${busy && phase !== "paused" ? " fg-ttl-board-live" : ""}`}
                onPointerDown={onDown}
                onPointerUp={onUp}
                onPointerCancel={() => (swipeRef.current = null)}
              >
                <svg className="fg-ttl-svg" viewBox={`0 0 ${COLS} ${ROWS}`} role="img" aria-label={t("boardLabel", { cols: COLS, rows: ROWS })}>
                  {/* The cells. */}
                  {DOTS}
                  {/* The host the packet is sent to: a screen on a stand. */}
                  {!hidden && (
                    <g className="fg-ttl-host" transform={`translate(${cellX(r.dest) + 0.5} ${cellY(r.dest) + 0.5})`}>
                      <rect x={-0.36} y={-0.32} width={0.72} height={0.48} rx={0.08} />
                      <path d="M-0.18 0.36H0.18M0 0.16V0.36" />
                    </g>
                  )}
                  {/* The router: a circle with the four arrows of a router's symbol; red once it would be the last. */}
                  {!hidden && r.router >= 0 && (
                    <g className={`fg-ttl-router${lastHop ? " fg-ttl-router-hot" : ""}`} transform={`translate(${cellX(r.router) + 0.5} ${cellY(r.router) + 0.5})`}>
                      <circle r={0.38} className="fg-ttl-router-body" />
                      <path d="M-0.22 -0.22L-0.07 -0.07M0.22 0.22L0.07 0.07M0.22 -0.22L0.07 -0.07M-0.22 0.22L-0.07 0.07" className="fg-ttl-router-mark" />
                    </g>
                  )}
                  {/* The trail, faint at its tail. */}
                  {r.body.slice(1).map((c, i, all) => (
                    <rect key={`${c}-${i}`} x={cellX(c) + 0.14} y={cellY(c) + 0.14} width={0.72} height={0.72} rx={0.18} className="fg-ttl-seg" style={{ opacity: 1 - (0.55 * (i + 1)) / (all.length + 1) }} />
                  ))}
                  {/* The packet, carrying its TTL. */}
                  <g transform={`translate(${cellX(r.body[0]) + 0.5} ${cellY(r.body[0]) + 0.5})`}>
                    <rect x={-0.44} y={-0.44} width={0.88} height={0.88} rx={0.2} className={`fg-ttl-head${lastHop || r.end?.kind === "expired" ? " fg-ttl-head-low" : ""}`} />
                    {/* Written a hundred times larger and scaled down, so no browser's minimum font size can blow it up. */}
                    <text transform="scale(0.01)" y={19} textAnchor="middle" className="fg-ttl-head-text">
                      {r.ttl}
                    </text>
                  </g>
                  {/* Where the run ended: a ring, green for a completed run. */}
                  {r.end && <circle cx={cellX(r.end.cell) + 0.5} cy={cellY(r.end.cell) + 0.5} r={0.62} className={`fg-ttl-end${r.end.kind === "complete" ? " fg-ttl-end-won" : ""}`} />}
                </svg>
                {/* The countdown, the pause after a delivery, or the pause itself, over the board. */}
                {(phase === "countdown" || phase === "between" || phase === "paused") && (
                  <div className="fg-ttl-overlay" aria-hidden="true">
                    {phase === "countdown" ? (
                      <span className="fg-ttl-count">{count}</span>
                    ) : phase === "between" ? (
                      <span className="fg-ttl-overlay-title">{t("overlayPacket", { n: r.packet, ttl: r.ttl, field })}</span>
                    ) : (
                      <>
                        <span className="fg-ttl-overlay-title">{t("paused")}</span>
                        <span className="fg-ttl-overlay-note">{t(pauseCause === "reload" ? "pausedReload" : "pausedNote")}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* The on-screen arrows, in a cross, and Pause or Resume: right under the board, so a phone shows both at once. */}
            {r && !r.end && (
              <div className="fg-ttl-controls">
                <div className="fg-ttl-pad" role="group" aria-label={t("padLabel")}>
                  {PAD.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`fg-button fg-ttl-pad-${d}`}
                      aria-label={t(`steer.${d}`)}
                      // Touch and mouse steer on press, without waiting for the click.
                      onPointerDown={(e) => {
                        // Only the main button or a touch.
                        if (e.button !== 0) return;
                        // No focus jump.
                        e.preventDefault();
                        // The turn.
                        steer(d);
                      }}
                      // Keyboard activation (Enter or Space on a focused arrow) arrives as a click with no pointer.
                      onClick={(e) => {
                        // detail is 0 for a keyboard click.
                        if (e.detail === 0) steer(d);
                      }}
                    >
                      <Arrow dir={d} />
                    </button>
                  ))}
                </div>
                <div className="fg-buttons">
                  {/* Pause, or Resume after any pause. */}
                  <button type="button" className="fg-button fg-button-primary" onClick={() => (phase === "paused" ? resume() : pause("player"))}>
                    {phase === "paused" ? t("resume") : t("pause")}
                  </button>
                  {/* Where everything is, read aloud. */}
                  <button type="button" className="fg-button" onClick={describe} disabled={hidden}>
                    {t("describe")}
                  </button>
                </div>
              </div>
            )}

            {/* The trace: the packet in flight as traceroute would list it, hop by hop. */}
            <section className="fg-ttl-trace" aria-label={t("traceLabel")}>
              <p className="fg-ttl-trace-head">
                {r && !hidden ? t("traceHead", { src: sourceAddress(v6), dest: addr(r.dest, "host"), n: r.packet, ttl: startTtl(r.packet), field }) : t("traceIdle")}
              </p>
              {r && !hidden && (
                <ol className="fg-ttl-trace-list">
                  {r.trace.map((h, i) => (
                    <li key={i} className="fg-ttl-trace-line">
                      <span className="fg-ttl-trace-n">{i + 1}</span>
                      <span className="fg-ttl-trace-addr">{addr(h.cell, "router")}</span>
                      <span className={h.ttl === 0 ? "fg-ttl-trace-bad" : ""}>{h.ttl === 0 ? t(v6 ? "traceExceeded6" : "traceExceeded") : t("traceTtl", { ttl: h.ttl, field })}</span>
                    </li>
                  ))}
                  {/* No hop yet. */}
                  {r.trace.length === 0 && !r.end && <li className="fg-ttl-trace-empty">{t("traceNoHop")}</li>}
                  {/* The run's last line: delivered, a loop or no route. */}
                  {r.end && r.end.kind !== "expired" && (
                    <li className={r.end.kind === "complete" ? "fg-ttl-trace-ok" : "fg-ttl-trace-bad"}>{t(`traceEnd.${r.end.kind}${v6 && r.end.kind === "noroute" ? "6" : ""}`, { left: r.ttl, field })}</li>
                  )}
                </ol>
              )}
            </section>
          </div>

          {/* Between runs: the other way to play. */}
          {(phase === "idle" || phase === "done") && (
            <div className="fg-buttons">
              {/* The daily run, once a practice run is on the board and the daily is still to play. */}
              {r && dailyOpen && (
                <button type="button" className="fg-button fg-button-primary" onClick={() => start("daily")}>
                  {t(earlierDay ? "startDailyEarlier" : "startDaily")}
                </button>
              )}
              {/* Practice, any time. */}
              {(r || dailyOpen) && (
                <button type="button" className={`fg-button${!dailyOpen ? " fg-button-primary" : ""}`} onClick={() => start("practice")}>
                  {t("startPractice")}
                </button>
              )}
            </div>
          )}

          {/* The view: the IPv4 names or the IPv6 ones. */}
          <div className="fg-ttl-view" role="group" aria-label={t("viewLabel")}>
            <button type="button" className="fg-button" aria-pressed={!v6} onClick={() => chooseView(false)}>
              {t("viewV4")}
            </button>
            <button type="button" className="fg-button" aria-pressed={v6} onClick={() => chooseView(true)}>
              {t("viewV6")}
            </button>
          </div>

          {/* The daily is done for today. */}
          {dailyDone && !busy && <p className="fg-muted fg-small">{t(earlierDay ? "dailyDoneEarlier" : "dailyDone")}</p>}
          {/* The keys, for keyboard players. */}
          <p className="fg-muted fg-small fg-ttl-keys">{t("keysHint")}</p>
          {/* Learn the real thing: the article that explains TTL, Time Exceeded and traceroute. */}
          <p className="fg-small fg-ttl-learn">
            {t("learnLead")} <Link href="/learn/icmp-ping-and-traceroute">{t("learnLink")}</Link>
          </p>
        </div>
      )}
    </GameShell>
  );
}
