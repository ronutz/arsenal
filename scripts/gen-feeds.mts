#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/gen-feeds.mts
// ----------------------------------------------------------------------------
// THE LEARN FEEDS PER LANGUAGE AND PER SERIES (PRIME 12/11/2026 12:42, "My
// desk", phase 3). For a reader who follows the site in a feed reader rather
// than on their desk: one RSS 2.0 feed per live language with the fifty most
// recently updated Learn articles, and one per Learn series per live
// language with the series' opener and every written part, in reading order.
//
// WRITTEN AT PREBUILD INTO public/feeds/ (gitignored, like public/og/ and
// public/home-index.json), so `next build` copies them into out/feeds/ and
// the postbuild link check sees them. scripts/check-feeds.mts runs right
// after this and fails the build when a series or a language has no feed or a
// feed does not parse. The addresses come from src/lib/feeds.ts, the same
// functions the series pages link with, so a link and a file cannot disagree.
//
// THE SAME TITLES AS THE PAGES. Each item's title, summary and date come from
// the article as src/lib/learn.ts loads it in the feed's language (the
// English article where the language has no version of its own), and its
// link is the address the site's own links use (linkLocaleFor,
// src/i18n/corpus-routing.ts): /<locale>/learn/<slug>/ where the language
// carries the Learn articles (en, pt-BR), /en/learn/<slug>/ elsewhere, where
// the channel's description then says the articles open in English.
//
// THE ORIGINAL /feed.xml is untouched: scripts/gen-machine-legible.mts still
// writes it after the build, and every link to it stays good.
//
// Deterministic: a feed's lastBuildDate is its newest item's date, not the
// clock, so the same content gives the same bytes.
// ============================================================================

// Files and paths.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// The series registry and the articles each one is made of.
import { LEARN_SERIES, seriesArticles } from "../src/content/learn/series";
// The articles, loaded exactly as the pages load them.
import { getAllArticles, getArticle, type Article } from "../src/lib/learn";
// The languages the site is published in.
import { LIVE_LOCALE_CODES } from "../src/i18n/locales";
// Where a link to an article goes from a page in a language.
import { carriesAuthoredContent, linkLocaleFor } from "../src/i18n/corpus-routing";
// The feeds' addresses and media type.
import { FEEDS_DIR, FEED_MEDIA_TYPE, feedUrlForLocale, feedUrlForSeries } from "../src/lib/feeds";

/** Repository root. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The tag on every line of output. */
const TAG = "[gen-feeds]";
/** The site's origin: every address in a feed is absolute. */
export const ORIGIN = "https://ronutz.com";
/** Where the feeds are written. */
const OUT = path.join(ROOT, "public", FEEDS_DIR);
/** How many articles a language's feed carries (the original /feed.xml carries the same number). */
export const LOCALE_FEED_ITEMS = 50;

/** A message pack, as parsed JSON. */
type Pack = Record<string, unknown>;
/** The packs, read once. */
const PACKS: Record<string, Pack> = Object.fromEntries(
  LIVE_LOCALE_CODES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src", "i18n", "messages", `${l}.json`), "utf8")) as Pack]),
);

/**
 * One message, in a language, with the English one where the language has none (the site's own fallback).
 *
 * @param locale the language
 * @param dotted the key, dotted
 * @returns the text
 * @throws when English has no such key either (a feed must never carry a key's name)
 */
function message(locale: string, dotted: string): string {
  // Walk a pack to the key.
  const walk = (pack: Pack | undefined): unknown => dotted.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Pack)[part] : undefined), pack);
  // The language's text, else English's.
  const v = walk(PACKS[locale]) ?? walk(PACKS.en);
  // A missing key stops the build here, with its name.
  if (typeof v !== "string") throw new Error(`${TAG} no message ${dotted} in ${locale} or en`);
  return v;
}

/**
 * Text made safe for XML: &, <, > and " escaped (as the original /feed.xml escapes them; an apostrophe needs no escape
 * in text or in a double-quoted attribute), and the characters XML 1.0 forbids removed.
 *
 * @param s the text
 * @returns the escaped text
 */
export function xmlText(s: string): string {
  // Control characters other than tab, line feed and carriage return are not allowed in XML 1.0 at all.
  // eslint-disable-next-line no-control-regex
  const clean = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "");
  // The four entities text and double-quoted attributes need.
  return clean.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * An article's date, from its frontmatter (a quoted day, or a date YAML already parsed).
 *
 * @param a the article
 * @returns the instant, or null when it has none
 */
