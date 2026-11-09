// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/stp-election-calculator/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the spanning tree
// election calculator (08/11/2026). Every source below was read on
// 2026-11-08. Most were downloaded with curl (user agent "Mozilla/5.0
// (compatible; source-check)", no-cache headers, a cache-busting query) and
// answered HTTP 200. Cisco's, Arista's and HPE Aruba's documentation sites
// refused that user agent (HTTP 403 and 406), so those pages were read through
// the WebFetch reader and their quotes saved; each such label says "read via
// WebFetch". Huawei's documentation refused both readers that day; PRIME's
// Chrome read it later the same day (with Cisco's command references), and those
// labels say "read in a browser". The IEEE standards themselves are not
// freely readable (the 802.1D-2004 download link answered with an application
// shell), so the rules come from the IEEE's own YANG module and MIB, the
// RFCs, and the vendors' documents. The RFC Editor's index gives RFC 4188 as a
// Proposed Standard (obsoletes RFC 1493) and RFC 9542 as BCP 141, obsoleting
// RFC 7042, whose documentation MAC block it keeps.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, STP_VECTORS } from "./golden-vectors"; // the set id and the vectors

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, electionLocalisable, costLocalisable, parseMac, macText, parseSpeed, speedRow, StpInputError, SPEEDS, VENDORS, MAX_COST, MAX_TEXT, MAX_LINES, MAX_LINE, MIN_BRIDGES, MAX_BRIDGES, MAX_LINKS, MAX_SEGMENT_PORTS, MAX_PORTS, MAX_NAME, MAX_SPEED_TEXT } from "./compute"; // values
export type { CostMethod, SpeedRow, VendorRow, CostValue, PriorityFormat, PortRole, Decider, CostSource, ElectionRequest, CostRequest, StpRequest, BridgeRow, PortRow, SegmentRow, DesignatedCandidate, RootPortCandidate, RootStep, RootPortStep, DesignatedStep, BlockedStep, ElectionResult, CostVendorRow, CostResult, StpResult } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, STP_VECTORS, EXAMPLE_ELECTION_REQUEST, EXAMPLE_COST_REQUEST, SAMPLES, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { StpVector, VerifyReport } from "./golden-vectors"; // their shapes

/** A source read through the WebFetch reader after curl was refused (the label says so). */
const VIA_WEBFETCH = " (read via WebFetch: the site refused curl)"; // appended to those labels
/** A source read in PRIME's browser on 2026-11-08, the site refusing automated reads (the label says so). */
const VIA_BROWSER = " (read in a browser on 2026-11-08: the site refuses automated reads)"; // appended to those labels

