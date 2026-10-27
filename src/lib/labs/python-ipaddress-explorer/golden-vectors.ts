// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/python-ipaddress-explorer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the ipaddress explorer lab (set 2026-10-27a). Every accept
// vector's expected values were produced by CPython 3.13.16 itself, running the
// same factory, class constructors, attributes, properties and methods the lab
// models, and written into this file by a generator rather than copied by hand
// (only the IANA row a vector names is the lab's own data, and the generator
// checked CPython's is_global against it). Beyond these, the model was compared
// with CPython 3.13.16 on 200,000 seeded random settings (valid, corrupted and
// noise texts, all four calls, subnets() and supernet() with random prefixes)
// on 2026-10-27, with no difference. Reject vectors pin the stable error codes.
// verifyVectors() runs them all; scripts/run-golden-vectors runs it at prebuild
// and fails the build on any drift.
// ============================================================================

import { compute, IpaddressLabError, type IpaddressErrorCode, type IpaddressInput, type IpaddressResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "python-ipaddress-explorer/2026-10-27a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: IpaddressInput;
  /** The fields of the result that must match, as CPython produced them. */
  expect: Partial<IpaddressResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the type itself forbids them). */
  input: IpaddressInput;
  /** The code the refusal must carry. */
  code: IpaddressErrorCode;
}

