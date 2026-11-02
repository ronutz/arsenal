#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// check-engine-catalogue: THE EN PACK SAYS WHAT THE ENGINE SAYS, KEY BY KEY.
// ----------------------------------------------------------------------------
// WHY (2026-11-02, batch H5, closing batch L1's open point 3). Since 01/11/2026
// the pages of several tools show an engine's catalogue texts (a DoS vector's
// description, a profile card's quirks, a session variable's meaning, an AWAF
// section's summary) through the message packs, under
// tools.<slug>.engine.<key>, so the pt-BR page reads in Portuguese. The en pack
// carries the same English as the engine, and the English page reads the pack
// too. Some of those keys are POSITIONS in a list (vec.<name>.note0,
// profile.<id>.when1, method.<id>.quirk2): reorder, insert or delete an item in
// the engine without moving the pack keys and the page shows the wrong sentence
// under the right heading, in BOTH languages, with every other guard green.
// Rewording an entry in the engine without the pack has the same effect.
//
// WHAT IT CHECKS. For every tool listed in CATALOGUES below, the catalogue is
// rebuilt from the engine's own constants with the keys the component uses, and
//   1. every catalogue key exists in en and its text (ICU literal, unescaped) is
//      exactly the engine's English;
//   2. every catalogue key exists in pt-BR (a translation, not checked here);
//   3. no key under one of the tool's catalogue prefixes exists in en or pt-BR
//      that the engine no longer produces (a removed item, a shortened list).
// Sentence ids built at run time with say() are not catalogue texts and are not
// read here; their English sits next to the id in the engine's code.
//
// HOW TO CLEAR A FAILURE: when an engine's list or text changes on purpose,
// move or reword the en entries to match (same key, same English) and revise
// the pt-BR entries; never renumber a list by hand without both packs.
//
// ADDING A TOOL: when a component looks catalogue texts up by key, add its
// extractor here, with the same keys the component builds.
//
// Run: npx tsx scripts/check-engine-catalogue.mts   (from the repository root)
// ============================================================================

import { readFileSync } from "node:fs"; // the packs
import path from "node:path"; // paths
import { pathToFileURL } from "node:url"; // to import an engine by path
import { parse, TYPE } from "@formatjs/icu-messageformat-parser"; // the parser next-intl uses
import { keySegment } from "../src/lib/tools/engine-text.ts"; // the key-safe catalogue name (session variable patterns)

/** A catalogue: key under tools.<slug>.engine -> the engine's English. */
type Catalogue = Record<string, string>; // key -> English

/** One tool's catalogue: the prefixes its keys live under, and how to rebuild it from the engine's module. */
interface CatalogueSpec {
  /** Key prefixes (under engine.) that belong to the catalogue, for the stray-key check. */
  prefixes: string[];
  /** Rebuild the catalogue from the engine's exports, with the component's keys. */
  build: (m: any) => Catalogue; // eslint-disable-line @typescript-eslint/no-explicit-any -- each engine's own shapes
  /** The engine module's file name under src/lib/tools/<slug>/ when it is not compute.ts (2026-11-02, batch H6). */
  module?: string;
}

/**
 * Indexed texts into a catalogue: prefix0, prefix1, ... (the positional keys this guard exists for).
 * @param c the catalogue being built
 * @param prefix the key prefix
 * @param xs the texts, in the engine's order
 */
function indexed(c: Catalogue, prefix: string, xs: readonly string[] | undefined): void {
  (xs ?? []).forEach((x, i) => { c[`${prefix}${i}`] = x; }); // one key per position
} // indexed

