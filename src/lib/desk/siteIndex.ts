// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/siteIndex.ts
// ----------------------------------------------------------------------------
// THE SITE INDEX IN THE BROWSER (PLAN-personal-desk-20261112, section 3.1).
// The desk keeps identifiers; this turns them into titles and dates in the
// page's language. The index is a static file per language made at prebuild
// (scripts/gen-desk-index.mts), named by its content's hash
// (src/generated/desk-index.ts), and fetched only on demand: by the desk page,
// by an "add" picker when it opens, and by a series page's progress line. Its
// address is on this site; nothing is sent with it. One copy per language is
// kept in memory for the life of the page.
// ============================================================================

// React's state and effects for the hook.
import { useEffect, useState } from "react";
// The current file of each language's index.
import { DESK_INDEX_FILES } from "@/generated/desk-index";
// The identifiers.
import { itemId, type ItemId, type ItemKind } from "./ids";

/** One item of the index. */
export interface IndexItem {
  /** Kind. */
  k: ItemKind;
  /** Slug. */
  s: string;
  /** Title, in the page's language (or English, flagged by e). */
  t: string;
  /** The day it last changed, when known. */
  u?: string;
  /** 1 when the title is the English fallback. */
  e?: 1;
  /** Members in order (series, training series, reading paths). */
  m?: ItemId[];
  /** Planned parts not yet written. */
  p?: number;
  /** A tool's family. */
  c?: string;
}

/** The index as the page uses it. */
export interface SiteIndex {
  /** Its language. */
  locale: string;
  /** The day it was made. */
  day: string;
  /** Every item, in kind then slug order. */
  items: IndexItem[];
  /** Items by identifier. */
  byId: Map<ItemId, IndexItem>;
  /** Renamed or merged identifiers: old to new. */
  redirects: Record<string, string>;
  /** For each item, the collections it belongs to (series, training series, reading paths). */
  memberOf: Map<ItemId, ItemId[]>;
}

/** One load per language for the life of the page. */
const cache = new Map<string, Promise<SiteIndex>>();

/**
 * Load the index of a language (once per page).
 *
 * @param locale the page's language
 * @returns the index
 */
export function loadSiteIndex(locale: string): Promise<SiteIndex> {
  // Already loading or loaded.
  const hit = cache.get(locale);
  // Shared.
  if (hit) return hit;
  // The file: this language's, or English's for a language without one.
  const file = DESK_INDEX_FILES[locale] ?? DESK_INDEX_FILES.en;
  // Fetched from this site, without credentials; the browser may keep it (its name changes with its content).
  const p = fetch(file, { credentials: "omit" })
    .then((r) => {
      // Anything but a 200 is a failure the page reports in words.
      if (!r.ok) throw new Error(`index ${r.status}`);
      // Parsed.
      return r.json() as Promise<{ locale: string; day: string; items: IndexItem[]; redirects: Record<string, string> }>;
    })
    .then((raw) => {
      // By identifier.
      const byId = new Map<ItemId, IndexItem>();
      // Membership, inverted.
      const memberOf = new Map<ItemId, ItemId[]>();
      // Each item.
      for (const it of raw.items) {
        // Its identifier.
        const id = itemId(it.k, it.s);
        // Indexed.
        byId.set(id, it);
        // Its members point back to it.
        for (const m of it.m ?? []) memberOf.set(m, [...(memberOf.get(m) ?? []), id]);
      }
      // Ready.
      return { locale: raw.locale, day: raw.day, items: raw.items, byId, redirects: raw.redirects ?? {}, memberOf };
    });
  // A failed load is forgotten, so a later attempt can try again.
  p.catch(() => cache.delete(locale));
  // Kept.
  cache.set(locale, p);
  // Returned.
  return p;
}

/** What the hook gives: the index once loaded, and whether loading failed. */
export interface SiteIndexState {
  /** The index, or null until it arrives. */
  index: SiteIndex | null;
  /** True when it could not be loaded. */
  failed: boolean;
}

/**
 * The index of a language, loaded when `enabled` turns true (an "add" picker loads it only when opened).
 *
 * @param locale the page's language
 * @param enabled whether to load it now
 * @returns the index state
 */
export function useSiteIndex(locale: string, enabled = true): SiteIndexState {
  // Nothing until loaded.
  const [st, setSt] = useState<SiteIndexState>({ index: null, failed: false });
  // Loaded when enabled.
  useEffect(() => {
    // Not yet.
    if (!enabled) return;
    // Whether this effect still matters when the load ends.
    let live = true;
    // Loaded.
    loadSiteIndex(locale).then(
      (index) => { if (live) setSt({ index, failed: false }); },
      () => { if (live) setSt({ index: null, failed: true }); },
    );
    // Abandoned on change.
    return () => { live = false; };
  }, [locale, enabled]);
  // The state.
  return st;
}

/**
 * Look an identifier up, following a rename.
 *
 * @param index the index
 * @param id the identifier as stored
 * @returns the current identifier and its item, or null when the site no longer has it
 */
export function lookup(index: SiteIndex, id: ItemId): { id: ItemId; item: IndexItem } | null {
  // As stored.
  const direct = index.byId.get(id);
  // Found.
  if (direct) return { id, item: direct };
  // Renamed or merged.
  const to = index.redirects[id] as ItemId | undefined;
  // The new name's item.
  const moved = to ? index.byId.get(to) : undefined;
  // Found under the new name, or gone.
  return to && moved ? { id: to, item: moved } : null;
}

/**
 * Whether an item changed after the day it was marked read.
 *
 * @param item the index item
 * @param readDay the day of the read mark
 * @returns true when the item's last change is later
 */
export function updatedSince(item: IndexItem | undefined, readDay: string | undefined): boolean {
  // Both days needed; YYYY-MM-DD sorts as a date.
  return !!item?.u && !!readDay && item.u > readDay;
}

/**
 * Search the index's titles (the "add" picker): every word must appear, case and accents ignored.
 *
 * @param index the index
 * @param query what was typed
 * @param limit how many results at most
 * @param kinds only these kinds, when given
 * @returns the matching items, titles that start with the query first
 */
export function searchIndex(index: SiteIndex, query: string, limit = 20, kinds?: readonly ItemKind[]): IndexItem[] {
  // Folded for comparison: lower case, accents removed.
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // The words typed.
  const words = fold(query).split(/\s+/).filter(Boolean);
  // Nothing typed.
  if (words.length === 0) return [];
  // The matches, with a rank.
  const hits: { it: IndexItem; rank: number }[] = [];
  // Each item.
  for (const it of index.items) {
    // Only the kinds asked for.
    if (kinds && !kinds.includes(it.k)) continue;
    // Title and slug, folded.
    const hay = `${fold(it.t)} ${it.s}`;
    // Every word present.
    if (!words.every((w) => hay.includes(w))) continue;
    // A title starting with the first word ranks first.
    hits.push({ it, rank: fold(it.t).startsWith(words[0]) ? 0 : 1 });
    // Enough candidates.
    if (hits.length >= limit * 5) break;
  }
  // Ranked, then cut.
  return hits.sort((a, b) => a.rank - b.rank).slice(0, limit).map((h) => h.it);
}
