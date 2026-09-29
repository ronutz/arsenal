#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// check-learn-duplication — THE SAME PARAGRAPH IN TWO ARTICLES.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-09-27 eleven vendor entries were found carrying a
// byte-identical intro and eight of them a byte-identical body, and nothing
// caught it: check-partner-duplicates compares slugs and names, not copy. A
// fourth check was added there the same day. This is that check for the Learn
// corpus, which is twenty times larger and had never been looked at this way.
//
// It found one real defect immediately: eight F5 version-claim articles shared
// the Sources lead-in "Every release-specific claim above is F5's own, and these
// are where to re-check it when the next version ships", in BOTH locales. The
// house form is one sentence stating what THAT article's sources establish, and a
// sentence true of eight articles states nothing about any of them.
//
// *** WHY THE FLOOR IS 100 CHARACTERS, AND WHY THAT NUMBER WAS MEASURED RATHER
// THAN CHOSEN. *** The sweep that found the defect used a 120-character floor. It
// reported the Portuguese lead-in duplicated eight times and showed the English
// one as clean. The English sentence is 111 characters: it was duplicated eight
// times too and fell under the floor. So the floor was re-measured at 60, 80, 100
// and 120 against the live corpus:
//
//   60   catches functional list introducers - "A ordem que resolve a maioria dos
//        casos, do mais barato ao mais caro:" is 69 characters and appears in two
//        troubleshooting articles, which is a colon and a list, not prose.
//   100  catches the 111-character defect, excludes the introducers, and makes
//        both locales report the SAME four groups - a symmetry worth having,
//        because an asymmetry between locales is itself a finding.
//   120  hid half the real defect. That is the whole reason this comment exists.
//
// WHAT IS DECLARED, AND WHY BY SLUG SET RATHER THAN BY HASH. Four groups are
// legitimate: articles that point a reader at the same external walkthrough, or
// attribute the same table, or introduce the same pair of standards. Each is
// declared by the SET OF SLUGS allowed to share a paragraph, not by a content
// hash, because a hash breaks the moment somebody rewords the sentence and the
// guard then fails on a change that improved it. A sharing between any other
// combination of articles fails, which is the behaviour that matters.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Minimum paragraph length, in characters. See the measurement above.
const MIN_LEN = 100;

const LOCALES = ["en", "pt-BR"];
const ROOT = "src/content/learn";

// Slug sets permitted to share a paragraph, each with the reason. A set is
// matched exactly: if a fifth article joins one of these groups, that is a new
// sharing and it fails, which is the point.
const DECLARED_SHARING = [
  {
    slugs: ["f5-tls13-vs-tls12-ciphers", "hybrid-key-exchange-in-tls", "tls13-cipher-suites"],
    why: "All three send the reader to the same annotated TLS 1.3 walkthrough. One recommendation, three articles about the same handshake; rewording it three ways would make the same pointer look like three different resources.",
  },
  {
    slugs: ["market-window-data-communications", "market-window-internetworking", "market-window-networking"],
    why: "The three market-window articles attribute the same Pelkey revenue table. An attribution is meant to be identical across the articles that use it, or a reader cannot tell it is one table.",
  },
  {
    slugs: ["choosing-a-persistence-method", "ltm-persistence-methods"],
    why: "A shared Sources lead-in for the same pair of authorities: F5's own method list and the TLS specification's protocol limit. Both articles rest on exactly those two and nothing else.",
  },
  {
    slugs: ["oidc-overview", "openid-connect"],
    why: "A shared Sources lead-in naming the same two public standards, whose division of labour is stated in their own opening sections. Same two documents, same sentence.",
  },
];

/** Prose paragraphs from an MDX body, whitespace-normalised.
 *  Headings, lists, tables, blockquotes, JSX and fenced code are skipped: a
 *  repeated table row or bullet is a different question from repeated prose, and
 *  answering both in one guard would make neither answer trustworthy. */
function paragraphs(text) {
  let body = text.replace(/^---\n[\s\S]*?\n---\n/, "");
  body = body.replace(/```[\s\S]*?```/g, "");
  const out = [];
  for (const block of body.split(/\n\s*\n/)) {
    const b = block.trim();
    if (!b) continue;
    if (/^[#\-*|>:]/.test(b) || b.startsWith("<") || b.startsWith("import ")) continue;
    out.push(b.replace(/\s+/g, " "));
  }
  return out;
}

const sameSet = (a, b) => a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

const offences = [];
let scanned = 0;
let counted = 0;

for (const locale of LOCALES) {
  const dir = path.join(ROOT, locale);
  if (!fs.existsSync(dir)) continue;
  const seen = new Map(); // hash -> { slugs:Set, text }
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".mdx"))) {
    scanned += 1;
    const slug = name.replace(/\.mdx$/, "");
    for (const p of paragraphs(fs.readFileSync(path.join(dir, name), "utf8"))) {
      if (p.length < MIN_LEN) continue;
      counted += 1;
      const h = crypto.createHash("sha1").update(p).digest("hex").slice(0, 12);
      if (!seen.has(h)) seen.set(h, { slugs: new Set(), text: p });
      seen.get(h).slugs.add(slug);
    }
  }
  for (const { slugs, text } of seen.values()) {
    // One paragraph repeated inside a SINGLE article is a different defect and is
    // not this guard's business; the Set collapses those to one slug.
    if (slugs.size < 2) continue;
    const list = [...slugs];
    if (DECLARED_SHARING.some((d) => sameSet(d.slugs, list))) continue;
    offences.push({ locale, slugs: list.sort(), text });
  }
}

if (offences.length > 0) {
  console.error(
    `\n[check-learn-duplication] FAIL: ${offences.length} paragraph(s) shared by articles that are not declared.\n`,
  );
  for (const o of offences.slice(0, 10)) {
    console.error(`  ${o.locale}  x${o.slugs.length}  ${o.slugs.join(", ")}`);
    console.error(`        "${o.text.slice(0, 110)}..."`);
  }
  console.error(
    "\n      A Sources lead-in states what THAT article's sources establish. A sentence\n" +
      "      true of eight articles states nothing about any of them, and eight of these\n" +
      "      shipped that way on 2026-09-27 in both locales.\n" +
      "      If the sharing is right - the same external walkthrough, the same attributed\n" +
      "      table, the same pair of standards - add the slug set to DECLARED_SHARING with\n" +
      "      the reason. Never add a bare slug set: a declaration without a reason cannot\n" +
      "      be argued with later, and the next real defect hides behind it.\n",
  );
  process.exit(1);
}

// A declaration whose articles no longer share anything is stale and should come
// off, so the list can only shrink.
console.log(
  `[check-learn-duplication] OK: ${scanned} article(s) across ${LOCALES.length} locale(s); ` +
    `${counted} paragraph(s) of ${MIN_LEN}+ chars; no undeclared sharing ` +
    `(${DECLARED_SHARING.length} declared group(s), each with a reason).`,
);
