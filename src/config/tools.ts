// ============================================================================
// src/config/tools.ts
// ----------------------------------------------------------------------------
// TOOL REGISTRY — the single source of truth for the /tools index. Add a tool
// by adding one entry here; the index page renders it automatically.
//
// User-facing strings live in the message packs, NOT here: a tool's display
// name and blurb are `tools.<id>.name` / `tools.<id>.blurb`, and the category
// label is `tools.categories.<category>`. This keeps every visible tool-UI
// string translatable (English in en.json, other locales layered on top via
// deepMerge). The registry holds only structural data: id, route, category
// key, and availability.
//
// `available: false` renders a tool as a muted "coming soon" card (useful for
// signalling what is next without linking to an unfinished page).
// ============================================================================

export interface ToolEntry {
  /** Stable id. Also the in-page anchor / route segment AND the i18n key
   *  segment: the index resolves tools.<id>.name and tools.<id>.blurb. */
  id: string;
  /** Where the tool lives (a route under /tools/, like every tool). */
  href: string;
  /** Category KEY, resolved to a label through tools.categories.<key>. */
  category: string;
  /** Optional vendor-family memberships (e.g. ["f5"]); additive second
   *  grouping dimension resolved via src/config/vendors.ts. */
  /** Vendor sub-category (tools.subs.<vendor>.<sub> label); vendor tools only. */
  sub?: string;
  vendors?: string[];
  /**
   * vendorNeutral - the tool implements an OPEN STANDARD (JWT, OIDC, TOTP,
   * SAML, ...) and is only AFFILIATED with the vendors above (it appears on
   * their hubs because the vendor's products live on that standard), not owned
   * by them. Consumers that split "generic" from "vendor-specific" (the tools
   * grid, /category pages, the Learn category grouping) treat a vendorNeutral
   * tool as generic, so tagging a standards tool for a hub can never make it -
   * or the articles that reference it - vanish from the vendor-agnostic
   * surfaces again (the 2026-07-18 identity-category regression).
   */
  vendorNeutral?: boolean;
  /** Additional category KEYS this tool also appears under (additive, like
   *  vendors[]). The primary `category` still owns the tool's home; each key
   *  here makes it ALSO render on that category's page. Used where a tool
   *  genuinely spans domains, e.g. SAML is an identity protocol whose decoding
   *  is a security operation, so it lives in Identity and cross-links to
   *  Security & WAF. Resolved through tools.categories.<key> like `category`. */
  secondaryCategories?: string[];
  /** False renders a muted "coming soon" card with no link. */
  available: boolean;
}

