// ============================================================================
// src/lib/tools/cidr/compute.ts
// ----------------------------------------------------------------------------
// CIDR — subnetting compute (arsenal-local, pure, deterministic).
//
// Single-subnet analysis (cidrAnalyze) is now in-house too; arsenal carries no
// runtime dependency on an external engine. This module covers every CIDR mode:
//   • cidrAnalyze      — single-subnet facts (network, mask, hosts, RFC 3021)
//   • allocateVlsm     — variable-length subnets carved from a parent block
//   • aggregate        — summarize a prefix list into the minimal covering set
//   • analyzeOverlapGap — overlaps / containment, and (optionally) gaps in scope
//   • classifySpecialPurpose — which IANA special-purpose (or multicast) range a block falls in or overlaps (2026-10-19)
//
// PURE: only integer arithmetic on uint32. No Date, no Math.random, no I/O,
// no DOM. Same input -> same output in any JS runtime. Written so the logic is
// cleanly liftable into an open library later.
// ============================================================================

const U32 = 0xffffffff;
const MAX_ENTRIES = 1024; // defensive cap on user-pasted list length

/** Thrown for malformed input. `code` is stable for i18n; `message` is dev-facing. */
export class CidrInputError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "CidrInputError";
    this.code = code;
  }
}

// ---- uint32 IPv4 helpers ---------------------------------------------------

/** "A.B.C.D" -> uint32. Throws CidrInputError on malformed input. */
export function ipToInt(ip: string): number {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) throw new CidrInputError("ipv4", `not an IPv4 address: ${ip}`);
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) throw new CidrInputError("ipv4", `not an IPv4 address: ${ip}`);
    const o = Number(p);
    if (o > 255) throw new CidrInputError("octet", `octet out of range in ${ip}: ${o}`);
    n = (n * 256 + o) >>> 0;
  }
  return n >>> 0;
}

/** uint32 -> "A.B.C.D". */
export function intToIp(n: number): string {
  const u = n >>> 0;
  return [(u >>> 24) & 255, (u >>> 16) & 255, (u >>> 8) & 255, u & 255].join(".");
}

/** prefix length 0..32 -> netmask uint32. */
export function maskForPrefix(prefix: number): number {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return U32;
  return (U32 << (32 - prefix)) >>> 0;
}

/** Address count of a prefix (2^(32-prefix)). */
export function prefixSize(prefix: number): number {
  return Math.pow(2, 32 - prefix);
}

export interface ParsedCidr {
  addrInt: number; // the address exactly as typed
  prefix: number; // 0..32
  network: number; // network address (addrInt & mask)
  broadcast: number; // last address in the block
  size: number; // 2^(32-prefix)
}

/** Parse "A.B.C.D/n". Throws CidrInputError if malformed. */
export function parseCidr(s: string): ParsedCidr {
  const trimmed = s.trim();
  const slash = trimmed.indexOf("/");
  if (slash === -1) throw new CidrInputError("format", `expected A.B.C.D/prefix, got: ${s}`);
  const addrPart = trimmed.slice(0, slash);
  const prefixPart = trimmed.slice(slash + 1);
  if (!/^\d{1,2}$/.test(prefixPart)) throw new CidrInputError("prefix", `invalid prefix: /${prefixPart}`);
  const prefix = Number(prefixPart);
  if (prefix < 0 || prefix > 32) throw new CidrInputError("prefix", `prefix out of range (0-32): /${prefix}`);
  const addrInt = ipToInt(addrPart);
  const mask = maskForPrefix(prefix);
  const network = (addrInt & mask) >>> 0;
  const size = prefixSize(prefix);
  const broadcast = (network + size - 1) >>> 0;
  return { addrInt, prefix, network, broadcast, size };
}

/** Parse a newline/comma/space separated list of CIDRs. Blank entries ignored. */
export function parseCidrList(text: string): string[] {
  const tokens = text
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length > MAX_ENTRIES) {
    throw new CidrInputError("tooMany", `too many entries (max ${MAX_ENTRIES})`);
  }
  return tokens;
}

// ---- single-subnet analysis ------------------------------------------------
// Brought in-house (previously an external dependency) so arsenal carries
// no runtime dependency on an outside engine. The arithmetic is identical — same uint32
// math, same RFC 3021 handling of /31 and /32 — but errors are CidrInputError
// (stable codes for i18n), so subnet mode now reports the same specific errors
// the VLSM and overlap modes already do, instead of a single generic message.

