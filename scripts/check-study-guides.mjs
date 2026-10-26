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
//   7. exam durations are a positive number or an explained null (CC02);
//   8. COVERAGE CLAIMS RESOLVE (batch B3, 2026-10-26; audit CC11). Why: each
//      objective now shows a coverage class (src/lib/certCoverage.ts), and an
//      objective is "linked to local material" only through its relatedArticles
//      and relatedTools. What it checks: every such slug names a Learn article
//      by its frontmatter slug (the route the guide links), and every tool slug
//      names an AVAILABLE tool in src/config/tools.ts routed at /tools/<slug>.
//      Check 5 also accepted a bare catalogue slug, which has no page: it would
//      render a broken link and claim coverage. Each failure names the guide and
//      the objective id. It also prints the tally by class (linked / official
//      source only / planned), computed with the same rules as the renderer.
//
// Runs in plain node (no TS import): the registry is parsed structurally and the
// message packs as JSON, the same as the glossary and vendor-namespace gates.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");

const VENDOR_KEYS = new Set(["f5", "fortinet", "netskope", "extreme", "ping", "zscaler", "checkpoint"]);

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
// ---- 7. exam durations are a positive number or an explained null (Round 1, CC02, 2026-10-25) ------------------
//   A time limit of 0 rendered "0 minutes" on four Ping Expert guides. Each examFacts block must now hold either a
//   positive whole number of minutes with no policy or policy "fixed", or `minutes: null` with a durationPolicy that
//   says what the null means ("unknown", "variable", "explicitly_untimed"). Anything else fails with the guide's
//   slug, the field and the fix. Guides are walked one record at a time so each finding names the right one.
const DURATION_POLICIES = new Set(["fixed", "variable", "explicitly_untimed", "unknown"]);
// Every guide's start in the array body (the slug line), so each examFacts block is attributed to its own guide.
const guideStarts = [...guidesBody.matchAll(/\n {4}slug:\s*"([^"]+)"/g)];
let durationsChecked = 0;
for (let i = 0; i < guideStarts.length; i++) {
  // The guide's slug and its text up to the next guide.
  const slug = guideStarts[i][1];
  const body = guidesBody.slice(guideStarts[i].index, i + 1 < guideStarts.length ? guideStarts[i + 1].index : guidesBody.length);
  // Its examFacts object, when it has one (a null examFacts has no duration to judge).
  const facts = /\n {4}examFacts:\s*\{([\s\S]*?)\n {4}\},/.exec(body);
  if (!facts) continue;
  durationsChecked += 1;
  // The raw minutes value and the policy, as written.
  const minutes = /\n\s*minutes:\s*([^,\n]+),/.exec(facts[1])?.[1]?.trim();
  const policy = /\n\s*durationPolicy:\s*"([^"]*)"/.exec(facts[1])?.[1] ?? null;
  // An unknown policy word is an error on its own.
  if (policy !== null && !DURATION_POLICIES.has(policy)) {
    errors.push(`${slug}: examFacts.durationPolicy "${policy}" is not one of ${[...DURATION_POLICIES].join(", ")}.`);
    continue;
  }
  if (minutes === undefined) {
    // The field is required by the type; a block without it is malformed.
    errors.push(`${slug}: examFacts has no minutes field; write a positive number, or null with a durationPolicy.`);
  } else if (minutes === "null") {
    // A null needs its meaning, and "fixed" cannot be one.
    if (policy === null || policy === "fixed") {
      errors.push(`${slug}: examFacts.minutes is null without a meaning; add durationPolicy "unknown" (not verified), "variable" or "explicitly_untimed" (only when the vendor says so).`);
    }
  } else {
    // A number: positive, whole and finite, and only with no policy or "fixed".
    const n = Number(minutes);
    if (!/^\d+$/.test(minutes) || !Number.isFinite(n) || n <= 0) {
      errors.push(`${slug}: examFacts.minutes is ${minutes}; a time limit must be a positive whole number of minutes, or null with durationPolicy "unknown" when the official source does not state it.`);
    } else if (policy !== null && policy !== "fixed") {
      errors.push(`${slug}: examFacts.minutes is ${minutes} but durationPolicy is "${policy}"; a number means a fixed time limit, so remove the policy or set minutes to null.`);
    }
  }
}

