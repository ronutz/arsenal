// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/ExitTheEditor.tsx
// ----------------------------------------------------------------------------
// EXIT THE EDITOR, the terminal (PRIME 03/11/2026). Thirteen levels, each a
// program to leave cleanly. The keyboard types into the fake terminal once it
// has focus (click or tap it); on a phone, a row of keys gives Esc, a sticky
// Ctrl, Tab, the arrows, ~, : and Enter, and the phone's own keyboard types
// the rest through a hidden input. Tab is left to the browser, so the page
// never traps the keyboard.
//
// The programs are the engine's (src/lib/fun/games/exit-the-editor); this
// component counts keystrokes and time, reveals hints after a few wrong tries,
// keeps progress in this browser's record for the game (extra.progress), and
// draws the screen.
// ============================================================================

"use client";

// React's state, effects, refs and memoisation.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// The frame around every game.
import GameShell, { type ShellResult } from "./GameShell";
// Today's UTC day and a stopwatch.
import { useStopwatch, useToday } from "@/lib/fun/hooks";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// What this browser remembers.
import { loadRecord, recordResult, updateRecord } from "@/lib/fun/storage";
// The site's own shortcuts (Ctrl+K opens the search) stand down while the terminal has the keyboard.
import { setSiteShortcutsSuppressed } from "@/lib/pageCapabilities";
// The rules.
import { GAME_ID, LEVELS, isTry, levelScore, press, startLevel, view, type Key, type LevelState } from "@/lib/fun/games/exit-the-editor/engine";

/** One cleared level, as remembered. */
interface Cleared {
  /** Best score. */
  score: number;
  /** Keystrokes of that best. */
  keys: number;
  /** Milliseconds of that best. */
  ms: number;
}

/** Wrong tries that reveal the first, second and third hint. */
const HINT_AT = [3, 6, 9];
/** The on-screen key row: label and key. */
const KEY_ROW: { label: string; key: Key | "Ctrl" }[] = [
  { label: "Esc", key: "Esc" },
  { label: "Ctrl", key: "Ctrl" },
  { label: "Tab", key: "Tab" },
  { label: "←", key: "Left" },
  { label: "↑", key: "Up" },
  { label: "↓", key: "Down" },
  { label: "→", key: "Right" },
  { label: "~", key: "~" },
  { label: ":", key: ":" },
  { label: "Enter", key: "Enter" },
];
/** What the hidden input holds between keystrokes, so a Backspace from a phone keyboard can be seen. */
const SENTINEL = " ";

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
 * The terminal.
 *
 * @param props the page's locale (for the share card's address)
 * @returns the game
 */
