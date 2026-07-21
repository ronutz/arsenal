// ============================================================================
// scripts/check-study-guides.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: the certification study-guide registry must stay honest.
//
// Canon (certifications-restructure-spec-v1). Study guides keep their structure
// in src/content/certifications/study-guides.ts and their chrome in the
// `certGuides` i18n namespace (en + native pt-BR). This gate enforces, at build
// time, the invariants the spec requires so a shipped guide is never broken or
// half-populated:
//
//   1. every study-guide slug is lowercase-kebab and unique;
//   2. every certification's examSlugs resolve to a real study-guide slug;
//   3. every guide's vendor is a known vendor key (matches the namespace guard);
//   4. every objective's relatedArticles resolve to a real Learn article slug;
//   5. every objective's relatedTools resolve to a real tool id / catalogue slug;
//   6. the `certGuides` i18n namespace exists in en AND pt-BR with matching keys,
//      and the two `certs` keys the credentials page needs are present in both.
//
// Runs in plain node (no TS import): the registry is parsed structurally and the
// message packs as JSON, the same as the glossary and vendor-namespace gates.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");

const VENDOR_KEYS = new Set(["f5", "fortinet", "netskope", "extreme", "ping", "zscaler"]);

const errors = [];

// ---- source slug populations (reused from the namespace guard) -------------
const toolIds = new Set(
  [...read("src/config/tools.ts").matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]),
);
const catalogueSlugs = new Set(
  [...read("src/content/catalogue/catalogue.ts").matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].map(
    (m) => m[1],
  ),
);
const articleSlugs = new Set(
  readdirSync(path.join(ROOT, "src/content/learn/en"))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, "")),
);

// ---- parse study-guides.ts -------------------------------------------------
const src = read("src/content/certifications/study-guides.ts");

// Isolate the studyGuides array body so we do not match the interface/type defs.
const guidesStart = src.indexOf("export const studyGuides");
const guidesBody = guidesStart >= 0 ? src.slice(guidesStart) : "";
if (!guidesBody) errors.push("could not locate `export const studyGuides` array.");

// Guide slugs (one `slug: "..."` per guide object in the array body).
const guideSlugs = [...guidesBody.matchAll(/\bslug:\s*"([^"]+)"/g)].map((m) => m[1]);
const guideSlugSet = new Set(guideSlugs);

// 1. slug format + uniqueness
const seen = new Set();
for (const s of guideSlugs) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
    errors.push(`study-guide slug "${s}" is not lowercase-kebab.`);
  }
  if (seen.has(s)) errors.push(`duplicate study-guide slug "${s}".`);
  seen.add(s);
}

// 3. vendor keys on guides
for (const m of guidesBody.matchAll(/\bvendor:\s*"([^"]+)"/g)) {
  if (!VENDOR_KEYS.has(m[1])) {
    errors.push(`study guide has unknown vendor "${m[1]}" (expected one of ${[...VENDOR_KEYS].join(", ")}).`);
  }
}

// 4 + 5. objective resource references resolve
//   Pull every relatedArticles: [ ... ] and relatedTools: [ ... ] array body
//   from the guides section and check each quoted slug against the real sets.
const collectRefs = (key) => {
  const refs = [];
  const re = new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`, "g");
  for (const m of guidesBody.matchAll(re)) {
    for (const q of m[1].matchAll(/"([^"]+)"/g)) refs.push(q[1]);
  }
  return refs;
};
for (const slug of collectRefs("relatedArticles")) {
  if (!articleSlugs.has(slug)) {
    errors.push(`objective relatedArticles references unknown Learn article "${slug}".`);
  }
}
for (const slug of collectRefs("relatedTools")) {
  if (!toolIds.has(slug) && !catalogueSlugs.has(slug)) {
    errors.push(`objective relatedTools references unknown tool/catalogue slug "${slug}".`);
  }
}

// ---- parse certifications examSlugs ----------------------------------------
const certsStart = src.indexOf("export const certifications");
const certsBody = certsStart >= 0 && guidesStart > certsStart
  ? src.slice(certsStart, guidesStart)
  : "";
if (!certsBody) errors.push("could not locate `export const certifications` array.");

// 2. every examSlugs entry resolves to a guide slug
for (const m of certsBody.matchAll(/examSlugs:\s*\[([^\]]*)\]/g)) {
  for (const q of m[1].matchAll(/"([^"]+)"/g)) {
    if (!guideSlugSet.has(q[1])) {
      errors.push(`certification examSlugs references unknown study-guide slug "${q[1]}".`);
    }
  }
}

// ---- 6. i18n chrome present in en + pt-BR ----------------------------------
const en = JSON.parse(read("src/i18n/messages/en.json"));
const pt = JSON.parse(read("src/i18n/messages/pt-BR.json"));

if (!en.certGuides) errors.push("en.json is missing the `certGuides` namespace.");
if (!pt.certGuides) errors.push("pt-BR.json is missing the `certGuides` namespace.");
if (en.certGuides && pt.certGuides) {
  const enKeys = Object.keys(en.certGuides).sort();
  const ptKeys = Object.keys(pt.certGuides).sort();
  const missingInPt = enKeys.filter((k) => !pt.certGuides[k]);
  const missingInEn = ptKeys.filter((k) => !en.certGuides[k]);
  if (missingInPt.length) errors.push(`certGuides keys missing in pt-BR: ${missingInPt.join(", ")}.`);
  if (missingInEn.length) errors.push(`certGuides keys missing in en: ${missingInEn.join(", ")}.`);
}
for (const k of ["backToAbout", "studyGuidesPointer"]) {
  if (!en.certs?.[k]) errors.push(`en.json is missing certs.${k} (credentials page).`);
  if (!pt.certs?.[k]) errors.push(`pt-BR.json is missing certs.${k} (credentials page).`);
}

// ---- report ----------------------------------------------------------------
if (errors.length) {
  console.error("[check-study-guides] FAILED:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
const objectiveTotal = [...guidesBody.matchAll(/\bid:\s*"[^"]+",\s*\n\s*text:/g)].length;
console.log(
  `[check-study-guides] OK: ${guideSlugs.length} study guides, ${[...certsBody.matchAll(/key:/g)].length} certification(s); all examSlugs + resource refs resolve; certGuides i18n complete in en + pt-BR (${objectiveTotal} objectives mapped).`,
);
