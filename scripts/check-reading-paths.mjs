// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-reading-paths.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: the /study-guides curated reading paths must stay honest.
//
// Why: a reading path (src/content/study-guides/reading-paths.ts) is the one
// hand-authored map from an ordered list of Learn articles to the tools that
// exercise them. If an article is renamed or a tool retired, a path could be
// left pointing at a step that no longer exists. This guard turns that into a
// build failure with a clear message - the same discipline check-user-guide
// applies to the guide recipes and check-study-guides applies to the
// certification blueprints (D-74: derive > enforce > discipline).
//
// Checks:
//   1. every path id is lowercase-kebab and unique;
//   2. every article slug resolves to a .mdx in BOTH required locales
//      (en + pt-BR - the same pair check-tool-articles enforces);
//   3. every tool id is a live entry in src/config/tools.ts;
//   4. the i18n copy exists: studyGuidesIndex.paths.<id>.title/.lede in en.
//
// Mechanics: like the sibling guards, the data is simple enough to extract from
// the source text with regexes, so this runs in the plain-node prebuild chain.
// ============================================================================

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PATHS_FILE = path.join(ROOT, "src/content/study-guides/reading-paths.ts");
const TOOLS_FILE = path.join(ROOT, "src/config/tools.ts");
const LEARN = path.join(ROOT, "src/content/learn");
const EN_MESSAGES = path.join(ROOT, "src/i18n/messages/en.json");
const REQUIRED_LOCALES = ["en", "pt-BR"];

const src = readFileSync(PATHS_FILE, "utf8");
const toolsSrc = readFileSync(TOOLS_FILE, "utf8");
const messages = JSON.parse(readFileSync(EN_MESSAGES, "utf8"));

// --- extract the paths: id + its articles[] and tools[] blocks -------------
const pathBlocks = [...src.matchAll(/id:\s*"([a-z0-9-]+)",[\s\S]*?articles:\s*\[([\s\S]*?)\],[\s\S]*?tools:\s*\[([\s\S]*?)\]/g)];
const ids = pathBlocks.map((m) => m[1]);
const errors = [];

// 1. ids: kebab + unique
for (const id of ids) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) errors.push(`path id "${id}" is not lowercase-kebab`);
}
if (new Set(ids).size !== ids.length) errors.push("duplicate path ids");

// 3 (prep). the live tool-id set from the registry
const toolIds = new Set([...toolsSrc.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));

for (const [, id, articlesRaw, toolsRaw] of pathBlocks) {
  const articles = [...articlesRaw.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
  const tools = [...toolsRaw.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
  if (articles.length === 0) errors.push(`path "${id}" has no articles`);
  // 2. article slugs exist in both required locales
  for (const slug of articles) {
    for (const locale of REQUIRED_LOCALES) {
      if (!existsSync(path.join(LEARN, locale, `${slug}.mdx`))) {
        errors.push(`path "${id}": article "${slug}" missing ${locale} .mdx`);
      }
    }
  }
  // 3. tool ids live in the registry
  for (const t of tools) {
    if (!toolIds.has(t)) errors.push(`path "${id}": tool "${t}" is not in src/config/tools.ts`);
  }
  // 4. i18n copy present (en source of truth; other locales fall back)
  const copy = messages?.studyGuidesIndex?.paths?.[id];
  if (!copy?.title || !copy?.lede) {
    errors.push(`path "${id}": missing studyGuidesIndex.paths.${id}.title/.lede in en.json`);
  }
}

if (errors.length) {
  console.error(`[check-reading-paths] FAIL:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`[check-reading-paths] OK: ${ids.length} reading paths, every article slug present in ${REQUIRED_LOCALES.join(" + ")}, every tool id live, copy complete.`);
