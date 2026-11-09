#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-interface-locales.mts  (prebuild guard; run with tsx)
// ----------------------------------------------------------------------------
// EVERY INTERFACE LOCALE HAS WRITTEN EVERY STRING THAT LIVES IN CODE
// (09/11/2026).
//
// The tools, games and training pages that keep their human text in code read
// it, in every locale beyond en and pt-BR, from src/i18n/content/<locale>/
// <module>.json (src/i18n/contentStrings.ts); scripts/content-strings.mts says
// which English strings and templates each module can show
// (CONTENT_MODULES). A locale joins INTERFACE_LOCALES (src/i18n/locales.ts)
// when its interface is complete; this guard is what "complete" means for
// these modules. It FAILS the build when:
//   1. the extraction no longer covers what a module renders: a sentence the
//      engines produce on their golden vectors is neither a module string
//      nor matches a template (scripts/content-strings.mts, the cross-check),
//      or a module's list came out empty;
//   2. for a locale of INTERFACE_LOCALES other than en and pt-BR, a module's
//      file is missing, or misses strings of the module (a count and the
//      first few);
// and, for EVERY locale folder present under src/i18n/content (a draft is
// served too: contentStringsOf reads whatever file is there), when:
//   3. the folder is not a registered locale, or is en or pt-BR (both keep
//      their text inline; a file there would change their pages);
//   4. a file is not <module>.json for a module of CONTENT_MODULES, is not
//      a JSON object of non-empty strings, or holds a key that is no longer
//      a module string (stale: the English changed, so the translation is of
//      a sentence the page no longer shows);
//   5. a translation loses or adds a placeholder of its key ({0}, {1}...:
//      every value must be put back, and only those), or an exact string's
//      translation carries one;
//   6. the templates are not in the module's order (the matcher tries them in
//      the file's order, and the module lists the more specific first).
// With no interface-only locale and no folder it says "no interface-only
// locale yet" and passes. Not wired into package.json here: ANVIL wires it.
//
// Run: npx tsx scripts/check-interface-locales.mts
//      (--root <dir> and --locales a,b point it at another folder and another
//      locale list, for testing the guard itself.)
// ============================================================================

import fs from "node:fs"; // the locale folders and files
import path from "node:path"; // their paths
// The modules' English, the placeholder reader and the cross-check.
import { CONTENT_MODULES, coverage, placeholdersOf } from "./content-strings.mts";
// The interface locales and every registered locale code.
import { INTERFACE_LOCALES, LOCALE_CODES } from "../src/i18n/locales";

/** Every line's tag. */
const TAG = "[check-interface-locales]";

/** The locales that keep their text inline and never have a folder here. */
const INLINE = new Set(["en", "pt-BR"]);

/** How many examples a failure lists. */
const FIRST = 5;

/** The command line. */
const args = process.argv.slice(2);

/**
 * The value of an option of the command line.
 *
 * @param name the option, e.g. "--root"
 * @returns its value, or undefined when absent
 */
function opt(name: string): string | undefined {
  // Where it is.
  const i = args.indexOf(name);
  // The word after it.
  return i >= 0 ? args[i + 1] : undefined;
}

/** The folder of the per-locale files (src/i18n/content, or --root for a test). */
const ROOT = path.resolve(opt("--root") ?? path.join(process.cwd(), "src", "i18n", "content"));

/** The interface locales to require (INTERFACE_LOCALES, or --locales for a test). */
const REQUIRED: readonly string[] = (opt("--locales")?.split(",").filter((l) => l !== "") ?? [...INTERFACE_LOCALES]).filter((l) => !INLINE.has(l));

/** Every failure, as a line. */
const failures: string[] = [];

/**
 * A long string cut for a failure line.
 *
 * @param s the string
 * @returns at most 90 characters of it, quoted as JSON
 */
function cut(s: string): string {
  // Quoted, cut with an ellipsis when long.
  return JSON.stringify(s.length > 90 ? s.slice(0, 90) + "…" : s);
}

