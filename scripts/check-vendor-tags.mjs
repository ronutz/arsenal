#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-vendor-tags.mjs — THE NINETEENTH GUARD
// ----------------------------------------------------------------------------
// Tags decide what appears in the filtered views, so a mistake in them is not
// cosmetic: an untagged company is invisible to every filter, and a misspelt
// tag silently creates a ninth category that nothing renders.
//
// Neither failure announces itself. The page still builds, the entry still has
// its own URL, and the only symptom is a company quietly missing from a list it
// should be in - which nobody notices, because you cannot see an absence.
//
// WHAT IT CHECKS
//   1. every entry carries at least one tag;
//   2. every tag used is in the closed vocabulary;
//   3. no entry repeats a tag;
//   4. every tag in the vocabulary is used by at least one entry - because a
//      tag nothing uses is either a mistake or a plan, and both should be
//      visible rather than sitting in the type unnoticed.
//
// Check 4 is a WARNING rather than a failure: `standards` was empty for a while
// by design, and a vocabulary is allowed to anticipate content that has not
// been written yet. It is reported so the gap is deliberate rather than
// forgotten.
// ============================================================================

import { readFileSync } from "node:fs";

const SRC = "src/content/vendors/partners.ts";
const src = readFileSync(SRC, "utf8");

// Read the vocabulary from the source of truth rather than restating it here -
// a guard with its own copy of the list is a guard that can disagree with the
// thing it guards.
const vocabBlock = src.match(/export const VENDOR_TAGS[^=]*=\s*\[([^\]]*)\]/);
if (!vocabBlock) {
  console.error("[check-vendor-tags] FAIL: VENDOR_TAGS not found in " + SRC);
  process.exit(1);
}
const vocab = [...vocabBlock[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]);

// Pair each entry's slug with the tags line that follows it.
const entries = [];
const re = /\n    slug: "([a-z0-9-]+)",\n    tags: \[([^\]]*)\],/g;
let m;
while ((m = re.exec(src)) !== null) {
  entries.push({
    slug: m[1],
    tags: [...m[2].matchAll(/"([a-z]+)"/g)].map((x) => x[1]),
  });
}

const allSlugs = [...src.matchAll(/\n    slug: "([a-z0-9-]+)",/g)].map((x) => x[1]);
const failures = [];

// 1. every entry tagged
const missing = allSlugs.filter((s) => !entries.some((e) => e.slug === s));
if (missing.length) {
  failures.push(
    `${missing.length} entr${missing.length === 1 ? "y has" : "ies have"} no tags: ${missing.join(", ")}`,
  );
}

for (const e of entries) {
  // 2. vocabulary
  const unknown = e.tags.filter((t) => !vocab.includes(t));
  if (unknown.length) {
    failures.push(`${e.slug}: tag(s) outside the vocabulary: ${unknown.join(", ")}`);
  }
  // 3. no repeats
  const dupes = e.tags.filter((t, i) => e.tags.indexOf(t) !== i);
  if (dupes.length) failures.push(`${e.slug}: repeated tag(s): ${[...new Set(dupes)].join(", ")}`);
  // empty array
  if (!e.tags.length) failures.push(`${e.slug}: empty tags array`);
}

if (failures.length) {
  console.error("\n[check-vendor-tags] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 5. TAG ROUTES MUST NOT COLLIDE WITH COMPANY OR CAREER SLUGS.
//
// `/industry/<slug>` serves both company pages and tag-filtered lists, because
// two dynamic segments cannot share a level. So a company whose slug happened
// to equal a tag route would be UNREACHABLE - the list would win, the company
// would simply never render, and nothing would report it. This is the guard
// for that.
// ---------------------------------------------------------------------------
const routeBlock = src.match(/export const TAG_ROUTES[^=]*=\s*\{([^}]*)\}/);
if (routeBlock) {
  const routes = [...routeBlock[1].matchAll(/(\w+):/g)].map((m) => m[1]);
  const careerSrc = readFileSync("src/content/vendors/career.ts", "utf8");
  const careerSlugs = [...careerSrc.matchAll(/\{ slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
  const collide = routes.filter((r) => allSlugs.includes(r) || careerSlugs.includes(r));
  if (collide.length) {
    console.error("\n[check-vendor-tags] FAIL:\n");
    console.error(
      `  - tag route(s) collide with a company or career slug: ${collide.join(", ")}. ` +
        `The filtered list would shadow the company page and nothing would report it.\n`,
    );
    process.exit(1);
  }
}

// 4. unused vocabulary - reported, not fatal
const used = new Set(entries.flatMap((e) => e.tags));
const unused = vocab.filter((t) => !used.has(t));

const counts = vocab
  .map((t) => `${t}:${entries.filter((e) => e.tags.includes(t)).length}`)
  .join(" ");
console.log(
  `[check-vendor-tags] OK: ${entries.length} entries tagged, vocabulary of ${vocab.length}. ${counts}` +
    (unused.length ? ` — unused (not an error): ${unused.join(", ")}` : ""),
);
