#!/usr/bin/env node
// ============================================================================
// check-page-titles  —  POST-BUILD.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-08-16, 343 pages carried the site-wide default
// <title>: 298 vendor hubs, 32 training pages, and TEN of the most important
// index pages on the site - the homepage, /tools, /learn, /practice, /training,
// /advisory, /about, /glossary, /certifications and /speaking.
//
// The title is the strongest on-page signal there is, and pages competing for
// entirely different intents were handing search engines one identical string.
//
// The cause was never a wrong title. It was THREE ROUTE COMPONENTS WITH NO
// `generateMetadata` EXPORT AT ALL, plus ten pages that computed the right
// words for their social card and never passed them to the page:
//
//     const alt = t("title");
//     return { ...ogImages("page", "tools", locale, alt) };   // no title:
//
// `ogImages()` returns Pick<Metadata, "openGraph" | "twitter">. Its own type
// says it cannot set a title, and nothing failed - the page simply inherited
// the default. THE BUILD CANNOT SEE AN ABSENCE; it can only see a contradiction.
//
// So this counts. A route family shipped without metadata shows up here as a
// jump in the number, on the build that introduced it.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const BASE = path.join("out", "en");
if (!fs.existsSync(BASE)) {
  console.log("[check-page-titles] SKIP: no build output to read.");
  process.exit(0);
}

// Pages that SHOULD carry the site name: the homepage and a few utility and
// dev routes, where the site is the subject. Measured 2026-08-16.
const BASELINE_DEFAULT = 14;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === "index.html") out.push(full);
  }
  return out;
}

const pages = walk(BASE);
const titles = new Map();
let defaultCount = 0;
let missing = 0;

for (const f of pages) {
  const html = fs.readFileSync(f, "utf8");
  const m = /<title>(.*?)<\/title>/s.exec(html);
  const route = "/" + path.relative(BASE, path.dirname(f)).split(path.sep).join("/");
  if (!m) { missing += 1; continue; }
  const title = m[1].trim();
  if (title.startsWith("ronutz \u00b7 Network")) defaultCount += 1;
  if (!titles.has(title)) titles.set(title, []);
  titles.get(title).push(route);
}

const problems = [];
if (missing > 0) problems.push(`${missing} page(s) render no <title> at all.`);
if (defaultCount > BASELINE_DEFAULT) {
  const offenders = [...titles.entries()]
    .filter(([t]) => t.startsWith("ronutz \u00b7 Network"))
    .flatMap(([, routes]) => routes)
    .slice(0, 12);
  problems.push(
    `${defaultCount} page(s) carry the site-wide default title, above the baseline of ${BASELINE_DEFAULT}.\n` +
    `        A route family has probably shipped without a generateMetadata export.\n        ` +
    offenders.join("\n        "),
  );
}

if (problems.length > 0) {
  console.error("\n[check-page-titles] FAIL\n");
  for (const p of problems) console.error(`      ${p}\n`);
  process.exit(1);
}

const dupes = [...titles.values()].filter((r) => r.length > 1).length;
console.log(
  `[check-page-titles] OK: ${pages.length} page(s), ${titles.size} distinct title(s); ` +
  `${defaultCount} on the site default (baseline ${BASELINE_DEFAULT})` +
  (dupes ? `, ${dupes} title(s) shared by more than one page.` : ".") +
  (defaultCount < BASELINE_DEFAULT ? ` LOWER - drop BASELINE_DEFAULT to ${defaultCount}.` : ""),
);
