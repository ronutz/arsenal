// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-page-weight.mjs  —  POST-BUILD, because it weighs the export.
// ----------------------------------------------------------------------------
// A WEIGHT BUDGET PER TEMPLATE, AS A RATCHET.
//
// WHAT HAPPENED. The production audit of 2026-10-15 (finding F07) measured the
// decoded HTML of the directory pages: the glossary at 3,253,001 bytes, the
// changelog at 2,767,638, the Learn index at 2,287,735, the industry index at
// 1,519,269. Response-body sizes, not transfer sizes, and not Core Web Vitals;
// but a document of three megabytes is parsed, hydrated and held in memory by
// every phone that opens it, and nothing in the build said so. A page can grow
// by a few kilobytes a day for a year and no guard notices.
//
// WHAT THIS GUARD DOES. It weighs every index.html of the built locales and
// holds each route to a ceiling: a declared one for the heavy templates below,
// the default for everything else. The declared ceilings sit a little above
// the measured weights of 2026-10-15, so the pages may not grow unnoticed; when
// one is reduced (the rendering strategy for the deep directories is PRIME's
// decision, proposed with these numbers), its ceiling is lowered to the new
// weight and the ratchet turns. It never fails a page that got lighter.
//
// It also prints the ten heaviest pages of the build, so the numbers the audit
// had to measure from outside are visible in every build log.
//
// Decoded bytes are what is measured: the file on disk, as the browser parses
// it after the edge has decompressed it.
// ============================================================================
import fs from "node:fs";
import path from "node:path";

// The tag every line of this guard's output carries.
const TAG = "[check-page-weight]";
// The export.
const OUT = "out";
// Nothing to weigh before an export.
if (!fs.existsSync(OUT)) {
  console.log(`${TAG} SKIP: no out/ yet (runs after an export).`);
  process.exit(0);
}

// The declared ceilings, in bytes, keyed by the route without its locale (the trailing slash dropped). Each was first
// the weight the audit measured on 2026-10-15 (English) plus about five per cent; re-based on 2026-10-19 at this
// guard's first run, because pt-BR pages run heavier than English ones (longer summaries): each ceiling is now the
// heavier of the two authored locales as built that day, plus about five per cent, so growth shows and shrinkage
// ratchets. Raised only with a reason written here.
const CEILINGS = new Map([
  // The glossary: every entry on one page (2026-10-19: en 3,331,001; pt-BR 3,397,844).
  ["/glossary", 3_570_000],
  // The changelog: every entry since the site began (2026-10-19: en 2,811,787; pt-BR 2,832,054).
  ["/changelog", 2_980_000],
  // The Learn index: every article's card (2026-10-19: en 2,341,296; pt-BR 2,426,314).
  ["/learn", 2_550_000],
  // The industry index: every organisation record's card (2026-10-19: en 1,516,848; pt-BR 1,525,955).
  ["/industry", 1_610_000],
]);
// The ceiling for every other route: a page a phone can take in one breath. Raised only with a reason written here.
const DEFAULT_CEILING = 1_200_000;
// Routes weighed and printed but held to no ceiling, each with its reason. Added 2026-10-19 at this guard's first run
// (a two-locale verification build): the copy editor weighed 9,019,461 bytes with en alone. It is the internal
// authoring workbench (unguessable URI, noindex, linked from nowhere, rendered only under the ?priv= token) and it
// embeds every live locale's message pack by design, so its weight grows with the packs and is not a reader's page.
const EXEMPT = new Map([
  ["/copy8825140637", "internal copy workbench: carries every live locale's message pack by design"],
]);

// The locales to weigh: the ones that were built (the partial verification build carries two, CI all sixteen).
const locales = fs
  .readdirSync(OUT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^[a-z]{2,3}(-[A-Za-z]+)?$/.test(d.name) && fs.existsSync(path.join(OUT, d.name, "index.html")))
  .map((d) => d.name);

/** Every file under a directory, recursively. */
function walk(dir, acc = []) {
  // Each entry, files collected and directories descended.
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  // Done.
  return acc;
}

// The weights: one row per built page.
const rows = [];
// Each failure is one sentence a reader can act on.
const failures = [];
// Each built locale.
for (const loc of locales) {
  // The locale's pages.
  const base = path.join(OUT, loc);
  for (const f of walk(base).filter((p) => p.endsWith("index.html"))) {
    // The route without the locale, "/" for the locale's home page.
    const rel = path.relative(base, path.dirname(f)).split(path.sep).join("/");
    const route = rel === "" ? "/" : `/${rel}`;
    // Decoded bytes: the file as written.
    const bytes = fs.statSync(f).size;
    rows.push({ loc, route, bytes });
    // The ceiling that applies.
    const ceiling = CEILINGS.get(route) ?? DEFAULT_CEILING;
    // Over it: a failure that names the page, its weight and its ceiling (an exempt route is weighed, never failed).
    if (bytes > ceiling && !EXEMPT.has(route)) {
      failures.push(`/${loc}${route}/ is ${bytes.toLocaleString("en")} bytes, over its ceiling of ${ceiling.toLocaleString("en")}.`);
    }
  }
}

// The ten heaviest, for the log.
rows.sort((a, b) => b.bytes - a.bytes);
console.log(`${TAG} ${rows.length} pages weighed in ${locales.join(", ")}; the heaviest:`);
for (const r of rows.slice(0, 10)) {
  console.log(`${TAG}   ${r.bytes.toLocaleString("en").padStart(11)} bytes  /${r.loc}${r.route}/`);
}

// The verdict.
if (failures.length) {
  console.error(`${TAG} FAIL: ${failures.length} page(s) over their weight ceiling.`);
  for (const f of failures) console.error(`${TAG}   - ${f}`);
  process.exit(1);
}
console.log(`${TAG} OK: every page within its ceiling (declared: ${[...CEILINGS.keys()].join(", ")}; default ${DEFAULT_CEILING.toLocaleString("en")} bytes).`);
