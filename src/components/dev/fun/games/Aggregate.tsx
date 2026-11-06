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
//
// Review R3 (03/11/2026): the daily challenge counts once a day however often
// it is replayed (a replay used to count again: R3-01); the arrow keys work
// while the board is on screen, not only once it has focus (R3-14); a phone
// shows each tile's last two octets, the /16 being the same for all (R3-15);
// "New round" asks for a second press before it throws a round away (R3-15);
// and the daily challenge shows its number and the streak in the frame (R3-I1).
//
// PRIME 03/11/2026 ("Yes on all your suggested ideas"): free play resumes after
// a reload too, its round kept in the record's extra (extra.free, with the mode
// last played in extra.lastMode), as the daily's round is kept by day; the
// daily's share card gives the day's best and the tries it took ("best of 3
// tries"), with the final board of the round that made that best; and "Outline
// siblings" numbers each pair and gives it its own ring pattern, so two pairs
// side by side are told apart without relying on colour.
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
import { useEarlierDay, useReducedMotion, useToday } from "@/lib/fun/hooks";
// The earlier puzzle in play (?day=), if any.
import { earlierDayInPlay } from "@/lib/fun/archive";
// The share card.
import { shareText } from "@/lib/fun/share";
// The one storage key.
import { loadRecord, recordResult, saveDailyState, updateRecord } from "@/lib/fun/storage";
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

/** How much of the board must be on screen for the arrow keys to move it without focus. */
const KEYS_VISIBLE = 0.5;

/** How long "New round" waits for its second press, in milliseconds. */
const CONFIRM_MS = 4000;

/** The ring pattern of each sibling pair, in turn (the pair's number tells them apart beyond four). */
const PAIR_STYLES = ["fg-agg-pair-a", "fg-agg-pair-b", "fg-agg-pair-c", "fg-agg-pair-d"] as const;

/** What the store keeps for a day: the round in play and the day's best. */
interface SavedDaily {
  /** The current round. */
  game: State;
  /** The day's best score. */
  best: number;
  /** The day's largest block (shortest length). */
  bestLen: number;
  /** Whether the current round's end has been recorded (kept for saves written before "counted"). */
  recorded: boolean;
  /** Whether the day's challenge has been counted (its first finished round); replays never count again. */
  counted?: boolean;
  /** Rounds of the day played so far (a round counts as a try from its first move; absent in older saves). */
  tries?: number;
  /** The board, as share-card rows, of the round with the day's best score, as it ended (or stands, mid-round). */
  bestGrid?: string[];
}

/**
 * The mark of a kept daily state, for days played before the marks existed (GameShell's gradeSaved): a counted challenge, solved at a /24 or better; the state keeps the day's best block, so a /24 reached only in a replay marks the day solved (solved once stays solved).
 *
 * @param _day the challenge's day (the saved state says it all)
 * @param state the kept state
 * @returns 1 solved, 0 counted without a /24, null not counted yet
 */
function gradeSaved(_day: string, state: unknown): 0 | 1 | null {
  // The saved day.
  const s = state as Partial<SavedDaily> | null;
  // Counted ("recorded" in saves written before "counted").
  if (!s || (s.counted ?? s.recorded) !== true || typeof s.bestLen !== "number") return null;
  // A /24 or better.
  return s.bestLen <= 24 ? 1 : 0;
}

/** What the record's extra keeps for free play: the round in play and the mode played last. */
interface FreeExtra {
  /** The free-play round, finished or not. */
  free?: unknown;
  /** The mode played last, so a reload goes back to free play once the day's challenge is counted. */
  lastMode?: unknown;
}

/**
 * Whether a key press belongs to something else on the page: a text field, a menu, a shortcut with a modifier.
 *
 * @param e the key event
 * @returns true when the board should leave it alone
 */
function keyIsElsewhere(e: globalThis.KeyboardEvent): boolean {
  // Already handled (the focused board, or a widget of its own).
  if (e.defaultPrevented) return true;
  // A shortcut, not a move.
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return true;
  // The element the key went to.
  const el = e.target instanceof HTMLElement ? e.target : null;
  // Typing in a field, or inside a dialog or a menu, keeps its arrows.
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !!el.closest('[role="dialog"], [role="menu"], [role="listbox"], dialog'));
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

