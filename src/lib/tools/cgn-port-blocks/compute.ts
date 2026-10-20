// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/cgn-port-blocks/compute.ts
// ----------------------------------------------------------------------------
// CGN PORT BLOCKS AND MAP PORT SETS - the pure engine (D-49: deterministic,
// local, no clock, no network, no randomness). Every source below was read on
// 2026-10-19 from rfc-editor.org (the manifest in ./index.ts lists them).
//
// THREE MODES, ONE QUESTION: how is the port space of one public IPv4 address
// divided among the subscribers who share it?
//
//   "blocks"        port-block allocation as RFC 7768 section 2 describes it:
//                   ports go to a subscriber in blocks and only the allocation
//                   of a block is logged. The arithmetic is the port budget of
//                   an address divided into blocks, and RFC 6888 REQ-2 (paired
//                   pooling: one external address per subscriber) is why a
//                   subscriber's blocks are counted on ONE address.
//   "deterministic" RFC 7422 section 2, algorithm 0 (Sequential), exactly as
//                   section 2.3 works it: remove the reserved ports R, divide
//                   what is left by C + D, give block n to inside address n,
//                   and leave the rest as the dynamic pool. Forward (inside to
//                   outside address and port range) and reverse (outside
//                   address, port and time to the inside address).
//   "map"           the MAP port set of RFC 7597 section 5.1 (used unchanged
//                   by MAP-T, RFC 7599 section 5): a 16-bit port is A | PSID |
//                   j, with a offset bits, k PSID bits and m = 16 - a - k bits
//                   of j. Forward (the ranges of one PSID) and reverse (the
//                   PSID that owns a port, Appendix B formula (2)).
//
// Parsing is anchored and linear (no backtracking regular expressions), every
// number is range-checked before it is used, and outputs that could grow with
// the input (the deterministic table, the MAP range list) are capped.
// ============================================================================

// ---- Errors ----------------------------------------------------------------

/** Stable error codes; the page maps each to a localised hint. */
export type CgnErrorCode =
  | "json" // the API body is not a JSON object
  | "mode" // the mode is missing or unknown
  | "field" // a required field is missing or has the wrong type
  | "address" // an IPv4 address is malformed
  | "prefix" // a prefix length is outside 0 to 32
  | "range" // an address range runs backwards
  | "count" // an address count is outside 1 to 16,777,216
  | "port-range" // a usable port range is malformed or runs backwards
  | "reserved" // the reserved port list R is malformed
  | "block-size" // the block size is zero or larger than the usable range
  | "blocks-per-subscriber" // one subscriber's blocks do not fit on one address
  | "subscribers" // the subscriber count is outside 1 to 4,294,967,296
  | "ratio" // C is not a positive integer, or C x O cannot hold every inside address
  | "no-ports" // C + D is larger than the candidate port list
  | "max-ports" // M is outside 1 to 65,536
  | "time" // a timestamp is not YYYY-MM-DDTHH:MM:SSZ
  | "window" // the configuration window ends before it starts
  | "map-bits" // a or k is outside 0 to 16, or a + k exceeds 16
  | "psid" // the PSID is outside 0 to 2^k - 1, or not a number
  | "port"; // a port is outside 0 to 65,535

/** Typed error carrying a stable code (an Error subclass, so the Worker passes its message through). */
export class CgnPortBlocksError extends Error {
  readonly code: CgnErrorCode; // the stable code
  /** @param code the stable code @param message the English explanation */
  constructor(code: CgnErrorCode, message: string) {
    super(message); // the message the API returns
    this.name = "CgnPortBlocksError"; // a recognisable name
    this.code = code; // kept for the page's localised hint
  } // constructor
} // CgnPortBlocksError

// ---- Constants (each with its source) --------------------------------------

/** The port field is 16 bits: 65,536 values, 0 to 65,535 (RFC 6335 section 6: "16-bit namespaces"). */
export const PORT_SPACE = 65536; // 2^16
/** The highest port number. */
const PORT_MAX = 65535; // 2^16 - 1
/** RFC 6335 section 6: "the System Ports, also known as the Well Known Ports, from 0-1023". */
export const SYSTEM_PORTS_LAST = 1023; // the last System Port
/** The usable range the tool assumes unless told otherwise: everything above the System Ports. */
export const DEFAULT_PORT_RANGE = "1024-65535"; // RFC 7422 s2 step 1, RFC 7597 s5.1 (a = 6), RFC 6269 s5
/** RFC 7422 deterministic default for R: the System Ports (section 2 step 1: "e.g., 0-1023 for TCP and UDP"). */
export const DEFAULT_RESERVED = "0-1023"; // the reserved port list R when none is given
/** RFC 7422 section 1: CGN log messages "approximately 150 bytes long for NAT444". */
export const LOG_BYTES_NAT444 = 150; // bytes per per-session log message, NAT444
/** RFC 7422 section 1: "and 175 bytes for DS-Lite". */
export const LOG_BYTES_DSLITE = 175; // bytes per per-session log message, DS-Lite
/** RFC 7422 section 1: "approximately 33,000 connections per day" per household. */
export const CONNECTIONS_PER_DAY = 33000; // the RFC's operator-reported average
/** The largest address set the tool accepts: a /8, 16,777,216 addresses. */
const MAX_ADDRESSES = 16777216; // 2^24
/** The largest subscriber count the tool accepts. */
const MAX_SUBSCRIBERS = 4294967296; // 2^32
/** The deterministic table is returned only up to this many inside addresses. */
export const TABLE_LIMIT = 256; // rows; larger plans are answered by lookup
/** The MAP range list is returned only up to this many ranges. */
export const RANGE_LIMIT = 1024; // a <= 10 always fits
/** At most this many tokens in a reserved port list. */
const MAX_RESERVED_TOKENS = 64; // keeps the parser linear and small

// ---- Small helpers ----------------------------------------------------------

/** An inclusive port range. */
export interface PortRange {
  first: number; // the first port
  last: number; // the last port
} // PortRange

/** The number of ports in a list of ranges. */
function portsIn(ranges: PortRange[]): number {
  return ranges.reduce((sum, r) => sum + (r.last - r.first + 1), 0); // sum of the range lengths
} // portsIn

/** Round to two decimals, the way every rounded figure in this tool is shown. */
function round2(x: number): number {
  return Math.round(x * 100) / 100; // two decimals
} // round2

