// ============================================================================
// src/lib/tools/fortigate-ipsec-phase-mismatch-analyzer/index.ts
// ----------------------------------------------------------------------------
// FORTIGATE IPSEC PHASE MISMATCH ANALYZER.
// A {manifest, run, vectors} triple. Describe both peers and get the
// disagreement named, and — the part that matters — WHICH PHASE would fail,
// because phase 1 and phase 2 fail for different reasons and send you down
// different diagnostic paths.
//
// Pure and deterministic (D-49). Never contacts a device, never fetches.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, analyze, parsePeers } from "./compute";
export type {
  Peer, PeerPhase1, PeerPhase2, Issue, IpsecResult, Phase, Severity, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { IpsecVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Fortinet FortiGate & FortiOS",
  toolSlug: "fortigate-ipsec-phase-mismatch-analyzer",
  canonicalAliases: [
    "ipsec-mismatch",
    "ipsec-phase1-phase2",
    "fortigate-vpn-mismatch",
    "ike-proposal-mismatch",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*phase1\\s*:\\s*", priority: 9,
      example: "phase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk" },
    { kind: "regex", pattern: "^\\s*peer\\s*:\\s*name\\s*=", priority: 8,
      example: "peer: name=SiteA" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  // Peer names and subnets describe topology.
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/fortigate-ipsec-vpn-topologies"],
  sources: [
    { id: "fgt-ipsec-concepts", label: "Fortinet FortiGate Administration Guide: IPsec VPN concepts (phase 1 and phase 2, proposals, PFS, selectors)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/565968/ipsec-vpn-concepts" },
    { id: "fgt-ipsec-tshoot", label: "Fortinet FortiGate Administration Guide: IPsec VPN troubleshooting (which phase failed and why)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/565655/troubleshooting" },
  ],
});

export { run as runTool };
export const __selftest = verifyVectors;
