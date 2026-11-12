#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/gen-desk-index.mts — THE SITE INDEX BEHIND "MY DESK"
// ----------------------------------------------------------------------------
// PRIME 12/11/2026 12:42 (PLAN-personal-desk-20261112, section 3.1, option 1).
// The desk stores identifiers ("learn:acme-protocol"), never titles. To show
// them, and to know what changed, it needs to know every item of the site in
// the page's language: its kind, its slug, its title, the day it last changed
// and, for a series or a path, its members in order. This writes that index,
// one file per live language, beside the home page's smaller index
// (scripts/gen-home-index.mts), from the same registries the pages render
// from, so a title here cannot disagree with its page.
//
// WHAT IS IN IT, per language:
//   tools (name from the pack; date: the dated golden-vector set, the day the
//   tool's verified behaviour last changed; family: the tool's category),
//   Learn articles (title and "updated" from the article's own frontmatter; in
//   a language that does not carry the articles, the English title, flagged as
//   such, because the link goes to the English page), glossary entries (the
//   headword, the same in every language; date: the latest "(read
//   YYYY-MM-DD)" of its sources, the day the entry was last checked), games,
//   Learn series, training series and curated reading paths (with their
//   written members in order, the count of planned parts, and the latest date
//   among the members), and certification study guides;
//   and the merged or renamed slugs (the Worker's MERGED_GLOSSARY_SLUGS and the
//   item-level rules of public/_redirects), so a desk that kept an old name
//   follows the site to the new one.
//
// WHERE IT GOES: public/desk-index/<locale>.<hash>.json, the hash being the
// first ten hex digits of the file's SHA-256, so a browser may keep a file for
// as long as it likes (a new content gets a new name), and
// src/generated/desk-index.ts, which tells the page the current names. The
// files are fetched only by the desk page and the "add" pickers, on demand.
// Stale files are removed. Checked by scripts/check-desk-index.mts.
//
// Shape: { v: 1, locale, day, items: [{ k, s, t, u?, e?, m?, p?, c? }], redirects }
//   k kind, s slug, t title, u last-changed day, e 1 when the title is the
//   English fallback, m members (identifiers, in order), p planned parts not
//   yet written, c a tool's family.
// ============================================================================

// Files, paths, hashing and compression (to report the size).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
// Article frontmatter.
import matter from "gray-matter";
// The registries the pages render from.
import { tools } from "../src/config/tools";
import { GLOSSARY } from "../src/content/glossary/glossary";
import { LEARN_SERIES, seriesArticles } from "../src/content/learn/series";
import { TRAINING_SERIES, trainingArticles } from "../src/content/study-guides/training-series";
import { READING_PATHS } from "../src/content/study-guides/reading-paths";
import { studyGuides } from "../src/content/certifications/study-guides";
import { FUN_GAMES } from "../src/config/funGames";
// The languages built, and which of them carry the Learn articles.
import { LIVE_LOCALE_CODES, AUTHORED_CONTENT_LOCALES } from "../src/i18n/locales";

/** The repository root. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The tag on every line of output. */
const TAG = "[gen-desk-index]";
/** Where the files go. */
const OUT_DIR = path.join(ROOT, "public", "desk-index");
/** The module that names the current files. */
const MANIFEST = path.join(ROOT, "src", "generated", "desk-index.ts");
/** A day. */
const DAY = /\d{4}-\d{2}-\d{2}/;

/** One entry of the index. */
interface Entry {
  /** Kind. */
  k: string;
  /** Slug. */
  s: string;
  /** Title. */
  t: string;
  /** Last-changed day. */
  u?: string;
  /** 1 when the title is the English fallback. */
  e?: 1;
  /** Members, in order. */
  m?: string[];
  /** Planned parts not yet written. */
  p?: number;
  /** A tool's family. */
  c?: string;
}

/** A message pack, read loosely. */
type Pack = Record<string, unknown>;

/**
 * Read a nested string from a pack.
 *
 * @param pack the pack
 * @param dotted the path, e.g. "tools.cidr.name"
 * @returns the string, or undefined
 */
function get(pack: Pack, dotted: string): string | undefined {
  // Walked down.
  let node: unknown = pack;
  // Each part.
  for (const part of dotted.split(".")) node = node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined;
  // A non-empty string only.
  return typeof node === "string" && node.trim() ? node : undefined;
}