/** Parse a dotted-quad IPv4 address to an unsigned 32-bit number; null when malformed. */
export function parseIpv4(text: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text.trim()); // four groups of one to three digits
  if (!m) return null; // not a dotted quad
  let value = 0; // the address being built
  for (let i = 1; i <= 4; i++) { // each octet
    const part = m[i]; // the octet's digits
    if (part.length > 1 && part.startsWith("0")) return null; // a leading zero reads as octal on some systems: refused
    const octet = Number(part); // the octet's value
    if (octet > 255) return null; // out of range
    value = value * 256 + octet; // shift in the octet (multiplication keeps it unsigned)
  } // octets
  return value; // 0 to 4,294,967,295
} // parseIpv4

/** Format an unsigned 32-bit number as a dotted quad. */
export function formatIpv4(value: number): string {
  return [Math.floor(value / 16777216) % 256, Math.floor(value / 65536) % 256, Math.floor(value / 256) % 256, value % 256].join("."); // four octets
} // formatIpv4

/** The role an address set plays, which decides how a prefix is counted. */
type AddressRole = "inside" | "outside"; // inside: subscriber host addresses; outside: pool addresses

/** A parsed address set: a prefix, a range, one address, or (for a pool) a bare count. */
export interface AddressSet {
  input: string; // the text as given, trimmed
  kind: "prefix" | "range" | "single" | "count"; // the form it was given in
  count: number; // how many addresses the set holds
  first: number | null; // the first address (null for a bare count)
  last: number | null; // the last address (null for a bare count)
  prefix: { network: number; length: number; masked: boolean } | null; // the prefix, when given as one
} // AddressSet

/**
 * Parse an address set. A prefix counts every address for the outside role (a NAT pool), and its host addresses
 * for the inside role, as RFC 7422 section 2.3 counts them: 198.51.100.0/28 gives the 14 addresses .1 to .14.
 * A /31 or /32 inside prefix counts every address. A range "A-B" and a single address count exactly.
 * @param text the set as text @param role inside or outside @param allowCount true when a bare count is accepted
 */
function parseAddressSet(text: string, role: AddressRole, allowCount: boolean): AddressSet {
  const input = text.trim(); // the trimmed input
  // A bare count, for a pool given as a number of addresses.
  if (/^\d{1,9}$/.test(input)) {
    if (!allowCount) throw new CgnPortBlocksError("address", `"${input}" is a number, not an address set; give a prefix, a range or an address`); // only the pool takes a count
    const count = Number(input); // the count
    if (count < 1 || count > MAX_ADDRESSES) throw new CgnPortBlocksError("count", `an address count must be 1 to ${MAX_ADDRESSES}`); // bounded
    return { input, kind: "count", count, first: null, last: null, prefix: null }; // a count only
  } // count
  // A prefix "A.B.C.D/n".
  const slash = input.indexOf("/"); // where the prefix length starts
  if (slash !== -1) {
    const address = parseIpv4(input.slice(0, slash)); // the address part
    if (address === null) throw new CgnPortBlocksError("address", `"${input.slice(0, slash)}" is not an IPv4 address`); // malformed
    const lengthText = input.slice(slash + 1); // the length part
    if (!/^\d{1,2}$/.test(lengthText) || Number(lengthText) > 32) throw new CgnPortBlocksError("prefix", `"/${lengthText}" is not a prefix length from 0 to 32`); // malformed
    const length = Number(lengthText); // 0 to 32
    const size = 2 ** (32 - length); // addresses in the prefix
    const network = address - (address % size); // the host bits masked off
    const broadcast = network + size - 1; // the last address
    // The inside role counts host addresses for /0 to /30, as RFC 7422 section 2.3 does with its /28.
    const hostsOnly = role === "inside" && length <= 30; // network and broadcast excluded
    const first = hostsOnly ? network + 1 : network; // the first counted address
    const last = hostsOnly ? broadcast - 1 : broadcast; // the last counted address
    const count = last - first + 1; // how many are counted
    if (count > MAX_ADDRESSES) throw new CgnPortBlocksError("count", `the set holds ${count} addresses; the limit is ${MAX_ADDRESSES} (a /8)`); // bounded
    return { input, kind: "prefix", count, first, last, prefix: { network, length, masked: network !== address } }; // the prefix
  } // prefix
  // A range "A-B".
  const dash = input.indexOf("-"); // where the second address starts
  if (dash !== -1) {
    const first = parseIpv4(input.slice(0, dash)); // the first address
    const last = parseIpv4(input.slice(dash + 1)); // the last address
    if (first === null || last === null) throw new CgnPortBlocksError("address", `"${input}" is not a range of two IPv4 addresses`); // malformed
    if (last < first) throw new CgnPortBlocksError("range", `the range ${input} runs backwards`); // backwards
    const count = last - first + 1; // inclusive count
    if (count > MAX_ADDRESSES) throw new CgnPortBlocksError("count", `the range holds ${count} addresses; the limit is ${MAX_ADDRESSES}`); // bounded
    return { input, kind: "range", count, first, last, prefix: null }; // the range
  } // range
  // One address: a /32 in effect.
  const single = parseIpv4(input); // the address
  if (single === null) throw new CgnPortBlocksError("address", `"${input}" is not an IPv4 address, prefix or range`); // malformed
  return { input, kind: "single", count: 1, first: single, last: single, prefix: { network: single, length: 32, masked: false } }; // one address
} // parseAddressSet

/** Parse "first-last" as a usable port range. */
function parsePortRange(text: string): PortRange {
  const m = /^(\d{1,5})\s*-\s*(\d{1,5})$/.exec(text.trim()); // two port numbers
  if (!m) throw new CgnPortBlocksError("port-range", `"${text}" is not a port range such as ${DEFAULT_PORT_RANGE}`); // malformed
  const first = Number(m[1]); // the first port
  const last = Number(m[2]); // the last port
  if (first > PORT_MAX || last > PORT_MAX || last < first) throw new CgnPortBlocksError("port-range", `the port range must run forwards inside 0 to ${PORT_MAX}`); // out of range or backwards
  return { first, last }; // the range
} // parsePortRange

