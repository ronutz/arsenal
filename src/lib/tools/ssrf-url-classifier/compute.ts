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
// 2026-10-19b (PRIME: "adopt the fullest, most complete, most accurate options"):
// EVERY row of the IANA IPv4 and IPv6 Special-Purpose Address Space registries
// (CSVs read 2026-10-19, registries updated 2025-10-09) is now a table row here,
// matched most specific first and rated by its own name and Globally Reachable
// flag, so no listed block falls through to the generic "public" answer. Rows the
// registry marks Globally Reachable True (the anycast service addresses, AS112,
// AMT, ORCHIDv2, DETs) still rate public, but are named, and the anycast service
// addresses are flagged as such. Two more IPv4-in-IPv6 embeddings are decoded:
// IPv4-compatible ::a.b.c.d (RFC 4291 section 2.5.5.1, deprecated) and Teredo
// 2001::/32 (RFC 4380 section 4, updated by RFC 5991), whose server address and
// XOR-obfuscated client address are both shown, the more internal one deciding.
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
  | "6to4" // 2002::/16, RFC 3056 section 2: bits 16 to 47 are the IPv4 address (V4ADDR)
  | "ipv4-compatible" // ::/96 (not :: or ::1), RFC 4291 section 2.5.5.1, deprecated: the low 32 bits (added 2026-10-19b)
  | "teredo"; // 2001::/32, RFC 4380 section 4: server IPv4 in bits 32 to 63, client IPv4 XOR 0xFFFFFFFF in bits 96 to 127 (added 2026-10-19b)

/** The fields of a Teredo address, decoded per RFC 4380 section 4 as updated by RFC 5991 (added 2026-10-19b). */
export interface TeredoParts { // shown beside the rating so the reader sees both carried addresses
  serverIpv4: string; // bits 32 to 63, the Teredo server, stored as is
  clientIpv4: string; // bits 96 to 127 XOR 0xFFFFFFFF, the client's mapped (external) IPv4 address
  clientPort: number; // bits 80 to 95 XOR 0xFFFF, the client's mapped UDP port
  flags: number; // bits 64 to 79, the Flags field (cone bit, U/G bits, RFC 5991 random bits)
} // end TeredoParts

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
  /** The IANA IPv4 registry row of the carried IPv4 address, for an IPv4-in-IPv6 host (2026-10-19b). */
  embeddedSpecialBlock: SpecialBlock | null; // e.g. 10.0.0.0/8 Private-Use for [::ffff:10.0.0.1]; null when none applies
  /** Both IPv4 addresses and the port a Teredo address carries (2026-10-19b). */
  teredo: TeredoParts | null; // null unless embedding is "teredo"
  /** True when the address that decides the rating is a registry anycast service address (2026-10-19b). */
  anycastService: boolean; // PCP, TURN, DNS-SD SRP and 6a44-relay anycast rows; false otherwise
}

// The "nothing embedded" set, spread into every result that is not an IPv4-in-IPv6 host (2026-10-19, widened 2026-10-19b).
const NO_EMBEDDING = { embedding: null, embeddedIpv4: null, embeddingLayout: null, embeddedSpecialBlock: null, teredo: null } as const; // shared constant

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

