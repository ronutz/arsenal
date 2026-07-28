// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/lineages/check-point.ts
// ----------------------------------------------------------------------------
// CHECK POINT SOFTWARE TECHNOLOGIES corporate lineage.
//
// The shape of this story is the opposite of Extreme's. Extreme bought its
// whole portfolio. Check Point built the thing it is famous for - FireWall-1,
// on the stateful inspection patent - and then bought its way into every
// adjacent market that opened afterwards: endpoint, disk encryption, its own
// appliance hardware, cloud posture, email, zero-trust access, SASE, threat
// intelligence, and most recently AI security.
//
// For anyone studying CCSA and CCSE, this list explains the product naming.
// Quantum is the part Check Point wrote. CloudGuard, Harmony and most of
// Infinity are the parts it acquired, which is why they feel like distinct
// products sharing a management story rather than one system.
//
// PRICE DISCREPANCIES ARE FLAGGED, NOT RESOLVED. Several of these deals were
// reported at different figures by different outlets, and Check Point did not
// disclose terms for many of them. Where sources disagree the page says so and
// gives both, because picking the flattering number silently is how a
// "verified" page stops being one.
// ============================================================================

import type { VendorLineage } from "./f5";

export const checkPointLineage: VendorLineage = {
  key: "checkpoint",
  name: "Check Point Software Technologies Ltd.",
  tagline:
    "Built the firewall it is famous for, then bought its way into every market that opened after it - endpoint, cloud, email, access, and AI security.",

  founded: {
    year: 1993,
    dateText: "1993",
    place: "Ramat Gan, Israel",
    asName: "Check Point Software Technologies",
    founder: "Gil Shwed, with Marius Nacht and Shlomo Kramer",
  },

  names: [
    {
      name: "Check Point Software Technologies Ltd.",
      from: "1993",
      note: "The name has never changed. Unusually for this industry, the company that shipped the first product still trades under the same name thirty years later.",
    },
    {
      name: "Check Point, as a source of other companies",
      from: "1999",
      note: "Worth recording alongside what Check Point bought: what left. Nir Zuk, one of its first employees, departed in 1999 and founded OneSecure, which NetScreen bought in 2002 and which became NetScreen's intrusion-prevention core. He stayed through Juniper's acquisition of NetScreen and left in 2005 to found Palo Alto Networks - the competitor that overtook Check Point as the largest security company in 2014. The stateful-inspection lineage runs through people as much as through products.",
    },
  ],

  origin:
    "FireWall-1, shipped in 1994 on Gil Shwed's stateful inspection patent: a firewall that remembers connection state rather than judging each packet alone. VPN-1 followed as one of the first commercial VPN products. By February 1996 IDC put Check Point at roughly 40% of the worldwide firewall market, and the NASDAQ listing followed the same year.",

  acquisitions: [
    {
      year: 2004,
      name: "Zone Labs",
      price: "$205M ($113M cash + $92M in shares)",
      what: "The maker of ZoneAlarm, the personal firewall. It gave Check Point an endpoint product and, for the first time, a consumer business and consumer brand recognition.",
      became:
        "The start of the endpoint line that eventually became Harmony Endpoint. Zone Labs was run as a separate division and kept its brand for years.",
      founder: "Gregor Freund",
      sourceNote:
        "Announced December 2003, expected to close Q1 2004.",
    },
    {
      year: 2007,
      name: "Protect Data / Pointsec",
      price: "$550M (reported; also reported as $586M for the Protect Data parent)",
      what: "Swedish full-disk-encryption business. Pointsec was the product; Protect Data AB was the listed parent Check Point actually bought.",
      became:
        "Full disk and media encryption in the endpoint suite. For years this was the largest acquisition in Check Point's history.",
      sourceNote:
        "Sources differ on both the figure and the year - $550M in 2007 and $586M in 2006 both appear, the latter dating the announcement of the Protect Data offer rather than its completion. Both describe the same transaction.",
    },
    {
      year: 2009,
      name: "Nokia's security appliance business",
      price: "undisclosed in the sources checked",
      what: "The appliance line that had carried FireWall-1 into data centres for a decade. Before this, Check Point sold software and Nokia sold the box it ran on.",
      became:
        "Check Point's own appliance hardware. This is the deal that made it a full platform vendor rather than a software company dependent on someone else's metal.",
    },
    {
      year: 2018,
      name: "Dome9 Security",
      price: "~$175M (also reported as $179M)",
      what: "Cloud security posture management - visibility and compliance across public cloud accounts.",
      became:
        "CloudGuard. This opened the acquisition run that built out the whole non-network portfolio.",
      sourceNote: "October 2018. Reported figures differ slightly between sources.",
    },
    {
      year: 2020,
      name: "Odo Security",
      price: "$30M",
      what: "Clientless zero-trust network access - remote access to internal applications without a VPN client.",
      became: "The ZTNA capability inside Harmony Connect.",
      sourceNote: "September 2020.",
    },
    {
      year: 2021,
      name: "Avanan",
      price: "$280M (also reported at around $300M)",
      what: "API-based cloud email security, scanning Microsoft 365 and similar platforms after delivery rather than as a gateway in front of them.",
      became:
        "Harmony Email and Collaboration. The API-rather-than-gateway approach is the architectural point: it inspects mail the platform has already filtered, and can remove a message that has already landed.",
      sourceNote: "August/September 2021. Reported figures differ between sources.",
    },
    {
      year: 2022,
      name: "Spectral Cyber Technologies",
      price: "$60M",
      what: "Developer-first scanning for secrets and misconfiguration in source code and build pipelines.",
      became: "The shift-left half of the CloudGuard story - catching a leaked credential before it ships rather than after.",
      sourceNote: "February 2022.",
    },
    {
      year: 2023,
      name: "Perimeter 81",
      price: "~$490M, cash-free and debt-free",
      what: "A security service edge company with over 200 staff and more than 3,000 customers, offering zero-trust access and full-mesh connectivity.",
      became:
        "Harmony SASE, and Check Point's answer in the SASE market. At the time this was the second-largest acquisition in company history.",
      sourceNote:
        "Announced August 2023, completed in the third quarter. Perimeter 81 had been valued at roughly $1B a year earlier, so the price represented a substantial discount.",
      subAcquisitions: [
        {
          year: 2019,
          name: "SaferVPN (by Perimeter 81)",
          what: "Perimeter 81 had itself acquired a consumer VPN business, which gave it the network footprint its zero-trust access product was built on.",
        },
      ],
    },
    {
      year: 2023,
      name: "Atmosec",
      price: "undisclosed",
      what: "An early-stage SaaS security business, securing the connections between SaaS applications.",
      became: "Part of the SaaS security strand of Infinity.",
      sourceNote: "September 2023. Terms not disclosed.",
    },
    {
      year: 2024,
      name: "Cyberint Technologies",
      price: "~$200M (reported; terms not disclosed)",
      what: "External risk management: threat intelligence and attack surface management from outside the perimeter.",
      became:
        "The external risk management layer of Infinity, feeding the SOC offering - the view of what an attacker sees before they touch anything.",
      sourceNote:
        "Announced August 2024, expected to close by the end of that year. Check Point did not disclose terms; the figure comes from Israeli press reporting.",
    },
    {
      year: 2025,
      name: "Veriti",
      price: "undisclosed",
      what: "Threat exposure management with automated remediation across a mixed security estate.",
      became: "Threat exposure management within Infinity.",
      sourceNote: "Listed on Check Point's own history page. Terms not published there.",
    },
    {
      year: 2025,
      name: "Lakera",
      price: "undisclosed",
      what: "AI-native security - protecting AI applications and the models behind them.",
      became: "Check Point's AI security line, the newest category on the list.",
      sourceNote: "Listed on Check Point's own history page. Terms not published there.",
    },
  ],

  asOf: "July 2026",

  sources: [
    {
      label: "Check Point's own company history page",
      url: "https://www.checkpoint.com/about-us/check-point-history/",
    },
    {
      label: "The Register: Zone Labs, $205M split cash and shares (2003)",
      url: "https://www.theregister.com/2003/12/17/check_point_strengthens_perimeter/",
    },
    {
      label: "CTech: Perimeter 81 at $490M, and the Pointsec comparison",
      url: "https://www.calcalistech.com/ctechnews/article/sj02hwf22",
    },
    {
      label: "CyberScoop: Cyberint, reported at about $200M",
      url: "https://cyberscoop.com/check-point-cyberint-acquisition/",
    },
    {
      label: "Startup Nation Finder: dated acquisition list with reported figures",
      url: "https://finder.startupnationcentral.org/company_page/check-point-software-technologies?section=financials",
    },
  ],
};