/**
 * A short list of examples for a failure line.
 *
 * @param items the items (strings to quote, or lines already written)
 * @param quoted whether to quote and cut each item (false: each is already a written line)
 * @returns the first few, with how many more
 */
function firstFew(items: readonly string[], quoted = true): string {
  // The first few.
  const shown = items.slice(0, FIRST).map((s) => (quoted ? cut(s) : s)).join("; ");
  // And the rest, counted.
  return items.length > FIRST ? `${shown}; and ${items.length - FIRST} more` : shown;
}

// ---- 1. the extraction covers what the modules render ---------------------------

/** The modules and their English, worked out once. */
const MODULE_STRINGS = new Map<string, string[]>(Object.entries(CONTENT_MODULES).map(([m, f]) => [m, f()]));

// Each module.
for (const [m, list] of MODULE_STRINGS) {
  // An empty list means the extraction broke (a moved file, a renamed table).
  if (list.length === 0) failures.push(`${m}: the module's list of English strings is empty (scripts/content-strings.mts)`);
  // The cross-check against the engines' own output.
  const c = coverage(m);
  // A rendered sentence no key covers: a locale could not translate it.
  if (c.gaps.length > 0) failures.push(`${m}: ${c.gaps.length} sentence(s) the module renders are neither a module string nor match a template: ${firstFew(c.gaps)} (run npx tsx scripts/content-strings.mts --report)`);
}

// ---- 3 to 6. every locale folder present ---------------------------------------------

/** The locale folders present, sorted. */
const present = fs.existsSync(ROOT) ? fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort() : [];

/** The files each locale holds, parsed: locale -> module -> map. */
const held = new Map<string, Map<string, Record<string, string>>>();

// Each folder.
for (const locale of present) {
  // 3. Not a registered locale: a typo, or a folder nothing reads.
  if (!LOCALE_CODES.includes(locale)) { failures.push(`${locale}/: not a registered locale (src/i18n/locales.ts)`); continue; }
  // 3. English or Brazilian Portuguese: their text is inline; a file here would change their pages.
  if (INLINE.has(locale)) { failures.push(`${locale}/: ${locale} keeps its text inline; remove the folder`); continue; }
  // The locale's modules.
  const mine = new Map<string, Record<string, string>>();
  // Recorded.
  held.set(locale, mine);
  // Each entry of the folder.
  for (const file of fs.readdirSync(path.join(ROOT, locale)).sort()) {
    // Where it is, for the messages.
    const where = `${locale}/${file}`;
    // 4. Only <module>.json files.
    if (!file.endsWith(".json")) { failures.push(`${where}: not a module file (<module>.json)`); continue; }
    // The module it names.
    const m = file.slice(0, -".json".length);
    // The module's English.
    const list = MODULE_STRINGS.get(m);
    // 4. A module that does not exist (any more): a stale file.
    if (!list) { failures.push(`${where}: no module "${m}" in CONTENT_MODULES (renamed or removed?)`); continue; }
    // The parsed file.
    let map: unknown;
    // Parsed, or a failure.
    try { map = JSON.parse(fs.readFileSync(path.join(ROOT, locale, file), "utf8")); } catch (e) { failures.push(`${where}: not valid JSON (${(e as Error).message})`); continue; }
    // 4. An object of strings.
    if (map === null || typeof map !== "object" || Array.isArray(map)) { failures.push(`${where}: not a JSON object of English -> translation`); continue; }
    // As a record.
    const rec = map as Record<string, unknown>;
    // 4. Every value a non-empty string.
    const bad = Object.entries(rec).filter(([, v]) => typeof v !== "string" || v.trim() === "").map(([k]) => k);
    // Reported.
    if (bad.length > 0) failures.push(`${where}: ${bad.length} key(s) without a non-empty string translation: ${firstFew(bad)}`);
    // The module's English as a set.
    const known = new Set(list);
    // 4. Stale keys: no longer a module string.
    const stale = Object.keys(rec).filter((k) => !known.has(k));
    // Reported.
    if (stale.length > 0) failures.push(`${where}: ${stale.length} stale key(s), no longer a string of the module (its English changed?): ${firstFew(stale)}`);
    // 5. Placeholders kept: the same set in the translation as in the key.
    const lost: string[] = [];
    // Each key with a string value.
    for (const [k, v] of Object.entries(rec)) {
      // Only strings are compared (the others failed above).
      if (typeof v !== "string") continue;
      // The key's placeholders.
      const want = placeholdersOf(k);
      // The translation's.
      const got = placeholdersOf(v);
      // Written out for the message: {0}, {1}, or none.
      const show = (ns: number[]) => (ns.length ? ns.map((n) => `{${n}}`).join(", ") : "none");
      // Different sets: a value lost or one invented.
      if (want.join(",") !== got.join(",")) lost.push(`${cut(k)} has ${show(want)}, its translation ${show(got)}`);
    }
    // Reported.
    if (lost.length > 0) failures.push(`${where}: ${lost.length} translation(s) do not keep exactly their key's placeholders: ${firstFew(lost, false)}`);
    // 6. The templates in the module's order (each template's position in the module list must rise through the file).
    const order = new Map(list.map((s, i) => [s, i]));
    // The file's templates that are module strings, with their position in the module list.
    const positions = Object.keys(rec).filter((k) => known.has(k) && placeholdersOf(k).length > 0).map((k) => ({ k, i: order.get(k) as number }));
    // The first one out of order.
    const out = positions.find((p, j) => j > 0 && p.i < positions[j - 1].i);
    // Reported.
    if (out) failures.push(`${where}: templates out of the module's order (the matcher tries them in file order, the more specific first): ${cut(out.k)} comes after a template the module lists later; write the file in the order of scripts/content-strings.mts`);
    // Kept for the completeness check (only valid string values count as written).
    mine.set(m, Object.fromEntries(Object.entries(rec).filter(([, v]) => typeof v === "string" && v.trim() !== "")) as Record<string, string>);
  }
}

