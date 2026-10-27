// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-external-links-new-tab.mjs   (postbuild, reads out/)
// ----------------------------------------------------------------------------
// EVERY LINK TO ANOTHER SITE OPENS IN A NEW TAB (PRIME 2026-10-27 00:46: "Each
// and every link to external resources should open in a NEW BROWSER TAB, and
// not in the same tab!!!"; the example was a vendor citation in
// /learn/the-ethernet-frame-field-by-field/ that replaced the article).
//
// Reads every exported HTML page under out/<locale>/ and fails on any <a>
// whose href is an absolute http(s) or protocol-relative URL on a host other
// than this site's and that lacks target="_blank", or carries it without the
// rel token noopener (noreferrer is the site's rule for every host but the
// partner's, whose links keep the referrer: src/config/redEducation.ts). Authored Markdown/MDX gets the
// attributes from src/lib/rehypeExternalLinks.ts; components write them
// themselves (target="_blank" and externalRel, src/lib/links.ts). Links to this site's own hosts,
// root-relative links, fragments, mailto: and tel: are not checked.
//
// Usage: node scripts/check-external-links-new-tab.mjs [outDir]   (default out)
// Exit 0 when every external link opens a new tab, 1 otherwise, listing the first
// findings with their page.
// ============================================================================

import fs from "node:fs";                                    // reading the export
import path from "node:path";                               // joining paths

const OUT = process.argv[2] || "out";                        // the export to read
const SITE_HOSTS = new Set(["ronutz.com", "www.ronutz.com"]); // this site's hosts (as src/lib/links.ts)
const A_TAG = /<a\b[^>]*>/gi;                                // an opening <a> tag
const ATTR = (name) => new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");  // one attribute's value

/** The value of one attribute in a tag, or null. */
function attr(tag, name) {
  // The attribute, quoted either way or bare.
  const m = tag.match(ATTR(name));
  // Its value, entity-decoded for the one entity hrefs carry.
  return m ? (m[2] ?? m[3] ?? m[4] ?? "").replace(/&amp;/g, "&") : null;
}

/** Is this href on another site? */
function isExternal(href) {
  // Absolute http(s) or protocol-relative only.
  if (!/^(https?:)?\/\//i.test(href)) return false;
  // Parse with a base; an unparseable value is not counted.
  try {
    return !SITE_HOSTS.has(new URL(href, "https://ronutz.com").hostname);
  } catch {
    return false;
  }
}

/** Every .html file below a directory. */
function htmlFiles(dir) {
  // Collected paths.
  const out = [];
  // Walk the tree.
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);                        // the entry's path
    if (e.isDirectory()) out.push(...htmlFiles(p));          // descend
    else if (e.name.endsWith(".html")) out.push(p);          // a page
  }
  return out;                                                // all of them
}

// The locale folders actually exported (a partial build has one or two).
if (!fs.existsSync(OUT)) {
  console.log(`[check-external-links-new-tab] SKIP: no ${OUT}/ (run after a build)`);
  process.exit(0);
}
const pages = fs.readdirSync(OUT, { withFileTypes: true }).filter((e) => e.isDirectory() && /^[a-z]{2}(-[A-Z]{2})?$/.test(e.name)).flatMap((e) => htmlFiles(path.join(OUT, e.name)));

let links = 0;                                               // external links seen
const findings = [];                                         // the ones that fail
for (const file of pages) {                                  // each page
  const html = fs.readFileSync(file, "utf8");                // its HTML
  for (const tag of html.match(A_TAG) ?? []) {               // each <a> tag
    const href = attr(tag, "href");                          // its href
    if (!href || !isExternal(href)) continue;                // internal or none
    links++;                                                 // count it
    const target = attr(tag, "target");                      // its target
    const rel = (attr(tag, "rel") ?? "").toLowerCase().split(/\s+/);  // its rel tokens
    if (target !== "_blank" || !rel.includes("noopener")) {
      findings.push(`${path.relative(OUT, file)}: ${href.slice(0, 100)} (target=${target ?? "none"}, rel=${rel.join(" ") || "none"})`);  // record
    }
  }
}

if (findings.length) {                                       // failures
  console.log(`[check-external-links-new-tab] FAIL: ${findings.length} of ${links} external link(s) on ${pages.length} page(s) do not open a new tab with rel="noopener". First ones:`);
  for (const f of findings.slice(0, 40)) console.log(`  - ${f}`);  // the first forty
  process.exit(1);                                           // fail the build
}
console.log(`[check-external-links-new-tab] OK: ${links} external link(s) on ${pages.length} page(s), every one opens a new tab with rel="noopener".`);
