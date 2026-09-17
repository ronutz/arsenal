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

const offences = [];

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
      offences.push({
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
        offences.push({
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
// THE BASELINE, AND WHY IT IS NOT A CLIMBDOWN
//
// D-55 predates this guard by a long way and was enforced by memory alone. When
// the guard was first run it found 1,432 offences across copy written over
// months - which is the measure of how well memory works as an enforcement
// mechanism, and the reason the guard exists.
//
// Bulk-replacing 1,432 em dashes would damage 1,432 sentences: the right
// replacement is a comma, a colon, a full stop or a restructure, and which one
// depends on the sentence. So the repo's existing ratchet pattern applies, the
// same one check-css-classes uses: the number MAY ONLY GO DOWN. New copy is held
// to the real rule immediately, because any addition pushes the count above the
// baseline and fails. The backlog is repaid as files are touched and can never
// grow.
//
// Lower this number when you fix offences. Never raise it.
// PAID DOWN 2026-09-17: 1432 -> 1329. src/content/tool-docs/en is now
// ENTIRELY em-dash-free (was 103 offending lines across 31 files); the
// remaining debt is all in src/content/learn/en and src/content/blog/en.
const BASELINE = 1329;

if (offences.length > BASELINE) {
  console.error(
    `[check-em-dash-policy] FAIL: ${offences.length} dash offence(s) in English ` +
      `copy, above the baseline of ${BASELINE} (D-55). New English copy must be ` +
      `em-dash-free:\n`
  );
  for (const o of offences.slice(0, 15)) {
    console.error(`  ${o.file}:${o.line}  ${o.mark}`);
    console.error(`    ...${o.excerpt}...`);
  }
  if (offences.length > 15) console.error(`  ... and ${offences.length - 15} more`);
  console.error(
    "\n  D-55: English copy is strictly em-dash-free; en dashes only between\n" +
      "  numbers. Use a comma, a colon, or a full stop. Other languages follow\n" +
      "  their own standards and are not checked.\n"
  );
  process.exit(1);
}

if (offences.length < BASELINE) {
  console.log(
    `[check-em-dash-policy] OK: ${offences.length} offence(s), BELOW the baseline ` +
      `of ${BASELINE}. Lower BASELINE in this script to ${offences.length} to lock ` +
      `the gain in.`
  );
} else {
  console.log(
    `[check-em-dash-policy] OK: ${offences.length} offence(s) in English copy, at ` +
      `the baseline (D-55; may only go down). New copy is held to zero.`
  );
}