/** The accept cases, each one CPython's own answer. */
export const IPADDRESS_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: an interface keeps the host address and its /26 network together.
  { id: "default-interface", input: {"text": "192.0.2.77/26", "call": "ip_interface", "method": "none", "newPrefix": ""}, expect: {"python": "ipaddress.ip_interface('192.0.2.77/26')", "verdict": "object", "repr": "IPv4Interface('192.0.2.77/26')", "fields": [{"name": "str(x)", "value": "'192.0.2.77/26'"}, {"name": "ip", "value": "IPv4Address('192.0.2.77')"}, {"name": "network", "value": "IPv4Network('192.0.2.64/26')"}, {"name": "with_prefixlen", "value": "'192.0.2.77/26'"}, {"name": "with_netmask", "value": "'192.0.2.77/255.255.255.192'"}, {"name": "with_hostmask", "value": "'192.0.2.77/0.0.0.63'"}], "props": [{"name": "is_private", "value": true}, {"name": "is_global", "value": false}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}]} },
  // The Example: the same text as a strict network; IPv4Network raises a ValueError the factory does not catch.
  { id: "example-strict-host-bits", input: {"text": "192.0.2.77/26", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"python": "ipaddress.ip_network('192.0.2.77/26')", "verdict": "error", "attempts": [{"cls": "IPv4Network", "call": "IPv4Network('192.0.2.77/26')", "outcome": "propagated", "exception": "ValueError", "message": "192.0.2.77/26 has host bits set"}], "error": {"exception": "ValueError", "message": "192.0.2.77/26 has host bits set"}} },
  // strict=False masks the host bits off: the network is 192.0.2.64/26, not what was typed.
  { id: "loose-masks-host-bits", input: {"text": "192.0.2.77/26", "call": "ip_network_loose", "method": "none", "newPrefix": ""}, expect: {"python": "ipaddress.ip_network('192.0.2.77/26', strict=False)", "verdict": "masked", "repr": "IPv4Network('192.0.2.64/26')", "masked": true, "fields": [{"name": "str(x)", "value": "'192.0.2.64/26'"}, {"name": "network_address", "value": "IPv4Address('192.0.2.64')"}, {"name": "broadcast_address", "value": "IPv4Address('192.0.2.127')"}, {"name": "netmask", "value": "IPv4Address('255.255.255.192')"}, {"name": "hostmask", "value": "IPv4Address('0.0.0.63')"}, {"name": "prefixlen", "value": "26"}, {"name": "num_addresses", "value": "64"}, {"name": "with_netmask", "value": "'192.0.2.64/255.255.255.192'"}, {"name": "with_hostmask", "value": "'192.0.2.64/0.0.0.63'"}], "hosts": {"count": "62", "first": "IPv4Address('192.0.2.65')", "last": "IPv4Address('192.0.2.126')"}} },
  // A leading zero: the factory says only that neither class worked; IPv4Address says why.
  { id: "leading-zeros", input: {"text": "192.168.010.1", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"verdict": "error", "attempts": [{"cls": "IPv4Address", "call": "IPv4Address('192.168.010.1')", "outcome": "caught", "exception": "AddressValueError", "message": "Leading zeros are not permitted in '010' in '192.168.010.1'"}, {"cls": "IPv6Address", "call": "IPv6Address('192.168.010.1')", "outcome": "caught", "exception": "AddressValueError", "message": "At least 3 parts expected in '192.168.010.1'"}], "error": {"exception": "ValueError", "message": "'192.168.010.1' does not appear to be an IPv4 or IPv6 address"}} },
  // The short form inet_aton() accepts is not four octets.
  { id: "short-form", input: {"text": "127.1", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"verdict": "error", "attempts": [{"cls": "IPv4Address", "call": "IPv4Address('127.1')", "outcome": "caught", "exception": "AddressValueError", "message": "Expected 4 octets in '127.1'"}, {"cls": "IPv6Address", "call": "IPv6Address('127.1')", "outcome": "caught", "exception": "AddressValueError", "message": "At least 3 parts expected in '127.1'"}], "error": {"exception": "ValueError", "message": "'127.1' does not appear to be an IPv4 or IPv6 address"}} },
  // A trailing space, as from an unstripped file line, is not a decimal digit.
  { id: "trailing-space", input: {"text": "192.0.2.10 ", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"verdict": "error", "attempts": [{"cls": "IPv4Address", "call": "IPv4Address('192.0.2.10 ')", "outcome": "caught", "exception": "AddressValueError", "message": "Only decimal digits permitted in '10 ' in '192.0.2.10 '"}, {"cls": "IPv6Address", "call": "IPv6Address('192.0.2.10 ')", "outcome": "caught", "exception": "AddressValueError", "message": "At least 3 parts expected in '192.0.2.10 '"}], "error": {"exception": "ValueError", "message": "'192.0.2.10 ' does not appear to be an IPv4 or IPv6 address"}} },
  // An octet above 255.
  { id: "octet-256", input: {"text": "192.0.2.256", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"attempts": [{"cls": "IPv4Address", "call": "IPv4Address('192.0.2.256')", "outcome": "caught", "exception": "AddressValueError", "message": "Octet 256 (> 255) not permitted in '192.0.2.256'"}, {"cls": "IPv6Address", "call": "IPv6Address('192.0.2.256')", "outcome": "caught", "exception": "AddressValueError", "message": "At least 3 parts expected in '192.0.2.256'"}], "error": {"exception": "ValueError", "message": "'192.0.2.256' does not appear to be an IPv4 or IPv6 address"}} },
  // A dotted netmask is read as /26.
  { id: "dotted-netmask", input: {"text": "192.0.2.64/255.255.255.192", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"verdict": "object", "repr": "IPv4Network('192.0.2.64/26')", "fields": [{"name": "str(x)", "value": "'192.0.2.64/26'"}, {"name": "network_address", "value": "IPv4Address('192.0.2.64')"}, {"name": "broadcast_address", "value": "IPv4Address('192.0.2.127')"}, {"name": "netmask", "value": "IPv4Address('255.255.255.192')"}, {"name": "hostmask", "value": "IPv4Address('0.0.0.63')"}, {"name": "prefixlen", "value": "26"}, {"name": "num_addresses", "value": "64"}, {"name": "with_netmask", "value": "'192.0.2.64/255.255.255.192'"}, {"name": "with_hostmask", "value": "'192.0.2.64/0.0.0.63'"}]} },
  // A mask whose first field is zero is a host mask: also /26.
  { id: "dotted-hostmask", input: {"text": "192.0.2.64/0.0.0.63", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"verdict": "object", "repr": "IPv4Network('192.0.2.64/26')"} },
  // A mask that mixes ones and zeros is no mask: NetmaskValueError, then IPv6 refuses the address.
  { id: "mixed-mask", input: {"text": "192.0.2.64/255.0.255.0", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"verdict": "error", "attempts": [{"cls": "IPv4Network", "call": "IPv4Network('192.0.2.64/255.0.255.0')", "outcome": "caught", "exception": "NetmaskValueError", "message": "'255.0.255.0' is not a valid netmask"}, {"cls": "IPv6Network", "call": "IPv6Network('192.0.2.64/255.0.255.0')", "outcome": "caught", "exception": "AddressValueError", "message": "At least 3 parts expected in '192.0.2.64'"}], "error": {"exception": "ValueError", "message": "'192.0.2.64/255.0.255.0' does not appear to be an IPv4 or IPv6 network"}} },
  // A prefix length may carry leading zeros, unlike an octet.
  { id: "prefix-leading-zero", input: {"text": "10.0.0.0/024", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"verdict": "object", "repr": "IPv4Network('10.0.0.0/24')"} },
  // A /33 is not a valid IPv4 netmask.
  { id: "prefix-out-of-range", input: {"text": "192.0.2.0/33", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"verdict": "error", "attempts": [{"cls": "IPv4Network", "call": "IPv4Network('192.0.2.0/33')", "outcome": "caught", "exception": "NetmaskValueError", "message": "'33' is not a valid netmask"}, {"cls": "IPv6Network", "call": "IPv6Network('192.0.2.0/33')", "outcome": "caught", "exception": "AddressValueError", "message": "At least 3 parts expected in '192.0.2.0'"}], "error": {"exception": "ValueError", "message": "'192.0.2.0/33' does not appear to be an IPv4 or IPv6 network"}} },
  // Only one slash is permitted.
  { id: "two-slashes", input: {"text": "1.2.3.4/5/6", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"attempts": [{"cls": "IPv4Network", "call": "IPv4Network('1.2.3.4/5/6')", "outcome": "caught", "exception": "AddressValueError", "message": "Only one '/' permitted in '1.2.3.4/5/6'"}, {"cls": "IPv6Network", "call": "IPv6Network('1.2.3.4/5/6')", "outcome": "caught", "exception": "AddressValueError", "message": "Only one '/' permitted in '1.2.3.4/5/6'"}], "error": {"exception": "ValueError", "message": "'1.2.3.4/5/6' does not appear to be an IPv4 or IPv6 network"}} },
  // RFC 5952: of two equal runs of zero groups, the first becomes ::.
  { id: "v6-compress-tie", input: {"text": "2001:0DB8:0000:0000:0001:0000:0000:0001", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"verdict": "object", "repr": "IPv6Address('2001:db8::1:0:0:1')", "fields": [{"name": "str(x)", "value": "'2001:db8::1:0:0:1'"}, {"name": "exploded", "value": "'2001:0db8:0000:0000:0001:0000:0000:0001'"}, {"name": "int(x)", "value": "42540766411282592856904266426630537217"}, {"name": "packed", "value": "b' \\x01\\r\\xb8\\x00\\x00\\x00\\x00\\x00\\x01\\x00\\x00\\x00\\x00\\x00\\x01'"}, {"name": "reverse_pointer", "value": "'1.0.0.0.0.0.0.0.0.0.0.0.1.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa'"}, {"name": "scope_id", "value": "None"}, {"name": "ipv4_mapped", "value": "None"}, {"name": "sixtofour", "value": "None"}, {"name": "teredo", "value": "None"}]} },
  // Two :: in one address.
  { id: "v6-two-double-colons", input: {"text": "2001:db8::10::1", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"attempts": [{"cls": "IPv4Address", "call": "IPv4Address('2001:db8::10::1')", "outcome": "caught", "exception": "AddressValueError", "message": "Expected 4 octets in '2001:db8::10::1'"}, {"cls": "IPv6Address", "call": "IPv6Address('2001:db8::10::1')", "outcome": "caught", "exception": "AddressValueError", "message": "At most one '::' permitted in '2001:db8::10::1'"}], "error": {"exception": "ValueError", "message": "'2001:db8::10::1' does not appear to be an IPv4 or IPv6 address"}} },
  // A zone after % is part of the address: scope_id, and a link-local address.
  { id: "v6-zone", input: {"text": "fe80::1%eth0", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"verdict": "object", "repr": "IPv6Address('fe80::1%eth0')", "fields": [{"name": "str(x)", "value": "'fe80::1%eth0'"}, {"name": "exploded", "value": "'fe80:0000:0000:0000:0000:0000:0000:0001%eth0'"}, {"name": "int(x)", "value": "338288524927261089654018896841347694593"}, {"name": "packed", "value": "b'\\xfe\\x80\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x01'"}, {"name": "reverse_pointer", "value": "'0.h.t.e.%.1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.e.f.ip6.arpa'"}, {"name": "scope_id", "value": "'eth0'"}, {"name": "ipv4_mapped", "value": "None"}, {"name": "sixtofour", "value": "None"}, {"name": "teredo", "value": "None"}], "props": [{"name": "is_private", "value": true}, {"name": "is_global", "value": false}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": true}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}, {"name": "is_site_local", "value": false}], "zoneInPointer": true} },
  // An empty zone is refused, with the message's double quotes around the repr.
  { id: "v6-empty-zone", input: {"text": "fe80::1%", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"attempts": [{"cls": "IPv4Address", "call": "IPv4Address('fe80::1%')", "outcome": "caught", "exception": "AddressValueError", "message": "Expected 4 octets in 'fe80::1%'"}, {"cls": "IPv6Address", "call": "IPv6Address('fe80::1%')", "outcome": "caught", "exception": "AddressValueError", "message": "Invalid IPv6 address: \"'fe80::1%'\""}], "error": {"exception": "ValueError", "message": "'fe80::1%' does not appear to be an IPv4 or IPv6 address"}} },
  // More than 45 characters: refused before any splitting (gh-128840).
  { id: "v6-too-long", input: {"text": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"attempts": [{"cls": "IPv4Address", "call": "IPv4Address('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')", "outcome": "caught", "exception": "AddressValueError", "message": "Expected 4 octets in 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'"}, {"cls": "IPv6Address", "call": "IPv6Address('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')", "outcome": "caught", "exception": "AddressValueError", "message": "At most 45 characters expected in 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'"}], "error": {"exception": "ValueError", "message": "'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' does not appear to be an IPv4 or IPv6 address"}} },
  // An IPv4-mapped address prints its dotted tail and is judged by its IPv4 address.
  { id: "v4-mapped", input: {"text": "::ffff:192.0.2.1", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"verdict": "object", "repr": "IPv6Address('::ffff:192.0.2.1')", "fields": [{"name": "str(x)", "value": "'::ffff:192.0.2.1'"}, {"name": "exploded", "value": "'0000:0000:0000:0000:0000:ffff:192.0.2.1'"}, {"name": "int(x)", "value": "281473902969345"}, {"name": "packed", "value": "b'\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\xff\\xff\\xc0\\x00\\x02\\x01'"}, {"name": "reverse_pointer", "value": "'1.0.2.0.0.0.0.c.f.f.f.f.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa'"}, {"name": "scope_id", "value": "None"}, {"name": "ipv4_mapped", "value": "IPv4Address('192.0.2.1')"}, {"name": "sixtofour", "value": "None"}, {"name": "teredo", "value": "None"}], "props": [{"name": "is_private", "value": true}, {"name": "is_global", "value": false}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}, {"name": "is_site_local", "value": false}]} },
  // 6to4 (2002::/16) carries an IPv4 address in bits 16 to 47.
  { id: "six-to-four", input: {"text": "2002:c000:204::1", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"fields": [{"name": "str(x)", "value": "'2002:c000:204::1'"}, {"name": "exploded", "value": "'2002:c000:0204:0000:0000:0000:0000:0001'"}, {"name": "int(x)", "value": "42549574682102084431821433448024768513"}, {"name": "packed", "value": "b' \\x02\\xc0\\x00\\x02\\x04\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x01'"}, {"name": "reverse_pointer", "value": "'1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.4.0.2.0.0.0.0.c.2.0.0.2.ip6.arpa'"}, {"name": "scope_id", "value": "None"}, {"name": "ipv4_mapped", "value": "None"}, {"name": "sixtofour", "value": "IPv4Address('192.0.2.4')"}, {"name": "teredo", "value": "None"}], "props": [{"name": "is_private", "value": true}, {"name": "is_global", "value": false}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}, {"name": "is_site_local", "value": false}]} },
  // Teredo (2001::/32): the server address, then the client address inverted.
  { id: "teredo", input: {"text": "2001:0:c000:201:8000:63bf:39cc:9bf5", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"fields": [{"name": "str(x)", "value": "'2001:0:c000:201:8000:63bf:39cc:9bf5'"}, {"name": "exploded", "value": "'2001:0000:c000:0201:8000:63bf:39cc:9bf5'"}, {"name": "int(x)", "value": "42540488221396974118651801143272578037"}, {"name": "packed", "value": "b' \\x01\\x00\\x00\\xc0\\x00\\x02\\x01\\x80\\x00c\\xbf9\\xcc\\x9b\\xf5'"}, {"name": "reverse_pointer", "value": "'5.f.b.9.c.c.9.3.f.b.3.6.0.0.0.8.1.0.2.0.0.0.0.c.0.0.0.0.1.0.0.2.ip6.arpa'"}, {"name": "scope_id", "value": "None"}, {"name": "ipv4_mapped", "value": "None"}, {"name": "sixtofour", "value": "None"}, {"name": "teredo", "value": "(IPv4Address('192.0.2.1'), IPv4Address('198.51.100.10'))"}], "props": [{"name": "is_private", "value": true}, {"name": "is_global", "value": false}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}, {"name": "is_site_local", "value": false}]} },
  // hosts() on an IPv6 /126 leaves out the Subnet-Router anycast address only.
  { id: "v6-hosts-126", input: {"text": "2001:db8::/126", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"hosts": {"count": "3", "first": "IPv6Address('2001:db8::1')", "last": "IPv6Address('2001:db8::3')"}} },
  // On a /127 both addresses are hosts.
  { id: "v6-hosts-127", input: {"text": "2001:db8::/127", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"hosts": {"count": "2", "first": "IPv6Address('2001:db8::')", "last": "IPv6Address('2001:db8::1')"}} },
  // On an IPv4 /31 both addresses are hosts.
  { id: "v4-hosts-31", input: {"text": "192.0.2.0/31", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"hosts": {"count": "2", "first": "IPv4Address('192.0.2.0')", "last": "IPv4Address('192.0.2.1')"}} },
  // A /32 yields its one address.
  { id: "v4-hosts-32", input: {"text": "192.0.2.1/32", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"hosts": {"count": "1", "first": "IPv4Address('192.0.2.1')", "last": "IPv4Address('192.0.2.1')"}} },
  // subnets(new_prefix=28) of a /26: four /28s.
  { id: "subnets-28", input: {"text": "10.20.3.0/26", "call": "ip_network", "method": "subnets", "newPrefix": "28"}, expect: {"python": "list(ipaddress.ip_network('10.20.3.0/26').subnets(new_prefix=28))", "method": {"call": "subnets(new_prefix=28)", "count": "4", "items": ["IPv4Network('10.20.3.0/28')", "IPv4Network('10.20.3.16/28')", "IPv4Network('10.20.3.48/28')"], "gap": true}} },
  // subnets(new_prefix=24) of a /16: 256 networks, first, second and last shown.
  { id: "subnets-default-gap", input: {"text": "10.20.0.0/16", "call": "ip_network", "method": "subnets", "newPrefix": "24"}, expect: {"method": {"call": "subnets(new_prefix=24)", "count": "256", "items": ["IPv4Network('10.20.0.0/24')", "IPv4Network('10.20.1.0/24')", "IPv4Network('10.20.255.0/24')"], "gap": true}} },
  // subnets() with a shorter prefix raises when the iterator starts.
  { id: "subnets-shorter", input: {"text": "10.20.3.0/26", "call": "ip_network", "method": "subnets", "newPrefix": "24"}, expect: {"method": {"call": "subnets(new_prefix=24)", "error": {"exception": "ValueError", "message": "new prefix must be longer"}}} },
  // A new prefix beyond 32: the message names the new length, not the difference.
  { id: "subnets-too-long", input: {"text": "10.0.0.0/8", "call": "ip_network", "method": "subnets", "newPrefix": "40"}, expect: {"method": {"call": "subnets(new_prefix=40)", "error": {"exception": "ValueError", "message": "prefix length diff 40 is invalid for netblock 10.0.0.0/8"}}} },
  // supernet(new_prefix=16) of a /26.
  { id: "supernet-16", input: {"text": "10.20.3.0/26", "call": "ip_network", "method": "supernet", "newPrefix": "16"}, expect: {"python": "ipaddress.ip_network('10.20.3.0/26').supernet(new_prefix=16)", "method": {"call": "supernet(new_prefix=16)", "items": ["IPv4Network('10.20.0.0/16')"]}} },
  // A negative new prefix: the message gives the difference.
  { id: "supernet-negative", input: {"text": "10.0.0.0/8", "call": "ip_network", "method": "supernet", "newPrefix": "-3"}, expect: {"method": {"call": "supernet(new_prefix=-3)", "error": {"exception": "ValueError", "message": "current prefixlen is 8, cannot have a prefixlen_diff of 11"}}} },
  // An address has no subnets(): AttributeError.
  { id: "address-has-no-subnets", input: {"text": "192.0.2.1", "call": "ip_address", "method": "subnets", "newPrefix": ""}, expect: {"method": {"call": "subnets()", "error": {"exception": "AttributeError", "message": "'IPv4Address' object has no attribute 'subnets'"}}} },
  // 100.64.0.0/10 is neither private nor global.
  { id: "shared-space", input: {"text": "100.64.0.1", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"props": [{"name": "is_private", "value": false}, {"name": "is_global", "value": false}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}]} },
  // 192.0.0.9 is an exception inside 192.0.0.0/24: global.
  { id: "pcp-anycast", input: {"text": "192.0.0.9", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"props": [{"name": "is_private", "value": false}, {"name": "is_global", "value": true}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}]} },
  // 5f00::/16: IANA says not globally reachable; CPython 3.13 says global.
  { id: "iana-srv6", input: {"text": "5f00::1", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"props": [{"name": "is_private", "value": false}, {"name": "is_global", "value": true}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": true}, {"name": "is_unspecified", "value": false}, {"name": "is_site_local", "value": false}], "iana": {"block": "5f00::/16", "name": "Segment Routing (SRv6) SIDs", "rfc": "RFC 9602", "ianaGlobal": false, "pythonGlobal": true}} },
  // 2001:1::3: IANA says globally reachable; CPython 3.13 says not global.
  { id: "iana-srp-anycast", input: {"text": "2001:1::3", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"props": [{"name": "is_private", "value": true}, {"name": "is_global", "value": false}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}, {"name": "is_site_local", "value": false}], "iana": {"block": "2001:1::3/128", "name": "DNS-SD Service Registration Protocol Anycast", "rfc": "RFC 9665", "ianaGlobal": true, "pythonGlobal": false}} },
  // 192.88.99.2: IANA says not globally reachable; CPython 3.13 says global.
  { id: "iana-6a44", input: {"text": "192.88.99.2", "call": "ip_address", "method": "none", "newPrefix": ""}, expect: {"iana": {"block": "192.88.99.2/32", "name": "6a44-relay anycast address", "rfc": "RFC 6751", "ianaGlobal": false, "pythonGlobal": true}} },
  // A network's is_private reads the lists directly: ::ffff:8.8.8.8/128 is private, its address is not.
  { id: "mapped-network-private", input: {"text": "::ffff:8.8.8.8/128", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"props": [{"name": "is_private", "value": true}, {"name": "is_global", "value": false}, {"name": "is_loopback", "value": false}, {"name": "is_link_local", "value": false}, {"name": "is_multicast", "value": false}, {"name": "is_reserved", "value": false}, {"name": "is_unspecified", "value": false}, {"name": "is_site_local", "value": false}]} },
  // An IPv6 /80's host mask happens to be an IPv4-mapped value, and prints as one.
  { id: "hostmask-80-mapped", input: {"text": "2001:db8::/80", "call": "ip_network", "method": "none", "newPrefix": ""}, expect: {"fields": [{"name": "str(x)", "value": "'2001:db8::/80'"}, {"name": "network_address", "value": "IPv6Address('2001:db8::')"}, {"name": "broadcast_address", "value": "IPv6Address('2001:db8::ffff:ffff:ffff')"}, {"name": "netmask", "value": "IPv6Address('ffff:ffff:ffff:ffff:ffff::')"}, {"name": "hostmask", "value": "IPv6Address('::ffff:255.255.255.255')"}, {"name": "prefixlen", "value": "80"}, {"name": "num_addresses", "value": "281474976710656"}, {"name": "with_netmask", "value": "'2001:db8::/ffff:ffff:ffff:ffff:ffff::'"}, {"name": "with_hostmask", "value": "'2001:db8::/::ffff:255.255.255.255'"}]} },
  // A text with a single quote is shown with double quotes, as repr() does.
  { id: "quote-in-text", input: {"text": "it's", "call": "ip_interface", "method": "none", "newPrefix": ""}, expect: {"python": "ipaddress.ip_interface(\"it's\")", "error": {"exception": "ValueError", "message": "\"it's\" does not appear to be an IPv4 or IPv6 interface"}} },
] as AcceptVector[]);

