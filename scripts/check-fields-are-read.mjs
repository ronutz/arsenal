#!/usr/bin/env node
// ============================================================================
// check-fields-are-read
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. Three times this corpus has carried a relation that reached
// no reader: `documented` provenance printing "From the record" with no record,
// `sourceNote` typed nowhere and rendered nowhere, and `relatedTools` authored
// on 63 of 64 practice articles and rendered on none.
//
// EVERY OTHER MECHANISM HERE IS BLIND TO THIS. tsc sees types. The guards see
// rules. The render probes see text. NONE of them can see a field that is
// declared, populated, valid — and simply never read by a page.
//
// So: take every field declared on a content interface, and require that its
// name appears somewhere outside its own declaring file. A field nobody reads
// is either work that never reached a reader or dead weight, and both deserve
// to be noticed.
//
// This cannot prove a field is USED WELL, only that something reads it. That is
// the honest limit, and it still catches the fault that produced it.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

function walk(dir, test, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, test, out);
    else if (test(full)) out.push(full);
  }
  return out;
}

// SCOPE: THE CONTENT CORPORA, and deliberately not the tool compute modules.
//
// A first version walked src/lib recursively and reported 249 fields, almost
// all of them intermediate types inside tool engines — PcapSummary.firstTs,
// PoolResult.memberReason. Those are ENGINEERING types, covered by golden
// vectors and by tsc, and an unread one is a refactor artefact rather than
// content that failed to reach a reader.
//
// The fault this guard exists for is the other kind: a CORPUS field authored by
// hand, carrying editorial judgement, and rendered nowhere. So it reads the
// top-level content libraries and the content directory, which is exactly the
// scope the audit that produced it used.
const declaring = [
  ...fs.readdirSync("src/lib")
    .filter((f) => f.endsWith(".ts"))
    .map((f) => path.join("src/lib", f)),
  ...walk("src/content", (f) => f.endsWith(".ts")),
];
const consumerFiles = [
  ...walk("src/app", (f) => f.endsWith(".tsx") || f.endsWith(".ts")),
  ...walk("src/components", (f) => f.endsWith(".tsx")),
  ...walk("src/lib", (f) => f.endsWith(".ts")),
  ...walk("scripts", (f) => f.endsWith(".mjs") || f.endsWith(".mts")),
];

// Fields whose absence is a recorded decision rather than an oversight.
const ALLOWED = new Map([
  ["PracticeFrontmatter.relatedIndustry", "declared and authored EMPTY on all 64 articles; awaiting content rather than rendering (2026-08-15)"],
]);

// Names too generic to attribute — their presence elsewhere proves nothing.
const GENERIC = new Set(["slug", "id", "name", "title", "url", "label", "type", "kind", "order", "value", "note"]);

const problems = [];
let fieldCount = 0;

for (const file of declaring) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(/export interface (\w+)\s*\{([\s\S]*?)\n\}/g)) {
    const [, iface, body] = m;
    const fields = [...body.matchAll(/^ {2}(\w+)\??\s*:/gm)].map((x) => x[1]);
    for (const field of fields) {
      if (GENERIC.has(field)) continue;
      fieldCount += 1;
      const key = `${iface}.${field}`;
      if (ALLOWED.has(key)) continue;
      const readSomewhere = consumerFiles.some((f) => {
        if (f === file) return false;
        return new RegExp(`\\b${field}\\b`).test(fs.readFileSync(f, "utf8"));
      });
      if (!readSomewhere) {
        problems.push(`${key} — declared in ${file.replace(/^src\//, "")} and read by nothing`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`\n[check-fields-are-read] FAIL: ${problems.length} content field(s) nobody reads.\n`);
  for (const p of problems.slice(0, 20)) console.error(`      ${p}`);
  console.error("\n      A field nobody reads is work that never reached a reader, or dead weight.\n");
  process.exit(1);
}

console.log(
  `[check-fields-are-read] OK: ${fieldCount} content field(s) declared; every one is read somewhere` +
  ` (${ALLOWED.size} documented exception).`,
);
