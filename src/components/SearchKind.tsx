"use client";

// ============================================================================
// src/components/SearchKind.tsx
// ----------------------------------------------------------------------------
// THE PAGE'S KIND, FOR THE SEARCH INDEX (PRIME, 2026-10-05 12:44: a search for
// Fortinet showed "Tools 0, Articles 1, User Guide 0, Pages 7" on a site with
// eleven Fortinet tools and dozens of Fortinet articles). The old search read
// only the top eight hits and counted their kinds, so the pills reported the
// mix of eight results, not of the site. Pagefind can count and filter by a
// facet over the WHOLE result set, but a facet has to be declared in the HTML
// it indexes. This component is that declaration: an empty, hidden element
// carrying data-pagefind-filter="kind:<kind>", rendered by the locale layout
// into every page at build time. The kind is derived from the route segments
// the way Search.tsx already classified URLs: /tools/... is a tool (the docs
// page under it too), /learn/... an article, /guide the User Guide, everything
// else a page. useSelectedLayoutSegments resolves during static prerendering,
// so the attribute is in the exported HTML where Pagefind reads it; nothing
// happens at runtime and nothing is rendered visibly.
//
// A second facet, "system", names the page's world among the five of the
// directory (use, understand, explore, work, project; src/config/worlds.ts),
// so the search can be scoped to one world from a hub page (wave 0: SCOUT
// E2, E10, L17) with the same mechanism.
// ============================================================================

import { useSelectedLayoutSegments } from "next/navigation";
import { routeWorld } from "@/config/worlds";

/** The facet values, the same four kinds Search.tsx filters by. */
export type SearchKindValue = "tool" | "article" | "guide" | "page";

/** The kind for a route's segments below the locale: tools and their docs, Learn articles, the User Guide, pages. */
export function kindForSegments(segments: readonly string[]): SearchKindValue {
  const first = segments[0] ?? "";
  if (first === "tools" && segments.length > 1) return "tool";
  if (first === "learn" && segments.length > 1) return "article";
  if (first === "guide") return "guide";
  return "page";
}

export default function SearchKind() {
  // The segments below /[locale]/ for the page being rendered (empty on the home page).
  const segments = useSelectedLayoutSegments();
  const kind = kindForSegments(segments);
  const world = routeWorld(segments);
  // A third facet, "section" (G1 and G2 of Round 1, 2026-10-05): the first path segment below the locale
  // (practice, roles, glossary, learn, tools...; "home" on the home page), so a section's own search field
  // can scope the dialog to that section alone, narrower than its world.
  const section = segments[0] && !segments[0].startsWith("[") ? segments[0] : "home";
  // Three empty elements: nothing to read, nothing to see; only the facets for the indexer (one filter per element).
  return (
    <>
      <span hidden data-pagefind-filter={`kind:${kind}`} data-search-kind={kind} />
      <span hidden data-pagefind-filter={`system:${world}`} data-search-system={world} />
      <span hidden data-pagefind-filter={`section:${section}`} data-search-section={section} />
    </>
  );
}
