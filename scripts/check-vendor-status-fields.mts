// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-vendor-status-fields.mts
// ----------------------------------------------------------------------------
// THE TWO STATUS FIELDS PRIME ADDED ON 26/10/2026 01:30 MUST BE WELL FORMED.
//
// Ruling 1 gave a subsidiary that still trades under its own brand an
// `official.parent` (rendered "present, part of HPE (since 2025)"); ruling 2
// gave a card that tells several companies or a protocol a `lineage` (rendered
// "a lineage, not a single company: no single status"). Both feed
// lifecycleOf() in src/content/vendors/partners.ts, so a malformed value would
// print a false status on the card, the tag lists and the company page at once.
//
// What this guard refuses, and why:
//
//   PARENT
//   - a name that is empty, padded, carries an em dash, or is named by no
//     citation LABEL on the record. Labels, not sourceNotes, for the reason
//     check-vendor-founded-sources records (2026-10-02): a note often names a
//     fact in order to doubt it, so a note cannot be the citation.
//   - a slug that resolves to no record, or to the record itself (the page
//     would link to a 404, or to itself as its own owner).
//   - a `since` that is not an integer, lies in the future, predates the
//     record's own founding, or is named by no citation label.
//   - a parent on a record WITHOUT `official.url`: a parent is a fact about a
//     company that is trading, and must never stand in for the evidence that
//     it is (lifecycleOf() would ignore it, so it would also be dead data).
//   - a parent on a record that has ended, is defunct, or is a lineage card.
//   - unknown keys (a typo such as `sice` would silently drop the year).
//   - a `kind` other than "company", "fund" or "state" (ANVIL decision 2,
//     26/10/2026: a fund owner reads "owned by", a company "part of"; the
//     endings apply of the same day added "state", read "owned by the French
//     State"; any other value would fall through parentStatusKey() to the
//     company wording unseen).
//
//   LINEAGE
//   - an empty note or one carrying an em dash.
//   - members that do not resolve, repeat, or name the card itself.
//   - a lineage card with `official.url` (a card with one own site is a company
//     card), or with an ending (lifecycleOf() would never reach the lineage).
//   - unknown keys.
//
//   OVERLAYS
//   - a translated `parentNote` or `lineageNote` with nothing in the English
//     record to translate (an orphan that would never render).
//   - a pt-BR overlay MISSING the translation of a parent note or a lineage
//     note the English record carries, so a Portuguese page cannot show an
//     English sentence under a Portuguese status line.
//   - a `parentName` on an owner that is not a state (a company's or fund's
//     name is a fact and is never translated), or one that is empty; and, for
//     a state owner, a pt-BR overlay without `parentName`, or one that does
//     not begin with "Estado ", the noun the pt-BR message "pertence ao
//     {parent}" agrees with (endings apply, 26/10/2026).
//
// It also asserts that lifecycleOf() turns every parent into an active state
// carrying it and every lineage into the lineage state, so the renderer and
// the data cannot drift apart.
//
// Read-only. Exit 1 on any failure. Usage: npx tsx scripts/check-vendor-status-fields.mts
// ============================================================================

// The records, the type of a record, and the single lifecycle decision.
import { partnerVendors, lifecycleOf, type PartnerVendor } from "../src/content/vendors/partners";
// The locale overlays, keyed by locale then slug.
import { VENDOR_OVERLAYS } from "../src/content/vendors/localized";

// ---- constants -----------------------------------------------------------------
// The em dash, forbidden in English copy (house rule) and therefore in these fields.
const EM_DASH = "—";
// This year, the latest a `since` may name (an ownership cannot begin in the future).
const THIS_YEAR = new Date().getFullYear();
// The keys a parent may carry; anything else is a typo or an undocumented field.
const PARENT_KEYS = new Set(["name", "slug", "since", "kind", "note"]);
// The owner kinds parentStatusKey() words (omitted means "company").
const PARENT_KINDS = new Set(["company", "fund", "state"]);
// The noun a pt-BR state name must begin with, so that "pertence ao" agrees (endings apply, 26/10/2026).
const PT_STATE_NOUN = "Estado ";
// The keys a lineage may carry.
const LINEAGE_KEYS = new Set(["note", "members"]);
// The locale whose translations must be complete (the only authored one besides English).
const REQUIRED_LOCALE = "pt-BR";

// ---- state -----------------------------------------------------------------------
// Every failure, as one readable line each.
const errors: string[] = [];
// Every slug, for resolving parent and member references.
const slugs = new Set(partnerVendors.map((v) => v.slug));
// Counters for the summary line.
let parents = 0;
// Lineage cards seen.
let lineages = 0;
// Parents that are investment funds (kind "fund"), a subset of `parents`.
let funds = 0;
// Parents that are states (kind "state"), a subset of `parents`.
let states = 0;

/** All citation LABELS on a record, joined, for "is this named by a source" tests. */
function labelsOf(v: PartnerVendor): string {
  // Labels only (see the header for why sourceNotes do not count).
  return (v.sources ?? []).map((s) => s.label).join(" \n ");
}

