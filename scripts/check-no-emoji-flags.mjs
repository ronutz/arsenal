// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-no-emoji-flags.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: no country flag is ever drawn as an emoji.
//
// PRIME 10/11/2026 23:50: "Please make sure than ALWAYS when you use country flags, you use an alternative that
// ALWAYS renders on ANY regular browser (desktop, mobile)." A flag emoji is two regional indicator letters, and
// Windows ships no glyphs for them, so Chrome, Edge and Firefox on a Windows desktop show "BR" where a phone shows
// a flag. The scores pages did exactly that until 2026-11-10. The site draws flags as SVG only: the hand-drawn set
// in src/components/CountryFlag.tsx and the vendored flag-icons files reached through src/lib/flags.ts.
//
// This guard fails when either way of producing a flag emoji appears in the site's own code or content:
//   1. a literal regional indicator character (U+1F1E6 to U+1F1FF) in any source, content or message file;
//   2. code that builds one from letters: the base code point 0x1F1E6 (127462) or the usual offset 127397.
//
// ALLOWED, and listed by path so the exception is visible: the Python traceback explainer's golden vectors, which
// test a terminal-width table that contains U+1F1E6 as a character, not as a flag.
// ============================================================================

import { readdirSync, readFileSync, statSync } from "node:fs"; // the file walk and reads
import { join, relative } from "node:path"; // paths for the walk and the report

// The folders the site is built from.
const ROOTS = ["src", "worker", "scripts", "public/locales"];
// The file types that can carry a flag into a page.
const EXTENSIONS = [".ts", ".tsx", ".mts", ".mjs", ".js", ".mdx", ".md", ".json", ".css"];
// Files allowed to mention the code point for a reason other than a flag (see the header).
const ALLOWED = new Set(["src/lib/tools/python-traceback-explainer/golden-vectors.ts", "scripts/check-no-emoji-flags.mjs"]);
// A regional indicator character: the two of them make a flag emoji.
const INDICATOR = /[\u{1F1E6}-\u{1F1FF}]/u;
// The two numbers code uses to build one: the base 0x1F1E6 (127462) or the offset 127397 added to a letter.
const BUILDER = /0x1f1e6\b|\b127462\b|\b127397\b|\\u\{1f1e[6-9a-f]\}|\\ud83c\\udde[6-9a-f]/i;

/**
 * Every file under a folder, depth first, skipping dependencies and build output.
 *
 * @param dir the folder
 * @returns the file paths
 */
function walk(dir) {
  // The files found so far.
  const out = [];
  // Each entry in the folder.
  for (const name of readdirSync(dir)) {
    // Dependencies and build output are not the site's own code.
    if (name === "node_modules" || name === ".next" || name === "out") continue;
    // The entry's full path.
    const p = join(dir, name);
    // Folders recurse; files are kept.
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  // Everything under the folder.
  return out;
}

// The problems found.
const problems = [];
// How many files were read.
let scanned = 0;
// Each root, each file of a type that matters.
for (const root of ROOTS) {
  for (const file of walk(root)) {
    // Only the file types that reach a page.
    if (!EXTENSIONS.some((e) => file.endsWith(e))) continue;
    // The path as the report and the allow-list write it.
    const rel = relative(process.cwd(), file).split("\\").join("/");
    // Allowed files are skipped, and counted as read.
    scanned += 1;
    if (ALLOWED.has(rel)) continue;
    // The file's text, line by line, so the report can point at the line.
    const lines = readFileSync(file, "utf8").split("\n");
    // Each line checked for a flag character or a flag builder.
    lines.forEach((line, i) => {
      if (INDICATOR.test(line)) problems.push(`${rel}:${i + 1}: a regional indicator character (flag emoji)`);
      else if (BUILDER.test(line)) problems.push(`${rel}:${i + 1}: code that builds a flag emoji from letters`);
    });
  }
}

// Report and exit: red on any problem, a one-line OK otherwise.
if (problems.length) {
  console.error(`[check-no-emoji-flags] FAIL: ${problems.length} place(s) draw a country flag as an emoji, which Windows desktops show as two letters. Use <CountryFlag> or flagFileFor() (src/lib/flags.ts) instead:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`[check-no-emoji-flags] OK: ${scanned} file(s) read; no flag emoji and no code that builds one (flags are SVG: CountryFlag.tsx and the vendored files through src/lib/flags.ts). Since 2026-11-10 (PRIME 23:50).`);
