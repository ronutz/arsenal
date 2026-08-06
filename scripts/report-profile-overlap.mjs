#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/report-profile-overlap.mjs — A REPORT, NOT A GUARD
// ----------------------------------------------------------------------------
// WHAT THIS IS FOR. When a vendor entry has both body prose and a rich profile,
// the two are written at different times and the profile tends to restate the
// body. Across the 2026-08 refactor this happened in roughly one paragraph in
// ten, every time caught by measuring vocabulary overlap between each body
// paragraph and the profile.
//
// *** THIS IS DELIBERATELY NOT A BUILD GUARD. *** Overlap is evidence, not a
// verdict. Several flagged paragraphs were read and correctly KEPT, because two
// accounts of the same company will share vocabulary without duplicating
// content. A check that fails the build on a judgement call is a check people
// learn to route around.
//
// TWO FLAWS IN THE AD-HOC VERSION THIS REPLACES, both found on 2026-08-05:
//
//   1. IT READ THE WHOLE FILE, INCLUDING COMMENTS. Profile files carry a
//      verification manifest that by design summarises what the body already
//      says - so the manifest was guaranteed to overlap with the body and
//      inflate every score. Measured across six entries the flag counts did not
//      actually change, but the exposure was real. This strips comments first.
//
//   2. SHORT PARAGRAPHS INFLATE THE RATIO. A 246-character paragraph of generic
//      trade vocabulary scored 75% against a profile that never mentioned its
//      subject, because a small denominator makes common words look like
//      duplication. This reports paragraph length alongside the score and marks
//      anything under the length floor as low-confidence rather than flagged.
//
// USAGE:  node scripts/report-profile-overlap.mjs <slug> [<slug> ...]
//         node scripts/report-profile-overlap.mjs --all
// ============================================================================

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

/** Overlap above this fraction is worth reading the paragraph. Not a failure. */
const FLAG = 0.62;

/**
 * Paragraphs shorter than this produce unreliable ratios: too few distinctive
 * words, so shared generic vocabulary dominates. Reported but not flagged.
 */
const LENGTH_FLOOR = 300;

/**
 * THIRD FLAW, found 2026-08-05 while working the queue this tool produced.
 *
 * Where an entry has only one or two body paragraphs, that prose is not a
 * parallel account competing with the profile - it is the ORIENTATION a reader
 * meets before the structured sections begin. Overlap there is expected and
 * correct: an introduction restates in summary what the detail then expands.
 *
 * Cutting it would leave an entry with a tagline and then, abruptly, a founding
 * block. Cyclades has exactly one body paragraph and it was flagged; removing
 * it would have left no prose on the page at all.
 *
 * So bodies at or below this length are reported as ORIENTATION and never
 * flagged. The judgement only applies where there is enough prose for a
 * paragraph to be genuinely redundant rather than introductory.
 */
const ORIENTATION_MAX_PARAGRAPHS = 2;

/** Words too common to carry meaning about whether two passages say the same thing. */
const STOP = new Set(
  ("the a an and or of to in for that with was were is are it its as on by from at this " +
    "which be been has had not but they their there when what who where how why all any " +
    "one two into over under after before while than then them these those such").split(" "),
);

/** Distinctive words in a passage: 5+ letters, lowercased, stop words removed. */
function keyTerms(text) {
  const words = text.toLowerCase().match(/\b[a-z][a-z0-9-]{4,}\b/g) ?? [];
  return new Set(words.filter((w) => !STOP.has(w)));
}

/**
 * Remove block and line comments so the verification manifest cannot inflate
 * the score. This is the first of the two flaws described above.
 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function overlapReport(slug) {
  const profilePath = `src/content/vendors/profiles/${slug}.ts`;
  if (!existsSync(profilePath)) return { slug, skipped: "no profile" };

  // The body lives in partners.ts as TypeScript, so read it through tsx rather
  // than parsing it here - the data is the source of truth, not a regex of it.
  const bodyJson = execFileSync(
    "npx",
    [
      "tsx",
      "-e",
      `import { partnerVendors } from "./src/content/vendors/partners.ts";` +
        `const v = partnerVendors.find(x => x.slug === ${JSON.stringify(slug)});` +
        `process.stdout.write(JSON.stringify(v?.body ?? []));`,
    ],
    { encoding: "utf8" },
  );
  const body = JSON.parse(bodyJson);
  if (!body.length) return { slug, skipped: "no body prose" };

  const profileTerms = keyTerms(stripComments(readFileSync(profilePath, "utf8")));

  // An entry whose whole prose is one or two paragraphs is orientation, not a
  // competing account. See ORIENTATION_MAX_PARAGRAPHS above.
  const isOrientation = body.length <= ORIENTATION_MAX_PARAGRAPHS;

  const rows = body.map((paragraph, index) => {
    const terms = [...keyTerms(paragraph)];
    const shared = terms.filter((t) => profileTerms.has(t)).length;
    const ratio = shared / Math.max(1, terms.length);
    return {
      index,
      ratio,
      length: paragraph.length,
      // Short paragraphs are reported but not flagged: see flaw 2 above.
      // Orientation prose is never flagged: see flaw 3 above.
      flagged: ratio > FLAG && paragraph.length >= LENGTH_FLOOR && !isOrientation,
      lowConfidence: ratio > FLAG && paragraph.length < LENGTH_FLOOR && !isOrientation,
      orientation: ratio > FLAG && isOrientation,
      opening: paragraph.slice(0, 60),
    };
  });

  return { slug, rows };
}

const args = process.argv.slice(2);
const slugs = args.includes("--all")
  ? readdirSync("src/content/vendors/profiles")
      .filter((f) => f.endsWith(".ts"))
      .map((f) => f.replace(/\.ts$/, ""))
  : args;

if (!slugs.length) {
  console.error("usage: node scripts/report-profile-overlap.mjs <slug> [...] | --all");
  process.exit(2);
}

let totalFlagged = 0;
let totalParagraphs = 0;

for (const slug of slugs) {
  const report = overlapReport(slug);
  if (report.skipped) {
    console.log(`\n${slug}: ${report.skipped}`);
    continue;
  }
  const flagged = report.rows.filter((r) => r.flagged).length;
  totalFlagged += flagged;
  totalParagraphs += report.rows.length;
  console.log(`\n${slug}  (${flagged} of ${report.rows.length} worth reading)`);
  for (const r of report.rows) {
    const mark = r.flagged
      ? "  <-- READ IT"
      : r.orientation
        ? "  (orientation prose, overlap expected)"
        : r.lowConfidence
          ? "  (short, low confidence)"
          : "";
    console.log(
      `   [${r.index}] ${(r.ratio * 100).toFixed(0).padStart(3)}%  ${String(r.length).padStart(4)} chars  ${r.opening}...${mark}`,
    );
  }
}

if (slugs.length > 1) {
  console.log(
    `\nTOTAL: ${totalFlagged} paragraph(s) worth reading across ${totalParagraphs}` +
      ` (${((totalFlagged / Math.max(1, totalParagraphs)) * 100).toFixed(0)}%)`,
  );
}
console.log("\nOverlap is evidence, not a verdict. Read each flagged paragraph before changing anything.");
