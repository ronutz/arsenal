// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/ospf-cost-and-adjacency-checker/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the OSPF cost and
// adjacency checker (08/11/2026). Every source below was read on 2026-11-08.
// The RFCs, the RFC Editor's errata pages and index, Juniper's pages, the
// FRRouting documentation, MikroTik's manual and Extreme's two command
// reference PDFs were downloaded with curl (generic User-Agent, no-cache
// headers, a cache-busting query) and answered HTTP 200. Cisco's pages and
// HPE Aruba's pages answered HTTP 403 to curl, Arista's HTTP 406 and Huawei's
// HTTP 403 (again on 2026-11-08 at 19:58 São Paulo time, sources/http-status.log
// of the update). In the first build Cisco's guide, Cisco's ip ospf mtu-ignore
// entry, Arista's chapter and AOS-CX's ip ospf cost page were read through a
// second reader (marked "read through a second reader"); for the update of the
// same evening (2026-11-08b) Cisco's command reference (A through ip ospf
// demand-circuit), Huawei's five OSPF command pages, Arista's OSPFv2 chapter and
// AOS-CX's ip ospf cost and reference-bandwidth pages were read in a browser,
// marked "(read in a browser on 2026-11-08: the site refuses automated reads)".
// That read found Arista's auto-cost reference-bandwidth, which the second
// reader had reported absent. The RFC index gives each RFC's status: RFC 2328 is an Internet
// Standard (STD 54), updated by RFC 5709, 6549, 6845, 6860, 7474, 8042, 9355
// and 9454 and obsoleted by none; RFC 5340 is a Proposed Standard updated by
// RFC 6845, 6860, 7503, 8362 and 9454; RFC 3101, 4552, 5709, 6549 and 7166 are
// Proposed Standards in force.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, OSPF_VECTORS } from "./golden-vectors"; // the set id and the vectors

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, costLocalisable, adjacencyLocalisable, referenceCost, smallestReference, exactQuotient, bandwidthLabel, OspfInputError, MAX_FIELD, MAX_LIST, MIN_LINKS, MAX_LINKS, MIN_SPEED_BPS, MAX_SPEED_BPS, MAX_COST, SEARCH_LIMIT } from "./compute"; // values
export type { CostRequest, CostBasis, LinkCost, ReferenceUsed, SmallestReference, CostResult, NetworkType, AreaType, AuthKind, SideInput, AdjacencyRequest, OspfRequest, NeighborView, SideSummary, CheckId, Finding, AdjacencyResult, OspfResult } from "./compute"; // types
export { VENDORS, VENDOR_ORDER, COMMANDS } from "./vendors"; // the vendors' rules
export type { VendorId, VendorRule } from "./vendors"; // their shapes
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, OSPF_VECTORS, EXAMPLE_COST_REQUEST, EXAMPLE_ADJACENCY_REQUEST, ADJACENCY_SCENARIOS, COST_SPEED_CHIPS, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { OspfVector, VerifyReport } from "./golden-vectors"; // their shapes

