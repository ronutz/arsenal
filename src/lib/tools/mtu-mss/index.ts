// ============================================================================
// src/lib/tools/mtu-mss/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the MTU / MSS calculator.
// ============================================================================

import { run, type MtuCalcResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  MTU_MSS_GOLDEN_VECTORS,
  MTU_MSS_REJECT_VECTORS,
} from "./golden-vectors";

export { run, MtuCalcError } from "./compute";
export type {
  MtuCalcResult,
  MtuCalcErrorCode,
  StackLayer,
  LayerKind,
  FrameNumbers,
  EfficiencyRow,
  UnderlayNumbers,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  MTU_MSS_GOLDEN_VECTORS,
  MTU_MSS_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the MTU / MSS calculator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "TLS & transport",
  toolSlug: "mtu-mss",
  canonicalAliases: [
    "mtu calculator",
    "mss calculator",
    "jumbo frames",
    "tunnel overhead",
    "vxlan mtu",
    "mss clamping",
  ],
  inputDetectors: [
    {
      // An MTU-looking number followed by at least one known stack token.
      // Anchored, one alternation group, single quantifier - linear, no
      // backtracking (ReDoS-safe). A bare number is far too ambiguous for the
      // OMNIBOX, so plain "1500" deliberately does not route here.
      kind: "regex",
      pattern:
        "^\\s*\\d{3,5}(\\s+(v6|ipv6|pppoe|gre|ipip|6in4|sit|vxlan|geneve|wireguard|wg|vlan|dot1q|qinq|mpls\\d?|\\+\\d{1,4}))+\\s*$",
      priority: 7,
      example: "1500 vxlan",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // fixed RFC header arithmetic; no network, no clock
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard", "share-input"], // anchored linear parser; Share results (2026-10-27): a link only when pressed, the line as typed
  shareSafetyDefault: "param", // an MTU and a token list are non-sensitive

  // -- Teaching & provenance --
  // mpls-primer states the RFC 3032 label rule this engine follows since
  // 2026-10-19; icmp-ping-and-traceroute covers Fragmentation Needed / PTB.
  learnLinks: ["learn/jumbo-frames", "learn/mpls-primer", "learn/icmp-ping-and-traceroute"], // last two added 2026-10-19
  sources: [
    {
      id: "rfc-header-sizes",
      label:
        // "MPLS label 4" reworded 2026-10-19: the entry sits inside the frame payload (see rfc3032-mpls-mtu below)
        "IETF RFCs - fixed header sizes: IPv4 20 (RFC 791), IPv6 40 (RFC 8200), TCP 20 (RFC 9293), UDP 8 (RFC 768), 802.1Q tag 4, MPLS label stack entry 4 (RFC 3032), PPPoE 8 (RFC 2516), GRE base 4 (RFC 2784), IP-in-IP (RFC 2003) and 6in4 (RFC 4213) outer-IP-only, VXLAN 8 (RFC 7348), GENEVE base 8 + options (RFC 8926)",
      type: "standard",
      url: "https://www.rfc-editor.org/",
      access_date: "2026-07-20",
      scope:
        "every constant in the overhead table; the derived classics (GRE on 1500 -> 1476; VXLAN -> 1450 inner / 1550 underlay; PPPoE -> 1492) follow arithmetically",
      status: "active",
    },
    {
      id: "overhead-cross-check",
      label:
        "Independent cross-checks - tunnel-overhead write-ups and calculators agreeing on GRE 24, VXLAN 50 (IPv4) / 70 (IPv6), PPPoE 8, WireGuard 60 (IPv4) / 80 (IPv6), and IPsec ESP as inherently variable (mode, cipher, IV, padding, ICV, NAT-T)",
      type: "reference",
      url: "https://packetpushers.net/blog/vxlan-udp-ip-ethernet-bandwidth-overheads/",
      access_date: "2026-07-20",
      scope:
        "cross-verification of the composite overheads and of the decision to model IPsec via the +N custom token rather than invent one number",
      status: "active",
    },
    // -- Added 2026-10-19 (PRIME's correction of the MPLS rule, and the PMTUD paragraph) --
    {
      id: "rfc3032-mpls-mtu", // the rule behind kind "label" in ./compute.ts
      label: "RFC 3032, MPLS Label Stack Encoding, January 2001: sections 2.1, 3, 3.1, 3.2 and 3.4", // sections cited by the engine and the docs
      type: "standard", // IETF Standards Track
      url: "https://www.rfc-editor.org/rfc/rfc3032.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read the day the engine was corrected
      scope:
        "each label stack entry is 4 octets and is counted in the Frame Payload with the IP datagram, 802.1Q headers excluded: one label on a 1500-byte payload leaves 1496 for IP, a full 1500-byte IP packet needs a 1504-byte payload, 1488 fits three labels; a too-big labelled IPv4 datagram with DF set is not forwarded and the ICMP Next-Hop MTU is the payload minus the label bytes", // what this source pins
      status: "active", // current RFC (updated, not obsoleted)
    },
    {
      id: "rfc1191-pmtud", // IPv4 Path MTU Discovery
      label: "RFC 1191, Path MTU Discovery, November 1990: sections 2 and 4", // Fragmentation Needed and the Next-Hop MTU field
      type: "standard", // IETF Draft Standard
      url: "https://www.rfc-editor.org/rfc/rfc1191.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read for the PMTUD paragraph of the tool docs
      scope: "DF-set probing, ICMP Destination Unreachable 'fragmentation needed and DF set', and the router's MUST to report the next-hop MTU", // what this source pins
      status: "active", // current RFC
    },
    {
      id: "rfc8201-pmtud-v6", // IPv6 Path MTU Discovery
      label: "RFC 8201, Path MTU Discovery for IP version 6, July 2017: section 1", // Packet Too Big and black-hole connections
      type: "standard", // IETF Internet Standard (STD 87)
      url: "https://www.rfc-editor.org/rfc/rfc8201.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read for the PMTUD paragraph of the tool docs
      scope: "PMTUD relies on ICMPv6 Packet Too Big; blocked ICMPv6 gives black-hole connections that complete the handshake and hang on data", // what this source pins
      status: "active", // current RFC
    },
    {
      id: "rfc2923-black-hole", // the PMTUD black hole, named
      label: "RFC 2923, TCP Problems with Path MTU Discovery, September 2000: section 2.1", // Black Hole Detection
      type: "rfc", // IETF Informational RFC, not a standard
      url: "https://www.rfc-editor.org/rfc/rfc2923.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read for the PMTUD paragraph of the tool docs
      scope: "firewalls that suppress ICMP make PMTUD fail; pings and interactive sessions work while bulk transfers hang; black holes should be fixed when found", // what this source pins
      status: "active", // current RFC
    },
    {
      id: "rfc4459-mss-clamping", // MSS clamping as the workaround
      label: "RFC 4459, MTU and Fragmentation Issues with In-the-Network Tunneling, April 2006: section 3.2", // MSS clamping
      type: "rfc", // IETF Informational RFC, not a standard
      url: "https://www.rfc-editor.org/rfc/rfc4459.txt", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read for the PMTUD paragraph of the tool docs
      scope: "MSS clamping by tunnel endpoints: TCP only, no help for UDP, assumes all traffic crosses the clamping endpoints; IPv4 PMTUD unreliable where firewalls drop all ICMP", // what this source pins
      status: "active", // current RFC
    },
    {
      id: "iptables-tcpmss", // a concrete clamping implementation
      label: "iptables-extensions(8), iptables 1.8.13, Linux manual page: TCPMSS target", // man7.org copy
      type: "reference", // project manual page
      url: "https://man7.org/linux/man-pages/man8/iptables-extensions.8.html", // fetched 2026-10-19, HTTP 200
      access_date: "2026-10-19", // read for the PMTUD paragraph of the tool docs
      scope: "TCPMSS rewrites the MSS of TCP SYN packets, usually to interface MTU minus 40 (IPv4) or 60 (IPv6), to work around blocked 'ICMP Fragmentation Needed' / 'ICMPv6 Packet Too Big'", // what this source pins
      status: "active", // current manual page
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * runTool - the registry-facing entry point.
 * @param input a link MTU plus optional stack tokens, e.g. "1500 vxlan vlan"
 * @returns the resolved stack, inner MTU/MSS, frame numbers, efficiency, underlay
 */
export function runTool(input: string): MtuCalcResult {
  return run(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = MTU_MSS_GOLDEN_VECTORS;
export const rejectVectors = MTU_MSS_REJECT_VECTORS;
