// ============================================================================
// src/content/vendors/profiles/crowdstrike.ts
// ----------------------------------------------------------------------------
// VERIFICATION MANIFEST
//
// Verified 2026-08-04 against:
//   - CrowdStrike investor relations and press releases (Gartner MQ for EPP,
//     Leader for the sixth consecutive time in 2025 and seventh in 2026;
//     furthest right for Completeness of Vision three evaluations running)
//   - CrowdStrike blog, October 2025: named a VISIONARY - not a Leader - in the
//     2025 Gartner MQ for SIEM; Falcon Next-Gen SIEM built on Falcon LogScale,
//     formerly Humio; the Onum acquisition for telemetry pipelines
//   - Product-review aggregation, 2026: 400M+ endpoints, 30,000+ customers,
//     30+ modules, Falcon Flex at $1.69B ARR
//   - Falcon Next-Gen Identity Security above $520M ending ARR, +34% YoY
//
// THE BODY ALREADY ARGUES the founding thesis, Falcon's inversion of the
// signature model, the investigations, the IPO and the 19 July 2024 outage
// including its structural reading. This profile adds the dated timeline, the
// module taxonomy, the market position and the analyst standing - and does not
// re-argue the outage.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const crowdstrikeProfile: VendorProfile = {
  slug: "crowdstrike",

  foundings: [
    {
      company: "CrowdStrike",
      year: 2011,
      place: "Sunnyvale, California",
      founders: ["George Kurtz", "Dmitri Alperovitch", "Gregg Marston"],
      story:
        "Incorporated on 7 November. Kurtz had been chief technology officer at McAfee, which had bought his previous company Foundstone; Alperovitch had run threat research there. The founding claim was that the industry was asking the wrong question - identifying malicious files rather than identifying the people sending them - and that an adversary who changes their tools is still recognisable by how they work.",
    },
  ],

  timeline: [
    {
      year: 2011,
      title: "Founded",
      detail: "By two McAfee executives and a co-founder from Foundstone, on the argument that attribution and behaviour matter more than file signatures.",
    },
    {
      year: 2013,
      title: "Falcon ships",
      detail:
        "A deliberately light sensor that streams telemetry to a cloud where behaviour is correlated across every customer at once, rather than a heavy agent making local decisions from a local database.",
    },
    {
      year: 2014,
      title: "Sony Pictures",
      detail:
        "The investigation that made the name, followed by the Democratic National Committee intrusions in 2015 and 2016.",
    },
    {
      year: 2019,
      title: "NASDAQ listing",
      detail: "Listed in June at roughly $14B and rose more than 70% on the first day.",
    },
    {
      year: 2022,
      title: "Humio becomes LogScale",
      detail:
        "The log platform acquired in 2021 became the foundation for a SIEM product, putting the company into direct competition with the incumbents - including Splunk, which appears elsewhere on this timeline and was itself acquired by Cisco two years later.",
    },
    {
      year: 2024,
      title: "19 July, and the S&P 500",
      detail:
        "A faulty sensor configuration update took an estimated 8.5 million Windows machines offline in a morning. The company joined the S&P 500 the same year. Analyst assessments since have treated the event as a serious trust problem that did not alter the product's technical standing - which is a distinction worth holding on to, because the two are genuinely separable.",
      sourceNote:
        "The outage is discussed on its own terms in the entry above; this timeline records it and the analyst reading rather than repeating that argument.",
    },
    {
      year: 2026,
      title: "Seventh consecutive Gartner EPP leadership",
      detail: "Named a Leader for the seventh time running, having been positioned furthest right for completeness of vision in three consecutive evaluations.",
    },
  ],

  products: [
    {
      name: "Falcon sensor",
      what: "One lightweight agent carrying every module, with no on-premises infrastructure behind it. The single-agent architecture is the platform decision everything else depends on - and the reason a bad update reaches everywhere at once.",
    },
    {
      name: "Falcon Insight",
      what: "The endpoint detection and response component, and the part most often measured against competitors in independent evaluations.",
    },
    {
      name: "Falcon OverWatch and Falcon Complete",
      what: "Managed threat hunting and managed detection and response - human analysts working the same telemetry, sold as a service. The acknowledgement that automated detection has a ceiling.",
    },
    {
      name: "Falcon Identity Protection",
      what: "Coverage of the identity attack path from initial access through privilege escalation to lateral movement, reported above $520M of annual recurring revenue and growing faster than the platform as a whole.",
    },
    {
      name: "Falcon Next-Gen SIEM",
      what: "Built on LogScale, the platform acquired as Humio, and positioned explicitly as a replacement for the incumbent SIEMs rather than a complement to them.",
    },
    {
      name: "Charlotte AI",
      what: "Natural-language querying over Falcon telemetry, extended into agentic triage and response - the analyst assistant becoming an analyst substitute for the first tier of work.",
    },
    {
      name: "Falcon Data Replicator",
      what: "Export of raw telemetry into a customer's own systems, which is worth noting beside the SIEM product: the platform sells you its analysis and will also hand you the data to analyse elsewhere.",
    },
  ],

  innovations: [
    {
      title: "The cloud as the correlation point",
      detail:
        "Detection quality improves with the number of sensors reporting, because behaviour that looks unremarkable at one customer is recognisable across thousands. That makes the install base an asset rather than a liability, and it is why the model is difficult to enter late.",
    },
    {
      title: "Adversary tracking as a product",
      detail:
        "Naming and profiling groups - their tooling, their timing, their habits - turns intelligence into something a customer can act on before an incident rather than after one. It also put a commercial company into public attribution, which had previously been the business of governments.",
    },
    {
      title: "Consolidation onto one agent",
      detail:
        "Thirty-odd modules delivered by a single sensor addresses a real operational problem, since every additional agent on an endpoint costs performance, compatibility and administration. The trade is concentration: one agent is one dependency, and July 2024 is what that costs on a bad day.",
    },
    {
      title: "Selling the analysts as well as the software",
      detail:
        "OverWatch and Complete exist because most organisations cannot staff a security operations centre around the clock. Packaging expertise as a subscription is now normal, and this company did much to make it so.",
    },
  ],

  markets: [
    "Reported at more than 400 million protected endpoints across upwards of 30,000 customers, sold from small-business tiers through to enterprise agreements measured in six figures a year. Flexible licensing - buying platform credits rather than individual modules - reached $1.69B of annual recurring revenue, which is a demand signal about how customers want to consolidate.",
    "Its competitors are now in three different categories at once: dedicated endpoint vendors, the platform security suites, and Microsoft, which ships a competing product with the operating system. The SIEM move added a fourth front against incumbents with decades of installed base.",
  ],

  analyst: [
    "A Leader in Gartner's endpoint protection Magic Quadrant for seven consecutive evaluations, positioned furthest right for completeness of vision in the last three, and a Leader in the first Magic Quadrant for cyberthreat intelligence technologies.",
    "In SIEM it is placed as a Visionary rather than a Leader, which is the honest reading of a newer entrant against long-established platforms, and worth stating rather than rounding up.",
    "The 2024 outage is treated in analyst coverage as a trust event rather than a capability one: significant customer concern, no change in the assessment of the product. Whether that separation holds is a commercial question rather than a technical one.",
  ],
};
