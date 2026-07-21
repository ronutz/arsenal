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
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.02",
            text: "Identify the steps to assign users to the appropriate groups with the appropriate access using ZIdentity.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.03",
            text: "Given a scenario including creating or modifying a user group in Zscaler Zidentity, identify the next step to ensure policies apply to that group.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.04",
            text: "Given an Administrator Audit Log, interpret the activity or identify unauthorized activity in the Administrator Audit Logs.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.05",
            text: "Given a scenario including an organization that has strict BYOD policies, identify the appropriate ZCC deployment option that should be used.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.06",
            text: "Given a scenario about an exfiltration, identify the next step that should be taken to check the company's posture.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.07",
            text: "Given a scenario including an organization goal to ensure user devices are compliant before enabling access to the internet or private application, identify the next step that should be taken.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.08",
            text: "Given a scenario in which an organization requires more stringent access control on traffic originating from off of the corporate network, identify the most logical place to put that policy.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.09",
            text: "Given a scenario where an administrator needs to connect to Zscaler a location that requires a certain bandwidth and requirements and no need for HA, identify the type of tunnels that should be used and the minimal amount needed to cover the requisites.",
            relatedArticles: ["vpn-fundamentals"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.10",
            text: "Given a merger and acquisition use case, identify the appropriate configurations necessary to ensure seamless access to internet and private applications.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.11",
            text: "Given a scenario with an example of misordered firewall rules, identify how the rule set will be executed and identify any unintended risks associated with the rule set order.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-A.12",
            text: "Given a scenario to deploy ZPA App Connectors in VMs or Containerized environments, identify the necessary information to be communicated to the team.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
      ] },
      { id: "zdta-psc", title: "Policy & Security Configuration (29%)", objectives: [
          {
            id: "ZDTA-B.01",
            text: "Given a scenario including requirements, identify the appropriate assets where SSL bypass can be implemented.",
            relatedArticles: ["ssl-forward-proxy-interception"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.02",
            text: "Given a scenario including an application that needs to be accessed, identify the bypass that would allow the application to be accessed in this situation.",
            relatedArticles: ["ssl-forward-proxy-interception"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.03",
            text: "Given a scenario and an example of a log, identify why access is being allowed despite an expected policy violation.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.04",
            text: "Given a scenario about creating and modifying a custom URL category, identify how to achieve a given goal.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.05",
            text: "Given a scenario about applying URL filtering rules to users/groups, identify how to achieve a given goal.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.06",
            text: "Given a sandbox scenario including a desired outcome, identify the next action that should be taken.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.07",
            text: "Given an example sandbox report and organizational requirements, identify the trends in malicious activity over a specific timeframe.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.08",
            text: "Given a scenario about file type control, identify how to ensure a given category is prioritized correctly.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.09",
            text: "Given a scenario about applying file type policies and a specific user or group, identify how to apply the correct file type policy based on the roles and security needs.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.10",
            text: "Given a scenario where various users need to access different applications, identify the App Segments that enable proper least privileged access.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.11",
            text: "Given a scenario where various users need to access different applications, identify the proper access policies to enforce least privileged access.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.12",
            text: "Given a scenario including a content inspection rule, analyze the outcome of the rule, identify the appropriate actions to take, or communicate who should take appropriate actions.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.13",
            text: "Given a scenario including DLP notification, block actions, and a user uploading sensitive data, identify the notification method that should be used.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.14",
            text: "Given a scenario including problems with unauthorized SaaS Applications in an organization, identify where to find Risky Assets / Potential Shadow IT in the portal.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.15",
            text: "Given a scenario about enforcing granular controls, identify the outcome of an action.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.16",
            text: "Given an image of rules in a specific order in the platform, identify how a group's access is impacted.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.17",
            text: "Given a scenario about least privilege access, identify the most effective way to achieve the outcome.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.18",
            text: "Given a scenario about the need for defining network segmentation for a private application, identify the most effective network segmentation strategy that should be used.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.19",
            text: "Given a scenario including a micro-segmentation policy and internal applications, identify how to refine the policy to enhance the security posture for internal applications.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.20",
            text: "Given a scenario including specific requirements for client forwarding policies with client connector, identify the Client Connector Forwarding Profile action that will meet the requirements.",
            relatedArticles: ["how-a-pac-file-chooses-a-proxy"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.21",
            text: "Given a scenario including requirements for trusted network bypass rules, identify the proper set of client forwarding policies that bypass applications when on a specific network.",
            relatedArticles: ["how-a-pac-file-chooses-a-proxy"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-B.22",
            text: "Given a scenario about applying posture-based access criteria to enforce device compliance, identify the outcome of the criteria.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
      ] },
      { id: "zdta-mon-tir-io", title: "Monitoring, Reporting & Analytics (13%), Troubleshooting & Incident Response (13%), and Integration & Optimization (9%)", objectives: [
          {
            id: "ZDTA-C.01",
            text: "Given a scenario about the need for specific information from web and firewall logs, identify the log type that should be used.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.02",
            text: "Given an example audit log, identify indicators of privilege escalation.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.03",
            text: "Given a scenario including an executive security summary and a desired goal, identify the appropriate next step given the information in the summary.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.04",
            text: "Given a scenario about tracking application usage over time and performance goals, identify methods to prevent the performance issues.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.05",
            text: "Given a scenario including a goal about connectivity, identify the ZDX diagnostics that should be used to address the goal.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.06",
            text: "Given a scenario including a screenshot of a policy rule and the hierarchy, identify the unintended policy interactions.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.07",
            text: "Given a scenario including policy logic and configuration information, identify how to improve the overall platform performance.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.08",
            text: "Given a scenario including information on known threat actor groups, identify how to block the malicious domains or IPs in Zscaler policies to prevent further compromise.",
            relatedArticles: ["tcp-connection-lifecycle"],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.09",
            text: "Given a scenario where a private application is intermittently working for the same user, identify a likely cause and solution.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
          {
            id: "ZDTA-C.10",
            text: "Given a scenario and information about a system that need updates, identify the steps needed to deploy updates to the system including to the broader user base efficiently and with minimal disruption.",
            relatedArticles: [],
            relatedTools: [],
            manualLinks: [],
            keyPoints: [],
          },
      ] },
    ],
  },
  {
    // BIG-IP DNS Specialist (302): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-cts-dns-302",
    examCode: "302",
    examName: "BIG-IP DNS Specialist (302)",
    vendor: "f5",
    certification: "f5-cts-dns",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/big-ip-dns-specialist-302",
    blueprintSourceLabel: "Catalog facts (fetched 2026-07-21): US$180, English, test-center proctored, passing score 245, 90 minutes, Technology Specialist level; blueprint PDF behind my.f5.com",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // BIG-IP ASM Specialist (303): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-cts-asm-303",
    examCode: "303",
    examName: "BIG-IP ASM Specialist (303)",
    vendor: "f5",
    certification: "f5-cts-asm",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/big-ip-asm-specialist-303",
    blueprintSourceLabel: null,
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // BIG-IP APM Specialist (304): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-cts-apm-304",
    examCode: "304",
    examName: "BIG-IP APM Specialist (304)",
    vendor: "f5",
    certification: "f5-cts-apm",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/big-ip-apm-specialist-304",
    blueprintSourceLabel: null,
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Security Solutions (401): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-cse-security-401",
    examCode: "401",
    examName: "Security Solutions (401)",
    vendor: "f5",
    certification: "f5-cse-sec",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/security-solutions-401",
    blueprintSourceLabel: null,
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // Cloud Solutions (402): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-cse-cloud-402",
    examCode: "402",
    examName: "Cloud Solutions (402)",
    vendor: "f5",
    certification: "f5-cse-cld",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/cloud-solutions-402",
    blueprintSourceLabel: null,
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // NGINX Management (F5N1): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-nginx-f5n1",
    examCode: "F5N1",
    examName: "NGINX Management (F5N1)",
    vendor: "f5",
    certification: "f5-ca-nginx",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/nginx-management-f5n1",
    blueprintSourceLabel: "NGINX exams are delivered via Certiverse online proctoring (per the F5 exam catalog)",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // NGINX Configuration: Knowledge (F5N2): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-nginx-f5n2",
    examCode: "F5N2",
    examName: "NGINX Configuration: Knowledge (F5N2)",
    vendor: "f5",
    certification: "f5-ca-nginx",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/nginx-configuration-knowledge-f5n2",
    blueprintSourceLabel: null,
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // NGINX Configuration: Demonstrate (F5N3): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-nginx-f5n3",
    examCode: "F5N3",
    examName: "NGINX Configuration: Demonstrate (F5N3)",
    vendor: "f5",
    certification: "f5-ca-nginx",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/nginx-configuration-demonstrate-f5n3",
    blueprintSourceLabel: null,
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    // NGINX Troubleshoot (F5N4): awaiting the official blueprint (catalog links it behind
    // my.f5.com Salesforce auth). status "preparing" per the registry's
    // designed workflow until PRIME relays it, as with 101/201/301A/301B.
    slug: "f5-nginx-f5n4",
    examCode: "F5N4",
    examName: "NGINX Troubleshoot (F5N4)",
    vendor: "f5",
    certification: "f5-ca-nginx",
    targetVersion: null,
    blueprintSourceUrl: "https://education.f5.com/certification/nginx-troubleshoot-f5n4",
    blueprintSourceLabel: null,
    status: "preparing",
    examFacts: null,
    sections: [],
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
