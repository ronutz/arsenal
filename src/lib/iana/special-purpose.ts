// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/iana/special-purpose.ts
// ----------------------------------------------------------------------------
// ONE COPY OF THE IANA SPECIAL-PURPOSE ADDRESS TABLES (Round 1 batch B, item
// B10, 2026-10-26; PRIME approved batch B on 2026-10-25 20:28). Until this
// day the site carried the IPv4 registry twice: row for row with every column
// in the CIDR tool (src/lib/tools/cidr/compute.ts, SPECIAL_PURPOSE_REGISTRY,
// read 2026-10-19), and again, with the Name, RFC and Globally Reachable
// columns plus the IPv6 registry, in the SSRF URL classifier
// (src/lib/tools/ssrf-url-classifier/compute.ts, read 2026-10-19), which the
// RDAP lookup also consults through src/lib/dev-out/rdap/special-ip.ts. Two
// copies can drift apart silently; now both tools read the rows below, and
// each keeps only its own columns (the SSRF category, note and anycast flag).
//
// THE DATA, read 2026-10-26 (São Paulo) with the house curl recipe, every
// cell copied from the CSVs and checked against the XML twins:
//   * IANA "IPv4 Special-Purpose Address Space" registry, last updated
//     2025-10-09: https://www.iana.org/assignments/iana-ipv4-special-registry/
//     iana-ipv4-special-registry-1.csv (HTTP 200, 2,445 bytes, SHA-256
//     cbc4b765...8632aac), 25 rows;
//   * IANA "IPv6 Special-Purpose Address Space" registry, last updated
//     2025-10-09: https://www.iana.org/assignments/iana-ipv6-special-registry/
//     iana-ipv6-special-registry-1.csv (HTTP 200, 2,300 bytes, SHA-256
//     bf56772a...faba66), 25 rows;
//   * IANA "IPv4 Multicast Address Space" registry, last updated 2026-08-20:
//     https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml
//     (HTTP 200), whose note says "The multicast addresses are in the range
//     224.0.0.0 through 239.255.255.255" (= 224.0.0.0/4). The special-purpose
//     registry does not list multicast; the CIDR tool shows this one extra row,
//     marked as coming from the multicast registry, with its flags null (that
//     registry has no such columns), never guessed.
// The 2026-10-19 tables of both tools matched these CSVs cell for cell (the
// registries have not changed since 2025-10-09), so merging changes no answer.
//
// THE SHAPE. One entry per CIDR block: the registry's one row with two blocks
// (NAT64/DNS64 Discovery, "192.0.0.170/32, 192.0.0.171/32") becomes two
// entries that both keep the row's Address Block cell in `rowBlock`. Name and
// RFC are verbatim (Name keeps the literal quotes of '"This network"'; RFC
// keeps its brackets). Flags are the five boolean columns, null where the
// registry leaves a cell blank (the two deprecated rows) or says N/A (Teredo,
// 6to4 Globally Reachable); footnote markers are dropped from the cells and
// kept as the row's `footnote` anchor.
// ============================================================================

/** Which IANA registry an entry comes from. */
export type IanaAddressRegistry = "ipv4-special-purpose" | "ipv6-special-purpose" | "ipv4-multicast";

/** One special-purpose entry: one CIDR block of one registry row, every column the registry prints. */
export interface IanaSpecialEntry {
  /** The registry the row comes from. */
  registry: IanaAddressRegistry;
  /** One CIDR block (the two-block NAT64/DNS64 row is split into two entries). */
  block: string;
  /** The row's Address Block cell as the registry prints it, footnote marker dropped. */
  rowBlock: string;
  /** The block's prefix length. */
  bits: number;
  /** The Name column, verbatim. */
  name: string;
  /** The RFC column, verbatim (brackets kept). */
  rfc: string;
  /** Allocation Date, YYYY-MM. */
  allocated: string;
  /** Termination Date, null where the registry says N/A. */
  terminated: string | null;
  /** Source column. */
  source: boolean | null;
  /** Destination column. */
  destination: boolean | null;
  /** Forwardable column. */
  forwardable: boolean | null;
  /** Globally Reachable column. */
  globallyReachable: boolean | null;
  /** Reserved-by-Protocol column. */
  reservedByProtocol: boolean | null;
  /** The footnote anchor the row carries, if any (the CIDR page prints the texts from its message pack). */
  footnote: "1" | "2" | "3" | "4" | null;
}

