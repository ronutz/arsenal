// ============================================================================
// src/lib/tools/ipv6/compute.ts
// ----------------------------------------------------------------------------
// IPv6 ADDRESS TOOLKIT - the pure compute core for the IPv6 tool.
//
// the tool contract: a tool is a {manifest, run, vectors} triple and `run`
// must be DETERMINISTIC so its golden vectors are stable. This file is that
// deterministic core. It parses an IPv6 address or prefix (RFC 4291 textual
// forms, including `::` compression and an embedded IPv4 tail), and returns a
// flat, render-ready object: the canonical compressed form (RFC 5952), the
// fully expanded form, special-use classification (RFC 4291 + IANA), prefix math
// (network / first / last / count), a modified-EUI-64 MAC if the interface id
// carries one (RFC 4291 Appendix A), and the ip6.arpa reverse-DNS name.
// Since 2026-10-19 it also reads multicast flags and flags reserved or unassigned
// scope values (RFC 4291 s2.7, RFC 7346), recognises source-specific multicast
// ff3x::/32 (RFC 4607, RFC 3306 s6), and decodes Teredo addresses (RFC 4380 s4).
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
  /** Multicast only: whether the 4-bit scope value is assigned, reserved or unassigned (IANA scope registry, RFC 7346). */
  scopeStatus?: "assigned" | "reserved" | "unassigned"; // set for every ff00::/8 address, absent otherwise
  /** Multicast only: the 4-bit flag field read bit by bit, e.g. "0011 (X=0, R=0, P=1, T=1)" (RFC 4291 s2.7, RFC 7371 s4). */
  flags?: string; // set for every ff00::/8 address, absent otherwise
  /** Source-specific multicast only (ff3x::/32): which group-ID range the address falls in (RFC 4607 s1, IANA registry). */
  ssmRange?: string; // set only when the type is "Source-specific multicast"
}

