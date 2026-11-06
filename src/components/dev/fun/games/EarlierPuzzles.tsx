// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/EarlierPuzzles.tsx
// ----------------------------------------------------------------------------
// EARLIER PUZZLES, the list and the banner (PRIME 05/11/2026: "Allow users to
// select and play daily games from previous days - but never from future
// days"). GameShell places both:
//   - EarlierList: every earlier puzzle from yesterday back to #1, grouped by
//     month, newest first; each one a link to the game's page with ?day=. A
//     finished one carries a tick (solved) or a cross (played, not solved),
//     with a solid edge when it was played on its own day and a dashed edge
//     when it was played later: shape, not colour alone, tells them apart.
//   - EarlierBanner: on an earlier puzzle's page, which puzzle this is, that it
//     does not count toward the streak or the stats, and links to the previous
//     puzzle, today's puzzle and the next one (never past yesterday).
//   - RefusedNote: one line when the address asked for a day that cannot be
//     played (today, the future, before #1, not a date).
// Links are plain anchors, so each day is a fresh page load: every game reads
// its day once, on mount.
// ============================================================================

"use client";

// Strings and the page's language.
import { useLocale, useTranslations } from "next-intl";
// Day arithmetic and puzzle numbers.
import { LAUNCH_DAY, addDays, puzzleNumber } from "@/lib/fun/daily";
// The earlier days and their addresses.
import { dayHref, earlierDays, type DayRefusal } from "@/lib/fun/archive";

/** A result mark for a day: on its day or later, solved or not; null when the day was not finished. */
export interface DayMark {
  /** Played on its own day (solid edge) or later (dashed edge). */
  when: "onDay" | "later";
  /** Solved (tick) or not (cross). */
  solved: boolean;
}

/**
 * The mark for a day from a game's two result maps: the on-the-day result first, then an earlier-puzzle result.
 *
 * @param day the day
 * @param results results of daily puzzles finished on their day
 * @param earlierResults results of earlier puzzles finished later
 * @returns the mark, or null
 */
export function markFor(day: string, results: Record<string, number>, earlierResults: Record<string, number>): DayMark | null {
  // Played on its day.
  if (typeof results[day] === "number") return { when: "onDay", solved: results[day] === 1 };
  // Played later.
  if (typeof earlierResults[day] === "number") return { when: "later", solved: earlierResults[day] === 1 };
  // Not finished.
  return null;
}

/**
 * A date formatted in the page's language, read as a UTC calendar day.
 *
 * @param day the day, YYYY-MM-DD
 * @param locale the page's language
 * @param opts the parts to show
 * @returns the formatted date
 */
