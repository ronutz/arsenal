// ============================================================================
// scripts/check-glossary.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: the glossary registry and its bilingual prose must stay honest.
//
// Canon (glossary-design-spec-v1, ratified 2026-07-08). The glossary keeps
// language-neutral structure in src/content/glossary/glossary.ts and its prose
// in the `glossary` i18n namespace (en + native pt-BR). This gate enforces, at
// build time, the invariants the spec requires so a shipped glossary is never
// half-populated or self-inconsistent:
//
//   1. every registry slug has BOTH def and context in en AND pt-BR;
//   2. every entry's kind is one of the five valid kinds;
//   3. every entry has 1..4 domains (the hard cap from refinement #2);
//   4. every relatedTerms reference resolves to a real registry slug;
//   5. every lore entry carries at least one source (the accuracy rule);
//   6. no i18n entry exists without a matching registry slug (no orphans).
//
// Like the other prebuild gates it runs in plain node (no TS import), parsing
// the registry structurally with a regex block scan and the message packs as
// JSON. It fails the build with a clear, itemized list, the same way a failed
// golden vector or the vendor-namespace guard does.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.join(ROOT, "src/content/glossary/glossary.ts");
const EN = path.join(ROOT, "src/i18n/messages/en.json");
const PT = path.join(ROOT, "src/i18n/messages/pt-BR.json");

// Link-target universes, read live so the guard can never drift from reality:
// tool slugs from the tools registry, article slugs from the en Learn corpus.
// (Added 2026-07-23 after a dangling "mac-oui" relatedTools reference shipped
// undetected - plain strings are invisible to TypeScript.)
const TOOL_SLUGS = new Set(
  [...readFileSync(path.join(ROOT, "src/lib/tools/registry.ts"), "utf8")
    .matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]),
);
const ARTICLE_SLUGS = new Set(
  readdirSync(path.join(ROOT, "src/content/learn/en"))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.slice(0, -4)),
);

const VALID_KINDS = new Set(["term", "acronym", "expression", "jargon", "lore"]);
const VALID_DOMAINS = new Set([
  "enterprise-networking", "cyber-security", "crypto", "cloud", "grc",
  "privacy", "hacking", "darkweb", "ops-culture", "web-development", "programming",
  "vendors", "isp-telecom", "it-support",
  "events",
]);

// ---- 1. parse the registry into structured entries ------------------------
// Each entry is an object literal in the GLOSSARY array. Split on the "slug:"
// anchor so every chunk is exactly one entry, then pull the fields we gate on.
const src = readFileSync(REGISTRY, "utf8");
// Isolate the array body to avoid matching the interface/type declarations.
// The corpus is stored as several annotated chunks concatenated into the
// exported GLOSSARY (a TS2590 accommodation, see glossary.ts). Anchor on the
// FIRST typed array literal so every chunk is read, not just the export.
const arrStart = src.indexOf(": GlossaryEntry[] = [");
const body = arrStart >= 0 ? src.slice(arrStart) : src;

