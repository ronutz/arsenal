// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/study-guides/reading-paths.ts
// ----------------------------------------------------------------------------
// THE CURATED READING PATHS for the /study-guides page - ordered walks through
// the Learn library, each pairing its articles with the tools a reader
// practices on. A reading path answers what a syllabus answers: "in what order
// should I read these, and what do I do with my hands along the way?"
//
// Reading paths complement the CERTIFICATION study guides
// (src/content/certifications/study-guides.ts): those map official exam
// blueprints objective by objective; a reading path is topic-first and
// exam-free. Both render on /study-guides.
//
// This file follows the house pattern set by src/content/guide/recipes.ts:
// STRUCTURE ONLY. All copy (title, lede) lives in the i18n "studyGuidesIndex"
// namespace under paths.<id>.title / paths.<id>.lede - authored en + pt-BR,
// English fallback elsewhere.
//
// STAYS-CURRENT GUARANTEE (D-74: derive > enforce > discipline): the build
// guard scripts/check-reading-paths.mjs fails the build if any article slug
// here has no en + pt-BR .mdx on disk, or any tool id is not a live tool in
// src/config/tools.ts - renaming or deleting content a path points at cannot
// silently leave a dangling step.
// ============================================================================

/** One curated reading path: ordered articles + the tools to practice with. */
export interface ReadingPath {
  /** Stable id; i18n keys are paths.<id>.title / paths.<id>.lede. */
  id: string;
  /** Category key for the accent dot (same key set as /category). */
  category: string;
  /** Learn article slugs, in reading order. Validated against both locales. */
  articles: string[];
  /** Tool ids to practice with, in first-use order. Validated against the registry. */
  tools: string[];
}

/**
 * The paths, in display order: the two pillars people arrive for (BIG-IP,
 * identity) first, then the protocol foundations, then the craft skill
 * (regular expressions) that supports all of the above.
 */
