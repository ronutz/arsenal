// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-objective-coverage.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: a published objective must either HAVE coverage or SAY it has
// none. Silence in between is the one outcome the site cannot afford.
//
// Why this exists (2026-07-27): 26 objectives across 8 published guides carried
// no related article, no tool, no manual link and no key points - and were not
// marked as gaps either. The pages rendered them as ordinary covered
// objectives. A reader working through a blueprint would have found nothing
// behind them and had no way to know that was expected rather than a broken
// link. That is worse than an honest "not covered yet": the whole value of
// these guides is that the gaps are visible.
//
// It went unnoticed because the gap flag is REMOVED when coverage is added, so
// any pass that cleared flags slightly too broadly left objectives looking
// covered. Nothing checked the inverse direction.
//
// WHAT COUNTS AS COVERAGE - deliberately four things, not one:
//   relatedArticles  an article on this site teaches it
//   relatedTools     a tool exercises it
//   manualLinks      the vendor's own documentation is the right answer
//   keyPoints        the blueprint's own sub-points are transcribed, which is
//                    real content even with no article yet (the F5 NGINX
//                    guides are the case that proves this: every objective is
//                    broken down from the published blueprint)
//
// A first version of this check missed nearly half the objectives on the site
// because it assumed a fixed field order and indentation. It reported 881
// objectives where there are 1,632. The parser below finds objectives by their
// own `text:` field and reads to the next one, assuming nothing about layout.
// ============================================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "src", "content", "certifications", "study-guides.ts");
const src = readFileSync(SRC, "utf8");

const errors = [];
let published = 0;
let checked = 0;

// Split into guide blocks by slicing between guide STARTS. A first version
// matched a start and then scanned for a closing boundary, which over-ran
// whenever a guide did not end in exactly the expected shape: it found only 75
// of 91 guides and attributed 303 objectives to one of them. The objective
// COUNT was right and every finding was real - but each was reported against
// the wrong file, which would send someone to the wrong place to fix it.
// Slicing between starts cannot over-run, because the next start is the end.
const starts = [...src.matchAll(/\n {2}\{\n {4}slug: "([a-z0-9.-]+)",/g)];

for (let g = 0; g < starts.length; g++) {
  const slug = starts[g][1];
  const from = starts[g].index ?? 0;
  const to = g + 1 < starts.length ? (starts[g + 1].index ?? src.length) : src.length;
  const body = src.slice(from, to);
  if (!body.includes('status: "published"')) continue;
  published += 1;

  // Objectives, located by their own text field - no layout assumptions.
  const objStarts = [...body.matchAll(/text: "/g)].map((m) => m.index ?? 0);
  for (let i = 0; i < objStarts.length; i++) {
    const block = body.slice(
      objStarts[i],
      i + 1 < objStarts.length ? objStarts[i + 1] : body.length,
    );
    const text = /text: "([^"]+)"/.exec(block)?.[1] ?? "(unnamed)";
    checked += 1;

    if (block.includes("gap: true")) continue; // honestly declared uncovered

    const covered =
      /relatedArticles: \[\s*"/.test(block) ||
      /relatedTools: \[\s*"/.test(block) ||
      /manualLinks: \[\s*[{"]/.test(block) ||
      /keyPoints: \[\s*"/.test(block);

    if (!covered) {
      errors.push(
        `${slug}: "${text.slice(0, 70)}" has no article, tool, manual link or key points, ` +
        `and is not marked gap: true - so the page presents it as covered when nothing backs it`,
      );
    }
  }
}

if (errors.length) {
  console.error(
    `[check-objective-coverage] FAIL: ${errors.length} objective(s) claim coverage they do not have:\n  - ` +
    errors.join("\n  - "),
  );
  process.exit(1);
}
console.log(
  `[check-objective-coverage] OK: ${checked} objectives across ${published} published guides - ` +
  `every one either has coverage or is honestly flagged as a gap.`,
);
