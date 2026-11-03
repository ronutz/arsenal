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
//     puzzle; now the page offers today's puzzle instead.
// The game itself is the child: the board, its controls, its own timer.
// Strings come from devFun.games.common; the game passes its own title and rules.
// ============================================================================

"use client";

// React's state and effects.
import { useEffect, useState, type ReactNode } from "react";
// The shell's own strings.
import { useLocale, useTranslations } from "next-intl";
// The countdown to the next UTC day.
import { msToNextDay, puzzleNumber, utcDayKey } from "@/lib/fun/daily";
// The share card, the clipboard and the time format.
import { copyText, formatDuration } from "@/lib/fun/share";
// The record behind the stats line.
import { liveStreak, loadRecord, resetStats, updateRecord, type GameRecord } from "@/lib/fun/storage";

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
  /** Today's UTC day, or null before mount (the shell then shows nothing that depends on it). */
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

  // Watch for the UTC day turning while the page stays open: every 30 seconds and whenever the tab comes back.
  useEffect(() => {
    // Only games with a day of their own, and not the free-play ones.
    if (!props.today || props.kind === "free") return;
    // The day the page is showing.
    const shown = props.today;
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
  }, [props.today, props.kind]);

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

  // Read the record after mount and on every version bump the game makes after recording a result.
  useEffect(() => {
    // Shown in the stats line.
    setRecord(loadRecord(props.gameId));
  }, [props.gameId, props.version]);

  // The countdown ticks once a second while a daily result is shown.
  useEffect(() => {
    // Only for a finished daily puzzle.
    if (props.kind !== "daily" || !props.result) return;
    // One update now.
    setLeft(msToNextDay(new Date()));
    // Then every second.
    const id = window.setInterval(() => setLeft(msToNextDay(new Date())), 1000);
    // Stopped when the result goes away or the page closes.
    return () => window.clearInterval(id);
  }, [props.kind, props.result]);

  // The copy button's feedback fades after two seconds.
  useEffect(() => {
    // Nothing to fade.
    if (copied === "idle") return;
    // Back to idle later.
    const id = window.setTimeout(() => setCopied("idle"), 2000);
    // Cleared if the button is pressed again first.
    return () => window.clearTimeout(id);
  }, [copied]);

  // The streak to show today.
  const streak = record && props.today ? liveStreak(record, props.today) : 0;

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

      {/* The game. */}
      <div className="fg-board-wrap">{props.children}</div>

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
