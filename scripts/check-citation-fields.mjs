#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// check-citation-fields — A NEW FIELD CANNOT QUIETLY ESCAPE THE LIVENESS AUDIT.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-09-30 the source-liveness audit was found to have
// never checked a single glossary citation. It collected `url:` and markdown
// targets. partners.ts writes `url:` and was covered; glossary.ts writes
// `href:` and was not - so 906 citations across 1,711 entries, including every
// source behind the /people timeline, had never once been tested for liveness.
// Six of them were dead. The same sweep found three more uncollected keys:
// externalUrl, sourceUrl and blueprintSourceUrl, another 391 URLs.
//
// *** THE AUDIT'S OUTPUT NEVER LOOKED WRONG. *** Every number it printed was
// accurate. They were about a smaller corpus than they appeared to describe,
// which is the fourth instance of that shape logged in one session - the others
// being the audit's narrow ROOTS, a duplicate sweep's 120-character floor, and a
// screen that could not tell "1980" from "1980s".
//
// So this guard does not check URLs. IT CHECKS THE AUDIT'S FIELD LIST AGAINST
// THE CONTENT, which is the thing that silently went out of step. Every key in
// the content roots that carries an http URL must be either COLLECTED by the
// audit or EXEMPT here with a reason. A new key is a build failure, in the change
// that introduces it, rather than a blind spot discovered years later.
//
// WHY THE EXEMPT LIST IS NOT A FORMALITY. The keys on it carry example.com,
// RFC-reserved documentation addresses, and 169.254.169.254 - the cloud
// instance-metadata endpoint. Fetching a tool's example input would be wrong on
// its own terms, and in that last case would have the audit probing a metadata
// service. The two lists are genuinely different in kind, and that is exactly
// why a new key must not be allowed to land on either by default.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

// The audit's own roots, kept identical on purpose: this guard is about the same
// corpus the audit reads, and a divergence here would reintroduce the bug in a
// new place.
const ROOTS = [
  "src/content",
  "src/lib/tools",
  "src/lib/roles.ts",
  "src/config/toolProvenance.ts",
];
const EXTS = new Set([".ts", ".tsx", ".mdx", ".md", ".json"]);

// Keys the audit collects. Read from the audit itself rather than duplicated, so
// the two cannot drift: a key removed there fails here on the next build.
const AUDIT = fs.readFileSync(
  path.join(process.cwd(), "scripts/audit-source-liveness.mjs"),
  "utf8"
);

// Keys that carry a URL which must NEVER be fetched, each with the reason.
const EXEMPT = new Map([
  ["input", "a tool's example input - example.com, RFC-reserved documentation addresses, and 169.254.169.254, the cloud instance-metadata endpoint"],
  ["example", "a documented example value, including 169.254.169.254; fetching it would probe a metadata service"],
  ["issuer", "an example OIDC issuer at idp.example.com"],
  ["webhook", "an example webhook endpoint at example.com"],
  ["raw", "a raw example string in tool documentation"],
  ["s", "a single-letter local variable in an example, not a content field"],
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  if (fs.statSync(dir).isFile()) {
    if (EXTS.has(path.extname(dir))) out.push(dir);
    return out;
  }
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

// Every identifier that appears immediately before a quoted http(s) URL, with a
// count and one example location, so a finding says where to look.
const keys = new Map();
let files = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    files += 1;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*"https?:\/\//g)) {
        const k = m[1];
        if (!keys.has(k)) keys.set(k, { n: 0, at: `${file}:${i + 1}` });
        keys.get(k).n += 1;
      }
    });
  }
}

// A key counts as collected when the audit has a matchAll for it. Matched against
// the audit's source text, which is the only definition that cannot go stale.
function isCollected(key) {
  return AUDIT.includes(`matchAll(/${key}:`) || AUDIT.includes(`matchAll(/${key}\\s*:`);
}

const collected = [];
const undeclared = [];
for (const [k, info] of keys) {
  if (isCollected(k)) collected.push(k);
  else if (EXEMPT.has(k)) continue;
  else undeclared.push({ key: k, ...info });
}

// A key the audit collects that no longer appears in the content is not an error -
// content shrinks - but an EXEMPT entry for a key that has gone should come off,
// so the exempt list can only shrink.
const staleExempt = [...EXEMPT.keys()].filter((k) => !keys.has(k));

if (undeclared.length > 0 || staleExempt.length > 0) {
  console.error("\n[check-citation-fields] FAIL\n");
  if (undeclared.length > 0) {
    console.error(
      `  ${undeclared.length} field(s) carry an http URL that the liveness audit does not collect:`
    );
    for (const u of undeclared) {
      console.error(`      ${u.key}:  ${u.n} occurrence(s), first at ${u.at}`);
    }
    console.error(
      "\n      This is how the glossary went unchecked for its whole existence: the audit\n" +
        "      read `url:` and the glossary writes `href:`, so 906 citations were invisible\n" +
        "      to the one instrument meant to find dead links, and six of them were dead.\n" +
        "      EITHER add the key to audit-source-liveness.mjs so its URLs get checked, OR\n" +
        "      add it to EXEMPT in this file with the reason it must never be fetched. Never\n" +
        "      a bare exemption: `input` is exempt because it holds 169.254.169.254, and a\n" +
        "      reader needs to know that without running the audit to find out.\n"
    );
  }
  if (staleExempt.length > 0) {
    console.error(
      `  ${staleExempt.length} exemption(s) for a field that no longer carries a URL here:`
    );
    for (const k of staleExempt) console.error(`      ${k}`);
    console.error("");
  }
  process.exit(1);
}

console.log(
  `[check-citation-fields] OK: ${files} file(s); ${keys.size} URL-bearing field(s) - ` +
    `${collected.length} collected by the liveness audit (${collected.sort().join(", ")}), ` +
    `${EXEMPT.size} exempt with a reason. No field escapes the audit.`
);
