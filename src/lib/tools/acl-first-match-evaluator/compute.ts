// ============================================================================
// src/lib/tools/acl-first-match-evaluator/compute.ts
// ----------------------------------------------------------------------------
// ACL FIRST-MATCH EVALUATOR: the pure engine (02/11/2026).
//
// THE QUESTION IT ANSWERS. "Which entry of this access list decides my packet,
// and why did the ones above it not?" Paste a Cisco IOS or IOS XE IPv4 access
// list as engineers paste it (numbered `access-list` lines, or an `ip
// access-list standard|extended NAME` block with or without sequence numbers),
// describe one packet, and the engine walks the list the way Cisco documents:
// entry by entry, the first match decides, and a packet nothing matches meets
// the implicit deny. Every earlier entry is shown with the first field that
// ruled it out. A lint reads the whole list: entries that can never match
// because an earlier one covers them (shadowed), entries whose removal changes
// nothing (redundant), wildcards that are legal but not contiguous, and what a
// standard list can and cannot see. Each address is shown as written, as its
// wildcard and, when the wildcard is contiguous, as a prefix (RFC 4632).
//
// THE RULES IT APPLIES, EACH WITH ITS SOURCE (the manifest in index.ts names
// the documents; every Cisco quote is in the build notes, read 02/11/2026):
//   - First match: "The first entry that the packet matches determines whether
//     the software permits or denies the packet. That is, after the first
//     match, no subsequent entries are considered." (Cisco IOS XE 17.x, IP
//     Access List Entry Sequence Numbering.)
//   - The implicit deny: "If no conditions match, the packet is dropped. This
//     is because each access list ends with an unwritten or implicit deny
//     statement." (same guide); "An extended access list is terminated by an
//     implicit deny statement" (Cisco IOS Security Command Reference,
//     access-list (IP extended)).
//   - An empty list: "an interface with an empty access list applied to it
//     permits all traffic" (same IOS XE 17.x guide).
//   - Order by sequence number: "This number dictates the order in which ACEs
//     are evaluated" (ACLs Configuration Guide, Cisco IOS XE 17, Catalyst
//     9000). An entry typed without a number gets "10 greater than the last
//     sequence number in that access list" and goes to the end; the first gets
//     10; the maximum is 2147483647; a number already present is refused
//     ("Duplicate sequence number"); an entry equal to an existing one apart
//     from its number makes no change (IOS XE 17.x guide).
//   - Standard lists: host entries "are hashed instead of linked", and "When a
//     packet is matched against a standard ACL, the source address is hashed
//     and matched against the hash table. If no match is found, it then
//     searches the linked list" (IOS XE 17.x guide). The engine therefore
//     tests a standard list's single-host entries first, in sequence order,
//     then its other entries in sequence order, and says so when that differs
//     from the written order.
//   - Numbers: standard 1 to 99 and 1300 to 1999, extended 100 to 199 and 2000
//     to 2699; a name starts with a letter (Cisco-IOS-XE-types, IOS XE 17.18.1:
//     std-acl-type, ext-acl-type; the Catalyst 9000 guide's table agrees).
//   - Addresses: `any` is 0.0.0.0 255.255.255.255, `host A` is A 0.0.0.0, a
//     standard entry with no mask takes 0.0.0.0; a wildcard bit 1 ignores that
//     bit of the packet's address, and "Wildcard bits set to 1 need not be
//     contiguous" (command reference; Catalyst 9000 guide).
//   - Protocols: a keyword or a number from 0 to 255; `ip` matches every
//     protocol (command reference). Keywords are read only where a source
//     gives their number: icmp 1, igmp 2, tcp 6, udp 17, gre 47, esp 50,
//     eigrp 88, pim 103 (IANA, the same keyword), ospf 89 (RFC 2328).
//   - Ports: after tcp or udp only, as the syntax places them; lt, gt, eq,
//     neq, range (inclusive); "If the operator is positioned after the source
//     and source-wildcard, it must match the source port", after the
//     destination the destination port (command reference); eq and neq take
//     "up to 10 ports" (Cisco-IOS-XE-acl, 17.18.1); a port is 0 to 65535 or a
//     name; "TCP port names can only be used when filtering TCP. UDP port names
//     can only be used when filtering UDP" (command reference); the names and
//     their numbers are the tcp-port-type and udp-port-type enumerations of
//     Cisco-IOS-XE-types 17.18.1.
//   - established: TCP only; "A match occurs if the TCP datagram has the ACK
//     or RST control bits set" (command reference).
//   - fragments: such an entry "is applied only to noninitial fragments" and
//     "cannot be configured for an access-list entry that contains any Layer 4
//     information"; without it, an entry with Layer 4 information applies to
//     non-initial fragments by its Layer 3 part when it permits, and the next
//     entry is processed when it denies (command reference, Usage Guidelines).
//     The test packet is an unfragmented packet; the lint reasons about both
//     kinds of packet, so it never calls an entry shadowed when it still
//     decides non-initial fragments.
//   - Remarks are "not processed by the device for filtering purposes"
//     (Catalyst 9000 guide); a remark holds 1 to 100 characters
//     (Cisco-IOS-XE-acl 17.18.1).
//
// WHAT IT DOES NOT READ, and says so line by line: object groups, ICMP message
// types, DSCP, precedence, ToS, time ranges, IP options, TTL, TCP flags other
// than established, dynamic and reflexive entries, host names, IPv6 and MAC
// lists, `no` commands and resequencing. A line it does not read is listed
// with the reason, never dropped.
//
// PARSING is a whitespace split of each line and a walk over the tokens: no
// regular expression with nested quantifiers (ReDoS-safe), at most
// MAX_INPUT characters and MAX_LINES lines.
//
// PAGE LANGUAGE: every sentence is built with say() (src/lib/tools/
// engine-text.ts): a stable id, the English, and its values. The page calls
// analyseAclLocalisable() and shows each sentence through the pack
// (tools.acl-first-match-evaluator.engine.<id>); analyseAcl() and run() return
// plainText() of the same reading, which is what the API and the golden
// vectors read.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids, and an error that carries one

/** The most characters the engine reads (a long running-config section fits many times over). */
export const MAX_INPUT = 65_536; // characters
/** The most lines the engine reads. */
export const MAX_LINES = 4_000; // lines
/** The highest sequence number Cisco accepts (IOS XE 17.x guide; Cisco-IOS-XE-acl: range 1..2147483647). */
export const MAX_SEQ = 2_147_483_647; // the maximum
/** The most ports an eq or neq test takes (Cisco-IOS-XE-acl 17.18.1: "up to 10 ports"). */
export const MAX_EQ_PORTS = 10; // ports
/** The longest remark Cisco-IOS-XE-acl 17.18.1 allows ("length 1..100"). */
export const MAX_REMARK = 100; // characters

/** Standard or extended. */
export type AclKind = "standard" | "extended"; // the two IPv4 list types v1 reads
/** What an entry does. */
export type AclAction = "permit" | "deny"; // the two actions
/** The fields an entry can test, in the order the walk checks them. */
export type AclField = "protocol" | "source" | "sourcePort" | "destination" | "destinationPort" | "established" | "fragments"; // the fields

/**
 * Protocol keywords the engine reads, with the number a source gives: IANA's Assigned Internet Protocol Numbers (the
 * same keyword) for all but ospf, whose number 89 RFC 2328 states. `ip` means every protocol (null).
 */
export const PROTOCOL_NUMBERS: Readonly<Record<string, number | null>> = Object.freeze({
  ip: null, // every protocol (command reference: "To match any Internet protocol ... use the ip keyword")
  icmp: 1, // IANA 1 ICMP
  igmp: 2, // IANA 2 IGMP
  tcp: 6, // IANA 6 TCP
  udp: 17, // IANA 17 UDP
  gre: 47, // IANA 47 GRE
  esp: 50, // IANA 50 ESP
  eigrp: 88, // IANA 88 EIGRP
  ospf: 89, // RFC 2328: "OSPF is IP protocol number 89"
  pim: 103, // IANA 103 PIM
}); // PROTOCOL_NUMBERS

/** Protocol keywords Cisco accepts (Cisco-IOS-XE-acl 17.18.1) whose number no source read for this tool states. */
export const UNSOURCED_PROTOCOLS: readonly string[] = Object.freeze(["ahp", "ipinip", "nos", "pcp"]); // read as "not understood"

/** TCP port names and numbers: the tcp-port-type enumeration of Cisco-IOS-XE-types, IOS XE 17.18.1. */
export const TCP_PORT_NAMES: Readonly<Record<string, number>> = Object.freeze({
  bgp: 179, chargen: 19, cmd: 514, daytime: 13, discard: 9, domain: 53, echo: 7, exec: 512, finger: 79, // b to f
  ftp: 21, "ftp-data": 20, gopher: 70, hostname: 101, ident: 113, irc: 194, klogin: 543, kshell: 544, // f to k
  login: 513, lpd: 515, msrpc: 135, nntp: 119, "onep-plain": 15001, "onep-tls": 15002, "pim-auto-rp": 496, // l to p
  pop2: 109, pop3: 110, smtp: 25, sunrpc: 111, tacacs: 49, talk: 517, telnet: 23, time: 37, uucp: 540, // p to u
  whois: 43, www: 80, // w
}); // TCP_PORT_NAMES

/** UDP port names and numbers: the udp-port-type enumeration of Cisco-IOS-XE-types, IOS XE 17.18.1. */
export const UDP_PORT_NAMES: Readonly<Record<string, number>> = Object.freeze({
  biff: 512, bootpc: 68, bootps: 67, discard: 9, dnsix: 195, domain: 53, echo: 7, isakmp: 500, // b to i
  "mobile-ip": 434, nameserver: 42, "netbios-dgm": 138, "netbios-ns": 137, "netbios-ss": 139, // m to n
  "non500-isakmp": 4500, ntp: 123, "pim-auto-rp": 496, rip: 520, ripv6: 521, snmp: 161, snmptrap: 162, // n to s
  sunrpc: 111, syslog: 514, tacacs: 49, talk: 517, tftp: 69, time: 37, who: 513, xdmcp: 177, // s to x
}); // UDP_PORT_NAMES

