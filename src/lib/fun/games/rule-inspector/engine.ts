// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/rule-inspector/engine.ts
// ----------------------------------------------------------------------------
// RULE INSPECTOR (PRIME 08/11/2026, the arcade's first wave): the inspector at
// a desk, with connections for the queue and a firewall policy for the
// rulebook. Connections reach the edge firewall of a small office one at a
// time; the player permits or denies each against the policy on the desk, and
// the policy tightens between the shift's three rounds (a change is applied:
// a rule or two inserted). At the end the audit shows every wrong call and
// what decided it. First Match builds an access list; this game reads traffic
// against one, so the two teach the same rule from opposite ends.
//
// THE FIREWALL'S MODEL, in the order it is applied to every connection:
//   1. The state table. A packet that belongs to a connection the policy has
//      already let open in this round (the reply of a permitted TCP SYN or
//      UDP packet: the same protocol, addresses and ports swapped) passes
//      without reading the rules. RFC 6092 describes the state record a
//      stateful filter allocates for a TCP flow (section 3.3.1) and a UDP flow
//      (section 3.2.3) and uses to forward that flow's packets.
//   2. A TCP packet that is not a bare SYN, with no state record, is dropped:
//      stateful filters "prohibit the forwarding of packets that do not match
//      the state of an active flow and do not conform to a rule for the
//      automatic creation of such state" (RFC 6092 section 3.3), and a TCP
//      connection opens with a SYN (RFC 9293 section 3.5).
//   3. The rules, read from the top: the first rule that matches decides
//      (RFC 8519 section 3: "Actions on the first matching ACE are applied
//      with no processing of subsequent ACEs"; Juniper's EX Series order).
//   4. No rule matches: the implicit deny at the end of the list (Juniper:
//      "Every firewall filter contains an implicit deny statement at the end
//      of the filter").
//   A permitted TCP SYN or UDP packet opens a state record for its replies.
//   Every reply in a shift comes in the same round as its opening packet, so
//   a change between rounds never meets a connection already open.
//
// THE NUMBERS come from IANA's registries, read 2026-11-08: the protocol
// numbers (TCP 6, UDP 17, ICMP 1, GRE 47, ESP 50), the service names and
// port numbers (ssh 22, https 443, isakmp 500 and the rest of SERVICES; the
// Dynamic Ports 49152-65535 for the clients' source ports), the ICMP type
// numbers (8, Echo) and the IPv4 special-purpose address registry (RFC 6890),
// whose blocks that are not globally reachable the anti-spoofing change
// denies as sources arriving from the internet (RFC 1918's private-use blocks,
// RFC 6598's shared address space, loopback, link local, "this network",
// benchmarking and the reserved 240/4). The three documentation blocks of RFC
// 5737 stand in for the internet and for the office's public servers, as
// examples should use them; RFC 5737 also asks a real packet filter to drop
// them, which the rules of the game say.
//
// THE DAILY SHIFT is generated from dailyRng("rule-inspector", day, attempt):
// a base policy from a few modules (web, mail with a blocked network, SSH,
// VPN, outbound web, DNS, NTP, or one broad outbound permit), two tightening
// changes among those the base allows (anti-spoofing, SSH only from the
// admins' network, plain HTTP closed, DNS only through the resolver, file
// sharing and remote desktop blocked outbound, a reported host blocked), and
// three rounds of five connections drawn from probe templates, each aimed at
// one lesson. Every verdict comes from evaluateRound() below, never from a
// hand-written label. A shift is kept only when valid() accepts it (both
// verdicts common enough that answering blind fails, the state table used and
// refused, the implicit deny reached, a first match with an opposite rule
// below it, a special-purpose source, each change visibly denying something
// the policy before it permitted and permitting nothing new); after a bounded
// number of attempts it falls back to a fixed shift the self-test proves.
//
// Pure and deterministic: no DOM, no clock, no Math.random.
// ============================================================================

// The daily seed, the seeded generator, and the day arithmetic for the self-test.
import { LAUNCH_DAY, addDays, dailyRng, makeRng, type Rng } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";

/** The game's stable id: its page slug, storage sub-key and engine folder. */
export const GAME_ID = "rule-inspector";

/** Rounds in a shift (the policy tightens before the second and the third). */
export const ROUNDS = 3;

/** Connections in a round. */
export const PER_ROUND = 5;

/** Connections in a shift. */
export const SHIFT_SIZE = ROUNDS * PER_ROUND;

/** Right calls that pass a shift and keep the streak. */
export const PASS_MARK = 12;

/** How many generated shifts are tried for a day before the fixed one is used. */
const MAX_ATTEMPTS = 60;

/** The longest policy a round may put on the desk (it has to fit a phone's screen beside the connection). */
export const MAX_RULES = 12;

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

/**
 * A dotted IPv4 address as its 32-bit value.
 *
 * @param a the address, for example "203.0.113.10"
 * @returns the unsigned value
 */
