// ============================================================================
// THE SNIFFER LINEAGE - Network General, Dolch, Network Associates, Arbor ->
// NetScout. Knowledge-based, dates well-documented (2026-07-16): Network
// General founded 1986 (Harry Saal, Len Shustek); the Sniffer makes protocol
// analysis a product and a profession (Sniffer University). Volker Dolch's
// rugged luggables (Dolch Logic Instruments 1976 -> Dolch Computer Systems)
// become the classic field chassis for Sniffer portables. Dec 1997: merger
// with McAfee Associates -> Network Associates (~$1.3B). 2004: NAI (renaming
// to McAfee) divests Sniffer to Silver Lake/TPG (~$275M) - Network General
// reborn. 2007: NetScout (founded 1984 as Frontier Software by Anil Singhal
// and Narendra Popat) acquires Network General (~$205M). Arbor Networks
// (founded 2000, Jahanian/Malan, U. Michigan; Peakflow, ATLAS) reaches
// NetScout via the 2015 Danaher communications acquisition (~$2.3B, with
// Tektronix Communications). One bloodline: the analyzer's whole history.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const snifferLineageProfile: VendorProfile = {
  slug: "sniffer-lineage",
  foundings: [
    {
      company: "Network General",
      year: 1986,
      place: "Mountain View, California",
      founders: ["Harry Saal", "Len Shustek"],
      story:
        "Harry Saal and Len Shustek productized something engineers had been improvising with oscilloscopes and hex dumps: a machine that captured network traffic and DECODED it, protocol by protocol, into English. The Sniffer named an entire activity - to this day engineers 'sniff' traffic regardless of whose analyzer they hold - and Sniffer University trained the first generation of people who could read a network's actual conversation. Everything this site teaches about capture points descends from the profession Network General created.",
    },
    {
      company: "NetScout Systems",
      year: 1984,
      place: "Westford, Massachusetts",
      founders: ["Anil Singhal", "Narendra Popat"],
      story:
        "Founded as Frontier Software Development two years before the Sniffer existed, NetScout took the other road: not the portable analyzer in a field bag but permanent, distributed visibility - probes and the nGenius platform watching production networks continuously. Two decades later the roads merged: NetScout became the house where the whole packet-analysis bloodline - the Sniffer itself, and later Arbor's DDoS telemetry - came home.",
    },
  ],
  timeline: [
    { year: 1986, title: "The Sniffer ships", detail: "Protocol analysis becomes a product: capture, decode, display. The generic verb the industry still uses is this machine's trademark ghost." },
    { year: 1988, title: "The Dolch chassis", detail: "Volker Dolch's rugged luggables - born of his 1976 logic-analyzer company - become the classic Sniffer portable: a field-grade PC with a handle, the ancestor of every hardened laptop in every field engineer's trunk." },
    { year: 1997, title: "Network Associates", detail: "December 1997: Network General merges with McAfee Associates (~$1.3 billion) forming NAI - the Sniffer sharing a roof with antivirus, PGP, and the Gauntlet firewall in one of the era's grand security roll-ups.", sourceNote: "Deal figures per the public record." },
    { year: 2004, title: "Reborn to be acquired", detail: "NAI refocuses as McAfee and divests Sniffer Technologies to Silver Lake and TPG (~$275 million); the buyers revive the Network General name - a three-year second life for the original brand." },
    { year: 2007, title: "Home to NetScout", detail: "NetScout acquires Network General (~$205 million): the portable-analyzer tradition and the continuous-monitoring tradition finally merge into one visibility house." },
    { year: 2015, title: "Arbor joins", detail: "NetScout acquires Danaher's communications businesses (~$2.3 billion in stock) - Tektronix Communications and Arbor Networks, whose Peakflow and ATLAS defined DDoS detection and internet-scale threat telemetry since 2000. The bloodline now spans from a single captured frame to planetary attack weather.", sourceNote: "Deal structure per the public record." },
  ],
  products: [
    { name: "The Sniffer", what: "The original protocol analyzer - capture and human-readable decode, the product that named the practice." },
    { name: "nGenius platform", what: "NetScout's continuous, distributed visibility line - the analyzer grown into infrastructure." },
    { name: "Arbor Peakflow / ATLAS", what: "Flow-based DDoS detection and the global attack-telemetry network - packet analysis at internet scale." },
  ],
  innovations: [
    { title: "The decode", detail: "Turning frames into labeled, explained conversations created a profession; every Wireshark column header is the Sniffer's grandchild." },
    { title: "Visibility as a permanent layer", detail: "The lineage's arc - from a luggable you carry to the problem, to probes that never leave - is the history of network operations growing up." },
  ],
  markets: [
    "NetScout today spans service assurance and DDoS defense (Arbor) across carriers and enterprises - the consolidated home of the analyzer tradition.",
  ],
  analyst: [
    "One entry for five companies, deliberately: the Sniffer, its Dolch chassis, the NAI detour, Arbor's telemetry, and NetScout's roof are a single story - the biography of the capture point.",
  ],
};
