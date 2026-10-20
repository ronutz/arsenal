// ============================================================================
// src/lib/tools/routing-table-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the routing table explainer.
//
// EVERY INPUT IS REAL OUTPUT, copied byte for byte (trailing spaces, tabs,
// no-break spaces and em spaces included), from one of three kinds of origin:
//   * captured in the build sandbox on Monday 2026-10-19 at 17:00:21 -03
//     (Ubuntu 24.04.5 LTS, kernel 6.18.44, iproute2 6.1.0-1ubuntu6.4,
//     net-tools 2.10-0.1ubuntu4.4). The sandbox sits on 192.0.2.0/24, a
//     documentation range (RFC 5737), so its addresses are kept as captured;
//     table 100 was filled for the capture with routes to documentation
//     prefixes only, and emptied afterwards;
//   * printed in a document downloaded and read on 2026-10-19 (the FreeBSD
//     Handbook, FRRouting's Zebra page, two Microsoft Learn pages). Those
//     documents use their own example addresses (some RFC 1918 private ones,
//     and FRR's 4.4.4.4); they are quoted as printed, not changed, because the
//     vector is the document's text;
//   * nothing else: no input here was typed from memory.
// Each vector names its origin in `source`. The expected values are what the
// cited manual says each field means, or COMPUTED by the rule named in the
// vector's comment (basic match and longest match, RFC 1812 section 5.2.4.3;
// lowest metric, ip-route(8) and Microsoft Learn).
//
// verifyVectors() runs every vector and throws on the first mismatch.
// ============================================================================

import {
  parseRoutingTable, // the parser
  lookupRoute, // the lookup
  decodeFlags, // the flag decoder
  runRoutingTableApi, // the API entry point
  RouteLookupError, // the typed error
  type RouteFormat, // format names
  type LookupAction, // lookup actions
  type DefaultGroup, // default groups
  type RouteLookupErrorCode, // error codes
} from "./compute";

/** The id of this vector set; bump it whenever a vector or an expectation changes. */
export const GOLDEN_VECTOR_SET_ID = "routing-table-explainer/2026-10-19a"; // first set, 2026-10-19

/** What a parse must produce (only the fields given are checked). */
export interface ParseExpect {
  format: RouteFormat; // the detected command
  routes: number; // how many routes
  prefixes?: (string | null)[]; // every route's prefix, in order
  types?: string[]; // every route's type, in order
  gateways?: (string | null)[]; // every route's gateway, in order
  sections?: string[]; // every route's table or section, in order
  metrics?: (number | null)[]; // every route's numeric metric, in order
  defaults?: DefaultGroup[]; // the default groups, exactly
  structureLines?: number; // structure lines recognised
  unparsedLines?: number[]; // the line numbers kept as unparsed
  interfaces?: number; // Windows Interface List entries
  warnings?: string[]; // warning codes, exactly
  checks?: { route: number; field: string; value: unknown }[]; // spot checks on single routes (JSON-compared)
}

/** What a lookup must produce. */
export interface LookupExpect {
  destination: string; // the address asked about
  winner: number | null; // the route index used
  action: LookupAction; // what happens to the packet
  decidedBy: "only-candidate" | "longest-prefix" | "lowest-metric" | null; // the rule that decided
  stages: string[]; // "section:outcome" for every stage, in order
  candidates?: number[]; // the basic-match candidates of the last stage
}

/** One golden vector: real output, where it comes from, and what it must parse to. */
export interface RoutingVector {
  id: string; // stable id
  source: string; // where the text comes from (document and section, or the capture)
  input: string; // the text, byte for byte
  expect: ParseExpect; // the parse
  lookups?: LookupExpect[]; // lookups over the parse
}

/** A flag-decoding vector: computed from a manual's letter table, not an output. */
export interface FlagVector {
  id: string; // stable id
  source: string; // the manual's table
  letters: string; // the letters
  family: "bsd" | "linux"; // which table
  ids: (string | null)[]; // the expected names, letter by letter
}

/** A refusal vector: the lookup or the API request must fail with this code. */
export interface RejectVector {
  id: string; // stable id
  kind: "lookup" | "api"; // which entry point
  input: string; // the text (for lookups: the vector id whose input is parsed first)
  destination?: string; // the address, for lookups
  code: RouteLookupErrorCode; // the expected code
}

// ---------------------------------------------------------------------------
// The vectors
// ---------------------------------------------------------------------------

/** The sandbox capture: where each vector's text was copied from. */
const SANDBOX = "Live capture in the build sandbox, Monday 2026-10-19 17:00:21 -03 (Ubuntu 24.04.5 LTS, kernel 6.18.44-fc-v139, iproute2 6.1.0-1ubuntu6.4, net-tools 2.10); addresses are the sandbox's own, a documentation range (RFC 5737)"; // shared label