// REWRITTEN 2026-10-19b: every row of the IANA IPv4 Special-Purpose Address Space registry
// (CSV read 2026-10-19, registry updated 2025-10-09), in the registry's own order. Name and RFC
// are the CSV columns verbatim (brackets dropped, footnote markers dropped); globallyReachable is
// the Globally Reachable column (null where the registry removed the booleans: RFC 7526 section 7
// did that for the deprecated 192.88.99.0/24). The tool's own columns: the category it gives the
// row, a plain-language note, and whether the row is an anycast service address. A row is rated
// reserved when the registry says it is not globally reachable, unless a more telling category
// exists (loopback, private, link-local, CGNAT); Globally Reachable True rates public, named.
interface Ipv4Row extends SpecialBlock { // a registry row plus the tool's columns
  base: string; // the network address of the block, dotted
  bits: number; // its prefix length
  category: HostCategory; // the category the tool gives an address in this row
  note: string; // the plain-language lead of the reason
  anycastService: boolean; // true for the registry's anycast service rows
} // end Ipv4Row
const IPV4_REGISTRY: Ipv4Row[] = [ // the 25 rows, registry order (the lookup below sorts most specific first)
  { base: "0.0.0.0", bits: 8, prefix: "0.0.0.0/8", name: '"This network"', rfc: "RFC 791, Section 3.2", globallyReachable: false, category: "reserved", note: '0.0.0.0/8 is reserved ("this" network)', anycastService: false }, // source-only block
  { base: "0.0.0.0", bits: 32, prefix: "0.0.0.0/32", name: '"This host on this network"', rfc: "RFC 1122, Section 3.2.1.3", globallyReachable: false, category: "reserved", note: '0.0.0.0 is "this host on this network", which RFC 1122 section 3.2.1.3 says MUST NOT be sent except as a source address', anycastService: false }, // the all-zeros address
  { base: "10.0.0.0", bits: 8, prefix: "10.0.0.0/8", name: "Private-Use", rfc: "RFC 1918", globallyReachable: false, category: "private", note: "10.0.0.0/8 is private (RFC 1918)", anycastService: false }, // RFC 1918
  { base: "100.64.0.0", bits: 10, prefix: "100.64.0.0/10", name: "Shared Address Space", rfc: "RFC 6598", globallyReachable: false, category: "cgnat", note: "100.64.0.0/10 is carrier-grade NAT (RFC 6598)", anycastService: false }, // CGNAT
  { base: "127.0.0.0", bits: 8, prefix: "127.0.0.0/8", name: "Loopback", rfc: "RFC 1122, Section 3.2.1.3", globallyReachable: false, category: "loopback", note: "127.0.0.0/8 is loopback (the host itself)", anycastService: false }, // loopback
  { base: "169.254.0.0", bits: 16, prefix: "169.254.0.0/16", name: "Link Local", rfc: "RFC 3927", globallyReachable: false, category: "link-local", note: "169.254.0.0/16 is link-local (RFC 3927)", anycastService: false }, // link-local
  { base: "172.16.0.0", bits: 12, prefix: "172.16.0.0/12", name: "Private-Use", rfc: "RFC 1918", globallyReachable: false, category: "private", note: "172.16.0.0/12 is private (RFC 1918)", anycastService: false }, // RFC 1918
  { base: "192.0.0.0", bits: 24, prefix: "192.0.0.0/24", name: "IETF Protocol Assignments", rfc: "RFC 6890, Section 2.1", globallyReachable: false, category: "reserved", note: '192.0.0.0/24 is "Not useable unless by virtue of a more specific reservation" (registry footnote [2])', anycastService: false }, // the covering block
  { base: "192.0.0.0", bits: 29, prefix: "192.0.0.0/29", name: "IPv4 Service Continuity Prefix", rfc: "RFC 7335", globallyReachable: false, category: "reserved", note: "192.0.0.0/29 is the IPv4 Service Continuity Prefix (RFC 7335)", anycastService: false }, // DS-Lite B4 addressing
  { base: "192.0.0.8", bits: 32, prefix: "192.0.0.8/32", name: "IPv4 dummy address", rfc: "RFC 7600", globallyReachable: false, category: "reserved", note: "192.0.0.8 is the IPv4 dummy address (RFC 7600)", anycastService: false }, // dummy source address
  { base: "192.0.0.9", bits: 32, prefix: "192.0.0.9/32", name: "Port Control Protocol Anycast", rfc: "RFC 7723", globallyReachable: true, category: "public", note: "192.0.0.9 is a special-purpose anycast service address: the PCP anycast address, answered by the nearest PCP-aware NAT or firewall (RFC 7723)", anycastService: true }, // PCP anycast
  { base: "192.0.0.10", bits: 32, prefix: "192.0.0.10/32", name: "Traversal Using Relays around NAT Anycast", rfc: "RFC 8155", globallyReachable: true, category: "public", note: "192.0.0.10 is a special-purpose anycast service address: the TURN anycast address, answered by the topologically nearest TURN server (RFC 8155)", anycastService: true }, // TURN anycast
  { base: "192.0.0.170", bits: 31, prefix: "192.0.0.170/32, 192.0.0.171/32", name: "NAT64/DNS64 Discovery", rfc: "RFC 8880; RFC 7050, Section 2.2", globallyReachable: false, category: "reserved", note: "192.0.0.170 and 192.0.0.171 are the well-known addresses of ipv4only.arpa (RFC 7050, RFC 8880)", anycastService: false }, // the /31 holds exactly .170 and .171
  { base: "192.0.2.0", bits: 24, prefix: "192.0.2.0/24", name: "Documentation (TEST-NET-1)", rfc: "RFC 5737", globallyReachable: false, category: "reserved", note: "a documentation range (TEST-NET, RFC 5737)", anycastService: false }, // TEST-NET-1
  { base: "192.31.196.0", bits: 24, prefix: "192.31.196.0/24", name: "AS112-v4", rfc: "RFC 7535", globallyReachable: true, category: "public", note: "192.31.196.0/24 holds BLACKHOLE.AS112.ARPA, 192.31.196.1, the AS112 redirection name server (RFC 7535)", anycastService: false }, // AS112 redirection
  { base: "192.52.193.0", bits: 24, prefix: "192.52.193.0/24", name: "AMT", rfc: "RFC 7450", globallyReachable: true, category: "public", note: "192.52.193.0/24 is the Automatic Multicast Tunneling block (RFC 7450)", anycastService: false }, // AMT
  { base: "192.88.99.0", bits: 24, prefix: "192.88.99.0/24", name: "Deprecated (6to4 Relay Anycast)", rfc: "RFC 7526", globallyReachable: null, category: "reserved", note: "192.88.99.0/24 is the deprecated 6to4 relay anycast prefix; RFC 7526 section 4 says it MUST NOT be reassigned, and the registry removed its Globally Reachable value, so it is not rated public", anycastService: false }, // deprecated 2015-03
  { base: "192.88.99.2", bits: 32, prefix: "192.88.99.2/32", name: "6a44-relay anycast address", rfc: "RFC 6751", globallyReachable: false, category: "reserved", note: "192.88.99.2 is a special-purpose anycast service address: the 6a44-relay anycast address (RFC 6751 section 8)", anycastService: true }, // 6a44 relays
  { base: "192.168.0.0", bits: 16, prefix: "192.168.0.0/16", name: "Private-Use", rfc: "RFC 1918", globallyReachable: false, category: "private", note: "192.168.0.0/16 is private (RFC 1918)", anycastService: false }, // RFC 1918
  { base: "192.175.48.0", bits: 24, prefix: "192.175.48.0/24", name: "Direct Delegation AS112 Service", rfc: "RFC 7534", globallyReachable: true, category: "public", note: "192.175.48.0/24 holds the AS112 direct-delegation name servers (RFC 7534)", anycastService: false }, // AS112 direct delegation
  { base: "198.18.0.0", bits: 15, prefix: "198.18.0.0/15", name: "Benchmarking", rfc: "RFC 2544", globallyReachable: false, category: "reserved", note: "198.18.0.0/15 is benchmarking (RFC 2544)", anycastService: false }, // lab use
  { base: "198.51.100.0", bits: 24, prefix: "198.51.100.0/24", name: "Documentation (TEST-NET-2)", rfc: "RFC 5737", globallyReachable: false, category: "reserved", note: "a documentation range (TEST-NET, RFC 5737)", anycastService: false }, // TEST-NET-2
  { base: "203.0.113.0", bits: 24, prefix: "203.0.113.0/24", name: "Documentation (TEST-NET-3)", rfc: "RFC 5737", globallyReachable: false, category: "reserved", note: "a documentation range (TEST-NET, RFC 5737)", anycastService: false }, // TEST-NET-3
  { base: "240.0.0.0", bits: 4, prefix: "240.0.0.0/4", name: "Reserved", rfc: "RFC 1112, Section 4", globallyReachable: false, category: "reserved", note: "240.0.0.0/4 is reserved for future use", anycastService: false }, // class E
  { base: "255.255.255.255", bits: 32, prefix: "255.255.255.255/32", name: "Limited Broadcast", rfc: "RFC 8190; RFC 919, Section 7", globallyReachable: false, category: "reserved", note: "255.255.255.255 is the broadcast address", anycastService: false }, // limited broadcast
]; // end IPV4_REGISTRY
// Longest prefix first; Array.prototype.sort is stable, so equal lengths keep registry order (none of them overlap).
const IPV4_ROWS: Ipv4Row[] = [...IPV4_REGISTRY].sort((a, b) => b.bits - a.bits); // most specific row wins

