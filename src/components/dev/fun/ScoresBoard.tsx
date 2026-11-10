// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/ScoresBoard.tsx
// ----------------------------------------------------------------------------
// THE SCORES PAGE'S BOARD (/dev/fun/scores, PRIME 08/11/2026: "an experience
// on itself for those wanting to see more about scores and game stats"). The
// page itself is a static shell; everything here is read in the browser from
// the board's public endpoints (src/lib/fun/board.ts):
//   - one tab per game on the board (and Spanning Tree's two levels): today's
//     players, the share who solved, the average and median, a histogram drawn
//     to the game's own scale, the top ten, the countries with at least three
//     rounds, and the last 7 and 30 days with each window's best round;
//   - the whole shelf over 7 days, 30 days or every day kept: rounds played
//     and solved, rounds per day, the busiest games, the countries;
//   - why there is no streak table (nothing links one day's rounds to the
//     next), the sharing switch, and what is stored, with the Privacy page.
// The tab in the address (#<game>) opens that game's tab, so "All scores and
// statistics" under a game's board lands on its own.
// ============================================================================

"use client";

// React's state, effects, refs, memo and ids.
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links inside the site.
import { Link } from "@/i18n/navigation";
// A game's page: /arcade/<id> for the arcade games, /dev/fun/<id> for the daily puzzles (08/11/2026).
import { funPagePath } from "@/config/funGames";
// The games on the board.
import { BOARD_GAMES, boardGame } from "@/lib/fun/board-rules";
// The board, browser side.
import { fetchBoard, fetchTotals, formatScore, type BoardAnswer, type BoardBin, type TotalsAnswer } from "@/lib/fun/board";
// The games' time format, for the time that breaks ties.
import { formatDuration } from "@/lib/fun/share";
// Today's UTC day, after mount.
import { useRealToday } from "@/lib/fun/hooks";
// A flag with its code for screen readers, and the sharing switch, as the games show them.
import { CountryFlag } from "./games/TodaysBoard";
import ShareSwitch from "./games/ShareSwitch";

/** One tab: a game and one of its board modes. */
interface Tab {
  /** The tab's id: the game, with Spanning Tree's level after a colon. */
  key: string;
  /** The game's id. */
  game: string;
  /** The board mode. */
  mode: string;
}

/** Every tab, in shelf order. */
const TABS: readonly Tab[] = BOARD_GAMES.flatMap((g) => g.modes.map((m) => ({ key: g.modes.length > 1 ? `${g.id}:${m}` : g.id, game: g.id, mode: m })));

/** A fetch's state. */
type Load<T> = { kind: "loading" } | { kind: "unavailable" } | { kind: "ok"; data: T };

/** The SVG's width in its own units; the drawing scales to the column. */
const SVG_W = 480;
/** The SVG's height. */
const SVG_H = 200;
/** Room under the bars for their labels. */
const AXIS_H = 26;
/** Room above the tallest bar for its count. */
const TOP_PAD = 22;
/** The gap between bars, in SVG units (the surface shows through it). */
const BAR_GAP = 2;
/** The most bar labels drawn under a chart (the rest are in the table view and the tooltips). */
const MAX_LABELS = 6;

/**
 * A bar's outline: square at the baseline, rounded at its data end (at most 4 units, less on a thin bar).
 *
 * @param x its left edge
 * @param y its top
 * @param w its width
 * @param h its height
 * @returns an SVG path
 */
