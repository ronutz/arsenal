#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-sources.mjs — THE TWENTY-NINTH GUARD
// ----------------------------------------------------------------------------
// PRIME ratified a golden content standard on 2026-08-06: "sources must be
// recorded and published at the footer of every page."
//
// *** A STANDARD WITHOUT A GUARD IS A WISH. ***
//
// Every other rule on this site is enforced by something that fails the build,
// because a rule that depends on remembering is a rule that decays the first
// week somebody is busy. This one was ratified and then immediately began
// decaying: at the time of writing 47 of 164 vendor entries carry no source at
// all, and every one of them makes dated factual claims about a real company.
//
// WHY THIS GUARD RATCHETS RATHER THAN SIMPLY FAILING
//
// The honest options were to fail the build on all 47 known gaps - which stops
// all work until a research job is finished, and would be reverted within the
// hour - or to report and be ignored, which is what a linter warning is.
//
// So it does neither. It carries an explicit, dated allowlist of the entries
// that were already missing sources when the standard landed, and it fails on:
//
//   1. any entry NOT on that list that lacks sources  - no new debt;
//   2. any entry ON the list that has since GAINED sources - the list must be
//      trimmed, so it can only ever shrink;
//   3. any source with an empty label or a non-http URL - a citation nobody
//      can follow is not a citation.
//
// The effect is that the backlog is visible, cannot grow, and the file itself
// reports how much of it is left every time the build runs.
// ============================================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// ---------------------------------------------------------------------------
// THE GRANDFATHERED SET.
// Vendor slugs that had no sources when the standard was ratified. This list
// may only ever get shorter. Adding to it is not a fix; it is a decision to
// publish an uncited factual claim, and should be argued for explicitly.
// ---------------------------------------------------------------------------
const GRANDFATHERED_AT = "2026-08-06";
// *** THIS LIST IS DERIVED FROM THE DATA, NOT WRITTEN FROM MEMORY. ***
// The first version of it was typed from recollection of a sample and was wrong
// in both directions at once: it named entries that do not exist, omitted 30
// that do, and grandfathered apple and microsoft, which were already cited. The
// guard caught all of that on its first run - which is the argument for the
// guard, and the argument against ever hand-writing a list the data can answer.
const GRANDFATHERED = new Set([
  "3com", "a10", "access-home-fleet", "banyan", "bell-labs-lucent-alcatel",
  "blue-coat-packeteer", "bull", "ciena", "compaq",
  "cyclades-avocent-vertiv", "data-general", "datacom", "dec",
  "dell-force10", "dns-bind", "ericsson", "fluke", "fujitsu", "hitachi",
  "http-gopher", "huawei", "ibm", "intel-amd", "kemp", "marconi",
  "motorola", "ncsa", "nec", "netscape", "nokia", "novell", "nvidia",
  "oracle", "rand", "sap", "siemens", "silicon-graphics",
  "sniffer-lineage", "sun-microsystems", "tandem", "toshiba", "ubiquiti",
  "unisys", "wang", "watchguard", "xerox", "zte",
]);

const src = readFileSync(join(root, "src/content/vendors/partners.ts"), "utf8");

// Slice the file into per-entry blocks on the slug boundary. Deliberately a
// text scan rather than an import: this must run before anything compiles.
const blocks = [];
const slugRe = /^\s{2,4}slug:\s*"([a-z0-9.-]+)",/gm;
let m;
const marks = [];
while ((m = slugRe.exec(src)) !== null) marks.push({ slug: m[1], at: m.index });
for (let i = 0; i < marks.length; i += 1) {
  const end = i + 1 < marks.length ? marks[i + 1].at : src.length;
  blocks.push({ slug: marks[i].slug, body: src.slice(marks[i].at, end) });
}

const missing = [];
const graduated = [];
const malformed = [];

for (const { slug, body } of blocks) {
  // careerChapter carries a nested `slug:` - skip those pseudo-entries.
  if (!/^\s{2,4}slug:/m.test(body)) continue;
  const hasSources = /\n\s+sources:\s*\[/.test(body);

  if (!hasSources && !GRANDFATHERED.has(slug)) missing.push(slug);
  if (hasSources && GRANDFATHERED.has(slug)) graduated.push(slug);

  // A citation nobody can follow is not a citation.
  if (hasSources) {
    const urls = [...body.matchAll(/url:\s*"([^"]*)"/g)].map((x) => x[1]);
    const labels = [...body.matchAll(/label:\s*"([^"]*)"/g)].map((x) => x[1]);
    for (const u of urls) {
      if (u && !/^https?:\/\//.test(u) && !u.startsWith("/")) {
        malformed.push(`${slug}: unusable url ${JSON.stringify(u)}`);
      }
    }
    for (const l of labels) {
      if (l.trim() === "") malformed.push(`${slug}: empty source label`);
    }
  }
}

const problems = [];
if (missing.length) {
  problems.push(
    `${missing.length} entr${missing.length === 1 ? "y" : "ies"} publish factual claims with NO sources and are not grandfathered:\n    ` +
      missing.join(", "),
  );
}
if (graduated.length) {
  problems.push(
    `${graduated.length} entr${graduated.length === 1 ? "y" : "ies"} now HAVE sources but are still on the grandfathered list.\n` +
      `    The list may only shrink - remove them from GRANDFATHERED in this file:\n    ` +
      graduated.join(", "),
  );
}
if (malformed.length) problems.push(`unusable citations:\n    ` + malformed.join("\n    "));

const total = blocks.length;
const cited = total - missing.length - [...GRANDFATHERED].filter((g) => blocks.some((b) => b.slug === g)).length;
const backlog = [...GRANDFATHERED].filter((g) => blocks.some((b) => b.slug === g)).length;

if (problems.length) {
  console.error("[check-sources] FAILED");
  for (const p of problems) console.error("  - " + p);
  console.error(
    `\n  standard ratified ${GRANDFATHERED_AT}: sources recorded and published on every page.`,
  );
  process.exit(1);
}

console.log(
  `[check-sources] OK: ${cited}/${total} vendor entries cited; ` +
    `${backlog} grandfathered before ${GRANDFATHERED_AT} (this number may only go down).`,
);