const chunks = body.split(/\n\s*\{\s*\n/).slice(1); // each chunk = one entry body
// ---------------------------------------------------------------------------
// THE CHUNKER'S OWN COMPLETENESS ASSERTION, enforced at zero since 2026-10-01.
//
// The split above means "a brace alone on its line opens an entry". That is true
// of entries, and it is ALSO true of any object literal written multi-line INSIDE
// one - a `sources: [` block whose objects open on their own lines, for instance.
// When that happens the entry is torn in two: the first piece keeps the slug, the
// second keeps everything after the brace, and the second is dropped here because
// it has no slug of its own.
//
// HOW THIS WAS FOUND. On 2026-10-01 six lore entries were given real citations,
// written multi-line for readability, and rule 5b reported all six as carrying no
// href while every one of them plainly did. The href had landed in the discarded
// half. That failure was loud, because rule 5b fails on a missing link.
//
// THE DANGEROUS CASE IS THE QUIET ONE. Every field below is read out of `chunk`,
// so any field positioned AFTER the tear reads as absent: `relatedTools: []`
// instead of its real contents, and the dangling-tool check for that entry
// becomes vacuous and passes. Nothing reports it. The file's one pre-existing
// instance - `silent-failure`, which is too apt to invent - was harmless only
// because `sources` happened to be its last field. That is an invariant no
// author could see and none was written down.
//
// SO THE SHAPE IS BANNED RATHER THAN ACCOMMODATED. Teaching the chunker to
// balance braces would make it a parser; asserting that it parsed everything
// costs four lines and cannot itself go wrong. Source objects go on one line,
// which is what all 1711 entries already do.
const fragments = chunks.filter((c) => !/slug:\s*"/.test(c));
if (fragments.length > 0) {
  console.error(
    `[check-glossary] FAIL: ${fragments.length} fragment(s) with no slug - an object literal ` +
      `opened on its own line has split an entry, and every field after the split is invisible ` +
      `to this guard. Put the object on one line. First lines:`
  );
  for (const f of fragments.slice(0, 10)) {
    console.error(`  - ${JSON.stringify(f.split("\n")[0].trim().slice(0, 120))}`);
  }
  process.exit(1);
}
const entries = [];
for (const chunk of chunks) {
  const slug = chunk.match(/slug:\s*"([^"]+)"/)?.[1];
  if (!slug) continue;
  const kind = chunk.match(/kind:\s*"([^"]+)"/)?.[1];
  const domainsRaw = chunk.match(/domains:\s*\[([^\]]*)\]/)?.[1] ?? "";
  const domains = [...domainsRaw.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const relatedRaw = chunk.match(/relatedTerms:\s*\[([^\]]*)\]/)?.[1] ?? "";
  const relatedTerms = [...relatedRaw.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const hasSources = /sources:\s*\[/.test(chunk);
  // Whether any of those sources is actually a link. The distinction between this
  // and hasSources is the whole of rule 5b.
  const hasSourceLink = /href:\s*"https?:\/\//.test(chunk);
  // relatedTools / relatedArticles are parsed so their targets can be
  // validated below. Before 2026-07-23 these rails were NOT checked, which
  // let a dangling "mac-oui" tool reference sit in the file unnoticed:
  // TypeScript cannot catch it (they are plain strings) and the page simply
  // renders a link to a tool that does not exist.
  const toolsRaw = chunk.match(/relatedTools:\s*\[([^\]]*)\]/)?.[1] ?? "";
  const relatedTools = [...toolsRaw.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const artsRaw = chunk.match(/relatedArticles:\s*\[([^\]]*)\]/)?.[1] ?? "";
  const relatedArticles = [...artsRaw.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  // headword is parsed for the duplicate-topic check in section 3b. It was not
  // captured before, which is part of why duplicate subjects went unnoticed.
  const headword = chunk.match(/headword:\s*"([^"]+)"/)?.[1];
  entries.push({ slug, headword, kind, domains, relatedTerms, hasSources, hasSourceLink, relatedTools, relatedArticles });
}

