// ============================================================================
// src/config/worlds.ts
// ----------------------------------------------------------------------------
// THE FIVE WORLDS, in one place (wave 0 of Round 1, 2026-10-05; SCOUT G21
// "footer and human sitemap by the five systems", L12 "a site-wide Directory
// convention", E2/E10/L17 "scoped search"). The home page's directory drew the
// five worlds first (Use, Understand, Explore, Work with me, The project); the
// footer, the human sitemap and the search's scope now draw the same five from
// this registry, so a page that moves worlds moves everywhere at once.
//
// Each world: its key (also the message key under home.front.world.* and
// home.front.worldVerb.*), the primary entries (what the home directory and the
// footer show; label keys under home.map.*; an entry marked home: false is the
// footer's and the sitemap's only), and the further entries only the human
// sitemap lists (label keys under nav.* or footer.*, or a literal where the
// label is a proper name). Counts are not here: the home page computes
// them from the registries at build time and attaches them by href.
//
// SEARCH SCOPE: routeWorld() maps a route's first segment below the locale to
// its world; SearchKind renders it as the "system" facet Pagefind indexes, and
// the search dialog narrows by it. A vendor hub (/f5, /fortinet) is Explore.
// ============================================================================

import { isVendor } from "@/config/vendors";

/** The five keys, in display order. */
export type WorldKey = "use" | "understand" | "explore" | "work" | "project";

/** One entry of a world: where the label comes from, and where it goes. */
export interface WorldEntry {
  /** The label's message key: "map.<x>" under home, "nav.<x>" under nav, "footer.<x>" under footer, or "=Literal". */
  label: string;
  /** The locale-relative path. */
  href: string;
  /** False when the home directory skips the entry while the footer and the human sitemap keep it (PRIME
   *  2026-10-05 14:49, G17: "move the Blog entry from the home directory to the footer"). Absent means shown. */
  home?: false;
}

/** One world. */
export interface World {
  key: WorldKey;
  /** The entries the home directory and the footer show. */
  items: readonly WorldEntry[];
  /** Further entries the human sitemap lists after the items. */
  more: readonly WorldEntry[];
}

/** The registry. */
export const WORLDS: readonly World[] = [
  {
    key: "use",
    items: [
      { label: "map.tools", href: "/tools" },
      { label: "map.dev", href: "/dev" },
    ],
    // The three subject pages that sat here (Network, Security, Identity, a remnant of the old top navigation) left
    // on 2026-10-06 (SCOUT's adoption audit, row 20: why three of eleven?). The human sitemap now lists all eleven
    // subject pages in a block of their own, from src/lib/subjects.ts.
    more: [
      { label: "=API", href: "/api" },
      { label: "nav.devFun", href: "/dev/fun" },
    ],
  },
  {
    key: "understand",
    items: [
      { label: "map.learn", href: "/learn" },
      { label: "map.stories", href: "/stories" },
      { label: "map.guides", href: "/study-guides" },
      { label: "map.certs", href: "/certifications" },
      { label: "map.glossary", href: "/glossary" },
      { label: "map.practice", href: "/practice" },
    ],
    more: [],
  },
  {
    key: "explore",
    items: [
      { label: "map.industry", href: "/industry" },
      { label: "map.hubs", href: "/vendor-hubs" },
      { label: "map.people", href: "/people" },
      { label: "map.roles", href: "/roles" },
      { label: "map.career", href: "/industry/chapters" },
    ],
    more: [],
  },
  {
    key: "work",
    items: [
      { label: "map.training", href: "/training" },
      { label: "map.advisory", href: "/advisory" },
      { label: "map.speaking", href: "/speaking" },
    ],
    more: [
      { label: "nav.contact", href: "/contact" },
    ],
  },
  {
    key: "project",
    items: [
      { label: "map.about", href: "/about" },
      { label: "map.endorsements", href: "/endorsements" },
      { label: "map.redu", href: "/red-education" },
      { label: "map.blog", href: "/blog", home: false },
      { label: "map.contribute", href: "/contribute" },
    ],
    more: [
      { label: "nav.credentials", href: "/about/credentials" },
      { label: "nav.earlierSites", href: "/about/earlier-sites" },
      { label: "nav.changelog", href: "/changelog" },
      { label: "nav.roadmap", href: "/roadmap" },
      { label: "nav.colophon", href: "/colophon" },
      { label: "footer.guide", href: "/guide" },
      { label: "footer.license", href: "/license" },
      { label: "footer.privacy", href: "/privacy" },
      { label: "footer.disclaimer", href: "/disclaimer" },
      { label: "footer.stats", href: "/stats" },
      { label: "footer.settings", href: "/settings" },
    ],
  },
];

/** The first route segments (below the locale) of each world; anything else is The project, a vendor hub is Explore. */
const SEGMENT_WORLD: Record<string, WorldKey> = {
  tools: "use", dev: "use", api: "use", category: "use",
  learn: "understand", glossary: "understand", "study-guides": "understand", certifications: "understand", stories: "understand", practice: "understand",
  industry: "explore", "vendor-hubs": "explore", people: "explore", roles: "explore",
  training: "work", advisory: "work", speaking: "work", contact: "work",
};

/** The world of a route, from its segments below the locale (the home page, with no segment, is The project). */
export function routeWorld(segments: readonly string[]): WorldKey {
  const first = segments[0] ?? "";
  if (first in SEGMENT_WORLD) return SEGMENT_WORLD[first];
  if (first && isVendor(first)) return "explore";
  return "project";
}

/** The world keys in display order. */
export const WORLD_KEYS: readonly WorldKey[] = WORLDS.map((w) => w.key);
