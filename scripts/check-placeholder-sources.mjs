#!/usr/bin/env node
// ============================================================================
// check-placeholder-sources — A CITATION MAY NOT CITE ITS OWN SUBJECT, NOR THE
// FACT THAT EVERYONE KNOWS.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-10-01, printing all 39 remaining DECLARED_UNLINKED
// lore entries with their labels showed five that were not "named a work and
// linked nowhere" at all. They named NOTHING:
//
//     the-iloveyou-virus   sources: [{ label: "Widely documented (May 2000)" }]
//     notpetya             sources: [{ label: "NotPetya (2017)" }]
//     sloth                sources: [{ label: "SLOTH attack (2016)" }]
//     wannacry             sources: [{ label: "Widely documented (May 2017); ..." }]
//     the-eniac-programmers sources: [{ label: "Documented; Light, ... (1999)" }]
//
// Two are the entry's own headword plus a year. Two appeal to ubiquity. One
// prefixes a real citation with the word "Documented", which adds nothing.
//
// THE EXISTING GUARDS CANNOT SEE THIS. check-glossary rule 5 tests that a
// `sources` array exists. Rule 5b tests that one of its entries carries an
// absolute href. A label that names nothing passes rule 5, and it trips rule 5b
// only BY ACCIDENT, because these particular labels happen to have no link. Give
// any one of them an href and both rules go green while the label still names
// nothing a reader could check. That is the gap this guard closes.
//
// WHY THE SCOPE IS WHAT IT IS, AND WHAT IT COSTS. The naive scope - every string
// in the tree - does not work: "Documented" opens 13 string values tree-wide and
// nine of them are legitimate tool-explainer prose ("Documented behavior: the
// Client does not establish a tunnel..."). Declaring legitimate prose is the rot
// the declared-list pattern exists to prevent. So the scope is by FIELD:
//
//   1. Every `label` in a glossary entry's `sources` block, read through the same
//      entry chunker check-glossary uses - which, since 2026-10-01, asserts that
//      it parsed every entry, so nothing hides in a fragment.
//   2. Every `sourceNote` value in the tree (379 of them). That field exists only
//      to record provenance, so no context tracking is needed to know it is a
//      citation.
//
//   3. Every citation label in the tree OUTSIDE the glossary, added 2026-10-01.
//
// WHY 3 EXISTS, AND WHAT THE HEADER USED TO SAY. Until 2026-10-01 this guard
// read only 1 and 2, and the header justified that by claiming every
// non-glossary citation label "is paired with a url and so is reachable by
// other means". THAT CLAUSE WAS WRONG, and it was load-bearing. A label paired
// with a url is not thereby checkable: `{ label: "Founding year: 2003", url:
// "https://en.wikipedia.org/wiki/Barracuda_Networks" }` names a datum and
// points at a page without naming anything in it, which IS the fault this
// guard exists to catch. The link does not repair the label; it only makes the
// reader go and look for a sentence the citation declined to identify.
//
// So the guard was enforced at zero on a scope that excluded 2861 of the 4391
// label fields in the tree, and partners.ts held 22 instances of a fault the
// guard reported as absent. The zero was true of the SCOPE, not of the corpus -
// the same false reassurance a bare ratchet count gives, in a new place.
//
// WHAT WIDENING ACTUALLY COST, measured before it was done rather than after:
// across all 4391 labels, `appeal-to-ubiquity` and `bare-documented` return
// ZERO. So for two of the three original faults the old clause happened to be
// harmless, and that is luck, not design. Only the third fault was present, in
// a syntax the pattern did not recognise (see BARE_FIELD below).
//
// WHY THE SCOPE IS "A LABEL THAT CARRIES A URL" AND NOT "EVERY LABEL". Tested
// first: a tree-wide `label:` sweep flags "AES-128", "SHA-256" and "RIPEMD-160"
// in src/lib/tools/*, which are cipher names in UI dropdowns and not citations
// at all. 636 labels in the tree carry no url. The mark of a citation is that
// it points somewhere, so that is the scope, and it is read through a
// brace-matching reader because 329 of the 3114 citation objects in the tree
// put `label` and `url` on SEPARATE lines - mostly the RFC and IANA citations
// in src/config/toolProvenance.ts and src/lib/tools/*, which are the best
// citations in the corpus. A line-based reader would have missed a tenth of the
// surface while reporting that it had read it all.
//
// WHAT IS STILL GLOSSARY-ONLY, and why. `headword-and-year` needs the entry's
// own headword to compare against, and outside the glossary there is no single
// field that plays that role. It is therefore applied to scope 1 only, and that
// is a stated limit rather than a silent one.
//
// THE SCOPE IS STILL ASSERTED. Section 3c measures label-only citation objects
// outside the glossary and fails if any appear, because a label with no url is
// a surface no amount of pattern work reaches. That assertion is now about
// STYLE rather than completeness: it keeps citations pointing somewhere.
// Section 3d asserts that every field the guard believes it read, it read.
//
// WHAT THIS GUARD CANNOT SEE, stated rather than left to be discovered. Two real
// faults found on the same day are not mechanically detectable and are NOT caught
// here:
//   * `googol` cites "History of Google - the name as a misspelling of googol",
//     which names a TOPIC rather than a document.
//   * `winrar-licence`'s second source is "Two decades of public commentary
//     treating the expired-but-working trial as a running joke", which is an
//     observation about the world.
// No pattern separates those from a real short title. They are recorded in canon
// AUDIT-lore-sources-without-links-20260930.md instead.
//
// WHERE IT LANDED, the same day. Six of the nine were paid down, which is why the
// declared list is shorter than the finding above:
//   sloth     -> Bhargavan & Leurent, NDSS 2016. The paper also corrected our own
//                copy: it expands the acronym as "security losses from obsolete and
//                truncated transcript hashes", where the entry's `depth` said
//                "truncated hash constructions" in BOTH locales while its `context`
//                had it right. Two fields of one entry disagreeing is what exposed it.
//   wannacry  -> Microsoft MS17-010 (14 March 2017) and CVE-2017-0144. Partial, and
//                the label says so: the bulletin predates the outbreak, which is what
//                supports "patched roughly two months before".
//   3com      -> 3Com's own Form 8-K of 27 February 1997, which carries the $6.6
//                billion figure AND its basis, the closing price on 25 February, plus
//                the 1.75 exchange ratio that does not move with the share price.
//   f5        -> F5's Form 424B4 of 4 June 1999: "incorporated on February 26, 1996
//                in the State of Washington". The tornado-name story is in no filing.
//   lineages/f5 -> F5's FY2014 10-K. It carries TWO figures, $49.4M cash in MD&A and
//                $49.7M consideration in the business-combination note, so both are
//                recorded rather than leaving one to be "corrected" into the other.
//   pulse-secure -> NetScreen's 8-K of 17 November 2003 and the Juniper/NetScreen
//                8-K of 16 April 2004. Neither names the Instant Virtual Extranet,
//                and the note says so.
//
// DECLARED BY EXACT TEXT, which is unusual here and deliberate. Every other
// declared list in this chain keys on a stable identifier - a slug, a route, a
// path, a sorted slug pair - because a key built from content churns. These items
// have no identifier: a `sourceNote` is an anonymous string on a timeline entry.
// Its text IS its identity, so the text is the key. The gain is that a SWAP is
// fully visible: new offending text is undeclared and fails, and declared text
// that is gone is stale and fails. A path-and-count key could not see one
// placeholder replaced by another in the same file.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const GLOSSARY = path.join(SRC, "content", "glossary", "glossary.ts");

