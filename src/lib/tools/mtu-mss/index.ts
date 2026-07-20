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
  dangerousInputHandling: ["redos-guard"], // anchored linear parser
  shareSafetyDefault: "param", // an MTU and a token list are non-sensitive

  // -- Teaching & provenance --
  learnLinks: ["learn/jumbo-frames"],
  sources: [
    {
      id: "rfc-header-sizes",
      label:
        "IETF RFCs - fixed header sizes: IPv4 20 (RFC 791), IPv6 40 (RFC 8200), TCP 20 (RFC 9293), UDP 8 (RFC 768), 802.1Q tag 4, MPLS label 4 (RFC 3032), PPPoE 8 (RFC 2516), GRE base 4 (RFC 2784), IP-in-IP (RFC 2003) and 6in4 (RFC 4213) outer-IP-only, VXLAN 8 (RFC 7348), GENEVE base 8 + options (RFC 8926)",
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
