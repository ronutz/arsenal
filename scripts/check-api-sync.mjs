// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-api-sync.mjs   (PREBUILD, right after scripts/build-openapi.mts)
// ----------------------------------------------------------------------------
// PRIME's rule, 2026-10-19 15:47, standing: "Each and every Tool's API and all
// related documentation including recipe necessarily have to change when the
// tool changes! We need to keep things synched, coherent, and sane!"
//
// WHY THIS EXISTS. On 2026-10-19 nine tools changed (new result fields, new
// options, corrected semantics) and /api/v1/cidr still returned only what it had
// returned in July: the engine had grown four modes and a classification, the
// API had not. Nothing noticed, because nothing tied the API record of a tool to
// the tool's behaviour.
//
// WHAT TIES THEM. Every tool's golden-vectors.ts exports a dated set id
// (GOLDEN_VECTOR_SET_ID, or SET_ID in some older tools), and the house rule is
// that the id changes whenever the vectors change, i.e. whenever behaviour
// changes on purpose. scripts/api-sync.json records, per API tool, the set id
// its API contract and related documents were last checked against. This guard
// compares the two:
//
//   1. every tool in API_TOOLS (src/lib/tools/registry.ts) has a record, and
//      every record names a tool in API_TOOLS;
//   2. each record equals the tool's current set id; a different id means the
//      vectors moved after the last sync, so the API contract (scripts/
//      openapi.base.yaml or the generated operation), the tool docs (en and
//      pt-BR), the recipes, the catalogue entry and the provenance entry must be
//      re-checked before the record is updated;
//   3. every operation in public/openapi.json carries x-golden-vector-set equal
//      to the record (build-openapi stamps it), so the published contract says
//      which vector set it describes.
//
// HOW TO CLEAR A FAILURE. Not by editing the id alone: re-check the documents
// listed in the failure text, change what the new vectors made untrue, then set
// the record to the new id and run `npx tsx scripts/build-openapi.mts` again.
//
// Run: node scripts/check-api-sync.mjs   (from the repository root)
// Read-only text scan: no app code is imported, so it runs under plain node.
// ============================================================================

import { readFileSync, existsSync } from "node:fs"; // file reads only
import { join } from "node:path"; // path joining

const ROOT = process.cwd(); // the repository root (the guard runs from it, like every prebuild guard)
const read = (p) => readFileSync(join(ROOT, p), "utf8"); // read a repository file as text

// ---- 1. The API tools, from the registry's API_TOOLS array. -----------------------------------------------------
const registry = read("src/lib/tools/registry.ts"); // the API registry source
const start = registry.indexOf("export const API_TOOLS"); // where the array begins
const end = registry.indexOf("export const API_TOOL_MAP"); // the declaration right after it
// The registry's shape is part of this guard's contract: if either marker moved, say so instead of passing silently.
if (start === -1 || end === -1 || end < start) {
  console.error("[check-api-sync] FAIL: could not find API_TOOLS in src/lib/tools/registry.ts; the file's shape changed and this guard must be updated."); // explain
  process.exit(1); // hard stop
} // markers found
const apiSlugs = [...registry.slice(start, end).matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]); // every exposed slug
// A sanity floor: far fewer slugs than the API has means the regex no longer reads the array.
if (apiSlugs.length < 100) {
  console.error(`[check-api-sync] FAIL: only ${apiSlugs.length} API tools parsed from registry.ts; the parser no longer matches the file.`); // explain
  process.exit(1); // hard stop
} // enough slugs

// ---- 2. Each tool's current golden-vector set id. -----------------------------------------------------------------
const SET_ID_RE = /export const (?:GOLDEN_VECTOR_SET_ID|SET_ID)\s*=\s*"([^"]+)"/; // the two constant names in use
/** The set id a tool's golden-vectors.ts exports, or null when the file or the constant is missing. */
function currentSetId(slug) {
  const file = `src/lib/tools/${slug}/golden-vectors.ts`; // where every tool keeps its vectors (D-49)
  if (!existsSync(join(ROOT, file))) return null; // no vectors file
  const m = SET_ID_RE.exec(read(file)); // the exported literal
  return m ? m[1] : null; // the id, or null when not a plain string literal
} // currentSetId

