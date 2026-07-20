// ============================================================================
// src/content/vendors/profiles/nortel-bay.ts
// ----------------------------------------------------------------------------
// NORTEL & BAY NETWORKS - THE GIANT THAT VANISHED. From an 1895 Montreal
// incorporation to more than a third of Canada's stock index at the 2000 peak,
// to the largest corporate failure in Canadian history (2009) and the $4.5B
// Rockstar patent auction (2011). Folded inside: SynOptics and Wellfleet, the
// 1994 Bay Networks merger, the $9.1B Nortel-Bay deal, and Alteon's $7.8B ->
// $18M arc that this site's Radware page picks up on the other end.
//
// Verified 2026-07-14 against primary sources: Bay Networks SEC 8-K (Jun 15,
// 1998: US$9.1B, 0.60 Nortel shares/Bay share, ~21% of Nortel), Alteon SEC
// Form 425 filings (Jul 28, 2000: US$7.8B; Dominic Orr's 4:53 AM employee
// email), Wikipedia Nortel + Timeline of Nortel (1895 incorporation; 1976
// Digital World; peak C$398B / 94,500 employees / >1/3 of TSX; Jan 14, 2009
// filing; itemized asset sales; Rockstar $4.5B and Google's pi bids), Avaya
// 10-K FY2010 (NES closed Dec 18, 2009: $943M cash, $933M final), Extreme
// 10-K/10-Q FY2017 (Avaya Networking closed Jul 14, 2017: $100M headline,
// $79.8M net), Wellfleet + SynOptics + Bay Networks Wikipedia (foundings).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const nortelBayProfile: VendorProfile = {
  slug: "nortel-bay",
  foundings: [
    {
      company: "Northern Electric and Manufacturing",
      year: 1895,
      place: "Montreal, Quebec",
      founders: ["Bell Telephone Company of Canada"],
      story:
        "Incorporated on December 7, 1895 with $50,000 in capital, 93 percent held by Bell Canada, out of a mechanical department that had been building telephone equipment since 1882. For half a century Northern Electric manufactured licensed Western Electric designs; a 1949 antitrust settlement began cutting the cord. Renamed Northern Telecom in March 1976, it made the industry's boldest bet: the 'Digital World' announcement - the first complete line of fully digital telecommunications products, led by the DMS-100 central office switch that would carry the company's revenue for close to fifteen years.",
    },
    {
      company: "SynOptics Communications",
      year: 1985,
      place: "Santa Clara, California",
      founders: ["Andrew K. Ludwick", "Ronald V. Schmidt"],
      story:
        "Founded on Ethernet-over-copper work Schmidt had pursued at Xerox PARC, SynOptics shipped pre-standard twisted-pair 10 Mbit/s Ethernet and popularized the modular Ethernet hub - the box that let ordinary telephone-style wiring carry LAN traffic. Its hubs came to dominate enterprise networking closets through the late 1980s and early 1990s: the structured-cabling revolution had a company.",
    },
    {
      company: "Wellfleet Communications",
      year: 1986,
      place: "Bedford, Massachusetts",
      founders: ["Paul Severino", "Bill Seifert", "Steven Willis", "Jennifer Lamonakis", "David Rowe"],
      story:
        "The East Coast router power: Wellfleet built multiprotocol routers that made it Cisco's fiercest early rival, at one point commanding up to 20 percent of the worldwide router market. Fortune ranked it the fastest-growing company in the United States. The BLN and BCN backbone routers carried a generation of enterprise WANs from Billerica, Massachusetts.",
    },
  ],
  timeline: [
    { year: 1895, title: "Northern Electric incorporated", detail: "December 7, 1895, Montreal: Bell Canada's manufacturing arm becomes a company. The 1976 'Digital World' bet - the DMS digital switching line - would later make it a global carrier-equipment power." },
    { year: 1985, title: "SynOptics founded; Wellfleet follows in 1986", detail: "Two halves of the coming LAN industry appear a year apart: SynOptics with twisted-pair Ethernet and the modular hub in Santa Clara, Wellfleet with multiprotocol routers in Massachusetts." },
    { year: 1994, title: "Bay Networks: a merger of equals", detail: "SynOptics and Wellfleet merge in a $2.7 billion deal - announced July 6, completed October 20, 1994 - named for the two bays their headquarters sat beside: San Francisco Bay and Massachusetts Bay. The bicoastal culture clash with a hyper-focused Cisco in between became a business-school cautionary tale.", sourceNote: "Merger structure per SEC filings and contemporaneous press; the name origin per Bay Networks history." },
    { year: 1995, title: "Bay buys Centillion; Nortel turns 100", detail: "Bay acquires Centillion Networks (May 1995) - the Token Ring and ATM switch maker co-founded by Bobby Johnson, who founds Foundry a year later. In Canada, Northern Telecom adopts the streamlined 'Nortel' identity for its centennial." },
    { year: 1996, title: "NETGEAR is born inside Bay", detail: "Bay Networks creates a home-and-small-business division in January 1996 called NETGEAR - spun out as a standalone company in September 1999 under Nortel. The consumer networking brand on retail shelves today is a Bay Networks descendant." },
    { year: 1998, title: "Nortel buys Bay for US$9.1 billion", detail: "Announced June 15, 1998: 0.60 Nortel shares per Bay share - about $38.21 per share, roughly 134 million new Nortel shares, Bay holders taking about 21 percent of the combined company. The largest telecom-data deal to date; Nortel renames itself Nortel Networks.", sourceNote: "Bay Networks SEC 8-K, June 15, 1998." },
    { year: 2000, title: "The peak: Alteon for US$7.8 billion", detail: "July 28, 2000: Nortel agrees to buy San Jose web-switching pioneer Alteon WebSystems - about 500 employees - for an estimated $7.8 billion in stock. CEO Dominic Orr's 4:53 AM email to staff announced the deal agreed at 4:30 that morning; the acquisition closed in October 2000. The same year Nortel reaches C$398 billion in market value - more than a third of the entire Toronto Stock Exchange - with 94,500 employees and a C$124 share price.", sourceNote: "Alteon SEC Form 425 filings; Timeline of Nortel (Wikipedia)." },
    { year: 2002, title: "The crash", detail: "By August 2002 the market value has fallen from C$398 billion to under C$5 billion and the stock from C$124 to C$0.47. Roughly 60,000 jobs - two-thirds of the workforce - are cut between 2001 and 2003." },
    { year: 2004, title: "The accounting scandal", detail: "A brief engineered return to profitability triggers $70 million in executive bonuses - then CEO Frank Dunn, the CFO, and the controller are fired for cause as accrual manipulation surfaces. Charged in 2008, all three are acquitted in January 2013; the damage to trust is never repaired." },
    { year: 2009, title: "January 14: the largest failure in Canadian history", detail: "Nortel files for protection in three jurisdictions at once - US Chapter 11, Canada's CCAA, the UK Insolvency Act - with a $107 million interest payment due the next day against about $2.3 billion in cash. Shares are delisted from the TSX in June at $0.185. Some 20,000 Canadian pensioners see benefits cut." },
    { year: 2009, title: "The dismemberment begins", detail: "Ericsson takes the CDMA and LTE wireless business for $1.13 billion (July); Avaya wins the Enterprise Solutions business - the Bay Networks lineage - closing December 18 for $943 million in cash ($933M final); Ciena takes Metro Ethernet and optical for $530 million cash plus $239 million in notes; the GSM business goes to Ericsson and Kapsch for $103 million; and Radware buys the Alteon application-delivery line for $18 million - a 99.8 percent markdown from Nortel's 2000 price.", sourceNote: "Avaya 10-K FY2010; Timeline of Nortel (Wikipedia)." },
    { year: 2011, title: "Rockstar: the $4.5 billion tombstone", detail: "Roughly 6,000 patents and applications - wireless, 4G, optical, data, voice, semiconductors - are auctioned in June 2011. Google opens as stalking horse at $900 million and bids mathematical constants along the way: $1,902,160,540 (Brun's constant), $2,614,972,128 (Meissel-Mertens), and $3.14159 billion (pi). The Rockstar consortium - Apple, Microsoft, RIM, Ericsson, Sony, EMC - wins at $4.5 billion, then the largest patent sale in history. In 2014 about 4,000 of the patents are resold to RPX for roughly $900 million.", sourceNote: "Timeline of Nortel (Wikipedia); contemporaneous auction coverage." },
    { year: 2017, title: "The Bay DNA reaches Extreme", detail: "Avaya, itself in Chapter 11, sells its networking business - the fabric and switching portfolio descended from Bay Networks and Nortel Enterprise - to Extreme Networks. Announced March 7, closed July 14, 2017: $100 million headline, $79.8 million net after adjustments. The SynOptics and Wellfleet lineage lives on at one of the vendors Rodolfo teaches.", sourceNote: "Extreme Networks 10-K and 10-Q FY2017." },
  ],
  products: [
    { name: "DMS digital switching and the SL-1 / Norstar lines", what: "The 'Digital World' portfolio: DMS-100 central office switches serving up to 100,000 lines, plus the digital PBX and key systems that put Nortel in businesses worldwide." },
    { name: "LattisNet and the SynOptics hub families", what: "Pre-standard twisted-pair Ethernet and the modular hubs that wired the structured-cabling era - the closets of the early 1990s were full of them." },
    { name: "Wellfleet BLN / BCN routers", what: "The multiprotocol backbone routers that made Wellfleet Cisco's chief rival, carried forward as Bay's router line (BayRS) into Nortel." },
    { name: "Accelar / Passport routing switches", what: "Bay's routing-switch line became Nortel's Passport 8600 and, at Avaya, the ERS and VSP fabric portfolio - the products Extreme acquired in 2017." },
    { name: "Alteon web switches", what: "The Layer 4-7 content switches Nortel bought for $7.8 billion in 2000 - sold to Radware for $18 million in 2009 and still shipping under the Alteon name today." },
    { name: "NETGEAR", what: "Born as a Bay Networks division in January 1996, spun out in September 1999 - the consumer networking brand is the lineage's most visible survivor." },
  ],
  innovations: [
    { title: "The all-digital bet", detail: "Northern Telecom was the first in its industry to announce and deliver a complete line of fully digital telecom products (1976) - the DMS wave powered fifteen years of growth and made Nortel a global equipment power." },
    { title: "Ethernet over telephone wiring", detail: "SynOptics' pre-standard twisted-pair Ethernet helped move LANs off coax and onto structured cabling - the physical layer the modern office still uses." },
    { title: "The multiprotocol router market", detail: "Wellfleet proved Cisco could be fought - up to 20 percent worldwide router share - before the Bay merger's integration struggles handed Cisco the decade." },
    { title: "Patents as the endgame", detail: "Nortel's most valuable asset turned out to be its filing cabinet: the $4.5 billion Rockstar auction priced the ideas above any of the operating businesses and reshaped how the industry valued IP." },
  ],
  markets: [
    "At its 2000 peak Nortel was worth C$398 billion - more than a third of the entire Toronto Stock Exchange - with 94,500 employees. The collapse erased roughly 99 percent of that value in two years and ended in the largest corporate failure in Canadian history.",
    "The DNA scattered on dissection: carrier wireless to Ericsson, optical to Ciena, the Bay-descended enterprise line to Avaya and then to Extreme Networks (2017), Alteon to Radware, NETGEAR long since independent, and the patents through Rockstar to RPX. Almost every piece survives - just nowhere under one roof.",
  ],
  analyst: [
    "Timeline of the fall, per the public record: C$398 billion market value in September 2000 to under C$5 billion by August 2002; a C$124 share to C$0.47; 94,500 employees to roughly 35,000 in two years of layoffs.",
    "The Rockstar auction's $4.5 billion was five times Google's $900 million stalking-horse bid and, at the time, the largest patent sale in history.",
  ],
  careerLink: {
    href: "/about/vendors/cabletron-enterasys",
    label: "Rodolfo fought the hub-and-switch wars from the other side, at Cabletron (1996-2000) - the Cabletron page",
  },
};