// ---- 1. the faults ---------------------------------------------------------

// An appeal to ubiquity: the claim is cited to the fact that it is well known.
//
// TWO REFINEMENTS, EACH FROM THE CONTENT RATHER THAN FROM GUESSWORK.
//
// First, "widely reported" was NOT in the first draft of this pattern, and three
// real instances use it - two of them attached to dollar figures. Asking the
// corpus which phrasings it actually uses found them.
//
// Second, and more important: the phrase is only a fault when it occupies the
// PROVENANCE SLOT. src/content/vendors/profiles/akamai.ts carries a sourceNote
// that names three real documents - Akamai's memorial page, the Marconi Society
// citation, contemporary CNN reporting - and then says of a further claim that it
// "is widely reported to have attempted to stop the hijacking; that account rests
// on flight-recorder analysis and is not established". There the phrase DISCLAIMS
// a claim, which is the opposite of citing ubiquity as provenance, and the first
// draft of this guard flagged it. That was the first time in this session's run of
// instrument-versus-content findings that the instrument was too BROAD.
//
// So the phrase must be doing the citing: sentence-initial, or introduced by "as"
// or "per", or followed by "at"/"in"/"by" naming where it was reported. All five
// real faults match; "widely reported TO have" does not.
const UBIQUITY = new RegExp(
  [
    // Sentence-initial, i.e. the note opens by saying the fact is well known.
    String.raw`(?:^|[.;]\s+)(?:widely|well)\s+(?:documented|reported|known)\b`,
    // Introduced as the provenance: "as widely reported", "per the widely documented".
    String.raw`\b(?:as|per)\s+(?:the\s+)?(?:widely|well)\s+(?:documented|reported|known)\b`,
    // Followed by where: "widely reported at $49.4M", "widely reported in company histories".
    String.raw`\b(?:widely|well)\s+(?:documented|reported|known)\s+(?:at|in|by)\b`,
    // Flat appeals, which are never anything but provenance.
    String.raw`\bcommon\s+knowledge\b`,
    String.raw`\bas\s+is\s+well\s+known\b`,
  ].join("|"),
  "i"
);

