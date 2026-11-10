// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/ScoresDashboard.tsx
// ----------------------------------------------------------------------------
// THE SCORES DASHBOARD (/dev/fun/scores, PRIME 09/11/2026 21:41: "an enticing,
// engaging, sleek, clever, modern DASHBOARD showing the main individual stats
// and aggregating interesting ones ... and from where the complete individual
// stats scoreboard for each item can be accessed"). Everything is read in the
// browser after the page loads, so the static export needs nothing from the
// database:
//   - the board, from two public reads (src/lib/fun/board.ts): today's totals
//     (every game's rounds, solved count and best round of the day) and the
//     last 30 days' (rounds per day, each game's record, the busiest games,
//     the countries);
//   - "You", from this browser's own record of the games (one localStorage
//     key, src/lib/fun/storage.ts): today's daily games done and solved, the
//     daily puzzles played and solved, the best live and longest streaks, a
//     15-week calendar of puzzles solved, and the places this browser's
//     rounds took today. Nothing in that panel leaves the browser;
//   - one card per game, each opening its full scoreboard
//     (/dev/fun/scores/<game>), sortable by shelf order, rounds today or
//     difficulty today.
// An old address with a game in its fragment (/dev/fun/scores#ttl, the form
// the games linked to before 09/11/2026) is sent on to that game's page.
// ============================================================================

"use client";

