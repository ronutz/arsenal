## What it does

Parse an IPv6 address or prefix and see it from every angle: its canonical short form and its fully expanded form, what kind of address it is, the prefix math for a block, a hardware MAC address if one is embedded in the interface identifier, the fields of a Teredo address, and the reverse-DNS name that points back to it. Everything is computed in your browser.

## Canonical and expanded forms

An IPv6 address is 128 bits, written as eight groups of four hexadecimal digits separated by colons. The same address can be written many ways, so RFC 5952 defines one canonical form: lowercase, with the leading zeros in each group removed and the single longest run of all-zero groups collapsed to `::`. The tool shows that canonical form and, alongside it, the fully expanded form with every group written out in full, which is the version you want when you need to see all 128 bits or line addresses up by column. For example, `2001:0db8:0000:0000:0000:0000:0000:0001` expands from, and canonicalizes to, `2001:db8::1`. An IPv4-mapped address keeps the mixed notation RFC 5952 section 5 recommends (`::ffff:192.0.2.128`), while the expanded form is always eight hex groups.

## Classification and prefix math

Not every address is a normal public one. The tool classifies special-use ranges, each checked against the IANA IPv6 Special-Purpose Address Registry:

| Block | Shown as | Defined by |
| --- | --- | --- |
| `::1/128` | Loopback | RFC 4291 |
| `::/128` | Unspecified | RFC 4291 |
| `::ffff:0:0/96` | IPv4-mapped | RFC 4291 |
| `64:ff9b::/96` | IPv4/IPv6 translation | RFC 6052 |
| `64:ff9b:1::/48` | IPv4/IPv6 translation (local use) | RFC 8215 |
| `100::/64` | Discard-only | RFC 6666 |
| `2001::/32` | Teredo | RFC 4380 |
| `2001:db8::/32` | Documentation | RFC 3849 |
| `2002::/16` | 6to4 | RFC 3056 |
| `3fff::/20` | Documentation | RFC 9637 |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 |
| `fc00::/7` | Unique local | RFC 4193 |
| `fe80::/10` | Link-local unicast | RFC 4291 |
| `ff00::/8` | Multicast | RFC 4291 |

Anything else in `2000::/3` is reported as global unicast. The registry has further rows (for example `2001:2::/48` for benchmarking and `2001:20::/28` for ORCHIDv2) that this table does not yet list, so an address in one of them shows as global unicast.

When you give it a prefix, it computes the block's network address, its first and last address, and how many addresses it spans, the same arithmetic the CIDR tool does for IPv4 but on a 128-bit field.

## Multicast: scope, flags and source-specific multicast

A multicast address starts with `ff`, then a 4-bit flag field and a 4-bit scope (RFC 4291 section 2.7). The tool names the scope from the IANA scope registry: interface-local (1), link-local (2), realm-local (3, named by RFC 7346), admin-local (4), site-local (5), organization-local (8) and global (E). Values 0 and F are reserved and are shown as `reserved (scope 0)` and `reserved (scope F)`; values 6, 7 and 9 to D are unassigned and are shown as, for example, `unassigned (scope 6)`. So `ff0f::1` no longer reads like a valid scope.

The flag field is read bit by bit as X, R, P and T (RFC 7371 section 4): T=1 marks a transient address, P=1 an address based on a unicast prefix (RFC 3306), R=1 an address with an embedded rendezvous point (RFC 3956). `ff02::1` shows `0000 (X=0, R=0, P=0, T=0)`.

When the flags are `0011` and the next 16 bits are zero, the address is in `ff3x::/32`, which RFC 4607 section 1 reserves for source-specific multicast (SSM): "all SSM addresses must have P=1, T=1, and plen=0". The tool then labels it Source-specific multicast and says which part of the group-ID space it is in, using RFC 4607 and the IANA registry: `ff3x::0:0` to `ff3x::3fff:ffff` are invalid, `ff3x::4000:0` to `ff3x::7fff:ffff` are reserved for IANA allocation, `ff3x::8000:0` to `ff3x::ffff:ffff` are for dynamic assignment, and an address with a non-zero network-prefix field (outside `ff3x::/96`) is reserved for future SSM use and currently invalid. For example, `ff3e::8000:1` is global-scope SSM in the dynamic range.

