// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-public-provenance.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD (Round 1, CC04, 2026-10-25): internal editorial handoff notes
// must not reach the public certification pages.
//
// Why: the production audit of 19 October 2026 found certification source
// labels and notes reading "relayed by PRIME", "ANVIL-authored study aids",
// "the earlier truncated capture ... is now CLOSED", "Expert enrichment wave"
// and "PRIME ruling". That is workflow history, not provenance: a reader needs
// the official document, its version and dates, and which words are the
// vendor's. The history now lives in code comments, which never render.
//
// What it scans: every string LITERAL in the certification data file (code
// comments are skipped, so history kept there is fine) and every string in the
// certGuides namespace of the en and pt-BR message packs. verification.ts is
// not scanned: its `basis` is an audit field that is never rendered.
//
// The token list is deliberately narrow (scenario CC04-C): the agent seat names
// in capitals, and phrases that only ever come from a handoff. Ordinary words
// such as "closed" or "prime" in normal prose do not match. A hit fails the
// build with the file, line and token; the fix is to move that history into a
// comment and keep only official identity, dates and the limitation itself.
//
// EXTENDED (2026-10-26, after the Round 1 follow-up): the same leak was found in
// Industry source notes and profiles ("Per PRIME's ruling ... STAYS IN THE
// COPY", "see canon AUDIT-...", "Dates from PRIME's own record in
// partners.ts"), in the glossary (null-pointer-dereference) and in Learn
// (memory-safety). The guard now also scans, as string literals, the Industry
// records (partners.ts), every profile and every pt-BR overlay shard; as JSON,
// the glossary namespace of the en and pt-BR packs; and, as text, every Learn
// article in en and pt-BR. Tokens added for those surfaces: internal canon file
// names and canon jargon, the old "STAYS IN THE COPY" ruling phrase, and the
// source file name partners.ts.
//
// DECLARED, NOT SCANNED (by design): the Colophon and Contribute/Ideas
// namespaces describe the CONCORD seats on purpose (PRIME, ANVIL, SCOUT are the
// subject there); the site footer names CONCORD; and the changelog keeps its
// historical entries as written. None of those files is read here.
// ============================================================================

// Directory listing, for the profiles, overlays and Learn folders.
import { readdirSync } from "node:fs";
// File reading and path handling from Node's standard library.
import { readFileSync } from "node:fs";
// Paths are resolved from this script's own location, so the guard runs from any working directory.
import path from "node:path";
// The script's own file path, as a URL turned into a path.
import { fileURLToPath } from "node:url";

// The repository root: one level above scripts/.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The prefix every message of this guard carries.
const TAG = "[check-public-provenance]";

// The internal tokens, each with a short reason printed beside a hit.
const TOKENS = [
  // The CONCORD seats, written in capitals as the handoffs write them (case-sensitive, whole words).
  { re: /\b(PRIME|ANVIL|SCOUT|CONCORD)\b/, why: "an internal seat name" },
  // The enrichment passes were internal waves of work, not a provenance fact.
  { re: /\benrichment wave\b/i, why: "an editorial wave instruction" },
  // A repaired capture announced as closed is handoff state (capital CLOSED only, so prose "closed" passes).
  { re: /\bnow CLOSED\b|\bis CLOSED\b/, why: "a closure note from a handoff" },
  // "this session" ("nesta/desta sessão") only ever describes the agent session that wrote the line.
  { re: /\bthis session\b|(^|[^\p{L}])(nesta|desta) sessão(?![\p{L}])/iu, why: "agent-session language" },
  // Named internal runs and batches.
  { re: /\bRun [AB] scaffold\b|\bR1-b\d\b|\bwave X\d\b/, why: "an internal run or batch name" },
  // Canon file names ("AUDIT-founding-dates-20260912") and canon jargon in English and Portuguese.
  { re: /\bAUDIT-[a-z-]+-\d{8}\b|\bcanon (AUDIT|research record)\b|\bprior-round canon\b|\bR1 canon\b|\bCanon R1\b|\bc[âa]none de rodadas\b/i, why: "an internal canon reference" },
  // The old ruling phrase, in capitals as the handoffs wrote it.
  { re: /\bSTAYS IN THE COPY\b/, why: "a ruling phrase from a handoff" },
  // Model-training language ("through this page's knowledge cutoff") is not a date a reader can check.
  { re: /\bknowledge cutoff\b|\blimite de conhecimento\b/i, why: "model-training language" },
  // A source file name is how the site is built, not provenance a reader can follow.
  { re: /\bpartners\.ts\b/, why: "a source file name" },
];

