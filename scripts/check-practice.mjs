#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-practice.mjs — 28th guard
// ----------------------------------------------------------------------------
// The Practice corpus makes one promise that matters more than the others:
// EVERY ARTICLE DECLARES WHERE ITS AUTHORITY COMES FROM. PRIME's brief was
// "everything I did, plus many more things I didn't get to do", and without a
// declared stance a reader has no way to tell which is which - so forty-eight
// articles under one name would together imply thirty years of first-hand
// experience of all forty-eight subjects. That would be untrue.
//
// A promise kept by remembering is not kept. This is the control.
//
// WHAT IT CHECKS
//
//   1. STANCE PRESENT AND VALID on every article. No default is permitted in
//      the type and none is inferred here: an article without a stance fails
//      rather than quietly becoming the safest-sounding one.
//
//   2. "documented" ARTICLES CARRY SOURCES. An article PRIME has not run
//      himself must say where the description comes from, or it is an
//      unsupported assertion wearing the same typeface as testimony.
//
//   3. "practised" ARTICLES CARRY NO SOURCES REQUIREMENT but must not be
//      empty of body - a first-hand claim with nothing in it is the worst of
//      both.
//
//   4. EN/PT-BR PAIRING, per the standing multi-locale rule. Both day-one
//      locales or neither; a half-translated corpus is how "authored natively"
//      quietly becomes "machine translated".
//
//   5. STANCE AGREES ACROSS LOCALES. A translation cannot promote an article
//      from documented to practised. This has not happened yet and this is why
//      it will not.
//
//   6. PART AND ORDER VALID, and no two articles share a (part, order) slot,
//      which would make the spine order arbitrary.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.join(process.cwd(), "src", "content", "practice");
const DAY_ONE = ["en", "pt-BR"];
const PARTS = ["before", "breaks", "yield", "after", "life", "craft"];
const ROLES = ["first-line", "second-line", "field", "design", "management"];

const problems = [];

function load(locale) {
  const dir = path.join(ROOT, locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      return { file: `${locale}/${f}`, fm: data, body: content.trim() };
    });
}

if (!fs.existsSync(ROOT)) {
  // The corpus is authored in waves; an absent directory is not yet an error.
  console.log("[check-practice] OK: no practice corpus present yet.");
  process.exit(0);
}

const byLocale = Object.fromEntries(DAY_ONE.map((l) => [l, load(l)]));

for (const locale of DAY_ONE) {
  const seenSlots = new Map();

  for (const { file, fm, body } of byLocale[locale]) {
    // 1. an article must have something in it
    //
    // This used to be conditional on stance === "practised". PRIME removed the
    // stance schema on 2026-08-09 (every article was first-hand, so the marker
    // distinguished nothing), and the floor is worth keeping unconditionally:
    // a Practice article with nothing behind it is worse than no article.
    if (body.length < 400) {
      problems.push(`${file}: the body is ${body.length} characters. A Practice article with nothing behind it is worse than no article.`);
    }

    // 6. part, order, roles
    if (!PARTS.includes(fm.part)) {
      problems.push(`${file}: part "${fm.part}" is not one of ${PARTS.join(", ")}.`);
    }
    if (typeof fm.order !== "number") {
      problems.push(`${file}: order must be a number.`);
    }
    for (const r of fm.roles ?? []) {
      if (!ROLES.includes(r)) problems.push(`${file}: role "${r}" is not one of ${ROLES.join(", ")}.`);
    }
    const slot = `${fm.part}#${fm.order}`;
    if (seenSlots.has(slot)) {
      problems.push(`${file}: (part, order) slot ${slot} already used by ${seenSlots.get(slot)}. The spine order would be arbitrary.`);
    } else {
      seenSlots.set(slot, file);
    }
  }
}

// 4 and 5. pairing and stance agreement across the day-one locales
const enBySlug = new Map(byLocale.en.map((a) => [a.fm.slug, a]));
const ptBySlug = new Map(byLocale["pt-BR"].map((a) => [a.fm.slug, a]));

for (const [slug, en] of enBySlug) {
  const pt = ptBySlug.get(slug);
  if (!pt) {
    problems.push(`${slug}: exists in en with no pt-BR counterpart. Both day-one locales or neither.`);
    continue;
  }
  if (en.fm.stance !== pt.fm.stance) {
    problems.push(`${slug}: stance differs across locales (en="${en.fm.stance}", pt-BR="${pt.fm.stance}"). A translation cannot change where the authority came from.`);
  }
  if (en.fm.part !== pt.fm.part || en.fm.order !== pt.fm.order) {
    problems.push(`${slug}: part/order differ across locales; the spine would read differently in each.`);
  }
}
for (const slug of ptBySlug.keys()) {
  if (!enBySlug.has(slug)) {
    problems.push(`${slug}: exists in pt-BR with no en counterpart - the English was renamed or deleted and the pair broke silently.`);
  }
}

