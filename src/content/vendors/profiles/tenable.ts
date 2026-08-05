// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-04 against Wikipedia (founded
// 16 September 2002 by Gula, Huffard and Deraison; Columbia, Maryland; 2023
// revenue $799M with a $52M operating loss; ~2,000 staff; co-CEOs Steve Vintz
// and Mark Thurmond; Art Coviello chairman) and 2026 pricing pages (Nessus
// Professional $4,790/yr, Nessus Expert $6,790/yr, Tenable Vulnerability
// Management from $3,500/yr for 100 assets).
//
// THE BODY ALREADY ARGUES the Nessus closing of 2005 and what it cost, the
// bootstrapped decade, and the move from scanning to prioritisation. This adds
// the timeline, products, markets and analyst standing.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const tenableProfile: VendorProfile = {
  slug: "tenable",
  foundings: [
    {
      company: "Nessus",
      year: 1998,
      place: "France",
      founders: ["Renaud Deraison"],
      story:
        "Released in April by a seventeen-year-old, as free software, because the commercial scanners of the day were expensive and the author wanted one. It became the default vulnerability scanner of the internet before there was a company attached to it.",
    },
    {
      company: "Tenable Network Security",
      year: 2002,
      place: "Columbia, Maryland",
      founders: ["Renaud Deraison", "Ron Gula", "Jack Huffard"],
      story:
        "Founded on 16 September. Gula had worked at the National Security Agency and written the Dragon intrusion detection system; the combination put a widely deployed scanner and operational detection experience in the same company.",
    },
  ],
  timeline: [
    { year: 1998, title: "Nessus 1.0", detail: "Free, open source, and quickly the standard scanner in the field." },
    { year: 2002, title: "Company founded", detail: "16 September, in Maryland, around the scanner and Gula's detection work." },
    { year: 2005, title: "Nessus 3 closes the source", detail: "In October the scanner became proprietary. The stated reason was funding the engineering; the effect was that a tool the community had helped build stopped being theirs." },
    { year: 2012, title: "First institutional money", detail: "A $50M Series A from Accel, ten years after founding - unusually late, and a sign the business had been funding itself." },
    { year: 2018, title: "NASDAQ listing", detail: "Listed as TENB." },
    { year: 2023, title: "Scale and losses", detail: "Revenue of $799M against an operating loss of $52M with around 2,000 staff - the ordinary shape of a subscription business still buying growth." },
  ],
  products: [
    { name: "Nessus", what: "The scanner, still sold directly - Professional for practitioners, Expert adding web application and external attack surface coverage. It remains the reference implementation most engineers have used." },
    { name: "Tenable Vulnerability Management", what: "The cloud platform built around the scanner, priced per asset, aimed at continuous assessment rather than periodic scans." },
    { name: "Tenable Security Center", what: "The on-premises deployment, for organisations that cannot or will not send scan data to a vendor's cloud - which remains a real requirement in defence and regulated sectors." },
    { name: "Tenable One", what: "The exposure management platform: asset inventory, identity exposure and cloud posture folded into one view alongside vulnerability findings." },
    { name: "Tenable OT Security", what: "Industrial and operational technology, where passive discovery matters because active scanning can disrupt equipment that was never designed to be probed." },
  ],
  innovations: [
    { title: "Plugin coverage as the actual product", detail: "A scanner is only as good as its checks, and maintaining tens of thousands of them across every operating system, appliance and library is unglamorous, continuous work. Buyers still decide on this rather than on the platform branding above it." },
    { title: "Closing the source to fund the engineering", detail: "The 2005 decision is the company's defining one and cuts both ways. It funded two decades of that maintenance; it also converted community contribution into a commercial asset, and the open-source forks that followed never matched the coverage." },
    { title: "Passive discovery for networks you must not disturb", detail: "Watching traffic to infer what is on a network, rather than probing it, is the only safe approach in industrial environments - and the technique that let vulnerability management reach beyond IT." },
    { title: "Prioritisation as the answer to volume", detail: "Once a scan returns fifty thousand findings, the scan is no longer the hard part. Scoring which findings are actually reachable and actually exploited is where the category moved." },
  ],
  markets: [
    "Enterprise and government, with a strong position in United States federal and defence work that follows from the on-premises option and the founders' background. Priced from a few thousand a year for small estates to six figures for large ones.",
    "It competes directly with Qualys and Rapid7, both on this timeline, and increasingly with cloud-native posture vendors approaching the same problem from the other end.",
  ],
  analyst: [
    "Consistently placed among the leaders in vulnerability and exposure assessment evaluations, with Nessus itself functioning as the informal benchmark competitors are measured against.",
    "The category-wide observation is worth recording: all three of the established vendors are repositioning around exposure management, and none has completed the transition - so purchases are still decided on scanner coverage, scan architecture and risk scoring rather than on the platform branding.",
  ],
};
