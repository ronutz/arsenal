// ============================================================================
// scripts/check-mdx-compile.mjs
// ----------------------------------------------------------------------------
// MDX COMPILE GATE (PRIME ratified 2026-08-08).
//
// WHY THIS EXISTS: every other guard reads MDX frontmatter. `check-practice`
// reads the body too, but only measures its LENGTH. Nothing compiled it. A
// malformed body - an unclosed JSX tag, a stray `<`, a broken table - passed
// all 31 guards and failed only at `next build`, nine and a half minutes later.
//
// That single gap was the reason a full build had to run on every content-only
// turn. Closing it here moves the signal from ~560s to ~seconds AND makes it
// stronger, because it now runs on every guard invocation rather than only when
// somebody builds. See BUILD-RESOURCE-RECIPE §"Build cadence follows push
// cadence".
//
// FIDELITY: compiled with remark-gfm, which is what the pages use and what
// decides whether tables and autolinks parse. The rehype pass
// (rehypeGlossaryHints) is deliberately NOT applied: it rewrites the HTML tree
// after parsing and cannot change whether the source is valid MDX, so including
// it would cost time and buy nothing.
//
// SCOPE: every .mdx under src/content - practice, learn and blog alike. A guard
// that covered only the directory being worked on today would be a guard that
// silently stops covering tomorrow's.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "src", "content");

/** Every .mdx under src/content, recursively. */
function findMdx(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findMdx(full));
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

const files = fs.existsSync(CONTENT) ? findMdx(CONTENT) : [];
const problems = [];

// Compiled concurrently: these are independent pure parses and the wall-clock
// difference over ~2,000 files is the difference between a guard that runs
// every turn and one that gets skipped.
await Promise.all(
  files.map(async (full) => {
    const rel = path.relative(ROOT, full);
    let body;
    try {
      body = matter(fs.readFileSync(full, "utf8")).content;
    } catch (e) {
      problems.push(`${rel}: frontmatter did not parse - ${e.message}`);
      return;
    }
    try {
      await compile(body, { remarkPlugins: [remarkGfm] });
    } catch (e) {
      // MDX errors carry line/column; keep them, they are the whole value.
      const where = e.line ? ` (line ${e.line}${e.column ? `, col ${e.column}` : ""})` : "";
      problems.push(`${rel}${where}: ${e.reason ?? e.message}`);
    }
  }),
);

if (problems.length) {
  console.error(`[check-mdx-compile] FAIL: ${problems.length} file(s) do not compile.\n`);
  for (const p of problems.sort()) console.error(`  - ${p}`);
  console.error(
    `\nThese would have failed the build. Fixing them here costs seconds; finding` +
      ` them in a full build costs minutes.`,
  );
  process.exit(1);
}

console.log(`[check-mdx-compile] OK: ${files.length} MDX file(s) compile (remark-gfm, as the pages parse them).`);
