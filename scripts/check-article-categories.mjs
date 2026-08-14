#!/usr/bin/env node
// ============================================================================
// check-article-categories
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-08-14 the pt-BR build died at page zero, logging
// MISSING_MESSAGE for tools.categories.f5, .fortinet and .extreme. The cause
// was seven Learn articles - all written in one session - carrying a VENDOR
// NAME in their `category` field, where the vendor hub looks that value up in
// the tools.categories namespace.
//
// Every other article in the corpus used a valid category. Nothing caught it:
// the build logs the error and keeps going until it does not, tsc cannot see a
// frontmatter string, and no guard was reading this field.
//
// The failure was silent for as long as the build survived it, which is the
// worst kind. This makes it loud and immediate.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const LOCALES = ["en", "pt-BR"];
const messages = JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8"));
const VALID = new Set(Object.keys(messages.tools?.categories ?? {}));

if (VALID.size === 0) {
  console.error("[check-article-categories] FAIL: tools.categories is empty or missing.");
  process.exit(1);
}

const bad = [];
for (const loc of LOCALES) {
  const dir = path.join("src/content/learn", loc);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const src = fs.readFileSync(path.join(dir, file), "utf8");
    const fm = src.startsWith("---") ? src.split("---")[1] : "";
    const m = /^category:\s*(\S+)\s*$/m.exec(fm);
    if (!m) continue;                        // no category is legitimate
    if (!VALID.has(m[1])) bad.push({ loc, file, value: m[1] });
  }
}

if (bad.length > 0) {
  console.error(`\n[check-article-categories] FAIL: ${bad.length} article(s) use a category with no label.\n`);
  console.error("  The vendor hub renders an article's category through");
  console.error("  t(`categories.${a.category}`), so a value outside tools.categories");
  console.error("  throws MISSING_MESSAGE at build time.\n");
  for (const b of bad.slice(0, 12)) {
    console.error(`      ${b.loc}/${b.file}  ->  "${b.value}"`);
  }
  if (bad.length > 12) console.error(`      ... and ${bad.length - 12} more`);
  console.error(`\n  Valid: ${[...VALID].sort().join(", ")}`);
  console.error("  A vendor name is not a category. Pick the one describing the SUBJECT.\n");
  process.exit(1);
}

const counted = LOCALES.reduce((n, loc) => {
  const dir = path.join("src/content/learn", loc);
  return n + (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).length : 0);
}, 0);
console.log(`[check-article-categories] OK: ${counted} article file(s); every category resolves to a label.`);
