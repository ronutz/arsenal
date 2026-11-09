// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/radius-packet-decoder/iana-data.ts
// ----------------------------------------------------------------------------
// The IANA tables the RADIUS packet decoder names things from, GENERATED on
// 2026-11-08 by work/gen_data.py from two registries read that day with curl:
// IANA "RADIUS Types" (radius-types.xml, last updated 2026-10-09): the Packet
// Type Codes, the RADIUS Attribute Types with their RFC 8044 data types (the
// standard space and the RFC 6929 extended space), and the value sub-registries
// of the enumerated attributes; IANA "Extensible Authentication Protocol (EAP)
// Registry" (eap-numbers.xml, last updated 2026-08-31): the Packet Codes and
// the Method Types. Names are exactly as IANA publishes them (English on every
// page). Each row is [first, last, name] (a range when first < last); attribute
// rows add the data type ("" where IANA gives none). Not hand-edited.
// ============================================================================

/** The last-updated date of IANA's RADIUS Types registry as read. */
export const IANA_RADIUS_UPDATED = "2026-10-09"; // the registry's <updated> element
/** The last-updated date of IANA's EAP registry as read. */
export const IANA_EAP_UPDATED = "2026-08-31"; // the registry's <updated> element

/** RADIUS Packet Type Codes: [first, last, name]. */
export const PACKET_CODES: readonly (readonly [number, number, string])[] = [
  [1, 1, "Access-Request"], // 1
  [2, 2, "Access-Accept"], // 2
  [3, 3, "Access-Reject"], // 3
  [4, 4, "Accounting-Request"], // 4
  [5, 5, "Accounting-Response"], // 5
  [6, 6, "Accounting-Status (now Interim Accounting)"], // 6
  [7, 7, "Password-Request"], // 7
  [8, 8, "Password-Ack"], // 8
  [9, 9, "Password-Reject"], // 9
  [10, 10, "Accounting-Message"], // 10
  [11, 11, "Access-Challenge"], // 11
  [12, 12, "Status-Server (experimental)"], // 12
  [13, 13, "Status-Client (experimental)"], // 13
  [21, 21, "Resource-Free-Request"], // 21
  [22, 22, "Resource-Free-Response"], // 22
  [23, 23, "Resource-Query-Request"], // 23
  [24, 24, "Resource-Query-Response"], // 24
  [25, 25, "Alternate-Resource-Reclaim-Request"], // 25
  [26, 26, "NAS-Reboot-Request"], // 26
  [27, 27, "NAS-Reboot-Response"], // 27
  [28, 28, "Reserved"], // 28
  [29, 29, "Next-Passcode"], // 29
  [30, 30, "New-Pin"], // 30
  [31, 31, "Terminate-Session"], // 31
  [32, 32, "Password-Expired"], // 32
  [33, 33, "Event-Request"], // 33
  [34, 34, "Event-Response"], // 34
  [35, 39, "Unassigned"], // 35 to 39
  [40, 40, "Disconnect-Request"], // 40
  [41, 41, "Disconnect-ACK"], // 41
  [42, 42, "Disconnect-NAK"], // 42
  [43, 43, "CoA-Request"], // 43
  [44, 44, "CoA-ACK"], // 44
  [45, 45, "CoA-NAK"], // 45
  [46, 49, "Unassigned"], // 46 to 49
  [50, 50, "IP-Address-Allocate"], // 50
  [51, 51, "IP-Address-Release"], // 51
  [52, 52, "Protocol-Error"], // 52
  [53, 249, "Unassigned"], // 53 to 249
  [250, 253, "Experimental Use"], // 250 to 253
  [254, 254, "Reserved"], // 254
  [255, 255, "Reserved"], // 255
];

