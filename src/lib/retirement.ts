// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/retirement.ts
// ----------------------------------------------------------------------------
// DATES TURNED INTO BEHAVIOUR for the certification guides' retirement
// notices (2026-10-06, SCOUT's Round 1 adoption audit, rows 8 and 23: five
// notices dated in the past still read "Retiring <date>" and "can be sat
// until <date>", as if the date were ahead).
//
// The site is a static export, so "today" is the day the page is built. A
// notice whose last sitting day is today or later is "upcoming"; one whose day
// is before today is "passed". The comparison is on calendar days in UTC,
// written as ISO strings (YYYY-MM-DD compares correctly as text), so no time
// zone or hour of the build can move a notice across the line by accident.
// scripts/check-dated-status.mts reads the built pages and fails when a passed
// date is still rendered as a future one, and lists the dates falling due in
// the next 30 days so the next build is not left to chance.
// ============================================================================

/** Where a retirement notice stands on the day of the build. */
export type RetirementState = "upcoming" | "passed";

/** Today's calendar day in UTC as YYYY-MM-DD (the build day for a static page). */
export function todayIso(now: Date = new Date()): string {
  // toISOString is always UTC; its first ten characters are the calendar day.
  return now.toISOString().slice(0, 10);
}

/** "passed" once the published last day is behind the build day, "upcoming" through that day itself. */
export function retirementState(untilIso: string, now: Date = new Date()): RetirementState {
  // ISO calendar days order lexically, so a string comparison is a date comparison.
  return untilIso < todayIso(now) ? "passed" : "upcoming";
}
