// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-eras.mjs
// ----------------------------------------------------------------------------
// THE ERA NAVIGATOR'S ERAS ARE CONTIGUOUS, ANCHORED AND NAMED.
//
// src/content/vendors/eras.ts (E13 of Round 1, 2026-10-06) cuts the industry
// timeline into eras that open at the site's own sourced milestones. Three
// things can go quietly wrong there and this guard fails the build on each:
//
//   1. the ranges overlap or leave a gap, so a company would sit in two eras or
//      in none (the first era opens at or before the earliest story year, the
//      last reaches the current year);
//   2. an anchor names a milestone slug that does not exist in milestones.ts,
//      so the navigator would promise a source it cannot show;
//   3. an era has no title or lede in en or pt-BR
//      (industry.eras.<key>.title and .lede).
// ============================================================================
import { readFileSync } from "node:fs";

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const eras = read("../src/content/vendors/eras.ts");
const milestones = read("../src/content/milestones/milestones.ts");
const partners = read("../src/content/vendors/partners.ts");
const en = JSON.parse(read("../src/i18n/messages/en.json"));
const pt = JSON.parse(read("../src/i18n/messages/pt-BR.json"));

// The eras, from their literal rows: key, from, to (a literal year or THIS_YEAR), anchors.
const rows = [...eras.matchAll(/\{ key: "([a-z0-9-]+)", from: (\d{4}), to: (\d{4}|THIS_YEAR), anchors: \[([^\]]*)\] \}/g)].map((m) => ({
  key: m[1],
  from: Number(m[2]),
  to: m[3] === "THIS_YEAR" ? new Date().getUTCFullYear() : Number(m[3]),
  anchors: [...m[4].matchAll(/"([a-z0-9-]+)"/g)].map((a) => a[1]),
}));
const slugs = new Set([...milestones.matchAll(/^\s+slug: "([a-z0-9-]+)",/gm)].map((m) => m[1]));
// The earliest story year on the timeline: the smallest founded or storyBegins year in partners.ts.
const years = [...partners.matchAll(/(?:founded|year): (\d{4})/g)].map((m) => Number(m[1]));
const earliest = Math.min(...years);

const failures = [];
if (rows.length < 3) failures.push(`only ${rows.length} era(s) parsed from eras.ts; the rows' shape changed.`);
for (let i = 0; i < rows.length; i += 1) {
  const r = rows[i];
  if (r.to < r.from) failures.push(`${r.key}: ends (${r.to}) before it begins (${r.from}).`);
  if (i > 0 && r.from !== rows[i - 1].to + 1) failures.push(`${r.key}: begins ${r.from}, but the previous era ends ${rows[i - 1].to}; eras must be contiguous.`);
  if (r.anchors.length === 0) failures.push(`${r.key}: no anchor milestone.`);
  for (const a of r.anchors) if (!slugs.has(a)) failures.push(`${r.key}: anchor "${a}" is not a milestone slug in milestones.ts.`);
  for (const [loc, m] of [["en", en], ["pt-BR", pt]]) {
    const e = m?.industry?.eras?.[r.key];
    if (!e || typeof e.title !== "string" || typeof e.lede !== "string") failures.push(`${r.key}: industry.eras.${r.key}.title/lede missing in ${loc}.`);
  }
}
if (rows.length && rows[0].from > earliest) failures.push(`the first era begins ${rows[0].from}, after the earliest story year on the timeline (${earliest}).`);
if (rows.length && rows[rows.length - 1].to < new Date().getUTCFullYear()) failures.push(`the last era ends ${rows[rows.length - 1].to}, before this year.`);

if (failures.length) {
  console.error(`\n[check-eras] FAIL: ${failures.length} problem(s).\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}
console.log(`[check-eras] OK: ${rows.length} contiguous eras from ${rows[0].from} to ${rows[rows.length - 1].to}, ${rows.reduce((n, r) => n + r.anchors.length, 0)} anchors all milestones, titles and ledes in en and pt-BR.`);
