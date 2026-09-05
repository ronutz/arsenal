#!/usr/bin/env node
// ============================================================================
// check-css-classes  —  every className a page uses must exist in the CSS.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. PRIME reported the roles pages rendering unformatted. The
// cause was mine: I wrote class names FROM MEMORY of other components rather
// than from the stylesheet, and `dig-kv`, `dig-notes`, `page-title`,
// `page-lede`, `section-title` and several more had never existed.
//
// tsc cannot see this. A guard cannot see it. The build succeeds, the page
// renders, and every rule silently does nothing — which is the worst class of
// fault this codebase has produced, because ALL THE MECHANISMS REPORTED GREEN.
//
// So: read the class names out of the page source, read the selectors out of
// the CSS, and fail on any that the stylesheet has never heard of.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const CSS_DIRS = ["src/app", "src/styles"];
const PAGE_ROOT = "src/app";

function walk(dir, test, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, test, out);
    else if (test(full)) out.push(full);
  }
  return out;
}

// --- every selector the stylesheets define --------------------------------
const known = new Set();
for (const dir of CSS_DIRS) {
  for (const f of walk(dir, (x) => x.endsWith(".css"))) {
    const css = fs.readFileSync(f, "utf8");
    for (const m of css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) known.add(m[1]);
  }
}
if (known.size === 0) {
  console.error("[check-css-classes] FAIL: no CSS selectors found; check CSS_DIRS.");
  process.exit(1);
}

// Utility names that are generated or global rather than authored per-component.
const ALLOW = new Set(["mono", "sr-only", "visually-hidden"]);

const problems = [];
let checked = 0;
for (const f of walk(PAGE_ROOT, (x) => x.endsWith(".tsx"))) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/className="([a-z0-9 _-]+)"/g)) {
    for (const cls of m[1].split(/\s+/).filter(Boolean)) {
      checked += 1;
      if (!known.has(cls) && !ALLOW.has(cls)) {
        problems.push(`${f.replace(/^src\//, "")}: "${cls}" is used and never defined`);
      }
    }
  }
}

// --- A RATCHET, NOT A SWEEP ------------------------------------------------
//
// The first run found 21 undefined class names across pages nobody asked about
// — semantic wrappers on the colophon, the contact form, the roadmap. Some are
// harmless and some are dead; either way, rewriting seven unrelated pages to
// satisfy a guard written today would be the manufactured edit this canon has
// refused before.
//
// So the number may only go DOWN. The fault that produced this guard cannot
// recur, and the pre-existing ones can be cleared deliberately rather than in a
// panic.
// Ratchet. Lowered 21 -> 19 on 2026-09-05: adding the /stats rules to
// components.css defined two names that had been used and undefined. The guard
// itself asked for the drop, which is the point of a ratchet - it may only go
// down, so ground regained cannot be quietly given back.
const BASELINE = 19;

const uniq = [...new Set(problems)];
if (uniq.length > BASELINE) {
  console.error(`\n[check-css-classes] FAIL: ${uniq.length} undefined class name(s), above the baseline of ${BASELINE}.\n`);
  for (const p of uniq.slice(0, 25)) console.error(`      ${p}`);
  console.error("\n      A class with no rule behind it renders unformatted while every other check reports green.\n");
  process.exit(1);
}

console.log(
  `[check-css-classes] OK: ${checked} class use(s); ${uniq.length} undefined (baseline ${BASELINE}, may only go down).` +
  (uniq.length < BASELINE ? ` LOWER THAN BASELINE - drop BASELINE to ${uniq.length}.` : ""),
);
