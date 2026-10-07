// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/certStatus.ts
// ----------------------------------------------------------------------------
// A STUDY GUIDE'S STATUS AS DATA, AND HOW FRESH ITS RECORD IS (R1-b1,
// 2026-10-06; SCOUT's Round 1 adoption audit, rows 8, 10 and 23: "Current /
// Transitioning / In preparation / Retired" and "verified against vendor source
// on [date]"; PLAN-round1-closeout-20261006, R1-b).
//
// Until now the hub and the guide pages showed a status only as scattered
// badges (an "In preparation" pill, a retirement badge) that nothing could
// filter on. The status is derived here, once, from facts the guide record
// already holds, so it cannot disagree with them:
//
//   retired        the guide's own exam is withdrawn and its last sitting day
//                  has passed (scope "this-exam", the date behind the build day);
//   transitioning  a retirement notice is still ahead: either this exam is being
//                  withdrawn (a deadline to book against), or an earlier version
//                  of it can still be sat while this guide maps the successor
//                  (a choice between versions to make);
//   preparing      the blueprint is not yet transcribed (status "preparing");
//   current        everything else, including an exam the vendor has announced
//                  but not opened (PRIME 2026-07-26: a candidate prepares
//                  regardless, so "not yet available" is not a status).
//
// The order matters: a retiring exam is "transitioning" even while its guide is
// still in preparation, because the deadline changes what to book, and that is
// the more urgent fact.
//
// FRESHNESS: each record carries the day it was last checked against the
// vendor's official sources (src/content/certifications/verification.ts). Past
// FRESHNESS_DAYS the record is "stale": it says so beside the date, and the
// guard scripts/check-cert-verification.mjs lists it for the next
// re-verification batch (R1-b3). The comparison is on UTC calendar days, like
// src/lib/retirement.ts, so no hour of the build can move a record across the line.
// ============================================================================

import { retirementState, todayIso } from "@/lib/retirement";
import type { StudyGuide } from "@/content/certifications/study-guides";

/** A guide's status on the build day. */
export type GuideStatus = "current" | "transitioning" | "preparing" | "retired";

/** The four statuses in the order a reader meets them on the hub. */
export const GUIDE_STATUSES: readonly GuideStatus[] = ["current", "transitioning", "preparing", "retired"];

/** Derive a guide's status from its own record on the build day (see the header for the rules and their order). */
export function guideStatus(guide: StudyGuide, now: Date = new Date()): GuideStatus {
  // A retirement notice decides first: it carries a date, and a date changes what a candidate should book.
  if (guide.retirement) {
    // Is the notice's last sitting day still ahead on the build day?
    const ahead = retirementState(guide.retirement.untilIso, now) === "upcoming";
    // This guide's own exam: withdrawn once the day has passed, in transition until then.
    if (guide.retirement.scope === "this-exam") return ahead ? "transitioning" : "retired";
    // An earlier version: in transition while it can still be sat; once it cannot, the guide is simply current.
    if (ahead) return "transitioning";
  }
  // No date in play: the blueprint is either still being mapped or published.
  return guide.status === "preparing" ? "preparing" : "current";
}

/** Days after its last check against the vendor's sources at which a record is called stale. */
export const FRESHNESS_DAYS = 120;

/** Whole calendar days from one ISO day to another (UTC), e.g. daysBetween("2026-07-21", "2026-10-06") = 77. */
export function daysBetween(fromIso: string, toIso: string): number {
  // Both days at UTC midnight, so the difference is an exact multiple of a day.
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  // 86,400,000 ms in a UTC day; rounding absorbs nothing because both ends are midnights.
  return Math.round((to - from) / 86_400_000);
}

/** "fresh" within FRESHNESS_DAYS of the check, "stale" after it (on the build day). */
export function freshness(verifiedOn: string, now: Date = new Date()): "fresh" | "stale" {
  // The age of the check in days on the build day.
  return daysBetween(verifiedOn, todayIso(now)) > FRESHNESS_DAYS ? "stale" : "fresh";
}

/** Text folded for matching: lower case, accents removed, every run of non-alphanumerics a single space. */
export function foldForSearch(text: string): string {
  // NFD splits an accented letter into its base and a combining mark; the marks are then dropped.
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
