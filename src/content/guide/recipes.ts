// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/guide/recipes.ts
// ----------------------------------------------------------------------------
// THE CURATED "SUGGESTED USAGE" RECIPES for the Site User Guide.
//
// This is the ONE hand-authored part of the guide (the datasheet counts and the
// quick-reference tool list are DERIVED from the registry, so they cannot go
// stale on their own). A recipe is a real task ("inspect a JWT you received")
// mapped to the ordered list of tools that accomplish it.
//
// STAYS-CURRENT GUARANTEE: each recipe references tools by their registry id.
// The build guard scripts/check-user-guide.mjs fails the build if any id here is
// not a live tool in src/config/tools.ts — so renaming or deleting a tool that a
// recipe points at cannot silently leave a dangling recommendation. That makes
// the curated section "aware of" additions and deletions the same way the guards
// make the rest of the site consistent.
//
// COPY is localized: each recipe's title + one-line description live in the i18n
// "guide" namespace under recipes.<id>.title / recipes.<id>.desc. This file
// holds only structure (recipe id + the tool ids it uses), never prose.
// ============================================================================

/** A task-oriented recipe: a title/desc (in i18n) plus the tools it chains. */
export interface GuideRecipe {
  /** Stable id; the i18n keys are recipes.<id>.title / recipes.<id>.desc. */
  id: string;
  /** Registry tool ids used, in the order a reader would use them. Validated
   *  at build time against src/config/tools.ts by check-user-guide.mjs. */
  toolIds: string[];
}

export const GUIDE_RECIPES: GuideRecipe[] = [
  {
    id: "inspect-a-token",
    toolIds: ["jwt", "base64"],
  },
  {
    id: "plan-a-subnet",
    toolIds: ["cidr", "ipv6"],
  },
  {
    id: "work-with-a-certificate",
    toolIds: ["x509", "csr-decoder", "cert-renewal-planner"],
  },
  {
    id: "set-up-app-login",
    toolIds: ["oidc", "pkce", "totp-hotp"],
  },
  {
    id: "read-a-dns-answer",
    toolIds: ["dig-output-explainer", "nslookup-output-explainer"],
  },
  {
    id: "verify-data-integrity",
    toolIds: ["hash", "hmac"],
  },
  {
    id: "debug-a-saml-login",
    toolIds: ["saml-decoder", "x509"],
  },
  {
    id: "map-a-jwks-to-tokens",
    toolIds: ["jwks-explainer", "jwt"],
  },
  {
    id: "understand-a-tls-connection",
    toolIds: ["cipher", "x509", "secure-headers"],
  },
  {
    id: "harden-a-web-response",
    toolIds: ["secure-headers", "url-inspector"],
  },
  {
    id: "assess-ssrf-risk",
    toolIds: ["ssrf-url-classifier", "url-inspector"],
  },
  {
    id: "score-a-vulnerability",
    toolIds: ["cvss-vector-decoder"],
  },
  {
    id: "convert-and-tidy-config",
    toolIds: ["json-yaml-convert", "json-formatter"],
  },
  {
    id: "compare-two-files",
    toolIds: ["json-formatter", "diff"],
  },
  {
    id: "reproduce-an-http-request",
    toolIds: ["url-inspector", "http-request-translator"],
  },
  {
    id: "identify-an-unknown-hash",
    toolIds: ["hash-preimage-finder", "hash"],
  },
  {
    id: "read-a-syslog-line",
    toolIds: ["syslog-pri-decoder"],
  },
  {
    id: "build-and-test-a-regex",
    toolIds: ["regex"],
  },
];