export function ipToInt(a: string): number {
  // The four octets as numbers.
  const p = a.split(".").map(Number);
  // Shifted into place and kept unsigned.
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

/**
 * A 32-bit value as a dotted IPv4 address.
 *
 * @param n the unsigned value
 * @returns the address
 */
export function intToIp(n: number): string {
  // Each octet from the top.
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

/**
 * The netmask of a prefix length as a 32-bit value.
 *
 * @param len 0 to 32
 * @returns the mask (0 for /0, which a shift by 32 would get wrong)
 */
function maskOf(len: number): number {
  // /0 matches everything; any other length keeps its top bits.
  return len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0;
}

/**
 * Whether an address lies inside a prefix.
 *
 * @param addr the address
 * @param prefix the prefix, "a.b.c.d/len" (a bare address is a /32)
 * @returns true when the address is in the block
 */
export function inPrefix(addr: string, prefix: string): boolean {
  // The network and its length.
  const [net, l] = prefix.split("/");
  // A bare address counts as a single host.
  const m = maskOf(l === undefined ? 32 : Number(l));
  // The same network bits.
  return ((ipToInt(addr) & m) >>> 0) === ((ipToInt(net) & m) >>> 0);
}

/**
 * How many addresses a prefix holds.
 *
 * @param prefix the prefix
 * @returns 2 to the power of the host bits
 */
function blockSize(prefix: string): number {
  // The length after the slash.
  return 2 ** (32 - Number(prefix.split("/")[1]));
}

// ---------------------------------------------------------------------------
// The registries' numbers (IANA, read 2026-11-08)
// ---------------------------------------------------------------------------

/** The protocols a connection on the desk can carry. */
export type Proto = "tcp" | "udp" | "icmp" | "gre" | "esp";

/** Each protocol's number and keyword in IANA's Assigned Internet Protocol Numbers. */
export const PROTOCOLS: Readonly<Record<Proto, { number: number; keyword: string }>> = Object.freeze({
  // Transmission Control.
  tcp: { number: 6, keyword: "TCP" },
  // User Datagram.
  udp: { number: 17, keyword: "UDP" },
  // Internet Control Message.
  icmp: { number: 1, keyword: "ICMP" },
  // Generic Routing Encapsulation.
  gre: { number: 47, keyword: "GRE" },
  // Encap Security Payload.
  esp: { number: 50, keyword: "ESP" },
});

/**
 * Whether a protocol carries port numbers.
 *
 * @param p the protocol
 * @returns true for TCP and UDP; ICMP, GRE and ESP have none
 */
export function hasPorts(p: Proto): boolean {
  // Only the two transports.
  return p === "tcp" || p === "udp";
}

/** One service: its IANA service name, port and transport. */
export interface Service {
  /** The service name as IANA's registry gives it. */
  readonly name: string;
  /** The port number. */
  readonly port: number;
  /** The transport it is registered for here. */
  readonly proto: "tcp" | "udp";
}

/** The services the game uses, each as IANA's Service Name and Transport Protocol Port Number Registry lists it. */
export const SERVICES: readonly Service[] = Object.freeze([
  // The Secure Shell (SSH) Protocol.
  { name: "ssh", port: 22, proto: "tcp" },
  // Telnet.
  { name: "telnet", port: 23, proto: "tcp" },
  // Simple Mail Transfer.
  { name: "smtp", port: 25, proto: "tcp" },
  // Domain Name Server.
  { name: "domain", port: 53, proto: "udp" },
  // World Wide Web HTTP.
  { name: "http", port: 80, proto: "tcp" },
  // Network Time Protocol.
  { name: "ntp", port: 123, proto: "udp" },
  // SNMP.
  { name: "snmp", port: 161, proto: "udp" },
  // http protocol over TLS/SSL.
  { name: "https", port: 443, proto: "tcp" },
  // Microsoft-DS (file sharing).
  { name: "microsoft-ds", port: 445, proto: "tcp" },
  // isakmp (the Internet Key Exchange).
  { name: "isakmp", port: 500, proto: "udp" },
  // Message Submission.
  { name: "submission", port: 587, proto: "tcp" },
  // Microsoft-SQL-Server.
  { name: "ms-sql-s", port: 1433, proto: "tcp" },
  // MySQL.
  { name: "mysql", port: 3306, proto: "tcp" },
  // MS WBT Server (remote desktop).
  { name: "ms-wbt-server", port: 3389, proto: "tcp" },
  // IPsec NAT-Traversal.
  { name: "ipsec-nat-t", port: 4500, proto: "udp" },
]);

/**
 * The IANA service name of a port.
 *
 * @param proto the transport
 * @param port the port, or null
 * @returns the name, or null for a port the game does not name (a client's dynamic port)
 */
export function serviceName(proto: Proto, port: number | null): string | null {
  // No port, no name.
  if (port === null) return null;
  // The listed service on that port and transport.
  return SERVICES.find((s) => s.port === port && s.proto === proto)?.name ?? null;
}

/** The first of the Dynamic Ports (also called private or ephemeral), never assigned by IANA. */
export const DYNAMIC_LO = 49152;

/** The last port number. */
export const DYNAMIC_HI = 65535;

/** ICMP type 8, Echo (a ping), in IANA's ICMP Type Numbers. */
export const ICMP_ECHO = 8;

/** One block of IANA's IPv4 Special-Purpose Address Registry. */
export interface SpecialBlock {
  /** The block. */
  readonly prefix: string;
  /** Its name in the registry. */
  readonly name: string;
  /** The document the registry cites for it. */
  readonly rfc: string;
}

/**
 * The special-purpose blocks the anti-spoofing change denies as sources from the internet: every block of the
 * registry whose "Globally Reachable" is False, except the documentation blocks this game uses for the internet.
 */
export const SPECIAL_SOURCES: readonly SpecialBlock[] = Object.freeze([
  // "This network".
  { prefix: "0.0.0.0/8", name: "This network", rfc: "RFC 791" },
  // Private-Use.
  { prefix: "10.0.0.0/8", name: "Private-Use", rfc: "RFC 1918" },
  // Shared Address Space (carrier-grade NAT).
  { prefix: "100.64.0.0/10", name: "Shared Address Space", rfc: "RFC 6598" },
  // Loopback.
  { prefix: "127.0.0.0/8", name: "Loopback", rfc: "RFC 1122" },
  // Link Local.
  { prefix: "169.254.0.0/16", name: "Link Local", rfc: "RFC 3927" },
  // Private-Use.
  { prefix: "172.16.0.0/12", name: "Private-Use", rfc: "RFC 1918" },
  // Private-Use.
  { prefix: "192.168.0.0/16", name: "Private-Use", rfc: "RFC 1918" },
  // Benchmarking.
  { prefix: "198.18.0.0/15", name: "Benchmarking", rfc: "RFC 2544" },
  // Reserved.
  { prefix: "240.0.0.0/4", name: "Reserved", rfc: "RFC 1112" },
]);

/**
 * The special-purpose block an address falls in, if any.
 *
 * @param addr the address
 * @returns the block, or null
 */
export function specialBlockOf(addr: string): SpecialBlock | null {
  // The first block that holds it (the blocks do not overlap).
  return SPECIAL_SOURCES.find((b) => inPrefix(addr, b.prefix)) ?? null;
}

// ---------------------------------------------------------------------------
// The office
// ---------------------------------------------------------------------------

/** The office's network: one table, the same in every shift. */
export const NET = Object.freeze({
  // The office LAN behind the firewall (private-use space, legitimately inside).
  inside: "10.20.0.0/24",
  // The office's DNS resolver.
  resolver: "10.20.0.53",
  // The public servers' block (TEST-NET-3 standing in for a real public block).
  dmz: "203.0.113.0/24",
  // The web server.
  web: "203.0.113.10",
  // The mail server.
  mail: "203.0.113.25",
  // The VPN gateway.
  vpn: "203.0.113.40",
  // The admins' office on the internet (in TEST-NET-1).
  admin: "192.0.2.64/27",
  // A network that sent spam, blocked from the mail server (in TEST-NET-2).
  spam: "198.51.100.192/26",
  // The upstream DNS server the resolver asks.
  dnsUpstream: "198.51.100.53",
  // The upstream time server.
  ntpUpstream: "192.0.2.123",
});

/** The two documentation blocks that stand in for the internet. */
const INTERNET_BLOCKS = ["192.0.2.0/24", "198.51.100.0/24"] as const;

// ---------------------------------------------------------------------------
// Rules, packets, decisions
// ---------------------------------------------------------------------------

/** What a rule, or the firewall, does with a connection. */
export type Action = "permit" | "deny";

/** Which way a connection crosses the firewall: in from the internet, or out from the office. */
export type Dir = "in" | "out";

/** Every rule the game can put on the desk, by its stable id (also its message key for the reason). */
export type RuleId =
  | "spoofSpecial"
  | "spoofOwn"
  | "blockHost"
  | "mailSpam"
  | "mail"
  | "web443"
  | "web80"
  | "httpDeny"
  | "sshAdmin"
  | "sshDeny"
  | "sshAny"
  | "vpnIke"
  | "vpnEsp"
  | "dnsViaResolver"
  | "dnsDeny"
  | "dnsAny"
  | "dnsResolver"
  | "outWeb"
  | "ntp"
  | "smbDeny"
  | "outAll";

/** One rule of the policy. */
export interface Rule {
  /** Its id (unique in a policy). */
  readonly id: RuleId;
  /** Its sequence number, as a firewall numbers its rules (10, 20 ... with inserted rules between). */
  readonly seq: number;
  /** Permit or deny. */
  readonly action: Action;
  /** In or out. */
  readonly dir: Dir;
  /** The protocol, or null for any protocol. */
  readonly proto: Proto | null;
  /** The source prefixes, or null for any source. */
  readonly src: readonly string[] | null;
  /** "special" when the source list is the special-purpose blocks (shown by name), else null. */
  readonly srcSet: "special" | null;
  /** The destination prefixes, or null for any destination. */
  readonly dst: readonly string[] | null;
  /** The destination ports, or null for any (a rule with ports never matches ESP, GRE or ICMP). */
  readonly ports: readonly number[] | null;
}

/** A rule before it has its sequence number. */
type Draft = Omit<Rule, "seq">;

/** A TCP packet's flags, as the desk shows them: a bare SYN opens; SYN and ACK answers one; ACK is inside a connection. */
export type Flags = "syn" | "syn-ack" | "ack";

/** One connection on the desk: a packet's headers as the firewall reads them. */
export interface Packet {
  /** In from the internet, or out from the office. */
  readonly dir: Dir;
  /** The protocol. */
  readonly proto: Proto;
  /** The source address. */
  readonly src: string;
  /** The source port (TCP and UDP), else null. */
  readonly sport: number | null;
  /** The destination address. */
  readonly dst: string;
  /** The destination port (TCP and UDP), else null. */
  readonly dport: number | null;
  /** TCP only: the flags; null for the other protocols. */
  readonly flags: Flags | null;
  /** ICMP only: the type; null for the other protocols. */
  readonly icmpType: number | null;
}

/** What decided a connection. */
export type DecidedBy = "rule" | "state" | "no-state" | "implicit";

/** How the firewall decides one connection, with what the audit says about it. */
export interface Decision {
  /** Permit or deny. */
  readonly action: Action;
  /** The state table, a rule, the state table's refusal, or the implicit deny. */
  readonly by: DecidedBy;
  /** The deciding rule's id (by rule), else null. */
  readonly rule: RuleId | null;
  /** The deciding rule's sequence number, else null. */
  readonly seq: number | null;
  /** By state: the shift index of the connection whose reply this is, else null. */
  readonly opener: number | null;
  /** By state: the sequence number of the rule that permitted that connection, else null. */
  readonly openerSeq: number | null;
  /** By rule: the first rule below the deciding one that also matches and would do the opposite, else null. */
  readonly shadow: { readonly rule: RuleId; readonly seq: number; readonly action: Action } | null;
  /** Whether this connection opened a state record. */
  readonly opens: boolean;
}

/** The tightening changes applied between rounds. */
export type ChangeKey = "spoof" | "ssh" | "http" | "dns" | "smb" | "blockhost";

/** One round of a shift. */
export interface Round {
  /** The policy on the desk, top first. */
  readonly policy: readonly Rule[];
  /** The change applied before this round (null for the first round). */
  readonly change: ChangeKey | null;
  /** The ids of the rules that change inserted. */
  readonly added: readonly RuleId[];
  /** The round's connections, in the order they arrive. */
  readonly packets: readonly Packet[];
}

/** A shift: three rounds and every decision, in shift order. */
export interface Shift {
  /** The day (YYYY-MM-DD), "practice:<seed>", or "fallback". */
  readonly key: string;
  /** The rounds. */
  readonly rounds: readonly Round[];
  /** The decision for each connection, round after round. */
  readonly decisions: readonly Decision[];
}

/** A state record: a connection the policy let open, by its two ends. */
export interface StateRecord {
  /** The protocol (TCP or UDP). */
  readonly proto: Proto;
  /** The end that opened it. */
  readonly a: string;
  /** Its port. */
  readonly ap: number;
  /** The other end. */
  readonly b: string;
  /** Its port. */
  readonly bp: number;
  /** The shift index of the opening connection. */
  readonly opener: number;
  /** The sequence number of the rule that permitted it. */
  readonly seq: number;
}

// ---------------------------------------------------------------------------
// The firewall
// ---------------------------------------------------------------------------

/**
 * Whether a rule matches a connection: the direction, the protocol, a source prefix, a destination prefix and a
 * destination port, each when the rule names one.
 *
 * @param r the rule
 * @param p the connection
 * @returns true when every field the rule names matches
 */
export function ruleMatches(r: Rule, p: Packet): boolean {
  // The direction.
  if (r.dir !== p.dir) return false;
  // The protocol, when the rule names one.
  if (r.proto !== null && r.proto !== p.proto) return false;
  // A source prefix, when the rule names any.
  if (r.src !== null && !r.src.some((x) => inPrefix(p.src, x))) return false;
  // A destination prefix, when the rule names any.
  if (r.dst !== null && !r.dst.some((x) => inPrefix(p.dst, x))) return false;
  // A destination port, when the rule names any (a connection without ports never matches one).
  if (r.ports !== null && (p.dport === null || !r.ports.includes(p.dport))) return false;
  // Every named field matched.
  return true;
}

/**
 * The position of the first rule that matches a connection.
 *
 * @param policy the rules, top first
 * @param p the connection
 * @returns the index, or -1 when none matches
 */
export function firstMatch(policy: readonly Rule[], p: Packet): number {
  // The first match, read from the top.
  return policy.findIndex((r) => ruleMatches(r, p));
}

/**
 * What the rules alone do with a connection (no state table): the first match, or the implicit deny.
 *
 * @param policy the rules
 * @param p the connection
 * @returns permit or deny
 */
export function rulesVerdict(policy: readonly Rule[], p: Packet): Action {
  // The first matching rule.
  const k = firstMatch(policy, p);
  // Its action, or the implicit deny.
  return k < 0 ? "deny" : policy[k].action;
}

/**
 * Whether a connection belongs to a state record: the same protocol and the same two ends, either way round. A bare
 * TCP SYN never does: it asks for a new connection and goes to the rules.
 *
 * @param r the record
 * @param p the connection
 * @returns true when the record lets it through
 */
function belongs(r: StateRecord, p: Packet): boolean {
  // Another protocol is another flow.
  if (p.proto !== r.proto) return false;
  // A bare SYN opens; it never rides on a record.
  if (p.proto === "tcp" && p.flags === "syn") return false;
  // The opener's own direction.
  const forward = p.src === r.a && p.sport === r.ap && p.dst === r.b && p.dport === r.bp;
  // The reply's direction.
  const reply = p.src === r.b && p.sport === r.bp && p.dst === r.a && p.dport === r.ap;
  // Either.
  return forward || reply;
}

/**
 * Decide a round's connections in order, with the round's own state table (the firewall's model, steps 1 to 4).
 *
 * @param policy the round's rules
 * @param packets the round's connections
 * @param offset the shift index of the round's first connection
 * @returns one decision per connection
 */
export function evaluateRound(policy: readonly Rule[], packets: readonly Packet[], offset: number): Decision[] {
  // The connections the policy has let open so far in this round.
  const table: StateRecord[] = [];
  // Each connection in turn.
  return packets.map((p, i): Decision => {
    // 1. A connection already open lets its packets through.
    const rec = table.find((r) => belongs(r, p));
    // Permitted by the state table, without reading the rules.
    if (rec) return { action: "permit", by: "state", rule: null, seq: null, opener: rec.opener, openerSeq: rec.seq, shadow: null, opens: false };
    // 2. A TCP packet that is not a bare SYN cannot open a connection: dropped.
    if (p.proto === "tcp" && p.flags !== "syn") return { action: "deny", by: "no-state", rule: null, seq: null, opener: null, openerSeq: null, shadow: null, opens: false };
    // 3. The rules, from the top.
    const k = firstMatch(policy, p);
    // 4. None matches: the implicit deny.
    if (k < 0) return { action: "deny", by: "implicit", rule: null, seq: null, opener: null, openerSeq: null, shadow: null, opens: false };
    // The deciding rule.
    const r = policy[k];
    // The first rule below it that also matches and would do the opposite (first match never reads it).
    const below = policy.slice(k + 1).find((x) => x.action !== r.action && ruleMatches(x, p));
    // A permitted SYN or UDP packet opens a state record.
    const opens = r.action === "permit" && (p.proto === "udp" || (p.proto === "tcp" && p.flags === "syn")) && p.sport !== null && p.dport !== null;
    // Recorded for its replies.
    if (opens) table.push({ proto: p.proto, a: p.src, ap: p.sport as number, b: p.dst, bp: p.dport as number, opener: offset + i, seq: r.seq });
    // The rule's decision.
    return { action: r.action, by: "rule", rule: r.id, seq: r.seq, opener: null, openerSeq: null, shadow: below ? { rule: below.id, seq: below.seq, action: below.action } : null, opens };
  });
}

/**
 * The state table as it stands before a connection: the records opened earlier in the same round.
 *
 * @param shift the shift
 * @param index the connection's shift index
 * @returns the records, oldest first
 */
export function stateBefore(shift: Shift, index: number): StateRecord[] {
  // The round's first index.
  const start = Math.floor(index / PER_ROUND) * PER_ROUND;
  // The round.
  const round = shift.rounds[Math.floor(index / PER_ROUND)];
  // The records.
  const out: StateRecord[] = [];
  // Each earlier connection of the round that opened one.
  for (let k = start; k < index; k++) {
    // Its decision.
    const d = shift.decisions[k];
    // Only the openers.
    if (!d?.opens || !round) continue;
    // The connection.
    const p = round.packets[k - start];
    // Its record.
    out.push({ proto: p.proto, a: p.src, ap: p.sport as number, b: p.dst, bp: p.dport as number, opener: k, seq: d.seq as number });
  }
  // The table.
  return out;
}

/**
 * Grade a shift's calls.
 *
 * @param shift the shift
 * @param calls one letter a connection, p (permit) or d (deny), in order (fewer are graded as far as they go)
 * @returns the right calls and, per call, whether it was right
 */
export function grade(shift: Shift, calls: string): { right: number; oks: boolean[] } {
  // Each call against the firewall's decision.
  const oks = Array.from(calls.slice(0, shift.decisions.length)).map((ch, i) => (ch === "p" ? "permit" : "deny") === shift.decisions[i].action);
  // The count, and the marks.
  return { right: oks.filter(Boolean).length, oks };
}

/**
 * The share card's rows: one row a round, a square a call.
 *
 * @param oks right or wrong, per call
 * @returns up to three strings of up to five squares
 */
export function shareRows(oks: readonly boolean[]): string[] {
  // The rows.
  const rows: string[] = [];
  // A round at a time.
  for (let r = 0; r * PER_ROUND < oks.length; r++) rows.push(oks.slice(r * PER_ROUND, (r + 1) * PER_ROUND).map((ok) => (ok ? "🟩" : "🟥")).join(""));
  // Done.
  return rows;
}

// ---------------------------------------------------------------------------
// The policy: base modules and tightening changes
// ---------------------------------------------------------------------------

/** What a shift's base policy holds, drawn once per shift. */
interface Base {
  /** Anti-spoofing already in the base (else it is one of the changes). */
  spoof: boolean;
  /** The mail server, with its blocked spam network. */
  mail: boolean;
  /** Plain HTTP to the web server (HTTPS is always there). */
  web80: boolean;
  /** SSH from anywhere to every public server (the sloppy rule a change tightens). */
  ssh: boolean;
  /** The VPN gateway: IKE over UDP and ESP. */
  vpn: boolean;
  /** One broad outbound permit instead of the specific ones. */
  outAll: boolean;
  /** Specific outbound: DNS from any inside host (else only from the resolver). */
  dnsAny: boolean;
  /** Specific outbound: NTP. */
  ntp: boolean;
  /** The host a "blockhost" change blocks (drawn always, used only by that change). */
  blockHost: string;
}

/**
 * A rule draft.
 *
 * @param id its id
 * @param action permit or deny
 * @param dir in or out
 * @param proto the protocol, or null
 * @param src the sources, or null
 * @param dst the destinations, or null
 * @param ports the destination ports, or null
 * @param srcSet "special" for the special-purpose list
 * @returns the draft
 */
function draft(id: RuleId, action: Action, dir: Dir, proto: Proto | null, src: readonly string[] | null, dst: readonly string[] | null, ports: readonly number[] | null, srcSet: "special" | null = null): Draft {
  // The fields as given.
  return { id, action, dir, proto, src, srcSet, dst, ports };
}

/**
 * Every rule the game can use, built for one shift (the blocked host is the shift's own).
 *
 * @param b the shift's base
 * @returns the drafts by id
 */
function drafts(b: Base): Record<RuleId, Draft> {
  // The table.
  return {
    // Anti-spoofing: the special-purpose blocks cannot be a source from the internet.
    spoofSpecial: draft("spoofSpecial", "deny", "in", null, SPECIAL_SOURCES.map((s) => s.prefix), null, null, "special"),
    // Anti-spoofing: the office's own public block cannot arrive from outside.
    spoofOwn: draft("spoofOwn", "deny", "in", null, [NET.dmz], null, null),
    // A host reported for attacks, blocked everywhere.
    blockHost: draft("blockHost", "deny", "in", null, [`${b.blockHost}/32`], null, null),
    // The spam network may not reach the mail server's SMTP.
    mailSpam: draft("mailSpam", "deny", "in", "tcp", [NET.spam], [`${NET.mail}/32`], [25]),
    // Everyone else may.
    mail: draft("mail", "permit", "in", "tcp", null, [`${NET.mail}/32`], [25]),
    // HTTPS to the web server.
    web443: draft("web443", "permit", "in", "tcp", null, [`${NET.web}/32`], [443]),
    // Plain HTTP to the web server.
    web80: draft("web80", "permit", "in", "tcp", null, [`${NET.web}/32`], [80]),
    // The change that closes plain HTTP.
    httpDeny: draft("httpDeny", "deny", "in", "tcp", null, [`${NET.web}/32`], [80]),
    // SSH from the admins' network.
    sshAdmin: draft("sshAdmin", "permit", "in", "tcp", [NET.admin], [NET.dmz], [22]),
    // SSH from anywhere else, denied.
    sshDeny: draft("sshDeny", "deny", "in", "tcp", null, [NET.dmz], [22]),
    // SSH from anywhere to every public server (the base's sloppy rule).
    sshAny: draft("sshAny", "permit", "in", "tcp", null, [NET.dmz], [22]),
    // IKE to the VPN gateway, on its two UDP ports.
    vpnIke: draft("vpnIke", "permit", "in", "udp", null, [`${NET.vpn}/32`], [500, 4500]),
    // ESP to the VPN gateway (no ports).
    vpnEsp: draft("vpnEsp", "permit", "in", "esp", null, [`${NET.vpn}/32`], null),
    // The change's permit: DNS out from the resolver only.
    dnsViaResolver: draft("dnsViaResolver", "permit", "out", "udp", [`${NET.resolver}/32`], null, [53]),
    // The change's deny: DNS out from anyone else.
    dnsDeny: draft("dnsDeny", "deny", "out", "udp", [NET.inside], null, [53]),
    // DNS out from any inside host.
    dnsAny: draft("dnsAny", "permit", "out", "udp", [NET.inside], null, [53]),
    // DNS out from the resolver only (the base's tidy form).
    dnsResolver: draft("dnsResolver", "permit", "out", "udp", [`${NET.resolver}/32`], null, [53]),
    // Web out: HTTP and HTTPS.
    outWeb: draft("outWeb", "permit", "out", "tcp", [NET.inside], null, [80, 443]),
    // Time out.
    ntp: draft("ntp", "permit", "out", "udp", [NET.inside], null, [123]),
    // File sharing and remote desktop out, denied.
    smbDeny: draft("smbDeny", "deny", "out", "tcp", [NET.inside], null, [445, 3389]),
    // Everything out.
    outAll: draft("outAll", "permit", "out", null, [NET.inside], null, null),
  };
}

/**
 * Number a list of drafts 10, 20, 30 ...
 *
 * @param list the drafts, top first
 * @returns the rules
 */
function numbered(list: readonly Draft[]): Rule[] {
  // Tens, from 10.
  return list.map((d, i) => ({ ...d, seq: (i + 1) * 10 }));
}

/**
 * The base policy: anti-spoofing first when the base has it, the inbound modules in a shuffled order, then the
 * outbound ones (a broad outbound permit alone, or the specific ones shuffled).
 *
 * @param b the base
 * @param rng the shift's generator
 * @returns the numbered rules
 */
function basePolicy(b: Base, rng: Rng): Rule[] {
  // The drafts.
  const D = drafts(b);
  // The inbound modules, each kept in its own order (the spam deny before the mail permit).
  const inbound: Draft[][] = [[D.web443]];
  // Plain HTTP.
  if (b.web80) inbound.push([D.web80]);
  // Mail, with its exception first.
  if (b.mail) inbound.push([D.mailSpam, D.mail]);
  // SSH from anywhere.
  if (b.ssh) inbound.push([D.sshAny]);
  // The VPN gateway.
  if (b.vpn) inbound.push([D.vpnIke, D.vpnEsp]);
  // The outbound rules.
  const outbound: Draft[] = b.outAll ? [D.outAll] : rng.shuffle([b.dnsAny ? D.dnsAny : D.dnsResolver, D.outWeb, ...(b.ntp ? [D.ntp] : [])]);
  // Anti-spoofing on top, inbound, outbound.
  return numbered([...(b.spoof ? [D.spoofSpecial, D.spoofOwn] : []), ...rng.shuffle(inbound).flat(), ...outbound]);
}

/**
 * Insert rules before a position, numbered between the rule above (or 0) and the rule at that position.
 *
 * @param policy the rules
 * @param at the position the new rules go before
 * @param add the drafts to insert, in order
 * @returns the new policy
 */
function insertBefore(policy: readonly Rule[], at: number, add: readonly Draft[]): Rule[] {
  // The sequence number above the gap.
  const lo = at > 0 ? policy[at - 1].seq : 0;
  // The sequence number below it.
  const hi = policy[at].seq;
  // Even steps through the gap.
  const step = (hi - lo) / (add.length + 1);
  // The inserted rules.
  const ins = add.map((d, i) => ({ ...d, seq: lo + Math.round(step * (i + 1)) }));
  // Above, inserted, below.
  return [...policy.slice(0, at), ...ins, ...policy.slice(at)];
}

/**
 * Apply a tightening change.
 *
 * @param policy the policy before it
 * @param key the change
 * @param b the base (for the drafts)
 * @returns the new policy and the ids of the rules it inserted
 */
function applyChange(policy: readonly Rule[], key: ChangeKey, b: Base): { policy: Rule[]; added: RuleId[] } {
  // The drafts.
  const D = drafts(b);
  // Where a rule sits.
  const pos = (id: RuleId) => policy.findIndex((r) => r.id === id);
  // What goes where.
  const plan: { at: number; add: Draft[] } =
    key === "spoof"
      ? { at: 0, add: [D.spoofSpecial, D.spoofOwn] }
      : key === "blockhost"
        ? { at: 0, add: [D.blockHost] }
        : key === "ssh"
          ? { at: pos("sshAny"), add: [D.sshAdmin, D.sshDeny] }
          : key === "http"
            ? { at: pos("web80"), add: [D.httpDeny] }
            : key === "dns"
              ? { at: pos("dnsAny"), add: [D.dnsViaResolver, D.dnsDeny] }
              : { at: pos("outAll"), add: [D.smbDeny] };
  // Inserted.
  return { policy: insertBefore(policy, plan.at, plan.add), added: plan.add.map((d) => d.id) };
}

/**
 * Whether a change can be applied to a base: each tightens a rule the base has.
 *
 * @param key the change
 * @param b the base
 * @returns true when the rule it tightens is there
 */
function applicable(key: ChangeKey, b: Base): boolean {
  // Each change and what it needs.
  switch (key) {
    // Anti-spoofing, unless the base already has it.
    case "spoof":
      return !b.spoof;
    // A reported host: always.
    case "blockhost":
      return true;
    // SSH tightening needs SSH from anywhere.
    case "ssh":
      return b.ssh;
    // Closing HTTP needs HTTP.
    case "http":
      return b.web80;
    // DNS through the resolver needs DNS from anyone.
    case "dns":
      return !b.outAll && b.dnsAny;
    // Blocking file sharing out needs the broad outbound permit.
    case "smb":
      return b.outAll;
  }
}

// ---------------------------------------------------------------------------
// The connections: probe templates
// ---------------------------------------------------------------------------

/** What a template needs while a round is built. */
interface Ctx {
  /** The shift's generator. */
  rng: Rng;
  /** The base. */
  b: Base;
  /** The changes in force this round. */
  active: ReadonlySet<ChangeKey>;
  /** Source and destination ports already used in the shift, so no two connections share a dynamic port. */
  ports: Set<number>;
  /** How often each template has been drawn in the shift, so a draw prefers the ones not seen yet. */
  seen: Map<string, number>;
}

/** A template's output: one connection, or an opening connection and its reply. */
type Unit = Packet[];

/** A template: a unit, or null when it does not fit the shift. */
type Template = (c: Ctx) => Unit | null;

/**
 * A packet.
 *
 * @param dir in or out
 * @param proto the protocol
 * @param src the source
 * @param sport the source port, or null
 * @param dst the destination
 * @param dport the destination port, or null
 * @param flags the TCP flags, or null
 * @param icmpType the ICMP type, or null
 * @returns the packet
 */
function pkt(dir: Dir, proto: Proto, src: string, sport: number | null, dst: string, dport: number | null, flags: Flags | null = null, icmpType: number | null = null): Packet {
  // The fields as given.
  return { dir, proto, src, sport, dst, dport, flags, icmpType };
}

/**
 * A dynamic port not used yet in the shift.
 *
 * @param c the context
 * @returns a port from 49152 to 65535
 */
function dyn(c: Ctx): number {
  // Drawn until fresh (the range holds 16,384 ports; a shift uses a dozen).
  for (;;) {
    // A candidate.
    const p = c.rng.range(DYNAMIC_LO, DYNAMIC_HI);
    // Fresh: taken.
    if (!c.ports.has(p)) {
      // Remembered.
      c.ports.add(p);
      // Returned.
      return p;
    }
  }
}

/**
 * A host on the internet (in the documentation blocks), away from the named ones.
 *
 * @param c the context
 * @returns an address
 */
function netHost(c: Ctx): string {
  // Drawn until it is an ordinary host.
  for (;;) {
    // One of the two blocks.
    const block = c.rng.pick(INTERNET_BLOCKS);
    // A host number from 1 to 254.
    const a = `${block.split(".").slice(0, 3).join(".")}.${c.rng.range(1, 254)}`;
    // Not the admins' network, not the spam network, not an upstream server, not the blocked host.
    if (inPrefix(a, NET.admin) || inPrefix(a, NET.spam) || a === NET.dnsUpstream || a === NET.ntpUpstream || a === c.b.blockHost) continue;
    // An ordinary host.
    return a;
  }
}

/**
 * A workstation on the office LAN.
 *
 * @param c the context
 * @returns an address in 10.20.0.100 to 10.20.0.199
 */
function client(c: Ctx): string {
  // The workstations' range (the resolver is .53).
  return `10.20.0.${c.rng.range(100, 199)}`;
}

/**
 * A host in the admins' network.
 *
 * @param c the context
 * @returns an address in 192.0.2.65 to 192.0.2.94
 */
function adminHost(c: Ctx): string {
  // Inside the /27, not its first or last address.
  return `192.0.2.${c.rng.range(65, 94)}`;
}

/**
 * A host in the spam network.
 *
 * @param c the context
 * @returns an address in 198.51.100.193 to 198.51.100.254
 */
function spamHost(c: Ctx): string {
  // Inside the /26, not its first or last address.
  return `198.51.100.${c.rng.range(193, 254)}`;
}

/**
 * An address from one of the special-purpose blocks.
 *
 * @param c the context
 * @returns an address that the anti-spoofing rule names
 */
function specialHost(c: Ctx): string {
  // A block.
  const b = c.rng.pick(SPECIAL_SOURCES);
  // Its first address.
  const base = ipToInt(b.prefix.split("/")[0]);
  // A host inside it, not its first or last address.
  return intToIp(base + c.rng.range(1, Math.min(blockSize(b.prefix), 1 << 24) - 2));
}

/**
 * An address from the office's own public block that is not one of its servers (a spoofed source).
 *
 * @param c the context
 * @returns an address in 203.0.113.0/24
 */
function ownHost(c: Ctx): string {
  // Drawn until it is not a server.
  for (;;) {
    // A host number.
    const n = c.rng.range(1, 254);
    // Not the web, mail or VPN server.
    if (n !== 10 && n !== 25 && n !== 40) return `203.0.113.${n}`;
  }
}

/**
 * A public server for SSH.
 *
 * @param c the context
 * @returns the web or the mail server
 */
function sshServer(c: Ctx): string {
  // Either.
  return c.rng.pick([NET.web, NET.mail]);
}

/**
 * The reply to a TCP SYN or a UDP packet: the ends swapped, SYN and ACK for TCP.
 *
 * @param p the opening packet
 * @returns the reply
 */
function replyOf(p: Packet): Packet {
  // The other way round.
  return pkt(p.dir === "in" ? "out" : "in", p.proto, p.dst, p.dport, p.src, p.sport, p.proto === "tcp" ? "syn-ack" : null);
}

/** Every template, by name. */
const T = {
  // HTTPS to the web server, and its reply (permitted, then the state table).
  webPair: (c: Ctx): Unit => {
    // The opener.
    const o = pkt("in", "tcp", netHost(c), dyn(c), NET.web, 443, "syn");
    // With its reply.
    return [o, replyOf(o)];
  },
  // HTTPS to the web server, alone.
  webIn: (c: Ctx): Unit => [pkt("in", "tcp", netHost(c), dyn(c), NET.web, 443, "syn")],
  // A workstation browsing out, and the reply.
  outWebPair: (c: Ctx): Unit => {
    // The opener, HTTPS mostly.
    const o = pkt("out", "tcp", client(c), dyn(c), netHost(c), c.rng.chance(0.75) ? 443 : 80, "syn");
    // With its reply.
    return [o, replyOf(o)];
  },
  // A workstation browsing out, alone.
  outWeb: (c: Ctx): Unit => [pkt("out", "tcp", client(c), dyn(c), netHost(c), 443, "syn")],
  // The resolver asking upstream, and the answer.
  dnsPair: (c: Ctx): Unit => {
    // The query.
    const o = pkt("out", "udp", NET.resolver, dyn(c), NET.dnsUpstream, 53);
    // With its answer.
    return [o, replyOf(o)];
  },
  // The resolver asking upstream, alone.
  dnsResolver: (c: Ctx): Unit => [pkt("out", "udp", NET.resolver, dyn(c), NET.dnsUpstream, 53)],
  // A workstation asking an outside DNS server directly.
  dnsWorkstation: (c: Ctx): Unit => [pkt("out", "udp", client(c), dyn(c), NET.dnsUpstream, 53)],
  // Time from upstream, and the answer (needs an NTP or a broad outbound rule).
  ntpPair: (c: Ctx): Unit | null => {
    // Not without a rule that lets it out.
    if (!c.b.ntp && !c.b.outAll) return null;
    // The request.
    const o = pkt("out", "udp", client(c), dyn(c), NET.ntpUpstream, 123);
    // With its answer.
    return [o, replyOf(o)];
  },
  // An ACK from outside to a workstation, with no connection behind it.
  strayAck: (c: Ctx): Unit => [pkt("in", "tcp", netHost(c), 443, client(c), dyn(c), "ack")],
  // A SYN and ACK from outside to a workstation that never sent the SYN.
  straySynAck: (c: Ctx): Unit => [pkt("in", "tcp", netHost(c), c.rng.pick([80, 443]), client(c), dyn(c), "syn-ack")],
  // An ACK to the web server's HTTPS with no connection open (the rules would permit a SYN).
  ackToWeb: (c: Ctx): Unit => [pkt("in", "tcp", netHost(c), dyn(c), NET.web, 443, "ack")],
  // A connection to a port no rule opens.
  closedPort: (c: Ctx): Unit => {
    // ICMP Echo, SNMP over UDP, or one of the TCP services nobody publishes.
    const kind = c.rng.int(4);
    // A ping to a server.
    if (kind === 0) return [pkt("in", "icmp", netHost(c), null, c.rng.pick([NET.web, NET.mail]), null, null, ICMP_ECHO)];
    // SNMP to a server.
    if (kind === 1) return [pkt("in", "udp", netHost(c), dyn(c), c.rng.pick([NET.web, NET.mail, NET.vpn]), 161)];
    // A TCP service.
    return [pkt("in", "tcp", netHost(c), dyn(c), c.rng.pick([NET.web, NET.mail, NET.vpn]), c.rng.pick([23, 445, 1433, 3306, 3389]), "syn")];
  },
  // Message submission to the mail server, which only publishes SMTP (needs the mail module).
  mailOther: (c: Ctx): Unit | null => (c.b.mail ? [pkt("in", "tcp", netHost(c), dyn(c), NET.mail, 587, "syn")] : null),
  // ESP to the web server, which is no VPN gateway.
  espToWeb: (c: Ctx): Unit => [pkt("in", "esp", netHost(c), null, NET.web, null)],
  // GRE to the VPN gateway, which only takes IKE and ESP (needs the VPN module).
  greToVpn: (c: Ctx): Unit | null => (c.b.vpn ? [pkt("in", "gre", netHost(c), null, NET.vpn, null)] : null),
  // ESP to the VPN gateway (needs the VPN module).
  vpnEsp: (c: Ctx): Unit | null => (c.b.vpn ? [pkt("in", "esp", netHost(c), null, NET.vpn, null)] : null),
  // IKE to the VPN gateway, 500 to 500 or NAT traversal on 4500 (needs the VPN module).
  vpnIke: (c: Ctx): Unit | null => {
    // Not without the gateway.
    if (!c.b.vpn) return null;
    // NAT traversal or not.
    const natT = c.rng.chance(0.5);
    // The packet.
    return [pkt("in", "udp", netHost(c), natT ? dyn(c) : 500, NET.vpn, natT ? 4500 : 500)];
  },
  // A workstation sending mail straight out, which only a broad outbound rule allows (needs specific outbound).
  outSmtp: (c: Ctx): Unit | null => (c.b.outAll ? null : [pkt("out", "tcp", client(c), dyn(c), netHost(c), 25, "syn")]),
  // File sharing or remote desktop out (needs the broad outbound rule, which the smb change tightens).
  outSmb: (c: Ctx): Unit | null => (c.b.outAll ? [pkt("out", "tcp", client(c), dyn(c), netHost(c), c.rng.pick([445, 3389]), "syn")] : null),
  // File sharing out, denied, and the "reply" that then arrives with no connection behind it.
  smbDeniedPair: (c: Ctx): Unit | null => {
    // Only where the opener is denied: specific outbound, or the smb change in force.
    if (c.b.outAll && !c.active.has("smb")) return null;
    // The opener.
    const o = pkt("out", "tcp", client(c), dyn(c), netHost(c), 445, "syn");
    // And its reply.
    return [o, replyOf(o)];
  },
  // An answer from the upstream DNS server that nobody asked for.
  udpUnsolicited: (c: Ctx): Unit => [pkt("in", "udp", NET.dnsUpstream, 53, NET.resolver, dyn(c))],
  // SSH to a public server from anywhere (needs the SSH module).
  sshIn: (c: Ctx): Unit | null => (c.b.ssh ? [pkt("in", "tcp", netHost(c), dyn(c), sshServer(c), 22, "syn")] : null),
  // SSH to a public server from the admins' network (needs the SSH module).
  sshAdmin: (c: Ctx): Unit | null => (c.b.ssh ? [pkt("in", "tcp", adminHost(c), dyn(c), sshServer(c), 22, "syn")] : null),
  // A special-purpose source arriving from the internet, to a published service.
  spoofSpecial: (c: Ctx): Unit => [c.b.mail && c.rng.chance(0.3) ? pkt("in", "tcp", specialHost(c), dyn(c), NET.mail, 25, "syn") : pkt("in", "tcp", specialHost(c), dyn(c), NET.web, 443, "syn")],
  // The office's own block arriving from the internet (needs anti-spoofing in force).
  spoofOwn: (c: Ctx): Unit | null => (c.b.spoof || c.active.has("spoof") ? [pkt("in", "tcp", ownHost(c), dyn(c), NET.web, 443, "syn")] : null),
  // The reported host trying a published service: SMTP on the mail server now and then, HTTPS on the web server otherwise.
  blockedHost: (c: Ctx): Unit => [c.b.mail && c.rng.chance(0.3) ? pkt("in", "tcp", c.b.blockHost, dyn(c), NET.mail, 25, "syn") : pkt("in", "tcp", c.b.blockHost, dyn(c), NET.web, 443, "syn")],
  // The spam network trying SMTP (needs the mail module).
  mailSpam: (c: Ctx): Unit | null => (c.b.mail ? [pkt("in", "tcp", spamHost(c), dyn(c), NET.mail, 25, "syn")] : null),
  // Anyone else trying SMTP (needs the mail module).
  mailOk: (c: Ctx): Unit | null => (c.b.mail ? [pkt("in", "tcp", netHost(c), dyn(c), NET.mail, 25, "syn")] : null),
  // Plain HTTP to the web server (needs the HTTP module).
  web80In: (c: Ctx): Unit | null => (c.b.web80 ? [pkt("in", "tcp", netHost(c), dyn(c), NET.web, 80, "syn")] : null),
} satisfies Record<string, Template>;

/** A template's name. */
type TName = keyof typeof T;

/** The pairs: an opening connection and its reply. */
const PAIRS: readonly TName[] = ["webPair", "outWebPair", "dnsPair", "ntpPair"];

/** The connections that reach the implicit deny. */
const IMPLICIT: readonly TName[] = ["closedPort", "closedPort", "mailOther", "espToWeb", "greToVpn", "outSmtp", "udpUnsolicited"];

/** The connections the state table refuses. */
const NO_STATE: readonly TName[] = ["strayAck", "straySynAck", "ackToWeb"];

/** The fillers of the later rounds: any lesson again. */
const FILLERS: readonly TName[] = ["strayAck", "ackToWeb", "closedPort", "mailOther", "espToWeb", "greToVpn", "vpnEsp", "vpnIke", "outSmtp", "udpUnsolicited", "spoofOwn", "mailSpam", "mailOk", "sshIn", "web80In"];

/** Each change's probe that it now denies (the policy before it permitted it). */
const CHANGE_DENIED: Readonly<Record<ChangeKey, TName>> = { spoof: "spoofSpecial", ssh: "sshIn", http: "web80In", dns: "dnsWorkstation", smb: "outSmb", blockhost: "blockedHost" };

/** Each change's probe that it still permits (first match falls through the new rule to the old one). */
const CHANGE_STILL: Readonly<Record<ChangeKey, TName>> = { spoof: "webIn", ssh: "sshAdmin", http: "webIn", dns: "dnsResolver", smb: "outWeb", blockhost: "webIn" };

/**
 * One unit from a list of templates, skipping those that do not fit.
 *
 * @param c the context
 * @param names the templates to choose from
 * @returns a unit, or null when none fits
 */
function draw(c: Ctx, names: readonly TName[]): Unit | null {
  // The templates in a random order, the ones drawn least often in the shift first (a stable sort keeps the shuffle).
  const order = c.rng.shuffle(names).sort((x, y) => (c.seen.get(x) ?? 0) - (c.seen.get(y) ?? 0));
  // Each in turn.
  for (const n of order) {
    // Its unit, if it fits.
    const u = (T[n] as Template)(c);
    // The first that fits, counted.
    if (u) {
      // Seen once more.
      c.seen.set(n, (c.seen.get(n) ?? 0) + 1);
      // Drawn.
      return u;
    }
  }
  // None.
  return null;
}

/**
 * Put a round's units in order: the units shuffled, each reply moved to a random place after its opener.
 *
 * @param rng the generator
 * @param units the units
 * @returns the round's connections
 */
function arrange(rng: Rng, units: readonly Unit[]): Packet[] {
  // The units in a random order.
  const order = rng.shuffle(units);
  // Openers and singles first.
  const out: Packet[] = order.map((u) => u[0]);
  // Then each reply, somewhere after its opener.
  for (const u of order) {
    // Singles have none.
    if (u.length < 2) continue;
    // Its opener's place now.
    const at = out.indexOf(u[0]);
    // A place after it.
    const to = rng.range(at + 1, out.length);
    // Put there.
    out.splice(to, 0, u[1]);
  }
  // The round.
  return out;
}

/**
 * A round's connections: the first round teaches the base (a pair, a first match, the implicit deny, the state
 * table's refusal); a later round leads with its change (what it now denies, what it still permits), then a pair
 * and one more of anything.
 *
 * @param c the context
 * @param change the change applied before the round, or null for the first
 * @returns five connections, or null when the templates could not fill the round
 */
function makeRound(c: Ctx, change: ChangeKey | null): Packet[] | null {
  // The round's units.
  const units: (Unit | null)[] = [];
  // The first round.
  if (change === null) {
    // A connection and its reply.
    units.push(draw(c, PAIRS));
    // A first match with an opposite rule below: anti-spoofing or the spam network, else one more refusal.
    units.push(c.b.spoof ? T.spoofSpecial(c) : c.b.mail ? T.mailSpam(c) : draw(c, NO_STATE));
    // The implicit deny.
    units.push(draw(c, IMPLICIT));
    // The state table's refusal.
    units.push(draw(c, NO_STATE));
  } else {
    // What the change now denies.
    units.push((T[CHANGE_DENIED[change]] as Template)(c));
    // What it still lets through.
    units.push((T[CHANGE_STILL[change]] as Template)(c));
    // A connection and its reply; now and then a denied file-sharing connection and the reply the state table refuses.
    units.push(c.rng.chance(0.25) ? (T.smbDeniedPair(c) ?? draw(c, PAIRS)) : draw(c, PAIRS));
    // One more of anything.
    units.push(draw(c, FILLERS));
  }
  // A template that did not fit spoils the round.
  if (units.some((u) => u === null)) return null;
  // The connections.
  const packets = arrange(c.rng, units as Unit[]);
  // Exactly five.
  return packets.length === PER_ROUND ? packets : null;
}

/**
 * Draw a base.
 *
 * @param rng the generator
 * @returns the base
 */
function drawBase(rng: Rng): Base {
  // Each module by its own chance.
  const b: Base = {
    // Anti-spoofing in the base about a third of the time.
    spoof: rng.chance(0.3),
    // Mail most days.
    mail: rng.chance(0.7),
    // Plain HTTP often.
    web80: rng.chance(0.6),
    // Sloppy SSH often.
    ssh: rng.chance(0.6),
    // The VPN half the time.
    vpn: rng.chance(0.5),
    // A broad outbound permit sometimes.
    outAll: rng.chance(0.4),
    // DNS from anyone, half the time.
    dnsAny: rng.chance(0.5),
    // NTP out most days.
    ntp: rng.chance(0.6),
    // The host a "blockhost" change would block.
    blockHost: `198.51.100.${rng.range(100, 180)}`,
  };
  // The base.
  return b;
}

/**
 * Build one candidate shift from a generator (it may not pass valid()).
 *
 * @param key the shift's key
 * @param rng the generator
 * @returns the shift, or null when a round could not be filled
 */
function buildShift(key: string, rng: Rng): Shift | null {
  // The base.
  const b = drawBase(rng);
  // The other changes the base allows, the reported host among them, in a random order.
  const others = rng.shuffle((["ssh", "http", "dns", "smb", "blockhost"] as ChangeKey[]).filter((k) => applicable(k, b)));
  // Two changes: anti-spoofing first in line when the base lacks it, then the others.
  const pool: ChangeKey[] = [...(applicable("spoof", b) ? (["spoof"] as ChangeKey[]) : []), ...others];
  // A base that allows only one change cannot make a shift (another attempt draws another base).
  if (pool.length < 2) return null;
  // Anti-spoofing (when it is a change) and one more, in a random order.
  const changes = rng.shuffle(pool.slice(0, 2));
  // The base policy.
  const p0 = basePolicy(b, rng);
  // The policies of the three rounds.
  const policies: { policy: Rule[]; added: RuleId[]; change: ChangeKey | null }[] = [{ policy: p0, added: [], change: null }];
  // Each change on top of the last.
  for (const ch of changes) {
    // Applied.
    const next = applyChange(policies[policies.length - 1].policy, ch, b);
    // Kept.
    policies.push({ ...next, change: ch });
  }
  // Ports used in the shift.
  const ports = new Set<number>();
  // Templates drawn in the shift.
  const seen = new Map<string, number>();
  // The rounds.
  const rounds: Round[] = [];
  // The decisions.
  const decisions: Decision[] = [];
  // Each round.
  for (let r = 0; r < ROUNDS; r++) {
    // The changes in force.
    const active = new Set(changes.slice(0, r));
    // Its connections.
    const packets = makeRound({ rng, b, active, ports, seen }, policies[r].change);
    // A round that could not be filled.
    if (!packets) return null;
    // Kept.
    rounds.push({ policy: policies[r].policy, change: policies[r].change, added: policies[r].added, packets });
    // Decided.
    decisions.push(...evaluateRound(policies[r].policy, packets, r * PER_ROUND));
  }
  // The shift.
  return { key, rounds, decisions };
}

// ---------------------------------------------------------------------------
// Validity
// ---------------------------------------------------------------------------

/**
 * Whether a packet is well formed: ports only and always on TCP and UDP, flags only on TCP, a type only on ICMP,
 * the direction agreeing with where it comes from.
 *
 * @param p the packet
 * @returns null when well formed, else the problem
 */
function packetProblem(p: Packet): string | null {
  // Ports, in range, exactly when the protocol has them.
  const portOk = (x: number | null) => (hasPorts(p.proto) ? x !== null && Number.isInteger(x) && x >= 1 && x <= DYNAMIC_HI : x === null);
  // Both ports.
  if (!portOk(p.sport) || !portOk(p.dport)) return "ports";
  // Flags on TCP only.
  if ((p.proto === "tcp") !== (p.flags !== null)) return "flags";
  // A type on ICMP only.
  if ((p.proto === "icmp") !== (p.icmpType !== null)) return "icmp type";
  // Inbound comes from outside the office; outbound from inside it or from a public server.
  const inside = inPrefix(p.src, NET.inside) || inPrefix(p.src, NET.dmz);
  // A packet whose direction contradicts its source (a spoofed own block arrives inbound, which is the point).
  if (p.dir === "out" && !inside) return "direction";
  // Inbound to the office's servers or LAN only.
  if (p.dir === "in" && !inPrefix(p.dst, NET.inside) && !inPrefix(p.dst, NET.dmz)) return "inbound destination";
  // Well formed.
  return null;
}

/**
 * Whether a shift is fit to play: well formed, every lesson present, both verdicts common enough that a blind
 * strategy fails, and each change a real tightening.
 *
 * @param s the shift
 * @returns null when fit, else the first problem found
 */
export function shiftProblem(s: Shift): string | null {
  // Three rounds of five.
  if (s.rounds.length !== ROUNDS || s.rounds.some((r) => r.packets.length !== PER_ROUND) || s.decisions.length !== SHIFT_SIZE) return "shape";
  // Each round's policy: sequence numbers strictly rising and positive, ids unique.
  for (const r of s.rounds) {
    // Rising.
    if (r.policy.some((x, i) => !Number.isInteger(x.seq) || x.seq <= 0 || (i > 0 && x.seq <= r.policy[i - 1].seq))) return "sequence numbers";
    // Unique.
    if (new Set(r.policy.map((x) => x.id)).size !== r.policy.length) return "rule ids";
    // Short enough to read beside the connection.
    if (r.policy.length > MAX_RULES) return "policy too long";
  }
  // Every packet well formed, and no two alike.
  const all = s.rounds.flatMap((r) => r.packets);
  // Each.
  for (const p of all) {
    // Its problem.
    const pr = packetProblem(p);
    // Reported.
    if (pr) return `packet: ${pr}`;
  }
  // Distinct.
  if (new Set(all.map((p) => JSON.stringify(p))).size !== all.length) return "duplicate packet";
  // Every port a rule names is a listed service.
  for (const r of s.rounds) for (const x of r.policy) for (const port of x.ports ?? []) if (!SERVICES.some((v) => v.port === port)) return `unlisted port ${port}`;
  // Every connection with ports has a listed service at one end, and a listed service or a dynamic port at the other.
  for (const p of all) {
    // No ports: nothing to check.
    if (p.sport === null || p.dport === null) continue;
    // A listed service on this transport.
    const listed = (x: number) => serviceName(p.proto, x) !== null;
    // A client's port.
    const dynamic = (x: number) => x >= DYNAMIC_LO && x <= DYNAMIC_HI;
    // One end a service, the other a service or a client.
    if (!((listed(p.sport) && (listed(p.dport) || dynamic(p.dport))) || (listed(p.dport) && dynamic(p.sport)))) return `ports ${p.sport} to ${p.dport}`;
  }
  // The two verdicts.
  const permits = s.decisions.filter((d) => d.action === "permit").length;
  // Both common enough that permitting or denying everything stays under the pass mark.
  if (permits > PASS_MARK - 1 || SHIFT_SIZE - permits > PASS_MARK - 1) return "one-sided";
  // The state table lets a reply through.
  if (!s.decisions.some((d) => d.by === "state")) return "no state permit";
  // The state table refuses a packet.
  if (!s.decisions.some((d) => d.by === "no-state")) return "no state refusal";
  // The implicit deny decides one.
  if (!s.decisions.some((d) => d.by === "implicit")) return "no implicit deny";
  // A first match with an opposite rule below it.
  if (!s.decisions.some((d) => d.shadow !== null)) return "no first-match lesson";
  // A special-purpose source, refused by the anti-spoofing rule.
  if (!s.decisions.some((d, i) => d.rule === "spoofSpecial" && specialBlockOf(all[i].src) !== null)) return "no special-purpose source";
  // Each change: something it now denies that the policy before it permitted, and nothing it opens.
  for (let r = 1; r < ROUNDS; r++) {
    // The round and the one before.
    const now = s.rounds[r];
    const before = s.rounds[r - 1];
    // A change applied.
    if (!now.change || now.added.length === 0) return "no change";
    // Its connections that the rules decide.
    let tightened = false;
    // Each.
    for (let i = 0; i < PER_ROUND; i++) {
      // The decision.
      const d = s.decisions[r * PER_ROUND + i];
      // Only the rules' decisions compare (the state table is per round).
      if (d.by !== "rule" && d.by !== "implicit") continue;
      // The connection.
      const p = now.packets[i];
      // The policy before the change.
      const old = rulesVerdict(before.policy, p);
      // Opened by the change: not a tightening.
      if (d.action === "permit" && old === "deny") return `change ${now.change} opens a connection`;
      // Closed by the change.
      if (d.action === "deny" && old === "permit") tightened = true;
    }
    // The change must show.
    if (!tightened) return `change ${now.change} changes nothing`;
  }
  // Fit.
  return null;
}

/**
 * Decide a shift again with a second, independent reading (connection keys and a set of open ones, rules read by a
 * separate predicate), for the self-test to compare with evaluateRound().
 *
 * @param s the shift
 * @returns the actions, in shift order
 */
function independentActions(s: Shift): Action[] {
  // The actions.
  const out: Action[] = [];
  // Each round, with a fresh set of open connections.
  for (const r of s.rounds) {
    // Open connections, as "proto|a:port|b:port" keys in both directions.
    const open = new Set<string>();
    // Each connection.
    for (const p of r.packets) {
      // Its key, as sent.
      const key = `${p.proto}|${p.src}:${p.sport}|${p.dst}:${p.dport}`;
      // A bare SYN is never a member; anything else is when its key is open.
      if (!(p.proto === "tcp" && p.flags === "syn") && open.has(key)) {
        // Through.
        out.push("permit");
        // Next.
        continue;
      }
      // A TCP packet that is not a bare SYN, unknown: dropped.
      if (p.proto === "tcp" && p.flags !== "syn") {
        // Dropped.
        out.push("deny");
        // Next.
        continue;
      }
      // The rules, read by a predicate of their own: every named field must hold.
      const hit = r.policy.find((x) => x.dir === p.dir && (x.proto ?? p.proto) === p.proto && (x.src ?? [p.src]).some((q) => inPrefix(p.src, q)) && (x.dst ?? [p.dst]).some((q) => inPrefix(p.dst, q)) && (x.ports === null || (p.dport !== null && x.ports.indexOf(p.dport) >= 0)));
      // The action, or the implicit deny.
      const a: Action = hit ? hit.action : "deny";
      // Kept.
      out.push(a);
      // A permitted SYN or UDP packet opens both directions.
      if (a === "permit" && p.sport !== null && p.dport !== null && (p.proto === "udp" || p.flags === "syn")) {
        // As sent.
        open.add(key);
        // Reversed.
        open.add(`${p.proto}|${p.dst}:${p.dport}|${p.src}:${p.sport}`);
      }
    }
  }
  // The actions.
  return out;
}

// ---------------------------------------------------------------------------
// The shifts
// ---------------------------------------------------------------------------

/**
 * The fixed shift used when no generated one passes for a key (the self-test proves it fit).
 *
 * @returns the shift
 */
function fallbackShift(): Shift {
  // Generated from a fixed key, the first fit attempt.
  for (let a = 0; a < 1000; a++) {
    // A candidate.
    const s = buildShift("fallback", dailyRng(GAME_ID, "fallback", `a${a}`));
    // The first fit one.
    if (s && shiftProblem(s) === null) return s;
  }
  // Unreachable while the self-test passes (it checks that this loop finds one); a last, plain answer.
  throw new Error("rule-inspector: no fallback shift");
}

/**
 * Generate a shift: the first fit candidate among the attempts, else the fixed shift under the given key.
 *
 * @param key the shift's key
 * @param rngFor the generator of an attempt
 * @returns the shift
 */
function generate(key: string, rngFor: (attempt: number) => Rng): Shift {
  // Bounded attempts.
  for (let a = 0; a < MAX_ATTEMPTS; a++) {
    // A candidate.
    const s = buildShift(key, rngFor(a));
    // The first fit one.
    if (s && shiftProblem(s) === null) return s;
  }
  // The fixed one, under this key.
  return { ...fallbackShift(), key };
}

/**
 * The day's shift, the same for everyone on that UTC day.
 *
 * @param day YYYY-MM-DD
 * @returns the shift
 */
export function dailyShift(day: string): Shift {
  // Seeded by the game, the day and the attempt.
  return generate(day, (a) => dailyRng(GAME_ID, day, `a${a}`));
}

/**
 * A practice shift from a seed the page picks.
 *
 * @param seed an unsigned 32-bit seed
 * @returns the shift
 */
export function practiceShift(seed: number): Shift {
  // Each attempt's seed mixed from the seed and the attempt.
  return generate(`practice:${seed >>> 0}`, (a) => makeRng((seed ^ Math.imul(a + 1, 0x9e3779b1)) >>> 0));
}

/**
 * Whether a day's shift is a generated one (the self-test counts the days that fell back).
 *
 * @param day YYYY-MM-DD
 * @returns true when an attempt passed
 */
function generatedFor(day: string): boolean {
  // Any attempt that passes.
  for (let a = 0; a < MAX_ATTEMPTS; a++) {
    // A candidate.
    const s = buildShift(day, dailyRng(GAME_ID, day, `a${a}`));
    // Fit.
    if (s && shiftProblem(s) === null) return true;
  }
  // Fell back.
  return false;
}

// ---------------------------------------------------------------------------
// The self-test
// ---------------------------------------------------------------------------

/**
 * The self-test run before every build (scripts/check-fun-games.mts): the firewall's model on hand-made cases, the
 * registries' numbers as the game uses them, then 400 days and 100 practice seeds, each built twice, fit to play,
 * decided the same by a second reading, won by the right calls and lost by answering blind.
 *
 * @returns what was checked and what failed
 */
export function selfTest(): SelfTestReport {
  // Problems.
  const failures: string[] = [];
  // Cases.
  let checked = 0;
  // One case.
  const ok = (label: string, cond: boolean) => {
    // Counted.
    checked++;
    // Reported when it fails.
    if (!cond) failures.push(label);
  };

  // ---- The model, by hand ----
  // A policy: deny the spam network's SMTP, then permit SMTP and HTTPS to the servers.
  const base: Base = { spoof: false, mail: true, web80: false, ssh: false, vpn: false, outAll: false, dnsAny: false, ntp: false, blockHost: "198.51.100.150" };
  // The drafts.
  const D = drafts(base);
  // Numbered.
  const pol = numbered([D.mailSpam, D.mail, D.web443, D.outWeb, D.dnsResolver]);
  // SMTP from the spam network: the deny decides first, the permit below never read.
  const spam = pkt("in", "tcp", "198.51.100.200", 50000, NET.mail, 25, "syn");
  // SMTP from elsewhere: the deny does not match, the permit does.
  const ham = pkt("in", "tcp", "192.0.2.7", 50001, NET.mail, 25, "syn");
  // Telnet to the web server: nothing matches.
  const telnet = pkt("in", "tcp", "192.0.2.8", 50002, NET.web, 23, "syn");
  // A workstation's HTTPS, its reply, and an ACK nobody opened.
  const out = pkt("out", "tcp", "10.20.0.120", 50003, "198.51.100.9", 443, "syn");
  // The reply.
  const back = replyOf(out);
  // A stray ACK.
  const stray = pkt("in", "tcp", "198.51.100.9", 443, "10.20.0.121", 50004, "ack");
  // An ACK to the web server, which a SYN would have been permitted.
  const ack = pkt("in", "tcp", "192.0.2.9", 50005, NET.web, 443, "ack");
  // The resolver's query and its answer, and an answer nobody asked for.
  const q = pkt("out", "udp", NET.resolver, 50006, NET.dnsUpstream, 53);
  // The answer.
  const a = replyOf(q);
  // Unsolicited.
  const unsolicited = pkt("in", "udp", NET.dnsUpstream, 53, NET.resolver, 50007);
  // Decided in one round.
  const dec = evaluateRound(pol, [spam, ham, telnet, out, back, stray, ack, q, a, unsolicited], 0);
  // First match, with the opposite rule below it.
  ok("first match: the spam deny decides, the permit below is the shadow", dec[0].action === "deny" && dec[0].rule === "mailSpam" && dec[0].shadow?.rule === "mail");
  // The permit when the deny does not match.
  ok("first match: other SMTP is permitted by rule 20", dec[1].action === "permit" && dec[1].seq === 20 && dec[1].opens);
  // The implicit deny.
  ok("implicit deny: telnet matches nothing", dec[2].action === "deny" && dec[2].by === "implicit");
  // The state table.
  ok("state: the HTTPS reply rides on the workstation's SYN", dec[4].action === "permit" && dec[4].by === "state" && dec[4].opener === 3 && dec[4].openerSeq === 40);
  // The state table's refusal.
  ok("state: a stray ACK is dropped", dec[5].action === "deny" && dec[5].by === "no-state");
  // Even where a SYN would be permitted.
  ok("state: an ACK to the web server without a connection is dropped", dec[6].action === "deny" && dec[6].by === "no-state");
  // UDP state.
  ok("state: the DNS answer rides on the resolver's query", dec[8].action === "permit" && dec[8].by === "state" && dec[8].opener === 7);
  // An unsolicited UDP packet goes to the rules, and nothing permits it.
  ok("state: an unsolicited DNS answer meets the implicit deny", dec[9].action === "deny" && dec[9].by === "implicit");
  // The empty policy denies all (the implicit deny).
  ok("empty policy denies", evaluateRound([], [ham], 0)[0].by === "implicit");
  // Anti-spoofing in front of the web permit: a private source is denied with the permit as its shadow.
  const spoofed = evaluateRound(numbered([D.spoofSpecial, D.spoofOwn, D.web443]), [pkt("in", "tcp", "192.168.1.20", 50008, NET.web, 443, "syn"), pkt("in", "tcp", "203.0.113.77", 50009, NET.web, 443, "syn"), pkt("in", "tcp", "192.0.2.10", 50010, NET.web, 443, "syn")], 0);
  // The private source.
  ok("anti-spoofing: 192.168.1.20 is denied by the special-purpose rule", spoofed[0].rule === "spoofSpecial" && spoofed[0].shadow?.rule === "web443");
  // The office's own block.
  ok("anti-spoofing: the office's own block from outside is denied", spoofed[1].rule === "spoofOwn");
  // A documentation-block host falls through to the permit.
  ok("anti-spoofing: an internet host falls through to the permit", spoofed[2].action === "permit" && spoofed[2].rule === "web443");

  // ---- The registries' numbers ----
  // Protocol numbers.
  ok("protocol numbers", PROTOCOLS.tcp.number === 6 && PROTOCOLS.udp.number === 17 && PROTOCOLS.icmp.number === 1 && PROTOCOLS.gre.number === 47 && PROTOCOLS.esp.number === 50);
  // One name per port and transport.
  ok("service names unique per port", new Set(SERVICES.map((s) => `${s.port}/${s.proto}`)).size === SERVICES.length);
  // The well-known names.
  ok("service names", serviceName("tcp", 22) === "ssh" && serviceName("tcp", 443) === "https" && serviceName("udp", 53) === "domain" && serviceName("udp", 4500) === "ipsec-nat-t" && serviceName("tcp", 3389) === "ms-wbt-server");
  // A dynamic port has no name.
  ok("dynamic ports are unnamed", serviceName("tcp", DYNAMIC_LO) === null && DYNAMIC_LO === 49152 && DYNAMIC_HI === 65535);
  // The special-purpose blocks: aligned, disjoint.
  ok("special-purpose blocks aligned", SPECIAL_SOURCES.every((b) => (ipToInt(b.prefix.split("/")[0]) % blockSize(b.prefix)) === 0));
  // Disjoint.
  ok("special-purpose blocks disjoint", SPECIAL_SOURCES.every((x, i) => SPECIAL_SOURCES.every((y, j) => i === j || !inPrefix(x.prefix.split("/")[0], y.prefix))));
  // Edges of the blocks.
  ok("172.16.0.0/12 ends at 172.31.255.255", inPrefix("172.31.255.255", "172.16.0.0/12") && !inPrefix("172.32.0.0", "172.16.0.0/12"));
  // Shared address space.
  ok("100.64.0.0/10 ends at 100.127.255.255", inPrefix("100.127.255.255", "100.64.0.0/10") && !inPrefix("100.128.0.0", "100.64.0.0/10"));
  // The documentation blocks are not in the list (they stand in for the internet).
  ok("documentation blocks are not special sources here", specialBlockOf("192.0.2.1") === null && specialBlockOf("198.51.100.1") === null && specialBlockOf("203.0.113.1") === null);
  // The office LAN is private-use space.
  ok("the office LAN is RFC 1918 space", specialBlockOf("10.20.0.1")?.rfc === "RFC 1918");

  // ---- The fixed shift ----
  ok("the fallback shift is fit", shiftProblem(fallbackShift()) === null);

  // ---- 400 days ----
  // Days that fell back.
  let fellBack = 0;
  // Each day.
  for (let d = 0; d < 400; d++) {
    // The day.
    const day = addDays(LAUNCH_DAY, d);
    // Built twice.
    const s1 = dailyShift(day);
    const s2 = dailyShift(day);
    // The same.
    ok(`${day} deterministic`, JSON.stringify(s1) === JSON.stringify(s2));
    // A generated shift.
    if (!generatedFor(day)) fellBack++;
    // Fit.
    const pr = shiftProblem(s1);
    ok(`${day} fit (${pr ?? "ok"})`, pr === null);
    // Checked against the second reading and the scoring.
    checkShift(s1, day, ok);
  }
  // No day fell back to the fixed shift.
  ok(`no day falls back (${fellBack} did)`, fellBack === 0);

  // ---- 100 practice seeds ----
  for (let k = 0; k < 100; k++) {
    // A seed.
    const seed = Math.imul(k + 1, 2654435761) >>> 0;
    // The shift.
    const s = practiceShift(seed);
    // Built twice, the same.
    ok(`practice ${seed} deterministic`, JSON.stringify(s) === JSON.stringify(practiceShift(seed)));
    // Fit.
    ok(`practice ${seed} fit`, shiftProblem(s) === null);
    // Checked.
    checkShift(s, `practice ${seed}`, ok);
  }
  // The report.
  return { checked, failures };
}

/**
 * The checks every generated shift gets: the second reading agrees, the right calls score full marks, the wrong ones
 * none, answering blind fails, and the state table shown before each connection agrees with the decisions.
 *
 * @param s the shift
 * @param label its label in a failure
 * @param ok the self-test's case function
 */
function checkShift(s: Shift, label: string, ok: (label: string, cond: boolean) => void): void {
  // The second reading.
  ok(`${label} second reading agrees`, independentActions(s).join() === s.decisions.map((d) => d.action).join());
  // The right calls.
  const right = s.decisions.map((d) => (d.action === "permit" ? "p" : "d")).join("");
  // Full marks.
  ok(`${label} right calls score ${SHIFT_SIZE}`, grade(s, right).right === SHIFT_SIZE);
  // Every call wrong.
  const wrong = s.decisions.map((d) => (d.action === "permit" ? "d" : "p")).join("");
  // None.
  ok(`${label} wrong calls score 0`, grade(s, wrong).right === 0);
  // Blind: permit everything, or deny everything.
  ok(`${label} answering blind fails`, grade(s, "p".repeat(SHIFT_SIZE)).right < PASS_MARK && grade(s, "d".repeat(SHIFT_SIZE)).right < PASS_MARK);
  // Every state permit names an earlier opener in the same round, in the table shown before it.
  ok(`${label} state table agrees`, s.decisions.every((d, i) => d.by !== "state" || (d.opener !== null && Math.floor(d.opener / PER_ROUND) === Math.floor(i / PER_ROUND) && stateBefore(s, i).some((r) => r.opener === d.opener))));
  // Every rule decision names a rule of its round's policy, with that rule's number.
  ok(`${label} rules exist`, s.decisions.every((d, i) => d.by !== "rule" || s.rounds[Math.floor(i / PER_ROUND)].policy.some((r) => r.id === d.rule && r.seq === d.seq)));
}