function dateOf(a: Article): Date | null {
  // The field as loaded.
  const raw = (a as { updated?: unknown }).updated;
  // Nothing.
  if (raw === undefined || raw === null || raw === "") return null;
  // A Date or a day.
  const d = raw instanceof Date ? raw : new Date(String(raw));
  // Only a real instant.
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * An article's address, as a link from a page in this language points at it.
 *
 * @param locale the feed's language
 * @param slug the article's slug
 * @returns the absolute address
 */
function articleUrl(locale: string, slug: string): string {
  // The route without a language, then the language a link carries to it.
  const route = `/learn/${slug}`;
  return `${ORIGIN}/${linkLocaleFor(locale, route)}${route}/`;
}

/** One feed, ready to write. */
export interface Feed {
  /** The address it is served at, root-relative ("/feeds/en/learn.xml"). */
  url: string;
  /** The language. */
  locale: string;
  /** The series' id, or null for a language's feed. */
  series: string | null;
  /** The slugs of its items, in order. */
  slugs: string[];
  /** The document. */
  xml: string;
}

/**
 * One RSS 2.0 document.
 *
 * @param channel the channel's title, page address, description, language and own address
 * @param items the articles, in the order to list them
 * @returns the XML
 */
function rss(channel: { title: string; link: string; description: string; locale: string; self: string }, items: Article[]): string {
  // The newest item's date stands for the channel's (deterministic, unlike the clock).
  const newest = items.map(dateOf).filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0];
  // The head of the document.
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xmlText(channel.title)}</title>`,
    `    <link>${xmlText(channel.link)}</link>`,
    `    <description>${xmlText(channel.description)}</description>`,
    `    <language>${xmlText(channel.locale)}</language>`,
    ...(newest ? [`    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>`] : []),
    `    <atom:link href="${xmlText(`${ORIGIN}${channel.self}`)}" rel="self" type="${FEED_MEDIA_TYPE}" />`,
  ];
  // Each article.
  for (const a of items) {
    // Its address, also its permanent id.
    const link = articleUrl(channel.locale, a.slug);
    // Its date.
    const d = dateOf(a);
    lines.push(
      "    <item>",
      `      <title>${xmlText(a.title)}</title>`,
      `      <link>${xmlText(link)}</link>`,
      `      <guid isPermaLink="true">${xmlText(link)}</guid>`,
      ...(d ? [`      <pubDate>${d.toUTCString()}</pubDate>`] : []),
      ...(a.summary ? [`      <description>${xmlText(String(a.summary))}</description>`] : []),
      "    </item>",
    );
  }
  // The end of the document.
  lines.push("  </channel>", "</rss>", "");
  return lines.join("\n");
}

/**
 * Every feed, built in memory (the check reads the files this writes; nothing else calls this).
 *
 * @returns the feeds, a language's first and then its series in the registry's order
 */
export function buildFeeds(): Feed[] {
  // The site's name, the same in every language.
  const out: Feed[] = [];
  for (const locale of LIVE_LOCALE_CODES) {
    // The site's name and, where the language does not carry the articles, the sentence that says they open in English.
    const site = message(locale, "site.name");
    const note = carriesAuthoredContent(locale) ? "" : ` ${message(locale, "feeds.englishNote")}`;
    // ---- The language's feed: the newest articles ----------------------------------
    const newest = getAllArticles(locale)
      // Articles with a slug, a title and a date.
      .filter((a) => a.slug && a.title && dateOf(a) !== null)
      // The most recently updated first, the slug breaking ties so the order never wobbles.
      .sort((a, b) => dateOf(b)!.getTime() - dateOf(a)!.getTime() || a.slug.localeCompare(b.slug))
      // As many as the original feed carries.
      .slice(0, LOCALE_FEED_ITEMS);
    // Its address.
    const url = feedUrlForLocale(locale);
    out.push({
      url,
      locale,
      series: null,
      slugs: newest.map((a) => a.slug),
      xml: rss({ title: `${site} · ${message(locale, "learn.eyebrow")}`, link: `${ORIGIN}/${locale}/learn/`, description: `${message(locale, "learn.lede")}${note}`, locale, self: url }, newest),
    });
    // ---- Each series: its opener and written parts, in reading order -----------------
    for (const s of LEARN_SERIES) {
      // The articles, each as the page shows it in this language; a slug with no article is left out (the series
      // guard, scripts/check-learn-series.mjs, already fails the build for one).
      const items = seriesArticles(s).map((slug) => getArticle(slug, locale)).filter((a): a is Article => a !== null);
      // Its address.
      const surl = feedUrlForSeries(locale, s.id);
      out.push({
        url: surl,
        locale,
        series: s.id,
        slugs: items.map((a) => a.slug),
        xml: rss({
          title: `${site} · ${message(locale, `learnSeries.items.${s.id}.title`)}`,
          // The series index page, at the series' own anchor (generated in every live language).
          link: `${ORIGIN}/${locale}/learn/series/#${s.id}`,
          description: `${message(locale, `learnSeries.items.${s.id}.lede`)}${note}`,
          locale,
          self: surl,
        }, items),
      });
    }
  }
  return out;
}

// ---- Written when run as a script (scripts/check-feeds.mts imports the constants and buildFeeds) ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // The feeds.
  const feeds = buildFeeds();
  // A fresh folder, so a series that left the registry leaves no feed behind.
  fs.rmSync(OUT, { recursive: true, force: true });
  // Each file at its address under public/.
  for (const f of feeds) {
    // public/ + the address.
    const file = path.join(ROOT, "public", ...f.url.split("/").filter(Boolean));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, f.xml, "utf8");
  }
  // What was written.
  const languages = new Set(feeds.map((f) => f.locale)).size;
  const series = feeds.filter((f) => f.series !== null).length;
  console.log(`${TAG} wrote ${feeds.length} feeds to public/${FEEDS_DIR}/: ${languages} language feeds and ${series} series feeds (${LEARN_SERIES.length} series x ${languages} languages).`);
}
