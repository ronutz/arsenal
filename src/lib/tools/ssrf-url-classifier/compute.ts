// ============================================================================
// src/lib/tools/ssrf-url-classifier/compute.ts
// ----------------------------------------------------------------------------
// Classify where a URL points and flag SSRF (Server-Side Request Forgery) risk,
// entirely locally. Paste a URL and the tool parses it, decodes the classic
// IP-obfuscation tricks attackers use to smuggle an internal address past a
// naive filter (decimal, octal, hex, and short-form IPv4, plus IPv4-mapped
// IPv6), classifies the destination (loopback, private, link-local, cloud
// metadata, CGNAT, reserved, or public), and flags dangerous URL schemes.
//
// 2026-10-19: IPv6 hosts are parsed into their eight 16-bit pieces, so every
// spelling of an address rates the same; IPv6 addresses that carry an IPv4
// address (IPv4-mapped ::ffff:0:0/96, NAT64 64:ff9b::/96 and 64:ff9b:1::/48 with
// the RFC 6052 layouts, 6to4 2002::/16) are rated by that IPv4 address and say
// which embedding was decoded; and 2001:db8::/32, 3fff::/20, 100::/64 and
// 192.0.0.0/24 are rated from their IANA special-purpose registry rows.
//
// IT NEVER RESOLVES DNS AND NEVER ISSUES THE REQUEST (D-53): it is a classifier
// for learning and allow-list design, not a probe. A bare hostname that is not a
// known-special name is reported as "resolves at runtime" - the honest answer,
// since its address is only known after a DNS lookup we deliberately do not do.
//
// IMPORTANT: the destination host is extracted from the RAW input string, not
// from new URL().hostname. The WHATWG URL parser canonicalizes numeric hosts
// (http://2130706433/ -> hostname "127.0.0.1"), which would erase exactly the
// obfuscation this tool exists to reveal. We therefore parse the host ourselves
// and use new URL only for the surrounding structure (scheme, port, userinfo).
// ============================================================================

// ---- Types ------------------------------------------------------------------

export type HostCategory =
  | "loopback"
  | "private"
  | "link-local"
  | "cloud-metadata"
  | "cgnat"
  | "reserved"
  | "public"
  | "internal-name"
  | "unresolved";

export type RiskLevel = "high" | "medium" | "low" | "unknown";

/** The IPv6 layouts that carry an IPv4 address the tool decodes (added 2026-10-19). */
export type Ipv4Embedding = // which embedding was decoded, reported on the result
  | "ipv4-mapped" // ::ffff:0:0/96, RFC 4291 section 2.5.5.2: the IPv4 address is the low 32 bits
  | "nat64-wkp" // 64:ff9b::/96, the RFC 6052 Well-Known Prefix: the IPv4 address is the low 32 bits
  | "nat64-local" // 64:ff9b:1::/48, RFC 8215 local-use prefix, decoded with the RFC 6052 layouts
  | "6to4"; // 2002::/16, RFC 3056 section 2: bits 16 to 47 are the IPv4 address (V4ADDR)

/** One row of the IANA IPv4 or IPv6 Special-Purpose Address Space registry (added 2026-10-19). */
export interface SpecialBlock { // the registry entry the address falls in, as IANA names it
  prefix: string; // the Address Block column, e.g. "2001:db8::/32"
  name: string; // the Name column, verbatim from the registry CSV read 2026-10-19
  rfc: string; // the RFC column, e.g. "RFC 3849"
  globallyReachable: boolean | null; // the Globally Reachable column; null where the registry says N/A
} // end SpecialBlock

export interface SsrfResult {
  input: string;
  /** Parsed URL parts (best-effort). */
  scheme: string | null;
  host: string | null;
  port: string | null;
  path: string | null;
  /** True if the host is (or decodes to) an IP literal. */
  isIp: boolean;
  ipVersion: 4 | 6 | null;
  /** Canonical dotted/colon form of the address, when the host is an IP. */
  canonicalIp: string | null;
  /** True if the host was an obfuscated form of an IP (e.g. 2130706433). */
  obfuscated: boolean;
  /** How the host was written, when obfuscated (decimal / octal / hex / short). */
  obfuscationForm: string | null;
  category: HostCategory;
  risk: RiskLevel;
  /** Plain-language reasons for the classification. */
  reasons: string[];
  /** Non-http(s) scheme that escalates SSRF, when present. */
  schemeFlag: string | null;
  /** True if credentials are embedded in the URL (user:pass@host). */
  hasUserinfo: boolean;
  /** Which IPv4-in-IPv6 embedding was decoded, when the host is such an IPv6 address (2026-10-19). */
  embedding: Ipv4Embedding | null; // null for every host that carries no decoded IPv4 address
  /** The dotted IPv4 address the IPv6 host carries; the rating comes from it (2026-10-19). */
  embeddedIpv4: string | null; // e.g. "127.0.0.1" for [::ffff:7f00:1]
  /** The RFC 6052 prefix length whose layout produced embeddedIpv4 (NAT64 prefixes only). */
  embeddingLayout: number | null; // 96 for 64:ff9b::/96; 48, 56, 64 or 96 for 64:ff9b:1::/48
  /** The IANA special-purpose registry entry the address falls in, when the tool knows it (2026-10-19). */
  specialBlock: SpecialBlock | null; // null for ranges the tool classifies without a registry row
}

