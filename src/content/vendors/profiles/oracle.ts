// ============================================================================
// ORACLE - the database empire. VERIFIED 2026-07-16 via Oracle SEC 8-K and
// DEF 14A: September 22, 2025 - Clay Magouyrk and Mike Sicilia promoted to
// CEOs; Safra Catz (CEO since 2014) appointed Executive Vice Chair; Larry
// Ellison remains Chairman and CTO; Douglas Kehring PFO. Knowledge-based
// bedrock: founded 1977 as Software Development Laboratories by Ellison, Bob
// Miner, Ed Oates; the CIA project codenamed Oracle; Oracle V2 (1979), the
// first commercial SQL RDBMS; near-death 1990; internet era; the acquisition
// machine: PeopleSoft (hostile, ~$10.3B, 2005), Siebel, BEA, Sun (Jan 2010,
// ~$7.4B), NetSuite 2016, Cerner (~$28.3B, 2022); OCI Gen2 and the AI
// buildout ($455B RPO per FY26 reporting).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const oracleProfile: VendorProfile = {
  slug: "oracle",
  foundings: [
    {
      company: "Oracle (founded as Software Development Laboratories)",
      year: 1977,
      place: "Santa Clara, California",
      founders: ["Larry Ellison", "Bob Miner", "Ed Oates"],
      story:
        "Larry Ellison read Edgar Codd's relational papers and did what IBM, Codd's employer, hesitated to do: shipped. Software Development Laboratories - Ellison, Bob Miner, Ed Oates - took its product name from a CIA project they had worked on, and released Oracle V2 in 1979 (there was no V1; Ellison reasoned nobody buys a version one) as the first commercial SQL relational database. Nearly fifty years of compounding later, the database company is a cloud-infrastructure giant whose 2025 handover to co-CEOs marked its full pivot to the AI era.",
    },
  ],
  timeline: [
    { year: 1979, title: "Oracle V2: SQL for sale", detail: "The first commercial SQL relational database ships - beating IBM's own System R lineage to market and defining the product category enterprise software still stands on." },
    { year: 1990, title: "Near death, then discipline", detail: "Aggressive revenue recognition catches up: losses, restatements, layoffs - and the professionalization (Jeff Henley, Ray Lane) that turns a brilliant mess into a machine." },
    { year: 2005, title: "The acquisition machine starts", detail: "The 18-month hostile pursuit of PeopleSoft closes at ~$10.3 billion and opens the era: Siebel, BEA, and dozens more - Oracle consolidates enterprise software layer by layer." },
    { year: 2010, title: "Sun", detail: "January 27, 2010: the ~$7.4 billion Sun Microsystems acquisition closes - Java, Solaris, SPARC, and MySQL join the empire; the seller's side is told on this section's Sun page." },
    { year: 2022, title: "Cerner, and the vertical turn", detail: "The ~$28.3 billion Cerner acquisition - Oracle's largest to that point - takes the database company into healthcare's operational core, the industry-suite strategy at full scale." },
    { year: 2025, title: "Co-CEOs for the AI era", detail: "September 22, 2025: Clay Magouyrk (OCI) and Mike Sicilia (Industries) are promoted to CEOs; Safra Catz becomes Executive Vice Chair after eleven years as CEO, with Ellison Chairman and CTO throughout - the handover timed to an AI-infrastructure boom that swelled remaining performance obligations to $455 billion.", sourceNote: "Oracle 8-K and DEF 14A, September 2025." },
  ],
  products: [
    { name: "Oracle Database", what: "The product that built the empire - now the AI Database at the center of the platform story." },
    { name: "Oracle Cloud Infrastructure", what: "Gen2 OCI: the hyperscale and AI-training cloud, the growth engine of the current era." },
    { name: "Fusion and industry applications", what: "The ERP/HCM suites plus the vertical stacks - Cerner's health lineage included." },
  ],
  innovations: [
    { title: "Commercializing the relational model", detail: "Oracle turned Codd's theory into the industry's default data architecture - and defended that position across every platform shift since." },
    { title: "Consolidation as strategy", detail: "The post-2004 acquisition machine rewrote how mature software markets work: buy the installed base, keep the maintenance, integrate the stack." },
  ],
  markets: [
    "Oracle sells the database, cloud infrastructure, and application suites across every industry - a top-tier AI-infrastructure provider whose 2025 leadership structure was built explicitly for that race.",
  ],
  analyst: [
    "The permanent leader of the database evaluations for four decades, now graded among the hyperscalers - a company that has outlived every category it was ever confined to.",
  ],
};
