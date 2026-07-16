// ============================================================================
// src/content/vendors/profiles/cisco.ts
// ----------------------------------------------------------------------------
// CISCO SYSTEMS - RODOLFO'S BRASILIA YEARS (2003-2004), and the one company in
// this section that won every war the other pages describe. Scoped to the
// verified essentials: the Stanford founding legend, the acquisition machine
// (which touches Kalpana, ArrowPoint, and the Cabletron MMAC module on this
// site's other pages), the 2000 summit, the 2003-2004 era Rodolfo lived, and
// the Splunk-sized present.
//
// Verified 2026-07-15 against primary sources: Cisco 10-K FY1996 (Crescendo
// Sep 1993 6.8M shares; Kalpana Dec 1994 13.6M shares; Newport), Cisco 10-Q
// FY2000 (Cerent ~$6.9B, 98.1M shares, completed Nov 1999), Cisco 8-K Mar 20,
// 2003 (Linksys ~$500M stock), Cisco 8-K FY2004 + newsroom (CRS-1 May 2004,
// 92 Tbps, first true 40-Gbps interface; Guinness Jul 1, 2004; Boeing IP
// convergence), InfoWorld (CRS-1 May 25, 2004; IOS XR), Wikipedia Cisco
// (founding Dec 1984; Stanford Jul 11, 1986; $500B / most valuable 2000;
// -80% by 2002; Dow Jones Jun 8, 2009), Motley Fool ($169,300 Stanford
// license; ~80 VC meetings), company-histories (co-founders; Valentine 1988;
// Lerner fired 1990; StrataCom; 1999's 17 deals), Network World (Mazzola/
// Ullal/Bechtolsheim talent arcs), strategy+business ($89M Crescendo; $4.5B
// StrataCom, first underwriter), Wikipedia acquisitions list (50 percent of
// business activity; Splunk largest), Grokipedia (Kalpana ~$204M; Splunk
// $28B closed).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const ciscoProfile: VendorProfile = {
  slug: "cisco",
  foundings: [
    {
      company: "Cisco Systems",
      year: 1984,
      place: "Menlo Park, California (out of Stanford University)",
      founders: ["Leonard Bosack", "Sandy Lerner"],
      story:
        "A married couple ran computer facilities 500 yards apart at Stanford - Bosack (ex-DEC, PDP-10 memory architecture) in Computer Science, Lerner at the Graduate School of Business - and built a multiprotocol router to connect their departments. They incorporated on December 10, 1984 with colleagues Greg Setz, Bill Westfield, and Kirk Lougheed, naming the company for San Francisco while driving across the Golden Gate Bridge - the logo is the bridge's towers. Stanford forced Bosack and Lougheed out on July 11, 1986 and weighed criminal complaints before settling: a 1987 license for exactly $169,300. Roughly 80 venture capitalists said no before Don Valentine of Sequoia said yes, took control in 1988, and installed John Morgridge as CEO. Cisco went public in February 1990 at a $224 million valuation; by August, Lerner had been fired and Bosack had quit. The founders never saw the empire from inside.",
    },
  ],
  timeline: [
    { year: 1984, title: "Founded from a campus problem", detail: "December 10, 1984: the multiprotocol router that connected Stanford's incompatible departmental networks becomes a company - commercializing the technology that would carry the Internet era." },
    { year: 1986, title: "First router ships; Stanford strikes", detail: "The first commercial TCP/IP router ships the same year Stanford forces the founders' resignations over intellectual property. The 1987 settlement licenses the software and two boards to Cisco for $169,300 - possibly the worst deal a university ever made." },
    { year: 1990, title: "IPO, and the founders exit", detail: "February 1990: Cisco lists on NASDAQ at a $224 million market cap. Within months Sandy Lerner is fired and Leonard Bosack resigns; over the following decade the stock gains roughly 30,000 percent without them." },
    { year: 1993, title: "The Boeing ultimatum: Crescendo", detail: "Negotiating a $10 million router order, Boeing tells John Chambers there is no deal unless Cisco works with Mario Mazzola's Crescendo Communications. On September 24, 1993 - after seven years of building only - Cisco buys Crescendo for roughly $90 million. It becomes the Catalyst switching line, and Crescendo's Mazzola and Jayshree Ullal build Cisco switching into a $15 billion business.", sourceNote: "Cisco 10-K FY1996 (6.8M shares, pooling); price reported between $89M and $97M across accounts." },
    { year: 1994, title: "Kalpana, and the first billion", detail: "December 1994: Cisco acquires Ethernet-switching pioneer Kalpana for about $204 million in stock (13.6 million shares) - the company where Riverstone co-founder Romulus Pereira had built switching engines. The same fiscal year, revenue passes $1 billion for the first time ($1.24 billion, up 92 percent)." },
    { year: 1995, title: "Chambers takes over", detail: "John Chambers succeeds Morgridge as CEO and runs the company for twenty years - the acquisition machine's architect and the bubble era's most visible executive." },
    { year: 1996, title: "StrataCom: the first mega-deal", detail: "ATM and Frame Relay maker StrataCom, at about $4.5 billion in stock, is Cisco's biggest purchase yet and the first for which it hires an underwriter - the machine graduates from friendly startup tuck-ins to market-shaping deals.", sourceNote: "Reported between $4.0B and $4.67B across accounts." },
    { year: 1999, title: "Seventeen companies in one year", detail: "The buying peak: 17 acquisitions in 1999 alone, led by optical-transport maker Cerent at approximately $6.9 billion (98.1 million shares, per Cisco's own 10-Q), plus GeoTel ($1.9B), Aironet wireless ($800M), and Pirelli's optical business." },
    { year: 2000, title: "The summit", detail: "March 2000: Cisco's market capitalization passes $500 billion and it becomes the most valuable company in the world, surpassing Microsoft. In May it pays about $5.7 billion for content-switch maker ArrowPoint - the Alteon rival. Then the bubble bursts: 80 percent of the value is gone by 2002." },
    { year: 2003, personal: true, title: "Rodolfo's era opens: Linksys", detail: "March 20, 2003: Cisco announces the ~$500 million acquisition of Linksys, entering home networking as broadband spreads. The same year, Rodolfo joins Cisco in Brasilia - the recovering giant's government-sector front line in Brazil.", sourceNote: "Cisco SEC 8-K, Mar 20, 2003; closed June 2003." },
    { year: 2004, title: "CRS-1: a Guinness record", detail: "May 25, 2004: the Carrier Routing System debuts - 92 terabits per second, the industry's first true 40-Gbps interface, and a new operating system (IOS XR) built for it. On July 1, Guinness World Records certifies it as the highest-capacity Internet router ever - the first networking technology in the record book. Fitting bookend: the same quarter, Boeing announces it will converge 150,000 employees onto Cisco IP communications.", sourceNote: "Cisco 8-K FY2004; Cisco newsroom; InfoWorld." },
    { year: 2024, title: "The machine's largest meal", detail: "March 2024: the $28 billion Splunk acquisition closes - the biggest in Cisco's history, pointing the four-decade acquirer at security analytics and AI. Under Chuck Robbins (CEO since 2015), the company that joined the Dow in 2009 runs at roughly $56 billion in annual revenue - the only 1990s networking giant still setting the terms." },
  ],
  products: [
    { name: "IOS and IOS XR", what: "The operating system whose command line became the industry's lingua franca - and the modular XR rebuild created for the CRS-1's always-on carrier world." },
    { name: "Catalyst", what: "The switching dynasty born from Crescendo in 1993 - the wiring-closet and campus standard that outlasted every hub-era rival on this site's other pages." },
    { name: "CRS and the carrier core", what: "The 92-Tbps Guinness-record Carrier Routing System (2004) and its descendants - the multichassis core of IP next-generation networks." },
    { name: "Nexus", what: "Data-center switching from the Nuova spin-in - Mazzola's second act - including Fibre Channel over Ethernet with the Nexus 5000." },
    { name: "Security and observability", what: "From PIX and ASA through Sourcefire and Duo to the $28 billion Splunk platform - the acquisition machine assembling a security business at Cisco scale." },
  ],
  innovations: [
    { title: "Commercializing the multiprotocol router", detail: "Cisco did not invent routing - it made routing a product, then a market, then the substrate of the commercial Internet." },
    { title: "Acquisition as R&D", detail: "From the Boeing-forced Crescendo deal onward, buying became half of Cisco's business activity by its own history - a model the industry named 'A&D' and imitated for thirty years." },
    { title: "The spin-in", detail: "Mazzola's Andiamo and Nuova were founded, funded, and reabsorbed by design - storage networking and the Nexus line built as startups with a guaranteed buyer." },
    { title: "The talent flywheel", detail: "Acquisitions delivered people who built the next decade: Mazzola and Ullal from Crescendo, Bechtolsheim via Granite - and their departures seeded rivals like Arista, where Ullal is CEO." },
  ],
  markets: [
    "Cisco is the constant on every other page of this section: the rival Wellfleet held to 20 percent, the winner of the hub wars against Cabletron and SynOptics, Brocade's only SAN peer, the standard Nortel and Bay could not beat, and - per the DOJ's 2025 HPE-Juniper settlement - still, with HPE, more than 70 percent of US enterprise networking four decades on.",
    "Rodolfo's chapter was Brasilia, 2003-2004: the government-sector front line in Brazil, in the narrow window between the post-bubble trough and the CRS-1's Guinness record - the giant relearning how to grow.",
  ],
  analyst: [
    "March 2000: a market capitalization above $500 billion made Cisco the most valuable company in the world - followed by an 80 percent fall by 2002, the era's defining round trip.",
    "Per Wikipedia's acquisition history, purchases have constituted 50 percent of Cisco's business activity since 1993 - roughly 170 companies by late 2014, crowned by the $28 billion Splunk close in March 2024.",
  ],
  careerLink: {
    href: "/about/vendors/riverstone",
    label: "Kalpana's switching DNA runs through Riverstone - co-founder Pereira built there before Yago - the Riverstone page",
  },
};
