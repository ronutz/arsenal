// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-rod-voice.mjs
// ----------------------------------------------------------------------------
// THE PSYCHOLOGICAL-OPERATIONS SERIES SPEAKS ONLY FROM ITS SOURCES (PRIME
// 2026-11-09 14:57: "this site never claims right or wrong, it only analyzes
// and reports on the information created and published elsewhere ... Whenever
// there is something with MY (Rod) voice ... the site content guards will
// explicitly and evidently state so").
//
// For every article of the series "psyops" in src/content/learn/series.ts
// (opener and written parts), in English and Brazilian Portuguese:
//   1. the standing note <MethodNote /> is present;
//   2. no opinion block (<RodVoice>, removed 12/11/2026) and no "Rodolfo Nützmann's view"
//      style label anywhere in Learn, the blog or the six message packs (PRIME
//      12/11/2026 15:18: open points are put to the reader as questions,
//      <ReaderQuestions>, never as anyone's opinion);
//   3. the article does not speak in the first
//      person singular (I, me, my; eu, me, meu, minha, mim, comigo). Quoted
//      words (in quotation marks, guillemets or a blockquote) and code are not
//      the article's voice and are not read.
// A failure names the file, the line and the word.
// ============================================================================

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// The tag every line of this guard's output carries.
const TAG = "[check-rod-voice]";
// The series registry and the article folders.
const SERIES = "src/content/learn/series.ts";
const LEARN = "src/content/learn";
// The series this guard governs.
const SERIES_ID = "psyops";

