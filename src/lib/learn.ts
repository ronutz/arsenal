// ============================================================================
// src/lib/learn.ts
// ----------------------------------------------------------------------------
// THE LEARN CONTENT LOADER — the single source of Learn articles that BOTH
// surfaces consume: (a) the in-tool contextual panels and (b) the standalone
// Learn/reference section. This is the "content as data" core (canon C-18):
// articles live as MDX files with frontmatter, never hardcoded into a page.
//
// WHY one loader: a tool's contextual Learn panel and the full reference page
// must show the SAME content from the SAME source, or they drift. Both call
// here. The manifest's learnLinks[] field (the Tools->Learn bridge, D-27.j)
// resolves through getArticlesForTool().
//
// Runs at build time only (static export) — reads the filesystem, so it is a
// server module. Articles are keyed by slug and tagged with concepts + related
// tools/articles for cross-linking.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/** Article frontmatter contract — every MDX file declares these fields. */
export interface ArticleFrontmatter {
  slug: string;
  title: string;
  summary: string;
  /** Concept tags this article covers (e.g. "cidr", "subnetting"). */
  concepts: string[];
  /** Tool slugs this article relates to (drives in-tool panels). */
  relatedTools: string[];
  /** Slugs of related articles (drives "read next" cross-links). */
  relatedArticles: string[];
  /** Translation/quality status, mirroring the i18n + credential model. */
  status: "reviewed" | "machine-draft" | "stub";
  updated: string;
}

/** A loaded article: its frontmatter plus the raw MDX body. */
export interface Article extends ArticleFrontmatter {
  /** The MDX body (compiled to React at render time by the page). */
  body: string;
}

// Content lives under src/content/learn/<locale>/. English is the source;
// other locales mirror the structure as translations land (same pattern as
// the message packs). Missing-locale articles fall back to English.
const CONTENT_ROOT = path.join(process.cwd(), "src", "content", "learn");
const SOURCE_LOCALE = "en";

/** Resolve the content directory for a locale, falling back to English. */
function localeDir(locale: string): string {
  const dir = path.join(CONTENT_ROOT, locale);
  return fs.existsSync(dir) ? dir : path.join(CONTENT_ROOT, SOURCE_LOCALE);
}

/**
 * getAllArticles — every article for a locale (English fallback). Used by the
 * Learn section index and to build the search index.
 */
export function getAllArticles(locale: string = SOURCE_LOCALE): Article[] {
  const dir = localeDir(locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      return { ...(data as ArticleFrontmatter), body: content };
    })
    // Stable, predictable order: by title.
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** getArticle — one article by slug (English fallback), or null if missing. */
export function getArticle(slug: string, locale: string = SOURCE_LOCALE): Article | null {
  return getAllArticles(locale).find((a) => a.slug === slug) ?? null;
}

/** All article slugs (for generateStaticParams on the Learn article route). */
export function getAllArticleSlugs(locale: string = SOURCE_LOCALE): string[] {
  return getAllArticles(locale).map((a) => a.slug);
}

/**
 * getArticlesForTool — the Tools->Learn bridge. Given a tool slug, return the
 * articles that list it in relatedTools. This is what an in-tool Learn panel
 * calls to show contextual learning for THAT tool.
 */
export function getArticlesForTool(toolSlug: string, locale: string = SOURCE_LOCALE): Article[] {
  return getAllArticles(locale).filter((a) => a.relatedTools.includes(toolSlug));
}

/**
 * getRelatedArticles — resolve an article's relatedArticles slugs to their
 * summaries, for "read next" links. Skips any slug that does not resolve.
 */
export function getRelatedArticles(article: Article, locale: string = SOURCE_LOCALE): Article[] {
  const all = getAllArticles(locale);
  return article.relatedArticles
    .map((slug) => all.find((a) => a.slug === slug))
    .filter((a): a is Article => a != null);
}