// ---- 2. every interface locale complete --------------------------------------------------

// Each required locale.
for (const locale of REQUIRED) {
  // Its files (a missing folder is every file missing).
  const mine = held.get(locale) ?? new Map<string, Record<string, string>>();
  // Each module.
  for (const [m, list] of MODULE_STRINGS) {
    // The file.
    const map = mine.get(m);
    // Missing altogether.
    if (!map) { failures.push(`${locale}/${m}.json: missing (${list.length} strings to write)`); continue; }
    // The module strings it lacks.
    const missing = list.filter((s) => !(s in map));
    // Reported with a count and the first few.
    if (missing.length > 0) failures.push(`${locale}/${m}.json: ${missing.length} of ${list.length} module string(s) missing: ${firstFew(missing)}`);
  }
}

// ---- the verdict --------------------------------------------------------------------------

// Any failure: listed, and the build stops.
if (failures.length > 0) {
  // The count.
  console.error(`${TAG} FAIL: ${failures.length} problem(s)`);
  // Each.
  for (const f of failures) console.error(`  ${f}`);
  // Red.
  process.exit(1);
}

/** The modules and their sizes, for the OK line. */
const sizes = [...MODULE_STRINGS].map(([m, l]) => `${m} ${l.length}`).join(", ");

/** The draft folders (present but not yet required), for the OK line. */
const drafts = [...held.keys()].filter((l) => !REQUIRED.includes(l));

// No interface-only locale yet: said, and passed.
if (REQUIRED.length === 0) {
  // The status line.
  console.log(`${TAG} OK: no interface-only locale yet (INTERFACE_LOCALES is ${[...INTERFACE_LOCALES].join(", ")}); ${MODULE_STRINGS.size} modules keep text in code (${sizes}), and the extraction covers what they render${drafts.length ? `; draft folders checked for placeholders, stale keys and order: ${drafts.join(", ")}` : ""}.`);
} else { // Otherwise: the required locales are complete.
  // Every required locale is complete: said, and passed.
  console.log(`${TAG} OK: ${REQUIRED.join(", ")} hold every string of the ${MODULE_STRINGS.size} modules (${sizes}) with their placeholders, nothing stale${drafts.length ? `; draft folders also checked: ${drafts.join(", ")}` : ""}.`);
}
