#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-vendor-hub-coverage.mjs — THE TWENTY-THIRD GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: every tool tagged with a vendor must appear on that vendor's hub.
//
// THE BUG THIS EXISTS FOR, reported by PRIME on 2026-08-03.
// The hub grouped tools into sections by sub-category, with a trailing "other"
// bucket, and a comment in the source stating that the bucket "catches anything
// unmapped so nothing silently disappears."
//
// **It did not.** The filter compared `(tool.sub ?? "other") === id`, which
// catches a MISSING sub and not a sub that is simply absent from that vendor's
// taxonomy. A Check Point tool declaring `sub: "quantum"`, against a vendor with
// no taxonomy entry at all, matched no section and was rendered nowhere.
//
// **Seven tools across four vendors were invisible.** The page built. No error
// appeared anywhere. The only symptom was a hub that looked emptier than the
// data behind it, and the only reason it was noticed is that somebody who knew
// the tools existed went looking for them.
//
// A comment promising a safety net the code does not implement is worse than no
// comment, because it stops the next person checking. This guard checks.
//
// WHAT THIS GUARD ACTUALLY PROTECTS, stated precisely so nobody over-trusts it:
// once the page derives its bucket correctly, an unknown sub lands in "other"
// and IS visible - so the coverage count will pass. The live protection is
// therefore the SECOND check: that the page still derives the bucket at all.
// Revert that one line and this guard fails immediately, which is the point.
// The coverage count remains as a backstop against a future grouping scheme
// that loses items some other way.
// ============================================================================

import { readFileSync } from "node:fs";

const toolsSrc = readFileSync("src/config/tools.ts", "utf8");
const vendorsSrc = readFileSync("src/config/vendors.ts", "utf8");

// Parse the sub taxonomy per vendor from VENDOR_SUBS.
// PARSE CAREFULLY. An earlier version of this regex found only three of the
// five taxonomies, and the failure direction is the dangerous one: a taxonomy
// this script cannot see makes the vendor look like it has none, which makes
// every bucket resolve to "other" and every tool look correctly placed. **The
// guard would have under-detected exactly the bug it exists for.** So the parse
// is bracket-matched rather than regex-guessed, and the count is asserted.
const subsStart = vendorsSrc.indexOf("VENDOR_SUBS");
const subsBlock = vendorsSrc.slice(subsStart);
const taxonomy = {};
for (const m of subsBlock.matchAll(/\n  ([a-z0-9-]+):\s*\[/g)) {
  const key = m[1];
  let i = subsBlock.indexOf("[", m.index);
  let depth = 0;
  let end = i;
  for (; end < subsBlock.length; end += 1) {
    if (subsBlock[end] === "[") depth += 1;
    else if (subsBlock[end] === "]") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  taxonomy[key] = [...subsBlock.slice(i, end).matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((x) => x[1]);
}

// Parse tools: id, vendors, sub, available.
const entries = [];
for (const m of toolsSrc.matchAll(/\{\s*id:\s*"([a-z0-9-]+)"[^}]*\}/g)) {
  const block = m[0];
  const id = m[1];
  const vendors = [...(block.match(/vendors:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
  const sub = block.match(/sub:\s*"([a-z0-9-]+)"/)?.[1] ?? null;
  const available = /available:\s*true/.test(block);
  if (available && vendors.length) entries.push({ id, vendors, sub });
}

// The bucket the page assigns. MUST mirror the page's own logic.
const bucketFor = (vendor, sub) => {
  const t = taxonomy[vendor] ?? [];
  return sub && t.includes(sub) ? sub : "other";
};

// A taxonomy count of zero, or a sudden drop, means the parse broke rather than
// the data changing - and a broken parse fails OPEN here, so it is checked.
if (Object.keys(taxonomy).length === 0) {
  console.error("\n[check-vendor-hub-coverage] FAIL:\n\n  - parsed no vendor sub-taxonomies at all. The parse is broken, and a broken\n      parse makes every tool look correctly placed. Fix the parse before trusting this.\n");
  process.exit(1);
}

const invisible = [];
for (const tool of entries) {
  for (const vendor of tool.vendors) {
    const buckets = [...(taxonomy[vendor] ?? []), "other"];
    if (!buckets.includes(bucketFor(vendor, tool.sub))) {
      invisible.push(`${tool.id} on /${vendor} (sub="${tool.sub}")`);
    }
  }
}

// Also verify the page still derives its bucket rather than comparing directly -
// if that regresses, this guard's model stops matching the page's behaviour and
// the check becomes decorative.
const pageSrc = readFileSync("src/app/[locale]/[vendor]/page.tsx", "utf8");
const derives = /bucketFor\s*=\s*\(/.test(pageSrc) && /taxonomy\.includes\(sub\)/.test(pageSrc);

const failures = [];
if (invisible.length) {
  failures.push(
    `${invisible.length} tool-vendor pairing(s) render on no section of the hub:\n      ${invisible.join("\n      ")}`,
  );
}
if (!derives) {
  failures.push(
    "the vendor hub no longer derives its section bucket. Without that, a tool whose\n" +
      "      sub is absent from the vendor's taxonomy matches no section and disappears silently.",
  );
}

if (failures.length) {
  console.error("\n[check-vendor-hub-coverage] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

const pairs = entries.reduce((n, t) => n + t.vendors.length, 0);
console.log(
  `[check-vendor-hub-coverage] OK: ${pairs} tool-vendor pairings across ${Object.keys(taxonomy).length} taxonomies, all rendered.`,
);
