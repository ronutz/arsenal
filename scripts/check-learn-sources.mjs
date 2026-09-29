// ============================================================================
// scripts/check-learn-sources.mjs
// ----------------------------------------------------------------------------
// A SOURCES GUARD FOR THE LEARN CORPUS, SCOPED BEFORE IT WAS WRITTEN.
//
// The industry corpus has `check-sources` at 221/221 because every entry is a
// claim about a company and every one of those can be checked. Learn is not
// like that, and the scoping is the whole design:
//
//   539 en articles
//     46 carry an external link
//    110 name a KB or an RFC number
//    413 carry NEITHER
//
// *** A GUARD DEMANDING A SOURCE ON EVERY ARTICLE WOULD FAIL 77% OF THE CORPUS,
// AND MOST OF THOSE FAILURES WOULD BE CORRECT ARTICLES. *** An explainer about
// how XML document order works, or what a persistence record is, has nothing to
// cite - the subject is the explanation. Demanding a link there teaches people
// to add decorative ones, which is worse than none because it looks like rigour.
//
// SO THE GUARD TARGETS THE CLAIMS THAT AGE.
//
// An article that names a SPECIFIC VERSION - "21.1", "FortiOS 7.6.0", "v2.0" -
// is asserting something that was true of a release, and a reader hitting it two
// versions later needs to know where to re-check. That is exactly the class the
// eight F5 articles fell into on 2026-08-10, when I first refused them as
// unverifiable and PRIME pointed out the facts were in F5's public docs.
//
// WHAT COUNTS AS A SOURCE, AND WHY A HYPERLINK IS NOT THE ONLY FORM:
//
//   - a markdown link to an external URL
//   - *** A KB NUMBER IN PROSE *** (K14510) - this is how F5's own documentation
//     and support cases cite, 25 articles do it, and on 2026-08-10 I reported
//     those articles as having "zero citations" because I grepped for markdown
//     link syntax. The check measured whether a citation was CLICKABLE, not
//     whether one EXISTED.
//   - an RFC number in prose (RFC 8484)
//
// VERSION NUMBERS INSIDE CODE ARE NOT CLAIMS. A `set mode` example or a config
// snippet showing `17.1.0` is illustrating syntax, so fenced blocks and inline
// code are stripped before the scan.
//
// FAILING IS NOT THE ONLY OUTCOME. This guard reports a BUDGET: it fails when
// the unsourced count RISES above the recorded baseline, which is the same
// ratchet `check-sources` uses - the number may only go down. That way it
// protects the corpus from getting worse without demanding a 64-article
// retrofit in the turn it lands.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const DIR = "src/content/learn/en";