/** The single-subnet facts surfaced by the Subnet mode. */
export interface SubnetAnalysis {
  input: string;
  network: string;
  broadcast: string;
  netmask: string;
  wildcard: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
}

/**
 * Analyze a single "A.B.C.D/prefix" block. Pure; throws CidrInputError on
 * malformed input. /31 and /32 follow RFC 3021: every address is usable.
 */
export function cidrAnalyze(input: string): SubnetAnalysis {
  const { prefix, network, broadcast, size } = parseCidr(input);
  const mask = maskForPrefix(prefix);
  const wildcard = ~mask >>> 0;

  let firstHost: number;
  let lastHost: number;
  let usableHosts: number;
  if (prefix >= 31) {
    // RFC 3021: a /31 is a point-to-point link with two usable addresses;
    // a /32 is a single host. In both, there is no network/broadcast to reserve.
    firstHost = network;
    lastHost = broadcast;
    usableHosts = size;
  } else {
    firstHost = (network + 1) >>> 0;
    lastHost = (broadcast - 1) >>> 0;
    usableHosts = size - 2;
  }

  return {
    input: input.trim(),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    netmask: intToIp(mask),
    wildcard: intToIp(wildcard),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    totalAddresses: size,
    usableHosts,
  };
}

// ---- VLSM ------------------------------------------------------------------

export interface VlsmRequirement {
  label?: string;
  hosts: number; // usable hosts needed: a whole number, 1 or more (0 is rejected since 2026-10-19, see allocateVlsm)
}

/** Options for allocateVlsm (added 2026-10-19, PRIME's decision 2 of 14:2x). */
export interface VlsmOptions {
  /** When true, a request for exactly 2 hosts gets a /31 (RFC 3021 section 2.1: on a point-to-point link with a
   *  31-bit mask both addresses "MUST be interpreted as host addresses"). Default false keeps the /30. */
  pointToPoint31?: boolean;
}

export interface VlsmSubnet {
  label: string;
  requestedHosts: number;
  prefix: number;
  network: string;
  netmask: string;
  firstHost: string;
  lastHost: string;
  broadcast: string;
  usableHosts: number;
  size: number; // total addresses in this block
  pointToPoint31: boolean; // true when this block is a /31 given under the RFC 3021 option (no network, no broadcast)
}

export interface VlsmResult {
  parent: string; // normalized parent CIDR
  parentInput: string; // the parent exactly as typed (trimmed), so a masked parent can be shown beside its network
  parentMasked: boolean; // true when the typed parent had host bits set and was masked to `parent` (2026-10-19)
  parentNetwork: string;
  parentPrefix: number;
  parentSize: number;
  subnets: VlsmSubnet[]; // allocated, in allocation order (largest block first)
  unallocated: VlsmRequirement[]; // requirements that did not fit
  usedAddresses: number;
  freeAddresses: number;
  freeBlocks: CidrBlock[]; // the free space left in the parent, as aligned CIDR blocks in address order (2026-10-19)
  placement: "largest-first"; // how the requests were ordered before placement, stated in the result (2026-10-19)
  utilizationPct: number; // used / parentSize * 100, 1 decimal
}

/**
 * Smallest prefix whose block holds `hosts` usable addresses (network+broadcast convention), or -1 when no IPv4
 * block can (more than 2^32 - 2 hosts). Before 2026-10-19 the loop stopped at /0 and returned it even when a /0
 * was too small, so a 5,000,000,000-host request inside 0.0.0.0/0 was "allocated"; -1 now reports it as unfit.
 */
function prefixForHosts(hosts: number): number {
  const needed = hosts + 2; // +2 for the network and broadcast addresses (hosts is at least 1, checked by the caller)
  if (needed > prefixSize(0)) return -1; // more than a /0 holds: nothing in IPv4 fits
  let prefix = 32; // start from the smallest block
  while (prefixSize(prefix) < needed && prefix > 0) prefix--; // widen until the block holds `needed` addresses
  return prefix; // the smallest prefix that fits
}

/** The prefix one requirement is given: a /31 for a 2-host request when the RFC 3021 option is on, else hosts + 2. */
function prefixForRequirement(hosts: number, options: VlsmOptions): number {
  if (options.pointToPoint31 === true && hosts === 2) return 31; // RFC 3021 section 2.1: both addresses are hosts
  return prefixForHosts(hosts); // the network-and-broadcast convention
}

