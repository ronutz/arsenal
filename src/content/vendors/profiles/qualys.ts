// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-04 against Qualys' own 8-K
// (2025 Gartner Magic Quadrant Leader in Exposure Assessment Platforms; IDC
// MarketScape leader for Worldwide Exposure Management 2025; two Pwnie Awards
// to the Threat Research Unit) and 2026 pricing surveys (VMDR quoted around
// $199 per asset per year).
//
// THE BODY ALREADY ARGUES the delivered-as-a-service decision, the fifth
// appearance of the neutrality-and-aggregation pattern, the trio comparison,
// and Philippe Courtot's career and non-commercial work. This adds structure.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const qualysProfile: VendorProfile = {
  slug: "qualys",
  foundings: [
    {
      company: "Qualys",
      year: 1999,
      place: "Delaware, incorporated; California, operating",
      founders: ["Philippe Langlois", "Gilles Samoun"],
      story:
        "Incorporated at the end of December 1999 with Langlois as chief technology officer and Samoun as chief executive. QualysGuard followed in 2000, and the distinguishing decision was delivery rather than detection: the scanner was a service you subscribed to, at a time when security software arrived on a disc and lived in your rack.",
    },
  ],
  timeline: [
    { year: 1999, title: "Incorporated", detail: "In Delaware, in the last days of the year." },
    { year: 2000, title: "QualysGuard", detail: "Vulnerability scanning delivered from the vendor's infrastructure - software as a service before the term was in general use, and years before anybody would buy security that way without argument." },
    { year: 2008, title: "The Cloud Security Alliance", detail: "Philippe Courtot, chief executive from 2001, was among its founders - part of a pattern of work with no direct commercial return attached." },
    { year: 2012, title: "NASDAQ listing", detail: "Listed as QLYS." },
    { year: 2025, title: "Scale", detail: "Revenue of $669M with around 2,625 staff, and recognition as a leader in both Gartner's exposure assessment quadrant and IDC's exposure management assessment." },
  ],
  products: [
    { name: "VMDR", what: "Vulnerability Management, Detection and Response: scanning, prioritisation and patch deployment in one platform behind a single agent - the consolidation argument made concrete." },
    { name: "Qualys Cloud Agent", what: "A lightweight agent reporting continuously, which changes assessment from something scheduled into something ambient." },
    { name: "TruRisk", what: "The prioritisation layer, scoring findings by exploitability and asset importance rather than by severity alone." },
    { name: "TotalCloud", what: "Cloud posture and workload coverage, and the fastest-growing part of the portfolio by practitioner mindshare." },
    { name: "Policy Compliance", what: "The deepest compliance reporting in the category by most accounts - PCI, HIPAA and the rest - which is why the platform is often bought by organisations whose driver is audit rather than risk." },
  ],
  innovations: [
    { title: "Security as a subscription, in 2000", detail: "Persuading organisations to let scan data leave their premises took years of argument, and the argument is now so settled that the difficulty is hard to remember. Everything in the category is delivered this way today." },
    { title: "Patching inside the scanner", detail: "Finding a vulnerability and fixing it had historically been separate products bought by separate teams. Putting deployment in the same platform addresses the actual failure, which is not discovery but the gap between discovery and remediation." },
    { title: "Aggregate visibility as a defensive asset", detail: "One vendor scanning many estates sees which vulnerabilities are being exploited in the field before any single customer would. The install base improves the product for everyone in it." },
    { title: "Research published rather than held", detail: "The Threat Research Unit's work has been recognised by the field's own awards, including for remote code execution research - the kind of output that has no direct revenue attached and builds the credibility that does." },
  ],
  markets: [
    "Enterprise and heavily regulated sectors, with compliance depth as a distinguishing reason to buy. Priced per asset, quoted around two hundred dollars per asset per year before negotiation.",
    "It competes with Tenable and Rapid7, both here, and with cloud-native posture vendors on the TotalCloud front.",
  ],
  analyst: [
    "A 2025 Gartner Magic Quadrant Leader for exposure assessment platforms and a leader in IDC's exposure management assessment, with its cloud and vulnerability products separately recognised in industry awards.",
    "As with its two competitors, the reposition toward exposure management is incomplete across the whole category, and buyers still decide on scan coverage and risk scoring rather than on the platform layer above them.",
  ],
};
