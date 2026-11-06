// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/GameShell.tsx
// ----------------------------------------------------------------------------
// THE FRAME EVERY /dev/fun GAME SITS IN (PRIME 03/11/2026). One component so
// that each game gets, without writing them again:
//   - the stats line: the daily streak and best streak, or the best score;
//   - "How to play", folded by default, opened on a first visit;
//   - the result panel: a headline, a summary, "Copy result" (the share card,
//     src/lib/fun/share.ts), and either the countdown to the next daily puzzle
//     or "Play again";
//   - "Reset my stats" as a two-step button (no browser dialog); it clears the
//     numbers, not a finished daily puzzle or the game's progress;
//   - a notice when the UTC day turns while the page is open (review R2-05,
//     03/11/2026): the countdown used to wrap round to 23:59:59 over the old
//     puzzle; now the page offers today's puzzle instead;
//   - earlier puzzles (PRIME 05/11/2026): on a game with a daily, "Earlier
//     puzzles (n)" opens the list of every puzzle from #1 to yesterday
//     (EarlierPuzzles.tsx); on an earlier puzzle's page (?day=) a banner says
//     which one it is and that it does not count toward the streak or the
//     stats, the streak still reads the real today, and the countdown and the
//     new-day notice stay off; a day that cannot be played gets one line and
//     today's puzzle, and leaves the address. Days played before the marks
//     existed get theirs once, on mount, from the game's grading of its kept
//     daily states and from its old practice marks (backfillResults);
//   - "Solve the other puzzles" (PRIME 05/11/2026), right after the result:
//     the page renders it (MorePuzzles.tsx) and hands it over through
//     MorePuzzlesProvider, so no game passes it along;
//   - the end-of-round flash (PRIME 06/11/2026: "Flash the board / playing
//     area indicating when the game or puzzle has been solved - green when
//     successfully, red when not"): when a round ends, the playing area
//     flashes green for a win and red otherwise. A round ends when the game
//     records its result, which it signals by bumping version (every game
//     does, once, at the finish); a result shown again from storage, on load
//     or after a change of mode, is not recorded again and does not flash. A
//     game can also ask for a flash without a result (signal: Exit the
//     Editor's wrong way out). With the flash (PRIME 06/11/2026 13:12:
//     "subtly shake the playing area twice. For mobiles, a little haptic
//     feedback as well") the area shakes twice, a few pixels each way, and a
//     phone that lets a page vibrate (Android's browsers; iOS Safari does
//     not) gives a short pattern: two light taps for a win, two longer buzzes
//     otherwise. Reduced motion keeps the ring and drops the shake;
//   - "Where it comes from" (PRIME 06/11/2026 13:01), beside "How to play":
//     a link to the page's own section on the game's roots (GameOrigins).
// The game itself is the child: the board, its controls, its own timer.
// Strings come from devFun.games.common; the game passes its own title and rules.
// ============================================================================

"use client";

// React's state, effects and refs.
import { useEffect, useRef, useState, type ReactNode } from "react";
// The shell's own strings.
import { useLocale, useTranslations } from "next-intl";
// The countdown to the next UTC day.
import { msToNextDay, puzzleNumber, utcDayKey } from "@/lib/fun/daily";
// The share card, the clipboard and the time format.
import { copyText, formatDuration } from "@/lib/fun/share";
// The record behind the stats line.
import { backfillResults, liveStreak, loadRecord, resetStats, updateRecord, type GameRecord, type GradeSaved, type LegacyMarks } from "@/lib/fun/storage";
// The day the address asks for, checked against the clock.
import { useDayRequest } from "@/lib/fun/hooks";
// The earlier days.
import { DAY_PARAM, earlierDays } from "@/lib/fun/archive";
// Which games have a daily.
import { FUN_GAMES } from "@/config/funGames";
// The list, the banner and the refused-day line.
import { EarlierBanner, EarlierList, RefusedNote } from "./EarlierPuzzles";
// The call-out to the other puzzles, handed over by the page.
import { useMorePuzzles } from "../MorePuzzlesSlot";