/** The catalogues, by tool slug. Keys exactly as each component builds them (batch L1, 01/11/2026). */
const CATALOGUES: Record<string, CatalogueSpec> = {
  "f5-dos-vector-explainer": {
    prefixes: ["vec.", "cat.", "catChip.", "field."], // vectors, categories, chips, field notes
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const v of m.VECTORS) { c[`vec.${v.name}.desc`] = v.description; indexed(c, `vec.${v.name}.note`, v.notes); } // vectors
      for (const [k, label] of Object.entries(m.CATEGORY_LABELS)) { c[`cat.${k}`] = label as string; c[`catChip.${k}`] = k; } // categories
      for (const [k, note] of Object.entries(m.FIELD_NOTES)) c[`field.${k}`] = note as string; // field notes
      return c; // built
    },
  },
  "f5-gslb-decision-flow": {
    prefixes: ["method.", "wipMethod.", "tier."], // pool methods, wide-IP methods, tiers
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const x of m.GTM_METHODS) { c[`method.${x.token}.behavior`] = x.behavior; indexed(c, `method.${x.token}.note`, x.notes); } // pool methods
      for (const x of m.WIDEIP_METHODS) c[`wipMethod.${x.token}`] = x.note; // wide-IP methods
      for (const [k, v] of Object.entries(m.TIER_NOTES)) c[`tier.${k}`] = v as string; // tiers
      return c; // built
    },
  },
  "f5-l4-profile-explainer": {
    prefixes: ["profile."], // the cards
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const p of m.PROFILES) { const k = `profile.${p.id}`; c[`${k}.name`] = p.name; c[`${k}.story`] = p.story; indexed(c, `${k}.when`, p.whenToUse); indexed(c, `${k}.tradeoff`, p.tradeoffs); indexed(c, `${k}.quirk`, p.quirks); } // each card
      return c; // built
    },
  },
  "f5-apm-sso-explainer": {
    prefixes: ["method."], // the method cards
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const x of m.METHODS) { const k = `method.${x.id}`; c[`${k}.name`] = x.name; c[`${k}.mechanism`] = x.mechanism; c[`${k}.credentials`] = x.credentials; indexed(c, `${k}.prereq`, x.prerequisites); indexed(c, `${k}.quirk`, x.quirks); } // each card
      return c; // built
    },
  },
  "f5-apm-session-variable-reference": {
    prefixes: ["var.", "family."], // the rows, the family blurbs
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const v of m.VARS) { const k = `var.${keySegment(v.pattern)}`; c[`${k}.meaning`] = v.meaning; c[`${k}.populatedBy`] = v.populatedBy; indexed(c, `${k}.quirk`, v.quirks); } // each row
      for (const [k, v] of Object.entries(m.FAMILY_BLURBS)) c[`family.${k}`] = v as string; // families
      return c; // built
    },
  },
  "f5os-restconf-path-explainer": {
    prefixes: ["module."], // the module descriptions
    build: (m) => Object.fromEntries(m.KNOWN_MODULES.map((x: any) => [`module.${x.module}`, x.governs])), // eslint-disable-line @typescript-eslint/no-explicit-any -- the engine's own shape
  },
  "iquery-protocol-explainer": {
    prefixes: ["topic."], // the topics
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const x of Object.values(m.TOPICS) as any[]) { c[`topic.${x.id}.title`] = x.title; c[`topic.${x.id}.body`] = x.body; } // eslint-disable-line @typescript-eslint/no-explicit-any -- each topic
      return c; // built
    },
  },
  "f5-irules-command-context": {
    prefixes: ["event."], // the event descriptions
    build: (m) => Object.fromEntries(m.EVENTS.map((e: any) => [`event.${e.name}`, e.description])), // eslint-disable-line @typescript-eslint/no-explicit-any -- the engine's own shape
  },
  "f5-persistence-method-explainer": {
    prefixes: ["method."], // the knowledge base (batch H5, 2026-11-02)
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const [t, d] of Object.entries(m.METHODS) as [string, any][]) { // eslint-disable-line @typescript-eslint/no-explicit-any -- each method
        const k = `method.${t}`; // its prefix
        c[`${k}.label`] = d.label; c[`${k}.labelLower`] = d.label.toLowerCase(); c[`${k}.keysOn`] = d.keysOn; c[`${k}.howItWorks`] = d.howItWorks; c[`${k}.goodFor`] = d.goodFor; // its texts
        indexed(c, `${k}.caveat`, d.caveats); // its caveats, by position
        for (const [f, n] of Object.entries(d.fields)) c[`${k}.field.${f}`] = n as string; // its field notes
      }
      return c; // built
    },
  },
  "f5-irules-runtime-calculator": {
    prefixes: ["note."], // the caveat notes, looked up by their NOTES key (batch H5, 2026-11-02)
    build: (m) => Object.fromEntries(Object.entries(m.NOTES).map(([k, v]) => [`note.${k}`, v as string])), // key -> English
  },
  "do-explainer-validator": {
    prefixes: ["class.", "phase."], // class explanations and phase labels, by class name and phase (batch H7, 2026-11-02)
    build: (m) => {
      const c: Catalogue = { "class.unknown": m.UNKNOWN_CLASS_EXPLAIN }; // the not-in-catalogue line
      for (const [k, v] of Object.entries(m.CLASS_CATALOG) as [string, any][]) c[`class.${k}`] = v.explain; // eslint-disable-line @typescript-eslint/no-explicit-any -- each class
      for (const [k, v] of Object.entries(m.PHASE_LABEL)) c[`phase.${k}`] = v as string; // each phase
      return c; // built
    },
  },
  "icontrol-rest-path-explainer": {
    prefixes: ["module."], // the module descriptions, by module name, in the result and the reference panel (batch H7, 2026-11-02)
    build: (m) => Object.fromEntries(m.knownModules().map((x: any) => [`module.${x.module}`, x.governs])), // eslint-disable-line @typescript-eslint/no-explicit-any -- the engine's own shape
  },
  "f5-lb-method-chooser": {
    prefixes: ["method."], // the method table (batch H6, 2026-11-02)
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const x of m.METHODS) { // each method, keyed by its tmsh token
        const k = `method.${x.token}`; // its prefix
        c[`${k}.weighs`] = x.weighs; c[`${k}.behavior`] = x.behavior; c[`${k}.chooseWhen`] = x.chooseWhen; // its texts
        indexed(c, `${k}.caveat`, x.caveats); // its caveats, by position
        c[`${k}.oneLiner`] = x.weighs.charAt(0).toUpperCase() + x.weighs.slice(1) + "."; // the catalogue row's one-liner, derived as the engine derives it
      }
      return c; // built
    },
  },
  "f5-tmsh-config-explainer": {
    prefixes: ["type."], // the object knowledge base (batch H6, 2026-11-02)
    module: "explain", // it lives in explain.ts, beside the parser
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const [t, d] of Object.entries(m.TYPES) as [string, any][]) { // eslint-disable-line @typescript-eslint/no-explicit-any -- each type
        const k = `type.${keySegment(t)}`; // its prefix ("ltm virtual" -> type.ltm_virtual)
        c[`${k}.summary`] = d.summary; // its summary
        for (const [f, n] of Object.entries(d.fields)) c[`${k}.field.${f}`] = n as string; // its field notes
      }
      return c; // built
    },
  },
  "f5-cipher-string-expander": {
    prefixes: ["kw.", "sort."], // keyword labels and notes, sort directives (batch H6, 2026-11-02)
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const [w, d] of Object.entries(m.KEYWORDS) as [string, any][]) { c[`kw.${w}.label`] = d.label; c[`kw.${w}.note`] = d.note; } // eslint-disable-line @typescript-eslint/no-explicit-any -- each keyword
      for (const [w, n] of Object.entries(m.SORT_KEYWORDS)) c[`sort.${w.slice(1)}`] = n as string; // each directive, without its @
      return c; // built
    },
  },
  "telemetry-streaming-explainer": {
    prefixes: ["class.", "role."], // class explanations and role headings, by name (batch H5, 2026-11-02)
    build: (m) => {
      const c: Catalogue = { "class.unknown": m.UNKNOWN_CLASS_EXPLAIN }; // the not-in-catalogue line
      for (const [k, v] of Object.entries(m.CLASS_CATALOG) as [string, any][]) c[`class.${k}`] = v.explain; // eslint-disable-line @typescript-eslint/no-explicit-any -- each class
      for (const [k, v] of Object.entries(m.ROLE_LABEL)) c[`role.${k}`] = v as string; // each role
      return c; // built
    },
  },
  "f5-awaf-declarative-policy-explainer": {
    prefixes: ["group.", "sec."], // group names, section labels and summaries
    build: (m) => {
      const c: Catalogue = {}; // the catalogue
      for (const g of m.GROUPS) c[`group.${g.toLowerCase().replace(/ /g, "-")}`] = g; // groups
      for (const [k, e] of Object.entries(m.REGISTRY) as [string, any][]) { c[`sec.${k}.label`] = e.label; c[`sec.${k}.summary`] = e.summary; } // eslint-disable-line @typescript-eslint/no-explicit-any -- each section
      return c; // built
    },
  },
};

