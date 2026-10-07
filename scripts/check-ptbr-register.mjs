#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-ptbr-register.mjs - PORTUGUESE THAT READS AS TRANSLATED ENGLISH
// ----------------------------------------------------------------------------
// The Portuguese of this site is written the way a Brazilian instructor writes
// (PRIME, 2026-10-07 06:47 and 06:56, rows 57 and 59 of the queue): natural
// Portuguese sentences; the jargon Brazilian engineers say in English kept in
// English (frame, payload, header, hop, default gateway, resolver, load
// balancer, handshake, ClientHello, duplex mismatch, troubleshooting), with a
// Portuguese gloss at the first use where it helps ("frame (quadro)");
// titles and headings in Portuguese sentence case; quotations of standards in
// their own English words.
//
// WHY THIS EXISTS. The Portuguese articles had been written as renderings of
// their English editions, and PRIME could not follow one of them: "As it is, I
// can't understand several terms and section meanings." The sweep of row 59
// rewrites the corpus in batches; this guard keeps what the sweep fixed from
// coming back, and keeps every new Portuguese page in the register from its
// first build. Every guard in the prebuild chain had passed the whole time:
// none of them reads register.
//
// WHAT IT FLAGS, in two halves.
//
//   A. Every Portuguese title and heading (Learn, tool docs, practice, blog,
//      advisory), AT ZERO, each hit an error and not a judgment call:
//      1. a gerund leading it ("Lendo o status", "Configurando o trunk"), the
//         English -ing;
//      2. a gerund right after its colon ("Filtros de busca LDAP: lendo os
//         parênteses");
//      3. an em dash (U+2014): Portuguese titles here use a colon;
//      4. English Title Case: an ordinary Portuguese word capitalised in the
//         middle of a title ("O Problema do Ano 2038"). "Ordinary" is learnt
//         from the corpus itself: the word appears in lower case in the
//         Portuguese prose at least three times and is never capitalised there
//         in the middle of a sentence. A product or feature name the prose
//         capitalises ("o Data Guard", "o Proactive Bot Defense") passes.
//
//   B. The prose of every Portuguese file, and the Portuguese message pack by
//      namespace, as a RATCHET: the count of jargon rendered in Portuguese
//      where Brazilian engineers say the English ("carga útil" for payload,
//      "aperto de mão" for handshake, "solução de problemas" for
//      troubleshooting) and of English idioms carried over word for word ("no
//      final do dia", "fora da caixa") may not rise above the count recorded
//      in scripts/ptbr-register-baseline.json; a file or namespace not in the
//      baseline starts at zero. A gloss in parentheses ("handshake (aperto de
//      mão)") is the register's own device and is not counted; nor are code,
//      link targets and quotations in English.
//
// THE BASELINE ONLY SHRINKS. When a rewrite brings a count down, the guard
// says so; `node scripts/check-ptbr-register.mjs --tighten` rewrites the
// baseline with every count that went down and never with one that went up.
// A count can rise only by a declaration in DECLARED below, with its reason.
// ============================================================================

// File access for the content and the pack.
import fs from "node:fs";
// Path joining, so the guard runs from the repository root like its siblings.
import path from "node:path";

// The repository root: prebuild runs every guard from there.
const ROOT = process.cwd();
// The Portuguese content folders, each with its file extensions.
const SURFACES = ["learn", "tool-docs", "practice", "blog", "advisory"];
// The authored Portuguese pack; public/locales/pt-BR.json is a copy made from it.
const PACK = path.join(ROOT, "src", "i18n", "messages", "pt-BR.json");
// The ratchet's baseline; `--baseline <file>` points elsewhere (a dry run).
const argBase = process.argv.indexOf("--baseline");
// The baseline file in use.
const BASELINE_FILE = argBase > 0 ? process.argv[argBase + 1] : path.join(ROOT, "scripts", "ptbr-register-baseline.json");
// --tighten: lower the baseline to the current counts where they went down.
const TIGHTEN = process.argv.includes("--tighten");
// --init: write the first baseline from the current counts (used once, when the guard was added).
const INIT = process.argv.includes("--init");

