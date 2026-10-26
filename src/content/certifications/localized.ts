// ============================================================================
// src/content/certifications/localized.ts
// ----------------------------------------------------------------------------
// LOCALE OVERLAYS FOR CERTIFICATION STUDY GUIDES (PRIME 26/10/2026: translate
// the English that remained on the pt-BR certification pages).
//
// A study guide record (study-guides.ts) is authored in English. Its official
// identity (exam name and code, objective text, section titles, source titles)
// stays English everywhere. What a reader needs in their own language is the
// prose around it: the availability note, the exam-facts strings (format, pass
// mark, fee wording, the one-line note) and, where they are this site's own
// study notes, the key points under each objective. Those live HERE, by locale
// and by vendor, the way the Industry overlay works (src/content/vendors/
// localized.ts): an overlay replaces only the prose it supplies, and every
// fact-bearing field stays in the single English record.
//
// WHY AN OVERLAY AND NOT A FIELD ON THE RECORD. A certification already carries
// a `ptBr` field for its three short notes, and those stay there. A guide's
// translatable prose is far larger (about 1,600 key points for the Ping guides
// alone), and inlined beside 21,000 lines of verbatim blueprint text it would
// bury the record a re-verification batch has to read. One file per vendor
// keeps each file reviewable and lets a vendor's records be re-checked without
// touching another's.
//
// RULES
//   - An overlay is a TRANSLATION. It adds no fact the English record does not
//     state; a correction lands in the English record first and is mirrored here
//     in the same change. Numbers follow the pt-BR format (decimal comma).
//   - Key points are overlaid only where they are the site's own study notes.
//     Where they are the vendor's verbatim blueprint sub-points (the Fortinet
//     "Details" lists, the F5 blueprint sub-items), they are quoted, so they stay
//     English and render with lang="en"; the overlay records that rule for the
//     guide so the page can say which it is.
//   - Key points align by objective id and by count: a list whose length differs
//     from the English one falls back to English (marked lang="en"), so a stale
//     translation can never attach to the wrong point. The guard
//     scripts/check-cert-translation.mts reports any such mismatch.
//   - A quotation the English presents as the vendor's own words stays English
//     inside the translation, as a { quoteEn } segment rendered <q lang="en">.
//   - A guide with no overlay renders as before: English, marked lang="en" on a
//     non-English page.
// ============================================================================

// The pt-BR overlays, merged from one file per vendor.
import { PT_BR_GUIDE_OVERLAYS } from "@/content/certifications/overlays/pt-BR";

/** One piece of a localised note: running text, or a quotation kept in the vendor's English. */
export type NoteSegment = string | { readonly quoteEn: string };

/** A localised note: plain text, or text with one or more English quotations inside it. */
export type NoteText = string | readonly NoteSegment[];

/** How a guide's key points are presented, decided per guide and recorded in its overlay. */
export type KeyPointsOverlay =
  // The key points are the vendor's own blueprint sub-points, quoted: they stay English (lang="en").
  | { readonly rule: "vendor-verbatim" }
  // The key points are this site's study notes: translated, objective by objective, in the English order.
  | {
      readonly rule: "site-notes";
      /** Objective id -> the translated key points, same count and order as the English list. */
      readonly byObjective: Readonly<Record<string, readonly string[]>>;
      /** Objectives whose key points are verbatim vendor sub-items inside an otherwise site-authored guide. */
      readonly keepEnglish?: readonly string[];
    };

/** The prose of one study guide in one locale. Facts are never overlaid. */
export interface GuideOverlay {
  /** The availability note (StudyGuide.availabilityNote). */
  availabilityNote?: NoteText;
  /** The exam-facts strings; minutes, durationPolicy and every number stay the English record's. */
  examFacts?: {
    /** Number and kind of items, e.g. "70 questões de múltipla escolha". */
    questions?: string;
    /** The pass mark as written for the reader, e.g. "73,33%". */
    passMark?: string;
    /** The fee wording; amounts and currencies unchanged. */
    cost?: string;
    /** The one-line format and credential note. */
    note?: string;
  };
  /** How the key points are presented, and their translation when they are site-authored. */
  keyPoints?: KeyPointsOverlay;
}

/** Guide overlays by locale, then by guide slug. A locale without an entry renders the English records. */
export const GUIDE_OVERLAYS: Readonly<Record<string, Readonly<Record<string, GuideOverlay>>>> = {
  // Brazilian Portuguese, the one locale authored natively besides English.
  "pt-BR": PT_BR_GUIDE_OVERLAYS,
};