// Strip the tool's columns so only the registry columns travel on the result (2026-10-19; any row type since 2026-10-19b).
const asBlock = (r: SpecialBlock): SpecialBlock => ({ prefix: r.prefix, name: r.name, rfc: r.rfc, globallyReachable: r.globallyReachable }); // pure projection

// How a reason sentence names the Globally Reachable value of a row (2026-10-19b).
const reachText = (gr: boolean | null): string => // three states, as the registry has them
  gr === true ? "globally reachable" : gr === false ? "not globally reachable" : "with no Globally Reachable value"; // null = booleans removed

// The registry name without the literal quotes two IPv4 rows carry ('"This network"'), for use inside a quoted sentence (2026-10-19b).
const bareName = (n: string): string => n.replace(/^"([^"]*)"$/, "$1"); // anchored, no nested quantifier: ReDoS-safe

// What classifyIpv4 hands back (named 2026-10-19b).
interface V4Class { category: HostCategory; reason: string; block?: SpecialBlock; anycastService: boolean } // block = the IANA row

function classifyIpv4(v: number): V4Class { // rewritten 2026-10-19b: one table lookup instead of a chain of ranges
  const dotted = toDotted(v); // the address as text
  const row = IPV4_ROWS.find((r) => inCidr(v, r.base, r.bits)); // the most specific registry row, if any
  const block = row ? asBlock(row) : undefined; // the registry columns, shown by the component
  if (METADATA_IPV4.has(dotted)) // the metadata addresses outrank their covering row (link-local, shared space)
    return { category: "cloud-metadata", reason: `${dotted} is a cloud instance-metadata endpoint (IMDS)`, block, anycastService: false }; // same reason text as before
  if (row) // a registry row decides
    return { // the row's category with a reason that names the row
      category: row.category, // reserved, public, loopback, private, link-local or cgnat
      reason: `${row.note}; the IANA IPv4 Special-Purpose Address Space registry lists ${row.prefix} as "${bareName(row.name)}" (${row.rfc}), ${reachText(row.globallyReachable)}`, // note, then the registry's words
      block, // the registry columns
      anycastService: row.anycastService, // flagged for the anycast service rows
    }; // end row result
  if (inCidr(v, "224.0.0.0", 4)) return { category: "reserved", reason: "224.0.0.0/4 is multicast", anycastService: false }; // not a special-purpose row (it has its own registry); kept from the original rules
  return { category: "public", reason: `${dotted} is a public, routable address`, anycastService: false }; // nothing special matched
} // end classifyIpv4

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
  if (isCompat(g)) return "::" + low; // 2026-10-19b: IPv4-compatible, a prefix RFC 4291 defines, so RFC 5952 section 5 recommends mixed notation
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
// 2026-10-19b: the first 96 bits zero, which with :: and ::1 tested first leaves the IPv4-compatible addresses (RFC 4291 section 2.5.5.1).
const isCompat = (g: number[]): boolean => g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0 && !(g[6] === 0 && g[7] <= 1); // ::/96 minus :: and ::1
const isTeredo = (g: number[]): boolean => g[0] === 0x2001 && g[1] === 0; // 2026-10-19b: 2001::/32, the Teredo service prefix (RFC 4380 section 2.6)

