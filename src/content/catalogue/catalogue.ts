// ============================================================================
// src/content/catalogue/catalogue.ts
// ----------------------------------------------------------------------------
// THE CONSOLIDATED TOOL CATALOGUE — internal source of truth.
//
// This encodes the full ARSENAL tool inventory and its governance disposition:
// what is LIVE, what is QUEUED to build, what is DEFERRED (behind the reserved
// gating model), and what is DROPPED (control-defeat / frame-forging, refused on
// principle). It reflects the ratified consolidation (merges M1/M2/M4/M5; M3/M6/
// M7 kept separate), the two PRIME INCLUDE rulings (bigip-persistence-cookie
// ENCODE; asm-waf-inspector deep/fingerprint/diff/cohort), F5-first priority, and
// the UDP decoder additions.
//
// This module is data only — it is rendered by the (unlisted) admin console. It
// is intentionally NOT wired into the public tool registry (src/config/tools.ts),
// the sitemap, or search.
// ============================================================================

export type CatalogueStatus = "live" | "queued" | "deferred" | "dropped";

/** PKG-002 disposition. */
export type Disposition = "built" | "accept" | "defer" | "drop";

export interface CatalogueEntry {
  slug: string;
  name: string;
  family: string;
  status: CatalogueStatus;
  /** Human-readable posture, e.g. "decode + encode", "decode-only", "analyze". */
  posture: string;
  disposition: Disposition;
  /** RFC / IANA / standards anchors. */
  specs?: string[];
  /** Golden vectors: a count where known, or true for "present". */
  vectors?: number | true;
  /** F5-priority (moves to the front of the build queue). */
  f5?: boolean;
  /** Marks a brand-new addition this revision (UDP set). */
  isNew?: boolean;
  /** Consolidation / merge / priority note. */
  note?: string;
}

/** Family display order. */
export const FAMILIES: string[] = [
  "Security & WAF",
  "Identity & tokens",
  "PKI",
  "Protocol & packet decoders",
  "Networking & addressing",
  "HTTP & web",
  "TLS & transport",
  "Encoding",
  "Hashing",
  "Identifiers & time",
  "Text & utilities",
];

