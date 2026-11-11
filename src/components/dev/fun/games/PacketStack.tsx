// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/PacketStack.tsx
// ----------------------------------------------------------------------------
// PACKET STACK, the board (PRIME 08/11/2026, the arcade's first wave). Headers
// fall into a four-column well, one column per layer: Ethernet, IP, TCP or
// UDP, payload. The player steers each block into its column and sets its
// field (Change field cycles the EtherType, the Protocol number or the
// destination port) so that every header names the block to its right; a
// full row that reads as a valid frame is delivered, one that breaks the
// chain is dropped and stays at the bottom of the well.
//
// The rules live in src/lib/fun/games/packet-stack/engine.ts; this file keeps
// the clock (the fall, the 3-2-1 count, the pause), turns keys, taps and
// buttons into the engine's moves, draws the well, and keeps the day's run in
// the shared store (src/lib/fun/storage.ts) after every placement, so a
// reload resumes it where it was, paused. The house rules of the games: the
// well and its first block appear only after Start and the count, together
// with the clock; the end of a run flashes, shakes and buzzes (GameShell);
// reduced motion drops the animations; every action has a key; every control
// is at least 44 px; the well fits a 390 px phone without sideways scroll; the
// share card shows how each frame went, never which values were set.
// ============================================================================

"use client";

// React's state, effects, refs and memoisation.
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// Locale-aware links inside the site (the "Learn the real thing" line).
import { Link } from "@/i18n/navigation";
// The frame around every game.
import GameShell, { type ShellResult } from "./GameShell";
// The Start cover shared with the timed games.
import { StartCover } from "./LogicPuzzleKit";
// Today's UTC day (or the earlier one in play), the reduced-motion preference, the frame loop.
import { useEarlierDay, useFrameLoop, useReducedMotion, useToday } from "@/lib/fun/hooks";
// The puzzle number for the share card.
import { puzzleNumber } from "@/lib/fun/daily";
// The site's letter shortcuts stand down while a run owns the keyboard.
import { setSiteShortcutsSuppressed } from "@/lib/pageCapabilities";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// What this browser remembers.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The rules.
import {
  COLS,
  DAILY_BLOCKS,
  DAILY_FRAMES,
  FIELD_OF,
  GAME_ID,
  LAYER_OF,
  OPTIONS,
  PASS_MARK,
  ROWS,
  currentBlock,
  dailyDeal,
  fallMs,
  isApp,
  level,
  namesOf,
  newRun,
  place,
  practiceDeal,
  replay,
  upcoming,
  valueOf,
  type Block,
  type Cell,
  type Kind,
  type PlaceEvent,
  type Problem,
  type Run,
} from "@/lib/fun/games/packet-stack/engine";

/** The count before a run starts or resumes, in milliseconds. */
const COUNTDOWN_MS = 3000;
/** How long "End run" waits for its second press, in milliseconds. */
const CONFIRM_MS = 4000;
/** The share card's squares: a delivered frame, a dropped one, one never sent. */
const SQUARES = { d: "🟩", x: "🟥", none: "⬛" } as const;
/** Keys that move the block, by KeyboardEvent.key. */
const MOVE_KEYS: Record<string, -1 | 1> = { ArrowLeft: -1, ArrowRight: 1 };
/** Keys that change the field: forwards and backwards. */
const FIELD_KEYS: Record<string, -1 | 1> = { ArrowUp: 1, x: 1, X: 1, z: -1, Z: -1 };
/** Keys that jump to a column. */
const COLUMN_KEYS: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };
/** Each layer's colour class, for a block or a label (written out, so the stylesheet guards can read each name). */
const LAYER_CLASS = ["fg-ps-k0", "fg-ps-k1", "fg-ps-k2", "fg-ps-k3"] as const;
/** Each column's faint tint, for its empty cells. */
const COLUMN_CLASS = ["fg-ps-l0", "fg-ps-l1", "fg-ps-l2", "fg-ps-l3"] as const;

/** The day's run as saved after every placement: the engine replays it on load and on the scoreboard. */
interface DailySave {
  /** The placements, one hexadecimal digit each (engine.ts). */
  m: string;
  /** The run is over. */
  done: boolean;
  /** Milliseconds of play (pauses and counts left out). */
  ms: number;
}

/** The block in the air: its column, its row counted from the bottom of the well, and its field's option. */
interface Falling {
  /** The column. */
  col: number;
  /** The row, 0 at the bottom. */
  row: number;
  /** The field's option index. */
  v: number;
}

/** The run's phase: before it, the 3-2-1 count, falling blocks, paused (well hidden), over. */
type Phase = "idle" | "countdown" | "playing" | "paused" | "done";

/** What the last resolved row did, for the line under the well. */
interface LastRow {
  /** The engine's event. */
  event: Extract<PlaceEvent, { kind: "delivered" | "dropped" }>;
  /** A counter, so the same text twice is announced twice. */
  n: number;
}

/**
 * Whether a saved state is a day's run in the shape this page writes.
 *
 * @param x anything read from storage
 * @returns true for { m, done, ms }
 */
function isSave(x: unknown): x is DailySave {
  // A plain object with the three fields.
  if (!x || typeof x !== "object") return false;
  // Its fields.
  const s = x as Record<string, unknown>;
  // Placements as text, an outcome flag, a time.
  return typeof s.m === "string" && typeof s.done === "boolean" && typeof s.ms === "number";
}

/**
 * The mark of a kept daily state, for days played before the marks existed (GameShell's gradeSaved): a finished run
 * replayed, solved when it delivered PASS_MARK frames.
 *
 * @param day the run's day
 * @param state the kept state
 * @returns 1 won, 0 lost, null unfinished or unreadable
 */