export const tools: ToolEntry[] = [
  { id: "jwt", href: "/tools/jwt", category: "identity", vendors: ["ping"], vendorNeutral: true /* open standard; Ping-affiliated, not Ping-owned */, sub: "oauth-tokens", available: true },
  { id: "pkce", href: "/tools/pkce", category: "identity", vendors: ["ping"], vendorNeutral: true /* open standard; Ping-affiliated, not Ping-owned */, sub: "oauth-tokens", available: true },
  { id: "oidc", href: "/tools/oidc", category: "identity", vendors: ["ping"], vendorNeutral: true /* open standard; Ping-affiliated, not Ping-owned */, sub: "sso", available: true },
  { id: "totp-hotp", href: "/tools/totp-hotp", category: "identity", vendors: ["ping"], vendorNeutral: true /* open standard; Ping-affiliated, not Ping-owned */, sub: "mfa", available: true },
  { id: "base64", href: "/tools/base64", category: "encoding", available: true },
  { id: "hash", href: "/tools/hash", category: "hashing", available: true },
  { id: "hmac", href: "/tools/hmac", category: "hashing", available: true },
  { id: "uuid", href: "/tools/uuid", category: "identifiers", available: true },
  { id: "x509", href: "/tools/x509", category: "pki", available: true },
  { id: "cert-renewal-planner", href: "/tools/cert-renewal-planner", category: "pki", available: true },
  { id: "csr-decoder", href: "/tools/csr-decoder", category: "pki", available: true },
  { id: "acme-dns01", href: "/tools/acme-dns01", category: "pki", available: true },
  { id: "public-suffix", href: "/tools/public-suffix", category: "networking", available: true },
  { id: "letsencrypt-rate-limits", href: "/tools/letsencrypt-rate-limits", category: "pki", available: true },
  { id: "cipher", href: "/tools/cipher", category: "transport", available: true },
  { id: "ipv6", href: "/tools/ipv6", category: "networking", available: true },
  { id: "cidr", href: "/tools/cidr", category: "networking", available: true },
  { id: "oui-lookup", href: "/tools/oui-lookup", category: "networking", available: true },
  { id: "voss-fabric-id", href: "/tools/voss-fabric-id", category: "networking", available: true },
  { id: "voss-exos-translator", href: "/tools/voss-exos-translator", category: "networking", available: true },
  { id: "dig-output-explainer", href: "/tools/dig-output-explainer", category: "networking", available: true },
  { id: "nslookup-output-explainer", href: "/tools/nslookup-output-explainer", category: "networking", available: true },
  { id: "secure-headers", href: "/tools/secure-headers", category: "security", available: true },
  { id: "saml-decoder", href: "/tools/saml-decoder", category: "identity", secondaryCategories: ["security"], vendors: ["ping"], vendorNeutral: true /* open standard; Ping-affiliated, not Ping-owned */, sub: "sso", available: true },
  { id: "xml-decoder", href: "/tools/xml-decoder", category: "security", available: true },
  { id: "f5xc-service-policy-explainer", sub: "f5xc", href: "/tools/f5xc-service-policy-explainer", category: "security", vendors: ["f5"], available: true },
  { id: "f5xc-rate-limit-calculator", sub: "f5xc", href: "/tools/f5xc-rate-limit-calculator", category: "security", vendors: ["f5"], available: true },
  { id: "f5xc-tls-security-level-mapper", sub: "f5xc", href: "/tools/f5xc-tls-security-level-mapper", category: "transport", vendors: ["f5"], available: true },
  { id: "f5xc-ce-egress-checklist", sub: "f5xc", href: "/tools/f5xc-ce-egress-checklist", category: "networking", vendors: ["f5"], available: true },
  { id: "f5xc-http-lb-route-explainer", sub: "f5xc", href: "/tools/f5xc-http-lb-route-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5xc-lb-algorithm-chooser", sub: "f5xc", href: "/tools/f5xc-lb-algorithm-chooser", category: "networking", vendors: ["f5"], available: true },
  { id: "f5xc-origin-pool-explainer", sub: "f5xc", href: "/tools/f5xc-origin-pool-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5xc-domain-sni-match-resolver", sub: "f5xc", href: "/tools/f5xc-domain-sni-match-resolver", category: "networking", vendors: ["f5"], available: true },
  { id: "f5xc-security-event-explainer", sub: "f5xc", href: "/tools/f5xc-security-event-explainer", category: "security", vendors: ["f5"], available: true },
  { id: "f5xc-object-linter", sub: "f5xc", href: "/tools/f5xc-object-linter", category: "security", vendors: ["f5"], available: true },
  { id: "f5xc-api-path-explainer", sub: "f5xc", href: "/tools/f5xc-api-path-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "bigip-ltm-lb-simulator", sub: "ltm", href: "/tools/bigip-ltm-lb-simulator", category: "networking", vendors: ["f5"], available: true },
  { id: "bigip-dns-gslb-simulator", sub: "dns-gtm", href: "/tools/bigip-dns-gslb-simulator", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-bigip-persistence-cookie", sub: "ltm", href: "/tools/f5-bigip-persistence-cookie", category: "networking", vendors: ["f5"], available: true },
  { id: "url-inspector", href: "/tools/url-inspector", category: "web", available: true },
  { id: "json-formatter", href: "/tools/json-formatter", category: "encoding", available: true },
  { id: "json-yaml-convert", href: "/tools/json-yaml-convert", category: "encoding", available: true },
  { id: "f5-tmsh-config-explainer", sub: "tmos", href: "/tools/f5-tmsh-config-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-bigip-tcpdump-builder", sub: "tmos", href: "/tools/f5-bigip-tcpdump-builder", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-irules-runtime-calculator", sub: "irules", href: "/tools/f5-irules-runtime-calculator", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-irules-performance-linter", sub: "irules", href: "/tools/f5-irules-performance-linter", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-release-cadence-calendar", sub: "tmos", href: "/tools/f5-release-cadence-calendar", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-persistence-method-explainer", sub: "ltm", href: "/tools/f5-persistence-method-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-lb-method-chooser", sub: "ltm", href: "/tools/f5-lb-method-chooser", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-gslb-decision-flow", sub: "dns-gtm", href: "/tools/f5-gslb-decision-flow", category: "networking", vendors: ["f5"], available: true },
  { id: "iquery-protocol-explainer", sub: "dns-gtm", href: "/tools/iquery-protocol-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-topology-longest-match", sub: "dns-gtm", href: "/tools/f5-topology-longest-match", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-dos-vector-explainer", sub: "afm", href: "/tools/f5-dos-vector-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-irules-command-context", sub: "irules", href: "/tools/f5-irules-command-context", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-irules-vs-ltm-policy", sub: "irules", href: "/tools/f5-irules-vs-ltm-policy", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-oneconnect-source-mask", sub: "ltm", href: "/tools/f5-oneconnect-source-mask", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-afm-rule-context", sub: "afm", href: "/tools/f5-afm-rule-context", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-apm-sso-explainer", sub: "zta-apm", href: "/tools/f5-apm-sso-explainer", category: "identity", vendors: ["f5"], available: true },
  { id: "f5-l4-profile-explainer", sub: "ltm", href: "/tools/f5-l4-profile-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-apm-session-variable-reference", sub: "zta-apm", href: "/tools/f5-apm-session-variable-reference", category: "identity", vendors: ["f5"], available: true },
  { id: "f5-packet-filter-explainer", sub: "tmos", href: "/tools/f5-packet-filter-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-service-check-date", sub: "tmos", href: "/tools/f5-service-check-date", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-bigd-thread-calculator", sub: "tmos", href: "/tools/f5-bigd-thread-calculator", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-bigip-license-explainer", sub: "tmos", href: "/tools/f5-bigip-license-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-cipher-string-expander", sub: "ltm", href: "/tools/f5-cipher-string-expander", category: "transport", vendors: ["f5"], available: true },
  { id: "f5-ssl-profile-explainer", sub: "ltm", href: "/tools/f5-ssl-profile-explainer", category: "transport", vendors: ["f5"], available: true },
  { id: "mtu-mss", href: "/tools/mtu-mss", category: "networking", available: true },
  { id: "http-methods-comparison", href: "/tools/http-methods-comparison", category: "networking", available: true },
  { id: "epoch", href: "/tools/epoch", category: "encoding", available: true },
  { id: "roman-numerals", href: "/tools/roman-numerals", category: "encoding", available: true },
  { id: "greek-alphabet", href: "/tools/greek-alphabet", category: "text", available: true },
  { id: "time-calculator", href: "/tools/time-calculator", category: "encoding", available: true },
  { id: "timezone-meeting-planner", href: "/tools/timezone-meeting-planner", category: "encoding", available: true },
  { id: "f5-irules-event-order", sub: "irules", href: "/tools/f5-irules-event-order", category: "networking", vendors: ["f5"], available: true },
  { id: "syslog-pri-decoder", href: "/tools/syslog-pri-decoder", category: "networking", available: true },
  { id: "ja4-fingerprint-decoder", href: "/tools/ja4-fingerprint-decoder", category: "security", vendors: ["zscaler", "ping"], vendorNeutral: true /* FoxIO open suite; hub-affiliated, not vendor-owned */, sub: "signals", available: true },
  { id: "ja3-tls-fingerprint", href: "/tools/ja3-tls-fingerprint", category: "security", vendors: ["zscaler", "ping"], vendorNeutral: true /* Salesforce open-source origin; hub-affiliated, not vendor-owned */, sub: "signals", available: true },
  { id: "user-agent-entropy-analyzer", href: "/tools/user-agent-entropy-analyzer", category: "security", vendors: ["zscaler", "ping"], vendorNeutral: true /* generic UA analysis; relevant to signal-based risk auth, not vendor-owned */, sub: "signals", available: true },
  { id: "http-header-order-fingerprint", href: "/tools/http-header-order-fingerprint", category: "security", vendors: ["zscaler", "ping"], vendorNeutral: true /* generic header-order fingerprint; relevant to bot/risk signals, not vendor-owned */, sub: "signals", available: true },
  { id: "p0f-signature-explainer", href: "/tools/p0f-signature-explainer", category: "networking", vendors: ["zscaler"], vendorNeutral: true /* generic passive TCP fingerprint; relevant to TLS-inspection signal surface, not vendor-owned */, sub: "signals", available: true },
  { id: "jwks-explainer", href: "/tools/jwks-explainer", category: "identity", vendors: ["ping"], vendorNeutral: true /* open standard; Ping-affiliated, not Ping-owned */, sub: "oauth-tokens", available: true },
  { id: "regex", href: "/tools/regex", category: "web", available: true },
  { id: "diff", href: "/tools/diff", category: "text", available: true },
  // The four below were built but never registered here (drift caught and
  // guarded by scripts/check-tools-registry.mjs in the prebuild chain).
  { id: "cvss-vector-decoder", href: "/tools/cvss-vector-decoder", category: "security", available: true },
  { id: "hash-preimage-finder", href: "/tools/hash-preimage-finder", category: "hashing", available: true },
  { id: "curl-command-builder", href: "/tools/curl-command-builder", category: "web", available: true },
  { id: "http-request-translator", href: "/tools/http-request-translator", category: "web", available: true },
  { id: "ssrf-url-classifier", href: "/tools/ssrf-url-classifier", category: "security", available: true },
  { id: "f5-awaf-declarative-policy-explainer", sub: "asm-awaf", href: "/tools/f5-awaf-declarative-policy-explainer", category: "security", vendors: ["f5"], available: true },
  { id: "f5-awaf-evasion-explainer", sub: "asm-awaf", href: "/tools/f5-awaf-evasion-explainer", category: "security", vendors: ["f5"], available: true },
  { id: "f5-awaf-learning-poisoning-estimator", sub: "asm-awaf", href: "/tools/f5-awaf-learning-poisoning-estimator", category: "security", vendors: ["f5"], available: true },
  { id: "as3-explainer-validator", sub: "automation", href: "/tools/as3-explainer-validator", category: "networking", vendors: ["f5"], available: true },
  { id: "do-explainer-validator", sub: "automation", href: "/tools/do-explainer-validator", category: "networking", vendors: ["f5"], available: true },
  { id: "telemetry-streaming-explainer", sub: "automation", href: "/tools/telemetry-streaming-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-awaf-false-positive-triage", sub: "asm-awaf", href: "/tools/f5-awaf-false-positive-triage", category: "security", vendors: ["f5"], available: true },
  { id: "f5-awaf-request-log-triage", sub: "asm-awaf", href: "/tools/f5-awaf-request-log-triage", category: "security", vendors: ["f5"], available: true },
  { id: "f5-awaf-learning-suggestion-interpreter", sub: "asm-awaf", href: "/tools/f5-awaf-learning-suggestion-interpreter", category: "security", vendors: ["f5"], available: true },
  { id: "f5-awaf-signature-accuracy-risk", sub: "asm-awaf", href: "/tools/f5-awaf-signature-accuracy-risk", category: "security", vendors: ["f5"], available: true },
  { id: "f5-awaf-policy-diff", sub: "asm-awaf", href: "/tools/f5-awaf-policy-diff", category: "security", vendors: ["f5"], available: true },
  // First Fortinet tool: populates the Fortinet vendor hub.
  { id: "fortios-sniffer-builder", sub: "fortigate", href: "/tools/fortios-sniffer-builder", category: "networking", vendors: ["fortinet"], available: true },
  // First Netskope tool: populates the Netskope vendor hub.
  { id: "pac-file-explainer", sub: "swg", href: "/tools/pac-file-explainer", category: "networking", vendors: ["netskope"], vendorNeutral: true /* Netscape-era open browser standard; hub-affiliated, not vendor-owned */, available: true },
  // First Extreme tool: populates the Extreme vendor hub.
  { id: "exos-config-explainer", sub: "switching", href: "/tools/exos-config-explainer", category: "networking", vendors: ["extreme"], available: true },
  { id: "fault-hypothesis-builder", href: "/tools/fault-hypothesis-builder", category: "operations", available: true },
  { id: "change-window-runbook-builder", href: "/tools/change-window-runbook-builder", category: "operations", available: true },
  { id: "incident-timeline-rca-builder", href: "/tools/incident-timeline-rca-builder", category: "operations", available: true },
  { id: "change-blast-radius-mapper", href: "/tools/change-blast-radius-mapper", category: "operations", available: true },
  { id: "tac-escalation-packet-builder", href: "/tools/tac-escalation-packet-builder", category: "operations", available: true },
  { id: "packet-capture-plan-builder", href: "/tools/packet-capture-plan-builder", category: "operations", available: true },
  { id: "flow-path-reasoner", href: "/tools/flow-path-reasoner", category: "operations", available: true },
  { id: "health-snapshot-comparator", href: "/tools/health-snapshot-comparator", category: "operations", available: true },
];

/** Tools that are live and linkable. */
export function availableTools(): ToolEntry[] {
  return tools.filter((t) => t.available);
}

/** Distinct category keys present in the registry, in first-seen order. */
export function toolCategories(): string[] {
  const seen: string[] = [];
  for (const t of tools) if (!seen.includes(t.category)) seen.push(t.category);
  return seen;
}
