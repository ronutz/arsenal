// check-hreflang-integrity.mjs — P-5, ratified by PRIME 2026-08-19 ("Aceito todas").
//
// ORIGIN. DISPATCH's S3: "equality against the expected, not just counting —
// excess and duplicates are bugs." Their real incident: link annotations that
// were correct but DUPLICATED, invisible to the eye, and a ">= expected" count
// would have passed. Recon here found the gap real: inject-hreflang (94 lines)
// validated nothing about its own output, and duplicated hreflang / JSON-LD is
// the silent, SEO-penalised class of that same bug.
//
// WHAT IT ENFORCES, per HTML page in the build:
//   1. NO duplicate hreflang values (each language advertised at most once).
//   2. A page in a self-canonical locale (en, pt-BR: scripts/seo-locales.mjs)
//      carries EXACTLY the hreflang set the injector is meant to write: the
//      self-canonical locales in which THIS route was built, plus x-default,
//      when there are two or more of them; and none when there are fewer.
//      Equality, not counting: an extra alternate is as much a bug as a
//      missing one.
//   3. At most ONE canonical link (two canonicals is the duplicate bug again).
//   4. NO two byte-identical JSON-LD blocks on one page.
//   5. (2026-11-02) A page in a fallback locale (one that borrows the English
//      text) carries NO hreflang, and when its English counterpart was built,
//      its canonical is that English page: in <head>, in the inline payload,
//      and in the route's index.txt. Its own address must not survive as a
//      canonical anywhere. A self-canonical page's canonical, when present, is
//      its own address.
//
// PARTIAL-BUILD HONESTY. A build with fewer than two self-canonical locales
// gets no hreflang at all (the injector skips), so rule 2 is N/A there and says
// so; a build with no fallback locale makes rule 5's borrowing half N/A and says
// so. Rules 1, 3 and 4 always run: a duplicate is a bug in any build. Baselines
// here are permanently zero; there is no legitimate duplicate. CI's full
// 16-locale build exercises every rule for real.
//
// Expected locales are DERIVED the same way the injector derives them, from the
// shared scripts/seo-locales.mjs - one source of truth, no hardcoded 16.

// File reads over the export.
import fs from "node:fs";
// Path joins and relative paths.
import path from "node:path";
// The same locale sets the injector uses.
import { builtLocales, speaksForItself } from "./seo-locales.mjs";

/** The export folder. */
const OUT = "out";
/** The production origin. */
const SITE = "https://ronutz.com";

// This guard reads a build; without one it cannot pass.
if (!fs.existsSync(OUT)) {
  // Say why.
  console.error("[check-hreflang-integrity] FAIL: no out/ directory — run after a build.");
  // Hard stop.
  process.exit(1);
}

/** The built live locales. */
const locales = builtLocales(OUT);
/** The self-canonical ones among them. */
const speaking = locales.filter(speaksForItself);
/** The fallback ones among them. */
const borrowing = locales.filter((l) => !speaksForItself(l));
/** Rule 2 runs when the injector's own run condition holds. */
const alternatesActive = speaking.length >= 2;

/**
 * The absolute URL of a route in a locale.
 *
 * @param {string} l locale
 * @param {string} rel route below the locale
 * @returns {string}
 */
const href = (l, rel) => `${SITE}/${l}${rel ? "/" + rel : ""}/`;

/**
 * Does this locale have a built page for this route?
 *
 * @param {string} l locale
 * @param {string} rel route below the locale
 * @returns {boolean}
 */
const built = (l, rel) => fs.existsSync(path.join(OUT, l, rel, "index.html"));

// PER-ROUTE, NOT GLOBAL (2026-09-10). This used to compare every page's
// hreflang set against ALL built locales, which was right while every route
// existed in every locale. It stopped being right when the Learn and glossary
// DETAIL pages became authored-locales-only. The correct expectation is the one
// inject-hreflang.mjs applies when it WRITES the tags: the self-canonical
// locales in which THIS route was actually built.
const expectedFor = (rel) => {
  // The speaking locales holding this route.
  const present = speaking.filter((l) => built(l, rel));
  // The injector writes nothing below two.
  if (present.length < 2) return "";
  // The sorted set, x-default included.
  return [...present, "x-default"].sort().join(",");
};

// Every problem found, one line each.
const problems = [];
// Pages read, and pages in each rule-5 class.
let pages = 0;
let borrowedChecked = 0;
let selfChecked = 0;

/**
 * Check every HTML file below a locale folder.
 *
 * @param {string} dir the folder to walk
 * @param {string} locale the locale the folder belongs to
 */
