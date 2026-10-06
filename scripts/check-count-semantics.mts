// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-count-semantics.mts  (postbuild; run with tsx)
// ----------------------------------------------------------------------------
// THE NUMBER AND ITS NOUN MUST DESCRIBE THE SAME DATASET. Added 2026-10-06 from
// SCOUT's Round 1 adoption audit (REVIEW-chatgpt-round1-adoption-audit-20261006,
// rows 1, 4, 5, 7, 9 and 22): the site derived every count from its registries,
// and still said "Study guides, 105 guides" (the certification figure) beside a
// page of 13 reading paths, "All 411 articles" beside a home page of 720, "87
// tools ... every one of them" beside 183, and "more than a hundred and sixty
// company records" beside 338. A count that is generated can still be wrong in
// what it claims to count. SCOUT's words: "the noun and scope attached to that
// number describe the same dataset."
//
// What it does: computes the named datasets from the same function the pages
// read (src/lib/siteCounts.ts) and asserts, in every locale this build rendered
// in full (en and pt-BR are authored; the others fall back to English copy),
// that each page pairs each figure with the right noun:
//   - the home directory and the user guide's map: the study guides row counts
//     reading paths, the certification row counts certification guides;
//   - the user guide's datasheet: one row per dataset;
//   - Learn's index: the vendor-neutral figure with its noun, the platform
//     figure beside it, and the two adding up to the site-wide total;
//   - Tools' index: the general-purpose figure, the platform figure, the sum;
//   - Speaking: the industry record's size from the registry, no typed figure;
//   - the vendor hubs' description: every hub named;
//   - no hub prints a filter's empty-state line in its static HTML (row 6).
// Every failure names the page, the expected wording and what was found.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { getSiteCounts } from "../src/lib/siteCounts";
import { VENDOR_FAMILIES } from "../src/config/vendors";

const OUT = path.join(process.cwd(), "out");
const TAG = "[check-count-semantics]";

/** The visible text of a built page: scripts and styles out, tags out, entities decoded, whitespace collapsed. */
function textOf(file: string): string {
  const html = fs.readFileSync(file, "utf8");
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
}

/** The text of every list row that links this path: from the link to the end of its <li>, where the home directory
 *  and the guide's map put the count (a sibling span after the anchor). Tags out, whitespace collapsed. */
function rowTexts(file: string, href: string): string[] {
  const html = fs.readFileSync(file, "utf8");
  const out: string[] = [];
  for (const marker of [`href="${href}/"`, `href="${href}"`]) {
    let i = html.indexOf(marker);
    while (i !== -1) {
      const end = html.indexOf("</li>", i);
      if (end !== -1) out.push(html.slice(i, end).replace(/^[^>]*>/, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      i = html.indexOf(marker, i + marker.length);
    }
  }
  return out;
}

/** The content of the page's meta description. */
function metaDescription(file: string): string {
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<meta name="description" content="([^"]*)"/);
  return (m?.[1] ?? "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'");
}

// The wording each locale uses for each dataset. English and Portuguese are authored; a locale not listed here is
// not checked for wording (its copy falls back to English, which the English build checks).
const WORDS: Record<string, {
  readingPaths: (n: string) => string;
  certGuides: (n: string) => string;
  learnNeutral: (n: string) => string;
  learnPlatform: (n: string) => string;
  toolsGeneral: (n: string) => string;
  toolsPlatform: (n: string) => string;
  industry: (n: string) => string;
  dsPaths: (n: string) => string;
  dsGuides: (n: string) => string;
  emptyStates: string[];
  staleTyped: string[];
}> = {
  en: {
    readingPaths: (n) => `${n} reading path`,
    certGuides: (n) => `${n} guides`,
    learnNeutral: (n) => `All ${n} vendor-neutral articles`,
    learnPlatform: (n) => `the ${n} articles about a single vendor's platform`,
    toolsGeneral: (n) => `${n} general-purpose tools`,
    toolsPlatform: (n) => `${n} tools built for a single vendor's platform`,
    industry: (n) => `${n} company records`,
    dsPaths: (n) => `Reading paths ${n}`,
    dsGuides: (n) => `Certification guides ${n}`,
    emptyStates: ["No entries match those filters."],
    staleTyped: ["hundred and sixty company records"],
  },
  "pt-BR": {
    readingPaths: (n) => `${n} trilha`,
    certGuides: (n) => `${n} guias`,
    learnNeutral: (n) => `Todos os ${n} artigos independentes de fabricante`,
    learnPlatform: (n) => `os ${n} artigos sobre a plataforma de um único fabricante`,
    toolsGeneral: (n) => `${n} ferramentas de uso geral`,
    toolsPlatform: (n) => `as ${n} ferramentas feitas para a plataforma de um único fabricante`,
    industry: (n) => `${n} registros de empresas`,
    dsPaths: (n) => `Trilhas de leitura ${n}`,
    dsGuides: (n) => `Guias de certificação ${n}`,
    emptyStates: ["Nenhum verbete corresponde a esses filtros."],
    staleTyped: ["cento e sessenta registros"],
  },
};

const C = getSiteCounts("en");
const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

// Arithmetic first: the scoped figures must add up to the site-wide ones, or the split itself is wrong.
if (C.toolsGeneral + C.toolsPlatform !== C.tools) {
  fail(`tools: general ${C.toolsGeneral} + platform ${C.toolsPlatform} != all ${C.tools} (the catalogue and the config disagree on what is live)`);
}
if (C.articlesNeutral + C.articlesPlatform !== C.articles) {
  fail(`articles: vendor-neutral ${C.articlesNeutral} + platform ${C.articlesPlatform} != all ${C.articles}`);
}

