// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-user-guide.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: the Site User Guide's curated recipes must only reference tools
// that actually exist and are available.
//
// Why: the guide's datasheet and quick-reference sections are derived from the
// registry, so they cannot go stale on their own. The one hand-authored part is
// src/content/guide/recipes.ts (task -> tool-id lists). If a tool is renamed or
// removed from src/config/tools.ts, a recipe could be left pointing at a tool
// that no longer exists. This guard turns that into a build failure with a clear
// message, exactly like check-tool-articles enforces tool<->article coverage.
// That is what keeps the curated section "aware of" additions and deletions.
//
// Mechanics: both files are TypeScript, but the data we need is simple, so we
// read the source text and extract it with regexes (no TS import needed), which
// lets this run in the plain-node prebuild chain.
//   - available tool ids  : lines in tools.ts of the form
//                           { id: "x", ..., available: true }
//   - referenced tool ids : the toolIds: [ ... ] arrays in recipes.ts
// A referenced id is valid only if it is present AND available. Any violation
// fails the build.
// ============================================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOLS = path.join(ROOT, "src/config/tools.ts");
const RECIPES = path.join(ROOT, "src/content/guide/recipes.ts");

const toolsSrc = readFileSync(TOOLS, "utf8");
const recipesSrc = readFileSync(RECIPES, "utf8");

// --- Collect available tool ids from the registry ---------------------------
// Each entry is a single-line object literal: { id: "jwt", href: "...",
// category: "...", available: true, ... }. We capture id + whether available.
const availableIds = new Set();
const allIds = new Set();
const ENTRY = /\{\s*id:\s*"([^"]+)"[^}]*?\}/g;
let m;
while ((m = ENTRY.exec(toolsSrc)) !== null) {
  const id = m[1];
  allIds.add(id);
  // `available: true` somewhere inside this same object literal.
  if (/available:\s*true/.test(m[0])) availableIds.add(id);
}

if (availableIds.size === 0) {
  console.error(
    "[check-user-guide] Could not parse any available tools from src/config/tools.ts. " +
      "The registry format may have changed; update this guard.",
  );
  process.exit(1);
}

// --- Collect tool ids referenced by the guide recipes -----------------------
// Grab every toolIds: [ ... ] array, then every "quoted" id inside it.
const referenced = []; // { recipeHint, id }
const ARRAYS = /toolIds:\s*\[([^\]]*)\]/g;
while ((m = ARRAYS.exec(recipesSrc)) !== null) {
  const inner = m[1];
  const idRe = /"([^"]+)"/g;
  let mm;
  while ((mm = idRe.exec(inner)) !== null) {
    referenced.push(mm[1]);
  }
}

if (referenced.length === 0) {
  console.error(
    "[check-user-guide] No recipe tool references found in src/content/guide/recipes.ts. " +
      "Expected one or more toolIds: [ ... ] arrays.",
  );
  process.exit(1);
}

// --- Validate ---------------------------------------------------------------
const missing = []; // id not in the registry at all
const unavailable = []; // id present but not available
for (const id of referenced) {
  if (!allIds.has(id)) missing.push(id);
  else if (!availableIds.has(id)) unavailable.push(id);
}

if (missing.length > 0 || unavailable.length > 0) {
  console.error("[check-user-guide] FAILED: the User Guide references tools that are not usable.\n");
  if (missing.length > 0) {
    console.error("  Not found in src/config/tools.ts:");
    for (const id of [...new Set(missing)]) console.error(`    - ${id}`);
  }
  if (unavailable.length > 0) {
    console.error("  Present but not available: true:");
    for (const id of [...new Set(unavailable)]) console.error(`    - ${id}`);
  }
  console.error(
    "\n  Fix: update the recipe in src/content/guide/recipes.ts (rename or remove the id), " +
      "or make the tool available in the registry.",
  );
  process.exit(1);
}

console.log(
  `[check-user-guide] OK: ${referenced.length} recipe tool references across the guide, ` +
    `all live in the registry (${availableIds.size} available tools).`,
);
