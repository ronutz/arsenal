// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-training-catalogue.mts  (prebuild; run with tsx)
// ----------------------------------------------------------------------------
// THE COURSE RECORDS, HELD TO THEIR OWN CONTRACT (Round 1, 2026-10-25; audit
// CC06, CC07, CC08). src/content/training/courses.ts now carries, per course,
// prerequisites, certification relevance, the next step and the official
// outline source with its read date and content outcome. Each of those is a
// promise the course page makes, so this guard fails the build when one breaks:
//
//   1. INTEGRITY (CC07). Every course reference (prerequisite, next course)
//      resolves to a course of the catalogue and never to the course itself;
//      every study-guide slug exists in study-guides.ts; slugs are unique.
//   2. HONEST CERTIFICATION (CC07-A/B). "not-exam-specific" names no credential
//      and links no guide; the other two kinds name the credential.
//   3. EVIDENCE (CC08, S2). A "verified" read names its URL and the vendor's
//      title, and its day IS the course's last successful verification; any
//      other outcome may not carry a last-verified day equal to or later than
//      the failed read (a login page never refreshes a date, CC08-B/E). Dates
//      are real calendar days and never in the future.
//   4. LANGUAGE (CC06-C). Every Localized field has both authored locales; the
//      prose fields (summary, description, notes, bases, findings, prerequisite
//      texts) must not be the English copied into pt-BR, and each failure names
//      its content id. No English string carries an em dash (D-55).
//
// Counts are printed from the records, never typed (CC07-F).
// ============================================================================

import { PLATFORMS, resolveCourseRef, type Localized } from "../src/content/training/courses";
import { getStudyGuide } from "../src/content/certifications/study-guides";

// The tag every line of this guard's output starts with.
const TAG = "[check-training-catalogue]";
// Every problem found, with the content id it belongs to.
const errors: string[] = [];
// Today as a UTC calendar day, the upper bound for every recorded date.
const today = new Date().toISOString().slice(0, 10);

