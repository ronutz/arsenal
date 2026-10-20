// ============================================================================
// src/lib/tools/routing-table-explainer/compute.ts
// ----------------------------------------------------------------------------
// The pure engine of the routing table explainer (D-49: deterministic, local,
// no clock, no network, no randomness).
//
// Paste what a host printed for its routing table and the engine:
//   1. detects which command printed it: Linux iproute2 (`ip route`, `ip route
//      show table all`, `ip -6 route`, `ip -d route`), Linux net-tools
//      (`netstat -rn`, `route -n`: the "Kernel IP routing table"), BSD and
//      macOS `netstat -rn` ("Routing tables", "Internet:"), or Windows
//      `route print` (its IPv4 and IPv6 sections, active and persistent);
//   2. parses every route into the same fields (destination prefix, next hop,
//      interface, metric, type, protocol, scope, preferred source, table,
//      flags, extra nexthops) and keeps every token it does not understand in
//      `unparsed`, and every line it does not understand in `unparsedLines`,
//      so nothing is ever dropped silently;
//   3. finds the default routes (prefix length zero) in each table or section
//      and, when there are several, says which one wins by metric;
//   4. answers "which route does this destination use?" by the router's
//      pruning rules: basic match keeps the routes whose prefix contains the
//      destination, longest match keeps the longest of them (RFC 1812 section
//      5.2.4.3), and the metric breaks a tie between equal lengths ("routes
//      with lower values are preferred", ip-route(8); "the route with the
//      lowest metric is selected", Microsoft Learn, The IP routing table).
//
// Field meanings are taken from documents read on 2026-10-19 and listed in
// the manifest (./index.ts): ip-route(8), ip-rule(8), rtnetlink(7), route(8)
// and netstat(8) from man7.org; FreeBSD netstat(1); Apple's netstat.1 source;
// Microsoft Learn's route command and IP routing table pages.
//
// SAFETY (ReDoS): the input is split into lines and every line into
// whitespace-separated tokens; the only regular expressions are anchored,
// bounded and free of nested quantifiers. The paste is capped at MAX_LINES
// lines of at most MAX_LINE_LENGTH characters, so the work is linear in the
// size of the paste.
// ============================================================================

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Which command printed the text. */
export type RouteFormat =
  | "iproute2" // Linux `ip route` and its variants
  | "netstat-linux" // Linux net-tools `netstat -rn` / `route -n` ("Kernel IP routing table")
  | "netstat-bsd" // FreeBSD and macOS `netstat -rn` ("Routing tables", "Internet:")
  | "windows" // Windows `route print`
  | "unknown"; // none of the above was recognised

/** The address family of a route or a destination. */
export type Family = "ipv4" | "ipv6"; // the two families the parser knows

/** One decoded flag letter (netstat formats) with the name its manual gives it. */
export interface RouteFlag {
  letter: string; // the letter exactly as printed, e.g. "U" or "c"
  id: string | null; // a stable id for the reading, e.g. "RTF_UP" or "LINUX_G"; null when no manual lists the letter
  source: "freebsd" | "macos" | "bsd" | "linux" | null; // which manual lists it ("bsd" = both FreeBSD and macOS)
}

/** One extra next hop of a multipath route (iproute2 `nexthop` lines). */
export interface Nexthop {
  gateway: string | null; // the `via` address, or null for a device-only hop
  dev: string | null; // the `dev` name
  weight: number | null; // the `weight`, "its relative bandwidth or quality" (ip-route(8))
  flags: string[]; // NHFLAGS words such as "onlink"
  unparsed: string[]; // tokens of the nexthop line not understood
}

/** A documented attribute or an extra netstat column, kept as printed. */
export interface RouteAttribute {
  key: string; // e.g. "pref", "mtu", "nhid", "Refs", "Use", "Expire"
  value: string; // the value exactly as printed
}

/** One route, in the same shape whatever command printed it. */
export interface ParsedRoute {
  index: number; // 0-based position in the parse
  line: number; // 1-based line number of the route's first line in the paste
  raw: string; // the route's text as pasted (continuation lines joined with "\n")
  section: string; // the table or section it belongs to: "main", "local", "100", "ipv4-active", "inet", ...
  family: Family | null; // the address family, or null when the destination is not an address
  destination: string; // the destination exactly as printed
  prefix: string | null; // the destination as address/length, or null when it is not one
  prefixLength: number | null; // the prefix length, or null
  isDefault: boolean; // prefix length zero: 0.0.0.0/0 or ::/0
  type: string; // the route type: unicast, local, broadcast, multicast, throw, unreachable, prohibit, blackhole, nat, anycast, reject
  gateway: string | null; // the next hop as printed, or null when there is none
  onLink: boolean; // true when no gateway is used: delivered directly on the interface
  interface: string | null; // dev / Iface / Netif / the Windows Interface or If column
  metric: number | null; // the metric as a number, or null when none was printed
  metricText: string | null; // the metric exactly as printed when it is not a number (Windows "Default")
  protocol: string | null; // iproute2 `proto`
  scope: string | null; // iproute2 `scope`
  src: string | null; // iproute2 `src`, the preferred source address
  flags: RouteFlag[]; // decoded flag letters (netstat formats)
  nhFlags: string[]; // iproute2 next-hop flag words (onlink, pervasive)
  nexthops: Nexthop[]; // extra next hops of a multipath route
  attributes: RouteAttribute[]; // other documented attributes and extra columns
  unparsed: string[]; // tokens on the route's lines that were not understood, in order
  notes: string[]; // stable codes explaining a parse decision (e.g. "host-route-no-length")
}

/** One entry of the Windows `route print` Interface List. */
export interface WindowsInterface {
  index: number; // the interface index (the IPv6 table's If column refers to it)
  mac: string; // the hardware address column, as printed ("" for the loopback)
  description: string; // the adapter description
}

/** The default routes of one table or section, and which one wins. */
export interface DefaultGroup {
  section: string; // the table or section
  consulted: boolean; // whether a destination lookup consults this section (see lookupOrder)
  candidates: number[]; // indices of its default routes, in printed order
  winner: number | null; // the index that wins, or null when the metric cannot decide
  reason: "single" | "lowest-metric" | "equal-metric" | "no-metric"; // why
}

/** A line the parser did not understand, kept so nothing is dropped silently. */
export interface UnparsedLine {
  line: number; // 1-based line number
  text: string; // the line as pasted (cut at MAX_LINE_LENGTH)
}

/** The whole parse. */
export interface RoutingTableParse {
  format: RouteFormat; // the detected command
  routes: ParsedRoute[]; // every route, in printed order
  interfaces: WindowsInterface[]; // the Windows Interface List (empty for other formats)
  defaults: DefaultGroup[]; // the default routes per section
  unparsedLines: UnparsedLine[]; // lines that are neither a route nor known structure
  structureLines: number; // headers, separators, section titles and command echoes recognised
  lineCount: number; // lines read (after the cap)
  warnings: string[]; // stable codes: "no-routes", "truncated", "line-too-long", "netstat-linux-ipv6"
}

/** One stage of a lookup: one table or section, consulted in order. */
export interface LookupStage {
  section: string; // the table or section
  candidates: number[]; // basic match: routes whose prefix contains the destination
  longest: number | null; // the largest prefix length among the candidates
  survivors: number[]; // longest match: the candidates with that length
  winner: number | null; // the route chosen in this stage, or null
  outcome: "match" | "no-match" | "throw" | "tie"; // what the stage decided
  decidedBy: "only-candidate" | "longest-prefix" | "lowest-metric" | null; // which rule picked the winner
}

