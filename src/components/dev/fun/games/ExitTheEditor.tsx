// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/ExitTheEditor.tsx
// ----------------------------------------------------------------------------
// EXIT THE EDITOR, the terminal (PRIME 03/11/2026). Thirteen levels, each a
// program to leave cleanly, and a daily escape. The keyboard types into the
// fake terminal once it has focus (click or tap it); on a phone, a row of keys
// gives Esc, a sticky Ctrl, Tab, the arrows, ~, : and Enter, and the phone's
// own keyboard types the rest through a hidden input. Tab is left to the
// browser, so the page never traps the keyboard. A dead key (the "~" of a US
// International or Brazilian ABNT2 keyboard, which waits for the next key) is
// left to the browser to compose, and its text arrives through that input, so
// Enter ~ . reaches ssh on those keyboards too; AltGr types its character
// rather than a Ctrl chord (PRIME 05/11/2026).
//
// The programs are the engine's (src/lib/fun/games/exit-the-editor); this
// component counts keystrokes and time, reveals hints after a few wrong tries
// (the engine decides what a wrong try is; hints that appear on their own are
// free, only those asked for with the button cost points), keeps progress in
// this browser's record for the game (extra.progress), and draws the screen.
// On a phone the levels sit in one scrolling strip and the keys in two rows of
// five, so the terminal comes up sooner; "Read the screen" puts the terminal's
// text in the polite line, since the drawn screen is hidden from screen readers
// (review R3-16, 03/11/2026).
//
// Par and medals (PRIME 03/11/2026, "Yes on all your suggested ideas"): each
// level's card and header show its par, the keystrokes of its shortest
// documented way out; a clear in par keystrokes wins the Par medal (⛳), in
// fewer the Under par one (🐦). The fewest keystrokes of any clear are kept
// with the level's progress (extra.progress.<id>.fewest), so a later, slower
// clear never takes a medal away; the strip and the share card show them.
//
// The daily escape (same date): one trap a day from the engine's dailyEscape,
// the frame in its "daily" kind (puzzle number, streak), the levels in "score".
// The attempt starts at the first key (or hint) and counts once: its keys are
// saved as they are typed, with its start on the wall clock, so a reload
// replays them and resumes it, the clock still running, rather than starting
// afresh. Leaving the wrong way restarts the trap within the same attempt, the
// keystrokes and the clock carrying on; the escape records the streak, and its
// share card gives the puzzle number, keystrokes against par, and time.
// ============================================================================

"use client";

// React's state, effects, refs and memoisation.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// The frame around every game.
import GameShell, { type ShellResult } from "./GameShell";
// Today's UTC day and a stopwatch.
import { useEarlierDay, useStopwatch, useToday } from "@/lib/fun/hooks";
// The earlier puzzle in play (?day=), if any.
import { earlierDayInPlay } from "@/lib/fun/archive";
// The puzzle number of a day, and the UTC day of an instant (for the opening mode).
import { puzzleNumber, utcDayKey } from "@/lib/fun/daily";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// What this browser remembers.
import { loadRecord, recordResult, saveDailyState, updateRecord } from "@/lib/fun/storage";
// The site's own shortcuts (Ctrl+K opens the search) stand down while the terminal has the keyboard.
import { setSiteShortcutsSuppressed } from "@/lib/pageCapabilities";
// The rules.
import {
  GAME_ID,
  LEVELS,
  RETRY,
  SCORE_FLOOR,
  SCORE_FREE_SECONDS,
  SCORE_MAX,
  SCORE_PER_HINT,
  SCORE_PER_KEY,
  SCORE_PER_SECOND,
  countTry,
  dailyEscape,
  finalView,
  levelScore,
  medalFor,
  press,
  replayDaily,
  startDaily,
  startLevel,
  startTries,
  type DailyEscape,
  type Key,
  type LevelState,
  type Medal,
  type TryCount,
} from "@/lib/fun/games/exit-the-editor/engine";

/** One cleared level, as remembered. */
interface Cleared {
  /** Best score. */
  score: number;
  /** Keystrokes of that best. */
  keys: number;
  /** Milliseconds of that best. */
  ms: number;
  /** The fewest keystrokes of any clear, for the medal (absent in saves from before the medals: keys stands in). */
  fewest?: number;
}

/** Today's daily escape, as saved from its first key on. */
interface DailySave {
  /** Every keystroke of the attempt, in order (the clock's ticks left out), with RETRY where the trap restarted. */
  keys: Key[];
  /** Date.now() when the attempt started: its clock is the wall clock from there, so a reload does not stop it. */
  startedAt: number;
  /** Hints asked for with the button. */
  asked: number;
  /** Escaped: the attempt is over and counted. */
  done: boolean;
  /** The attempt's time in milliseconds, once escaped. */
  ms?: number;
}

/**
 * The mark of a kept daily state, for days played before the marks existed (GameShell's gradeSaved): an escape is always a solve.
 *
 * @param _day the attempt's day (the saved attempt says it all)
 * @param state the kept state
 * @returns 1 escaped, null not yet
 */
function gradeSaved(_day: string, state: unknown): 0 | 1 | null {
  // Escaped.
  return state !== null && typeof state === "object" && (state as Partial<DailySave>).done === true ? 1 : null;
}

