#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-profile-registry.mjs — THE TWENTY-SEVENTH GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: a vendor profile that exists must be registered, or explicitly
// declared dead.
//
// WHY. On 2026-08-04, asked whether the F5 page had ideas worth adding to the
// profile standard, the answer turned out to be that F5 HAD a complete
// six-section profile which was rendering nowhere. So did twelve others -
// Cisco, Fortinet, Netskope, Palo Alto, Zscaler, Ping, Extreme, Cabletron,
// Riverstone, IronPort, NetScreen/Juniper, Pulse Secure.
//
// **Thirteen of the most significant companies on the site had researched,
// written, verified profiles that no page imported.** Their pages showed the
// plain prose format instead, which is why the site looked like it had two
// tiers of quality: some of it was not a quality difference at all, it was
// content that had been written and never wired in.
//
// This is the fifth distinct shape of the same failure: a chapter nothing
// links to, a link pointing at nothing, content nothing renders, an unbucketed
// hub item, and now a profile nothing imports. **Every one was invisible to a
// build that reported success.**
//
// DEAD PROFILES ARE ALLOWED, but must be listed here deliberately, so that
// "orphaned" and "retired" are never the same state by accident.
// ============================================================================

import { readdirSync, readFileSync } from "node:fs";

// Profiles whose vendor entry no longer exists. Listing one here is a decision.
const RETIRED = new Set([
  // The combined FireEye/McAfee/Ixia entry was dissolved on 2026-08-02 at
  // PRIME's instruction; its profile has no page to render on.
  "fireeye-mcafee-ixia",
]);

const DIR = "src/content/vendors/profiles";
const PAGE = "src/app/[locale]/industry/[slug]/page.tsx";

const page = readFileSync(PAGE, "utf8");
const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f.replace(/\.ts$/, ""));

const orphans = files.filter(
  (slug) => !RETIRED.has(slug) && !page.includes(`profiles/${slug}"`),
);
const retiredButRegistered = files.filter(
  (slug) => RETIRED.has(slug) && page.includes(`profiles/${slug}"`),
);

const failures = [];
if (orphans.length) {
  failures.push(
    `${orphans.length} profile(s) exist but are imported nowhere: ${orphans.join(", ")}.\n` +
      `      The research is written and the page will never show it. Register them in\n` +
      `      PROFILES, or add them to RETIRED here with a reason.`,
  );
}
if (retiredButRegistered.length) {
  failures.push(
    `${retiredButRegistered.length} profile(s) marked RETIRED are still registered: ${retiredButRegistered.join(", ")}.`,
  );
}

if (failures.length) {
  console.error("\n[check-profile-registry] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(
  `[check-profile-registry] OK: ${files.length} profiles, ${files.length - RETIRED.size} registered, ${RETIRED.size} retired by declaration.`,
);
