// ============================================================================
// scripts/check-changelog.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: every LIVE (built) tool must be recorded in the public changelog.
//
// Canon (PRIME directive): shipping a tool is not "done" until it is logged.
// The public changelog is a curated, dated record a build cannot fully generate
// (the prose is written), but it CAN be enforced: every built tool must appear
// in at least one changelog entry's `tools` array, so a shipped tool is never
// invisible in the change record. This closes the one cross-artifact step that
// was relying on memory - and was being missed. An enforced check, not
// discipline, is the fix (same rationale as check-tool-articles).
//
// Mechanics: built-tool slugs come from the catalogue source (disposition:
// "built"); logged slugs come from every `tools: [...]` array in the changelog
// data module. fs + regex only, so it runs in the plain-node prebuild chain.
// ============================================================================

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGUE = path.join(ROOT, "src/content/catalogue/catalogue.ts");
const CHANGELOG = path.join(ROOT, "src/content/changelog/changelog.ts");

// ---- 1. built-tool slugs from the catalogue --------------------------------
const catalogueSrc = readFileSync(CATALOGUE, "utf8");
const builtSlugs = [];
for (const line of catalogueSrc.split("\n")) {
  if (!/disposition:\s*"built"/.test(line)) continue;
  const m = line.match(/slug:\s*"([^"]+)"/);
  if (m) builtSlugs.push(m[1]);
}

// ---- 2. slugs recorded anywhere in a changelog `tools: [...]` array ---------
const changelogSrc = readFileSync(CHANGELOG, "utf8");
const logged = new Set();
for (const m of changelogSrc.matchAll(/tools:\s*\[([^\]]*)\]/g)) {
  for (const s of m[1].matchAll(/"([^"]+)"/g)) logged.add(s[1]);
}

// ---- 3. verify every built tool is logged ----------------------------------
const missing = builtSlugs.filter((slug) => !logged.has(slug));
if (missing.length) {
  console.error(
    `\n[check-changelog] FAIL: ${missing.length} built tool(s) missing a changelog entry:`,
  );
  for (const slug of missing) console.error(`  - ${slug}: add a changelog entry with tools: ["${slug}"]`);
  console.error(
    `\nEvery built tool needs at least one changelog entry that lists it in ` +
      `tools. Add the entry to src/content/changelog/changelog.ts, then rebuild.\n`,
  );
  process.exit(1);
}

// ---- 4. recent entries carry a Portuguese title (Round 1 audit CC06, 2026-10-20) ---------------------------
// The pt-BR Home lists the newest entries; from 2026-10-19 on each entry needs `titlePt`, so none shows in English.
// The first day the rule applies (entries before it keep their English title, marked lang="en" on pt-BR pages).
const PT_FROM = "2026-10-19";
// Each entry object, cut at the "  {" lines that open them inside the array.
const entryBlocks = changelogSrc.split(/\n  \{\n/).slice(1);
// The entries dated on or after PT_FROM that lack a non-empty titlePt.
const untitled = [];
for (const b of entryBlocks) {
  // The entry's date and English title.
  const date = (b.match(/\bdate:\s*"(\d{4}-\d{2}-\d{2})"/) || [])[1];
  const title = (b.match(/\btitle:\s*"([^"]*)"/) || [])[1];
  // Older entries are outside the rule.
  if (!date || date < PT_FROM) continue;
  // A present, non-empty titlePt satisfies it.
  if (/\btitlePt:\s*"[^"]+"/.test(b)) continue;
  // Otherwise it is reported.
  untitled.push(`${date} "${title}"`);
}
// Any entry without its Portuguese title stops the build.
if (untitled.length) {
  console.error(`\n[check-changelog] FAIL: ${untitled.length} entry(ies) dated ${PT_FROM} or later without titlePt:`);
  for (const u of untitled) console.error(`  - ${u}: add titlePt, the title in Brazilian Portuguese`);
  process.exit(1);
}
// --- 3. Links that must work in every language (2026-11-04) -----------------------------------------------------
// A changelog link is locale-agnostic: the page prefixes the reader's language, so "/dev/fun/importance-meter" becomes
// /da/dev/fun/importance-meter/ on the Danish changelog. A route that exists in English only is answered there by a
// cross-language 301 in public/_redirects, and check-internal-links (which reads a fallback language only in the full
// 16-language build) rejects a link that leans on one. The twentieth package's arrows entry linked the English-only
// Importance Meter and passed every sandbox check, then failed the full build in CI (runs 113169009709 and
// 113169009913, 04/11/2026). Read the redirect table here, so the sandbox catches it before CI does.
const REDIRECTS_FILE = path.join(ROOT, "public/_redirects");
// "from to [status]" lines, comments and blanks skipped.
const redirectLines = readFileSync(REDIRECTS_FILE, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
// Each rule's source, mapped to its destination.
const redirectTo = new Map(redirectLines.map((l) => l.split(/\s+/)).filter((p) => p.length >= 2).map((p) => [p[0], p[1]]));
// The site's languages: one message pack each (a redirect from any other first segment, such as /fortinet/, is a
// vendor shortcut, not a language).
const LANGS = new Set(readdirSync(path.join(ROOT, "src/i18n/messages")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)));
// Every href in a links: [...] list of the changelog.
const linkHrefs = [...changelogSrc.matchAll(/\{\s*label:\s*"[^"]*",\s*href:\s*"([^"]+)"\s*\}/g)].map((m) => m[1]);
// The ones whose page, in some language, is a redirect to another language.
const crossLanguage = [];
// Each link once.
for (const href of new Set(linkHrefs)) {
  // Only site paths are prefixed (an absolute URL is not).
  if (!href.startsWith("/")) continue;
  // The trailing-slash form the site serves.
  const tail = href.endsWith("/") ? href : `${href}/`;
  // A rule from /<lang><path>/ to a page in another language.
  for (const [from, to] of redirectTo) {
    // The rule's language and path.
    const m = from.match(/^\/([a-zA-Z-]+)(\/.*)$/);
    // Not this link's page.
    if (!m || !LANGS.has(m[1]) || m[2] !== tail) continue;
    // A destination in another language makes the link lean on the redirect.
    if (to.startsWith("/") && !to.startsWith(`/${m[1]}/`)) {
      // Recorded once per link.
      crossLanguage.push(`${href} (in ${m[1]}: ${from} -> ${to})`);
      // One example is enough.
      break;
    }
  }
}
// Any such link stops the build.
if (crossLanguage.length) {
  console.error(`\n[check-changelog] FAIL: ${crossLanguage.length} changelog link(s) point at a page that some languages only reach through a redirect to another language:`);
  for (const c of crossLanguage) console.error(`  - ${c}: link a page every language carries instead`);
  process.exit(1);
}
console.log(`[check-changelog] OK: all ${builtSlugs.length} built tools appear in the changelog; every entry since ${PT_FROM} has its Portuguese title; ${new Set(linkHrefs).size} link(s) land in every language without a cross-language redirect.`);