/**
 * Every string literal in a TypeScript source, with its 1-based line, skipping comments.
 * A small character scanner rather than a regex, because URLs ("https://") inside strings
 * look like comments to a regex and comments can contain quotes.
 */
function stringLiterals(src) {
  // The literals found, and the current line number.
  const out = [];
  let line = 1;
  // Walk the source one character at a time.
  for (let i = 0; i < src.length; i++) {
    // The character under the cursor and the one after it.
    const c = src[i];
    const next = src[i + 1];
    // Count lines as they pass.
    if (c === "\n") { line++; continue; }
    // A line comment runs to the end of the line; skip it whole.
    if (c === "/" && next === "/") { while (i < src.length && src[i] !== "\n") i++; i--; continue; }
    // A block comment runs to its closing mark; skip it, counting its lines.
    if (c === "/" && next === "*") {
      // Step past the opening mark.
      i += 2;
      // Advance to the closing mark, counting newlines on the way.
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) { if (src[i] === "\n") line++; i++; }
      // Step onto the closing slash; the loop's i++ moves past it.
      i++;
      continue;
    }
    // A string literal of any of the three quote kinds.
    if (c === '"' || c === "'" || c === "`") {
      // Where it starts, and its text as it accumulates.
      const startLine = line;
      let text = "";
      // Read to the matching unescaped quote.
      for (i++; i < src.length && src[i] !== c; i++) {
        // An escape takes the next character literally.
        if (src[i] === "\\") { text += src[i + 1] ?? ""; i++; continue; }
        // Newlines inside template literals still count as lines.
        if (src[i] === "\n") line++;
        // Everything else is part of the text.
        text += src[i];
      }
      // Record the literal with the line it began on.
      out.push({ line: startLine, text });
    }
  }
  // All literals, in source order.
  return out;
}

/** Every string inside a JSON value, with its dotted key path. */
function jsonStrings(value, keyPath, out = []) {
  // A string is a leaf to scan.
  if (typeof value === "string") out.push({ key: keyPath, text: value });
  // Objects and arrays are walked recursively.
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) jsonStrings(v, `${keyPath}.${k}`, out);
  // The accumulated leaves.
  return out;
}

// The findings, one line each.
const hits = [];

// 1. The certification data file: string literals only.
const DATA = "src/content/certifications/study-guides.ts";
// Read the source once.
const dataSrc = readFileSync(path.join(ROOT, DATA), "utf8");
// Every literal against every token.
for (const lit of stringLiterals(dataSrc)) {
  for (const tok of TOKENS) {
    // The first match of this token in this literal, if any.
    const m = tok.re.exec(lit.text);
    // A hit names the file, line, token and reason, with a little context.
    if (m) hits.push(`${DATA}:${lit.line}: "${m[0]}" (${tok.why}) in "${lit.text.slice(Math.max(0, m.index - 40), m.index + 60)}"`);
  }
}

// 1b. The pt-BR study-guide overlays (26/10/2026): the guides' translated prose, string literals only, like the data file.
for (const f of readdirSync(path.join(ROOT, "src/content/certifications/overlays/pt-BR")).sort()) {
  // Each vendor file (and the index, which holds no prose).
  if (f.endsWith(".ts")) scanLiterals(`src/content/certifications/overlays/pt-BR/${f}`, readFileSync(path.join(ROOT, "src/content/certifications/overlays/pt-BR", f), "utf8"));
}

// 2. The certGuides chrome in both authored packs.
for (const locale of ["en", "pt-BR"]) {
  // The pack file and its parsed contents.
  const file = `src/i18n/messages/${locale}.json`;
  const pack = JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
  // Every string in the namespace against every token.
  for (const leaf of jsonStrings(pack.certGuides ?? {}, "certGuides")) {
    for (const tok of TOKENS) {
      // The first match of this token in this message, if any.
      const m = tok.re.exec(leaf.text);
      // A hit names the pack, the key, the token and the reason.
      if (m) hits.push(`${file} ${leaf.key}: "${m[0]}" (${tok.why})`);
    }
  }
}

