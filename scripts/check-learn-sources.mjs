// ============================================================================
// scripts/check-learn-sources.mjs
// ----------------------------------------------------------------------------
// A SOURCES GUARD FOR THE LEARN CORPUS, SCOPED BEFORE IT WAS WRITTEN.
//
// The industry corpus has `check-sources` at 221/221 because every entry is a
// claim about a company and every one of those can be checked. Learn is not
// like that, and the scoping is the whole design:
//
//   539 en articles
//     46 carry an external link
//    110 name a KB or an RFC number
//    413 carry NEITHER
//
// *** A GUARD DEMANDING A SOURCE ON EVERY ARTICLE WOULD FAIL 77% OF THE CORPUS,
// AND MOST OF THOSE FAILURES WOULD BE CORRECT ARTICLES. *** An explainer about
// how XML document order works, or what a persistence record is, has nothing to
// cite - the subject is the explanation. Demanding a link there teaches people
// to add decorative ones, which is worse than none because it looks like rigour.
//
// SO THE GUARD TARGETS THE CLAIMS THAT AGE.
//
// An article that names a SPECIFIC VERSION - "21.1", "FortiOS 7.6.0", "v2.0" -
// is asserting something that was true of a release, and a reader hitting it two
// versions later needs to know where to re-check. That is exactly the class the
// eight F5 articles fell into on 2026-08-10, when I first refused them as
// unverifiable and PRIME pointed out the facts were in F5's public docs.
//
// WHAT COUNTS AS A SOURCE, AND WHY A HYPERLINK IS NOT THE ONLY FORM:
//
//   - a markdown link to an external URL
//   - *** A KB NUMBER IN PROSE *** (K14510) - this is how F5's own documentation
//     and support cases cite, 25 articles do it, and on 2026-08-10 I reported
//     those articles as having "zero citations" because I grepped for markdown
//     link syntax. The check measured whether a citation was CLICKABLE, not
//     whether one EXISTED.
//   - an RFC number in prose (RFC 8484)
//
// VERSION NUMBERS INSIDE CODE ARE NOT CLAIMS. A `set mode` example or a config
// snippet showing `17.1.0` is illustrating syntax, so fenced blocks and inline
// code are stripped before the scan.
//
// FAILING IS NOT THE ONLY OUTCOME. This guard reports a BUDGET: it fails when
// the unsourced count RISES above the recorded baseline, which is the same
// ratchet `check-sources` uses - the number may only go down. That way it
// protects the corpus from getting worse without demanding a 64-article
// retrofit in the turn it lands.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const DIR = "src/content/learn/en";

// The baseline is a measurement, not a target. Lower it when work lands; never
// raise it without saying why in the commit that does.
const BASELINE = 64;

const VERSION = /\b(?:v|version\s)?\d+\.\d+(?:\.\d+)?\b/;
const EXTERNAL_LINK = /\]\(https?:\/\//;
const KB_OR_RFC = /\bK\d{4,}\b|\bRFC\s?\d{3,}\b/;

/** Strip fenced and inline code: a version in an example is not a claim. */
function prose(body) {
  return body.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
}

const unsourced = [];
let scanned = 0;
let versioned = 0;

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".mdx"))) {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const parts = raw.split("---");
  if (parts.length < 3) continue;
  const body = parts.slice(2).join("---");
  scanned += 1;

  if (!VERSION.test(prose(body))) continue;
  versioned += 1;

  if (EXTERNAL_LINK.test(body) || KB_OR_RFC.test(body)) continue;
  unsourced.push(file.replace(/\.mdx$/, ""));
}

const n = unsourced.length;

if (n > BASELINE) {
  console.error(`\n[check-learn-sources] FAIL:\n`);
  console.error(
    `  ${n} article(s) name a version in prose and cite nothing, against a baseline of ${BASELINE}.`,
  );
  console.error(
    `  An article asserting something version-specific needs somewhere to re-check it.\n`,
  );
  console.error(`  A source is any of: an external link, a KB number (K14510),`);
  console.error(`  or an RFC number (RFC 8484). A KB number in prose counts.\n`);
  for (const s of unsourced.slice(0, 20)) console.error(`      ${s}`);
  if (n > 20) console.error(`      ... and ${n - 20} more`);
  console.error("");
  process.exit(1);
}

console.log(
  `[check-learn-sources] OK: ${scanned} en articles; ${versioned} make a version-specific claim; ` +
    `${n} of those cite nothing (baseline ${BASELINE}, may only go down).`,
);