export const ROUTING_VECTORS: readonly RoutingVector[] = Object.freeze([
  { // one vector
    // The Example button's text. Two routes: the default (ip-route(8): "default - which is equivalent to IP 0/0")
    // and the connected prefix (no `via`: delivered on eth0). Lookups computed by RFC 1812 s5.2.4.3.
    id: "sandbox-ip-route-show", // stable id
    source: `${SANDBOX}: \`ip route show\``, // where the text comes from
    input: "$ ip route show\ndefault via 192.0.2.1 dev eth0 \n192.0.2.0/24 dev eth0 proto kernel scope link src 192.0.2.2 ", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "iproute2", // iproute2 lines
      routes: 2, // two routes
      prefixes: ["0.0.0.0/0", "192.0.2.0/24"], // default = 0/0
      types: ["unicast", "unicast"], // ip-route(8): "If TYPE is omitted, ip assumes type unicast"
      gateways: ["192.0.2.1", null], // via, then none
      structureLines: 1, // the "$ ip route show" echo
      unparsedLines: [], // nothing left over
      defaults: [{ section: "main", consulted: true, candidates: [0], winner: 0, reason: "single" }], // one default
      checks: [ // spot checks on single routes
        { route: 1, field: "protocol", value: "kernel" }, // "installed by the kernel during autoconfiguration"
        { route: 1, field: "scope", value: "link" }, // "scope link for direct unicast"
        { route: 1, field: "src", value: "192.0.2.2" }, // the preferred source address
        { route: 1, field: "onLink", value: true }, // no via: on the link
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      // 198.51.100.7 is inside only 0.0.0.0/0: the default decides (COMPUTED, basic match).
      { destination: "198.51.100.7", winner: 0, action: "via", decidedBy: "only-candidate", stages: ["main:match"], candidates: [0] }, // see the comment above
      // 192.0.2.77 is inside /0 and /24: longest match keeps /24, delivered on-link (COMPUTED; the same answer
      // `ip route get 192.0.2.77` gave in the NF-2e capture of 01:02:55: "192.0.2.77 dev eth0 src 192.0.2.2", no via).
      { destination: "192.0.2.77", winner: 1, action: "on-link", decidedBy: "longest-prefix", stages: ["main:match"], candidates: [0, 1] }, // see the comment above
    ],
  }, // end of the vector
  { // one vector
    // Every table: table 100 (filled for the capture), main, and the local table the kernel maintains ("This table
    // consists of routes for local and broadcast addresses", ip-route(8)). Lookups follow the three default policy
    // rules (ip-rule(8): local at priority 0, main at 32766, default at 32767); table 100 is reached by no rule.
    id: "sandbox-ip-route-show-table-all", // stable id
    source: `${SANDBOX}: \`ip route show table all\``, // where the text comes from
    input: "$ ip route show table all\ndefault via 192.0.2.1 dev eth0 table 100 metric 100 \ndefault via 192.0.2.254 dev eth0 table 100 metric 200 \nthrow 192.0.2.128/25 table 100 \nblackhole 198.51.100.0/24 table 100 \n198.51.100.64/26 via 192.0.2.253 dev eth0 table 100 proto static metric 50 \nunreachable 203.0.113.0/25 table 100 \nprohibit 203.0.113.128/25 table 100 \n203.0.113.200 via 198.51.100.1 dev eth0 table 100 onlink \ndefault via 192.0.2.1 dev eth0 \n192.0.2.0/24 dev eth0 proto kernel scope link src 192.0.2.2 \nlocal 127.0.0.0/8 dev lo table local proto kernel scope host src 127.0.0.1 \nlocal 127.0.0.1 dev lo table local proto kernel scope host src 127.0.0.1 \nbroadcast 127.255.255.255 dev lo table local proto kernel scope link src 127.0.0.1 \nlocal 192.0.2.2 dev eth0 table local proto kernel scope host src 192.0.2.2 \nbroadcast 192.0.2.255 dev eth0 table local proto kernel scope link src 192.0.2.2 ", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "iproute2", // iproute2 lines
      routes: 15, // 8 in table 100, 2 in main, 5 in local
      prefixes: ["0.0.0.0/0", "0.0.0.0/0", "192.0.2.128/25", "198.51.100.0/24", "198.51.100.64/26", "203.0.113.0/25", "203.0.113.128/25", "203.0.113.200/32", "0.0.0.0/0", "192.0.2.0/24", "127.0.0.0/8", "127.0.0.1/32", "127.255.255.255/32", "192.0.2.2/32", "192.0.2.255/32"], // "If the length of the prefix is missing, ip assumes a full-length host route"
      types: ["unicast", "unicast", "throw", "blackhole", "unicast", "unreachable", "prohibit", "unicast", "unicast", "unicast", "local", "local", "broadcast", "local", "broadcast"], // as printed
      sections: ["100", "100", "100", "100", "100", "100", "100", "100", "main", "main", "local", "local", "local", "local", "local"], // `table` tokens; none means main
      metrics: [100, 200, null, null, 50, null, null, null, null, null, null, null, null, null, null], // printed metrics
      structureLines: 1, // the command echo
      unparsedLines: [], // nothing left over
      defaults: [ // the default groups, exactly
        { section: "100", consulted: false, candidates: [0, 1], winner: 0, reason: "lowest-metric" }, // "routes with lower values are preferred": 100 beats 200
        { section: "main", consulted: true, candidates: [8], winner: 8, reason: "single" }, // the one the host uses
      ],
      checks: [ // spot checks on single routes
        { route: 7, field: "nhFlags", value: ["onlink"] }, // "pretend that the nexthop is directly attached to this link"
        { route: 4, field: "protocol", value: "static" }, // "installed by the administrator"
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      // Not in local; in main only /0 contains it (COMPUTED).
      { destination: "198.51.100.7", winner: 8, action: "via", decidedBy: "only-candidate", stages: ["local:no-match", "main:match"], candidates: [8] }, // see the comment above
      // The local table is consulted first and holds 127.0.0.0/8 and 127.0.0.1: the /32 wins, type local.
      { destination: "127.0.0.1", winner: 11, action: "local", decidedBy: "longest-prefix", stages: ["local:match"], candidates: [10, 11] }, // see the comment above
      // The host's own address: local table, "The packets are looped back and delivered locally".
      { destination: "192.0.2.2", winner: 13, action: "local", decidedBy: "only-candidate", stages: ["local:match"], candidates: [13] }, // see the comment above
      // 192.0.2.200 is in 192.0.2.128/25 of table 100, but no rule reaches table 100: main's /24 delivers it on-link.
      { destination: "192.0.2.200", winner: 9, action: "on-link", decidedBy: "longest-prefix", stages: ["local:no-match", "main:match"], candidates: [8, 9] }, // see the comment above
    ],
  }, // end of the vector
  { // one vector
    // The same table 100 listed alone with -d: the type is printed on every line and the defaults it hides
    // (`proto boot`, `scope global`) appear. A listing of one table carries no `table` token, so the engine reads it
    // as table main, the listing default (ip-route(8): "The default setting is to show table main").
    id: "sandbox-ip-d-route-show-table-100", // stable id
    source: `${SANDBOX}: \`ip -d route show table 100\``, // where the text comes from
    input: "$ ip -d route show table 100\nunicast default via 192.0.2.1 dev eth0 proto boot scope global metric 100 \nunicast default via 192.0.2.254 dev eth0 proto boot scope global metric 200 \nthrow 192.0.2.128/25 proto boot scope global \nblackhole 198.51.100.0/24 proto boot scope global \nunicast 198.51.100.64/26 via 192.0.2.253 dev eth0 proto static scope global metric 50 \nunreachable 203.0.113.0/25 proto boot scope global \nprohibit 203.0.113.128/25 proto boot scope global \nunicast 203.0.113.200 via 198.51.100.1 dev eth0 proto boot scope global onlink ", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "iproute2", // iproute2 lines
      routes: 8, // the eight routes of table 100
      types: ["unicast", "unicast", "throw", "blackhole", "unicast", "unreachable", "prohibit", "unicast"], // printed by -d
      gateways: ["192.0.2.1", "192.0.2.254", null, null, "192.0.2.253", null, null, "198.51.100.1"], // via addresses
      defaults: [{ section: "main", consulted: true, candidates: [0, 1], winner: 0, reason: "lowest-metric" }], // metric 100 beats 200
      checks: [ // spot checks on single routes
        { route: 0, field: "protocol", value: "boot" }, // "If the routing protocol ID is not given, ip assumes protocol boot"
        { route: 0, field: "scope", value: "global" }, // "scope global for all gatewayed unicast routes"
        { route: 3, field: "scope", value: "global" }, // printed as such for the blackhole route
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      // Two /0 survive for 192.0.2.5: equal length, metric 100 < 200 decides ("routes with lower values are preferred").
      { destination: "192.0.2.5", winner: 0, action: "via", decidedBy: "lowest-metric", stages: ["main:match"], candidates: [0, 1] }, // see the comment above
      // 192.0.2.130: the /25 throw route is the longest match; "lookup in this table is terminated pretending that no
      // route was found", and no other table is present, so nothing routes it.
      { destination: "192.0.2.130", winner: null, action: "no-route", decidedBy: null, stages: ["main:throw"], candidates: [0, 1, 2] }, // see the comment above
      // 198.51.100.70: /0, /0, the /24 blackhole and the /26 unicast contain it; /26 is longest.
      { destination: "198.51.100.70", winner: 4, action: "via", decidedBy: "longest-prefix", stages: ["main:match"], candidates: [0, 1, 3, 4] }, // see the comment above
      // 198.51.100.5: the /24 blackhole wins: "Packets are discarded silently".
      { destination: "198.51.100.5", winner: 3, action: "blackhole", decidedBy: "longest-prefix", stages: ["main:match"], candidates: [0, 1, 3] }, // see the comment above
      // 203.0.113.5: the /25 unreachable route: "the ICMP message host unreachable is generated".
      { destination: "203.0.113.5", winner: 5, action: "unreachable", decidedBy: "longest-prefix", stages: ["main:match"], candidates: [0, 1, 5] }, // see the comment above
      // 203.0.113.150: the /25 prohibit route: "communication administratively prohibited".
      { destination: "203.0.113.150", winner: 6, action: "prohibit", decidedBy: "longest-prefix", stages: ["main:match"], candidates: [0, 1, 6] }, // see the comment above
      // 203.0.113.200: the /32 host route beats the /25 prohibit route that also contains it.
      { destination: "203.0.113.200", winner: 7, action: "via", decidedBy: "longest-prefix", stages: ["main:match"], candidates: [0, 1, 6, 7] }, // see the comment above
    ],
  }, // end of the vector
  { // one vector
    // The sandbox kernel has no IPv6 (/proc/sys/net/ipv6 is absent), so `ip -6 route show` printed nothing: the paste
    // is the echoed command alone. Not a routing table: format unknown, no routes, the no-routes warning.
    id: "sandbox-ip-6-route-show-empty", // stable id
    source: `${SANDBOX}: \`ip -6 route show\` (empty output: no IPv6 in the sandbox kernel)`, // where the text comes from
    input: "$ ip -6 route show", // the text byte for byte, as `source` gives it
    expect: { format: "unknown", routes: 0, structureLines: 1, unparsedLines: [], warnings: ["no-routes"] }, // nothing to read
  }, // end of the vector
  { // one vector
    // net-tools: "netstat -r and route -e produce the same output" (netstat(8)); columns from route(8) OUTPUT.
    id: "sandbox-netstat-rn", // stable id
    source: `${SANDBOX}: \`netstat -rn\``, // where the text comes from
    input: "$ netstat -rn\nKernel IP routing table\nDestination     Gateway         Genmask         Flags   MSS Window  irtt Iface\n0.0.0.0         192.0.2.1       0.0.0.0         UG        0 0          0 eth0\n192.0.2.0       0.0.0.0         255.255.255.0   U         0 0          0 eth0", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "netstat-linux", // "Kernel IP routing table"
      routes: 2, // two rows
      prefixes: ["0.0.0.0/0", "192.0.2.0/24"], // Genmask "'0.0.0.0' for the default route"; 255.255.255.0 = /24
      gateways: ["192.0.2.1", null], // 0.0.0.0 without G: no gateway
      metrics: [null, null], // netstat -rn prints no Metric column
      structureLines: 3, // echo, title, header
      defaults: [{ section: "main", consulted: true, candidates: [0], winner: 0, reason: "single" }], // one default
      checks: [ // spot checks on single routes
        { route: 0, field: "flags", value: [{ letter: "U", id: "LINUX_U", source: "linux" }, { letter: "G", id: "LINUX_G", source: "linux" }] }, // "U (route is up)", "G (use gateway)"
        { route: 0, field: "attributes", value: [{ key: "MSS", value: "0" }, { key: "Window", value: "0" }, { key: "irtt", value: "0" }] }, // the three TCP columns
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      { destination: "192.0.2.77", winner: 1, action: "on-link", decidedBy: "longest-prefix", stages: ["main:match"], candidates: [0, 1] }, // COMPUTED: /24 beats /0
    ],
  }, // end of the vector
  { // one vector
    // `route -n` prints Metric, Ref and Use where netstat -rn prints MSS, Window and irtt (route(8) OUTPUT).
    id: "sandbox-route-n", // stable id
    source: `${SANDBOX}: \`route -n\``, // where the text comes from
    input: "$ route -n\nKernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n0.0.0.0         192.0.2.1       0.0.0.0         UG    0      0        0 eth0\n192.0.2.0       0.0.0.0         255.255.255.0   U     0      0        0 eth0", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "netstat-linux", // same title
      routes: 2, // two rows
      metrics: [0, 0], // "The 'distance' to the target"
      checks: [ // spot checks on single routes
        { route: 1, field: "attributes", value: [{ key: "Ref", value: "0" }, { key: "Use", value: "0" }] }, // "Ref ... (Not used in the Linux kernel.)"
        { route: 1, field: "onLink", value: true }, // no G flag
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      { destination: "203.0.113.9", winner: 0, action: "via", decidedBy: "only-candidate", stages: ["main:match"], candidates: [0] }, // only the default contains it
    ],
  }, // end of the vector
  { // one vector
    // FRRouting documentation, Zebra, "ECMP": the Linux kernel's view of a 16-way ECMP route that FRR's sharpd
    // installed, printed by `ip route show 4.4.4.4/32` (FRR's own example addresses, quoted as printed). One route,
    // sixteen `nexthop` continuation lines; `proto sharp` is not one of ip-route(8)'s fixed values ("The rest of the
    // values are not reserved"), `nhid` names a nexthop object.
    id: "frr-multipath", // stable id
    source: "FRRouting documentation, Zebra (latest), section on ECMP: the `ip route show 4.4.4.4/32` example (https://docs.frrouting.org/en/latest/zebra.html, read 2026-10-19)", // where the text comes from
    input: "sharpd@eva ~/f/doc(ecmp_doc_change)> ip route show 4.4.4.4/32\n4.4.4.4 nhid 185483868 proto sharp metric 20\n   nexthop via 192.168.161.1 dev enp39s0 weight 1\n   nexthop via 192.168.161.10 dev enp39s0 weight 1\n   nexthop via 192.168.161.11 dev enp39s0 weight 1\n   nexthop via 192.168.161.12 dev enp39s0 weight 1\n   nexthop via 192.168.161.13 dev enp39s0 weight 1\n   nexthop via 192.168.161.14 dev enp39s0 weight 1\n   nexthop via 192.168.161.15 dev enp39s0 weight 1\n   nexthop via 192.168.161.16 dev enp39s0 weight 1\n   nexthop via 192.168.161.2 dev enp39s0 weight 1\n   nexthop via 192.168.161.3 dev enp39s0 weight 1\n   nexthop via 192.168.161.4 dev enp39s0 weight 1\n   nexthop via 192.168.161.5 dev enp39s0 weight 1\n   nexthop via 192.168.161.6 dev enp39s0 weight 1\n   nexthop via 192.168.161.7 dev enp39s0 weight 1\n   nexthop via 192.168.161.8 dev enp39s0 weight 1\n   nexthop via 192.168.161.9 dev enp39s0 weight 1", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "iproute2", // iproute2 lines
      routes: 1, // one route
      prefixes: ["4.4.4.4/32"], // a host route
      metrics: [20], // metric 20
      structureLines: 1, // the prompt line
      unparsedLines: [], // every nexthop line attached
      checks: [ // spot checks on single routes
        { route: 0, field: "protocol", value: "sharp" }, // not a fixed value
        { route: 0, field: "attributes", value: [{ key: "nhid", value: "185483868" }] }, // "use nexthop object with given id"
        { route: 0, field: "nexthopCount", value: 16 }, // sixteen hops
        { route: 0, field: "firstNexthop", value: { gateway: "192.168.161.1", dev: "enp39s0", weight: 1, flags: [], unparsed: [] } }, // "weight NUMBER - is a weight for this element of a multipath route"
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      { destination: "4.4.4.4", winner: 0, action: "multipath", decidedBy: "only-candidate", stages: ["main:match"], candidates: [0] }, // spread over the 16 hops
    ],
  }, // end of the vector
  { // one vector
    // A real `route print` from Windows 10 (version 10.0.17134.523), posted in a Microsoft forum thread now archived
    // on Microsoft Learn; the poster replaced hardware addresses and some address digits with "yy" and the IPv6
    // addresses with "ipv6Addr". The page encodes runs of spaces as no-break spaces (U+00A0), kept here. The
    // redacted rows are kept and reported as not an address; the IPv6 row whose gateway wraps onto the next line is
    // joined. Columns per Microsoft Learn, The IP routing table: network destination, netmask, gateway, interface,
    // metric; "On-link" marks a route with no next-hop router.
    id: "windows-route-print-forum", // stable id
    source: "Microsoft Learn, archived MSDN and TechNet forums: \"route print and route add not working for me.\", question of 1 May 2019, first `route print` block (https://learn.microsoft.com/en-us/archive/msdn-technet-forums/977ea976-4d61-44e8-80b3-63c680df5367, read 2026-10-19)", // where the text comes from
    input: "C:\\Windows\\system32>route print\n===========================================================================\nInterface List\n\u00a020...yy yy yy yy yy yy ......Intel(R) Gigabit ET Quad Port Server Adapter\n\u00a016...yy yy yy yy yy yy ......Intel(R) Gigabit ET Quad Port Server Adapter #3\n\u00a018...yy yy yy yy yy yy ......Intel(R) Ethernet Connection (7) I219-V\n\u00a010...yy yy yy yy yy yy ......Intel(R) Wireless-AC 9560\n\u00a029...yy yy yy yy yy yy ......Microsoft Wi-Fi Direct Virtual Adapter\n\u00a030...yy yy yy yy yy yy ......Intel(R) Gigabit ET Quad Port Server Adapter #4\n\u00a0 1...........................Software Loopback Interface 1\n\u00a0 3...yy yy yy yy yy yy ......Hyper-V Virtual Ethernet Adapter #3\n===========================================================================\nIPv4 Route Table\n===========================================================================\nActive Routes:\nNetwork Destination\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 Netmask\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 Gateway\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 Interface\u00a0 Metric\n\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 0.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 0.0.0.0\u00a0\u00a0\u00a0\u00a0 192.168.1.yy\u00a0\u00a0\u00a0\u00a0 192.168.1.yy 35\n\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 127.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 255.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 127.0.0.1\u00a0\u00a0\u00a0 331\n\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 127.0.0.1\u00a0 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 127.0.0.1\u00a0\u00a0\u00a0 331\n\u00a0 127.255.255.255\u00a0 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 127.0.0.1\u00a0\u00a0\u00a0 331\n\u00a0\u00a0 172.26.188.240\u00a0 255.255.255.240\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0 172.26.188.241\u00a0\u00a0 5256\n\u00a0\u00a0 172.26.188.241\u00a0 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0 172.26.188.241\u00a0\u00a0 5256\n\u00a0\u00a0 172.26.188.255\u00a0 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0 172.26.188.241\u00a0\u00a0 5256\n\u00a0\u00a0\u00a0\u00a0\u00a0 192.168.1.0\u00a0\u00a0\u00a0 255.255.255.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0 192.168.1.yy\u00a0\u00a0 291\n\u00a0\u00a0\u00a0\u00a0 192.168.1.yy 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0 192.168.1.yy 291\n\u00a0\u00a0\u00a0 192.168.1.255\u00a0 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0 192.168.1.yy 291\n\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 224.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 240.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 127.0.0.1\u00a0\u00a0\u00a0 331\n\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 224.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 240.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0 172.26.188.241\u00a0\u00a0 5256\n\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 224.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 240.0.0.0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0 192.168.1.yy 291\n\u00a0 255.255.255.255\u00a0 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 127.0.0.1\u00a0\u00a0\u00a0 331\n\u00a0 255.255.255.255\u00a0 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0 172.26.188.241\u00a0\u00a0 5256\n\u00a0 255.255.255.255\u00a0 255.255.255.255\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\u00a0\u00a0\u00a0\u00a0\u00a0 192.168.1.yy 291\n===========================================================================\nPersistent Routes:\n\u00a0 None\nIPv6 Route Table\n===========================================================================\nActive Routes:\n\u00a0If Metric Network Destination\u00a0\u00a0\u00a0\u00a0\u00a0 Gateway\n\u00a0 1\u00a0\u00a0\u00a0 331 ::1/128\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\n\u00a0 3\u00a0\u00a0 5256 ipv6Addr/64\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\n\u00a0 3\u00a0\u00a0 5256 ipv6Addr/128\n\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\n\u00a0 1\u00a0\u00a0\u00a0 331 ff00::/8\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\n\u00a0 3\u00a0\u00a0 5256 ff00::/8\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0 On-link\n===========================================================================\nPersistent Routes:\n\u00a0 None", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "windows", // route print
      routes: 21, // 16 IPv4 active + 5 IPv6 active
      interfaces: 8, // the Interface List
      structureLines: 26, // echo, rulers, titles, headers, the eight interface lines and the two "None"
      unparsedLines: [], // every line understood or a route
      prefixes: ["0.0.0.0/0", "127.0.0.0/8", "127.0.0.1/32", "127.255.255.255/32", "172.26.188.240/28", "172.26.188.241/32", "172.26.188.255/32", "192.168.1.0/24", null, "192.168.1.255/32", "224.0.0.0/4", "224.0.0.0/4", "224.0.0.0/4", "255.255.255.255/32", "255.255.255.255/32", "255.255.255.255/32", "::1/128", null, null, "ff00::/8", "ff00::/8"], // netmask to length; redacted rows null
      metrics: [35, 331, 331, 331, 5256, 5256, 5256, 291, 291, 291, 331, 5256, 291, 331, 5256, 291, 331, 5256, 5256, 331, 5256], // the Metric column
      defaults: [{ section: "ipv4-active", consulted: true, candidates: [0], winner: 0, reason: "single" }], // one default
      checks: [ // spot checks on single routes
        { route: 0, field: "gateway", value: "192.168.1.yy" }, // kept as printed
        { route: 1, field: "onLink", value: true }, // "On-link"
        { route: 18, field: "onLink", value: true }, // the wrapped "On-link"
        { route: 16, field: "interface", value: "1" }, // the IPv6 If column
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      // Off every listed prefix but the default (COMPUTED).
      { destination: "198.51.100.7", winner: 0, action: "via", decidedBy: "only-candidate", stages: ["ipv4-active:match"], candidates: [0] }, // see the comment above
      // 172.26.188.250 is inside /0 and 172.26.188.240/28 (mask 255.255.255.240): /28 wins.
      { destination: "172.26.188.250", winner: 4, action: "on-link", decidedBy: "longest-prefix", stages: ["ipv4-active:match"], candidates: [0, 4] }, // see the comment above
      // ff02::1 is inside both ff00::/8 rows: equal length, metric 331 < 5256 ("the route with the lowest metric is selected").
      { destination: "ff02::1", winner: 19, action: "on-link", decidedBy: "lowest-metric", stages: ["ipv6-active:match"], candidates: [19, 20] }, // see the comment above
      // ::1 matches ::1/128 only.
      { destination: "::1", winner: 16, action: "on-link", decidedBy: "only-candidate", stages: ["ipv6-active:match"], candidates: [16] }, // see the comment above
    ],
  }, // end of the vector
  { // one vector
    // Microsoft Learn KB 2966111: the "Persistent Routes" section of route print holding two defaults, shown with
    // the page's own spacing (no-break spaces and em spaces, U+2003, kept). Persistent routes are configuration, not
    // the active table ("The Route Print command shows routes from the active network configuration store in the
    // 'Active Routes' section"), and their Metric reads "Default", so no winner can be named.
    id: "windows-persistent-kb2966111", // stable id
    source: "Microsoft Learn, Windows Client, \"Additional default gateways may appear in persistent routes when you use LBFO\" (KB 2966111), Symptoms (https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/incorrect-default-gateways-in-persistent-routes, last updated 2026-02-12, read 2026-10-19)", // where the text comes from
    input: "===========================================================================\nPersistent Routes:\nNetwork Address \u00a0 \u00a0 Netmask \u00a0 Gateway Address \u00a0 Metric\n0.0.0.0 \u2003 \u2003 \u2003 \u2003 \u20030.0.0.0 \u2003 \u2003 10.0.0.1 \u2003 \u2003 \u2003Default\n0.0.0.0 \u2003 \u2003 \u2003 \u2003 \u20030.0.0.0 \u2003 \u2003 192.168.0.1\u2003\u2003 Default\n===========================================================================", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "windows", // route print
      routes: 2, // two persistent defaults
      sections: ["ipv4-persistent", "ipv4-persistent"], // the persistent store
      gateways: ["10.0.0.1", "192.168.0.1"], // Gateway Address
      metrics: [null, null], // "Default" is not a number
      defaults: [{ section: "ipv4-persistent", consulted: false, candidates: [0, 1], winner: null, reason: "no-metric" }], // not ranked
      checks: [{ route: 0, field: "metricText", value: "Default" }], // kept as printed
    },
  }, // end of the vector
  { // one vector
    // FreeBSD Handbook 35.2.2: RouterA's table before static routes are added, numeric (-n). Flags per FreeBSD
    // netstat(1): U RTF_UP, G RTF_GATEWAY, S RTF_STATIC, H RTF_HOST; C is not in FreeBSD 15.1's list but is in the
    // Handbook's table ("Clones a new route based upon this route") and Apple's (RTF_CLONING). link#N gateways are
    // direct routes. The Handbook's example addresses (RFC 1918) are quoted as printed.
    id: "freebsd-handbook-netstat-nr", // stable id
    source: "FreeBSD Handbook, chapter Advanced Networking, 35.2.2 Configuring a Router with Static Routes: `netstat -nr` on RouterA (https://docs.freebsd.org/en/books/handbook/advanced-networking/, read 2026-10-19)", // where the text comes from
    input: "% netstat -nr\nRouting tables\n\nInternet:\nDestination        Gateway            Flags    Refs      Use  Netif  Expire\ndefault            10.0.0.1           UGS         0    49378    xl0\n127.0.0.1          127.0.0.1          UH          0        6    lo0\n10.0.0.0/24        link#1             UC          0        0    xl0\n192.168.1.0/24     link#2             UC          0        0    xl1", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "netstat-bsd", // Routing tables / Internet:
      routes: 4, // four rows
      prefixes: ["0.0.0.0/0", "127.0.0.1/32", "10.0.0.0/24", "192.168.1.0/24"], // default, a host (H), two networks
      gateways: ["10.0.0.1", "127.0.0.1", "link#1", "link#2"], // as printed
      structureLines: 4, // echo, title, Internet:, header
      defaults: [{ section: "inet", consulted: true, candidates: [0], winner: 0, reason: "single" }], // one default
      checks: [ // spot checks on single routes
        { route: 0, field: "flags", value: [{ letter: "U", id: "RTF_UP", source: "bsd" }, { letter: "G", id: "RTF_GATEWAY", source: "bsd" }, { letter: "S", id: "RTF_STATIC", source: "bsd" }] }, // UGS
        { route: 2, field: "onLink", value: true }, // no G: direct
        { route: 2, field: "interface", value: "xl0" }, // Netif
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      // The Handbook: "RouterA does not have a route to the 192.168.2.0/24 network" (only the default contains it).
      { destination: "192.168.2.10", winner: 0, action: "via", decidedBy: "only-candidate", stages: ["inet:match"], candidates: [0] }, // see the comment above
      // 192.168.1.20 is on link#2's network: /24 beats /0.
      { destination: "192.168.1.20", winner: 3, action: "on-link", decidedBy: "longest-prefix", stages: ["inet:match"], candidates: [0, 3] }, // see the comment above
    ],
  }, // end of the vector
  { // one vector
    // FreeBSD Handbook 35.2.1: `netstat -r` WITHOUT -n, so destinations are names ("localhost", "test0",
    // "example.com") or an abbreviation ("224"), gateways are names or MAC addresses ("The addresses beginning with
    // 0:e0: are MAC addresses"), and one row ends with "=>" ("an alias has been set"). The parser keeps every row,
    // converts only what is an address, and keeps "=>" as an unparsed token: nothing is dropped.
    id: "freebsd-handbook-netstat-r", // stable id
    source: "FreeBSD Handbook, chapter Advanced Networking, 35.2.1 Routing Basics: `netstat -r` (https://docs.freebsd.org/en/books/handbook/advanced-networking/, read 2026-10-19)", // where the text comes from
    input: "% netstat -r\nRouting tables\n\nInternet:\nDestination      Gateway            Flags     Refs     Use     Netif Expire\ndefault          outside-gw         UGS        37      418       em0\nlocalhost        localhost          UH          0      181       lo0\ntest0            0:e0:b5:36:cf:4f   UHLW        5    63288       re0     77\n10.20.30.255     link#1             UHLW        1     2421\nexample.com      link#1             UC          0        0\nhost1            0:e0:a8:37:8:1e    UHLW        3     4601       lo0\nhost2            0:e0:a8:37:8:1e    UHLW        0        5       lo0 =>\nhost2.example.com link#1            UC          0        0\n224              link#1             UC          0        0", // the text byte for byte, as `source` gives it
    expect: { // what the parse must give
      format: "netstat-bsd", // BSD netstat
      routes: 9, // nine rows
      prefixes: ["0.0.0.0/0", null, null, "10.20.30.255/32", null, null, null, null, null], // only default and the H address convert
      defaults: [{ section: "inet", consulted: true, candidates: [0], winner: 0, reason: "single" }], // one default
      checks: [ // spot checks on single routes
        { route: 0, field: "gateway", value: "outside-gw" }, // a name, kept
        { route: 6, field: "unparsed", value: ["=>"] }, // the alias marker, kept
        { route: 2, field: "attributes", value: [{ key: "Refs", value: "5" }, { key: "Use", value: "63288" }, { key: "Expire", value: "77" }] }, // "This type of route has a timeout, seen in the Expire column"
        { route: 3, field: "interface", value: null }, // the row stops before Netif
      ],
    },
    lookups: [ // lookups over this parse (COMPUTED by RFC 1812 s5.2.4.3 and the metric rule)
      // 10.20.30.255 is the one IPv4 row besides the default that converts (H flag: a host).
      { destination: "10.20.30.255", winner: 3, action: "on-link", decidedBy: "longest-prefix", stages: ["inet:match"], candidates: [0, 3] }, // see the comment above
    ],
  }, // end of the vector
]);

