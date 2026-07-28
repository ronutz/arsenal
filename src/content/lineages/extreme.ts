// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/lineages/extreme.ts
// ----------------------------------------------------------------------------
// EXTREME NETWORKS corporate lineage.
//
// Extreme is the most interesting lineage on this site for one reason: almost
// nothing in the current portfolio was built by the company whose name is on
// it. Between 2013 and 2021 Extreme assembled an end-to-end networking stack
// out of six acquisitions, most of them distressed or unwanted assets bought
// cheaply from larger companies exiting the business. The switches, the
// wireless, the fabric, the data-centre line and the cloud platform each came
// from somewhere else.
//
// That matters for anyone learning the products. The reason ExtremeXOS and the
// VOSS/Fabric Engine line behave so differently is that they are not variants
// of one design - they are separate operating systems from separate companies,
// now sold side by side. Knowing which box came from where explains more about
// the product line than any amount of documentation.
//
// PRICES: as disclosed at announcement. Where a company later restated a
// figure (Aerohive's headline price versus its net-of-cash value) both numbers
// are given rather than picking the flattering one.
// ============================================================================

import type { VendorLineage } from "./f5";

export const extremeLineage: VendorLineage = {
  key: "extreme",
  name: "Extreme Networks, Inc.",
  tagline:
    "An end-to-end networking portfolio assembled almost entirely by acquisition - six deals in eight years, most of them businesses larger companies no longer wanted.",

  founded: {
    year: 1996,
    dateText: "1996",
    place: "Santa Clara, California",
    asName: "Extreme Networks",
  },

  names: [
    {
      name: "Extreme Networks",
      from: "1996",
      note: "Founded in Santa Clara during the Gigabit Ethernet build-out, selling wire-speed layer 3 switching when that was still a differentiator.",
    },
    {
      name: "Extreme Networks (Morrisville, North Carolina)",
      from: "2010s",
      note: "Headquarters moved from Silicon Valley to the Research Triangle. The company that emerged from the acquisition run is not headquartered where it was founded.",
    },
  ],

  origin:
    "Extreme's own product was the Summit switch line and the ExtremeXOS operating system - a modular OS with process restartability, which was a genuine differentiator when a switch crash meant a reboot. Everything else in today's portfolio arrived from elsewhere.",

  acquisitions: [
    {
      year: 2013,
      name: "Enterasys Networks",
      price: "$180M cash",
      what: "The enterprise networking business carrying the Cabletron lineage, with roughly $330M in annual revenue and about 900 staff. Enterasys brought a large installed base, a policy-driven management model, and its own switching operating systems.",
      became:
        "The management and policy heritage that runs through Extreme Management Center and, later, ExtremeCloud IQ Site Engine. Extreme stated at the time that ExtremeXOS would be extended with Enterasys features and support both hardware platforms - the first of several 'two operating systems, one catalogue' problems the company took on.",
      sourceNote:
        "Announced 12 September 2013. This was Extreme's first acquisition, made when the company itself was struggling.",
      subAcquisitions: [
        {
          year: 1983,
          name: "Cabletron Systems (Enterasys's parent)",
          what: "Enterasys was not a startup: it was one of the pieces Cabletron broke into. Cabletron began in a garage making Ethernet cable assemblies, moved to Rochester, New Hampshire in 1985, went public in 1989, and grew past $1.8B in annual revenue before splitting itself up. Its successors were Enterasys, Riverstone Networks, Aprisma and Global Network Technology Services - and two of those, Enterasys and Riverstone, are chapters in this site's own career record.",
          founder: "Robert Levine and Craig Benson, in Levine's garage in March 1983",
        },
      ],
    },
    {
      year: 2016,
      name: "Zebra Technologies' wireless LAN business",
      price: "~$55M",
      what: "The WLAN line that had passed through Symbol Technologies and Motorola Solutions before Zebra, including the WiNG operating system and the AirDefense wireless security product.",
      became:
        "ExtremeWireless WiNG. Extreme expected the business to generate over $115M in annualised revenue. This is why Extreme carried two wireless architectures for years - WiNG from Zebra, and later a cloud-managed line from Aerohive.",
      sourceNote: "Acquisition completed 31 October 2016.",
      subAcquisitions: [
        {
          year: 2014,
          name: "Motorola Solutions' enterprise business (by Zebra)",
          price: "$3.45B",
          what: "Zebra had bought the business from Motorola Solutions two years earlier; the WLAN line was part of it.",
        },
        {
          year: 2007,
          name: "Symbol Technologies (by Motorola)",
          price: "~$3.9B",
          what: "Motorola had acquired Symbol, whose wireless work is where the WiNG operating system originates.",
        },
      ],
    },
    {
      year: 2017,
      name: "Avaya's networking business",
      price: "$100M",
      what: "Avaya's campus networking division, acquired out of Avaya's bankruptcy process where Extreme acted as the stalking-horse bidder. It brought Shortest Path Bridging fabric technology descended from Nortel.",
      became:
        "The VSP series and Fabric Connect, which became Extreme Fabric - the SPB-based fabric taught in the Extreme certification track. Extreme expected over $200M in annualised revenue from the business.",
      sourceNote:
        "Announced 7 March 2017, closed 17 July 2017.",
      subAcquisitions: [
        {
          year: 2009,
          name: "Nortel's enterprise business",
          price: "$900M",
          what: "Avaya bought it out of Nortel's bankruptcy. The Shortest Path Bridging work that became Extreme Fabric was Nortel's.",
        },
        {
          year: 1998,
          name: "Bay Networks (by Nortel)",
          price: "~$9.1B",
          what: "Nortel had acquired Bay Networks, which is how a telephone company came to own enterprise routing and switching at all.",
        },
        {
          year: 1994,
          name: "Wellfleet + SynOptics = Bay Networks",
          price: "$2.7B merger",
          what: "Bay Networks itself was the merger of Billerica-based Wellfleet Communications with Santa Clara-based SynOptics Communications, completed 6 July 1994 - two of the companies that built the first enterprise networks, joining to cover both layer 2 and layer 3.",
          founder:
            "SynOptics by Andrew K. Ludwick and Ronald V. Schmidt, who met at Xerox PARC in 1983 where Schmidt was working on Ethernet",
        },
      ],
    },
    {
      year: 2017,
      name: "Brocade's data centre networking business",
      price: "undisclosed",
      what: "Brocade's Switching, Routing and Analytics division, bought from Broadcom as a condition of Broadcom's own acquisition of Brocade - Broadcom wanted the fibre-channel business and divested the rest.",
      became:
        "The SLX data-centre switching line, and the analytics tooling. Brocade's own networking assets included Foundry Networks, so this deal carried a second lineage inside it.",
      sourceNote:
        "Announced 29 March 2017, contingent on Broadcom closing its Brocade acquisition. Price not disclosed by either party.",
      subAcquisitions: [
        {
          year: 2008,
          name: "Foundry Networks (by Brocade)",
          price: "~$3B",
          what: "Brocade's ethernet switching and routing came from Foundry, so the SLX line descends from a company Brocade bought nine years before Extreme bought the division.",
        },
      ],
    },
    {
      year: 2019,
      name: "Aerohive Networks",
      price: "$272M ($210M net of cash)",
      what: "A cloud-managed wireless and network-access-control company, and a pioneer of controllerless Wi-Fi. Extreme paid $4.45 per share, a roughly 40% premium.",
      became:
        "ExtremeCloud IQ - the cloud management platform the modern portfolio is organised around, and the reason the company's revenue mix shifted toward subscription. Extreme valued the deal at $210M after subtracting Aerohive's $62M net cash.",
      founder: "co-founded by Changming Liu, previously a senior engineer at NetScreen",
      sourceNote:
        "Announced 26 June 2019, completed 9 August 2019. Both the headline $272M and the net-of-cash $210M were published; they describe the same transaction. The founder detail is not trivia: NetScreen produced founders for Fortinet, Palo Alto Networks and - through Aerohive - the cloud platform Extreme's portfolio is now organised around.",
    },
    {
      year: 2021,
      name: "Ipanema (Infovista's SD-WAN division)",
      price: "$73M",
      what: "A French SD-WAN and application-performance business, founded 1999, carved out of Infovista.",
      became:
        "ExtremeCloud SD-WAN, closing the one significant gap analysts had pointed at after the Aerohive deal - Extreme had edge-to-core and cloud management but no enterprise-class SD-WAN of its own.",
      sourceNote: "Completed September 2021.",
    },
  ],

  asOf: "July 2026",

  sources: [
    {
      label: "Extreme Networks investor release: Brocade data centre networking (29 March 2017)",
      url: "https://s205.q4cdn.com/756692490/files/doc_news/Extreme-Networks-To-Acquire-Brocades-Data-Center-Networking-Business-03-29-2017-2017.pdf",
    },
    {
      label: "TechTarget: Aerohive acquisition and the WLAN portfolio gap",
      url: "https://www.techtarget.com/searchnetworking/news/252465962/Extremes-Aerohive-acquisition-closes-WLAN-product-gap",
    },
    {
      label: "TechTarget: Ipanema and ExtremeCloud SD-WAN",
      url: "https://www.techtarget.com/searchnetworking/news/252521022/Extreme-Networks-integrates-acquisitions-with-SD-WAN-switch",
    },
    {
      label: "Network World: the acquisition run and the Zebra WLAN price",
      url: "https://www.networkworld.com/article/967759/extremes-acquisitions-have-prepped-it-to-better-battle-cisco-arista-hpe-others.html",
    },
  ],
};
