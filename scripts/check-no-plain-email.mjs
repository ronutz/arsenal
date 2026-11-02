#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// check-no-plain-email (POSTBUILD)  -  no address on the site's own domain is
// served in a form a harvester can read.
// ----------------------------------------------------------------------------
// WHY (PRIME, 27/10/2026 23:12: "the e-mail address needs to be
// spam-crawler-proof"). Checking the built site for the CV that night found the
// contact address in plain text in the hidden admin page's HTML and page data
// (robots: noindex, which harvesters ignore), and the privacy notice writing
// "hello [at] ronutz.com", a disguise harvesters decode. Both were fixed; this
// guard keeps them fixed.
//
// WHAT IS READ. Every file in out/ that a crawler could fetch as text: .html,
// .txt (the page data next to each page), .js, .json, .xml, .md. Three patterns:
//   1. a full address on the domain: local-part@ronutz.com;
//   2. the "[at]" disguise of one: something [at] ronutz.com;
//   3. (01/11/2026) an address spelled as a list of character codes, in order
//      or reversed: the codes of "@ronutz" (64,114,111,110,117,116,122) or
//      their reverse, separated by commas. The contact form's script
//      carried hello@ronutz.com that way, which a harvester decoding number
//      lists reads at once. The protected store (src/lib/protected-email.ts)
//      XORs each code with a key and reverses the list, so it decodes to
//      nothing readable and this pattern does not see it, by design.
// Pattern 1 has one declared exception: /.well-known/security.txt, whose Contact
// field RFC 9116 (section 2.5.3) requires to be a URI a researcher can use as is.
// Pattern 2 had declared exceptions, per route, for the pages that still used the
// older ObfuscatedEmail (it showed "user [at] domain" until the page hydrated).
// The contact and contribute pages moved to ProtectedEmail on 01/11/2026 and the
// component was removed, so the list is empty and must stay so.
// ============================================================================
import fs from "node:fs"; // file reads
import path from "node:path"; // paths

const OUT = "out"; // the build output
const TAG = "[check-no-plain-email]"; // the log prefix
/** A full address on the site's domain. */
const FULL = /[A-Za-z0-9._%+-]+@ronutz\.com\b/g;
/** The "[at]" disguise of one. */
const AT = /[A-Za-z0-9._%+-]+\s*\[at\]\s*ronutz\.com\b/gi;
/**
 * "@ronutz" as character codes, in order (64,114,111,110,117,116,122) or reversed, with or without a space after each
 * comma. Every address on the domain spelled as a code list carries one of the two, whatever its local part. A plain
 * search for these two runs is linear; a general "any list of codes" scan backtracked for minutes on the bundles.
 */
const CODES_AT_DOMAIN = /64, ?114, ?111, ?110, ?117, ?116, ?122|122, ?116, ?117, ?110, ?111, ?114, ?64/g;
/** Files allowed to hold a full address, each with its reason. */
const FULL_ALLOWED = new Map([
  [".well-known/security.txt", "RFC 9116 section 2.5.3: the Contact field is a URI (mailto:) used as written"],
]);
/** Route folders allowed the "[at]" form: none since 01/11/2026 (contact and contribute moved to ProtectedEmail). */
const AT_ALLOWED = []; // empty, and stays empty
/** The extensions read. */
const READ = /\.(html|txt|js|json|xml|md)$/;

if (!fs.existsSync(OUT)) { console.log(`${TAG} SKIP: no ${OUT}/ (run after a build)`); process.exit(0); } // nothing built

const offences = []; // "file: match"
let files = 0; // how many files were read
/**
 * Read every text file under a directory.
 * @param {string} dir the directory
 */
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) { // each entry
    const full = path.join(dir, e.name); // its path
    if (e.isDirectory()) { walk(full); continue; } // descend
    if (!READ.test(e.name)) continue; // not text a crawler reads
    const rel = path.relative(OUT, full).split(path.sep).join("/"); // the served path
    const text = fs.readFileSync(full, "utf8"); // its text
    files++; // counted
    // Each pattern runs only on a file that holds its fixed part (a plain substring test): the patterns open with a
    // character class, which on a long run of letters and digits (a minified bundle, a Base64 blob) retries from every
    // position, and the whole scan took over a minute; the substring test keeps it to seconds and finds the same.
    const lower = text.toLowerCase(); // for the case-blind "[at]" test
    if (!FULL_ALLOWED.has(rel) && text.includes("@ronutz.com")) for (const m of text.matchAll(FULL)) offences.push(`${rel}: ${m[0]}`); // a full address
    const route = rel.split("/")[1] ?? ""; // the folder after the locale
    if (!AT_ALLOWED.includes(route) && lower.includes("[at]") && lower.includes("ronutz.com")) for (const m of text.matchAll(AT)) offences.push(`${rel}: ${m[0]}`); // the disguise
    if (text.includes("114,") || text.includes("114, ")) for (const m of text.matchAll(CODES_AT_DOMAIN)) offences.push(`${rel}: character codes spelling "@ronutz" (${m[0]})`); // the number list
  } // each entry
} // walk
walk(OUT); // read everything

if (offences.length) { // a readable address is served
  console.error(`${TAG} FAIL: ${offences.length} readable address(es) on the site's domain in the build output:`); // the headline
  for (const o of offences.slice(0, 30)) console.error(`  ${o}`); // the first thirty
  console.error("  Show an address through ProtectedEmail (src/components/ProtectedEmail.tsx) with an id from src/lib/protected-email.ts."); // the fix
  process.exit(1); // red
} // offences
console.log(`${TAG} OK: ${files} served text file(s) read; no address on the domain in readable form, neither "[at]" nor as character codes (security.txt excepted by RFC 9116).`); // green
