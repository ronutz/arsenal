// ============================================================================
// scripts/seo-locales.mjs
// ----------------------------------------------------------------------------
// WHICH BUILT LOCALES SPEAK FOR THEMSELVES TO A SEARCH ENGINE, AND WHICH DO NOT.
//
// Added 2026-11-02, after reading the site's Search Console (Page indexing,
// last updated 22 October 2026). Of 5.26K URLs not indexed, 1,849 were
// "Duplicate, Google chose different canonical than user", and every sampled
// one sat in the fourteen live locales that do not carry the authored content
// (fr, de, da, es, ms, it, ru, tr, nb, nl, pl, sv, zh-Hans, fil). Their message
// packs translate about 4% of the English keys (src/i18n/locale-coverage.ts),
// so a page such as /de/industry/rand/ is the English page under a German
// address. Each page declared itself canonical, and Google overruled it and
// chose the /en/ page every time (URL Inspection of /de/industry/rand/:
// "Google-selected canonical" /en/industry/rand/).
//
// The honest declaration is the one Google already reached: a page whose words
// are the English page's words names the English page as canonical, and is not
// advertised to search engines as a translation (no hreflang to or from it).
// The pages stay built, linked and usable; the language switcher still reaches
// them; only what the site CLAIMS about them changes.
//
// The line is AUTHORED_CONTENT_LOCALES in src/i18n/locales.ts, the existing
// promotion step for a locale: "author the content, add the code, and the pages
// generate". Promoting a locale there now also makes its pages self-canonical
// and puts them back into the hreflang sets and the sitemap, with no edit here.
//
// Shared by scripts/inject-hreflang.mjs (which writes the tags) and
// scripts/check-hreflang-integrity.mjs (which asserts them), so the two derive
// the same sets from the same registry and cannot drift apart.
// ============================================================================

// File reads (the registry and the build output).
import fs from "node:fs";
// Path joins for the build output.
import path from "node:path";

/** The locale registry, read as text: this module runs under plain node, which cannot import TypeScript. */
const REGISTRY = "src/i18n/locales.ts";

/** The registry's source, read once per process. */
const registrySource = fs.readFileSync(REGISTRY, "utf8");

/**
 * The live locales: every registry entry whose status is not "stub", in registry order.
 * Same rule as LIVE_LOCALES in the registry itself (status !== "stub").
 */
export const LIVE_CODES = [
  // Each entry is one object literal: { code: "...", ..., status: "..." }.
  ...registrySource.matchAll(/\{\s*code:\s*"([^"]+)"[^}]*?status:\s*"([^"]+)"/g),
]
  // Keep the entries that are built (anything above stub).
  .filter((m) => m[2] !== "stub")
  // The code alone.
  .map((m) => m[1]);

/** The locales that carry the authored content (en and pt-BR at the time of writing). */
export const AUTHORED_CODES = [
  // The array literal's body, e.g. `"en", "pt-BR"`.
  ...(registrySource.match(/AUTHORED_CONTENT_LOCALES\s*=\s*\[([^\]]*)\]/)?.[1] ?? "")
    // Every quoted code inside it.
    .matchAll(/"([A-Za-z-]+)"/g),
].map((m) => m[1]);

// A registry this module can no longer read must stop the build, not pass it:
// an empty list here would silently strip every hreflang tag from the site.
if (!LIVE_CODES.includes("en") || !AUTHORED_CODES.includes("en")) {
  // Say exactly what was not found and where.
  console.error(
    `[seo-locales] FAIL: could not read the live or authored locales from ${REGISTRY} ` +
      `(live: ${LIVE_CODES.join(",") || "none"}; authored: ${AUTHORED_CODES.join(",") || "none"}).`,
  );
  // Hard stop.
  process.exit(1);
}

/** The set form of AUTHORED_CODES, for membership tests. */
const AUTHORED_SET = new Set(AUTHORED_CODES);
/**
 * The locales whose interface is written natively (INTERFACE_LOCALES in the registry, 09/11/2026): their pages speak
 * for themselves outside the corpus route families. The authored-content locales are always among them.
 */
export const INTERFACE_CODES = [
  // The array literal's body.
  ...(registrySource.match(/INTERFACE_LOCALES\s*=\s*\[([^\]]*)\]/)?.[1] ?? "")
    // Every quoted code inside it.
    .matchAll(/"([A-Za-z-]+)"/g),
].map((m) => m[1]);
/** The first route segments whose content is a corpus (CORPUS_ROUTE_FAMILIES in the registry). */
export const CORPUS_FAMILIES = [
  // The array literal's body.
  ...(registrySource.match(/CORPUS_ROUTE_FAMILIES\s*=\s*\[([^\]]*)\]/)?.[1] ?? "")
    // Every quoted segment inside it.
    .matchAll(/"([a-z-]+)"/g),
].map((m) => m[1]);
// Both lists must read back: an empty interface list would drop pt-BR from hreflang; an empty corpus list would offer
// English pages under another language's address to search engines.
if (!INTERFACE_CODES.includes("en") || !CORPUS_FAMILIES.includes("learn")) {
  // Say what was not found.
  console.error(`[seo-locales] FAIL: could not read INTERFACE_LOCALES or CORPUS_ROUTE_FAMILIES from ${REGISTRY}.`);
  // Hard stop.
  process.exit(1);
}
/** The set forms, for membership tests. */
const INTERFACE_SET = new Set([...INTERFACE_CODES, ...AUTHORED_CODES]);
const CORPUS_SET = new Set(CORPUS_FAMILIES);

/**
 * The live locales that were actually built into an output folder: those with a
 * top-level <out>/<code>/index.html. Registry order.
 *
 * @param {string} out the export folder, normally "out"
 * @returns {string[]}
 */
export function builtLocales(out) {
  // A locale counts as built when its home page exists.
  return LIVE_CODES.filter((code) => fs.existsSync(path.join(out, code, "index.html")));
}

/**
 * True when a page of this locale on this route is self-canonical and takes part in hreflang: every route of an
 * authored-content locale; every route outside the corpus families of an interface-native locale (09/11/2026); no
 * route of any other locale.
 *
 * @param {string} code a locale code
 * @param {string} [rel] the route below the locale, e.g. "tools/cidr" ("" for the locale's home page)
 * @returns {boolean}
 */
export function speaksForItself(code, rel = "") {
  // An authored-content locale speaks for every route it builds.
  if (AUTHORED_SET.has(code)) return true;
  // A locale that is neither authored nor interface-native borrows the English canonical everywhere.
  if (!INTERFACE_SET.has(code)) return false;
  // An interface-native locale speaks for itself except on a corpus route, whose words are still English there.
  return !CORPUS_SET.has(rel.split("/")[0]);
}

/**
 * True when a locale speaks for itself on at least one route (its home page): the locales whose pages are walked
 * for hreflang at all.
 *
 * @param {string} code a locale code
 * @returns {boolean}
 */
export function speaksAnywhere(code) {
  // The home page is never a corpus route.
  return speaksForItself(code, "");
}
