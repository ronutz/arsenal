#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-og-references.mjs - EVERY SHARED LINK HAS A PICTURE
// ----------------------------------------------------------------------------
// POST-BUILD GUARD (05/11/2026). Reads every page the build wrote and fails the
// build when a page's social card is missing or wrong:
//   1. the page has no og:image (outside the declared exceptions below);
//   2. og:image names a file the export does not contain;
//   3. twitter:image names a different file from og:image;
//   4. the file is not a PNG or JPEG, or its pixel size differs from the
//      og:image:width and og:image:height the page declares.
//
// WHY THIS EXISTS. scripts/check-og.mjs checks the cards a hand-kept list of
// routes names, before the build. On 05/11/2026 a check of the built pages
// themselves found 659 pages pointing at cards that did not exist, while
// check-og passed: every page in a language without cards of its own (da, and
// the other thirteen) asked for /og/<kind>/<locale>/..., which is never drawn;
// four vendor hubs, three static pages and two tools were missing from the
// generator's lists; and one article is published under a slug that is not its
// file name. A shared link to any of them showed no image. The lists were
// fixed, and this guard reads the pages, so the next gap fails here instead of
// in somebody's feed.
//
// Runs after the build (it needs out/); prints the counts.
// ============================================================================

// File access for the export.
import fs from "node:fs";
// Path joining and relative paths.
import path from "node:path";
// The script's own location, to find the repository root from it.
import { fileURLToPath } from "node:url";

// The repository root, one folder above this script.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The static export the build wrote.
const OUT = path.join(ROOT, "out");

// Pages that may have no card at all, keyed by path, each with its reason. MAY ONLY SHRINK; one that stops
// matching is reported as stale.
const NO_CARD = new Map([
  ["/404/", "The not-found page is never shared as a link; it carries no page-specific metadata by design."],
]);

// Every finding, for the failure report.
const errors = [];
// Pages read, for the summary.
let pages = 0;
// Each card file's pixel size, read once (null when the file is not a PNG or JPEG).
const sizes = new Map();
// Pages per top-level folder of out/.
const perFolder = new Map();
// Exceptions that matched, for the stale check.
const exemptSeen = new Set();

