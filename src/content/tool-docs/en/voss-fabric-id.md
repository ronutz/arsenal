## What it does

Extreme's Fabric Connect (SPBM) names things with three numbers, and this tool decodes whichever one you paste, auto-detecting it by shape:

- an **I-SID**, a 24-bit service identifier (1 to 16,777,215) that names a service instance in the fabric;
- a **nickname**, a 20-bit node identifier written `X.XX.XX` in hex; and
- a **system-id / B-MAC**, a 48-bit MAC-form address written as a dotted triple like `00bb.0021.0001`.

It runs entirely in your browser.

## The I-SID

The I-SID is the heart of a fabric service. A customer VLAN mapped to an I-SID is a Layer 2 VSN; a VRF mapped to an I-SID is a Layer 3 VSN; the global routing table carried over IS-IS with no I-SID is IP Shortcuts. The number itself does not encode which of these it is - that is set by how you provision it - so the tool validates the 24-bit range and explains usage rather than guessing a type. The default Fabric Attach network I-SID (FAN) is 16777001, which the tool calls out.

## The nickname

Every SPBM node carries a 20-bit nickname, written as one hex digit, a dot, two hex digits, a dot, two hex digits (for example `C.30.00`). It must be unique across the fabric, including across adjacent IS-IS areas. The tool converts the `X.XX.XX` form to and from its integer value and range-checks it. Dynamic nickname assignment hands out nicknames from a server prefix range such as `C.30.00-C.3F.FF`.

## The system-id / B-MAC

The nodal B-MAC, configured as the IS-IS system-id, is a 48-bit address. The tool reads the two significant bits of its first octet: the U/L bit (Extreme's guidance is to use a locally administered address, first octet `02`) and the I/G bit (a node address should be individual, not group).

## Using it

Paste a decimal I-SID, an `X.XX.XX` nickname, or a dotted-triple B-MAC. Detection is by shape, so there is nothing to select.

## Share results

Under the reading, **Share results** builds a link to this page, only when you press it, that carries the identifier as typed (`#input=C.30.00`), and nothing else. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; an identifier is far shorter.
- **Opening a link.** The link is the same address other links into this tool use: the identifier fills the field and is decoded as typing would. As with every link into this tool, the value stays after the `#` until you change or clear the field, and then leaves the address without a request.
