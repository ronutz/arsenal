// ============================================================================
// src/content/vendors/profiles/palo-alto.ts
// ----------------------------------------------------------------------------
// PALO ALTO NETWORKS - the final page of the career section, and the one that
// closes its security circle: Nir Zuk's road from Check Point through
// OneSecure and NetScreen (see that page) ends in the largest standalone
// cybersecurity company in the world. Rodolfo's chapter is 2013-2015, through
// the reseller channel and the classroom - a past engagement, and per the
// standing naming rule, nothing here implies authorized Palo Alto training.
//
// Verified 2026-07-15: Wikipedia PANW (founded 2005 Santa Clara; Zuk IDF
// Unit 8200; IPO Jul 20, 2012, NYSE, $260M, 4th-largest tech IPO of 2012;
// Nasdaq move Oct 2021; Cyber Threat Alliance 2014 w/ Fortinet, McAfee,
// NortonLifeLock; 70,000+ orgs, 150+ countries, 85 of Fortune 100; Unit 42;
// Arora Jun 2018), Sequoia's own origin story (CHKPKLR license plate; nine
// months of 2005 incubating at Sequoia; Goetz + Chandna bring Rajiv Batra;
// Greylock + Sequoia fund Jan 2006), Pestel ($10M Series A Jan 2006),
// MatrixBCG/Grokipedia (PA-4000 2007; company coined "next-generation
// firewall"; Lee Klarich 2006, CPTO Aug 2025 after Zuk retired as CTO;
// co-founder Batra + early team Mao/Stevens/Gong; largest standalone cyber
// vendor by market cap; FY2024 revenue $8.03B +16%; Gartner Leader from
// 2011), PAN 10-Q FY2026 (CyberArk COMPLETED Feb 11, 2026: total purchase
// consideration $21.1B = $2.3B cash + 112M shares at $18.5B fair value +
// $265M replacement-award allocation; Koi Security $300M agreed Feb 16,
// 2026), DelMorgan/GovCon (announced Jul 30, 2025, ~$25B headline; $45 cash
// + 2.2005 PANW shares per CyberArk share; 99.8% shareholder vote Nov 13,
// 2025; US/EU/UK/Israel clearances; largest deal in security history).
// R6e canon: Zuk = one of Check Point's first employees; OneSecure
// co-founder; NetScreen CTO via the 2002 acquisition; left Juniper 2005.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const paloAltoProfile: VendorProfile = {
  slug: "palo-alto",
  foundings: [
    {
      company: "Palo Alto Networks",
      year: 2005,
      place: "Santa Clara, California",
      founders: ["Nir Zuk"],
      story:
        "By Sequoia's own telling, Nir Zuk pulled into their parking lot in an old BMW wearing the license plate CHKPKLR - Check Point killer. He had earned the chip: software lead in the IDF's Unit 8200, then one of Check Point's earliest engineers on stateful inspection, co-founder of intrusion-prevention pioneer OneSecure, and CTO of NetScreen and then Juniper after the 2004 acquisition - the road told on this section's NetScreen page. Leaving in 2005, he spent nine months at a Sequoia desk honing one idea: the firewall should classify applications, users, and content, not ports. Jim Goetz and Greylock's Asheem Chandna brought in Rajiv Batra to run engineering, with Yuming Mao, Dave Stevens, and Fengmin Gong among the early builders, and in January 2006 Greylock and Sequoia funded the company with a $10 million Series A.",
    },
  ],
  timeline: [
    { year: 2005, title: "The Check Point killer incubates", detail: "March to December 2005: a desk at Sequoia, a custom license plate, and nine months narrowing the thesis - the last great gap in enterprise security is the firewall itself, still blind to what actually flows through it." },
    { year: 2007, title: "PA-4000: the term gets coined", detail: "The first product ships: App-ID classifying traffic by application, user, and content in a single-pass parallel-processing architecture. The company itself coins the label 'next-generation firewall' - and the industry, then Gartner, adopts the category it named." },
    { year: 2011, title: "The Gartner streak begins", detail: "Gartner lists Palo Alto Networks as a Leader in the enterprise firewall Magic Quadrant for the first time - the start of a leadership run that outlasts every incumbent it displaced." },
    { year: 2012, title: "The fourth-largest tech IPO of the year", detail: "July 20, 2012: PANW debuts on the NYSE, raising $260 million - the 4th-largest technology IPO of 2012 (the listing moves to Nasdaq in October 2021)." },
    { year: 2013, personal: true, title: "Rodolfo's chapter", detail: "2013 to 2015: the focused engagement told above - next-generation firewalls carried through the Brazilian reseller and integrator channel and into the classroom, in the years between the Gartner debut and the platform era. A past engagement; not among the platforms taught today." },
    { year: 2014, title: "Beyond the box", detail: "Cyvera becomes the Traps endpoint line; the Unit 42 threat research team gives the company a public intelligence voice; and Palo Alto co-founds the Cyber Threat Alliance with Fortinet, McAfee, and NortonLifeLock - rivals sharing threat intelligence 'for the greater good.'" },
    { year: 2018, title: "Arora and platformization", detail: "June 2018: former Google and SoftBank executive Nikesh Arora takes the CEO chair. The strategy becomes consolidation itself - Strata for network security, Prisma for cloud (Evident.io and RedLock seed Prisma Cloud), Cortex for the SOC - buying and building toward one platform." },
    { year: 2024, title: "The largest standalone", detail: "Fiscal 2024 revenue reaches $8.03 billion, up 16 percent, serving more than 70,000 organizations in over 150 countries - including 85 of the Fortune 100 - as the largest standalone cybersecurity vendor by market capitalization. In August 2025, Nir Zuk retires as CTO, handing product and technology to Lee Klarich, on the team since 2006." },
    { year: 2026, title: "CyberArk: the biggest deal in security history", detail: "Announced July 30, 2025 at a headline value near $25 billion and completed February 11, 2026 - $45 cash plus 2.2005 PANW shares per CyberArk share, approved by 99.8 percent of votes cast - the acquisition makes identity the platform's third pillar beside network security and the SOC. Palo Alto's own 10-Q records total purchase consideration of $21.1 billion: $2.3 billion in cash and 112 million shares.", sourceNote: "PANW 10-Q FY2026 (accounting consideration); announcement terms per contemporary coverage." },
  ],
  products: [
    { name: "PAN-OS and App-ID", what: "The operating system and the classification engine that started it: applications, users, and content as the policy primitives, inspected once in a single pass." },
    { name: "Strata and Prisma SASE", what: "The network security estate - hardware, virtual, and cloud-delivered NGFW, with Prisma Access and the CloudGenix SD-WAN lineage carrying the firewall into SASE." },
    { name: "Prisma Cloud", what: "The cloud-native security platform assembled from Evident.io, RedLock, Twistlock and successors - code-to-runtime protection across the public clouds." },
    { name: "Cortex", what: "The SOC platform: XDR detection, XSOAR automation from Demisto, and XSIAM - the AI-driven security operations bet of the platformization era." },
    { name: "CyberArk identity security", what: "The 2026 third pillar: privileged access and identity for humans, machines, and AI agents - the largest capability Palo Alto has ever bought." },
  ],
  innovations: [
    { title: "The application-aware firewall", detail: "App-ID made the application, not the port, the unit of policy - the architectural break that defined the category and forced every rival to follow." },
    { title: "Naming the category", detail: "'Next-generation firewall' was the company's own coinage - rare proof that a startup can define the vocabulary its whole industry, and its analysts, end up using." },
    { title: "Platformization", detail: "Under Arora, consolidation became the product: network, cloud, SOC - and now identity - sold as one platform, with the market rewarding the strategy at a scale no security pure-play had reached." },
    { title: "The mafia's masterpiece", detail: "This company is the NetScreen diaspora's largest work: the same lineage that produced Fortinet and Northern Light produced, through Zuk, the security industry's biggest company - and its biggest acquisition." },
  ],
  markets: [
    "Palo Alto Networks closes this career section's security circle: the thread that starts at Check Point and runs through OneSecure, NetScreen, and Juniper on the previous pages ends here, in the largest standalone cybersecurity company in the world - one that, in 2026, absorbed CyberArk in the biggest deal the industry has seen.",
    "Rodolfo's chapter was the channel years, 2013 to 2015: next-generation firewalls through Brazilian resellers and integrators, with classroom delivery alongside - a past engagement, recorded here as the final stop on the career road.",
  ],
  analyst: [
    "Gartner has listed Palo Alto Networks as a Leader in its firewall Magic Quadrant since 2011 - a streak spanning the entire platform era and both CEO generations.",
    "The scale, in primary figures: fiscal 2024 revenue of $8.03 billion; 85 of the Fortune 100 as customers; and a CyberArk purchase recorded at $21.1 billion in consideration against a ~$25 billion announced value - the largest transaction in cybersecurity history.",
  ],
  careerLink: {
    href: "/about/vendors/netscreen-juniper",
    label: "Nir Zuk's road runs through the NetScreen page - where this section's security circle begins",
  },
};