// A bare "Documented" standing in for a citation, alone or as the opening clause.
const BARE_DOCUMENTED = /^\s*documented\b/i;

// A citation label that is nothing but a field name and a bare number. The 22
// real instances were all `Founding year: NNNN` in partners.ts, every one of
// them pointing at a Wikipedia article: the reader is told a year and handed a
// page, with nothing saying where in the page the year sits or what else the
// page establishes. Nine of the 22 duplicated a url the same entry already
// cited with a label that carried the claim; the other thirteen were the ONLY
// citation of that year, so they were rewritten from the page rather than
// deleted (PRIME, 2026-09-27: a fact is not deleted for want of a source).
//
// THE VALUE MUST BE ONLY A NUMBER. That is what keeps legitimate labels out:
// "Fortinet newsroom: Q3 2024 results" has words after the colon and so names
// something in the page. Tested against all 4391 labels in the tree before
// being installed, and against four labels it MUST flag and four it must not,
// because a pattern that cannot fail proves nothing.
const BARE_FIELD = /^\s*[A-Za-z][A-Za-z ]{0,24}\s*[:\u2013-]\s*(?:c\.?\s*)?\d{3,4}\s*$/;

/** Normalise text for the headword comparison: case and punctuation out. */
function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Does this label just restate the entry's own name plus a year? A citation that
 * says "NotPetya (2017)" on the NotPetya entry points at nothing. One generic
 * noun is allowed into the comparison because "SLOTH attack (2016)" is the same
 * fault as "SLOTH (2016)". A year is REQUIRED: without one, a short label
 * matching the headword is more likely to be a genuine work title.
 */
function isHeadwordAndYear(label, headword) {
  if (!/\(\s*\d{4}[^)]*\)\s*$/.test(label)) return false;
  const bare = norm(label.replace(/\s*\([^)]*\)\s*$/, ""));
  const hw = norm(headword);
  if (!hw) return false;
  return [hw, `${hw} attack`, `${hw} worm`, `${hw} virus`, `${hw} bug`, `${hw} incident`].includes(bare);
}

/** Classify one citation string. Returns a fault name, or null if it is fine. */
function faultOf(text, headword) {
  if (UBIQUITY.test(text)) return "appeal-to-ubiquity";
  if (BARE_DOCUMENTED.test(text)) return "bare-documented";
  if (BARE_FIELD.test(text)) return "bare-field-and-number";
  if (headword && isHeadwordAndYear(text, headword)) return "headword-and-year";
  return null;
}

/**
 * Every citation label in one file: a `label` that shares an object literal
 * with a `url` or `href`. Brace-matched forward from the label rather than
 * read line by line, because 329 citation objects in the tree spread their
 * fields over several lines and a line reader silently drops them.
 *
 * Returns [{ label, line }]. A label with no url in its own object is NOT a
 * citation by this definition and is left to section 3c, which forbids them.
 */
function citationLabelsIn(text) {
  const out = [];
  for (const m of text.matchAll(/label:\s*"((?:[^"\\]|\\.)*)"/g)) {
    // Walk forward from the end of the label to the close of its own object,
    // tracking depth so a nested object cannot end the scan early.
    let depth = 0;
    let end = -1;
    for (let i = m.index + m[0].length; i < text.length; i++) {
      const c = text[i];
      if (c === "{" || c === "[") depth += 1;
      else if (c === "]") depth -= 1;
      else if (c === "}") {
        if (depth === 0) { end = i; break; }
        depth -= 1;
      }
    }
    if (end < 0) continue;                       // unterminated: not a citation
    const body = text.slice(m.index, end);
    if (!/(?:url|href):\s*"/.test(body)) continue;
    out.push({
      label: m[1].replace(/\\"/g, '"'),
      line: text.slice(0, m.index).split("\n").length,
    });
  }
  return out;
}

