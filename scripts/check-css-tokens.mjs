#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// check-css-tokens  -  every var(--token) without a fallback names a token
// that is defined somewhere.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 27/10/2026 a select on the LB-method chooser drew no box
// at all on a phone. Its rule said `background: var(--surface)` and
// `border: 1px solid var(--border)`, and neither token had ever been defined:
// the theme's names are --surface-base and --border-subtle. A var() that names
// an undefined property, with no fallback, makes the whole declaration invalid
// at computed-value time, so the property silently falls back to its inherited
// or initial value. The build succeeds, every other guard is green, and the
// border, colour or focus ring is simply not there.
//
// The same scan found 14 such names in about 90 places: --color-accent (25),
// --text-muted (17), --color-muted (11), --color-border (9), --color-text (5),
// --border (5), --accent (3, plus 2 inline styles), --color-surface,
// --color-accent-active, --color-canvas, --color-amber (2 each), --warning,
// --surface, --color-text-muted (1 each). Among the casualties: the "API
// endpoint" labels on 176 tool pages and the family chips on 256 pages (no
// colour of their own, no border), the LTM simulator's active distribution
// bars (no colour at all), the people directory's chips and the focus rings
// of two inputs. All were mapped to the
// theme's own tokens on 27/10/2026 (accent-primary, text-secondary,
// border-subtle, text-primary, surface-base, accent-hover, canvas-primary,
// accent-amber, color-warning).
//
// WHAT COUNTS AS DEFINED. A custom property declared in any stylesheet the
// site loads (src/app, src/styles, src/components), a key of a style object in
// a component ("--x": or ["--x" ...]:), or the `variable:` option of next/font
// (--font-inter, --font-jetbrains-mono are set that way in the locale layout).
// A var() WITH a fallback is not checked: its author said what happens when
// the token is absent.
//
// WHAT IS READ. Every .css file under the three directories, and the inline
// style strings of every .ts and .tsx file under src ("var(--x)" in a string).
// Comments in CSS are removed first, so a rule quoted in a comment is not read.
//
// No baseline: the count was taken to zero the day this guard was written, so
// any new undefined token fails outright.
// ============================================================================
import fs from "node:fs"; // file reads
import path from "node:path"; // path joins

/** Directories that hold stylesheets the site loads (the same list check-css-classes reads). */
const CSS_DIRS = ["src/app", "src/styles", "src/components"]; // stylesheet roots
/** Where component and page code lives. */
const CODE_DIR = "src"; // .ts and .tsx root

/**
 * Every file under a directory whose name passes a test.
 * @param {string} dir the directory to walk
 * @param {(name: string) => boolean} test which file names to keep
 * @param {string[]} out the accumulator
 * @returns {string[]} the paths found
 */
function walk(dir, test, out = []) {
  if (!fs.existsSync(dir)) return out; // a missing directory holds nothing
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) { // each entry
    const full = path.join(dir, e.name); // its path
    if (e.isDirectory()) walk(full, test, out); // descend
    else if (test(e.name)) out.push(full); // keep a matching file
  } // each entry
  return out; // the list
} // walk

const cssFiles = CSS_DIRS.flatMap((d) => walk(d, (n) => n.endsWith(".css"))); // every stylesheet
const codeFiles = walk(CODE_DIR, (n) => /\.(ts|tsx)$/.test(n)); // every component and module

/** CSS text with its comments removed (a rule quoted in a comment is not a rule). */
const stripCssComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ""); // block comments only exist in CSS

const defined = new Set(); // every custom property that has a definition
for (const f of cssFiles) { // each stylesheet
  const t = stripCssComments(fs.readFileSync(f, "utf8")); // its rules
  for (const m of t.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) defined.add(m[1]); // a declaration
} // each stylesheet
for (const f of codeFiles) { // each code file
  const t = fs.readFileSync(f, "utf8"); // its text
  for (const m of t.matchAll(/["'](--[A-Za-z0-9_-]+)["']\s*(?:as\s+[A-Za-z]+\s*)?\]?\s*:/g)) defined.add(m[1]); // a style-object key
  for (const m of t.matchAll(/variable:\s*["'](--[A-Za-z0-9_-]+)["']/g)) defined.add(m[1]); // next/font's variable option
} // each code file

const offences = []; // "file:line var(--x)" for each use of an undefined token without a fallback
const USE = /var\(\s*(--[A-Za-z0-9_-]+)\s*\)/g; // var() with no comma: no fallback
for (const f of cssFiles) { // each stylesheet
  const raw = fs.readFileSync(f, "utf8"); // as written, for line numbers
  const t = raw.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")); // comments blanked, lines kept
  for (const m of t.matchAll(USE)) { // each use
    if (defined.has(m[1])) continue; // a defined token
    const line = t.slice(0, m.index).split("\n").length; // where
    offences.push(`${f}:${line} var(${m[1]})`); // the offence
  } // each use
} // each stylesheet
for (const f of codeFiles) { // each code file
  const raw = fs.readFileSync(f, "utf8"); // its text
  for (const m of raw.matchAll(USE)) { // each use in a string
    if (defined.has(m[1])) continue; // a defined token
    const line = raw.slice(0, m.index).split("\n").length; // where
    offences.push(`${f}:${line} var(${m[1]})`); // the offence
  } // each use
} // each code file

if (offences.length) { // something names a token nobody defined
  console.error(`[check-css-tokens] FAIL: ${offences.length} var() use(s) name a custom property that is never defined and give no fallback, so the declaration is dropped:`); // the headline
  for (const o of offences.slice(0, 60)) console.error(`  ${o}`); // the first sixty
  console.error("  Use the theme's token (src/app/globals.css :root) or add a fallback: var(--x, <value>)."); // how to fix
  process.exit(1); // red
} // offences
console.log(`[check-css-tokens] OK: every var() without a fallback names a defined custom property (${defined.size} defined, ${cssFiles.length} stylesheet(s) and ${codeFiles.length} code file(s) read; at zero since 2026-10-27).`); // green
