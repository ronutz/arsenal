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
    // The seven BIG-IP fundamentals plus the two DNS-plane companions - the
    // reading spine of the F5 fundamentals classroom, in teaching order.
    id: "bigip-fundamentals",
    category: "networking",
    articles: [
      "ltm-load-balancing-methods",
      "ltm-virtual-server-types",
      "bigip-cmp-clustered-multiprocessing",
      "bigip-syn-flood-protection",
      "bigip-connection-eviction-policies",
      "gtm-load-balancing-methods",
      "gtm-topology-records-and-longest-match",
      "how-iquery-connects-bigip-dns",
      "bigip-dns-request-processing-order",
    ],
    tools: ["bigip-ltm-lb-simulator", "f5-gslb-decision-flow", "iquery-protocol-explainer"],
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
      "http-proxy-forward-and-reverse",
      "hsts-and-https",
      "curl-protocols-beyond-http",
    ],
    tools: ["http-request-translator", "url-inspector"],
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
];