/** How long the end-of-round flash lasts, in milliseconds (two pulses; the stylesheet's animation runs this long). */
const FLASH_MS = 1400;
/** How long after a recorded result its panel may still arrive and flash (a game may set the two in separate renders). */
const FLASH_WINDOW_MS = 1500;
/** The vibration with the flash, in milliseconds on and off: two light taps for a win, two longer buzzes otherwise. */
const HAPTIC = { won: [25, 70, 25], lost: [70, 60, 70] } as const;

/**
 * A short vibration where the device and the browser allow a page one (navigator.vibrate: Android's browsers; not
 * iOS Safari, where it does not exist); silently nothing elsewhere.
 *
 * @param won whether the round was won
 */
function buzz(won: boolean): void {
  // Only where the call exists.
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  // A browser may refuse it (no user gesture yet, a policy): that is not an error for the game.
  try {
    // The pattern.
    navigator.vibrate([...(won ? HAPTIC.won : HAPTIC.lost)]);
  } catch {
    // Nothing to do.
  }
}

/** A finished round, as the shell shows it. */
export interface ShellResult {
  /** Won (solved) or not. */
  won: boolean;
  /** The headline: "Solved!", "Out of tries", "Score 1,240". */
  headline: string;
  /** One more line under it: the time, the answer, a comment. */
  detail?: string;
  /** The share card's full text (see shareText()). */
  share: string;
}

/** What the shell needs from the game. */
export interface GameShellProps {
  /** The game's stable id, the storage key's sub-key. */
  gameId: string;
  /** "daily" shows the puzzle number, the streak and the countdown; "score" shows the best score; "free" shows played. */
  kind: "daily" | "score" | "free";
  /** The day whose puzzle is on the board (today's, or an earlier one on a ?day= page), or null before mount. */
  today: string | null;
  /** The rules, as a few short paragraphs or list items, shown under "How to play". */
  rules: ReactNode;
  /** The finished round, or null while playing. */
  result: ShellResult | null;
  /** For "score" and "free": start another round. */
  onPlayAgain?: () => void;
  /** How to show the best score (for example as a time, or with a unit). */
  formatBest?: (best: number) => string;
  /** A counter the game bumps after it records a result, so the stats line re-reads storage. */
  version?: number;
  /** The game's grading of a kept daily state, so days finished before the marks existed get theirs (once, on mount). */
  gradeSaved?: GradeSaved;
  /** The marks the game's old practice list left on earlier days, filed as played later (once, on mount). */
  legacyMarks?: (r: GameRecord) => LegacyMarks | null;
  /** A flash the game asks for without a result (a new id each time; won picks green or red). */
  signal?: { id: number; won: boolean } | null;
  /** The board. */
  children: ReactNode;
}

/**
 * The frame around a game: stats, rules, board, result.
 *
 * @param props see GameShellProps
 * @returns the framed game
 */
