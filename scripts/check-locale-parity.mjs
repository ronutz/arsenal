// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-locale-parity.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: every Learn article must exist in BOTH day-one locales.
//
// Why this exists (2026-07-26): the multi-locale rule says an article authored
// in English must ship with its pt-BR counterpart in the same change. Nothing
// enforced it. On a single day this failed THREE times and every time the
// twelve existing guards stayed green while the site carried a half-shipped
// article:
//   1. a turn aborted between writing the en file and the pt-BR one;
//   2. a heredoc wrote pt-BR content through a non-UTF-8 stdin and threw,
//      leaving the en file alone on disk;
//   3. an ASCII-escape payload contained two literal accented characters, so
//      the encode raised and the file was never written.
// All three were caught by counting files by hand. Hand-counting is not a
// control, so this is the control.
//
// Scope note: en and pt-BR are the DAY-ONE locales - the pair every other
// content guard already requires (check-tool-articles, check-reading-paths).
// The remaining fourteen locales are served by per-key English fallback and
// are deliberately NOT checked here; requiring them would block authoring.
//
// What it checks:
//   1. every en article has a pt-BR counterpart;
//   2. every pt-BR article has an en counterpart (an orphan translation means
//      the English was renamed or deleted and the pair silently broke);
//   3. a file present in both locales declares the SAME front-matter slug in
//      each. src/lib/learn.ts routes on the front-matter slug, not the
//      filename - f5-bigip-persistence-cookies.mdx is deliberately named
//      bigip-persistence-cookies.mdx and that is fine - so the invariant that
//      actually matters is that the two locales agree. If en says X and pt-BR
//      says Y, the pair is broken at the route even though both files exist.
//
// Mechanics: pure filesystem plus a single front-matter regex, so it runs in
// the plain-node prebuild chain alongside its siblings.
// ============================================================================

import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEARN = path.join(ROOT, "src", "content", "learn");

// The pair that must always ship together. Everything else falls back to en.
const REQUIRED_LOCALES = ["en", "pt-BR"];

const errors = [];

/** Article slugs present in a locale directory, without the .mdx extension. */
function slugsIn(locale) {
  const dir = path.join(LEARN, locale);
  if (!existsSync(dir)) {
    errors.push(`locale directory missing entirely: src/content/learn/${locale}`);
    return new Set();
  }
  return new Set(
    readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.slice(0, -".mdx".length)),
  );
}

const [en, pt] = REQUIRED_LOCALES.map(slugsIn);

// 1 + 2. Both directions. An orphan in either locale is a broken pair, and the
// direction tells you which side moved.
for (const slug of [...en].sort()) {
  if (!pt.has(slug)) {
    errors.push(
      `"${slug}" exists in en but not pt-BR - author the pt-BR article in the same change (multi-locale rule)`,
    );
  }
}
for (const slug of [...pt].sort()) {
  if (!en.has(slug)) {
    errors.push(
      `"${slug}" exists in pt-BR but not en - the English article was renamed or removed and left this behind`,
    );
  }
}

// 3. The two locales must agree on the routing identity. Checked by slug
// rather than filename because the front-matter slug is what routes; a file
// whose name differs from its slug is a naming choice, not a fault.
function declaredSlug(locale, file) {
  const src = readFileSync(path.join(LEARN, locale, `${file}.mdx`), "utf8");
  return /^slug:\s*(.+?)\s*$/m.exec(src)?.[1]?.replace(/^["']|["']$/g, "") ?? null;
}
for (const file of [...en].sort()) {
  if (!pt.has(file)) continue; // already reported above
  const a = declaredSlug("en", file);
  const b = declaredSlug("pt-BR", file);
  if (!a) errors.push(`en/${file}.mdx: no slug in front matter`);
  if (!b) errors.push(`pt-BR/${file}.mdx: no slug in front matter`);
  if (a && b && a !== b) {
    errors.push(
      `"${file}" routes differently per locale: en declares "${a}", pt-BR declares "${b}" - the pair is broken at the route`,
    );
  }
}

if (errors.length) {
  console.error(`[check-locale-parity] FAIL:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(
  `[check-locale-parity] OK: ${en.size} Learn articles present in ${REQUIRED_LOCALES.join(" + ")}, both locales agreeing on every routing slug.`,
);
