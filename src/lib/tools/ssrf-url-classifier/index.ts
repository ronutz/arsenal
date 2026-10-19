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
// Because it is a cheap, side-effect-free string transform, it is safe to expose
// over the HTTP API (recorded in registry.ts, D-72) as well as in the browser.
// ============================================================================

import { classifyUrl } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { classifyUrl } from "./compute";
export type { HostCategory, RiskLevel, SsrfResult, Ipv4Embedding, SpecialBlock } from "./compute"; // last two added 2026-10-19
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
      id: "iana-ipv4-special", // read by classifyIpv4's IETF_PROTOCOL_ROWS
      label: "IANA, IPv4 Special-Purpose Address Space (CSV, registry updated 2025-10-09)", // the registry's current title
      url: "https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "192.0.0.0/24 IETF Protocol Assignments (footnote [2]: not useable unless by virtue of a more specific reservation), 192.0.0.0/29, 192.0.0.8/32, 192.0.0.9/32, 192.0.0.10/32 and 192.0.0.170/32, 192.0.0.171/32 with their Globally Reachable values", // what this source pins
    }, // end iana-ipv4-special
    { // the IPv6 registry: the embedding prefixes and the reserved blocks
      id: "iana-ipv6-special", // read by classifyIpv6's V6_ROWS
      label: "IANA, IPv6 Special-Purpose Address Space (CSV, registry updated 2025-10-09)", // the registry's current title
      url: "https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "::1/128, ::/128, ::ffff:0:0/96, 64:ff9b::/96, 64:ff9b:1::/48, 100::/64, 2001:db8::/32, 2002::/16 and 3fff::/20: names, RFCs and Globally Reachable values", // what this source pins
    }, // end iana-ipv6-special
    { // IPv4-mapped addresses and the text forms
      id: "rfc4291", // the IPv6 addressing architecture
      label: "RFC 4291, IP Version 6 Addressing Architecture, February 2006: sections 2.2 and 2.5.5.2", // text forms; IPv4-mapped layout
      url: "https://www.rfc-editor.org/rfc/rfc4291.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope: "the three text forms parseIpv6 accepts, and ::ffff:0:0/96 carrying the IPv4 address in its low 32 bits", // what this source pins
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
  ],
});

/** Tool entry point. Deterministic given the input URL; delegates to the pure,
 *  network-free classifier. */
export function run(input: string) {
  return classifyUrl(input);
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
