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
  vendors?: string[];
  /** False renders a muted "coming soon" card with no link. */
  available: boolean;
}

export const tools: ToolEntry[] = [
  { id: "jwt", href: "/tools/jwt", category: "identity", available: true },
  { id: "pkce", href: "/tools/pkce", category: "identity", available: true },
  { id: "oidc", href: "/tools/oidc", category: "identity", available: true },
  { id: "totp-hotp", href: "/tools/totp-hotp", category: "identity", available: true },
  { id: "base64", href: "/tools/base64", category: "encoding", available: true },
  { id: "hash", href: "/tools/hash", category: "hashing", available: true },
  { id: "hmac", href: "/tools/hmac", category: "hashing", available: true },
  { id: "uuid", href: "/tools/uuid", category: "identifiers", available: true },
  { id: "x509", href: "/tools/x509", category: "pki", available: true },
  { id: "cert-renewal-planner", href: "/tools/cert-renewal-planner", category: "pki", available: true },
  { id: "csr-decoder", href: "/tools/csr-decoder", category: "pki", available: true },
  { id: "cipher", href: "/tools/cipher", category: "transport", available: true },
  { id: "ipv6", href: "/tools/ipv6", category: "networking", available: true },
  { id: "cidr", href: "/tools/cidr", category: "networking", available: true },
  { id: "dig-output-explainer", href: "/tools/dig-output-explainer", category: "networking", available: true },
  { id: "nslookup-output-explainer", href: "/tools/nslookup-output-explainer", category: "networking", available: true },
  { id: "secure-headers", href: "/tools/secure-headers", category: "security", available: true },
  { id: "saml-decoder", href: "/tools/saml-decoder", category: "security", available: true },
  { id: "xml-decoder", href: "/tools/xml-decoder", category: "security", available: true },
  { id: "f5xc-service-policy-explainer", href: "/tools/f5xc-service-policy-explainer", category: "security", vendors: ["f5"], available: true },
  { id: "bigip-persistence-cookie", href: "/tools/bigip-persistence-cookie", category: "security", vendors: ["f5"], available: true },
  { id: "url-inspector", href: "/tools/url-inspector", category: "web", available: true },
  { id: "json-formatter", href: "/tools/json-formatter", category: "encoding", available: true },
  { id: "json-yaml-convert", href: "/tools/json-yaml-convert", category: "encoding", available: true },
  { id: "tmsh-config-explainer", href: "/tools/tmsh-config-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "bigip-tcpdump-builder", href: "/tools/bigip-tcpdump-builder", category: "networking", vendors: ["f5"], available: true },
  { id: "persistence-method-explainer", href: "/tools/persistence-method-explainer", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-service-check-date", href: "/tools/f5-service-check-date", category: "networking", vendors: ["f5"], available: true },
  { id: "f5-cipher-string-expander", href: "/tools/f5-cipher-string-expander", category: "transport", vendors: ["f5"], available: true },
  { id: "f5-ssl-profile-explainer", href: "/tools/f5-ssl-profile-explainer", category: "transport", vendors: ["f5"], available: true },
  { id: "epoch", href: "/tools/epoch", category: "encoding", available: true },
  { id: "irules-event-order", href: "/tools/irules-event-order", category: "networking", vendors: ["f5"], available: true },
  { id: "syslog-pri-decoder", href: "/tools/syslog-pri-decoder", category: "networking", available: true },
  { id: "jwks-explainer", href: "/tools/jwks-explainer", category: "identity", available: true },
  { id: "regex", href: "/tools/regex", category: "web", available: true },
  { id: "diff", href: "/tools/diff", category: "text", available: true },
  // The four below were built but never registered here (drift caught and
  // guarded by scripts/check-tools-registry.mjs in the prebuild chain).
  { id: "cvss-vector-decoder", href: "/tools/cvss-vector-decoder", category: "security", available: true },
  { id: "hash-preimage-finder", href: "/tools/hash-preimage-finder", category: "hashing", available: true },
  { id: "http-request-translator", href: "/tools/http-request-translator", category: "web", available: true },
  { id: "ssrf-url-classifier", href: "/tools/ssrf-url-classifier", category: "security", available: true },
  { id: "f5-awaf-declarative-policy-explainer", href: "/tools/f5-awaf-declarative-policy-explainer", category: "security", vendors: ["f5"], available: true },
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
