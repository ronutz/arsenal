// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-training-series.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD (milestone NF-1 of the student level-up, 2026-10-06): the
// training series registry (src/content/study-guides/training-series.ts) points
// only at real articles and live tools, and every word it needs is in both
// authored packs.
//
// What it checks, failing the build on any of them:
//   1. series ids are unique and safe as URL fragments;
//   2. every series names a curriculum of TRAINING_CURRICULA, and the levels
//      inside each curriculum run contiguously from 1 (no NetFun III without a
//      NetFun II); every prerequisite names a registered series;
//   3. every module id is unique in its series, and every module has at least
//      three parts (written and planned together);
//   4. every written part is an article at that ADDRESS in English AND in
//      Portuguese (the frontmatter's slug, else the file name, as src/lib/learn.ts
//      keys articles); no part, written or planned, appears twice in a series;
//   5. every tool is a live tool of src/config/tools.ts, and a module with no
//      tool says why (its `toolless` reason);
//   6. every copy key the page reads is in both packs: the shared labels under
//      studyGuidesIndex.training, and per series its short name, title, lede,
//      outcome, each module's title and outcome, and each planned part's name.
// It reads the registry's array as a JavaScript literal (the file's types sit
// outside it), so it runs in the prebuild chain before anything is compiled.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = readFileSync(path.join(ROOT, "src/content/study-guides/training-series.ts"), "utf8");
const errors = [];

// The registry's array, cut from its declaration to the bracket that closes it at the start of a line.
const start = SRC.indexOf("export const TRAINING_SERIES: TrainingSeries[] = [");
const end = SRC.indexOf("\n];", start);
let SERIES = [];
if (start < 0 || end < 0) errors.push("TRAINING_SERIES could not be found in training-series.ts (has its layout changed?)");
else {
  const literal = SRC.slice(SRC.indexOf("[", start + "export const TRAINING_SERIES: TrainingSeries[] = ".length - 1), end + 2);
  // Evaluated as plain data: the literal holds only objects, arrays, strings and numbers.
  try { SERIES = new Function(`return ${literal}`)(); } catch (e) { errors.push(`TRAINING_SERIES is not a plain literal: ${e.message}`); }
}
const CURRICULA = JSON.parse((SRC.match(/export const TRAINING_CURRICULA = (\[[^\]]*\]) as const;/) || [, "[]"])[1]);

// The live tools, from the registry's own lines.
const TOOLS_SRC = readFileSync(path.join(ROOT, "src/config/tools.ts"), "utf8");
const LIVE = new Set([...TOOLS_SRC.matchAll(/\{ id: "([^"]+)"[^\n]*available: true/g)].map((m) => m[1]));

// Every article's address in each language, mapped to its file: the frontmatter's slug where it declares one, else the
// file name (the same rule as check-learn-series).
const ROUTES = Object.fromEntries(
  ["en", "pt-BR"].map((loc) => {
    const dir = path.join(ROOT, "src/content/learn", loc);
    const map = new Map();
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".mdx"))) {
      const head = readFileSync(path.join(dir, f), "utf8").split("\n---", 1)[0];
      const declared = (head.match(/^slug:\s*"?([^"\n]+?)"?\s*$/m) || [])[1];
      map.set(declared || f.slice(0, -4), f);
    }
    return [loc, map];
  }),
);

// The packs, and a lookup by dotted key under studyGuidesIndex.
const PACKS = Object.fromEntries(["en", "pt-BR"].map((l) => [l, JSON.parse(readFileSync(path.join(ROOT, "src/i18n/messages", `${l}.json`), "utf8"))]));
const has = (loc, key) => key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), PACKS[loc].studyGuidesIndex) !== undefined;
const SHARED = ["title", "lede", "level", "outcomeLabel", "noPrerequisites", "prerequisites", "counts", "plannedCount", "start", "module", "moduleCount", "parts", "planned", "toolless"];
for (const loc of ["en", "pt-BR"]) for (const k of SHARED) if (!has(loc, `training.${k}`)) errors.push(`studyGuidesIndex.training.${k} is missing from the ${loc} pack`);

// 1 and 2. Ids, curricula, levels, prerequisites.
const ids = new Set();
for (const s of SERIES) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s.id ?? "")) errors.push(`series id "${s.id}" is not a lower-case slug`);
  if (ids.has(s.id)) errors.push(`series id "${s.id}" is used twice`);
  ids.add(s.id);
  if (!CURRICULA.includes(s.curriculum)) errors.push(`${s.id}: curriculum "${s.curriculum}" is not one of TRAINING_CURRICULA`);
}
for (const c of CURRICULA) {
  const levels = SERIES.filter((s) => s.curriculum === c).map((s) => s.level).sort((a, b) => a - b);
  levels.forEach((l, i) => { if (l !== i + 1) errors.push(`curriculum ${c}: levels ${JSON.stringify(levels)} do not run contiguously from 1`); });
}
for (const s of SERIES) for (const p of s.prerequisites ?? []) if (!ids.has(p)) errors.push(`${s.id}: prerequisite "${p}" is not a registered series`);

// 3 to 6. Modules, parts, tools, copy.
let written = 0, planned = 0, modules = 0;
for (const s of SERIES) {
  const key = `training.items.${s.id}`;
  for (const loc of ["en", "pt-BR"]) for (const k of ["short", "title", "lede", "outcome"]) if (!has(loc, `${key}.${k}`)) errors.push(`${s.id}: ${k} missing from the ${loc} pack`);
  const mids = new Set(), seen = new Set();
  for (const m of s.modules ?? []) {
    modules++;
    if (mids.has(m.id)) errors.push(`${s.id}: module id "${m.id}" is used twice`);
    mids.add(m.id);
    if ((m.parts ?? []).length < 3) errors.push(`${s.id}/${m.id}: ${m.parts?.length ?? 0} part(s); a module needs at least three`);
    for (const loc of ["en", "pt-BR"]) for (const k of ["title", "outcome"]) if (!has(loc, `${key}.modules.${m.id}.${k}`)) errors.push(`${s.id}/${m.id}: ${k} missing from the ${loc} pack`);
    for (const p of m.parts ?? []) {
      const tag = p.slug ? `slug:${p.slug}` : `planned:${p.planned}`;
      if (seen.has(tag)) errors.push(`${s.id}: ${tag} appears twice in the series`);
      seen.add(tag);
      if (p.slug) {
        written++;
        for (const loc of ["en", "pt-BR"]) if (!ROUTES[loc].has(p.slug)) errors.push(`${s.id}/${m.id}: no ${loc} article at the address ${p.slug}`);
      } else if (p.planned) {
        planned++;
        for (const loc of ["en", "pt-BR"]) if (!has(loc, `${key}.planned.${p.planned}`)) errors.push(`${s.id}/${m.id}: the planned part ${p.planned} is not named in the ${loc} pack`);
      } else errors.push(`${s.id}/${m.id}: a part is neither written nor planned`);
    }
    for (const tl of m.tools ?? []) if (!LIVE.has(tl)) errors.push(`${s.id}/${m.id}: tool "${tl}" is not a live tool`);
    if (!(m.tools ?? []).length && !(m.toolless ?? "").trim()) errors.push(`${s.id}/${m.id}: no tool and no reason (toolless)`);
  }
}

if (!SERIES.length) errors.push("no training series could be read from training-series.ts");
if (errors.length) {
  console.error(`[check-training-series] FAIL: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`[check-training-series] OK: ${SERIES.length} series; ${modules} module(s), ${written} written article(s) and ${planned} planned part(s), each in both languages; levels contiguous, prerequisites registered, every module with three or more parts and its tools or a reason.`);
