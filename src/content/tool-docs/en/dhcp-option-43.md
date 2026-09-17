# DHCP option 43 generator

Give it a wireless controller address and the vendor of the access points, and it returns the value that vendor actually expects. Everything runs in the browser; the address never leaves the page.

## Why this is not just "convert an IP to hex"

RFC 2132 defines option 43 as *Vendor Specific Information* and then, deliberately, says nothing about what goes inside it. The contents are left entirely to each vendor. The result is that one option number carries at least four mutually incompatible encodings, and the failure mode when you pick the wrong one is the worst kind: the access point boots, takes an address, reads a value it cannot parse, and simply never joins. No error appears anywhere.

The four families:

**Binary TLV**: Cisco and UniFi. The address goes in as four raw bytes. `192.168.10.5` becomes `c0a80a05`.

**ASCII TLV**: Ruckus. The address goes in as *text*, one byte per character, dots included. `192.168.0.200` becomes `3139322e3136382e302e323030`. Ruckus's own knowledge base warns about exactly this: converting 10 to hex gives `0a`, but the ASCII for "10" is `31 30`. They are different values and only one of them works.

**Plain string**: Aruba and ExtremeWireless. No hex at all. The DHCP server sends the address as text, and a hex value here is wrong no matter how carefully it was built.

**A different option entirely**: FortiAP. It reads the controller address from option 138, the CAPWAP access-controller option, which is its factory default. Option 43 on a FortiGate exists to serve *other* vendors' access points, not Fortinet's own.

## Using it

Pick the vendor first. That order is deliberate: the same address produces four different answers, so there is no meaningful value to read until the vendor is chosen.

Enter the controller's management IP. Cisco accepts several, separated by spaces or commas, and encodes them in order; the others take one.

The result shows the value, and for hex vendors a byte-by-byte account of how it was assembled (sub-option, length, then the address) so you can check the arithmetic rather than trust it. Below that are ready-to-paste lines for ISC dhcpd, Cisco IOS, Windows Server and MikroTik.

## What it tells you that a hex box cannot

**When option 60 is also required.** Aruba access points only ask for vendor-specific information when the vendor class identifier matches, so option 43 without option 60 set to `ArubaAP` does nothing at all. ExtremeWireless needs a VCI too, and it varies by AP generation: older models use `HiPath` followed by the model name, newer ones just the model.

**When the answer is not hex.** For Aruba and ExtremeWireless the tool returns a string and says so, because handing back a plausible-looking hex value would be worse than returning nothing.

**When you are asking about the wrong option.** For FortiAP it returns option 138 and explains why.

## Sources

Every vendor profile is built from that vendor's own documentation, and every golden vector is a worked example published by the vendor rather than a value this tool generated and then enshrined. That distinction matters: a vector produced by the code under test proves only that the code agrees with itself.

- RFC 2132 section 8.4, Vendor Specific Information
- Cisco document 97066, *Configure DHCP Option 43 for Lightweight Access Points*
- Ruckus knowledge base article 000008703, *Understanding DHCP Option 43 Hexadecimal code*
- Ubiquiti help article 204909754, *Layer 3 Adoption for Remote UniFi Controllers*
- Extreme Networks, *ExtremeCloud IQ Controller Deployment Guide*, and the Fabric Engine user guide for sub-option 226
- HPE Aruba Networking, DHCP options for access points
- Fortinet, *FortiWiFi and FortiAP Configuration Guide*, discovery types

## A deliberate omission

Aerohive is not offered. It was acquired by Extreme in 2019 and folded into ExtremeCloud IQ, and no vendor documentation for a standalone Aerohive sub-option could be found, only community claims. The only documented sub-option 226 belongs to Fabric Engine switches talking to ExtremeCloud IQ, which is a different device class answering a different question. A value pasted into production DHCP is the worst possible place to be approximately right, so until a vendor source exists, Aerohive stays out. If you have that documentation, it can be added in an afternoon.
