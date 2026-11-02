// ============================================================================
// src/lib/tools/acl-first-match-evaluator/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the ACL first-match evaluator (02/11/2026). Each vector
// pins one documented behaviour, byte for byte where a sentence matters:
//   - first match, entry by entry, with the first field that ruled each
//     earlier entry out (protocol, source, source port, destination,
//     destination port, established, fragments);
//   - the implicit deny, worded as Cisco documents it, and the empty list;
//   - standard against extended lists, a standard entry's omitted mask, and
//     the hash order of a standard list's host entries;
//   - every port operator at its edges, eq and neq with several ports, and
//     port names from the IOS XE 17.18.1 data model;
//   - established (TCP only), host and any, non-contiguous wildcards (one of
//     them Extreme's own documented example, written the Cisco way);
//   - shadowed and redundant entries, including the fragment case;
//   - named lists with sequence numbers out of order, assigned numbers,
//     duplicate numbers and duplicate entries;
//   - malformed and unsupported lines, each listed with its reason;
//   - the course lab's list (LAN Switch Operations and Maintenance, chapter
//     4.3: permit SSH from 10.1.10.0/24 to 10.1.99.0/24, deny the rest to
//     10.1.99.0/24, permit the rest), whose second walk is the page's Example.
// The set id changes whenever the vectors change on purpose.
// ============================================================================

import { analyseAcl, run, type AclPacketInput, type AclReading } from "./compute"; // the engine

/** The vector set id: dated, changed whenever behaviour changes on purpose. */
export const GOLDEN_VECTOR_SET_ID = "acl-first-match-evaluator/2026-11-02"; // the set

/** What a vector expects (every field optional; each present one is compared exactly). */
export interface AclExpect {
  /** "permit@10", "deny@20", "deny@implicit", "permit@empty", or "none" (no verdict). */
  verdict?: string;
  /** The verdict sentence, byte for byte. */
  sentence?: string;
  /** The walk: "seq:field" for each entry ruled out, "seq:match" for the deciding one. */
  walk?: string[];
  /** The lint, in order: "kind seq" or "kind seq<other" (a list-wide finding: "kind -"). */
  lint?: string[];
  /** One lint sentence, byte for byte: [index, sentence]. */
  lintSentence?: [number, string];
  /** The issues: "L<line>: <reason>", byte for byte. */
  issues?: string[];
  /** The selected list's evaluation order, as "10,20,30". */
  order?: string;
  /** The selected list's name. */
  selected?: string | null;
  /** Address forms of the selected list's entries: "seq:source=wildcard|prefix" (prefix "-" when non-contiguous). */
  addresses?: string[];
  /** Notes that must be present, byte for byte (the scope note is always first and not listed here). */
  notes?: string[];
  /** The packet's errors, byte for byte. */
  packetErrors?: string[];
  /** The remarks of the selected list, as read. */
  remarks?: string[];
}

/** One vector. */
export interface AclVector {
  /** Stable id. */
  id: string;
  /** What it asserts. */
  note: string;
  /** The pasted text. */
  acl: string;
  /** The test packet. */
  packet?: AclPacketInput;
  /** The list to evaluate. */
  list?: string;
  /** What must come out. */
  expect: AclExpect;
}

/** The course lab's list (chapter 4.3), as an ip access-list extended block with sequence numbers. */
export const LAB_ACL = [
  "ip access-list extended MGMT-PROTECT", // the named list
  " remark Lab B: SSH from VLAN 10 to the management VLAN 99", // what it is for
  " 10 permit tcp 10.1.10.0 0.0.0.255 10.1.99.0 0.0.0.255 eq 22", // SSH from VLAN 10 to the management network
  " 20 deny ip any 10.1.99.0 0.0.0.255", // everything else to the management network
  " 30 permit ip any any", // the rest
].join("\n"); // one text

/** A TCP packet from source to destination. */
const tcp = (source: string, sourcePort: string, destination: string, destinationPort: string, ackOrRst = false): AclPacketInput => ({ protocol: "tcp", source, sourcePort, destination, destinationPort, ackOrRst }); // a TCP packet
/** A UDP packet. */
const udp = (source: string, sourcePort: string, destination: string, destinationPort: string): AclPacketInput => ({ protocol: "udp", source, sourcePort, destination, destinationPort }); // a UDP packet
/** A packet of another protocol (no ports). */
const other = (protocol: string, source: string, destination: string): AclPacketInput => ({ protocol, source, destination }); // no ports

/** The implicit deny sentence, as the engine writes it. */
const IMPLICIT = "No entry matches, so the packet meets the implicit deny at the end of the list and is denied: Cisco documents that if no conditions match, the packet is dropped, because each access list ends with an unwritten deny statement."; // byte for byte

