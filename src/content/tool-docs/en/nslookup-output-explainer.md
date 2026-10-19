## What it does

Paste the output of an `nslookup` command and the tool decodes it into a structured, explained breakdown: which resolver answered, whether the answer was authoritative, each record with its fields spelled out, and any failure it reported. It parses the text only; nothing is resolved and nothing is sent anywhere.

## Reading nslookup's layout

`nslookup` prints DNS answers in a loose, prose-like layout that is quite different from `dig`, and that layout carries meaning worth making explicit. Every answer starts with a **Server** and **Address** header naming the resolver that was queried. A line reading **Non-authoritative answer:** means the AA bit was clear: the answer came from a resolver, not from a server authoritative for the name. RFC 1035 (section 4.1.1) and RFC 2181 (section 6) define authority by the name, not by caching, so the line does not say whether the resolver answered from its cache or fetched the answer for you; both look the same. Its absence, for a direct query, implies an authoritative answer. When a lookup fails, nslookup prints a line like `** server can't find NAME: NXDOMAIN`, and the tool surfaces that failure and what the status means.

## Records and their fields

For most record types nslookup prints a simple `name = value` line, but a few pack several fields into one line or block, and those are the ones worth decoding:

- **MX** records read as `mail exchanger = 10 mail.example.com`, where the number is the preference (lower is preferred) and the name is the mail host. The tool separates the two.
- **SRV** records (RFC 2782) carry priority, weight, port, and target in one line; the tool breaks them apart so you can see which service host and port they point to.
- **SOA** records span several lines: the zone's primary name server, the responsible party's mailbox, and the serial and the timers (refresh, retry, expire, minimum). The tool lays those fields out.

## Using it

Paste an `nslookup` response and read the resolver, the authoritative status, each record with its fields, and any error. The parse is deterministic and entirely local; the tool never performs a lookup of its own, which also makes it a safe way to read output captured from somewhere else.

## Examples

The Example button and the tool's tests use real `nslookup` output from the BIND 9.20.29 build, captured on 2026-10-19 through a local relay that sent each query to a public resolver over DNS over HTTPS, so the Server line shows the relay's address, `127.0.0.1#5311`. The failure example looks up `nonexistent.invalid`: RFC 6761, section 6.4, lets users assume that queries for names under `.invalid` always return NXDOMAIN, while `example.com` now answers NOERROR with no data for names that do not exist (the compact denial of RFC 9824).

## Sources

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (read 2026-10-19): the AA bit, section 4.1.1
- [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181) (read 2026-10-19): zone authority, section 6
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (read 2026-10-19): NXDOMAIN, NODATA and the SOA minimum
- [RFC 2782: A DNS RR for specifying the location of services (DNS SRV)](https://www.rfc-editor.org/rfc/rfc2782) (read 2026-10-19): the SRV fields
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (March 2024, obsoletes RFC 8499; read 2026-10-19): authoritative server and resolver
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (read 2026-10-19): section 6.4, names under `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (read 2026-10-19): NOERROR with no data for a name that does not exist
- [RFC 7505: A "Null MX" No Service Resource Record for Domains That Accept No Mail](https://www.rfc-editor.org/rfc/rfc7505) (read 2026-10-19): the MX example, preference 0 and exchange `.`