// IANA IPv6 Special-Purpose Address Space rows the embedding code names directly (CSV read 2026-10-19).
const V6_ROWS = { // name and RFC columns verbatim from the registry
  loopback: { prefix: "::1/128", name: "Loopback Address", rfc: "RFC 4291", globallyReachable: false }, // ::1
  unspecified: { prefix: "::/128", name: "Unspecified Address", rfc: "RFC 4291", globallyReachable: false }, // ::
  mapped: { prefix: "::ffff:0:0/96", name: "IPv4-mapped Address", rfc: "RFC 4291", globallyReachable: false }, // IPv4-mapped
  wkp: { prefix: "64:ff9b::/96", name: "IPv4-IPv6 Translat.", rfc: "RFC 6052", globallyReachable: true }, // NAT64 Well-Known Prefix
  local: { prefix: "64:ff9b:1::/48", name: "IPv4-IPv6 Translat.", rfc: "RFC 8215", globallyReachable: false }, // local-use translation prefix
  teredo: { prefix: "2001::/32", name: "TEREDO", rfc: "RFC 4380; RFC 8190", globallyReachable: null }, // 2026-10-19b: registry says N/A [2], see RFC 4380 section 5
  sixToFour: { prefix: "2002::/16", name: "6to4", rfc: "RFC 3056", globallyReachable: null }, // registry says N/A, see RFC 3056
} satisfies Record<string, SpecialBlock>; // typed as registry rows