/** Flag letters decoded against the manuals' tables (COMPUTED from the tables, not outputs). */
export const FLAG_VECTORS: readonly FlagVector[] = Object.freeze([
  { // one vector
    id: "macos-UGScg", // the macOS letters c and g
    source: "Apple netstat.1 (network_cmds, netstat.tproj), the flag table: c RTF_PRCLONING, g RTF_GLOBAL (https://github.com/apple-oss-distributions/network_cmds, read 2026-10-19)", // where the text comes from
    letters: "UGScg", // a combination of listed letters
    family: "bsd", // BSD table
    ids: ["RTF_UP", "RTF_GATEWAY", "RTF_STATIC", "RTF_PRCLONING", "RTF_GLOBAL"], // as listed
  }, // end of the vector
  { // one vector
    id: "bsd-UHLWb", // FreeBSD letters plus W (macOS RTF_WASCLONED) and b (both)
    source: "FreeBSD netstat(1), FreeBSD 15.1, 7 April 2026, -r: the letter table (U, H, L, b), and Apple netstat.1 for W RTF_WASCLONED (https://man.freebsd.org/cgi/man.cgi?query=netstat&sektion=1, read 2026-10-19)", // where the text comes from
    letters: "UHLWb", // letters from both tables
    family: "bsd", // BSD table
    ids: ["RTF_UP", "RTF_HOST", "RTF_LLINFO", "RTF_WASCLONED", "RTF_BROADCAST"], // as listed
  }, // end of the vector
  { // one vector
    id: "linux-UG!Z", // route(8)'s letters, the reject mark, and a letter no manual lists
    source: "route(8), net-tools, man7.org copy of 4 August 2026: OUTPUT, Flags (https://man7.org/linux/man-pages/man8/route.8.html, read 2026-10-19)", // where the text comes from
    letters: "UG!Z", // Z is listed nowhere
    family: "linux", // route(8)'s table
    ids: ["LINUX_U", "LINUX_G", "LINUX_REJECT", null], // Z stays unknown, never guessed
  }, // end of the vector
]);

