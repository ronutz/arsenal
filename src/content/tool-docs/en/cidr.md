## What it does

The CIDR / Subnet Calculator works on IPv4 blocks written in CIDR notation, an address and a prefix length such as `192.168.1.0/24`. It has four modes, chosen with the tabs at the top:

- **Subnet** analyses one block: network address, last address, netmask, wildcard mask, first and last usable host, total addresses and usable hosts, the address bits, and the special-purpose ranges the block falls in or overlaps.
- **VLSM** carves variable-length subnets out of a parent block to fit a list of host counts.
- **Supernet** summarises a list of prefixes into the smallest set of blocks that covers exactly the same addresses, and into the single smallest prefix that covers them all.
- **Overlap / gap** finds which prefixes in a list overlap or contain each other and, given a scope, lists the space inside it that no prefix covers.

Every calculation runs in your browser; nothing you type is sent anywhere. A block handed over from another page arrives after the `#` in the address, a part no request carries; see **Links into the calculator** below.

## Subnet mode

A prefix length `/n` fixes the leading `n` bits of the 32-bit address as the network part and leaves `32 - n` bits for hosts, so the block spans `2^(32 - n)` addresses (RFC 4632, section 3.1). For a /0 to /30 block the tool reserves two of them: the address with every host bit 0 (the network address) and the one with every host bit 1 (the directed broadcast). RFC 1122, section 3.2.1.3, does not permit 0 or all ones in the host-number field outside its listed special cases, so a block from /0 to /30 has `2^(32 - n) - 2` usable hosts.

A /31 and a /32 reserve nothing. RFC 3021, section 2.1, says that on a point-to-point link with a 31-bit mask both addresses "MUST be interpreted as host addresses", so the tool counts two usable hosts in a /31, labels the first address as the network identifier that is also a usable host, and labels the last one as an address with no directed broadcast. A /32 is a single host.

An address typed with host bits set, such as `192.168.1.77/24`, is read as the block it belongs to: the network address row shows `192.168.1.0`. The **Prefix length** slider rewrites the prefix of the current address and recalculates at once. The **Example** button loads `192.168.1.0/24`.

Worked examples, as the tool prints them:

- `192.168.1.0/24`: network `192.168.1.0`, broadcast `192.168.1.255`, usable `192.168.1.1` to `192.168.1.254`, 254 hosts, netmask `255.255.255.0`, wildcard `0.0.0.255`.
- `10.0.0.0/30`: network `10.0.0.0`, broadcast `10.0.0.3`, usable `10.0.0.1` to `10.0.0.2`, 2 hosts, netmask `255.255.255.252`.
- `10.0.0.0/31`: two usable addresses, `10.0.0.0` and `10.0.0.1`, no network or broadcast address reserved.

## Special-purpose classification

Under the Subnet results, the tool compares the block with every row of the IANA IPv4 Special-Purpose Address Space registry, as downloaded on 2026-10-26 (the registry was last updated on 2025-10-09; the SSRF URL classifier reads the same copy of its rows), plus one row for multicast. It prints one of three verdicts:

- **Inside a special-purpose range**: the whole block lies in a listed range. The sentence names the most specific one, for example `192.168.1.0/24` is inside `192.168.0.0/16`, Private-Use (RFC 1918).
- **Partly special-purpose**: the block holds one or more listed ranges and other addresses as well. Two CIDR blocks are either nested or disjoint, so this is the only way a block can partly overlap a range. The sentence gives the count, for example `10.0.0.0/7`: 16,777,216 of 33,554,432 addresses fall in `10.0.0.0/8`. Nested rows are counted once: `192.0.0.0/23` holds `192.0.0.0/24` and its six more specific rows, and the tool reports 256 of 512.
- **No special-purpose range (globally routable unicast space)**: the block meets no listed range, for example `172.32.0.0/24`, the /24 just above `172.16.0.0/12`.