// ---- B. What counts as a rendering of the English, and of which English -----
// Each pattern matches lower-cased prose. PRIME's list of 06:56 first, then the neighbours the sweep met most.
const JARGON = [
  [/\bquadros?\b/g, "frame"],
  [/\bcargas? úte(?:l|is)\b/g, "payload"],
  [/\bcabeçalhos?\b/g, "header"],
  [/\bsaltos?\b/g, "hop"],
  [/\bgateway padrão\b/g, "default gateway"],
  [/\bresolvedor(?:es)?\b/g, "resolver"],
  [/\bbalanceador(?:es)?(?: de carga)?\b/g, "load balancer"],
  [/\bapertos? de mão\b/g, "handshake"],
  [/\bdescompasso de duplex\b/g, "duplex mismatch"],
  [/\b(?:solução|resolução) de problemas\b/g, "troubleshooting"],
  [/\bcomutador(?:es)?\b/g, "switch"],
  [/\bcarimbos? de (?:data|tempo|hora)\b/g, "timestamp"],
  [/\bpontos? de extremidade\b/g, "endpoint"],
  [/\bconjuntos? de cifras?\b/g, "cipher suite"],
  [/\bsoquetes?\b/g, "socket"],
  [/\binquilinos?\b/g, "tenant"],
  [/\bfarejador(?:es)?\b/g, "sniffer"],
  [/\btempo limite\b/g, "timeout"],
  [/\bsinalizador(?:es)?\b/g, "flag"],
  [/\b(?:correspondência|casamento) (?:de prefixo )?mais longo\b/g, "longest match"],
  [/\bhomem[- ]no[- ]meio\b/g, "man-in-the-middle"],
  [/\blaços? de roteamento\b/g, "routing loop"],
];
// English idioms and false friends carried over word for word: each one is a sentence that reads as English.
const IDIOMS = [
  [/\bno final do dia\b/g, "at the end of the day"],
  [/\bfora da caixa\b/g, "out of the box"],
  [/\bblocos? de construção\b/g, "building block"],
  [/\bem ordem (?:a|de) \w+r\b/g, "in order to"],
  [/\bendereçar (?:o|um|esse|este|a|uma) (?:problema|questão|risco)/g, "address a problem"],
  [/\bmandatóri[oa]s?\b/g, "mandatory"],
  [/\brandômic[oa]s?\b/g, "random"],
  [/\balavanc(?:a|ar|am|ando)\b/g, "leverage"],
  [/\bo hábito que paga\b/g, "the habit that pays"],
  [/\bse dobra\b/g, "bends"],
  [/\bandar(?:es)? (?:da|de|do) (?:pilha|modelo|camada)/g, "floor of the stack"],
  [/\bpor design\b/g, "by design"],
  [/\bfaz(?:em)? o trabalho pesado\b/g, "does the heavy lifting"],
  [/\bdito isso\b/g, "that said"],
];

// ---- A. Titles and headings ----
// A first word ending as a gerund ends; the words below end the same way and are not gerunds.
const GERUND = /^(?:[A-Za-zÀ-ÿ]*(?:ando|endo|indo|ondo))$/;
// Nouns, adverbs and adjectives that look like gerunds.
const NOT_GERUND = new Set([
  // Words that only look like gerunds.
  "quando", "comando", "contrabando", "memorando", "brando", "bando", "lindo", "redondo", "hediondo", "nefando",
  "venerando", "doutorando", "mestrando", "graduando", "rondo", "ondo",
  // First names that end the same way.
  "fernando", "orlando", "armando", "rolando",
]);

/** Whether a word is a gerund (not one of the look-alikes). */
function isGerund(word) {
  // Lower case, without the punctuation a heading may carry around it.
  const w = word.toLowerCase().replace(/[^a-zà-ÿ]/g, "");
  // A gerund ends as one and is not a known look-alike.
  return w.length > 3 && GERUND.test(w) && !NOT_GERUND.has(w);
}