// ---- 2. the declared list --------------------------------------------------

// Each key is `<where>|<exact offending text>`. `<where>` is the glossary slug or
// the repo-relative file path, which is what a reader needs to find it. The value
// is why it is still here. The list MAY ONLY SHRINK: a declaration whose text is
// gone fails as stale, so it cannot quietly outlive its subject.
const DECLARED = new Map([
]);

// ---- 3. collect every citation string in scope -----------------------------

const errors = [];
const found = new Set(); // keys actually present, for the stale-declaration half
// Every glossary label this guard actually reached, so section 3d can prove that
// the ones it did not reach are explainable rather than invisible.
const readGlossaryLabels = new Set();
let glossaryLabels = 0;
let sourceNotes = 0;

// 3a. Glossary `sources[].label`, via the same chunker check-glossary uses. That
// guard asserts the chunker parsed every entry, so a fragment cannot hide a label
// from this one either.
const gsrc = fs.readFileSync(GLOSSARY, "utf8");
const gbody = gsrc.slice(gsrc.indexOf(": GlossaryEntry[] = ["));
const chunks = gbody.split(/\n\s*\{\s*\n/).slice(1);
for (const chunk of chunks) {
  const slug = chunk.match(/slug:\s*"([^"]+)"/)?.[1];
  if (!slug) continue;
  const headword = (chunk.match(/headword:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "").replace(/\\"/g, '"');
  // The entry's sources block, single-line or multi-line (multi-line is banned by
  // check-glossary's own assertion, but this reader does not depend on that).
  const block = chunk.match(/sources:\s*\[[\s\S]*?\],/)?.[0];
  if (!block) continue;
  for (const m of block.matchAll(/label:\s*"((?:[^"\\]|\\.)*)"/g)) {
    glossaryLabels += 1;
    const label = m[1].replace(/\\"/g, '"');
    readGlossaryLabels.add(m[1]);   // as written, for the coverage assertion below
    const fault = faultOf(label, headword);
    if (!fault) continue;
    const key = `${slug}|${label}`;
    found.add(key);
    if (!DECLARED.has(key)) {
      errors.push(
        `"${slug}": source label names no work (${fault}): ${JSON.stringify(label)}. ` +
          `Cite a document, or add the exact text to DECLARED with the reason it cannot be cited.`
      );
    }
  }
}

// 3b. Every `sourceNote` in the tree. A by-name citation field, so no context
// tracking is needed to know what it is.
/** Every .ts file under src, so no directory is quietly out of scope. */
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith(".ts")) out.push(p);
  }
  return out;
}
const files = walk(SRC);
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/sourceNote:\s*"((?:[^"\\]|\\.)*)"/g)) {
    sourceNotes += 1;
    const note = m[1].replace(/\\"/g, '"');
    // No headword applies to a sourceNote, so the headword fault cannot fire here.
    const fault = faultOf(note, null);
    if (!fault) continue;
    const key = `${rel}|${note}`;
    found.add(key);
    if (!DECLARED.has(key)) {
      errors.push(
        `${rel}: sourceNote cites no document (${fault}): ${JSON.stringify(note)}. ` +
          `Cite a document, or add the exact text to DECLARED with the reason it cannot be cited.`
      );
    }
  }
}

// 3b2. EVERY CITATION LABEL OUTSIDE THE GLOSSARY, added 2026-10-01. The header
// says why this was not here before and what the omission cost. `headword` is
// null: outside the glossary no field plays that role, so headword-and-year
// cannot fire here and that limit is stated rather than silent.
let outsideLabels = 0;
for (const file of files) {
  if (path.resolve(file) === path.resolve(GLOSSARY)) continue;
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  for (const { label, line } of citationLabelsIn(text)) {
    outsideLabels += 1;
    const fault = faultOf(label, null);
    if (!fault) continue;
    const key = `${rel}|${label}`;
    found.add(key);
    if (!DECLARED.has(key)) {
      errors.push(
        `${rel}:${line}: citation label names nothing in the page it points at (${fault}): ` +
          `${JSON.stringify(label)}. Say what the document establishes, or add the exact text ` +
          `to DECLARED with the reason it cannot be said.`
      );
    }
  }
}

