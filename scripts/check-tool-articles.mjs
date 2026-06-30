// ============================================================================
// scripts/check-tool-articles.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: every LIVE tool must ship its Learn articles.
//
// Canon (PRIME directive, ratified): a tool "build run" is not done when the
// tool merely works. Each built tool MUST also have at least one related Learn
// article in BOTH source locales (en + pt-BR), associated via the article
// frontmatter `relatedTools` field, so the in-tool Learn panel and the Learn
// index are never empty for a shipped tool. This script enforces that invariant
// at build time: if any built tool is missing an en or a pt-BR article, the
// build FAILS with a clear list, exactly the way the catalogue rank check or a
// failed golden vector would. It exists because the requirement was once missed
// (totp-hotp shipped without articles); an enforced check, not memory, is the
// fix.
//
// Mechanics: built-tool slugs are read from the catalogue source (the lines
// tagged `disposition: "built"`); article associations are read from the MDX
// frontmatter via gray-matter. No TypeScript import is needed, so this runs in
// the plain-node prebuild chain alongside copy-locales and gen-locale-coverage.
// ============================================================================

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGUE = path.join(ROOT, "src/content/catalogue/catalogue.ts");
const LEARN = path.join(ROOT, "src/content/learn");
// The locales an article must exist in for a tool to count as documented.
// en is the source of record; pt-BR is PRIME's brand language and kept at
// parity. Other locales are Phase-2 translation and intentionally not gated.
const REQUIRED_LOCALES = ["en", "pt-BR"];

// ---- 1. built-tool slugs from the catalogue --------------------------------
// Each catalogue entry is a single line; pull the slug from any line that also
// declares disposition: "built".
const catalogueSrc = readFileSync(CATALOGUE, "utf8");
const builtSlugs = [];
for (const line of catalogueSrc.split("\n")) {
  if (!/disposition:\s*"built"/.test(line)) continue;
  const m = line.match(/slug:\s*"([^"]+)"/);
  if (m) builtSlugs.push(m[1]);
}

// ---- 2. tool -> set of locales that have an article for it -----------------
// For each required locale, read every article's frontmatter and record which
// tools it lists in relatedTools.
const coverage = new Map(); // slug -> Set(locale)
for (const locale of REQUIRED_LOCALES) {
  const dir = path.join(LEARN, locale);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".mdx")) continue;
    const { data } = matter(readFileSync(path.join(dir, file), "utf8"));
    const related = Array.isArray(data.relatedTools) ? data.relatedTools : [];
    for (const slug of related) {
      if (!coverage.has(slug)) coverage.set(slug, new Set());
      coverage.get(slug).add(locale);
    }
  }
}

// ---- 3. verify every built tool is documented in every required locale -----
const failures = [];
for (const slug of builtSlugs) {
  const have = coverage.get(slug) ?? new Set();
  const missing = REQUIRED_LOCALES.filter((l) => !have.has(l));
  if (missing.length) failures.push({ slug, missing });
}

if (failures.length) {
  console.error(
    `\n[check-tool-articles] FAIL: ${failures.length} built tool(s) missing required Learn articles:`
  );
  for (const f of failures) {
    console.error(`  - ${f.slug}: no article in ${f.missing.join(", ")} (need relatedTools: ["${f.slug}"])`);
  }
  console.error(
    `\nEvery built tool needs at least one Learn article in ${REQUIRED_LOCALES.join(" + ")} ` +
      `that lists it in relatedTools. Write the article(s), then rebuild.\n`
  );
  process.exit(1);
}

console.log(
  `[check-tool-articles] OK: all ${builtSlugs.length} built tools have ${REQUIRED_LOCALES.join(" + ")} Learn articles.`
);
