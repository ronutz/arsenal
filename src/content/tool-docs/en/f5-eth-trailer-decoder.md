## What it does

Paste the F5 Ethernet Trailer section as Wireshark displays it, or the raw trailer bytes as hex, and the tool explains each field: direction, slot and TMM, the virtual server, the flow and peer identifiers, and the device's own RST cause. Local and offline; it parses the text you paste and contacts nothing.

## Why the trailer is worth reading

Run tcpdump **on** a BIG-IP with the noise flags (`:n` low, `:nn` medium, `:nnn` high, with `-s0`) and each frame carries the device's own account of that packet. The **RST cause** is the field that earns the exercise: a capture without it shows a connection died; with it, the device tells you it killed the connection and why.

## What it warns you about

**Flow IDs are unique only within a slot and TMM combination, and they are reused.** The same ID can appear on unrelated packets earlier or later in one capture. The tool says so on every decode, because a flow ID trusted as globally unique produces a confident wrong conclusion.

It also points at `f5ethtrailer.anyflowid`, which matches the ID as either flow or peer and so returns **both sides** of the connection; filtering on `flowid` alone returns half of what you wanted.

## *** The section it refuses to decode ***

From **BIG-IP v15** the trailer can carry a **TLS provider section containing session secrets**. Wireshark will turn them into keylog entries and decrypt the capture.

**This tool detects that section, tells you it is there, and decodes none of it.** A golden vector asserts that no secret ever appears anywhere in the output.

The reason is the thing worth knowing: **a capture taken at high noise on a v15+ device can contain the keys to its own TLS sessions.** F5 documents that the trailer never leaves the device on the wire, which is true, and about the wire. The file is a different question, and sending it to a ticket or a colleague sends the keys with it.

## What it will not do

It does not read pcap files, and it cannot see your capture. Where an RST cause is not in its table it says so rather than inventing an explanation for it.

## Share results

Under the overview, **Share results** builds a link to this page, only when you press it, that carries the trailer text as pasted after the `#`, but never what this page refuses to decode. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

- **TLS secrets: no link.** When the page finds a TLS provider section, or the text names a secret or a keylog line, there is no link at all, and the popover says why. Wireshark's own field list for the trailer ([f5ethtrailer display filter reference](https://www.wireshark.org/docs/dfref/f/f5ethtrailer.html), read 2026-10-27) includes `f5ethtrailer.tls.master_secret`, the client and server traffic secrets and `f5ethtrailer.tls.keylog`: the keys to the capture's own TLS sessions. Leaving them out would change what this page says about the trailer, so nothing is sent instead.
- **Bytes: only the header.** Pasted bytes go only when they are the trailer's header alone (the magic, the length and the version, 8 bytes in Wireshark's field list). Anything else, before or after it, can be the packet's own data or the trailer's provider sections, TLS secrets included, which this page never reads: no link, and the popover suggests sharing the Wireshark text view instead.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would and the page decodes it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
