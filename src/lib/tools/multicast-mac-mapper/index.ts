// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/multicast-mac-mapper/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the multicast group <->
// Ethernet MAC mapper (02/11/2026). Every source below was downloaded with curl
// on 2026-11-02 (generic User-Agent, no-cache headers, a cache-busting query)
// and answered HTTP 200; the files and the log are in the build's work folder.
// The RFC Editor's index (rfc-index.xml, read the same day) gives each RFC's
// status: RFC 1112 is an Internet Standard (STD 5), updated by RFC 2236; RFC
// 9542 is a Best Current Practice (BCP 141) that obsoletes RFC 7042; RFC 5771,
// RFC 2365 and RFC 3180 are BCPs 51, 23 and 53; RFC 4291 is a Draft Standard
// updated by RFC 7346 and RFC 7371 among others; RFC 3307 is updated by RFC
// 10028 (August 2026); RFC 3306 and RFC 3956 are updated by RFC 7371; RFC 4541
// and RFC 6676 are Informational; none of the sources used is obsoleted.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, MAPPER_VECTORS } from "./golden-vectors"; // the set id and the vectors

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, macForms, canonicalIpv6, MulticastMacInputError, MAX_INPUT } from "./compute"; // values
export type { MacNotation, MacForms, Ipv4BlockId, Ipv4ScopeId, Ipv4Table, Ipv4Group, Ipv4Forward, Ipv4Reverse, Ipv6ScopeId, GroupIdRange, SsmRange, Ipv6Named, Ipv6Forward, Ipv6Reverse, MapperResult } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, MAPPER_VECTORS, EXAMPLE_INPUT, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { MapperVector, VerifyReport } from "./golden-vectors"; // their shapes

