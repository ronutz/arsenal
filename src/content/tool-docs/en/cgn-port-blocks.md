## What it does

When a carrier-grade NAT (CGN) shares one public IPv4 address among many subscribers, the thing being shared is the 16-bit port field of that address. This tool does the arithmetic of that sharing in three modes: port blocks (how many blocks and subscribers an address and a pool hold, and how much logging the blocks save), deterministic mapping as RFC 7422 defines it (which public address and ports an inside address gets, and the reverse: from a public address, port and time back to the inside address), and the port set of a Mapping of Address and Port (MAP) Port Set Identifier (PSID), as MAP-E (RFC 7597) and MAP-T (RFC 7599) compute it. Everything is integer arithmetic run in your browser; times are inputs, never read from a clock.

## Why the usable range starts at 1024

The port field has 65,536 values, and RFC 6335 divides them into "the System Ports, also known as the Well Known Ports, from 0-1023", the User Ports from 1024 to 49151 and the Dynamic Ports from 49152 to 65535 ([RFC 6335, section 6](https://www.rfc-editor.org/rfc/rfc6335.txt)). The sources that size CGN port allocations all start above the System Ports: RFC 7422's first allocation step removes the reserved ports and says "At a minimum, the CGN SHOULD remove system ports [RFC6335] from the port candidate list" ([RFC 7422, section 2](https://www.rfc-editor.org/rfc/rfc7422.txt)); RFC 7597's offset defaults to 6 "as this excludes the system ports (0-1023)" ([RFC 7597, section 5.1](https://www.rfc-editor.org/rfc/rfc7597.txt)); and RFC 6269 quotes RFC 4787 to say that "the use of port space (1024-65535) is safe" for outgoing source ports ([RFC 6269, section 5](https://www.rfc-editor.org/rfc/rfc6269.txt)). So the default usable range is 1024 to 65535, 64,512 ports per address. You can change it: the tool says when your range keeps System Ports.

## Mode 1: port blocks

Inputs: the public pool (a prefix such as `192.0.2.0/24`, a range, one address, or just a count of addresses), the usable port range, the block size in ports, the blocks each subscriber may hold, and optionally the demand, as a subscriber count or as the inside prefix the subscribers are numbered from.

Outputs: usable ports per address, whole blocks per address and the ports no whole block covers, subscribers per address, subscribers in the whole pool, the per-subscriber port limit, and, against the demand, how many addresses are needed and whether the pool holds them.

One rule shapes the count. RFC 6888 requires "Paired" address pooling: "a CGN must use the same external IP address mapping for all sessions associated with the same internal IP address" ([RFC 6888, section 3, REQ-2](https://www.rfc-editor.org/rfc/rfc6888.txt)). So all of a subscriber's blocks live on one address, and subscribers per address is the whole blocks per address divided by the blocks per subscriber, rounded down. The block size times the blocks per subscriber is the per-subscriber limit REQ-4 asks a CGN to support: "A CGN MUST support limiting the number of external ports (or, equivalently, 'identifiers' for ICMP) that are assigned per subscriber".

The log panel quantifies only what the RFCs quantify. RFC 7422 reports log messages "approximately 150 bytes long for NAT444 [NAT444] and 175 bytes for DS-Lite" and "approximately 33,000 connections per day" per household, which it turns into "approximately 5 MB per subscriber per day" ([RFC 7422, section 1](https://www.rfc-editor.org/rfc/rfc7422.txt)); the tool shows 33,000 lines and 4,950,000 bytes (or 5,775,000 with DS-Lite messages), computed from those two figures. RFC 7768 says block allocation logs "only when blocks are allocated or deallocated", "reducing log generation by a factor equal to the block size" ([RFC 7768, section 2](https://www.rfc-editor.org/rfc/rfc7768.txt)); the block row divides by that factor. It is a computed figure, not a measurement: the one measurement the RFC quotes is 42.5 TB of per-session logs against 40.6 GB with port blocks, for 20,000 subscribers over 60 days (section 1).

## Mode 2: deterministic mapping (RFC 7422)

RFC 7422 replaces the translation log with a function: "(External IP Address, Port Range) = function 1 (Internal IP Address)" and "Internal IP Address = function 2 (External IP Address, Port Number)" ([RFC 7422, section 2](https://www.rfc-editor.org/rfc/rfc7422.txt)). Its variables are the inside range I, the outside range O, the compression ratio C, the dynamic address pool factor D, the maximum ports per user M, the algorithm A and the reserved port list R. The tool implements algorithm 0, Sequential, the one the RFC's worked example uses, step by step:

1. Remove R (default `0-1023`) from the port candidate list.
2. Give each inside address 1/(C + D) of the candidates, rounded down; "Any remaining ports are allocated to the dynamic pool."
3. Sequential: the first block goes to the first inside address, the second to the second, and so on.
4. Ports beyond a subscriber's block come from the dynamic pool, up to M, and "The CGN MUST log dynamically assigned port blocks".

The inside range is a prefix or a range. A prefix is counted as its host addresses, the way section 2.3 counts its example: `198.51.100.0/28` gives the 14 addresses `.1` to `.14`, so C is 14. C defaults to I divided by O, rounded up; you can set it. When O has more than one address, the tool fills the outside addresses in order, C inside addresses each: the RFC's example has one outside address and does not show this case, so treat it as the tool's layout. A reserved list with extra ports (`0-1023,5004,5060`) is honoured exactly, and a block that spans a reserved port is shown as two ranges.

Forward lookup: an inside address gives its outside address and port range. Reverse lookup: an outside address and port give the inside address when the port is in a pre-allocated block; "dynamic" when it is in the dynamic pool, where only the dynamic block log can answer; "reserved" when it is in R; "not in the pool" when the address is not in O. A time (UTC, to the second, as RFC 6302 recommends for server logs) can go with it, and with "in force from" and "in force until" the tool says whether the configuration you entered applied at that time. RFC 7422 says why that matters: identifying a subscriber needs the configuration in force at the time, so "the CGN MUST generate a record any time such variables are changed" ([RFC 7422, section 3](https://www.rfc-editor.org/rfc/rfc7422.txt)). The tool writes that record in the RFC's format, timestamp, inside prefix and mask, outside prefix and mask, D, M, A and R: for the RFC's own fields it prints `[Wed Oct 11 14:32:52 2000]:198.51.100.0:28:192.0.2.0:32:2:5040:0:1-1023,5004,5060`.

Not implemented: algorithms 1 to 5 (the RFC describes Staggered, Round robin and Interlaced horizontally by example only, and 4 and 5 depend on keys or vendors), and an IPv6 inside range (DS-Lite), which RFC 7422 allows. The inside address is the end of the arithmetic: section 2.3 then correlates it "with DHCP/PPP lease connection records".

## Mode 3: MAP port sets (RFC 7597, RFC 7599)

MAP shares an address without a central NAT by giving each customer edge (CE) a fixed port set. RFC 7597 writes a port as three fields, A (a bits), the PSID (k bits) and j (m bits), with a + k + m = 16 ([RFC 7597, section 5.1](https://www.rfc-editor.org/rfc/rfc7597.txt)). "For 'a' > 0, A MUST be larger than 0", so the block of ports where A is 0 belongs to nobody: with the default a = 6 that is 0 to 1023, and "'a' = 4 will exclude ports 0-4095". "The sharing ratio is 2^k. The number of ports assigned to the user is 2^(16 - k) - 2^m (excluded ports)", each contiguous range holds 2^m ports, and "The interval between initial port numbers of successive contiguous ranges assigned to the same user is 2^(16 - a)". MAP-T uses the same rules: its port-mapping appendix points to RFC 7597's ([RFC 7599, Appendix B](https://www.rfc-editor.org/rfc/rfc7599.txt)).

Inputs: a, k, and a PSID (decimal, or hexadecimal with `0x`) and/or a port. Outputs: m, the sharing ratio, ports per set, the range length and interval, the excluded block, every range of the PSID (up to 1,024 of them), and for a port the PSID that owns it, by RFC 7597's formula "PSID = trunc((P modulo (R * M)) / M)" (Appendix B), or "excluded" when its A is 0. With a = 0 there is no A field and the whole port set is one range; RFC 7597 then keeps low ports out "by putting a lower bound equal to ceil(N / M) on the allowed set of PSID values" (Appendix B.1), and the tool gives that bound for N = 1024.

## Worked examples

- Blocks: `192.0.2.0/24` with 300-port blocks, the size of RFC 7768's example block "ports 2001~2300": 215 blocks per address with 12 ports over, 55,040 subscribers in the pool, and 110 log lines per subscriber per day instead of 33,000.
- Deterministic: RFC 7422's example, inside `198.51.100.0/28`, outside `192.0.2.1`, D = 2, M = 5040. C + D = 16, each inside address gets 4,032 ports, `198.51.100.1` has 1024 to 5055 and `198.51.100.14` has 53440 to 57471, the dynamic pool is 57472 to 65535, and M allows 1,008 more ports per subscriber. Port 2001 reverses to `198.51.100.1`; port 58204 is in the dynamic pool. Both lookups are the RFC's own.
- MAP: a = 6, k = 8, PSID `0x34`: 63 ranges of 4 ports, from 1232-1235 and 2256-2259 up to 63696-63699 and 64720-64723, 252 ports in all, the port set printed in RFC 7597 Appendix A. Port 1232 reverses to PSID `0x34`, as Appendix A's Example 2 shows.

## What it does not do

It does not allocate anything, read a log or contact a device, and it gives no legal advice. Who must keep which records, for how long, and how a lawful request is answered depend on the jurisdiction; the [CGNAT article](/learn/cgnat-address-sharing-and-attribution) sets out what RFC 6269, RFC 6302 and, for Brazil, the Marco Civil da Internet say, with its sources.

## Provenance

Every number comes from the RFCs below, downloaded on 2026-10-19. The tool ships 36 golden vectors (set `cgn-port-blocks/2026-10-19a`). The RFCs' own numbers are pinned verbatim: RFC 7422's fourteen-row table, its two reverse lookups and its configuration record, RFC 7597's port set for PSID `0x34`, its port-to-PSID example and both examples of Appendix B.2. The others are computed from the rule they name and say so. RFC 7599's verified erratum 5324 corrects its Example 5 from PSID `0x20` to `0x34`, the PSID that matches the printed ports; RFC 7422's verified erratum 4211 corrects a citation of "RFC 6292" to RFC 6269.

## API

The same engine answers the `/api/v1/cgn-port-blocks` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** A JSON object naming its mode. `{"mode":"blocks","pool":"192.0.2.0/24","blockSize":300}` with optional `portRange`, `blocksPerSubscriber`, `subscribers` or `inside`, and `logFormat` (`nat444` or `ds-lite`). `{"mode":"deterministic","inside":"198.51.100.0/28","outside":"192.0.2.1","dynamicFactor":2,"maxPorts":5040}` with optional `reserved`, `compressionRatio`, `lookup`, `reverse` (`address`, `port`, `time`), `configFrom`, `configUntil` and `recordTime`. `{"mode":"map","offset":6,"psidLength":8,"psid":"0x34"}` with an optional `port`.
- **Response.** The mode's result, with `mode` saying which. For `{"mode":"map","offset":6,"psidLength":8,"port":1232}` the API answers `reverse.psid` 52 and `reverse.psidHex` `0x34`; for the RFC 7422 request with `reverse` port 2001 it answers `reverse.status` `deterministic` and `reverse.inside` `198.51.100.1`.
- **Errors.** HTTP 400, `invalid_input`, with the engine's message, for example `with k = 8 the PSID must be 0 to 255` for PSID 256.

## Sources

- [RFC 7422, Deterministic Address Mapping to Reduce Logging in Carrier-Grade NAT Deployments, December 2014](https://www.rfc-editor.org/rfc/rfc7422.txt) (read 2026-10-19): sections 1, 2, 2.3 and 3; [erratum 4211](https://www.rfc-editor.org/errata/rfc7422)
- [RFC 7768, Port Management to Reduce Logging in Large-Scale NATs, January 2016](https://www.rfc-editor.org/rfc/rfc7768.txt) (read 2026-10-19): sections 1 and 2
- [RFC 6888, Common Requirements for Carrier-Grade NATs (CGNs), April 2013](https://www.rfc-editor.org/rfc/rfc6888.txt) (read 2026-10-19): section 3, REQ-2 and REQ-4
- [RFC 7597, Mapping of Address and Port with Encapsulation (MAP-E), July 2015](https://www.rfc-editor.org/rfc/rfc7597.txt) (read 2026-10-19): section 5.1, Appendix A and Appendix B
- [RFC 7599, Mapping of Address and Port using Translation (MAP-T), July 2015](https://www.rfc-editor.org/rfc/rfc7599.txt) (read 2026-10-19): Appendix B; [erratum 5324](https://www.rfc-editor.org/errata/rfc7599)
- [RFC 6269, Issues with IP Address Sharing, June 2011](https://www.rfc-editor.org/rfc/rfc6269.txt) (read 2026-10-19): section 5
- [RFC 6302, Logging Recommendations for Internet-Facing Servers, June 2011](https://www.rfc-editor.org/rfc/rfc6302.txt) (read 2026-10-19): section 2
- [RFC 6335, IANA Procedures for the Management of the Service Name and Transport Protocol Port Number Registry, August 2011](https://www.rfc-editor.org/rfc/rfc6335.txt) (read 2026-10-19): section 6
