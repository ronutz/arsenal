#!/usr/bin/env node
/**
 * check-partner-duplicates.mjs  (added 2026-09-05)
 *
 * WHY THIS EXISTS
 * ---------------
 * A duplicate Nortel entry shipped. The catalogue already held the company as
 * `nortel-bay` ("Nortel & Bay Networks"); a second entry was added as `nortel`
 * because the pre-write check searched for the exact string `slug: "nortel"`,
 * which `slug: "nortel-bay"` does not contain. The check was correct about the
 * slug and wrong about the company, and nothing downstream noticed.
 *
 * The glossary has had a duplicate-topic guard for a long time. partners.ts did
 * not. That asymmetry is the whole reason this got through, so this is the
 * glossary guard's logic applied to the vendor catalogue.
 *
 * WHAT IT CHECKS
 * --------------
 * 1. Exact duplicate slugs.
 * 2. Slugs where one is a prefix of the other at a segment boundary
 *    (`nortel` vs `nortel-bay`), which is how a merged or renamed company
 *    acquires a second entry.
 * 3. Entries whose display names share a significant token, which catches the
 *    same company arriving under an unrelated slug.
 * 4. Identical COPY across entries - the same intro or the same body paragraph
 *    on two different vendors. Added 2026-09-27 after eleven entries were found
 *    sharing one intro and eight sharing one body, which checks 1 to 3 cannot
 *    see because eleven different companies share neither slug nor name. Fails
 *    at zero, with no baseline.
 *
 * Cases 2 and 3 are reported as warnings against a baseline rather than hard
 * failures, because legitimate pairs exist - a parent and a subsidiary can each
 * deserve an entry. The baseline may only go down.
 */

import { readFileSync } from "node:fs";

const src = readFileSync("src/content/vendors/partners.ts", "utf8");

const entries = [];
// Tolerant on purpose: the first version of this pattern demanded a two-space
// brace immediately followed by the slug, and so missed both comment-prefixed
// entries and two entries with a zero-indent brace - meaning the guard written
// to catch duplicates had a blind spot for exactly the entries most likely to
// be hand-edited. Found by cross-checking its count against a second method.
const re = /\n *\{\n(?:[^\n]*\n)*?    slug: "([^"]+)"/g;
let m;
const starts = [];
while ((m = re.exec(src)) !== null) starts.push({ slug: m[1], at: m.index });
starts.forEach((e, i) => {
  const end = i + 1 < starts.length ? starts[i + 1].at : src.length;
  const text = src.slice(e.at, end);
  const name = text.match(/\n {4}name: "([^"]+)"/)?.[1] ?? "";
  entries.push({ slug: e.slug, name, text });
});

// ---------------------------------------------------------------------------
// DECLARED OVERLAPS - a shared token that is NOT a duplicate, with the reason.
//
// This replaced a bare count on 2026-09-27, for the same reason the CSS guard
// stopped counting the same day: a number says "fourteen are tolerated" and
// cannot say WHICH, so it tolerates the fifteenth - the real duplicate - just as
// readily. Every entry below was checked by reading both entries.
//
// The alternative was blunting the tokeniser, and it was rejected on measurement:
// stopping "security" leaves RSA Security with NO identity tokens at all (rsa is
// three characters and filtered by length), and stopping "secure" does the same
// to Network Secure. A stop word that silences a whole entry buys a smaller
// number by making the guard blind to that company forever.
const DECLARED_TOKENS = new Map([
  ["telecom",  "Brasil Telecom and Algar Telecom: unrelated Brazilian carriers"],
  ["security", "OffSec, Skybox Security, RSA Security: three unrelated firms"],
  ["data",     "Tech Data, EDS, Data General, Dimension Data: four unrelated firms"],
  ["micro",    "Ingram Micro (distributor) and Trend Micro (security vendor)"],
  ["global",   "Global Crossing (carrier, inside the Lumen entry) and Global Knowledge (training)"],
  ["secure",   "Pulse Secure (SSL VPN) and Network Secure (Brazilian channel)"],
  ["blue",     "Blue Coat (proxy) and Blue Eye (Brazilian channel): a shared colour, not a shared company"],
  ["link",     "TP-Link and D-Link: two unrelated Taiwanese networking brands"],
  ["cobra",    "the market-reserve entry names the firms the policy created; Cobra also has its own entry"],
  ["cyclades", "CYCLADES (IRIA, France), the 1970s research network where the datagram was born, and Cyclades the Brazilian-founded console-server company later bought by Avocent. Same name, nothing else."],
]);