export default function GameShell(props: GameShellProps) {
  // The shell's strings.
  const t = useTranslations("devFun.games.common");
  // The page's language, for numbers (a pt-BR page writes 12.610, not the browser's 12,610).
  const locale = useLocale();
  // The stored record, read after mount and whenever the game says it changed.
  const [record, setRecord] = useState<GameRecord | null>(null);
  // Whether "How to play" is open.
  const [rulesOpen, setRulesOpen] = useState(false);
  // The copy button's feedback: idle, copied or failed.
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  // The reset button's first press arms it; the second resets.
  const [armed, setArmed] = useState(false);
  // The countdown to the next daily puzzle, in milliseconds.
  const [left, setLeft] = useState<number | null>(null);
  // True once the UTC day has turned since the page worked out "today".
  const [stale, setStale] = useState(false);
  // Whether the list of earlier puzzles is open.
  const [listOpen, setListOpen] = useState(false);
  // The playing area's flash: green for a win, red otherwise, or none.
  const [flash, setFlash] = useState<"won" | "lost" | null>(null);
  // The version last seen, and when it last changed (performance.now()), or null when no recorded result waits.
  const seenVersion = useRef(props.version ?? 0);
  const recordedAt = useRef<number | null>(null);
  // The signal last seen, to flash once per id.
  const lastSignal = useRef<number | null>(null);
  // The timer that ends the flash (kept in a ref: a game that builds a new result object on each render must not
  // cancel it by re-running the effect).
  const flashTimer = useRef<number | null>(null);
  // The real today, the earlier day in play and a refused request, read after mount.
  const dayReq = useDayRequest();
  // Whether this game has a daily puzzle or run (the shelf's list says).
  const hasDaily = FUN_GAMES.some((g) => g.id === props.gameId && g.daily);
  // The page's path, for the list's links (read only once the request is known, so after mount).
  const basePath = dayReq && typeof window !== "undefined" ? window.location.pathname : "";
  // The earlier day on the board, or null.
  const earlier = dayReq?.earlier ?? null;
  // Bumped once when the marks of older days were filled in, so the record is read again.
  const [filled, setFilled] = useState(0);
  // "Solve the other puzzles", when the page gave one.
  const more = useMorePuzzles();

  // Watch for the UTC day turning while the page stays open: every 30 seconds and whenever the tab comes back.
  useEffect(() => {
    // Only games with a day of their own, not the free-play ones, and not on an earlier puzzle's page.
    if (!props.today || props.kind === "free" || !dayReq || dayReq.earlier) return;
    // The real today the page worked out.
    const shown = dayReq.today;
    // Compare it with the clock.
    const check = () => setStale(utcDayKey(new Date()) !== shown);
    // Once now.
    check();
    // Then on a slow tick.
    const id = window.setInterval(check, 30000);
    // And when the tab is shown again (a phone that slept overnight).
    const onVis = () => {
      // Only when visible.
      if (document.visibilityState === "visible") check();
    };
    // Subscribed.
    document.addEventListener("visibilitychange", onVis);
    // Unsubscribed on unmount or a new day.
    return () => {
      // The tick.
      window.clearInterval(id);
      // The listener.
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [props.today, props.kind, dayReq]);

  // A day that cannot be played leaves the address (its line stays on screen), so a reload or a copied link is today's.
  useEffect(() => {
    // Only after a refused request.
    if (!dayReq?.refused) return;
    // The address without ?day=, the rest kept.
    const url = new URL(window.location.href);
    // The parameter removed.
    url.searchParams.delete(DAY_PARAM);
    // Replaced in place: no new history entry.
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [dayReq]);

  // On mount: a first visit sees the rules open.
  useEffect(() => {
    // Open on the very first visit only: the record notes that the rules were shown (an idle game can take an hour to
    // finish its first round, and its rules used to open on every visit until then; review R3-13).
    if (loadRecord(props.gameId).extra.rulesShown !== true) {
      // Shown now.
      setRulesOpen(true);
      // Remembered with the game's other values.
      updateRecord(props.gameId, (r) => ({ ...r, extra: { ...r.extra, rulesShown: true } }));
    }
  }, [props.gameId]);

  // Once after mount, on a game with a daily: the marks of days finished before the marks existed (the grading and
  // the old practice marks are read once; the game's functions may change identity on every render).
  useEffect(() => {
    // Not before the address is read, and only on a game with a daily and something to read.
    if (!dayReq || !hasDaily || (!props.gradeSaved && !props.legacyMarks)) return;
    // Filled in: read the record again.
    if (backfillResults(props.gameId, props.gradeSaved, props.legacyMarks)) setFilled((n) => n + 1);
    // Once per game and page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayReq, hasDaily, props.gameId]);

  // Read the record after mount, on every version bump the game makes after recording a result, and after the fill-in.
  useEffect(() => {
    // Shown in the stats line.
    setRecord(loadRecord(props.gameId));
  }, [props.gameId, props.version, filled]);

  // The countdown ticks once a second while a daily result is shown.
  useEffect(() => {
    // Only for a finished daily puzzle, and not on an earlier puzzle's page (the next one is already out).
    if (props.kind !== "daily" || !props.result || !dayReq || dayReq.earlier) return;
    // One update now.
    setLeft(msToNextDay(new Date()));
    // Then every second.
    const id = window.setInterval(() => setLeft(msToNextDay(new Date())), 1000);
    // Stopped when the result goes away or the page closes.
    return () => window.clearInterval(id);
  }, [props.kind, props.result, dayReq]);

  // The copy button's feedback fades after two seconds.
  useEffect(() => {
    // Nothing to fade.
    if (copied === "idle") return;
    // Back to idle later.
    const id = window.setTimeout(() => setCopied("idle"), 2000);
    // Cleared if the button is pressed again first.
    return () => window.clearTimeout(id);
  }, [copied]);

  // The streak to show: always against the real today, on an earlier puzzle's page too.
  const streak = record && dayReq ? liveStreak(record, dayReq.today) : 0;
  // How many earlier puzzles there are (yesterday back to #1).
  const earlierCount = dayReq && hasDaily ? earlierDays(dayReq.today).length : 0;

  // Flash the playing area for a while: green for a win, red otherwise.
  const flashFor = (won: boolean) => {
    // A flash already running is replaced.
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    // The colour.
    setFlash(won ? "won" : "lost");
    // The phone's vibration, where there is one.
    buzz(won);
    // Gone again once the animation has run.
    flashTimer.current = window.setTimeout(() => {
      // Off.
      setFlash(null);
      // No timer left.
      flashTimer.current = null;
    }, FLASH_MS);
  };

  // The flash's timer is cleared when the shell goes.
  useEffect(
    () => () => {
      // A flash still running.
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  // A round that ends now flashes the playing area: the game has just recorded a result (version moved) and its panel
  // is there, in the same render or one soon after. Green for a win, red otherwise.
  useEffect(() => {
    // The version now.
    const v = props.version ?? 0;
    // A new recorded result: remembered with the time, waiting for its panel.
    if (v !== seenVersion.current) {
      // Seen.
      seenVersion.current = v;
      // Waiting.
      recordedAt.current = performance.now();
    }
    // No recorded result waiting, or no panel yet.
    if (recordedAt.current === null || !props.result) return;
    // Too late: a panel that arrives long after a record is not this round's end.
    const fresh = performance.now() - recordedAt.current <= FLASH_WINDOW_MS;
    // Used either way.
    recordedAt.current = null;
    // Flashed.
    if (fresh) flashFor(props.result.won);
    // flashFor only sets state and a timer; the effect follows the version and the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.version, props.result]);

  // A flash the game asks for (a new signal id), on the same terms.
  useEffect(() => {
    // The signal.
    const sig = props.signal;
    // None, or one already flashed.
    if (!sig || sig.id === lastSignal.current) return;
    // Remembered.
    lastSignal.current = sig.id;
    // Flashed.
    flashFor(sig.won);
    // flashFor only sets state and a timer; the effect follows the signal alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.signal]);

  // Copy the share card.
  const onCopy = async () => {
    // Nothing to copy without a result.
    if (!props.result) return;
    // The copy, and its outcome.
    setCopied((await copyText(props.result.share)) ? "ok" : "fail");
  };

  // The two-step reset.
  const onReset = () => {
    // The first press only arms it.
    if (!armed) {
      // Armed.
      setArmed(true);
      // Disarmed again after four seconds.
      window.setTimeout(() => setArmed(false), 4000);
      // Wait for the second press.
      return;
    }
    // The second press clears this game's numbers (a finished daily puzzle and the game's progress stay).
    resetStats(props.gameId);
    // The stats line shows a fresh record.
    setRecord(loadRecord(props.gameId));
    // Disarmed.
    setArmed(false);
  };

  // The frame.
  return (
    <div className="fg-shell">
      {/* An earlier puzzle: which one, and what it does not count toward. */}
      {dayReq && earlier && <EarlierBanner day={earlier} today={dayReq.today} basePath={basePath} />}
      {/* A day that cannot be played: why, and today's puzzle below. */}
      {dayReq?.refused && <RefusedNote reason={dayReq.refused} />}
      {/* The stats line: what this browser remembers about this game. */}
      <div className="fg-stats" aria-live="polite">
        {props.kind === "daily" && props.today && (
          <span className="fg-chip fg-chip-strong">{t("puzzleNo", { n: puzzleNumber(props.today) })}</span>
        )}
        {props.kind === "daily" && (
          <>
            <span className="fg-chip">{t("streak", { n: streak })}</span>
            <span className="fg-chip">{t("bestStreak", { n: record?.bestStreak ?? 0 })}</span>
          </>
        )}
        {/* The best score: always on a score game; on a daily game when it keeps one (a best time) and has a format. */}
        {(props.kind === "score" || (props.kind === "daily" && props.formatBest && record?.best !== null && record?.best !== undefined)) && (
          <span className="fg-chip">
            {t("best")}: {record?.best === null || record?.best === undefined ? "-" : props.formatBest ? props.formatBest(record.best) : record.best.toLocaleString(locale)}
          </span>
        )}
        {/* Played: daily puzzles on a daily game (practice does not inflate it), every round elsewhere. */}
        <span className="fg-chip">{t("played", { n: (props.kind === "daily" ? record?.dailyPlayed : record?.played) ?? 0 })}</span>
        <button type="button" className="fg-link-button" aria-expanded={rulesOpen} onClick={() => setRulesOpen((o) => !o)}>
          {t("howToPlay")}
        </button>
        {/* Where the game comes from: the page's section at its foot (GameOrigins), so the board stays at the top. */}
        <a className="fg-link-button" href="#fg-origins">
          {t("originsLink")}
        </a>
        {/* The earlier puzzles, on a game with a daily, once there is at least one. */}
        {earlierCount > 0 && (
          <button type="button" className="fg-link-button" aria-expanded={listOpen} aria-controls="fg-earlier-list" onClick={() => setListOpen((o) => !o)}>
            {t("earlierPuzzles", { n: earlierCount })}
          </button>
        )}
      </div>

      {/* The day turned while the page was open: today's puzzle is one reload away. */}
      {stale && (
        <div className="fg-newday" role="status">
          <span>{t("newDay")}</span>
          <button type="button" className="fg-button fg-button-primary" onClick={() => window.location.reload()}>
            {t("loadNewDay")}
          </button>
        </div>
      )}

      {/* The rules, folded unless this is a first visit or the player opened them. */}
      {rulesOpen && <div className="fg-rules">{props.rules}</div>}

      {/* The earlier puzzles, once opened. */}
      {listOpen && dayReq && record && (
        <EarlierList today={dayReq.today} current={earlier} basePath={basePath} results={record.results} earlierResults={record.earlierResults} />
      )}

      {/* The game: the playing area, which flashes at the end of a round. */}
      <div className={`fg-board-wrap${flash ? ` fg-flash-${flash}` : ""}`}>{props.children}</div>

      {/* The result, once the round is over. */}
      {props.result && (
        <div className={`fg-result ${props.result.won ? "fg-result-won" : "fg-result-lost"}`} role="status">
          <p className="fg-result-headline">{props.result.headline}</p>
          {props.result.detail && <p className="fg-result-detail">{props.result.detail}</p>}
          <div className="fg-result-actions">
            <button type="button" className="fg-button fg-button-primary" onClick={onCopy}>
              {copied === "ok" ? t("copied") : copied === "fail" ? t("copyFailed") : t("copyResult")}
            </button>
            {props.kind !== "daily" && props.onPlayAgain && (
              <button type="button" className="fg-button" onClick={props.onPlayAgain}>
                {t("playAgain")}
              </button>
            )}
          </div>
          {props.kind === "daily" && left !== null && !stale && <p className="fg-result-next">{t("nextIn", { time: formatDuration(left) })}</p>}
        </div>
      )}

      {/* The other puzzles, right after the result (and after the board while there is none). */}
      {more}

      {/* The way out of the stats this browser keeps. */}
      <div className="fg-footer">
        <button type="button" className="fg-link-button fg-muted" onClick={onReset}>
          {armed ? t("resetConfirm") : t("resetStats")}
        </button>
        <span className="fg-muted fg-small">{t("storedHere")}</span>
      </div>
    </div>
  );
}