// THE SCOPE HAS A FLOOR, so it cannot quietly shrink back to where it was. A
// scope is the one thing a guard cannot measure about itself: every check here
// could pass while reading half the corpus, which is exactly what happened
// before 2026-10-01. The count below may only be RAISED. If a refactor moves
// citations into a shape `citationLabelsIn` does not recognise, this fails and
// names the shortfall instead of reporting a green run over a smaller corpus.
const MIN_OUTSIDE_LABELS = 2701;   // raised 2026-10-02 from 2691 as citations were added. May only be raised.
if (outsideLabels < MIN_OUTSIDE_LABELS) {
  errors.push(
    `this guard read ${outsideLabels} citation label(s) outside the glossary, below the floor of ` +
      `${MIN_OUTSIDE_LABELS}. Either citations were removed (lower the floor in the same commit ` +
      `and say why) or they were moved into a shape citationLabelsIn no longer recognises, in ` +
      `which case the scope shrank silently and every zero above is a zero over a smaller corpus.`
  );
}

// WHAT THIS SCOPE DELIBERATELY DOES NOT CATCH, stated so the next reader does
// not assume it was missed. Two real faults found on 2026-10-01 are matters of
// judgement and would be WRONG as mechanical rules:
//
//   * A url cited twice in one entry. 50 groups exist across 48 entries, and a
//     sample of four showed the split is roughly even: telebras-system cites
//     Law 5.792 of 11 July 1972 for one fact and the twelve regional companies
//     for another, and nv7 cites one page for solution lines and client logos.
//     Those are one document supporting two claims, which is correct practice.
//     tenable quoted the SAME S-1 sentence twice, from reads three days apart.
//     A guard failing on a repeated url would have punished the right behaviour
//     about half the time, so the 10 redundant groups were merged by hand and
//     the 40 distinct-claim groups left alone. Recorded as an audit, not a rule.
//
//   * Wikipedia's own short description used as a label ("Barracuda Networks -
//     American software company (Wikipedia)"). 18 existed; all 18 sat in an
//     entry that already cited that page for a claim, and 15 also duplicated
//     the entry's own externalUrl, which is the field that exists to say "go
//     read the page". They were removed. But the same label is LEGITIMATE when
//     it is an entry's only citation of a page, as further reading, so a guard
//     on the form would be wrong. Judgement, not pattern.
//
// Url identity is also string-based wherever it is measured, and that cannot
// see a redirect pair: proofpoint cited /wiki/Proofpoint and
// /wiki/Proofpoint,_Inc., which the MediaWiki API confirmed on 2026-10-01 to be
// one page (pageid 17815480). Any count of repeated urls therefore UNDERCOUNTS.

// 3c. THE SCOPE ASSERTION. Since 3b2 reads citation labels tree-wide, this is
// no longer the argument for completeness that it was. It remains worth
// enforcing for a different reason: a label with no url points nowhere, so no
// amount of pattern work can make it checkable. Measured, not assumed.
let labelOnlyOutside = 0;
const labelOnlyWhere = [];
for (const file of files) {
  if (path.resolve(file) === path.resolve(GLOSSARY)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/\{\s*label:\s*"(?:[^"\\]|\\.)*"\s*\}/g)) {
    labelOnlyOutside += 1;
    if (labelOnlyWhere.length < 5) {
      labelOnlyWhere.push(`${path.relative(ROOT, file)}: ${m[0].slice(0, 90)}`);
    }
  }
}
if (labelOnlyOutside > 0) {
  errors.push(
    `${labelOnlyOutside} citation object(s) outside the glossary carry a label with no url, ` +
      `which is a surface this guard does not read. Either give them a url, or widen the scope ` +
      `above and say so in the header. First: ${labelOnlyWhere.join(" | ")}`
  );
}

// ---- 3d. THE COVERAGE ASSERTION ---------------------------------------------
//
// Both counts above look short against a naive grep, and that gap must be
// explained by the guard rather than by whoever next reads its output:
//
//   * glossary.ts holds 1145 `label:` occurrences and this guard reads 1144. The
//     odd one is the TYPE DECLARATION `label: string;` in the GlossarySource
//     interface, which sits above the array body.
//   * the tree holds 379 `sourceNote:` occurrences and this guard reads 377. The
//     two others are the words "sourceNote:" inside FILE-HEADER COMMENTS in
//     src/lib/practice.ts and src/lib/roles.ts, both explaining the convention.
//
// Each unread occurrence must fall into one of those two explainable shapes. Any
// other is a citation field this guard cannot see, which is a blind spot and fails.
const unexplained = [];