/** Parse the reserved list R ("0-1023", "1-1023,5004,5060") into a 65,536-entry reserved map. */
function parseReserved(text: string): Uint8Array {
  const reserved = new Uint8Array(PORT_SPACE); // 1 = reserved, 0 = candidate
  const tokens = text.split(/[,\s]+/).filter((t) => t.length > 0); // comma or space separated
  if (tokens.length === 0) return reserved; // an empty list reserves nothing
  if (tokens.length > MAX_RESERVED_TOKENS) throw new CgnPortBlocksError("reserved", `the reserved list has more than ${MAX_RESERVED_TOKENS} entries`); // bounded
  for (const token of tokens) { // each port or range
    const m = /^(\d{1,5})(?:-(\d{1,5}))?$/.exec(token); // "n" or "n-m"
    if (!m) throw new CgnPortBlocksError("reserved", `"${token}" is not a port or a port range`); // malformed
    const first = Number(m[1]); // the first port
    const last = m[2] === undefined ? first : Number(m[2]); // the last port
    if (first > PORT_MAX || last > PORT_MAX || last < first) throw new CgnPortBlocksError("reserved", `"${token}" is outside 0 to ${PORT_MAX} or runs backwards`); // out of range
    reserved.fill(1, first, last + 1); // mark the ports reserved
  } // tokens
  return reserved; // the map
} // parseReserved

/** The reserved map as compact text: ranges joined by commas, single ports bare (the RFC 7422 section 3 form). */
function reservedText(reserved: Uint8Array): string {
  const parts: string[] = []; // the pieces
  let p = 0; // the scan position
  while (p < PORT_SPACE) { // one pass over the port space
    if (reserved[p] === 0) { p++; continue; } // a candidate: skip
    const start = p; // a reserved run starts
    while (p < PORT_SPACE && reserved[p] === 1) p++; // run to its end
    parts.push(p - 1 === start ? String(start) : `${start}-${p - 1}`); // "n" or "n-m"
  } // scan
  return parts.join(","); // "1-1023,5004,5060"
} // reservedText

/** The candidate ports (everything not reserved) as ascending ranges. */
function candidateRanges(reserved: Uint8Array): PortRange[] {
  const ranges: PortRange[] = []; // the result
  let p = 0; // the scan position
  while (p < PORT_SPACE) { // one pass
    if (reserved[p] === 1) { p++; continue; } // reserved: skip
    const first = p; // a candidate run starts
    while (p < PORT_SPACE && reserved[p] === 0) p++; // run to its end
    ranges.push({ first, last: p - 1 }); // the run
  } // scan
  return ranges; // ascending, non-overlapping
} // candidateRanges

/** The ports at candidate-list positions lo..hi (inclusive), as ranges split wherever a reserved port intervenes. */
function spanToRanges(candidates: PortRange[], lo: number, hi: number): PortRange[] {
  const out: PortRange[] = []; // the result
  let offset = 0; // candidate positions consumed by earlier ranges
  for (const r of candidates) { // each candidate run
    const len = r.last - r.first + 1; // its length
    const runLo = offset; // its first position
    const runHi = offset + len - 1; // its last position
    const a = Math.max(lo, runLo); // the overlap start
    const b = Math.min(hi, runHi); // the overlap end
    if (a <= b) out.push({ first: r.first + (a - runLo), last: r.first + (b - runLo) }); // the overlapping ports
    offset += len; // advance
    if (offset > hi) break; // past the span
  } // runs
  return out; // the ranges
} // spanToRanges

/** The candidate-list position of a port, or -1 when the port is reserved. */
function positionOf(candidates: PortRange[], port: number): number {
  let offset = 0; // positions before the current run
  for (const r of candidates) { // each candidate run
    if (port < r.first) return -1; // the port lies in a reserved gap
    if (port <= r.last) return offset + (port - r.first); // found
    offset += r.last - r.first + 1; // advance
  } // runs
  return -1; // above the last candidate: reserved
} // positionOf

/** Read an integer field given as a JSON number or a string of digits; undefined when absent and optional. */
function intField(body: Record<string, unknown>, name: string, min: number, max: number, code: CgnErrorCode, required: boolean): number | undefined {
  const raw = body[name]; // the field
  if (raw === undefined || raw === null || raw === "") { // absent
    if (required) throw new CgnPortBlocksError("field", `"${name}" is required`); // required and missing
    return undefined; // optional and absent
  } // absent
  const value = typeof raw === "number" ? raw : typeof raw === "string" && /^\d{1,10}$/.test(raw.trim()) ? Number(raw.trim()) : NaN; // a number or a digit string
  if (!Number.isInteger(value) || value < min || value > max) throw new CgnPortBlocksError(code, `"${name}" must be a whole number from ${min} to ${max}`); // out of range
  return value; // the integer
} // intField

/** Read a string field; undefined when absent and optional. */
function strField(body: Record<string, unknown>, name: string, required: boolean): string | undefined {
  const raw = body[name]; // the field
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) { // absent
    if (required) throw new CgnPortBlocksError("field", `"${name}" is required`); // required and missing
    return undefined; // optional and absent
  } // absent
  if (typeof raw === "number" && Number.isInteger(raw)) return String(raw); // a number where text is accepted (a pool count)
  if (typeof raw !== "string") throw new CgnPortBlocksError("field", `"${name}" must be text`); // wrong type
  return raw.trim(); // the text
} // strField

// ---- Time (UTC to the second, the precision RFC 6302 section 2 recommends) --

/** Parse "YYYY-MM-DDTHH:MM:SSZ" to seconds since 1970-01-01T00:00:00Z; throws "time" when malformed. */
export function parseUtc(text: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/.exec(text.trim()); // the one accepted form
  if (!m) throw new CgnPortBlocksError("time", `"${text}" is not a UTC timestamp such as 2026-10-19T14:32:52Z`); // malformed
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number); // the fields
  const ms = Date.UTC(y, mo - 1, d, h, mi, s); // pure arithmetic: Date.UTC reads no clock
  const back = new Date(ms); // to check the fields did not roll over (e.g. 31 February)
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d || h > 23 || mi > 59 || s > 59) {
    throw new CgnPortBlocksError("time", `"${text}" is not a real date and time`); // rolled over
  } // checked
  return ms / 1000; // seconds
} // parseUtc

/** Format seconds since the epoch in the C asctime layout of RFC 7422 section 3's example, "Wed Oct 11 14:32:52 2000". */
function asctime(seconds: number): string {
  const d = new Date(seconds * 1000); // pure: built from the given value
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // day names
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; // month names
  const two = (n: number) => String(n).padStart(2, "0"); // zero-pad to two digits
  const day = String(d.getUTCDate()).padStart(2, " "); // asctime pads the day with a space
  return `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${day} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())} ${d.getUTCFullYear()}`; // the layout
} // asctime

