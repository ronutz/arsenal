#!/usr/bin/env node
/**
 * check-partner-duplicates.mjs  (added 2026-09-05)
 *
 * WHY THIS EXISTS
 * ---------------
 * A duplicate Nortel entry shipped. The catalogue already held the company as
 * `nortel-bay` ("Nortel & Bay Networks"); a second entry was added as `nortel`
 * because the pre-write check searched for the exact string `slug: "nortel"`,
 * which `slug: "nortel-bay"` does not contain. The check was correct about the
 * slug and wrong about the company, and nothing downstream noticed.
 *
 * The glossary has had a duplicate-topic guard for a long time. partners.ts did
 * not. That asymmetry is the whole reason this got through, so this is the
 * glossary guard's logic applied to the vendor catalogue.
 *
 * WHAT IT CHECKS
 * --------------
 * 1. Exact duplicate slugs.
 * 2. Slugs where one is a prefix of the other at a segment boundary
 *    (`nortel` vs `nortel-bay`), which is how a merged or renamed company
 *    acquires a second entry.
 * 3. Entries whose display names share a significant token, which catches the
 *    same company arriving under an unrelated slug.
 *
 * Cases 2 and 3 are reported as warnings against a baseline rather than hard
 * failures, because legitimate pairs exist - a parent and a subsidiary can each
 * deserve an entry. The baseline may only go down.
 */

import { readFileSync } from "node:fs";

const src = readFileSync("src/content/vendors/partners.ts", "utf8");

const entries = [];
// Tolerant on purpose: the first version of this pattern demanded a two-space
// brace immediately followed by the slug, and so missed both comment-prefixed
// entries and two entries with a zero-indent brace - meaning the guard written
// to catch duplicates had a blind spot for exactly the entries most likely to
// be hand-edited. Found by cross-checking its count against a second method.
const re = /\n *\{\n(?:[^\n]*\n)*?    slug: "([^"]+)"/g;
let m;
const starts = [];
while ((m = re.exec(src)) !== null) starts.push({ slug: m[1], at: m.index });
starts.forEach((e, i) => {
  const end = i + 1 < starts.length ? starts[i + 1].at : src.length;
  const text = src.slice(e.at, end);
  const name = text.match(/\n {4}name: "([^"]+)"/)?.[1] ?? "";
  entries.push({ slug: e.slug, name, text });
});

const failures = [];
const warnings = [];

// 1. exact duplicates - always fatal
const seen = new Map();
for (const e of entries) {
  if (seen.has(e.slug)) failures.push(`duplicate slug: "${e.slug}" appears more than once`);
  seen.set(e.slug, true);
}

// 2. one slug is a segment-prefix of another
for (const a of entries) {
  for (const b of entries) {
    if (a.slug >= b.slug) continue;
    if (b.slug.startsWith(`${a.slug}-`) || a.slug.startsWith(`${b.slug}-`)) {
      warnings.push(`"${a.slug}" and "${b.slug}" share a slug stem - same company under two entries?`);
    }
  }
}

// 3. display names sharing a distinctive token
const STOP = new Set([
  "the","and","a","an","of","in","to","for","networks","network","systems","system",
  "technologies","technology","corporation","corp","inc","ltd","group","company",
  "co","that","who","was","is","it","its","from","with","-","&",
]);
const tokens = (s) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3 && !STOP.has(t));
const byToken = new Map();
for (const e of entries) {
  for (const t of new Set(tokens(e.name))) {
    if (!byToken.has(t)) byToken.set(t, []);
    byToken.get(t).push(e.slug);
  }
}
for (const [tok, slugs] of byToken) {
  if (slugs.length > 1) {
    warnings.push(`name token "${tok}" shared by: ${slugs.join(", ")}`);
  }
}

// Baseline: legitimate shared tokens exist (a parent and a spin-out, a family
// of related firms). It may only go down, like every other ratchet here.
// Re-measured at 124 on 2026-09-05 after the entry pattern was corrected. The
// earlier 117 was taken while the guard could only see 225 of 318 entries, so
// it was not a real baseline - a ratchet set against a partial view understates
// the work and, worse, reads as tighter than it is.
// Raised 124 -> 125 on 2026-09-06: the xz-utils entry adds exactly one shared
// name token with an existing entry, verified by measuring the count with and
// without that entry in place. It is a common-word overlap, not a duplicate
// company. Raising a warning threshold by a measured one is legitimate;
// raising it to make a failure go away without measuring is not.
const BASELINE = 125;

if (failures.length) {
  console.error("\n[check-partner-duplicates] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

if (warnings.length > BASELINE) {
  console.error(
    `\n[check-partner-duplicates] FAIL: ${warnings.length} possible duplicate(s), above the baseline of ${BASELINE}.\n`
  );
  for (const w of warnings.slice(0, 20)) console.error(`      ${w}`);
  console.error(
    "\n  If these are genuinely distinct companies, raise the baseline with a reason.\n"
  );
  process.exit(1);
}

console.log(
  `[check-partner-duplicates] OK: ${entries.length} entries; no duplicate slugs; ` +
    `${warnings.length} name/stem overlap(s) (baseline ${BASELINE}` +
    `${warnings.length < BASELINE ? " - LOWER THAN BASELINE, drop it to " + warnings.length : ""}).`
);
