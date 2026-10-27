// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/bigip-vs-precedence/compute.ts
// ----------------------------------------------------------------------------
// THE BIG-IP VIRTUAL SERVER PRECEDENCE LAB'S MODEL (2026-10-26), the
// interactive companion of the article "How a BIG-IP Virtual Server Works".
// The reader defines three to five BIG-IP LTM virtual servers (a destination
// address with its mask, a source address with its mask, a service port or the
// wildcard) and one new inbound connection (source address, destination
// address, destination port). The model says which virtual servers match it,
// then which one takes it and why, one criterion at a time.
//
// The rules are F5's, read on 2026-10-26 in my.f5.com, each named in the
// article:
//   - K14800, "Order of precedence for virtual server matching (11.3.0 and
//     later)": when a connection matches several virtual servers, precedence
//     goes by destination address, then source address, then service port;
//     its table ranks, at each of the three, a host address above a network
//     address above the wildcard (*), and a named port above *, in 18 rows.
//     Its example tables write a host as /32 and the wildcard as 0.0.0.0/0.
//     Neither the numerical order of the addresses nor their order in the
//     configuration plays any part (so the model never looks at the order the
//     reader lists them in).
//   - Two network addresses are told apart by their masks: K14800's own
//     examples choose "the closest subnet on Source Match with mask /25" over
//     a /24 and name the "closest Destination Match" with its mask; K9038
//     ("The order of precedence for local traffic object listeners") states
//     that between virtual servers the more specific destination
//     address/netmask has higher precedence, for source-and-destination
//     listeners from 11.3.0 on too.
// So each criterion is compared by specificity: the longer mask wins (/32 a
// host, /1 to /31 a network, /0 the wildcard), and a named port beats *. This
// reproduces K14800's 18 rows whenever the classes differ. When two network
// addresses with different masks meet, K14800's rows alone (which count every
// network as one class) can rank the pair the other way; the model reports
// that case (rowConflict) and follows the masks, as K14800's examples and
// K9038 word the rule, and the lab says that F5 gives no example of it.
//
// What the model leaves out (the lab's scope note): BIG-IP versions before
// 11.3.0 (K6459: no source address, longest destination subnet first, then
// the port), address lists and port lists (K14800 points to their guide but
// does not say how they rank), route domains (K14800 does not mention them),
// IPv6, the protocol (all taken to be the same), the virtual server's type, a
// disabled virtual server and the tm.continuematching variable (K8009), NATs
// and SNATs (K9038), and what BIG-IP does with a packet no virtual server
// takes.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code. Parsing is
// linear and anchored (no backtracking-prone patterns).
// ============================================================================

/** The fewest virtual servers the lab takes. */
export const MIN_VIRTUALS = 3;
/** The most virtual servers the lab takes. */
export const MAX_VIRTUALS = 5;

/** One virtual server as the reader types it. */
export interface VirtualInput {
  /** Destination: "a.b.c.d/len", "a.b.c.d" (a host) or "*" (the wildcard, 0.0.0.0/0). */
  destination: string;
  /** Source: the same forms as the destination. */
  source: string;
  /** Service port: 1 to 65535, or "*" for every port. */
  port: string;
}

/** The new inbound connection's first packet as the reader types it. */
export interface PacketInput {
  /** The client's address. */
  source: string;
  /** The address it is sent to. */
  destination: string;
  /** The destination port, 1 to 65535. */
  port: string;
}

/** The reader's settings. */
export interface VsPrecedenceInput {
  /** How many virtual servers are in play (the first `count` of `virtuals`). */
  count: number;
  /** The virtual servers (at least `count` of them). */
  virtuals: VirtualInput[];
  /** The packet. */
  packet: PacketInput;
}

/** A parsed address and mask. */
export interface Prefix {
  /** The address as an unsigned 32-bit number. */
  addr: number;
  /** The mask length, 0 to 32. */
  len: number;
}

/** K14800's three address classes: a host (/32), a network (/1 to /31) or the wildcard (/0). */
export type AddrClass = "host" | "network" | "any";
/** K14800's two port classes: a named port or the wildcard. */
export type PortClass = "port" | "any";
/** The three criteria, in K14800's order. */
export type Criterion = "destination" | "source" | "port";

/** One virtual server, parsed and placed. */
export interface VirtualOutcome {
  /** Its position in the reader's list, from 0. */
  index: number;
  /** Its destination. */
  destination: Prefix;
  /** Its source. */
  source: Prefix;
  /** Its port, or null for *. */
  port: number | null;
  /** Its destination's class. */
  destClass: AddrClass;
  /** Its source's class. */
  sourceClass: AddrClass;
  /** Its port's class. */
  portClass: PortClass;
  /** Its row in K14800's table (1 to 18). */
  row: number;
  /** The first criterion, in K14800's order, that the packet fails; null when it matches. */
  miss: Criterion | null;
  /** The criterion at which it dropped out of the contest; null when it won or never matched. */
  droppedAt: Criterion | null;
}