## Teredo

A Teredo address packs a tunnel endpoint into the 128 bits (RFC 4380 section 4): the 32-bit prefix `2001::/32`, the Teredo server's IPv4 address in clear (bits 32 to 63), 16 flag bits, then the client's external UDP port and external IPv4 address, both obfuscated: "Each bit in the address and port number is reversed", which is an exclusive OR with `0xFFFF` for the port and `0xFFFFFFFF` for the address. The tool undoes the XOR and shows the server, the client address, the client port and the flags. It reads the flags with the layout RFC 5991 section 3.1 gives (`|C|z|Random1|U|G|Random2|`), naming the cone bit C and the U and G bits; the twelve random bits are left as they are.

Worked example with documentation addresses: `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` decodes to server `192.0.2.45` (`c000:022d`), flags `0x3c5a` (C=0, U=0, G=0), client port `40000` (`63bf` XOR `ffff` = `9c40`) and client `203.0.113.20` (`34ff:8eeb` XOR `ffff:ffff` = `cb00:7114`). Python's `ipaddress` module returns the same server and client from its `teredo` property. The decoder runs for a single address (no prefix length, or `/128`); for a block such as `2001::/32` it classifies the range and does the prefix math only.

## EUI-64 and reverse DNS

Two extras fall out of the address. If the interface identifier was built from a network card's 48-bit MAC using the modified EUI-64 method (RFC 4291, Appendix A), the tool recovers that MAC, which is why privacy extensions exist to avoid leaking it. And it builds the `ip6.arpa` reverse-DNS name: the address's nibbles in reverse order, dot-separated, ending in `.ip6.arpa`, which is what a PTR lookup for the address uses.

## Using it

Paste an IPv6 address to see its canonical and expanded forms, its classification, any multicast flags and scope, any Teredo fields, any embedded MAC, and its reverse-DNS name, or paste a prefix to add the block math. The parse is deterministic and reads only the address you give it.

## Sources

- [IANA IPv6 Special-Purpose Address Registry, CSV (registry last updated 2025-10-09)](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (read 2026-10-19)
- [IANA IPv6 Multicast Address Space Registry: scopes and SSM group IDs (last updated 2026-04-07)](https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.txt) (read 2026-10-19)
- [RFC 4291: IP Version 6 Addressing Architecture, section 2.7 and Appendix A](https://www.rfc-editor.org/rfc/rfc4291) (read 2026-10-19)
- [RFC 5952: A Recommendation for IPv6 Address Text Representation](https://www.rfc-editor.org/rfc/rfc5952) (read 2026-10-19)
- [RFC 7346: IPv6 Multicast Address Scopes](https://www.rfc-editor.org/rfc/rfc7346) (read 2026-10-19)
- [RFC 7371: Updates to the IPv6 Multicast Addressing Architecture, section 4](https://www.rfc-editor.org/rfc/rfc7371) (read 2026-10-19)
- [RFC 3306: Unicast-Prefix-based IPv6 Multicast Addresses, section 6](https://www.rfc-editor.org/rfc/rfc3306) (read 2026-10-19)
- [RFC 3956: Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address](https://www.rfc-editor.org/rfc/rfc3956) (read 2026-10-19)
- [RFC 4607: Source-Specific Multicast for IP, section 1](https://www.rfc-editor.org/rfc/rfc4607) (read 2026-10-19)
- [RFC 4380: Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), section 4](https://www.rfc-editor.org/rfc/rfc4380) (read 2026-10-19)
- [RFC 5991: Teredo Security Updates, section 3.1](https://www.rfc-editor.org/rfc/rfc5991) (read 2026-10-19)
- [RFC 9637: Expanding the IPv6 Documentation Space](https://www.rfc-editor.org/rfc/rfc9637) (read 2026-10-19)
- [RFC 9602: Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc9602) (read 2026-10-19)
- [RFC 8215: Local-Use IPv4/IPv6 Translation Prefix](https://www.rfc-editor.org/rfc/rfc8215) (read 2026-10-19)
- [RFC 3849: IPv6 Address Prefix Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc3849) (read 2026-10-19)
