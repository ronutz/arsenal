// ============================================================================
// src/lib/tools/zcc-forwarding-decision-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING ZCC FORWARDING DECISION EXPLAINER - the {manifest,
// run, vectors} triple, shipped in the DESCOPED form the ratified clause
// specifies (PKG-ZSCALER v1 §3 T4; PRIME-authorized verification pass
// 2026-07-21). The documented spine - trusted-network determination, the
// three network states, ZIA's four actions and ZPA's two, Z-Tunnel 1.0 vs
// 2.0 with the automatic failover and hybrid web-split - is walked
// deterministically. The bypass layer is rendered as an explained ledger,
// with the why-explainer-not-simulator statement as first-class output:
// the mechanisms are documented individually, their cross-mechanism
// precedence is not, and this tool invents nothing. Bounded, evaluates
// nothing, contacts nothing.
//
// Fifth native tool of the Zscaler program; paired article:
// learn/zscaler-client-connector-profiles.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, ZCC_FDE_VECTORS } from "./golden-vectors";

export { run, parseSettings } from "./compute";
export type { NetworkState, ZiaAction, TunnelVersion, ExplainerInput, DecisionStep, ExplainerResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, ZCC_FDE_VECTORS, verifyVectors } from "./golden-vectors";
export type { ZccFdeVector } from "./golden-vectors";

/** The D-49 declarative manifest for the zcc-forwarding-decision-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Zscaler Zero Trust Exchange",
  toolSlug: "zcc-forwarding-decision-explainer",
  canonicalAliases: [
    "zcc-explainer",
    "forwarding-decision-explainer",
    "client-connector-forwarding-explainer",
    "z-tunnel-explainer",
  ],
  inputDetectors: [
    {
      kind: "regex",
      // The tool's own setting grammar: "network = ..." / "zia-action = ...".
      pattern: "^(network|zia-action|zpa-action|tunnel|web-split)\\s*=\\s*[a-z0-9-]+",
      priority: 6,
      example: "network = off-trusted",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["line-anchored-errors", "duplicate-detection", "documented-scope-validation"],
  shareSafetyDefault: "fragment", // a pasted posture can describe an organization's forwarding design

  // -- Teaching & provenance --
  learnLinks: [
    "learn/zscaler-client-connector-profiles",
    "learn/how-a-pac-file-chooses-a-proxy",
  ],
  sources: [
    {
      id: "zs-zcc-reference-architecture",
      label: "Zscaler Reference Architecture: Secure Mobile Access with Zscaler Client Connector",
      type: "vendor-docs",
      url: "https://www.zscaler.com/resources/reference-architectures/secure-mobile-access-with-zcc.pdf",
      access_date: "2026-07-21",
      scope: "the three network states and per-state actions (ZIA: Tunnel, Tunnel with Local Proxy, Enforce Proxy, None; ZPA: Tunnel, None); the trusted-network criteria set with ANY/ALL matching and Pre-Defined exclusivity; Z-Tunnel 1.0 as web-only 80/443 HTTP proxy tunnel vs Z-Tunnel 2.0 as all-ports DTLS/TLS; the automatic ZT2-to-ZT1 failover; the hybrid web-split (listening proxy); the Z-Tunnel 2.0 bypass/inclusion lists; VPN Gateway Bypass; fail-open/fail-close overlays; the recommendation table",
      status: "active",
    },
    {
      id: "zs-about-z-tunnels",
      label: "Zscaler Help: About Z-Tunnel 1.0 & Z-Tunnel 2.0",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zscaler-client-connector/about-z-tunnel-1.0-z-tunnel-2.0",
      access_date: "2026-07-21",
      scope: "the two tunnel versions' documented transport and capture scope",
      status: "active",
    },
    {
      id: "zs-zt2-bypass-best-practices",
      label: "Zscaler Help: Best Practices for Adding Bypasses for Z-Tunnel 2.0",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zscaler-client-connector/best-practices-adding-bypasses-z-tunnel-2.0",
      access_date: "2026-07-21",
      scope: "the documented division of labor between the forwarding-profile PAC (the Z-Tunnel 2.0 bypass macro releasing traffic to the Z-Tunnel 1.0 listener path) and the app-profile PAC (DIRECT bypasses on the system-proxy path); network bypasses via VPN gateway bypass or destination exclusions on Z-Tunnel 2.0",
      status: "active",
    },
    {
      id: "zs-configuring-forwarding-profiles",
      label: "Zscaler Help: Configuring Forwarding Profiles for Zscaler Client Connector",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zscaler-client-connector/configuring-forwarding-profiles-zscaler-client-connector",
      access_date: "2026-07-21",
      scope: "the forwarding-profile object: per-state actions, tunnel driver types, tunnel version selection",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = ZCC_FDE_VECTORS;