// ============================================================================
// MODE 1: port blocks (RFC 7768 section 2, RFC 6888 REQ-2 and REQ-4)
// ============================================================================

/** The request for the blocks mode. */
export interface BlocksInput {
  pool: string; // a prefix, a range, one address, or a count of addresses
  portRange?: string; // the usable ports, "first-last"; default 1024-65535
  blockSize: number; // ports per block
  blocksPerSubscriber?: number; // blocks one subscriber may hold (the REQ-4 limit); default 1
  subscribers?: number; // how many subscribers share the pool
  inside?: string; // or the inside prefix or range they are numbered from
  logFormat?: "nat444" | "ds-lite"; // which RFC 7422 message size to use; default nat444
} // BlocksInput

/** The answer of the blocks mode. */
export interface BlocksResult {
  mode: "blocks"; // which mode answered
  pool: { input: string; addresses: number; first: string | null; last: string | null }; // the public pool
  portRange: { first: number; last: number; ports: number; systemPortsExcluded: boolean }; // the usable ports of each address
  blockSize: number; // ports per block
  blocksPerSubscriber: number; // blocks one subscriber may hold
  portsPerSubscriber: number; // blockSize x blocksPerSubscriber: the per-subscriber limit
  blocksPerAddress: number; // whole blocks in one address's usable range
  leftoverPortsPerAddress: number; // usable ports no whole block covers
  subscribersPerAddress: number; // subscribers per address when each holds its full share
  leftoverBlocksPerAddress: number; // blocks left over on each address after those subscribers
  poolSubscribers: number; // subscribersPerAddress x addresses
  poolPorts: number; // usable ports across the pool
  demand: { subscribers: number; source: "count" | "inside"; addressesNeeded: number; fits: boolean; spare: number } | null; // when a subscriber count or inside set is given
  log: {
    format: "nat444" | "ds-lite"; // the message size used
    messageBytes: number; // 150 or 175 (RFC 7422 section 1)
    connectionsPerSubscriberDay: number; // 33,000 (RFC 7422 section 1)
    perSessionLinesPerSubscriberDay: number; // one line per connection
    perSessionBytesPerSubscriberDay: number; // lines x message size
    reductionFactor: number; // the block size (RFC 7768 section 2)
    blockLinesPerSubscriberDay: number; // per-session lines / block size, two decimals
    blockBytesPerSubscriberDay: number; // per-session bytes / block size, two decimals
    perSessionBytesPerDayAll: number | null; // for the whole subscriber count, when known
    blockBytesPerDayAll: number | null; // the same with blocks, two decimals
  }; // the log arithmetic
} // BlocksResult

/** Compute the blocks mode. */
export function computeBlocks(input: BlocksInput): BlocksResult {
  const pool = parseAddressSet(input.pool, "outside", true); // the public pool
  const range = parsePortRange(input.portRange ?? DEFAULT_PORT_RANGE); // the usable ports
  const ports = range.last - range.first + 1; // usable ports per address
  const blockSize = input.blockSize; // ports per block
  if (!Number.isInteger(blockSize) || blockSize < 1 || blockSize > ports) throw new CgnPortBlocksError("block-size", `the block size must be 1 to ${ports}, the usable ports of one address`); // bounded
  const perSub = input.blocksPerSubscriber ?? 1; // blocks per subscriber
  const blocksPerAddress = Math.floor(ports / blockSize); // whole blocks per address
  // RFC 6888 REQ-2: one external address per subscriber, so all of a subscriber's blocks sit on one address.
  if (!Number.isInteger(perSub) || perSub < 1 || perSub > blocksPerAddress) throw new CgnPortBlocksError("blocks-per-subscriber", `a subscriber's ${perSub} blocks must fit on one address, which holds ${blocksPerAddress}`); // bounded
  const subscribersPerAddress = Math.floor(blocksPerAddress / perSub); // subscribers per address at full share
  // The demand side: a subscriber count, or an inside set counted like RFC 7422 counts its /28.
  let demand: BlocksResult["demand"] = null; // none unless given
  let subscribers: number | null = null; // the subscriber count, when known
  if (input.subscribers !== undefined) { // a count was given
    if (!Number.isInteger(input.subscribers) || input.subscribers < 1 || input.subscribers > MAX_SUBSCRIBERS) throw new CgnPortBlocksError("subscribers", `the subscriber count must be 1 to ${MAX_SUBSCRIBERS}`); // bounded
    subscribers = input.subscribers; // taken as given
  } else if (input.inside !== undefined) { // an inside set was given
    subscribers = parseAddressSet(input.inside, "inside", false).count; // its host addresses
  } // demand read
  if (subscribers !== null) { // a demand to compare with the pool
    const addressesNeeded = Math.ceil(subscribers / subscribersPerAddress); // addresses the demand needs
    const capacity = pool.count * subscribersPerAddress; // what the pool holds
    demand = { subscribers, source: input.subscribers !== undefined ? "count" : "inside", addressesNeeded, fits: addressesNeeded <= pool.count, spare: capacity - subscribers }; // the comparison
  } // demand
  const format = input.logFormat ?? "nat444"; // the message size to use
  const messageBytes = format === "ds-lite" ? LOG_BYTES_DSLITE : LOG_BYTES_NAT444; // 175 or 150
  const perSessionBytes = CONNECTIONS_PER_DAY * messageBytes; // 4,950,000 for NAT444
  return {
    mode: "blocks", // which mode answered
    pool: { input: pool.input, addresses: pool.count, first: pool.first === null ? null : formatIpv4(pool.first), last: pool.last === null ? null : formatIpv4(pool.last) }, // the pool
    portRange: { first: range.first, last: range.last, ports, systemPortsExcluded: range.first > SYSTEM_PORTS_LAST }, // the ports
    blockSize, // as given
    blocksPerSubscriber: perSub, // as given or 1
    portsPerSubscriber: blockSize * perSub, // the REQ-4 limit
    blocksPerAddress, // whole blocks
    leftoverPortsPerAddress: ports - blocksPerAddress * blockSize, // ports no block covers
    subscribersPerAddress, // at full share
    leftoverBlocksPerAddress: blocksPerAddress - subscribersPerAddress * perSub, // blocks left over
    poolSubscribers: pool.count * subscribersPerAddress, // the pool's capacity
    poolPorts: pool.count * ports, // the pool's usable ports
    demand, // the comparison, or null
    log: {
      format, // the message size used
      messageBytes, // 150 or 175
      connectionsPerSubscriberDay: CONNECTIONS_PER_DAY, // 33,000
      perSessionLinesPerSubscriberDay: CONNECTIONS_PER_DAY, // one line per connection
      perSessionBytesPerSubscriberDay: perSessionBytes, // lines x bytes
      reductionFactor: blockSize, // RFC 7768 section 2: "a factor equal to the block size"
      blockLinesPerSubscriberDay: round2(CONNECTIONS_PER_DAY / blockSize), // divided by that factor
      blockBytesPerSubscriberDay: round2(perSessionBytes / blockSize), // the same in bytes
      perSessionBytesPerDayAll: subscribers === null ? null : subscribers * perSessionBytes, // all subscribers
      blockBytesPerDayAll: subscribers === null ? null : round2((subscribers * perSessionBytes) / blockSize), // all subscribers, blocks
    }, // log
  }; // the result
} // computeBlocks

