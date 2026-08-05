// ============================================================================
// src/content/vendors/profiles/equinix.ts
// ----------------------------------------------------------------------------
// VERIFICATION MANIFEST
//
// Verified 2026-08-04 against:
//   - Equinix Q3 2025 results (newsroom + investor relations): 499,000+ total
//     interconnections, 7,100 net adds in the quarter, interconnection revenue
//     of $422M up 10% year over year, Fabric bookings up 57%, new cloud
//     on-ramps in Barcelona and Dubai
//   - Equinix Q1 2025 disclosure via trade press: 56 major projects across 33
//     metros in 24 countries, 12 of them xScale
//   - 2025 Analyst Day targets: 7-10% annual revenue growth and 5-9% AFFO
//     growth through 2029
//   - Chennai CN1 opening, September 2025 (800 cabinets scaling toward 4,250)
//
// FIGURES VARY BY SOURCE AND QUARTER - 260+ IBX sites, 70 or 71 metros, 33
// countries, 10,000+ customers, 460,000 to 499,000 interconnections. The
// ranges are given as ranges rather than picked.
//
// WRITTEN TO COMPLEMENT THE EXISTING BODY, which already argues the neutrality
// thesis, the PAIX origin, the Switch and Data loop and the interconnection
// insight. This adds the dated timeline, the product taxonomy, the market
// position and the financial standing - not a second telling of the argument.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const equinixProfile: VendorProfile = {
  slug: "equinix",

  foundings: [
    {
      company: "PAIX, the Palo Alto Internet Exchange",
      year: 1996,
      place: "Palo Alto, California",
      founders: ["Digital Equipment Corporation"],
      story:
        "Built and run inside DEC, and the place where the idea was proven before there was a company to sell it. An exchange operated by a party with no network of its own turned out to be a different product from an exchange operated by a carrier, because the operator had nothing to gain from how the traffic flowed.",
    },
    {
      company: "Equinix",
      year: 1998,
      place: "Redwood City, California",
      founders: ["Al Avery", "Jay Adelson"],
      story:
        "Incorporated on 22 June by the two DEC facilities managers who had run PAIX. The thesis was that the buildings where networks meet should be owned by somebody who sells no transit, carries no traffic and competes with none of the tenants. Benchmark Capital led a $12M round with Cisco and Microsoft as strategic investors, which is a fair indication of who found the argument persuasive.",
    },
  ],

  timeline: [
    { year: 1996, title: "PAIX begins operating", detail: "Inside DEC, as the proof that a neutral exchange behaves differently from a carrier-run one." },
    { year: 1998, title: "Equinix incorporated", detail: "22 June, by Al Avery and Jay Adelson, to build neutral exchange points as a business rather than a research facility." },
    { year: 2000, title: "NASDAQ listing", detail: "Listed in August, months before the collapse that removed most of its contemporaries." },
    {
      year: 2010,
      title: "Switch and Data, and PAIX comes home",
      detail:
        "The acquisition brought Switch and Data's facilities, and with them PAIX itself.",
    },
    {
      year: 2015,
      title: "Conversion to a real estate investment trust",
      detail:
        "A structural decision with behavioural consequences: a REIT must distribute the large majority of its taxable income, which pushes a business toward predictable recurring revenue and long contracts rather than growth at any cost.",
    },
    {
      year: 2025,
      title: "Interconnection at scale, and the hyperscale question",
      detail:
        "More than 499,000 interconnections deployed, with interconnection revenue of $422M in the third quarter alone. Meanwhile 56 major projects were under way across 33 metros, twelve of them xScale hyperscale builds funded through joint ventures with institutional investors.",
      sourceNote: "Q3 2025 results and Q1 2025 project disclosure; counts move quarter to quarter.",
    },
  ],

  products: [
    {
      name: "IBX colocation",
      what: "The International Business Exchange: cabinet or cage space, power circuits and physical security, sold on long recurring contracts. The floor space is the entry point rather than the product.",
    },
    {
      name: "Cross-connects",
      what: "A dedicated fibre run between two customers inside the same building. The highest-margin line in the business, and the one a competitor cannot replicate without first assembling the same set of tenants.",
    },
    {
      name: "Equinix Fabric",
      what: "Software-defined connections between parties and between metros, extending the cross-connect idea beyond the walls of one facility. Bookings grew 57% year over year in 2025.",
    },
    {
      name: "Cloud on-ramps",
      what: "Direct private connections into the major cloud providers, positioned as a market-share measure in its own right: how many of the on-ramps in a given metro land in your building.",
    },
    {
      name: "xScale",
      what: "Purpose-built hyperscale campuses for the largest cloud operators, funded through joint ventures rather than the balance sheet - a different customer, a different economics, and a deliberate separation from the interconnection business.",
    },
  ],

  innovations: [
    {
      title: "Neutrality as a physical property, not a policy",
      detail:
        "The landlord owns no network, sells no transit and carries no traffic. That is not a commitment that can be revised by a future management: it is a description of what the company does not own, which is why tenants who compete with each other will share a floor.",
    },
    {
      title: "The network effect that cannot be bought",
      detail:
        "A building becomes valuable in proportion to who is already in it, and each new tenant makes it more valuable to the next. Nearly half a million interconnections is not a feature list - it is the reason a competitor with identical buildings and lower prices still loses the deal.",
    },
    {
      title: "Selling the connection rather than the floor",
      detail:
        "Interconnection is roughly a fifth of revenue at a much higher margin than colocation, and growing faster. The business that looks like real estate is substantially a connectivity business operating inside real estate.",
    },
    {
      title: "The REIT structure as strategy",
      detail:
        "Converting in 2015 committed the company to distributing most of its income, which suits an asset base with twenty-year lives and contracted revenue. It also constrains how fast it can chase a market - which is a discipline in a sector where overbuilding has killed competitors before.",
    },
  ],

  markets: [
    "Around 260 facilities across roughly 70 metros in 33 countries, serving more than 10,000 customers - cloud and hyperscale providers, carriers, content networks, and enterprises running hybrid architectures that need to touch several clouds without crossing the public internet to do it. Reported revenue was approximately $8.3B to $8.8B for 2024 with 2025 guided toward $9.2B.",
    "Recent expansion has been into markets without established interconnection density - Johannesburg, Kuala Lumpur, Chennai - where the proposition is to become the meeting point before anybody else does, which is the same play as the original one and depends on arriving first.",
  ],

  analyst: [
    "Consistently ranked at the top of data centre and colocation provider assessments, with the distinguishing metric being interconnection density rather than floor area or power capacity.",
    "The structural question the analysts return to is whether the largest customers eventually build their own. Hyperscalers taking capacity in-house would remove the biggest tenants from the neutral model, and the xScale joint ventures are in part an answer to that: serve the hyperscale build rather than compete with it.",
    "Around 94% of revenue is recurring and roughly 92% comes from existing customers, which is what a business built on switching costs looks like on a financial statement.",
  ],
};
