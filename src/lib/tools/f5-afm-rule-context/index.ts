// ============================================================================
// src/lib/tools/f5-afm-rule-context/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING AFM RULE-CONTEXT EXPLAINER - {manifest, run, vectors}.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, AFM_VECTORS } from "./golden-vectors";

export { run } from "./compute";
export type { AfmResult, WalkStep, FwRule, RuleFinding, FwAction, ContextKind, ToolRunResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, AFM_VECTORS, verifyVectors } from "./golden-vectors";
export type { AfmVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "F5 GTM, AFM & APM",
  toolSlug: "f5-afm-rule-context",
  canonicalAliases: ["afm-rule-context", "afm-context-walk", "network-firewall-contexts"],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*security\\s+firewall\\s+(policy|rule-list)\\b", priority: 8, example: "security firewall policy P { rules { r1 { action drop } } }" },
    { kind: "regex", pattern: "\\baccept-decisively\\b|^\\s*context\\s+(global|route-domain|virtual|self-ip)\\b", priority: 7, example: "context global { policy P }" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "honest-indeterminate-stop"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/bigip-afm-contexts-and-rule-processing"],
  relatedTools: ["f5-packet-filter-explainer", "f5-dos-vector-explainer"],
  sources: [
    { id: "afm-policies-14-1", label: "BIG-IP Network Firewall: Policies and Implementations 14.1 - Policies and Rules (the context processing order: global, route domain, then virtual server/self IP; management port separate; action-applied-then-processed-again-at-the-next-context; staging semantics; rule lists)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip-afm/manuals/product/big-ip-network-firewall-policies-and-implementations-14-1-0/05.html", access_date: "2026-07-03", scope: "the walk order, accept-continues semantics, staging, and rule-list handling", status: "active" },
    { id: "afm-rules-13-1", label: "BIG-IP Network Firewall: Policies and Implementations - Firewall Rules and Rule Lists (the four actions; the Redundant and Conflicting rule states, including accept vs accept-decisively counting as conflicting)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip-afm/manuals/product/network-firewall-policies-implementations-13-1-0/2.html", access_date: "2026-07-03", scope: "the audit mode's conflict and redundancy findings", status: "active" },
    { id: "afm-policy-config-14-1", label: "BIG-IP Network Firewall 14.1 - Applying Policies (the ICMP restriction verbatim: ICMP/ICMPv6 rules cannot be created on a self IP or virtual server context, and one arriving via a rule list will be ignored; management port takes inline rules only)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip-afm/manuals/product/big-ip-network-firewall-policies-and-implementations-14-1-0/06.html", access_date: "2026-07-03", scope: "the ICMP-ignored enforcement at edge contexts", status: "active" },
    { id: "devcentral-afm-intro", label: "F5 DevCentral: Introduction to BIG-IP Advanced Firewall Manager (accept-decisively: the packet is permitted and no further context processing is performed; reject sends a TCP RST or an ICMP unreachable)", type: "vendor-community", url: "https://community.f5.com/kb/technicalarticles/introduction-to-f5-big-ip-advanced-firewall-manager-afm/341719", access_date: "2026-07-03", scope: "the terminal-action semantics on every walk", status: "active" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = AFM_VECTORS;
