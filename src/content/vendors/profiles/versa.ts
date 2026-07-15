// ============================================================================
// src/content/vendors/profiles/versa.ts
// ----------------------------------------------------------------------------
// VERSA NETWORKS - THE SASE INDEPENDENT. Founded 2012 by brothers Kumar and
// Apurva Mehta after eight years at Juniper leading the MX series - and, before
// Juniper, both at RIVERSTONE NETWORKS (Rodolfo's own employer, 2000-2002) and
// Yago Systems; Apurva had earlier been the ATM software architect at
// Centillion Networks, Foundry founder Bobby Johnson's first company. One of
// the last large independents in a consolidated SD-WAN/SASE market.
//
// Verified 2026-07-14: Versa's own leadership pages (Mehta bios incl.
// Riverstone/Yago/Centillion), VentureBeat Jun 2021 (founded 2012 post-Juniper
// MX; $84M round, total $196M), TechCrunch Oct 27, 2022 ($120M round; Ahuja
// CEO 2016; consolidation context), Tracxn ($316M total over 6 rounds; first
// round Nov 26, 2012), Forge (Gartner 2022 Critical Capabilities: highest
// score, Large Global WAN use case for VOS), Network World Nov 2015 (FlexVNF/
// Director/Analytics launch).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const versaProfile: VendorProfile = {
  slug: "versa",
  foundings: [
    {
      company: "Versa Networks",
      year: 2012,
      place: "Santa Clara, California",
      founders: ["Kumar Mehta", "Apurva Mehta"],
      story:
        "Two brothers who had spent eight years at Juniper building the MX series - Kumar as VP of Engineering, Apurva as CTO and chief architect of the mobility business unit - left to rebuild the WAN as software. Their pre-Juniper resumes trace this site's own lineage: both held senior roles at Riverstone Networks (where Rodolfo worked in Santa Clara, 2000-2002) and Yago Systems, and Apurva had earlier architected ATM software at Centillion Networks, Foundry founder Bobby Johnson's first company. The founding bet: networking and security functions as multi-tenant software on commodity hardware.",
    },
  ],
  timeline: [
    { year: 2012, title: "Founded by the Mehta brothers", detail: "Kumar and Apurva Mehta leave Juniper to start Versa in Silicon Valley; the first funding round closes in November 2012, with Sequoia Capital and Mayfield among the early backers." },
    { year: 2015, title: "FlexVNF, Director, Analytics", detail: "The product line launches: virtualized network and security functions in software on low-cost hardware, centrally managed - virtual CPE, SD-WAN, and branch security before SASE had a name." },
    { year: 2016, title: "Kelly Ahuja takes the helm", detail: "The Cisco veteran becomes CEO, with the founders staying on as CDO and CTO." },
    { year: 2019, title: "Gartner coins SASE", detail: "When Gartner defines secure access service edge - networking and security converged as a cloud service - Versa's single-stack architecture positions it as one of the category's natural fits." },
    { year: 2021, title: "$84M round", detail: "June 2021: a round co-led by Princeville Capital and RPS Ventures brings total funding to $196 million as SASE demand accelerates." },
    { year: 2022, title: "$120M and a Gartner top score", detail: "October 27, 2022: a $120 million round (investors include Sequoia, Mayfield, and BlackRock) lifts total funding to roughly $316 million over six rounds. The same year, Versa's VOS receives the highest score in the Large Global WAN use case of Gartner's Critical Capabilities for SD-WAN.", sourceNote: "TechCrunch; Tracxn; Gartner 2022 Critical Capabilities as cited by Versa." },
    { year: 2024, title: "VersaONE", detail: "The portfolio converges as the VersaONE Universal SASE Platform - SSE, SD-WAN, and SD-LAN on one AI-assisted stack - while Versa remains privately held and, per its CEO, pointed toward an IPO rather than a sale." },
  ],
  products: [
    { name: "VOS (Versa Operating System)", what: "The single software stack underneath everything: routing, SD-WAN, next-generation firewall, and security services, multi-tenant by design for service providers and enterprises." },
    { name: "VersaONE Universal SASE", what: "The converged platform - SSE (SWG, CASB, ZTNA, DLP), SD-WAN, and SD-LAN - managed through one console, deployable in cloud, on-premises, or both." },
    { name: "Versa Director and Analytics", what: "Centralized orchestration and granular visibility - the management pair that has anchored the architecture since the 2015 launch." },
  ],
  innovations: [
    { title: "The single-stack bet", detail: "Where competitors bolted security onto SD-WAN or SD-WAN onto security, Versa built one operating system carrying both from the start - the architecture SASE later demanded." },
    { title: "Carrier-grade multi-tenancy", detail: "Built for service providers first: one platform hosting many customers, which made Versa a favorite of managed SD-WAN offerings worldwide." },
    { title: "Independence as strategy", detail: "Viptela went to Cisco, VeloCloud to VMware, Silver Peak to Aruba, CloudGenix to Palo Alto - Versa stayed independent through the consolidation wave, one of the last large pure-plays in its market." },
  ],
  markets: [
    "Versa competes in unified SASE against the largest names in networking and security - the converged SD-WAN and SSE market that Gartner's category now defines. Its customers span thousands of enterprises and the service providers who resell it as managed offerings.",
    "For this site, Versa is also a lineage marker: its founders' path runs through Riverstone Networks - the same Santa Clara company where Rodolfo worked from 2000 to 2002 - and back to Centillion, connecting the SASE era to the switch wars of the 1990s.",
  ],
  analyst: [
    "Versa's VOS received the highest score in the Large Global WAN use case of Gartner's 2022 Critical Capabilities for SD-WAN.",
    "Total funding of roughly $316 million over six rounds (through October 2022) from investors including Sequoia Capital, Mayfield, BlackRock, and Verizon Ventures - with leadership publicly favoring an IPO path over acquisition.",
  ],
  careerLink: {
    href: "/about/vendors/riverstone",
    label: "Versa's founders built at Riverstone Networks before Juniper - Rodolfo's Riverstone page",
  },
};
