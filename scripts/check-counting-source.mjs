#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-counting-source.mjs - WHAT PRIVACY AND STATS SAY ABOUT THE
// COUNT STAYS TRUE OF THE CODE THEY LINK
// ----------------------------------------------------------------------------
// WHY THIS EXISTS (Round 1 batch B, B9, 2026-10-26). The production audit of
// 2026-10-19 noted that the Privacy and Stats pages make claims about the
// server-side count (what is written, what is never written, how long it is
// kept) that a reader cannot verify from the browser. Both pages now link the
// public files that do the counting (src/config/countingSource.ts) and cite
// Cloudflare's documentation for the store's retention. A link is only worth
// something while the code behind it still does what the page says, so this
// guard holds the link and the claims together.
//
// WHAT IT CHECKS.
//   1. Every repository file countingSource.ts links (worker/analytics.ts,
//      worker/stats.ts, wrangler.jsonc) exists at that path in this tree, so a
//      move or a rename cannot leave the pages pointing at nothing.
//   2. wrangler.jsonc still binds Analytics Engine datasets: the retention the
//      pages cite (three months) is Analytics Engine's, and stops applying if
//      the counts move to another store.
//   3. The Worker code (worker/*.ts, the generated type file excepted) reads no
//      client address header (cf-connecting-ip, x-forwarded-for, x-real-ip,
//      true-client-ip) outside comments, so "the counting code never writes
//      your IP address" stays true; and it calls no console method, so the
//      Worker writes nothing to the platform's custom log stream. (Cloudflare's
//      own invocation logs are a platform setting no code check can see; see
//      the B9 notes.)
//   4. The Privacy and Stats pages still import the source addresses, and the
//      English and Portuguese packs carry the two paragraphs that render them
//      with their links (privacy_page.noTrackSource, stats_page.sourceLine).
//
// SINCE 2026-10-26 (B9). Wired into prebuild.
// ============================================================================

// File access for the sources and the packs.
import fs from "node:fs";
// Path joining, so the guard runs from the repository root like its siblings.
import path from "node:path";

// The repository root: prebuild runs every guard from there.
const ROOT = process.cwd();
// Every failure, one sentence each.
const failures = [];

/** Read a repository file as text (an empty string when missing, which the checks then report). */
const read = (rel) => (fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), "utf8") : "");

/** Strip // line comments and block comments, so a header that names a forbidden word does not count as code. */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

// 1. The linked files exist where the links say.
const sourceCfg = read("src/config/countingSource.ts");
// The blob/main paths the config builds: `${SOURCE_REPOSITORY}/blob/main/<path>`.
const linked = [...sourceCfg.matchAll(/\/blob\/main\/([A-Za-z0-9_./-]+)`/g)].map((m) => m[1]);
if (linked.length === 0) failures.push("src/config/countingSource.ts links no repository file (expected worker/analytics.ts, worker/stats.ts, wrangler.jsonc).");
for (const rel of linked) if (!fs.existsSync(path.join(ROOT, rel))) failures.push(`countingSource.ts links ${rel}, which does not exist in this tree.`);

// 2. The datasets are still Analytics Engine datasets.
if (!/"analytics_engine_datasets"\s*:/.test(read("wrangler.jsonc"))) {
  failures.push("wrangler.jsonc no longer binds analytics_engine_datasets: the three-month retention the pages cite is Analytics Engine's.");
}

// 3. The Worker reads no client address and logs nothing of its own.
const workerFiles = fs
  .readdirSync(path.join(ROOT, "worker"))
  .filter((f) => f.endsWith(".ts") && f !== "worker-configuration.d.ts");
for (const f of workerFiles) {
  // The file without its comments.
  const body = code(read(path.join("worker", f)));
  // A client address header named in code.
  const ip = body.match(/cf-connecting-ip|x-forwarded-for|x-real-ip|true-client-ip/i);
  if (ip) failures.push(`worker/${f} reads "${ip[0]}": the pages say the counting code never writes the visitor's IP address.`);
  // A console call: the Worker's own log lines.
  const log = body.match(/\bconsole\s*\.\s*[a-z]+\s*\(/);
  if (log) failures.push(`worker/${f} calls ${log[0].replace(/\s/g, "")}: the copy says the Worker logs no query or request body.`);
}

// 4. The pages and the packs still carry the links.
for (const [page, name] of [["src/app/[locale]/privacy/page.tsx", "COUNTING_WRITE_SOURCE"], ["src/app/[locale]/stats/page.tsx", "COUNTING_WRITE_SOURCE"]]) {
  if (!read(page).includes(name)) failures.push(`${page} no longer links the counting source (${name}).`);
}
for (const loc of ["en", "pt-BR"]) {
  // The authored pack.
  const pack = JSON.parse(read(`src/i18n/messages/${loc}.json`) || "{}");
  // The two paragraphs, each with the link to the code that counts.
  for (const [ns, key] of [["privacy_page", "noTrackSource"], ["stats_page", "sourceLine"]]) {
    const v = pack?.[ns]?.[key];
    if (typeof v !== "string" || !v.includes("<analytics>") || !v.includes("<retention>")) {
      failures.push(`${loc}:${ns}.${key} is missing or has lost its <analytics> or <retention> link.`);
    }
  }
}

// Verdict.
if (failures.length) {
  console.error(`\n[check-counting-source] FAIL: ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("\n  The Privacy and Stats pages link the code that counts; the link and what the pages say must stay true of that code.\n");
  process.exit(1); // the build stops here
}
// The success line.
console.log(
  `[check-counting-source] OK: ${linked.length} linked source file(s) present; Analytics Engine still bound; ` +
    `${workerFiles.length} Worker file(s) read no client address header and call no console method; ` +
    `Privacy and Stats carry the source links in en and pt-BR. Since 2026-10-26 (B9).`
);
