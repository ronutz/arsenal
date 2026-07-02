## What it does

Parse an IPv6 address or prefix and see it from every angle: its canonical short form and its fully expanded form, what kind of address it is, the prefix math for a block, a hardware MAC address if one is embedded in the interface identifier, and the reverse-DNS name that points back to it. Everything is computed in your browser.

## Canonical and expanded forms

An IPv6 address is 128 bits, written as eight groups of four hexadecimal digits separated by colons. The same address can be written many ways, so RFC 5952 defines one canonical form: lowercase, with the leading zeros in each group removed and the single longest run of all-zero groups collapsed to `::`. The tool shows that canonical form and, alongside it, the fully expanded form with every group written out in full, which is the version you want when you need to see all 128 bits or line addresses up by column. For example, `2001:0db8:0000:0000:0000:0000:0000:0001` expands from, and canonicalizes to, `2001:db8::1`.

## Classification and prefix math

Not every address is a normal public one. The tool classifies special-use ranges: the loopback `::1`, the unspecified address `::`, link-local addresses in `fe80::/10`, unique-local addresses in `fc00::/7` (RFC 4193), the documentation range `2001:db8::/32` reserved by RFC 3849, and IPv4-mapped addresses. When you give it a prefix, it computes the block's network address, its first and last address, and how many addresses it spans, the same arithmetic the CIDR tool does for IPv4 but on a 128-bit field.

## EUI-64 and reverse DNS

Two extras fall out of the address. If the interface identifier was built from a network card's 48-bit MAC using the modified EUI-64 method (RFC 4291, Appendix A), the tool recovers that MAC, which is why privacy extensions exist to avoid leaking it. And it builds the `ip6.arpa` reverse-DNS name: the address's nibbles in reverse order, dot-separated, ending in `.ip6.arpa`, which is what a PTR lookup for the address uses.

## Using it

Paste an IPv6 address to see its canonical and expanded forms, its classification, any embedded MAC, and its reverse-DNS name, or paste a prefix to add the block math. The parse is deterministic and reads only the address you give it.
