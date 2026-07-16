// ============================================================================
// A10 & KEMP - the ADC challengers, consolidated per the roster (C6): the
// second tier that kept the load-balancing leaders honest. Knowledge-based,
// dates well-documented (2026-07-17): A10 Networks founded 2004 San Jose by
// Lee Chen (co-founder of Centillion Networks and Foundry Networks); AX
// Series then Thunder on ACOS; years of litigation with Brocade (Foundry's
// acquirer) ended in settlement (kept figure-free - the verdict/settlement
// history is convoluted); IPO NYSE March 2014 (ATEN); CGNAT and Thunder TPS
// DDoS strength in service providers; Dhrupad Trivedi CEO from 2019. Kemp
// Technologies founded 2000, New York; LoadMaster as the affordable ADC,
// famously strong in Microsoft workloads (Exchange/SharePoint sizing);
// early virtual LoadMaster; acquired by Progress Software 2021 (~$258M,
// sourceNoted). Founder names for Kemp not individually asserted beyond
// the record's confidence - phrased honestly.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const a10KempProfile: VendorProfile = {
  slug: "a10-kemp",
  foundings: [
    {
      company: "Kemp Technologies",
      year: 2000,
      place: "New York, United States",
      founders: ["Founded 2000 in New York (Peter Melerud among its founding technologists)"],
      story:
        "Kemp attacked the load-balancing market from below. While the leaders sold six-figure chassis to people with change-control boards, LoadMaster sold for the price of a server to the administrator who just needed Exchange to stay up - and Kemp leaned into exactly that buyer, publishing Microsoft-workload deployment guides so specific they became the documentation of record. An early, wholehearted move to virtual appliances widened the wedge: when the hypervisor became the data center, Kemp was already there, priced for the mid-market the giants kept forgetting.",
    },
    {
      company: "A10 Networks",
      year: 2004,
      place: "San Jose, California",
      founders: ["Lee Chen"],
      story:
        "Lee Chen had already co-founded Centillion Networks and Foundry Networks when he started A10 in 2004 - a third act aimed at the application-delivery market from the performance flank. The AX Series, and later the Thunder line on the ACOS operating system, courted the buyers who measure in millions of concurrent sessions: service providers, carriers, and the web-scale operators for whom carrier-grade NAT and DDoS absorption are line items, not features. Where the market leader owned the enterprise data center, A10 built its franchise where the traffic is heaviest.",
    },
  ],
  timeline: [
    { year: 2004, title: "A10 founded", detail: "Chen's third company enters application delivery with a performance thesis: purpose-built hardware and ACOS software for the highest-throughput tier of the market." },
    { year: 2008, title: "LoadMaster goes virtual early", detail: "Kemp ships virtual editions while much of the industry still equates an ADC with sheet metal - a bet on the hypervisor that pays compounding dividends as data centers virtualize." },
    { year: 2012, title: "The Foundry shadow", detail: "Years of litigation between Brocade (Foundry's acquirer) and A10 over Foundry-era intellectual property run their course and end in settlement - a bruising chapter the company absorbs and outlives.", sourceNote: "Brocade v. A10 litigation and settlement per the public record; the verdict-and-appeal history is deliberately summarized without figures." },
    { year: 2014, title: "A10 goes public", detail: "March 2014: A10 lists on the NYSE as ATEN, its service-provider franchise - CGNAT for the IPv4 endgame, Thunder TPS for DDoS - now the company's signature." },
    { year: 2016, title: "The CGNAT decade", detail: "IPv4 exhaustion turns carrier-grade NAT from a transition hack into permanent infrastructure, and A10's Thunder CGN becomes one of the boxes the mobile internet quietly runs through." },
    { year: 2019, title: "New leadership at A10", detail: "Dhrupad Trivedi takes the helm; the company tightens around security and service-provider infrastructure - DDoS defense, TLS inspection, and the 5G core edge." },
    { year: 2021, title: "Progress acquires Kemp", detail: "Progress Software buys Kemp for approximately $258 million - the affordable-ADC pioneer becoming the application-experience arm of a software house, LoadMaster continuing under new ownership.", sourceNote: "Approximately $258M, announced September 2021, closed November 2021, per Progress Software's public statements." },
  ],
  products: [
    { name: "Thunder / ACOS (A10)", what: "The high-throughput ADC, CGNAT, and DDoS-defense line - the service-provider tier's alternative answer." },
    { name: "LoadMaster (Kemp)", what: "The affordable ADC in hardware, virtual, and cloud forms - load balancing sized and priced for the workloads most organizations actually run." },
    { name: "Thunder TPS", what: "A10's DDoS mitigation platform - absorption and scrubbing at the carrier scale where attacks are weather, not events." },
  ],
  innovations: [
    { title: "Keeping the leaders honest", detail: "The challengers' structural contribution: every F5 or Citrix quote for two decades was written knowing A10 could undercut on throughput-per-dollar and Kemp on entry price. Competitive gravity is an innovation too." },
    { title: "The virtual-first ADC", detail: "Kemp's early virtual LoadMaster reframed the ADC as software with optional sheet metal - the framing the whole market, leaders included, eventually adopted." },
  ],
  markets: [
    "A10: service providers, carriers, and web-scale operators - CGNAT, DDoS defense, TLS inspection, 5G infrastructure. Kemp: the mid-market and Microsoft-workload world, now inside Progress. Between them, the proof that application delivery is a market, not a monopoly.",
  ],
  analyst: [
    "The load-balancing methods taught on this site - the algorithms, the health monitors, the persistence models - are the same machinery these platforms market; the vendor changes, the mathematics does not.",
    "The pair also maps the market's two honest escape routes from the leader's pricing: down (Kemp's entry cost) and sideways (A10's throughput tier) - the study in how challengers survive a category with a dominant incumbent.",
  ],
};
