// ============================================================================
// src/content/vendors/profiles/avaya.ts
// ----------------------------------------------------------------------------
// AVAYA - Bell System heritage in enterprise communications: the Lucent
// spinoff that bought Nortel's enterprise business and sold its networking
// line to Extreme. Knowledge-based, dates well-documented (2026-07-15):
// spun off from Lucent Technologies October 2000 (Lucent itself the 1996
// AT&T systems spinoff - Western Electric/Bell Labs heritage); TPG + Silver
// Lake take-private ~$8.2B 2007; wins Nortel Enterprise Solutions at the
// 2009 bankruptcy auction (~$900M, closed Dec 2009); Chapter 11 Jan 2017,
// networking business sold to Extreme Networks (2017), relisted NYSE 2018;
// Chapter 11 again Feb 2023, emerged ~May 2023 privately held. Cross-links:
// the Nortel/Bay page (this section) and the Extreme career page carry the
// other ends of two of these threads.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const avayaProfile: VendorProfile = {
  slug: "avaya",
  foundings: [
    {
      company: "Avaya",
      year: 2000,
      place: "Basking Ridge, New Jersey",
      founders: ["Spun off from Lucent Technologies"],
      story:
        "Avaya was born carrying a century of telephone heritage. When Lucent - itself the 1996 spinoff of AT&T's systems and Bell Labs lineage - shed its enterprise communications business in October 2000, the PBXs, call centers, and messaging systems that descended from Western Electric became a standalone company. Avaya inherited the installed base of corporate telephony at the exact moment voice was turning into software, and its whole subsequent story - private equity, the Nortel auction, two bankruptcies, the cloud pivot - is the drama of carrying that inheritance across the IP transition.",
    },
  ],
  timeline: [
    { year: 2000, title: "Spun off from Lucent", detail: "The enterprise communications business of Lucent Technologies lists as Avaya - Bell System DNA, now selling PBXs and contact centers under its own flag as VoIP arrives in earnest." },
    { year: 2007, title: "Private equity takes over", detail: "TPG and Silver Lake take Avaya private for roughly $8.2 billion - the leveraged chapter whose debt load shapes the following fifteen years." },
    { year: 2009, title: "The Nortel auction", detail: "Avaya wins Nortel's Enterprise Solutions business for about $900 million at the bankruptcy auction - absorbing its great rival's enterprise voice base and, with it, the data-networking line that traces to Bay Networks (that story continues on this section's Nortel/Bay page)." },
    { year: 2017, title: "Chapter 11, and networking to Extreme", detail: "Avaya files Chapter 11 in January to restructure the buyout debt; as part of the reshaping, the networking business - the old Nortel/Bay lineage - goes to Extreme Networks, whose career page tells the buyer's side. Avaya relists on the NYSE in 2018 as a software and services company." },
    { year: 2023, title: "The second restructuring", detail: "A pre-packaged Chapter 11 in February 2023 cuts the debt again; Avaya emerges within months, privately held and refocused on Avaya Experience Platform - the contact center as its center of gravity.", sourceNote: "Emergence timing per 2023 press coverage." },
  ],
  products: [
    { name: "Avaya Experience Platform", what: "The contact center as a service line - the modern descendant of decades of call-center engineering." },
    { name: "Avaya Aura", what: "The enterprise UC and call-control platform carrying the PBX lineage into IP." },
    { name: "Communication Manager heritage", what: "The Definity/Communication Manager line - Western Electric to Lucent to Avaya, one unbroken telephony bloodline." },
  ],
  innovations: [
    { title: "Enterprise voice at Bell scale", detail: "Avaya inherited and operated the largest installed base in corporate telephony - the reference implementation of how big organizations talk." },
    { title: "The consolidation crossroads", detail: "The 2009 Nortel purchase made Avaya the meeting point of the two great enterprise-voice lineages - and its networking divestiture to Extreme in 2017 seeded another vendor taught on this site." },
  ],
  markets: [
    "Avaya today is a privately held contact-center and UC vendor serving a vast installed base, competing with cloud-native CCaaS players while monetizing the deepest legacy estate in enterprise voice.",
  ],
  analyst: [
    "A fixture of the UC and contact-center evaluations for two decades - the incumbent every challenger measured against, through every ownership chapter.",
  ],
};
