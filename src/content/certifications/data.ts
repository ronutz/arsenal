// ============================================================================
// src/content/certifications/data.ts
// ----------------------------------------------------------------------------
// CERTIFICATIONS & CREDENTIALS — compiled from Rodolfo Nützmann's records.
//
// STRUCTURE (per the brief): lead with what is CURRENT and unmistakable, the
// instructor authorizations and currently-valid certifications, then provide the
// full HISTORICAL record grouped by vendor for depth. Recognition (the F5 MVP
// award) sits between as its own thing.
//
// HONESTY / EVIDENCE: cert names, issuers, and years are stated as recorded in
// Rodolfo's CVs and the Red Education instructor bio. Most certifications across
// a 30-year career are historical or expired; that is shown plainly rather than
// blurred. Some acronym expansions for older vendor certs are kept minimal where
// the exact official title is uncertain, to avoid asserting a wrong name.
//
// F5 credentials carry CertMetrics verification (verifyId + candidateId) taken
// from Rodolfo's records, so visitors can verify them directly. Non-F5 partner
// accreditations (Tenable, CyberArk, Palo Alto, Corvil) are listed from his CVs;
// most have no public verification portal, so they appear without a verify link.
// ============================================================================

export interface CredentialEvidence {
  /** Path to a certificate PDF served from /public (e.g. "/certs/f5-ca.pdf"). */
  pdf?: string;
  /** A public Credly (or equivalent) badge URL. */
  credly?: string;
  /** The vendor's verification portal URL. */
  verifyUrl?: string;
  /** Verification code shown to the visitor (needed to verify on the portal). */
  verifyId?: string;
  /** Optional secondary identifier some portals require (e.g. F5 candidate ID). */
  candidateId?: string;
}

export interface Credential {
  /** The credential's name. */
  name: string;
  /** Issuing vendor/body. */
  issuer: string;
  /** Optional short detail: exam code, scope, etc. */
  detail?: string;
  /** Year earned, or validity range for current creds. */
  period?: string;
  /** Optional note. */
  note?: string;
  /**
   * Proof of the credential. Any subset may be present; the UI renders only
   * what exists, so credentials without evidence show nothing extra. Populated
   * incrementally as Rodolfo supplies the dataset (PDFs, Credly links, codes).
   */
  evidence?: CredentialEvidence;
}

export interface HistoricalGroup {
  /** Vendor name for this group. */
  vendor: string;
  /** Credentials under this vendor, newest-ish first. */
  items: Credential[];
}

// ----------------------------------------------------------------------------
// CURRENT — instructor authorizations. These are live: Rodolfo is actively
// authorized to deliver official training on all four platforms today.
// ----------------------------------------------------------------------------
export const instructorAuthorizations: Credential[] = [
  { name: "F5 Authorized Instructor", issuer: "F5" },
  { name: "Extreme Networks Certified Instructor", issuer: "Extreme Networks" },
  { name: "Fortinet Certified Trainer (FCT)", issuer: "Fortinet" },
  { name: "Netskope Certified Cloud Security Instructor", issuer: "Netskope" },
];

// ----------------------------------------------------------------------------
// CURRENT — certifications that are presently valid (with validity windows).
// ----------------------------------------------------------------------------
export const currentCertifications: Credential[] = [
  {
    name: "Netskope Architect Accreditation",
    issuer: "Netskope",
    period: "2026 – 2028",
  },
  {
    name: "Netskope Integrator Accreditation",
    issuer: "Netskope",
    period: "2025 – 2027",
  },
  {
    name: "Netskope Administrator Accreditation",
    issuer: "Netskope",
    period: "2024 – 2026",
  },
  {
    name: "Netskope Cloud Security Sales credentials",
    issuer: "Netskope",
    detail: "NCSSA · NCSSE",
  },
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
];