/** The prose of a Markdown body: no code, no link targets, no addresses, no headings, no English quotations. */
function prose(body) {
  return body
    // Fenced code blocks: code, not Portuguese.
    .replace(/```[\s\S]*?```/g, " ")
    // Inline code spans.
    .replace(/`[^`\n]*`/g, " ")
    // Link targets (the link text stays: it is prose).
    .replace(/\]\([^)]*\)/g, "]")
    // Bare addresses.
    .replace(/https?:\/\/\S+/g, " ")
    // JSX and HTML tags.
    .replace(/<[^>\n]+>/g, " ")
    // Quotations in English, the standards' own words: an English word right inside the opening quote.
    .replace(/"(?:the|a|an|this|that|it|if|when|each|all|no|any|[A-Z][a-z]+ (?:is|are|was|the|of|to|and|MUST|SHOULD|MAY))\b[^"\n]{8,}"/gi, " ");
}

/** The traces of half B in a stretch of prose: jargon and idioms, outside parenthesised glosses. */
function traces(text) {
  // Glosses in parentheses ("frame (quadro)", "(aperto de mão)") are the register's own device.
  const low = text.replace(/\([^()\n]{0,80}\)/g, " ").toLowerCase();
  // The counts, by kind, with the English each rendering stands for.
  const hits = { J: 0, I: 0, what: [] };
  // Translated jargon.
  for (const [re, eng] of JARGON) {
    // Every occurrence counts.
    const n = (low.match(re) || []).length;
    // Kept with its English for the report.
    if (n) {
      hits.J += n; // the count
      hits.what.push(`${n} × ${eng}`); // and what it stands for, for the report
    }
  }
  // English idioms.
  for (const [re, eng] of IDIOMS) {
    // Every occurrence counts.
    const n = (low.match(re) || []).length;
    // Kept with its English for the report.
    if (n) {
      hits.I += n; // the count
      hits.what.push(`${n} × "${eng}"`); // and the English idiom, for the report
    }
  }
  return hits; // both kinds, with what was found
}

/** A file's title (frontmatter) and headings (## to ####, outside code), each with its kind. */
function titleAndHeadings(text) {
  // The frontmatter title, double-quoted on every Portuguese file.
  const t = text.match(/^title: "(.*)"$/m);
  // The body after the frontmatter's closing line, without fenced code (a "# comment" there is not a heading).
  const body = text.split("\n---\n").slice(1).join("\n---\n").replace(/```[\s\S]*?```/g, "");
  // Both, in order.
  return [...(t ? [["title", t[1]]] : []), ...[...body.matchAll(/^#{2,4} (.+)$/gm)].map((m) => ["heading", m[1]])];
}

// ---- Read the corpus ----
// Every Portuguese content file, with its text.
const files = [];
for (const s of SURFACES) {
  // The surface's Portuguese folder.
  const dir = path.join(ROOT, "src", "content", s, "pt-BR");
  // A surface without a Portuguese folder has nothing to check.
  if (!fs.existsSync(dir)) continue;
  // Markdown and MDX files only, in a stable order.
  for (const f of fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).sort()) {
    // The path the report and the baseline use.
    const rel = path.posix.join("src/content", s, "pt-BR", f);
    // The file's text.
    files.push({ rel, text: fs.readFileSync(path.join(dir, f), "utf8") });
  }
}

// ---- The lexicon for A4: how the Portuguese prose itself writes each word ----
// Lower-case occurrences of each word, and its capitalised occurrences in the middle of a sentence.
const lower = new Map();
const midCap = new Map(); // a capitalised word right after a lower-case letter, a comma or a digit
for (const { text } of files) { // every Portuguese file's prose
  // Prose only, headings dropped (a heading is what is being judged).
  const p = prose(text.split("\n---\n").slice(1).join("\n---\n").replace(/^#{1,6} .*$/gm, " "));
  // Each whole word (not the tail of "iRules" or of a hyphenated name).
  for (const m of p.matchAll(/(?<![A-Za-zÀ-ÿ0-9_-])([A-Za-zÀ-ÿ][a-zà-ÿ]+)(?![A-Za-zÀ-ÿ0-9_-])/g)) {
    // The word, and the last character before it other than spaces (none at the start of a line of prose).
    const w = m[1];
    const before = p.slice(Math.max(0, m.index - 24), m.index).trimEnd().slice(-1); // "" at the start of a line
    // A lower-case word.
    if (w[0] === w[0].toLowerCase()) lower.set(w, (lower.get(w) || 0) + 1);
    // A capitalised word right after a lower-case letter, a comma or a digit: the middle of a sentence.
    else if (/[a-zà-ÿ,0-9]/.test(before)) midCap.set(w, (midCap.get(w) || 0) + 1);
  }
}

/** The English Title Case words of a title or heading: ordinary words capitalised in its middle. */
function titleCaseWords(h) {
  // Link targets and code out; the link text stays.
  const clean = h.replace(/\]\([^)]*\)/g, "]").replace(/`[^`]*`/g, " ");
  // The words in order, each with the punctuation before it.
  const words = [...clean.matchAll(/([^\sA-Za-zÀ-ÿ]*)\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]*)/g)].map((m) => ({ pre: m[1], w: m[2] }));
  // The ones that should not be capitalised there.
  const out = [];
  for (let i = 1; i < words.length; i++) { // the first word is always capitalised
    // The word, and the punctuation between it and the word before.
    const { w, pre } = words[i];
    // After a colon, a question mark, an exclamation or a full stop: a new start, any capital allowed.
    if (/[:?!.]/.test(pre || "")) continue;
    // Only a word capitalised the Title Case way: one capital, then lower case.
    if (!/^[A-ZÀ-Ý][a-zà-ÿ]+$/.test(w)) continue;
    // Ordinary: written in lower case in the prose at least three times, never capitalised mid-sentence.
    const lw = w.toLowerCase();
    if ((lower.get(lw) || 0) >= 3 && !(midCap.get(w) || 0)) out.push(w); // an ordinary word, capitalised
  }
  return out; // empty when the title is in sentence case
}

