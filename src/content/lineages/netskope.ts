// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// NETSKOPE corporate lineage.
//
// The shortest list here, and deliberately so: Netskope has made four
// acquisitions in its history, each one filling a specific gap on the path
// from CASB to SSE to SASE. There is no sprawl to explain, which is itself
// the interesting fact about this vendor.
//
// The trajectory is legible in the order: visibility into SaaS first, then
// devices, then the network underneath, then the user experience across it,
// then the data itself.
// ============================================================================

import type { VendorLineage } from "./f5";

export const netskopeLineage: VendorLineage = {
  key: "netskope",
  name: "Netskope, Inc.",
  tagline:
    "Started by looking inside SaaS traffic when nobody else could, and bought only what it needed to become a full SASE platform.",

  founded: {
    year: 2012,
    dateText: "2012",
    place: "Santa Clara, California",
    asName: "Netskope",
  },

  names: [
    {
      name: "Netskope",
      from: "2012",
      note: "Raised more than $1.44B across twelve equity and debt rounds before filing to go public on NASDAQ.",
    },
  ],

  origin:
    "Cloud access security brokerage: understanding what users were actually doing inside SaaS applications, at a time when the network could see a connection to a cloud service but nothing about the activity within it. The data-classification depth from that era is still what the platform is judged on.",

  acquisitions: [
    {
      year: 2022,
      name: "WootCloud",
      price: "undisclosed",
      what: "Device intelligence and zero-trust controls for IoT and OT - the equipment that cannot run an agent.",
      became: "IoT and OT visibility within the platform.",
      sourceNote: "July 2022.",
    },
    {
      year: 2022,
      name: "Infiot",
      price: "undisclosed",
      what: "Cloud-delivered SD-WAN, the branch interconnectivity that Gartner treated as the dividing line between SSE and SASE.",
      became:
        "Borderless SD-WAN at general availability in April 2023, and now the foundation of the One SASE platform. This is the acquisition that moved Netskope from security service edge into full SASE.",
      sourceNote: "August 2022.",
    },
    {
      year: 2023,
      name: "Kadiska",
      price: "undisclosed",
      what: "Digital experience monitoring from France - measuring what the user actually experiences rather than what the infrastructure reports.",
      became: "Inline experience monitoring across the SSE, the SD-WAN and the NewEdge network.",
      sourceNote: "September 2023.",
    },
    {
      year: 2024,
      name: "Dasera",
      price: "undisclosed",
      what: "Data security posture management - finding and classifying sensitive data at rest rather than in flight.",
      became:
        "DSPM alongside the inline DLP, pairing a data scanner with the traffic inspection Netskope started from.",
      sourceNote: "October 2024.",
    },
  ],

  asOf: "July 2026",

  sources: [
    {
      label: "Netskope IPO filing coverage: the four acquisitions, funding and customer figures",
      url: "https://www.govinfosecurity.com/netskopes-ipo-filing-reveals-surging-sales-improved-losses-a-29278",
    },
    {
      label: "hhhypergrowth: the CASB to SSE to SASE trajectory and what each acquisition added",
      url: "https://hhhypergrowth.com/a-look-at-netskope/",
    },
  ],
};
