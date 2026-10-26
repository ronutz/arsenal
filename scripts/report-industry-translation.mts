// ============================================================================
// scripts/report-industry-translation.mts
// ----------------------------------------------------------------------------
// INDUSTRY TRANSLATION REPORT (Round 1 audit, round 2, 2026-10-25).
//
// PRIME ruled that ALL Industry prose is translated into pt-BR through the
// locale overlay (src/content/vendors/localized.ts, applied by
// src/lib/vendorLocale.ts). This script is the measuring stick for that pass:
//
//   - per record, how many words of site-authored prose exist (record fields in
//     partners.ts and the record's rich profile), and which fields still have
//     no translation in the target locale;
//   - FACT PARITY of every translated profile against its English original:
//     same years, same companies and founders, same personal markers, same
//     number of entries in every section, so a translation can never move a
//     date or drop an event;
//   - alignment of translated acquisition lists (same length as the English).
//
// It reads, never writes. It is NOT wired into prebuild (package.json is a
// shared file): ANVIL decides when to promote `--strict` (fail on any parity
// or alignment error) and `--require-complete` (also fail while any prose is
// untranslated) into the guard chain.
//
// Usage:
//   npx tsx scripts/report-industry-translation.mts [--locale pt-BR] [--json]
//                                                   [--strict] [--require-complete]
//
// What counts as translatable prose is defined in PROSE_* below and explained
// in the round 2 TRANSLATION-PLAN: names, years, sources, URLs, quotations and
// product names are never translated and are never counted.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { partnerVendors, type PartnerVendor } from "../src/content/vendors/partners";
import { VENDOR_OVERLAYS, type PartnerVendorOverlay } from "../src/content/vendors/localized";
import type { VendorProfile } from "../src/content/vendors/profile-types";

// ---- arguments ---------------------------------------------------------------
// Raw command-line flags.
const argv = process.argv.slice(2);
// Target locale (only pt-BR is authored besides English today).
const LOCALE = argv.includes("--locale") ? argv[argv.indexOf("--locale") + 1] : "pt-BR";
// Machine-readable output instead of the table.
const AS_JSON = argv.includes("--json");
// Fail on parity or alignment errors.
const STRICT = argv.includes("--strict") || argv.includes("--require-complete");
// Also fail while any prose remains untranslated.
const REQUIRE_COMPLETE = argv.includes("--require-complete");

