// ============================================================================
// src/lib/vendorLocale.ts
// ----------------------------------------------------------------------------
// APPLY A LOCALE OVERLAY TO AN INDUSTRY RECORD (Round 1, ARC-02/CC06,
// 2026-10-25). The overlays themselves, and the rules they follow, are in
// src/content/vendors/localized.ts. This is the one place they are applied,
// so the rule "an overlay replaces prose, never facts" is enforced by code:
// years, ending years, founded, sources, tags, relationships and URLs are
// always the English record's.
// ============================================================================

import type { PartnerVendor } from "@/content/vendors/partners";
import type { VendorProfile } from "@/content/vendors/profile-types";
import { VENDOR_OVERLAYS, type PartnerVendorOverlay } from "@/content/vendors/localized";

/** The overlay for a record in a locale, if one was authored. */
export function overlayFor(slug: string, locale: string): PartnerVendorOverlay | undefined {
  // Look up the locale's table, then the record.
  return VENDOR_OVERLAYS[locale]?.[slug];
}

/**
 * The record with its prose in the reader's locale where an overlay exists.
 *
 * Returns the SAME object when there is nothing to overlay, so English and
 * every locale without an overlay render exactly as before (the site's
 * per-key English fallback; nothing is relabelled as translated).
 */
export function localizePartnerVendor(v: PartnerVendor, locale: string): PartnerVendor {
  // No authored prose for this record in this locale: unchanged.
  const o = overlayFor(v.slug, locale);
  if (!o) return v;
  // Copy, then replace only the prose fields the overlay supplies.
  return {
    ...v,
    // Card and page title.
    name: o.name ?? v.name,
    // One-line positioning.
    tagline: o.tagline ?? v.tagline,
    // Intro paragraph.
    intro: o.intro ?? v.intro,
    // Body paragraphs, replaced whole.
    body: o.body ?? v.body,
    // Accuracy note aside.
    note: o.note ?? v.note,
    // The ending keeps its year from the English record; only the note changes.
    ended: v.ended ? { ...v.ended, note: o.endedNote ?? v.ended.note } : v.ended,
    // The successor keeps its URL and the parent its slug and year (and its name, unless the owner is a state); only prose changes.
    official: localizeOfficial(v.official, o),
    // The lineage card keeps its members; only the note changes (PRIME ruling 2, 26/10/2026).
    lineage: v.lineage && o.lineageNote ? { ...v.lineage, note: o.lineageNote } : v.lineage,
    // Acquisitions: prose by position, facts from the English entry.
    acquisitions: localizeAcquisitions(v.acquisitions, o.acquisitions),
  };
}

/**
 * The record's `official` block with its two prose fields overlaid: the
 * successor's label and the parent's note (PRIME ruling 1, 26/10/2026). URLs,
 * the parent's name, slug and year are facts and stay the English record's, except a
 * state owner's name, given through the overlay's parentName (26/10/2026).
 * Returns the same object when the overlay carries neither, as before.
 */
function localizeOfficial(
  official: PartnerVendor["official"],
  o: PartnerVendorOverlay,
): PartnerVendor["official"] {
  // No block, or nothing to change in it: unchanged.
  if (!official) return official;
  // The successor label applies only where the record has a successor.
  const successor = official.successor && o.successorLabel ? { ...official.successor, label: o.successorLabel } : official.successor;
  // The parent note applies only where the record has a parent with a note to replace.
  const noted = official.parent?.note && o.parentNote ? { ...official.parent, note: o.parentNote } : official.parent;
  // A state owner's name is the one parent name translated (endings apply, 26/10/2026); every other name stays a fact.
  const parent = noted && noted.kind === "state" && o.parentName ? { ...noted, name: o.parentName } : noted;
  // Same references back means nothing was overlaid: keep the original object.
  if (successor === official.successor && parent === official.parent) return official;
  // A copy carrying the overlaid prose.
  return { ...official, successor, parent };
}

/**
 * Merge translated acquisition prose into the English list by position.
 *
 * Only `what`, `became`, `sourceNote` and the sub-entries' `what` can change.
 * When the overlay's length differs from the English list's (an acquisition was
 * added or removed after translation), the English list is returned whole, so a
 * stale translation can never attach to the wrong deal; the translation report
 * (scripts/report-industry-translation.mts) lists the mismatch.
 */
function localizeAcquisitions(
  en: PartnerVendor["acquisitions"],
  tr: PartnerVendorOverlay["acquisitions"],
): PartnerVendor["acquisitions"] {
  // Nothing to merge, or nothing to merge into.
  if (!en || !tr) return en;
  // Misaligned: refuse rather than guess.
  if (tr.length !== en.length) return en;
  // Position by position, prose only.
  return en.map((a, i) => ({
    ...a,
    // The deal's description.
    what: tr[i]?.what ?? a.what,
    // What it became.
    became: tr[i]?.became ?? a.became,
    // Its provenance note.
    sourceNote: tr[i]?.sourceNote ?? a.sourceNote,
    // Nested deals, aligned the same way, or English when misaligned.
    subAcquisitions:
      a.subAcquisitions && tr[i]?.subAcquisitions && tr[i]!.subAcquisitions!.length === a.subAcquisitions.length
        ? a.subAcquisitions.map((sub, j) => ({ ...sub, what: tr[i]!.subAcquisitions![j]?.what ?? sub.what }))
        : a.subAcquisitions,
  }));
}

/** The profile in the reader's locale where a complete translation exists, else the English one. */
export function localizeProfile(
  slug: string,
  profile: VendorProfile | undefined,
  locale: string,
): VendorProfile | undefined {
  // Use the translated profile whole, or the English one; never a mix.
  return overlayFor(slug, locale)?.profile ?? profile;
}