export const CATALOGUE: CatalogueEntry[] = [
  // ---- LIVE (10) ---------------------------------------------------------
  { slug: "jwt", name: "JWT decoder", family: "Identity & tokens", status: "live", posture: "decode / verify", disposition: "built", specs: ["RFC 7519", "RFC 7515", "RFC 7518"], vectors: true },
  { slug: "pkce", name: "PKCE helper", family: "Identity & tokens", status: "live", posture: "generate / verify", disposition: "built", specs: ["RFC 7636", "RFC 6749"], vectors: true },
  { slug: "x509", name: "X.509 inspector", family: "PKI", status: "live", posture: "decode / explain", disposition: "built", specs: ["RFC 5280"], vectors: true },
  { slug: "cipher", name: "Cipher-suite decoder", family: "TLS & transport", status: "live", posture: "decode / rate", disposition: "built", specs: ["IANA TLS Cipher Suites", "RFC 8446", "RFC 5246", "RFC 8447", "RFC 7465"], vectors: 15 },
  { slug: "ipv6", name: "IPv6 toolkit", family: "Networking & addressing", status: "live", posture: "expand / compress / explain", disposition: "built", specs: ["RFC 4291", "RFC 5952"], vectors: true },
  { slug: "cidr", name: "CIDR / subnetting", family: "Networking & addressing", status: "live", posture: "calculate / explain", disposition: "built", specs: ["RFC 4632"], vectors: true, note: "Now full subnetting: single-subnet + VLSM + supernet + overlap/gap (M1 absorbed vlsm-supernet)." },
  { slug: "base64", name: "Base64 / codec", family: "Encoding", status: "live", posture: "encode / decode", disposition: "built", specs: ["RFC 4648", "RFC 3986"], vectors: true, note: "Unified codec: Base64/32/16 + hex + percent-encoding (M5 absorbed hex-url)." },
  { slug: "hash", name: "Hash", family: "Hashing", status: "live", posture: "compute", disposition: "built", specs: ["FIPS 180-4", "FIPS 202"], vectors: true },
  { slug: "hmac", name: "HMAC", family: "Hashing", status: "live", posture: "compute / verify", disposition: "built", specs: ["RFC 2104", "FIPS 198-1"], vectors: true },
  { slug: "uuid", name: "UUID", family: "Identifiers & time", status: "live", posture: "generate / parse", disposition: "built", specs: ["RFC 9562"], vectors: true },

  // ---- QUEUED — Security & WAF (F5-first) ---------------------------------
  { slug: "bigip-persistence-cookie", name: "BIG-IP persistence cookie", family: "Security & WAF", status: "queued", posture: "decode + encode", disposition: "accept", specs: ["F5 BIG-IP documentation"], f5: true, note: "ENCODE now INCLUDED (PRIME): public F5 docs; aids the cookie / passive-persistence option for developers." },
  { slug: "asm-waf-inspector", name: "ASM / Advanced WAF inspector", family: "Security & WAF", status: "queued", posture: "identify / structure / explain + deep / fingerprint / diff / cohort", disposition: "accept", specs: ["F5 BIG-IP ASM / Advanced WAF"], f5: true, note: "Deep / fingerprint / diff / cohort now INCLUDED (PRIME): legitimately valuable for practitioners." },
  { slug: "waf-evasion-normalizer", name: "WAF evasion normalizer", family: "Security & WAF", status: "queued", posture: "defensive canonicalization only", disposition: "accept", f5: true, note: "Normalization for analysis only; never evasion generation." },
  { slug: "secure-headers", name: "Secure headers", family: "Security & WAF", status: "queued", posture: "analyze / explain", disposition: "accept", specs: ["OWASP Secure Headers Project", "RFC 6797", "CSP Level 3"], note: "Merged: csp-helper + cookie-flags + http-headers." },
  { slug: "saml-decoder", name: "SAML decoder", family: "Security & WAF", status: "queued", posture: "decode / explain", disposition: "accept", specs: ["OASIS SAML 2.0"], f5: true, note: "Kept SEPARATE from xml-decoder (M6). XXE-hardened mandatory golden vector." },
  { slug: "xml-decoder", name: "XML decoder", family: "Security & WAF", status: "queued", posture: "decode / explain (XXE-hardened)", disposition: "accept", note: "Kept SEPARATE from saml-decoder (M6). XXE-hardened mandatory golden vector." },

  // ---- QUEUED — Identity --------------------------------------------------
  { slug: "oidc", name: "OIDC decoder", family: "Identity & tokens", status: "queued", posture: "decode / explain", disposition: "accept", specs: ["OpenID Connect Core 1.0", "RFC 6749", "RFC 8414"], f5: true, note: "F5 APM federation relevance." },

  // ---- QUEUED — Protocol & packet decoders (decode-only) ------------------
  { slug: "layered-packet-decoder", name: "Layered packet decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only (spine)", disposition: "accept", note: "Family spine." },
  { slug: "layers-nest-explainer", name: "Layer-nesting explainer", family: "Protocol & packet decoders", status: "queued", posture: "explain (static)", disposition: "accept", note: "Kept SEPARATE (M3)." },
  { slug: "tcp-decoder", name: "TCP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 9293"], note: "TCP-Options + TCP-RST folded in (decode only)." },
  { slug: "udp-decoder", name: "UDP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 768"], isNew: true, note: "UDP family spine." },
  { slug: "dhcp-decoder", name: "DHCP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 2131"], isNew: true, note: "UDP. No rogue-server / starvation tooling." },
  { slug: "dns-message-decoder", name: "DNS message decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only (local)", disposition: "accept", specs: ["RFC 1035"], isNew: true, note: "UDP. Local wire-format decode; DISTINCT from the deferred egress DNS lookup. No spoof / poisoning tooling." },
  { slug: "ntp-packet-decoder", name: "NTP packet decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 5905"], isNew: true, note: "UDP. Complements epoch." },
  { slug: "vxlan-decoder", name: "VXLAN decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 7348"], isNew: true, note: "UDP overlay encap (port 4789)." },
  { slug: "geneve-decoder", name: "GENEVE decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 8926"], isNew: true, note: "UDP overlay encap; TLV options." },
  { slug: "quic-header-decoder", name: "QUIC header decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only (header-only)", disposition: "accept", specs: ["RFC 8999", "RFC 9000"], isNew: true, note: "UDP. Header / connection-ID decode only; payloads are encrypted — NO decryption." },
  { slug: "ospf-decoder", name: "OSPF decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 2328"], note: "Decode only (no LSA craft / inject)." },
  { slug: "icmp-decoder", name: "ICMP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 792", "RFC 4443"], note: "Decode only (no redirect craft)." },
  { slug: "bpdu-stp-decoder", name: "BPDU / STP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["IEEE 802.1D", "IEEE 802.1Q"], note: "STP-translator folded in. Decode only (no superior-root craft)." },
  { slug: "pppoe-decoder", name: "PPPoE decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 2516"], note: "Decode only (no CHAP crack)." },
  { slug: "lldp-cdp-decoder", name: "LLDP / CDP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["IEEE 802.1AB"], note: "Decode only (no spoof craft)." },
  { slug: "ipsec-decoder", name: "IPsec decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", specs: ["RFC 4301", "RFC 4303"], note: "Decode only (no ESP decrypt / key recover)." },

  // ---- QUEUED — Networking & addressing -----------------------------------
  { slug: "mac-oui", name: "MAC / OUI lookup", family: "Networking & addressing", status: "queued", posture: "lookup (vendored)", disposition: "accept", specs: ["IEEE OUI registry"], note: "Vendored IEEE OUI." },
  { slug: "network-number-registries", name: "Protocol-number registries", family: "Networking & addressing", status: "queued", posture: "lookup (vendored)", disposition: "accept", specs: ["IANA Protocol Numbers"], note: "'IP Protocols' folded in. Vendored IANA." },
  { slug: "ip-multicast-group", name: "IP multicast groups", family: "Networking & addressing", status: "queued", posture: "lookup / explain", disposition: "accept", specs: ["RFC 5771"] },
  { slug: "asn-prefix", name: "ASN / prefix origin", family: "Networking & addressing", status: "queued", posture: "analyze / explain", disposition: "accept", specs: ["RFC 4271", "RFC 6480"], note: "Merged: asn (local base) + route-object-prefix (M4). IRR / RPKI / bogon / aggregation." },

  // ---- QUEUED — HTTP & web ------------------------------------------------
  { slug: "http-methods-comparison", name: "HTTP methods comparison", family: "HTTP & web", status: "queued", posture: "explain", disposition: "accept", specs: ["RFC 9110"] },
  { slug: "http-request-translator", name: "HTTP request translator", family: "HTTP & web", status: "queued", posture: "convert", disposition: "accept", specs: ["RFC 9110"] },
  { slug: "http-method-override", name: "HTTP method override", family: "HTTP & web", status: "queued", posture: "explain", disposition: "accept", specs: ["RFC 9110"] },

  // ---- QUEUED — TLS & transport -------------------------------------------
  { slug: "mtu-mss", name: "MTU / MSS reference", family: "TLS & transport", status: "queued", posture: "calculate / reference", disposition: "accept", specs: ["RFC 1191", "RFC 879"], note: "tunneling-overhead-reference folded in (M2)." },
  { slug: "bits-bytes", name: "Bits / bytes / throughput", family: "TLS & transport", status: "queued", posture: "convert", disposition: "accept", note: "Kept SEPARATE (M7): throughput-over-time vs bytes-on-wire." },

  // ---- QUEUED — Encoding --------------------------------------------------
  { slug: "charset-equivalency", name: "Charset equivalency", family: "Encoding", status: "queued", posture: "convert / explain", disposition: "accept", specs: ["Unicode", "RFC 3629"] },

  // ---- QUEUED — Identifiers & time ----------------------------------------
  { slug: "epoch", name: "Epoch / time converter", family: "Identifiers & time", status: "queued", posture: "convert", disposition: "accept" },

  // ---- QUEUED — Text & utilities ------------------------------------------
  { slug: "regex", name: "Regex toolkit", family: "Text & utilities", status: "queued", posture: "test / explain", disposition: "accept" },
  { slug: "log-parser", name: "Log parser", family: "Text & utilities", status: "queued", posture: "parse / explain", disposition: "accept" },
  { slug: "diff", name: "Diff", family: "Text & utilities", status: "queued", posture: "compare", disposition: "accept", note: "Carried from consolidation (compliant)." },
  { slug: "password-entropy", name: "Password entropy", family: "Text & utilities", status: "queued", posture: "analyze (analyzer-only)", disposition: "accept", note: "Analyzer only; never a cracker or wordlist." },

  // ---- DEFERRED (egress / extended tiers — gating model reserved) ---------
  { slug: "dns-lookup", name: "DNS lookup (egress)", family: "Networking & addressing", status: "deferred", posture: "egress (single / bulk / monitor)", disposition: "defer", note: "Egress; deferred until the gating model is ratified." },
  { slug: "asn-live", name: "ASN live (egress)", family: "Networking & addressing", status: "deferred", posture: "egress (live BGP / IRR)", disposition: "defer", note: "Live egress; deferred." },
  { slug: "x509-ext", name: "X.509 extended tiers", family: "PKI", status: "deferred", posture: "extended tiers", disposition: "defer", note: "Deferred (D-50…D-53 reserved)." },
  { slug: "cidr-ext", name: "CIDR extended tiers", family: "Networking & addressing", status: "deferred", posture: "extended tiers", disposition: "defer", note: "Deferred (D-50…D-53 reserved)." },

  // ---- DROPPED (control-defeat / frame-forging — refused on principle) ----
  { slug: "tcp-ao-tfo-recover", name: "TCP-AO / TFO recover", family: "Protocol & packet decoders", status: "dropped", posture: "control defeat", disposition: "drop" },
  { slug: "tcp-rst-injection", name: "TCP RST injection", family: "Protocol & packet decoders", status: "dropped", posture: "injection", disposition: "drop" },
  { slug: "ospf-auth-digest-recover", name: "OSPF auth-digest recover", family: "Protocol & packet decoders", status: "dropped", posture: "auth recover", disposition: "drop" },
  { slug: "pppoe-chap-crack", name: "PPPoE CHAP crack", family: "Protocol & packet decoders", status: "dropped", posture: "credential crack", disposition: "drop" },
  { slug: "ipsec-esp-decrypt-recover", name: "IPsec ESP decrypt / key recover", family: "Protocol & packet decoders", status: "dropped", posture: "decrypt / key recover", disposition: "drop" },
  { slug: "asm-forge-or-recover", name: "ASM forge / recover", family: "Security & WAF", status: "dropped", posture: "forge / recover", disposition: "drop" },
  { slug: "bpdu-superior-root-craft", name: "BPDU superior-root craft", family: "Protocol & packet decoders", status: "dropped", posture: "frame forging", disposition: "drop" },
  { slug: "ospf-lsa-craft-inject", name: "OSPF LSA craft / inject", family: "Protocol & packet decoders", status: "dropped", posture: "forging / injection", disposition: "drop" },
  { slug: "cdp-lldp-edp-spoof-craft", name: "CDP / LLDP / EDP spoof craft", family: "Protocol & packet decoders", status: "dropped", posture: "spoof / forging", disposition: "drop" },
  { slug: "icmp-ndp-redirect-craft", name: "ICMP / NDP redirect craft", family: "Protocol & packet decoders", status: "dropped", posture: "redirect craft", disposition: "drop" },
];