/** The vectors. */
export const ACL_VECTORS: readonly AclVector[] = Object.freeze([ // None
  // ---- the course lab --------------------------------------------------------------------------------------------
  { id: "course-lab-ssh-from-vlan10", note: "SSH from VLAN 10 to the management network: entry 10 matches first and permits", acl: LAB_ACL, packet: tcp("10.1.10.25", "51514", "10.1.99.10", "22"), // vector course-lab-ssh-from-vlan10
    expect: { verdict: "permit@10", sentence: "Entry 10 matches first and permits the packet.", walk: ["10:match"], lint: [], issues: [], selected: "MGMT-PROTECT", order: "10,20,30", remarks: ["Lab B: SSH from VLAN 10 to the management VLAN 99"], addresses: ["10:source=10.1.10.0 0.0.0.255|10.1.10.0/24", "10:destination=10.1.99.0 0.0.0.255|10.1.99.0/24", "20:source=0.0.0.0 255.255.255.255|0.0.0.0/0", "20:destination=10.1.99.0 0.0.0.255|10.1.99.0/24", "30:source=0.0.0.0 255.255.255.255|0.0.0.0/0", "30:destination=0.0.0.0 255.255.255.255|0.0.0.0/0"] } }, // what course-lab-ssh-from-vlan10 must give
  { id: "course-lab-vlan20-ssh-denied", note: "THE PAGE'S EXAMPLE: SSH from VLAN 20 fails entry 10 on the source address and is denied by entry 20", acl: LAB_ACL, packet: tcp("10.1.20.25", "51514", "10.1.99.10", "22"), // vector course-lab-vlan20-ssh-denied
    expect: { verdict: "deny@20", sentence: "Entry 20 matches first and denies the packet.", walk: ["10:source", "20:match"], lint: [] } }, // what course-lab-vlan20-ssh-denied must give
  { id: "course-lab-rest-permitted", note: "ICMP from VLAN 20 to the internet: 10 fails on the protocol, 20 on the destination, 30 permits", acl: LAB_ACL, packet: other("icmp", "10.1.20.5", "192.0.2.80"), // vector course-lab-rest-permitted
    expect: { verdict: "permit@30", walk: ["10:protocol", "20:destination", "30:match"] } }, // what course-lab-rest-permitted must give
  { id: "course-lab-swapped", note: "the first two rules swapped: SSH from VLAN 10 is now denied, and the permit is shadowed", acl: "ip access-list extended MGMT-PROTECT\n 10 deny ip any 10.1.99.0 0.0.0.255\n 20 permit tcp 10.1.10.0 0.0.0.255 10.1.99.0 0.0.0.255 eq 22\n 30 permit ip any any", packet: tcp("10.1.10.25", "51514", "10.1.99.10", "22"), // vector course-lab-swapped
    expect: { verdict: "deny@10", walk: ["10:match"], lint: ["shadowed 20<10"], lintSentence: [0, "Entry 20 can never match: entry 10 is tested before it and matches every packet it would, with the opposite action (deny). It is shadowed."] } }, // what course-lab-swapped must give
  { id: "course-lab-with-interface-lines", note: "configuration around the list is listed with its reason, never dropped", acl: `${LAB_ACL}\ninterface Vlan10\n ip access-group MGMT-PROTECT in`, packet: tcp("10.1.10.25", "51514", "10.1.99.10", "22"), // vector course-lab-with-interface-lines
    expect: { verdict: "permit@10", issues: ["L6: Not an access-list line this tool reads.", "L7: ip access-group applies a list to an interface; v1 reads the list, not where it is applied."] } }, // what course-lab-with-interface-lines must give
  // ---- first match on each field --------------------------------------------------------------------------------------
  { id: "field-source-port", note: "a source port test that fails, then the implicit deny", acl: "access-list 101 permit udp any eq 53 any", packet: udp("192.0.2.1", "1234", "198.51.100.1", "53"), // vector field-source-port
    expect: { verdict: "deny@implicit", sentence: IMPLICIT, walk: ["10:sourcePort"] } }, // what field-source-port must give
  { id: "field-destination-port", note: "a destination port test that fails", acl: "access-list 101 permit tcp any any eq 443\naccess-list 101 permit tcp any any eq www", packet: tcp("192.0.2.1", "40000", "198.51.100.1", "80"), // vector field-destination-port
    expect: { verdict: "permit@20", walk: ["10:destinationPort", "20:match"] } }, // what field-destination-port must give
  { id: "field-established-fails", note: "established needs ACK or RST: an opening segment fails it", acl: "access-list 110 permit tcp any any established", packet: tcp("198.51.100.9", "443", "10.1.10.25", "51514", false), // vector field-established-fails
    expect: { verdict: "deny@implicit", walk: ["10:established"] } }, // what field-established-fails must give
  { id: "field-established-matches", note: "a segment with ACK or RST set passes established", acl: "access-list 110 permit tcp any any established", packet: tcp("198.51.100.9", "443", "10.1.10.25", "51514", true), // vector field-established-matches
    expect: { verdict: "permit@10", walk: ["10:match"] } }, // what field-established-matches must give
  { id: "field-fragments", note: "a fragments entry never matches the unfragmented test packet", acl: "access-list 120 deny ip any any fragments\naccess-list 120 permit ip any any", packet: other("gre", "192.0.2.1", "192.0.2.2"), // vector field-fragments
    expect: { verdict: "permit@20", walk: ["10:fragments", "20:match"] } }, // what field-fragments must give
  { id: "field-protocol-number", note: "a protocol number matches that protocol only; ip matches every protocol", acl: "access-list 130 permit 47 any any\naccess-list 130 deny ip any any", packet: other("50", "192.0.2.1", "192.0.2.2"), // vector field-protocol-number
    expect: { verdict: "deny@20", walk: ["10:protocol", "20:match"] } }, // what field-protocol-number must give
  // ---- the implicit deny and the empty list ----------------------------------------------------------------------------
  { id: "implicit-deny", note: "nothing matches: the implicit deny, as Cisco words it", acl: "ip access-list extended ONLY-WEB\n permit tcp any host 192.0.2.10 eq 443", packet: tcp("198.51.100.7", "40000", "192.0.2.11", "443"), // vector implicit-deny
    expect: { verdict: "deny@implicit", sentence: IMPLICIT, walk: ["10:destination"], order: "10" } }, // what implicit-deny must give
  { id: "empty-list-permits", note: "a list with no entries: Cisco documents that an empty list applied to an interface permits all traffic", acl: "ip access-list standard EMPTY\n remark nothing yet", packet: other("icmp", "192.0.2.1", "192.0.2.2"), // vector empty-list-permits
    expect: { verdict: "permit@empty", sentence: "List EMPTY has no entries. Cisco documents that an interface with an empty access list applied to it permits all traffic.", walk: [], remarks: ["nothing yet"] } }, // what empty-list-permits must give
  // ---- standard against extended --------------------------------------------------------------------------------------------
  { id: "standard-source-only", note: "a standard list reads the source only, whatever the protocol and destination", acl: "access-list 10 permit 10.1.10.0 0.0.0.255", packet: udp("10.1.10.7", "5000", "203.0.113.9", "53"), // vector standard-source-only
    expect: { verdict: "permit@10", walk: ["10:match"], lint: ["standard-reach -"], notes: ["A standard list reads the packet's source address only: the protocol, the destination and the ports played no part."] } }, // what standard-source-only must give
  { id: "standard-omitted-mask", note: "a standard entry with no mask takes 0.0.0.0: one host", acl: "access-list 11 permit 192.0.2.1", packet: other("icmp", "192.0.2.2", "198.51.100.1"), // vector standard-omitted-mask
    expect: { verdict: "deny@implicit", walk: ["10:source"], addresses: ["10:source=192.0.2.1 0.0.0.0|192.0.2.1/32"] } }, // what standard-omitted-mask must give
  { id: "standard-named-by-number", note: "ip access-list standard 12 and access-list 12 are one list; an entry in a standard list naming a protocol is refused", acl: "access-list 12 permit host 192.0.2.1\nip access-list standard 12\n permit 198.51.100.0 0.0.0.255\naccess-list 12 permit tcp any any", packet: other("icmp", "198.51.100.40", "192.0.2.9"), // vector standard-named-by-number
    expect: { verdict: "permit@20", walk: ["10:source", "20:match"], order: "10,20", issues: ["L4: A standard entry tests the source address only; tcp belongs in an extended list."] } }, // what standard-named-by-number must give
  { id: "standard-hash-order", note: "a host entry of a standard list is looked up before the subnet entries, ahead of its sequence number", acl: "access-list 10 deny 10.1.1.0 0.0.0.255\naccess-list 10 permit host 10.1.1.5\naccess-list 10 permit any", packet: other("icmp", "10.1.1.5", "192.0.2.1"), // vector standard-hash-order
    expect: { verdict: "permit@20", walk: ["20:match"], order: "20,10,30", lint: ["standard-reach -", "hash-order 20<10"], notes: ["This standard list names single hosts after other entries. Cisco looks host entries up first, so the walk tests them first, ahead of their sequence numbers."] } }, // what standard-hash-order must give
  // ---- port operators at their edges -------------------------------------------------------------------------------------
  { id: "port-eq-match", note: "eq 22 admits 22", acl: "access-list 140 permit tcp any any eq 22", packet: tcp("192.0.2.1", "40000", "192.0.2.2", "22"), expect: { verdict: "permit@10" } }, // vector port-eq-match
  { id: "port-eq-miss", note: "eq 22 refuses 23", acl: "access-list 140 permit tcp any any eq 22", packet: tcp("192.0.2.1", "40000", "192.0.2.2", "23"), expect: { verdict: "deny@implicit", walk: ["10:destinationPort"] } }, // vector port-eq-miss
  { id: "port-eq-several", note: "eq takes up to 10 ports (IOS XE 17.18.1 data model): eq 80 443 admits 443", acl: "access-list 140 permit tcp any any eq 80 443", packet: tcp("192.0.2.1", "40000", "192.0.2.2", "443"), expect: { verdict: "permit@10" } }, // vector port-eq-several
  { id: "port-neq-miss", note: "neq 22 refuses 22", acl: "access-list 141 permit tcp any any neq 22", packet: tcp("192.0.2.1", "40000", "192.0.2.2", "22"), expect: { verdict: "deny@implicit", walk: ["10:destinationPort"] } }, // vector port-neq-miss
  { id: "port-neq-match", note: "neq 22 admits 21", acl: "access-list 141 permit tcp any any neq 22", packet: tcp("192.0.2.1", "40000", "192.0.2.2", "21"), expect: { verdict: "permit@10" } }, // vector port-neq-match
  { id: "port-neq-several", note: "neq 53 54 refuses 54 and admits 55", acl: "access-list 141 deny udp any any neq 53 54\naccess-list 141 permit udp any any", packet: udp("192.0.2.1", "40000", "192.0.2.2", "54"), expect: { verdict: "permit@20", walk: ["10:destinationPort", "20:match"] } }, // vector port-neq-several
  { id: "port-lt-edge-in", note: "lt 1024 admits 1023", acl: "access-list 142 permit tcp any any lt 1024", packet: tcp("192.0.2.1", "40000", "192.0.2.2", "1023"), expect: { verdict: "permit@10" } }, // vector port-lt-edge-in
  { id: "port-lt-edge-out", note: "lt 1024 refuses 1024", acl: "access-list 142 permit tcp any any lt 1024", packet: tcp("192.0.2.1", "40000", "192.0.2.2", "1024"), expect: { verdict: "deny@implicit", walk: ["10:destinationPort"] } }, // vector port-lt-edge-out
  { id: "port-gt-edge-in", note: "gt 1023 admits 1024", acl: "access-list 143 permit tcp any gt 1023 any", packet: tcp("192.0.2.1", "1024", "192.0.2.2", "80"), expect: { verdict: "permit@10" } }, // vector port-gt-edge-in
  { id: "port-gt-edge-out", note: "gt 1023 refuses 1023 (a source port test)", acl: "access-list 143 permit tcp any gt 1023 any", packet: tcp("192.0.2.1", "1023", "192.0.2.2", "80"), expect: { verdict: "deny@implicit", walk: ["10:sourcePort"] } }, // vector port-gt-edge-out
  { id: "port-range-low-out", note: "range 1000 2000 refuses 999", acl: "access-list 144 permit udp any any range 1000 2000", packet: udp("192.0.2.1", "5", "192.0.2.2", "999"), expect: { verdict: "deny@implicit", walk: ["10:destinationPort"] } }, // vector port-range-low-out
  { id: "port-range-low-in", note: "range is inclusive: 1000 is in", acl: "access-list 144 permit udp any any range 1000 2000", packet: udp("192.0.2.1", "5", "192.0.2.2", "1000"), expect: { verdict: "permit@10" } }, // vector port-range-low-in
  { id: "port-range-high-in", note: "range is inclusive: 2000 is in", acl: "access-list 144 permit udp any any range 1000 2000", packet: udp("192.0.2.1", "5", "192.0.2.2", "2000"), expect: { verdict: "permit@10" } }, // vector port-range-high-in
  { id: "port-range-high-out", note: "range 1000 2000 refuses 2001", acl: "access-list 144 permit udp any any range 1000 2000", packet: udp("192.0.2.1", "5", "192.0.2.2", "2001"), expect: { verdict: "deny@implicit", walk: ["10:destinationPort"] } }, // vector port-range-high-out
  { id: "port-names", note: "port names from the 17.18.1 data model: www is TCP 80, domain UDP 53, snmp UDP 161", acl: "access-list 145 permit tcp any any eq www\naccess-list 145 permit udp any any eq domain\naccess-list 145 permit udp any any eq snmp", packet: udp("192.0.2.1", "40000", "192.0.2.2", "161"), expect: { verdict: "permit@30", walk: ["10:protocol", "20:destinationPort", "30:match"] } }, // vector port-names
  { id: "port-names-wrong-protocol", note: "TCP names only with tcp, UDP names only with udp; a listed name without a number; an unknown name", acl: "access-list 146 permit tcp any any eq snmp\naccess-list 146 permit udp any any eq www\naccess-list 146 permit tcp any any eq drip\naccess-list 146 permit tcp any any eq https", // vector port-names-wrong-protocol
    expect: { verdict: "none", issues: ["L1: snmp is a UDP port name: Cisco reads TCP port names only with tcp and UDP port names only with udp.", "L2: www is a TCP port name: Cisco reads TCP port names only with tcp and UDP port names only with udp.", "L3: drip is listed by Cisco as a TCP port name, but no source read for this tool gives its number; write the number.", "L4: https is not a TCP port name in Cisco's IOS XE 17.18.1 data model; write the port number."], selected: null } }, // what port-names-wrong-protocol must give
  // ---- established, host and any ------------------------------------------------------------------------------------------
  { id: "established-tcp-only", note: "established after udp is refused (Cisco: not valid for UDP)", acl: "access-list 150 permit udp any any established", // vector established-tcp-only
    expect: { issues: ["L1: established is valid for TCP only (Cisco: the flag and established keywords are not valid for UDP)."] } }, // what established-tcp-only must give
  { id: "host-and-any", note: "host A is A 0.0.0.0; any is 0.0.0.0 255.255.255.255", acl: "access-list 151 permit ip host 10.1.1.1 any", packet: other("icmp", "10.1.1.2", "192.0.2.1"), // vector host-and-any
    expect: { verdict: "deny@implicit", walk: ["10:source"], addresses: ["10:source=10.1.1.1 0.0.0.0|10.1.1.1/32", "10:destination=0.0.0.0 255.255.255.255|0.0.0.0/0"] } }, // what host-and-any must give
  // ---- wildcards --------------------------------------------------------------------------------------------------------------
  { id: "non-contiguous-match", note: "a non-contiguous wildcard: 10.x.y.1 for any x and y", acl: "access-list 160 permit ip 10.0.0.1 0.255.255.0 any", packet: other("icmp", "10.200.3.1", "192.0.2.1"), // vector non-contiguous-match
    expect: { verdict: "permit@10", lint: ["non-contiguous 10"], addresses: ["10:source=10.0.0.1 0.255.255.0|-", "10:destination=0.0.0.0 255.255.255.255|0.0.0.0/0"], // what non-contiguous-match must give
      lintSentence: [0, "Entry 10 uses the non-contiguous wildcard 0.255.255.0 on its source (10.0.0.1 0.255.255.0): legal, since Cisco says wildcard bits set to 1 need not be contiguous, but no prefix length can express it, and its 65536 addresses do not form one block."] } }, // what non-contiguous-match must give
  { id: "non-contiguous-miss", note: "the same wildcard refuses 10.200.3.2", acl: "access-list 160 permit ip 10.0.0.1 0.255.255.0 any", packet: other("icmp", "10.200.3.2", "192.0.2.1"), expect: { verdict: "deny@implicit", walk: ["10:source"] } }, // vector non-contiguous-miss
  { id: "non-contiguous-extreme-example", note: "Extreme Fabric Engine's own example (3.4.5.6 with mask 255.255.255.0 matches only the last octet), written the Cisco way: 192.168.1.6 matches, 3.4.5.7 does not", acl: "access-list 161 permit ip 3.4.5.6 255.255.255.0 any", packet: other("icmp", "192.168.1.6", "192.0.2.1"), // vector non-contiguous-extreme-example
    expect: { verdict: "permit@10", lint: ["non-contiguous 10", "ignored-bits 10"] } }, // what non-contiguous-extreme-example must give
  { id: "non-contiguous-extreme-example-miss", note: "and 3.4.5.7 does not match", acl: "access-list 161 permit ip 3.4.5.6 255.255.255.0 any", packet: other("icmp", "3.4.5.7", "192.0.2.1"), expect: { verdict: "deny@implicit", walk: ["10:source"] } }, // vector non-contiguous-extreme-example-miss
  { id: "ignored-bits", note: "an address with bits set where its wildcard ignores them matches the cleared block", acl: "access-list 162 permit ip 10.1.1.5 0.0.0.255 any", packet: other("icmp", "10.1.1.200", "192.0.2.1"), // vector ignored-bits
    expect: { verdict: "permit@10", lint: ["ignored-bits 10"], addresses: ["10:source=10.1.1.0 0.0.0.255|10.1.1.0/24", "10:destination=0.0.0.0 255.255.255.255|0.0.0.0/0"], // what ignored-bits must give
      lintSentence: [0, "Entry 10: the source address 10.1.1.5 has bits set where the wildcard 0.0.0.255 ignores them, so it matches the same addresses as 10.1.1.0 0.0.0.255."] } }, // what ignored-bits must give
  // ---- shadowed and redundant ----------------------------------------------------------------------------------------------
  { id: "shadowed-and-redundant", note: "an earlier broader entry shadows a later one with the opposite action, and makes a same-action one redundant", acl: "ip access-list extended S\n deny ip 10.0.0.0 0.255.255.255 any\n permit tcp 10.1.1.0 0.0.0.255 any eq 22\n deny ip host 10.9.9.9 any\n permit ip any any", // vector shadowed-and-redundant
    expect: { lint: ["shadowed 20<10", "redundant 30<10"], lintSentence: [1, "Entry 30 is redundant: entry 10 is tested before it and matches every packet it would, with the same action (deny), so removing it changes nothing."] } }, // what shadowed-and-redundant must give
  { id: "redundant-later-and-implicit", note: "a narrower entry made redundant by a later same-action entry with nothing between, and a final deny that only repeats the implicit deny", acl: "ip access-list extended R\n permit tcp host 10.1.1.1 any eq 22\n deny udp any any\n permit tcp 10.1.1.0 0.0.0.255 any eq 22\n deny ip any any log", // vector redundant-later-and-implicit
    expect: { lint: ["redundant-later 10<30", "redundant-later 20<40", "redundant-implicit 40"], lintSentence: [2, "Entry 40 denies only packets the implicit deny at the end would deny anyway, since no later entry permits any of them; it changes no verdict and is there for its log."] } }, // what redundant-later-and-implicit must give
  { id: "not-redundant-when-between", note: "an entry between them with the other action that overlaps keeps the narrower entry useful", acl: "ip access-list extended N\n permit tcp host 10.1.1.1 any eq 22\n deny tcp any any eq 22\n permit tcp 10.1.1.0 0.0.0.255 any eq 22", // vector not-redundant-when-between
    expect: { lint: ["shadowed 30<20"] } }, // what not-redundant-when-between must give
  { id: "shadowed-except-fragments", note: "a deny with a port does not apply to non-initial fragments, so the permit below still decides those", acl: "ip access-list extended F\n deny tcp any any eq 22\n permit tcp any any eq 22", // vector shadowed-except-fragments
    expect: { lint: ["shadowed 20<10"], lintSentence: [0, "Entry 20 is shadowed for every unfragmented packet: entry 10 is tested before it and matches all of them with the opposite action (deny). It still decides non-initial fragments, which Cisco does not test against a deny entry with ports or established."] } }, // what shadowed-except-fragments must give
  { id: "never-matches", note: "lt 0 admits no port", acl: "access-list 170 deny tcp any any lt 0\naccess-list 170 permit ip any any", // vector never-matches
    expect: { lint: ["never-matches 10"], lintSentence: [0, "Entry 10 can never match an unfragmented packet: its port test lt 0 admits no port."] } }, // what never-matches must give
  // ---- named lists and sequence numbers ----------------------------------------------------------------------------------
  { id: "named-out-of-order", note: "Cisco evaluates by sequence number: 30, 10, an unnumbered entry (40) and 20 are tested 10, 20, 30, 40", acl: "ip access-list extended WEB\n 30 permit tcp any host 192.0.2.10 eq www\n 10 deny tcp host 198.51.100.66 any\n permit tcp any any established\n 20 permit udp any any eq domain", packet: tcp("198.51.100.7", "40000", "192.0.2.10", "80"), // vector named-out-of-order
    expect: { order: "10,20,30,40", walk: ["10:source", "20:protocol", "30:match"], verdict: "permit@30" } }, // what named-out-of-order must give
  { id: "named-duplicates", note: "a sequence number already used is refused; an entry equal to one already there makes no change", acl: "ip access-list extended D\n 10 permit tcp any any eq 22\n 10 permit tcp any any eq 23\n 20 permit tcp any any eq 22", // vector named-duplicates
    expect: { order: "10", issues: ["L3: Sequence number 10 is already used in list D: Cisco refuses the entry with Duplicate sequence number.", "L4: The same entry as 10, apart from its sequence number: Cisco makes no change."] } }, // what named-duplicates must give
  { id: "named-several-lists", note: "the list asked for is the one walked; the others are read", acl: "access-list 10 permit any\nip access-list extended EDGE\n deny ip any any", list: "EDGE", packet: other("icmp", "192.0.2.1", "192.0.2.2"), // vector named-several-lists
    expect: { selected: "EDGE", verdict: "deny@10" } }, // what named-several-lists must give
  { id: "named-missing-list", note: "a list name not in the text falls back to the first list, and says so", acl: "access-list 10 permit any", list: "NOPE", packet: other("icmp", "192.0.2.1", "192.0.2.2"), // vector named-missing-list
    expect: { selected: "10", verdict: "permit@10", notes: ["There is no list NOPE in the text, so the first list, 10, is read."] } }, // what named-missing-list must give
  // ---- lines not read ----------------------------------------------------------------------------------------------------
  { id: "malformed-lines", note: "every line it does not read is listed with its reason", acl: [ // vector malformed-lines
      "access-list 300 permit any", // another kind of list
      "access-list 101 permit tcp any any eq 22 fragments", // refused by Cisco
      "access-list 101 permit ip 10.1.1.0 any", // missing wildcard
      "access-list 101 permit ip server1 any", // a host name
      "access-list 101 permit icmp any any echo", // a message type
      "access-list 101 permit tcp any any dscp ef", // a field the packet does not carry
      "access-list 101 permit ip object-group INSIDE any", // object groups
      "access-list 101 permit ahp any any", // an unsourced protocol number
      "access-list 101 permit ip any any foo", // a trailing word
      "access-list 101 10 permit ip any any", // a sequence number on a numbered line
      "permit ip any any", // outside a list
      "Extended IP access list 101", // show output
      "no access-list 101", // a removal
      "ip access-list resequence 101 10 10", // not a definition
      "hostname SW1", // configuration
      "access-list 101 permit tcp any any range 2000 1000", // a reversed range
    ].join("\n"), // malformed-lines: the pasted text
    expect: { issues: [ // what malformed-lines must give
      "L1: List number 300 is not an IPv4 standard (1 to 99, 1300 to 1999) or extended (100 to 199, 2000 to 2699) list.", // malformed-lines: one expected line
      "L2: fragments cannot be combined with ports or established: Cisco refuses it on an entry with Layer 4 information.", // malformed-lines: one expected line
      "L3: An extended entry needs a wildcard after 10.1.1.0 (or host before it, or any instead).", // malformed-lines: one expected line
      "L4: server1 is not an IPv4 address in dotted-decimal form; host names are not read.", // malformed-lines: one expected line
      "L5: echo: ICMP and IGMP message types are outside v1.", // malformed-lines: one expected line
      "L6: dscp tests something the test packet does not carry (precedence, ToS, DSCP, time ranges, IP options, TTL, TCP flags other than established); v1 does not read it.", // malformed-lines: one expected line
      "L7: Object groups are outside v1: the tool cannot see their members.", // malformed-lines: one expected line
      "L8: Protocol ahp: Cisco accepts this keyword, but no source read for this tool gives its protocol number; write the number instead.", // malformed-lines: one expected line
      "L9: Unexpected foo after the entry.", // malformed-lines: one expected line
      "L10: Numbered access-list lines take no sequence number; give one inside ip access-list extended 101.", // malformed-lines: one expected line
      "L11: An entry outside any list: no ip access-list line above it opens one.", // malformed-lines: one expected line
      "L12: This is a show access-lists heading; paste the configuration lines (access-list or ip access-list) instead.", // malformed-lines: one expected line
      "L13: A no command removes configuration; v1 reads the list as written and does not apply removals.", // malformed-lines: one expected line
      "L14: ip access-list resequence is not a list definition this tool reads; v1 reads standard and extended IPv4 lists.", // malformed-lines: one expected line
      "L15: Not an access-list line this tool reads.", // malformed-lines: one expected line
      "L16: range 2000 1000: the first port is greater than the second, and the sources read do not say what the device does with that.", // malformed-lines: one expected line
    ], selected: null, verdict: "none" } }, // malformed-lines: end of the list
  { id: "unread-entries-caveat", note: "with entries it could not read, the verdict says it covers only the entries read", acl: "access-list 101 permit icmp any any echo\naccess-list 101 deny ip any any", packet: other("icmp", "192.0.2.1", "192.0.2.2"), // vector unread-entries-caveat
    expect: { verdict: "deny@10", notes: ["Entry lines not read: 1 (listed below). If the device holds any of them, the verdict may differ: it covers only the entries that were read."] } }, // what unread-entries-caveat must give
  // ---- the packet --------------------------------------------------------------------------------------------------------
  { id: "packet-refused", note: "a packet that cannot be read gets no verdict, with the reasons", acl: "access-list 1 permit any", packet: { protocol: "http", source: "10.1.1", destination: "192.0.2.1", sourcePort: "", destinationPort: "" }, // vector packet-refused
    expect: { verdict: "none", packetErrors: ["The packet's protocol is tcp, udp, icmp, igmp, gre, esp, eigrp, ospf, pim or a number from 0 to 255.", "The packet's source address is an IPv4 address in dotted-decimal form, such as 10.1.10.25."] } }, // what packet-refused must give
  { id: "packet-port-refused", note: "a TCP packet needs both ports", acl: "access-list 101 permit tcp any any", packet: { protocol: "tcp", source: "192.0.2.1", destination: "192.0.2.2", sourcePort: "70000", destinationPort: "" }, // vector packet-port-refused
    expect: { verdict: "none", packetErrors: ["The packet's source port is a number from 0 to 65535.", "The packet's destination port is a number from 0 to 65535."] } }, // what packet-port-refused must give
  { id: "packet-ospf-keyword", note: "ospf is protocol 89 (RFC 2328) on both sides", acl: "access-list 102 permit ospf any any", packet: other("89", "192.0.2.1", "224.0.0.5"), expect: { verdict: "permit@10" } }, // vector packet-ospf-keyword
]); // ACL_VECTORS

