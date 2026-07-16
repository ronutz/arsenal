// ============================================================================
// src/content/vendors/profiles/arista.ts
// ----------------------------------------------------------------------------
// ARISTA - the cloud-networking company: Bechtolsheim's second act, EOS, and
// the switch vendor of the hyperscale era. Knowledge-based, well-documented
// (2026-07-15): founded 2004 as Arastra in Menlo Park by Andy Bechtolsheim
// (Sun co-founder), David Cheriton (Stanford; the pair also famously wrote
// Google's first outside check), and Ken Duda; renamed Arista 2008, the year
// Jayshree Ullal (ex-Cisco) becomes CEO and the 7100 series ships; IPO NYSE
// June 2014 as ANET; Cisco patent litigation 2014-2018 settled with Arista
// paying $400M; cloud-titan concentration (Microsoft, Meta) is a long-running
// disclosure in its filings; campus expansion from 2017 onward.
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
        "Arista is what happens when Sun Microsystems' co-founder decides Ethernet switching deserves a software company. Andy Bechtolsheim, David Cheriton, and Ken Duda started Arastra in 2004 - Bechtolsheim and Cheriton already legendary as the first outside investors in Google - and built EOS, a network operating system with a proper Linux userland, a state-sharing database at its core, and merchant silicon underneath. When Jayshree Ullal left Cisco to run the company in 2008, the formula was set: hire the customers' engineers' respect, sell to the people building clouds, and let the incumbents defend the past.",
    },
  ],
  timeline: [
    { year: 2004, title: "Arastra founded", detail: "Bechtolsheim, Cheriton, and Duda start building a switch company around software: single-binary EOS on merchant silicon, with SysDB state-sharing making the OS restartable and programmable." },
    { year: 2008, title: "Ullal, and the 7100", detail: "Jayshree Ullal - who ran Cisco's multi-billion switching business - becomes CEO; the renamed Arista ships the 7100 series into low-latency trading networks, its first beachhead market." },
    { year: 2014, title: "IPO, and Cisco attacks", detail: "Arista lists on the NYSE as ANET in June; months later Cisco opens patent and copyright litigation against its former executives' company - the industry's defining grudge match of the decade." },
    { year: 2018, title: "The $400 million settlement", detail: "The Cisco litigation ends with Arista paying $400 million and both sides standing down - expensive, but Arista's cloud momentum survives intact." },
    { year: 2017, title: "Beyond the data center", detail: "Cognitive campus: Arista extends EOS into campus switching and, via the Mojo Networks acquisition (2018), Wi-Fi - taking the cloud playbook to the enterprise edge." },
    { year: 2020, title: "The AI network era opens", detail: "The cloud-titan business - Microsoft and Meta each long disclosed as ten-percent-plus customers - rolls into the AI buildout, with Arista's 7800 spine platforms and EOS at the center of Ethernet-based GPU fabrics." },
  ],
  products: [
    { name: "EOS", what: "The single network operating system across the whole portfolio - Linux-based, state-driven, the product the company is actually built on." },
    { name: "7000 series platforms", what: "Data-center and AI spine and leaf switching on merchant silicon, from ToR to the 7800 chassis." },
    { name: "CloudVision", what: "The management and telemetry plane: network-wide state, automation, and change control as a product." },
  ],
  innovations: [
    { title: "The software-first switch", detail: "EOS's SysDB architecture - all state in a shared database, processes restartable around it - made the network OS programmable and reliable in a way incumbent monoliths were not." },
    { title: "Merchant silicon vindicated", detail: "Arista bet the fastest switching silicon would come from Broadcom and friends, not in-house ASIC empires - the bet that now underpins the Ethernet AI fabric era." },
  ],
  markets: [
    "The switching vendor of the hyperscale and AI era: dominant in cloud data centers alongside its cloud-titan anchor customers, expanding into campus and routing - the modern challenger that became an incumbent, with Cisco, Juniper, and NVIDIA as the competitive frame.",
  ],
  analyst: [
    "A Leader of the data-center networking evaluations since the category's modern form took shape - the reference EOS-and-merchant-silicon model the rest of the market moved toward.",
  ],
};
