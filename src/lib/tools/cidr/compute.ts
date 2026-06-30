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
  hosts: number; // usable hosts needed (>= 0)
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
}

export interface VlsmResult {
  parent: string; // normalized parent CIDR
  parentNetwork: string;
  parentPrefix: number;
  parentSize: number;
  subnets: VlsmSubnet[]; // allocated, in allocation order (largest-first)
  unallocated: VlsmRequirement[]; // requirements that did not fit
  usedAddresses: number;
  freeAddresses: number;
  utilizationPct: number; // used / parentSize * 100, 1 decimal
}

/** Smallest prefix whose block holds `hosts` usable addresses (network+broadcast convention). */
function prefixForHosts(hosts: number): number {
  const needed = Math.max(hosts + 2, 2); // +2 for network & broadcast
  let prefix = 32;
  while (prefixSize(prefix) < needed && prefix > 0) prefix--;
  return prefix;
}

function ceilToMultiple(n: number, multiple: number): number {
  if (multiple <= 0) return n;
  const r = n % multiple;
  return r === 0 ? n : n + (multiple - r);
}

export function allocateVlsm(parentCidr: string, requirements: VlsmRequirement[]): VlsmResult {
  if (requirements.length > MAX_ENTRIES) {
    throw new CidrInputError("tooMany", `too many requirements (max ${MAX_ENTRIES})`);
  }
  const parent = parseCidr(parentCidr);
  // Largest-first keeps allocations aligned and minimizes fragmentation.
  // Keep original index as a stable tie-break for deterministic output.
  const indexed = requirements.map((r, i) => ({ r, i }));
  indexed.sort((a, b) => b.r.hosts - a.r.hosts || a.i - b.i);

  const parentStart = parent.network;
  const parentEnd = (parent.network + parent.size - 1) >>> 0; // inclusive
  let cursor = parentStart;

  const subnets: VlsmSubnet[] = [];
  const unallocated: VlsmRequirement[] = [];
  let used = 0;

  for (const { r } of indexed) {
    const prefix = prefixForHosts(r.hosts);
    const size = prefixSize(prefix);
    const start = ceilToMultiple(cursor, size); // align to this block's boundary
    const end = start + size - 1;
    if (start < parentStart || end > parentEnd) {
      unallocated.push(r);
      continue;
    }
    const network = start >>> 0;
    const broadcast = end >>> 0;
    const usableHosts = prefix >= 31 ? size : size - 2;
    const firstHost = prefix >= 31 ? network : (network + 1) >>> 0;
    const lastHost = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;
    subnets.push({
      label: r.label ?? "",
      requestedHosts: r.hosts,
      prefix,
      network: intToIp(network),
      netmask: intToIp(maskForPrefix(prefix)),
      firstHost: intToIp(firstHost),
      lastHost: intToIp(lastHost),
      broadcast: intToIp(broadcast),
      usableHosts,
      size,
    });
    used += size;
    cursor = end + 1; // Number (may reach 2^32 at the very top; bounds check catches next)
  }

  const free = parent.size - used;
  const utilizationPct = parent.size > 0 ? Math.round((used / parent.size) * 1000) / 10 : 0;
  return {
    parent: `${intToIp(parent.network)}/${parent.prefix}`,
    parentNetwork: intToIp(parent.network),
    parentPrefix: parent.prefix,
    parentSize: parent.size,
    subnets,
    unallocated,
    usedAddresses: used,
    freeAddresses: free,
    utilizationPct,
  };
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
