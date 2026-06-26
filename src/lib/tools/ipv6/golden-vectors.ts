// ============================================================================
// src/lib/tools/ipv6/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the IPv6 toolkit.
//
// Accept vectors are RFC-anchored addresses (RFC 4291 examples, RFC 3849
// documentation space, RFC 4291 Appendix A EUI-64). Expected canonical forms,
// reverse-DNS names, and prefix math were cross-checked against Python's
// `ipaddress` module - an independent reference implementation - so these pin
// the parser to a second implementation, not to itself.
//
// ONE DOCUMENTED DIVERGENCE: for the IPv4-mapped address, the expected
// compressed form is the RFC 5952 §5 mixed notation (`::ffff:192.0.2.128`).
// Python's `ipaddress` emits pure hex (`::ffff:c000:280`) instead; RFC 5952 §5
// says IPv4-mapped addresses SHOULD use the mixed form, so the tool follows the
// RFC and this vector asserts that, not Python's output.
//
// `verifyVectors()` runs the whole set and returns a structured pass/fail report.
// ============================================================================

import { decodeIpv6, Ipv6DecodeError, type Ipv6DecodeErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "ipv6-golden-v1";

/** The subset of decoded fields a golden vector may assert. */
export interface Ipv6Expectation {
  compressed: string;
  expanded: string;
  type: string;
  scope?: string;
  isMulticast?: boolean;
  embeddedIpv4?: string;
  eui64Mac?: string | null;
  reverseDns: string;
  // prefix math (when the vector carries a /length)
  network?: string;
  lastAddress?: string;
  countPow2?: string;
  hostBits?: number;
}

export interface Ipv6GoldenVector {
  id: string;
  description: string;
  input: string;
  expect: Ipv6Expectation;
}

export const IPV6_GOLDEN_VECTORS: Ipv6GoldenVector[] = [
  {
    id: "rfc4291-example",
    description: "RFC 4291 §2.1 example unicast address",
    input: "2001:db8:0:0:8:800:200c:417a",
    expect: {
      compressed: "2001:db8::8:800:200c:417a",
      expanded: "2001:0db8:0000:0000:0008:0800:200c:417a",
      type: "Documentation", // RFC 4291 §2.2's own example sits in 2001:db8::/32 (RFC 3849)
      eui64Mac: null,
      reverseDns: "a.7.1.4.c.0.0.2.0.0.8.0.8.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa",
    },
  },
  {
    id: "documentation",
    description: "RFC 3849 documentation address",
    input: "2001:db8::1",
    expect: {
      compressed: "2001:db8::1",
      expanded: "2001:0db8:0000:0000:0000:0000:0000:0001",
      type: "Documentation",
      eui64Mac: null,
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa",
    },
  },
  {
    id: "link-local",
    description: "Link-local unicast (fe80::/10)",
    input: "fe80::1",
    expect: {
      compressed: "fe80::1",
      expanded: "fe80:0000:0000:0000:0000:0000:0000:0001",
      type: "Link-local unicast",
      scope: "link-local",
      eui64Mac: null,
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.e.f.ip6.arpa",
    },
  },
  {
    id: "loopback",
    description: "Loopback (::1/128)",
    input: "::1",
    expect: {
      compressed: "::1",
      expanded: "0000:0000:0000:0000:0000:0000:0000:0001",
      type: "Loopback",
      eui64Mac: null,
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    },
  },
  {
    id: "unspecified",
    description: "Unspecified (::/128)",
    input: "::",
    expect: {
      compressed: "::",
      expanded: "0000:0000:0000:0000:0000:0000:0000:0000",
      type: "Unspecified",
      eui64Mac: null,
      reverseDns: "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    },
  },
  {
    id: "multicast-all-nodes",
    description: "Multicast all-nodes, link-local scope (ff02::1)",
    input: "ff02::1",
    expect: {
      compressed: "ff02::1",
      expanded: "ff02:0000:0000:0000:0000:0000:0000:0001",
      type: "Multicast",
      scope: "link-local",
      isMulticast: true,
      eui64Mac: null,
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.0.f.f.ip6.arpa",
    },
  },
  {
    id: "ipv4-mapped",
    description: "IPv4-mapped (::ffff:0:0/96); RFC 5952 §5 mixed notation",
    input: "::ffff:192.0.2.128",
    expect: {
      compressed: "::ffff:192.0.2.128", // RFC 5952 §5 mixed form (Python emits ::ffff:c000:280)
      expanded: "0000:0000:0000:0000:0000:ffff:c000:0280",
      type: "IPv4-mapped",
      embeddedIpv4: "192.0.2.128",
      eui64Mac: null,
      reverseDns: "0.8.2.0.0.0.0.c.f.f.f.f.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    },
  },
  {
    id: "eui64",
    description: "Modified-EUI-64 interface id (RFC 4291 App. A) -> MAC 00:11:22:33:44:55",
    input: "fe80::211:22ff:fe33:4455",
    expect: {
      compressed: "fe80::211:22ff:fe33:4455",
      expanded: "fe80:0000:0000:0000:0211:22ff:fe33:4455",
      type: "Link-local unicast",
      scope: "link-local",
      eui64Mac: "00:11:22:33:44:55",
      reverseDns: "5.5.4.4.3.3.e.f.f.f.2.2.1.1.2.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.e.f.ip6.arpa",
    },
  },
  {
    id: "global-unicast",
    description: "Global unicast (2000::/3), outside all special-use blocks",
    input: "2600::1",
    expect: {
      compressed: "2600::1",
      expanded: "2600:0000:0000:0000:0000:0000:0000:0001",
      type: "Global unicast",
      eui64Mac: null,
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.6.2.ip6.arpa",
    },
  },
  {
    id: "prefix-64",
    description: "Prefix math on 2001:db8::/64",
    input: "2001:db8::/64",
    expect: {
      compressed: "2001:db8::",
      expanded: "2001:0db8:0000:0000:0000:0000:0000:0000",
      type: "Documentation",
      eui64Mac: null,
      reverseDns: "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa",
      network: "2001:db8::",
      lastAddress: "2001:db8::ffff:ffff:ffff:ffff",
      countPow2: "2^64",
      hostBits: 64,
    },
  },
  {
    id: "prefix-host-bits-set",
    description: "Prefix math zeroes host bits (2001:db8:abcd:12::1/64)",
    input: "2001:db8:abcd:12::1/64",
    expect: {
      compressed: "2001:db8:abcd:12::1",
      expanded: "2001:0db8:abcd:0012:0000:0000:0000:0001",
      type: "Documentation",
      eui64Mac: null,
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.1.0.0.d.c.b.a.8.b.d.0.1.0.0.2.ip6.arpa",
      network: "2001:db8:abcd:12::",
      lastAddress: "2001:db8:abcd:12:ffff:ffff:ffff:ffff",
      countPow2: "2^64",
      hostBits: 64,
    },
  },
];

export interface Ipv6RejectVector {
  id: string;
  description: string;
  input: string;
  code: Ipv6DecodeErrorCode;
}

export const IPV6_REJECT_VECTORS: Ipv6RejectVector[] = [
  { id: "empty", description: "empty string", input: "   ", code: "empty" },
  { id: "garbage", description: "not an address", input: "not-an-address", code: "format" },
  { id: "too-many-groups", description: "nine groups", input: "1:2:3:4:5:6:7:8:9", code: "format" },
  { id: "double-compression", description: "two :: runs", input: "2001::db8::1", code: "format" },
  { id: "bad-prefix", description: "prefix length > 128", input: "2001:db8::/129", code: "prefix" },
  { id: "bad-hex", description: "non-hex group", input: "2001:db8::xyz", code: "format" },
];

/** A single failure from the self-check. */
export interface VectorFailure {
  vectorId: string;
  field: string;
  expected: string;
  actual: string;
}

/** Run every vector; returns counts and a list of mismatches (empty == all pass). */
export function verifyVectors(): { passed: number; failed: number; failures: VectorFailure[] } {
  const failures: VectorFailure[] = [];
  const eq = (id: string, field: string, expected: unknown, actual: unknown) => {
    if (JSON.stringify(expected) !== JSON.stringify(actual))
      failures.push({ vectorId: id, field, expected: JSON.stringify(expected), actual: JSON.stringify(actual) });
  };

  for (const v of IPV6_GOLDEN_VECTORS) {
    let d;
    try {
      d = decodeIpv6(v.input);
    } catch (err) {
      failures.push({ vectorId: v.id, field: "<decode>", expected: "decoded", actual: String(err) });
      continue;
    }
    const x = v.expect;
    eq(v.id, "compressed", x.compressed, d.compressed);
    eq(v.id, "expanded", x.expanded, d.expanded);
    eq(v.id, "type", x.type, d.classification.type);
    if (x.scope !== undefined) eq(v.id, "scope", x.scope, d.classification.scope);
    if (x.isMulticast !== undefined) eq(v.id, "isMulticast", x.isMulticast, d.classification.isMulticast);
    if (x.embeddedIpv4 !== undefined) eq(v.id, "embeddedIpv4", x.embeddedIpv4, d.classification.embeddedIpv4);
    if (x.eui64Mac !== undefined) eq(v.id, "eui64Mac", x.eui64Mac, d.eui64Mac);
    eq(v.id, "reverseDns", x.reverseDns, d.reverseDns);
    if (x.network !== undefined) eq(v.id, "network", x.network, d.prefix?.network);
    if (x.lastAddress !== undefined) eq(v.id, "lastAddress", x.lastAddress, d.prefix?.lastAddress);
    if (x.countPow2 !== undefined) eq(v.id, "countPow2", x.countPow2, d.prefix?.countPow2);
    if (x.hostBits !== undefined) eq(v.id, "hostBits", x.hostBits, d.prefix?.hostBits);
  }

  for (const r of IPV6_REJECT_VECTORS) {
    try {
      decodeIpv6(r.input);
      failures.push({ vectorId: r.id, field: "<reject>", expected: `throw ${r.code}`, actual: "no throw" });
    } catch (err) {
      const code = err instanceof Ipv6DecodeError ? err.code : "(not Ipv6DecodeError)";
      if (code !== r.code) failures.push({ vectorId: r.id, field: "<reject>", expected: r.code, actual: code });
    }
  }

  const total = IPV6_GOLDEN_VECTORS.length + IPV6_REJECT_VECTORS.length;
  return { passed: total - failures.length, failed: failures.length, failures };
}
