// ============================================================================
// src/content/certifications/data.ts
// ----------------------------------------------------------------------------
// CERTIFICATIONS & CREDENTIALS — the full, enumerated record, reconciled against
// Rodolfo Nützmann's certificate PDFs and his public Credly badge wallet.
//
// CURRENCY: a credential is CURRENT when its badge/certificate shows a future
// "valid until" date (or is recent with no expiry), otherwise HISTORICAL. The
// F5 stack verifies current on Credly (renewed through 2027–2028).
//
// EVIDENCE (2026-07-14 enrichment pass, PRIME-supplied sources):
//   - Every Credly badge in Rodolfo's wallet is now linked on its own entry
//     via evidence.credly (43 badges identified live against credly.com,
//     name + issuer + issue date read from each badge page / OBI assertion).
//   - Where a certificate PDF exists it is hosted at /certs/<slug>.pdf and
//     linked (opens in a new tab). Netskope PDFs refreshed 2026-07-14 with the
//     verification-link versions; six new Netskope certificates added.
//   - F5 credentials carry CertMetrics verify codes + the shared candidate ID.
//   - The umbrella Credly wallet is linked once from the page via
//     CREDLY_PROFILE.
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
  /** Additional public evidence links (e.g. the yearly MVP announcements). */
  links?: readonly { label: string; url: string }[];
}

