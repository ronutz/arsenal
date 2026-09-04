// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/audit-industry-depth.mjs
// ----------------------------------------------------------------------------
// Measures every industry catalogue entry against the RICH MINIMUM STANDARD
// (PRIME, 2026-09-02), and reports. It does NOT block a build.
//
// WHY A REPORT AND NOT A GUARD
// The same reasoning as audit-neutral-depth: a threshold that fails CI would
// force filler into entries where the public record is genuinely thin, and a
// padded entry is worse than a short one. This ranks the queue instead, so the
// work goes where the material exists.
//
// WHAT COUNTS AS DEPTH
// An entry is served EITHER by an inline `body` in partners.ts OR by a written
// profile in src/content/vendors/profiles/. The 45 entries with no body and a
// full profile are correct, not empty - this script must not confuse them, and
// an earlier count of mine did exactly that before checking.
//
// THE STANDARD (see canon: PADRAO-MINIMO-INDUSTRIA-20260902.md)
//   1. Two or more independent sources.
//   2. A founding year where the company still exists or its dates are known.
//   3. At least two body paragraphs, or a profile file.
//   4. At least 150 words of body, or a profile file.
//   5. The four content beats, checked by keyword as a weak proxy only:
//      origin/founders, what it sells, who it works with, and what happened to
//      it. Keyword matching cannot judge prose, so a beat miss is a hint for a
//      human, never a verdict.
// ============================================================================

import { readFileSync, readdirSync, existsSync } from "node:fs";

const SRC = "src/content/vendors/partners.ts";
const PROFILE_DIR = "src/content/vendors/profiles";

const src = readFileSync(SRC, "utf8");
const profiles = new Set(
  existsSync(PROFILE_DIR)
    ? readdirSync(PROFILE_DIR).filter((f) => f.endsWith(".ts")).map((f) => f.slice(0, -3))
    : [],
);

// Split on top-level entry slugs (four-space indent), which is the only
// reliable boundary: `careerChapter` also carries a `slug` field and a naive
// match counts it as an entry.
const marks = [...src.matchAll(/^ {4}slug: "([a-z0-9.-]+)",$/gm)];
const entries = marks.map((m, i) => {
  const start = m.index;
  const end = i + 1 < marks.length ? marks[i + 1].index : src.length;
  return { slug: m[1], text: src.slice(start, end) };
});

const BEATS = {
  origin: /\bfounded|founding|began|started|origin|spun out|incorporat/i,
  offer: /\bsells|sold|product|portfolio|service|platform|catalogue|specialis|specializ/i,
  network: /\bpartner|distribut|customer|reseller|integrat|alliance|channel/i,
  outcome: /\bacquir|bought|merged|renamed|closed|survive|today|remains|became/i,
};

const rows = entries.map((e) => {
  const bodyMatch = e.text.match(/body: \[(.*?)\n {4}\]/s);
  const body = bodyMatch ? bodyMatch[1] : "";
  const paragraphs = (body.match(/\n {6}"/g) || []).length;
  const words = body.trim() ? body.replace(/\s+/g, " ").trim().split(" ").length : 0;
  const sources = (e.text.match(/\{ label:/g) || []).length;
  const hasProfile = profiles.has(e.slug);
  const prose = `${body} ${e.text.match(/intro: "(.*?)",\n/s)?.[1] ?? ""}`;
  const missingBeats = Object.entries(BEATS)
    .filter(([, re]) => !re.test(prose))
    .map(([name]) => name);

  const gaps = [];
  if (sources < 2) gaps.push("one source");
  if (!/founded: \d{4}/.test(e.text)) gaps.push("no founding year");
  if (!hasProfile && paragraphs < 2) gaps.push("under two paragraphs");
  if (!hasProfile && words < 150) gaps.push(`${words} words`);
  if (!hasProfile && missingBeats.length) gaps.push(`beats: ${missingBeats.join("/")}`);

  return { ...e, paragraphs, words, sources, hasProfile, gaps };
});

const short = rows.filter((r) => !r.hasProfile && r.words < 150);
const oneSource = rows.filter((r) => r.sources < 2);
const noYear = rows.filter((r) => !/founded: \d{4}/.test(r.text));
const queue = rows
  .filter((r) => r.gaps.length)
  .sort((a, b) => b.gaps.length - a.gaps.length || a.words - b.words);

console.log(`[audit-industry-depth] ${rows.length} entries; ${profiles.size} carry a written profile.`);
console.log(`  short body and no profile : ${short.length}`);
console.log(`  fewer than two sources    : ${oneSource.length}`);
console.log(`  no founding year          : ${noYear.length}`);
console.log(`  meeting the standard      : ${rows.length - queue.length}`);
console.log(`\nQUEUE (${queue.length}) - deepest gaps first:`);
for (const r of queue.slice(0, 40)) {
  console.log(`  ${r.slug.padEnd(26)} ${String(r.words).padStart(4)}w  ${r.gaps.join("; ")}`);
}
if (queue.length > 40) console.log(`  ... and ${queue.length - 40} more`);
