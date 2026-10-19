# DHCP option 43 generator

Give it a wireless controller address and the vendor of the access points, and it returns the value that vendor actually expects. Everything runs in the browser; the address never leaves the page.

## Why this is not just "convert an IP to hex"

RFC 2132 defines option 43 as *Vendor Specific Information* and leaves its contents to each vendor: "The definition of this information is vendor specific." It only recommends a layout: a vendor that puts more than one item in the option "SHOULD encode the option using 'Encapsulated vendor-specific options'", a sequence of sub-option, length and value fields. What the sub-options mean, and how an address is written inside them, is still the vendor's choice. The result is that one option number carries at least four mutually incompatible encodings, and the failure mode when you pick the wrong one is the worst kind: the access point boots, takes an address, reads a value it cannot parse, and simply never joins. No error appears anywhere.

The four families:

**Binary TLV**: Cisco and UniFi. The address goes in as four raw bytes. `192.168.10.5` becomes `c0a80a05`.

**ASCII TLV**: RUCKUS. The address goes in as *text*, one byte per character, dots included. RUCKUS knowledge base article 000008703 puts the rule as "For each number, the ASCII translation is “3” plus the number in decimal" and "For the “.” character, the ASCII code is “2e”", and its own example writes `192.168.1.120` as `060d3139322e3136382e312e313230`: sub-option `06`, length `0d` (13 characters), then the 13 characters as text. So 10 written as a binary byte is `0a`, but written as text it is `31 30`. They are different values and only one of them works for a given vendor.

**Text inside sub-option 1**: ExtremeWireless. Extreme's deployment guide declares the sub-option as `option HAP.HWC code 1 = text;` and its example carries two controllers in one value, `"10.100.2.36, 10.100.2.22"`, so the tool writes sub-option `01`, the length, then the addresses as text with a comma and a space between them: that example becomes `011831302e3130302e322e33362c2031302e3130302e322e3232`.

**Plain string**: Aruba. No hex at all. The DHCP server sends the address as text, and a hex value here is wrong no matter how carefully it was built.

**A different option entirely**: FortiAP. It reads the controller address from option 138, the CAPWAP access-controller option: "The FortiAP acquires the IP address of an AC in DHCP option 138 (the factory default)". Fortinet also documents that "If Option 138 is used for some other purpose on your network, you can use a different option number if you configure the AP units to match."

## Using it

Pick the vendor first. That order is deliberate: the same address produces four different answers, so there is no meaningful value to read until the vendor is chosen.

Enter the controller's management IP. Cisco accepts several, separated by spaces or commas, and encodes them in order; the others take one.

The result shows the value, and for hex vendors a byte-by-byte account of how it was assembled (sub-option, length, then the address) so you can check the arithmetic rather than trust it. Below that are ready-to-paste lines for ISC dhcpd, Cisco IOS, Windows Server and MikroTik.

## What it tells you that a hex box cannot

**When option 60 is also required.** Aruba access points only ask for vendor-specific information when the vendor class identifier matches, so option 43 without option 60 set to `ArubaAP` does nothing at all. ExtremeWireless needs a VCI too, and it varies by AP generation: older models use `HiPath` followed by the model name, newer ones just the model.

**When the answer is not hex.** For Aruba the tool returns a string and says so, because handing back a plausible-looking hex value would be worse than returning nothing.

**When you are asking about the wrong option.** For FortiAP it returns option 138 and explains why.

## API

The same engine answers the `/api/v1/dhcp-option-43` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** `{"vendor": "<id>", "addresses": "<addresses>"}`. The vendor ids are `cisco-wlc`, `ruckus-zonedirector`, `ruckus-smartzone`, `unifi-ip`, `extreme-wireless`, `extreme-cloudiq-switch`, `aruba` and `fortiap`; the addresses are separated by spaces, commas or semicolons.
- **Response.** `vendor` (the profile used: `encoding`, `subOption`, `addressForm`, `multiple`, `vendorClass`, `useOption` and `source`), `addresses`, `option` (43, or 138 for FortiAP), `encoding`, `hex` or `text`, `breakdown`, `serverSnippets` and `notes` (stable codes).
- **Errors.** HTTP 400, `invalid_input`, with the engine's message: no address, an unknown vendor, an address that is not a strict dotted quad, more than one address for a vendor that takes one, or a value over 255 bytes.

Since 2026-10-19 `extreme-wireless` answers a hex value with `addressForm` `ascii-list` and `multiple` true: `{"vendor": "extreme-wireless", "addresses": "10.100.2.36, 10.100.2.22"}` answers `011831302e3130302e322e33362c2031302e3130302e322e3232`. `source.access_date` and `source.unreachable` say when each vendor page was last read, or why it could not be.

## Sources

Every vendor profile is built from that vendor's own documentation, and every golden vector names a document that prints its bytes, quoted as printed. A vector produced by the code under test and then credited to a vendor would prove only that the code agrees with itself, so none is. Two values come from secondary sources and are labelled as such: a worked Cisco example from a community repository on Cisco Code Exchange, and a RUCKUS example from a RUCKUS community post. RUCKUS's knowledge base gives the sub-option only as "03 or 06"; the assignment of 3 to ZoneDirector comes from a RUCKUS community post, so the ZoneDirector vector pins only the two bytes the documents print.

- RFC 2132 section 8.4, Vendor Specific Information (read 2026-10-19)
- Cisco document 97066, *Configure DHCP OPTION 43 for Lightweight Access Points*, updated July 22, 2026 (read 2026-10-19)
- Cisco Code Exchange, cisco43calc README by Brett Verney, a community repository (secondary; read 2026-10-19)
- RUCKUS knowledge base article 000008703, *Understanding DHCP Option 43 Hexadecimal code in Ruckus*, updated May 06, 2020 (read 2026-10-19)
- RUCKUS Networks Community, *How the APs discover the IP address of the controller* and *AP Discovery: How to configure DHCP option 43 to discover the controller*, posts by RUCKUS Team Members (secondary; read 2026-10-19)
- Fortinet, *FortiWiFi and FortiAP Configuration Guide*: *Discovering, authorizing, and deauthorizing FortiAP units* (7.2.5) and *Advanced WiFi controller discovery* (8.0.1) (read 2026-10-19)
- Ubiquiti help article 204909754, *Layer 3 Adoption for Remote UniFi Controllers* (could not be re-read on 2026-10-19: the site answered with a bot challenge)
- Extreme Networks, *ExtremeCloud IQ Controller Deployment Guide*, and the Fabric Engine user guide for sub-option 226 (the ExtremeCloud IQ Controller pages were read with HTTP 200 on 2026-10-18; on 2026-10-19 the documentation site answered 401 and could not be re-read)
- HPE Aruba Networking, DHCP options for access points (could not be re-read on 2026-10-19: access denied)

## A deliberate omission

Aerohive is not offered. It was acquired by Extreme in 2019 and folded into ExtremeCloud IQ, and no vendor documentation for a standalone Aerohive sub-option could be found, only community claims. The only documented sub-option 226 belongs to Fabric Engine switches talking to ExtremeCloud IQ, which is a different device class answering a different question. A value pasted into production DHCP is the worst possible place to be approximately right, so until a vendor source exists, Aerohive stays out. If you have that documentation, it can be added in an afternoon.
