#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// check-person-year-sources — WHERE DID THE YEAR ON /people COME FROM?
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-09-30 PRIME asked, of https://ronutz.com/en/people/,
// "where came the year attributed to each person from?" The answer was that
// nothing checked. `personYear` is hand-set on 148 glossary entries and drives
// the /people timeline; 88 of those years were named by NO source label on the
// entry that carries them. A reader who wanted to verify a date had nowhere to
// go, and the site could not tell a researched year from a typed one.
//
// Worse than undated years came out of the same sweep:
//
//   * alexander-graham-bell had ONE source, and it was about somebody else. The
//     label described Norman Abramson's 2007 IEEE Bell Medal for random multiple
//     access and pointed at the ALOHA packet radio milestone. Bell's entry
//     carried no source about Bell at all. Nothing could have caught it:
//     check-sources counts sources, and one source is one source.
//   * nii-quaynor and kanchana-kanchanasut both cited the same Yahoo Finance
//     listicle for a Hall of Fame induction that the Hall of Fame documents
//     itself.
//   * adiel-akplogan carried personYear 2004 while the entry's own copy said
//     "in 2003 helped found AFRINIC" and the entry's own cited Internet Hall of
//     Fame page said "By 2003, Akplogan had helped start AFRINIC" - a page that
//     never mentions 2004. The timeline and the prose disagreed on a public
//     page. Corrected to 2003 against its own evidence.
//
// *** WHY A DECLARED LIST PER SLUG AND NOT A COUNT. *** A bare "88 undated years
// tolerated" cannot say WHICH 88, so it tolerates the eighty-ninth equally, and
// it cannot see a SWAP: one careless new person arrives undated as one old one
// gets a dated citation, and the total never moves. Declared per slug, both
// halves of that swap fail - the newcomer as undeclared, the fixed entry as a
// stale declaration.
//
// *** WHY EACH DECLARATION CARRIES A CATEGORY RATHER THAN ONE BLANKET REASON. ***
// One reason repeated 63 times is the bare count again, in prose. Every unnamed
// year was tested against three separate facts, each gathered by fetching:
// does a source LABEL name the year, does the entry's own COPY state it, and
// does the CITED PAGE state it. Four categories fall out, and they are not
// equally serious:
//
//   COPY+PAGE (2)  The copy and the cited page both state the year. Label debt
//                   only: a reader who follows the link finds the date.
//   PAGE-ONLY (5)  The cited page states it; the copy does not.
//   COPY-ONLY (4)   The copy states it; no cited page does.
//   NEITHER   (12)  NOTHING states it - not the label, not the page, not the
//                   copy. This is the only category that needs PRIME, and
//                   reducing PRIME's decision from 88 entries to 12 is the
//                   point of the exercise.
//
// The screening test was deliberately weakened first and then strengthened: a
// grep for the four-digit year anywhere on a page proves only that the string
// occurs, not that the page attributes that year to the work the entry is
// about. So the sentence around every hit was captured and read, which is why
// PAGE-ONLY and COPY+PAGE are honest categories and not a grep's opinion.
//
// *** TWO TRAPS THAT READING CAUGHT AND NO COUNT WOULD HAVE. ***
//
//   1. A DECADE CONTAINS ITS YEAR. "1980s" contains "1980", so a substring test
//      reported susan-headley as stated by BOTH her copy and her cited page. Her
//      copy says "late 1970s and early 1980s" and never a bare 1980; the page
//      says the same, plus 1977. Her year is stated NOWHERE and she sits in
//      NEITHER. The screen was re-run requiring the year not be followed by "s",
//      which demoted exactly her - confirming the trap was real and narrow.
//   2. AN ARCHIVE SIDEBAR CONTAINS EVERY YEAR. A blog's "2010 (47)" archive
//      count and a post's own date both satisfy any regex and assert nothing
//      about the person. No pattern can separate those from prose, so they were
//      separated by reading: sandro-suffert dropped to COPY-ONLY, because his
//      cited page holds 2010 only as an archive count, while rodrigo-montoro
//      kept COPY+PAGE, because his cited page IS the dated January 2010 post
//      that the entry is about.
//
// IT DOES NOT CHECK THAT THE YEAR IS RIGHT. It checks that the year is
// ACCOUNTED FOR. A wrong year with a citation naming it is a different defect,
// and no build guard can catch it; that is what reading is for.
//
// *** AND IT CANNOT TELL WHICH YEAR A LABEL MEANS. *** The check is "does a label
// contain the year", which an INCIDENTAL year satisfies. On 2026-09-30 a
// replacement label for glenn-ricart mentioned "between 1985 and 1989" for his
// South America work; his anchor marks the exchange point, and the guard
// promptly reported the year as named. The label was trimmed to the exchange
// point instead, and he stayed declared. So a label added to clear this guard
// must state the year OF THE ANCHORED WORK, and only reading enforces that.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

