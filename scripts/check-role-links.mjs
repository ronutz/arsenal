#!/usr/bin/env node
// ============================================================================
// check-role-links  —  PART IV of the roles enrichment round.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. The programme for the round names one artefact as the thing
// that keeps it from happening twice: a guard that fails the build on a broken
// cross-reference, IN EITHER DIRECTION.
//
// Forward links are written by whoever writes the new page. Reverse links are
// written by nobody, which is why they rot. This checks both, plus every other
// slug a role entry points at:
//
//   adjacentRoles   -> must resolve to a role in this corpus
//   relatedTools    -> must resolve to a tool that is BUILT and available
//   practiceRoles   -> must be one of the five values The Practice defines
//   provenance      -> already covered by check-roles; not repeated here
//
// AND THE REVERSE CHECK THAT MATTERS: adjacency is a claim that two roles are
// related, and a relation that holds in one direction and not the other is
// usually an omission rather than a decision. This reports those asymmetries
// rather than failing on them, because a few are deliberate — a specialist may
// point at a generalist without the generalist listing every specialist.
// ============================================================================

import fs from "node:fs";

const roles = fs.readFileSync("src/lib/roles.ts", "utf8");
const toolsConfig = fs.readFileSync("src/config/tools.ts", "utf8");

// --- what exists ----------------------------------------------------------
const roleSlugs = new Set([...roles.matchAll(/^    slug: "([a-z0-9-]+)",$/gm)].map((m) => m[1]));
const availableTools = new Set(
  [...toolsConfig.matchAll(/id: "([a-z0-9-]+)"[^}]*available: true/g)].map((m) => m[1]),
);
const PRACTICE_ROLES = new Set(["first-line", "second-line", "field", "design", "management"]);

// Every practice article that exists, read from the corpus rather than listed
// here — a curated selection that names a retired article is exactly the rot
// this guard is for.
const practiceSlugs = new Set(
  fs.readdirSync("src/content/practice/en")
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, "")),
);

if (roleSlugs.size === 0) {
  console.error("[check-role-links] FAIL: no roles found.");
  process.exit(1);
}

// --- read each entry's outbound claims ------------------------------------
const blocks = roles.split(/\n  \{\n    slug: "/).slice(1);
const problems = [];
const adjacency = new Map();

for (const raw of blocks) {
  const slug = raw.slice(0, raw.indexOf('"'));
  const list = (field) => {
    const m = new RegExp(`${field}: \\[([^\\]]*)\\]`).exec(raw);
    return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
  };

  const adj = list("adjacentRoles");
  adjacency.set(slug, adj);
  for (const other of adj) {
    if (!roleSlugs.has(other)) problems.push(`${slug}: adjacentRoles names "${other}", which is no role in this corpus`);
    if (other === slug) problems.push(`${slug}: lists itself as adjacent`);
  }
  for (const t of list("relatedTools")) {
    if (!availableTools.has(t)) problems.push(`${slug}: relatedTools names "${t}", which is no available tool`);
  }
  for (const a of list("practiceArticles")) {
    if (!practiceSlugs.has(a)) problems.push(`${slug}: practiceArticles names "${a}", which is no article in The Practice`);
  }
  for (const r of list("practiceRoles")) {
    if (!PRACTICE_ROLES.has(r)) problems.push(`${slug}: practiceRoles has "${r}", which The Practice does not define`);
  }
}

if (problems.length > 0) {
  console.error(`\n[check-role-links] FAIL: ${problems.length} broken cross-reference(s).\n`);
  for (const p of problems.slice(0, 25)) console.error(`      ${p}`);
  if (problems.length > 25) console.error(`      ... and ${problems.length - 25} more`);
  console.error("");
  process.exit(1);
}

// --- the reverse view, REPORTED rather than enforced ----------------------
const asymmetric = [];
for (const [from, list] of adjacency) {
  for (const to of list) {
    if (!(adjacency.get(to) ?? []).includes(from)) asymmetric.push(`${from} -> ${to}`);
  }
}

const toolRefs = [...adjacency.keys()].length;
console.log(
  `[check-role-links] OK: ${toolRefs} role(s); every adjacency, tool, practice tag and chosen article resolves (${practiceSlugs.size} articles available).` +
  (asymmetric.length > 0
    ? `\n                   ${asymmetric.length} one-way adjacency claim(s), reported for the enrichment round:` +
      `\n                     ${asymmetric.slice(0, 8).join("\n                     ")}` +
      (asymmetric.length > 8 ? `\n                     ... and ${asymmetric.length - 8} more` : "")
    : "\n                   every adjacency is mutual."),
);
