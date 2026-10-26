// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-cert-translation.mts  (prebuild; run with tsx)
// ----------------------------------------------------------------------------
// THE pt-BR CERTIFICATION PROSE STAYS COMPLETE, ALIGNED AND FACT-FAITHFUL
// (PRIME 26/10/2026: "translate all remaining English in the pt-BR certification
// pages"). The translations live in two places: each certification's `ptBr`
// field in study-guides.ts, and the per-vendor guide overlays in
// src/content/certifications/overlays/pt-BR (rules in localized.ts). This guard
// keeps both honest:
//
//   1. COMPLETE. Every English renewal note, requirement note and prerequisite
//      list has its pt-BR; every guide's availability note and exam-facts
//      strings have theirs; every guide with key points declares how they are
//      presented ("vendor-verbatim" or "site-notes"). Guides HELD below (their
//      blueprint is about to be re-read, so their prose may change) are the one
//      exception, and they must carry NO overlay until released.
//   2. ALIGNED. Site-notes key points are keyed by real objective ids and have
//      the English list's count, so a translation can never sit under the wrong
//      point (the page would fall back to English silently otherwise).
//      Overlays name real guides, in their own vendor's file, and translate only
//      fields the English record has.
//   3. FAITHFUL. A translation states the same numbers as its English: the
//      digits of each pair are compared as a multiset, after reading a pt-BR
//      decimal comma as a point and a written-out Brazilian date ("22 de julho
//      de 2026") as its ISO day. And a pt-BR percentage uses the decimal comma
//      ("73,33%", never "73.33%").
//
// The register (forbidden renderings such as "tempo limite", "cabeçalho") is
// checked by scripts/check-ptbr-register.mjs, which reads the same text.
// ============================================================================

// The records, read from the registry the pages read.
import { certifications, studyGuides, type StudyGuide } from "../src/content/certifications/study-guides";
// The overlays by vendor file, so a guide filed under another vendor is caught.
import { PT_BR_CHECKPOINT } from "../src/content/certifications/overlays/pt-BR/checkpoint";
import { PT_BR_F5 } from "../src/content/certifications/overlays/pt-BR/f5";
import { PT_BR_FORTINET } from "../src/content/certifications/overlays/pt-BR/fortinet";
import { PT_BR_NETSKOPE } from "../src/content/certifications/overlays/pt-BR/netskope";
import { PT_BR_PING } from "../src/content/certifications/overlays/pt-BR/ping";
// The overlay types.
import type { GuideOverlay, NoteText } from "../src/content/certifications/localized";

// The report's prefix.
const TAG = "[check-cert-translation]";
// Guides held out of translation. May only shrink. The nine F5 guides held on 26/10/2026 while their blueprint PDFs
// were pending were released the same day, once the F5 blueprint batch had compared them verbatim (ANVIL, f5-bp).
const HELD = new Set<string>([
  // (none held)
]);
// The vendor files and the vendor each one must hold.
const FILES: [string, Record<string, GuideOverlay>][] = [
  ["checkpoint", PT_BR_CHECKPOINT],
  ["f5", PT_BR_F5],
  ["fortinet", PT_BR_FORTINET],
  ["netskope", PT_BR_NETSKOPE],
  ["ping", PT_BR_PING],
];
// Every failure, one line each.
const failures: string[] = [];
// Counts for the success line.
const counts = { certNotes: 0, prereqLists: 0, availability: 0, facts: 0, keyPointsTranslated: 0, keyPointsVerbatim: 0, guidesVerbatim: 0, guidesNotes: 0 };

