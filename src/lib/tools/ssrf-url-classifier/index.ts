// ============================================================================
// src/lib/tools/ssrf-url-classifier/index.ts
// ----------------------------------------------------------------------------
// SSRF URL CLASSIFIER - a {manifest, run, vectors} triple. Paste a URL and the
// tool reports where it points (loopback, private, link-local, cloud metadata,
// CGNAT, reserved, or public), decodes the IP-obfuscation tricks that hide an
// internal address from a naive filter, and flags dangerous URL schemes and
// embedded credentials, with an SSRF risk level and plain-language reasons.
//
// It is a deterministic, pure function of the input string. It NEVER resolves
// DNS and NEVER issues the request (D-53): a bare hostname is reported as
// "resolves at runtime", the honest answer for a classifier that does not probe.
//
// 2026-10-19: IPv6 hosts that carry an IPv4 address (IPv4-mapped, NAT64, 6to4)
// are rated by that address, every spelling of an IPv6 address rates the same,
// and the IANA special-purpose rows for 2001:db8::/32, 3fff::/20, 100::/64 and
// 192.0.0.0/24 are named on the result; the dated sources are listed below.
// 2026-10-19b: every row of both IANA special-purpose registries is named and
// rated by its own Globally Reachable flag, IPv4-compatible and Teredo addresses
// are decoded too, and the anycast service addresses are flagged as such.
// Because it is a cheap, side-effect-free string transform, it is safe to expose
// over the HTTP API (recorded in registry.ts, D-72) as well as in the browser.
// ============================================================================

