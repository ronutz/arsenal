// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-workflows.mjs
// ----------------------------------------------------------------------------
// EVERY WORKFLOW STEP IS A BUILT TOOL WITH A NAME, AND EVERY WORKFLOW HAS COPY.
//
// src/content/tools/workflows.ts chains tools by slug (E4 of Round 1,
// 2026-10-06). A slug that is misspelt, retired or never built would render as
// a dead link or a missing name; the page drops unknown slugs silently so the
// chain never breaks for a reader, which is exactly why a guard must notice.
// Three checks, by text, since the data files are TypeScript:
//
//   1. every slug a step or an alternative names has a manifest directory under
//      src/lib/tools and an `available: true` entry in src/config/tools.ts;
//   2. every workflow id has tools.hub.workflows.<id>.title and .lede in both
//      authored locales (en, pt-BR);
//   3. no workflow repeats a slug within its own steps.
// ============================================================================
import { readFileSync, existsSync } from "node:fs";

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const src = read("../src/content/tools/workflows.ts");
const config = read("../src/config/tools.ts");
const en = JSON.parse(read("../src/i18n/messages/en.json"));
const pt = JSON.parse(read("../src/i18n/messages/pt-BR.json"));

// The workflows, parsed from their literal shape: each `id: "..."` and the text up to the next id (or the end
// of the array), so the steps may sit on one line or many.
const ids = [...src.matchAll(/\n\s*id: "([a-z0-9-]+)",/g)];
const endOfArray = src.indexOf("] as const");
const blocks = ids.map((m, i) => [m[0], m[1], src.slice(m.index + m[0].length, i + 1 < ids.length ? ids[i + 1].index : endOfArray)]);
const failures = [];
if (blocks.length === 0) failures.push("no workflow parsed from src/content/tools/workflows.ts; the file's shape changed.");

for (const [, id, body] of blocks) {
  const slugs = [...body.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
  const stepSlugs = [...body.matchAll(/slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
  // 3. no repeated step within a chain
  if (new Set(stepSlugs).size !== stepSlugs.length) failures.push(`${id}: a step slug repeats.`);
  // 1. every slug exists and is available
  for (const slug of slugs) {
    if (!existsSync(new URL(`../src/lib/tools/${slug}/index.ts`, import.meta.url))) failures.push(`${id}: "${slug}" has no manifest under src/lib/tools.`);
    const entry = new RegExp(`id: "${slug}"[^\\n]*available: true`).test(config);
    if (!entry) failures.push(`${id}: "${slug}" is not an available entry in src/config/tools.ts.`);
  }
  // 2. copy in both locales
  for (const [loc, m] of [["en", en], ["pt-BR", pt]]) {
    const w = m?.tools?.hub?.workflows?.[id];
    if (!w || typeof w.title !== "string" || typeof w.lede !== "string") failures.push(`${id}: tools.hub.workflows.${id}.title/lede missing in ${loc}.`);
  }
}

if (failures.length) {
  console.error(`\n[check-workflows] FAIL: ${failures.length} problem(s).\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}
console.log(`[check-workflows] OK: ${blocks.length} workflow(s); every step a built, available tool; copy in en and pt-BR; no repeated steps.`);
