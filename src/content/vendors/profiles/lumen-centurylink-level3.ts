// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - FundingUniverse: Level 3 organised inside Kiewit Diversified Group from
//     mid-1997 by James Q. Crowe, who had built MFS Communications inside the
//     same parent; 18 former MFS executives recruited from WorldCom; the first
//     objective was selling KDG's NON-TELECOM assets to fund the fibre build;
//     the network deliberately built with fibre run through buried CONDUIT so
//     it could be upgraded without re-digging
//   - companieshistory: the name references Layer 3 of the OSI model, the
//     routing layer, because the network was built for IP rather than circuits;
//     Walter Scott Jr., Kiewit chairman from 1979, backing the raise
//   - Wikipedia: Level 3 owned AS1 following the Genuity acquisition (which had
//     it from BBN) but operated on AS3356; Jeff Storey, Level 3's chief
//     executive, became CenturyLink's chief operating officer and then chief
//     executive a year later under a PREARRANGED succession
//   - HandWiki and CenturyLink SEC filings: DOJ approval conditional on
//     divesting 24 fibre lines across 30 city pairs plus metro Ethernet in
//     Boise, Tucson and Albuquerque; CenturyLink holders ~51% and Level 3
//     holders ~49% of the combined company
//
// *** BODY READ AFTER DRAFTING. The body tells this from the CENTURYLINK side -
// rural Louisiana, Embarq, Qwest, and Global Crossing's collapse. The research
// came from the LEVEL 3 side, so the two are almost entirely complementary. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const lumenProfile: VendorProfile = {
  slug: "lumen-centurylink-level3",
  foundings: [
    {
      company: "Kiewit Diversified Group, which became Level 3",
      year: 1985,
      place: "Omaha, Nebraska",
      founders: ["Peter Kiewit Sons'"],
      story:
        "A construction company's holding vehicle for everything that was not construction. That parentage is not incidental: Kiewit's expertise was in digging, and the network its subsidiary eventually built reflected it. James Crowe had already built MFS Communications inside the same group - the company that acquired UUNET and was sold to WorldCom for $14.3B - and in 1997 he started again, recruiting eighteen of his former executives back out of WorldCom and selling the group's non-telecommunications assets to pay for the fibre.",
    },
  ],
  timeline: [
    {
      year: 1998,
      title: "Named after a layer",
      detail:
        "The renaming points at Layer 3 of the OSI model - the routing layer. A telecommunications company named itself after the part of the stack it intended to serve, at a moment when its competitors were still selling circuits.",
    },
    {
      year: 2003,
      title: "Genuity, and AS1",
      detail:
        "Buying Genuity brought with it the first autonomous system number ever allocated, which had belonged to BBN - the company that built the ARPANET. The network operates on AS3356 and has held AS1 ever since without using it.",
    },
    {
      year: 2017,
      title: "The acquired company's chief executive takes over",
      detail:
        "The merger completed on 1 November after the Department of Justice required divesting twenty-four fibre routes across thirty city pairs and three metro Ethernet markets. Level 3's chief executive became the combined company's chief operating officer and then its chief executive a year later, under a succession arranged before the deal closed.",
    },
  ],
  products: [
    { name: "The IP backbone", what: "AS3356, one of the most densely connected networks on the internet, reaching most of it without paying anyone for transit. It is the asset everything else in the company is now organised around." },
    { name: "Enterprise fibre and wavelengths", what: "Dedicated capacity between customer sites and data centres, sold to the organisations for whom the public internet is not an acceptable path." },
    { name: "Edge computing and security services", what: "Compute placed in the network rather than in a region, and DDoS mitigation delivered from a backbone large enough to absorb attacks - the same argument content delivery networks make, from the other direction." },
    { name: "Local exchange services", what: "The rural telephone business the company spent fifty years assembling, most of which has since been sold." },
  ],
  innovations: [
    {
      title: "Conduit, not cable",
      detail:
        "The network was built by burying empty conduit and pulling fibre through it, so capacity could be upgraded later without digging the route again. That is a construction company's answer to a telecommunications problem, and it is the reason a network designed in the late nineties is still competitive - the expensive part was the trench, and the trench was built to be reused.",
    },
    {
      title: "Building for packets when the money was in circuits",
      detail:
        "Optimising for internet protocol rather than for switched voice was a bet against the industry's own revenue base at the time. Naming the company after the routing layer was a way of saying so out loud.",
    },
    {
      title: "Selling the rest of the company to fund the network",
      detail:
        "The start-up capital came from liquidating a construction group's unrelated holdings. Infrastructure at this scale cannot be funded incrementally out of revenue, and the companies that tried during the same period are on this timeline as bankruptcies.",
    },
    {
      title: "Assembling a backbone from the failures of others",
      detail:
        "Almost every major asset arrived from a company that could not sustain it alone. Building it new was ruinous; buying it after the fact was affordable. That is the actual economics of the fibre era, and this company is the clearest example of the side that survived it.",
    },
  ],
  markets: [
    "Enterprises, governments, content providers and other carriers, plus the residential and business lines remaining after the 2022 divestiture. The customer for the backbone is anybody moving enough traffic to care which network carries it.",
    "It competes with the other large backbone operators and, increasingly, with the hyperscalers' private networks - which now carry a substantial share of the world's traffic on infrastructure they built themselves rather than bought.",
  ],
  analyst: [
    "Assessments centre on the debt taken on to assemble the network against the value of owning fibre routes that nobody would fund building again today. The asset is genuinely difficult to reproduce; the balance sheet is the argument.",
    "The longer view is that a construction subsidiary in Nebraska and a rural telephone company in Louisiana between them ended up owning one of the internet's principal backbones, and neither set out to. The routes existed because somebody was willing to dig, and the digging turned out to be the durable part.",
  ],
};
