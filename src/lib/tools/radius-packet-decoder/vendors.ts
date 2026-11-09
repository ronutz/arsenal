// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/radius-packet-decoder/vendors.ts
// ----------------------------------------------------------------------------
// The vendors the RADIUS packet decoder names inside a Vendor-Specific
// attribute (type 26, RFC 2865 section 5.26): the vendors the course "LAN
// Switch Operations and Maintenance" configures in chapter 4.6 (Cisco,
// Juniper, Arista, HPE Aruba, Extreme, Huawei, MikroTik, and Enterasys for the
// course's C3 lab), Microsoft (whose RFC 2548 attributes ride on every
// MS-CHAP and PEAP exchange) and Private Enterprise Number 1 (the vendor of
// RFC 6929's own examples). Read on 2026-11-08:
//   - every organisation name is IANA's, from the Private Enterprise Numbers
//     registry (enterprise-numbers.txt, last updated 2026-11-06), as published;
//   - sub-attribute names, numbers and data types come only from the vendor's
//     own documentation, each table naming its source id (index.ts):
//       cisco-c9300-radius  Cisco Catalyst 9300 IOS XE 17.18 Security
//                           Configuration Guide, "Configuring RADIUS" (read
//                           with WebFetch: cisco.com refused curl with 403):
//                           vendor-ID 9, vendor-type 1 "cisco-avpair", a string
//                           "protocol : attribute sep value", sep "=" for
//                           mandatory and "*" for optional attributes;
//       rfc2548             RFC 2548 (Microsoft), sections 2.1 to 2.7: the
//                           Vendor-Type of each MS- attribute and its layout;
//       juniper-radius-vsa  Juniper Junos User Access and Authentication
//                           Administration Guide, "Juniper Networks
//                           Vendor-Specific RADIUS Attributes", Table 1 (curl);
//       arista-eos-security Arista EOS 4.36.2F User Manual, "User Security"
//                           (read with WebFetch: arista.com answered curl 406):
//                           "Arista-AVPair 1 string", "Arista-Config-Vlan, with
//                           attribute ID 22" (no data type given);
//       aruba-aoscx-vsa     HPE Aruba Networking AOS-CX 10.16 Security Guide,
//                           "Vendor-Specific Attributes in session
//                           authorization" (read with WebFetch: curl 403);
//       extreme-se-vsa      Extreme Switch Engine v33.7.1 User Guide, Table 146
//                           (pages 1619-1620, types and formats) and Table 143
//                           (page 1609, names and numbers only) (curl, PDF);
//       mikrotik-radius     MikroTik RouterOS 7.24 manual, "RADIUS", table
//                           "MikroTik Specific RADIUS Attribute Numeric Values"
//                           (names and numbers; the table gives no data types).
//       huawei-radius       Huawei S5700 and S6700 V200R025C00 Configuration
//                           Guide - User Access and Authentication, "Huawei
//                           Proprietary RADIUS Attributes", Table 1-11: vendor
//                           ID 2011, 68 sub-attributes with number, name and
//                           type (integer, string, ipaddr, hex). The site
//                           refuses curl (403) and WebFetch, so the table was
//                           read in a browser on 2026-11-08 (the update of
//                           that evening) and saved as number|name|type lines
//                           whose SHA-256 was computed in the page and on disk
//                           (5263c4f1...4688257, identical); the lines below
//                           were generated from that file, never typed.
//   - the Enterasys C3 guide is not published online any more (the course deck
//     says so), and HP and HPE (11, 47196) were not read: named by IANA only.
// Where a vendor's table gives no data type, the type is "" and the page shows
// the octets with neutral readings, saying so. No value names are invented.
// ============================================================================

/**
 * How a sub-attribute's value is read. "string" and "text" follow RFC 8044; "integer" is four octets unsigned;
 * "ipv4addr" four octets; "salted-key" RFC 2548's encrypted MPPE key (Salt, then ciphertext); "avpair" Cisco's
 * protocol:attribute sep value string; "ipaddr" Huawei's address type (four octets read as IPv4, sixteen as IPv6);
 * "hex" Huawei's hex type (the octets as they are, no text reading); "" when the vendor's table gives no data type.
 */
export type SubType = "string" | "text" | "integer" | "ipv4addr" | "salted-key" | "avpair" | "ipaddr" | "hex" | ""; // the readings the decoder has