function ceilToMultiple(n: number, multiple: number): number {
  if (multiple <= 0) return n;
  const r = n % multiple;
  return r === 0 ? n : n + (multiple - r);
}

/**
 * Carve variable-length subnets for `requirements` out of `parentCidr`, largest block first. `options.pointToPoint31`
 * (default false) gives a 2-host request a /31 under RFC 3021. Throws CidrInputError for a malformed parent, a list
 * over MAX_ENTRIES, a 0-host request ("zeroHosts") or a host count that is not a whole number ("hosts").
 */
export function allocateVlsm(parentCidr: string, requirements: VlsmRequirement[], options: VlsmOptions = {}): VlsmResult {
  // A defensive cap on the list length, as in every mode.
  if (requirements.length > MAX_ENTRIES) {
    throw new CidrInputError("tooMany", `too many requirements (max ${MAX_ENTRIES})`); // refused with its own code
  } // end of the cap
  // Every request must be a whole number of hosts, 1 or more (2026-10-19). A 0-host request used to receive a /31
  // shown as "2 usable", which answered a question nobody asked; it is now refused with its own code and message.
  for (const r of requirements) { // each request, in the order entered
    // Zero hosts: refused by name, so the UI can say exactly what is wrong.
    if (r.hosts === 0) throw new CidrInputError("zeroHosts", `a requirement${r.label ? ` (${r.label})` : ""} asks for 0 hosts`);
    // Negative, fractional or non-numeric counts (only reachable through the API, the UI accepts digits only).
    if (!Number.isInteger(r.hosts) || r.hosts < 0) throw new CidrInputError("hosts", `invalid host count: ${String(r.hosts)}`);
  } // every request checked
  const parent = parseCidr(parentCidr); // the parent block, host bits masked (parentMasked below says so)
  // Each requirement's prefix, decided once (the /31 option changes only exactly-2-host requests).
  const indexed = requirements.map((r, i) => ({ r, i, prefix: prefixForRequirement(r.hosts, options) }));
  // Largest block first keeps allocations aligned and leaves no holes between them. The key is the block size
  // (a smaller prefix is a larger block), then the host count, then the entry order, so with the /31 option off
  // the order is exactly the old hosts-descending order, and with it on a /31 never precedes a 1-host /30.
  // A request no IPv4 block can hold (prefix -1) sorts first and is reported as unfit at once.
  indexed.sort((a, b) => a.prefix - b.prefix || b.r.hosts - a.r.hosts || a.i - b.i);

  const parentStart = parent.network; // first address of the parent
  const parentEnd = (parent.network + parent.size - 1) >>> 0; // inclusive
  let cursor = parentStart; // the next unallocated address (Number: may reach 2^32 at the top)

  const subnets: VlsmSubnet[] = []; // the allocated blocks, in placement order
  const unallocated: VlsmRequirement[] = []; // the requests that did not fit
  const allocatedRanges: Range[] = []; // the allocated blocks as ranges, for the free-block list (2026-10-19)
  let used = 0; // addresses allocated so far

  for (const { r, prefix } of indexed) { // place each request, largest block first
    // No IPv4 block is large enough: unfit, without touching the cursor.
    if (prefix < 0) { // more hosts than any IPv4 block holds
      unallocated.push(r); // listed under "Did not fit"
      continue; // next requirement
    } // a real prefix: try to place it
    const size = prefixSize(prefix); // addresses in this block
    const start = ceilToMultiple(cursor, size); // align to this block's boundary
    const end = start + size - 1; // last address of the block (inclusive)
    if (start < parentStart || end > parentEnd) { // the aligned block would leave the parent
      unallocated.push(r); // so the request did not fit
      continue; // next requirement
    } // the block fits
    const network = start >>> 0; // network address as uint32
    const broadcast = end >>> 0; // last address as uint32 (a host, not a broadcast, on a /31)
    const usableHosts = prefix >= 31 ? size : size - 2; // RFC 3021: a /31 reserves nothing
    const firstHost = prefix >= 31 ? network : (network + 1) >>> 0; // first assignable address
    const lastHost = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0; // last assignable address
    subnets.push({ // the allocated block
      label: r.label ?? "", // the request's name, or empty
      requestedHosts: r.hosts, // what was asked for
      prefix, // the prefix given
      network: intToIp(network), // dotted network address
      netmask: intToIp(maskForPrefix(prefix)), // dotted mask
      firstHost: intToIp(firstHost), // dotted first host
      lastHost: intToIp(lastHost), // dotted last host
      broadcast: intToIp(broadcast), // dotted last address
      usableHosts, // assignable addresses
      size, // total addresses
      pointToPoint31: prefix === 31, // only the RFC 3021 option produces a /31 (hosts + 2 never rounds to 2)
    }); // end of the allocated block
    allocatedRanges.push({ start: network, end: broadcast }); // remembered for the free-block list
    used += size; // count it as used
    cursor = end + 1; // Number (may reach 2^32 at the very top; bounds check catches next)
  } // every request placed or listed as unfit

  const free = parent.size - used; // free addresses, the count shown since the mode shipped
  // The free space as CIDR blocks (2026-10-19): the parent minus the allocated ranges, each gap cut into the
  // largest aligned blocks, the same decomposition the Overlap / gap mode uses for gaps in a scope.
  const freeBlocks: CidrBlock[] = []; // collected in address order
  let freeCursor = parentStart; // the first address not yet accounted for
  for (const a of mergeRanges(allocatedRanges)) { // the allocated ranges in address order
    // A gap before this allocated range becomes blocks.
    if (a.start > freeCursor) for (const b of rangeToCidrs(freeCursor, a.start - 1)) freeBlocks.push(b);
    freeCursor = a.end + 1; // continue after the allocated range (Number, may reach 2^32)
  } // every allocated range passed
  // The tail of the parent after the last allocation.
  if (freeCursor <= parentEnd) for (const b of rangeToCidrs(freeCursor, parentEnd)) freeBlocks.push(b);
  const utilizationPct = parent.size > 0 ? Math.round((used / parent.size) * 1000) / 10 : 0; // one decimal place
  return { // the plan
    parent: `${intToIp(parent.network)}/${parent.prefix}`, // the parent as a normalized CIDR
    parentInput: parentCidr.trim(), // as typed, for the masked-parent note
    parentMasked: parent.addrInt !== parent.network, // host bits were set in the typed address (2026-10-19)
    parentNetwork: intToIp(parent.network), // dotted parent network
    parentPrefix: parent.prefix, // parent prefix length
    parentSize: parent.size, // parent address count
    subnets, // allocated blocks
    unallocated, // requests that did not fit
    usedAddresses: used, // allocated addresses
    freeAddresses: free, // free addresses
    freeBlocks, // the free space as blocks, not only a count
    placement: "largest-first", // the order the requests were placed in, stated rather than implied
    utilizationPct, // used as a percentage of the parent
  }; // end of the plan
}