function barPath(x: number, y: number, w: number, h: number): string {
  // The corner radius: 4, or half the width or the height on a small bar.
  const r = Math.max(0, Math.min(4, w / 2, h));
  // Up the left side, round the two top corners, down the right side, along the baseline.
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** One bar to draw: its label under it, its count, and its tooltip. */
interface Bar {
  /** The label under it. */
  label: string;
  /** Its count. */
  n: number;
  /** The tooltip and table text. */
  title: string;
  /** Drawn quieter (the "not solved" bar). */
  muted?: boolean;
}

/**
 * A bar chart drawn to scale in inline SVG, with a hover tooltip per bar, the tallest bar's count written above it,
 * and a table view for screen readers and anyone who prefers numbers.
 *
 * @param props the bars, the chart's accessible name and the table's headings
 * @returns the figure
 */
function Bars(props: { bars: Bar[]; label: string; tableToggle: string; colLabel: string; colCount: string }) {
  // The tallest bar.
  const max = Math.max(1, ...props.bars.map((b) => b.n));
  // The bars' slot width.
  const slot = SVG_W / Math.max(1, props.bars.length);
  // The drawing height for the bars.
  const plotH = SVG_H - AXIS_H - TOP_PAD;
  // Every k-th label, so that no more than MAX_LABELS are drawn.
  const every = Math.max(1, Math.ceil(props.bars.length / MAX_LABELS));
  // The tallest bar's index, for its count.
  const tallest = props.bars.reduce((best, b, i) => (b.n > props.bars[best].n ? i : best), 0);
  // The figure.
  return (
    <figure className="fg-sc-figure">
      <svg className="fg-sc-chart" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label={props.label}>
        {/* The baseline. */}
        <line className="fg-sc-axis" x1={0} x2={SVG_W} y1={SVG_H - AXIS_H} y2={SVG_H - AXIS_H} />
        {props.bars.map((b, i) => {
          // The bar's height to scale.
          const h = (b.n / max) * plotH;
          // Its left edge, with the gap on each side.
          const x = i * slot + BAR_GAP / 2;
          // Its width.
          const w = Math.max(1, slot - BAR_GAP);
          // Its top.
          const y = SVG_H - AXIS_H - h;
          // The bar, its hit area (the whole slot, taller than the bar), its label and, on the tallest, its count.
          return (
            <g key={i} className="fg-sc-bar-group">
              <title>{b.title}</title>
              <rect className="fg-sc-hit" x={i * slot} y={0} width={slot} height={SVG_H - AXIS_H} />
              {b.n > 0 && <path className={b.muted ? "fg-sc-bar fg-sc-bar-muted" : "fg-sc-bar"} d={barPath(x, y, w, h)} />}
              {i % every === 0 && (
                <text className="fg-sc-tick" x={i * slot + slot / 2} y={SVG_H - 8} textAnchor="middle">
                  {b.label}
                </text>
              )}
              {i === tallest && b.n > 0 && (
                <text className="fg-sc-count" x={i * slot + slot / 2} y={y - 6} textAnchor="middle">
                  {b.n}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {/* The same numbers as a table. */}
      <details className="fg-sc-table-wrap">
        <summary className="fg-sc-table-toggle">{props.tableToggle}</summary>
        <table className="fg-sc-table">
          <thead>
            <tr>
              <th scope="col">{props.colLabel}</th>
              <th scope="col">{props.colCount}</th>
            </tr>
          </thead>
          <tbody>
            {props.bars.map((b, i) => (
              <tr key={i}>
                <td>{b.label}</td>
                <td>{b.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/**
 * A bin's label on the game's scale: one value for scores counted out of a total, a range otherwise.
 *
 * @param game the game's id
 * @param b the bin
 * @param locale the page's language
 * @returns the label
 */
function binLabel(game: string, b: BoardBin, locale: string): string {
  // The game's rules.
  const g = boardGame(game);
  // One value per bar.
  if (g?.outOf !== undefined) return String(b.from);
  // A time or points, from the bar's start ("5:00+" for the open last bar).
  const from = g?.unit === "time" ? formatDuration(b.from) : b.from.toLocaleString(locale);
  // The open bar.
  return b.to === null ? `${from}+` : from;
}

/**
 * A stat tile: a label and a value.
 *
 * @param props the label and the value
 * @returns the tile
 */
function Tile(props: { label: string; value: ReactNode }) {
  // A term and its description.
  return (
    <div className="fg-sc-tile">
      <dt>{props.label}</dt>
      <dd>{props.value}</dd>
    </div>
  );
}

/**
 * The scores page's board.
 *
 * @param props the games' and levels' names, in the page's language, and the one game to show (its own page)
 * @returns the board
 */
export default function ScoresBoard(props: { names: Record<string, string>; levels: Record<string, string>; only?: string }) {
  // The tabs shown: one game's (its own scoreboard page) or every game's.
  const tabs = useMemo(() => (props.only ? TABS.filter((x) => x.game === props.only) : TABS), [props.only]);
  // The page's strings.
  const t = useTranslations("devFun.scores");
  // The page's language.
  const locale = useLocale();
  // Today, in UTC, after mount.
  const today = useRealToday();
  // The open tab.
  const [tab, setTab] = useState<string>(tabs[0].key);
  // Today's boards read so far, by tab.
  const [boards, setBoards] = useState<Record<string, Load<BoardAnswer>>>({});
  // The shelf's totals by window.
  const [totals, setTotals] = useState<Record<string, Load<TotalsAnswer>>>({});
  // The shelf's window.
  const [win, setWin] = useState<"7" | "30" | "all">("7");
  // The tab buttons, for the arrow keys, and their strip.
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stripRef = useRef<HTMLDivElement>(null);
  // Ids for the tab panel and the headings.
  const panelId = useId();
  const shelfId = useId();

  // After mount: the tab the address names (#<game> or #spanning-tree:hard), if any.
  useEffect(() => {
    // The fragment, without its #.
    const h = decodeURIComponent(window.location.hash.slice(1));
    // A tab by its key, or the first tab of a game named alone.
    const hit = tabs.find((x) => x.key === h) ?? tabs.find((x) => x.game === h);
    // Opened.
    if (hit) setTab(hit.key);
  }, []);

  // The open tab's game and mode.
  const current = tabs.find((x) => x.key === tab) ?? tabs[0];

  // The open tab is kept in sight in its strip (on a phone the tabs scroll sideways); only the strip moves, never the page.
  useEffect(() => {
    // The strip and the open tab's button.
    const strip = stripRef.current;
    const el = tabRefs.current[tabs.findIndex((x) => x.key === tab)];
    // Nothing to move when the strip does not scroll.
    if (!strip || !el || strip.scrollWidth <= strip.clientWidth) return;
    // The button's edges inside the strip.
    const left = el.offsetLeft - strip.offsetLeft;
    const right = left + el.offsetWidth;
    // Scrolled just enough to show it.
    if (left < strip.scrollLeft) strip.scrollLeft = left;
    else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = right - strip.clientWidth;
  }, [tab]);

  // Read a window's totals once.
  const loadTotals = useCallback((days: "7" | "30" | "all") => {
    // Marked loading, unless already read or on its way.
    setTotals((m) => (m[days] ? m : { ...m, [days]: { kind: "loading" } }));
    // Read.
    void fetchTotals(days).then((d) => setTotals((m) => ({ ...m, [days]: d ? { kind: "ok", data: d } : { kind: "unavailable" } })));
  }, []);

  // The last 7 and 30 days, for every tab's windows, once.
  useEffect(() => {
    // Both windows.
    loadTotals("7");
    loadTotals("30");
  }, [loadTotals]);

  // The shelf's window, when it changes to one not read yet.
  useEffect(() => {
    // Every day kept is read only when asked for.
    if (win === "all" && !totals.all) loadTotals("all");
  }, [win, totals.all, loadTotals]);

  // Today's board of the open tab, once per tab.
  useEffect(() => {
    // Not before the day is known, and not twice.
    if (!today || boards[current.key]) return;
    // Loading.
    setBoards((m) => ({ ...m, [current.key]: { kind: "loading" } }));
    // Read.
    void fetchBoard(current.game, current.mode, today).then((b) => setBoards((m) => ({ ...m, [current.key]: b ? { kind: "ok", data: b } : { kind: "unavailable" } })));
  }, [today, current.key, current.game, current.mode, boards]);

  // A tab's name: the game's, with the level for Spanning Tree.
  const tabName = (x: Tab) => (boardGame(x.game)?.modes.length ?? 1) > 1 ? `${props.names[x.game] ?? x.game} (${props.levels[x.mode] ?? x.mode})` : props.names[x.game] ?? x.game;

  // The arrow keys move between tabs (the selected tab is the only one in the tab order).
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    // The step.
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    // Home and End.
    const to = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : step !== 0 ? (i + step + tabs.length) % tabs.length : -1;
    // Not a navigation key.
    if (to < 0) return;
    // Not a scroll.
    e.preventDefault();
    // Selected and focused.
    setTab(tabs[to].key);
    tabRefs.current[to]?.focus();
  };

  // A day in the page's language (British order in English).
  const dateText = useCallback((day: string) => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`)), [locale]);

  // The open tab's board.
  const load = boards[current.key];
  // Its data, once read.
  const board = load?.kind === "ok" ? load.data : null;
  // The game's rules.
  const rules = boardGame(current.game);

  // Its histogram's bars: the board's bins, then the unsolved rounds, if any.
  const histBars = useMemo<Bar[]>(() => {
    // Nothing yet.
    if (!board) return [];
    // The bins.
    const bars: Bar[] = board.histogram.map((b) => ({ label: binLabel(board.game, b, locale), n: b.n, title: `${binLabel(board.game, b, locale)}: ${t("rounds", { n: b.n })}` }));
    // The unsolved rounds, quieter, at the end.
    if (board.unsolved > 0) bars.push({ label: t("unsolvedShort"), n: board.unsolved, title: `${t("unsolved")}: ${t("rounds", { n: board.unsolved })}`, muted: true });
    // The bars.
    return bars;
  }, [board, locale, t]);

  // A window's numbers for the open tab.
  const windowRow = (days: "7" | "30") => {
    // The window's totals.
    const l = totals[days];
    // Not read yet, or unavailable.
    if (!l || l.kind !== "ok") return null;
    // The tab's row.
    return l.data.games.find((g) => g.game === current.game && g.mode === current.mode) ?? { game: current.game, mode: current.mode, played: 0, solved: 0, days: 0, record: null };
  };

  // The shelf's totals in the chosen window.
  const shelf = totals[win];
  const shelfData = shelf?.kind === "ok" ? shelf.data : null;

  // The shelf's per-day bars: every day of the window, a day with no round included.
  const dayBars = useMemo<Bar[]>(() => {
    // Nothing yet, or no day known.
    if (!shelfData || !today) return [];
    // Rounds by day.
    const byDay = new Map(shelfData.byDay.map((d) => [d.day, d.played]));
    // The days from the window's start (or the first day with a round, for every day kept) to today.
    const start = win === "all" && shelfData.byDay.length > 0 ? shelfData.byDay[0].day : shelfData.since;
    // The list of days.
    const days: string[] = [];
    // Walked a day at a time (YYYY-MM-DD sorts as a date).
    for (let d = start; d <= today; d = new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)) days.push(d);
    // The short day under a bar, in the page's language ("8 Nov", "8 de nov.").
    const short = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "short", timeZone: "UTC" });
    // A bar per day.
    return days.map((d) => ({ label: short.format(new Date(`${d}T12:00:00Z`)), n: byDay.get(d) ?? 0, title: `${dateText(d)}: ${t("rounds", { n: byDay.get(d) ?? 0 })}` }));
  }, [shelfData, today, win, t, dateText, locale]);

  // The shelf's games, the busiest first.
  const busiest = shelfData ? [...shelfData.games].sort((a, b) => b.played - a.played).slice(0, 12) : [];

  // The page body.
  return (
    <div className="fg-sc">
      {/* One tab per game (and level); hidden when one game with one board is shown. */}
      <div ref={stripRef} className="fg-sc-tabs" role="tablist" aria-label={t("tabsLabel")} hidden={tabs.length < 2}>
        {tabs.map((x, i) => (
          <button
            key={x.key}
            ref={(el) => {
              // Kept for the arrow keys.
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${panelId}-tab-${i}`}
            aria-selected={x.key === tab}
            aria-controls={panelId}
            tabIndex={x.key === tab ? 0 : -1}
            className={`fg-sc-tab${x.key === tab ? " fg-sc-tab-on" : ""}`}
            onClick={() => setTab(x.key)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {tabName(x)}
          </button>
        ))}
      </div>

      {/* The open game. */}
      <section id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${tabs.findIndex((x) => x.key === tab)}`} className="fg-sc-panel">
        <h2 className="fg-sc-h2">{tabName(current)}</h2>
        <p className="fg-small fg-muted fg-sc-line">
          {today ? t("todayLine", { date: dateText(today) }) : t("loading")}{" "}
          <Link href={funPagePath(current.game)} className="fg-sc-play">
            {t("play")}
          </Link>
        </p>
        {/* Whether the server re-checks this game's rounds. */}
        <p className="fg-small fg-muted fg-sc-line">{rules?.verified ? t("checkedYes") : t("checkedNo")}</p>

        {/* Loading, unavailable, empty. */}
        {(!load || load.kind === "loading") && <p className="fg-small fg-muted fg-sc-line">{t("loading")}</p>}
        {load?.kind === "unavailable" && <p className="fg-small fg-muted fg-sc-line">{t("unavailable")}</p>}
        {board && board.played === 0 && <p className="fg-small fg-muted fg-sc-line">{t("empty")}</p>}

        {/* Today's numbers. */}
        {board && board.played > 0 && (
          <>
            <dl className="fg-sc-tiles">
              <Tile label={t("players")} value={board.played.toLocaleString(locale)} />
              <Tile label={t("solved")} value={t("percent", { pct: Math.round((100 * board.solved) / board.played) })} />
              <Tile label={t("average")} value={board.avg === null ? "-" : formatScore(board.game, board.avg, locale)} />
              <Tile label={t("median")} value={board.median === null ? "-" : formatScore(board.game, board.median, locale)} />
            </dl>

            {/* How the day's rounds went. */}
            <h3 className="fg-sc-h3">{t("histTitle")}</h3>
            {histBars.length > 0 ? (
              <Bars bars={histBars} label={t("histLabel", { n: histBars.reduce((a, b) => a + b.n, 0) })} tableToggle={t("tableToggle")} colLabel={t("colScore")} colCount={t("colRounds")} />
            ) : (
              <p className="fg-small fg-muted fg-sc-line">{t("histEmpty")}</p>
            )}

            {/* The top ten. */}
            <h3 className="fg-sc-h3">{t("topTitle")}</h3>
            {board.top.length > 0 ? (
              <ol className="fg-tb-top">
                {board.top.map((row, i) => (
                  <li key={i} className="fg-tb-row">
                    <span className="fg-tb-rank">{i + 1}</span>
                    <span className="fg-tb-initials mono">{row.initials}</span>
                    <CountryFlag code={row.country} />
                    <span className="fg-tb-score">
                      {formatScore(board.game, row.score, locale)}
                      {row.time !== undefined && rules?.unit !== "time" && <span className="fg-muted"> · {formatDuration(row.time)}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="fg-small fg-muted fg-sc-line">{t("topEmpty")}</p>
            )}

            {/* The countries. */}
            <h3 className="fg-sc-h3">{t("countriesTitle")}</h3>
            {board.countries.length > 0 ? (
              <ul className="fg-sc-countries">
                {board.countries.map((c) => (
                  <li key={c.code} className="fg-sc-country">
                    <CountryFlag code={c.code} />
                    <span className="mono" aria-hidden="true">{c.code}</span>
                    <span className="fg-muted">{t("rounds", { n: c.n })}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fg-small fg-muted fg-sc-line">{t("countriesEmpty")}</p>
            )}
            <p className="fg-small fg-muted fg-sc-line">{t("countriesNote")}</p>
          </>
        )}

        {/* The last 7 and 30 days for this game. */}
        <div className="fg-sc-windows">
          {(["7", "30"] as const).map((days) => {
            // The window's row.
            const row = windowRow(days);
            // The window.
            return (
              <div key={days} className="fg-sc-window">
                <h3 className="fg-sc-h3">{days === "7" ? t("last7") : t("last30")}</h3>
                {!row ? (
                  <p className="fg-small fg-muted fg-sc-line">{totals[days]?.kind === "unavailable" ? t("unavailable") : t("loading")}</p>
                ) : (
                  <dl className="fg-sc-tiles fg-sc-tiles-small">
                    <Tile label={t("players")} value={row.played.toLocaleString(locale)} />
                    <Tile label={t("solved")} value={row.played > 0 ? t("percent", { pct: Math.round((100 * row.solved) / row.played) }) : "-"} />
                    <Tile
                      label={t("record")}
                      value={
                        row.record ? (
                          <span className="fg-sc-record">
                            <span>{formatScore(current.game, row.record.score, locale)}</span>
                            <span className="mono">{row.record.initials}</span>
                            <CountryFlag code={row.record.country} />
                            {row.record.day && <span className="fg-muted fg-small">{dateText(row.record.day)}</span>}
                          </span>
                        ) : (
                          "-"
                        )
                      }
                    />
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* The whole shelf, on the all-games board only (a game's own page leaves it to the dashboard). */}
      {!props.only && (
      <section className="fg-sc-panel" aria-labelledby={shelfId}>
        <h2 id={shelfId} className="fg-sc-h2">
          {t("shelfTitle")}
        </h2>
        {/* The window. */}
        <div className="fg-sc-toggle" role="group" aria-label={t("windowLabel")}>
          {(["7", "30", "all"] as const).map((w) => (
            <button key={w} type="button" className={`fg-sc-tab${w === win ? " fg-sc-tab-on" : ""}`} aria-pressed={w === win} onClick={() => setWin(w)}>
              {w === "7" ? t("window7") : w === "30" ? t("window30") : t("windowAll")}
            </button>
          ))}
        </div>
        {(!shelf || shelf.kind === "loading") && <p className="fg-small fg-muted fg-sc-line">{t("loading")}</p>}
        {shelf?.kind === "unavailable" && <p className="fg-small fg-muted fg-sc-line">{t("unavailable")}</p>}
        {shelfData && (
          <>
            <dl className="fg-sc-tiles">
              <Tile label={t("roundsPlayed")} value={shelfData.played.toLocaleString(locale)} />
              <Tile label={t("roundsSolved")} value={shelfData.played > 0 ? t("percent", { pct: Math.round((100 * shelfData.solved) / shelfData.played) }) : "-"} />
            </dl>
            {/* Rounds per day. */}
            <h3 className="fg-sc-h3">{t("perDayTitle")}</h3>
            {shelfData.played > 0 ? (
              <Bars bars={dayBars} label={t("perDayLabel", { n: shelfData.played })} tableToggle={t("tableToggle")} colLabel={t("colDay")} colCount={t("colRounds")} />
            ) : (
              <p className="fg-small fg-muted fg-sc-line">{t("shelfEmpty")}</p>
            )}
            {/* The busiest games. */}
            {busiest.length > 0 && (
              <>
                <h3 className="fg-sc-h3">{t("busiestTitle")}</h3>
                <ol className="fg-sc-busiest">
                  {busiest.map((g) => (
                    <li key={`${g.game}|${g.mode}`} className="fg-sc-busy">
                      <span>{tabName({ key: g.game, game: g.game, mode: g.mode })}</span>
                      <span className="fg-muted">{t("rounds", { n: g.played })}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {/* The countries over the window. */}
            {shelfData.countries.length > 0 && (
              <>
                <h3 className="fg-sc-h3">{t("countriesTitle")}</h3>
                <ul className="fg-sc-countries">
                  {shelfData.countries.map((c) => (
                    <li key={c.code} className="fg-sc-country">
                      <CountryFlag code={c.code} />
                      <span className="mono" aria-hidden="true">{c.code}</span>
                      <span className="fg-muted">{t("rounds", { n: c.n })}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
      )}

      {/* Why there is no streak table, and what is kept. */}
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