// 2026-10-19b: every other row of the IPv6 registry, rated by its own name and Globally Reachable flag.
// The tool's columns mirror Ipv4Row: category, plain-language note, anycast service or not. Rows the
// registry marks Globally Reachable True rate public but are named; the rest rate reserved unless a
// more telling category exists (loopback, private for Unique-Local, link-local).
interface Ipv6Row extends SpecialBlock { // a registry row plus the tool's columns
  bits: number; // prefix length
  category: HostCategory; // the category the tool gives an address in this row
  note: string; // the plain-language lead of the reason
  anycastService: boolean; // true for the registry's anycast service rows
} // end Ipv6Row
const IPV6_REGISTRY: Ipv6Row[] = [ // registry order; the embedding rows above are handled before this table is consulted
  { prefix: "::1/128", bits: 128, name: "Loopback Address", rfc: "RFC 4291", globallyReachable: false, category: "loopback", note: "::1 is IPv6 loopback", anycastService: false }, // ::1
  { prefix: "::/128", bits: 128, name: "Unspecified Address", rfc: "RFC 4291", globallyReachable: false, category: "reserved", note: ":: is the unspecified address", anycastService: false }, // ::
  { prefix: "100::/64", bits: 64, name: "Discard-Only Address Block", rfc: "RFC 6666", globallyReachable: false, category: "reserved", note: "100::/64 is the discard-only prefix for remote triggered black hole filtering (RFC 6666)", anycastService: false }, // black hole
  { prefix: "100:0:0:1::/64", bits: 64, name: "Dummy IPv6 Prefix", rfc: "RFC 9780", globallyReachable: false, category: "reserved", note: "100:0:0:1::/64 is the dummy IPv6 prefix (RFC 9780)", anycastService: false }, // dummy prefix
  { prefix: "2001::/23", bits: 23, name: "IETF Protocol Assignments", rfc: "RFC 2928", globallyReachable: false, category: "reserved", note: '2001::/23 is not globally reachable "Unless allowed by a more specific allocation" (registry footnote [1]), and no more specific row covers this address', anycastService: false }, // the covering block
  { prefix: "2001:1::1/128", bits: 128, name: "Port Control Protocol Anycast", rfc: "RFC 7723", globallyReachable: true, category: "public", note: "2001:1::1 is a special-purpose anycast service address: the PCP anycast address, answered by the nearest PCP-aware NAT or firewall (RFC 7723)", anycastService: true }, // PCP anycast
  { prefix: "2001:1::2/128", bits: 128, name: "Traversal Using Relays around NAT Anycast", rfc: "RFC 8155", globallyReachable: true, category: "public", note: "2001:1::2 is a special-purpose anycast service address: the TURN anycast address, answered by the topologically nearest TURN server (RFC 8155)", anycastService: true }, // TURN anycast
  { prefix: "2001:1::3/128", bits: 128, name: "DNS-SD Service Registration Protocol Anycast", rfc: "RFC 9665", globallyReachable: true, category: "public", note: "2001:1::3 is a special-purpose anycast service address: the destination for SRP Updates when no SRP registrar is configured (RFC 9665 section 10.5)", anycastService: true }, // SRP anycast
  { prefix: "2001:2::/48", bits: 48, name: "Benchmarking", rfc: "RFC 5180; RFC Errata 1752", globallyReachable: false, category: "reserved", note: "2001:2::/48 is IPv6 benchmarking (RFC 5180 section 8 as corrected by erratum 1752)", anycastService: false }, // lab use
  { prefix: "2001:3::/32", bits: 32, name: "AMT", rfc: "RFC 7450", globallyReachable: true, category: "public", note: "2001:3::/32 is the Automatic Multicast Tunneling block (RFC 7450)", anycastService: false }, // AMT
  { prefix: "2001:4:112::/48", bits: 48, name: "AS112-v6", rfc: "RFC 7535", globallyReachable: true, category: "public", note: "2001:4:112::/48 holds BLACKHOLE.AS112.ARPA, 2001:4:112::1, the AS112 redirection name server (RFC 7535)", anycastService: false }, // AS112 redirection
  { prefix: "2001:10::/28", bits: 28, name: "Deprecated (previously ORCHID)", rfc: "RFC 4843", globallyReachable: null, category: "reserved", note: "2001:10::/28 is the deprecated ORCHID prefix (terminated 2014-03, replaced by ORCHIDv2); with no flags of its own, the covering 2001::/23 row, not globally reachable, decides", anycastService: false }, // deprecated
  { prefix: "2001:20::/28", bits: 28, name: "ORCHIDv2", rfc: "RFC 7343", globallyReachable: true, category: "public", note: 'ORCHIDv2 identifiers are "considered non-routable addresses from the IPv6-layer perspective" (RFC 7343), but the registry marks the block globally reachable', anycastService: false }, // ORCHIDv2
  { prefix: "2001:30::/28", bits: 28, name: "Drone Remote ID Protocol Entity Tags (DETs) Prefix", rfc: "RFC 9374", globallyReachable: true, category: "public", note: 'DETs are HHITs, "valid, though non-routable, IPv6 addresses" (RFC 9374), but the registry marks the block globally reachable', anycastService: false }, // DRIP DETs
  { prefix: "2001:db8::/32", bits: 32, name: "Documentation", rfc: "RFC 3849", globallyReachable: false, category: "reserved", note: "2001:db8::/32 is the IPv6 documentation prefix (RFC 3849)", anycastService: false }, // documentation
  { prefix: "2620:4f:8000::/48", bits: 48, name: "Direct Delegation AS112 Service", rfc: "RFC 7534", globallyReachable: true, category: "public", note: "2620:4f:8000::/48 holds the AS112 direct-delegation name servers (RFC 7534)", anycastService: false }, // AS112 direct delegation
  { prefix: "3fff::/20", bits: 20, name: "Documentation", rfc: "RFC 9637", globallyReachable: false, category: "reserved", note: "3fff::/20 is the second IPv6 documentation prefix (RFC 9637)", anycastService: false }, // documentation
  { prefix: "5f00::/16", bits: 16, name: "Segment Routing (SRv6) SIDs", rfc: "RFC 9602", globallyReachable: false, category: "reserved", note: "5f00::/16 is reserved for SRv6 segment identifiers inside SR domains (RFC 9602)", anycastService: false }, // SRv6 SIDs
  { prefix: "fc00::/7", bits: 7, name: "Unique-Local", rfc: "RFC 4193; RFC 8190", globallyReachable: false, category: "private", note: "fc00::/7 is a unique local address (ULA)", anycastService: false }, // ULA
  { prefix: "fe80::/10", bits: 10, name: "Link-Local Unicast", rfc: "RFC 4291", globallyReachable: false, category: "link-local", note: "fe80::/10 is link-local", anycastService: false }, // link-local
]; // end IPV6_REGISTRY
// Each row's prefix parsed once into eight pieces by the same parser the hosts go through (text before the "/").
const IPV6_ROWS = [...IPV6_REGISTRY] // copy, so the registry-order list stays as written
  .sort((a, b) => b.bits - a.bits) // longest prefix first (stable sort; equal lengths do not overlap)
  .map((r) => ({ row: r, base: parseIpv6(r.prefix.slice(0, r.prefix.indexOf("/")))! })); // the non-null assertion holds for every literal above

