// ============================================================================
// src/content/vendors/profiles/mikrotik.ts
// ----------------------------------------------------------------------------
// MIKROTIK - LATVIA'S QUIET GIANT. Founded 1996 in Riga; RouterOS (1997) put
// carrier-grade routing on commodity x86 PCs, RouterBOARD (2002) put it on
// MikroTik's own hardware, and the price-performance combination made the
// company ubiquitous among ISPs and WISPs worldwide - and, in 2022, the first
// private company in Latvia to pass a EUR 1 billion valuation.
//
// Verified 2026-07-14: Wikipedia (founders, 2022 valuation, employee count),
// mikrotik.com about pages (1997 RouterOS, 2002 RouterBOARD, Riga address),
// industry profiles (ISP/WISP market position).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const mikrotikProfile: VendorProfile = {
  slug: "mikrotik",
  foundings: [
    {
      company: "MikroTik (SIA Mikrotīkls)",
      year: 1996,
      place: "Riga, Latvia",
      founders: ["John Tully", "Arnis Riekstiņš"],
      story:
        "Founded in post-Soviet Riga to build routing for Internet service providers who could not afford the incumbents. The founding insight was software-first: develop networking software for standard x86 PC hardware and let commodity economics do the rest. That software became RouterOS in 1997, and when the company started building its own boards in 2002, the RouterBOARD line was born - carrier-grade features at prices no established vendor would touch.",
    },
  ],
  timeline: [
    { year: 1996, title: "Founded in Riga", detail: "John Tully and Arnis Riekstiņš start MikroTik to develop routers and wireless ISP systems, writing networking software for ordinary x86 PCs." },
    { year: 1997, title: "RouterOS", detail: "The Linux-based routing software ships: packet forwarding, NAT, firewalling, and an unusual depth of control for all kinds of data interfaces - on hardware anyone could buy." },
    { year: 2002, title: "RouterBOARD", detail: "MikroTik decides to make its own hardware; the RouterBOARD brand is born, pairing RouterOS with purpose-built boards and creating the price-performance formula the company is known for.", sourceNote: "Dates per MikroTik's own company history." },
    { year: 2022, title: "Latvia's first private billion", detail: "Valued at EUR 1.30 billion, MikroTik becomes the 4th largest company in Latvia and the first private Latvian company to surpass EUR 1 billion in value." },
    { year: 2023, title: "Small team, global footprint", detail: "Roughly 367 employees in Riga serve customers in nearly every country - one of the industry's most extreme revenue-per-employee stories, entirely private and founder-controlled." },
  ],
  products: [
    { name: "RouterOS", what: "The Linux-based network operating system: routing, firewall, VPN, bandwidth management, hotspot, and wireless in a single image - the same OS from a USD 50 home router to ISP aggregation." },
    { name: "RouterBOARD", what: "MikroTik's own hardware line, from tiny SOHO devices to the CCR series of ISP-grade cloud core routers, plus switches and 60 GHz wireless links." },
    { name: "The certified ecosystem", what: "A worldwide network of certified trainers and consultants grew around RouterOS - MikroTik expertise became a marketable skill in its own right across ISP markets." },
  ],
  innovations: [
    { title: "Software-first routing on commodity hardware", detail: "Years before 'white box' and NFV became industry vocabulary, MikroTik shipped carrier features as software on standard PCs." },
    { title: "Price-performance disruption", detail: "Feature depth that rivals enterprise vendors at a fraction of the cost - the formula that built the WISP industry in emerging markets." },
    { title: "One OS across the whole line", detail: "RouterOS is the same system everywhere, so skills, scripts, and configurations transfer from the smallest device to the data center edge." },
  ],
  markets: [
    "MikroTik is one of the most widely deployed networking brands among ISPs and wireless ISPs worldwide, with particular strength in emerging markets - including Brazil, where MikroTik gear forms the backbone of countless provider networks in the ISP world Rodolfo grew up in professionally.",
    "The company remains privately held and independent in an industry defined by consolidation - no IPO, no acquisition, no outside control: the counter-example to every other story in this section.",
  ],
  analyst: [
    "In 2022 MikroTik was reported as Latvia's 4th largest company by value (EUR 1.30 billion) and the first private company in the country's history to pass the EUR 1 billion mark.",
  ],
};