export interface Credential {
  name: string;
  issuer: string;
  detail?: string;
  /** Year earned, or validity range for current creds. */
  period?: string;
  note?: string;
  evidence?: CredentialEvidence;
  /** Optional era label; when set on historical items, the vendor group renders
   *  a sub-heading separating eras (used for Fortinet: legacy NSE / FCP & FCSS /
   *  current program). Items without an era render before any era-tagged ones. */
  era?: string;
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
/** Public Credly badge URL from its UUID. */
const C = (id: string) => `https://www.credly.com/badges/${id}`;
/** Netskope Academy (Skilljar) certificate verification URL from its code. */
const NS = (code: string) => `https://verify.skilljar.com/c/${code}`;

// ----------------------------------------------------------------------------
// CURRENT — instructor authorizations.
// ----------------------------------------------------------------------------
export const instructorAuthorizations: Credential[] = [
  { name: "F5 Authorized Instructor", issuer: "F5" },
  { name: "Fortinet Certified Trainer (FCT)", issuer: "Fortinet", detail: "Cybersecurity", period: "2025 – 2027", evidence: { pdf: P("fortinet-fct"), credly: C("a3bf6c7b-d24c-476c-8914-d948164dd099"), verifyId: "6629361496RN" } },
  { name: "Extreme Networks Certified Instructor", issuer: "Extreme Networks", period: "2024", evidence: { credly: C("ece5310e-8cb8-4c20-9121-1f4c97db441a") } },
  { name: "Netskope Certified Cloud Security Instructor", issuer: "Netskope" },
  { name: "Netskope Trainer Accreditation, Administrator License", issuer: "Netskope", period: "2026 – 2027", evidence: { pdf: P("netskope-trainer-administrator"), verifyUrl: NS("vievw5ko46i2"), verifyId: "vievw5ko46i2" } },
];

// ----------------------------------------------------------------------------
// CURRENT — certifications presently valid.
// ----------------------------------------------------------------------------
export const currentCertifications: Credential[] = [
  { name: "F5 Certified Solution Expert, Security", issuer: "F5", detail: "F5-CSE Security", period: "2022 – 2028", evidence: { pdf: P("f5-cse-security"), credly: C("34f1810f-1bd6-46cb-bde8-4667c726f5d9"), verifyUrl: F5_VERIFY, verifyId: "R276CCDKCFBE149Q", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Solution Expert, Cloud", issuer: "F5", detail: "F5-CSE Cloud", period: "2021 – 2027", evidence: { pdf: P("f5-cse-cloud"), credly: C("39b5961c-6b76-4daf-aef6-1c6baf6fc346"), verifyUrl: F5_VERIFY, verifyId: "V9K7HRV222E1Q1WY", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Technology Specialist, BIG-IP APM", issuer: "F5", detail: "Access Policy Manager", period: "2022 – 2028", evidence: { pdf: P("f5-cts-apm"), credly: C("fcaabac6-8961-4051-8d38-db51004e77ac"), verifyUrl: F5_VERIFY, verifyId: "D6JQHXBK21V41YWQ", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Technology Specialist, BIG-IP ASM", issuer: "F5", detail: "Application Security Manager - Advanced WAF - Web Application Firewall", period: "2020 – 2028", evidence: { pdf: P("f5-cts-asm"), credly: C("feb68de0-b61c-4174-965d-fc5886d21374"), verifyUrl: F5_VERIFY, verifyId: "HQGHCERC1JF1Q632", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Technology Specialist, BIG-IP DNS", issuer: "F5", detail: "GTM - Global Traffic Manager", period: "2017 – 2027", evidence: { pdf: P("f5-cts-dns"), credly: C("8a429d74-1366-4c5b-ba1c-25c3247b7418"), verifyUrl: F5_VERIFY, verifyId: "QDXKFZGCCFBEQ69Z", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Technology Specialist, BIG-IP LTM", issuer: "F5", detail: "Local Traffic Manager", period: "2021 – 2028", evidence: { pdf: P("f5-cts-ltm"), credly: C("819ad102-2b89-422e-88b4-bf4533a3a570"), verifyUrl: F5_VERIFY, verifyId: "C1LZHFD11NEEQDWG", candidateId: F5_CANDIDATE } },
  { name: "F5 Certified Administrator, BIG-IP", issuer: "F5", detail: "F5-CA", period: "2015 – 2028", evidence: { pdf: P("f5-ca"), credly: C("be660e5c-ddc8-4eef-b1da-2a0120df8f7f"), verifyUrl: F5_VERIFY, verifyId: "VBMJFJG2CMEQ1W52", candidateId: F5_CANDIDATE } },

  { name: "Fortinet Certified Professional, Network Security", issuer: "Fortinet", detail: "FCP-NS", period: "2024 – 2026", evidence: { pdf: P("fortinet-fcp-ns"), credly: C("0c227058-ebc9-488f-8362-566ffaf994cd"), verifyId: "2809799995RN" } },
  { name: "Fortinet Certified Associate, Cybersecurity", issuer: "Fortinet", detail: "FCA", period: "2023 – 2026", evidence: { pdf: P("fortinet-fca"), credly: C("ae612b30-cdfc-4925-a417-b066558f01fe"), verifyId: "6096026203RN" } },
  { name: "Fortinet Certified Fundamentals, Cybersecurity", issuer: "Fortinet", detail: "FCF", period: "2022 – 2026", evidence: { pdf: P("fortinet-fcf"), credly: C("4eb15e06-d410-4e3d-83ec-f23870ded229"), verifyId: "3646199477RN" } },

  { name: "Extreme Certified Professional, Switching", issuer: "Extreme Networks", detail: "ECP", period: "2023 – 2026", evidence: { pdf: P("extreme-ecp-switching"), credly: C("18336611-82e7-4188-9bd5-df5452fd958e") } },
  { name: "Extreme Networks Certified Administrator, Extreme Switching", issuer: "Extreme Networks", period: "2026", note: "No expiry.", evidence: { credly: C("a840f6fd-97a7-42f4-a647-25db7b54f9d7") } },
  { name: "Extreme Certified Associate, Switching", issuer: "Extreme Networks", period: "2023", note: "No expiry", evidence: { pdf: P("extreme-eca-switching") } },

  { name: "PingFederate Practitioner", issuer: "Ping Identity", detail: "Ping Identity Training", period: "2025", note: "No expiry.", evidence: { credly: C("ff49271b-b244-46b7-a6ca-88c670d1819f") } },

  { name: "Netskope Cloud Security Architect", issuer: "Netskope", detail: "NCSA", period: "2026 – 2028", evidence: { pdf: P("netskope-architect"), verifyUrl: NS("zbvsjdg4a2a2"), verifyId: "zbvsjdg4a2a2" } },
  { name: "Netskope Cloud Security Integrator", issuer: "Netskope", detail: "NCSI", period: "2025 – 2027", evidence: { pdf: P("netskope-integrator"), verifyUrl: NS("6x8vd5gzhv68"), verifyId: "6x8vd5gzhv68" } },
  { name: "Netskope Cloud Security Administrator", issuer: "Netskope", detail: "NCSA-dm", period: "2024 – 2026", evidence: { pdf: P("netskope-administrator"), verifyUrl: NS("ptghiibmnj4b"), verifyId: "ptghiibmnj4b" } },
  { name: "Netskope Core Sales Accreditation", issuer: "Netskope", period: "2026 – 2028", evidence: { pdf: P("netskope-core-sales"), verifyUrl: NS("c4n692op3rc9"), verifyId: "c4n692op3rc9" } },
  { name: "Netskope Cloud Security Sales Associate", issuer: "Netskope", detail: "NCSSA", period: "2024 – 2026", evidence: { pdf: P("netskope-ncssa"), verifyId: "235079551" } },
  { name: "Netskope Cloud Security Sales Executive", issuer: "Netskope", detail: "NCSSE", period: "2024 – 2026", evidence: { pdf: P("netskope-ncsse"), verifyId: "236671554" } },

  // Netskope Academy course completions (dated, verifiable certificates —
  // listed as completions, distinct from the accreditations above).
  { name: "Netskope Security Cloud Implementation and Integration, Hands-On Lab", issuer: "Netskope", detail: "Instructor-led course", period: "2024 – 2026", note: "Course completion, score 100%.", evidence: { pdf: P("netskope-ii-hands-on-lab"), verifyUrl: NS("edvct8dpkicr"), verifyId: "edvct8dpkicr" } },
  { name: "Netskope Security Cloud Operation and Administration", issuer: "Netskope", detail: "Self-paced course", period: "2026 – 2028", note: "Course completion.", evidence: { pdf: P("netskope-oa-self-paced"), verifyUrl: NS("ujpn8j8idpwx"), verifyId: "ujpn8j8idpwx" } },
  { name: "Netskope Security Cloud Implementation and Integration", issuer: "Netskope", detail: "Self-paced course", period: "2026 – 2028", note: "Course completion.", evidence: { pdf: P("netskope-ii-self-paced"), verifyUrl: NS("st6i8pzryrcf"), verifyId: "st6i8pzryrcf" } },
  { name: "Netskope Security Cloud Activation and Adoption", issuer: "Netskope", detail: "Self-paced course", period: "2026 – 2028", note: "Course completion.", evidence: { pdf: P("netskope-activation-adoption"), verifyUrl: NS("r5rtv2yz7t5g"), verifyId: "r5rtv2yz7t5g" } },
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
    // Official announcements on community.f5.com; his presence in each year's
    // list live-verified 2026-07-14 (2024 + 2023 rosters name Rodolfo_Nützmann;
    // for 2022, F5's own Featured Member article states "2022 MVP Rodolfo
    // Nützmann"). Canonical /kb/ URLs.
    evidence: {
      links: [
        { label: "2022", url: "https://community.f5.com/kb/technicalarticles/2022-devcentral-mvp-announcement/286788" },
        { label: "2023", url: "https://community.f5.com/kb/devcentralnews/2023-devcentral-mvp-announcement/307243" },
        { label: "2024", url: "https://community.f5.com/kb/devcentralnews/2024-devcentral-mvp-announcement/326017" },
      ],
    },
  },
  {
    name: "The Captain's Call Award",
    issuer: "Red Education",
    period: "2025",
    note: "Red Education recognition for continuous, high-level support of the business, as observed by the Managing Director.",
    evidence: { credly: C("586e7704-fe3d-4c03-b164-20f221c4f453") },
  },
];

// ----------------------------------------------------------------------------
// HISTORICAL / EXPIRED — every badge, grouped by vendor.
// ----------------------------------------------------------------------------
export const historical: HistoricalGroup[] = [
  {
    vendor: "F5",
    items: [
      { name: "F5 Certified Technical Professional, Sales (F5-CTP)", issuer: "F5", period: "2019 – 2025", evidence: { pdf: P("f5-ctp-sales"), credly: C("7ba0b660-d06a-42fc-82df-65d8a3629c78") } },
      { name: "F5 Partner Presales Accreditation, Technical Associate", issuer: "F5", period: "to 2025", evidence: { credly: C("3b86544e-ccd2-4477-8e6a-d86d564bc5a8") } },
      { name: "F5 Partner Presales Accreditation, Sales Associate", issuer: "F5", period: "to 2025", evidence: { credly: C("85123d93-c848-44fe-9808-9b09b14cc94b") } },
      { name: "NGINX and OpenShift", issuer: "F5", period: "2022", evidence: { credly: C("a9c60b19-ba9c-4940-8c3a-bd7128c406e6") } },
      { name: "F5 Sales Accreditation, Sales Roles", issuer: "F5", period: "2020 – 2024", evidence: { pdf: P("f5-sales-roles") } },
      { name: "F5 Sales Accreditation, Technical Roles", issuer: "F5", period: "2020 – 2024", evidence: { pdf: P("f5-technical-roles") } },
      { name: "F5 Technical Sales Accreditation", issuer: "F5", period: "2019", evidence: { pdf: P("f5-technical-sales") } },
      { name: "F5 Security Sales Accreditation", issuer: "F5", period: "2019", evidence: { pdf: P("f5-security-sales") } },
      { name: "F5 Security Pre-Sales Accreditation", issuer: "F5", period: "2019", evidence: { pdf: P("f5-security-presales") } },
      { name: "F5 Accredited Technical Sales Professional", issuer: "F5", period: "2014 – 2015" },
      { name: "F5 Accredited Security Professional", issuer: "F5", period: "2014 – 2015" },
      { name: "F5 Accredited Sales Professional", issuer: "F5", period: "2013 – 2015", evidence: { pdf: P("f5-sales-accreditation") } },
    ],
  },
  {
    vendor: "Fortinet",
    note: "Effective 15 July 2026, Fortinet retires the FCF / FCA / FCP / FCSS / FCX names and restores an eight-level NSE 1–8 progression across four tracks (Secure Networking, Security Operations, Cloud Security, SASE). On that date these map forward: FCF becomes NSE 1 and NSE 2, FCA becomes NSE 3, and the FortiGate / FortiOS exam behind FCP becomes NSE 4, with further NSE 5–7 levels assigned from the exam history below. The named certifications remain on record.",
    items: [
      { name: "Fortinet Certified Professional, Security Operations", issuer: "Fortinet", detail: "FCP-SO", period: "2024 – 2026", note: "Expired 2026.", era: "FCP & FCSS era (2023 - 2025)", evidence: { pdf: P("fortinet-fcp-so"), credly: C("85a6e67d-6fe7-4c5c-9cc4-3dad553f64d1"), verifyId: "8949460026RN" } },
      { name: "Fortinet FortiGate 7.4 Administrator", issuer: "Fortinet", period: "2024", era: "FCP & FCSS era (2023 - 2025)", evidence: { credly: C("cc71bb44-1e3e-4f1a-bebe-301262152b19") } },
      { name: "Fortinet FortiGate 7.2 Administrator", issuer: "Fortinet", period: "2023", era: "FCP & FCSS era (2023 - 2025)", evidence: { credly: C("d99f54c6-ea5b-48c3-af7c-c1e4919cc8b3") } },
      { name: "Fortinet FortiGate 7.4 Operator", issuer: "Fortinet", period: "2023", era: "FCP & FCSS era (2023 - 2025)", evidence: { credly: C("b2e0e422-5ec2-4ffe-93b7-cb40f95f4586") } },
      { name: "Fortinet FortiAnalyzer 7.4 Analyst", issuer: "Fortinet", period: "2024", era: "FCP & FCSS era (2023 - 2025)", evidence: { credly: C("89818e4f-e0a3-4ecf-b56b-17229b348511") } },
      { name: "Fortinet FortiAnalyzer 7.4 Administrator", issuer: "Fortinet", period: "2024", era: "FCP & FCSS era (2023 - 2025)", evidence: { credly: C("0a695156-e4bf-43c9-811e-9ab5bb7971a3") } },
      { name: "Fortinet FortiManager 7.2 Administrator", issuer: "Fortinet", period: "2024", era: "FCP & FCSS era (2023 - 2025)", evidence: { credly: C("d4436fa8-46c8-4410-be60-b55936ec8dff") } },
      { name: "Fortinet FortiAuthenticator 6.5 Administrator", issuer: "Fortinet", period: "2024", era: "FCP & FCSS era (2023 - 2025)", evidence: { credly: C("a1ae8d56-515a-452c-bcd3-f0c614311859") } },
      { name: "NSE Trainer Assessment, Professional Level 7.4", issuer: "Fortinet", period: "2025", era: "FCP & FCSS era (2023 - 2025)", evidence: { credly: C("4c3c0aea-426e-4165-b391-5ea201c0b4e9") } },
      { name: "Fortinet NSE 4", issuer: "Fortinet", detail: "FortiGate", period: "2022", era: "Legacy NSE program (2022)", evidence: { pdf: P("fortinet-nse4"), verifyId: "G99ZhFg2T5" } },
      { name: "Fortinet NSE 3", issuer: "Fortinet", period: "2022", era: "Legacy NSE program (2022)", evidence: { pdf: P("fortinet-nse3"), verifyId: "ndyZwxAQoE" } },
      { name: "Fortinet NSE 2", issuer: "Fortinet", period: "2022", era: "Legacy NSE program (2022)", evidence: { pdf: P("fortinet-nse2"), verifyId: "6vEbZm87aX" } },
      { name: "Fortinet NSE 1", issuer: "Fortinet", period: "2022", era: "Legacy NSE program (2022)", evidence: { pdf: P("fortinet-nse1"), verifyId: "jIIP5ksrdc" } },
      { name: "Getting Started in Cybersecurity 1.0", issuer: "Fortinet", period: "2022", era: "Legacy NSE program (2022)", evidence: { credly: C("13d844c1-9371-403b-a45f-806194c6f026") } },
      { name: "Introduction to the Threat Landscape 1.0", issuer: "Fortinet", period: "2022", era: "Legacy NSE program (2022)", evidence: { credly: C("5662c537-2b16-4fbc-8886-1856f4e7acf7") } },
    ],
  },
  {
    vendor: "Extreme Networks",
    items: [
      { name: "ExtremeCloud IQ – API and Automation", issuer: "Extreme Networks", period: "2024", evidence: { credly: C("d6dd82b8-b2d5-4638-8c68-7e1d7b6cc61a") } },
      { name: "Cisco to Extreme Networks Conversion: Switching", issuer: "Extreme Networks", period: "2024", evidence: { credly: C("0e60562a-f336-4bd8-8111-58542eb192c6") } },
      { name: "ExtremeCloud Edge, Installation and Configuration", issuer: "Extreme Networks", period: "2024", evidence: { credly: C("50fc3a23-93c2-430e-81f6-d6b67e0bd9ca") } },
      { name: "ExtremeCloud SD-WAN, Troubleshooting", issuer: "Extreme Networks", period: "2024", evidence: { credly: C("519aaed8-c256-4370-bcef-c21cee9f31b5") } },
      { name: "ExtremeCloud SD-WAN, Advanced Configuration", issuer: "Extreme Networks", period: "2024" },
      { name: "ExtremeCloud SD-WAN, Management", issuer: "Extreme Networks", period: "2024", evidence: { credly: C("db018b83-74ec-4a9a-bf0d-a6057aec6f55") } },
      { name: "ExtremeCloud SD-WAN, Installation and Configuration", issuer: "Extreme Networks", period: "2024", evidence: { credly: C("2219bac3-a5b9-4a25-8486-971741b2c7d6") } },
      { name: "Extreme Certified Associate, ExtremeCloud SD-WAN", issuer: "Extreme Networks", period: "2024" },
      { name: "Extreme Certified Associate, Solutions Design", issuer: "Extreme Networks", period: "2023" },
      { name: "Extreme Certified Associate, Solutions Selling", issuer: "Extreme Networks", period: "2023" },
      { name: "Extreme Certified Associate, Network Security Basics", issuer: "Extreme Networks", period: "2024" },
      { name: "ExtremeCloud IQ, Site Engine Installation and Configuration", issuer: "Extreme Networks", period: "2022" },
      { name: "ExtremeWireless Cloud, Installation and Configuration", issuer: "Extreme Networks", period: "2022" },
      { name: "Extreme Certified Specialist, Wireless Cloud", issuer: "Extreme Networks", period: "2021 – 2022" },
      { name: "Extreme Certified Specialist, Campus EXOS Switching & Routing", issuer: "Extreme Networks", period: "2021 – 2022" },
      { name: "Extreme Certified Specialist, Management Center", issuer: "Extreme Networks", period: "2021 – 2022" },
      { name: "Extreme Certified Design Professional (ECDP)", issuer: "Extreme Networks", period: "2014 – 2015", evidence: { pdf: P("extreme-ecdp-2014") } },
      { name: "Extreme Certified Sales Professional (ECSP)", issuer: "Extreme Networks", period: "2014 – 2015", evidence: { pdf: P("extreme-ecsp-2014") } },
    ],
  },
  {
    vendor: "Palo Alto Networks",
    items: [
      { name: "Palo Alto Networks Certified Network Security Administrator (PCNSA)", issuer: "Palo Alto Networks", period: "2021", note: "Expired 2023.", evidence: { credly: C("f69a125a-0a8b-4fb2-9641-ba136f4a98a1") } },
      { name: "Palo Alto Networks Systems Engineer, Foundation (PSE)", issuer: "Palo Alto Networks", period: "2020", note: "Expired 2022.", evidence: { credly: C("2ef2fdd0-2704-4f25-b661-f116126e1dad") } },
      // Official Palo Alto Networks EDU courses completed through, and badged
      // by, Red Education (Credly issuer: Red Education).
      { name: "Firewall Essentials: Configuration and Management", issuer: "Red Education", detail: "Palo Alto Networks EDU-210", period: "2021", evidence: { credly: C("e36bdcf5-9c27-4a15-ae9a-7e9eed0cd621") } },
      { name: "Panorama: Managing Firewalls at Scale", issuer: "Red Education", detail: "Palo Alto Networks EDU-220", period: "2021", evidence: { credly: C("1ec70a7d-d604-4eca-83fd-36508584d10c") } },
      { name: "Firewall: Troubleshooting", issuer: "Red Education", detail: "Palo Alto Networks EDU-330", period: "2021", evidence: { credly: C("da12dbc8-0df3-46b9-a984-a1134515061f") } },
      { name: "Palo Alto Accredited Configuration Engineer (ACE) 6.0", issuer: "Palo Alto Networks", period: "2018", evidence: { pdf: P("palo-alto-ace6") } },
      // CNSE: read from the certificate itself (2026-07-14) - "Certified
      // Network Security Engineer", CNSE Number 5.1-1505, May 12, 2014.
      { name: "Palo Alto Networks Certified Network Security Engineer (CNSE) 5.1", issuer: "Palo Alto Networks", period: "2014 – 2016", evidence: { pdf: P("palo-alto-cnse"), verifyId: "5.1-1505" } },
      { name: "Palo Alto Accredited Configuration Engineer (ACE) 5.0", issuer: "Palo Alto Networks", period: "2014 – 2016", evidence: { pdf: P("palo-alto-ace5") } },
      { name: "Palo Alto Accredited Configuration Engineer (ACE) 5, Partner", issuer: "Palo Alto Networks", period: "2014", evidence: { pdf: P("palo-alto-ace5-partner") } },
      { name: "Palo Alto Accredited Sales Expert (ASE) 5.0", issuer: "Palo Alto Networks", period: "2014 – 2016", evidence: { pdf: P("palo-alto-ase5") } },
    ],
  },
  {
    vendor: "Tenable",
    items: [
      { name: "Tenable Certified Sales Associate (TCSA)", issuer: "Tenable", period: "2020 – 2022", evidence: { pdf: P("tenable-sales-associate") } },
      { name: "Tenable.io Certified Pre-Sales Engineer", issuer: "Tenable", period: "2020 – 2022", evidence: { pdf: P("tenable-presales-engineer-io") } },
      { name: "Tenable.io Certified Pre-Sales Integrator", issuer: "Tenable", period: "2020 – 2022", evidence: { pdf: P("tenable-presales-integrator-io") } },
      { name: "Tenable.io Certified Pre-Sales Architect", issuer: "Tenable", period: "2020 – 2022", evidence: { pdf: P("tenable-presales-architecture-io") } },
      { name: "Tenable.sc Certified Pre-Sales Engineer", issuer: "Tenable", period: "2020 – 2022", evidence: { pdf: P("tenable-presales-engineer-sc") } },
      { name: "Tenable.sc Certified Pre-Sales Integrator", issuer: "Tenable", period: "2020 – 2022", evidence: { pdf: P("tenable-presales-integrator-sc") } },
      { name: "Tenable.sc Certified Pre-Sales Architect", issuer: "Tenable", period: "2020 – 2022", evidence: { pdf: P("tenable-presales-architecture-sc") } },
    ],
  },
  {
    vendor: "CyberArk",
    items: [
      { name: "CyberArk Certified Pre-Sales Engineer (CPE)", issuer: "CyberArk", period: "2020 – 2022", evidence: { pdf: P("cyberark-cpe") } },
      { name: "CyberArk Certified Sales Professional (CSP)", issuer: "CyberArk", period: "2020 – 2022", evidence: { pdf: P("cyberark-csp") } },
      { name: "CyberArk Certified Trustee", issuer: "CyberArk", period: "2020 – 2022", evidence: { pdf: P("cyberark-trustee") } },
    ],
  },
  {
    vendor: "Corvil",
    items: [
      { name: "Corvil Certified Administrator (CCA)", issuer: "Corvil", detail: "Credential ID E-E1LNZV", period: "2020 – 2022" },
    ],
  },
  {
    vendor: "Polycom",
    items: [
      { name: "Polycom Video Endpoints: Sales Track (RPEOS100)", issuer: "Polycom", period: "2014 – 2015", evidence: { pdf: P("polycom-rpeos100") } },
      { name: "Polycom Video Endpoints: Technical Track (RPEOT200)", issuer: "Polycom", period: "2014 – 2015" },
    ],
  },
  {
    vendor: "Cisco",
    items: [
      { name: "Cisco Certified Network Associate (CCNA)", issuer: "Cisco", detail: "Routing & Switching", period: "2000 – 2008", evidence: { pdf: P("cisco-ccna"), credly: C("36e47326-b6e5-490d-ac42-e273e2893f80") } },
      { name: "Cisco Internetwork Troubleshooting (CIT)", issuer: "Cisco", detail: "Internetwork Troubleshooting", period: "2003 – 2005" },
    ],
  },
  {
    vendor: "Juniper Networks",
    items: [
      { name: "Juniper Networks Sales Specialist, Enterprise Networking (JNSS-EN)", issuer: "Juniper Networks", period: "2010 – 2012" },
      { name: "Juniper Networks Sales Associate, Enterprise Networking (JNSA-EN)", issuer: "Juniper Networks", period: "2010 – 2012" },
    ],
  },
  {
    vendor: "Avaya",
    items: [
      { name: "Avaya Professional Sales Specialist - Small and Medium Enterprise Communications (APSS-SME)", issuer: "Avaya", period: "2013 – 2014" },
      { name: "Avaya Professional Sales Specialist - Unified Communications (APSS-UC)", issuer: "Avaya", period: "2013 – 2014" },
    ],
  },
  {
    vendor: "Enterasys Networks",
    items: [
      { name: "Enterasys Systems Engineer (ESE) - Enterprise Routing, Switching, Wireless & Management", issuer: "Enterasys Networks", period: "2007 – 2009" },
      { name: "Enterasys Systems Engineer, Internetworking Technologies (ESE)", issuer: "Enterasys Networks", period: "2000 – 2002" },
      { name: "Enterasys Certified Internetworking Engineer for Infrastructure (ECIE-C)", issuer: "Enterasys Networks", period: "2007 – 2009" },
    ],
  },
  {
    vendor: "Riverstone Networks",
    items: [
      { name: "Riverstone Certified Network Professional (RCNP)", issuer: "Riverstone Networks", period: "2001 – 2003" },
    ],
  },
  {
    vendor: "Cabletron Systems",
    items: [
      { name: "Cabletron Certified Instructor (CCI)", issuer: "Cabletron Systems", period: "1998 – 2000" },
      { name: "Cabletron Systems Engineer, Internetworking Technologies (CSE)", issuer: "Cabletron Systems", period: "1998 – 2000" },
    ],
  },
  {
    vendor: "CommScope",
    items: [
      { name: "AT&T / Lucent - Systimax Structured Cabling System Engineer", issuer: "CommScope", detail: "Systimax", period: "1998 – 2000" },
    ],
  },
];

/** Total distinct credentials listed (for a headline figure). */
export const CREDENTIAL_COUNT =
  instructorAuthorizations.length +
  currentCertifications.length +
  historical.reduce((n, g) => n + g.items.length, 0);
