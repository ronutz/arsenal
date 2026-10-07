// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-cert-vendor-prose.mts  (prebuild; run with tsx)
// ----------------------------------------------------------------------------
// A CERTIFICATION GUIDE SPEAKS OF ITS OWN VENDOR. Added 2026-10-07 (row 62,
// PRIME 09:47, adopting SCOUT's re-run of 09:03): SCOUT read "Fortinet's page
// does not name a replacement" on a Check Point record and asked for a guard,
// "vendor name appearing in vendor-specific status prose must equal the
// record's vendor unless explicitly whitelisted". That instance had already been
// fixed (the notice takes the vendor from the record), but checking it found the
// same class alive elsewhere: the Check Point PenTesting guides carried a caveat
// whose words were "Fortinet's course page" and "Fortinet has not published one",
// because the caveat message named Fortinet instead of taking the record's
// vendor. Two rules keep the class out:
//
//   1. The certGuides messages (English and Portuguese) name no vendor at all:
//      a sentence shared by every guide takes the vendor as {vendor}.
//   2. A guide's own prose (every string of its record, except identifiers,
//      addresses and codes) names no other vendor, unless that vendor's products
//      belong to the record's vendor (OWNED_BY) or the mention is DECLARED with
//      its reason.
//
// The vendor names are the site's own labels for them (tools.vendors in the
// English pack), so a vendor added there is checked from that day on.
// ============================================================================

// File access for the packs.
import fs from "node:fs";
// Path joining, so the guard runs from the repository root like its siblings.
import path from "node:path";
// The guides, read from the registry the pages read.
import { studyGuides } from "../src/content/certifications/study-guides";

// The repository root: prebuild runs every guard from there.
const ROOT = process.cwd();
// The packs, English and Portuguese.
const pack = (loc: string) => JSON.parse(fs.readFileSync(path.join(ROOT, "src", "i18n", "messages", `${loc}.json`), "utf8"));
const EN = pack("en");
const PT = pack("pt-BR");
// The vendors by id, with the site's label for each ("checkpoint" -> "Check Point").
const VENDORS: Record<string, string> = EN.tools.vendors;

// Vendors whose products belong to another vendor, so a guide of the owner may name them.
const OWNED_BY: Record<string, string> = {
  // F5 acquired NGINX in 2019; the F5 NGINX exams (F5N1 to F5N4) are named for the product.
  nginx: "f5",
};
// Mentions declared with their reason, keyed "guide slug:vendor id"; they may only shrink.
const DECLARED = new Map<string, string>([
  // (none at introduction)
]);
// Fields that are identifiers, addresses or codes, not prose.
const SKIP = new Set(["slug", "certification", "examCode", "vendor", "status", "targetVersion", "sourceCaveat", "blueprintSourceUrl", "url", "href", "untilIso", "scope"]);

/** A whole-word, literal pattern for a vendor's label. */
const wordOf = (name: string) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);

// Every failure, one line each; the declarations seen, for the stale check.
const failures: string[] = [];
const seen = new Set<string>();

// ---- 1. The shared messages name no vendor ----
for (const [loc, data] of [["en", EN], ["pt-BR", PT]] as const) {
  // Every string under certGuides, with its key.
  const walk = (node: unknown, keys: string[]) => {
    // An object: its children.
    if (node && typeof node === "object") for (const [k, v] of Object.entries(node as Record<string, unknown>)) walk(v, [...keys, k]);
    // A string: no vendor label in it.
    else if (typeof node === "string")
      for (const [id, name] of Object.entries(VENDORS))
        if (wordOf(name).test(node)) failures.push(`  - ${loc}:certGuides.${keys.join(".")} names ${name} (${id}); a shared sentence takes {vendor}`);
  };
  walk(data.certGuides, []);
}

// ---- 2. Each guide's prose names only its own vendor ----
let strings = 0; // strings read, for the report
for (const g of studyGuides as unknown as Array<Record<string, unknown> & { slug: string; vendor: string }>) {
  // Every prose string of the record, with where it sits.
  const walk = (node: unknown, where: string[]) => {
    // An object or an array: its children, minus the identifier fields.
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) if (!SKIP.has(k)) walk(v, [...where, k]);
      return;
    }
    if (typeof node !== "string") return; // numbers, booleans, nulls
    strings++; // counted
    for (const [id, name] of Object.entries(VENDORS)) {
      if (id === g.vendor || OWNED_BY[id] === g.vendor) continue; // its own vendor, or a product of it
      if (!wordOf(name).test(node)) continue; // not named here
      const key = `${g.slug}:${id}`; // the declaration's key
      if (DECLARED.has(key)) {
        seen.add(key); // declared, with its reason
        continue;
      }
      failures.push(`  - ${g.slug} (${VENDORS[g.vendor] ?? g.vendor}) ${where.join(".")} names ${name}: "${node.slice(0, 90)}"`);
    }
  };
  walk(g, []);
}
// A declaration that matched nothing must go.
for (const key of DECLARED.keys()) if (!seen.has(key)) failures.push(`  - DECLARED "${key}" no longer matches anything and must be removed.`);

// Any failure stops the build, with where and why.
if (failures.length) {
  console.error(`\n[check-cert-vendor-prose] FAIL: ${failures.length} vendor name(s) out of place in certification prose:\n`);
  console.error(failures.slice(0, 40).join("\n"));
  console.error(
    `\n  A shared certGuides sentence takes the record's vendor as {vendor}; a guide's own prose names its own vendor. ` +
      `A product owned by the record's vendor goes into OWNED_BY; a mention that is right as it stands into DECLARED, with its reason.\n`
  );
  process.exit(1); // the build stops here
}
// The success line.
console.log(
  `[check-cert-vendor-prose] OK: the certGuides messages name no vendor (en, pt-BR); ${studyGuides.length} guide(s), ` +
    `${strings} prose string(s), each naming only its own vendor or a product it owns. ` +
    `${DECLARED.size} declared exception(s), may only shrink. Since 2026-10-07 (row 62).`
);
