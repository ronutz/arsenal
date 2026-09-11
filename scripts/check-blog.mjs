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
//   7. any relatedArticles slug resolves to a real Learn article in both locales.
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

if (errors.length > 0) {
  console.error("[check-blog] FAIL:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `[check-blog] OK: ${enPosts.length} post(s), frontmatter complete, bylines canonical, en + pt-BR parity, categories reused.`,
);
