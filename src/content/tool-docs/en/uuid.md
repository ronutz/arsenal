## What it does

Generate UUIDs, or paste an existing one to inspect it. Generation produces either a random version 4 UUID or a time-ordered version 7 UUID, using the browser's secure random source (`crypto.getRandomValues`). Inspection takes any UUID and reports whether it is valid, which version and variant it is, and, for a version 7 value, the creation time embedded inside it. Everything runs in your browser.

## What a UUID is

A UUID is a 128-bit identifier, written as 32 hexadecimal digits in the familiar 8-4-4-4-12 grouping, for example `f47ac10b-58cc-4372-a567-0e02b2c3d479`. Its purpose is to be unique without a central authority handing out numbers: any party can mint one and rely on it not colliding with anyone else's. Two fixed fields encode its structure: a version nibble that says how the UUID was made, and a variant field that marks it as an RFC 4122/9562 UUID.

## Version 4 and version 7

- **Version 4** is almost entirely random: 122 of its 128 bits come from the random source, and the other 6 are the fixed version and variant bits. It is the right default when you just need an unpredictable, collision-resistant id and do not care about ordering.
- **Version 7** is time-ordered. Its most significant 48 bits are a Unix millisecond timestamp, followed by 74 random bits. Because the timestamp is at the front, version 7 UUIDs sort in creation order, which makes them far better than version 4 as database primary keys: sequential inserts keep an index compact instead of scattering writes across it.

Version 7 is new in RFC 9562, the 2024 specification that updated and obsoleted the original RFC 4122.

## Inspecting a UUID

Paste any UUID and the tool parses it without generating anything: it confirms the format, reads the version and variant from their fixed positions, and, for a version 7 UUID, decodes the embedded 48-bit timestamp back into a date. That last part is the useful trick: a version 7 id quietly carries the moment it was created, so you can read a record's creation time straight from its key.

## Using it

Generate a v4 or v7 UUID with a click, or paste an existing UUID to read its version, variant, and, for v7, its timestamp. Generation draws on the secure random source, so v4 values are unpredictable; inspection is a pure parse and reveals only what the UUID itself encodes.

## Share results

Under the Inspect reading, **Share results** builds a link to this page, only when you press it, that carries the value in the Inspect box after the `#`. The UUIDs you generated are not carried: each one is drawn from your browser's random source, and whoever opens the link presses Generate for their own. A UUID names nothing of yours. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The value fills the Inspect box as a paste would and the page reads it (a value that is not a UUID shows Invalid, as when typed). The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
