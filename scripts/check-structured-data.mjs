// ============================================================================
// scripts/check-structured-data.mjs   (POSTBUILD - reads out/)
// ----------------------------------------------------------------------------
// Validates the schema.org/DefinedTerm data actually emitted into the built
// pages, not merely that a component was imported.
//
// WHY POSTBUILD RATHER THAN PREBUILD. Structured data fails in ways that only
// exist after rendering: a missing message key renders as the key itself, so
// `description` becomes the literal string "entries.tls.def" and a machine
// reads that as the definition of TLS. No amount of source inspection catches
// that; only looking at the output does.
//
// WHAT IT ENFORCES
//   1. Every glossary TERM page carries exactly one DefinedTerm. Zero means the
//      largest body of meaning on this site went out invisible again; two means
//      a duplicate, which makes a crawler choose.
//   2. Its description is a real definition - present, not an unresolved
//      message key, and long enough to be a sentence rather than a stub.
//   3. It points at the set, and the set EXISTS on the index with that same
//      @id. A dangling inDefinedTermSet is worse than none: it asserts
//      membership of something that is not there.
//   4. The index carries exactly one DefinedTermSet.
//
// It samples rather than parsing all 1,703 term pages in every locale: the
// failure modes above are systemic, not per-term, so a sample of 120 catches
// them while keeping the check to a couple of seconds. The sample is
// deterministic (every Nth page) so a failure is reproducible.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "out");
if (!fs.existsSync(out)) {
  console.log("[check-structured-data] SKIP: no out/ directory");
  process.exit(0);
}

const errors = [];

function ldBlocks(html) {
  // Anchored at "<script" ON PURPOSE. Next's RSC payload serialises the
  // component tree, so the string "application/ld+json" also appears INSIDE a
  // self.__next_f.push(...) script. A regex that starts at the media type
  // rather than at the tag matches that echo too, and then relies on JSON.parse
  // failing to discard it - which works by accident, not by design.
  return [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
    .map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// ---- the set, on the index -------------------------------------------------
const indexPath = path.join(out, "en/glossary/index.html");
let setId = null;
if (!fs.existsSync(indexPath)) {
  errors.push("out/en/glossary/index.html is missing");
} else {
  const sets = ldBlocks(fs.readFileSync(indexPath, "utf8")).filter(
    (b) => b["@type"] === "DefinedTermSet"
  );
  if (sets.length !== 1) {
    errors.push(
      `glossary index carries ${sets.length} DefinedTermSet block(s); expected exactly 1`
    );
  } else {
    setId = sets[0]["@id"];
    if (!setId) errors.push("the DefinedTermSet on the index has no @id for terms to reference");
  }
}

// ---- the terms -------------------------------------------------------------
const termsDir = path.join(out, "en/glossary");
const slugs = fs
  .readdirSync(termsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !["domain", "kind"].includes(d.name))
  .map((d) => d.name)
  .sort();

const STEP = Math.max(1, Math.floor(slugs.length / 120));
const sample = slugs.filter((_, i) => i % STEP === 0);
let checked = 0;

for (const slug of sample) {
  const p = path.join(termsDir, slug, "index.html");
  if (!fs.existsSync(p)) continue;
  const terms = ldBlocks(fs.readFileSync(p, "utf8")).filter(
    (b) => b["@type"] === "DefinedTerm"
  );
  checked++;

  if (terms.length !== 1) {
    errors.push(`${slug}: ${terms.length} DefinedTerm block(s); expected exactly 1`);
    continue;
  }
  const t = terms[0];
  const desc = typeof t.description === "string" ? t.description : "";

  if (!desc.trim()) {
    errors.push(`${slug}: DefinedTerm has an empty description`);
  } else if (/^entries\.[a-z0-9-]+\.def$/i.test(desc.trim())) {
    errors.push(
      `${slug}: description is the UNRESOLVED MESSAGE KEY "${desc.trim()}" - a machine ` +
        `would read that as the definition`
    );
  } else if (desc.trim().length < 20) {
    errors.push(`${slug}: description is only ${desc.trim().length} characters`);
  }

  if (!t.name) errors.push(`${slug}: DefinedTerm has no name`);
  if (!t.termCode) errors.push(`${slug}: DefinedTerm has no termCode`);

  const ref = t.inDefinedTermSet?.["@id"];
  if (!ref) {
    errors.push(`${slug}: DefinedTerm does not reference a DefinedTermSet`);
  } else if (setId && ref !== setId) {
    errors.push(
      `${slug}: references set "${ref}" but the index publishes "${setId}" - dangling reference`
    );
  }
}

if (checked === 0) errors.push("no glossary term pages were checked - the sample found nothing");

// ---- Learn articles: TechArticle ------------------------------------------
// Same failure modes, same postbuild reasoning. The one that matters most here
// is the AUTHOR REFERENCE: the whole point of this schema is to attach 670
// articles to the Person carried by /about, so an article that omits it or
// points somewhere else is the feature silently not happening.
const learnDir = path.join(out, "en/learn");
let learnChecked = 0;
if (fs.existsSync(learnDir)) {
  const arts = fs
    .readdirSync(learnDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const lstep = Math.max(1, Math.floor(arts.length / 80));
  for (const slug of arts.filter((_, i) => i % lstep === 0)) {
    const p2 = path.join(learnDir, slug, "index.html");
    if (!fs.existsSync(p2)) continue;
    const blocks = ldBlocks(fs.readFileSync(p2, "utf8")).filter(
      (b) => b["@type"] === "TechArticle"
    );
    learnChecked++;
    if (blocks.length !== 1) {
      errors.push(`learn/${slug}: ${blocks.length} TechArticle block(s); expected exactly 1`);
      continue;
    }
    const a = blocks[0];
    if (!a.headline) errors.push(`learn/${slug}: TechArticle has no headline`);
    if (!a.description || String(a.description).trim().length < 20) {
      errors.push(`learn/${slug}: TechArticle description is missing or a stub`);
    }
    if (!a.author?.["@id"]) {
      errors.push(
        `learn/${slug}: TechArticle has no author reference - the entire purpose of ` +
          `this schema is to attach the article to the Person on /about`
      );
    }
    if (a.dateModified && !/^\d{4}-\d{2}-\d{2}/.test(String(a.dateModified))) {
      errors.push(`learn/${slug}: dateModified "${a.dateModified}" is not an ISO date`);
    }
  }
}

if (errors.length > 0) {
  console.error("[check-structured-data] FAIL:\n");
  for (const e of errors.slice(0, 12)) console.error(`  - ${e}`);
  if (errors.length > 12) console.error(`  ... and ${errors.length - 12} more`);
  console.error("\n  See the header of this script for why each rule exists.\n");
  process.exit(1);
}

console.log(
  `[check-structured-data] OK: ${checked} term page(s) sampled of ${slugs.length} ` +
    `(DefinedTerm, all referencing the set on the index) and ${learnChecked} ` +
    `Learn article(s) (TechArticle, each with an author reference).`
);