/** Every live language's pack, read once. */
const PACKS: Record<string, Pack> = Object.fromEntries(
  LIVE_LOCALE_CODES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/messages", `${l}.json`), "utf8")) as Pack]),
);

/**
 * A title from the packs: the locale's own, or the English one flagged as a fallback.
 *
 * @param locale the language
 * @param key the dotted key
 * @returns the title and whether it is English standing in
 */
function packTitle(locale: string, key: string): { t: string; e?: 1 } | null {
  // The language's own.
  const own = get(PACKS[locale], key);
  // Found.
  if (own) return { t: own };
  // The English one, flagged unless the page itself is English.
  const en = get(PACKS.en, key);
  // Neither: no title at all (the caller fails).
  if (!en) return null;
  // Flagged.
  return locale === "en" ? { t: en } : { t: en, e: 1 };
}

/** The Learn articles' frontmatter, per folder, read once: slug to { title, updated }. */
const LEARN = new Map<string, Map<string, { title: string; updated?: string }>>();

/**
 * The articles of one language folder.
 *
 * @param locale the folder's language
 * @returns slug to title and date
 */
function learnOf(locale: string): Map<string, { title: string; updated?: string }> {
  // Read once.
  const hit = LEARN.get(locale);
  // Cached.
  if (hit) return hit;
  // The folder.
  const dir = path.join(ROOT, "src/content/learn", locale);
  // Slug to title and date.
  const out = new Map<string, { title: string; updated?: string }>();
  // Each article.
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith(".mdx")) : []) {
    // Its frontmatter.
    const fm = matter(fs.readFileSync(path.join(dir, f), "utf8")).data as { slug?: string; title?: string; updated?: unknown };
    // Without slug or title it is not an article.
    if (!fm.slug || !fm.title) continue;
    // The date as text (YAML may read it as a Date).
    const updated = fm.updated instanceof Date ? fm.updated.toISOString().slice(0, 10) : typeof fm.updated === "string" ? fm.updated.match(DAY)?.[0] : undefined;
    // Kept.
    out.set(fm.slug, { title: fm.title, updated });
  }
  // Cached.
  LEARN.set(locale, out);
  // Returned.
  return out;
}

/** The English articles: the canonical set, as the article route generates them. */
const LEARN_EN = learnOf("en");

/**
 * The latest of some days.
 *
 * @param days days or undefined
 * @returns the latest, or undefined
 */
function latest(days: (string | undefined)[]): string | undefined {
  // The defined ones, sorted, the last.
  return days.filter((d): d is string => typeof d === "string").sort().pop();
}

/** A tool's date: the day in its golden-vector set id. */
function toolDay(id: string): string | undefined {
  // The vectors file.
  const file = path.join(ROOT, "src/lib/tools", id, "golden-vectors.ts");
  // Missing: no date.
  if (!fs.existsSync(file)) return undefined;
  // The set id and its date.
  return fs.readFileSync(file, "utf8").match(/GOLDEN_VECTOR_SET_ID\s*=\s*"([^"]+)"/)?.[1].match(DAY)?.[0];
}

/** Each tool's date, read once. */
const TOOL_DAYS = new Map(tools.filter((t) => t.available).map((t) => [t.id, toolDay(t.id)]));

/**
 * A glossary entry's date: the latest "(read YYYY-MM-DD" among its sources' labels.
 *
 * @param labels the source labels
 * @returns the day, or undefined
 */
