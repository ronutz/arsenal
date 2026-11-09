#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-interface-packs.mjs   (PREBUILD)
// ----------------------------------------------------------------------------
// EVERY INTERFACE-NATIVE LOCALE IS WHOLE (PRIME 09/11/2026: Spanish, Danish,
// German, Dutch, French and more, "interface + tools" first, each written in the
// language's natural professional tone).
//
// A locale in INTERFACE_LOCALES (src/i18n/locales.ts) other than en and pt-BR
// promises its readers the whole interface in their language. This guard holds
// it to that, so a missing string never falls back to English unnoticed:
//   1. every string of the English pack is in the locale's pack, non-empty,
//      except the corpora that stay English in this phase (glossary.entries,
//      learnLabs) and the raw-literal keys of check-icu-messages (code and JSON
//      samples rendered verbatim);
//   2. every English tool doc (src/content/tool-docs/en/<slug>.md) has its
//      twin in src/content/tool-docs/<locale>/;
//   3. the locale's register file (src/i18n/register/<locale>.json: renderings
//      that read as machine translation to a professional in that language, each
//      with the form to use) finds none of them in the pack or the docs.
// Strings identical to a multi-word English sentence are counted and listed as
// a warning: some are right (quoted vendor text), most would be a leftover.
// With no interface-only locale yet it says so and passes.
// ============================================================================
import fs from "node:fs"; // packs, docs, registry
import path from "node:path"; // paths