/** The answer to "which route does this destination use?". */
export interface LookupResult {
  destination: string; // the address asked about, as given
  family: Family; // its family
  stages: LookupStage[]; // the sections consulted, in order
  skipped: { section: string; reason: "policy-rule-only" | "persistent-store" }[]; // sections not consulted, and why
  unusable: number[]; // same-family routes left out because their destination is not an address/length
  winner: number | null; // the route used, or null
  action: LookupAction; // what happens to the packet
  decidedBy: "only-candidate" | "longest-prefix" | "lowest-metric" | null; // the rule that picked the winner
}

/** What the chosen route does with the packet. */
export type LookupAction =
  | "via" // forwarded to the gateway
  | "on-link" // delivered directly on the interface
  | "multipath" // spread over several next hops
  | "local" // delivered to this host
  | "broadcast" // sent as a link broadcast
  | "multicast" // multicast routing
  | "unreachable" // discarded, ICMP host unreachable
  | "blackhole" // discarded silently
  | "prohibit" // discarded, ICMP administratively prohibited
  | "reject" // BSD or Linux reject flag: host or net unreachable
  | "nat" // the obsolete Linux NAT route
  | "anycast" // the unimplemented Linux anycast route
  | "tie" // equal length and equal metric: the rules here cannot decide
  | "no-route"; // nothing matched: the packet is discarded

/** Stable error codes for the lookup (the UI maps them to localised text). */
export type RouteLookupErrorCode = "bad-address" | "bad-request"; // the two ways a request can be refused

/** A typed error carrying a stable code. */
export class RouteLookupError extends Error {
  readonly code: RouteLookupErrorCode; // the stable code
  constructor(code: RouteLookupErrorCode, message: string) {
    super(message); // the human-readable message
    this.name = "RouteLookupError"; // a recognisable name
    this.code = code; // keep the code
  }
}

// ---------------------------------------------------------------------------
// Bounds (ReDoS and size safety)
// ---------------------------------------------------------------------------

/** The most lines read from one paste; the rest are ignored with a warning. */
export const MAX_LINES = 5000; // far above any real routing table paste
/** The longest line parsed; a longer line is kept as unparsed (cut) with a warning. */
export const MAX_LINE_LENGTH = 2000; // a route line is rarely over 200 characters
/** The most extra next hops attached to one route. */
const MAX_NEXTHOPS = 512; // ip-route(8): the buffer allows 253 IPv4 or 144 IPv6 nexthops in one go

// ---------------------------------------------------------------------------
// Address arithmetic (no regular expression beyond anchored, bounded ones)
// ---------------------------------------------------------------------------

/** Parse a dotted-quad IPv4 address to a 32-bit unsigned value, or null. */
export function parseIpv4(text: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text); // anchored, bounded quantifiers
  if (!m) return null; // not four dotted decimal groups
  let value = 0; // the accumulated address
  for (let i = 1; i <= 4; i++) { // each octet in turn
    const octet = Number(m[i]); // the decimal value
    if (octet > 255) return null; // out of range
    value = value * 256 + octet; // shift in (multiplication keeps it unsigned)
  }
  return value; // 0 .. 2^32-1
}

/** Parse an IPv6 address (RFC 4291 text forms, "::" and an embedded IPv4 tail) to a bigint, or null. */
export function parseIpv6(text: string): bigint | null {
  if (text.length === 0 || text.length > 45) return null; // longest valid form is 45 characters
  const halves = text.split("::"); // at most one "::" is allowed
  if (halves.length > 2) return null; // two "::" is invalid
  const head = halves[0] === "" ? [] : halves[0].split(":"); // groups before "::"
  const tail = halves.length === 2 ? (halves[1] === "" ? [] : halves[1].split(":")) : []; // groups after "::"
  const groups: number[] = []; // the 16-bit groups, filled below
  const all = halves.length === 2 ? [...head, "::", ...tail] : head; // a marker where "::" stood
  for (let i = 0; i < all.length; i++) { // each piece
    const g = all[i]; // the piece
    if (g === "::") { groups.push(-1); continue; } // the gap marker, expanded later
    if (i === all.length - 1 && g.includes(".")) { // an IPv4 tail such as ::ffff:192.0.2.1
      const v4 = parseIpv4(g); // parse the dotted quad
      if (v4 === null) return null; // a bad tail
      groups.push(Math.floor(v4 / 65536), v4 % 65536); // two 16-bit groups
      continue; // next piece
    }
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null; // one to four hex digits, anchored
    groups.push(parseInt(g, 16)); // the group value
  }
  const gap = groups.indexOf(-1); // where "::" stood, if anywhere
  const real = groups.filter((g) => g !== -1); // the written groups
  if (gap === -1 && real.length !== 8) return null; // without "::" exactly eight groups
  if (gap !== -1 && real.length > 7) return null; // "::" must stand for at least one group
  const full = gap === -1 ? real : [...real.slice(0, gap), ...new Array(8 - real.length).fill(0), ...real.slice(gap)]; // expand the gap with zeros
  let value = 0n; // the accumulated address
  for (const g of full) value = (value << 16n) | BigInt(g); // shift in each group
  return value; // 0 .. 2^128-1
}

/** An address of either family as a bigint, with its family. */
interface Addr {
  family: Family; // ipv4 or ipv6
  value: bigint; // the address as an integer
}

/** Parse an address of either family, ignoring an IPv6 zone ("%eth0"). */
export function parseAddress(text: string): Addr | null {
  const v4 = parseIpv4(text); // try IPv4 first
  if (v4 !== null) return { family: "ipv4", value: BigInt(v4) }; // dotted quad
  const pct = text.indexOf("%"); // a zone index, as BSD prints fe80::1%lo0
  const bare = pct >= 0 ? text.slice(0, pct) : text; // the address without the zone
  const v6 = parseIpv6(bare); // try IPv6
  if (v6 !== null) return { family: "ipv6", value: v6 }; // colon form
  return null; // neither
}

/** The number of bits in a family's addresses. */
function bitsOf(family: Family): number {
  return family === "ipv4" ? 32 : 128; // 32 or 128
}

/** True when `addr` falls inside network/length (basic match, RFC 1812 section 5.2.4.3). */
function contains(network: Addr, length: number, addr: Addr): boolean {
  if (network.family !== addr.family) return false; // families never match each other
  const bits = BigInt(bitsOf(addr.family)); // address width
  const shift = bits - BigInt(length); // host bits to ignore
  return (network.value >> shift) === (addr.value >> shift); // the most significant `length` bits are equal
}

/** Convert a contiguous IPv4 netmask to a prefix length, or null when it is not contiguous. */
export function maskToLength(mask: string): number | null {
  const v = parseIpv4(mask); // the mask as a number
  if (v === null) return null; // not a dotted quad
  let length = 0; // count the leading ones
  let seenZero = false; // once a zero is seen, every later bit must be zero
  for (let bit = 31; bit >= 0; bit--) { // most significant first
    const one = Math.floor(v / 2 ** bit) % 2 === 1; // the bit's value
    if (one && seenZero) return null; // a one after a zero: not contiguous
    if (one) length++; // a leading one
    else seenZero = true; // the ones have ended
  }
  return length; // 0 .. 32
}

/** Parse "address/length" (with an optional IPv6 zone before the slash). */
function parsePrefix(text: string): { addr: Addr; length: number } | null {
  const slash = text.indexOf("/"); // the separator
  if (slash < 0) return null; // no length written
  const addr = parseAddress(text.slice(0, slash)); // the address part
  if (!addr) return null; // not an address
  const lenText = text.slice(slash + 1); // the length part
  if (!/^\d{1,3}$/.test(lenText)) return null; // one to three digits, anchored
  const length = Number(lenText); // the length
  if (length > bitsOf(addr.family)) return null; // longer than the address
  return { addr, length }; // a valid prefix
}

