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
// IPv4-MAPPED, RE-CHECKED 2026-10-19 (the old note here was stale). The expected
// compressed form is the RFC 5952 s5 mixed notation (`::ffff:192.0.2.128`).
// Python 3.13.16, run on 2026-10-19, agrees: str() and .compressed of
// IPv6Address("::ffff:192.0.2.128") both print `::ffff:192.0.2.128`, and its
// reverse_pointer matches the vector below. The one remaining difference is the
// EXPANDED form: Python's .exploded keeps the dotted tail
// (`0000:0000:0000:0000:0000:ffff:192.0.2.128`), while this tool's expanded field
// is always eight 4-digit hex groups (`...:ffff:c000:0280`), so the vector
// asserts the tool's all-hex form.
//
// ADDED 2026-10-19 (PRIME's decisions A1 to A3): reserved and unassigned
// multicast scopes, multicast flags, source-specific multicast (ff3x::/32), the
// IANA special-purpose rows 3fff::/20, 5f00::/16, 64:ff9b:1::/48 and 2001::/32,
// and the Teredo decoder. Compressed, expanded and reverse-DNS values for every
// new vector were printed by Python 3.13.16 `ipaddress` on 2026-10-19, and for
// the Teredo vector Python's .teredo property returns (192.0.2.45,
// 203.0.113.20), the same server and client this decoder asserts.
//
// `verifyVectors()` runs the whole set and returns a structured pass/fail report.
// ============================================================================