// ---- helpers -------------------------------------------------------------------
/** Words in a string: whitespace-separated tokens. */
function words(s: string | undefined | null): number {
  // An absent field has no words.
  if (!s) return 0;
  // Count non-empty tokens.
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** The site-authored prose of a record (partners.ts), as [field, text] pairs. */
function recordProse(v: PartnerVendor): [string, string][] {
  // Collected pairs.
  const out: [string, string][] = [];
  // The card/page title (the company name inside it stays verbatim).
  out.push(["name", v.name]);
  // One-line positioning.
  out.push(["tagline", v.tagline]);
  // Intro paragraph.
  out.push(["intro", v.intro]);
  // Body paragraphs, numbered.
  v.body.forEach((p, i) => out.push([`body[${i}]`, p]));
  // Accuracy note aside.
  if (v.note) out.push(["note", v.note]);
  // The ending's note (the year is a fact and is not translated).
  if (v.ended?.note) out.push(["ended.note", v.ended.note]);
  // The successor link's label (the URL is not translated).
  if (v.official?.successor?.label) out.push(["official.successor.label", v.official.successor.label]);
  // The parent company's note (PRIME ruling 1, 26/10/2026); its name, slug and year are facts.
  if (v.official?.parent?.note) out.push(["official.parent.note", v.official.parent.note]);
  // The lineage card's note (PRIME ruling 2, 26/10/2026); its member slugs are facts.
  if (v.lineage?.note) out.push(["lineage.note", v.lineage.note]);
  // Acquisition prose; names, years, prices and founders are facts.
  (v.acquisitions ?? []).forEach((a, i) => {
    // What the target did.
    out.push([`acquisitions[${i}].what`, a.what]);
    // What it became.
    if (a.became) out.push([`acquisitions[${i}].became`, a.became]);
    // Its provenance note.
    if (a.sourceNote) out.push([`acquisitions[${i}].sourceNote`, a.sourceNote]);
    // Nested deals' descriptions.
    (a.subAcquisitions ?? []).forEach((sub, j) => out.push([`acquisitions[${i}].subAcquisitions[${j}].what`, sub.what]));
  });
  // Drop empty strings so they are not reported as untranslated.
  return out.filter(([, t]) => Boolean(t && t.trim()));
}

/** The site-authored prose of a rich profile, as [field, text] pairs. */
function profileProse(p: VendorProfile): [string, string][] {
  // Collected pairs.
  const out: [string, string][] = [];
  // Founding stories: story, place (localised geography) and provenance note.
  (p.foundings ?? []).forEach((f, i) => {
    out.push([`foundings[${i}].story`, f.story]);
    out.push([`foundings[${i}].place`, f.place]);
    if (f.sourceNote) out.push([`foundings[${i}].sourceNote`, f.sourceNote]);
  });
  // Timeline events: headline, detail, provenance note.
  (p.timeline ?? []).forEach((e, i) => {
    out.push([`timeline[${i}].title`, e.title]);
    out.push([`timeline[${i}].detail`, e.detail]);
    if (e.sourceNote) out.push([`timeline[${i}].sourceNote`, e.sourceNote]);
  });
  // Products: the description only (the product name stays as the vendor writes it).
  (p.products ?? []).forEach((x, i) => out.push([`products[${i}].what`, x.what]));
  // Innovations: title and detail.
  (p.innovations ?? []).forEach((x, i) => {
    out.push([`innovations[${i}].title`, x.title]);
    out.push([`innovations[${i}].detail`, x.detail]);
  });
  // Markets paragraphs.
  (p.markets ?? []).forEach((x, i) => out.push([`markets[${i}]`, x]));
  // Analyst statements.
  (p.analyst ?? []).forEach((x, i) => out.push([`analyst[${i}]`, x]));
  // The career link's label (the href is not translated).
  if (p.careerLink?.label) out.push(["careerLink.label", p.careerLink.label]);
  // Drop empty strings.
  return out.filter(([, t]) => Boolean(t && t.trim()));
}

/** Fact-parity errors of a translated profile against the English one. */
function profileParity(en: VendorProfile, tr: VendorProfile): string[] {
  // Collected problems.
  const errs: string[] = [];
  // Same slug.
  if (en.slug !== tr.slug) errs.push(`slug ${tr.slug} != ${en.slug}`);
  // Each section must have the same number of entries.
  for (const key of ["foundings", "timeline", "products", "innovations", "markets", "analyst"] as const) {
    // Lengths (absent = 0).
    const a = (en[key] as unknown[] | undefined)?.length ?? 0;
    const b = (tr[key] as unknown[] | undefined)?.length ?? 0;
    // A different count means an event or entry was added or dropped.
    if (a !== b) errs.push(`${key}: ${b} entries, English has ${a}`);
  }
  // Foundings: year, company and founders are facts.
  (en.foundings ?? []).forEach((f, i) => {
    const g = tr.foundings?.[i];
    if (!g) return;
    if (g.year !== f.year) errs.push(`foundings[${i}].year ${g.year} != ${f.year}`);
    if (g.company !== f.company) errs.push(`foundings[${i}].company changed`);
    if (JSON.stringify(g.founders) !== JSON.stringify(f.founders)) errs.push(`foundings[${i}].founders changed`);
  });
  // Timeline: year and the personal marker are facts.
  (en.timeline ?? []).forEach((e, i) => {
    const g = tr.timeline?.[i];
    if (!g) return;
    if (g.year !== e.year) errs.push(`timeline[${i}].year ${g.year} != ${e.year}`);
    if (Boolean(g.personal) !== Boolean(e.personal)) errs.push(`timeline[${i}].personal changed`);
  });
  // The career link points at the same page.
  if ((en.careerLink?.href ?? "") !== (tr.careerLink?.href ?? "")) errs.push("careerLink.href changed");
  // Done.
  return errs;
}

/** Which prose fields of a record the overlay covers, by field name. */
function coveredRecordFields(v: PartnerVendor, o: PartnerVendorOverlay | undefined): Set<string> {
  // Covered field names.
  const c = new Set<string>();
  // No overlay: nothing covered.
  if (!o) return c;
  // Simple fields.
  if (o.name) c.add("name");
  if (o.tagline) c.add("tagline");
  if (o.intro) c.add("intro");
  if (o.note) c.add("note");
  if (o.endedNote) c.add("ended.note");
  if (o.successorLabel) c.add("official.successor.label");
  // The parent's note and the lineage note (26/10/2026).
  if (o.parentNote) c.add("official.parent.note");
  if (o.lineageNote) c.add("lineage.note");
  // Body: covered paragraph by paragraph (a replaced list covers its own length).
  (o.body ?? []).forEach((_, i) => c.add(`body[${i}]`));
  // Acquisitions: only when aligned, as vendorLocale.ts applies them.
  if (o.acquisitions && o.acquisitions.length === (v.acquisitions?.length ?? 0)) {
    o.acquisitions.forEach((a, i) => {
      if (a.what) c.add(`acquisitions[${i}].what`);
      if (a.became) c.add(`acquisitions[${i}].became`);
      if (a.sourceNote) c.add(`acquisitions[${i}].sourceNote`);
      (a.subAcquisitions ?? []).forEach((sub, j) => sub.what && c.add(`acquisitions[${i}].subAcquisitions[${j}].what`));
    });
  }
  // Done.
  return c;
}

// ---- load the profiles --------------------------------------------------------
// The directory of rich profiles.
const DIR = path.join(process.cwd(), "src", "content", "vendors", "profiles");
// slug -> { file, profile }.
const profiles = new Map<string, { file: string; profile: VendorProfile }>();
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".ts")).sort()) {
  // Import the module by URL so tsx resolves it.
  const mod = (await import(pathToFileURL(path.join(DIR, file)).href)) as Record<string, unknown>;
  // The exported value that looks like a profile (an object with a slug).
  const profile = Object.values(mod).find(
    (x): x is VendorProfile => typeof x === "object" && x !== null && typeof (x as { slug?: unknown }).slug === "string",
  );
  // Record it under its slug.
  if (profile) profiles.set(profile.slug, { file, profile });
}