// The glossary is parsed from source rather than imported, so this stays a
// plain node script with no build step, which is how every other guard here
// works. Entry blocks open with exactly two spaces and a brace.
const root = process.cwd();
const src = fs.readFileSync(
  path.join(root, "src/content/glossary/glossary.ts"),
  "utf8"
);

// Years whose citation does not name them, declared one per slug with the
// category that says WHY, so a reader can tell label debt from an unanchored
// editorial judgement. Generated from the 2026-09-30 sweep; every entry here
// was fetched and read. This list may only shrink.
const DECLARED_ANCHOR = new Map([
  // NEITHER (12) - NOTHING states it: no label, no cited page, no entry copy - awaiting PRIME
  ["susan-headley", { year: 1980, why: "NEITHER" }],
  ["anchises-moraes", { year: 2011, why: "NEITHER" }],
  ["cristine-hoepers", { year: 1997, why: "NEITHER" }],
  ["daniel-j-bernstein", { year: 1996, why: "NEITHER" }],
  ["filipe-balestra", { year: 2008, why: "NEITHER" }],
  ["jaime-andres-restrepo", { year: 2009, why: "NEITHER" }],
  ["jude-milhon", { year: 1992, why: "NEITHER" }],
  ["liane-tarouco", { year: 1988, why: "NEITHER" }],
  ["michal-zalewski", { year: 2013, why: "NEITHER" }],
  ["nii-quaynor", { year: 1993, why: "NEITHER" }],
  ["rodrigo-rubira-branco", { year: 2007, why: "NEITHER" }],
  ["willian-caprino", { year: 2007, why: "NEITHER" }],

  // COPY-ONLY (4) - the entry copy states it; no cited page does
  ["sandro-suffert", { year: 2010, why: "COPY-ONLY" }],
  ["dvd-jon", { year: 1999, why: "COPY-ONLY" }],
  ["solar-designer", { year: 1996, why: "COPY-ONLY" }],
  ["space-rogue", { year: 1998, why: "COPY-ONLY" }],

  // PAGE-ONLY (5) - the cited page states it; neither the label nor the entry copy does
  ["barbara-liskov", { year: 1988, why: "PAGE-ONLY" }],
  ["glenn-ricart", { year: 1989, why: "PAGE-ONLY" }],
  ["katie-moussouris", { year: 2013, why: "PAGE-ONLY" }],
  ["nelson-murilo", { year: 1997, why: "PAGE-ONLY" }],
  ["wietse-venema", { year: 1995, why: "PAGE-ONLY" }],

  // COPY+PAGE (2) - the entry copy and the cited page both state it; only the label is silent
  ["emmanuel-goldstein", { year: 1984, why: "COPY+PAGE" }],
  ["ray-tomlinson", { year: 1971, why: "COPY+PAGE" }],

]);

// Entries whose anchor year appears in a label ONLY as the boundary of a range -
// "from 1988 to 1993", "1952-1959", "around 1869 to 1875". A range boundary IS a
// stated date, so these are legitimate. They are declared because a range is also
// where an INCIDENTAL year hides, and only reading tells the two apart.
// dan-kaminsky was the case that proved it: his 2008 was satisfied by the string
// "CVE-2008-1447", a vulnerability identifier and not a date. Both his labels now
// state the date, so he is not on this list.
const DECLARED_RANGE_ONLY = new Map([
  ["elizabeth-feinler", "her group ran the Host Naming Registry from 1972 to 1989; 1972 is when it started"],
  ["grace-hopper", "the IEEE milestone proposal is itself titled 'Compiler and Programming Language Work, 1952-1959'"],
  ["karen-banks", "from 1990 to 1997 she maintained the GnFido gateway at GreenNet; 1990 is when it started"],
  ["paul-vixie", "he worked on BIND at DEC from 1988 to 1993; 1988 is when that work started"],
  ["tadao-takahashi", "associated with the organisation from 1989 to 1996; 1989 is when that started"],
  ["tarek-kamel", "from 1992 to 1999 he established Egypt's first internet connection; 1992 is when that started"],
  ["william-crookes", "the tube was invented around 1869 to 1875; 1875 is the end of that range and what the entry anchors"],
]);