// ---- Aggregation / supernetting -------------------------------------------

export interface CidrBlock {
  cidr: string;
  network: string;
  prefix: number;
  size: number;
}

export interface AggregateResult {
  inputCount: number;
  inputAddresses: number; // total addresses in the (merged) union of inputs
  aggregated: CidrBlock[]; // minimal CIDR set covering EXACTLY the union
  aggregatedCount: number;
  singleSupernet: CidrBlock | null; // smallest single prefix covering all inputs
  supernetExtraAddresses: number; // addresses the single supernet adds beyond the union
}

interface Range {
  start: number; // inclusive uint32
  end: number; // inclusive uint32
}

/** Merge overlapping/adjacent ranges into a minimal sorted set. */
function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Range[] = [{ start: sorted[0].start, end: sorted[0].end }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = out[out.length - 1];
    if (cur.start <= last.end + 1) {
      if (cur.end > last.end) last.end = cur.end; // contiguous or overlapping -> extend
    } else {
      out.push({ start: cur.start, end: cur.end });
    }
  }
  return out;
}

/** number of trailing zero bits of a uint32 (alignment of a start address). */
function trailingZeros(n: number): number {
  if (n === 0) return 32;
  let tz = 0;
  let v = n >>> 0;
  while ((v & 1) === 0 && tz < 32) {
    v >>>= 1;
    tz++;
  }
  return tz;
}

/** Decompose an inclusive [start,end] uint32 range into the minimal aligned CIDR list. */
function rangeToCidrs(start: number, end: number): CidrBlock[] {
  const blocks: CidrBlock[] = [];
  let cur = start;
  while (cur <= end) {
    const maxByAlign = trailingZeros(cur >>> 0); // block aligned at cur
    const remaining = end - cur + 1; // inclusive count (Number; may exceed U32 only at full range)
    let maxByRange = 0;
    while (Math.pow(2, maxByRange + 1) <= remaining && maxByRange < 32) maxByRange++;
    const bits = Math.min(maxByAlign, maxByRange);
    const prefix = 32 - bits;
    const size = Math.pow(2, bits);
    blocks.push({ cidr: `${intToIp(cur >>> 0)}/${prefix}`, network: intToIp(cur >>> 0), prefix, size });
    cur = cur + size; // Number
    if (cur > U32) break; // reached the top of the space
  }
  return blocks;
}

