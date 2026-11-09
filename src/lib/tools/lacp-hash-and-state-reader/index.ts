// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/lacp-hash-and-state-reader/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the LACP member link and
// state reader (08/11/2026). Every source below was read on 2026-11-08: with
// curl (generic User-Agent, no-cache headers, a cache-busting query) where the
// site answered it, HTTP 200; the Cisco, HPE Aruba and Arista pages refused
// curl (HTTP 403, and 406 for Arista) and were read through WebFetch, and each
// of those labels says so. IEEE 802.1AX-2020 is offered through the IEEE GET
// Program, behind an IEEE account: it was not read, and its published MIB
// module stands in for the state bits. The files and the log are in the
// build's work folder.
//
// Second set (08/11/2026, evening): Huawei's support site and the Debian wiki
// refuse automated reads (HTTP 403, and a bot challenge for the wiki), so the
// pages behind the two new sources were read in a browser on PRIME's machine,
// and their labels end with VIA_BROWSER: Huawei's Link Aggregation Commands
// (display eth-trunk's PortState and Status words, load-balance) and Debian's
// table of architectures (the byte-order examples beside the control).
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, LACP_VECTORS } from "./golden-vectors"; // the set id and the vectors

/** Appended to the label of a source read in a browser because the site refuses automated reads. */
const VIA_BROWSER = " (read in a browser on 2026-11-08: the site refuses automated reads)"; // the house wording

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, linkLocalisable, stateLocalisable, LacpInputError, SENTENCES, MAX_FIELD, MIN_MEMBERS, MAX_MEMBERS, MAX_SPREAD, MAX_DISPLAY, MAX_DISPLAY_LINES, MAX_LINE, HUAWEI_STATUSES, ETHERTYPE_IPV4, ETHERTYPE_IPV6, POLICIES, CISCO_SPLIT, BIT_NAMES } from "./compute"; // values
export type { LinkPolicy, ByteOrder, SpreadField, StateFormat, LinkRequest, StateRequest, LacpRequest, HashStep, SpreadResult, LinkResult, StateBit, StateSide, StateFinding, StateResult, LacpResult, HuaweiStatus, HuaweiMember, HuaweiReading } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, LACP_VECTORS, EXAMPLE_LINK_REQUEST, EXAMPLE_STATE_REQUEST, LINK_SAMPLES, STATE_SAMPLES, HUAWEI_DISPLAY_EXAMPLE, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { LacpVector, VerifyReport } from "./golden-vectors"; // their shapes