// ============================================================================
// MODE 2: deterministic mapping (RFC 7422 section 2, algorithm 0, Sequential)
// ============================================================================

/** The request for the deterministic mode. */
export interface DeterministicInput {
  inside: string; // the inside range I: a prefix (host addresses) or a range
  outside: string; // the outside range O: a prefix, a range or one address
  reserved?: string; // the reserved port list R; default 0-1023
  compressionRatio?: number; // C; default ceil(I / O)
  dynamicFactor?: number; // D; default 0
  maxPorts?: number; // M, the maximum ports per user
  lookup?: string; // forward: an inside address
  reverse?: { address: string; port: number; time?: string }; // reverse: outside address, port and time
  configFrom?: string; // when this configuration took effect (UTC)
  configUntil?: string; // when it stopped (UTC)
  recordTime?: string; // the timestamp for the section 3 configuration record (UTC)
} // DeterministicInput

/** One row of the deterministic table. */
export interface DeterministicRow {
  inside: string; // the inside address
  outside: string; // the outside address it maps to
  ranges: PortRange[]; // its port range (split only where a reserved port intervenes)
  ports: number; // how many ports
} // DeterministicRow

/** The answer of the deterministic mode. */
export interface DeterministicResult {
  mode: "deterministic"; // which mode answered
  algorithm: { id: 0; name: "sequential" }; // RFC 7422 section 2, A = 0
  inside: { input: string; addresses: number; first: string; last: string }; // I
  outside: { input: string; addresses: number; first: string; last: string }; // O
  reserved: { list: string; ports: number; systemPortsReserved: boolean }; // R
  candidatePorts: number; // ports left on each outside address after R
  compressionRatio: number; // C
  dynamicFactor: number; // D
  totalRatio: number; // C + D
  portsPerSubscriber: number; // floor(candidates / (C + D)): the pre-allocated block
  dynamicPoolPorts: number; // candidates - C x block, on each outside address
  dynamicRanges: PortRange[]; // where the dynamic pool sits on each outside address
  unusedSlots: number; // C x O - I: blocks no inside address holds
  maxPorts: number | null; // M
  overflowPortsPerUser: number | null; // M - block, when M exceeds the block
  overflowUsersAtOnce: number | null; // dynamic pool / overflow: users that can take their full overflow at once
  maxBelowBlock: boolean; // true when M is smaller than the pre-allocated block
  dynamicDisabledButLeftover: boolean; // D = 0 yet the division left ports over
  translationLogging: "none" | "dynamic-blocks-only"; // what must be logged besides the configuration record
  table: { rows: DeterministicRow[]; reservedRanges: PortRange[] } | null; // the full table, up to TABLE_LIMIT inside addresses
  forward: { inside: string; status: "mapped" | "not-inside"; outside: string | null; ranges: PortRange[]; ports: number } | null; // the forward lookup
  reverse: {
    address: string; // the outside address asked about
    port: number; // the port asked about
    time: string | null; // the timestamp, as given
    status: "deterministic" | "dynamic" | "reserved" | "unassigned" | "not-in-pool"; // what the port is
    inside: string | null; // the inside address, for a deterministic port
    blockRanges: PortRange[]; // the block the port belongs to
    timeInWindow: boolean | null; // whether the time falls inside the configuration window (null when not checkable)
  } | null; // the reverse lookup
  configRecordBody: string | null; // RFC 7422 section 3 fields after the timestamp, when I and O are prefixes and M is known
  configRecord: string | null; // the whole record, when recordTime is given too
  configRecordMissing: string[]; // what prevents the record, if anything
} // DeterministicResult