import { decodeIpv6, Ipv6DecodeError, type Ipv6DecodeErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "ipv6-golden-2026-10-19"; // dated set ID, bumped 2026-10-19 when the A1 to A3 vectors were added

/** The subset of decoded fields a golden vector may assert. */
export interface Ipv6Expectation {
  compressed: string;
  expanded: string;
  type: string;
  scope?: string;
  isMulticast?: boolean;
  embeddedIpv4?: string;
  scopeStatus?: "assigned" | "reserved" | "unassigned"; // multicast scope registry status (added 2026-10-19)
  flags?: string; // multicast flag read-out (added 2026-10-19)
  ssmRange?: string; // SSM group-ID range (added 2026-10-19)
  teredo?: { server: string; flags: string; cone: boolean; port: number; client: string } | null; // Teredo decode (added 2026-10-19)
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
  // -- Added 2026-10-19: IANA special-purpose rows (registry CSV read that day) --
  {
    id: "documentation-3fff", // RFC 9637 documentation prefix; was "Global unicast" before 2026-10-19
    description: "RFC 9637 documentation prefix (3fff::/20)", // IANA row: 3fff::/20, Documentation, 2024-07
    input: "3fff::1", // first host-style address in the block
    expect: {
      compressed: "3fff::1", // Python 3.13.16 .compressed
      expanded: "3fff:0000:0000:0000:0000:0000:0000:0001", // Python .exploded
      type: "Documentation", // the IANA registry name for the row
      eui64Mac: null, // no ff:fe in the interface id
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.f.f.f.3.ip6.arpa", // Python .reverse_pointer
      teredo: null, // outside 2001::/32
    },
  },
  {
    id: "srv6-sid-5f00", // RFC 9602 SRv6 SID block
    description: "SRv6 SID block (5f00::/16, RFC 9602)", // IANA row: 5f00::/16, Segment Routing (SRv6) SIDs, 2024-04
    input: "5f00::1", // an address inside the block
    expect: {
      compressed: "5f00::1", // Python .compressed
      expanded: "5f00:0000:0000:0000:0000:0000:0000:0001", // Python .exploded
      type: "Segment Routing (SRv6) SIDs", // the IANA registry name
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.f.5.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "nat64-local-use", // RFC 8215 local-use translation prefix
    description: "Local-use IPv4/IPv6 translation prefix (64:ff9b:1::/48, RFC 8215)", // IANA row allocated 2017-06
    input: "64:ff9b:1::1", // an address inside the /48
    expect: {
      compressed: "64:ff9b:1::1", // Python .compressed
      expanded: "0064:ff9b:0001:0000:0000:0000:0000:0001", // Python .exploded
      type: "IPv4/IPv6 translation (local use)", // distinguishes it from the 64:ff9b::/96 well-known prefix
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.1.0.0.0.b.9.f.f.4.6.0.0.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "teredo-decode", // PRIME's A3 golden vector (worked in e3/facts/ipv6-transition.md F42)
    description: "Teredo (2001::/32, RFC 4380 s4): server 192.0.2.45, port 40000, client 203.0.113.20", // documentation addresses only
    input: "2001:0:c000:22d:3c5a:63bf:34ff:8eeb", // prefix | c000:022d | 3c5a | 63bf | 34ff:8eeb
    expect: {
      compressed: "2001:0:c000:22d:3c5a:63bf:34ff:8eeb", // Python .compressed (a single zero group is not compressed)
      expanded: "2001:0000:c000:022d:3c5a:63bf:34ff:8eeb", // Python .exploded
      type: "Teredo", // the IANA registry row is "TEREDO"
      eui64Mac: null, // bytes 11 and 12 are bf 34, not ff fe
      reverseDns: "b.e.e.8.f.f.4.3.f.b.3.6.a.5.c.3.d.2.2.0.0.0.0.c.0.0.0.0.1.0.0.2.ip6.arpa", // Python .reverse_pointer
      teredo: {
        server: "192.0.2.45", // c000:022d in clear; Python .teredo[0]
        flags: "0x3c5a (C=0, U=0, G=0)", // RFC 5991 s3.1 layout: C=0, z=0, Random1=1111, U=0, G=0, Random2=0x5a
        cone: false, // first flag bit is 0
        port: 40000, // 0x63bf XOR 0xffff = 0x9c40
        client: "203.0.113.20", // 34ff:8eeb XOR ffff:ffff = cb00:7114; Python .teredo[1]
      },
    },
  },
  {
    id: "teredo-prefix-not-decoded", // a /32 block names no single client
    description: "Teredo prefix with a /32 length: classified, not decoded", // decoder runs only for a bare address or /128
    input: "2001::/32", // the whole Teredo block
    expect: {
      compressed: "2001::", // Python .compressed of the network address
      expanded: "2001:0000:0000:0000:0000:0000:0000:0000", // Python .exploded
      type: "Teredo", // still classified
      eui64Mac: null, // no ff:fe
      reverseDns: "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.1.0.0.2.ip6.arpa", // Python .reverse_pointer
      teredo: null, // no decode for a prefix
      network: "2001::", // prefix math still works
      lastAddress: "2001:0:ffff:ffff:ffff:ffff:ffff:ffff", // all 96 host bits set; Python IPv6Network("2001::/32").broadcast_address
      countPow2: "2^96", // 128 - 32
      hostBits: 96, // 128 - 32
    },
  },
  // -- Added 2026-10-19: multicast scope values, flags and SSM (RFC 4291 s2.7, RFC 7346, RFC 4607) --
  {
    id: "mcast-scope-f-reserved", // the reported bug: "scope 15" for ff0f::
    description: "Multicast scope F is reserved (RFC 4291 s2.7; IANA scope registry)", // no longer printed as a bare number
    input: "ff0f::1", // flags 0, scope F
    expect: {
      compressed: "ff0f::1", // Python .compressed
      expanded: "ff0f:0000:0000:0000:0000:0000:0000:0001", // Python .exploded
      type: "Multicast", // ff00::/8
      scope: "reserved (scope F)", // was "scope 15"
      scopeStatus: "reserved", // the registry row for F reads "Reserved"
      flags: "0000 (X=0, R=0, P=0, T=0)", // a permanently assigned (T=0) form
      isMulticast: true, // ff00::/8
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.f.0.f.f.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "mcast-scope-0-reserved", // the other reserved value
    description: "Multicast scope 0 is reserved (RFC 4291 s2.7; IANA scope registry)", // was printed as "reserved" alone
    input: "ff00::1", // flags 0, scope 0
    expect: {
      compressed: "ff00::1", // Python .compressed
      expanded: "ff00:0000:0000:0000:0000:0000:0000:0001", // Python .exploded
      type: "Multicast", // ff00::/8
      scope: "reserved (scope 0)", // named with its digit
      scopeStatus: "reserved", // registry: 0 Reserved
      isMulticast: true, // ff00::/8
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.f.f.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "mcast-scope-6-unassigned", // an unassigned value
    description: "Multicast scope 6 is unassigned (RFC 4291 s2.7; IANA scope registry 6-7 Unassigned)", // admin-definable
    input: "ff06::1", // flags 0, scope 6
    expect: {
      compressed: "ff06::1", // Python .compressed
      expanded: "ff06:0000:0000:0000:0000:0000:0000:0001", // Python .exploded
      type: "Multicast", // ff00::/8
      scope: "unassigned (scope 6)", // was "scope 6"
      scopeStatus: "unassigned", // registry: 6-7 Unassigned
      isMulticast: true, // ff00::/8
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.6.0.f.f.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "ssm-dynamic", // ff3x::/32 recognised as SSM
    description: "Source-specific multicast, global scope, dynamic group ID (RFC 4607 s1)", // ff3e::/96, group 8000:1
    input: "ff3e::8000:1", // P=1, T=1, scope E, plen 0, prefix 0
    expect: {
      compressed: "ff3e::8000:1", // Python .compressed
      expanded: "ff3e:0000:0000:0000:0000:0000:8000:0001", // Python .exploded
      type: "Source-specific multicast", // RFC 4607: FF3x::/32 is reserved for SSM
      scope: "global", // scope E
      scopeStatus: "assigned", // E is Global scope in the registry
      flags: "0011 (X=0, R=0, P=1, T=1)", // the P and T bits RFC 4607 requires
      ssmRange: "dynamic assignment (ff3x::8000:0 to ff3x::ffff:ffff)", // IANA registry range
      isMulticast: true, // still multicast
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.8.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.e.3.f.f.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "ssm-invalid-group", // the low quarter of the group-ID space
    description: "SSM group ID below 4000:0 is invalid (RFC 4607 s1)", // ff32::1234, link-local scope
    input: "ff32::1234", // group ID 0000:1234
    expect: {
      compressed: "ff32::1234", // Python .compressed
      expanded: "ff32:0000:0000:0000:0000:0000:0000:1234", // Python .exploded
      type: "Source-specific multicast", // still in ff3x::/32
      scope: "link-local", // scope 2
      ssmRange: "invalid SSM group ID (ff3x::0:0 to ff3x::3fff:ffff)", // RFC 4607 s1
      isMulticast: true, // multicast
      eui64Mac: null, // no ff:fe
      reverseDns: "4.3.2.1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.3.f.f.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "ssm-iana-range", // the IANA-allocated quarter
    description: "SSM group ID 4000:1 sits in the IANA allocation range (RFC 4607 s1, IANA registry)", // site-local scope
    input: "ff35::4000:1", // group ID 4000:0001
    expect: {
      compressed: "ff35::4000:1", // Python .compressed
      expanded: "ff35:0000:0000:0000:0000:0000:4000:0001", // Python .exploded
      type: "Source-specific multicast", // ff3x::/32
      scope: "site-local", // scope 5
      ssmRange: "reserved for IANA allocation (ff3x::4000:0 to ff3x::7fff:ffff)", // IANA registry range
      isMulticast: true, // multicast
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.4.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.5.3.f.f.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "ssm-outside-96", // non-zero network-prefix field
    description: "ff3x::/32 outside ff3x::/96 is reserved for future SSM use (IANA registry)", // still SSM per RFC 4607 s1
    input: "ff3e:0:1:2::1", // network prefix field 0001:0002:0000:0000
    expect: {
      compressed: "ff3e:0:1:2::1", // Python .compressed
      expanded: "ff3e:0000:0001:0002:0000:0000:0000:0001", // Python .exploded
      type: "Source-specific multicast", // "a system should treat all of FF3x::/32 as SSM addresses" (RFC 4607 s1)
      ssmRange: "outside ff3x::/96: reserved for future SSM use, currently invalid", // IANA registry note
      isMulticast: true, // multicast
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.0.0.0.1.0.0.0.0.0.0.0.e.3.f.f.ip6.arpa", // Python .reverse_pointer
    },
  },
  {
    id: "mcast-embedded-rp-flags", // R=1 is not SSM
    description: "Embedded-RP form ff7x (RFC 3956): flags read out, not classified as SSM", // flags 0111
    input: "ff7e:240:2001:db8::1", // R=1, P=1, T=1, scope E
    expect: {
      compressed: "ff7e:240:2001:db8::1", // Python .compressed
      expanded: "ff7e:0240:2001:0db8:0000:0000:0000:0001", // Python .exploded
      type: "Multicast", // flags 7, so not ff3x::/32
      scope: "global", // scope E
      flags: "0111 (X=0, R=1, P=1, T=1)", // R from RFC 3956
      isMulticast: true, // multicast
      eui64Mac: null, // no ff:fe
      reverseDns: "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.0.4.2.0.e.7.f.f.ip6.arpa", // Python .reverse_pointer
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
    if (x.scopeStatus !== undefined) eq(v.id, "scopeStatus", x.scopeStatus, d.classification.scopeStatus); // reserved vs real scope
    if (x.flags !== undefined) eq(v.id, "flags", x.flags, d.classification.flags); // multicast flag read-out
    if (x.ssmRange !== undefined) eq(v.id, "ssmRange", x.ssmRange, d.classification.ssmRange); // SSM group-ID range
    if (x.teredo !== undefined) eq(v.id, "teredo", x.teredo, d.teredo); // Teredo fields, or null when not decoded
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
