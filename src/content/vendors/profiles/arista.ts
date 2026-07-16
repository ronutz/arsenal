// ============================================================================
// src/content/vendors/profiles/arista.ts
// ----------------------------------------------------------------------------
// ARISTA - the cloud-networking company: Bechtolsheim's second act, EOS, and
// the switch vendor of the hyperscale and AI era. Knowledge-based, dates
// well-documented (enriched 2026-07-17 per PRIME, merging the held
// contemporary-history draft into the Red Education partner profile):
// founded 2004 as Arastra in Menlo Park by Andy Bechtolsheim (Sun co-founder;
// had sold Granite Systems to Cisco in 1996), David Cheriton (Stanford; the
// pair wrote Google's first outside check), and Ken Duda; renamed Arista
// 2008, the year Jayshree Ullal (ex-Cisco) becomes CEO and the 7100 ships
// into low-latency trading; IPO NYSE June 2014 as ANET; Cisco patent and
// copyright litigation 2014-2018 (ITC actions, workarounds shipped in
// software) settled August 2018 with Arista paying $400M; cloud-titan
// concentration (Microsoft, Meta) a long-running disclosure in its filings;
// Mojo Networks 2018; campus expansion from 2017; 800G Ethernet-for-AI era.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const aristaProfile: VendorProfile = {
  slug: "arista",
  foundings: [
    {
      company: "Arista Networks (founded as Arastra)",
      year: 2004,
      place: "Menlo Park, California",
      founders: ["Andy Bechtolsheim", "David Cheriton", "Ken Duda"],
      story:
        "Arista is what happens when Sun Microsystems' co-founder decides Ethernet switching deserves a software company. Andy Bechtolsheim and David Cheriton had already sold Granite Systems to Cisco in 1996 - and, along the way, written Google's first outside check - so when they founded Arastra with Ken Duda in 2004, they were attacking their own acquirer's core business, on purpose. The thesis: run one clean OS image - EOS, ordinary Linux underneath, every process reading shared state from SysDB - on merchant silicon, and let the people building clouds script the network like the servers beside it. When Jayshree Ullal left Cisco to run the company in 2008, the formula was set: hire the customers' engineers' respect, sell to the cloud builders, and let the incumbents defend the past.",
    },
  ],
  timeline: [
    { year: 2004, title: "Arastra founded", detail: "Bechtolsheim, Cheriton, and Duda start building a switch company around software: single-binary EOS on merchant silicon, with SysDB state-sharing making the OS restartable and programmable - a network OS engineered like modern software because it is one." },
    { year: 2008, title: "Ullal, and the 7100", detail: "Jayshree Ullal - who ran Cisco's multi-billion-dollar switching business - becomes CEO; the renamed Arista ships the 7100 series into low-latency trading networks. The customers who measure nanoseconds validate the merchant-silicon thesis before the cloud giants scale it." },
    { year: 2014, title: "IPO, and Cisco attacks", detail: "Arista lists on the NYSE as ANET in June; months later Cisco opens patent and copyright litigation against its former executives' company - four years of ITC actions met with workarounds shipped in software, the EOS architecture proving its agility in court, effectively.", sourceNote: "Litigation and settlement per the public record." },
    { year: 2016, title: "The cloud titans", detail: "Microsoft and Meta anchor the business - each long disclosed as ten-percent-plus customers in Arista's filings - as hyperscale fabrics standardize on the 7050/7280/7500 lines: leaf-spine at planetary scale, managed like software because it is software." },
    { year: 2017, title: "Beyond the data center", detail: "Cognitive campus: Arista extends EOS into campus switching and, via the Mojo Networks acquisition (2018), Wi-Fi - taking the cloud playbook to the enterprise edge. CloudVision matures into the fleet-wide management plane along the way." },
    { year: 2018, title: "The $400 million settlement", detail: "The Cisco litigation ends in August with Arista paying $400 million and both sides standing down - expensive, but the cloud momentum survives intact, and the industry's defining grudge match of the decade closes.", sourceNote: "Settlement figure per the August 2018 public record." },
    { year: 2024, title: "The AI fabric contender", detail: "800G platforms, the 7800 spine, and the Ethernet-for-AI argument - scheduled fabrics, congestion control, the Ultra Ethernet direction - position Arista as the merchant-silicon champion against InfiniBand in the era's defining network fight." },
  ],
  products: [
    { name: "EOS", what: "The single network operating system across the whole portfolio - Linux-based, SysDB-centered, restartable by design: the software thesis itself, and the product the company is actually built on." },
    { name: "7000-series platforms", what: "The leaf-spine fabrics of the hyperscale cloud (7050/7280/7500) up to the 7800 AI spine - data-center and AI switching on merchant silicon, ToR to chassis." },
    { name: "CloudVision", what: "The state-streaming management and telemetry plane: network-wide state, automation, and change control - the fleet operated as one system." },
  ],
  innovations: [
    { title: "The software-first switch", detail: "EOS's SysDB architecture - all state in a shared database, processes restartable around it - proved a network OS could be engineered like modern software, and that operators would pay for that difference at scale." },
    { title: "Merchant silicon vindicated", detail: "Arista bet the fastest switching silicon would come from Broadcom and friends, not in-house ASIC empires - the bet that settled the custom-versus-merchant argument for an era and now underpins the Ethernet AI fabric push." },
  ],
  markets: [
    "The switching vendor of the hyperscale and AI era: dominant in cloud data centers alongside its cloud-titan anchor customers, expanding into campus and routing - the modern challenger that became an incumbent, with Cisco, Juniper, and NVIDIA as the competitive frame.",
  ],
  analyst: [
    "A Leader of the data-center networking evaluations since the category's modern form took shape - the reference EOS-and-merchant-silicon model the rest of the market moved toward.",
    "The contemporary every fabric discussion on this site eventually touches: leaf-spine, EVPN/VXLAN, and the Ethernet-for-AI case are all arguments Arista either made or mainstreamed.",
  ],
};