Below the verdict, a table lists every row the block meets, most specific first: the range, the registry's name, the RFC column, the relation (**is this block**, **contains this block**, or **inside this block (partial overlap)**) and four of the registry's flags. The registry defines them: **Source** and **Destination** say whether an address from the range is valid as the source or the destination of a datagram that transits two devices; **Forwardable** says whether a router may forward such a datagram between external interfaces; **Globally reachable** says whether it is forwardable beyond a specified administrative domain. Where the registry attaches a footnote, the tool shows it: footnote 1 on Loopback's flags ("Several protocols have been granted exceptions to this rule"), footnote 2 on `192.0.0.0/24` ("Not useable unless by virtue of a more specific reservation").

The rows, as the registry lists them (Source, Destination, Forwardable, Globally reachable):

| Range | Name | RFC | S | D | F | G |
|---|---|---|---|---|---|---|
| `0.0.0.0/8` | "This network" | RFC 791, Section 3.2 | yes | no | no | no |
| `0.0.0.0/32` | "This host on this network" | RFC 1122, Section 3.2.1.3 | yes | no | no | no |
| `10.0.0.0/8` | Private-Use | RFC 1918 | yes | yes | yes | no |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | yes | yes | yes | no |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | no [1] | no [1] | no [1] | no [1] |
| `169.254.0.0/16` | Link Local | RFC 3927 | yes | yes | no | no |
| `172.16.0.0/12` | Private-Use | RFC 1918 | yes | yes | yes | no |
| `192.0.0.0/24` [2] | IETF Protocol Assignments | RFC 6890, Section 2.1 | no | no | no | no |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | yes | yes | yes | no |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | yes | no | no | no |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | yes | yes | yes | yes |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | yes | yes | yes | yes |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | no | no | no | no |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | no | no | no | no |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | yes | yes | yes | yes |
| `192.52.193.0/24` | AMT | RFC 7450 | yes | yes | yes | yes |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast), terminated 2015-03 | RFC 7526 | not listed | not listed | not listed | not listed |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | yes | yes | yes | no |
| `192.168.0.0/16` | Private-Use | RFC 1918 | yes | yes | yes | no |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | yes | yes | yes | yes |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | yes | yes | yes | no |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | no | no | no | no |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | no | no | no | no |
| `224.0.0.0/4` | Multicast | RFC 1112, Section 4; RFC 5771 | not listed | not listed | not listed | not listed |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | no | no | no | no |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | no | yes | no | no |

The special-purpose registry does not list multicast. The multicast row comes from the IANA IPv4 Multicast Address Space registry, whose note gives "the range 224.0.0.0 through 239.255.255.255", the same range RFC 1112, section 4, gives for host group addresses. That registry has no flag columns, so the tool shows its flags as **not listed** rather than guessing them; it does the same for the deprecated 6to4 relay row, whose flag cells the registry leaves blank.

A few rows explain themselves better with their RFC. RFC 1918, section 3, reserves the three Private-Use blocks "for private internets". RFC 6598 reserves `100.64.0.0/10` for Carrier-Grade NAT and says "Shared Address Space is distinct from RFC 1918 private address space because it is intended for use on Service Provider networks". RFC 5737 reserves the three TEST-NET blocks for documentation. RFC 1112, section 4, says addresses with "1111" as their high-order four bits "are reserved for future addressing modes", the `240.0.0.0/4` row.

What the classification is not: it reports the registry's rows and nothing else. It does not look up whether a block is allocated to anyone or announced on the Internet, and the registry itself notes that listed prefixes "are not guaranteed routability in any particular local or global context".

## VLSM mode

Enter a **parent block** and one row per subnet: an optional name and the number of hosts it must hold. **Allocate** sizes and places every request:

1. **Size.** A request for `h` hosts gets the smallest block of at least `h + 2` addresses, the two being the network and broadcast addresses (RFC 1122, section 3.2.1.3). 100 hosts get a /25, 25 hosts a /27, 2 hosts a /30. A request for 0 hosts is refused with a message that names the problem; a request larger than any IPv4 block is listed as not fitting.
2. **Order.** Requests are placed largest block first, not in the order entered, and the result says so. Each block then starts on a multiple of its own size, and the allocated blocks leave no holes between them.
3. **Place.** Each block takes the next aligned position inside the parent; a request whose aligned block would leave the parent is listed under **Did not fit**.

