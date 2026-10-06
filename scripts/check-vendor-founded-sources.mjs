#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// check-vendor-founded-sources — WHERE DID THE YEAR ON /industry COME FROM?
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-09-30 PRIME asked, of https://ronutz.com/en/people/,
// "where came the year attributed to each person from?" That question produced
// check-person-year-sources, which found 88 of 148 `personYear` values named by
// no source on their own entry.
//
// *** NOBODY ASKED THE SAME QUESTION ONE FIELD OVER. *** `founded` is hand-set
// on 337 of 338 vendor entries and is rendered publicly: twice on
// /industry/[slug], again on the /industry index, and the index SORTS by it. It
// is a claim on a public page exactly as `personYear` is. On 2026-10-01 a sweep
// of the queue canon tested it for the first time:
//
//   85 of 337 founding years are named by NO source label or sourceNote on the
//   entry that carries them. Of those 85, the entry's own copy states 53 and
//   states NOTHING for 32 - a number shown to the public and sorted on, which
//   no sentence anywhere on the site asserts.
//
// The gap survived because QUEUE-founding-dates.md (2026-08-13) tracked the
// PRESENCE of years, not their CITATION. Its table reports "still missing 15"
// (a later heading in the same file says 45); the real figure today is ONE,
// `sisco`. The queue closed its own question and never asked the next one.
//
// *** WHY A DECLARED LIST PER SLUG AND NOT A COUNT. *** A bare "85 uncited years
// tolerated" cannot say WHICH 85, so it tolerates the eighty-sixth equally, and
// it cannot see a SWAP: one new vendor arrives uncited as one old one gets a
// dated citation, and the total never moves. Declared per slug, both halves of
// that swap fail - the newcomer as undeclared, the fixed entry as a stale
// declaration that no longer matches reality.
//
// *** WHY EACH DECLARATION CARRIES A CATEGORY AND A TESTED REASON. *** One
// reason repeated 85 times is the bare count again, wearing prose. Each year
// was tested against three separate facts, and only the third needs the
// network:
//
//   COPY-ONLY   the entry's own copy states the year; no cited page does.
//   COPY+PAGE   the copy states it AND a cited page carries it; only the
//               citation LABEL fails to say so, which is the cheapest class.
//   PAGE-ONLY   a cited page carries it; the entry's copy does not.
//   NEITHER     no label, no cited page, no entry copy. The year exists only in
//               the `founded` field and on the rendered page.
//   CONTRADICTED the cited page states a DIFFERENT year. Not a gap - a conflict.
//
// *** WHAT THE TEST FOUND THAT A COUNT NEVER WOULD. *** access-home-fleet
// carries `founded: 1987`, and the only Wikipedia article it cites is Netgear,
// whose infobox reads `founded = 8 January 1996`. The entry's one citable page
// CONTRADICTS the entry's year. This is the same class as Hughes's 1971
// belonging to Digital Communications Corp rather than to Hughes Network
// Systems, found hours earlier the same day: a year that is real but belongs to
// a different entity than the page describes. No count of missing citations
// could surface it, because the citation is not missing.
//
// *** WHY NOT JUST APPEND THE YEAR TO A LABEL. *** Because that is what the
// corpus did before, and it was wrong. QUEUE-founding-dates.md established the
// convention of appending `Founding year: NNNN` with the article it came from,
// and 22 entries carried it. On 2026-10-01 all 22 were removed: a label naming
// a datum and pointing at an article names nothing IN that article, which is
// precisely the fault check-placeholder-sources exists to catch, and that guard
// now fails on the form (`bare-field-and-number`). The correct fix is to state
// the year INSIDE a substantive label, as
// "Wikipedia: Capgemini - founded 1 October 1967 by Serge Kampf" does. This
// guard at first accepted a year named anywhere in a label or sourceNote; on
// 2026-10-02 it was narrowed to LABELS alone, because a note often names a
// year only to say it is NOT supported (the reasoning sits beside the test,
// below). check-placeholder-sources independently forbids the bare form. Two
// guards, one standard, and neither can be satisfied by defeating the other.
//
// *** THE RULE THAT GOVERNS THE PAYDOWN. *** PRIME, 2026-09-27:
// "A FACT IS NOT DELETED FOR WANT OF A SOURCE." An uncited year is declared and
// researched, never silently dropped, and never replaced by a vaguer claim.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PARTNERS = path.join(ROOT, "src", "content", "vendors", "partners.ts");

