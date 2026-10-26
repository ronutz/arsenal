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
//
// ROUND 2 (PRIME 2026-10-25): pages now print the day in the reader's language
// ("14 de novembro de 2026" on pt-BR), formatted from the ISO date by the same
// function the pages use (formatIsoDay in src/lib/retirement.ts). So the checks
// are split: the WORDING AND STATE checks look for the localised day, and a
// separate check confirms that a non-English guide page still quotes the
// vendor's own English wording verbatim (shown as a lang="en" quotation).
//
// THE ANNOUNCED STATUS (PRIME 26/10/2026): an exam the vendor has announced but
// not opened ("Coming Soon") showed "Current", which a reader takes as
// bookable. src/lib/certStatus.ts now derives "announced" from the lifecycle
// record. Before any page is read, this script proves the rule on synthetic
// records (announced alone; announced under a retirement notice, a superseded
// or unknown credential, a beta blueprint; available stays current; announced
// outranks preparing) and on the real FortiOS 8.0 guide, and checks that the
// status has its own label key. Where a build exists, every announced guide's
// page shows the announced words in en and pt-BR and never the current word as
// its status, and the hub's card carries the badge.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { studyGuides } from "../src/content/certifications/study-guides";
import { retirementState, todayIso, formatIsoDay } from "../src/lib/retirement";
// The status rules under test (26/10/2026).
import { guideStatus, STATUS_LABEL_KEY, GUIDE_STATUSES } from "../src/lib/certStatus";
// The guide type, for the synthetic records.
import type { StudyGuide } from "../src/content/certifications/study-guides";

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
// the hub badges. Since Round 2 the date beside them is the localised day (formatIsoDay), not the vendor's wording.
const WORDS: Record<string, { future: string; past: string; retiring: string; retired: string; previous: string }> = {
  en: { future: "can be sat until", past: "a date now past", retiring: "Retiring", retired: "Retired", previous: "Previous version until" },
  "pt-BR": { future: "até", past: "data que já passou", retiring: "Em descontinuação", retired: "Descontinuado", previous: "Versão anterior até" },
};

const today = todayIso();
const problems: string[] = [];
const dueSoon: string[] = [];
let notices = 0;
let pageChecks = 0;

// ---- 0. The announced status, proved on synthetic records and on the real guide (26/10/2026) ----
// A fixed build day, so the synthetic retirement notices fall on a known side of it.
const NOW = new Date("2026-10-26T12:00:00Z");
// A minimal published guide; each case overrides what it tests.
const base: StudyGuide = {
  slug: "synthetic", examCode: "X", examName: "Synthetic", vendor: "fortinet", certification: "synthetic", targetVersion: null,
  blueprintSourceUrl: null, blueprintSourceLabel: null, status: "published", examFacts: null, sections: [],
};
// An active credential with a current blueprint, the availability set by each case.
const lifecycle = (examAvailability: NonNullable<StudyGuide["lifecycle"]>["examAvailability"], extra: Partial<NonNullable<StudyGuide["lifecycle"]>> = {}) =>
  ({ credential: "active", successorSlug: null, examAvailability, blueprint: "current", blueprintId: null, blueprintValidity: null, ...extra }) as const;
