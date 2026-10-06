// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/subjects.ts
// ----------------------------------------------------------------------------
// THE SUBJECT PAGES (/category/<key>), listed once. A subject page gathers the
// vendor-neutral tools, articles and glossary terms of one category, the same
// eleven-subject taxonomy the Tools and Learn indexes use.
//
// Moved here on 2026-10-06 from src/app/[locale]/category/[key]/page.tsx,
// where it was a page-local function, so the human sitemap can list every
// subject page from the same rule that generates them (SCOUT's Round 1
// adoption audit, row 20: the sitemap named three subjects of eleven,
// Network, Security and Identity, a remnant of the old top navigation).
// ============================================================================

import { tools } from "@/config/tools";
import { getArticlesByCategory } from "@/lib/learn";

/** Every category key that has a subject page: any category of a generic tool (primary or secondary) or of a vendor-neutral article group. */
export function subjectKeys(): string[] {
  const set = new Set<string>();
  // vendorNeutral tools are open-standard tools merely affiliated with a hub;
  // they count as generic here (see the field doc in src/config/tools.ts).
  for (const t of tools.filter((tool) => !(tool.vendors ?? []).length || tool.vendorNeutral)) {
    set.add(t.category);
    for (const c of t.secondaryCategories ?? []) set.add(c);
  }
  // Learn's vendor-neutral groups, the article side of the same taxonomy.
  for (const group of getArticlesByCategory()) {
    if (group.articles.length > 0) set.add(group.category);
  }
  return Array.from(set);
}
