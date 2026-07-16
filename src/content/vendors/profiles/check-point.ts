// ============================================================================
// src/content/vendors/profiles/check-point.ts
// ----------------------------------------------------------------------------
// CHECK POINT - the company that turned the firewall into an industry, and a
// Red Education partner vendor. Verified 2026-07-15: Wikipedia/company record
// (founded 1993 Ramat Gan by Gil Shwed, Marius Nacht, Shlomo Kramer; stateful
// inspection conceived by Shwed out of IDF Unit 8200; $250K BRM seed; Sun OEM
// 1994, HP distribution 1995; IDC "Worldwide Firewall Market Leader" Feb 1996
// at 40% share; Nokia security appliance business completed April 2009; Dome9
// $175M 2018; Avanan 2021; Perimeter 81 announced Aug 2023 ~$490M; Cyberint
// ~$186M 2024), Check Point leadership page + press (Nadav Zafrir CEO Dec
// 2024, Shwed to Executive Chairman after 31 years - the longest-tenured
// Nasdaq CEO; Kramer left in 2003 and went on to found Imperva, this
// section's Imperva page). NASDAQ: CHKP since 1996.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const checkPointProfile: VendorProfile = {
  slug: "check-point",
  foundings: [
    {
      company: "Check Point Software Technologies",
      year: 1993,
      place: "Ramat Gan, Israel",
      founders: ["Gil Shwed", "Marius Nacht", "Shlomo Kramer"],
      story:
        "Gil Shwed carried the idea out of Unit 8200, the Israeli signals-intelligence unit where he had connected classified networks: inspect traffic statefully, tracking connections rather than judging lone packets. With Marius Nacht and Shlomo Kramer and $250,000 of seed money from BRM, he built FireWall-1 - and with it, effectively, the commercial firewall market. Sun signed an OEM deal in 1994, HP a distribution deal in 1995, and by February 1996 IDC measured Check Point at forty percent of the world firewall market. Kramer left in 2003 to found Imperva, whose page also lives in this section; Shwed ran the company for thirty-one years, the longest CEO tenure on Nasdaq.",
    },
  ],
  timeline: [
    { year: 1993, title: "Stateful inspection", detail: "Founded in Ramat Gan on Shwed's core idea, patented as Stateful Inspection: a firewall that remembers connection state. FireWall-1 ships the next year, with VPN-1 among the first commercial VPN products close behind." },
    { year: 1996, title: "Market leader, then IPO", detail: "IDC names Check Point the worldwide firewall market leader at a 40 percent share in February; the NASDAQ listing as CHKP follows the same year - Israel's security industry arrives on the world stage." },
    { year: 2009, title: "The Nokia appliances come home", detail: "Check Point completes the acquisition of Nokia's security appliance business - the hardware line that had carried FireWall-1 into countless data centers - and consolidates software and metal under one roof, alongside the Software Blades architecture introduced the same year." },
    { year: 2018, title: "Buying into the cloud era", detail: "Dome9 (~$175 million) brings cloud security posture management, opening an acquisition run that adds Avanan for cloud email security in 2021 - the CloudGuard and Harmony families take shape." },
    { year: 2023, title: "Perimeter 81 and the SASE turn", detail: "The ~$490 million acquisition of Perimeter 81 pulls security service edge into the portfolio for hybrid work, folded into the Infinity platform alongside Quantum (network) and the 2024 Cyberint threat-intelligence purchase (~$186 million)." },
    { year: 2024, title: "The second CEO in thirty-one years", detail: "December 2024: Nadav Zafrir, Team8 co-founder and former commander of Unit 8200, becomes only the second CEO in company history; Gil Shwed moves to Executive Chairman - the firewall's inventor handing over the company it built.", sourceNote: "Check Point leadership page; announced July 24, 2024." },
  ],
  products: [
    { name: "Quantum", what: "The firewall lineage today: gateways from branch to hyperscale, the direct descendants of FireWall-1." },
    { name: "CloudGuard", what: "Cloud network security and posture management - the Dome9 heritage grown into the cloud family." },
    { name: "Harmony", what: "Workspace security: endpoint, email (the Avanan lineage), mobile, and SASE (the Perimeter 81 lineage)." },
    { name: "Infinity Platform", what: "The unifying architecture and threat-intelligence brain (ThreatCloud AI) across all three families." },
  ],
  innovations: [
    { title: "Stateful inspection", detail: "The patent that defined how firewalls work - connection-state tracking as the baseline every packet filter since has been measured against." },
    { title: "The security software company", detail: "Check Point proved a pure software vendor could own a network security category, and its profitability discipline became an industry reference point." },
  ],
  markets: [
    "Check Point protects over 100,000 organizations and competes across network, cloud, and workspace security against Palo Alto Networks, Fortinet, and Cisco - the elder statesman of the firewall market it created, now selling the AI-driven Infinity platform.",
  ],
  analyst: [
    "A fixture of the network-firewall analyst evaluations for three decades, from IDC's 40 percent share measurement in 1996 through the modern Magic Quadrant era.",
  ],
};