/** Port names the command reference lists for a protocol but the 17.18.1 data model gives no number for. */
const LISTED_WITHOUT_NUMBER: Readonly<Record<"tcp" | "udp", readonly string[]>> = Object.freeze({
  tcp: ["drip", "syslog", "tacacs-ds"], // in the TCP list of access-list (IP extended), not in tcp-port-type
  udp: ["tacacs-ds"], // in the UDP list, not in udp-port-type
}); // LISTED_WITHOUT_NUMBER

/** Options that test something the test packet does not carry, or that v1 does not read. */
const UNREAD_OPTIONS: ReadonlySet<string> = new Set([
  "precedence", "tos", "dscp", "time-range", "option", "ttl", // IP header fields and time ranges
  "ack", "fin", "psh", "rst", "syn", "urg", "match-all", "match-any", // TCP flags other than established
  "reflect", "evaluate", // reflexive lists
]); // UNREAD_OPTIONS

/** An address test of an entry, in every form the page shows. */
export interface AclAddress {
  /** As written: "any", "host 10.1.1.1", "10.1.10.0 0.0.0.255", or a bare address in a standard entry. */
  written: string;
  /** How it was written. */
  form: "any" | "host" | "wildcard" | "bare";
  /** The address as written (0.0.0.0 for any). */
  address: string;
  /** The wildcard: any is 255.255.255.255, host and a bare standard address are 0.0.0.0. */
  wildcard: string;
  /** The address with the ignored bits cleared: the same set of addresses, written canonically. */
  base: string;
  /** Whether the wildcard is contiguous (ones only at the right), so that a prefix length can express it. */
  contiguous: boolean;
  /** The prefix (RFC 4632 notation) when contiguous, else null. */
  prefix: string | null;
  /** How many addresses it matches (2 to the number of wildcard ones). */
  addresses: number;
  /** Whether the address as written has bits set where the wildcard ignores them. */
  ignoredBitsSet: boolean;
  /** The address as a 32-bit unsigned number. */
  value: number;
  /** The wildcard as a 32-bit unsigned number. */
  mask: number;
}

/** A port test of an entry. */
export interface AclPortTest {
  /** As written: "eq 22", "range 1024 65535", "eq www". */
  written: string;
  /** The operator. */
  op: "eq" | "neq" | "lt" | "gt" | "range";
  /** The port numbers written, in order (names resolved). */
  ports: number[];
  /** The ports it admits, as inclusive ranges, ascending and disjoint (empty: none). */
  ranges: [number, number][];
}

/** One entry, as read. */
export interface AclEntry {
  /** The list it belongs to. */
  list: string;
  /** Its sequence number (given, or assigned as Cisco assigns it). */
  seq: number;
  /** Whether the sequence number was written. */
  seqGiven: boolean;
  /** The 1-based line it was read from. */
  line: number;
  /** The entry as written, with single spaces, without the list number or the sequence number. */
  text: string;
  /** permit or deny. */
  action: AclAction;
  /** The protocol as written (extended) or "ip" (standard), and its number (null: every protocol). */
  protocol: { written: string; number: number | null };
  /** The source address test. */
  source: AclAddress;
  /** The source port test (TCP and UDP only), or null. */
  sourcePort: AclPortTest | null;
  /** The destination address test (extended only), or null. */
  destination: AclAddress | null;
  /** The destination port test, or null. */
  destinationPort: AclPortTest | null;
  /** established (TCP only). */
  established: boolean;
  /** fragments: the entry applies to non-initial fragments only. */
  fragments: boolean;
  /** log or log-input, or null. */
  log: "log" | "log-input" | null;
  /** A standard entry naming one host: hashed and looked up first (IOS XE 17.x guide). */
  hashed: boolean;
}

/** A remark, as read. */
export interface AclRemark {
  /** The list it belongs to. */
  list: string;
  /** The 1-based line. */
  line: number;
  /** Its text. */
  text: string;
}

/** One list, as read. */
export interface AclList {
  /** Its name or number. */
  name: string;
  /** Standard or extended. */
  kind: AclKind;
  /** The line that first named it. */
  line: number;
  /** Its entries in sequence-number order. */
  entries: AclEntry[];
  /** The sequence numbers in the order the device tests them (standard lists: hosts first). */
  evaluationOrder: number[];
  /** Its remarks, in input order. */
  remarks: AclRemark[];
}

/** A line the engine does not read, and why. S is string for the API and EngineText for the page. */
export interface AclLineIssue<S = string> {
  /** The 1-based line. */
  line: number;
  /** The line as pasted (trimmed). */
  text: string;
  /** Whether it is an entry the device may hold although the tool could not read it (false for lines Cisco refuses). */
  entryLike: boolean;
  /** Why. */
  reason: S;
}

/** The test packet, as read. */
export interface AclPacket {
  /** The protocol number. */
  protocol: number;
  /** The protocol as typed, lower case. */
  protocolWritten: string;
  /** The source address. */
  source: string;
  /** The destination address. */
  destination: string;
  /** The source port (TCP and UDP), or null. */
  sourcePort: number | null;
  /** The destination port (TCP and UDP), or null. */
  destinationPort: number | null;
  /** ACK or RST set (TCP), or null. */
  ackOrRst: boolean | null;
}

/** The packet as typed on the page or sent to the API. */
export interface AclPacketInput {
  /** tcp, udp, icmp, another keyword the engine reads, or a number from 0 to 255. */
  protocol: string;
  /** The source address. */
  source: string;
  /** The destination address. */
  destination: string;
  /** The source port (TCP and UDP). */
  sourcePort?: string;
  /** The destination port (TCP and UDP). */
  destinationPort?: string;
  /** ACK or RST set (TCP). */
  ackOrRst?: boolean;
}

/** One entry of the walk. */
export interface AclStep<S = string> {
  /** The entry's sequence number. */
  seq: number;
  /** Its line. */
  line: number;
  /** The entry as read. */
  text: string;
  /** Its action. */
  action: AclAction;
  /** Whether it matched. */
  matched: boolean;
  /** The first field that ruled it out (null when it matched). */
  field: AclField | null;
  /** Why, in a sentence. */
  reason: S;
}

/** The answer for the packet. */
export interface AclVerdict<S = string> {
  /** What happens to the packet. */
  action: AclAction;
  /** What decided: an entry, the implicit deny, or an empty list. */
  by: "entry" | "implicit-deny" | "empty-list";
  /** The deciding entry's sequence number (by entry). */
  seq: number | null;
  /** Its line. */
  line: number | null;
  /** Its text. */
  text: string | null;
  /** The verdict in a sentence. */
  sentence: S;
}

/** One lint finding. */
export interface AclLint<S = string> {
  /** What kind. */
  kind: "shadowed" | "redundant" | "redundant-later" | "redundant-implicit" | "never-matches" | "non-contiguous" | "ignored-bits" | "hash-order" | "standard-reach" | "long-remark";
  /** The entry it is about (null for the list as a whole). */
  seq: number | null;
  /** Its line (or the remark's). */
  line: number | null;
  /** The other entry involved (the covering one, or the one tested after), or null. */
  other: number | null;
  /** The finding in a sentence. */
  sentence: S;
}

/** The whole reading. */
export interface AclReading<S = string> {
  /** Every list in the text, in the order first named. */
  lists: AclList[];
  /** The list evaluated and linted (null when there is none). */
  selected: string | null;
  /** Lines not read, with the reason. */
  issues: AclLineIssue<S>[];
  /** The packet as read (null when none was given or it was refused). */
  packet: AclPacket | null;
  /** Why the packet was refused. */
  packetErrors: S[];
  /** The walk, in evaluation order, up to the deciding entry. */
  steps: AclStep<S>[];
  /** The verdict (null without a packet or a list). */
  verdict: AclVerdict<S> | null;
  /** The lint of the selected list. */
  lint: AclLint<S>[];
  /** Notes on the reading. */
  notes: S[];
  /** Counts. */
  counts: { lines: number; entries: number; remarks: number; issues: number };
}

/** A request: the list text, an optional packet, and an optional list name. */
export interface AclRequest {
  /** The pasted configuration. */
  acl: string;
  /** The test packet. */
  packet?: AclPacketInput | null;
  /** The list to evaluate (default: the first in the text). */
  list?: string | null;
}

// ---------------------------------------------------------------------------
// Small helpers: addresses, numbers, ports.
// ---------------------------------------------------------------------------

/**
 * A dotted-decimal IPv4 address as a 32-bit unsigned number, or null.
 * @param s the text
 * @returns the number, or null when it is not four decimal octets of 0 to 255 (a leading zero is refused as ambiguous)
 */
export function parseIpv4(s: string): number | null {
  const parts = s.split("."); // four octets
  if (parts.length !== 4) return null; // not four
  let v = 0; // the accumulated value
  for (const p of parts) { // each octet
    if (p.length === 0 || p.length > 3) return null; // empty or too long
    for (let i = 0; i < p.length; i++) { const c = p.charCodeAt(i); if (c < 48 || c > 57) return null; } // digits only
    if (p.length > 1 && p[0] === "0") return null; // a leading zero: ambiguous (octal in some readers), refused
    const n = Number(p); // the octet
    if (n > 255) return null; // out of range
    v = v * 256 + n; // shifted in (multiplication keeps it unsigned)
  } // octets
  return v; // 0 to 2^32 - 1
} // parseIpv4

