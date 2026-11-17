#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-desk-index.mts — THE DESK'S SITE INDEX IS WHOLE, THE SAME
// EVERYWHERE, RESOLVABLE AND SMALL (PRIME 12/11/2026 12:42; PLAN-personal-
// desk-20261112, section 4, "Build guards").
// ----------------------------------------------------------------------------
// Runs after scripts/gen-desk-index.mts. Fails the build when:
//   1. a live language has no index file named in src/generated/desk-index.ts,
//      a named file is missing, a stray file sits in public/desk-index/, or a
//      file's name does not carry the hash of its content (a browser keeps a
//      file by its name, so a name must change when the content does);
//   2. the languages disagree (PARITY): every language must list the same
//      items, with the same members in the same order and the same count of
//      planned parts; only the titles and dates may differ;
//   3. an entry cannot be RESOLVED: a kind the desk does not know
//      (src/lib/desk/ids.ts), a malformed slug, a duplicate, an empty title, a
//      malformed day, a member that is not itself an entry, a collection with
//      no members, a renamed item whose new name is not an entry or whose old
//      name still is one, a kind with no entry at all, an English-fallback
//      flag on the English index;
//   4. (REPORTED, NEVER FAILED since PRIME's ruling of 16/11/2026 21:49: "ALWAYS
//      raise the page size limit when needed, DO NOT abide to the size
//      limitations - always prioritize the CONTENT. For every page") a file over
//      the SIZE CEILING (raw and gzip) or listing more items than the ceiling;
//      the ceilings are reference figures, stated below with the size they were
//      set against, raised to the new size when a note shows they were passed.
// Prints the counts and the sizes. Read-only.
// ============================================================================

// Files, hashing, compression.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
// The current file names, the live languages and the desk's kinds.
import { DESK_INDEX_FILES } from "../src/generated/desk-index";
import { LIVE_LOCALE_CODES } from "../src/i18n/locales";
import { COLLECTION_KINDS, ITEM_KINDS, ITEM_SLUG } from "../src/lib/desk/ids";

/** The tag on every line. */
const TAG = "[check-desk-index]";
/** The folder of the files. */
const DIR = path.join(process.cwd(), "public", "desk-index");
/** Ceilings, set on 12/11/2026 against 293 to 301 KB raw and 74 to 77 KB gzip for 3,168 items per language. */
const MAX_RAW = 420 * 1024;
/** The compressed ceiling (what a reader downloads). */
const MAX_GZIP = 100 * 1024;
/** The item ceiling. */
const MAX_ITEMS = 6000;
/** A day. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** One entry as written. */
interface Entry { k: string; s: string; t: string; u?: string; e?: number; m?: string[]; p?: number; c?: string }
/** One file as written. */
interface Index { v: number; locale: string; day: string; items: Entry[]; redirects: Record<string, string> }

/** Every failure, one line each. */
const failures: string[] = [];
/** Every size or item ceiling passed: reported, never failed (content first, PRIME 16/11/2026 21:49). */
const notes: string[] = [];
/** The size report. */
const sizes: string[] = [];