// React's state, effects, memo and ids.
import { useEffect, useId, useMemo, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links inside the site.
import { Link } from "@/i18n/navigation";
// A game's page: /arcade/<id> or /dev/fun/<id>.
import { funPagePath } from "@/config/funGames";
// The games on the board and the totals window type.
import { BOARD_GAMES, boardGame, type BoardGame } from "@/lib/fun/board-rules";
// The board, browser side.
import { fetchTotals, formatScore, type BoardRow, type TotalsAnswer } from "@/lib/fun/board";
// The day arithmetic, the first day of the games, and the time to the next puzzles.
import { LAUNCH_DAY, addDays, epochDay, msToNextDay } from "@/lib/fun/daily";
// Today's UTC day, after mount.
import { useRealToday } from "@/lib/fun/hooks";
// This browser's records, the live streak and the board's local choices.
import { liveStreak, loadBoardLocal, loadRecord, type GameRecord, type PostedRound } from "@/lib/fun/storage";
// A flag with its code for screen readers, and the sharing switch, as the games show them.
import { CountryFlag } from "./games/TodaysBoard";
import ShareSwitch from "./games/ShareSwitch";
// Each game's small drawing.
import GameGlyph from "./GameGlyph";

/** A read's state. */
type Load<T> = { kind: "loading" } | { kind: "unavailable" } | { kind: "ok"; data: T };

/** One board (a game and one of its modes) as the dashboard shows it. */
interface BoardLine {
  /** The game's id. */
  game: string;
  /** The board mode ("daily", or Spanning Tree's "easy" and "hard"). */
  mode: string;
  /** Rounds posted today, and how many were solved. */
  played: number;
  solved: number;
  /** Today's best round, if any. */
  leader: BoardRow | null;
  /** The best round of the last 30 days, if any. */
  record: BoardRow | null;
}

/** This browser's record of one game, as the dashboard reads it. */
interface Mine {
  /** The record itself. */
  r: GameRecord;
  /** Today's daily solved, played without solving, or neither. */
  today: "solved" | "played" | null;
  /** The streak as it stands today. */
  streak: number;
}

/** How the game cards are ordered. */
type Sort = "shelf" | "played" | "hardest";

/** How many weeks the calendar of puzzles solved covers. */
const HEAT_WEEKS = 15;

/** A board is ranked for "hardest" and "most solved" only with at least this many rounds. */
const MIN_ROUNDS_FOR_RATE = 3;

/** Every board (game and mode), in shelf order. */
const BOARDS: readonly { game: string; mode: string }[] = BOARD_GAMES.flatMap((g) => g.modes.map((mode) => ({ game: g.id, mode })));

/**
 * A whole percentage, or null when there is nothing to divide.
 *
 * @param part the part
 * @param whole the whole
 * @returns 0 to 100, or null
 */
function pct(part: number, whole: number): number | null {
  // Nothing played: no share.
  return whole > 0 ? Math.round((100 * part) / whole) : null;
}

/**
 * The calendar's intensity for a day: 0 nothing solved, then four steps.
 *
 * @param n puzzles solved that day
 * @returns 0 to 4
 */
function heatLevel(n: number): number {
  // The steps: none, one, two or three, four to six, seven or more.
  return n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
}

/**
 * The time left, as h:mm:ss.
 *
 * @param ms milliseconds
 * @returns the clock text
 */
function clock(ms: number): string {
  // Whole seconds.
  const s = Math.max(0, Math.floor(ms / 1000));
  // Hours, minutes, seconds.
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  // Two digits for minutes and seconds.
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * The dashboard.
 *
 * @param props the games' and levels' names, in the page's language
 * @returns the dashboard
 */
export default function ScoresDashboard(props: { names: Record<string, string>; levels: Record<string, string> }) {
  // The page's strings.
  const t = useTranslations("devFun.scores");
  // The page's language.
  const locale = useLocale();
  // Today, in UTC, after mount.
  const today = useRealToday();
  // Today's and the last 30 days' totals.
  const [day1, setDay1] = useState<Load<TotalsAnswer>>({ kind: "loading" });
  const [day30, setDay30] = useState<Load<TotalsAnswer>>({ kind: "loading" });
  // This browser's records by game, and the rounds it posted, read after mount.
  const [mine, setMine] = useState<Record<string, Mine> | null>(null);
  const [posted, setPosted] = useState<Record<string, PostedRound>>({});
  // The cards' order.
  const [sort, setSort] = useState<Sort>("shelf");
  // The time to the next puzzles, ticking once a second after mount.
  const [left, setLeft] = useState<number | null>(null);
  // Ids for the sections' headings.
  const pulseId = useId();
  const youId = useId();
  const gamesId = useId();

  // An old address naming a game in its fragment goes on to that game's own scoreboard.
  useEffect(() => {
    // The fragment, without its #.
    const h = decodeURIComponent(window.location.hash.slice(1));
    // Its game: the part before a level ("spanning-tree:hard").
    const id = h.split(":")[0];
    // A game on the board: replaced in the history, the level kept in the new fragment.
    if (id && boardGame(id)) window.location.replace(`/${locale}/dev/fun/scores/${id}/${h.includes(":") ? `#${h}` : ""}`);
  }, [locale]);

  // The two reads, once.
  useEffect(() => {
    // Today's totals.
    void fetchTotals("1").then((d) => setDay1(d ? { kind: "ok", data: d } : { kind: "unavailable" }));
    // The last 30 days'.
    void fetchTotals("30").then((d) => setDay30(d ? { kind: "ok", data: d } : { kind: "unavailable" }));
  }, []);

  // This browser's records, once the day is known.
  useEffect(() => {
    // Not before the day.
    if (!today) return;
    // Each game's record, its today and its live streak.
    const m: Record<string, Mine> = {};
    for (const g of BOARD_GAMES) {
      // The stored record (an empty one when the game was never played here).
      const r = loadRecord(g.id);
      // Solved today, played today, or neither.
      const state = r.lastWinDay === today ? "solved" : r.lastDailyDay === today ? "played" : null;
      // Kept.
      m[g.id] = { r, today: state, streak: liveStreak(r, today) };
    }
    // Shown.
    setMine(m);
    // The rounds sent to the board in the last two days.
    setPosted(loadBoardLocal().posted ?? {});
  }, [today]);

  // The countdown to 00:00 UTC.
  useEffect(() => {
    // Read now, then once a second.
    const tick = () => setLeft(msToNextDay(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    // Stopped when the page goes.
    return () => window.clearInterval(id);
  }, []);

  // The good answers, or null.
  const t1 = day1.kind === "ok" ? day1.data : null;
  const t30 = day30.kind === "ok" ? day30.data : null;

  // Every board's line: today's numbers and leader, the 30 days' record.
  const lines: BoardLine[] = useMemo(
    () =>
      BOARDS.map(({ game, mode }) => {
        // Today's row for this board, and the 30 days' one.
        const a = t1?.games.find((x) => x.game === game && x.mode === mode);
        const b = t30?.games.find((x) => x.game === game && x.mode === mode);
        // The line.
        return { game, mode, played: a?.played ?? 0, solved: a?.solved ?? 0, leader: a?.record ?? null, record: b?.record ?? null };
      }),
    [t1, t30],
  );

  // A board's name: the game's, with the level when it has two.
  const boardName = (game: string, mode: string) => (mode === "daily" ? props.names[game] ?? game : `${props.names[game] ?? game} (${props.levels[mode] ?? mode})`);
  // A day as a short date in the page's language.
  const shortDate = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }), [locale]);
  const dayText = (d: string) => shortDate.format(new Date(`${d}T12:00:00Z`));
  // A whole number in the page's language.
  const num = (n: number) => n.toLocaleString(locale);
  // A percentage in the page's language.
  const pctText = (p: number | null) => (p === null ? "-" : t("percent", { pct: p }));

  // Today's boards with rounds, and the highlights drawn from them.
  const active = lines.filter((l) => l.played > 0);
  const rated = active.filter((l) => l.played >= MIN_ROUNDS_FOR_RATE);
  // The lowest and highest solve rates, and the most rounds.
  const hardest = rated.length ? [...rated].sort((a, b) => a.solved / a.played - b.solved / b.played || b.played - a.played)[0] : null;
  const easiest = rated.length > 1 ? [...rated].sort((a, b) => b.solved / b.played - a.solved / a.played || b.played - a.played)[0] : null;
  const busiest = active.length ? [...active].sort((a, b) => b.played - a.played)[0] : null;
  // The 30 days' busiest board and country.
  const busiest30 = t30 && t30.games.length ? [...t30.games].sort((a, b) => b.played - a.played)[0] : null;
  const topCountry = t30 && t30.countries.length ? t30.countries[0] : null;

  // The cards in the order asked for.
  const cards = useMemo(() => {
    // Each game with its lines.
    const list = BOARD_GAMES.map((g) => ({ g, ls: lines.filter((l) => l.game === g.id) }));
    // Shelf order as it is.
    if (sort === "shelf") return list;
    // Rounds today, most first.
    const played = (x: { ls: BoardLine[] }) => x.ls.reduce((a, l) => a + l.played, 0);
    if (sort === "played") return [...list].sort((a, b) => played(b) - played(a));
    // Solve rate today, lowest first; games without rounds last.
    const rate = (x: { ls: BoardLine[] }) => {
      // Rounds and solved over the game's boards.
      const p = played(x);
      const s = x.ls.reduce((a, l) => a + l.solved, 0);
      // No rounds: after every game that has some.
      return p > 0 ? s / p : 2;
    };
    return [...list].sort((a, b) => rate(a) - rate(b));
  }, [lines, sort]);

  // The 30 days, day by day, for the chart (days without rounds as zero).
  const series = useMemo(() => {
    // Not before the day and the read.
    if (!today || !t30) return [];
    // Rounds by day.
    const byDay = new Map(t30.byDay.map((d) => [d.day, d]));
    // The 30 days ending today.
    return Array.from({ length: 30 }, (_, i) => addDays(today, i - 29)).map((d) => ({ day: d, played: byDay.get(d)?.played ?? 0, solved: byDay.get(d)?.solved ?? 0 }));
  }, [today, t30]);
  // The tallest day.
  const peak = Math.max(1, ...series.map((d) => d.played));

  // This browser's totals over the games.
  const you = useMemo(() => {
    // Not read yet.
    if (!mine || !today) return null;
    // The records.
    const rs = Object.values(mine);
    // Daily puzzles played, and solved on their own day.
    const played = rs.reduce((a, m) => a + m.r.dailyPlayed, 0);
    const solved = rs.reduce((a, m) => a + Object.values(m.r.results).filter((v) => v === 1).length, 0);
    // Today's daily games done and solved.
    const doneToday = rs.filter((m) => m.today !== null).length;
    const solvedToday = rs.filter((m) => m.today === "solved").length;
    // The best live streak and its game, and the longest streak ever.
    const best = BOARD_GAMES.map((g) => ({ id: g.id, n: mine[g.id].streak })).sort((a, b) => b.n - a.n)[0];
    const longest = Math.max(0, ...rs.map((m) => m.r.bestStreak));
    // Puzzles solved per day over the games.
    const perDay = new Map<string, number>();
    for (const m of rs) for (const [d, v] of Object.entries(m.r.results)) if (v === 1) perDay.set(d, (perDay.get(d) ?? 0) + 1);
    // The calendar: whole weeks starting on a Monday, ending with today's week.
    const weekday = (epochDay(today) + 3) % 7; // 0 Monday ... 6 Sunday (1970-01-01 was a Thursday)
    const start = addDays(today, -(weekday + 7 * (HEAT_WEEKS - 1)));
    // Every day from the first Monday to today.
    const cells = Array.from({ length: weekday + 1 + 7 * (HEAT_WEEKS - 1) }, (_, i) => addDays(start, i)).map((d) => ({ day: d, n: perDay.get(d) ?? 0, before: d < LAUNCH_DAY }));
    // Days with something solved in the calendar.
    const activeDays = cells.filter((c) => c.n > 0).length;
    const inCalendar = cells.reduce((a, c) => a + c.n, 0);
    // Anything at all.
    const any = played > 0 || rs.some((m) => m.r.played > 0);
    // The answer.
    return { played, solved, doneToday, solvedToday, best, longest, cells, activeDays, inCalendar, any };
  }, [mine, today]);

  // Today's rounds this browser posted, with their places, in shelf order.
  const places = useMemo(() => {
    // Not before the day.
    if (!today) return [];
    // Each board's posted round today, when it has a place.
    return BOARDS.map(({ game, mode }) => ({ game, mode, p: posted[`${game}|${mode}|${today}`] })).filter((x) => x.p && x.p.status === "posted" && x.p.place && x.p.of);
  }, [posted, today]);

  // Today's totals, for the tiles.
  const playedToday = t1?.played ?? 0;
  const solvedToday = t1?.solved ?? 0;

  // The page body.
  return (
    <div className="fg-dash">
      {/* 1. Today on the board, and the clock with the highlights. */}
      <div className="fg-dash-top">
        <section className="fg-dash-panel fg-dash-pulse" aria-labelledby={pulseId}>
          <header className="fg-dash-head">
            <h2 id={pulseId} className="fg-dash-h2">
              {t("dash.pulseTitle")}
            </h2>
            {today && (
              <span className="fg-dash-live mono">
                <span className="fg-dash-live-dot" aria-hidden="true" />
                {t("dash.liveDay", { date: dayText(today) })}
              </span>
            )}
          </header>
          {day1.kind === "loading" && <p className="fg-small fg-muted">{t("loading")}</p>}
          {day1.kind === "unavailable" && <p className="fg-small fg-muted">{t("unavailable")}</p>}
          {t1 && (
            <>
              <dl className="fg-dash-kpis">
                {/* Rounds today, with the 30 days' total. */}
                <div className="fg-dash-kpi">
                  <dt>{t("dash.roundsToday")}</dt>
                  <dd>
                    <span className="fg-dash-kpi-value">{num(playedToday)}</span>
                    {t30 && <span className="fg-dash-kpi-sub">{t("dash.rounds30", { n: t30.played })}</span>}
                  </dd>
                </div>
                {/* The share solved, with a meter. */}
                <div className="fg-dash-kpi">
                  <dt>{t("dash.solvedToday")}</dt>
                  <dd>
                    <span className="fg-dash-kpi-value">{pctText(pct(solvedToday, playedToday))}</span>
                    <span className="fg-dash-meter" aria-hidden="true">
                      <span className="fg-dash-meter-fill" style={{ width: `${pct(solvedToday, playedToday) ?? 0}%` }} />
                    </span>
                    <span className="fg-dash-kpi-sub">{t("dash.solvedOf", { solved: num(solvedToday), played: num(playedToday) })}</span>
                  </dd>
                </div>
                {/* The boards with at least one round today. */}
                <div className="fg-dash-kpi">
                  <dt>{t("dash.boardsInPlay")}</dt>
                  <dd>
                    <span className="fg-dash-kpi-value">{t("dash.ofTotal", { n: active.length, total: BOARDS.length })}</span>
                    <span className="fg-dash-dots" aria-hidden="true">
                      {lines.map((l) => (
                        <span key={`${l.game}|${l.mode}`} className={`fg-dash-dot fg-glyph--${l.game}${l.played > 0 ? " fg-dash-dot-on" : ""}`} />
                      ))}
                    </span>
                  </dd>
                </div>
                {/* The countries with three rounds or more today. */}
                <div className="fg-dash-kpi">
                  <dt>{t("dash.countriesToday")}</dt>
                  <dd>
                    <span className="fg-dash-kpi-value">{num(t1.countries.length)}</span>
                    {t1.countries.length > 0 ? (
                      <span className="fg-dash-flags">
                        {t1.countries.slice(0, 6).map((c) => (
                          <CountryFlag key={c.code} code={c.code} />
                        ))}
                      </span>
                    ) : (
                      <span className="fg-dash-kpi-sub">{t("dash.countriesHint")}</span>
                    )}
                  </dd>
                </div>
              </dl>
              {playedToday === 0 && <p className="fg-small fg-muted">{t("dash.quietToday")}</p>}
            </>
          )}
          {/* The 30 days, a bar a day, the solved part brighter. */}
          {series.length > 0 && (
            <figure className="fg-dash-spark">
              <figcaption className="fg-dash-cap">{t("dash.sparkTitle")}</figcaption>
              <svg className="fg-dash-spark-svg" viewBox="0 0 300 64" preserveAspectRatio="none" role="img" aria-label={t("dash.sparkLabel", { n: t30?.played ?? 0 })}>
                {series.map((d, i) => {
                  // The bar's slot, its full height and its solved part, to scale.
                  const x = i * 10 + 1;
                  const h = (d.played / peak) * 58;
                  const hs = (d.solved / peak) * 58;
                  // A day without rounds still shows a hairline, so the 30 slots read as days.
                  return (
                    <g key={d.day}>
                      <title>{t("dash.sparkDay", { date: dayText(d.day), played: d.played, solved: d.solved })}</title>
                      <rect className="fg-dash-spark-hit" x={i * 10} y={0} width={10} height={64} />
                      <rect className="fg-dash-spark-all" x={x} y={64 - Math.max(1, h)} width={8} height={Math.max(1, h)} rx={1.5} />
                      {hs > 0 && <rect className="fg-dash-spark-won" x={x} y={64 - hs} width={8} height={hs} rx={1.5} />}
                    </g>
                  );
                })}
              </svg>
              <div className="fg-dash-spark-axis mono" aria-hidden="true">
                <span>{dayText(series[0].day)}</span>
                <span>{dayText(series[series.length - 1].day)}</span>
              </div>
            </figure>
          )}
        </section>

        <aside className="fg-dash-panel fg-dash-side" aria-label={t("dash.highlightsTitle")}>
          {/* The countdown to the next puzzles. */}
          <div className="fg-dash-clock">
            <p className="fg-dash-cap">{t("dash.clockTitle")}</p>
            <p className="fg-dash-clock-time mono" aria-live="off">
              {left === null ? "-:--:--" : clock(left)}
            </p>
            <p className="fg-small fg-muted">{t("dash.clockNote")}</p>
          </div>
          {/* What stands out today and over the month. */}
          <h3 className="fg-dash-h3">{t("dash.highlightsTitle")}</h3>
          <ul className="fg-dash-highlights">
            {hardest && (
              <li className={`fg-dash-hl fg-glyph--${hardest.game}`}>
                <span className="fg-dash-hl-label">{t("dash.hardest")}</span>
                <Link href={`/dev/fun/scores/${hardest.game}`} className="fg-dash-hl-name">
                  {boardName(hardest.game, hardest.mode)}
                </Link>
                <span className="fg-dash-hl-sub">{t("dash.solveLine", { pct: pct(hardest.solved, hardest.played) ?? 0, n: hardest.played })}</span>
              </li>
            )}
            {easiest && easiest !== hardest && (
              <li className={`fg-dash-hl fg-glyph--${easiest.game}`}>
                <span className="fg-dash-hl-label">{t("dash.easiest")}</span>
                <Link href={`/dev/fun/scores/${easiest.game}`} className="fg-dash-hl-name">
                  {boardName(easiest.game, easiest.mode)}
                </Link>
                <span className="fg-dash-hl-sub">{t("dash.solveLine", { pct: pct(easiest.solved, easiest.played) ?? 0, n: easiest.played })}</span>
              </li>
            )}
            {busiest && (
              <li className={`fg-dash-hl fg-glyph--${busiest.game}`}>
                <span className="fg-dash-hl-label">{t("dash.busiestToday")}</span>
                <Link href={`/dev/fun/scores/${busiest.game}`} className="fg-dash-hl-name">
                  {boardName(busiest.game, busiest.mode)}
                </Link>
                <span className="fg-dash-hl-sub">{t("dash.roundsLine", { n: busiest.played })}</span>
              </li>
            )}
            {busiest30 && (
              <li className={`fg-dash-hl fg-glyph--${busiest30.game}`}>
                <span className="fg-dash-hl-label">{t("dash.busiest30")}</span>
                <Link href={`/dev/fun/scores/${busiest30.game}`} className="fg-dash-hl-name">
                  {boardName(busiest30.game, busiest30.mode)}
                </Link>
                <span className="fg-dash-hl-sub">{t("dash.roundsLine", { n: busiest30.played })}</span>
              </li>
            )}
            {topCountry && (
              <li className="fg-dash-hl">
                <span className="fg-dash-hl-label">{t("dash.topCountry")}</span>
                <span className="fg-dash-hl-name">
                  <CountryFlag code={topCountry.code} /> <span className="mono">{topCountry.code}</span>
                </span>
                <span className="fg-dash-hl-sub">{t("dash.roundsLine", { n: topCountry.n })}</span>
              </li>
            )}
          </ul>
          {!hardest && !busiest && <p className="fg-small fg-muted">{t("dash.highlightsEmpty")}</p>}
        </aside>
      </div>

      {/* 2. You: this browser's record, never sent. */}
      <section className="fg-dash-panel fg-dash-you" aria-labelledby={youId}>
        <header className="fg-dash-head">
          <h2 id={youId} className="fg-dash-h2">
            {t("dash.youTitle")}
          </h2>
          <span className="fg-small fg-muted">{t("dash.youNote")}</span>
        </header>
        {you && !you.any && (
          <p className="fg-dash-empty">
            {t("dash.youEmpty")}{" "}
            <Link href="/dev/fun" className="fg-sc-play">
              {t("dash.youPlay")}
            </Link>
          </p>
        )}
        {you && you.any && (
          <div className="fg-dash-you-grid">
            {/* Today's ring: daily games done out of every game on the board. */}
            <div className="fg-dash-ring-wrap">
              <svg className="fg-dash-ring" viewBox="0 0 120 120" role="img" aria-label={`${t("dash.youToday")}: ${t("dash.ofTotal", { n: you.doneToday, total: BOARD_GAMES.length })}`}>
                <circle className="fg-dash-ring-track" cx={60} cy={60} r={50} />
                <circle
                  className="fg-dash-ring-fill"
                  cx={60}
                  cy={60}
                  r={50}
                  pathLength={100}
                  strokeDasharray={`${(100 * you.doneToday) / BOARD_GAMES.length} 100`}
                  transform="rotate(-90 60 60)"
                />
                <text className="fg-dash-ring-n" x={60} y={60}>
                  {you.doneToday}/{BOARD_GAMES.length}
                </text>
                <text className="fg-dash-ring-sub" x={60} y={80}>
                  {t("dash.youTodaySub", { solved: you.solvedToday })}
                </text>
              </svg>
              <p className="fg-dash-cap">{t("dash.youToday")}</p>
            </div>
            {/* The totals and the streaks. */}
            <dl className="fg-dash-kpis fg-dash-kpis-you">
              <div className="fg-dash-kpi">
                <dt>{t("dash.youPlayed")}</dt>
                <dd>
                  <span className="fg-dash-kpi-value">{num(you.played)}</span>
                </dd>
              </div>
              <div className="fg-dash-kpi">
                <dt>{t("dash.youSolved")}</dt>
                <dd>
                  <span className="fg-dash-kpi-value">{num(you.solved)}</span>
                  <span className="fg-dash-kpi-sub">{pctText(pct(you.solved, you.played))}</span>
                </dd>
              </div>
              <div className="fg-dash-kpi">
                <dt>{t("dash.youStreak")}</dt>
                <dd>
                  <span className="fg-dash-kpi-value">{t("dash.days", { n: you.best?.n ?? 0 })}</span>
                  {you.best && you.best.n > 0 && <span className="fg-dash-kpi-sub">{props.names[you.best.id]}</span>}
                </dd>
              </div>
              <div className="fg-dash-kpi">
                <dt>{t("dash.youLongest")}</dt>
                <dd>
                  <span className="fg-dash-kpi-value">{t("dash.days", { n: you.longest })}</span>
                </dd>
              </div>
            </dl>
            {/* The calendar of puzzles solved, a column a week, Monday on top. */}
            <figure className="fg-dash-heat-wrap">
              <figcaption className="fg-dash-cap">{t("dash.heatTitle")}</figcaption>
              <div className="fg-dash-heat" role="img" aria-label={t("dash.heatLabel", { n: you.inCalendar, d: you.activeDays })}>
                {you.cells.map((c) => (
                  <span
                    key={c.day}
                    className={`fg-dash-heat-cell${c.before ? " fg-dash-heat-pre" : ""}${c.day === today ? " fg-dash-heat-today" : ""}`}
                    data-level={heatLevel(c.n)}
                    title={t("dash.heatCell", { date: dayText(c.day), n: c.n })}
                  />
                ))}
              </div>
              <div className="fg-dash-heat-legend fg-small fg-muted" aria-hidden="true">
                <span>{t("dash.less")}</span>
                {[0, 1, 2, 3, 4].map((lv) => (
                  <span key={lv} className="fg-dash-heat-cell" data-level={lv} />
                ))}
                <span>{t("dash.more")}</span>
              </div>
            </figure>
          </div>
        )}
        {/* Today's places of the rounds this browser posted. */}
        {places.length > 0 && (
          <div className="fg-dash-places">
            <h3 className="fg-dash-h3">{t("dash.placesTitle")}</h3>
            <ul className="fg-dash-place-list">
              {places.map(({ game, mode, p }) => (
                <li key={`${game}|${mode}`} className={`fg-dash-place fg-glyph--${game}`}>
                  <Link href={`/dev/fun/scores/${game}`} className="fg-dash-place-name">
                    {boardName(game, mode)}
                  </Link>
                  <span className="fg-dash-place-n mono">{t("dash.place", { place: p!.place!, of: p!.of! })}</span>
                </li>
              ))}
            </ul>
            <p className="fg-small fg-muted">{t("dash.placesNote")}</p>
          </div>
        )}
      </section>

      {/* 3. The games: one card each, opening its full scoreboard. */}
      <section className="fg-dash-games" aria-labelledby={gamesId}>
        <header className="fg-dash-head">
          <h2 id={gamesId} className="fg-dash-h2">
            {t("dash.gamesTitle")}
          </h2>
          <div className="fg-sc-toggle" role="group" aria-label={t("dash.sortLabel")}>
            {(["shelf", "played", "hardest"] as const).map((s) => (
              <button key={s} type="button" className={`fg-sc-tab${sort === s ? " fg-sc-tab-on" : ""}`} aria-pressed={sort === s} onClick={() => setSort(s)}>
                {s === "shelf" ? t("dash.sortShelf") : s === "played" ? t("dash.sortPlayed") : t("dash.sortHardest")}
              </button>
            ))}
          </div>
        </header>
        <ul className="fg-dash-grid">
          {cards.map(({ g, ls }) => (
            <GameCard key={g.id} g={g} ls={ls} live={t1 !== null} mine={mine?.[g.id] ?? null} name={props.names[g.id] ?? g.id} levels={props.levels} locale={locale} dayText={dayText} />
          ))}
        </ul>
      </section>

      {/* 4. The month: the busiest games and the countries. */}
      {t30 && (t30.games.length > 0 || t30.countries.length > 0) && (
        <div className="fg-dash-month">
          <section className="fg-dash-panel">
            <h2 className="fg-dash-h2">{t("dash.leadersTitle")}</h2>
            <ol className="fg-dash-rank">
              {[...t30.games]
                .sort((a, b) => b.played - a.played)
                .slice(0, 8)
                .map((r) => (
                  <li key={`${r.game}|${r.mode}`} className={`fg-dash-rank-row fg-glyph--${r.game}`}>
                    <Link href={`/dev/fun/scores/${r.game}`} className="fg-dash-rank-name">
                      {boardName(r.game, r.mode)}
                    </Link>
                    <span className="fg-dash-rank-bar" aria-hidden="true">
                      <span className="fg-dash-rank-fill" style={{ width: `${(100 * r.played) / Math.max(1, t30.games.reduce((m, x) => Math.max(m, x.played), 0))}%` }} />
                    </span>
                    <span className="fg-dash-rank-n mono">{num(r.played)}</span>
                  </li>
                ))}
            </ol>
          </section>
          <section className="fg-dash-panel">
            <h2 className="fg-dash-h2">{t("dash.countriesTitle30")}</h2>
            {t30.countries.length > 0 ? (
              <ol className="fg-dash-rank">
                {t30.countries.slice(0, 8).map((c) => (
                  <li key={c.code} className="fg-dash-rank-row">
                    <span className="fg-dash-rank-name">
                      <CountryFlag code={c.code} /> <span className="mono">{c.code}</span>
                    </span>
                    <span className="fg-dash-rank-bar" aria-hidden="true">
                      <span className="fg-dash-rank-fill" style={{ width: `${(100 * c.n) / Math.max(1, t30.countries[0].n)}%` }} />
                    </span>
                    <span className="fg-dash-rank-n mono">{num(c.n)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="fg-small fg-muted">{t("countriesEmpty")}</p>
            )}
            <p className="fg-small fg-muted">{t("countriesNote")}</p>
          </section>
        </div>
      )}

      {/* 5. Why there is no streak table, what is kept, and the sharing switch. */}
      <section className="fg-sc-panel fg-sc-notes">
        <h2 className="fg-sc-h2">{t("streaksTitle")}</h2>
        <p className="fg-sc-text">{t("streaksBody")}</p>
        <h2 className="fg-sc-h2">{t("storedTitle")}</h2>
        <p className="fg-sc-text">
          {t.rich("storedBody", {
            privacy: (chunks) => (
              <Link href="/privacy" className="fg-sc-play">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <ShareSwitch label={t("share")} note={t("shareNote")} />
      </section>
    </div>
  );
}

/**
 * One game's card: today's rounds and share solved per board, today's leader and the 30 days' record, this
 * browser's state and best, and the way to the full scoreboard.
 *
 * @param props the game, its lines, whether today's board was read, this browser's record, its name, the level names, the
 *   language and a date formatter
 * @returns the card
 */
function GameCard(props: { g: BoardGame; ls: BoardLine[]; live: boolean; mine: Mine | null; name: string; levels: Record<string, string>; locale: string; dayText: (d: string) => string }) {
  // The page's strings.
  const t = useTranslations("devFun.scores");
  // This browser's state.
  const m = props.mine;
  // The card.
  return (
    <li className={`fg-dash-card fg-glyph--${props.g.id}`}>
      <div className="fg-dash-card-top">
        {/* The game's drawing on its tinted tile. */}
        <span className="fg-card-tile" aria-hidden="true">
          <GameGlyph id={props.g.id} className="fg-glyph-card" />
        </span>
        <h3 className="fg-dash-card-name">{props.name}</h3>
        {/* This browser's state today, and the live streak. */}
        {m?.today === "solved" && <span className="fg-dash-chip fg-dash-chip-won">{t("dash.solvedChip")}</span>}
        {m?.today === "played" && <span className="fg-dash-chip">{t("dash.playedChip")}</span>}
        {m && m.streak > 1 && <span className="fg-dash-chip fg-dash-chip-streak">{t("dash.streakChip", { n: m.streak })}</span>}
      </div>
      {/* Each board of the game: today's rounds and share solved, and today's leader. */}
      {props.ls.map((l) => {
        // The share solved.
        const p = pct(l.solved, l.played);
        // The board's block.
        return (
          <div key={l.mode} className="fg-dash-card-board">
            {l.mode !== "daily" && <p className="fg-dash-card-mode mono">{props.levels[l.mode] ?? l.mode}</p>}
            {/* Today's rounds and share solved, once the board has answered. */}
            {props.live && (
              <>
                <p className="fg-dash-card-line">
                  <span>{l.played > 0 ? t("dash.players", { n: l.played }) : t("dash.noRounds")}</span>
                  {p !== null && <span className="mono">{t("percent", { pct: p })}</span>}
                </p>
                <span className="fg-dash-meter" aria-hidden="true">
                  <span className="fg-dash-meter-fill" style={{ width: `${p ?? 0}%` }} />
                </span>
              </>
            )}
            {l.leader && (
              <p className="fg-dash-card-row">
                <span className="fg-dash-card-key">{t("dash.leader")}</span>
                <span className="fg-dash-card-val">
                  <span className="mono">{l.leader.initials}</span> <CountryFlag code={l.leader.country} /> <span className="mono">{formatScore(props.g.id, l.leader.score, props.locale)}</span>
                </span>
              </p>
            )}
            {l.record && (
              <p className="fg-dash-card-row">
                <span className="fg-dash-card-key">{t("dash.record30")}</span>
                <span className="fg-dash-card-val">
                  <span className="mono">{l.record.initials}</span> <CountryFlag code={l.record.country} /> <span className="mono">{formatScore(props.g.id, l.record.score, props.locale)}</span>
                  {l.record.day && <span className="fg-muted"> · {props.dayText(l.record.day)}</span>}
                </span>
              </p>
            )}
          </div>
        );
      })}
      {/* This browser's best, when it has one. */}
      {m && m.r.best !== null && (
        <p className="fg-dash-card-row">
          <span className="fg-dash-card-key">{t("dash.yourBest")}</span>
          <span className="fg-dash-card-val mono">{formatScore(props.g.id, m.r.best, props.locale)}</span>
        </p>
      )}
      {/* The ways on: the full scoreboard, and the game. */}
      <p className="fg-dash-card-links">
        <Link href={`/dev/fun/scores/${props.g.id}`} className="fg-dash-card-cta">
          {t("dash.fullBoard")} <span aria-hidden="true">&#8594;</span>
        </Link>
        <Link href={funPagePath(props.g.id)} className="fg-sc-play">
          {t("play")}
        </Link>
      </p>
    </li>
  );
}
