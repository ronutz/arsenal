// ============================================================================
// scripts/check-sitemap.mjs   (POSTBUILD - reads out/)
// ----------------------------------------------------------------------------
// /sitemap.xml became an INDEX on 2026-09-15, pointing at per-section children.
// That shape has failure modes a single flat file did not have, and every one
// of them is silent - a broken sitemap does not break a page, it just quietly
// stops a crawler finding things. Search Console had discovered 19 pages of
// 3,404 when this was written; the sitemap is the main lever on that number,
// so it is worth checking properly.
//
// WHAT IT ENFORCES
//   1. /sitemap.xml is a <sitemapindex>, not a <urlset>. If the generator ever
//      regresses to a flat file, the children are orphaned and half the site
//      leaves the index.
//   2. Every child it lists EXISTS on disk. A listed-but-absent child is a 404
//      served to a crawler that trusted the index.
//   3. Every child file EXISTS in the index. An unlisted child is a section of
//      the site that has silently stopped being advertised - the failure that
//      loses pages rather than merely erroring.
//   4. No URL appears in two sections. Section assignment is first-match, so a
//      duplicate means the matcher is wrong, and duplicates dilute a crawler's
//      view of what is canonical.
//   5. Every <loc> resolves to a page that was actually built. Advertising a
//      URL that 404s wastes the crawl budget of a site that has very little.
//   6. No child exceeds the sitemaps.org limits (50,000 URLs / 50 MB).
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "out");
if (!fs.existsSync(out)) {
  console.log("[check-sitemap] SKIP: no out/ directory");
  process.exit(0);
}

const errors = [];
const indexPath = path.join(out, "sitemap.xml");

if (!fs.existsSync(indexPath)) {
  console.error("[check-sitemap] FAIL: out/sitemap.xml does not exist");
  process.exit(1);
}

const indexXml = fs.readFileSync(indexPath, "utf8");
if (!indexXml.includes("<sitemapindex")) {
  errors.push(
    "sitemap.xml is not a <sitemapindex> - it has regressed to a flat file and " +
      "the section sitemaps are now orphaned"
  );
}

const listed = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace(/^https?:\/\/[^/]+\//, "")
);
const onDisk = fs
  .readdirSync(out)
  .filter((f) => /^sitemap-.+\.xml$/.test(f))
  .sort();

for (const rel of listed) {
  if (!fs.existsSync(path.join(out, rel))) {
    errors.push(`index lists "${rel}" but the file does not exist`);
  }
}
for (const f of onDisk) {
  if (!listed.includes(f)) {
    errors.push(
      `"${f}" exists but is NOT listed in the index - that section is no longer advertised`
    );
  }
}

// ---- the children ----------------------------------------------------------
const seen = new Map(); // url -> section
let totalUrls = 0;

for (const f of onDisk) {
  const p = path.join(out, f);
  const xml = fs.readFileSync(p, "utf8");
  const bytes = fs.statSync(p).size;

  if (!xml.includes("<urlset")) {
    errors.push(`${f} is not a <urlset>`);
    continue;
  }
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) errors.push(`${f} contains no <loc> entries`);
  if (locs.length > 50000) errors.push(`${f} has ${locs.length} URLs, above the 50,000 limit`);
  if (bytes > 50 * 1024 * 1024) errors.push(`${f} is ${bytes} bytes, above the 50 MB limit`);
  totalUrls += locs.length;

  for (const loc of locs) {
    const prior = seen.get(loc);
    if (prior) {
      errors.push(`${loc} appears in BOTH ${prior} and ${f}`);
    } else {
      seen.set(loc, f);
    }
    const rel = loc.replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "");
    const candidate = rel
      ? path.join(out, rel, "index.html")
      : path.join(out, "index.html");
    if (!fs.existsSync(candidate)) {
      errors.push(`${f}: <loc> ${loc} does not resolve to a built page`);
    }
  }
}

// ---- legacy redirect destinations -----------------------------------------
// The worker permanently redirects URLs from the previous Wix-era site. A
// redirect that lands on a 404 is WORSE than the original 404: it costs the
// crawler an extra request and still ends nowhere, and it looks deliberate.
// Parse the table out of the worker and check every destination was built.
const skippedLegacy = [];
{
  const workerSrc = fs.readFileSync(path.join(root, "worker/index.ts"), "utf8");
  const block = /const LEGACY_SITE_PATHS = new Map<string, string>\(\[([\s\S]*?)\]\)/.exec(
    workerSrc
  );
  if (!block) {
    errors.push(
      "LEGACY_SITE_PATHS was not found in worker/index.ts - either it was removed " +
        "or renamed, and this check is now silently verifying nothing"
    );
  } else {
    const pairs = [...block[1].matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)];
    if (pairs.length === 0) errors.push("LEGACY_SITE_PATHS is empty");
    for (const [, from, to] of pairs) {
      const rel = to.replace(/^\//, "").replace(/\/$/, "");
      // A LOCALE-LIMITED verification build sets VERIFY_LOCALES, and then most
      // routes exist only for those locales - so a /pt-BR/ destination is
      // legitimately absent even though out/pt-BR exists, because the authored
      // routes (glossary, learn) ignore the variable while the rest honour it.
      // Keying on the VARIABLE rather than on directory presence is the only
      // reading that is right in both builds. CI sets nothing, so CI checks
      // everything.
      //
      // Distinguishing "this locale was not built" from "this page is missing"
      // is the difference between a guard that is trusted and one that is
      // routinely ignored.
      const verifyLocales = (process.env.VERIFY_LOCALES ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const localeSeg = rel.split("/")[0];
      if (verifyLocales.length > 0 && localeSeg && !verifyLocales.includes(localeSeg)) {
        skippedLegacy.push(`${from} -> ${to} (locale "${localeSeg}" not in this build)`);
        continue;
      }
      const candidate = rel ? path.join(out, rel, "index.html") : path.join(out, "index.html");
      if (!fs.existsSync(candidate)) {
        errors.push(
          `legacy redirect ${from} -> ${to} lands on a page that was not built`
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("[check-sitemap] FAIL:\n");
  for (const e of errors.slice(0, 12)) console.error(`  - ${e}`);
  if (errors.length > 12) console.error(`  ... and ${errors.length - 12} more`);
  console.error("\n  See the header of this script for why each rule exists.\n");
  process.exit(1);
}

console.log(
  `[check-sitemap] OK: index lists ${listed.length} section sitemap(s) covering ` +
    `${totalUrls} URL(s); all children present and listed, no duplicates across ` +
    `sections, every <loc> resolves to a built page; legacy redirect ` +
    `destinations all exist.` +
    (skippedLegacy.length
      ? `\n  NOTE: ${skippedLegacy.length} legacy destination(s) unchecked in this ` +
        `locale-limited build: ${skippedLegacy.join("; ")}`
      : "")
);
