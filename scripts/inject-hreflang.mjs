#!/usr/bin/env node
// ============================================================================
// inject-hreflang  -  POST-BUILD. Language alternates and canonical targets.
// ----------------------------------------------------------------------------
// WHY. SCOUT's audit (2026-08-16) found no hreflang anywhere on the site, and
// the check confirmed it: zero tags on a sixteen-locale build. Google asks for
// explicit language relationships when the same content lives at separate URLs
// per language, and this site is exactly that case.
//
// WHY POST-BUILD RATHER THAN IN generateMetadata. The alternates for a page are
// its own path with the locale segment swapped. The root layout's metadata
// function knows the LOCALE but not the PATH - which is why the canonical there
// is the relative "./" trick. Rather than push a path down into 2,700 routes,
// this derives the mapping from what was actually generated.
//
// *** THE RULE THAT MAKES IT HONEST: A PAGE ADVERTISES ONLY THE ALTERNATES THAT
// EXIST ON DISK. *** An hreflang pointing at a page that was never built is a
// promise to a search engine that the site cannot keep, and this site has spent
// a week removing exactly that class of claim.
//
// *** AND ONLY THE ALTERNATES THAT ARE TRANSLATIONS (2026-11-02). *** Search
// Console showed Google overruling the self-canonical of 1,849 pages in the
// fourteen live locales that fall back to English, and choosing the /en/ page
// each time: their words are the English page's words. So, per
// scripts/seo-locales.mjs:
//   - en and pt-BR (the authored-content locales) keep a self-canonical and
//     carry hreflang for each other plus x-default;
//   - a page in any other built locale names its English counterpart as its
//     canonical, when that counterpart was built, and carries no hreflang.
// The canonical is rewritten in the three places the export writes it: the
// <link> in <head>, the same link inside the page's inline React Server
// Components payload (self.__next_f), and the route's index.txt payload, so a
// hydrating page and a client navigation see the same canonical as a crawler.
//
// x-default points at the English page, which is the authored spine.
// ============================================================================

// File reads and writes over the export.
import fs from "node:fs";
// Path joins and relative paths.
import path from "node:path";
// Which locales are built, and which of them speak for themselves.
import { builtLocales, speaksForItself } from "./seo-locales.mjs";

/** The export folder. */
const OUT = "out";
/** The production origin, as the layout's metadataBase renders it. */
const SITE = "https://ronutz.com";
/** The locale x-default and every borrowed canonical point at. */
const XDEFAULT = "en";

// No export, nothing to do (a guard run outside a build).
if (!fs.existsSync(OUT)) {
  // Say so and stop cleanly.
  console.log("[inject-hreflang] SKIP: no build output.");
  // Not an error.
  process.exit(0);
}

/** The live locales that were built into this export, registry order. */
const locales = builtLocales(OUT);
/** The built locales that are self-canonical and take part in hreflang. */
const speaking = locales.filter(speaksForItself);
/** The built locales whose pages borrow the English page's canonical. */
const borrowing = locales.filter((l) => !speaksForItself(l));

/**
 * Every index.html below a folder, depth first.
 *
 * @param {string} dir the folder to walk
 * @param {string[]} [out] the accumulator
 * @returns {string[]}
 */
function walk(dir, out = []) {
  // Each entry of this folder.
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    // Its full path.
    const full = path.join(dir, e.name);
    // Descend into folders.
    if (e.isDirectory()) walk(full, out);
    // Collect page files.
    else if (e.name === "index.html") out.push(full);
  }
  // The pages found.
  return out;
}

/**
 * The absolute URL of a route in a locale, with the trailing slash the export uses.
 *
 * @param {string} locale the locale segment
 * @param {string} rel the route below the locale ("" for the locale root)
 * @returns {string}
 */
const href = (locale, rel) => `${SITE}/${locale}${rel ? "/" + rel : ""}/`;

/**
 * Does this locale have a built page for this route?
 *
 * @param {string} locale the locale segment
 * @param {string} rel the route below the locale
 * @returns {boolean}
 */
const built = (locale, rel) => fs.existsSync(path.join(OUT, locale, rel, "index.html"));

/**
 * Replace every occurrence of one string with another; returns the new text and the count.
 *
 * @param {string} text the haystack
 * @param {string} from the exact string to replace
 * @param {string} to its replacement
 * @returns {[string, number]}
 */
function replaceAll(text, from, to) {
  // Split on the exact needle (no regex, so URL characters need no escaping).
  const parts = text.split(from);
  // Rejoin with the replacement; the count is the number of seams.
  return [parts.join(to), parts.length - 1];
}

// Counters for the build log.
let touched = 0;
let tags = 0;
let borrowed = 0;
let alreadyBorrowed = 0;
let noEnglish = 0;
let payloadFiles = 0;
// Pages in a borrowing locale whose own canonical link could not be found.
const missingCanonical = [];

