// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/changelogView.ts
// ----------------------------------------------------------------------------
// HOW THE CHANGELOG IS CUT INTO PAGES (PRIME 2026-10-26: "recent + show older").
//
// The /changelog page carried every entry since the site began and weighed
// about three megabytes (pt-BR 3,004,130 bytes at the build of 2026-10-26).
// Folding the older entries into <details> alone would not have lightened it:
// HTML inside a closed <details> is still downloaded and parsed, and the
// App Router repeats every rendered string in the page's flight data. So the
// page is cut instead:
//
//   - /changelog shows the entries of the last RECENT_DAYS days in full, or the
//     newest RECENT_MAX_ENTRIES entries when the window holds more, and
//     below them one closed <details> per earlier month listing that month's
//     days (each a link to the day on the month page) and a link to the month;
//   - /changelog/<yyyy-mm> is a static page per month carrying every entry of
//     that month in full, so every entry keeps a permanent public address.
//
// "Today" is the BUILD day, from the same todayIso() the certification
// retirement notices and scripts/check-dated-status.mts use (UTC calendar
// day), never the reader's clock: the export is static and must be the same
// page for every reader until the next build.
//
// Pure functions only; the two pages render with them.
// ============================================================================

import type { ChangelogEntry } from "@/content/changelog/changelog";
import { todayIso } from "@/lib/retirement";

/** How many calendar days, today included, the main page shows in full. */
export const RECENT_DAYS = 30;

/** The most entries the main page shows in full (PRIME 2026-10-26: "the last 30 days or the newest 150 entries,
 *  whichever is fewer"). The window's weight follows how busy the month was, about 4.6 kB an entry in pt-BR; the cap
 *  bounds it. Entries past the cap fold into their month below, exactly like the entries older than the window. */
export const RECENT_MAX_ENTRIES = 150;

/** An ISO month, "YYYY-MM": the URL segment of a month page. */
export const MONTH_RE = /^\d{4}-\d{2}$/;

/** One day of entries, newest first within the day. */
export interface ChangelogDayGroup {
  /** The calendar day, "YYYY-MM-DD". */
  day: string;
  /** The entries of that day, in display order. */
  entries: ChangelogEntry[];
}

/** One month of entries, as days. */
export interface ChangelogMonthGroup {
  /** The month, "YYYY-MM". */
  month: string;
  /** Its days, newest first. */
  days: ChangelogDayGroup[];
  /** How many entries those days hold together. */
  count: number;
}

/**
 * The calendar day of an entry. Most entries carry a plain "YYYY-MM-DD"; 286 entries of
 * July and August 2026 carry a full timestamp ("2026-08-05T02:40:51-03:00"), whose first
 * ten characters are the local day it was written. Grouping on the raw string gave each
 * timestamped entry a day heading of its own; grouping on the day joins them.
 */
export function entryDay(e: ChangelogEntry): string {
  // The first ten characters are the ISO day in both shapes.
  return e.date.slice(0, 10);
}

/** The ordering key within a day: the entry's "HH:MM" (its `time`, or the timestamp's clock), else empty. */
function entryClock(e: ChangelogEntry): string {
  // An explicit time wins.
  if (e.time) return e.time;
  // A timestamped date carries its own clock after the "T".
  if (e.date.length > 10 && e.date[10] === "T") return e.date.slice(11, 16);
  // A plain day: no clock, so it sorts after the timed entries of that day.
  return "";
}

/** Every entry, newest first by day and then clock; equal keys keep the file's own (newest-first) order. */
export function sortedEntries(all: readonly ChangelogEntry[]): ChangelogEntry[] {
  // Array.prototype.sort is stable, so ties keep the order they were written in.
  return [...all].sort((a, b) => (entryDay(b) + entryClock(b)).localeCompare(entryDay(a) + entryClock(a)));
}

/** Sorted entries gathered into days, newest day first. */
export function groupByDay(sorted: readonly ChangelogEntry[]): ChangelogDayGroup[] {
  // The day groups in order of first appearance (the input is already newest first).
  const groups: ChangelogDayGroup[] = [];
  // Each entry joins the last group when it shares its day, else opens a new one.
  for (const e of sorted) {
    // The entry's day.
    const day = entryDay(e);
    // The group being filled, if it is this day's.
    const last = groups[groups.length - 1];
    // Same day: append.
    if (last && last.day === day) last.entries.push(e);
    // A new day: open its group.
    else groups.push({ day, entries: [e] });
  }
  // Newest day first.
  return groups;
}