/** The reject cases, one per refusal code. */
export const IPADDRESS_REJECTS: readonly RejectVector[] = Object.freeze([
  // 65 characters: one more than the lab takes.
  { id: "too-long", input: { text: "1".repeat(65), call: "ip_address", method: "none", newPrefix: "" }, code: "too-long" },
  // A non-ASCII character (a full-width digit one).
  { id: "not-printable-ascii", input: { text: "192.0.2.\uff11", call: "ip_address", method: "none", newPrefix: "" }, code: "not-printable-ascii" },
  // A call the lab does not offer.
  { id: "bad-choice", input: { text: "192.0.2.1", call: "ip_range" as IpaddressInput["call"], method: "none", newPrefix: "" }, code: "bad-choice" },
  // new_prefix that is not an integer.
  { id: "bad-new-prefix", input: { text: "10.0.0.0/8", call: "ip_network", method: "subnets", newPrefix: "2.5" }, code: "bad-new-prefix" },
] as RejectVector[]);

/** Stable JSON: object keys sorted, so key order never decides a comparison. */
function canon(x: unknown): string {
  // A replacer that sorts every plain object's keys.
  return JSON.stringify(x, (_k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));
}

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of IPADDRESS_VECTORS) {
    // The model's answer.
    let got: IpaddressResult;
    // Run it.
    try {
      // Should not throw.
      got = compute(v.input);
    } catch (e) {
      // An unexpected refusal fails the case.
      failures.push(`${v.id}: refused with ${e instanceof IpaddressLabError ? e.code : String(e)}`);
      // Nothing to compare.
      continue;
    }
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof IpaddressResult];
      // A difference is a failure naming the case and the field.
      if (canon(have) !== canon(want)) failures.push(`${v.id}: ${k} is ${canon(have)}, expected ${canon(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of IPADDRESS_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof IpaddressLabError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = IPADDRESS_VECTORS.length + IPADDRESS_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
