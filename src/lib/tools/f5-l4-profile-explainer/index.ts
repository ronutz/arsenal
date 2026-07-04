// ============================================================================
// src/lib/tools/f5-l4-profile-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING L4 PROTOCOL PROFILE EXPLAINER - {manifest, run, vectors}.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, L4_VECTORS } from "./golden-vectors";

export { run, PROFILES } from "./compute";
export type { L4ProfileResult, L4Profile, ProfileFamily, ToolRunResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, L4_VECTORS, verifyVectors } from "./golden-vectors";
export type { L4Vector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-l4-profile-explainer",
  canonicalAliases: ["l4-profile-explainer", "tcp-profile-explainer", "fastl4-explainer", "fasthttp-explainer"],
  inputDetectors: [
    { kind: "regex", pattern: "\\b(fastl4|fast-l4|fasthttp|f5-tcp-(progressive|lan|wan|mobile)|tcp-(lan|wan|mobile)-optimized)\\b", priority: 6, example: "fastl4" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["reference-only"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/bigip-l4-protocol-profiles"],
  relatedTools: ["f5-irules-event-order", "f5-oneconnect-source-mask"],
  sources: [
    { id: "devcentral-living-tcp", label: "F5 DevCentral: F5 Unveils New Built-In TCP Profiles (the 13.0 announcement, verbatim: f5-tcp-wan/lan/mobile as updated versions of the -optimized trio; f5-tcp-progressive as the general-use latest-features profile; the living contract, immediate landing in progressive and a couple of releases later elsewhere; the five read-only profiles and the child-profile custom-flag discipline; the benchmark criteria)", type: "vendor-community", url: "https://community.f5.com/kb/technicalarticles/f5-unveils-new-built-in-tcp-profiles/290729", access_date: "2026-07-03", scope: "the living-vs-legacy story on the tcp-family cards", status: "active" },
    { id: "ltm-profiles-protocol-13-1", label: "BIG-IP LTM Profiles Reference 13.1 - Protocol Profiles (FastL4's purpose: PVA hardware processing some or all Layer 4 traffic, the virtual-server pairings, dynamic ePVA offload; FastHTTP's composition from TCP Express, HTTP, and OneConnect, its full when-to-use criteria list, and the Connection-header reuse benefit; the tcp-family descriptions and the mobile under-1-MB sizing note)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/ltm-profiles-reference-13-1-0/5.html", access_date: "2026-07-03", scope: "the FastL4 and FastHTTP cards' stories and criteria", status: "active" },
    { id: "ltm-profiles-protocol-21-0", label: "BIG-IP LTM Profiles Reference 21.0 - Protocol Profiles (both TCP families, legacy and living, still shipping side by side)", type: "vendor-docs", url: "https://techdocs.f5.com/en-us/bigip-21-0-0/big-ip-local-traffic-management-profiles-reference/protocol-profiles.html", access_date: "2026-07-03", scope: "currency of the legacy trio", status: "active" },
    { id: "tmsh-fastl4-man", label: "tmsh ltm profile fastl4 man page v13 (option semantics with defaults: loose-initialization accepting any TCP packet rather than requiring a SYN and loose-close on the first FIN, both default disabled; pva-acceleration full/none/partial/dedicated; pva-offload-dynamic and -state; tcp-timestamp-mode and tcp-wscale-mode defaulting to preserve; mss-override; late-binding with the FIX-profile requirement)", type: "vendor-docs", url: "https://clouddocs.f5.com/cli/tmsh-reference/v13/modules/ltm/ltm_profile_fastl4.html", access_date: "2026-07-03", scope: "the FastL4 card's option quirks", status: "active" },
    { id: "k93100324-vs-guide", label: "K93100324: BIG-IP LTM operations guide, virtual servers chapter (Performance (Layer 4) recommended when little or no L4/L7 processing is required, minimal L7 information limiting load-balancing scope, ePVA offload; Performance (HTTP) with FastHTTP, possibly the fastest way under certain circumstances with specific requirements and limitations, K8024 as required reading; Forwarding (IP) needing FastL4 options; translation disabled when steering to inspection devices)", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K93100324", access_date: "2026-07-03", scope: "the when-clauses and virtual-server pairings on both accelerated cards", status: "active" },
    { id: "k8024", label: "K8024: Overview of the Fast HTTP profile (the canonical requirements-and-limitations K article the operations guide points to; cited by number, my.f5 renders client-side)", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K8024", access_date: "2026-07-03", scope: "named as required pre-deployment reading on the FastHTTP card", status: "active" },
    { id: "k09948701", label: "K09948701: Overview of the FastL4 profile (the canonical FastL4 overview K article; cited by number, my.f5 renders client-side)", type: "vendor-kb", url: "https://my.f5.com/manage/s/article/K09948701", access_date: "2026-07-03", scope: "companion overview for the FastL4 card", status: "active" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = L4_VECTORS;
