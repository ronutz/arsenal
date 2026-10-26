// ============================================================================
// src/lib/certLocale.ts
// ----------------------------------------------------------------------------
// APPLY A LOCALE OVERLAY TO A STUDY GUIDE (PRIME 26/10/2026). The overlays and
// their rules are in src/content/certifications/localized.ts; this is the one
// place they are applied, so the hub and the guide page cannot disagree about
// which text is translated and which is the English original.
//
// Every value comes back with `english`: true when the text shown is the
// English original on a non-English page, so the page can mark it lang="en"
// (and tag it where the design does). On the English page nothing is ever
// flagged and every text is the record's own, so the English pages render
// exactly as before.
// ============================================================================

import type { Objective, StudyGuide } from "@/content/certifications/study-guides";
import { GUIDE_OVERLAYS, type GuideOverlay, type NoteSegment } from "@/content/certifications/localized";

/** A text as the page should show it, and whether it is the English original on a non-English page. */
export interface LocalText {
  /** The text in the reader's language, or the English original. */
  text: string;
  /** True when `text` is English shown on a non-English page. */
  english: boolean;
}

/** A note as the page should show it: its segments (quotations kept in English), and whether it is all English. */
export interface LocalNote {
  /** Running text and English quotations, in order. */
  parts: readonly NoteSegment[];
  /** True when the whole note is the English original on a non-English page. */
  english: boolean;
}

/** Which disclosure a guide's key points call for on a page in the reader's language. */
export type KeyPointsPresentation = "vendor-verbatim" | "site-notes" | "mixed" | null;

/** The overlay for a guide in a locale, if one was authored. */
export function guideOverlayFor(slug: string, locale: string): GuideOverlay | undefined {
  // Look up the locale's table, then the guide.
  return GUIDE_OVERLAYS[locale]?.[slug];
}

/** A plain string in the reader's language when the overlay has it, else the English flagged for lang="en". */
function pick(en: string, tr: string | undefined, locale: string): LocalText {
  // A translation wins on its own locale; English is never flagged on the English page.
  return tr !== undefined ? { text: tr, english: false } : { text: en, english: locale !== "en" };
}

/** The guide's availability note in the reader's language, or null when the record has none. */
export function localAvailabilityNote(guide: StudyGuide, locale: string): LocalNote | null {
  // No note on the record: nothing to show, whatever an overlay says.
  if (!guide.availabilityNote) return null;
  // The authored translation, if any.
  const tr = guideOverlayFor(guide.slug, locale)?.availabilityNote;
  // No translation: the English note, as one segment, flagged on a non-English page.
  if (tr === undefined) return { parts: [guide.availabilityNote], english: locale !== "en" };
  // A translation: plain text becomes one segment; segmented text keeps its quotations.
  return { parts: typeof tr === "string" ? [tr] : tr, english: false };
}

/** The guide's exam-facts strings in the reader's language; numbers and the duration stay the record's. */
export function localExamFacts(
  guide: StudyGuide,
  locale: string,
): { questions: LocalText; passMark: LocalText; cost: LocalText; note: LocalText | null } | null {
  // No facts on the record: nothing to show.
  const facts = guide.examFacts;
  if (!facts) return null;
  // The overlay's facts, if any.
  const tr = guideOverlayFor(guide.slug, locale)?.examFacts;
  return {
    // Number and kind of items.
    questions: pick(facts.questions, tr?.questions, locale),
    // The pass mark.
    passMark: pick(facts.passMark, tr?.passMark, locale),
    // The fee wording.
    cost: pick(facts.cost, tr?.cost, locale),
    // The one-line note, only when the record has one.
    note: facts.note ? pick(facts.note, tr?.note, locale) : null,
  };
}

/** One objective's key points in the reader's language, or the English list flagged for lang="en". */
export function localKeyPoints(guide: StudyGuide, objective: Objective, locale: string): { items: readonly string[]; english: boolean } {
  // The English list (possibly empty).
  const en = objective.keyPoints ?? [];
  // The overlay's key-point rule for this guide, if any.
  const kp = guideOverlayFor(guide.slug, locale)?.keyPoints;
  // Only site-authored notes are translated; a verbatim vendor list, or an objective kept English, stays English.
  if (kp?.rule === "site-notes" && !kp.keepEnglish?.includes(objective.id)) {
    // The translated list for this objective.
    const tr = kp.byObjective[objective.id];
    // Used only when it aligns with the English one point for point (a stale translation falls back to English).
    if (tr && tr.length === en.length) return { items: tr, english: false };
  }
  // English, flagged on a non-English page.
  return { items: en, english: locale !== "en" };
}

/** Which key-point disclosure a guide's page shows in this locale; null keeps the general one. */
export function keyPointsPresentation(guide: StudyGuide, locale: string): KeyPointsPresentation {
  // The overlay's rule, if any, for this guide in this locale.
  const kp = guideOverlayFor(guide.slug, locale)?.keyPoints;
  // No recorded rule: the general disclosure.
  if (!kp) return null;
  // Verbatim vendor sub-points throughout.
  if (kp.rule === "vendor-verbatim") return "vendor-verbatim";
  // Site notes, with some objectives kept as the vendor's verbatim sub-items.
  return kp.keepEnglish && kp.keepEnglish.length > 0 ? "mixed" : "site-notes";
}

/** The plain text of a note (quotations included as written), for search and metadata. */
export function noteText(note: LocalNote): string {
  // Running text as is, a quotation in the English quotation marks the English record uses.
  return note.parts.map((p) => (typeof p === "string" ? p : `"${p.quoteEn}"`)).join("");
}
