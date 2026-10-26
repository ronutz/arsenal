// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/certCoverage.ts
// ----------------------------------------------------------------------------
// PER-OBJECTIVE COVERAGE OF A CERTIFICATION GUIDE (batch B3, 2026-10-26; audit
// CC11 and the /certifications scorecard: "a mapped blueprint must not read as
// a fully authored local curriculum"; shared contract S1, "coverage: objective
// counts with local article/tool links, official-source-only coverage and
// planned gaps computed separately").
//
// A guide being MAPPED (its objectives transcribed from the vendor's source)
// says nothing about how much of it this site teaches. Each objective is put in
// exactly one of three classes, derived only from relations the record already
// holds, so the class can never claim more than the data does:
//
//   linked    at least one relatedArticles slug is a real Learn article, or at
//             least one relatedTools slug is a live tool with its own page;
//   planned   no such link, and the record marks the objective `gap: true`
//             (the existing "article coming" flag that seeds the Learn backlog);
//             also the fallback when nothing official is cited either;
//   official  no such link and no gap flag, and an official source is cited:
//             the objective's own manual links or the guide's blueprint source.
//
// A link that does not resolve never counts: it is ignored here, and
// scripts/check-study-guides.mjs fails the build on it (check 8), so a page can
// neither claim coverage through it nor render it as a broken link. The guard
// mirrors these rules in plain node; change both together.
//
// The counts stay apart from the guide count (how many records are mapped) and
// from availability (whether an exam can be booked, src/lib/certStatus.ts).
// ============================================================================

// The Learn loader (English is the complete slug set; other locales fall back per article).
import { getAllArticles } from "@/lib/learn";
// The public tool registry: only an available tool routed at /tools/<id> has a page to link.
import { tools } from "@/config/tools";
// The record shapes the classes are derived from.
import type { Objective, StudyGuide } from "@/content/certifications/study-guides";

/** The three coverage classes an objective can be in (see the header for the rules and their order). */
export type ObjectiveCoverage = "linked" | "official" | "planned";

/** The classes in the order a reader meets them in the summaries. */
export const COVERAGE_CLASSES: readonly ObjectiveCoverage[] = ["linked", "official", "planned"];

/** A guide's objectives counted by class; `total` is their sum. A type alias rather than an interface, so it can be
 *  handed straight to t() as ICU values (an alias gets the implicit index signature next-intl's values need). */
export type GuideCoverage = {
  /** Objectives linked to a real local article or live tool. */
  linked: number;
  /** Objectives with only an official source to follow. */
  official: number;
  /** Objectives with local material planned (gap flag), or nothing cited at all. */
  planned: number;
  /** Every objective in the guide (0 while the blueprint is still being mapped). */
  total: number;
};

/** The two membership tests a classification needs: is this a real article slug, and a live tool slug. Behaviour, not
 *  a content field, and read in this module only, so it is a type alias like GuideCoverage. */
export type CoverageResolvers = {
  /** True when the slug names a Learn article that exists. */
  isArticle: (slug: string) => boolean;
  /** True when the slug names an available tool whose page is /tools/<slug>. */
  isTool: (slug: string) => boolean;
};

/** Cached resolvers, built once per process from the same sources the pages link with. */
let cached: CoverageResolvers | null = null;

/** The resolvers for this build: Learn slugs from the English source set, tool ids from the live registry. */
export function coverageResolvers(): CoverageResolvers {
  // Built once; the article and tool sets do not change during a build.
  if (cached) return cached;
  // Every Learn slug (English is complete; a localised page falls back to it per article, so the link resolves).
  const articles = new Set(getAllArticles("en").map((a) => a.slug));
  // Every tool that is live and routed where the guide page links it.
  const liveTools = new Set(tools.filter((t) => t.available && t.href === `/tools/${t.id}`).map((t) => t.id));
  // The two tests over those sets.
  cached = { isArticle: (s) => articles.has(s), isTool: (s) => liveTools.has(s) };
  return cached;
}

/** The class of one objective within its guide (rules and order in the header). */
export function objectiveCoverage(o: Objective, guide: StudyGuide, r: CoverageResolvers = coverageResolvers()): ObjectiveCoverage {
  // A resolving local article or tool is the only thing that makes an objective "linked".
  if (o.relatedArticles.some(r.isArticle) || o.relatedTools.some(r.isTool)) return "linked";
  // The record says local material is still to come.
  if (o.gap) return "planned";
  // An official source is cited, at the objective or for the whole guide.
  if (o.manualLinks.length > 0 || guide.blueprintSourceUrl) return "official";
  // Nothing local and nothing official cited: still to be done.
  return "planned";
}

/** A guide's objectives counted by class (all zero while it is in preparation). */
export function guideCoverage(guide: StudyGuide, r: CoverageResolvers = coverageResolvers()): GuideCoverage {
  // Start every class at zero.
  const c: GuideCoverage = { linked: 0, official: 0, planned: 0, total: 0 };
  // Walk every objective of every section once.
  for (const section of guide.sections) {
    for (const o of section.objectives) {
      // Count it in its class and in the total.
      c[objectiveCoverage(o, guide, r)] += 1;
      c.total += 1;
    }
  }
  return c;
}