/** The API vectors: run() with text or JSON, and its refusals. */
export const API_VECTORS: readonly { id: string; input: string; expect: { verdict?: string; selected?: string | null; throws?: string } }[] = Object.freeze([ // packet-ospf-keyword
  { id: "api-text-only", input: LAB_ACL, expect: { verdict: "none", selected: "MGMT-PROTECT" } }, // text: read and lint, no walk
  { id: "api-json-walk", input: JSON.stringify({ acl: LAB_ACL, packet: { protocol: "tcp", source: "10.1.20.25", destination: "10.1.99.10", sourcePort: 51514, destinationPort: 22 } }), expect: { verdict: "deny@20", selected: "MGMT-PROTECT" } }, // JSON: numbers accepted for ports
  { id: "api-json-bad", input: "{ not json", expect: { throws: "The request starts with { but is not valid JSON; send the access list as text, or {\"acl\": ..., \"packet\": {...}, \"list\": ...}." } }, // malformed
  { id: "api-json-no-acl", input: "{\"packet\": {}}", expect: { throws: "A JSON request needs an \"acl\" string holding the access list." } }, // missing field
  { id: "api-too-long", input: "!".repeat(65_537), expect: { throws: "The text has 65537 characters; the most this tool reads is 65,536." } }, // over the bound
]); // API_VECTORS

