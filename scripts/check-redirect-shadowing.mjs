#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-redirect-shadowing.mjs — THE FORTY-SECOND GUARD
//
// WHAT WENT WRONG, AND WHY THIS EXISTS
// ------------------------------------
// On 2026-08-06 a placeholder-collapse pass compressed per-locale redirect
// rules using :locale and :slug tokens. One of the three probe rules was:
//
//     /:locale/dev/other/:slug/   /:locale/dev/out/:slug/   301
//
// The intent, recorded in a comment 300 lines earlier, was to move exactly ONE
// tool that had changed rooms: /dev/other/rdap-lookup -> /dev/out/rdap-lookup.
// Collapsing the LOCALE was correct. Collapsing the SLUG was not: it turned a
// one-tool migration into a rule that captured every path in the room.
//
// The result, live and unnoticed until a reader reported a card behaving
// oddly: all five green-room tools - fingerprint, pcap-analyzer,
// serial-console, subnet-drill, web-serial-console - answered 301 into
// /dev/out/<slug>/, where nothing of that name exists, so every one of them
// 404'd in all sixteen locales. The pages were built correctly, uploaded
// correctly, and served correctly; they were simply unreachable, because a
// redirect stood in front of them.
//
// No existing guard could see it. check-redirects.mjs verifies that redirect
// DESTINATIONS exist, which is the opposite question. The build validates the
// pages. The link checker walks hrefs, and the hrefs were right - the anchor
// said /dev/other/pcap-analyzer/ and the edge turned it into something else.
// The failure lived in the gap between "the page exists" and "the page can be
// reached", and nothing was looking there.
//
// WHAT THIS ASKS
// --------------
// For every route that was actually built, does any redirect rule capture it?
// If one does, that page is unreachable in production no matter how correct it
// is on disk. A redirect may only stand in front of a URL that has no page.
//
// Runs POST-build, because it needs the built route list to compare against.
// ============================================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REDIRECTS = "public/_redirects";
const OUT = "out";

// Rules that intentionally sit in front of a live page. Each entry must carry a
// reason: an unexplained exception here would re-open exactly the hole this
// guard was written to close.
const ALLOWED_SHADOWS = new Map([
  // e.g. ["/en/some/path/", "reason the page must still be redirected away"],
]);

if (!existsSync(OUT)) {
  console.error(`[check-redirect-shadowing] FAIL: ${OUT}/ not found. This guard runs after the build.`);
  process.exit(2);
}

// ---- The built route list -------------------------------------------------
// A directory containing index.html is a page. Recorded with a trailing slash,
// which is the canonical form this site serves.
const routes = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full);
    } else if (entry === "index.html") {
      const rel = dir.slice(OUT.length).replace(/\\/g, "/");
      routes.push(`${rel === "" ? "" : rel}/`);
    }
  }
})(OUT);

// ---- The rules ------------------------------------------------------------
const rules = [];
for (const raw of readFileSync(REDIRECTS, "utf8").split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const [source, destination] = line.split(/\s+/);
  if (!source || !destination) continue;
  rules.push({ source, destination, line: raw.trim() });
}

/**
 * Compile a Cloudflare _redirects source pattern into a matcher.
 *
 * `:token` matches exactly one path segment - it cannot swallow a slash, which
 * is what makes a per-locale collapse safe and a per-slug collapse dangerous.
 * `*` matches the remainder of the path.
 */
function compile(source) {
  let re = "";
  for (const part of source.split(/(:[A-Za-z_]+|\*)/)) {
    if (part === "") continue;
    if (part === "*") re += ".*";
    else if (part.startsWith(":")) re += "[^/]+";
    else re += part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

const compiled = rules.map((r) => ({ ...r, re: compile(r.source) }));

// ---- The question ---------------------------------------------------------
const shadowed = [];
for (const route of routes) {
  for (const rule of compiled) {
    if (!rule.re.test(route)) continue;
    // A rule pointing at the route itself is a normalisation, not a shadow.
    if (rule.destination === route) continue;
    if (ALLOWED_SHADOWS.has(route)) continue;
    shadowed.push({ route, rule });
    break;
  }
}

if (shadowed.length > 0) {
  console.error(
    `[check-redirect-shadowing] FAIL: ${shadowed.length} built page(s) are unreachable because a redirect stands in front of them.`,
  );
  // Group by rule: one bad rule usually shadows a whole room, and printing 80
  // routes hides the single line that has to change.
  const byRule = new Map();
  for (const s of shadowed) {
    const key = s.rule.line;
    if (!byRule.has(key)) byRule.set(key, []);
    byRule.get(key).push(s.route);
  }
  for (const [rule, hits] of byRule) {
    console.error(`\n  RULE: ${rule}`);
    console.error(`  shadows ${hits.length} built page(s), including:`);
    for (const h of hits.slice(0, 6)) console.error(`    - ${h}`);
    if (hits.length > 6) console.error(`    ... and ${hits.length - 6} more`);
  }
  console.error(
    "\n  Narrow the rule to the paths that genuinely moved, or add the route to",
  );
  console.error("  ALLOWED_SHADOWS with a reason.\n");
  process.exit(1);
}

console.log(
  `[check-redirect-shadowing] OK: ${rules.length} redirect rule(s) checked against ${routes.length} built route(s); none shadows a live page.`,
);
