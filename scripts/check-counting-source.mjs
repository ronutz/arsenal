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
//      Worker writes nothing to the platform's custom log stream, which is what
//      Privacy's Workers Logs paragraph says ("the site's own code adds nothing
//      to these records").
//   4. The Privacy and Stats pages still import the source addresses, and the
//      English and Portuguese packs carry the two paragraphs that render them
//      with their links (privacy_page.noTrackSource, stats_page.sourceLine).
//
// WHAT THE HOST DOES (privacy round 3, PRIME's decisions of 2026-10-26).
//   5. Workers Logs. Privacy says Cloudflare turns them on by default for new
//      Workers "and the site's configuration does not turn it off". If
//      wrangler.jsonc ever sets observability (or its logs, or invocation
//      logs) to false, that sentence becomes false: the guard fails and says
//      to revise privacy_page.hostingLogs in the sixteen packs.
//   6. The disclosure stays on the page. privacy/page.tsx imports
//      src/config/providerSources.ts and renders hostingLogs, hostingBots and
//      hostingNel; every pack that carries those keys keeps their links,
//      hostingBots names both cookies (__cf_bm, cf_clearance) and hostingNel
//      both headers (NEL, Report-To) in every language. And hostingNel says
//      the site's own code does not set those headers, so neither
//      public/_headers nor the Worker code may set NEL, Report-To or
//      Reporting-Endpoints.
//   7. No bare cookie claim. Live pages carry Cloudflare's bot-check script,
//      and Cloudflare documents the __cf_bm and cf_clearance cookies that go
//      with it, so "this site sets no cookies of any kind" is false. In the
//      English and Portuguese packs (the glossary, the tools' own keys, the
//      Learn series and the dev rooms excepted: they talk about cookies in
//      general, not about this site), "of any kind" beside a cookie claim
//      always fails, and any other cookie-absence claim must say whose cookies
//      it means: the site's own code (or the count), or name __cf_bm, or be one
//      of the SCOPED keys below, each with its reason.
//
// SINCE 2026-10-26 (B9; checks 5 to 7 privacy round 3). Wired into prebuild.
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
  if (log) failures.push(`worker/${f} calls ${log[0].replace(/\s/g, "")}: Privacy says the Worker adds nothing to Cloudflare's Workers Logs and logs no query or request body.`);
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

