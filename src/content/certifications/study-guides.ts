// ============================================================================
// src/content/certifications/study-guides.ts
// ----------------------------------------------------------------------------
// CANDIDATE STUDY-AID DATA MODEL (the repurposed /certifications section).
//
// This is the DATA SPINE for the candidate-facing study guides. Each guide maps
// the PUBLISHED objectives of a vendor exam blueprint to legitimate learning
// resources already on this site (Learn/KB articles + tools) plus the official
// vendor manual pages.
//
// HARD ETHICS GUARDRAIL (non-negotiable): these guides map published blueprint
// OBJECTIVES (public vendor information) to learning resources. They must NEVER
// contain, paraphrase, collect, or link to actual exam questions, answers, or
// "brain dumps." Dumps violate every vendor's certification agreement and would
// endanger Rodolfo's standing as an authorized instructor. The guides help
// candidates LEARN the material, never shortcut the exam.
//
// SOURCING: the verbatim objective text and section structure of each exam come
// from the OFFICIAL blueprint (relayed by PRIME from MyF5), never reconstructed
// from memory. Until a blueprint is relayed a guide sits in `status: "preparing"`
// with empty `sections`, and the page renders an honest "in preparation" state.
//
// The exam names and codes below ARE verified from official F5 Education Services
// sources (2026-07-09): the F5 Certified Administrator, BIG-IP (F5-CA) credential
// is earned by passing five exams (F5CAB1-F5CAB5), which replaced the retired 101
// (Application Delivery Fundamentals, retired 2025-04-30) and 201 (TMOS
// Administration) exams. A single renewal exam (F5CABR) refreshes an existing
// F5-CA. See https://support.education.f5.com/hc/en-us/articles/37607208476059
// ============================================================================

/** One official manual page. When an exam targets a known older product version
 *  than the current docs, a guide links BOTH the latest page (`version: null`)
 *  and the version-specific page, with a disclaimer. */
export interface ManualLink {
  label: string;
  url: string;
  /** The product version this page documents, or null for "latest". */
  version: string | null;
}

/** One blueprint objective and its mapped learning resources. */
export interface Objective {
  /** Stable id, unique within its section (e.g. "1.01"). */
  id: string;
  /** Verbatim objective text from the official blueprint (official language). */
  text: string;
  /** Learn/KB article slugs that teach this objective. */
  relatedArticles: string[];
  /** Catalogue tool slugs that exercise this objective. */
  relatedTools: string[];
  /** Official vendor manual page(s). */
  manualLinks: ManualLink[];
  /** Concise study notes for this objective: the facts a candidate should be
   *  able to state cold. Blueprint language (English), like the objective text
   *  itself. NEVER exam questions or answers (see the ethics guardrail). */
  keyPoints?: string[];
  /** True when no internal article covers this objective yet (renders an
   *  honest "article coming" marker and seeds the Learn backlog). */
  gap?: boolean;
}

/** A blueprint section grouping related objectives. */
export interface BlueprintSection {
  /** Stable id (e.g. "section-1"). */
  id: string;
  /** Section title, verbatim from the blueprint. */
  title: string;
  objectives: Objective[];
}

/** A single exam's study guide. */
export interface StudyGuide {
  /** URL slug under /certifications/. */
  slug: string;
  /** Official exam code (e.g. "F5CAB1"). */
  examCode: string;
  /** Official exam name (verbatim, official language). */
  examName: string;
  /** Vendor key (matches the vendor-namespace guard: f5/fortinet/...). */
  vendor: string;
  /** Certification grouping key this exam belongs to (e.g. "f5-ca"). */
  certification: string;
  /** Target product version if the blueprint states one, else null. */
  targetVersion: string | null;
  /** Public link to the official blueprint/source, if any. */
  blueprintSourceUrl: string | null;
  blueprintSourceLabel: string | null;
  /** "preparing" = blueprint not yet transcribed (renders the "in preparation"
   *  state); "published" = objectives mapped and live. */
  status: "preparing" | "published";
  /** At-a-glance exam facts from the official catalog (null until known). */
  examFacts: {
    /** e.g. "70 multiple-choice items" */
    questions: string;
    /** Time limit in minutes. */
    minutes: number;
    /** e.g. "64%" */
    passMark: string;
    /** e.g. "USD 395 / EUR 365 / GBP 310" */
    cost: string;
    /** One-line format/credential note (official language). */
    note: string | null;
  } | null;
  sections: BlueprintSection[];
}

/** A certification (a credential earned by passing one or more exams). */
export interface Certification {
  /** Grouping key (e.g. "f5-ca"). */
  key: string;
  /** Short code shown as a badge (e.g. "F5-CA, BIG-IP"). */
  code: string;
  /** Full name (verbatim, official). */
  name: string;
  /** Vendor key. */
  vendor: string;
  /** The exam guide slugs that make up this certification, in study order. */
  examSlugs: string[];
  /** Optional note about renewal/recertification. */
  renewalNote: string | null;
  /** Public link to the certification's official description. */
  sourceUrl: string | null;
}

// ---------------------------------------------------------------------------
// CERTIFICATIONS
// ---------------------------------------------------------------------------

