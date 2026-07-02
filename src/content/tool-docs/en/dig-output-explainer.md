## What it does

Paste the output of a `dig` command and the tool reconstructs the DNS message it represents, section by section, and explains each part. It reads the header, the flags line and section counts, the EDNS OPT pseudo-section, the four record sections with every resource record broken into its fields, and the trailing query statistics. It parses the text only: nothing is resolved and nothing is sent anywhere.

## Why dig output needs decoding

`dig` prints a faithful but terse rendering of a DNS message, and a lot of meaning is packed into short tokens. The **header** carries the operation, a status code, and a message id; the **flags** line carries single-word flags whose presence or absence changes everything. `aa` means the answer is authoritative, from a server responsible for the zone rather than a cache; `rd` means recursion was desired and `ra` that it is available; `ad` marks data validated by DNSSEC; `tc` means the reply was truncated and should be retried over TCP. The status code is the other thing to read first: `NOERROR`, `NXDOMAIN` for a name that does not exist, or `SERVFAIL` for a failure at the server.

## The sections and EDNS

A DNS message has four sections, and dig labels them: **QUESTION** (what was asked), **ANSWER** (the records that answer it), **AUTHORITY** (the name servers responsible), and **ADDITIONAL** (extra helpful records). The tool breaks every resource record into its parts: the name, the TTL in seconds, the class (almost always `IN`), the type (`A`, `AAAA`, `MX`, and so on), and the record data. It also decodes the **OPT pseudo-section**, the EDNS(0) extension (RFC 6891) that advertises things like the largest UDP response the resolver will accept and DNSSEC support, and which is not a real record but metadata about the exchange.

## The statistics

The footer dig prints is genuinely useful for diagnosis: the query time tells you how long the resolver took, the server line tells you which resolver answered, and the message size and timestamp round it out. Reading these together often explains a slow or surprising lookup faster than the records themselves.

## Using it

Paste a complete `dig` response and read the decoded header, flags, sections, and stats. The parse is deterministic and entirely local; the tool never performs a lookup of its own.