// The baseline is a measurement, not a target. Lower it when work lands; never
// raise it without saying why in the commit that does.
//
// 64 -> 42 on 2026-09-27, and NOT by sourcing 22 articles. The detector was
// counting things that are not versions at all, and the guard's own header is
// explicit that the target is "the claims that AGE". Twenty-two of the
// sixty-four named no release: public resolver addresses (1.1.1.1, 8.8.8.8),
// RFC 5737 and RFC 1918 prefixes, Brazilian statute numbers (Lei 7.232,
// Decree 8.771), IEEE working groups (802.3, 802.11), ITU-T Recommendations
// (G.9807.1), F5 exam blueprints (201.62020), frequencies and line rates
// (2.4 GHz, 2.488 Gbps), scientific notation (6.6 x 10^15), durations
// (203.79 microseconds) and BIG-IP's all-interfaces specifier (0.0).
//
// This mattered beyond the number. A baseline of 64 described a 64-article
// retrofit that mostly did not exist, and the obvious way to "clear" it would
// have been to bolt a link onto an article about the 2.4 GHz band - which is
// precisely the decorative citation this guard's header warns is worse than
// none because it looks like rigour.
//
// 42 -> 4 later the same day, and this time BY SOURCING. Thirty-eight articles
// gained a real ## Sources section in en and pt-BR, every document opened live
// before it was cited, and the frontmatter `updated:` stamp is the access date
// (this repo has no separate "accessed" convention in the block, and inventing
// one would make these read differently from the 78 already sourced).
//
// Getting there needed a tool, not more effort. help.zscaler.com,
// docs.fortinet.com, docs.cloud.f5.com and techdocs.f5.com are all
// single-page applications: a plain fetch returns a "please enable JavaScript"
// shell or the navigation menu, and a citation written from that is a citation
// written from nothing. Rendering each page in a headless browser first is what
// turned "the vendor documents this somewhere" into quotable text - which is
// also how two content defects surfaced that no amount of link-adding would
// have found:
//
//   troubleshooting-zcc-connectivity called it "the reserved 100.64.0.0/24
//   health-check range". Zscaler's own page calls it the SYNTHETIC IP RANGE,
//   gives the default as /16, and says it serves PRIVATE ACCESS applications.
//   Wrong prefix length and wrong purpose, in one clause, in both locales.
//
//   f5-cipher-rules-and-groups is right that COMPAT was removed and replaced
//   with NONE - F5 says both, verbatim - but the page that says it does not
//   name the release, so the article's "TMOS 13.0" is sourced to nothing yet.
//   Recorded in the Sources lead rather than papered over.
//
// NO LONGER A BARE COUNT. A number says "four are tolerated" and cannot say
// WHICH, so it tolerates the fifth - a new unsourced version claim - exactly as
// readily. Each of the four below is declared with the reason its source could
// not be reached, and anything not on this list fails. The list may only shrink.
const DECLARED_UNSOURCED = new Map([
  ["f5-cipher-string-syntax",
   "the cipher-string grammar (sets, + joins, ! - + operators, @STRENGTH) is " +
   "documented in K15194 on my.f5.com, a Salesforce Lightning app that fails " +
   "to load outside a real browser session; techdocs carries the f5-secure " +
   "example and the Order list but not the grammar. Citing K15194 unread would " +
   "be citing from memory."],
  ["f5xc-openapi-and-api-inventory",
   "F5's XC import guide confirms OpenAPI \"(formerly Swagger)\" but never " +
   "states WHICH spec versions XC accepts, so the article's \"OpenAPI 2.0 ... " +
   "and OpenAPI 3.0.x\" has no page behind it yet."],
  ["how-iquery-connects-bigip-dns",
   "the article says Link Controller was removed in BIG-IP 21.0.0. The 21.0.0 " +
   "release notes never say so; the module is merely ABSENT from the supported " +
   "list, and absence is not documented removal. The end-of-sale notice is " +
   "K47621243, on the unreachable portal. Raised for PRIME."],
  ["zscaler-client-connector-profiles",
   "the forwarding-profile menu (Z-Tunnel 1.0, Z-Tunnel 2.0, Tunnel with Local " +
   "Proxy, Enforce Proxy, None) is on Zscaler's forwarding-profile " +
   "configuration page, which serves a near-empty stub even to a full browser " +
   "render. About Forwarding Profiles and About Z-Tunnel cover the surrounding " +
   "structure but not the menu itself."],
]);

const BASELINE = 0;

// WHAT COUNTS AS A VERSION, AND WHAT MERELY LOOKS LIKE ONE.
//
// Sharpened 2026-09-27. The bare pattern below matched any dotted decimal, and
// on inspection MOST of the sixty-four articles it was holding against the
// baseline named no version at all. It was firing on:
//
//   1.1.1.1 and 8.8.8.8       public resolver addresses
//   203.0.113.50, 169.254     RFC 5737 and link-local prefixes
//   10.0.0.0, 100.64.0.0      RFC 1918 and CGNAT space
//   Lei nº 7.232, 13.709      Brazilian statute numbers
//   802.3, 802.11, 802.1      IEEE working-group designations
//   2.4 GHz, 2.488 Gbps       frequencies and line rates
//   94.93%, 16.7 million      plain measurements
//
// None of those is a claim about a release, so none of them needs a place to
// re-check a release. The guard's own header is explicit that the target is
// "the claims that AGE", and an article saying the AM band sits at 2.4 GHz is
// not going to be overtaken by a point release.
//
// This is a NARROWING of what the guard reports, not of what it demands. A real
// version claim still requires a source, and the exclusions below are each a
// category test rather than a per-article exemption, so a new article naming a
// real version is caught exactly as before.
const VERSION_CANDIDATE = /\b(?:v|version\s)?\d+\.\d+(?:\.\d+)?\b/g;

/** Units that make a dotted decimal a measurement rather than a release. */
const UNIT_AFTER =
  /^\s*(?:G|M|k|K|m|n|u|\u00b5)?(?:Hz|bps|B\/s|bit|bits|byte|bytes|s|sec|secs|ms|Wh|W|V|dB|m|km|mm)\b/;