import { classifyUrl } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { classifyUrl } from "./compute";
export type { HostCategory, RiskLevel, SsrfResult, Ipv4Embedding, SpecialBlock, TeredoParts } from "./compute"; // Ipv4Embedding and SpecialBlock added 2026-10-19, TeredoParts 2026-10-19b
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the ssrf-url-classifier tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "ssrf-url-classifier",
  canonicalAliases: [
    "ssrf-checker",
    "ssrf-classifier",
    "url-destination-classifier",
    "internal-ip-checker",
    "metadata-endpoint-checker",
    "ip-obfuscation-decoder",
    "url-ssrf-risk",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^https?://", priority: 2, example: "http://169.254.169.254/latest/meta-data/" },
    { kind: "regex", pattern: "^(file|gopher|dict|ftp|ldap)://", priority: 3, example: "gopher://127.0.0.1:6379/_INFO" },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  // A cheap, deterministic, side-effect-free string transform: safe to expose
  // over the HTTP API as well as in the browser (recorded in registry.ts, D-72).
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  // The defining safety property: the classifier decides purely from the string
  // and never touches the network - no DNS, no fetch (D-53).
  dangerousInputHandling: ["never-resolves-dns", "never-fetches"],
  // A URL is not itself a secret, and nothing leaves the browser.
  shareSafetyDefault: "safe",

  // -- Teaching & provenance --
  learnLinks: [
    "learn/what-is-ssrf",
    "learn/private-vs-public-ip-ranges",
    "learn/ip-address-obfuscation-tricks",
    "learn/cloud-metadata-endpoints-and-ssrf",
    "learn/ssrf-defenses-allowlists",
    "learn/dangerous-url-schemes",
  ],
  sources: [
    { id: "rfc1918", label: "RFC 1918 - Address Allocation for Private Internets", url: "https://www.rfc-editor.org/rfc/rfc1918" },
    { id: "rfc3927", label: "RFC 3927 - Dynamic Configuration of IPv4 Link-Local Addresses", url: "https://www.rfc-editor.org/rfc/rfc3927" },
    { id: "rfc6598", label: "RFC 6598 - IANA-Reserved IPv4 Prefix for Shared Address Space (CGNAT)", url: "https://www.rfc-editor.org/rfc/rfc6598" },
    { id: "rfc3986", label: "RFC 3986 - Uniform Resource Identifier (URI): Generic Syntax", url: "https://www.rfc-editor.org/rfc/rfc3986" },
    { id: "owasp-ssrf", label: "OWASP - Server Side Request Forgery Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html" },
    // -- Added 2026-10-19 (PRIME: "Fix all ten": IPv4-in-IPv6 decoding and the IANA special-purpose rows) --
    { // the IPv4 registry: 192.0.0.0/24 and its more specific rows
      id: "iana-ipv4-special", // read by classifyIpv4 through the shared table
      label: "IANA, IPv4 Special-Purpose Address Space (CSV, registry updated 2025-10-09)", // the registry's current title
      url: "https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv", // fetched 2026-10-19 and again 2026-10-26, HTTP 200 both times
      access_date: "2026-10-26", // re-read when the rows moved to the shared module (batch B, item B10); unchanged since 2025-10-09
      scope: "every one of the 25 rows (since 2026-10-26 in the shared module src/lib/iana/special-purpose.ts, which the CIDR tool reads too): names, RFCs and Globally Reachable values, footnote [2] on 192.0.0.0/24, and the removed booleans of the deprecated 192.88.99.0/24", // what this source pins (moved 2026-10-26)
    }, // end iana-ipv4-special
    { // the IPv6 registry: the embedding prefixes and the reserved blocks
      id: "iana-ipv6-special", // read by classifyIpv6's V6_ROWS and IPV6_REGISTRY through the shared table
      label: "IANA, IPv6 Special-Purpose Address Space (CSV, registry updated 2025-10-09)", // the registry's current title
      url: "https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv", // fetched 2026-10-19 and again 2026-10-26, HTTP 200 both times
      access_date: "2026-10-26", // re-read when the rows moved to the shared module (batch B, item B10); unchanged since 2025-10-09
      scope: "every one of the 25 rows (since 2026-10-26 in the shared module src/lib/iana/special-purpose.ts): names, RFCs, Globally Reachable values and footnotes [1] to [4]", // what this source pins (moved 2026-10-26)
    }, // end iana-ipv6-special
    { // IPv4-mapped addresses and the text forms
      id: "rfc4291", // the IPv6 addressing architecture
      label: "RFC 4291, IP Version 6 Addressing Architecture, February 2006: sections 2.2, 2.5.5.1 and 2.5.5.2", // text forms; IPv4-compatible (2026-10-19b) and IPv4-mapped layouts
      url: "https://www.rfc-editor.org/rfc/rfc4291.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "the three text forms parseIpv6 accepts; ::ffff:0:0/96 and the deprecated IPv4-compatible ::/96 carrying the IPv4 address in their low 32 bits", // what this source pins (IPv4-compatible added 2026-10-19b)
    }, // end rfc4291
    { // the NAT64 address layouts
      id: "rfc6052", // IPv4-embedded IPv6 addresses
      label: "RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, October 2010: sections 2.1 to 2.4 and 3.1", // WKP, layouts, text form, WKP restrictions
      url: "https://www.rfc-editor.org/rfc/rfc6052.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "64:ff9b::/96; the /32 to /96 layouts with the u octet (bits 64 to 71) that MUST be zero; mixed-notation text; the WKP MUST NOT represent non-global IPv4 addresses", // what this source pins
    }, // end rfc6052
    { // the local-use translation prefix
      id: "rfc8215", // 64:ff9b:1::/48
      label: "RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, August 2017: sections 1, 4.1 and 5", // reservation, length, deployment
      url: "https://www.rfc-editor.org/rfc/rfc8215.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "64:ff9b:1::/48 for local use; the operator chooses the translation prefix length inside it, so the tool tries the RFC 6052 /48, /56, /64 and /96 layouts", // what this source pins
    }, // end rfc8215
    { // 6to4
      id: "rfc3056", // 2002::/16
      label: "RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, February 2001: section 2", // 2002:V4ADDR::/48
      url: "https://www.rfc-editor.org/rfc/rfc3056.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "2002::/16 with the 32-bit V4ADDR immediately after the 16-bit prefix (bits 16 to 47)", // what this source pins
    }, // end rfc3056
    { // documentation prefixes
      id: "rfc3849-rfc9637", // 2001:db8::/32 and 3fff::/20
      label: "RFC 3849, IPv6 Address Prefix Reserved for Documentation, July 2004, and RFC 9637, Expanding the IPv6 Documentation Space, August 2024", // both documentation prefixes
      url: "https://www.rfc-editor.org/rfc/rfc9637.txt", // fetched 2026-10-19, HTTP 200 (RFC 3849 at https://www.rfc-editor.org/rfc/rfc3849.txt, also HTTP 200)
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "2001:db8::/32 and 3fff::/20 are documentation-only prefixes", // what this source pins
    }, // end documentation prefixes
    { // discard-only
      id: "rfc6666", // 100::/64
      label: "RFC 6666, A Discard Prefix for IPv6, August 2012: section 4", // the IANA allocation
      url: "https://www.rfc-editor.org/rfc/rfc6666.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "0100::/64 is the Discard-Only Prefix for remote triggered black hole filtering", // what this source pins
    }, // end rfc6666
    { // NAT64 discovery addresses
      id: "rfc7050", // 192.0.0.170 and 192.0.0.171
      label: "RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, November 2013: section 2.2", // the Well-Known IPv4 Addresses
      url: "https://www.rfc-editor.org/rfc/rfc7050.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "192.0.0.170 and 192.0.0.171 are the Well-Known IPv4 Addresses of ipv4only.arpa used for Pref64::/n discovery", // what this source pins
    }, // end rfc7050
    { // canonical text
      id: "rfc5952", // the canonicalIp format
      label: "RFC 5952, A Recommendation for IPv6 Address Text Representation, August 2010: sections 4 and 5", // compression rules and mixed notation
      url: "https://www.rfc-editor.org/rfc/rfc5952.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "the canonical text canonicalIp now reports, with mixed notation for ::ffff:0:0/96 and 64:ff9b::/96", // what this source pins
    }, // end rfc5952
    { // why a browser shows [::ffff:7f00:1]
      id: "whatwg-url", // the URL Standard
      label: "WHATWG, URL Standard (Living Standard, last updated 19 October 2026): IPv6 serializer", // the serializer that writes pure hex
      url: "https://url.spec.whatwg.org/", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "the IPv6 serializer writes every piece in hexadecimal, so [::ffff:127.0.0.1] is serialised as [::ffff:7f00:1]; both spellings must rate the same", // what this source pins
    }, // end whatwg-url
    // -- Added 2026-10-19b (PRIME: "adopt the fullest, most complete, most accurate options"); all fetched 2026-10-19, HTTP 200 --
    { // Teredo layout
      id: "rfc4380", // 2001::/32
      label: "RFC 4380, Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), February 2006: sections 2.6 and 4", // the prefix and the address format
      url: "https://www.rfc-editor.org/rfc/rfc4380.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was extended
      scope: "server IPv4 in bits 32 to 63, Flags, client port XOR 0xFFFF, client IPv4 XOR 0xFFFFFFFF; global Teredo identifiers MUST include a global scope unicast IPv4 address", // what this source pins
    }, // end rfc4380
    { // Teredo flags update
      id: "rfc5991", // updates RFC 4380
      label: "RFC 5991, Teredo Security Updates, September 2010: section 3.1", // the Flags field
      url: "https://www.rfc-editor.org/rfc/rfc5991.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was extended
      scope: "the updated Flags field layout (C, z, Random1, U, G, Random2); the tool reports the Flags value and does not rate by it", // what this source pins
    }, // end rfc5991
    { // the anycast service addresses
      id: "anycast-services", // PCP, TURN, DNS-SD SRP
      label: "RFC 7723, Port Control Protocol (PCP) Anycast Addresses, January 2016; RFC 8155, Traversal Using Relays around NAT (TURN) Server Auto Discovery, April 2017: section 6; RFC 9665, Service Registration Protocol for DNS-Based Service Discovery, June 2025: section 10.5", // three documents, one purpose
      url: "https://www.rfc-editor.org/rfc/rfc7723.txt", // fetched 2026-10-19, HTTP 200 (also https://www.rfc-editor.org/rfc/rfc8155.txt and https://www.rfc-editor.org/rfc/rfc9665.txt, HTTP 200)
      access_date: "2026-10-19", // read the day the engine was extended
      scope: "192.0.0.9, 192.0.0.10, 2001:1::1, 2001:1::2 and 2001:1::3 are anycast service addresses, answered by the nearest PCP server, TURN server or SRP registrar", // what this source pins
    }, // end anycast-services
    { // 6to4 relay anycast and 6a44
      id: "rfc7526-rfc6751", // 192.88.99.0/24 and 192.88.99.2/32
      label: "RFC 7526, Deprecating the Anycast Prefix for 6to4 Relay Routers, May 2015: sections 4 and 7; RFC 6751, Native IPv6 behind IPv4-to-IPv4 NAT Customer Premises Equipment (6a44), October 2012: sections 5 and 8", // both 192.88.99.0/24 documents
      url: "https://www.rfc-editor.org/rfc/rfc7526.txt", // fetched 2026-10-19, HTTP 200 (also https://www.rfc-editor.org/rfc/rfc6751.txt, HTTP 200)
      access_date: "2026-10-19", // read the day the engine was extended
      scope: "192.88.99.0/24 MUST NOT be reassigned and lost its registry booleans; 192.88.99.2 is the 6a44-relay anycast address; a 6a44 address starts with an ISP-chosen /48, so no fixed prefix marks the embedding and the tool cannot decode it", // what this source pins
    }, // end rfc7526-rfc6751
    { // the remaining IPv6 rows
      id: "ipv6-row-rfcs", // one entry for the block-defining RFCs
      label: "RFC 5180 (May 2008) with erratum 1752, RFC 7450 (February 2015), RFC 7534 and RFC 7535 (May 2015), RFC 7343 (September 2014), RFC 9374 (March 2023), RFC 9602 (October 2024), RFC 9780 (May 2025)", // benchmarking, AMT, AS112, ORCHIDv2, DETs, SRv6 SIDs, dummy prefix
      url: "https://www.rfc-editor.org/rfc/rfc9602.txt", // fetched 2026-10-19, HTTP 200; the others at https://www.rfc-editor.org/rfc/rfc<n>.txt and https://www.rfc-editor.org/errata/eid1752, all HTTP 200
      access_date: "2026-10-19", // read the day the engine was extended
      scope: "2001:2::/48 (erratum 1752 corrects RFC 5180's 2001:0200::/48), 2001:3::/32 and 192.52.193.0/24, 2001:4:112::/48 and 192.31.196.0/24, 2620:4f:8000::/48 and 192.175.48.0/24, 2001:20::/28 and 2001:30::/28 (non-routable identifiers the registry marks globally reachable), 5f00::/16, 100:0:0:1::/64", // what this source pins
    }, // end ipv6-row-rfcs
  ],
});

/** Tool entry point. Deterministic given the input URL; delegates to the pure,
 *  network-free classifier. */
export function run(input: string) {
  return classifyUrl(input);
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