const walk = (dir, locale) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // The entry's path.
    const p = path.join(dir, entry.name);
    // Descend into folders.
    if (entry.isDirectory()) walk(p, locale);
    // Only HTML files are pages.
    else if (entry.name.endsWith(".html")) {
      pages += 1;
      // The page's source.
      const body = fs.readFileSync(p, "utf-8");
      // Only a route's index.html maps to a route; other HTML files (a 404 page) take rules 1, 3 and 4.
      const isRoute = entry.name === "index.html";
      // The route below the locale, for index.html files.
      const rel = path.relative(path.join(OUT, locale), path.dirname(p)).split(path.sep).join("/");

      // Rule 1: every hreflang value on the page, then the repeated ones.
      const alts = [...body.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"/g)].map((m) => m[1]);
      const dupAlts = alts.filter((v, i) => alts.indexOf(v) !== i);
      if (dupAlts.length > 0)
        problems.push(`${p} -> duplicate hreflang: ${[...new Set(dupAlts)].join(", ")}`);

      // Rule 2: the exact set on a self-canonical locale's route page.
      if (isRoute && speaksForItself(locale) && alternatesActive) {
        // What the injector should have written, and what is there.
        const expected = expectedFor(rel);
        const got = [...new Set(alts)].sort().join(",");
        if (got !== expected)
          problems.push(`${p} -> hreflang set differs from the self-canonical locales built for this route (expected ${expected || "none"}, got ${got || "none"})`);
      }

      // Rule 3: the canonical links on the page.
      const canonicalTags = [...body.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
      const canonicals = (body.match(/<link[^>]*rel="canonical"/g) || []).length;
      if (canonicals > 1) problems.push(`${p} -> ${canonicals} canonical links (max 1)`);

      // Rule 4: byte-identical JSON-LD blocks.
      const ld = [...body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      if (ld.length !== new Set(ld).size) problems.push(`${p} -> byte-identical JSON-LD blocks duplicated`);

      // Rule 5, on route pages only.
      if (!isRoute) continue;
      if (speaksForItself(locale)) {
        // A self-canonical page names itself, when it names anything.
        if (canonicalTags.length === 1) {
          selfChecked += 1;
          if (canonicalTags[0] !== href(locale, rel))
            problems.push(`${p} -> canonical ${canonicalTags[0]} is not the page's own address`);
        }
      } else {
        // A fallback page is never advertised as a translation.
        if (alts.length > 0) problems.push(`${p} -> a fallback-locale page carries hreflang (${alts.join(", ")})`);
        // Its canonical is the English page when one was built.
        if (built("en", rel)) {
          borrowedChecked += 1;
          // The address it must not claim any longer, and the one it must name.
          const self = href(locale, rel);
          const target = href("en", rel);
          if (canonicalTags.length !== 1 || canonicalTags[0] !== target)
            problems.push(`${p} -> canonical should be ${target} (got ${canonicalTags.join(", ") || "none"})`);
          // The inline payload must not still carry the self canonical.
          if (body.includes(`\\"rel\\":\\"canonical\\",\\"href\\":\\"${self}\\"`))
            problems.push(`${p} -> the inline payload still names the page itself as canonical`);
          // Nor the route's index.txt.
          const txt = path.join(path.dirname(p), "index.txt");
          if (fs.existsSync(txt) && fs.readFileSync(txt, "utf8").includes(`"rel":"canonical","href":"${self}"`))
            problems.push(`${txt} -> the payload still names the page itself as canonical`);
        }
      }
    }
  }
};
// Every built locale's tree.
for (const loc of locales) walk(path.join(OUT, loc), loc);

// Any problem fails the build.
if (problems.length > 0) {
  console.error(`[check-hreflang-integrity] FAIL: ${problems.length} structural duplicate/inequality problem(s).`);
  for (const line of problems.slice(0, 20)) console.error(`  ${line}`);
  console.error(
    "  Fix: these are injector/layout output bugs — correct inject-hreflang.mjs or the layout metadata, never the built file. Baseline is permanently 0.",
  );
  process.exit(1);
}

// The pass line, saying which rules were exercised by this build.
console.log(
  `[check-hreflang-integrity] OK: ${pages} page(s); 0 duplicate hreflang, 0 duplicate canonical, 0 duplicate JSON-LD` +
    (alternatesActive
      ? `; alternate sets equal the self-canonical locales built per route (${speaking.join(", ")} + x-default)`
      : "; alternate-set equality N/A (fewer than two self-canonical locales built; injector skipped, matching its own rule)") +
    `; ${selfChecked} self-canonical page(s) name themselves` +
    (borrowing.length > 0
      ? `; ${borrowedChecked} fallback-locale page(s) name their English page and carry no hreflang.`
      : "; canonical borrowing N/A (no fallback locale in this build)."),
);
