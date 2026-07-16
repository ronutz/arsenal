// ============================================================================
// ERICSSON - 150 years of telephony. Knowledge-based, dates well-documented
// (2026-07-16): founded 1876 by Lars Magnus Ericsson as a telegraph-repair
// workshop in Stockholm; AXE digital switch (1970s) wires the world; NMT
// (1981) then GSM leadership; Bluetooth invented at Ericsson (Jaap Haartsen,
// mid-1990s; SIG 1998); Sony Ericsson handset JV 2001-2011 (Sony buyout
// 2012); Vonage acquired 2022 (~$6.2B); Börje Ekholm President & CEO since
// January 2017 (through the knowledge cutoff). Today one of the 5G
// triumvirate with Nokia and Huawei; enterprise wireless via Cradlepoint.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const ericssonProfile: VendorProfile = {
  slug: "ericsson",
  foundings: [
    {
      company: "Ericsson",
      year: 1876,
      place: "Stockholm, Sweden",
      founders: ["Lars Magnus Ericsson"],
      story:
        "Lars Magnus Ericsson opened a telegraph-repair workshop in Stockholm in 1876 - the same year Bell patented the telephone - and was soon building better telephones than the ones he repaired. A century and a half later the company he founded has had a hand in nearly every generation of the world's telephone network: the AXE switches that digitalized it, the Nordic mobile standard that made it wireless, the GSM work that made wireless global, and the 5G networks that make it invisible. Few companies have been essential infrastructure for this long.",
    },
  ],
  timeline: [
    { year: 1876, title: "The workshop", detail: "Ericsson starts repairing telegraph instruments and, within a few years, manufacturing telephones - exporting them across Europe, Russia, and beyond while the technology is still a novelty." },
    { year: 1977, title: "AXE", detail: "The AXE digital switching system, developed with Televerket in the Ellemtel venture, becomes one of the most successful telephone exchanges ever - the workhorse that digitalized networks on every continent." },
    { year: 1981, title: "NMT: mobile begins", detail: "The Nordic Mobile Telephone network - the world's first automatic international cellular system - launches on Ericsson switching; the Nordic head start becomes GSM leadership a decade later." },
    { year: 1998, title: "Bluetooth leaves the lab", detail: "Jaap Haartsen's mid-1990s short-range radio work at Ericsson, named for a Viking king, becomes an industry SIG - and eventually ships in more devices per year than there are people." },
    { year: 2001, title: "Sony Ericsson", detail: "The handset joint venture carries Ericsson through the consumer decade; Sony buys it out in 2012, and Ericsson commits fully to the network itself." },
    { year: 2022, title: "The enterprise turn", detail: "The ~$6.2 billion Vonage acquisition adds communications APIs, joining Cradlepoint's enterprise 5G - Ericsson betting that the network's future customers program it rather than call it. Börje Ekholm has led the company since 2017.", sourceNote: "Leadership current through the knowledge cutoff." },
  ],
  products: [
    { name: "Radio System and RAN", what: "The 5G radio portfolio: with Nokia and Huawei, one of three complete answers to building a national mobile network." },
    { name: "Core and OSS/BSS", what: "The packet core and the operator software estate - the invisible half of every subscription." },
    { name: "Vonage and enterprise wireless", what: "CPaaS APIs and Cradlepoint 5G WAN: the network as a programmable enterprise product." },
  ],
  innovations: [
    { title: "Bluetooth", detail: "Invented at Ericsson and given to an industry group - the short-range radio that quietly became the most ubiquitous wireless technology ever shipped." },
    { title: "Switching the world, twice", detail: "AXE digitalized the wired network; Ericsson's GSM and 5G work did it again without wires - infrastructure leadership sustained across every generation." },
  ],
  markets: [
    "Ericsson sells mobile networks, cores, and enterprise communications worldwide - the Swedish member of the 5G triumvirate, with North America its largest market and the programmable-network bet defining its current chapter.",
  ],
  analyst: [
    "A permanent leader of the mobile-infrastructure evaluations across every G - the vendor whose century-old switching heritage still anchors the category's benchmarks.",
  ],
};
