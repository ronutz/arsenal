// ============================================================================
// src/content/vendors/profiles/hpe-juniper-aruba.ts
// ----------------------------------------------------------------------------
// HPE NETWORKING (HP + 3Com + Aruba + Juniper) - the great consolidation story.
// Verified 2026-07-14 against primary sources: HPE 10-K FY2025 (Juniper close,
// ~$13.4B cash), HPE/Juniper SEC 8-K settlement release (2025-06-28), NetScreen
// Form 425 (2004-02-09, ~$4B stock, 1.404 ratio), Juniper 10-Q FY2019 (Mist
// $359.2M consideration), Aruba SEC 8-K/DEFA14A (2015-03-02, $24.67/share,
// ~$3.0B), Wikipedia/press (3Com $2.7B announced 2009-11-11), juniper.net
// (Gartner 2025 MQ Leader statement), TechTarget/DOJ coverage.
//
// ACCURACY: neither Rodolfo nor Red Education delivers HPE, Aruba, or Juniper
// training - the hosting PartnerVendor entry carries that note. This page is
// corporate history: a homage to the pioneers, recorded from verified sources.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const hpeJuniperArubaProfile: VendorProfile = {
  slug: "hpe-juniper-aruba",
  foundings: [
    {
      company: "Hewlett-Packard",
      year: 1939,
      place: "Palo Alto, California",
      founders: ["Bill Hewlett", "Dave Packard"],
      story:
        "Two Stanford classmates started in a one-car garage at 367 Addison Avenue - now a California landmark known as the birthplace of Silicon Valley. Their first product was the HP 200A audio oscillator; one of the first customers was Walt Disney Studios, which used HP oscillators to test theater sound for Fantasia. The name order, Hewlett-Packard, was decided by a coin flip.",
    },
    {
      company: "3Com",
      year: 1979,
      place: "Santa Clara, California",
      founders: ["Robert Metcalfe (with co-founders)"],
      story:
        "Robert Metcalfe co-invented Ethernet at Xerox PARC in 1973, then founded 3Com (Computer Communication Compatibility) to commercialize it. 3Com's adapters put networking into ordinary PCs and helped make Ethernet the world's default LAN. Metcalfe received the ACM Turing Award in 2022 for Ethernet.",
    },
    {
      company: "Juniper Networks",
      year: 1996,
      place: "Silicon Valley, California",
      founders: ["Pradeep Sindhu"],
      story:
        "A Xerox PARC computer scientist, Sindhu founded Juniper in February 1996 on the conviction that Internet-scale routing needed purpose-built silicon rather than general-purpose CPUs. The clean-sheet M40 core router and the Junos operating system shipped in 1998, roughly ten times faster than incumbent gear, with control and forwarding planes separated - an architecture the industry later treated as standard.",
    },
    {
      company: "Aruba Networks",
      year: 2002,
      place: "Sunnyvale, California",
      founders: ["Keerti Melkote", "Pankaj Manglik"],
      story:
        "Aruba was built for the mobile-first enterprise: Wi-Fi as the primary access layer rather than an afterthought, wrapped in identity-based access control that later became ClearPass. It grew into one of the defining enterprise-wireless companies of its era.",
    },
  ],
  timeline: [
    { year: 1939, title: "HP founded in the Addison Avenue garage", detail: "Bill Hewlett and Dave Packard start Hewlett-Packard in Palo Alto; the HP 200A audio oscillator is the first product." },
    { year: 1973, title: "Ethernet invented at Xerox PARC", detail: "Robert Metcalfe co-invents Ethernet, the technology 3Com will later carry into every office." },
    { year: 1979, title: "3Com founded to commercialize Ethernet", detail: "Metcalfe's startup turns a lab technology into the default local-area network of the PC age." },
    { year: 1997, title: "3Com merges with U.S. Robotics (~$6.6B)", detail: "Announced in February 1997 and completed on June 12, 1997, the roughly $6.6 billion stock merger with modem king U.S. Robotics made 3Com a $5 billion networking company, second only to Cisco. USR, founded in 1976 and named after the fictional robot maker in Isaac Asimov's stories, built the Courier and Sportster modems that carried much of the dial-up Internet and had just launched the 56k x2; it also brought along Palm Computing, acquired in 1995, whose PalmPilot 3Com would spin off in 2000 before exiting analog modems and returning the U.S. Robotics name to a standalone company.", sourceNote: "3Com 10-K FY1997 (merger completed June 12, 1997, pooling of interests); contemporary press ($6.6B, Feb 1997)." },
    { year: 1996, title: "Juniper Networks founded", detail: "Pradeep Sindhu starts Juniper in February 1996 to build IP routers on purpose-built silicon." },
    { year: 1998, title: "Juniper ships the M40 and Junos", detail: "The clean-sheet core router arrives roughly 10x faster than incumbents, with separated control and forwarding planes." },
    { year: 1999, title: "Juniper IPO", detail: "On June 25, 1999 the stock jumps from $34 to $99 on day one - one of the defining IPOs of the era. By 2000 Juniper holds roughly 30% of the high-end core-router market." },
    { year: 2002, title: "Aruba Networks founded", detail: "Keerti Melkote and Pankaj Manglik start Aruba in Sunnyvale for the mobile-first enterprise." },
    { year: 2004, title: "Juniper acquires NetScreen (~$4B)", detail: "Announced February 9, 2004: a stock-for-stock merger (1.404 Juniper shares per NetScreen share, ~$4B) that takes Juniper into security - the lineage behind the SRX firewall line.", sourceNote: "NetScreen SEC Form 425, Feb 9, 2004; value based on Juniper's $29.47 close." },
    { year: 2009, title: "HP announces the 3Com acquisition ($2.7B)", detail: "Announced November 11, 2009 and closed in April 2010, bringing 3Com's switching (and H3C in China) into HP's networking business.", sourceNote: "HP press release, Nov 11, 2009." },
    { year: 2015, title: "HP acquires Aruba, then splits into HP Inc and HPE", detail: "Aruba is announced March 2, 2015 at $24.67 per share (~$3.0B equity, ~$2.7B net of cash) and completes May 19. On November 1, HP separates into HP Inc and Hewlett Packard Enterprise; Aruba anchors HPE's Intelligent Edge.", sourceNote: "Aruba SEC 8-K, Mar 2, 2015." },
    { year: 2019, title: "Juniper acquires Mist Systems", detail: "Closed April 1, 2019: AI-driven, cloud-managed Wi-Fi and the Marvis virtual network assistant - the technology that reframed Juniper's enterprise story.", sourceNote: "Announced at $405M; Juniper's 10-Q records $359.2M total consideration." },
    { year: 2024, title: "HPE announces the Juniper acquisition (~$14B)", detail: "January 9, 2024: an all-cash agreement at $40.00 per share, approximately $14B in equity value." },
    { year: 2025, title: "DOJ suit, settlement, and close", detail: "The DOJ sues on January 30, 2025; a June 28 settlement requires divesting HPE's Instant On business and licensing Juniper's Mist AIOps source code; the merger closes July 2, 2025 for approximately $13.4B in cash. Juniper becomes the heart of HPE Networking.", sourceNote: "HPE 10-K FY2025; HPE/Juniper 8-K, Jun 28, 2025." },
    { year: 2009, personal: true, title: "Rodolfo's chapter: inside Juniper", detail: "2009 to 2010: Rodolfo works at Juniper Networks in Brazil, representing the MX and SRX era portfolio - years that overlap the birth of Junos Pulse, a line that later re-crossed his path in distribution. The NetScreen and Juniper career page tells the chapter in full." },
  ],
  products: [
    { name: "Junos OS", what: "One operating system across Juniper routing, switching, and security since 1998." },
    { name: "MX / PTX routing", what: "Service-provider edge and core routing - the M-series lineage that built the modern Internet backbone." },
    { name: "EX / QFX switching", what: "Enterprise campus and data-center switching on Junos." },
    { name: "SRX security", what: "The firewall line carrying NetScreen's DNA into the Junos era." },
    { name: "Mist AI and Marvis", what: "Cloud-managed, AI-driven wired and wireless operations with a conversational network assistant." },
    { name: "Aruba Wi-Fi, CX switching, and ClearPass", what: "Enterprise wireless, campus switching, and identity-based network access control." },
    { name: "HPE Aruba Networking Central", what: "The cloud management plane for HPE's edge portfolio." },
  ],
  innovations: [
    { title: "Ethernet for everyone", detail: "3Com turned Metcalfe's PARC invention into commodity adapters, making Ethernet the world's LAN." },
    { title: "Purpose-built routing silicon", detail: "Juniper's M40 proved that separating control and forwarding planes on custom ASICs could beat general-purpose designs by an order of magnitude." },
    { title: "Identity-based access control", detail: "Aruba's ClearPass made who you are, not which port you plug into, the basis of network access." },
    { title: "AI-native network operations", detail: "Mist's cloud microservices and the Marvis assistant moved network troubleshooting from CLI archaeology toward self-driving operations." },
  ],
  markets: [
    "The combined company spans enterprise campus and branch, data center and cloud, service-provider routing, and the new AI data-center buildout. Aruba grew from roughly $729M in sales at acquisition to $5.2B in HPE's fiscal 2023; Juniper adds the service-provider and AI-networking side HPE never had.",
    "The DOJ's own 2025 complaint underlined the stakes: it argued the merged HPE-Juniper and Cisco would together hold more than 70% of the US networking-equipment market - a measure of how consolidated enterprise networking has become.",
  ],
  analyst: [
    "Gartner named Juniper a Leader in the 2025 Magic Quadrant for Enterprise Wired and Wireless LAN Infrastructure.",
    "Aruba (as HPE) and Juniper each spent years as fixtures of that same Magic Quadrant's Leaders quadrant before the merger united their portfolios.",
  ],
  careerLink: {
    href: "/about/vendors/netscreen-juniper",
    label: "Rodolfo's own NetScreen and Juniper years (career page)",
  },
};