/** The D-49 declarative manifest for the OSPF cost and adjacency checker. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking", // must equal the catalogue family (D-73)
  toolSlug: "ospf-cost-and-adjacency-checker", // the route segment and API path
  canonicalAliases: [ // the list
    "ospf cost calculator", // the obvious search
    "ospf reference bandwidth", // the setting people look up
    "auto-cost reference-bandwidth", // Cisco's and FRRouting's command
    "ospf neighbor stuck exstart", // the MTU symptom
    "ospf adjacency mismatch", // the second mode
    "ospf hello dead interval mismatch", // the course lab's second deliberate breakage
    "ospf mtu mismatch", // the ExStart case
    "ospf bandwidth-reference", // Huawei VRP's command (2026-11-08b)
    "ospf mtu-enable", // Huawei VRP's MTU check (2026-11-08b)
  ],
  inputDetectors: [ // the list
    { // one entry
      // A form, not a paste: nothing to detect in free text. The example is the page's cost Example as an API body.
      kind: "structured-form", // detector field
      pattern: "mode (cost | adjacency) + vendor and speeds / two interfaces", // detector field
      priority: 1, // detector field
      example: '{"mode":"cost","vendor":"juniper-junos","reference":"","links":"100M, 1G, 10G"}', // golden vector example-cost
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // exact arithmetic and fixed receive checks only: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: OSPF_VECTORS.length, // 220 (set 2026-11-08b): 99 from the oracle, 121 written out
  dangerousInputHandling: [ // the list
    "redos-guard", // anchored patterns with bounded repetition only
    "length-bound", // every field at most 64 characters, the speed list at most 200, at most 8 speeds
    "bounded-search", // the smallest-reference search stops after 200,000 candidates or at the vendor's range
    "exact-arithmetic", // BigInt bandwidths and exact quotients: nothing rounded that a vendor does not round
    "no-secrets", // the adjacency mode never asks for a key, only whether the two keys are the same
    "share-input-caution", // Share results (2026-11-08) builds a link only when pressed, carrying the mode's fields as typed after the #, with a caution line in adjacency mode (Router IDs and addresses name a private network)
  ],
  shareSafetyDefault: "fragment", // the adjacency mode's Router IDs, addresses and labels name infrastructure on a private network

  // -- Teaching & provenance --
  learnLinks: ["learn/ospf-primer"], // the article whose cost and neighbour sections this tool computes
  sources: [ // the list
    { id: "rfc2328", label: "RFC 2328, OSPF Version 2, April 1998 (STD 54): sections 1.2, 6, 8.2, 9.5.1, 10.1, 10.4, 10.5, 10.6, 12.4.1.1, 12.4.1.2, 12.4.1.4, 16.1 and appendices A.3.1, A.3.2, A.3.3, A.4.2, C.3, D.2, D.3 and D.5", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc2328.txt", access_date: "2026-11-08", scope: "every OSPFv2 receive check (Area ID, subnet, AuType, authentication, locally originated packets, Network Mask, HelloInterval, RouterDeadInterval, E-bit), who becomes adjacent, the Database Description MTU check and ExStart cases, how each network type is described and why a link without a link back is skipped, cost greater than 0 in a 16-bit metric, the backbone never a stub", status: "active" }, // Internet Standard
    { id: "rfc2328-errata", label: "RFC Editor, errata for RFC 2328: verified erratum 3734 (the AuType is checked per interface)", type: "reference", url: "https://www.rfc-editor.org/errata/rfc2328", access_date: "2026-11-08", scope: "section 8.2 reads \"the associated interface\" for \"the associated area\"; the other verified errata change no check made here", status: "active" }, // errata
    { id: "rfc5340", label: "RFC 5340, OSPF for IPv6, July 2008: sections 2.4, 2.6, 4.2.2, 4.2.2.1 and appendix A.3.2", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5340.txt", access_date: "2026-11-08", scope: "OSPFv3: the Instance ID checked with the Area ID, no subnet restriction, no Network Mask, authentication removed from OSPF, a 16-bit RouterDeadInterval", status: "active" }, // Proposed Standard
    { id: "rfc3101", label: "RFC 3101, The OSPF Not-So-Stubby Area (NSSA) Option, January 2003: sections 1.3 and 2.1", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3101.txt", access_date: "2026-11-08", scope: "the N-bit and E-bit must match the receiving area or the Hello is dropped; the backbone is always Type-5 capable", status: "active" }, // Proposed Standard
    { id: "rfc5709", label: "RFC 5709, OSPFv2 HMAC-SHA Cryptographic Authentication, October 2009: sections 3, 3.2 and 3.4", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5709.txt", access_date: "2026-11-08", scope: "Keyed-MD5 and HMAC-SHA-1/256/384/512; HMAC-SHA-256 mandatory; the 8-bit Key ID implies the algorithm", status: "active" }, // Proposed Standard
    { id: "rfc6549", label: "RFC 6549, OSPFv2 Multi-Instance Extensions, March 2012: sections 2, 3 and 3.1", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc6549.txt", access_date: "2026-11-08", scope: "the OSPFv2 Instance ID (default 0); packets with another Instance ID MUST be discarded", status: "active" }, // Proposed Standard
    { id: "rfc7166", label: "RFC 7166, Supporting Authentication Trailer for OSPFv3, March 2014: sections 3, 4.2, 4.6 and 5", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc7166.txt", access_date: "2026-11-08", scope: "the 16-bit SA ID, the AT-bit, the omitted header checksum, the drops on a missing SA, a mismatched digest or a clear AT-bit, and the transition mode", status: "active" }, // Proposed Standard
    { id: "rfc4552", label: "RFC 4552, Authentication/Confidentiality for OSPFv3, June 2006: section 3", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc4552.txt", access_date: "2026-11-08", scope: "with IPsec enabled, unprotected packets and packets that fail authentication MUST be silently discarded", status: "active" }, // Proposed Standard
    { id: "rfc5838", label: "RFC 5838, Support of Address Families in OSPFv3, April 2010: section 2.1", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5838.txt", access_date: "2026-11-08", scope: "the OSPFv3 Instance ID ranges per address family, quoted in the Instance ID finding", status: "active" }, // Proposed Standard
    { id: "rfc-index", label: "RFC Editor, RFC index (XML): the current status of RFC 2328, 5340, 3101, 4552, 5709, 5838, 6549 and 7166", type: "registry", url: "https://www.rfc-editor.org/rfc-index.xml", access_date: "2026-11-08", scope: "none of them is obsoleted; RFC 2328 and RFC 5340 are updated, among others, by RFC 9454 (terminology: Leader and Follower)", status: "active" }, // the index
    { id: "cisco-ospf-cg", label: "Cisco, IP Routing Configuration Guide, Cisco IOS XE 17.18.x (Catalyst 9300 Switches), Configuring OSPF (read through a second reader: curl answered HTTP 403)", type: "docs", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/rtng/b_1718_rtng_9300_cg/configuring_ospf.html", access_date: "2026-11-08", scope: "auto-cost reference-bandwidth in Mbps, default 100, range 1 to 4294967, cost = ref-bw/interface-bw, ip ospf cost overrides it; Hello 10 s and dead four times the Hello by default", status: "active" }, // Cisco guide
    { id: "cisco-ospf-cr", label: "Cisco, IP Routing: OSPF Command Reference, A through ip ospf demand-circuit: auto-cost and ip ospf cost (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/m_ospf-a1.html", access_date: "2026-11-08", scope: "the auto-cost examples (a 64K link gets 1562, a T1 64), from which the tool takes truncation; the auto-cost example that \"changes the cost of the FDDI link to 10, while the gigabit Ethernet link remains at a cost of 1\" at reference 1000, and the ip ospf cost list's \"ATM-- Default cost is 1\", from which the tool costs an interface at or above the reference at 1", status: "active" }, // Cisco reference, auto-cost and ip ospf cost
    { id: "cisco-ospf-cr-i1", label: "Cisco, IP Routing: OSPF Command Reference: ip ospf mtu-ignore (read through a second reader: curl answered HTTP 403)", type: "docs", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/m_ospf-i1.html", access_date: "2026-11-08", scope: "ip ospf mtu-ignore: MTU mismatch detection enabled by default, checked when neighbours exchange DBD packets", status: "active" }, // Cisco reference, ip ospf mtu-ignore
    { id: "juniper-reference-bandwidth", label: "Juniper Networks, Junos OS CLI Reference: reference-bandwidth (Protocols OSPF) and metric (Protocols OSPF Interface)", type: "docs", url: "https://www.juniper.net/documentation/us/en/software/junos/cli-reference/topics/ref/statement/reference-bandwidth-edit-protocols-ospf.html", access_date: "2026-11-08", scope: "cost = ref-bandwidth/bandwidth, in bits per second, 9600 through 100,000,000,000,000, default 100 Mbps; metric 1 through 65,535 overrides it", status: "active" }, // Juniper CLI reference
    { id: "juniper-ospf-guide", label: "Juniper Networks, Junos OS OSPF User Guide (PDF of 18 June 2026): Controlling the Cost of Individual OSPF Network Segments", type: "guide", url: "https://www.juniper.net/documentation/us/en/software/junos/ospf/ospf.pdf", access_date: "2026-11-08", scope: "any interface at or above the reference gets 1; the 10g example (Fast Ethernet 100, Gigabit Ethernet 10); a reference based on a multiple of the highest speed; the range 9600 through 1,000,000,000,000 bits as the guide states it", status: "active" }, // Juniper guide
    { id: "frr-ospfd", label: "FRRouting documentation (latest), OSPFv2: auto-cost reference-bandwidth", type: "docs", url: "https://docs.frrouting.org/en/latest/ospfd.html", access_date: "2026-11-08", scope: "reference in Mbit/s, 1 to 4294967, default 100, a link at or above it costs 1, and \"This configuration setting MUST be consistent across all routers within the OSPF domain.\"", status: "active" }, // FRRouting
    { id: "extreme-switch-engine-cr", label: "Extreme Networks, Switch Engine v33.7.1 Command References (PDF): configure ospf cost and configure ospf metric-table, pages 1093 to 1099", type: "docs", url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/downloads/Switch_Engine_33_7_1_Command_References.pdf", access_date: "2026-11-08", scope: "cost automatic by default, from the metric table (10 Mbps 10, 100 Mbps 5, 1 Gbps 4, 2.5 and 5 Gbps 3, 10 to 50 Gbps 2, 100 Gbps 1); cost range 1 through 65535", status: "active" }, // Switch Engine
    { id: "extreme-fabric-engine-cr", label: "Extreme Networks, Fabric Engine v9.4 Command References (PDF): ip ospf default-cost, ip ospf cost and ip ospf mtu-ignore enable", type: "docs", url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20Command%20References/downloads/Fabric_Engine_9_4_Command_References.pdf", access_date: "2026-11-08", scope: "default costs 100 (10 Mb/s), 10 (100 Mb/s) and 1 (1 to 100 Gb/s, and a VLAN); mtu-ignore lets the switch accept DBD packets with a different MTU", status: "active" }, // Fabric Engine
    { id: "arista-eos-ospfv2", label: "Arista Networks, EOS User Manual (4.37.0F as served), Open Shortest Path First version 2: auto-cost reference-bandwidth and ip ospf cost (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://www.arista.com/en/um-eos/eos-open-shortest-path-first-version-2", access_date: "2026-11-08", scope: "auto-cost reference-bandwidth in Router-OSPF configuration mode, rate 1 to 4294967, default 100; ospfv2-cost = (auto-cost value * 1 Mbps) / interface bandwidth, minimum 1, non-integer results rounded down; while it is not set, Ethernet interfaces take the default ip ospf cost of 10; ip ospf cost 1 to 65535, port channel and VLAN interfaces 10; no setting to ignore the MTU check (the chapter mentions the MTU only in command output, \"MTU is 1500\", and for tunnel path-mtu-discovery)", status: "active" }, // Arista
    { id: "aruba-reference-bandwidth", label: "HPE Aruba Networking, AOS-CX 10.16 IP Routing Guide: reference-bandwidth (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://arubanetworking.hpe.com/techdocs/AOS-CX/10.16/HTML/ip_route_6300-6400-8100-83xx-93xx-100xx/Content/Chp_OSPFv2/OSPFv2_cmds/ref-ban-osp-10.htm", access_date: "2026-11-08", scope: "reference bandwidth for OSPFv2 in config-ospf-<PROCESS-ID>, 1 to 4000000 Mbps, default 100000 Mbps; interfaces without an explicit cost are costed from it and the link speed; VLAN interfaces count as 1 Gbps; no rounding or minimum stated", status: "active" }, // AOS-CX reference-bandwidth
    { id: "aruba-ip-ospf-cost", label: "HPE Aruba Networking, AOS-CX 10.16 IP Routing Guide: ip ospf cost (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://arubanetworking.hpe.com/techdocs/AOS-CX/10.16/HTML/ip_route_6300-6400-8100-83xx-93xx-100xx/Content/Chp_OSPFv2/OSPFv2_cmds/ip-osp-cos61.htm", access_date: "2026-11-08", scope: "range 1 to 65535, \"Default: 1\", and its no form \"sets the cost (metric) associated with a particular interface to the default cost 1\": the disagreement with reference-bandwidth the tool states", status: "active" }, // AOS-CX ip ospf cost
    { id: "huawei-ospf-cost", label: "Huawei, S5700 and S6700 V200R025C00 Command Reference, OSPF Configuration Commands: ospf cost (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/c1494b74/ospf-cost", access_date: "2026-11-08", scope: "cost = bandwidth reference value / interface bandwidth, the integer of the result, 1 when smaller than 1; range 1 to 65535; a loopback interface defaults to 0; no default cost for trunk interfaces", status: "active" }, // Huawei ospf cost
    { id: "huawei-bandwidth-reference", label: "Huawei, S5700 and S6700 V200R025C00 Command Reference, OSPF Configuration Commands: bandwidth-reference (OSPF) (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/dfb93b47/bandwidth-reference-ospf", access_date: "2026-11-08", scope: "the reference in the OSPF view, per process, 1 to 2147483648 Mbit/s, default 100 Mbit/s; the same formula; an Eth-Trunk interface's bandwidth is the total of its member interfaces", status: "active" }, // Huawei bandwidth-reference
    { id: "huawei-ospf-mtu-enable", label: "Huawei, S5700 and S6700 V200R025C00 Command Reference, OSPF Configuration Commands: ospf mtu-enable (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/7a3f4c81/ospf-mtu-enable", access_date: "2026-11-08", scope: "MTU 0 in sent DD packets and no check of received ones by default; with the command the actual MTU is sent and checked, different MTUs keep the neighbour from Full, and the OSPF process restarts", status: "active" }, // Huawei ospf mtu-enable
    { id: "huawei-ospf-timer-hello", label: "Huawei, S5700 and S6700 V200R025C00 Command Reference, OSPF Configuration Commands: ospf timer hello (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/531b4150/ospf-timer-hello", access_date: "2026-11-08", scope: "10 s on P2P and broadcast, 30 s on NBMA and P2MP; range 1 to 65535; dead four times the Hello when only the Hello is set; below 5 s the actual dead interval is not shorter than 20 s unless the conservative keyword is used", status: "active" }, // Huawei ospf timer hello
    { id: "huawei-ospf-timer-dead", label: "Huawei, S5700 and S6700 V200R025C00 Command Reference, OSPF Configuration Commands: ospf timer dead (read in a browser on 2026-11-08: the site refuses automated reads)", type: "docs", url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/561b597c/ospf-timer-dead", access_date: "2026-11-08", scope: "40 s on P2P and broadcast, 120 s on NBMA and P2MP; range 1 to 235926000; below 20 s the actual dead interval is not shorter than 20 s", status: "active" }, // Huawei ospf timer dead
    { id: "mikrotik-interface-template", label: "MikroTik, RouterOS Manual 7.24, CLI Reference: routing/ospf/interface-template", type: "docs", url: "https://manual.mikrotik.com/docs/7.24/cli-reference/routing/ospf/interface-template/", access_date: "2026-11-08", scope: "cost is \"Interface cost expressed as link state metric\" with no default stated; hello-interval and dead-interval \"must be the same for all the routers\"", status: "active" }, // RouterOS
  ],
  credits: [ // the list
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = OSPF_VECTORS; // every vector