// ---- 1. hreflang among the locales that speak for themselves ----------------
// Alternates need at least two such locales in this build.
if (speaking.length >= 2) {
  // Every page of every speaking locale.
  for (const locale of speaking) {
    for (const file of walk(path.join(OUT, locale))) {
      // The route below the locale, e.g. "tools/cidr" or "" for the locale root.
      const rel = path.relative(path.join(OUT, locale), path.dirname(file)).split(path.sep).join("/");
      // The page's HTML.
      const html = fs.readFileSync(file, "utf8");
      // Where the head ends; the alternates go just before it.
      const headEnd = html.indexOf("</head>");
      // Already injected (a re-run): an alternate link with an hreflang IN THE HEAD. Only the head counts: a page's own
      // text can mention hreflang (the meta, Open Graph and JSON-LD inspector's links table renders hreflang="pt-BR"
      // as content), and the old whole-page test took those pages for done and skipped them (GitHub Actions deploy,
      // 2026-11-02 18:42 UTC: check-hreflang-integrity failed on that tool's en and pt-BR pages).
      if (headEnd !== -1 && /<link[^>]*rel="alternate"[^>]*hreflang=/.test(html.slice(0, headEnd))) continue;

      // Only the speaking locales where THIS route was actually generated.
      const present = speaking.filter((l) => built(l, rel));
      // One language alone has no alternates.
      if (present.length < 2) continue;

      // One link per present locale, then x-default when English is among them.
      const links = [
        ...present.map((l) => `<link rel="alternate" hreflang="${l}" href="${href(l, rel)}"/>`),
        present.includes(XDEFAULT)
          ? `<link rel="alternate" hreflang="x-default" href="${href(XDEFAULT, rel)}"/>`
          : "",
      ]
        // Drop the empty x-default slot when English is absent.
        .filter(Boolean)
        // One run of tags.
        .join("");

      // Insert just before </head>; a page without one is left alone.
      if (headEnd === -1) continue;
      // Write the page back with the tags.
      fs.writeFileSync(file, html.slice(0, headEnd) + links + html.slice(headEnd));
      // Count the page and its tags.
      touched += 1;
      tags += present.length + (present.includes(XDEFAULT) ? 1 : 0);
    }
  }
}

// ---- 2. the English canonical for the locales that borrow English text ------
for (const locale of borrowing) {
  for (const file of walk(path.join(OUT, locale))) {
    // The route below the locale.
    const rel = path.relative(path.join(OUT, locale), path.dirname(file)).split(path.sep).join("/");
    // No English counterpart: the page is its own best address and keeps its self-canonical.
    if (!built(XDEFAULT, rel)) {
      // Count it for the log.
      noEnglish += 1;
      continue;
    }
    // The address the page declares today, and the one it should declare.
    const self = href(locale, rel);
    const target = href(XDEFAULT, rel);

    // The page's HTML.
    let html = fs.readFileSync(file, "utf8");
    // The <head> link as the export renders it.
    const [withHead, headCount] = replaceAll(
      html,
      `<link rel="canonical" href="${self}"/>`,
      `<link rel="canonical" href="${target}"/>`,
    );
    // The same link inside the inline payload, where quotes are JSON-escaped within a JS string.
    const [withPayload] = replaceAll(
      withHead,
      `\\"rel\\":\\"canonical\\",\\"href\\":\\"${self}\\"`,
      `\\"rel\\":\\"canonical\\",\\"href\\":\\"${target}\\"`,
    );
    // Nothing found in <head>.
    if (headCount === 0) {
      // A re-run finds the English canonical already in place.
      if (html.includes(`<link rel="canonical" href="${target}"/>`)) alreadyBorrowed += 1;
      // Otherwise the page has no canonical of the expected shape: report it.
      else missingCanonical.push(file);
      continue;
    }
    // Write the page back.
    html = withPayload;
    fs.writeFileSync(file, html);
    borrowed += 1;

    // The route's RSC payload for client navigation, when the export wrote one.
    const txt = path.join(path.dirname(file), "index.txt");
    if (fs.existsSync(txt)) {
      // Unescaped JSON here.
      const [next, n] = replaceAll(
        fs.readFileSync(txt, "utf8"),
        `"rel":"canonical","href":"${self}"`,
        `"rel":"canonical","href":"${target}"`,
      );
      // Write only when something changed.
      if (n > 0) {
        fs.writeFileSync(txt, next);
        payloadFiles += 1;
      }
    }
  }
}

// A borrowing-locale page with no recognisable canonical means the layout's
// output changed shape; stop rather than ship pages that still claim themselves.
if (missingCanonical.length > 0) {
  // Name the first few.
  console.error(
    `[inject-hreflang] FAIL: ${missingCanonical.length} page(s) in a fallback locale carry no canonical link of the expected shape:`,
  );
  for (const f of missingCanonical.slice(0, 10)) console.error(`  ${f}`);
  // Hard stop.
  process.exit(1);
}

// The build log line.
console.log(
  `[inject-hreflang] OK: ${touched} page(s) given language alternates across ${speaking.length} self-canonical locale(s) (${speaking.join(", ") || "none"}); ${tags} tag(s) written.` +
    (borrowing.length > 0
      ? ` ${borrowed} page(s) in ${borrowing.length} fallback locale(s) now name their English page as canonical (${payloadFiles} index.txt payload(s) matched); ${alreadyBorrowed} already did; ${noEnglish} have no English counterpart and keep their own.`
      : " No fallback locale in this build; canonical borrowing N/A."),
);
