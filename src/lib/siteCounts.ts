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
  /** Study guides (also the certification guides' count). */
  guides: number;
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
  return {
    tools: CATALOGUE.filter((tool) => tool.status === "live").length,
    articles: getAllArticles().length,
    industry: partnerVendors.length,
    practice: getPracticeArticles(locale).length,
    guides: studyGuides.length,
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