// ---- 3. The numbers a text states ----
// Brazilian month names, for written-out dates.
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
// English month names, for "31 July 2026" and "November 14, 2026".
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The numbers in a text, as a sorted list of normalised strings (dates as their ISO parts, decimals with a point). */
function numbersOf(text: string, lang: "en" | "pt"): string[] {
  // Written-out dates first, turned into ISO days so both sides agree on their parts.
  let t = text;
  if (lang === "pt") {
    // "22 de julho de 2026" or "1º de maio de 2026".
    t = t.replace(/(\d{1,2})º? de (\p{L}+) de (\d{4})/gu, (m, d, mes, y) => {
      // The month's number, or the text untouched when it is not a month.
      const i = MESES.indexOf(String(mes).toLowerCase());
      return i < 0 ? m : `${y}-${String(i + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    });
  } else {
    // "31 July 2026".
    t = t.replace(/(\d{1,2}) ([A-Z][a-z]+) (\d{4})/g, (m, d, mon, y) => {
      // The month's number, or the text untouched.
      const i = MONTHS.indexOf(mon);
      return i < 0 ? m : `${y}-${String(i + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    });
    // "November 14, 2026".
    t = t.replace(/([A-Z][a-z]+) (\d{1,2}), (\d{4})/g, (m, mon, d, y) => {
      // The month's number, or the text untouched.
      const i = MONTHS.indexOf(mon);
      return i < 0 ? m : `${y}-${String(i + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    });
  }
  // Each number: a pt-BR decimal comma read as a point; leading zeros dropped so "07" equals "7".
  const out: string[] = [];
  for (const m of t.matchAll(/\d+(?:[.,]\d+)*/g)) {
    // In pt-BR a comma between digits is the decimal mark; in English it separates thousands or list items.
    let n = m[0];
    if (lang === "pt") n = n.replace(",", ".");
    else n = /^\d{1,3}(,\d{3})+$/.test(n) ? n.replace(/,/g, "") : n.split(",")[0];
    // Parts split on the point compared without leading zeros ("2026-07-05" -> "2026", "7", "5").
    out.push(...n.split(".").map((p) => String(Number(p))));
  }
  // Sorted, so the order of the sentence does not matter.
  return out.sort();
}

/** Fail when a translation states different numbers from its English, or a percentage with a decimal point. */
function faithful(where: string, en: string, pt: string): void {
  // Same numbers on both sides.
  const a = numbersOf(en, "en").join(" ");
  const b = numbersOf(pt, "pt").join(" ");
  if (a !== b) failures.push(`  - ${where}: numbers differ (en: ${a || "none"}; pt-BR: ${b || "none"}): "${pt.slice(0, 90)}"`);
  // A Brazilian percentage takes the decimal comma.
  if (/\d\.\d+\s?%/.test(pt)) failures.push(`  - ${where}: a pt-BR percentage must use the decimal comma: "${pt.slice(0, 90)}"`);
}

/** A NoteText's translated running text, without the English quotations (those are compared verbatim). */
function ptRunning(n: NoteText): string {
  // Plain text, or the running segments joined.
  return typeof n === "string" ? n : n.map((p) => (typeof p === "string" ? p : "")).join(" ");
}

// ---- 1. Certifications: their ptBr notes ----
for (const c of certifications) {
  // The pt-BR block, if any.
  const pt = c.ptBr ?? {};
  // Each note the English record has.
  for (const f of ["renewalNote", "requirementNote"] as const) {
    // Nothing to translate.
    const en = c[f];
    if (!en) continue;
    // Missing.
    const tr = pt[f];
    if (!tr) failures.push(`  - certification ${c.key}: ${f} has no pt-BR`);
    // Present: same numbers.
    else (counts.certNotes++, faithful(`certification ${c.key} ${f}`, en, tr));
  }
  // The prerequisite list, item by item.
  const pre = c.prerequisites ?? [];
  if (pre.length > 0) {
    // The pt-BR list must exist and align.
    const tr = pt.prerequisites;
    if (!tr) failures.push(`  - certification ${c.key}: prerequisites have no pt-BR`);
    else if (tr.length !== pre.length) failures.push(`  - certification ${c.key}: ${tr.length} pt-BR prerequisites, English has ${pre.length}`);
    else (counts.prereqLists++, pre.forEach((p, i) => faithful(`certification ${c.key} prerequisite ${i + 1}`, p, tr[i])));
  }
}

// ---- 2. Guide overlays: real guides, in their vendor's file, translating only what the record has ----
// Every guide by slug.
const bySlug = new Map<string, StudyGuide>(studyGuides.map((g) => [g.slug, g]));
// The overlay of each guide, once.
const overlayOf = new Map<string, GuideOverlay>();
for (const [vendor, map] of FILES) {
  // Each entry of the file.
  for (const [slug, o] of Object.entries(map)) {
    // A slug the registry does not know.
    const g = bySlug.get(slug);
    if (!g) {
      failures.push(`  - overlays/pt-BR/${vendor}.ts: "${slug}" is not a guide`);
      continue;
    }
    // Filed under another vendor.
    if (g.vendor !== vendor) failures.push(`  - overlays/pt-BR/${vendor}.ts: "${slug}" belongs to ${g.vendor}`);
    // A held guide must stay untouched until released.
    if (HELD.has(slug)) failures.push(`  - overlays/pt-BR/${vendor}.ts: "${slug}" is held (blueprint pending); remove its overlay or release it from HELD`);
    // Kept for the per-guide checks.
    overlayOf.set(slug, o);
    // An availability note with nothing to translate.
    if (o.availabilityNote !== undefined && !g.availabilityNote) failures.push(`  - ${slug}: overlay translates an availability note the record does not have`);
    // Exam-facts fields the record does not have.
    for (const k of Object.keys(o.examFacts ?? {}) as (keyof NonNullable<GuideOverlay["examFacts"]>)[]) {
      if (!g.examFacts || !g.examFacts[k]) failures.push(`  - ${slug}: overlay translates examFacts.${k}, which the record does not have`);
    }
  }
}

// ---- 1 and 2 for every guide: completeness, alignment, numbers ----
for (const g of studyGuides) {
  // Held guides are skipped (and must have no overlay, checked above).
  if (HELD.has(g.slug)) continue;
  // The guide's overlay, if any.
  const o = overlayOf.get(g.slug);
  // The availability note.
  if (g.availabilityNote) {
    if (o?.availabilityNote === undefined) failures.push(`  - ${g.slug}: availability note has no pt-BR`);
    else {
      // Counted, numbers compared on the running text against the English minus its quotations.
      counts.availability++;
      const quotes = typeof o.availabilityNote === "string" ? [] : o.availabilityNote.filter((p): p is { quoteEn: string } => typeof p !== "string");
      // A quotation must appear verbatim in the English note.
      for (const q of quotes) if (!g.availabilityNote.includes(q.quoteEn)) failures.push(`  - ${g.slug}: quotation not found verbatim in the English note: "${q.quoteEn.slice(0, 60)}"`);
      // The English with its quotations removed, against the translated running text.
      const enRunning = quotes.reduce((t, q) => t.replace(q.quoteEn, ""), g.availabilityNote);
      faithful(`${g.slug} availabilityNote`, enRunning, ptRunning(o.availabilityNote));
    }
  }
  // The exam-facts strings.
  if (g.examFacts) {
    for (const k of ["questions", "passMark", "cost", "note"] as const) {
      // Only fields the record has.
      const en = g.examFacts[k];
      if (!en) continue;
      // Missing, or compared.
      const tr = o?.examFacts?.[k];
      if (tr === undefined) failures.push(`  - ${g.slug}: examFacts.${k} has no pt-BR`);
      else (counts.facts++, faithful(`${g.slug} examFacts.${k}`, en, tr));
    }
  }
  // The key points.
  const withPoints = g.sections.flatMap((s) => s.objectives).filter((ob) => (ob.keyPoints ?? []).length > 0);
  if (withPoints.length === 0) {
    // A rule on a guide without key points says nothing.
    if (o?.keyPoints) failures.push(`  - ${g.slug}: declares a key-point rule but has no key points`);
    continue;
  }
  // A guide with key points must say how they are presented.
  const kp = o?.keyPoints;
  if (!kp) {
    failures.push(`  - ${g.slug}: has key points but no rule ("vendor-verbatim" or "site-notes") in its pt-BR overlay`);
    continue;
  }
  // Verbatim vendor sub-points: nothing to align.
  if (kp.rule === "vendor-verbatim") {
    counts.guidesVerbatim++;
    counts.keyPointsVerbatim += withPoints.reduce((n, ob) => n + ob.keyPoints!.length, 0);
    continue;
  }
  // Site notes: every objective translated or kept, with the same count; nothing extra.
  counts.guidesNotes++;
  const ids = new Set(withPoints.map((ob) => ob.id));
  for (const id of kp.keepEnglish ?? []) if (!ids.has(id)) failures.push(`  - ${g.slug}: keepEnglish names ${id}, which has no key points`);
  for (const id of Object.keys(kp.byObjective)) if (!ids.has(id)) failures.push(`  - ${g.slug}: byObjective names ${id}, which has no key points`);
  for (const ob of withPoints) {
    // Kept English on purpose: must not be translated as well.
    if (kp.keepEnglish?.includes(ob.id)) {
      if (kp.byObjective[ob.id]) failures.push(`  - ${g.slug} ${ob.id}: kept English but also translated`);
      counts.keyPointsVerbatim += ob.keyPoints!.length;
      continue;
    }
    // The translated list.
    const tr = kp.byObjective[ob.id];
    if (!tr) failures.push(`  - ${g.slug} ${ob.id}: key points have no pt-BR`);
    else if (tr.length !== ob.keyPoints!.length) failures.push(`  - ${g.slug} ${ob.id}: ${tr.length} pt-BR key points, English has ${ob.keyPoints!.length}`);
    else (counts.keyPointsTranslated += tr.length, ob.keyPoints!.forEach((en, i) => faithful(`${g.slug} ${ob.id} key point ${i + 1}`, en, tr[i])));
  }
}

// Any failure stops the build, with every place listed (the first eighty).
if (failures.length) {
  console.error(`\n${TAG} FAIL: ${failures.length} problem(s) in the pt-BR certification prose:\n`);
  console.error(failures.slice(0, 80).join("\n"));
  if (failures.length > 80) console.error(`\n  ...and ${failures.length - 80} more.`);
  console.error(
    `\n  Every English note has its pt-BR (ptBr on the certification, the vendor overlay for a guide), key points align ` +
      `with the English by objective and count, and a translation states the same numbers as its English. ` +
      `Rules: src/content/certifications/localized.ts.\n`,
  );
  process.exit(1); // the build stops here
}
// The success line.
console.log(
  `${TAG} OK: ${counts.certNotes} certification note(s) and ${counts.prereqLists} prerequisite list(s), ` +
    `${counts.availability} availability note(s), ${counts.facts} exam-facts string(s) translated; key points: ` +
    `${counts.keyPointsTranslated} translated on ${counts.guidesNotes} guide(s) of site notes, ${counts.keyPointsVerbatim} ` +
    `kept as the vendor's verbatim English (${counts.guidesVerbatim} guide(s) plus objectives kept on purpose); ` +
    `numbers match their English; ${HELD.size} guide(s) held. Since 26/10/2026.`,
);