The option **Give 2-host requests a /31 (point-to-point links, RFC 3021)** is off by default. Ticked, a request for exactly 2 hosts gets a /31 instead of a /30, and its row shows no broadcast: RFC 3021, section 2.1, makes both addresses hosts, and section 2.2 says the limited broadcast "MUST be used for all broadcast traffic on a point-to-point link with a 31-bit subnet mask". Use it only where both ends of the link support 31-bit prefixes: section 5 warns that a link "in which only one end supports the use of 31-bit prefixes may not operate correctly".

A parent typed with host bits set, such as `192.0.2.77/24`, is masked to `192.0.2.0/24`, and the result says so above the table instead of carving the plan silently from a different block than the one typed.

The result shows the parent, the addresses used and free, the utilisation, a table of every subnet (name, hosts requested, network, prefix, netmask, usable range, broadcast, usable hosts), the free space left in the parent as CIDR blocks, and the requests that did not fit.

Worked example: parent `203.0.113.0/24` with an office of 100 hosts, a guest LAN of 25, a management LAN of 10 and two router links of 2 hosts each.

- Option off: `203.0.113.0/25`, `203.0.113.128/27`, `203.0.113.160/28`, `203.0.113.176/30`, `203.0.113.180/30`; 184 addresses used, 72 free (71.9%), free blocks `203.0.113.184/29` and `203.0.113.192/26`.
- Option on: the links become `203.0.113.176/31` and `203.0.113.178/31`; 180 used, 76 free (70.3%), free blocks `203.0.113.180/30`, `203.0.113.184/29` and `203.0.113.192/26`.

## Supernet mode

Paste up to 1,024 prefixes, separated by new lines, commas or spaces. **Aggregate** merges them (overlapping or adjacent prefixes become one range) and prints:

- the **minimal covering set**: the fewest aligned CIDR blocks that cover exactly the same addresses as the inputs, no more;
- the **single supernet**: the smallest single prefix that covers every input, and how many addresses it adds beyond them when it is larger than their union.

Examples: `192.168.0.0/24` and `192.168.1.0/24` aggregate to `192.168.0.0/23` with nothing extra. `10.0.0.0/24` and `10.0.2.0/24` stay two blocks; the single supernet `10.0.0.0/22` would add 512 addresses that are in neither input.

## Overlap / gap mode

Paste up to 1,024 prefixes and, optionally, a **scope**. **Check** compares every pair and labels each overlapping pair as **identical to**, **contains** or **is inside**, with the shared range and its size; two CIDR blocks are either nested or disjoint, so every overlap is one of these. It also counts the addresses the prefixes cover. With a scope, it lists the **gaps in scope**: the addresses inside the scope that no prefix covers, as the largest aligned blocks that fit.

Example: `10.0.0.0/26` and `10.0.0.128/26` in scope `10.0.0.0/24` do not overlap, cover 128 of 256 addresses, and leave the gaps `10.0.0.64/26` and `10.0.0.192/26`.

## Links into the calculator

Another page can open the calculator with a block already filled in. The home page's CIDR box does this from its **Open the full CIDR calculator** link and from the special-purpose line, and the address looks like `/en/tools/cidr/#input=192.0.2.7%2F31`. The block rides in the fragment, the part after `#`: a browser never puts the fragment in an HTTP request or in a Referer header, so the host serving the page does not receive the block. The calculator reads it in the browser, runs it through the same validator as **Calculate** and shows the Subnet result (for `192.0.2.7/31`: `192.0.2.6` and `192.0.2.7`, two usable addresses). An invalid block shows the same error message as typing it would; a value longer than 16,384 characters is ignored.

