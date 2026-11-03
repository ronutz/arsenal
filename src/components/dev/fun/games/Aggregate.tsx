// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/Aggregate.tsx
// ----------------------------------------------------------------------------
// AGGREGATE, the board (PRIME 03/11/2026). A 4x4 board of IPv4 prefixes that
// slide together with the arrow keys, a swipe or the on-screen arrows; two
// tiles merge only when they are siblings. A daily challenge (the same tiles
// for everyone who plays the same moves that UTC day, replayable, best score
// kept) and endless free play.
//
// The rules live in src/lib/fun/games/aggregate/engine.ts; this file reads
// input, draws the board, announces each move and keeps the day's round in
// the shared store (src/lib/fun/storage.ts), so a reload resumes it.
// ============================================================================

"use client";

// React's state, effects and refs.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
// The strings.
import { useTranslations } from "next-intl";
// Locale-aware links inside the site.
import { Link } from "@/i18n/navigation";
// The frame: stats, rules, result.
import GameShell, { type ShellResult } from "./GameShell";
// The puzzle number of a day.
import { puzzleNumber } from "@/lib/fun/daily";
// Today's UTC day and the reduced-motion preference.
import { useReducedMotion, useToday } from "@/lib/fun/hooks";
// The share card.
import { shareText } from "@/lib/fun/share";
// The one storage key.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The rules.
import { GAME_ID, SIDE, areSiblings, dotted, isState, move, newGame, tileText, type Dir, type State, type Tile } from "@/lib/fun/games/aggregate/engine";

/** The page slug, for the share card's address. */
const SLUG = "aggregate";

/** The goals marked in the head-up display. */
const GOALS = [24, 23, 22] as const;

/** Keys that move, and their directions. */
const KEYS: Record<string, Dir> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };

/** How far a finger must travel to count as a swipe, in CSS pixels. */
const SWIPE_MIN = 24;

/** What the store keeps for a day: the round in play and the day's best. */
interface SavedDaily {
  /** The current round. */
  game: State;
  /** The day's best score. */
  best: number;
  /** The day's largest block (shortest length). */
  bestLen: number;
  /** Whether the current round's end has been recorded. */
  recorded: boolean;
}

/**
 * The share card's square for a tile size: blue for the smallest, purple for /22 and larger.
 *
 * @param t a tile or an empty cell
 * @returns one emoji
 */
function emojiFor(t: Tile | null): string {
  // An empty cell.
  if (!t) return "⬜";
  // From /27 up to /22 and beyond.
  return t.len >= 27 ? "🟦" : t.len === 26 ? "🟩" : t.len === 25 ? "🟨" : t.len === 24 ? "🟧" : t.len === 23 ? "🟥" : "🟪";
}

/**
 * The colour class of a tile's length (lengths shorter than /21 share the /21 colour).
 *
 * @param len the prefix length
 * @returns the class
 */
function lenClass(len: number): string {
  // Clamped to the defined classes.
  return `fg-agg-l${Math.max(21, Math.min(27, len))}`;
}

/**
 * A random 32-bit seed from the browser's generator, for a free-play round.
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

/** An arrow for the on-screen buttons, drawn in the current colour. */
function Arrow({ dir }: { dir: Dir }) {
  // The rotation of an arrow that points up.
  const turn = dir === "up" ? 0 : dir === "right" ? 90 : dir === "down" ? 180 : 270;
  // The drawing, decorative (the button has a label).
  return (
    <svg className="fg-agg-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" transform={`rotate(${turn} 12 12)`} />
    </svg>
  );
}

/**
 * The game: mode switch, head-up display, board, controls.
 *
 * @param props the page locale
 * @returns the game in its shell
 */
