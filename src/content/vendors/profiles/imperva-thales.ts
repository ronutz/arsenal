// ============================================================================
// src/content/vendors/profiles/imperva-thales.ts
// ----------------------------------------------------------------------------
// IMPERVA - FROM WEBCOHORT TO THALES. Founded 2002 in Israel as WebCohort by
// three serial entrepreneurs - including Check Point co-founder Shlomo Kramer.
// SecureSphere (2003) helped define the web application firewall category;
// the company IPO'd in 2011, went private under Thoma Bravo for $2.1B (2019),
// and was acquired by France's Thales for $3.6B (completed Dec 4, 2023).
//
// Verified 2026-07-14: Wikipedia (WebCohort 2002; SecureSphere 2003; renamed
// 2004; NYSE IPO 2011; Thales completed Dec 4, 2023), Globes Jul 25, 2023
// (Thoma Bravo completed Jan 2019 at $2.1B; 2023 revenue >$500M, EBITDA
// $110M; 1,400 employees, 500 Tel Aviv; founders' later startups), Times of
// Israel (founder backgrounds).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const impervaThalesProfile: VendorProfile = {
  slug: "imperva-thales",
  foundings: [
    {
      company: "WebCohort (renamed Imperva, 2004)",
      year: 2002,
      place: "Tel Aviv, Israel",
      founders: ["Shlomo Kramer", "Amichai Shulman", "Mickey Boodaei"],
      story:
        "Three founders with pedigrees that read like an Israeli security syllabus: Kramer had co-founded Check Point itself; Shulman came from the IDF's electronic-intelligence world; Boodaei would later found Trusteer (acquired by IBM) and Transmit Security. Their thesis was the inside-out problem - networks were getting secured while the applications and data behind them stayed exposed. SecureSphere, shipped in 2003, attacked exactly that gap, and in 2004 the company renamed itself Imperva: making data impervious.",
    },
  ],
  timeline: [
    { year: 2002, title: "WebCohort founded", detail: "Kramer, Shulman, and Boodaei start the company in Israel to protect what firewalls did not: the applications and the data behind them." },
    { year: 2003, title: "SecureSphere ships", detail: "SecureSphere Web Application Database Protection arrives - a pioneering web application firewall that learned application behavior, paired with database activity monitoring." },
    { year: 2004, title: "Renamed Imperva", detail: "The company takes the name it keeps: business-critical data made impervious to attack." },
    { year: 2011, title: "NYSE IPO", detail: "Imperva goes public on the New York Stock Exchange (IMPV); headquarters move to the US the following year, with development anchored in Tel Aviv." },
    { year: 2014, title: "Incapsula absorbed", detail: "Imperva acquires the remaining shares of Incapsula, its cloud application-security and CDN arm - the on-prem WAF pioneer becomes a cloud WAF provider too." },
    { year: 2019, title: "Thoma Bravo takes it private", detail: "The private-equity firm completes a $2.1 billion take-private in January 2019 and delists the company; Distil Networks (bot management) is acquired the same year, CloudVector (API security) follows in 2021." },
    { year: 2023, title: "Thales", detail: "Announced July 25, 2023 and completed December 4, 2023: France's Thales acquires Imperva from Thoma Bravo for approximately $3.6 billion, folding it into its cyber defense business. Thales cited expected 2023 revenue above $500 million with $110 million EBITDA; about 1,400 employees, 500 of them in the Tel Aviv development center.", sourceNote: "Globes; Reuters; CRN (completion Dec 4, 2023)." },
  ],
  products: [
    { name: "SecureSphere / Imperva WAF", what: "The web application firewall lineage from 2003 to the present - on-premises appliances and the cloud WAF descended from Incapsula." },
    { name: "Database security", what: "Database activity monitoring and data-centric protection - the second half of the founding thesis, now marketed as Imperva Data Security Fabric." },
    { name: "Bot and API protection", what: "Advanced Bot Protection (from Distil Networks) and API Security (from CloudVector) - the modern application-attack surface." },
  ],
  innovations: [
    { title: "The WAF category itself", detail: "SecureSphere is one of the products that made 'web application firewall' a market - behavioral learning of application traffic instead of static rules alone." },
    { title: "Data-centric security", detail: "Imperva paired the WAF with database monitoring from the start: protect the data, not just the perimeter in front of it." },
    { title: "The founders' diaspora", detail: "All three founders moved on to build again - Kramer founded Cato Networks, Boodaei founded Trusteer and Transmit Security, Shulman co-founded Nokod Security - a measure of the talent that started here." },
  ],
  markets: [
    "Imperva competes in web application and API protection (WAAP) - the market where Rodolfo teaches F5's Advanced WAF daily - and in data security, now as the application-security arm of Thales, the French aerospace and defense group.",
    "The company's arc is the full lifecycle of a security vendor: Israeli startup, category pioneer, NYSE listing, private-equity ownership, and finally strategic acquisition by a defense conglomerate.",
  ],
  analyst: [
    "At the Thales acquisition, Imperva was expected to deliver over $500 million in 2023 revenue with $110 million EBITDA - a $3.6 billion valuation for a company that had gone private at $2.1 billion less than five years earlier.",
  ],
  careerLink: {
    href: "/f5",
    label: "Imperva pioneered the WAF market Rodolfo teaches through F5 Advanced WAF - the F5 hub",
  },
};
