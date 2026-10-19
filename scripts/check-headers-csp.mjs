// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-headers-csp.mjs
// ----------------------------------------------------------------------------
// THE CONTENT SECURITY POLICY MUST STAY LOCAL EVERYWHERE EXCEPT THE RED ROOM'S
// TWO EGRESS PAGES.
//
// WHAT HAPPENED. The production audit of 2026-10-15 (finding F02) found that
// the global policy in public/_headers, `connect-src 'self'`, blocked the
// browser-direct registry queries of /dev/out/rdap-lookup and
// /dev/out/asn-lookup on every input, while the pages reported the failure as
// a missing CORS header. The fix (2026-10-18) detaches the global policy on
// those two paths and sets the same policy with `connect-src 'self' https:`.
//
// WHAT THIS GUARD HOLDS. Three things, none of which the build could otherwise
// see because the headers are applied by the host, not by Next.js:
//   1. the global `/*` rule still carries `connect-src 'self';` (the
//      catalogue's promise that nothing a reader types leaves the browser);
//   2. each red room egress path, bare and with the trailing-slash splat,
//      detaches the policy (`! Content-Security-Policy`) and sets one whose
//      connect-src is exactly `'self' https:`, and whose other directives are
//      byte-identical to the global policy's (the relaxation is one token);
//   3. the file stays within the host's documented limits: at most 100 rules
//      and at most 2,000 characters per header line.
// ============================================================================
import { readFileSync } from "node:fs";

// The headers file, as the host reads it.
const text = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");
// Lines without the comment lines (a `#` at the line start is a comment).
const lines = text.split("\n").filter((l) => !l.trimStart().startsWith("#"));

// Parse into rules: a path line (no leading whitespace, starts with "/") followed by indented header lines.
const rules = [];
// The rule being filled.
let current = null;
// Walk every line.
for (const line of lines) {
  // A path line starts a rule.
  if (/^\/\S*$/.test(line)) {
    current = { path: line, headers: [] };
    rules.push(current);
  } else if (/^\s+\S/.test(line) && current) {
    // An indented line is a header (or a detach) of the current rule.
    current.headers.push(line.trim());
  } else if (line.trim() === "") {
    // A blank line ends nothing by itself; the next path line does.
  }
}

// Each failure is one sentence a reader can act on.
const failures = [];

// Limit 1: rule count.
if (rules.length > 100) failures.push(`public/_headers: ${rules.length} rules, the host honours at most 100.`);
// Limit 2: header line length.
for (const r of rules) {
  for (const h of r.headers) {
    if (h.length > 2000) failures.push(`public/_headers: a header line under ${r.path} is ${h.length} characters, the host's limit is 2,000.`);
  }
}

// The global policy: the first `/*` rule's Content-Security-Policy header value.
const global = rules.find((r) => r.path === "/*");
// Its policy text, or an empty string when missing.
const globalCsp = (global?.headers.find((h) => h.startsWith("Content-Security-Policy:")) ?? "").replace(/^Content-Security-Policy:\s*/, "");
// Hold 1: the global connect-src is 'self' and nothing else.
if (!/(^|;\s*)connect-src 'self'(;|$)/.test(globalCsp)) {
  failures.push("public/_headers: the global /* policy no longer says `connect-src 'self'` and nothing else.");
}

// The policy the red room pages must carry: the global one with the single relaxation.
const expectedRedRoom = globalCsp.replace(/connect-src 'self'(;|$)/, "connect-src 'self' https:$1");
// The four paths that must carry it.
for (const tool of ["rdap-lookup", "asn-lookup"]) {
  for (const suffix of ["", "/*"]) {
    // The path of this rule.
    const path = `/:locale/dev/out/${tool}${suffix}`;
    // The rule itself.
    const rule = rules.find((r) => r.path === path);
    // Missing altogether.
    if (!rule) {
      failures.push(`public/_headers: no rule for ${path} (the red room's egress exception is missing).`);
      continue;
    }
    // Hold 2a: the global policy is detached first.
    if (!rule.headers.includes("! Content-Security-Policy")) {
      failures.push(`public/_headers: ${path} does not detach the global Content-Security-Policy before setting its own.`);
    }
    // Hold 2b: the policy set is the global one with connect-src relaxed to 'self' https:, nothing else changed.
    const csp = (rule.headers.find((h) => h.startsWith("Content-Security-Policy:")) ?? "").replace(/^Content-Security-Policy:\s*/, "");
    if (csp !== expectedRedRoom) {
      failures.push(`public/_headers: ${path} sets a policy that differs from the global one by more than connect-src 'self' https:.`);
    }
  }
}

// No other rule may relax connect-src: the exception is the red room's alone.
for (const r of rules) {
  // Skip the global rule and the four red room rules.
  if (r.path === "/*" || /^\/:locale\/dev\/out\/(rdap|asn)-lookup(\/\*)?$/.test(r.path)) continue;
  // Any other policy that names a connect-src beyond 'self' is a leak of the exception.
  const csp = r.headers.find((h) => h.startsWith("Content-Security-Policy:")) ?? "";
  if (/connect-src(?! 'self'(;|$))/.test(csp)) failures.push(`public/_headers: ${r.path} relaxes connect-src; only the red room's two egress pages may.`);
}

// Verdict.
if (failures.length) {
  console.error("check-headers-csp: FAIL");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`check-headers-csp: OK (${rules.length} rules; global connect-src 'self'; red room egress exception present on 4 paths)`);
