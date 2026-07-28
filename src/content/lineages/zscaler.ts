// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// ZSCALER corporate lineage.
//
// A young company by the standards of this list, and its acquisitions read
// like a map of what "zero trust" came to mean year by year: cloud posture,
// then deception, then entitlements, then SaaS supply chain, then AI-driven
// risk analytics, then segmentation. Each one arrived roughly when the market
// decided that capability belonged in the platform.
//
// Notable that almost every deal is small and technology-focused. Zscaler did
// not buy revenue; it bought capabilities and folded them into one exchange.
// ============================================================================

import type { VendorLineage } from "./f5";

export const zscalerLineage: VendorLineage = {
  key: "zscaler",
  name: "Zscaler, Inc.",
  tagline:
    "Bet that security belonged in a global cloud rather than an appliance, then bought one capability a year to fill the platform out.",

  founded: {
    year: 2007,
    dateText: "2007",
    place: "San Jose, California",
    asName: "Zscaler",
    founder: "Jay Chaudhry",
  },

  names: [
    {
      name: "Zscaler",
      from: "2007",
      note: "Founded by Jay Chaudhry, who had already built and sold several security companies. Listed on NASDAQ in 2018.",
    },
  ],

  origin:
    "A cloud-delivered secure web gateway, at a time when the answer to web security was a proxy appliance in every office. The architectural claim was that if every user's traffic already leaves the building, the inspection point should be in the cloud rather than backhauled to a data centre.",

  acquisitions: [
    {
      year: 2019,
      name: "Appsulate",
      price: "undisclosed",
      what: "Browser isolation - rendering risky pages away from the endpoint.",
      became: "Zscaler Cloud Browser Isolation.",
    },
    {
      year: 2019,
      name: "Edgewise Networks",
      price: "undisclosed",
      what: "Identity-based micro-segmentation for workloads, rather than address-based rules.",
      became: "Workload segmentation within the Zero Trust Exchange.",
    },
    {
      year: 2020,
      name: "Cloudneeti",
      price: "undisclosed",
      what: "Cloud security posture management - configuration and compliance across cloud accounts.",
      became: "The posture-management half of Zscaler's cloud protection.",
    },
    {
      year: 2021,
      name: "Trustdome",
      price: "undisclosed",
      what: "Cloud infrastructure entitlement management: who and what can do what across cloud accounts.",
      became:
        "CIEM alongside the existing posture management. It also opened Zscaler's first development centre in Israel.",
      sourceNote: "Reported in Zscaler's own Q3 FY2021 results.",
    },
    {
      year: 2021,
      name: "Smokescreen Technologies",
      price: "undisclosed",
      what: "Active defence and deception technology - decoys that reveal lateral movement.",
      became: "Deception inside the Zero Trust Exchange, aimed at ransomware and targeted attacks.",
    },
    {
      year: 2022,
      name: "ShiftRight",
      price: "$25.6M",
      what: "Closed-loop security workflow automation.",
      became: "Workflow automation across the platform.",
    },
    {
      year: 2023,
      name: "Canonic Security",
      price: "undisclosed",
      what: "SaaS application security - the supply chain of third-party apps connected into SaaS platforms.",
      became: "SaaS supply-chain protection.",
    },
    {
      year: 2024,
      name: "Avalor",
      price: "reported $310-350M",
      what: "A data fabric for security, with more than 150 prebuilt integrations, correlating risk signals across tools.",
      became:
        "The AI and risk-analytics layer, combined with Zscaler's own telemetry from more than 400 billion daily transactions.",
      sourceNote:
        "Terms were not formally disclosed; press reports place it between $310M and $350M, and the figure is presented as reported rather than confirmed.",
    },
    {
      year: 2024,
      name: "Airgap Networks",
      price: "undisclosed",
      what: "Agentless network segmentation, aimed at removing the need for firewall-based segmentation inside campus and OT networks.",
      became: "Zero Trust SASE segmentation, paired with Zscaler's own Zero Trust SD-WAN.",
      sourceNote: "Announced April 2024, per Zscaler's own results filing.",
    },
  ],

  asOf: "July 2026",

  sources: [
    {
      label: "Zscaler SEC filing (FY2024 Q3): Avalor and Airgap acquisitions",
      url: "https://www.sec.gov/Archives/edgar/data/1713683/000171368324000072/zs-04302024_991.htm",
    },
    {
      label: "Zscaler SEC filing (FY2021 Q3): Trustdome and Smokescreen",
      url: "https://www.sec.gov/Archives/edgar/data/1713683/000171368321000083/zs-04302021_991.htm",
    },
    {
      label: "Zscaler company blog: the Airgap Networks acquisition",
      url: "https://www.zscaler.com/blogs/company-news/zscaler-acquires-airgap-networks-extends-zero-trust-sase",
    },
    {
      label: "SDxCentral: Avalor reported valuation",
      url: "https://www.sdxcentral.com/news/zscaler-acquires-airgap-networks-to-enhance-zero-trust-segmentation-and-sase/",
    },
  ],
};