// ---- Declared exceptions: keyed by file and text, with the reason; they may only shrink ----
const DECLARED = new Map([
  // (none at introduction)
]);
// The declarations that matched, for the stale check.
const declaredSeen = new Set();

// ---- Half A, at zero ----
const failures = [];
// Headings and titles read.
let headsRead = 0;
for (const { rel, text } of files) { // every Portuguese file
  // Each title and heading of the file.
  for (const [kind, h] of titleAndHeadings(text)) {
    // Counted for the report.
    headsRead++;
    // What is wrong with this one, if anything.
    const why = [];
    // The first word, without leading punctuation, numbering or Markdown.
    const first = (h.replace(/^[\s\d.)*_"'`[]+/, "").match(/^[A-Za-zÀ-ÿ]+/) || [""])[0];
    // 1. A gerund leading it.
    if (isGerund(first)) why.push(`led by a gerund ("${first}")`);
    // 2. A gerund right after its colon.
    const afterColon = h.match(/:\s+([A-Za-zÀ-ÿ]+)/);
    if (afterColon && isGerund(afterColon[1])) why.push( // the word right after the colon
      `a gerund after the colon ("${afterColon[1]}")`);
    // 3. An em dash.
    if (h.includes("—")) why.push("an em dash");
    // 4. English Title Case.
    const tc = titleCaseWords(h);
    if (tc.length) why.push(`Title Case (${tc.join(", ")})`); // the words, so the fix is plain
    // Nothing wrong: next.
    if (!why.length) continue;
    // A declared exception passes, and is remembered for the stale check.
    const id = `${rel} :: ${h}`;
    if (DECLARED.has(id)) { // declared, with its reason
      declaredSeen.add(id); // seen, so not stale
      continue; // and not a failure
    }
    // Otherwise a failure, with what is wrong.
    failures.push(`  - ${rel} (${kind}) "${h}": ${why.join("; ")}`);
  }
}

// ---- Half B, the ratchet ----
// The counts now, per file and per namespace.
const now = {};
// Each content file's prose.
for (const { rel, text } of files) {
  // The body after the frontmatter, plus the frontmatter's title and summary (both are prose a reader sees).
  const fm = text.split("\n---\n")[0];
  const summary = (fm.match(/^summary: "(.*)"$/m) || ["", ""])[1]; // the card's lede
  const title = (fm.match(/^title: "(.*)"$/m) || ["", ""])[1]; // the title
  // The traces of the whole prose a reader sees: title, summary and body.
  const h = traces(prose(`${title}\n${summary}\n${text.split("\n---\n").slice(1).join("\n---\n")}`));
  // Only files with something to count enter the record.
  if (h.J || h.I) now[rel] = { J: h.J, I: h.I, what: h.what };
}
// The pack, by top-level namespace, the glossary by entry (its 1,771 entries are rewritten one by one).
const pack = JSON.parse(fs.readFileSync(PACK, "utf8"));
// Every string value, with its namespace.
function walk(node, keys) {
  // An object: its children.
  if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, [...keys, k]);
  // A string: its traces, added to its namespace.
  else if (typeof node === "string") {
    // The namespace: the top-level key, the glossary split by its second level.
    const ns = keys[0] === "glossary" && keys[1] === "entries" && keys.length > 2 ? `messages:glossary.entries.${keys[2]}` : `messages:${keys[0]}`;
    // The value's traces.
    const h = traces(prose(node));
    // Added up per namespace.
    if (h.J || h.I) {
      const c = (now[ns] ||= { J: 0, I: 0, what: [] }); // the namespace's running count
      c.J += h.J; // jargon
      c.I += h.I; // idioms
    }
  }
}
walk(pack, []); // from the pack's root

// The first baseline: written once, from the counts of the day the guard was added.
if (INIT) {
  // Only the counts, in a stable order.
  const base = Object.fromEntries(Object.keys(now).sort().map((k) => [k, { J: now[k].J, I: now[k].I }]));
  // The baseline file, with a note saying what it is.
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({ note: "Row 59 register ratchet: counts may only go down (scripts/check-ptbr-register.mjs).", counts: base }, null, 2) + "\n");
  console.log(`[check-ptbr-register] baseline written: ${Object.keys(base).length} file(s) and namespace(s).`); // what was recorded
  process.exit(0); // nothing to check on the day the baseline is written
}
// The recorded baseline.
const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8")).counts;
// Counts that went down, for the tightening.
const lowered = [];
for (const [k, c] of Object.entries(now)) { // every file and namespace with a trace
  // What the baseline allows (zero for a file or namespace it does not know).
  const b = baseline[k] || { J: 0, I: 0 };
  // Each kind on its own: a fall in one does not buy a rise in the other.
  for (const kind of ["J", "I"]) {
    // A rise is a failure, with what was found.
    if (c[kind] > b[kind]) failures.push(`  - ${k}: ${kind === "J" ? "jargon rendered in Portuguese" : "English idioms"} ${b[kind]} -> ${c[kind]} (${c.what.join(", ")})`);
  }
}
// Every baseline entry whose count went down (or to zero).
for (const [k, b] of Object.entries(baseline)) {
  // The count now (zero when the file or namespace has no trace left).
  const c = now[k] || { J: 0, I: 0 };
  if (c.J < b.J || c.I < b.I) lowered.push(k); // a gain to lock in
}