/** Day groups gathered into months, newest month first. */
export function groupByMonth(days: readonly ChangelogDayGroup[]): ChangelogMonthGroup[] {
  // The month groups in order of first appearance.
  const months: ChangelogMonthGroup[] = [];
  // Each day joins the last month when it shares it, else opens a new one.
  for (const d of days) {
    // The day's month.
    const month = d.day.slice(0, 7);
    // The month being filled, if it is this day's.
    const last = months[months.length - 1];
    // Same month: append the day and count its entries.
    if (last && last.month === month) {
      last.days.push(d);
      last.count += d.entries.length;
    } else {
      // A new month: open it with this day.
      months.push({ month, days: [d], count: d.entries.length });
    }
  }
  // Newest month first.
  return months;
}

/** The ISO day `n` days before `iso` (UTC arithmetic, so no time zone can shift it). */
export function isoDaysBefore(iso: string, n: number): string {
  // Midnight UTC of that day, minus n whole days, back to its ISO day.
  return new Date(Date.parse(`${iso}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
}

/** The first day shown in full on /changelog: RECENT_DAYS calendar days, the build day included. */
export function recentCutoff(today: string = todayIso()): string {
  // Today counts as the first of the RECENT_DAYS days.
  return isoDaysBefore(today, RECENT_DAYS - 1);
}

/** The main page's split: the recent entries in full, the earlier entries as months, and what the page says about it. */
export function splitRecent(
  all: readonly ChangelogEntry[],
  today: string = todayIso(),
  maxEntries: number = RECENT_MAX_ENTRIES,
): {
  /** The first day of the RECENT_DAYS window. */
  cutoff: string;
  /** The entries shown in full, as days. */
  recent: ChangelogDayGroup[];
  /** How many entries that is. */
  shown: number;
  /** The oldest day shown in full ("since when"), or undefined when nothing is. */
  since: string | undefined;
  /** True when the entry cap, not the day window, decided where the page stops. */
  capped: boolean;
  /** Every entry not shown in full, as months. */
  older: ChangelogMonthGroup[];
} {
  // The first day of the window.
  const cutoff = recentCutoff(today);
  // Every entry, newest first.
  const sorted = sortedEntries(all);
  // The entries inside the day window (ISO days compare as text).
  const inWindow = sorted.filter((e) => entryDay(e) >= cutoff);
  // Whichever is fewer: the window, or the newest maxEntries entries.
  const capped = inWindow.length > maxEntries;
  // The entries shown in full.
  const shownEntries = capped ? inWindow.slice(0, maxEntries) : inWindow;
  // Everything else, in its sorted order (the window's overflow is newer than what lies before the window).
  const rest = sorted.slice(shownEntries.length);
  // The shown entries as days.
  const recent = groupByDay(shownEntries);
  // The oldest day shown: the last group's day.
  const since = recent.length ? recent[recent.length - 1].day : undefined;
  // The rest folded into their months (a day the cap cut through appears in its month with its remaining entries;
  // its link opens the whole day on the month page).
  const older = groupByMonth(groupByDay(rest));
  // The split and what the page says about it.
  return { cutoff, recent, shown: shownEntries.length, since, capped, older };
}

/** Every month that has at least one entry, newest first: the month pages to generate. */
export function allMonths(all: readonly ChangelogEntry[]): ChangelogMonthGroup[] {
  // Every entry's day grouped, then the days grouped into months.
  return groupByMonth(groupByDay(sortedEntries(all)));
}

/** The element id of a day on either page ("day-2026-10-26"), the target of /changelog/<yyyy-mm>#day-<day>. */
export function dayAnchor(day: string): string {
  // A letter first keeps it a plain CSS-safe identifier.
  return `day-${day}`;
}

/** The formatting locale for a page locale: English pages write dates the British way ("4 July 2026", PRIME
 *  2026-10-26; plain "en" formats US style, "July 4, 2026"); every other locale formats as itself. */
export function dateLocale(locale: string): string {
  // en becomes en-GB; the rest unchanged.
  return locale === "en" ? "en-GB" : locale;
}

/** A month written for a reader ("July 2026", "julho de 2026"), pinned to UTC so the month never slips. */
export function formatMonth(month: string, locale: string): string {
  // The first day of the month at midnight UTC, formatted in the locale's own words for month and year.
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString(dateLocale(locale), { month: "long", year: "numeric", timeZone: "UTC" });
}

/** The same with its first letter capitalised for a line that starts with it ("Julho de 2026"). */
export function formatMonthStart(month: string, locale: string): string {
  // The locale's own month words.
  const s = formatMonth(month, locale);
  // Upper-case the first character with the locale's rules (Turkish dotted i included).
  return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
}

/** A day written for a reader, pinned to UTC ("26 October 2026", "26 de outubro de 2026"). */
export function formatDay(day: string, locale: string): string {
  // Midnight UTC of that day, formatted with the UTC zone, so the calendar day is exactly `day` (en as en-GB).
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(dateLocale(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