/** The D-49 declarative manifest for the LACP member link and state reader. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking", // must equal the catalogue family (D-73)
  toolSlug: "lacp-hash-and-state-reader", // the route segment and API path
  canonicalAliases: [
    "lacp hash calculator", // the obvious search
    "which link of a lag carries a flow", // the question
    "linux bonding xmit_hash_policy", // the hash it computes
    "layer3+4 hash", // the policy people look up
    "lacp state flags decoder", // the other question
    "lacp actor partner state", // the show-command words
    "lacp port state 0x3d", // Cisco's expected value
    "etherchannel load balance", // Cisco's word
    "huawei display eth-trunk portstate", // Huawei's form (second set)
  ],
  inputDetectors: [
    {
      // A form, not a paste: nothing to detect in free text. The example is the page's state Example as an API body.
      kind: "structured-form",
      pattern: "mode (link | state) + policy, members and the flow's fields / actor and partner state values",
      priority: 1,
      example: '{"mode":"state","format":"octet","actor":"0x3F","partner":"0x3F"}', // golden vector example-state
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // bit arithmetic and lookups only: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: LACP_VECTORS.length, // the count, from the set itself
  dangerousInputHandling: [
    "redos-guard", // anchored patterns with bounded repetition only
    "length-bound", // every field at most 64 characters; a pasted display eth-trunk output at most 8192 characters and 96 non-blank lines; 2 to 8 members; a spread of at most 4096 flows
    "share-input-caution", // Share results (2026-11-08) builds a link only when pressed, carrying the mode's fields as typed after the #, with a caution line in link mode (MAC and IP addresses and ports can name hosts on a private network) and for a pasted display eth-trunk output (system IDs and interface names)
  ],
  shareSafetyDefault: "fragment", // the link mode's addresses and ports can name hosts on a private network

  // -- Teaching & provenance --
  learnLinks: ["learn/link-aggregation-and-lacp", "learn/big-endian-and-little-endian"], // the article whose hashing and LACP sections this tool computes, and the one on byte order linked beside the control
  sources: [
    {
      id: "linux-bonding-howto", // the hash, in words
      label: "The Linux kernel, Linux Ethernet Bonding Driver HOWTO (Documentation/networking/bonding.rst): xmit_hash_policy, lacp_active and lacp_rate", // what the engine applies
      type: "vendor-doc", // the kernel's own documentation
      url: "https://docs.kernel.org/networking/bonding.html", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the layer2, layer2+3, layer3+4 and vlan+srcmac formulas, the modulo slave count, IPv6 through ipv6_addr_hash, ports of unfragmented TCP and UDP only, layer2 as the default; lacp_active (\"speak when spoken to\") and lacp_rate (request the partner to transmit every 30 seconds or every second)", // what it pins
      status: "active", // the living documentation
    },
    {
      id: "linux-bond-main", // the hash, in code
      label: "The Linux kernel source, drivers/net/bonding/bond_main.c (torvalds/linux master): bond_eth_hash, bond_vlan_srcmac_hash, bond_ip_hash, __bond_xmit_hash, bond_update_slave_arr and bond_xmit_3ad_xor_slave_get", // what the engine applies
      type: "vendor-doc", // the implementation itself
      url: "https://raw.githubusercontent.com/torvalds/linux/master/drivers/net/bonding/bond_main.c", // fetched 2026-11-08, HTTP 200, 184,254 bytes
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the EtherType as be16_to_cpu(h_proto); the addresses and ports read as the processor holds them (the byte-order difference); the lowest bit discarded for layer3+4; vlan+srcmac built byte by byte; the members that can transmit, in the bond's order, and arr[hash % count]", // what it pins
      status: "active", // the current tree
    },
    {
      id: "linux-headers", // the definitions the hash and the state use
      label: "The Linux kernel source, include/net/flow_dissector.h, net/core/flow_dissector.c, include/net/ipv6.h, include/linux/if_vlan.h and include/uapi/linux/if_bonding.h (torvalds/linux master)", // what the engine applies
      type: "vendor-doc", // the implementation itself
      url: "https://raw.githubusercontent.com/torvalds/linux/master/include/net/flow_dissector.h", // fetched 2026-11-08, HTTP 200, with the four other files (status log)
      access_date: "2026-11-08", // read the day the tool was built
      scope: "flow_keys.ports with the source port first; flow_get_u32_src/dst as the raw IPv4 address or ipv6_addr_hash (the XOR of four 32-bit words); skb_vlan_tag_get as vlan_tci, priority included; LACP_STATE_LACP_ACTIVITY 0x1 to LACP_STATE_EXPIRED 0x80", // what it pins
      status: "active", // the current tree
    },
    {
      id: "linux-bond-3ad", // the LACP machines
      label: "The Linux kernel source, drivers/net/bonding/bond_3ad.c (torvalds/linux master): the periodic and receive machines and the timer constants", // what the engine applies
      type: "vendor-doc", // the implementation itself
      url: "https://raw.githubusercontent.com/torvalds/linux/master/drivers/net/bonding/bond_3ad.c", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "fast 1 s and slow 30 s periodic times, short 3 s and long 90 s timeouts; no periodic transmission when actor and partner are both passive; transmission at the rate the partner's timeout bit asks for, the partner timed out by the actor's own bit; Expired then Defaulted; the default partner state 0", // what it pins
      status: "active", // the current tree
    },
    {
      id: "cisco-12023", // the documented spread
      label: "Cisco, Understand EtherChannel Load Balance and Redundancy on Catalyst Switches, document 12023, updated 30 November 2023 (read through WebFetch: cisco.com refused curl with HTTP 403)", // what the engine applies
      type: "vendor-doc", // Cisco's technote
      url: "https://www.cisco.com/c/en/us/support/docs/lan-switching/etherchannel/12023-4.html", // read 2026-11-08 through WebFetch
      access_date: "2026-11-08", // read the day the tool was built
      scope: "Catalyst 6500/6000: a Cisco-proprietary hash with values 0 to 7, the table of values each port accepts (4:4 to 1:1:1:1:1:1:1:1), perfect balance only with two, four or eight ports; the algorithm deterministic; the hash itself not published", // what it pins
      status: "active", // the document resolves
    },
    {
      id: "cisco-c9300-etherchannel", // Cisco's current switches
      label: "Cisco, Layer 2 Configuration Guide, Cisco IOS XE 17.18.x (Catalyst 9300 Switches), Configuring EtherChannels, and the 17.18.x Command Reference, Layer 2/3 Commands (lacp rate) (read through WebFetch: HTTP 403 to curl)", // what the tool states
      type: "vendor-doc", // Cisco's guide
      url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/lyr2/b_1718_lyr2_9300_cg/configuring_etherchannels.html", // read 2026-11-08 through WebFetch
      access_date: "2026-11-08", // read the day the tool was built
      scope: "active and passive modes, two passive ports form no EtherChannel; the default rate 30 seconds, the fast rate 1 second; the link chosen by reducing part of the address pattern to a value; the load-balance methods with src-mac as the default; the function not published", // what it pins
      status: "active", // the guide resolves
    },
    {
      id: "cisco-220367", // the hex form
      label: "Cisco, Troubleshoot EtherChannels on Catalyst 9000 Switches, document 220367, updated 8 August 2024 (French edition, read through WebFetch)", // what the tool states
      type: "vendor-doc", // Cisco's technote
      url: "https://www.cisco.com/c/fr_ca/support/docs/switches/catalyst-9300-series-switches/220367-troubleshoot-etherchannels-on-catalyst-9.html", // read 2026-11-08 through WebFetch
      access_date: "2026-11-08", // read the day the tool was built
      scope: "show lacp neighbor prints the state in hexadecimal with 0x, and the expected value is 0x3D", // what it pins
      status: "active", // the document resolves
    },
    {
      id: "ieee8023-lag-mib", // the state bits, from the standard
      label: "IEEE 802.1 Working Group, IEEE8023-LAG-MIB, the Link Aggregation MIB module for IEEE 802.1AX-2020 (LAST-UPDATED 2020-05-29)", // what the engine applies
      type: "standard", // part of the standard, published openly
      url: "https://www.ieee802.org/1/files/public/MIBs/IEEE8021-AX-MIB-202005290000Z.mib", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "LacpState: lacpActivity(0), lacpTimeout(1), aggregation(2), synchronization(3), collecting(4), distributing(5), defaulted(6), expired(7), each bit corresponding to the same bit of Actor_State (bit 1 named Short_Timeout); dot3adAggPortActorOperState and PartnerOperState; the distribution algorithm's description vendor specific", // what it pins
      status: "active", // the current module
    },
    {
      id: "rfc3417", // the SNMP form
      label: "RFC 3417, Transport Mappings for the Simple Network Management Protocol (SNMP), December 2002: section 8, the BITS encoding", // what the engine applies
      type: "standard", // STD 62
      url: "https://www.rfc-editor.org/rfc/rfc3417.txt", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "a BITS value is an OCTET STRING with the first named bit in the high-order bit of the first octet, so a LacpState read by SNMP is the LACPDU octet bit-reversed", // what it pins
      status: "active", // Internet Standard
    },
    {
      id: "juniper-show-lacp", // the meanings
      label: "Juniper Networks, Junos OS CLI Reference, show lacp interfaces: the LACP State, LACP Protocol and LACP info fields", // what the engine applies
      type: "vendor-doc", // Juniper's reference
      url: "https://www.juniper.net/documentation/us/en/software/junos/cli-reference/topics/ref/command/show-lacp-interfaces.html", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the meaning of Exp, Def, Dist, Col, Syn, Aggr, Timeout and Activity; fast PDUs every second and slow every 30 seconds, timeout after 3 missed PDUs (3 or 90 seconds); the receive states Current, Expired and Defaulted; the mux states", // what it pins
      status: "active", // the reference resolves
    },
    {
      id: "juniper-ae-lacp", // modes and hashing fields
      label: "Juniper Networks, Ethernet Interfaces User Guide for Switches: Aggregated Ethernet LACP for Switches, and Hashing Algorithms for LAG and ECMP", // what the tool states
      type: "vendor-doc", // Juniper's guide
      url: "https://www.juniper.net/documentation/us/en/software/junos/interfaces-ethernet-switches/topics/topic-map/aggregated-ethernet-lacp-switches.html", // fetched 2026-11-08, HTTP 200, with the hashing page
      access_date: "2026-11-08", // read the day the tool was built
      scope: "both links passive exchange no LACP packets; the hashing algorithm's fields vary by EtherType and include internal values such as the source port ID and the source device ID, so the member is not computable from the packet", // what it pins
      status: "active", // the guide resolves
    },
    {
      id: "extreme-se-cr", // the flags string and the timeouts
      label: "Extreme Networks, Switch Engine v33.7.1 Command References (PDF): configure sharing address-based custom, configure sharing algorithm, show lacp member-port, configure sharing lacp timeout", // what the engine applies
      type: "vendor-doc", // Extreme's reference
      url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20Command%20References/downloads/Switch_Engine_33_7_1_Command_References.pdf", // fetched 2026-11-08, HTTP 200, 19,267,991 bytes
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the Actor Flags legend A T G S C D F E and the sample A-GSCD--; LACP timeout long 90 seconds or short 3 seconds, long by default; the hash algorithms xor, crc-16 and crc-32 named, their field layout not published", // what it pins
      status: "active", // the reference resolves
    },
    {
      id: "arista-eos-lacp", // the letters
      label: "Arista Networks, EOS 4.37.0F User Manual, Port Channels and LACP (read through WebFetch: arista.com answered curl with HTTP 406)", // what the engine applies
      type: "vendor-doc", // Arista's manual
      url: "https://www.arista.com/en/um-eos/eos-port-channels-and-lacp", // read 2026-11-08 through WebFetch
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the state legend A/P, S/L, G/I, s+/s-, C, X, D, d and the sample ALGs+CD; one PDU every thirty seconds with a failure tolerance of three; hashing inputs vary by switch platform, the function not described", // what it pins
      status: "active", // the manual resolves
    },
    {
      id: "aruba-lacp", // membership and the CX hash options
      label: "HPE Aruba Networking: ArubaOS 8.11 LACP overview, and AOS-CX 10.16 Link Aggregation Guide, LACP configuration settings and show lacp interfaces (read through WebFetch: HTTP 403 to curl)", // what the tool states
      type: "vendor-doc", // HPE Aruba's documentation
      url: "https://arubanetworking.hpe.com/techdocs/Archived/AOS-8/ArubaOS_8.11.2_Web_Help/Content/arubaos-solutions/lacp/lacp-over.htm", // read 2026-11-08 through WebFetch, with the two AOS-CX pages
      access_date: "2026-11-08", // read the day the tool was built
      scope: "ports with the same actor system ID, actor key, partner system ID and partner key form one LAG; long timeout 90 seconds and short 3 seconds; the AOS-CX hash options l2-src-dst, l3-src-dst and l4-src-dst, the function not described", // what it pins
      status: "active", // the pages resolve
    },
    {
      id: "mikrotik-bonding", // RouterOS
      label: "MikroTik, RouterOS 7.24 manual, Bonding: transmit-hash-policy, lacp-mode and lacp-rate", // what the tool states
      type: "vendor-doc", // MikroTik's manual
      url: "https://manual.mikrotik.com/docs/7.24/high-availability-solutions/bonding/", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the layer-2, layer-2-and-3 and layer-3-and-4 policies described in words with a pointer to the Linux bonding documentation; 802.3ad, balance-xor and active-backup hardware offloaded on supported switch chips, without a formula; lacp-rate 30secs by default", // what it pins
      status: "active", // the manual resolves
    },
    {
      id: "ieee-8021ax-2020", // the standard's availability
      label: "IEEE SA, IEEE 802.1AX-2020, Link Aggregation: the standard's record (Active Standard, approved 2020-01-31, published 2020-05-29, amended by 802.1AXdz-2025), offered through the IEEE GET Program", // what the tool states
      type: "standard", // the record
      url: "https://standards.ieee.org/ieee/802.1AX/6768/", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the standard's status and its access through the IEEE GET Program (an IEEE account), which is why its text was not read and the MIB module stands in for the state bits", // what it pins
      status: "active", // the record
    },
    {
      id: "ieee8021-tc-mib", // VLAN ID and priority ranges
      label: "IEEE 802.1 Working Group, IEEE8021-TC-MIB: IEEE8021VlanIndex and IEEE8021PriorityValue", // what the engine applies
      type: "standard", // published openly
      url: "https://www.ieee802.org/1/files/public/MIBs/IEEE8021-TC-MIB.mib", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "VLAN identifiers 1 to 4094 (0 and 4095 not permitted) and priorities 0 to 7, the ranges the vlan+srcmac fields read", // what it pins
      status: "active", // the current module
    },
    {
      id: "iana-ieee-802", // EtherTypes
      label: "IANA, IEEE 802 Numbers: EtherTypes 0800 (IPv4), 86DD (IPv6) and 8809 (Slow Protocols)", // what the engine applies
      type: "registry", // IANA's registry
      url: "https://www.iana.org/assignments/ieee-802-numbers/ieee-802-numbers.txt", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the packet type IDs layer2 and layer2+3 read, and the EtherType that carries LACPDUs", // what it pins
      status: "active", // the living registry
    },
    {
      id: "rfc9542", // documentation MACs
      label: "RFC 9542, IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, April 2024 (BCP 141; obsoletes RFC 7042): section 2.1.4", // what the Examples use
      type: "standard", // BCP 141
      url: "https://www.rfc-editor.org/rfc/rfc9542.txt", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "00-00-5E-00-53-00 to 00-00-5E-00-53-FF for unicast documentation, the MACs of every Example and sample", // what it pins
      status: "active", // BCP
    },
    {
      id: "rfc5737-rfc3849", // documentation addresses
      label: "RFC 5737, IPv4 Address Blocks Reserved for Documentation (January 2010), and RFC 3849, IPv6 Address Prefix Reserved for Documentation (July 2004)", // what the Examples use
      type: "standard", // Informational
      url: "https://www.rfc-editor.org/rfc/rfc5737.txt", // fetched 2026-11-08, HTTP 200, with RFC 3849
      access_date: "2026-11-08", // read the day the tool was built
      scope: "192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24, and 2001:db8::/32, the addresses of every Example and sample", // what it pins
      status: "active", // Informational, current
    },
    {
      id: "huawei-link-aggregation", // Huawei's PortState, Status words and load-balance modes
      label: "Huawei, S5700 and S6700 V200R025C00 Command Reference, Link Aggregation Commands: display eth-trunk and load-balance" + VIA_BROWSER, // what the engine applies and the page states
      type: "vendor-doc", // Huawei's command reference
      url: "https://support.huawei.com/enterprise/en/doc/EDOC1100514211/54c5f31b/link-aggregation-commands", // HTTP 403 to curl; read 2026-11-08 20:12-20:14 in PRIME's browser
      access_date: "2026-11-08", // read the day of the second set
      scope: "display eth-trunk: PortState \"is eight bits, such as 10111100\", Bit 1 (whether the member interface is an Actor, a fixed value 1) to Bit 8 (the actor's receive machine Expired), the long timeout (90 s) by default; the Status words Selected (active), Unselect (inactive) and ForceFwd (can forward Layer 2 traffic); the example verbatim (Eth-Trunk10's title, Local and Partner tables, Hash arithmetic line, then Eth-Trunk11 in manual mode); load-balance: dst-ip, dst-mac, src-ip, src-mac, src-dst-ip (the default), src-dst-mac and enhanced profile, outgoing traffic only, the hash factors varying by packet type and model (Layer 2 packets on MACs, the S5736-S always src-dst-ip with TCP or UDP ports, nine S5731/S5732/S6730 models on physical-layer source port numbers), display eth-trunk load-balance to check them, the function not given; lacp timeout fast 3 s (the remote end sends every second), slow 90 s (every 30 s), user-defined 3 to 90 s, the two ends may differ", // what it pins (read twice that evening, 20:12-20:14 and 21:01-21:03)
      status: "active", // the current release's reference
    },
    {
      id: "debian-arch-memo", // which Linux architectures are which byte order
      label: "Debian Wiki, ArchitectureSpecificsMemo: the summary table's endian column" + VIA_BROWSER, // what the page states beside the byte-order control
      type: "docs", // a project's documentation
      url: "https://wiki.debian.org/ArchitectureSpecificsMemo", // a bot challenge to curl; read 2026-11-08 19:27 in PRIME's browser
      access_date: "2026-11-08", // read the day of the second set
      scope: "amd64, arm64, ppc64el, riscv64 and loong64 little-endian; s390x, ppc64, mips and sparc64 big-endian: the examples of each byte order beside the control", // what it pins
      status: "active", // the living wiki page
    },
    {
      id: "rfc3986", // Share results
      label: "RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, January 2005: section 3.5, the fragment", // the share link
      type: "standard", // STD 66
      url: "https://www.rfc-editor.org/rfc/rfc3986.txt", // fetched 2026-11-08, HTTP 200
      access_date: "2026-11-08", // read the day the tool was built
      scope: "the values of a Share results link travel after the #, which is not sent to the server when the link is opened", // what it pins
      status: "active", // Internet Standard
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = LACP_VECTORS; // every vector