// ---- the declared list -----------------------------------------------------
//
// Keyed by slug. `year` is the value declared, so that CHANGING the year
// invalidates the declaration and forces a re-test rather than inheriting an
// old verdict. `why` is the tested category above. THE LIST MAY ONLY SHRINK:
// a declaration whose entry now names its year fails as stale.
//
// Reasons say WHAT WAS TRIED, not what was concluded. A category is only
// written here after the three tests were actually run for that slug.

// THE CATEGORIES, each the result of running the tests - not a guess. The
// counts in brackets are the 2026-10-01 sweep's, 85 in all; the guard prints
// the live breakdown on every run, and the DECLARED list below is what is left.
// DERIVED (proof, olitel) is explained where the label test is, further down.
//
//   NEITHER (13)               the year is stated NOWHERE on the site: not in a
//                              citation, not in the entry copy, not in the
//                              vendor profile. It exists only in the `founded`
//                              field and on the rendered, sorted page.
//   (NEITHER reached ZERO on 2026-10-02. The last three - niva, nv7, multiplus -
//    were settled through the federal tax registry, which needs a CNPJ, and
//    the route to each CNPJ is worth keeping: niva's had been supplied by PRIME
//    on 2026-08-06 and sat unread in a code comment beside the field; nv7 names
//    its own CNPJ as data controller in its privacy notice; multiplus's was
//    found by search and accepted only because the registry address matched
//    the office on the company's own home page. A name match alone was never
//    accepted: 26 same-named registry entries were tested and rejected.)
//   RULED-OVER-SOURCE          the site and the page it cites disagree, and PRIME has
//                              ruled which stands. The year is therefore settled but
//                              still not NAMED by a citation, so it stays declared:
//                              the declaration records a decision, not a gap.
//                              silicon-graphics 1982 against the article's
//                              9 November 1981, ruled 2026-10-02; cleared on
//                              2026-10-06 when a label named 1982 (see the list).
//   SITE-DISAGREES-SOURCE (1)  the site states the year consistently and the
//                              page it cites states a DIFFERENT one. Recorded
//                              as a discrepancy rather than silently resolved,
//                              the way tenable's 16 September against 4 October
//                              is recorded. That one was silicon-graphics;
//                              PRIME ruled on 2026-10-02, see RULED-OVER-SOURCE.
//   LINEAGE-ROOT (5)           the entry covers several companies and `founded`
//                              is deliberately the OLDEST one's year, which the
//                              copy or profile explains, while the cited page is
//                              about a LATER member. The mechanical test calls
//                              these contradictions; reading shows the page
//                              differs because it is about a different company.
//   COPY-ONLY (26)             the entry's own copy states it; no cited page does.
//   PROFILE-ONLY (8)           only the vendor PROFILE states it. A copy test that
//                              read partners.ts alone called 19 of these unstated.
//   COPY+PAGE (24)             copy states it AND a cited page carries it, verified
//                              by fetching that page. Only the LABEL fails to say
//                              so, which makes these the cheapest to pay down.
//   PROFILE+PAGE (8)           same, with the profile rather than the entry copy.
//
// *** WHY "LINEAGE-ROOT" HAD TO BECOME ITS OWN CATEGORY. *** The page test
// returned MISMATCH for 8 entries. Reading them turned 5 into deliberate,
// explained choices: unisys 1886 is Burroughs ("Burroughs began in 1886 with an
// adding machine", said three times in its own copy) against a Unisys article
// that dates the merged company to 1986; access-home-fleet 1987 is Allied
// Telesis; cyclades-avocent-vertiv 1965 is the Liebert root;
// bell-labs-lucent-alcatel 1898 is Alcatel's; sniffer-lineage 1984 is Frontier
// Software, NetScout's origin. A mechanical verdict here is a FLAG TO READ, not
// a finding, and reading reversed it 5 times out of 8.
//
// *** WHAT THE SWEEP FIXED RATHER THAN DECLARED. ***
// cyclades-avocent-vertiv said "founded in 1988 in a São Paulo garage" in its
// intro and "the 1989 Brazilian founding" in its body, on the same public page,
// while its profile said 1988 three times. The body was corrected to 1988
// against the entry's own evidence - the same shape as adiel-akplogan's
// personYear 2004 against copy and a cited page that both said 2003.
const DECLARED = new Map([
  // DERIVED, added 2026-10-02 after the year test was narrowed to labels. These
  // are two of the three entries (prolan, proof, olitel) that had been passing
  // on a sourceNote saying the year was unsupported; prolan has since been cited
  // from its federal tax registry record (1991) and came off.
  ["proof", { year: 2009, why: "DERIVED" }],
  ["olitel", { year: 1981, why: "DERIVED" }],

  // NEITHER (0) - every year that nothing stated has now been researched

  // RULED-OVER-SOURCE (0) - silicon-graphics was declared here from 2026-10-02 (PRIME's ruling that 1982 stands
  // against the article's 9 November 1981) until 2026-10-06, when the Works written for the entry cited the
  // same article's sentence that Clark LEFT STANFORD TO FOUND SGI IN 1982 beside its November 1981 founding
  // date, so a label now names the year the site carries and the declaration became stale. Both figures
  // remain on the record; the entry's body says which is which.

  // LINEAGE-ROOT (4)
  ["access-home-fleet", { year: 1987, why: "LINEAGE-ROOT" }],
  ["bell-labs-lucent-alcatel", { year: 1898, why: "LINEAGE-ROOT" }],
  ["cyclades-avocent-vertiv", { year: 1965, why: "LINEAGE-ROOT" }],
  ["sniffer-lineage", { year: 1984, why: "LINEAGE-ROOT" }],

  // 2026-10-02: 64 declarations came off in one session. 38 in one pass, every
  // year verified against the live Wikipedia infobox and cited with the year in
  // the label - where the entry already cited that article its label was
  // tightened rather than a second copy of the url added. The rest one at a time
  // from first-party records: SEC filings for rapid7, arista, riverstone, red-hat
  // and lumen; the companies' own pages for paessler, datacom, zyxel and aws;
  // W3C's archive of the 1989 proposal for http-gopher. PROFILE-ONLY, PROFILE+PAGE
  // and COPY+PAGE are now empty.

  // COPY-ONLY (1)
  // tdec - tried 2026-10-02: tdec.com.br says only "Mais de 30 anos" (no year);
  // its registry entry, TDEC REDES DE COMPUTADORES LTDA, CNPJ 06.093.568/0001-80,
  // opened 22/01/2004, a later registration that neither confirms nor refutes
  // 1992; Baguete's 2010-2011 profiles of the company carry no founding year.
  ["tdec", { year: 1992, why: "COPY-ONLY" }],
]);

