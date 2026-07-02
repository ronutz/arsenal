## What it does

Paste the output of an `nslookup` command and the tool decodes it into a structured, explained breakdown: which resolver answered, whether the answer was authoritative, each record with its fields spelled out, and any failure it reported. It parses the text only; nothing is resolved and nothing is sent anywhere.

## Reading nslookup's layout

`nslookup` prints DNS answers in a loose, prose-like layout that is quite different from `dig`, and that layout carries meaning worth making explicit. Every answer starts with a **Server** and **Address** header naming the resolver that was queried. A line reading **Non-authoritative answer:** tells you the response came from a cache rather than from a server responsible for the zone; its absence, for a direct query, implies an authoritative answer. When a lookup fails, nslookup prints a line like `** server can't find NAME: NXDOMAIN`, and the tool surfaces that failure and what the status means.

## Records and their fields

For most record types nslookup prints a simple `name = value` line, but a few pack several fields into one line or block, and those are the ones worth decoding:

- **MX** records read as `mail exchanger = 10 mail.example.com`, where the number is the preference (lower is preferred) and the name is the mail host. The tool separates the two.
- **SRV** records (RFC 2782) carry priority, weight, port, and target in one line; the tool breaks them apart so you can see which service host and port they point to.
- **SOA** records span several lines: the zone's primary name server, the responsible party's mailbox, and the serial and the timers (refresh, retry, expire, minimum). The tool lays those fields out.

## Using it

Paste an `nslookup` response and read the resolver, the authoritative status, each record with its fields, and any error. The parse is deterministic and entirely local; the tool never performs a lookup of its own, which also makes it a safe way to read output captured from somewhere else.