// Glossary: an unread `label:` is acceptable only before the array body begins
// (where the interface lives) or when it is a type annotation rather than a value.
const bodyStart = gsrc.indexOf(": GlossaryEntry[] = [");
for (const m of gsrc.matchAll(/label\s*:/g)) {
  const isValue = /label\s*:\s*"/.test(gsrc.slice(m.index, m.index + 40));
  if (!isValue) continue;                       // a type annotation, not a citation
  if (m.index < bodyStart) continue;            // the interface, above the corpus
  // Every `label: "..."` inside the body must have been read. Locate it in the
  // text already collected rather than re-deriving offsets: a label the reader
  // reached appears verbatim in readGlossaryLabels.
  const text = gsrc.slice(m.index).match(/label\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
  if (text !== undefined && !readGlossaryLabels.has(text)) {
    const line = gsrc.slice(0, m.index).split("\n").length;
    unexplained.push(`src/content/glossary/glossary.ts:${line}: a source label this guard did not read: ${JSON.stringify(text.slice(0, 80))}`);
  }
}

// sourceNote: an unread occurrence is acceptable only inside a comment.
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/sourceNote\s*:/g)) {
    if (/sourceNote\s*:\s*"/.test(text.slice(m.index, m.index + 40))) continue; // read above
    if (/sourceNote\s*:\s*(?:string|\?)/.test(text.slice(m.index, m.index + 40))) continue; // a type
    const lineStart = text.lastIndexOf("\n", m.index) + 1;
    const line = text.slice(lineStart, m.index);
    if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) continue;  // prose in a comment
    const n = text.slice(0, m.index).split("\n").length;
    unexplained.push(`${rel}:${n}: a sourceNote this guard could not read`);
  }
}
if (unexplained.length > 0) {
  errors.push(
    `${unexplained.length} citation field(s) in scope that this guard did not read - a blind spot, ` +
      `not a pass: ${unexplained.slice(0, 5).join(" | ")}`
  );
}

// ---- 4. the stale half -----------------------------------------------------

// A declaration whose text is no longer present has been fixed or rewritten, and
// must come off so the list can only shrink. Without this the list accumulates
// entries that describe nothing - the rot every declared list here is written
// against, and the exact gap a negative test found in check-glossary rule 5b on
// 2026-09-30.
for (const key of DECLARED.keys()) {
  if (!found.has(key)) {
    const [where, ...rest] = key.split("|");
    errors.push(
      `DECLARED lists ${JSON.stringify(rest.join("|"))} for "${where}", which is no longer ` +
        `present - remove it from the list.`
    );
  }
}

// ---- 5. report -------------------------------------------------------------

if (errors.length > 0) {
  console.error("[check-placeholder-sources] FAIL:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const kinds = new Map();
for (const key of DECLARED.keys()) {
  const kind = key.includes("/") ? "sourceNote" : "glossary label";
  kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
}
console.log(
  `[check-placeholder-sources] OK: ${glossaryLabels} glossary source label(s) and ${sourceNotes} ` +
    `sourceNote(s) checked for four faults (appeal to ubiquity, bare "Documented", a bare field ` +
    `name plus a number, and the entry's own name plus a year - the last of these glossary-only, ` +
    `because no field outside the glossary plays the headword role); ` +
    `${DECLARED.size} declared with a reason` +
    // At zero the parenthetical would be empty, which printed "(, may only shrink)" on
    // 2026-10-01 the moment the last declaration came off. A guard whose own output is
    // malformed in its best state is a guard nobody reads carefully in that state.
    (DECLARED.size > 0
      ? ` (${[...kinds].map(([k, n]) => `${k} ${n}`).join(", ")}, may only shrink)`
      : ` (ENFORCED AT ZERO since 2026-10-01: every placeholder citation in the corpus was replaced with a document)`) +
    `; ${outsideLabels} citation label(s) outside the glossary also read, tree-wide since ` +
    `2026-10-01 (before that the scope excluded them and the zero was true of the scope, not the ` +
    `corpus: 22 real faults sat in partners.ts); ${labelOnlyOutside} label-only citation(s) outside ` +
    `the glossary, enforced at zero because a label with no url points nowhere. ` +
    `Every citation field in scope was read: ` +
    `of the 1153 glossary labels, 1032 carry a link and 121 are label-only, which is permitted inside the glossary and is why the chunker figure exceeds a link-based count; the remaining "label:" occurrence is the GlossarySource type declaration and the remaining ` +
    `two "sourceNote:" occurrences are prose in file-header comments.`
);