/** One criterion applied to the virtual servers still in contention. */
export interface Step {
  /** Which criterion. */
  criterion: Criterion;
  /** The indexes that entered this step. */
  entered: number[];
  /** The indexes that came out of it. */
  kept: number[];
  /** The indexes it removed. */
  dropped: number[];
  /** The winning mask length (destination and source steps), or null for the port step. */
  bestLen: number | null;
}

/** The model's answer. */
export interface VsPrecedenceResult {
  /** Every virtual server in play, parsed, matched and placed. */
  virtuals: VirtualOutcome[];
  /** The parsed packet. */
  packet: { source: number; destination: number; port: number };
  /** The indexes of the virtual servers that match the packet. */
  candidates: number[];
  /** The criteria applied, in order, until one virtual server was left (none when fewer than two matched). */
  steps: Step[];
  /** The index of the virtual server that takes the packet, or null when none matches. */
  winner: number | null;
  /** The candidate K14800's rows alone would put first (lowest row, then longer masks), or null. */
  tableWinner: number | null;
  /** True when K14800's rows alone rank another candidate first: two network masks decided it. */
  rowConflict: boolean;
}

/** The stable codes an invalid input is refused with. */
export type VsPrecedenceErrorCode =
  | "bad-count"
  | "bad-destination"
  | "bad-source"
  | "host-bits"
  | "bad-port"
  | "duplicate-virtual"
  | "bad-packet-source"
  | "bad-packet-destination"
  | "bad-packet-port";

/** An invalid input, refused with a stable code and the place it points at. */
export class VsPrecedenceError extends Error {
  /** The stable code. */
  readonly code: VsPrecedenceErrorCode;
  /** The virtual server it concerns (from 0), or null for the count or the packet. */
  readonly row: number | null;
  /** The field it concerns, for the interface's aria-invalid: "destination", "source", "port" or "count". */
  readonly field: "destination" | "source" | "port" | "count";
  /** Build the refusal. */
  constructor(code: VsPrecedenceErrorCode, row: number | null, field: "destination" | "source" | "port" | "count", message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
    // Where it points.
    this.row = row;
    // Which field.
    this.field = field;
  }
}

/** A dotted-quad IPv4 address: four groups of one to three digits (anchored, linear). */
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Parse a dotted-quad address into an unsigned 32-bit number, or null. */
export function parseIpv4(text: string): number | null {
  // Surrounding spaces are forgiven.
  const m = IPV4_RE.exec(text.trim());
  // Not four groups of digits.
  if (!m) return null;
  // The four octets.
  const o = [m[1], m[2], m[3], m[4]].map(Number);
  // Each octet must fit in a byte.
  if (o.some((x) => x > 255)) return null;
  // Assembled with multiplication so the result stays unsigned.
  return ((o[0] * 256 + o[1]) * 256 + o[2]) * 256 + o[3];
}

/** The network mask of a length, as an unsigned 32-bit number. */
function maskOf(len: number): number {
  // /0 has no network bits; otherwise the top `len` bits are set.
  return len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0;
}

/** Parse "a.b.c.d/len", "a.b.c.d" (a host) or "*" (0.0.0.0/0); "bad" for a malformed value, "bits" for host bits set. */
function parsePrefix(text: string): Prefix | "bad" | "bits" {
  // Surrounding spaces are forgiven.
  const s = text.trim();
  // The wildcard, as K14800 writes it.
  if (s === "*") return { addr: 0, len: 0 };
  // Split at the one slash, if any.
  const slash = s.indexOf("/");
  // The address part.
  const addrText = slash < 0 ? s : s.slice(0, slash);
  // The mask part: absent means a host (/32).
  const lenText = slash < 0 ? "32" : s.slice(slash + 1);
  // The address must parse.
  const addr = parseIpv4(addrText);
  // A bad address.
  if (addr === null) return "bad";
  // The mask: one or two digits, 0 to 32.
  if (!/^\d{1,2}$/.test(lenText)) return "bad";
  // Its value.
  const len = Number(lenText);
  // Out of range.
  if (len > 32) return "bad";
  // Bits set beyond the mask: the reader must write the network address itself.
  if (((addr & ~maskOf(len)) >>> 0) !== 0) return "bits";
  // A clean prefix.
  return { addr, len };
}

/** Parse a service port: "*" for every port, else 1 to 65535; undefined when malformed. */
function parsePort(text: string): number | null | undefined {
  // Surrounding spaces are forgiven.
  const s = text.trim();
  // The wildcard.
  if (s === "*") return null;
  // One to five digits.
  if (!/^\d{1,5}$/.test(s)) return undefined;
  // Its value.
  const n = Number(s);
  // Port 0 and anything above 65535 are refused.
  return n >= 1 && n <= 65535 ? n : undefined;
}