// ---- 3. The sync record. --------------------------------------------------------------------------------------
const record = JSON.parse(read("scripts/api-sync.json")).tools ?? {}; // slug -> set id last synced

// ---- 4. The published contract (written by build-openapi just before this guard runs). --------------------------
const spec = JSON.parse(read("public/openapi.json")); // the generated OpenAPI document

/** The YYYY-MM-DD date inside a set id, or null; used only to word the failure (newer / older). */
const dateOf = (id) => /(\d{4}-\d{2}-\d{2})/.exec(id ?? "")?.[1] ?? null; // e.g. "2026-10-19"

const problems = []; // every failure, collected so one run reports all of them
for (const slug of apiSlugs) { // each API tool
  const current = currentSetId(slug); // what the vectors say now
  const synced = record[slug]; // what the API was last synced with
  // A tool without a readable set id cannot be tracked at all.
  if (current === null) { problems.push(`${slug}: no GOLDEN_VECTOR_SET_ID / SET_ID string literal in src/lib/tools/${slug}/golden-vectors.ts`); continue; }
  // A tool missing from the record was never synced.
  if (typeof synced !== "string") { problems.push(`${slug}: not in scripts/api-sync.json (current vector set ${current})`); continue; }
  // The heart of the guard: the vectors moved after the last sync.
  if (synced !== current) {
    const [a, b] = [dateOf(synced), dateOf(current)]; // the two dates, when the ids carry them
    const how = a && b ? (b > a ? "is NEWER than" : b < a ? "is OLDER than" : "differs from (same date)") : "differs from"; // wording only
    problems.push(
      `${slug}: vector set ${current} ${how} the set the API was last synced with (${synced}). ` + // the finding
        `Re-check: the /${slug} operation (scripts/openapi.base.yaml if hand-authored, else the generated one), ` + // the contract
        `src/content/tool-docs/{en,pt-BR}/${slug}.md, src/content/guide/recipes.ts and the recipe and workflow messages, ` + // the docs and recipes
        `src/content/catalogue/catalogue.ts, src/config/toolProvenance.ts; then record ${current} in scripts/api-sync.json`, // the rest, then the record
    ); // reported
  } // compared
  // The published operations must carry the recorded id (build-openapi stamps it from the record).
  const ops = spec.paths?.[`/${slug}`]; // the tool's path in the contract
  if (!ops) { problems.push(`${slug}: no /${slug} path in public/openapi.json (run npx tsx scripts/build-openapi.mts)`); continue; } // not generated
  for (const [method, op] of Object.entries(ops)) { // get and post
    if (op["x-golden-vector-set"] !== synced) problems.push(`${slug}: public/openapi.json ${method} carries x-golden-vector-set ${JSON.stringify(op["x-golden-vector-set"])}, the record says ${synced} (run npx tsx scripts/build-openapi.mts)`); // stale contract
  } // every operation
} // every API tool
// Records for slugs the API does not expose would never be checked again: refuse them.
for (const slug of Object.keys(record)) if (!apiSlugs.includes(slug)) problems.push(`${slug}: recorded in scripts/api-sync.json but not in API_TOOLS (remove the record)`); // stale record

// ---- 5. Verdict. -------------------------------------------------------------------------------------------------
if (problems.length > 0) { // something is out of step
  console.error(`[check-api-sync] FAIL: ${problems.length} API record(s) out of step with the tools (PRIME's rule of 2026-10-19: a tool's API and its documents change when the tool changes):`); // headline
  for (const p of problems) console.error(`  - ${p}`); // each problem
  process.exit(1); // hard stop
} // all in step
console.log(`[check-api-sync] OK: all ${apiSlugs.length} API tools are synced with their current golden-vector sets, and public/openapi.json carries each set id.`); // success