function termDay(labels: string[]): string | undefined {
  // Every read date in every label.
  return latest(labels.flatMap((l) => [...l.matchAll(/\(read (\d{4}-\d{2}-\d{2})/g)].map((m) => m[1])));
}

/**
 * The renamed and merged items: the Worker's merged glossary slugs, and the item-level rules of public/_redirects.
 *
 * @returns old identifier to new identifier
 */
function readRedirects(): Record<string, string> {
  // The result.
  const out: Record<string, string> = {};
  // The Worker's source, read as text (its maps are not exported).
  const worker = fs.readFileSync(path.join(ROOT, "worker/index.ts"), "utf8");
  // The merged glossary map's body.
  const merged = worker.match(/MERGED_GLOSSARY_SLUGS\s*=\s*new Map<[^>]*>\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
  // Each pair.
  for (const m of merged.matchAll(/\["([a-z0-9-]+)",\s*"([a-z0-9-]+)"\]/g)) out[`term:${m[1]}`] = `term:${m[2]}`;
  // The family of a path segment.
  const KIND: Record<string, string> = { tools: "tool", learn: "learn", glossary: "term" };
  // public/_redirects: "/en/<family>/<old>/ /en/<family>/<new>/ 301".
  for (const line of fs.readFileSync(path.join(ROOT, "public/_redirects"), "utf8").split("\n")) {
    // An item-level rule between two pages of the same family.
    const m = /^\/[a-z]{2}(?:-[A-Za-z]+)?\/(tools|learn|glossary)\/([a-z0-9-]+)\/?\s+\/[a-z]{2}(?:-[A-Za-z]+)?\/(tools|learn|glossary)\/([a-z0-9-]+)\/?\s+30[18]/.exec(line.trim());
    // Kept when both ends are items of the same kind.
    if (m && m[1] === m[3] && m[2] !== m[4]) out[`${KIND[m[1]]}:${m[2]}`] = `${KIND[m[3]]}:${m[4]}`;
  }
  // The map.
  return out;
}

/**
 * The index for one language.
 *
 * @param locale the language
 * @param redirects the renamed items
 * @returns the index object
 */
function build(locale: string, redirects: Record<string, string>): { v: 1; locale: string; day: string; items: Entry[]; redirects: Record<string, string> } {
  // The entries.
  const items: Entry[] = [];
  // Missing titles, reported at the end.
  const missing: string[] = [];
  // Whether this language carries the articles (otherwise their links go to English).
  const authored = (AUTHORED_CONTENT_LOCALES as readonly string[]).includes(locale);
  // This language's articles.
  const own = authored ? learnOf(locale) : new Map<string, { title: string; updated?: string }>();

  // Tools: every available tool.
  for (const t of tools) {
    // Only the live ones.
    if (!t.available) continue;
    // Its name.
    const title = packTitle(locale, `tools.${t.id}.name`);
    // No name anywhere.
    if (!title) { missing.push(`tool:${t.id}`); continue; }
    // The entry.
    items.push({ k: "tool", s: t.id, ...title, ...(TOOL_DAYS.get(t.id) ? { u: TOOL_DAYS.get(t.id) } : {}), c: t.category });
  }

  // Learn articles: the English set, the language's own title and date where it carries the articles.
  for (const [slug, en] of LEARN_EN) {
    // The language's own article.
    const mine = own.get(slug);
    // Its title and date, or English flagged.
    const t = mine ? { t: mine.title } : locale === "en" ? { t: en.title } : { t: en.title, e: 1 as const };
    // The date of the page the link opens.
    const u = mine?.updated ?? en.updated;
    // The entry.
    items.push({ k: "learn", s: slug, ...t, ...(u ? { u } : {}) });
  }

  // Glossary entries: the headword in every language.
  for (const g of GLOSSARY) {
    // The day its sources were last read.
    const u = termDay((g.sources ?? []).map((x) => x.label));
    // The entry.
    items.push({ k: "term", s: g.slug, t: g.headword, ...(u ? { u } : {}) });
  }

  // Games.
  for (const g of FUN_GAMES) {
    // The game's title.
    const title = packTitle(locale, `devFun.games.${g.id}.title`);
    // Missing.
    if (!title) { missing.push(`game:${g.id}`); continue; }
    // The entry.
    items.push({ k: "game", s: g.id, ...title });
  }

  /**
   * A collection's members as identifiers, the date among them, from article slugs (and tools).
   *
   * @param slugs the written articles, in order
   * @param toolIds tools that follow them
   * @returns the members and their latest date
   */
  const members = (slugs: string[], toolIds: string[] = []) => {
    // Only articles that exist.
    const arts = slugs.filter((s) => LEARN_EN.has(s));
    // Identifiers: articles, then tools that exist.
    const m = [...arts.map((s) => `learn:${s}`), ...toolIds.filter((id) => TOOL_DAYS.has(id)).map((id) => `tool:${id}`)];
    // The latest date among the articles (in this language where it carries them).
    const u = latest(arts.map((s) => own.get(s)?.updated ?? LEARN_EN.get(s)?.updated));
    // Both.
    return { m, ...(u ? { u } : {}) };
  };

  // Learn series.
  for (const s of LEARN_SERIES) {
    // Its title.
    const title = packTitle(locale, `learnSeries.items.${s.id}.title`);
    // Missing.
    if (!title) { missing.push(`series:${s.id}`); continue; }
    // Planned parts.
    const p = s.parts.filter((x) => "planned" in x).length;
    // The entry.
    items.push({ k: "series", s: s.id, ...title, ...members(seriesArticles(s)), ...(p ? { p } : {}) });
  }

  // Training series.
  for (const s of TRAINING_SERIES) {
    // Its title.
    const title = packTitle(locale, `studyGuidesIndex.training.items.${s.id}.title`);
    // Missing.
    if (!title) { missing.push(`training:${s.id}`); continue; }
    // Planned parts.
    const p = s.modules.flatMap((m) => m.parts).filter((x) => "planned" in x).length;
    // The entry.
    items.push({ k: "training", s: s.id, ...title, ...members(trainingArticles(s)), ...(p ? { p } : {}) });
  }

  // Curated reading paths: the articles in order, then the tools to practise on.
  for (const r of READING_PATHS) {
    // Its title.
    const title = packTitle(locale, `studyGuidesIndex.paths.${r.id}.title`);
    // Missing.
    if (!title) { missing.push(`reading:${r.id}`); continue; }
    // The entry.
    items.push({ k: "reading", s: r.id, ...title, ...members(r.articles, r.tools) });
  }

  // Certification study guides: the official exam name and code, the same in every language.
  // The code is not repeated when the official name already ends with it ("Cloud Solutions (402)").
  for (const g of studyGuides) items.push({ k: "guide", s: g.slug, t: g.examName.includes(`(${g.examCode})`) ? g.examName : `${g.examName} (${g.examCode})` });

  // A title missing in English too is a hard stop.
  if (missing.length > 0) {
    // Said.
    console.error(`${TAG} FAIL (${locale}): ${missing.length} item(s) with no title in any pack, e.g. ${missing.slice(0, 5).join(", ")}`);
    // Stopped.
    process.exit(1);
  }
  // Deterministic order: kind as listed, then slug.
  const order = ["tool", "learn", "term", "game", "series", "training", "reading", "guide"];
  // Sorted.
  items.sort((a, b) => (a.k === b.k ? (a.s < b.s ? -1 : a.s > b.s ? 1 : 0) : order.indexOf(a.k) - order.indexOf(b.k)));
  // The index (the day is the build's, for the reader's "as of").
  return { v: 1, locale, day: new Date().toISOString().slice(0, 10), items, redirects };
}

// The renamed items, the same for every language.
const redirects = readRedirects();
// The output folder, emptied of earlier files.
fs.mkdirSync(OUT_DIR, { recursive: true });
// Every earlier file goes: only the current names may be served.
for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith(".json")) fs.rmSync(path.join(OUT_DIR, f));
// Each language's file name.
const files: Record<string, string> = {};
// Sizes for the report.
const sizes: string[] = [];
// Each live language.
for (const locale of LIVE_LOCALE_CODES) {
  // Built.
  const index = build(locale, redirects);
  // Compact JSON (the day stays, so the content hash changes at most once a day when nothing else does).
  const text = JSON.stringify(index);
  // The hash of the content without the day, so an unchanged site keeps its file names across days.
  const hash = crypto.createHash("sha256").update(JSON.stringify({ ...index, day: "" })).digest("hex").slice(0, 10);
  // The file's name.
  const name = `${locale}.${hash}.json`;
  // Written.
  fs.writeFileSync(path.join(OUT_DIR, name), text);
  // Named for the page.
  files[locale] = `/desk-index/${name}`;
  // Its size, raw and compressed.
  sizes.push(`${locale} ${index.items.length} items ${(text.length / 1024).toFixed(0)} KB (${(zlib.gzipSync(text, { level: 9 }).length / 1024).toFixed(0)} KB gzip)`);
}
// The module the page imports.
const manifest =
  `// AUTO-GENERATED by scripts/gen-desk-index.mts at prebuild. Do not edit by hand.\n` +
  `// The current file of the desk's site index for each live language (a content hash in each name, so a browser may\n` +
  `// keep a file as long as it likes); fetched only by the desk page and its "add" pickers.\n` +
  `export const DESK_INDEX_FILES: Readonly<Record<string, string>> = ${JSON.stringify(files, null, 2)};\n`;
// Written only when it changed, so an unchanged site leaves the source tree untouched.
if (!fs.existsSync(MANIFEST) || fs.readFileSync(MANIFEST, "utf8") !== manifest) fs.writeFileSync(MANIFEST, manifest);
// Reported.
console.log(`${TAG} OK: ${Object.keys(redirects).length} redirect(s); ${sizes.join("; ")}; at public/desk-index/, named in src/generated/desk-index.ts`);