// THE DECLARED LIST MUST NOT CONTAIN A SLUG TWICE. A Map literal keeps the LAST
// of any duplicate key and reports nothing, so two declarations for one slug
// silently become one and the losing verdict vanishes. That happened on
// 2026-10-02: prolan was declared SITE-DISAGREES-SOURCE after research while an
// older NEITHER line sat further down, and the older one won. Counted from the
// source text, because by the time the Map exists the evidence is gone.
{
  const declSrc = fs.readFileSync(new URL(import.meta.url), "utf8");
  const block = declSrc.slice(declSrc.indexOf("const DECLARED = new Map(["));
  const keys = [...block.slice(0, block.indexOf("\n]);")).matchAll(/^\s*\["([^"]+)",/gm)].map((m) => m[1]);
  const seen = new Set();
  const twice = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
  if (twice.length > 0) {
    console.error("[check-vendor-founded-sources] FAIL:");
    console.error(
      `  - ${[...new Set(twice)].join(", ")} declared more than once. A Map keeps only the last, ` +
        `so one verdict was silently discarded. Keep exactly one declaration per slug.`
    );
    process.exit(1);
  }
}

// ---- read the entries ------------------------------------------------------
//
// partners.ts is parsed from source rather than imported, so this guard stays a
// plain node script with no build step, like its sibling. Entries are split on
// the `slug:` line at its known indentation, and the split is ASSERTED below:
// check-glossary learned on 2026-10-01 that a chunker which silently drops part
// of its input makes every check over it vacuous.
const src = fs.readFileSync(PARTNERS, "utf8");
const lines = src.split("\n");

const entries = [];
let cur = null;
for (let i = 0; i < lines.length; i++) {
  const m = /^    slug: "([^"]+)",$/.exec(lines[i]);
  if (m) {
    if (cur) cur.end = i;
    cur = { slug: m[1], start: i, end: lines.length };
    entries.push(cur);
  }
}
if (cur) cur.end = lines.length;

const errors = [];

// THE CHUNKER ASSERTION. Every `founded:` in the file must fall inside some
// entry's span. A `founded:` outside one means the splitter missed an entry,
// and every verdict below would be computed over a short corpus.
let foundedTotal = 0;
let foundedPlaced = 0;
for (let i = 0; i < lines.length; i++) {
  if (!/^\s{4}founded: \d+,$/.test(lines[i])) continue;
  foundedTotal += 1;
  if (entries.some((e) => i > e.start && i < e.end)) foundedPlaced += 1;
}
if (foundedTotal !== foundedPlaced) {
  errors.push(
    `the entry splitter placed ${foundedPlaced} of ${foundedTotal} "founded:" lines inside an ` +
      `entry. The ${foundedTotal - foundedPlaced} outside mean an entry boundary was missed, and ` +
      `every verdict below would be computed over a short corpus.`
  );
}