// Slug-stem pairs that are genuinely two companies. Empty on purpose right now:
// the only stem overlap in the catalogue is a REAL duplicate, left visible below.
const DECLARED_STEMS = new Map([]);

const failures = [];
const warnings = [];

// 1. exact duplicates - always fatal
const seen = new Map();
for (const e of entries) {
  if (seen.has(e.slug)) failures.push(`duplicate slug: "${e.slug}" appears more than once`);
  seen.set(e.slug, true);
}

// 2. one slug is a segment-prefix of another
for (const a of entries) {
  for (const b of entries) {
    if (a.slug >= b.slug) continue;
    if (b.slug.startsWith(`${a.slug}-`) || a.slug.startsWith(`${b.slug}-`)) {
      if (DECLARED_STEMS.has(`${a.slug}|${b.slug}`)) continue;
      warnings.push(`"${a.slug}" and "${b.slug}" share a slug stem - same company under two entries?`);
    }
  }
}

// 3. display names sharing a distinctive token
const STOP = new Set([
  "the","and","a","an","of","in","to","for","networks","network","systems","system",
  "technologies","technology","corporation","corp","inc","ltd","group","company",
  "co","that","who","was","is","it","its","from","with","-","&",
  // Descriptive words that appear in display names as PROSE, not as company
  // identity (added 2026-09-06 after "supply chain" matched two unrelated
  // entries). A shared adjective is not a shared company.
  "supply","chain","first","compromise","cascading","without","when","then",
  "never","most","between","before","after","every","other","into","their",
  "software","vendor","world","worlds","enterprise","became","declared","corridor",
  "against","what","that","help","desk","flaws","buys","defends",
  // 2026-09-27. Two more, for reasons of kind rather than convenience:
  //   "lineage" is a word THIS CATALOGUE uses in entry names to mean a family
  //   of successor products ("The Sniffer lineage", "Dolch (Kontron / Azonix
  //   lineage)"). It is never a company's identity, so it belongs beside
  //   "supply" and "chain" above.
  //   "grupo" is Portuguese for "group", and "group" has been stopped since
  //   this list was written. Stopping one and not the other meant Grupo Binario
  //   and Grupo IHC collided while Foo Group and Bar Group did not, purely
  //   because of which language the company registered in.
  "lineage","grupo",
]);
const tokens = (s) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3 && !STOP.has(t));
const byToken = new Map();
// The catalogue's `name` field follows the convention "Company - descriptive
// phrase" (e.g. "Coursera - a hundred thousand students in a lifetime"). Only
// the part BEFORE the dash is the company's identity; the phrase is prose, and
// tokenising it produced a stream of false overlaps ("thousand", "silicon",
// "security") that three stop-list extensions never caught up with
// (2026-09-06/07). Tokenise the head only.
const head = (name) => name.split(/\s[-\u2013\u2014]\s/)[0];
for (const e of entries) {
  for (const t of new Set(tokens(head(e.name)))) {
    if (!byToken.has(t)) byToken.set(t, []);
    byToken.get(t).push(e.slug);
  }
}
for (const [tok, slugs] of byToken) {
  if (slugs.length > 1 && !DECLARED_TOKENS.has(tok)) {
    warnings.push(`name token "${tok}" shared by: ${slugs.join(", ")}`);
  }
}