// The series' block in the registry: from its id to the next series' id (or the end of the list).
const registry = readFileSync(SERIES, "utf8");
// Where the series starts, if it is registered yet.
const start = registry.indexOf(`id: "${SERIES_ID}"`);
// Not registered: nothing to check, said plainly.
if (start < 0) {
  console.log(`${TAG} OK: the series "${SERIES_ID}" is not registered yet; nothing to check.`);
  process.exit(0);
}
// The end of the block: the next "id:" after this one.
const nextId = registry.indexOf("id: \"", start + 5);
// The block's text.
const block = registry.slice(start, nextId < 0 ? undefined : nextId);
// The opener and the written parts (planned parts have no slug and no file yet).
const slugs = [...block.matchAll(/(?:opener|slug):\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);

/**
 * First-person singular, per language. English "I" is skipped after the words that make it a numeral or a class, in
 * an identifier that runs on with a hyphen and digits (the FBI IC3's public service announcements, "I-050417-PSA"),
 * and as the letter of a Brazilian article suffix ("article 9º-I"), since 15/11/2026 (psyops Arc 2).
 */
const FIRST_PERSON = {
  en: /(?<!\b(?:War|Class|Phase|Type|Part|Level|Tier|Article|Title|Category|Volume|Schedule|Annex|Appendix|Vol\.)\s)(?<![º°]-)\b(?:I|I'm|I’m|I've|I’ve|I'd|I’d|I'll|I’ll)\b(?!-\d)|\b(?:me|my|mine|myself)\b/g,
  // Case-sensitive, with the capitalised forms listed, so the abbreviation "EU" (European Union, União Europeia) is
  // never read as the pronoun "eu" (2026-11-09, found by the first Portuguese draft).
  "pt-BR": /\b(?:[Ee]u|[Mm]eu|[Mm]eus|[Mm]inha|[Mm]inhas|[Mm]im|[Cc]omigo|[Mm]e)\b/g,
};

/** The text an article speaks in its own voice: no frontmatter, code, quotations or blockquotes. */
function ownVoice(src) {
  // Line numbers are kept: each removed span is replaced by the same number of newlines.
  const blank = (s) => s.replace(/[^\n]/g, " ");
  return src
    // The frontmatter.
    .replace(/^---\n[\s\S]*?\n---\n/, blank)
    // Fenced code.
    .replace(/```[\s\S]*?```/g, blank)
    // Inline code.
    .replace(/`[^`\n]*`/g, blank)
    // Blockquotes: other people's words.
    .replace(/^>.*$/gm, blank)
    // Quotations in curly quotes, straight quotes, guillemets (French spacing included) and single curly quotes.
    .replace(/“[^”]*”|"[^"\n]*"|«[^»]*»|‘[^’\n]*’/g, blank)
    // Link targets (a URL may carry any word).
    .replace(/\]\([^)\s]*\)/g, blank);
}

// Blog posts that join the subject (PRIME 2026-11-09 18:11, the post on apocalyptic predictions): a post whose tags
// include "psychological-operations" is held to the same three rules; its byline is Rodolfo Nützmann's, but his opinions
// still go in labelled blocks.
const BLOG = "src/content/blog";
// The tagged posts, by slug (English frontmatter decides; the Portuguese sibling follows).
const blogSlugs = existsSync(join(BLOG, "en")) ? readdirSync(join(BLOG, "en")).filter((f) => f.endsWith(".mdx")).filter((f) => /^tags:.*"psychological-operations"/m.test(readFileSync(join(BLOG, "en", f), "utf8"))).map((f) => f.replace(/\.mdx$/, "")) : [];
// Every file the guard reads: the series' articles, then the tagged posts.
const targets = [...slugs.map((slug) => ({ slug, dir: LEARN })), ...blogSlugs.map((slug) => ({ slug, dir: BLOG }))];

// The problems found.
const problems = [];
// Articles read.
let read = 0;
for (const { slug, dir } of targets) {
  for (const locale of ["en", "pt-BR"]) {
    // The article's (or post's) file in this language.
    const file = join(dir, locale, `${slug}.mdx`);
    // A missing file is the series guard's to report (check-learn-series); skip it here.
    if (!existsSync(file)) continue;
    read += 1;
    // Its source.
    const src = readFileSync(file, "utf8");
    // 1. The method note.
    if (!/<MethodNote\s*\/>/.test(src)) problems.push(`${file}: no <MethodNote /> (every part of the series carries it)`);
    // 3. No first person outside the blocks.
    const lines = ownVoice(src).split("\n");
    lines.forEach((line, i) => {
      for (const w of line.matchAll(FIRST_PERSON[locale])) problems.push(`${file}:${i + 1}: first person "${w[0]}" (the series speaks from its sources; put an open point to the reader as a question in <ReaderQuestions>, or attribute it)`);
    });
  }
}


// 2. No opinion block and no opinion label anywhere (PRIME 12/11/2026 15:18), whatever the series or language.
const OPINION = /<RodVoice\b|Rodolfo Nützmann['’]s (?:view|opinion|vision|take)|(?:visão|opinião) de Rodolfo|opinión de Rodolfo|Sicht von Rodolfo|point de vue de Rodolfo|punto di vista di Rodolfo/i; // the forms used before
// Every Learn article and blog post in every language folder, and the six written packs.
const opinionFiles = [];
for (const root of [LEARN, BLOG]) {
  // Each language folder under the root.
  for (const loc of existsSync(root) ? readdirSync(root).filter((d) => !d.includes(".")) : []) {
    // Each article or post in it.
    for (const f of readdirSync(join(root, loc)).filter((x) => x.endsWith(".mdx"))) opinionFiles.push(join(root, loc, f));
  }
}
for (const loc of ["en", "pt-BR", "es", "de", "fr", "it"]) opinionFiles.push(join("src/i18n/messages", `${loc}.json`)); // the packs
for (const file of opinionFiles) {
  // A file that names an opinion block or label is a failure, with its line.
  readFileSync(file, "utf8").split("\n").forEach((line, i) => { if (OPINION.test(line)) problems.push(`${file}:${i + 1}: opinion block or label (put open points to the reader as questions in <ReaderQuestions>)`); });
}

// The verdict.
if (problems.length) {
  console.error(`${TAG} FAIL: ${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`${TAG} OK: ${read} file(s): the series "${SERIES_ID}" (${slugs.length} slug(s)) and ${blogSlugs.length} tagged blog post(s): each carries the method note, nothing speaks in the first person, and no opinion block or label appears in Learn, the blog or the six packs (open points are questions for the reader).`);