// ---- classify every entry that carries a founded year ----------------------
const found = new Set();
let withYear = 0;
let named = 0;
const undeclared = [];

for (const e of entries) {
  const body = lines.slice(e.start, e.end).join("\n");
  const ym = /^\s{4}founded: (\d{3,4}),$/m.exec(body);
  if (!ym) continue;
  withYear += 1;
  const year = Number(ym[1]);

  // Does any citation LABEL on this entry name the year?
  //
  // *** WHY LABELS AND NOT sourceNote. *** The first version of this check read
  // both, on the reasoning that a year anywhere in the citation text counts. It
  // does not, and the corpus proved it the same day: a sourceNote often mentions
  // a year precisely in order to say it is NOT supported. All three entries that
  // carried their year ONLY in a sourceNote were of that kind -
  //
  //   prolan  "THIS CONTRADICTS the 1994 the entry carries"
  //   proof   "This year is DERIVED, not stated: fifteen years of operation as
  //            of 17 April 2024 places the start in or about 2009"
  //   olitel  "43 years on the site and 44 in a 2025 anniversary post, implying
  //            a founding around 1981-82 ... therefore approximate"
  //
  // - so reading sourceNotes let a disclaimer satisfy the check, and the more
  // carefully a note recorded that a year was unsupported, the more certainly it
  // would be counted as supported. That is the akamai false positive in reverse:
  // text ABOUT a claim read as the claim.
  //
  // A LABEL says what the document establishes; a sourceNote is commentary on
  // provenance. So the year must appear in a label. Measured before changing:
  // 259 entries were named by a label and exactly 3 by a note alone, and all
  // three of those were disclaimers.
  const citation = [
    ...body.matchAll(/label:\s*"((?:[^"\\]|\\.)*)"/g),
  ]
    .map((m) => m[1])
    .join(" ");
  if (citation.includes(String(year))) {
    named += 1;
    continue;
  }

  const d = DECLARED.get(e.slug);
  if (d && d.year === year) {
    found.add(e.slug);
    continue;
  }
  if (d && d.year !== year) {
    errors.push(
      `"${e.slug}": declared with founded ${d.year} but the entry now says ${year}. A changed ` +
        `year invalidates the declaration - re-test it and declare the new one, or cite it.`
    );
    found.add(e.slug);
    continue;
  }
  undeclared.push(`${e.slug} (${year})`);
}

if (undeclared.length > 0) {
  errors.push(
    `${undeclared.length} vendor entry(ies) carry a founded year that no citation label ` +
      `on the entry names: ${undeclared.join(", ")}. ` +
      `State the year inside a substantive citation label (NOT as a bare "Founding year: NNNN", ` +
      `which check-placeholder-sources forbids), or add the slug to DECLARED with the tested ` +
      `category. PRIME 2026-09-27: a fact is not deleted for want of a source.`
  );
}

// THE STALE HALF. A declaration whose entry now names its year has done its job
// and must come off, or the list stops describing reality.
const stale = [...DECLARED.keys()].filter((s) => !found.has(s));
if (stale.length > 0) {
  errors.push(
    `${stale.length} declaration(s) no longer match an uncited year and must be removed: ` +
      stale.map((s) => `${s} (${DECLARED.get(s).why})`).join(", ")
  );
}

// ---- RULING 2: WHOSE FOUNDING YEAR IS THIS ---------------------------------
//
// PRIME, 2026-10-02: "founding should be of the entry itself. Ancestor founding
// should be made explicit what it is."
//
// That superseded the rule in force since 2026-07-27, under which `founded` on a
// combined-lineage card was "the EARLIEST company in the story". A card named
// for one company could therefore display, and sort by, a predecessor's year
// with nothing on the page saying so. `unisys` showed 1886 - Burroughs - while
// its OWN PROFILE declared Unisys as founded 1986, so the site contradicted
// itself on a public page.
//
// WHAT IS ENFORCED. A vendor profile declares `foundings: [{ company, year }]`,
// which is the authoritative statement of which companies a card covers and when
// each began. Where a card declares two or more and its `founded` is not the year
// of the company the card is NAMED for, `foundedCompany` must say whose year it
// is, and must name a company the profile actually declares for that year.
//
// AND THE CONVERSE, which matters as much: `foundedCompany` must be ABSENT where
// `founded` IS the card's own subject's year. Its presence is the signal that the
// year belongs to someone else, and a signal set everywhere signals nothing.
//
// WHY THIS IS NOT A YEAR-CORRECTNESS CHECK. On a card that is explicitly a
// lineage of several companies - "Nortel & Bay Networks", "The access & home
// fleet", "DNS & BIND" - there is no single "own" subject whose year `founded`
// could be, so the year stays the earliest in the story and the requirement is
// only that it says whose. The three cards that WERE named for a single company
// while carrying another's year were corrected rather than labelled: `unisys`,
// `apache` and `riverstone`.
const PROFILES = path.join(ROOT, "src", "content", "vendors", "profiles");
const normName = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, "");

