## What it does

Paste a URL and the tool tells you where it actually points: loopback, a private or link-local range, a cloud metadata endpoint, CGNAT shared space, other reserved space, or the public internet. It decodes the IP-obfuscation tricks used to disguise an internal address, reads the IPv4 address that an IPv6 address can carry inside it (six layouts, Teredo included), names the IANA special-purpose block an address falls in for every row of both registries, flags the special-purpose anycast service addresses, flags dangerous URL schemes and embedded credentials, and shows an SSRF risk level. It never resolves DNS and never sends the request; it is a classifier, not a probe.

## What SSRF is, and why classification matters

Server-Side Request Forgery is an attack where a server is tricked into making a request to a URL the attacker chose, typically to reach something the attacker cannot reach directly: a service on `localhost`, a machine in an internal range, or a cloud provider's metadata endpoint. Defending against it comes down to deciding whether a URL is safe to fetch, and that decision is harder than it looks, because an internal address can be written in many disguised forms. This tool is built for that decision: it exists to help you understand a URL and design an allow-list, firmly on the defensive side of the line.

## The obfuscations it decodes

A naive filter that blocks `127.0.0.1` misses the many other ways to write the same address, and attackers exploit exactly that. The tool decodes them so the real destination is visible:

- **Decimal** integer form, where `2130706433` is `127.0.0.1` and `2852039166` is the metadata address `169.254.169.254` (the Example button loads that one);
- **Octal** and **hex** octet forms;
- **Short-form** IPv4, where `127.1` expands to `127.0.0.1`;
- **Any spelling of an IPv6 address**: the tool parses the address into its eight 16-bit pieces before it classifies anything, so `[0:0:0:0:0:0:0:1]` and `[0000:0000:0000:0000:0000:0000:0000:0001]` are the loopback `::1`, exactly as RFC 4291 lists `0:0:0:0:0:0:0:1` and `::1` as two spellings of the loopback address, where "The use of "::" indicates one or more groups of 16 bits of zeros" ([RFC 4291, section 2.2](https://www.rfc-editor.org/rfc/rfc4291.txt)); and
- **IPv6 addresses that carry an IPv4 address**, described in the next section.

It then classifies the resolved literal against every row of the IANA special-purpose registries and calls out the cloud metadata addresses, which are prime SSRF targets. The decoded address is shown in the canonical text of [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt): lowercase, leading zeros dropped, the longest run of zero pieces written as `::` (section 4), and, for the prefixes that mark an embedded IPv4 address by themselves, mixed notation with a dotted tail, because "mixed notation is RECOMMENDED if the following condition is met" and the condition is a well-known prefix such as those RFC 4291 defines (section 5).

## IPv6 addresses that carry an IPv4 address

Six IPv6 layouts put an IPv4 address inside the 128 bits. A filter that only checks the IPv6 text lets the internal IPv4 target through, so the tool decodes the IPv4 address, rates the URL by it, says which embedding it decoded, and shows the registry row of the carried address. A public address carried in an embedding rates public, with the embedding named.

| Layout | Prefix | Where the IPv4 address sits | Source |
|---|---|---|---|
| IPv4-mapped | `::ffff:0:0/96` | the low 32 bits | [RFC 4291, section 2.5.5.2](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| IPv4-compatible (deprecated) | `::/96`, except `::` and `::1` | the low 32 bits | [RFC 4291, section 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| NAT64 Well-Known Prefix | `64:ff9b::/96` | the low 32 bits (the /96 layout) | [RFC 6052, sections 2.1 and 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt) |
| NAT64 local-use prefix | `64:ff9b:1::/48` | depends on the prefix length the operator chose: the RFC 6052 /48, /56, /64 or /96 layout | [RFC 8215, sections 1 and 5](https://www.rfc-editor.org/rfc/rfc8215.txt) |
| 6to4 | `2002::/16` | bits 16 to 47 (the V4ADDR field) | [RFC 3056, section 2](https://www.rfc-editor.org/rfc/rfc3056.txt) |
| Teredo | `2001::/32` | two addresses: the server in bits 32 to 63, the client inverted in bits 96 to 127 | [RFC 4380, section 4](https://www.rfc-editor.org/rfc/rfc4380.txt) |

**IPv4-mapped.** `[::ffff:127.0.0.1]` is the loopback address in IPv6 clothing. A browser does not show it that way: the IPv6 serializer of the WHATWG URL Standard writes every 16-bit piece as "the shortest possible lowercase hexadecimal number", so the same URL comes back as `[::ffff:7f00:1]` ([WHATWG URL Standard, IPv6 serializer](https://url.spec.whatwg.org/)). Both spellings rate as loopback, high risk.

**IPv4-compatible.** RFC 4291 defines `::a.b.c.d` with 96 zero bits in front of the IPv4 address, and then retires it: the format "is now deprecated because the current IPv6 transition mechanisms no longer use these addresses", and the IPv4 address it carries "must be a globally-unique IPv4 unicast address" ([RFC 4291, section 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt)). The registry has no row for it. A stack that still accepts the format reaches the carried address, so `[::127.0.0.1]` and its hexadecimal twin `[::7f00:1]` rate as loopback, `[::a9fe:a9fe]` as cloud metadata, and `[::8.8.8.8]` as public; the result says the format is deprecated in every case. `::` and `::1` are their own registry rows and are never read as IPv4-compatible.

**NAT64 Well-Known Prefix.** `[64:ff9b::169.254.169.254]` and its hexadecimal twin `[64:ff9b::a9fe:a9fe]` carry the link-local metadata address, so they rate as cloud metadata. RFC 6052 says "The Well-Known Prefix MUST NOT be used to represent non-global IPv4 addresses" and tells translators to drop such packets ([RFC 6052, section 3.1](https://www.rfc-editor.org/rfc/rfc6052.txt)). The address still names that internal target, which is why a filter must reject it rather than trust every translator on the path. A Well-Known Prefix address that carries a public IPv4 address, such as `64:ff9b::8.8.8.8`, rates as public, because the registry marks `64:ff9b::/96` globally reachable.

**NAT64 local-use prefix.** RFC 8215 reserves `64:ff9b:1::/48` for translation inside one network and leaves the translation prefix length to the operator; nodes "must not make any assumptions regarding the syntax or properties of those addresses" ([RFC 8215, section 5](https://www.rfc-editor.org/rfc/rfc8215.txt)). The tool therefore reads the address with each RFC 6052 layout that fits inside a /48 (/96, /64, /56 and /48), keeps the reading that points furthest inside (cloud metadata, then loopback, link-local, private), and reports the /96 reading when none does. Every layout skips bits 64 to 71, and RFC 6052 says "These bits MUST be set to zero" ([RFC 6052, section 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt)); when they are not zero, no IPv4 address is decoded. Because the IANA registry marks `64:ff9b:1::/48` not globally reachable, an address in it is never rated below reserved.

**6to4.** RFC 3056 builds a site prefix from the 16-bit `2002` prefix and the site's 32-bit IPv4 address, written `2002:V4ADDR::/48` ([RFC 3056, section 2](https://www.rfc-editor.org/rfc/rfc3056.txt)). `[2002:7f00:1::]` therefore carries `127.0.0.1` and rates as loopback; `[2002:a9fe:a9fe::1]` carries the metadata address.

**Teredo.** A Teredo address has five parts: "Prefix", "Server IPv4", "Flags", "Port" and "Client IPv4" ([RFC 4380, section 4](https://www.rfc-editor.org/rfc/rfc4380.txt)). The prefix is `2001:0000:/32` (section 2.6). The server address sits in bits 32 to 63 as it is. The client's mapped port and address are obfuscated: "Each bit in the address and port number is reversed; this can be done by an exclusive OR of the 16-bit port number with the hexadecimal value 0xFFFF, and an exclusive OR of the 32-bit address with the hexadecimal value 0xFFFFFFFF" (section 4). RFC 5991 later redefined the Flags field with random bits, but left the server and client fields as they were ([RFC 5991, section 3.1](https://www.rfc-editor.org/rfc/rfc5991.txt)). The tool undoes the XOR, rates both IPv4 addresses, lets the more internal one decide (the server wins a tie), and shows the server, the client, the client port and the flags. `[2001:0:808:808:0:feae:80ff:fffe]` has the server `8.8.8.8` and the client `127.0.0.1` (`0x80fffffe` XOR `0xffffffff`), so it rates as loopback; `[2001:0:808:808:0:feae:fefd:fcfb]` carries the client `1.2.3.4` on port 337, the same pair RFC 4380 uses for its own obfuscation example (section 5.1.1), and rates as public. RFC 4380 adds that "the identifiers used in global addresses MUST include a global scope unicast IPv4 address" (section 4), so a Teredo address that carries an internal one names a target no valid Teredo address should carry.

**What it does not decode: 6a44.** RFC 6751 builds a 6a44 address from "the 6a44-network IPv6 prefix C (a /48 the ISP has assigned to its 6a44 relays)", followed by the customer-site IPv4 address, a port and the client's local IPv4 address ([RFC 6751, section 5](https://www.rfc-editor.org/rfc/rfc6751.txt)). Because the /48 is chosen by each ISP, no fixed prefix marks a 6a44 address, and the tool cannot tell one apart from any other address without that ISP's configuration. It does name the IPv4 side: `192.88.99.2` is the 6a44-relay anycast address (section 8).

## Every special-purpose block, named from the IANA registries

The tool carries every row of the IANA IPv4 and IPv6 Special-Purpose Address Space registries ([IPv4 CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) and [IPv6 CSV](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv), both last updated 2025-10-09, read 2026-10-19): 25 IPv4 rows and 25 IPv6 rows. An address is matched against the most specific row that covers it, and the result shows the block, the registry's name and the RFC, verbatim. The registry defines Globally Reachable as "whether an IP datagram whose destination address is drawn from the allocated special-purpose address block is forwardable beyond a specified administrative domain", and the rating follows it:

- **Globally Reachable False** rates **reserved** (high risk on this tool's scale), unless the row has a more telling category: loopback, private, link-local or carrier-grade NAT.
- **Globally Reachable True** rates **public** (low risk), and the block is still named, so nothing in the registry falls through to an anonymous "public".
- **No value** happens in two ways. For the embedding rows (6to4, Teredo) the registry says N/A and points to the RFC, so the carried IPv4 address decides. For the two deprecated rows the registry holds no booleans at all, and the tool rates them reserved: RFC 7526 says "The prefix 192.88.99.0/24 MUST NOT be reassigned for other use except by a future IETF Standards Action" and records that "The Boolean values for the address block 192.88.99.0/24 have been removed" ([RFC 7526, sections 4 and 7](https://www.rfc-editor.org/rfc/rfc7526.txt)), and `2001:10::/28` sits inside `2001::/23`, which is not globally reachable "Unless allowed by a more specific allocation" (registry footnote [1]).

The multicast blocks `224.0.0.0/4` and `ff00::/8` are not special-purpose rows (they have registries of their own) and still rate reserved without a named row.

### IPv4

| Block | IANA name | RFC | Globally Reachable | Rating |
|---|---|---|---|---|
| `0.0.0.0/8` | "This network" | RFC 791, Section 3.2 | False | reserved, high |
| `0.0.0.0/32` | "This host on this network" | RFC 1122, Section 3.2.1.3 | False | reserved, high |
| `10.0.0.0/8` | Private-Use | RFC 1918 | False | private, high |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | False | CGNAT, medium |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | False | loopback, high |
| `169.254.0.0/16` | Link Local | RFC 3927 | False | link-local, high (`169.254.169.254`: cloud metadata) |
| `172.16.0.0/12` | Private-Use | RFC 1918 | False | private, high |
| `192.0.0.0/24` | IETF Protocol Assignments | RFC 6890, Section 2.1 | False | reserved, high |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | False | reserved, high |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | False | reserved, high |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | True | public, low, anycast service |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | public, low, anycast service |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | False | reserved, high |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | False | reserved, high |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | True | public, low |
| `192.52.193.0/24` | AMT | RFC 7450 | True | public, low |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast) | RFC 7526 | none | reserved, high |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | False | reserved, high, anycast service |
| `192.168.0.0/16` | Private-Use | RFC 1918 | False | private, high |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | True | public, low |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | False | reserved, high |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | False | reserved, high |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | False | reserved, high |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | False | reserved, high |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | False | reserved, high |

Inside `192.0.0.0/24` the registry's footnote decides: the /24 is "Not useable unless by virtue of a more specific reservation", so the most specific row wins. `100.100.100.200`, a cloud metadata address, sits in Shared Address Space and rates as cloud metadata with that row named.

### IPv6

| Block | IANA name | RFC | Globally Reachable | Rating |
|---|---|---|---|---|
| `::1/128` | Loopback Address | RFC 4291 | False | loopback, high |
| `::/128` | Unspecified Address | RFC 4291 | False | reserved, high |
| `::ffff:0:0/96` | IPv4-mapped Address | RFC 4291 | False | by the carried IPv4 address |
| `64:ff9b::/96` | IPv4-IPv6 Translat. | RFC 6052 | True | by the carried IPv4 address |
| `64:ff9b:1::/48` | IPv4-IPv6 Translat. | RFC 8215 | False | by the carried IPv4 address, never below reserved |
| `100::/64` | Discard-Only Address Block | RFC 6666 | False | reserved, high |
| `100:0:0:1::/64` | Dummy IPv6 Prefix | RFC 9780 | False | reserved, high |
| `2001::/23` | IETF Protocol Assignments | RFC 2928 | False | reserved, high |
| `2001::/32` | TEREDO | RFC 4380; RFC 8190 | N/A | by the more internal of the two carried IPv4 addresses |
| `2001:1::1/128` | Port Control Protocol Anycast | RFC 7723 | True | public, low, anycast service |
| `2001:1::2/128` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | public, low, anycast service |
| `2001:1::3/128` | DNS-SD Service Registration Protocol Anycast | RFC 9665 | True | public, low, anycast service |
| `2001:2::/48` | Benchmarking | RFC 5180; RFC Errata 1752 | False | reserved, high |
| `2001:3::/32` | AMT | RFC 7450 | True | public, low |
| `2001:4:112::/48` | AS112-v6 | RFC 7535 | True | public, low |
| `2001:10::/28` | Deprecated (previously ORCHID) | RFC 4843 | none | reserved, high |
| `2001:20::/28` | ORCHIDv2 | RFC 7343 | True | public, low |
| `2001:30::/28` | Drone Remote ID Protocol Entity Tags (DETs) Prefix | RFC 9374 | True | public, low |
| `2001:db8::/32` | Documentation | RFC 3849 | False | reserved, high |
| `2002::/16` | 6to4 | RFC 3056 | N/A | by the carried IPv4 address |
| `2620:4f:8000::/48` | Direct Delegation AS112 Service | RFC 7534 | True | public, low |
| `3fff::/20` | Documentation | RFC 9637 | False | reserved, high |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 | False | reserved, high |
| `fc00::/7` | Unique-Local | RFC 4193; RFC 8190 | False | private, high (`fd00:ec2::254`: cloud metadata) |
| `fe80::/10` | Link-Local Unicast | RFC 4291 | False | link-local, high |

A few rows deserve a word. The benchmarking prefix is `2001:2::/48` because erratum 1752 corrected RFC 5180, which had printed `2001:0200::/48`; the erratum reads "The IANA has assigned 2001:0002::/48 for IPv6 benchmarking" ([RFC Errata 1752](https://www.rfc-editor.org/errata/eid1752)). `5f00::/16` holds Segment Routing over IPv6 segment identifiers, and the SRv6 specifications "are intended to be applicable to a contained SR Domain or between collaborating SR Domains" ([RFC 9602, section 5](https://www.rfc-editor.org/rfc/rfc9602.txt)). `100:0:0:1::/64` is the dummy IPv6 prefix that RFC 9780 recommends in place of "an IPv4 loopback address mapped to IPv6" ([RFC 9780, abstract](https://www.rfc-editor.org/rfc/rfc9780.txt)). ORCHIDv2 and DET addresses are identifiers rather than locators: ORCHIDs "are considered non-routable addresses from the IPv6-layer perspective" ([RFC 7343, abstract](https://www.rfc-editor.org/rfc/rfc7343.txt)) and HHITs "are valid, though non-routable, IPv6 addresses" ([RFC 9374, section 1](https://www.rfc-editor.org/rfc/rfc9374.txt)). The registry nevertheless marks both blocks globally reachable, so the tool follows the registry and rates them public, with the block named. For the documentation prefixes, RFC 3849 states the intent plainly: "This assignment implies that IPv6 network operators should add this address prefix to the list of non-routeable IPv6 address space" ([RFC 3849, section 3](https://www.rfc-editor.org/rfc/rfc3849.txt)).

## The anycast service addresses, and why they rate public

Five rows are anycast service addresses that the registry marks globally reachable: `192.0.0.9` and `2001:1::1` for the Port Control Protocol, `192.0.0.10` and `2001:1::2` for TURN, and `2001:1::3` for the DNS-SD Service Registration Protocol. A sixth, `192.88.99.2`, is the 6a44-relay anycast address, which the registry marks not globally reachable. The tool keeps the rating the registry implies (public for the first five, reserved for the sixth), but it names the block and adds a flag that says it is a special-purpose anycast service address, so the reader sees it.

Why flag them at all? An anycast address is not one machine: "A packet sent to an anycast address is delivered to the 'topologically nearest' network interface with the anycast address" ([RFC 8155, section 6](https://www.rfc-editor.org/rfc/rfc8155.txt)). For PCP that is by design a nearby middlebox: the addresses let clients "transmit signaling messages to their closest PCP-aware on-path NAT, firewall, or other middlebox" ([RFC 7723, abstract](https://www.rfc-editor.org/rfc/rfc7723.txt)). `2001:1::3` is "a fixed anycast address that can be commonly used as a destination for SRP Updates when no SRP registrar is explicitly configured" ([RFC 9665, section 10.5](https://www.rfc-editor.org/rfc/rfc9665.txt)). A server that fetches one of these URLs may therefore talk to equipment on its own network path, which a public rating alone would hide. The rating stays public because that is what the registry says; the flag is there so an allow-list names these addresses explicitly instead of letting them through as ordinary internet hosts. The flag also follows an embedding: `[64:ff9b::192.0.0.9]` rates public and is flagged, because the address it carries is the PCP anycast address.

## Worked examples

The tool's golden vectors pin every example below, together with one vector per registry row.

| Input | Rated | Why |
|---|---|---|
| `http://2852039166/latest/meta-data/` | cloud metadata, high | decimal form of `169.254.169.254` (the Example button) |
| `http://[::ffff:7f00:1]/` | loopback, high | IPv4-mapped, carries `127.0.0.1` |
| `http://[0:0:0:0:0:0:0:1]/` | loopback, high | an expanded spelling of `::1` |
| `http://[::7f00:1]/` | loopback, high | IPv4-compatible (deprecated), carries `127.0.0.1` |
| `http://[64:ff9b::169.254.169.254]/` | cloud metadata, high | NAT64 Well-Known Prefix, carries `169.254.169.254` |
| `http://[2002:7f00:1::]/` | loopback, high | 6to4, carries `127.0.0.1` |
| `http://[2001:0:808:808:0:feae:80ff:fffe]/` | loopback, high | Teredo, the client carries `127.0.0.1` |
| `http://[2001:0:a9fe:a9fe:8000:feae:fefd:fcfb]/` | cloud metadata, high | Teredo, the server is `169.254.169.254` |
| `http://[2001:2::1]/` | reserved, high | Benchmarking, `2001:2::/48` |
| `http://[5f00::1]/` | reserved, high | Segment Routing (SRv6) SIDs, `5f00::/16` |
| `http://192.88.99.1/` | reserved, high | Deprecated (6to4 Relay Anycast), no Globally Reachable value |
| `http://192.0.0.10/` | public, low, flagged | TURN anycast service address |
| `http://[2001:1::3]/` | public, low, flagged | DNS-SD Service Registration Protocol anycast address |
| `http://192.31.196.1/` | public, low, named | AS112-v4 |

## Schemes, credentials, and the honest unknown

Beyond the address, the tool flags dangerous URL schemes (the ones beyond `http` and `https` that SSRF payloads often abuse) and embedded credentials in the `user:pass@host` form. One thing it is careful to be honest about: a bare hostname that is not a known special name is reported as resolving at runtime, not guessed at, because the tool never performs DNS resolution. That is the truthful answer, and it is also why the tool is safe: it classifies what the URL says rather than reaching out.

## Using it

Paste a URL, or press Example, and read its classification, the decoded destination, the embedded IPv4 address with its own registry row, both Teredo addresses when there are two, the special-purpose block, any anycast or deprecation flag, any flagged schemes or credentials, and the SSRF risk level. Everything is computed locally; no request is ever made.

## API

The same engine answers the `/api/v1/ssrf-url-classifier` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** The URL or host as text: `?input=` on GET, or a POST body.
- **Response.** The URL parts (`scheme`, `host`, `port`, `path`, `hasUserinfo`, `schemeFlag`), the address (`isIp`, `ipVersion`, `canonicalIp`, `obfuscated`, `obfuscationForm`), the rating (`category`, `risk`, `reasons` in English), and the decoding: `embedding` (`ipv4-mapped`, `ipv4-compatible`, `nat64-wkp`, `nat64-local`, `6to4`, `teredo`, or `null`), `embeddedIpv4` (the address that decides), `embeddingLayout`, `specialBlock` and `embeddedSpecialBlock` (each `{prefix, name, rfc, globallyReachable}` or `null`), `teredo` (`serverIpv4`, `clientIpv4`, `clientPort`, `flags`, or `null`) and `anycastService`. For `http://[2001:0:808:808:0:feae:80ff:fffe]/` the API answers `loopback` / `high`, with `teredo` server `8.8.8.8`, client `127.0.0.1`, port 337 and flags 0, and `embeddedSpecialBlock` `127.0.0.0/8` "Loopback".
- **Errors.** Only an empty input is refused: HTTP 400. A host the tool cannot place is not an error; it rates `unresolved` or `internal-name`.

`embedding`, `embeddedIpv4`, `embeddingLayout` and `specialBlock` were added on 2026-10-19; later that day `embedding` gained `ipv4-compatible` and `teredo`, `specialBlock` came to cover every registry row, `embeddedSpecialBlock`, `teredo` and `anycastService` were added, and `canonicalIp` for an IPv4-compatible address moved to mixed notation (`::127.0.0.1`).

## Sources

All read 2026-10-19.

- [IANA, IPv4 Special-Purpose Address Space, CSV, registry last updated 2025-10-09](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (read 2026-10-19): all 25 rows; footnote [2] from the [XML edition](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xml)
- [IANA, IPv6 Special-Purpose Address Space, CSV, registry last updated 2025-10-09](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (read 2026-10-19): all 25 rows; footnotes [1] to [4] and the Globally Reachable definition from the [XML edition](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xml)
- [RFC 4291, IP Version 6 Addressing Architecture, February 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (read 2026-10-19): section 2.2 (text forms), sections 2.5.5.1 and 2.5.5.2 (IPv4-compatible and IPv4-mapped)
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, August 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (read 2026-10-19): sections 4 and 5
- [RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, October 2010](https://www.rfc-editor.org/rfc/rfc6052.txt) (read 2026-10-19): sections 2.1 to 2.4 and 3.1
- [RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, August 2017](https://www.rfc-editor.org/rfc/rfc8215.txt) (read 2026-10-19): sections 1, 4.1 and 5
- [RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, February 2001](https://www.rfc-editor.org/rfc/rfc3056.txt) (read 2026-10-19): section 2
- [RFC 4380, Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), February 2006](https://www.rfc-editor.org/rfc/rfc4380.txt) (read 2026-10-19): sections 2.6 and 4
- [RFC 5991, Teredo Security Updates, September 2010](https://www.rfc-editor.org/rfc/rfc5991.txt) (read 2026-10-19): section 3.1
- [RFC 6751, Native IPv6 behind IPv4-to-IPv4 NAT Customer Premises Equipment (6a44), October 2012](https://www.rfc-editor.org/rfc/rfc6751.txt) (read 2026-10-19): sections 5 and 8
- [RFC 7526, Deprecating the Anycast Prefix for 6to4 Relay Routers, May 2015](https://www.rfc-editor.org/rfc/rfc7526.txt) (read 2026-10-19): sections 4 and 7
- [RFC 7723, Port Control Protocol (PCP) Anycast Addresses, January 2016](https://www.rfc-editor.org/rfc/rfc7723.txt) (read 2026-10-19): abstract and section 1
- [RFC 8155, Traversal Using Relays around NAT (TURN) Server Auto Discovery, April 2017](https://www.rfc-editor.org/rfc/rfc8155.txt) (read 2026-10-19): sections 6 and 8
- [RFC 9665, Service Registration Protocol for DNS-Based Service Discovery, June 2025](https://www.rfc-editor.org/rfc/rfc9665.txt) (read 2026-10-19): section 10.5
- [RFC Errata 1752 for RFC 5180, IPv6 Benchmarking Methodology for Network Interconnect Devices](https://www.rfc-editor.org/errata/eid1752) (read 2026-10-19): the corrected benchmarking prefix
- [RFC 7343, An IPv6 Prefix for Overlay Routable Cryptographic Hash Identifiers Version 2 (ORCHIDv2), September 2014](https://www.rfc-editor.org/rfc/rfc7343.txt) (read 2026-10-19): abstract
- [RFC 9374, DRIP Entity Tag (DET) for Unmanned Aircraft System Remote ID (UAS RID), March 2023](https://www.rfc-editor.org/rfc/rfc9374.txt) (read 2026-10-19): section 1
- [RFC 9602, Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture, October 2024](https://www.rfc-editor.org/rfc/rfc9602.txt) (read 2026-10-19): sections 5 and 6
- [RFC 9780, Bidirectional Forwarding Detection (BFD) for Multipoint Networks over Point-to-Multipoint MPLS Label Switched Paths (LSPs), May 2025](https://www.rfc-editor.org/rfc/rfc9780.txt) (read 2026-10-19): abstract
- [RFC 3849, IPv6 Address Prefix Reserved for Documentation, July 2004](https://www.rfc-editor.org/rfc/rfc3849.txt) (read 2026-10-19): sections 2 and 3
- [RFC 9637, Expanding the IPv6 Documentation Space, August 2024](https://www.rfc-editor.org/rfc/rfc9637.txt) (read 2026-10-19): abstract and IANA considerations
- [RFC 6666, A Discard Prefix for IPv6, August 2012](https://www.rfc-editor.org/rfc/rfc6666.txt) (read 2026-10-19): sections 2 and 4
- [RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, November 2013](https://www.rfc-editor.org/rfc/rfc7050.txt) (read 2026-10-19): section 2.2
- [WHATWG, URL Standard, Living Standard last updated 19 October 2026](https://url.spec.whatwg.org/) (read 2026-10-19): the IPv6 serializer
