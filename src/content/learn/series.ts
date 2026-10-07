// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/learn/series.ts
// ----------------------------------------------------------------------------
// THE LEARN SERIES REGISTRY (milestone LS-0 of the student level-up, 2026-10-06;
// PRIME 12:34: "This should be the standard format for articles - belong to a
// series - and have a series-opener", and 18:24: "RICH COMPREHENSIVE Learn
// Series"; PROGRAMME-student-levelup-learn-series-and-study-guides-20261006).
//
// A series is an opener (the article that maps the subject and says why the
// parts belong together) and its parts, in reading order. A part is either an
// article that exists, or one that is planned and named, so the series shows
// its whole shape from the first day and says honestly which parts are still to
// come (the same practice as the study guides' "Article coming").
//
// WHY A SIGNED LIST AND NOT A FRONTMATTER QUERY: the reasoning of
// src/content/learn/stories.ts holds here too. Membership and order are
// editorial judgements; a pattern over slugs or concepts would sweep in
// articles that share a word and miss the ones that share an argument. The
// titles and summaries are NOT here: the pages read them from each article's
// frontmatter, so this file cannot drift out of agreement with the articles.
// Only the series' own name and lede, and the planned parts' names, live in the
// "learnSeries" message namespace (en and pt-BR).
//
// SUBJECT GROUPS (LS-1a, 2026-10-06): every series names the subject the index
// lists it under (SERIES_GROUPS), so forty series read as a page rather than a
// wall. VENDOR GROUPS (LS-1b, the same day): the vendor families' series name
// their vendor instead, and SERIES_VENDOR_GROUPS tells the index which groups
// those are, so it can list the subjects first and the vendors after them.
//
// AN ARTICLE MAY BELONG TO MORE THAN ONE SERIES as a part (NTLM explained is a
// walkthrough of NTLM relay in the traffic-diversion series and, later, a part of
// an authentication series), and its page shows one rail per series; it may OPEN
// at most one. Guarded by scripts/check-learn-series.mjs: every opener and
// written part exists in English and in Portuguese; no article opens two series;
// no article appears twice in one series, nor as a part of the series it opens;
// every planned part is named in both packs; ids are unique; every series has at
// least two written articles counting its opener.
// ============================================================================

/** One part of a series: an article that exists, or a planned one named in the packs. */
export type SeriesPart = { slug: string } | { planned: string };

/**
 * The subjects the index groups the series under, in the order it shows them (LS-1a, 2026-10-06), then the
 * vendors whose platforms have series of their own (LS-1b, the same day); history joined the subjects in LS-1c,
 * with the family histories. Labels at
 * learnSeries.groups.<group> in both packs; the guard checks every series names one of these.
 */
export const SERIES_GROUPS = ["network", "crypto", "web", "identity", "security", "formats", "operations", "history", "f5", "fortinet", "checkpoint", "zscaler", "netskope", "ping", "extreme"] as const;
/** One subject group of the index. */
export type SeriesGroup = (typeof SERIES_GROUPS)[number];
/** The groups that are vendors rather than subjects (LS-1b): the index lists them in a second half, after the subjects. */
export const SERIES_VENDOR_GROUPS: readonly SeriesGroup[] = ["f5", "fortinet", "checkpoint", "zscaler", "netskope", "ping", "extreme"];

/** One series: its id (copy at learnSeries.items.<id>), its subject group, its opener, and its parts in reading order. */
export interface LearnSeries {
  /** Stable id, used in URLs (/learn/series#<id>) and as the i18n key. */
  id: string;
  /** The subject the index lists it under. */
  group: SeriesGroup;
  /** The opener's slug: the article that maps the series. */
  opener: string;
  /** The parts, in the order a reader should meet them. */
  parts: SeriesPart[];
}

