#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/audit-neutral-depth.mjs — a REPORT, not a guard.
//
// PRIME's spec for neutral articles (SPEC-ARTIGO-NEUTRO-20260830) asks for
// origins, evolution, technical specification, architecture, interoperability,
// dependencies, what it enables, and the vendor landscape - "as appropriate".
// Six articles were retrofitted to it. This answers the obvious next question:
// which of the OTHER neutral articles were written before the spec and still
// read thin?
//
// It deliberately does NOT fail a build. Depth is a judgement, and a script
// that enforced it would start rewarding keyword-stuffing within a week. This
// only ranks candidates so a person can choose.
//
// CLASSIFICATION, because the spec does not apply uniformly:
//   - VENDOR articles are excluded; they are product documentation by design.
//   - NARRATIVE articles (history, lore, incidents, people) are excluded from
//     the "missing vendor landscape" judgement: a piece about the Morris worm
//     has no vendor landscape, and demanding one would make it worse.
//   - TECHNOLOGY explainers are where the spec applies in full.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";

const DIR = "src/content/learn/en";

// Vendor detection, widened after the first run leaked product articles into
// the queue: "irules-*" survived \birule\b (the trailing s defeats the
// boundary), and awaf / checkpoint / bigip were never listed at all.
const VENDOR =
  /(forti\w*|f5|big-?ip|bigip|tmos|tmsh|irules?|awaf|nginx|netskope|extreme|exos|zscaler|zpa|zia|ping\w*|volterra|check\s?point|checkpoint|asm|apm|ltm|gtm|meraki|panorama)/i;

// Craft notes: short, deliberate pieces about HOW TO WORK rather than about a
// technology. The spec does not apply to them - demanding a vendor landscape in
// "root cause is a verb, not a noun" would damage it - so they are reported
// separately rather than queued.
const CRAFT_HINT =
  /(first-hour|blast-radius-thinking|root-cause|tac-cases|change-windows|before-you|that-do-not|how-to-|-checklist|troubleshoot|map-the-path|what-you-emit)/i;

// Signals that a piece is narrative rather than a technology explainer.
const NARRATIVE_HINT =
  /\b(worm|hacker|history|scene|conference|pioneer|manifesto|war|crypto-wars|phreak|mitnick|poulsen|lore|cybercrime|shutdown|chokepoint|414s|l0pht|defcon|anonymous|stuxnet|wank|lod|mod|phrack|cuckoo)\b/i;

// FIRST ATTEMPT FAILED ITS OWN POSITIVE CONTROL, AND THAT IS RECORDED HERE
// BECAUSE THE REASON GENERALISES.
//
// The detectors below started as keyword and heading matchers for "origins",
// "evolution", "architecture" and so on. Run against the eight articles known
// to have been written to the spec, seven reported dimensions MISSING that are
// demonstrably present: load balancing carries a five-generation history under
// the heading "Origins: it started as a DNS trick", and the matcher wanted the
// word "evolution" in a heading. It was measuring MY HEADING VOCABULARY and
// reporting it as article depth.
//
// A probe that disagrees with a known-true case is wrong until proven
// otherwise. So the heuristics are gone, replaced by things that can actually
// be counted and defended:
//
//   standards   - citations of RFC / IEEE / NIST / W3C / ITU
//   vendors     - how many DISTINCT vendor names appear in prose
//   years       - explicit dates, the cheapest reliable signal of history
//   sections    - how many ## headings the piece carries
//   words       - length, an imperfect but honest proxy
//
// None of these is depth. Together they separate "a short explainer with no
// history, no standard and no market" from "a piece that has been given the
// full treatment", which is all a queue needs to do. The judgement stays with
// a person.

const VENDOR_NAMES = [
  "Cisco","Juniper","Arista","Nokia","Huawei","HPE","Aruba","Extreme","Fortinet",
  "Palo Alto","Check Point","F5","Citrix","A10","Radware","NetScout","Cloudflare",
  "Akamai","Fastly","AWS","Amazon","Microsoft","Google","Oracle","IBM","Red Hat",
  "VMware","Broadcom","Illumio","Zscaler","Netskope","Okta","Ping","Splunk",
  "Elastic","Veeam","Commvault","Veritas","Rubrik","Cohesity","Ubiquiti","Meraki",
  "Ruckus","CommScope","Cambium","Mist","HAProxy","NGINX","Envoy","Istio","Linkerd",
  "Wazuh","Sigma","Traefik","Canonical","SUSE","Debian","Cloudera","Nutanix",
];

