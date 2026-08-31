#!/usr/bin/env node
// ============================================================================
// check-internal-links  —  POST-BUILD, because it reads the built site.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. The 2026-08-16 audit found /about/pre-1996 still linking to
// /industry/history, the address it was moved FROM. Both targets had ceased to
// exist and nothing noticed: a route disappears, and the href that pointed at
// it stays a perfectly valid string.
//
//   A PAGE THAT MOVES TAKES ITS OWN OUTBOUND LINKS WITH IT.
//
// So every internal href in the built output must resolve to something that
// was actually built — a route directory with an index.html, or a real file
// such as the machine-readable /tools/<slug>.md companions.
//
// IT RUNS AFTER THE BUILD, NOT BEFORE. The prebuild guards read source; this
// one needs the artefact, and a check that cannot see the artefact is how the
// last three faults survived.
//
// A RATCHET. Three broken links pre-dated this guard. Two were repaired on
// 2026-08-16 once their real causes were found - a career link pointing at
// /industry/chapters/versa when the lineage page is /industry/versa, and a
// history card pointing at a profile slug that had been DISSOLVED and replaced.
// Neither was a judgement call in the end; both were simply wrong.
//
// ONE REMAINS, AND IT SHOULD: the changelog's link to the pre-1996 page's old
// address. A changelog entry is a dated record of what happened, and repointing
// it would be editing history to tidy a report.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const OUT = "out";
// One locale is enough — the routes are generated per locale — but WHICH locale
// must adapt to what was built. R-18 audit finding (2026-08-26): this guard was
// pinned to "en", so single-locale pt-BR verification builds hit the SKIP branch
// and shipped with internal links entirely unchecked. Now it prefers en when
// present and otherwise takes the first built locale, so every build gets read.
const LOCALE = fs.existsSync(path.join(OUT, "en", "index.html"))
  ? "en"
  : (fs.existsSync(OUT)
      ? fs.readdirSync(OUT, { withFileTypes: true })
          .filter(
            (e) =>
              e.isDirectory() &&
              /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(e.name) && // locale-shaped only: out/404/ is a page, not a locale
              fs.existsSync(path.join(OUT, e.name, "index.html"))
          )
          .map((e) => e.name)
          .sort()[0]
      : undefined);
const BASE = LOCALE ? path.join(OUT, LOCALE) : undefined;

if (!BASE || !fs.existsSync(BASE)) {
  console.log("[check-internal-links] SKIP: no build output to read.");
  process.exit(0);
}
console.log(`[check-internal-links] reading locale: ${LOCALE}`);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = walk(BASE);
const pages = all.filter((f) => f.endsWith("index.html"));

// What exists: route directories, and every non-HTML file that shipped.
const routes = new Set(pages.map((p) => "/" + path.relative(BASE, path.dirname(p)).split(path.sep).join("/")));
routes.add("/.");
routes.add("/");
const files = new Set(all.filter((f) => !f.endsWith(".html")).map((p) => "/" + path.relative(BASE, p).split(path.sep).join("/")));

const broken = new Map();
for (const p of pages) {
  const from = "/" + path.relative(BASE, path.dirname(p)).split(path.sep).join("/");
  const html = fs.readFileSync(p, "utf8");
  for (const m of html.matchAll(new RegExp(`href="/${LOCALE}([^"#?]*)"`, "g"))) {
    const raw = m[1] || "/";
    const target = raw.replace(/\/$/, "") || "/";
    if (routes.has(target) || files.has(raw) || files.has(target)) continue;
    if (!broken.has(target)) broken.set(target, from);
  }
}

// Pre-existing, and one of them deliberate — see the header.
const BASELINE = 1;

if (broken.size > BASELINE) {
  console.error(`\n[check-internal-links] FAIL: ${broken.size} internal link(s) resolve to nothing, above the baseline of ${BASELINE}.\n`);
  for (const [target, from] of [...broken].slice(0, 20)) {
    console.error(`      ${target}   (linked from ${from})`);
  }
  console.error("\n      A route that moved leaves its old address looking like a valid string.\n");
  process.exit(1);
}

console.log(
  `[check-internal-links] OK: ${pages.length} page(s), every internal href resolves;` +
  ` ${broken.size} known-broken (baseline ${BASELINE}, may only go down).` +
  (broken.size < BASELINE ? ` LOWER - drop BASELINE to ${broken.size}.` : ""),
);
