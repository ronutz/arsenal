// ============================================================================
// src/content/vendors/profiles/splunk.ts
// ----------------------------------------------------------------------------
// VERIFICATION MANIFEST
//
// Verified 2026-08-04 against:
//   - Wikipedia: founded October 2003 by Baum, Das and Swan; NASDAQ SPLK
//     2012-2024; 2023 revenue $3.65B with an operating loss of $236M; Gary
//     Steele promoted to Cisco executive May 2024 while remaining Splunk
//     general manager; Cisco's AppDynamics moved INTO Splunk after integration
//   - Splunk blogs, 2025: Leader and highest in Execution in the Gartner SIEM
//     Magic Quadrant; Leader in Observability Platforms for a third year; the
//     only vendor a Leader in both three times
//   - Product review aggregation, 2026: 2.67 exabytes processed daily, 90+ of
//     the Fortune 100, 2,500+ Splunkbase apps, SignalFx acquired 2019 for
//     $1.05B, and the two consistent criticisms - cost and SPL lock-in
//
// THE BODY ALREADY ARGUES schema-on-read, the free-tier go-to-market, the
// financials and the Cisco deal. This profile adds the dated timeline, the
// product taxonomy, the analyst standing, and the two criticisms the body does
// not raise.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const splunkProfile: VendorProfile = {
  slug: "splunk",

  foundings: [
    {
      company: "Splunk",
      year: 2003,
      place: "San Francisco, California",
      founders: ["Michael Baum", "Rob Das", "Erik Swan"],
      story:
        "Three people who had each spent years on infrastructure software and arrived at the same complaint: the data that tells you why a system failed already exists, in logs, and there is no good way to search it. The name comes from spelunking, because that is what working through your own log files felt like.",
    },
  ],

  timeline: [
    { year: 2003, title: "Founded", detail: "In San Francisco, on the observation that machine-generated data was abundant and unsearchable." },
    {
      year: 2012,
      title: "NASDAQ listing",
      detail: "Listed as SPLK at roughly $1.6B, having raised only about $40M in total - unusually little for the scale it reached.",
    },
    {
      year: 2019,
      title: "SignalFx",
      detail:
        "Acquired for around $1.05B, and the foundation of the observability business: streaming metrics and application performance monitoring alongside the log platform.",
    },
    {
      year: 2023,
      title: "Cisco announces",
      detail: "Announced 21 September at approximately $28B, one of the largest software acquisitions on record.",
    },
    {
      year: 2024,
      title: "Completion, and an unusual direction of travel",
      detail:
        "Closed 18 March. Gary Steele moved up into Cisco while remaining Splunk's general manager - and Cisco moved its own AppDynamics observability product into Splunk rather than the other way round. An acquirer folding its existing product into the company it just bought is a statement about which platform it considers the survivor.",
      sourceNote: "Steele's dual role and the AppDynamics move per contemporary trade reporting and Wikipedia's summary.",
    },
    {
      year: 2025,
      title: "Talos inside Splunk",
      detail:
        "Cisco's threat intelligence began shipping inside Splunk Enterprise Security at no additional cost, which is the clearest concrete benefit of the acquisition to an existing customer.",
    },
  ],

  products: [
    {
      name: "Splunk Enterprise and Splunk Cloud",
      what: "The core platform: ingest anything, index it, search it. Sold on data volume per day, on-premises or hosted.",
    },
    {
      name: "SPL, the Search Processing Language",
      what: "The query language, and the reason practitioners stay. It correlates across sources in a single search - container crash loops against cloud API failures against directory authentication - which is the capability users cite first and the thing hardest to reproduce elsewhere.",
    },
    {
      name: "Splunk Enterprise Security",
      what: "The SIEM, now with user behaviour analytics and automation built in rather than sold alongside, and with risk-based alerting aimed at the volume problem that makes security operations centres unworkable.",
    },
    {
      name: "Splunk SOAR",
      what: "Orchestration and automated response, built out from the Phantom acquisition, with several hundred prebuilt playbooks and integrations into other vendors' tools.",
    },
    {
      name: "Observability Cloud, ITSI and AppDynamics",
      what: "Metrics, traces and service-level monitoring - the SignalFx line, joined after the acquisition by Cisco's own application performance product.",
    },
    {
      name: "Splunkbase",
      what: "Several thousand community and vendor apps and add-ons. The ecosystem is a substantial part of why the platform is where an organisation's data ends up.",
    },
  ],

  innovations: [
    {
      title: "Schema-on-read",
      detail:
        "Store the data first and decide what it means when you query it. That inverts the database assumption, and it is the only workable answer when the question you will need to ask has not happened yet - which is the normal condition of an incident.",
    },
    {
      title: "Making logs a first-class data type",
      detail:
        "Before this, logs were something you tailed when something broke. Treating them as a searchable corpus with a query language turned an operational nuisance into an analytics category, and the security and observability markets both grew out of that reframing.",
    },
    {
      title: "The language as the moat",
      detail:
        "SPL is powerful and proprietary, and those are the same fact. Every saved search, dashboard and detection rule an organisation writes is an asset that only runs here, so leaving means rewriting years of accumulated work rather than exporting data.",
    },
    {
      title: "Bottom-up adoption",
      detail:
        "A free tier that engineers installed themselves, then brought to their employers. Reaching the buyer through the practitioner rather than the other way round was unusual for enterprise infrastructure in the 2000s and is now the standard playbook.",
    },
  ],

  markets: [
    "Security operations and IT observability, sold to large enterprises - reported in use at more than ninety of the Fortune 100, processing volumes measured in exabytes per day. The customer is an organisation with enough data that finding anything in it has become its own problem.",
    "Two criticisms are consistent enough in customer feedback to belong in any honest description. It is expensive - volume-based pricing at scale is the most frequent complaint, and deployments of a hundred gigabytes a day are quoted in the hundreds of thousands per year. And migrating away is costly for the reason above: the queries do not travel. Competitors including CrowdStrike, whose own SIEM appears elsewhere on this timeline, position explicitly against both.",
  ],

  analyst: [
    "A Leader in Gartner's SIEM Magic Quadrant for more than ten consecutive evaluations, placed highest for ability to execute in 2025, and a Leader in observability platforms for three years running - reportedly the only vendor to hold both simultaneously three times.",
    "The open question under Cisco is whether a platform whose strength is being vendor-neutral about data sources stays that way inside a networking company, and the early evidence points both ways: Talos intelligence added at no cost is a customer benefit, while AppDynamics moving in is consolidation.",
  ],
};
