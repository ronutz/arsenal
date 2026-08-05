// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-04 against Sophos press releases:
// Secureworks acquisition completed 3 February 2025, all-cash at approximately
// $859M, Secureworks common stock ceasing to trade on NASDAQ; 16th consecutive
// Gartner Magic Quadrant Leader placement for Endpoint Protection Platforms
// (2025); Sophos Endpoint natively included in all Taegis XDR and MDR
// subscriptions from September 2025 at no additional charge; more than 600,000
// customers; Secureworks' Counter Threat Unit tracking 150+ threat groups.
//
// THE BODY ALREADY ARGUES the narrow early business, the expansion, the LSE
// listing and Thoma Bravo, and the longevity point. This adds the structure.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const sophosProfile: VendorProfile = {
  slug: "sophos",
  foundings: [
    {
      company: "Sophos",
      year: 1985,
      place: "Oxford, England",
      founders: ["Jan Hruska", "Peter Lammer"],
      story:
        "Founded in September, writing virus detection for the IBM PC before most people had met a virus - the first PC virus spread the following year. The name is Greek for wisdom. Forty years later the company is still headquartered in the same city, which almost none of its contemporaries can say.",
    },
  ],
  timeline: [
    { year: 1985, title: "Founded in Oxford", detail: "Two founders, largely self-funded, selling to corporate and educational customers in Britain and Europe." },
    { year: 2010, title: "Apax takes a majority stake", detail: "The first outside control after twenty-five years of independence." },
    { year: 2015, title: "London Stock Exchange listing", detail: "Listed in London rather than New York, which is itself unusual for a security company of that size." },
    { year: 2020, title: "Taken private by Thoma Bravo", detail: "After five years as a public company." },
    {
      year: 2025,
      title: "Secureworks",
      detail:
        "Completed 3 February, all cash at approximately $859M, taking Secureworks off NASDAQ. It brought the Taegis platform and the Counter Threat Unit, a research team tracking more than 150 threat groups, and made Sophos the largest pure-play provider of managed detection and response.",
    },
    {
      year: 2025,
      title: "Sixteen consecutive leader placements",
      detail:
        "Named a Gartner Magic Quadrant Leader for endpoint protection for the sixteenth evaluation running - a span covering the entire transition from signature scanning to behavioural detection to managed response.",
    },
  ],
  products: [
    { name: "Sophos Endpoint and Intercept X", what: "The core protection product, with the anti-ransomware and exploit prevention work that became its distinguishing capability." },
    { name: "Sophos MDR", what: "Managed detection and response, now the largest part of the proposition and the reason the Secureworks purchase made sense." },
    { name: "Taegis", what: "The Secureworks platform, retained rather than absorbed - and since September 2025 shipping with Sophos Endpoint included at no extra cost, which is an unusually direct way to demonstrate that an acquisition benefits existing customers." },
    { name: "Sophos Firewall, Switch, Email and ZTNA", what: "Network and access products managed from the same console. The breadth is aimed squarely at organisations with one person doing all of security." },
    { name: "Sophos X-Ops", what: "The combined research organisation - threat intelligence, malware analysis and offensive research published openly, now joined by the Counter Threat Unit." },
  ],
  innovations: [
    { title: "Serving the organisation without a security team", detail: "The mid-market has always been the harder problem: the same threats as an enterprise, none of the staff. A single console covering endpoint, firewall, email and access is a product decision derived from that constraint rather than from a feature matrix." },
    { title: "Ransomware behaviour rather than ransomware signatures", detail: "Detecting the act of mass file encryption and rolling it back addresses the one failure mode where detection after the fact is worthless. It is a good illustration of behaviour-based defence solving something signatures structurally cannot." },
    { title: "Managed response as the product, not the upsell", detail: "Selling the analysts rather than only the software follows from the same customer: an alert that nobody is awake to read is not a defence. Buying the largest independent provider of that service made it the centre of the business." },
    { title: "Keeping the acquired platform", detail: "Taegis was kept and extended rather than shut down, with the acquirer's endpoint product added to it free. Acquisitions in this industry more often end with the smaller platform quietly retired." },
  ],
  markets: [
    "More than 600,000 customers, weighted toward small and mid-sized organisations and served largely through partners and managed service providers rather than direct - a distribution model that suits the customer size and is hard to build late.",
    "It competes with the endpoint platform vendors above it and the operating-system-bundled products below it, and increasingly on managed services, where the competition is as much other providers' analysts as other vendors' software.",
  ],
  analyst: [
    "Sixteen consecutive Gartner Magic Quadrant Leader placements in endpoint protection, which is among the longest unbroken runs in the category and the clearest evidence for the longevity the entry above describes.",
    "Its independent detection results are consistently strong, and its distinguishing assessment is usually not raw detection but the combination of protection and managed response sold at a price the mid-market can carry.",
  ],
};
