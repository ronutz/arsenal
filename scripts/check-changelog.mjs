// ============================================================================
// scripts/check-changelog.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: every LIVE (built) tool must be recorded in the public changelog.
//
// Canon (PRIME directive): shipping a tool is not "done" until it is logged.
// The public changelog is a curated, dated record a build cannot fully generate
// (the prose is written), but it CAN be enforced: every built tool must appear
// in at least one changelog entry's `tools` array, so a shipped tool is never
// invisible in the change record. This closes the one cross-artifact step that
// was relying on memory - and was being missed. An enforced check, not
// discipline, is the fix (same rationale as check-tool-articles).
//
// Mechanics: built-tool slugs come from the catalogue source (disposition:
// "built"); logged slugs come from every `tools: [...]` array in the changelog
// data module. fs + regex only, so it runs in the plain-node prebuild chain.
// ============================================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGUE = path.join(ROOT, "src/content/catalogue/catalogue.ts");
const CHANGELOG = path.join(ROOT, "src/content/changelog/changelog.ts");

// ---- 1. built-tool slugs from the catalogue --------------------------------
const catalogueSrc = readFileSync(CATALOGUE, "utf8");
const builtSlugs = [];
for (const line of catalogueSrc.split("\n")) {
  if (!/disposition:\s*"built"/.test(line)) continue;
  const m = line.match(/slug:\s*"([^"]+)"/);
  if (m) builtSlugs.push(m[1]);
}

// ---- 2. slugs recorded anywhere in a changelog `tools: [...]` array ---------
const changelogSrc = readFileSync(CHANGELOG, "utf8");
const logged = new Set();
for (const m of changelogSrc.matchAll(/tools:\s*\[([^\]]*)\]/g)) {
  for (const s of m[1].matchAll(/"([^"]+)"/g)) logged.add(s[1]);
}

// ---- 3. verify every built tool is logged ----------------------------------
const missing = builtSlugs.filter((slug) => !logged.has(slug));
if (missing.length) {
  console.error(
    `\n[check-changelog] FAIL: ${missing.length} built tool(s) missing a changelog entry:`,
  );
  for (const slug of missing) console.error(`  - ${slug}: add a changelog entry with tools: ["${slug}"]`);
  console.error(
    `\nEvery built tool needs at least one changelog entry that lists it in ` +
      `tools. Add the entry to src/content/changelog/changelog.ts, then rebuild.\n`,
  );
  process.exit(1);
}

console.log(`[check-changelog] OK: all ${builtSlugs.length} built tools appear in the changelog.`);
