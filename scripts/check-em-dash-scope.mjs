#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// check-em-dash-scope — D-55 ON THE ENGLISH COPY THE OTHER GUARD NEVER SAW.
// ----------------------------------------------------------------------------
// WHY THERE ARE TWO EM-DASH GUARDS.
//
// `check-em-dash-policy` reports "0 em dashes in English copy, enforced at zero
// since 2026-09-26". That is true, and it is true of THREE DIRECTORIES:
//
//     src/content/learn/en    src/content/blog/en    src/content/tool-docs/en
//
// On 2026-09-27 an audit of every guard for two specific blind spots - a bare
// tolerance count, and a scope narrower than the claim - found that D-55 was
// unenforced everywhere else. What it found, measured, split between public copy
// and code comment, and split again between prose and cited document titles
// (ALL OF IT SINCE PAID DOWN - see DECLARED_BACKLOG below):
//
//     src/content/practice/en/                     681
//     src/i18n/messages/en.json                    213   <- locale strings, which
//                                                             the rule names
//     src/lib/roles.ts                              55
//     src/content/catalogue/catalogue.ts            25
//     src/content/changelog/changelog.ts             5
//                                                  ---
//                                                  979
//
// *** AND 499 THAT ARE NOT VIOLATIONS AT ALL. *** Every em dash in
// study-guides.ts sits inside a cited Fortinet document title - "FortiSASE—
// Administration Guide", "FortiOS 7.6.0—New Features" - where the dash is the
// VENDOR'S typography. Changing it would misquote the source. The distinction is
// mechanical and was verified before being relied on: in study-guides.ts all 499
// are UNSPACED and none are spaced; in every prose surface the reverse holds. So
// the exemption is declared for that one file, not inferred from spacing
// site-wide, because an unspaced em dash in prose is a violation too.
//
// WHY A BACKLOG AND NOT A HARD ZERO. Turning 979 instances red would stop all
// work until several hundred sentences are rewritten by hand, and a guard that
// does that gets reverted. So the backlog is DECLARED PER SURFACE with a count
// and a date, it may only shrink, and anything NEW fails. Per surface and not as
// one number, for the reason the whole 2026-09-27 audit exists: a single total
// cannot see one violation arriving as another leaves.
//
// The other guard keeps its clean zero over its three directories. Two guards
// rather than one because those two contracts are different, and merging them
// would bury a hard-won zero inside a backlog.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const EM = "—";

// Surfaces of ENGLISH public copy outside check-em-dash-policy's TARGETS.
// `kind` picks the parser: markdown strips fenced code, ts/json strips comments
// and counts only string literals, because a dash in a // comment is not published.
const SURFACES = [
  { p: "src/content/practice/en",                   kind: "md-dir" },
  { p: "src/i18n/messages/en.json",                 kind: "strings" },
  { p: "src/lib/roles.ts",                          kind: "strings" },
  { p: "src/content/catalogue/catalogue.ts",        kind: "strings" },
  { p: "src/content/changelog/changelog.ts",        kind: "strings" },
  { p: "src/content/certifications/study-guides.ts", kind: "strings" },
  { p: "src/config/toolProvenance.ts",              kind: "strings" },
  { p: "src/content/guide/recipes.ts",              kind: "strings" },
  { p: "src/content/testimonials/data.ts",          kind: "strings" },
  { p: "src/content/vendors/partners.ts",           kind: "strings" },
  { p: "src/content/glossary/glossary.ts",          kind: "strings" },
  // Code that EMITS copy. A tool engine's strings are what the user reads in the
  // output panel, and a component's are what the page renders. Added 2026-09-27
  // when the 814 em dashes in these four areas were split: 551 sit in comments and
  // are not published, and the rest are the site's own prose - "Canonical name - an
  // alias pointing this name at another name (RFC 1035)", "Unix - seconds".
  { p: "src/lib",                                   kind: "strings-dir" },
  { p: "src/components",                            kind: "strings-dir" },
  { p: "src/app",                                   kind: "strings-dir" },
  { p: "src/config",                                kind: "strings-dir" },
];

