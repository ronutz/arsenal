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
// 99 -> 100 on 2026-09-11, deliberately. PRIME asked for his own instructor
// profile at rededucation.com/team/rodolfo-nutzmann to be listed on /contact,
// where every channel URL is attributed at render. So the hundredth attributed
// link is an IDENTITY page - it also serves as a schema.org sameAs - rather
// than another route into the course catalogue, which is the creep this
// baseline exists to resist. The guard still catches a 101st.
const BASELINE_TOTAL = 100;

// *** AND A COUNT CANNOT SEE A SWAP. *** The baseline above has an honest audit
// trail - every increment from 86 is traced to the decision behind it - but it is
// still a NUMBER. It cannot say WHICH hundred links, so one legitimate link
// removed as one creeping commercial link is added leaves the total at 100 and
// the guard reports OK. That is precisely the creep the baseline exists to
// resist.
//
// So the DESTINATIONS are declared too, by PATH. The path is the stable key:
// attributeRedEducationUrl only appends query parameters, leaving the path
// untouched, and a path does not change when a shared component starts rendering
// on more pages - which a count does.
//
// Derived on 2026-09-30 from every literal rededucation.com URL in `src`, plus
// the ten that /red-education/ builds from its explainer array, whose slugs are
// listed in that file. Forty-one destinations.
//
// *** THE TWO DIRECTIONS ARE DELIBERATELY ASYMMETRIC, AND THIS IS NOT LAZINESS.
// *** A path found in the build and NOT declared FAILS: that is the dangerous
// direction, the new commercial link, and the half of a swap worth catching. A
// path declared and NOT found is only REPORTED, because this list was derived
// from source while the guard reads `out/en` alone - a URL authored for a
// Portuguese-only surface, or sitting in a comment, legitimately never appears
// there. Failing on that would break a build over a mismatch that is not a
// defect. When a report shows a declared path the build never emits, the answer
// is to check it and drop it from the list, and the list can then only shrink.

const DECLARED_PATHS = new Set([
  "/",
  "/about-us/",
  "/about-us/our-culture/",
  "/arista/",
  "/avaya/",
  "/awards/",
  "/awards/palo-alto-networks-training-partner-of-the-year-2024-for-japac/",
  "/case-studies/enhancing-f5-big-ip-platform-capabilities-with-irules-training/",
  "/case-studies/high-impact-fortinet-training-at-scale-for-global-it-leader/",
  "/certifications/",
  "/checkpoint/",
  "/cisco/",
  "/course-explained/check-point-training-resources/",
  "/course-explained/cisco-training-resources/",
  "/course-explained/cyber-security-career-paths/",
  "/course-explained/cyberark-training-resources/",
  "/course-explained/fortinet-training-resources/",
  "/course-explained/netskope-training-resources/",
  "/course-explained/nutanix-training-resources/",
  "/course-explained/ping-identity-training-resources/",
  "/course-explained/training-resources-palo-alto/",
  "/course-explained/zscaler-training-resources/",
  "/cyberark/",
  "/epi/",
  "/extreme-networks-exclusive-global-training-partner/",
  "/extreme-networks/",
  "/f5-certification-career-pathways-salary-expectations/",
  "/f5-networks/",
  "/fortinet/",
  "/netskope-training/",
  "/news/",
  "/nutanix/",
  "/paessler/",
  "/palo-alto-networks/",
  "/ping-identity/",
  "/professional-services/",
  "/red-education-is-20-daniel-storey-reflects-on-two-decades-of-building-a-global-business/",
  "/red-education-wins-fortinet-atc-partner-of-the-year-apac-award/",
  "/tag/announcement/",
  "/team/rodolfo-nutzmann/",
  "/zscaler/",
]);


function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === "index.html") out.push(full);
  }
  return out;
}

const LINK = /href="https:\/\/www\.rededucation\.com\/[^"]*utm_source/g;

// The same match, but capturing the URL so its PATH can be read. Attribution adds
// query parameters, so the path is everything before the "?".
const LINK_URL = /href="(https:\/\/www\.rededucation\.com\/[^"]*utm_source[^"]*)"/g;

let total = 0;
const inLearn = [];
// path -> the routes that link to it, so a finding names where to look.
const foundPaths = new Map();
for (const file of walk(BASE)) {
  const route = "/" + path.relative(BASE, path.dirname(file)).split(path.sep).join("/");
  const html = fs.readFileSync(file, "utf8");
  const n = (html.match(LINK) ?? []).length;
  if (n === 0) continue;
  total += n;
  if (route === "/learn" || route.startsWith("/learn/")) inLearn.push(`${route} (${n})`);
  for (const m of html.matchAll(LINK_URL)) {
    let p;
    try {
      p = new URL(m[1].replace(/&amp;/g, "&")).pathname;
    } catch {
      continue; // A malformed href is not a destination; the count already has it.
    }
    if (!foundPaths.has(p)) foundPaths.set(p, new Set());
    foundPaths.get(p).add(route);
  }
}

const undeclaredPaths = [...foundPaths.keys()].filter((p) => !DECLARED_PATHS.has(p));
const unseenPaths = [...DECLARED_PATHS].filter((p) => !foundPaths.has(p));

const problems = [];
if (inLearn.length > 0) {
  problems.push(
    `${inLearn.length} Learn page(s) carry a Red Education link. The Learn corpus stays clear of commercial links:\n        ` +
    inLearn.slice(0, 10).join("\n        "),
  );
}
if (undeclaredPaths.length > 0) {
  problems.push(
    `${undeclaredPaths.length} Red Education destination(s) in the build that are not declared:\n        ` +
    undeclaredPaths
      .map((p) => `${p}   linked from: ${[...foundPaths.get(p)].slice(0, 4).join(", ")}`)
      .join("\n        ") +
    `\n\n      A count cannot see this: a new destination added as another is removed leaves the\n` +
    `      total unchanged. If the destination is intended, add its PATH to DECLARED_PATHS in\n` +
    `      this file as part of the same change, and raise BASELINE_TOTAL if the total moved.`,
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

if (unseenPaths.length > 0) {
  // Reported, never fatal - see the note above DECLARED_PATHS for why.
  console.log(
    `[check-red-education-links] NOTE: ${unseenPaths.length} declared destination(s) not present in this build ` +
      `(${unseenPaths.slice(0, 6).join(", ")}${unseenPaths.length > 6 ? ", ..." : ""}). ` +
      `Check each and drop it from DECLARED_PATHS if the build never emits it; the list may only shrink.`,
  );
}

console.log(
  `[check-red-education-links] OK: ${total} attributed link(s) (baseline ${BASELINE_TOTAL}) across ` +
  `${foundPaths.size} declared destination(s) of ${DECLARED_PATHS.size}; Learn corpus clear.` +
  (total < BASELINE_TOTAL ? ` LOWER - drop BASELINE_TOTAL to ${total}.` : ""),
);
