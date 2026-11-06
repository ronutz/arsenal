// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/archive.ts
// ----------------------------------------------------------------------------
// EARLIER PUZZLES for the /dev/fun daily games (PRIME 05/11/2026: "Allow users
// to select and play daily games from previous days - but never from future
// days").
//
// An earlier puzzle has its own address: the game's page with ?day=YYYY-MM-DD.
// Every daily puzzle is built in the browser from its date (daily.ts), so the
// one thing that keeps a future puzzle from ever being drawn is refusing the
// date itself. The request is checked against the clock on every read, never
// cached: a day is honoured only when it is a real calendar date, on or after
// puzzle #1 (LAUNCH_DAY) and strictly before today in UTC. Today's own date is
// refused too (today's puzzle is the bare page, with its streak), and so is
// anything malformed. A refused request plays today's puzzle and the frame says
// why in one line.
//
// Pure functions, plus two that read window.location (and return "no request"
// on the server, so a static page renders today's frame first).
// ============================================================================

// The day arithmetic and the first day of the games.
import { LAUNCH_DAY, addDays, epochDay, utcDayKey } from "./daily";

/** The query parameter that names an earlier day. */
export const DAY_PARAM = "day";

/** Why a requested day was not played. */
export type DayRefusal = "future" | "today" | "beforeLaunch" | "malformed";

/** The outcome of checking a requested day: the day to play, or why not. */
export type DayCheck = { day: string } | { refused: DayRefusal };

/** What a page was asked for, checked: today, the earlier day in play (or null), and a refusal (or null). */
export interface DayRequest {
  /** Today's UTC day. */
  today: string;
  /** The earlier day being played, or null on today's puzzle. */
  earlier: string | null;
  /** Why a ?day= request was refused, or null when there was none or it was honoured. */
  refused: DayRefusal | null;
}

/**
 * Check a requested day against today: an earlier puzzle's day, or the reason it cannot be played.
 *
 * @param raw the requested value, as written in the address
 * @param today today's UTC day, YYYY-MM-DD
 * @returns the day to play, or a refusal
 */
export function checkEarlierDay(raw: string, today: string): DayCheck {
  // Exactly YYYY-MM-DD: four digits, two, two.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { refused: "malformed" };
  // A real calendar date: going through the epoch and back must give the same text (no 2026-02-30).
  if (addDays(raw, 0) !== raw) return { refused: "malformed" };
  // Before puzzle #1 there is no puzzle.
  if (epochDay(raw) < epochDay(LAUNCH_DAY)) return { refused: "beforeLaunch" };
  // Today's puzzle is the bare page.
  if (raw === today) return { refused: "today" };
  // After today: never.
  if (epochDay(raw) > epochDay(today)) return { refused: "future" };
  // An earlier puzzle.
  return { day: raw };
}

/**
 * The earlier puzzles there are on a day: from yesterday back to puzzle #1, newest first.
 *
 * @param today today's UTC day
 * @returns the days, YYYY-MM-DD, newest first (empty on launch day)
 */
export function earlierDays(today: string): string[] {
  // How many days lie between puzzle #1 and yesterday, both included.
  const count = epochDay(today) - epochDay(LAUNCH_DAY);
  // Yesterday first, then each day before it.
  return Array.from({ length: Math.max(0, count) }, (_, k) => addDays(today, -(k + 1)));
}

/**
 * Read the page's request: today from the clock, and the ?day= value checked against it.
 *
 * @returns the checked request (on the server: today and no request)
 */
export function readDayRequest(): DayRequest {
  // Today, in UTC, read now (a page left open past midnight reads the new day).
  const today = utcDayKey(new Date());
  // No address outside a browser.
  if (typeof window === "undefined") return { today, earlier: null, refused: null };
  // The requested day, if any.
  const requested = new URLSearchParams(window.location.search).get(DAY_PARAM);
  // No request: today's puzzle.
  if (requested === null) return { today, earlier: null, refused: null };
  // Checked against today.
  const checked = checkEarlierDay(requested, today);
  // An earlier puzzle.
  if ("day" in checked) return { today, earlier: checked.day, refused: null };
  // Refused: today's puzzle, with the reason.
  return { today, earlier: null, refused: checked.refused };
}

/**
 * The earlier day being played on this page, or null (today's puzzle, a refused request, or the server).
 *
 * @returns the day, YYYY-MM-DD, or null
 */
export function earlierDayInPlay(): string | null {
  // The same check every time: nothing is cached, so a day that has become today or the future is never honoured.
  return readDayRequest().earlier;
}

/**
 * The address of a game page for a day: the bare page for today's puzzle, ?day= for an earlier one.
 *
 * @param basePath the page's path, without query or fragment
 * @param day the earlier day, or null for today's puzzle
 * @returns a same-page address
 */
export function dayHref(basePath: string, day: string | null): string {
  // Today's puzzle.
  if (day === null) return basePath;
  // An earlier one.
  return `${basePath}?${DAY_PARAM}=${day}`;
}