/** RADIUS Attribute Types, standard space: [first, last, name, data type]. */
export const ATTRIBUTE_TYPES: readonly (readonly [number, number, string, string])[] = [
  [1, 1, "User-Name", "text"], // 1
  [2, 2, "User-Password", "string"], // 2
  [3, 3, "CHAP-Password", "string"], // 3
  [4, 4, "NAS-IP-Address", "ipv4addr"], // 4
  [5, 5, "NAS-Port", "integer"], // 5
  [6, 6, "Service-Type", "enum"], // 6
  [7, 7, "Framed-Protocol", "enum"], // 7
  [8, 8, "Framed-IP-Address", "ipv4addr"], // 8
  [9, 9, "Framed-IP-Netmask", "ipv4addr"], // 9
  [10, 10, "Framed-Routing", "enum"], // 10
  [11, 11, "Filter-Id", "text"], // 11
  [12, 12, "Framed-MTU", "integer"], // 12
  [13, 13, "Framed-Compression", "enum"], // 13
  [14, 14, "Login-IP-Host", "ipv4addr"], // 14
  [15, 15, "Login-Service", "enum"], // 15
  [16, 16, "Login-TCP-Port", "integer"], // 16
  [17, 17, "Unassigned", ""], // 17
  [18, 18, "Reply-Message", "text"], // 18
  [19, 19, "Callback-Number", "text"], // 19
  [20, 20, "Callback-Id", "text"], // 20
  [21, 21, "Unassigned", ""], // 21
  [22, 22, "Framed-Route", "text"], // 22
  [23, 23, "Framed-IPX-Network", "ipv4addr"], // 23
  [24, 24, "State", "string"], // 24
  [25, 25, "Class", "string"], // 25
  [26, 26, "Vendor-Specific", "vsa"], // 26
  [27, 27, "Session-Timeout", "integer"], // 27
  [28, 28, "Idle-Timeout", "integer"], // 28
  [29, 29, "Termination-Action", "enum"], // 29
  [30, 30, "Called-Station-Id", "text"], // 30
  [31, 31, "Calling-Station-Id", "text"], // 31
  [32, 32, "NAS-Identifier", "text"], // 32
  [33, 33, "Proxy-State", "string"], // 33
  [34, 34, "Login-LAT-Service", "text"], // 34
  [35, 35, "Login-LAT-Node", "text"], // 35
  [36, 36, "Login-LAT-Group", "string"], // 36
  [37, 37, "Framed-AppleTalk-Link", "integer"], // 37
  [38, 38, "Framed-AppleTalk-Network", "integer"], // 38
  [39, 39, "Framed-AppleTalk-Zone", "text"], // 39
  [40, 40, "Acct-Status-Type", "enum"], // 40
  [41, 41, "Acct-Delay-Time", "integer"], // 41
  [42, 42, "Acct-Input-Octets", "integer"], // 42
  [43, 43, "Acct-Output-Octets", "integer"], // 43
  [44, 44, "Acct-Session-Id", "text"], // 44
  [45, 45, "Acct-Authentic", "enum"], // 45
  [46, 46, "Acct-Session-Time", "integer"], // 46
  [47, 47, "Acct-Input-Packets", "integer"], // 47
  [48, 48, "Acct-Output-Packets", "integer"], // 48
  [49, 49, "Acct-Terminate-Cause", "enum"], // 49
  [50, 50, "Acct-Multi-Session-Id", "text"], // 50
  [51, 51, "Acct-Link-Count", "integer"], // 51
  [52, 52, "Acct-Input-Gigawords", "integer"], // 52
  [53, 53, "Acct-Output-Gigawords", "integer"], // 53
  [54, 54, "Unassigned", ""], // 54
  [55, 55, "Event-Timestamp", "time"], // 55
  [56, 56, "Egress-VLANID", "integer"], // 56
  [57, 57, "Ingress-Filters", "enum"], // 57
  [58, 58, "Egress-VLAN-Name", "text"], // 58
  [59, 59, "User-Priority-Table", "string"], // 59
  [60, 60, "CHAP-Challenge", "string"], // 60
  [61, 61, "NAS-Port-Type", "enum"], // 61
  [62, 62, "Port-Limit", "integer"], // 62
  [63, 63, "Login-LAT-Port", "text"], // 63
  [64, 64, "Tunnel-Type", "enum"], // 64
  [65, 65, "Tunnel-Medium-Type", "enum"], // 65
  [66, 66, "Tunnel-Client-Endpoint", "text"], // 66
  [67, 67, "Tunnel-Server-Endpoint", "text"], // 67
  [68, 68, "Acct-Tunnel-Connection", "text"], // 68
  [69, 69, "Tunnel-Password", "string"], // 69
  [70, 70, "ARAP-Password", "string"], // 70
  [71, 71, "ARAP-Features", "string"], // 71
  [72, 72, "ARAP-Zone-Access", "enum"], // 72
  [73, 73, "ARAP-Security", "integer"], // 73
  [74, 74, "ARAP-Security-Data", "text"], // 74
  [75, 75, "Password-Retry", "integer"], // 75
  [76, 76, "Prompt", "enum"], // 76
  [77, 77, "Connect-Info", "text"], // 77
  [78, 78, "Configuration-Token", "text"], // 78
  [79, 79, "EAP-Message", "concat"], // 79
  [80, 80, "Message-Authenticator", "string"], // 80
  [81, 81, "Tunnel-Private-Group-ID", "text"], // 81
  [82, 82, "Tunnel-Assignment-ID", "text"], // 82
  [83, 83, "Tunnel-Preference", "integer"], // 83
  [84, 84, "ARAP-Challenge-Response", "string"], // 84
  [85, 85, "Acct-Interim-Interval", "integer"], // 85
  [86, 86, "Acct-Tunnel-Packets-Lost", "integer"], // 86
  [87, 87, "NAS-Port-Id", "text"], // 87
  [88, 88, "Framed-Pool", "text"], // 88
  [89, 89, "CUI", "string"], // 89
  [90, 90, "Tunnel-Client-Auth-ID", "text"], // 90
  [91, 91, "Tunnel-Server-Auth-ID", "text"], // 91
  [92, 92, "NAS-Filter-Rule", "text"], // 92
  [93, 93, "Unassigned", ""], // 93
  [94, 94, "Originating-Line-Info", "string"], // 94
  [95, 95, "NAS-IPv6-Address", "ipv6addr"], // 95
  [96, 96, "Framed-Interface-Id", "ifid"], // 96
  [97, 97, "Framed-IPv6-Prefix", "ipv6prefix"], // 97
  [98, 98, "Login-IPv6-Host", "ipv6addr"], // 98
  [99, 99, "Framed-IPv6-Route", "text"], // 99
  [100, 100, "Framed-IPv6-Pool", "text"], // 100
  [101, 101, "Error-Cause Attribute", "enum"], // 101
  [102, 102, "EAP-Key-Name", "string"], // 102
  [103, 103, "Digest-Response", "text"], // 103
  [104, 104, "Digest-Realm", "text"], // 104
  [105, 105, "Digest-Nonce", "text"], // 105
  [106, 106, "Digest-Response-Auth", "text"], // 106
  [107, 107, "Digest-Nextnonce", "text"], // 107
  [108, 108, "Digest-Method", "text"], // 108
  [109, 109, "Digest-URI", "text"], // 109
  [110, 110, "Digest-Qop", "text"], // 110
  [111, 111, "Digest-Algorithm", "text"], // 111
  [112, 112, "Digest-Entity-Body-Hash", "text"], // 112
  [113, 113, "Digest-CNonce", "text"], // 113
  [114, 114, "Digest-Nonce-Count", "text"], // 114
  [115, 115, "Digest-Username", "text"], // 115
  [116, 116, "Digest-Opaque", "text"], // 116
  [117, 117, "Digest-Auth-Param", "text"], // 117
  [118, 118, "Digest-AKA-Auts", "text"], // 118
  [119, 119, "Digest-Domain", "text"], // 119
  [120, 120, "Digest-Stale", "text"], // 120
  [121, 121, "Digest-HA1", "text"], // 121
  [122, 122, "SIP-AOR", "text"], // 122
  [123, 123, "Delegated-IPv6-Prefix", "ipv6prefix"], // 123
  [124, 124, "MIP6-Feature-Vector", "integer64"], // 124
  [125, 125, "MIP6-Home-Link-Prefix", "string"], // 125
  [126, 126, "Operator-Name", "text"], // 126
  [127, 127, "Location-Information", "string"], // 127
  [128, 128, "Location-Data", "string"], // 128
  [129, 129, "Basic-Location-Policy-Rules", "string"], // 129
  [130, 130, "Extended-Location-Policy-Rules", "string"], // 130
  [131, 131, "Location-Capable", "enum"], // 131
  [132, 132, "Requested-Location-Info", "enum"], // 132
  [133, 133, "Framed-Management-Protocol", "enum"], // 133
  [134, 134, "Management-Transport-Protection", "enum"], // 134
  [135, 135, "Management-Policy-Id", "text"], // 135
  [136, 136, "Management-Privilege-Level", "integer"], // 136
  [137, 137, "PKM-SS-Cert", "concat"], // 137
  [138, 138, "PKM-CA-Cert", "concat"], // 138
  [139, 139, "PKM-Config-Settings", "string"], // 139
  [140, 140, "PKM-Cryptosuite-List", "string"], // 140
  [141, 141, "PKM-SAID", "text"], // 141
  [142, 142, "PKM-SA-Descriptor", "string"], // 142
  [143, 143, "PKM-Auth-Key", "string"], // 143
  [144, 144, "DS-Lite-Tunnel-Name", "string"], // 144
  [145, 145, "Mobile-Node-Identifier", "string"], // 145
  [146, 146, "Service-Selection", "text"], // 146
  [147, 147, "PMIP6-Home-LMA-IPv6-Address", "ipv6addr"], // 147
  [148, 148, "PMIP6-Visited-LMA-IPv6-Address", "ipv6addr"], // 148
  [149, 149, "PMIP6-Home-LMA-IPv4-Address", "ipv4addr"], // 149
  [150, 150, "PMIP6-Visited-LMA-IPv4-Address", "ipv4addr"], // 150
  [151, 151, "PMIP6-Home-HN-Prefix", "ipv6prefix"], // 151
  [152, 152, "PMIP6-Visited-HN-Prefix", "ipv6prefix"], // 152
  [153, 153, "PMIP6-Home-Interface-ID", "ifid"], // 153
  [154, 154, "PMIP6-Visited-Interface-ID", "ifid"], // 154
  [155, 155, "PMIP6-Home-IPv4-HoA", "ipv4prefix"], // 155
  [156, 156, "PMIP6-Visited-IPv4-HoA", "ipv4prefix"], // 156
  [157, 157, "PMIP6-Home-DHCP4-Server-Address", "ipv4addr"], // 157
  [158, 158, "PMIP6-Visited-DHCP4-Server-Address", "ipv4addr"], // 158
  [159, 159, "PMIP6-Home-DHCP6-Server-Address", "ipv6addr"], // 159
  [160, 160, "PMIP6-Visited-DHCP6-Server-Address", "ipv6addr"], // 160
  [161, 161, "PMIP6-Home-IPv4-Gateway", "ipv4addr"], // 161
  [162, 162, "PMIP6-Visited-IPv4-Gateway", "ipv4addr"], // 162
  [163, 163, "EAP-Lower-Layer", "enum"], // 163
  [164, 164, "GSS-Acceptor-Service-Name", "text"], // 164
  [165, 165, "GSS-Acceptor-Host-Name", "text"], // 165
  [166, 166, "GSS-Acceptor-Service-Specifics", "text"], // 166
  [167, 167, "GSS-Acceptor-Realm-Name", "text"], // 167
  [168, 168, "Framed-IPv6-Address", "ipv6addr"], // 168
  [169, 169, "DNS-Server-IPv6-Address", "ipv6addr"], // 169
  [170, 170, "Route-IPv6-Information", "ipv6prefix"], // 170
  [171, 171, "Delegated-IPv6-Prefix-Pool", "text"], // 171
  [172, 172, "Stateful-IPv6-Address-Pool", "text"], // 172
  [173, 173, "IPv6-6rd-Configuration", "tlv"], // 173
  [174, 174, "Allowed-Called-Station-Id", "text"], // 174
  [175, 175, "EAP-Peer-Id", "string"], // 175
  [176, 176, "EAP-Server-Id", "string"], // 176
  [177, 177, "Mobility-Domain-Id", "integer"], // 177
  [178, 178, "Preauth-Timeout", "integer"], // 178
  [179, 179, "Network-Id-Name", "string"], // 179
  [180, 180, "EAPoL-Announcement", "concat"], // 180
  [181, 181, "WLAN-HESSID", "text"], // 181
  [182, 182, "WLAN-Venue-Info", "integer"], // 182
  [183, 183, "WLAN-Venue-Language", "string"], // 183
  [184, 184, "WLAN-Venue-Name", "text"], // 184
  [185, 185, "WLAN-Reason-Code", "integer"], // 185
  [186, 186, "WLAN-Pairwise-Cipher", "integer"], // 186
  [187, 187, "WLAN-Group-Cipher", "integer"], // 187
  [188, 188, "WLAN-AKM-Suite", "integer"], // 188
  [189, 189, "WLAN-Group-Mgmt-Cipher", "integer"], // 189
  [190, 190, "WLAN-RF-Band", "integer"], // 190
  [191, 191, "Unassigned", ""], // 191
  [192, 223, "Experimental Use", ""], // 192 to 223
  [224, 240, "Implementation Specific", ""], // 224 to 240
  [241, 241, "Extended-Attribute-1", "extended"], // 241
  [242, 242, "Extended-Attribute-2", "extended"], // 242
  [243, 243, "Extended-Attribute-3", "extended"], // 243
  [244, 244, "Extended-Attribute-4", "extended"], // 244
  [245, 245, "Extended-Attribute-5", "long-extended"], // 245
  [246, 246, "Extended-Attribute-6", "long-extended"], // 246
  [247, 255, "Reserved", ""], // 247 to 255
];

