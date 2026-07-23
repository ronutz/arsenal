// ============================================================================
// DOLCH COMPUTER SYSTEMS - the luggable the Sniffer lived in. Live-verified
// 2026-07-22 (Wikipedia, Centre for Computing History, Kontron press release,
// Computer History Museum catalog): founded 1987 by Volker Dolch in
// California; rugged suitcase-format portables; the PAC series (486 and
// Pentium era) was the canonical field platform for Network General's
// Sniffer analyzer - CHM's own collection catalogs PAC 62/63/64 as "network
// general sniffer platform". Volker Dolch sold his interest in 1996 but ran
// the company until retiring in 2001; VDC ranked Dolch number one in rugged
// portables in 1999 and 2002; Kontron AG acquired the company from
// Siegel-Robert in February 2005 and sold the rugged mobile platform to
// Azonix in 2007. Cross-references the sniffer-lineage profile - the
// software bloodline that made these boxes famous.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const dolchProfile: VendorProfile = {
  slug: "dolch",
  foundings: [
    {
      company: "Dolch Computer Systems",
      year: 1987,
      place: "California, United States",
      founders: ["Volker Dolch"],
      story:
        "Volker Dolch built the machine the field actually needed: a suitcase you could check as luggage, open on a data-center floor, and trust with full-length expansion cards no laptop would ever take. The PAC-series luggables paired industrial build with commercial buses (EISA, VESA Local Bus, later PCI), which made them the natural home for the era's heaviest field software - and one tenant above all made the brand: Network General's Sniffer shipped on Dolch portables so routinely that the Computer History Museum catalogs PAC models simply as 'Sniffer platform'. For a generation of network engineers, the gray Dolch case WAS what a protocol analyzer looked like.",
      sourceNote:
        "Founding year, founder, and fate per Wikipedia and the Centre for Computing History; the Sniffer-platform pairing per the Computer History Museum collection catalog (PAC 62/63/64).",
    },
  ],
  timeline: [
    { year: 1987, title: "The rugged luggable", detail: "Dolch begins building high-end ruggedized portables for engineers - suitcase-format machines with real expansion slots, aimed at industrial, military, and test-and-measurement work." },
    { year: 1992, title: "PAC-60 and the analyzer era", detail: "The 486-class PAC-60 (and the Pentium PACs that follow) become the definitive field chassis for network analysis: multi-slot, multi-interface, and strong enough to live in a crash cart." },
    { year: 1996, title: "Founder steps back from ownership", detail: "Volker Dolch sells his interest in the company but continues to run it until retiring in 2001.", sourceNote: "Per Wikipedia's company record." },
    { year: 1999, title: "Ranked number one", detail: "Venture Development Corporation ranks Dolch first in the rugged portable market - a ranking it repeats in 2002.", sourceNote: "Per the Centre for Computing History and Kontron's 2005 acquisition release." },
    { year: 2005, title: "Kontron acquires Dolch", detail: "Kontron AG buys Dolch Computer Systems from Siegel-Robert in February 2005; Dolch operates as a business unit of Kontron America.", sourceNote: "Per Kontron's acquisition announcement, February 25, 2005." },
    { year: 2007, title: "The line moves on", detail: "Kontron sells the rugged mobile platform to Azonix - the end of the Dolch name, though the gray luggables soldier on in fields and eBay listings for years." },
  ],
  products: [
    { name: "PAC series (PAC 60-65)", what: "Suitcase-format rugged portables with full-size expansion slots - 486 through Pentium MMX - the canonical Sniffer field platform." },
    { name: "Rugged displays", what: "Shock-, vibration-, and environment-sealed touch displays for industrial and military installations." },
  ],
  innovations: [
    { title: "The field-analysis chassis", detail: "Dolch understood that serious field tooling needed desktop-class buses in a portable body. The PACs carried the multi-interface capture hardware that laptops of the day simply could not - making deep protocol analysis a portable discipline." },
  ],
  markets: [
    "Rugged portables for test and measurement, oil and gas, military, and public safety - with the network-analysis market as the visible crown: wherever a Sniffer went in the 1990s, a Dolch usually carried it.",
  ],
  analyst: [
    "Included in the pioneer lineage as infrastructure-of-the-craft: the hardware half of the packet-analysis story told in the Sniffer lineage profile. Twice ranked first in its market before the 2005 Kontron acquisition and the 2007 Azonix handoff closed the chapter.",
  ],
};
