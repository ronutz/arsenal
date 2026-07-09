#!/usr/bin/env node
// ============================================================================
// scripts/check-vendor-namespace.mjs
// ----------------------------------------------------------------------------
// VENDOR NAMESPACE GUARD (ratified 2026-07-03). Vendor hub pages live at
// /<locale>/<vendor>, and /tools/<vendor> + /learn/<vendor> are permanent
// redirects into them. Those spellings only stay safe if NOTHING else ever
// claims a vendor key as its slug. This guard hard-fails the build when a
// vendor key collides with:
//   1. a tool id            (src/config/tools.ts)
//   2. a catalogue slug     (src/content/catalogue/catalogue.ts)
//   3. a Learn article slug (src/content/learn/en/*.mdx filenames)
//   4. a static route folder directly under src/app/[locale]/
//      (a static sibling would silently shadow the dynamic [vendor] route)
//
// Sources are read as TEXT with anchored regexes (these are .ts files and this
// is an .mjs prebuild script, so importing them is not an option). The vendor
// list is parsed from vendors.ts itself, so adding a vendor automatically
// extends the guard.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const read = (p) => fs.readFileSync(p, "utf8");

// ---- 1. the vendor keys, from the single source of truth ----
const vendorsSrc = read("src/config/vendors.ts");
const vendorKeys = [...vendorsSrc.matchAll(/\{\s*key:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
if (vendorKeys.length === 0) {
  console.error("[check-vendor-namespace] FAIL: no vendor keys parsed from src/config/vendors.ts");
  process.exit(1);
}

// ---- 2. every slug population that must stay disjoint from vendor keys ----
const toolIds = [...read("src/config/tools.ts").matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
const catalogueSlugs = [...read("src/content/catalogue/catalogue.ts").matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].map(
  (m) => m[1],
);
const articleSlugs = fs
  .readdirSync("src/content/learn/en")
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => f.replace(/\.mdx$/, ""));
// Glossary entry slugs address /glossary/<slug>; keep them out of vendor space
// too (registry is TS, so parse the slug: "..." lines the same way).
const glossarySlugs = [
  ...read("src/content/glossary/glossary.ts").matchAll(/\bslug:\s*"([a-z0-9-]+)"/g),
].map((m) => m[1]);
// Study-guide slugs address /certifications/<slug>; keep them out of vendor
// space too. Only the studyGuides array body carries slug: lines we care about.
const sgSrc = read("src/content/certifications/study-guides.ts");
const sgBody = sgSrc.slice(Math.max(0, sgSrc.indexOf("export const studyGuides")));
const studyGuideSlugs = [...sgBody.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
const routeFolders = fs
  .readdirSync("src/app/[locale]", { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith("["))
  .map((e) => e.name);

// ---- 3. collision scan ----
const populations = [
  ["tool id", toolIds],
  ["catalogue slug", catalogueSlugs],
  ["Learn article slug", articleSlugs],
  ["glossary slug", glossarySlugs],
  ["study-guide slug", studyGuideSlugs],
  ["static route under [locale]", routeFolders],
];
const collisions = [];
for (const key of vendorKeys) {
  for (const [what, list] of populations) {
    if (list.includes(key)) collisions.push(`vendor "${key}" collides with a ${what}`);
  }
}

if (collisions.length > 0) {
  console.error("[check-vendor-namespace] FAIL:");
  for (const c of collisions) console.error(`  - ${c}`);
  console.error("  Vendor keys are reserved URL namespace (hub pages + redirects). Rename the colliding item.");
  process.exit(1);
}

console.log(
  `[check-vendor-namespace] OK: ${vendorKeys.length} vendor keys (${vendorKeys.join(", ")}) are collision-free across ${toolIds.length} tool ids, ${catalogueSlugs.length} catalogue slugs, ${articleSlugs.length} article slugs, ${glossarySlugs.length} glossary slugs, ${studyGuideSlugs.length} study-guide slugs, and ${routeFolders.length} static routes.`,
);
