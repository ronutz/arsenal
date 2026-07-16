// ============================================================================
// src/content/vendors/profiles/cabletron-enterasys.ts
// ----------------------------------------------------------------------------
// CABLETRON & ENTERASYS - RODOLFO'S ORIGIN STORY, told with the full corporate
// record beneath it. Founded March 1983 in Robert Levine's garage; the
// acquisition spree PRIME asked to capture is here in SEC detail: Network
// Express (1996), NetVantage (1998), Yago Systems (Mar 17, 1998 - $165.7M,
// renamed Riverstone), the $430M DEC Network Products Business, and the DSL
// makers Ariel and FlowPoint. Then the 2000 four-way split, the Enterasys
// years, and the 2013 landing at Extreme Networks.
//
// Verified 2026-07-14 against primary sources: Cabletron SEC 10-Q/A FY1998
// (Yago Mar 17, 1998: ~25% pre-owned, 6.0M shares + 5.5M contingent, $165.7M
// cost, $150M IPR&D; NetVantage $33.9M IPR&D), Riverstone SEC 424B4 FY2001
// ("Cabletron renamed Yago to Riverstone"; 5.2M contingent shares issued Sep
// 8, 1999), Cabletron SEC S-4 FY1998 (DEC NPB reseller terms; Levine resigned
// Sep 1, 1997), Network Express SEC 8-K FY1996, Forbes Oct 1998 ($430M DEC;
// Ariel + FlowPoint; Levine's machete), Wikipedia Cabletron/Enterasys/Craig
// Benson (founding, ST-500, MMAC, split fates, $50.4M SEC settlement, Gores
// $386M, Extreme $180M), EE Times + Computerworld Feb 2000 (the split).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const cabletronEnterasysProfile: VendorProfile = {
  slug: "cabletron-enterasys",
  foundings: [
    {
      company: "Cabletron Systems",
      year: 1983,
      place: "Massachusetts (a garage); Rochester, New Hampshire from 1985",
      founders: ["Robert Levine", "Craig Benson"],
      story:
        "In March 1983 a customer asked 25-year-old cable salesman Robert Levine for 1,000 feet of specialized network cable - and his supplier refused to cut less than 10,000. Levine and 28-year-old Craig Benson, a materials specialist from LAN pioneer Interlan, started cutting cable themselves in Levine's garage. They moved to New Hampshire in 1985 for the taxes, the cheap factory space, and the engineers shed by Route 128's fading minicomputer giants, and went public in 1989. Levine ran sales meetings in combat fatigues swinging a machete; Benson later became the 79th Governor of New Hampshire. At the peak: 6,600 employees and revenue past US$1.8 billion.",
    },
  ],
  timeline: [
    { year: 1983, title: "Founded in a garage", detail: "March 1983: Levine and Benson start cutting Ethernet cable no supplier would sell in small lots. Within two years they are installing networks and designing their own equipment in Rochester, New Hampshire." },
    { year: 1988, title: "The MMAC era begins", detail: "Cabletron's first hit products - the ST-500, the first Ethernet transceiver with diagnostic LEDs, and the LAN-MD field test set - lead to the MMAC modular hubs. High-density 10BASE-T modules (24 or 48 ports per slot) and the Prism element manager make the MMAC-8 the wiring closet of the early 1990s.", sourceNote: "Product history per Wikipedia's Cabletron article; the MMAC family dates from the late 1980s as 10BASE-T standardized." },
    { year: 1989, title: "IPO and the climb", detail: "Cabletron goes public. Revenue passes $418 million by 1993 and US$1 billion in 1996 - one of networking's 'big four' alongside Cisco, Bay, and 3Com, famous for a sales culture as aggressive as its engineering. Early on it even co-developed a Cisco router module for the MMAC-8, before building routing of its own." },
    { year: 1996, title: "The acquisition spree opens: Network Express", detail: "Cabletron buys ISDN switched-access maker Network Express to fold dial-up remote access into its platforms - the first of a string of deals meant to buy what Rochester had not built.", sourceNote: "Network Express SEC 8-K, 1996." },
    { year: 1997, title: "Leadership breaks; the DEC deal", detail: "On September 1, 1997 Levine resigns as president and CEO and Benson steps back to chairman. Cabletron agrees to acquire Digital Equipment Corporation's Network Products Business for about $430 million - a channel of distributors, the GIGAswitch heritage, and a reseller pact with Digital running to mid-2001, operated as the Digital Network Products Group.", sourceNote: "Cabletron SEC S-4 FY1998; $430M per Forbes, Oct 1998." },
    { year: 1998, title: "Yago Systems: the best thing Cabletron ever bought", detail: "March 17, 1998: already holding about 25 percent of the startup, Cabletron acquires wire-speed router maker Yago Systems for roughly $165.7 million in stock - 6.0 million shares up front, 5.2 million more issued in September 1999 under the deal's $35-per-share guarantee, with $150 million written off as in-process R&D. Yago's SmartSwitch Router promised 100 times the performance of software routers; an analyst later called Yago 'the best thing Cabletron ever bought into.' The same year brings Fast Ethernet switch maker NetVantage and DSL makers Ariel and FlowPoint.", sourceNote: "Cabletron 10-Q/A and Riverstone 424B4 SEC filings; Forbes, Oct 1998; Computerworld, Feb 2001." },
    { year: 2000, title: "The four-way split", detail: "February 2000, CEO Piyush Patel - himself Yago's former chief executive - splits Cabletron into four: Riverstone Networks (Santa Clara, service providers, the Yago line, led by Romulus Pereira), Enterasys Networks (Rochester, the enterprise, led by Henry Fiallo), Aprisma Management Technologies (the Spectrum management suite, Michael Skubisz), and GNTS (professional services, Earle Humphreys). Cabletron becomes a holding company with 4,500 employees, manufacturing already sold to Flextronics.", sourceNote: "EE Times and Computerworld, Feb 2000." },
    { year: 2001, title: "Cabletron ceases to exist", detail: "Riverstone IPOs in February 2001 and is distributed to shareholders that summer - the only true spin-off. The holding company folds into Enterasys in August 2001, and the Cabletron name passes into history eighteen years after the garage." },
    { year: 2003, title: "Enterasys pays for its numbers", detail: "A 2002 revenue-recognition restatement erases the first post-spin profits; the SEC investigation and shareholder suits settle in October 2003 for $50.4 million, and in December 2006 four former executives are sentenced to prison." },
    { year: 2006, title: "Private under Gores", detail: "The Gores Group and Tennenbaum Capital take Enterasys private for about $386 million (announced November 2005, closed March 2006); in 2008 Gores pairs it with a 51 percent stake in Siemens Enterprise Communications in a $550 million transaction." },
    { year: 2013, title: "The DNA lands at Extreme", detail: "September 12, 2013: Extreme Networks announces the acquisition of Enterasys for about $180 million in cash ($105 million from hand, $75 million borrowed), roughly doubling Extreme's revenue. The Cabletron lineage - and the customer base Rodolfo served from Brazil - lives on at one of the four vendors he teaches today.", sourceNote: "Network World and Network Computing, Sep 2013." },
    { year: 1996, personal: true, title: "Rodolfo's chapter opens", detail: "1996 to 2000 at Cabletron Systems in Brazil - the first job of a career that begins in the thick of the hub wars - and a second tour, 2005 to 2007, at Enterasys, inside the same lineage after the split." },
  ],
  products: [
    { name: "ST-500 and LAN-MD", what: "The founding products: the first Ethernet transceiver with diagnostic LEDs and the first practical field test set for 10BASE5 - tools for the era when thick-coax Ethernet was nearly undebuggable." },
    { name: "MMAC modular hubs", what: "The MMAC-8, -5 and -3 with high-density 10BASE-T modules and the Prism element manager - the structured-cabling closets of the early 1990s, and Cabletron's answer to SynOptics." },
    { name: "SPECTRUM", what: "The network management platform whose model-based intelligence outlived everything else: spun out as Aprisma in 2000, sold to Concord Communications, then to Computer Associates for $350 million - still a management lineage today." },
    { name: "SmartSwitch Router (Yago)", what: "Wire-speed Layer 3/4 switching from the 1998 Yago acquisition - the product that became Riverstone's carrier line and Enterasys' enterprise routing core." },
    { name: "Digital Network Products Group", what: "The $430 million DEC networking estate: GIGAswitch heritage, an installed base, and a reseller channel that briefly made Cabletron Digital's strategic network partner." },
  ],
  innovations: [
    { title: "Diagnosability as a product", detail: "Cabletron's first wins came from making Ethernet observable - LEDs on the transceiver, a test set in the field bag - a philosophy that matured into SPECTRUM's model-based management." },
    { title: "The buy-versus-build pivot", detail: "Late-1990s Cabletron tried to acquire its way into routing and WAN access - Network Express, NetVantage, Ariel, FlowPoint, the DEC estate, and above all Yago - a spree whose one unqualified success seeded two companies." },
    { title: "Creative destruction as strategy", detail: "The 2000 four-way split was one of the era's boldest corporate acts: dissolving a billion-dollar brand on purpose so its parts could survive - and three of the four did." },
  ],
  markets: [
    "Cabletron was one of networking's 'big four' of the 1990s - with Cisco, Bay Networks, and 3Com - peaking past US$1.8 billion in revenue and 6,600 employees before the LAN hub market it dominated commoditized underneath it.",
    "Every thread found a home: the enterprise line through Enterasys to Extreme Networks (2013), the Yago routing line through Riverstone to a 2006 bankruptcy sale to Lucent, and SPECTRUM through Aprisma and Concord to Computer Associates. Rodolfo lived two chapters from Brazil - Cabletron 1996-2000 and Enterasys 2005-2007 - and teaches the surviving lineage at Extreme today.",
  ],
  analyst: [
    "Joel Conover, Current Analysis, on the 1998 deal that mattered: 'The Yago group was the best thing Cabletron ever bought into' - its technology and people powered both Enterasys and Riverstone after the split.",
    "The ledger of the spree, per SEC filings: Yago at $165.7 million produced two companies; the $430 million DEC estate was resold within three years as the split refocused the portfolio.",
  ],
};