export const READING_PATHS: ReadingPath[] = [
  {
    // THE F5 STUDY GUIDE (PRIME directive 2026-07-21): everything the retired
    // 101, 201, 301A, and 301B blueprints listed, delivered as this site's
    // articles in teaching order - the exam-free companion to the
    // certification study guides, which map only the CURRENT blueprints.
    // Three movements, mirroring the retired program's own arc:
    //   1. Fundamentals (the 101 scope): OSI to VPN - the networking floor
    //      the modern track assumes instead of certifying.
    //   2. Administration (the 201 / F5-CA scope): the device itself, from
    //      interfaces to HA to support workflows - including EUD, which the
    //      modern program dropped entirely.
    //   3. Specialist (the 301A/B / F5-CTS LTM scope): performance, iRules,
    //      analytics, captures, SSL - closing with the two blueprint-delta
    //      articles that explain this path's own provenance.
    // The GTM/DNS-plane companions that used to live here moved out when the
    // path became blueprint-scoped (GTM was never in these four exams); those
    // articles remain live and hub-listed.
    id: "bigip-fundamentals",
    category: "networking",
    articles: [
      // - Movement 1: fundamentals (retired 101 scope) -
      "osi-model-in-practice",
      "network-devices-switch-router-firewall",
      "ipv4-addressing",
      "subnetting-basics",
      "cidr-notation",
      "private-address-space",
      "nat-explained",
      "dhcp-lease-lifecycle",
      "ipv6-addressing",
      "arp-and-mac-addresses",
      "routing-tables-and-default-gateway",
      "icmp-ping-and-traceroute",
      "tcp-connection-lifecycle",
      "http-versions-09-to-3",
      "certificate-validation",
      "public-vs-private-pki",
      "vpn-fundamentals",
      // - Movement 2: administration (retired 201 / F5-CA scope) -
      "bigip-interfaces-trunks-vlans-selfips",
      "bigip-route-domains",
      "bigip-management-access-port-lockdown",
      "bigip-system-services",
      "bigip-reading-device-status",
      "bigip-log-files-map",
      "how-a-virtual-server-works",
      "ltm-virtual-server-types",
      "bigip-profiles-on-a-virtual-server",
      "bigip-pools-and-load-balancing",
      "ltm-load-balancing-methods",
      "ltm-health-monitors",
      "ltm-persistence-methods",
      "bigip-snat-and-return-traffic",
      "bigip-ltm-request-distribution",
      "bigip-ha-concepts-device-trust-groups",
      "bigip-failover-states-and-operations",
      "bigip-config-sync",
      "bigip-ucs-archives",
      "bigip-license-file-anatomy",
      "bigip-service-check-date",
      "bigip-upgrade-vs-update",
      "bigip-inplace-upgrade-and-64bit",
      "bigip-qkview-and-ihealth",
      "tac-cases-that-get-triaged-fast",
      "bigip-eud-hardware-diagnostics",
      // - Movement 3: specialist (retired 301A/301B / F5-CTS LTM scope) -
      "bigip-l4-protocol-profiles",
      "bigip-oneconnect-connection-reuse",
      "bigip-cmp-clustered-multiprocessing",
      "irule-events-modules-and-profiles",
      "irule-event-order-explained",
      "irule-clientside-vs-serverside",
      "irules-performance-and-timing",
      "bigip-avr-analytics",
      "bigip-iapps-and-fast",
      "bigip-vcmp",
      "bigip-custom-alerting",
      "bigip-tcpdump-safety",
      "bigip-tcpdump-syntax",
      "capturing-on-vlans-and-trunks",
      "reading-a-bigip-capture",
      "f5-clientssl-vs-serverssl",
      "f5-cipher-ordering-and-negotiation",
      "f5-ssl-cert-key-chain",
      "f5-ca-vs-retired-101-201",
      "f5-cts-ltm-vs-retired-301a-301b",
    ],
    tools: [
      "cidr",
      "ipv6",
      "dig-output-explainer",
      "http-methods-comparison",
      "x509",
      "bigip-ltm-lb-simulator",
      "f5-persistence-method-explainer",
      "f5-tmsh-config-explainer",
      "f5-service-check-date",
      "f5-bigip-tcpdump-builder",
      "f5-irules-runtime-calculator",
      "f5-irules-performance-linter",
      "cipher",
      "f5-bigd-thread-calculator",
    ],
  },
  {
    // Token-based identity from first principles: the token itself, its
    // signatures and key sets, then the flows that mint it, then the second
    // factor. Open standards throughout - vendor-neutral by construction.
    id: "modern-identity",
    category: "identity",
    articles: [
      "jwt-anatomy",
      "jwt-signing-algorithms",
      "verifying-a-jwt-with-jwks",
      "oauth-code-flow",
      "pkce",
      "oidc-overview",
      "oidc-vs-oauth",
      "totp-and-hotp",
    ],
    tools: ["jwt", "jwks-explainer", "pkce", "oidc", "totp-hotp"],
  },
  {
    // The PingFederate administration walk: the two assumed fundamentals the
    // official blueprint names (directory, Kerberos), then the ten product
    // articles in teaching order with SCIM beside the data-store/provisioning
    // stop, closing on the two flow articles a working deployment exercises.
    // Companion to the PFP-001 certification guide, which maps the same
    // material objective by objective.
    id: "pingfederate-administration",
    category: "identity",
    articles: [
      "saml-overview",
      "ldap-fundamentals",
      "kerberos-and-spnego",
      "pingfederate-install-and-initial-setup",
      "pingfederate-startup-files",
      "pingfederate-upgrade-playbook",
      "pingfederate-admin-access-and-rbac",
      "pingfederate-operational-hygiene",
      "pingfederate-endpoints-map",
      "pingfederate-data-stores",
      "scim-overview",
      "pingfederate-authentication-adapters",
      "pingfederate-authentication-policies",
      "pingfederate-log-files",
      "saml-bindings-and-sso-initiation",
      "oidc-authorization-code-flow",
    ],
    tools: ["saml-decoder", "x509", "csr-decoder", "cert-renewal-planner", "oidc", "jwt", "pkce", "jwks-explainer"],
  },
  {
    // TLS from the suite string up to the protocol family - ending on the
    // comparison piece that places 1.2, 1.3, DTLS, and QUIC side by side.
    id: "tls-from-zero",
    category: "transport",
    articles: [
      "cipher-suite-anatomy",
      "cipher-suite-naming",
      "tls-cipher-security-keywords",
      "tls13-cipher-suites",
      "hybrid-key-exchange-in-tls",
      "tls12-tls13-dtls-quic",
    ],
    tools: ["cipher"],
  },
  {
    // The web's protocol, told forward: the five-version history first, then
    // the operational pieces (proxies, HSTS, curl beyond the browser).
    id: "http-evolution",
    category: "networking",
    articles: [
      "http-versions-09-to-3",
      "http-methods-the-verbs",
      "http-query-method",
      "http-status-codes-the-five-families",
      "http-headers-anatomy",
      "http-cookies-state-over-stateless",
      "html-forms-and-request-encoding",
      "ajax-fetch-and-xhr",
      "cors-explained",
      "uri-url-urn-whats-the-difference",
      "html-css-and-the-dom",
      "http-proxy-forward-and-reverse",
      "hsts-and-https",
      "curl-protocols-beyond-http",
    ],
    tools: ["http-request-translator", "http-methods-comparison", "http-status-code-explainer", "url-inspector", "curl-command-builder"],
  },
  {
    // The craft skill under log analysis, iRules, and every parser: the five
    // regex articles in teaching order, ending on the failure mode.
    id: "regex-mastery",
    category: "text",
    articles: [
      "regex-quantifiers-and-classes",
      "regex-groups-and-backreferences",
      "regex-anchors-and-boundaries",
      "regex-flags-and-modes",
      "regex-catastrophic-backtracking",
    ],
    tools: ["regex"],
  },
  {
    // The Netskope SASE reading path (Run A): the platform in teaching order,
    // architecture through analytics, matching the accreditation and
    // certification domains the guides transcribe.
    id: "netskope-sase",
    category: "security",
    articles: [
      "netskope-platform-architecture-and-newedge",
      "netskope-steering-methods",
      "how-a-pac-file-chooses-a-proxy",
      "netskope-client-deployment",
      "netskope-inline-tls-decryption",
      "netskope-realtime-vs-api-protection",
      "cloud-confidence-index",
      "dlp-fundamentals",
      "netskope-private-access-npa",
      "netskope-cloud-firewall",
      "netskope-advanced-analytics",
    ],
    tools: ["pac-file-explainer", "netskope-steering-decision-explainer", "saml-decoder"],
  },
  {
    // The Zscaler program end to end, fundamentals-first (R-8): the four
    // transport/identity floors and three security floors, then the Zscaler
    // articles in dependency order - architecture, forwarding, tunnels,
    // agent, firewall, TLS, web controls, files, DLP, CASB, ZPA, posture -
    // with the three native tools where the practice lives.
    id: "zscaler-zero-trust",
    category: "security",
    articles: [
      "gre-tunnels-fundamentals",
      "ipsec-and-ike-fundamentals",
      "tunnel-overhead-mtu-and-mss",
      "proxy-user-authentication-methods",
      "dlp-fundamentals",
      "sandbox-detonation-fundamentals",
      "browser-isolation-fundamentals",
      "zscaler-zero-trust-exchange-architecture",
      "zia-traffic-forwarding-methods",
      "zscaler-tunnel-types-z-tunnel-gre-ipsec",
      "zscaler-client-connector-profiles",
      "zia-cloud-firewall-rule-order",
      "zia-ssl-inspection-policy-and-bypasses",
      "zia-url-filtering-and-cloud-app-control",
      "zia-file-type-control-and-sandbox",
      "zia-dlp-engines-dictionaries-edm-idm",
      "zscaler-casb-and-saas-security",
      "zpa-architecture-app-connectors-service-edges",
      "zpa-app-segments-and-access-policy",
      "zscaler-posture-profiles-and-device-trust",
      "zdx-score-anatomy-and-probes",
      "zscaler-admin-audit-logs",
      "zia-web-and-firewall-log-fields",
      "zscaler-nanolog-nss-and-log-streaming",
      "zscaler-reports-and-executive-summaries",
      "zia-locations-and-sublocations",
      "troubleshooting-zcc-connectivity",
      "zpa-access-troubleshooting",
      "zscaler-exfiltration-response-posture",
      "zscaler-mergers-and-acquisitions",
      "zscaler-platform-updates-and-change-management",
    ],
    tools: ["zscaler-tunnel-chooser", "zcc-forwarding-decision-explainer", "zscaler-firewall-rule-order-simulator", "zscaler-ssl-bypass-planner", "ja4-fingerprint-decoder", "zdx-score-factor-explainer"],
  },
];