/** A PNG's or a JPEG's pixel size as [width, height], from its header; null for anything else. */
function imageSize(file) {
  // The first 64 KiB hold the PNG header or the JPEG frame marker.
  const fd = fs.openSync(file, "r");
  // A buffer for the head of the file.
  const b = Buffer.alloc(64 * 1024);
  // How many bytes were actually read.
  const n = fs.readSync(fd, b, 0, b.length, 0);
  // Done with the file.
  fs.closeSync(fd);
  // PNG: the signature, then width and height in the IHDR chunk at bytes 16 to 24.
  if (n >= 24 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  // JPEG: start of image, then walk the markers to a start-of-frame.
  if (n >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    // The first marker after the start of image.
    let i = 2;
    // Walk while a whole frame header still fits in what was read.
    while (i + 9 < n) {
      // Skip fill bytes until a marker.
      if (b[i] !== 0xff) { i += 1; continue; }
      // The marker's type.
      const m = b[i + 1];
      // Baseline, extended or progressive frame: height then width.
      if (m === 0xc0 || m === 0xc1 || m === 0xc2) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      // Any other segment: jump over it by its length.
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  // Not an image this guard recognises.
  return null;
}

/** The content of the first <meta> with this attribute and value, or null. */
function meta(html, attr, value) {
  // Next writes `<meta property="og:image" content="..."/>` and `<meta name="twitter:image" content="..."/>`.
  const m = html.match(new RegExp(`<meta ${attr}="${value.replace(/[.:]/g, "\\$&")}" content="([^"]*)"`));
  // The value, or null when the tag is absent.
  return m ? m[1] : null;
}

/** Check one built page, given its file and its path as the site serves it. */
function checkPage(file, rel) {
  // The page's markup.
  const html = fs.readFileSync(file, "utf8");
  // Counted whatever it holds.
  pages += 1;
  // The card the page offers to Open Graph readers.
  const og = meta(html, "property", "og:image");
  // No card: allowed only for a declared exception.
  if (!og) {
    // A declared page passes and is remembered for the stale check.
    if (NO_CARD.has(rel)) { exemptSeen.add(rel); return; }
    // Anything else is a page that unfurls with no image.
    errors.push(`${rel} has no og:image`);
    return;
  }
  // The card the page offers to X.
  const tw = meta(html, "name", "twitter:image");
  // The two must name the same file, or a link unfurls differently by where it is shared.
  if (tw !== og) errors.push(`${rel} twitter:image (${tw}) differs from og:image (${og})`);
  // The card's path on the site; the origin is the site's own, written by metadataBase.
  let pathname;
  // An absolute URL is parsed; a relative one is taken as a path.
  try { pathname = new URL(og, "https://invalid.invalid").pathname; } catch { errors.push(`${rel} og:image is not a URL: ${og}`); return; }
  // The file that path names in the export.
  const card = path.join(OUT, decodeURIComponent(pathname));
  // The file must exist, or the link unfurls blank.
  if (!fs.existsSync(card) || !fs.statSync(card).isFile()) { errors.push(`${rel} og:image names a missing file: ${pathname}`); return; }
  // Its pixel size, read once per file.
  if (!sizes.has(card)) sizes.set(card, imageSize(card));
  // The size, or null when it is not an image.
  const dim = sizes.get(card);
  // A file that is not a PNG or JPEG is not a card.
  if (!dim) { errors.push(`${rel} og:image is not a PNG or JPEG: ${pathname}`); return; }
  // The size the page declares, when it declares one.
  const w = meta(html, "property", "og:image:width");
  // Its declared height.
  const h = meta(html, "property", "og:image:height");
  // Declared and actual sizes must agree, or readers crop or reject the card.
  if (w && h && (Number(w) !== dim[0] || Number(h) !== dim[1])) errors.push(`${rel} declares ${w}x${h} but ${pathname} is ${dim[0]}x${dim[1]}`);
}

// The export must exist: this guard runs after the build.
if (!fs.existsSync(OUT)) {
  // Say why and stop.
  console.error("[check-og-references] FAIL: out/ is missing (this guard runs after the build)");
  process.exit(1);
}

// The page folders: each top-level folder of out/ with an index.html at its root (the languages, and /404/).
const folders = fs.readdirSync(OUT).filter((d) => fs.statSync(path.join(OUT, d)).isDirectory() && fs.existsSync(path.join(OUT, d, "index.html")));
// Walk each one depth-first; every folder holding an index.html is a page.
for (const folder of folders) {
  // The folders still to read.
  const stack = [path.join(OUT, folder)];
  // Pages found in this folder, for the summary.
  let count = 0;
  // Until every folder below has been read.
  while (stack.length) {
    // The next folder.
    const dir = stack.pop();
    // Its page, if it has one.
    const index = path.join(dir, "index.html");
    // A page: check it under the path the site serves it at.
    if (fs.existsSync(index)) {
      // The served path, /<folder>/<route>/.
      const rel = `/${path.relative(OUT, dir).split(path.sep).join("/")}/`;
      // The checks above.
      checkPage(index, rel);
      // One more page in this folder.
      count += 1;
    }
    // Its subfolders, for the walk.
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) stack.push(path.join(dir, e.name));
  }
  // Remembered for the summary.
  perFolder.set(folder, count);
}

// Too few pages means the layout changed and this guard is reading the wrong thing.
if (pages < 100) errors.push(`only ${pages} pages found under out/ (has the layout changed?)`);
// THE STALE HALF: an exception that matched nothing has done its job.
for (const rel of NO_CARD.keys()) if (!exemptSeen.has(rel)) errors.push(`NO_CARD "${rel}" no longer matches a page without a card and must be removed.`);

// Any finding fails the build, with the first forty shown.
if (errors.length) {
  // The headline.
  console.error(`[check-og-references] FAIL: ${errors.length} problem(s) with the social cards of built pages:`);
  // The findings themselves.
  for (const e of errors.slice(0, 40)) console.error(`  - ${e}`);
  // How many more there are.
  if (errors.length > 40) console.error(`  ...and ${errors.length - 40} more.`);
  // A failed guard stops the build.
  process.exit(1);
}

// The pages per folder, as "en 1583, pt-BR 1583, ..." for the summary.
const breakdown = [...perFolder].map(([f, n]) => `${f} ${n}`).join(", ");
// The summary line.
console.log(
  `[check-og-references] OK: ${pages} built page(s) read (${breakdown}); every page but ${NO_CARD.size} declared ` +
    `exception(s) names a social card, og:image and twitter:image agree, and all ${sizes.size} card file(s) exist ` +
    `at the size the pages declare.`
);
