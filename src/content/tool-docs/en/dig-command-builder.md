## What it does

You describe the query; the page writes the `dig` command line. Four groups of controls map onto the four things a dig invocation says:

- **What to look up:** a name and a record type (A by default, any mnemonic in the IANA registry, `TYPEnn`, or the query types ANY, AXFR and IXFR with the serial you hold), a class (IN by default; CH and HS), or an address for a reverse lookup with `-x`, in which case dig derives the PTR name itself and the name, type and class are not written.
- **Where to ask:** the server (`@server`, a host name or a bare IPv4 or IPv6 address), a non-standard port (`-p`), the transport (UDP, `+tcp`, `+tls`, `+https` with its endpoint), one address family (`-4`, `-6`) and a source address (`-b`).
- **How to ask:** `+trace`, `+nssearch`, `+norecurse`, `+dnssec`, `+cd`, `+ignore`; the EDNS controls `+bufsize`, `+subnet`, `+nsid`, `+nocookie`, `+noedns`; and the timers `+timeout`, `+tries`, `+retry`.
- **What to print:** the whole message, `+short` (with `+identify`), `+noall +answer`, or `+yaml`; plus `+multiline`, `+ttlunits` and `+qr`.
- **On your machine:** `-k keyfile` for a signed query and `-r` to ignore `~/.digrc`.

Three things come back: the command, in one canonical order, with a Copy button; findings, where a combination is contradictory, redundant or likely to surprise; and a summary of what the query will carry, derived from the manual's stated defaults and interactions: the question dig will put in the message, which servers are asked, the transport and port after the type defaults, whether a truncated UDP answer is retried over TCP, and the RD, DO, CD and AD bits, the EDNS OPT record and its buffer size, the cookie, and whether the query is signed. Every token is explained underneath.

## The order of the command

dig reads the whole line and does not care much about order, with two exceptions the manual states: query options (the `+` words) are order sensitive, and `+short` and `+cmd` are global. The builder writes one fixed order so the same intent always gives the same bytes: `dig`, `@server`, the options (`-r`, `-4`/`-6`, `-b`, `-p`, `-k`), the question (`-x address`, or the name, then the type, then the class), then the query options grouped as transport, mode, header bits, EDNS, timers, output. `+noall` is always written before `+answer` because they apply in sequence.

Defaults are not written: type A, class IN, port 53 (853 for TLS, 443 for HTTPS), UDP. A name that is also a type or class mnemonic (the `ch` top-level domain, a host literally called `mx`) is written with `-q`, because dig reads bare words as types and classes before names; the manual's own note about the IN and CH top-level domains is the reason the option exists.

## What the findings check

Each rule points at the sentence in the manual or the RFC that justifies it:

- `+trace` sets `+dnssec` and `+cookie` and disables recursion; `@server` then affects only the initial query for the root servers. Asking for `+dnssec` or `+norecurse` alongside is flagged as redundant, and the server note is shown.
- `+nssearch` disables recursion too.
- Type ANY and `ixfr=N` default to TCP; AXFR always uses TCP, and a transfer with no `@server` would go to the resolvers in `/etc/resolv.conf` rather than to a server that holds the zone (RFC 5936). ANY may be answered minimally or with a synthesised HINFO record (RFC 8482).
- `+bufsize` is 0 to 65535; a value under 512 is treated as 512 by the receiver (RFC 6891, section 6.2.3); above 4096 is more than RFC 6891's suggested starting point; DNS Flag Day 2020 names 1232 as the minimum safe size.
- `+dnssec`, `+trace`, `+bufsize`, `+nsid` and `+subnet` live in the OPT record (RFC 6891; the DO bit is RFC 3225), so `+noedns` cannot be combined with them and is not written when they are present.
- `+subnet=0` (or a prefix length of 0) asks the resolver not to use your address (RFC 7871).
- `-4` against an IPv6 server literal, or `-6` against an IPv4 one, leaves dig with nowhere to send the query.
- `+timeout` below 1 and `+tries` of 0 are silently raised to 1 by dig.
- `+identify` does nothing without `+short`; `+ignore` does nothing without UDP.
- Only `-k` is offered for TSIG. The manual says to use it rather than `-y`, because `-y` puts the shared secret on the command line where `ps` and the shell history can see it.

