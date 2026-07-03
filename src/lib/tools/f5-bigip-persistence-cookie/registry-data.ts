// ============================================================================
// src/lib/tools/f5-bigip-persistence-cookie/registry-data.ts
// ----------------------------------------------------------------------------
// REFERENCE DATA for the F5 BIG-IP persistence cookie decoder.
//
// A BIG-IP virtual server with cookie persistence inserts a Set-Cookie named
// BIGipServer<pool> whose value encodes the selected pool member's IP address
// and port. Four unencrypted encodings exist (default IPv4, IPv4 in a route
// domain, IPv6, IPv6 in a route domain), plus an AES-encrypted form. The
// encoding is documented in F5 article K6917.
//
// This file holds only the private / internal address ranges used to classify a
// decoded address (so the decoder can point out when a cookie leaks an internal
// pool member), plus the snapshot id and reference list. The format patterns and
// the decode math live in compute.ts.
//
// Sources: F5 K6917 (Overview of BIG-IP persistence cookie encoding); F5 K7784 /
// K14784 (configuring / requiring cookie encryption, the mitigation); the
// drwetter/F5-BIGIP-Decoder reference implementation; RFC 1918, RFC 4193,
// RFC 6598 for the private ranges.
// ============================================================================

export const REGISTRY_SNAPSHOT = "bigip-cookie-reference-2026-06-29";

// -- IPv4 internal / private ranges, as [startInclusive, endInclusive] over the
//    32-bit address space. Used only to classify a decoded address. ----------
export interface Ipv4Range {
  label: string;
  cidr: string;
  start: number; // unsigned 32-bit
  end: number; // unsigned 32-bit
}

// Helper kept here so the table can be written in readable CIDR form.
function v4(a: number, b: number, c: number, d: number): number {
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

export const IPV4_INTERNAL_RANGES: Ipv4Range[] = [
  { label: "private (RFC 1918)", cidr: "10.0.0.0/8", start: v4(10, 0, 0, 0), end: v4(10, 255, 255, 255) },
  { label: "private (RFC 1918)", cidr: "172.16.0.0/12", start: v4(172, 16, 0, 0), end: v4(172, 31, 255, 255) },
  { label: "private (RFC 1918)", cidr: "192.168.0.0/16", start: v4(192, 168, 0, 0), end: v4(192, 168, 255, 255) },
  { label: "loopback", cidr: "127.0.0.0/8", start: v4(127, 0, 0, 0), end: v4(127, 255, 255, 255) },
  { label: "link-local", cidr: "169.254.0.0/16", start: v4(169, 254, 0, 0), end: v4(169, 254, 255, 255) },
  { label: "carrier-grade NAT (RFC 6598)", cidr: "100.64.0.0/10", start: v4(100, 64, 0, 0), end: v4(100, 127, 255, 255) },
];

// -- IPv6 internal prefixes, matched on the leading hextet(s) of the decoded
//    address (lowercase, uncompressed groups). -------------------------------
export interface Ipv6Prefix {
  label: string;
  cidr: string;
  /** Returns true if the 8 uncompressed lowercase hextets fall in this prefix. */
  test: (hextets: string[]) => boolean;
}

export const IPV6_INTERNAL_PREFIXES: Ipv6Prefix[] = [
  {
    label: "unique local (RFC 4193)",
    cidr: "fc00::/7",
    test: (h) => {
      const first = parseInt(h[0] || "0", 16);
      return (first & 0xfe00) === 0xfc00; // fc00 or fd00 high bits
    },
  },
  {
    label: "link-local",
    cidr: "fe80::/10",
    test: (h) => {
      const first = parseInt(h[0] || "0", 16);
      return (first & 0xffc0) === 0xfe80;
    },
  },
  {
    label: "loopback",
    cidr: "::1",
    test: (h) => h.slice(0, 7).every((g) => parseInt(g, 16) === 0) && parseInt(h[7] || "0", 16) === 1,
  },
];
