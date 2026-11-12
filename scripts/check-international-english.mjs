#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// check-international-english.mjs: THE SITE'S ENGLISH IS INTERNATIONAL ENGLISH (en-001), IN OXFORD SPELLING.
// ----------------------------------------------------------------------------
// WHY (PRIME 11/11/2026 00:09, "convert the English on the site to International English according to standard code
// en-001"; 01:30, "Treat the international English conversion as a new language addition: go now over interface,
// tool/ puzzles toys and games"; 10:33, "Oxford"). CLDR's en-001 settles formats (src/i18n/locales.ts,
// ENGLISH_FORMAT_TAG), not spelling. The spelling is Oxford spelling, British spelling with -ize, the house style of
// ISO ("ISO documents use Oxford English spelling, which is British spelling in combination with the suffix -ize",
// iso.org/ISO-house-style.html, read 11/11/2026), of the United Nations (the Oxford Dictionary set to British English)
// and of ETSI: -ize for the verb suffix (organize, authorization, tokenizer), -ise kept where it is no suffix (advise,
// revise, supervise, exercise, compromise, surprise, practise), -yse (analyse, paralyse), -our, -re, a doubled l
// before a suffix, "licence" as the noun. The 11/11/2026 passes converted 207 interface strings, 75 engine sentences
// and 32 tool documents to British spelling (00:09 to 01:50), then 386 interface strings, 101 engine sentences and 84 tool
// documents from -ise to -ize (10:33); this guard keeps the count at zero.
//
// SCOPE: (1) the phase-1 English, the surface the other interface languages are written from: every en pack string
// outside glossary.entries, learnLabs, toolReferences, toolProvenance and materials, and every English tool document;
// (2) since 11/11/2026 11:00 (PRIME: "Expand Oxford and the other English adjustments to the remaining content
// surfaces"), the corpus: those five pack sections (toolReferences, titles of external documents, stays verbatim;
// so do toolProvenance titles and the glossary entry en-001, which sets the two spellings side by side), the English
// Learn, blog, practice and advisory pages (MDX), and the prose in src/content/**/*.ts (not the pt-BR overlays, the
// testimonials or the BOFH excuses, which are quotations). The corpus is held a little differently, because it
// names more people, companies and standards: an American word is a finding only in lower case (Neighbor Discovery,
// Center for Internet Security and Department of Defense are names); a capitalised -ise word only at the start of a
// sentence and not before another capitalised word; a month-first date ("October 3, 2026") is a finding too; and an
// MDX page is not read in its front matter (but its title, summary and description), its Sources section, its
// blockquotes, JSX tags and {expressions}.
//
// WHAT IS NOT A FINDING: code (fenced blocks, backticks), URLs, tags, quotations ("..." and “...”), Markdown link
// texts and italic titles (often a document's own title), ICU syntax and placeholders, identifiers (a word joined by
// - _ . / = : # @ { } or followed by "("), capitalised words mid-sentence (proper names and defined terms: the HTTP
// Authorization header, Organization Validation, FortiAnalyzer), and the terms standards define, listed in KEEP below.
// A genuine exception goes into DECLARED with its reason.
//
// Run: node scripts/check-international-english.mjs   (read-only; part of prebuild)
// ============================================================================
import fs from "node:fs"; // file reads only
import path from "node:path"; // path joins

