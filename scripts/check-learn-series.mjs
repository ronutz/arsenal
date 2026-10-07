// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-learn-series.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD (milestone LS-0 of the student level-up, 2026-10-06): the Learn
// series registry (src/content/learn/series.ts) points only at real articles,
// and says what it means.
//
// What it checks, failing the build on any of them:
//   1. series ids are unique and safe as URL fragments;
//   2. every opener and every written part exists in English AND in Portuguese
//      (src/content/learn/<locale>/<slug>.mdx): a series that sends a reader to
//      a missing article in either language is broken in that language;
//   3. no article opens two series; no article appears twice in one series, nor
//      as a part of the series it opens (an article MAY be a part of several
//      series, and an opener a part of another series: that is how they chain);
//   4. every series' name and lede, and every planned part's name, exist in both
//      authored packs (learnSeries.items.<id>.title / .lede / .planned.<key>);
//   5. every series has at least two written articles counting its opener (a
//      series of one is an article);
//   0. every series block is read completely, its group one of SERIES_GROUPS
//      and every group labelled in both packs (LS-1a);
//   2b. every slug is an article's ADDRESS, as the site routes it: the slug its
//      frontmatter declares, else its file name (LS-1b, 2026-10-06: one article
//      lives in bigip-persistence-cookies.mdx at /learn/f5-bigip-persistence-cookies,
//      and a part named by its file name passed rule 2 and linked to nothing);
//   6. every opener's body links every written part of its series, in English
//      and in Portuguese: the opener is the series' map, and a part that lands
//      without the opener pointing at it is a part a reader of the map misses.
// It reports, without failing: the series, their written and planned parts.
// Reads the registry as text, like the other content guards, so it runs in the
// prebuild chain before anything is compiled.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = readFileSync(path.join(ROOT, "src/content/learn/series.ts"), "utf8");
const packs = Object.fromEntries(["en", "pt-BR"].map((l) => [l, JSON.parse(readFileSync(path.join(ROOT, "src/i18n/messages", `${l}.json`), "utf8"))]));

// The registry's array, cut at its declaration; every series object read as a block (LS-1a: robust to the order of
// its fields, so adding one never silently empties the guard), then its fields read inside the block.
const body = SRC.slice(SRC.indexOf("export const LEARN_SERIES: LearnSeries[] = ["));
const series = [];
for (const m of body.matchAll(/\n {2}\{\n([\s\S]*?)\n {2}\},/g)) {
  const block = m[1];
  const field = (name) => (block.match(new RegExp(`\\n? {4}${name}: "([^"]+)",`)) || [])[1];
  const partsText = (block.match(/\n {4}parts: \[([\s\S]*?)\n {4}\],/) || [])[1] ?? "";
  const parts = [...partsText.matchAll(/\{ (slug|planned): "([^"]+)" \}/g)].map((p) => ({ kind: p[1], key: p[2] }));
  series.push({ id: field("id"), group: field("group"), opener: field("opener"), parts });
}
// The subject groups the index lists, from the registry's own declaration.
const GROUPS = JSON.parse((SRC.match(/export const SERIES_GROUPS = (\[[^\]]*\]) as const;/) || [, "[]"])[1]);

const errors = [];
// Every article's address in each language, mapped to its file: the frontmatter's slug where it declares one, else the
// file name (src/lib/learn.ts keys articles the same way).
const ROUTES = Object.fromEntries(
  ["en", "pt-BR"].map((loc) => {
    const dir = path.join(ROOT, "src/content/learn", loc);
    const map = new Map();
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".mdx"))) {
      const head = readFileSync(path.join(dir, f), "utf8").split("\n---", 1)[0];
      const declared = (head.match(/^slug:\s*"?([^"\n]+?)"?\s*$/m) || [])[1];
      map.set(declared || f.slice(0, -4), path.join(dir, f));
    }
    return [loc, map];
  }),
);
const exists = (slug, loc) => ROUTES[loc].has(slug);
// A slug that is a file name but not an address: say which address it should have been.
const misnamed = (slug, loc) => {
  const file = path.join(ROOT, "src/content/learn", loc, `${slug}.mdx`);
  for (const [route, f] of ROUTES[loc]) if (f === file && route !== slug) return route;
  return null;
};

// 0. Every block read completely (a block without an id, a group or an opener means the layout changed).
for (const s of series) {
  if (!s.id || !s.opener || !s.group) errors.push(`a series block could not be read completely (${JSON.stringify(s).slice(0, 120)})`);
}

