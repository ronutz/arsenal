// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/content/career/path.ts
// ----------------------------------------------------------------------------
// THE CAREER PATH, ONCE (27/10/2026). The About page's "The path" timeline held
// each entry's years and where-label as literals in its markup. The CV page
// (/about/cv, PRIME 27/10/2026 23:12) shows the same entries, so the facts move
// here and both pages read them: one place to correct a year, and two pages that
// cannot disagree. What each entry did is in the message packs, under
// about.path.<key>, as before; the vendor marks stay in the About page's markup,
// with the rulings that chose them.
//
// The years and labels are exactly the ones the About page carried on
// 27/10/2026 (each set there by PRIME on the dates its comments record).
// ============================================================================

/** The entries' keys: each one's text is about.path.<key> in the packs. */
export type CareerKey =
  | "cabletron"
  | "riverstone"
  | "cisco"
  | "ironport"
  | "enterasys"
  | "juniper"
  | "implementation"
  | "f5channel"
  | "cylk2020"
  | "rededucation";

/** One entry of the path. */
export interface CareerEntry {
  /** Which entry: its text is about.path.<key>. */
  key: CareerKey;
  /** The first year. */
  from: number;
  /** The last year, or null while it continues. */
  to: number | null;
  /** Where: a company and city, written the same in every language; null when the label is a description, translated in
   *  the packs as about.path.<key>Where (the two descriptions moved there on 27/10/2026, so the Portuguese pages read them
   *  in Portuguese). */
  where: string | null;
}

/** The path, oldest first, as the About page lists it. */
export const CAREER_PATH: readonly CareerEntry[] = Object.freeze([
  { key: "cabletron", from: 1996, to: 2000, where: "Cabletron Systems · São Paulo" }, // the first vendor years
  { key: "riverstone", from: 2000, to: 2002, where: "Riverstone Networks · Santa Clara, California" }, // the spin-off
  { key: "cisco", from: 2003, to: 2004, where: "Cisco Systems · Brasília" }, // the government accounts
  { key: "ironport", from: 2004, to: 2005, where: "IronPort Systems · São Paulo" }, // added by PRIME 2026-10-04
  { key: "enterasys", from: 2005, to: 2007, where: "Enterasys Networks · São Paulo" }, // engineer and instructor
  { key: "juniper", from: 2009, to: 2010, where: "Juniper Networks · São Paulo" }, // channel support and training
  { key: "implementation", from: 2011, to: 2014, where: null }, // added by PRIME 2026-08-05; a description, not a company: about.path.implementationWhere
  { key: "f5channel", from: 2015, to: 2019, where: "F5 Networks · Westcon / TD SYNNEX, Network1 / ScanSource" }, // the channel years
  { key: "cylk2020", from: 2020, to: 2022, where: null }, // PRIME 2026-10-05; a description: about.path.cylk2020Where
  { key: "rededucation", from: 2020, to: null, where: null }, // the label is about.path.rededucationWhere (audit F11)
]);

/**
 * An entry's years as the About page shows them: "1996 – 2000", or "2020 – present" in the page's language.
 * @param e the entry
 * @param present the word for a continuing entry (about.path.present)
 * @returns the span of years
 */
export function careerYears(e: CareerEntry, present: string): string {
  // An en dash between the years: a numeric range, which D-55 allows.
  return `${e.from} – ${e.to ?? present}`;
}

/**
 * The entry for a key (the About page places entries one by one, with their marks between them).
 * @param key which entry
 * @returns the entry
 */
export function careerEntry(key: CareerKey): CareerEntry {
  // The list is fixed and every key is in it.
  return CAREER_PATH.find((e) => e.key === key)!;
}