/**
 * A 32-bit unsigned number as dotted decimal.
 * @param v the number
 * @returns the address
 */
export function formatIpv4(v: number): string {
  const u = v >>> 0; // unsigned
  return `${(u >>> 24) & 255}.${(u >>> 16) & 255}.${(u >>> 8) & 255}.${u & 255}`; // four octets
} // formatIpv4

/**
 * How many bits are set in a 32-bit number.
 * @param v the number
 * @returns the count
 */
function popcount(v: number): number {
  let u = v >>> 0; // unsigned
  let n = 0; // the count
  while (u !== 0) { n += u & 1; u >>>= 1; } // bit by bit (at most 32 rounds)
  return n; // counted
} // popcount

/**
 * An address test from its parts.
 * @param written the text as written
 * @param form how it was written
 * @param value the address
 * @param mask the wildcard
 * @returns the test, with its canonical forms
 */
function makeAddress(written: string, form: AclAddress["form"], value: number, mask: number): AclAddress {
  const m = mask >>> 0; // unsigned wildcard
  const base = (value & ~m) >>> 0; // the ignored bits cleared
  const contiguous = ((m & (m + 1)) >>> 0) === 0 || m === 0xffffffff; // ones only at the right (all ones: /0)
  const ones = popcount(m); // ignored bits
  return { // the test, in every form the page shows
    written, // as written
    form, // how
    address: formatIpv4(value), // as written, canonical
    wildcard: formatIpv4(m), // the wildcard
    base: formatIpv4(base), // the canonical address
    contiguous, // whether a prefix can express it
    prefix: contiguous ? `${formatIpv4(base)}/${32 - ones}` : null, // RFC 4632 notation
    addresses: 2 ** ones, // the count of addresses
    ignoredBitsSet: ((value >>> 0) & m) !== 0, // bits set where ignored
    value: value >>> 0, // the number
    mask: m, // the wildcard number
  }; // built
} // makeAddress

/**
 * Whether an address test admits an address.
 * @param a the test
 * @param ip the address
 * @returns true when every bit the wildcard does not ignore agrees
 */
function addressAdmits(a: AclAddress, ip: number): boolean {
  return (((ip ^ a.value) & ~a.mask) >>> 0) === 0; // the bits that must match, match
} // addressAdmits

/**
 * Whether every address of b is in a (both wildcard tests; non-contiguous included).
 * @param a the wider test
 * @param b the narrower test
 * @returns true when b's addresses are a subset of a's
 */
function addressCovers(a: AclAddress, b: AclAddress): boolean {
  if (((b.mask & ~a.mask) >>> 0) !== 0) return false; // b lets a bit vary that a fixes: some address of b is outside a
  return (((a.value ^ b.value) & ~a.mask) >>> 0) === 0; // and b's fixed bits agree with a's fixed bits
} // addressCovers

/**
 * Whether two address tests share at least one address.
 * @param a one test
 * @param b the other
 * @returns true when some address passes both
 */
function addressIntersects(a: AclAddress, b: AclAddress): boolean {
  return (((a.value ^ b.value) & ~a.mask & ~b.mask) >>> 0) === 0; // the bits both fix agree
} // addressIntersects

/** Every port, as one range. */
const ALL_PORTS: [number, number][] = [[0, 65535]]; // 0 to 65535

/**
 * Normalise ranges: sorted, merged, empty ones dropped.
 * @param rs the ranges
 * @returns the canonical list
 */
function normaliseRanges(rs: [number, number][]): [number, number][] {
  const sorted = rs.filter(([a, b]) => a <= b).sort((x, y) => x[0] - y[0]); // valid ones, by start
  const out: [number, number][] = []; // the result
  for (const [a, b] of sorted) { // each
    const last = out[out.length - 1]; // the previous
    if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b); // touching or overlapping: merged
    else out.push([a, b]); // a new range
  } // each
  return out; // canonical
} // normaliseRanges

/**
 * The ports a test admits.
 * @param op the operator
 * @param ports the ports written
 * @returns the ranges
 */
function portRanges(op: AclPortTest["op"], ports: number[]): [number, number][] {
  if (op === "eq") return normaliseRanges(ports.map((p) => [p, p] as [number, number])); // the ports listed
  if (op === "lt") return normaliseRanges([[0, ports[0] - 1]]); // below (lt 0: none)
  if (op === "gt") return normaliseRanges([[ports[0] + 1, 65535]]); // above (gt 65535: none)
  if (op === "range") return normaliseRanges([[ports[0], ports[1]]]); // inclusive
  const out: [number, number][] = []; // neq: everything but the listed ports
  let from = 0; // the next port not excluded yet
  for (const p of [...new Set(ports)].sort((a, b) => a - b)) { if (p > from) out.push([from, p - 1]); from = p + 1; } // the gaps
  if (from <= 65535) out.push([from, 65535]); // the tail
  return normaliseRanges(out); // canonical
} // portRanges

/**
 * Whether ranges admit a port.
 * @param rs the ranges
 * @param p the port
 * @returns true when inside one of them
 */
function rangesAdmit(rs: readonly [number, number][], p: number): boolean {
  return rs.some(([a, b]) => p >= a && p <= b); // inside one
} // rangesAdmit

/**
 * Whether ranges a contain every port of ranges b.
 * @param a the wider
 * @param b the narrower
 * @returns true when b is a subset of a
 */
function rangesCover(a: readonly [number, number][], b: readonly [number, number][]): boolean {
  return b.every(([lo, hi]) => a.some(([x, y]) => x <= lo && hi <= y)); // each range of b sits inside one of a (a is merged)
} // rangesCover

/**
 * Whether two range lists share a port.
 * @param a one
 * @param b the other
 * @returns true when they overlap
 */
function rangesIntersect(a: readonly [number, number][], b: readonly [number, number][]): boolean {
  return a.some(([x, y]) => b.some(([lo, hi]) => x <= hi && lo <= y)); // any overlap
} // rangesIntersect

// ---------------------------------------------------------------------------
// Reading the lines.
// ---------------------------------------------------------------------------

/** The token stream of one entry, with a cursor. */
interface Tokens {
  /** The tokens as written. */
  raw: string[];
  /** The tokens, lower case (keywords are matched this way). */
  low: string[];
  /** The cursor. */
  i: number;
  /** Where the entry's own words start (after the list number or the sequence number). */
  start: number;
}

/** A failed read of one entry: the sentence the issue carries. */
class EntryError extends Error {
  /**
   * @param sentence the reason, as a sentence with an id
   */
  constructor(readonly sentence: EngineText) {
    super(sentence.text); // the English as the message
  } // constructor
} // EntryError

/**
 * Refuse the entry being read.
 * @param m the reason
 * @returns never: it throws
 */
function refuse(m: EngineText): never {
  throw new EntryError(m); // caught by the line reader
} // refuse

/**
 * The kind a list number belongs to (Cisco-IOS-XE-types 17.18.1; Catalyst 9000 guide, Access List Numbers).
 * @param n the number
 * @returns standard, extended, or null outside both
 */
export function kindOfNumber(n: number): AclKind | null {
  if ((n >= 1 && n <= 99) || (n >= 1300 && n <= 1999)) return "standard"; // 1 to 99, 1300 to 1999
  if ((n >= 100 && n <= 199) || (n >= 2000 && n <= 2699)) return "extended"; // 100 to 199, 2000 to 2699
  return null; // another kind of list, or none
} // kindOfNumber

/**
 * Whether a text is all decimal digits.
 * @param s the text
 * @returns true for one or more digits only
 */
function isDigits(s: string): boolean {
  if (s.length === 0) return false; // empty
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (c < 48 || c > 57) return false; } // a non-digit
  return true; // digits only
} // isDigits

/**
 * Read an address test at the cursor.
 * @param t the tokens
 * @param kind standard (a bare address may stand alone) or extended (it needs its wildcard)
 * @param which "source" or "destination", for the reasons
 * @returns the test
 */
function readAddress(t: Tokens, kind: AclKind, which: "source" | "destination"): AclAddress {
  const w = t.low[t.i]; // the first token
  const fieldName = which === "source" ? say("word.source", "source") : say("word.destination", "destination"); // for the reasons
  if (w === undefined) refuse(say("issue.missing", `The entry ends before its ${fieldName}.`, { what: fieldName })); // nothing left
  if (w === "any") { t.i++; return makeAddress("any", "any", 0, 0xffffffff); } // 0.0.0.0 255.255.255.255
  if (w === "host") { // host A: A 0.0.0.0
    const a = t.raw[t.i + 1]; // the address
    if (a === undefined) refuse(say("issue.missing", `The entry ends before its ${fieldName}.`, { what: fieldName })); // missing
    const v = parseIpv4(a); // read
    if (v === null) refuse(say("issue.address", `${a} is not an IPv4 address in dotted-decimal form; host names are not read.`, { token: a })); // not an address
    t.i += 2; // consumed
    return makeAddress(`host ${a}`, "host", v, 0); // one host
  } // host
  if (w === "object-group" || w === "addrgroup") refuse(say("issue.objectGroup", "Object groups are outside v1: the tool cannot see their members.")); // not read
  const v = parseIpv4(t.raw[t.i]); // an address
  if (v === null) refuse(say("issue.address", `${t.raw[t.i]} is not an IPv4 address in dotted-decimal form; host names are not read.`, { token: t.raw[t.i] })); // not one
  const next = t.raw[t.i + 1]; // a wildcard, perhaps
  const m = next === undefined ? null : parseIpv4(next); // read
  if (m !== null) { t.i += 2; return makeAddress(`${t.raw[t.i - 2]} ${next}`, "wildcard", v, m); } // address and wildcard
  if (kind === "extended") refuse(say("issue.wildcardRequired", `An extended entry needs a wildcard after ${t.raw[t.i]} (or host before it, or any instead).`, { address: t.raw[t.i] })); // the wildcard is mandatory
  t.i += 1; // a standard entry without a mask
  return makeAddress(t.raw[t.i - 1], "bare", v, 0); // "0.0.0.0 is assumed to be the mask"
} // readAddress

