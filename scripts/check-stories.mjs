// ============================================================================
// scripts/check-stories.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: the stitcher registry must point at articles that exist.
//
// /stories gathers the Learn articles whose job is to connect other articles.
// It is a page made entirely of references, which is the shape most likely to
// rot: an article gets renamed or retired, the registry keeps its slug, and the
// page ships a link to nothing. The page reads titles and summaries from each
// article's own frontmatter precisely so the COPY cannot drift; this guard
// covers the other half, that the REFERENCES cannot.
//
// What it checks:
//   1. every slug in STORY_GROUPS resolves to an article in BOTH locales - a
//      stitcher that exists only in English would render a short list in
//      Portuguese with no explanation of what was missing;
//   2. no slug appears twice, in the same group or across groups, since the
//      page presents each once and a duplicate would silently render twice;
//   3. every group is non-empty and its i18n heading and lede exist in both
//      message packs, because a group whose copy is missing renders a raw key.
//
// Deliberately NOT checked: whether a given article deserves to be in the
// registry. Membership is an editorial judgement, which is why the registry is
// a hand-written list rather than a frontmatter query - see its header.
// ============================================================================

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "[check-stories]";
const LOCALES = ["en", "pt-BR"];

// The registry is TypeScript; parse the literal rather than adding a compile
// step, the same approach the other content guards take.
const src = readFileSync(path.join(ROOT, "src/content/learn/stories.ts"), "utf8");
const groups = [];
for (const m of src.matchAll(/key:\s*"([^"]+)"\s*,\s*slugs:\s*\[([^\]]*)\]/g)) {
  groups.push({
    key: m[1],
    slugs: [...m[2].matchAll(/"([a-z0-9-]+)"/g)].map((s) => s[1]),
  });
}

const errors = [];
if (!groups.length) {
  errors.push("parsed zero groups - the registry's shape changed and this parser did not");
}

// --- 1 + 2: slugs resolve everywhere, and exactly once ---------------------
const seen = new Map();
for (const g of groups) {
  if (!g.slugs.length) errors.push(`group "${g.key}" is empty`);
  for (const slug of g.slugs) {
    if (seen.has(slug)) {
      errors.push(`"${slug}" is listed twice (groups "${seen.get(slug)}" and "${g.key}")`);
    } else {
      seen.set(slug, g.key);
    }
    for (const loc of LOCALES) {
      const p = path.join(ROOT, "src/content/learn", loc, `${slug}.mdx`);
      if (!existsSync(p)) {
        errors.push(`"${slug}" (group "${g.key}") has no article in ${loc}`);
      }
    }
  }
}

// --- 3: the group copy exists in both packs --------------------------------
for (const loc of LOCALES) {
  const packPath = path.join(ROOT, "src/i18n/messages", `${loc}.json`);
  const pack = JSON.parse(readFileSync(packPath, "utf8"));
  const ns = pack.stories;
  if (!ns) {
    errors.push(`${loc}.json has no "stories" namespace`);
    continue;
  }
  for (const key of ["title", "navLabel", "lede", "count", "closer"]) {
    if (!ns[key]) errors.push(`${loc}: stories.${key} is missing`);
  }
  for (const g of groups) {
    const grp = ns.group?.[g.key];
    if (!grp?.title || !grp?.lede) {
      errors.push(`${loc}: stories.group.${g.key} needs both title and lede`);
    }
  }
}

if (errors.length) {
  console.error(`\n${TAG} FAIL: ${errors.length} problem(s) in the stitcher registry:\n`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(
    `\n  /stories is a page made entirely of references. See the header of\n` +
      `  src/content/learn/stories.ts for what belongs in it and why it is a\n` +
      `  hand-written list rather than a frontmatter query.\n`
  );
  process.exit(1);
}

console.log(
  `${TAG} OK: ${seen.size} stitcher(s) across ${groups.length} group(s); ` +
    `all resolve in ${LOCALES.length} locales, none duplicated, group copy present.`
);