// Files whose em dashes reproduce a QUOTED SOURCE'S OWN typography. D-55 governs
// the site's voice, not the punctuation of sentences the site is quoting: editing
// somebody else's words to fit a house rule falsifies the quotation. Verified file
// by file, never assumed, and the reason has to name what is being quoted.
const QUOTED_SOURCE_EXEMPT = new Map([
  ["src/content/certifications/study-guides.ts",
   "Every em dash here is inside a manualLinks label quoting a Fortinet document title as Fortinet writes it (FortiSASE-Administration Guide, FortiOS 7.6.0-New Features, FortiNAC-F-Manager 7.6). Verified 2026-09-27: 499 unspaced, 0 spaced, all inside label fields."],
  ["src/content/testimonials/data.ts",
   "One em dash, inside an ownerResponse: a training provider's verbatim reply to a review. The file's own header calls its text the VERBATIM original and the source of truth, and it is generated rather than hand-edited. Repunctuating a quoted reply would misreport what the person wrote."],
]);

// Pre-existing backlog, per surface. IT MAY ONLY SHRINK.
//
// THE CONTENT SURFACES ARE AT ZERO; THE CODE SURFACES ARE NOT YET.
//
// When this guard was written on
// 2026-09-27 the backlog was 979 across five surfaces, measured after splitting
// public copy from code comment and prose from quoted title. It was paid down the
// same day: 1,008 em dashes (the 979 plus 29 in code comments) became spaced
// hyphens, which is the house convention and not an invention - learn/en, the
// corpus already at zero, carries 2,266 instances of " - " between words, and the
// changelog itself already wrote "pt-BR - platform architecture".
//
// Four keys in en.json needed a hand rather than a swap, because the dash sat at
// the START or END of a UI fragment instead of between two clauses:
// tools.mtu-mss.stack.insideMtu, tools.mtu-mss.stack.onFrame,
// tools.network-os-comparer.noSecond and redEducation.explainersMine.
//
// NOTHING in pt-BR was touched: D-55 reserves the travessao for non-English
// locales, and practice/pt-BR alone holds 714 that must stay. Verified after the
// change: 714 still there, learn/pt-BR 1,087, pt-BR.json 412.
//
// So the eleven CONTENT surfaces are at zero, the same contract
// check-em-dash-policy holds over its three. The four CODE surfaces added the
// same day are not: they carry 134 published strings, declared below and frozen
// at that number. Any surface needing an entry here gets a count AND the date it
// was measured, never a bare number.
const DECLARED_BACKLOG = new Map([
  // Code surfaces, measured 2026-09-27. 134 published strings in total, reached
  // independently by two different parsers that agreed. Awaiting a change of its
  // own: see the note above on golden vectors and GOLDEN_VECTOR_SET_ID.
  ["src/lib",        113],   // tool engines and manifests - dig-output-explainer 22,
                             // f5-ssl-profile-explainer 7, f5-release-cadence-calendar 7
  ["src/components",  17],   // tool UIs - EpochTool 4, StatsPanels 3, CidrTool 2
  ["src/app",          4],   // page-level strings
]);

/** Markdown: the WHOLE file, stripping nothing.
 *
 *  Two earlier versions of this function were wrong in the same direction and both
 *  undercounted. Stripping fenced code gave 605 where `grep -ro "—"` gives 681;
 *  stripping frontmatter as well kept it at 605, because the 76 difference was in
 *  the frontmatter all along - in `title:`, `thesis:` and `artefact:`, which are
 *  the most visible published copy on a practice page, not metadata.
 *
 *  So this strips nothing, and a markdown surface's count is exactly what one grep
 *  reports. That property is worth more than a cleverer figure: a number a reader
 *  can check in a single command beats a number they have to read this file to
 *  reproduce. Genuinely quoted material belongs in QUOTED_SOURCE_EXEMPT, per file
 *  and with a reason, not in a blanket rule that hides instances. */