export function aggregate(inputs: string[]): AggregateResult {
  if (inputs.length > MAX_ENTRIES) throw new CidrInputError("tooMany", `too many entries (max ${MAX_ENTRIES})`);
  const parsed = inputs.map(parseCidr);
  const merged = mergeRanges(parsed.map((p) => ({ start: p.network, end: p.broadcast })));

  let unionAddrs = 0;
  for (const r of merged) unionAddrs += r.end - r.start + 1;

  const aggregated: CidrBlock[] = [];
  for (const r of merged) for (const b of rangeToCidrs(r.start, r.end)) aggregated.push(b);

  let single: CidrBlock | null = null;
  let supernetExtra = 0;
  if (merged.length > 0) {
    const lo = merged[0].start;
    const hi = merged[merged.length - 1].end;
    let p = 32;
    while (p > 0) {
      const mask = maskForPrefix(p);
      if (((lo & mask) >>> 0) === ((hi & mask) >>> 0)) break;
      p--;
    }
    const mask = maskForPrefix(p);
    const net = (lo & mask) >>> 0;
    const size = prefixSize(p);
    single = { cidr: `${intToIp(net)}/${p}`, network: intToIp(net), prefix: p, size };
    supernetExtra = size - unionAddrs;
  }

  return {
    inputCount: inputs.length,
    inputAddresses: unionAddrs,
    aggregated,
    aggregatedCount: aggregated.length,
    singleSupernet: single,
    supernetExtraAddresses: supernetExtra,
  };
}

// ---- Overlap & gap analysis ------------------------------------------------

export type OverlapKind = "identical" | "contains" | "contained" | "partial";

export interface OverlapPair {
  a: string; // original cidr (as typed) of the first member
  b: string; // original cidr of the second member
  kind: OverlapKind; // identical | a contains b | a contained in b | partial
  overlapStart: string;
  overlapEnd: string;
  overlapAddresses: number;
}

export interface OverlapGapResult {
  inputCount: number;
  overlaps: OverlapPair[];
  hasOverlaps: boolean;
  scope: string | null; // normalized scope CIDR if one was given
  gaps: CidrBlock[]; // uncovered CIDRs within scope (or holes between min..max)
  coveredAddresses: number; // union of inputs (clamped to scope when scope is given)
  scopeAddresses: number | null;
}

export function analyzeOverlapGap(inputs: string[], scopeCidr?: string): OverlapGapResult {
  if (inputs.length > MAX_ENTRIES) throw new CidrInputError("tooMany", `too many entries (max ${MAX_ENTRIES})`);
  const items = inputs.map((s) => ({ cidr: s, p: parseCidr(s) }));

  // pairwise overlaps (n is small in practice)
  const overlaps: OverlapPair[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i].p;
      const B = items[j].p;
      const oS = Math.max(A.network, B.network);
      const oE = Math.min(A.broadcast, B.broadcast);
      if (oS <= oE) {
        let kind: OverlapKind;
        if (A.network === B.network && A.broadcast === B.broadcast) kind = "identical";
        else if (A.network <= B.network && A.broadcast >= B.broadcast) kind = "contains";
        else if (B.network <= A.network && B.broadcast >= A.broadcast) kind = "contained";
        else kind = "partial";
        overlaps.push({
          a: items[i].cidr,
          b: items[j].cidr,
          kind,
          overlapStart: intToIp(oS),
          overlapEnd: intToIp(oE),
          overlapAddresses: oE - oS + 1,
        });
      }
    }
  }

  const merged = mergeRanges(items.map((it) => ({ start: it.p.network, end: it.p.broadcast })));

  let scope: ParsedCidr | null = null;
  if (scopeCidr !== undefined && scopeCidr.trim() !== "") scope = parseCidr(scopeCidr);

  const gapRanges: Range[] = [];
  let coveredAddresses = 0;
  let scopeAddresses: number | null = null;

  if (scope) {
    const sStart = scope.network;
    const sEnd = scope.broadcast;
    scopeAddresses = scope.size;
    let cursor = sStart;
    for (const r of merged) {
      const rs = Math.max(r.start, sStart);
      const re = Math.min(r.end, sEnd);
      if (rs > re) continue; // wholly outside scope
      if (rs > cursor) gapRanges.push({ start: cursor, end: rs - 1 });
      coveredAddresses += re - rs + 1;
      if (re + 1 > cursor) cursor = re + 1;
    }
    if (cursor <= sEnd) gapRanges.push({ start: cursor, end: sEnd });
  } else {
    for (const r of merged) coveredAddresses += r.end - r.start + 1;
    for (let k = 0; k < merged.length - 1; k++) {
      const gapStart = merged[k].end + 1;
      const gapEnd = merged[k + 1].start - 1;
      if (gapStart <= gapEnd) gapRanges.push({ start: gapStart, end: gapEnd });
    }
  }

  const gaps: CidrBlock[] = [];
  for (const g of gapRanges) for (const b of rangeToCidrs(g.start, g.end)) gaps.push(b);

  return {
    inputCount: inputs.length,
    overlaps,
    hasOverlaps: overlaps.length > 0,
    scope: scope ? `${intToIp(scope.network)}/${scope.prefix}` : null,
    gaps,
    coveredAddresses,
    scopeAddresses,
  };
}

