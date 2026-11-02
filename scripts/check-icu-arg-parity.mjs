#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// check-icu-arg-parity (PREBUILD)  -  every translation of a message takes the
// same ICU arguments as the English message.
// ----------------------------------------------------------------------------
// WHY (01/11/2026). The British spelling sweep of 27/10/2026 renamed an ICU
// argument inside 13 English messages ({normalized} became {normalised}) while
// the components still passed "normalized". check-icu-messages only asks
// whether each message parses, and every one did, so the wheel filename and
// pyproject explainers showed raw message keys on the English site for five
// days, until a Share results helper saw them on a screenshot. An argument
// name is an identifier shared with the code, not prose; the argument set is
// what code and every locale must agree on. The 13 English names are restored
// (the components now pass both spellings as well).
//
// WHAT IT CHECKS. For every key that is a string in en.json and in another
// locale's pack, the set of argument names (plain, number, date, time, select,
// plural and tag arguments, at any depth) must be the same. A message that does
// not parse is check-icu-messages' business and is skipped here. Zero
// tolerance: no baseline.
// ============================================================================
import fs from "node:fs"; // the packs
import path from "node:path"; // their paths
import { parse, TYPE } from "@formatjs/icu-messageformat-parser"; // the parser next-intl uses

const TAG = "[check-icu-arg-parity]"; // the log prefix
const DIR = path.join("src", "i18n", "messages"); // the packs

/**
 * A pack's string values by dotted key.
 * @param {Record<string, unknown>} o the pack (or a branch of it)
 * @param {string} p the key so far
 * @param {Record<string, string>} out the result
 * @returns {Record<string, string>} the flat map
 */
function flat(o, p = "", out = {}) {
  for (const [k, v] of Object.entries(o)) { // each member
    const key = p ? `${p}.${k}` : k; // its dotted key
    if (v && typeof v === "object") flat(v, key, out); // a branch
    else if (typeof v === "string") out[key] = v; // a message
  } // each member
  return out; // done
} // flat

/**
 * The argument names a message uses, at any depth.
 * @param {string} msg the message
 * @returns {string} the names, sorted and joined (null when the message does not parse)
 */
function argsOf(msg) {
  const names = new Set(); // the result
  const walk = (els) => { // each element list
    for (const el of els) { // each element
      if ([TYPE.argument, TYPE.number, TYPE.date, TYPE.time, TYPE.select, TYPE.plural, TYPE.tag].includes(el.type)) names.add(el.value); // an argument
      if (el.options) for (const o of Object.values(el.options)) walk(o.value); // inside a select or plural branch
      if (el.children) walk(el.children); // inside a tag
    } // each element
  }; // walk
  try { walk(parse(msg, { ignoreTag: true })); } catch { return null; } // not ICU: someone else's guard
  return [...names].sort().join(","); // comparable
} // argsOf

const en = flat(JSON.parse(fs.readFileSync(path.join(DIR, "en.json"), "utf8"))); // the reference
const enArgs = new Map(Object.entries(en).map(([k, v]) => [k, argsOf(v)])); // its arguments, once
const problems = []; // what differs
let compared = 0; // keys compared
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "en.json").sort()) { // each other locale
  const loc = flat(JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"))); // its messages
  for (const [k, v] of Object.entries(loc)) { // each of its messages
    const a = enArgs.get(k); // the English arguments
    if (a === undefined || a === null) continue; // no English message, or not ICU
    const b = argsOf(v); // its arguments
    if (b === null) continue; // not ICU
    compared++; // counted
    if (a !== b) problems.push(`${file.replace(".json", "")}: ${k}  en {${a}}  ${file.replace(".json", "")} {${b}}`); // a mismatch
  } // each message
} // each locale

if (problems.length) { // red
  console.error(`${TAG} FAIL: ${problems.length} message(s) take different ICU arguments from English:`); // headline
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`); // the first forty
  console.error("  An argument name is shared with the code that formats the message: keep it identical in every locale (spelling sweeps included)."); // the fix
  process.exit(1); // stop the build
} // red
console.log(`${TAG} OK: ${compared} translated message(s) take exactly the ICU arguments of their English message.`); // green
