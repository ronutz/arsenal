// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/radius-packet-decoder/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the RADIUS packet decoder
// (08/11/2026). Every source below was downloaded on 2026-11-08 with curl
// (user agent "Mozilla/5.0 (compatible; source-check)", no-cache headers, a
// cache-busting query) and answered HTTP 200, except three vendor pages that
// refused curl and were read with WebFetch (marked in their scope: Cisco 403,
// Arista 406, HPE Aruba 403); the files and the log are in the build's work
// folder. Huawei's documentation refused both; its Table 1-11 and Cisco's tech
// note 13838 were read in a browser on 2026-11-08 (update 2026-11-08b, marked in
// their labels), and the update re-read every RFC it cites with curl. The RFC
// Editor's index (rfc-index.xml, read the same day) gives each RFC's status:
// RFC 2865 is a Draft Standard updated by RFC 2868, 3575, 5080, 6929, 8044 and
// 9765; RFC 2866, 2868, 2869, 3579, 3580, 5176, 5997 and 8907 are
// Informational; RFC 3162, 3748, 6929, 8044 and 9887 are Proposed Standards;
// RFC 6614 and 9765 are Experimental; none of them is obsoleted.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, RADIUS_VECTORS } from "./golden-vectors"; // the set id and the vectors
import { EXAMPLE_INPUT } from "./examples"; // the Example, whose hex stream is the detector's example

// The engine, re-exported for the component and the registry.
export { run, runApi, runLocalisable, parseHex, exampleOf, toHex, shareableCopy, RadiusInputError, MAX_INPUT, MAX_OCTETS, HEADER_OCTETS } from "./compute"; // values
export type { DecodeMode, DecodeRequest, InputFormat, AuthenticatorKind, PacketHeader, TlvReading, VendorSubReading, VendorReading, ExtendedReading, DecodedAttribute, EapReading, VlanReading, PacketResult, AttributesResult, DecodeResult, RedactRule, RedactedField, ShareableCopy } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, RADIUS_VECTORS, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { RadiusVector, VerifyReport } from "./golden-vectors"; // their shapes
export { EXAMPLE_INPUT, SAMPLES, RFC_EXAMPLES, LAB_PACKETS } from "./examples"; // the Example, the chips, the example packets

/** A source of the manifest, built the same way for every entry. */
const src = (id: string, label: string, type: string, url: string, scope: string, status = "active") => ({ id, label, type, url, access_date: "2026-11-08", scope, status }); // read 2026-11-08
/** The mark of a page read in PRIME's browser because the site refuses automated reads (the p37 package's wording). */
const VIA_BROWSER = " (read in a browser on 2026-11-08: the site refuses automated reads)"; // appended to those labels

