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
//   announced      the guide's lifecycle record says the vendor has announced
//                  this exam version but not opened it for booking (PRIME
//                  26/10/2026, the FortiOS 8.0 case: "Current" read as bookable);
//                  it is checked before "preparing", like the other lifecycle
//                  facts (superseded, unknown, beta) the full list holds below;
//   preparing      the blueprint is not yet transcribed (status "preparing");
//   current        everything else. A "not yet available" caveat carried only as
//                  a note, with no lifecycle record, still reads as current
//                  (PRIME 2026-07-26: a candidate prepares regardless); the
//                  lifecycle record is what turns an announced exam into its
//                  own status.
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

/** A guide's status on the build day.
 *  ANNOUNCED (PRIME 26/10/2026): an exam version the vendor has announced but not opened ("Coming Soon" on Fortinet's
 *  exam page) is told apart from current, because "Current" beside it reads as bookable. It is derived from the
 *  lifecycle record's examAvailability "announced", labelled "Announced, not yet open" / "Anunciado, ainda não aberto"
 *  everywhere the status appears, and counted on its own in the hub's readiness line, never inside "current".
 *  ROUND 1 (2026-10-25; audit CC01 and CC03, contract S1): three statuses join the four, each derived from the
 *  guide's `lifecycle` record so that "mapped here" never reads as "current and bookable":
 *    superseded  the vendor names a successor credential; the guide stays as a historical reference;
 *    beta        the objectives come from a beta blueprint and production availability is not verified;
 *    unknown     no first-party source settles the credential's lifecycle.
 *  None of the three counts as current on the hub; each is labelled wherever the status appears. */
export type GuideStatus = "current" | "announced" | "transitioning" | "beta" | "superseded" | "unknown" | "preparing" | "retired";

/** The statuses in the order a reader meets them on the hub. */
// "announced" sits right after "current" (26/10/2026): the two are the ones a reader compares when deciding what to book.
export const GUIDE_STATUSES: readonly GuideStatus[] = ["current", "announced", "transitioning", "beta", "superseded", "unknown", "preparing", "retired"];

/** The certGuides message key that names each status (one dictionary for the hub, the guide pages, the vendor hubs
 *  and the home search index, so the words cannot disagree between them). */
export const STATUS_LABEL_KEY: Readonly<Record<GuideStatus, string>> = {
  // Mapped, with nothing known against booking it.
  current: "statusCurrent",
  // Announced by the vendor, not yet open for booking (26/10/2026).
  announced: "statusAnnounced",
  // A dated retirement notice is in play.
  transitioning: "statusTransitioning",
  // Beta blueprint, production availability not verified (CC03).
  beta: "statusBeta",
  // Superseded by a named successor (CC01).
  superseded: "statusSuperseded",
  // Lifecycle not settled by any first-party source.
  unknown: "statusUnknown",
  // Blueprint not yet transcribed.
  preparing: "statusPreparing",
  // Withdrawn; kept as a record.
  retired: "statusRetired",
};

/** Derive a guide's status from its own record on the build day (see the header for the rules and their order). */
export function guideStatus(guide: StudyGuide, now: Date = new Date()): GuideStatus {
  // A retirement notice decides first: it carries a date, and a date changes what a candidate should book.
  if (guide.retirement) {
    // Is the notice's last sitting day still ahead on the build day?
    const ahead = retirementState(guide.retirement.untilIso, now) === "upcoming";
    // This guide's own exam: withdrawn once the day has passed, in transition until then.
    if (guide.retirement.scope === "this-exam") return ahead ? "transitioning" : "retired";
    // An earlier version: in transition while it can still be sat; once it cannot, the guide is simply current.
    // Round 2 (PRIME 2026-10-25): when the earlier version has its OWN guide in a version family and this version is
    // verified available, the deadline belongs to that other guide; this one is current now (the FortiSASE 26 case).
    const ownVersionAvailable = !!guide.versionFamily && guide.lifecycle?.examAvailability === "available";
    if (ahead && !ownVersionAvailable) return "transitioning";
  }
  // The lifecycle record, when the guide carries one (S1): its facts outrank publication.
  const lc = guide.lifecycle;
  if (lc) {
    // A named successor makes this a historical reference, whatever the old exam's booking state.
    if (lc.credential === "superseded") return "superseded";
    // A credential the vendor has withdrawn.
    if (lc.credential === "retired") return "retired";
    // No source settles the lifecycle: say so rather than call it current.
    if (lc.credential === "unknown") return "unknown";
    // A beta blueprint with no verified production availability is not a current exam (never inferred from an
    // expired beta window).
    if (lc.blueprint === "beta" && lc.examAvailability !== "available") return "beta";
    // Announced but not yet open (26/10/2026): mapped, yet not bookable, so never "current". It outranks "preparing"
    // because whether the exam can be booked at all is the more urgent fact for a candidate.
    if (lc.examAvailability === "announced") return "announced";
  }
  // No date or lifecycle fact in play: the blueprint is either still being mapped or published.
  return guide.status === "preparing" ? "preparing" : "current";
}

/** A certification's status for a one-word chip (vendor hubs): the shared status when every one of its guides has
 *  it, otherwise null (mixed guides are told apart on the hub itself). */
export function certificationStatus(guides: readonly StudyGuide[], now: Date = new Date()): GuideStatus | null {
  // Nothing to say about a certification with no guide.
  if (guides.length === 0) return null;
  // Every guide's status on the build day.
  const all = guides.map((g) => guideStatus(g, now));
  // One shared status, or none.
  return all.every((s) => s === all[0]) ? all[0] : null;
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