// The "nothing embedded" triple, spread into every result that is not an IPv4-in-IPv6 host (2026-10-19).
const NO_EMBEDDING = { embedding: null, embeddedIpv4: null, embeddingLayout: null } as const; // shared constant

// ---- Raw host extraction ----------------------------------------------------
// Pull the authority's host out of the input WITHOUT canonicalizing it, so an
// obfuscated numeric host survives to be decoded below.

function extractRawHost(input: string): string {
  let s = input.trim();
  s = s.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, ""); // scheme://
  s = s.replace(/^\/\//, ""); // protocol-relative //
  s = s.split(/[/?#]/)[0]; // drop path / query / fragment
  const at = s.lastIndexOf("@");
  if (at >= 0) s = s.slice(at + 1); // drop userinfo
  if (s.startsWith("[")) {
    const close = s.indexOf("]");
    s = close >= 0 ? s.slice(1, close) : s.slice(1); // inside [ ] -> IPv6
  } else {
    const colon = s.lastIndexOf(":");
    if (colon >= 0 && /^\d*$/.test(s.slice(colon + 1))) s = s.slice(0, colon); // drop :port
  }
  return s.toLowerCase();
}

// ---- Loose IPv4 parsing (inet_aton semantics) -------------------------------
// inet_aton accepts far more than dotted-decimal: 1, 2, 3, or 4 parts, each in
// decimal, octal (leading 0), or hex (0x), with the final part filling all the
// remaining low octets. This is exactly what SSRF filter bypasses rely on, so
// decoding it is the point.

type IpForm = "dotted" | "decimal" | "octal" | "hex" | "short";

interface LooseIpv4 {
  value: number; // unsigned 32-bit
  form: IpForm;
}

function parsePart(p: string): { n: number; radix: "dec" | "oct" | "hex" } | null {
  if (p === "") return null;
  if (/^0[xX][0-9a-fA-F]+$/.test(p)) return { n: parseInt(p.slice(2), 16), radix: "hex" };
  if (/^0[0-7]+$/.test(p)) return { n: parseInt(p, 8), radix: "oct" }; // 0 + >=1 octal digit
  if (/^(0|[1-9][0-9]*)$/.test(p)) return { n: parseInt(p, 10), radix: "dec" };
  return null;
}

function parseLooseIpv4(host: string): LooseIpv4 | null {
  const parts = host.split(".");
  if (parts.length === 0 || parts.length > 4) return null;

  const parsed: { n: number; radix: "dec" | "oct" | "hex" }[] = [];
  for (const p of parts) {
    const r = parsePart(p);
    if (!r || r.n < 0 || !Number.isFinite(r.n)) return null;
    parsed.push(r);
  }

  // The last part fills the remaining (4 - (n-1)) octets and must fit in them;
  // every earlier part is a single octet (<= 255).
  const n = parsed.length;
  for (let i = 0; i < n - 1; i++) if (parsed[i].n > 255) return null;
  const lastMaxBits = (4 - (n - 1)) * 8;
  const lastMax = lastMaxBits >= 32 ? 0xffffffff : Math.pow(2, lastMaxBits) - 1;
  if (parsed[n - 1].n > lastMax) return null;

  let value = 0;
  for (let i = 0; i < n - 1; i++) value = (value + parsed[i].n * Math.pow(256, 4 - 1 - i)) >>> 0;
  value = (value + parsed[n - 1].n) >>> 0;

  // Describe the written form, by priority: any hex part -> hex; else any octal
  // part -> octal; else all-decimal, judged by how many parts were given.
  const hasHex = parsed.some((p) => p.radix === "hex");
  const hasOct = parsed.some((p) => p.radix === "oct");
  let form: IpForm;
  if (hasHex) form = "hex";
  else if (hasOct) form = "octal";
  else if (n === 4) form = "dotted";
  else form = n === 1 ? "decimal" : "short";

  return { value, form };
}

const toDotted = (v: number): string =>
  [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff].join(".");

// ---- IPv4 classification ----------------------------------------------------

// Known cloud metadata addresses (checked before the broader ranges).
const METADATA_IPV4 = new Set(["169.254.169.254", "100.100.100.200"]);

function inCidr(v: number, base: string, bits: number): boolean {
  const b = parseLooseIpv4(base)!.value;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((v & mask) >>> 0) === ((b & mask) >>> 0);
}

// 192.0.0.0/24, "IETF Protocol Assignments", and the more specific entries IANA lists inside it
// (IANA IPv4 Special-Purpose Address Space CSV, read 2026-10-19). Footnote [2] of that registry
// says the /24 is "Not useable unless by virtue of a more specific reservation", so the most
// specific matching row decides: most rows are not globally reachable (rated reserved), while
// 192.0.0.9/32 and 192.0.0.10/32 are anycast services the registry marks Globally Reachable.
interface Ipv4Row extends SpecialBlock { base: string; bits: number } // a registry row plus its CIDR parts
const IETF_PROTOCOL_ROWS: Ipv4Row[] = [ // most specific first; the covering /24 comes last
  { base: "192.0.0.0", bits: 29, prefix: "192.0.0.0/29", name: "IPv4 Service Continuity Prefix", rfc: "RFC 7335", globallyReachable: false }, // reserved for the DS-Lite B4 element (RFC 7335)
  { base: "192.0.0.8", bits: 32, prefix: "192.0.0.8/32", name: "IPv4 dummy address", rfc: "RFC 7600", globallyReachable: false }, // dummy source address
  { base: "192.0.0.9", bits: 32, prefix: "192.0.0.9/32", name: "Port Control Protocol Anycast", rfc: "RFC 7723", globallyReachable: true }, // PCP anycast, reachable
  { base: "192.0.0.10", bits: 32, prefix: "192.0.0.10/32", name: "Traversal Using Relays around NAT Anycast", rfc: "RFC 8155", globallyReachable: true }, // TURN anycast, reachable
  { base: "192.0.0.170", bits: 31, prefix: "192.0.0.170/32, 192.0.0.171/32", name: "NAT64/DNS64 Discovery", rfc: "RFC 8880; RFC 7050, Section 2.2", globallyReachable: false }, // the ipv4only.arpa well-known addresses
  { base: "192.0.0.0", bits: 24, prefix: "192.0.0.0/24", name: "IETF Protocol Assignments", rfc: "RFC 6890, Section 2.1", globallyReachable: false }, // the covering block
]; // end IETF_PROTOCOL_ROWS

// Strip the CIDR helper fields so only the registry columns travel on the result (2026-10-19).
const asBlock = (r: Ipv4Row): SpecialBlock => ({ prefix: r.prefix, name: r.name, rfc: r.rfc, globallyReachable: r.globallyReachable }); // pure projection

function classifyIpv4(v: number): { category: HostCategory; reason: string; block?: SpecialBlock } { // block added 2026-10-19
  const dotted = toDotted(v);
  if (METADATA_IPV4.has(dotted))
    return { category: "cloud-metadata", reason: `${dotted} is a cloud instance-metadata endpoint (IMDS)` };
  if (inCidr(v, "127.0.0.0", 8)) return { category: "loopback", reason: "127.0.0.0/8 is loopback (the host itself)" };
  if (inCidr(v, "10.0.0.0", 8)) return { category: "private", reason: "10.0.0.0/8 is private (RFC 1918)" };
  if (inCidr(v, "172.16.0.0", 12)) return { category: "private", reason: "172.16.0.0/12 is private (RFC 1918)" };
  if (inCidr(v, "192.168.0.0", 16)) return { category: "private", reason: "192.168.0.0/16 is private (RFC 1918)" };
  if (inCidr(v, "169.254.0.0", 16)) return { category: "link-local", reason: "169.254.0.0/16 is link-local (RFC 3927)" };
  if (inCidr(v, "100.64.0.0", 10)) return { category: "cgnat", reason: "100.64.0.0/10 is carrier-grade NAT (RFC 6598)" };
  if (inCidr(v, "0.0.0.0", 8)) return { category: "reserved", reason: '0.0.0.0/8 is reserved ("this" network)' };
  if (inCidr(v, "192.0.2.0", 24) || inCidr(v, "198.51.100.0", 24) || inCidr(v, "203.0.113.0", 24))
    return { category: "reserved", reason: "a documentation range (TEST-NET, RFC 5737)" };
  const ietfRow = IETF_PROTOCOL_ROWS.find((r) => inCidr(v, r.base, r.bits)); // most specific 192.0.0.0/24 row, if any (2026-10-19)
  if (ietfRow) { // the address is inside 192.0.0.0/24, IETF Protocol Assignments
    const reachable = ietfRow.globallyReachable === true; // only the two anycast rows are Globally Reachable
    return { // the registry row decides the category
      category: reachable ? "public" : "reserved", // reserved = not globally reachable per the IANA registry
      reason: `${dotted} is in ${ietfRow.prefix}, "${ietfRow.name}" (${ietfRow.rfc}), which the IANA IPv4 Special-Purpose Address Space registry marks ${reachable ? "globally reachable" : "not globally reachable"}`, // names the row
      block: asBlock(ietfRow), // the registry columns, shown by the component
    }; // end 192.0.0.0/24 result
  } // end 192.0.0.0/24 branch
  if (inCidr(v, "198.18.0.0", 15)) return { category: "reserved", reason: "198.18.0.0/15 is benchmarking (RFC 2544)" };
  if (inCidr(v, "224.0.0.0", 4)) return { category: "reserved", reason: "224.0.0.0/4 is multicast" };
  if (inCidr(v, "240.0.0.0", 4)) return { category: "reserved", reason: "240.0.0.0/4 is reserved for future use" };
  if (dotted === "255.255.255.255") return { category: "reserved", reason: "255.255.255.255 is the broadcast address" };
  return { category: "public", reason: `${dotted} is a public, routable address` };
}

// ---- IPv6 classification ----------------------------------------------------

// REWRITTEN 2026-10-19 (PRIME: "Fix all ten"). The previous version compared the
// lowercased TEXT of the host against a few literal spellings, so any other
// spelling of the same address slipped through as public: [0:0:0:0:0:0:0:1] was
// not ::1, [::ffff:7f00:1] was not the IPv4-mapped loopback, and NAT64 / 6to4
// addresses carrying an internal IPv4 address were never decoded. The host is
// now parsed into its eight 16-bit pieces (RFC 4291 section 2.2 text forms) and
// every rule below tests the numbers, so the spelling no longer matters.

const MAX_IPV6_TEXT = 64; // longest legal RFC 4291 text is 45 characters; anything longer is refused before any regex runs

// Strict dotted-decimal IPv4 for the trailing "d.d.d.d" of an IPv6 text form (RFC 4291 section 2.2, form 3).
// Each part is 1 to 3 decimal digits, at most 255, with no leading zero (the WHATWG IPv6 parser refuses one too).
function parseStrictDotted(s: string): number | null { // returns the unsigned 32-bit value, or null when not strict
  const parts = s.split("."); // four decimal parts expected
  if (parts.length !== 4) return null; // the embedded form is always a full dotted quad
  let value = 0; // accumulates the 32-bit address
  for (const p of parts) { // validate and fold each octet
    if (!/^(0|[1-9][0-9]{0,2})$/.test(p)) return null; // anchored, bounded class: ReDoS-safe
    const n = parseInt(p, 10); // decimal octet
    if (n > 255) return null; // out of octet range
    value = (value * 256 + n) >>> 0; // shift in the octet, kept unsigned
  } // end octet loop
  return value; // the dotted quad as a number
} // end parseStrictDotted

// The dotted tail of an IPv6 text form. Strict decimal first; failing that, a four-part
// all-digit quad is read with inet_aton rules (so 0177 is octal 127), which is what the
// pre-2026-10-19 code did for ::ffff:a.b.c.d. A strict parser such as the WHATWG one refuses
// that spelling, but another parser on the server may not, so the conservative reading is kept.
function parseDottedTail(s: string): number | null { // unsigned 32-bit value, or null
  const strict = parseStrictDotted(s); // the RFC 4291 form
  if (strict !== null) return strict; // the normal case
  if (!/^[0-9]{1,12}\.[0-9]{1,12}\.[0-9]{1,12}\.[0-9]{1,12}$/.test(s)) return null; // bounded digits only: ReDoS-safe
  const loose = parseLooseIpv4(s); // inet_aton semantics, octal for a leading zero
  return loose === null ? null : loose.value; // the decoded value, or null when out of range
} // end parseDottedTail

// Parse one side of a "::" split into 16-bit pieces. allowDotted is true only for the
// side that ends the address, because the dotted IPv4 form may appear only last.
function parseIpv6Side(side: string, allowDotted: boolean): number[] | null { // null on any malformed piece
  if (side === "") return []; // an empty side contributes no pieces (e.g. the left of "::1")
  const parts = side.split(":"); // single colons separate pieces
  const out: number[] = []; // the 16-bit pieces of this side
  for (let i = 0; i < parts.length; i++) { // walk each piece
    const p = parts[i]; // the piece text
    if (p.includes(".")) { // a dotted IPv4 tail occupies two pieces
      if (!allowDotted || i !== parts.length - 1) return null; // only legal as the very last piece of the address
      const v4 = parseDottedTail(p); // strict decimal quad, or the legacy leading-zero spelling
      if (v4 === null) return null; // malformed quad
      out.push(Math.floor(v4 / 65536), v4 % 65536); // high and low 16 bits
    } else { // an ordinary hexadecimal piece
      if (!/^[0-9a-f]{1,4}$/.test(p)) return null; // 1 to 4 hex digits, anchored and bounded: ReDoS-safe
      out.push(parseInt(p, 16)); // the 16-bit value
    } // end piece kinds
  } // end piece loop
  return out; // pieces in order
} // end parseIpv6Side

// Parse an IPv6 host into exactly eight 16-bit pieces, or null when it is not a valid
// RFC 4291 text form. A zone id ("%eth0") is dropped first, as before.
function parseIpv6(host: string): number[] | null { // the normaliser every IPv6 rule now relies on
  const h = host.replace(/%.*$/, "").toLowerCase(); // drop the zone id; linear, no backtracking
  if (h.length === 0 || h.length > MAX_IPV6_TEXT) return null; // empty or implausibly long
  if (!/^[0-9a-f:.]+$/.test(h) || !h.includes(":")) return null; // IPv6 alphabet only, and at least one colon
  const halves = h.split("::"); // "::" may appear at most once
  if (halves.length > 2) return null; // two "::" make the address ambiguous (RFC 4291 section 2.2)
  if (halves.length === 1) { // no compression: all eight pieces must be written
    const all = parseIpv6Side(h, true); // the dotted tail is allowed at the end
    return all !== null && all.length === 8 ? all : null; // exactly 128 bits or nothing
  } // end uncompressed form
  const head = parseIpv6Side(halves[0], false); // left of "::" can never end the address
  const tail = parseIpv6Side(halves[1], true); // right of "::" ends the address
  if (head === null || tail === null) return null; // a malformed side
  const fill = 8 - head.length - tail.length; // how many zero pieces "::" stands for
  if (fill < 1) return null; // "::" must stand for at least one piece (the WHATWG parser agrees)
  return [...head, ...new Array<number>(fill).fill(0), ...tail]; // the eight pieces
} // end parseIpv6

// The 16 bytes of the address, for the RFC 6052 layouts that cut across piece boundaries.
const ipv6Bytes = (g: number[]): number[] => g.flatMap((x) => [x >>> 8, x & 0xff]); // big-endian byte order

// Four bytes to a 32-bit IPv4 value.
const bytesToV4 = (a: number, b: number, c: number, d: number): number => ((a * 256 + b) * 256 + c) * 256 + d; // unsigned, no sign bit trouble

// RFC 5952 canonical text: lowercase, leading zeros dropped (section 4.1), the longest run of
// two or more zero pieces compressed to "::", the first run on a tie (sections 4.2.1 to 4.2.3).
// Section 5 recommends mixed notation where a well-known prefix marks an embedded IPv4 address,
// and RFC 6052 section 2.4 allows it for the Well-Known Prefix, so ::ffff:0:0/96 and 64:ff9b::/96
// are written with a dotted tail (::ffff:127.0.0.1, 64:ff9b::127.0.0.1).
function formatIpv6(g: number[]): string { // canonical form shown as the decoded address
  const low = toDotted(bytesToV4(g[6] >>> 8, g[6] & 0xff, g[7] >>> 8, g[7] & 0xff)); // the low 32 bits as dotted quad
  if (isMapped(g)) return "::ffff:" + low; // RFC 5952 section 5 example form
  if (isNat64Wkp(g)) return "64:ff9b::" + low; // RFC 6052 section 2.4, Table 2 form
  let bestStart = -1; // start of the longest zero run found so far
  let bestLen = 0; // its length
  for (let i = 0; i < 8; ) { // scan for zero runs
    if (g[i] !== 0) { i++; continue; } // not a zero piece
    let j = i; // run end cursor
    while (j < 8 && g[j] === 0) j++; // extend the run
    if (j - i > bestLen) { bestStart = i; bestLen = j - i; } // strictly longer wins, so the first run wins a tie
    i = j; // continue after the run
  } // end run scan
  const hex = g.map((x) => x.toString(16)); // leading zeros suppressed, lowercase
  if (bestLen < 2) return hex.join(":"); // a single zero piece is never compressed (section 4.2.2)
  const left = hex.slice(0, bestStart).join(":"); // pieces before the run
  const right = hex.slice(bestStart + bestLen).join(":"); // pieces after the run
  return left + "::" + right; // the compressed form
} // end formatIpv6

// Prefix tests on the eight pieces (each names the registry row it implements).
const isMapped = (g: number[]): boolean => g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0xffff; // ::ffff:0:0/96
const isNat64Wkp = (g: number[]): boolean => g[0] === 0x64 && g[1] === 0xff9b && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0; // 64:ff9b::/96
const isNat64Local = (g: number[]): boolean => g[0] === 0x64 && g[1] === 0xff9b && g[2] === 1; // 64:ff9b:1::/48
const is6to4 = (g: number[]): boolean => g[0] === 0x2002; // 2002::/16

// IANA IPv6 Special-Purpose Address Space rows the classifier uses (CSV read 2026-10-19).
const V6_ROWS = { // name and RFC columns verbatim from the registry
  loopback: { prefix: "::1/128", name: "Loopback Address", rfc: "RFC 4291", globallyReachable: false }, // ::1
  unspecified: { prefix: "::/128", name: "Unspecified Address", rfc: "RFC 4291", globallyReachable: false }, // ::
  mapped: { prefix: "::ffff:0:0/96", name: "IPv4-mapped Address", rfc: "RFC 4291", globallyReachable: false }, // IPv4-mapped
  wkp: { prefix: "64:ff9b::/96", name: "IPv4-IPv6 Translat.", rfc: "RFC 6052", globallyReachable: true }, // NAT64 Well-Known Prefix
  local: { prefix: "64:ff9b:1::/48", name: "IPv4-IPv6 Translat.", rfc: "RFC 8215", globallyReachable: false }, // local-use translation prefix
  discard: { prefix: "100::/64", name: "Discard-Only Address Block", rfc: "RFC 6666", globallyReachable: false }, // remote-triggered black hole
  doc32: { prefix: "2001:db8::/32", name: "Documentation", rfc: "RFC 3849", globallyReachable: false }, // the original documentation prefix
  sixToFour: { prefix: "2002::/16", name: "6to4", rfc: "RFC 3056", globallyReachable: null }, // registry says N/A, see RFC 3056
  doc20: { prefix: "3fff::/20", name: "Documentation", rfc: "RFC 9637", globallyReachable: false }, // the 2024 documentation prefix
} satisfies Record<string, SpecialBlock>; // typed as registry rows

// How seriously each category points inside, used to pick among RFC 6052 layout candidates
// for 64:ff9b:1::/48, whose prefix length the operator chooses (RFC 8215 section 5).
const INTERNAL_RANK: Record<HostCategory, number> = { // higher = more clearly internal
  "cloud-metadata": 7, // credentials live here
  loopback: 6, // the server itself
  "link-local": 5, // the local segment
  private: 4, // RFC 1918 / ULA
  "internal-name": 4, // not produced for addresses; listed for completeness of the record
  reserved: 3, // not globally reachable
  cgnat: 2, // shared address space
  public: 1, // globally reachable
  unresolved: 0, // not produced for addresses
}; // end INTERNAL_RANK

// The IPv4 address an RFC 6052 layout carries, or null when bits 64 to 71 (the "u" octet,
// which RFC 6052 section 2.2 says MUST be zero) are set. Prefix lengths 48, 56, 64 and 96 are
// the RFC 6052 lengths that fit inside a /48.
function rfc6052Extract(b: number[], pl: 48 | 56 | 64 | 96): number | null { // b = the 16 address bytes
  if (b[8] !== 0) return null; // the u octet is not zero: no RFC 6052 layout applies (for a /96 NSP too, section 2.2)
  if (pl === 96) return bytesToV4(b[12], b[13], b[14], b[15]); // bits 96 to 127
  if (pl === 64) return bytesToV4(b[9], b[10], b[11], b[12]); // bits 72 to 103
  if (pl === 56) return bytesToV4(b[7], b[9], b[10], b[11]); // bits 56 to 63, then 72 to 95
  return bytesToV4(b[6], b[7], b[9], b[10]); // /48: bits 48 to 63, then 72 to 87
} // end rfc6052Extract

interface V6Class { // what classifyIpv6 hands back to classifyUrl (reshaped 2026-10-19)
  category: HostCategory; // the final category
  reasons: string[]; // plain-language reasons, embedding first
  canonical: string; // RFC 5952 canonical text
  block: SpecialBlock | null; // the IANA row, when known
  embedding: Ipv4Embedding | null; // which embedding was decoded
  embeddedIpv4: string | null; // the decoded dotted quad
  embeddingLayout: number | null; // RFC 6052 prefix length, NAT64 prefixes only
} // end V6Class

// Rate an IPv6 address by the IPv4 address it carries.
function fromEmbedded( // builds the V6Class for every embedding kind
  canonical: string, // RFC 5952 text of the IPv6 address
  block: SpecialBlock, // its IANA row
  embedding: Ipv4Embedding, // which layout carried the IPv4 address
  v4: number, // the decoded IPv4 value
  layout: number | null, // RFC 6052 prefix length, or null
  lead: string, // the embedding sentence
): V6Class { // the rated result
  const inner = classifyIpv4(v4); // the IPv4 rating decides
  return { category: inner.category, reasons: [lead, inner.reason], canonical, block, embedding, embeddedIpv4: toDotted(v4), embeddingLayout: layout }; // rated by the carried address
} // end fromEmbedded

function classifyIpv6(host: string): V6Class | null { // null when the host is not a valid IPv6 text form
  const g = parseIpv6(host); // eight 16-bit pieces, spelling normalised away
  if (g === null) return null; // not IPv6
  const canonical = formatIpv6(g); // RFC 5952 text
  const plain = (category: HostCategory, reason: string, block: SpecialBlock | null = null): V6Class => // helper for non-embedding results
    ({ category, reasons: [reason], canonical, block, ...NO_EMBEDDING }); // nothing embedded
  if (g.every((x) => x === 0)) return plain("reserved", ":: is the unspecified address", V6_ROWS.unspecified); // ::/128, any spelling
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return plain("loopback", "::1 is IPv6 loopback", V6_ROWS.loopback); // ::1/128, any spelling, e.g. 0:0:0:0:0:0:0:1
  if (canonical === "fd00:ec2::254") return plain("cloud-metadata", "fd00:ec2::254 is the AWS IMDSv6 metadata endpoint"); // any spelling of the IMDSv6 address
  const v4low = bytesToV4(g[6] >>> 8, g[6] & 0xff, g[7] >>> 8, g[7] & 0xff); // the low 32 bits, used by two embeddings
  if (isMapped(g)) // ::ffff:0:0/96 (RFC 4291 section 2.5.5.2)
    return fromEmbedded(canonical, V6_ROWS.mapped, "ipv4-mapped", v4low, null, `an IPv4-mapped IPv6 address (::ffff:0:0/96, RFC 4291 section 2.5.5.2) carrying ${toDotted(v4low)} in its low 32 bits`); // rated by the IPv4 address
  if (isNat64Wkp(g)) { // 64:ff9b::/96, the RFC 6052 Well-Known Prefix
    const r = fromEmbedded(canonical, V6_ROWS.wkp, "nat64-wkp", v4low, 96, `a NAT64 address under the Well-Known Prefix 64:ff9b::/96 (RFC 6052) carrying ${toDotted(v4low)} in its low 32 bits`); // rated by the IPv4 address
    if (r.category !== "public") r.reasons.push("RFC 6052 section 3.1 says the Well-Known Prefix MUST NOT represent non-global IPv4 addresses and translators MUST drop such packets; the address still names that internal target, so a filter must reject it"); // why it is still dangerous
    return r; // WKP result
  } // end WKP
  if (isNat64Local(g)) { // 64:ff9b:1::/48 (RFC 8215): the operator picks the prefix length inside it
    const b = ipv6Bytes(g); // byte view for the cross-piece layouts
    const at96 = rfc6052Extract(b, 96); // the /96 reading, also the fallback when no reading points inside
    if (at96 === null) // no RFC 6052 layout fits (bits 64 to 71 set)
      return plain("reserved", "64:ff9b:1::/48 is the local-use IPv4/IPv6 translation prefix (RFC 8215), not globally reachable per the IANA IPv6 Special-Purpose Address Space registry; bits 64 to 71 are not zero, so no RFC 6052 layout carries an IPv4 address", V6_ROWS.local); // reserved, nothing decoded
    let best: { pl: number; v4: number; rank: number } | null = null; // the most internal reading that is MORE internal than reserved
    for (const pl of [96, 64, 56, 48] as const) { // longest prefix first, so it wins a tie
      const v4 = rfc6052Extract(b, pl); // the candidate IPv4 address (never null here: the u octet is zero)
      if (v4 === null) continue; // defensive: keeps the type narrow
      const rank = INTERNAL_RANK[classifyIpv4(v4).category]; // how internal it is
      if (rank <= INTERNAL_RANK.reserved) continue; // zero bits read as 0.0.0.0/8 are layout artefacts, not targets
      if (best === null || rank > best.rank) best = { pl, v4, rank }; // keep the strictly more internal one
    } // end layout loop
    const pick = best ?? { pl: 96, v4: at96 }; // nothing points inside: report the /96 reading
    const why = best ? `the most internal of the /96, /64, /56 and /48 readings` : `no /96, /64, /56 or /48 reading points at an internal range`; // which rule picked it
    const r = fromEmbedded(canonical, V6_ROWS.local, "nat64-local", pick.v4, pick.pl, `an address in the local-use translation prefix 64:ff9b:1::/48 (RFC 8215); read with the RFC 6052 /${pick.pl} layout it carries ${toDotted(pick.v4)} (${why}), because RFC 8215 section 5 leaves the prefix length to the operator`); // the chosen reading
    if (INTERNAL_RANK[r.category] < INTERNAL_RANK.reserved) { // the carried address is public or CGNAT
      r.category = "reserved"; // the /48 itself is not globally reachable, so it is never rated public
      r.reasons.push("the IANA IPv6 Special-Purpose Address Space registry marks 64:ff9b:1::/48 not globally reachable, so the address is rated reserved"); // the floor's reason
    } // end floor
    return r; // local-use result
  } // end local-use
  if (is6to4(g)) { // 2002::/16: V4ADDR sits in bits 16 to 47 (RFC 3056 section 2)
    const v4 = bytesToV4(g[1] >>> 8, g[1] & 0xff, g[2] >>> 8, g[2] & 0xff); // pieces 1 and 2
    return fromEmbedded(canonical, V6_ROWS.sixToFour, "6to4", v4, null, `a 6to4 address (2002::/16, RFC 3056 section 2) whose bits 16 to 47 carry ${toDotted(v4)}`); // rated by the IPv4 address
  } // end 6to4
  if (g[0] === 0x2001 && g[1] === 0x0db8) return plain("reserved", '2001:db8::/32 is "Documentation" (RFC 3849), not globally reachable per the IANA IPv6 Special-Purpose Address Space registry', V6_ROWS.doc32); // documentation
  if (g[0] === 0x3fff && g[1] >>> 12 === 0) return plain("reserved", '3fff::/20 is "Documentation" (RFC 9637), not globally reachable per the IANA IPv6 Special-Purpose Address Space registry', V6_ROWS.doc20); // first 20 bits are 3fff:0
  if (g[0] === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return plain("reserved", '100::/64 is the "Discard-Only Address Block" (RFC 6666), not globally reachable per the IANA IPv6 Special-Purpose Address Space registry', V6_ROWS.discard); // black-hole prefix
  if ((g[0] & 0xfe00) === 0xfc00) return plain("private", "fc00::/7 is a unique local address (ULA)"); // numeric test: the old text test also matched "fc::1"
  if ((g[0] & 0xffc0) === 0xfe80) return plain("link-local", "fe80::/10 is link-local"); // numeric /10 test
  if ((g[0] & 0xff00) === 0xff00) return plain("reserved", "ff00::/8 is multicast"); // numeric /8 test
  return plain("public", "a public, routable IPv6 address"); // nothing special matched
} // end classifyIpv6

// ---- Hostname classification ------------------------------------------------

const METADATA_NAMES = new Set(["metadata.google.internal", "metadata"]);

function classifyHostname(host: string): { category: HostCategory; reason: string } {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (h === "localhost" || h === "localhost.localdomain")
    return { category: "loopback", reason: '"localhost" resolves to loopback' };
  if (METADATA_NAMES.has(h))
    return { category: "cloud-metadata", reason: `"${h}" is a cloud metadata hostname (resolves to the IMDS address)` };
  if (/\.(internal|local|localhost|intranet|corp|home|lan)$/.test(h))
    return { category: "internal-name", reason: `the .${h.split(".").pop()} suffix denotes an internal / non-public name` };
  return {
    category: "unresolved",
    reason: "a hostname whose address is only known after a DNS lookup, which this tool does not perform",
  };
}

// ---- Risk mapping -----------------------------------------------------------

function riskFor(category: HostCategory): RiskLevel {
  switch (category) {
    case "loopback":
    case "private":
    case "link-local":
    case "cloud-metadata":
    case "reserved":
    case "internal-name":
      return "high";
    case "cgnat":
      return "medium";
    case "public":
      return "low";
    case "unresolved":
      return "unknown";
  }
}

const DANGEROUS_SCHEMES = new Set(["file", "gopher", "dict", "ftp", "ldap", "tftp", "sftp", "netdoc", "jar"]);

function withSchemeReason(reasons: string[], schemeFlag: string | null): string[] {
  if (!schemeFlag) return reasons;
  return [...reasons, `the ${schemeFlag}:// scheme is a common SSRF escalation vector (it can reach the local filesystem or internal services)`];
}

// ---- Entry point ------------------------------------------------------------

export function classifyUrl(input: string): SsrfResult {
  const raw = input.trim();
  if (raw === "") throw new Error("Enter a URL or host to classify.");

  const hadScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw);

  // Structure (scheme / port / path / userinfo) from new URL; host from the raw
  // string so obfuscation is preserved.
  let scheme: string | null = null;
  let port: string | null = null;
  let path: string | null = null;
  let hasUserinfo = false;
  try {
    const u = new URL(hadScheme ? raw : "http://" + raw);
    scheme = hadScheme ? u.protocol.replace(/:$/, "") : null;
    port = u.port || null;
    const p = (u.pathname === "/" ? "" : u.pathname || "") + (u.search || "");
    path = p || null;
    hasUserinfo = Boolean(u.username || u.password);
  } catch {
    const m = raw.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    if (m) scheme = m[1];
  }

  const host = extractRawHost(raw);
  const schemeFlag = scheme && DANGEROUS_SCHEMES.has(scheme.toLowerCase()) ? scheme.toLowerCase() : null;
  const base = { input: raw, scheme, port, path, hasUserinfo, schemeFlag };

  // file:// (and empty-host dangerous schemes) address the local machine.
  if (schemeFlag === "file" && (host === "" || host === "localhost")) {
    return {
      ...base,
      host: host || null,
      isIp: false,
      ipVersion: null,
      canonicalIp: null,
      obfuscated: false,
      obfuscationForm: null,
      category: "loopback",
      risk: "high",
      reasons: ["the file:// scheme addresses the local filesystem directly, not a network host"],
      ...NO_EMBEDDING, // no IPv6 host, nothing embedded (field added 2026-10-19)
      specialBlock: null, // no address, no registry row (field added 2026-10-19)
    };
  }

  // IPv6 literal (a colon only ever appears in an IPv6 host; the port colon has
  // already been stripped by extractRawHost).
  if (host.includes(":")) {
    const v6 = classifyIpv6(host); // parsed and rated on the numbers, any spelling (2026-10-19)
    if (v6) { // a valid IPv6 literal
      const risk = schemeFlag ? "high" : riskFor(v6.category); // the existing risk scale, unchanged
      return { // the IPv6 result
        ...base, // scheme, port, path, userinfo
        host, // as written
        isIp: true, // an address literal
        ipVersion: 6, // IPv6
        canonicalIp: v6.canonical, // RFC 5952 canonical text (was the lowercased input before 2026-10-19)
        obfuscated: false, // spelling variants are normalised, not flagged as obfuscation
        obfuscationForm: null, // only the IPv4 inet_aton forms carry a form name
        category: v6.category, // rated by the embedded IPv4 address when there is one
        risk, // from the category, or high for a dangerous scheme
        reasons: withSchemeReason(v6.reasons, schemeFlag), // embedding reason first, then the rating reason
        embedding: v6.embedding, // which embedding was decoded, or null
        embeddedIpv4: v6.embeddedIpv4, // the carried IPv4 address, or null
        embeddingLayout: v6.embeddingLayout, // RFC 6052 prefix length for NAT64 prefixes, or null
        specialBlock: v6.block, // the IANA IPv6 registry row, or null
      }; // end IPv6 result
    } // end IPv6 literal
  }

  // IPv4 literal or obfuscated IPv4.
  const v4 = parseLooseIpv4(host);
  if (v4) {
    const dotted = toDotted(v4.value);
    const obfuscated = v4.form !== "dotted";
    const { category, reason, block } = classifyIpv4(v4.value); // block: the 192.0.0.0/24 registry row, when any (2026-10-19)
    const reasons = [reason];
    if (obfuscated)
      reasons.unshift(
        `the host is a ${v4.form} encoding of ${dotted} - a common way to hide an internal address from a filter`,
      );
    const risk = schemeFlag ? "high" : riskFor(category);
    return {
      ...base,
      host,
      isIp: true,
      ipVersion: 4,
      canonicalIp: dotted,
      obfuscated,
      obfuscationForm: obfuscated ? v4.form : null,
      category,
      risk,
      reasons: withSchemeReason(reasons, schemeFlag),
      ...NO_EMBEDDING, // an IPv4 host embeds nothing (field added 2026-10-19)
      specialBlock: block ?? null, // the IANA IPv4 registry row, when the tool names one (2026-10-19)
    };
  }

  // No host at all (e.g. a bare scheme).
  if (host === "") {
    return {
      ...base,
      host: null,
      isIp: false,
      ipVersion: null,
      canonicalIp: null,
      obfuscated: false,
      obfuscationForm: null,
      category: "unresolved",
      risk: schemeFlag ? "high" : "unknown",
      reasons: withSchemeReason(["no host is present in the input"], schemeFlag),
      ...NO_EMBEDDING, // no host, nothing embedded (field added 2026-10-19)
      specialBlock: null, // no address, no registry row (field added 2026-10-19)
    };
  }

  // Hostname.
  const { category, reason } = classifyHostname(host);
  const risk = schemeFlag ? "high" : riskFor(category);
  return {
    ...base,
    host,
    isIp: false,
    ipVersion: null,
    canonicalIp: null,
    obfuscated: false,
    obfuscationForm: null,
    category,
    risk,
    reasons: withSchemeReason([reason], schemeFlag),
    ...NO_EMBEDDING, // a hostname embeds nothing (field added 2026-10-19)
    specialBlock: null, // no address, no registry row (field added 2026-10-19)
  };
}