## Limits

- The builder emits one lookup per command. dig can take several queries on one line, each with its own options, and a batch file with `-f`; neither is modelled.
- It does not run dig, resolve anything or check that a server exists. The summary is derived from the manual's statements, not observed.
- Options not offered (`+aaonly`, `+besteffort`, `+cmd`, `+comments`, `+crypto`, `+domain`, `+ednsopt`, `+expire`, `+header-only`, `+keepopen`, `+ndots`, `+onesoa`, `+opcode`, `+padding`, `+proxy`, `+qid`, `+search`, `+split`, `+stats`, `+tls-ca` and the other TLS files, `+unknownformat`, `+zoneversion`, `-c` as an option, `-f`, `-F`, `-m`, `-t` as an option, `-u`, `-y`) are documented in the manual; the common ones are here.
- Names are checked for shape (labels of letters, digits, hyphens and underscores, at most 63 characters each, at most 253 in all; a lone asterisk as a wildcard label); the builder does not know whether a name exists.
- The dig manual read for this page is the BIND 9 "latest" documentation (9.21). Older dig versions lack some query options (`+tls`, `+https`, `+yaml` are recent); dig prints "Invalid option" for a word it does not know.

## Sources

- [BIND 9 Administrator Reference Manual, Manual Pages: dig](https://bind9.readthedocs.io/en/latest/manpages.html#man-dig) (read 2026-10-04): every option and query option, the defaults and the interactions quoted above
- [BIND 9 source, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/main/bin/dig/dig.c) (read 2026-10-04): the order in which a bare word is tried (ixfr=, type, class, name), and the TCP default for ANY and ixfr
- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (read 2026-10-04): TYPE and CLASS values, port 53, the 512-byte UDP limit, IN-ADDR.ARPA, label and name lengths, the RD bit
- [RFC 3596: DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596) (read 2026-10-04): AAAA and the IP6.ARPA nibble form
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (read 2026-10-04): the OPT record, the payload size rules, 4096 as a starting point
- [RFC 3225: Indicating Resolver Support of DNSSEC](https://www.rfc-editor.org/rfc/rfc3225) (read 2026-10-04): the DO bit
- [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034) and [RFC 4035](https://www.rfc-editor.org/rfc/rfc4035) (read 2026-10-04): the DNSSEC record types; the CD and AD bits
- [RFC 5936: DNS Zone Transfer Protocol (AXFR)](https://www.rfc-editor.org/rfc/rfc5936) and [RFC 1995: Incremental Zone Transfer in DNS](https://www.rfc-editor.org/rfc/rfc1995) (read 2026-10-04)
- [RFC 8482: Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY](https://www.rfc-editor.org/rfc/rfc8482) (read 2026-10-04)
- [RFC 7858: DNS over TLS](https://www.rfc-editor.org/rfc/rfc7858) and [RFC 8484: DNS Queries over HTTPS](https://www.rfc-editor.org/rfc/rfc8484) (read 2026-10-04)
- [RFC 5001: NSID](https://www.rfc-editor.org/rfc/rfc5001), [RFC 7871: Client Subnet in DNS Queries](https://www.rfc-editor.org/rfc/rfc7871), [RFC 7873: DNS Cookies](https://www.rfc-editor.org/rfc/rfc7873) (read 2026-10-04)
- [IANA: Domain Name System (DNS) Parameters](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml) (read 2026-10-04): the RR TYPE registry the type field accepts, and the EDNS option codes
- [DNS Flag Day 2020](https://www.dnsflagday.net/2020/) (read 2026-10-04): 1232 bytes as the minimum safe EDNS buffer size
- [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) and [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849) (read 2026-10-04): the documentation address ranges used in the examples (192.0.2.0/24, 2001:db8::/32)
