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
  /**
   * The post's number in publication order, 1 for the first post (PRIME 16/11/2026 03:54: the index shows it).
   * Declared ONCE, in the English file: a translation inherits it by slug (see getAllPosts), so the two languages can
   * never number the same post differently. check-blog keeps the numbers unique, gap-free and in date order.
   */
  number: number;
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
  /**
   * Optional single illustration, shaped exactly like a glossary entry's so
   * the two surfaces stay consistent. SITE POLICY, unchanged: original art or
   * the author's own photographs of objects he owns - never a third party's
   * image. `alt` is required by the type because an image with no alt text is
   * a defect, not a style choice; `caption` is optional because not every
   * photograph needs explaining.
   */
  image?: { src: string; alt: string; caption?: string; credit?: string };
  /**
   * An optional SECOND illustration, rendered AFTER the body.
   *
   * Not an arbitrary extra slot: some posts open with an artefact and close
   * with its consequence. The switch-lineage post opens on a 1996 identity
   * badge and ends on where all those companies went, and those two pictures
   * do different jobs at different points. A post that needs a third probably
   * needs prose instead.
   *
   * `credit` exists for third-party work: a CC BY-SA diagram must name its
   * author and licence on the page, which a caption alone does not do.
   */
  imageEnd?: { src: string; alt: string; caption?: string; credit?: string };
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

/** Newest first — the only sane default order for dated commentary. Posts of the same day go by number, highest first
 *  (16/11/2026), so the numbers on the index always count down; the title only breaks a tie the numbers cannot. */
function byDateDesc(a: Post, b: Post): number {
  return b.date.localeCompare(a.date) || (b.number ?? 0) - (a.number ?? 0) || a.title.localeCompare(b.title);
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
    const en = bySlug.get(p.slug); // the English post this translation overrides, if any
    // The localized post overrides the English one, but keeps the English number: the number is declared once.
    bySlug.set(p.slug, en ? { ...p, number: en.number } : p);
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

/**
 * countBy: how many posts carry each key, for the index's filter chips (PRIME 16/11/2026 03:54: categories and filters).
 * `keysOf` gives one post's keys (its single category, or its tags); the result maps each key to its post count, so the
 * page can order the chips by how much there is to read behind them.
 */
export function countBy(posts: Post[], keysOf: (p: Post) => string[]): Map<string, number> {
  const counts = new Map<string, number>(); // key to post count
  for (const p of posts) for (const k of new Set(keysOf(p))) counts.set(k, (counts.get(k) ?? 0) + 1); // a post counts once per key
  return counts; // insertion order: first seen first
}