const ROOT = process.cwd(); // the repository root
const load = (loc: string) => JSON.parse(readFileSync(path.join(ROOT, `src/i18n/messages/${loc}.json`), "utf8")); // a pack
const PACKS: Record<string, any> = { en: load("en"), "pt-BR": load("pt-BR") }; // eslint-disable-line @typescript-eslint/no-explicit-any -- nested JSON

/**
 * A flat view of a tool's engine messages: key under engine. -> message.
 * @param pack the pack
 * @param slug the tool
 * @returns the flat map
 */
function engineMessages(pack: any, slug: string): Record<string, string> { // eslint-disable-line @typescript-eslint/no-explicit-any -- nested JSON
  const out: Record<string, string> = {}; // flat
  const walk = (node: unknown, prefix: string) => { // depth first
    if (typeof node === "string") { out[prefix] = node; return; } // a message
    if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, prefix ? `${prefix}.${k}` : k); // deeper
  }; // walk
  walk(pack?.tools?.[slug]?.engine, ""); // from engine.
  return out; // done
} // engineMessages

/**
 * The literal text of a message with no arguments (ICU quoting undone), or null when it holds anything but text.
 * @param msg the message
 * @returns its text, or null
 */
function literalOf(msg: string): string | null {
  try {
    const ast = parse(msg); // as next-intl reads it
    return ast.every((el) => el.type === TYPE.literal) ? ast.map((el) => (el as { value: string }).value).join("") : null; // text only
  } catch { return null; } // not even a valid message
} // literalOf