/** The D-49 declarative manifest for the RADIUS packet decoder. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Protocol & packet decoders", // must equal the catalogue family (D-73)
  toolSlug: "radius-packet-decoder", // the route segment and API path
  canonicalAliases: [
    "radius packet decoder", // the obvious search
    "radius attribute decoder", // what people paste
    "radius hex decoder", // a capture's hex
    "radius vendor-specific attribute", // VSA, type 26
    "access-request decoder", // the packet people look at first
    "radius vs tacacs+", // the comparison panel
  ],
  inputDetectors: [
    // Anchored, bounded, no nested ambiguity (a separator is never a hex digit). The example is the vector format-stream.
    { kind: "regex", pattern: "^\\s*(0[1-5bcBC]|2[89a-dA-D])[\\s:]?[0-9a-fA-F]{2}[\\s:]?0[0-9a-fA-F][\\s:]?[0-9a-fA-F]{2}([\\s:]?[0-9a-fA-F]{2}){16,4092}\\s*$", priority: 6, example: EXAMPLE_INPUT.replace(/\s+/g, "") }, // a RADIUS packet as a hex stream: the vector format-stream
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // parsing and table lookups only: no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: RADIUS_VECTORS.length, // every vector: readings, refusals, shared copies and arrivals
  dangerousInputHandling: [
    "redos-guard", // anchored patterns with bounded repetition only
    "length-bound", // at most 24,000 characters of text and 4,096 octets
    "no-secret", // the shared secret is never asked for: hidden attributes and authenticators are explained, never decrypted or verified
    "share-derived-only", // Share results (2026-11-08b) builds a link only when pressed, carrying after the # a copy of the packet in which every hidden password and key, challenge response, Message-Authenticator and secret-keyed Authenticator (and any octets after the Length) is replaced by zero octets of the same length, marked "redacted in this link" on arrival; the box goes as typed only when nothing needs zeroing or it is one of the RFCs' published examples; a caution line names what a packet still shows
  ],
  shareSafetyDefault: "fragment", // a packet names users, NAS addresses and MAC addresses on a private network

  // -- Teaching & provenance --
  learnLinks: ["learn/radius-end-to-end", "learn/tacacs-plus-device-administration"], // the articles whose packet sections this tool decodes and whose comparison it summarises
  sources: [
    src("rfc2865", "RFC 2865, Remote Authentication Dial In User Service (RADIUS), June 2000: sections 3, 4.1, 5, 5.2, 5.3, 5.26, 5.44 and 7", "standard", "https://www.rfc-editor.org/rfc/rfc2865.txt", "the packet format (Code, Identifier, Length 20 to 4096, padding, the silently discarded short packet, the Request and Response Authenticators), the attribute format and its Length, User-Password hiding, CHAP-Password, Vendor-Specific, the table of attributes, the eight example packets; UDP 1812"),
    src("rfc2865-errata", "RFC Editor, errata for RFC 2865: verified errata 1469 and 6486 (two of the section 7 examples), erratum 9034 (held for document update: Message-Authenticator in Access-Request)", "reference", "https://www.rfc-editor.org/errata/rfc2865", "the Framed-Routing value of the section 7.2 Access-Accept; the State Length of the second section 7.3 Access-Request (0x10 printed, 0x0a corrected); erratum 9034 (https://www.rfc-editor.org/errata/eid9034), reported 2026-07-22, status Held for Document Update since 2026-08-26, a note for readers citing CVE-2024-3596 and the deprecating-radius draft: \"We do not expect to rev 2865\""),
    src("draft-deprecating-radius", "IETF datatracker, draft-ietf-radext-deprecating-radius, Deprecating Insecure Practices in RADIUS: revision 10 of 2026-07-03, Active, WG Document, IESG state I-D Exists, no RFC number", "reference", "https://datatracker.ietf.org/doc/draft-ietf-radext-deprecating-radius/", "where erratum 9034's requirement comes from: an Internet-Draft, not an RFC (the datatracker API answered on 2026-11-08 at 20:02 São Paulo: rev 10, rfc null, expires 2027-01-04)"),
    src("rfc2866", "RFC 2866, RADIUS Accounting, June 2000: sections 3, 4.1 and 5.13", "standard", "https://www.rfc-editor.org/rfc/rfc2866.txt", "UDP 1813, the accounting maximum of 4095 octets, the zeroed Request Authenticator, the Accounting-Request rules and table of attributes, the Accounting-Response"),
    src("rfc2868", "RFC 2868, RADIUS Attributes for Tunnel Protocol Support, June 2000: sections 3.1 to 3.10 and 4", "standard", "https://www.rfc-editor.org/rfc/rfc2868.txt", "the Tag of the tunnel attributes (0x01 to 0x1F, 0 unused, above 0x1F the first octet of the string), the Tunnel-Password Salt and encryption, the table of attributes"),
    src("rfc2869", "RFC 2869, RADIUS Extensions, June 2000: sections 5.4, 5.8, 5.14, 5.15 and 5.19", "standard", "https://www.rfc-editor.org/rfc/rfc2869.txt", "Message-Authenticator at most once in an Access-Request, -Accept, -Reject or -Challenge; for Share results, ARAP-Password (the dial-in user's challenge and response), ARAP-Security-Data (a security module's challenge or response) and ARAP-Challenge-Response (DES of the challenge with the user's password as the key), zeroed in a shared copy"),
    src("rfc3162", "RFC 3162, RADIUS and IPv6, August 2001: sections 2.1 and 3", "standard", "https://www.rfc-editor.org/rfc/rfc3162.txt", "NAS-IPv6-Address as a NAS identity, the table of the IPv6 attributes"),
    src("rfc3579", "RFC 3579, RADIUS Support For Extensible Authentication Protocol (EAP), September 2003: sections 3.1, 3.2, 3.3, 4.3.3 and 4.3.4", "standard", "https://www.rfc-editor.org/rfc/rfc3579.txt", "EAP-Message (in order, consecutive, concatenated), Message-Authenticator (HMAC-MD5, Length 18, required with EAP-Message, optional in any other Access-Request), the table of attributes and its Note 1; for Share results, the shared secret's exposure to an offline dictionary attack \"based on capture of the Response Authenticator or Message-Authenticator attribute\" (s4.3.3) and the known-plaintext attack on the hidden attributes (s4.3.4)"),
    src("rfc3580", "RFC 3580, IEEE 802.1X Remote Authentication Dial In User Service (RADIUS) Usage Guidelines, September 2003: sections 3.20, 3.21 and 3.31", "standard", "https://www.rfc-editor.org/rfc/rfc3580.txt", "VLAN assignment with Tunnel-Type VLAN (13), Tunnel-Medium-Type 802 (6) and Tunnel-Private-Group-ID as the VLAN ID 1 to 4094 in decimal"),
    src("rfc5176", "RFC 5176, Dynamic Authorization Extensions to Remote Authentication Dial In User Service (RADIUS), January 2008: sections 2.3 and 7", "standard", "https://www.rfc-editor.org/rfc/rfc5176.txt", "UDP 3799, the Request and Response Authenticators of Disconnect and CoA packets (the Request Authenticator \"calculated the same way as for an Accounting-Request\"), the three example traces"),
    src("rfc5997", "RFC 5997, Use of Status-Server Packets in the Remote Authentication Dial In User Service (RADIUS) Protocol, August 2010: sections 3, 5 and 6", "standard", "https://www.rfc-editor.org/rfc/rfc5997.txt", "the Status-Server Authenticator, the required Message-Authenticator, the table of attributes, the six example packets"),
    src("rfc5997-errata", "RFC Editor, errata for RFC 5997", "reference", "https://www.rfc-editor.org/errata/rfc5997", "two errata held for document update (2507 on section 3, 2508 on section 4.6.2), neither on the section 6.2 reply whose text says Accounting-Response and whose first octet says Access-Accept; its Response Authenticator is the MD5 over Code 5 with the RFC's secret, so the octet is the misprint (re-read 2026-11-08 at 20:02 São Paulo)"),
    src("rfc6929", "RFC 6929, Remote Authentication Dial In User Service (RADIUS) Protocol Extensions, April 2013: sections 2.1 to 2.8 and 9", "standard", "https://www.rfc-editor.org/rfc/rfc6929.txt", "the Extended Type and Long Extended Type formats, the More and Truncation flags, TLVs, Extended-Vendor-Specific, the dotted identifiers, malformed packets versus invalid attributes, the 18 attribute examples"),
    src("rfc8044", "RFC 8044, Data Types in RADIUS, January 2017: section 3", "standard", "https://www.rfc-editor.org/rfc/rfc8044.txt", "the data types and their sizes: integer, enum, time, text, string, concat, ifid, ipv4addr, ipv6addr, ipv6prefix, ipv4prefix, integer64, tlv, vsa, extended, long-extended, evs, and when each is an invalid attribute"),
    src("rfc2548", "RFC 2548, Microsoft Vendor-specific RADIUS Attributes, March 1999: sections 2.1 to 2.7 and 4", "standard", "https://www.rfc-editor.org/rfc/rfc2548.txt", "Vendor-Id 311 and the Vendor-Type of each MS- sub-attribute; MS-MPPE-Send-Key and MS-MPPE-Recv-Key (Salt, encrypted key); MS-CHAP-MPPE-Keys encrypted \"using the same method defined for the User-Password Attribute\"; the old and new ARAP passwords \"DES-encrypted\"; \"MS-CHAP, like PPP CHAP, is susceptible to dictionary attacks\" (s4)"),
    src("rfc2759", "RFC 2759, Microsoft PPP CHAP Extensions, Version 2, January 2000: section 8.7", "standard", "https://www.rfc-editor.org/rfc/rfc2759.txt", "GenerateAuthenticatorResponse(), the 42-octet authenticator response MS-CHAP2-Success carries, computed from the password, the NT-Response and the two challenges: zeroed in a shared copy"),
    src("rfc5090", "RFC 5090, RADIUS Extension for Digest Authentication, February 2008: sections 3.1, 3.4, 3.19 and 8.2", "standard", "https://www.rfc-editor.org/rfc/rfc5090.txt", "Digest-Response and Digest-Response-Auth, each of which lets one side \"prove possession of the password\", and Digest-HA1, which \"makes offline dictionary attacks easier\": zeroed in a shared copy"),
    src("rfc5904", "RFC 5904, RADIUS Attributes for IEEE 802.16 Privacy Key Management Version 1 (PKMv1) Protocol Support, June 2010: section 3.7", "standard", "https://www.rfc-editor.org/rfc/rfc5904.txt", "PKM-AUTH-Key: a four-octet Lifetime, a Sequence octet and the authorisation key encrypted under the subscriber station's public key, zeroed in a shared copy"),
    src("rfc3748", "RFC 3748, Extensible Authentication Protocol (EAP), June 2004: sections 4, 5.1 to 5.6, 7.6 and 7.14", "standard", "https://www.rfc-editor.org/rfc/rfc3748.txt", "the EAP header carried in EAP-Message: Code, Identifier, Length (padding, silently discarded when too long), Type; for Share results, MD5-Challenge, OTP and GTC rated \"Dictionary attack prot.: No\", GTC's Response carrying \"the Token Card information necessary for authentication\", and cleartext passwords (s7.14)"),
    src("rfc5952", "RFC 5952, A Recommendation for IPv6 Address Text Representation, August 2010: sections 4 and 5", "standard", "https://www.rfc-editor.org/rfc/rfc5952.txt", "how the IPv6 addresses and prefixes of the attributes are printed"),
    src("rfc3629", "RFC 3629, UTF-8, a transformation format of ISO 10646, November 2003", "standard", "https://www.rfc-editor.org/rfc/rfc3629.txt", "well-formed UTF-8 for text values"),
    src("rfc9765", "RFC 9765, RADIUS/1.1: Leveraging Application-Layer Protocol Negotiation (ALPN) to Remove MD5, April 2025 (Experimental): section 4.1", "standard", "https://www.rfc-editor.org/rfc/rfc9765.txt", "the RADIUS/1.1 header (Reserved-1, Token, Reserved-2) over TLS, which the octets alone cannot be told apart from"),
    src("rfc8907", "RFC 8907, The Terminal Access Controller Access-Control System Plus (TACACS+) Protocol, September 2020: sections 1, 3.4, 4.1, 4.5, 6, 7 and 10.1", "standard", "https://www.rfc-editor.org/rfc/rfc8907.txt", "TCP port 49, the 12-byte header (version, type, seq_no, flags, session_id, length), the obfuscation that is not encryption, authentication, authorization and accounting as three separate exchanges, Device Administration"),
    src("rfc9887", "RFC 9887, Terminal Access Controller Access-Control System Plus (TACACS+) over TLS 1.3, December 2025: sections 1 and 3", "standard", "https://www.rfc-editor.org/rfc/rfc9887.txt", "TCP port 300 for TACACS+ over TLS, and the obfuscation it makes obsolete"),
    src("rfc6614", "RFC 6614, Transport Layer Security (TLS) Encryption for RADIUS, May 2012 (Experimental)", "standard", "https://www.rfc-editor.org/rfc/rfc6614.txt", "RADIUS over TLS on TCP port 2083"),
    src("iana-radius-types", "IANA, RADIUS Types registry (last updated 2026-10-09): RADIUS Packet Type Codes, RADIUS Attribute Types with their data types, and the value sub-registries", "registry", "https://www.iana.org/assignments/radius-types/radius-types.xhtml", "every Code, attribute and value name the decoder prints, and each attribute's RFC 8044 data type (read as XML)"),
    src("iana-eap-numbers", "IANA, Extensible Authentication Protocol (EAP) Registry (last updated 2026-08-31): Packet Codes and Method Types", "registry", "https://www.iana.org/assignments/eap-numbers/eap-numbers.xhtml", "the names of the EAP Code and Type inside EAP-Message (read as XML)"),
    src("iana-enterprise-numbers", "IANA, Private Enterprise Numbers registry (last updated 2026-11-06)", "registry", "https://www.iana.org/assignments/enterprise-numbers.txt", "the organisation names of Vendor-Ids 1, 9, 11, 311, 1916, 2011, 2636, 5624, 14823, 14988, 30065 and 47196, as published"),
    src("iana-ports", "IANA, Service Name and Transport Protocol Port Number Registry", "registry", "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml", "tacacs 49, tacacss 300, radius 1812, radius-acct 1813, radsec 2083, radius-dynauth 3799 (read as CSV)"),
    src("iana-protocol-numbers", "IANA, Assigned Internet Protocol Numbers", "registry", "https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml", "17 is UDP, for the pasted IP packets the decoder recognises and refuses with a reason"),
    src("iana-ieee-802-numbers", "IANA, IEEE 802 Numbers: EtherTypes", "registry", "https://www.iana.org/assignments/ieee-802-numbers/ieee-802-numbers.xhtml", "0x0800 IPv4 and 0x86DD IPv6, for the pasted Ethernet frames the decoder recognises and refuses with a reason"),
    src("rfc791", "RFC 791, Internet Protocol, September 1981: section 3.1", "standard", "https://www.rfc-editor.org/rfc/rfc791.txt", "the IPv4 header's version, IHL, Total Length and Protocol, to recognise a pasted IP packet"),
    src("rfc8200", "RFC 8200, Internet Protocol, Version 6 (IPv6) Specification, July 2017: section 3", "standard", "https://www.rfc-editor.org/rfc/rfc8200.txt", "the IPv6 header's Payload Length and Next Header, to recognise a pasted IP packet"),
    src("rfc768", "RFC 768, User Datagram Protocol, August 1980", "standard", "https://www.rfc-editor.org/rfc/rfc768.txt", "the UDP header (ports, length), to name the ports of a pasted packet"),
    src("rfc894", "RFC 894, A Standard for the Transmission of IP Datagrams over Ethernet Networks, April 1984", "standard", "https://www.rfc-editor.org/rfc/rfc894.txt", "EtherType 0x0800 for IPv4 in an Ethernet frame"),
    src("rfc2464", "RFC 2464, Transmission of IPv6 Packets over Ethernet Networks, December 1998: section 3", "standard", "https://www.rfc-editor.org/rfc/rfc2464.txt", "EtherType 0x86DD for IPv6 in an Ethernet frame"),
    src("text2pcap", "Wireshark, text2pcap(1) manual page, Text2pcap 4.6.9", "vendor-docs", "https://www.wireshark.org/docs/man-pages/text2pcap.html", "the hex dump format Wireshark copies and text2pcap reads: an offset of 3 to 8 hex digits (optional 0x and colon), the bytes, an ignored ASCII column, '#' comment lines"),
    src("cisco-c9300-radius", "Cisco, Security Configuration Guide, Cisco IOS XE 17.18.x (Catalyst 9300 Switches): Configuring RADIUS", "vendor-docs", "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/configuring_radius.html", "Vendor-Id 9, vendor-type 1 cisco-avpair, the protocol:attribute sep value format with = mandatory and * optional, shell:priv-lvl=15 (read with WebFetch: cisco.com answered curl with HTTP 403)"),
    src("juniper-radius-vsa", "Juniper Networks, User Access and Authentication Administration Guide (Junos OS): RADIUS Authentication, Juniper Networks Vendor-Specific RADIUS Attributes", "vendor-docs", "https://www.juniper.net/documentation/us/en/software/junos/user-access/topics/topic-map/user-access-radius-authentication.html", "Vendor-Id 2636 and Table 1: Juniper-Local-User-Name (1) to Juniper-Deny-Configuration-Regexps (14), their types"),
    src("arista-eos-security", "Arista Networks, EOS User Manual 4.36.2F: User Security", "vendor-docs", "https://www.arista.com/en/um-eos/eos-user-security", "Vendor-Id 30065, Arista-AVPair (1, string) with shell:priv-lvl and shell:roles, Arista-Config-Vlan (22, no data type given) (read with WebFetch: arista.com answered curl with HTTP 406)"),
    src("aruba-aoscx-vsa", "HPE Aruba Networking, AOS-CX 10.16 Security Guide: Vendor-Specific Attributes in session authorization", "vendor-docs", "https://arubanetworking.hpe.com/techdocs/AOS-CX/10.16/HTML/security_8100-8360/Content/Chp_Sppt_RADIUS_att/rad-ses-aut-att-vsa-fl-10.htm", "Vendor-Id 14823 and ten sub-attributes with their numbers and types, from Aruba-User-Role (1) to Aruba-PoE-Allocate-By-Method (70) (read with WebFetch: the site answered curl with HTTP 403)"),
    src("extreme-se-vsa", "Extreme Networks, Switch Engine v33.7.1 User Guide: Supported RADIUS Attributes (Table 143) and Extreme Networks VSAs (Table 146)", "vendor-docs", "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/downloads/Switch_Engine_33_7_1_User_Guide.pdf#page=1619", "Vendor-Id 1916 and the sub-attributes 201 to 234, with the types Table 146 gives (pages 1609 and 1619 to 1620)"),
    src("mikrotik-radius", "MikroTik, RouterOS manual 7.24: RADIUS, MikroTik Specific RADIUS Attribute Numeric Values", "vendor-docs", "https://manual.mikrotik.com/docs/7.24/authentication-authorization-accounting/radius/", "Vendor-Id 14988 and the names of sub-attributes 1 to 30 (the table gives no data types); \"Mikrotik-Wireless-Enc-Key - WEP encryption key for the client\", zeroed in a shared copy with MIKROTIK_WIRELESS_PSK and MIKROTIK_WIRELESS_MPKEY (re-read with curl 2026-11-08 at 20:05 São Paulo)"),
    src("huawei-radius", "Huawei, S5700 and S6700 V200R025C00 Configuration Guide - User Access and Authentication (EDOC1100514529): AAA Configuration, Understanding AAA, RADIUS AAA, Table 1-11 Huawei proprietary RADIUS attributes" + VIA_BROWSER, "vendor-docs", "https://support.huawei.com/enterprise/en/doc/EDOC1100514529/35071f9a/radius-aaa", "\"The vendor ID of Huawei is 2011\" and the 68 sub-attributes of Table 1-11 with their numbers, names and types (integer, string, ipaddr, hex); HW-Exec-Privilege (26-29): \"The value ranges from 0 to 15. The priority that is greater than or equal to 16 is ineffective.\"; rows 26-158 and 26-253 read again at 21:05: HW-DHCP-Option, \"DHCP Option, encapsulated in Type-Length-Value (TLV) format\", \"Only Option 82 can be delivered.\"; HW-Framed-IPv6-Address, \"IPv6 address to be configured for the user.\""),
    src("rfc3046", "RFC 3046, DHCP Relay Agent Information Option, January 2001: sections 2.0, 3.1 and 3.2", "standard", "https://www.rfc-editor.org/rfc/rfc3046.txt", "Option 82 inside Huawei's HW-DHCP-Option: its sub-options as code, length and value, a minimum length of two, sub-option 1 Agent Circuit ID (\"an agent-local identifier of the circuit\") and 2 Agent Remote ID (\"MUST be globally unique\"), whose values a shared copy zeroes; no errata listed on 2026-11-08"),
    src("cisco-13838", "Cisco, Compare TACACS + and RADIUS, tech note 13838, updated 30 June 2025" + VIA_BROWSER, "vendor-docs", "https://www.cisco.com/c/en/us/support/docs/security-vpn/remote-authentication-dial-user-service-radius/13838-10.html", "the comparison panel's vendor view: \"RADIUS uses UDP while TACACS+ uses TCP\"; RADIUS hides only the password, \"The remainder of the packet is unencrypted\"; TACACS+ protects the body \"but leaves a standard TACACS+ header\" (where Cisco says encrypts, RFC 8907 says obfuscation); \"RADIUS combines authentication and authorization\" and TACACS+ \"separates AAA\""),
    src("rfc-index", "RFC Editor, RFC index (XML): the current status of each RFC above", "registry", "https://www.rfc-editor.org/rfc-index.xml", "Draft Standard, Proposed Standard, Informational or Experimental, and the updates of RFC 2865, 2866, 3579, 5176 and 8907"),
    src("rfc3986", "RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, January 2005: section 3.5", "standard", "https://www.rfc-editor.org/rfc/rfc3986.txt", "the fragment, which carries a Share results link's copy and is not sent to the server"),
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

// Vectors, exposed by the conventional name some runners expect.
export const goldenVectors = RADIUS_VECTORS; // every vector
