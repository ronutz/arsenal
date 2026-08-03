#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-career-counterparts.mjs — THE TWENTIETH GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: every career chapter must be reachable from the industry
// timeline, and every industry link must point at a chapter that exists.
//
// WHY THIS EXISTS, and it is a real incident rather than a hypothetical.
// On 2026-08-02 an industry entry was dissolved at PRIME's instruction because
// it grouped three companies that shared only a distribution portfolio. That
// entry carried the ONLY link to the distribution-years career chapter. The
// chapter kept its own page and rendered perfectly; it simply became
// unreachable from the timeline. Every guard passed. Nothing was broken in any
// way a build could detect.
//
// **That is the failure mode this guard exists for: not a page that breaks, but
// a page that becomes an island.** You cannot see an absence, and a career
// chapter nobody can navigate to is functionally deleted while looking healthy.
//
// TWO DIRECTIONS, because both fail silently:
//   1. a chapter with no industry entry pointing at it -> unreachable
//   2. an industry entry pointing at a chapter that does not exist -> dead link
//
// MANY-TO-ONE IS ALLOWED AND DELIBERATE. The distribution-years chapter covers
// three companies whose histories now live in two entries, and both point at
// it. A reader arriving at either lineage should find the chapter; requiring
// exactly one link would force a false choice about which lineage "owns" it.
// ============================================================================

import { readFileSync } from "node:fs";

const partners = readFileSync("src/content/vendors/partners.ts", "utf8");
const career = readFileSync("src/content/vendors/career.ts", "utf8");

const chapters = new Set([...career.matchAll(/\{ slug: "([a-z0-9-]+)"/g)].map((m) => m[1]));
const links = [...partners.matchAll(/careerChapter: \{ slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
const linked = new Set(links);

const failures = [];

const orphans = [...chapters].filter((c) => !linked.has(c)).sort();
if (orphans.length) {
  failures.push(
    `${orphans.length} career chapter(s) unreachable from the industry timeline: ${orphans.join(", ")}.\n` +
      `      The page still renders - that is the problem. Add a careerChapter link on the\n` +
      `      relevant industry entry, or remove the chapter deliberately.`,
  );
}

const dangling = [...linked].filter((l) => !chapters.has(l)).sort();
if (dangling.length) {
  failures.push(
    `${dangling.length} industry entr(y/ies) link to a career chapter that does not exist: ${dangling.join(", ")}.`,
  );
}

if (failures.length) {
  console.error("\n[check-career-counterparts] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

const multi = [...linked].filter((c) => links.filter((l) => l === c).length > 1);
console.log(
  `[check-career-counterparts] OK: ${chapters.size} career chapters, all reachable; ${links.length} links, none dangling.` +
    (multi.length ? ` Multi-linked (allowed): ${multi.join(", ")}.` : ""),
);