/** Shorthand for the flag columns, in registry order: Source, Destination, Forwardable, Globally Reachable, Reserved-by-Protocol. */
type Flags = [boolean | null, boolean | null, boolean | null, boolean | null, boolean | null];

/** Build one entry (keeps the tables below to one line per block). */
function entry(registry: IanaAddressRegistry, block: string, name: string, rfc: string, allocated: string, terminated: string | null, f: Flags, footnote: IanaSpecialEntry["footnote"] = null, rowBlock: string = block): IanaSpecialEntry {
  // The prefix length is the number after the slash; the flags are spread into their named fields.
  return { registry, block, rowBlock, bits: Number(block.slice(block.indexOf("/") + 1)), name, rfc, allocated, terminated, source: f[0], destination: f[1], forwardable: f[2], globallyReachable: f[3], reservedByProtocol: f[4], footnote };
}

/** An IPv4 special-purpose entry. */
const v4 = (block: string, name: string, rfc: string, allocated: string, terminated: string | null, f: Flags, footnote: IanaSpecialEntry["footnote"] = null, rowBlock?: string) => entry("ipv4-special-purpose", block, name, rfc, allocated, terminated, f, footnote, rowBlock);
/** An IPv6 special-purpose entry. */
const v6 = (block: string, name: string, rfc: string, allocated: string, terminated: string | null, f: Flags, footnote: IanaSpecialEntry["footnote"] = null) => entry("ipv6-special-purpose", block, name, rfc, allocated, terminated, f, footnote);

const T = true; // a registry "True"
const F = false; // a registry "False"
const N = null; // a blank cell (the deprecated rows) or "N/A" in a flag column

/** The IPv4 Special-Purpose Address Space registry, row for row in its own order (CSV read 2026-10-26). */
export const IPV4_SPECIAL_PURPOSE: readonly IanaSpecialEntry[] = Object.freeze([
  v4("0.0.0.0/8", '"This network"', "[RFC 791, Section 3.2]", "1981-09", null, [T, F, F, F, T]), // "this" network, source only
  v4("0.0.0.0/32", '"This host on this network"', "[RFC 1122, Section 3.2.1.3]", "1981-09", null, [T, F, F, F, T]), // this host
  v4("10.0.0.0/8", "Private-Use", "[RFC 1918]", "1996-02", null, [T, T, T, F, F]), // RFC 1918 24-bit block
  v4("100.64.0.0/10", "Shared Address Space", "[RFC 6598]", "2012-04", null, [T, T, T, F, F]), // CGN shared space
  v4("127.0.0.0/8", "Loopback", "[RFC 1122, Section 3.2.1.3]", "1981-09", null, [F, F, F, F, T], "1"), // "False [1]" in four flag cells
  v4("169.254.0.0/16", "Link Local", "[RFC 3927]", "2005-05", null, [T, T, F, F, T]), // IPv4 link-local
  v4("172.16.0.0/12", "Private-Use", "[RFC 1918]", "1996-02", null, [T, T, T, F, F]), // RFC 1918 20-bit block
  v4("192.0.0.0/24", "IETF Protocol Assignments", "[RFC 6890, Section 2.1]", "2010-01", null, [F, F, F, F, F], "2"), // "192.0.0.0/24 [2]"
  v4("192.0.0.0/29", "IPv4 Service Continuity Prefix", "[RFC 7335]", "2011-06", null, [T, T, T, F, F]), // DS-Lite and others
  v4("192.0.0.8/32", "IPv4 dummy address", "[RFC 7600]", "2015-03", null, [T, F, F, F, F]), // dummy address
  v4("192.0.0.9/32", "Port Control Protocol Anycast", "[RFC 7723]", "2015-10", null, [T, T, T, T, F]), // PCP anycast
  v4("192.0.0.10/32", "Traversal Using Relays around NAT Anycast", "[RFC 8155]", "2017-02", null, [T, T, T, T, F]), // TURN anycast
  v4("192.0.0.170/32", "NAT64/DNS64 Discovery", "[RFC 8880]; [RFC 7050, Section 2.2]", "2013-02", null, [F, F, F, F, T], null, "192.0.0.170/32, 192.0.0.171/32"), // first of the row's two blocks
  v4("192.0.0.171/32", "NAT64/DNS64 Discovery", "[RFC 8880]; [RFC 7050, Section 2.2]", "2013-02", null, [F, F, F, F, T], null, "192.0.0.170/32, 192.0.0.171/32"), // second of the row's two blocks
  v4("192.0.2.0/24", "Documentation (TEST-NET-1)", "[RFC 5737]", "2010-01", null, [F, F, F, F, F]), // documentation
  v4("192.31.196.0/24", "AS112-v4", "[RFC 7535]", "2014-12", null, [T, T, T, T, F]), // AS112
  v4("192.52.193.0/24", "AMT", "[RFC 7450]", "2014-12", null, [T, T, T, T, F]), // Automatic Multicast Tunneling
  v4("192.88.99.0/24", "Deprecated (6to4 Relay Anycast)", "[RFC 7526]", "2001-06", "2015-03", [N, N, N, N, N]), // flags blank in the registry
  v4("192.88.99.2/32", "6a44-relay anycast address", "[RFC 6751]", "2012-10", null, [T, T, T, F, F]), // 6a44
  v4("192.168.0.0/16", "Private-Use", "[RFC 1918]", "1996-02", null, [T, T, T, F, F]), // RFC 1918 16-bit block
  v4("192.175.48.0/24", "Direct Delegation AS112 Service", "[RFC 7534]", "1996-01", null, [T, T, T, T, F]), // AS112 direct delegation
  v4("198.18.0.0/15", "Benchmarking", "[RFC 2544]", "1999-03", null, [T, T, T, F, F]), // benchmarking
  v4("198.51.100.0/24", "Documentation (TEST-NET-2)", "[RFC 5737]", "2010-01", null, [F, F, F, F, F]), // documentation
  v4("203.0.113.0/24", "Documentation (TEST-NET-3)", "[RFC 5737]", "2010-01", null, [F, F, F, F, F]), // documentation
  v4("240.0.0.0/4", "Reserved", "[RFC 1112, Section 4]", "1989-08", null, [F, F, F, F, T]), // class E
  v4("255.255.255.255/32", "Limited Broadcast", "[RFC 8190]; [RFC 919, Section 7]", "1984-10", null, [F, T, F, F, T]), // limited broadcast
]);