/** The canonical text "address/length" of a prefix as printed (the address kept as written, zone removed). */
function prefixText(printed: string, length: number): string {
  const slash = printed.indexOf("/"); // drop a printed length
  const addrPart = slash >= 0 ? printed.slice(0, slash) : printed; // the address as written
  const pct = addrPart.indexOf("%"); // drop a zone
  return `${pct >= 0 ? addrPart.slice(0, pct) : addrPart}/${length}`; // address/length
}

// ---------------------------------------------------------------------------
// Flag tables (letters as the manuals list them, read 2026-10-19)
// ---------------------------------------------------------------------------

/** FreeBSD netstat(1) (FreeBSD 15.1, 7 April 2026): "The mapping between letters and flags is:". */
const FREEBSD_FLAGS: Record<string, string> = {
  "1": "RTF_PROTO1", // Protocol specific routing flag #1
  "2": "RTF_PROTO2", // Protocol specific routing flag #2
  "3": "RTF_PROTO3", // Protocol specific routing flag #3
  B: "RTF_BLACKHOLE", // Just discard pkts (during updates)
  b: "RTF_BROADCAST", // The route represents a broadcast address
  D: "RTF_DYNAMIC", // Created dynamically (by redirect)
  G: "RTF_GATEWAY", // Destination requires forwarding by intermediary
  H: "RTF_HOST", // Host entry (net otherwise)
  L: "RTF_LLINFO", // Valid protocol to link address translation
  M: "RTF_MODIFIED", // Modified dynamically (by redirect)
  R: "RTF_REJECT", // Host or net unreachable
  S: "RTF_STATIC", // Manually added
  U: "RTF_UP", // Route usable
  X: "RTF_XRESOLVE", // External daemon translates proto to link address
};

/** Apple netstat.1 (network_cmds, netstat.tproj): the same mapping with the macOS letters added. */
const MACOS_FLAGS: Record<string, string> = {
  ...FREEBSD_FLAGS, // the shared letters, with the same names
  C: "RTF_CLONING", // Generate new routes on use
  c: "RTF_PRCLONING", // Protocol-specified generate new routes on use
  I: "RTF_IFSCOPE", // Route is associated with an interface scope
  i: "RTF_IFREF", // Route is holding a reference to the interface
  m: "RTF_MULTICAST", // The route represents a multicast address
  r: "RTF_ROUTER", // Host is a default router
  W: "RTF_WASCLONED", // Route was generated as a result of cloning
  Y: "RTF_PROXY", // Proxying; cloned routes will not be scoped
  g: "RTF_GLOBAL", // Route to a destination of the global internet (policy hint)
};

/** Linux route(8) OUTPUT, Flags: "Possible flags include". */
const LINUX_FLAGS: Record<string, string> = {
  U: "LINUX_U", // route is up
  H: "LINUX_H", // target is a host
  G: "LINUX_G", // use gateway
  R: "LINUX_R", // reinstate route for dynamic routing
  D: "LINUX_D", // dynamically installed by daemon or redirect
  M: "LINUX_M", // modified from routing daemon or redirect
  A: "LINUX_A", // installed by addrconf
  C: "LINUX_C", // cache entry
  "!": "LINUX_REJECT", // reject route
};

/** Decode a netstat flags column letter by letter, for the BSD family or for Linux net-tools. */
export function decodeFlags(text: string, family: "bsd" | "linux"): RouteFlag[] {
  const out: RouteFlag[] = []; // the decoded letters
  for (const letter of Array.from(text).slice(0, 32)) { // at most 32 letters, one at a time
    if (family === "linux") { // route(8)'s table
      out.push({ letter, id: LINUX_FLAGS[letter] ?? null, source: LINUX_FLAGS[letter] ? "linux" : null }); // known or not
      continue; // next letter
    }
    const inFree = Object.prototype.hasOwnProperty.call(FREEBSD_FLAGS, letter); // listed by FreeBSD
    const inMac = Object.prototype.hasOwnProperty.call(MACOS_FLAGS, letter); // listed by Apple
    const id = inMac ? MACOS_FLAGS[letter] : null; // the macOS table is a superset with the same names
    const source = inFree ? "bsd" : inMac ? "macos" : null; // which manuals list it
    out.push({ letter, id, source }); // keep the letter even when unknown
  }
  return out; // in printed order
}

// ---------------------------------------------------------------------------
// Line handling shared by every format
// ---------------------------------------------------------------------------

/** Split a line into whitespace-separated tokens (any Unicode white space, as copied from a web page). */
function tokens(line: string): string[] {
  const t = line.trim(); // trim() removes U+00A0 and U+2003 too
  return t === "" ? [] : t.split(/\s+/); // a single linear split
}

/** The commands whose echoed prompt line is recognised as structure rather than as an unparsed line. */
const COMMANDS = new Set(["ip", "netstat", "route"]); // the three commands this tool reads