/** Scan a list of string literals from one file against every token. */
function scanLiterals(file, src) {
  // Every literal in the file.
  for (const lit of stringLiterals(src)) {
    // Every token against it.
    for (const tok of TOKENS) {
      // The first match, if any.
      const m = tok.re.exec(lit.text);
      // A hit names the file, line, token and reason, with context.
      if (m) hits.push(`${file}:${lit.line}: "${m[0]}" (${tok.why}) in "${lit.text.slice(Math.max(0, m.index - 40), m.index + 60)}"`);
    }
  }
}

// 3. Industry: the records, every profile and every pt-BR overlay shard (string literals only).
const INDUSTRY = ["src/content/vendors/partners.ts", "src/content/vendors/localized.ts"];
// Each profile file.
for (const f of readdirSync(path.join(ROOT, "src/content/vendors/profiles"))) if (f.endsWith(".ts")) INDUSTRY.push(`src/content/vendors/profiles/${f}`);
// Each overlay file.
for (const f of readdirSync(path.join(ROOT, "src/content/vendors/overlays/pt-BR"))) if (f.endsWith(".ts")) INDUSTRY.push(`src/content/vendors/overlays/pt-BR/${f}`);
// Scan them all.
for (const f of INDUSTRY) scanLiterals(f, readFileSync(path.join(ROOT, f), "utf8"));

// 4. The glossary: its data file's literals and the glossary namespace of both authored packs.
scanLiterals("src/content/glossary/glossary.ts", readFileSync(path.join(ROOT, "src/content/glossary/glossary.ts"), "utf8"));
// Both authored packs.
for (const locale of ["en", "pt-BR"]) {
  // The pack and its parsed contents.
  const file = `src/i18n/messages/${locale}.json`;
  const pack = JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
  // Every glossary string against every token.
  for (const leaf of jsonStrings(pack.glossary ?? {}, "glossary")) {
    for (const tok of TOKENS) {
      // The first match, if any.
      const m = tok.re.exec(leaf.text);
      // A hit names the pack, key, token and reason.
      if (m) hits.push(`${file} ${leaf.key}: "${m[0]}" (${tok.why})`);
    }
  }
}

// 5. Learn: every article in both authored locales, line by line (MDX comments are dropped first).
for (const locale of ["en", "pt-BR"]) {
  // The locale's article folder.
  const dir = `src/content/learn/${locale}`;
  // Each article file.
  for (const f of readdirSync(path.join(ROOT, dir))) {
    // MDX and Markdown only.
    if (!/\.mdx?$/.test(f)) continue;
    // The article text with JSX comments blanked (keeping line breaks so line numbers stay true).
    const text = readFileSync(path.join(ROOT, dir, f), "utf8").replace(/\{\/\*[\s\S]*?\*\/\}/g, (c) => c.replace(/[^\n]/g, " "));
    // Each line against every token.
    text.split("\n").forEach((ln, i) => {
      // "this session" is a networking term in Learn (a RADIUS, ZTNA or SD-WAN session, a playground run), so that one token is skipped here.
      for (const tok of TOKENS.filter((t) => t.why !== "agent-session language")) {
        // The first match, if any.
        const m = tok.re.exec(ln);
        // A hit names the file, line, token and reason.
        if (m) hits.push(`${dir}/${f}:${i + 1}: "${m[0]}" (${tok.why})`);
      }
    });
  }
}

// Fail with every finding, or report the clean scan.
if (hits.length) {
  // The header, then one finding per line, then the fix.
  console.error(`${TAG} FAIL: ${hits.length} internal handoff token(s) in public text:`);
  for (const h of hits) console.error(`  - ${h}`);
  console.error(`${TAG} Move editorial history into a code comment; publish only the official title, id, version, link, dates and any real limitation.`);
  // A non-zero exit stops the prebuild chain.
  process.exit(1);
}
// The clean result, with what was scanned.
console.log(`${TAG} OK: no internal handoff tokens in the certification data and its pt-BR overlays, the certGuides chrome, Industry records, profiles and pt-BR overlays, the glossary or Learn (en, pt-BR).`);