/**
 * Read one port number or name.
 * @param token the token as written
 * @param proto tcp or udp
 * @returns the number
 */
function readPort(token: string, proto: "tcp" | "udp"): number {
  const low = token.toLowerCase(); // names are matched in lower case
  if (isDigits(low)) { // a number
    const n = Number(low); // its value
    if (low.length > 5 || n > 65535) refuse(say("issue.portNumber", `Port ${token} is out of range: a port is a number from 0 to 65535.`, { token })); // out of range
    return n; // the port
  } // number
  const own = proto === "tcp" ? TCP_PORT_NAMES : UDP_PORT_NAMES; // this protocol's names
  if (Object.prototype.hasOwnProperty.call(own, low)) return own[low]; // a name with its number
  const protoWord = proto.toUpperCase(); // TCP or UDP
  if (LISTED_WITHOUT_NUMBER[proto].includes(low)) refuse(say("issue.portNoNumber", `${token} is listed by Cisco as a ${protoWord} port name, but no source read for this tool gives its number; write the number.`, { token, proto: protoWord })); // listed, unnumbered
  const other = proto === "tcp" ? UDP_PORT_NAMES : TCP_PORT_NAMES; // the other protocol's names
  if (Object.prototype.hasOwnProperty.call(other, low)) refuse(say("issue.portWrongProto", `${token} is a ${proto === "tcp" ? "UDP" : "TCP"} port name: Cisco reads TCP port names only with tcp and UDP port names only with udp.`, { token, other: proto === "tcp" ? "UDP" : "TCP" })); // the other protocol's
  return refuse(say("issue.portName", `${token} is not a ${protoWord} port name in Cisco's IOS XE 17.18.1 data model; write the port number.`, { token, proto: protoWord })); // unknown
} // readPort

/** Words that end a port list (they start the next part of the entry). */
const AFTER_PORTS: ReadonlySet<string> = new Set(["any", "host", "established", "log", "log-input", "fragments", "object-group", "addrgroup", "portgroup"]); // never a port

/**
 * Read an optional port test at the cursor.
 * @param t the tokens
 * @param proto tcp or udp
 * @returns the test, or null when the next token is not an operator
 */
function readPortTest(t: Tokens, proto: "tcp" | "udp"): AclPortTest | null {
  const op = t.low[t.i]; // the operator, perhaps
  if (op === "portgroup") refuse(say("issue.objectGroup", "Object groups are outside v1: the tool cannot see their members.")); // not read
  if (op !== "eq" && op !== "neq" && op !== "lt" && op !== "gt" && op !== "range") return null; // no port test here
  const start = t.i; // for the written form
  t.i++; // past the operator
  const ports: number[] = []; // the ports
  const want = op === "range" ? 2 : 1; // the ports the operator needs at least
  const most = op === "eq" || op === "neq" ? MAX_EQ_PORTS : want; // and at most
  while (ports.length < most && t.raw[t.i] !== undefined && !AFTER_PORTS.has(t.low[t.i]) && parseIpv4(t.raw[t.i]) === null) { // the next token is a port
    if (ports.length >= want && !isDigits(t.low[t.i]) && !Object.prototype.hasOwnProperty.call(proto === "tcp" ? TCP_PORT_NAMES : UDP_PORT_NAMES, t.low[t.i])) break; // an optional extra port must be a port
    ports.push(readPort(t.raw[t.i], proto)); // read
    t.i++; // next
  } // ports
  if (ports.length < want) refuse(say("issue.portMissing", `${op} needs ${want === 2 ? "two port numbers" : "a port number"}.`, { op, count: String(want) })); // too few
  if (op === "range" && ports[0] > ports[1]) refuse(say("issue.rangeOrder", `range ${ports[0]} ${ports[1]}: the first port is greater than the second, and the sources read do not say what the device does with that.`, { from: String(ports[0]), to: String(ports[1]) })); // reversed
  const written = t.raw.slice(start, t.i).join(" ").toLowerCase(); // as written, keywords and names lower case
  return { written, op, ports, ranges: portRanges(op, ports) }; // the test
} // readPortTest

/**
 * Read the body of an entry (after the action) for a list of a kind.
 * @param t the tokens, the cursor after permit or deny
 * @param kind standard or extended
 * @returns the fields of the entry
 */
function readBody(t: Tokens, kind: AclKind): Omit<AclEntry, "list" | "seq" | "seqGiven" | "line" | "text" | "action" | "hashed"> {
  if (kind === "standard") { // source only
    const w = t.low[t.i]; // the next token
    if (w !== undefined && (Object.prototype.hasOwnProperty.call(PROTOCOL_NUMBERS, w) || UNSOURCED_PROTOCOLS.includes(w))) refuse(say("issue.standardExtra", `A standard entry tests the source address only; ${t.raw[t.i]} belongs in an extended list.`, { token: t.raw[t.i] })); // an extended entry in a standard list
    const source = readAddress(t, "standard", "source"); // the source
    const log = readLog(t); // log [word]
    if (t.raw[t.i] !== undefined) refuse(say("issue.standardExtra", `A standard entry tests the source address only; ${t.raw[t.i]} belongs in an extended list.`, { token: t.raw[t.i] })); // anything else
    return { protocol: { written: "ip", number: null }, source, sourcePort: null, destination: null, destinationPort: null, established: false, fragments: false, log }; // read
  } // standard
  const pw = t.low[t.i]; // the protocol
  if (pw === undefined) refuse(say("issue.missing", "The entry ends before its protocol.", { what: say("word.protocol", "protocol") })); // missing
  if (pw === "object-group") refuse(say("issue.objectGroup", "Object groups are outside v1: the tool cannot see their members.")); // a service group
  let number: number | null; // the protocol number
  if (Object.prototype.hasOwnProperty.call(PROTOCOL_NUMBERS, pw)) number = PROTOCOL_NUMBERS[pw]; // a keyword with a sourced number
  else if (UNSOURCED_PROTOCOLS.includes(pw)) return refuse(say("issue.protocolName", `Protocol ${pw}: Cisco accepts this keyword, but no source read for this tool gives its protocol number; write the number instead.`, { name: pw })); // unsourced
  else if (isDigits(pw)) { // a number
    if (pw.length > 3 || Number(pw) > 255) refuse(say("issue.protocolNumber", `Protocol ${t.raw[t.i]} is out of range: a protocol number runs from 0 to 255.`, { token: t.raw[t.i] })); // out of range
    number = Number(pw); // the number
  } else return refuse(say("issue.protocolUnknown", `${t.raw[t.i]} is not a protocol keyword this tool reads (ip, tcp, udp, icmp, igmp, gre, esp, eigrp, ospf, pim) or a number from 0 to 255.`, { token: t.raw[t.i] })); // unknown
  t.i++; // past the protocol
  const l4 = pw === "tcp" || pw === "udp" ? pw : null; // ports follow tcp or udp only, as the syntax places them
  const source = readAddress(t, "extended", "source"); // the source
  const sourcePort = l4 ? readPortTest(t, l4) : null; // its port test
  if (!l4 && ["eq", "neq", "lt", "gt", "range"].includes(t.low[t.i] ?? "")) refuse(say("issue.portNotAllowed", `Ports follow tcp or udp only; this entry's protocol is ${pw}.`, { proto: pw })); // ports after another protocol
  const destination = readAddress(t, "extended", "destination"); // the destination
  const destinationPort = l4 ? readPortTest(t, l4) : null; // its port test
  let established = false; // established
  let fragments = false; // fragments
  let log: AclEntry["log"] = null; // log
  while (t.raw[t.i] !== undefined) { // the options
    const w = t.low[t.i]; // the option
    if (w === "established") { // TCP only
      if (pw !== "tcp") refuse(say("issue.establishedNotTcp", "established is valid for TCP only (Cisco: the flag and established keywords are not valid for UDP).")); // not TCP
      established = true; t.i++; continue; // read
    } // established
    if (w === "fragments") { fragments = true; t.i++; continue; } // non-initial fragments only
    if (w === "log" || w === "log-input") { log = readLog(t); continue; } // log [word]
    if (["eq", "neq", "lt", "gt", "range"].includes(w)) refuse(say(l4 ? "issue.portPlace" : "issue.portNotAllowed", l4 ? `${t.raw[t.i]} is out of place: a port test comes right after the source or the destination it tests.` : `Ports follow tcp or udp only; this entry's protocol is ${pw}.`, l4 ? { token: t.raw[t.i] } : { proto: pw })); // misplaced
    if (UNREAD_OPTIONS.has(w)) refuse(say("issue.unreadOption", `${t.raw[t.i]} tests something the test packet does not carry (precedence, ToS, DSCP, time ranges, IP options, TTL, TCP flags other than established); v1 does not read it.`, { token: t.raw[t.i] })); // not read
    if (pw === "icmp" || pw === "igmp") refuse(say("issue.icmpType", `${t.raw[t.i]}: ICMP and IGMP message types are outside v1.`, { token: t.raw[t.i] })); // message types
    refuse(say("issue.trailing", `Unexpected ${t.raw[t.i]} after the entry.`, { token: t.raw[t.i] })); // anything else
  } // options
  if (fragments && (sourcePort || destinationPort || established)) refuse(say("issue.fragmentsL4", "fragments cannot be combined with ports or established: Cisco refuses it on an entry with Layer 4 information.")); // refused by Cisco
  return { protocol: { written: pw, number }, source, sourcePort, destination, destinationPort, established, fragments, log }; // read
} // readBody