/** Requests the engine must refuse, with the code. */
export const REJECT_VECTORS: readonly RejectVector[] = Object.freeze([
  { id: "lookup-not-an-address", kind: "lookup", input: "sandbox-ip-route-show", destination: "198.51.100.300", code: "bad-address" }, // an octet over 255
  { id: "lookup-zone", kind: "lookup", input: "sandbox-ip-route-show", destination: "fe80::1%eth0", code: "bad-address" }, // a zone is not a destination
  { id: "api-bad-json", kind: "api", input: "{\"text\": ", code: "bad-request" }, // starts like JSON, is not
  { id: "api-no-text", kind: "api", input: "{\"lookup\": \"192.0.2.77\"}", code: "bad-request" }, // the text is required
]);

// ---------------------------------------------------------------------------
// The runner
// ---------------------------------------------------------------------------

/** Read one checked field of a route (two computed fields cover the nexthops). */
function fieldOf(r: Record<string, unknown> & { nexthops: unknown[] }, field: string): unknown {
  if (field === "nexthopCount") return r.nexthops.length; // how many hops
  if (field === "firstNexthop") return r.nexthops[0] ?? null; // the first hop
  return r[field]; // any other field by name
}

/** Run every vector; throw with a precise message on the first mismatch. */
export function verifyVectors(): { accepted: number; rejected: number } {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b); // structural equality for plain data
  for (const v of ROUTING_VECTORS) { // every output vector
    const p = parseRoutingTable(v.input); // parse it
    const e = v.expect; // what it must give
    const fail = (what: string, want: unknown, got: unknown) => { throw new Error(`[${v.id}] ${what}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`); }; // one message shape
    if (p.format !== e.format) fail("format", e.format, p.format); // the command
    if (p.routes.length !== e.routes) fail("routes", e.routes, p.routes.length); // the count
    const lists: [keyof ParseExpect, unknown[]][] = [ // the per-route lists
      ["prefixes", p.routes.map((r) => r.prefix)], // prefixes
      ["types", p.routes.map((r) => r.type)], // types
      ["gateways", p.routes.map((r) => r.gateway)], // gateways
      ["sections", p.routes.map((r) => r.section)], // sections
      ["metrics", p.routes.map((r) => r.metric)], // metrics
    ];
    for (const [k, got] of lists) if (e[k] !== undefined && !same(e[k], got)) fail(String(k), e[k], got); // compare each given list
    if (e.defaults !== undefined && !same(e.defaults, p.defaults)) fail("defaults", e.defaults, p.defaults); // default groups
    if (e.structureLines !== undefined && e.structureLines !== p.structureLines) fail("structureLines", e.structureLines, p.structureLines); // structure
    if (e.unparsedLines !== undefined && !same(e.unparsedLines, p.unparsedLines.map((u) => u.line))) fail("unparsedLines", e.unparsedLines, p.unparsedLines.map((u) => u.line)); // leftovers
    if (e.interfaces !== undefined && e.interfaces !== p.interfaces.length) fail("interfaces", e.interfaces, p.interfaces.length); // Interface List
    if (e.warnings !== undefined && !same(e.warnings, p.warnings)) fail("warnings", e.warnings, p.warnings); // warnings
    for (const c of e.checks ?? []) { // spot checks
      const got = fieldOf(p.routes[c.route] as unknown as Record<string, unknown> & { nexthops: unknown[] }, c.field); // the field
      if (!same(c.value, got)) fail(`route ${c.route} ${c.field}`, c.value, got); // compare
    }
    for (const l of v.lookups ?? []) { // the lookups
      const r = lookupRoute(p, l.destination); // run it
      const stages = r.stages.map((s) => `${s.section}:${s.outcome}`); // section:outcome
      if (r.winner !== l.winner) fail(`lookup ${l.destination} winner`, l.winner, r.winner); // the route
      if (r.action !== l.action) fail(`lookup ${l.destination} action`, l.action, r.action); // the action
      if (r.decidedBy !== l.decidedBy) fail(`lookup ${l.destination} decidedBy`, l.decidedBy, r.decidedBy); // the rule
      if (!same(stages, l.stages)) fail(`lookup ${l.destination} stages`, l.stages, stages); // the stages
      const last = r.stages[r.stages.length - 1]; // the deciding stage
      if (l.candidates !== undefined && !same(l.candidates, last?.candidates ?? [])) fail(`lookup ${l.destination} candidates`, l.candidates, last?.candidates); // basic match
    }
  }
  for (const f of FLAG_VECTORS) { // the flag tables
    const got = decodeFlags(f.letters, f.family).map((x) => x.id); // decode
    if (JSON.stringify(got) !== JSON.stringify(f.ids)) throw new Error(`[${f.id}] flags: expected ${JSON.stringify(f.ids)}, got ${JSON.stringify(got)}`); // compare
  }
  for (const r of REJECT_VECTORS) { // the refusals
    try { // must throw
      if (r.kind === "lookup") lookupRoute(parseRoutingTable(ROUTING_VECTORS.find((v) => v.id === r.input)!.input), r.destination!); // a lookup
      else runRoutingTableApi(r.input); // an API request
      throw new Error(`[${r.id}] expected rejection "${r.code}", but it was accepted`); // it did not throw
    } catch (e) { // check the code
      if (!(e instanceof RouteLookupError) || e.code !== r.code) throw new Error(`[${r.id}] expected code "${r.code}", got ${e instanceof RouteLookupError ? e.code : String(e)}`); // wrong refusal
    }
  }
  return { accepted: ROUTING_VECTORS.length + FLAG_VECTORS.length, rejected: REJECT_VECTORS.length }; // counts
}
