#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// check-source-words: THE WORDS AROUND A TOOL'S SOURCES EXIST IN BOTH PACKS,
// AND NOWHERE ELSE.
// ----------------------------------------------------------------------------
// WHY (2026-11-02, batch H5). Until that day the "Credits & sources" panel
// under 26 tools was English on every locale (about 117 English sentences on
// the pt-BR pages, measured 2026-11-01), and the reference lists under the
// other tools printed the note after each vendor title in English too. Both
// now keep their structure in code and their words in the message packs, the
// house pattern of src/content/materials/materials.ts and
// src/content/study-guides/reading-paths.ts. A split like that fails quietly:
// a new source with no words, a pack entry for a source that was removed, or a
// label reworded in code but not in the pack all still build, and the page
// shows the wrong words or a raw key. This guard makes each of those a build
// failure.
//
// WHAT IT CHECKS.
//   A. The provenance panel (src/config/toolProvenance.ts, namespace
//      toolProvenance):
//      1. every tool in the registry has toolProvenance.<tool>.basis in en and
//         pt-BR, a non-empty string;
//      2. every source has a key (lowercase letters, digits, hyphens; unique in
//         its tool) and sources.<key>.note in both packs;
//      3. a source marked ownLabel has sources.<key>.label in both packs, and the
//         en label is exactly the label written in the registry (the citation
//         audits read the registry's copy, the page reads the pack's, so the two
//         must not drift); a source not marked ownLabel has no label in either
//         pack (its label is a published title, shown as published);
//      4. nothing in either pack's toolProvenance names a tool, a source or a
//         field the registry does not have.
//   B. The reference lists (the tool page's References section, namespace
//      toolReferences.<tool>.<source id>, read by src/app/[locale]/tools/[slug]/
//      page.tsx):
//      5. every tool named there has a manifest (src/lib/tools/<tool>/index.ts)
//         whose sources include each id named;
//      6. the en text is exactly the manifest's label (so the English page reads
//         as before), and pt-BR has the same ids as en.
//   Texts are compared as the page shows them: a message's ICU quoting (a
//   brace or a "<" in a label is stored quoted) is undone first.
//
// HOW TO CLEAR A FAILURE: add the missing words to both packs (en carries the
// same English as the code), or remove the stray ones; when a registry label or
// a manifest label is reworded on purpose, reword its en entry to match and
// revise its pt-BR entry.
//
// Run: npx tsx scripts/check-source-words.mts   (from the repository root)
// ============================================================================

import { readFileSync, existsSync } from "node:fs"; // the packs, the manifests' presence
import { pathToFileURL } from "node:url"; // to import a manifest by path
import path from "node:path"; // paths
import { parse, TYPE } from "@formatjs/icu-messageformat-parser"; // the parser next-intl uses, to read a message's literal text
import { provenanceToolIds, provenanceEntry } from "../src/config/toolProvenance.ts"; // the panel's registry

/** A message pack, as loaded. */
type Pack = Record<string, unknown>; // nested objects of strings

const ROOT = process.cwd(); // the repository root
const load = (loc: string): Pack => JSON.parse(readFileSync(path.join(ROOT, `src/i18n/messages/${loc}.json`), "utf8")) as Pack; // a pack
const PACKS: Record<string, Pack> = { en: load("en"), "pt-BR": load("pt-BR") }; // the two authored locales
const problems: string[] = []; // every failure, collected so one run reports all of them

/**
 * The object at a dotted path in a pack, or undefined.
 * @param pack the pack
 * @param dotted the path
 * @returns what is there
 */
function at(pack: Pack, dotted: string): unknown {
  let node: unknown = pack; // walk down
  for (const part of dotted.split(".")) { // each segment
    if (node === null || typeof node !== "object") return undefined; // nothing deeper
    node = (node as Record<string, unknown>)[part]; // one level down
  } // walked
  return node; // found, or undefined
} // at

/**
 * The keys of the object at a dotted path (none when it is not an object).
 * @param pack the pack
 * @param dotted the path
 * @returns its keys
 */
function keysAt(pack: Pack, dotted: string): string[] {
  const node = at(pack, dotted); // the node
  return node !== null && typeof node === "object" ? Object.keys(node as object) : []; // its keys
} // keysAt

/**
 * The literal text of a message with no arguments (ICU quoting undone: a label with braces or "<" is stored quoted),
 * or null when it holds anything but text or is not a valid message.
 * @param msg the message
 * @returns its text, or null
 */
function literalOf(msg: unknown): string | null {
  if (typeof msg !== "string") return null; // absent
  try {
    const ast = parse(msg); // as next-intl reads it
    return ast.every((el) => el.type === TYPE.literal) ? ast.map((el) => (el as { value: string }).value).join("") : null; // text only
  } catch { return null; } // not a valid message
} // literalOf

/**
 * Require a non-empty string at a dotted path in both packs.
 * @param dotted the path
 * @param why what the string is, for the failure text
 */
function needBoth(dotted: string, why: string): void {
  for (const [loc, pack] of Object.entries(PACKS)) { // en, pt-BR
    const v = at(pack, dotted); // the message
    if (typeof v !== "string" || v.trim() === "") problems.push(`${loc}: missing ${dotted} (${why})`); // absent or empty
  } // both
} // needBoth