// ----------------------------------------------------------------------------
// HISTORICAL / EXPIRED — grouped by vendor, for depth. Spans the full career.
// ----------------------------------------------------------------------------
export const historical: HistoricalGroup[] = [
  {
    vendor: "F5",
    items: [
      {
        name: "F5 Certified Technology Specialist, BIG-IP APM",
        issuer: "F5",
        detail: "Access Policy Manager",
        period: "2022",
        evidence: {
          verifyUrl: "https://cp.certmetrics.com/f5certified/en/public/verify/credential",
          verifyId: "D6JQHXBK21V41YWQ",
          candidateId: "F50000042507",
        },
      },
      { name: "F5 Certified Technology Specialist, BIG-IP ASM", issuer: "F5", detail: "Application Security Manager (303)", period: "2020",
        evidence: {
          verifyUrl: "https://cp.certmetrics.com/f5certified/en/public/verify/credential",
          verifyId: "HQGHCERC1JF1Q632",
          candidateId: "F50000042507",
        },
      },
      { name: "F5 Certified Technology Specialist, BIG-IP DNS", issuer: "F5", detail: "302", period: "2018",
        evidence: {
          verifyUrl: "https://cp.certmetrics.com/f5certified/en/public/verify/credential",
          verifyId: "QDXKFZGCCFBEQ69Z",
          candidateId: "F50000042507",
        },
      },
      { name: "F5 Certified Technology Specialist, BIG-IP LTM", issuer: "F5", detail: "Local Traffic Manager (301)" },
      {
        name: "F5 Certified Administrator, BIG-IP",
        issuer: "F5",
        detail: "201",
        period: "2015",
        evidence: {
          verifyUrl: "https://cp.certmetrics.com/f5certified/en/public/verify/credential",
          verifyId: "VBMJFJG2CMEQ1W52",
          candidateId: "F50000042507",
        },
      },
      { name: "F5 Certified Solution Expert, Security", issuer: "F5", detail: "CSE Security" },
      { name: "F5 Certified Solution Expert, Cloud", issuer: "F5", detail: "CSE Cloud" },
      { name: "F5 Certified Technical Professional, Sales (CTP)", issuer: "F5", period: "2019",
        evidence: {
          verifyUrl: "https://cp.certmetrics.com/f5certified/en/public/verify/credential",
          verifyId: "3VRHHCEC1EQE1SWP",
          candidateId: "F50000042507",
        },
      },
      { name: "F5 sales accreditations", issuer: "F5", detail: "Sales, Technical Sales, Security", period: "2013 – 2019" },
    ],
  },
  {
    vendor: "Fortinet",
    items: [
      { name: "Fortinet NSE 4", issuer: "Fortinet", detail: "FortiGate", note: "Not currently recertified." },
    ],
  },
  {
    vendor: "Palo Alto Networks",
    items: [
      { name: "Palo Alto Networks Accredited Systems Engineer (PSE)", issuer: "Palo Alto Networks", detail: "Foundation · Platform Associate", period: "2020" },
      { name: "Palo Alto Certified Network Security Engineer", issuer: "Palo Alto Networks", detail: "CNSE 5.1", period: "2014" },
      { name: "Palo Alto Accredited Configuration Engineer (ACE)", issuer: "Palo Alto Networks", period: "2014" },
      { name: "Palo Alto Accredited Sales Expert (ASE)", issuer: "Palo Alto Networks", period: "2014" },
    ],
  },
  {
    vendor: "Tenable",
    items: [
      { name: "Tenable.io Certified Pre-Sales Engineer, Integrator, Architect", issuer: "Tenable", period: "2020" },
      { name: "Tenable.sc Certified Pre-Sales Engineer, Integrator, Architect", issuer: "Tenable", period: "2020" },
      { name: "Tenable Certified Sales Associate (TCSA)", issuer: "Tenable", period: "2020" },
    ],
  },
  {
    vendor: "CyberArk",
    items: [
      { name: "CyberArk Certified Pre-Sales Engineer (CPE)", issuer: "CyberArk", period: "2020" },
      { name: "CyberArk Certified Sales Professional (CSP)", issuer: "CyberArk", period: "2020" },
      { name: "CyberArk Certified Trustee", issuer: "CyberArk", period: "2020" },
    ],
  },
  {
    vendor: "Corvil",
    items: [
      { name: "Corvil Certified Administrator (CCA)", issuer: "Corvil", detail: "Credential ID E-E1LNZV", period: "2020" },
    ],
  },
  {
    vendor: "Cisco",
    items: [
      { name: "Cisco Certified Network Associate (CCNA)", issuer: "Cisco", period: "2000, renewed 2005" },
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

/** Total count of distinct credentials listed (for a headline figure). */
export const CREDENTIAL_COUNT =
  instructorAuthorizations.length +
  currentCertifications.length +
  historical.reduce((n, g) => n + g.items.length, 0);
