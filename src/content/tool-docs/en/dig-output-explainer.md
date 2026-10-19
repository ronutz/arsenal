## What it does

Paste the output of a `dig` command and the tool reconstructs the DNS message it represents, section by section, and explains each part. It reads the header, the flags line and section counts, the EDNS OPT pseudo-section, the four record sections with every resource record broken into its fields, and the trailing query statistics. It parses the text only: nothing is resolved and nothing is sent anywhere.

## Why dig output needs decoding

`dig` prints a faithful but terse rendering of a DNS message, and a lot of meaning is packed into short tokens. The **header** carries the operation, a status code, and a message id; the **flags** line carries single-word flags whose presence or absence changes everything. `aa` means the answer is authoritative, from a server responsible for the zone rather than a cache; `rd` means recursion was desired and `ra` that it is available; `ad` marks data validated by DNSSEC; `tc` means the reply was truncated and should be retried over TCP. The status code is the other thing to read first: `NOERROR`, `NXDOMAIN` for a name that does not exist, or `SERVFAIL` for a failure at the server.

## The sections and EDNS

A DNS message has four sections, and dig labels them: **QUESTION** (what was asked), **ANSWER** (the records that answer it), **AUTHORITY** (the name servers responsible), and **ADDITIONAL** (extra helpful records). The tool breaks every resource record into its parts: the name, the TTL in seconds (converted when dig printed units), the class (almost always `IN`), the type (`A`, `AAAA`, `MX`, and so on), and the record data. It also decodes the **OPT pseudo-section**, the EDNS(0) extension (RFC 6891) that advertises things like the largest UDP response the resolver will accept and DNSSEC support, and which is not a real record but metadata about the exchange.

## The statistics

The footer dig prints is genuinely useful for diagnosis: the query time tells you how long the resolver took, the server line tells you which resolver answered, and the message size and timestamp round it out. Reading these together often explains a slow or surprising lookup faster than the records themselves.

## Using it

Paste a complete `dig` response and read the decoded header, flags, sections, and stats. The parse is deterministic and entirely local; the tool never performs a lookup of its own.

## Layouts it reads

Besides the default layout, the parser reads the shapes dig's output options produce, each pinned by a test on real dig 9.20.29 output:

- `+ttlunits`: TTLs printed in units (`1h30m`, `1d`, `2w`, `4m16s`; the manual lists s, m, h, d and w) are converted to seconds and shown both ways, for example `1h30m = 5400s`.
- `+nottlid`: records printed without a TTL column are still read, with the TTL marked as absent.
- `+multiline`: records wrapped in parentheses over several lines, with `;` comments, are joined back into one line, so an SOA still breaks into its seven fields.
- Opcode 6 and RCODE 11: dig 9.20 has no name for them and prints `RESERVED6` and `RESERVED11`. IANA assigned them to DNS Stateful Operations (DSO) and DSOTYPENI (RFC 8490), and the tool shows both names.

For a negative answer (NXDOMAIN, or NOERROR with an empty answer section) that carries the zone's SOA, the tool also computes the negative-caching TTL. RFC 2308, section 5, says the authoritative server sets the SOA's TTL to the minimum of the SOA's own TTL and its MINIMUM field, and a cache counts it down from there.

## Examples

The Example button and the tests use real dig 9.20.29 output captured on 2026-10-19, most of it through a local relay that sent each query to a public resolver over DNS over HTTPS (the SERVER line shows the relay, `127.0.0.1`), the rest against a local lab server holding a copy of `example.com` with documentation addresses, plus one lab responder built to return RCODE 11. Names that do not exist are under `.invalid`: RFC 6761, section 6.4, lets users assume they always return NXDOMAIN, while `example.com` now answers NOERROR with no data for names that do not exist (the compact denial of RFC 9824).

## API

The same engine answers the `/api/v1/dig-output-explainer` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** The dig output as text, new lines and tabs included.
- **Response.** `versionLine`, `digVersion`, `queryArgs`, `header` (`opcode`, `status` and `id` as printed, plus `opcodeName` or `statusName` where dig prints RESERVED6 or RESERVED11), `flags` with the four section counts, `opt`, `sections` (each record with `name`, `ttl` in seconds or `null`, `ttlText` when dig printed the TTL in units, `class`, `type`, `rdata` and `isQuestion`), `footer`, `negative` (`owner`, `soaTtl`, `minimum` and `ttl`) for a negative answer with an SOA in AUTHORITY, `warnings` (stable codes) and `hadHeader`.
- **Errors.** Text that is not dig output is not an HTTP error: `hadHeader` is `false`.

`ttlText`, `negative`, `opcodeName`, `statusName` and the warnings `ttl-units` and `ttl-absent` were added on 2026-10-19; a TTL printed as `1d` now answers `ttl` 86400, where it used to be read as 1.

## Sources

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (read 2026-10-19): the message format and the header flags
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (read 2026-10-19): the OPT pseudo-section
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (read 2026-10-19): section 5, the negative-caching TTL
- [RFC 4034: Resource Records for the DNS Security Extensions](https://www.rfc-editor.org/rfc/rfc4034) (read 2026-10-19): RRSIG, DNSKEY, DS, NSEC
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (March 2024, obsoletes RFC 8499; read 2026-10-19)
- [RFC 8490: DNS Stateful Operations](https://www.rfc-editor.org/rfc/rfc8490) (read 2026-10-19): sections 10.1 and 10.2, opcode 6 (DSO) and RCODE 11 (DSOTYPENI)
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (read 2026-10-19): section 6.4, names under `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (read 2026-10-19): NOERROR with no data for a name that does not exist
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/stable/manpages.html) (read 2026-10-19): `+ttlunits`, `+ttlid`, `+multiline`, `+opcode`
- [BIND 9 source at tag v9.20.29, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dig.c) (read 2026-10-19): the opcode names dig prints, `RESERVED6` among them; `RESERVED11` comes from lib/dns/rcode.c