/** The D-49 declarative manifest for the multicast group <-> MAC mapper. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing", // must equal the catalogue family (D-73): with the IPv6 toolkit, the CIDR calculator and the OUI lookup
  toolSlug: "multicast-mac-mapper", // the route segment and API path
  canonicalAliases: [
    "multicast mac address", // the obvious search
    "ip multicast to mac", // the forward question
    "01-00-5e", // the IPv4 prefix people search for
    "33-33 mac", // the IPv6 prefix
    "igmp snooping mac", // the operational question
    "multicast mac collision", // the 32:1 overlap
  ],
  inputDetectors: [
    // Anchored, no nested quantifiers (ReDoS-safe). Each example is a golden vector's input.
    { kind: "regex", pattern: "^\\s*2(2[4-9]|3[0-9])\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\s*$", priority: 8, example: "233.252.0.1" }, // an IPv4 group: example-233-252-0-1
    { kind: "regex", pattern: "^\\s*[fF][fF][0-9a-fA-F]{2}:[0-9a-fA-F:.]{1,41}\\s*$", priority: 8, example: "ff02::1" }, // an IPv6 group: ff02-1
    { kind: "regex", pattern: "^\\s*01[:-]00[:-]5[eE]([:-][0-9a-fA-F]{2}){3}\\s*$", priority: 8, example: "01:00:5e:7c:00:01" }, // an IPv4 multicast MAC: rev-example-colon
    { kind: "regex", pattern: "^\\s*33[:-]33([:-][0-9a-fA-F]{2}){4}\\s*$", priority: 8, example: "33:33:00:00:00:01" }, // an IPv6 multicast MAC: rev-v6-all-nodes
    { kind: "regex", pattern: "^\\s*(0100\\.5[eE][0-9a-fA-F]{2}|3333\\.[0-9a-fA-F]{4})\\.[0-9a-fA-F]{4}\\s*$", priority: 8, example: "0100.5e01.0101" }, // either, in Cisco dot notation: rev-lab-dot
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // address arithmetic and two packed registry tables: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: MAPPER_VECTORS.length, // 140: 98 computed and 42 refusals
  dangerousInputHandling: [
    "redos-guard", // anchored patterns with bounded repetition only
    "length-bound", // at most 80 characters (an IPv6 address with an IPv4 tail and a zone index)
    "single-line", // one address on one line
    "share-input", // Share results (2026-11-02) builds a link only when pressed and only for a reading, carrying the field as typed after the #
  ],
  shareSafetyDefault: "safe", // a multicast group or a group MAC names a group, never a host or a person; a unicast input gets no reading and no link

  // -- Teaching & provenance --
  learnLinks: ["learn/multicast-what-it-costs-to-not-flood", "learn/what-is-an-oui"], // the article whose "From group address to MAC address" section this tool computes, and the OUI article that names both mappings
  sources: [
    { id: "rfc1112", label: "RFC 1112, Host Extensions for IP Multicasting, August 1989 (STD 5): sections 4, 6.4, 7.2 and 7.3", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc1112.txt", access_date: "2026-11-02", scope: "class D groups begin with 1110, 224.0.0.0 to 239.255.255.255; 1111 reserved; 224.0.0.0 never assigned; the low-order 23 bits into 01-00-5E-00-00-00; more than one group per MAC; hosts discard datagrams for groups they did not join", status: "active" }, // the IPv4 mapping
    { id: "rfc2464", label: "RFC 2464, Transmission of IPv6 Packets over Ethernet Networks, December 1998: section 7", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc2464.txt", access_date: "2026-11-02", scope: "33-33 followed by the last four octets of the IPv6 multicast address", status: "active" }, // the IPv6 mapping
    { id: "rfc9542", label: "RFC 9542, IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, April 2024 (BCP 141): sections 2.1.1, 2.1.3, 2.1.4 and 2.3.1", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc9542.txt", access_date: "2026-11-02", scope: "the group (M) bit; 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF for IPv4 multicast and the other blocks under 01-00-5E; documentation MACs; 33-33 for IPv6 multicast. Obsoletes RFC 7042", status: "active" }, // the IANA Ethernet allocations
    { id: "iana-ethernet-numbers", label: "IANA, IANA OUI Ethernet Numbers registry, last updated 2026-10-13: IANA Multicast 48-bit MAC Addresses", type: "registry", url: "https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.xhtml", access_date: "2026-11-02", scope: "the rows of 01-00-5E-80-00-00 to 01-00-5E-FF-FF-FF named in the refusal of a MAC from the upper half", status: "active" }, // the upper half's rows
    { id: "iana-ipv4-multicast", label: "IANA, IPv4 Multicast Address Space registry, last updated 2026-08-20", type: "registry", url: "https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xhtml", access_date: "2026-11-02", scope: "the blocks; the names in the Local Network Control, Internetwork Control, SDP/SAP and SSM blocks, MCAST-TEST-NET and the relative addresses; routers do not forward 224.0.0.0/24", status: "active" }, // IPv4 names
    { id: "rfc5771", label: "RFC 5771, IANA Guidelines for IPv4 Multicast Address Assignments, March 2010 (BCP 51): sections 3 to 10", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5771.txt", access_date: "2026-11-02", scope: "the registration blocks and what each is for, MCAST-TEST-NET 233.252.0.0/24", status: "active" }, // IPv4 blocks
    { id: "rfc2365", label: "RFC 2365, Administratively Scoped IP Multicast, July 1998 (BCP 23): sections 3, 4, 6, 8 and 9", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc2365.txt", access_date: "2026-11-02", scope: "239.0.0.0/8; the Local Scope 239.255.0.0/16 and its expansion; the Organization Local Scope 239.192.0.0/14 and its expansion; link-local and global scope; relative addresses in the top /24 of a scope", status: "active" }, // IPv4 scopes
    { id: "rfc4607", label: "RFC 4607, Source-Specific Multicast for IP, August 2006: sections 1, 4.3 and 9", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc4607.txt", access_date: "2026-11-02", scope: "232/8 and ff3x::/32 (P = 1, T = 1, plen = 0); 232.0.0.0 and ff3x::4000:0000 reserved; the IANA and host ranges; invalid ff3x::0 to ff3x::3fff:ffff; 232.0.0.0/24 and 232.128.0.0/24 share link-layer addresses with 224.0.0.0/24", status: "active" }, // SSM
    { id: "rfc3180", label: "RFC 3180, GLOP Addressing in 233/8, September 2001 (BCP 53): section 3", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3180.txt", access_date: "2026-11-02", scope: "233.X.Y.0/24 for the 16-bit AS X.Y, and the AS 5662 example", status: "active" }, // GLOP
    { id: "rfc6034", label: "RFC 6034, Unicast-Prefix-Based IPv4 Multicast Addresses, October 2010: sections 3 and 4", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc6034.txt", access_date: "2026-11-02", scope: "234/8: shift the group left by 8 bits to find the unicast prefix", status: "active" }, // UBM
    { id: "rfc6676", label: "RFC 6676, Multicast Addresses for Documentation, August 2012: sections 2 and 3", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc6676.txt", access_date: "2026-11-02", scope: "233.252.0.0/24, relative offset 10, GLOP AS 64496 to 64511, 234.192.0.2, ff0X::db8:0:0/96 and the unicast-prefix and embedded-RP examples", status: "active" }, // documentation addresses
    { id: "iana-ipv6-multicast", label: "IANA, IPv6 Multicast Address Space registry, last updated 2026-04-07", type: "registry", url: "https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.xhtml", access_date: "2026-11-02", scope: "the node-local, link-local, site-local and variable-scope names; the SSM group ID rows; the Dynamic Multicast Group IDs registry", status: "active" }, // IPv6 names
    { id: "rfc4291", label: "RFC 4291, IP Version 6 Addressing Architecture, February 2006: sections 2.7 and 2.7.1", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc4291.txt", access_date: "2026-11-02", scope: "ff00::/8; the flags and T; the scope values and their rules; the reserved, all-nodes, all-routers and solicited-node addresses", status: "active" }, // IPv6 multicast
    { id: "rfc7346", label: "RFC 7346, IPv6 Multicast Address Scopes, August 2014: section 2", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc7346.txt", access_date: "2026-11-02", scope: "scope 3, Realm-Local, and the scope table", status: "active" }, // scope 3
    { id: "rfc7371", label: "RFC 7371, Updates to the IPv6 Multicast Addressing Architecture, September 2014: sections 2 to 4", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc7371.txt", access_date: "2026-11-02", scope: "flag bits treated as separate bits; ff1 X R P T and ff2; SSM and embedded RP with the X bit set", status: "active" }, // flags
    { id: "rfc3306", label: "RFC 3306, Unicast-Prefix-based IPv6 Multicast Addresses, September 2002: section 4", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3306.txt", access_date: "2026-11-02", scope: "P, plen and the network prefix field; P = 1 requires T = 1", status: "active" }, // unicast-prefix-based
    { id: "rfc3956", label: "RFC 3956, Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address, November 2004: sections 3, 4 and 6.3", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3956.txt", access_date: "2026-11-02", scope: "R and RIID; the RP from the first plen bits of the prefix and RIID; plen 1 to 64; RIID 0 and fe80::/10, ::/16 and ff00::/8 refused", status: "active" }, // embedded RP
    { id: "rfc3307", label: "RFC 3307, Allocation Guidelines for IPv6 Multicast Addresses, September 2002: sections 2 and 4", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3307.txt", access_date: "2026-11-02", scope: "the group ID is the low-order 32 bits; the permanent, permanent group ID and dynamic ranges; the ff02::9 and ff32::8000:9 mapping examples", status: "active" }, // group IDs
    { id: "rfc10028", label: "RFC 10028, Updates to Dynamic IPv6 Multicast Address Group IDs, August 2026: sections 3 and 6", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc10028.txt", access_date: "2026-11-02", scope: "the Dynamic Multicast Group IDs registry: MADCAP, host allocation of SSM, private use, experimental use and solicited-node ranges", status: "active" }, // dynamic group IDs
    { id: "rfc5952", label: "RFC 5952, A Recommendation for IPv6 Address Text Representation, August 2010: section 4", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5952.txt", access_date: "2026-11-02", scope: "the canonical text the tool prints for an IPv6 group", status: "active" }, // canonical text
    { id: "rfc4007", label: "RFC 4007, IPv6 Scoped Address Architecture, March 2005: section 11", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc4007.txt", access_date: "2026-11-02", scope: "the <address>%<zone_id> form; the address is the part before %", status: "active" }, // zone index
    { id: "rfc9844", label: "RFC 9844, Entering IPv6 Zone Identifiers in User Interfaces, August 2025: section 1", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc9844.txt", access_date: "2026-11-02", scope: "zone identifiers have purely local meaning within the node and apply to scoped multicast addresses; a pasted address may carry one", status: "active" }, // zone index, updating RFC 4007
    { id: "rfc4541", label: "RFC 4541, Considerations for Internet Group Management Protocol (IGMP) and Multicast Listener Discovery (MLD) Snooping Switches, May 2006: sections 2.1.2, 3 and 4", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc4541.txt", access_date: "2026-11-02", scope: "MAC-based or IP-based forwarding tables, IP preferred because the mapping is ambiguous; 224.0.0.X and ff02::1 forwarded on all ports; ff00::/15 never on the link; 2^(112-32) IPv6 addresses per MAC; the questionnaire's 224.1.2.3 and 239.129.2.3", status: "active" }, // snooping
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = MAPPER_VECTORS; // every vector