/** The one multicast entry, from the IPv4 Multicast Address Space registry (224.0.0.0 through 239.255.255.255). */
export const IPV4_MULTICAST: IanaSpecialEntry = Object.freeze(entry("ipv4-multicast", "224.0.0.0/4", "Multicast", "[RFC 1112, Section 4]; [RFC 5771]", "1981-09", null, [N, N, N, N, N]));

/** The IPv6 Special-Purpose Address Space registry, row for row in its own order (CSV read 2026-10-26). */
export const IPV6_SPECIAL_PURPOSE: readonly IanaSpecialEntry[] = Object.freeze([
  v6("::1/128", "Loopback Address", "[RFC 4291]", "2006-02", null, [F, F, F, F, T]), // loopback
  v6("::/128", "Unspecified Address", "[RFC 4291]", "2006-02", null, [T, F, F, F, T]), // unspecified
  v6("::ffff:0:0/96", "IPv4-mapped Address", "[RFC 4291]", "2006-02", null, [F, F, F, F, T]), // IPv4-mapped
  v6("64:ff9b::/96", "IPv4-IPv6 Translat.", "[RFC 6052]", "2010-10", null, [T, T, T, T, F]), // NAT64 Well-Known Prefix
  v6("64:ff9b:1::/48", "IPv4-IPv6 Translat.", "[RFC 8215]", "2017-06", null, [T, T, T, F, F]), // local-use translation prefix
  v6("100::/64", "Discard-Only Address Block", "[RFC 6666]", "2012-06", null, [T, T, T, F, F]), // remote triggered black hole
  v6("100:0:0:1::/64", "Dummy IPv6 Prefix", "[RFC 9780]", "2025-04", null, [T, F, F, F, F]), // dummy prefix
  v6("2001::/23", "IETF Protocol Assignments", "[RFC 2928]", "2000-09", null, [F, F, F, F, F], "1"), // "False [1]" in four flag cells
  v6("2001::/32", "TEREDO", "[RFC 4380]; [RFC 8190]", "2006-01", null, [T, T, T, N, F], "2"), // Globally Reachable "N/A [2]"
  v6("2001:1::1/128", "Port Control Protocol Anycast", "[RFC 7723]", "2015-10", null, [T, T, T, T, F]), // PCP anycast
  v6("2001:1::2/128", "Traversal Using Relays around NAT Anycast", "[RFC 8155]", "2017-02", null, [T, T, T, T, F]), // TURN anycast
  v6("2001:1::3/128", "DNS-SD Service Registration Protocol Anycast", "[RFC 9665]", "2024-04", null, [T, T, T, T, F]), // SRP anycast
  v6("2001:2::/48", "Benchmarking", "[RFC 5180]; [RFC Errata 1752]", "2008-04", null, [T, T, T, F, F]), // benchmarking
  v6("2001:3::/32", "AMT", "[RFC 7450]", "2014-12", null, [T, T, T, T, F]), // Automatic Multicast Tunneling
  v6("2001:4:112::/48", "AS112-v6", "[RFC 7535]", "2014-12", null, [T, T, T, T, F]), // AS112
  v6("2001:10::/28", "Deprecated (previously ORCHID)", "[RFC 4843]", "2007-03", "2014-03", [N, N, N, N, N]), // flags blank in the registry
  v6("2001:20::/28", "ORCHIDv2", "[RFC 7343]", "2014-07", null, [T, T, T, T, F]), // ORCHIDv2
  v6("2001:30::/28", "Drone Remote ID Protocol Entity Tags (DETs) Prefix", "[RFC 9374]", "2022-12", null, [T, T, T, T, F]), // DRIP DETs
  v6("2001:db8::/32", "Documentation", "[RFC 3849]", "2004-07", null, [F, F, F, F, F]), // documentation
  v6("2002::/16", "6to4", "[RFC 3056]", "2001-02", null, [T, T, T, N, F], "3"), // "2002::/16 [3]", Globally Reachable "N/A [3]"
  v6("2620:4f:8000::/48", "Direct Delegation AS112 Service", "[RFC 7534]", "2011-05", null, [T, T, T, T, F]), // AS112 direct delegation
  v6("3fff::/20", "Documentation", "[RFC 9637]", "2024-07", null, [F, F, F, F, F]), // second documentation prefix
  v6("5f00::/16", "Segment Routing (SRv6) SIDs", "[RFC 9602]", "2024-04", null, [T, T, T, F, F]), // SRv6 SIDs
  v6("fc00::/7", "Unique-Local", "[RFC 4193]; [RFC 8190]", "2005-10", null, [T, T, T, F, F], "4"), // Globally Reachable "False [4]"
  v6("fe80::/10", "Link-Local Unicast", "[RFC 4291]", "2006-02", null, [T, T, F, F, T]), // link-local
]);