/**
 * A board as the share card's rows of squares.
 *
 * @param cells the board, row by row
 * @returns SIDE strings of SIDE squares
 */
function gridRows(cells: (Tile | null)[]): string[] {
  // Each row's squares.
  return Array.from({ length: SIDE }, (_, r) => cells.slice(r * SIDE, r * SIDE + SIDE).map(emojiFor).join(""));
}

/**
 * Number the sibling pairs on a board, in reading order: each tile has at most one sibling on it (no two tiles
 * overlap, and a block has one sibling), so the pairs never share a tile.
 *
 * @param cells the board, row by row
 * @returns cell index to pair number (1, 2, ...), for the cells in a pair
 */
function siblingPairs(cells: (Tile | null)[]): Map<number, number> {
  // The numbering.
  const out = new Map<number, number>();
  // Pairs found so far.
  let k = 0;
  // Each cell, in reading order.
  cells.forEach((a, i) => {
    // Empty, or already numbered as the second of a pair.
    if (!a || out.has(i)) return;
    // Its sibling later on the board, if any.
    const j = cells.findIndex((b, jj) => jj > i && b !== null && areSiblings(a, b));
    // None.
    if (j < 0) return;
    // The next number, on both tiles.
    k++;
    out.set(i, k);
    out.set(j, k);
  });
  // The pairs.
  return out;
}

/**
 * Keep the free-play round (and that free play was the mode last played) in the record's extra, merged with the
 * game's other values.
 *
 * @param game the round, finished or not
 */