// 5. Workers Logs: Privacy says the configuration does not turn them off; hold the configuration to that.
const wranglerCode = code(read("wrangler.jsonc"));
// observability.enabled, observability.logs.enabled or observability.logs.invocation_logs set to false (looked for
// within the block's first 600 characters, so an "enabled": false elsewhere in the file is not mistaken for it).
const logsOff = /"observability"\s*:\s*\{[\s\S]{0,600}?"(?:enabled|invocation_logs)"\s*:\s*false/.test(wranglerCode);
if (logsOff) {
  failures.push(
    "wrangler.jsonc turns Workers Logs (or its invocation logs) off: privacy_page.hostingLogs says the configuration " +
      "does not, in all sixteen packs. Revise that paragraph (and its revision note) together with the configuration."
  );
}

// 6. The host's disclosure stays on the Privacy page, with its links, in every pack that carries it.
const privacyPage = read("src/app/[locale]/privacy/page.tsx");
for (const needle of ["@/config/providerSources", '"hostingLogs"', '"hostingBots"', '"hostingNel"']) {
  if (!privacyPage.includes(needle)) failures.push(`src/app/[locale]/privacy/page.tsx no longer has ${needle}: the host's logs and bot check must stay disclosed.`);
}
// The tags each paragraph needs: the links to Cloudflare's pages (and the code face for the two cookie names).
const HOST_TAGS = { hostingLogs: ["logs", "pricing"], hostingBots: ["jsd", "cookies"], hostingNel: ["nel", "spec"] };
// The literal names each paragraph must keep, the same in every language.
const HOST_NAMES = { hostingBots: ["__cf_bm", "cf_clearance"], hostingNel: ["NEL", "Report-To"] };
for (const file of fs.readdirSync(path.join(ROOT, "src/i18n/messages")).filter((f) => f.endsWith(".json"))) {
  // The locale, from the file name.
  const loc = file.replace(/\.json$/, "");
  // The pack's privacy namespace.
  const ns = JSON.parse(read(`src/i18n/messages/${file}`) || "{}")?.privacy_page ?? {};
  for (const [key, tags] of Object.entries(HOST_TAGS)) {
    const v = ns[key];
    // English and Portuguese must carry both paragraphs; the other fourteen fall back to English when absent.
    if (typeof v !== "string") {
      if (loc === "en" || loc === "pt-BR") failures.push(`${loc}:privacy_page.${key} is missing: Privacy must disclose what Cloudflare does as the host.`);
      continue;
    }
    for (const tag of tags) if (!v.includes(`<${tag}>`)) failures.push(`${loc}:privacy_page.${key} has lost its <${tag}> source link (Cloudflare's or the W3C's documentation).`);
    // The cookie and header names are the same in every language.
    for (const name of HOST_NAMES[key] ?? []) if (!v.includes(name)) failures.push(`${loc}:privacy_page.${key} no longer names ${name}.`);
  }
}
// hostingNel says the site's own code does not set the NEL headers: hold public/_headers and the Worker to that.
// A header line in _headers ("  NEL: ...") or a header name as a string literal in Worker code.
if (/^\s*(?:NEL|Report-To|Reporting-Endpoints)\s*:/im.test(read("public/_headers"))) {
  failures.push("public/_headers sets NEL, Report-To or Reporting-Endpoints: privacy_page.hostingNel says the site's own code sets none of them.");
}
for (const f of workerFiles) {
  const nel = code(read(path.join("worker", f))).match(/["'`](?:nel|report-to|reporting-endpoints)["'`]/i);
  if (nel) failures.push(`worker/${f} names the ${nel[0]} header: privacy_page.hostingNel says the site's own code sets no reporting header.`);
}

// 7. No bare cookie claim in the English and Portuguese copy.
// Namespaces that talk about cookies in general, not about this site.
const COOKIE_SKIP = new Set(["glossary", "tools", "learnSeries", "devOther", "devOut", "toolRequirements"]);
// A cookie-absence claim, per language.
const COOKIE_CLAIM = {
  en: /\b(?:no cookies?|sets? no cookies?|without (?:any )?cookies?|cookie-free)\b/i,
  "pt-BR": /\b(?:sem cookies?|não grava(?:m)? cookies?|não usa(?:m)? cookies?|nenhum cookie|não há cookies?)\b/i,
};
// "Of any kind" beside a cookie claim: the sentence PRIME's decision retired. Always a failure.
const COOKIE_ANY_KIND = {
  en: /\bcookies? of any kind\b|\bany kind of cookies?\b/i,
  "pt-BR": /\bcookies? de nenhum tipo\b|\bnenhum tipo de cookies?\b/i,
};
// A claim is scoped when the same string says whose cookies it means, or names the host's cookie.
const COOKIE_SCOPE = {
  en: /\b(?:site's own code|site's code|own code|counted without)\b|__cf_bm/i,
  "pt-BR": /\b(?:código do (?:próprio )?site|próprio código|contadas sem)\b|__cf_bm/i,
};
// Keys whose cookie claim is about one thing, not the whole site; each with its reason. The list may only shrink.
const SCOPED_COOKIE_KEYS = new Map([
  ["privacy_page.prefsBody", "About the preferences only: they live in localStorage, not in a cookie, which stays true."],
]);
// How many claims were read, for the report.
let cookieClaims = 0;
for (const loc of ["en", "pt-BR"]) {
  // The authored pack.
  const pack = JSON.parse(read(`src/i18n/messages/${loc}.json`) || "{}");
  // Every string with its dotted key, the general namespaces skipped.
  const walk = (node, keys) => {
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) if (!(keys.length === 0 && COOKIE_SKIP.has(k))) walk(v, [...keys, k]);
    } else if (typeof node === "string") {
      const key = keys.join(".");
      // "Of any kind": never.
      const any = node.match(COOKIE_ANY_KIND[loc]);
      if (any) failures.push(`${loc}:${key}: "${any[0]}" - the site's own code sets no cookies, but Cloudflare's bot check may set __cf_bm and cf_clearance.`);
      // Any other claim: it must say whose cookies, unless declared.
      const claim = node.match(COOKIE_CLAIM[loc]);
      if (!claim) return;
      cookieClaims++;
      if (!any && !COOKIE_SCOPE[loc].test(node) && !SCOPED_COOKIE_KEYS.has(key)) {
        failures.push(`${loc}:${key}: "${claim[0]}" with no scope - say it is the site's own code that sets none (Cloudflare's bot check may set __cf_bm).`);
      }
    }
  };
  walk(pack, []);
}

// Verdict.
if (failures.length) {
  console.error(`\n[check-counting-source] FAIL: ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    "\n  The Privacy and Stats pages link the code that counts and say what Cloudflare does as the host; the links, the " +
      "configuration and what the pages say must stay true of each other.\n"
  );
  process.exit(1); // the build stops here
}
// The success line.
console.log(
  `[check-counting-source] OK: ${linked.length} linked source file(s) present; Analytics Engine still bound; ` +
    `${workerFiles.length} Worker file(s) read no client address header and call no console method; ` +
    `Privacy and Stats carry the source links in en and pt-BR; Workers Logs not turned off in wrangler.jsonc, as ` +
    `Privacy says; the host's logs, bot check and error reporting disclosed with their links, and no reporting header ` +
    `set by the site's code; ${cookieClaims} cookie claim(s) in en and ` +
    `pt-BR, all scoped. Since 2026-10-26 (B9; host disclosure, privacy round 3).`
);
