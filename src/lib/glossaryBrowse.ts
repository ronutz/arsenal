// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/glossaryBrowse.ts
// ----------------------------------------------------------------------------
// THE WAYS THROUGH THE GLOSSARY (PRIME 16/11/2026 04:27: "split the Glossary page into theme-based or subject-based or
// whatever you think is best for splitting it and implementing good discoverability across them").
//
// Until this day /glossary rendered every entry on one page: 2,061 entries, about four megabytes in Portuguese, the
// split the audit of 2026-10-15 (F07) left open. The split chosen:
//   - by LETTER, the complete partition: every entry has exactly one letter page, /glossary/letter/<a..z|0-9>, so the
//     A to Z stays whole and no page carries more than one letter's share (7 to 214 entries on this day);
//   - by SUBJECT (the domains) and by KIND, the browsing ways in, which overlap (an entry carries up to four subjects)
//     and were already addressable; they now render the same rows as the letter pages;
//   - a light hub that finds any term by name without carrying the entries (public/glossary-index.json).
// Everything here is derived from the registry at build time, so no page can disagree with another.
// ============================================================================

import {
  getAllGlossaryEntries,
  getGlossaryDomains,
  type GlossaryDomain,
  type GlossaryEntry,
} from "@/content/glossary/glossary";

/** The bucket of entries whose name does not start with a letter A to Z (digits, symbols, other scripts). */
export const OTHER_BUCKET = "#";
/** The address segment of that bucket: "#" cannot sit in a path. */
export const OTHER_SLUG = "0-9";

/**
 * The letter an entry files under: the first letter or digit of its name, accents removed (É files under E), upper
 * case; anything that is not A to Z files under "#".
 *
 * @param headword the entry's name, as displayed
 * @returns "A" to "Z", or "#"
 */
export function letterOf(headword: string): string {
  const first = headword.replace(/^[^\p{L}\p{N}]+/u, "").charAt(0); // the first letter or digit, leading marks skipped
  const plain = first.normalize("NFD").replace(/\p{M}+/gu, "").toUpperCase(); // without its accent, upper case
  return /^[A-Z]$/.test(plain) ? plain : OTHER_BUCKET; // A to Z, or the other bucket
}

/**
 * A bucket's address segment: "a" to "z", or "0-9" for "#".
 *
 * @param bucket "A" to "Z", or "#"
 * @returns the segment used in /glossary/letter/<segment>
 */
export function letterSlug(bucket: string): string {
  return bucket === OTHER_BUCKET ? OTHER_SLUG : bucket.toLowerCase(); // lower case, or the digits' name
}

/**
 * The bucket an address segment names, or null for a segment that names none.
 *
 * @param slug the segment from /glossary/letter/<segment>
 * @returns "A" to "Z", "#", or null
 */
export function bucketOfSlug(slug: string): string | null {
  if (slug === OTHER_SLUG) return OTHER_BUCKET; // the digits and symbols
  return /^[a-z]$/.test(slug) ? slug.toUpperCase() : null; // one lower-case letter, or nothing
}

/** One letter of the A to Z: its bucket, its address segment and how many entries file under it. */
export interface GlossaryLetter {
  bucket: string; // "A" to "Z", or "#"
  slug: string; // "a" to "z", or "0-9"
  count: number; // the entries filed under it (0 for a letter no entry starts with)
}

/**
 * The whole A to Z, in order, with "#" last and only when some entry files under it. A letter no entry starts with is
 * listed with a count of 0, so a rail can show it dimmed rather than skip it.
 *
 * @returns 26 or 27 letters
 */
export function getGlossaryLetters(): GlossaryLetter[] {
  const counts = new Map<string, number>(); // bucket to count
  for (const e of getAllGlossaryEntries()) counts.set(letterOf(e.headword), (counts.get(letterOf(e.headword)) ?? 0) + 1); // count each entry once
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((b) => ({ bucket: b, slug: letterSlug(b), count: counts.get(b) ?? 0 })); // A to Z
  const other = counts.get(OTHER_BUCKET) ?? 0; // the digits and symbols
  return other > 0 ? [...letters, { bucket: OTHER_BUCKET, slug: OTHER_SLUG, count: other }] : letters; // "#" only when used
}

/**
 * The entries filed under one letter, A to Z within it (the registry's order).
 *
 * @param bucket "A" to "Z", or "#"
 * @returns the entries
 */
export function entriesForLetter(bucket: string): GlossaryEntry[] {
  return getAllGlossaryEntries().filter((e) => letterOf(e.headword) === bucket); // the registry is already A to Z
}

/**
 * The entries of one subject, A to Z.
 *
 * @param domain the subject's key
 * @returns the entries carrying it
 */
export function entriesForDomain(domain: string): GlossaryEntry[] {
  return getAllGlossaryEntries().filter((e) => (e.domains as readonly string[]).includes(domain)); // A to Z already
}

/**
 * Entries grouped by letter, in A to Z order with "#" last: the sections of a subject or kind page.
 *
 * @param entries entries in A to Z order
 * @returns [bucket, entries] pairs
 */
