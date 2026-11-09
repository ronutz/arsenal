// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vlan-tag-and-trunk-calculator/ethertypes.ts
// ----------------------------------------------------------------------------
// IANA's EtherType list, packed for the 802.1Q tag decoder. GENERATED from
// https://www.iana.org/assignments/ieee-802-numbers/ieee-802-numbers.xml (the
// Ethertypes sub-registry, "Last Updated" 2024-11-03, read 2026-11-08 with curl,
// HTTP 200) by the build's work/gen_ethertypes.py; do not edit by hand. IANA
// notes that the list "is contributed unverified information from various
// sources" and that the IEEE Registration Authority keeps the public list;
// RFC 9542 s3 adds that EtherTypes are not assigned by IANA. The page shows
// the description as IANA publishes it, in English, labelled "IANA:".
// Each row is [low, high, description]; low === high for a single value.
// ============================================================================

/** The registry's "Last Updated" date, as published. */
export const ETHERTYPES_UPDATED = "2024-11-03"; // shown in the References note

/** The 216 rows of IANA's Ethertypes sub-registry, in IANA's order: [low, high, description]. */
export const ETHERTYPES: readonly (readonly [number, number, string])[] = Object.freeze([
  [0x0000, 0x05DC, "IEEE802.3 Length Field"], // 0000-05DC
  [0x0101, 0x01FF, "Old Xerox Experimental values. Invalid as an Ethertype since 1983."], // 0101-01FF
  [0x0200, 0x0200, "Formerly XEROX PUP. Invalid as an Ethertype since 1983. Use 0x0A00."], // 0200
  [0x0201, 0x0201, "Formerly PUP Addr Trans. Invalid as an Ethertype since 1983. Use 0x0A01."], // 0201
  [0x0400, 0x0400, "Old Nixdorf private protocol. Invalid as an Ethertype since 1983."], // 0400
  [0x0600, 0x0600, "XEROX NS IDP"], // 0600
  [0x0660, 0x0660, "DLOG"], // 0660
  [0x0661, 0x0661, "DLOG"], // 0661
  [0x0800, 0x0800, "Internet Protocol version 4 (IPv4)"], // 0800
  [0x0801, 0x0801, "X.75 Internet"], // 0801
  [0x0802, 0x0802, "NBS Internet"], // 0802
  [0x0803, 0x0803, "ECMA Internet"], // 0803
  [0x0804, 0x0804, "Chaosnet"], // 0804
  [0x0805, 0x0805, "X.25 Level 3"], // 0805
  [0x0806, 0x0806, "Address Resolution Protocol (ARP)"], // 0806
  [0x0807, 0x0807, "XNS Compatability"], // 0807
  [0x0808, 0x0808, "Frame Relay ARP"], // 0808
  [0x081C, 0x081C, "Symbolics Private"], // 081C
  [0x0888, 0x088A, "Xyplex"], // 0888-088A
  [0x0900, 0x0900, "Ungermann-Bass net debugr"], // 0900
  [0x0A00, 0x0A00, "Xerox IEEE802.3 PUP"], // 0A00
  [0x0A01, 0x0A01, "PUP Addr Trans"], // 0A01
  [0x0BAD, 0x0BAD, "Banyan VINES"], // 0BAD
  [0x0BAE, 0x0BAE, "VINES Loopback"], // 0BAE
  [0x0BAF, 0x0BAF, "VINES Echo"], // 0BAF
  [0x1000, 0x1000, "Berkeley Trailer nego"], // 1000
  [0x1001, 0x100F, "Berkeley Trailer encap/IP"], // 1001-100F
  [0x1600, 0x1600, "Valid Systems"], // 1600
  [0x22F3, 0x22F3, "TRILL"], // 22F3
  [0x22F4, 0x22F4, "L2-IS-IS"], // 22F4
  [0x4242, 0x4242, "PCS Basic Block Protocol"], // 4242
  [0x5208, 0x5208, "BBN Simnet"], // 5208
  [0x6000, 0x6000, "DEC Unassigned (Exp.)"], // 6000
  [0x6001, 0x6001, "DEC MOP Dump/Load"], // 6001
  [0x6002, 0x6002, "DEC MOP Remote Console"], // 6002
  [0x6003, 0x6003, "DEC DECNET Phase IV Route"], // 6003
  [0x6004, 0x6004, "DEC LAT"], // 6004
  [0x6005, 0x6005, "DEC Diagnostic Protocol"], // 6005
  [0x6006, 0x6006, "DEC Customer Protocol"], // 6006
  [0x6007, 0x6007, "DEC LAVC, SCA"], // 6007
  [0x6008, 0x6009, "DEC Unassigned"], // 6008-6009
  [0x6010, 0x6014, "3Com Corporation"], // 6010-6014
  [0x6558, 0x6558, "Transparent Ethernet Bridging"], // 6558
  [0x6559, 0x6559, "Raw Frame Relay"], // 6559
  [0x7000, 0x7000, "Ungermann-Bass download"], // 7000
  [0x7002, 0x7002, "Ungermann-Bass dia/loop"], // 7002
  [0x7020, 0x7029, "LRT"], // 7020-7029
  [0x7030, 0x7030, "Proteon"], // 7030
  [0x7034, 0x7034, "Cabletron"], // 7034
  [0x8003, 0x8003, "Cronus VLN"], // 8003
  [0x8004, 0x8004, "Cronus Direct"], // 8004
  [0x8005, 0x8005, "HP Probe"], // 8005
  [0x8006, 0x8006, "Nestar"], // 8006
  [0x8008, 0x8008, "AT&T"], // 8008
  [0x8010, 0x8010, "Excelan"], // 8010
  [0x8013, 0x8013, "SGI diagnostics"], // 8013
  [0x8014, 0x8014, "SGI network games"], // 8014
  [0x8015, 0x8015, "SGI reserved"], // 8015
  [0x8016, 0x8016, "SGI bounce server"], // 8016
  [0x8019, 0x8019, "Apollo Domain"], // 8019
  [0x802E, 0x802E, "Tymshare"], // 802E
  [0x802F, 0x802F, "Tigan, Inc."], // 802F
  [0x8035, 0x8035, "Reverse Address Resolution Protocol (RARP)"], // 8035
  [0x8036, 0x8036, "Aeonic Systems"], // 8036
  [0x8038, 0x8038, "DEC LANBridge"], // 8038
  [0x8039, 0x803C, "DEC Unassigned"], // 8039-803C
  [0x803D, 0x803D, "DEC Ethernet Encryption"], // 803D
  [0x803E, 0x803E, "DEC Unassigned"], // 803E
  [0x803F, 0x803F, "DEC LAN Traffic Monitor"], // 803F
  [0x8040, 0x8042, "DEC Unassigned"], // 8040-8042
  [0x8044, 0x8044, "Planning Research Corp."], // 8044
  [0x8046, 0x8046, "AT&T"], // 8046
  [0x8047, 0x8047, "AT&T"], // 8047
  [0x8049, 0x8049, "ExperData"], // 8049
  [0x805B, 0x805B, "Stanford V Kernel exp."], // 805B
  [0x805C, 0x805C, "Stanford V Kernel prod."], // 805C
  [0x805D, 0x805D, "Evans & Sutherland"], // 805D
  [0x8060, 0x8060, "Little Machines"], // 8060
  [0x8062, 0x8062, "Counterpoint Computers"], // 8062
  [0x8065, 0x8065, "Univ. of Mass. @ Amherst"], // 8065
  [0x8066, 0x8066, "Univ. of Mass. @ Amherst"], // 8066
  [0x8067, 0x8067, "Veeco Integrated Auto."], // 8067
  [0x8068, 0x8068, "General Dynamics"], // 8068
  [0x8069, 0x8069, "AT&T"], // 8069
  [0x806A, 0x806A, "Autophon"], // 806A
  [0x806C, 0x806C, "ComDesign"], // 806C
  [0x806D, 0x806D, "Computgraphic Corp."], // 806D
  [0x806E, 0x8077, "Landmark Graphics Corp."], // 806E-8077
  [0x807A, 0x807A, "Matra"], // 807A
  [0x807B, 0x807B, "Dansk Data Elektronik"], // 807B
  [0x807C, 0x807C, "Merit Internodal"], // 807C
  [0x807D, 0x807F, "Vitalink Communications"], // 807D-807F
  [0x8080, 0x8080, "Vitalink TransLAN III"], // 8080
  [0x8081, 0x8083, "Counterpoint Computers"], // 8081-8083
  [0x809B, 0x809B, "Appletalk"], // 809B
  [0x809C, 0x809E, "Datability"], // 809C-809E
  [0x809F, 0x809F, "Spider Systems Ltd."], // 809F
  [0x80A3, 0x80A3, "Nixdorf Computers"], // 80A3
  [0x80A4, 0x80B3, "Siemens Gammasonics Inc."], // 80A4-80B3
  [0x80C0, 0x80C3, "DCA Data Exchange Cluster"], // 80C0-80C3
  [0x80C4, 0x80C4, "Banyan Systems"], // 80C4
  [0x80C5, 0x80C5, "Banyan Systems"], // 80C5
  [0x80C6, 0x80C6, "Pacer Software"], // 80C6
  [0x80C7, 0x80C7, "Applitek Corporation"], // 80C7
  [0x80C8, 0x80CC, "Intergraph Corporation"], // 80C8-80CC
  [0x80CD, 0x80CE, "Harris Corporation"], // 80CD-80CE
  [0x80CF, 0x80D2, "Taylor Instrument"], // 80CF-80D2
  [0x80D3, 0x80D4, "Rosemount Corporation"], // 80D3-80D4
  [0x80D5, 0x80D5, "IBM SNA Service on Ether"], // 80D5
  [0x80DD, 0x80DD, "Varian Associates"], // 80DD
  [0x80DE, 0x80DF, "Integrated Solutions TRFS"], // 80DE-80DF
  [0x80E0, 0x80E3, "Allen-Bradley"], // 80E0-80E3
  [0x80E4, 0x80F0, "Datability"], // 80E4-80F0
  [0x80F2, 0x80F2, "Retix"], // 80F2
  [0x80F3, 0x80F3, "AppleTalk AARP (Kinetics)"], // 80F3
  [0x80F4, 0x80F5, "Kinetics"], // 80F4-80F5
  [0x80F7, 0x80F7, "Apollo Computer"], // 80F7
  [0x80FF, 0x80FF, "Wellfleet Communications"], // 80FF
  [0x8100, 0x8100, "Customer VLAN Tag Type (C-Tag, formerly called the Q-Tag) (initially Wellfleet)"], // 8100
  [0x8101, 0x8103, "Wellfleet Communications"], // 8101-8103
  [0x8107, 0x8109, "Symbolics Private"], // 8107-8109
  [0x8130, 0x8130, "Hayes Microcomputers"], // 8130
  [0x8131, 0x8131, "VG Laboratory Systems"], // 8131
  [0x8132, 0x8136, "Bridge Communications"], // 8132-8136
  [0x8137, 0x8138, "Novell, Inc."], // 8137-8138
  [0x8139, 0x813D, "KTI"], // 8139-813D
  [0x8148, 0x8148, "Logicraft"], // 8148
  [0x8149, 0x8149, "Network Computing Devices"], // 8149
  [0x814A, 0x814A, "Alpha Micro"], // 814A
  [0x814C, 0x814C, "SNMP"], // 814C
  [0x814D, 0x814D, "BIIN"], // 814D
  [0x814E, 0x814E, "BIIN"], // 814E
  [0x814F, 0x814F, "Technically Elite Concept"], // 814F
  [0x8150, 0x8150, "Rational Corp"], // 8150
  [0x8151, 0x8153, "Qualcomm"], // 8151-8153
  [0x815C, 0x815E, "Computer Protocol Pty Ltd"], // 815C-815E
  [0x8164, 0x8166, "Charles River Data System"], // 8164-8166
  [0x817D, 0x817D, "XTP"], // 817D
  [0x817E, 0x817E, "SGI/Time Warner prop."], // 817E
  [0x8180, 0x8180, "HIPPI-FP encapsulation"], // 8180
  [0x8181, 0x8181, "STP, HIPPI-ST"], // 8181
  [0x8182, 0x8182, "Reserved for HIPPI-6400"], // 8182
  [0x8183, 0x8183, "Reserved for HIPPI-6400"], // 8183
  [0x8184, 0x818C, "Silicon Graphics prop."], // 8184-818C
  [0x818D, 0x818D, "Motorola Computer"], // 818D
  [0x819A, 0x81A3, "Qualcomm"], // 819A-81A3
  [0x81A4, 0x81A4, "ARAI Bunkichi"], // 81A4
  [0x81A5, 0x81AE, "RAD Network Devices"], // 81A5-81AE
  [0x81B7, 0x81B9, "Xyplex"], // 81B7-81B9
  [0x81CC, 0x81D5, "Apricot Computers"], // 81CC-81D5
  [0x81D6, 0x81DD, "Artisoft"], // 81D6-81DD
  [0x81E6, 0x81EF, "Polygon"], // 81E6-81EF
  [0x81F0, 0x81F2, "Comsat Labs"], // 81F0-81F2
  [0x81F3, 0x81F5, "SAIC"], // 81F3-81F5
  [0x81F6, 0x81F8, "VG Analytical"], // 81F6-81F8
  [0x8203, 0x8205, "Quantum Software"], // 8203-8205
  [0x8221, 0x8222, "Ascom Banking Systems"], // 8221-8222
  [0x823E, 0x8240, "Advanced Encryption Syste"], // 823E-8240
  [0x827F, 0x8282, "Athena Programming"], // 827F-8282
  [0x8263, 0x826A, "Charles River Data System"], // 8263-826A
  [0x829A, 0x829B, "Inst Ind Info Tech"], // 829A-829B
  [0x829C, 0x82AB, "Taurus Controls"], // 829C-82AB
  [0x82AC, 0x8693, "Walker Richer & Quinn"], // 82AC-8693
  [0x8694, 0x869D, "Idea Courier"], // 8694-869D
  [0x869E, 0x86A1, "Computer Network Tech"], // 869E-86A1
  [0x86A3, 0x86AC, "Gateway Communications"], // 86A3-86AC
  [0x86DB, 0x86DB, "SECTRA"], // 86DB
  [0x86DE, 0x86DE, "Delta Controls"], // 86DE
  [0x86DD, 0x86DD, "Internet Protocol version 6 (IPv6)"], // 86DD
  [0x86DF, 0x86DF, "ATOMIC"], // 86DF
  [0x86E0, 0x86EF, "Landis & Gyr Powers"], // 86E0-86EF
  [0x8700, 0x8710, "Motorola"], // 8700-8710
  [0x876B, 0x876B, "TCP/IP Compression"], // 876B
  [0x876C, 0x876C, "IP Autonomous Systems"], // 876C
  [0x876D, 0x876D, "Secure Data"], // 876D
  [0x8808, 0x8808, "IEEE Std 802.3 - Ethernet Passive Optical Network (EPON)"], // 8808
  [0x8809, 0x8809, "Slow Protocols (Link Aggregation, OAM, etc.)"], // 8809
  [0x880B, 0x880B, "Point-to-Point Protocol (PPP)"], // 880B
  [0x880C, 0x880C, "General Switch Management Protocol (GSMP)"], // 880C
  [0x8822, 0x8822, "Ethernet NIC hardware and software testing"], // 8822
  [0x8847, 0x8847, "MPLS"], // 8847
  [0x8848, 0x8848, "MPLS with upstream-assigned label"], // 8848
  [0x8861, 0x8861, "Multicast Channel Allocation Protocol (MCAP)"], // 8861
  [0x8863, 0x8863, "PPP over Ethernet (PPPoE) Discovery Stage"], // 8863
  [0x8864, 0x8864, "PPP over Ethernet (PPPoE) Session Stage"], // 8864
  [0x888E, 0x888E, "IEEE Std 802.1X - Port-based network access control"], // 888E
  [0x88A8, 0x88A8, "IEEE Std 802.1Q - Service VLAN tag identifier (S-Tag)"], // 88A8
  [0x8A96, 0x8A97, "Invisible Software"], // 8A96-8A97
  [0x88B5, 0x88B5, "IEEE Std 802 - Local Experimental Ethertype"], // 88B5
  [0x88B6, 0x88B6, "IEEE Std 802 - Local Experimental Ethertype"], // 88B6
  [0x88B7, 0x88B7, "IEEE Std 802 - OUI Extended Ethertype"], // 88B7
  [0x88C7, 0x88C7, "IEEE Std 802.11 - Pre-Authentication (802.11i)"], // 88C7
  [0x88CC, 0x88CC, "IEEE Std 802.1AB - Link Layer Discovery Protocol (LLDP)"], // 88CC
  [0x88E5, 0x88E5, "IEEE Std 802.1AE - Media Access Control Security"], // 88E5
  [0x88E7, 0x88E7, "Provider Backbone Bridging Instance tag"], // 88E7
  [0x88F5, 0x88F5, "IEEE Std 802.1Q - Multiple VLAN Registration Protocol (MVRP)"], // 88F5
  [0x88F6, 0x88F6, "IEEE Std 802.1Q - Multiple Multicast Registration Protocol (MMRP)"], // 88F6
  [0x88F7, 0x88F7, "Precision Time Protocol"], // 88F7
  [0x890D, 0x890D, "IEEE Std 802.11 - Fast Roaming Remote Request (802.11r)"], // 890D
  [0x8917, 0x8917, "IEEE Std 802.21 - Media Independent Handover Protocol"], // 8917
  [0x8929, 0x8929, "IEEE Std 802.1Qbe - Multiple I-SID Registration Protocol"], // 8929
  [0x893B, 0x893B, "TRILL Fine Grained Labeling (FGL)"], // 893B
  [0x8940, 0x8940, "IEEE Std 802.1Qbg - ECP Protocol (also used in 802.1BR)"], // 8940
  [0x8946, 0x8946, "TRILL RBridge Channel"], // 8946
  [0x8947, 0x8947, "GeoNetworking as defined in ETSI EN 302 636-4-1"], // 8947
  [0x894F, 0x894F, "NSH (Network Service Header)"], // 894F
  [0x9000, 0x9000, "Loopback"], // 9000
  [0x9001, 0x9001, "3Com(Bridge) XNS Sys Mgmt"], // 9001
  [0x9002, 0x9002, "3Com(Bridge) TCP-IP Sys"], // 9002
  [0x9003, 0x9003, "3Com(Bridge) loop detect"], // 9003
  [0x9A22, 0x9A22, "Multi-Topology"], // 9A22
  [0xA0ED, 0xA0ED, "LoWPAN encapsulation"], // A0ED
  [0xB7EA, 0xB7EA, "The Ethertype will be used to identify a \"Channel\" in which control messages are encapsulated as payload of GRE packets. When a GRE packet tagged with the Ethertype is received, the payload will be handed to the network processor for processing."], // B7EA
  [0xFF00, 0xFF00, "BBN VITAL-LanBridge cache private protocol."], // FF00
  [0xFF00, 0xFF0F, "ISC Bunker Ramo private protocol."], // FF00-FF0F
  [0xFFFF, 0xFFFF, "Reserved"], // FFFF
]); // 216 rows