function gradeSaved(day: string, state: unknown): 0 | 1 | null {
  // Only a finished run this page wrote.
  if (!isSave(state) || !state.done) return null;
  // Replayed through the day's deal.
  const run = replay(dailyDeal(day), state.m);
  // Unreadable or not over.
  if (!run || !run.over) return null;
  // Won with enough frames.
  return run.delivered >= PASS_MARK ? 1 : 0;
}

/**
 * A field's value as the cells show it: an EtherType in hexadecimal with 0x, any other number in decimal.
 *
 * @param kind the header
 * @param value the number
 * @returns the text
 */
function fmtValue(kind: Kind, value: number): string {
  // EtherTypes are written in hexadecimal (RFC 894's "hexadecimal 0800").
  return kind === "eth" ? `0x${value.toString(16).toUpperCase().padStart(4, "0")}` : String(value);
}

/**
 * A random 32-bit seed from the browser's generator, for a practice run.
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
 * Whether a key press belongs to something else on the page (a text field, a dialog) or carries a modifier.
 *
 * @param e the key event
 * @returns true when the run should leave it alone
 */
function keyIsElsewhere(e: KeyboardEvent): boolean {
  // Already handled, or a shortcut with a modifier.
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return true;
  // The element the key went to.
  const el = e.target instanceof HTMLElement ? e.target : null;
  // Typing in a field, or inside a dialog or a menu, keeps its keys.
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !!el.closest('[role="dialog"], [role="menu"], dialog'));
}

/**
 * Whether a cell of the well is free for the block in the air.
 *
 * @param r the run
 * @param col the column
 * @param row the row from the bottom
 * @returns true when nothing is there and the cell is inside the well
 */
function freeAt(r: Run, col: number, row: number): boolean {
  // Inside the well, and above the dropped frames and the column's stack.
  return col >= 0 && col < COLS && row < ROWS && row >= r.jam.length + r.cols[col].length;
}

/**
 * The colour class of a block's layer (the same tint as its column's label).
 *
 * @param kind the block
 * @returns fg-ps-k0 to fg-ps-k3
 */
function layerClass(kind: Kind): string {
  // Its layer's class.
  return LAYER_CLASS[LAYER_OF[kind]];
}

/**
 * Keep a button press from moving the keyboard focus onto the button (a tap or a click on the pad), so Space still
 * drops the block afterwards; the keyboard can still reach the buttons with Tab.
 *
 * @param e the pointer event
 */
function keepFocus(e: ReactPointerEvent<HTMLButtonElement>): void {
  // No focus change from a pointer.
  e.preventDefault();
}

/**
 * The game: the head-up display, the queue, the well, the controls, the line under it.
 *
 * @param props the page's locale (for the share card's address and the numbers)
 * @returns the game in its shell
 */