for (const e of entries) {
  const body = lines.slice(e.start, e.end).join("\n");
  const ym = /^\s{4}founded: (\d{3,4}),$/m.exec(body);
  if (!ym) continue;
  const year = Number(ym[1]);
  const declaredCompany = /^\s{4}foundedCompany: "((?:[^"\\]|\\.)*)",$/m.exec(body)?.[1];
  const cardName = /^\s{4}name: "((?:[^"\\]|\\.)*)",$/m.exec(body)?.[1] ?? "";

  const pf = path.join(PROFILES, `${e.slug}.ts`);
  if (!fs.existsSync(pf)) {
    // No profile means no authoritative founding list to check against. A
    // foundedCompany here is still allowed - six of them come from a cited
    // Wikipedia infobox's own "founded = YYYY (as <name>)" row - but nothing
    // mechanical can verify it, which is stated rather than left implied.
    continue;
  }
  const prof = fs.readFileSync(pf, "utf8");
  const pairs = [
    ...prof.matchAll(/company:\s*"((?:[^"\\]|\\.)*)"[\s\S]{0,200}?year:\s*(\d{4})/g),
  ].map((m) => ({ company: m[1], year: Number(m[2]) }));
  if (pairs.length < 2) continue;

  // DOES THIS CARD NAME ONE COMPANY OR SEVERAL? A name joining companies with
  // "&", "+" or a comma list - "Intel & AMD", "Blue Coat & Packeteer",
  // "McAfee, FireEye & Mandiant" - has no single own subject, so no year can be
  // "its own" and `foundedCompany` is REQUIRED rather than forbidden. Without
  // this, a prefix match resolved "Intel & AMD" to Intel and then objected to
  // the card saying so, which is the matcher's artifact and not a fault.
  const namesSeveral = /[&+]|,\s|\blineage\b|\bfleet\b/i.test(cardName.split(/ [-\u2013] /)[0]);

  // Which declared founding belongs to the company this card is named for?
  // BEST match, not first-containing: a first-match rule made `elastic` look
  // wrong by matching "Compass, then Elasticsearch" ahead of "Elastic".
  const nm = normName(cardName.split(/ [-\u2013] /)[0]);
  let own = null;
  let bestScore = 0;
  for (const p of pairs) {
    const c = normName(p.company);
    let score = 0;
    if (c === nm) score = 100;
    else if (c.startsWith(nm) || nm.startsWith(c)) score = Math.min(c.length, nm.length);
    else if (c.includes(nm) || nm.includes(c)) score = Math.min(c.length, nm.length) / 2;
    if (score > bestScore) { bestScore = score; own = p; }
  }

  if (!namesSeveral && own && own.year === year) {
    if (declaredCompany) {
      errors.push(
        `"${e.slug}": foundedCompany is set to ${JSON.stringify(declaredCompany)} but ${year} IS ` +
          `this card's own subject's founding (${own.company}). Remove it: the field's presence is ` +
          `what tells a reader the year belongs to somebody else, so setting it everywhere tells ` +
          `them nothing.`
      );
    }
    continue;
  }

  // The year is not the card's own subject's. It must say whose it is.
  if (!declaredCompany) {
    errors.push(
      `"${e.slug}": founded ${year} is ${namesSeveral ? "one member's of a multi-company card" : `not ${own ? `${own.company}'s (${own.year})` : "any single declared founding"}`}, ` +
        `and the card does not say whose year it is. Either set foundedCompany to the company the ` +
        `profile declares for ${year}, or correct founded to this card's own subject. ` +
        `Declared: ${pairs.map((p) => `${p.company} ${p.year}`).join(" | ")}. (PRIME 2026-10-02)`
    );
    continue;
  }
  // And it must name a company the profile actually declares for that year, so
  // the label cannot drift away from the data it describes.
  const owner = pairs.filter((p) => p.year === year);
  if (owner.length === 0) {
    errors.push(
      `"${e.slug}": foundedCompany says ${JSON.stringify(declaredCompany)} but the profile declares ` +
        `no founding at all in ${year}. Declared: ${pairs.map((p) => `${p.company} ${p.year}`).join(" | ")}.`
    );
    continue;
  }
  const tok = normName(declaredCompany);
  if (!owner.some((p) => normName(p.company).includes(tok.slice(0, 12)) || tok.includes(normName(p.company).slice(0, 12)))) {
    errors.push(
      `"${e.slug}": foundedCompany says ${JSON.stringify(declaredCompany)}, but the company the ` +
        `profile declares for ${year} is ${owner.map((p) => JSON.stringify(p.company)).join(" or ")}. ` +
        `The label and the data must name the same company.`
    );
  }
}

