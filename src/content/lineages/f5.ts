// ============================================================================
// src/content/lineages/f5.ts
// ----------------------------------------------------------------------------
// F5 CORPORATE LINEAGE — verified founding facts, name changes, and the full
// acquisition history. This is the canonical data behind the F5 entry on the
// Vendor Lineages hub. Every figure here was cross-checked against primary
// sources (F5 SEC 10-K / 8-K filings on sec.gov) and reputable secondary
// sources (Wikipedia, Network World, GeekWire, company press releases), plus
// Rodolfo's own reference slide. Where a widely-cited figure differs from the
// SEC filing, the SEC number is used and the discrepancy noted in `sourceNote`.
//
// This is a factual corporate-history record rendered in original typographic
// styling; it reproduces no vendor logo, wordmark, or brand asset.
// ============================================================================

export interface Acquisition {
  /** Calendar year of the deal (announcement or close, per `dateNote`). */
  year: number;
  /** Acquired company name. */
  name: string;
  /** Price as a display string (e.g. "$670M", "undisclosed"). */
  price: string;
  /** What the company did / why it mattered. */
  what: string;
  /**
   * Optional "became" hook: the F5 product line this acquisition turned into.
   * Used to connect the corporate history to the BIG-IP modules taught today.
   */
  became?: string;
  /** Optional footnote for a figure discrepancy or date nuance. */
  sourceNote?: string;
}

export interface VendorLineage {
  key: string;
  /** Current company name. */
  name: string;
  /** One-line positioning of the company today. */
  tagline: string;
  founded: {
    year: number;
    dateText: string; // e.g. "February 26, 1996"
    place: string;
    asName: string; // the name at founding
    founder?: string;
  };
  /** Corporate name changes over time, oldest to newest. */
  names: { name: string; from: string; note?: string }[];
  /** First product / origin note. */
  origin: string;
  acquisitions: Acquisition[];
  /** "as of" honesty stamp for the acquisition list. */
  asOf: string;
  /** Primary sources, shown as a short provenance list. */
  sources: { label: string; url: string }[];
}

export const f5Lineage: VendorLineage = {
  key: "f5",
  name: "F5, Inc.",
  tagline:
    "From a single load balancer to an application delivery and security platform, largely assembled by acquisition.",
  founded: {
    year: 1996,
    dateText: "February 26, 1996",
    place: "Seattle, Washington",
    asName: "F5 Labs, Inc.",
    founder: "Jeff Hussey",
  },
  names: [
    { name: "F5 Labs, Inc.", from: "1996", note: "Incorporated in Seattle. The name references the F5 tornado on the Fujita scale." },
    { name: "F5 Networks, Inc.", from: "1999", note: "Renamed at its IPO filing; listed on NASDAQ as FFIV in June 1999." },
    { name: "F5, Inc.", from: "2021", note: "Dropped \"Networks\" to reflect the shift from hardware to software and security." },
  ],
  origin:
    "F5's first product was the BIG/IP Controller in 1997 - a hardware load balancer that spread traffic across servers to keep growing websites online. Nearly everything else in the portfolio arrived by acquisition.",
  acquisitions: [
    { year: 2003, name: "uRoam", price: "$25M", what: "SSL VPN remote access (the FirePass product line).", became: "Grew into BIG-IP APM - Access Policy Manager." },
    { year: 2004, name: "MagniFire Websystems", price: "$29M", what: "Web application firewall technology.", became: "Became BIG-IP ASM - the Advanced WAF taught today." },
    { year: 2005, name: "Swan Labs", price: "$43M", what: "WAN optimization and web acceleration." },
    { year: 2007, name: "Acopia Networks", price: "$210M", what: "Intelligent file virtualization (file-area networking).", became: "Folded into the BIG-IP LTM product line.", sourceNote: "SEC 10-K FY2007: $207.8M plus $2.2M costs, ~$210M total." },
    { year: 2011, name: "Crescendo Networks", price: "undisclosed", what: "Web application acceleration and optimization IP." },
    { year: 2012, name: "Traffix Systems", price: "$135M", what: "Diameter signaling for mobile carrier networks." },
    { year: 2013, name: "LineRate Systems", price: "~$125M", what: "Software-defined, x86-based load balancing with a Node.js datapath." },
    { year: 2013, name: "Versafe", price: "$91.7M", what: "Anti-fraud, anti-phishing and anti-malware for web and mobile.", sourceNote: "SEC 10-K FY2013: $91.7M (some sources cite ~$92M)." },
    { year: 2014, name: "Defense.NET", price: "$49.4M", what: "Cloud-based DDoS mitigation as a service.", sourceNote: "Widely reported at $49.4M." },
    { year: 2015, name: "Lyatiss / CloudWeaver", price: "undisclosed", what: "Application-defined networking for the cloud." },
    { year: 2019, name: "NGINX", price: "$670M", what: "The company behind the widely used open-source web and application server.", became: "NGINX Plus and the modern app-services portfolio." },
    { year: 2020, name: "Shape Security", price: "$1B", what: "AI-driven bot detection and online fraud prevention.", sourceNote: "Announced December 2019; closed January 2020." },
    { year: 2021, name: "Volterra", price: "$500M", what: "Edge and multi-cloud application services.", became: "The basis of F5 Distributed Cloud Services." },
    { year: 2021, name: "Threat Stack", price: "$68M", what: "Cloud security monitoring and compliance." },
    { year: 2023, name: "Lilac Cloud", price: "undisclosed", what: "Application services delivery." },
    { year: 2023, name: "Suborbital Software Systems", price: "undisclosed", what: "Cloud-native application platforms (WebAssembly)." },
    { year: 2024, name: "Wib Security", price: "undisclosed", what: "API security and application-development observability." },
    { year: 2024, name: "HeyHack", price: "undisclosed", what: "Security penetration-testing SaaS." },
    { year: 2025, name: "LeakSignal", price: "undisclosed", what: "Real-time data protection and governance for AI applications." },
    { year: 2025, name: "Fletch", price: "undisclosed", what: "Agentic SOC threat intelligence.", sourceNote: "Announced June 2025." },
    { year: 2025, name: "MantisNet", price: "undisclosed", what: "eBPF observability and real-time network intelligence.", sourceNote: "Announced August 2025." },
    { year: 2025, name: "CalypsoAI", price: "$180M", what: "Enterprise AI inference security - red teaming and guardrails.", became: "Integrated into the F5 Application Delivery and Security Platform (ADSP).", sourceNote: "Announced at $180M; SEC 10-K reports $145.2M cash at close (Sept 26, 2025)." },
    { year: 2025, name: "SurePath AI", price: "undisclosed", what: "Governance for generative-AI solutions." },
  ],
  asOf: "December 2025",
  sources: [
    { label: "F5 SEC filings (10-K / 8-K), sec.gov", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001048695&type=10-K" },
    { label: "F5, Inc. - Wikipedia", url: "https://en.wikipedia.org/wiki/F5,_Inc." },
    { label: "GeekWire - F5 drops \"Networks\" (2021)", url: "https://www.geekwire.com/2021/f5-refreshes-its-brand-by-dropping-the-networks-from-its-name-marking-huge-change-in-its-business/" },
  ],
};
