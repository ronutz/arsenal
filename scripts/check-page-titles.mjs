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

// Pages that SHOULD carry the site name, where the site itself is the subject.
//
// PAID DOWN 2026-09-27: 14 -> 2, measured against a real en build, not inferred.
// The comment this replaces said "the homepage and a few utility and dev
// routes", and that was wrong about its own list: of the fourteen, EIGHT were
// substantive content pages competing for entirely different search intents on
// one identical string - /endorsements, /colophon, /contact, /about/credentials,
// the three career-era pages and /industry/chapters - plus four more with real
// titles sitting unused in the message packs (/license, /privacy, /settings,
// /support). None of them had a generateMetadata export at all, which is the
// same root cause this guard's header describes; the 2026-08-16 fix reached the
// index routes and never came back for these.
//
// Two remain, and both are correct:
//   /                          the homepage, where the site IS the subject
//   /dev/other/serial-console  a dev route, not public surface
//
// Titles come from keys that already existed in en.json and pt-BR.json, so both
// authored locales resolve. No ogImages() was added: none of these slugs is in
// gen-og's STATIC_PAGES, so a card would be named and never generated, and
// check-og fails on a manifest entry with nothing behind it. Adding the twelve
// to that list is a separate change with an image-budget cost (canon
// FIX-incident-asset-budget-20260831).
// Routes permitted to carry the site-wide default title, each with the reason.
// Keys are routes RELATIVE TO BASE, which is out/en - this guard walks one locale,
// so the routes are already locale-free and are compared as-is. An earlier version
// of this change stripped a leading locale segment from them, which would have
// turned "/tools" into "/" and tolerated exactly the route family the guard exists
// to catch. Replaced a bare count of 2 on 2026-09-27, because a count cannot see a
// swap: give a new route family the default title and fix the homepage in the same
// change, and the total is still two.
const DECLARED_DEFAULT = new Map([
  ["/", "The homepage, where the site itself IS the subject. Since 2026-10-05 it sets its own title (home.front.metaTitle, 'ronutz · Network & security tools, knowledge, history and practice', PRIME's decision 4 of 05/10), which shares the 'ronutz · Network' opening this guard keys on by design: a title that starts with the site name is the right one here and a fallback anywhere else."],
  ["/dev/other/serial-console", "A dev route, not public surface. Nothing competes with it for search intent."],
]);


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
const defaultRoutes = [];
let missing = 0;

for (const f of pages) {
  const html = fs.readFileSync(f, "utf8");
  const m = /<title>(.*?)<\/title>/s.exec(html);
  const route = "/" + path.relative(BASE, path.dirname(f)).split(path.sep).join("/");
  if (!m) { missing += 1; continue; }
  const title = m[1].trim();
  if (title.startsWith("ronutz \u00b7 Network")) {
    defaultCount += 1;
    defaultRoutes.push(route);
  }
  if (!titles.has(title)) titles.set(title, []);
  titles.get(title).push(route);
}

const problems = [];
if (missing > 0) problems.push(`${missing} page(s) render no <title> at all.`);
// Per route, with the locale stripped. An undeclared route on the default title
// is a failure whatever the total is, which is the point of the change.
const undeclared = [...new Set(defaultRoutes)].filter((r) => !DECLARED_DEFAULT.has(r));
if (undeclared.length > 0) {
  problems.push(
    `${undeclared.length} route(s) carry the site-wide default title and are not declared.\n` +
    `        A route family has probably shipped without a generateMetadata export.\n` +
    `        If a route belongs here, add it to DECLARED_DEFAULT with a REASON.\n        ` +
    undeclared.slice(0, 12).join("\n        "),
  );
}

// A declaration whose route no longer carries the default has been fixed, and the
// list has to shrink or it stops meaning anything.
const seenStripped = new Set(defaultRoutes);
const stale = [...DECLARED_DEFAULT.keys()].filter((r) => !seenStripped.has(r));
if (stale.length > 0 && pages.length > 0) {
  problems.push(
    `${stale.length} stale declaration(s) in DECLARED_DEFAULT - these routes no longer\n` +
    `        carry the default title, so remove them:\n        ` + stale.join("\n        "),
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
  `${defaultCount} page(s) on the site default, across ${DECLARED_DEFAULT.size} declared ` +
  `route(s) with a reason (per-route since 2026-09-27)` +
  (dupes ? `, ${dupes} title(s) shared by more than one page.` : "."),
);
