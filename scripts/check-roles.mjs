#!/usr/bin/env node
// ============================================================================
// check-roles
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. The Roles corpus makes a claim about its own authority on
// every page: held, worked alongside, or documented. PRIME's ruling of
// 2026-08-14 is that the marker is a CITATION rather than a BADGE — a badge
// says trust me, a citation says check me.
//
// So this guard rejects a bare marker:
//
//   held / alongside  ->  MUST carry `where` AND `when`
//   documented        ->  MUST carry at least one source with a URL
//
// It also enforces that every role fills every section, because a page missing
// "who it serves" or "what it is measured on" has quietly become a job advert.
//
// AND IT POLICES R-2 IN THE ONE PLACE THAT MATTERS MOST: `turnsOn` is the
// single argument each page makes, and it is the field most likely to drift
// into a correction of somebody else's error. It must state what IS.
// ============================================================================

import fs from "node:fs";

const src = fs.readFileSync("src/lib/roles.ts", "utf8");

// The dataset is TypeScript, so read it the way the OG check reads its inputs:
// by structure rather than by evaluating it.
const blocks = src.split(/\n  \{\n    slug: "/).slice(1);
if (blocks.length === 0) {
  console.error("[check-roles] FAIL: no role entries found in src/lib/roles.ts");
  process.exit(1);
}

const REQUIRED_TEXT = ["whatItIs", "turnsOn"];
const REQUIRED_LISTS = [
  "theDay", "accountableFor", "measuredOn", "receivesFrom",
  "serves", "stakeholders", "requirements", "adjacentRoles", "practiceRoles",
];

const problems = [];
let held = 0, alongside = 0, documented = 0;

for (const raw of blocks) {
  const slug = raw.slice(0, raw.indexOf('"'));
  const body = raw;

  // --- provenance: the citation rule ------------------------------------
  const kind = /kind:\s*"(held|alongside|documented)"/.exec(body)?.[1];
  if (!kind) {
    problems.push(`${slug}: no provenance kind`);
  } else if (kind === "held" || kind === "alongside") {
    if (kind === "held") held += 1; else alongside += 1;
    const where = /where:\s*"([^"]{4,})"/.exec(body);
    const when = /when:\s*"([^"]{4,})"/.exec(body);
    if (!where) problems.push(`${slug}: provenance "${kind}" with no \`where\` — a bare marker is a claim, not a citation`);
    if (!when) problems.push(`${slug}: provenance "${kind}" with no \`when\` — a bare marker is a claim, not a citation`);
  } else {
    documented += 1;
    if (!/sources:\s*\[[\s\S]*?url:/.test(body)) {
      problems.push(`${slug}: provenance "documented" with no source carrying a URL`);
    }
  }

  // --- every section present and saying something ------------------------
  for (const f of REQUIRED_TEXT) {
    const m = new RegExp(`${f}:\\s*\n?\\s*"([^"]*)"`).exec(body);
    if (!m || m[1].length < 60) problems.push(`${slug}: ${f} is missing or too short to say anything`);
  }
  for (const f of REQUIRED_LISTS) {
    const m = new RegExp(`${f}:\\s*\\[([\\s\\S]*?)\\n    \\]`).exec(body)
      ?? new RegExp(`${f}:\\s*\\[([^\\]]*)\\]`).exec(body);
    if (!m) { problems.push(`${slug}: ${f} missing`); continue; }
    const items = (m[1].match(/"/g) ?? []).length;
    if (items < 2) problems.push(`${slug}: ${f} has fewer than one entry`);
  }

  // --- R-2, at two strengths ---------------------------------------------
  //
  // `turnsOn` is the single argument each page makes and the field most likely
  // to drift into correcting somebody else's error, so it is held strictly:
  // even ordinary negation is rewritten there, and every time it has been, the
  // positive form said more.
  const turns = /turnsOn:\s*\n?\s*"([\s\S]*?)",\n/.exec(body)?.[1] ?? "";
  for (const phrase of ["is not ", "does not ", "never ", "misconception", "people think", "wrongly"]) {
    if (turns.toLowerCase().includes(phrase)) {
      problems.push(`${slug}: turnsOn contains "${phrase.trim()}" — R-2: state what the job IS rather than correcting an error`);
    }
  }

  // EVERY OTHER PROSE FIELD is held to the CORRECTION-SHAPED markers only.
  //
  // Measuring first showed why: across 1,218 public strings the corpus carried
  // 12 negations, and all of them were DESCRIPTIVE — "systems the analyst has
  // never operated", "ground truth a remote case cannot produce", and an ITIL
  // sentence quoted inside a source label. Those state what IS. Banning
  // ordinary negation everywhere would have forced twelve edits that made the
  // prose worse, which is the manufactured-edit failure this canon has refused
  // before.
  //
  // What R-2 actually forbids is copy that frames itself as fixing somebody's
  // error, so that is what is checked.
  const prose = body.replace(/turnsOn:[\s\S]*?",\n/, "");
  for (const phrase of ["misconception", "people think", "commonly believed", "contrary to popular"]) {
    if (prose.toLowerCase().includes(phrase)) {
      problems.push(`${slug}: prose contains "${phrase}" — R-2: state what the role IS rather than correcting a belief about it`);
    }
  }
}

if (problems.length > 0) {
  console.error(`\n[check-roles] FAIL: ${problems.length} problem(s).\n`);
  for (const p of problems.slice(0, 20)) console.error(`      ${p}`);
  if (problems.length > 20) console.error(`      ... and ${problems.length - 20} more`);
  console.error("");
  process.exit(1);
}

console.log(
  `[check-roles] OK: ${blocks.length} role(s); provenance held ${held}, alongside ${alongside}, documented ${documented}; every marker carries its citation.`,
);
