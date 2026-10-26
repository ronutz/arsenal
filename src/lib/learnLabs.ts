// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/learnLabs.ts
// ----------------------------------------------------------------------------
// WHICH ARTICLES ARE INTERACTIVE (2026-10-26). The "Interactive" marker on the
// Learn index, the series rails, the series index and the article header reads
// one fact: does this article's body, in the page's language, embed a lab?
// Derived from the body (src/content/learn/labs.ts says how a lab is written),
// so the marker can never claim a lab that is not on the page. Build time only.
// ============================================================================

import { getAllArticles, getArticle } from "@/lib/learn";
import { labIdsIn } from "@/content/learn/labs";

/** The lab ids embedded by an article in a locale (English fallback, like the article itself); [] when none or missing. */
export function articleLabIds(slug: string, locale: string): string[] {
  // The article as the page would show it.
  const a = getArticle(slug, locale);
  // No article, no labs; otherwise the ids its body embeds.
  return a ? labIdsIn(a.body) : [];
}

/** True when the article embeds at least one lab in that locale. */
export function isInteractive(slug: string, locale: string): boolean {
  // One lab is enough for the marker.
  return articleLabIds(slug, locale).length > 0;
}

/** Every interactive article of a locale, by title, each with the ids of its labs. */
export function interactiveArticles(locale: string): { slug: string; title: string; summary: string; labs: string[] }[] {
  // Every article of the locale (English fallback per article), kept when its body embeds a lab.
  return getAllArticles(locale)
    .map((a) => ({ slug: a.slug, title: a.title, summary: a.summary, labs: labIdsIn(a.body) }))
    .filter((a) => a.labs.length > 0);
}