What the fragment does not hide: it stays in the address bar and in the browser's history, a bookmark keeps it, and anyone you send the address to can read it; the page's **Share** button says so when the address carries a block. **Clear**, **Example** or any edit removes the block from the address without reloading the page, so a later share or reload no longer carries it. Changing the language keeps the block.

Older links put the block in the query string instead (`?input=192.0.2.7%2F31`). They still work, but a query string is part of the request, so that first request did carry the block to the host before the page ran. The calculator then moves the block into the fragment and says so in a note under the input.

## API

The same engine answers the `/api/v1/cidr` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** A bare block (`192.168.1.0/24`, as `?input=` on GET or as a POST body) runs the Subnet mode. A JSON object picks a mode: `{"mode": "subnet", "block": "..."}`; `{"mode": "vlsm", "parent": "...", "requirements": [{"label": "Office", "hosts": 100}], "pointToPoint31": false}`; `{"mode": "supernet", "prefixes": [...]}`; or `{"mode": "overlap", "prefixes": [...], "scope": "..."}`. `prefixes` may also be one string, separated as in the page's box.
- **Response.** Every result carries `mode`. Subnet returns the fields of the Subnet results (`input`, `network`, `broadcast`, `netmask`, `wildcard`, `firstHost`, `lastHost`, `totalAddresses`, `usableHosts`) and `specialPurpose`: `status` (`special`, `partial` or `none`), `specialAddresses`, and `matches`, one per registry row the block meets, with the registry's columns (a flag the registry leaves blank is `null`), `relation` (`equal`, `inside` or `contains`) and `overlapAddresses`. VLSM returns `subnets` (each with `pointToPoint31`), `unallocated`, `parentInput`, `parentMasked`, `freeBlocks`, `placement` (`largest-first`) and the address totals. Supernet returns `aggregated`, `singleSupernet` and `supernetExtraAddresses`; Overlap / gap returns `overlaps`, `gaps`, `coveredAddresses` and `scopeAddresses`.
- **Errors.** HTTP 400, `invalid_input`, with the engine's message: a 0-host request answers `a requirement (Z) asks for 0 hosts`.

Until 2026-10-19 the operation returned the Subnet breakdown alone; `mode` and `specialPurpose` were added that day, and the VLSM, Supernet and Overlap / gap modes became reachable through the API.

## Sources

- [IANA, IPv4 Special-Purpose Address Space registry, CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (registry updated 2025-10-09; read 2026-10-26): every special-purpose row, its flags and footnotes
- [IANA, IPv4 Multicast Address Space registry](https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml) (registry updated 2026-08-20; read 2026-10-26): the multicast range
- [RFC 4632: Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632) (read 2026-10-19): section 3.1, prefix notation and block sizes
- [RFC 1122: Requirements for Internet Hosts - Communication Layers](https://www.rfc-editor.org/rfc/rfc1122) (read 2026-10-19): section 3.2.1.3, the reserved host-number values
- [RFC 3021: Using 31-Bit Prefixes on IPv4 Point-to-Point Links](https://www.rfc-editor.org/rfc/rfc3021) (read 2026-10-19): sections 2.1, 2.2 and 5
- [RFC 6890: Special-Purpose IP Address Registries](https://www.rfc-editor.org/rfc/rfc6890) (read 2026-10-19), updated by [RFC 8190](https://www.rfc-editor.org/rfc/rfc8190) (read 2026-10-19): the registry's structure
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918) (read 2026-10-19): section 3
- [RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space](https://www.rfc-editor.org/rfc/rfc6598) (read 2026-10-19)
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737) (read 2026-10-19)
- [RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927) (read 2026-10-19)
- [RFC 1112: Host Extensions for IP Multicasting](https://www.rfc-editor.org/rfc/rfc1112) (read 2026-10-19): section 4, host group addresses and the class E range
- [RFC 5771: IANA Guidelines for IPv4 Multicast Address Assignments](https://www.rfc-editor.org/rfc/rfc5771) (read 2026-10-19)
