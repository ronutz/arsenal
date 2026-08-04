// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/lineages/fortinet.ts
// ----------------------------------------------------------------------------
// FORTINET corporate lineage.
//
// Fortinet's shape sits between Extreme's and Check Point's. It built its own
// core - FortiGate, FortiOS and the ASIC that made them fast - and then bought
// almost every adjacent product in the Security Fabric. Which is why the
// naming is so uniform and the products underneath are not: FortiSIEM,
// FortiNAC, FortiEDR, FortiSOAR and FortiMonitor were AccelOps, Bradford,
// enSilo, CyberSponse and Panopta before they were Forti-anything.
//
// That matters for anyone studying the NSE track. When two Forti- products
// feel like different software with a shared prefix, it is because they are.
//
// ONE PIECE OF PREHISTORY BELONGS HERE: Ken Xie founded NetScreen before
// Fortinet, and NetScreen was bought by Juniper in 2004. So the firewall
// lineage on this site runs through him twice, from two different companies,
// which is why the NetScreen/Juniper chapter and this one are the same story
// told from opposite ends.
//
// PRICES: most of these were undisclosed and the file says so. Where only an
// analyst estimate exists it is attributed as an estimate, not stated as fact.
// ============================================================================

import type { VendorLineage } from "./f5";

export const fortinetLineage: VendorLineage = {
  key: "fortinet",
  name: "Fortinet, Inc.",
  tagline:
    "Built its own firewall and the silicon to make it fast, then bought the rest of the Security Fabric one adjacent product at a time.",

  founded: {
    year: 2000,
    dateText: "2000",
    place: "Sunnyvale, California",
    asName: "Fortinet",
    founder: "Ken Xie and Michael Xie",
  },

  names: [
    {
      name: "Fortinet",
      from: "2000",
      note: "The name has not changed. Ken Xie had already founded two security companies before this one: Systems Integration Solutions in 1993, and NetScreen in 1996 with Yan Ke and Feng Deng, all three Tsinghua alumni. He built the first ASIC-based firewall and VPN appliance in 1996, in a garage in Palo Alto - which is the same bet Fortinet was later built on.",
    },
  ],

  origin:
    "FortiGate, and the decision to put the inspection work in custom silicon rather than general-purpose CPUs. The FortiASIC is the reason a small appliance could do content inspection at line rate when competitors needed a much larger box, and it is the architectural bet the whole company was built on. FortiOS grew around it as the single operating system the rest of the portfolio would eventually be measured against.",

  acquisitions: [
    {
      year: 1996,
      name: "NetScreen Technologies is founded (prehistory, not an acquisition)",
      price: "n/a",
      what: "Four years before Fortinet, Ken Xie founded NetScreen with Yan Ke and Feng Deng. He built the first ASIC-based firewall and VPN appliance that year, and the company was later acquired by Juniper Networks for $4B in stock. Ken Xie left in 2000, taking the silicon idea with him.",
      became:
        "Fortinet - founded that same year with his brother Michael Xie, on the same architectural bet. The FortiASIC is not a Fortinet original idea so much as a second attempt at one that had already worked.",
      founder: "Yan Ke, Ken Xie and Feng Deng",
      sourceNote:
        "Included as prehistory rather than an acquisition, and labelled as such. NetScreen is a separate company that Fortinet never bought - the connection is a person.",
      subAcquisitions: [
        {
          year: 2002,
          name: "OneSecure (by NetScreen)",
          price: "$40-45M in stock",
          what: "The first intrusion prevention system, sitting behind the firewall to check that permitted packets were not malicious. It became NetScreen's core IPS technology.",
          founder: "Nir Zuk and Rakesh Loonkar - Zuk had been one of Check Point's first employees",
        },
        {
          year: 2004,
          name: "NetScreen (by Juniper Networks)",
          price: "$4B in stock",
          what: "Juniper bought the company. Nir Zuk stayed, left in 2005, and founded Palo Alto Networks; Yan Ke and Feng Deng also left in 2005 and started Northern Light Venture Capital.",
        },
      ],
    },
    {
      year: 2013,
      name: "Coyote Point Systems",
      price: "undisclosed",
      what: "Application delivery controllers and server load balancing.",
      became: "FortiADC, and the beginning of a portfolio that reached beyond the firewall.",
    },
    {
      year: 2015,
      name: "Meru Networks",
      price: "$44M",
      what: "A publicly traded enterprise Wi-Fi company with a distinctive single-channel architecture.",
      became:
        "The enterprise wireless line that became FortiWLC alongside the existing FortiAP. Reported as Fortinet's largest acquisition by disclosed price.",
      sourceNote: "Closed 8 July 2015.",
      subAcquisitions: [
        {
          year: 2002,
          name: "Meru Networks is founded",
          what: "A single-channel wireless architecture that treated the whole WLAN as one radio cell - a genuinely different approach to the industry standard, and the reason Meru had its own following.",
        },
      ],
    },
    {
      year: 2016,
      name: "AccelOps",
      price: "$28M",
      what: "Security information and event management, plus IT monitoring and analytics.",
      became: "FortiSIEM. The product a great many NSE candidates meet as if it were built in-house.",
    },
    {
      year: 2018,
      name: "Bradford Networks",
      price: "undisclosed",
      what: "Network access control and IoT device visibility.",
      became: "FortiNAC.",
    },
    {
      year: 2018,
      name: "ZoneFox",
      price: "undisclosed",
      what: "Insider-threat analytics from Edinburgh, watching user activity for data exfiltration.",
      became: "Behavioural analytics inside the fabric.",
    },
    {
      year: 2019,
      name: "enSilo",
      price: "undisclosed",
      what: "Endpoint detection and response, with automated post-breach containment.",
      became: "FortiEDR, and later the basis of the extended detection story.",
    },
    {
      year: 2019,
      name: "CyberSponse",
      price: "undisclosed",
      what: "Security orchestration, automation and response - playbooks for the SOC.",
      became: "FortiSOAR.",
    },
    {
      year: 2020,
      name: "OPAQ Networks",
      price: "undisclosed",
      what: "A cloud-delivered zero-trust network access and SASE platform.",
      became: "The cloud half of the SASE offering, well before SASE was a checkbox on every RFP.",
    },
    {
      year: 2020,
      name: "Panopta",
      price: "undisclosed",
      what: "SaaS infrastructure monitoring and automated remediation across servers, containers, applications and cloud.",
      became: "FortiMonitor.",
      sourceNote: "Announced 9 December 2020.",
    },
    {
      year: 2021,
      name: "ShieldX Networks",
      price: "undisclosed",
      what: "Cloud-native micro-segmentation and east-west inspection.",
      became: "Cloud workload protection within the fabric.",
    },
    {
      year: 2021,
      name: "Sken.ai",
      price: "undisclosed",
      what: "Continuous application security testing in the development pipeline.",
      became: "The shift-left strand of the application security story.",
    },
    {
      year: 2024,
      name: "Lacework",
      price: "undisclosed (analyst estimate $200-230M)",
      what: "Cloud-native application protection - workload security and cloud posture.",
      became:
        "The cloud security portfolio. Worth stating plainly: Lacework had raised more than $1.3B in venture capital, so at the estimated price its investors are unlikely to have seen a return. Forrester characterised it as a fire sale.",
      sourceNote:
        "Terms were not disclosed. The $200-230M figure is Forrester's estimate and is presented as an estimate rather than a reported price.",
    },
    {
      year: 2024,
      name: "Next DLP",
      price: "undisclosed",
      what: "Cloud-based data loss prevention.",
      became: "The DLP capability across the fabric.",
    },
    {
      year: 2024,
      name: "Perception Point",
      price: "~$100M (reported)",
      what: "Email and collaboration security - the channel most attacks still arrive through.",
      became: "Email and workspace protection.",
    },
    {
      year: 2025,
      name: "Everest Networks and the remaining Linksys stake",
      price: "undisclosed",
      what: "High-density venue Wi-Fi from Everest, and full ownership of Linksys after holding a partial stake.",
      became:
        "Wireless for stadiums and large venues, plus a consumer and small-business brand - a return to the wireless market Meru opened a decade earlier.",
    },
  ],

  asOf: "July 2026",

  sources: [
    {
      label: "Fortinet investor relations: Meru Networks acquisition closed",
      url: "https://investor.fortinet.com/news-releases/news-release-details/fortinet-closes-acquisition-meru-networks",
    },
    {
      label: "Fortinet newsroom: Panopta acquisition",
      url: "https://www.fortinet.com/corporate/about-us/newsroom/press-releases/2020/fortinet-acquires-network-monitoring-and-remediation-innovator-panopta",
    },
    {
      label: "Forrester: Fortinet acquires Lacework, with the price estimate and its context",
      url: "https://www.forrester.com/blogs/fortinet-acquires-lacework",
    },
    {
      label: "Mergr: Fortinet acquisition summary and the Meru figure",
      url: "https://mergr.com/fortinet-acquisitions",
    },
  ],
};