// ---- measure --------------------------------------------------------------------
// The locale's overlays (empty when none exist).
const overlays = VENDOR_OVERLAYS[LOCALE] ?? {};
// One row per record.
type Row = {
  slug: string;
  profileFile: string | null;
  recordWords: number;
  profileWords: number;
  recordUntranslated: string[];
  profileTranslated: boolean;
  errors: string[];
};
// All rows.
const rows: Row[] = [];
for (const v of partnerVendors) {
  // The record's overlay in this locale.
  const o = overlays[v.slug];
  // Its prose and what the overlay covers.
  const rp = recordProse(v);
  const covered = coveredRecordFields(v, o);
  // Its profile, if one exists.
  const prof = profiles.get(v.slug);
  const pp = prof ? profileProse(prof.profile) : [];
  // Problems found for this record.
  const errors: string[] = [];
  // Acquisition alignment.
  if (o?.acquisitions && o.acquisitions.length !== (v.acquisitions?.length ?? 0)) {
    errors.push(`acquisitions overlay has ${o.acquisitions.length} entries, English has ${v.acquisitions?.length ?? 0}`);
  }
  // Body overlay must replace the whole list.
  if (o?.body && o.body.length !== v.body.length) errors.push(`body overlay has ${o.body.length} paragraphs, English has ${v.body.length}`);
  // Profile parity.
  if (o?.profile && prof) errors.push(...profileParity(prof.profile, o.profile).map((e) => `profile ${e}`));
  // A profile overlay with no English profile is an orphan.
  if (o?.profile && !prof) errors.push("profile overlay without an English profile");
  // The row.
  rows.push({
    slug: v.slug,
    profileFile: prof?.file ?? null,
    recordWords: rp.reduce((n, [, t]) => n + words(t), 0),
    profileWords: pp.reduce((n, [, t]) => n + words(t), 0),
    recordUntranslated: rp.filter(([f]) => !covered.has(f)).map(([f]) => f),
    profileTranslated: Boolean(o?.profile),
    errors,
  });
}
// Overlays naming a slug that no record has.
const orphanOverlays = Object.keys(overlays).filter((s) => !partnerVendors.some((v) => v.slug === s));
// Profiles that no record hosts (counted separately so the totals stay honest).
const hostless = [...profiles.keys()].filter((s) => !partnerVendors.some((v) => v.slug === s));

// ---- totals -------------------------------------------------------------------------
const totalRecordWords = rows.reduce((n, r) => n + r.recordWords, 0);
const totalProfileWords = rows.reduce((n, r) => n + r.profileWords, 0);
const doneRecords = rows.filter((r) => r.recordUntranslated.length === 0 && (r.profileFile === null || r.profileTranslated)).length;
const errorCount = rows.reduce((n, r) => n + r.errors.length, 0) + orphanOverlays.length;
const untranslatedCount = rows.length - doneRecords;

// ---- output ---------------------------------------------------------------------------
if (AS_JSON) {
  // Everything, for sharding tools.
  console.log(JSON.stringify({ locale: LOCALE, totalRecordWords, totalProfileWords, doneRecords, records: rows.length, orphanOverlays, hostlessProfiles: hostless, rows }, null, 2));
} else {
  // One line per record that still needs work or has an error.
  for (const r of rows) {
    // Fully translated and clean: nothing to say.
    if (r.errors.length === 0 && r.recordUntranslated.length === 0 && (r.profileFile === null || r.profileTranslated)) continue;
    // Summary of what is missing.
    const parts = [
      r.recordUntranslated.length ? `${r.recordUntranslated.length} record field(s) untranslated (${r.recordWords} words)` : "",
      r.profileFile && !r.profileTranslated ? `profile ${r.profileFile} untranslated (${r.profileWords} words)` : "",
      ...r.errors.map((e) => `ERROR ${e}`),
    ].filter(Boolean);
    console.log(`${r.slug}: ${parts.join("; ")}`);
  }
  // Orphans are errors.
  for (const s of orphanOverlays) console.log(`ERROR overlay for unknown record "${s}"`);
  // The headline.
  console.log(
    `[report-industry-translation] ${LOCALE}: ${doneRecords}/${rows.length} record(s) fully translated; ` +
      `${totalRecordWords} words of record prose and ${totalProfileWords} words of profile prose in scope; ` +
      `${errorCount} parity/alignment error(s); ${hostless.length} profile(s) hosted by no record: ${hostless.join(", ") || "none"}.`,
  );
}

// ---- exit status ----------------------------------------------------------------------
// Parity or alignment errors fail in strict mode.
if (STRICT && errorCount > 0) process.exit(1);
// Untranslated prose fails only when completeness is required.
if (REQUIRE_COMPLETE && untranslatedCount > 0) process.exit(1);
