// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/TodaysBoard.tsx
// ----------------------------------------------------------------------------
// "TODAY'S BOARD" (PRIME's decisions of 08/11/2026), under the result of a
// finished daily puzzle of today. GameShell places it right after the result
// panel, as it places "Solve the other puzzles", so every daily game has it
// without a line of its own (Spanning Tree only says which level is on
// screen). It shows:
//   - how many played today's puzzle, the share who solved it, the average
//     and the median score or time;
//   - where this round sits ("faster than 72% of today's other players"),
//     from the board's own answer when the round was posted, in a polite live
//     region;
//   - the top ten with initials and a flag (the country's code beside it for
//     screen readers);
//   - the initials field and Post (a round not on the board yet: sharing was
//     off, or the board was down) or Update (change the initials of the round
//     posted today), and a link to the scores page.
// Loading, empty ("you are the first today") and unavailable states each get
// one quiet line; a board that is down never gets in the game's way.
// ============================================================================

"use client";

// React's state, effects, refs and ids.
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
// The shell's strings and the page's language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links inside the site.
import { Link } from "@/i18n/navigation";
// The board's rules: the game's unit and whether its rounds are re-checked; the initials rule.
import { boardGame, initialsProblem, NO_INITIALS } from "@/lib/fun/board-rules";
// The board, browser side.
import {
  beatPercent,
  changeInitials,
  fetchBoard,
  formatScore,
  postRound,
  postedRound,
  refreshPlace,
  rememberedInitials,
  retryPending,
  shareOn,
  subscribeBoard,
  type BoardAnswer,
} from "@/lib/fun/board";
// What this browser sent for a round.
import type { PostedRound } from "@/lib/fun/storage";
// The same-origin SVG flag for a country code (never an emoji flag, which Windows draws as two letters).
import { flagFileFor } from "@/lib/flags";
// The games' time format (m:ss), for the time that breaks ties.
import { formatDuration } from "@/lib/fun/share";

/** The board's state on screen. */
type Shown = { kind: "loading" } | { kind: "unavailable" } | { kind: "board"; board: BoardAnswer };

/**
 * A country, as a flag with its code for screen readers (nothing drawn when the country is unknown).
 *
 * The flag is the vendored SVG file, never an emoji: Windows desktops have no glyphs for regional indicator flags
 * and showed the two letters instead (PRIME 10/11/2026 23:50, "use an alternative that ALWAYS renders on ANY
 * regular browser (desktop, mobile)").
 *
 * @param props the two-letter code, or null
 * @returns the flag
 */
export function CountryFlag({ code }: { code: string | null }) {
  // No country: nothing drawn.
  if (!code) return null;
  // The same-origin SVG for the code, or null for an unknown one.
  const src = flagFileFor(code);
  // The flag for the eye (decorative, so an empty alt), the code for the ear.
  return (
    <span className="fg-tb-flag">
      {src ? <img className="fg-tb-flag-img" src={src} alt="" width={20} height={15} loading="lazy" decoding="async" /> : null}
      <span className="fg-lpk-sr">{code}</span>
    </span>
  );
}

/**
 * Today's board for one game and mode.
 *
 * @param props the game, the board mode, and the day (today's)
 * @returns the board
 */
