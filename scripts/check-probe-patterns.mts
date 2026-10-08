// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-probe-patterns.mts
// ----------------------------------------------------------------------------
// POST-BUILD GUARD (2026-10-07, PRIME: the stats were "counting 404"): the
// patterns that tell a request for a missing page from a page can never match a
// page the site actually serves. worker/probes.ts holds them: the families the
// stats page groups not-found requests into, and the legacy SQL (ILIKE patterns
// and an exact list) that judges the rows written before the status was
// recorded. A family or a legacy pattern that matched a real page would drop
// that page's readers from every people panel without a word.
//
// What it checks, failing the build on any of them:
//   1. no PROBE_FAMILIES pattern matches the path of a built page, in any
//      locale the build produced (out/<locale>/**/index.html);
//   2. no LEGACY_LIKE pattern matches one, read the way Analytics Engine SQL
//      reads ILIKE: "%" any run, "_" any one character, case-insensitive (the
//      "_" is why "openid_connect" was refused: it matched /learn/openid-connect/);
//   3. no LEGACY_EXACT path is a built page;
//   4. the families still sort the requests they were written for (a fixture of
//      the paths read on 2026-10-07, one per family), so a later edit that
//      breaks a family fails here rather than on the live page.
// Runs after the build, because it needs the built pages; prints the counts.
// ============================================================================

import { readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROBE_FAMILIES, LEGACY_LIKE, LEGACY_EXACT, probeFamily, type ProbeFamily } from "../worker/probes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");

/** Every page of the build as the Worker stores its path: /<locale>/<route>/ (the locale folders out/ holds). */
function builtPages(): string[] {
  const pages: string[] = [];
  // The locale folders: a directory of out/ that holds an index.html at its root.
  const locales = readdirSync(OUT).filter((d) => statSync(path.join(OUT, d)).isDirectory() && existsSync(path.join(OUT, d, "index.html")));
  for (const loc of locales) {
    // A depth-first walk of the locale's folders; every folder with an index.html is a page.
    const stack = [path.join(OUT, loc)];
    while (stack.length) {
      const dir = stack.pop()!;
      if (existsSync(path.join(dir, "index.html"))) {
        const rel = path.relative(OUT, dir).split(path.sep).join("/");
        pages.push(`/${rel}/`);
      }
      for (const e of readdirSync(dir)) {
        const full = path.join(dir, e);
        if (statSync(full).isDirectory()) stack.push(full);
      }
    }
  }
  return pages;
}

/** An Analytics Engine ILIKE pattern as a regular expression with the same meaning. */
function ilike(p: string): RegExp {
  const body = [...p].map((c) => (c === "%" ? ".*" : c === "_" ? "." : c.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"))).join("");
  return new RegExp(`^${body}$`, "i");
}

const errors: string[] = [];
if (!existsSync(OUT)) {
  console.error("[check-probe-patterns] FAIL: out/ is missing (this guard runs after the build)");
  process.exit(1);
}
const pages = builtPages();
if (pages.length < 100) errors.push(`only ${pages.length} pages found under out/ (has the layout changed?)`);

// 1 to 3: nothing that says "not a page" may say it of a page.
const likes = LEGACY_LIKE.map((p) => ({ p, re: ilike(p) }));
const exact = new Set(LEGACY_EXACT);
for (const page of pages) {
  const low = page.toLowerCase();
  for (const f of PROBE_FAMILIES) if (f.re.test(low)) errors.push(`family ${f.id} matches the page ${page}`);
  for (const l of likes) if (l.re.test(page)) errors.push(`legacy pattern ${l.p} matches the page ${page}`);
  if (exact.has(page)) errors.push(`legacy exact path ${page} is a page`);
}

// 4: the families still sort what they were written for.
const FIXTURE: Array<[string, ProbeFamily]> = [
  ["/en/wp-json/batch/v1/", "wp-batch"],
  ["/en/wordpress/wp-json/Batch/v1/", "wp-batch"],
  ["/en/wp-json/gravitysmtp/v1/tests/mock-data/", "wp-plugin"],
  ["/en/wp-json/wp/v2/pages/", "wp-rest"],
  ["/en/wp-includes/PHPMailer/", "wp-core"],
  ["/en/wordpress/", "wp-core"],
  ["/en/.git/config/", "secrets"],
  ["/en/.gemini/antigravity-cli/antigravity-oauth-token/", "secrets"],
  ["/en/DS_Store", "secrets"],
  ["/en/actuator/env/", "frameworks"],
  ["/en/magento_version/", "frameworks"],
  ["/en/admin/controller/extension/extension/", "platforms"],
  ["/en/modules/mod_webshell/", "backdoors"],
  ["/en/webmail/", "logins"],
  ["/en/.well-known/", "exposure"],
  ["/en/staging/", "exposure"],
  ["/en/ipfs/bafkreicyqcbhpicbos7ev4mrxofwqx6hvvge7pahpta6xuspr44crai5by/", "ipfs"],
  ["/en/.well-known/mcp/", "ai"],
  ["/en/v1/models/", "ai"],
  ["/en/careers/openings/", "crawlers"],
  ["/en/contribute/tools/", "misses"],
];
for (const [p, want] of FIXTURE) {
  const got = probeFamily(p);
  if (got !== want) errors.push(`${p} sorts as ${got}, expected ${want}`);
}

if (errors.length) {
  console.error(`[check-probe-patterns] FAIL: ${errors.length} problem(s)`);
  for (const e of errors.slice(0, 40)) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`[check-probe-patterns] OK: ${pages.length} built page(s) read; none matches one of ${PROBE_FAMILIES.length} probe families, ${LEGACY_LIKE.length} legacy patterns or ${LEGACY_EXACT.length} legacy paths; ${FIXTURE.length} fixture requests sort as written.`);
