#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-redirects.mjs — THE SEVENTEENTH GUARD
//
// Cloudflare drops _redirects rules SILENTLY when a limit or an ordering rule
// is broken. No build error, no dashboard warning; the rule simply stops
// existing. So the only place this can be caught is here.
//
// It checks three things, each of which has already gone wrong once:
//
//   1. NO CAREER SLUG IS REDIRECTED. /about/vendors/<career-slug> serves a live
//      career page. Step 4 converts career vendors into partnerVendors entries
//      so their history renders from the shared route - which means any
//      generator reading partnerVendors will cheerfully emit a redirect that
//      kills the career page. It did, for six of them.
//
//   2. LIMITS: 2,000 static and 100 dynamic.
//
//   3. ORDER: every static rule before every dynamic one, which Cloudflare
//      requires and which silently drops rules when violated.
// ============================================================================

import { readFileSync } from "node:fs";

const FILE = "public/_redirects";
const raw = readFileSync(FILE, "utf8");
const lines = raw.split("\n");

const rules = [];
lines.forEach((line, i) => {
  const t = line.trim();
  if (!t || t.startsWith("#")) return;
  rules.push({ i, t, dynamic: t.includes("*") || /:[a-z]/.test(t) });
});

const dynamic = rules.filter((r) => r.dynamic);
const statics = rules.filter((r) => !r.dynamic);
const failures = [];

if (statics.length > 2000) failures.push(`${statics.length} static rules exceeds the limit of 2,000.`);
if (dynamic.length > 100) failures.push(`${dynamic.length} dynamic rules exceeds the limit of 100.`);

if (statics.length && dynamic.length) {
  const lastStatic = Math.max(...statics.map((r) => r.i));
  const firstDynamic = Math.min(...dynamic.map((r) => r.i));
  if (firstDynamic < lastStatic) {
    failures.push(
      `Dynamic rule at line ${firstDynamic + 1} appears before static rule at line ${lastStatic + 1}. Cloudflare requires all static rules first and silently drops the rest otherwise.`,
    );
  }
}

// Career slugs must never be redirected away from /about/vendors/<slug>.
const career = [
  ...readFileSync("src/content/vendors/career.ts", "utf8").matchAll(/\{ slug: "([a-z0-9-]+)"/g),
].map((m) => m[1]);
for (const r of rules) {
  for (const slug of career) {
    if (new RegExp(`^/[a-zA-Z-]+/about/vendors/${slug}/\\s`).test(r.t)) {
      failures.push(
        `Line ${r.i + 1} redirects the CAREER page /about/vendors/${slug} away. That page is live; remove the rule.\n      ${r.t}`,
      );
    }
  }
}

if (failures.length) {
  console.error(`\n[check-redirects] FAIL:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

console.log(
  `[check-redirects] OK: ${statics.length}/2000 static, ${dynamic.length}/100 dynamic, ordering correct, no career page redirected.`,
);
