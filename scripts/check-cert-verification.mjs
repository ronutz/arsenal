// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-cert-verification.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD (R1-b1, 2026-10-06): every certification study guide says when
// its record was last checked against the vendor's official sources, and that
// date is a real one.
//
// Why: the guide pages now render "Checked against <vendor>'s official sources
// on <date>" from src/content/certifications/verification.ts (SCOUT's Round 1
// adoption audit, row 10). A date on a public page is a claim. A guide with no
// entry would silently render no date; an entry for a slug that no longer
// exists would hide a renamed guide's missing date; a date in the future or a
// malformed one would print nonsense; an empty basis would make the date
// unauditable. Each of those fails the build.
//
// What it REPORTS without failing: the records older than FRESHNESS_DAYS (120,
// the same threshold src/lib/certStatus.ts uses to mark them stale on the
// page), oldest first. That list is the next re-verification batch (R1-b3).
//
// Reads the TypeScript sources as text, like check-exam-codes.mjs, so it needs
// no build and runs in the prebuild chain.
// ============================================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GUIDES = readFileSync(path.join(ROOT, "src/content/certifications/study-guides.ts"), "utf8");
const VERIF = readFileSync(path.join(ROOT, "src/content/certifications/verification.ts"), "utf8");

// The threshold, kept equal to FRESHNESS_DAYS in src/lib/certStatus.ts (read from it, so the two cannot drift).
const STATUS_SRC = readFileSync(path.join(ROOT, "src/lib/certStatus.ts"), "utf8");
const FRESHNESS_DAYS = Number(/export const FRESHNESS_DAYS = (\d+);/.exec(STATUS_SRC)?.[1]);
if (!Number.isFinite(FRESHNESS_DAYS)) {
  console.error("[check-cert-verification] FAIL: FRESHNESS_DAYS not found in src/lib/certStatus.ts");
  process.exit(1);
}

// Every guide's slug: the guide-level "slug:" lines inside the studyGuides array.
const guidesBody = GUIDES.slice(GUIDES.indexOf("export const studyGuides: StudyGuide[] = ["));
const guideSlugs = [...guidesBody.matchAll(/\n {4}slug: "([^"]+)"/g)].map((m) => m[1]);

// Every verification entry: "slug": { on: "YYYY-MM-DD", basis: "..." }.
const entries = [...VERIF.matchAll(/\n {2}"([^"]+)": \{ on: "([^"]*)", basis: "((?:[^"\\]|\\.)*)" \},/g)].map((m) => ({
  slug: m[1],
  on: m[2],
  basis: m[3],
}));

// Today's UTC calendar day, the build day of a static page.
const today = new Date().toISOString().slice(0, 10);
const errors = [];

// 1. One entry per guide, no entry without a guide, no duplicate.
const seen = new Map();
for (const e of entries) seen.set(e.slug, (seen.get(e.slug) ?? 0) + 1);
for (const [slug, n] of seen) if (n > 1) errors.push(`${slug}: ${n} entries`);
const guideSet = new Set(guideSlugs);
for (const slug of guideSlugs) if (!seen.has(slug)) errors.push(`${slug}: no verification entry`);
for (const slug of seen.keys()) if (!guideSet.has(slug)) errors.push(`${slug}: an entry for a guide that does not exist`);

// 2. Every date a real calendar day, no later than the build day; every basis non-empty.
for (const e of entries) {
  // A real day round-trips through Date unchanged (2026-02-30 does not).
  const real = /^\d{4}-\d{2}-\d{2}$/.test(e.on) && new Date(`${e.on}T00:00:00Z`).toISOString().slice(0, 10) === e.on;
  if (!real) errors.push(`${e.slug}: "${e.on}" is not a calendar day`);
  else if (e.on > today) errors.push(`${e.slug}: ${e.on} is after the build day ${today}`);
  if (!e.basis.trim()) errors.push(`${e.slug}: empty basis`);
}

if (errors.length) {
  console.error(`[check-cert-verification] FAIL: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

// 3. The report: records past the threshold, oldest first (the next re-verification batch).
const age = (on) => Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${on}T00:00:00Z`)) / 86_400_000);
const stale = entries.filter((e) => age(e.on) > FRESHNESS_DAYS).sort((a, b) => a.on.localeCompare(b.on));
const oldest = [...entries].sort((a, b) => a.on.localeCompare(b.on))[0];
console.log(
  `[check-cert-verification] OK: ${entries.length} guide(s), each with one dated check against the vendor's sources; ` +
    `${stale.length} older than ${FRESHNESS_DAYS} days` +
    (oldest ? `; oldest ${oldest.on} (${age(oldest.on)} days).` : "."),
);
for (const e of stale.slice(0, 12)) console.log(`  stale: ${e.slug} (${e.on}, ${age(e.on)} days)`);