/** Wrong tries that reveal the first, second and third hint. */
const HINT_AT = [3, 6, 9];
/** The on-screen key row: label and key, in two groups of five (a phone shows them as two rows; R3-16). */
const KEY_ROW: { label: string; key: Key | "Ctrl" }[] = [
  { label: "Esc", key: "Esc" },
  { label: "Ctrl", key: "Ctrl" },
  { label: "Tab", key: "Tab" },
  { label: "~", key: "~" },
  { label: ":", key: ":" },
  { label: "←", key: "Left" },
  { label: "↑", key: "Up" },
  { label: "↓", key: "Down" },
  { label: "→", key: "Right" },
  { label: "Enter", key: "Enter" },
];
/** What the hidden input holds between keystrokes, so a Backspace from a phone keyboard can be seen. */
const SENTINEL = " ";
/** The medals' marks, on the strip and the share card (the words go with them wherever they are read). */
const MEDAL_MARK: Record<Medal, string> = { under: "🐦", par: "⛳", "": "" };
/** How many keystroke squares the daily share card draws before it writes the rest as a number. */
const SHARE_SQUARES = 15;

/**
 * Read the remembered progress.
 *
 * @returns cleared levels by id
 */
function readProgress(): Record<string, Cleared> {
  // The record's extra field.
  const p = loadRecord(GAME_ID).extra.progress;
  // An object, or nothing yet.
  return p && typeof p === "object" ? (p as Record<string, Cleared>) : {};
}

/**
 * The medal a level's progress holds: from the fewest keystrokes of any clear.
 *
 * @param c the level's progress, if cleared
 * @param par the level's par
 * @returns the medal, or "" (none, or not cleared)
 */
function medalOf(c: Cleared | undefined, par: number): Medal {
  // Not cleared: nothing.
  if (!c) return "";
  // The fewest keystrokes (older saves only know the best attempt's).
  return medalFor(typeof c.fewest === "number" ? c.fewest : c.keys, par);
}

/**
 * Read a day's saved daily attempt, checking its shape.
 *
 * @param day the UTC day
 * @returns the attempt, or null when there is none (nothing typed yet that day) or it is unreadable
 */
function readDaily(day: string): DailySave | null {
  // The stored state.
  const s = loadRecord(GAME_ID).daily[day] as Partial<DailySave> | undefined;
  // An attempt has its keys and its start.
  if (!s || !Array.isArray(s.keys) || !s.keys.every((k) => typeof k === "string") || typeof s.startedAt !== "number") return null;
  // Normalised.
  return { keys: s.keys, startedAt: s.startedAt, asked: typeof s.asked === "number" ? s.asked : 0, done: s.done === true, ms: typeof s.ms === "number" ? s.ms : undefined };
}

/**
 * The terminal.
 *
 * @param props the page's locale (for the share card's address)
 * @returns the game
 */
