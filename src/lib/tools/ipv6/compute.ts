// ============================================================================
// src/lib/tools/ipv6/compute.ts
// ----------------------------------------------------------------------------
// IPv6 ADDRESS TOOLKIT - the pure compute core for the IPv6 tool.
//
// netcore tool contract: a tool is a {manifest, run, vectors} triple and `run`
// must be DETERMINISTIC so its golden vectors are stable. This file is that
// deterministic core. It parses an IPv6 address or prefix (RFC 4291 textual
// forms, including `::` compression and an embedded IPv4 tail), and returns a
// flat, render-ready object: the canonical compressed form (RFC 5952), the
// fully expanded form, special-use classification (RFC 4291 + IANA), prefix math
// (network / first / last / count), a modified-EUI-64 MAC if the interface id
// carries one (RFC 4291 Appendix A), and the ip6.arpa reverse-DNS name.
//
// Everything here is clock-independent and library-free - the same hand-rolled
// posture as the rest of the toolbox ("tools that compute, never guess"). Runs
// identically in the browser and in Node.
// ============================================================================

// ----------------------------------------------------------------------------
// Result shape
// ----------------------------------------------------------------------------

/** Special-use classification of an address (RFC 4291 + IANA registry). */
export interface Ipv6Classification {
  /** Human type, e.g. "Global unicast", "Link-local unicast", "Multicast". */
  type: string;
  /** The matching prefix, e.g. "2000::/3" or "::1/128". */
  detail: string;
  /** Multicast/link-local scope name, when applicable. */
  scope?: string;
  /** True for ff00::/8. */
  isMulticast: boolean;
  /** Dotted IPv4 tail for IPv4-mapped / IPv4-compatible addresses. */
  embeddedIpv4?: string;
}

/** Prefix arithmetic, present only when the input carried a `/length`. */
export interface Ipv6PrefixMath {
  prefixLength: number;
  hostBits: number;
  /** Network (first) address, compressed. */
  network: string;
  /** First address in the prefix (== network), compressed. */
  firstAddress: string;
  /** Last address in the prefix, compressed. */
  lastAddress: string;
  /** Count as a power of two, e.g. "2^64". */
  countPow2: string;
  /** Exact count as a decimal string (BigInt). */
  countExact: string;
}

/** The deterministic result of decoding an IPv6 address or prefix. */
export interface DecodedIpv6 {
  /** The trimmed input, echoed back. */
  input: string;
  /** The 16 address bytes. */
  bytes: number[];
  /** RFC 5952 canonical compressed form (lower-case, `::`, no leading zeros). */
  compressed: string;
  /** Fully expanded form: 8 groups of 4 hex digits. */
  expanded: string;
  /** Prefix length if one was supplied, else null. */
  prefixLength: number | null;
  /** Special-use classification. */
  classification: Ipv6Classification;
  /** Prefix math, present only when a prefix length was supplied. */
  prefix: Ipv6PrefixMath | null;
  /** Extracted MAC if the interface id is modified-EUI-64 (ff:fe), else null. */
  eui64Mac: string | null;
  /** The ip6.arpa reverse-DNS name. */
  reverseDns: string;
}

/** Distinct decode failure reasons. The component localizes these codes. */
export type Ipv6DecodeErrorCode = "empty" | "format" | "prefix";

