// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-plaintext-fields.mjs
// ----------------------------------------------------------------------------
// Some fields are rendered as PLAIN TEXT, not markdown. A link written in
// markdown syntax there does not become a link - it is printed to the reader,
// brackets and all.
//
// Found the hard way on 2026-09-02: two entries I had written carried
// "[OSPF](/glossary/ospf)" and "[security and availability](/learn/...)" in
// partners.ts bodies, and a glossary context carried "[split brain](...)".
// A fourth, "[Flipside](/industry/flipside)" in the roadsec entry, had been
// live for longer. All four printed the raw syntax on the page, and nothing
// caught them because every other guard reads structure rather than prose.
//
// The fields checked here are the ones known to render verbatim:
//   - partners.ts:   intro, tagline, body[]
//   - glossary packs: def, context
//
// If a field ever gains markdown rendering, remove it from this list rather
// than working around the guard.
// ============================================================================

import { readFileSync } from "node:fs";

const MD_LINK = /\[[^\]\n]{1,60}\]\((?:\/|https?:)[^)\s]+\)/g;
const failures = [];

// ---- partners.ts ----------------------------------------------------------
const partners = readFileSync("src/content/vendors/partners.ts", "utf8");
for (const field of ["intro", "tagline"]) {
  const re = new RegExp(`\\n    ${field}: "((?:[^"\\\\]|\\\\.)*)"`, "g");
  for (const m of partners.matchAll(re)) {
    for (const hit of m[1].match(MD_LINK) ?? []) {
      failures.push({ where: `partners.ts ${field}`, hit });
    }
  }
}
for (const m of partners.matchAll(/body: \[(.*?)\n {4}\]/gs)) {
  for (const hit of m[1].match(MD_LINK) ?? []) {
    failures.push({ where: "partners.ts body", hit });
  }
}

// ---- glossary message packs ----------------------------------------------
for (const locale of ["en", "pt-BR"]) {
  const pack = JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8"));
  const entries = pack?.glossary?.entries ?? {};
  for (const [slug, entry] of Object.entries(entries)) {
    for (const field of ["def", "context"]) {
      for (const hit of String(entry?.[field] ?? "").match(MD_LINK) ?? []) {
        failures.push({ where: `glossary ${locale} ${slug}.${field}`, hit });
      }
    }
  }
}

if (failures.length) {
  console.error(
    `[check-plaintext-fields] FAIL: ${failures.length} markdown link(s) in fields that render as plain text.`,
  );
  for (const f of failures) console.error(`  ${f.where} -> ${f.hit}`);
  console.error(
    "\n  These print to the reader as raw brackets. Write the name in prose, or move\n" +
      "  the sentence to a field that renders markdown.",
  );
  process.exit(1);
}
console.log("[check-plaintext-fields] OK: no markdown links in plain-text fields.");