/** Compute the deterministic mode. */
export function computeDeterministic(input: DeterministicInput): DeterministicResult {
  const inside = parseAddressSet(input.inside, "inside", false); // I
  const outside = parseAddressSet(input.outside, "outside", false); // O
  const I = inside.count; // inside addresses
  const O = outside.count; // outside addresses
  const reservedMap = parseReserved(input.reserved ?? DEFAULT_RESERVED); // R as a map
  const candidates = candidateRanges(reservedMap); // the port candidate list (step 1)
  const N = portsIn(candidates); // its size
  const C = input.compressionRatio ?? Math.ceil(I / O); // the compression ratio: inside / outside by default
  if (!Number.isInteger(C) || C < 1) throw new CgnPortBlocksError("ratio", "the compression ratio C must be a whole number of at least 1"); // invalid
  if (C * O < I) throw new CgnPortBlocksError("ratio", `C = ${C} gives ${C * O} blocks across ${O} outside address(es), fewer than the ${I} inside addresses`); // cannot hold every inside address
  const D = input.dynamicFactor ?? 0; // the dynamic address pool factor
  if (!Number.isInteger(D) || D < 0) throw new CgnPortBlocksError("ratio", "the dynamic factor D must be a whole number of at least 0"); // invalid
  const total = C + D; // step 2: the total compression ratio
  const P = Math.floor(N / total); // step 2: 1/(C + D) of the available ports per inside address
  if (P < 1) throw new CgnPortBlocksError("no-ports", `C + D = ${total} is larger than the ${N} candidate ports`); // nothing to give
  const dynamicPoolPorts = N - C * P; // step 2: "Any remaining ports are allocated to the dynamic pool"
  const dynamicRanges = dynamicPoolPorts > 0 ? spanToRanges(candidates, C * P, N - 1) : []; // where they sit
  // M, the maximum ports per user, and the overflow it allows from the dynamic pool (step 4).
  const M = input.maxPorts ?? null; // optional
  if (M !== null && (!Number.isInteger(M) || M < 1 || M > PORT_SPACE)) throw new CgnPortBlocksError("max-ports", `M must be 1 to ${PORT_SPACE}`); // bounded
  const overflow = M !== null && M > P ? M - P : null; // ports beyond the block
  // The block of the inside address at index i: outside address floor(i / C), slot i mod C (Sequential).
  const blockOf = (i: number): { outside: number; ranges: PortRange[] } => {
    const slot = i % C; // the slot on its outside address
    return { outside: (outside.first as number) + Math.floor(i / C), ranges: spanToRanges(candidates, slot * P, slot * P + P - 1) }; // address and ports
  }; // blockOf
  // The table, for plans small enough to print.
  let table: DeterministicResult["table"] = null; // none for large plans
  if (I <= TABLE_LIMIT) { // small enough
    const rows: DeterministicRow[] = []; // one row per inside address
    for (let i = 0; i < I; i++) { // each inside address
      const b = blockOf(i); // its block
      rows.push({ inside: formatIpv4((inside.first as number) + i), outside: formatIpv4(b.outside), ranges: b.ranges, ports: portsIn(b.ranges) }); // the row
    } // rows
    const reservedRanges = candidateRanges(reservedMap.map((v) => 1 - v)); // the reserved ports as ranges
    table = { rows, reservedRanges }; // the table
  } // table
  // The configuration window, for the reverse lookup's time check.
  const from = input.configFrom !== undefined ? parseUtc(input.configFrom) : null; // when the configuration took effect
  const until = input.configUntil !== undefined ? parseUtc(input.configUntil) : null; // when it stopped
  if (from !== null && until !== null && until < from) throw new CgnPortBlocksError("window", "the configuration window ends before it starts"); // backwards
  // Forward: inside address to outside address and port range (function 1).
  let forward: DeterministicResult["forward"] = null; // none unless asked
  if (input.lookup !== undefined) { // asked
    const addr = parseIpv4(input.lookup); // the inside address
    if (addr === null) throw new CgnPortBlocksError("address", `"${input.lookup}" is not an IPv4 address`); // malformed
    const i = addr - (inside.first as number); // its index in I
    if (i < 0 || i >= I) forward = { inside: formatIpv4(addr), status: "not-inside", outside: null, ranges: [], ports: 0 }; // outside I
    else { const b = blockOf(i); forward = { inside: formatIpv4(addr), status: "mapped", outside: formatIpv4(b.outside), ranges: b.ranges, ports: portsIn(b.ranges) }; } // mapped
  } // forward
  // Reverse: outside address, port and time to the inside address (function 2).
  let reverse: DeterministicResult["reverse"] = null; // none unless asked
  if (input.reverse !== undefined) { // asked
    const addr = parseIpv4(input.reverse.address); // the outside address
    if (addr === null) throw new CgnPortBlocksError("address", `"${input.reverse.address}" is not an IPv4 address`); // malformed
    const port = input.reverse.port; // the port
    if (!Number.isInteger(port) || port < 0 || port > PORT_MAX) throw new CgnPortBlocksError("port", `the port must be 0 to ${PORT_MAX}`); // bounded
    const time = input.reverse.time ?? null; // the timestamp, optional
    const t = time === null ? null : parseUtc(time); // validated
    const timeInWindow = t === null || (from === null && until === null) ? null : (from === null || t >= from) && (until === null || t <= until); // inside the window?
    const o = addr - (outside.first as number); // its index in O
    const base = { address: formatIpv4(addr), port, time, timeInWindow }; // common fields
    if (o < 0 || o >= O) reverse = { ...base, status: "not-in-pool", inside: null, blockRanges: [] }; // not one of ours
    else { // one of the outside addresses
      const pos = positionOf(candidates, port); // its candidate position
      if (pos === -1) reverse = { ...base, status: "reserved", inside: null, blockRanges: [] }; // in R
      else if (pos >= C * P) reverse = { ...base, status: "dynamic", inside: null, blockRanges: dynamicRanges }; // the dynamic pool: the log decides
      else { // a pre-allocated block
        const slot = Math.floor(pos / P); // which block
        const i = o * C + slot; // which inside address
        const ranges = spanToRanges(candidates, slot * P, slot * P + P - 1); // the block's ports
        reverse = i < I ? { ...base, status: "deterministic", inside: formatIpv4((inside.first as number) + i), blockRanges: ranges } : { ...base, status: "unassigned", inside: null, blockRanges: ranges }; // held or not
      } // block
    } // ours
  } // reverse
  // The RFC 7422 section 3 configuration record: timestamp, I, mask, O, mask, D, M, A, R.
  const missing: string[] = []; // what prevents it
  if (inside.prefix === null) missing.push("inside-prefix"); // a range has no mask
  if (outside.prefix === null) missing.push("outside-prefix"); // the same for O
  if (M === null) missing.push("maxPorts"); // M is a required field of the record
  const configRecordBody = missing.length === 0 ? `${formatIpv4(inside.prefix!.network)}:${inside.prefix!.length}:${formatIpv4(outside.prefix!.network)}:${outside.prefix!.length}:${D}:${M}:0:${reservedText(reservedMap)}` : null; // the fields
  const configRecord = configRecordBody !== null && input.recordTime !== undefined ? `[${asctime(parseUtc(input.recordTime))}]:${configRecordBody}` : null; // with its timestamp
  // System Ports: RFC 7422 step 1 says the CGN SHOULD at least remove them.
  let systemPortsReserved = true; // assume so until a candidate is found among them
  for (let p = 0; p <= SYSTEM_PORTS_LAST; p++) if (reservedMap[p] === 0) { systemPortsReserved = false; break; } // a System Port left as a candidate
  return {
    mode: "deterministic", // which mode answered
    algorithm: { id: 0, name: "sequential" }, // A = 0
    inside: { input: inside.input, addresses: I, first: formatIpv4(inside.first as number), last: formatIpv4(inside.last as number) }, // I
    outside: { input: outside.input, addresses: O, first: formatIpv4(outside.first as number), last: formatIpv4(outside.last as number) }, // O
    reserved: { list: reservedText(reservedMap), ports: PORT_SPACE - N, systemPortsReserved }, // R
    candidatePorts: N, // after R
    compressionRatio: C, // C
    dynamicFactor: D, // D
    totalRatio: total, // C + D
    portsPerSubscriber: P, // the block
    dynamicPoolPorts, // per outside address
    dynamicRanges, // where
    unusedSlots: C * O - I, // blocks nobody holds
    maxPorts: M, // M
    overflowPortsPerUser: overflow, // M - block
    overflowUsersAtOnce: overflow === null ? null : Math.floor(dynamicPoolPorts / overflow), // full overflows at once
    maxBelowBlock: M !== null && M < P, // M smaller than the block
    dynamicDisabledButLeftover: D === 0 && dynamicPoolPorts > 0, // the remainder of the division
    translationLogging: D === 0 ? "none" : "dynamic-blocks-only", // step 2 note and step 4
    table, // or null
    forward, // or null
    reverse, // or null
    configRecordBody, // or null
    configRecord, // or null
    configRecordMissing: missing, // empty when the record is complete
  }; // the result
} // computeDeterministic