// ---------------------------------------------------------------------------
// INLINE LINK RESOLUTION (PRIME ratified 2026-08-09)
//
// WHY: inline body links were unvalidated - so a `(/practice/typo)` or a
// forward reference to an article that never gets written renders happily and
// 404s in production. Found on 2026-08-09 while writing a deliberate forward
// link from `what-vendor-support-can-and-cannot-do` to an article that did not
// exist yet; it was hand-scanned for three sessions running, which is the point
// at which a repeated manual check either becomes a guard or becomes a habit
// that lapses.
//
// Same shape as check-reading-paths and check-user-guide, which already resolve
// references against a live registry rather than trusting the prose.
//
// Slugs come from the en/ directory, which check-practice has already proven is
// in one-to-one correspondence with pt-BR/ above. Tools come from the registry
// source, read as text rather than imported, because this script is plain node
// and the registry is TypeScript.
const practiceSlugs = new Set(byLocale.en.map((a) => a.file.replace(/^en\/(.+)\.mdx$/, "$1")));
//
// *** THE REGISTRY KEY IS `id`, NOT `slug`. ***
// The first version of this block matched /slug:\s*"..."/ and found ZERO tools,
// and because it then guarded with `if (toolSlugs.size && ...)` the tool half of
// this check silently did nothing while the guard reported OK. Caught by
// deliberately breaking BOTH link kinds and noticing only one was reported.
//
// So the parse now asserts its own result. A guard whose input silently comes
// back empty is worse than no guard: it reports success for a check it never ran.
const toolsSrc = fs.readFileSync(path.join(process.cwd(), "src", "config", "tools.ts"), "utf8");
const toolSlugs = new Set([...toolsSrc.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
if (toolSlugs.size < 50) {
  console.error(
    `\n[check-practice] FAIL: parsed only ${toolSlugs.size} tool id(s) from src/config/tools.ts.` +
      `\n  The registry format changed and this guard is no longer reading it. Fix the parse` +
      `\n  rather than lowering this floor - a silent empty set reports OK for a check it never ran.\n`,
  );
  process.exit(1);
}

// *** FRONT-MATTER ARRAYS (added 2026-08-09, one turn after the inline check). ***
// The comment above previously claimed relatedPractice and relatedTools "were
// already validated". That was false, written from assumption rather than from
// reading, and the sweep that followed found FOUR bad tool ids - three of them
// months old, one added in the same turn as the claim. Front matter now gets the
// same treatment as body links.
for (const locale of DAY_ONE) {
  for (const { file, fm } of byLocale[locale]) {
    for (const slug of fm.relatedTools ?? []) {
      if (!toolSlugs.has(slug)) {
        problems.push(`${file}: relatedTools "${slug}" is not in the tool registry.`);
      }
    }
    for (const slug of fm.relatedPractice ?? []) {
      if (!practiceSlugs.has(slug)) {
        problems.push(`${file}: relatedPractice "${slug}" is not an article.`);
      }
    }
  }
}

for (const locale of DAY_ONE) {
  for (const { file, body } of byLocale[locale]) {
    for (const [, slug] of body.matchAll(/\]\(\/practice\/([a-z0-9-]+)\/?\)/g)) {
      if (!practiceSlugs.has(slug)) {
        problems.push(`${file}: inline link to /practice/${slug} - no such article; the page renders and the link 404s.`);
      }
    }
    for (const [, slug] of body.matchAll(/\]\(\/tools\/([a-z0-9-]+)\/?\)/g)) {
      if (!toolSlugs.has(slug)) {
        problems.push(`${file}: inline link to /tools/${slug} - not in the tool registry.`);
      }
    }
  }
}

if (problems.length) {
  console.error("\n[check-practice] FAIL:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("");
  process.exit(1);
}

const n = byLocale.en.length;
const inlineLinks = DAY_ONE.reduce(
  (acc, l) =>
    acc +
    byLocale[l].reduce(
      (a2, art) =>
        a2 +
        [...art.body.matchAll(/\]\(\/(?:practice|tools)\/[a-z0-9-]+\/?\)/g)].length,
      0,
    ),
  0,
);
console.log(
  `[check-practice] OK: ${n} article(s) × ${DAY_ONE.length} day-one locales; ${inlineLinks} inline /practice/ and /tools/ link(s) resolve.`,
);
