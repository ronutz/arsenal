#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-message-parity.mjs — THE EIGHTEENTH GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: the two day-one locales must carry the same message keys.
//
// WHY THIS EXISTS. PRIME asked for the locale-parity guard to be taught about
// an exception. It could not be: `check-locale-parity` covers LEARN ARTICLES,
// and **nothing at all was checking message keys**. A key added to `en` and
// forgotten in `pt-BR` shipped a page that rendered the literal key string to
// Brazilian readers, and every guard stayed green while it did.
//
// That is not hypothetical. It happened this month: a card was written with a
// `blurb` field where the surface expected `desc`, and the only thing that
// caught it was the MISSING_MESSAGE count in the build log - which only fires
// for keys a rendered page actually reads. A key on a page nobody built that
// day would have sailed through.
//
// WHAT IT CHECKS
//   1. every key in `en` exists in `pt-BR`;
//   2. every key in `pt-BR` exists in `en` (an orphan means the English was
//      renamed or removed and the pair silently broke);
//   3. objects have the same SHAPE, not merely the same top-level names, so a
//      nested key added to one side is caught too.
//
// SCOPE. en and pt-BR only - the day-one pair every other content guard already
// requires. The remaining fourteen locales are served by per-key English
// fallback and are deliberately NOT checked; requiring them would block
// authoring, which is the same reasoning `check-locale-parity` records.
//
// THE EXCEPTION LIST. A namespace listed below is expected to exist in `en`
// alone. There is currently one, and the reason is specific: the Importance
// Meter's joke is an English idiom that does not survive translation - rendered
// literally in Portuguese it read as a description of a rude phrase rather than
// as a deadpan corporate instrument. That page generates for `en` only and the
// other locales redirect to it, so its strings have no Portuguese counterpart
// by design.
//
// Adding to this list should be uncomfortable. It is not a place to put things
// that are merely awkward to translate; it is for content that CANNOT be
// translated without destroying it.
// ============================================================================

import { readFileSync } from "node:fs";

const A = "en";
const B = "pt-BR";

/** Namespaces that legitimately exist in English only. Keep this list tiny. */
const ENGLISH_ONLY = new Set([
  // The joke is an idiom; the page generates for en only. See the page's
  // generateStaticParams and the redirects in public/_redirects.
  "importanceMeter",
]);

const load = (loc) => JSON.parse(readFileSync(`src/i18n/messages/${loc}.json`, "utf8"));

/** Flatten to dotted paths so nested differences surface, not just top-level. */
function paths(obj, prefix = "", out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) paths(v, p, out);
    else out.add(p);
  }
  return out;
}

const a = load(A);
const b = load(B);

const inExceptions = (p) => ENGLISH_ONLY.has(p.split(".")[0]);

const pa = [...paths(a)].filter((p) => !inExceptions(p));
const pb = [...paths(b)].filter((p) => !inExceptions(p));
const sa = new Set(pa);
const sb = new Set(pb);

const missingInB = pa.filter((p) => !sb.has(p));
const missingInA = pb.filter((p) => !sa.has(p));

// A namespace on the exception list must actually be absent from B - otherwise
// the exception is stale and hiding a real difference.
const staleExceptions = [...ENGLISH_ONLY].filter((ns) => ns in b);

const failures = [];
if (missingInB.length)
  failures.push(`${missingInB.length} key(s) in ${A} missing from ${B}:\n      ${missingInB.slice(0, 12).join("\n      ")}`);
if (missingInA.length)
  failures.push(`${missingInA.length} key(s) in ${B} missing from ${A}:\n      ${missingInA.slice(0, 12).join("\n      ")}`);
if (staleExceptions.length)
  failures.push(
    `Namespace(s) on the English-only list but present in ${B}: ${staleExceptions.join(", ")}. Either remove them from ${B} or drop them from ENGLISH_ONLY - a stale exception hides real drift.`,
  );

if (failures.length) {
  console.error("\n[check-message-parity] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(
  `[check-message-parity] OK: ${sa.size} keys match across ${A} and ${B}; ${ENGLISH_ONLY.size} namespace(s) English-only by design.`,
);