// ============================================================================
// CROSS-VENDOR FUNDAMENTALS FLAG (PRIME directive 2026-07-21)
// ----------------------------------------------------------------------------
// Many articles in the F5 path above are vendor-neutral fundamentals. PRIME's
// standing instruction: when a reading path is created for another vendor's
// study guide (Extreme, Fortinet, Netskope, Ping Identity, Zscaler), the
// fundamentals mapped below MUST be considered for inclusion in that vendor's
// path, so every vendor syllabus shares the same floor instead of re-teaching
// or skipping it. This constant is the durable flag: it is not rendered
// anywhere today; it exists so the future path author (human or ANVIL) finds
// the cross-reference obligation next to the data it applies to.
// Keys are Learn article slugs; values are the vendor keys (as defined in
// src/config/vendors.ts) whose future paths should include the article.
// ============================================================================
export const CROSS_VENDOR_FUNDAMENTALS: Record<string, string[]> = {
  // Core L2-L4 networking floor: every vendor's path starts here.
  "osi-model-in-practice": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "network-devices-switch-router-firewall": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "ipv4-addressing": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "subnetting-basics": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "cidr-notation": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "private-address-space": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "nat-explained": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "dhcp-lease-lifecycle": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "ipv6-addressing": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "arp-and-mac-addresses": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "routing-tables-and-default-gateway": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "icmp-ping-and-traceroute": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "tcp-connection-lifecycle": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  "vpn-fundamentals": ["f5", "extreme", "fortinet", "netskope", "ping", "zscaler"],
  // TLS/PKI floor: the vendors whose products terminate, inspect, or broker TLS.
  "certificate-validation": ["f5", "netskope", "ping", "zscaler"],
  "public-vs-private-pki": ["f5", "netskope", "ping", "zscaler"],
  "http-versions-09-to-3": ["f5", "netskope", "ping", "zscaler"],
  // Syslog shelf: the vendors whose platforms are administered through it.
  "syslog-pri-facility-severity": ["f5", "fortinet", "extreme"],
  "syslog-on-network-devices": ["f5", "fortinet", "extreme"],
};
