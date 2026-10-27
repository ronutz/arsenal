## What it does

Paste an F5 BIG-IP cipher string and the tool explains every keyword and operator in it and flags the weak or deprecated choices. It reads the string, the value of the `cipher` field on a cipher rule or SSL profile, and turns its compact syntax into a plain-language account of what it selects and in what order. It runs entirely in your browser.

## How an F5 cipher string is built

A BIG-IP cipher string is an ordered list of cipher sets, separated by a colon, a comma, or whitespace, and order is significant because it expresses the server's preference. Within one set, keywords are combined with `+`, so `ECDHE+AES-GCM` means the ciphers that are both ECDHE and AES-GCM. The keywords name the pieces of a suite: the protocol version, the key exchange, the authentication, the bulk cipher, and the MAC. `DEFAULT` stands for F5's built-in default set, a common starting point.

## The operators, which are the subtle part

A set can carry a leading operator, and the difference between them matters:

- **`!`** permanently excludes matching ciphers; once excluded this way, they cannot be added back by a later term.
- **`-`** deletes matching ciphers, but unlike `!`, a later term can add them back.
- **`+`** does not add; it moves matching ciphers to the end, lowering their priority.

And `@STRENGTH` re-sorts the whole list by key length. Confusing `!` with `-`, or forgetting that `+` reorders rather than adds, is a common source of a cipher string that does not do what its author intended, which is exactly what the tool makes visible.

## The security read, and one honest limit

The tool flags weak and deprecated elements, such as export-grade, RC4, or 3DES ciphers and obsolete protocol versions, so a risky string stands out. One thing it deliberately does not do: it does not reproduce the exact final ordered list of cipher suites a specific BIG-IP would produce, because that depends on the cipher table of the particular software version on the box. It explains the string; it does not stand in for the device.

## Using it

Paste a cipher string from a cipher rule or an SSL profile and read each keyword and operator explained, with weak choices flagged. The analysis is deterministic and local.

## Share results

Under the security read, **Share results** builds a link to this page, only when you press it, that carries the cipher string or rule name as you typed it, after the `#`: `/tools/f5-cipher-string-expander#input=ECDHE%3ARSA%3A!SSLv3...`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the string is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The string fills the box as a paste would and the page explains it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
