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
  classifySpecialPurpose, // special-purpose classification of one block (2026-10-19)
  SPECIAL_PURPOSE_REGISTRY, // the registry rows it classifies against, read 2026-10-19
  runCidrApi, // the HTTP API entry point: a bare block or a JSON request naming one of the four modes (2026-10-19)
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
  VlsmOptions, // the RFC 3021 /31 option of the VLSM mode (2026-10-19)
  SpecialPurposeRegistry, // which registry a special-purpose row comes from (2026-10-19)
  SpecialPurposeEntry, // one registry row (2026-10-19)
  SpecialRelation, // equal / inside / contains (2026-10-19)
  SpecialPurposeMatch, // one row the block falls in or overlaps (2026-10-19)
  SpecialPurposeClassification, // the classification result (2026-10-19)
  CidrApiMode, // the four API modes (2026-10-19)
  CidrApiResult, // what the API entry point returns, by mode (2026-10-19)
  CidrApiSubnetResult, // the Subnet mode's API result (2026-10-19)
  CidrApiVlsmResult, // the VLSM mode's API result (2026-10-19)
  CidrApiSupernetResult, // the Supernet mode's API result (2026-10-19)
  CidrApiOverlapResult, // the Overlap / gap mode's API result (2026-10-19)
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
  /** Input detectors (added 2026-10-06 with the paste box of Round 1's E3, which runs every manifest's
   *  detectors; this one had none, so the commonest input on the site, an IPv4 prefix, matched nothing).
   *  Priority 0: a dotted quad with a prefix length is unmistakably this tool's; a bare dotted quad at 20,
   *  because other tools (the OUI lookup, the IPv6 tool) have claims on address-shaped text. */
  inputDetectors: [
    { kind: "regex", priority: 0, pattern: "^\\s*(25[0-5]|2[0-4]\\d|1?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|1?\\d?\\d)){3}\\s*/\\s*(3[0-2]|[12]?\\d)\\s*$", example: "10.0.0.0/22" },
    { kind: "regex", priority: 20, pattern: "^\\s*(25[0-5]|2[0-4]\\d|1?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|1?\\d?\\d)){3}\\s*$", example: "192.168.10.37" },
  ],
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
    // learn/mpls-primer removed 2026-10-19 (PRIME's decision 4): it shows nothing this tool computes.
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
  // Sources re-read 2026-10-19 (downloaded that day with curl, no-cache), with what each one backs in the engine.
  sources: [
    { id: "rfc4632", label: "RFC 4632 - Classless Inter-domain Routing (CIDR)", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc4632", access_date: "2026-10-19", scope: "CIDR prefix arithmetic", status: "active" }, // prefix arithmetic
    { id: "rfc1122", label: "RFC 1122 - Requirements for Internet Hosts - Communication Layers, section 3.2.1.3", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc1122", access_date: "2026-10-19", scope: "the network and directed-broadcast addresses a /0 to /30 block reserves; the loopback and this-host rows", status: "active" }, // reserved addresses
    { id: "rfc3021", label: "RFC 3021 - Using 31-Bit Prefixes on IPv4 Point-to-Point Links", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3021", access_date: "2026-10-19", scope: "/31 host counting in Subnet mode and the optional /31 for 2-host VLSM requests", status: "active" }, // /31
    { id: "iana-ipv4-special", label: "IANA - IPv4 Special-Purpose Address Space registry (CSV; registry updated 2025-10-09)", type: "registry", url: "https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv", access_date: "2026-10-19", scope: "every special-purpose row of the classification: address block, name, RFC, dates, and the Source, Destination, Forwardable, Globally Reachable and Reserved-by-Protocol flags", status: "active" }, // the classification table
    { id: "iana-ipv4-multicast", label: "IANA - IPv4 Multicast Address Space registry (registry updated 2026-08-20)", type: "registry", url: "https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml", access_date: "2026-10-19", scope: "the multicast row 224.0.0.0/4 (224.0.0.0 through 239.255.255.255), which the special-purpose registry does not list", status: "active" }, // multicast row
    { id: "rfc6890", label: "RFC 6890 - Special-Purpose IP Address Registries", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc6890", access_date: "2026-10-19", scope: "the registry's structure and the meaning of its flag columns; 192.0.0.0/24", status: "active" }, // registry structure
    { id: "rfc8190", label: "RFC 8190 - Updates to the Special-Purpose IP Address Registries", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc8190", access_date: "2026-10-19", scope: "updates RFC 6890; cited by the Limited Broadcast row", status: "active" }, // registry update
    { id: "rfc1918", label: "RFC 1918 - Address Allocation for Private Internets", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc1918", access_date: "2026-10-19", scope: "the three Private-Use rows: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (section 3)", status: "active" }, // private use
    { id: "rfc6598", label: "RFC 6598 - IANA-Reserved IPv4 Prefix for Shared Address Space", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc6598", access_date: "2026-10-19", scope: "the Shared Address Space row, 100.64.0.0/10", status: "active" }, // shared address space
    { id: "rfc5737", label: "RFC 5737 - IPv4 Address Blocks Reserved for Documentation", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc5737", access_date: "2026-10-19", scope: "the three documentation rows: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24", status: "active" }, // documentation
    { id: "rfc3927", label: "RFC 3927 - Dynamic Configuration of IPv4 Link-Local Addresses", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3927", access_date: "2026-10-19", scope: "the Link Local row, 169.254.0.0/16", status: "active" }, // link local
    { id: "rfc1112", label: "RFC 1112 - Host Extensions for IP Multicasting, section 4", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc1112", access_date: "2026-10-19", scope: "host group addresses 224.0.0.0 to 239.255.255.255; class E (240.0.0.0/4) reserved for future addressing modes", status: "active" }, // multicast and class E
    { id: "rfc5771", label: "RFC 5771 - IANA Guidelines for IPv4 Multicast Address Assignments", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc5771", access_date: "2026-10-19", scope: "the multicast address ranges, 224.0.0.0 to 239.255.255.255", status: "active" }, // multicast blocks
  ],
});
