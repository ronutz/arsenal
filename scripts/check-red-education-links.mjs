#!/usr/bin/env node
// ============================================================================
// check-red-education-links  —  POST-BUILD.
// ----------------------------------------------------------------------------
// PRIME wants this site to be useful to Red Education, and the honest way to do
// that is NOT to add more links. SCOUT's audit put it plainly:
//
//     "You already have enough links. What you need now is better routing and
//      more authority entering ronutz from elsewhere."
//
// Intentions decay. This guard turns that finding into a build-time fact.
//
// TWO RULES, DELIBERATELY DIFFERENT IN KIND:
//
//  1. A HARD ZERO IN THE LEARN CORPUS. Not a ratchet - a rule. The 553 Learn
//     articles are the editorial body that earns this domain its external
//     citations, and those citations are the mechanism by which ronutz can
//     eventually be worth something to Red at all:
//
//         authoritative external site -> ronutz article -> ronutz training
//                                     -> Red Education
//
//     A commercial link dropped into an article "because a vendor is mentioned"
//     poisons exactly the thing that makes the chain work. First on SCOUT's
//     list of what not to do, and the only one worth enforcing absolutely.
//
//  2. A RATCHET ON THE TOTAL. The count may change - PRIME has commissioned new
//     sections for /red-education/ that will legitimately add links - but it may
//     only change ON PURPOSE, by editing the number below in the same change.
//     That is the difference between a decision and a drift.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const BASE = path.join("out", "en");
if (!fs.existsSync(BASE)) {
  console.log("[check-red-education-links] SKIP: no build output to read.");
  process.exit(0);
}

// The measured footprint on 2026-08-16, after the destination work.
// RAISE THIS DELIBERATELY, never to make a build pass.
//
// 86 -> 87 on 2026-08-16: the Company Culture section adds ONE link, to
// /about-us/our-culture/, the page the section summarises. The guard caught the
// change on the build that introduced it, which is exactly what it is for - the
// number moved because somebody decided it should, in the same commit.
//
// 87 -> 97 on 2026-08-16: the Course Explainers section adds TEN, one per
// explainer Red Education publishes. Every URL was read from their own
// /course-explained/ index, which - unlike the case-study index - is
// server-rendered and lists its children with real hrefs. Ten links for ten
// pages that exist, on the page about Red Education, is the kind of growth this
// ratchet exists to let through DELIBERATELY.
//
// 97 -> 99 on 2026-08-16: the Articles section adds TWO - the one blog article
// whose URL is addressable, and the blog index itself. /news/ is client-
// rendered like the case-study index, so two is all that can honestly be
// linked, and two is what was added.
const BASELINE_TOTAL = 99;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === "index.html") out.push(full);
  }
  return out;
}

const LINK = /href="https:\/\/www\.rededucation\.com\/[^"]*utm_source/g;

let total = 0;
const inLearn = [];
for (const file of walk(BASE)) {
  const route = "/" + path.relative(BASE, path.dirname(file)).split(path.sep).join("/");
  const n = (fs.readFileSync(file, "utf8").match(LINK) ?? []).length;
  if (n === 0) continue;
  total += n;
  if (route === "/learn" || route.startsWith("/learn/")) inLearn.push(`${route} (${n})`);
}

const problems = [];
if (inLearn.length > 0) {
  problems.push(
    `${inLearn.length} Learn page(s) carry a Red Education link. The Learn corpus stays clear of commercial links:\n        ` +
    inLearn.slice(0, 10).join("\n        "),
  );
}
if (total > BASELINE_TOTAL) {
  problems.push(
    `${total} attributed Red Education links, above the recorded baseline of ${BASELINE_TOTAL}. ` +
    `If the new links are intended, raise BASELINE_TOTAL in this file as part of the same change.`,
  );
}

if (problems.length > 0) {
  console.error("\n[check-red-education-links] FAIL\n");
  for (const p of problems) console.error(`      ${p}\n`);
  process.exit(1);
}

console.log(
  `[check-red-education-links] OK: ${total} attributed link(s) (baseline ${BASELINE_TOTAL}); Learn corpus clear.` +
  (total < BASELINE_TOTAL ? ` LOWER - drop BASELINE_TOTAL to ${total}.` : ""),
);