if (entries.length === 0) {
  console.error("[check-glossary] FAIL: parsed zero entries from the registry.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CORPUS FLOOR AND PART STRUCTURE, declared rather than merely reported.
//
// WHY THIS EXISTS. On 2026-10-01 a replacement bounded by a text search deleted
// 3,841 lines of this file, taking the whole of GLOSSARY_PART_3 with it. Two
// guards caught it: tsc, because the export referenced a name that no longer
// existed, and the stale-declaration half of rule 5b, because a slug in
// DECLARED_UNLINKED no longer resolved to an entry.
//
// NEITHER OF THOSE IS THIS GUARD, and that is the point. This guard parsed the
// wreckage, counted what was left, and would have printed a green OK line with a
// smaller number. A deletion that happened to remove no declared slug and to
// break no const would have passed here in silence. The guard that counts the
// corpus was the one with a bare tolerance: any count was acceptable.
//
// SO THE COUNT IS DECLARED. The floor may only be RAISED, and raising it is a
// deliberate edit with the date. It is a floor rather than an exact figure because
// entries are added often and removed almost never; an exact figure would fail on
// every addition and would be edited without thought, which is how a declared
// number becomes a rubber stamp.
const MIN_ENTRIES = 1716;        // 2026-10-01: 1711 entries; 2026-10-03: 1716 (ascii, unicode, utf-8, byte-order-mark, mojibake). May only be raised.
const EXPECTED_PARTS = 4;        // GLOSSARY_PART_1..4, a TS2590 accommodation.

if (entries.length < MIN_ENTRIES) {
  console.error(
    `[check-glossary] FAIL: ${entries.length} entries parsed, below the declared floor of ` +
      `${MIN_ENTRIES}. Entries are added often and removed almost never, so a drop means ` +
      `something was deleted. If the removal is intended, lower the floor in the same commit ` +
      `and say why.`
  );
  process.exit(1);
}

// The parts must all be declared AND all spread into the export. Checking only the
// declarations would miss a part that exists and is never included, which renders
// its entries invisible to every guard in this chain while the file still compiles.
const declaredParts = [...src.matchAll(/const (GLOSSARY_PART_\d+)\s*:\s*GlossaryEntry\[\]/g)].map((m) => m[1]);
const spreadParts = [...src.matchAll(/\.\.\.(GLOSSARY_PART_\d+)/g)].map((m) => m[1]);
if (declaredParts.length !== EXPECTED_PARTS) {
  console.error(
    `[check-glossary] FAIL: ${declaredParts.length} GLOSSARY_PART declaration(s), expected ` +
      `${EXPECTED_PARTS} (found ${declaredParts.join(", ") || "none"}).`
  );
  process.exit(1);
}
const notSpread = declaredParts.filter((p) => !spreadParts.includes(p));
if (notSpread.length > 0) {
  console.error(
    `[check-glossary] FAIL: declared but never spread into the export: ${notSpread.join(", ")}. ` +
      `Its entries compile and are invisible to every check in this chain.`
  );
  process.exit(1);
}

const slugSet = new Set(entries.map((e) => e.slug));

// ---- 2. load prose namespaces ---------------------------------------------
const enEntries = JSON.parse(readFileSync(EN, "utf8"))?.glossary?.entries ?? {};
const ptEntries = JSON.parse(readFileSync(PT, "utf8"))?.glossary?.entries ?? {};

// ---- 3. run every invariant ------------------------------------------------
const errors = [];

// ---------------------------------------------------------------------------
// DECLARED_UNLINKED - lore entries whose sources name a work and link nowhere.
//
// Rule 5b below requires at least one followable absolute link per lore entry.
// These are the exceptions, and each carries its reason IN THE CODE rather than
// only in canon. That matters: canon had two of them filed under "a document this
// sandbox cannot reach", and on 2026-10-01 both were read without difficulty. The
// category was an artefact of having tried a single fetch tool, and nothing here
// could have contradicted it. A reason that lives beside the declaration can be
// checked against reality by the next person who looks.
//
// THE LIST MAY ONLY SHRINK. An entry that gains a link fails as a stale
// declaration, so this cannot quietly accumulate.
//
// Three of the groups below are PRIME's to rule on rather than mine to research:
// an ORIGIN rather than a document (snafu, fubar, pwned, hack, yak-shaving), a
// label naming a TOPIC or an OBSERVATION rather than a work (googol), and a work
// that exists only as a game (all-your-base, set-us-up-the-bomb, the-konami-code).
const DECLARED_UNLINKED = new Map([
  // The source is a game, so there is no document. Each reason says what was tried,
  // because the previous generation of reasons here was wrong for three entries
  // precisely through being written as conclusions rather than as attempts.
  ["all-your-base", "The source is Zero Wing's own script (Toaplan/Sega, 1991, European Mega Drive port). No publisher document reproduces it; Toaplan is dissolved and Sega publishes no script archive."],
  ["set-us-up-the-bomb", "The source is Zero Wing's own script (Toaplan/Sega, 1991, European Mega Drive port). Same as all-your-base: no publisher document reproduces it."],
  ["the-konami-code", "The source is the code as entered in Gradius (1986). Konami's corporate site answers 200 but carries no Hashimoto record at any path found, and a guessed URL for its 2020 tribute post answered 404."],
  // A work with no free edition and no permanent record located. Checked against
  // Crossref and Open Library; a Datamation-style reprint DOI existed for
  // real-programmers and none exists for this.
  ["the-414s", "Newsweek cover, 'Beware: Hackers at Play' (September 1983). No free edition, no reprint DOI in Crossref, and no Open Library work record for the issue."],
  // Blocked for legal reasons rather than by bot protection, which is a different fact
  // and is not something to route around.
  ["captain-crunch", "Rosenbaum, 'Secrets of the Little Blue Box', Esquire (1971). Esquire's archive returns a LEGAL block to our fetch tools, not a bot block, so no alternative route is attempted."],
]);

  // 5b: A LORE SOURCE MUST BE SOMEWHERE A READER CAN GO.
  //
  // Rule 5 below tests `/sources:\s*\[/` - that the ARRAY EXISTS. On 2026-09-30
  // that was found to pass on a label with no link at all: 108 of 347 lore
  // entries cited a work by name and pointed nowhere. The guard reported "lore
  // sourced" for all 347, which was true of the field and false of the citation.
  //
  // Two of those 108 were person entries and were caught the same day by
  // check-person-year-sources, whose fifth fault says it plainly: a label naming
  // a book or a case with no link is not somewhere a reader can go. This is that
  // rule for the rest of the glossary.
  //
  // ELEVEN WERE PAID DOWN IMMEDIATELY, because the link existed and nobody had
  // looked: five cited "The Jargon File", which is online at a host this very
  // file cites elsewhere, with a stable page per entry. AltaVista's label already
  // read "Wikipedia: AltaVista - launch 15 December 1995" and simply had no href.
  //
  // THE REMAINING NINETY-SEVEN ARE DECLARED, not tolerated as a count, because a
  // count cannot say which and cannot see a swap. They are not all one thing:
  //   * Some name a document that IS findable and has not been found yet -
  //     "Rosenbaum, 'Secrets of the Little Blue Box', Esquire (1971)".
  //   * Some name an ORIGIN rather than a document - "US military slang, WWII",
  //     "Tech Model Railroad Club / MIT, from the 1950s". That is an etymology
  //     note, and arguably should not sit in `sources` at all; PRIME's call.
  //   * Some name a book with no free edition - "The Pragmatic Programmer".
  // Sorting those three apart is editorial work, so the list is flat for now and
  // the distinction is recorded here rather than guessed at.
  //
  // This list may only SHRINK. A new lore entry with an unlinked source fails.

for (const e of entries) {
  // 2: kind valid
  if (!VALID_KINDS.has(e.kind)) {
    errors.push(`"${e.slug}": invalid kind "${e.kind}"`);
  }
  // 3: 1..4 domains, all valid
  if (e.domains.length < 1 || e.domains.length > 4) {
    errors.push(`"${e.slug}": has ${e.domains.length} domains (must be 1..4)`);
  }
  for (const d of e.domains) {
    if (!VALID_DOMAINS.has(d)) errors.push(`"${e.slug}": invalid domain "${d}"`);
  }
  // 4: relatedTerms resolve
  for (const r of e.relatedTerms) {
    if (!slugSet.has(r)) errors.push(`"${e.slug}": relatedTerms -> "${r}" does not resolve`);
  }
  // 4b: relatedTools resolve to a real tool slug in the registry
  for (const r of e.relatedTools) {
    if (!TOOL_SLUGS.has(r)) {
      errors.push(`"${e.slug}": relatedTools -> "${r}" is not a registry tool slug`);
    }
  }
  // 4c: relatedArticles resolve to a real Learn article (en corpus is the
  // source of truth; the multi-locale rule keeps pt-BR in step)
  for (const r of e.relatedArticles) {
    if (!ARTICLE_SLUGS.has(r)) {
      errors.push(`"${e.slug}": relatedArticles -> "${r}" is not a Learn article slug`);
    }
  }
  // 5: lore has sources
  if (e.kind === "lore" && !e.hasSources) {
    errors.push(`"${e.slug}": kind lore but no sources (accuracy rule)`);
  }
  // 5b: and at least one of them is a link a reader can follow.
  if (
    e.kind === "lore" &&
    e.hasSources &&
    !e.hasSourceLink &&
    !DECLARED_UNLINKED.has(e.slug)
  ) {
    errors.push(
      `"${e.slug}": lore sources name a work but carry no href - not somewhere a reader can go. ` +
        `Link it, or add the slug to DECLARED_UNLINKED with the reason it cannot be linked.`
    );
  }
  // 1: def + context in both locales
  const en = enEntries[e.slug];
  const pt = ptEntries[e.slug];
  if (!en?.def || !en?.context) errors.push(`"${e.slug}": missing en def/context`);
  if (!pt?.def || !pt?.context) errors.push(`"${e.slug}": missing pt-BR def/context`);

  // `depth` is the OPTIONAL encyclopedia-grade body added by the glossary
  // depth retrofit (2026-07-23). It is optional per entry, but never
  // optional per LOCALE: an entry that has depth in one language and not
  // the other would render a rich page in en and a thin one in pt-BR,
  // which the multi-locale rule forbids. It must also not simply repeat
  // `context`, which would double the same paragraph on the page.
  if (Boolean(en?.depth) !== Boolean(pt?.depth)) {
    errors.push(`"${e.slug}": depth present in only one locale (en+pt-BR required together)`);
  }
  if (en?.depth && en.depth.trim() === en.context.trim()) {
    errors.push(`"${e.slug}": en depth duplicates context`);
  }
  if (pt?.depth && pt.depth.trim() === pt.context.trim()) {
    errors.push(`"${e.slug}": pt-BR depth duplicates context`);
  }
}

// 6: no orphan prose (entry in i18n with no registry slug)
for (const s of Object.keys(enEntries)) {
  if (!slugSet.has(s)) errors.push(`en prose "${s}" has no registry entry`);
}
for (const s of Object.keys(ptEntries)) {
  if (!slugSet.has(s)) errors.push(`pt-BR prose "${s}" has no registry entry`);
}

// ---- 3b. DUPLICATE TOPICS ---------------------------------------------------
// Two entries may not describe the SAME THING under different slugs. This is
// the defect the 2026-07-25 reconciliation cleaned up: the corpus had grown
// across many waves, and a topic added as "the-x" in one wave and "x" in
// another looked distinct to every check that existed, because uniqueness of
// slugs is not uniqueness of subjects.
//
// Detection is by HEADWORD, not by text similarity. Measured against the
// confirmed pairs, Jaccard overlap of def+context was only 0.18-0.30: the two
// versions were written independently and share little vocabulary, so any
// similarity threshold loose enough to catch them floods with false positives.
// Normalising the headword (drop a leading article, strip non-alphanumerics)
// catches them exactly.
{
  const byHeadword = new Map();
  for (const e of entries) {
    if (!e.headword) continue;
    const key = e.headword
      .toLowerCase()
      .trim()
      .replace(/^(the|a|an)\s+/, "")
      .replace(/[^a-z0-9]/g, "");
    if (!key) continue;
    if (!byHeadword.has(key)) byHeadword.set(key, []);
    byHeadword.get(key).push(e.slug);
  }
  for (const [key, slugs] of byHeadword) {
    if (slugs.length > 1) {
      errors.push(
        `duplicate topic: ${slugs.map((s) => `"${s}"`).join(" and ")} share the ` +
          `normalized headword "${key}". Merge them and redirect the retired ` +
          `slug in MERGED_GLOSSARY_SLUGS (worker/index.ts), or differentiate ` +
          `the headwords if they are genuinely different subjects.`,
      );
    }
  }
}

// ---- 3c. DUPLICATE TOPICS, word-order variant -------------------------------
// 3b normalizes the headword as a STRING, so it catches article and
// punctuation variants ("the Therac-25" vs "Therac-25") and misses rephrasings
// ("pets vs. cattle" vs "cattle, not pets"; "the first computer bug" vs
// "bug (the first computer bug)"). Both of those were real duplicates that
// survived the first pass, so this second check compares the SET of
// significant headword tokens, which is order-insensitive.
//
// Order-insensitivity is also this check's weakness: a genuinely DIRECTIONAL
// pair reads as a collision. host-to-multihost (one-to-many) and
// multihost-to-host (many-to-one, incast) are opposite concepts sharing the
// same two tokens. Such pairs go in the allowlist below, which keeps the check
// FAILING CLOSED: a new collision blocks the build until somebody either
// merges the entries or consciously records that they are distinct.
const DISTINCT_DESPITE_SHARED_TOKENS = new Set([
  "host-to-multihost|multihost-to-host", // opposite directions: fan-out vs fan-in
]);
{
  const STOP = new Set([
    "the","a","an","of","in","on","to","is","not","vs","versus","and","or",
    "for","your","own","it",
  ]);
  const byTokens = new Map();
  for (const e of entries) {
    if (!e.headword) continue;
    const toks = [
      ...new Set(
        (e.headword.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
          (w) => w.length > 1 && !STOP.has(w),
        ),
      ),
    ].sort();
    if (toks.length < 2) continue; // one significant token is too loose to judge
    const key = toks.join(" ");
    if (!byTokens.has(key)) byTokens.set(key, []);
    byTokens.get(key).push(e.slug);
  }
  for (const [key, slugs] of byTokens) {
    if (slugs.length < 2) continue;
    if (DISTINCT_DESPITE_SHARED_TOKENS.has([...slugs].sort().join("|"))) continue;
    errors.push(
      `possible duplicate topic: ${slugs.map((s) => `"${s}"`).join(" and ")} share ` +
        `the headword tokens {${key}}. Merge and redirect via ` +
        `MERGED_GLOSSARY_SLUGS (worker/index.ts), or if they are genuinely ` +
        `distinct add "${[...slugs].sort().join("|")}" to ` +
        `DISTINCT_DESPITE_SHARED_TOKENS with a reason.`,
    );
  }
}

// ---- 4. report -------------------------------------------------------------
// 5b, the other half: a declaration for an entry that NOW has a link is stale and
// must come off, so the list can only shrink. Without this the list silently
// accumulates entries that no longer need declaring - the rot that every other
// declared list in this chain is written to prevent. Caught by its own negative
// test on 2026-09-30, which passed when it should have failed.
for (const slug of DECLARED_UNLINKED.keys()) {
  const e = entries.find((x) => x.slug === slug);
  if (!e) {
    errors.push(
      `DECLARED_UNLINKED lists "${slug}", which is not a glossary entry - remove it.`
    );
  } else if (e.hasSourceLink) {
    errors.push(
      `DECLARED_UNLINKED lists "${slug}", but its sources now carry a link - remove it from the list. ` +
        `The declaration claimed: ${JSON.stringify(DECLARED_UNLINKED.get(slug))}`
    );
  }
}


if (errors.length > 0) {
  console.error("[check-glossary] FAIL:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `[check-glossary] OK: ${entries.length} entries (declared floor ${MIN_ENTRIES}, may only be raised) across ${declaredParts.length} parts, all spread into the export; all with def+context in en+pt-BR; ` +
    `kinds/domains valid, relatedTerms resolve, no orphans; ` +
    `every lore entry sourced and its source a followable link ` +
    `(${DECLARED_UNLINKED.size} declared unlinked, may only shrink).`,
);
