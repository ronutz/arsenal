// ============================================================================
// src/lib/tools/ipv6/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING IPv6 MODULE - a netcore {manifest, run, vectors} triple.
//
// Mirrors the cidr / x509 reference modules so it can be promoted into
// @ronutz/netcore unchanged (copy the folder into netcore/src/tools/ipv6, add
// it to the package exports + registry, cut a minor bump). It is the IPv6
// counterpart to the IPv4-oriented cidr tool.
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
  Ipv6DecodeErrorCode,
} from "./compute";
export { Ipv6DecodeError } from "./compute";

/** The D-49 declarative manifest for the IPv6 tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & IP",
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
      access_date: "2026-06-27",
      scope: "text representation, address types/scopes, EUI-64 (Appendix A)",
      status: "active",
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
  license: { code: "Apache-2.0", content: "CC-BY-4.0" },
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
