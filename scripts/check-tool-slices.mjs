#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// check-tool-slices (PREBUILD)  -  every message namespace a tool's component
// tree reads is in the slice its tool page gives it.
// ----------------------------------------------------------------------------
// WHY (01/11/2026). The tool page renders each tool as <Component /> chosen from
// TOOL_PAGES, inside <MessageSlice namespaces={[`tools.${slug}`, ...]}>.
// check-client-messages reads which components a page renders from the page's
// text, so a component picked from a map is invisible to it. The URL
// inspector's anatomy strip reads "urlAnatomy", which the slice did not carry:
// its legend showed raw keys (urlAnatomy.scheme ...) and logged MISSING_MESSAGE
// in every browser, and every guard passed. A Share results smoke test found it.
//
// WHAT IT CHECKS, for every entry of TOOL_PAGES in the tool page:
//   1. the namespaces the tool component reads with useTranslations("ns"),
//      itself and every component it imports from @/components, transitively;
//   2. each must be covered by: the tool's own tools.<slug> (by prefix), the
//      slice's fixed members (apiAffordance, share, shareResults), the global
//      client set (src/i18n/clientMessages.ts) or the tool's line in
//      TOOL_EXTRA_NAMESPACES;
//   3. a TOOL_EXTRA_NAMESPACES line no component needs any more is stale: red
//      too, so the list stays exact.
// Text-based, like check-client-messages.
// ============================================================================
import fs from "node:fs"; // file reads
import path from "node:path"; // paths

const TAG = "[check-tool-slices]"; // the log prefix
const PAGE = "src/app/[locale]/tools/[slug]/page.tsx"; // the tool page
const FIXED = ["apiAffordance", "share", "shareResults"]; // the slice's fixed members, besides tools.<slug>

// ---- the global client set, from its source of truth -----------------------
const clientMsg = fs.readFileSync("src/i18n/clientMessages.ts", "utf8"); // the file
const globalBlock = clientMsg.slice(clientMsg.indexOf("GLOBAL_CLIENT_NAMESPACES")); // from the list on
const GLOBAL = [...globalBlock.slice(0, globalBlock.indexOf("]")).matchAll(/"([^"]+)"/g)].map((m) => m[1]); // its names

// ---- every component: its namespaces and the components it imports --------
/** @type {Map<string, {ns: string[], refs: string[]}>} by file base name */
const comps = new Map(); // the scan
/**
 * Read every .tsx under a folder.
 * @param {string} dir the folder
 */
function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) { // each entry
    const full = path.join(dir, e.name); // its path
    if (e.isDirectory()) { scan(full); continue; } // descend
    if (!e.name.endsWith(".tsx")) continue; // components only
    const text = fs.readFileSync(full, "utf8"); // its text
    const ns = [...text.matchAll(/useTranslations\(\s*"([^"]+)"/g)].map((m) => m[1]); // the namespaces it reads
    const refs = [...text.matchAll(/import\s+\w+\s+from\s+"@\/components\/([\w/]+)"/g)].map((m) => m[1].split("/").pop()); // what it imports
    comps.set(e.name.replace(/\.tsx$/, ""), { ns, refs }); // recorded
  } // each entry
} // scan
scan("src/components"); // the components

/**
 * The namespaces a component's tree reads.
 * @param {string} name the component's file base name
 * @param {Set<string>} seen components already walked (imports can cycle)
 * @returns {Set<string>} the namespaces
 */
function needs(name, seen = new Set()) {
  const out = new Set(); // the union
  if (seen.has(name) || !comps.has(name)) return out; // walked, or not a component file
  seen.add(name); // mark it
  const c = comps.get(name); // its record
  for (const n of c.ns) out.add(n); // its own
  for (const r of c.refs) for (const n of needs(r, seen)) out.add(n); // its children's
  return out; // the tree's
} // needs

// ---- the tool page: imports, TOOL_PAGES and TOOL_EXTRA_NAMESPACES ------------
const page = fs.readFileSync(PAGE, "utf8"); // the page's text
const imports = new Map([...page.matchAll(/import\s+(\w+)\s+from\s+"@\/components\/([\w/]+)"/g)].map((m) => [m[1], m[2].split("/").pop()])); // local name -> file
const tools = [...page.matchAll(/"([a-z0-9-]+)":\s*\{\s*\n\s*Component:\s*(\w+)/g)].map((m) => ({ slug: m[1], file: imports.get(m[2]) ?? m[2] })); // each tool page
const extraBlock = page.slice(page.indexOf("const TOOL_EXTRA_NAMESPACES")); // the list's text, from its start
const extraBody = extraBlock.slice(extraBlock.indexOf("{") + 1, extraBlock.indexOf("};")); // its body
const extras = new Map([...extraBody.matchAll(/"([a-z0-9-]+)":\s*\[([^\]]*)\]/g)].map((m) => [m[1], [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1])])); // slug -> namespaces

if (tools.length < 100) { console.error(`${TAG} FAIL: read only ${tools.length} tool page(s) from ${PAGE}; the pattern no longer matches the file.`); process.exit(1); } // the reader broke

const problems = []; // what is wrong
for (const { slug, file } of tools) { // each tool
  const need = needs(file); // what its tree reads
  const listed = extras.get(slug) ?? []; // what the page adds for it
  const covered = (n) => n.startsWith(`tools.${slug}`) || FIXED.includes(n) || GLOBAL.includes(n) || listed.includes(n); // in its slice
  for (const n of need) if (!covered(n)) problems.push(`${slug} (${file}) reads "${n}", which its slice does not carry: add it to TOOL_EXTRA_NAMESPACES`); // missing
  for (const n of listed) if (!need.has(n)) problems.push(`${slug}: TOOL_EXTRA_NAMESPACES lists "${n}", which no component of the tool reads: remove it`); // stale
} // each tool

if (problems.length) { // red
  console.error(`${TAG} FAIL: ${problems.length} problem(s):`); // headline
  for (const p of problems) console.error(`  ${p}`); // each
  process.exit(1); // stop the build
} // red
console.log(`${TAG} OK: ${tools.length} tool page(s); every namespace their component trees read is in their slice (${extras.size} with extra namespaces).`); // green