// The tag on every line of output.
const TAG = "[check-interface-packs]";
// The registry, read as text (plain node cannot import TypeScript).
const registry = fs.readFileSync("src/i18n/locales.ts", "utf8");
// The interface-native locales.
const interfaceLocales = [...(registry.match(/INTERFACE_LOCALES\s*=\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([A-Za-z-]+)"/g)].map((m) => m[1]);
// A list that cannot be read must fail, not pass silently.
if (!interfaceLocales.includes("en")) {
  // Say so.
  console.error(`${TAG} FAIL: could not read INTERFACE_LOCALES from src/i18n/locales.ts.`);
  // Hard stop.
  process.exit(1);
}
// The locales this guard holds: every interface-native one except the two authored natively from the start.
const held = interfaceLocales.filter((l) => l !== "en" && l !== "pt-BR");
// Nothing to hold yet.
if (held.length === 0) {
  // The pass line.
  console.log(`${TAG} OK: no interface-only locale yet (INTERFACE_LOCALES: ${interfaceLocales.join(", ")}).`);
  // Done.
  process.exit(0);
}
// The corpora that stay English in this phase.
const EXCLUDED = ["glossary.entries.", "learnLabs."];
// The raw-literal keys (rendered verbatim with t.raw()), read from check-icu-messages.
const rawSrc = fs.readFileSync("scripts/check-icu-messages.mjs", "utf8");
// Their exact paths.
const RAW = new Set([...(rawSrc.match(/RAW_LITERAL_KEYS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]));
/**
 * Every leaf of a pack as path -> value (dotted keys, [i] for list items).
 *
 * @param {unknown} o the node
 * @param {string} prefix its path
 * @param {Map<string, unknown>} out the accumulator
 * @returns {Map<string, unknown>}
 */
function flatten(o, prefix = "", out = new Map()) {
  // An object: each key.
  if (o && typeof o === "object" && !Array.isArray(o)) for (const [k, v] of Object.entries(o)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  // A list: each item.
  else if (Array.isArray(o)) o.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  // A leaf.
  else out.set(prefix, o);
  // The map.
  return out;
}
// The English pack, flattened once.
const en = flatten(JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8")));
// The English strings a held locale must carry.
const required = [...en].filter(([k, v]) => typeof v === "string" && v.trim() && !EXCLUDED.some((p) => k.startsWith(p)) && !RAW.has(k));
// The English tool docs.
const docs = fs.readdirSync("src/content/tool-docs/en").filter((f) => f.endsWith(".md"));
// Problems and warnings, per locale.
const problems = [];
const warnings = [];
// Each held locale.
for (const loc of held) {
  // Its pack, flattened.
  const pack = flatten(JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")));
  // 1. Missing or empty strings.
  const missing = required.filter(([k]) => typeof pack.get(k) !== "string" || !String(pack.get(k)).trim()).map(([k]) => k);
  if (missing.length) problems.push(`${loc}: ${missing.length} interface string(s) missing, e.g. ${missing.slice(0, 5).join(", ")}`);
  // Identical to a multi-word English sentence: listed as a warning.
  const same = required.filter(([k, v]) => pack.get(k) === v && /[a-z]{3,} [a-z]{3,} [a-z]{3,} [a-z]{3,}/.test(v)).map(([k]) => k);
  if (same.length) warnings.push(`${loc}: ${same.length} string(s) identical to a multi-word English sentence, e.g. ${same.slice(0, 5).join(", ")}`);
  // 2. Tool docs.
  const noDoc = docs.filter((f) => !fs.existsSync(path.join("src/content/tool-docs", loc, f)));
  if (noDoc.length) problems.push(`${loc}: ${noDoc.length} tool doc(s) missing, e.g. ${noDoc.slice(0, 5).join(", ")}`);
  // 3. The register: renderings to avoid.
  const regFile = `src/i18n/register/${loc}.json`;
  if (!fs.existsSync(regFile)) {
    // A held locale must say what reads as machine translation in its language.
    problems.push(`${loc}: no register file ${regFile}`);
    continue;
  }
  // { "forbidden": [{ "avoid": "...", "use": "...", "why": "..." }] }; matching is case-insensitive on word boundaries.
  const reg = JSON.parse(fs.readFileSync(regFile, "utf8"));
  // The locale's own words only: a quotation of an English source (curly quotes, kept verbatim by the writers) and a
  // code span are not the locale's renderings, so they are blanked before the register reads the text (09/11/2026).
  // A link to an outside source carries that source's published title as its text, which also stays as published.
  const ownWords = (t) => t.replace(/```[\s\S]*?```|`[^`\n]*`|“[^”]*”|\[[^\]\n]*\]\(https?:[^)\s]*\)/g, " ");
  // The texts to scan: the pack's strings (outside the excluded corpora) and the docs.
  const texts = [
    // toolReferences name published works (vendor guides, RFCs) by their published titles: not the locale's words.
    ...[...pack].filter(([k, v]) => typeof v === "string" && !EXCLUDED.some((p) => k.startsWith(p)) && !k.startsWith("toolReferences.")).map(([k, v]) => [`${loc}.json ${k}`, ownWords(v)]),
    ...docs.filter((f) => fs.existsSync(path.join("src/content/tool-docs", loc, f))).map((f) => [`tool-docs/${loc}/${f}`, ownWords(fs.readFileSync(path.join("src/content/tool-docs", loc, f), "utf8"))]),
  ];
  // Each rendering to avoid.
  for (const { avoid, use } of reg.forbidden ?? []) {
    // A whole-word pattern (Unicode-aware, so accented letters count as letters; an identifier's _ / - joins count as
    // part of the word, so "http_loadbalancer" is not the prose word): case-insensitive, except for an
    // acronym (two capitals or more, "VLANs"), which must match as written so a command word ("set vlans") or an ICU
    // argument name ("{urls, plural, ...}") is not taken for it.
    const re = new RegExp(`(?<![\\p{L}\\p{N}_/-])${avoid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_/-])`, /\p{Lu}{2}/u.test(avoid) ? "u" : "iu");
    // Where it occurs.
    const hits = texts.filter(([, v]) => re.test(v)).map(([where]) => where);
    if (hits.length) problems.push(`${loc}: "${avoid}" (use "${use}") in ${hits.length} place(s), e.g. ${hits.slice(0, 3).join("; ")}`);
  }
}
// The warnings, always printed.
for (const w of warnings) console.log(`${TAG} WARN: ${w}`);
// Any problem fails the build.
if (problems.length) {
  // The header.
  console.error(`${TAG} FAIL: ${problems.length} problem(s).`);
  // Each one.
  for (const p of problems) console.error(`  - ${p}`);
  // Hard stop.
  process.exit(1);
}
// The pass line.
console.log(`${TAG} OK: ${held.join(", ")}: ${required.length} interface strings, ${docs.length} tool docs and the register held.`);