// ---- RULING 2, CONTINUED: PROFILES THAT DECLARE ONE FOUNDING ---------------
//
// The block above opens with `if (pairs.length < 2) continue;`, so a card whose
// profile declares exactly ONE founding was never compared with that founding at
// all. On 2026-10-02 an audit of all 101 such cards found five contradicting their
// own profiles on the public site:
//
//   zyxel             card 1988, profile 1989 - and the card's own intro said
//                     "founded at Hsinchu Science Park in 1989"; Zyxel's own
//                     30th-anniversary release says "In the summer of 1989"
//   red-hat           card 1994, profile 1995, the card's own body 1993. Red
//                     Hat's 1999 IPO prospectus settles it: incorporated March
//                     1993 as ACC Corp., Inc. and RENAMED in 1995
//   cyclades-network  card 1971, profile 1972 (its sourced "project launch")
//   lumen-centurylink-level3  card 1968, profile declaring only Level 3's 1985 -
//                     the year was right, but nothing said whose it was
//   tandy-radioshack  card 1977, profile 1919 - declared below, awaiting PRIME
//
// The first four were corrected against their own evidence, the precedent set
// when cyclades-avocent-vertiv's body was corrected to its profile's 1988. The
// fifth is a question about what the card IS, which is PRIME's to answer.
//
// THE RULE. With one declared founding there is no lineage to choose from, so
// the card's `founded` must BE that founding's year; and if the card carries
// `foundedCompany`, it must name that same company, for the reason the block
// above requires it - the label and the data must agree.
//
// A DECLARED EXCEPTION is keyed by slug and pins BOTH years, so a later change to
// either side invalidates the declaration instead of slipping past it, and an
// exception that stops matching anything is reported as stale.
const SINGLE_FOUNDING_DECLARED = new Map([
  // AWAITING PRIME, 2026-10-02. The card is Tandy's computer era - the TRS-80's
  // launch on 3 August 1977 to the May 1993 exit that `ended` records - so its
  // `founded` holds when the era began, not a founding. The profile's one
  // founding is Hinckley-Tandy Leather, 1919. Ruling 3's storyBegins cannot
  // express the card either way: it must be EARLIER than `founded`, and this
  // story starts LATER than its company. Put to PRIME: (a) founded 1919 with
  // foundedCompany "Hinckley-Tandy Leather", accepting a 1919 timeline position;
  // or (b) a ruling that lets a card mark an era that starts after its founding.
  ["tandy-radioshack", { year: 1977, profileYear: 1919, why: "ERA-NOT-FOUNDING" }],
]);
// Slugs whose declaration matched a card this run, for the stale check below.
const singleFoundingSeen = new Set();
// How many cards were compared with a one-founding profile, for the summary.
let singleFoundingChecked = 0;

