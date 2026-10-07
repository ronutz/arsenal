// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/worldCounts.ts
// ----------------------------------------------------------------------------
// THE DIRECTORY'S COUNTS, BY DESTINATION (2026-10-06, PRIME's Option A at
// 16:45: one directory, in the footer, with the counts the home page's
// "Everything on ronutz" carried; 16:49: "use only the numbers for the items in
// the footer"). Three places show the five worlds with their counts: the footer
// on every page (numbers only), the colophon's "Everything on ronutz" (the
// phrases, as the home page had them) and the user guide's map (the phrases).
// They used to build the same href-to-count table each on its own; now they
// read it here, so the three cannot disagree. The figures themselves come from
// getSiteCounts (src/lib/siteCounts.ts, D-63: every count is a registry length).
//
// Two shapes of the same table:
//   - getWorldCountNumbers(locale): the bare number per href, for the footer;
//   - getWorldCountLabels(locale): the phrase per href ("183 live", "28 courses
//     across 4 vendors"), in the home page's words (home.map.*Badge,
//     home.front.endorsementsBadge), for the colophon and the guide.
// A destination with no count (Dev tools, Advisory, Speaking, About, ...) is
// simply absent from both, and the renderers show nothing beside it.
// ============================================================================
import { getTranslations } from "next-intl/server";
import { getSiteCounts } from "@/lib/siteCounts";

/** The bare count per directory href, for the given locale (only The Practice differs per locale). */
export function getWorldCountNumbers(locale: string): Record<string, number> {
  const c = getSiteCounts(locale);
  return {
    "/tools": c.tools,
    "/learn": c.articles,
    // The article series (row 62): the number of series, not of their articles.
    "/learn/series": c.series,
    "/stories": c.stories,
    // The study guides page leads with the curated reading paths, so its count is theirs (SCOUT's audit, 2026-10-06).
    "/study-guides": c.readingPaths,
    "/materials": c.materials,
    "/certifications": c.guides,
    "/glossary": c.glossary,
    "/practice": c.practice,
    "/industry": c.industry,
    "/vendor-hubs": c.hubs,
    "/roles": c.roles,
    "/industry/chapters": c.career,
    // Training counts the courses taught; the phrase below adds the platforms.
    "/training": c.courses,
    "/endorsements": c.endorsements,
  };
}

/** The count phrase per directory href, in the home page's words, for the given locale. */
export async function getWorldCountLabels(locale: string): Promise<Record<string, string>> {
  const t = await getTranslations({ locale, namespace: "home" });
  const c = getSiteCounts(locale);
  const n = getWorldCountNumbers(locale);
  return {
    "/tools": t("map.toolsBadge", { count: n["/tools"] }),
    "/learn": t("map.learnBadge", { count: n["/learn"] }),
    "/learn/series": t("map.seriesBadge", { count: n["/learn/series"] }),
    "/stories": t("map.storiesBadge", { count: n["/stories"] }),
    "/study-guides": t("map.guidesBadge", { count: n["/study-guides"] }),
    "/materials": t("map.materialsBadge", { count: n["/materials"] }),
    "/certifications": t("map.certsBadge", { count: n["/certifications"] }),
    "/glossary": t("map.glossaryBadge", { count: n["/glossary"] }),
    "/practice": t("map.practiceBadge", { count: n["/practice"] }),
    "/industry": t("map.industryBadge", { count: n["/industry"] }),
    "/vendor-hubs": t("map.hubsBadge", { count: n["/vendor-hubs"] }),
    "/roles": t("map.rolesBadge", { count: n["/roles"] }),
    "/industry/chapters": t("map.careerBadge", { count: n["/industry/chapters"] }),
    "/training": t("map.trainingBadge", { count: n["/training"], vendors: c.platforms }),
    "/endorsements": t("front.endorsementsBadge", { count: n["/endorsements"] }),
  };
}
