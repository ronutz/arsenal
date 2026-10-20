// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-english-reviewed.mjs  (prebuild)
// ----------------------------------------------------------------------------
// ENGLISH IS ALWAYS REVIEWED. PRIME 2026-10-19 18:57: "Mark all as reviewed.
// English should always be reviewed." English is the reference edition the
// whole site falls back to, so no English Learn article may carry
// `status: machine-draft` or `status: stub`: every file in
// src/content/learn/en/ must declare `status: reviewed` in its front matter.
// The day the rule arrived, one article had shipped as machine-draft (the
// routing-table article of 2026-10-19, following an older line of
// TOOL-BUILD-RUNBOOK.md that the same change corrected).
//
// It also reports, without failing, the Brazilian Portuguese articles that are
// not reviewed (zero on the day it arrived). The machine drafts of the fourteen
// partial locales are out of scope: PRIME parked translation, and their status
// is honest (canon NEW-SESSION-BOOT-PROMPT, section 5).
// ============================================================================
import { readdirSync, readFileSync } from "node:fs"; // the article files are read as text
import { join } from "node:path"; // paths from the repository root

// The tag every output line carries.
const TAG = "[check-english-reviewed]";
// The Learn content root, relative to the repository root prebuild runs from.
const LEARN = join("src", "content", "learn");
// The status line of an article's front matter (the first block between --- lines).
const STATUS = /^status:\s*["']?([a-z-]+)["']?\s*$/m;

/** Every .mdx article in one locale folder, with the status its front matter declares (null when it has none). */
function statuses(locale) {
  // The locale's folder.
  const dir = join(LEARN, locale);
  // Each article file, in a stable order.
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .map((f) => {
      // The file's text.
      const text = readFileSync(join(dir, f), "utf8");
      // Its front matter: the text between the opening --- and the next --- line.
      const fm = text.startsWith("---") ? text.slice(3, text.indexOf("\n---", 3)) : "";
      // The declared status, or null.
      const m = fm.match(STATUS);
      // One record per file.
      return { file: f, status: m ? m[1] : null };
    });
}

// English: every article reviewed, or the build stops.
const en = statuses("en");
// The English articles that are not reviewed.
const bad = en.filter((a) => a.status !== "reviewed");
// Brazilian Portuguese: reported only.
const pt = statuses("pt-BR").filter((a) => a.status !== "reviewed");
// The report line for Portuguese.
const ptLine = `${pt.length} pt-BR article(s) not reviewed${pt.length ? ": " + pt.map((a) => a.file).join(", ") : ""}`;
// A red guard names every offending file and the remedy.
if (bad.length) {
  // The failure, with the rule's source.
  console.error(`${TAG} FAIL: ${bad.length} English article(s) not marked reviewed. English is always reviewed (PRIME 2026-10-19 18:57): set "status: reviewed".`);
  // One line per file, with what it declares.
  for (const a of bad) console.error(`  - en/${a.file}: status ${a.status ?? "missing"}`);
  // Stop the build.
  process.exit(1);
}
// Green.
console.log(`${TAG} OK: ${en.length} English article(s), all reviewed; ${ptLine}.`);