/**
 * Read an optional log or log-input keyword and its optional word (it must end the entry).
 * @param t the tokens
 * @returns the keyword, or null
 */
function readLog(t: Tokens): AclEntry["log"] {
  const w = t.low[t.i]; // the keyword, perhaps
  if (w !== "log" && w !== "log-input") return null; // none
  t.i++; // past it
  if (t.raw[t.i] !== undefined && t.raw[t.i + 1] === undefined && !["established", "fragments", "log", "log-input"].includes(t.low[t.i])) t.i++; // its word ("log [word]"), when it is the last token
  return w; // read
} // readLog

/** A list being built. */
interface Building {
  /** The list. */
  list: AclList;
  /** The highest sequence number so far (0: none). */
  last: number;
  /** Canonical entry texts, to find an entry equal to an existing one. */
  seen: Map<string, number>;
} // Building

/**
 * The comparison key of an entry: equal keys mean "the same entry apart from its sequence number".
 * @param e the entry
 * @returns the key
 */
function entryKey(e: Omit<AclEntry, "list" | "seq" | "seqGiven" | "line" | "text" | "hashed">): string {
  const a = (x: AclAddress | null) => (x ? `${x.base}/${x.wildcard}` : "-"); // an address, canonical
  const p = (x: AclPortTest | null) => (x ? `${x.op}:${x.ports.join(",")}` : "-"); // a port test
  return [e.action, e.protocol.number ?? "ip", a(e.source), p(e.sourcePort), a(e.destination), p(e.destinationPort), e.established, e.fragments, e.log ?? "-"].join("|"); // every field
} // entryKey

/**
 * Read the pasted text into lists, remarks and issues.
 * @param text the text
 * @returns lists in the order first named, and the issues
 */
