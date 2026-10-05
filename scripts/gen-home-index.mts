#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// gen-home-index — THE SMALL INDEX BEHIND "MOST READ" AND "SURPRISE ME".
// ----------------------------------------------------------------------------
// The home page's "What's happening" module (PROPOSTA/REVIEW of 2026-10-04,
// items 17, 18, 49 and 50, PRIME's decisions of 05/10) needs two things the
// static HTML should not carry inline:
//
//   - a way to turn a path the stats API returns ("/en/tools/cidr/") into a
//     title a reader recognises, so "Most read this week" shows names, not
//     slugs; the stats rows carry paths only, by design (worker/stats.ts);
//   - a pool to draw a random destination from for "Surprise me": companies,
//     tools, articles, people, lore terms and certification guides.
//
// So this writes public/home-index.json at prebuild, read lazily by the two
// client components (HomePopular on load, HomeRabbitHole on click), never
// inlined in the page. Generated from the same registries the pages render
// from, so a title here cannot disagree with the page it names. The file is
// gitignored like public/og/: CI regenerates it on every build.
//
// Shape: { generatedAt, entries: [{ k, p, t: { en, "pt-BR"? } }] } where k is
// the kind (tool | article | company | person | term | guide), p the English
// path without the locale prefix, t the titles. About 1,800 entries.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { tools } from "../src/config/tools";
import { partnerVendors } from "../src/content/vendors/partners";
import { GLOSSARY } from "../src/content/glossary/glossary";
import { studyGuides } from "../src/content/certifications/study-guides";

/** Repository root. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "[gen-home-index]";

/** One entry of the index. */
interface Entry {
  k: "tool" | "article" | "company" | "person" | "term" | "guide";
  p: string;
  t: { en: string; "pt-BR"?: string };
}

/** The tool names come from the message packs (the registry holds structure only). */
const en = JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/messages/en.json"), "utf8")) as { tools: Record<string, { name?: string }>; glossary: { entries: Record<string, { def?: string }> } };
const pt = JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/messages/pt-BR.json"), "utf8")) as { tools: Record<string, { name?: string }> };

const entries: Entry[] = [];

// Tools: every available tool, both names.
for (const tool of tools) {
  if (!tool.available) continue;
  const name = en.tools[tool.id]?.name;
  if (!name) continue;
  entries.push({ k: "tool", p: tool.href.replace(/\/$/, "") + "/", t: { en: name, "pt-BR": pt.tools[tool.id]?.name } });
}

// Articles: the Learn corpus, English titles with the Portuguese title where the pair exists.
const learnEn = path.join(ROOT, "src/content/learn/en");
const learnPt = path.join(ROOT, "src/content/learn/pt-BR");
for (const file of fs.readdirSync(learnEn).filter((f) => f.endsWith(".mdx"))) {
  const fm = matter(fs.readFileSync(path.join(learnEn, file), "utf8")).data as { slug?: string; title?: string };
  if (!fm.slug || !fm.title) continue;
  let ptTitle: string | undefined;
  const ptFile = path.join(learnPt, file);
  if (fs.existsSync(ptFile)) ptTitle = (matter(fs.readFileSync(ptFile, "utf8")).data as { title?: string }).title;
  entries.push({ k: "article", p: `/learn/${fm.slug}/`, t: { en: fm.title, "pt-BR": ptTitle } });
}

// Companies: the industry record, one per entry.
for (const v of partnerVendors) {
  entries.push({ k: "company", p: `/industry/${v.slug}/`, t: { en: v.name } });
}

// People and lore terms: glossary entries flagged person, and the lore kind (the strange and the storied).
for (const g of GLOSSARY) {
  if (g.person) entries.push({ k: "person", p: `/glossary/${g.slug}/`, t: { en: g.headword } });
  else if (g.kind === "lore") entries.push({ k: "term", p: `/glossary/${g.slug}/`, t: { en: g.headword } });
}

// Certification guides: the official exam name (verbatim, language-neutral) with its code.
for (const s of studyGuides) {
  entries.push({ k: "guide", p: `/certifications/${s.slug}/`, t: { en: `${s.examName} (${s.examCode})` } });
}

// Every entry must have an English title: an empty one would render as a bare arrow on the home page.
const untitled = entries.filter((e) => !e.t.en || !e.t.en.trim());
if (untitled.length > 0) {
  console.error(`[gen-home-index] FAIL: ${untitled.length} entry(ies) without a title, e.g. ${untitled[0].p}`);
  process.exit(1);
}

// Write, compact, deterministic order (kind, then path) so the file is stable between builds.
entries.sort((a, b) => (a.k === b.k ? a.p.localeCompare(b.p) : a.k.localeCompare(b.k)));
const out = { generatedAt: new Date().toISOString().slice(0, 10), entries };
const dest = path.join(ROOT, "public", "home-index.json");
fs.writeFileSync(dest, JSON.stringify(out));
const counts = entries.reduce<Record<string, number>>((acc, e) => ((acc[e.k] = (acc[e.k] ?? 0) + 1), acc), {});
console.log(`${TAG} OK: ${entries.length} entries (${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(", ")}), ${(fs.statSync(dest).size / 1024).toFixed(0)} KB at public/home-index.json`);