export default function TodaysBoard(props: { gameId: string; mode: string; day: string }) {
  // The shell's strings (the board's live under "board").
  const t = useTranslations("devFun.games.common");
  // The page's language, for numbers.
  const locale = useLocale();
  // The game's board rules.
  const rules = boardGame(props.gameId);
  // The board as last read.
  const [shown, setShown] = useState<Shown>({ kind: "loading" });
  // What this browser sent for the round, and the switch (read after mount).
  const [posted, setPosted] = useState<PostedRound | null>(null);
  const [sharing, setSharing] = useState(true);
  // The initials field.
  const [initials, setInitials] = useState("");
  // Whether a request is on its way, and the line that says how the last one went.
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Settled a moment after mount: a round finished just now is sent a moment after its result appears, so "not on the
  // board yet" waits rather than flashing up before the send starts.
  const [settled, setSettled] = useState(false);
  // The moment.
  useEffect(() => {
    // A second and a half.
    const id = window.setTimeout(() => setSettled(true), 1500);
    // Cleared on unmount.
    return () => window.clearTimeout(id);
  }, []);
  // The ids that tie the field to its label and its help.
  const fieldId = useId();
  const helpId = useId();
  const titleId = useId();

  // Read the board again.
  const reload = useCallback(async () => {
    // The answer, or unavailable.
    const b = await fetchBoard(props.gameId, props.mode, props.day);
    // Shown.
    setShown(b ? { kind: "board", board: b } : { kind: "unavailable" });
  }, [props.gameId, props.mode, props.day]);

  // After mount: the sent round, the switch, the remembered initials; a round left pending is tried again; the board
  // is read. Every later change on the page (the round posted a moment after the result appeared, the switch moved)
  // is followed, and a newly posted round reads the board again.
  useEffect(() => {
    // The round as sent so far.
    const first = postedRound(props.gameId, props.mode, props.day);
    // Shown.
    setPosted(first);
    setSharing(shareOn());
    // The field starts with the round's initials, or the remembered ones.
    setInitials(first?.initials && first.initials !== NO_INITIALS ? first.initials : rememberedInitials() ?? "");
    // A pending round, tried again once; a posted one has its place read again (more may have played since).
    if (first?.status === "posted") void refreshPlace(props.gameId, props.mode, props.day);
    else retryPending(props.gameId, props.mode, props.day);
    // The board.
    void reload();
    // The status last seen, to read the board again when the round becomes posted.
    let lastStatus = first?.status ?? null;
    // Followed.
    return subscribeBoard(() => {
      // The round now.
      const now = postedRound(props.gameId, props.mode, props.day);
      // Shown.
      setPosted(now);
      setSharing(shareOn());
      // Newly on the board: its row is in the board now.
      if (now?.status === "posted" && lastStatus !== "posted") void reload();
      // Remembered.
      lastStatus = now?.status ?? null;
    });
  }, [props.gameId, props.mode, props.day, reload]);

  // Post the round, or change its initials.
  const onSubmit = async (e: FormEvent) => {
    // No page reload.
    e.preventDefault();
    // One request at a time.
    if (busy) return;
    // The typed initials, cleaned; empty means none (???), which only a new post allows.
    const v = initials.trim().toUpperCase();
    // A problem with what was typed.
    const problem = v === "" ? (posted?.status === "posted" ? "format" : null) : initialsProblem(v);
    // Said, and nothing sent.
    if (problem) {
      // The reason.
      setNote(problem === "blocked" ? t("board.initialsRefused") : t("board.initialsFormat"));
      // Stop.
      return;
    }
    // Sending.
    setBusy(true);
    // No old line.
    setNote(null);
    // A round already on the board: its initials change.
    if (posted?.status === "posted") {
      // The request.
      const r = await changeInitials(props.gameId, props.mode, props.day, v);
      // How it went.
      setNote(r === "ok" ? t("board.updated", { initials: v }) : r === "initials" ? t("board.initialsRefused") : r === "not_found" ? t("board.notFound") : t("board.unavailable"));
      // The board shows the new initials.
      if (r === "ok") await reload();
    } else {
      // A round not on the board yet: posted now with these initials (or none).
      const r = await postRound(props.gameId, props.mode, props.day, v === "" ? undefined : v);
      // How it went (a posted round says so through the place line and the board).
      setNote(r === "posted" ? t("board.posted", { initials: v === "" ? NO_INITIALS : v }) : r === "initials" ? t("board.initialsRefused") : r === "refused" ? t("board.refused") : r === "late" ? t("board.late") : t("board.unavailable"));
    }
    // Done.
    setBusy(false);
  };

  // Not a board game (cannot happen: GameShell asks only for board games).
  if (!rules) return null;
  // Whether the round is on the board.
  const isPosted = posted?.status === "posted";
  // The share of today's other players this round beat, from the post's own answer.
  const pct = isPosted ? beatPercent(posted?.beat, posted?.of) : null;
  // The board, once read.
  const board = shown.kind === "board" ? shown.board : null;
  // The share who solved.
  const solvedPct = board && board.played > 0 ? Math.round((100 * board.solved) / board.played) : null;

  // The strip.
  return (
    <section className="fg-tb" aria-labelledby={titleId}>
      <h2 id={titleId} className="fg-tb-title">
        {t("board.title")}
      </h2>

      {/* Loading and unavailable: one quiet line each. */}
      {shown.kind === "loading" && <p className="fg-small fg-muted fg-tb-line">{t("board.loading")}</p>}
      {shown.kind === "unavailable" && <p className="fg-small fg-muted fg-tb-line">{t("board.unavailable")}</p>}

      {/* Where this round sits, announced politely when the post's answer arrives. */}
      <p className="fg-tb-place" role="status" aria-live="polite">
        {isPosted && posted?.of !== undefined && posted.of <= 1
          ? t("board.first")
          : isPosted && pct !== null && posted?.place !== undefined
            ? `${t(rules.unit === "time" ? "board.faster" : "board.better", { pct })} ${t("board.place", { place: posted.place, of: posted.of ?? 0 })}`
            : isPosted && posted?.score === null
              ? t("board.notPlaced")
              : ""}
      </p>
      {/* A posted time the board keeps out of its top ten. */}
      {isPosted && posted?.plausible === false && <p className="fg-small fg-muted fg-tb-line">{t("board.implausible")}</p>}

      {/* The day's numbers. */}
      {board && board.played > 0 && (
        <dl className="fg-tb-stats">
          <div className="fg-tb-stat">
            <dt>{t("board.players")}</dt>
            <dd>{board.played.toLocaleString(locale)}</dd>
          </div>
          <div className="fg-tb-stat">
            <dt>{t("board.solved")}</dt>
            <dd>{solvedPct === null ? "-" : t("board.percent", { pct: solvedPct })}</dd>
          </div>
          <div className="fg-tb-stat">
            <dt>{t("board.average")}</dt>
            <dd>{board.avg === null ? "-" : formatScore(props.gameId, board.avg, locale)}</dd>
          </div>
          <div className="fg-tb-stat">
            <dt>{t("board.median")}</dt>
            <dd>{board.median === null ? "-" : formatScore(props.gameId, board.median, locale)}</dd>
          </div>
        </dl>
      )}
      {/* Nobody on the board yet. */}
      {board && board.played === 0 && <p className="fg-small fg-muted fg-tb-line">{t("board.empty")}</p>}

      {/* The top ten. */}
      {board && board.top.length > 0 && (
        <>
          <h3 className="fg-tb-subtitle">{t("board.top")}</h3>
          <ol className="fg-tb-top">
            {board.top.map((row, i) => (
              <li key={i} className="fg-tb-row">
                <span className="fg-tb-rank">{i + 1}</span>
                <span className="fg-tb-initials mono">{row.initials}</span>
                <CountryFlag code={row.country} />
                <span className="fg-tb-score">
                  {formatScore(props.gameId, row.score, locale)}
                  {row.time !== undefined && rules.timeTieBreak && rules.unit !== "time" && <span className="fg-muted"> · {formatDuration(row.time)}</span>}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      {/* The rounds of the games the server cannot replay are held to the day's limits instead: said once. */}
      {!rules.verified && <p className="fg-small fg-muted fg-tb-line">{t("board.unverified")}</p>}

      {/* Sharing off, and this round not sent: it can still be posted by hand. */}
      {!isPosted && posted?.status !== "refused" && !sharing && <p className="fg-small fg-muted fg-tb-line">{t("board.shareOff")}</p>}
      {/* Sharing on, but this round was never sent (finished before the board existed, or on a page left too soon). */}
      {posted === null && sharing && settled && <p className="fg-small fg-muted fg-tb-line">{t("board.notSent")}</p>}
      {/* A round the server could not check against the day's puzzle. */}
      {posted?.status === "refused" && <p className="fg-small fg-muted fg-tb-line">{t("board.refused")}</p>}

      {/* The initials and Post or Update, unless the round was refused. */}
      {posted?.status !== "refused" && (
        <form className="fg-tb-form" onSubmit={onSubmit} noValidate>
          <label htmlFor={fieldId} className="fg-tb-label">
            {t("board.initialsLabel")}
          </label>
          <div className="fg-tb-entry">
            <input
              id={fieldId}
              className="fg-tb-input mono"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3))}
              maxLength={3}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              placeholder={NO_INITIALS}
              aria-describedby={helpId}
            />
            <button type="submit" className="fg-button fg-button-primary" disabled={busy || shown.kind === "unavailable"}>
              {busy ? t("board.sending") : isPosted ? t("board.update") : t("board.post")}
            </button>
          </div>
          <p id={helpId} className="fg-small fg-muted fg-tb-help">
            {t("board.initialsHelp")}
          </p>
          {/* How the last request went. */}
          {note && (
            <p className="fg-small fg-tb-note" role="status">
              {note}
            </p>
          )}
        </form>
      )}

      {/* Everything else about the scores. */}
      <p className="fg-tb-more">
        {/* The game's own full scoreboard (09/11/2026: /dev/fun/scores is now the dashboard); a level opens its tab. */}
        <Link href={`/dev/fun/scores/${props.gameId}${props.mode === "daily" ? "" : `#${props.gameId}:${props.mode}`}`} className="fg-tb-link">
          {t("board.allScores")}
        </Link>
      </p>
    </section>
  );
}
