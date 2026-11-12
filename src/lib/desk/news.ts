// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/news.ts
// ----------------------------------------------------------------------------
// "NEW FOR YOU" (PLAN-personal-desk-20261112, section 3.7, option 1: "on the
// page, by comparison"). Nothing is asked of a server and nothing new is
// stored: the site index's dates (the day each item last changed, made at
// prebuild by scripts/gen-desk-index.mts) are compared with what the reader
// keeps on the desk and with the day of the previous visit the store records
// (meta.prevVisit, written by recordVisit when the desk page opens).
//
// Three groups, each said in words and a sign on the page:
//   updated   an item the reader marked read whose page changed after the day
//             of the mark ("Updated since you read it", the most useful notice
//             a learning site can give);
//   follow    an unread item of a series, a training series or a reading path
//             the reader saved or made a path from, dated on or after the
//             previous visit (new or revised: the index has the day an item
//             last changed, not the day it first appeared, and the page says
//             so in those words);
//   family    a tool of a family the reader keeps a tool from, not saved and
//             not marked done, dated on or after the previous visit (its
//             verified behaviour is new or changed: a tool's date is the day of
//             its dated golden-vector set).
// The first time the desk is opened there is no previous visit, so the window
// is the last thirty days, and the page says that instead.
// Pure: no window, no storage, no network.
// ============================================================================

// The desk's shapes.
import type { Day, DeskData } from "./store";
// Identifiers.
import { COLLECTION_KINDS, splitItemId, type ItemId } from "./ids";
// The index and its lookups.
import { lookup, type SiteIndex } from "./siteIndex";

/** How far back the first visit looks, in days. */
export const NEWS_FIRST_WINDOW_DAYS = 30;

/** How many rows a group shows before it says how many more there are. */
export const NEWS_GROUP_LIMIT = 8;

/** One row of "New for you". */
export interface NewsRow {
  /** The item, under its current name. */
  id: ItemId;
  /** The day its page last changed. */
  day: Day;
  /** The day the reader marked it read (updated rows only). */
  readDay?: Day;
  /** The collection it belongs to (follow rows only). */
  from?: ItemId;
  /** The tool family (family rows only). */
  family?: string;
}

/** One group: the rows to show and how many more there are. */
export interface NewsGroup {
  /** The rows, newest first, at most NEWS_GROUP_LIMIT. */
  rows: NewsRow[];
  /** How many more matched. */
  more: number;
}

/** Everything "New for you" shows. */
export interface News {
  /** The first day that counts. */
  since: Day;
  /** "visit": since the previous visit; "window": the first visit's thirty days. */
  basis: "visit" | "window";
  /** Read, and changed since. */
  updated: NewsGroup;
  /** New or revised in what the reader follows. */
  follow: NewsGroup;
  /** New or changed in the tool families the reader keeps. */
  family: NewsGroup;
  /** Whether the reader follows anything or keeps any tool (so an empty result can say what to do). */
  following: boolean;
}

/**
 * A day some number of days before another.
 *
 * @param day the starting day
 * @param n how many days back
 * @returns the earlier day
 */
function daysBefore(day: Day, n: number): Day {
  // Noon UTC, so no time zone moves the date.
  return new Date(Date.parse(`${day}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Newest first, cut to the limit.
 *
 * @param rows the matching rows
 * @returns the group
 */
function group(rows: NewsRow[]): NewsGroup {
  // By day, newest first; the same day keeps its found order (Array.prototype.sort is stable).
  const sorted = [...rows].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  // The first rows and the count of the rest.
  return { rows: sorted.slice(0, NEWS_GROUP_LIMIT), more: Math.max(0, sorted.length - NEWS_GROUP_LIMIT) };
}

/**
 * What is new for this reader.
 *
 * @param data the desk
 * @param index the site index of the page's language
 * @param todayDay today, as the reader's day
 * @returns the three groups and the day they count from
 */
export function newsFor(data: DeskData, index: SiteIndex, todayDay: Day): News {
  // The previous visit, or the first visit's window.
  const basis: News["basis"] = data.meta.prevVisit ? "visit" : "window";
  // The first day that counts (inclusive: a change on the day of the last visit may have come after it).
  const since = data.meta.prevVisit ?? daysBefore(todayDay, NEWS_FIRST_WINDOW_DAYS);

  // 1. Read, and changed after the mark.
  const updated: NewsRow[] = [];
  // Each read mark.
  for (const [rid, readDay] of Object.entries(data.read) as [ItemId, Day][]) {
    // The item under its current name.
    const hit = lookup(index, rid);
    // Gone, undated, or not changed since.
    if (!hit || !hit.item.u || hit.item.u <= readDay) continue;
    // Kept.
    updated.push({ id: hit.id, day: hit.item.u, readDay });
  }

  // 2. The collections the reader follows: saved ones, and the ones a path was made from.
  const followed: ItemId[] = [];
  // Saved collections.
  for (const sid of Object.keys(data.saved) as ItemId[]) if (COLLECTION_KINDS.includes(splitItemId(sid).kind)) followed.push(sid);
  // Paths' sources.
  for (const p of data.paths) if (p.from && !followed.includes(p.from.id)) followed.push(p.from.id);
  // The rows, each item once.
  const follow: NewsRow[] = [];
  // Items already listed (an item in two followed series shows once, under the first).
  const seen = new Set<string>();
  // Each followed collection.
  for (const cid of followed) {
    // The collection under its current name.
    const col = lookup(index, cid);
    // Gone.
    if (!col) continue;
    // Each member.
    for (const mid of col.item.m ?? []) {
      // The member's entry.
      const hit = lookup(index, mid);
      // Gone, undated, read, already listed, or older than the window.
      if (!hit || !hit.item.u || hit.id in data.read || seen.has(hit.id) || hit.item.u < since) continue;
      // Listed once.
      seen.add(hit.id);
      // Kept.
      follow.push({ id: hit.id, day: hit.item.u, from: col.id });
    }
  }

  // 3. The tool families the reader keeps a tool from.
  const families = new Set<string>();
  // Each saved tool's family.
  for (const sid of Object.keys(data.saved) as ItemId[]) {
    // Tools only.
    if (splitItemId(sid).kind !== "tool") continue;
    // Its family from the index.
    const c = lookup(index, sid)?.item.c;
    // Kept.
    if (c) families.add(c);
  }
  // The rows.
  const family: NewsRow[] = [];
  // Each tool of those families.
  for (const it of index.items) {
    // Tools of a kept family, dated within the window.
    if (it.k !== "tool" || !it.c || !families.has(it.c) || !it.u || it.u < since) continue;
    // Its identifier.
    const tid = `tool:${it.s}` as ItemId;
    // Already saved or marked done: the reader knows it.
    if (tid in data.saved || tid in data.read) continue;
    // Kept.
    family.push({ id: tid, day: it.u, family: it.c });
  }

  // The three groups.
  return { since, basis, updated: group(updated), follow: group(follow), family: group(family), following: followed.length > 0 || families.size > 0 };
}
