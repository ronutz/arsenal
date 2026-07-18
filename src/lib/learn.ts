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
import { tools } from "@/config/tools";
import { isVendor } from "@/config/vendors";

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
  /**
   * Category KEY (matches the tool category keys: identity, encoding, hashing,
   * identifiers, networking). Drives the grouped Learn index. The human-readable
   * label is resolved in the page layer via the i18n "tools.categories.*" keys,
   * so one label set serves both the tools index and the Learn index.
   */
  category: string;
  /** Vendor sub-category override (tools.subs.<vendor>.<sub>); usually derived
   *  from relatedTools instead, see getArticleSub. */
  sub?: string;
  /** Translation/quality status, mirroring the i18n + credential model. */
  status: "reviewed" | "machine-draft" | "stub";
  updated: string;
  /**
   * Curated position within its category (1-based, foundational -> advanced).
   * Drives the Learn index order WITHIN a category, because Learn articles have
   * prerequisites and read best in sequence (unlike the Tools index, which is
   * alphabetical). Synced identically across locales, like relatedArticles.
   * Optional: an article without it sorts after ordered ones, by title.
   */
  order?: number;
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

/** Read every .mdx in a directory into Article objects (empty if the dir is absent). */
function readArticlesFrom(dir: string): Article[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      return { ...(data as ArticleFrontmatter), body: content };
    });
}

/**
 * getAllArticles — every article for a locale, with PER-ARTICLE English
 * fallback. English is the complete source set; for any other locale we start
 * from English and override, by slug, with whichever articles have a localized
 * file. This lets a locale be translated one article at a time: untranslated
 * articles fall back to English individually (mirroring the message-pack
 * deepMerge model), rather than a whole-directory all-or-nothing fallback that
 * would hide every not-yet-translated article. Used by the Learn index, the
 * in-tool panels, and the search index.
 */
export function getAllArticles(locale: string = SOURCE_LOCALE): Article[] {
  const source = readArticlesFrom(path.join(CONTENT_ROOT, SOURCE_LOCALE));
  if (locale === SOURCE_LOCALE) {
    return source.sort((a, b) => a.title.localeCompare(b.title));
  }
  const bySlug = new Map<string, Article>(source.map((a) => [a.slug, a]));
  for (const a of readArticlesFrom(path.join(CONTENT_ROOT, locale))) {
    bySlug.set(a.slug, a); // localized article overrides the English one
  }
  // Stable, predictable order: by title.
  return [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title));
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

/**
 * Display order for Learn categories, mirroring the tools index order so the
 * two sections feel like one taxonomy. Keys map to "tools.categories.*" labels.
 */
export const LEARN_CATEGORY_ORDER = [
  "identity",
  "encoding",
  "hashing",
  "identifiers",
  "pki",
  "transport",
  "networking",
  "security",
] as const;

/** A category group: its KEY (label resolved in the page) plus its articles. */
export interface CategoryGroup {
  category: string;
  articles: Article[];
}

/**
 * getArticlesByCategory — articles grouped for the Learn index, in
 * LEARN_CATEGORY_ORDER. Empty categories are dropped; any article whose
 * category is not in the known order is appended in a trailing group so nothing
 * silently disappears. Within a group, articles keep the title sort.
 */
export function getArticlesByCategory(locale: string = SOURCE_LOCALE): CategoryGroup[] {
  // Vendor-tagged articles are excluded here: the generic Learn categories are
  // vendor-agnostic only; vendor content lives on the vendor hubs.
  const articles = getAllArticles(locale).filter((a) => !isVendorArticle(a));
  // Within a category, curated progression order wins; title is the tiebreak
  // for any article that has not been assigned an order yet.
  const byOrder = (a: Article, b: Article) =>
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.title.localeCompare(b.title);
  const known: CategoryGroup[] = LEARN_CATEGORY_ORDER.map((category) => ({
    category,
    articles: articles.filter((a) => a.category === category).sort(byOrder),
  })).filter((g) => g.articles.length > 0);

  // Safety net: surface any unexpected categories rather than hiding them.
  const knownKeys = new Set<string>(LEARN_CATEGORY_ORDER);
  const orphans = articles.filter((a) => !knownKeys.has(a.category));
  const orphanGroups: CategoryGroup[] = [];
  for (const a of orphans) {
    let g = orphanGroups.find((x) => x.category === a.category);
    if (!g) {
      g = { category: a.category, articles: [] };
      orphanGroups.push(g);
    }
    g.articles.push(a);
  }
  for (const g of orphanGroups) g.articles.sort(byOrder);

  return [...known, ...orphanGroups];
}


// ============================================================================
// getArticleVendors — the vendor families an article belongs to, for the
// /learn browse-by-vendor filter. TWO signals, unioned, because the "f5"
// concept tag is applied INCONSISTENTLY across the corpus:
//   1. any vendor KEY that appears directly in the article's concepts, and
//   2. the vendors of every tool the article relates to (relatedTools ->
//      tool.vendors).
// Signal 2 is what makes this correct: it catches the F5 articles (BIG-IP
// cookies, iRules, F5 XC service policies, etc.) that link to an F5 tool but
// were never tagged "f5" in concepts. As of 2026-07-07 all 83 F5 articles DO
// carry the vendor concept (the 23 that had only linked an F5 tool were
// backfilled), so signal 1 alone now suffices; signal 2 stays as the safety net
// that keeps classification correct for any future article added without the
// tag. Pure function of the article + tool registry, no state.
// ============================================================================
export function getArticleVendors(article: Article): string[] {
  const set = new Set<string>();
  for (const concept of article.concepts) {
    if (isVendor(concept)) set.add(concept);
  }
  for (const slug of article.relatedTools) {
    const tool = tools.find((t) => t.id === slug);
    // vendorNeutral tools are open-standard tools with a hub AFFILIATION only;
    // an article about the standard (JWT, OIDC, TOTP, ...) does not become a
    // vendor article by referencing them (see src/config/tools.ts - the
    // 2026-07-18 identity-category regression).
    if (tool?.vendors && !tool.vendorNeutral) {
      for (const vendor of tool.vendors) set.add(vendor);
    }
  }
  return Array.from(set);
}

// ============================================================================
// getArticleSub — the vendor sub-category an article belongs to on a vendor
// hub. Explicit front-matter `sub:` wins; otherwise the first relatedTool
// carrying that vendor with a sub supplies it. Returns null when nothing
// resolves (the hub buckets those under its trailing group so nothing
// silently disappears).
// ============================================================================
export function getArticleSub(article: Article, vendor: string): string | null {
  if (article.sub) return article.sub;
  for (const slug of article.relatedTools) {
    const tool = tools.find((t) => t.id === slug);
    if (tool?.sub && (tool.vendors ?? []).includes(vendor)) return tool.sub;
  }
  return null;
}

/** Vendor-tagged articles live on their vendor hub, not in the generic
 *  categories (PRIME directive 2026-07-03: non-vendor categories are
 *  vendor-agnostic and integration content only). */
export function isVendorArticle(article: Article): boolean {
  return getArticleVendors(article).length > 0;
}
