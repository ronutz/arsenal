// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-learning-geography.mjs
// ----------------------------------------------------------------------------
// EVERY LEARNING COMPANY CARRIES ITS FLAG, HEADQUARTERS AND FOOTPRINT.
//
// /industry/learning shows, on each card, the founding flag (origins.ts) and the
// headquarters and activity geography (geography.ts), as PRIME asked on
// 2026-10-05 22:20. A card without the line beside cards that have it reads as
// an omission, and a default footprint dressed as a sourced one reads as a lie;
// this guard rules both out at build time, by text, since the three data files
// are TypeScript the build does not otherwise cross-check:
//
//   1. every entry tagged "training" in partners.ts has a row in geography.ts
//      and an origin in origins.ts;
//   2. every country code a row names (hq, where.countries) has a name in
//      COUNTRY_NAMES, so no bare code reaches a reader;
//   3. a `pending: true` row is `scope: "national"` (the HQ by default, PRIME's
//      rule) and its source label says so;
//   4. an `international` row names at least one country or region, a
//      `national` or `global` row names none;
//   5. every row has a source with an https URL.
// ============================================================================
import { readFileSync } from "node:fs";

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const partners = read("../src/content/vendors/partners.ts");
const geography = read("../src/content/vendors/geography.ts");
const origins = read("../src/content/vendors/origins.ts");

// 1a. The training-tagged slugs, from the entries' own tags lines.
const trainingSlugs = [];
for (const entry of partners.split(/\n  \{\n/)) {
  const slug = /slug: "([^"]+)"/.exec(entry)?.[1];
  const tags = /tags: \[([^\]]*)\]/.exec(entry)?.[1] ?? "";
  if (slug && /"training"/.test(tags)) trainingSlugs.push(slug);
}

// 1b. The geography rows, parsed by their shape: `  slug: {` or `  "slug": {` at two spaces, then the row body up
// to the next row start. A row is the text between its key and the next key at the same indent.
const rows = new Map();
const rowRe = /\n  "?([a-z0-9-]+)"?: \{\n([\s\S]*?)\n  \},/g;
for (let m; (m = rowRe.exec(geography)); ) rows.set(m[1], m[2]);

// 1c. The origin slugs and the named countries.
const originSlugs = new Set([...origins.matchAll(/^\s+"?([a-z0-9-]+)"?: "[A-Z]{2}"/gm)].map((m) => m[1]));
const namesBlock = origins.slice(origins.indexOf("export const COUNTRY_NAMES"), origins.indexOf("};", origins.indexOf("export const COUNTRY_NAMES")));
const namedCodes = new Set([...namesBlock.matchAll(/^\s+([A-Z]{2}):/gm)].map((m) => m[1]));

const failures = [];
for (const slug of trainingSlugs) {
  if (!rows.has(slug)) failures.push(`"${slug}" is tagged training and has no row in geography.ts.`);
  if (!originSlugs.has(slug)) failures.push(`"${slug}" is tagged training and has no origin in origins.ts.`);
}
for (const [slug, body] of rows) {
  const scope = /scope: "(global|international|national)"/.exec(body)?.[1];
  if (!scope) failures.push(`${slug}: scope is missing or not one of global, international, national.`);
  const pending = /pending: true/.test(body);
  const hq = /hq: \{ country: "([A-Z]{2})"/.exec(body)?.[1];
  if (!hq) failures.push(`${slug}: hq.country is missing.`);
  else if (!namedCodes.has(hq)) failures.push(`${slug}: hq.country "${hq}" has no name in COUNTRY_NAMES.`);
  const where = /where: \{([^}]*)\}/.exec(body)?.[1] ?? "";
  const countries = [...where.matchAll(/"([A-Z]{2})"/g)].map((m) => m[1]);
  const regions = [...where.matchAll(/"(latinAmerica|mercosur|asiaPacific)"/g)].map((m) => m[1]);
  for (const c of countries) if (!namedCodes.has(c)) failures.push(`${slug}: where.countries "${c}" has no name in COUNTRY_NAMES.`);
  if (scope === "international" && countries.length + regions.length === 0) failures.push(`${slug}: international, but names no country or region.`);
  if (scope !== "international" && where) failures.push(`${slug}: ${scope}, but carries a where clause.`);
  if (pending && scope !== "national") failures.push(`${slug}: pending, so the scope must be national (the HQ by default).`);
  if (pending && !/pending research/.test(body)) failures.push(`${slug}: pending, but the source label does not say so.`);
  if (!/source: \{ label: "(?:[^"\\]|\\.)+", url: "https:\/\/[^"]+" \}/.test(body)) failures.push(`${slug}: the source is missing, or its URL is not https.`);
}

if (failures.length) {
  console.error(`\n[check-learning-geography] FAIL: ${failures.length} problem(s).\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}
const pending = [...rows.values()].filter((b) => /pending: true/.test(b)).length;
console.log(`[check-learning-geography] OK: ${trainingSlugs.length} training entries, ${rows.size} geography rows, ${pending} pending (HQ by default); every code named, every row sourced.`);