/** Teredo fields decoded from a 2001::/32 address (RFC 4380 s4, flags as updated by RFC 5991 s3.1). */
export interface Ipv6Teredo { // returned as DecodedIpv6.teredo
  /** The Teredo server's IPv4 address: bits 32 to 63, stored in clear. */
  server: string; // dotted quad
  /** The 16-bit Flags field (bits 64 to 79) in hex, with the C, U and G bits read out. */
  flags: string; // e.g. "0x3c5a (C=0, U=0, G=0)"
  /** The cone bit C (RFC 4380 s4; RFC 5991 s3.2 deprecates setting it). */
  cone: boolean; // true when the first flag bit is 1
  /** The client's external (mapped) UDP port: bits 80 to 95 XOR 0xffff. */
  port: number; // 0 to 65535, de-obfuscated
  /** The client's external (mapped) IPv4 address: bits 96 to 127 XOR 0xffffffff. */
  client: string; // dotted quad, de-obfuscated
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
  /** Teredo decode for a single address in 2001::/32 (no prefix, or /128), else null. */
  teredo: Ipv6Teredo | null; // RFC 4380 s4; a prefix such as 2001::/32 is a block, not one client, so it is not decoded
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
// The rows added on 2026-10-19 (64:ff9b:1::/48, 2001::/32, 3fff::/20, 5f00::/16) were each confirmed against the
// IANA IPv6 Special-Purpose Address Registry CSV downloaded that day (registry last updated 2025-10-09).
const SPECIAL_BLOCKS: SpecialBlock[] = [
  { prefixHex: "00000000000000000000000000000000", prefixLen: 128, type: "Unspecified", detail: "::/128" },
  { prefixHex: "00000000000000000000000000000001", prefixLen: 128, type: "Loopback", detail: "::1/128" },
  { prefixHex: "00000000000000000000ffff", prefixLen: 96, type: "IPv4-mapped", detail: "::ffff:0:0/96" },
  { prefixHex: "0064ff9b0000000000000000", prefixLen: 96, type: "IPv4/IPv6 translation", detail: "64:ff9b::/96" },
  { prefixHex: "0064ff9b0001", prefixLen: 48, type: "IPv4/IPv6 translation (local use)", detail: "64:ff9b:1::/48" }, // RFC 8215; IANA row "IPv4-IPv6 Translat.", allocated 2017-06
  { prefixHex: "0100", prefixLen: 64, type: "Discard-only", detail: "100::/64" },
  { prefixHex: "20010db8", prefixLen: 32, type: "Documentation", detail: "2001:db8::/32" },
  { prefixHex: "20010000", prefixLen: 32, type: "Teredo", detail: "2001::/32" }, // RFC 4380; IANA row "TEREDO", allocated 2006-01; decoded by teredoDecode()
  { prefixHex: "2002", prefixLen: 16, type: "6to4", detail: "2002::/16" },
  { prefixHex: "3fff00", prefixLen: 20, type: "Documentation", detail: "3fff::/20" }, // RFC 9637; IANA row "Documentation", allocated 2024-07; must precede 2000::/3
  { prefixHex: "5f00", prefixLen: 16, type: "Segment Routing (SRv6) SIDs", detail: "5f00::/16" }, // RFC 9602; IANA row "Segment Routing (SRv6) SIDs", allocated 2024-04
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

// The ASSIGNED multicast scope values (RFC 4291 s2.7 as updated by RFC 7346 s2, and the IANA "IPv6 Multicast
// Address Scopes" registry read 2026-10-19). Values 0 and F are reserved; 6, 7 and 9 to D are unassigned.
const MCAST_SCOPE: Record<number, string> = { // scope value -> registry name, lower-case as before
  1: "interface-local", // scope 1
  2: "link-local", // scope 2
  3: "realm-local", // scope 3, reserved in RFC 4291 and named Realm-Local by RFC 7346
  4: "admin-local", // scope 4
  5: "site-local", // scope 5
  8: "organization-local", // scope 8
  14: "global", // scope E
};

/** The scope values RFC 4291 s2.7 and the IANA scope registry mark "reserved" (0 and F). */
const MCAST_SCOPE_RESERVED = new Set<number>([0, 15]); // every other unnamed value is "unassigned"

/**
 * Read the multicast scope nibble into a name and a status. A reserved or unassigned value is labelled as such
 * with its hex digit, never printed as a bare number that reads like a valid scope.
 * @param scope the low nibble of the second address byte (0 to 15)
 * @returns the display name and its registry status
 */
function multicastScope(scope: number): { name: string; status: "assigned" | "reserved" | "unassigned" } { // pure lookup
  const named = MCAST_SCOPE[scope]; // the registry name, when the value is assigned
  if (named) return { name: named, status: "assigned" }; // an assigned scope keeps its plain name
  const digit = scope.toString(16).toUpperCase(); // the registry writes scope values as one upper-case hex digit
  if (MCAST_SCOPE_RESERVED.has(scope)) return { name: `reserved (scope ${digit})`, status: "reserved" }; // 0 or F
  return { name: `unassigned (scope ${digit})`, status: "unassigned" }; // 6, 7, 9, A, B, C or D
}

/**
 * Read the 4-bit multicast flag field bit by bit. Names follow RFC 7371 s4 (X, then R from RFC 3956, P from
 * RFC 3306, T from RFC 4291 s2.7); RFC 7371 says implementations MUST treat flag bits as separate bits.
 * @param flgs the high nibble of the second address byte (0 to 15)
 * @returns e.g. "0011 (X=0, R=0, P=1, T=1)"
 */
function multicastFlags(flgs: number): string { // pure formatting
  const bits = flgs.toString(2).padStart(4, "0"); // the nibble as four binary digits, most significant first
  return `${bits} (X=${bits[0]}, R=${bits[1]}, P=${bits[2]}, T=${bits[3]})`; // each bit named in field order
}

/**
 * Place a source-specific multicast address (ff3x::/32) in its group-ID range. RFC 4607 s1: every SSM
 * address "must have P=1, T=1, and plen=0", allocation happens inside ff3x::/96, and the group IDs
 * 0:0 to 3fff:ffff are invalid. The IANA "Unicast-based (Including SSM) Multicast Group IDs" registry
 * (read 2026-10-19) marks the rest of ff3x::/32 outside ff3x::/96 as reserved for future SSM use and
 * currently invalid, 4000:0 to 7fff:ffff as reserved for IANA allocation, and 8000:0 to ffff:ffff as
 * dynamic assignment.
 * @param bytes the 16 address bytes (already known to be in ff3x::/32)
 * @returns a one-line description of the range
 */
function ssmRange(bytes: number[]): string { // pure, bounded (8 + 1 byte reads)
  for (let i = 4; i < 12; i++) { // scan the network-prefix bytes
    // bytes 4 to 11 are the 64-bit network-prefix field, which must be zero for ff3x::/96
    if (bytes[i] !== 0) return "outside ff3x::/96: reserved for future SSM use, currently invalid"; // IANA registry note
  }
  const groupHigh = bytes[12]; // the top byte of the 32-bit group ID decides the range
  if (groupHigh < 0x40) return "invalid SSM group ID (ff3x::0:0 to ff3x::3fff:ffff)"; // RFC 4607 s1
  if (groupHigh < 0x80) return "reserved for IANA allocation (ff3x::4000:0 to ff3x::7fff:ffff)"; // RFC 4607 s1, IANA registry
  return "dynamic assignment (ff3x::8000:0 to ff3x::ffff:ffff)"; // RFC 4607 s1, IANA registry
}

function classify(bytes: number[]): Ipv6Classification {
  for (const blk of SPECIAL_BLOCKS) {
    if (inPrefix(bytes, blk.prefixHex, blk.prefixLen)) {
      const c: Ipv6Classification = { type: blk.type, detail: blk.detail, isMulticast: blk.type === "Multicast" };
      if (blk.type === "Multicast") {
        const scope = multicastScope(bytes[1] & 0x0f); // low nibble of byte 1 is scop (RFC 4291 s2.7)
        c.scope = scope.name; // assigned name, or "reserved (scope F)" / "unassigned (scope 6)"
        c.scopeStatus = scope.status; // lets the UI and the vectors tell a reserved scope from a real one
        const flgs = bytes[1] >> 4; // high nibble of byte 1 is the flag field (RFC 4291 s2.7)
        c.flags = multicastFlags(flgs); // read out bit by bit
        if (flgs === 0x3 && bytes[2] === 0 && bytes[3] === 0) { // the ff3x::/32 test
          // ff3x::/32: P=1, T=1, R=0, X=0 and a zero reserved/plen byte pair (RFC 3306 s6, RFC 4607 s1)
          c.type = "Source-specific multicast"; // RFC 4607: "FF3x::/32 is reserved for source-specific multicast use"
          c.detail = "ff3x::/32"; // the SSM range, x being the scope
          c.ssmRange = ssmRange(bytes); // which part of the SSM range the group ID falls in
        }
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

/**
 * Decode a Teredo address (RFC 4380 s4): 32-bit prefix 2001::/32, the server IPv4 in clear (bits 32 to 63),
 * 16 flag bits (64 to 79), then the client's mapped UDP port (80 to 95) and mapped IPv4 address (96 to 127),
 * both "obfuscated" by XOR with all ones. Flag bits per RFC 5991 s3.1: |C|z|Random1|U|G|Random2|.
 * @param bytes the 16 address bytes
 * @param prefixLength the supplied prefix length, or null
 * @returns the decoded fields, or null when the input is not one 2001::/32 address
 */
function teredoDecode(bytes: number[], prefixLength: number | null): Ipv6Teredo | null { // pure, fixed byte offsets
  if (!inPrefix(bytes, "20010000", 32)) return null; // not in the Teredo prefix
  if (prefixLength !== null && prefixLength !== 128) return null; // a block such as 2001::/32 names no single client
  const server = `${bytes[4]}.${bytes[5]}.${bytes[6]}.${bytes[7]}`; // bits 32 to 63, not obfuscated
  const flagWord = (bytes[8] << 8) | bytes[9]; // bits 64 to 79
  const cone = (bytes[8] & 0x80) !== 0; // C is the first (most significant) flag bit
  const u = (bytes[8] >> 1) & 1; // U is bit 6 of the flag word, counted from 0 at the most significant end
  const g = bytes[8] & 1; // G is bit 7, the last bit of the first flag byte
  const flags = `0x${flagWord.toString(16).padStart(4, "0")} (C=${cone ? 1 : 0}, U=${u}, G=${g})`; // hex plus named bits
  const port = (((bytes[10] << 8) | bytes[11]) ^ 0xffff) & 0xffff; // bits 80 to 95 XOR 0xffff
  const client = [12, 13, 14, 15].map((i) => bytes[i] ^ 0xff).join("."); // bits 96 to 127 XOR 0xffffffff, byte by byte
  return { server, flags, cone, port, client }; // the five decoded components (prefix implied)
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
    teredo: teredoDecode(bytes, prefixLength), // null unless one address in 2001::/32
    reverseDns: reverseDns(bytes),
  };
}