/** Keys of an object that are not in the allowed set. */
function unknownKeys(o: object, allowed: Set<string>): string[] {
  // Own enumerable keys outside the vocabulary.
  return Object.keys(o).filter((k) => !allowed.has(k));
}

// ---- the records -------------------------------------------------------------------
for (const v of partnerVendors) {
  // A short prefix for this record's error lines.
  const at = `"${v.slug}"`;
  // The record's parent, if any.
  const p = v.official?.parent;
  // The record's lineage, if any.
  const l = v.lineage;

  // ---- parent ----
  if (p) {
    // Count it for the summary.
    parents += 1;
    // The citation labels this record carries.
    const labels = labelsOf(v);
    // Unknown keys first: a typo would otherwise pass every other test.
    for (const k of unknownKeys(p, PARENT_KEYS)) errors.push(`${at}: official.parent has an unknown key "${k}" (allowed: name, slug, since, kind, note).`);
    // The name: a non-empty, trimmed string.
    if (typeof p.name !== "string" || p.name.trim() === "" || p.name !== p.name.trim()) {
      errors.push(`${at}: official.parent.name must be a non-empty string without surrounding spaces.`);
    } else {
      // No em dash in a name shown in English copy.
      if (p.name.includes(EM_DASH)) errors.push(`${at}: official.parent.name carries an em dash.`);
      // Named by a citation label on the record.
      if (!labels.includes(p.name)) errors.push(`${at}: official.parent.name "${p.name}" is named by no source label on the record; cite the ownership with the parent named in the label.`);
    }
    // The slug, when given, must resolve and must not be the record itself.
    if (p.slug !== undefined) {
      // A string that names a record.
      if (typeof p.slug !== "string" || !slugs.has(p.slug)) errors.push(`${at}: official.parent.slug "${String(p.slug)}" resolves to no record.`);
      // Never itself.
      if (p.slug === v.slug) errors.push(`${at}: official.parent.slug names the record itself.`);
    }
    // The year, when given: an integer, not in the future, not before the record's founding, and cited.
    if (p.since !== undefined) {
      // A whole number.
      if (!Number.isInteger(p.since)) errors.push(`${at}: official.parent.since must be an integer year.`);
      // Not later than this year.
      else if (p.since > THIS_YEAR) errors.push(`${at}: official.parent.since ${p.since} is in the future.`);
      // Not earlier than the record's own founding, when it has one.
      else if (typeof v.founded === "number" && p.since < v.founded) errors.push(`${at}: official.parent.since ${p.since} predates the record's founding (${v.founded}).`);
      // Named, as digits, by a citation label.
      if (Number.isInteger(p.since) && !labels.includes(String(p.since))) errors.push(`${at}: official.parent.since ${p.since} is named by no source label on the record.`);
    }
    // The kind, when given: one of the two wordings the renderers know.
    if (p.kind !== undefined && !PARENT_KINDS.has(p.kind as string)) errors.push(`${at}: official.parent.kind "${String(p.kind)}" is not "company", "fund" or "state".`);
    // Count funds for the summary line.
    if (p.kind === "fund") funds += 1;
    // Count states for the summary line.
    if (p.kind === "state") states += 1;
    // The note, when given: a non-empty string without an em dash.
    if (p.note !== undefined) {
      // A real sentence.
      if (typeof p.note !== "string" || p.note.trim() === "") errors.push(`${at}: official.parent.note must be a non-empty string when present.`);
      // No em dash in English copy.
      else if (p.note.includes(EM_DASH)) errors.push(`${at}: official.parent.note carries an em dash.`);
    }
    // A parent only ever sits on a record with its own live site.
    if (!v.official?.url) errors.push(`${at}: official.parent is set but official.url is not; a parent never replaces the evidence that the company trades.`);
    // Never on an ended or defunct company.
    if (v.ended || v.official?.defunct) errors.push(`${at}: official.parent is set on a record that has ended or is defunct; an absorbed brand is an ending, not a subsidiary.`);
    // Never on a lineage card.
    if (l) errors.push(`${at}: official.parent and lineage are both set; a lineage card has no single owner.`);
  }

  // ---- lineage ----
  if (l) {
    // Count it for the summary.
    lineages += 1;
    // Unknown keys.
    for (const k of unknownKeys(l, LINEAGE_KEYS)) errors.push(`${at}: lineage has an unknown key "${k}" (allowed: note, members).`);
    // The note: a non-empty string without an em dash.
    if (typeof l.note !== "string" || l.note.trim() === "") errors.push(`${at}: lineage.note must be a non-empty string.`);
    // No em dash in English copy.
    else if (l.note.includes(EM_DASH)) errors.push(`${at}: lineage.note carries an em dash.`);
    // The members, when given: resolving, distinct, never the card itself.
    if (l.members !== undefined) {
      // An array of strings.
      if (!Array.isArray(l.members) || l.members.some((m) => typeof m !== "string")) {
        errors.push(`${at}: lineage.members must be an array of slugs.`);
      } else {
        // Each member resolves.
        for (const m of l.members) if (!slugs.has(m)) errors.push(`${at}: lineage.members names "${m}", which resolves to no record.`);
        // No repeats.
        if (new Set(l.members).size !== l.members.length) errors.push(`${at}: lineage.members repeats a slug.`);
        // Not itself.
        if (l.members.includes(v.slug)) errors.push(`${at}: lineage.members names the card itself.`);
      }
    }
    // A card with one own site is a company card.
    if (v.official?.url) errors.push(`${at}: lineage is set but so is official.url; a card with a single own site is a company card.`);
    // An ending would win in lifecycleOf(), so the lineage would never render.
    if (v.ended || v.official?.defunct) errors.push(`${at}: lineage is set on a record that has ended or is defunct; lifecycleOf() would never reach it.`);
  }

  // ---- the renderer agrees with the data ----
  // What every surface will print for this record.
  const lc = lifecycleOf(v);
  // A well-formed parent must come through on an active state.
  if (p && v.official?.url && !v.ended && !v.official.defunct && !(lc.state === "active" && lc.parent === p)) {
    errors.push(`${at}: lifecycleOf() did not return the active state carrying official.parent.`);
  }
  // A well-formed lineage must come through as the lineage state.
  if (l && !v.official?.url && !v.ended && !v.official?.defunct && lc.state !== "lineage") {
    errors.push(`${at}: lifecycleOf() did not return the lineage state.`);
  }
}

