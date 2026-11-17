// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/calendar.ts
// ----------------------------------------------------------------------------
// THE DESK'S DATES (increment E, 16/11/2026): pure functions, no state, no
// storage, checked by scripts/check-desk-store.mts (section 23).
//   - weekStartOf: the weekday a calendar week starts on in a language;
//   - readingCalendar: the reading streak widget's calendar, whole weeks as
//     columns, oldest first, nothing after today;
//   - openedAgo: "12 minutes ago", "yesterday" for the last pages opened, in
//     the language's own words (Intl.RelativeTimeFormat).
// Days are YYYY-MM-DD strings read at noon UTC, so no time zone moves a day.
// ============================================================================

// The language's tag for Intl.
import { intlLocale } from "@/i18n/locales";

/**
 * A day some number of days before another (a negative number goes forward), at noon UTC so no zone moves it.
 *
 * @param day the starting day
 * @param n how many days back
 * @returns the other day
 */
function back(day: string, n: number): string {
  // Shifted and cut to YYYY-MM-DD.
  return new Date(Date.parse(`${day}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The weekday a calendar week starts on in a language: Sunday for Brazilian Portuguese (the calendars a Brazilian
 * reader knows), Monday for the others (the ISO week, and the usual European wall calendar).
 *
 * @param locale the page's language
 * @returns 0 for Sunday, 1 for Monday
 */
export function weekStartOf(locale: string): 0 | 1 {
  // Sunday first only in Brazil's Portuguese.
  return locale === "pt-BR" ? 0 : 1;
}

/** One day of the calendar: its date, whether it was a reading day, whether it is today; null past today. */
export type CalendarDay = { d: string; on: boolean; today: boolean } | null;

/**
 * The reading calendar: whole weeks as columns, oldest first, each column seven days from the week's first day; the
 * days after today in the current week are null (not drawn).
 *
 * @param days the reading days
 * @param day today
 * @param weeks how many weeks
 * @param start the weekday the week starts on (0 Sunday, 1 Monday)
 * @returns the columns
 */
export function readingCalendar(days: readonly string[], day: string, weeks: number, start: 0 | 1): CalendarDay[][] {
  // The days as a set.
  const set = new Set(days);
  // Today's weekday (0 Sunday), from noon UTC so no zone moves it.
  const dow = new Date(`${day}T12:00:00Z`).getUTCDay();
  // Today's row in its week.
  const row = (dow - start + 7) % 7;
  // The first day shown: the first day of the week (weeks - 1) weeks before this one.
  const first = back(day, row + (weeks - 1) * 7);
  // Column by column, day by day.
  return Array.from({ length: weeks }, (_, c) =>
    Array.from({ length: 7 }, (_, r) => {
      // This cell's date.
      const d = back(first, -(c * 7 + r));
      // After today: nothing.
      return d > day ? null : { d, on: set.has(d), today: d === day };
    }),
  );
}

/**
 * The current week so far: the days read in it and the items marked read on those days, the week starting on the
 * given weekday and ending today.
 *
 * @param days the reading days
 * @param read the read marks (item to day)
 * @param day today
 * @param start the weekday the week starts on (0 Sunday, 1 Monday)
 * @returns the reading days and the items read this week
 */
export function thisWeek(days: readonly string[], read: Record<string, string>, day: string, start: 0 | 1): { days: number; items: number } {
  // Today's weekday (0 Sunday), from noon UTC so no zone moves it.
  const dow = new Date(`${day}T12:00:00Z`).getUTCDay();
  // The week's first day.
  const first = back(day, (dow - start + 7) % 7);
  // Within the week: from its first day to today, inclusive (YYYY-MM-DD strings compare as dates).
  const inWeek = (d: string) => d >= first && d <= day;
  // Counted.
  return { days: new Set(days.filter(inWeek)).size, items: Object.values(read).filter(inWeek).length };
}

/**
 * When a page was opened, in the page's language, relative to now ("12 minutes ago", "yesterday", "3 days ago").
 *
 * @param at the moment it was opened (milliseconds since 1970)
 * @param now the moment now
 * @param locale the page's language
 * @returns the words, or "" for a moment in the future (another device's clock)
 */
export function openedAgo(at: number, now: number, locale: string): string {
  // Whole minutes ago.
  const minutes = Math.floor((now - at) / 60_000);
  // A clock ahead of this one: said as nothing rather than as a time to come.
  if (!Number.isFinite(minutes) || minutes < 0) return "";
  // The language's own relative words ("yesterday" rather than "1 day ago").
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  // Under a minute: "now" (zero seconds; zero minutes reads "this minute").
  if (minutes < 1) return rtf.format(0, "second");
  // Under an hour: minutes.
  if (minutes < 60) return rtf.format(-minutes, "minute");
  // Under a day: hours.
  if (minutes < 1440) return rtf.format(-Math.floor(minutes / 60), "hour");
  // Otherwise days.
  return rtf.format(-Math.floor(minutes / 1440), "day");
}