/** True when a line is a shell or cmd.exe prompt echoing one of the commands ("$ ip route", "C:\...>route print"). */
function isCommandEcho(toks: string[]): boolean {
  for (let k = 0; k < Math.min(toks.length, 8); k++) { // the command sits near the start of a prompt line
    let tok = toks[k]; // the candidate token
    const gt = tok.lastIndexOf(">"); // cmd.exe glues the prompt to the command: C:\Windows\system32>route
    if (gt >= 0 && gt < tok.length - 1) tok = tok.slice(gt + 1); // keep what follows the prompt
    else if (gt >= 0) continue; // a token ending in ">" is a prompt; the command follows
    if (!COMMANDS.has(tok)) continue; // not one of the commands
    const prev = k > 0 ? toks[k - 1] : ""; // the token before it
    const promptBefore = k === 0 ? gt >= 0 : /[>$#%]$/.test(prev); // a prompt character ends the previous token
    const next = toks[k + 1] ?? ""; // the first argument
    const argLike = next.startsWith("-") || ["route", "ro", "r", "print", "show", "list", "-6", "-4"].includes(next); // looks like the command's arguments
    if (promptBefore || (k === 0 && argLike)) return true; // an echoed command line
  }
  return false; // not a command echo
}

/** A run of "=" (Windows separators) or of "-" is a ruler line. */
function isRuler(line: string): boolean {
  const t = line.trim(); // ignore indentation
  return t.length >= 3 && (/^=+$/.test(t) || /^-+$/.test(t)); // anchored single-character runs
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

/** The iproute2 route types (ip-route(8) TYPE plus `anycast`, which DESCRIPTION lists). */
const IP_TYPES = new Set(["unicast", "local", "broadcast", "multicast", "throw", "unreachable", "prohibit", "blackhole", "nat", "anycast"]);
/** iproute2 keywords that take one value (ip-route(8) NODE_SPEC, NH and OPTIONS). */
const IP_KEYS = new Set(["dev", "proto", "scope", "src", "metric", "table", "pref", "nhid", "weight", "mtu", "advmss", "expires", "realm", "realms", "tos", "dsfield", "rtt", "rttvar", "rto_min", "ssthresh", "cwnd", "initcwnd", "initrwnd", "window", "reordering", "quickack", "features", "congctl", "fastopen_no_cookie", "vrf"]);
/** iproute2 next-hop flags (ip-route(8) NHFLAGS). */
const IP_NHFLAGS = new Set(["onlink", "pervasive"]);
/** ip-route(8) FAMILY words that may follow `via`. */
const IP_FAMILIES = new Set(["inet", "inet6", "mpls", "bridge", "link"]);

/** Decide which command printed the text, by its unmistakable lines. Deterministic: the first rule that fires wins. */
export function detectFormat(lines: string[]): RouteFormat {
  let ipScore = 0; // lines that look like iproute2 routes
  for (const line of lines) { // first pass: the header lines decide outright
    const t = line.trim(); // ignore indentation
    if (t === "IPv4 Route Table" || t === "IPv6 Route Table" || t === "Active Routes:" || t === "Persistent Routes:" || t === "Interface List") return "windows"; // route print section titles
    if (t.startsWith("Network Destination") || t.startsWith("Network Address")) return "windows"; // route print column headers
    if (t.startsWith("Kernel IP routing table") || t.startsWith("Kernel IPv6 routing table")) return "netstat-linux"; // net-tools title
    if (t === "Routing tables" || t === "Internet:" || t === "Internet6:") return "netstat-bsd"; // BSD netstat titles
    const toks = tokens(t); // the line's tokens
    if (toks[0] === "Destination" && toks.includes("Genmask")) return "netstat-linux"; // net-tools header without its title
    if (toks[0] === "Destination" && toks.includes("Flags") && (toks.includes("Netif") || toks.includes("Refs"))) return "netstat-bsd"; // BSD header without its title
    if (looksLikeIpRoute(toks)) ipScore++; // count iproute2-shaped lines
  }
  return ipScore > 0 ? "iproute2" : "unknown"; // iproute2 when any line has its shape
}

/** True when tokens have the shape of an iproute2 route line. */
function looksLikeIpRoute(toks: string[]): boolean {
  if (toks.length === 0) return false; // empty
  let i = 0; // position of the destination
  if (IP_TYPES.has(toks[0])) i = 1; // an explicit type first
  const dest = toks[i]; // the destination token
  if (dest === undefined) return false; // a type alone is not a route
  const isDest = dest === "default" || parseAddress(dest) !== null || parsePrefix(dest) !== null; // default, an address or a prefix
  if (!isDest) return false; // not a route line
  if (i === 1) return true; // "blackhole 198.51.100.0/24" is a route even with nothing after it
  return toks.slice(i + 1).some((t) => t === "via" || IP_KEYS.has(t)); // at least one iproute2 keyword follows
}

// ---------------------------------------------------------------------------
// The parse
// ---------------------------------------------------------------------------

/** A mutable route under construction (ParsedRoute without the index, set at the end). */
type Draft = Omit<ParsedRoute, "index">; // index is assigned when the parse is complete

/** A fresh draft with every field empty. */
function draft(line: number, raw: string, section: string, destination: string): Draft {
  return { // every field, explicitly
    line, // where it starts
    raw, // the text
    section, // table or section
    family: null, // decided by the format parser
    destination, // as printed
    prefix: null, // set when the destination is an address/length
    prefixLength: null, // likewise
    isDefault: false, // set for length zero
    type: "unicast", // the default type (ip-route(8): "If TYPE is omitted, ip assumes type unicast")
    gateway: null, // no next hop until one is read
    onLink: false, // decided by the format parser
    interface: null, // dev / Iface / Netif
    metric: null, // none printed yet
    metricText: null, // set when the metric is not a number
    protocol: null, // iproute2 proto
    scope: null, // iproute2 scope
    src: null, // iproute2 src
    flags: [], // netstat flags
    nhFlags: [], // iproute2 onlink / pervasive
    nexthops: [], // multipath hops
    attributes: [], // other attributes and columns
    unparsed: [], // tokens not understood
    notes: [], // parse decisions
  };
}

/** Set the prefix fields of a draft from an address/length pair. */
function setPrefix(d: Draft, printed: string, family: Family, length: number): void {
  d.family = family; // the family
  d.prefixLength = length; // the length
  d.prefix = prefixText(printed, length); // address/length
  d.isDefault = length === 0; // the default route has prefix length zero
}

/** Read a numeric token (a metric, a weight) or null. */
function intOrNull(text: string | undefined): number | null {
  if (text === undefined || !/^\d{1,10}$/.test(text)) return null; // one to ten digits, anchored
  return Number(text); // the value
}

/** The result of one format parser before defaults are computed. */
interface FormatParse {
  routes: Draft[]; // the routes
  interfaces: WindowsInterface[]; // Windows only
  unparsedLines: UnparsedLine[]; // lines not understood
  structureLines: number; // lines recognised as structure
  warnings: string[]; // format-specific warnings
}

/** An empty format parse. */
function emptyFormatParse(): FormatParse {
  return { routes: [], interfaces: [], unparsedLines: [], structureLines: 0, warnings: [] }; // nothing yet
}

// ---- iproute2 ---------------------------------------------------------------

/** Parse the key/value tail of an iproute2 route or nexthop line into a draft or a nexthop. */
function parseIpTail(toks: string[], start: number, d: Draft | null, hop: Nexthop | null): void {
  let i = start; // the current token
  while (i < toks.length) { // left to right, once
    const t = toks[i]; // the token
    if (t === "via") { // via [ FAMILY ] ADDRESS
      let j = i + 1; // the next token
      if (IP_FAMILIES.has(toks[j] ?? "")) j++; // skip an explicit family word
      const gw = toks[j]; // the address
      if (gw !== undefined && (parseAddress(gw) !== null || IP_FAMILIES.has(toks[i + 1] ?? ""))) { // an address (or any value after an explicit family)
        if (hop) hop.gateway = gw; // a nexthop's gateway
        else if (d) d.gateway = gw; // the route's gateway
        i = j + 1; // past the address
        continue; // next token
      }
    } else if (IP_NHFLAGS.has(t)) { // onlink / pervasive
      if (hop) hop.flags.push(t); // on the nexthop
      else if (d) d.nhFlags.push(t); // on the route
      i++; // one token
      continue; // next
    } else if (IP_KEYS.has(t) && toks[i + 1] !== undefined) { // a documented key with a value
      let v = toks[i + 1]; // the value
      let used = 2; // key and value
      if ((t === "mtu" || t === "congctl" || t === "window" || t === "cwnd" || t === "advmss") && v === "lock" && toks[i + 2] !== undefined) { // "mtu lock MTU", "congctl lock NAME"
        v = `lock ${toks[i + 2]}`; // keep the modifier with the value
        used = 3; // three tokens
      }
      if (hop) { // inside a nexthop line
        if (t === "dev") hop.dev = v; // its device
        else if (t === "weight") hop.weight = intOrNull(v); // its weight
        else hop.unparsed.push(t, v); // nothing else belongs to a nexthop
      } else if (d) { // on the route itself
        if (t === "dev") d.interface = v; // the output device
        else if (t === "proto") d.protocol = v; // the protocol tag
        else if (t === "scope") d.scope = v; // the scope
        else if (t === "src") d.src = v; // the preferred source
        else if (t === "table") d.section = v; // the table
        else if (t === "metric") { d.metric = intOrNull(v); if (d.metric === null) d.metricText = v; } // the metric
        else d.attributes.push({ key: t, value: v }); // pref, mtu, nhid, expires and the other documented options
      }
      i += used; // past key and value
      continue; // next
    }
    if (hop) hop.unparsed.push(t); // not understood: kept on the nexthop
    else if (d) d.unparsed.push(t); // not understood: kept on the route
    i++; // one token
  }
}

/** Parse iproute2 output (`ip route`, `ip route show table all`, `ip -6 route`, `ip -d route`). */
function parseIproute2(lines: string[], lineNo: number[]): FormatParse {
  const out = emptyFormatParse(); // the result
  let current: Draft | null = null; // the route a continuation line attaches to
  for (let k = 0; k < lines.length; k++) { // every line
    const line = lines[k]; // the text
    const toks = tokens(line); // its tokens
    if (toks.length === 0) { current = null; continue; } // a blank line ends a route
    if (isCommandEcho(toks)) { out.structureLines++; current = null; continue; } // "$ ip route show"
    const indented = /^\s/.test(line); // a continuation line starts with white space
    if (indented && toks[0] === "nexthop" && current) { // a multipath hop of the route above
      const hop: Nexthop = { gateway: null, dev: null, weight: null, flags: [], unparsed: [] }; // a fresh hop
      parseIpTail(toks, 1, null, hop); // via / dev / weight / flags
      if (current.nexthops.length < MAX_NEXTHOPS) current.nexthops.push(hop); // bounded
      current.raw += `\n${line}`; // keep the text
      continue; // next line
    }
    let i = 0; // the destination's position
    let type = "unicast"; // the type unless one is printed
    if (IP_TYPES.has(toks[0])) { type = toks[0]; i = 1; } // an explicit type first (shown always under -d)
    const dest = toks[i]; // the destination token
    const isDest = dest !== undefined && (dest === "default" || parseAddress(dest) !== null || parsePrefix(dest) !== null); // a destination
    if (!isDest) { out.unparsedLines.push({ line: lineNo[k], text: line }); current = null; continue; } // not a route line: kept as unparsed
    const d = draft(lineNo[k], line, "main", dest); // "main" until a `table` token says otherwise (ip-route(8): the default is table main)
    d.type = type; // the type
    parseIpTail(toks, i + 1, d, null); // the attributes
    // The family: from the destination, else from the gateway or source, else from the other routes (decided below).
    const pfx = parsePrefix(dest); // address/length
    const addr = pfx ? null : parseAddress(dest); // a bare address
    if (pfx) setPrefix(d, dest, pfx.addr.family, pfx.length); // a written prefix
    else if (addr) { setPrefix(d, dest, addr.family, bitsOf(addr.family)); d.notes.push("host-route-no-length"); } // ip-route(8): "If the length of the prefix is missing, ip assumes a full-length host route"
    else { // "default": IP 0/0 or IPv6 ::/0 (ip-route(8))
      const hint = parseAddress(d.gateway ?? "") ?? parseAddress(d.src ?? ""); // a family hint on the same line
      if (hint) setPrefix(d, hint.family === "ipv4" ? "0.0.0.0" : "::", hint.family, 0); // decided by the line
      else d.notes.push("default-family-from-context"); // decided after every line is read
    }
    // On-link: a unicast route with a device and no gateway is delivered directly (ip-route(8) `dev`, no `via`).
    d.onLink = d.type === "unicast" && d.gateway === null && d.nexthops.length === 0; // re-checked when nexthops arrive
    out.routes.push(d); // keep it
    current = d; // continuation lines attach here
  }
  // The family of a bare `default` whose line carries no address: the family of the other routes, else IPv4.
  const fams = out.routes.filter((r) => r.family !== null).map((r) => r.family as Family); // the families seen
  const ctx: Family = fams.length > 0 && fams.every((f) => f === "ipv6") ? "ipv6" : "ipv4"; // all IPv6 means `ip -6 route`
  for (const r of out.routes) { // fix the undecided defaults
    if (r.family === null && r.destination === "default") setPrefix(r, ctx === "ipv4" ? "0.0.0.0" : "::", ctx, 0); // 0/0 in the context family
    if (r.nexthops.length > 0) r.onLink = false; // a multipath route is never on-link as a whole
  }
  return out; // the routes
}

// ---- net-tools: netstat -rn / route -n --------------------------------------

/** Parse Linux net-tools output: the "Kernel IP routing table" of `netstat -rn` and `route -n`. */
function parseNetstatLinux(lines: string[], lineNo: number[]): FormatParse {
  const out = emptyFormatParse(); // the result
  let header: string[] | null = null; // the column names
  let ipv6 = false; // inside a "Kernel IPv6 routing table"
  for (let k = 0; k < lines.length; k++) { // every line
    const line = lines[k]; // the text
    const toks = tokens(line); // its tokens
    if (toks.length === 0) continue; // blank
    const t = line.trim(); // the trimmed text
    if (isCommandEcho(toks)) { out.structureLines++; continue; } // "$ netstat -rn"
    if (t.startsWith("Kernel IP routing table")) { ipv6 = false; header = null; out.structureLines++; continue; } // the IPv4 title
    if (t.startsWith("Kernel IPv6 routing table")) { ipv6 = true; header = null; out.structureLines++; if (!out.warnings.includes("netstat-linux-ipv6")) out.warnings.push("netstat-linux-ipv6"); continue; } // route(8) documents the IPv4 columns only
    if (toks[0] === "Destination") { header = toks; out.structureLines++; continue; } // the column header
    if (ipv6 || header === null) { out.unparsedLines.push({ line: lineNo[k], text: line }); continue; } // rows with no documented header
    const col = (name: string): string | undefined => { const at = header!.indexOf(name); return at >= 0 ? toks[at] : undefined; }; // a column by header name
    const dest = col("Destination") ?? toks[0]; // the destination
    const d = draft(lineNo[k], line, "main", dest); // /proc/net/route holds the main table
    const gw = col("Gateway"); // the gateway column
    const mask = col("Genmask"); // the netmask column
    const flagsText = col("Flags") ?? ""; // the flags column
    d.flags = decodeFlags(flagsText, "linux"); // route(8)'s letters
    d.interface = col("Iface") ?? null; // the interface
    const metric = col("Metric"); // route -n prints Metric, netstat -rn does not
    if (metric !== undefined) { d.metric = intOrNull(metric); if (d.metric === null) d.metricText = metric; } // numeric or kept
    for (const extra of ["Ref", "Use", "MSS", "Window", "irtt"]) { const v = col(extra); if (v !== undefined) d.attributes.push({ key: extra, value: v }); } // the other columns
    if (toks.length > header.length) d.unparsed.push(...toks.slice(header.length)); // tokens beyond the header
    const len = mask !== undefined ? maskToLength(mask) : null; // Genmask to a length
    const destAddr = dest === "default" ? 0 : parseIpv4(dest); // route(8): '0.0.0.0' Genmask for the default route
    if (destAddr !== null && len !== null) setPrefix(d, dest === "default" ? "0.0.0.0" : dest, "ipv4", len); // address + mask
    else if (len === null && mask !== undefined) d.notes.push("non-contiguous-mask"); // a mask that is not a prefix
    else d.notes.push("destination-not-an-address"); // a name printed without -n
    const hasG = d.flags.some((f) => f.id === "LINUX_G"); // "G (use gateway)"
    if (d.flags.some((f) => f.id === "LINUX_REJECT")) d.type = "reject"; // "! (reject route)"
    d.gateway = hasG && gw !== undefined && gw !== "0.0.0.0" && gw !== "*" ? gw : null; // route(8): "'*' if none set"; -n prints 0.0.0.0
    d.onLink = d.type === "unicast" && !hasG; // no G: delivered on the link
    out.routes.push(d); // keep it
  }
  return out; // the routes
}

// ---- BSD / macOS: netstat -rn ------------------------------------------------

/** Parse FreeBSD and macOS `netstat -r` / `netstat -rn` output. */
function parseNetstatBsd(lines: string[], lineNo: number[]): FormatParse {
  const out = emptyFormatParse(); // the result
  let header: string[] | null = null; // the column names
  let section = "inet"; // "Internet:" until "Internet6:" is seen
  for (let k = 0; k < lines.length; k++) { // every line
    const line = lines[k]; // the text
    const toks = tokens(line); // its tokens
    if (toks.length === 0) continue; // blank
    const t = line.trim(); // trimmed
    if (isCommandEcho(toks)) { out.structureLines++; continue; } // "% netstat -nr"
    if (t === "Routing tables") { out.structureLines++; continue; } // the title
    if (t === "Internet:") { section = "inet"; header = null; out.structureLines++; continue; } // IPv4 section
    if (t === "Internet6:") { section = "inet6"; header = null; out.structureLines++; continue; } // IPv6 section
    if (toks[0] === "Destination") { header = toks; out.structureLines++; continue; } // the column header
    if (header === null) { out.unparsedLines.push({ line: lineNo[k], text: line }); continue; } // a row before any header
    // Columns are filled left to right: rows may stop early (no Netif, no Expire), as in the FreeBSD Handbook example.
    const cols: Record<string, string> = {}; // name -> value
    const n = Math.min(header.length, toks.length); // the cells present
    for (let c = 0; c < n; c++) cols[header[c]] = toks[c]; // assign in order
    const dest = cols["Destination"]; // the destination
    const d = draft(lineNo[k], line, section, dest); // the route
    if (toks.length > header.length) d.unparsed.push(...toks.slice(header.length)); // extra tokens (the Handbook's "=>")
    d.flags = decodeFlags(cols["Flags"] ?? "", "bsd"); // the letters
    d.interface = cols["Netif"] ?? null; // the interface
    for (const extra of ["Refs", "Use", "Expire", "Mtu", "MTU"]) { // the counter columns, all numeric in the manuals' descriptions
      const v = cols[extra]; // the cell, if present
      if (v === undefined) continue; // the row stopped before this column
      if (/^\d{1,12}$/.test(v)) d.attributes.push({ key: extra, value: v }); // a number: the column's value
      else d.unparsed.push(v); // not a number (the Handbook's "=>" after lo0): kept as unparsed
    }
    const fam: Family = section === "inet6" ? "ipv6" : "ipv4"; // the section's family
    d.family = fam; // "Internet:" is IPv4 and "Internet6:" is IPv6, even when the destination is a name
    const isHost = d.flags.some((f) => f.id === "RTF_HOST"); // "Host entry (net otherwise)"
    const pfx = parsePrefix(dest); // a written length (-n prints 10.0.0.0/24)
    const addr = pfx ? null : parseAddress(dest); // a bare address
    if (dest === "default") setPrefix(d, fam === "ipv4" ? "0.0.0.0" : "::", fam, 0); // the default route
    else if (pfx) setPrefix(d, dest, pfx.addr.family, pfx.length); // address/length
    else if (addr && isHost) setPrefix(d, dest, addr.family, bitsOf(addr.family)); // a host entry: full length
    else if (addr) d.notes.push("network-without-length"); // a network printed with no length: not converted
    else d.notes.push("destination-not-an-address"); // a name (output without -n) or an abbreviation
    const gw = cols["Gateway"] ?? null; // the gateway column
    const hasG = d.flags.some((f) => f.id === "RTF_GATEWAY"); // "Destination requires forwarding by intermediary"
    if (d.flags.some((f) => f.id === "RTF_REJECT")) d.type = "reject"; // "Host or net unreachable"
    else if (d.flags.some((f) => f.id === "RTF_BLACKHOLE")) d.type = "blackhole"; // "Just discard pkts"
    d.gateway = gw; // kept as printed: an address, a name, link#N or a MAC address
    d.onLink = d.type === "unicast" && !hasG; // without G the route is direct: "the gateway field for such entries shows the address of the outgoing interface"
    if (gw !== null && gw.startsWith("link#")) d.notes.push("gateway-link"); // link#N names an interface, not a router
    else if (gw !== null && !hasG && parseAddress(gw) === null && gw.includes(":") && !gw.includes("::")) d.notes.push("gateway-mac"); // a link-layer address
    out.routes.push(d); // keep it
  }
  return out; // the routes
}

// ---- Windows: route print ------------------------------------------------------

/** Parse Windows `route print` output: the Interface List and the IPv4 and IPv6 tables, active and persistent. */
function parseWindows(lines: string[], lineNo: number[]): FormatParse {
  const out = emptyFormatParse(); // the result
  let fam: Family | null = null; // the current table's family
  let store: "active" | "persistent" | null = null; // active or persistent routes
  let inIfList = false; // inside the Interface List
  let pendingV6: Draft | null = null; // an IPv6 row whose gateway wrapped onto the next line
  for (let k = 0; k < lines.length; k++) { // every line
    const line = lines[k]; // the text
    const toks = tokens(line); // its tokens
    if (toks.length === 0) continue; // blank
    const t = line.trim(); // trimmed
    if (pendingV6 && toks.length === 1 && (toks[0] === "On-link" || parseAddress(toks[0]) !== null)) { // the wrapped gateway of the row above
      pendingV6.gateway = toks[0] === "On-link" ? null : toks[0]; // the gateway
      pendingV6.onLink = toks[0] === "On-link"; // "On-link": directly attached
      pendingV6.raw += `\n${line}`; // keep the text
      pendingV6 = null; // consumed
      continue; // next line
    }
    pendingV6 = null; // any other line ends the wait
    if (isCommandEcho(toks)) { out.structureLines++; continue; } // "C:\...>route print"
    if (isRuler(line)) { inIfList = false; out.structureLines++; continue; } // ===== separators
    if (t === "Interface List") { inIfList = true; out.structureLines++; continue; } // the adapter list
    if (t === "IPv4 Route Table") { fam = "ipv4"; store = null; inIfList = false; out.structureLines++; continue; } // IPv4 table
    if (t === "IPv6 Route Table") { fam = "ipv6"; store = null; inIfList = false; out.structureLines++; continue; } // IPv6 table
    if (t === "Active Routes:") { store = "active"; out.structureLines++; continue; } // the active store
    if (t === "Persistent Routes:") { store = "persistent"; out.structureLines++; continue; } // the persistent store
    if (t === "None") { out.structureLines++; continue; } // an empty store
    if (t.startsWith("Network Destination") || t.startsWith("Network Address")) { fam = "ipv4"; out.structureLines++; continue; } // the IPv4 column headers (they also say which table an excerpt comes from)
    if (toks[0] === "If" && toks[1] === "Metric") { fam = "ipv6"; out.structureLines++; continue; } // the IPv6 column header
    if (inIfList) { // " 20...yy yy yy yy yy yy ......Intel(R) Gigabit ET"
      const m = /^(\d{1,5})\.+/.exec(t); // the index and the dots after it (anchored, one quantifier)
      if (m) { // an interface line
        const rest = t.slice(m[0].length); // the hardware address and the description
        const dots = rest.indexOf(".."); // the dot leader before the description
        const mac = dots >= 0 ? rest.slice(0, dots).trim() : ""; // the hardware address ("" for the loopback)
        const description = (dots >= 0 ? rest.slice(dots) : rest).replace(/^\.+/, "").trim(); // the description
        out.interfaces.push({ index: Number(m[1]), mac, description }); // keep it
        out.structureLines++; // recognised
        continue; // next line
      }
    }
    if (fam === null || store === null) { out.unparsedLines.push({ line: lineNo[k], text: line }); continue; } // a row outside any table
    const section = `${fam}-${store}`; // e.g. "ipv4-active"
    if (fam === "ipv4") { // Network Destination, Netmask, Gateway, Interface, Metric (active); no Interface (persistent)
      const want = store === "active" ? 5 : 4; // the column count
      if (toks.length < want) { out.unparsedLines.push({ line: lineNo[k], text: line }); continue; } // too few cells
      const [dest, mask] = toks; // the first two cells
      const gw = toks[2]; // the gateway
      const iface = store === "active" ? toks[3] : null; // the interface address (active only)
      const metricText = toks[want - 1]; // the metric
      const d = draft(lineNo[k], line, section, dest); // the route
      if (toks.length > want) d.unparsed.push(...toks.slice(want)); // anything after the metric
      d.interface = iface; // the local interface address
      d.metric = intOrNull(metricText); // a number
      if (d.metric === null) d.metricText = metricText; // "Default" in the persistent store
      const len = maskToLength(mask); // Netmask to a length
      const addr = parseIpv4(dest); // the destination address
      if (addr !== null && len !== null) setPrefix(d, dest, "ipv4", len); // destination + netmask
      else { d.family = "ipv4"; d.notes.push(len === null && parseIpv4(mask) !== null ? "non-contiguous-mask" : "destination-not-an-address"); } // kept as printed
      d.onLink = gw === "On-link"; // "On-link": the destination is on the interface's link
      d.gateway = d.onLink ? null : gw; // otherwise the next-hop address
      out.routes.push(d); // keep it
      continue; // next line
    }
    // IPv6: If, Metric, Network Destination, Gateway (the gateway may wrap onto the next line)
    if (toks.length < 3) { out.unparsedLines.push({ line: lineNo[k], text: line }); continue; } // too few cells
    const [ifText, metricText, dest] = toks; // the first three cells
    const d = draft(lineNo[k], line, section, dest); // the route
    d.interface = ifText; // the interface index (see the Interface List)
    d.metric = intOrNull(metricText); // the metric
    if (d.metric === null) d.metricText = metricText; // kept when not a number
    const pfx = parsePrefix(dest); // address/length
    if (pfx && pfx.addr.family === "ipv6") setPrefix(d, dest, "ipv6", pfx.length); // an IPv6 prefix
    else { d.family = "ipv6"; d.notes.push("destination-not-an-address"); } // kept as printed (e.g. a redacted address)
    if (toks.length >= 4) { d.onLink = toks[3] === "On-link"; d.gateway = d.onLink ? null : toks[3]; } // the gateway on the same line
    else pendingV6 = d; // wait for the wrapped gateway
    if (toks.length > 4) d.unparsed.push(...toks.slice(4)); // anything after the gateway
    out.routes.push(d); // keep it
  }
  return out; // the routes
}

// ---- unknown text --------------------------------------------------------------

/** Text no parser recognised: command echoes count as structure, every other non-blank line is kept as unparsed. */
function parseUnknown(lines: string[], lineNo: number[]): FormatParse {
  const out = emptyFormatParse(); // the result
  for (let k = 0; k < lines.length; k++) { // every line
    const toks = tokens(lines[k]); // its tokens
    if (toks.length === 0) continue; // blank
    if (isCommandEcho(toks)) { out.structureLines++; continue; } // "$ ip -6 route show" with nothing after it
    out.unparsedLines.push({ line: lineNo[k], text: lines[k] }); // kept, never dropped
  }
  return out; // no routes
}

// ---------------------------------------------------------------------------
// Defaults, and the order in which sections are consulted
// ---------------------------------------------------------------------------

/**
 * The sections a lookup consults, in order, for a format and a family.
 * iproute2: the three default policy rules of ip-route(8)/ip-rule(8): "lookup routing table local (ID 255)",
 * then main (ID 254), then default (ID 253); any other table is reached only through a rule of its own.
 * Windows: the active store (the persistent store is configuration, Microsoft Learn, KB 2966111).
 */
export function lookupOrder(format: RouteFormat, family: Family): string[] {
  if (format === "iproute2") return ["local", "main", "default", "255", "254", "253"]; // names or numbers, local first
  if (format === "windows") return [`${family}-active`]; // the active store only
  if (format === "netstat-bsd") return [family === "ipv4" ? "inet" : "inet6"]; // the family's section
  if (format === "netstat-linux") return ["main"]; // /proc/net/route is the main table
  return []; // nothing to consult
}

/** Map table numbers to names so "255" and "local" are one stage. */
function canonicalSection(format: RouteFormat, section: string): string {
  if (format !== "iproute2") return section; // only iproute2 has numbered tables
  if (section === "255") return "local"; // ip-route(8): local table (ID 255)
  if (section === "254") return "main"; // main table (ID 254)
  if (section === "253") return "default"; // default table (ID 253)
  return section; // any other table
}

/** The metric used to compare routes: iproute2 omits a zero metric from its listing, so a missing one reads as 0 there. */
function compareMetric(format: RouteFormat, r: ParsedRoute): number | null {
  if (r.metric !== null) return r.metric; // printed
  return format === "iproute2" ? 0 : null; // iproute2 prints no metric for 0 (the same route reads Metric 0 in route -n); elsewhere unknown
}

/** Group the default routes per section and pick the winner by metric. */
function computeDefaults(format: RouteFormat, routes: ParsedRoute[]): DefaultGroup[] {
  const groups = new Map<string, number[]>(); // section -> default indices
  for (const r of routes) { // every route
    if (!r.isDefault) continue; // defaults only
    const key = `${canonicalSection(format, r.section)}|${r.family}`; // one group per section and family
    groups.set(key, [...(groups.get(key) ?? []), r.index]); // append
  }
  const out: DefaultGroup[] = []; // the groups
  for (const [key, candidates] of groups) { // in first-seen order
    const [section, fam] = key.split("|"); // unpack
    const consulted = lookupOrder(format, fam as Family).includes(section); // reached by a lookup?
    if (candidates.length === 1) { out.push({ section, consulted, candidates, winner: candidates[0], reason: "single" }); continue; } // one default
    const metrics = candidates.map((i) => compareMetric(format, routes[i])); // their metrics
    if (metrics.some((m) => m === null)) { out.push({ section, consulted, candidates, winner: null, reason: "no-metric" }); continue; } // cannot rank
    const best = Math.min(...(metrics as number[])); // the lowest metric
    const winners = candidates.filter((_, j) => metrics[j] === best); // who has it
    out.push({ section, consulted, candidates, winner: winners.length === 1 ? winners[0] : null, reason: winners.length === 1 ? "lowest-metric" : "equal-metric" }); // decided or tied
  }
  return out; // per section
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/** Parse a pasted routing table. Never throws: text that is not a routing table yields format "unknown". */
export function parseRoutingTable(input: string): RoutingTableParse {
  const warnings: string[] = []; // collected warnings
  let all = input.replace(/\r\n?/g, "\n").split("\n"); // normalise line endings
  if (all.length > MAX_LINES) { all = all.slice(0, MAX_LINES); warnings.push("truncated"); } // the line cap
  const lines: string[] = []; // the lines that are parsed
  const lineNo: number[] = []; // their 1-based numbers
  const longLines: UnparsedLine[] = []; // lines over the length cap
  for (let i = 0; i < all.length; i++) { // every line
    if (all[i].length > MAX_LINE_LENGTH) { longLines.push({ line: i + 1, text: all[i].slice(0, MAX_LINE_LENGTH) }); continue; } // kept, unparsed
    lines.push(all[i]); // parsed
    lineNo.push(i + 1); // its number
  }
  if (longLines.length > 0) warnings.push("line-too-long"); // say so
  const format = detectFormat(lines); // which command
  const fp = format === "iproute2" ? parseIproute2(lines, lineNo) // ip route
    : format === "netstat-linux" ? parseNetstatLinux(lines, lineNo) // netstat -rn on Linux
    : format === "netstat-bsd" ? parseNetstatBsd(lines, lineNo) // netstat -rn on BSD / macOS
    : format === "windows" ? parseWindows(lines, lineNo) // route print
    : parseUnknown(lines, lineNo); // unknown: every line kept
  const routes: ParsedRoute[] = fp.routes.map((d, index) => ({ index, ...d })); // number the routes
  const unparsedLines = [...fp.unparsedLines, ...longLines].sort((a, b) => a.line - b.line); // in line order
  if (routes.length === 0 && input.trim() !== "") warnings.push("no-routes"); // nothing recognised
  for (const w of fp.warnings) if (!warnings.includes(w)) warnings.push(w); // format warnings
  return { // the parse
    format, // the command
    routes, // every route
    interfaces: fp.interfaces, // Windows Interface List
    defaults: computeDefaults(format, routes), // the default routes per section
    unparsedLines, // never dropped silently
    structureLines: fp.structureLines, // recognised structure
    lineCount: all.length, // lines read
    warnings, // codes
  };
}

/** The action a winning route takes. */
function actionOf(r: ParsedRoute): LookupAction {
  if (r.nexthops.length > 0) return "multipath"; // several next hops
  switch (r.type) { // by type
    case "unicast": return r.gateway !== null && !r.onLink ? "via" : "on-link"; // forwarded or delivered directly
    case "local": return "local"; // delivered to this host
    case "broadcast": return "broadcast"; // a link broadcast
    case "multicast": return "multicast"; // multicast routing
    case "unreachable": return "unreachable"; // ICMP host unreachable
    case "blackhole": return "blackhole"; // silently discarded
    case "prohibit": return "prohibit"; // ICMP administratively prohibited
    case "reject": return "reject"; // reject flag
    case "nat": return "nat"; // Route NAT (no longer supported)
    case "anycast": return "anycast"; // not implemented
    default: return "on-link"; // not reached: every type is listed above
  }
}

/**
 * Which route does `destination` use? Runs basic match, then longest match, then the lowest metric, section by section
 * in the order a lookup consults them; an iproute2 `throw` winner ends that table's lookup "pretending that no route was
 * found" (ip-route(8)), so the next table is consulted.
 */
export function lookupRoute(parse: RoutingTableParse, destination: string): LookupResult {
  const dest = parseAddress(destination.trim()); // the address asked about
  if (!dest || destination.includes("%")) throw new RouteLookupError("bad-address", `not an IPv4 or IPv6 address: ${destination.trim().slice(0, 64)}`); // refuse anything else
  const order = lookupOrder(parse.format, dest.family); // the sections to consult
  const sameFamily = parse.routes.filter((r) => r.family === dest.family); // routes of this family
  const unusable = sameFamily.filter((r) => r.prefixLength === null).map((r) => r.index); // destinations that are not address/length
  const sectionsSeen: string[] = []; // every section of this family, in first-seen order
  for (const r of sameFamily) { const s = canonicalSection(parse.format, r.section); if (!sectionsSeen.includes(s)) sectionsSeen.push(s); } // collect
  const skipped: LookupResult["skipped"] = []; // sections not consulted
  for (const s of sectionsSeen) if (!order.includes(s)) skipped.push({ section: s, reason: parse.format === "windows" ? "persistent-store" : "policy-rule-only" }); // why
  const stages: LookupStage[] = []; // the stages run
  const consultOrder = order.filter((s, i) => order.indexOf(s) === i && sectionsSeen.includes(canonicalSection(parse.format, s))).map((s) => canonicalSection(parse.format, s)); // present sections in order
  const uniqueOrder = consultOrder.filter((s, i) => consultOrder.indexOf(s) === i); // without repeats
  for (const section of uniqueOrder) { // each table in turn
    const pool = sameFamily.filter((r) => canonicalSection(parse.format, r.section) === section && r.prefixLength !== null); // usable routes of the section
    const candidates = pool.filter((r) => contains(parseAddress(r.prefix!.slice(0, r.prefix!.lastIndexOf("/")))!, r.prefixLength!, dest)).map((r) => r.index); // basic match
    if (candidates.length === 0) { stages.push({ section, candidates, longest: null, survivors: [], winner: null, outcome: "no-match", decidedBy: null }); continue; } // nothing here: next table
    const longest = Math.max(...candidates.map((i) => parse.routes[i].prefixLength!)); // the largest length
    const survivors = candidates.filter((i) => parse.routes[i].prefixLength === longest); // longest match
    let winner: number | null = null; // the pick
    let decidedBy: LookupStage["decidedBy"] = null; // and why
    if (survivors.length === 1) { winner = survivors[0]; decidedBy = candidates.length === 1 ? "only-candidate" : "longest-prefix"; } // one survivor
    else { // equal lengths: the metric decides
      const metrics = survivors.map((i) => compareMetric(parse.format, parse.routes[i])); // their metrics
      if (!metrics.some((m) => m === null)) { // every metric known
        const best = Math.min(...(metrics as number[])); // the lowest
        const tops = survivors.filter((_, j) => metrics[j] === best); // who has it
        if (tops.length === 1) { winner = tops[0]; decidedBy = "lowest-metric"; } // decided
      }
    }
    if (winner === null) { stages.push({ section, candidates, longest, survivors, winner: null, outcome: "tie", decidedBy: null }); return { destination: destination.trim(), family: dest.family, stages, skipped, unusable, winner: null, action: "tie", decidedBy: null }; } // the rules here cannot decide
    if (parse.routes[winner].type === "throw") { stages.push({ section, candidates, longest, survivors, winner, outcome: "throw", decidedBy }); continue; } // the lookup leaves this table
    stages.push({ section, candidates, longest, survivors, winner, outcome: "match", decidedBy }); // decided
    return { destination: destination.trim(), family: dest.family, stages, skipped, unusable, winner, action: actionOf(parse.routes[winner]), decidedBy }; // the answer
  }
  return { destination: destination.trim(), family: dest.family, stages, skipped, unusable, winner: null, action: "no-route", decidedBy: null }; // nothing matched
}

/** The full answer: the parse, plus a lookup when a destination is given. */
export interface RoutingTableResult {
  parse: RoutingTableParse; // the parse
  lookup: LookupResult | null; // the lookup, or null when none was asked
}

/** Run the explainer: parse the text and, when `destination` is non-empty, look it up. */
export function explain(input: string, destination?: string): RoutingTableResult {
  const parse = parseRoutingTable(input); // always parse
  const d = (destination ?? "").trim(); // the destination, if any
  return { parse, lookup: d === "" ? null : lookupRoute(parse, d) }; // with or without a lookup
}

/**
 * The API entry point. The request is either the pasted text itself, or a JSON object
 * {"text": "<the pasted output>", "lookup": "<an address>"} when a lookup is wanted.
 */
export function runRoutingTableApi(input: string): RoutingTableResult {
  const t = input.trimStart(); // a JSON request starts with "{"
  if (!t.startsWith("{")) return explain(input); // plain text: parse only
  let body: unknown; // the decoded request
  try { body = JSON.parse(t); } catch { throw new RouteLookupError("bad-request", "the request starts with { but is not valid JSON; send the output as text, or {\"text\": ..., \"lookup\": ...}"); } // our own message, not a native error
  if (typeof body !== "object" || body === null || typeof (body as { text?: unknown }).text !== "string") throw new RouteLookupError("bad-request", "a JSON request needs a \"text\" string with the routing table output"); // the field is required
  const lookup = (body as { lookup?: unknown }).lookup; // the optional address
  if (lookup !== undefined && typeof lookup !== "string") throw new RouteLookupError("bad-request", "\"lookup\" must be a string holding an IPv4 or IPv6 address"); // wrong type
  return explain((body as { text: string }).text, lookup); // parse and look up
}
