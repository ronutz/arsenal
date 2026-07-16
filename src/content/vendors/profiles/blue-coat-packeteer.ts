// ============================================================================
// BLUE COAT & PACKETEER - the proxy as a security platform, and traffic
// shaping as a category. Knowledge-based, dates well-documented (2026-07-16):
// CacheFlow founded 1996 (Michael Malcolm); the Nov 1999 IPO one of the
// bubble's legendary first days; renamed Blue Coat Systems 2002 pivoting
// from caching to security proxies (ProxySG, SSL inspection). Packeteer
// founded 1996, Cupertino; PacketShaper creates application-aware traffic
// shaping; Blue Coat acquires Packeteer June 2008 (~$268M). Thoma Bravo
// take-private 2011 (~$1.3B); Bain 2015 (~$2.4B); Symantec acquires Blue
// Coat June 2016 (~$4.65B, Greg Clark becomes Symantec CEO); Symantec's
// enterprise business to Broadcom 2019 (~$10.7B) - where the ProxySG
// lineage lives today.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const blueCoatPacketeerProfile: VendorProfile = {
  slug: "blue-coat-packeteer",
  foundings: [
    {
      company: "CacheFlow (Blue Coat Systems from 2002)",
      year: 1996,
      place: "Sunnyvale, California",
      founders: ["Michael Malcolm"],
      story:
        "CacheFlow built appliances that stored the web closer to its readers - and rode the bubble to one of the most spectacular IPO first days of 1999. When the caching market deflated with the bubble, the company executed one of the era's cleanest pivots: the same box in the same place - between users and the internet - resold as a SECURITY control. Renamed Blue Coat in 2002, the ProxySG became the enterprise web proxy: authentication, filtering, and eventually SSL inspection, the checkpoint through which corporate web traffic learned to pass.",
    },
    {
      company: "Packeteer",
      year: 1996,
      place: "Cupertino, California",
      founders: ["Brett Galloway and colleagues"],
      story:
        "Packeteer's PacketShaper answered a question routers of the day could not: not WHETHER traffic passes, but HOW MUCH, of WHAT, and WHO goes first. Classifying flows by application and enforcing per-class rates, it created the traffic-shaping category outright - the WAN's referee in the era when a single FTP transfer could starve a branch office - and gave the industry the vocabulary of application-aware bandwidth control.",
    },
  ],
  timeline: [
    { year: 1999, title: "The CacheFlow IPO", detail: "November 1999: one of the dot-com era's legendary first-day pops - web caching priced as the future, months before the future changed its mind." },
    { year: 2002, title: "The pivot to Blue Coat", detail: "Caching becomes proxying becomes security: the renamed Blue Coat sells the same topological position - inline, between users and the web - as policy enforcement. The ProxySG line defines the enterprise secure web gateway for a decade." },
    { year: 2008, title: "Packeteer joins", detail: "Blue Coat acquires Packeteer (~$268 million), pairing the proxy's content control with PacketShaper's bandwidth control - visibility and enforcement of the WAN in one portfolio.", sourceNote: "Deal figure per the public record." },
    { year: 2011, title: "Private equity years", detail: "Thoma Bravo takes Blue Coat private (~$1.3 billion, 2011); Bain buys it (~$2.4 billion, 2015) - the SSL-inspection franchise compounding quietly outside the public markets." },
    { year: 2016, title: "Symantec", detail: "June 2016: Symantec acquires Blue Coat for ~$4.65 billion and installs Blue Coat's Greg Clark as Symantec's CEO - the proxy company effectively taking over its buyer.", sourceNote: "Deal figure per the public record." },
    { year: 2019, title: "Into Broadcom", detail: "Symantec's enterprise business - ProxySG lineage included - sells to Broadcom (~$10.7 billion). The 1996 caching box's descendants now enforce web policy under their third corporate flag." },
  ],
  products: [
    { name: "ProxySG", what: "The enterprise secure web gateway - authentication, categorization, and SSL inspection at the choke point Blue Coat made standard." },
    { name: "PacketShaper", what: "The application-aware traffic shaper that created its category - per-application visibility and rate control on the WAN." },
    { name: "SSL Visibility appliances", what: "The dedicated decrypt-and-feed line that made 'inspect the encrypted' an architecture rather than a hack." },
  ],
  innovations: [
    { title: "The proxy as a security platform", detail: "Blue Coat proved the inline forward proxy was the natural enforcement point for the web era - the architectural ancestor every SSE and SWG cloud on these pages descends from." },
    { title: "Application-aware bandwidth control", detail: "PacketShaper's classify-then-shape model taught the industry that traffic has identity - the thinking QoS, SD-WAN steering, and app-aware firewalls all inherit." },
  ],
  markets: [
    "The lineage persists inside Broadcom's Symantec enterprise portfolio - and conceptually everywhere: every cloud proxy inspecting TLS at scale is running Blue Coat's play.",
  ],
  analyst: [
    "A consolidated entry because the two companies answered the same question - what happens at the checkpoint - for content and for bandwidth; together they are the prehistory of the SSE category this site's Zscaler and Netskope chapters teach.",
  ],
};
