// ============================================================================
// src/lib/tools/zscaler-tunnel-chooser/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING ZSCALER TUNNEL CHOOSER - the {manifest, run, vectors}
// triple. Answer six questions about a location (bandwidth, HA, static IP,
// encryption mandate, GRE support, internal-endpoint NAT) and get the
// deterministic tunnel-type recommendation with the MINIMUM tunnel count,
// computed from Zscaler's own published per-tunnel figures - each step of
// the elimination shown, every figure sourced. Bounded, evaluates nothing,
// contacts nothing.
//
// The first native tool of the Zscaler program (PKG-ZSCALER-content-program
// v2, wave 1); it computes the ZDTA-A.09 scenario directly.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, TUNNEL_VECTORS } from "./golden-vectors";

export { run, choose, GRE_MBPS, GRE_NATED_MBPS, IPSEC_MBPS_PER_SOURCE_IP } from "./compute";
export type { ChooserInput, ChooserResult, Step } from "./compute";
export { GOLDEN_VECTOR_SET_ID, TUNNEL_VECTORS, verifyVectors } from "./golden-vectors";
export type { TunnelVector } from "./golden-vectors";

/** The D-49 declarative manifest for the zscaler-tunnel-chooser tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Zscaler Zero Trust Exchange",
  toolSlug: "zscaler-tunnel-chooser",
  canonicalAliases: ["zia-tunnel-chooser", "gre-vs-ipsec", "zscaler-forwarding-chooser", "location-tunnel-sizing"],
  inputDetectors: [] as { kind: string; pattern: string; priority: number; example: string }[],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["numeric-bounds"],
  shareSafetyDefault: "open", // six anonymous answers; nothing identifies infrastructure

  // -- Teaching & provenance --
  learnLinks: [
    "learn/gre-tunnels-fundamentals",
    "learn/ipsec-and-ike-fundamentals",
    "learn/tunnel-overhead-mtu-and-mss",
  ],
  sources: [
    {
      id: "zs-understanding-gre",
      label: "Zscaler Help: Understanding Generic Routing Encapsulation (GRE)",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zia/understanding-generic-routing-encapsulation-gre",
      access_date: "2026-07-21",
      scope: "1 Gbps per GRE tunnel; 250 Mbps when internal tunnel endpoints are source-NATed (inner-address load-balancing rationale); scale-out via additional tunnels with different public source IPs (2 Gbps = 2 primaries + 2 backups; 3 Gbps = 3 + 3)",
      status: "active",
    },
    {
      id: "zs-ipsec-configure",
      label: "Zscaler Help: Configuring an IPSec VPN Tunnel",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zia/configuring-ipsec-vpn-tunnel",
      access_date: "2026-07-21",
      scope: "400 Mbps per public source IP; scale-out via different public source IPs or same-IP NAT-T + source-port randomization under IKEv2 (800 Mbps = 2 + 2; 1200 Mbps = 3 + 3); primary/secondary to Public Service Edges in different data centers; DPD",
      status: "active",
    },
    {
      id: "zs-choosing-forwarding",
      label: "Zscaler Help: Choosing Traffic Forwarding Methods",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zia/choosing-traffic-forwarding-methods",
      access_date: "2026-07-21",
      scope: "GRE preconditions (static egress IP, GRE-capable device); IPsec as the documented alternative for dynamic IPs or devices without GRE; MTU field guidance (min of appliance and path MTU; 1400 fallback)",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = TUNNEL_VECTORS;
