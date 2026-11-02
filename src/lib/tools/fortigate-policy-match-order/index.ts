// ============================================================================
// The {manifest, run, vectors} triple for the FortiGate policy match-order
// explainer. Deterministic and offline: it reasons about the list you give it.
// ============================================================================

export { analysePolicies, run, PolicyInputError } from "./compute";
export type { Policy, Packet, PolicyAnalysis, MatchStep, ShadowFinding } from "./compute";
export { verifyVectors, POLICY_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { PolicyVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "fortigate-policy-match-order",
  // This manifest had no dangerousInputHandling key; it gains one for Share results.
  dangerousInputHandling: ["share-input-caution"], // Share results (2026-11-01): a link only when pressed, the policies and the packet line as pasted after a caution line of the tool's own; a field in which the FortiOS check finds a credential gets no link
  learnLinks: [
    "learn/fortigate-policy-order",
    "learn/fortigate-debug-flow",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "fortios-policy", label: "Fortinet - Firewall policy (FortiOS administration guide)", url: "https://docs.fortinet.com/document/fortigate/7.4.2/administration-guide/656084/firewall-policy" }),
    Object.freeze({ id: "fortios-ngfw", label: "Fortinet community - NGFW policy-based mode resource list", url: "https://community.fortinet.com/fortigate-3/technical-tip-ngfw-policy-based-mode-resource-list-215790" }),
  ]),
});