// Split the file into entry blocks. A block runs from a line that is exactly
// "  {" to the line that closes it at the same indentation.
const lines = src.split("\n");
const blocks = [];
let cur = null;
for (const line of lines) {
  if (line === "  {") {
    cur = [];
    continue;
  }
  if (cur && (line === "  }," || line === "  }")) {
    blocks.push(cur.join("\n"));
    cur = null;
    continue;
  }
  if (cur) cur.push(line);
}

// For every entry carrying a personYear, decide whether one of its own source
// labels names that year.
const people = [];
for (const b of blocks) {
  const slug = (b.match(/^\s*slug:\s*"([^"]+)"/m) || [])[1];
  const year = (b.match(/^\s*personYear:\s*(\d{3,4})/m) || [])[1];
  if (!slug || !year) continue;
  const labels = [...b.matchAll(/label:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  const hrefs = [...b.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
  // Every occurrence of the year across every label, each classified as being a
  // range boundary or standing on its own. A year that never stands on its own
  // may be a date - or may be a CVE identifier or a government plan's name.
  const hits = [];
  for (const l of labels) {
    let at = -1;
    while ((at = l.indexOf(year, at + 1)) !== -1) {
      const after = l.slice(at + year.length, at + year.length + 6);
      const before = l.slice(Math.max(0, at - 6), at);
      const isRange =
        /^\s*(-|\u2013|to )\s*\d{2,4}/.test(after) ||
        /\d{2,4}\s*(-|\u2013|to )\s*$/.test(before);
      hits.push({ isRange, window: l.slice(Math.max(0, at - 70), at + 90) });
    }
  }
  people.push({
    slug,
    year,
    named: hits.length > 0,
    rangeOnly: hits.length > 0 && hits.every((h) => h.isRange),
    windows: hits.map((h) => h.window),
    labelCount: labels.length,
    hrefCount: hrefs.length,
  });
}

const named = people.filter((p) => p.named);
const unnamed = people.filter((p) => !p.named);

// FAULT 1: a year no label names and no declaration covers. This is the case a
// new person added without a dated citation lands in.
const undeclared = unnamed.filter((p) => !DECLARED_ANCHOR.has(p.slug));

// FAULT 2: a declaration for an entry whose label now names the year. The
// declaration is stale and must come off, which is the half of a swap a bare
// count cannot see.
const stale = [...DECLARED_ANCHOR.keys()].filter((slug) => {
  const p = people.find((x) => x.slug === slug);
  return p && p.named;
});

// FAULT 3: a declaration for a slug that no longer carries a personYear at all,
// so the list cannot rot around entries that have changed underneath it.
const orphaned = [...DECLARED_ANCHOR.keys()].filter(
  (slug) => !people.some((p) => p.slug === slug)
);

// FAULT 4: a declared year that no longer matches the entry's personYear. The
// declaration records the year it was verified against; if the number moved,
// the evidence behind the declaration no longer applies to it.
const drifted = [];
for (const [slug, d] of DECLARED_ANCHOR) {
  const p = people.find((x) => x.slug === slug);
  if (p && !p.named && Number(p.year) !== d.year) {
    drifted.push({ slug, declared: d.year, actual: Number(p.year) });
  }
}

// FAULT 5: a person entry with a year and no citation at all. Distinct from an
// undated citation, and strictly worse: there is nothing to follow.
const uncited = people.filter((p) => p.hrefCount === 0);

// FAULT 6: the anchor year appears in every label ONLY as a range boundary, and
// the entry is not declared as such. A range boundary is a real date; a CVE
// identifier and a plan's name are not, and both satisfy a substring test.
const rangeOnly = people.filter((p) => p.rangeOnly && !DECLARED_RANGE_ONLY.has(p.slug));

// A range-only declaration the entry no longer needs, so this list can only shrink.
const staleRange = [...DECLARED_RANGE_ONLY.keys()].filter((slug) => {
  const p = people.find((x) => x.slug === slug);
  return p && !p.rangeOnly;
});

const failed =
  rangeOnly.length > 0 ||
  staleRange.length > 0 ||
  undeclared.length > 0 ||
  stale.length > 0 ||
  orphaned.length > 0 ||
  drifted.length > 0 ||
  uncited.length > 0;

if (failed) {
  console.error("\n[check-person-year-sources] FAIL\n");
  if (undeclared.length > 0) {
    console.error(
      `  ${undeclared.length} personYear(s) named by no source label and not declared:`
    );
    for (const p of undeclared) console.error(`      ${p.slug} (${p.year})`);
    console.error(
      "\n      The /people timeline puts this year on a public page. Either cite a\n" +
        "      document that names it - the work itself, not an award page for the work -\n" +
        "      or add the slug to DECLARED_ANCHOR with the category that says why.\n"
    );
  }
  if (stale.length > 0) {
    console.error(
      `  ${stale.length} stale declaration(s) - the label now names the year, so the entry comes off the list:`
    );
    for (const s of stale) console.error(`      ${s}`);
    console.error("");
  }
  if (orphaned.length > 0) {
    console.error(
      `  ${orphaned.length} declaration(s) for a slug that no longer carries a personYear:`
    );
    for (const s of orphaned) console.error(`      ${s}`);
    console.error("");
  }
  if (drifted.length > 0) {
    console.error(
      `  ${drifted.length} declaration(s) whose year moved since it was verified:`
    );
    for (const d of drifted)
      console.error(`      ${d.slug}: declared ${d.declared}, entry now says ${d.actual}`);
    console.error(
      "\n      The declaration records the year the evidence was checked against. A new\n" +
        "      number needs new evidence, not an edited declaration.\n"
    );
  }
  if (rangeOnly.length > 0) {
    console.error(
      `  ${rangeOnly.length} personYear(s) whose year appears in a label ONLY inside a range:`
    );
    for (const p of rangeOnly) {
      console.error(`      ${p.slug} (${p.year})`);
      for (const w of p.windows) console.error(`          ...${w}...`);
    }
    console.error(
      "\n      A range boundary is a real date and may be declared in DECLARED_RANGE_ONLY\n" +
        "      with the reason. But a CVE identifier and the name of a government plan also\n" +
        "      contain a year and state no date at all - dan-kaminsky's 2008 was satisfied by\n" +
        "      \"CVE-2008-1447\". Read the window above before declaring it.\n"
    );
  }
  if (staleRange.length > 0) {
    console.error(
      `  ${staleRange.length} range-only declaration(s) no longer needed - the year now stands alone:`
    );
    for (const slug of staleRange) console.error(`      ${slug}`);
    console.error("");
  }
  if (uncited.length > 0) {
    console.error(
      `  ${uncited.length} person entry(ies) with a year and NO citation link at all:`
    );
    for (const p of uncited)
      console.error(`      ${p.slug} (${p.year}) - ${p.labelCount} label(s), 0 href(s)`);
    console.error(
      "\n      A label naming a book or a case with no link is not somewhere a reader can go.\n"
    );
  }
  process.exit(1);
}

// Report the category split so the shape of the remaining debt is visible in
// every build log rather than only in a canon file.
const byWhy = new Map();
for (const [, d] of DECLARED_ANCHOR) byWhy.set(d.why, (byWhy.get(d.why) || 0) + 1);
const split = [...byWhy]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([k, n]) => `${k} ${n}`)
  .join(", ");
console.log(
  `[check-person-year-sources] OK: ${people.length} person entry(ies) with a year; ` +
    `${named.length} named by their own citation; ${unnamed.length} declared (${split}); ` +
    `${DECLARED_RANGE_ONLY.size} named only by a declared range boundary; ` +
    `every entry carries at least one citation link.`
);
