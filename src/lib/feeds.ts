// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/feeds.ts
// ----------------------------------------------------------------------------
// WHERE THE LEARN FEEDS LIVE (PRIME 12/11/2026 12:42, "My desk", phase 3:
// "feeds per series and per language"). One RSS 2.0 feed per live language
// for all Learn articles, and one per Learn series per live language, made at
// prebuild by scripts/gen-feeds.mts into public/feeds/ and checked by
// scripts/check-feeds.mts. The original /feed.xml (English, the fifty newest
// articles, written after the build by scripts/gen-machine-legible.mts) stays
// where it is; nothing that links to it changes.
//
// WHY /feeds/<locale>/... AND NOT /<locale>/learn/feed.xml. In a language
// without the authored Learn corpus (es, de, fr, it) the Worker answers
// /<locale>/learn/<anything> with a redirect to English (isAuthoredOnlyRoute,
// src/i18n/corpus-routing.ts), so a feed there would never be served in its
// own language. A path outside the locale tree is served as the file it is.
//
// The addresses are root-relative, for a plain <a href> or a <link
// rel="alternate"> (not the locale-prefixing Link component: the feeds carry
// their language in the path already). Pure functions and constants only, so
// any component, server or client, may import this file.
// ============================================================================

// The languages the site is published in, and the one an unknown language falls back to.
import { DEFAULT_LOCALE, LIVE_LOCALE_CODES } from "@/i18n/locales";

/** The folder the feeds are served from (public/feeds/ in the repository, /feeds/ on the site). */
export const FEEDS_DIR = "feeds";

/** The media type of every feed, for <link rel="alternate" type="..."> and the served Content-Type. */
export const FEED_MEDIA_TYPE = "application/rss+xml";

/** A series id as the registry writes them (src/content/learn/series.ts): lower-case words and hyphens. */
const SERIES_ID = /^[a-z0-9][a-z0-9-]*$/;

/**
 * The language a feed address carries: the one asked for when the site is published in it, else the default, so a
 * link never points at a feed that was not made.
 *
 * @param locale a locale code
 * @returns a live locale code
 */
function feedLocale(locale: string): string {
  // Only a published language has feeds.
  return LIVE_LOCALE_CODES.includes(locale) ? locale : DEFAULT_LOCALE;
}

/**
 * The feed of every Learn article in a language: the fifty most recently updated.
 *
 * @param locale the page's language
 * @returns the root-relative address, e.g. "/feeds/pt-BR/learn.xml"
 */
export function feedUrlForLocale(locale: string): string {
  // One file per language.
  return `/${FEEDS_DIR}/${feedLocale(locale)}/learn.xml`;
}

/**
 * The feed of one Learn series in a language: its opener and every written part, in reading order.
 *
 * @param locale the page's language
 * @param seriesId the series' id (LEARN_SERIES[i].id)
 * @returns the root-relative address, e.g. "/feeds/en/series/traffic-diversion.xml"
 * @throws when the id is not shaped like a series id (a programming error, never a reader's input)
 */
export function feedUrlForSeries(locale: string, seriesId: string): string {
  // A series id is a slug; anything else would make an address no feed has.
  if (!SERIES_ID.test(seriesId)) throw new Error(`feedUrlForSeries: "${seriesId}" is not a series id`);
  // One file per series per language.
  return `/${FEEDS_DIR}/${feedLocale(locale)}/series/${seriesId}.xml`;
}