/** The series, in the order the index lists them. */
export const LEARN_SERIES: LearnSeries[] = [
  {
    // The reference implementation (milestone (k1), 2026-10-06; PRIME 12:34): the man in the middle and the ways
    // traffic is diverted, in the order the opener's own "members of this series" lists them. The written walkthroughs
    // are the parts; the rest are planned and named, and arrive with the milestones that own their protocols.
    id: "traffic-diversion",
    group: "security",
    opener: "traffic-diversion-and-the-man-in-the-middle",
    parts: [
      { planned: "arpPoisoning" },
      { planned: "macFloodingStp" },
      { planned: "vlanHopping" },
      { planned: "rogueDhcpRa" },
      { planned: "icmpLlmnr" },
      { slug: "the-kaminsky-dns-flaw" },
      { planned: "evilTwin" },
      { planned: "sslStripping" },
      { slug: "ntlm-explained" },
      { slug: "bgp-and-the-routing-chokepoint" },
      { slug: "the-interception-tools" },
    ],
  },
  // ------------------------------------------------------------------------------------------------------------------
  // LS-1a, the sweep of the vendor-neutral library (2026-10-06; PLAN-ls1-the-series-sweep-20261006): every opener an
  // article that already maps its subject, gaining a "This series, in order" section in both languages; every part an
  // article that exists in both. Chains are deliberate: the formats openers are parts of "The formats in between".
  // ------------------------------------------------------------------------------------------------------------------
  {
    // The formats in between (LS-1a).
    id: "formats-in-between",
    group: "formats",
    opener: "the-formats-in-between",
    parts: [
      { slug: "json-grammar" },
      { slug: "config-formats-in-practice" },
      { slug: "reading-xml-structure" },
      { slug: "character-encoding" },
      { slug: "text-encodings-compared" },
      { slug: "url-anatomy" },
      { slug: "unix-time-explained" },
      { slug: "uuid" },
      { slug: "how-diff-works" },
    ],
  },
  {
    // JSON, exactly (LS-1a).
    id: "json",
    group: "formats",
    opener: "json-grammar",
    parts: [
      { slug: "json-string-escapes" },
      { slug: "json-numbers-and-precision" },
      { slug: "json-duplicate-keys" },
      { slug: "json-comments-and-trailing-commas" },
      { slug: "json-formatting-and-canonical" },
      { slug: "json-vs-yaml" },
    ],
  },
  {
    // YAML and configuration files (LS-1a).
    id: "yaml",
    group: "formats",
    opener: "config-formats-in-practice",
    parts: [
      { slug: "json-vs-yaml" },
      { slug: "yaml-type-coercion" },
      { slug: "yaml-block-scalars" },
      { slug: "yaml-anchors-and-aliases" },
    ],
  },
  {
    // XML and its hazards (LS-1a).
    id: "xml",
    group: "formats",
    opener: "reading-xml-structure",
    parts: [
      { slug: "xml-well-formedness" },
      { slug: "xml-namespaces-explained" },
      { slug: "cdata-comments-and-processing-instructions" },
      { slug: "xxe-and-external-entities" },
      { slug: "billion-laughs-and-entity-expansion" },
      { slug: "xxe-and-xml-security" },
    ],
  },
  {
    // Characters, bytes and Unicode (LS-1a).
    id: "text",
    group: "formats",
    opener: "character-encoding",
    parts: [
      { slug: "ascii-the-128-codes" },
      { slug: "unicode-code-points-and-properties" },
      { slug: "utf-8-and-utf-16-byte-by-byte" },
      { slug: "mojibake-and-code-pages" },
      { slug: "hidden-and-lookalike-characters" },
    ],
  },
  {
    // The two alphabets (LS-1a).
    id: "two-alphabets",
    group: "formats",
    opener: "how-networking-inherited-two-alphabets",
    parts: [
      { slug: "greek-alphabet-the-engineers-second-alphabet" },
      { slug: "roman-numerals-how-the-system-works" },
    ],
  },
  {
    // Base16, Base32, Base64 (LS-1a).
    id: "base-encodings",
    group: "formats",
    opener: "text-encodings-compared",
    parts: [
      { slug: "hex-encoding" },
      { slug: "base32" },
      { slug: "base64" },
      { slug: "base64url" },
      { slug: "base64-in-practice" },
    ],
  },
  {
    // URLs, read exactly (LS-1a).
    id: "urls",
    group: "formats",
    opener: "url-anatomy",
    parts: [
      { slug: "uri-url-urn-whats-the-difference" },
      { slug: "percent-encoding" },
      { slug: "query-strings" },
      { slug: "relative-urls-and-resolution" },
      { slug: "url-encoding-and-idn" },
      { slug: "public-suffix" },
      { slug: "deceptive-urls" },
      { slug: "ip-address-obfuscation-tricks" },
    ],
  },
  {
    // Time as computers count it (LS-1a).
    id: "time",
    group: "formats",
    opener: "unix-time-explained",
    parts: [
      { slug: "epoch-units-seconds-to-nanoseconds" },
      { slug: "unix-time-and-leap-seconds" },
      { slug: "the-year-2038-problem" },
      { slug: "iso-8601-and-rfc-3339" },
      { slug: "time-arithmetic-and-time-zones" },
    ],
  },
  {
    // Identifiers: UUIDs and their kin (LS-1a).
    id: "identifiers",
    group: "formats",
    opener: "uuid",
    parts: [
      { slug: "uuid-versions" },
      { slug: "uuid-collisions" },
      { slug: "uuid-database-keys" },
      { slug: "sortable-id-formats" },
    ],
  },
  {
    // Diffs, merges and Git (LS-1a).
    id: "diff",
    group: "formats",
    opener: "how-diff-works",
    parts: [
      { slug: "reading-a-diff" },
      { slug: "diff-minimal-edits" },
      { slug: "diff-word-and-character-level" },
      { slug: "diff-three-way-and-merge-conflicts" },
      { slug: "git" },
      { slug: "github" },
    ],
  },
  {
    // Regular expressions (LS-1a).
    id: "regex",
    group: "formats",
    opener: "regex-quantifiers-and-classes",
    parts: [
      { slug: "regex-anchors-and-boundaries" },
      { slug: "regex-groups-and-backreferences" },
      { slug: "regex-flags-and-modes" },
      { slug: "regex-catastrophic-backtracking" },
    ],
  },
  {
    // Hashes and HMAC (LS-1a).
    id: "hashing",
    group: "crypto",
    opener: "hashing-encryption-encoding",
    parts: [
      { slug: "hashing" },
      { slug: "why-hashes-are-one-way" },
      { slug: "hash-collisions" },
      { slug: "hash-function-families" },
      { slug: "hmac" },
      { slug: "why-hmac" },
      { slug: "verifying-hmac" },
      { slug: "hmac-api-signing" },
    ],
  },
  {
    // Storing passwords (LS-1a).
    id: "passwords",
    group: "crypto",
    opener: "password-hashing",
    parts: [
      { slug: "brute-force-vs-lookup-tables" },
      { slug: "why-salting-defeats-precomputed-tables" },
      { slug: "keyspace-entropy-and-crack-time" },
      { slug: "slow-kdfs-bcrypt-scrypt-argon2" },
      { slug: "choosing-a-password-hash" },
    ],
  },
  {
    // Certificates: the object and its trust (LS-1a).
    id: "certificates",
    group: "crypto",
    opener: "x509-anatomy",
    parts: [
      { slug: "certificate-formats" },
      { slug: "certificate-signing-request" },
      { slug: "certificate-validation" },
      { slug: "certificate-chains-order-anchors-and-what-breaks-them" },
      { slug: "authority-information-access" },
      { slug: "certificate-revocation" },
      { slug: "ocsp-must-staple" },
      { slug: "the-certificate-authority-chokepoint" },
      { slug: "rsa-and-diginotar-2011" },
      { slug: "pki-family-history" },
    ],
  },
  {
    // Certificate lifetimes and renewal (LS-1a).
    id: "certificate-lifecycle",
    group: "crypto",
    opener: "tls-certificate-lifetimes",
    parts: [
      { slug: "certificate-validity-windows" },
      { slug: "renewing-before-expiry" },
      { slug: "dcv-and-sii-reuse" },
      { slug: "public-vs-private-pki" },
      { slug: "acme-protocol" },
      { slug: "lets-encrypt" },
    ],
  },
  {
    // TLS and the cipher suites (LS-1a).
    id: "tls",
    group: "crypto",
    opener: "tls12-tls13-dtls-quic",
    parts: [
      { slug: "why-we-say-ssl-when-we-mean-tls" },
      { slug: "diffie-hellman-for-everyone" },
      { slug: "forward-secrecy" },
      { slug: "cipher-suite-anatomy" },
      { slug: "cipher-suite-naming" },
      { slug: "cipher-families" },
      { slug: "aead-vs-cbc" },
      { slug: "tls13-cipher-suites" },
      { slug: "tls-cipher-security-keywords" },
      { slug: "which-cipher-suites-to-use" },
      { slug: "the-named-tls-attacks" },
      { slug: "tls-reverse-proxy-inbound" },
      { slug: "ssl-forward-proxy-interception" },
    ],
  },
  {
    // Post-quantum cryptography (LS-1a).
    id: "post-quantum",
    group: "crypto",
    opener: "quantum-threat-to-cryptography",
    parts: [
      { slug: "nist-pqc-standards" },
      { slug: "hybrid-key-exchange-in-tls" },
    ],
  },
  {
    // Fingerprinting what a client emits (LS-1a).
    id: "fingerprinting",
    group: "crypto",
    opener: "passive-fingerprinting-what-you-emit",
    parts: [
      { slug: "passive-tls-fingerprinting-ja3" },
      { slug: "ja3-to-ja4-fingerprinting" },
      { slug: "what-is-a-ja4-tls-fingerprint" },
    ],
  },
  {
    // The browser's security headers (LS-1a).
    id: "web-security-headers",
    group: "web",
    opener: "secure-headers-overview",
    parts: [
      { slug: "hsts-and-https" },
      { slug: "cookie-security-flags" },
      { slug: "cors-explained" },
      { slug: "content-security-policy" },
      { slug: "content-security-policy-read-by-the-specification" },
      { slug: "clickjacking-and-framing" },
    ],
  },
  {
    // Server-side request forgery (LS-1a).
    id: "ssrf",
    group: "web",
    opener: "what-is-ssrf",
    parts: [
      { slug: "dangerous-url-schemes" },
      { slug: "cloud-metadata-endpoints-and-ssrf" },
      { slug: "ssrf-defenses-allowlists" },
    ],
  },
  {
    // curl, flag by flag (LS-1a).
    id: "curl",
    group: "web",
    opener: "reading-a-curl-command",
    parts: [
      { slug: "curl-method-inference" },
      { slug: "curl-data-flags-and-content-type" },
      { slug: "curl-headers-auth-and-cookies" },
      { slug: "curl-security-flags" },
      { slug: "curl-to-fetch" },
      { slug: "curl-protocols-beyond-http" },
    ],
  },
  {
    // NGINX, from configuration to troubleshooting (LS-1a).
    id: "nginx",
    group: "web",
    opener: "nginx-configuration-tree-and-includes",
    parts: [
      { slug: "nginx-location-matching-order" },
      { slug: "nginx-proxy-pass-uri-rewriting" },
      { slug: "nginx-proxy-cache-what-gets-stored" },
      { slug: "nginx-limiting-connections-and-rate" },
      { slug: "nginx-reload-signals-and-first-troubleshooting" },
      { slug: "apache-httpd-and-what-nginx-was-written-against" },
    ],
  },
  {
    // DNS, read from the answer (LS-1a).
    id: "dns",
    group: "network",
    opener: "reading-a-dns-answer",
    parts: [
      { slug: "reading-dig-output" },
      { slug: "reading-nslookup-output" },
      { slug: "authoritative-vs-non-authoritative-answers" },
      { slug: "dns-message-header-and-flags" },
      { slug: "edns-and-the-opt-pseudosection" },
      { slug: "dns-record-types-in-answers" },
      { slug: "nslookup-record-types" },
      { slug: "nslookup-errors-explained" },
      { slug: "anatomy-of-a-dig-command-line" },
      { slug: "dig-query-options" },
      { slug: "nslookup-interactive-mode" },
      { slug: "dig-trace-and-delegation" },
      { slug: "reverse-dns-lookups-with-nslookup" },
      { slug: "dnssec-records-in-dig" },
      { slug: "nslookup-vs-dig" },
    ],
  },
  {
    // DNS as infrastructure (LS-1a).
    id: "dns-infrastructure",
    group: "network",
    opener: "dns-family-history",
    parts: [
      { slug: "the-kaminsky-dns-flaw" },
      { slug: "what-happens-if-the-dns-root-goes-dark" },
      { slug: "choosing-a-public-dns-resolver" },
      { slug: "dns-blocklists-and-response-policy" },
    ],
  },
  {
    // IPv4 addressing and subnetting (LS-1a).
    id: "ipv4",
    group: "network",
    opener: "ipv4-addressing",
    parts: [
      { slug: "cidr-notation" },
      { slug: "subnetting-basics" },
      { slug: "vlsm" },
      { slug: "vlsm-worked-example" },
      { slug: "subnet-overlap-and-gaps" },
      { slug: "route-summarization" },
      { slug: "supernetting-and-aggregation" },
      { slug: "private-address-space" },
      { slug: "private-vs-public-ip-ranges" },
      { slug: "nat-explained" },
      { slug: "cgnat-address-sharing-and-attribution" },
    ],
  },
  {
    // IPv6 (LS-1a).
    id: "ipv6",
    group: "network",
    opener: "ipv6-addressing",
    parts: [
      { slug: "ipv6-subnetting" },
      { slug: "ipv6-address-configuration" },
      { slug: "ipv6-neighbor-discovery" },
      { slug: "ipv6-transition" },
    ],
  },
  {
    // Routing (LS-1a).
    id: "routing",
    group: "network",
    opener: "routing-tables-and-default-gateway",
    parts: [
      { slug: "ospf-primer" },
      { slug: "isis-primer" },
      { slug: "bgp-primer" },
      { slug: "bgp-and-the-routing-chokepoint" },
      { slug: "mpls-primer" },
      { slug: "bfd-when-a-link-is-up-and-dead" },
      { slug: "first-hop-redundancy-vrrp-and-hsrp" },
      { slug: "multicast-what-it-costs-to-not-flood" },
    ],
  },
  {
    // Tunnels and VPNs (LS-1a).
    id: "tunnels",
    group: "network",
    opener: "vpn-fundamentals",
    parts: [
      { slug: "gre-tunnels-fundamentals" },
      { slug: "ipsec-and-ike-fundamentals" },
      { slug: "wireguard-the-small-tunnel" },
      { slug: "tunnel-overhead-mtu-and-mss" },
      { slug: "jumbo-frames" },
      { slug: "the-ssl-vpn-is-being-dismantled" },
    ],
  },
  {
    // Load balancing and persistence (LS-1a).
    id: "load-balancing",
    group: "network",
    opener: "load-balancing-what-actually-decides-where-a-request-goes",
    parts: [
      { slug: "how-a-virtual-server-works" },
      { slug: "tcp-proxy-layer-4" },
      { slug: "choosing-a-persistence-method" },
      { slug: "source-address-persistence-and-mega-proxy" },
      { slug: "fallback-persistence-and-match-across" },
      { slug: "persistence-mirroring-and-ha" },
      { slug: "gslb-two-tier-pool-then-member" },
      { slug: "adc-family-history" },
    ],
  },
  {
    // Syslog (LS-1a).
    id: "syslog",
    group: "operations",
    opener: "reading-a-syslog-message-field-by-field",
    parts: [
      { slug: "syslog-pri-facility-severity" },
      { slug: "syslog-facilities-and-severities" },
      { slug: "syslog-message-formats" },
      { slug: "syslog-transport" },
      { slug: "syslog-on-network-devices" },
      { slug: "log-levels-across-systems-one-ladder-many-rungs" },
    ],
  },
  {
    // SAML (LS-1a).
    id: "saml",
    group: "identity",
    opener: "saml-overview",
    parts: [
      { slug: "saml-bindings-and-sso-initiation" },
      { slug: "saml-assertions-and-conditions" },
      { slug: "saml-signatures" },
      { slug: "saml-proxy-explained" },
    ],
  },
  {
    // OAuth and OpenID Connect (LS-1a).
    id: "oauth-oidc",
    group: "identity",
    opener: "oidc-vs-oauth",
    parts: [
      { slug: "oauth-code-flow" },
      { slug: "oauth-client-types" },
      { slug: "pkce" },
      { slug: "oauth-tokens" },
      { slug: "oauth-choosing-the-grant" },
      { slug: "oidc-overview" },
      { slug: "oidc-authorization-code-flow" },
      { slug: "id-token-claims" },
      { slug: "oidc-discovery" },
    ],
  },
  {
    // JWT and JWKS (LS-1a).
    id: "jwt",
    group: "identity",
    opener: "jwt-anatomy",
    parts: [
      { slug: "jwt-signing-algorithms" },
      { slug: "jwk-key-types" },
      { slug: "jwk-parameters-and-thumbprints" },
      { slug: "jwks-and-key-rotation" },
      { slug: "verifying-a-jwt-with-jwks" },
      { slug: "jwt-security" },
      { slug: "jwt-algorithm-confusion" },
    ],
  },
  {
    // One-time codes and passkeys (LS-1a).
    id: "one-time-codes",
    group: "identity",
    opener: "totp-and-hotp",
    parts: [
      { slug: "totp-provisioning-uris-and-qr" },
      { slug: "validating-totp-codes" },
      { slug: "passkeys-and-phishing-resistant-authentication" },
    ],
  },
  {
    // The operator's Unix (LS-1a).
    id: "unix",
    group: "operations",
    opener: "unix-and-the-appliance-you-operate",
    parts: [
      { slug: "terminal-shell-tty-console" },
      { slug: "file-modes-octal-symbolic-and-the-special-bits" },
      { slug: "cron-the-schedule-language" },
      { slug: "expect-scripts-explained" },
      { slug: "linux-the-kernel-that-ate-the-world" },
      { slug: "the-linux-distribution-families" },
      { slug: "what-grew-out-of-linux" },
      { slug: "open-source-and-the-meaning-of-free" },
    ],
  },
  {
    // Zero trust, SSE and the proxy (LS-1a).
    id: "zero-trust",
    group: "security",
    opener: "zero-trust-ztna-and-sase-without-the-marketing",
    parts: [
      { slug: "sse-single-pass-architecture" },
      { slug: "sse-five-vendors-one-decision" },
      { slug: "how-a-pac-file-chooses-a-proxy" },
      { slug: "proxy-user-authentication-methods" },
      { slug: "browser-isolation-fundamentals" },
      { slug: "sandbox-detonation-fundamentals" },
      { slug: "dlp-fundamentals" },
      { slug: "dlp-checksums-and-why-the-rule-did-not-fire" },
    ],
  },
  {
    // CVSS (LS-1a).
    id: "cvss",
    group: "security",
    opener: "how-cvss-scoring-works",
    parts: [
      { slug: "cvss-vector-string-format" },
      { slug: "cvss-base-metrics-explained" },
      { slug: "cvss-temporal-and-environmental" },
      { slug: "cvss-severity-bands-and-limits" },
      { slug: "cvss-v3-vs-v4" },
    ],
  },
  // ------------------------------------------------------------------------------------------------------------------
  // LS-1b, the sweep of the vendor families (2026-10-06; PLAN-ls1-the-series-sweep-20261006): the openers that
  // already map a platform (the XC request end to end, what a BIG-IP says about itself, the Extreme fabric, the Check
  // Point three tiers, the SOC frame, the Zscaler exchange) and the first article of each family otherwise.
  // ------------------------------------------------------------------------------------------------------------------
  {
    // F5 Distributed Cloud, one request end to end (LS-1b).
    id: "f5xc",
    group: "f5",
    opener: "f5-distributed-cloud-one-request-end-to-end",
    parts: [
      { slug: "f5xc-ce-registration-and-egress" },
      { slug: "f5xc-domain-matching-and-listener-logic" },
      { slug: "f5xc-http-lb-route-evaluation" },
      { slug: "f5xc-origin-pool-anatomy" },
      { slug: "f5xc-lb-algorithms-and-persistence" },
      { slug: "f5xc-tls-security-levels-explained" },
      { slug: "how-xc-service-policies-match" },
      { slug: "xc-service-policy-predicates-and-logic" },
      { slug: "xc-service-policy-actions-and-default-deny" },
      { slug: "xc-rule-combining-algorithms" },
      { slug: "xc-matcher-case-sensitivity-and-transformers" },
      { slug: "xc-service-policy-vs-irules" },
      { slug: "f5xc-rate-limiting-explained" },
      { slug: "f5xc-openapi-and-api-inventory" },
      { slug: "f5xc-security-events-anatomy" },
      { slug: "f5xc-config-hazards" },
    ],
  },
  {
    // What a BIG-IP says about itself (LS-1b).
    id: "bigip-self-description",
    group: "f5",
    opener: "reading-what-a-bigip-says-about-itself",
    parts: [
      { slug: "anatomy-of-bigip-conf" },
      { slug: "icontrol-rest-paths" },
      { slug: "f5os-restconf-paths" },
      { slug: "bigip-license-file-anatomy" },
      { slug: "bigip-service-check-date" },
      { slug: "f5-monthly-release-cadence" },
    ],
  },
  {
    // BIG-IP and F5OS versions and upgrades (LS-1b).
    id: "bigip-versions",
    group: "f5",
    opener: "bigip-tmos-version-timeline",
    parts: [
      { slug: "bigip-upgrade-vs-update" },
      { slug: "bigip-license-reactivation" },
      { slug: "bigip-inplace-upgrade-and-64bit" },
      { slug: "bigip-21x-whats-new" },
      { slug: "bigip-21x-access-identity" },
      { slug: "f5os-2-0-whats-new" },
      { slug: "f5os-tenant-lifecycle" },
    ],
  },
  {
    // BIG-IP foundations, from interface to pool member (LS-1b).
    id: "bigip-foundations",
    group: "f5",
    opener: "bigip-interfaces-trunks-vlans-selfips",
    parts: [
      { slug: "bigip-route-domains" },
      { slug: "bigip-management-access-port-lockdown" },
      { slug: "bigip-system-services" },
      { slug: "how-a-virtual-server-works" },
      { slug: "ltm-virtual-server-types" },
      { slug: "bigip-profiles-on-a-virtual-server" },
      { slug: "bigip-pools-and-load-balancing" },
      { slug: "ltm-load-balancing-methods" },
      { slug: "bigip-ltm-request-distribution" },
      { slug: "ltm-health-monitors" },
      { slug: "ltm-persistence-methods" },
      { slug: "bigip-snat-and-return-traffic" },
      { slug: "bigip-oneconnect-connection-reuse" },
      { slug: "bigip-l4-protocol-profiles" },
      { slug: "bigip-cmp-clustered-multiprocessing" },
      { slug: "bigip-vcmp" },
    ],
  },
  {
    // BIG-IP high availability (LS-1b).
    id: "bigip-ha",
    group: "f5",
    opener: "bigip-ha-concepts-device-trust-groups",
    parts: [
      { slug: "bigip-config-sync" },
      { slug: "bigip-failover-states-and-operations" },
      { slug: "persistence-mirroring-and-ha" },
    ],
  },
  {
    // BIG-IP troubleshooting and operations (LS-1b).
    id: "bigip-troubleshooting",
    group: "f5",
    opener: "bigip-reading-device-status",
    parts: [
      { slug: "reading-bigip-statistics" },
      { slug: "bigip-log-files-map" },
      { slug: "bigip-tcpdump-syntax" },
      { slug: "bigip-tcpdump-safety" },
      { slug: "f5-ethernet-trailer" },
      { slug: "reading-a-bigip-capture" },
      { slug: "tmm-detail-and-peer-flows" },
      { slug: "bigip-qkview-and-ihealth" },
      { slug: "bigip-eud-hardware-diagnostics" },
      { slug: "bigip-ucs-archives" },
      { slug: "bigip-custom-alerting" },
      { slug: "bigip-avr-analytics" },
    ],
  },
  {
    // BIG-IP SSL profiles and ciphers (LS-1b).
    id: "bigip-ssl",
    group: "f5",
    opener: "f5-clientssl-vs-serverssl",
    parts: [
      { slug: "f5-ssl-cert-key-chain" },
      { slug: "f5-ssl-profile-protocol-options" },
      { slug: "f5-cipher-string-syntax" },
      { slug: "f5-cipher-rules-and-groups" },
      { slug: "f5-cipher-ordering-and-negotiation" },
      { slug: "f5-tls13-vs-tls12-ciphers" },
      { slug: "enforcing-forward-secrecy-on-f5" },
      { slug: "f5-ssl-renegotiation-and-ocsp" },
      { slug: "f5-ssl-client-auth-mtls" },
      { slug: "bigip-post-quantum-tls" },
      { slug: "bigip-acme-certificate-automation" },
      { slug: "f5-ssl-orchestrator-topologies" },
    ],
  },
  {
    // BIG-IP persistence cookies (LS-1b).
    id: "bigip-cookies",
    group: "f5",
    opener: "bigip-cookie-persistence-methods",
    parts: [
      { slug: "f5-bigip-persistence-cookies" },
      { slug: "bigip-cookie-formats" },
      { slug: "bigip-cookie-disclosure" },
      { slug: "bigip-cookie-encryption" },
    ],
  },
  {
    // BIG-IP DNS and global load balancing (LS-1b).
    id: "bigip-dns",
    group: "f5",
    opener: "bigip-dns-request-processing-order",
    parts: [
      { slug: "how-iquery-connects-bigip-dns" },
      { slug: "gslb-two-tier-pool-then-member" },
      { slug: "gtm-load-balancing-methods" },
      { slug: "gtm-topology-records-and-longest-match" },
      { slug: "bigip-dns-multi-rpz" },
    ],
  },
  {
    // The BIG-IP automation toolchain (LS-1b).
    id: "bigip-automation",
    group: "f5",
    opener: "bigip-declarative-onboarding-do",
    parts: [
      { slug: "as3-declaration-anatomy" },
      { slug: "bigip-telemetry-streaming-ts" },
      { slug: "bigip-iapps-and-fast" },
    ],
  },
  {
    // Network security on the BIG-IP (LS-1b).
    id: "bigip-network-security",
    group: "f5",
    opener: "bigip-packet-filters",
    parts: [
      { slug: "bigip-afm-contexts-and-rule-processing" },
      { slug: "bigip-syn-flood-protection" },
      { slug: "bigip-connection-eviction-policies" },
    ],
  },
  {
    // BIG-IP APM (LS-1b).
    id: "bigip-apm",
    group: "f5",
    opener: "bigip-apm-session-variables",
    parts: [
      { slug: "bigip-apm-sso-methods" },
      { slug: "f5-apm-saml-federation" },
    ],
  },
  {
    // BIG-IP Advanced WAF (LS-1b).
    id: "awaf",
    group: "f5",
    opener: "awaf-declarative-policy-structure",
    parts: [
      { slug: "awaf-enforcement-mode-blocking-vs-transparent" },
      { slug: "awaf-signature-staging-and-enforcement-readiness" },
      { slug: "awaf-content-profiles" },
      { slug: "awaf-nested-policies" },
      { slug: "awaf-session-tracking" },
      { slug: "awaf-data-guard-response-masking" },
      { slug: "awaf-evasion-techniques" },
      { slug: "awaf-client-side-signals-and-challenges" },
      { slug: "awaf-l7-behavioral-dos" },
      { slug: "awaf-false-positives" },
      { slug: "awaf-block-triage" },
      { slug: "awaf-automatic-learning-poisoning" },
      { slug: "bigip-http3-waf" },
      { slug: "bigip-http-query-method" },
    ],
  },
  {
    // iRules events and the connection lifecycle (LS-1b).
    id: "irule-events",
    group: "f5",
    opener: "irule-event-order-explained",
    parts: [
      { slug: "irule-clientside-vs-serverside" },
      { slug: "irule-events-modules-and-profiles" },
      { slug: "irule-fastl4-vs-standard-events" },
      { slug: "irule-ssl-handshake-events" },
      { slug: "irule-priority-and-event-order" },
      { slug: "writing-irules-that-behave" },
    ],
  },
  {
    // The Tcl inside iRules (LS-1b).
    id: "irules-tcl",
    group: "f5",
    opener: "irules-style-guide-explained",
    parts: [
      { slug: "irules-expression-operators" },
      { slug: "irules-tcl-number-notation" },
      { slug: "irules-building-strings" },
      { slug: "irules-string-commands" },
      { slug: "irules-findstr-substr-getfield" },
      { slug: "irules-scan-command" },
      { slug: "irules-branching-and-lookups" },
      { slug: "irules-loops-and-lists" },
      { slug: "irules-procedures-proc-and-call" },
      { slug: "irules-cmp-and-static-namespace" },
      { slug: "irules-performance-and-timing" },
      { slug: "irules-lx-explained" },
    ],
  },
  {
    // Check Point, from the three tiers to the upgrade (LS-1b).
    id: "checkpoint",
    group: "checkpoint",
    opener: "checkpoint-three-tier-architecture-and-smartconsole",
    parts: [
      { slug: "checkpoint-administrators-sessions-and-objects" },
      { slug: "checkpoint-security-policy-and-rule-base" },
      { slug: "checkpoint-policy-layers-ordered-and-inline" },
      { slug: "checkpoint-advanced-policy-and-nat" },
      { slug: "checkpoint-nat-proxy-arp-and-the-silent-black-hole" },
      { slug: "checkpoint-identity-awareness" },
      { slug: "checkpoint-https-inspection-and-web-control" },
      { slug: "checkpoint-threat-prevention-fundamentals" },
      { slug: "checkpoint-site-to-site-vpn" },
      { slug: "checkpoint-logging-and-monitoring" },
      { slug: "checkpoint-smartevent-and-compliance" },
      { slug: "checkpoint-management-high-availability" },
      { slug: "checkpoint-elasticxl-cluster" },
      { slug: "checkpoint-upgrades-and-migrations" },
    ],
  },
  {
    // FortiGate administration (LS-1b).
    id: "fortigate",
    group: "fortinet",
    opener: "fortigate-initial-configuration-and-operation-modes",
    parts: [
      { slug: "fortios-cli-grammar" },
      { slug: "fortigate-firewall-policy-and-nat" },
      { slug: "fortigate-policy-order" },
      { slug: "fortigate-debug-flow" },
      { slug: "reading-a-fortigate-sniffer-trace" },
      { slug: "fortigate-routing-and-sdwan-selection" },
      { slug: "fortigate-security-profiles-flow-vs-proxy" },
      { slug: "fortinet-ssl-inspection-modes" },
      { slug: "fortigate-authentication-and-fsso" },
      { slug: "fortigate-ipsec-vpn-topologies" },
      { slug: "fortigate-fgcp-ha-clustering" },
      { slug: "fortigate-logging-and-diagnostics" },
      { slug: "fortigate-traffic-shaping-and-qos" },
      { slug: "fortigate-dns-server-modes-and-filtering" },
      { slug: "fortigate-carrier-nat-and-specialised-traffic" },
      { slug: "fortigate-acme-certificate-automation" },
    ],
  },
  {
    // Fortinet security operations (LS-1b).
    id: "fortinet-secops",
    group: "fortinet",
    opener: "fortinet-soc-architecture-and-adversary-behaviour",
    parts: [
      { slug: "fortianalyzer-log-ingestion-and-storage" },
      { slug: "fortianalyzer-reports-datasets-and-charts" },
      { slug: "fortianalyzer-soc-events-incidents-playbooks" },
      { slug: "fortisiem-rules-incidents-and-remediation" },
      { slug: "fortisiem-analytics-queries-and-cmdb" },
      { slug: "fortisiem-ml-ueba-and-platform-integration" },
      { slug: "fortisoar-architecture-and-data-model" },
      { slug: "fortisoar-playbooks-jinja-and-connectors" },
      { slug: "fortisoar-incident-workflow-and-troubleshooting" },
      { slug: "fortiedr-architecture-and-deployment" },
      { slug: "fortiedr-policies-playbooks-and-communication-control" },
      { slug: "fortiedr-threat-hunting-forensics-and-investigation" },
      { slug: "fortindr-cloud-architecture-detections-and-events" },
      { slug: "fortindr-cloud-iql-hunting-and-integration" },
      { slug: "fortideceptor-decoys-lures-and-deception-strategy" },
      { slug: "fortideceptor-deployment-and-incident-analysis" },
      { slug: "fortirecon-attack-surface-and-digital-risk" },
    ],
  },
  {
    // FortiMail (LS-1b).
    id: "fortimail",
    group: "fortinet",
    opener: "fortimail-smtp-fundamentals-and-deployment",
    parts: [
      { slug: "fortimail-policies-session-filtering-and-antispam" },
      { slug: "fortimail-content-security-encryption-and-ibe" },
      { slug: "fortimail-workspace-security-and-policies" },
    ],
  },
  {
    // FortiManager (LS-1b).
    id: "fortimanager",
    group: "fortinet",
    opener: "fortimanager-adoms-and-device-registration",
    parts: [
      { slug: "fortimanager-policy-packages-and-installs" },
      { slug: "fortimanager-scripts-revisions-and-troubleshooting" },
    ],
  },
  {
    // FortiSwitch (LS-1b).
    id: "fortiswitch",
    group: "fortinet",
    opener: "fortiswitch-fortilink-provisioning-and-topologies",
    parts: [
      { slug: "fortiswitch-vlans-stp-ports-and-qos" },
      { slug: "fortiswitch-port-security-and-diagnostics" },
    ],
  },
  {
    // FortiAP (LS-1b).
    id: "fortiap",
    group: "fortinet",
    opener: "fortiap-wireless-fundamentals-and-deployment",
    parts: [
      { slug: "fortiap-secure-wireless-access-and-segmentation" },
      { slug: "fortiap-monitoring-threats-and-troubleshooting" },
    ],
  },
  {
    // PingFederate, installed to upgraded (LS-1b).
    id: "pingfederate",
    group: "ping",
    opener: "pingfederate-install-and-initial-setup",
    parts: [
      { slug: "pingfederate-startup-files" },
      { slug: "pingfederate-endpoints-map" },
      { slug: "pingfederate-admin-access-and-rbac" },
      { slug: "pingfederate-data-stores" },
      { slug: "pingfederate-authentication-adapters" },
      { slug: "pingfederate-authentication-policies" },
      { slug: "pingfederate-ognl-expressions" },
      { slug: "pingfederate-log-files" },
      { slug: "pingfederate-operational-hygiene" },
      { slug: "pingfederate-upgrade-playbook" },
    ],
  },
  {
    // The Ping identity platform (LS-1b).
    id: "ping-platform",
    group: "ping",
    opener: "pingone-platform",
    parts: [
      { slug: "pingone-davinci-orchestration" },
      { slug: "pingaccess-policy-model" },
      { slug: "pingdirectory-platform" },
      { slug: "ping-forgerock-lineage" },
    ],
  },
  {
    // The Zscaler Zero Trust Exchange (LS-1b).
    id: "zscaler",
    group: "zscaler",
    opener: "zscaler-zero-trust-exchange-architecture",
    parts: [
      { slug: "zscaler-tunnel-types-z-tunnel-gre-ipsec" },
      { slug: "zscaler-client-connector-profiles" },
      { slug: "troubleshooting-zcc-connectivity" },
      { slug: "zscaler-posture-profiles-and-device-trust" },
      { slug: "zscaler-casb-and-saas-security" },
      { slug: "zdx-score-anatomy-and-probes" },
      { slug: "zscaler-nanolog-nss-and-log-streaming" },
      { slug: "zscaler-admin-audit-logs" },
      { slug: "zscaler-reports-and-executive-summaries" },
      { slug: "zscaler-exfiltration-response-posture" },
      { slug: "zscaler-platform-updates-and-change-management" },
      { slug: "zscaler-mergers-and-acquisitions" },
    ],
  },
  {
    // Zscaler Internet Access (LS-1b).
    id: "zia",
    group: "zscaler",
    opener: "zia-traffic-forwarding-methods",
    parts: [
      { slug: "zia-locations-and-sublocations" },
      { slug: "zia-ssl-inspection-policy-and-bypasses" },
      { slug: "zia-url-filtering-and-cloud-app-control" },
      { slug: "zia-cloud-firewall-rule-order" },
      { slug: "zia-file-type-control-and-sandbox" },
      { slug: "zia-dlp-engines-dictionaries-edm-idm" },
      { slug: "zia-web-and-firewall-log-fields" },
    ],
  },
  {
    // Zscaler Private Access (LS-1b).
    id: "zpa",
    group: "zscaler",
    opener: "zpa-architecture-app-connectors-service-edges",
    parts: [
      { slug: "zpa-app-segments-and-access-policy" },
      { slug: "zpa-access-troubleshooting" },
    ],
  },
  {
    // Netskope, one platform and two data paths (LS-1b).
    id: "netskope",
    group: "netskope",
    opener: "netskope-platform-architecture-and-newedge",
    parts: [
      { slug: "netskope-steering-methods" },
      { slug: "netskope-client-deployment" },
      { slug: "netskope-inline-tls-decryption" },
      { slug: "netskope-realtime-vs-api-protection" },
      { slug: "netskope-cloud-firewall" },
      { slug: "netskope-private-access-npa" },
      { slug: "netskope-advanced-analytics" },
    ],
  },
  {
    // Extreme Fabric Connect, one service edge to edge (LS-1b).
    id: "extreme-fabric",
    group: "extreme",
    opener: "extreme-fabric-connect-one-service-edge-to-edge",
    parts: [
      { slug: "voss-vs-exos" },
      { slug: "extreme-universal-os-names" },
      { slug: "how-extremexos-config-is-structured" },
      { slug: "spb-fabric-vocabulary" },
      { slug: "voss-fabric-connect-spbm" },
      { slug: "voss-isis-and-nicknames" },
      { slug: "voss-i-sid-and-vsns" },
      { slug: "spbm-multicast-addresses-are-computed-not-learned" },
      { slug: "voss-fabric-attach" },
      { slug: "voss-smlt-and-vist" },
    ],
  },
  // ------------------------------------------------------------------------------------------------------------------
  // LS-1c (2026-10-06; PLAN-ls1-the-series-sweep-20261006): the two series whose openers are new articles, HTTP and
  // the family histories (three of whose parts also sit in LS-1a's DNS, certificates and load-balancing series).
  // ------------------------------------------------------------------------------------------------------------------
  {
    // HTTP, from the request line to QUERY (LS-1c).
    id: "http",
    group: "web",
    opener: "http-from-the-request-line",
    parts: [
      { slug: "raw-http-requests-and-how-to-replay-them" },
      { slug: "http-methods-the-verbs" },
      { slug: "http-status-codes-the-five-families" },
      { slug: "http-headers-anatomy" },
      { slug: "http-cookies-state-over-stateless" },
      { slug: "http-message-framing-content-length-and-chunked" },
      { slug: "http-proxy-forward-and-reverse" },
      { slug: "http-versions-09-to-3" },
      { slug: "http-query-method" },
      { slug: "hidden-messages-in-http-headers" },
    ],
  },
  {
    // The family histories (LS-1c).
    id: "family-histories",
    group: "history",
    opener: "the-family-histories",
    parts: [
      { slug: "transceiver-family-history" },
      { slug: "bridge-switch-family-history" },
      { slug: "router-family-history" },
      { slug: "network-scopes-family-history" },
      { slug: "wireless-family-history" },
      { slug: "dns-family-history" },
      { slug: "ntp-family-history" },
      { slug: "adc-family-history" },
      { slug: "virtualization-family-history" },
      { slug: "sdn-family-history" },
      { slug: "observability-family-history" },
      { slug: "test-measurement-family-history" },
      { slug: "encryption-family-history" },
      { slug: "pki-family-history" },
      { slug: "hsm-family-history" },
      { slug: "identity-family-history" },
      { slug: "email-family-history" },
      { slug: "firewall-family-history" },
      { slug: "ids-ips-family-history" },
      { slug: "nac-family-history" },
      { slug: "waf-family-history" },
      { slug: "ddos-family-history" },
      { slug: "sast-dast-family-history" },
    ],
  },
];

/** Where an article sits in the series: the series, and its position (0 for the opener, 1 to n for the parts). */
export interface SeriesPlace {
  series: LearnSeries;
  /** 0 for the opener; otherwise the part's number, counted from 1 over all parts, planned ones included. */
  position: number;
}

/** Every series an article opens or belongs to: the one it opens first (if any), then each it is a part of. */
export function seriesPlaces(slug: string): SeriesPlace[] {
  const places: SeriesPlace[] = [];
  // Opening a series comes first: it is the article's own subject.
  const opened = LEARN_SERIES.find((s) => s.opener === slug);
  if (opened) places.push({ series: opened, position: 0 });
  // Then every series it is a part of, in the registry's order.
  for (const s of LEARN_SERIES) {
    const i = s.parts.findIndex((p) => "slug" in p && p.slug === slug);
    if (i >= 0) places.push({ series: s, position: i + 1 });
  }
  return places;
}

/** The written articles of a series, opener first, in reading order. */
export function seriesArticles(s: LearnSeries): string[] {
  return [s.opener, ...s.parts.flatMap((p) => ("slug" in p ? [p.slug] : []))];
}