function readLists(text: string): { lists: AclList[]; issues: AclLineIssue<EngineText>[]; remarks: number; lines: number } {
  const lines = text.split(/\r\n|\r|\n/); // every line end
  const byName = new Map<string, Building>(); // the lists
  const order: string[] = []; // first-named order
  const issues: AclLineIssue<EngineText>[] = []; // lines not read
  let remarks = 0; // remarks read
  let context: Building | null = null; // the open ip access-list block
  /** The list of a name and kind, opened if new; null with an issue when the kind conflicts. */
  const open = (name: string, kind: AclKind, line: number, text0: string): Building | null => {
    const b = byName.get(name); // existing
    if (b) { // already named
      if (b.list.kind === kind) return b; // the same list again
      issues.push({ line, text: text0, entryLike: false, reason: say("issue.kindConflict", `List ${name} is already a ${b.list.kind} list.`, { name, kind: b.list.kind === "standard" ? say("word.standard", "standard") : say("word.extended", "extended") }) }); // conflicting
      return null; // not opened
    } // existing
    const nb: Building = { list: { name, kind, line, entries: [], evaluationOrder: [], remarks: [] }, last: 0, seen: new Map() }; // new
    byName.set(name, nb); // stored
    order.push(name); // in order
    return nb; // opened
  }; // open
  /** Add an entry to a list from its tokens (after any sequence number); the list is opened only once the entry reads. */
  const addEntry = (target: () => Building | null, kind: AclKind, t: Tokens, seq: number | null, line: number, text0: string) => {
    const action = t.low[t.i]; // permit or deny
    t.i++; // past it
    const body = readBody(t, kind); // the fields (throws EntryError, and then no list is opened for the line)
    const b = target(); // the list
    if (!b) return; // a kind conflict, already reported
    const key = entryKey({ action: action as AclAction, ...body }); // its identity
    const same = b.seen.get(key); // an equal entry
    if (same !== undefined) { issues.push({ line, text: text0, entryLike: false, reason: say("issue.duplicateEntry", `The same entry as ${same}, apart from its sequence number: Cisco makes no change.`, { seq: String(same) }) }); return; } // no change
    let s: number; // its sequence number
    if (seq === null) { // assigned
      s = b.last + 10; // "10 greater than the last sequence number" (10 for the first)
      if (s > MAX_SEQ) { issues.push({ line, text: text0, entryLike: false, reason: say("issue.seqExceeded", "The next sequence number would pass 2147483647: Cisco refuses the entry with Exceeded maximum sequence number.") }); return; } // over
    } else { // written
      if (b.list.entries.some((e) => e.seq === seq)) { issues.push({ line, text: text0, entryLike: false, reason: say("issue.seqDuplicate", `Sequence number ${seq} is already used in list ${b.list.name}: Cisco refuses the entry with Duplicate sequence number.`, { seq: String(seq), list: b.list.name }) }); return; } // taken
      s = seq; // as written
    } // seq
    const entryText = t.raw.slice(t.start).join(" "); // the entry as written
    const hashed = b.list.kind === "standard" && body.source.form !== "any" && body.source.mask === 0; // one host in a standard list
    b.list.entries.push({ list: b.list.name, seq: s, seqGiven: seq !== null, line, text: entryText, action: action as AclAction, ...body, hashed }); // added
    b.seen.set(key, s); // known
    b.last = Math.max(b.last, s); // the highest so far
  }; // addEntry
  for (let n = 0; n < lines.length; n++) { // each line
    const lineNo = n + 1; // 1-based
    const text0 = lines[n].trim(); // trimmed
    if (text0 === "") continue; // a blank line separates nothing
    if (text0.startsWith("!")) continue; // a configuration comment line
    const raw = text0.split(/\s+/); // the tokens (one class, no nesting: linear)
    const low = raw.map((w) => w.toLowerCase()); // keywords are matched in lower case
    const w0 = low[0]; // the first word
    try { // an entry that cannot be read throws EntryError, caught below
      if (w0 === "exit" || w0 === "end") { context = null; continue; } // the block ends
      if (w0 === "access-list") { // a numbered line (a global command: any open block ends)
        context = null; // closed
        const num = raw[1]; // the number
        if (num === undefined || !isDigits(num)) { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.numberMissing", "access-list needs a list number.") }); continue; } // no number
        const kind = kindOfNumber(Number(num)); // its kind
        if (!kind || num.length > 4) { issues.push({ line: lineNo, text: text0, entryLike: low[2] === "permit" || low[2] === "deny", reason: say("issue.numberRange", `List number ${num} is not an IPv4 standard (1 to 99, 1300 to 1999) or extended (100 to 199, 2000 to 2699) list.`, { number: num }) }); continue; } // another kind
        const name = String(Number(num)); // the list's name
        const w2 = low[2]; // the next word
        if (w2 === "remark") { const b = open(name, kind, lineNo, text0); if (b) { addRemark(b, text0, lineNo); remarks++; } continue; } // a remark
        if (w2 !== undefined && isDigits(w2)) { issues.push({ line: lineNo, text: text0, entryLike: true, reason: say("issue.seqOnNumbered", `Numbered access-list lines take no sequence number; give one inside ip access-list ${kind} ${name}.`, { kind, name }) }); continue; } // no seq here
        if (w2 === "dynamic") { issues.push({ line: lineNo, text: text0, entryLike: true, reason: say("issue.dynamic", "Dynamic, reflexive and evaluate entries are outside v1.") }); continue; } // dynamic
        if (w2 !== "permit" && w2 !== "deny") { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.action", "An entry starts with permit or deny, or is a remark.") }); continue; } // no action
        addEntry(() => open(name, kind, lineNo, text0), kind, { raw, low, i: 2, start: 2 }, null, lineNo, text0); // the entry, then its list
        continue; // next line
      } // access-list
      if (w0 === "ip" && low[1] === "access-list") { // a named list header (or another ip access-list command)
        context = null; // any open block ends
        const k = low[2]; // standard, extended or another word
        if (k !== "standard" && k !== "extended") { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.ipAccessListOther", `ip access-list ${raw[2] ?? ""} is not a list definition this tool reads; v1 reads standard and extended IPv4 lists.`, { word: raw[2] ?? "" }) }); continue; } // resequence, role-based, logging ...
        const name = raw[3]; // the name or number
        if (name === undefined) { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.nameForm", "A list name starts with a letter, or is a number in the range of its list type.") }); continue; } // missing
        if (isDigits(name)) { if (kindOfNumber(Number(name)) !== k || name.length > 4) { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.nameForm", "A list name starts with a letter, or is a number in the range of its list type.") }); continue; } } // a number of the wrong range
        else if (!/^[A-Za-z]/.test(name)) { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.nameForm", "A list name starts with a letter, or is a number in the range of its list type.") }); continue; } // not a letter first
        if (raw.length > 4) { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.trailing", `Unexpected ${raw[4]} after the entry.`, { token: raw[4] }) }); continue; } // more words
        const listName = isDigits(name) ? String(Number(name)) : name; // a number names the same list as access-list N
        context = open(listName, k, lineNo, text0); // opened (null on a conflict, already reported)
        continue; // next line
      } // ip access-list
      if (w0 === "standard" || w0 === "extended") { // show access-lists output: "Standard IP access list 10"
        if (low[1] === "ip" && low[2] === "access" && low[3] === "list") { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.showOutput", "This is a show access-lists heading; paste the configuration lines (access-list or ip access-list) instead.") }); context = null; continue; } // show output
      } // show heading
      let i = 0; // the cursor
      let seq: number | null = null; // a written sequence number
      if (isDigits(w0)) { // a sequence number
        if (w0.length > 10 || Number(w0) < 1 || Number(w0) > MAX_SEQ) { issues.push({ line: lineNo, text: text0, entryLike: true, reason: say("issue.seqRange", "A sequence number runs from 1 to 2147483647.") }); continue; } // out of range
        seq = Number(w0); // read
        i = 1; // past it
      } // seq
      const w = low[i]; // the action, perhaps
      if (w === "permit" || w === "deny" || w === "remark") { // an entry or remark line
        if (!context) { issues.push({ line: lineNo, text: text0, entryLike: w !== "remark", reason: say("issue.outsideList", "An entry outside any list: no ip access-list line above it opens one.") }); continue; } // no list open
        if (w === "remark") { addRemark(context, text0, lineNo); remarks++; continue; } // a remark
        const ctx = context; // the open block
        addEntry(() => ctx, ctx.list.kind, { raw, low, i, start: i }, seq, lineNo, text0); // an entry
        continue; // next line
      } // entry
      if (w0 === "ip" && low[1] === "access-group") { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.accessGroup", "ip access-group applies a list to an interface; v1 reads the list, not where it is applied.") }); context = null; continue; } // where it is applied
      if (w0 === "no") { issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.noCommand", "A no command removes configuration; v1 reads the list as written and does not apply removals.") }); continue; } // no ...
      if (w === "dynamic" || w === "evaluate") { issues.push({ line: lineNo, text: text0, entryLike: true, reason: say("issue.dynamic", "Dynamic, reflexive and evaluate entries are outside v1.") }); continue; } // dynamic
      context = null; // any other configuration line ends the block
      issues.push({ line: lineNo, text: text0, entryLike: false, reason: say("issue.unknownLine", "Not an access-list line this tool reads.") }); // listed
    } catch (e) { // an entry that could not be read
      if (e instanceof EntryError) issues.push({ line: lineNo, text: text0, entryLike: true, reason: e.sentence }); // listed with its reason
      else throw e; // a defect: not hidden
    } // try
  } // lines
  const lists = order.map((name) => byName.get(name)!.list); // first-named order
  for (const l of lists) { // each list
    l.entries.sort((a, b) => a.seq - b.seq); // "This number dictates the order in which ACEs are evaluated"
    l.evaluationOrder = l.kind === "standard" // a standard list: hashed hosts first, then the linked list (IOS XE 17.x guide)
      ? [...l.entries.filter((e) => e.hashed), ...l.entries.filter((e) => !e.hashed)].map((e) => e.seq) // hosts, then the rest, each by sequence
      : l.entries.map((e) => e.seq); // by sequence
  } // lists
  return { lists, issues, remarks, lines: lines.length }; // read
} // readLists

/**
 * Add a remark to a list: its text is everything after the remark keyword (the words before it, a list number or a
 * sequence number, never contain it).
 * @param b the list
 * @param text0 the line, trimmed
 * @param line the line number
 */
function addRemark(b: Building, text0: string, line: number): void {
  const at = text0.toLowerCase().indexOf("remark"); // the keyword
  b.list.remarks.push({ list: b.list.name, line, text: text0.slice(at + "remark".length).trim() }); // kept
} // addRemark

// ---------------------------------------------------------------------------
// The packet.
// ---------------------------------------------------------------------------

/**
 * Read the test packet.
 * @param p the packet as typed
 * @returns the packet, or the reasons it was refused
 */
function readPacket(p: AclPacketInput): { packet: AclPacket | null; errors: EngineText[] } {
  const errors: EngineText[] = []; // the reasons
  const pw = (p.protocol ?? "").trim().toLowerCase(); // the protocol
  let protocol: number | null = null; // its number
  if (isDigits(pw) && pw.length <= 3 && Number(pw) <= 255) protocol = Number(pw); // a number
  else if (pw !== "ip" && Object.prototype.hasOwnProperty.call(PROTOCOL_NUMBERS, pw)) protocol = PROTOCOL_NUMBERS[pw]; // a keyword
  if (protocol === null) errors.push(say("packet.protocol", "The packet's protocol is tcp, udp, icmp, igmp, gre, esp, eigrp, ospf, pim or a number from 0 to 255.")); // refused
  const src = parseIpv4((p.source ?? "").trim()); // the source
  if (src === null) errors.push(say("packet.source", "The packet's source address is an IPv4 address in dotted-decimal form, such as 10.1.10.25.")); // refused
  const dst = parseIpv4((p.destination ?? "").trim()); // the destination
  if (dst === null) errors.push(say("packet.destination", "The packet's destination address is an IPv4 address in dotted-decimal form, such as 10.1.99.10.")); // refused
  const hasPorts = protocol === 6 || protocol === 17; // TCP or UDP
  /** One port field. */
  const port = (v: string | undefined, which: EngineText): number | null => {
    const s = (v ?? "").trim(); // as typed
    if (!hasPorts) return null; // not read for other protocols
    if (!isDigits(s) || s.length > 5 || Number(s) > 65535) { errors.push(say("packet.port", `The packet's ${which} is a number from 0 to 65535.`, { which })); return null; } // refused
    return Number(s); // the port
  }; // port
  const sp = port(p.sourcePort, say("word.sourcePort", "source port")); // the source port
  const dp = port(p.destinationPort, say("word.destinationPort", "destination port")); // the destination port
  if (errors.length > 0 || protocol === null || src === null || dst === null) return { packet: null, errors }; // refused
  return { packet: { protocol, protocolWritten: pw, source: formatIpv4(src), destination: formatIpv4(dst), sourcePort: sp, destinationPort: dp, ackOrRst: protocol === 6 ? !!p.ackOrRst : null }, errors }; // read
} // readPacket

/**
 * The protocol of a packet in words for a sentence.
 * @param p the packet
 * @returns "tcp (6)", "47"
 */
function packetProtocolWords(p: AclPacket): string {
  const name = Object.keys(PROTOCOL_NUMBERS).find((k) => PROTOCOL_NUMBERS[k] === p.protocol); // its keyword, if any
  return name ? `${name} (${p.protocol})` : String(p.protocol); // keyword and number, or the number
} // packetProtocolWords

/**
 * Test one entry against the packet (an unfragmented packet).
 * @param e the entry
 * @param p the packet
 * @param kind the list's kind
 * @returns the first field that rules it out, with its sentence, or the match sentence
 */
function testEntry(e: AclEntry, p: AclPacket, kind: AclKind): { field: AclField | null; reason: EngineText } {
  const src = parseIpv4(p.source)!; // the source as a number (read already)
  const dst = parseIpv4(p.destination)!; // the destination as a number
  if (kind === "standard") { // the source only
    if (!addressAdmits(e.source, src)) return { field: "source", reason: say("step.source", `No match on the source address: ${p.source} is outside ${e.source.written}.`, { address: p.source, written: e.source.written }) }; // outside
    return { field: null, reason: say("step.matchStandard", `Match: ${p.source} is inside ${e.source.written}, and a standard entry tests nothing else, so this entry decides and no later entry is read.`, { address: p.source, written: e.source.written }) }; // the match
  } // standard
  if (e.protocol.number !== null && e.protocol.number !== p.protocol) return { field: "protocol", reason: say("step.protocol", `No match on the protocol: the entry matches ${e.protocol.written} and the packet is ${packetProtocolWords(p)}.`, { entry: e.protocol.written, packet: packetProtocolWords(p) }) }; // another protocol
  if (!addressAdmits(e.source, src)) return { field: "source", reason: say("step.source", `No match on the source address: ${p.source} is outside ${e.source.written}.`, { address: p.source, written: e.source.written }) }; // outside
  if (e.sourcePort && !rangesAdmit(e.sourcePort.ranges, p.sourcePort ?? -1)) return { field: "sourcePort", reason: say("step.sourcePort", `No match on the source port: the entry wants ${e.sourcePort.written} and the packet's source port is ${p.sourcePort}.`, { written: e.sourcePort.written, port: String(p.sourcePort) }) }; // another port
  if (e.destination && !addressAdmits(e.destination, dst)) return { field: "destination", reason: say("step.destination", `No match on the destination address: ${p.destination} is outside ${e.destination.written}.`, { address: p.destination, written: e.destination.written }) }; // outside
  if (e.destinationPort && !rangesAdmit(e.destinationPort.ranges, p.destinationPort ?? -1)) return { field: "destinationPort", reason: say("step.destinationPort", `No match on the destination port: the entry wants ${e.destinationPort.written} and the packet's destination port is ${p.destinationPort}.`, { written: e.destinationPort.written, port: String(p.destinationPort) }) }; // another port
  if (e.established && !p.ackOrRst) return { field: "established", reason: say("step.established", "No match on established: the entry matches only TCP segments with ACK or RST set, and this packet has neither (the opening segment of a connection).") }; // no ACK or RST
  if (e.fragments) return { field: "fragments", reason: say("step.fragments", "No match on fragments: the entry applies only to non-initial fragments, and the test packet is not a fragment.") }; // not a fragment
  return { field: null, reason: say("step.match", "Match: every field the entry tests covers the packet, so this entry decides and no later entry is read.") }; // the match
} // testEntry

// ---------------------------------------------------------------------------
// The lint: what each entry can match, for the two kinds of packet.
// ---------------------------------------------------------------------------

/** What an entry matches for one kind of packet (null: nothing). */
interface MatchSet {
  /** The protocol number, or null for every protocol. */
  protocol: number | null;
  /** The source test. */
  source: AclAddress;
  /** The source ports admitted (every port when untested). */
  sourcePorts: [number, number][];
  /** The destination test (any for a standard entry). */
  destination: AclAddress;
  /** The destination ports admitted. */
  destinationPorts: [number, number][];
  /** Only packets with ACK or RST set. */
  established: boolean;
}

/** The any address test, for a standard entry's destination. */
const ANY_ADDRESS: AclAddress = makeAddress("any", "any", 0, 0xffffffff); // 0.0.0.0 255.255.255.255

/**
 * Whether an entry carries Layer 4 information (ports or established).
 * @param e the entry
 * @returns true when it does
 */
function hasLayer4(e: AclEntry): boolean {
  return !!e.sourcePort || !!e.destinationPort || e.established; // ports or flags
} // hasLayer4

/**
 * What an entry matches among unfragmented packets and initial fragments (class N).
 * @param e the entry
 * @returns the set, or null when it matches none of them
 */
function setN(e: AclEntry): MatchSet | null {
  if (e.fragments) return null; // non-initial fragments only
  const sp = e.sourcePort ? e.sourcePort.ranges : ALL_PORTS; // the source ports
  const dp = e.destinationPort ? e.destinationPort.ranges : ALL_PORTS; // the destination ports
  if (sp.length === 0 || dp.length === 0) return null; // a port test no port passes
  return { protocol: e.protocol.number, source: e.source, sourcePorts: sp, destination: e.destination ?? ANY_ADDRESS, destinationPorts: dp, established: e.established }; // the set
} // setN

/**
 * What an entry matches among non-initial fragments (class F): the Layer 3 part, except that a deny entry with Layer 4
 * information does not apply ("the next access-list entry is processed"; command reference, Usage Guidelines).
 * @param e the entry
 * @returns the set, or null when it matches none of them
 */
function setF(e: AclEntry): MatchSet | null {
  if (hasLayer4(e) && e.action === "deny") return null; // skipped for non-initial fragments
  return { protocol: e.protocol.number, source: e.source, sourcePorts: ALL_PORTS, destination: e.destination ?? ANY_ADDRESS, destinationPorts: ALL_PORTS, established: false }; // the Layer 3 part
} // setF

/**
 * Whether set a contains set b (null is empty).
 * @param a the wider
 * @param b the narrower
 * @returns true when every packet of b is in a
 */
function setCovers(a: MatchSet | null, b: MatchSet | null): boolean {
  if (b === null) return true; // an empty set is inside anything
  if (a === null) return false; // a non-empty set is not inside an empty one
  if (a.protocol !== null && a.protocol !== b.protocol) return false; // a protocol a does not match (b may be every protocol)
  if (!addressCovers(a.source, b.source) || !addressCovers(a.destination, b.destination)) return false; // addresses
  if (!rangesCover(a.sourcePorts, b.sourcePorts) || !rangesCover(a.destinationPorts, b.destinationPorts)) return false; // ports
  if (a.established && !b.established) return false; // a needs ACK or RST, b does not
  return true; // covered
} // setCovers

/**
 * Whether two sets share a packet (null is empty).
 * @param a one
 * @param b the other
 * @returns true when some packet is in both
 */
function setIntersects(a: MatchSet | null, b: MatchSet | null): boolean {
  if (a === null || b === null) return false; // an empty set shares nothing
  if (a.protocol !== null && b.protocol !== null && a.protocol !== b.protocol) return false; // different protocols
  if (!addressIntersects(a.source, b.source) || !addressIntersects(a.destination, b.destination)) return false; // addresses apart
  if (!rangesIntersect(a.sourcePorts, b.sourcePorts) || !rangesIntersect(a.destinationPorts, b.destinationPorts)) return false; // ports apart
  return true; // established never empties an intersection (a segment with ACK can meet both)
} // setIntersects

/**
 * Lint one list, in its evaluation order.
 * @param l the list
 * @returns the findings
 */
function lintList(l: AclList): AclLint<EngineText>[] {
  const out: AclLint<EngineText>[] = []; // the findings
  const bySeq = new Map(l.entries.map((e) => [e.seq, e])); // entries by number
  const evalEntries = l.evaluationOrder.map((s) => bySeq.get(s)!); // in the order tested
  const n = evalEntries.map(setN); // class N sets
  const f = evalEntries.map(setF); // class F sets
  if (l.kind === "standard") out.push({ kind: "standard-reach", seq: null, line: l.line, other: null, sentence: say("lint.standardReach", `List ${l.name} is a standard list: its entries test the source address only, so each one decides for everything those sources send, whatever the destination, protocol or port.`, { list: l.name }) }); // the reach
  for (let b = 0; b < evalEntries.length; b++) { // each entry, in evaluation order
    const e = evalEntries[b]; // the entry
    if (n[b] === null && !e.fragments) { // a port test no port passes
      const pt = e.sourcePort && e.sourcePort.ranges.length === 0 ? e.sourcePort : e.destinationPort!; // the empty test
      out.push({ kind: "never-matches", seq: e.seq, line: e.line, other: null, sentence: say("lint.neverMatches", `Entry ${e.seq} can never match an unfragmented packet: its port test ${pt.written} admits no port.`, { seq: String(e.seq), written: pt.written }) }); // never
      continue; // nothing more to say about it
    } // never
    let found = false; // a finding about coverage was made
    for (let a = 0; a < b && !found; a++) { // each entry tested before it
      if (!setCovers(n[a], n[b])) continue; // does not cover it among unfragmented packets
      const all = setCovers(f[a], f[b]); // and among non-initial fragments
      if (!all && n[b] === null) continue; // a fragments entry: only a cover of the fragments themselves says anything
      const prev = evalEntries[a]; // the covering entry
      const args = { seq: String(e.seq), by: String(prev.seq), byAction: prev.action }; // the values
      if (prev.action !== e.action) out.push({ kind: "shadowed", seq: e.seq, line: e.line, other: prev.seq, sentence: all // the opposite action: shadowed
        ? say("lint.shadowed", `Entry ${e.seq} can never match: entry ${prev.seq} is tested before it and matches every packet it would, with the opposite action (${prev.action}). It is shadowed.`, args) // shadowed
        : say("lint.shadowedUnfragmented", `Entry ${e.seq} is shadowed for every unfragmented packet: entry ${prev.seq} is tested before it and matches all of them with the opposite action (${prev.action}). It still decides non-initial fragments, which Cisco does not test against a deny entry with ports or established.`, args) }); // shadowed except fragments
      else out.push({ kind: "redundant", seq: e.seq, line: e.line, other: prev.seq, sentence: all // the same action: redundant
        ? say("lint.redundant", `Entry ${e.seq} is redundant: entry ${prev.seq} is tested before it and matches every packet it would, with the same action (${prev.action}), so removing it changes nothing.`, args) // redundant
        : say("lint.redundantUnfragmented", `Entry ${e.seq} is redundant for every unfragmented packet: entry ${prev.seq} is tested before it and matches all of them with the same action (${prev.action}). It still decides non-initial fragments, which Cisco does not test against a deny entry with ports or established.`, args) }); // redundant except fragments
      found = true; // one finding per entry
    } // earlier entries
    if (found) continue; // next entry
    for (let c = b + 1; c < evalEntries.length && !found; c++) { // a later entry that would decide the same way
      if (evalEntries[c].action !== e.action || !setCovers(n[c], n[b]) || !setCovers(f[c], f[b])) continue; // not a cover with the same action
      let clear = true; // nothing between decides those packets otherwise
      for (let k = b + 1; k < c && clear; k++) if (evalEntries[k].action !== e.action && (setIntersects(n[k], n[b]) || setIntersects(f[k], f[b]))) clear = false; // an entry between would catch some of them
      if (!clear) continue; // not redundant through this one
      out.push({ kind: "redundant-later", seq: e.seq, line: e.line, other: evalEntries[c].seq, sentence: say("lint.redundantLater", `Entry ${e.seq} is redundant: entry ${evalEntries[c].seq}, tested later, matches every packet it would with the same action (${e.action}), and no entry between them decides any of those packets otherwise.`, { seq: String(e.seq), by: String(evalEntries[c].seq), action: e.action }) }); // redundant through a later entry
      found = true; // one finding per entry
    } // later entries
    if (found || e.action !== "deny") continue; // next entry
    let permitsLater = false; // whether a later permit could catch any of its packets
    for (let k = b + 1; k < evalEntries.length && !permitsLater; k++) if (evalEntries[k].action === "permit" && (setIntersects(n[k], n[b]) || setIntersects(f[k], f[b]))) permitsLater = true; // a later permit overlaps
    if (!permitsLater) out.push({ kind: "redundant-implicit", seq: e.seq, line: e.line, other: null, sentence: e.log // only the implicit deny's work
      ? say("lint.redundantImplicitLog", `Entry ${e.seq} denies only packets the implicit deny at the end would deny anyway, since no later entry permits any of them; it changes no verdict and is there for its ${e.log}.`, { seq: String(e.seq), log: e.log }) // kept for its log
      : say("lint.redundantImplicit", `Entry ${e.seq} denies only packets the implicit deny at the end would deny anyway, since no later entry permits any of them; it changes no verdict, though its counter shows the traffic.`, { seq: String(e.seq) }) }); // redundant with the implicit deny
  } // entries
  for (const e of evalEntries) { // the addresses of every entry
    for (const [which, a] of [["source", e.source], ["destination", e.destination]] as const) { // source and destination
      if (!a) continue; // a standard entry has no destination
      const fieldWord = which === "source" ? say("word.source", "source") : say("word.destination", "destination"); // the field
      if (!a.contiguous) out.push({ kind: "non-contiguous", seq: e.seq, line: e.line, other: null, sentence: say("lint.nonContiguous", `Entry ${e.seq} uses the non-contiguous wildcard ${a.wildcard} on its ${fieldWord} (${a.written}): legal, since Cisco says wildcard bits set to 1 need not be contiguous, but no prefix length can express it, and its ${a.addresses} addresses do not form one block.`, { seq: String(e.seq), wildcard: a.wildcard, field: fieldWord, written: a.written, count: String(a.addresses) }) }); // legal, flagged
      if (a.ignoredBitsSet) out.push({ kind: "ignored-bits", seq: e.seq, line: e.line, other: null, sentence: say("lint.ignoredBits", `Entry ${e.seq}: the ${fieldWord} address ${a.address} has bits set where the wildcard ${a.wildcard} ignores them, so it matches the same addresses as ${a.base} ${a.wildcard}.`, { seq: String(e.seq), field: fieldWord, address: a.address, wildcard: a.wildcard, base: a.base }) }); // bits ignored
    } // fields
  } // entries
  if (l.kind === "standard") { // the hash order
    for (let i = 0; i < evalEntries.length; i++) { // each tested entry
      const e = evalEntries[i]; // the entry
      if (!e.hashed) continue; // only hosts move
      const passed = evalEntries.slice(i + 1).filter((x) => !x.hashed && x.seq < e.seq); // lower numbers it is tested before
      if (passed.length === 0) continue; // in written order already
      out.push({ kind: "hash-order", seq: e.seq, line: e.line, other: passed[0].seq, sentence: say("lint.hashOrder", `Entry ${e.seq} names a single host in a standard list. Cisco looks host entries up in a hash table before the other entries, so it is tested before entry ${passed[0].seq} although its sequence number is higher.`, { seq: String(e.seq), before: String(passed[0].seq) }) }); // moved ahead
    } // entries
  } // standard
  for (const r of l.remarks) if (r.text.length > MAX_REMARK) out.push({ kind: "long-remark", seq: null, line: r.line, other: null, sentence: say("lint.longRemark", `The remark on line ${r.line} has ${r.text.length} characters; Cisco's IOS XE 17.18.1 data model allows 1 to 100.`, { line: String(r.line), count: String(r.text.length) }) }); // too long
  return out; // the findings
} // lintList

// ---------------------------------------------------------------------------
// The whole reading.
// ---------------------------------------------------------------------------

/**
 * Read, evaluate and lint: the page's reading, with every sentence an EngineText.
 * @param req the text, the optional packet and the optional list name
 * @returns the reading
 */
export function analyseAclLocalisable(req: AclRequest): AclReading<EngineText> {
  const text = typeof req.acl === "string" ? req.acl : ""; // the text
  if (text.length > MAX_INPUT) throw engineError(say("err.tooLong", `The text has ${text.length} characters; the most this tool reads is 65,536.`, { count: String(text.length) })); // over the bound
  const lineCount = text.split(/\r\n|\r|\n/).length; // lines
  if (lineCount > MAX_LINES) throw engineError(say("err.tooManyLines", `The text has ${lineCount} lines; the most this tool reads is 4,000.`, { count: String(lineCount) })); // over the bound
  const { lists, issues, remarks, lines } = readLists(text); // read
  const notes: EngineText[] = []; // the notes
  notes.push(say("note.scope", "This reads Cisco IOS and IOS XE IPv4 access lists only. Other platforms end a list differently: Juniper EX discards what no term matched, and Extreme Switch Engine and Fabric Engine permit it by default.")); // the scope, always
  let selected: AclList | null = lists[0] ?? null; // the first list by default
  const wanted = (req.list ?? "").trim(); // the list asked for
  if (wanted !== "" && lists.length > 0) { // a name was given
    const found = lists.find((l) => l.name === wanted) ?? lists.find((l) => isDigits(wanted) && l.name === String(Number(wanted))) ?? null; // by name (a number in any form)
    if (found) selected = found; // that one
    else notes.push(say("note.listMissing", `There is no list ${wanted} in the text, so the first list, ${lists[0].name}, is read.`, { wanted, first: lists[0].name })); // fallback
  } // asked
  const steps: AclStep<EngineText>[] = []; // the walk
  let verdict: AclVerdict<EngineText> | null = null; // the verdict
  let packet: AclPacket | null = null; // the packet
  let packetErrors: EngineText[] = []; // its refusals
  if (req.packet) { // a packet to test
    const pr = readPacket(req.packet); // read
    packet = pr.packet; // the packet
    packetErrors = pr.errors; // its errors
    if (packet && selected) { // walk
      const bySeq = new Map(selected.entries.map((e) => [e.seq, e])); // entries by number
      if (selected.entries.length === 0) verdict = { action: "permit", by: "empty-list", seq: null, line: null, text: null, sentence: say("verdict.empty", `List ${selected.name} has no entries. Cisco documents that an interface with an empty access list applied to it permits all traffic.`, { list: selected.name }) }; // empty
      for (const s of selected.evaluationOrder) { // in evaluation order
        const e = bySeq.get(s)!; // the entry
        const r = testEntry(e, packet, selected.kind); // tested
        steps.push({ seq: e.seq, line: e.line, text: e.text, action: e.action, matched: r.field === null, field: r.field, reason: r.reason }); // recorded
        if (r.field === null) { // the first match decides
          verdict = { action: e.action, by: "entry", seq: e.seq, line: e.line, text: e.text, sentence: e.action === "permit" // the deciding entry
            ? say("verdict.permit", `Entry ${e.seq} matches first and permits the packet.`, { seq: String(e.seq) }) // permitted
            : say("verdict.deny", `Entry ${e.seq} matches first and denies the packet.`, { seq: String(e.seq) }) }; // denied
          if (e.log) notes.push(say("note.log", `Entry ${e.seq} has ${e.log}: Cisco logs the first packet that matches it, then a count of matches every 5 minutes.`, { seq: String(e.seq), log: e.log })); // logging
          break; // "after the first match, no subsequent entries are considered"
        } // match
      } // entries
      if (!verdict) verdict = { action: "deny", by: "implicit-deny", seq: null, line: null, text: null, sentence: say("verdict.implicitDeny", "No entry matches, so the packet meets the implicit deny at the end of the list and is denied: Cisco documents that if no conditions match, the packet is dropped, because each access list ends with an unwritten deny statement.") }; // the implicit deny
      if (selected.kind === "standard") notes.push(say("note.standardPacket", "A standard list reads the packet's source address only: the protocol, the destination and the ports played no part.")); // what was read
      if (packet.protocol !== 6 && packet.protocol !== 17 && ((req.packet.sourcePort ?? "").trim() !== "" || (req.packet.destinationPort ?? "").trim() !== "")) notes.push(say("note.portsIgnored", `Ports are read only for TCP and UDP, so the ports typed play no part for protocol ${packetProtocolWords(packet)}.`, { proto: packetProtocolWords(packet) })); // ports ignored
      const hidden = issues.filter((i) => i.entryLike).length; // entry lines not read
      if (hidden > 0) notes.push(say("note.unreadEntries", `Entry lines not read: ${hidden} (listed below). If the device holds any of them, the verdict may differ: it covers only the entries that were read.`, { count: String(hidden) })); // a caveat
      if (selected.kind === "standard" && selected.evaluationOrder.some((s, i) => s !== selected!.entries[i].seq)) notes.push(say("note.hashOrder", "This standard list names single hosts after other entries. Cisco looks host entries up first, so the walk tests them first, ahead of their sequence numbers.")); // order differs
    } // walk
  } // packet
  const lint = selected ? lintList(selected) : []; // the lint
  if (lists.length === 0) notes.push(say("note.noList", "No access list was found: paste access-list lines, or an ip access-list standard or extended block with its entries.")); // nothing read
  const entries = lists.reduce((n, l) => n + l.entries.length, 0); // all entries
  return { lists, selected: selected?.name ?? null, issues, packet, packetErrors, steps, verdict, lint, notes, counts: { lines, entries, remarks, issues: issues.length } }; // the reading
} // analyseAclLocalisable

/**
 * Read, evaluate and lint: the API's and the vectors' reading, every sentence in English.
 * @param req the request
 * @returns the reading
 */
export function analyseAcl(req: AclRequest): AclReading<string> {
  return plainText(analyseAclLocalisable(req)) as AclReading<string>; // the same reading, as English
} // analyseAcl

/** An API request that could not be read (the Worker answers 400 with its message). */
export class AclRequestError extends Error {
  /**
   * @param message what is wrong with the request
   */
  constructor(message: string) {
    super(message); // the message
    this.name = "AclRequestError"; // its name
  } // constructor
} // AclRequestError

/**
 * The API entry point: the text alone (read and lint), or a JSON object {"acl", "packet", "list"} (and the walk).
 * @param input the request body
 * @returns the reading
 */
export function run(input: string): AclReading<string> {
  const t = input.trimStart(); // a JSON request starts with "{"
  if (!t.startsWith("{")) return analyseAcl({ acl: input }); // plain text: read and lint
  let body: unknown; // the decoded request
  try { body = JSON.parse(t); } catch { throw new AclRequestError("The request starts with { but is not valid JSON; send the access list as text, or {\"acl\": ..., \"packet\": {...}, \"list\": ...}."); } // our own message
  if (typeof body !== "object" || body === null || typeof (body as { acl?: unknown }).acl !== "string") throw new AclRequestError("A JSON request needs an \"acl\" string holding the access list."); // required
  const b = body as { acl: string; packet?: unknown; list?: unknown }; // typed
  if (b.list !== undefined && b.list !== null && typeof b.list !== "string") throw new AclRequestError("\"list\" must be a string naming the list to evaluate."); // wrong type
  let packet: AclPacketInput | null = null; // the packet
  if (b.packet !== undefined && b.packet !== null) { // given
    if (typeof b.packet !== "object") throw new AclRequestError("\"packet\" must be an object with protocol, source, destination and, for TCP and UDP, sourcePort and destinationPort."); // wrong type
    const p = b.packet as Record<string, unknown>; // its fields
    const str = (v: unknown) => (typeof v === "number" || typeof v === "string" ? String(v) : ""); // a field as text
    packet = { protocol: str(p.protocol), source: str(p.source), destination: str(p.destination), sourcePort: str(p.sourcePort), destinationPort: str(p.destinationPort), ackOrRst: p.ackOrRst === true }; // read
  } // packet
  return analyseAcl({ acl: b.acl, packet, list: typeof b.list === "string" ? b.list : null }); // read, walked, linted
} // run
