// ============================================================================
// src/lib/tools/f5-packet-filter-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING PACKET-FILTER EXPLAINER - {manifest, run, vectors}.
// Ordered first-match walk with the man page's own semantics, shadow
// detection, the always-on context (trusted precedence, master switch,
// exemptions, established-connections default, management exclusion), and
// an honest three-state BPF-subset simulator.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, PF_VECTORS } from "./golden-vectors";

export { run, parseRules, evalExpression, parsePacket } from "./compute";
export type { PacketFilterResult, PfRule, PfAction, SimStep, SimVerdict, PacketDescriptor, ToolRunResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, PF_VECTORS, verifyVectors } from "./golden-vectors";
export type { PfVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-packet-filter-explainer",
  canonicalAliases: ["packet-filter-explainer", "bigip-packet-filters", "pf-walk"],
  inputDetectors: [
    { kind: "regex", pattern: "net\\s+packet-filter\\s+\\S+\\s*\\{", priority: 8, example: "net packet-filter spoof_blocker { order 5 ... }" },
    { kind: "regex", pattern: "^\\s*sim:\\s*(tcp|udp|icmp|arp)\\b", priority: 6, example: "sim: tcp src 10.0.0.5 dst 172.19.254.80 dport 443" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "config-not-executed", "control-defeat-review-d53: explains and simulates the operator's own filter walk; grants no capability against third-party controls"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/bigip-packet-filters"],
  relatedTools: ["f5-bigip-tcpdump-builder", "f5-tmsh-config-explainer"],
  sources: [
    { id: "tmsh-net-packet-filter", label: "F5 TMSH Reference v17: net packet-filter (four mandatory attributes; order semantics with the worked 500/100/300/200/201 sequence; uniqueness; terminal vs continue; empty rule matches ALL; the three official examples; management interface unaffected)", type: "vendor-docs", url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/net/net_packet-filter.html", access_date: "2026-07-03", scope: "the parser's field set, every walk semantic, the example payload", status: "active" },
    { id: "routing-admin-packet-filters", label: "BIG-IP TMOS Routing Administration 11.6, chapter 6: Packet Filters (global Properties and Exemptions; master switch disabled by default and off-allows-all; Unhandled Packet Action; Filter Established Connections default off; ICMP reject shape; ARP and important-ICMP exemptions; incoming-only; unrelated to iRules)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/tmos-routing-administration-11-6-0/6.html", access_date: "2026-07-03", scope: "every context note the walk carries", status: "active" },
    { id: "tmsh-net-packet-filter-trusted", label: "F5 TMSH Reference v16: net packet-filter-trusted (trusted traffic processes before rule list evaluation, impossible to override with a packet filter rule)", type: "vendor-docs", url: "https://clouddocs.f5.com/cli/tmsh-reference/v16/modules/net/net_packet-filter-trusted.html", access_date: "2026-07-03", scope: "the trusted-precedence context note", status: "active" },
    { id: "pcap-filter-7", label: "pcap-filter(7), the tcpdump project (the BPF expression grammar the rule attribute is written in)", type: "reference", url: "https://www.tcpdump.org/manpages/pcap-filter.7.html", access_date: "2026-07-03", scope: "the simulator's evaluated subset and its honesty boundary", status: "active" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = PF_VECTORS;
