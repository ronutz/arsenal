// ============================================================================
// NOKIA - paper mill to network giant. VERIFIED 2026-07-16 via Nokia SEC 6-K
// filings: Justin Hotard (ex-Intel Data Center & AI) President and CEO from
// April 1, 2025, succeeding Pekka Lundmark (CEO 2020-March 2025); Infinera
// acquisition COMPLETED February 28, 2025. Knowledge-based bedrock: founded
// 1865 by Fredrik Idestam (paper mill, Tammerkoski rapids); Finnish Rubber
// Works + Finnish Cable Works merge into Nokia Corporation 1967; Ollila's
// 1992 telecom-only pivot; world's largest phone maker 1998-2011; Elop's
// 2011 "burning platform"; devices to Microsoft 2014 (~EUR 5.44B); Nokia
// Siemens Networks JV 2007 (full ownership 2013); Alcatel-Lucent (with Bell
// Labs) acquired 2016. Today: one of the three global mobile-network makers.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const nokiaProfile: VendorProfile = {
  slug: "nokia",
  foundings: [
    {
      company: "Nokia",
      year: 1865,
      place: "Tampere, Finland",
      founders: ["Fredrik Idestam"],
      story:
        "Nokia is the industry's great shapeshifter. Fredrik Idestam's 1865 wood-pulp mill by the Tammerkoski rapids became, through an 1967 three-way merger with Finnish Rubber Works and Finnish Cable Works, a conglomerate that made everything from boots to televisions. Jorma Ollila's 1992 decision to bet the entire company on telecommunications produced the most recognizable brand of the mobile decade - and when the smartphone wars took that crown away, Nokia shapeshifted again, into one of the three companies on earth that can build a national mobile network end to end.",
    },
  ],
  timeline: [
    { year: 1865, title: "A paper mill", detail: "Idestam grinds wood pulp on the Nokianvirta river; the 1967 merger with the rubber and cable works creates Nokia Corporation - cables being the thread that leads, decades later, to telecommunications." },
    { year: 1992, title: "The Ollila pivot", detail: "New CEO Jorma Ollila sheds everything but telecom just as GSM launches - Nokia had carried the world's first GSM call in 1991 - and rides digital mobile from Nordic experiment to global standard." },
    { year: 1998, title: "The crown", detail: "Nokia passes Motorola as the world's largest phone maker and holds the title for thirteen years - the 3310 and its kin become the most-manufactured electronics of their era." },
    { year: 2011, title: "The burning platform", detail: "Stephen Elop's memo concedes the smartphone war; the Windows Phone alliance follows, and in 2014 the devices business itself goes to Microsoft for roughly EUR 5.44 billion. What remains is the networks company." },
    { year: 2016, title: "Alcatel-Lucent, and Bell Labs", detail: "Nokia completes the acquisition of Alcatel-Lucent - absorbing the French-American lineage and, with it, Bell Labs itself - having already taken full ownership of the Siemens network venture in 2013. The infrastructure giant is assembled." },
    { year: 2025, title: "Optics, and a new captain", detail: "February 28, 2025: the Infinera acquisition closes, deepening optical networks for the AI-datacenter era. April 1: Justin Hotard, from Intel's Data Center and AI group, becomes President and CEO - a data-center executive for a data-center decade.", sourceNote: "Nokia 6-K filings, 2025." },
  ],
  products: [
    { name: "Mobile Networks", what: "RAN from 2G through 5G Advanced: one of the three vendors that build the world's mobile networks." },
    { name: "Network Infrastructure", what: "Fixed, IP routing, and - with Infinera - optical: the wireline half of the giant." },
    { name: "Nokia Bell Labs", what: "The inherited crown jewel: the laboratory of the transistor, information theory, and Unix, still inventing." },
  ],
  innovations: [
    { title: "GSM at scale", detail: "Nokia turned the European digital standard into the world's phone system - and the phone into the first universal computer." },
    { title: "Corporate reinvention as a discipline", detail: "Paper, rubber, cables, televisions, phones, networks: no company in this section has successfully changed what it fundamentally is more times." },
  ],
  markets: [
    "Nokia competes globally in mobile and fixed network infrastructure against Ericsson and Huawei, with growing data-center and defense lines - the Finnish giant's third act, captained since 2025 by a data-center specialist.",
  ],
  analyst: [
    "A permanent fixture of the telecom-infrastructure evaluations, and before that the defining vendor of the handset era the smartphone unmade.",
  ],
};