/** True when an address lies inside a prefix. */
function contains(p: Prefix, addr: number): boolean {
  // Compare the network bits only.
  return ((addr & maskOf(p.len)) >>> 0) === p.addr;
}

/** K14800's class of an address: /32 a host, /0 the wildcard, anything between a network. */
export function classOf(len: number): AddrClass {
  // The two ends, then the middle.
  return len === 32 ? "host" : len === 0 ? "any" : "network";
}

/** The rank of a class in K14800's table: host 0, network 1, wildcard 2. */
function classRank(c: AddrClass): number {
  // Lower is more specific.
  return c === "host" ? 0 : c === "network" ? 1 : 2;
}

/** K14800's row: destination class, then source class, then port class (1 to 18). */
export function k14800Row(d: AddrClass, s: AddrClass, p: PortClass): number {
  // Six rows per destination class, two per source class, one per port class.
  return classRank(d) * 6 + classRank(s) * 2 + (p === "port" ? 0 : 1) + 1;
}

/** Follow one packet through the reader's virtual servers and say which takes it, and why. */
export function compute(input: VsPrecedenceInput): VsPrecedenceResult {
  // The count: three to five, and no more than the rows given.
  if (!Number.isInteger(input.count) || input.count < MIN_VIRTUALS || input.count > MAX_VIRTUALS || input.virtuals.length < input.count) {
    // Refused as a whole.
    throw new VsPrecedenceError("bad-count", null, "count", `count must be ${MIN_VIRTUALS} to ${MAX_VIRTUALS}, with that many virtual servers`);
  }
  // The virtual servers in play, parsed in order.
  const parsed: { destination: Prefix; source: Prefix; port: number | null }[] = [];
  // Each one, refused at its first bad field.
  for (let i = 0; i < input.count; i++) {
    // The reader's row.
    const v = input.virtuals[i];
    // Its destination.
    const d = parsePrefix(v.destination);
    // A malformed destination.
    if (d === "bad") throw new VsPrecedenceError("bad-destination", i, "destination", `virtual ${i + 1}: destination is not a.b.c.d/len, a.b.c.d or *`);
    // Host bits set beyond the mask.
    if (d === "bits") throw new VsPrecedenceError("host-bits", i, "destination", `virtual ${i + 1}: destination has bits set beyond its mask`);
    // Its source.
    const s = parsePrefix(v.source);
    // A malformed source.
    if (s === "bad") throw new VsPrecedenceError("bad-source", i, "source", `virtual ${i + 1}: source is not a.b.c.d/len, a.b.c.d or *`);
    // Host bits set beyond the mask.
    if (s === "bits") throw new VsPrecedenceError("host-bits", i, "source", `virtual ${i + 1}: source has bits set beyond its mask`);
    // Its port.
    const p = parsePort(v.port);
    // A malformed port.
    if (p === undefined) throw new VsPrecedenceError("bad-port", i, "port", `virtual ${i + 1}: port is not 1 to 65535 or *`);
    // The same destination, source and port as an earlier one: two names for one listener.
    const twin = parsed.findIndex((q) => q.destination.addr === d.addr && q.destination.len === d.len && q.source.addr === s.addr && q.source.len === s.len && q.port === p);
    // Refused, pointing at the later one.
    if (twin >= 0) throw new VsPrecedenceError("duplicate-virtual", i, "destination", `virtual ${i + 1} repeats virtual ${twin + 1}`);
    // Kept.
    parsed.push({ destination: d, source: s, port: p });
  }
  // The packet's source: a plain address.
  const pSrc = parseIpv4(input.packet.source);
  // Refused when it is not one.
  if (pSrc === null) throw new VsPrecedenceError("bad-packet-source", null, "source", "packet source is not a.b.c.d");
  // The packet's destination: a plain address.
  const pDst = parseIpv4(input.packet.destination);
  // Refused when it is not one.
  if (pDst === null) throw new VsPrecedenceError("bad-packet-destination", null, "destination", "packet destination is not a.b.c.d");
  // The packet's port: a number, never *.
  const pPort = parsePort(input.packet.port);
  // Refused when it is not 1 to 65535.
  if (pPort === undefined || pPort === null) throw new VsPrecedenceError("bad-packet-port", null, "port", "packet port is not 1 to 65535");

  // Each virtual server placed and matched, in K14800's order of criteria.
  const virtuals: VirtualOutcome[] = parsed.map((v, index) => {
    // The three classes.
    const destClass = classOf(v.destination.len);
    // The source's.
    const sourceClass = classOf(v.source.len);
    // The port's.
    const portClass: PortClass = v.port === null ? "any" : "port";
    // The first criterion the packet fails, destination first.
    const miss: Criterion | null = !contains(v.destination, pDst) ? "destination" : !contains(v.source, pSrc) ? "source" : v.port !== null && v.port !== pPort ? "port" : null;
    // Everything the interface shows about it.
    return { index, destination: v.destination, source: v.source, port: v.port, destClass, sourceClass, portClass, row: k14800Row(destClass, sourceClass, portClass), miss, droppedAt: null };
  });
  // The candidates: every virtual server the packet matches, in the reader's order (which decides nothing).
  const candidates = virtuals.filter((v) => v.miss === null).map((v) => v.index);

  // The contest: destination, then source, then port, each by specificity, while more than one is left.
  const steps: Step[] = [];
  // Still in contention.
  let left = [...candidates];
  // The three criteria in K14800's order.
  for (const criterion of ["destination", "source", "port"] as const) {
    // One or none left: decided.
    if (left.length < 2) break;
    // The specificity of a candidate on this criterion: the mask length, or 1 for a named port and 0 for *.
    const score = (i: number): number => (criterion === "destination" ? virtuals[i].destination.len : criterion === "source" ? virtuals[i].source.len : virtuals[i].port === null ? 0 : 1);
    // The best score among those left.
    const best = Math.max(...left.map(score));
    // Those that reach it stay.
    const kept = left.filter((i) => score(i) === best);
    // The others drop out here.
    const dropped = left.filter((i) => score(i) !== best);
    // Recorded on each one that dropped.
    for (const i of dropped) virtuals[i].droppedAt = criterion;
    // The step, as the account shows it.
    steps.push({ criterion, entered: left, kept, dropped, bestLen: criterion === "port" ? null : best });
    // On to the next criterion with the survivors.
    left = kept;
  }
  // Duplicates are refused, so at most one is left.
  const winner = left.length === 1 ? left[0] : null;

  // K14800's rows alone: the lowest row, then the longer destination mask, then the longer source mask.
  const byTable = [...candidates].sort(
    (a, b) => virtuals[a].row - virtuals[b].row || virtuals[b].destination.len - virtuals[a].destination.len || virtuals[b].source.len - virtuals[a].source.len,
  );
  // Its first, when anything matched.
  const tableWinner = byTable.length ? byTable[0] : null;

  // The full answer.
  return {
    virtuals,
    packet: { source: pSrc, destination: pDst, port: pPort },
    candidates,
    steps,
    winner,
    tableWinner,
    rowConflict: winner !== null && tableWinner !== null && winner !== tableWinner,
  };
}

