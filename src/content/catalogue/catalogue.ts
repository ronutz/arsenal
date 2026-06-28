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
  /**
   * Global build-priority rank (1 = build first), PRIME-ratified 2026-06-28.
   * Spans every accepted tool across all families: a single highest-to-lowest
   * value ordering, the durable source of truth for the Phase-1 build queue.
   * Present on accepted (not-yet-built) tools; absent on live/deferred/dropped.
   */
  rank?: number;
  /** Fortinet-platform tool. */
  fortinet?: boolean;
  /** Netskope-platform tool. */
  netskope?: boolean;
  /** Extreme Networks-platform tool. */
  extreme?: boolean;
  /** Marks a brand-new addition this revision (UDP set). */
  isNew?: boolean;
  /** LIVE tool that still needs consolidation work (a ratified merge is unbuilt). */
  consolidationPending?: boolean;
  /** Consolidation / merge / priority note. */
  note?: string;
}

/** Family display order. */
export const FAMILIES: string[] = [
  "Security & WAF",
  "F5 LTM, iRules & platform",
  "F5 GTM, AFM & APM",
  "F5 automation (AS3 / DO)",
  "Fortinet FortiGate & FortiOS",
  "Fortinet security, VPN & SD-WAN",
  "Fortinet ecosystem & identity",
  "Netskope SSE / SASE",
  "Extreme switching & fabric (EXOS / VOSS / SPB)",
  "Extreme NAC & cloud (ExtremeControl / Platform ONE)",
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
  { slug: "cidr", name: "CIDR / subnetting", family: "Networking & addressing", status: "live", posture: "calculate / explain", disposition: "built", specs: ["RFC 4632"], vectors: true, consolidationPending: false, note: "M1 done: single-subnet plus VLSM, supernet/aggregate, and overlap/gap detection all shipped (RFC 4632)." },
  { slug: "base64", name: "Base64 / Base32 / Hex / Percent codec", family: "Encoding", status: "live", posture: "encode / decode", disposition: "built", specs: ["RFC 4648", "RFC 3986"], vectors: true, consolidationPending: false, note: "M5 done: unified codec over Base64, Base64URL, Base32, Base16/hex, and percent-encoding (RFC 4648 sections 4-8, RFC 3986)." },
  { slug: "hash", name: "Hash", family: "Hashing", status: "live", posture: "compute", disposition: "built", specs: ["FIPS 180-4", "FIPS 202"], vectors: true },
  { slug: "hmac", name: "HMAC", family: "Hashing", status: "live", posture: "compute / verify", disposition: "built", specs: ["RFC 2104", "FIPS 198-1"], vectors: true },
  { slug: "uuid", name: "UUID", family: "Identifiers & time", status: "live", posture: "generate / parse", disposition: "built", specs: ["RFC 9562"], vectors: true },

  // ---- QUEUED — Security & WAF (F5-first) ---------------------------------
  { slug: "bigip-persistence-cookie", name: "BIG-IP persistence cookie", family: "Security & WAF", status: "queued", posture: "decode + encode", disposition: "accept", rank: 8, specs: ["F5 BIG-IP documentation"], f5: true, note: "ENCODE now INCLUDED (PRIME): public F5 docs; aids the cookie / passive-persistence option for developers." },
  { slug: "asm-waf-inspector", name: "ASM / Advanced WAF inspector", family: "Security & WAF", status: "queued", posture: "identify / structure / explain + deep / fingerprint / diff / cohort", disposition: "accept", rank: 13, specs: ["F5 BIG-IP ASM / Advanced WAF"], f5: true, note: "Deep / fingerprint / diff / cohort now INCLUDED (PRIME): legitimately valuable for practitioners." },
  { slug: "waf-evasion-normalizer", name: "WAF evasion normalizer", family: "Security & WAF", status: "queued", posture: "defensive canonicalization only", disposition: "accept", rank: 70, f5: true, note: "Normalization for analysis only; never evasion generation." },
  { slug: "secure-headers", name: "Secure headers", family: "Security & WAF", status: "queued", posture: "analyze / explain", disposition: "accept", rank: 1, specs: ["OWASP Secure Headers Project", "RFC 6797", "CSP Level 3"], note: "Merged: csp-helper + cookie-flags + http-headers." },
  { slug: "saml-decoder", name: "SAML decoder", family: "Security & WAF", status: "queued", posture: "decode / explain", disposition: "accept", rank: 2, specs: ["OASIS SAML 2.0"], f5: true, note: "Kept SEPARATE from xml-decoder (M6). XXE-hardened mandatory golden vector." },
  { slug: "xml-decoder", name: "XML decoder", family: "Security & WAF", status: "queued", posture: "decode / explain (XXE-hardened)", disposition: "accept", rank: 10, note: "Kept SEPARATE from saml-decoder (M6). XXE-hardened mandatory golden vector." },

  // ---- QUEUED — Identity --------------------------------------------------
  { slug: "oidc", name: "OIDC decoder", family: "Identity & tokens", status: "queued", posture: "decode / explain", disposition: "accept", rank: 3, specs: ["OpenID Connect Core 1.0", "RFC 6749", "RFC 8414"], f5: true, note: "F5 APM federation relevance." },

  // ---- QUEUED — Protocol & packet decoders (decode-only) ------------------
  { slug: "layered-packet-decoder", name: "Layered packet decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only (spine)", disposition: "accept", rank: 16, note: "Family spine." },
  { slug: "layers-nest-explainer", name: "Layer-nesting explainer", family: "Protocol & packet decoders", status: "queued", posture: "explain (static)", disposition: "accept", rank: 73, note: "Kept SEPARATE (M3)." },
  { slug: "tcp-decoder", name: "TCP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 17, specs: ["RFC 9293"], note: "TCP-Options + TCP-RST folded in (decode only)." },
  { slug: "udp-decoder", name: "UDP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 18, specs: ["RFC 768"], isNew: true, note: "UDP family spine." },
  { slug: "dhcp-decoder", name: "DHCP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 19, specs: ["RFC 2131"], isNew: true, note: "UDP. No rogue-server / starvation tooling." },
  { slug: "dns-message-decoder", name: "DNS message decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only (local)", disposition: "accept", rank: 20, specs: ["RFC 1035"], isNew: true, note: "UDP. Local wire-format decode; DISTINCT from the deferred egress DNS lookup. No spoof / poisoning tooling." },
  { slug: "ntp-packet-decoder", name: "NTP packet decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 65, specs: ["RFC 5905"], isNew: true, note: "UDP. Complements epoch." },
  { slug: "vxlan-decoder", name: "VXLAN decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 66, specs: ["RFC 7348"], isNew: true, note: "UDP overlay encap (port 4789)." },
  { slug: "geneve-decoder", name: "GENEVE decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 67, specs: ["RFC 8926"], isNew: true, note: "UDP overlay encap; TLV options." },
  { slug: "quic-header-decoder", name: "QUIC header decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only (header-only)", disposition: "accept", rank: 68, specs: ["RFC 8999", "RFC 9000"], isNew: true, note: "UDP. Header / connection-ID decode only; payloads are encrypted — NO decryption." },
  { slug: "ospf-decoder", name: "OSPF decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 74, specs: ["RFC 2328"], note: "Decode only (no LSA craft / inject)." },
  { slug: "icmp-decoder", name: "ICMP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 21, specs: ["RFC 792", "RFC 4443"], note: "Decode only (no redirect craft)." },
  { slug: "bpdu-stp-decoder", name: "BPDU / STP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 75, specs: ["IEEE 802.1D", "IEEE 802.1Q"], note: "STP-translator folded in. Decode only (no superior-root craft)." },
  { slug: "pppoe-decoder", name: "PPPoE decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 76, specs: ["RFC 2516"], note: "Decode only (no CHAP crack)." },
  { slug: "lldp-cdp-decoder", name: "LLDP / CDP decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 77, specs: ["IEEE 802.1AB"], note: "Decode only (no spoof craft)." },
  { slug: "ipsec-decoder", name: "IPsec decoder", family: "Protocol & packet decoders", status: "queued", posture: "decode-only", disposition: "accept", rank: 78, specs: ["RFC 4301", "RFC 4303"], note: "Decode only (no ESP decrypt / key recover)." },

  // ---- QUEUED — Networking & addressing -----------------------------------
  { slug: "mac-oui", name: "MAC / OUI lookup", family: "Networking & addressing", status: "queued", posture: "lookup (vendored)", disposition: "accept", rank: 15, specs: ["IEEE OUI registry"], note: "Vendored IEEE OUI." },
  { slug: "network-number-registries", name: "Protocol-number registries", family: "Networking & addressing", status: "queued", posture: "lookup (vendored)", disposition: "accept", rank: 22, specs: ["IANA Protocol Numbers"], note: "'IP Protocols' folded in. Vendored IANA." },
  { slug: "ip-multicast-group", name: "IP multicast groups", family: "Networking & addressing", status: "queued", posture: "lookup / explain", disposition: "accept", rank: 23, specs: ["RFC 5771"] },
  { slug: "asn-prefix", name: "ASN / prefix origin", family: "Networking & addressing", status: "queued", posture: "analyze / explain", disposition: "accept", rank: 24, specs: ["RFC 4271", "RFC 6480"], note: "Merged: asn (local base) + route-object-prefix (M4). IRR / RPKI / bogon / aggregation." },

  // ---- QUEUED — HTTP & web ------------------------------------------------
  { slug: "http-methods-comparison", name: "HTTP methods comparison", family: "HTTP & web", status: "queued", posture: "explain", disposition: "accept", rank: 25, specs: ["RFC 9110"] },
  { slug: "http-request-translator", name: "HTTP request translator", family: "HTTP & web", status: "queued", posture: "convert", disposition: "accept", rank: 11, specs: ["RFC 9110"] },
  { slug: "http-method-override", name: "HTTP method override", family: "HTTP & web", status: "queued", posture: "explain", disposition: "accept", rank: 26, specs: ["RFC 9110"] },

  // ---- QUEUED — TLS & transport -------------------------------------------
  { slug: "mtu-mss", name: "MTU / MSS reference", family: "TLS & transport", status: "queued", posture: "calculate / reference", disposition: "accept", rank: 27, specs: ["RFC 1191", "RFC 879"], note: "tunneling-overhead-reference folded in (M2)." },
  { slug: "bits-bytes", name: "Bits / bytes / throughput", family: "TLS & transport", status: "queued", posture: "convert", disposition: "accept", rank: 28, note: "Kept SEPARATE (M7): throughput-over-time vs bytes-on-wire." },

  // ---- QUEUED — Encoding --------------------------------------------------
  { slug: "charset-equivalency", name: "Charset equivalency", family: "Encoding", status: "queued", posture: "convert / explain", disposition: "accept", rank: 31, specs: ["Unicode", "RFC 3629"] },

  // ---- QUEUED — Identifiers & time ----------------------------------------
  { slug: "epoch", name: "Epoch / time converter", family: "Identifiers & time", status: "queued", posture: "convert", disposition: "accept", rank: 5 },

  // ---- QUEUED — Text & utilities ------------------------------------------
  { slug: "regex", name: "Regex toolkit", family: "Text & utilities", status: "queued", posture: "test / explain", disposition: "accept", rank: 4 },
  { slug: "log-parser", name: "Log parser", family: "Text & utilities", status: "queued", posture: "parse / explain", disposition: "accept", rank: 79 },
  { slug: "diff", name: "Diff", family: "Text & utilities", status: "queued", posture: "compare", disposition: "accept", rank: 7, note: "Carried from consolidation (compliant)." },
  { slug: "password-entropy", name: "Password entropy", family: "Text & utilities", status: "queued", posture: "analyze (analyzer-only)", disposition: "accept", rank: 12, note: "Analyzer only; never a cracker or wordlist." },

  // ============================================================================
  // QUEUED — RATIFIED F5 EXPANSION (28 tools, 27/06/2026)
  // All decode / explain / convert / validate; deterministic; local; public-docs
  // anchored. No forge / crack / evade / defeat. Version-dependent data (cipher
  // DB, signature metadata, model specs) ships as vendored, dated snapshots.
  // ============================================================================

  // ---- F5 LTM, iRules & platform -----------------------------------------
  { slug: "irules-event-order", name: "iRules event-order explainer", family: "F5 LTM, iRules & platform", status: "queued", posture: "explain (deterministic)", disposition: "accept", rank: 9, specs: ["F5 iRules / TMOS event model"], f5: true, note: "Given a profile set + flow, renders the exact event firing sequence. The #1 iRules learning hurdle." },
  { slug: "virtual-server-match-order", name: "Virtual-server match-order explainer", family: "F5 LTM, iRules & platform", status: "queued", posture: "explain (deterministic)", disposition: "accept", rank: 32, specs: ["F5 LTM virtual server selection"], f5: true, note: "Most-specific destination/port/source precedence: which VIP wins for a given packet." },
  { slug: "health-monitor-timing", name: "Health-monitor timing calculator", family: "F5 LTM, iRules & platform", status: "queued", posture: "calculate / explain", disposition: "accept", rank: 33, specs: ["F5 LTM monitors"], f5: true, note: "interval / timeout / up-interval math (timeout >= 3*interval + 1); send/recv explainer." },
  { slug: "f5-tcpdump-syntax", name: "F5 tcpdump syntax builder", family: "F5 LTM, iRules & platform", status: "queued", posture: "build / explain (never captures)", disposition: "accept", rank: 34, specs: ["F5 tcpdump -i 0.0:nnn syntax"], f5: true, note: "The F5-only interface syntax + :p/:n/:h flow flags + --f5 knobs. Builds the command; no capture." },
  { slug: "snat-port-exhaustion", name: "SNAT port-exhaustion calculator", family: "F5 LTM, iRules & platform", status: "queued", posture: "calculate / explain", disposition: "accept", rank: 35, specs: ["F5 SNAT automap / SNAT pool"], f5: true, note: "N SNAT addresses -> max concurrent flows to one destination; automap vs SNAT pool." },
  { slug: "persistence-method-explainer", name: "Persistence-method explainer", family: "F5 LTM, iRules & platform", status: "queued", posture: "explain", disposition: "accept", rank: 36, specs: ["F5 LTM persistence"], f5: true, note: "cookie / source-address / SSL / universal / hash + fallback. Complements bigip-persistence-cookie." },
  { slug: "tmsh-config-explainer", name: "tmsh config explainer", family: "F5 LTM, iRules & platform", status: "queued", posture: "decode / explain", disposition: "accept", rank: 14, specs: ["F5 tmsh reference"], f5: true, note: "Paste a bigip.conf snippet -> plain-English breakdown + structure tree." },
  { slug: "irules-command-context", name: "iRules command / context reference", family: "F5 LTM, iRules & platform", status: "queued", posture: "reference / validate", disposition: "accept", rank: 41, specs: ["F5 iRules command reference"], f5: true, note: "Which commands are valid in which events; flags CMP-demoting constructs (table/session/persist)." },
  { slug: "route-domain-partition-decoder", name: "Route-domain / partition decoder", family: "F5 LTM, iRules & platform", status: "queued", posture: "decode / explain", disposition: "accept", rank: 37, specs: ["F5 route domains / partitions"], f5: true, note: "Unpacks the %RD suffix and /partition/ folder notation in object names and IPs." },
  { slug: "lb-method-chooser", name: "LB-method chooser", family: "F5 LTM, iRules & platform", status: "queued", posture: "explain", disposition: "accept", rank: 38, specs: ["F5 LTM load-balancing methods"], f5: true, note: "round robin / least-conn / ratio / observed / predictive / dynamic ratio, with when-to-use." },
  { slug: "tmsh-irest-mapper", name: "tmsh <-> iControl REST path mapper", family: "F5 LTM, iRules & platform", status: "queued", posture: "convert / explain", disposition: "accept", rank: 39, specs: ["F5 iControl REST"], f5: true, note: "ltm pool /Common/web <-> /mgmt/tm/ltm/pool/~Common~web. Automation aid." },
  { slug: "ha-model-explainer", name: "HA / failover explainer", family: "F5 LTM, iRules & platform", status: "queued", posture: "explain", disposition: "accept", rank: 40, specs: ["F5 device service clustering"], f5: true, note: "Device groups, traffic groups, MAC masquerade, connection mirroring, failover triggers." },
  { slug: "irules-vs-ltm-policy", name: "iRules vs LTM Policy guidance", family: "F5 LTM, iRules & platform", status: "queued", posture: "explain", disposition: "accept", rank: 42, specs: ["F5 LTM policies / iRules"], f5: true, note: "When a match->action belongs in a CMP-friendly LTM Policy vs a real iRule." },
  { slug: "oneconnect-source-mask", name: "OneConnect source-mask explainer", family: "F5 LTM, iRules & platform", status: "queued", posture: "explain", disposition: "accept", rank: 43, specs: ["F5 OneConnect profile"], f5: true, note: "What 255.255.255.255 vs 0.0.0.0 masks do to connection reuse." },

  // ---- F5 GTM, AFM & APM --------------------------------------------------
  { slug: "afm-rule-context", name: "AFM rule-context & match explainer", family: "F5 GTM, AFM & APM", status: "queued", posture: "explain (deterministic)", disposition: "accept", rank: 44, specs: ["F5 BIG-IP AFM"], f5: true, note: "Enforcement hierarchy (global -> route-domain -> virtual -> self-IP) + which rule matches a packet." },
  { slug: "gslb-decision-flow", name: "GSLB decision-flow explainer", family: "F5 GTM, AFM & APM", status: "queued", posture: "explain", disposition: "accept", rank: 45, specs: ["F5 BIG-IP DNS / GTM"], f5: true, note: "Pool LB -> preferred / alternate / fallback; methods (global availability, topology, ratio, QoS, ...)." },
  { slug: "topology-longest-match", name: "GTM topology longest-match scorer", family: "F5 GTM, AFM & APM", status: "queued", posture: "explain (deterministic)", disposition: "accept", rank: 46, specs: ["F5 GTM topology records"], f5: true, note: "Given topology records + a source, computes the winning record by longest-match weight." },
  { slug: "apm-sso-explainer", name: "APM SSO method explainer", family: "F5 GTM, AFM & APM", status: "queued", posture: "explain", disposition: "accept", rank: 47, specs: ["F5 BIG-IP APM"], f5: true, note: "forms / Kerberos-constrained-delegation / NTLM / header / SAML / OAuth-bearer; per-request vs per-session." },
  { slug: "apm-session-variable-reference", name: "APM session-variable reference", family: "F5 GTM, AFM & APM", status: "queued", posture: "reference (vendored)", disposition: "accept", rank: 48, specs: ["F5 APM session variables"], f5: true, note: "Searchable map of session.* variables. Vendored snapshot." },
  { slug: "dos-vector-explainer", name: "AFM DoS-vector / profile explainer", family: "F5 GTM, AFM & APM", status: "queued", posture: "explain (defensive config only)", disposition: "accept", rank: 49, specs: ["F5 AFM DoS profiles"], f5: true, note: "Explains vectors + detection/mitigation thresholds. Never generates attack traffic." },

  // ---- F5 automation (AS3 / DO) ------------------------------------------
  { slug: "as3-explainer-validator", name: "AS3 declaration explainer + validator", family: "F5 automation (AS3 / DO)", status: "queued", posture: "validate / explain (schema)", disposition: "accept", rank: 50, specs: ["F5 AS3 schema"], f5: true, note: "Schema-validate + tenant->app->service tree + objects created. Flags TLS_Server=client-ssl gotcha. AS3 covers LTM/GTM/APM/AFM/ASM/PEM." },
  { slug: "do-explainer-validator", name: "DO declaration explainer + validator", family: "F5 automation (AS3 / DO)", status: "queued", posture: "validate / explain (schema)", disposition: "accept", rank: 51, specs: ["F5 Declarative Onboarding schema"], f5: true, note: "System/VLAN/self-IP/route/license/provision; makes the DO-vs-AS3 boundary explicit." },
  { slug: "ts-explainer", name: "Telemetry Streaming explainer", family: "F5 automation (AS3 / DO)", status: "queued", posture: "explain (schema)", disposition: "accept", rank: 80, specs: ["F5 Telemetry Streaming schema"], f5: true, note: "What stats/events a TS declaration forwards and where (Splunk/ELK/Grafana)." },
  { slug: "iapps-legacy-pointer", name: "iApps legacy pointer", family: "F5 automation (AS3 / DO)", status: "queued", posture: "explain", disposition: "accept", rank: 81, specs: ["F5 iApps / AS3 / FAST"], f5: true, note: "iApps are legacy; AS3 + FAST is the modern declarative path." },

  // ---- F5 ASM additions (Security & WAF family) --------------------------
  { slug: "asm-violation-signature-explainer", name: "ASM violation / signature explainer", family: "Security & WAF", status: "queued", posture: "decode / explain", disposition: "accept", rank: 71, specs: ["F5 BIG-IP ASM / Advanced WAF"], f5: true, note: "Explains violations / signature categories (not evasion). Vendored signature-metadata snapshot." },
  { slug: "asm-support-id-decoder", name: "ASM support-ID decoder", family: "Security & WAF", status: "queued", posture: "decode", disposition: "accept", rank: 72, specs: ["F5 BIG-IP ASM"], f5: true, note: "Unpacks an ASM support ID for log correlation." },

  // ---- F5 TLS additions (TLS & transport family) ------------------------
  { slug: "f5-cipher-string-expander", name: "F5 cipher-string expander", family: "TLS & transport", status: "queued", posture: "expand / explain", disposition: "accept", rank: 29, specs: ["F5 cipher rules/groups", "tmm --clientciphers"], f5: true, note: "Expands an F5 cipher string to the ordered suite list. Vendored, dated per-TMOS cipher DB. Pairs with the live cipher tool." },
  { slug: "f5-ssl-profile-explainer", name: "F5 SSL profile explainer", family: "TLS & transport", status: "queued", posture: "explain", disposition: "accept", rank: 30, specs: ["F5 client-ssl / server-ssl profiles"], f5: true, note: "Chain building, SNI, renegotiation, OCSP stapling; client-ssl vs server-ssl." },

  // ============================================================================
  // QUEUED — RATIFIED FORTINET EXPANSION (21 tools, 27/06/2026)
  // Same posture: decode / explain / convert / validate; deterministic; local;
  // public-docs anchored (FortiOS 7.6.x). No forge / crack / evade / decrypt.
  // Version-dependent data (FortiGuard categories, signature metadata, model
  // specs, log-IDs) ships as vendored, dated snapshots pinned to a FortiOS line.
  // ============================================================================

  // ---- Fortinet FortiGate & FortiOS --------------------------------------
  { slug: "fortigate-policy-match-order", name: "FortiGate policy match-order explainer", family: "Fortinet FortiGate & FortiOS", status: "queued", posture: "explain (deterministic)", disposition: "accept", rank: 52, specs: ["FortiOS firewall policy"], fortinet: true, note: "Top-down first-match + implicit deny; sequence-based vs NGFW/policy-based modes. Which rule wins for a packet." },
  { slug: "fortios-cli-config-explainer", name: "FortiOS CLI config explainer", family: "Fortinet FortiGate & FortiOS", status: "queued", posture: "decode / explain", disposition: "accept", rank: 53, specs: ["FortiOS CLI reference"], fortinet: true, note: "Paste a config/edit/set/next/end block -> plain-English breakdown + structure tree." },
  { slug: "fortigate-session-decoder", name: "FortiGate session-table decoder", family: "Fortinet FortiGate & FortiOS", status: "queued", posture: "decode / explain", disposition: "accept", rank: 54, specs: ["FortiOS diag sys session list"], fortinet: true, note: "Decode a session entry: proto, src->dst, state, NAT, expiry, helper, hook, gateway, policy id, NPU flags." },
  { slug: "fortigate-vdom-explainer", name: "FortiGate VDOM explainer", family: "Fortinet FortiGate & FortiOS", status: "queued", posture: "explain", disposition: "accept", rank: 55, specs: ["FortiOS VDOMs"], fortinet: true, note: "VDOMs, inter-VDOM links, management VDOM, split-task vs multi-VDOM." },
  { slug: "fortios-routing-explainer", name: "FortiOS route-lookup explainer", family: "Fortinet FortiGate & FortiOS", status: "queued", posture: "explain", disposition: "accept", rank: 56, specs: ["FortiOS routing"], fortinet: true, note: "Routing table + policy routes (PBR) precedence, ECMP, distance/priority, SD-WAN interaction." },
  { slug: "fortios-npu-offload", name: "FortiGate NP7 / SOC offload explainer", family: "Fortinet FortiGate & FortiOS", status: "queued", posture: "explain", disposition: "accept", rank: 57, specs: ["FortiGate NP7 / SOC4"], fortinet: true, note: "What gets hardware-offloaded vs punted to CPU, and what breaks offload (IPS, proxy mode)." },

  // ---- Fortinet security, VPN & SD-WAN -----------------------------------
  { slug: "fortios-security-profiles", name: "Security-profile / inspection-mode explainer", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "explain", disposition: "accept", rank: 58, specs: ["FortiOS security profiles"], fortinet: true, note: "flow vs proxy inspection + the profile stack (AV / IPS / web filter / app control / DNS filter / file filter / DLP)." },
  { slug: "fortigate-ssl-inspection", name: "SSL/SSH inspection explainer", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "explain (config only)", disposition: "accept", rank: 59, specs: ["FortiOS SSL/SSH inspection"], fortinet: true, note: "certificate-inspection vs deep-inspection, CA cert, exemptions. Explains config; never decrypts." },
  { slug: "fortigate-ipsec-p1p2", name: "IPsec phase1/phase2 mismatch checker", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "explain / compare (deterministic)", disposition: "accept", rank: 60, specs: ["RFC 7296", "FortiOS IPsec VPN"], fortinet: true, note: "Paste both peers' proposals -> find the mismatch. Note 7.6.1 IKE-over-TCP default port 443." },
  { slug: "fortigate-sdwan-rule", name: "SD-WAN rule / SLA explainer", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "explain (deterministic)", disposition: "accept", rank: 61, specs: ["FortiOS SD-WAN"], fortinet: true, note: "Rule strategy (manual / best-quality / lowest-cost / maximize-bandwidth), Performance SLA thresholds, rule match order." },
  { slug: "fortigate-sdwan-sla-calc", name: "SD-WAN SLA target calculator", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "calculate", disposition: "accept", rank: 62, specs: ["FortiOS SD-WAN health-check"], fortinet: true, note: "Given thresholds + measured latency/jitter/loss, which members are in or out of SLA." },
  { slug: "fortigate-sslvpn-explainer", name: "SSL-VPN / Agentless-VPN explainer", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "explain", disposition: "accept", rank: 63, specs: ["FortiOS SSL-VPN"], fortinet: true, note: "Modes + the deprecation (SSL-VPN web mode is now 'Agentless VPN', unsupported on some models)." },
  { slug: "fortigate-ztna-explainer", name: "ZTNA tag / posture explainer", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "explain", disposition: "accept", rank: 82, specs: ["FortiOS ZTNA"], fortinet: true, note: "ZTNA tags, access proxy, posture checks." },
  { slug: "fortiguard-category-lookup", name: "FortiGuard category lookup", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "lookup (vendored)", disposition: "accept", rank: 83, specs: ["FortiGuard web-filter / app-control categories"], fortinet: true, note: "Category ID -> name/group. Vendored snapshot. (Live URL classification is egress -> deferred.)" },
  { slug: "fortigate-log-decoder", name: "FortiGate log decoder", family: "Fortinet security, VPN & SD-WAN", status: "queued", posture: "decode / explain", disposition: "accept", rank: 64, specs: ["FortiOS log reference"], fortinet: true, note: "Decode a log line by logid + field reference (type/subtype, srcip/dstip/policyid/action). Vendored log-ID snapshot." },

  // ---- Fortinet ecosystem & identity -------------------------------------
  { slug: "fortiweb-policy-explainer", name: "FortiWeb policy / signature explainer", family: "Fortinet ecosystem & identity", status: "queued", posture: "decode / explain", disposition: "accept", rank: 84, specs: ["FortiWeb"], fortinet: true, note: "Server policies, protection profiles, ML anomaly detection. The Fortinet parallel to asm-waf-inspector. Vendored signature metadata." },
  { slug: "fortiadc-lb-explainer", name: "FortiADC LB-method / health-check explainer", family: "Fortinet ecosystem & identity", status: "queued", posture: "explain", disposition: "accept", rank: 85, specs: ["FortiADC"], fortinet: true, note: "Virtual servers, real servers, methods, persistence, health checks. Parallel to the F5 LTM LB tools." },
  { slug: "fortimanager-adom-explainer", name: "FortiManager ADOM / policy-package explainer", family: "Fortinet ecosystem & identity", status: "queued", posture: "explain", disposition: "accept", rank: 86, specs: ["FortiManager"], fortinet: true, note: "ADOMs, policy packages, device DB vs ADOM DB, install targets." },
  { slug: "fortisase-explainer", name: "FortiSASE component explainer", family: "Fortinet ecosystem & identity", status: "queued", posture: "explain", disposition: "accept", rank: 87, specs: ["FortiSASE"], fortinet: true, note: "SWG / ZTNA / CASB / FWaaS architecture." },
  { slug: "fortigate-scim-explainer", name: "SCIM 2.0 provisioning explainer", family: "Fortinet ecosystem & identity", status: "queued", posture: "explain", disposition: "accept", rank: 88, specs: ["SCIM 2.0", "RFC 7644"], fortinet: true, note: "FortiOS 7.6 SCIM server: auto-provision users/groups from an IdP. Pairs with the queued SAML/OIDC decoders." },
  { slug: "totp-hotp", name: "TOTP / HOTP explainer + validator", family: "Fortinet ecosystem & identity", status: "queued", posture: "explain / validate (deterministic)", disposition: "accept", rank: 6, specs: ["RFC 6238", "RFC 4226"], fortinet: true, note: "The OTP algorithms FortiToken uses. RFC-anchored; cross-platform (also a generally useful tool)." },

  // ============================================================================
  // QUEUED — RATIFIED NETSKOPE + EXTREME EXPANSION (18 tools, 27/06/2026)
  // Same posture: decode / explain / convert / validate; deterministic; local;
  // public-docs anchored. No forge / crack / evade / decrypt. Version-dependent
  // data (categories, CCI, classifier lists, log/event IDs, model/OS maps) ships
  // as vendored, dated snapshots.
  // ============================================================================

  // ---- Netskope SSE / SASE (build-first 4 + 4 others) --------------------
  { slug: "pac-file-explainer", name: "PAC file explainer + validator", family: "Netskope SSE / SASE", status: "queued", posture: "parse / validate", disposition: "accept", rank: 69, specs: ["PAC (FindProxyForURL)"], netskope: true, note: "Parses FindProxyForURL logic (isInNet, dnsDomainIs, ...). Netskope steering aid; cross-platform standard." },
  { slug: "sse-architecture-explainer", name: "SSE / SASE single-pass architecture explainer", family: "Netskope SSE / SASE", status: "queued", posture: "explain", disposition: "accept", rank: 89, specs: ["Netskope One platform"], netskope: true, note: "Zero Trust Engine, single-pass inspection order, the SSE stack (SWG/CASB/ZTNA/DLP/FWaaS/RBI/DNSaaS)." },
  { slug: "netskope-steering-explainer", name: "Netskope steering-method explainer", family: "Netskope SSE / SASE", status: "queued", posture: "explain", disposition: "accept", rank: 90, specs: ["Netskope One steering"], netskope: true, note: "Client vs IPsec vs GRE vs proxy-chaining vs DNS steering to NewEdge; when each applies." },
  { slug: "netskope-dlp-concepts", name: "Netskope DLP concept explainer", family: "Netskope SSE / SASE", status: "queued", posture: "explain", disposition: "accept", rank: 91, specs: ["Netskope One DLP"], netskope: true, note: "Rules, classifiers, file types, EDM, fingerprinting. Explains concepts; never builds classifiers or extracts data." },
  { slug: "netskope-cci-explainer", name: "Cloud Confidence Index (CCI) explainer", family: "Netskope SSE / SASE", status: "queued", posture: "reference (vendored)", disposition: "accept", rank: 102, specs: ["Netskope Cloud Confidence Index"], netskope: true, note: "App-risk scoring model + attributes. Vendored reference. (Non-build-first: queued at end.)" },
  { slug: "netskope-ztna-explainer", name: "Netskope Private Access (ZTNA) explainer", family: "Netskope SSE / SASE", status: "queued", posture: "explain", disposition: "accept", rank: 103, specs: ["Netskope One Private Access"], netskope: true, note: "Publishers, app definitions, ZTNA-vs-VPN, bi-directional ZTNA Next. (Non-build-first: queued at end.)" },
  { slug: "netskope-log-fields", name: "Netskope log / event field reference", family: "Netskope SSE / SASE", status: "queued", posture: "decode / reference (vendored)", disposition: "accept", rank: 104, specs: ["Netskope SkopeIT events"], netskope: true, note: "Decode a page/application event's fields. Vendored field map. (Non-build-first: queued at end.)" },
  { slug: "netskope-sso-explainer", name: "Netskope SSO / SCIM integration explainer", family: "Netskope SSE / SASE", status: "queued", posture: "explain", disposition: "accept", rank: 105, specs: ["SAML 2.0", "OIDC", "SCIM 2.0"], netskope: true, note: "Netskope as SP + SCIM provisioning. Shares standards with the queued saml/oidc decoders. (Non-build-first: queued at end.)" },

  // ---- Extreme switching & fabric (EXOS / VOSS / SPB) --------------------
  { slug: "exos-config-explainer", name: "EXOS (Switch Engine) config explainer", family: "Extreme switching & fabric (EXOS / VOSS / SPB)", status: "queued", posture: "decode / explain", disposition: "accept", rank: 92, specs: ["ExtremeXOS / Switch Engine CLI"], extreme: true, note: "Paste an EXOS config -> plain-English + structure tree." },
  { slug: "fabric-connect-spb-explainer", name: "Fabric Connect / SPB explainer", family: "Extreme switching & fabric (EXOS / VOSS / SPB)", status: "queued", posture: "decode / explain", disposition: "accept", rank: 93, specs: ["IEEE 802.1aq (SPB)", "IS-IS"], extreme: true, note: "Shortest Path Bridging + IS-IS: BVLANs, I-SIDs, B-MAC, L2VSN/L3VSN. Extreme's signature tech; rare tooling." },
  { slug: "voss-config-explainer", name: "VOSS (Fabric Engine) config explainer", family: "Extreme switching & fabric (EXOS / VOSS / SPB)", status: "queued", posture: "decode / explain", disposition: "accept", rank: 95, specs: ["VOSS / Fabric Engine ACLI"], extreme: true, note: "Same for the Avaya-lineage ACLI syntax (distinct grammar from EXOS)." },
  { slug: "extremecontrol-nac-explainer", name: "ExtremeControl NAC policy explainer", family: "Extreme NAC & cloud (ExtremeControl / Platform ONE)", status: "queued", posture: "explain", disposition: "accept", rank: 99, specs: ["ExtremeControl"], extreme: true, note: "Roles, contextual identity; policies combine VLAN/L2VSN/L3VSN/L2-L7 ACL+QoS and convert to dACLs." },
  { slug: "isid-vsn-decoder", name: "I-SID / VSN decoder", family: "Extreme switching & fabric (EXOS / VOSS / SPB)", status: "queued", posture: "decode", disposition: "accept", rank: 96, specs: ["SPBM I-SID / VSN"], extreme: true, note: "Decode a Service Instance Identifier + its L2VSN/L3VSN mapping." },
  { slug: "extreme-switch-os-mapper", name: "Universal switch OS-name mapper", family: "Extreme switching & fabric (EXOS / VOSS / SPB)", status: "queued", posture: "reference (vendored)", disposition: "accept", rank: 94, specs: ["Extreme Universal switches"], extreme: true, note: "EXOS<->Switch Engine / VOSS<->Fabric Engine, by model. Timely (image file names are still EXOS/VOSS)." },
  { slug: "extreme-dacl-explainer", name: "Downloadable ACL (dACL) explainer", family: "Extreme NAC & cloud (ExtremeControl / Platform ONE)", status: "queued", posture: "decode / explain", disposition: "accept", rank: 100, specs: ["ExtremeControl dACL"], extreme: true, note: "The downloadable-ACL structure ExtremeControl pushes to switches and routers." },
  { slug: "exos-voss-mapper", name: "EXOS <-> VOSS concept mapper", family: "Extreme switching & fabric (EXOS / VOSS / SPB)", status: "queued", posture: "convert / explain", disposition: "accept", rank: 97, specs: ["ExtremeXOS", "VOSS"], extreme: true, note: "VLAN vs VSN and friends, for shops running both OSes." },
  { slug: "fabric-attach-explainer", name: "Fabric Attach explainer", family: "Extreme switching & fabric (EXOS / VOSS / SPB)", status: "queued", posture: "explain", disposition: "accept", rank: 98, specs: ["Extreme Fabric Attach"], extreme: true, note: "Auto edge-to-fabric provisioning." },
  { slug: "extreme-platform-map", name: "Platform ONE / XIQ / Site Engine map", family: "Extreme NAC & cloud (ExtremeControl / Platform ONE)", status: "queued", posture: "explain", disposition: "accept", rank: 101, specs: ["Extreme Platform ONE", "ExtremeCloud IQ"], extreme: true, note: "The cloud-vs-on-prem management split and where ExtremeControl/Analytics live." },

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
  fortinetQueued: CATALOGUE.filter((t) => t.status === "queued" && t.fortinet).length,
  netskopeQueued: CATALOGUE.filter((t) => t.status === "queued" && t.netskope).length,
  extremeQueued: CATALOGUE.filter((t) => t.status === "queued" && t.extreme).length,
  udp: CATALOGUE.filter((t) => t.isNew).length,
});
/** LIVE tools with a ratified-but-unbuilt merge — build BEFORE any new queue tool. */
export const consolidationBacklog = () => CATALOGUE.filter((t) => t.consolidationPending);
/**
 * buildQueue — the Phase-1 build order: every accepted (not-yet-built) tool,
 * sorted by its global value rank (1 = build first). PRIME-ratified 2026-06-28,
 * this single highest-to-lowest ranking lives on each entry's `rank` field and
 * is the durable source of truth, superseding the prior per-family VALUE_RANK
 * scheme. Any accepted tool missing a rank sorts last, alphabetically.
 */
export const buildQueue = () =>
  CATALOGUE.filter((t) => t.disposition === "accept").sort(
    (a, b) =>
      (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name),
  );
