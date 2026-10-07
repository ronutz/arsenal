// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-series-list-titles.mjs  (prebuild)
// ----------------------------------------------------------------------------
// A SERIES LIST PRINTS ITS PARTS' TITLES. Added 2026-10-07 (row 59, the
// sweep's fourth build). An article that opens a series lists its parts as
// numbered items, each led by a bold link: "2. **[Title](/learn/slug)**. What
// the part covers." The link's text is the part's title: in the English
// edition 496 of the 500 items print it exactly. When a title changes (the
// titles pass of row 60, a rewrite of the Portuguese sweep), every list that
// prints it must follow, or the reader sees the old title, often in the
// English Title Case the register guard has already removed from the titles
// themselves. On the day this guard arrived, 149 Portuguese items printed a
// former title or a Title Case copy of the current one. Two rules:
//
//   A. At zero: an item whose text differs from its part's title only in
//      letter case (a Title Case remnant, nothing to judge).
//   B. A ratchet: per file, the items whose text is not their part's title may
//      not rise. Some differ on purpose (a rewritten opener already names a
//      part in the register its own title will reach when that part is
//      rewritten), so the count is held, not forced to zero. A new file starts
//      at zero. `--tighten` lowers the baseline where a file's count came down;
//      `--init` writes the baseline from the tree as it stands.
//
// Usage: node scripts/check-series-list-titles.mjs [--tighten | --init]
// ============================================================================

// File access for the articles and the baseline.
import fs from "node:fs";
// Path joining, so the guard runs from the repository root like its siblings.
import path from "node:path";

// The repository root: prebuild runs every guard from there.
const ROOT = process.cwd();
// The articles, one folder per locale.
const LEARN = path.join(ROOT, "src", "content", "learn");
// The ratchet's baseline: per file, the items allowed to differ from their part's title.
const BASELINE = path.join(ROOT, "scripts", "series-list-titles-baseline.json");
// The mode: a plain check, a tightening, or the first write.
const MODE = process.argv.includes("--init") ? "init" : process.argv.includes("--tighten") ? "tighten" : "check";

/** The frontmatter value of one field (titles are always double-quoted in this corpus), or null. */
function field(text, name) {
  // The frontmatter: the block between the first two "---" lines.
  const fm = text.startsWith("---") ? text.slice(3, text.indexOf("\n---", 3)) : "";
  // The field's line, quoted or not.
  const m = fm.match(new RegExp(`^${name}:\\s*(.*)$`, "m"));
  // Absent: null.
  if (!m) return null;
  // The value without its surrounding quotes.
  const v = m[1].trim();
  // A double-quoted value: its inside, with escaped quotes restored.
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/\\"/g, '"');
  // Anything else as written.
  return v;
}

// Every locale folder's articles: per locale, slug to title, and the files to read.
const locales = fs
  .readdirSync(LEARN, { withFileTypes: true }) // the folder's entries
  .filter((d) => d.isDirectory()) // locale folders only
  .map((d) => d.name) // their names
  .sort(); // a stable order for the report
let items = 0; // series-list items read, for the report
const counts = {}; // per file: items whose text is not their part's title
const failures = []; // rule A's failures, one line each

for (const loc of locales) {
  // The locale's article files, in a stable order.
  const dir = path.join(LEARN, loc);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort();
  // Slug to title, the slug read from the frontmatter (a file's name and its slug can differ).
  const titles = new Map();
  // Each file's text, kept for the second pass.
  const texts = new Map();
  for (const f of files) {
    // The file's text.
    const t = fs.readFileSync(path.join(dir, f), "utf8");
    texts.set(f, t);
    // Its slug (the file's name when the frontmatter has none) and its title.
    const slug = field(t, "slug") || f.replace(/\.mdx$/, "");
    const title = field(t, "title");
    if (title) titles.set(slug, title);
  }
  // A series-list item: a numbered or bulleted line led by a bold link to a Learn article (locale names are
  // letters and hyphens, literal in a pattern).
  const ITEM = new RegExp(String.raw`^\s*(?:\d+\.|[-*])\s+\*\*\[([^\]]+)\]\((?:/${loc})?/learn/([a-z0-9-]+)/?(?:#[^)]*)?\)\*\*`, "gm");
  for (const [f, t] of texts) {
    // The path the report and the baseline use.
    const rel = path.posix.join("src/content/learn", loc, f);
    for (const m of t.matchAll(ITEM)) {
      items++; // counted
      // The item's text, and the title of the part it links.
      const [, text, slug] = m;
      const title = titles.get(slug);
      // A link to no article in this locale: check-internal-links' business, not this guard's.
      if (title === undefined) continue;
      // The title, exactly: nothing to say.
      if (text === title) continue;
      // Rule A: the same words in other capitals.
      if (text.toLowerCase() === title.toLowerCase()) failures.push(`  - ${rel}: "${text}" should print the title as written, "${title}"`);
      // Rule B: counted against the file's baseline.
      counts[rel] = (counts[rel] || 0) + 1;
    }
  }
}

// The baseline, or none on the first run.
const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : {};

/** Write a baseline: files in order, zeros left out, two-space JSON with a trailing newline. */
const write = (obj) => {
  // The entries above zero, sorted by file.
  const out = Object.fromEntries(Object.entries(obj).filter(([, n]) => n > 0).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + "\n");
  return out; // what was written
};

// --init: the baseline from the tree as it stands (rule A must already hold).
if (MODE === "init") {
  if (failures.length) { console.error(failures.join("\n")); process.exit(1); } // no remnant may be frozen into the baseline
  const out = write(counts); // written
  console.log(`[check-series-list-titles] baseline written: ${Object.keys(out).length} file(s), ${Object.values(out).reduce((a, b) => a + b, 0)} item(s) that differ from their part's title.`);
  process.exit(0); // nothing more to do
}

// Rule B: no file above its baseline.
const rises = []; // one line per file that rose
let down = 0; // files whose count came down, for --tighten
for (const [rel, n] of Object.entries(counts)) {
  // The file's allowance (zero for a file the baseline does not know).
  const allowed = base[rel] || 0;
  if (n > allowed) rises.push(`  - ${rel}: ${n} item(s) print something other than their part's title (baseline ${allowed}); a renamed part's new title goes into every list that prints it`);
}
// Files whose count fell below the baseline (including to zero).
for (const [rel, allowed] of Object.entries(base)) if ((counts[rel] || 0) < allowed) down++;

// Any failure stops the build, with where and why.
if (failures.length || rises.length) {
  console.error(`\n[check-series-list-titles] FAIL: ${failures.length + rises.length} series list(s) out of step with their parts' titles:\n`);
  console.error([...failures, ...rises].slice(0, 40).join("\n"));
  console.error(`\n  A series list prints each part's title as the part's own frontmatter writes it (row 59).\n`);
  process.exit(1); // the build stops here
}

// --tighten: lower each file's allowance to its count now.
if (MODE === "tighten" && down) {
  const next = { ...base }; // the old allowances
  for (const rel of Object.keys(next)) next[rel] = Math.min(next[rel], counts[rel] || 0); // each lowered to what the file now has
  write(next); // written
}
// The success line.
const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(
  `[check-series-list-titles] OK: ${items} series-list item(s) across ${locales.length} locale(s); none differs from its part's title only in capitals; ` +
    `${total} print other words, none above the baseline` +
    (down ? (MODE === "tighten" ? `; ${down} file(s) went down and the baseline was lowered` : `; ${down} file(s) went down: run with --tighten to lock the gain`) : "") +
    `. Since 2026-10-07 (row 59).`
);
