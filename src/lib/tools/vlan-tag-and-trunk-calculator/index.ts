// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vlan-tag-and-trunk-calculator/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the 802.1Q tag decoder
// and trunk VLAN calculator (08/11/2026). Every source below was read on
// 2026-11-08: downloaded with curl (user agent "Mozilla/5.0 (compatible;
// source-check)", no-cache headers, a cache-busting query; HTTP 200), except
// the Cisco and HPE Aruba pages, whose sites answered curl with HTTP 403, and
// which were read with WebFetch instead (each is marked "read via WebFetch").
// The files and the logs are in the build's work folder (sources/). The RFC
// Editor's index (rfc-index.xml, read the same day): RFC 9542 is a Best
// Current Practice (BCP 141) that obsoletes RFC 7042 and is itself neither
// obsoleted nor updated. IEEE P802.1ad/D2.4 is an unapproved draft of 2004,
// published openly by the IEEE 802.1 working group: it is read for the tag
// format and the tables 802.1Q has kept, and every label says it is a draft;
// the current IEEE YANG models and MIB modules are read beside it.
// 2026-11-08b: Arista EOS and Huawei VRP, which the course also covers, are
// read now: their pages, the Cisco 17.18 command reference and the AOS-CX 10.16
// vlan trunk native pages (whose earlier CLI-Bank addresses answer 404) were
// read in PRIME's browser on 2026-11-08, because those sites refuse automated
// reads (curl 403 or 406); each such label ends "(read in a browser on
// 2026-11-08: the site refuses automated reads)". The vla-tru-all page was read
// there too (20:12 São Paulo time): live, with the passages quoted below.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, VLAN_VECTORS } from "./golden-vectors"; // the set id and the vectors

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, tagLocalisable, trunkLocalisable, ianaEthertype, rangesText, VlanInputError, VENDORS, VENDOR_NAMES, MAX_TEXT, MAX_LINES, MAX_LINE, MAX_OCTETS, MAX_TAGS, VID_MIN, VID_MAX } from "./compute"; // values
export type { Mode, TagStart, TagRequest, VendorId, TrunkEndRequest, TrunkRequest, VlanRequest, MacReading, TagKind, PcpDecoding, VidMeaning, TagReading, NextReading, TagResult, Range, LineReading, UntaggedIn, EndReading, Outcome, Direction, FateRow, TrunkResult, VlanResult } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, VLAN_VECTORS, EXAMPLE_TAG_REQUEST, TAG_CHIPS, EXAMPLE_TRUNK_REQUEST, TRUNK_CHIPS, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { VlanVector, VerifyReport, Contains } from "./golden-vectors"; // their shapes

