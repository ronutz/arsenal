// ============================================================================
// src/lib/tools/acl-first-match-evaluator/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the ACL first-match
// evaluator (02/11/2026): paste a Cisco IOS or IOS XE IPv4 access list,
// describe one packet, and read which entry decides it, the field that ruled
// out every entry above it, or the implicit deny; with a lint of shadowed and
// redundant entries, non-contiguous wildcards and a standard list's reach.
//
// Pure text reading: nothing is sent, resolved or applied to a device (zero
// egress, D-49). The engine is golden-vector tested. It serves chapter 4.3 of
// the LAN Switch Operations and Maintenance course and the Learn article on
// access control lists.
// ============================================================================

import { run as runEngine, type AclReading } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, ACL_VECTORS, API_VECTORS } from "./golden-vectors"; // the vectors

export { // the engine's public names
  analyseAcl, // the reading in English (the API's and the vectors')
  analyseAclLocalisable, // the page's reading, sentences with ids
  parseIpv4, // a dotted-decimal address as a number
  formatIpv4, // and back
  kindOfNumber, // the kind a list number belongs to
  AclRequestError, // the API's typed refusal
  MAX_INPUT, // the input cap in characters
  MAX_LINES, // the input cap in lines
  PROTOCOL_NUMBERS, // the protocol keywords read, with their sourced numbers
  TCP_PORT_NAMES, // the TCP port names of the 17.18.1 data model
  UDP_PORT_NAMES, // the UDP port names of the 17.18.1 data model
} from "./compute";
export type { AclReading, AclList, AclEntry, AclAddress, AclPortTest, AclStep, AclVerdict, AclLint, AclLineIssue, AclPacket, AclPacketInput, AclRequest, AclKind, AclAction, AclField } from "./compute"; // result types
export { GOLDEN_VECTOR_SET_ID, ACL_VECTORS, API_VECTORS, LAB_ACL, verifyVectors } from "./golden-vectors"; // the vectors and their runner
export type { AclVector, AclExpect } from "./golden-vectors"; // their types