let pagesChecked = 0;
const localesChecked: string[] = [];
for (const locale of Object.keys(WORDS)) {
  const dir = path.join(OUT, locale);
  // A locale counts as built in full when its Learn hub exists; a gated build leaves only chrome-less routes behind.
  if (!fs.existsSync(path.join(dir, "learn", "index.html"))) continue;
  localesChecked.push(locale);
  const W = WORDS[locale];
  const fmt = (x: number) => new Intl.NumberFormat(locale).format(x);
  const page = (rel: string) => path.join(dir, rel, "index.html");
  // `needle` is built with the locale-formatted number; `raw` with the bare digits. ICU prints "{count}" as bare
  // digits ("1762") and a plural's "#" formatted ("1,762"), so either rendering is the same figure.
  const has = (rel: string, needle: string, why: string, raw?: string) => {
    const file = page(rel);
    if (!fs.existsSync(file)) return fail(`${locale}/${rel}: page missing (expected for ${why})`);
    pagesChecked++;
    const text = textOf(file);
    if (!text.includes(needle) && !(raw && text.includes(raw))) fail(`${locale}/${rel}: expected "${needle}" (${why})`);
  };
  const lacks = (rel: string, needle: string, why: string) => {
    const file = page(rel);
    if (!fs.existsSync(file)) return;
    if (textOf(file).includes(needle)) fail(`${locale}/${rel}: must not contain "${needle}" (${why})`);
  };

  // 1. The home directory and the guide's map: each row's anchor carries its own dataset's figure and noun.
  for (const rel of ["", "guide"]) {
    const file = page(rel);
    if (!fs.existsSync(file)) { fail(`${locale}/${rel || "(home)"}: page missing`); continue; }
    pagesChecked++;
    const sg = rowTexts(file, `/${locale}/study-guides`).join(" | ");
    if (!sg.includes(W.readingPaths(fmt(C.readingPaths)))) {
      fail(`${locale}/${rel || "(home)"}: the study guides row should count ${C.readingPaths} reading paths; found "${sg.slice(0, 160)}"`);
    }
    const cg = rowTexts(file, `/${locale}/certifications`).join(" | ");
    if (!cg.includes(W.certGuides(fmt(C.guides)))) {
      fail(`${locale}/${rel || "(home)"}: the certification row should count ${C.guides} guides; found "${cg.slice(0, 160)}"`);
    }
  }
  // 2. The guide's datasheet: one row per dataset.
  has("guide", W.dsPaths(fmt(C.readingPaths)), "the datasheet's reading paths row");
  has("guide", W.dsGuides(fmt(C.guides)), "the datasheet's certification guides row");
  // 3. Learn's index: its own scope named, the platform figure beside it.
  has("learn", W.learnNeutral(fmt(C.articlesNeutral)), "the Learn index states that its figure is the vendor-neutral set");
  has("learn", W.learnPlatform(fmt(C.articlesPlatform)), "the Learn index counts the platform articles beside its own");
  // 4. Tools' index: the general-purpose figure and the platform figure.
  has("tools", W.toolsGeneral(fmt(C.toolsGeneral)), "the Tools index states that its figure is the general-purpose set");
  has("tools", W.toolsPlatform(fmt(C.toolsPlatform)), "the Tools index counts the platform tools beside its own");
  // 5. Speaking: the industry record's size from the registry, and no typed figure left behind.
  has("speaking", W.industry(fmt(C.industry)), "Speaking states the industry record's size from the registry", W.industry(String(C.industry)));
  for (const stale of W.staleTyped) lacks("speaking", stale, "a typed count that went stale");
  // 6. No hub prints a filter's empty-state line in its static HTML.
  for (const rel of ["glossary", "tools", "learn", "industry", "people", "roles", "certifications", "study-guides", "endorsements", "practice", "vendor-hubs"]) {
    for (const empty of W.emptyStates) lacks(rel, empty, "an empty-state line belongs only to a filter that left nothing");
  }
  // 7. The vendor hubs' description names every hub, by its display name.
  const vhFile = page("vendor-hubs");
  if (fs.existsSync(vhFile)) {
    const desc = metaDescription(vhFile);
    const msgs = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "i18n", "messages", `${locale}.json`), "utf8"));
    const missing = VENDOR_FAMILIES.map((f) => msgs.tools?.vendors?.[f.key] ?? f.key).filter((name: string) => !desc.includes(name));
    if (missing.length) fail(`${locale}/vendor-hubs: the meta description omits ${missing.join(", ")} ("${desc.slice(0, 160)}")`);
  }
}

if (localesChecked.length === 0) {
  console.log(`${TAG} SKIP: no locale built in full (no out/<locale>/learn/index.html for en or pt-BR).`);
  process.exit(0);
}
if (problems.length) {
  console.error(`${TAG} FAIL: ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `${TAG} OK: ${localesChecked.join(", ")}; ${pagesChecked} page check(s); tools ${C.tools} = ${C.toolsGeneral} general + ${C.toolsPlatform} platform; ` +
  `articles ${C.articles} = ${C.articlesNeutral} vendor-neutral + ${C.articlesPlatform} platform; ${C.readingPaths} reading paths, ${C.guides} certification guides; ` +
  `industry ${C.industry}; ${VENDOR_FAMILIES.length} hubs named; no static empty states.`,
);