for (const e of entries) {
  // The entry's own lines, exactly as the blocks above read them.
  const body = lines.slice(e.start, e.end).join("\n");
  // Only cards that state a founded year have anything to compare.
  const ym = /^\s{4}founded: (\d{3,4}),$/m.exec(body);
  if (!ym) continue;
  const year = Number(ym[1]);
  // No profile means no declared founding to compare against.
  const pf = path.join(PROFILES, `${e.slug}.ts`);
  if (!fs.existsSync(pf)) continue;
  const prof = fs.readFileSync(pf, "utf8");
  // The same company/year pairing the multi-founding block uses, so the two
  // blocks can never disagree about how many foundings a profile declares.
  const pairs = [
    ...prof.matchAll(/company:\s*"((?:[^"\\]|\\.)*)"[\s\S]{0,200}?year:\s*(\d{4})/g),
  ].map((m) => ({ company: m[1], year: Number(m[2]) }));
  // Zero foundings: nothing declared. Two or more: the block above owns it.
  if (pairs.length !== 1) continue;
  singleFoundingChecked += 1;
  const only = pairs[0];
  const declaredCompany = /^\s{4}foundedCompany: "((?:[^"\\]|\\.)*)",$/m.exec(body)?.[1];

  // A declared exception passes only while BOTH pinned years still hold.
  const d = SINGLE_FOUNDING_DECLARED.get(e.slug);
  if (d) {
    singleFoundingSeen.add(e.slug);
    if (d.year !== year || d.profileYear !== only.year) {
      errors.push(
        `"${e.slug}": declared as a single-founding exception for card ${d.year} against ` +
          `profile ${d.profileYear}, but they now read ${year} and ${only.year}. A changed year ` +
          `invalidates the declaration - re-test it, or remove it if the two now agree.`
      );
    }
    continue;
  }

  // The card's year must be the one founding the profile declares.
  if (only.year !== year) {
    errors.push(
      `"${e.slug}": founded ${year}, but its profile declares exactly one founding - ` +
        `${JSON.stringify(only.company)}, ${only.year}. With one founding there is no lineage ` +
        `to choose from: correct whichever side the evidence contradicts, or, if the card is ` +
        `deliberately not a founding, declare it in SINGLE_FOUNDING_DECLARED with the reason.`
    );
    continue;
  }
  // And where the card names whose year it is, it must name this founding. A
  // leading article is not part of a name: marconi's card reads "the Wireless
  // Telegraph & Signal Company" and its profile "Marconi (Wireless Telegraph &
  // Signal Company)", the same company, which a raw prefix test called different.
  if (declaredCompany) {
    const bare = (x) => normName(x.replace(/^\s*the\s+/i, ""));
    const tok = bare(declaredCompany);
    const pc = bare(only.company);
    if (!(pc.includes(tok.slice(0, 12)) || tok.includes(pc.slice(0, 12)))) {
      errors.push(
        `"${e.slug}": foundedCompany says ${JSON.stringify(declaredCompany)}, but the one ` +
          `founding its profile declares for ${year} is ${JSON.stringify(only.company)}. The ` +
          `label and the data must name the same company.`
      );
    }
  }
}

// THE STALE HALF, as for DECLARED: an exception that matches nothing has either
// been fixed or lost its profile, and either way must come off the list.
const staleSingle = [...SINGLE_FOUNDING_DECLARED.keys()].filter((s) => !singleFoundingSeen.has(s));
if (staleSingle.length > 0) {
  errors.push(
    `${staleSingle.length} single-founding declaration(s) no longer match a card with a ` +
      `one-founding profile and must be removed: ${staleSingle.join(", ")}`
  );
}

// ---- RULING 3: WHERE THE STORY STARTS --------------------------------------
//
// PRIME, 2026-10-02, approving the field proposed when ruling 2 landed. `founded`
// had been doing two jobs: stating a company's founding AND placing the card on
// the timeline. Ruling 2 gave it the first; `storyBegins` takes the second, so
// neither has to lie. Four call sites order by storyStart(), which reads it.
//
// TWO THINGS ARE ASSERTED, both of which would otherwise rot silently:
//
//   1. storyBegins.year must be EARLIER than `founded`. A story cannot begin
//      after its own subject was founded, and a storyBegins equal to `founded`
//      is noise: the field's presence is what tells a reader the timeline
//      position is not the stated founding.
//   2. The named company must not be the card's own subject. If it were, the
//      card would be claiming its own subject was founded twice.
for (const e of entries) {
  const body = lines.slice(e.start, e.end).join("\n");
  const sb = /^\s{4}storyBegins: \{ year: (\d{3,4}), company: "((?:[^"\\]|\\.)*)" \},$/m.exec(body);
  if (!sb) continue;
  const ym = /^\s{4}founded: (\d{3,4}),$/m.exec(body);
  const sbYear = Number(sb[1]);
  const company = sb[2];
  if (!ym) {
    errors.push(`"${e.slug}": storyBegins is set but the entry has no founded year to be earlier than.`);
    continue;
  }
  const year = Number(ym[1]);
  if (sbYear >= year) {
    errors.push(
      `"${e.slug}": storyBegins.year ${sbYear} is not earlier than founded ${year}. A story cannot ` +
        `begin after its own subject was founded, and an equal value is noise - the field's presence ` +
        `is what tells a reader the timeline position is not the stated founding. Remove it or fix it.`
    );
  }
  const cardName = /^\s{4}name: "((?:[^"\\]|\\.)*)",$/m.exec(body)?.[1] ?? "";
  const n = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (n(company) && n(company) === n(cardName.split(/ [-\u2013] /)[0])) {
    errors.push(
      `"${e.slug}": storyBegins names ${JSON.stringify(company)}, which is this card's own subject. ` +
        `The field exists to name an EARLIER company, so this says the subject was founded twice.`
    );
  }
}

