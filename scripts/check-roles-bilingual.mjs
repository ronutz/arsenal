#!/usr/bin/env node
// ============================================================================
// check-roles-bilingual
// ----------------------------------------------------------------------------
// PRIME, 2026-08-16: "The rule was that all new content would be CREATED
// bilingual... EVERYTHING SHOULD BE BILINGUAL (except a few known and declared
// exceptions)."
//
// The Roles corpus shipped English-only - 39 roles, roughly 1,250 prose
// strings - and no guard noticed, because every parity check on this site
// compares the things that ARE translated. `check-message-parity` passes
// because both message files have every key: the prose was never in them.
//
// So this counts the roles with NO Portuguese prose and refuses to let the
// number grow. It starts at the full 39 and its only acceptable destination is
// ZERO. Each authoring session drops the baseline; nothing may raise it.
//
// It also refuses a PARTIAL role - a slug with some Portuguese fields and not
// others - because a page half in each language reads worse than a page
// honestly in one.
// ============================================================================

import fs from "node:fs";

const EN = JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8"));
const PT = JSON.parse(fs.readFileSync("src/i18n/messages/pt-BR.json", "utf8"));
const src = fs.readFileSync("src/lib/roles.ts", "utf8");

const slugs = [...src.matchAll(/^\s{4}slug: "([a-z0-9-]+)",$/gm)].map((m) => m[1]);
if (slugs.length === 0) {
  console.error("[check-roles-bilingual] FAIL: no role slugs found; the parser needs updating.");
  process.exit(1);
}

// Roles still awaiting their Portuguese. MAY ONLY GO DOWN.
const BASELINE_ENGLISH_ONLY = 0;

const ptEntries = PT?.roles?.entries ?? {};
const enEntries = EN?.roles?.entries ?? {};

const englishOnly = [];
const partial = [];

for (const slug of slugs) {
  const pt = ptEntries[slug];
  if (!pt) { englishOnly.push(slug); continue; }
  const en = enEntries[slug];
  if (en) {
    const missing = Object.keys(en).filter((k) => !(k in pt));
    if (missing.length > 0) partial.push(`${slug} (missing: ${missing.join(", ")})`);
  }
}

const problems = [];
if (partial.length > 0) {
  problems.push(
    `${partial.length} role(s) are HALF translated. A page in two languages at once reads worse than a page honestly in one:\n        ` +
    partial.slice(0, 8).join("\n        "),
  );
}
if (englishOnly.length > BASELINE_ENGLISH_ONLY) {
  problems.push(
    `${englishOnly.length} role(s) have no Portuguese prose, above the baseline of ${BASELINE_ENGLISH_ONLY}.`,
  );
}

if (problems.length > 0) {
  console.error("\n[check-roles-bilingual] FAIL\n");
  for (const p of problems) console.error(`      ${p}\n`);
  process.exit(1);
}

// FIELD COMPLETENESS, reported rather than enforced.
//
// The role-level count above answers "does this role have ANY Portuguese", and
// that is the ratchet. It cannot answer "is this role FINISHED", because the
// English side of the message file only contains the fields authored so far -
// the two sides agree with each other while both are incomplete against
// roles.ts.
//
// So the prose fields are named here and counted against roles.ts, which is the
// only place that knows how many there are. Informational until the role-level
// count reaches zero, at which point this becomes the next ratchet.
const PROSE_FIELDS = ["title", "whatItIs", "turnsOn", "theDay", "accountableFor", "measuredOn", "stakeholders", "requirements"];
let authoredFields = 0;
for (const slug of slugs) {
  const pt = ptEntries[slug];
  if (!pt) continue;
  for (const f of PROSE_FIELDS) if (f in pt) authoredFields += 1;
}
const totalFields = slugs.length * PROSE_FIELDS.length;

// Prose fields authored in Portuguese. MAY ONLY GO UP; destination is 312.
// R-19 (PRIME 2026-08-19): LOWERING this ratchet is a governed act, documented
// BEFORE it was ever needed. A legitimate scope shrink (a role removed from the
// corpus) requires: a dated PRIME ruling in canon, the justification in THIS
// file's commit, and BOTH numbers restated (new total and new baseline). Any
// lowering without those three is the ratchet failing at its one job.

// ── The PAIR corpus (F2, opened 2026-08-27): receivesFrom / serves are
// who/what pair lists, migrating from roles.ts on the same fallback model.
// A field counts as authored when it exists in the role's pt entry; totals run
// against roles.ts. Same ratchet law: the baseline may only rise (R-19 governs
// any legitimate lowering).
// ── Provenance `where` (F2 tail, 2026-08-27): the one free-text string inside
// the citation line. Counted only against roles whose provenance carries a
// `where` (kind held/alongside); `documented` roles have none. Destination
// reached same-turn, so the baseline IS the total.
const rolesSrc = fs.readFileSync("src/lib/roles.ts", "utf8");
const whereTotal = (rolesSrc.match(/kind: "(?:held|alongside)"/g) ?? []).length;
let authoredWhere = 0;
for (const slug of slugs) {
  const pt = ptEntries[slug] ?? {};
  if ("provenanceWhere" in pt) authoredWhere += 1;
}
const BASELINE_WHERE = 8;
if (authoredWhere < BASELINE_WHERE) {
  console.error(
    `[check-roles-bilingual] FAIL: provenanceWhere fell to ${authoredWhere}, below the ratchet of ${BASELINE_WHERE} (total ${whereTotal}).`
  );
  process.exit(1);
}
const PAIR_FIELDS = ["receivesFrom", "serves"];
let authoredPairFields = 0;
for (const slug of slugs) {
  const pt = ptEntries[slug] ?? {};
  for (const f of PAIR_FIELDS) if (f in pt) authoredPairFields += 1;
}
const totalPairFields = slugs.length * PAIR_FIELDS.length;
const BASELINE_PAIR_FIELDS = 78;
if (authoredPairFields < BASELINE_PAIR_FIELDS) {
  console.error(
    `[check-roles-bilingual] FAIL: pair fields fell to ${authoredPairFields}, below the ratchet of ${BASELINE_PAIR_FIELDS}.`
  );
  process.exit(1);
}
const BASELINE_FIELDS = 312;
if (authoredFields < BASELINE_FIELDS) {
  problems.push(
    `${authoredFields} prose field(s) authored, BELOW the recorded ${BASELINE_FIELDS}. ` +
    `Portuguese has been removed, not added.`,
  );
}

const done = slugs.length - englishOnly.length;
console.log(
  `[check-roles-bilingual] OK: ${done}/${slugs.length} role(s) authored in Portuguese; ` +
  `${englishOnly.length} awaiting (baseline ${BASELINE_ENGLISH_ONLY}, must reach 0); ` +
  `${authoredFields}/${totalFields} prose field(s) written; ${authoredPairFields}/${totalPairFields} pair field(s) (ratchet ${BASELINE_PAIR_FIELDS}); ${authoredWhere}/${whereTotal} provenance-where (ratchet ${BASELINE_WHERE}).` +
  (englishOnly.length < BASELINE_ENGLISH_ONLY
    ? ` PROGRESS - drop BASELINE_ENGLISH_ONLY to ${englishOnly.length}.`
    : ""),
);