// ---- Special-purpose classification (added 2026-10-19) ---------------------
// PRIME's decision 1 of 2026-10-19 14:2x: the Subnet mode says which special-purpose range the analysed block falls
// in or overlaps. Until this day the tool docs CLAIMED this feature while no code had it (NF-2e finding, e2 sheets).
//
// THE DATA is the IANA "IPv4 Special-Purpose Address Space" registry (formerly the IANA IPv4 Special-Purpose Address
// Registry), downloaded 2026-10-19 as iana-ipv4-special-registry-1.csv (registry last updated 2025-10-09), copied row
// for row: Address Block, Name and RFC verbatim, the Allocation and Termination dates, and the five boolean columns.
// The registry does not list multicast, so one row is added from the IANA "IPv4 Multicast Address Space" registry
// (updated 2026-08-20, read the same day), whose note says "The multicast addresses are in the range 224.0.0.0
// through 239.255.255.255" (= 224.0.0.0/4), the range RFC 1112 section 4 gives for host group addresses; the IANA
// IPv4 Address Space registry designates 224/8 to 239/8 "Multicast", 1981-09. That registry carries no Source,
// Destination, Forwardable or Globally Reachable columns, so those flags are null ("not listed"), never guessed.
//
// Two CIDR blocks are either disjoint or nested, so a block "partly overlaps" a special range only by containing it
// (10.0.0.0/7 contains 10.0.0.0/8 and holds 16,777,216 more addresses that are not special-purpose).

/** Which registry a special-purpose row comes from. */
export type SpecialPurposeRegistry = "ipv4-special-purpose" | "ipv4-multicast";

/** One special-purpose row, as the registry gives it. A null flag is a column the registry leaves blank. */
export interface SpecialPurposeEntry {
  block: string; // one CIDR block (the registry's two-block NAT64/DNS64 row is split into two entries)
  name: string; // the registry's Name, verbatim
  rfc: string; // the registry's RFC column, verbatim
  allocated: string; // Allocation Date, YYYY-MM
  terminated: string | null; // Termination Date, null where the registry says N/A
  source: boolean | null; // Source column
  destination: boolean | null; // Destination column
  forwardable: boolean | null; // Forwardable column
  globallyReachable: boolean | null; // Globally Reachable column
  reservedByProtocol: boolean | null; // Reserved-by-Protocol column
  footnote: "1" | "2" | null; // the registry footnote attached to the row ([1] on Loopback's flags, [2] on 192.0.0.0/24)
  registry: SpecialPurposeRegistry; // where the row comes from
}

/** Shorthand for the flag columns, in registry order: Source, Destination, Forwardable, Globally Reachable, Reserved-by-Protocol. */
type Flags = [boolean | null, boolean | null, boolean | null, boolean | null, boolean | null];

/** Build one registry row (keeps the table below to one line per row). */
function row(block: string, name: string, rfc: string, allocated: string, terminated: string | null, f: Flags, footnote: "1" | "2" | null = null, registry: SpecialPurposeRegistry = "ipv4-special-purpose"): SpecialPurposeEntry {
  // The flags are spread into their named fields.
  return { block, name, rfc, allocated, terminated, source: f[0], destination: f[1], forwardable: f[2], globallyReachable: f[3], reservedByProtocol: f[4], footnote, registry };
}