// ---- 8. coverage claims resolve (batch B3, 2026-10-26) ----------------------------------------------------------
//   The rules mirror src/lib/certCoverage.ts; change both together:
//     linked   a relatedArticles slug is a real Learn article, or a relatedTools slug a live, routed tool;
//     planned  otherwise, when the objective is marked gap: true;
//     official otherwise, when the objective has manual links or its guide cites a blueprint source;
//     planned  otherwise (nothing local and nothing official cited).
// Learn slugs as the route knows them: each English article's frontmatter slug (the filename when it has none).
const learnRouteSlugs = new Set(
  readdirSync(path.join(ROOT, "src/content/learn/en"))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => /^slug:\s*["']?([^"'\n]+?)["']?\s*$/m.exec(read(`src/content/learn/en/${f}`))?.[1] ?? f.replace(/\.mdx$/, "")),
);
// Live tools: each registry entry with available: true whose href is /tools/<its id> (the link the guide renders).
const liveToolIds = new Set();
for (const m of read("src/config/tools.ts").matchAll(/\{\s*id:\s*"([a-z0-9-]+)"([^}]*)\}/g)) {
  // The entry's own href and availability, read from the same object literal.
  const href = /\bhref:\s*"([^"]+)"/.exec(m[2])?.[1];
  const available = /\bavailable:\s*true\b/.test(m[2]);
  if (available && href === `/tools/${m[1]}`) liveToolIds.add(m[1]);
}
// The quoted slugs inside one `key: [ ... ]` array of an objective block.
const refsIn = (block, key) => {
  const arr = new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`).exec(block)?.[1] ?? "";
  return [...arr.matchAll(/"([^"]+)"/g)].map((q) => q[1]);
};
// The tally by class, across every objective of every guide.
const coverageTally = { linked: 0, official: 0, planned: 0 };
for (let i = 0; i < guideStarts.length; i++) {
  // The guide's slug and its text up to the next guide (the same slicing as check 7).
  const slug = guideStarts[i][1];
  const body = guidesBody.slice(guideStarts[i].index, i + 1 < guideStarts.length ? guideStarts[i + 1].index : guidesBody.length);
  // Whether the guide cites a blueprint source: any value other than null (a string or a named constant).
  const guideCitesSource = /\n {4}blueprintSourceUrl:\s*(?!null\b)\S/.test(body);
  // Each objective starts at its id line followed by its text line; it runs to the next objective's start.
  const objStarts = [...body.matchAll(/\bid:\s*"([^"]+)",\s*\n\s*text:/g)];
  for (let j = 0; j < objStarts.length; j++) {
    // The objective's id and its block.
    const oid = objStarts[j][1];
    const block = body.slice(objStarts[j].index, j + 1 < objStarts.length ? objStarts[j + 1].index : body.length);
    // Every article and tool reference must resolve; an unresolved one would claim coverage through a dead link.
    const arts = refsIn(block, "relatedArticles");
    const tls = refsIn(block, "relatedTools");
    for (const a of arts) {
      if (!learnRouteSlugs.has(a)) errors.push(`${slug} objective ${oid}: relatedArticles "${a}" is not a Learn article slug, so its coverage claim does not resolve.`);
    }
    for (const tl of tls) {
      if (!liveToolIds.has(tl)) errors.push(`${slug} objective ${oid}: relatedTools "${tl}" is not an available tool routed at /tools/${tl}, so its coverage claim does not resolve.`);
    }
    // The class, with the renderer's rules and order.
    const linked = arts.some((a) => learnRouteSlugs.has(a)) || tls.some((tl) => liveToolIds.has(tl));
    const gap = /\bgap:\s*true\b/.test(block);
    const manual = /\bmanualLinks:\s*\[\s*\{/.test(block);
    coverageTally[linked ? "linked" : gap ? "planned" : manual || guideCitesSource ? "official" : "planned"] += 1;
  }
}

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
  `[check-study-guides] OK: ${guideSlugs.length} study guides, ${[...certsBody.matchAll(/key:/g)].length} certification(s); all examSlugs + resource refs resolve; certGuides i18n complete in en + pt-BR (${objectiveTotal} objectives mapped); ${durationsChecked} exam durations positive or explained; coverage claims resolve (${coverageTally.linked} linked to local material, ${coverageTally.official} official source only, ${coverageTally.planned} planned).`,
);