// 1. The files.
if (!fs.existsSync(DIR)) {
  // Nothing generated.
  console.error(`${TAG} FAIL: public/desk-index/ does not exist; run scripts/gen-desk-index.mts first.`);
  // Stopped.
  process.exit(1);
}
// The names the page will ask for.
const named = new Set<string>();
// Each language's parsed index.
const indexes = new Map<string, Index>();
// Each live language.
for (const loc of LIVE_LOCALE_CODES) {
  // Its file's address.
  const url = DESK_INDEX_FILES[loc];
  // Missing from the manifest.
  if (!url) { failures.push(`${loc}: no index file named in src/generated/desk-index.ts`); continue; }
  // The file's name.
  const name = url.replace(/^\/desk-index\//, "");
  // Named.
  named.add(name);
  // Its path.
  const file = path.join(DIR, name);
  // Missing on disk.
  if (!fs.existsSync(file)) { failures.push(`${loc}: ${url} is named but not on disk`); continue; }
  // The text.
  const text = fs.readFileSync(file, "utf8");
  // Parsed.
  const idx = JSON.parse(text) as Index;
  // The content hash, computed as the generator does (the day left out).
  const hash = crypto.createHash("sha256").update(JSON.stringify({ ...idx, day: "" })).digest("hex").slice(0, 10);
  // The name must carry it.
  if (name !== `${loc}.${hash}.json`) failures.push(`${loc}: ${name} does not carry its content's hash (${hash})`);
  // The language inside matches.
  if (idx.locale !== loc) failures.push(`${loc}: the file says locale ${idx.locale}`);
  // Sizes.
  const gz = zlib.gzipSync(text, { level: 9 }).length;
  // Over a ceiling.
  if (text.length > MAX_RAW) notes.push(`${loc}: ${(text.length / 1024).toFixed(0)} KB raw, over the ${MAX_RAW / 1024} KB ceiling`);
  if (gz > MAX_GZIP) notes.push(`${loc}: ${(gz / 1024).toFixed(0)} KB gzip, over the ${MAX_GZIP / 1024} KB ceiling`);
  if (idx.items.length > MAX_ITEMS) notes.push(`${loc}: ${idx.items.length} items, over the ${MAX_ITEMS} ceiling`);
  // Reported.
  sizes.push(`${loc} ${idx.items.length} items, ${(text.length / 1024).toFixed(0)} KB (${(gz / 1024).toFixed(0)} KB gzip)`);
  // Kept.
  indexes.set(loc, idx);
}
// Stray files: anything not named.
for (const f of fs.readdirSync(DIR)) if (!named.has(f)) failures.push(`public/desk-index/${f} is not named by the manifest (stale)`);

// 3. Each index on its own.
for (const [loc, idx] of indexes) {
  // Identifiers seen.
  const ids = new Set<string>();
  // Kinds seen.
  const kinds = new Set<string>();
  // Each entry.
  for (const it of idx.items) {
    // Its identifier.
    const id = `${it.k}:${it.s}`;
    // A known kind.
    if (!(ITEM_KINDS as readonly string[]).includes(it.k)) failures.push(`${loc}: ${id}: unknown kind`);
    // A well-formed slug.
    if (!ITEM_SLUG.test(it.s)) failures.push(`${loc}: ${id}: malformed slug`);
    // Once.
    if (ids.has(id)) failures.push(`${loc}: ${id}: listed twice`);
    // A title.
    if (typeof it.t !== "string" || !it.t.trim()) failures.push(`${loc}: ${id}: no title`);
    // A day, when given.
    if (it.u !== undefined && !DAY.test(it.u)) failures.push(`${loc}: ${id}: malformed day ${it.u}`);
    // No fallback flag on the English index.
    if (loc === "en" && it.e) failures.push(`en: ${id}: flagged as an English fallback on the English index`);
    // A collection has members.
    if (COLLECTION_KINDS.includes(it.k as never) && (!it.m || it.m.length === 0)) failures.push(`${loc}: ${id}: a collection with no members`);
    // Noted.
    ids.add(id);
    // Noted.
    kinds.add(it.k);
  }
  // Every member is an entry.
  for (const it of idx.items) for (const m of it.m ?? []) if (!ids.has(m)) failures.push(`${loc}: ${it.k}:${it.s}: member ${m} is not an entry`);
  // Every kind has entries.
  for (const k of ITEM_KINDS) if (!kinds.has(k)) failures.push(`${loc}: no entry of kind ${k}`);
  // Every rename resolves, and the old name is gone.
  for (const [from, to] of Object.entries(idx.redirects)) {
    // The new name is an entry.
    if (!ids.has(to)) failures.push(`${loc}: redirect ${from} -> ${to}: the new name is not an entry`);
    // The old one is not.
    if (ids.has(from)) failures.push(`${loc}: redirect ${from} -> ${to}: the old name is still an entry`);
  }
}

// 2. Parity: every language against English.
const en = indexes.get("en");
// Compared only when English is there.
if (en) {
  // English's structure: identifier to members and planned count.
  const shape = (idx: Index) => new Map(idx.items.map((it) => [`${it.k}:${it.s}`, JSON.stringify([it.m ?? [], it.p ?? 0])]));
  // English's.
  const enShape = shape(en);
  // Each other language.
  for (const [loc, idx] of indexes) {
    // Not against itself.
    if (loc === "en") continue;
    // Its structure.
    const s = shape(idx);
    // Missing items.
    const missing = [...enShape.keys()].filter((k) => !s.has(k));
    // Extra items.
    const extra = [...s.keys()].filter((k) => !enShape.has(k));
    // Different members.
    const differ = [...enShape.keys()].filter((k) => s.has(k) && s.get(k) !== enShape.get(k));
    // Reported.
    if (missing.length) failures.push(`${loc}: ${missing.length} item(s) English has and ${loc} lacks, e.g. ${missing.slice(0, 3).join(", ")}`);
    if (extra.length) failures.push(`${loc}: ${extra.length} item(s) English lacks, e.g. ${extra.slice(0, 3).join(", ")}`);
    if (differ.length) failures.push(`${loc}: ${differ.length} collection(s) with other members than English's, e.g. ${differ.slice(0, 3).join(", ")}`);
    // The renames are the same.
    if (JSON.stringify(idx.redirects) !== JSON.stringify(en.redirects)) failures.push(`${loc}: its renamed items differ from English's`);
  }
}

// The size notes first: printed, never failed (content first, PRIME 16/11/2026 21:49).
for (const n of notes) console.log(`${TAG} NOTE: ${n}; reported, not failed: raise the reference ceiling to the new size.`);
// The verdict.
if (failures.length) {
  // Said.
  console.error(`${TAG} FAIL: ${failures.length} problem(s):`);
  // Each.
  for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
  // Stopped.
  process.exit(1);
}
// Passed.
console.log(`${TAG} OK: ${indexes.size} language(s), the same ${en?.items.length ?? 0} items and ${Object.keys(en?.redirects ?? {}).length} renames in each, every member and rename resolvable, every kind present; ${sizes.join("; ")} (ceilings ${MAX_RAW / 1024} KB raw, ${MAX_GZIP / 1024} KB gzip, ${MAX_ITEMS} items).`);