function formatDay(day: string, locale: string, opts: Intl.DateTimeFormatOptions): string {
  // Formatting can throw on an unknown language tag: the plain date then.
  try {
    // The site writes British English, so "en" dates read the British way (Tuesday 3 November 2026).
    const tag = locale === "en" ? "en-GB" : locale;
    // Midnight UTC of that day, formatted in UTC, so no time zone moves it to the day before.
    return new Intl.DateTimeFormat(tag, { ...opts, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
  } catch {
    // The date as written.
    return day;
  }
}

/** What the list needs. */
export interface EarlierListProps {
  /** Today's UTC day. */
  today: string;
  /** The earlier day on the board, or null on today's puzzle (that day is marked as the current page). */
  current: string | null;
  /** The page's path, without query. */
  basePath: string;
  /** The game's results of daily puzzles finished on their day. */
  results: Record<string, number>;
  /** The game's results of earlier puzzles finished later. */
  earlierResults: Record<string, number>;
}

/**
 * The list of earlier puzzles, by month, newest first.
 *
 * @param props see EarlierListProps
 * @returns the list
 */
export function EarlierList({ today, current, basePath, results, earlierResults }: EarlierListProps) {
  // The frame's strings.
  const t = useTranslations("devFun.games.common");
  // The page's language, for dates.
  const locale = useLocale();
  // Yesterday back to #1.
  const days = earlierDays(today);
  // Grouped by month (YYYY-MM), in order: the days are newest first, so the months are too.
  const months: { key: string; days: string[] }[] = [];
  // Each day into its month.
  for (const d of days) {
    // The month's key.
    const key = d.slice(0, 7);
    // A new month starts a group.
    if (months.length === 0 || months[months.length - 1].key !== key) months.push({ key, days: [] });
    // The day joins it.
    months[months.length - 1].days.push(d);
  }
  // The list.
  return (
    <div className="fg-rules fg-earlier" id="fg-earlier-list">
      {/* What an earlier puzzle counts for, and what the marks mean. */}
      <p className="fg-earlier-note">{t("earlierNote")}</p>
      {/* One section per month, newest first. */}
      {months.map((m) => (
        <section key={m.key} className="fg-earlier-month" aria-label={formatDay(`${m.key}-01`, locale, { month: "long", year: "numeric" })}>
          {/* The month's name. */}
          <h3 className="fg-earlier-month-title">{formatDay(`${m.key}-01`, locale, { month: "long", year: "numeric" })}</h3>
          {/* Its days, newest first. */}
          <ul className="fg-earlier-days">
            {m.days.map((d) => {
              // The day's mark, if it was finished.
              const mark = markFor(d, results, earlierResults);
              // Its number.
              const n = puzzleNumber(d);
              // Its date, short.
              const date = formatDay(d, locale, { weekday: "short", day: "numeric", month: "short" });
              // What the mark says, in words, for the accessible name.
              const status = mark === null ? t("earlierNotPlayed") : t(mark.solved ? "earlierSolved" : "earlierUnsolved", { when: mark.when });
              // The day's link.
              return (
                <li key={d}>
                  <a
                    href={dayHref(basePath, d)}
                    className={`fg-earlier-day${mark ? ` fg-earlier-${mark.when === "onDay" ? "onday" : "later"}` : ""}`}
                    aria-current={current === d ? "page" : undefined}
                    aria-label={t("earlierDayLabel", { n, date, status })}
                  >
                    {/* The number, the date and, once finished, the mark (its meaning is in the link's name). */}
                    <span className="fg-earlier-n">{t("puzzleNo", { n })}</span>
                    <span className="fg-earlier-date">{date}</span>
                    {mark && (
                      <span className={`fg-earlier-mark ${mark.solved ? "fg-earlier-solved" : "fg-earlier-unsolved"}`} aria-hidden="true">
                        {mark.solved ? "✓" : "✗"}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** What the banner needs. */
export interface EarlierBannerProps {
  /** The earlier day on the board. */
  day: string;
  /** Today's UTC day. */
  today: string;
  /** The page's path, without query. */
  basePath: string;
}

/**
 * The banner on an earlier puzzle's page: which puzzle, what it does not count toward, and the way around.
 *
 * @param props see EarlierBannerProps
 * @returns the banner
 */
export function EarlierBanner({ day, today, basePath }: EarlierBannerProps) {
  // The frame's strings.
  const t = useTranslations("devFun.games.common");
  // The page's language.
  const locale = useLocale();
  // The day before, unless this is #1.
  const prev = day > LAUNCH_DAY ? addDays(day, -1) : null;
  // The day after, unless that is today.
  const next = addDays(day, 1) < today ? addDays(day, 1) : null;
  // The banner.
  return (
    <div className="fg-earlier-banner" role="note">
      <p className="fg-earlier-banner-title">
        {t("earlierBannerTitle", { n: puzzleNumber(day), date: formatDay(day, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) })}
      </p>
      <p className="fg-earlier-banner-note">{t("earlierBannerNote")}</p>
      <nav className="fg-earlier-nav" aria-label={t("earlierNavLabel")}>
        {/* The puzzle before, unless this is #1. */}
        {prev && <a className="fg-earlier-nav-link" href={dayHref(basePath, prev)}>{t("earlierPrev", { n: puzzleNumber(prev) })}</a>}
        {/* Today's puzzle, the one that counts. */}
        <a className="fg-earlier-nav-link fg-earlier-nav-today" href={dayHref(basePath, null)}>{t("earlierToday")}</a>
        {/* The puzzle after, unless that one is today's. */}
        {next && <a className="fg-earlier-nav-link" href={dayHref(basePath, next)}>{t("earlierNext", { n: puzzleNumber(next) })}</a>}
      </nav>
    </div>
  );
}

/**
 * One line when the address asked for a day that cannot be played; today's puzzle is on the board.
 *
 * @param props the reason
 * @returns the note
 */
export function RefusedNote({ reason }: { reason: DayRefusal }) {
  // The frame's strings.
  const t = useTranslations("devFun.games.common");
  // The page's language, for the date of #1.
  const locale = useLocale();
  // The note.
  return (
    <p className="fg-earlier-refused" role="status">
      {t("earlierRefused", { reason, first: formatDay(LAUNCH_DAY, locale, { day: "numeric", month: "long", year: "numeric" }) })}
    </p>
  );
}
