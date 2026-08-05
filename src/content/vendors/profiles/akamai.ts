// ============================================================================
// src/content/vendors/profiles/akamai.ts
// ----------------------------------------------------------------------------
// VERIFICATION MANIFEST (the F5 pattern, adopted 2026-08-04)
//
// Verified 2026-08-04 against:
//   - MIT News and the MIT Alumni Association (National Inventors Hall of Fame,
//     2017; Leighton PhD '81; Lewin SM '97)
//   - The Marconi Society (2018 Marconi Prize citation: the Berners-Lee
//     problem, the $50K competition entry that did NOT win, August 1998
//     incorporation, March Madness 1999, and the September 2001 account)
//   - Akamai's own memorial page for Danny Lewin
//   - CNN and Slate retrospectives (Flight 11; the 10 September layoff meeting;
//     the stock arc from $300+ to under $5)
//
// SOURCES DISAGREE on Lewin's degree year (SM '97 in the Alumni Association,
// SM '98 in MIT News) and on the exact founder list beyond Leighton and Lewin.
// Both are handled in the text rather than resolved.
//
// The 11 September material is stated plainly and once. It is load-bearing to
// the company's history and is on the public record in the company's own words,
// so it is not omitted - and it is not dwelt on either.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const akamaiProfile: VendorProfile = {
  slug: "akamai",

  foundings: [
    {
      company: "Akamai Technologies",
      year: 1998,
      place: "Cambridge, Massachusetts",
      founders: [
        "Tom Leighton",
        "Danny Lewin",
        "Jonathan Seelig",
        "Preetish Nijhawan",
        "Randall Kaplan",
      ],
      story:
        "The problem came from down the hall. Tim Berners-Lee, then at MIT, described what was being called the World Wide Wait: a popular page collapsed under its own audience, because every request for it travelled to one server. Tom Leighton, who led the theoretical computer science group at MIT's Laboratory for Computer Science, and his graduate student Danny Lewin spent two years on it as a mathematics problem rather than an engineering one. Lewin's answer became his master's thesis. They entered the MIT $50,000 entrepreneurship competition in 1997 and did not win it, which turned out not to matter, and incorporated on 20 August 1998. The name is Hawaiian for clever.",
      sourceNote:
        "Founder list per company histories; sources beyond Leighton and Lewin vary in who they name and in what order. Lewin's degree year appears as both SM '97 and SM '98 in MIT's own publications.",
    },
  ],

  timeline: [
    {
      year: 1997,
      title: "Consistent hashing",
      detail:
        "Lewin's thesis work, developed with Leighton, on distributing requests across a changing set of servers so that adding or removing one moves as few keys as possible. It won MIT's award for best master's thesis presentation the following year.",
    },
    {
      year: 1998,
      title: "Incorporation",
      detail:
        "Founded 20 August in Cambridge, after a business plan competition entry that did not win but attracted venture funding.",
    },
    {
      year: 1999,
      title: "March Madness, then the IPO",
      detail:
        "The first public proof was the US college basketball tournament: sixty-four teams, a few days, and an audience that arrived all at once. The company listed on NASDAQ on 29 October, raising around $234M. The shares opened at $26 and closed their first day above $145.",
    },
    {
      year: 2001,
      title: "The crash, and 11 September",
      detail:
        "The stock fell from over $300 to under $5 as the dot-com collapse ran its course. On 10 September the executives sat late deciding who to lay off. The next morning Danny Lewin was killed aboard American Airlines Flight 11, aged 31; he is generally held to have been the first person killed in the attacks. The same day, the network he had designed carried news sites through the heaviest traffic they had ever seen, and the remaining staff spent it completing emergency integrations for publishers whose own servers had failed.",
      sourceNote:
        "Flight, age and the emergency integration work per Akamai's own memorial page, the Marconi Society citation and contemporary CNN reporting. Lewin, a former Israeli special forces officer, is widely reported to have attempted to stop the hijacking; that account rests on flight-recorder analysis and is not established.",
    },
    {
      year: 2005,
      title: "Speedera",
      detail:
        "The acquisition of its closest competitor also settled the patent litigation between them, which is a common shape in infrastructure: buying a rival and buying the end of a lawsuit at the same time.",
    },
    {
      year: 2017,
      title: "National Inventors Hall of Fame",
      detail:
        "Leighton and Lewin inducted together, sixteen years after Lewin's death, for the algorithms behind content delivery.",
    },
  ],

  products: [
    {
      name: "FreeFlow, and what became EdgeSuite",
      what: "The original service: a publisher rewrote the URLs of its heavy objects so they resolved to Akamai, and the images and video came from a server near the reader instead of from the origin.",
    },
    {
      name: "Edge delivery platform",
      what: "Caching and routing across a network that reached tens of thousands of servers inside carrier and ISP networks rather than in a handful of large data centres - the architectural choice that distinguishes it from later entrants.",
    },
    {
      name: "Kona and App & API Protector",
      what: "Web application firewalling and DDoS mitigation delivered from the same edge, on the reasoning that a network already terminating the connection is the natural place to inspect it.",
    },
    {
      name: "Guardicore segmentation",
      what: "Acquired in 2021, moving the company into east-west traffic inside the data centre - a different problem from the one it was founded on.",
    },
    {
      name: "Linode and connected compute",
      what: "Acquired in 2022, adding general-purpose cloud compute to a delivery network, and putting the company in a market it had previously sat in front of rather than in.",
    },
  ],

  innovations: [
    {
      title: "Consistent hashing",
      detail:
        "The foundational contribution, and it long outgrew the company. Distribute keys around a ring so that adding or removing a server moves only a small fraction of them, rather than reshuffling everything. It is now standard in distributed caches, sharded databases and load balancers built by people who have never thought about content delivery. A master's thesis became infrastructure.",
    },
    {
      title: "Putting servers inside other people's networks",
      detail:
        "Rather than build a few large data centres, Akamai placed machines deep inside carrier and ISP networks. That is harder commercially than technically - it requires thousands of separate relationships - and it is why the network is close to users in places a centralised design cannot reach.",
    },
    {
      title: "Mapping as a live system",
      detail:
        "Deciding which edge server should answer a given request is a continuous measurement problem rather than a static configuration. The routing decision responds to congestion and failure as they happen, which is the part that is genuinely difficult to copy.",
    },
    {
      title: "Delivery and defence as one network",
      detail:
        "Capacity built to absorb legitimate traffic surges also absorbs illegitimate ones. The company that solved the flash crowd found it had built the natural place to stop a denial-of-service attack, and the security business followed from the delivery business rather than being bolted onto it.",
    },
  ],

  markets: [
    "Media and software distribution first - the customers who feel a traffic spike as an outage - then commerce, banking and government, and increasingly enterprise security. Its early customer list read Yahoo, Apple, CNN and Microsoft, which is a fair description of who had a scaling problem in 1999.",
    "It now competes against later entrants with different architectures: cloud providers bundling delivery with their own platforms, and edge companies built after the problems Akamai solved had become assumptions. Its distinguishing position remains depth of placement inside carrier networks rather than breadth of feature.",
  ],

  analyst: [
    "Consistently placed among the leaders in content delivery and increasingly in web application and API protection, which reflects a company that turned its infrastructure into a security position rather than acquiring one.",
    "The longer measure is that the algorithms it was founded on are taught as general computer science rather than as company technology, and the traffic patterns it was built for - everybody arriving at once - are now the normal condition of the web rather than an exception.",
  ],
};
