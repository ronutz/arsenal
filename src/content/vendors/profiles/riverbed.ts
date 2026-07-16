// ============================================================================
// src/content/vendors/profiles/riverbed.ts
// ----------------------------------------------------------------------------
// RIVERBED - WAN optimization's defining company, co-founded by the author of
// BPF and tcpdump's library. Verified/knowledge 2026-07-15: company record
// (founded 2002 San Francisco by Jerry Kennelly and Steve McCanne; Steelhead
// ships 2004; IPO Nasdaq 2006 as RVBD; OPNET ~$1B announced 2012; taken
// private by Thoma Bravo ~$3.6B completed 2015; Chapter 11 debt restructure
// completed late 2021 under Apollo ownership; acquired by Vector Capital,
// announced/completed 2023; today Riverbed = acceleration + Aternity-lineage
// observability). McCanne co-authored the BSD Packet Filter (BPF) and
// libpcap at LBNL - the capture stack behind this site's tcpdump tooling.
// Recent-ownership details are press-documented; kept qualitative.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const riverbedProfile: VendorProfile = {
  slug: "riverbed",
  foundings: [
    {
      company: "Riverbed Technology",
      year: 2002,
      place: "San Francisco, California",
      founders: ["Jerry Kennelly", "Steve McCanne"],
      story:
        "Steve McCanne had already left a permanent mark on networking before Riverbed existed: at Lawrence Berkeley National Laboratory he co-authored the BSD Packet Filter and the libpcap capture library - the machinery under tcpdump and, decades later, under this site's own capture tooling. With Jerry Kennelly he founded Riverbed in 2002 on a sharper commercial problem: the WAN was slow and expensive, and branch offices suffered for it. The Steelhead appliance answered with deduplication, compression, and protocol acceleration on both ends of the link, and 'WAN optimization' became a market with Riverbed's name on top of it.",
    },
  ],
  timeline: [
    { year: 2002, title: "Founded on a slow WAN", detail: "Kennelly and McCanne start Riverbed to make wide-area links feel local - data reduction and TCP and application-protocol acceleration in a symmetric appliance pair." },
    { year: 2004, title: "Steelhead ships", detail: "The flagship arrives and defines the category: branch and data-center Steelheads deduplicating and accelerating traffic between them, often turning WAN upgrades into deferred line items." },
    { year: 2006, title: "IPO: RVBD", detail: "Riverbed lists on Nasdaq as the clear WAN optimization leader, the position it holds through the category's golden decade." },
    { year: 2012, title: "OPNET and the visibility turn", detail: "The roughly $1 billion OPNET acquisition moves Riverbed into application and network performance management - the bet that when the WAN is fast, the next question is why the app is still slow." },
    { year: 2015, title: "Thoma Bravo takes it private", detail: "An approximately $3.6 billion buyout ends the public chapter as SD-WAN begins eroding the classic optimization market Steelhead defined." },
    { year: 2021, title: "Restructuring, then a new owner", detail: "A pre-packaged Chapter 11 restructures the debt as the category shrinks; in 2023 Vector Capital acquires the company, refocusing it on acceleration plus the Aternity-lineage observability portfolio - Riverbed's second act as a unified-observability vendor.", sourceNote: "Ownership arc per press coverage of the 2021 restructuring and 2023 Vector acquisition." },
  ],
  products: [
    { name: "SteelHead", what: "The WAN optimization flagship: deduplication, compression, and protocol acceleration - the appliance that named the category." },
    { name: "Riverbed IQ and Aternity", what: "The observability side: unified network and digital-experience monitoring, the OPNET and Aternity lineages carried forward." },
    { name: "AppResponse and NetProfiler", what: "Packet-level and flow-level network performance analysis - full-fidelity capture meeting NetFlow-scale visibility." },
  ],
  innovations: [
    { title: "WAN optimization as a category", detail: "Steelhead's symmetric dedupe-and-accelerate model made application performance a network product - and made Riverbed, for a decade, one of networking's great growth stories." },
    { title: "The capture heritage", detail: "Through McCanne, Riverbed's DNA includes BPF and libpcap themselves; the company later stewarded Wireshark's commercial backing for years - packet analysis royalty." },
  ],
  markets: [
    "Riverbed today sells acceleration and unified observability to large enterprises - a focused second act after the SD-WAN era absorbed classic WAN optimization, competing in the performance-monitoring market rather than defining a category of its own.",
  ],
  analyst: [
    "The perennial leader of the WAN optimization evaluations for as long as analysts drew them - a category so identified with one vendor that its consolidation and Riverbed's reinvention arrived together.",
  ],
};