/** Words that make it a quantity: a duration, a magnitude or a proportion. */
const QUANTITY_AFTER =
  /^\s*(?:(?:micro|milli|nano|pico)?seconds?|minutes?|hours?|days?|weeks?|months?|years?|cycles?)\b|^\s*%|^\s*(?:per\s?cent|percent|thousand|million|billion|trillion|quadrillion|quintillion|sextillion|septillion|octillion|nonillion|decillion|undecillion)\b|^\s*(?:x|\u00d7)\s*10/;

/** Nouns that make a dotted decimal an ADDRESS rather than a release: an IPv4
 *  prefix written without all four octets ("a self-assigned 169.254 address")
 *  is invisible to the dotted-run test below, and is not a version. */
const ADDRESS_AFTER =
  /^\s*(?:address|addresses|space|range|ranges|prefix|prefixes|subnet|subnets|network|networks)\b|^\/\d/;

/** True when the dotted decimal at `m` is a release version rather than an
 *  address, a statute, an IEEE designation or a measurement. */
function isVersionClaim(text, m) {
  const tok = m[0];
  const after = text.slice(m.index + tok.length);
  const before = text.slice(Math.max(0, m.index - 16), m.index);

  // Part of a longer dotted run: an IPv4 address or a network prefix.
  if (/^\.\d/.test(after)) return false;
  if (/\d\.$/.test(before)) return false;

  // IEEE 802 working groups and their clauses.
  if (/^802\./.test(tok)) return false;

  // Statutes and decrees, which Brazil writes N.NNN.
  if (/\b(?:Lei|Leis|Decreto|Decree|Law)\b[^.]{0,14}$/i.test(before)) return false;
  if (/n[\u00ba\u00b0o]\.?\s?$/i.test(before)) return false;

  // ITU-T Recommendations are lettered then numbered: G.9807.1, X.509, Q.931.
  if (/\b[A-Z]\.$/.test(before)) return false;

  // An F5 certification blueprint number, e.g. "blueprint 201.62020".
  if (/\bblueprint\s*$/i.test(before)) return false;

  // A measurement, a quantity or an address.
  if (UNIT_AFTER.test(after)) return false;
  if (QUANTITY_AFTER.test(after)) return false;
  if (ADDRESS_AFTER.test(after)) return false;

  // An all-zero token is a placeholder, never a release: BIG-IP's "0.0" means
  // every interface, and 0.0.0.0 means the unspecified address.
  if (/^0(?:\.0)+$/.test(tok)) return false;

  return true;
}

/** Does this prose make at least one real version claim? */
function namesAVersion(text) {
  for (const m of text.matchAll(VERSION_CANDIDATE)) {
    if (isVersionClaim(text, m)) return true;
  }
  return false;
}
const EXTERNAL_LINK = /\]\(https?:\/\//;
const KB_OR_RFC = /\bK\d{4,}\b|\bRFC\s?\d{3,}\b/;

/** Strip fenced and inline code: a version in an example is not a claim. */
function prose(body) {
  return body.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
}

const unsourced = [];
let scanned = 0;
let versioned = 0;
/** Version claims whose source is declared unreachable above, not forgotten. */
let declared = 0;

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".mdx"))) {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const parts = raw.split("---");
  if (parts.length < 3) continue;
  const body = parts.slice(2).join("---");
  scanned += 1;

  if (!namesAVersion(prose(body))) continue;
  versioned += 1;

  if (EXTERNAL_LINK.test(body) || KB_OR_RFC.test(body)) continue;
  const slug = file.replace(/\.mdx$/, "");
  if (DECLARED_UNSOURCED.has(slug)) { declared += 1; continue; }
  unsourced.push(slug);
}

const n = unsourced.length;

if (n > BASELINE) {
  console.error(`\n[check-learn-sources] FAIL:\n`);
  console.error(
    `  ${n} article(s) name a version in prose and cite nothing, and are not declared.`,
  );
  console.error(
    `  An article asserting something version-specific needs somewhere to re-check it.\n`,
  );
  console.error(`  A source is any of: an external link, a KB number (K14510),`);
  console.error(`  or an RFC number (RFC 8484). A KB number in prose counts.\n`);
  for (const s of unsourced.slice(0, 20)) console.error(`      ${s}`);
  if (n > 20) console.error(`      ... and ${n - 20} more`);
  console.error("");
  process.exit(1);
}

console.log(
  `[check-learn-sources] OK: ${scanned} en articles; ${versioned} make a version-specific claim; ` +
    `${n} undeclared uncited (baseline ${BASELINE}); ` +
    `${declared} declared unsourced with a reason (may only shrink).`,
);