// 1. Ids: unique, fragment-safe. Groups: declared, and labelled in both packs.
const ids = new Set();
for (const s of series) {
  if (!GROUPS.includes(s.group)) errors.push(`${s.id}: group "${s.group}" is not one of SERIES_GROUPS`);
  if (ids.has(s.id)) errors.push(`series id "${s.id}" is used twice`);
  ids.add(s.id);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s.id)) errors.push(`series id "${s.id}" is not a lower-case slug`);
}

// 2 and 3. Articles: present in both languages; one series opened, one series joined, never one's own.
const openedBy = new Map();
for (const s of series) {
  // The hint names the address when the slug is a file name whose article lives elsewhere (rule 2b).
  for (const loc of ["en", "pt-BR"]) if (!exists(s.opener, loc)) errors.push(`${s.id}: the opener ${s.opener} has no ${loc} article${misnamed(s.opener, loc) ? ` (that is a file name; its address is ${misnamed(s.opener, loc)})` : ""}`);
  if (openedBy.has(s.opener)) errors.push(`${s.opener} opens two series (${openedBy.get(s.opener)}, ${s.id})`);
  openedBy.set(s.opener, s.id);
  const seen = new Set();
  for (const p of s.parts) {
    // Planned keys and slugs alike: nothing listed twice in one series.
    if (seen.has(`${p.kind}:${p.key}`)) errors.push(`${s.id}: ${p.key} is listed twice`);
    seen.add(`${p.kind}:${p.key}`);
    if (p.kind !== "slug") continue;
    for (const loc of ["en", "pt-BR"]) if (!exists(p.key, loc)) errors.push(`${s.id}: the part ${p.key} has no ${loc} article${misnamed(p.key, loc) ? ` (that is a file name; its address is ${misnamed(p.key, loc)})` : ""}`);
    if (p.key === s.opener) errors.push(`${s.id}: the opener is listed as one of its own parts`);
  }
}

// 1b. Every group labelled in both packs (the index's headings).
for (const g of GROUPS) {
  for (const loc of ["en", "pt-BR"]) {
    const label = packs[loc]?.learnSeries?.groups?.[g];
    if (typeof label !== "string" || !label.trim()) errors.push(`${loc}: learnSeries.groups.${g} is missing`);
  }
}

// 4. Words: every series named and introduced, every planned part named, in both packs.
for (const s of series) {
  for (const loc of ["en", "pt-BR"]) {
    const item = packs[loc]?.learnSeries?.items?.[s.id];
    if (typeof item?.title !== "string" || !item.title.trim()) errors.push(`${loc}: learnSeries.items.${s.id}.title is missing`);
    if (typeof item?.lede !== "string" || !item.lede.trim()) errors.push(`${loc}: learnSeries.items.${s.id}.lede is missing`);
    for (const p of s.parts.filter((x) => x.kind === "planned")) {
      const name = item?.planned?.[p.key];
      if (typeof name !== "string" || !name.trim()) errors.push(`${loc}: learnSeries.items.${s.id}.planned.${p.key} is missing`);
    }
  }
}

// 5. A series is at least two written articles.
for (const s of series) {
  const written = 1 + s.parts.filter((x) => x.kind === "slug").length;
  if (written < 2) errors.push(`${s.id}: only ${written} written article; a series needs its opener and at least one part`);
}

// 6. The opener, as the map, links every written part (a link to /learn/<slug> anywhere in its body, in each language).
for (const s of series) {
  for (const loc of ["en", "pt-BR"]) {
    if (!exists(s.opener, loc)) continue;
    const text = readFileSync(ROUTES[loc].get(s.opener), "utf8");
    for (const p of s.parts.filter((x) => x.kind === "slug")) {
      // The link may close with a slash, a fragment, a parenthesis or a quote; it must name the slug whole.
      if (!new RegExp(`/learn/${p.key}(?![a-z0-9-])`).test(text)) errors.push(`${s.id}: the ${loc} opener ${s.opener} does not link its part ${p.key}`);
    }
  }
}

if (!series.length) errors.push("no series could be read from src/content/learn/series.ts (has its layout changed?)");
if (errors.length) {
  console.error(`[check-learn-series] FAIL: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
const written = series.reduce((n, s) => n + 1 + s.parts.filter((x) => x.kind === "slug").length, 0);
const planned = series.reduce((n, s) => n + s.parts.filter((x) => x.kind === "planned").length, 0);
const groupsUsed = new Set(series.map((s) => s.group)).size;
console.log(`[check-learn-series] OK: ${series.length} series in ${groupsUsed} group(s); ${written} written article(s) in both languages, ${planned} planned part(s) named in both packs; no opener twice, no part twice in a series, every opener linking its written parts.`);
