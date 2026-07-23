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

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.join(ROOT, "src/content/glossary/glossary.ts");
const EN = path.join(ROOT, "src/i18n/messages/en.json");
const PT = path.join(ROOT, "src/i18n/messages/pt-BR.json");

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
  entries.push({ slug, kind, domains, relatedTerms, hasSources });
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
  // 5: lore has sources
  if (e.kind === "lore" && !e.hasSources) {
    errors.push(`"${e.slug}": kind lore but no sources (accuracy rule)`);
  }
  // 1: def + context in both locales
  const en = enEntries[e.slug];
  const pt = ptEntries[e.slug];
  if (!en?.def || !en?.context) errors.push(`"${e.slug}": missing en def/context`);
  if (!pt?.def || !pt?.context) errors.push(`"${e.slug}": missing pt-BR def/context`);
}

// 6: no orphan prose (entry in i18n with no registry slug)
for (const s of Object.keys(enEntries)) {
  if (!slugSet.has(s)) errors.push(`en prose "${s}" has no registry entry`);
}
for (const s of Object.keys(ptEntries)) {
  if (!slugSet.has(s)) errors.push(`pt-BR prose "${s}" has no registry entry`);
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