/** Where the tables come from, for a tool's provenance and for a reader. */
export const IANA_SPECIAL_PURPOSE_SOURCES = Object.freeze({
  /** When the three registries were read (São Paulo date). */
  readOn: "2026-10-26",
  /** The IPv4 special-purpose registry. */
  ipv4: { url: "https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv", updated: "2025-10-09" },
  /** The IPv6 special-purpose registry. */
  ipv6: { url: "https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv", updated: "2025-10-09" },
  /** The IPv4 multicast registry (the one multicast entry). */
  ipv4Multicast: { url: "https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml", updated: "2026-08-20" },
});

/**
 * The entry for one block of one registry. Throws when the block is not in the table, so a caller that binds its
 * own columns to a block by name fails when its module loads, not quietly at lookup time.
 */
export function ianaEntry(registry: "ipv4-special-purpose" | "ipv6-special-purpose", block: string): IanaSpecialEntry {
  // The table of that registry, then the block in it.
  const table = registry === "ipv4-special-purpose" ? IPV4_SPECIAL_PURPOSE : IPV6_SPECIAL_PURPOSE;
  const e = table.find((x) => x.block === block);
  // A block the registry does not list is a programming error in the caller.
  if (!e) throw new Error(`special-purpose: ${block} is not a block of the ${registry} registry`);
  return e;
}