/** The D-49 declarative manifest for the 802.1Q tag decoder and trunk VLAN calculator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking", // must equal the catalogue family (D-73)
  toolSlug: "vlan-tag-and-trunk-calculator", // the route segment and API path
  canonicalAliases: [
    "802.1q tag decoder", // the obvious search
    "vlan tag decoder", // the same, plainly
    "tpid pcp dei vid", // the four fields
    "q-in-q decoder", // stacked tags
    "802.1ad s-tag", // the service tag
    "trunk allowed vlan compare", // the trunk question
    "native vlan mismatch", // the classic fault
    "port trunk allow-pass vlan", // Huawei VRP's trunk list
    "switchport trunk native vlan", // Cisco's and Arista's native VLAN
  ],
  inputDetectors: [
    {
      // A tag or a frame's start as hexadecimal: starts with a TPID, or with 12 octets of MAC then a type (two digits a group).
      kind: "regex",
      pattern: "^(?:0[xX])?(?:81|88|91)[\\s:.-]?(?:00|[aA]8)[\\s:.-]?[0-9a-fA-F]{2}", // 81 00, 88 a8 or 91 00 at the start
      priority: 2,
      example: "81 00 a0 14 08 00", // the Example's tag (golden vector api-tag)
    },
    {
      // A form for trunks: two vendors' lines. The example is the API body of golden vector api-trunk.
      kind: "structured-form",
      pattern: "mode (tag | trunk) + input | a/b { vendor, config }",
      priority: 1,
      example: '{"mode":"trunk","a":{"vendor":"cisco-ios-xe","config":"10,20"},"b":{"vendor":"aruba-aos-cx","config":"10,20"}}', // golden vector api-trunk
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // bit arithmetic, a table lookup and set arithmetic: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: VLAN_VECTORS.length, // 176: 71 from the oracle, 46 sentences and runs, 51 refusals, 8 API (2026-11-08b)
  dangerousInputHandling: [
    "redos-guard", // anchored patterns with bounded repetition only
    "length-bound", // 4,000 characters a field, 128 octets, 8 tags, 64 lines an end, 256 characters a line
    "no-guessing", // a vendor behaviour the pages read do not state is shown as not confirmed, never computed; Huawei port trunk allow-pass only-vlan, a command for trunks negotiated through LNP, is refused on the static trunks the tool reads, with the reason quoted
    "share-input-caution", // Share results (2026-11-08) builds a link only when pressed: the octets (tag mode) or both ends' vendor and lines (trunk mode), as typed, after the #, with a caution line (MAC addresses identify devices; interface and VLAN names describe a private network)
  ],
  shareSafetyDefault: "fragment", // frame octets carry MAC addresses, and trunk lines carry interface and VLAN names of a private network

  // -- Teaching & provenance --
  learnLinks: ["learn/vlans-and-8021q-trunking", "learn/the-ethernet-frame-field-by-field"], // the articles whose tag, native VLAN and allowed-list sections this tool computes
  sources: [
    {
      id: "ieee8021ad-d24", // the tag format and the tables
      label: "IEEE P802.1ad/D2.4, Provider Bridges (unapproved draft amendment to IEEE Std 802.1Q, 27 September 2004): clause 9 and Tables 9-1, 9-2, 6-5 and G-2", // what the engine applies
      type: "standard", // an IEEE draft, published openly
      url: "https://www.ieee802.org/1/files/public/docs2004/802-1-ad-D2-4.pdf", // fetched 2026-11-08, HTTP 200, 1,114,321 bytes
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the tag: TPID then TCI (PCP bits 8 to 6, then CFI in a C-TAG or DE in an S-TAG, then the 12-bit VID); C-TAG 81-00; VID 0 the null VLAN ID, 1 the default PVID, FFF reserved and never transmitted; the PCP decoding under 8P0D, 7P1D, 6P2D and 5P3D; the traffic type of each priority; the S-TAG outside the C-TAG", // what it pins
      status: "active", // the link resolves; the document is a draft, and every label says so
    },
    {
      id: "ieee-yang-types", // current data model
      label: "IEEE 802.1, ieee802-dot1q-types YANG module, revision 2023-10-26: c-vlan (81-00), s-vlan (88-A8), vlanid 1..4094, vlan-index-type, priority-type, pcp-selection-type", // what the engine applies
      type: "standard", // the IEEE's own model
      url: "https://raw.githubusercontent.com/YangModels/yang/main/standard/ieee/published/802.1/ieee802-dot1q-types.yang", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the two tag types and their EtherTypes as 802.1Q has them today; the VLAN ID range; values 0 and 4095 not permitted as VLAN indices; the four PCP selections", // what it pins
      status: "active", // published module
    },
    {
      id: "ieee-yang-bridge", // DEI and PVID
      label: "IEEE 802.1, ieee802-dot1q-bridge YANG module, revision 2023-10-26: pvid (default 1) and use-dei", // what the engine applies
      type: "standard", // the IEEE's own model
      url: "https://raw.githubusercontent.com/YangModels/yang/main/standard/ieee/published/802.1/ieee802-dot1q-bridge.yang", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the Drop Eligible Indicator in the VLAN tag, used only when use-dei is True and otherwise transmitted as zero and ignored on receipt; the PVID, \"the primary (default) VID assigned to a specific Bridge Port\", default 1", // what it pins
      status: "active", // published module
    },
    {
      id: "ieee-q-bridge-mib", // the PVID's definition
      label: "IEEE 802.1, IEEE8021-Q-BRIDGE-MIB (LAST-UPDATED 2022-11-08): ieee8021QBridgePvid", // what the engine applies
      type: "standard", // the IEEE's own MIB module
      url: "https://www.ieee802.org/1/files/public/MIBs/IEEE8021-Q-BRIDGE-MIB-202211080000Z.mib", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the PVID is \"the VLAN-ID assigned to untagged frames or Priority-tagged frames received on this port\": the rule by which an untagged frame lands in the receiver's native VLAN", // what it pins
      status: "active", // published module
    },
    {
      id: "ieee-sa-8021q", // currency
      label: "IEEE Standards Association, IEEE 802.1Q-2022, Bridges and Bridged Networks: Active Standard", // what it pins
      type: "registry", // the IEEE's record
      url: "https://standards.ieee.org/ieee/802.1Q/10323/", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "802.1Q-2022 is the current, active edition; its full text is not public, which is why the public draft, YANG and MIB are read", // what it pins
      status: "active", // the record
    },
    {
      id: "rfc9542", // MACs and EtherTypes
      label: "RFC 9542, IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, April 2024 (BCP 141; obsoletes RFC 7042): sections 2.1.1, 2.1.4 and 3", // what the engine applies
      type: "standard", // Best Current Practice
      url: "https://www.rfc-editor.org/rfc/rfc9542.txt", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the M (group) and X (local) bits; the documentation MAC addresses; EtherTypes 0x0600 and above, lengths below 0x05DD, 0x8870 for LLC encapsulation; tags followed by another tag, an EtherType or an LSAP", // what it pins
      status: "active", // BCP 141, neither obsoleted nor updated (rfc-index.xml, 2026-11-08)
    },
    {
      id: "iana-ieee-802", // EtherType names
      label: "IANA, IEEE 802 Numbers: Ethertypes (last updated 2024-11-03)", // what the engine applies
      type: "registry", // IANA's list
      url: "https://www.iana.org/assignments/ieee-802-numbers/ieee-802-numbers.xml", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the 216 rows packed in ethertypes.ts, shown as IANA publishes them; IANA's caveat that the list is contributed and unverified and that the IEEE Registration Authority keeps the public list", // what it pins
      status: "active", // the registry
    },
    {
      id: "aruba-qos-traffic-types", // today's vendor reading of the traffic types
      label: "HPE Aruba Networking, AOS-CX 10.14 Quality of Service Guide (4100i, 6000, 6100), End-to-end QoS behavior: CoS and traffic type (read via WebFetch)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://arubanetworking.hpe.com/techdocs/AOS-CX/10.14/HTML/qos_4100i-6000-6100/Content/Chp_Overview/end-to-end-qos-beh.htm", // curl HTTP 403 on 2026-11-08; read via WebFetch the same day
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the same eight traffic types for CoS 0 to 7 as the draft's Table G-2, and \"CoS 1 is deliberately set as the lowest CoS\"", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "juniper-bridging", // Junos rules and the 0x9100 TPID
      label: "Juniper Networks, Bridging and VLANs (Junos OS, Layer 2 networking): VLAN IDs, TPIDs, native VLAN on switches with ELS", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://www.juniper.net/documentation/us/en/software/junos/multicast-l2/topics/topic-map/bridging-and-vlans.html", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "VLAN IDs 0 and 4095 reserved by Junos; the TPID 0x9100 for Q-in-Q; an ELS trunk does not recognise untagged data packets without native-vlan-id, and the logical interface must be a member of the native VLAN; vlan members by name or ID", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "juniper-vlan-ids", // VLAN 0 for priority
      label: "Juniper Networks, 802.1Q VLAN IDs and Ethernet Interface Types", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://www.juniper.net/documentation/us/en/software/junos/multicast-l2/topics/concept/ethernet-802-1q-vlan-id-by-interface-type.html", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "\"VLAN ID 0 is reserved for tagging the priority of frames\"", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "juniper-ethernet-switching", // ranges in vlan members
      label: "Juniper Networks, Ethernet Switching User Guide (Junos OS), published 2026-09-23: vlan members ranges and set adding to the members", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://www.juniper.net/documentation/us/en/software/junos/multicast-l2/multicast-l2.pdf", // fetched 2026-11-08, HTTP 200, 4,899,915 bytes
      access_date: "2026-11-08", // read the day the tool was built
      scope: "vlan members 120-130 and members 500-501 (ranges); successive set lines adding to members [ 1 sales support ]", // what it pins
      status: "active", // the guide resolves
    },
    {
      id: "cisco-9300-1718-trunks", // Cisco trunks
      label: "Cisco, VLAN Configuration Guide, Cisco IOS XE 17.18.x (Catalyst 9300 Switches), Configuring VLAN Trunks, updated 31 July 2025 (read via WebFetch; read again in a browser on 2026-11-08: the site refuses automated reads)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/vlan/b_1718_vlan_9300_cg/configuring_vlan_trunks.html", // curl HTTP 403 on 2026-11-08; read via WebFetch the same day, and in PRIME's browser at 19:53-19:56 São Paulo time
      access_date: "2026-11-08", // read the day the tool was built
      scope: "all VLANs allowed by default; no spaces in the list; VLAN 1 the default VLAN on all trunk ports, removable, management traffic continues; native VLAN 1 by default, untagged traffic forwarded in it, sent untagged on egress; the mismatch warning; nothing, in any sentence on the native VLAN, about a native VLAN left out of the allowed list", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "cisco-9300-1718-vlans", // reserved VLANs
      label: "Cisco, VLAN Configuration Guide, Cisco IOS XE 17.18.x (Catalyst 9300 Switches), Configuring VLANs, updated 31 July 2025 (read via WebFetch)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/vlan/b_1718_vlan_9300_cg/configuring_vlans.html", // curl HTTP 403 on 2026-11-08; read via WebFetch the same day
      access_date: "2026-11-08", // read the day the tool was built
      scope: "VLAN IDs 1002 to 1005 reserved for Token Ring and FDDI VLANs, not forwarded by the device; VLAN 1 the default VLAN", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "cisco-9300-1718-cr", // Cisco 17.18 command reference (2026-11-08b)
      label: "Cisco, Command Reference, Cisco IOS XE 17.18.x (Catalyst 9300 Switches), VLAN Commands: switchport trunk (read in a browser on 2026-11-08: the site refuses automated reads)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/command_reference/b_1718_9300_cr/vlan_commands.html", // curl HTTP 403; read in PRIME's browser at 19:53-19:56 São Paulo time (its address and passages confirmed with WebFetch at 20:00)
      access_date: "2026-11-08", // read the day the tool was updated
      scope: "the allowed list is the VLANs that \"receive and send traffic on this interface in tagged format\"; the native VLAN is for \"sending and receiving untagged traffic\"; VLAN 1 the default native VLAN; every VLAN list includes all VLANs by default; a packet of the native VLAN \"is sent without a tag\"; no sentence on a native VLAN left out of the allowed list", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "cisco-9300-1717-cr", // Cisco keywords
      label: "Cisco, Command Reference, Cisco IOS XE 17.17.x (Catalyst 9300 Switches), VLAN Commands: switchport trunk (read via WebFetch)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-17/command_reference/b_1717_9300_cr/vlan_commands.html", // curl HTTP 403 on 2026-11-08; read via WebFetch the same day
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the vlan-list format all | none | [add | remove | except] vlan-atom[,vlan-atom...]; all is 1 to 4094 and the default; the no forms; the native VLAN default 1; the allowed list is for traffic in tagged format", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "aruba-1016-trunk-allowed", // AOS-CX allowed
      label: "HPE Aruba Networking, AOS-CX 10.16 Layer 2 Bridging Guide (6300/6400): vlan trunk allowed (read via WebFetch; read again in a browser on 2026-11-08: the site refuses automated reads)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://arubanetworking.hpe.com/techdocs/AOS-CX/10.16/HTML/l2_bridging_6300-6400/Content/Chp_vlans/vlan_cmds/vla-tru-all.htm", // curl HTTP 403 on 2026-11-08 (the CDN answers 403 for a page that does not exist too); read via WebFetch at 17:31 and 19:58, and in PRIME's browser at 20:12 São Paulo time: live, the same passages
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the VLAN-LIST format; all meaning every VLAN configured on the switch, now and later; multiple VLAN IDs assigned; the no form removing; the last VLAN removed trunking all VLANs", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "aruba-trunk-native", // AOS-CX native
      label: "HPE Aruba Networking, AOS-CX 10.16 Layer 2 Bridging Guide (6300/6400): vlan trunk native (read in a browser on 2026-11-08: the site refuses automated reads)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://arubanetworking.hpe.com/techdocs/AOS-CX/10.16/HTML/l2_bridging_6300-6400/Content/Chp_vlans/vlan_cmds/vla-tru-nat.htm", // curl HTTP 403; read in PRIME's browser at 19:58 São Paulo time (the CLI-Bank address cited before answers 404 Not Found)
      access_date: "2026-11-08", // read the day the tool was updated
      scope: "native VLAN 1 by default; setting it runs vlan trunk allowed all; a later allowed list keeps only the VLANs it names; the no form returns to VLAN 1; the example \"Assigning native VLAN ID 20 to trunk interface 1/1/2 and then removing it from the list of allowed VLANs. (Only allow VLAN 10 on the trunk.)\": a native VLAN left out of the allowed list is not carried", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "aruba-trunk-native-tag", // AOS-CX tagged native
      label: "HPE Aruba Networking, AOS-CX 10.16 Layer 2 Bridging Guide (6300/6400): vlan trunk native tag (read in a browser on 2026-11-08: the site refuses automated reads)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://arubanetworking.hpe.com/techdocs/AOS-CX/10.16/HTML/l2_bridging_6300-6400/Content/Chp_vlans/vlan_cmds/vla-tru-nat-tag.htm", // curl HTTP 403; read in PRIME's browser at 19:58 São Paulo time (the CLI-Bank address cited before answers 404 Not Found)
      access_date: "2026-11-08", // read the day the tool was updated
      scope: "untagged incoming packets dropped except BPDUs; egress packets tagged", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "mikrotik-724-bridging", // RouterOS
      label: "MikroTik, RouterOS Manual 7.24: Bridging and Switching, Bridge VLAN Filtering", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://manual.mikrotik.com/docs/7.24/bridging-and-switching/", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "vlan-ids lists (100-115,120); tagged and untagged ports of the bridge VLAN table; pvid 1 by default; frame-types admit-all by default, and a port that admits untagged frames added as untagged for its PVID; VLANs missing from the table dropped; several untagged VLANs on one port warned against", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "extreme-se-3371-cr", // Switch Engine
      label: "Extreme Networks, Switch Engine v33.7.1 Command References: configure vlan add ports (p. 1569), configure vlan tag (p. 1605), configure vlan untagged-ports auto-move (p. 1608), create vlan (p. 1782)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/downloads/Switch_Engine_33_7_1_Command_References.pdf", // fetched 2026-11-08, HTTP 200, 19,267,991 bytes
      access_date: "2026-11-08", // read the day the tool was built
      scope: "tagged or untagged ports, untagged by default; one untagged VLAN a port; Default (tag 1) untagged on all ports; tags 2 to 4094 (4095 for the management VLAN); auto-move inform by default", // what it pins
      status: "active", // the reference resolves
    },
    {
      id: "extreme-fe-94-ug", // Fabric Engine VLAN range
      label: "Extreme Networks, Fabric Engine v9.4 User Guide: Add or Remove Ports in a VLAN", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/adding_or_removing_ports_in_a_vlan.shtml", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "vlan members add and remove with one VLAN ID, 1 to 4059; 4060 to 4094 reserved for internal use, and 3500 to 3998 with the vrf-scaling and spbm-config-mode boot flags; VLAN 1 the default VLAN", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "extreme-fe-94-cr", // Fabric Engine commands
      label: "Extreme Networks, Fabric Engine v9.4 Command References: default-vlan-id (p. 139), untag-port-default-vlan (p. 345), encapsulation dot1q", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20Command%20References/downloads/Fabric_Engine_9_4_Command_References.pdf", // fetched 2026-11-08, HTTP 200, 9,566,879 bytes
      access_date: "2026-11-08", // read the day the tool was built
      scope: "default-vlan-id 0 to 4059; untag-port-default-vlan untags the default VLAN, disabled by default; encapsulation dot1q enables tagging", // what it pins
      status: "active", // the reference resolves
    },
    {
      id: "arista-eos-437-vlans", // Arista EOS (2026-11-08b)
      label: "Arista Networks, EOS 4.37.0F User Manual, Virtual LANs (VLANs): switchport mode, switchport trunk allowed vlan, switchport trunk native vlan (read in a browser on 2026-11-08: the site refuses automated reads)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://www.arista.com/en/um-eos/eos-virtual-lans-vlans", // curl HTTP 406 on 2026-11-08 (also with an Accept header); read in PRIME's browser at 19:44 and 20:27-20:30 São Paulo time
      access_date: "2026-11-08", // read the day the tool was updated
      scope: "trunk mode: \"Untagged traffic is associated with the interface's native VLAN\"; default mode access; allowed vlan v_range (\"number, range, or comma-delimited list of numbers and ranges\"), add, all, except, none, remove, all by default (\"interfaces handle tagged traffic for all VLANs\"), no and default restoring all; native vlan default 1, the no and default forms \"restore vlan 1 as the trunk mode native VLAN\", native traffic leaving untagged unless egress priority tagging sends \"priority tagged Ethernet frames in place of untagged frames\"; tag (\"tag interface drops all untagged frames\"; nothing on the native VLAN's egress then, so an allowed native VLAN is not confirmed); the example output \"Trunking Native Mode VLAN: 1 (inactive)\" for an allowed list of 6-10, read as not carried", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "huawei-s5700-v200r025-vlan-cr", // Huawei VRP commands (2026-11-08b)
      label: "Huawei, S5700 and S6700 V200R025C00 Command Reference, VLAN Configuration Commands: port link-type, port trunk allow-pass vlan, port trunk pvid vlan (read in a browser on 2026-11-08: the site refuses automated reads)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/834147df/vlan-configuration-commands", // curl HTTP 403 on 2026-11-08; read in PRIME's browser at 19:40 and 20:27-20:30 São Paulo time
      access_date: "2026-11-08", // read the day the tool was updated
      scope: "port link-type default negotiation-desirable (negotiation-auto on the S5736-S); allow-pass vlan { vlan-id1 [ to vlan-id2 ] }&<1-10> | all (\"Adds a trunk interface to all VLANs\"), cumulative across lines, the undo form removing; allow-pass only-vlan for a trunk negotiated through LNP only (prerequisite port link-type negotiation); \"By default, a trunk interface is in VLAN 1\"; a VLAN that does not exist does not take effect (said, not modelled); pvid vlan 1 to 4094, default 1, the latest line winning, the undo form restoring the default, forwarded \"only after it is added to the default VLAN using the port trunk allow-pass vlan command\"", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "huawei-s5700-v200r025-tags", // Huawei VRP frame handling (2026-11-08b)
      label: "Huawei, S5700 and S6700 V200R025C00 Configuration Guide - Ethernet Switching, VLAN Configuration, Adding and Removing VLAN Tags: Table 4-2 (read in a browser on 2026-11-08: the site refuses automated reads)", // what the engine applies
      type: "vendor-doc", // vendor documentation
      url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514531/f9b8a34a/adding-and-removing-vlan-tags", // curl HTTP 403 on 2026-11-08; read in PRIME's browser at 20:08 São Paulo time
      access_date: "2026-11-08", // read the day the tool was updated
      scope: "a trunk port: an untagged frame takes the default VLAN ID and is transmitted when that VLAN is permitted, discarded when it is denied; a tagged frame accepted only when its VLAN is permitted; on egress the default VLAN's frames leave untagged when permitted, other permitted VLANs tagged", // what it pins
      status: "active", // the page resolves
    },
    {
      id: "rfc-index", // currency
      label: "RFC Editor, RFC index (XML): the current status of RFC 9542 and RFC 7042", // what it pins
      type: "registry", // the RFC Editor's own record
      url: "https://www.rfc-editor.org/rfc-index.xml", // fetched 2026-11-08, HTTP 200, 13,750,139 bytes
      access_date: "2026-11-08", // read the day the tool was built
      scope: "RFC 9542 (BCP 141) obsoletes RFC 7042 and is neither obsoleted nor updated", // what it pins
      status: "active", // the index
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = VLAN_VECTORS; // every vector