// ---- A. the provenance panel ------------------------------------------------
const ids = provenanceToolIds(); // the tools with a panel
let sourcesChecked = 0; // count, for the OK line
for (const tool of ids) { // each tool
  const entry = provenanceEntry(tool)!; // its structure
  needBoth(`toolProvenance.${tool}.basis`, "the panel's basis paragraph"); // 1
  const seen = new Set<string>(); // keys in this tool
  for (const s of entry.sources) { // each source
    sourcesChecked += 1; // counted
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.key)) problems.push(`src/config/toolProvenance.ts: ${tool}: key ${JSON.stringify(s.key)} is not lowercase letters, digits and hyphens`); // 2: key-safe (a dot would nest)
    if (seen.has(s.key)) problems.push(`src/config/toolProvenance.ts: ${tool}: key ${s.key} is used twice`); // 2: unique
    seen.add(s.key); // recorded
    needBoth(`toolProvenance.${tool}.sources.${s.key}.note`, `what ${tool} takes from ${s.label}`); // 2: the note
    if (s.ownLabel) { // 3: our own description
      needBoth(`toolProvenance.${tool}.sources.${s.key}.label`, `the own label of ${s.label}`); // in both
      const enLabel = at(PACKS.en, `toolProvenance.${tool}.sources.${s.key}.label`); // the English the page shows
      if (typeof enLabel === "string" && literalOf(enLabel) !== s.label) problems.push(`en: toolProvenance.${tool}.sources.${s.key}.label is ${JSON.stringify(enLabel)} but the registry writes ${JSON.stringify(s.label)}`); // drifted
    } else { // a published title
      for (const [loc, pack] of Object.entries(PACKS)) if (at(pack, `toolProvenance.${tool}.sources.${s.key}.label`) !== undefined) problems.push(`${loc}: toolProvenance.${tool}.sources.${s.key}.label exists, but the registry does not mark that label ownLabel (a published title is shown as published)`); // ignored words
    } // label
  } // sources
} // tools
for (const [loc, pack] of Object.entries(PACKS)) { // 4: nothing stray
  for (const tool of keysAt(pack, "toolProvenance")) { // each tool in the pack
    const entry = provenanceEntry(tool); // the registry's
    if (!entry) { problems.push(`${loc}: toolProvenance.${tool} has no entry in src/config/toolProvenance.ts`); continue; } // a tool the registry lacks
    for (const field of keysAt(pack, `toolProvenance.${tool}`)) if (field !== "basis" && field !== "sources") problems.push(`${loc}: toolProvenance.${tool}.${field} is not a field the panel reads (basis, sources)`); // unknown field
    const keys = new Set(entry.sources.map((s) => s.key)); // the registry's keys
    for (const key of keysAt(pack, `toolProvenance.${tool}.sources`)) { // each source in the pack
      if (!keys.has(key)) { problems.push(`${loc}: toolProvenance.${tool}.sources.${key} names no source of ${tool} in src/config/toolProvenance.ts`); continue; } // removed or renamed
      for (const field of keysAt(pack, `toolProvenance.${tool}.sources.${key}`)) if (field !== "note" && field !== "label") problems.push(`${loc}: toolProvenance.${tool}.sources.${key}.${field} is not a field the panel reads (note, label)`); // unknown field
    } // sources
  } // tools
} // packs

// ---- B. the reference lists -------------------------------------------------
const refTools = [...new Set([...keysAt(PACKS.en, "toolReferences"), ...keysAt(PACKS["pt-BR"], "toolReferences")])].sort(); // tools named in either pack
let refsChecked = 0; // count, for the OK line
for (const tool of refTools) { // each tool
  const file = path.join(ROOT, `src/lib/tools/${tool}/index.ts`); // its manifest's module
  if (!existsSync(file)) { problems.push(`toolReferences.${tool}: no src/lib/tools/${tool}/index.ts to read the manifest from`); continue; } // no such tool
  const mod = (await import(pathToFileURL(file).href)) as { manifest?: { sources?: { id: string; label: string }[] } }; // the module
  const sources = mod.manifest?.sources ?? []; // its sources
  const byId = new Map(sources.map((s) => [s.id, s.label])); // id -> label
  const enIds = keysAt(PACKS.en, `toolReferences.${tool}`); // ids in en
  const ptIds = keysAt(PACKS["pt-BR"], `toolReferences.${tool}`); // ids in pt-BR
  for (const id of new Set([...enIds, ...ptIds])) { // 5, 6
    refsChecked += 1; // counted
    if (!byId.has(id)) { problems.push(`toolReferences.${tool}.${id}: the manifest of ${tool} has no source with that id`); continue; } // 5
    const en = at(PACKS.en, `toolReferences.${tool}.${id}`); // the English
    if (literalOf(en) !== byId.get(id)) problems.push(`en: toolReferences.${tool}.${id} is ${JSON.stringify(en)} but the manifest's label is ${JSON.stringify(byId.get(id))}`); // 6: drifted or missing
    const pt = at(PACKS["pt-BR"], `toolReferences.${tool}.${id}`); // the Portuguese
    if (typeof pt !== "string" || pt.trim() === "") problems.push(`pt-BR: missing toolReferences.${tool}.${id}`); // 6: absent
  } // ids
} // tools

if (problems.length > 0) { // failed
  console.error(`\n[check-source-words] FAIL: ${problems.length} problem(s)\n`); // headline
  for (const p of problems.slice(0, 60)) console.error(`  - ${p}`); // the first sixty
  if (problems.length > 60) console.error(`  ... and ${problems.length - 60} more`); // the rest, counted
  process.exit(1); // a hard stop
} // reported
console.log(`[check-source-words] OK: ${ids.length} provenance panels (${sourcesChecked} sources) have their basis and notes in en and pt-BR, own labels agree with the registry, and nothing stray; ${refsChecked} reference label(s) across ${refTools.length} tool(s) match their manifests and exist in pt-BR.`); // the result