const problems: string[] = []; // every failure
let checked = 0; // catalogue keys compared
for (const [slug, spec] of Object.entries(CATALOGUES)) { // each tool
  const mod = await import(pathToFileURL(path.join(ROOT, `src/lib/tools/${slug}/${spec.module ?? "compute"}.ts`)).href); // its engine (compute.ts unless the spec names another module)
  const cat = spec.build(mod); // the catalogue as the engine has it now
  const en = engineMessages(PACKS.en, slug); // the en pack's engine messages
  const pt = engineMessages(PACKS["pt-BR"], slug); // the pt-BR pack's
  for (const [key, english] of Object.entries(cat)) { // 1, 2
    checked += 1; // counted
    if (!(key in en)) problems.push(`en: tools.${slug}.engine.${key} is missing (the engine's text: ${JSON.stringify(english.slice(0, 80))})`); // 1: absent
    else if (literalOf(en[key]) !== english) problems.push(`en: tools.${slug}.engine.${key} does not say what the engine says\n      pack:   ${JSON.stringify(en[key].slice(0, 140))}\n      engine: ${JSON.stringify(english.slice(0, 140))}`); // 1: drifted (a reordered list lands here)
    if (!(key in pt)) problems.push(`pt-BR: tools.${slug}.engine.${key} is missing`); // 2
  } // keys
  for (const [loc, flat] of [["en", en], ["pt-BR", pt]] as const) { // 3: strays
    for (const key of Object.keys(flat)) if (spec.prefixes.some((p) => key.startsWith(p)) && !(key in cat)) problems.push(`${loc}: tools.${slug}.engine.${key} is under a catalogue prefix but the engine no longer has it`); // removed item, shortened list
  } // both packs
} // tools

if (problems.length > 0) { // failed
  console.error(`\n[check-engine-catalogue] FAIL: ${problems.length} problem(s)\n`); // headline
  for (const p of problems.slice(0, 40)) console.error(`  - ${p}`); // the first forty
  if (problems.length > 40) console.error(`  ... and ${problems.length - 40} more`); // the rest, counted
  process.exit(1); // a hard stop
} // reported
console.log(`[check-engine-catalogue] OK: ${checked} catalogue key(s) across ${Object.keys(CATALOGUES).length} tool(s): the en pack says exactly what each engine says, pt-BR has every key, and no key outlives its entry.`); // the result