// ============================================================================
// MODE 3: MAP port sets (RFC 7597 section 5.1 and Appendix B; RFC 7599 section 5)
// ============================================================================

/** The request for the MAP mode. */
export interface MapInput {
  offset: number; // a, the PSID offset (6 by default in RFC 7597)
  psidLength: number; // k, the PSID length
  psid?: number; // the PSID whose port set is wanted
  port?: number; // a port whose PSID is wanted
} // MapInput

/** The answer of the MAP mode. */
export interface MapResult {
  mode: "map"; // which mode answered
  a: number; // offset bits
  k: number; // PSID bits
  m: number; // 16 - a - k: bits of j
  sharingRatio: number; // 2^k
  contiguousPorts: number; // 2^m, the length of each range
  interval: number; // 2^(16 - a), the distance between range starts
  portsPerSet: number; // 2^(16 - k) - 2^m when a > 0; 2^(16 - k) when a = 0
  excludedLow: PortRange | null; // the A = 0 block every CE gives up when a > 0
  systemPortsExcluded: boolean; // whether 0 to 1023 lie in that excluded block
  minPsidAvoidingSystemPorts: number | null; // a = 0 only: ceil(1024 / 2^m) (Appendix B.1)
  portSet: {
    psid: number; // the PSID
    psidHex: string; // the PSID in hexadecimal, as RFC 7597's examples print it
    rangeCount: number; // how many ranges
    ranges: PortRange[]; // the ranges, up to RANGE_LIMIT
    rangesTruncated: boolean; // true when more ranges exist than are listed
    firstRange: PortRange; // the first range
    lastRange: PortRange; // the last range
    includesSystemPorts: boolean; // whether any port of the set is 0 to 1023
    excludedForPsid: PortRange | null; // this PSID's range in the excluded A = 0 block (a > 0)
  } | null; // the forward answer
  reverse: { port: number; excluded: boolean; psid: number | null; psidHex: string | null; aValue: number; j: number } | null; // the reverse answer
} // MapResult

/** Hexadecimal with the 0x prefix, two digits at least. */
function hex(n: number): string {
  return "0x" + n.toString(16).padStart(2, "0"); // 52 -> "0x34"
} // hex

/** Compute the MAP mode. */
export function computeMap(input: MapInput): MapResult {
  const a = input.offset; // offset bits
  const k = input.psidLength; // PSID bits
  if (!Number.isInteger(a) || !Number.isInteger(k) || a < 0 || k < 0 || a > 16 || k > 16 || a + k > 16) throw new CgnPortBlocksError("map-bits", "a and k must be whole numbers with a + k at most 16 (the port is 16 bits)"); // the field layout
  const m = 16 - a - k; // bits of j
  const M = 2 ** m; // contiguous ports per range
  const interval = 2 ** (16 - a); // distance between ranges (section 5.1)
  const firstA = a > 0 ? 1 : 0; // section 5.1: "For 'a' > 0, A MUST be larger than 0"
  const rangeCount = 2 ** a - firstA; // A runs from firstA to 2^a - 1
  const portsPerSet = a > 0 ? 2 ** (16 - k) - M : 2 ** (16 - k); // section 5.1's formula; with a = 0 the one block is whole (Appendix B.1)
  // The forward answer: the ranges of one PSID.
  let portSet: MapResult["portSet"] = null; // none unless a PSID is given
  if (input.psid !== undefined) { // a PSID was given
    const psid = input.psid; // the PSID
    if (!Number.isInteger(psid) || psid < 0 || psid >= 2 ** k) throw new CgnPortBlocksError("psid", `with k = ${k} the PSID must be 0 to ${2 ** k - 1}`); // bounded
    const startOf = (A: number) => A * interval + psid * M; // the first port of range A: A | PSID | 0
    const ranges: PortRange[] = []; // up to RANGE_LIMIT ranges
    for (let A = firstA; A < 2 ** a && ranges.length < RANGE_LIMIT; A++) ranges.push({ first: startOf(A), last: startOf(A) + M - 1 }); // each range
    const lastA = 2 ** a - 1; // the last A
    portSet = {
      psid, // as given
      psidHex: hex(psid), // e.g. 0x34
      rangeCount, // how many
      ranges, // listed
      rangesTruncated: rangeCount > ranges.length, // capped?
      firstRange: { first: startOf(firstA), last: startOf(firstA) + M - 1 }, // the first
      lastRange: { first: startOf(lastA), last: startOf(lastA) + M - 1 }, // the last
      includesSystemPorts: startOf(firstA) <= SYSTEM_PORTS_LAST, // the lowest port is the first range's start
      excludedForPsid: a > 0 ? { first: psid * M, last: psid * M + M - 1 } : null, // its range inside A = 0
    }; // the set
  } // forward
  // The reverse answer: the PSID that owns a port (Appendix B formula (2), a bitmask when R and M are powers of 2).
  let reverse: MapResult["reverse"] = null; // none unless a port is given
  if (input.port !== undefined) { // a port was given
    const port = input.port; // the port
    if (!Number.isInteger(port) || port < 0 || port > PORT_MAX) throw new CgnPortBlocksError("port", `the port must be 0 to ${PORT_MAX}`); // bounded
    const aValue = Math.floor(port / interval); // the A field
    const j = port % M; // the j field
    const owner = Math.floor(port / M) % 2 ** k; // the PSID field: trunc((P mod (R x M)) / M)
    const excluded = a > 0 && aValue === 0; // the A = 0 block belongs to no CE
    reverse = { port, excluded, psid: excluded ? null : owner, psidHex: excluded ? null : hex(owner), aValue, j }; // the answer
  } // reverse
  return {
    mode: "map", // which mode answered
    a, // offset
    k, // PSID length
    m, // j length
    sharingRatio: 2 ** k, // section 5.1: "The sharing ratio is 2^k"
    contiguousPorts: M, // 2^m
    interval, // 2^(16 - a)
    portsPerSet, // per CE
    excludedLow: a > 0 ? { first: 0, last: interval - 1 } : null, // A = 0
    systemPortsExcluded: a > 0 && interval - 1 >= SYSTEM_PORTS_LAST, // a <= 6 excludes all of 0 to 1023
    minPsidAvoidingSystemPorts: a === 0 ? Math.ceil((SYSTEM_PORTS_LAST + 1) / M) : null, // Appendix B.1 with N = 1024
    portSet, // or null
    reverse, // or null
  }; // the result
} // computeMap

