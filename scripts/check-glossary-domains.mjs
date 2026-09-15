// ============================================================================
// scripts/check-glossary-domains.mjs
// ----------------------------------------------------------------------------
// The glossary domain pages exist so a reader who does NOT already know the
// word has a way in (PRIME, 2026-09-14). This guard keeps three promises those
// pages make, each of which would otherwise rot silently:
//
//   1. EVERY domain used by an entry has a translated label in en and pt-BR.
//      A missing label renders the raw key - "isp-telecom" - as a page title.
//
//   2. EVERY domain has at least one entry. A domain in the union type that
//      nothing carries would build an empty page and advertise it in the rail.
//
//   3. NO ENTRY IS UNREACHABLE by domain. A term with an empty `domains` array
//      can only be found by already knowing its name, which is precisely the
//      problem these pages were built to solve. One such term is a gap in the
//      promise; the guard names it rather than letting it hide among 1,703.
//
// It deliberately does NOT check the built HTML: it runs at prebuild, before
// any pages exist, so that a bad domain fails before a twelve-minute build
// rather than after one.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = fs.readFileSync(
  path.join(root, "src/content/glossary/glossary.ts"),
  "utf8"
);

// Entries are object literals with `slug:` and `domains:` fields. Parsing the
// source with a regex rather than importing TypeScript keeps this a plain node
// script with no build step, which is how every other guard here works.
const entries = [];
const entryRe =
  /slug:\s*"([^"]+)"[\s\S]*?kind:\s*"([^"]+)"[\s\S]*?domains:\s*\[([^\]]*)\]/g;
let m;
while ((m = entryRe.exec(src)) !== null) {
  const domains = [...m[3].matchAll(/"([^"]+)"/g)].map((d) => d[1]);
  entries.push({ slug: m[1], kind: m[2], domains });
}

const errors = [];
if (entries.length < 1000) {
  errors.push(
    `only ${entries.length} entries parsed from glossary.ts - the shape of the ` +
      `file has probably changed and this guard is no longer reading it correctly`
  );
}

const used = new Set(entries.flatMap((e) => e.domains));
const usedKinds = new Set(entries.map((e) => e.kind));

for (const loc of ["en", "pt-BR"]) {
  const messages = JSON.parse(
    fs.readFileSync(path.join(root, `src/i18n/messages/${loc}.json`), "utf8")
  );
  const labels = messages?.glossary?.domains ?? {};
  for (const d of used) {
    if (!labels[d]) {
      errors.push(`${loc}: no glossary.domains["${d}"] label; the page would show the raw key`);
    }
  }
  // Kinds: the same three promises, for /glossary/kind/<kind>. Added the same
  // day as the pages - a guard written later than the feature is a guard that
  // was never there when it mattered.
  const kindLabels = messages?.glossary?.kinds ?? {};
  for (const k of usedKinds) {
    if (!kindLabels[k]) {
      errors.push(`${loc}: no glossary.kinds["${k}"] label; the page would show the raw key`);
    }
  }
  for (const k of Object.keys(kindLabels)) {
    if (!usedKinds.has(k)) {
      errors.push(
        `${loc}: glossary.kinds["${k}"] is labelled but no entry carries it - ` +
          `the rail would advertise an empty page`
      );
    }
  }

  for (const d of Object.keys(labels)) {
    if (!used.has(d)) {
      errors.push(
        `${loc}: glossary.domains["${d}"] is labelled but no entry carries it - ` +
          `the rail would advertise an empty page`
      );
    }
  }
}

const orphans = entries.filter((e) => e.domains.length === 0);
if (orphans.length > 0) {
  errors.push(
    `${orphans.length} term(s) carry no domain and are therefore reachable only ` +
      `by knowing the word already: ${orphans.slice(0, 8).map((e) => e.slug).join(", ")}` +
      (orphans.length > 8 ? ", ..." : "")
  );
}

if (errors.length > 0) {
  console.error("[check-glossary-domains] FAIL:\n");
  for (const e of errors) console.error(`  - ${e}`);
  console.error(
    "\n  These pages are the conceptual way into 1,703 terms. See the header of\n" +
      "  this script for why each rule exists.\n"
  );
  process.exit(1);
}

console.log(
  `[check-glossary-domains] OK: ${entries.length} entries across ${used.size} ` +
    `domain(s) and ${usedKinds.size} kind(s); all labelled in en and pt-BR, ` +
    `none empty, no unreachable term.`
);
