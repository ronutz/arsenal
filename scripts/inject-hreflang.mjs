#!/usr/bin/env node
// ============================================================================
// inject-hreflang  —  POST-BUILD. Adds language alternates to every page.
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
// x-default points at the English page, which is the authored spine.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const OUT = "out";
const SITE = "https://ronutz.com";
const XDEFAULT = "en";

if (!fs.existsSync(OUT)) {
  console.log("[inject-hreflang] SKIP: no build output.");
  process.exit(0);
}

// The locales that were actually built = top-level directories holding pages.
const locales = fs
  .readdirSync(OUT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(OUT, e.name, "index.html")))
  .map((e) => e.name)
  .filter((n) => /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(n));

if (locales.length < 2) {
  console.log(`[inject-hreflang] SKIP: ${locales.length} locale(s) built; alternates need at least two.`);
  process.exit(0);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === "index.html") out.push(full);
  }
  return out;
}

let touched = 0;
let tags = 0;

for (const locale of locales) {
  for (const file of walk(path.join(OUT, locale))) {
    // The route below the locale, e.g. "tools/cidr" or "" for the locale root.
    const rel = path.relative(path.join(OUT, locale), path.dirname(file)).split(path.sep).join("/");
    const html = fs.readFileSync(file, "utf8");
    if (html.includes('hreflang=')) continue;

    // Only the locales where THIS route was actually generated.
    const present = locales.filter((l) =>
      fs.existsSync(path.join(OUT, l, rel, "index.html")),
    );
    if (present.length < 2) continue;

    const href = (l) => `${SITE}/${l}${rel ? "/" + rel : ""}/`;
    const links = [
      ...present.map((l) => `<link rel="alternate" hrefLang="${l}" href="${href(l)}"/>`),
      present.includes(XDEFAULT)
        ? `<link rel="alternate" hrefLang="x-default" href="${href(XDEFAULT)}"/>`
        : "",
    ]
      .filter(Boolean)
      .join("")
      .replace(/hrefLang/g, "hreflang");

    const i = html.indexOf("</head>");
    if (i === -1) continue;
    fs.writeFileSync(file, html.slice(0, i) + links + html.slice(i));
    touched += 1;
    tags += present.length + (present.includes(XDEFAULT) ? 1 : 0);
  }
}

console.log(
  `[inject-hreflang] OK: ${touched} page(s) given language alternates across ${locales.length} built locale(s); ${tags} tag(s) written.`,
);