export default function PacketStack({ locale }: { locale: string }) {
  // The game's strings and the shell's.
  const t = useTranslations("devFun.games.packet-stack");
  const tc = useTranslations("devFun.games.common");
  // The day in play (today, or the earlier day the address asks for), after mount.
  const today = useToday();
  // The earlier day on the board, or null: its wording says "this day's" where today's says "today's".
  const earlierDay = useEarlierDay();
  // Reduced motion.
  const reduce = useReducedMotion();
  // The daily run or practice.
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  // The phase.
  const [phase, setPhase] = useState<Phase>("idle");
  // The practice seed (picked when a practice run starts).
  const [seed, setSeed] = useState(1);
  // The run (the engine's state), shown.
  const [run, setRun] = useState<Run>(() => newRun());
  // The block in the air, or null.
  const [fall, setFall] = useState<Falling | null>(null);
  // The 3-2-1 number while counting.
  const [count, setCount] = useState(3);
  // The last resolved row, for the line under the well.
  const [last, setLast] = useState<LastRow | null>(null);
  // The finished run, for the shell.
  const [result, setResult] = useState<ShellResult | null>(null);
  // The day's run as saved: null before any, a run in progress to resume, or a finished one.
  const [save, setSave] = useState<DailySave | null>(null);
  // The shell's stats line re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // "End run" pressed once and waiting for the second press.
  const [armed, setArmed] = useState(false);
  // The polite announcement.
  const [say, setSay] = useState("");
  // Milliseconds of play shown in the head-up display (refreshed a few times a second).
  const [shownMs, setShownMs] = useState(0);
  // The run as the loop and the handlers see it between renders.
  const runRef = useRef<Run>(run);
  // The block in the air, likewise.
  const fallRef = useRef<Falling | null>(null);
  // The phase, likewise (so a lock or a finish happens exactly once).
  const phaseRef = useRef<Phase>("idle");
  // Milliseconds of play so far.
  const playMs = useRef(0);
  // Milliseconds since the block last fell a row.
  const fallAcc = useRef(0);
  // performance.now() at which the count ends.
  const countEnd = useRef(0);
  // The day whose run is being played, or null (practice, or none).
  const dailyLive = useRef<string | null>(null);
  // The resolved-row counter for LastRow.
  const rowSerial = useRef(0);

  // The deal on screen: the day's for the daily run, the seed's for practice.
  const deal = useMemo<Block[]>(() => (mode === "daily" && today ? dailyDeal(today) : practiceDeal(seed)), [mode, today, seed]);
  // The deal as the loop sees it.
  const dealRef = useRef<Block[]>(deal);
  // Kept current.
  dealRef.current = deal;

  // Keep the shown state and the refs together.
  const show = useCallback((r: Run, f: Falling | null) => {
    // The refs, for the loop.
    runRef.current = r;
    fallRef.current = f;
    // The state, for the screen.
    setRun(r);
    setFall(f);
  }, []);

  // Move to a phase, in the ref and on screen.
  const goPhase = useCallback((p: Phase) => {
    // The ref first, so the loop sees it at once.
    phaseRef.current = p;
    // The screen.
    setPhase(p);
  }, []);

  /**
   * A block's name and field, read aloud.
   *
   * @param kind the block
   * @param v its option
   * @returns the words
   */
  const fieldWords = useCallback(
    (kind: Kind, v: number): string => {
      // A payload names nothing.
      if (isApp(kind)) return t("sayNoField");
      // Its field, value and what the value names.
      return t("sayField", { field: t(`field.${FIELD_OF[kind]}`), value: fmtValue(kind, valueOf(kind, v) ?? 0), names: t(`names.${namesOf(kind, v)}`) });
    },
    [t],
  );

  /**
   * What a dropped row's problem says.
   *
   * @param p the problem
   * @returns the sentence
   */
  const problemText = useCallback(
    (p: Problem): string =>
      // A block in another layer's column, or a field that names something else.
      p.code === "slot"
        ? t("problemSlot", { what: t(`kind.${p.kind}`), slot: t(`layer.${p.col}`) })
        : t("problemChain", { header: t(`kind.${p.kind}`), field: t(`field.${FIELD_OF[p.kind]}`), value: fmtValue(p.kind, p.value), names: t(`names.${p.names}`), next: t(`kind.${p.next}`) }),
    [t],
  );

  /**
   * The share card and the shell's result for a finished run.
   *
   * @param r the final run
   * @param daily whether it was the daily run
   * @param ms its time of play
   * @returns the result
   */
  const makeResult = useCallback(
    (r: Run, daily: boolean, ms: number): ShellResult => {
      // The numbers in the page's language.
      const score = r.score.toLocaleString(locale);
      // The daily run: frames out of sixteen, and a grid of how each one went.
      if (daily && today) {
        // Each frame's square, the ones never sent last.
        const squares = Array.from({ length: DAILY_FRAMES }, (_, i) => (r.outcomes[i] === "d" ? SQUARES.d : r.outcomes[i] === "x" ? SQUARES.x : SQUARES.none));
        // Two rows of eight, the order the frames went out in.
        const lines = [squares.slice(0, DAILY_FRAMES / 2).join(""), squares.slice(DAILY_FRAMES / 2).join("")];
        // The card.
        const share = shareText({ title: t("shareTitleDaily", { n: puzzleNumber(today) }), lines, summary: t("shareSummary", { delivered: r.delivered, total: DAILY_FRAMES, score, streak: r.bestStreak }), locale, slug: GAME_ID });
        // The detail line, and a note when the well filled up.
        const detail = t("resultDetail", { score, streak: r.bestStreak, dropped: r.dropped, time: formatDuration(ms) });
        // The panel.
        return {
          won: r.delivered >= PASS_MARK,
          headline: t("resultHeadline", { delivered: r.delivered, total: DAILY_FRAMES }),
          detail: r.toppedOut ? `${detail} ${t("resultToppedOut", { placed: r.next, blocks: DAILY_BLOCKS })}` : detail,
          share,
        };
      }
      // Practice: the score, the frames and the level reached.
      const share = shareText({ title: t("shareTitlePractice"), lines: [t("sharePractice", { delivered: r.delivered, level: level(r) })], summary: t("practiceHeadline", { score }), locale, slug: GAME_ID });
      // The panel.
      return { won: r.delivered >= PASS_MARK, headline: t("practiceHeadline", { score }), detail: t("practiceDetail", { delivered: r.delivered, level: level(r), streak: r.bestStreak }), share };
    },
    [t, today, locale],
  );

  // The day's run, read back once the day is known: a finished run shows its well and result; one in progress waits
  // for Resume.
  useEffect(() => {
    // Not before mount.
    if (!today) return;
    // The kept state of the day.
    const kept = loadRecord(GAME_ID).daily[today];
    // Nothing this page wrote: a fresh day.
    if (!isSave(kept)) {
      // No save.
      setSave(null);
      // Done here.
      return;
    }
    // Kept.
    setSave(kept);
    // A finished run: its well and its result, again (no flash: nothing is recorded).
    if (kept.done) {
      // Replayed.
      const r = replay(dailyDeal(today), kept.m);
      // Unreadable: treated as nothing played (the board would refuse it as well).
      if (!r) return;
      // Shown.
      show(r, null);
      // Over.
      goPhase("done");
      // Its panel.
      setResult(makeResult(r, true, kept.ms));
    }
  }, [today, makeResult, show, goPhase]);

  /**
   * The next block appears at the top of its column, or the run ends.
   *
   * @param r the run after the last placement
   * @returns the block in the air, or null
   */
  const spawnFor = useCallback((r: Run): Falling | null => {
    // The block now due.
    const b = currentBlock(r, dealRef.current);
    // None: the run is over.
    if (!b) return null;
    // At the top row of its spawn column, with the value it arrived with.
    return { col: b.spawn, row: ROWS - 1, v: b.init };
  }, []);

  /**
   * The run is over: recorded, saved and shown.
   *
   * @param r the final run
   */
  const finish = useCallback(
    (r: Run) => {
      // Already over: nothing happens twice.
      if (phaseRef.current === "done") return;
      // Over.
      goPhase("done");
      // Nothing in the air.
      show(r, null);
      // The time of play, shown as it ended.
      const ms = Math.round(playMs.current);
      setShownMs(ms);
      // The daily run's day, if this was it.
      const day = dailyLive.current;
      // No longer in progress.
      dailyLive.current = null;
      // The daily run: its final state saved first (the board reads it after the record), then recorded once.
      if (day) {
        // Saved as finished.
        const fin: DailySave = { m: r.moves, done: true, ms };
        saveDailyState(GAME_ID, day, fin);
        setSave(fin);
        // Recorded: counters, streak, best score, and the board.
        recordResult(GAME_ID, { dayKey: day, won: r.delivered >= PASS_MARK, score: r.score, higherIsBetter: true, daily: true });
      } else if (today) {
        // A practice run: counters and best score.
        recordResult(GAME_ID, { dayKey: today, won: r.delivered >= PASS_MARK, score: r.score, higherIsBetter: true });
      }
      // The stats line re-reads, and the shell flashes.
      setVersion((v) => v + 1);
      // The panel.
      setResult(makeResult(r, day !== null, ms));
      // Announced.
      setSay(t("sayOver", { delivered: r.delivered, score: r.score }));
    },
    [goPhase, show, today, makeResult, t, locale],
  );

  /**
   * Lock the block in the air where it is: the engine places it, the line under the well tells what the row did, the
   * day's run is saved, and the next block appears (or the run ends).
   */
  const lock = useCallback(() => {
    // The block and the run.
    const f = fallRef.current;
    const r0 = runRef.current;
    // Nothing in the air, or not playing.
    if (!f || phaseRef.current !== "playing") return;
    // Placed by the engine.
    const out = place(r0, dealRef.current, f.col, f.v);
    // Refused (cannot happen with the moves this page allows): the block stays.
    if (!out) return;
    // A resolved row: shown and announced.
    if (out.event.kind !== "rest") {
      // The serial.
      rowSerial.current += 1;
      // Shown.
      setLast({ event: out.event, n: rowSerial.current });
    }
    // The fall starts afresh for the next block.
    fallAcc.current = 0;
    // The daily run saved after every placement, so a reload resumes it.
    if (dailyLive.current) {
      // The save.
      const s: DailySave = { m: out.run.moves, done: out.run.over, ms: Math.round(playMs.current) };
      // Written (finish writes the final one again, then records).
      saveDailyState(GAME_ID, dailyLive.current, s);
    }
    // Over: the run ends.
    if (out.run.over) {
      // Finished.
      finish(out.run);
      // Done here.
      return;
    }
    // The next block.
    const nf = spawnFor(out.run);
    // Shown.
    show(out.run, nf);
    // The new block, with its column.
    const nb = currentBlock(out.run, dealRef.current);
    // What the row did, first, when one was full.
    const rowWords = out.event.kind === "delivered" ? `${t("eventDelivered", { points: out.event.points })}${out.event.drained ? ` ${t("eventDrained")}` : ""} ` : out.event.kind === "dropped" ? `${problemText(out.event.problem)} ` : "";
    // Announced.
    if (nb && nf) setSay(`${rowWords}${t("sayBlock", { what: t(`kind.${nb.kind}`), col: nf.col + 1 })} ${fieldWords(nb.kind, nf.v)}`);
  }, [finish, spawnFor, show, t, fieldWords, problemText]);

  /** The block falls one row, or locks where it rests. */
  const stepDown = useCallback(() => {
    // The block and the run.
    const f = fallRef.current;
    const r = runRef.current;
    // Nothing in the air.
    if (!f) return;
    // Room below: one row down.
    if (freeAt(r, f.col, f.row - 1)) show(r, { ...f, row: f.row - 1 });
    // Resting on the stack: locked.
    else lock();
  }, [show, lock]);

  /**
   * Move the block in the air sideways by one column, if the cell beside it is free.
   *
   * @param dir -1 left, 1 right
   * @returns whether it moved
   */
  const move = useCallback(
    (dir: -1 | 1): boolean => {
      // The block and the run.
      const f = fallRef.current;
      const r = runRef.current;
      // Only while playing.
      if (!f || phaseRef.current !== "playing") return false;
      // The column beside it.
      const c = f.col + dir;
      // Blocked by the wall or by the stack at this height.
      if (!freeAt(r, c, f.row)) return false;
      // Moved.
      show(r, { ...f, col: c });
      // It did.
      return true;
    },
    [show],
  );

  /**
   * Steer the block toward a column, stopping at the first one blocked at its height; aimed at its own column, drop it.
   *
   * @param col the target column
   */
  const toColumn = useCallback(
    (col: number) => {
      // The block.
      const f = fallRef.current;
      // Only while playing.
      if (!f || phaseRef.current !== "playing") return;
      // Its own column: dropped.
      if (col === f.col) {
        // Locked where it would land.
        lock();
        // Done.
        return;
      }
      // The direction.
      const dir = col > f.col ? 1 : -1;
      // Step by step until there or blocked.
      while (fallRef.current && fallRef.current.col !== col && move(dir as -1 | 1)) {
        // Each step moves the ref; the loop condition reads it again.
      }
      // Where it ended up.
      const now = fallRef.current;
      // Announced: the column, or that the way is blocked.
      if (now) setSay(now.col === col ? t("sayMove", { col: col + 1 }) : t("sayBlocked"));
    },
    [lock, move, t],
  );

  /**
   * Change the field of the block in the air: the next value (or the previous one).
   *
   * @param dir 1 forwards, -1 backwards
   */
  const turn = useCallback(
    (dir: -1 | 1) => {
      // The block, the run and the deal.
      const f = fallRef.current;
      const r = runRef.current;
      const b = currentBlock(r, dealRef.current);
      // Only while playing.
      if (!f || !b || phaseRef.current !== "playing") return;
      // Its options.
      const n = OPTIONS[b.kind].length;
      // A payload: nothing to change.
      if (n === 0) {
        // Said so.
        setSay(t("sayNoField"));
        // Done.
        return;
      }
      // The next value round the list.
      const v = (f.v + dir + n) % n;
      // Shown.
      show(r, { ...f, v });
      // Announced.
      setSay(fieldWords(b.kind, v));
    },
    [show, t, fieldWords],
  );

  /**
   * Start a run (or resume the day's) after the 3-2-1 count.
   *
   * @param m daily or practice
   */
  const start = (m: "daily" | "practice") => {
    // Needs the day.
    if (!today) return;
    // The mode.
    setMode(m);
    // The deal: the day's, or a new practice seed's.
    let d: Block[];
    // Practice: a fresh seed (the engine stays pure; the page picks it).
    if (m === "practice") {
      // The seed.
      const s = freshSeed();
      // Kept.
      setSeed(s);
      // Its deal.
      d = practiceDeal(s);
    } else {
      // The day's.
      d = dailyDeal(today);
    }
    // Seen by the loop at once (the memo catches up on the next render).
    dealRef.current = d;
    // The daily run resumes from its save; practice and a new day start empty.
    const resume = m === "daily" && save && !save.done ? replay(d, save.m) : null;
    // The run.
    const r = resume ?? newRun();
    // The time of play already counted.
    playMs.current = resume && save ? save.ms : 0;
    setShownMs(playMs.current);
    // The day being played, so every placement is saved.
    dailyLive.current = m === "daily" ? today : null;
    // A new daily run counts from now: saved as started, so a reload resumes it rather than starting it again.
    if (m === "daily" && !resume) {
      // The first save.
      const s0: DailySave = { m: "", done: false, ms: 0 };
      saveDailyState(GAME_ID, today, s0);
      setSave(s0);
    }
    // The first block (or the next one, on a resume).
    show(r, null);
    // Kept for when the count ends.
    fallRef.current = null;
    // No line from an earlier run.
    setLast(null);
    setResult(null);
    setArmed(false);
    // The count.
    countEnd.current = performance.now() + COUNTDOWN_MS;
    setCount(Math.ceil(COUNTDOWN_MS / 1000));
    // Counting.
    goPhase("countdown");
    // Announced.
    setSay(t("sayCountdown"));
  };

  // Pause: the well is covered and the clock stops; Resume counts 3-2-1 again.
  const pause = useCallback(() => {
    // Only a run in play or counting.
    if (phaseRef.current !== "playing" && phaseRef.current !== "countdown") return;
    // Paused.
    goPhase("paused");
    // Announced.
    setSay(t("sayPaused"));
  }, [goPhase, t]);

  // Resume after a pause: the count, then play.
  const resume = useCallback(() => {
    // Only from a pause.
    if (phaseRef.current !== "paused") return;
    // The count's end.
    countEnd.current = performance.now() + COUNTDOWN_MS;
    setCount(Math.ceil(COUNTDOWN_MS / 1000));
    // Counting.
    goPhase("countdown");
    // Announced.
    setSay(t("sayCountdown"));
  }, [goPhase, t]);

  // The frame loop while counting or playing: the count, the clock and the fall.
  useFrameLoop(phase === "countdown" || phase === "playing", (dt) => {
    // Counting.
    if (phaseRef.current === "countdown") {
      // What is left.
      const left = countEnd.current - performance.now();
      // Still counting: whole seconds shown.
      if (left > 0) {
        // 3, 2, 1.
        setCount(Math.max(1, Math.ceil(left / 1000)));
        // Done for this frame.
        return;
      }
      // The block in the air: the one already there after a pause, or the next one due.
      const f = fallRef.current ?? spawnFor(runRef.current);
      // A run with nothing left to place (a save of a run that was already over).
      if (!f) {
        // Finished.
        finish(runRef.current);
        // Done.
        return;
      }
      // Shown with the well: the board and the clock start together.
      show(runRef.current, f);
      // The fall starts afresh.
      fallAcc.current = 0;
      // Playing.
      goPhase("playing");
      // The block now due.
      const b = currentBlock(runRef.current, dealRef.current);
      // Announced.
      if (b) setSay(`${t("sayStart")} ${t("sayBlock", { what: t(`kind.${b.kind}`), col: f.col + 1 })} ${fieldWords(b.kind, f.v)}`);
      // Done for this frame.
      return;
    }
    // Playing: the clock.
    playMs.current += dt;
    // The display, about four times a second.
    if (Math.floor(playMs.current / 250) !== Math.floor((playMs.current - dt) / 250)) setShownMs(playMs.current);
    // The fall.
    fallAcc.current += dt;
    // One row per interval of this level.
    if (fallAcc.current >= fallMs(level(runRef.current))) {
      // The interval spent.
      fallAcc.current = 0;
      // One row down, or locked.
      stepDown();
    }
  });

  // A hidden tab pauses the run.
  useEffect(() => {
    // Only while a run is under way.
    if (phase !== "countdown" && phase !== "playing") return;
    // The page hidden or shown.
    const onVis = () => {
      // Hidden: paused.
      if (document.visibilityState === "hidden") pause();
    };
    // Listening.
    document.addEventListener("visibilitychange", onVis);
    // Stopped when the run ends or the page goes.
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase, pause]);

  // While a run is under way, the keys are the game's, not the site's.
  useEffect(() => {
    // Only during the count, the run and a pause.
    if (phase !== "countdown" && phase !== "playing" && phase !== "paused") return;
    // The site's shortcuts off.
    setSiteShortcutsSuppressed(true);
    // Back on when the run ends or the page goes.
    return () => setSiteShortcutsSuppressed(false);
  }, [phase]);

  // The keys, while a run is under way.
  useEffect(() => {
    // Only during the count, the run and a pause.
    if (phase !== "countdown" && phase !== "playing" && phase !== "paused") return;
    // The handler.
    const onKey = (e: KeyboardEvent) => {
      // Something else's key.
      if (keyIsElsewhere(e)) return;
      // P or Escape pause and resume.
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        // No browser action.
        e.preventDefault();
        // Toggled.
        if (phaseRef.current === "paused") resume();
        else pause();
        // Done.
        return;
      }
      // The rest only while blocks fall.
      if (phaseRef.current !== "playing") return;
      // Space on a button or a link reached with Tab presses it, as everywhere else.
      if (e.key === " " && e.target instanceof HTMLElement && e.target.closest("button, a")) return;
      // Held-down repeats move and turn, as on an arcade machine; Space does not repeat.
      if (e.key === " " && e.repeat) return;
      // Sideways.
      if (e.key in MOVE_KEYS) {
        // No scrolling.
        e.preventDefault();
        // Moved, or announced as blocked.
        if (!move(MOVE_KEYS[e.key])) setSay(t("sayBlocked"));
        // Done.
        return;
      }
      // The field.
      if (e.key in FIELD_KEYS) {
        // No scrolling.
        e.preventDefault();
        // Turned.
        turn(FIELD_KEYS[e.key]);
        // Done.
        return;
      }
      // One row down.
      if (e.key === "ArrowDown") {
        // No scrolling.
        e.preventDefault();
        // The fall's clock starts afresh after a soft step.
        fallAcc.current = 0;
        // Down.
        stepDown();
        // Done.
        return;
      }
      // Dropped.
      if (e.key === " ") {
        // No scrolling and no button press.
        e.preventDefault();
        // Locked where it would land.
        lock();
        // Done.
        return;
      }
      // A column by number.
      if (e.key in COLUMN_KEYS) {
        // No typing.
        e.preventDefault();
        // Steered there (not dropped: a digit only aims).
        const f = fallRef.current;
        // Its own column already: nothing to do.
        if (f && f.col !== COLUMN_KEYS[e.key]) toColumn(COLUMN_KEYS[e.key]);
      }
    };
    // Listening.
    window.addEventListener("keydown", onKey);
    // Stopped when the run ends.
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, move, turn, stepDown, lock, toColumn, pause, resume, t]);

  // The armed "End run" falls back after a few seconds.
  useEffect(() => {
    // Nothing armed.
    if (!armed) return;
    // Disarmed later.
    const id = window.setTimeout(() => setArmed(false), CONFIRM_MS);
    // Cleared on a press or when the page goes.
    return () => window.clearTimeout(id);
  }, [armed]);

  // "End run" in practice: the second press ends it where it stands.
  const onEndRun = () => {
    // The first press arms it.
    if (!armed) {
      // Armed.
      setArmed(true);
      // Done.
      return;
    }
    // Ended.
    setArmed(false);
    // Finished as it stands (practice only: the daily run has no such button).
    finish(runRef.current);
  };

  // A tap or a click on the well: the column under the pointer.
  const onWellDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Only the main button or a touch, and only while blocks fall.
    if (e.button !== 0 || phaseRef.current !== "playing") return;
    // The well's box.
    const box = e.currentTarget.getBoundingClientRect();
    // The column under the pointer.
    const col = Math.min(COLS - 1, Math.max(0, Math.floor(((e.clientX - box.left) / box.width) * COLS)));
    // No text selection or focus jump.
    e.preventDefault();
    // Steered, or dropped when it is the block's own column.
    toColumn(col);
  };

  // Read the well aloud: the queue, the block in the air, then each row from the top.
  const describe = () => {
    // The parts.
    const parts: string[] = [];
    // The block in the air.
    const b = currentBlock(runRef.current, dealRef.current);
    const f = fallRef.current;
    // Only while it is on screen.
    if (b && f && phaseRef.current === "playing") parts.push(t("describeFalling", { what: t(`kind.${b.kind}`), col: f.col + 1, row: f.row + 1 }), fieldWords(b.kind, f.v));
    // The queue.
    const q = upcoming(runRef.current, dealRef.current).map((x) => t(`kind.${x.kind}`));
    // Read when there is one.
    if (q.length && phaseRef.current === "playing") parts.push(t("describeQueue", { list: q.join(", ") }));
    // Each row with something in it, from the top.
    const r = runRef.current;
    // Rows in the well.
    for (let row = ROWS - 1; row >= 0; row--) {
      // A dropped frame.
      const jam = row < r.jam.length ? r.jam[row] : null;
      // Its cells, or the live ones.
      const cells = Array.from({ length: COLS }, (_, c) => (jam ? jam[c] : (r.cols[c][row - r.jam.length] ?? null)));
      // An empty row is skipped.
      if (cells.every((x) => x === null)) continue;
      // Read.
      parts.push(t("describeRow", { n: row + 1, cells: cells.map((x) => (x ? `${t(`kind.${x.kind}`)}${isApp(x.kind) ? "" : ` ${fmtValue(x.kind, valueOf(x.kind, x.v) ?? 0)}`}` : t("describeEmptyCell"))).join(", "), dropped: jam ? "yes" : "no" }));
    }
    // Nothing at all.
    if (parts.length === 0) parts.push(t("describeEmpty"));
    // Announced.
    setSay(parts.join(" "));
  };

  // ---- Drawing ----------------------------------------------------------------------------------------------------

  // The block falling now.
  const block = currentBlock(run, deal);
  // Whether the well and the queue are on screen: only while blocks fall and after the run (never during a count or a
  // pause, so neither can be studied with the clock stopped).
  const visible = phase === "playing" || phase === "done";
  // Whether a run is under way.
  const busy = phase === "countdown" || phase === "playing" || phase === "paused";
  // Where the block in the air would land: its column's first free row.
  const landing = fall ? run.jam.length + run.cols[fall.col].length : -1;
  // The queue.
  const queue = phase === "playing" ? upcoming(run, deal) : [];
  // The daily run is finished for the day.
  const dailyDone = !!save?.done;
  // A daily run waits to be resumed.
  const canResume = !!save && !save.done;

  /**
   * One cell's text: the block's name, then its field's value with what the value names (a payload: what it is).
   *
   * @param kind the block
   * @param v its option
   * @returns the cell's inner elements
   */
  const cellText = (kind: Kind, v: number) => (
    <>
      <span className="fg-ps-name">{t(`kind.${kind}`)}</span>
      {isApp(kind) ? (
        <span className="fg-ps-val">{t(`appLine.${kind}`)}</span>
      ) : (
        <span className="fg-ps-val">
          {fmtValue(kind, valueOf(kind, v) ?? 0)} <span className="fg-ps-names">{t(`names.${namesOf(kind, v)}`)}</span>
        </span>
      )}
    </>
  );

  // The well's cells, top row first.
  const cells: ReactNode[] = [];
  // Each row from the top.
  for (let row = ROWS - 1; row >= 0; row--) {
    // A dropped frame's row.
    const jam = row < run.jam.length ? run.jam[row] : null;
    // Each column.
    for (let c = 0; c < COLS; c++) {
      // What rests here.
      const rest: Cell | null = !visible ? null : jam ? jam[c] : (run.cols[c][row - run.jam.length] ?? null);
      // The block in the air is here.
      const here = visible && fall && block && fall.col === c && fall.row === row;
      // Its landing spot, when it is not already there.
      const ghost = visible && fall && block && fall.col === c && landing === row && fall.row !== row;
      // The cell.
      cells.push(
        <div
          key={`${row}-${c}`}
          className={`fg-ps-cell ${COLUMN_CLASS[c]}${rest ? ` fg-ps-block ${layerClass(rest.kind)}` : ""}${jam ? " fg-ps-jam" : ""}${here && block ? ` fg-ps-block fg-ps-falling ${layerClass(block.kind)}` : ""}${ghost ? " fg-ps-ghost" : ""}`}
        >
          {rest ? cellText(rest.kind, rest.v) : here && block && fall ? cellText(block.kind, fall.v) : null}
        </div>,
      );
    }
  }

  // The rules.
  const rules = (
    <>
      <p>{t("rule1")}</p>
      <ul>
        <li>{t("rule2")}</li>
        <li>{t("rule3")}</li>
        <li>{t("rule4")}</li>
        <li>{t("rule5")}</li>
        <li>{t("rule6")}</li>
      </ul>
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
      gradeSaved={gradeSaved}
    >
      <div className={`fg-ps-wrap${reduce ? " fg-ps-still" : ""}`}>
        {/* The polite line, read by screen readers. */}
        <p className="fg-ps-sr" aria-live="polite">
          {say}
        </p>
        {/* Before mount: a neutral line, the same as the static HTML. */}
        {!today ? (
          <p className="fg-muted">{tc("loading")}</p>
        ) : (
          <>
            {/* The head-up display: four fixed columns, a label over each value, so nothing moves as numbers grow. */}
            <div className="fg-ps-hud">
              <span className="fg-ps-stat">
                <span className="fg-ps-stat-label">{tc("score")}</span>
                <span className="fg-readout">{run.score.toLocaleString(locale)}</span>
              </span>
              <span className="fg-ps-stat">
                <span className="fg-ps-stat-label">{t("frames")}</span>
                <span className="fg-readout">{mode === "daily" ? t("framesValue", { delivered: run.delivered, total: DAILY_FRAMES }) : run.delivered}</span>
              </span>
              <span className="fg-ps-stat">
                <span className="fg-ps-stat-label">{t("levelLabel")}</span>
                <span className="fg-readout">{level(run)}</span>
              </span>
              <span className="fg-ps-stat">
                <span className="fg-ps-stat-label">{tc("time")}</span>
                <span className="fg-readout">{formatDuration(phase === "done" && save?.done && mode === "daily" ? save.ms : shownMs)}</span>
              </span>
            </div>

            {/* The queue: the next blocks, by name and layer colour (their fields are set once they fall). */}
            <div className="fg-ps-queue" aria-hidden={!visible}>
              <span className="fg-ps-queue-label">{t("next")}</span>
              {Array.from({ length: 4 }, (_, i) => {
                // The block in this place of the queue, if any.
                const q = queue[i];
                // Its tile.
                return (
                  <span key={i} className={`fg-ps-qcell${q ? ` ${layerClass(q.kind)}` : ""}`}>
                    {q ? t(`kind.${q.kind}`) : ""}
                  </span>
                );
              })}
            </div>

            {/* The block in the air, spelt out: its header, its field by name, the value and what the value names. */}
            <p className="fg-ps-now" aria-hidden="true">
              {phase === "playing" && block && fall ? (
                isApp(block.kind) ? (
                  t("nowPayload", { what: t(`kind.${block.kind}`), line: t(`appLine.${block.kind}`) })
                ) : (
                  t("nowHeader", { what: t(`kind.${block.kind}`), field: t(`field.${FIELD_OF[block.kind]}`), value: fmtValue(block.kind, valueOf(block.kind, fall.v) ?? 0), names: t(`names.${namesOf(block.kind, fall.v)}`) })
                )
              ) : (
                " "
              )}
            </p>

            {/* The well, or the Start cover in its place before the run. */}
            <div className="fg-ps-stage">
              {phase === "idle" ? (
                // Before any run: the day's run (or its resume), or practice once the day's is in.
                <StartCover
                  label={dailyDone ? t("startPractice") : canResume ? t(earlierDay ? "resumeDailyEarlier" : "resumeDaily") : t(earlierDay ? "startDailyEarlier" : "startDaily")}
                  note={t("startNote")}
                  onStart={() => start(dailyDone ? "practice" : "daily")}
                  className="fg-ps-start"
                />
              ) : (
                <div className="fg-ps-well-box">
                  <div
                    className={`fg-ps-well${phase === "done" ? " fg-ps-over" : ""}`}
                    role="group"
                    aria-label={t("boardLabel")}
                    aria-describedby="fg-ps-help"
                    onPointerDown={onWellDown}
                  >
                    {cells}
                    {/* The count or the pause, over the whole well (it is hidden until play goes on). */}
                    {(phase === "countdown" || phase === "paused") && (
                      <div className="fg-ps-overlay">
                        {phase === "paused" ? (
                          <>
                            <span className="fg-ps-paused">{t("paused")}</span>
                            <button type="button" className="fg-button fg-button-primary" onClick={resume}>
                              {t("resume")}
                            </button>
                          </>
                        ) : (
                          <span className="fg-ps-count" aria-hidden="true">
                            {count}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* The layers under their columns. */}
                  <div className="fg-ps-layers" aria-hidden="true">
                    {Array.from({ length: COLS }, (_, c) => (
                      <span key={c} className={`fg-ps-layer ${LAYER_CLASS[c]}`}>
                        {t(`layer.${c}`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* The controls, while a run is under way. */}
            {busy && (
              <div className="fg-ps-pad" role="group" aria-label={t("padLabel")}>
                <button type="button" className="fg-button fg-ps-key" onPointerDown={keepFocus} aria-label={t("moveLeft")} onClick={() => !move(-1) && setSay(t("sayBlocked"))} disabled={phase !== "playing"}>
                  <svg viewBox="0 0 24 24" className="fg-ps-icon" aria-hidden="true" focusable="false">
                    <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" className="fg-button fg-ps-key" onPointerDown={keepFocus} aria-label={t("moveRight")} onClick={() => !move(1) && setSay(t("sayBlocked"))} disabled={phase !== "playing"}>
                  <svg viewBox="0 0 24 24" className="fg-ps-icon" aria-hidden="true" focusable="false">
                    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" className="fg-button fg-ps-key fg-ps-key-wide" onPointerDown={keepFocus} onClick={() => turn(1)} disabled={phase !== "playing"}>
                  {t("rotate")}
                </button>
                <button type="button" className="fg-button fg-button-primary fg-ps-key fg-ps-key-wide" onPointerDown={keepFocus} onClick={lock} disabled={phase !== "playing"}>
                  {t("drop")}
                </button>
                <button type="button" className="fg-button fg-ps-key" onPointerDown={keepFocus} onClick={phase === "paused" ? resume : pause}>
                  {phase === "paused" ? t("resume") : t("pause")}
                </button>
              </div>
            )}

            {/* What the last full row did: its four blocks and the reason, in words. */}
            <div className="fg-ps-event" aria-hidden="true">
              {last && (
                <>
                  <span key={`m${last.n}`} className={`fg-ps-mini ${last.event.kind === "delivered" ? "fg-ps-mini-ok" : "fg-ps-mini-bad"}`}>
                    {last.event.row.map((x, i) => (
                      <span key={i} className={`fg-ps-mini-cell ${layerClass(x.kind)}`}>
                        {t(`kind.${x.kind}`)}
                      </span>
                    ))}
                  </span>
                  <span key={`t${last.n}`} className={`fg-ps-event-text ${last.event.kind === "delivered" ? "fg-ps-ok" : "fg-ps-bad"}`}>
                    {last.event.kind === "delivered" ? `${t("eventDelivered", { points: last.event.points })}${last.event.drained ? ` ${t("eventDrained")}` : ""}` : problemText(last.event.problem)}
                  </span>
                </>
              )}
            </div>

            {/* Between runs: start buttons, and the helpers. */}
            <div className="fg-buttons">
              {phase === "done" && !dailyDone && (
                <button type="button" className="fg-button fg-button-primary" onClick={() => start("daily")}>
                  {canResume ? t(earlierDay ? "resumeDailyEarlier" : "resumeDaily") : t(earlierDay ? "startDailyEarlier" : "startDaily")}
                </button>
              )}
              {!busy && !(phase === "done" && mode === "practice") && !(phase === "idle" && dailyDone) && (
                <button type="button" className="fg-button" onClick={() => start("practice")}>
                  {t("startPractice")}
                </button>
              )}
              {(phase === "playing" || phase === "done") && (
                <button type="button" className="fg-button" onClick={describe}>
                  {t("describe")}
                </button>
              )}
              {busy && mode === "practice" && (
                <button type="button" className="fg-button" onClick={onEndRun}>
                  {armed ? t("endRunConfirm") : t("endRun")}
                </button>
              )}
            </div>
            {/* The daily run is done for the day. */}
            {dailyDone && !busy && <p className="fg-muted fg-small">{t(earlierDay ? "dailyDoneEarlier" : "dailyDone")}</p>}
            {/* The keys. */}
            <p id="fg-ps-help" className="fg-muted fg-small fg-ps-help">
              {t("keysHint")}
            </p>
            {/* The real thing: the frame and the layers, in Learn. */}
            <p className="fg-muted fg-small fg-ps-learn">
              {t("learnLead")} <Link href="/learn/the-ethernet-frame-field-by-field">{t("learnFrame")}</Link> · <Link href="/learn/osi-model-in-practice">{t("learnLayers")}</Link>
            </p>
          </>
        )}
      </div>
    </GameShell>
  );
}
