// ============================================================================
// src/content/vendors/profiles/netskope.ts
// ----------------------------------------------------------------------------
// NETSKOPE - the newest teaching pillar. Another page with Juniper DNA:
// founder-CEO Sanjay Beri and the founding engineers came out of Juniper
// Networks, tying this profile to the NetScreen/Juniper career page.
//
// Verified 2026-07-15: CNBC (IPO priced Sept 17, 2025 at $19, top of range,
// raising $908M; traded Sept 18, 2025 on Nasdaq as NTSK, opening at $23,
// ~$8.6B market cap, >20x oversubscribed; founded 2012, Santa Clara; ARR
// $707M +33% at end of July 2025; 2,910 employees, 4,317 customers),
// Capital.com/Forge (founders Sanjay Beri, Lebin Cheng, Ravi Ithal, Krishna
// Narayanaswamy; $300M ICONIQ round July 2021 at $7.5B), company record
// (NewEdge private security cloud; Netskope One platform; >30 of the
// Fortune 100; inaugural Gartner SSE Magic Quadrant leader 2022).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const netskopeProfile: VendorProfile = {
  slug: "netskope",
  foundings: [
    {
      company: "Netskope",
      year: 2012,
      place: "Santa Clara, California",
      founders: ["Sanjay Beri", "Lebin Cheng", "Ravi Ithal", "Krishna Narayanaswamy"],
      story:
        "Sanjay Beri left a vice presidency at Juniper Networks in 2012 convinced that the perimeter was already gone: work was moving into SaaS and cloud faster than any firewall could follow. With three fellow Juniper engineering veterans - Lebin Cheng, Ravi Ithal, and Krishna Narayanaswamy - he founded Netskope to see and govern that traffic itself, app by app, activity by activity. The company became a defining name in the brand-new CASB category, then spent the next decade building outward from it into the full cloud security edge.",
    },
  ],
  timeline: [
    { year: 2012, title: "Founded by Juniper alumni", detail: "Netskope starts in Santa Clara with a contrarian premise: the interesting traffic is no longer on your network, so security has to move to where the users and the SaaS are. Accel and Lightspeed back the early rounds." },
    { year: 2015, title: "The CASB years", detail: "As 'cloud access security broker' enters the analyst vocabulary, Netskope's deep API plus inline coverage of thousands of SaaS apps makes it one of the category's reference implementations - visibility and control at the granularity of a single action inside an app." },
    { year: 2020, title: "From CASB to SASE", detail: "Remote work makes the thesis mainstream overnight. Netskope expands into secure web gateway and zero trust network access, carried on NewEdge - its own private security cloud, built out to serve inspection close to every user rather than backhauled through choke points." },
    { year: 2021, title: "A $7.5 billion private valuation", detail: "July 2021: a $300 million round led by ICONIQ values the company at $7.5 billion, funding the NewEdge buildout and the run at the converged edge market.", sourceNote: "Company release; press reporting." },
    { year: 2022, title: "Leader in the first SSE Magic Quadrant", detail: "Gartner carves Security Service Edge out of SASE and names Netskope a Leader in the inaugural Magic Quadrant - placement it has held as the category matured. Borderless SD-WAN (from the Infiot acquisition) completes the single-vendor SASE picture." },
    { year: 2025, title: "IPO: NTSK", detail: "September 18, 2025: Netskope lists on Nasdaq as NTSK after pricing at $19 - the top of a raised range - collecting $908 million in one of the year's marquee security debuts; shares open at $23 for a market value around $8.6 billion. ARR stands at $707 million, up 33 percent.", sourceNote: "CNBC, Sept 17-18, 2025." },
    { year: 2026, title: "Netskope One", detail: "The platform era: security and networking services converged as Netskope One, spanning SSE, SD-WAN, and digital experience management on NewEdge - and, increasingly, controls for enterprise AI usage." },
  ],
  products: [
    { name: "Netskope One", what: "The converged platform: CASB, secure web gateway, ZTNA, firewall, DLP, and SD-WAN delivered as one cloud service with a single policy model." },
    { name: "Next Gen Secure Web Gateway", what: "Inline inspection of web and cloud traffic with the app- and activity-level context Netskope is known for." },
    { name: "Netskope Private Access", what: "Zero trust network access: user-to-application connectivity that never puts the user on the network." },
    { name: "NewEdge", what: "The privately operated security cloud behind it all - inspection points spread across dozens of regions, peered directly with the big SaaS and cloud providers so security does not cost latency." },
  ],
  innovations: [
    { title: "Activity-level cloud visibility", detail: "Not just 'which app' but 'which action in which app instance by which user' - the granularity that defined CASB and still distinguishes cloud-native inspection from port-and-protocol firewalls." },
    { title: "A private security cloud", detail: "NewEdge: building and peering its own global inspection network instead of renting public cloud regions - performance as a security feature." },
    { title: "Single-vendor SASE from the security side", detail: "Growing from CASB to full SSE and then adding the WAN - the reverse of the networking vendors' route into the same market." },
  ],
  markets: [
    "Netskope competes at the center of the SSE and SASE market against Zscaler, Palo Alto Networks, Cisco, and Broadcom, serving more than 4,300 customers including over 30 of the Fortune 100 - enterprises replacing web proxies, VPNs, and branch security stacks with cloud-delivered inspection.",
  ],
  analyst: [
    "A Leader in Gartner's Security Service Edge Magic Quadrant from its inaugural 2022 edition onward - the analyst framing that turned the company's founding thesis into a named market.",
  ],
};
