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
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    slug: "f5-ca-data-plane-concepts",
    examCode: "F5CAB2",
    examName: "BIG-IP Administration Data Plane Concepts",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    slug: "f5-ca-data-plane-configuration",
    examCode: "F5CAB3",
    examName: "BIG-IP Administration Data Plane Configuration",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    slug: "f5-ca-control-plane-administration",
    examCode: "F5CAB4",
    examName: "BIG-IP Administration Control Plane Administration",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    examFacts: null,
    sections: [],
  },
  {
    slug: "f5-ca-support-and-troubleshoot",
    examCode: "F5CAB5",
    examName: "BIG-IP Administration Support and Troubleshoot",
    vendor: "f5",
    certification: "f5-ca",
    targetVersion: null,
    blueprintSourceUrl: F5CA_SOURCE,
    blueprintSourceLabel: "F5 Education Services",
    status: "preparing",
    examFacts: null,
    sections: [],
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
