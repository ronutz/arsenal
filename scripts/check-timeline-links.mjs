#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-timeline-links.mjs — THE TWENTY-FIRST GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: the industry timeline draws from two lists, and every card it
// renders must point at a page that will actually be generated.
//
// WHY, and this one is my own mistake rather than an inherited one.
// On 2026-08-02 an industry entry was removed at PRIME's instruction. The
// career list still contained the same slug, and the timeline builds its cards
// from BOTH lists - so it went on rendering a card for a company whose page had
// just been deleted. **A 404 reachable from the timeline, introduced by a
// deletion that was otherwise correct**, and nothing in the build noticed
// because a link to a missing page is valid HTML.
//
// The pattern is the one this codebase keeps meeting: **a page can be broken in
// ways that are invisible to everything except a reader clicking on it.** The
// twentieth guard covers chapters that become unreachable; this one covers
// links that reach nothing. They are the same failure seen from opposite ends.
//
// WHAT IT CHECKS
//   every slug in CAREER_VENDORS that the timeline would render as a card has a
//   matching entry in partnerVendors, because the card's href is built as
//   /industry/<slug> and that route is generated from partnerVendors alone.
// ============================================================================

import { readFileSync } from "node:fs";

const partners = readFileSync("src/content/vendors/partners.ts", "utf8");
const career = readFileSync("src/content/vendors/career.ts", "utf8");
const page = readFileSync("src/app/[locale]/industry/page.tsx", "utf8");

const partnerSlugs = new Set(
  [...partners.matchAll(/\n    slug: "([a-z0-9-]+)",/g)].map((m) => m[1]),
);
const careerSlugs = [...career.matchAll(/\{ slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);

// The page must filter career vendors to those with an industry entry. If that
// filter is removed, this guard is the only thing standing between a deletion
// and a dead card - so its presence is checked too, not just its effect.
const filtersCareer = /CAREER_VENDORS\.filter\(\s*\(v\)\s*=>\s*\n?\s*partnerVendors\.some\(/.test(page);

const dangling = careerSlugs.filter((s) => !partnerSlugs.has(s)).sort();
const failures = [];

if (!filtersCareer) {
  failures.push(
    "the industry timeline no longer filters career vendors to those with an industry entry.\n" +
      "      Without that filter, removing an industry entry leaves a card pointing at a 404.",
  );
}

// Dangling slugs are only a problem if the filter is absent - with the filter
// they are simply not rendered. Reported either way, because a career vendor
// with no company history is worth knowing about even when it is handled.
if (dangling.length) {
  const line = `${dangling.length} career vendor(s) have no industry entry: ${dangling.join(", ")}.`;
  if (filtersCareer) {
    console.log(`[check-timeline-links] note: ${line} Filtered out of the timeline, not rendered.`);
  } else {
    failures.push(line);
  }
}

if (failures.length) {
  console.error("\n[check-timeline-links] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(
  `[check-timeline-links] OK: ${partnerSlugs.size} industry entries, ${careerSlugs.length} career vendors, career list filtered before rendering.`,
);
