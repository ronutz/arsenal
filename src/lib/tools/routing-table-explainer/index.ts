// ============================================================================
// src/lib/tools/routing-table-explainer/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the routing table
// explainer: paste `ip route`, `netstat -rn` or `route print` output, read
// every route field by field, see which default route wins, and ask which
// route a destination would use.
//
// It parses text only. It changes no route, contacts nothing and reads no
// clock (zero egress, D-49). The engine is pure and golden-vector tested.
// ============================================================================

import { explain, runRoutingTableApi, type RoutingTableResult } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, ROUTING_VECTORS, FLAG_VECTORS, REJECT_VECTORS } from "./golden-vectors"; // the vectors

export {
  parseRoutingTable, // the parser
  lookupRoute, // the longest-match lookup
  explain, // parse plus optional lookup
  runRoutingTableApi, // the API entry point (text, or {"text", "lookup"})
  decodeFlags, // netstat flag letters
  detectFormat, // which command printed the text
  lookupOrder, // the sections a lookup consults
  maskToLength, // dotted netmask to prefix length
  parseIpv4, // IPv4 text to a number
  parseIpv6, // IPv6 text to a bigint
  parseAddress, // either family
  RouteLookupError, // the typed error
  MAX_LINES, // the line cap
  MAX_LINE_LENGTH, // the line-length cap
} from "./compute";
export type {
  RouteFormat, // format names
  Family, // ipv4 | ipv6
  RouteFlag, // a decoded flag letter
  Nexthop, // a multipath hop
  RouteAttribute, // an attribute or extra column
  ParsedRoute, // one route
  WindowsInterface, // a Windows Interface List entry
  DefaultGroup, // default routes per section
  UnparsedLine, // a line kept as unparsed
  RoutingTableParse, // the parse
  LookupStage, // one stage of a lookup
  LookupResult, // the lookup
  LookupAction, // what the winning route does
  RouteLookupErrorCode, // error codes
  RoutingTableResult, // parse plus lookup
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, ROUTING_VECTORS, FLAG_VECTORS, REJECT_VECTORS, verifyVectors } from "./golden-vectors"; // the vectors and their runner
export type { RoutingVector, FlagVector, RejectVector, ParseExpect, LookupExpect } from "./golden-vectors"; // their types

