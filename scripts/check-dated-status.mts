// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-dated-status.mts  (postbuild; run with tsx)
// ----------------------------------------------------------------------------
// DATES TURNED INTO BEHAVIOUR, CHECKED (2026-10-06, SCOUT's Round 1 adoption
// audit, rows 8 and 23: "If a certification says Retiring 31 August 2026 and
// today is October 2026, the renderer should automatically stop presenting that
// as a future event. Don't rely on humans to notice every date.").
//
// For every certification guide carrying a retirement notice:
//   1. the ISO day stored beside the published wording must be the same day
//      ("September 30, 2026" and 2026-09-30), so the behaviour follows the fact;
//   2. in every locale built in full (en, pt-BR), the exam page and the hub card
//      must say what the build day makes true: future wording while the last
//      sitting day is ahead, past wording once it is behind, the hub badge as the
//      notice's scope prescribes (src/lib/retirement.ts). A notice dated within a
//      day of the build is not judged, so a build that crosses midnight UTC
//      cannot fail on the boundary;
//   3. notices falling due within the next 30 days are listed (not fatal), so a
//      rebuild after the date is planned rather than left to chance.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { studyGuides } from "../src/content/certifications/study-guides";
import { retirementState, todayIso } from "../src/lib/retirement";

const OUT = path.join(process.cwd(), "out");
const TAG = "[check-dated-status]";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "September 30, 2026" -> "2026-09-30"; null when the wording is not in that published form. */
function isoOf(until: string): string | null {
  const m = until.match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]);
  if (month < 0) return null;
  return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** Whole days from a to b (ISO days). */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** The visible text of a built page, as check-count-semantics reads it. */
function textOf(file: string): string {
  return fs
    .readFileSync(file, "utf8")
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ");
}

// The wording each authored locale prints (certGuides.* in the packs): the exam page's future and past notices and
// the hub badges. Both locales keep the vendor's date verbatim, in English, as published.
const WORDS: Record<string, { future: string; past: string; retiring: string; retired: string; previous: string }> = {
  en: { future: "can be sat until", past: "a date now past", retiring: "Retiring", retired: "Retired", previous: "Previous version until" },
  "pt-BR": { future: "até", past: "data que já passou", retiring: "Em descontinuação", retired: "Descontinuado", previous: "Versão anterior até" },
};

const today = todayIso();
const problems: string[] = [];
const dueSoon: string[] = [];
let notices = 0;
let pageChecks = 0;

for (const g of studyGuides) {
  const r = g.retirement;
  if (!r) continue;
  notices++;
  // 1. The stored ISO day is the published day.
  const parsed = isoOf(r.until);
  if (parsed === null) problems.push(`${g.slug}: "${r.until}" is not in the "Month D, YYYY" form the parser knows; check untilIso by hand and extend isoOf`);
  else if (parsed !== r.untilIso) problems.push(`${g.slug}: untilIso ${r.untilIso} is not the published "${r.until}" (${parsed})`);
  const gap = daysBetween(today, r.untilIso);
  if (gap >= 0 && gap <= 30) dueSoon.push(`${g.slug} (${r.until}, in ${gap} day(s))`);
  // A day on either side of the build day is not judged (see the header).
  if (Math.abs(gap) <= 1) continue;
  const state = retirementState(r.untilIso);
  for (const locale of Object.keys(WORDS)) {
    const W = WORDS[locale];
    const examFile = path.join(OUT, locale, "certifications", g.slug, "index.html");
    const hubFile = path.join(OUT, locale, "certifications", "index.html");
    if (!fs.existsSync(examFile) || !fs.existsSync(hubFile)) continue;
    pageChecks++;
    const exam = textOf(examFile);
    // 2a. The exam page: past wording once passed, never the future wording beside that date.
    if (state === "passed") {
      if (!exam.includes(W.past)) problems.push(`${locale}/certifications/${g.slug}: ${r.until} has passed, the notice should say "${W.past}"`);
      if (locale === "en" && exam.includes(`${W.future} ${r.until}`)) problems.push(`${locale}/certifications/${g.slug}: "${W.future} ${r.until}" is future wording for a past date`);
    } else if (exam.includes(W.past)) {
      problems.push(`${locale}/certifications/${g.slug}: ${r.until} is ahead, the notice must not say "${W.past}"`);
    }
    // 2b. The hub card's badge, by scope and state.
    const hub = textOf(hubFile);
    const expected =
      r.scope === "this-exam" ? `${state === "passed" ? W.retired : W.retiring} ${r.until}` : state === "upcoming" ? `${W.previous} ${r.until}` : null;
    const wrong = [`${W.retiring} ${r.until}`, `${W.retired} ${r.until}`, `${W.previous} ${r.until}`].filter((b) => b !== expected);
    if (expected && !hub.includes(expected)) problems.push(`${locale}/certifications: the ${g.slug} card should read "${expected}"`);
    // A wrong badge can only be told apart when no other guide carries the same date legitimately.
    const sameDate = studyGuides.filter((o) => o.retirement && o.slug !== g.slug && o.retirement.until === r.until);
    if (sameDate.length === 0) {
      for (const w of wrong) if (hub.includes(w)) problems.push(`${locale}/certifications: the ${g.slug} card must not read "${w}"`);
    }
  }
}

if (problems.length) {
  console.error(`${TAG} FAIL: ${problems.length} problem(s) on ${today}:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
const due = dueSoon.length ? ` Due within 30 days: ${dueSoon.join("; ")}; rebuild after the date so the wording turns.` : "";
console.log(`${TAG} OK on ${today}: ${notices} retirement notice(s), every ISO day matches its published wording; ${pageChecks} exam/hub pair(s) read.${due}`);