function saveFree(game: State): void {
  // One read-change-write; the rest of extra stays as it is.
  updateRecord(GAME_ID, (r) => ({ ...r, extra: { ...r.extra, free: game, lastMode: "free" } }));
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
  // The earlier puzzle on the board (?day=), or null: its wording says "this day's" where today's says "today's".
  const earlierDay = useEarlierDay();
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
  // Whether today's challenge has been counted (its first finished round); replays only raise the best score.
  const [dailyCounted, setDailyCounted] = useState(false);
  // Rounds of today's challenge played (a round is a try from its first move), for the share card's "best of".
  const [dayTries, setDayTries] = useState(0);
  // The board, as share-card rows, of today's best round (at its end, or as it stands).
  const [bestGrid, setBestGrid] = useState<string[] | null>(null);
  // "New round" pressed once and waiting for the second press.
  const [armed, setArmed] = useState(false);
  // Whether enough of the board is on screen for the arrow keys to move it without focus.
  const [onScreen, setOnScreen] = useState(false);
  // The board, watched for being on screen.
  const boardRef = useRef<HTMLDivElement>(null);
  // Bumped after each recorded result.
  const [version, setVersion] = useState(0);
  // The polite announcement.
  const [live, setLive] = useState("");
  // Whether sibling pairs on the board are outlined.
  const [pairs, setPairs] = useState(false);
  // Where a swipe started.
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // Once the day is known, the day's round comes back from the store (or starts), and so does free play's.
  useEffect(() => {
    // Not before mount.
    if (!today) return;
    // The stored record.
    const record = loadRecord(GAME_ID);
    // The stored day.
    const saved = record.daily[today] as Partial<SavedDaily> | undefined;
    // Free play's round and the mode played last, from the record's extra.
    const extra = record.extra as FreeExtra;
    // A well-formed free round resumes when free play is chosen (it used to be lost on a reload).
    const keptFree = isState(extra.free) && extra.free.source.kind === "free" ? extra.free : null;
    // Kept for free play.
    if (keptFree) setFree(keptFree);
    // Whether today's challenge has been counted.
    let counted = false;
    // A well-formed round of this very day resumes.
    if (saved && isState(saved.game) && saved.game.source.kind === "daily" && saved.game.source.day === today) {
      // The round.
      setDaily(saved.game);
      // The day's best.
      setDayBest({ score: typeof saved.best === "number" ? saved.best : saved.game.score, len: typeof saved.bestLen === "number" ? saved.bestLen : saved.game.bestLen });
      // Counted already when a round of the day ended before (older saves only knew about the current round).
      counted = saved.counted === true || saved.recorded === true || saved.game.over;
      // Kept.
      setDailyCounted(counted);
      // The tries so far (an older save: one, when a round has moves or the day is counted).
      setDayTries(typeof saved.tries === "number" ? saved.tries : saved.game.moves > 0 || counted ? 1 : 0);
      // The board of the day's best, when it was kept.
      setBestGrid(Array.isArray(saved.bestGrid) && saved.bestGrid.every((row) => typeof row === "string") ? saved.bestGrid : null);
    } else {
      // Otherwise a fresh daily round.
      setDaily(newGame({ kind: "daily", day: today }));
    }
    // Free play reopens where it was left, once today's challenge is counted (until then the page opens on the challenge);
    // an earlier puzzle's page always opens on its challenge, because the address asked for it.
    if (counted && keptFree && !keptFree.over && extra.lastMode === "free" && earlierDayInPlay() === null) setMode("free");
  }, [today]);

  // The round on screen.
  const game = mode === "daily" ? daily : free;
  // The sibling pairs, numbered, when the player asks for them.
  const pairOf = pairs && game ? siblingPairs(game.cells) : new Map<number, number>();

  // Switch mode; free play starts its first round on the first visit, and resumes its round after that.
  const switchMode = (m: "daily" | "free") => {
    // The mode.
    setMode(m);
    // A free round when there is none yet, kept at once.
    if (m === "free" && !free) {
      // New tiles.
      const g = newGame({ kind: "free", seed: freshSeed() });
      // Shown.
      setFree(g);
      // Kept (with free play as the mode played last).
      saveFree(g);
    } else {
      // The mode played last, kept with the game's other values.
      updateRecord(GAME_ID, (r) => ({ ...r, extra: { ...r.extra, lastMode: m } }));
    }
    // A fresh announcement.
    setLive("");
    // A "New round" armed in the other mode does not carry over.
    setArmed(false);
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
      // A round's first move makes it one more try of the day.
      const tries = dayTries + (game.moves === 0 ? 1 : 0);
      // A round at the day's best score (a score never falls within a round, so this follows the best round to its end):
      // its board as it stands now is the one the share card draws.
      const grid = next.score >= dayBest.score ? gridRows(next.cells) : bestGrid;
      // Shown.
      setDaily(next);
      // Kept.
      setDayBest(best);
      setDayTries(tries);
      setBestGrid(grid);
      // Counted from now on once this round ends (or already).
      const counted = dailyCounted || next.over;
      // A round that ends now.
      if (next.over) {
        // The day's first finished round counts, once: played, the win (a /24) and the streak (review R3-01).
        if (!dailyCounted) recordResult(GAME_ID, { dayKey: today, won: next.bestLen <= 24, score: next.score, higherIsBetter: true, daily: true });
        // A replay counts nothing again; it can only raise the best score, as the note under the board says (not an
        // earlier puzzle's replay: earlier puzzles count toward no score).
        else if (earlierDayInPlay() === null) updateRecord(GAME_ID, (r) => ({ ...r, best: r.best === null || next.score > r.best ? next.score : r.best }));
        // Marked.
        setDailyCounted(true);
        // The stats line re-reads.
        setVersion((v) => v + 1);
      }
      // Saved, with the day's count, tries and best board kept even when the round is started again.
      saveDailyState(GAME_ID, today, { game: next, best: best.score, bestLen: best.len, recorded: next.over, counted, tries, bestGrid: grid ?? undefined } satisfies SavedDaily);
    } else {
      // Shown.
      setFree(next);
      // Kept, so a reload resumes it.
      saveFree(next);
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
    // Disarmed.
    setArmed(false);
    // The daily challenge from the start.
    if (mode === "daily") {
      // A fresh round of the same day.
      const g = newGame({ kind: "daily", day: today });
      // Shown.
      setDaily(g);
      // Saved, keeping the day's best, its board, its tries (this round becomes one at its first move) and whether the
      // day has been counted (it stays counted).
      saveDailyState(GAME_ID, today, { game: g, best: dayBest.score, bestLen: dayBest.len, recorded: false, counted: dailyCounted, tries: dayTries, bestGrid: bestGrid ?? undefined } satisfies SavedDaily);
    } else {
      // New tiles.
      const g = newGame({ kind: "free", seed: freshSeed() });
      // Shown.
      setFree(g);
      // Kept, so a reload resumes it.
      saveFree(g);
    }
    // Announced.
    setLive(t("liveNew"));
  };

  // "New round" during a round: a round with moves in it is thrown away only on a second press (review R3-15).
  const onNewRound = () => {
    // Nothing to lose yet, or already armed: start again.
    if (!game || game.moves === 0 || armed) {
      // Started again.
      playAgain();
      // Done.
      return;
    }
    // Armed: the button now says what the next press does.
    setArmed(true);
  };

  // The armed button falls back after a few seconds.
  useEffect(() => {
    // Nothing armed.
    if (!armed) return;
    // Disarmed later.
    const id = window.setTimeout(() => setArmed(false), CONFIRM_MS);
    // Cleared on a press or when the page goes.
    return () => window.clearTimeout(id);
  }, [armed]);

  // Whether the board is on screen: the arrow keys move it without focus only then (review R3-14).
  useEffect(() => {
    // The board.
    const el = boardRef.current;
    // Not drawn yet, or no observer in this browser (the focused board still takes the keys).
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Watched.
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((en) => en.intersectionRatio >= KEYS_VISIBLE)), { threshold: [0, KEYS_VISIBLE, 1] });
    // From now.
    io.observe(el);
    // Stopped when the page goes.
    return () => io.disconnect();
  }, []);

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

  // The latest move function, for the page-wide key listener below.
  const playRef = useRef(play);
  // Kept current on every render.
  playRef.current = play;

  // Arrow keys anywhere on the page while the board is on screen (the focused board handles its own first).
  useEffect(() => {
    // Only while the board is on screen.
    if (!onScreen) return;
    // The listener.
    const onWinKey = (e: globalThis.KeyboardEvent) => {
      // The direction of the key, if it is an arrow.
      const dir = KEYS[e.key];
      // Not an arrow, or meant for something else on the page.
      if (!dir || keyIsElsewhere(e)) return;
      // The page does not scroll.
      e.preventDefault();
      // The move.
      playRef.current(dir);
    };
    // Listening.
    window.addEventListener("keydown", onWinKey);
    // Stopped when the board leaves the screen or the page goes.
    return () => window.removeEventListener("keydown", onWinKey);
  }, [onScreen]);

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
    // Each row's tiles or "empty"; with the outlines on, each paired tile says its pair's number.
    const rows = Array.from({ length: SIDE }, (_, r) =>
      t("describeRow", {
        n: r + 1,
        tiles: game.cells
          .slice(r * SIDE, r * SIDE + SIDE)
          .map((c, k) => {
            // The cell's pair, if outlined.
            const pair = pairOf.get(r * SIDE + k);
            // Empty, a tile, or a tile in a numbered pair.
            return c ? (pair ? t("pairTile", { tile: tileText(c), n: pair }) : tileText(c)) : t("emptyCell");
          })
          .join(", "),
      }),
    );
    // Announced.
    setLive(rows.join(" "));
  };

  // "Outline siblings": on or off, announced (with how many pairs are on the board when it comes on).
  const togglePairs = () => {
    // The new setting.
    const on = !pairs;
    // Set.
    setPairs(on);
    // Said: the pairs found, numbered on their tiles; or that the outlines are off.
    setLive(on ? t("livePairs", { n: game ? siblingPairs(game.cells).size / 2 : 0 }) : t("livePairsOff"));
  };

  // The result, once the round is over (a restored finished daily round shows it again). The daily's card gives the
  // day's best and how many tries it took, with the board of the round that made it; free play's, the round's own.
  const result: ShellResult | null =
    game && game.over && today
      ? {
          won: game.bestLen <= 24,
          headline: t("overHeadline", { len: game.bestLen }),
          detail: t("overDetail", { score: game.score.toLocaleString(locale), moves: game.moves }),
          share: shareText({
            title: mode === "daily" ? `${t("shareName")} #${puzzleNumber(today)}` : `${t("shareName")} (${t("freePlay")})`,
            lines:
              mode === "daily"
                ? [t("shareBestOf", { tries: Math.max(1, dayTries), len: dayBest.len, score: dayBest.score.toLocaleString(locale) }), ...(bestGrid ?? gridRows(game.cells))]
                : [t("shareLine", { len: game.bestLen, score: game.score.toLocaleString(locale) }), ...gridRows(game.cells)],
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
    <GameShell
      gameId={GAME_ID}
      // The daily challenge is a daily puzzle in the frame (its number, the streak); free play keeps the best score (R3-I1).
      kind={mode === "daily" ? "daily" : "score"}
      today={today}
      rules={rules}
      result={result}
      onPlayAgain={playAgain}
      version={version}
      formatBest={(b) => b.toLocaleString(locale)}
      gradeSaved={gradeSaved}
    >
      <div className="fg-agg-wrap">
        {/* Daily challenge or free play. */}
        <div className="fg-buttons" role="group" aria-label={t("modeLabel")}>
          <button type="button" className="fg-button fg-agg-mode" aria-pressed={mode === "daily"} onClick={() => switchMode("daily")}>
            {today ? t("dailyMode", { n: puzzleNumber(today) }) : t("dailyModeName")}
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
            <span className="fg-muted fg-small">{t(earlierDay ? "todayBestEarlier" : "todayBest", { score: dayBest.score.toLocaleString(locale) })}</span>
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
          ref={boardRef}
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
          {(game ? game.cells : Array.from({ length: SIDE * SIDE }, () => null)).map((c, i) => {
            // The tile's sibling pair, when outlined: its number, and the ring pattern that goes with it.
            const pair = pairOf.get(i);
            // The cell.
            return (
              <div key={i} className="fg-agg-cell">
                {c && (
                  <span
                    key={c.id}
                    className={`fg-agg-tile ${lenClass(c.len)}${pair ? ` fg-agg-tile-pair ${PAIR_STYLES[(pair - 1) % PAIR_STYLES.length]}` : ""}${!reduce && game && (game.merged.includes(i) || game.spawnedAt === i) ? " fg-pop" : ""}`}
                  >
                    {/* The pair's number in the corner, the same on both tiles (read out by "Read the board"). */}
                    {pair && (
                      <span className="fg-agg-pair-n" aria-hidden="true">
                        {pair}
                      </span>
                    )}
                    {/* The address: in full on a wide screen; on a phone its last two octets, after the /16 shared by every tile. */}
                    <span className="fg-agg-addr fg-agg-addr-full">{dotted(c.net)}</span>
                    <span className="fg-agg-addr fg-agg-addr-short">…{dotted(c.net).split(".").slice(2).join(".")}</span>
                    <span className="fg-agg-len">/{c.len}</span>
                  </span>
                )}
              </div>
            );
          })}
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
          <button type="button" className="fg-button" aria-pressed={pairs} onClick={togglePairs}>
            {t("showPairs")}
          </button>
          <button type="button" className="fg-button" onClick={describe}>
            {t("describe")}
          </button>
          {/* A new round mid-round: a second press confirms it, so one tap cannot throw a round away. */}
          {game && !game.over && (
            <button type="button" className="fg-button" onClick={onNewRound}>
              {armed ? t("newRoundConfirm") : tc("newRound")}
            </button>
          )}
          {/* Today's challenge again, once a round of it is over (the frame shows the countdown, not "Play again"). */}
          {game && game.over && mode === "daily" && (
            <button type="button" className="fg-button" onClick={playAgain}>
              {t(earlierDay ? "replayDailyEarlier" : "replayDaily")}
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
        {dailyCounted && mode === "daily" && !game?.over && <p className="fg-muted fg-small">{t(earlierDay ? "replayNoteEarlier" : "replayNote")}</p>}
      </div>
    </GameShell>
  );
}
