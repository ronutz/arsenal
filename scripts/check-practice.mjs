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
const STANCES = ["practised", "witnessed", "documented"];
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
    // 1. stance present and valid
    if (!fm.stance) {
      problems.push(`${file}: no stance declared. Every article must say whether it is practised, witnessed or documented.`);
    } else if (!STANCES.includes(fm.stance)) {
      problems.push(`${file}: stance "${fm.stance}" is not one of ${STANCES.join(", ")}.`);
    }

    // 2. documented implies sources
    if (fm.stance === "documented") {
      const n = Array.isArray(fm.sources) ? fm.sources.length : 0;
      if (n === 0) {
        problems.push(`${file}: stance is "documented" but no sources are given. An article describing work the author has not done must say where the description comes from.`);
      }
    }

    // 3. a first-hand claim must have something in it
    if (fm.stance === "practised" && body.length < 400) {
      problems.push(`${file}: stance is "practised" but the body is ${body.length} characters. A first-hand claim with nothing behind it is worse than no claim.`);
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

if (problems.length) {
  console.error("\n[check-practice] FAIL:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("");
  process.exit(1);
}

const n = byLocale.en.length;
const counts = STANCES.map(
  (s) => `${s}:${byLocale.en.filter((a) => a.fm.stance === s).length}`,
).join(" ");
console.log(
  `[check-practice] OK: ${n} article(s) × ${DAY_ONE.length} day-one locales; every stance declared (${counts}).`,
);