export default function ExitTheEditor({ locale }: { locale: string }) {
  // The game's strings and the shell's.
  const t = useTranslations("devFun.games.exit-the-editor");
  const tc = useTranslations("devFun.games.common");
  // Today, after mount (the shell and the daily escape need it; the levels do not).
  const today = useToday();
  // The earlier puzzle on the board (?day=), or null: its wording says "this day's" where today's says "today's".
  const earlierDay = useEarlierDay();
  // The levels or the daily escape.
  const [mode, setMode] = useState<"levels" | "daily">("levels");
  // Progress, read after mount.
  const [progress, setProgress] = useState<Record<string, Cleared> | null>(null);
  // The level being played.
  const [levelId, setLevelId] = useState(LEVELS[0].id);
  // Its state.
  const [st, setSt] = useState<LevelState>(() => startLevel(LEVELS[0].id));
  // Keystrokes in this attempt.
  const [keys, setKeys] = useState(0);
  // Wrong tries in this attempt.
  const [tries, setTries] = useState(0);
  // The furthest hint revealed with the button (1 to 3), or 0.
  const [asked, setAsked] = useState(0);
  // Hints the button revealed, each one charged (hints earned by wrong tries are free; review R3-06).
  const [bought, setBought] = useState(0);
  // The sticky Ctrl.
  const [ctrl, setCtrl] = useState(false);
  // Whether the terminal has the keyboard.
  const [focused, setFocused] = useState(false);
  // The shell's result.
  const [result, setResult] = useState<ShellResult | null>(null);
  // The shell's stats line re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // The polite line.
  const [say, setSay] = useState("");
  // The last cleared attempt: score, keys, time.
  const [last, setLast] = useState<Cleared | null>(null);
  // The day of the daily escape on the board (null until one is loaded).
  const [dailyDay, setDailyDay] = useState<string | null>(null);
  // When the daily attempt started (Date.now()), or null before its first key.
  const [dailyStart, setDailyStart] = useState<number | null>(null);
  // The escaped attempt's time, or null while it runs.
  const [dailyMs, setDailyMs] = useState<number | null>(null);
  // Wrong ways out in the daily attempt.
  const [fails, setFails] = useState(0);
  // The wall clock, ticking while a daily attempt runs.
  const [nowMs, setNowMs] = useState(0);
  // The stopwatch (the levels).
  const clock = useStopwatch();
  // The hidden input that takes the keyboard.
  const inputRef = useRef<HTMLInputElement>(null);
  // The latest state, for handlers that run between renders.
  const stRef = useRef(st);
  // Kept in step.
  stRef.current = st;
  // Keystrokes and the sticky Ctrl, for several keys sent within one event.
  const keysRef = useRef(0);
  const ctrlRef = useRef(false);
  // A dead key is waiting for the next key (PRIME 05/11/2026: on a US International keyboard "~" is a dead key, as it
  // is on Brazil's ABNT2, so Enter ~ . did not reach ssh): the character comes with the next key, through the input.
  const deadRef = useRef(false);
  // The wrong-try count, carried from key to key (the engine's countTry); set for the level on mount and in begin().
  const triesRef = useRef<TryCount>({ stage: 0, best: Infinity, wrong: 0 });
  // The level strip, scrolled to the current level on a phone.
  const stripRef = useRef<HTMLOListElement>(null);
  // The mode, for handlers that run between renders.
  const modeRef = useRef<"levels" | "daily">("levels");
  // The daily attempt's saved keys (with RETRY marks), its start, its hints and its day, kept in step with the save.
  const dailyKeysRef = useRef<Key[]>([]);
  const dailyStartRef = useRef<number | null>(null);
  const askedRef = useRef(0);
  const dailyDayRef = useRef<string | null>(null);
  // Wrong ways out in the daily attempt, for handlers that run between renders (a paste sends several keys at once).
  const failsRef = useRef(0);

  // Leaving the page gives the site its shortcuts back, whatever had the focus.
  useEffect(() => () => setSiteShortcutsSuppressed(false), []);

  // The day's trap, once a day is loaded.
  const daily: DailyEscape | null = useMemo(() => (dailyDay ? dailyEscape(dailyDay) : null), [dailyDay]);

  /**
   * The shell's result for an escaped daily attempt, with its share card.
   *
   * @param d the day's trap
   * @param n keystrokes
   * @param ms time
   * @param f wrong ways out
   * @param h hints asked for
   * @returns the result
   */
  const dailyResult = useCallback(
    (d: DailyEscape, n: number, ms: number, f: number, h: number): ShellResult => {
      // The medal.
      const medal = medalFor(n, d.par);
      // The keystrokes as squares: up to the par green, past it amber, a par stroke not needed white (under par).
      const green = Math.min(n, d.par);
      // Over par.
      const over = Math.max(0, n - d.par);
      // Unused par strokes.
      const spare = Math.max(0, d.par - n);
      // Drawn, capped, the rest as a number.
      const drawn = "🟩".repeat(green) + "⬜".repeat(spare) + "🟨".repeat(Math.max(0, Math.min(over, SHARE_SQUARES - green)));
      // What the cap left out.
      const rest = Math.max(0, over - Math.max(0, SHARE_SQUARES - green));
      // Wrong ways out and hints, as marks after the squares.
      const marks = `${"💥".repeat(Math.min(f, 5))}${"💡".repeat(Math.min(h, 3))}`;
      // The card.
      const share = shareText({
        title: t("dailyShareTitle", { n: puzzleNumber(d.day) }),
        lines: [`${d.prog} ${MEDAL_MARK[medal]}`.trim(), `${drawn}${rest > 0 ? ` +${rest}` : ""}${marks ? ` ${marks}` : ""}`],
        summary: t("dailyShareSummary", { keys: n, par: d.par, time: formatDuration(ms), medal: medal || "none" }),
        locale,
        slug: GAME_ID,
      });
      // The shell's panel.
      return { won: true, headline: t("clearedHeadline", { name: d.prog }), detail: t("dailyDetail", { keys: n, par: d.par, time: formatDuration(ms), medal: medal || "none", fails: f }), share };
    },
    [t, locale],
  );

  /**
   * Load a day's daily escape onto the board: the saved attempt replayed (resumed, or shown as escaped), or a fresh
   * trap when nothing has been typed that day.
   *
   * @param day the UTC day
   */
  const enterDaily = useCallback(
    (day: string) => {
      // The day's trap.
      const d = dailyEscape(day);
      // The saved attempt, if any.
      const saved = readDaily(day);
      // Its keys, replayed as they were played.
      const savedKeys = saved ? saved.keys.slice() : [];
      // The replay.
      const r = replayDaily(d, savedKeys);
      // Kept for the next keys.
      dailyKeysRef.current = savedKeys;
      dailyStartRef.current = saved ? saved.startedAt : null;
      askedRef.current = saved ? saved.asked : 0;
      dailyDayRef.current = day;
      // The board.
      setDailyDay(day);
      stRef.current = r.st;
      setSt(r.st);
      // The counts.
      keysRef.current = r.keys;
      setKeys(r.keys);
      triesRef.current = r.tries;
      setTries(r.tries.wrong);
      failsRef.current = r.fails;
      setFails(r.fails);
      // The hints asked for (they are on screen again, uncharged in the daily: it has no points).
      setAsked(askedRef.current);
      setBought(askedRef.current);
      // The clock.
      setDailyStart(dailyStartRef.current);
      setNowMs(Date.now());
      // No sticky Ctrl, no level result.
      ctrlRef.current = false;
      setCtrl(false);
      setLast(null);
      // Escaped already: its result again.
      if (saved?.done) {
        // The time kept with it.
        const ms = saved.ms ?? 0;
        // Frozen.
        setDailyMs(ms);
        // Shown in the frame.
        setResult(dailyResult(d, r.keys, ms, r.fails, askedRef.current));
        // Done.
        return;
      }
      // Still running.
      setDailyMs(null);
      setResult(null);
      // A resumed attempt says so.
      if (saved && r.keys > 0) setSay(t(earlierDayInPlay() !== null ? "sayResumedEarlier" : "sayResumed", { keys: r.keys }));
    },
    [dailyResult, t],
  );
  // The latest enterDaily, for the mount effect below (which must run once, whatever the strings' identity does).
  const enterDailyRef = useRef(enterDaily);
  // Kept current on every render.
  enterDailyRef.current = enterDaily;

  // Progress is read once mounted, and the page opens on the daily escape when it is waiting.
  useEffect(() => {
    // From storage.
    const p = readProgress();
    // Kept.
    setProgress(p);
    // The first level not yet cleared is where the player resumes.
    const next = LEVELS.find((l) => !p[l.id]) ?? LEVELS[LEVELS.length - 1];
    // Loaded.
    setLevelId(next.id);
    setSt(startLevel(next.id));
    // Counted from that level's start.
    triesRef.current = startTries(startLevel(next.id));
    // The earlier puzzle the address asks for (?day=), if any.
    const earlier = earlierDayInPlay();
    // The day in play: that earlier day, or today read with the same clock useToday reads in this commit.
    const day = earlier ?? utcDayKey(new Date());
    // That day's attempt, if one has started.
    const saved = readDaily(day);
    // An attempt in progress always reopens; a player who has cleared a level opens on a daily not played yet (a first
    // visit starts on Level 1, which teaches what the daily assumes), as the other daily games do; an earlier puzzle's
    // page always opens on its daily escape, because the address asked for it.
    if (earlier !== null || (saved && !saved.done) || (!saved && Object.keys(p).length > 0)) {
      // The daily escape.
      modeRef.current = "daily";
      setMode("daily");
      // Loaded.
      enterDailyRef.current(day);
    }
  }, []);

  // The wall clock ticks while a daily attempt runs (four times a second, whole seconds are shown).
  useEffect(() => {
    // Only for a started, unfinished daily attempt on screen.
    if (mode !== "daily" || dailyStart === null || dailyMs !== null) return;
    // Now.
    setNowMs(Date.now());
    // Then on a tick.
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    // Stopped when it ends, or the mode changes.
    return () => window.clearInterval(id);
  }, [mode, dailyStart, dailyMs]);

  // On a phone the levels are one scrolling strip: the current one is brought into the middle of it.
  useEffect(() => {
    // The strip and the current level's button.
    const strip = stripRef.current;
    const on = strip?.querySelector<HTMLElement>('[aria-current="step"]');
    // Nothing to do, or the strip does not scroll (a wide screen shows every level).
    if (!strip || !on || strip.scrollWidth <= strip.clientWidth) return;
    // Where the button and the strip sit.
    const b = on.getBoundingClientRect();
    const r = strip.getBoundingClientRect();
    // Scrolled sideways only (the page itself does not move), at once.
    strip.scrollLeft += b.left + b.width / 2 - (r.left + r.width / 2);
  }, [levelId, progress, mode]);

  // The level on the board: the daily's program, or the level chosen.
  const index = LEVELS.findIndex((l) => l.id === (mode === "daily" && daily ? daily.level : levelId));
  const level = LEVELS[Math.max(0, index)];
  // The par on the board: the day's, or the level's.
  const par = mode === "daily" && daily ? daily.par : level.par;
  // Hints shown: the ones earned by wrong tries, or asked for, whichever is more.
  const earned = HINT_AT.filter((n) => tries >= n).length;
  const shown = Math.max(earned, asked);
  // The time on the board: the daily's wall clock, or the level's stopwatch.
  const elapsed = mode === "daily" ? (dailyMs !== null ? dailyMs : dailyStart !== null ? Math.max(0, nowMs - dailyStart) : 0) : clock.elapsed;

  /**
   * Whether a level can be played: the first, or one after a cleared level.
   *
   * @param i the level's index
   * @returns true when unlocked
   */
  const unlocked = (i: number) => i === 0 || Boolean(progress && progress[LEVELS[i - 1].id]);

  /**
   * Start (or restart) a level.
   *
   * @param id the level
   * @param focus whether the keyboard goes to the terminal (not on a change of mode, which would open a phone's keyboard)
   */
  const begin = useCallback(
    (id: string, focus = true) => {
      // The level and its first screen.
      setLevelId(id);
      setSt(startLevel(id));
      stRef.current = startLevel(id);
      // Counters reset.
      keysRef.current = 0;
      ctrlRef.current = false;
      triesRef.current = startTries(startLevel(id));
      setKeys(0);
      setTries(0);
      setAsked(0);
      setBought(0);
      setCtrl(false);
      setLast(null);
      setResult(null);
      // The clock reset.
      clock.reset();
      // The keyboard goes to the terminal.
      if (focus) window.setTimeout(() => inputRef.current?.focus(), 0);
    },
    [clock],
  );

  /**
   * Switch between the levels and the daily escape.
   *
   * @param m the mode
   */
  const switchMode = (m: "levels" | "daily") => {
    // Already there.
    if (m === modeRef.current) return;
    // The mode.
    modeRef.current = m;
    setMode(m);
    // A fresh polite line.
    setSay("");
    // The daily escape: today's, resumed or fresh (its clock is the wall clock, the stopwatch is not used).
    if (m === "daily") {
      // The levels' stopwatch stops.
      clock.reset();
      // Loaded.
      enterDaily(today ?? utcDayKey(new Date()));
    }
    // The levels: the level chosen, from its start.
    else begin(levelId, false);
  };

  /**
   * The share card for the progress so far.
   *
   * @param p the progress
   * @returns the card's text
   */
  const card = useCallback(
    (p: Record<string, Cleared>) => {
      // Cleared levels, keystrokes and time, summed.
      const done = LEVELS.filter((l) => p[l.id]);
      const totalKeys = done.reduce((n, l) => n + p[l.id].keys, 0);
      const totalMs = done.reduce((n, l) => n + p[l.id].ms, 0);
      // The medals.
      const medals = LEVELS.map((l) => medalOf(p[l.id], l.par));
      // A mark per level: not cleared, cleared, at par, under par (no answers in it).
      const squares = LEVELS.map((l, i) => (!p[l.id] ? "⬛" : medals[i] ? MEDAL_MARK[medals[i]] : "🟩")).join("");
      // How many of each medal.
      const atPar = medals.filter((m) => m === "par").length;
      const under = medals.filter((m) => m === "under").length;
      // The card, with the medals' line when there are any.
      return shareText({
        title: t("shareTitle"),
        // A kind of medal not won is left out of the line ("Medals: ⛳ Par ×1", not "... · 🐦 Under par ×0").
        lines: atPar + under > 0 ? [squares, t("shareMedals", { par: atPar, under, both: atPar > 0 && under > 0 ? "yes" : "no" })] : [squares],
        summary: t("shareSummary", { cleared: done.length, total: LEVELS.length, keys: totalKeys, time: formatDuration(totalMs) }),
        locale,
        slug: GAME_ID,
      });
    },
    [t, locale],
  );

  /**
   * A level was left cleanly: score it, remember it (with the fewest keystrokes, for the medal), show the result.
   *
   * @param ms the time taken
   * @param n keystrokes used
   */
  const cleared = useCallback(
    (ms: number, n: number) => {
      // The score: only the hints asked for are charged.
      const score = levelScore(n, level.par, ms, bought);
      // This attempt.
      const mine: Cleared = { score, keys: n, ms: Math.round(ms), fewest: n };
      // The new progress: the best attempt per level is kept.
      let p: Record<string, Cleared> = {};
      // Written in one read-change-write, the record's other values kept.
      updateRecord(GAME_ID, (r) => {
        // The stored progress.
        const old = (r.extra.progress && typeof r.extra.progress === "object" ? r.extra.progress : {}) as Record<string, Cleared>;
        // The level's, before.
        const prev = old[level.id];
        // The fewest keystrokes of any clear, this one included (an older save's best attempt stands in for its own).
        const fewest = Math.min(n, prev ? (typeof prev.fewest === "number" ? prev.fewest : prev.keys) : n);
        // Better or first; the fewest kept either way.
        p = { ...old, [level.id]: { ...(!prev || prev.score < score ? mine : prev), fewest } };
        // Saved, merged into the game's other values.
        return { ...r, extra: { ...r.extra, progress: p } };
      });
      // The total of the best scores.
      const total = Object.values(p).reduce((a, c) => a + c.score, 0);
      // This clear's medal.
      const medal = medalFor(n, level.par);
      // Counted as a finished round, with the total as the score.
      if (today) recordResult(GAME_ID, { dayKey: today, won: true, score: total });
      // Shown.
      setProgress(p);
      setLast(mine);
      setVersion((v) => v + 1);
      // The shell's panel, its numbers in the page's language (12.610 on a pt-BR page; review R3-10).
      setResult({ won: true, headline: t("clearedHeadline", { name: level.prog }), detail: t("clearedDetail", { keys: n, time: formatDuration(ms), score: score.toLocaleString(locale), total: total.toLocaleString(locale), medal: medal || "none" }), share: card(p) });
      // Announced.
      setSay(t("sayCleared", { name: level.prog, score: score.toLocaleString(locale), medal: medal || "none" }));
    },
    [level, bought, today, t, card, locale],
  );

  /**
   * Save the daily attempt as it stands.
   *
   * @param ms the time, once escaped
   */
  const saveDaily = useCallback((ms?: number) => {
    // The attempt's day and start.
    const day = dailyDayRef.current;
    const startedAt = dailyStartRef.current;
    // Nothing to save before the attempt starts.
    if (!day || startedAt === null) return;
    // Written.
    saveDailyState(GAME_ID, day, { keys: dailyKeysRef.current.slice(), startedAt, asked: askedRef.current, done: ms !== undefined, ms } satisfies DailySave);
  }, []);

  /** The daily attempt starts now (the first key, or a hint asked for first): saved at once, so a reload resumes it. */
  const startAttempt = useCallback(() => {
    // Only once.
    if (dailyStartRef.current !== null) return;
    // The wall clock's start.
    const now = Date.now();
    // Kept.
    dailyStartRef.current = now;
    setDailyStart(now);
    setNowMs(now);
    // Saved as started.
    saveDaily();
  }, [saveDaily]);

  /**
   * The daily trap was left cleanly: the attempt is over, saved and counted.
   *
   * @param n keystrokes used
   */
  const escaped = useCallback(
    (n: number) => {
      // The trap and its day.
      const d = daily;
      const day = dailyDayRef.current;
      // Nothing loaded (cannot happen while a key reached it).
      if (!d || !day || dailyStartRef.current === null) return;
      // The time, on the wall clock.
      const ms = Math.max(0, Date.now() - dailyStartRef.current);
      // Frozen.
      setDailyMs(ms);
      // Saved as escaped.
      saveDaily(ms);
      // Counted once: played, won, the streak (no score: the levels' total keeps the best).
      recordResult(GAME_ID, { dayKey: day, won: true, daily: true });
      // The stats line re-reads.
      setVersion((v) => v + 1);
      // The frame's panel and share card.
      setResult(dailyResult(d, n, ms, failsRef.current, askedRef.current));
      // Announced.
      setSay(t("sayEscaped", { name: d.prog, keys: n, par: d.par, medal: medalFor(n, d.par) || "none" }));
    },
    [daily, saveDaily, dailyResult, t],
  );

  /** The daily trap again, after a wrong way out: the same attempt, keystrokes and clock carried on. */
  const retryDaily = () => {
    // The trap.
    if (!daily) return;
    // Marked in the saved keys, so a reload replays the restart.
    dailyKeysRef.current.push(RETRY);
    // Saved.
    saveDaily();
    // A fresh program.
    const s = startDaily(daily);
    // On the board.
    stRef.current = s;
    setSt(s);
    // Measured again from the start, the wrong tries kept (they bring the hints).
    triesRef.current = { ...startTries(s), wrong: triesRef.current.wrong };
    // No sticky Ctrl left over.
    ctrlRef.current = false;
    setCtrl(false);
    // Announced.
    setSay(t("sayRetry"));
    // The keyboard back to the terminal.
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  /**
   * Send one key to the level or the daily trap.
   *
   * @param k0 the key (Ctrl is applied here when the sticky Ctrl is on)
   */
  const send = useCallback(
    (k0: Key) => {
      // The current state.
      const cur = stRef.current;
      // Nothing more once the level is over.
      if (cur.outcome !== "run") return;
      // The daily escape, or a level.
      const isDaily = modeRef.current === "daily";
      // The sticky Ctrl turns a character into a control key.
      const k = ctrlRef.current && k0.length === 1 ? `C-${k0.toLowerCase()}` : k0;
      // The sticky Ctrl is used up.
      if (ctrlRef.current) {
        // Off.
        ctrlRef.current = false;
        setCtrl(false);
      }
      // The first key starts the clock: the daily attempt's wall clock, or the level's stopwatch.
      if (isDaily) startAttempt();
      else if (keysRef.current === 0) clock.start();
      // The step.
      const next = press(cur, k);
      // Kept.
      stRef.current = next;
      setSt(next);
      // Counted.
      const n = keysRef.current + 1;
      keysRef.current = n;
      setKeys(n);
      // A wrong try, when the engine says this key brought the way out no closer (or failed the level).
      const counted = countTry(triesRef.current, k, next);
      // Kept, and shown when it changed.
      if (counted.wrong !== triesRef.current.wrong) setTries(counted.wrong);
      triesRef.current = counted;
      // The daily attempt keeps every key, saved at once.
      if (isDaily) {
        // Kept.
        dailyKeysRef.current.push(k);
        // Saved (the escape below saves it again, finished).
        saveDaily();
      }
      // Left cleanly.
      if (next.outcome === "exit") {
        // The daily attempt is over, or the level is scored.
        if (isDaily) escaped(n);
        else cleared(clock.stop(), n);
      } else if (next.outcome === "fail") {
        // The daily attempt goes on (the clock too), one wrong way out more; a level's stopwatch stops.
        if (isDaily) {
          // Counted.
          failsRef.current += 1;
          setFails(failsRef.current);
        } else clock.stop();
        // Announced (countTry has counted it as a wrong try).
        setSay(t(`fail.${next.term.why || "suspended"}`));
      }
    },
    [clock, cleared, escaped, startAttempt, saveDaily, t],
  );

  // The clock, for the programs that print on their own (tail -f, a job in tmux).
  useEffect(() => {
    // Only for those, while running.
    if (st.outcome !== "run" || (st.term.prog !== "tail" && st.term.prog !== "tmux")) return;
    // About once a second.
    const id = window.setInterval(() => {
      // The tick is not a keystroke (nor saved: a resumed attempt simply has fewer lines printed).
      const next = press(stRef.current, "Tick");
      // Kept.
      stRef.current = next;
      setSt(next);
    }, 1200);
    // Stopped.
    return () => window.clearInterval(id);
  }, [st.outcome, st.term.prog, st.stage]);

  /**
   * A key from the real keyboard, in the hidden input.
   *
   * @param e the event
   */
  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    // A phone keyboard's composed or unknown key: the input event handles it.
    if (e.nativeEvent.isComposing || e.key === "Unidentified" || e.key === "Process") return;
    // A dead key ("~", "^", "`", "'" or '"' on US International; "~", "^", "´" and "`" on ABNT2): no character yet.
    // The browser joins it with the next key ("~" then "." gives "~.", "~" then space gives "~", "~" then "a" gives
    // "ã"), so it is left to the browser, and the input event sends what arrives.
    if (e.key === "Dead") {
      // Waiting.
      deadRef.current = true;
      // The browser's.
      return;
    }
    // The printable key after a dead key: its text, the dead key's character included, comes through the input
    // event, so the browser is left to insert it (taking it here would lose the "~").
    if (deadRef.current && e.key.length === 1 && !e.metaKey) return;
    // Any other key ends the wait (the dead key's character is lost, as it would be in the browser's own fields).
    deadRef.current = false;
    // Tab stays with the browser (no keyboard trap); the on-screen Tab key sends it.
    if (e.key === "Tab" || e.metaKey) return;
    // The named keys.
    const named: Record<string, Key> = { Escape: "Esc", Enter: "Enter", Backspace: "Backspace", ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right" };
    // AltGr, which Windows reports as Ctrl and Alt together: the character it types ("~" on a German or Portuguese
    // keyboard, "/" on ABNT2), not a Ctrl or Alt chord.
    const altGr = e.nativeEvent.getModifierState?.("AltGraph") === true;
    // The key to send.
    let k: Key | null = null;
    // A named key.
    if (named[e.key]) k = named[e.key];
    // Ctrl with a character.
    else if (e.ctrlKey && !altGr && e.key.length === 1) k = `C-${e.key.toLowerCase()}`;
    // A printable character (typed with AltGr too).
    else if (e.key.length === 1 && (!e.altKey || altGr)) k = e.key;
    // Alt with a character: a terminal sends Esc first (Meta).
    else if (e.key.length === 1 && e.altKey) {
      // Esc, then the key.
      e.preventDefault();
      send("Esc");
      send(e.key);
      // Done.
      return;
    }
    // Not ours.
    if (!k) return;
    // Ours: no browser action.
    e.preventDefault();
    // Sent.
    send(k);
  };

  /**
   * Text from a phone keyboard (or a paste) in the hidden input.
   *
   * @param el the input
   */
  const onInput = (el: HTMLInputElement) => {
    // A dead key's wait ends here: its character arrived (alone, joined to the next one, or composed with it).
    deadRef.current = false;
    // What it holds now.
    const v = el.value;
    // Shorter than the sentinel: a Backspace.
    if (v.length < SENTINEL.length) send("Backspace");
    // New characters after the sentinel: each one sent.
    else for (const ch of v.slice(SENTINEL.length)) send(ch === "\n" ? "Enter" : ch);
    // Back to the sentinel.
    el.value = SENTINEL;
  };

  /**
   * An on-screen key.
   *
   * @param k the key, or "Ctrl" for the sticky Ctrl
   */
  const onScreenKey = (k: Key | "Ctrl") => {
    // The sticky Ctrl toggles.
    if (k === "Ctrl") {
      // Flipped.
      ctrlRef.current = !ctrlRef.current;
      setCtrl(ctrlRef.current);
    }
    // Any other key is sent.
    else send(k);
    // The keyboard stays with the terminal.
    inputRef.current?.focus();
  };

  /** The Hint button: the next hint now; charged on a level, and in the daily kept with the attempt (which it starts). */
  const askHint = () => {
    // Nothing left to show.
    if (shown >= 3) return;
    // The next hint, revealed now.
    setAsked(shown + 1);
    // Charged: it was asked for.
    setBought((b) => b + 1);
    // The daily attempt keeps it (and starts with it, if no key came first).
    if (modeRef.current === "daily") {
      // One more.
      askedRef.current += 1;
      // Started, or saved.
      if (dailyStartRef.current === null) startAttempt();
      else saveDaily();
    }
  };

  // The screen to draw: the level's, or, once it is over, what is left on screen (the engine's finalView: the shell
  // after the program, or tmux itself when a Ctrl-C reached the job inside it).
  const screen = useMemo(() => finalView(st), [st]);

  /** Put the terminal's text in the polite line, for a screen reader (the drawn screen is hidden from it). */
  const readScreen = () => {
    // The rows with something on them (vim's and less's "~" filler rows say nothing), without trailing blanks.
    const rows = screen.lines.map((l) => l.trim()).filter((l) => l !== "" && l !== "~");
    // One sentence per row, so a reader pauses between them.
    const text = rows.map((l) => (/[.!?:]$/.test(l) ? l : `${l}.`)).join(" ");
    // Announced.
    setSay(t("screenSays", { text }));
  };

  // The rules: the score's parts come from the engine, so the text always matches the sum (review R3-I3).
  const rules = (
    <>
      <p>{t("rule1")}</p>
      <ul>
        <li>{t("rule2")}</li>
        <li>{t("rule3", { perHint: SCORE_PER_HINT })}</li>
        <li>
          {t("rule4", {
            max: SCORE_MAX.toLocaleString(locale),
            perKey: SCORE_PER_KEY,
            perHint: SCORE_PER_HINT,
            perSecond: SCORE_PER_SECOND,
            free: SCORE_FREE_SECONDS,
            floor: SCORE_FLOOR,
          })}
        </li>
        <li>{t("rule5")}</li>
        <li>{t("rule6")}</li>
      </ul>
    </>
  );

  // Cleared levels.
  const clearedCount = progress ? LEVELS.filter((l) => progress[l.id]).length : 0;
  // The daily attempt is over for today.
  const dailyOver = mode === "daily" && dailyMs !== null;

  // The page.
  return (
    <GameShell gameId={GAME_ID} kind={mode === "daily" ? "daily" : "score"} today={today} rules={rules} result={result} onPlayAgain={() => begin(levelId)} version={version} gradeSaved={gradeSaved}>
      {/* The polite line. */}
      <p className="fg-exit-sr" aria-live="polite">{say}</p>
      {/* Before mount: a neutral line, the same as the static HTML. */}
      {!progress ? (
        <p className="fg-muted">{tc("loading")}</p>
      ) : (
        <>
          {/* The levels or the daily escape. */}
          <div className="fg-buttons" role="group" aria-label={t("modeLabel")}>
            <button type="button" className="fg-button fg-exit-mode" aria-pressed={mode === "levels"} onClick={() => switchMode("levels")}>
              {t("modeLevels")}
            </button>
            <button type="button" className="fg-button fg-exit-mode" aria-pressed={mode === "daily"} onClick={() => switchMode("daily")}>
              {today ? t("modeDaily", { n: puzzleNumber(today) }) : t("modeDailyName")}
            </button>
          </div>
          {/* The levels: cards on a wide screen, one scrolling strip on a phone (not shown for the daily escape). */}
          {mode === "levels" && (
            <ol ref={stripRef} className="fg-exit-levels" aria-label={t("levelsLabel")}>
              {LEVELS.map((l, i) => {
                // The level's medal, from its fewest keystrokes.
                const medal = medalOf(progress[l.id], l.par);
                // The card.
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      className={`fg-exit-level ${l.id === levelId ? "fg-exit-level-on" : ""} ${progress[l.id] ? "fg-exit-level-done" : ""}`}
                      disabled={!unlocked(i)}
                      aria-current={l.id === levelId ? "step" : undefined}
                      onClick={() => begin(l.id)}
                    >
                      <span className="fg-exit-level-n">{i + 1}</span>
                      {/* The program, the tick (phone strip) and the medal's mark; the state line says them in words. */}
                      <span className="fg-exit-level-head">
                        <span className="fg-exit-level-name">{l.prog}</span>
                        {progress[l.id] && (
                          <span className="fg-exit-level-mark" aria-hidden="true">
                            ✓
                          </span>
                        )}
                        {medal && (
                          <span className="fg-exit-level-medal" aria-hidden="true">
                            {MEDAL_MARK[medal]}
                          </span>
                        )}
                      </span>
                      {/* The par. */}
                      <span className="fg-exit-level-par">{t("levelPar", { par: l.par })}</span>
                      <span className="fg-exit-level-state">
                        {progress[l.id] ? t("levelDone", { score: progress[l.id].score.toLocaleString(locale), medal: medal || "none" }) : unlocked(i) ? t("levelOpen") : t("levelLocked")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          {/* The brief: the level's, or the day's scene; the header carries the par. */}
          <div className="fg-exit-brief">
            <p className="fg-exit-brief-title">
              {mode === "daily" && daily ? t("dailyTitle", { n: puzzleNumber(daily.day) }) : tc("level", { n: index + 1 })}: <span className="fg-mono">{mode === "daily" && daily ? daily.prog : level.prog}</span>{" "}
              <span className="fg-exit-par">{t("levelPar", { par })}</span>
            </p>
            <p className="fg-exit-brief-text">{mode === "daily" && daily ? t(`daily.${daily.level}`, daily.scene) : t(`levels.${level.id}.brief`)}</p>
          </div>
          {/* The readouts (one line on a phone too). */}
          <div className="fg-hud fg-exit-hud">
            <span className="fg-readout">{t("keystrokes", { n: keys })}</span>
            <span className="fg-readout">{tc("time")} {formatDuration(elapsed)}</span>
            {mode === "levels" ? <span className="fg-readout">{t("clearedCount", { n: clearedCount, total: LEVELS.length })}</span> : fails > 0 && <span className="fg-readout">{t("failsReadout", { n: fails })}</span>}
          </div>
          {/* The terminal: a click or a tap gives it the keyboard. */}
          <div className={`fg-exit-term ${focused ? "fg-exit-term-focus" : ""}`} onClick={() => inputRef.current?.focus()}>
            <pre className="fg-exit-screen" aria-hidden="true">
              {screen.lines.map((line, r) => {
                // The row's class: reverse video for status bars.
                const cls = screen.inverse.includes(r) ? "fg-exit-row fg-exit-inv" : "fg-exit-row";
                // The cursor's row splits around the cursor.
                if (screen.cursor && screen.cursor.r === r && focused) {
                  // The column.
                  const c = screen.cursor.c;
                  // Padded so the cursor can sit past the text.
                  const padded = line.padEnd(c + 1, " ");
                  // Before, the cursor cell, after.
                  return (
                    <span key={r} className={cls}>
                      {padded.slice(0, c)}
                      <span className="fg-exit-cursor">{padded[c]}</span>
                      {padded.slice(c + 1)}
                      {"\n"}
                    </span>
                  );
                }
                // A plain row.
                return (
                  <span key={r} className={cls}>
                    {line}
                    {"\n"}
                  </span>
                );
              })}
            </pre>
            {/* The input that takes the keyboard (and a phone's keyboard). */}
            <input
              ref={inputRef}
              className="fg-exit-input"
              aria-label={t("termLabel")}
              defaultValue={SENTINEL}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              onKeyDown={onKeyDown}
              onInput={(e) => onInput(e.currentTarget)}
              onFocus={() => {
                // Focused: the terminal owns every key, the site's shortcuts included.
                setFocused(true);
                setSiteShortcutsSuppressed(true);
              }}
              onBlur={() => {
                // Unfocused: the site's shortcuts come back.
                setFocused(false);
                setSiteShortcutsSuppressed(false);
              }}
            />
            {/* The hint to click, while it has not got the keyboard. */}
            {!focused && st.outcome === "run" && <span className="fg-exit-tap">{t("clickToType")}</span>}
          </div>
          {/* The on-screen keys. */}
          <div className="fg-exit-keys" role="group" aria-label={t("keysLabel")}>
            {KEY_ROW.map((k) => (
              <button
                key={k.label}
                type="button"
                className={`fg-exit-key ${k.key === "Ctrl" && ctrl ? "fg-exit-key-on" : ""}`}
                aria-pressed={k.key === "Ctrl" ? ctrl : undefined}
                // Pressing a key must not take the keyboard away from the terminal.
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => onScreenKey(k.key)}
              >
                {k.label}
              </button>
            ))}
          </div>
          {ctrl && <p className="fg-muted fg-small">{t("ctrlArmed")}</p>}
          {/* Hints, as they are earned or asked for (the daily's are its program's). */}
          {shown > 0 && (
            <ol className="fg-exit-hints">
              {[1, 2, 3].slice(0, shown).map((h) => (
                <li key={h}>{t(`levels.${level.id}.hint${h}`)}</li>
              ))}
            </ol>
          )}
          {/* Left the wrong way: a level restarts; the daily attempt carries on from a fresh trap. */}
          {st.outcome === "fail" && (
            <div className="fg-exit-fail" role="status">
              <p>{t(`fail.${st.term.why || "suspended"}`)}</p>
              {mode === "daily" && <p className="fg-small fg-exit-fail-note">{t(earlierDay ? "dailyFailNoteEarlier" : "dailyFailNote")}</p>}
            </div>
          )}
          {/* After the Python level: what changed in 3.13 (the level plays 3.12). */}
          {st.outcome === "exit" && level.id === "python" && <p className="fg-muted fg-small fg-exit-note">{t("levels.python.after")}</p>}
          {/* The buttons. */}
          <div className="fg-buttons">
            {st.outcome === "run" && (
              <button type="button" className="fg-button" onClick={askHint} disabled={shown >= 3}>
                {tc("hint")}
              </button>
            )}
            {/* The terminal's text, read out. */}
            <button type="button" className="fg-button" onClick={readScreen}>
              {t("readScreen")}
            </button>
            {/* A level starts again; the daily trap only after a wrong way out (the attempt itself never restarts). */}
            {mode === "levels" ? (
              <button type="button" className={`fg-button ${st.outcome === "fail" ? "fg-button-primary" : ""}`} onClick={() => begin(levelId)}>
                {t("restart")}
              </button>
            ) : (
              st.outcome === "fail" && (
                <button type="button" className="fg-button fg-button-primary" onClick={retryDaily}>
                  {t("tryAgain")}
                </button>
              )
            )}
            {mode === "levels" && st.outcome === "exit" && index + 1 < LEVELS.length && (
              <button type="button" className="fg-button fg-button-primary" onClick={() => begin(LEVELS[index + 1].id)}>
                {t("nextLevel")}
              </button>
            )}
          </div>
          {mode === "levels" && last && st.outcome === "exit" && index + 1 >= LEVELS.length && <p className="fg-exit-win">{t("allDone")}</p>}
          {/* Today's escape is over: the levels meanwhile. */}
          {dailyOver && <p className="fg-muted fg-small fg-exit-note">{t(earlierDay ? "dailyDoneNoteEarlier" : "dailyDoneNote")}</p>}
        </>
      )}
    </GameShell>
  );
}