// ---- the overlays ---------------------------------------------------------------------
for (const [locale, table] of Object.entries(VENDOR_OVERLAYS)) {
  // Each overlaid record in this locale.
  for (const [slug, o] of Object.entries(table)) {
    // The English record it overlays (an unknown slug is the translation report's error, not this guard's).
    const v = partnerVendors.find((x) => x.slug === slug);
    // Nothing to compare against.
    if (!v) continue;
    // A translated parent note with no English note to translate.
    if (o.parentNote !== undefined && !v.official?.parent?.note) errors.push(`${locale} overlay "${slug}": parentNote is set but the record has no official.parent.note.`);
    // A translated lineage note with no lineage on the record.
    if (o.lineageNote !== undefined && !v.lineage) errors.push(`${locale} overlay "${slug}": lineageNote is set but the record has no lineage.`);
    // A translated owner name only for a state owner: any other parent's name is a fact, never translated.
    if (o.parentName !== undefined && v.official?.parent?.kind !== "state") errors.push(`${locale} overlay "${slug}": parentName is set but the record's parent is not a state; a company's or fund's name is never translated.`);
    // Each translation, when present, must be a real sentence (or name).
    for (const [k, t] of [["parentNote", o.parentNote], ["lineageNote", o.lineageNote], ["parentName", o.parentName]] as const) {
      // Present but empty.
      if (t !== undefined && (typeof t !== "string" || t.trim() === "")) errors.push(`${locale} overlay "${slug}": ${k} is empty.`);
    }
  }
}

// ---- completeness in the authored locale ------------------------------------------------
// The pt-BR overlays (an empty table if none).
const required = VENDOR_OVERLAYS[REQUIRED_LOCALE] ?? {};
for (const v of partnerVendors) {
  // This record's overlay in pt-BR.
  const o = required[v.slug];
  // An English parent note needs its Portuguese.
  if (v.official?.parent?.note && !o?.parentNote) errors.push(`"${v.slug}": official.parent.note has no ${REQUIRED_LOCALE} translation (overlay field parentNote).`);
  // An English lineage note needs its Portuguese.
  if (v.lineage?.note && !o?.lineageNote) errors.push(`"${v.slug}": lineage.note has no ${REQUIRED_LOCALE} translation (overlay field lineageNote).`);
  // A state owner needs its Portuguese name, starting with the noun the pt-BR message agrees with.
  if (v.official?.parent?.kind === "state") {
    // Missing: the pt-BR line would read "pertence ao French State".
    if (!o?.parentName) errors.push(`"${v.slug}": a state owner has no ${REQUIRED_LOCALE} name (overlay field parentName).`);
    // Present but not "Estado ...": "pertence ao" would not agree.
    else if (!o.parentName.startsWith(PT_STATE_NOUN)) errors.push(`"${v.slug}": the ${REQUIRED_LOCALE} parentName "${o.parentName}" must begin with "${PT_STATE_NOUN.trim()}", the noun "pertence ao" agrees with.`);
  }
}

// ---- verdict ------------------------------------------------------------------------------
if (errors.length > 0) {
  // Every failure, then a non-zero exit.
  console.error(`[check-vendor-status-fields] FAIL (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
// The summary line, in the house style of the other guards.
console.log(`[check-vendor-status-fields] OK: ${parents} parent(s) (${funds} of them funds, ${states} of them states) and ${lineages} lineage card(s) well formed, sourced, translated, and rendered by lifecycleOf().`);
