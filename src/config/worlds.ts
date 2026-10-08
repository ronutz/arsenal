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
  /** For a sitemap-only entry ("more"): the href of the entry it follows on the human sitemap, so it can sit beside
   *  the page it belongs with instead of after the world's last primary entry (2026-10-07, About Run Review a13:
   *  Credentials beside the career record, Red Education last in Work with me). Absent means after the items. */
  after?: string;
}

/** One world. */
export interface World {
  key: WorldKey;
  /** True when the world's verb is a name to show as written, never in capitals (2026-10-07, a13: The project's
   *  verb is the site's own domain, "ronutz.com"). Absent means the verb takes the house's small capitals. */
  verbAsWritten?: true;
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
      // The article series (row 62, 2026-10-07: SCOUT found 70 series and 556 articles in reading order missing from the
      // five worlds): subjects told in order, opener first. Not in the navbar.
      { label: "map.series", href: "/learn/series" },
      { label: "map.stories", href: "/stories" },
      { label: "map.guides", href: "/study-guides" },
      // The open materials (milestone (m1), 2026-10-06): complete courses to download and teach from, beside the study guides.
      { label: "map.materials", href: "/materials" },
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
      // The career record left for Work with me on 2026-10-07 (About Run Review a13, PRIME: "Career record and similar
      // sections about me should also go under 'Work with me'").
    ],
    more: [],
  },
  {
    key: "work",
    // THE ABOUT-ME PAGES JOIN THE WORK (About Run Review a13, PRIME 2026-10-07 19:40): "Move 'About' 'Endorsements'
    // from 'The Project' to 'Work with me' as the first items. Career record and similar sections about me should
    // also go under 'Work with me'. Move 'Red Education' to 'Work with me' as the last item." Who he is and what can
    // be checked first, then what can be booked, then the training centre the courses are delivered through.
    items: [
      { label: "map.about", href: "/about" },
      { label: "map.endorsements", href: "/endorsements" },
      { label: "map.career", href: "/industry/chapters" },
      { label: "map.training", href: "/training" },
      { label: "map.advisory", href: "/advisory" },
      { label: "map.speaking", href: "/speaking" },
      { label: "map.redu", href: "/red-education" },
    ],
    more: [
      // Credentials is about him too; it stays off the footer, as before, and sits beside the career record.
      { label: "nav.credentials", href: "/about/credentials", after: "/industry/chapters" },
      // Contact after the three things it is the way to, so Red Education stays last here as in the footer.
      { label: "nav.contact", href: "/contact", after: "/speaking" },
    ],
  },
  {
    key: "project",
    // The site itself since 2026-10-07 (a13): its verb is its name, "ronutz.com", shown as written; About, the
    // endorsements, Credentials and Red Education moved to Work with me. The earlier sites stay: they are the sites
    // before this one.
    verbAsWritten: true,
    // THE SITE'S OWN PAGES IN ITS COLUMN (PRIME 2026-10-07 20:15: "have The site's own pages, Colophon, Changelog,
    // Roadmap, and Guide join THE PROJECT column. Rename Guide to Site Guide."), in reading order: how to use the site,
    // how it is built, what changed, what comes next, then the posts and the way to take part.
    items: [
      { label: "footer.guide", href: "/guide" },
      { label: "nav.colophon", href: "/colophon" },
      { label: "nav.changelog", href: "/changelog" },
      { label: "nav.roadmap", href: "/roadmap" },
      { label: "map.blog", href: "/blog", home: false },
      { label: "map.contribute", href: "/contribute" },
    ],
    more: [
      { label: "nav.earlierSites", href: "/about/earlier-sites" },
      { label: "footer.license", href: "/license" },
      { label: "footer.privacy", href: "/privacy" },
      { label: "footer.disclaimer", href: "/disclaimer" },
      { label: "footer.stats", href: "/stats" },
      { label: "footer.settings", href: "/settings" },
    ],
  },
];

/** THE PROJECT WORLD'S GROUPS on the human sitemap (row 62, 2026-10-07, SCOUT: the world mixed identity and evidence
 *  with the site's own operations and its policies). Keyed by href; an href not listed falls in "site". Since the About
 *  Run Review (a13, the same day) the identity and evidence pages live in Work with me, so two groups remain. */
export const PROJECT_GROUPS: Record<string, "site" | "policies"> = {
  "/license": "policies", "/privacy": "policies", "/disclaimer": "policies", "/stats": "policies", "/settings": "policies",
};

/** A world's links in human-sitemap order: the items, then each sitemap-only entry after the entry it names (or at the
 *  end). Shared by the sitemap page and its check, so the order has one definition. */
export function sitemapOrder(w: World): readonly WorldEntry[] {
  // Start from the primary entries, in their order.
  const out: WorldEntry[] = [...w.items];
  for (const m of w.more) {
    // The position after the named entry, when there is one on the list already.
    const i = m.after ? out.findIndex((e) => e.href === m.after) : -1;
    if (i >= 0) out.splice(i + 1, 0, m);
    else out.push(m);
  }
  return out;
}

/** The first route segments (below the locale) of each world; anything else is The project, a vendor hub is Explore. */
const SEGMENT_WORLD: Record<string, WorldKey> = {
  tools: "use", dev: "use", api: "use", category: "use",
  learn: "understand", glossary: "understand", "study-guides": "understand", certifications: "understand", stories: "understand", practice: "understand", materials: "understand",
  industry: "explore", "vendor-hubs": "explore", people: "explore", roles: "explore",
  training: "work", advisory: "work", speaking: "work", contact: "work",
  // a13 (2026-10-07): About (with the eras and the credentials under it), the endorsements and Red Education.
  about: "work", endorsements: "work", "red-education": "work",
};

/** The world of a route, from its segments below the locale (the home page, with no segment, is The project). */
export function routeWorld(segments: readonly string[]): WorldKey {
  const first = segments[0] ?? "";
  // Two pages sit apart from their first segment's world (a13): the career record is under /industry but is Work
  // with me, and the earlier sites are under /about but stay with the site they preceded.
  if (first === "industry" && segments[1] === "chapters") return "work";
  if (first === "about" && segments[1] === "earlier-sites") return "project";
  if (first in SEGMENT_WORLD) return SEGMENT_WORLD[first];
  if (first && isVendor(first)) return "explore";
  return "project";
}

/** The world keys in display order. */
export const WORLD_KEYS: readonly WorldKey[] = WORLDS.map((w) => w.key);
