## What it does

Paste a URL and the tool tells you where it actually points: loopback, a private or link-local range, a cloud metadata endpoint, CGNAT shared space, other reserved space, or the public internet. It decodes the IP-obfuscation tricks used to disguise an internal address, reads the IPv4 address that an IPv6 address can carry inside it, names the IANA special-purpose block an address falls in, flags dangerous URL schemes and embedded credentials, and shows an SSRF risk level. It never resolves DNS and never sends the request; it is a classifier, not a probe.

## What SSRF is, and why classification matters

Server-Side Request Forgery is an attack where a server is tricked into making a request to a URL the attacker chose, typically to reach something the attacker cannot reach directly: a service on `localhost`, a machine in an internal range, or a cloud provider's metadata endpoint. Defending against it comes down to deciding whether a URL is safe to fetch, and that decision is harder than it looks, because an internal address can be written in many disguised forms. This tool is built for that decision: it exists to help you understand a URL and design an allow-list, firmly on the defensive side of the line.

## The obfuscations it decodes

A naive filter that blocks `127.0.0.1` misses the many other ways to write the same address, and attackers exploit exactly that. The tool decodes them so the real destination is visible:

- **Decimal** integer form, where `2130706433` is `127.0.0.1`;
- **Octal** and **hex** octet forms;
- **Short-form** IPv4, where `127.1` expands to `127.0.0.1`;
- **Any spelling of an IPv6 address**: the tool parses the address into its eight 16-bit pieces before it classifies anything, so `[0:0:0:0:0:0:0:1]` and `[0000:0000:0000:0000:0000:0000:0000:0001]` are the loopback `::1`, exactly as RFC 4291 lists `0:0:0:0:0:0:0:1` and `::1` as two spellings of the loopback address, where "The use of "::" indicates one or more groups of 16 bits of zeros" ([RFC 4291, section 2.2](https://www.rfc-editor.org/rfc/rfc4291.txt)); and
- **IPv6 addresses that carry an IPv4 address**, described in the next section.

It then classifies the resolved literal against the reserved ranges (RFC 1918 private, RFC 3927 link-local, RFC 6598 CGNAT, the IANA special-purpose blocks, and the rest) and calls out the cloud metadata address, which is a prime SSRF target. The decoded address is shown in the canonical text of [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt): lowercase, leading zeros dropped, the longest run of zero pieces written as `::` (section 4), and, for the two prefixes that mark an embedded IPv4 address by themselves, mixed notation with a dotted tail, because "mixed notation is RECOMMENDED if the following condition is met" and the condition is a well-known prefix (section 5).

## IPv6 addresses that carry an IPv4 address

Four IPv6 layouts put an IPv4 address inside the 128 bits. A filter that only checks the IPv6 text lets the internal IPv4 target through, so the tool decodes the IPv4 address, rates the URL by it, and says which embedding it decoded. The result shows the embedding and the carried address next to the canonical form.

| Layout | Prefix | Where the IPv4 address sits | Source |
|---|---|---|---|
| IPv4-mapped | `::ffff:0:0/96` | the low 32 bits | [RFC 4291, section 2.5.5.2](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| NAT64 Well-Known Prefix | `64:ff9b::/96` | the low 32 bits (the /96 layout) | [RFC 6052, sections 2.1 and 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt) |
| NAT64 local-use prefix | `64:ff9b:1::/48` | depends on the prefix length the operator chose: the RFC 6052 /48, /56, /64 or /96 layout | [RFC 8215, sections 1 and 5](https://www.rfc-editor.org/rfc/rfc8215.txt) |
| 6to4 | `2002::/16` | bits 16 to 47 (the V4ADDR field) | [RFC 3056, section 2](https://www.rfc-editor.org/rfc/rfc3056.txt) |

**IPv4-mapped.** `[::ffff:127.0.0.1]` is the loopback address in IPv6 clothing. A browser does not show it that way: the IPv6 serializer of the WHATWG URL Standard writes every 16-bit piece as "the shortest possible lowercase hexadecimal number", so the same URL comes back as `[::ffff:7f00:1]` ([WHATWG URL Standard, IPv6 serializer](https://url.spec.whatwg.org/)). Both spellings now rate as loopback, high risk; before 2026-10-19 the hexadecimal one was rated public.

**NAT64 Well-Known Prefix.** `[64:ff9b::169.254.169.254]` and its hexadecimal twin `[64:ff9b::a9fe:a9fe]` carry the link-local metadata address, so they rate as cloud metadata. RFC 6052 says "The Well-Known Prefix MUST NOT be used to represent non-global IPv4 addresses" and tells translators to drop such packets ([RFC 6052, section 3.1](https://www.rfc-editor.org/rfc/rfc6052.txt)). The address still names that internal target, which is why a filter must reject it rather than trust every translator on the path. A Well-Known Prefix address that carries a public IPv4 address, such as `64:ff9b::8.8.8.8`, rates as public, because the registry marks `64:ff9b::/96` globally reachable.

**NAT64 local-use prefix.** RFC 8215 reserves `64:ff9b:1::/48` for translation inside one network and leaves the translation prefix length to the operator; nodes "must not make any assumptions regarding the syntax or properties of those addresses" ([RFC 8215, section 5](https://www.rfc-editor.org/rfc/rfc8215.txt)). The tool therefore reads the address with each RFC 6052 layout that fits inside a /48 (/96, /64, /56 and /48), keeps the reading that points furthest inside (cloud metadata, then loopback, link-local, private), and reports the /96 reading when none does. Every layout skips bits 64 to 71, and RFC 6052 says "These bits MUST be set to zero" ([RFC 6052, section 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt)); when they are not zero, no IPv4 address is decoded. Because the IANA registry marks `64:ff9b:1::/48` not globally reachable, an address in it is never rated below reserved.

**6to4.** RFC 3056 builds a site prefix from the 16-bit `2002` prefix and the site's 32-bit IPv4 address, written `2002:V4ADDR::/48` ([RFC 3056, section 2](https://www.rfc-editor.org/rfc/rfc3056.txt)). `[2002:7f00:1::]` therefore carries `127.0.0.1` and rates as loopback; `[2002:a9fe:a9fe::1]` carries the metadata address.

## Reserved blocks named from the IANA registries

The tool also names the blocks below from the IANA IPv4 and IPv6 Special-Purpose Address Space registries ([IPv4 CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) and [IPv6 CSV](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv), both last updated 2025-10-09). A block whose Globally Reachable value is False is rated **reserved**, which on this tool's scale is high risk, the same rating the IPv4 documentation ranges already had. The result shows the block, the registry's name for it, and the RFC.

| Block | IANA name | RFC | Globally Reachable | Rating |
|---|---|---|---|---|
| `2001:db8::/32` | Documentation | RFC 3849 | False | reserved, high |
| `3fff::/20` | Documentation | RFC 9637 | False | reserved, high |
| `100::/64` | Discard-Only Address Block | RFC 6666 | False | reserved, high |
| `192.0.0.0/24` | IETF Protocol Assignments | RFC 6890, Section 2.1 | False | reserved, high |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | False | reserved, high |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | False | reserved, high |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | True | public, low |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | public, low |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | False | reserved, high |

For the two documentation prefixes, RFC 3849 states the intent plainly: "This assignment implies that IPv6 network operators should add this address prefix to the list of non-routeable IPv6 address space" ([RFC 3849, section 3](https://www.rfc-editor.org/rfc/rfc3849.txt)); RFC 9637 adds `3fff::/20` as a second, larger documentation prefix ([RFC 9637](https://www.rfc-editor.org/rfc/rfc9637.txt)). `100::/64` exists for remote triggered black hole filtering: "IANA has recorded the allocation of the IPv6 address prefix 0100::/64 as a Discard-Only Prefix" ([RFC 6666, section 4](https://www.rfc-editor.org/rfc/rfc6666.txt)). Inside `192.0.0.0/24` the registry's footnote decides: the /24 is "Not useable unless by virtue of a more specific reservation", so the most specific row wins. That is why `192.0.0.9` and `192.0.0.10`, two anycast services the registry marks globally reachable, rate as public, while `192.0.0.170` and `192.0.0.171`, the addresses RFC 7050 names for discovering a NAT64 prefix ([RFC 7050, section 2.2](https://www.rfc-editor.org/rfc/rfc7050.txt)), rate as reserved.

## Worked examples

These ten addresses were rated public, low risk, until 2026-10-19. Each now rates as shown; the tool's golden vectors pin every one of them together with a second spelling of the same address.

| Input | Rated | Why |
|---|---|---|
| `http://[::ffff:7f00:1]/` | loopback, high | IPv4-mapped, carries `127.0.0.1` |
| `http://[0:0:0:0:0:0:0:1]/` | loopback, high | an expanded spelling of `::1` |
| `http://[64:ff9b::7f00:1]/` | loopback, high | NAT64 Well-Known Prefix, carries `127.0.0.1` |
| `http://[64:ff9b::169.254.169.254]/` | cloud metadata, high | NAT64 Well-Known Prefix, carries `169.254.169.254` |
| `http://[2002:7f00:1::]/` | loopback, high | 6to4, carries `127.0.0.1` |
| `http://[2001:db8::1]/` | reserved, high | Documentation, `2001:db8::/32` |
| `http://[3fff::1]/` | reserved, high | Documentation, `3fff::/20` |
| `http://[100::1]/` | reserved, high | Discard-Only Address Block, `100::/64` |
| `http://192.0.0.1/` | reserved, high | IPv4 Service Continuity Prefix, `192.0.0.0/29` |
| `http://192.0.0.170/` | reserved, high | NAT64/DNS64 Discovery |

## Schemes, credentials, and the honest unknown

Beyond the address, the tool flags dangerous URL schemes (the ones beyond `http` and `https` that SSRF payloads often abuse) and embedded credentials in the `user:pass@host` form. One thing it is careful to be honest about: a bare hostname that is not a known special name is reported as resolving at runtime, not guessed at, because the tool never performs DNS resolution. That is the truthful answer, and it is also why the tool is safe: it classifies what the URL says rather than reaching out.

## Using it

Paste a URL and read its classification, the decoded destination, the embedded IPv4 address and the special-purpose block when there is one, any flagged schemes or credentials, and the SSRF risk level. Everything is computed locally; no request is ever made.

## Sources

- [IANA, IPv4 Special-Purpose Address Space, CSV, registry last updated 2025-10-09](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (read 2026-10-19): the 192.0.0.0/24 rows and footnote [2]
- [IANA, IPv6 Special-Purpose Address Space, CSV, registry last updated 2025-10-09](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (read 2026-10-19): ::1/128, ::ffff:0:0/96, 64:ff9b::/96, 64:ff9b:1::/48, 100::/64, 2001:db8::/32, 2002::/16, 3fff::/20
- [RFC 4291, IP Version 6 Addressing Architecture, February 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (read 2026-10-19): section 2.2 (text forms), section 2.5.5.2 (IPv4-mapped)
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, August 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (read 2026-10-19): sections 4 and 5
- [RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, October 2010](https://www.rfc-editor.org/rfc/rfc6052.txt) (read 2026-10-19): sections 2.1 to 2.4 and 3.1
- [RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, August 2017](https://www.rfc-editor.org/rfc/rfc8215.txt) (read 2026-10-19): sections 1, 4.1 and 5
- [RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, February 2001](https://www.rfc-editor.org/rfc/rfc3056.txt) (read 2026-10-19): section 2
- [RFC 3849, IPv6 Address Prefix Reserved for Documentation, July 2004](https://www.rfc-editor.org/rfc/rfc3849.txt) (read 2026-10-19): sections 2 and 3
- [RFC 9637, Expanding the IPv6 Documentation Space, August 2024](https://www.rfc-editor.org/rfc/rfc9637.txt) (read 2026-10-19): abstract and IANA considerations
- [RFC 6666, A Discard Prefix for IPv6, August 2012](https://www.rfc-editor.org/rfc/rfc6666.txt) (read 2026-10-19): sections 2 and 4
- [RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, November 2013](https://www.rfc-editor.org/rfc/rfc7050.txt) (read 2026-10-19): section 2.2
- [WHATWG, URL Standard, Living Standard last updated 19 October 2026](https://url.spec.whatwg.org/) (read 2026-10-19): the IPv6 serializer