const T = true; // a registry "True", for a readable table
const F = false; // a registry "False"
const N = null; // a blank registry cell (the deprecated 6to4 row) or a column the registry does not have

/** The registry, row for row, in its own order (iana-ipv4-special-registry-1.csv, read 2026-10-19). */
export const SPECIAL_PURPOSE_REGISTRY: readonly SpecialPurposeEntry[] = Object.freeze([
  row("0.0.0.0/8", '"This network"', "[RFC 791, Section 3.2]", "1981-09", null, [T, F, F, F, T]), // "This network"
  row("0.0.0.0/32", '"This host on this network"', "[RFC 1122, Section 3.2.1.3]", "1981-09", null, [T, F, F, F, T]), // this host
  row("10.0.0.0/8", "Private-Use", "[RFC 1918]", "1996-02", null, [T, T, T, F, F]), // RFC 1918 24-bit block
  row("100.64.0.0/10", "Shared Address Space", "[RFC 6598]", "2012-04", null, [T, T, T, F, F]), // CGN shared space
  row("127.0.0.0/8", "Loopback", "[RFC 1122, Section 3.2.1.3]", "1981-09", null, [F, F, F, F, T], "1"), // "False [1]" x4
  row("169.254.0.0/16", "Link Local", "[RFC 3927]", "2005-05", null, [T, T, F, F, T]), // IPv4 link-local
  row("172.16.0.0/12", "Private-Use", "[RFC 1918]", "1996-02", null, [T, T, T, F, F]), // RFC 1918 20-bit block
  row("192.0.0.0/24", "IETF Protocol Assignments", "[RFC 6890, Section 2.1]", "2010-01", null, [F, F, F, F, F], "2"), // "192.0.0.0/24 [2]"
  row("192.0.0.0/29", "IPv4 Service Continuity Prefix", "[RFC 7335]", "2011-06", null, [T, T, T, F, F]), // DS-Lite and others
  row("192.0.0.8/32", "IPv4 dummy address", "[RFC 7600]", "2015-03", null, [T, F, F, F, F]), // dummy address
  row("192.0.0.9/32", "Port Control Protocol Anycast", "[RFC 7723]", "2015-10", null, [T, T, T, T, F]), // PCP anycast
  row("192.0.0.10/32", "Traversal Using Relays around NAT Anycast", "[RFC 8155]", "2017-02", null, [T, T, T, T, F]), // TURN anycast
  row("192.0.0.170/32", "NAT64/DNS64 Discovery", "[RFC 8880]; [RFC 7050, Section 2.2]", "2013-02", null, [F, F, F, F, T]), // first of the row's two blocks
  row("192.0.0.171/32", "NAT64/DNS64 Discovery", "[RFC 8880]; [RFC 7050, Section 2.2]", "2013-02", null, [F, F, F, F, T]), // second of the row's two blocks
  row("192.0.2.0/24", "Documentation (TEST-NET-1)", "[RFC 5737]", "2010-01", null, [F, F, F, F, F]), // documentation
  row("192.31.196.0/24", "AS112-v4", "[RFC 7535]", "2014-12", null, [T, T, T, T, F]), // AS112
  row("192.52.193.0/24", "AMT", "[RFC 7450]", "2014-12", null, [T, T, T, T, F]), // Automatic Multicast Tunneling
  row("192.88.99.0/24", "Deprecated (6to4 Relay Anycast)", "[RFC 7526]", "2001-06", "2015-03", [N, N, N, N, N]), // flags blank in the registry
  row("192.88.99.2/32", "6a44-relay anycast address", "[RFC 6751]", "2012-10", null, [T, T, T, F, F]), // 6a44
  row("192.168.0.0/16", "Private-Use", "[RFC 1918]", "1996-02", null, [T, T, T, F, F]), // RFC 1918 16-bit block
  row("192.175.48.0/24", "Direct Delegation AS112 Service", "[RFC 7534]", "1996-01", null, [T, T, T, T, F]), // AS112 direct delegation
  row("198.18.0.0/15", "Benchmarking", "[RFC 2544]", "1999-03", null, [T, T, T, F, F]), // benchmarking
  row("198.51.100.0/24", "Documentation (TEST-NET-2)", "[RFC 5737]", "2010-01", null, [F, F, F, F, F]), // documentation
  row("203.0.113.0/24", "Documentation (TEST-NET-3)", "[RFC 5737]", "2010-01", null, [F, F, F, F, F]), // documentation
  row("224.0.0.0/4", "Multicast", "[RFC 1112, Section 4]; [RFC 5771]", "1981-09", null, [N, N, N, N, N], null, "ipv4-multicast"), // from the multicast registry
  row("240.0.0.0/4", "Reserved", "[RFC 1112, Section 4]", "1989-08", null, [F, F, F, F, T]), // class E, "reserved for future addressing modes"
  row("255.255.255.255/32", "Limited Broadcast", "[RFC 8190]; [RFC 919, Section 7]", "1984-10", null, [F, T, F, F, T]), // limited broadcast
]);