/**
 * A verdict in the vectors' short form.
 * @param r the reading
 * @returns "permit@10", "deny@implicit", "permit@empty" or "none"
 */
function verdictOf(r: AclReading): string {
  if (!r.verdict) return "none"; // no verdict
  if (r.verdict.by === "entry") return `${r.verdict.action}@${r.verdict.seq}`; // an entry
  return `${r.verdict.action}@${r.verdict.by === "implicit-deny" ? "implicit" : "empty"}`; // the end of the list
} // verdictOf

/**
 * Compare two string lists exactly.
 * @param f the failures
 * @param id the vector
 * @param what the field
 * @param got what came out
 * @param want what was expected
 */
function same(f: string[], id: string, what: string, got: readonly string[], want: readonly string[]): void {
  if (got.length !== want.length || got.some((g, i) => g !== want[i])) f.push(`${id}: ${what} ${JSON.stringify(got)} != ${JSON.stringify(want)}`); // differs
} // same

/**
 * Run every vector.
 * @returns the count, the passes and the failures
 */
export function verifyVectors(): { total: number; passed: number; failures: string[] } {
  const failures: string[] = []; // every failure
  let total = 0; // vectors run
  let passed = 0; // vectors passed
  for (const v of ACL_VECTORS) { // each reading vector
    total++; // counted
    const before = failures.length; // to tell whether this one failed
    let r: AclReading; // the reading
    try { r = analyseAcl({ acl: v.acl, packet: v.packet ?? null, list: v.list ?? null }); } catch (e) { failures.push(`${v.id}: threw ${(e as Error).message}`); continue; } // must not throw
    const e = v.expect; // expected
    const sel = r.lists.find((l) => l.name === r.selected) ?? null; // the selected list
    if (e.verdict !== undefined && verdictOf(r) !== e.verdict) failures.push(`${v.id}: verdict ${verdictOf(r)} != ${e.verdict}`); // verdict
    if (e.sentence !== undefined && r.verdict?.sentence !== e.sentence) failures.push(`${v.id}: sentence "${r.verdict?.sentence}" != "${e.sentence}"`); // sentence
    if (e.walk) same(failures, v.id, "walk", r.steps.map((s) => `${s.seq}:${s.matched ? "match" : s.field}`), e.walk); // walk
    if (e.lint) same(failures, v.id, "lint", r.lint.map((l) => `${l.kind} ${l.seq ?? "-"}${l.other !== null ? `<${l.other}` : ""}`), e.lint); // lint
    if (e.lintSentence && r.lint[e.lintSentence[0]]?.sentence !== e.lintSentence[1]) failures.push(`${v.id}: lint[${e.lintSentence[0]}] "${r.lint[e.lintSentence[0]]?.sentence}" != "${e.lintSentence[1]}"`); // one sentence
    if (e.issues) same(failures, v.id, "issues", r.issues.map((i) => `L${i.line}: ${i.reason}`), e.issues); // issues
    if (e.order !== undefined && (sel?.evaluationOrder.join(",") ?? "") !== e.order) failures.push(`${v.id}: order ${sel?.evaluationOrder.join(",")} != ${e.order}`); // order
    if (e.selected !== undefined && r.selected !== e.selected) failures.push(`${v.id}: selected ${r.selected} != ${e.selected}`); // selected
    if (e.addresses) same(failures, v.id, "addresses", (sel?.entries ?? []).flatMap((x) => [x.source && `${x.seq}:source=${x.source.base} ${x.source.wildcard}|${x.source.prefix ?? "-"}`, x.destination && `${x.seq}:destination=${x.destination.base} ${x.destination.wildcard}|${x.destination.prefix ?? "-"}`].filter((y): y is string => !!y)), e.addresses); // addresses
    if (e.notes) for (const n of e.notes) if (!r.notes.includes(n)) failures.push(`${v.id}: missing note "${n}"`); // notes
    if (e.packetErrors) same(failures, v.id, "packetErrors", r.packetErrors, e.packetErrors); // packet errors
    if (e.remarks) same(failures, v.id, "remarks", (sel?.remarks ?? []).map((x) => x.text), e.remarks); // remarks
    if (r.notes[0] !== "This reads Cisco IOS and IOS XE IPv4 access lists only. Other platforms end a list differently: Juniper EX discards what no term matched, and Extreme Switch Engine and Fabric Engine permit it by default.") failures.push(`${v.id}: the scope note is not first`); // always
    if (failures.length === before) passed++; // passed
  } // reading vectors
  for (const v of API_VECTORS) { // each API vector
    total++; // counted
    const before = failures.length; // to tell whether this one failed
    try { // a refusal is caught below
      const r = run(v.input); // the API's reading
      if (v.expect.throws) failures.push(`${v.id}: expected a refusal`); // should have thrown
      if (v.expect.verdict !== undefined && verdictOf(r) !== v.expect.verdict) failures.push(`${v.id}: verdict ${verdictOf(r)} != ${v.expect.verdict}`); // verdict
      if (v.expect.selected !== undefined && r.selected !== v.expect.selected) failures.push(`${v.id}: selected ${r.selected} != ${v.expect.selected}`); // selected
    } catch (e) { // refused
      if (!v.expect.throws) failures.push(`${v.id}: threw ${(e as Error).message}`); // should not have
      else if ((e as Error).message !== v.expect.throws) failures.push(`${v.id}: message "${(e as Error).message}" != "${v.expect.throws}"`); // another message
    } // try
    if (failures.length === before) passed++; // passed
  } // API vectors
  return { total, passed, failures }; // the report
} // verifyVectors