// ---- Consolidation decisions (for the console) -----------------------------
export interface MergeDecision {
  id: string;
  outcome: "merged" | "separate";
  text: string;
}
export const MERGES: MergeDecision[] = [
  { id: "M1", outcome: "merged", text: "vlsm-supernet → cidr (cidr becomes full subnetting)." },
  { id: "M2", outcome: "merged", text: "tunneling-overhead-reference → mtu-mss." },
  { id: "M4", outcome: "merged", text: "asn + route-object-prefix → asn-prefix." },
  { id: "M5", outcome: "merged", text: "hex-url → base64 (unified codec)." },
  { id: "M3", outcome: "separate", text: "layers-nest-explainer kept separate from layered-packet-decoder." },
  { id: "M6", outcome: "separate", text: "xml-decoder kept separate from saml-decoder (different audiences)." },
  { id: "M7", outcome: "separate", text: "bits-bytes kept separate from mtu-mss (throughput vs bytes-on-wire)." },
];

// ---- Helpers ---------------------------------------------------------------
export const byStatus = (s: CatalogueStatus) => CATALOGUE.filter((t) => t.status === s);
export const byFamily = (f: string) => CATALOGUE.filter((t) => t.family === f);
export const counts = () => ({
  live: byStatus("live").length,
  queued: byStatus("queued").length,
  deferred: byStatus("deferred").length,
  dropped: byStatus("dropped").length,
  total: CATALOGUE.length,
  f5Queued: CATALOGUE.filter((t) => t.status === "queued" && t.f5).length,
  udp: CATALOGUE.filter((t) => t.isNew).length,
});
/** Build queue: queued only, F5 first, then alphabetical. */
export const buildQueue = () =>
  byStatus("queued").sort((a, b) => {
    if (!!a.f5 !== !!b.f5) return a.f5 ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