// THE STALE HALF: a declaration that matched nothing has done its job.
for (const id of DECLARED.keys()) {
  // Unused: it must be removed.
  if (!declaredSeen.has(id)) failures.push(`  - DECLARED "${id}" no longer matches anything and must be removed.`);
}

// --tighten: lower the baseline where counts went down, never raise it.
if (TIGHTEN && lowered.length) {
  // A new baseline: the minimum of the old and the current count, per kind; zero entries dropped.
  const next = {};
  for (const [k, b] of Object.entries(baseline)) { // every recorded entry
    const c = now[k] || { J: 0, I: 0 }; // its count now
    const J = Math.min(b.J, c.J); // never higher than recorded
    const I = Math.min(b.I, c.I); // the same for idioms
    if (J || I) next[k] = { J, I }; // an entry at zero leaves the baseline
  }
  // The lowered baseline, written back.
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({ note: "Row 59 register ratchet: counts may only go down (scripts/check-ptbr-register.mjs).", counts: next }, null, 2) + "\n");
  console.log(`[check-ptbr-register] baseline tightened: ${lowered.length} entr(y/ies) lowered.`);
}

// Any failure stops the build, with every place listed (the first sixty) and how to fix it.
if (failures.length) {
  console.error(`\n[check-ptbr-register] FAIL: ${failures.length} place(s) where the Portuguese reads as translated English:\n`);
  console.error(failures.slice(0, 60).join("\n"));
  if (failures.length > 60) console.error(`\n  ...and ${failures.length - 60} more.`);
  console.error(
    `\n  Write it the way a Brazilian instructor would (row 59): the jargon in English with a gloss in parentheses ` +
      `where it helps, titles and headings in sentence case, never led by a gerund or carrying an em dash. ` +
      `A genuine exception (a product's own capitalised name the prose never capitalises, a quoted title) goes ` +
      `into DECLARED with its reason.\n`
  );
  process.exit(1); // the build stops here
}

// The totals for the success line.
const totJ = Object.values(now).reduce((n, c) => n + c.J, 0);
const totI = Object.values(now).reduce((n, c) => n + c.I, 0); // and idioms left
// The success line: what was read, what holds, and what can be locked in.
console.log(
  `[check-ptbr-register] OK: ${files.length} Portuguese file(s), ${headsRead} title(s) and heading(s) at zero ` +
    `(no gerund leading or after a colon, no em dash, no English Title Case); the ratchet holds ` +
    `(${totJ} jargon rendering(s) and ${totI} idiom(s) left, none above the baseline` +
    `${lowered.length && !TIGHTEN ? `; ${lowered.length} entr(y/ies) went down: run with --tighten to lock the gain` : ""}). ` +
    `${DECLARED.size} declared exception(s), may only shrink. Since 2026-10-07 (row 59).`
);
