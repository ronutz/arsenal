// ============================================================================
// scripts/check-em-dash-policy.mjs   (PREBUILD)
// ----------------------------------------------------------------------------
// D-55: ENGLISH COPY IS STRICTLY EM-DASH-FREE. Other languages follow their own
// punctuation standards, where the em-dash is correct and expected.
//
// WHY THIS GUARD EXISTS. D-55 has been a standing rule since long before this
// script, enforced entirely by remembering it. On 2026-09-16 ANVIL wrote two
// Learn articles and a tool doc and put eleven em-dashes into English copy
// without noticing, then found them only by eye while fixing something else.
// A rule held up by attention is a rule that survives exactly as long as the
// attention does.
//
// ---------------------------------------------------------------------------
// WHAT IS AND IS NOT AN OFFENCE
//
//   U+2014 EM DASH        in English copy -> ALWAYS an offence.
//   U+2013 EN DASH        allowed ONLY between numbers (1996-2015, pages 3-7).
//                         Elsewhere in English it is the spaced-en-dash style
//                         D-55 reserves for Germanic and Scandinavian locales.
//   Either mark in a NON-ENGLISH locale -> not checked here. Portuguese uses
//                         the travessao, Russian and Polish the same, Chinese
//                         its own marks. D-55 is explicit that they follow
//                         their natural standards.
//
// SCOPE: authored English prose. Source code comments are exempt - they are not
// copy, no reader sees them, and this file's own header would otherwise fail.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

/** Authored ENGLISH copy. Other locales are deliberately out of scope. */
const TARGETS = [
  { dir: "src/content/learn/en", ext: ".mdx" },
  { dir: "src/content/blog/en", ext: ".mdx" },
  { dir: "src/content/tool-docs/en", ext: ".md" },
];

const EM = "\u2014";
const EN = "\u2013";

/** U+2014 in English copy. D-55 is absolute here: this list must stay EMPTY. */
const emOffences = [];
/** U+2013 outside a numeric range. Ratcheted, because the check heuristic
 *  cannot see every legitimate unspaced en dash (see BASELINE_EN below). */
const enOffences = [];

function scanFile(rel, text) {
  const lines = text.split("\n");
  let inFrontmatter = false;
  lines.forEach((line, i) => {
    if (i === 0 && line.trim() === "---") {
      inFrontmatter = true;
      return;
    }
    if (inFrontmatter) {
      if (line.trim() === "---") inFrontmatter = false;
      // Frontmatter IS copy: summary and title are rendered. Keep checking it.
    }

    if (line.includes(EM)) {
      emOffences.push({
        file: rel,
        line: i + 1,
        mark: "em dash",
        excerpt: excerptAround(line, EM),
      });
    }
    // An en dash is allowed only with a digit on both sides.
    const idx = line.indexOf(EN);
    if (idx >= 0) {
      const re = new RegExp(`\\d\\s*${EN}\\s*\\d`);
      const bare = line
        .split(EN)
        .slice(0, -1)
        .some((_, n) => {
          const before = line.split(EN)[n].slice(-2);
          const after = line.split(EN)[n + 1].slice(0, 2);
          return !/\d\s*$/.test(before) || !/^\s*\d/.test(after);
        });
      if (bare && !re.test(line)) {
        enOffences.push({
          file: rel,
          line: i + 1,
          mark: "en dash outside a numeric range",
          excerpt: excerptAround(line, EN),
        });
      }
    }
  });
}

function excerptAround(line, mark) {
  const i = line.indexOf(mark);
  return line.slice(Math.max(0, i - 34), i + 34).trim();
}

for (const { dir, ext } of TARGETS) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs).filter((f) => f.endsWith(ext))) {
    scanFile(`${dir}/${f}`, fs.readFileSync(path.join(abs, f), "utf8"));
  }
}

// ---------------------------------------------------------------------------
// THE TWO RULES, AND WHY THEY ARE NOW SEPARATE
//
// EM DASHES: ZERO. NOT A BASELINE. When this guard was first run it found 1,432
// offending lines across copy written over months, and a ratchet was the only
// honest way to start - bulk-replacing 1,432 em dashes would have damaged 1,432
// sentences, because the right replacement is a comma, a colon, a semicolon, a
// full stop or a restructure, and which one depends on the sentence.
//
// The backlog was paid down in four passes and is now CLOSED:
//   2026-09-17  1432 -> 1329   src/content/tool-docs/en cleared (103 lines).
//   2026-09-26  1329 -> 1289   src/content/blog/en cleared (40 lines).
//   2026-09-26  1289 ->   15   src/content/learn/en cleared (1,274 lines across
//                              264 files, every occurrence judged on its own
//                              sentence). Em dashes in English copy: 0.
//
// So there is no em-dash baseline any more. One em dash anywhere in authored
// English copy fails this guard. That is what D-55 always said; it is only now
// that the debt is gone and the rule can be enforced as written.
//
// EN DASHES: a small ratchet, because the check below is deliberately narrow.
// It allows U+2013 only with a digit immediately on both sides, which misses
// several forms that are CORRECT English typography:
//   - a range between backticked tokens      `30`-`39`, `JAN`-`DEC`
//   - a range between unit-bearing numbers   300 kHz-3 MHz
//   - a range between callsign prefixes      PPA-PYZ, ZV-ZZ
//   - a compound of two proper nouns         Sao Paulo-Campinas axis
//   - aligned address ranges inside a fenced code block
// Fifteen such cases survive, and rewriting them would make the typography
// worse, not better. They are listed in canon rather than papered over here.
// Do not "fix" them. If a genuinely wrong en dash is added, this number goes
// up and the guard fails; lower it when a real one is removed.
// Per-file declarations, replacing a single global count on 2026-09-27. Each
// entry is a file, how many unspaced en dashes it legitimately contains, and why.
// See the note above for why the key is the file and not the line or the excerpt.
const DECLARED_EN = new Map([
  ["src/content/learn/en/amateur-radio.mdx", [1,
    "ITU callsign block ranges, PPA-PYZ and ZV-ZZ. NOTE THE COUNT: the guard reports one offence per LINE, not per dash, and both ranges sit on the same line. Declaring 2 here was the first thing this per-file check caught, on the day it was written."]],
  ["src/content/learn/en/dhcp-option-43-discovery.mdx", [1,
    "A hex byte range, 30-39, inside a sentence about reading option payloads."]],
  ["src/content/learn/en/radio-spectrum.mdx", [2,
    "Frequency band ranges: 300 kHz-3 MHz and 300 MHz-3 GHz."]],
  ["src/content/learn/en/the-brazilian-hacker-scene.mdx", [1,
    "Sao Paulo-Campinas axis: a compound of two proper nouns, where a hyphen would read as a single hyphenated place name."]],
  // vlsm-worked-example.mdx (4) and vlsm.mdx (5) left this list on 2026-10-07: their NF-2e1 rewrites write the
  // ranges of their subnet tables with "to", so neither carries an unspaced en dash any more.
  ["src/content/tool-docs/en/cron-expression-explainer.md", [1,
    "Month and weekday name ranges, JAN-DEC and SUN-SAT, as cron writes them."]],
]);