export default function ExitTheEditor({ locale }: { locale: string }) {
  // The game's strings and the shell's.
  const t = useTranslations("devFun.games.exit-the-editor");
  const tc = useTranslations("devFun.games.common");
  // Today, after mount (the shell needs it; the levels do not).
  const today = useToday();
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
  // Hints revealed with the button.
  const [asked, setAsked] = useState(0);
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
  // The stopwatch.
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

  // Leaving the page gives the site its shortcuts back, whatever had the focus.
  useEffect(() => () => setSiteShortcutsSuppressed(false), []);

  // Progress is read once mounted.
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
  }, []);

  // The level's definition and position.
  const index = LEVELS.findIndex((l) => l.id === levelId);
  const level = LEVELS[index];
  // Hints shown: the ones earned by wrong tries, or asked for, whichever is more.
  const earned = HINT_AT.filter((n) => tries >= n).length;
  const shown = Math.max(earned, asked);

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
   */
  const begin = useCallback(
    (id: string) => {
      // The level and its first screen.
      setLevelId(id);
      setSt(startLevel(id));
      // Counters reset.
      keysRef.current = 0;
      ctrlRef.current = false;
      setKeys(0);
      setTries(0);
      setAsked(0);
      setCtrl(false);
      setLast(null);
      setResult(null);
      // The clock reset.
      clock.reset();
      // The keyboard goes to the terminal.
      window.setTimeout(() => inputRef.current?.focus(), 0);
    },
    [clock],
  );

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
      // A square per level: cleared or not (no answers in it).
      const squares = LEVELS.map((l) => (p[l.id] ? "🟩" : "⬛")).join("");
      // The card.
      return shareText({ title: t("shareTitle"), lines: [squares], summary: t("shareSummary", { cleared: done.length, total: LEVELS.length, keys: totalKeys, time: formatDuration(totalMs) }), locale, slug: GAME_ID });
    },
    [t, locale],
  );

  /**
   * A level was left cleanly: score it, remember it, show the result.
   *
   * @param ms the time taken
   * @param n keystrokes used
   */
  const cleared = useCallback(
    (ms: number, n: number) => {
      // The score.
      const score = levelScore(n, level.par, ms, shown);
      // This attempt.
      const mine: Cleared = { score, keys: n, ms: Math.round(ms) };
      // The new progress: the best attempt per level is kept.
      let p: Record<string, Cleared> = {};
      // Written in one read-change-write.
      updateRecord(GAME_ID, (r) => {
        // The stored progress.
        const old = (r.extra.progress && typeof r.extra.progress === "object" ? r.extra.progress : {}) as Record<string, Cleared>;
        // Better or first.
        p = { ...old, [level.id]: !old[level.id] || old[level.id].score < score ? mine : old[level.id] };
        // Saved.
        return { ...r, extra: { ...r.extra, progress: p } };
      });
      // The total of the best scores.
      const total = Object.values(p).reduce((a, c) => a + c.score, 0);
      // Counted as a finished round, with the total as the score.
      if (today) recordResult(GAME_ID, { dayKey: today, won: true, score: total });
      // Shown.
      setProgress(p);
      setLast(mine);
      setVersion((v) => v + 1);
      // The shell's panel.
      setResult({ won: true, headline: t("clearedHeadline", { name: level.prog }), detail: t("clearedDetail", { keys: n, time: formatDuration(ms), score, total }), share: card(p) });
      // Announced.
      setSay(t("sayCleared", { name: level.prog, score }));
    },
    [level, shown, today, t, card],
  );

  /**
   * Send one key to the level.
   *
   * @param k0 the key (Ctrl is applied here when the sticky Ctrl is on)
   */
  const send = useCallback(
    (k0: Key) => {
      // The current state.
      const cur = stRef.current;
      // Nothing more once the level is over.
      if (cur.outcome !== "run") return;
      // The sticky Ctrl turns a character into a control key.
      const k = ctrlRef.current && k0.length === 1 ? `C-${k0.toLowerCase()}` : k0;
      // The sticky Ctrl is used up.
      if (ctrlRef.current) {
        // Off.
        ctrlRef.current = false;
        setCtrl(false);
      }
      // The first key starts the clock.
      if (keysRef.current === 0) clock.start();
      // The step.
      const next = press(cur, k);
      // Kept.
      stRef.current = next;
      setSt(next);
      // Counted.
      const n = keysRef.current + 1;
      keysRef.current = n;
      setKeys(n);
      // A key someone reaches for to get out, that did not get them out.
      if (next.outcome !== "exit" && isTry(k)) setTries((x) => x + 1);
      // Left cleanly.
      if (next.outcome === "exit") {
        // The time.
        const ms = clock.stop();
        // Scored and remembered.
        cleared(ms, n);
      } else if (next.outcome === "fail") {
        // Stopped.
        clock.stop();
        // Announced.
        setSay(t(`fail.${next.term.why || "suspended"}`));
        // One more wrong try.
        setTries((x) => x + 1);
      }
    },
    [clock, cleared, t],
  );

  // The clock, for the programs that print on their own (tail -f, a job in tmux).
  useEffect(() => {
    // Only for those, while running.
    if (st.outcome !== "run" || (st.term.prog !== "tail" && st.term.prog !== "tmux")) return;
    // About once a second.
    const id = window.setInterval(() => {
      // The tick is not a keystroke.
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
    // Tab stays with the browser (no keyboard trap); the on-screen Tab key sends it.
    if (e.key === "Tab" || e.metaKey) return;
    // The named keys.
    const named: Record<string, Key> = { Escape: "Esc", Enter: "Enter", Backspace: "Backspace", ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right" };
    // The key to send.
    let k: Key | null = null;
    // A named key.
    if (named[e.key]) k = named[e.key];
    // Ctrl with a character.
    else if (e.ctrlKey && e.key.length === 1) k = `C-${e.key.toLowerCase()}`;
    // A printable character.
    else if (e.key.length === 1 && !e.altKey) k = e.key;
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

  // The screen to draw: the level's, or, once it is over, what the shell shows after the program.
  const screen = useMemo(() => {
    // Running: the program's screen.
    if (st.outcome === "run") return view(st);
    // Over: the program's last words and a prompt.
    const prompt = st.level === "tmux" ? "you@web01:~$ " : "you@laptop:~$ ";
    // The lines.
    const lines = [...st.term.after, prompt];
    // Padded to the terminal's height.
    while (lines.length < 16) lines.push("");
    // No inverse rows; the cursor after the prompt.
    return { lines: lines.slice(0, 16), cursor: { r: st.term.after.length, c: prompt.length }, inverse: [] as number[] };
  }, [st]);

  // The rules.
  const rules = (
    <>
      <p>{t("rule1")}</p>
      <ul>
        <li>{t("rule2")}</li>
        <li>{t("rule3")}</li>
        <li>{t("rule4")}</li>
      </ul>
    </>
  );

  // Cleared levels.
  const clearedCount = progress ? LEVELS.filter((l) => progress[l.id]).length : 0;

  // The page.
  return (
    <GameShell gameId={GAME_ID} kind="score" today={today} rules={rules} result={result} onPlayAgain={() => begin(levelId)} version={version}>
      {/* The polite line. */}
      <p className="fg-exit-sr" aria-live="polite">{say}</p>
      {/* Before mount: a neutral line, the same as the static HTML. */}
      {!progress ? (
        <p className="fg-muted">{tc("loading")}</p>
      ) : (
        <>
          {/* The levels. */}
          <ol className="fg-exit-levels" aria-label={t("levelsLabel")}>
            {LEVELS.map((l, i) => (
              <li key={l.id}>
                <button
                  type="button"
                  className={`fg-exit-level ${l.id === levelId ? "fg-exit-level-on" : ""} ${progress[l.id] ? "fg-exit-level-done" : ""}`}
                  disabled={!unlocked(i)}
                  aria-current={l.id === levelId ? "step" : undefined}
                  onClick={() => begin(l.id)}
                >
                  <span className="fg-exit-level-n">{i + 1}</span>
                  <span className="fg-exit-level-name">{l.prog}</span>
                  <span className="fg-exit-level-state">{progress[l.id] ? t("levelDone", { score: progress[l.id].score }) : unlocked(i) ? t("levelOpen") : t("levelLocked")}</span>
                </button>
              </li>
            ))}
          </ol>
          {/* The level's brief. */}
          <div className="fg-exit-brief">
            <p className="fg-exit-brief-title">
              {tc("level", { n: index + 1 })}: <span className="fg-mono">{level.prog}</span>
            </p>
            <p className="fg-exit-brief-text">{t(`levels.${level.id}.brief`)}</p>
          </div>
          {/* The readouts. */}
          <div className="fg-hud">
            <span className="fg-readout">{t("keystrokes", { n: keys })}</span>
            <span className="fg-readout">{tc("time")} {formatDuration(clock.elapsed)}</span>
            <span className="fg-readout">{t("clearedCount", { n: clearedCount, total: LEVELS.length })}</span>
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
          {/* Hints, as they are earned or asked for. */}
          {shown > 0 && (
            <ol className="fg-exit-hints">
              {[1, 2, 3].slice(0, shown).map((h) => (
                <li key={h}>{t(`levels.${level.id}.hint${h}`)}</li>
              ))}
            </ol>
          )}
          {/* A level left the wrong way. */}
          {st.outcome === "fail" && (
            <div className="fg-exit-fail" role="status">
              <p>{t(`fail.${st.term.why || "suspended"}`)}</p>
            </div>
          )}
          {/* The level's buttons. */}
          <div className="fg-buttons">
            {st.outcome === "run" && (
              <button type="button" className="fg-button" onClick={() => setAsked((a) => Math.min(3, Math.max(a, earned) + 1))} disabled={shown >= 3}>
                {tc("hint")}
              </button>
            )}
            <button type="button" className={`fg-button ${st.outcome === "fail" ? "fg-button-primary" : ""}`} onClick={() => begin(levelId)}>
              {t("restart")}
            </button>
            {st.outcome === "exit" && index + 1 < LEVELS.length && (
              <button type="button" className="fg-button fg-button-primary" onClick={() => begin(LEVELS[index + 1].id)}>
                {t("nextLevel")}
              </button>
            )}
          </div>
          {last && st.outcome === "exit" && index + 1 >= LEVELS.length && <p className="fg-exit-win">{t("allDone")}</p>}
        </>
      )}
    </GameShell>
  );
}
