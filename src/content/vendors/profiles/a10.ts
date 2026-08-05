// ============================================================================
// SPLIT FROM a10-kemp.ts on 2026-08-05 (PRIME: "split A10 and Kemp into two
// separate entries, they may reference each other, but each company with its
// own entry"). Content is the A10 half of the original, unchanged in substance.
// ============================================================================
import type { VendorProfile } from "@/content/vendors/profile-types";

export const a10Profile: VendorProfile = {
  slug: "a10",
  foundings: [
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
    { year: 2004, title: "Founded", detail: "Chen's third company enters application delivery with a performance thesis: purpose-built hardware and ACOS software for the highest-throughput tier of the market." },
    { year: 2012, title: "The Foundry shadow", detail: "Years of litigation between Brocade, which had acquired Foundry, and A10 over Foundry-era intellectual property run their course and end in settlement - a bruising chapter the company absorbs and outlives.", sourceNote: "Brocade v. A10 litigation and settlement per the public record; the verdict-and-appeal history is deliberately summarised without figures." },
    { year: 2014, title: "New York Stock Exchange listing", detail: "March 2014: listed as ATEN, with the service-provider franchise - CGNAT for the IPv4 endgame, Thunder TPS for DDoS - now the company's signature." },
    { year: 2016, title: "The CGNAT decade", detail: "IPv4 exhaustion turns carrier-grade NAT from a transition hack into permanent infrastructure, and Thunder CGN becomes one of the boxes the mobile internet quietly runs through." },
    { year: 2019, title: "New leadership", detail: "Dhrupad Trivedi takes the helm; the company tightens around security and service-provider infrastructure - DDoS defence, TLS inspection, and the 5G core edge." },
  ],
  products: [
    { name: "Thunder and ACOS", what: "The high-throughput ADC, CGNAT and DDoS-defence line - the service-provider tier's alternative answer." },
    { name: "Thunder TPS", what: "DDoS mitigation at the carrier scale where attacks are weather rather than events - absorption and scrubbing rather than blocking." },
    { name: "Thunder CGN", what: "Carrier-grade NAT, which IPv4 exhaustion turned from a temporary measure into permanent infrastructure that a great deal of mobile traffic passes through." },
  ],
  innovations: [
    { title: "Competing on throughput per dollar", detail: "Rather than match the leader feature for feature in the enterprise, A10 went where volume decides: the tier measured in millions of concurrent sessions. That is a narrower market and a harder one to displace an incumbent from, because the buyer tests before they sign." },
    { title: "Keeping the leaders honest", detail: "The structural contribution of a credible challenger: every competing quote for two decades was written knowing A10 could undercut on throughput per dollar. Competitive gravity is an innovation too, and it is the reason application delivery never became a monopoly." },
  ],
  markets: [
    "Service providers, carriers and web-scale operators - carrier-grade NAT, DDoS defence, TLS inspection and 5G infrastructure. The customer is one for whom traffic volume is the defining constraint rather than feature breadth.",
    "Its counterpart from the other direction is Kemp, which attacked the same category from below on price and appears separately on this timeline.",
  ],
  analyst: [
    "Assessed as a durable second-tier presence in application delivery with a genuine lead in the service-provider and DDoS segments rather than a general-purpose challenge to the leader.",
    "The load-balancing methods taught on this site - the algorithms, the health monitors, the persistence models - are the same machinery this platform markets. The vendor changes; the mathematics does not.",
  ],
};
