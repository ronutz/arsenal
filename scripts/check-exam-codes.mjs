// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-exam-codes.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: an exam code identifies exactly one exam, so no two study
// guides may claim the same one.
//
// Why this exists (2026-07-27): a Check Point accreditation layer was
// scaffolded without first checking what was already in the file, and three
// exams ended up listed twice - 156-541, 156-551 and 156-587 each had two
// guides. Both slugs resolved, both certifications resolved, so
// check-study-guides passed and tsc passed. The defect was only visible by
// reading the built page, where the same accreditation appeared twice.
//
// The lesson generalises past that incident: the existing guards all check
// that references RESOLVE. None of them checks that the content is not
// duplicated. A reference can point somewhere real and still be wrong.
//
// What it checks:
//   1. No two guides share an examCode - for the vendors whose examCode
//      actually identifies an exam. Version pairs are the legitimate case that
//      looks similar (CCTA R81.20 is 156-582, CCTA R82 is 156-583) and those
//      are DIFFERENT codes, so they pass.
//      FORTINET IS EXEMPT AND THAT IS CORRECT: its examCode is a LEVEL label,
//      so "NSE 6" is shared by sixteen product exams by design. The first
//      version of this guard asserted uniqueness for everyone and immediately
//      failed on thirty-two perfectly good Fortinet guides. The exemption is
//      declared here explicitly rather than inferred from the data, because
//      inferring it would mean a vendor with one duplicate looks like a vendor
//      with a level-label scheme, and the guard would excuse the very thing it
//      exists to catch.
//   2. No two guides share a slug (a routing collision, which would silently
//      shadow one of them).
//   3. Every guide belongs to a certification that lists it in examSlugs, and
//      every examSlugs entry points at a guide that names that certification.
//      A one-directional link is how a guide ends up attached to the wrong
//      parent - which is exactly what happened here, with five accreditation
//      exams hanging off the Master certification instead of their own.
// ============================================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "src", "content", "certifications", "study-guides.ts");
const src = readFileSync(SRC, "utf8");

/** Vendors whose examCode is a LEVEL label rather than a per-exam identifier.
 *  Everything not listed here is expected to give each exam its own code. */
const LEVEL_LABEL_VENDORS = new Set(["fortinet"]);

const errors = [];

/** Pull one field out of a record body. */
const field = (body, name) =>
  new RegExp(`${name}:\\s*"([^"]*)"`).exec(body)?.[1] ?? null;

// ---- collect guides -------------------------------------------------------
const guides = [];
for (const m of src.matchAll(/\n {2}\{\n {4}slug: "([a-z0-9.-]+)",((?:(?!\n {2}\}).)*)/gs)) {
  const [, slug, body] = m;
  if (!/\bvendor:\s*"/.test(body)) continue; // certifications have no vendor+slug pair
  guides.push({
    slug,
    examCode: field(body, "examCode"),
    certification: field(body, "certification"),
    vendor: field(body, "vendor"),
  });
}

// ---- collect certifications ----------------------------------------------
const certs = [];
for (const m of src.matchAll(/\n {2}\{\n(?:(?!\n {2}\}).)*?key: "([a-z0-9-]+)",((?:(?!\n {2}\}).)*)/gs)) {
  const [, key, body] = m;
  const arr = /examSlugs:\s*\[([^\]]*)\]/.exec(body)?.[1] ?? "";
  certs.push({ key, examSlugs: [...arr.matchAll(/"([a-z0-9.-]+)"/g)].map((x) => x[1]) });
}

// 1. Duplicate exam codes.
const byCode = new Map();
for (const g of guides) {
  if (!g.examCode) continue;
  if (LEVEL_LABEL_VENDORS.has(g.vendor ?? "")) continue;
  const key = `${g.vendor}::${g.examCode}`;
  byCode.set(key, [...(byCode.get(key) ?? []), g.slug]);
}
for (const [key, slugs] of byCode) {
  if (slugs.length > 1) {
    errors.push(
      `exam code ${key.split("::")[1]} is claimed by ${slugs.length} guides: ${slugs.join(", ")} - ` +
      `an exam code identifies one exam, so these are duplicates or one has the wrong code`,
    );
  }
}

// 2. Duplicate slugs.
const bySlug = new Map();
for (const g of guides) bySlug.set(g.slug, (bySlug.get(g.slug) ?? 0) + 1);
for (const [slug, n] of bySlug) {
  if (n > 1) errors.push(`slug "${slug}" is used by ${n} guides - one would shadow the other at its route`);
}

// 3. The parent link must agree in both directions.
const certByKey = new Map(certs.map((c) => [c.key, c]));
for (const g of guides) {
  if (!g.certification) continue;
  const c = certByKey.get(g.certification);
  if (!c) continue; // check-study-guides already reports unresolvable references
  if (!c.examSlugs.includes(g.slug)) {
    errors.push(
      `guide "${g.slug}" says it belongs to "${g.certification}", but that certification does not list ` +
      `it in examSlugs - the link points one way only, which is how a guide ends up under the wrong parent`,
    );
  }
}

if (errors.length) {
  console.error(`[check-exam-codes] FAIL:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(
  `[check-exam-codes] OK: ${guides.length} guides, every per-exam code claimed once ` +
  `(${[...LEVEL_LABEL_VENDORS].join(", ")} exempt: level labels by design), ` +
  `no slug collisions, every certification link agreeing in both directions.`,
);
