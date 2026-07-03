// ============================================================================
// src/content/certifications/data.ts
// ----------------------------------------------------------------------------
// CERTIFICATIONS & CREDENTIALS — the full, enumerated record, reconciled against
// Rodolfo Nützmann's certificate PDFs and his public Credly badge wallet.
//
// CURRENCY: a credential is CURRENT when its badge/certificate shows a future
// "valid until" date, otherwise HISTORICAL. The F5 stack verifies current on
// Credly (renewed through 2027–2028). Every Credly badge is listed individually
// here rather than summarized.
//
// EVIDENCE: where a certificate PDF exists it is hosted at /certs/<slug>.pdf and
// linked (opens in a new tab) so viewers and crawlers can read the actual
// document. F5 credentials also carry CertMetrics verify codes. The umbrella
// Credly wallet is linked once from the page via CREDLY_PROFILE.
// ============================================================================

export interface CredentialEvidence {
  /** Certificate PDF served from /public (e.g. "/certs/f5-ca.pdf"). */
  pdf?: string;
  /** A public Credly (or equivalent) badge URL. */
  credly?: string;
  /** The vendor's verification portal URL. */
  verifyUrl?: string;
  /** Verification code shown to the visitor. */
  verifyId?: string;
  /** Secondary identifier some portals require (e.g. F5 candidate ID). */
  candidateId?: string;
}

export interface Credential {
  name: string;
  issuer: string;
  detail?: string;
  /** Year earned, or validity range for current creds. */
  period?: string;
  note?: string;
  evidence?: CredentialEvidence;
}

export interface HistoricalGroup {
  vendor: string;
  /** Optional vendor-level context (e.g. a program transition note). */
  note?: string;
  items: Credential[];
}

/** Rodolfo's public Credly wallet — the umbrella verification for every badge. */
export const CREDLY_PROFILE = "https://www.credly.com/users/rodolfo-nutzmann/badges";

const F5_VERIFY = "https://cp.certmetrics.com/f5certified/en/public/verify/credential";
const F5_CANDIDATE = "F50000042507";
const P = (slug: string) => `/certs/${slug}.pdf`;

// ----------------------------------------------------------------------------
// CURRENT — instructor authorizations.
// ----------------------------------------------------------------------------
export const instructorAuthorizations: Credential[] = [
  { name: "F5 Authorized Instructor", issuer: "F5" },
  { name: "Fortinet Certified Trainer (FCT)", issuer: "Fortinet", detail: "Cybersecurity", period: "to 2027", evidence: { pdf: P("fortinet-fct") } },
  { name: "Extreme Networks Certified Instructor", issuer: "Extreme Networks", period: "2024" },
  { name: "Netskope Certified Cloud Security Instructor", issuer: "Netskope" },
];

