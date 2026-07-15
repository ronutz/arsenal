// ============================================================================
// src/content/vendors/profiles/extreme.ts
// ----------------------------------------------------------------------------
// EXTREME NETWORKS - the convergence point of this whole section, and the one
// career vendor Rodolfo actively teaches today. The 2013-2014 RNP RedeComep
// field chapter sits on top; beneath it, the verified record: the Network
// Peripherals trio who helped write the Gigabit Ethernet standard, the 1999
// IPO, and the consolidator decade that gathered the DNA of Cabletron,
// Bay/Nortel/Avaya, Symbol/Motorola/Zebra, and Foundry/Brocade - four other
// pages of this section - under one roof.
//
// Verified 2026-07-15: Extreme S-1 (1999) founder bios (all three co-founded
// May 1996, all ex-Network Peripherals; Haddock: editor of the Gigabit
// Ethernet Standard + chairman IEEE 802.3ad; Schneider: National
// Semiconductor 1981-90, early Ethernet + FDDI chipsets; Stitt: Network
// Peripherals co-founder, Haas MBA), Wikipedia/HandWiki (Cupertino -> Santa
// Clara -> San Jose; investors Norwest/AVI/Trinity/Kleiner Perkins; IPO Apr
// 1999 NASDAQ EXTR; CEO arc Stitt -> Aug 2006, Rodriguez, Berger Apr 2013,
// Meyercord Apr 2015; Aerohive announced Jun 26, 2019, completed Aug 9,
// 2019, ~$272M; Ipanema Sep 15, 2021; the 19-company lineage roll call),
// Grokipedia (Summit1 1997, pioneering wire-speed GbE; IPO Apr 9, 1999),
// Extreme 10-Q FY2017 (Zebra WLAN announced Sep 13, 2016, Acquisition Date
// Oct 28, 2016, ~$55.0M cash), Zebra 10-K FY2016/FY2017 ($55M gross; $39M
// net; Motorola Solutions Enterprise acquired Oct 27, 2014 for $3.45B),
// Extreme PR (WiNG, NSight, AirDefense; "number three" enterprise campus).
// Prior-round canon: Enterasys announced Sep 12, 2013, ~$180M cash (R6a);
// Avaya Networking closed Jul 14, 2017, $100M headline / $79.8M net per
// Extreme 10-K/10-Q (R5); Brocade data center routing closed Oct 2017,
// $55M = $35M cash + $20M deferred, SLX/VDX/MLX lines (R2).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const extremeProfile: VendorProfile = {
  slug: "extreme",
  foundings: [
    {
      company: "Extreme Networks",
      year: 1996,
      place: "Cupertino, California (later Santa Clara, San Jose; today Morrisville, NC)",
      founders: ["Gordon Stitt", "Stephen Haddock", "Herb Schneider"],
      story:
        "Three colleagues from Network Peripherals founded Extreme in May 1996 to build wire-speed Ethernet switching for the gigabit era. Gordon Stitt - who had co-founded Network Peripherals itself - took the CEO chair he would hold for a decade. Stephen Haddock, the CTO, was not just building to the Gigabit Ethernet standard; he was an editor of it, and chaired the IEEE 802.3ad link aggregation committee. Herb Schneider, VP of Engineering, had spent 1981 to 1990 at National Semiconductor working on the industry's early Ethernet and FDDI chipsets before running LAN switch development at Network Peripherals. Norwest, AVI, Trinity, and Kleiner Perkins backed them - and purple became the color of performance Ethernet.",
    },
  ],
  timeline: [
    { year: 1996, title: "Founded by the people writing the standard", detail: "May 1996: the Network Peripherals trio starts Extreme in Cupertino, betting that multilayer Ethernet switching at wire speed - ATM performance at Ethernet cost - is where campus networking is going." },
    { year: 1997, title: "Summit1", detail: "The first product ships: Summit1, among the pioneering wire-speed Gigabit Ethernet switches - with the BlackDiamond modular chassis following to anchor the high end, and ExtremeWare (later ExtremeXOS) as the software spine." },
    { year: 1999, title: "The fourth 1999 IPO on these pages", detail: "April 9, 1999: Extreme lists on NASDAQ as EXTR - the same golden window that floated Brocade, Foundry, and Juniper. Gordon Stitt runs the company until August 2006; Ed Meyercord, CEO since April 2015, leads the era that follows." },
    { year: 2013, title: "The consolidator decade opens: Enterasys", detail: "Announced September 12, 2013: Extreme acquires Enterasys for roughly $180 million in cash - the Cabletron lineage, and the network-management DNA that becomes central to Extreme's software story. Rodolfo's own Extreme chapter opens the same season: the 2013-2014 RNP RedeComep metro deployments told above.", sourceNote: "Prior-round canon (Cabletron/Enterasys page)." },
    { year: 2016, title: "Zebra's WLAN: the Symbol and Motorola heritage", detail: "Announced September 13 and completed October 28, 2016 for approximately $55 million in cash: Zebra Technologies' wireless LAN business - the WiNG operating system, NSight, and AirDefense - whose lineage runs back through Motorola Solutions (Zebra's $3.45 billion 2014 purchase) to Symbol Technologies. Meyercord calls the result the number-three provider in enterprise campus networking.", sourceNote: "Extreme 10-Q FY2017; Zebra 10-K FY2016/FY2017." },
    { year: 2017, title: "Two more bloodlines in one year", detail: "July 14, 2017: the Avaya Networking business closes - $100 million headline, $79.8 million net - bringing the SynOptics-Wellfleet-Bay-Nortel DNA home. October 2017: Brocade's data center routing business (the Foundry lineage - SLX, VDX, MLX) arrives from Broadcom for $55 million. In four years, Extreme has gathered the estates of three of this section's other pages.", sourceNote: "Extreme 10-K/10-Q figures; prior-round canon (Nortel-Bay and Brocade pages)." },
    { year: 2019, title: "Aerohive: the cloud becomes the platform", detail: "Announced June 26 and completed August 9, 2019, at approximately $272 million: Aerohive's cloud-managed wireless and SD-WAN - the foundation on which ExtremeCloud IQ is built, turning a decade of acquired hardware estates into one cloud-managed portfolio." },
    { year: 2021, title: "SD-WAN, and a teaching chapter begins", detail: "September 15, 2021: Infovista's Ipanema SD-WAN business joins. The same year, Rodolfo becomes an Extreme Networks Certified Instructor - the start of the one relationship in this career section that is still active in the classroom today." },
    { year: 2024, title: "The lineage roll call", detail: "By its own account, Extreme's merger history carries the networking DNA of at least nineteen companies - among them Digital, Cabletron, Enterasys, Symbol, Motorola, Zebra, Wellfleet, SynOptics, Bay Networks, Nortel, Avaya, Foundry, Brocade, and Aerohive. Four of those stories have their own pages in this section; they all end here." },
  ],
  products: [
    { name: "Summit and BlackDiamond", what: "The founding franchises: wire-speed gigabit fixed switches and the modular chassis that carried campus and metro Ethernet - including the EAPS optical rings of Rodolfo's RNP deployments." },
    { name: "ExtremeXOS", what: "The modular operating system descended from ExtremeWare - the EXOS that Rodolfo deployed in the field in 2013-2014 and teaches today." },
    { name: "Fabric Engine and VOSS", what: "The Avaya-descended fabric line: shortest-path-bridging networking from the Bay and Nortel bloodline, reborn as Extreme's fabric story." },
    { name: "Wireless: WiNG to Wi-Fi 7", what: "The Symbol-Motorola-Zebra WLAN heritage plus Aerohive's cloud management - merged into the ExtremeWireless portfolio and AirDefense security." },
    { name: "ExtremeCloud IQ", what: "The Aerohive-built cloud management plane unifying the whole estate - and the platform behind the ExtremeCloud IQ courses Rodolfo delivers as a certified instructor." },
  ],
  innovations: [
    { title: "Standards from the inside", detail: "Extreme's CTO co-wrote the rules of the game - an editor of the Gigabit Ethernet standard and chair of the link aggregation effort - so the products were standards-native from day one." },
    { title: "Wire-speed multilayer switching", detail: "Summit1 helped prove that Layer 3 at gigabit wire speed on Ethernet economics beat ATM's complexity - the bet the whole campus market eventually made." },
    { title: "EAPS resilient rings", detail: "The Ethernet Automatic Protection Switching protocol brought sub-second ring failover to metro Ethernet - the mechanism at the heart of the RedeComep optical rings Rodolfo built on." },
    { title: "Consolidation as strategy", detail: "Five acquisitions in eight years - Enterasys, Zebra WLAN, Avaya Networking, Brocade data center, Aerohive - executed as a deliberate second act: buy the estates of the pioneers, unify them in the cloud." },
  ],
  markets: [
    "Extreme is where this section's stories converge: the Cabletron page, the Nortel-Bay page, and the Brocade-Foundry page all end at deals recorded here - one company quietly assembling the hub wars' surviving DNA into a cloud-managed enterprise portfolio.",
    "Rodolfo's relationship is unique in this section: field deployment in 2013-2014 (RNP RedeComep metro rings on EXOS and EAPS), and instruction ever since 2021 - Extreme is the one career-page vendor he still teaches, with nine authorized courses in the portfolio.",
  ],
  analyst: [
    "At the Zebra WLAN close, Extreme positioned itself as the number-three provider in enterprise campus networking, with the acquired WLAN assets expected to add over $115 million in annualized revenue.",
    "The consolidator decade by the numbers: Enterasys ~$180M (2013), Zebra WLAN ~$55M (2016), Avaya Networking $79.8M net (2017), Brocade data center $55M (2017), Aerohive ~$272M (2019) - roughly $640 million to gather what rivals spent tens of billions building.",
  ],
  careerLink: {
    href: "/extreme",
    label: "Extreme is a platform Rodolfo teaches today - the Extreme hub on this site",
  },
};
