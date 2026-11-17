// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-blog.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: blog posts must be complete and bilingual.
//
// Why: the blog (ratified by PRIME 2026-07-23) is dated commentary, and a
// half-authored post is worse than no post - a missing date breaks the
// reverse-chronological index, a missing byline breaks attribution, and an
// English-only post silently violates the site-wide en + pt-BR native-authoring
// rule. Same discipline as check-tool-articles and check-reading-paths.
//
// Checks:
//   1. every en post has all required frontmatter (slug, title, summary,
//      author, date, tags, category, status, updated);
//   2. the frontmatter slug matches the filename;
//   3. date and updated are ISO YYYY-MM-DD;
//   4. the byline is the canonical form "Rodolfo Nützmann" (naming guardrail);
//   5. every en post has a pt-BR sibling (bilingual rule);
//   6. category is one of the site's existing category keys (PRIME: reuse
//      categories, do not invent a parallel taxonomy);
//   7. any relatedArticles slug resolves to a real Learn article in both locales;
//   8. every post has a number, 1..N without gaps or repeats, in date order (16/11/2026);
//   9. every tag in use has a label in each language pack that carries blog tag labels (16/11/2026).
// ============================================================================

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = path.join(root, "src", "content", "blog");
const LEARN = path.join(root, "src", "content", "learn");
const LOCALES = ["en", "pt-BR"];
const REQUIRED = ["slug", "title", "summary", "author", "date", "tags", "category", "status", "updated"];
const CANONICAL_AUTHOR = "Rodolfo Nützmann";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];

/**
 * Read the optional nested `image:` block from a post's frontmatter.
 *
 * The minimal reader above is deliberately line-based and only sees top-level
 * `key: value` pairs, so an indented block is invisible to it. That is exactly
 * how a broken illustration would ship unnoticed while every other check
 * reported green, so the block gets its own reader and its own checks.
 *
 * Returns null when the post has no image, which is the normal case.
 */