// Each case: what it proves, the record, the status it must derive.
const CASES: [string, StudyGuide, string][] = [
  ["announced, nothing else in play", { ...base, lifecycle: lifecycle("announced") }, "announced"],
  ["available stays current", { ...base, lifecycle: lifecycle("available") }, "current"],
  ["no lifecycle record stays current", { ...base }, "current"],
  ["announced outranks preparing", { ...base, status: "preparing", lifecycle: lifecycle("announced") }, "announced"],
  ["a superseded credential outranks announced", { ...base, lifecycle: lifecycle("announced", { credential: "superseded" }) }, "superseded"],
  ["an unknown credential outranks announced", { ...base, lifecycle: lifecycle("announced", { credential: "unknown" }) }, "unknown"],
  ["a beta blueprint outranks announced", { ...base, lifecycle: lifecycle("announced", { blueprint: "beta" }) }, "beta"],
  [
    "a retirement notice still ahead outranks announced",
    { ...base, lifecycle: lifecycle("announced"), retirement: { exam: "X 7.6", until: "December 31, 2026", untilIso: "2026-12-31", scope: "this-exam", replacedBy: null } },
    "transitioning",
  ],
];
// Each case through the real rule.
for (const [what, g, want] of CASES) {
  const got = guideStatus(g, NOW);
  if (got !== want) problems.push(`status rule: ${what}: derived "${got}", expected "${want}"`);
}
// The status is one of the hub's statuses and has its own label key.
if (!GUIDE_STATUSES.includes("announced")) problems.push(`status rule: "announced" is missing from GUIDE_STATUSES (the hub would not count it)`);
if (STATUS_LABEL_KEY.announced !== "statusAnnounced") problems.push(`status rule: "announced" must label as certGuides.statusAnnounced`);
// The real records: every guide whose lifecycle says announced derives "announced" today (never "current").
const announced = studyGuides.filter((g) => g.lifecycle?.examAvailability === "announced");
for (const g of announced) {
  const got = guideStatus(g);
  // Only a retirement notice or a weaker credential may outrank it, and none applies to an announced record today.
  if (got === "current") problems.push(`${g.slug}: lifecycle says announced, but the derived status is "current" (reads as bookable)`);
}
// The FortiOS 8.0 guide that prompted the rule is one of them.
if (!announced.some((g) => g.slug === "fortinet-nse-4-fortios-80-administrator")) problems.push(`fortinet-nse-4-fortios-80-administrator: expected an announced lifecycle (Fortinet's "Coming Soon")`);
// The words each authored locale prints for the status and for "current", from the packs.
const packWords = (loc: string) => (JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "i18n", "messages", `${loc}.json`), "utf8")) as { certGuides: Record<string, string> }).certGuides;
let announcedPages = 0;
for (const loc of ["en", "pt-BR"]) {
  // The status word and the current word in this locale (absent until the pack patch is applied: then nothing to read).
  const words = packWords(loc);
  const said = words.statusAnnounced;
  if (!said) continue;
  for (const g of announced) {
    // The guide page and the hub, when built.
    const examFile = path.join(OUT, loc, "certifications", g.slug, "index.html");
    const hubFile = path.join(OUT, loc, "certifications", "index.html");
    if (!fs.existsSync(examFile) || !fs.existsSync(hubFile)) continue;
    announcedPages++;
    // The guide page's status line names the announced status, not the current one.
    const html = fs.readFileSync(examFile, "utf8");
    const status = html.match(/data-status="([a-z]+)"[^>]*>([^<]*)</);
    if (!status || status[1] !== "announced" || status[2].trim() !== said) problems.push(`${loc}/certifications/${g.slug}: the status should read "${said}" (data-status="announced"), found ${status ? `"${status[2].trim()}" (${status[1]})` : "none"}`);
    // The hub card carries the same badge.
    if (!textOf(hubFile).includes(said)) problems.push(`${loc}/certifications: the ${g.slug} card should carry the "${said}" badge`);
  }
}

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
    // The day as this locale's pages print it, from the ISO date.
    const day = formatIsoDay(r.untilIso, locale);
    // 2c. The localised day is on the exam page, and a non-English page also quotes the vendor's wording verbatim.
    if (!exam.includes(day)) problems.push(`${locale}/certifications/${g.slug}: the notice should print the day as "${day}"`);
    if (locale !== "en" && !exam.includes(r.until)) problems.push(`${locale}/certifications/${g.slug}: the vendor's wording "${r.until}" should be quoted beside the localised day`);
    // 2a. The exam page: past wording once passed, never the future wording beside that date.
    if (state === "passed") {
      if (!exam.includes(W.past)) problems.push(`${locale}/certifications/${g.slug}: ${r.until} has passed, the notice should say "${W.past}"`);
      if (locale === "en" && exam.includes(`${W.future} ${day}`)) problems.push(`${locale}/certifications/${g.slug}: "${W.future} ${day}" is future wording for a past date`);
    } else if (exam.includes(W.past)) {
      problems.push(`${locale}/certifications/${g.slug}: ${r.until} is ahead, the notice must not say "${W.past}"`);
    }
    // 2b. The hub card's badge, by scope and state.
    const hub = textOf(hubFile);
    const expected =
      r.scope === "this-exam" ? `${state === "passed" ? W.retired : W.retiring} ${day}` : state === "upcoming" ? `${W.previous} ${day}` : null;
    const wrong = [`${W.retiring} ${day}`, `${W.retired} ${day}`, `${W.previous} ${day}`].filter((b) => b !== expected);
    if (expected && !hub.includes(expected)) problems.push(`${locale}/certifications: the ${g.slug} card should read "${expected}"`);
    // A wrong badge can only be told apart when no other guide carries the same date legitimately.
    const sameDate = studyGuides.filter((o) => o.retirement && o.slug !== g.slug && o.retirement.untilIso === r.untilIso);
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
console.log(
  `${TAG} OK on ${today}: ${notices} retirement notice(s), every ISO day matches its published wording; ${pageChecks} exam/hub pair(s) read.${due}` +
    ` Announced status: ${CASES.length} rule case(s) hold, ${announced.length} announced guide(s), ${announcedPages} built page pair(s) read.`,
);