/** Format an unsigned 32-bit address as a dotted quad. */
export function formatIpv4(addr: number): string {
  // Four octets, most significant first.
  return [Math.floor(addr / 16777216) % 256, Math.floor(addr / 65536) % 256, Math.floor(addr / 256) % 256, addr % 256].join(".");
}

/** Format a prefix as K14800's example tables do: a.b.c.d/len. */
export function formatPrefix(p: Prefix): string {
  // Address, slash, length.
  return `${formatIpv4(p.addr)}/${p.len}`;
}

/** K14800's own Example Configuration Table: MyVS1 to MyVS5. */
const K14800_VIRTUALS: VirtualInput[] = [
  // MyVS1: a host destination on port 80, from anywhere.
  { destination: "192.168.1.101/32", source: "0.0.0.0/0", port: "80" },
  // MyVS2: the same host on every port, from 192.168.2.0/24.
  { destination: "192.168.1.101/32", source: "192.168.2.0/24", port: "*" },
  // MyVS3: the same host on every port, from 192.168.2.0/25.
  { destination: "192.168.1.101/32", source: "192.168.2.0/25", port: "*" },
  // MyVS4: any destination on port 80, from 192.168.2.0/24.
  { destination: "0.0.0.0/0", source: "192.168.2.0/24", port: "80" },
  // MyVS5: the 192.168.1.0/24 network on every port, from anywhere.
  { destination: "192.168.1.0/24", source: "0.0.0.0/0", port: "*" },
];

/** The opening state: K14800's configuration and its third connection, an ordinary client reaching the port 80 host virtual (MyVS1). */
export const DEFAULT_INPUT: VsPrecedenceInput = {
  count: 5,
  virtuals: K14800_VIRTUALS,
  packet: { source: "192.168.10.1", destination: "192.168.1.101", port: "80" },
};

/** The Example: K14800's fourth connection; MyVS4 has the port and the source, but MyVS5's network destination wins. */
export const EXAMPLE_INPUT: VsPrecedenceInput = {
  count: 5,
  virtuals: K14800_VIRTUALS,
  packet: { source: "192.168.2.1", destination: "192.168.1.200", port: "80" },
};
