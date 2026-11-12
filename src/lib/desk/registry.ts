// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/registry.ts
// ----------------------------------------------------------------------------
// THE REGISTRY OF EVERY KEY THE SITE KEEPS IN THE BROWSER (PRIME 12/11/2026
// 13:38, "allow the user storage to be shared among different browsers so they
// become portable"), in two lists:
//   PORTABLE_KEYS   what belongs to the reader and travels with the sync, a
//                   profile file or a profile link, each with its merge rule;
//   LOCAL_ONLY_KEYS what stays with the browser it was made in, each with the
//                   reason (a consent, a session, the sync's own bookkeeping).
// scripts/check-desk-store.mts reads every storage key the code writes and
// fails the build when one is in neither list, and checks that the Privacy
// page names every entry in the six written languages.
//
// It lives in a file of its own, with no imports, so the small watch that
// records when a setting changes (src/lib/desk/settingTimes.ts), which runs on
// every page, can read it without bringing the desk's store along.
// src/lib/desk/portable.ts re-exports all of it.
// ============================================================================

/** How a portable key is merged when both sides changed it. */
export type MergeRule = "desk" | "fun" | "recent" | "drill" | "setting";

/** One portable key (or a family of keys, written with a trailing *). */
export interface PortableKey {
  /** The key, or a prefix ending in "*". */
  match: string;
  /** Its merge rule. */
  rule: MergeRule;
  /** What it holds, in words (the Privacy page lists the same). */
  what: string;
}

/** The portable keys: they travel with the reader. */
export const PORTABLE_KEYS: readonly PortableKey[] = [
  { match: "ronutz:desk:v1", rule: "desk", what: "My desk: saved items, read marks, paths, layout, settings, notes (the sync code inside it never travels)" },
  { match: "ronutz:fun:v1", rule: "fun", what: "the games' record: results, streaks, best scores, settings and progress (the public board's choices stay)" },
  { match: "ronutz:recent:v1", rule: "recent", what: "the last six pages opened (the home page's Continue)" },
  { match: "ronutz:subnet-drill:stats", rule: "drill", what: "the subnet drill's best streak and totals" },
  { match: "ronutz-theme", rule: "setting", what: "the visual theme" },
  { match: "ronutz-lang", rule: "setting", what: "the language last used" },
  { match: "ronutz-glossary-hints", rule: "setting", what: "whether glossary hints are shown" },
  { match: "ronutz-mb-motion", rule: "setting", what: "the Mega Brain's motion switch" },
  { match: "ronutz-shortcuts", rule: "setting", what: "keyboard shortcuts rebound" },
  { match: "ronutz:view:*", rule: "setting", what: "the cards-or-list density of index pages" },
  { match: "ronutz:hub:*", rule: "setting", what: "the Guided or Directory reading of the Learn and Tools pages" },
];

/** One key that never travels, with why. */
export interface LocalOnlyKey {
  /** The key, or a prefix ending in "*". */
  match: string;
  /** Where it lives. */
  storage: "local" | "session";
  /** Why it stays in this browser. */
  why: string;
}

/** The keys that never travel. */
export const LOCAL_ONLY_KEYS: readonly LocalOnlyKey[] = [
  { match: "ronutz:interest:v1", storage: "local", why: "the yes or no to the interest counts is a consent, kept with the browser it was given in (Global Privacy Control and Do Not Track are per browser too)" },
  { match: "ronutz:intel:key", storage: "session", why: "the operator's key for the private dashboard, for one session only" },
  { match: "ronutz:crash-reload", storage: "session", why: "a one-time flag that stops a crashed page reloading itself twice" },
  { match: "ronutz-search-fresh", storage: "local", why: "how the search box opens on this device" },
  { match: "ronutz.privPreview", storage: "session", why: "the author's private preview of unpublished pages, never set for a reader" },
  { match: "ronutz:portable:base", storage: "local", why: "the last synced copy, kept to tell a change made here from one made elsewhere" },
  // The site owner, 12/11/2026 14:42: "the latest change wins" for a setting changed in two browsers between syncs.
  { match: "ronutz:portable:times", storage: "local", why: "when each setting last changed in this browser, to the minute, so the newer of two changes wins when browsers sync (it also travels inside the encrypted copy); not kept when the reader chooses to keep this browser's value" },
  { match: "ronutz:portable:no-times", storage: "local", why: "the reader's choice, for this browser, to keep its own value when both changed and record no change times" },
  { match: "ronutz:fun:posted-day", storage: "local", why: "the day this browser last published a scoreboard round, so its first round of a day says so once and each browser counts once a day as itself (src/lib/fun/board.ts)" },
];

/**
 * Whether a key matches a registry entry (exactly, or by its prefix when the entry ends in "*").
 *
 * @param key the storage key
 * @param match the entry
 * @returns true on a match
 */
export function keyMatches(key: string, match: string): boolean {
  // A family.
  if (match.endsWith("*")) return key.startsWith(match.slice(0, -1));
  // One key.
  return key === match;
}

/**
 * A key's merge rule, or null when it does not travel.
 *
 * @param key the storage key
 * @returns the rule or null
 */
export function portableRule(key: string): MergeRule | null {
  // The first matching entry.
  return PORTABLE_KEYS.find((p) => keyMatches(key, p.match))?.rule ?? null;
}