export const certifications: Certification[] = [
  {
    key: "f5-ca",
    code: "F5-CA, BIG-IP",
    name: "F5 Certified Administrator, BIG-IP",
    vendor: "f5",
    examSlugs: [
      "f5-ca-install-config-upgrade",
      "f5-ca-data-plane-concepts",
      "f5-ca-data-plane-configuration",
      "f5-ca-control-plane-administration",
      "f5-ca-support-and-troubleshoot",
    ],
    renewalNote:
      "An existing F5-CA, BIG-IP can be renewed by passing the recertification exam (F5CABR), or by passing all five exams again.",
    sourceUrl:
      "https://support.education.f5.com/hc/en-us/articles/37607208476059-What-is-the-F5-Certified-Administrator-BIG-IP-F5-CA-BIG-IP-certification",
  },
  {
    key: "ping-cp-pingfederate",
    code: "PFP-001",
    name: "Certified Professional - PingFederate",
    vendor: "ping",
    examSlugs: ["ping-cp-pingfederate"],
    renewalNote:
      "The credential is valid for 3 years. Recertification means retaking and passing the exam, no earlier than 3 months before the expiration date (exam fees apply to recertification attempts).",
    sourceUrl: "https://training.pingidentity.com/certification",
  },
  {
    key: "ping-cp-pingaccess",
    name: "Certified Professional - PingAccess",
    code: "PAP-001",
    vendor: "ping",
    examSlugs: ["ping-cp-pingaccess"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Credential valid for 3 years; renewal is by retaking and passing the exam, attemptable from 3 months before expiration. Proctored by Kryterion, remote or at a testing center. Exam based on PingAccess version 8 or later. Facts per the official Certification Guide (certification-exams-policies-procedures.pdf) + training.pingidentity.com/certification catalog, verified 2026-07-22.",
  },
  {
    key: "ping-cp-pingdirectory",
    name: "Certified Professional - PingDirectory",
    code: "CP-PingDirectory",
    vendor: "ping",
    examSlugs: ["ping-cp-pingdirectory"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Credential valid for 3 years; renewal is by retaking and passing the exam, attemptable from 3 months before expiration. Proctored by Kryterion, remote or at a testing center. The exam name is the official identifier; a Kryterion catalog code was not verified from official sources this session. Facts per the official Certification Guide (certification-exams-policies-procedures.pdf) + training.pingidentity.com/certification catalog, verified 2026-07-22.",
  },
  {
    key: "ping-cp-pingone",
    name: "Certified Professional - PingOne",
    code: "CP-PingOne",
    vendor: "ping",
    examSlugs: ["ping-cp-pingone"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Credential valid for 3 years; renewal is by retaking and passing the exam, attemptable from 3 months before expiration. Proctored by Kryterion, remote or at a testing center. The exam name is the official identifier; a Kryterion catalog code was not verified from official sources this session. Facts per the official Certification Guide (certification-exams-policies-procedures.pdf) + training.pingidentity.com/certification catalog, verified 2026-07-22.",
  },
  {
    key: "ping-cp-pingone-davinci",
    name: "Certified Professional - PingOne DaVinci",
    code: "CP-PingOne-DaVinci",
    vendor: "ping",
    examSlugs: ["ping-cp-pingone-davinci"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Credential valid for 3 years; renewal is by retaking and passing the exam, attemptable from 3 months before expiration. Proctored by Kryterion, remote or at a testing center. The exam name is the official identifier; a Kryterion catalog code was not verified from official sources this session. Facts per the official Certification Guide (certification-exams-policies-procedures.pdf) + training.pingidentity.com/certification catalog, verified 2026-07-22.",
  },
  {
    key: "ping-cp-pingam",
    name: "Certified Professional - PingAM",
    code: "CP-PingAM",
    vendor: "ping",
    examSlugs: ["ping-cp-pingam"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Credential valid for 3 years; renewal is by retaking and passing the exam, attemptable from 3 months before expiration. Proctored by Kryterion, remote or at a testing center. Exam based on PingAM version 7 (the product formerly ForgeRock Access Management). Facts per the official Certification Guide (certification-exams-policies-procedures.pdf) + training.pingidentity.com/certification catalog, verified 2026-07-22.",
  },
  {
    key: "ping-cp-pingone-aic",
    name: "Certified Professional - PingOne Advanced Identity Cloud",
    code: "CP-PingOne-AIC",
    vendor: "ping",
    examSlugs: ["ping-cp-pingone-aic"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Credential valid for 2 years; renewal is by retaking and passing the exam, attemptable from 3 months before expiration. Proctored by Kryterion, remote or at a testing center. Formerly the ForgeRock Identity Cloud certification. Facts per the official Certification Guide (certification-exams-policies-procedures.pdf) + training.pingidentity.com/certification catalog, verified 2026-07-22.",
  },
  {
    key: "ping-cp-pingidm",
    name: "Certified Professional - PingIDM",
    code: "CP-PingIDM",
    vendor: "ping",
    examSlugs: ["ping-cp-pingidm"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Credential valid for 3 years; renewal is by retaking and passing the exam, attemptable from 3 months before expiration. Proctored by Kryterion, remote or at a testing center. The product formerly ForgeRock Identity Management. Facts per the official Certification Guide (certification-exams-policies-procedures.pdf) + training.pingidentity.com/certification catalog, verified 2026-07-22.",
  },
  {
    key: "ping-cp-pingone-idg",
    name: "Certified Professional - PingOne Identity Governance",
    code: "CP-PingOne-IDG",
    vendor: "ping",
    examSlugs: ["ping-cp-pingone-idg"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Credential valid for 2 years; renewal is by retaking and passing the exam, attemptable from 3 months before expiration. Proctored by Kryterion, remote or at a testing center. Delivered on PingOne Advanced Identity Cloud with the Identity Governance functionality. Facts per the official Certification Guide (certification-exams-policies-procedures.pdf) + training.pingidentity.com/certification catalog, verified 2026-07-22.",
  },
  {
    key: "ping-ce-pingfederate",
    name: "Certified Expert - PingFederate",
    code: "CE-PingFederate",
    vendor: "ping",
    examSlugs: ["ping-ce-pingfederate"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Expert-tier credential for PingFederate (PRIME ruling 2026-07-22: Expert tier in scope). Per the official Certification Guide, Certified Expert exams may be multiple-choice or practical lab-based, proctored by Kryterion remotely or at a testing center; renewal is by retaking the exam, attemptable from 3 months before expiration. Per-exam format, length, and pass mark not captured from official sources this session.",
  },
  {
    key: "ping-ce-pingaccess",
    name: "Certified Expert - PingAccess",
    code: "CE-PingAccess",
    vendor: "ping",
    examSlugs: ["ping-ce-pingaccess"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Expert-tier credential for PingAccess (PRIME ruling 2026-07-22: Expert tier in scope). Per the official Certification Guide, Certified Expert exams may be multiple-choice or practical lab-based, proctored by Kryterion remotely or at a testing center; renewal is by retaking the exam, attemptable from 3 months before expiration. Per-exam format, length, and pass mark not captured from official sources this session.",
  },
  {
    key: "ping-ce-pingdirectory",
    name: "Certified Expert - PingDirectory",
    code: "CE-PingDirectory",
    vendor: "ping",
    examSlugs: ["ping-ce-pingdirectory"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Expert-tier credential for PingDirectory (PRIME ruling 2026-07-22: Expert tier in scope). Per the official Certification Guide, Certified Expert exams may be multiple-choice or practical lab-based, proctored by Kryterion remotely or at a testing center; renewal is by retaking the exam, attemptable from 3 months before expiration. Per-exam format, length, and pass mark not captured from official sources this session.",
  },
  {
    key: "ping-ce-pingone",
    name: "Certified Expert - PingOne",
    code: "CE-PingOne",
    vendor: "ping",
    examSlugs: ["ping-ce-pingone"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Expert-tier credential for PingOne (PRIME ruling 2026-07-22: Expert tier in scope). Per the official Certification Guide, Certified Expert exams may be multiple-choice or practical lab-based, proctored by Kryterion remotely or at a testing center; renewal is by retaking the exam, attemptable from 3 months before expiration. Per-exam format, length, and pass mark not captured from official sources this session.",
  },
  {
    key: "ping-ce-pingone-aic",
    name: "Certified Expert - PingOne Advanced Identity Cloud",
    code: "CE-PingOne-AIC",
    vendor: "ping",
    examSlugs: ["ping-ce-pingone-aic"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Expert-tier credential for PingOne Advanced Identity Cloud (PRIME ruling 2026-07-22: Expert tier in scope). Per the official Certification Guide, Certified Expert exams may be multiple-choice or practical lab-based, proctored by Kryterion remotely or at a testing center; renewal is by retaking the exam, attemptable from 3 months before expiration. Per-exam format, length, and pass mark not captured from official sources this session.",
  },
  {
    key: "ping-ce-pingam",
    name: "Certified Expert - PingAM",
    code: "CE-PingAM",
    vendor: "ping",
    examSlugs: ["ping-ce-pingam"],
    sourceUrl: "https://training.pingidentity.com/certification",
    renewalNote:
      "Expert-tier credential for PingAM (PRIME ruling 2026-07-22: Expert tier in scope). Per the official Certification Guide, Certified Expert exams may be multiple-choice or practical lab-based, proctored by Kryterion remotely or at a testing center; renewal is by retaking the exam, attemptable from 3 months before expiration. Per-exam format, length, and pass mark not captured from official sources this session.",
  },


  {
    key: "f5-cts-ltm",
    code: "F5-CTS, LTM",
    name: "F5 Certified Technology Specialist, BIG-IP LTM",
    vendor: "f5",
    examSlugs: [
      "f5-cts-ltm-base-config-networking",
      "f5-cts-ltm-virtual-servers-config-objects",
      "f5-cts-ltm-irules-analytics-templates",
      "f5-cts-ltm-upgrades-ha-monitoring",
      "f5-cts-ltm-pcap-tcp-udp-app",
      "f5-cts-ltm-pcap-tls-ssl",
    ],
    renewalNote:
      "Prerequisite: F5-CA, BIG-IP. The six exams can be taken in any order; beta exams run until 2026-07-31, with production exams to follow. An existing F5-CTS, LTM is renewed by passing the LTM Certified Technology Specialist Recertification exam (F5CTSLTMR).",
    sourceUrl: "https://support.education.f5.com/hc/en-us/article_attachments/47506970938907",
  },
  {
    key: "zscaler-zdta",
    code: "ZDTA",
    name: "Zscaler Digital Transformation Administrator",
    vendor: "zscaler",
    examSlugs: ["zscaler-zdta"],
    renewalNote: null,
    sourceUrl: "https://www.zscaler.com/zscaler-cyber-academy/digital-transformation-administrator",
  },
  {
    // The CURRENT Netskope credentials (2024 program): Academy-delivered
    // accreditations that REPLACED the Pearson VUE certifications below.
    // Facts verbatim from the official TR-772-1 / TR-773-1 PDFs
    // (netskope.com, 09/24), fetched live 2026-07-21.
    key: "netskope-administrator-accreditation",
    name: "Netskope Administrator Accreditation",
    code: "TR-772-1",
    vendor: "netskope",
    sourceUrl: "https://www.netskope.com/wp-content/uploads/2024/09/2024-09-Netskope-Administrator-Accreditation-TR-772-1.pdf",
    examSlugs: ["netskope-administrator-accreditation"],
    renewalNote:
      "Valid for two years from the date of award, based on the actual date the exam is successfully completed through Netskope Academy. 60 questions, 90 minutes. This accreditation replaces the former Netskope Certified Cloud Security Administrator certification (NSK101).",
  },
  {
    key: "netskope-integrator-accreditation",
    name: "Netskope Integrator Accreditation",
    code: "TR-773-1",
    vendor: "netskope",
    sourceUrl: "https://www.netskope.com/pt/wp-content/uploads/2024/09/2024-09-Netskope-Integrator-Accreditation-TR-773-1.pdf",
    examSlugs: ["netskope-integrator-accreditation"],
    renewalNote:
      "Valid for two years from the date of award, based on the actual date the exam is successfully completed through Netskope Academy. 60 questions, 90 minutes. This accreditation replaces the former Netskope Certified Cloud Security Integrator certification (NSK200).",
  },
  {
    // The three Netskope Cloud Security Certification Program credentials
    // (PKG-CONTENT-QUEUE Run A). Facts per the official certification
    // description PDFs fetched live 2026-07-21 from netskope.com.
    key: "netskope-nccsa",
    sourceUrl: "https://www.netskope.com/wp-content/uploads/2022/11/NCCSA-NSK101-Certification-Description-2024-01-26.pdf",
    name: "Netskope Certified Cloud Security Administrator (NCCSA)",
    code: "NSK101",
    vendor: "netskope",
    examSlugs: ["netskope-nsk101"],
    renewalNote:
      "Valid for two years from the date the exam is passed at Pearson VUE. This certification replaced the former Administrator accreditation in 2022 and was itself replaced by the 2024 Netskope Administrator Accreditation (Academy-delivered); the published blueprint remains the reference for the credential line. Exam: 90 minutes, Pearson VUE.",
  },
  {
    key: "netskope-nccsi",
    sourceUrl: "https://www.netskope.com/wp-content/uploads/2022/11/NCCSI-NSK200-Certification-Description-2022-11-22.pdf",
    name: "Netskope Certified Cloud Security Integrator (NCCSI)",
    code: "NSK200",
    vendor: "netskope",
    examSlugs: ["netskope-nsk200"],
    renewalNote:
      "Valid for two years from the date the exam is passed at Pearson VUE. This certification replaced the former Integrator accreditation in 2022 and was itself replaced by the 2024 Netskope Integrator Accreditation (Academy-delivered); the published blueprint remains the reference for the credential line. Exam: 90 minutes, Pearson VUE.",
  },
  {
    key: "netskope-architect",
    sourceUrl: "https://www.netskope.com/fr/wp-content/uploads/2022/10/netskope-cloud-security-certification-program.pdf",
    name: "Netskope Certified Cloud Security Architect",
    code: "NSK300",
    vendor: "netskope",
    examSlugs: ["netskope-nsk300"],
    renewalNote:
      "Valid for two years from the date the exam is passed at Pearson VUE. This certification replaced the former Cloud Security Elite accreditation in 2022. An Architect Accreditation exists in the current 2024 Academy program, but no standalone blueprint for it has been published; this NSK300 blueprint remains the architect tier’s published reference. Exam: 90 minutes, Pearson VUE.",
  },

  {
    key: "f5-cts-dns",
    code: "F5-CTS, BIG-IP DNS",
    name: "F5 Certified Technology Specialist, BIG-IP DNS",
    vendor: "f5",
    examSlugs: ["f5-cts-dns-302"],
    renewalNote: null,
    sourceUrl: "https://education.f5.com/certification/big-ip-dns-specialist-302",
  },
  {
    key: "f5-cts-asm",
    code: "F5-CTS, BIG-IP ASM",
    name: "F5 Certified Technology Specialist, BIG-IP ASM",
    vendor: "f5",
    examSlugs: ["f5-cts-asm-303"],
    renewalNote: null,
    sourceUrl: "https://education.f5.com/certification/big-ip-asm-specialist-303",
  },
  {
    key: "f5-cts-apm",
    code: "F5-CTS, BIG-IP APM",
    name: "F5 Certified Technology Specialist, BIG-IP APM",
    vendor: "f5",
    examSlugs: ["f5-cts-apm-304"],
    renewalNote: null,
    sourceUrl: "https://education.f5.com/certification/big-ip-apm-specialist-304",
  },
  {
    key: "f5-cse-sec",
    code: "F5-CSE, SEC",
    name: "F5 Certified Solution Expert, Security",
    vendor: "f5",
    examSlugs: ["f5-cse-security-401"],
    renewalNote: null,
    sourceUrl: "https://education.f5.com/certification/security-solutions-401",
  },
  {
    key: "f5-cse-cld",
    code: "F5-CSE, CLD",
    name: "F5 Certified Solution Expert, Cloud",
    vendor: "f5",
    examSlugs: ["f5-cse-cloud-402"],
    renewalNote: null,
    sourceUrl: "https://education.f5.com/certification/cloud-solutions-402",
  },
  {
    key: "f5-ca-nginx",
    code: "F5-CA, NGINX",
    name: "F5 Certified Administrator, NGINX",
    vendor: "f5",
    examSlugs: ["f5-nginx-f5n1", "f5-nginx-f5n2", "f5-nginx-f5n3", "f5-nginx-f5n4"],
    renewalNote: null,
    sourceUrl: "https://education.f5.com/learning-path/view/24",
  },
];

// ---------------------------------------------------------------------------
// STUDY GUIDES (F5-CA's five exams, blueprints pending PRIME relay)
//
// Names/codes are verified official F5 titles. `sections` stay empty and
// `status` stays "preparing" until the official blueprint objectives are
// relayed; the guide page renders an honest "in preparation" state meanwhile.
// ---------------------------------------------------------------------------

const F5CA_SOURCE =
  "https://support.education.f5.com/hc/en-us/articles/37607208476059-What-is-the-F5-Certified-Administrator-BIG-IP-F5-CA-BIG-IP-certification";

export const studyGuides: StudyGuide[] = [
  {
    slug: "f5-ca-install-config-upgrade",
    examCode: "F5CAB1",
    examName: "BIG-IP Administration Install, Initial Configuration, and Upgrade",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Certification blueprint F5-CAB.0425 (official, relayed by PRIME 2026-07-21)",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "F5CAB1: BIG-IP Administration Install, Initial Configuration, and Upgrade",
        objectives: [
          {
            id: "F5CAB1.01",
            text: "Securing BIG-IP",
            relatedArticles: ["bigip-packet-filters", "bigip-syn-flood-protection", "bigip-management-access-port-lockdown"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Securing Management-IP",
              "Port lockdown",
              "Firewall Rules for Self-IPs",
              "Configure DDOS Vectors",
              "Secure Password Policies",
              "SSHD ACLs",
              "HTTPd ACLs",
            ],
          },
          {
            id: "F5CAB1.02",
            text: "Identify management connectivity configurations",
            relatedArticles: ["bigip-management-access-port-lockdown"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify the configured management-IP address",
              "Interpret port lockdown settings to Self-IP",
              "Show remote connectivity to the BIG-IP Management interface",
              "Explain management IP connectivity issue",
              "Identify HTTP/SSH access list to management-IP address",
            ],
          },
          {
            id: "F5CAB1.03",
            text: "Explain the processes of licensing, license reactivation, and license modification",
            relatedArticles: ["bigip-license-reactivation", "bigip-license-file-anatomy", "bigip-service-check-date"],
            relatedTools: ["f5-service-check-date"],
            manualLinks: [],
            keyPoints: [
              "Show where to license (activate.F5.com)",
              "Identify license issues",
              "Identify Service Check Date (upgrade)",
              "Show provisioned modules - CLI/config/TMUI",
              "Report modules which are licensed for - CLI/config/TMUI",
            ],
          },
          {
            id: "F5CAB1.04",
            text: "Apply procedural concepts required to manage software images",
            relatedArticles: ["bigip-inplace-upgrade-and-64bit", "bigip-upgrade-vs-update"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Given an HA pair, describe the appropriate strategy for deploying a new software image",
              "Perform procedure to upload new software image",
              "Show currently configured boot location",
              "Demonstrate creating new volume for software images",
            ],
          },
          {
            id: "F5CAB1.05",
            text: "Identify which modules are licensed and/or provisioned",
            relatedArticles: ["bigip-license-file-anatomy"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Show provisioned modules",
              "Report modules which are licensed",
              "Show resource utilization of provisioned modules",
              "Report modules which are provisioned but not licensed",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "f5-ca-data-plane-concepts",
    examCode: "F5CAB2",
    examName: "BIG-IP Administration Data Plane Concepts",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Certification blueprint F5-CAB.0425 (official, relayed by PRIME 2026-07-21)",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "F5CAB2: BIG-IP Administration Data Plane Concepts",
        objectives: [
          {
            id: "F5CAB2.01",
            text: "Explain the relationship between interfaces, trunks, VLANs, self-IPs, routes and their status/statistics",
            relatedArticles: ["bigip-interfaces-trunks-vlans-selfips"],
            relatedTools: ["cidr"],
            manualLinks: [],
            keyPoints: [
              "Illustrate the use of a trunk in a BIG-IP solution",
              "Demonstrate ability to assign VLAN to interface and/or trunk",
              "Identify, based on traffic, which VLAN/route/egress IP would be used",
              "Distinguish between tagged vs untagged VLAN",
              "Compare Interface status (Up/Down)",
              "Explain the dependencies of interfaces/trunks, VLANs, self-IPs",
            ],
          },
          {
            id: "F5CAB2.02",
            text: "Define ADC application objects",
            relatedArticles: ["bigip-pools-and-load-balancing", "bigip-ltm-request-distribution"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Define load balancing including intelligent load balancing and server selection",
              "Explain features of an application delivery controller",
              "Explain benefits of an application delivery controller",
            ],
          },
          {
            id: "F5CAB2.03",
            text: "Determine expected traffic behavior based on configuration",
            relatedArticles: ["bigip-ltm-request-distribution", "ltm-persistence-methods", "bigip-snat-and-return-traffic"],
            relatedTools: ["bigip-ltm-lb-simulator"],
            manualLinks: [],
            keyPoints: [
              "Identify traffic diverted due to persistence",
              "Consider the packet and/or virtual server processing order (wildcard vips)",
              "Identify traffic diverted due to status of traffic objects (vs, pool, pool member)",
              "Determine the egress source IP based on configuration",
              "Identify when connection/rate limits are reached",
            ],
          },
          {
            id: "F5CAB2.04",
            text: "Identify the different virtual server types",
            relatedArticles: ["ltm-virtual-server-types"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Standard, Forwarding, Stateless, Reject",
              "Performance (Layer 4) and Performance (HTTP)",
            ],
          },
          {
            id: "F5CAB2.05",
            text: "Explain high availability (HA) concepts",
            relatedArticles: ["bigip-ha-concepts-device-trust-groups"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain methods of providing HA integrity",
              "Explain methods of providing HA",
              "Explain advantages of HA",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "f5-ca-data-plane-configuration",
    examCode: "F5CAB3",
    examName: "BIG-IP Administration Data Plane Configuration",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Certification blueprint F5-CAB.0425 (official, relayed by PRIME 2026-07-21)",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "F5CAB3: BIG-IP Administration Data Plane Configuration",
        objectives: [
          {
            id: "F5CAB3.01",
            text: "Apply procedural concepts required to modify and manage virtual servers",
            relatedArticles: ["bigip-profiles-on-a-virtual-server", "f5-clientssl-vs-serverssl", "ltm-persistence-methods"],
            relatedTools: ["f5-tmsh-config-explainer"],
            manualLinks: [],
            keyPoints: [
              "Apply appropriate persistence profile",
              "Apply appropriate HTTPS encryption profile",
              "Apply appropriate protocol specific profile",
              "Identify iApp configured objects",
              "Report use of iRules",
              "Show default pool configuration",
            ],
          },
          {
            id: "F5CAB3.02",
            text: "Apply procedural concepts required to modify and manage pools",
            relatedArticles: ["bigip-pools-and-load-balancing", "ltm-load-balancing-methods", "ltm-health-monitors"],
            relatedTools: ["bigip-ltm-lb-simulator"],
            manualLinks: [],
            keyPoints: [
              "Determine configured health monitor",
              "Determine the load balancing method for a pool",
              "Determine the active nodes in a priority group configuration",
              "Determine pool member service port configuration",
              "Apply appropriate health monitor",
              "Apply load balancing method for a pool",
              "Apply pool member service port configuration",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "f5-ca-control-plane-administration",
    examCode: "F5CAB4",
    examName: "BIG-IP Administration Control Plane Administration",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Certification blueprint F5-CAB.0425 (official, relayed by PRIME 2026-07-21)",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "F5CAB4: BIG-IP Administration Control Plane Administration",
        objectives: [
          {
            id: "F5CAB4.01",
            text: "Apply procedural concepts required to manage the state of a high availability pair",
            relatedArticles: ["bigip-failover-states-and-operations"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Execute force to standby procedure",
              "Report current active/standby failover state",
              "Execute force to offline procedure",
              "Show device trust status",
            ],
          },
          {
            id: "F5CAB4.02",
            text: "Identify management connectivity configurations",
            relatedArticles: ["bigip-management-access-port-lockdown"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify the configured management-IP address",
              "Interpret port lockdown settings to Self-IP",
              "Show remote connectivity to the BIG-IP Management interface",
              "Explain management IP connectivity issue",
              "Identify HTTP/SSH access list to management-IP address",
            ],
          },
          {
            id: "F5CAB4.03",
            text: "Identify and report current device status",
            relatedArticles: ["bigip-reading-device-status"],
            relatedTools: ["f5-tmsh-config-explainer"],
            manualLinks: [],
            keyPoints: [
              "Interpret the LCD panel warning messages",
              "Use the dashboard to gauge the current running status of the system",
              "Review the Network Map in order to determine the status of objects",
              "Interpret current systems status via GUI or TMSH",
              "Interpret high availability and device trust status",
            ],
          },
          {
            id: "F5CAB4.04",
            text: "List which log files could be used to find events and/or hardware issues",
            relatedArticles: ["bigip-log-files-map"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify use of /var/log/ltm, /var/log/secure, /var/log/audit",
              "Identify severity log level of an event",
              "Identify event from a log message",
            ],
          },
          {
            id: "F5CAB4.05",
            text: "Apply procedural concepts required to create, manage, and restore a UCS archive",
            relatedArticles: ["bigip-ucs-archives"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Execute UCS backup procedure",
              "Execute UCS restore procedure",
              "Summarize the use case of a UCS backup",
              "Explain proper long-term storage of UCS backup file",
              "Explain the contents of the UCS file (private keys)",
            ],
          },
          {
            id: "F5CAB4.06",
            text: "Explain authentication methods",
            relatedArticles: ["bigip-21x-access-identity"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain how to create a user",
              "Explain how to modify user properties",
              "Explain options for remote authentication provider",
              "Explain use of groups using remote authentication provider",
            ],
          },
          {
            id: "F5CAB4.07",
            text: "Identify configured system services",
            relatedArticles: ["bigip-system-services"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Show proper configuration for: DNS, NTP, SNMP, syslog",
            ],
          },
          {
            id: "F5CAB4.08",
            text: "Explain config sync",
            relatedArticles: ["bigip-config-sync"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Demonstrate config sync procedure",
              "Report errors which occur during config sync",
              "Explain when a config sync is necessary",
              "Show config sync status",
              "Compare configuration timestamp",
            ],
          },
          {
            id: "F5CAB4.09",
            text: "Given a scenario, determine device upgrade eligibility",
            relatedArticles: ["bigip-upgrade-vs-update", "bigip-tmos-version-timeline", "bigip-service-check-date"],
            relatedTools: ["f5-service-check-date", "f5-release-cadence-calendar"],
            manualLinks: [],
            keyPoints: [
              "Determine when to upgrade software",
              "Determine when to upgrade platform",
              "Determine steps to minimize upgrade downtime",
            ],
          },
          {
            id: "F5CAB4.10",
            text: "Given a scenario, interpret Service status",
            relatedArticles: ["bigip-reading-device-status"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Compare active vs inactive ADC elements",
              "Infer services for given netstat output",
              "Determine whether a service is listening on a given port based on netstat output",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "f5-ca-support-and-troubleshoot",
    examCode: "F5CAB5",
    examName: "BIG-IP Administration Support and Troubleshoot",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Certification blueprint F5-CAB.0425 (official, relayed by PRIME 2026-07-21)",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "F5CAB5: BIG-IP Administration Support and Troubleshooting",
        objectives: [
          {
            id: "F5CAB5.01",
            text: "Determine resource utilization",
            relatedArticles: ["bigip-cmp-clustered-multiprocessing"],
            relatedTools: ["f5-bigd-thread-calculator"],
            manualLinks: [],
            keyPoints: [
              "Distinguish between control plane and data plane resources",
              "Identify CPU statistics per virtual server",
              "Interpret Statistics for interfaces",
              "Determine Disk utilization and Memory utilization",
            ],
          },
          {
            id: "F5CAB5.02",
            text: "Identify network level performance issues",
            relatedArticles: ["bigip-tcpdump-safety", "bigip-l4-protocol-profiles"],
            relatedTools: ["f5-bigip-tcpdump-builder"],
            manualLinks: [],
            keyPoints: [
              "Identify when a packet capture is needed within the context of a performance issue",
              "Interpret availability status of interfaces",
              "Identify when drops are occurring",
              "Identify Speed and Duplex",
              "Distinguish TCP profiles (optimized profiles)",
            ],
          },
          {
            id: "F5CAB5.03",
            text: "Identify the reason load balancing is not working as expected",
            relatedArticles: ["ltm-load-balancing-methods", "ltm-health-monitors", "ltm-persistence-methods"],
            relatedTools: ["bigip-ltm-lb-simulator"],
            manualLinks: [],
            keyPoints: [
              "Consider persistence, priority group activation, rate/connection limits",
              "Identify misconfigurations (incorrect health checks, action on service down, etc.)",
              "Identify current availability status",
            ],
          },
          {
            id: "F5CAB5.04",
            text: "Identify the reason a virtual server is not working as expected",
            relatedArticles: ["ltm-virtual-server-types", "bigip-profiles-on-a-virtual-server"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify the current availability status of the virtual server",
              "Identify conflicting/misconfigured profiles",
              "Identify misconfigured IP address and/or Port",
            ],
          },
          {
            id: "F5CAB5.05",
            text: "Identify the reason a pool is not working as expected",
            relatedArticles: ["ltm-health-monitors", "bigip-pools-and-load-balancing"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify the reason a pool member has been marked down by health monitors",
              "Identify a pool member not in the active priority group",
              "Identify the current configured state of the pool/pool member",
              "Identify the current availability status of the pool/pool member",
            ],
          },
          {
            id: "F5CAB5.06",
            text: "Given a scenario, review basic stats to confirm functionality",
            relatedArticles: ["bigip-reading-device-status"],
            relatedTools: ["f5-tmsh-config-explainer"],
            manualLinks: [],
            keyPoints: [
              "Interpret traffic object statistics",
              "Interpret network configuration statistics",
            ],
          },
          {
            id: "F5CAB5.07",
            text: "Given a scenario, interpret traffic flow",
            relatedArticles: ["bigip-ltm-request-distribution"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain application client-server communication",
              "Interpret traffic graphs (Interpret SNMP results)",
            ],
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // PING IDENTITY - Certified Professional - PingFederate (PFP-001)
  //
  // THE SITE'S FIRST PUBLISHED GUIDE. Blueprint objectives transcribed VERBATIM
  // from the official "PingFederate Exam Study Guide" PDF + the live catalog at
  // training.pingidentity.com/certification (both relayed by PRIME 2026-07-21).
  // Exam facts (70 items / 90 min / 64% / v12+) follow the LIVE CATALOG, which
  // supersedes the older Certification Guide PDF (60 questions, 58% pass). The
  // study-guide PDF's "six sections" line is stale boilerplate - the published
  // blueprint has exactly the four sections below.
  //
  // keyPoints are study notes in blueprint language: facts to know cold,
  // grounded in the PingFederate product documentation. Per the ethics
  // guardrail they teach the objectives - never exam Q&A material. Manual
  // links use the stable documentation entry point (the docs portal is a JS
  // application; deep links are not durable), labeled per topic.
  // -------------------------------------------------------------------------
  {
    slug: "ping-cp-pingfederate",
    examCode: "PFP-001",
    examName: "Certified Professional - PingFederate",
    vendor: "ping",
    certification: "ping-cp-pingfederate",
    targetVersion: "PingFederate 12 or later",
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Ping Identity Certification (official catalog + exam study guide)",
    status: "published",
    examFacts: {
      questions: "70 multiple-choice items (single- and multiple-selection)",
      minutes: 90,
      passMark: "64%",
      cost: "USD 395 / EUR 365 / GBP 310",
      note: "Proctored by Kryterion (online or at a test center). Credential valid for 3 years. Recommended background: 6-12 months of hands-on PingFederate experience plus identity fundamentals (SAML, OAuth, LDAP, SCIM, REST, JSON).",
    },
    sections: [
      {
        id: "section-1",
        title: "Section 1: Installation and Initial Configuration",
        objectives: [
          {
            id: "1.01",
            text: "Identify installation requirements for the product.",
            relatedArticles: ["pingfederate-install-and-initial-setup"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - system requirements", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "PingFederate is a Java application: a supported 64-bit JVM is required - always confirm the exact Java releases on the system-requirements page for your target PingFederate version.",
              "Supported platforms cover current Windows Server and enterprise Linux distributions; the admin console supports current mainstream desktop browsers (Chrome, Firefox, Edge, Safari).",
              "Default ports: 9999 for the administrative console, 9031 for the runtime engine (both HTTPS, both set in run.properties). Plan firewall rules for admin access, runtime traffic, and back-channel calls to partners and data stores.",
              "Sizing separates roles: the console node is light; runtime engines are sized by concurrent SSO/OAuth load. Production runs clustered - one console, multiple engines.",
            ],
          },
          {
            id: "1.02",
            text: "Describe how to install the product on Windows or Linux/UNIX",
            relatedArticles: ["pingfederate-install-and-initial-setup"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - installation", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "The product ships as a distribution ZIP for all platforms (plus a Windows installer): extract to the installation directory, conventionally <pf_install>/pingfederate.",
              "Start in the foreground with bin/run.sh (Linux/UNIX) or bin\\run.bat (Windows); for production install it as a service (Windows service scripts and Linux service integration are provided).",
              "Run the server as a dedicated non-root service account that owns the installation tree - never as root/Administrator.",
              "The ZIP install is self-contained: the core product needs no external database (configuration lives on the filesystem; clustering replicates it between nodes).",
            ],
          },
          {
            id: "1.03",
            text: "Identify tasks completed during the initial configuration wizard.",
            relatedArticles: ["pingfederate-install-and-initial-setup"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - initial setup", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "First visit to the admin console (https://<host>:9999/pingfederate/app) launches setup: accept the license agreement and import the license file.",
              "Create the initial administrative account - the first native admin user - and set its password.",
              "Confirm the server identity, notably the runtime base URL that partners and OAuth clients will use to reach this deployment.",
              "Recent releases offer an optional connection to PingOne during setup; a standalone deployment can skip it.",
            ],
          },
          {
            id: "1.04",
            text: "Determine how to upgrade the product.",
            relatedArticles: ["pingfederate-upgrade-playbook"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - upgrade", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "The standard path is the Upgrade Utility: install the new version beside the old one and run the utility to copy configuration, adapters, and customizations into the new install (the Windows installer can also upgrade in place).",
              "Read the release notes and upgrade considerations for every version crossed - deprecations, renamed properties, and Java requirements change between releases.",
              "Classic post-upgrade tasks: merge custom logging configuration (log4j2 customizations are not carried automatically), re-apply UI and template customizations, re-test integrations.",
              "In a cluster: upgrade the administrative console node first, then the engines, then verify replication.",
            ],
          },
        ],
      },
      {
        id: "section-2",
        title: "Section 2: Server Administration",
        objectives: [
          {
            id: "2.01",
            text: "Describe the locations and functions of different startup files.",
            relatedArticles: ["pingfederate-startup-files"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - server configuration files", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "<pf_install>/pingfederate/bin holds the launchers: run.sh / run.bat start the server in the foreground; service scripts wrap them for production.",
              "bin/run.properties is the operational heart: admin and runtime ports and hostnames, and the operational mode (standalone vs. clustered console / clustered engine roles).",
              "bin/jvm-memory.options sets the Java heap and related JVM memory flags - the file to edit when sizing memory, not the launch scripts.",
              "Logging behavior lives in server/default/conf/log4j2.xml; templates, adapters, and deployed integration kits live under server/default/ as well - knowing which file owns which behavior is the exam's angle.",
            ],
          },
          {
            id: "2.02",
            text: "Describe how to set up logging into the administrative console with an LDAP data source.",
            relatedArticles: ["pingfederate-admin-access-and-rbac", "ldap-fundamentals"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - alternative console authentication", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Console authentication is pluggable: native accounts are the default, and LDAP (among others) can replace them for admin sign-on.",
              "The switch is made in bin/run.properties (the console-authentication property selects LDAP), with the LDAP specifics - server reference, search bases, and the mapping of directory groups to admin roles - configured in the accompanying ldap.properties file.",
              "Role mapping is the point: directory group membership determines which administrative roles a signed-in admin receives.",
              "A restart of the console is required for the authentication-mode change to take effect; keep a break-glass path in mind when moving away from native accounts.",
            ],
          },
          {
            id: "2.03",
            text: "Describe how to install or upgrade the PingFederate license.",
            relatedArticles: ["pingfederate-operational-hygiene"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - license management", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "The license arrives as a license file from Ping Identity; the initial setup imports it, and later replacements are imported from the admin console's license page (no restart needed for a console import).",
              "The license can also be placed directly in the server's configuration directory when scripting or automating installs.",
              "The console surfaces license details - product edition, expiration - and the server warns as expiration approaches; connection or feature limits depend on the license type.",
              "Version upgrades commonly require a license issued for the new major version: check license validity as part of every upgrade plan.",
            ],
          },
          {
            id: "2.04",
            text: "Describe the use of native accounts in PingFederate or how Role-Based Access Controls are used to manage administrative functionality.",
            relatedArticles: ["pingfederate-admin-access-and-rbac"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - administrative accounts and roles", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Native accounts are created and managed in the admin console; each account is assigned one or more administrative roles rather than blanket access.",
              "The role set to know: User Admin (manages admin accounts), Admin (configuration changes), Expression Admin (may author OGNL expressions - gated separately because expressions execute code), Auditor (view-only), and the cryptographic role for key and certificate management.",
              "Roles combine: a working administrator typically holds Admin plus whatever else the job needs; Auditor is exclusive by nature (view-only).",
              "The same role model applies when console authentication is external (LDAP/RADIUS/certificate): the external identity is mapped onto these roles.",
            ],
          },
          {
            id: "2.05",
            text: "Describe how to configure runtime notifications.",
            relatedArticles: ["pingfederate-operational-hygiene"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - notifications", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "PingFederate can notify administrators of operational events - certificate expiration and licensing events are the classic examples.",
              "Delivery goes through notification publishers (SMTP-based email being the standard one); a publisher instance is configured once and selected wherever notifications are needed.",
              "Certificate-expiration warnings are the exam-favorite scenario: configure the publisher, then enable notifications so expiring runtime certificates alert before they break partners.",
              "Runtime state can additionally be watched via the heartbeat endpoint for monitoring systems - notifications cover events, the heartbeat covers liveness.",
            ],
          },
          {
            id: "2.06",
            text: "Describe how to manage configuration archive creation and retention.",
            relatedArticles: ["pingfederate-operational-hygiene"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - configuration archive", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "The configuration archive (data.zip) is the full export of a server's configuration: export and import live in the admin console, and importing an archive replaces the configuration wholesale.",
              "PingFederate also snapshots configuration automatically when changes are deployed, retaining recent archives on disk under the server's data directory - the built-in undo.",
              "Retention of those automatic archives is configurable; treat archives as sensitive material (they contain the configuration, including references to credentials) and back them up accordingly.",
              "Archives are the supported mechanism for config backup, migration between environments, and disaster recovery of a node.",
            ],
          },
          {
            id: "2.07",
            text: "Describe the server endpoints.",
            relatedArticles: ["pingfederate-endpoints-map"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - endpoints reference", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Two families: administrative endpoints on the console port (the admin console app and the administrative API under /pf-admin-api, with interactive API docs available), and runtime application endpoints on the engine port.",
              "Runtime SSO application endpoints live under /idp and /sp (startSSO, startSLO, and the protocol endpoints); OAuth authorization-server endpoints live under /as; OIDC adds userinfo and discovery paths.",
              "The heartbeat endpoint (/pf/heartbeat.ping) answers on the runtime port for load balancers and monitoring.",
              "Knowing which port and path family an endpoint belongs to - admin vs runtime - is the recurring exam angle.",
            ],
          },
          {
            id: "2.08",
            text: "Describe how to manage SSL certificates, Certificate Authorities, and Certificate Signing Requests.",
            relatedArticles: ["certificate-signing-request", "certificate-formats", "certificate-validation"],
            relatedTools: ["x509", "csr-decoder"],
            manualLinks: [{ label: "PingFederate documentation - certificate management", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Security > Certificate & Key Management is the home: SSL server certificates (with separate activation for the admin console vs the runtime), trusted Certificate Authorities, and the signing/decryption keys used for SAML and OAuth.",
              "The CSR workflow: generate a key pair on the server, export the Certificate Signing Request, have the CA sign it, then import the signed response back onto the same entry - the private key never leaves.",
              "Trusted CA entries are what let PingFederate validate certificates presented by partners and back-channel connections; missing intermediates are a classic trust failure.",
              "Rotation discipline: activate new certificates ahead of expiry, and pair this objective with runtime notifications (2.05) so expiry never arrives unannounced.",
            ],
          },
          {
            id: "2.09",
            text: "Describe how to configure or manage LDAP and JDBC external data stores.",
            relatedArticles: ["pingfederate-data-stores", "ldap-fundamentals", "scim-overview"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - data stores", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Data stores are reusable connection definitions consumed by credential validators, attribute lookups, and provisioning - configure once, reference everywhere.",
              "LDAP data stores: directory type, one or more host entries for failover, service-account bind credentials, and LDAPS/secure options; the directory schema drives later attribute lookups.",
              "JDBC data stores: the JDBC connection URL, credentials, and a validation query - and the matching JDBC driver JAR must be deployed into the server's library directory before the store can connect.",
              "Failover and connection testing are built into the definitions; runtime behavior degrades predictably when a store is down, which is why validation queries and multiple LDAP hosts matter.",
            ],
          },
          {
            id: "2.10",
            text: "Determine how to configure Password Credential Validators or any of the following adapters: HTML Form Adapter, HTTP Basic Adapter, Kerberos Adapter, OpenToken Adapter, Reference ID Adapter",
            relatedArticles: ["pingfederate-authentication-adapters", "kerberos-and-spnego", "ldap-fundamentals"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - authentication (PCVs and adapters)", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Password Credential Validators (PCVs) verify username/password against a source - the LDAP Username PCV being the workhorse - and are consumed by adapters rather than used directly.",
              "HTML Form Adapter: the interactive branded login page; chains one or more PCVs, and owns the classic account-service features (lockout tracking, password change and reset flows, remember-my-username).",
              "HTTP Basic Adapter: the 401 browser challenge backed by a PCV - no page, no session niceties; for APIs and legacy clients.",
              "Kerberos Adapter: silent desktop SSO via SPNEGO/IWA - requires the realm and KDC details plus a service account/keytab on the PingFederate side and browser configuration on the client side.",
              "OpenToken Adapter: the integration-kit pattern - passes the authenticated identity to (or from) an application as an encrypted OpenToken via cookie, query parameter, or POST.",
              "Reference ID Adapter: the agentless pattern - the application exchanges a short-lived reference with PingFederate over a secured back-channel drop-off/pick-up API instead of parsing tokens itself.",
            ],
          },
          {
            id: "2.11",
            text: "Describe the locations, purposes, and logging levels for different PingFederate log files.",
            relatedArticles: ["pingfederate-log-files"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - log files", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "All logs live in <pf_install>/pingfederate/log. The cast: server.log (the main application log), admin.log (administrator actions in the console), admin-api.log (administrative API calls), transaction.log (runtime protocol transaction summaries), audit.log (runtime authentication and security events), provisioner.log, init.log, and the HTTP request log.",
              "Security-event tracking pairs audit.log (who authenticated, how, and with what result) with transaction.log (per-transaction protocol summaries) - the two to name for tracking security-related events and transaction history.",
              "Verbosity is controlled per logger in server/default/conf/log4j2.xml with the standard level ladder (TRACE, DEBUG, INFO, WARN, ERROR); transaction logging additionally has its own configurable detail modes.",
              "Operational habit the exam rewards: admin actions are answered from admin.log, runtime SSO questions from audit/transaction logs, server health from server.log.",
            ],
          },
          {
            id: "2.12",
            text: "Determine how to perform basic configuration of policy trees.",
            relatedArticles: ["pingfederate-authentication-policies"],
            relatedTools: [],
            manualLinks: [{ label: "PingFederate documentation - authentication policies", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Authentication policy trees decide HOW a user authenticates: nodes are authentication sources (adapter instances or IdP connections) and selectors, with Fail and Success branches flowing top-down.",
              "Selectors branch on context without authenticating - by requested application, network range, extended properties, and similar signals - so one tree can route different populations to different sources.",
              "A successful path ends by fulfilling an Authentication Policy Contract (APC): the normalized set of attributes that downstream mappings consume.",
              "Reusable fragments keep trees maintainable: build a common sequence once (for example, form login with second factor) and reference it from multiple policies; policy evaluation order and the fallback to defaults complete the basic picture.",
            ],
          },
        ],
      },
      {
        id: "section-3",
        title: "Section 3: SSO Connections and Attribute Mapping",
        objectives: [
          {
            id: "3.01",
            text: "Explain the difference between mapping attributes at the connection level, the adapter level, and authentication policy contracts.",
            relatedArticles: ["saml-assertions-and-conditions"],
            relatedTools: ["saml-decoder"],
            manualLinks: [{ label: "PingFederate documentation - attribute contracts and mapping", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Three layers, three jobs. Adapter level: the adapter's attribute contract declares what the authentication source emits (and can be extended with additional attributes the adapter can supply).",
              "Authentication Policy Contract (APC) level: the normalization layer - whatever source authenticated the user, the policy fulfills one common contract, so downstream configuration is source-independent.",
              "Connection level: per-partner fulfillment - the SP connection's attribute contract defines what THIS partner's assertion carries, fulfilled from the APC/adapter values, data-store lookups, expressions, or static text.",
              "The design consequence the exam probes: map partner-specific shaping at the connection, keep the APC generic, and let adapters stay ignorant of partners - changing one partner then never touches the others.",
            ],
          },
          {
            id: "3.02",
            text: "Describe the SSO endpoints and variables.",
            relatedArticles: ["saml-bindings-and-sso-initiation"],
            relatedTools: ["saml-decoder"],
            manualLinks: [{ label: "PingFederate documentation - SSO application endpoints", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Application endpoints start flows: /idp/startSSO.ping begins an IdP-initiated SSO transaction; /sp/startSSO.ping begins an SP-initiated one. Their SLO twins are /idp/startSLO.ping and /sp/startSLO.ping.",
              "The variables to know cold: PartnerSpId (which SP connection, on the IdP start), PartnerIdpId (which IdP connection, on the SP start), and TargetResource (where the user should land after SSO - the deep link).",
              "Protocol endpoints then carry SAML itself: the IdP's SSO service and the SP's Assertion Consumer Service receive the protocol messages the start endpoints set in motion.",
              "Reading a start-URL and stating which side initiates, which partner is addressed, and where the user lands is exactly the exam's use of this objective.",
            ],
          },
          {
            id: "3.03",
            text: "Define the difference between IdP-initiated and SP-initiated connections and when each is used.",
            relatedArticles: ["saml-bindings-and-sso-initiation", "saml-overview"],
            relatedTools: ["saml-decoder"],
            manualLinks: [{ label: "PingFederate documentation - IdP and SP configuration", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "IdP-initiated: the flow starts at the identity provider (portal link, /idp/startSSO.ping) and sends an unsolicited assertion to the SP - no AuthnRequest exists.",
              "SP-initiated: the user arrives at the service provider first; the SP issues an AuthnRequest to the IdP, authentication happens, and the assertion answers that specific request (with RelayState preserving the destination).",
              "When each fits: IdP-initiated suits portal launchpads; SP-initiated suits bookmarks and deep links into the application and is required whenever the SP insists on validating that it asked (many SPs accept only solicited assertions).",
              "TargetResource on the start endpoints and RelayState in the protocol are the deep-link carriers - same purpose, different layer.",
            ],
          },
        ],
      },
      {
        id: "section-4",
        title: "Section 4: OAuth and OIDC Configuration",
        objectives: [
          {
            id: "4.01",
            text: "Describe the purpose and use of OAuth Scopes, Token Managers, Clients, and Endpoints.",
            relatedArticles: ["oauth-tokens", "oauth-client-types", "jwt-anatomy"],
            relatedTools: ["jwt"],
            manualLinks: [{ label: "PingFederate documentation - OAuth configuration", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Scopes are named permissions with descriptions (shown at consent): common scopes are available to all clients, exclusive scopes only to the clients explicitly granted them.",
              "Access Token Managers (ATMs) define what an access token IS: Internally Managed Reference issues opaque tokens the resource must introspect; the JSON Web Token manager issues self-contained signed JWTs. The ATM's attribute contract decides what the token carries.",
              "Clients are the registered applications: client ID, an authentication method for confidential clients (secret, private-key JWT, mutual TLS), redirect URIs, the grant types each may use, and the ATM that mints its tokens.",
              "The authorization-server endpoints live under /as - authorization, token, introspection, and revocation - and knowing which endpoint serves which step of a flow is the recurring question shape.",
            ],
          },
          {
            id: "4.02",
            text: "Determine the appropriate usage for different grant types.",
            relatedArticles: ["oauth-code-flow", "oauth-client-types"],
            relatedTools: ["pkce"],
            manualLinks: [{ label: "PingFederate documentation - grant types", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Authorization Code is the default answer for user-facing applications: browser redirect, code exchanged at the token endpoint - confidential clients authenticate the exchange, public clients protect it with PKCE.",
              "Client Credentials is machine-to-machine: no user, the client authenticates as itself and receives a token representing the client.",
              "Refresh tokens extend sessions without re-authentication and come with rotation/reuse policies; Device Authorization serves input-constrained devices via user-code on a second screen.",
              "Implicit and Resource Owner Password Credentials are the legacy pair: recognize them, know why modern guidance retires them (tokens in front-channel; passwords handled by the client), and prefer code+PKCE in every scenario question.",
            ],
          },
          {
            id: "4.03",
            text: "Describe how to configure OpenID Connect Policy Management.",
            relatedArticles: ["id-token-claims", "oidc-overview"],
            relatedTools: ["oidc", "jwt"],
            manualLinks: [{ label: "PingFederate documentation - OpenID Connect policies", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "An OIDC Policy defines the ID token: its attribute contract (the claims), how each claim is fulfilled from the authentication result and data stores, and inclusion of session-related claims.",
              "Policies are selected per client (with a default policy for the authorization server), so different applications can receive differently shaped ID tokens from the same provider.",
              "ID-token signing and the issuer identity come from the OAuth/OIDC server configuration the policy rides on - the policy shapes content, the server settings shape trust.",
              "Standard claims (sub, iss, aud, exp, auth_time, nonce) arrive from the protocol; the policy's job is the additional identity claims your applications actually consume.",
            ],
          },
          {
            id: "4.04",
            text: "Describe the OpenID Connect endpoints and their purposes.",
            relatedArticles: ["oidc-discovery", "openid-connect"],
            relatedTools: ["oidc", "jwks-explainer"],
            manualLinks: [{ label: "PingFederate documentation - OIDC endpoints", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "Discovery first: /.well-known/openid-configuration publishes the provider's metadata - every other endpoint, the supported scopes, response types, and signing algorithms - so clients configure themselves.",
              "The UserInfo endpoint returns claims about the authenticated user to a caller presenting a valid access token; the JWKS endpoint publishes the public keys that verify ID-token (and JWT access-token) signatures.",
              "Authorization and token endpoints are shared with plain OAuth under /as - OIDC is OAuth with an identity layer, and the endpoint map shows exactly that.",
              "Exam angle: match each endpoint to its consumer - browsers hit authorization, clients hit token and discovery, resource servers hit JWKS or introspection, and UserInfo serves the client after login.",
            ],
          },
          {
            id: "4.05",
            text: "Describe how to use OpenID Connect for SSO.",
            relatedArticles: ["oidc-authorization-code-flow", "oidc-vs-oauth"],
            relatedTools: ["oidc"],
            manualLinks: [{ label: "PingFederate documentation - OIDC use cases", url: "https://docs.pingidentity.com/pingfederate/", version: null }],
            keyPoints: [
              "OIDC as the SSO protocol: the application is an OAuth client (Relying Party), PingFederate is the OpenID Provider, and the authorization-code flow returns an ID token that IS the authentication statement.",
              "The provider session is what makes it single sign-on: the second application's authorization request finds an existing authenticated session and completes without new credentials.",
              "Validation discipline on the RP side: verify the ID token's signature against the JWKS, plus issuer, audience, expiry, and nonce - the checklist that makes the ID token trustworthy.",
              "PingFederate can also sit on the other side - acting as the relying party toward an upstream OIDC provider via an IdP connection - which is how OIDC federates the same way SAML connections do.",
            ],
          },
        ],
      },
    ],
  },
  {
    // Run B scaffold (2026-07-22): certification verified from official Ping
    // sources; the detailed objective list lives in the official per-exam
    // study-guide PDF (Certification Center), pending transcription - hence
    // status "preparing" and no invented sections. Facts below are ONLY what
    // was verified from official pages this session.
    slug: "ping-cp-pingaccess",
    examCode: "PAP-001",
    examName: "Certified Professional - PingAccess",
    vendor: "ping",
    certification: "ping-cp-pingaccess",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official exam description, training.pingidentity.com/certification (verified 2026-07-22); covers PingAccess version 8 or later; a Professional Practice Exam is offered; detailed objectives in the official study-guide PDF, pending transcription",
    status: "preparing",
    examFacts: {
      questions: "70 multiple-choice questions",
      minutes: 90,
      passMark: "64%",
      cost: "Purchased through the Ping Identity Certification Center (regional tax may apply); each voucher is valid for a single attempt",
      note: "Proctored by Kryterion (remote or testing center). Credential valid for 3 years. Validates basic installation and configuration of PingAccess.",
    },
    sections: [],
  },
  {
    // Run B scaffold (2026-07-22): certification verified from official Ping
    // sources; the detailed objective list lives in the official per-exam
    // study-guide PDF (Certification Center), pending transcription - hence
    // status "preparing" and no invented sections. Facts below are ONLY what
    // was verified from official pages this session.
    slug: "ping-cp-pingdirectory",
    examCode: "CP-PingDirectory",
    examName: "Certified Professional - PingDirectory",
    vendor: "ping",
    certification: "ping-cp-pingdirectory",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official exam description, training.pingidentity.com/certification (verified 2026-07-22): validates basic installation, configuration, and maintenance of PingDirectory; question count, duration, and pass mark not captured from official sources this session; detailed objectives in the official study-guide PDF, pending transcription",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Run B scaffold (2026-07-22): certification verified from official Ping
    // sources; the detailed objective list lives in the official per-exam
    // study-guide PDF (Certification Center), pending transcription - hence
    // status "preparing" and no invented sections. Facts below are ONLY what
    // was verified from official pages this session.
    slug: "ping-cp-pingone",
    examCode: "CP-PingOne",
    examName: "Certified Professional - PingOne",
    vendor: "ping",
    certification: "ping-cp-pingone",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official exam description, training.pingidentity.com/certification (verified 2026-07-22); a Professional Practice Exam is offered and topics are published on the exam details page; format facts not fully captured from official sources this session; detailed objectives pending transcription",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Run B scaffold (2026-07-22): certification verified from official Ping
    // sources; the detailed objective list lives in the official per-exam
    // study-guide PDF (Certification Center), pending transcription - hence
    // status "preparing" and no invented sections. Facts below are ONLY what
    // was verified from official pages this session.
    slug: "ping-cp-pingone-davinci",
    examCode: "CP-PingOne-DaVinci",
    examName: "Certified Professional - PingOne DaVinci",
    vendor: "ping",
    certification: "ping-cp-pingone-davinci",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official program roster, Ping Identity Certification Guide (verified 2026-07-22); a Professional Practice Exam is offered; format facts not captured from official sources this session; detailed objectives pending transcription",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Run B scaffold (2026-07-22): certification verified from official Ping
    // sources; the detailed objective list lives in the official per-exam
    // study-guide PDF (Certification Center), pending transcription - hence
    // status "preparing" and no invented sections. Facts below are ONLY what
    // was verified from official pages this session.
    slug: "ping-cp-pingam",
    examCode: "CP-PingAM",
    examName: "Certified Professional - PingAM",
    vendor: "ping",
    certification: "ping-cp-pingam",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official exam details page, training.pingidentity.com/certification (verified 2026-07-22); exam based on PingAM version 7; required preparation: AM-410 PingAM Deep Dive; recommended: AM-421 PingAM Customization and APIs; detailed objectives pending transcription",
    status: "preparing",
    examFacts: {
      questions: "100 multiple-choice questions",
      minutes: 120,
      passMark: "66%",
      cost: "Purchased through the Ping Identity Certification Center (regional tax may apply); each voucher is valid for a single attempt",
      note: "Proctored by Kryterion. Credential valid for 3 years. Validates install, configure, administer, troubleshoot, and maintain for PingAM (formerly ForgeRock Access Management).",
    },
    sections: [],
  },
  {
    // Run B scaffold (2026-07-22): certification verified from official Ping
    // sources; the detailed objective list lives in the official per-exam
    // study-guide PDF (Certification Center), pending transcription - hence
    // status "preparing" and no invented sections. Facts below are ONLY what
    // was verified from official pages this session.
    slug: "ping-cp-pingone-aic",
    examCode: "CP-PingOne-AIC",
    examName: "Certified Professional - PingOne Advanced Identity Cloud",
    vendor: "ping",
    certification: "ping-cp-pingone-aic",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official exam details page + official study guide, training.pingidentity.com/certification (verified 2026-07-22); recommended courses AIC-330, AIC-410, AIC-420; working knowledge of OAuth 2.0, OpenID Connect, and SAML 2.0 expected; detailed objectives pending transcription from the official study-guide PDF",
    status: "preparing",
    examFacts: {
      questions: "60-70 multiple-choice questions",
      minutes: 90,
      passMark: "70.00%",
      cost: "Purchased through the Ping Identity Certification Center (regional tax may apply); each voucher is valid for a single attempt",
      note: "Proctored by Kryterion. Credential valid for 2 years. Validates configure, administer, troubleshoot, and maintain for Advanced Identity Cloud tenants (formerly ForgeRock Identity Cloud).",
    },
    sections: [],
  },
  {
    // Run B scaffold (2026-07-22): certification verified from official Ping
    // sources; the detailed objective list lives in the official per-exam
    // study-guide PDF (Certification Center), pending transcription - hence
    // status "preparing" and no invented sections. Facts below are ONLY what
    // was verified from official pages this session.
    slug: "ping-cp-pingidm",
    examCode: "CP-PingIDM",
    examName: "Certified Professional - PingIDM",
    vendor: "ping",
    certification: "ping-cp-pingidm",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official exam description, training.pingidentity.com/certification (verified 2026-07-22); detailed objectives pending transcription",
    status: "preparing",
    examFacts: {
      questions: "100 multiple-choice questions",
      minutes: 120,
      passMark: "66.00%",
      cost: "Purchased through the Ping Identity Certification Center (regional tax may apply); each voucher is valid for a single attempt",
      note: "Credential valid for 3 years. Validates install, configure, administer, troubleshoot, and maintain for PingIDM (formerly ForgeRock Identity Management).",
    },
    sections: [],
  },
  {
    // Run B scaffold (2026-07-22): certification verified from official Ping
    // sources; the detailed objective list lives in the official per-exam
    // study-guide PDF (Certification Center), pending transcription - hence
    // status "preparing" and no invented sections. Facts below are ONLY what
    // was verified from official pages this session.
    slug: "ping-cp-pingone-idg",
    examCode: "CP-PingOne-IDG",
    examName: "Certified Professional - PingOne Identity Governance",
    vendor: "ping",
    certification: "ping-cp-pingone-idg",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official program roster, Ping Identity Certification Guide (verified 2026-07-22); delivered on PingOne Advanced Identity Cloud with Identity Governance functionality; format facts not captured from official sources this session; detailed objectives pending transcription",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Expert tier (PRIME ruling 2026-07-22). Existence and delivery model
    // verified from the official Certification Guide; per-exam blueprints
    // pending the official study-guide PDFs - status preparing, no invented
    // objectives or facts.
    slug: "ping-ce-pingfederate",
    examCode: "CE-PingFederate",
    examName: "Certified Expert - PingFederate",
    vendor: "ping",
    certification: "ping-ce-pingfederate",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official Certification Guide roster (verified 2026-07-22): Certified Expert exams are multiple-choice or practical lab-based, targeting advanced administration and deployment; per-exam format and detailed objectives pending the official study-guide PDF",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Expert tier (PRIME ruling 2026-07-22). Existence and delivery model
    // verified from the official Certification Guide; per-exam blueprints
    // pending the official study-guide PDFs - status preparing, no invented
    // objectives or facts.
    slug: "ping-ce-pingaccess",
    examCode: "CE-PingAccess",
    examName: "Certified Expert - PingAccess",
    vendor: "ping",
    certification: "ping-ce-pingaccess",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official Certification Guide roster (verified 2026-07-22): Certified Expert exams are multiple-choice or practical lab-based, targeting advanced administration and deployment; per-exam format and detailed objectives pending the official study-guide PDF",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Expert tier (PRIME ruling 2026-07-22). Existence and delivery model
    // verified from the official Certification Guide; per-exam blueprints
    // pending the official study-guide PDFs - status preparing, no invented
    // objectives or facts.
    slug: "ping-ce-pingdirectory",
    examCode: "CE-PingDirectory",
    examName: "Certified Expert - PingDirectory",
    vendor: "ping",
    certification: "ping-ce-pingdirectory",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official Certification Guide roster (verified 2026-07-22): Certified Expert exams are multiple-choice or practical lab-based, targeting advanced administration and deployment; per-exam format and detailed objectives pending the official study-guide PDF",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Expert tier (PRIME ruling 2026-07-22). Existence and delivery model
    // verified from the official Certification Guide; per-exam blueprints
    // pending the official study-guide PDFs - status preparing, no invented
    // objectives or facts.
    slug: "ping-ce-pingone",
    examCode: "CE-PingOne",
    examName: "Certified Expert - PingOne",
    vendor: "ping",
    certification: "ping-ce-pingone",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official Certification Guide roster (verified 2026-07-22): Certified Expert exams are multiple-choice or practical lab-based, targeting advanced administration and deployment; per-exam format and detailed objectives pending the official study-guide PDF",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Expert tier (PRIME ruling 2026-07-22). Existence and delivery model
    // verified from the official Certification Guide; per-exam blueprints
    // pending the official study-guide PDFs - status preparing, no invented
    // objectives or facts.
    slug: "ping-ce-pingone-aic",
    examCode: "CE-PingOne-AIC",
    examName: "Certified Expert - PingOne Advanced Identity Cloud",
    vendor: "ping",
    certification: "ping-ce-pingone-aic",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official Certification Guide roster (verified 2026-07-22): Certified Expert exams are multiple-choice or practical lab-based, targeting advanced administration and deployment; per-exam format and detailed objectives pending the official study-guide PDF",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Expert tier (PRIME ruling 2026-07-22). Existence and delivery model
    // verified from the official Certification Guide; per-exam blueprints
    // pending the official study-guide PDFs - status preparing, no invented
    // objectives or facts.
    slug: "ping-ce-pingam",
    examCode: "CE-PingAM",
    examName: "Certified Expert - PingAM",
    vendor: "ping",
    certification: "ping-ce-pingam",
    targetVersion: null,
    blueprintSourceUrl: "https://training.pingidentity.com/certification",
    blueprintSourceLabel: "Official Certification Guide roster (verified 2026-07-22): Certified Expert exams are multiple-choice or practical lab-based, targeting advanced administration and deployment; per-exam format and detailed objectives pending the official study-guide PDF",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    slug: "f5-cts-ltm-base-config-networking",
    examCode: "F5CTSLTM1-B",
    examName: "BIG-IP LTM Specialist Base Configuration and Networking Setup",
    vendor: "f5",
    certification: "f5-cts-ltm",
    targetVersion: null,
    blueprintSourceUrl: "https://support.education.f5.com/hc/en-us/article_attachments/47506970938907",
    blueprintSourceLabel: "Official beta blueprint F5CTSLTM.032026.BETA (valid March-April 2026; beta exams until 2026-07-31), relayed by PRIME 2026-07-21",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "Exam F5CTSLTM1-B: BIG-IP LTM Specialist Base Configuration and Networking Setup",
        objectives: [
          {
            id: "F5CTSLTM1.01",
            text: "Determine whether or not an application can be deployed with only the LTM module provisioned",
            relatedArticles: ["bigip-profiles-on-a-virtual-server", "ltm-virtual-server-types"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify the functionality of LTM configuration objects",
              "Identify LTM profile settings to deploy an application",
              "Determine capabilities of LTM configuration objects",
            ],
          },
          {
            id: "F5CTSLTM1.02",
            text: "Identify the difference between deployments (e.g., one arm, two arm, nPath/ Direct Server Return/DSR)",
            relatedArticles: ["bigip-snat-and-return-traffic"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify configuration objects needed for L2/L3 nPath/DSR routing",
              "Determine how the IP address changes when using nPath/DSR",
              "Determine how IP addresses change when using a full proxy deployment",
              "Plan the network considerations for one arm and two arm deployments",
              "Understand the importance of auto last-hop",
            ],
          },
          {
            id: "F5CTSLTM1.03",
            text: "Determine how to secure Self Ips",
            relatedArticles: ["bigip-packet-filters", "bigip-management-access-port-lockdown", "bigip-management-access-port-lockdown"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify which administrative services need to be accessible",
              "Identify which configurations objects are allowing accessibility",
              "Identify which services must be enabled for HA availability between devices",
              "Make use of port lockdown",
            ],
          },
          {
            id: "F5CTSLTM1.04",
            text: "Determine how to perform basic device configuration",
            relatedArticles: ["bigip-management-access-port-lockdown", "bigip-system-services"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify how to synch time/date amongst LTM devices",
              "Determine how to limit administrative access to LTM device (GUI/CLI)",
              "Identify how to restrict access to administrative partitions",
            ],
          },
          {
            id: "F5CTSLTM1.05",
            text: "Understand route domains",
            relatedArticles: ["bigip-route-domains"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain the functionality of route domains",
            ],
          },
          {
            id: "F5CTSLTM1.06",
            text: "Interpret log file messages and/or command line output to identify LTM device issues",
            relatedArticles: ["bigip-service-check-date", "bigip-qkview-and-ihealth", "bigip-log-files-map", "bigip-log-files-map", "bigip-qkview-and-ihealth"],
            relatedTools: ["f5-service-check-date"],
            manualLinks: [],
            keyPoints: [
              "Interpret log file messages to identify LTM device configuration issues",
              "Interpret the qkview heuristic results",
              "Identify appropriate methods to troubleshoot protocols that support the platform (e.g. NTP, DNS, SNMP, SMTP, SSH, FTP, SYSLOG)",
              "Identify license problems based on the log file messages and statistics",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "f5-cts-ltm-virtual-servers-config-objects",
    examCode: "F5CTSLTM2-B",
    examName: "BIG-IP LTM Specialist Virtual Server and Local Traffic Configuration Objects",
    vendor: "f5",
    certification: "f5-cts-ltm",
    targetVersion: null,
    blueprintSourceUrl: "https://support.education.f5.com/hc/en-us/article_attachments/47506970938907",
    blueprintSourceLabel: "Official beta blueprint F5CTSLTM.032026.BETA (valid March-April 2026; beta exams until 2026-07-31), relayed by PRIME 2026-07-21",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "Exam F5CTSLTM2-B: BIG-IP LTM Specialist Virtual Server and Local Traffic Configuration Objects",
        objectives: [
          {
            id: "F5CTSLTM2.01",
            text: "Determine which configuration objects are necessary to deploy an application",
            relatedArticles: ["bigip-profiles-on-a-virtual-server", "ltm-virtual-server-types"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine least amount of configuration objects needed to deploy application",
              "Understand dependencies of configuration objects",
              "Understand needed LTM profiles to deploy an application",
              "Identify unnecessary configurations objects",
              "Understand the differences between virtual servers and virtual addresses",
            ],
          },
          {
            id: "F5CTSLTM2.02",
            text: "Choose correct profiles and settings to fit application requirements",
            relatedArticles: ["bigip-oneconnect-connection-reuse", "bigip-l4-protocol-profiles"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify LTM profile settings to deploy OneConnect",
              "Determine which profiles are needed to deploy an application",
              "Compare and contrast different communication protocols (TCP, UDP, FastL4)",
              "Compare performance impact of LTM profile settings",
            ],
          },
          {
            id: "F5CTSLTM2.03",
            text: "Choose virtual server type and load balancing type to fit application requirements",
            relatedArticles: ["ltm-virtual-server-types", "ltm-load-balancing-methods"],
            relatedTools: ["bigip-ltm-lb-simulator"],
            manualLinks: [],
            keyPoints: [
              "Determine the difference between L2-L3 virtual servers",
              "Compare and contrast standard and fastL4 virtual server types",
              "Compare and contrast different load balancing methods",
              "Identify different load balancing method use cases",
            ],
          },
          {
            id: "F5CTSLTM2.04",
            text: "Determine how to architect and deploy multi-tier applications using LTM",
            relatedArticles: ["bigip-snat-and-return-traffic", "f5-clientssl-vs-serverssl"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Understand connection-based architecture and when/how to apply SNAT/persistence/SSL settings in a multi-tiered environment",
              "Identify which device handles specific configuration objects in a multi-tiered deployment",
            ],
          },
          {
            id: "F5CTSLTM2.05",
            text: "Distinguish between packet-based versus connection-based load balancing",
            relatedArticles: ["ltm-virtual-server-types"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Demonstrate when to use packet-based load balancing",
              "Demonstrate when to use connection-based load balancing",
            ],
          },
          {
            id: "F5CTSLTM2.06",
            text: "Determine which configuration objects are necessary for applications that need the original client IP address",
            relatedArticles: ["bigip-snat-and-return-traffic"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine when SNAT is required",
              "Determine the required SNAT type",
              "Identify functions of X-forwarded-for",
              "Outline the steps needed to return the traffic to LTM without SNAT",
            ],
          },
          {
            id: "F5CTSLTM2.07",
            text: "Identify the matching order of multiple virtual servers",
            relatedArticles: ["bigip-ltm-request-distribution"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify which virtual server would process particular traffic",
              "Identify why the virtual server fails to receive traffic",
            ],
          },
          {
            id: "F5CTSLTM2.08",
            text: "Determine how to secure virtual servers",
            relatedArticles: ["bigip-syn-flood-protection", "bigip-packet-filters"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine how to limit access to virtual servers",
              "Compare and contrast different virtual server types",
              "Identify LTM profiles setting to limit access to virtual server resources",
            ],
          },
          {
            id: "F5CTSLTM2.09",
            text: "Determine how configuration changes affect existing and new connections",
            relatedArticles: ["ltm-persistence-methods", "bigip-connection-eviction-policies"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Predict persistence for existing connections",
              "Calculate when changes will affect the connections",
              "Predict load balancing and persistence for new connections",
              "Determine the impact of virtual server configuration change on traffic",
            ],
          },
          {
            id: "F5CTSLTM2.10",
            text: "Given a scenario, determine the appropriate profile setting modifications",
            relatedArticles: ["bigip-l4-protocol-profiles", "http-versions-09-to-3"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Given a scenario determine when an application would benefit from HTTP Compression and/or Web Acceleration profile depending on HTTP version",
              "Given a scenario of client or server-side buffer issues, packet loss, or congestion, select the appropriate TCP or UDP profile to correct the issue",
            ],
          },
          {
            id: "F5CTSLTM2.11",
            text: "Given a sub-set of an LTM configuration, determine which objects to remove or consolidate to simplify the LTM configuration",
            relatedArticles: ["irule-events-modules-and-profiles"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Evaluate which iRules can be replaced with a profile or policy setting",
              "Evaluate which host virtual servers would be better consolidated into a network virtual server or traffic",
            ],
          },
          {
            id: "F5CTSLTM2.12",
            text: "Given a set of LTM device statistics, determine which objects to remove or consolidate to simplify the LTM configuration",
            relatedArticles: ["bigip-reading-device-status"],
            relatedTools: ["f5-tmsh-config-explainer"],
            manualLinks: [],
            keyPoints: [
              "Identify redundant and/or unused objects",
              "Identify unnecessary monitoring",
              "Interpret configuration and performance statistics",
              "Describe the outcome of removing functions from the LTM device configuration",
            ],
          },
          {
            id: "F5CTSLTM2.13",
            text: "Given a packet capture, identify monitor issues",
            relatedArticles: ["ltm-health-monitors", "bigip-tcpdump-syntax"],
            relatedTools: ["f5-bigip-tcpdump-builder"],
            manualLinks: [],
            keyPoints: [
              "Explain how to capture and interpret monitor traffic using protocol analyzer",
              "Explain how to obtain needed input and output data to create the monitors",
            ],
          },
          {
            id: "F5CTSLTM2.14",
            text: "Given a monitor issue, determine an appropriate solution",
            relatedArticles: ["ltm-health-monitors"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine appropriate monitor and monitor timing based on application and server limitations",
              "Describe how to modify monitor settings to resolve monitor problems",
              "Describe when In-TMM monitoring should be applied",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "f5-cts-ltm-irules-analytics-templates",
    examCode: "F5CTSLTM3-B",
    examName: "BIG-IP LTM Specialist iRules, Analytics and Templates",
    vendor: "f5",
    certification: "f5-cts-ltm",
    targetVersion: null,
    blueprintSourceUrl: "https://support.education.f5.com/hc/en-us/article_attachments/47506970938907",
    blueprintSourceLabel: "Official beta blueprint F5CTSLTM.032026.BETA (valid March-April 2026; beta exams until 2026-07-31), relayed by PRIME 2026-07-21",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "Exam F5CTSLTM3-B: BIG-IP LTM Specialist iRules, Analytics and Templates",
        objectives: [
          {
            id: "F5CTSLTM3.01",
            text: "Given a basic iRule's functionality, determine the profiles and configuration options necessary to implement the iRule",
            relatedArticles: ["irule-events-modules-and-profiles", "ltm-persistence-methods"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine what virtual server profile is necessary",
              "Determine when persistence profile is necessary",
            ],
          },
          {
            id: "F5CTSLTM3.02",
            text: "Describe how to deploy applications using templates",
            relatedArticles: ["bigip-iapps-and-fast"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Recognize how to modify an application deployed with an iApp",
              "Recognize how to modify an application deployed with FAST",
              "Identify objects created by a template",
            ],
          },
          {
            id: "F5CTSLTM3.03",
            text: "Determine which iRule to use to resolve an application issue",
            relatedArticles: ["irule-event-order-explained", "irules-branching-and-lookups"],
            relatedTools: ["f5-irules-runtime-calculator"],
            manualLinks: [],
            keyPoints: [
              "Determine which iRule events and commands to use",
              "Given a specific iRule event determine what commands are available",
            ],
          },
          {
            id: "F5CTSLTM3.04",
            text: "Explain the functionality of a simple iRule",
            relatedArticles: ["irule-priority-and-event-order", "irules-performance-and-timing"],
            relatedTools: ["f5-irules-performance-linter"],
            manualLinks: [],
            keyPoints: [
              "Interpret information in iRule logs to determine the iRule and iRule events where they occurred",
              "Describe the results of iRule errors",
            ],
          },
          {
            id: "F5CTSLTM3.05",
            text: "Given specific traffic and configuration containing a simple iRule determine the result of the iRule on the traffic",
            relatedArticles: ["irule-clientside-vs-serverside", "irule-fastl4-vs-standard-events"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Use an iRule to resolve application issues related to traffic steering and/or application data",
            ],
          },
          {
            id: "F5CTSLTM3.06",
            text: "Interpret AVR and/or Telemetry on application behavior to identify performance issues or application attacks",
            relatedArticles: ["bigip-telemetry-streaming-ts"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain how to modify profile settings using information from the AVR",
              "Explain how to use advanced filters to narrow output data from AVR",
              "Identify potential latency increases within an application",
            ],
          },
          {
            id: "F5CTSLTM3.07",
            text: "Interpret AVR information to identify LTM device misconfiguration",
            relatedArticles: ["bigip-telemetry-streaming-ts"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain how latency trends identify application tier bottlenecks",
              "Explain how to use AVR to trace application traffic",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "f5-cts-ltm-upgrades-ha-monitoring",
    examCode: "F5CTSLTM4-B",
    examName: "BIG-IP LTM Specialist Software Upgrades, HA Configuration, and Device Monitoring",
    vendor: "f5",
    certification: "f5-cts-ltm",
    targetVersion: null,
    blueprintSourceUrl: "https://support.education.f5.com/hc/en-us/article_attachments/47506970938907",
    blueprintSourceLabel: "Official beta blueprint F5CTSLTM.032026.BETA (valid March-April 2026; beta exams until 2026-07-31), relayed by PRIME 2026-07-21",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "Exam F5CTSLTM4-B: BIG-IP LTM Specialist Software Upgrades, HA Configuration, and Device Monitoring",
        objectives: [
          {
            id: "F5CTSLTM4.01",
            text: "Determine how to perform a software upgrade while maintaining application availability",
            relatedArticles: ["bigip-inplace-upgrade-and-64bit", "bigip-upgrade-vs-update"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify proper steps to avoid downtime while upgrading LTM software",
              "Determine necessary steps for migrating LTM configuration to new hardware",
              "Understand implications of stopping BIG-IP services",
            ],
          },
          {
            id: "F5CTSLTM4.02",
            text: "Determine how to configure a high availability group of LTM devices to fit the requirements",
            relatedArticles: ["bigip-ha-concepts-device-trust-groups", "bigip-failover-states-and-operations"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Compare and contrast traffic groups vs HA groups",
              "Determine what prevented an expected failover",
              "Identify necessary components for network failover",
            ],
          },
          {
            id: "F5CTSLTM4.03",
            text: "Explain the uses of user roles and administrative partitions",
            relatedArticles: ["bigip-21x-access-identity"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain how to restrict access to LTM using user roles",
              "Discuss the benefits of administrative partitions",
              "Apply user roles to administrative partitions",
            ],
          },
          {
            id: "F5CTSLTM4.04",
            text: "Determine how to deploy or upgrade vCMP guests and how the resources are distributed",
            relatedArticles: ["bigip-vcmp"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain the different vCMP guest deployment states",
              "Discuss the relationship between CPU and memory on vCMP",
              "Select which versions can run on a guest given host version",
              "Understand the relationship of network configuration objects between vCMP hosts and vCMP guests",
            ],
          },
          {
            id: "F5CTSLTM4.05",
            text: "Determine how to deploy or upgrade F5 OS Tenants and how the resources are distributed",
            relatedArticles: ["bigip-21x-whats-new"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain the different F5 OS Tenant deployment states",
              "Discuss the relationship between CPU and memory on F5 OS",
              "Select which versions can run on a guest given host version",
              "Understand the relationship of network configuration objects between F5 OS hosts and F5 OS Tenants",
            ],
          },
          {
            id: "F5CTSLTM4.06",
            text: "Given a scenario, determine the appropriate upgrade and recovery steps required to restore functionality and minimize application outages to LTM devices",
            relatedArticles: ["bigip-inplace-upgrade-and-64bit", "bigip-upgrade-vs-update", "bigip-service-check-date"],
            relatedTools: ["f5-service-check-date"],
            manualLinks: [],
            keyPoints: [
              "Identify the appropriate methods for a clean install",
              "Identify the TMSH sys software install options required to install a new version",
              "Identify the steps required to upgrade the LTM device such as: license renewal, validation of upgrade path, review release notes, etc.",
              "Identify how to copy a config to a previously installed boot location/slot",
              "Identify valid rollback steps for a given upgrade scenario",
              "Explain how to upgrade an LTM device from the GUI",
              "Describe the effect of performing an upgrade in an environment with device groups and traffic groups",
              "Explain how to perform an upgrade in a high availability group",
            ],
          },
          {
            id: "F5CTSLTM4.07",
            text: "Describe the benefits of custom alerting within an LTM environment",
            relatedArticles: ["bigip-custom-alerting"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Describe how to specify the OIDs for alerting",
              "Explain how to log different levels of local traffic message logs",
              "Explain how to trigger custom alerts for testing purposes",
            ],
          },
          {
            id: "F5CTSLTM4.08",
            text: "Describe how to set up custom alerting for an LTM device",
            relatedArticles: ["bigip-custom-alerting"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "List and describe custom alerts: SNMP, email and Remote Syslog",
              "Identify the location of custom alert configuration files",
              "Identify the available levels for local traffic logging",
            ],
          },
          {
            id: "F5CTSLTM4.09",
            text: "Identify the appropriate command to use to determine the cause of an LTM device problem",
            relatedArticles: ["bigip-log-files-map"],
            relatedTools: ["f5-tmsh-config-explainer"],
            manualLinks: [],
            keyPoints: [
              "Identify platform problems based on the log file messages and statistics",
              "Identify resource exhaustion problems based on the log file messages and statistics",
              "Identify connectivity problems based on the log files",
              "Determine the appropriate log file to examine to determine the cause of the problem",
            ],
          },
          {
            id: "F5CTSLTM4.10",
            text: "Analyze performance data to identify a resource problem on an LTM device",
            relatedArticles: ["bigip-cmp-clustered-multiprocessing"],
            relatedTools: ["f5-bigd-thread-calculator"],
            manualLinks: [],
            keyPoints: [
              "Analyze performance data using Linux or TMSH commands and performance graphs to identify a resource problem on an LTM device",
              "Explain how CPU and Memory work between the host OS and TMOS",
            ],
          },
          {
            id: "F5CTSLTM4.11",
            text: "Given a scenario, determine the cause of an LTM device failover",
            relatedArticles: ["bigip-failover-states-and-operations"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain the effect of network failover settings on the LTM device",
              "Differentiate between unicast and multicast network failover modes",
              "Identify the cause of failover using logs and statistics",
            ],
          },
          {
            id: "F5CTSLTM4.12",
            text: "Given a scenario, determine the cause of loss of high availability and/or sync failure",
            relatedArticles: ["bigip-ha-concepts-device-trust-groups", "bigip-config-sync"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain how the high availability concepts relate to one another",
              "Explain the relationship between device trust and device groups",
              "Identify the cause of config sync failures",
              "Explain the relationship between traffic groups and LTM objects",
              "Interpret log messages to determine the cause of high availability issues",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "f5-cts-ltm-pcap-tcp-udp-app",
    examCode: "F5CTSLTM5-B",
    examName: "BIG-IP LTM Specialist Packet Capture/Troubleshooting - TCP/UDP/Application Layer",
    vendor: "f5",
    certification: "f5-cts-ltm",
    targetVersion: null,
    blueprintSourceUrl: "https://support.education.f5.com/hc/en-us/article_attachments/47506970938907",
    blueprintSourceLabel: "Official beta blueprint F5CTSLTM.032026.BETA (valid March-April 2026; beta exams until 2026-07-31), relayed by PRIME 2026-07-21",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "Exam F5CTSLTM5-B: BIG-IP LTM Specialist Packet Capture/Troubleshooting - TCP/UDP/Application Layer",
        objectives: [
          {
            id: "F5CTSLTM5.01",
            text: "Given a set of headers or packet captures, determine the root cause of an HTTP/HTTPS application problem",
            relatedArticles: ["http-versions-09-to-3", "http-query-method"],
            relatedTools: ["http-methods-comparison"],
            manualLinks: [],
            keyPoints: [
              "Explain how to interpret response codes",
              "Explain the function of HTTP headers within different HTTP applications (Cookies, Cache Control, Vary, Content Type & Host)",
              "Explain HTTP methods (GET, POST, etc.)",
              "Explain how to decode POST data",
            ],
          },
          {
            id: "F5CTSLTM5.02",
            text: "Given a scenario, determine which protocol analyzer tool and its options are required to resolve an application issue",
            relatedArticles: ["bigip-tcpdump-safety", "bigip-cmp-clustered-multiprocessing", "bigip-oneconnect-connection-reuse"],
            relatedTools: ["f5-bigip-tcpdump-builder"],
            manualLinks: [],
            keyPoints: [
              "Identify application issues based on a protocol analyzer trace",
              "Explain how to follow a conversation from client-side and server-side packet captures",
              "Identify the different causes of slow traffic (e.g., drops, RSTs, retransmits, ICMP errors, demotion from CMP)",
              "Explain how SNAT and OneConnect effect protocol analyzer's packet captures",
            ],
          },
          {
            id: "F5CTSLTM5.03",
            text: "Given a packet capture, and necessary supporting documentation, determine the root cause of an application problem",
            relatedArticles: ["bigip-tcpdump-syntax"],
            relatedTools: ["f5-bigip-tcpdump-builder"],
            manualLinks: [],
            keyPoints: [
              "Analyze a tcpdump to identify application or configuration problems",
            ],
          },
          {
            id: "F5CTSLTM5.04",
            text: "Given a packet capture, and necessary supporting documentation, determine a solution to an application problem",
            relatedArticles: ["bigip-tcpdump-syntax"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Analyze a tcpdump to identify application or configuration solution",
            ],
          },
        ],
      },
    ],
  },

  {
    slug: "f5-cts-ltm-pcap-tls-ssl",
    examCode: "F5CTSLTM6-B",
    examName: "BIG-IP LTM Specialist Packet Capture/Troubleshooting - TLS/SSL",
    vendor: "f5",
    certification: "f5-cts-ltm",
    targetVersion: null,
    blueprintSourceUrl: "https://support.education.f5.com/hc/en-us/article_attachments/47506970938907",
    blueprintSourceLabel: "Official beta blueprint F5CTSLTM.032026.BETA (valid March-April 2026; beta exams until 2026-07-31), relayed by PRIME 2026-07-21",
    status: "published",
    examFacts: null,
    sections: [
      {
        id: "section-1",
        title: "Exam F5CTSLTM6-B: BIG-IP LTM Specialist Packet Capture/Troubleshooting - TLS/SSL",
        objectives: [
          {
            id: "F5CTSLTM6.01",
            text: "Given a set of headers or packet captures, determine a solution to an HTTP/HTTPS application problem",
            relatedArticles: ["irule-ssl-handshake-events", "f5-ssl-profile-protocol-options"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Investigate the cause of a specific response code",
              "Investigate the cause of an SSLHandshake failure",
              "Predict the browser caching behavior when application data is received (headers and HTML)",
            ],
          },
          {
            id: "F5CTSLTM6.02",
            text: "Given a direct packet capture, a packet capture through the LTM device, and other relevant information, determine the root cause of an HTTP/HTTPS application problem",
            relatedArticles: ["f5-clientssl-vs-serverssl", "f5-cipher-ordering-and-negotiation"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Investigate the cause of an SSLHandshake failure",
              "Given a failed HTTP request and LTM configuration data determine if the connection is failing due to the LTM configuration",
            ],
          },
          {
            id: "F5CTSLTM6.03",
            text: "Given a direct packet capture, a packet capture through the LTM device, and other relevant information, determine a solution to an HTTP/HTTPS application problem",
            relatedArticles: ["f5-ssl-cert-key-chain", "f5-tls13-vs-tls12-ciphers"],
            relatedTools: ["cipher"],
            manualLinks: [],
            keyPoints: [
              "Describe the process to resolve an SSLHandshake failure",
              "Given a failed HTTP request and LTM configuration data determine the LTM configuration remedy",
            ],
          },
          {
            id: "F5CTSLTM6.04",
            text: "Given a scenario, determine from where the protocol analyzer data should be collected",
            relatedArticles: ["bigip-tcpdump-safety", "tls-reverse-proxy-inbound"],
            relatedTools: ["f5-bigip-tcpdump-builder"],
            manualLinks: [],
            keyPoints: [
              "Explain how to decrypt SSL traffic for protocol analysis",
              "Choose the appropriate protocol analyzer for troubleshooting a given problem (e.g., Wireshark, tcpdump)",
              "Identify application issues based on a protocol analyzer packet capture",
            ],
          },
        ],
      },
    ],
  },

  {
    // Zscaler Digital Transformation Administrator (ZDTA). Objectives are the
    // scenario statements VERBATIM from the official ZDTA Study Guide's
    // expansive blueprint (fetched live 2026-07-21 from zscaler.com). The
    // guide presents them grouped; the three sections mirror that grouping
    // exactly, official domain weights named in each title. Facts per the
    // official blueprint PDF: 60 questions, 90 minutes, Professional level,
    // proctored; passing score is not published, so examFacts stays null.
    slug: "zscaler-zdta",
    examCode: "ZDTA",
    examName: "Zscaler Digital Transformation Administrator (ZDTA)",
    vendor: "zscaler",
    certification: "zscaler-zdta",
    targetVersion: null,
    blueprintSourceUrl: "https://www.zscaler.com/resources/brochures/zscaler-digital-transformation-admin-study-guide.pdf",
    blueprintSourceLabel: "Official ZDTA Study Guide (expansive blueprint) + Exam Blueprint PDF; 60 questions, 90 minutes, Professional level, proctored; recommended preparation: Zscaler for Users - Administrator (EDU-200) course and hands-on lab",
    status: "published",
    examFacts: null,
    sections: [
      { id: "zdta-ud-pm", title: "User & Device Management (18%) and Platform Management (18%)", objectives: [
          {
            id: "ZDTA-A.01",
            text: "Given a scenario including a user's attributes from the IdP, identify the groups they will be placed into, and the policies that will be applied.",
            relatedArticles: ["scim-overview"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.02",
            text: "Identify the steps to assign users to the appropriate groups with the appropriate access using ZIdentity.",
            relatedArticles: ["scim-overview"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.03",
            text: "Given a scenario including creating or modifying a user group in Zscaler Zidentity, identify the next step to ensure policies apply to that group.",
            relatedArticles: ["scim-overview"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.04",
            text: "Given an Administrator Audit Log, interpret the activity or identify unauthorized activity in the Administrator Audit Logs.",
            relatedArticles: ["zscaler-admin-audit-logs"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.05",
            text: "Given a scenario including an organization that has strict BYOD policies, identify the appropriate ZCC deployment option that should be used.",
            relatedArticles: ["proxy-user-authentication-methods", "zia-traffic-forwarding-methods", "zscaler-client-connector-profiles"],
            relatedTools: ["zcc-forwarding-decision-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.06",
            text: "Given a scenario about an exfiltration, identify the next step that should be taken to check the company's posture.",
            relatedArticles: ["zscaler-casb-and-saas-security", "zia-dlp-engines-dictionaries-edm-idm", "zscaler-exfiltration-response-posture"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.07",
            text: "Given a scenario including an organization goal to ensure user devices are compliant before enabling access to the internet or private application, identify the next step that should be taken.",
            relatedArticles: ["zscaler-client-connector-profiles", "zscaler-posture-profiles-and-device-trust"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.08",
            text: "Given a scenario in which an organization requires more stringent access control on traffic originating from off of the corporate network, identify the most logical place to put that policy.",
            relatedArticles: ["zscaler-zero-trust-exchange-architecture", "zia-traffic-forwarding-methods"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.09",
            text: "Given a scenario where an administrator needs to connect to Zscaler a location that requires a certain bandwidth and requirements and no need for HA, identify the type of tunnels that should be used and the minimal amount needed to cover the requisites.",
            relatedArticles: ["vpn-fundamentals", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals", "tunnel-overhead-mtu-and-mss", "zscaler-tunnel-types-z-tunnel-gre-ipsec", "zia-ssl-inspection-policy-and-bypasses", "zia-locations-and-sublocations"],
            relatedTools: ["zscaler-tunnel-chooser", "zscaler-ssl-bypass-planner"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.10",
            text: "Given a merger and acquisition use case, identify the appropriate configurations necessary to ensure seamless access to internet and private applications.",
            relatedArticles: ["nat-explained", "zscaler-mergers-and-acquisitions", "zia-locations-and-sublocations"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.11",
            text: "Given a scenario with an example of misordered firewall rules, identify how the rule set will be executed and identify any unintended risks associated with the rule set order.",
            relatedArticles: ["zia-cloud-firewall-rule-order"],
            relatedTools: ["zscaler-firewall-rule-order-simulator"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.12",
            text: "Given a scenario to deploy ZPA App Connectors in VMs or Containerized environments, identify the necessary information to be communicated to the team.",
            relatedArticles: ["zpa-architecture-app-connectors-service-edges"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
      ] },
      { id: "zdta-psc", title: "Policy & Security Configuration (29%)", objectives: [
          {
            id: "ZDTA-B.01",
            text: "Given a scenario including requirements, identify the appropriate assets where SSL bypass can be implemented.",
            relatedArticles: ["ssl-forward-proxy-interception", "zia-ssl-inspection-policy-and-bypasses"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.02",
            text: "Given a scenario including an application that needs to be accessed, identify the bypass that would allow the application to be accessed in this situation.",
            relatedArticles: ["ssl-forward-proxy-interception", "zia-ssl-inspection-policy-and-bypasses"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.03",
            text: "Given a scenario and an example of a log, identify why access is being allowed despite an expected policy violation.",
            relatedArticles: ["zia-ssl-inspection-policy-and-bypasses", "zia-web-and-firewall-log-fields"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.04",
            text: "Given a scenario about creating and modifying a custom URL category, identify how to achieve a given goal.",
            relatedArticles: ["zia-url-filtering-and-cloud-app-control"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.05",
            text: "Given a scenario about applying URL filtering rules to users/groups, identify how to achieve a given goal.",
            relatedArticles: ["zia-url-filtering-and-cloud-app-control"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.06",
            text: "Given a sandbox scenario including a desired outcome, identify the next action that should be taken.",
            relatedArticles: ["zia-file-type-control-and-sandbox", "sandbox-detonation-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.07",
            text: "Given an example sandbox report and organizational requirements, identify the trends in malicious activity over a specific timeframe.",
            relatedArticles: ["zia-file-type-control-and-sandbox"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.08",
            text: "Given a scenario about file type control, identify how to ensure a given category is prioritized correctly.",
            relatedArticles: ["zia-file-type-control-and-sandbox"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.09",
            text: "Given a scenario about applying file type policies and a specific user or group, identify how to apply the correct file type policy based on the roles and security needs.",
            relatedArticles: ["zia-file-type-control-and-sandbox"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.10",
            text: "Given a scenario where various users need to access different applications, identify the App Segments that enable proper least privileged access.",
            relatedArticles: ["zpa-architecture-app-connectors-service-edges", "zpa-app-segments-and-access-policy"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.11",
            text: "Given a scenario where various users need to access different applications, identify the proper access policies to enforce least privileged access.",
            relatedArticles: ["zpa-architecture-app-connectors-service-edges", "zpa-app-segments-and-access-policy"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.12",
            text: "Given a scenario including a content inspection rule, analyze the outcome of the rule, identify the appropriate actions to take, or communicate who should take appropriate actions.",
            relatedArticles: ["zia-dlp-engines-dictionaries-edm-idm", "dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.13",
            text: "Given a scenario including DLP notification, block actions, and a user uploading sensitive data, identify the notification method that should be used.",
            relatedArticles: ["zia-dlp-engines-dictionaries-edm-idm"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.14",
            text: "Given a scenario including problems with unauthorized SaaS Applications in an organization, identify where to find Risky Assets / Potential Shadow IT in the portal.",
            relatedArticles: ["zscaler-casb-and-saas-security"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.15",
            text: "Given a scenario about enforcing granular controls, identify the outcome of an action.",
            relatedArticles: ["zscaler-casb-and-saas-security", "zia-url-filtering-and-cloud-app-control"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.16",
            text: "Given an image of rules in a specific order in the platform, identify how a group's access is impacted.",
            relatedArticles: ["zia-cloud-firewall-rule-order"],
            relatedTools: ["zscaler-firewall-rule-order-simulator"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.17",
            text: "Given a scenario about least privilege access, identify the most effective way to achieve the outcome.",
            relatedArticles: ["zpa-architecture-app-connectors-service-edges", "zpa-app-segments-and-access-policy", "zscaler-posture-profiles-and-device-trust"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.18",
            text: "Given a scenario about the need for defining network segmentation for a private application, identify the most effective network segmentation strategy that should be used.",
            relatedArticles: ["zpa-architecture-app-connectors-service-edges"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.19",
            text: "Given a scenario including a micro-segmentation policy and internal applications, identify how to refine the policy to enhance the security posture for internal applications.",
            relatedArticles: ["zpa-architecture-app-connectors-service-edges", "zpa-app-segments-and-access-policy"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.20",
            text: "Given a scenario including specific requirements for client forwarding policies with client connector, identify the Client Connector Forwarding Profile action that will meet the requirements.",
            relatedArticles: ["how-a-pac-file-chooses-a-proxy", "proxy-user-authentication-methods", "zscaler-client-connector-profiles"],
            relatedTools: ["zcc-forwarding-decision-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.21",
            text: "Given a scenario including requirements for trusted network bypass rules, identify the proper set of client forwarding policies that bypass applications when on a specific network.",
            relatedArticles: ["how-a-pac-file-chooses-a-proxy", "zia-traffic-forwarding-methods", "zscaler-client-connector-profiles"],
            relatedTools: ["zcc-forwarding-decision-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.22",
            text: "Given a scenario about applying posture-based access criteria to enforce device compliance, identify the outcome of the criteria.",
            relatedArticles: ["zscaler-client-connector-profiles"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
      ] },
      { id: "zdta-mon-tir-io", title: "Monitoring, Reporting & Analytics (13%), Troubleshooting & Incident Response (13%), and Integration & Optimization (9%)", objectives: [
          {
            id: "ZDTA-C.01",
            text: "Given a scenario about the need for specific information from web and firewall logs, identify the log type that should be used.",
            relatedArticles: ["zia-web-and-firewall-log-fields", "zscaler-nanolog-nss-and-log-streaming"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.02",
            text: "Given an example audit log, identify indicators of privilege escalation.",
            relatedArticles: ["zscaler-admin-audit-logs"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.03",
            text: "Given a scenario including an executive security summary and a desired goal, identify the appropriate next step given the information in the summary.",
            relatedArticles: ["zscaler-nanolog-nss-and-log-streaming", "zscaler-reports-and-executive-summaries"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.04",
            text: "Given a scenario about tracking application usage over time and performance goals, identify methods to prevent the performance issues.",
            relatedArticles: ["zdx-score-anatomy-and-probes", "zscaler-reports-and-executive-summaries"],
            relatedTools: ["zdx-score-factor-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.05",
            text: "Given a scenario including a goal about connectivity, identify the ZDX diagnostics that should be used to address the goal.",
            relatedArticles: ["zdx-score-anatomy-and-probes", "troubleshooting-zcc-connectivity"],
            relatedTools: ["zdx-score-factor-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.06",
            text: "Given a scenario including a screenshot of a policy rule and the hierarchy, identify the unintended policy interactions.",
            relatedArticles: ["zia-cloud-firewall-rule-order"],
            relatedTools: ["zscaler-firewall-rule-order-simulator"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.07",
            text: "Given a scenario including policy logic and configuration information, identify how to improve the overall platform performance.",
            relatedArticles: ["zia-cloud-firewall-rule-order"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.08",
            text: "Given a scenario including information on known threat actor groups, identify how to block the malicious domains or IPs in Zscaler policies to prevent further compromise.",
            relatedArticles: ["tcp-connection-lifecycle", "zscaler-zero-trust-exchange-architecture"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.09",
            text: "Given a scenario where a private application is intermittently working for the same user, identify a likely cause and solution.",
            relatedArticles: ["zpa-architecture-app-connectors-service-edges", "troubleshooting-zcc-connectivity", "zpa-access-troubleshooting"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.10",
            text: "Given a scenario and information about a system that need updates, identify the steps needed to deploy updates to the system including to the broader user base efficiently and with minimal disruption.",
            relatedArticles: ["zscaler-platform-updates-and-change-management"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
      ] },
    ],
  },
  // ---------------------------------------------------------------------------
  // BIG-IP DNS Specialist (302): objectives and example bullets transcribed
  // VERBATIM from the official F5 exam blueprint (stamp 302.72017), PDF relayed
  // by PRIME 2026-07-21. Catalog Key Info re-verified the same day. Related
  // resources map to the site's GTM/DNS shelf per the ethics guardrail above.
  // ---------------------------------------------------------------------------
  {
    slug: "f5-cts-dns-302",
    examCode: "302",
    examName: "BIG-IP DNS Specialist (302)",
    vendor: "f5",
    certification: "f5-cts-dns",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/big-ip-dns-specialist-302",
    blueprintSourceLabel:
      "Exam blueprint 302.72017 (official PDF, relayed by PRIME 2026-07-21). Catalog Key Info (fetched 2026-07-21): US$180, English, test-center proctored, passing score 245, 90 minutes, Technology Specialist level",
    status: "published",
    examFacts: {
      questions: "80 questions (70 items that are scored, 10 pilot/beta items)",
      minutes: 90,
      passMark: "245 (scaled range 100-350)",
      cost: "US$180 per attempt (not including local taxes and fees)",
      note:
        "Computer-based, multiple-choice; delivered at Pearson VUE test centers (English). Credential awarded: F5 Certified Technology Specialist, BIG-IP DNS. Prerequisite: F5 Certified BIG-IP Administrator (F5-CA).",
    },
    sections: [
      {
        id: "section-1",
        title: "Section 1: DESIGN AND ARCHITECT",
        objectives: [
          {
            id: "1.01",
            text: "Identify customer requirements, constraints, and challenges related to DNS",
            relatedArticles: [
              "dns-message-header-and-flags",
              "dns-record-types-in-answers",
              "bigip-dns-request-processing-order",
            ],
            relatedTools: ["dig-output-explainer"],
            manualLinks: [],
            keyPoints: [
              "Recognize the functionality and limitations of the DNS protocol (e.g., hierarchy, roles)",
              "Determine relevant information to gather regarding a customer's need for high availability, security, and management",
            ],
          },
          {
            id: "1.02",
            text: "Evaluate existing DNS environment for BIG-IP DNS solutions",
            relatedArticles: ["bigip-dns-request-processing-order"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Ascertain specific scope and scale of DNS requirements",
              "Recognize limitations imposed by the existing DNS service provider",
              "Identify change control procedure related the integration of BIG-IP DNS into an existing environment",
            ],
          },
          {
            id: "1.03",
            text: "Determine appropriate deployment and integration strategy for a BIG-IP DNS solution",
            relatedArticles: [
              "gtm-load-balancing-methods",
              "bigip-dns-request-processing-order",
              "dnssec-records-in-dig",
              "ltm-health-monitors",
            ],
            relatedTools: ["f5-gslb-decision-flow", "f5-lb-method-chooser"],
            manualLinks: [],
            keyPoints: [
              "Given a customer environment, requirements, and constraints, select an appropriate deployment model",
              "Given a customer environment, requirements, and constraints, recognize the use case for DNS Express, Zone Runner, DNS 64, DNSSEC, DNS Cache, various load balancing algorithms, persistence, and/or health monitor",
            ],
          },
          {
            id: "1.04",
            text: "Determine performance requirements for a BIG-IP DNS solution",
            relatedArticles: ["gtm-topology-records-and-longest-match", "dnssec-records-in-dig"],
            relatedTools: ["f5-topology-longest-match"],
            manualLinks: [],
            keyPoints: [
              "Relate the performance characteristics of virtual edition and physical hardware to a specific use case",
              "Employ topology load balancing to optimize user experience",
              "Predict the performance implications pertaining to key DNS features (e.g., DNSSEC, topology LB)",
            ],
          },
        ],
      },
      {
        id: "section-2",
        title: "Section 2: IMPLEMENT",
        objectives: [
          {
            id: "2.01",
            text: "Identify configuration options for TMOS and sync groups",
            relatedArticles: [
              "how-iquery-connects-bigip-dns",
              "bigip-interfaces-trunks-vlans-selfips",
              "bigip-config-sync",
            ],
            relatedTools: ["iquery-protocol-explainer"],
            manualLinks: [],
            keyPoints: [
              "Create the proper self-IP configuration, routes, and settings for iQuery communications",
              "Ensure proper NTP operation of all sync group members",
              "Create logging profiles for DNS request and/or response",
            ],
          },
          {
            id: "2.02",
            text: "Identify configure options for GSLB",
            relatedArticles: [
              "gslb-two-tier-pool-then-member",
              "gtm-load-balancing-methods",
              "gtm-topology-records-and-longest-match",
            ],
            relatedTools: ["bigip-dns-gslb-simulator", "f5-gslb-decision-flow", "f5-topology-longest-match"],
            manualLinks: [],
            keyPoints: [
              "Differentiate between, and determine when to use, the two tiers of GSLB pool selection and the three tiers of virtual server selection",
              "Recognize the functionality of various load balancing methods (e.g., static, dynamic, and fallback)",
              "Recognize topology load balancing configuration parameters",
            ],
          },
          {
            id: "2.03",
            text: "Identify configuration options for non-GSLB DNS components",
            relatedArticles: ["bigip-dns-request-processing-order", "bigip-dns-multi-rpz"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine the listener IP and protocol",
              "Configure DNS Express and DNS Cache",
            ],
          },
          {
            id: "2.04",
            text: "Identify the necessary network environment for GSLB operations",
            relatedArticles: ["how-iquery-connects-bigip-dns"],
            relatedTools: ["iquery-protocol-explainer"],
            manualLinks: [],
            keyPoints: [
              "Recognize the significance of source and destination ports for communication between BIG-IP DNS devices",
              "Identify missing/non-functional network configurations when enabling GSLB operation (e.g., iQuery, generic host probing)",
            ],
          },
        ],
      },
      {
        id: "section-3",
        title: "Section 3: TEST AND TROUBLESHOOT",
        objectives: [
          {
            id: "3.01",
            text: "Determine when and how to employ the appropriate network and DNS troubleshooting tools",
            relatedArticles: ["bigip-tcpdump-syntax", "bigip-tcpdump-safety", "reverse-dns-lookups-with-nslookup"],
            relatedTools: [
              "dig-output-explainer",
              "nslookup-output-explainer",
              "f5-bigip-tcpdump-builder",
              "packet-capture-plan-builder",
            ],
            manualLinks: [],
            keyPoints: [
              "Use openssl to review trusted cert information",
              "Use tcpdump to capture and analyze DNS and iQuery traffic on appropriate VLAN and IP",
              "Use dig/nslookup to verify DNS configuration and operation",
            ],
          },
          {
            id: "3.02",
            text: "Diagnose BIG-IP DNS issues",
            relatedArticles: ["how-iquery-connects-bigip-dns", "ltm-health-monitors"],
            relatedTools: ["bigip-dns-gslb-simulator", "fault-hypothesis-builder"],
            manualLinks: [],
            keyPoints: [
              "Investigate root cause for virtual server flapping issue",
              "Analyze DNS request/response pattern to confirm BIG-IP DNS configuration, health monitor an iQuery operation",
            ],
          },
          {
            id: "3.03",
            text: "Analyze system log data and statistics for problem analysis",
            relatedArticles: ["bigip-log-files-map", "bigip-avr-analytics"],
            relatedTools: ["syslog-pri-decoder"],
            manualLinks: [],
            keyPoints: [
              "Verify the status of pools based on relevant log entries",
              "Analyze statistical data to pinpoint any issues regarding query response times",
              "Analyze appropriate log for proper zone transfer operation",
            ],
          },
          {
            id: "3.04",
            text: "Address DNS-related issues based on troubleshooting and log analysis",
            relatedArticles: ["how-iquery-connects-bigip-dns"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Apply config change (e.g., monitor or prober) to remedy flapping of server objects",
              "Address proper IP address choice(s) for iQuery communication between devices",
            ],
          },
        ],
      },
      {
        id: "section-4",
        title: "Section 4: OPERATIONS AND SUPPORT",
        objectives: [
          {
            id: "4.01",
            text: "Identify process to perform BIG-IP DNS configuration backup",
            relatedArticles: ["bigip-ucs-archives"],
            relatedTools: ["f5-tmsh-config-explainer"],
            manualLinks: [],
            keyPoints: [
              "Perform the steps in the GUI to create system archive files",
              "Issue TMSH commands to create system archive files.",
              "Verify file creation and move to remote storage",
            ],
          },
          {
            id: "4.02",
            text: "Identify the prerequisites and procedure for BIG-IP DNS configuration restoration",
            relatedArticles: ["bigip-ucs-archives", "dnssec-records-in-dig"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Recognize the special requirements for restoring configuration data to a BIG-IP DNS RMA unit",
              "Compare configuration objects between a new BIG-IP DNS and existing sync group member",
              "Determine when and how to restore the master encryption keys for TSIG and DNSSEC",
            ],
          },
          {
            id: "4.03",
            text: "Identify various BIG-IP DNS monitoring strategies",
            relatedArticles: ["bigip-avr-analytics", "bigip-custom-alerting", "bigip-telemetry-streaming-ts"],
            relatedTools: ["telemetry-streaming-explainer"],
            manualLinks: [],
            keyPoints: [
              "Configure SNMP polling",
              "Describe and use DNS statistics and DNS analytics",
            ],
          },
          {
            id: "4.04",
            text: "Recognize appropriate procedures for performing BIG-IP DNS software upgrades",
            relatedArticles: [
              "bigip-license-reactivation",
              "bigip-service-check-date",
              "bigip-upgrade-vs-update",
              "bigip-inplace-upgrade-and-64bit",
            ],
            relatedTools: ["f5-service-check-date"],
            manualLinks: [],
            keyPoints: [
              "Recognize the significance of the requirement for license reactivation prior to upgrade",
              "Given a GSLB configuration, predict the potential end-user impact when upgrading a DNS sync group member while it is offline",
              "Validate BIG-IP DNS operation status, post-upgrade",
            ],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // BIG-IP ASM Specialist (303): objectives and example bullets transcribed
  // VERBATIM from the official F5 exam blueprint (stamp 303.72017), PDF relayed
  // by PRIME 2026-07-21. Catalog Key Info fetched the same day. Related
  // resources map to the site's Advanced WAF (AWAF) shelf; ASM is the exam-era
  // name of today's Advanced WAF module, so the mappings carry directly.
  // ---------------------------------------------------------------------------
  {
    slug: "f5-cts-asm-303",
    examCode: "303",
    examName: "BIG-IP ASM Specialist (303)",
    vendor: "f5",
    certification: "f5-cts-asm",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/big-ip-asm-specialist-303",
    blueprintSourceLabel:
      "Exam blueprint 303.72017 (official PDF, relayed by PRIME 2026-07-21). Catalog Key Info (fetched 2026-07-21): US$180, English, test-center proctored, passing score 245, 90 minutes, Technology Specialist level",
    status: "published",
    examFacts: {
      questions: "80 questions (70 items that are scored, 10 pilot/beta items)",
      minutes: 90,
      passMark: "245 (scaled range 100-350)",
      cost: "US$180 per attempt (not including local taxes and fees)",
      note:
        "Computer-based, multiple-choice; delivered at Pearson VUE test centers (English). Credential awarded: F5 Certified Technology Specialist, BIG-IP ASM. Prerequisite: F5 Certified BIG-IP Administrator (F5-CA); the catalog lists F5-CTS, BIG-IP ASM as a prerequisite for the Security Solutions Expert track.",
    },
    sections: [
      {
        id: "section-1",
        title: "Section 1: ARCHITECTURE/DESIGN AND POLICY CREATION",
        objectives: [
          {
            id: "1.01",
            text: "Explain the potential effects of common attacks on web applications",
            relatedArticles: ["awaf-enforcement-mode-blocking-vs-transparent"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Understand and describe how the ASM can affect clients and applications directly while in either transparent or blocking mode",
              "Summarize the OWASP Top Ten",
            ],
          },
          {
            id: "1.02",
            text: "Explain how specific security policies mitigate various web application attacks",
            relatedArticles: ["awaf-enforcement-mode-blocking-vs-transparent", "awaf-false-positives"],
            relatedTools: ["f5-irules-vs-ltm-policy"],
            manualLinks: [],
            keyPoints: [
              "Understand/interpret an iRule or LTM policy to map application traffic to an ASM policy",
              "Explain the trade-offs between security, manageability, false positives, and performance",
            ],
          },
          {
            id: "1.03",
            text: "Determine the appropriate policy features and granularity for a given set of requirements",
            relatedArticles: ["awaf-declarative-policy-structure"],
            relatedTools: ["f5-awaf-declarative-policy-explainer"],
            manualLinks: [],
            keyPoints: [
              "Understand application (security) requirements and convert requirements to technical tasks",
            ],
          },
          {
            id: "1.04",
            text: "Determine which deployment method is most appropriate for a given set of requirements",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine which deployment method is most appropriate given the circumstances (web services, vulnerability scanner, templates, rapid deployment model)",
            ],
          },
          {
            id: "1.05",
            text: "Explain the automatic policy builder lifecycle",
            relatedArticles: [
              "awaf-automatic-learning-poisoning",
              "awaf-l7-behavioral-dos",
              "awaf-client-side-signals-and-challenges",
            ],
            relatedTools: ["f5-awaf-learning-suggestion-interpreter", "f5-awaf-learning-poisoning-estimator"],
            manualLinks: [],
            keyPoints: [
              "Create any profiles required to support the policy deployment (xml, JSON, logging profiles)",
              "Implement anomaly detection appropriate to the web app (D/DoS protection, brute force attack, web scraping, proactive bot defense)",
            ],
          },
          {
            id: "1.06",
            text: "Review and evaluate policy settings based on information gathered from ASM (attack signatures, DataGuard, entities)",
            relatedArticles: [
              "awaf-data-guard-response-masking",
              "awaf-signature-staging-and-enforcement-readiness",
            ],
            relatedTools: ["f5-awaf-learning-suggestion-interpreter"],
            manualLinks: [],
            keyPoints: [
              "Configure initial policy building settings (automatic policy builder settings)",
            ],
          },
          {
            id: "1.07",
            text: "Define appropriate policy structure for policy elements",
            relatedArticles: [
              "awaf-content-profiles",
              "awaf-data-guard-response-masking",
              "awaf-declarative-policy-structure",
              "awaf-session-tracking",
            ],
            relatedTools: ["f5-awaf-declarative-policy-explainer"],
            manualLinks: [],
            keyPoints: [
              "Define appropriate policy structure for policy elements (URLs, parameters, file types, headers, sessions and logins, content profiles, CSRF protection, anomaly detection, DataGuard, proactive bot defense)",
            ],
          },
          {
            id: "1.08",
            text: "Explain options and potential results within the deployment wizard",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Describe options within the deployment wizard (deployment method, attack signatures, virtual server, learning method",
              "Select the appropriate ASM deployment model given the business requirements",
            ],
          },
          {
            id: "1.09",
            text: "Explain available logging options",
            relatedArticles: ["bigip-log-files-map"],
            relatedTools: ["syslog-pri-decoder"],
            manualLinks: [],
            keyPoints: [
              "Explain the specifications of the remote logger (ports, types of logs, formats, address)",
            ],
          },
          {
            id: "1.10",
            text: "Describe the management of the attack signature lifecycle and select the appropriate attack signatures or signature sets",
            relatedArticles: ["awaf-signature-staging-and-enforcement-readiness"],
            relatedTools: ["f5-awaf-signature-accuracy-risk"],
            manualLinks: [],
            keyPoints: [
              "Understand management of attack signature lifecycle (staging, enforcement readiness period) and select appropriate attack signatures or signature sets.",
            ],
          },
        ],
      },
      {
        id: "section-2",
        title: "Section 2: POLICY MAINTENANCE AND OPTIMIZATION",
        objectives: [
          {
            id: "2.01",
            text: "Evaluate the implications of changes in the policy to the security and functionality of the application",
            relatedArticles: ["awaf-false-positives"],
            relatedTools: ["f5-awaf-policy-diff"],
            manualLinks: [],
            keyPoints: [
              "Evaluate whether the rules are being implemented effectively and appropriately to meet security and/or compliance requirements and make changes as appropriate",
            ],
          },
          {
            id: "2.02",
            text: "Explain the process to integrate natively supported third party vulnerability scan output and generic formats with ASM",
            relatedArticles: ["awaf-declarative-policy-structure"],
            relatedTools: ["f5-awaf-policy-diff"],
            manualLinks: [],
            keyPoints: [
              "Refine appropriate policy structure for policy elements (URLs, parameters, file types, headers, sessions and logins, content profiles, CSRF protection, anomaly protection)",
              "Explain how to manage policies using import, export, merge, and revert",
            ],
          },
          {
            id: "2.03",
            text: "Evaluate whether rules are being implemented effectively and appropriately to mitigate violations",
            relatedArticles: ["awaf-false-positives"],
            relatedTools: ["f5-awaf-request-log-triage"],
            manualLinks: [],
            keyPoints: [
              "Evaluate the implications of changes in the policy to the security and vulnerabilities of the application",
            ],
          },
          {
            id: "2.04",
            text: "Determine how a policy should be adjusted based upon available data",
            relatedArticles: ["awaf-false-positives"],
            relatedTools: ["f5-awaf-false-positive-triage"],
            manualLinks: [],
            keyPoints: [
              "Tune an ASM policy for better performance, including use of wildcards to improve efficiency",
            ],
          },
          {
            id: "2.05",
            text: "Define the ASM policy management functions",
            relatedArticles: [],
            relatedTools: ["f5-awaf-policy-diff"],
            manualLinks: [],
            keyPoints: [
              "Identify the status of the policy",
              "Define the violation types that exist in ASM",
              "Describe how to merge and differentiate between policies",
            ],
          },
        ],
      },
      {
        id: "section-3",
        title: "Section 3: REVIEW EVENT LOGS AND MITIGATE ATTACKS",
        objectives: [
          {
            id: "3.01",
            text: "Interpret log entries and identify opportunities to refine the policy",
            relatedArticles: ["awaf-false-positives"],
            relatedTools: ["f5-awaf-request-log-triage", "f5-awaf-false-positive-triage"],
            manualLinks: [],
            keyPoints: [
              "Examine traffic violations, determine if any attack traffic was permitted through the ASM and modify the policy to remove false positives",
              "Locate and interpret reported security violations by end users and application developers",
            ],
          },
          {
            id: "3.02",
            text: "Given an ASM report, identify trends in support of security objectives",
            relatedArticles: ["bigip-avr-analytics"],
            relatedTools: ["f5-awaf-request-log-triage"],
            manualLinks: [],
            keyPoints: [
              "Understand and describe each major violation category and how ASM detects common exploits",
              "Generate reporting for the ASM system and review the contents of the reports (anomaly statistics, charts, requests, PCI compliance status)",
            ],
          },
          {
            id: "3.03",
            text: "Determine the appropriate mitigation for a given attack or vulnerability",
            relatedArticles: ["awaf-evasion-techniques"],
            relatedTools: ["f5-awaf-evasion-explainer", "cvss-vector-decoder"],
            manualLinks: [],
            keyPoints: [
              "Take appropriate action on reported security violations by end users and application developers",
              "Modify ASM policy to adapt to attacks",
            ],
          },
          {
            id: "3.04",
            text: "Decide the appropriate method for determining the success of attack mitigation",
            relatedArticles: [],
            relatedTools: ["f5-awaf-signature-accuracy-risk"],
            manualLinks: [],
            keyPoints: [
              "Choose an appropriate user defined attack signature to respond to particular traffic",
            ],
          },
        ],
      },
      {
        id: "section-4",
        title: "Section 4: TROUBLESHOOT",
        objectives: [
          {
            id: "4.01",
            text: "Evaluate ASM policy performance issues and determine appropriate mitigation strategies",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Analyze performance graphs and statistics along with ASM configurations to determine the root cause of performance issues and appropriate remediation to the configuration based on Guaranteed Logging",
            ],
          },
          {
            id: "4.02",
            text: "Understand the impact of learning, alarm, and blocking settings on traffic enforcement",
            relatedArticles: [
              "awaf-enforcement-mode-blocking-vs-transparent",
              "awaf-signature-staging-and-enforcement-readiness",
            ],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Ensure that the security policy is inspecting web application traffic (application is functional and the policies are parsing the traffic)",
            ],
          },
          {
            id: "4.03",
            text: "Examine policy objects to determine why traffic is or is not generating violations",
            relatedArticles: ["awaf-false-positives"],
            relatedTools: ["f5-awaf-request-log-triage"],
            manualLinks: [],
            keyPoints: [
              "Examine Security Event Logs and ASM configurations to determine expected violations based on the logging profile assigned to the virtual server",
            ],
          },
          {
            id: "4.04",
            text: "Identify and interpret ASM performance metrics",
            relatedArticles: [],
            relatedTools: ["f5-irules-performance-linter"],
            manualLinks: [],
            keyPoints: [
              "Understand the impact of ASM iRules on performance.",
              "Understand the impact of traffic spikes on ASM performance and available mitigation strategies",
            ],
          },
          {
            id: "4.05",
            text: "Evaluate ASM system performance issues and determine appropriate mitigation strategies",
            relatedArticles: [],
            relatedTools: ["f5-awaf-policy-diff"],
            manualLinks: [],
            keyPoints: [
              "Correlate performance issues with ASM policy changes based on security policy history information and system performance graphs",
            ],
          },
          {
            id: "4.06",
            text: "Recognize ASM specific user roles and their permissions",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Recognize differences between user roles/permissions",
              "Recognize ASM specific user roles",
            ],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // BIG-IP APM Specialist (304): objectives and example bullets transcribed
  // VERBATIM from the official F5 exam blueprint (stamp 304.92018), PDF relayed
  // by PRIME 2026-07-21. Catalog Key Info fetched the same day (incl. the
  // prerequisite: a valid F5-CA, BIG-IP certification). Related resources map
  // to the access-and-identity shelf (APM, SAML, Kerberos, LDAP, session data).
  // ---------------------------------------------------------------------------
  {
    slug: "f5-cts-apm-304",
    examCode: "304",
    examName: "BIG-IP APM Specialist (304)",
    vendor: "f5",
    certification: "f5-cts-apm",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/big-ip-apm-specialist-304",
    blueprintSourceLabel:
      "Exam blueprint 304.92018 (official PDF, relayed by PRIME 2026-07-21). Catalog Key Info (fetched 2026-07-21): US$180, English, test-center proctored, passing score 245, 90 minutes, Technology Specialist level; prerequisite: valid F5-CA, BIG-IP certification",
    status: "published",
    examFacts: {
      questions: "80 questions (70 items that are scored, 10 pilot/beta items)",
      minutes: 90,
      passMark: "245 (scaled range 100-350)",
      cost: "US$180 per attempt (not including local taxes and fees)",
      note:
        "Computer-based, multiple-choice; delivered at Pearson VUE test centers (English). Credential awarded: F5 Certified Technology Specialist, APM. Prerequisite: F5 Certified BIG-IP Administrator (F5-CA); the catalog lists the BIG-IP APM Specialist certification as a prerequisite for the Security Solutions Expert track.",
    },
    sections: [
      {
        id: "section-1",
        title: "Section 1: AUTHENTICATION, AUTHORIZATION, AND ACCOUNTING (AAA), SINGLE SIGN-ON (SSO), FEDERATED AUTHORIZATION, MOBILE DEVICE MANAGEMENT (MDM)",
        objectives: [
          {
            id: "1.01",
            text: "Explain how to configure different types of AAA methods",
            relatedArticles: ["ldap-fundamentals", "kerberos-and-spnego"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Configure AAA objects",
              "Microsoft Active Directory, LDAP, Radius, RSA SecurID, TACACS, (Kerberos/NTLM, Client Cert auth), end-point management system profile",
            ],
          },
          {
            id: "1.02",
            text: "Demonstrate knowledge of the network requirements for each authentication service type",
            relatedArticles: ["ldap-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Demonstrate ability to test and validate connectivity to each authentication service (adtest output, ldapsearch output)",
            ],
          },
          {
            id: "1.03",
            text: "Explain how to configure SSO objects",
            relatedArticles: ["bigip-apm-sso-methods", "kerberos-and-spnego"],
            relatedTools: ["f5-apm-sso-explainer"],
            manualLinks: [],
            keyPoints: [
              "Determine specific SSO object requirements (e.g. Kerberos SPN requirements)",
              "Determine when to choose one type of SSO over another",
            ],
          },
          {
            id: "1.04",
            text: "Explain how to configure SAML as an SP and/or IdP",
            relatedArticles: [
              "f5-apm-saml-federation",
              "saml-overview",
              "saml-bindings-and-sso-initiation",
              "saml-assertions-and-conditions",
            ],
            relatedTools: ["saml-decoder"],
            manualLinks: [],
            keyPoints: [
              "Integrate BIG-IP APM Service Provider (SP) with external vendor IdP (e.g. PING, Okta, SaaS, etc.) Configure Single Logout (SLO)",
            ],
          },
        ],
      },
      {
        id: "section-2",
        title: "Section 2: NETWORK AND APPLICATION ACCESS",
        objectives: [
          {
            id: "2.01",
            text: "Explain how to configure SSL VPN manually or using a wizard",
            relatedArticles: ["vpn-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine which option is appropriate to use: Network access, Portal access, Web Application access (APM/LTM Mode)",
              "Choose appropriate Webtop type: Full, Network Access, Portal Access",
            ],
          },
          {
            id: "2.02",
            text: "Explain how to configure Network Access Profiles",
            relatedArticles: ["vpn-fundamentals", "bigip-snat-and-return-traffic"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Configure profile settings (e.g. Connectivity profile options, Edge Client Options and updates, SNAT)",
              "Configure App Optimization",
            ],
          },
          {
            id: "2.03",
            text: "Explain how to configure portal access",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine the appropriate level of patching",
              "Evaluate global ACL order",
              "Configure Resource Items",
            ],
          },
          {
            id: "2.04",
            text: "Explain how to configure application access",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Configure Remote Desktop access (e.g. Launching applications, Custom Parameters)",
              "Deploy Citrix Bundle",
              "Configure App Tunnels",
            ],
          },
          {
            id: "2.05",
            text: "Explain how to configure Web Access Management (LTM-APM Mode)",
            relatedArticles: ["bigip-pools-and-load-balancing", "ltm-virtual-server-types"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Configure pool and virtual server",
              "Determine when to use Web Access Management",
            ],
          },
        ],
      },
      {
        id: "section-3",
        title: "Section 3: VISUAL POLICY EDITOR",
        objectives: [
          {
            id: "3.01",
            text: "Explain how to configure authentication and logon objects in VPE",
            relatedArticles: ["bigip-apm-session-variables"],
            relatedTools: ["f5-apm-session-variable-reference"],
            manualLinks: [],
            keyPoints: [
              "Configure an auth and/or query object (e.g. Determine group membership, Configure required attributes)",
              "Add appropriate logon page type",
            ],
          },
          {
            id: "3.02",
            text: "Explain how to configure resource/custom variables",
            relatedArticles: ["bigip-apm-session-variables", "bigip-apm-sso-methods"],
            relatedTools: ["f5-apm-session-variable-reference"],
            manualLinks: [],
            keyPoints: [
              "Set up SSO credential mapping",
              "Assign Webtops dynamically",
              "Configure variable assignment",
            ],
          },
          {
            id: "3.03",
            text: "Explain how to configure VPE flow with multiple branches and objects",
            relatedArticles: ["bigip-apm-session-variables"],
            relatedTools: ["f5-apm-session-variable-reference"],
            manualLinks: [],
            keyPoints: [
              "Determine policy ending types (allow, deny, redirect)",
              "Use a message box to display a variable in a VPE",
              "Assign custom session variables",
            ],
          },
          {
            id: "3.04",
            text: "Explain how to configure and apply macros",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Use a macro to combine multiple VPE objects",
              "Demonstrate an understanding of differences in creating a macro versus an access policy",
            ],
          },
        ],
      },
      {
        id: "section-4",
        title: "Section 4: DEPLOY AND MAINTAIN iAPPS",
        objectives: [
          {
            id: "4.01",
            text: "Determine when to use an iApp",
            relatedArticles: ["bigip-iapps-and-fast"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Import and deploy supported iApp templates",
              "Determine the min/max BIG-IP module versions supported by a specific iApp template",
              "Determine which BIG-IP modules are required to deploy a specific iApp template",
            ],
          },
          {
            id: "4.02",
            text: "Apply procedural concepts to maintain iApps",
            relatedArticles: ["bigip-iapps-and-fast"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Reconfigure a deployed iApp to update objects",
              "Identify iApp used to deploy an object",
            ],
          },
          {
            id: "4.03",
            text: "Determine appropriate applications for enabling/disabling strict updates",
            relatedArticles: ["bigip-iapps-and-fast"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Make manual changes to a deployed application service",
              "Demonstrate an understanding of the impact of disabling strict updates",
            ],
          },
        ],
      },
      {
        id: "section-5",
        title: "Section 5: ADMINISTRATING AND TROUBLESHOOTING BIG-IP APM",
        objectives: [
          {
            id: "5.01",
            text: "Apply procedural concepts to manage and maintain access profiles",
            relatedArticles: ["bigip-apm-session-variables"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Determine proper use of profile scope (e.g. profile, virtual server, global)",
              "Tune policy settings (e.g. multiple concurrent users, limit active sessions per IP address)",
            ],
          },
          {
            id: "5.02",
            text: "Perform basic customizations of the U/I",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Apply corporate branding (i.e. adding a logo, footer, logon form)",
              "Add additional languages for browser localization",
            ],
          },
          {
            id: "5.03",
            text: "Demonstrate an understanding of how High Availability applies to BIG-IP APM (with respect to end users, policy sync, device fail-over)",
            relatedArticles: [
              "bigip-ha-concepts-device-trust-groups",
              "bigip-failover-states-and-operations",
              "bigip-config-sync",
            ],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Demonstrate an understanding of the limitation of two units per HA pair and traffic group",
              "Configure Access Policy Sync (e.g. Configuring local objects vs global, validate access policy sync)",
            ],
          },
          {
            id: "5.04",
            text: "Explain provisioning/licensing for BIG-IP APM",
            relatedArticles: ["bigip-license-file-anatomy", "bigip-license-reactivation"],
            relatedTools: ["f5-bigip-license-explainer"],
            manualLinks: [],
            keyPoints: [
              "Update an existing license for BIG-IP APM",
              "Consider CCU utilization for different types of access policy deployments",
            ],
          },
          {
            id: "5.05",
            text: "Apply procedural concepts to gather relevant data",
            relatedArticles: [
              "bigip-apm-session-variables",
              "bigip-tcpdump-syntax",
              "bigip-tcpdump-safety",
              "bigip-log-files-map",
            ],
            relatedTools: ["f5-bigip-tcpdump-builder", "packet-capture-plan-builder"],
            manualLinks: [],
            keyPoints: [
              "Gather data from relevant BIG-IP tools (e.g. session reports, session variables, tcpdump, ssldump, sessiondump, APM log)",
              "Add debug logic to APM iRules",
              "Configure Debug logging",
            ],
          },
          {
            id: "5.06",
            text: "Determine root cause",
            relatedArticles: [],
            relatedTools: ["fault-hypothesis-builder", "incident-timeline-rca-builder"],
            manualLinks: [],
            keyPoints: [
              "Compare expected vs actual behaviors based on problem description",
              "Analyze and correlate all collected data (client/BIG-IP/serverside) to understand where a failure occurred",
              "Determine cause of EPSEC failures",
            ],
          },
        ],
      },
      {
        id: "section-6",
        title: "Section 6: SECURITY",
        objectives: [
          {
            id: "6.01",
            text: "Explain how BIG-IP APM mitigates common attack vectors and methodologies",
            relatedArticles: ["bigip-syn-flood-protection"],
            relatedTools: ["f5-dos-vector-explainer"],
            manualLinks: [],
            keyPoints: [
              "Demonstrate an understanding of how the BIG-IP solution mitigates common security risks (e.g., cookiehijacking, DoS attacks)",
              "Determine which features of the BIG-IP device mitigate common DoS attacks",
              "Deploy GeoIP and IP intelligence in the VPE to protect resources",
            ],
          },
          {
            id: "6.02",
            text: "Determine which BIG-IP APM features should be used to mitigate a specific authentication attack",
            relatedArticles: ["bigip-custom-alerting"],
            relatedTools: ["totp-hotp"],
            manualLinks: [],
            keyPoints: [
              "Configure logging",
              "Configure objects needed to deploy MFA",
              "Configure SNMP traps",
            ],
          },
          {
            id: "6.03",
            text: "Apply procedural concepts to manage user sessions",
            relatedArticles: ["bigip-apm-session-variables"],
            relatedTools: ["f5-apm-session-variable-reference"],
            manualLinks: [],
            keyPoints: [
              "Identify user session details",
              "Demonstrate an understanding of BIG-IP APM session cookies",
            ],
          },
          {
            id: "6.04",
            text: "Identify use cases of Secure Web Gateway (SWG)",
            relatedArticles: [
              "http-proxy-forward-and-reverse",
              "ssl-forward-proxy-interception",
              "how-a-pac-file-chooses-a-proxy",
            ],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [
              "Compare transparent vs explicit proxy deployments",
              "Determine the purpose of SWG",
            ],
          },
          {
            id: "6.05",
            text: "Describe access policy timeouts as related to security",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Describe the differences between inactivity timeout, access policy timeout, and maximum session timeout",
            ],
          },
          {
            id: "6.06",
            text: "Explain how to configure and manage ACLs",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Explain how ACLs are deployed by default when creating a policy",
              "Explain when a layer 4 or layer 7 ACL would be needed",
            ],
          },
          {
            id: "6.07",
            text: "Demonstrate an understanding of network security requirements for application access",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Demonstrate an understanding of TCP/UDP ports required for application services",
            ],
          },
          {
            id: "6.08",
            text: "Apply procedural concepts to implement EPSEC",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Configure client-side checks (e.g. anti-virus, firewall, registry)",
              "Update and install EPSEC software",
            ],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // 401 - Security Solution Expert: objectives transcribed VERBATIM from the
  // official F5 exam blueprint (stamp 401.102019), PDF relayed by PRIME
  // 2026-07-21. This blueprint publishes objectives only (no example bullets),
  // so keyPoints stay empty by honesty. Catalog Key Info fetched the same day.
  // ---------------------------------------------------------------------------
  {
    slug: "f5-cse-security-401",
    examCode: "401",
    examName: "Security Solutions (401)",
    vendor: "f5",
    certification: "f5-cse-sec",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/security-solutions-401",
    blueprintSourceLabel:
      "Exam blueprint 401.102019 (official PDF, relayed by PRIME 2026-07-21). Catalog Key Info (fetched 2026-07-21): US$180, English, test-center proctored, passing score 245, 105 minutes, Solution Expert level",
    status: "published",
    examFacts: {
      questions: "70 questions (65 items that are scored, 5 pilot/beta items)",
      minutes: 105,
      passMark: "245 (scaled range 100-350)",
      cost: "US$180 per attempt (not including local taxes and fees)",
      note:
        "Computer-based, multiple-choice; delivered at Pearson VUE test centers (English). Credential awarded: F5 Certified Solution Expert, Security (F5-CSE, Security). Prerequisites: F5-CA plus F5-CTS LTM, F5-CTS ASM, and F5-CTS APM.",
    },
    sections: [
      {
        id: "section-1",
        title: "Section 1: THREAT ANALYSIS",
        objectives: [
          {
            id: "1.01",
            text: "Analyze external threat research to determine the potential impact to an organization",
            relatedArticles: [],
            relatedTools: ["cvss-vector-decoder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "1.02",
            text: "Analyze threat modeling data to determine risk profiles of the infrastructure and applications",
            relatedArticles: [],
            relatedTools: ["cvss-vector-decoder"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      {
        id: "section-2",
        title: "Section 2: ARCHITECT SOLUTIONS",
        objectives: [
          {
            id: "2.01",
            text: "Determine the correct solution to mitigate a given threat",
            relatedArticles: ["awaf-l7-behavioral-dos", "bigip-syn-flood-protection"],
            relatedTools: ["f5-dos-vector-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.02",
            text: "Determine the correct control to address a compliance or business requirement",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.03",
            text: "Determine the appropriate security framework for an application",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.04",
            text: "Explain the justification for a proposed solution",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.05",
            text: "Determine when BIG-IQ is required for centralized management and visibility",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      {
        id: "section-3",
        title: "Section 3: OPERATION AND IMPLEMENTATION",
        objectives: [
          {
            id: "3.01",
            text: "Apply procedural concepts required to configure F5 technology to provide network layer DOS protection",
            relatedArticles: ["bigip-syn-flood-protection", "bigip-connection-eviction-policies"],
            relatedTools: ["f5-dos-vector-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.02",
            text: "Determine the appropriate protection against known bad actors",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.03",
            text: "Determine the appropriate settings to mitigate web fraud",
            relatedArticles: ["f5-datasafe-application-layer-encryption"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.04",
            text: "Articulate architectural requirements for outbound SSL visibility",
            relatedArticles: ["f5-ssl-orchestrator-topologies", "ssl-forward-proxy-interception"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.05",
            text: "Apply procedural concepts to configure network firewall protection",
            relatedArticles: ["bigip-afm-contexts-and-rule-processing", "bigip-packet-filters"],
            relatedTools: ["f5-afm-rule-context", "f5-packet-filter-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.06",
            text: "Troubleshoot F5 technology to address functionality or performance issues",
            relatedArticles: ["bigip-qkview-and-ihealth"],
            relatedTools: ["fault-hypothesis-builder", "tac-escalation-packet-builder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.07",
            text: "Verify a configuration is functioning as intended to mitigate a vulnerability",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      {
        id: "section-4",
        title: "Section 4: SECURITY RESPONSE",
        objectives: [
          {
            id: "4.01",
            text: "Analyze logs or other data sources for security incidents",
            relatedArticles: ["bigip-log-files-map"],
            relatedTools: ["syslog-pri-decoder", "f5-awaf-request-log-triage"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "4.02",
            text: "Determine the appropriate proactive security response plan",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "4.03",
            text: "Determine the appropriate incident response plan given specific attack details",
            relatedArticles: [],
            relatedTools: ["incident-timeline-rca-builder"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // 402 - Cloud Solutions: objectives transcribed VERBATIM from the official
  // F5 exam blueprint (stamp 402.42019), PDF relayed by PRIME 2026-07-21.
  // This blueprint publishes objectives only (no example bullets), so keyPoints
  // stay empty by honesty. Two source typos preserved verbatim: 2.06
  // "architeching" and 3.05 "rlevant" appear exactly as printed in the PDF.
  // 5.08 and 5.09 carry identical text at different cognitive levels in the
  // source; both are kept, as printed. Catalog Key Info fetched the same day.
  // ---------------------------------------------------------------------------
  {
    slug: "f5-cse-cloud-402",
    examCode: "402",
    examName: "Cloud Solutions (402)",
    vendor: "f5",
    certification: "f5-cse-cld",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/cloud-solutions-402",
    blueprintSourceLabel:
      "Exam blueprint 402.42019 (official PDF, relayed by PRIME 2026-07-21). Catalog Key Info (fetched 2026-07-21): US$180, English, test-center proctored, passing score 245, 105 minutes, Solution Expert level",
    status: "published",
    examFacts: {
      questions: "70 questions (65 items that are scored, 5 pilot/beta items)",
      minutes: 105,
      passMark: "245 (scaled range 100-350)",
      cost: "US$180 per attempt (not including local taxes and fees)",
      note:
        "Computer-based, multiple-choice; delivered at Pearson VUE test centers (English). Credential awarded: F5 Certified Solution Expert, Cloud (F5-CSE, Cloud). Prerequisites: F5-CA plus F5-CTS LTM and F5-CTS DNS.",
    },
    sections: [
      {
        id: "section-1",
        title: "Section 1: FOUNDATIONAL CLOUD CONCEPTS",
        objectives: [
          {
            id: "1.01",
            text: "Compare and contrast the various cloud business models and technologies",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "1.02",
            text: "Apply concepts related to cloud Identity Access Management technologies",
            relatedArticles: ["saml-overview", "oidc-overview"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "1.03",
            text: "Describe the terminology, modules, and technical requirements related to application bursting and mobility",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "1.04",
            text: "Apply concepts related to application bursting and mobility",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      {
        id: "section-2",
        title: "Section 2: CLOUD INFRASTRUCTURE DESIGN",
        objectives: [
          {
            id: "2.01",
            text: "Describe the F5 licensing and support characteristics for cloud deployments",
            relatedArticles: ["bigip-license-file-anatomy", "bigip-license-reactivation"],
            relatedTools: ["f5-bigip-license-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.02",
            text: "Evaluate variables relevant to the design of a cloud solution that meets business requirement",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.03",
            text: "Enumerate the available permutations and combinations of F5 virtualization technologies",
            relatedArticles: ["bigip-vcmp"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.04",
            text: "Recognize the constraints imposed by various SDN technologies on F5 components",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.05",
            text: "Relate technical requirements to F5 platforms and virtualization technologies",
            relatedArticles: ["bigip-vcmp"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.06",
            text: "Evaluate variables relevant to architeching solutions using single and multi-tier F5 products in various cloud environments",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.07",
            text: "Evaluate the variables relevant to the design of green-field data centers and application delivery architectures to function as a cloud service provider",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.08",
            text: "Apply key concepts related to the design on-demand provisioning of application services",
            relatedArticles: ["bigip-declarative-onboarding-do", "as3-declaration-anatomy"],
            relatedTools: ["do-explainer-validator", "as3-explainer-validator"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "2.09",
            text: "Evaluate variables relevant to the design of on-demand provisioning of application services",
            relatedArticles: ["as3-declaration-anatomy"],
            relatedTools: ["as3-explainer-validator"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      {
        id: "section-3",
        title: "Section 3: CLOUD MIGRATION",
        objectives: [
          {
            id: "3.01",
            text: "Evaluate variables relevant to the creation and validation of a Cloud migration plan for applications",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.02",
            text: "Apply key concepts required for the implementation of a Cloud migration plan for applications",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.03",
            text: "Evaluate variables relevant to the implementation of a cloud migration plan for applications",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.04",
            text: "Apply key concepts required to leverage technologies to integrate with various SDN environments",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "3.05",
            text: "Evaluate variables rlevant to the leveraging of technologies to integrate with various SDN environments",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      {
        id: "section-4",
        title: "Section 4: CLOUD DEPLOYMENT",
        objectives: [
          {
            id: "4.01",
            text: "Analyze cloud service provider instance sizing and location as it relates to BIG-IP requirements",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "4.02",
            text: "Apply the key concepts required to deploy F5 instances on a cloud infrastructure",
            relatedArticles: ["bigip-declarative-onboarding-do"],
            relatedTools: ["do-explainer-validator"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      {
        id: "section-5",
        title: "Section 5: CLOUD ORCHESTRATION AND AUTOMATION",
        objectives: [
          {
            id: "5.01",
            text: "Apply the N/E/S/W-bound API model in order to orchestrate service creation",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "5.02",
            text: "Apply the key concepts required to automate and orchestrate using F5 RESTful APIs",
            relatedArticles: [],
            relatedTools: ["curl-command-builder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "5.03",
            text: "Evaluate the variables relevant to automation and orchestration using F5 RESTful APIs",
            relatedArticles: [],
            relatedTools: ["curl-command-builder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "5.04",
            text: "Apply the key concepts required to design a cloud bursting solution",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "5.05",
            text: "Evaluate the variables relevant to design a cloud bursting solution",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "5.06",
            text: "Determine how to utilize cloud deployment templates to create on demand provisioning of application services",
            relatedArticles: ["as3-declaration-anatomy"],
            relatedTools: ["as3-explainer-validator"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "5.07",
            text: "Evaluate cloud deployment templates for the creation of on-demand provisioning of application services",
            relatedArticles: ["as3-declaration-anatomy"],
            relatedTools: ["as3-explainer-validator"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "5.08",
            text: "Apply the key concepts required to create a workflow for dynamic provisioning of an F5 instance",
            relatedArticles: ["bigip-declarative-onboarding-do"],
            relatedTools: ["do-explainer-validator"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "5.09",
            text: "Apply the key concepts required to create a workflow for dynamic provisioning of an F5 instance",
            relatedArticles: ["bigip-declarative-onboarding-do"],
            relatedTools: ["do-explainer-validator"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // NGINX Management (F5N1): objectives and example bullets transcribed
  // VERBATIM from the official F5 Certified Administrator, NGINX certification
  // blueprint (PDF relayed by PRIME 2026-07-21). Catalog Key Info fetched the
  // same day. The blueprint groups objectives per exam; this guide carries the
  // EXAM: Management table.
  // ---------------------------------------------------------------------------
  {
    slug: "f5-nginx-f5n1",
    examCode: "F5N1",
    examName: "NGINX Management (F5N1)",
    vendor: "f5",
    certification: "f5-ca-nginx",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/nginx-management-f5n1",
    blueprintSourceLabel:
      "F5 Certified Administrator, NGINX certification blueprint (official PDF, relayed by PRIME 2026-07-21; based on NGINX Open Source Software). Catalog Key Info (fetched 2026-07-21): US$50 online / US$65 test center, English, online proctored via Certiverse or test-center proctored via Pearson VUE, passing score 245, 30 minutes",
    status: "published",
    examFacts: {
      questions: "Question count not published in the catalog or the certification blueprint",
      minutes: 30,
      passMark: "245",
      cost: "US$50 online proctored / US$65 test center (not including local taxes and fees)",
      note:
        "Online proctored via Certiverse (camera access required) or test-center proctored via Pearson VUE; English; Administrator NGINX level. One of the four exams (taken in any order) that earn F5 Certified Administrator, NGINX (F5-CA, NGINX); the certification is based on NGINX Open Source Software (OSS).",
    },
    sections: [
      {
        id: "section-1",
        title: "EXAM: Management",
        objectives: [
          {
            id: "1.1",
            text: "Given a scenario identify when to use NGINX",
            relatedArticles: ["http-proxy-forward-and-reverse", "tcp-proxy-layer-4"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Describe NGINX as a web server",
              "Describe NGINX as a reverse proxy",
              "Describe NGINX as a load balancer",
              "Describe NGINX as a caching solution",
              "Describe NGINX as an API gateway",
            ],
          },
          {
            id: "1.2",
            text: "Explain the NGINX configuration directory structure",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify the default NGINX core config file",
              "Identify the included directories/files",
              "Describe the order of how the included files will be 'merged' into the running configuration",
              "Describe directive inheritance and overriding properties",
            ],
          },
          {
            id: "1.3",
            text: "Demonstrate how to manage user permissions",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Identify user context (i.e. using the configuration file)",
              "Describe how and when to give read/write/execute access",
              "Describe how to run NGINX as a specific user type",
              "Describe the relationship between NGINX processes and users",
            ],
          },
          {
            id: "1.4",
            text: "Manage shared memory zones",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Describe how and why NGINX uses shared memory zones",
              "Describe why directives use a shared memory zone",
            ],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // NGINX Configuration: Knowledge (F5N2): objectives and example bullets
  // transcribed VERBATIM from the official F5 Certified Administrator, NGINX
  // certification blueprint (PDF relayed by PRIME 2026-07-21). Catalog Key
  // Info fetched the same day. This guide carries the EXAM: Configuration:
  // Knowledge table.
  // ---------------------------------------------------------------------------
  {
    slug: "f5-nginx-f5n2",
    examCode: "F5N2",
    examName: "NGINX Configuration: Knowledge (F5N2)",
    vendor: "f5",
    certification: "f5-ca-nginx",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/nginx-configuration-knowledge-f5n2",
    blueprintSourceLabel:
      "F5 Certified Administrator, NGINX certification blueprint (official PDF, relayed by PRIME 2026-07-21; based on NGINX Open Source Software). Catalog Key Info (fetched 2026-07-21): US$50 online / US$65 test center, English, online proctored via Certiverse or test-center proctored via Pearson VUE, passing score 245, 30 minutes",
    status: "published",
    examFacts: {
      questions: "Question count not published in the catalog or the certification blueprint",
      minutes: 30,
      passMark: "245",
      cost: "US$50 online proctored / US$65 test center (not including local taxes and fees)",
      note:
        "Online proctored via Certiverse (camera access required) or test-center proctored via Pearson VUE; English; Administrator NGINX level. One of the four exams (taken in any order) that earn F5 Certified Administrator, NGINX (F5-CA, NGINX); the certification is based on NGINX Open Source Software (OSS).",
    },
    sections: [
      {
        id: "section-1",
        title: "EXAM: Configuration: Knowledge",
        objectives: [
          {
            id: "1.1",
            text: "Configure NGINX as a load balancer",
            relatedArticles: ["tcp-proxy-layer-4"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Define the load balancing pools/systems",
              "Explain the different load balancing algorithms",
              "Describe the process used to remove a server from the pool",
              "Describe what happens when a pool server goes down",
              "Explain what is unique to NGINX as a load balancer",
              "Describe how to configure security",
              "Modify or tune a memory zone configuration",
              "Describe how to configure NGINX as mirroring server",
              "Describe how to configure NGINX as a layer 4 load balancer",
              "Describe how to configure NGINX as an API Gateway",
            ],
          },
          {
            id: "1.2",
            text: "Configure NGINX as a content cache server",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Define a minimum retention policy",
              "Describe how to configure path regex routing",
              "Describe the why and how of caching in NGINX",
              "Define the cache in the http context",
              "Enable the cache",
              "Specify the content that should be cached",
              "Describe different types of caching",
              "Explain what is unique to NGINX as a cache server",
            ],
          },
          {
            id: "1.3",
            text: "Configure NGINX as a web server",
            relatedArticles: ["tls-reverse-proxy-inbound"],
            relatedTools: ["regex"],
            manualLinks: [],
            keyPoints: [
              "Demonstrate how to securely serve content (HTTP/HTTPS)",
              "Describe the difference between serving static content and dynamic content. (REGEX, and variables)",
              "Describe how server and location work",
              "Explain what is unique to NGINX as a web server",
            ],
          },
          {
            id: "1.4",
            text: "Configure NGINX as a reverse proxy",
            relatedArticles: ["http-proxy-forward-and-reverse"],
            relatedTools: ["secure-headers"],
            manualLinks: [],
            keyPoints: [
              "Explain how traffic routing is handled in NGINX as a reverse proxy",
              "Explain what is unique to NGINX as a reverse proxy",
              "Configure encryption",
              "Demonstrate how to manipulate headers",
              "Describe the difference between proxy_set_header and add_header",
              "Modify or tune a memory zone configuration",
              "Describe how to configure NGINX as socket reserve proxy",
              "Describe how open source NGINX handles health checks in different situations",
            ],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // NGINX Configuration: Demonstrate (F5N3): objectives and example bullets
  // transcribed VERBATIM from the official F5 Certified Administrator, NGINX
  // certification blueprint (PDF relayed by PRIME 2026-07-21). Catalog Key
  // Info fetched the same day. This guide carries the EXAM: Configuration:
  // Demonstrate table.
  // ---------------------------------------------------------------------------
  {
    slug: "f5-nginx-f5n3",
    examCode: "F5N3",
    examName: "NGINX Configuration: Demonstrate (F5N3)",
    vendor: "f5",
    certification: "f5-ca-nginx",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/nginx-configuration-demonstrate-f5n3",
    blueprintSourceLabel:
      "F5 Certified Administrator, NGINX certification blueprint (official PDF, relayed by PRIME 2026-07-21; based on NGINX Open Source Software). Catalog Key Info (fetched 2026-07-21): US$50 online / US$65 test center, English, online proctored via Certiverse or test-center proctored via Pearson VUE, passing score 245, 30 minutes",
    status: "published",
    examFacts: {
      questions: "Question count not published in the catalog or the certification blueprint",
      minutes: 30,
      passMark: "245",
      cost: "US$50 online proctored / US$65 test center (not including local taxes and fees)",
      note:
        "Online proctored via Certiverse (camera access required) or test-center proctored via Pearson VUE; English; Administrator NGINX level. One of the four exams (taken in any order) that earn F5 Certified Administrator, NGINX (F5-CA, NGINX); the certification is based on NGINX Open Source Software (OSS).",
    },
    sections: [
      {
        id: "section-1",
        title: "EXAM: Configuration: Demonstrate",
        objectives: [
          {
            id: "1.1",
            text: "Demonstrate how to manage connections and bandwidth",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Describe the difference between rate limiting and bandwidth throttling",
              "Demonstrate how to limit the amount of connections that are made to the NGINX server and its upstreams",
              "Demonstrate how to set a bandwidth limit",
              "Understand how to enable and optimize keep-alives for the NGINX server and its upstreams",
            ],
          },
          {
            id: "1.2",
            text: "Demonstrate how to restrict access",
            relatedArticles: [],
            relatedTools: ["http-methods-comparison", "url-inspector"],
            manualLinks: [],
            keyPoints: [
              "Demonstrate how to restrict access to NGINX based on IP address",
              "Demonstrate how to restrict access to NGINX based on HTTP method",
              "Demonstrate how to authenticate (auth basic / auth request)",
              "Demonstrate how to restrict URIs",
            ],
          },
          {
            id: "1.3",
            text: "Demonstrate how to configure logging",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Demonstrate how to customize the format of log files",
              "Demonstrate how to customize the location of log files",
              "Demonstrate how to set log levels (severity)",
              "Describe the difference between an error log and an access log",
            ],
          },
          {
            id: "1.4",
            text: "Demonstrate how to configure certificates",
            relatedArticles: ["certificate-formats", "certificate-signing-request", "certificate-validation"],
            relatedTools: ["x509", "csr-decoder"],
            manualLinks: [],
            keyPoints: [
              "Define the difference between a server certificate and a client certificate",
              "Describe the components necessary to use an SSL certificate",
              "Describe how to protect the SSL certificate and key",
            ],
          },
          {
            id: "1.5",
            text: "Demonstrate how to enable HTTPS and associated security settings",
            relatedArticles: [
              "tls-reverse-proxy-inbound",
              "tls12-tls13-dtls-quic",
              "tls13-cipher-suites",
              "tls-cipher-security-keywords",
            ],
            relatedTools: ["cipher"],
            manualLinks: [],
            keyPoints: [
              "Compare the advantages of TLS termination, end to end encryption, and TLS passthrough",
              "Demonstrate how to enable TLS encryption",
              "Enable/Disable ciphers and TLS version",
              "Describe how force all traffic to redirect to HTTPS",
            ],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // NGINX Troubleshoot (F5N4): objectives and example bullets transcribed
  // VERBATIM from the official F5 Certified Administrator, NGINX certification
  // blueprint (PDF relayed by PRIME 2026-07-21; the blueprint's own table is
  // titled EXAM: Troubleshooting). Catalog Key Info fetched the same day.
  // ---------------------------------------------------------------------------
  {
    slug: "f5-nginx-f5n4",
    examCode: "F5N4",
    examName: "NGINX Troubleshoot (F5N4)",
    vendor: "f5",
    certification: "f5-ca-nginx",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/nginx-troubleshoot-f5n4",
    blueprintSourceLabel:
      "F5 Certified Administrator, NGINX certification blueprint (official PDF, relayed by PRIME 2026-07-21; based on NGINX Open Source Software). Catalog Key Info (fetched 2026-07-21): US$50 online / US$65 test center, English, online proctored via Certiverse or test-center proctored via Pearson VUE, passing score 245, 30 minutes",
    status: "published",
    examFacts: {
      questions: "Question count not published in the catalog or the certification blueprint",
      minutes: 30,
      passMark: "245",
      cost: "US$50 online proctored / US$65 test center (not including local taxes and fees)",
      note:
        "Online proctored via Certiverse (camera access required) or test-center proctored via Pearson VUE; English; Administrator NGINX level. One of the four exams (taken in any order) that earn F5 Certified Administrator, NGINX (F5-CA, NGINX); the certification is based on NGINX Open Source Software (OSS).",
    },
    sections: [
      {
        id: "section-1",
        title: "EXAM: Troubleshooting",
        objectives: [
          {
            id: "1.1",
            text: "Demonstrate how to stop, start, and reload NGINX binary",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [
              "Describe how to send signals to the NGINX process",
              "Describe the difference between a reload and a stop/start",
              "Describe how to test a new configuration before applying it",
            ],
          },
          {
            id: "1.2",
            text: "Troubleshoot basic use cases",
            relatedArticles: [],
            relatedTools: ["curl-command-builder"],
            manualLinks: [],
            keyPoints: [
              "Interpret logs",
              "Identify start up failures",
              "Describe how to deal with HTTP error codes",
              "Describe how to troubleshoot various response",
              "Describe how to troubleshoot use cases with multiple virtual hosts, multiple ports, and default servers",
              "Describe how to troubleshoot location precedence and add_header inheritance",
              "Describe how to troubleshoot client and server connections",
              "Describe basic SELinux use cases",
            ],
          },
          {
            id: "1.3",
            text: "Troubleshoot TLS security settings",
            relatedArticles: ["certificate-validation", "certificate-validity-windows"],
            relatedTools: ["x509"],
            manualLinks: [],
            keyPoints: [
              "Identify TLS connection errors",
              "Describe how to troubleshoot invalid certificates",
            ],
          },
        ],
      },
    ],
  },
  {
    // CURRENT Netskope accreditation (2024 Academy program). Topics VERBATIM
    // from the official TR PDF fetched live 2026-07-21 - the topic list is
    // word-for-word the same as the corresponding NSK certification
    // blueprint, which the accreditation replaced; delivery moved to
    // Netskope Academy (60 questions, 90 minutes). Question count is
    // published for this track, so it appears in the source label;
    // pass mark is not published, so examFacts stays null.
    slug: "netskope-administrator-accreditation",
    examCode: "TR-772-1",
    examName: "Netskope Administrator Accreditation",
    vendor: "netskope",
    certification: "netskope-administrator-accreditation",
    targetVersion: null,
    blueprintSourceUrl: "https://www.netskope.com/wp-content/uploads/2024/09/2024-09-Netskope-Administrator-Accreditation-TR-772-1.pdf",
    blueprintSourceLabel: "Official Netskope Administrator Accreditation description (TR-772-1, 09/24); 60 questions, 90 minutes, delivered through Netskope Academy; valid two years from award; replaces the former NCCSA certification; practitioner profile: configure, monitor, and perform basic troubleshooting, ~6 months suggested; recommended preparation: a tenant, NSCIOTT and NSCO&A Academy courses, and the Knowledge Portal. Sourcing note: TR-772-1 facts verified from the official document and its resource page; the TR-772-1 PDF blocks automated retrieval, so the topic list follows the NSK101/NCCSA blueprint (fetched in full), which TR-772-1 itself states this accreditation replaces - the sibling TR-773-1, fetched in full, carries a topic list identical to its corresponding NSK200 blueprint",
    status: "published",
    examFacts: {
      questions: "60 questions",
      minutes: 90,
      passMark: "Not published in TR-772-1",
      cost: "Delivered through Netskope Academy (TR-772-1 publishes no separate exam fee)",
      note: "Valid for two years from the date the exam is successfully completed through Netskope Academy. This accreditation replaces the former Netskope Certified Cloud Security Administrator certification.",
    },
    sections: [
      { id: "adm-css", title: "Cloud Security Concepts", objectives: [
          {
            id: "ADM-A.01",
            text: "Cloud security theory",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-A.02",
            text: "Common industry compliance standards",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-A.03",
            text: "Common cloud service model concepts",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-A.04",
            text: "Data-in-motion protection compared to data-at-rest concepts",
            relatedArticles: ["dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-A.05",
            text: "Web security concepts",
            relatedArticles: ["hsts-and-https", "secure-headers-overview"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-A.06",
            text: "Traffic steering concepts",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "adm-pcb", title: "Netskope Platform Concepts Basics", objectives: [
          {
            id: "ADM-B.01",
            text: "Deployment modes",
            relatedArticles: ["netskope-realtime-vs-api-protection", "http-proxy-forward-and-reverse"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-B.02",
            text: "Features and architectural benefits",
            relatedArticles: ["netskope-platform-architecture-and-newedge", "netskope-inline-tls-decryption"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-B.03",
            text: "Security controls",
            relatedArticles: ["netskope-cloud-firewall", "dlp-fundamentals", "sandbox-detonation-fundamentals", "browser-isolation-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-B.04",
            text: "Cloud security risk management/reduction",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "adm-mgmt", title: "Netskope Platform Management", objectives: [
          {
            id: "ADM-C.01",
            text: "Steering traffic to Netskope",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-C.02",
            text: "Basic configuration elements",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-C.03",
            text: "Real-time inline or API policy configuration concepts",
            relatedArticles: ["netskope-realtime-vs-api-protection"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-C.04",
            text: "Basic administration tasks",
            relatedArticles: ["scim-overview"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "adm-mon", title: "Netskope Platform Monitoring", objectives: [
          {
            id: "ADM-D.01",
            text: "Identifying cloud risk using the Cloud Confidence Index (CCI)",
            relatedArticles: ["cloud-confidence-index"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-D.02",
            text: "Event monitoring",
            relatedArticles: ["netskope-advanced-analytics"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "adm-tsh", title: "Netskope Platform Troubleshooting", objectives: [
          {
            id: "ADM-E.01",
            text: "Common steering issues",
            relatedArticles: ["netskope-steering-methods", "netskope-client-deployment", "how-a-pac-file-chooses-a-proxy"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-E.02",
            text: "Policy-related misconfigurations",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-E.03",
            text: "TLS decryption-related issues",
            relatedArticles: ["netskope-inline-tls-decryption", "ssl-forward-proxy-interception"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ADM-E.04",
            text: "Collect log files used for service requests",
            relatedArticles: ["netskope-client-deployment"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
    ],
  },
  {
    // CURRENT Netskope accreditation (2024 Academy program). Topics VERBATIM
    // from the official TR PDF fetched live 2026-07-21 - the topic list is
    // word-for-word the same as the corresponding NSK certification
    // blueprint, which the accreditation replaced; delivery moved to
    // Netskope Academy (60 questions, 90 minutes). Question count is
    // published for this track, so it appears in the source label;
    // pass mark is not published, so examFacts stays null.
    slug: "netskope-integrator-accreditation",
    examCode: "TR-773-1",
    examName: "Netskope Integrator Accreditation",
    vendor: "netskope",
    certification: "netskope-integrator-accreditation",
    targetVersion: null,
    blueprintSourceUrl: "https://www.netskope.com/pt/wp-content/uploads/2024/09/2024-09-Netskope-Integrator-Accreditation-TR-773-1.pdf",
    blueprintSourceLabel: "Official Netskope Integrator Accreditation description (TR-773-1, 09/24); 60 questions, 90 minutes, delivered through Netskope Academy; valid two years from award; replaces the former NCCSI certification; practitioner profile: implement, integrate, configure, monitor, and troubleshoot, ~12 months suggested; recommended preparation: a tenant, NSCIOTT, NSCO&A, and Netskope Security Cloud Implementation & Integration (NSCI&I) Academy courses, and the Knowledge Portal",
    status: "published",
    examFacts: {
      questions: "60 questions",
      minutes: 90,
      passMark: "Not published in TR-773-1",
      cost: "Delivered through Netskope Academy (TR-773-1 publishes no separate exam fee)",
      note: "Valid for two years from the date the exam is successfully completed through Netskope Academy. This accreditation replaces the former Netskope Certified Cloud Security Integrator certification.",
    },
    sections: [
      { id: "int-css", title: "Cloud Security Concepts", objectives: [
          {
            id: "INT-A.01",
            text: "Cloud security theory",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-A.02",
            text: "Traffic steering methods",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-A.03",
            text: "Major solutions that are available in the Netskope Security Cloud platform",
            relatedArticles: ["netskope-platform-architecture-and-newedge", "netskope-cloud-firewall", "netskope-inline-tls-decryption", "dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "int-impl", title: "Netskope Platform Implementation", objectives: [
          {
            id: "INT-B.01",
            text: "Various steering methods to a Netskope tenant",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-B.02",
            text: "Access management solutions",
            relatedArticles: ["saml-overview", "scim-overview"],
            relatedTools: ["saml-decoder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-B.03",
            text: "Privileged account control",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-B.04",
            text: "Netskope client deployment",
            relatedArticles: ["netskope-client-deployment"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-B.05",
            text: "Data protection with Netskope DLP",
            relatedArticles: ["dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-B.06",
            text: "Threat protection using the Netskope platform",
            relatedArticles: ["sandbox-detonation-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "int-mgmt", title: "Netskope Platform Management", objectives: [
          {
            id: "INT-C.01",
            text: "DLP policy creation",
            relatedArticles: ["dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-C.02",
            text: "Private application publication",
            relatedArticles: ["netskope-private-access-npa"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-C.03",
            text: "Real-time protection policies",
            relatedArticles: ["netskope-realtime-vs-api-protection"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-C.04",
            text: "SSL decryption policies",
            relatedArticles: ["netskope-inline-tls-decryption", "ssl-forward-proxy-interception"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-C.05",
            text: "REST API integrations",
            relatedArticles: ["http-methods-the-verbs", "http-status-codes-the-five-families"],
            relatedTools: ["http-request-translator", "http-status-code-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "int-mon", title: "Netskope Platform Monitoring", objectives: [
          {
            id: "INT-D.01",
            text: "Event analysis",
            relatedArticles: ["netskope-advanced-analytics"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-D.02",
            text: "Incident response workflows",
            relatedArticles: [],
            relatedTools: ["incident-timeline-rca-builder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-D.03",
            text: "Application discovery",
            relatedArticles: ["cloud-confidence-index", "netskope-advanced-analytics"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-D.04",
            text: "Event sharing methodologies",
            relatedArticles: ["netskope-advanced-analytics", "syslog-message-formats"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "int-tsh", title: "Netskope Platform Troubleshooting", objectives: [
          {
            id: "INT-E.01",
            text: "Client connectivity issues",
            relatedArticles: ["netskope-client-deployment"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-E.02",
            text: "Use of logs for troubleshooting",
            relatedArticles: ["syslog-message-formats"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "INT-E.03",
            text: "Troubleshooting user provisioning",
            relatedArticles: ["scim-overview", "saml-overview"],
            relatedTools: ["saml-decoder"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
    ],
  },
  {
    // Netskope Cloud Security Certification Program (Run A). Objectives are
    // VERBATIM from the official certification description PDF fetched live
    // 2026-07-21 (topic sub-bullets, transcribed exactly). Exam facts per
    // the same PDF: 90 minutes, Pearson VUE, 2 Academy credits or USD 200;
    // question count and pass mark are not published, so examFacts is null.
    slug: "netskope-nsk101",
    examCode: "NSK101",
    examName: "Netskope Certified Cloud Security Administrator (NCCSA)",
    vendor: "netskope",
    certification: "netskope-nccsa",
    targetVersion: null,
    blueprintSourceUrl: "https://www.netskope.com/wp-content/uploads/2022/11/NCCSA-NSK101-Certification-Description-2024-01-26.pdf",
    blueprintSourceLabel: "Official NCCSA (NSK101) Certification Description; 90 minutes, Pearson VUE; practitioner profile: configure, monitor, and perform basic troubleshooting, ~6 months of practical experience suggested; recommended preparation: NSCIOTT and NSCO&A Academy courses plus a tenant and the Knowledge Portal",
    status: "published",
    examFacts: null,
    sections: [
      { id: "nsk101-css", title: "Cloud Security Concepts", objectives: [
          {
            id: "NCCSA-A.01",
            text: "Cloud security theory",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-A.02",
            text: "Common industry compliance standards",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-A.03",
            text: "Common cloud service model concepts",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-A.04",
            text: "Data-in-motion protection compared to data-at-rest concepts",
            relatedArticles: ["dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-A.05",
            text: "Web security concepts",
            relatedArticles: ["hsts-and-https", "secure-headers-overview"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-A.06",
            text: "Traffic steering concepts",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk101-pcb", title: "Netskope Platform Concepts Basics", objectives: [
          {
            id: "NCCSA-B.01",
            text: "Deployment modes",
            relatedArticles: ["netskope-realtime-vs-api-protection", "http-proxy-forward-and-reverse"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-B.02",
            text: "Features and architectural benefits",
            relatedArticles: ["netskope-platform-architecture-and-newedge", "netskope-inline-tls-decryption"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-B.03",
            text: "Security controls",
            relatedArticles: ["netskope-cloud-firewall", "dlp-fundamentals", "sandbox-detonation-fundamentals", "browser-isolation-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-B.04",
            text: "Cloud security risk management/reduction",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk101-mgmt", title: "Netskope Platform Management", objectives: [
          {
            id: "NCCSA-C.01",
            text: "Steering traffic to Netskope",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-C.02",
            text: "Basic configuration elements",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-C.03",
            text: "Real-time inline or API policy configuration concepts",
            relatedArticles: ["netskope-realtime-vs-api-protection"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-C.04",
            text: "Basic administration tasks",
            relatedArticles: ["scim-overview"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk101-mon", title: "Netskope Platform Monitoring", objectives: [
          {
            id: "NCCSA-D.01",
            text: "Identifying cloud risk using the Cloud Confidence Index (CCI)",
            relatedArticles: ["cloud-confidence-index"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-D.02",
            text: "Event monitoring",
            relatedArticles: ["netskope-advanced-analytics"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk101-tsh", title: "Netskope Platform Troubleshooting", objectives: [
          {
            id: "NCCSA-E.01",
            text: "Common steering issues",
            relatedArticles: ["netskope-steering-methods", "netskope-client-deployment", "how-a-pac-file-chooses-a-proxy"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-E.02",
            text: "Policy-related misconfigurations",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-E.03",
            text: "TLS decryption-related issues",
            relatedArticles: ["netskope-inline-tls-decryption", "ssl-forward-proxy-interception"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSA-E.04",
            text: "Collect log files used for service requests",
            relatedArticles: ["netskope-client-deployment"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
    ],
  },
  {
    // Netskope Cloud Security Certification Program (Run A). Objectives are
    // VERBATIM from the official certification description PDF fetched live
    // 2026-07-21 (topic sub-bullets, transcribed exactly). Exam facts per
    // the same PDF: 90 minutes, Pearson VUE, 2 Academy credits or USD 200;
    // question count and pass mark are not published, so examFacts is null.
    slug: "netskope-nsk200",
    examCode: "NSK200",
    examName: "Netskope Certified Cloud Security Integrator (NCCSI)",
    vendor: "netskope",
    certification: "netskope-nccsi",
    targetVersion: null,
    blueprintSourceUrl: "https://www.netskope.com/wp-content/uploads/2022/11/NCCSI-NSK200-Certification-Description-2022-11-22.pdf",
    blueprintSourceLabel: "Official NCCSI (NSK200) Certification Description; 90 minutes, Pearson VUE; practitioner profile: implement, integrate, configure, monitor, and troubleshoot, ~12 months suggested; recommended preparation: NSCIOTT, NSCO&A, and NSCI&I Academy courses plus a tenant and the Knowledge Portal",
    status: "published",
    examFacts: null,
    sections: [
      { id: "nsk200-css", title: "Cloud Security Solutions", objectives: [
          {
            id: "NCCSI-A.01",
            text: "Cloud security theory",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-A.02",
            text: "Traffic steering methods",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-A.03",
            text: "Major solutions that are available in the Netskope Security Cloud platform",
            relatedArticles: ["netskope-platform-architecture-and-newedge", "netskope-cloud-firewall", "netskope-inline-tls-decryption", "dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk200-impl", title: "Netskope Platform Implementation", objectives: [
          {
            id: "NCCSI-B.01",
            text: "Various steering methods to a Netskope tenant",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-B.02",
            text: "Access management solutions",
            relatedArticles: ["saml-overview", "scim-overview"],
            relatedTools: ["saml-decoder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-B.03",
            text: "Privileged account control",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-B.04",
            text: "Netskope client deployment",
            relatedArticles: ["netskope-client-deployment"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-B.05",
            text: "Data protection with Netskope DLP",
            relatedArticles: ["dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-B.06",
            text: "Threat protection using the Netskope platform",
            relatedArticles: ["sandbox-detonation-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk200-mgmt", title: "Netskope Platform Management", objectives: [
          {
            id: "NCCSI-C.01",
            text: "DLP policy creation",
            relatedArticles: ["dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-C.02",
            text: "Private application publication",
            relatedArticles: ["netskope-private-access-npa"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-C.03",
            text: "Real-time protection policies",
            relatedArticles: ["netskope-realtime-vs-api-protection"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-C.04",
            text: "SSL decryption policies",
            relatedArticles: ["netskope-inline-tls-decryption", "ssl-forward-proxy-interception"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-C.05",
            text: "REST API integrations",
            relatedArticles: ["http-methods-the-verbs", "http-status-codes-the-five-families"],
            relatedTools: ["http-request-translator", "http-status-code-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk200-mon", title: "Netskope Platform Monitoring", objectives: [
          {
            id: "NCCSI-D.01",
            text: "Event analysis",
            relatedArticles: ["netskope-advanced-analytics"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-D.02",
            text: "Incident response workflows",
            relatedArticles: [],
            relatedTools: ["incident-timeline-rca-builder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-D.03",
            text: "Application discovery",
            relatedArticles: ["cloud-confidence-index", "netskope-advanced-analytics"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-D.04",
            text: "Event sharing methodologies",
            relatedArticles: ["netskope-advanced-analytics", "syslog-message-formats"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk200-tsh", title: "Netskope Platform Troubleshooting", objectives: [
          {
            id: "NCCSI-E.01",
            text: "Client connectivity issues",
            relatedArticles: ["netskope-client-deployment"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-E.02",
            text: "Use of logs for troubleshooting",
            relatedArticles: ["syslog-message-formats"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NCCSI-E.03",
            text: "Troubleshooting user provisioning",
            relatedArticles: ["scim-overview", "saml-overview"],
            relatedTools: ["saml-decoder"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
    ],
  },
  {
    // Netskope Cloud Security Certification Program (Run A). Objectives are
    // VERBATIM from the official certification description PDF fetched live
    // 2026-07-21 (topic sub-bullets, transcribed exactly). Exam facts per
    // the same PDF: 90 minutes, Pearson VUE, 2 Academy credits or USD 200;
    // question count and pass mark are not published, so examFacts is null.
    slug: "netskope-nsk300",
    examCode: "NSK300",
    examName: "Netskope Certified Cloud Security Architect",
    vendor: "netskope",
    certification: "netskope-architect",
    targetVersion: null,
    blueprintSourceUrl: "https://www.netskope.com/fr/wp-content/uploads/2022/10/netskope-cloud-security-certification-program.pdf",
    blueprintSourceLabel: "Official Cloud Security Certification Program description (Architect / NSK300 section); 90 minutes, Pearson VUE; practitioner profile: plan and execute a successful deployment and set the environment up for ongoing value realization, ~18 months suggested; recommended preparation adds the Activation & Adoption course and lab to NSCIOTT, NSCO&A, and NSCI&I",
    status: "published",
    examFacts: null,
    sections: [
      { id: "nsk300-css", title: "Cloud Security Solutions", objectives: [
          {
            id: "NSKA-A.01",
            text: "Components and functions of the Netskope Security Cloud Platform",
            relatedArticles: ["netskope-platform-architecture-and-newedge", "netskope-private-access-npa", "netskope-cloud-firewall", "netskope-inline-tls-decryption"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-A.02",
            text: "Integration capabilities with the Netskope Security Cloud Platform",
            relatedArticles: ["netskope-realtime-vs-api-protection"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-A.03",
            text: "Deployment methods are supported with Netskope",
            relatedArticles: ["netskope-steering-methods", "http-proxy-forward-and-reverse"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-A.04",
            text: "Various microservices of the Netskope Security Cloud Platform",
            relatedArticles: ["netskope-platform-architecture-and-newedge"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk300-impl", title: "Netskope Platform Implementation", objectives: [
          {
            id: "NSKA-B.01",
            text: "Steering methods - Architecture",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy", "gre-tunnels-fundamentals", "ipsec-and-ike-fundamentals", "tunnel-overhead-mtu-and-mss"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-B.02",
            text: "Steering methods - Deployment",
            relatedArticles: ["netskope-steering-methods", "netskope-client-deployment", "how-a-pac-file-chooses-a-proxy"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-B.03",
            text: "API-enabled protection",
            relatedArticles: ["netskope-realtime-vs-api-protection"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-B.04",
            text: "Real-time Protection",
            relatedArticles: ["netskope-realtime-vs-api-protection"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk300-mgmt", title: "Netskope Platform Management", objectives: [
          {
            id: "NSKA-C.01",
            text: "Administrative tasks in the Netskope Security Cloud Platform",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-C.02",
            text: "DLP management",
            relatedArticles: ["dlp-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-C.03",
            text: "Identity management",
            relatedArticles: ["saml-overview", "scim-overview"],
            relatedTools: ["saml-decoder"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-C.04",
            text: "Netskope components monitoring",
            relatedArticles: ["netskope-advanced-analytics"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk300-mon", title: "Netskope Platform Monitoring", objectives: [
          {
            id: "NSKA-D.01",
            text: "Reporting and analytics",
            relatedArticles: ["netskope-advanced-analytics"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
      { id: "nsk300-tsh", title: "Netskope Platform Troubleshooting", objectives: [
          {
            id: "NSKA-E.01",
            text: "Client connectivity issues",
            relatedArticles: ["netskope-client-deployment"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-E.02",
            text: "Steering analysis",
            relatedArticles: ["netskope-steering-methods", "how-a-pac-file-chooses-a-proxy"],
            relatedTools: ["netskope-steering-decision-explainer", "pac-file-explainer"],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-E.03",
            text: "Connectivity issues",
            relatedArticles: ["map-the-path-before-you-troubleshoot"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "NSKA-E.04",
            text: "SAML integrations",
            relatedArticles: ["saml-overview", "saml-bindings-and-sso-initiation", "saml-signatures"],
            relatedTools: ["saml-decoder"],
            manualLinks: [],
            keyPoints: [],
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** All study guides. */
export function getAllStudyGuides(): StudyGuide[] {
  return studyGuides;
}

/** One study guide by slug, or undefined. */
export function getStudyGuide(slug: string): StudyGuide | undefined {
  return studyGuides.find((g) => g.slug === slug);
}

/** Every study-guide slug (for generateStaticParams + the namespace guard). */
export function getAllStudyGuideSlugs(): string[] {
  return studyGuides.map((g) => g.slug);
}

/** All certifications. */
export function getCertifications(): Certification[] {
  return certifications;
}

// ---------------------------------------------------------------------------
// CERTIFICATIONS HUB ORDERING (PRIME directive 2026-07-21, PKG-CONTENT-QUEUE
// item 2): the hub lists study guides BY VENDOR (in the vendor-hub
// chronological order) and, within each vendor, BY CERTIFICATION ORDER -
// F5's ratified sequence: CA, CTS-LTM, CTS-DNS, CTS-ASM, CTS-APM, CSE-SEC,
// CSE-CLD (the NGINX administrator track closes the F5 list). Unlisted keys
// sort after listed ones, alphabetically, so future certs never vanish.
// ---------------------------------------------------------------------------
const VENDOR_HUB_ORDER = ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"] as const;

const CERT_HUB_ORDER: Record<string, number> = {
  "f5-ca": 1,
  "f5-cts-ltm": 2,
  "f5-cts-dns": 3,
  "f5-cts-asm": 4,
  "f5-cts-apm": 5,
  "f5-cse-sec": 6,
  "f5-cse-cld": 7,
  "f5-ca-nginx": 8,
  "netskope-administrator-accreditation": 1,
  "netskope-integrator-accreditation": 2,
  "netskope-nccsa": 3,
  "netskope-nccsi": 4,
  "netskope-architect": 5,
  "ping-cp-pingfederate": 1,
  "ping-cp-pingaccess": 2,
  "ping-cp-pingdirectory": 3,
  "ping-cp-pingone": 4,
  "ping-cp-pingone-davinci": 5,
  "ping-cp-pingam": 6,
  "ping-cp-pingone-aic": 7,
  "ping-cp-pingidm": 8,
  "ping-cp-pingone-idg": 9,
  "ping-ce-pingfederate": 10,
  "ping-ce-pingaccess": 11,
  "ping-ce-pingdirectory": 12,
  "ping-ce-pingone": 13,
  "ping-ce-pingone-aic": 14,
  "ping-ce-pingam": 15,
  "zscaler-zdta": 1,
};

/** Certifications grouped by vendor for the hub, both axes explicitly ordered. */
export function getCertificationsGroupedByVendor(): Array<{ vendor: string; certs: Certification[] }> {
  const groups: Array<{ vendor: string; certs: Certification[] }> = [];
  const seen = new Set<string>();
  const vendorRank = (v: string) => {
    const i = (VENDOR_HUB_ORDER as readonly string[]).indexOf(v);
    return i === -1 ? VENDOR_HUB_ORDER.length : i;
  };
  const certRank = (c: Certification) => CERT_HUB_ORDER[c.key] ?? 999;
  const vendors = [...new Set(certifications.map((c) => c.vendor))].sort(
    (a, b) => vendorRank(a) - vendorRank(b) || a.localeCompare(b),
  );
  for (const vendor of vendors) {
    if (seen.has(vendor)) continue;
    seen.add(vendor);
    const certs = certifications
      .filter((c) => c.vendor === vendor)
      .sort((a, b) => certRank(a) - certRank(b) || a.name.localeCompare(b.name));
    groups.push({ vendor, certs });
  }
  return groups;
}

/** Certifications offered by a given vendor (for vendor-hub cross-links). */
export function getCertificationsForVendor(vendor: string): Certification[] {
  return certifications.filter((c) => c.vendor === vendor);
}

/** The guides that make up a certification, in the certification's study order. */
export function getGuidesForCertification(key: string): StudyGuide[] {
  const cert = certifications.find((c) => c.key === key);
  if (!cert) return [];
  return cert.examSlugs
    .map((slug) => getStudyGuide(slug))
    .filter((g): g is StudyGuide => g !== undefined);
}

/** Count of objectives across a guide's sections (0 while preparing). */
export function objectiveCount(guide: StudyGuide): number {
  return guide.sections.reduce((n, s) => n + s.objectives.length, 0);
}