export function groupByLetter(entries: GlossaryEntry[]): [string, GlossaryEntry[]][] {
  const groups = new Map<string, GlossaryEntry[]>(); // bucket to its entries, in first-seen order
  for (const e of entries) {
    const b = letterOf(e.headword); // its letter
    if (!groups.has(b)) groups.set(b, []); // a new section
    groups.get(b)!.push(e); // in order
  }
  return [...groups.entries()].sort(([a], [b]) => (a === OTHER_BUCKET ? 1 : b === OTHER_BUCKET ? -1 : a.localeCompare(b))); // A to Z, "#" last
}

/**
 * The entries just before and after one entry in the whole A to Z, for the entry page's previous and next links.
 *
 * @param slug the entry's slug
 * @returns the neighbours (null at either end)
 */
export function alphabeticalNeighbours(slug: string): { prev: GlossaryEntry | null; next: GlossaryEntry | null } {
  const all = getAllGlossaryEntries(); // A to Z
  const i = all.findIndex((e) => e.slug === slug); // its place
  if (i < 0) return { prev: null, next: null }; // not an entry
  return { prev: all[i - 1] ?? null, next: all[i + 1] ?? null }; // the two neighbours
}

/** A subject that shares entries with another, and how many it shares. */
export interface RelatedDomain {
  domain: GlossaryDomain; // the other subject
  shared: number; // the entries carrying both
}

/**
 * The subjects that share the most entries with one subject, most shared first: a subject page's "neighbouring
 * subjects", and the "also in" chips of its filter.
 *
 * @param domain the subject's key
 * @returns every other subject with at least one shared entry
 */
export function relatedDomains(domain: string): RelatedDomain[] {
  const shared = new Map<GlossaryDomain, number>(); // other subject to shared entries
  for (const e of entriesForDomain(domain)) for (const d of e.domains) if (d !== domain) shared.set(d, (shared.get(d) ?? 0) + 1); // each co-tag
  const order = getGlossaryDomains(); // the canonical order, for ties
  return [...shared.entries()]
    .map(([d, n]) => ({ domain: d, shared: n })) // as records
    .sort((a, b) => b.shared - a.shared || order.indexOf(a.domain) - order.indexOf(b.domain)); // most shared first
}

/**
 * How many other entries point at each entry through their related terms: a measure of how central a term is to the
 * glossary's own web of cross-references.
 *
 * @returns slug to the number of entries that name it as related
 */
function incomingRelated(): Map<string, number> {
  const n = new Map<string, number>(); // slug to incoming references
  for (const e of getAllGlossaryEntries()) for (const r of new Set(e.relatedTerms ?? [])) n.set(r, (n.get(r) ?? 0) + 1); // each reference once per entry
  return n; // done
}

/**
 * A subject's key terms: its entries that the rest of the glossary points at most often, then A to Z. The hub shows
 * a few under each subject card, so a reader sees what a subject holds before opening it.
 *
 * @param domain the subject's key
 * @param count how many to return
 * @returns the key terms
 */
export function keyTermsForDomain(domain: string, count: number): GlossaryEntry[] {
  const incoming = incomingRelated(); // the cross-reference counts
  return entriesForDomain(domain)
    .map((e, i) => ({ e, i, n: incoming.get(e.slug) ?? 0 })) // with their counts and A to Z place
    .sort((a, b) => b.n - a.n || a.i - b.i) // most referenced first, then A to Z
    .slice(0, count) // the first few
    .map((x) => x.e); // the entries
}

/**
 * The day an entry was last checked: the latest "(read YYYY-MM-DD" among its sources' labels (the same reading the
 * desk's site index makes), or null for an entry whose sources carry no reading date.
 *
 * @param e the entry
 * @returns an ISO day, or null
 */
export function lastChecked(e: GlossaryEntry): string | null {
  const days = (e.sources ?? []).flatMap((s) => [...s.label.matchAll(/\(read (\d{4}-\d{2}-\d{2})/g)].map((m) => m[1])); // every reading date
  return days.length > 0 ? days.sort().at(-1)! : null; // the latest, or none
}

/**
 * The entries checked against their sources most recently, newest first (ties A to Z): the hub's "recently checked".
 *
 * @param count how many to return
 * @returns the entries, each with its day
 */
export function recentlyChecked(count: number): { entry: GlossaryEntry; day: string }[] {
  return getAllGlossaryEntries()
    .map((entry, i) => ({ entry, i, day: lastChecked(entry) })) // with their days and A to Z place
    .filter((x): x is { entry: GlossaryEntry; i: number; day: string } => x.day !== null) // dated ones only
    .sort((a, b) => b.day.localeCompare(a.day) || a.i - b.i) // newest first, then A to Z
    .slice(0, count) // the first few
    .map(({ entry, day }) => ({ entry, day })); // without the place
}

/**
 * The lowercased text a row is filtered against: its name, its expansion and its other names (the same blob the
 * in-page filter has always read).
 *
 * @param e the entry
 * @returns the blob
 */
export function searchBlob(e: GlossaryEntry): string {
  return [e.headword, e.expansion ?? "", ...(e.aliases ?? [])].join(" ").toLowerCase(); // name, expansion, aliases
}