/** True when s is a real YYYY-MM-DD calendar day. */
function isDay(s: string): boolean {
  // The shape first.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  // Then the calendar: a parsed date must print back as the same day.
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Checks one Localized value; prose values must differ between the locales. */
function checkText(id: string, v: Localized | undefined, prose: boolean): void {
  // A missing optional value is the caller's business.
  if (!v) return;
  // Both locales present and non-empty.
  if (!v.en?.trim()) errors.push(`${id}: empty English`);
  if (!v["pt-BR"]?.trim()) errors.push(`${id}: empty pt-BR (decision-critical field without Portuguese)`);
  // Prose may not be the English copied over (official names alone may coincide, which is why toc items are exempt).
  if (prose && v.en.trim() === v["pt-BR"].trim()) errors.push(`${id}: pt-BR is the English text (untranslated)`);
  // D-55: no em dash in English copy.
  if (v.en.includes("—")) errors.push(`${id}: em dash in English`);
}

// Running totals for the report.
let courses = 0;
let verified = 0;
let guideLinks = 0;
let refs = 0;

for (const p of PLATFORMS) {
  // Platform prose.
  checkText(`${p.slug}.tagline`, p.tagline, true);
  checkText(`${p.slug}.intro`, p.intro, true);
  // Course slugs unique within the platform.
  const seen = new Set<string>();
  for (const c of p.courses) {
    courses++;
    // The content id every message about this course carries.
    const id = `${p.slug}/${c.slug}`;
    if (seen.has(c.slug)) errors.push(`${id}: duplicate slug`);
    seen.add(c.slug);
    // Duration: a positive whole number of days.
    if (!Number.isInteger(c.days) || c.days <= 0) errors.push(`${id}: days must be a positive integer, got ${c.days}`);
    // Language of the authored fields.
    checkText(`${id}.altName`, c.altName, false);
    checkText(`${id}.summary`, c.summary, true);
    checkText(`${id}.description`, c.description, true);
    checkText(`${id}.outlineNote`, c.outlineNote, true);
    c.toc.forEach((item, i) => checkText(`${id}.toc[${i}]`, item, false));
    if (c.toc.length === 0) errors.push(`${id}: empty outline summary`);

    // ---- Prerequisites ------------------------------------------------------------------------------------------------
    if (c.prerequisites.length === 0) errors.push(`${id}: no prerequisite entry (use { unknown: true } when none could be read)`);
    c.prerequisites.forEach((pre, i) => {
      // A course reference must resolve and must not be the course itself.
      if ("course" in pre) {
        refs++;
        if (!resolveCourseRef(pre.course)) errors.push(`${id}.prerequisites[${i}]: unresolved course ${pre.course.platform}/${pre.course.course}`);
        if (pre.course.platform === p.slug && pre.course.course === c.slug) errors.push(`${id}.prerequisites[${i}]: the course is its own prerequisite`);
      } else if ("text" in pre) {
        // A vendor-stated text, in both languages.
        checkText(`${id}.prerequisites[${i}]`, pre.text, true);
      }
    });

    // ---- Certification relevance --------------------------------------------------------------------------------------
    const cert = c.certification;
    checkText(`${id}.certification.basis`, cert.basis, true);
    if (cert.kind === "not-exam-specific") {
      // A deliberate "not exam-specific" names nothing it could be mistaken for.
      if (cert.credential !== null) errors.push(`${id}: not-exam-specific but names a credential`);
      if (cert.guides.length) errors.push(`${id}: not-exam-specific but links study guides`);
    } else if (!cert.credential?.trim()) {
      errors.push(`${id}: ${cert.kind} without the credential's name`);
    }
    for (const slug of cert.guides) {
      guideLinks++;
      // Each guide must exist on the site.
      if (!getStudyGuide(slug)) errors.push(`${id}: study guide "${slug}" does not exist`);
    }

    // ---- Next step ----------------------------------------------------------------------------------------------------
    const next = c.next;
    checkText(`${id}.next.basis`, next.basis, true);
    if (next.kind === "courses") {
      if (next.courses.length === 0) errors.push(`${id}: next.kind "courses" with no course`);
      for (const r of next.courses) {
        refs++;
        if (!resolveCourseRef(r)) errors.push(`${id}: next course ${r.platform}/${r.course} does not resolve`);
        if (r.platform === p.slug && r.course === c.slug) errors.push(`${id}: the course is its own next course`);
      }
    } else if (next.kind === "external") {
      // The vendor's follow-on: named and on an https page.
      if (!next.name.trim()) errors.push(`${id}: external next course without a name`);
      if (!/^https:\/\//.test(next.url)) errors.push(`${id}: external next course without an https URL`);
    }

    // ---- Evidence (S2) -------------------------------------------------------------------------------------------------
    const s = c.source;
    checkText(`${id}.source.finding`, s.finding, true);
    if (!isDay(s.checkedOn)) errors.push(`${id}: source.checkedOn "${s.checkedOn}" is not a calendar day`);
    else if (s.checkedOn > today) errors.push(`${id}: source.checkedOn ${s.checkedOn} is in the future`);
    if (s.url !== null && !/^https:\/\//.test(s.url)) errors.push(`${id}: source.url is not https`);
    if (s.outcome === "verified") {
      verified++;
      // A verification names what was read...
      if (!s.url || !s.title) errors.push(`${id}: verified without the source URL and the vendor's title`);
      // ...and is, by definition, the latest successful verification.
      if (c.curriculumChecked !== s.checkedOn) errors.push(`${id}: verified on ${s.checkedOn} but curriculumChecked is ${c.curriculumChecked}`);
    } else if (c.curriculumChecked !== null) {
      // A failed read keeps an OLDER confirmed date at most; it never manufactures one.
      if (!isDay(c.curriculumChecked)) errors.push(`${id}: curriculumChecked "${c.curriculumChecked}" is not a calendar day`);
      else if (c.curriculumChecked >= s.checkedOn) errors.push(`${id}: ${s.outcome} on ${s.checkedOn} yet curriculumChecked ${c.curriculumChecked} is not earlier`);
    }
  }
}

if (errors.length) {
  // Fail with every problem, each naming its content id.
  console.error(`${TAG} FAIL: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
// The counts, derived from the records.
console.log(`${TAG} OK: ${courses} courses on ${PLATFORMS.length} platforms (${PLATFORMS.map((p) => `${p.name} ${p.courses.length}`).join(", ")}); ${verified} with a verified vendor source, ${courses - verified} recorded as not verified; ${refs} course references and ${guideLinks} study-guide links resolve; every authored field has en and pt-BR.`);
