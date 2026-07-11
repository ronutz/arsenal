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