/** The D-49 declarative manifest for the spanning tree election calculator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking", // must equal the catalogue family (D-73)
  toolSlug: "stp-election-calculator", // the route segment and API path
  canonicalAliases: [
    "spanning tree calculator", // the obvious search
    "root bridge election", // what people ask first
    "stp root port", // the second question
    "designated port", // the third
    "stp path cost", // the cost tables
    "802.1d 802.1t path cost", // the two scales
    "spanning-tree pathcost method", // Cisco's command
  ],
  inputDetectors: [
    {
      // A form with a topology box: the API body names its mode. The example is the page's election Example as an API body.
      kind: "structured-form",
      pattern: "mode (election | cost) + method + topology lines (bridge, link, port, vlan) / speed",
      priority: 1,
      example: '{"mode":"cost","speed":"1G"}', // golden vector cost-1G (the cost Example)
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // a shortest-path pass and three sorts: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: STP_VECTORS.length, // 178: 78 elections and 22 cost lookups from the oracle, 78 written out (08b)
  dangerousInputHandling: [
    "redos-guard", // anchored patterns with bounded repetition only, run on lines already cut to 200 characters
    "length-bound", // at most 4000 characters, 80 lines, 16 bridges, 32 links, 8 ports a segment, 128 ports
    "no-invented-values", // a speed or method no document read gives a cost for is refused, never estimated
    "share-input-caution", // Share results builds a link only when pressed, carrying the mode, the method and the topology as typed after the #, with a caution line (bridge names and MAC addresses can describe a real network)
  ],
  shareSafetyDefault: "fragment", // switch names and MAC addresses may name infrastructure on a private network

  // -- Teaching & provenance --
  learnLinks: ["learn/spanning-tree-in-one-article"], // the article whose election and cost sections this tool computes
  sources: [
    { id: "ieee-rstp-yang", label: "IEEE 802.1, ieee802-dot1q-rstp YANG module, revision 2025-02-04: bridge-id (4-bit priority, 12-bit system ID extension, 48-bit address), port-id (4-bit priority, 12-bit port number), port-role, root-path-cost, port-path-cost (1 to 200000000)", type: "standard", url: "https://grouper.ieee.org/groups/802/1/files/public/YANGs/ieee802-dot1q-rstp.yang", access_date: "2026-11-08", scope: "the bridge ID and port ID layouts, the four port roles, the root path cost and the port path cost range", status: "active" }, // HTTP 200
    { id: "ieee-stp-mib", label: "IEEE 802.1, IEEE8021-SPANNING-TREE-MIB, LAST-UPDATED 2022-11-08 (published with IEEE 802.1Q-2022): ieee8021SpanningTreePriority, ...PortPriority, ...PortPathCost", type: "standard", url: "https://www.ieee802.org/1/files/public/MIBs/IEEE8021-SPANNING-TREE-MIB-202211080000Z.mib", access_date: "2026-11-08", scope: "bridge priority 0 to 61440 in steps of 4096 and port priority 0 to 240 in steps of 16 on 802.1t or 802.1w bridges; port path costs \"in inverse proportion to the speed of the attached LAN\" (Table 13-4 of 802.1Q)", status: "active" }, // HTTP 200
    { id: "rfc4188", label: "RFC 4188, Definitions of Managed Objects for Bridges, September 2005: dot1dStpPriority, dot1dBaseBridgeAddress, dot1dStpPortPriority, dot1dStpPortPathCost, dot1dStpPortPathCost32, dot1dStpPortState", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc4188.txt", access_date: "2026-11-08", scope: "the 802.1t priority steps and the 16-bit 802.1D-1998 priority; the unique bridge address; the port ID octets; path costs 1 to 65535 and 1 to 200000000; the blocking and forwarding states", status: "active" }, // HTTP 200; Proposed Standard
    { id: "rfc9542", label: "RFC 9542, IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, April 2024 (BCP 141, obsoletes RFC 7042): sections 2.1.1 and 2.1.4", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc9542.txt", access_date: "2026-11-08", scope: "the documentation MAC block 00-00-5E-00-53-00 to 00-00-5E-00-53-FF used by the Examples, and the group (M) bit", status: "active" }, // HTTP 200
    { id: "ieee-sa-8021d", label: "IEEE SA, IEEE 802.1D-2004, Media Access Control (MAC) Bridges: Superseded Standard, published 2004-06-09, superseded by 802.1Q-2014", type: "reference", url: "https://standards.ieee.org/ieee/802.1D/3387/", access_date: "2026-11-08", scope: "where 802.1D-2004 stands: superseded by 802.1Q-2014", status: "active" }, // HTTP 200
    { id: "ieee-sa-8021q", label: "IEEE SA, IEEE 802.1Q-2022, Bridges and Bridged Networks: Active Standard, published 2022-12-22", type: "reference", url: "https://standards.ieee.org/ieee/802.1Q/10323/", access_date: "2026-11-08", scope: "the current home of RSTP and MSTP", status: "active" }, // HTTP 200
    { id: "juniper-stp-overview", label: "Juniper Networks, Spanning Tree Protocols User Guide, Junos OS: spanning tree protocols overview (bridge priority, root and designated bridge election, port roles and states)", type: "vendor-doc", url: "https://www.juniper.net/documentation/us/en/software/junos/stp-l2/topics/topic-map/spanning-tree-overview.html", access_date: "2026-11-08", scope: "lowest bridge ID is root, lowest MAC on equal priorities; equal path cost goes to the lowest bridge ID for the designated bridge; root, designated, alternate and backup roles; alternate and backup ports discard", status: "active" }, // HTTP 200
    { id: "juniper-cost", label: "Juniper Networks, Junos OS CLI Reference: cost (Protocols STP, RSTP, VSTP, MSTP)", type: "vendor-doc", url: "https://www.juniper.net/documentation/us/en/software/junos/cli-reference/topics/ref/statement/cost-edit-protocols-stp.html", access_date: "2026-11-08", scope: "\"The link cost is determined by the link speed\"; range 1 through 200,000,000", status: "active" }, // HTTP 200
    { id: "juniper-show-stp-interface", label: "Juniper Networks, Junos OS CLI Reference: show spanning-tree interface (example output)", type: "vendor-doc", url: "https://www.juniper.net/documentation/us/en/software/junos/cli-reference/topics/ref/command/show-stp-interface-command.html", access_date: "2026-11-08", scope: "port cost 20000 on a ge- interface and 2000 on xe- interfaces in the example output; port ID and designated port ID as priority and number", status: "active" }, // HTTP 200
    { id: "mikrotik-bridging", label: "MikroTik, RouterOS Manual 7.24: Bridging and Switching (bridge settings: priority, protocol-mode, port-cost-mode; port settings: path-cost, priority)", type: "vendor-doc", url: "https://manual.mikrotik.com/docs/7.24/bridging-and-switching/", access_date: "2026-11-08", scope: "port-cost-mode long or short, Default: long, with the long and short costs for 10 Mb/s to 100 Gb/s; priority in steps of 4096 recommended", status: "active" }, // HTTP 200
    { id: "mikrotik-stp", label: "MikroTik, RouterOS Manual 7.24: Spanning Tree Protocol user guide (default values, election process)", type: "vendor-doc", url: "https://manual.mikrotik.com/docs/7.24/bridging-and-switching/user-guides/spanning-tree-protocol/", access_date: "2026-11-08", scope: "root path cost as the sum of port path costs; root port by lowest root path cost, then lowest bridge identifier, then lowest bridge port ID of the upstream device; RouterOS before 7.13 gave every port 10", status: "active" }, // HTTP 200
    { id: "extreme-se-cost", label: "Extreme Networks, Switch Engine v33.7.1 Command References: configure stpd ports cost", type: "vendor-doc", url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/content/documents/Switch_Operating_Systems/Switch_Engine/Command_References/configure_stpd_ports_cost.shtml", access_date: "2026-11-08", scope: "default costs 2,000,000, 200,000, 20,000 and 2,000 for 10 Mb/s to 10 Gb/s; 100, 19, 4 and 2 in ExtremeXOS 11.5 and earlier; the 802.1D-2004 versus 802.1D-1998 warning; 1 to 65,535 on 802.1D-1998 bridges", status: "active" }, // HTTP 200
    { id: "extreme-se-priority", label: "Extreme Networks, Switch Engine v33.7.1 Command References: configure stpd priority", type: "vendor-doc", url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/content/documents/Switch_Operating_Systems/Common_EXOS_Switch_Engine/33.4.1/configure_stpd_priority.shtml", access_date: "2026-11-08", scope: "priority 0 to 61,440 in steps of 4,096 in dot1t priority mode, in steps of 1 in dot1d mode; extended-system-id 0 to 4095", status: "active" }, // HTTP 200
    { id: "extreme-fe-mstp", label: "Extreme Networks, Fabric Engine v9.4 User Guide: Configure Multiple Spanning Tree Protocol", type: "vendor-doc", url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/configuring_multiple_spanning_tree_protocol.shtml", access_date: "2026-11-08", scope: "spanning-tree mstp pathcost-type bits16 or bits32, \"The default is 32 bits.\"", status: "active" }, // HTTP 200
    { id: "cisco-c9300-stp", label: "Cisco, Layer 2 Configuration Guide, Cisco IOS XE 17.18.x (Catalyst 9300 Switches): Configuring Spanning Tree Protocol" + VIA_WEBFETCH, type: "vendor-doc", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/lyr2/b_1718_lyr2_9300_cg/configuring_spanning_tree_protocol.html", access_date: "2026-11-08", scope: "the 4-bit priority and 12-bit extended system ID equal to the VLAN ID; priority 0 to 61440 in steps of 4096; the default port costs by speed (2000000 for 10 Mbps to 2 for 10 Tbps); \"The short path cost method is the default STP path cost method used\"; the lowest interface number on equal cost; the port roles", status: "active" }, // HTTP 403 to curl; read via WebFetch
    { id: "cisco-c9300-26x-stp", label: "Cisco, Layer 2 Configuration Guide, Cisco IOS XE 26.x (Catalyst 9300): Configuring Spanning Tree Protocol" + VIA_WEBFETCH, type: "vendor-doc", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/26-x/configuration_guide/lyr2/b_26x_lyr2_9300_cg/configuring_spanning_tree_protocol.html", access_date: "2026-11-08", scope: "the same note (short is the default method) and the same default cost table as 17.18", status: "active" }, // HTTP 403 to curl; read via WebFetch
    { id: "cisco-c9000-stp", label: "Cisco, STP Configuration Guide, Cisco IOS XE 17: Spanning Tree Protocol (updated 17 July 2026)" + VIA_WEBFETCH, type: "vendor-doc", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/stp/stp-configuration-guide/m-stp.html", access_date: "2026-11-08", scope: "\"The short path cost method is the default STP path cost method\", beside a default cost table on the long scale", status: "active" }, // HTTP 403 to curl; read via WebFetch
    { id: "cisco-c9300-1718-cr", label: "Cisco, Command Reference, Cisco IOS XE 17.18.x (Catalyst 9300 Switches): Layer 2/3 Commands, spanning-tree pathcost method, spanning-tree cost, show spanning-tree" + VIA_BROWSER, type: "vendor-doc", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/command_reference/b_1718_9300_cr/layer_2_3_commands.html", access_date: "2026-11-08", scope: "spanning-tree pathcost method: \"Command Default: short\", long and short as the 32-bit and 16-bit default port costs; spanning-tree cost 1 to 200000000; the show spanning-tree summary example prints \"Configured Pathcost method used is long\" and the detail example \"Port path cost 20000\"", status: "active" }, // HTTP 403 to curl; read in PRIME's Chrome
    { id: "cisco-c9300-26x-cr", label: "Cisco, Command Reference, Cisco IOS XE 26.x.x (Catalyst 9300 Switches): Layer 2/3 Commands, spanning-tree pathcost method" + VIA_BROWSER, type: "vendor-doc", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/26-x/command_reference/b_26x_9300_cr/layer_2_3_commands.html", access_date: "2026-11-08", scope: "the same \"Command Default: short\" as 17.18", status: "active" }, // HTTP 403 to curl; read in PRIME's Chrome
    { id: "huawei-stp-cr", label: "Huawei, S5700 and S6700 V200R025C00 Command Reference: STP/RSTP/MSTP/VBST Configuration Commands, stp pathcost-standard (Table 5-92), stp cost, stp mode" + VIA_BROWSER, type: "vendor-doc", url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/9ccc5041/stp-rstp-mstp-vbst-configuration-commands", access_date: "2026-11-08", scope: "\"By default, the IEEE 802.1t is used to calculate the path cost\"; stp pathcost-standard { dot1d-1998 | dot1t | legacy }; Table 5-92 by rate and mode (full duplex: 1 Gbit/s 4 and 20,000, 2.5 Gbit/s 3 and 8000, 10 Gbit/s 2 and 2000, 40 Gbit/s 1 and 500; one less at 10 and 100 Mbit/s full duplex; aggregated links lower); changing the standard restores every port's default cost; stp cost 1 to 200,000,000 under 802.1t; MSTP is the default mode", status: "active" }, // HTTP 403 to curl; read in PRIME's Chrome
    { id: "cisco-225591", label: "Cisco, Troubleshoot STP Root Inconsistency Due to Path Cost Mismatch, document 225591, updated 11 March 2026" + VIA_WEBFETCH, type: "vendor-doc", url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/per-vlan-spanning-tree-plus-pvst-/225591-troubleshoot-stp-root-inconsistency-due.html", access_date: "2026-11-08", scope: "spanning-tree pathcost method long; a switch on short costs among switches on long costs, fixed by changing it to long", status: "active" }, // read via WebFetch
    { id: "aruba-cx-cost", label: "HPE Aruba Networking, AOS-CX 10.16 Layer-2 Bridging Guide (6300/6400): spanning-tree cost" + VIA_WEBFETCH, type: "vendor-doc", url: "https://arubanetworking.hpe.com/techdocs/AOS-CX/10.16/HTML/l2_bridging_6300-6400/Content/Chp_stp/mstp_cmds/spa-tre-cos.htm", access_date: "2026-11-08", scope: "range 1 to 200,000,000; default by link speed, 2,000,000 for 10 Mbps to 20 for 1 Tbps; no method command on the page", status: "active" }, // HTTP 403 to curl; read via WebFetch
    { id: "arista-eos-stp", label: "Arista Networks, EOS 4.37.0F User Manual: Spanning Tree Protocol" + VIA_WEBFETCH, type: "vendor-doc", url: "https://www.arista.com/en/um-eos/eos-spanning-tree-protocol", access_date: "2026-11-08", scope: "1 gigabit 20000 and 10 gigabit 2000 by default, 1 to 200000000; priority multiples of 4096; the bridge ID's 12-bit field (VLAN for Rapid-PVST, instance for MST, 0 for RST); the lower interface number on equal port priority; no method setting", status: "active" }, // HTTP 406 to curl; read via WebFetch
    { id: "ciscopress-scaling", label: "Cisco Networking Academy, Scaling Networks Companion Guide, Cisco Press, 2014 (ISBN 978-1-58713-328-2), chapter 2: Table 2-1", type: "reference", url: "https://ptgmedia.pearsoncmg.com/images/9781587133282/downloads/9781587133282%20_chapter_2.pdf", access_date: "2026-11-08", scope: "the short costs 100, 19, 4 and 2 for 10 Mb/s to 10 Gb/s", status: "active" }, // HTTP 200
    { id: "rfc-index", label: "RFC Editor, RFC index (XML): the current status of RFC 4188, RFC 9542 and RFC 7042", type: "registry", url: "https://www.rfc-editor.org/rfc-index.xml", access_date: "2026-11-08", scope: "RFC 4188 is a Proposed Standard, neither obsoleted nor updated; RFC 9542 (BCP 141) obsoletes RFC 7042", status: "active" }, // HTTP 200
    { id: "rfc3986", label: "RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, January 2005: section 3.5 (fragment)", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3986.txt", access_date: "2026-11-08", scope: "the fragment that carries a Share results link's values is not sent to the server", status: "active" }, // HTTP 200
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = STP_VECTORS; // every vector