/** American form -> British form, for the words that are not -ize/-yze verbs (lower case). */
const WORDS = new Map(Object.entries({
  color: "colour", colors: "colours", colored: "coloured", coloring: "colouring", colorful: "colourful",
  neighbor: "neighbour", neighbors: "neighbours", neighboring: "neighbouring",
  behavior: "behaviour", behaviors: "behaviours", behavioral: "behavioural",
  favor: "favour", favors: "favours", favored: "favoured", favorable: "favourable", favorite: "favourite",
  honor: "honour", honored: "honoured", honors: "honours", flavored: "flavoured", armored: "armoured",
  center: "centre", centers: "centres", centered: "centred", fiber: "fibre", fibers: "fibres",
  defense: "defence", defenses: "defences", toward: "towards", afterward: "afterwards", gray: "grey",
  labeled: "labelled", labeling: "labelling", signaling: "signalling", traveled: "travelled",
  canceled: "cancelled", canceling: "cancelling", modeled: "modelled", modeling: "modelling",
  leveled: "levelled", totaled: "totalled", enrollment: "enrolment", enrollments: "enrolments",
  fulfill: "fulfil", fulfills: "fulfils", fulfillment: "fulfilment",
  acknowledgment: "acknowledgement", acknowledgments: "acknowledgements", catalog: "catalogue", catalogs: "catalogues",
  kilometer: "kilometre", kilometers: "kilometres", centimeter: "centimetre", centimeters: "centimetres",
  millimeter: "millimetre", millimeters: "millimetres", nanometer: "nanometre", nanometers: "nanometres",
}));
/** Bases that end in -ise but are not the -ize suffix: Oxford spelling keeps them (ISO's table: advise, revise, supervise). */
const NOT_IZO = new Set(["advertise", "advise", "apprise", "arise", "chastise", "circumcise", "comprise", "compromise",
  "concise", "demise", "despise", "devise", "disguise", "enterprise", "excise", "exercise", "expertise", "franchise",
  "improvise", "incise", "merchandise", "noise", "poise", "practise", "precise", "premise", "promise", "raise", "praise",
  "appraise", "braise", "revise", "rise", "supervise", "unsupervise", "surmise", "surprise", "televise", "treatise",
  "cruise", "bruise", "guise", "paradise", "reprise", "valise", "sunrise", "uprise", "imprecise", "disenfranchise",
  "turquoise", "tortoise", "porpoise", "cerise", "chemise", "mortise", "anise",
  "microenterprise"]); // the ANPD's sanction on a microenterprise (glossary anpd, 12/11/2026): enterprise with a prefix
/** An -ise word and its suffixes: organise, organisation, tokeniser (the British form Oxford spelling writes -ize). */
const ISE = /^([a-z]+?)is(e|es|ed|ing|ation|ations|er|ers|able|ational)$/;
/** Words that end in -ize but are not the American spelling of anything (size, seize, citizen...). */
const NOT_IZE = new Set(["size", "sizes", "sized", "sizing", "prize", "prizes", "seize", "seized", "seizes", "seizing",
  "capsize", "resize", "resized", "resizes", "resizing", "oversize", "oversized", "undersized", "downsize", "citizen",
  "citizens", "maize", "freeze", "bufsize", "wsize", "pagesize", "filesize", "baize", "assize"]);
/** An -ize/-yze word and its suffixes: optimize, organization, analyzer. */
const IZE = /^([a-z]+?)(iz|yz)(e|es|ed|ing|ation|ations|er|ers|able|ational)$/;
/** Terms standards and vendors define in American spelling, kept as they write them (case-insensitive phrases). The
 *  -ize terms (OAuth's "authorization code", Unicode's "normalization forms", IDNA's "internationalized domain names")
 *  needed no entry once the site wrote Oxford spelling (11/11/2026). */
