// ============================================================================
// src/lib/blog.ts
// ----------------------------------------------------------------------------
// THE BLOG CONTENT LOADER — dated commentary and current-events posts, kept
// deliberately SEPARATE from the two neighbouring content types it could be
// confused with:
//   - Learn (src/lib/learn.ts) is educational and EVERGREEN: it teaches a
//     concept that should still read correctly in five years.
//   - the changelog is PRODUCT news: what shipped on this site.
//   - the blog is DATED OPINION: commentary on something happening in the
//     industry, written from a point of view, true as of its date.
// Mixing them would erode all three, so the blog gets its own route, its own
// loader, and its own frontmatter contract (author + date + tags).
//
// Ratified by PRIME 2026-07-23: URL /blog, byline "Rodolfo Nützmann", reusing
// the existing category taxonomy rather than inventing a parallel one, and
// built on the Learn MDX + frontmatter pattern so the risk stays low and the
// renderer is shared.
//
// Runs at build time only (static export): reads the filesystem, server module.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/** Post frontmatter contract — every blog MDX file declares these fields. */
export interface PostFrontmatter {
  slug: string;
  title: string;
  summary: string;
  /** Byline. PRIME ruling 2026-07-23: "Rodolfo Nützmann" in full, per the
   *  naming guardrail that governs all formal/public copy on this site. */
  author: string;
  /** Publication date, ISO (YYYY-MM-DD). Drives the reverse-chronological index. */
  date: string;
  /** Free-form topic tags shown on the post (e.g. "ai", "incident-response"). */
  tags: string[];
  /** Category KEY reused from the tools/Learn taxonomy (PRIME: reuse categories),
   *  so a post groups under the same labels the rest of the site already uses. */
  category: string;
  /** Editorial status, mirroring the Learn model. */
  status: "reviewed" | "machine-draft" | "stub";
  /** Last substantive edit, ISO. */
  updated: string;
  /** Optional Learn article slugs for further (evergreen) reading. */
  relatedArticles?: string[];
}

/** A loaded post: frontmatter plus the raw MDX body. */
export interface Post extends PostFrontmatter {
  body: string;
}

// Content lives under src/content/blog/<locale>/. English is the source set;
// other locales override per-slug as translations land, exactly like Learn.
const CONTENT_ROOT = path.join(process.cwd(), "src", "content", "blog");
const SOURCE_LOCALE = "en";

/** Read every .mdx in a directory into Post objects (empty if the dir is absent). */
function readPostsFrom(dir: string): Post[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      return { ...(data as PostFrontmatter), body: content };
    });
}

/** Newest first — the only sane default order for dated commentary. */
function byDateDesc(a: Post, b: Post): number {
  return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
}

/**
 * getAllPosts — every post for a locale, with PER-POST English fallback:
 * start from the English source set and override by slug with any localized
 * file, so a locale can be translated one post at a time (the same model the
 * Learn loader and the message packs use).
 */
export function getAllPosts(locale: string = SOURCE_LOCALE): Post[] {
  const source = readPostsFrom(path.join(CONTENT_ROOT, SOURCE_LOCALE));
  if (locale === SOURCE_LOCALE) return source.sort(byDateDesc);
  const bySlug = new Map<string, Post>(source.map((p) => [p.slug, p]));
  for (const p of readPostsFrom(path.join(CONTENT_ROOT, locale))) {
    bySlug.set(p.slug, p); // localized post overrides the English one
  }
  return [...bySlug.values()].sort(byDateDesc);
}

/** getPost — one post by slug (English fallback), or null if missing. */
export function getPost(slug: string, locale: string = SOURCE_LOCALE): Post | null {
  return getAllPosts(locale).find((p) => p.slug === slug) ?? null;
}

/** All post slugs (for generateStaticParams on the post route). */
export function getAllPostSlugs(locale: string = SOURCE_LOCALE): string[] {
  return getAllPosts(locale).map((p) => p.slug);
}

/** Distinct tags across all posts, alphabetical (for the index's tag rail). */
export function getAllPostTags(locale: string = SOURCE_LOCALE): string[] {
  const tags = new Set<string>();
  for (const p of getAllPosts(locale)) for (const t of p.tags ?? []) tags.add(t);
  return [...tags].sort((a, b) => a.localeCompare(b));
}