function signals(body) {
  const standards = (body.match(/\b(RFC\s?\d{3,5}|IEEE\s?\d{3}\.\d+|NIST\s?SP|W3C|ITU-T)\b/g) ?? []).length;
  const vendors = new Set(
    VENDOR_NAMES.filter((v) => new RegExp(`(?<![A-Za-z])${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z])`).test(body)),
  ).size;
  const years = (body.match(/\b(19[6-9]\d|20[0-2]\d)\b/g) ?? []).length;
  const sections = (body.match(/^##\s+/gm) ?? []).length;
  return { standards, vendors, years, sections };
}

const rows = [];
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".mdx"))) {
  const raw = readFileSync(`${DIR}/${file}`, "utf8");
  const parts = raw.split("---");
  const fm = parts[1] ?? "";
  const body = parts.slice(2).join("---");
  const slug = file.replace(/\.mdx$/, "");
  const title = (fm.match(/^title: "(.*)"$/m) ?? [, ""])[1];

  if (VENDOR.test(slug) || VENDOR.test(title)) continue;

  const narrative = NARRATIVE_HINT.test(slug) || NARRATIVE_HINT.test(title);
  const craft = CRAFT_HINT.test(slug);
  const words = body.split(/\s+/).filter(Boolean).length;

  const sig = signals(body);
  // "Thin" is a combination, not a single number: short AND lacking the two
  // signals that separate an explainer from a treatment.
  const thinScore =
    (words < 1100 ? 1 : 0) +
    (sig.standards === 0 ? 1 : 0) +
    (!narrative && sig.vendors < 2 ? 1 : 0) +
    (sig.years < 2 ? 1 : 0) +
    (sig.sections < 6 ? 1 : 0);
  rows.push({ slug, words, narrative, craft, ...sig, thinScore });
}

const tech = rows.filter((r) => !r.narrative && !r.craft);
const craftRows = rows.filter((r) => r.craft);
const narr = rows.filter((r) => r.narrative);

console.log(
  `[audit-neutral-depth] ${rows.length} neutral article(s): ${tech.length} technology, ${narr.length} narrative.
`,
);

const CONTROL = [
  "load-balancing-what-actually-decides-where-a-request-goes",
  "siem-and-detection-engineering",
  "ddos-what-actually-absorbs-an-attack",
  "cgnat-address-sharing-and-attribution",
  "backups-and-ransomware-recovery",
  "zero-trust-ztna-and-sase-without-the-marketing",
  "network-segmentation-from-vlans-to-microsegmentation",
  "wireless-networking-from-802-11-to-wifi-7",
];

const fmt = (r) =>
  `${String(r.words).padStart(5)}w  std:${String(r.standards).padStart(2)}  vendors:${String(r.vendors).padStart(2)}  years:${String(r.years).padStart(2)}  sect:${String(r.sections).padStart(2)}  thin:${r.thinScore}  ${r.slug}`;

console.log("POSITIVE CONTROL - the eight written to the spec (expect low thin scores):");
for (const slug of CONTROL) {
  const r = rows.find((x) => x.slug === slug);
  console.log(r ? `  ${fmt(r)}` : `  ${slug}: NOT FOUND`);
}
const ctl = CONTROL.map((s) => rows.find((x) => x.slug === s)).filter(Boolean);
const worstControl = Math.max(...ctl.map((r) => r.thinScore));
console.log(`  -> worst control thin score: ${worstControl}`);

const candidates = tech
  .filter((r) => !CONTROL.includes(r.slug))
  .filter((r) => r.thinScore > worstControl)
  .sort((a, b) => b.thinScore - a.thinScore || b.words - a.words);

console.log(`
QUEUE - technology explainers thinner than every control (${candidates.length}):
`);
for (const r of candidates.slice(0, 25)) console.log(`  ${fmt(r)}`);
if (candidates.length > 25) console.log(`  ... and ${candidates.length - 25} more`);
