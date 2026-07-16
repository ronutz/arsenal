// ============================================================================
// SAP - five engineers against the mainframe. Knowledge-based, dates
// well-documented (2026-07-16): founded April 1972 in Weinheim/Mannheim by
// five ex-IBM engineers - Dietmar Hopp, Hasso Plattner, Klaus Tschira, Hans-
// Werner Hector, Claus Wellenreuther - as Systemanalyse und Programm-
// entwicklung; R/1 realtime financials; R/2 mainframe ERP; R/3 (1992) rides
// client-server into global dominance; headquarters Walldorf; HANA in-memory
// 2010; S/4HANA 2015; Qualtrics bought 2019 (~$8B) and spun 2023; RISE with
// SAP cloud pivot 2021; Christian Klein sole CEO since April 2020 (through
// the knowledge cutoff). Networking adjacency: SAP traffic shaped a
// generation of enterprise QoS and WAN designs.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const sapProfile: VendorProfile = {
  slug: "sap",
  foundings: [
    {
      company: "SAP",
      year: 1972,
      place: "Weinheim, Germany",
      founders: ["Dietmar Hopp", "Hasso Plattner", "Klaus Tschira", "Hans-Werner Hector", "Claus Wellenreuther"],
      story:
        "In 1972, five IBM engineers in Mannheim watched their employer shelve the idea they believed in - standard business software, built once, sold to many - and left to build it themselves. Systemanalyse und Programmentwicklung wrote its first realtime financial system for a nylon factory's mainframe, and the compounding began: R/2 conquered the mainframe ERP world, R/3 conquered the client-server one, and SAP became the operating system of global business - Europe's greatest software company, and the reason a generation of network engineers learned QoS on ERP traffic.",
    },
  ],
  timeline: [
    { year: 1972, title: "Five founders, one nylon factory", detail: "The ex-IBM five write realtime financial software at ICI's Östringen plant - 'R' for realtime becomes the product line's name and the company's creed: data processed as business happens." },
    { year: 1992, title: "R/3: the client-server conquest", detail: "Three-tier architecture at exactly the right moment - R/3 rides the downsizing wave into nearly every large enterprise on earth, and the SAP consultant becomes a profession the size of a small nation." },
    { year: 2010, title: "HANA", detail: "Hasso Plattner's in-memory column-store bet ships as SAP HANA - the database underneath everything SAP builds next, and the rare case of an applications giant successfully reinventing its own foundations." },
    { year: 2015, title: "S/4HANA", detail: "The ERP core rewritten natively on HANA - the migration that defines two decades of enterprise IT roadmaps, and half the WAN designs this site's audience has ever costed." },
    { year: 2021, title: "RISE: the cloud pivot", detail: "RISE with SAP packages the move to cloud ERP as a single commercial motion - subscription conversion at installed-base scale, with the Business Technology Platform as the extension story. Qualtrics, bought for ~$8 billion in 2019, is spun back out in 2023." },
    { year: 2020, title: "Klein's tenure", detail: "Christian Klein becomes sole CEO in April 2020, steering the cloud transition and the AI-in-ERP era - Walldorf's course through the knowledge cutoff of this page.", sourceNote: "Leadership current through the knowledge cutoff." },
  ],
  products: [
    { name: "S/4HANA Cloud", what: "The ERP core - finance, supply chain, manufacturing - on the in-memory foundation." },
    { name: "SAP HANA and BTP", what: "The database and the Business Technology Platform: the substrate and the extension layer." },
    { name: "The line-of-business suites", what: "SuccessFactors, Ariba, Concur - the acquired cloud constellation around the core." },
  ],
  innovations: [
    { title: "Standard business software", detail: "SAP proved the enterprise would run on packaged software configured, not written - the premise the entire enterprise-software industry stands on." },
    { title: "In-memory at the core", detail: "HANA moved the analytical and transactional worlds onto one in-memory engine - a foundations rewrite executed while flying the plane." },
  ],
  markets: [
    "SAP runs the operational core of most of the world's largest enterprises - Europe's most valuable technology company through its cloud transition, and the workload behind untold enterprise network designs.",
  ],
  analyst: [
    "The permanent leader of the ERP evaluations for four decades - the vendor whose migration timelines the rest of enterprise IT plans around.",
  ],
};