// ---- THE END YEAR MUST BE CITED TOO ----------------------------------------
//
// Added 2026-10-02. `ended.year` renders on /industry in the card's
// "founded - ended" span, exactly as `founded` does, and until this check nobody
// had asked the question founded and personYear were both asked: does a citation
// name it? The answer was 10 of 26 uncited - 8 explained only in the entry's own
// `note` prose (not a citation), 2 stated nowhere. All 10 were then sourced
// (mostly to the company's Wikipedia infobox defunct/fate field, amended into the
// existing citation rather than duplicated), and sixdegrees was corrected: its
// dates were a year off (sold Dec 1999 not 2000, shut 30 Dec 2000 not 2001).
//
// Enforced at ZERO declared. A `note` does not count, same rule as founded: a
// note can mention a year to say it is NOT the end. DECLARED_ENDED is the escape
// hatch for a genuinely uncitable future end; empty today, may only grow with a
// tested reason.
const DECLARED_ENDED = new Map([
]);
const endedFound = new Set();
const endedUndeclared = [];
let withEnded = 0;
let endedNamed = 0;
for (const e of entries) {
  const body = lines.slice(e.start, e.end).join("\n");
  if (!/^\s{4}ended: \{$/m.test(body)) continue;
  const ym = /^\s{6}year: (\d{3,4}),$/m.exec(body);
  if (!ym) continue;
  withEnded += 1;
  const year = Number(ym[1]);
  const labels = [...body.matchAll(/label:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).join(" ");
  if (labels.includes(String(year))) { endedNamed += 1; continue; }
  const d = DECLARED_ENDED.get(e.slug);
  if (d && d.year === year) { endedFound.add(e.slug); continue; }
  endedUndeclared.push(`${e.slug} (${year})`);
}
if (endedUndeclared.length > 0) {
  errors.push(
    `${endedUndeclared.length} entry(ies) carry an ended year that no citation label names: ` +
      `${endedUndeclared.join(", ")}. The end date renders publicly in the card's span, so it needs ` +
      `a source like any other claim - state the year inside a citation label (a bare "note" does ` +
      `not count), or add the slug to DECLARED_ENDED with a tested reason.`
  );
}
const endedStale = [...DECLARED_ENDED.keys()].filter((x) => !endedFound.has(x));
if (endedStale.length > 0) {
  errors.push(`${endedStale.length} DECLARED_ENDED declaration(s) now cite their year and must be removed: ${endedStale.join(", ")}.`);
}

// ---- the floor -------------------------------------------------------------
//
// A guard cannot measure its own scope. If entries lose their `founded` field
// wholesale, every check above passes over a smaller corpus and reports green.
const MIN_WITH_YEAR = 337; // 2026-10-01. May only be raised.
if (withYear < MIN_WITH_YEAR) {
  errors.push(
    `${withYear} entries carry a founded year, below the floor of ${MIN_WITH_YEAR}. Either years ` +
      `were removed (lower the floor in the same commit and say why) or the splitter stopped ` +
      `seeing entries, in which case every verdict above is a verdict over a short corpus.`
  );
}

if (errors.length > 0) {
  console.error("[check-vendor-founded-sources] FAIL:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const storyBeginsCount = (src.match(/^    storyBegins: /gm) ?? []).length;
const byWhy = {};
for (const d of DECLARED.values()) byWhy[d.why] = (byWhy[d.why] ?? 0) + 1;
const breakdown = Object.entries(byWhy)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `${k} ${v}`)
  .join(", ");

console.log(
  `[check-vendor-founded-sources] OK: ${withYear} vendor entry(ies) with a founded year ` +
    `(floor ${MIN_WITH_YEAR}, may only be raised); ${named} named by a citation on their own ` +
    `entry; ${DECLARED.size} declared${DECLARED.size > 0 ? ` (${breakdown})` : ""}, may only ` +
    `shrink. The year must appear in a LABEL, not a sourceNote: a note often mentions a year in ` +
    `order to say it is NOT supported, and reading notes let three disclaimers pass as citations. ` +
    `The fix is a substantive ` +
    `label; the bare "Founding year: NNNN" form is forbidden separately by ` +
    `check-placeholder-sources, so neither guard can be satisfied by defeating the other. ` +
    `Every "founded:" line in the file was placed inside an entry (${foundedPlaced}/${foundedTotal}); ${endedNamed}/${withEnded} ended year(s) named by a citation label; ${storyBeginsCount} card(s) carry storyBegins, each asserted to name an earlier year than its own founding and a company other than its own subject; ${singleFoundingChecked} card(s) whose profile declares one founding were held to that founding's year (since 2026-10-02; before that they were skipped), ${SINGLE_FOUNDING_DECLARED.size} declared as an exception with a reason.`
);