// True when the eight pieces g fall inside base/bits (2026-10-19b).
function inPrefix6(g: number[], base: number[], bits: number): boolean { // piecewise masked compare
  for (let i = 0; i < 8; i++) { // walk the eight 16-bit pieces
    const left = bits - 16 * i; // prefix bits still to compare from this piece on
    if (left <= 0) return true; // the whole prefix matched
    const mask = left >= 16 ? 0xffff : (0xffff << (16 - left)) & 0xffff; // full piece, or its top `left` bits
    if ((g[i] & mask) !== (base[i] & mask)) return false; // a prefix bit differs
  } // end piece loop
  return true; // a /128 matched every piece
} // end inPrefix6

// The most specific IPV6_REGISTRY row covering g, or null (2026-10-19b).
const findV6Row = (g: number[]): Ipv6Row | null => IPV6_ROWS.find((x) => inPrefix6(g, x.base, x.row.bits))?.row ?? null; // first hit = longest prefix

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
  embeddedSpecialBlock: SpecialBlock | null; // 2026-10-19b: the IPv4 registry row of the carried address
  teredo: TeredoParts | null; // 2026-10-19b: both Teredo addresses and the port
  anycastService: boolean; // 2026-10-19b: the deciding address is a registry anycast service address
} // end V6Class

