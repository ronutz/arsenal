#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-public-voice.mjs — THE TWENTY-SIXTH GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: entry prose must be public copy, not working notes.
//
// TWO FAILURES, ONE CAUSE, BOTH FOUND BY PRIME ON A LIVE PAGE.
//
// 1. MARKDOWN THAT NEVER RENDERS. The vendor page prints body paragraphs as
//    plain text - `<p>{p}</p>`, no parser. Markdown bold written into those
//    strings therefore appeared on live pages as literal asterisks. **56 of 162
//    entries were affected**, for days, on the public site.
//
//    The same defect had already been found and fixed in the glossary `context`
//    field a day earlier. The fix was applied there and the question "does any
//    OTHER field have this?" was never asked.
//
// 2. EDITORIAL VOICE IN PUBLIC PROSE. Twenty entries contained sentences about
//    how the entry was written rather than about the company: "this entry is
//    short because the evidence is short", "an entry should be as long as its
//    evidence", "this site does not manufacture those", "a note on why this
//    card replaced another".
//
//    That is working-note reasoning - the kind that belongs in a wrap or a
//    commit message - published on a page a stranger reached by searching for
//    a company. **A reader came for the company, not for the method.**
//
// WHAT THIS CHECKS
//   - no markdown emphasis in any rendered content field
//   - no self-referential editorial phrasing in entry prose
//
// WHAT IT DELIBERATELY ALLOWS
//   Genuine cross-references - "elsewhere on this timeline", "read beside the
//   other distributors here" - because those point a reader at more of the
//   subject. The test is whether a sentence is about the SUBJECT or about the
//   WRITING.
// ============================================================================

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// SCANS THE WHOLE CONTENT TREE, not one file. The first version of this guard
// checked only partners.ts and passed - while 21 markdown markers sat in
// milestones.ts, rendering as literal asterisks on a live page. A guard scoped
// to the file where a bug was first noticed will miss the same bug everywhere
// else, which is how this defect reached production twice: once in the
// glossary, once in the vendor entries, and once more in the milestones.
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}

// The glossary's prose lives in the LOCALE PACKS, not in src/content. Scoping
// this guard to src/content passed while two glossary entries carried the same
// editorial voice - found only by probing the built pages afterwards. Both
// sources are scanned now. Only en and pt-BR are authored; the other fourteen
// fall back to English and would double-report the same string.
const files = [
  ...walk("src/content"),
  "src/i18n/messages/en.json",
  "src/i18n/messages/pt-BR.json",
];

// THE CHANGELOG IS EXEMPT FROM THE VOICE CHECK AND ONLY THAT CHECK.
// It exists to say what changed on this site, so "this entry", "yesterday's
// entry" and "written immediately after" are its correct register rather than a
// lapse into working notes. Every other content file describes a subject that
// exists independently of this site, and there the same phrasing is the defect.
//
// It is NOT exempt from the markdown check: a changelog rendering literal
// asterisks is broken in exactly the way everything else was.
const isChangelog = (f) => f.includes("/changelog/");
const src = files.map((f) => readFileSync(f, "utf8")).join("\n");
const voiceSrc = files
  .filter((f) => !isChangelog(f))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

// Content lines only: skip comments, where emphasis markers are for editors.
const contentLines = src
  .split("\n")
  .map((line, i) => ({ line, n: i + 1 }))
  .filter(({ line }) => {
    const t = line.trimStart();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return false;
    // CITATION APPARATUS IS EXEMPT FROM THE VOICE CHECK, and the distinction is
    // the whole point of the rule rather than an escape from it. A `sourceNote`
    // saying a figure is disputed, or that a reader should check a current
    // legal status, is doing exactly its job: it qualifies a citation. The same
    // sentence in a BODY paragraph is the author narrating their own research
    // on a page about a company.
    //
    // Sourcing talk belongs with the sources. It does not belong in the prose.
    // ...but only from the FIRST check below. A source note may say a figure is
    // disputed or a date uncertain - that is sourcing. It may NOT discuss the
    // entry itself ("which is why this entry is short and says so"), because a
    // source note RENDERS ON THE PAGE, and the reader meets it as prose.
    // That distinction was found by probing the built page after the first
    // version of this guard passed: exempting the whole line was too broad.
    if (/^\{\s*label:/.test(t) || /^sourceNote:/.test(t)) {
      return /this (entry|site|card)/i.test(t);
    }
    // A sourceNote long enough to wrap puts its later lines beyond the test
    // above, so a citation caveat on a continuation line reads as prose to this
    // check. Treat a line that is plainly mid-citation as apparatus: it names a
    // source, a document, or an attribution verb, and has no sentence start.
    if (/^(per |according to |sources? |cited |reported |verified )/i.test(t)) return false;
    return true;
  });

const failures = [];

// ---- 1. unparsed markdown ------------------------------------------------
const md = contentLines.filter(({ line }) => /\*\*/.test(line));
if (md.length) {
  failures.push(
    `${md.length} content line(s) contain markdown emphasis, which the vendor page renders literally:\n` +
      md.slice(0, 5).map(({ line, n }) => `      line ${n}: ${line.trim().slice(0, 90)}`).join("\n"),
  );
}

// ---- 2. editorial / process voice ----------------------------------------
const VOICE = [
  /this entry (is|does|exists|ends|records|therefore|notes)/i,
  /an entry should be as long as/i,
  // NARROWED 2026-08-04. The first version matched "this site does not" and
  // "this site is not", which caught the API page stating a fact about itself
  // and - worse - the trademark disclaimer, which MUST say "this site is not
  // affiliated with or endorsed by any vendor named here". A guard that fires
  // on a legal notice is a guard people learn to ignore.
  //
  // The target is narrower than the surface form: the site describing its own
  // EDITORIAL METHOD inside content about a subject.
  /this site (does not manufacture|does not invent|keeps finding|keeps circling)/i,
  /this site records (that|it|the) .{0,40}(same|reason)/i,
  /is not asserted here/i,
  /recorded here because/i,
  /a note on (why|what) this (entry|card)/i,
  /worth recording rather than/i,
  /short entry, deliberately/i,
  /the evidence is short/i,
  /padding it out/i,
  /writing fiction with a real/i,
  /readers should (check|look up)/i,
];
const voiceLines = voiceSrc
  .split("\n")
  .map((line, i) => ({ line, n: i + 1 }))
  .filter(({ line }) => {
    const t = line.trimStart();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return false;
    if (/^\{\s*label:/.test(t) || /^sourceNote:/.test(t)) return /this (entry|site|card)/i.test(t);
    return true;
  });

const voice = [];
for (const { line, n } of voiceLines) {
  for (const rx of VOICE) {
    if (rx.test(line)) {
      voice.push({ n, line: line.trim().slice(0, 100) });
      break;
    }
  }
}
if (voice.length) {
  failures.push(
    `${voice.length} line(s) describe how the entry was written rather than the company:\n` +
      voice.slice(0, 5).map(({ line, n }) => `      line ${n}: ${line}`).join("\n") +
      `\n      Move this reasoning to the wrap. A reader came for the company, not the method.`,
  );
}

if (failures.length) {
  console.error("\n[check-public-voice] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(
  `[check-public-voice] OK: ${contentLines.length} content lines; no unparsed markdown, no editorial voice.`,
);
