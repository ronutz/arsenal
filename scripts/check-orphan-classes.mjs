#!/usr/bin/env node
/**
 * GUARD 44 - check-orphan-classes
 *
 * WHY THIS EXISTS
 * ---------------
 * Every new page type on this site has shipped visually unfinished at least
 * once, and always for the same mechanical reason: the component emits a class
 * name, nobody writes the matching CSS rule, and nothing in the build notices.
 * The page renders, every other guard passes, and the defect is invisible until
 * a human opens the page and says it looks wrong.
 *
 * The existing verification could not catch it. probe-render greps the built
 * HTML for a fragment of text, which answers "is the content there" and says
 * nothing about "does it look like anything". So content correctness was
 * enforced by machine and presentation correctness was enforced by PRIME
 * noticing. That asymmetry is the actual bug, and this guard closes it.
 *
 * WHAT IT CHECKS
 * --------------
 * For every built page, collect the class names in the markup, keep the ones
 * this project authors (see AUTHORED below), and assert each has at least one
 * rule in the built stylesheets. A class we invented and never styled is a
 * defect by definition: it means the component author intended a visual
 * distinction that does not exist on screen.
 *
 * WHAT IT DELIBERATELY IGNORES
 * ----------------------------
 * - Framework and hashed classes, which are generated and not ours to style.
 * - Utility classes from the base stylesheet, which are matched normally.
 * We only judge names we chose, because those are the ones where an absent
 * rule means an absent intention.
 */

import fs from "node:fs";
import path from "node:path";

const OUT = "out";
const CSS_DIR = path.join(OUT, "_next", "static", "css");

// Class-name prefixes this project authors. A name starting with one of these
// is ours, and is expected to have a rule. Extend this list when a new
// component family is introduced - that is the point at which the guard starts
// protecting it.
const AUTHORED = [
  "people-", "glossary-", "tool-", "learn-", "industry-", "milestone-",
  "vendor-", "profile-", "study-", "path-", "cert-", "timeline-",
];

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === "index.html") acc.push(p);
  }
  return acc;
}

if (!fs.existsSync(OUT) || !fs.existsSync(CSS_DIR)) {
  console.log("[check-orphan-classes] SKIP: no build output to inspect.");
  process.exit(0);
}

// One concatenated blob is enough: we only ask whether a rule exists anywhere,
// not which file it came from.
const css = fs
  .readdirSync(CSS_DIR)
  .filter((f) => f.endsWith(".css"))
  .map((f) => fs.readFileSync(path.join(CSS_DIR, f), "utf8"))
  .join("\n");

const pages = walk(OUT);
const orphans = new Map(); // class -> first page that used it

for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (!cls || !AUTHORED.some((p) => cls.startsWith(p))) continue;
      if (orphans.has(cls)) continue;
      // Escape for a literal selector match. A rule may be `.x{`, `.x,`,
      // `.x ` or `.x:hover`, so we look for the name followed by a character
      // that can legally terminate a class selector.
      const esc = cls.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
      if (!new RegExp(`\\.${esc}(?![\\w-])`).test(css)) {
        orphans.set(cls, path.relative(OUT, page));
      }
    }
  }
}

if (orphans.size) {
  console.error("\n[check-orphan-classes] FAIL:\n");
  console.error(
    `  ${orphans.size} authored class(es) appear in markup with no CSS rule.`
  );
  console.error("  The component intended a visual distinction that does not render.\n");
  for (const [cls, page] of [...orphans].sort()) {
    console.error(`    .${cls}  (first seen: ${page})`);
  }
  console.error("\n  Fix: write the rule, or remove the class from the component.\n");
  process.exit(1);
}

console.log(
  `[check-orphan-classes] OK: ${pages.length} page(s); every authored class has a rule.`
);