function imageBlock(file, key = "image") {
  const raw = readFileSync(file, "utf-8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const lines = m[1].split(/\r?\n/);
  const start = lines.findIndex((l) => new RegExp(`^${key}:\\s*$`).test(l));
  if (start === -1) return null;
  const out = {};
  for (const line of lines.slice(start + 1)) {
    // Stop at the next top-level key: the block ends where indentation does.
    if (/^\S/.test(line)) break;
    const kv = line.match(/^\s+([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/** Minimal frontmatter reader: the block between the first two --- fences. */
function frontmatter(file) {
  const raw = readFileSync(file, "utf-8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      v = v.replace(/^["']|["']$/g, "");
    }
    fm[kv[1]] = v;
  }
  return fm;
}

const enDir = path.join(BLOG, "en");
if (!existsSync(enDir)) {
  console.log("[check-blog] OK: no blog content directory yet (section scaffolded, no posts).");
  process.exit(0);
}

// Category keys the site already uses (source of truth: the tools config).
const toolsSrc = readFileSync(path.join(root, "src", "config", "tools.ts"), "utf-8");
const categories = new Set([...toolsSrc.matchAll(/category:\s*"([a-z-]+)"/g)].map((m) => m[1]));
// Since the 12/11/2026 split, "security" names no tool section but stays a site category for Learn and the blog:
// the shared colour taxonomy (src/config/categoryColors.ts) holds every category key the site uses.
const colorsSrc = readFileSync(path.join(root, "src", "config", "categoryColors.ts"), "utf-8"); // the taxonomy file
const colorsBody = colorsSrc.slice(colorsSrc.indexOf("CATEGORY_COLORS"), colorsSrc.indexOf("};", colorsSrc.indexOf("CATEGORY_COLORS"))); // its key block
for (const m of colorsBody.matchAll(/^\s+([a-z-]+):\s*"#/gm)) categories.add(m[1]); // each key counts as a site category

const enPosts = readdirSync(enDir).filter((f) => f.endsWith(".mdx"));

for (const file of enPosts) {
  const slugFromFile = file.replace(/\.mdx$/, "");
  const fm = frontmatter(path.join(enDir, file));
  if (!fm) {
    errors.push(`en/${file}: no frontmatter block`);
    continue;
  }
  for (const key of REQUIRED) {
    if (fm[key] === undefined || fm[key] === "" || (Array.isArray(fm[key]) && fm[key].length === 0)) {
      errors.push(`en/${file}: missing or empty frontmatter "${key}"`);
    }
  }
  if (fm.slug && fm.slug !== slugFromFile) {
    errors.push(`en/${file}: frontmatter slug "${fm.slug}" does not match filename`);
  }
  for (const dateKey of ["date", "updated"]) {
    if (fm[dateKey] && !ISO.test(fm[dateKey])) {
      errors.push(`en/${file}: ${dateKey} "${fm[dateKey]}" is not ISO YYYY-MM-DD`);
    }
  }
  if (fm.author && fm.author !== CANONICAL_AUTHOR) {
    errors.push(`en/${file}: author must be "${CANONICAL_AUTHOR}" (got "${fm.author}")`);
  }
  if (fm.category && categories.size > 0 && !categories.has(fm.category)) {
    errors.push(`en/${file}: category "${fm.category}" is not an existing site category`);
  }
  // bilingual rule
  const ptFile = path.join(BLOG, "pt-BR", file);
  if (!existsSync(ptFile)) {
    errors.push(`en/${file}: missing pt-BR sibling (every post is authored en + pt-BR)`);
  }
  // An illustration, if present, must be usable: a file that exists under
  // public/, and alt text. An image with no alt is a defect and not a style
  // choice, so it fails rather than warns. Both locales are checked, because a
  // post can legitimately caption its picture differently in each.
  for (const loc of LOCALES) {
    const f = path.join(BLOG, loc, file);
    if (!existsSync(f)) continue;
    // BOTH slots. imageEnd was added 2026-09-11 and would otherwise have been
    // invisible to this guard in exactly the way the indented image block was
    // before it got a reader - a broken closing figure shipping green.
    for (const key of ["image", "imageEnd"]) {
      const img = imageBlock(f, key);
      if (!img) continue;
      if (!img.src) {
        errors.push(`${loc}/${file}: ${key} block has no src`);
      } else if (!existsSync(path.join("public", img.src.replace(/^\//, "")))) {
        errors.push(`${loc}/${file}: ${key} src "${img.src}" does not exist under public/`);
      }
      if (!img.alt) {
        errors.push(`${loc}/${file}: ${key} has no alt text`);
      }
    }
  }

  // related Learn articles must resolve in both locales
  const rel = Array.isArray(fm.relatedArticles) ? fm.relatedArticles : [];
  for (const slug of rel) {
    for (const loc of LOCALES) {
      if (!existsSync(path.join(LEARN, loc, `${slug}.mdx`))) {
        errors.push(`en/${file}: relatedArticles "${slug}" has no ${loc} Learn article`);
      }
    }
  }
}

// 8. Post numbers (PRIME 16/11/2026 03:54: the index shows each post's number). Every English post declares `number`, a
//    positive whole number; together they run 1..N with no gap and no repeat, and they follow the dates, so a later
//    number never carries an earlier date. A translation inherits the number by slug, so a pt-BR file that states one
//    must state the same.
const numbered = []; // [number, date, file] for every English post that declares one
for (const file of enPosts) {
  const fm = frontmatter(path.join(enDir, file)); // its frontmatter
  if (!fm) continue; // already reported above
  if (!/^[1-9]\d*$/.test(String(fm.number ?? ""))) { // missing, zero, negative or not a whole number
    errors.push(`en/${file}: "number" must be a positive whole number (got "${fm.number ?? ""}")`);
    continue;
  }
  numbered.push([Number(fm.number), fm.date ?? "", file]); // kept for the run checks below
  const ptFile = path.join(BLOG, "pt-BR", file); // its translation
  const pt = existsSync(ptFile) ? frontmatter(ptFile) : null; // the translation's frontmatter
  if (pt && pt.number !== undefined && String(pt.number) !== String(fm.number)) { // a translation that disagrees
    errors.push(`pt-BR/${file}: number ${pt.number} differs from the English ${fm.number} (declare it in English only)`);
  }
}
numbered.sort((a, b) => a[0] - b[0]); // in number order
numbered.forEach(([n, , file], i) => { // the run must be 1..N
  if (n !== i + 1) errors.push(`en/${file}: number ${n} breaks the run 1..${numbered.length} (expected ${i + 1}; a gap or a repeat)`);
});
for (let i = 1; i < numbered.length; i++) { // each pair of neighbours
  const [n0, d0, f0] = numbered[i - 1]; // the earlier number
  const [n1, d1, f1] = numbered[i]; // the later number
  if (d1 < d0) errors.push(`en/${f1}: number ${n1} is dated ${d1}, before number ${n0} (${f0}, ${d0}); numbers follow the dates`);
}

// 9. Every tag a post uses has a label in each language pack that carries blog tag labels (the index's filter chips and
//    each card's topics print the label, never the raw key). English must carry them; a pack without a blog.tags block
//    is a stub language that falls back to English.
const MESSAGES = path.join(root, "src", "i18n", "messages"); // the language packs
const usedTags = new Set(); // every tag any English post uses
for (const file of enPosts) {
  const fm = frontmatter(path.join(enDir, file)); // its frontmatter
  for (const t of Array.isArray(fm?.tags) ? fm.tags : []) usedTags.add(t); // each of its tags
}
for (const packFile of readdirSync(MESSAGES).filter((f) => f.endsWith(".json"))) { // each language pack
  const loc = packFile.replace(/\.json$/, ""); // its locale code
  const pack = JSON.parse(readFileSync(path.join(MESSAGES, packFile), "utf-8")); // its strings
  const labels = pack?.blog?.tags; // its tag labels, if it has any
  if (!labels) { // no block
    if (loc === "en") errors.push(`en.json: blog.tags is missing (every post tag needs an English label)`);
    continue; // a stub language falls back to English
  }
  for (const t of usedTags) { // each tag in use
    if (typeof labels[t] !== "string" || labels[t].trim() === "") errors.push(`${loc}.json: blog.tags.${t} has no label`);
  }
}

if (errors.length > 0) {
  console.error("[check-blog] FAIL:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `[check-blog] OK: ${enPosts.length} post(s), frontmatter complete, bylines canonical, en + pt-BR parity, categories reused, numbered 1..${numbered.length}, ${usedTags.size} tags labelled.`,
);
