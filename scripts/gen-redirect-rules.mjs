#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/gen-redirect-rules.mjs
// ----------------------------------------------------------------------------
// THE REDIRECT RULES, AS THE WORKER READS THEM (PRIME 16/11/2026 00:24: "add a
// read-only stats route to the Worker", for the redirect audit of 15/11/2026,
// queue 5af). public/_redirects is consumed by Cloudflare's asset layer and is
// never served, so the Worker cannot read it at run time. This script turns it
// into worker/redirect-rules.json (one object per rule: its line in the file,
// source, destination and status), which worker/redirect-hits.ts imports to
// count how often each rule answered a request in a window.
//
// Usage:
//   node scripts/gen-redirect-rules.mjs          write the JSON (only if it changed)
//   node scripts/gen-redirect-rules.mjs --check  fail if the JSON is not what the file gives (prebuild)
//
// The parse follows Cloudflare's format, one rule per line: "[source]
// [destination] [code?]", the code defaulting to 302; blank lines and lines
// starting with "#" are skipped. A line Cloudflare would ignore (fewer than two
// fields) is reported and left out, as Cloudflare leaves it out.
// ============================================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs"; // the two files

// The rules as authored, served by nobody.
const SOURCE = "public/_redirects";
// The rules as the Worker imports them.
const OUT = "worker/redirect-rules.json";
// Check-only mode, for the prebuild chain.
const CHECK = process.argv.includes("--check");
// The status Cloudflare uses when a rule names none.
const DEFAULT_STATUS = 302;
// The statuses a _redirects rule may carry (200 is a rewrite, not a redirect, and is kept so the count is honest).
const ALLOWED = new Set([200, 301, 302, 303, 307, 308]);

// One object per rule, in file order.
const rules = [];
// Lines Cloudflare would ignore, reported but not fatal.
const ignored = [];
// Every line, numbered from 1 as an editor shows it.
readFileSync(SOURCE, "utf8").split("\n").forEach((raw, i) => {
  // The line without its surrounding blanks.
  const line = raw.trim();
  // Blank lines and comments carry no rule.
  if (!line || line.startsWith("#")) return;
  // The fields, separated by any run of blanks.
  const fields = line.split(/\s+/);
  // Fewer than two fields: Cloudflare ignores the line, and so does the count.
  if (fields.length < 2) { ignored.push(i + 1); return; }
  // The status, or the default when none is written.
  const status = fields[2] ? Number(fields[2]) : DEFAULT_STATUS;
  // A status Cloudflare would not accept: the line is ignored there too.
  if (!ALLOWED.has(status)) { ignored.push(i + 1); return; }
  // The rule as the Worker needs it.
  rules.push({ line: i + 1, source: fields[0], destination: fields[1], status });
});

// The file's text: stable order, two-space indentation, a trailing newline, so an unchanged rule set writes no change.
const text = JSON.stringify(rules, null, 2) + "\n";
// What is on disk now (nothing on the first run).
const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";

// Check mode: a stale file fails the build and says how to fix it.
if (CHECK) {
  if (current !== text) {
    console.error(`[gen-redirect-rules] FAIL: ${OUT} does not match ${SOURCE}; run \`node scripts/gen-redirect-rules.mjs\` and stage the result.`);
    process.exit(1);
  }
  console.log(`[gen-redirect-rules] OK: ${OUT} matches ${SOURCE} (${rules.length} rule(s)${ignored.length ? `; ${ignored.length} line(s) Cloudflare would ignore: ${ignored.join(", ")}` : ""}).`);
  process.exit(0);
}

// Write mode: only when the content changed, so file times stay meaningful.
if (current !== text) writeFileSync(OUT, text);
// What happened.
console.log(`[gen-redirect-rules] ${current === text ? "unchanged" : "written"}: ${OUT}, ${rules.length} rule(s)${ignored.length ? `; ${ignored.length} line(s) Cloudflare would ignore: ${ignored.join(", ")}` : ""}.`);
