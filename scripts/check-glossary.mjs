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
const arrStart = src.indexOf("export const GLOSSARY");
const body = arrStart >= 0 ? src.slice(arrStart) : src;

const chunks = body.split(/\n\s*\{\s*\n/).slice(1); // each chunk = one entry body
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
  entries.push({ slug, headword, kind, domains, relatedTerms, hasSources, relatedTools, relatedArticles });
}

if (entries.length === 0) {
  console.error("[check-glossary] FAIL: parsed zero entries from the registry.");
  process.exit(1);
}

const slugSet = new Set(entries.map((e) => e.slug));

// ---- 2. load prose namespaces ---------------------------------------------
const enEntries = JSON.parse(readFileSync(EN, "utf8"))?.glossary?.entries ?? {};
const ptEntries = JSON.parse(readFileSync(PT, "utf8"))?.glossary?.entries ?? {};

// ---- 3. run every invariant ------------------------------------------------
const errors = [];

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
if (errors.length > 0) {
  console.error("[check-glossary] FAIL:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `[check-glossary] OK: ${entries.length} entries, all with def+context in en+pt-BR; ` +
    `kinds/domains valid, relatedTerms resolve, lore sourced, no orphans.`,
);