/** One vendor the decoder names. */
export interface VendorDef {
  /** IANA's organisation name for the Private Enterprise Number, as published. */
  readonly name: string;
  /** The manifest source id of the sub-attribute list, or null when the decoder has none. */
  readonly source: string | null;
  /** Why there is no list, when there is none: the documentation is no longer online, or it was not read. */
  readonly missing: "offline" | "not-read" | null;
  /** Sub-attributes: vendor type -> [name as the vendor writes it, how the value is read]. */
  readonly subs: Readonly<Record<number, readonly [string, SubType]>>;
}

/** The vendors, by Private Enterprise Number. */
export const VENDORS: Readonly<Record<number, VendorDef>> = Object.freeze({
  1: { name: "NxNetworks", source: null, missing: "not-read", subs: {} }, // the Vendor-Id of RFC 6929's examples (section 9)
  9: {
    name: "ciscoSystems", // IANA's name for 9
    source: "cisco-c9300-radius", // "Cisco's vendor-ID is 9, and the supported option has vendor-type 1, which is named cisco-avpair"
    missing: null, // documented
    subs: { 1: ["cisco-avpair", "avpair"] }, // protocol : attribute sep value
  },
  11: { name: "Hewlett-Packard", source: null, missing: "not-read", subs: {} }, // IANA's name; not read for this tool
  311: {
    name: "Microsoft", // IANA's name for 311
    source: "rfc2548", // RFC 2548, sections 2.1 to 2.7
    missing: null, // documented
    subs: {
      1: ["MS-CHAP-Response", "string"], // 2.1.3: Ident, Flags, LM-Response, NT-Response
      2: ["MS-CHAP-Error", "string"], // 2.1.5: Ident, then ASCII text
      3: ["MS-CHAP-CPW-1", "string"], // 2.1.6
      4: ["MS-CHAP-CPW-2", "string"], // 2.1.7
      5: ["MS-CHAP-LM-Enc-PW", "string"], // 2.1.8
      6: ["MS-CHAP-NT-Enc-PW", "string"], // 2.2
      7: ["MS-MPPE-Encryption-Policy", "integer"], // 2.4.4: Vendor-Length 6
      8: ["MS-MPPE-Encryption-Types", "integer"], // 2.4.5: Vendor-Length 6
      9: ["MS-RAS-Vendor", "integer"], // 2.7.1: Vendor-Length 6
      10: ["MS-CHAP-Domain", "string"], // 2.1.4: Ident, then ASCII text
      11: ["MS-CHAP-Challenge", "string"], // 2.1.2
      12: ["MS-CHAP-MPPE-Keys", "string"], // 2.4.1: Vendor-Length 34
      13: ["MS-BAP-Usage", "integer"], // 2.5.1: Vendor-Length 6, four-octet Value
      14: ["MS-Link-Utilization-Threshold", "integer"], // 2.5.2: four-octet Value, 1 to 100
      15: ["MS-Link-Drop-Time-Limit", "integer"], // 2.5.3: Vendor-Length 6, seconds
      16: ["MS-MPPE-Send-Key", "salted-key"], // 2.4.2: Salt, then the encrypted key
      17: ["MS-MPPE-Recv-Key", "salted-key"], // 2.4.3: Salt, then the encrypted key
      18: ["MS-RAS-Version", "string"], // 2.7.2
      19: ["MS-Old-ARAP-Password", "string"], // 2.6.1: DES-encrypted
      20: ["MS-New-ARAP-Password", "string"], // 2.6.2: DES-encrypted
      21: ["MS-ARAP-Password-Change-Reason", "integer"], // 2.6.3: Vendor-Length 6
      22: ["MS-Filter", "string"], // 2.7.3
      23: ["MS-Acct-Auth-Type", "integer"], // 2.7.4: Vendor-Length 6
      24: ["MS-Acct-EAP-Type", "integer"], // 2.7.5: Vendor-Length 6
      25: ["MS-CHAP2-Response", "string"], // 2.3.2: Vendor-Length 52
      26: ["MS-CHAP2-Success", "string"], // 2.3.3: Ident, then the 42-octet authenticator string
      27: ["MS-CHAP2-CPW", "string"], // 2.3.4
      28: ["MS-Primary-DNS-Server", "ipv4addr"], // 2.7.6: IP-Address, 4 octets
      29: ["MS-Secondary-DNS-Server", "ipv4addr"], // 2.7.7
      30: ["MS-Primary-NBNS-Server", "ipv4addr"], // 2.7.8
      31: ["MS-Secondary-NBNS-Server", "ipv4addr"], // 2.7.9
      33: ["MS-ARAP-Challenge", "string"], // 2.6.4: two four-octet quantities
    },
  },
  1916: {
    name: "Extreme Networks", // IANA's name for 1916
    source: "extreme-se-vsa", // Switch Engine v33.7.1 User Guide, Tables 146 and 143
    missing: null, // documented
    subs: {
      201: ["Extreme-CLI-Authorization", "integer"], // Table 146: Integer, Access-Accept
      202: ["Extreme-Shell-Command", ""], // Table 143: name and number only
      203: ["Extreme-Netlogin-VLAN-Name", "string"], // Table 146: String
      204: ["Extreme-Netlogin-URL", "string"], // Table 146: String
      205: ["Extreme-Netlogin-URL-Desc", "string"], // Table 146: String
      206: ["Extreme-Netlogin-Only", "integer"], // Table 146: Integer
      208: ["Extreme-User-Location", "string"], // Table 146: String
      209: ["Extreme-Netlogin-VLAN-ID", "integer"], // Table 146: Integer
      211: ["Extreme-Netlogin-Extended-VLAN", "string"], // Table 146: String
      212: ["Extreme-Security-Profile", "string"], // Table 146: String
      213: ["EXTREME_VM_NAME", "string"], // Table 146: String
      214: ["EXTREME_VM_VPP_NAME", "string"], // Table 146: String
      215: ["EXTREME_VM_IP_ADDR", "string"], // Table 146: String (an address as text)
      216: ["EXTREME_VM_CTag", "integer"], // Table 146: Integer
      217: ["EXTREME_VM_VR_Name", "string"], // Table 146: String
      218: ["Extreme-NetLogin-VR-Name", ""], // Table 143: name and number only
      232: ["Extreme-Policy-ACL", ""], // Table 143: name and number only
      233: ["Extreme-Port-Bounce", ""], // Table 143: name and number only
      234: ["Extreme-URL-Redirect", ""], // Table 143: name and number only
    },
  },
  2011: {
    name: "HUAWEI Technology Co.,Ltd", // IANA's name for 2011
    source: "huawei-radius", // "The vendor ID of Huawei is 2011." Table 1-11, read in a browser on 2026-11-08
    missing: null, // documented
    subs: {
      1: ["HW-Input-Peak-Information-Rate", "integer"], // Table 1-11: integer
      2: ["HW-Input-Committed-Information-Rate", "integer"], // Table 1-11: integer
      3: ["HW-Input-Committed-Burst-Size", "integer"], // Table 1-11: integer
      4: ["HW-Output-Peak-Information-Rate", "integer"], // Table 1-11: integer
      5: ["HW-Output-Committed-Information-Rate", "integer"], // Table 1-11: integer
      6: ["HW-Output-Committed-Burst-Size", "integer"], // Table 1-11: integer
      15: ["HW-Remanent-Volume", "integer"], // Table 1-11: integer
      17: ["HW-Subscriber-QoS-Profile", "string"], // Table 1-11: string
      18: ["HW-UserName-Access-Limit", "integer"], // Table 1-11: integer
      26: ["HW-Connect-ID", "integer"], // Table 1-11: integer
      28: ["HW-FTP-Directory", "string"], // Table 1-11: string
      29: ["HW-Exec-Privilege", "integer"], // Table 1-11: integer
      31: ["HW-Qos-Data", "string"], // Table 1-11: string
      33: ["HW-VoiceVlan", "integer"], // Table 1-11: integer
      35: ["HW-ProxyRdsPkt", "integer"], // Table 1-11: integer
      59: ["HW-NAS-Startup-Time-Stamp", "integer"], // Table 1-11: integer
      60: ["HW-IP-Host-Address", "string"], // Table 1-11: string
      61: ["HW-Up-Priority", "integer"], // Table 1-11: integer
      62: ["HW-Down-Priority", "integer"], // Table 1-11: integer
      75: ["HW-Primary-WINS", "ipaddr"], // Table 1-11: ipaddr
      76: ["HW-Second-WINS", "ipaddr"], // Table 1-11: ipaddr
      77: ["HW-Input-Peak-Burst-Size", "integer"], // Table 1-11: integer
      78: ["HW-Output-Peak-Burst-Size", "integer"], // Table 1-11: integer
      82: ["HW-Data-Filter", "string"], // Table 1-11: string
      94: ["HW-VPN-Instance", "string"], // Table 1-11: string
      135: ["HW-Client-Primary-DNS", "ipaddr"], // Table 1-11: ipaddr
      136: ["HW-Client-Secondary-DNS", "ipaddr"], // Table 1-11: ipaddr
      138: ["HW-Domain-Name", "string"], // Table 1-11: string
      141: ["HW-AP-Information", "string"], // Table 1-11: string
      142: ["HW-User-Information", "string"], // Table 1-11: string
      146: ["HW-User-Policy", "string"], // Table 1-11: string
      153: ["HW-Access-Type", "integer"], // Table 1-11: integer
      155: ["HW-URL-Flag", "integer"], // Table 1-11: integer
      156: ["HW-Portal-URL", "string"], // Table 1-11: string
      157: ["HW-Terminal-Type", "string"], // Table 1-11: string
      158: ["HW-DHCP-Option", "hex"], // Table 1-11: hex
      159: ["HW-HTTP-UA", "string"], // Table 1-11: string
      160: ["HW-UCL-Group", "integer"], // Table 1-11: integer
      161: ["HW-Forwarding-VLAN", "string"], // Table 1-11: string
      162: ["HW-Forwarding-Interface", "string"], // Table 1-11: string
      163: ["HW-LLDP", "string"], // Table 1-11: string
      164: ["HW-CDP", "string"], // Table 1-11: string
      166: ["HW-Acct-ipv6-Input-Octets", "integer"], // Table 1-11: integer
      167: ["HW-Acct-ipv6-Output-Octets", "integer"], // Table 1-11: integer
      168: ["HW-Acct-ipv6-Input-Packets", "integer"], // Table 1-11: integer
      169: ["HW-Acct-ipv6-Output-Packets", "integer"], // Table 1-11: integer
      170: ["HW-Acct-ipv6-Input-Gigawords", "integer"], // Table 1-11: integer
      171: ["HW-Acct-ipv6-Output-Gigawords", "integer"], // Table 1-11: integer
      173: ["HW-Redirect-ACL", "string"], // Table 1-11: string
      178: ["HW-IPv6-Redirect-ACL", "string"], // Table 1-11: string
      188: ["HW-AVPair", "string"], // Table 1-11: string
      201: ["HW-User-Extend-Info", "string"], // Table 1-11: string
      202: ["HW-MUD-URL", "string"], // Table 1-11: string
      203: ["HW-VIP-Level-ID", "integer"], // Table 1-11: integer
      204: ["HW-SAC-Profile", "string"], // Table 1-11: string
      237: ["HW-Web-Authen-Info", "string"], // Table 1-11: string
      238: ["HW-Ext-Specific", "string"], // Table 1-11: string
      239: ["HW-User-Access-Info", "string"], // Table 1-11: string
      240: ["HW-Access-Device-Info", "string"], // Table 1-11: string
      244: ["HW-Reachable-Detect", "string"], // Table 1-11: string
      247: ["HW-Tariff-Input-Octets", "string"], // Table 1-11: string
      248: ["HW-Tariff-Output-Octets", "string"], // Table 1-11: string
      249: ["HW-Tariff-Input-Gigawords", "string"], // Table 1-11: string
      250: ["HW-Tariff-Output-Gigawords", "string"], // Table 1-11: string
      251: ["HW-IPv6-Filter-ID", "string"], // Table 1-11: string
      253: ["HW-Framed-IPv6-Address", "ipaddr"], // Table 1-11: ipaddr
      254: ["HW-Version", "string"], // Table 1-11: string
      255: ["HW-Product-ID", "string"], // Table 1-11: string
    },
  },
  2636: {
    name: "Juniper Networks, Inc.", // IANA's name for 2636
    source: "juniper-radius-vsa", // Table 1: Juniper Networks Vendor-Specific RADIUS Attributes
    missing: null, // documented
    subs: {
      1: ["Juniper-Local-User-Name", "text"], // printable ASCII
      2: ["Juniper-Allow-Commands", "text"], // an extended regular expression
      3: ["Juniper-Deny-Commands", "text"], // an extended regular expression
      4: ["Juniper-Allow-Configuration", "text"], // an extended regular expression
      5: ["Juniper-Deny-Configuration", "text"], // an extended regular expression
      8: ["Juniper-Interactive-Command", "text"], // Accounting-Request only
      9: ["Juniper-Configuration-Change", "text"], // Accounting-Request only
      10: ["Juniper-User-Permissions", "text"], // permission flags separated by a space
      11: ["Juniper-Authentication-Type", "text"], // 'local' or 'remote'
      12: ["Juniper-Session-Port", "integer"], // "Integer"
      13: ["Juniper-Allow-Configuration-Regexps", "text"], // RADIUS only
      14: ["Juniper-Deny-Configuration-Regexps", "text"], // RADIUS only
    },
  },
  5624: { name: "Enterasys Networks", source: null, missing: "offline", subs: {} }, // the C3 guide of the course's lab is no longer online
  14823: {
    name: "Aruba, a Hewlett Packard Enterprise company", // IANA's name for 14823
    source: "aruba-aoscx-vsa", // AOS-CX 10.16 Security Guide
    missing: null, // documented
    subs: {
      1: ["Aruba-User-Role", "string"], // string (<=63)
      40: ["Aruba-Port-Bounce", "integer"], // Integer (4)
      49: ["Aruba-PoE-Priority", "integer"], // integer (4)
      50: ["Aruba-Port-Auth-Mode", "integer"], // integer (4)
      51: ["Aruba-NAS-Filter-Rule", "string"], // string (<=247)
      52: ["Aruba-QoS-Trust-Mode", "integer"], // integer (4)
      55: ["Aruba-STP-Admin-Edge-Port", "integer"], // Integer (4)
      59: ["Aruba-UBT-Gateway-CPPM-Role", "string"], // string (<=128)
      69: ["Aruba-User-Mgmt-Interface", "string"], // string (<=32)
      70: ["Aruba-PoE-Allocate-By-Method", "integer"], // Integer (4)
    },
  },
  14988: {
    name: "MikroTik", // IANA's name for 14988
    source: "mikrotik-radius", // RouterOS 7.24 manual, RADIUS
    missing: null, // names documented, types not
    subs: {
      1: ["MIKROTIK_RECV_LIMIT", ""], 2: ["MIKROTIK_XMIT_LIMIT", ""], 3: ["MIKROTIK_GROUP", ""], // 1 to 3
      4: ["MIKROTIK_WIRELESS_FORWARD", ""], 5: ["MIKROTIK_WIRELESS_SKIPDOT1X", ""], 6: ["MIKROTIK_WIRELESS_ENCALGO", ""], // 4 to 6
      7: ["MIKROTIK_WIRELESS_ENCKEY", ""], 8: ["MIKROTIK_RATE_LIMIT", ""], 9: ["MIKROTIK_REALM", ""], // 7 to 9
      10: ["MIKROTIK_HOST_IP", ""], 11: ["MIKROTIK_MARK_ID", ""], 12: ["MIKROTIK_ADVERTISE_URL", ""], // 10 to 12
      13: ["MIKROTIK_ADVERTISE_INTERVAL", ""], 14: ["MIKROTIK_RECV_LIMIT_GIGAWORDS", ""], 15: ["MIKROTIK_XMIT_LIMIT_GIGAWORDS", ""], // 13 to 15
      16: ["MIKROTIK_WIRELESS_PSK", ""], 17: ["MIKROTIK_TOTAL_LIMIT", ""], 18: ["MIKROTIK_TOTAL_LIMIT_GIGAWORDS", ""], // 16 to 18
      19: ["MIKROTIK_ADDRESS_LIST", ""], 20: ["MIKROTIK_WIRELESS_MPKEY", ""], 21: ["MIKROTIK_WIRELESS_COMMENT", ""], // 19 to 21
      22: ["MIKROTIK_DELEGATED_IPV6_POOL", ""], 23: ["MIKROTIK_DHCP_OPTION_SET", ""], 24: ["MIKROTIK_DHCP_OPTION_PARAM_STR1", ""], // 22 to 24
      25: ["MIKROTIK_DHCP_OPTION_PARAM_STR2", ""], 26: ["MIKROTIK_WIRELESS_VLANID", ""], 27: ["MIKROTIK_WIRELESS_VLANIDTYPE", ""], // 25 to 27
      28: ["MIKROTIK_WIRELESS_MINSIGNAL", ""], 29: ["MIKROTIK_WIRELESS_MAXSIGNAL", ""], 30: ["Mikrotik-Switching-Filter", ""], // 28 to 30, as the table writes them
    },
  },
  30065: {
    name: "Arista Networks, Inc. (formerly 'Arastra, Inc.')", // IANA's name for 30065
    source: "arista-eos-security", // EOS 4.36.2F User Manual, User Security
    missing: null, // documented
    subs: { 1: ["Arista-AVPair", "string"], 22: ["Arista-Config-Vlan", ""] }, // "Arista-AVPair 1 string"; ID 22, type not stated
  },
  47196: { name: "Hewlett Packard Enterprise", source: null, missing: "not-read", subs: {} }, // IANA's name; not read for this tool
});