/** The D-49 declarative manifest for the routing table explainer. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing", // the catalogue family
  toolSlug: "routing-table-explainer", // the route segment and i18n key
  canonicalAliases: ["ip route explainer", "route print explainer", "netstat -rn explainer", "routing table reader", "which route", "default route"], // search aliases
  inputDetectors: [
    // Anchored or literal patterns, no nested quantifiers (ReDoS-safe); examples copied from the golden vectors.
    { kind: "regex", pattern: "^\\s*default via \\S+ dev \\S+", priority: 7, example: "default via 192.0.2.1 dev eth0" }, // iproute2 (sandbox-ip-route-show)
    { kind: "regex", pattern: "Kernel IP routing table", priority: 8, example: "Kernel IP routing table" }, // net-tools (sandbox-netstat-rn)
    { kind: "regex", pattern: "IPv4 Route Table", priority: 8, example: "IPv4 Route Table" }, // Windows (windows-route-print-forum)
    { kind: "regex", pattern: "Routing tables\\s+Internet6?:", priority: 8, example: "Routing tables\n\nInternet:" }, // BSD (freebsd-handbook-netstat-nr)
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // text parsing and prefix arithmetic; no network, no clock
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the vector set id
  dangerousInputHandling: ["bounded-line-parse", "redos-guard"], // line by line, capped, anchored patterns only
  shareSafetyDefault: "fragment", // a routing table reveals internal addresses and interface names

  // -- Teaching & provenance --
  learnLinks: [
    "learn/reading-ip-route-and-route-print", // the field-by-field article written with the tool
    "learn/routing-tables-and-default-gateway", // the decision itself: host, router, default route
    "learn/static-routes-and-longest-match", // longest match, metric and administrative distance
  ],
  // Every source was downloaded with curl and read on its access_date (corpus kept with the build notes).
  sources: [
    { id: "ip-route-8", label: "ip-route(8), Linux manual page, iproute2, man7.org copy of 4 August 2026: SYNOPSIS (TYPE, TABLE_ID, SCOPE, NHFLAGS, RTPROTO, PREF), DESCRIPTION (route types, route tables, to, metric, table, dev, via, src, nexthop, scope, protocol, onlink, pref, nhid), ip route show", url: "https://man7.org/linux/man-pages/man8/ip-route.8.html", access_date: "2026-10-19" }, // every iproute2 field
    { id: "ip-rule-8", label: "ip-rule(8), Linux manual page, iproute2: DESCRIPTION, the three default rules (local 0, main 32766, default 32767)", url: "https://man7.org/linux/man-pages/man8/ip-rule.8.html", access_date: "2026-10-19" }, // the lookup order
    { id: "rtnetlink-7", label: "rtnetlink(7), Linux manual page, man-pages 6.19: RTM_NEWROUTE (rtm_type, rtm_protocol, rtm_scope, rtm_table)", url: "https://man7.org/linux/man-pages/man7/rtnetlink.7.html", access_date: "2026-10-19" }, // type, protocol and scope values
    { id: "route-8", label: "route(8), Linux manual page, net-tools, man7.org copy of 4 August 2026: OUTPUT (Destination, Gateway, Genmask, Flags U H G R D M A C !, Metric, Ref, Use, Iface, MSS, Window, irtt)", url: "https://man7.org/linux/man-pages/man8/route.8.html", access_date: "2026-10-19" }, // the net-tools columns
    { id: "netstat-8", label: "netstat(8), Linux manual page, net-tools, man7.org copy of 4 August 2026: --route, Kernel IP routing table (-r)", url: "https://man7.org/linux/man-pages/man8/netstat.8.html", access_date: "2026-10-19" }, // netstat -r = route -e
    { id: "freebsd-netstat-1", label: "netstat(1), FreeBSD 15.1, 7 April 2026: netstat -r, the mapping between letters and flags", url: "https://man.freebsd.org/cgi/man.cgi?query=netstat&sektion=1", access_date: "2026-10-19" }, // BSD flag letters
    { id: "apple-netstat-1", label: "netstat.1, Apple network_cmds (netstat.tproj), main branch: the routing table display and its flag letters (C, c, I, i, m, r, W, Y, g added to the BSD set)", url: "https://github.com/apple-oss-distributions/network_cmds/blob/main/netstat.tproj/netstat.1", access_date: "2026-10-19" }, // macOS flag letters
    { id: "freebsd-handbook-routing", label: "FreeBSD Handbook, Advanced Networking, 35.2 Gateways and Routes: 35.2.1 Routing Basics and 35.2.2 Configuring a Router with Static Routes (netstat -r and netstat -nr examples, flags table)", url: "https://docs.freebsd.org/en/books/handbook/advanced-networking/", access_date: "2026-10-19" }, // two golden vectors
    { id: "ms-route", label: "Microsoft Learn, Windows commands, route (updated 16 February 2026): Syntax, Parameters (print, /p, destination, gateway, metric), Remarks", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008", access_date: "2026-10-19" }, // the command
    { id: "ms-ip-routing-table", label: "Microsoft Learn, Windows Server 2003 TCP/IP, The IP routing table (updated 18 April 2011): the columns network destination, netmask, gateway, interface and metric", url: "https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc779122(v=ws.10)", access_date: "2026-10-19" }, // the route print columns
    { id: "ms-kb2966111", label: "Microsoft Learn, Windows Client, Additional default gateways may appear in persistent routes when you use LBFO (KB 2966111, updated 12 February 2026): Symptoms and Cause", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/incorrect-default-gateways-in-persistent-routes", access_date: "2026-10-19" }, // Active versus Persistent Routes
    { id: "ms-forum-route-print", label: "Microsoft Learn, archived MSDN and TechNet forums: route print and route add not working for me (1 May 2019), a real Windows 10 route print", url: "https://learn.microsoft.com/en-us/archive/msdn-technet-forums/977ea976-4d61-44e8-80b3-63c680df5367", access_date: "2026-10-19" }, // a golden vector
    { id: "frr-zebra", label: "FRRouting documentation, Zebra (latest): the ECMP example, ip route show 4.4.4.4/32 with sixteen nexthop lines", url: "https://docs.frrouting.org/en/latest/zebra.html", access_date: "2026-10-19" }, // a golden vector
    { id: "rfc1812", label: "RFC 1812, Requirements for IP Version 4 Routers, June 1995: section 5.2.4.3 (Basic Match, Longest Match, the default route of prefix length zero)", url: "https://www.rfc-editor.org/rfc/rfc1812.txt", access_date: "2026-10-19" }, // the lookup rules
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the author
  ],
});

/**
 * run - the registry-facing entry point.
 * @param input the pasted routing table, or a JSON object {"text": "...", "lookup": "192.0.2.77"}
 * @returns the parse, and the lookup when one was asked
 */
export function run(input: string): RoutingTableResult {
  return runRoutingTableApi(input); // text or JSON
}

/** The browser's entry point: the parse and an optional lookup, without JSON. */
export function runTool(input: string, destination?: string): RoutingTableResult {
  return explain(input, destination); // parse, then look up
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = ROUTING_VECTORS; // the output vectors
export const flagVectors = FLAG_VECTORS; // the flag-table vectors
export const rejectVectors = REJECT_VECTORS; // the refusals