// What remains is ONE warning, and it is a real duplicate awaiting PRIME's
// ruling rather than a false positive:
//
//   intel  <->  intel-amd
//
//   `intel-amd` is "Intel & AMD - Fairchild's children: the x86 rivalry", and
//   its own tagline argues the case: "one entry, because neither story parses
//   without the other." A separate `intel` entry was added later, richer (2,302
//   chars against 1,081) and in a different group (contemporary against other).
//
//   This is the Nortel fault verbatim - the fault that produced this guard. A
//   pre-write check for `slug: "intel"` does not match `slug: "intel-amd"`.
//
//   NOT merged here, because every resolution costs something a guard has no
//   standing to choose: dropping `intel` loses the longer entry, dropping
//   `intel-amd` loses AMD entirely against its author's stated reasoning, and
//   merging changes a public URL. Raised in canon QUEUE-DUPLICATE-REVIEW.md.
//   TWO warnings, ONE defect: the pair trips the slug-stem check and the
//   name-token check, which is the guard working - a duplicate that only one of
//   the two mechanisms could see would be a duplicate this guard might miss.
//   Lower this to 0 when PRIME rules.
// ---------------------------------------------------------------------------
// CHECK 4 - IDENTICAL COPY ACROSS ENTRIES. Added 2026-09-27.
//
// See the note above the BASELINE: this one has no baseline and no declared list,
// because there is no case where two vendor pages should carry the same
// paragraph. It reads `intro` and each `body` paragraph as written, normalising
// only whitespace, so a genuine rewrite passes and a copy-paste does not.
const MIN_COPY_LEN = 80; // below this a coincidence is plausible (a tagline, a category line)
const copySeen = new Map(); // normalised text -> [{slug, field}]

for (const e of entries) {
  const fields = [];
  // The intro is a single string.
  const intro = e.text.match(/\n {4}intro:\s*\n?\s*"((?:[^"\\]|\\.)*)"/)?.[1];
  if (intro) fields.push(["intro", intro]);
  // The body is an array; take each paragraph separately, because boilerplate
  // usually arrives as ONE shared paragraph inside an otherwise distinct body.
  const bodyBlock = e.text.match(/\n {4}body: \[\n([\s\S]*?)\n {4}\]/)?.[1];
  if (bodyBlock) {
    for (const p of bodyBlock.matchAll(/"((?:[^"\\]|\\.)*)"/g)) fields.push(["body", p[1]]);
  }
  for (const [field, raw] of fields) {
    const norm = raw.replace(/\s+/g, " ").trim();
    if (norm.length < MIN_COPY_LEN) continue;
    if (!copySeen.has(norm)) copySeen.set(norm, []);
    copySeen.get(norm).push({ slug: e.slug, field });
  }
}

const sharedCopy = [...copySeen.entries()].filter(([, uses]) => {
  // Two uses in the SAME entry is a different defect (a repeated paragraph) and
  // is also worth failing on; what matters is that it is more than one use.
  return uses.length > 1;
});

if (sharedCopy.length) {
  console.error(
    `\n[check-partner-duplicates] FAIL: ${sharedCopy.length} paragraph(s) appear in more than one place.\n`,
  );
  for (const [norm, uses] of sharedCopy.slice(0, 10)) {
    console.error(`  x${uses.length}  ${uses.map((u) => `${u.slug}.${u.field}`).join(", ")}`);
    console.error(`        "${norm.slice(0, 110)}..."`);
  }
  console.error(
    "\n      Eleven entries shared one intro on 2026-09-27 and nothing caught it, because\n" +
      "      the other checks here compare slugs and names. Two vendor pages carrying the\n" +
      "      same paragraph reads as generated filler whatever the paragraph says. Write\n" +
      "      each entry from what its OWN sources establish, and where an entry has less to\n" +
      "      say, let its copy be shorter rather than padded with someone else's.\n",
  );
  process.exit(1);
}

const BASELINE = 2; // ratcheted 111 -> 14 on 2026-09-07 when the tokeniser was fixed to read the company-name head only

if (failures.length) {
  console.error("\n[check-partner-duplicates] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

if (warnings.length > BASELINE) {
  console.error(
    `\n[check-partner-duplicates] FAIL: ${warnings.length} possible duplicate(s), above the baseline of ${BASELINE}.\n`
  );
  for (const w of warnings.slice(0, 20)) console.error(`      ${w}`);
  console.error(
    "\n  If these are genuinely distinct companies, raise the baseline with a reason.\n"
  );
  process.exit(1);
}

console.log(
  `[check-partner-duplicates] OK: ${entries.length} entries; no duplicate slugs; ` +
    `${warnings.length} name/stem overlap(s) (baseline ${BASELINE}` +
    `${warnings.length < BASELINE ? " - LOWER THAN BASELINE, drop it to " + warnings.length : ""}).`
);
