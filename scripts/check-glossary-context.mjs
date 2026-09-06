#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-glossary-context.mjs — THE TWENTY-FOURTH GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: a glossary entry's `context` must fit in a hover tooltip, and
// must not contain markdown that the renderer will not process.
//
// WHY, and this one is entirely self-inflicted.
// The glossary detail page renders `def`, then `context`, then an optional
// `depth`. A comment in that page states plainly that **`context` is kept short
// because the SAME string renders inside the GlossaryHint hover panel** - 22rem
// wide, 40vh tall - on tool docs and articles across the whole site. Long
// context turns every tooltip that mentions the term into a scroll trap.
//
// Over one working session, twenty-three entries were written with
// encyclopedia-length `context` - up to 4,894 characters against a site median
// of 238 - while `depth`, the key that exists for exactly that content, went
// unused. 570 entries were already using it correctly. **The convention was
// established, documented in the source, and simply not read.**
//
// The same session also put markdown bold into `context`, which the renderer
// emits as literal asterisks because it prints the string rather than parsing
// it. That was visible on the page and went unnoticed until a probe compared
// rendered text against source text.
//
// TWO CHECKS, because the two failures have the same cause - writing content
// without checking how it renders:
//   1. context length, against a threshold generous enough to allow a real
//      paragraph and strict enough to keep a tooltip readable
//   2. markdown syntax in context or depth, neither of which is parsed
//
// The remedy for an over-long context is never truncation. It is to write a
// short one and move the body to `depth`, which renders on the detail page.
// ============================================================================

import { readFileSync } from "node:fs";

// THRESHOLD CHOSEN DELIBERATELY, and the reasoning matters more than the number.
// Site median context is ~238 characters. The longest PRE-EXISTING entries -
// analog-vs-digital and mpls - run to about 970, and they are fine: a dense
// paragraph is not a scroll trap. The failure this guard exists for was
// entries of 2,000 to 4,900 characters. So the line sits just above the
// established content rather than below it, because a guard that fails on
// content which was correct before it existed teaches people to disable guards.
//
// RAISED 1000 -> 1400 on 2026-09-05 (PRIME). The standing rule that a vendor or
// person entry must cover its security, defence and espionage history as part of
// its scope adds a genuine beat to entries that were already complete. The old
// ceiling would have forced that new material to be paid for by cutting existing
// detail, which is the wrong trade: the guard exists to stop scroll traps of
// 2,000 to 4,900 characters, not to ration substance. 1,400 still sits far below
// the failure mode it was built for.
const MAX_CONTEXT = 1400;

const failures = [];
let checked = 0;

for (const locale of ["en", "pt-BR"]) {
  const messages = JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8"));
  const entries = messages?.glossary?.entries ?? {};

  for (const [slug, entry] of Object.entries(entries)) {
    if (typeof entry !== "object" || entry === null) continue;
    checked += 1;

    const context = typeof entry.context === "string" ? entry.context : "";
    if (context.length > MAX_CONTEXT) {
      failures.push(
        `[${locale}] "${slug}": context is ${context.length} chars (max ${MAX_CONTEXT}).\n` +
          `      This string also renders inside a 22rem hover tooltip site-wide.\n` +
          `      Do NOT truncate it - write a short context and move the body to \`depth\`.`,
      );
    }

    // Markdown is not parsed in either field. Bold markers are the common case;
    // a stray asterisk in prose is not, so require the paired form.
    for (const field of ["context", "depth"]) {
      const value = typeof entry[field] === "string" ? entry[field] : "";
      if (/\*\*[^*]+\*\*/.test(value)) {
        failures.push(
          `[${locale}] "${slug}": ${field} contains **markdown bold**, which renders as literal asterisks.`,
        );
      }
    }
  }
}

if (failures.length) {
  console.error("\n[check-glossary-context] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(
  `[check-glossary-context] OK: ${checked} glossary entries across locales; all contexts within ${MAX_CONTEXT} chars, no unparsed markdown.`,
);