// Rate an IPv6 address by the IPv4 address it carries.
function fromEmbedded( // builds the V6Class for every embedding kind
  canonical: string, // RFC 5952 text of the IPv6 address
  block: SpecialBlock | null, // its IANA row (null for IPv4-compatible, which has no registry row: 2026-10-19b)
  embedding: Ipv4Embedding, // which layout carried the IPv4 address
  v4: number, // the decoded IPv4 value
  layout: number | null, // RFC 6052 prefix length, or null
  lead: string, // the embedding sentence
): V6Class { // the rated result
  const inner = classifyIpv4(v4); // the IPv4 rating decides
  return { // rated by the carried address
    category: inner.category, reasons: [lead, inner.reason], canonical, block, embedding, embeddedIpv4: toDotted(v4), embeddingLayout: layout, // as before
    embeddedSpecialBlock: inner.block ?? null, teredo: null, anycastService: inner.anycastService, // 2026-10-19b: the carried address's row and anycast flag
  }; // end embedded result
} // end fromEmbedded

// 2026-10-19b: Teredo, RFC 4380 section 4. The 32-bit prefix is followed by the server IPv4 address
// (bits 32 to 63), the 16-bit Flags (64 to 79, updated by RFC 5991 section 3.1), the client's mapped
// UDP port XOR 0xFFFF (80 to 95) and the client's mapped IPv4 address XOR 0xFFFFFFFF (96 to 127).
// Both IPv4 addresses are rated; the more internal one decides (the server wins a tie), and both are
// reported. RFC 4380 section 4 says global Teredo identifiers "MUST include a global scope unicast
// IPv4 address", so an internal one names a target that no valid Teredo address should carry.
function classifyTeredo(g: number[], canonical: string): V6Class { // g is inside 2001::/32
  const server = (g[2] * 65536 + g[3]) >>> 0; // bits 32 to 63, stored as is
  const client = ((g[6] * 65536 + g[7]) ^ 0xffffffff) >>> 0; // bits 96 to 127, every bit inverted, back to unsigned
  const port = g[5] ^ 0xffff; // bits 80 to 95, every bit inverted
  const sc = classifyIpv4(server); // the server's rating
  const cc = classifyIpv4(client); // the client's rating
  const clientWins = INTERNAL_RANK[cc.category] > INTERNAL_RANK[sc.category]; // strictly more internal, so the server wins a tie
  const pick = clientWins ? cc : sc; // the deciding rating
  const pickV4 = clientWins ? client : server; // the deciding address
  const other = clientWins ? sc : cc; // the other rating
  const teredo: TeredoParts = { serverIpv4: toDotted(server), clientIpv4: toDotted(client), clientPort: port, flags: g[4] }; // the decoded fields
  const reasons = [ // embedding first, then the deciding rating
    `a Teredo address (2001::/32, RFC 4380 section 4): bits 32 to 63 carry the server ${teredo.serverIpv4}, and the last 32 bits carry the client ${teredo.clientIpv4} stored XOR 0xFFFFFFFF (client port ${port}, stored XOR 0xFFFF)`, // the layout
    `rated by the ${clientWins ? "client" : "server"} address ${toDotted(pickV4)}, the more internal of the two: ${pick.reason}`, // the decision
  ]; // end reasons
  if (other.category !== "public") reasons.push(`the ${clientWins ? "server" : "client"} address is internal-looking too: ${other.reason}`); // show the second internal address
  if (pick.category !== "public") reasons.push('RFC 4380 section 4 says global Teredo identifiers "MUST include a global scope unicast IPv4 address"; this one names an internal target, so a filter must reject it'); // why it is still dangerous
  return { // the Teredo result
    category: pick.category, reasons, canonical, block: V6_ROWS.teredo, // rated by the deciding address
    embedding: "teredo", embeddedIpv4: toDotted(pickV4), embeddingLayout: null, // the deciding address is the embedded one
    embeddedSpecialBlock: pick.block ?? null, teredo, anycastService: pick.anycastService, // its row, both addresses, its anycast flag
  }; // end Teredo result
} // end classifyTeredo