export default function Aggregate({ locale }: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.aggregate");
  // The shell's shared strings.
  const tc = useTranslations("devFun.games.common");
  // Today's UTC day, null until mount.
  const today = useToday();
  // Whether to skip the landing pulses.
  const reduce = useReducedMotion();
  // Daily challenge or free play.
  const [mode, setMode] = useState<"daily" | "free">("daily");
  // The daily round, null until read.
  const [daily, setDaily] = useState<State | null>(null);
  // The free-play round, null until the first visit to free play.
  const [free, setFree] = useState<State | null>(null);
  // The day's best score and largest block.
  const [dayBest, setDayBest] = useState<{ score: number; len: number }>({ score: 0, len: 27 });
  // Whether the daily round's end is already recorded (a restored finished round is not counted twice).
  const [dailyRecorded, setDailyRecorded] = useState(false);
  // Bumped after each recorded result.
  const [version, setVersion] = useState(0);
  // The polite announcement.
  const [live, setLive] = useState("");
  // Whether sibling pairs on the board are outlined.
  const [pairs, setPairs] = useState(false);
  // Where a swipe started.
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // Once the day is known, the day's round comes back from the store (or starts).
  useEffect(() => {
    // Not before mount.
    if (!today) return;
    // The stored day.
    const saved = loadRecord(GAME_ID).daily[today] as Partial<SavedDaily> | undefined;
    // A well-formed round of this very day resumes.
    if (saved && isState(saved.game) && saved.game.source.kind === "daily" && saved.game.source.day === today) {
      // The round.
      setDaily(saved.game);
      // The day's best.
      setDayBest({ score: typeof saved.best === "number" ? saved.best : saved.game.score, len: typeof saved.bestLen === "number" ? saved.bestLen : saved.game.bestLen });
      // Recorded already when it ended before.
      setDailyRecorded(saved.recorded === true || saved.game.over);
      // Resumed.
      return;
    }
    // Otherwise a fresh daily round.
    setDaily(newGame({ kind: "daily", day: today }));
  }, [today]);

  // The round on screen.
  const game = mode === "daily" ? daily : free;

  // Switch mode; free play starts its first round on the first visit.
  const switchMode = (m: "daily" | "free") => {
    // The mode.
    setMode(m);
    // A free round when there is none yet.
    if (m === "free" && !free) setFree(newGame({ kind: "free", seed: freshSeed() }));
    // A fresh announcement.
    setLive("");
  };

  // Play a move on the round on screen.
  const play = (dir: Dir) => {
    // Nothing to move, or the round is over, or the day is not known yet.
    if (!game || game.over || !today) return;
    // The move.
    const r = move(game, dir);
    // A move that changes nothing is announced and costs nothing.
    if (!r.changed) {
      // Said so.
      setLive(t("liveNoChange"));
      // Nothing else.
      return;
    }
    // The new round state.
    const next = r.state;
    // What happened, in words.
    const parts: string[] = r.merges.map((m) => t("liveMerge", { a: tileText(m.from[0]), b: tileText(m.from[1]), to: tileText(m.to), gain: (2 ** (32 - m.to.len)).toLocaleString(locale) }));
    // A goal reached on this move.
    if (next.bestLen < game.bestLen && next.bestLen <= 24) parts.push(t("liveGoal", { len: next.bestLen }));
    // The new tile.
    if (r.spawn) parts.push(t("liveSpawn", { tile: tileText(r.spawn) }));
    // The end.
    if (next.over) parts.push(t("liveOver", { score: next.score.toLocaleString(locale) }));
    // Announced.
    setLive(parts.join(" "));
    // The daily round is saved after every move.
    if (mode === "daily") {
      // The day's best so far.
      const best = { score: Math.max(dayBest.score, next.score), len: Math.min(dayBest.len, next.bestLen) };
      // Shown.
      setDaily(next);
      // Kept.
      setDayBest(best);
      // Recorded when it ends.
      if (next.over) {
        // Counted once, as the day's challenge; a /24 is the win.
        recordResult(GAME_ID, { dayKey: today, won: next.bestLen <= 24, score: next.score, higherIsBetter: true, daily: true });
        // Marked.
        setDailyRecorded(true);
        // The stats line re-reads.
        setVersion((v) => v + 1);
      }
      // Saved.
      saveDailyState(GAME_ID, today, { game: next, best: best.score, bestLen: best.len, recorded: next.over } satisfies SavedDaily);
    } else {
      // Shown.
      setFree(next);
      // Recorded when it ends.
      if (next.over) {
        // A free round.
        recordResult(GAME_ID, { dayKey: today, won: next.bestLen <= 24, score: next.score, higherIsBetter: true });
        // The stats line re-reads.
        setVersion((v) => v + 1);
      }
    }
  };

  // Start the round on screen again: the daily replays the same tiles, free play gets new ones.
  const playAgain = () => {
    // Needs the day.
    if (!today) return;
    // The daily challenge from the start.
    if (mode === "daily") {
      // A fresh round of the same day.
      const g = newGame({ kind: "daily", day: today });
      // Shown.
      setDaily(g);
      // Not recorded yet.
      setDailyRecorded(false);
      // Saved, keeping the day's best.
      saveDailyState(GAME_ID, today, { game: g, best: dayBest.score, bestLen: dayBest.len, recorded: false } satisfies SavedDaily);
    } else {
      // New tiles.
      setFree(newGame({ kind: "free", seed: freshSeed() }));
    }
    // Announced.
    setLive(t("liveNew"));
  };

  // Arrow keys on the focused board.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // The direction of the key, if it is an arrow.
    const dir = KEYS[e.key];
    // Other keys do what they always do.
    if (!dir) return;
    // The page does not scroll.
    e.preventDefault();
    // The move.
    play(dir);
  };

  // A swipe starts.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    // Where.
    swipe.current = { x: e.clientX, y: e.clientY };
  };

  // A swipe ends: the longer axis gives the direction.
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    // Where it started.
    const s = swipe.current;
    // Forgotten.
    swipe.current = null;
    // No start, no swipe.
    if (!s) return;
    // The travel.
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    // Too short: a tap.
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    // The dominant axis.
    play(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  // Read the board aloud, row by row.
  const describe = () => {
    // Nothing yet.
    if (!game) return;
    // Each row's tiles or "empty".
    const rows = Array.from({ length: SIDE }, (_, r) =>
      t("describeRow", { n: r + 1, tiles: game.cells.slice(r * SIDE, r * SIDE + SIDE).map((c) => (c ? tileText(c) : t("emptyCell"))).join(", ") }),
    );
    // Announced.
    setLive(rows.join(" "));
  };

  // Cells whose tile has its sibling on the board (outlined when the player asks).
  const paired = new Set<number>();
  // Only when asked and with a board.
  if (pairs && game) {
    // Every pair of cells.
    game.cells.forEach((a, i) => {
      // Empty cells have no sibling.
      if (!a) return;
      // A sibling anywhere on the board.
      if (game.cells.some((b) => b && b.id !== a.id && areSiblings(a, b))) paired.add(i);
    });
  }

  // The result, once the round is over (a restored finished daily round shows it again).
  const result: ShellResult | null =
    game && game.over && today
      ? {
          won: game.bestLen <= 24,
          headline: t("overHeadline", { len: game.bestLen }),
          detail: t("overDetail", { score: game.score.toLocaleString(locale), moves: game.moves }),
          share: shareText({
            title: mode === "daily" ? `${t("shareName")} #${puzzleNumber(today)}` : `${t("shareName")} (${t("freePlay")})`,
            lines: [
              t("shareLine", { len: game.bestLen, score: game.score.toLocaleString(locale) }),
              ...Array.from({ length: SIDE }, (_, r) => game.cells.slice(r * SIDE, r * SIDE + SIDE).map(emojiFor).join("")),
            ],
            locale,
            slug: SLUG,
          }),
        }
      : null;

  // The rules.
  const rules = (
    <ol className="fg-agg-rules-list">
      <li>{t("rule1")}</li>
      <li>{t("rule2")}</li>
      <li>{t("rule3")}</li>
      <li>{t("rule4")}</li>
      <li>{t("rule5")}</li>
    </ol>
  );

  // The game in its shell.
  return (
    <GameShell gameId={GAME_ID} kind="score" today={today} rules={rules} result={result} onPlayAgain={playAgain} version={version} formatBest={(b) => b.toLocaleString(locale)}>
      <div className="fg-agg-wrap">
        {/* Daily challenge or free play. */}
        <div className="fg-buttons" role="group" aria-label={t("modeLabel")}>
          <button type="button" className="fg-button fg-agg-mode" aria-pressed={mode === "daily"} onClick={() => switchMode("daily")}>
            {tc("daily")}
            {today ? ` #${puzzleNumber(today)}` : ""}
          </button>
          <button type="button" className="fg-button fg-agg-mode" aria-pressed={mode === "free"} onClick={() => switchMode("free")}>
            {t("freePlay")}
          </button>
        </div>

        {/* The head-up display: score, largest block, the /16, the goals. */}
        <div className="fg-hud">
          <span>
            <span className="fg-muted fg-small">{tc("score")} </span>
            <span className="fg-readout">{game ? game.score.toLocaleString(locale) : "-"}</span>
          </span>
          <span>
            <span className="fg-muted fg-small">{t("largest")} </span>
            <span className="fg-readout">{game ? `/${game.bestLen}` : "-"}</span>
          </span>
          {mode === "daily" && (
            <span className="fg-muted fg-small">{t("todayBest", { score: dayBest.score.toLocaleString(locale) })}</span>
          )}
        </div>
        <div className="fg-agg-goals">
          <span className="fg-muted fg-small fg-mono">{game ? t("inside", { base: `${dotted(game.base)}/16` }) : tc("loading")}</span>
          {GOALS.map((g) => {
            // Reached in this round.
            const hit = !!game && game.bestLen <= g;
            // The goal chip.
            return (
              <span key={g} className={`fg-chip fg-agg-goal${hit ? " fg-agg-goal-hit" : ""}`}>
                {hit ? t("goalHit", { len: g }) : t("goalOpen", { len: g })}
              </span>
            );
          })}
        </div>

        {/* The board: focus it and use the arrow keys, or swipe on it. */}
        <div
          className="fg-agg-board"
          tabIndex={0}
          role="application"
          aria-label={t("boardLabel")}
          aria-describedby="agg-help"
          onKeyDown={onKey}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current = null)}
        >
          {(game ? game.cells : Array.from({ length: SIDE * SIDE }, () => null)).map((c, i) => (
            <div key={i} className="fg-agg-cell">
              {c && (
                <span
                  key={c.id}
                  className={`fg-agg-tile ${lenClass(c.len)}${paired.has(i) ? " fg-agg-tile-pair" : ""}${!reduce && game && (game.merged.includes(i) || game.spawnedAt === i) ? " fg-pop" : ""}`}
                >
                  <span className="fg-agg-addr">{dotted(c.net)}</span>
                  <span className="fg-agg-len">/{c.len}</span>
                </span>
              )}
            </div>
          ))}
        </div>
        <p id="agg-help" className="fg-muted fg-small fg-agg-help">
          {t("boardHelp")}
        </p>

        {/* The on-screen arrows, in a cross. */}
        <div className="fg-agg-pad" role="group" aria-label={t("padLabel")}>
          {(["up", "left", "down", "right"] as Dir[]).map((d) => (
            <button key={d} type="button" className={`fg-button fg-agg-pad-${d}`} aria-label={t(`slide_${d}`)} onClick={() => play(d)} disabled={!game || game.over}>
              <Arrow dir={d} />
            </button>
          ))}
        </div>

        {/* Helpers: outline the siblings, read the board aloud, start again. */}
        <div className="fg-buttons">
          <button type="button" className="fg-button" aria-pressed={pairs} onClick={() => setPairs((p) => !p)}>
            {t("showPairs")}
          </button>
          <button type="button" className="fg-button" onClick={describe}>
            {t("describe")}
          </button>
          {game && !game.over && (
            <button type="button" className="fg-button" onClick={playAgain}>
              {tc("newRound")}
            </button>
          )}
        </div>
        <p className="fg-agg-live" aria-live="polite">
          {live}
        </p>
        <p className="fg-muted fg-small fg-agg-learn">
          {t("learnLead")} <Link href="/learn/supernetting-and-aggregation">{t("learnLink")}</Link> ·{" "}
          <Link href="/learn/route-summarization">{t("learnLink2")}</Link>
        </p>
        {dailyRecorded && mode === "daily" && !game?.over && <p className="fg-muted fg-small">{t("replayNote")}</p>}
      </div>
    </GameShell>
  );
}
