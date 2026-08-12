// ============================================================================
// src/lib/tools/cidr/index.ts
// ----------------------------------------------------------------------------
// Public surface of the arsenal-local CIDR compute. Every mode is in-house now,
// including single-subnet analysis (cidrAnalyze) — arsenal no longer imports
// an external engine. The logic stays pure and liftable into an open library later.
// ============================================================================

export {
  CidrInputError,
  ipToInt,
  intToIp,
  maskForPrefix,
  prefixSize,
  parseCidr,
  parseCidrList,
  cidrAnalyze,
  allocateVlsm,
  aggregate,
  analyzeOverlapGap,
} from "./compute";

export type {
  ParsedCidr,
  SubnetAnalysis,
  VlsmRequirement,
  VlsmSubnet,
  VlsmResult,
  CidrBlock,
  AggregateResult,
  OverlapKind,
  OverlapPair,
  OverlapGapResult,
} from "./compute";

export { GOLDEN_VECTOR_SET_ID, verifyVectors } from "./golden-vectors";
export type { VerifyReport } from "./golden-vectors";

/**
 * The CIDR tool manifest. `sources` are surfaced on the tool page as the
 * reference links; brought in-house when arsenal stopped importing the
 * external engine.
 */
export const manifest = Object.freeze({
  toolSlug: "cidr",
  /** The Learn article written for this tool. Added 2026-08-12: this manifest
   *  had no learnLinks key at all, so the tool page offered no route back into
   *  the explanation. The link is the tool's OWN article, which is guaranteed
   *  to exist (check-tool-articles enforces it) rather than a judgement call. */
  learnLinks: [
    "learn/bgp-primer",
    "learn/bigip-interfaces-trunks-vlans-selfips",
    "learn/bigip-route-domains",
    "learn/cidr-notation",
    "learn/f5-ca-vs-retired-101-201",
    "learn/fortigate-firewall-policy-and-nat",
    "learn/fortigate-routing-and-sdwan-selection",
    "learn/ipv4-addressing",
    "learn/isis-primer",
    "learn/mpls-primer",
    "learn/nat-explained",
    "learn/ospf-primer",
    "learn/private-address-space",
    "learn/route-summarization",
    "learn/routing-tables-and-default-gateway",
    "learn/subnet-overlap-and-gaps",
    "learn/subnetting-basics",
    "learn/supernetting-and-aggregation",
    "learn/vlsm",
    "learn/vlsm-worked-example",
  ],
  sources: [
    { id: "rfc4632", label: "RFC 4632 — Classless Inter-domain Routing (CIDR)", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc4632", access_date: "2026-06-29", scope: "CIDR prefix arithmetic", status: "active" },
    { id: "rfc1918", label: "RFC 1918 — Address Allocation for Private Internets", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc1918", access_date: "2026-06-29", scope: "private-range classification", status: "active" },
    { id: "rfc3021", label: "RFC 3021 — Using 31-Bit Prefixes on IPv4 Point-to-Point Links", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3021", access_date: "2026-06-29", scope: "/31 host counting", status: "active" },
    { id: "rfc6890", label: "RFC 6890 — Special-Purpose IP Address Registries", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc6890", access_date: "2026-06-29", scope: "special-use classification", status: "active" },
  ],
});