/** A decode error carrying a stable, machine-checkable code. */
export class Ipv6DecodeError extends Error {
  code: Ipv6DecodeErrorCode;
  constructor(code: Ipv6DecodeErrorCode) {
    super(code);
    this.name = "Ipv6DecodeError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Parsing (RFC 4291 textual forms)
// ----------------------------------------------------------------------------

/** Parse a dotted IPv4 quad to four bytes (used for an embedded IPv4 tail). */
function parseIpv4Tail(s: string): number[] {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (!m) throw new Ipv6DecodeError("format");
  const out: number[] = [];
  for (let i = 1; i <= 4; i++) {
    const v = parseInt(m[i], 10);
    if (v > 255) throw new Ipv6DecodeError("format");
    out.push(v);
  }
  return out;
}

/** Convert an embedded IPv4 tail in `s` into two trailing hex groups. */
function foldIpv4Tail(s: string): string {
  if (s.indexOf(".") < 0) return s;
  const lastColon = s.lastIndexOf(":");
  if (lastColon < 0) throw new Ipv6DecodeError("format");
  const v4 = parseIpv4Tail(s.slice(lastColon + 1));
  const g1 = ((v4[0] << 8) | v4[1]).toString(16);
  const g2 = ((v4[2] << 8) | v4[3]).toString(16);
  return s.slice(0, lastColon + 1) + g1 + ":" + g2;
}

/** Parse the hex-group portion (after IPv4 folding) to 16 bytes. */
function parseHexGroups(s: string): number[] {
  let groups: string[];
  const dc = s.indexOf("::");
  if (dc >= 0) {
    if (s.indexOf("::", dc + 1) >= 0) throw new Ipv6DecodeError("format"); // only one ::
    const left = s.slice(0, dc);
    const right = s.slice(dc + 2);
    const leftG = left === "" ? [] : left.split(":");
    const rightG = right === "" ? [] : right.split(":");
    const missing = 8 - (leftG.length + rightG.length);
    if (missing < 1) throw new Ipv6DecodeError("format"); // :: must cover >=1 group
    groups = [...leftG, ...Array(missing).fill("0"), ...rightG];
  } else {
    groups = s.split(":");
  }
  if (groups.length !== 8) throw new Ipv6DecodeError("format");

  const bytes: number[] = [];
  for (const g of groups) {
    if (g === "" || g.length > 4 || !/^[0-9A-Fa-f]+$/.test(g)) throw new Ipv6DecodeError("format");
    const v = parseInt(g, 16);
    bytes.push((v >> 8) & 0xff, v & 0xff);
  }
  return bytes;
}

/** Parse a full input string to { bytes, prefixLength }. */
function parseIpv6(input: string): { bytes: number[]; prefixLength: number | null } {
  let s = (input ?? "").trim();
  if (!s) throw new Ipv6DecodeError("empty");

  // Split off an optional /prefix.
  let prefixLength: number | null = null;
  const slash = s.indexOf("/");
  if (slash >= 0) {
    const p = s.slice(slash + 1);
    s = s.slice(0, slash);
    if (!/^\d{1,3}$/.test(p)) throw new Ipv6DecodeError("prefix");
    prefixLength = parseInt(p, 10);
    if (prefixLength < 0 || prefixLength > 128) throw new Ipv6DecodeError("prefix");
  }

  // Strip an optional zone id (RFC 4007), e.g. fe80::1%eth0.
  const pct = s.indexOf("%");
  if (pct >= 0) s = s.slice(0, pct);

  if (s === "") throw new Ipv6DecodeError("format");
  const bytes = parseHexGroups(foldIpv4Tail(s));
  return { bytes, prefixLength };
}

// ----------------------------------------------------------------------------
// Canonical text forms
// ----------------------------------------------------------------------------

function bytesToGroups(bytes: number[]): number[] {
  const groups: number[] = [];
  for (let i = 0; i < 16; i += 2) groups.push((bytes[i] << 8) | bytes[i + 1]);
  return groups;
}

/** Fully expanded form: 8 groups of 4 lower-case hex digits. */
function expand(bytes: number[]): string {
  return bytesToGroups(bytes)
    .map((g) => g.toString(16).padStart(4, "0"))
    .join(":");
}

/** True iff the address is in ::ffff:0:0/96 (IPv4-mapped). */
function isIpv4Mapped(bytes: number[]): boolean {
  for (let i = 0; i < 10; i++) if (bytes[i] !== 0) return false;
  return bytes[10] === 0xff && bytes[11] === 0xff;
}

/** RFC 5952 canonical compressed form. */
function compress(bytes: number[]): string {
  // RFC 5952 §5: IPv4-mapped addresses use mixed notation.
  if (isIpv4Mapped(bytes)) {
    return `::ffff:${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`;
  }

  const groups = bytesToGroups(bytes);
  // Find the longest run of >=2 consecutive zero groups; ties take the first.
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] === 0) {
      if (curStart < 0) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  const hex = groups.map((g) => g.toString(16));
  if (bestLen >= 2) {
    const before = hex.slice(0, bestStart).join(":");
    const after = hex.slice(bestStart + bestLen).join(":");
    return `${before}::${after}`;
  }
  return hex.join(":");
}

// ----------------------------------------------------------------------------
// Special-use classification (RFC 4291 + IANA IPv6 special-purpose registry)
// ----------------------------------------------------------------------------

interface SpecialBlock {
  prefixHex: string; // first bytes of the prefix, hex (no colons), length-prefix bits
  prefixLen: number;
  type: string;
  detail: string;
}

// Ordered most-specific-first; first match wins.
const SPECIAL_BLOCKS: SpecialBlock[] = [
  { prefixHex: "00000000000000000000000000000000", prefixLen: 128, type: "Unspecified", detail: "::/128" },
  { prefixHex: "00000000000000000000000000000001", prefixLen: 128, type: "Loopback", detail: "::1/128" },
  { prefixHex: "00000000000000000000ffff", prefixLen: 96, type: "IPv4-mapped", detail: "::ffff:0:0/96" },
  { prefixHex: "0064ff9b0000000000000000", prefixLen: 96, type: "IPv4/IPv6 translation", detail: "64:ff9b::/96" },
  { prefixHex: "0100", prefixLen: 64, type: "Discard-only", detail: "100::/64" },
  { prefixHex: "20010db8", prefixLen: 32, type: "Documentation", detail: "2001:db8::/32" },
  { prefixHex: "2002", prefixLen: 16, type: "6to4", detail: "2002::/16" },
  { prefixHex: "fc", prefixLen: 7, type: "Unique local", detail: "fc00::/7" },
  { prefixHex: "fe80", prefixLen: 10, type: "Link-local unicast", detail: "fe80::/10" },
  { prefixHex: "ff", prefixLen: 8, type: "Multicast", detail: "ff00::/8" },
  { prefixHex: "20", prefixLen: 3, type: "Global unicast", detail: "2000::/3" },
];

/** True iff `bytes` falls within the prefix given by hex/len. */
function inPrefix(bytes: number[], prefixHex: string, prefixLen: number): boolean {
  // Build the prefix bytes from the hex string (padded with zeros as needed).
  const pBytes: number[] = [];
  for (let i = 0; i < prefixHex.length; i += 2) pBytes.push(parseInt(prefixHex.substr(i, 2), 16));
  for (let bit = 0; bit < prefixLen; bit++) {
    const byteIdx = bit >> 3;
    const mask = 1 << (7 - (bit & 7));
    const a = (bytes[byteIdx] ?? 0) & mask;
    const b = (pBytes[byteIdx] ?? 0) & mask;
    if (a !== b) return false;
  }
  return true;
}

const MCAST_SCOPE: Record<number, string> = {
  0: "reserved",
  1: "interface-local",
  2: "link-local",
  3: "realm-local",
  4: "admin-local",
  5: "site-local",
  8: "organization-local",
  14: "global",
};

function classify(bytes: number[]): Ipv6Classification {
  for (const blk of SPECIAL_BLOCKS) {
    if (inPrefix(bytes, blk.prefixHex, blk.prefixLen)) {
      const c: Ipv6Classification = { type: blk.type, detail: blk.detail, isMulticast: blk.type === "Multicast" };
      if (blk.type === "Multicast") {
        const scope = bytes[1] & 0x0f;
        c.scope = MCAST_SCOPE[scope] ?? `scope ${scope}`;
      } else if (blk.type === "Link-local unicast") {
        c.scope = "link-local";
      } else if (blk.type === "IPv4-mapped") {
        c.embeddedIpv4 = `${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`;
      }
      return c;
    }
  }
  return { type: "Reserved / unassigned", detail: "(no IANA special-use match)", isMulticast: false };
}

// ----------------------------------------------------------------------------
// Prefix math (128-bit, byte-array arithmetic)
// ----------------------------------------------------------------------------

/** Copy of `bytes` with all bits at position >= prefixLen set to `fill`. */
function applyPrefix(bytes: number[], prefixLen: number, fill: 0 | 1): number[] {
  const out = bytes.slice();
  for (let bit = prefixLen; bit < 128; bit++) {
    const byteIdx = bit >> 3;
    const mask = 1 << (7 - (bit & 7));
    if (fill) out[byteIdx] |= mask;
    else out[byteIdx] &= ~mask & 0xff;
  }
  return out;
}

function prefixMath(bytes: number[], prefixLength: number): Ipv6PrefixMath {
  const network = applyPrefix(bytes, prefixLength, 0);
  const last = applyPrefix(network, prefixLength, 1);
  const hostBits = 128 - prefixLength;
  return {
    prefixLength,
    hostBits,
    network: compress(network),
    firstAddress: compress(network),
    lastAddress: compress(last),
    countPow2: `2^${hostBits}`,
    countExact: (1n << BigInt(hostBits)).toString(),
  };
}

// ----------------------------------------------------------------------------
// Identifiers: EUI-64 MAC + ip6.arpa
// ----------------------------------------------------------------------------

/** Extract the MAC if the interface id is a modified EUI-64 (RFC 4291 App. A). */
function eui64Mac(bytes: number[]): string | null {
  // Modified EUI-64 inserts ff:fe at the middle of the 64-bit interface id.
  if (bytes[11] === 0xff && bytes[12] === 0xfe) {
    const mac = [bytes[8] ^ 0x02, bytes[9], bytes[10], bytes[13], bytes[14], bytes[15]];
    return mac.map((b) => b.toString(16).padStart(2, "0")).join(":");
  }
  return null;
}

/** The ip6.arpa reverse-DNS name: 32 reversed nibbles, dot-separated. */
function reverseDns(bytes: number[]): string {
  const nibbles: string[] = [];
  for (const b of bytes) {
    nibbles.push((b >> 4).toString(16));
    nibbles.push((b & 0xf).toString(16));
  }
  return nibbles.reverse().join(".") + ".ip6.arpa";
}

// ----------------------------------------------------------------------------
// The orchestrator
// ----------------------------------------------------------------------------

/**
 * decodeIpv6 - the deterministic entry point.
 * @param input an IPv6 address or prefix (RFC 4291 textual forms)
 * @returns the decoded structure
 * @throws {Ipv6DecodeError} with a stable code on any malformed input
 */
export function decodeIpv6(input: string): DecodedIpv6 {
  const { bytes, prefixLength } = parseIpv6(input);
  return {
    input: input.trim(),
    bytes,
    compressed: compress(bytes),
    expanded: expand(bytes),
    prefixLength,
    classification: classify(bytes),
    prefix: prefixLength !== null ? prefixMath(bytes, prefixLength) : null,
    eui64Mac: eui64Mac(bytes),
    reverseDns: reverseDns(bytes),
  };
}