// ----------------------------------------------------------------------------
// CURRENT — certifications presently valid.
// ----------------------------------------------------------------------------
export const currentCertifications: Credential[] = [
  { name: "F5 Certified Solution Expert, Security", issuer: "F5", detail: "F5-CSE Security", period: "2022 – 2028", evidence: { pdf: P("f5-cse-security") } },
  { name: "F5 Certified Solution Expert, Cloud", issuer: "F5", detail: "F5-CSE Cloud", period: "2021 – 2027", evidence: { pdf: P("f5-cse-cloud") } },
  { name: "F5 Certified Technology Specialist, BIG-IP APM", issuer: "F5", detail: "Access Policy Manager", period: "2022 – 2028", evidence: { pdf: P("f5-cts-apm"), verifyUrl: F5_VERIFY, verifyId: "D6JQHXBK21V41YWQ", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Technology Specialist, BIG-IP ASM", issuer: "F5", detail: "Application Security Manager", period: "2020 – 2028", evidence: { pdf: P("f5-cts-asm"), verifyUrl: F5_VERIFY, verifyId: "HQGHCERC1JF1Q632", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Technology Specialist, BIG-IP DNS", issuer: "F5", detail: "DNS", period: "2017 – 2027", evidence: { pdf: P("f5-cts-dns"), verifyUrl: F5_VERIFY, verifyId: "QDXKFZGCCFBEQ69Z", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Technology Specialist, BIG-IP LTM", issuer: "F5", detail: "Local Traffic Manager", period: "2021 – 2028", evidence: { pdf: P("f5-cts-ltm") } },
  { name: "F5 Certified Administrator, BIG-IP", issuer: "F5", detail: "F5-CA", period: "2015 – 2028", evidence: { pdf: P("f5-ca"), verifyUrl: F5_VERIFY, verifyId: "VBMJFJG2CMEQ1W52", candidateId: F5_CANDIDATE } },

  { name: "Fortinet Certified Professional, Network Security", issuer: "Fortinet", detail: "FCP-NS", period: "2024 – 2026", evidence: { pdf: P("fortinet-fcp-ns") } },
  { name: "Fortinet Certified Associate, Cybersecurity", issuer: "Fortinet", detail: "FCA", period: "2024 – 2026", evidence: { pdf: P("fortinet-fca") } },
  { name: "Fortinet Certified Fundamentals, Cybersecurity", issuer: "Fortinet", detail: "FCF", period: "2024 – 2026", evidence: { pdf: P("fortinet-fcf") } },

  { name: "Extreme Certified Professional, Switching", issuer: "Extreme Networks", detail: "ECP", period: "2023 – 2026", evidence: { pdf: P("extreme-ecp-switching") } },
  { name: "Extreme Certified Associate, Switching", issuer: "Extreme Networks", period: "2023", note: "No expiry", evidence: { pdf: P("extreme-eca-switching") } },

  { name: "Netskope Cloud Security Architect", issuer: "Netskope", detail: "NCSA", period: "2026 – 2028", evidence: { pdf: P("netskope-architect"), verifyUrl: "https://verify.skilljar.com/c/zbvsjdg4a2a2", verifyId: "zbvsjdg4a2a2" } },
  { name: "Netskope Cloud Security Integrator", issuer: "Netskope", detail: "NCSI", period: "2025 – 2027", evidence: { pdf: P("netskope-integrator") } },
  { name: "Netskope Cloud Security Administrator", issuer: "Netskope", detail: "NCSA-dm", period: "2024 – 2026", evidence: { pdf: P("netskope-administrator") } },
  { name: "Netskope Cloud Security Sales credentials", issuer: "Netskope", detail: "NCSSA · NCSSE" },
];

// ----------------------------------------------------------------------------
// RECOGNITION — awards (distinct from certifications).
// ----------------------------------------------------------------------------
export const recognition: Credential[] = [
  {
    name: "F5 DevCentral MVP",
    issuer: "F5",
    period: "2022 · 2023 · 2024",
    note: "Awarded three consecutive years for community contribution and technical expertise.",
  },
  {
    name: "The Captain's Call Award",
    issuer: "Red Education",
    period: "2025",
    note: "Red Education recognition for continuous, high-level support of the business, as observed by the Managing Director.",
  },
];

// ----------------------------------------------------------------------------
// HISTORICAL / EXPIRED — every badge, grouped by vendor.
// ----------------------------------------------------------------------------
export const historical: HistoricalGroup[] = [
  {
    vendor: "F5",
    items: [
      { name: "F5 Certified Technical Professional, Sales (F5-CTP)", issuer: "F5", period: "2019", note: "Expired 2025.", evidence: { pdf: P("f5-ctp-sales") } },
      { name: "F5 Partner Presales Accreditation, Technical Associate", issuer: "F5", period: "to 2025" },
      { name: "F5 Partner Presales Accreditation, Sales Associate", issuer: "F5", period: "to 2025" },
      { name: "F5 Sales Accreditation, Sales Roles", issuer: "F5", period: "2020", evidence: { pdf: P("f5-sales-roles") } },
      { name: "F5 Sales Accreditation, Technical Roles", issuer: "F5", period: "2020", evidence: { pdf: P("f5-technical-roles") } },
      { name: "F5 Technical Sales Accreditation", issuer: "F5", period: "2019", evidence: { pdf: P("f5-technical-sales") } },
      { name: "F5 Security Sales Accreditation", issuer: "F5", period: "2019", evidence: { pdf: P("f5-security-sales") } },
      { name: "F5 Security Pre-Sales Accreditation", issuer: "F5", period: "2019", evidence: { pdf: P("f5-security-presales") } },
      { name: "F5 Accredited Sales Professional", issuer: "F5", period: "2013", evidence: { pdf: P("f5-sales-accreditation") } },
    ],
  },
  {
    vendor: "Fortinet",
    note: "Effective 15 July 2026, Fortinet retires the FCF / FCA / FCP / FCSS / FCX names and restores an eight-level NSE 1–8 progression across four tracks (Secure Networking, Security Operations, Cloud Security, SASE). On that date these map forward: FCF becomes NSE 1 and NSE 2, FCA becomes NSE 3, and the FortiGate / FortiOS exam behind FCP becomes NSE 4, with further NSE 5–7 levels assigned from the exam history below. The named certifications remain on record.",
    items: [
      { name: "Fortinet Certified Professional, Security Operations", issuer: "Fortinet", detail: "FCP-SO", period: "2024", note: "Expired 2026.", evidence: { pdf: P("fortinet-fcp-so") } },
      { name: "Fortinet FortiGate 7.4 Administrator", issuer: "Fortinet", period: "2024" },
      { name: "Fortinet FortiGate 7.2 Administrator", issuer: "Fortinet", period: "2023" },
      { name: "Fortinet FortiGate 7.4 Operator", issuer: "Fortinet", period: "2023" },
      { name: "Fortinet FortiAnalyzer 7.4 Analyst", issuer: "Fortinet", period: "2024" },
      { name: "Fortinet FortiAnalyzer 7.4 Administrator", issuer: "Fortinet", period: "2024" },
      { name: "Fortinet FortiManager 7.2 Administrator", issuer: "Fortinet", period: "2024" },
      { name: "Fortinet FortiAuthenticator 6.5 Administrator", issuer: "Fortinet", period: "2024" },
      { name: "NSE Trainer Assessment, Professional Level 7.4", issuer: "Fortinet", period: "2025" },
      { name: "Fortinet NSE 4", issuer: "Fortinet", detail: "FortiGate", period: "2022", evidence: { pdf: P("fortinet-nse4") } },
      { name: "Fortinet NSE 3", issuer: "Fortinet", period: "2022", evidence: { pdf: P("fortinet-nse3") } },
      { name: "Fortinet NSE 2", issuer: "Fortinet", period: "2022", evidence: { pdf: P("fortinet-nse2") } },
      { name: "Fortinet NSE 1", issuer: "Fortinet", period: "2022", evidence: { pdf: P("fortinet-nse1") } },
      { name: "Getting Started in Cybersecurity 1.0", issuer: "Fortinet", period: "2022" },
      { name: "Introduction to the Threat Landscape 1.0", issuer: "Fortinet", period: "2022" },
    ],
  },
  {
    vendor: "Extreme Networks",
    items: [
      { name: "ExtremeCloud IQ – API and Automation", issuer: "Extreme Networks", period: "2024" },
      { name: "Cisco to Extreme Networks Conversion: Switching", issuer: "Extreme Networks", period: "2024" },
      { name: "ExtremeCloud Edge, Installation and Configuration", issuer: "Extreme Networks", period: "2024" },
      { name: "ExtremeCloud SD-WAN, Troubleshooting", issuer: "Extreme Networks", period: "2024" },
      { name: "ExtremeCloud SD-WAN, Advanced Configuration", issuer: "Extreme Networks", period: "2024" },
      { name: "ExtremeCloud SD-WAN, Management", issuer: "Extreme Networks", period: "2024" },
      { name: "ExtremeCloud SD-WAN, Installation and Configuration", issuer: "Extreme Networks", period: "2024" },
      { name: "Extreme Certified Associate, ExtremeCloud SD-WAN", issuer: "Extreme Networks", period: "2024" },
      { name: "Extreme Certified Associate, Solutions Design", issuer: "Extreme Networks", period: "2023" },
      { name: "Extreme Certified Associate, Solutions Selling", issuer: "Extreme Networks", period: "2023" },
      { name: "Extreme Certified Associate, Network Security Basics", issuer: "Extreme Networks", period: "2024" },
      { name: "ExtremeCloud IQ, Site Engine Installation and Configuration", issuer: "Extreme Networks", period: "2022" },
      { name: "ExtremeWireless Cloud, Installation and Configuration", issuer: "Extreme Networks", period: "2022" },
      { name: "Extreme Certified Design Professional (ECDP)", issuer: "Extreme Networks", period: "2014", evidence: { pdf: P("extreme-ecdp-2014") } },
      { name: "Extreme Certified Sales Professional (ECSP)", issuer: "Extreme Networks", period: "2014", evidence: { pdf: P("extreme-ecsp-2014") } },
    ],
  },
  {
    vendor: "Palo Alto Networks",
    items: [
      { name: "Palo Alto Networks Certified Network Security Administrator (PCNSA)", issuer: "Palo Alto Networks", period: "2021", note: "Expired 2023." },
      { name: "Palo Alto Networks Systems Engineer, Foundation (PSE)", issuer: "Palo Alto Networks", period: "2020", note: "Expired 2022." },
      { name: "Palo Alto Accredited Configuration Engineer (ACE) 6.0", issuer: "Palo Alto Networks", period: "2018", evidence: { pdf: P("palo-alto-ace6") } },
      { name: "Palo Alto Accredited Configuration Engineer (ACE) 5.0", issuer: "Palo Alto Networks", period: "2014", evidence: { pdf: P("palo-alto-ace5") } },
      { name: "Palo Alto Accredited Configuration Engineer (ACE) 5, Partner", issuer: "Palo Alto Networks", period: "2014", evidence: { pdf: P("palo-alto-ace5-partner") } },
      { name: "Palo Alto Accredited Sales Expert (ASE) 5.0", issuer: "Palo Alto Networks", period: "2014", evidence: { pdf: P("palo-alto-ase5") } },
      { name: "Palo Alto Networks certification, v5.1", issuer: "Palo Alto Networks", period: "2014", evidence: { pdf: P("palo-alto-2014") } },
    ],
  },
  {
    vendor: "Tenable",
    items: [
      { name: "Tenable Certified Sales Associate (TCSA)", issuer: "Tenable", period: "2020", evidence: { pdf: P("tenable-sales-associate") } },
      { name: "Tenable.io Certified Pre-Sales Engineer", issuer: "Tenable", period: "2020", evidence: { pdf: P("tenable-presales-engineer-io") } },
      { name: "Tenable.io Certified Pre-Sales Integrator", issuer: "Tenable", period: "2020", evidence: { pdf: P("tenable-presales-integrator-io") } },
      { name: "Tenable.io Certified Pre-Sales Architect", issuer: "Tenable", period: "2020", evidence: { pdf: P("tenable-presales-architecture-io") } },
      { name: "Tenable.sc Certified Pre-Sales Engineer", issuer: "Tenable", period: "2020", evidence: { pdf: P("tenable-presales-engineer-sc") } },
      { name: "Tenable.sc Certified Pre-Sales Integrator", issuer: "Tenable", period: "2020", evidence: { pdf: P("tenable-presales-integrator-sc") } },
      { name: "Tenable.sc Certified Pre-Sales Architect", issuer: "Tenable", period: "2020", evidence: { pdf: P("tenable-presales-architecture-sc") } },
    ],
  },
  {
    vendor: "CyberArk",
    items: [
      { name: "CyberArk Certified Pre-Sales Engineer (CPE)", issuer: "CyberArk", period: "2020", note: "Expired 2022.", evidence: { pdf: P("cyberark-cpe") } },
      { name: "CyberArk Certified Sales Professional (CSP)", issuer: "CyberArk", period: "2020", note: "Expired 2022.", evidence: { pdf: P("cyberark-csp") } },
      { name: "CyberArk Certified Trustee", issuer: "CyberArk", period: "2020", evidence: { pdf: P("cyberark-trustee") } },
    ],
  },
  {
    vendor: "Corvil",
    items: [
      { name: "Corvil Certified Administrator (CCA)", issuer: "Corvil", detail: "Credential ID E-E1LNZV", period: "2020" },
    ],
  },
  {
    vendor: "Polycom",
    items: [
      { name: "Polycom Qualified Representative", issuer: "Polycom", detail: "Video Endpoints: Sales Track (RPEOS100)", period: "2014 – 2016", evidence: { pdf: P("polycom-rpeos100") } },
    ],
  },
  {
    vendor: "Cisco",
    items: [
      { name: "Cisco Certified Network Associate (CCNA)", issuer: "Cisco", detail: "Routing & Switching", period: "2000 – 2008", evidence: { pdf: P("cisco-ccna") } },
      { name: "Cisco CIT", issuer: "Cisco", detail: "Internetwork Troubleshooting", period: "2003" },
    ],
  },
  {
    vendor: "Juniper Networks",
    items: [
      { name: "Juniper JNSS", issuer: "Juniper Networks", period: "2010" },
      { name: "Juniper JNSA", issuer: "Juniper Networks", period: "2010" },
    ],
  },
  {
    vendor: "Enterasys Networks",
    items: [
      { name: "Enterasys ESE", issuer: "Enterasys Networks", period: "2007" },
      { name: "Enterasys ECIE", issuer: "Enterasys Networks", period: "2007" },
    ],
  },
  {
    vendor: "Riverstone Networks",
    items: [
      { name: "Riverstone Certified Network Professional (RCNP)", issuer: "Riverstone Networks", period: "2001" },
    ],
  },
  {
    vendor: "Cabletron Systems",
    items: [
      { name: "Cabletron CSE", issuer: "Cabletron Systems", period: "1999" },
    ],
  },
];

/** Total distinct credentials listed (for a headline figure). */
export const CREDENTIAL_COUNT =
  instructorAuthorizations.length +
  currentCertifications.length +
  historical.reduce((n, g) => n + g.items.length, 0);