// ============================================================================
// THE API ENTRY POINT: one JSON object naming its mode
// ============================================================================

/** Whatever run() returns, by mode. */
export type CgnResult = BlocksResult | DeterministicResult | MapResult;

/** Read a PSID given as a number, a decimal string or a 0x hexadecimal string. */
function psidField(body: Record<string, unknown>): number | undefined {
  const raw = body.psid; // the field
  if (raw === undefined || raw === null || raw === "") return undefined; // absent
  if (typeof raw === "number") return raw; // a JSON number (checked by computeMap)
  if (typeof raw === "string" && /^0x[0-9a-fA-F]{1,4}$/.test(raw.trim())) return parseInt(raw.trim().slice(2), 16); // hexadecimal
  if (typeof raw === "string" && /^\d{1,5}$/.test(raw.trim())) return Number(raw.trim()); // decimal
  throw new CgnPortBlocksError("psid", `"psid" must be a number such as 52 or 0x34`); // anything else
} // psidField

/**
 * run - the string-in entry point the API registry calls: a JSON object whose "mode" is "blocks", "deterministic"
 * or "map", with that mode's fields. Pure; throws CgnPortBlocksError with a stable code on any malformed request.
 * @param raw the request body as text
 */
export function run(raw: string): CgnResult {
  let body: unknown; // the parsed request
  try {
    body = JSON.parse(raw); // parse the request
  } catch {
    throw new CgnPortBlocksError("json", 'the request must be a JSON object such as {"mode":"map","offset":6,"psidLength":8,"psid":52}'); // named, not leaked
  } // parsed
  if (body === null || typeof body !== "object" || Array.isArray(body)) throw new CgnPortBlocksError("json", "the request must be a JSON object"); // not an object
  const b = body as Record<string, unknown>; // the request object
  // Blocks: { pool, portRange?, blockSize, blocksPerSubscriber?, subscribers? | inside?, logFormat? }.
  if (b.mode === "blocks") {
    const logFormat = b.logFormat === undefined ? undefined : b.logFormat === "nat444" || b.logFormat === "ds-lite" ? b.logFormat : null; // the message size
    if (logFormat === null) throw new CgnPortBlocksError("field", `"logFormat" must be "nat444" or "ds-lite"`); // invalid
    return computeBlocks({
      pool: strField(b, "pool", true) as string, // required
      portRange: strField(b, "portRange", false), // optional
      blockSize: intField(b, "blockSize", 1, PORT_SPACE, "block-size", true) as number, // required
      blocksPerSubscriber: intField(b, "blocksPerSubscriber", 1, PORT_SPACE, "blocks-per-subscriber", false), // optional
      subscribers: intField(b, "subscribers", 1, MAX_SUBSCRIBERS, "subscribers", false), // optional
      inside: strField(b, "inside", false), // optional
      logFormat, // optional
    }); // computed
  } // blocks
  // Deterministic: { inside, outside, reserved?, compressionRatio?, dynamicFactor?, maxPorts?, lookup?, reverse?, configFrom?, configUntil?, recordTime? }.
  if (b.mode === "deterministic") {
    let reverse: DeterministicInput["reverse"]; // the reverse question, if any
    if (b.reverse !== undefined) { // given
      if (b.reverse === null || typeof b.reverse !== "object" || Array.isArray(b.reverse)) throw new CgnPortBlocksError("field", `"reverse" must be an object { "address", "port", "time" }`); // wrong type
      const r = b.reverse as Record<string, unknown>; // the object
      reverse = { address: strField(r, "address", true) as string, port: intField(r, "port", 0, PORT_MAX, "port", true) as number, time: strField(r, "time", false) }; // its fields
    } // reverse
    return computeDeterministic({
      inside: strField(b, "inside", true) as string, // required
      outside: strField(b, "outside", true) as string, // required
      reserved: strField(b, "reserved", false), // optional
      compressionRatio: intField(b, "compressionRatio", 1, MAX_ADDRESSES, "ratio", false), // optional
      dynamicFactor: intField(b, "dynamicFactor", 0, PORT_SPACE, "ratio", false), // optional
      maxPorts: intField(b, "maxPorts", 1, PORT_SPACE, "max-ports", false), // optional
      lookup: strField(b, "lookup", false), // optional
      reverse, // optional
      configFrom: strField(b, "configFrom", false), // optional
      configUntil: strField(b, "configUntil", false), // optional
      recordTime: strField(b, "recordTime", false), // optional
    }); // computed
  } // deterministic
  // MAP: { offset, psidLength, psid?, port? }.
  if (b.mode === "map") {
    return computeMap({
      offset: intField(b, "offset", 0, 16, "map-bits", true) as number, // required
      psidLength: intField(b, "psidLength", 0, 16, "map-bits", true) as number, // required
      psid: psidField(b), // optional
      port: intField(b, "port", 0, PORT_MAX, "port", false), // optional
    }); // computed
  } // map
  throw new CgnPortBlocksError("mode", `"mode" must be "blocks", "deterministic" or "map"`); // unknown or missing
} // run