const KEEP = [
  /range, color/gi, /gray and grey/gi, // HTML's input type, CSS's two spellings
  /bot defense/gi, /defense attributes/gi, // F5's product and policy names
  /gray failures?/gi, // the term Huang et al. named in "Gray Failure: The Achilles' Heel of Cloud-Scale Systems" (HotOS 2017); the glossary's gray-failure headword
];
/** Pack paths outside the check: external titles, protocol and file field names, the US-English courses. */
const SKIP_PREFIXES = ["glossary.entries.", "learnLabs.", "toolReferences.", "toolProvenance.", "materials.",
  "tools.bit-numbering-and-order.engine.gloss.", // RFC 793's own flag descriptions ("Acknowledgment field is significant")
  "tools.f5-dos-vector-explainer.engine.cat.behavioral", "tools.f5-dos-vector-explainer.engine.catChip.behavioral", // F5's category
  "bossScreens.blurb.tk90x", // the TK90X Color Computer, a product's name
];
/** Declared exceptions: "<path or doc>:<word>" -> reason. Empty since 11/11/2026; may only hold real exceptions. */
const DECLARED = new Map([]);
/** What is never read: code, URLs, tags, quotations, link texts, italic titles, ICU headers and option keys. */
const PROTECT = /```[\s\S]*?```|`[^`\n]*`|"[^"\n]{3,}?"|“[^”]*”|\[[^\]\n]*\]\(|(?<![*\w])\*[^*\n]{3,}?\*(?![*\w])|https?:\/\/[^\s)\]>"']+|<[^>\n]+>|\]\([^)]*\)|\{\s*\w+\s*,\s*(?:select|plural|selectordinal)\s*,|\b\w+\s*\{(?=[^{}]*\})/g;

/** The Oxford form of a word that is not Oxford spelling, or null when the word is fine. */
function british(word) {
  const lw = word.toLowerCase(); // compare in lower case
  if (WORDS.has(lw)) return WORDS.get(lw); // an American word: colour, centre, towards...
  const s = ISE.exec(lw); // an -ise form?
  if (s && s[1].length >= 3 && !NOT_IZO.has(`${s[1]}ise`) && !`${s[1]}ise`.endsWith("wise")) return `${s[1]}iz${s[2]}`; // -ise suffix: Oxford writes -ize
  const m = IZE.exec(lw); // an -ize/-yze form?
  if (!m || NOT_IZE.has(lw) || m[1].length < 2 || m[2] === "iz") return null; // not one, or -ize, which Oxford keeps
  return `${m[1]}ys${m[3]}`; // -yze: Oxford, like British, writes -yse (analyse)
}

/** True when position i begins a sentence, a list item, a heading, a table cell or the string. */
function sentenceStart(text, i) {
  const before = text.slice(0, i).replace(/[ \t*_"'(“‘«]+$/, ""); // drop the opening marks
  return before === "" || ".!?:\n|#-•;".includes(before.at(-1)) || /[—–]$/.test(before); // what may precede a sentence
}

/** Every American spelling in one string, as [word, suggestion, context]. */
function findings(text) {
  const spans = []; // [start, end) ranges never read
  for (const re of [PROTECT, ...KEEP]) for (const m of text.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  const inside = (a, b) => spans.some(([s, e]) => s <= a && b <= e); // within a protected range
  const out = []; // the findings
  for (const m of text.matchAll(/[A-Za-z]+/g)) {
    const w = m[0], a = m.index, b = a + w.length; // the word and its position
    const sug = british(w); // its British form, if it is American
    if (!sug || inside(a, b)) continue; // not American, or protected
    const prev = text.slice(a - 1, a), next = text.slice(b, b + 1); // its neighbours
    if ((prev && "-_./=:#@$\\{".includes(prev)) || (next && "-_/=@\\(}".includes(next))) continue; // an identifier
    if (next === "." && /[A-Za-z0-9]/.test(text.slice(b + 1, b + 2))) continue; // a dotted name
    if (/[0-9]/.test(prev)) continue; // glued to a number
    if (w[0] === w[0].toUpperCase() && w !== w.toUpperCase() && !sentenceStart(text, a)) continue; // a proper name or term
    if (w.length > 1 && w === w.toUpperCase()) continue; // an upper-case constant
    if (/^[a-z]+[A-Z]/.test(w) || /^[A-Z][a-z]+[A-Z]/.test(w)) continue; // camelCase or a brand (FortiAnalyzer)
    out.push([w, sug, text.slice(Math.max(0, a - 40), b + 40).replace(/\n/g, " ")]); // a finding
  }
  return out; // possibly empty
}

/** Walk a pack, yielding [dotted path, string] for every string leaf (arrays as path[i]). */
function* leaves(node, p = "") {
  if (typeof node === "string") { yield [p, node]; return; } // a leaf
  if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) yield* leaves(node[i], `${p}[${i}]`); return; } // a list
  if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) yield* leaves(v, p ? `${p}.${k}` : k); // an object
}

/** Corpus: words that look like -ise forms but are names or other words (survey of 11/11/2026). */
const NEVER = new Set(["anchises", "blaise", "dieise", "benckiser", "inprise", "errdisable", "fortianalyzer", "inadvisable",
  "unadvertised", "uncompromising", "unpromising", "denise", "elise", "louise"]);
/** Corpus: British proper names written -is- (OECD, ASIO, CSIRO, Europol's IOCTA, CLDR's own labels). */
const KEEP_NAMES = /Organisation (?:for|of)\b[^.;:\n]{0,60}|\b(?:Intelligence|Research|Technology|Security) Organisation\b|Internet Organised Crime[^.;\n]{0,40}|Normalised Sorting|Sort Without Normalisation/g;
/** Corpus: unmarked quotations, kept as their sources wrote them (the whole paragraph). */
const PARA_SKIP = ["Ethereal is a network analyzer that lets you capture and interactively browse"]; // Gerald Combs, 14 July 1998
/** A date written month first: "October 3, 2026". */
const US_DATE = /\b(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2})(?:st|nd|rd|th)?, (\d{4})\b/g;

/** Corpus findings: as findings(), with the corpus rules (lower-case American words, sentence-start -ise, dates). */
function corpusFindings(text, extra = []) {
  const spans = [...extra]; // [start, end) ranges never read
  for (const re of [PROTECT, ...KEEP, KEEP_NAMES]) for (const m of text.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  const inside = (a, b) => spans.some(([s, e]) => s <= a && b <= e); // within a protected range
  const out = []; // the findings
  for (const m of text.matchAll(/[A-Za-z]+/g)) {
    const w = m[0], a = m.index, b = a + w.length, lw = w.toLowerCase(); // the word and its position
    if (NEVER.has(lw) || inside(a, b)) continue; // a name, or protected
    const sug = british(w); // its Oxford form, if it is not Oxford
    if (!sug) continue; // fine
    const prev = text.slice(a - 1, a), next = text.slice(b, b + 1); // its neighbours
    if ((prev && "-_./=:#@$\\{".includes(prev)) || (next && "-_/=@\\(}".includes(next))) continue; // an identifier
    if (next === "." && /[A-Za-z0-9]/.test(text.slice(b + 1, b + 2))) continue; // a dotted name
    if (/[0-9]/.test(prev)) continue; // glued to a number
    if (w.length > 1 && w === w.toUpperCase()) continue; // an upper-case constant
    if (/^[a-z]+[A-Z]/.test(w) || /^[A-Z][a-z]+[A-Z]/.test(w)) continue; // camelCase or a brand
    if (w[0] !== lw[0]) { // capitalised
      if (!ISE.test(lw)) continue; // an American word with a capital: a name or a defined term
      if (!sentenceStart(text, a)) continue; // mid-sentence: a proper name
      if (/^ [A-Z][a-z]/.test(text.slice(b, b + 3))) continue; // before another capitalised word: a name
    }
    out.push([w, sug, text.slice(Math.max(0, a - 40), b + 40).replace(/\n/g, " ")]); // a finding
  }
  for (const m of text.matchAll(/\b\d[\d,.]* meters?\b/g)) if (!inside(m.index, m.index + m[0].length)) out.push([m[0], m[0].replace("meter", "metre"), text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\n/g, " ")]); // a unit after a number
  for (const m of text.matchAll(US_DATE)) if (!inside(m.index, m.index + m[0].length)) out.push([m[0], `${Number(m[2])} ${m[1]} ${m[3]}`, text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\n/g, " ")]); // a month-first date
  return out; // possibly empty
}

/** The parts of an MDX page never read: front matter but its title, summary and description; a Sources section to
 *  the end; blockquotes; JSX tags and {expressions}; HTML comments; the unmarked quotations in PARA_SKIP. */
function mdxSpans(t) {
  const spans = []; // [start, end)
  if (t.startsWith("---")) {
    const end = t.indexOf("\n---", 3); // the front matter's end
    if (end > 0) {
      let pos = 0; // the line's offset
      for (const line of t.slice(0, end).split("\n")) { if (!/^(title|summary|description):/.test(line)) spans.push([pos, pos + line.length]); pos += line.length + 1; }
      spans.push([end, end + 4]); // the closing fence
    }
  }
  const src = /^#{2,3} (Sources|References|Further reading|Bibliography|Sources and further reading)\b.*$/m.exec(t); // the Sources section
  if (src) spans.push([src.index, t.length]); // to the end
  for (const p of PARA_SKIP) { const i = t.indexOf(p); if (i >= 0) { const j = t.indexOf("\n\n", i); spans.push([i, j > 0 ? j : t.length]); } } // an unmarked quotation
  for (const re of [/^>.*$/gm, /<[A-Za-z/][^<>]*>/g, /\{[^{}\n]*\}/g, /<!--[\s\S]*?-->/g]) for (const m of t.matchAll(re)) spans.push([m.index, m.index + m[0].length]); // quotes, tags, expressions, comments
  return spans;
}

/** TS content: the prose string literals ("..." or '...') and the object key each belongs to. */
const TS_SKIP_KEYS = new Set(["label", "href", "url", "quote", "by", "expansion", "headword", "aliases", "name", "text", "before", "keyPoints",
  "after", "examName", "certification", "blueprintSourceLabel", "sourceLabel", "citation", "publisher", "id", "slug", "code", "examCode",
  "key", "vendor", "concepts", "keywords", "title",
  "until"]); // citations, names, a vendor's own words, identifiers; `until` is a retirement notice's last day as the vendor wrote it
  // (study-guides.ts, quoted verbatim beside the localised day; check-dated-status parses it, 11/11/2026)
function* tsProse(t) {
  for (const m of t.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g)) {
    const s = m[1] ?? m[2]; // the literal's text
    if (s.length <= 12 || !s.includes(" ")) continue; // identifiers and short labels
    let k = /(\w+)\s*:\s*$/.exec(t.slice(Math.max(0, m.index - 80), m.index)); // "key: <literal>"
    if (!k) { const head = t.slice(Math.max(0, m.index - 4000), m.index), i = head.lastIndexOf("["); if (i >= 0 && !head.slice(i).includes("]")) k = /(\w+)\s*:\s*$/.exec(head.slice(Math.max(0, i - 80), i)); } // "key: [ ... <literal>"
    if (k && TS_SKIP_KEYS.has(k[1])) continue; // a citation, a name, a vendor's words
    yield s; // prose
  }
}

// SELF-TEST: the detector must still see what it is for, and must still leave alone what it protects; a guard that
// silently stopped matching would pass with nothing found.
const probe = findings('Optimise the color of the neighbor list toward the center, then analyze it. Keep `color`, "a colored quote", {normalised}, the organization, advise, analyse and the tokenizer.');
if (probe.map((f) => f[0]).join(",") !== "Optimise,color,neighbor,toward,center,analyze") {
  console.error(`[check-international-english] BLIND: the self-test found ${JSON.stringify(probe.map((f) => f[0]))}; fix the detector before trusting it.`);
  process.exit(1); // the guard cannot see
}
const problems = []; // every finding outside DECLARED
const en = JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8")); // the English pack
let strings = 0; // strings read
for (const [p, v] of leaves(en)) {
  if (SKIP_PREFIXES.some((s) => p.startsWith(s))) continue; // out of scope
  strings++; // counted
  for (const [w, sug, ctx] of findings(v)) if (!DECLARED.has(`${p}:${w}`)) problems.push(`${p}: "${w}" (Oxford spelling: "${sug}") ... ${ctx} ...`);
}
const docDir = "src/content/tool-docs/en"; // the English tool documents
const docs = fs.readdirSync(docDir).filter((f) => f.endsWith(".md")); // every document
for (const f of docs) {
  const text = fs.readFileSync(path.join(docDir, f), "utf8"); // its Markdown
  for (const [w, sug, ctx] of findings(text)) if (!DECLARED.has(`${f}:${w}`)) problems.push(`${f}: "${w}" (Oxford spelling: "${sug}") ... ${ctx} ...`);
}
// CORPUS SELF-TEST: lower-case American words and sentence-start -ise are seen; names, quotations and Sources are not.
const cprobe = corpusFindings("Organisations met on October 3, 2026 at the data center. The Center for Internet Security and Anchises Moraes recognised it; Internet Organised Crime Threat Assessment stays.").map((f) => f[0]).join(",");
if (cprobe !== "Organisations,center,recognised,October 3, 2026") {
  console.error(`[check-international-english] BLIND: the corpus self-test found ${JSON.stringify(cprobe)}; fix the corpus detector before trusting it.`);
  process.exit(1); // the guard cannot see
}
let corpusTexts = 0; // corpus texts read
const report = (where, list) => { for (const [w, sug, ctx] of list) if (!DECLARED.has(`${where}:${w}`)) problems.push(`${where}: "${w}" (Oxford spelling: "${sug}") ... ${ctx} ...`); };
for (const [p, v] of leaves(en)) { // the pack's corpus sections
  if (!/^(glossary\.entries\.|learnLabs\.|toolProvenance\.|materials\.)/.test(p) || p.startsWith("glossary.entries.en-001.")) continue; // phase 1, or the spelling entry
  if (p.startsWith("toolProvenance.") && /\.(title|label|name)s?(\.|$)/.test(p)) continue; // an external document's title
  corpusTexts++; report(p, corpusFindings(v));
}
for (const dir of ["src/content/learn/en", "src/content/blog/en", "src/content/practice/en", "src/content/advisory/en"]) { // MDX
  for (const f of fs.readdirSync(dir).filter((x) => /\.mdx?$/.test(x))) {
    const text = fs.readFileSync(path.join(dir, f), "utf8"); corpusTexts++; // one page
    report(`${dir.split("/")[2]}/${f}`, corpusFindings(text, mdxSpans(text)));
    const fm = text.startsWith("---") ? text.slice(0, Math.max(0, text.indexOf("\n---", 3))) : ""; // the front matter
    for (const m of fm.matchAll(/^(?:title|summary|description): "((?:[^"\\]|\\.)*)"$/gm)) report(`${dir.split("/")[2]}/${f} (front matter)`, corpusFindings(m[1])); // YAML quotes the prose, so it is read inside them
  }
}
const tsFiles = []; // the TS content
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!["pt-BR", "tool-docs", "testimonials", "bofh"].includes(e.name)) walk(p); } else if (p.endsWith(".ts")) tsFiles.push(p); } };
walk("src/content");
const spellingEntry = /spelling|spelt|organisation, licence|-ise|-ize/; // changelog entries about spelling, kept as recorded
for (const f of tsFiles) {
  const t = fs.readFileSync(f, "utf8"); corpusTexts++; // one file
  for (const s of tsProse(t)) { if (f.endsWith("changelog.ts") && spellingEntry.test(s)) continue; report(f, corpusFindings(s)); }
}
if (problems.length) {
  console.error(`[check-international-english] FAIL: ${problems.length} American spelling(s) in the International English (en-001) interface, Oxford spelling:\n  - ${problems.slice(0, 60).join("\n  - ")}${problems.length > 60 ? `\n  ... and ${problems.length - 60} more` : ""}\n\nWrite the Oxford form (British spelling with -ize: organize, colour, centre, analyse, licence), or, for a proper name, a quotation or a term a standard defines, add it to KEEP or DECLARED with its reason.`);
  process.exit(1); // a hard stop, like every guard
}
console.log(`[check-international-english] OK: ${strings} English interface string(s), ${docs.length} tool document(s) and ${corpusTexts} corpus text(s) (pack sections, Learn, blog, practice, advisory, src/content) in International English (en-001), Oxford spelling; ${DECLARED.size} declared exception(s), may only hold real ones. Since 2026-11-11.`);