/** How the analysed block relates to one special-purpose range. */
export type SpecialRelation = "equal" | "inside" | "contains";

/** One special-purpose range the analysed block falls in or overlaps. */
export interface SpecialPurposeMatch extends SpecialPurposeEntry {
  relation: SpecialRelation; // equal: the same block; inside: the block lies within it; contains: the block holds it and more (a partial overlap)
  overlapAddresses: number; // addresses the two have in common
}

/** The classification of one block against the special-purpose ranges. */
export interface SpecialPurposeClassification {
  block: string; // the analysed block, normalized (host bits masked)
  totalAddresses: number; // addresses in the block
  status: "special" | "partial" | "none"; // wholly inside a listed range, partly overlapping some, or none at all
  matches: SpecialPurposeMatch[]; // ranges holding the block (most specific first), then ranges it contains (address order)
  specialAddresses: number; // addresses of the block that fall in any listed range (the union, never double-counted)
}

/** Parsed registry rows, built once (the table is constant). */
const PARSED_SPECIAL = SPECIAL_PURPOSE_REGISTRY.map((e) => ({ e, p: parseCidr(e.block) })); // each row with its range

/**
 * Classify one "A.B.C.D/prefix" block against the special-purpose registry (plus the multicast row). Pure;
 * throws CidrInputError on malformed input, like cidrAnalyze.
 */
export function classifySpecialPurpose(input: string): SpecialPurposeClassification {
  const b = parseCidr(input); // the analysed block (host bits masked)
  const holding: SpecialPurposeMatch[] = []; // listed ranges equal to or containing the block
  const contained: SpecialPurposeMatch[] = []; // listed ranges strictly inside the block
  for (const { e, p } of PARSED_SPECIAL) { // each registry row
    // CIDR blocks are disjoint or nested, so these three tests cover every overlap.
    if (p.network === b.network && p.broadcast === b.broadcast) holding.push({ ...e, relation: "equal", overlapAddresses: b.size }); // the same block
    else if (p.network <= b.network && p.broadcast >= b.broadcast) holding.push({ ...e, relation: "inside", overlapAddresses: b.size }); // the block lies within the row
    else if (b.network <= p.network && b.broadcast >= p.broadcast) contained.push({ ...e, relation: "contains", overlapAddresses: p.size }); // the row lies within the block
  } // every row tested
  // The most specific holding range first (longest prefix), so the first match names the narrowest purpose.
  holding.sort((x, y) => parseCidr(y.block).prefix - parseCidr(x.block).prefix); // longest prefix first (stable for ties)
  // Contained ranges in address order, then by prefix, a deterministic order whatever the registry order.
  contained.sort((x, y) => parseCidr(x.block).network - parseCidr(y.block).network || parseCidr(x.block).prefix - parseCidr(y.block).prefix);
  let specialAddresses = 0; // the union of the overlaps, counted once
  if (holding.length > 0) specialAddresses = b.size; // wholly inside a listed range: every address is special-purpose
  else for (const r of mergeRanges(contained.map((m) => { const q = parseCidr(m.block); return { start: q.network, end: q.broadcast }; }))) specialAddresses += r.end - r.start + 1; // nested rows merge, so 192.0.0.0/24 and its sub-entries count once
  return { // the classification
    block: `${intToIp(b.network)}/${b.prefix}`, // normalized block
    totalAddresses: b.size, // its size
    status: holding.length > 0 ? "special" : contained.length > 0 ? "partial" : "none", // the verdict
    matches: [...holding, ...contained], // holding ranges first, then contained ones
    specialAddresses, // addresses inside listed ranges
  }; // end of the classification
}
