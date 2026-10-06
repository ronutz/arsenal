// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/siteCounts.ts
// ----------------------------------------------------------------------------
// THE SITE'S COUNTS, FROM THE REGISTRIES THE PAGES RENDER FROM (D-63), in one
// place. The home page has always computed its directory counts from the
// registries rather than from typed numbers; the user guide's "site in one
// minute" (G9 of Round 1, 2026-10-06) needs the same figures beside the same
// five worlds, and two pages computing the same numbers separately would one
// day disagree. So both read this one function.
//
// Every figure is a length of the registry the corresponding page lists, so a
// count can only change when the thing it counts does. Nothing here is typed.
// ============================================================================
import { STORY_SLUGS } from "@/content/learn/stories";
import { CAREER_VENDORS } from "@/content/vendors/career";
import { partnerVendors } from "@/content/vendors/partners";
import { getPracticeArticles } from "@/lib/practice";
import { studyGuides } from "@/content/certifications/study-guides";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { getAllArticles } from "@/lib/learn";
import { ROLES } from "@/lib/roles";
import { VENDOR_FAMILIES } from "@/config/vendors";
import { GLOSSARY } from "@/content/glossary/glossary";
import { PLATFORMS, COURSE_COUNT } from "@/content/training/courses";
import { TESTIMONIALS } from "@/content/testimonials/data";
// 2026-10-06 (SCOUT's Round 1 adoption audit, REVIEW-chatgpt-round1-adoption-audit-20261006 rows 1, 4, 5 and 22):
// the scoped figures beside the global ones, so every page states which dataset its number counts.
import { READING_PATHS } from "@/content/study-guides/reading-paths";
import { tools as TOOL_CONFIG } from "@/config/tools";
import { isVendorArticle } from "@/lib/learn";

/** The counts the directory, the footer and the guide state. */
export interface SiteCounts {
  /** Live tools in the catalogue. */
  tools: number;
  /** Learn articles. */
  articles: number;
  /** Organisations on the industry record. */
  industry: number;
  /** Articles of The Practice, in the given locale. */
  practice: number;
  /** Certification guides (the exam-blueprint guides /certifications lists). Not the study guides page's count: see readingPaths. */
  guides: number;
  /** Curated reading paths, what /study-guides leads with (13 on 2026-10-06; the home once showed 105 here, the certification count). */
  readingPaths: number;
  /** Live tools with no vendor tag, or vendor-neutral by declaration: the general-purpose catalogue /tools indexes. */
  toolsGeneral: number;
  /** Live tools built for a single vendor's platform, indexed on the vendor hubs rather than in the /tools catalogue. */
  toolsPlatform: number;
  /** Learn articles carrying no vendor tag: the vendor-neutral index the Learn hub lists by subject. */
  articlesNeutral: number;
  /** Learn articles about a single vendor's platform, gathered on the vendor hubs. */
  articlesPlatform: number;
  /** Vendor hubs (the vendor families). */
  hubs: number;
  /** Glossary entries. */
  glossary: number;
  /** People on the glossary's people timeline. */
  people: number;
  /** Career chapters. */
  career: number;
  /** Roles in The Roles. */
  roles: number;
  /** Platforms taught (the training page). */
  platforms: number;
  /** Courses taught (the training page). */
  courses: number;
  /** Endorsements. */
  endorsements: number;
  /** Stories. */
  stories: number;
}

/** Count everything once for the given locale (only The Practice is per locale). */
export function getSiteCounts(locale: string): SiteCounts {
  // The general-purpose rule is the one /tools applies to build its index (src/app/[locale]/tools/page.tsx,
  // `agnosticTools`): available, and either untagged or declared vendor-neutral. Everything else that is
  // available is a platform tool. Read from the same config the page reads, so the two cannot disagree.
  const availableTools = TOOL_CONFIG.filter((t) => t.available);
  const generalTools = availableTools.filter((t) => !(t.vendors ?? []).length || t.vendorNeutral);
  // Articles: the Learn hub's subject index excludes vendor-tagged articles (getArticlesByCategory); the
  // same predicate splits the corpus here.
  const allArticles = getAllArticles();
  const platformArticles = allArticles.filter((a) => isVendorArticle(a));
  return {
    tools: CATALOGUE.filter((tool) => tool.status === "live").length,
    articles: getAllArticles().length,
    industry: partnerVendors.length,
    practice: getPracticeArticles(locale).length,
    guides: studyGuides.length,
    readingPaths: READING_PATHS.length,
    toolsGeneral: generalTools.length,
    toolsPlatform: availableTools.length - generalTools.length,
    articlesNeutral: allArticles.length - platformArticles.length,
    articlesPlatform: platformArticles.length,
    hubs: VENDOR_FAMILIES.length,
    glossary: GLOSSARY.length,
    people: GLOSSARY.filter((e) => e.person).length,
    career: CAREER_VENDORS.length,
    roles: ROLES.length,
    platforms: PLATFORMS.length,
    courses: COURSE_COUNT,
    endorsements: TESTIMONIALS.length,
    stories: STORY_SLUGS.length,
  };
}
