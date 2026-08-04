// ============================================================================
// src/content/vendors/profiles/cloudflare.ts
// ----------------------------------------------------------------------------
// GOLDEN-STANDARD DEMONSTRATOR (PRIME, 2026-08-04). All six sections, each
// carrying research rather than filling a slot.
//
// Written in public voice throughout: no commentary on how the entry was made,
// no markdown (the renderer prints plain text), and nothing asserted that the
// sources do not carry.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const cloudflareProfile: VendorProfile = {
  slug: "cloudflare",

  foundings: [
    {
      company: "Project Honey Pot",
      year: 2004,
      place: "Chicago, Illinois",
      founders: ["Matthew Prince", "Lee Holloway"],
      story:
        "Five years before the company existed, Prince and Holloway built a distributed system that let any website owner watch how spammers harvested email addresses. It worked, and it produced a community of webmasters with a question the project could not answer: knowing who was attacking them did nothing to stop it. That gap between observation and defence is what the company was eventually built to close.",
    },
    {
      company: "Cloudflare",
      year: 2009,
      place: "Palo Alto, California",
      founders: ["Matthew Prince", "Michelle Zatlyn", "Lee Holloway"],
      story:
        "Prince was on sabbatical taking an MBA at Harvard Business School when he described Project Honey Pot to a classmate, Michelle Zatlyn. She saw the commercial shape of it immediately: not tracking threats but blocking them. The first business plan was called Project Web Wall and convinced nobody. A friend of Prince's described what they were building as a firewall in the cloud, and the name that came out of that stuck. Holloway wrote the prototype over the summer. The company was incorporated on 26 July 2009 and its first office was above a nail salon.",
      sourceNote:
        "Founding date and founder list per Cloudflare's own account and Wikipedia; the naming sequence and the Project Web Wall working title come from the company's Our Story page.",
    },
  ],

  timeline: [
    {
      year: 2004,
      title: "Project Honey Pot",
      detail:
        "A distributed spam-tracking network run by Prince and Holloway under Unspam Technologies, and the source of both the threat data and the founding question.",
    },
    {
      year: 2009,
      title: "Incorporated, and a business plan competition won",
      detail:
        "Founded 26 July in Palo Alto after winning the Harvard Business School business plan competition earlier that year. A $2.1M Series A followed in November from Pelion Venture Partners and Venrock.",
    },
    {
      year: 2010,
      title: "Public launch at TechCrunch Disrupt",
      detail:
        "Launched 27 September. Traffic through the network went from roughly 50 million page views a month to more than five billion within the first year, on a freemium model that gave the free tier away and learned from its traffic.",
    },
    {
      year: 2016,
      title: "Lee Holloway steps down",
      detail:
        "The co-founder who wrote the original prototype and led the early engineering team, including its Anycast work, withdrew after a diagnosis of frontotemporal dementia. The company's 2019 flotation was codenamed Project Holloway.",
      sourceNote:
        "Recounted publicly by Prince and Zatlyn on Cloudflare TV. Included because the company tells it themselves and because the engineering it credits is load-bearing.",
    },
    {
      year: 2018,
      title: "1.1.1.1",
      detail:
        "A public DNS resolver launched with a privacy commitment and independent audits, on an address short enough to be memorable and previously used as a dumping ground for misconfigured equipment.",
    },
    {
      year: 2019,
      title: "New York Stock Exchange listing",
      detail: "Listed as NET, ten years after incorporation.",
    },
    {
      year: 2025,
      title: "Scale, and the cost of it",
      detail:
        "Revenue of $2.168B against an operating loss of $207M, with 5,156 employees. Building a global network and giving a large part of it away is expensive at every scale.",
      sourceNote: "Figures from Wikipedia's summary of the 2025 financial statements.",
    },
  ],

  products: [
    {
      name: "Reverse-proxy CDN and WAF",
      what: "The original service: traffic is pointed at Cloudflare by DNS, cached and inspected at the edge, and forwarded to the origin. Everything else was built on this path.",
    },
    {
      name: "DDoS mitigation",
      what: "Absorbing volumetric attacks in a network large enough that an attack sized to overwhelm one customer is not sized to overwhelm the network carrying them.",
    },
    {
      name: "Workers",
      what: "Code that runs at the edge rather than in a region, on an isolate model that starts fast enough to sit in the request path without adding a cold start to it.",
    },
    {
      name: "R2",
      what: "Object storage sold without egress fees, which is a pricing decision aimed squarely at the charge that makes leaving a cloud provider expensive.",
    },
    {
      name: "Cloudflare One and Zero Trust",
      what: "Access, gateway and tunnel services that put the same edge in front of internal applications, competing with the secure service edge vendors elsewhere on this timeline.",
    },
    {
      name: "1.1.1.1",
      what: "A public recursive resolver, offered free, which also gives the company a view of DNS behaviour at a scale very few organisations have.",
    },
  ],

  innovations: [
    {
      title: "Free tier as an instrument, not a discount",
      detail:
        "The free plan was not customer acquisition alone. A network carrying millions of small sites sees attacks earlier and more often than one carrying a few large ones, and the data improves the defence sold to everybody. The giveaway is how the product learns.",
    },
    {
      title: "Anycast as the architecture rather than a feature",
      detail:
        "The same address announced from every location, so traffic lands at the nearest point of presence and an attack is divided across the network instead of concentrated. It is why capacity and defence are the same asset here.",
    },
    {
      title: "Edge compute without cold starts",
      detail:
        "Workers use V8 isolates rather than containers, trading isolation strength and language freedom for start times low enough to run per-request. That trade is the whole product decision, and it is the reason the model suits request handling rather than long jobs.",
    },
    {
      title: "Egress pricing as a competitive weapon",
      detail:
        "Charging nothing to take data out attacks the specific fee that makes migration between clouds expensive. It is a pricing argument aimed at a structural one.",
    },
  ],

  markets: [
    "Two very different customers on one platform: millions of small sites on the free and low-cost tiers, and enterprises buying performance, security and increasingly network services. The company reports over 100,000 paying customers against tens of millions of properties, which is the freemium shape stated plainly.",
    "Its network reaches 300 or more cities across 100 or more countries, and its position competes on different fronts at once - content delivery against Akamai, security against the firewall and secure service edge vendors, and developer platform against the large cloud providers whose egress fees it undercuts.",
  ],

  analyst: [
    "Named in analyst coverage across several distinct categories rather than one, which reflects a portfolio assembled around a single network rather than a single product line.",
    "The financial picture is worth reading alongside the growth: revenue above $2B in 2025 with an operating loss, which is what building global infrastructure and giving a substantial part of it away looks like on a balance sheet.",
  ],
};
