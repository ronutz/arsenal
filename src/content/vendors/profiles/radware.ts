// ============================================================================
// src/content/vendors/profiles/radware.ts
// ----------------------------------------------------------------------------
// RADWARE - THE ZISAPEL LINEAGE. Born of Israel's RAD Group in 1997 (Radware's
// own SEC filings date inception to May 1996), led by Roy Zisapel as CEO since
// inception, with his father Yehuda - the RAD Group patriarch - as co-founder
// and largest shareholder. The ADC and DDoS specialist that, in 2009, bought
// the Alteon application-switching line out of Nortel's collapse for ~$18M.
//
// Verified 2026-07-14: Radware SEC 6-K FY2009 (founders' bios; "inception in
// May 1996"), Wikipedia (April 1997 inception; stakes 15%/3.4%; acquisition
// list), Network World Apr 2009 ("Radware pays $18 million for Nortel's
// Alteon assets"; $17.65M), company histories (WSD first product; Sept 1999
// NASDAQ IPO ~$60M raised).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const radwareProfile: VendorProfile = {
  slug: "radware",
  foundings: [
    {
      company: "Radware",
      year: 1997,
      place: "Tel Aviv, Israel",
      founders: ["Roy Zisapel", "Yehuda Zisapel"],
      story:
        "A father-and-son founding inside Israel's most storied networking family: Yehuda Zisapel, co-founder of RAD Data Communications and the BYNET distribution house at the heart of the RAD Group, seeded the company under the group's incubator model; his son Roy - a Tel Aviv University mathematics and computer science graduate then in his mid-twenties - has been president and CEO since inception. The first product, Web Server Director, distributed HTTP traffic across server farms as web workloads moved online.",
    },
  ],
  timeline: [
    { year: 1997, title: "Founded inside the RAD Group", detail: "Roy and Yehuda Zisapel start Radware in Tel Aviv around application-aware traffic management; Web Server Director is the first product.", sourceNote: "Radware's own SEC filings date inception to May 1996; company histories commonly cite April-May 1997." },
    { year: 1999, title: "NASDAQ IPO", detail: "Radware lists on NASDAQ in September 1999, raising roughly $60 million in the dot-com window - the RAD Group model produces another public company." },
    { year: 2007, title: "Covelight", detail: "A $16 million acquisition brings web application auditing and monitoring into the portfolio, feeding what becomes the AppWall web application firewall." },
    { year: 2009, title: "Alteon rescued from Nortel", detail: "In April 2009 Radware pays about $18 million ($17.65M) for Nortel's Alteon application-switching assets as Nortel is dismantled in bankruptcy. Nortel had paid an estimated $7.8 billion in stock for Alteon WebSystems in 2000 (closed October 2000) - a 99.8 percent markdown in nine years, instantly making Radware a top-three ADC vendor.", sourceNote: "Nortel price per Alteon SEC Form 425 filings, Jul 2000; see the Nortel & Bay Networks lineage page." },
    { year: 2013, title: "Strangeloop", detail: "Web performance optimization joins the delivery portfolio." },
    { year: 2017, title: "Seculert", detail: "January 2017: cloud-based breach and data-exfiltration protection is added to the security side." },
    { year: 2019, title: "ShieldSquare", detail: "January 2019: bot management arrives - Radware Bot Manager - as automated traffic becomes the defining application threat." },
  ],
  products: [
    { name: "Alteon ADC", what: "The application delivery controller line carrying the Alteon name from the dot-com era into the present - load balancing, SSL offload, and application acceleration." },
    { name: "DefensePro", what: "Radware's DDoS mitigation appliances - behavioral, real-time attack detection for networks and data centers, complemented by cloud DDoS scrubbing services." },
    { name: "AppWall and Cloud WAF", what: "Web application firewalling on-premises and as a service, descended in part from the Covelight technology." },
    { name: "Bot Manager", what: "The ShieldSquare lineage: distinguishing human, good-bot, and hostile automated traffic at application scale." },
  ],
  innovations: [
    { title: "The RAD Group incubator model", detail: "Radware is a flagship of a uniquely Israeli institution: the Zisapel family's RAD Group seeded dozens of networking companies, funding them from group resources rather than venture rounds." },
    { title: "Behavioral DDoS mitigation", detail: "DefensePro built its reputation on real-time behavioral analysis rather than static signatures - protecting carriers and banks under active attack." },
    { title: "The Alteon coup", detail: "Buying a marquee product line out of a bankruptcy for ~$18 million and running it for decades is one of the industry's great value acquisitions." },
  ],
  markets: [
    "Radware competes in application delivery and application security - the ADC market where F5 is the reference vendor, and the DDoS and WAF markets alongside the cloud scrubbing providers. It remains independent and NASDAQ-listed (RDWR), still led by its founding CEO.",
    "Ownership stayed close to home: Yehuda Zisapel remained the largest shareholder at roughly 15 percent, with Roy holding about 3.4 percent - a founder-controlled structure rare among public security vendors.",
  ],
  analyst: [
    "The 2009 Alteon purchase was widely credited with vaulting Radware into the top tier of application delivery vendors, bringing thousands of enterprise customers overnight.",
  ],
  careerLink: {
    href: "/f5",
    label: "Radware competes in the ADC market Rodolfo teaches daily - the F5 hub",
  },
};
