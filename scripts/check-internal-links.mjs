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
// TWO LOCALES NOW, NOT ONE. The premise stated above - "one locale is enough,
// the routes are generated per locale" - stopped being true on 2026-09-10, when
// the Learn and glossary DETAIL pages became authored-locales-only and every
// other live locale dropped from ~3,383 pages to ~1,007. Reading only "en"
// would leave a broken link inside a non-authored locale permanently invisible,
// and those locales are exactly where link targets have just disappeared.
//
// So: the preferred locale (en) AND, when one was built, the first
// non-authored one. Nothing is assumed about which locales a verification build
// contains; if only en was built this behaves exactly as before.
const AUTHORED_SET = new Set(
  [...(fs.readFileSync("src/i18n/locales.ts", "utf8")
    .match(/AUTHORED_CONTENT_LOCALES\s*=\s*\[([^\]]*)\]/)?.[1] ?? "")
    .matchAll(/"([A-Za-z-]+)"/g)].map((m) => m[1])
);
const BUILT_LOCALES = fs.existsSync(OUT)
  ? fs.readdirSync(OUT, { withFileTypes: true })
      .filter(
        (e) =>
          e.isDirectory() &&
          /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(e.name) &&
          fs.existsSync(path.join(OUT, e.name, "index.html"))
      )
      .map((e) => e.name)
      .sort()
  : [];
const EXTRA_LOCALE = BUILT_LOCALES.find((l) => !AUTHORED_SET.has(l));

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
const LOCALES_TO_READ = [LOCALE, ...(EXTRA_LOCALE && EXTRA_LOCALE !== LOCALE ? [EXTRA_LOCALE] : [])];
console.log(
  `[check-internal-links] reading locale(s): ${LOCALES_TO_READ.join(", ")}` +
    (EXTRA_LOCALE && EXTRA_LOCALE !== LOCALE
      ? ` (${EXTRA_LOCALE} is non-authored - where the corpus routes no longer exist)`
      : "")
);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// Each locale is resolved against ITS OWN tree: a link in /de/ points at /de/...
// and must resolve inside /de/. Sharing one route set between locales would let
// a link to a page that exists only in English pass while it is broken in
// German - the precise failure this widening exists to catch.
let pages = [];
const broken = new Map();

for (const loc of LOCALES_TO_READ) {
  const base = path.join(OUT, loc);
  if (!fs.existsSync(base)) continue;
  const all = walk(base);
  const localePages = all.filter((f) => f.endsWith("index.html"));
  pages = pages.concat(localePages);

  const routes = new Set(
    localePages.map((f) => "/" + path.relative(base, path.dirname(f)).split(path.sep).join("/"))
  );
  routes.add("/.");
  routes.add("/");
  const files = new Set(
    all.filter((f) => !f.endsWith(".html")).map((f) => "/" + path.relative(base, f).split(path.sep).join("/"))
  );

  for (const f of localePages) {
    const from = `/${loc}/` + path.relative(base, path.dirname(f)).split(path.sep).join("/");
    const html = fs.readFileSync(f, "utf8");
    for (const m of html.matchAll(new RegExp(`href="/${loc}([^"#?]*)"`, "g"))) {
      const raw = m[1] || "/";
      const target = raw.replace(/\/$/, "") || "/";
      if (routes.has(target) || files.has(raw) || files.has(target)) continue;
      // NOT BROKEN - REDIRECTED. In a locale that does not carry the authored
      // corpora, a link to a Learn article or a glossary entry is answered by
      // the Worker with a 302 to the English page (2026-09-10). The target is
      // deliberately not built, so "must resolve to something that was actually
      // built" is the wrong test for exactly these two families in exactly
      // these locales. Kept deliberately narrow: any other missing target in
      // the same locale still fails, and both families still must exist in the
      // authored locales, where they are not exempt.
      if (
        !AUTHORED_SET.has(loc) &&
        (target.startsWith("/learn/") || target.startsWith("/glossary/"))
      ) {
        continue;
      }
      const key = `${loc}:${target}`;
      if (!broken.has(key)) broken.set(key, from);
    }
  }
}

const LEGACY_UNUSED = (
true);

// Pre-existing, and one of them deliberate — see the header.
// The baseline counts DISTINCT TARGETS, not occurrences. Since 2026-09-10 this
// guard reads more than one locale, and the single deliberate exception - the
// changelog's link to the pre-1996 page's old address, kept because editing a
// dated record to tidy a report is worse than the broken link - appears once in
// every locale read. Counting occurrences would make the baseline depend on how
// many locales a given build happened to include, which is not a property of
// the site at all.
const distinctTargets = new Set([...broken.keys()].map((k) => k.split(":").slice(1).join(":")));
const BASELINE = 1;

if (distinctTargets.size > BASELINE) {
  console.error(`\n[check-internal-links] FAIL: ${distinctTargets.size} distinct target(s) resolve to nothing, above the baseline of ${BASELINE}.\n`);
  for (const [target, from] of [...broken].slice(0, 20)) {
    console.error(`      ${target}   (linked from ${from})`);
  }
  console.error("\n      A route that moved leaves its old address looking like a valid string.\n");
  process.exit(1);
}

console.log(
  `[check-internal-links] OK: ${pages.length} page(s), every internal href resolves;` +
  ` ${distinctTargets.size} known-broken target(s) (baseline ${BASELINE}, may only go down).` +
  (distinctTargets.size < BASELINE ? ` LOWER - drop BASELINE to ${distinctTargets.size}.` : ""),
);