function mdCopy(text) {
  return text;
}

/** String literals of a .ts/.tsx/.json file, with comments removed first.
 *
 *  ALL THREE QUOTE FORMS. An earlier version matched only "..." and so missed
 *  '...' and `...`, which in .tsx are at least as common - it reported 105 where the
 *  true figure is higher. A backlog declared from that undercount would have frozen
 *  the blind spot into the ratchet, which is the failure this guard was written to
 *  stop. Template literals are counted as written: an em dash inside a ${...}
 *  interpolation comes from a value that is itself a string somewhere, so counting
 *  the raw text errs toward reporting rather than hiding. */
function tsStrings(text) {
  const noComments = text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return [
    ...[...noComments.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]),
    ...[...noComments.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]),
    ...[...noComments.matchAll(/`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1]),
  ];
}

function countIn(surface) {
  const { p, kind } = surface;
  if (!fs.existsSync(p)) return 0;
  let n = 0;
  if (kind === "md-dir") {
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(md|mdx)$/.test(e.name)) {
          n += (mdCopy(fs.readFileSync(full, "utf8")).match(new RegExp(EM, "g")) || []).length;
        }
      }
    };
    walk(p);
  } else if (kind === "strings-dir") {
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(e.name)) {
          for (const str of tsStrings(fs.readFileSync(full, "utf8"))) {
            n += (str.match(new RegExp(EM, "g")) || []).length;
          }
        }
      }
    };
    walk(p);
  } else {
    for (const s of tsStrings(fs.readFileSync(p, "utf8"))) {
      n += (s.match(new RegExp(EM, "g")) || []).length;
    }
  }
  return n;
}

const over = [];   // more than declared, or undeclared entirely
const under = [];  // fewer than declared: the backlog shrank, lower the number
let exempted = 0;
let total = 0;

for (const surface of SURFACES) {
  const n = countIn(surface);
  if (QUOTED_SOURCE_EXEMPT.has(surface.p)) { exempted += n; continue; }
  total += n;
  const declared = DECLARED_BACKLOG.get(surface.p) ?? 0;
  if (n > declared) over.push({ p: surface.p, found: n, declared });
  else if (n < declared) under.push({ p: surface.p, found: n, declared });
}

if (over.length > 0) {
  console.error(`\n[check-em-dash-scope] FAIL: ${over.length} surface(s) gained em dashes in English copy (D-55).\n`);
  for (const o of over) console.error(`  ${o.p}  found ${o.found}, declared ${o.declared}`);
  console.error(
    "\n      D-55: English public copy carries no em dash. Use a spaced hyphen, a comma,\n" +
      "      or recast the sentence. If the dash sits inside QUOTED material (a cited\n" +
      "      title, or somebody else's verbatim words), add it to QUOTED_SOURCE_EXEMPT.\n" +
      "      Do not raise DECLARED_BACKLOG: it records what was already there on\n" +
      "      2026-09-27 and may only shrink.\n"
  );
  process.exit(1);
}

if (under.length > 0) {
  console.error(`\n[check-em-dash-scope] FAIL: ${under.length} backlog entr(y/ies) are now too high. Lower them to lock the gain in:\n`);
  for (const u of under) console.error(`  ${u.p}  declared ${u.declared}, found ${u.found}`);
  console.error("");
  process.exit(1);
}

console.log(
  `[check-em-dash-scope] OK: ${SURFACES.length} English surface(s) beyond ` +
    `check-em-dash-policy's three directories; ${total} em dash(es), ` +
    `${DECLARED_BACKLOG.size === 0 ? "enforced at zero since 2026-09-27" : `backlog across ${DECLARED_BACKLOG.size} surface(s), may only shrink`}; ` +
    `${exempted} exempt as quoted source material.`
);
