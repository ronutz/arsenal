#!/usr/bin/env node
/**
 * probe-render.mjs — assert that a built page actually contains the sentences we wrote.
 *
 * WHY THIS EXISTS
 * ---------------
 * Authoring checks were being written ad hoc, one shell pipeline at a time, and the
 * pipelines kept being wrong in ways that looked like content failures. Three distinct
 * defects showed up in a single working session:
 *
 *   1. A regex meant to list ruled acronyms omitted the quotes around object keys, so it
 *      matched nothing and reported an empty set. An empty result read as "no problem here"
 *      when it actually meant "this check did not run".
 *   2. A `head -2 | tail -1` slice assumed every guard prints its message on the second
 *      line. One guard prints on the first, so a real, correct failure rendered as a blank
 *      line and briefly looked like guard rot.
 *   3. A probe string was typed with a typographic apostrophe (U+2019) while MDX had
 *      rendered a straight one, so a sentence that was present reported as missing.
 *
 * None of those were content bugs. All of them were verification bugs, and a verification
 * bug is worse than no verification: it produces confident, wrong conclusions. This script
 * exists so that the checking is done once, correctly, in a place where a fix is permanent.
 *
 * WHAT IT DOES
 * ------------
 * Loads a built HTML page, reduces it to visible text the way a reader would see it, and
 * asserts that each supplied fragment is present. It reports every fragment individually
 * and exits non-zero if any is missing, so it can be used in a pipeline without anybody
 * having to eyeball the output.
 *
 * USAGE
 *   node scripts/probe-render.mjs <page> "fragment one" "fragment two" ...
 *   node scripts/probe-render.mjs <page> --from-file fragments.json
 *
 *   <page> may be a path under out/ or a bare "locale/route" pair, e.g.
 *     out/en/learn/some-article/index.html
 *     en/learn/some-article
 *
 * EXIT CODES
 *   0  every fragment found
 *   1  at least one fragment missing
 *   2  the page could not be read (which is a distinct failure from a missing fragment,
 *      and is reported as such rather than being silently counted as a miss)
 */

import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "out";

/**
 * Reduce HTML to the visible text a reader would see.
 *
 * Order matters here: script and style bodies are removed *before* tags are stripped,
 * because otherwise their contents would survive as text. The 404 payload embedded in
 * every page is inside a <script>, and leaving it in has previously caused a page to
 * appear to contain strings from other locales.
 */
function visibleText(html, tagReplacement = " ") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, tagReplacement)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    // Both decimal and HEX numeric entities. The renderer emits &#x27; for an apostrophe,
    // and an early version of this script handled only the decimal form - which made a
    // sentence that was present report as missing, i.e. exactly the defect this tool was
    // written to prevent. Caught on first use because it was tested against a known-true case.
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalise the characters that differ between what an author types and what a renderer
 * emits, so a fragment is not reported missing over punctuation. Applied to BOTH sides of
 * the comparison — normalising only one side would reintroduce defect 3 in a new form.
 */
function normalise(s) {
  return s
    .replace(/[\u2018\u2019\u02BC]/g, "'") // curly and modifier apostrophes
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes
    .replace(/[\u2013\u2014]/g, "-") // en and em dashes
    .replace(/\u00A0/g, " ") // non-breaking space
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/** Accept either a full path under out/ or a bare "locale/route" pair. */
function resolvePage(arg) {
  const candidates = [
    arg,
    path.join(arg, "index.html"),
    path.join(OUT_DIR, arg, "index.html"),
    path.join(OUT_DIR, arg),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

const [pageArg, ...rest] = process.argv.slice(2);

if (!pageArg || rest.length === 0) {
  console.error("usage: node scripts/probe-render.mjs <page> \"fragment\" [...]");
  console.error("       node scripts/probe-render.mjs <page> --from-file fragments.json");
  process.exit(2);
}

let fragments = rest;
if (rest[0] === "--from-file") {
  const file = rest[1];
  if (!file || !fs.existsSync(file)) {
    console.error(`[probe-render] FAIL: fragment file not found: ${file}`);
    process.exit(2);
  }
  fragments = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(fragments)) {
    console.error("[probe-render] FAIL: fragment file must contain a JSON array of strings.");
    process.exit(2);
  }
}

const page = resolvePage(pageArg);
if (!page) {
  // Deliberately exit 2, not 1: "the page is not there" is a different problem from
  // "the page is there and the sentence is missing", and collapsing them hides build gaps.
  console.error(`[probe-render] FAIL: no built page found for "${pageArg}".`);
  console.error("  Did the build run, and was this locale included in VERIFY_LOCALES?");
  process.exit(2);
}

const rawHtml = fs.readFileSync(page, "utf8");

/**
 * Two readings of the same page, because neither alone is correct.
 *
 * Replacing a tag with a space is right across block boundaries, where two words would
 * otherwise be joined. It is wrong INSIDE a word: the glossary hint component wraps a term
 * in a <button>, and a possessive apostrophe immediately after the closing tag then reads
 * as "term 's" - so a sentence that renders perfectly to a human reports as missing.
 * Replacing a tag with nothing fixes that case and breaks the first one.
 *
 * A fragment is present if either reading contains it. This removes the false negatives
 * without introducing a plausible false positive, since a fragment long enough to be worth
 * asserting will not appear by accident across a joined block boundary.
 */
const haystacks = [
  normalise(visibleText(rawHtml, " ")),
  normalise(visibleText(rawHtml, "")),
];

let missing = 0;
for (const fragment of fragments) {
  const needle = normalise(fragment);
  const found = haystacks.some((h) => h.includes(needle));
  if (!found) missing += 1;
  const label = fragment.length > 64 ? `${fragment.slice(0, 61)}...` : fragment;
  console.log(`  ${found ? "ok  " : "MISS"}  ${label}`);
}

if (missing > 0) {
  console.error(
    `[probe-render] FAIL: ${missing} of ${fragments.length} fragment(s) missing from ${page}.`,
  );
  process.exit(1);
}

console.log(
  `[probe-render] OK: all ${fragments.length} fragment(s) present in ${page}.`,
);
