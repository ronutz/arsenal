#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-redirects.mjs — THE SEVENTEENTH GUARD
//
// Cloudflare drops _redirects rules SILENTLY when a limit or an ordering rule
// is broken. No build error, no dashboard warning; the rule simply stops
// existing. So the only place this can be caught is here.
//
// It checks three things, each of which has already gone wrong once:
//
//   1. EVERY CAREER PAGE STILL RESOLVES. This rule was written after a
//      generator reading partnerVendors emitted redirects that killed six
//      career pages, and it originally forbade ANY redirect away from
//      /about/vendors/<slug>.
//
//      *** UPDATED 2026-08-06, WHEN THOSE PAGES DELIBERATELY MOVED. ***
//      Schema D moved the career chapters to /industry/chapters/<slug> and the
//      history pages to /industry/history/*, because they are industry content
//      that happens to be autobiographical. The old rule forbade exactly the
//      redirects that move requires, and it fired 240 times - correctly, since
//      a rule that cannot tell a deliberate migration from an accidental
//      deletion should stop both and make a person look.
//
//      The replacement is STRICTER rather than weaker. It no longer asks
//      "is this page being redirected away", which a legitimate move must do.
//      It asks "does the destination exist": a redirect from a career page must
//      point at that career slug's new home, and the route for it must be on
//      disk. Forbidding movement protected the pages by accident; verifying the
//      destination protects them on purpose.
//
//   2. LIMITS: 2,000 static and 100 dynamic.
//
//   3. ORDER: every static rule before every dynamic one, which Cloudflare
//      requires and which silently drops rules when violated.
// ============================================================================

import { readFileSync, existsSync } from "node:fs";

const FILE = "public/_redirects";
const raw = readFileSync(FILE, "utf8");
const lines = raw.split("\n");

const rules = [];
lines.forEach((line, i) => {
  const t = line.trim();
  if (!t || t.startsWith("#")) return;
  rules.push({ i, t, dynamic: t.includes("*") || /:[a-z]/.test(t) });
});

const dynamic = rules.filter((r) => r.dynamic);
const statics = rules.filter((r) => !r.dynamic);
const failures = [];

if (statics.length > 2000) failures.push(`${statics.length} static rules exceeds the limit of 2,000.`);
if (dynamic.length > 100) failures.push(`${dynamic.length} dynamic rules exceeds the limit of 100.`);

if (statics.length && dynamic.length) {
  const lastStatic = Math.max(...statics.map((r) => r.i));
  const firstDynamic = Math.min(...dynamic.map((r) => r.i));
  if (firstDynamic < lastStatic) {
    failures.push(
      `Dynamic rule at line ${firstDynamic + 1} appears before static rule at line ${lastStatic + 1}. Cloudflare requires all static rules first and silently drops the rest otherwise.`,
    );
  }
}

// Every career page must still resolve somewhere real. See rule 1 above for why
// this checks the destination rather than forbidding the redirect.
const career = [
  ...readFileSync("src/content/vendors/career.ts", "utf8").matchAll(/\{ slug: "([a-z0-9-]+)"/g),
].map((m) => m[1]);

const CHAPTER_ROUTE = "src/app/[locale]/industry/chapters";

for (const slug of career) {
  // (a) the route has to exist on disk. If somebody deletes the page and leaves
  //     the redirect, every old link lands on a 404 with a 301 in front of it.
  if (!existsSync(`${CHAPTER_ROUTE}/${slug}/page.tsx`)) {
    failures.push(
      `Career slug "${slug}" has no page at ${CHAPTER_ROUTE}/${slug}/page.tsx. The chapter is unreachable.`,
    );
  }

  // (b) any redirect FROM the old location must point at the new one, not at
  //     the index, not at the industry entry, and not anywhere else. Landing a
  //     reader on a plausible-but-wrong page is worse than a 404, because
  //     nobody reports it.
  for (const r of rules) {
    const m = r.t.match(new RegExp(`^/([a-zA-Z-]+)/about/vendors/${slug}/\\s+(\\S+)`));
    if (m && m[2] !== `/${m[1]}/industry/chapters/${slug}/`) {
      failures.push(
        `Line ${r.i + 1} redirects career page "${slug}" to ${m[2]}, not to /${m[1]}/industry/chapters/${slug}/.\n      ${r.t}`,
      );
    }
  }
}

if (failures.length) {
  console.error(`\n[check-redirects] FAIL:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

console.log(
  `[check-redirects] OK: ${statics.length}/2000 static, ${dynamic.length}/100 dynamic, ordering correct, all ${career.length} career chapters resolve.`,
);