/** RADIUS Attribute Types, extended space (RFC 6929): [type, first, last, name, data type]. */
export const EXTENDED_TYPES: readonly (readonly [number, number, number, string, string])[] = [
  [241, 1, 1, "Frag-Status", "integer"], // 241.1
  [241, 2, 2, "Proxy-State-Length", "integer"], // 241.2
  [241, 3, 3, "Response-Length", "integer"], // 241.3
  [241, 4, 4, "Original-Packet-Code", "integer"], // 241.4
  [241, 5, 5, "IP-Port-Limit-Info", "tlv"], // 241.5
  [241, 6, 6, "IP-Port-Range", "tlv"], // 241.6
  [241, 7, 7, "IP-Port-Forwarding-Map", "tlv"], // 241.7
  [241, 8, 8, "Operator-NAS-Identifier", "string"], // 241.8
  [241, 9, 9, "Softwire46-Configuration", "tlv"], // 241.9
  [241, 10, 10, "Softwire46-Priority", "tlv"], // 241.10
  [241, 11, 11, "Softwire46-Multicast", "tlv"], // 241.11
  [241, 12, 12, "User-Access-Group-ID", "string"], // 241.12
  [241, 13, 25, "Unassigned", ""], // 241.13 to 25
  [241, 26, 26, "Extended-Vendor-Specific-1", "evs"], // 241.26
  [241, 27, 240, "Unassigned", ""], // 241.27 to 240
  [241, 241, 255, "Reserved", ""], // 241.241 to 255
  [242, 1, 25, "Unassigned", ""], // 242.1 to 25
  [242, 26, 26, "Extended-Vendor-Specific-2", "evs"], // 242.26
  [242, 27, 240, "Unassigned", ""], // 242.27 to 240
  [242, 241, 255, "Reserved", ""], // 242.241 to 255
  [243, 1, 25, "Unassigned", ""], // 243.1 to 25
  [243, 26, 26, "Extended-Vendor-Specific-3", "evs"], // 243.26
  [243, 27, 240, "Unassigned", ""], // 243.27 to 240
  [243, 241, 255, "Reserved", ""], // 243.241 to 255
  [244, 1, 25, "Unassigned", ""], // 244.1 to 25
  [244, 26, 26, "Extended-Vendor-Specific-4", "evs"], // 244.26
  [244, 27, 240, "Unassigned", ""], // 244.27 to 240
  [244, 241, 255, "Reserved", ""], // 244.241 to 255
  [245, 1, 1, "SAML-Assertion", "text"], // 245.1
  [245, 2, 2, "SAML-Protocol", "text"], // 245.2
  [245, 3, 3, "DHCPv6-Options", "string"], // 245.3
  [245, 4, 4, "DHCPv4-Options", "string"], // 245.4
  [245, 5, 25, "Unassigned", ""], // 245.5 to 25
  [245, 26, 26, "Extended-Vendor-Specific-5", "evs"], // 245.26
  [245, 27, 240, "Unassigned", ""], // 245.27 to 240
  [245, 241, 255, "Reserved", ""], // 245.241 to 255
  [246, 1, 25, "Unassigned", ""], // 246.1 to 25
  [246, 26, 26, "Extended-Vendor-Specific-6", "evs"], // 246.26
  [246, 27, 240, "Unassigned", ""], // 246.27 to 240
  [246, 241, 255, "Reserved", ""], // 246.241 to 255
];

