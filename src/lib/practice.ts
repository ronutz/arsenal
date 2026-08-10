// ============================================================================
// src/lib/practice.ts
// ----------------------------------------------------------------------------
// THE PRACTICE — the corpus about how the work is done.
//
// Ratified by PRIME 2026-08-06, all six questions answered: top-level
// /practice/, named "The Practice", stance field adopted as a requirement
// (** REVERSED BY PRIME 2026-08-09: the schema was removed. Every article
// turned out to be first-hand, so a three-value marker distinguished
// nothing and the page now states the provenance in prose instead **),
// 48-article roster approved, Part II written first, and §9.4 left standing
// (no legal entity named anywhere in public copy).
//
// WHAT SEPARATES THIS FROM /learn. Learn holds technical explainers tied to
// products and certifications - how BIG-IP DNS orders request processing, how a
// cipher string parses. A reader arrives there holding a PROTOCOL question.
// This corpus is about how the work is done: triage, escalation, evidence,
// handover, the rota. A reader arrives holding a PROFESSIONAL question. Same
// author, same rigour, different shelf.
//
// *** THE STANCE FIELD IS THE POINT OF THIS FILE. ***
//
// PRIME's brief was "everything I did, plus many more things I didn't get to
// do." Written naively that produces forty-eight articles under one name which
// together IMPLY thirty years of first-hand experience of all forty-eight
// subjects. That is not true, and on a site whose entire thesis is "tools that
// compute, never guess" it would be the first dishonest thing published.
//
// So every article MUST declare where its authority comes from. The renderer
// shows it, the guard enforces it, and a reader can therefore tell testimony
// from scholarship without having to guess. It also makes the practised pages
// land harder, because they are distinguishable rather than assumed.
//
// The mechanism is deliberately the same one the vendor profiles use for
// sourceNote: state the provenance in the artefact rather than trusting the
// author to remember.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * WHERE AN ARTICLE'S AUTHORITY COMES FROM. Required on every article; there is
 * deliberately no default, because a default is how an unexamined claim gets
 * made silently.
 */


/**
 * The six parts of the spine, in reading order.
 *
 * The order is a FACT rather than a judgement, which is the property that makes
 * the industry timeline maintainable: it follows the life of a system from
 * before it exists to after it is gone. Nobody has to decide where a new
 * article goes - the work itself says.
 */
export type PracticePart =
  | "before" // I.   Before it breaks
  | "breaks" // II.  When it breaks
  | "yield" // III. When it will not yield
  | "after" // IV.  After it is over
  | "life" // V.   The life
  | "craft"; // VI.  The craft

export const PRACTICE_PARTS: readonly PracticePart[] = [
  "before",
  "breaks",
  "yield",
  "after",
  "life",
  "craft",
] as const;

/** Roles this work belongs to. Drives a computed view, never a maintained list. */
export type PracticeRole =
  | "first-line"
  | "second-line"
  | "field"
  | "design"
  | "management";

export interface PracticeFrontmatter {
  slug: string;
  title: string;
  /** A thesis, not a summary: what this article argues, in one line. */
  thesis: string;
  part: PracticePart;
  /** Position within the part. */
  order: number;
  roles: PracticeRole[];
  /** Tool slugs on this site that do the job described. */
  relatedTools: string[];
  /** Industry entry slugs whose history illustrates the point. */
  relatedIndustry: string[];
  /** Other practice slugs worth reading next. */
  relatedPractice: string[];
  /**
   * Whether the article produces something reusable - a checklist, a template,
   * a question set. Drives the "by artefact" view.
   */
  artefact?: string;
  /**
   * Where sources are cited. Where the description comes from, so
   * that an article carrying no personal experience still carries provenance.
   * The guard enforces this pairing.
   */
  sources?: string[];
  updated: string;
}

export interface PracticeArticle extends PracticeFrontmatter {
  /** The MDX body, compiled to React at render time by the page. */
  body: string;
  locale: string;
}

const ROOT = path.join(process.cwd(), "src", "content", "practice");

/** Locales with natively authored practice articles. Others fall back to en. */
export function practiceLocales(): string[] {
  if (!fs.existsSync(ROOT)) return [];
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/**
 * Load every article for a locale, falling back to English per FILE (not per
 * key) - an article either exists in a locale or it does not, and a half
 * translated article is worse than an English one.
 */
export function getPracticeArticles(locale: string): PracticeArticle[] {
  const dir = fs.existsSync(path.join(ROOT, locale))
    ? path.join(ROOT, locale)
    : path.join(ROOT, "en");
  if (!fs.existsSync(dir)) return [];

  const articles = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      return { ...(data as PracticeFrontmatter), body: content, locale };
    });

  // Spine order: part first (in PRACTICE_PARTS order), then order within part.
  return articles.sort((a, b) => {
    const pa = PRACTICE_PARTS.indexOf(a.part);
    const pb = PRACTICE_PARTS.indexOf(b.part);
    return pa !== pb ? pa - pb : a.order - b.order;
  });
}

export function getPracticeArticle(
  locale: string,
  slug: string,
): PracticeArticle | undefined {
  return getPracticeArticles(locale).find((a) => a.slug === slug);
}

/** Articles grouped by part, in spine order. Empty parts are omitted. */
export function practiceByPart(
  locale: string,
): { part: PracticePart; articles: PracticeArticle[] }[] {
  const all = getPracticeArticles(locale);
  return PRACTICE_PARTS.map((part) => ({
    part,
    articles: all.filter((a) => a.part === part),
  })).filter((g) => g.articles.length > 0);
}

/**
 * COMPUTED VIEWS, never maintained lists. Same principle as the industry tag
 * chips: a view cannot claim a count the page then contradicts, because the
 * count and the contents come from one pass over the same records.
 */
export function practiceByRole(
  locale: string,
  role: PracticeRole,
): PracticeArticle[] {
  return getPracticeArticles(locale).filter((a) => a.roles.includes(role));
}

export function practiceWithArtefact(locale: string): PracticeArticle[] {
  return getPracticeArticles(locale).filter((a) => Boolean(a.artefact));
}
