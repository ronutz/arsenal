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
    // Size a CGN pool or trace an abuse report (2026-10-19): the port arithmetic, then the prefixes it rests on.
    id: "size-a-cgn-pool",
    toolIds: ["cgn-port-blocks", "cidr"],
  },
  {
    id: "inspect-a-token",
    toolIds: ["jwt", "base64"],
  },
  {
    id: "plan-a-subnet",
    toolIds: ["cidr", "ipv6"],
  },
  {
    // Added 2026-10-19 with the BFD timer calculator: size the timers, then capture where the session fails.
    id: "size-bfd-timers",
    toolIds: ["bfd-timers", "packet-capture-plan-builder"],
  },
  {
    // Added 2026-10-19 with the route origin validation calculator: the RFC 6811 state, then the prefix arithmetic.
    id: "check-a-route-against-its-roas",
    toolIds: ["rpki-origin-validation", "cidr", "ipv6"],
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
    id: "work-out-which-extreme-os-you-have",
    toolIds: ["extreme-switch-os-mapper", "voss-exos-translator"],
  },
  {
    id: "make-sense-of-an-spb-fabric",
    toolIds: ["fabric-connect-spb-explainer"],
  },
  {
    id: "choose-how-traffic-reaches-the-edge",
    toolIds: ["netskope-steering-explainer", "netskope-steering-decision-explainer"],
  },
  {
    id: "understand-an-sse-pass",
    toolIds: ["sse-architecture-explainer"],
  },
  {
    id: "read-a-fortios-config-block",
    toolIds: ["fortios-cli-config-explainer", "fortigate-policy-match-order"],
  },
  {
    id: "trace-a-session-on-a-fortigate",
    toolIds: ["fortigate-policy-match-order", "fortios-flow-debug-builder"],
  },
  {
    id: "compare-two-network-operating-systems",
    toolIds: ["network-os-comparer"],
  },
  {
    id: "work-out-which-terminal-layer-you-are-in",
    toolIds: ["terminal-stack-explainer"],
  },
  {
    id: "read-what-the-bigip-wrote-in-the-capture",
    toolIds: ["f5-eth-trailer-decoder"],
  },
  {
    id: "size-and-read-an-f5os-tenant",
    toolIds: ["f5os-tenant-config-explainer", "f5os-restconf-path-explainer"],
  },
  {
    id: "read-a-bigip-object-path",
    toolIds: ["icontrol-rest-path-explainer", "icontrol-rest-stats-decoder", "f5os-restconf-path-explainer"],
  },
  {
    id: "read-an-f5os-path",
    toolIds: ["f5os-restconf-path-explainer", "as3-explainer-validator"],
  },
  {
    id: "read-a-dns-answer",
    toolIds: ["dig-output-explainer", "nslookup-output-explainer"],
  },
  {
    // Added 2026-10-19 with the routing table explainer: read the table, then check one prefix's arithmetic.
    id: "read-a-routing-table",
    toolIds: ["routing-table-explainer", "cidr"],
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
    toolIds: ["url-inspector", "curl-command-explainer"],
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

  // ---- added 2026-09-16 (PRIME) -------------------------------------------
  // Six tasks, chosen because each one is a SEQUENCE someone actually performs
  // and whose tools already exist unlinked. They take recipe coverage from 45
  // tools to roughly 80. Single-step lookups (uuid, epoch, roman-numerals) were
  // deliberately NOT given recipes: "use the UUID tool to make a UUID" is noise,
  // and noise is what stops a curated section being read.
  {
    // The AWAF cluster was built as a workflow and had no recipe describing it.
    // Order is the order a practitioner works in: what was blocked, was it a
    // false positive, how much do I trust the signature, what changed.
    id: "work-out-why-awaf-blocked-a-request",
    toolIds: [
      "f5-awaf-request-log-triage",
      "f5-awaf-false-positive-triage",
      "f5-awaf-signature-accuracy-risk",
      "f5-awaf-policy-diff",
    ],
  },
  {
    // Event order first: an iRule in the wrong event cannot be fixed by tuning.
    id: "write-an-irule-that-behaves",
    toolIds: [
      // Question zero, added 2026-09-16: should this be an iRule at all? It was
      // sitting outside the recipe it belongs at the front of.
      "f5-irules-vs-ltm-policy",
      "f5-irules-event-order",
      "f5-irules-command-context",
      "f5-irules-performance-linter",
      "f5-irules-runtime-calculator",
    ],
  },
  {
    // The whole operations family was uncovered, and it is one arc: from "what
    // is broken" to "here is the packet TAC asked for".
    id: "work-an-incident-to-escalation",
    toolIds: [
      "fault-hypothesis-builder",
      "flow-path-reasoner",
      "packet-capture-plan-builder",
      "incident-timeline-rca-builder",
      "tac-escalation-packet-builder",
    ],
  },
  {
    // Plan, run, prove. The third step is the one people skip.
    id: "plan-and-verify-a-change",
    toolIds: [
      "change-blast-radius-mapper",
      "change-window-runbook-builder",
      "health-snapshot-comparator",
    ],
  },
  {
    // One investigative technique split across four tools with nothing joining
    // them: who is this client, really.
    id: "fingerprint-an-unknown-client",
    toolIds: [
      "ja3-tls-fingerprint",
      "ja4-fingerprint-decoder",
      "http-header-order-fingerprint",
      "user-agent-entropy-analyzer",
    ],
  },
  {
    // The DHCP option 43 tool shipped the same day with no recipe; the task it
    // belongs to is getting an access point onto its controller at all.
    id: "get-an-access-point-onto-its-controller",
    toolIds: ["dhcp-option-43", "cable-run-planner"],
  },
  // ---- added 2026-10-03 (PRIME) -------------------------------------------
  // The iRules / Tcl 8.4 teaching tools and the zero-or-one finder shipped
  // with no recipe. They form three real sequences, in the order a person
  // works through them.
  {
    // Counting base first: the wrong base is the commonest extraction bug.
    // Then the F5 extraction commands, the plain Tcl string commands, and scan.
    id: "cut-a-value-out-of-a-request",
    toolIds: [
      // Does the command count from 0 or from 1?
      "f5-bigip-index-base-finder",
      // findstr, substr and getfield beside the plain Tcl equivalent.
      "f5-irules-string-extract",
      // The Tcl string commands on the exact input.
      "f5-irules-string-workbench",
      // scan for structured values.
      "f5-irules-scan-explainer",
    ],
  },
  {
    // How a value is read (number notation), how a condition is evaluated
    // (expression lab), then a whole snippet traced command by command.
    id: "work-out-what-tcl-does-with-a-value",
    toolIds: [
      // 010, 0x1F, 08, 1e3: what Tcl 8.4 makes of them.
      "f5-irules-number-notation",
      // expr and if, step by step, with == next to eq.
      "f5-irules-expression-lab",
      // One command at a time, with every substitution shown.
      "f5-irules-script-stepper",
    ],
  },
  {
    // Build the decision, check its style against the DevCentral guide, then
    // lint it for the costs that only show under load.
    id: "turn-a-routing-decision-into-an-irule",
    toolIds: [
      // Rules in, if / switch / class match out.
      "f5-irules-conditional-builder",
      // The DevCentral iRules Style Guide, rule by rule.
      "f5-irules-style-checker",
      // F5-documented performance anti-patterns.
      "f5-irules-performance-linter",
    ],
  },
  {
    id: "find-what-is-hiding-in-a-string",
    toolIds: [
      // Every code point, the hidden and lookalike ones flagged, the text in stored order.
      "unicode-inspector",
      // The 128 ASCII codes, for what the text should have contained.
      "ascii-table",
      // The same characters checked inside an iRule.
      "f5-irules-style-checker",
    ],
  },
  {
    id: "write-a-character-in-any-language",
    toolIds: [
      // An ASCII code in every notation and seven escape forms.
      "ascii-table",
      // Any code point: UTF-8, UTF-16, escapes in eight languages, HTML references.
      "unicode-inspector",
      // The bytes as hex, Base64 or percent-encoding.
      "base64",
    ],
  },
  {
    id: "fix-garbled-text",
    toolIds: [
      // Undo the misreading, or read the raw bytes in every charset side by side.
      "charset-equivalency",
      // Then check the repaired text for hidden and lookalike characters.
      "unicode-inspector",
    ],
  },
  // ---- added 2026-10-27 (cross-reference sweep) ---------------------------
  // The day's tools made six tasks into sequences. Each recipe names the tools
  // in the order a person works through the task.
  {
    id: "check-a-servers-tls-from-the-command-line",
    toolIds: [
      // What the s_client command checked, and what its output does and does not prove.
      "openssl-s-client-explainer",
      // The certificates it showed (with -showcerts), put in the order a server should send them.
      "cert-chain-builder",
      // The one certificate that matters, field by field.
      "x509",
    ],
  },
  {
    id: "script-a-device-login-safely",
    toolIds: [
      // A script from the connection, the device profile and the commands, with no secret in the file or the log.
      "expect-script-builder",
      // Any Expect script read command by command before it runs.
      "expect-script-explainer",
    ],
  },
  {
    // One tool, because the sequence is inside it: the secrets check runs before the picture is drawn.
    id: "share-a-config-snippet-without-leaking-secrets",
    toolIds: ["code-to-image"],
  },
  {
    id: "find-why-a-scripted-monitor-marks-a-member-down",
    toolIds: [
      // The send and expect file against F5's rules, and later the captured dialogue as a transcript.
      "bigip-scripted-monitor-explainer",
      // A BIG-IP tcpdump command to capture the monitor's conversation with the pool member.
      "f5-bigip-tcpdump-builder",
    ],
  },
  {
    id: "carry-a-regex-into-nginx-or-an-irule",
    toolIds: [
      // The pattern tested, and what changes between ECMAScript, PCRE2 and Tcl.
      "regex",
      // Which NGINX location a regular expression wins for a given URI.
      "nginx-location-matcher",
      // What a regexp costs in an iRule, among F5's documented anti-patterns.
      "f5-irules-performance-linter",
    ],
  },
  {
    id: "check-and-tidy-an-xml-document",
    toolIds: [
      // Well-formed or not, with the line and the column, then pretty-printed or minified.
      "xml-formatter",
      // The tree, the DOCTYPE and its entities, and the attack surface they open.
      "xml-decoder",
    ],
  },
];

/**
 * Which recipes contain this tool, in the order they are defined.
 *
 * Added 2026-09-16. Until now the reference ran one way only: a recipe named
 * its tools, and a tool knew nothing about the workflows it belonged to. That
 * made the user guide invisible from the page people actually land on, which
 * is a tool page reached from a search result.
 *
 * Cheap by construction: the recipe list is small and static, so this is a
 * filter over an array at build time, not an index to maintain.
 */
export function recipesForTool(toolId: string): GuideRecipe[] {
  return GUIDE_RECIPES.filter((r) => r.toolIds.includes(toolId));
}