/** Value names of the attributes IANA lists values for: attribute id -> [first, last, name]. */
export const VALUE_NAMES: Readonly<Record<string, readonly (readonly [number, number, string])[]>> = {
  "6": [ // values of attribute 6
    [1, 1, "Login"], // 1
    [2, 2, "Framed"], // 2
    [3, 3, "Callback Login"], // 3
    [4, 4, "Callback Framed"], // 4
    [5, 5, "Outbound"], // 5
    [6, 6, "Administrative"], // 6
    [7, 7, "NAS Prompt"], // 7
    [8, 8, "Authenticate Only"], // 8
    [9, 9, "Callback NAS Prompt"], // 9
    [10, 10, "Call Check"], // 10
    [11, 11, "Callback Administrative"], // 11
    [12, 12, "Voice"], // 12
    [13, 13, "Fax"], // 13
    [14, 14, "Modem Relay"], // 14
    [15, 15, "IAPP-Register"], // 15
    [16, 16, "IAPP-AP-Check"], // 16
    [17, 17, "Authorize Only"], // 17
    [18, 18, "Framed-Management"], // 18
    [19, 19, "Additional-Authorization"], // 19
  ],
  "7": [ // values of attribute 7
    [1, 1, "PPP"], // 1
    [2, 2, "SLIP"], // 2
    [3, 3, "AppleTalk Remote Access Protocol (ARAP)"], // 3
    [4, 4, "Gandalf proprietary SingleLink/MultiLink protocol"], // 4
    [5, 5, "Xylogics proprietary IPX/SLIP"], // 5
    [6, 6, "X.75 Synchronous"], // 6
    [7, 7, "GPRS PDP Context"], // 7
  ],
  "10": [ // values of attribute 10
    [0, 0, "None"], // 0
    [1, 1, "Send routing packets"], // 1
    [2, 2, "Listen for routing packets"], // 2
    [3, 3, "Send and Listen"], // 3
  ],
  "13": [ // values of attribute 13
    [0, 0, "None"], // 0
    [1, 1, "VJ TCP/IP header compression"], // 1
    [2, 2, "IPX header compression"], // 2
    [3, 3, "Stac-LZS compression"], // 3
  ],
  "15": [ // values of attribute 15
    [0, 0, "Telnet"], // 0
    [1, 1, "Rlogin"], // 1
    [2, 2, "TCP Clear"], // 2
    [3, 3, "PortMaster (proprietary)"], // 3
    [4, 4, "LAT"], // 4
    [5, 5, "X25-PAD"], // 5
    [6, 6, "X25-T3POS"], // 6
    [7, 7, "Unassigned"], // 7
    [8, 8, "TCP Clear Quiet (suppresses any NAS-generated connect string)"], // 8
  ],
  "29": [ // values of attribute 29
    [0, 0, "Default"], // 0
    [1, 1, "RADIUS-Request"], // 1
  ],
  "40": [ // values of attribute 40
    [1, 1, "Start"], // 1
    [2, 2, "Stop"], // 2
    [3, 3, "Interim-Update"], // 3
    [4, 4, "Reserved"], // 4
    [5, 5, "Reserved"], // 5
    [6, 6, "Reserved"], // 6
    [7, 7, "Accounting-On"], // 7
    [8, 8, "Accounting-Off"], // 8
    [9, 9, "Tunnel-Start"], // 9
    [10, 10, "Tunnel-Stop"], // 10
    [11, 11, "Tunnel-Reject"], // 11
    [12, 12, "Tunnel-Link-Start"], // 12
    [13, 13, "Tunnel-Link-Stop"], // 13
    [14, 14, "Tunnel-Link-Reject"], // 14
    [15, 15, "Failed"], // 15
    [16, 16, "Unassigned"], // 16
    [17, 17, "Reserved"], // 17
    [18, 18, "Subsystem-On"], // 18
    [19, 19, "Subsystem-Off"], // 19
    [20, 216, "Unassigned"], // 20 to 216
    [217, 217, "Reserved"], // 217
    [218, 218, "Reserved"], // 218
    [219, 219, "Reserved"], // 219
  ],
  "45": [ // values of attribute 45
    [1, 1, "RADIUS"], // 1
    [2, 2, "Local"], // 2
    [3, 3, "Remote"], // 3
    [4, 4, "Diameter"], // 4
  ],
  "49": [ // values of attribute 49
    [1, 1, "User Request"], // 1
    [2, 2, "Lost Carrier"], // 2
    [3, 3, "Lost Service"], // 3
    [4, 4, "Idle Timeout"], // 4
    [5, 5, "Session Timeout"], // 5
    [6, 6, "Admin Reset"], // 6
    [7, 7, "Admin Reboot"], // 7
    [8, 8, "Port Error"], // 8
    [9, 9, "NAS Error"], // 9
    [10, 10, "NAS Request"], // 10
    [11, 11, "NAS Reboot"], // 11
    [12, 12, "Port Unneeded"], // 12
    [13, 13, "Port Preempted"], // 13
    [14, 14, "Port Suspended"], // 14
    [15, 15, "Service Unavailable"], // 15
    [16, 16, "Callback"], // 16
    [17, 17, "User Error"], // 17
    [18, 18, "Host Request"], // 18
    [19, 19, "Supplicant Restart"], // 19
    [20, 20, "Reauthentication Failure"], // 20
    [21, 21, "Port Reinitialized"], // 21
    [22, 22, "Port Administratively Disabled"], // 22
    [23, 23, "Lost Power"], // 23
  ],
  "61": [ // values of attribute 61
    [0, 0, "Async"], // 0
    [1, 1, "Sync"], // 1
    [2, 2, "ISDN Sync"], // 2
    [3, 3, "ISDN Async V.120"], // 3
    [4, 4, "ISDN Async V.110"], // 4
    [5, 5, "Virtual"], // 5
    [6, 6, "PIAFS"], // 6
    [7, 7, "HDLC Clear Channel"], // 7
    [8, 8, "X.25"], // 8
    [9, 9, "X.75"], // 9
    [10, 10, "G.3 Fax"], // 10
    [11, 11, "SDSL - Symmetric DSL"], // 11
    [12, 12, "ADSL-CAP - Asymmetric DSL, Carrierless Amplitude Phase Modulation"], // 12
    [13, 13, "ADSL-DMT - Asymmetric DSL, Discrete Multi-Tone"], // 13
    [14, 14, "IDSL - ISDN Digital Subscriber Line"], // 14
    [15, 15, "Ethernet"], // 15
    [16, 16, "xDSL - Digital Subscriber Line of unknown type"], // 16
    [17, 17, "Cable"], // 17
    [18, 18, "Wireless - Other"], // 18
    [19, 19, "Wireless - IEEE 802.11"], // 19
    [20, 20, "Token-Ring"], // 20
    [21, 21, "FDDI"], // 21
    [22, 22, "Wireless - CDMA2000"], // 22
    [23, 23, "Wireless - UMTS"], // 23
    [24, 24, "Wireless - 1X-EV"], // 24
    [25, 25, "IAPP"], // 25
    [26, 26, "FTTP - Fiber to the Premises"], // 26
    [27, 27, "Wireless - IEEE 802.16"], // 27
    [28, 28, "Wireless - IEEE 802.20"], // 28
    [29, 29, "Wireless - IEEE 802.22"], // 29
    [30, 30, "PPPoA - PPP over ATM"], // 30
    [31, 31, "PPPoEoA - PPP over Ethernet over ATM"], // 31
    [32, 32, "PPPoEoE - PPP over Ethernet over Ethernet"], // 32
    [33, 33, "PPPoEoVLAN - PPP over Ethernet over VLAN"], // 33
    [34, 34, "PPPoEoQinQ - PPP over Ethernet over IEEE 802.1QinQ"], // 34
    [35, 35, "xPON - Passive Optical Network"], // 35
    [36, 36, "Wireless - XGP"], // 36
    [37, 37, "WiMAX Pre-Release 8 IWK Function"], // 37
    [38, 38, "WIMAX-WIFI-IWK: WiMAX WIFI Interworking"], // 38
    [39, 39, "WIMAX-SFF: Signaling Forwarding Function for LTE/3GPP2"], // 39
    [40, 40, "WIMAX-HA-LMA: WiMAX HA and or LMA function"], // 40
    [41, 41, "WIMAX-DHCP: WIMAX DCHP service"], // 41
    [42, 42, "WIMAX-LBS: WiMAX location based service"], // 42
    [43, 43, "WIMAX-WVS: WiMAX voice service"], // 43
  ],
  "64": [ // values of attribute 64
    [1, 1, "Point-to-Point Tunneling Protocol (PPTP)"], // 1
    [2, 2, "Layer Two Forwarding (L2F)"], // 2
    [3, 3, "Layer Two Tunneling Protocol (L2TP)"], // 3
    [4, 4, "Ascend Tunnel Management Protocol (ATMP)"], // 4
    [5, 5, "Virtual Tunneling Protocol (VTP)"], // 5
    [6, 6, "IP Authentication Header in the Tunnel-mode (AH)"], // 6
    [7, 7, "IP-in-IP Encapsulation (IP-IP)"], // 7
    [8, 8, "Minimal IP-in-IP Encapsulation (MIN-IP-IP)"], // 8
    [9, 9, "IP Encapsulating Security Payload in the Tunnel-mode (ESP)"], // 9
    [10, 10, "Generic Route Encapsulation (GRE)"], // 10
    [11, 11, "Bay Dial Virtual Services (DVS)"], // 11
    [12, 12, "IP-in-IP Tunneling"], // 12
    [13, 13, "Virtual LANs (VLAN)"], // 13
  ],
  "65": [ // values of attribute 65
    [1, 1, "IPv4 (IP version 4)"], // 1
    [2, 2, "IPv6 (IP version 6)"], // 2
    [3, 3, "NSAP"], // 3
    [4, 4, "HDLC (8-bit multidrop)"], // 4
    [5, 5, "BBN 1822"], // 5
    [6, 6, "802 (includes all 802 media plus Ethernet \"canonical format\")"], // 6
    [7, 7, "E.163 (POTS)"], // 7
    [8, 8, "E.164 (SMDS, Frame Relay, ATM)"], // 8
    [9, 9, "F.69 (Telex)"], // 9
    [10, 10, "X.121 (X.25, Frame Relay)"], // 10
    [11, 11, "IPX"], // 11
    [12, 12, "Appletalk"], // 12
    [13, 13, "Decnet IV"], // 13
    [14, 14, "Banyan Vines"], // 14
    [15, 15, "E.164 with NSAP format subaddress"], // 15
  ],
  "72": [ // values of attribute 72
    [1, 1, "Only allow access to default zone"], // 1
    [2, 2, "Use zone filter inclusively"], // 2
    [3, 3, "Not used"], // 3
    [4, 4, "Use zone filter exclusively"], // 4
  ],
  "76": [ // values of attribute 76
    [0, 0, "No Echo"], // 0
    [1, 1, "Echo"], // 1
  ],
  "101": [ // values of attribute 101
    [201, 201, "Residual Session Context Removed"], // 201
    [202, 202, "Invalid EAP Packet (Ignored)"], // 202
    [401, 401, "Unsupported Attribute"], // 401
    [402, 402, "Missing Attribute"], // 402
    [403, 403, "NAS Identification Mismatch"], // 403
    [404, 404, "Invalid Request"], // 404
    [405, 405, "Unsupported Service"], // 405
    [406, 406, "Unsupported Extension"], // 406
    [407, 407, "Invalid Attribute Value"], // 407
    [501, 501, "Administratively Prohibited"], // 501
    [502, 502, "Request Not Routable (Proxy)"], // 502
    [503, 503, "Session Context Not Found"], // 503
    [504, 504, "Session Context Not Removable"], // 504
    [505, 505, "Other Proxy Processing Error"], // 505
    [506, 506, "Resources Unavailable"], // 506
    [507, 507, "Request Initiated"], // 507
    [508, 508, "Multiple Session Selection Unsupported"], // 508
    [509, 509, "Location-Info-Required"], // 509
    [601, 601, "Response Too Big"], // 601
  ],
  "133": [ // values of attribute 133
    [1, 1, "SNMP"], // 1
    [2, 2, "Web-based"], // 2
    [3, 3, "NETCONF"], // 3
    [4, 4, "FTP"], // 4
    [5, 5, "TFTP"], // 5
    [6, 6, "SFTP"], // 6
    [7, 7, "RCP"], // 7
    [8, 8, "SCP"], // 8
  ],
  "134": [ // values of attribute 134
    [1, 1, "No-Protection"], // 1
    [2, 2, "Integrity-Protection"], // 2
    [3, 3, "Integrity-Confidentiality-Protection"], // 3
  ],
  "241.1": [ // values of attribute 241.1
    [0, 0, "Reserved"], // 0
    [1, 1, "Fragmentation-Supported"], // 1
    [2, 2, "More-Data-Pending"], // 2
    [3, 3, "More-Data-Request"], // 3
    [4, 255, "Unassigned"], // 4 to 255
  ],
};