/** The D-49 declarative manifest for the ACL first-match evaluator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing", // the catalogue family (with the CIDR calculator and the routing table explainer)
  toolSlug: "acl-first-match-evaluator", // the route segment and i18n key
  canonicalAliases: ["acl evaluator", "access list evaluator", "acl first match", "acl tester", "cisco acl checker", "wildcard mask acl", "acl shadowing"], // search aliases
  inputDetectors: [ // what a paste looks like, for the site's paste box
    // Anchored, no nested quantifiers (ReDoS-safe). Each example is the first line of a golden vector's input.
    { kind: "regex", pattern: "^\\s*ip access-list (standard|extended) \\S", priority: 8, example: "ip access-list extended MGMT-PROTECT" }, // course-lab-ssh-from-vlan10
    { kind: "regex", pattern: "^\\s*access-list \\d{1,4} (permit|deny|remark) ", priority: 8, example: "access-list 10 permit 10.1.10.0 0.0.0.255" }, // standard-source-only
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // text reading and arithmetic; no network, no clock, no execution
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the vector set id
  dangerousInputHandling: [ // how hostile or sensitive input is handled
    "bounded-parse", // 65,536 characters and 4,000 lines at most; refused whole beyond
    "redos-guard", // a whitespace split and a token walk, no backtracking pattern over the input
    "config-not-executed", // the list is read, never applied to anything
    "share-input-caution", // Share results (2026-11-02) builds a link only when pressed, carrying the list and the packet as typed after the #, with a caution line (a list names internal networks and hosts); a credential by its format gets no link
  ],
  shareSafetyDefault: "fragment", // an access list names internal networks, hosts and what reaches them

  // -- Teaching & provenance --
  learnLinks: [ // the Learn articles that teach the same ground
    "learn/access-control-lists-on-switches-and-routers", // first match, the end of the list per platform, wildcards, placement
    "learn/subnetting-basics", // the arithmetic behind a wildcard
  ],
  relatedTools: ["cidr", "routing-table-explainer", "fortigate-policy-match-order", "panos-policy-evaluation-order", "f5-packet-filter-explainer"], // the subnet arithmetic, and the other first-match readers
  // Every source was read on its access_date: the YANG models, RFCs and IANA registry with curl, the cisco.com pages
  // (which refuse this build's curl with HTTP 403) in a browser tab, page text extracted, quotes kept with the build notes.
  // The basis is Cisco IOS XE 17.18.1's published data model; IOS XE 17.18.x reaches End of SW Maintenance Releases on
  // 29 April 2028 (Cisco's end-of-life announcement, read 2026-11-02), and the course's slides show the same syntax on 26.1.x.
  sources: [ // every source, with the day it was read
    { id: "cisco-xe-seqnum", label: "Cisco, Security and VPN Configuration Guide, Cisco IOS XE 17.x: IP Access List Entry Sequence Numbering: first match, the implicit deny, an empty list permits all traffic, sequence numbers assigned 10 apart, duplicates refused, standard host entries hashed and looked up first", url: "https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-acl-seq-num.html", access_date: "2026-11-02", scope: "the walk, the implicit deny, the empty list, sequence numbers, the standard list's hash order", status: "active" }, // the walk
    { id: "cisco-c9000-acls", label: "Cisco, ACLs Configuration Guide, Cisco IOS XE 17 (Catalyst 9000): Access Control Lists: sequence numbers dictate the order of evaluation, remarks are not processed, numbered list syntax and ranges, any and host, port operators, established", url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html", access_date: "2026-11-02", scope: "evaluation by sequence number, numbered syntax, the switch's view of the same rules", status: "active" }, // the switch guide
    { id: "cisco-ios-sec-cr", label: "Cisco IOS Security Command Reference, Commands A to C: access-list (IP extended) and access-list (IP standard): protocol keywords and numbers, wildcard bits (need not be contiguous), port operators and names, established (ACK or RST), fragments, log, the implicit deny", url: "https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-a2.html", access_date: "2026-11-02", scope: "every field the engine reads and how each one matches", status: "active" }, // the syntax
    { id: "cisco-xe-acl-yang", label: "Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-acl (YangModels repository): eq and neq with up to 10 ports, sequence numbers 1 to 2147483647, remarks of 1 to 100 characters, protocol keywords", url: "https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-acl.yang", access_date: "2026-11-02", scope: "multi-port eq and neq, sequence and remark bounds, the keywords Cisco accepts", status: "active" }, // the data model
    { id: "cisco-xe-types-yang", label: "Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-types: std-acl-type and ext-acl-type number ranges, tcp-port-type and udp-port-type names and numbers", url: "https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-types.yang", access_date: "2026-11-02", scope: "list numbers and names, every port name with its number", status: "active" }, // the types
    { id: "cisco-xe-1718-eol", label: "Cisco, End-of-Sale and End-of-Life Announcement for the Cisco IOS XE 17.18.x: End of SW Maintenance Releases 29 April 2028, End of Vulnerability/Security Support 30 September 2029", url: "https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-17/ios-xe-17-18-x-eol.html", access_date: "2026-11-02", scope: "the release the tool reads stays supported", status: "active" }, // the support dates
    { id: "rfc4632", label: "RFC 4632, Classless Inter-domain Routing (CIDR): section 3.1, prefix notation; section 5.1, contiguous masks", url: "https://www.rfc-editor.org/rfc/rfc4632.txt", access_date: "2026-11-02", scope: "the prefix shown beside a contiguous wildcard", status: "active" }, // prefixes
    { id: "iana-protocol-numbers", label: "IANA, Assigned Internet Protocol Numbers: ICMP 1, IGMP 2, TCP 6, UDP 17, GRE 47, ESP 50, EIGRP 88, PIM 103", url: "https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv", access_date: "2026-11-02", scope: "the number behind each protocol keyword", status: "active" }, // numbers
    { id: "rfc2328", label: "RFC 2328, OSPF Version 2: Appendix A.1, OSPF is IP protocol number 89", url: "https://www.rfc-editor.org/rfc/rfc2328.txt", access_date: "2026-11-02", scope: "the number behind the ospf keyword", status: "active" }, // ospf
    { id: "juniper-ex-evaluation", label: "Juniper Networks, Understanding how firewall filters are evaluated (EX Series): every filter ends in an implicit deny, and a filter with no terms discards every packet", url: "https://www.juniper.net/documentation/us/en/software/junos/routing-policy/topics/concept/firewall-filter-ex-series-evaluation-understanding.html", access_date: "2026-11-02", scope: "the scope note: Juniper EX discards at the end of a list", status: "active" }, // Juniper
    { id: "extreme-se-acls", label: "Extreme Networks, Switch Engine v33.7.1 User Guide (PDF), ACLs: if a packet matches no rule entries in the ACL, it is permitted", url: "https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/downloads/Switch_Engine_33_7_1_User_Guide.pdf", access_date: "2026-11-02", scope: "the scope note: Switch Engine permits at the end of a list", status: "active" }, // Switch Engine
    { id: "extreme-fe-acls", label: "Extreme Networks, Fabric Engine v9.4 User Guide, access control lists: the default action mode for ACLs is permit", url: "https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/access_control_lists.shtml", access_date: "2026-11-02", scope: "the scope note: Fabric Engine permits by default", status: "active" }, // Fabric Engine
    { id: "rfc3986", label: "RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, section 3.5: the fragment is not sent when a link is opened", url: "https://www.rfc-editor.org/rfc/rfc3986.txt", access_date: "2026-11-02", scope: "Share results: what a link carries and where", status: "active" }, // the share link
  ],
  credits: [ // who built it
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the author
  ],
});

/**
 * run - the registry-facing entry point.
 * @param input the access list as text, or a JSON object {"acl", "packet", "list"}
 * @returns the reading (throws AclRequestError on a malformed JSON request, and an error on over-long input)
 */
export function run(input: string): AclReading<string> {
  return runEngine(input); // the engine
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = ACL_VECTORS; // the reading vectors
export const apiVectors = API_VECTORS; // the API vectors
