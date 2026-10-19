// ============================================================================
// src/lib/tools/ipv6/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING IPv6 MODULE - a self-contained {manifest, run, vectors} triple.
//
// Mirrors the cidr / x509 reference modules, written so the whole folder could
// be lifted into an open library unchanged if the project is ever opened. It is
// the IPv6 counterpart to the IPv4-oriented cidr tool.
//
// The manifest is a real D-49 manifest (ArchSpec §9.1): https-only sources, no
// raw HTML, an `inputDetectors[]` regex an omnibox would use to route a pasted
// address here, `executionClass: localOnly` (pure address math, no network,
// nothing sensitive), and `shareSafetyDefault: safe` (an address is publishable;
// nothing secret is parsed). Vocabulary follows the canon enum, not the still-
// proposed ANVIL-PKG-001 additions.
// ============================================================================

import { decodeIpv6, type DecodedIpv6 } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  IPV6_GOLDEN_VECTORS,
  IPV6_REJECT_VECTORS,
} from "./golden-vectors";

// Re-export vector metadata + types at the module boundary (CI / host wiring).
export {
  GOLDEN_VECTOR_SET_ID,
  IPV6_GOLDEN_VECTORS,
  IPV6_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type {
  DecodedIpv6,
  Ipv6Classification,
  Ipv6PrefixMath,
  Ipv6Teredo, // the Teredo decode shape, exported 2026-10-19 with the decoder
  Ipv6DecodeErrorCode,
} from "./compute";
export { Ipv6DecodeError } from "./compute";

/** The D-49 declarative manifest for the IPv6 tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing",
  toolSlug: "ipv6",
  canonicalAliases: ["ipv6-calculator", "ipv6-subnet", "ip6", "ipv6-expand"],
  inputDetectors: [
    {
      // IPv6-ish: hex groups joined by colons, optional embedded IPv4 + prefix.
      // A single character-class repetition with anchors - linear, ReDoS-safe.
      kind: "regex",
      pattern: "^[0-9A-Fa-f:]+:[0-9A-Fa-f:.]*(%[\\w.]+)?(/[0-9]{1,3})?$",
      priority: 10,
      example: "2001:db8::1/64",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // pure address math; no network, nothing sensitive
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // anchored linear detectors + bounded group parse
  shareSafetyDefault: "safe", // an IP address is publishable; nothing secret is parsed

  // -- Teaching & provenance --
  learnLinks: ["learn/ipv6-addressing"],
  sources: [
    {
      id: "rfc4291",
      label: "RFC 4291 - IP Version 6 Addressing Architecture",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4291",
      access_date: "2026-10-19", // re-read 2026-10-19 for the s2.7 flag and scope tables (was 2026-06-27)
      scope: "text representation, address types, s2.7 multicast flags and scope values (0 and F reserved), EUI-64 (Appendix A)", // widened 2026-10-19
      status: "active",
    },
    // -- Sources added 2026-10-19 (PRIME's decisions A1 to A3), each downloaded that day --
    {
      id: "iana-ipv6-special-registry", // the authority for every special-use row
      label: "IANA IPv6 Special-Purpose Address Registry (CSV; registry last updated 2025-10-09)", // registry date as printed by IANA
      type: "registry", // an IANA registry, not an RFC
      url: "https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv", // the CSV read on the day
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "the 3fff::/20, 5f00::/16, 64:ff9b:1::/48 and 2001::/32 rows and their names", // what this tool takes from it
      status: "active", // live registry
    },
    {
      id: "iana-ipv6-multicast-addresses", // scope values and the SSM group-ID ranges
      label: "IANA IPv6 Multicast Address Space Registry (last updated 2026-04-07)", // registry date as printed by IANA
      type: "registry", // an IANA registry
      url: "https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.txt", // text form read on the day
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "IPv6 Multicast Address Scopes table (0 and F reserved, 6-7 and 9-D unassigned); Unicast-based (Including SSM) Multicast Group IDs ranges", // sub-registries used
      status: "active", // live registry
    },
    {
      id: "rfc7346", // Realm-Local scope and the scope registry
      label: "RFC 7346 - IPv6 Multicast Address Scopes", // August 2014
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc7346", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "scope 3 named Realm-Local; creation of the IANA scope registry", // what it changes
      status: "active", // current
    },
    {
      id: "rfc7371", // flag-bit naming
      label: "RFC 7371 - Updates to the IPv6 Multicast Addressing Architecture", // September 2014
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc7371", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "the ff1 flag field |X|Y|P|T| and the rule to treat flag bits as separate bits", // section 4 and section 3
      status: "active", // current
    },
    {
      id: "rfc3306", // P flag and the SSM range
      label: "RFC 3306 - Unicast-Prefix-based IPv6 Multicast Addresses", // August 2002
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc3306", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "the P flag; section 6, SSM addresses form FF3x::/32", // what this tool reads
      status: "active", // current
    },
    {
      id: "rfc3956", // R flag
      label: "RFC 3956 - Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address", // November 2004
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc3956", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "the R flag (embedded-RP addresses, FF70::/12)", // read out, not decoded
      status: "active", // current
    },
    {
      id: "rfc4607", // SSM
      label: "RFC 4607 - Source-Specific Multicast for IP", // August 2006
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc4607", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "section 1: FF3x::/32 reserved for SSM, P=1 T=1 plen=0, the invalid / IANA / dynamic group-ID ranges", // what this tool applies
      status: "active", // current
    },
    {
      id: "rfc9637", // 3fff::/20
      label: "RFC 9637 - Expanding the IPv6 Documentation Space", // August 2024
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc9637", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "the 3fff::/20 documentation prefix", // one classification row
      status: "active", // current
    },
    {
      id: "rfc9602", // 5f00::/16
      label: "RFC 9602 - Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture", // October 2024
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc9602", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "the 5f00::/16 SRv6 SID block", // one classification row
      status: "active", // current
    },
    {
      id: "rfc8215", // 64:ff9b:1::/48
      label: "RFC 8215 - Local-Use IPv4/IPv6 Translation Prefix", // August 2017
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc8215", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "the 64:ff9b:1::/48 local-use translation prefix", // one classification row
      status: "active", // current
    },
    {
      id: "rfc4380", // Teredo
      label: "RFC 4380 - Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs)", // February 2006
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc4380", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "section 4: Teredo address layout and the XOR obfuscation of the client port and IPv4 address", // the decoder's specification
      status: "active", // current, updated by RFC 5991
    },
    {
      id: "rfc5991", // Teredo flags update
      label: "RFC 5991 - Teredo Security Updates", // September 2010
      type: "rfc", // IETF RFC
      url: "https://www.rfc-editor.org/rfc/rfc5991", // canonical RFC URL
      access_date: "2026-10-19", // downloaded 2026-10-19
      scope: "section 3.1: the Flags field |C|z|Random1|U|G|Random2|; section 3.2: cone bit deprecated", // how the flags are read
      status: "active", // current
    },
    {
      id: "rfc5952",
      label: "RFC 5952 - A Recommendation for IPv6 Address Text Representation",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc5952",
      access_date: "2026-06-27",
      scope: "canonical compression rules + mixed IPv4-mapped notation",
      status: "active",
    },
    {
      id: "rfc4193",
      label: "RFC 4193 - Unique Local IPv6 Unicast Addresses",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc4193",
      access_date: "2026-06-27",
      scope: "the fc00::/7 unique-local classification",
      status: "active",
    },
    {
      id: "rfc3849",
      label: "RFC 3849 - IPv6 Address Prefix Reserved for Documentation",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc3849",
      access_date: "2026-06-27",
      scope: "the 2001:db8::/32 documentation classification",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Deterministic decode only; throws an
 * Ipv6DecodeError on malformed input (the UI catches and localizes it).
 * @param input an IPv6 address or prefix
 * @returns the decoded structure
 */
export function run(input: string): DecodedIpv6 {
  return decodeIpv6(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = IPV6_GOLDEN_VECTORS;
export const rejectVectors = IPV6_REJECT_VECTORS;