/** EAP Packet Codes: [first, last, name]. */
export const EAP_CODES: readonly (readonly [number, number, string])[] = [
  [1, 1, "Request"], // 1
  [2, 2, "Response"], // 2
  [3, 3, "Success"], // 3
  [4, 4, "Failure"], // 4
  [5, 5, "Initiate"], // 5
  [6, 6, "Finish"], // 6
  [7, 255, "Unassigned"], // 7 to 255
];

/** EAP Method Types (the one-octet Type field): [first, last, name]. */
export const EAP_TYPES: readonly (readonly [number, number, string])[] = [
  [0, 0, "Reserved"], // 0
  [1, 1, "Identity"], // 1
  [2, 2, "Notification"], // 2
  [3, 3, "Legacy Nak"], // 3
  [4, 4, "MD5-Challenge"], // 4
  [5, 5, "One-Time Password (OTP)"], // 5
  [6, 6, "Generic Token Card (GTC)"], // 6
  [7, 7, "Allocated"], // 7
  [8, 8, "Allocated"], // 8
  [9, 9, "RSA Public Key Authentication"], // 9
  [10, 10, "DSS Unilateral"], // 10
  [11, 11, "KEA"], // 11
  [12, 12, "KEA-VALIDATE"], // 12
  [13, 13, "EAP-TLS"], // 13
  [14, 14, "Defender Token (AXENT)"], // 14
  [15, 15, "RSA Security SecurID EAP"], // 15
  [16, 16, "Arcot Systems EAP"], // 16
  [17, 17, "EAP-Cisco Wireless"], // 17
  [18, 18, "GSM Subscriber Identity Modules (EAP-SIM)"], // 18
  [19, 19, "SRP-SHA1"], // 19
  [20, 20, "Unassigned"], // 20
  [21, 21, "EAP-TTLS"], // 21
  [22, 22, "Remote Access Service"], // 22
  [23, 23, "EAP-AKA Authentication"], // 23
  [24, 24, "EAP-3Com Wireless"], // 24
  [25, 25, "PEAP"], // 25
  [26, 26, "MS-EAP-Authentication"], // 26
  [27, 27, "Mutual Authentication w/Key Exchange (MAKE)"], // 27
  [28, 28, "CRYPTOCard"], // 28
  [29, 29, "EAP-MSCHAP-V2"], // 29
  [30, 30, "DynamID"], // 30
  [31, 31, "Rob EAP"], // 31
  [32, 32, "Protected One-Time Password"], // 32
  [33, 33, "MS-Authentication-TLV"], // 33
  [34, 34, "SentriNET"], // 34
  [35, 35, "EAP-Actiontec Wireless"], // 35
  [36, 36, "Cogent Systems Biometrics Authentication EAP"], // 36
  [37, 37, "AirFortress EAP"], // 37
  [38, 38, "EAP-HTTP Digest"], // 38
  [39, 39, "SecureSuite EAP"], // 39
  [40, 40, "DeviceConnect EAP"], // 40
  [41, 41, "EAP-SPEKE"], // 41
  [42, 42, "EAP-MOBAC"], // 42
  [43, 43, "EAP-FAST"], // 43
  [44, 44, "ZoneLabs EAP (ZLXEAP)"], // 44
  [45, 45, "EAP-Link"], // 45
  [46, 46, "EAP-PAX"], // 46
  [47, 47, "EAP-PSK"], // 47
  [48, 48, "EAP-SAKE"], // 48
  [49, 49, "EAP-IKEv2"], // 49
  [50, 50, "EAP-AKA'"], // 50
  [51, 51, "EAP-GPSK"], // 51
  [52, 52, "EAP-pwd"], // 52
  [53, 53, "EAP-EKE Version 1"], // 53
  [54, 54, "EAP Method Type for PT-EAP"], // 54
  [55, 55, "TEAP"], // 55
  [56, 56, "EAP-NOOB"], // 56
  [57, 57, "EAP-EDHOC"], // 57
  [58, 191, "Unassigned"], // 58 to 191
  [192, 253, "Unassigned"], // 192 to 253
  [254, 254, "Reserved for the Expanded Type"], // 254
  [255, 255, "Experimental"], // 255
];
