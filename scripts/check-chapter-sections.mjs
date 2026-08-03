#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-chapter-sections.mjs — THE TWENTY-SECOND GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: every authored section of a career chapter must actually be
// rendered, and every section the page expects must actually exist.
//
// WHY. Career chapters render `s1Title`/`s1Body` through `sNTitle`/`sNBody`,
// where N is a number written by hand in each chapter's page file. On
// 2026-08-03 that number was found to be smaller than the number of sections
// somebody had written. Three passages of PRIME's own history - pulling cable
// under a pier at São Sebastião, the customer list across the Brazilian
// economy, and the multiprotocol enterprise before IP won - had been authored,
// translated into pt-BR, reviewed, and were being rendered nowhere.
//
// **Nothing was broken. The pages built, the translations passed parity, every
// other guard was green, and the writing was invisible.** That is the third
// distinct shape of this failure found in two days: a chapter nothing links to,
// a link pointing at nothing, and now content nothing renders. All three are
// silent, and none of them is a bug in any sense a compiler recognises.
//
// TWO DIRECTIONS
//   1. an authored sNBody above the declared count -> written and invisible
//   2. a declared count above the authored sections -> the page asks for a
//      section that does not exist
//
// It reads the count straight out of each page file rather than a registry,
// because the count IS in the page file and a guard that consults a different
// source is checking something else.
// ============================================================================

import { readFileSync, readdirSync, existsSync } from "node:fs";

const DIR = "src/app/[locale]/about/vendors";
const messages = JSON.parse(readFileSync("src/i18n/messages/en.json", "utf8"));
const vendors = messages.vendors ?? {};

const failures = [];
let checked = 0;

for (const slug of readdirSync(DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)) {
  const file = `${DIR}/${slug}/page.tsx`;
  if (!existsSync(file)) continue;
  const src = readFileSync(file, "utf8");

  const keyMatch = src.match(/vendorKey="([a-z0-9-]+)"/);
  if (!keyMatch) continue;
  const key = keyMatch[1];
  const chapter = vendors[key];
  if (!chapter) continue;

  // Default in CareerChapterPage is 2 when the prop is omitted.
  const countMatch = src.match(/sections=\{(\d+)\}/);
  const declared = countMatch ? Number(countMatch[1]) : 2;

  // Highest authored section, and any gaps below it.
  const authored = Object.keys(chapter)
    .map((k) => k.match(/^s(\d+)Body$/))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
  checked += 1;
  if (authored.length === 0) continue;
  const highest = authored[authored.length - 1];

  if (highest > declared) {
    const hidden = authored.filter((n) => n > declared);
    failures.push(
      `${slug}: sections={${declared}} but s${hidden.join(", s")} ${hidden.length === 1 ? "is" : "are"} authored.\n` +
        `      That writing exists, is translated, and renders nowhere. Raise the count or remove it deliberately.`,
    );
  }
  const gaps = [];
  for (let i = 1; i <= Math.min(declared, highest); i += 1) {
    if (!authored.includes(i)) gaps.push(i);
  }
  if (gaps.length) {
    failures.push(`${slug}: sections={${declared}} but s${gaps.join(", s")} ${gaps.length === 1 ? "has" : "have"} no body.`);
  }
}

if (failures.length) {
  console.error("\n[check-chapter-sections] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(
  `[check-chapter-sections] OK: ${checked} career chapters, every authored section rendered, no gaps.`,
);