function classifyIpv6(host: string): V6Class | null { // null when the host is not a valid IPv6 text form
  const g = parseIpv6(host); // eight 16-bit pieces, spelling normalised away
  if (g === null) return null; // not IPv6
  const canonical = formatIpv6(g); // RFC 5952 text
  const plain = (category: HostCategory, reason: string, block: SpecialBlock | null = null, anycastService = false): V6Class => // helper for non-embedding results (anycastService added 2026-10-19b)
    ({ category, reasons: [reason], canonical, block, ...NO_EMBEDDING, anycastService }); // nothing embedded
  if (g.every((x) => x === 0)) return plain("reserved", ":: is the unspecified address", V6_ROWS.unspecified); // ::/128, any spelling
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return plain("loopback", "::1 is IPv6 loopback", V6_ROWS.loopback); // ::1/128, any spelling, e.g. 0:0:0:0:0:0:0:1
  if (canonical === "fd00:ec2::254") { // any spelling of the IMDSv6 address (block added 2026-10-19b)
    const ula = findV6Row(g); // the Unique-Local row it sits in
    return plain("cloud-metadata", "fd00:ec2::254 is the AWS IMDSv6 metadata endpoint", ula ? asBlock(ula) : null); // metadata outranks its covering row
  } // end IMDSv6
  const v4low = bytesToV4(g[6] >>> 8, g[6] & 0xff, g[7] >>> 8, g[7] & 0xff); // the low 32 bits, used by three embeddings
  if (isMapped(g)) // ::ffff:0:0/96 (RFC 4291 section 2.5.5.2)
    return fromEmbedded(canonical, V6_ROWS.mapped, "ipv4-mapped", v4low, null, `an IPv4-mapped IPv6 address (::ffff:0:0/96, RFC 4291 section 2.5.5.2) carrying ${toDotted(v4low)} in its low 32 bits`); // rated by the IPv4 address
  if (isCompat(g)) { // 2026-10-19b: ::a.b.c.d, the deprecated IPv4-compatible format (RFC 4291 section 2.5.5.1)
    const r = fromEmbedded(canonical, null, "ipv4-compatible", v4low, null, `an IPv4-compatible IPv6 address (::/96, RFC 4291 section 2.5.5.1) carrying ${toDotted(v4low)} in its low 32 bits`); // no registry row: rated by the carried address
    r.reasons.push('RFC 4291 section 2.5.5.1 says the IPv4-compatible address "is now deprecated" and that the IPv4 address it carries "must be a globally-unique IPv4 unicast address"; a stack that still accepts the format reaches the carried address, so it is rated by it'); // the deprecation, said plainly
    return r; // IPv4-compatible result
  } // end IPv4-compatible
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
  if (isTeredo(g)) return classifyTeredo(g, canonical); // 2026-10-19b: 2001::/32, tested before its covering 2001::/23 row
  const row = findV6Row(g); // 2026-10-19b: every other registry row, most specific first (replaces the per-block tests for 2001:db8::/32, 3fff::/20, 100::/64, fc00::/7, fe80::/10)
  if (row) // a registry row decides
    return plain(row.category, `${row.note}; the IANA IPv6 Special-Purpose Address Space registry lists ${row.prefix} as "${row.name}" (${row.rfc}), ${reachText(row.globallyReachable)}`, asBlock(row), row.anycastService); // named, rated by its flag
  if ((g[0] & 0xff00) === 0xff00) return plain("reserved", "ff00::/8 is multicast"); // numeric /8 test; not a special-purpose row (it has its own registry)
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
      anycastService: false, // no address, no anycast row (field added 2026-10-19b)
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
        embeddedSpecialBlock: v6.embeddedSpecialBlock, // 2026-10-19b: the carried IPv4 address's registry row, or null
        teredo: v6.teredo, // 2026-10-19b: both Teredo addresses and the port, or null
        anycastService: v6.anycastService, // 2026-10-19b: the deciding address is a registry anycast service address
      }; // end IPv6 result
    } // end IPv6 literal
  }

  // IPv4 literal or obfuscated IPv4.
  const v4 = parseLooseIpv4(host);
  if (v4) {
    const dotted = toDotted(v4.value);
    const obfuscated = v4.form !== "dotted";
    const { category, reason, block, anycastService } = classifyIpv4(v4.value); // block: the IANA registry row, when any (every row since 2026-10-19b); anycastService added 2026-10-19b
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
      anycastService, // 2026-10-19b: true for the PCP, TURN and 6a44-relay anycast rows
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
      anycastService: false, // no address, no anycast row (field added 2026-10-19b)
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
    anycastService: false, // no address, no anycast row (field added 2026-10-19b)
  };
}