// Kept only so the OK line can still report a total. It is derived, not declared:
// changing it changes nothing about what passes. The unit is LINES CARRYING an
// unspaced en dash, not dashes: amateur-radio.mdx has two ranges on one line and
// counts as one.
const BASELINE_EN = [...DECLARED_EN.values()].reduce((n, [c]) => n + c, 0);

let failed = false;

if (emOffences.length > 0) {
  failed = true;
  console.error(
    `[check-em-dash-policy] FAIL: ${emOffences.length} em dash(es) in English ` +
      `copy. D-55 allows none, and the backlog was paid down to zero on ` +
      `2026-09-26:\n`
  );
  for (const o of emOffences.slice(0, 15)) {
    console.error(`  ${o.file}:${o.line}`);
    console.error(`    ...${o.excerpt}...`);
  }
  if (emOffences.length > 15)
    console.error(`  ... and ${emOffences.length - 15} more`);
  console.error(
    "\n  Replace each one by judging its own sentence: a comma for an\n" +
      "  appositive, parentheses for a fenced aside, a colon where the dash\n" +
      "  introduces a list or restatement, a semicolon between two independent\n" +
      "  clauses, a full stop where the aside is really a second sentence.\n" +
      "  Do not substitute mechanically - that keeps the AI tell and only\n" +
      "  changes the glyph. Other languages follow their own standards and are\n" +
      "  not checked.\n"
  );
}

// Bucket the findings by file, then compare each against its declaration. This
// is the whole point of the change: a global comparison is blind to a swap.
const enByFile = new Map();
for (const o of enOffences) {
  if (!enByFile.has(o.file)) enByFile.set(o.file, []);
  enByFile.get(o.file).push(o);
}

const enUndeclared = [];   // a file with no declaration, or more than declared
const enStale = [];        // a declaration whose file now has fewer

for (const [file, found] of enByFile) {
  const decl = DECLARED_EN.get(file);
  if (!decl) {
    enUndeclared.push({ file, found: found.length, allowed: 0, sample: found[0] });
  } else if (found.length > decl[0]) {
    enUndeclared.push({ file, found: found.length, allowed: decl[0], sample: found[found.length - 1] });
  }
}
for (const [file, [count]] of DECLARED_EN) {
  const found = (enByFile.get(file) || []).length;
  if (found < count) enStale.push({ file, found, count });
}

if (enUndeclared.length > 0) {
  failed = true;
  console.error(
    `[check-em-dash-policy] FAIL: ${enUndeclared.length} file(s) carry an undeclared ` +
      `en dash outside a numeric range (D-55):\n`
  );
  for (const u of enUndeclared) {
    console.error(`  ${u.file}  found ${u.found}, declared ${u.allowed}`);
    if (u.sample) console.error(`    line ${u.sample.line}: ...${u.sample.excerpt}...`);
  }
  console.error(
    "\n  An en dash belongs between range endpoints, or between two proper nouns in\n" +
      "  a compound. Elsewhere in English use a hyphen for a compound modifier, or a\n" +
      "  comma. If this one is legitimate, add it to DECLARED_EN with a REASON: a\n" +
      "  global count replaced a declared list here on 2026-09-27 precisely because a\n" +
      "  count cannot see one wrong dash arriving as one legitimate dash leaves.\n"
  );
}

if (enStale.length > 0) {
  failed = true;
  console.error(
    `[check-em-dash-policy] FAIL: ${enStale.length} stale declaration(s) in DECLARED_EN. ` +
      `The list may only shrink, so lower or remove these:\n`
  );
  for (const t of enStale) console.error(`  ${t.file}  declared ${t.count}, found ${t.found}`);
  console.error("");
}


if (failed) process.exit(1);

console.log(
  `[check-em-dash-policy] OK: 0 em dashes in English copy (D-55, enforced at zero ` +
    `since 2026-09-26), and ${enOffences.length} en dash(es) outside a numeric range, ` +
    `all declared across ${DECLARED_EN.size} file(s) with a reason (per-file since ` +
    `2026-09-27; a global count could not see a swap). Other locales keep their ` +
    `native punctuation.`
);
