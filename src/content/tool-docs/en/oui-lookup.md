## What it does

A MAC address is a 48-bit hardware address, usually written as six hex bytes like `00:1b:54:11:22:33`. The first three bytes are the OUI (Organizationally Unique Identifier), which the IEEE assigns to a manufacturer. This tool takes a MAC (in any common format) or a bare OUI, looks the OUI up in an embedded snapshot of the IEEE MA-L registry to name the manufacturer, and reads the two meaningful bits of the first byte. It also recognises addresses whose meaning a standard sets rather than a manufacturer: multicast mappings, VRRP virtual routers, IANA assignments and well-known group addresses. It all runs in your browser.

## The two bits that matter

The very first byte of a MAC carries two flags in its low bits:

- The **I/G bit** (least significant bit) is unicast when 0 and multicast when 1. A multicast address is a group address, not a single interface.
- The **U/L bit** (second-least significant bit) is universal when 0 and locally administered when 1. A universally administered address is globally unique and drawn from a manufacturer's OUI; a locally administered address was set by software (a hypervisor, a bonded interface, a randomized Wi-Fi MAC) and has no manufacturer.

So `02:...` is locally administered (there is no vendor to find), and `01:...` is multicast. The one standard exception is `33-33`, below: it has the Local bit on but is the IPv6 multicast mapping, not a software-chosen address (RFC 9542 section 2.3.1).

## Multicast mappings

- **IPv4 multicast, `01-00-5E-00-00-00` to `01-00-5E-7F-FF-FF`.** RFC 1112 section 6.4 maps a group by "placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00". A group address has 28 significant bits, so 5 bits are lost and 32 IPv4 groups share every MAC. The tool lists all 32: `01:00:5e:00:00:01` is shared by `224.0.0.1`, `224.128.0.1`, `225.0.0.1` and so on up to `239.128.0.1`. The upper half of the block is not IPv4: the IANA Ethernet Numbers registry assigns `01-00-5E-80-00-00` to `8F-FF-FF` to MPLS multicast (RFC 5332), and the tool says so.
- **IPv6 multicast, `33-33-xx-xx-xx-xx`.** RFC 2464 section 7 sends an IPv6 multicast packet to "the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets of DST". The tool shows those last 32 bits, so `33:33:00:00:00:01` carries `0000:0001`, the tail of `ff02::1`.

## VRRP and other IANA assignments

IANA holds the OUI `00-00-5E`. RFC 9568 section 7.3 builds a VRRP virtual router MAC as `00-00-5E-00-01-{VRID}` for IPv4 and `00-00-5E-00-02-{VRID}` for IPv6, where the VRID is "An integer value (1-255)". The tool shows, for example, `VRRP virtual router (IPv4), VRID 1` for `00:00:5e:00:01:01`, and flags a VRID of 0 as outside that range.

The other named rows of the IANA Ethernet Numbers registry are recognised too, each with the RFC the registry cites:

| Address or range | Meaning | Reference |
| --- | --- | --- |
| `00-00-5E-00-00-00` to `00-00-5E-00-00-FF` | Reserved | RFC 9542 |
| `00-00-5E-00-52-00`, `-01` | PacketPWEthA, PacketPWEthB | RFC 6658 |
| `00-00-5E-00-52-02` | BFD for VXLAN | RFC 8971 |
| `00-00-5E-00-52-13` | Proxy Mobile IPv6 | RFC 6543 |
| `00-00-5E-00-53-00` to `00-00-5E-00-53-FF` | Documentation (unicast) | RFC 9542 |
| `00-00-5E-90-01-00` and `01-00-5E-90-01-00` | TRILL OAM | RFC 7455 |
| `01-00-5E-80-00-00` to `01-00-5E-8F-FF-FF` | MPLS Multicast | RFC 5332 |
| `01-00-5E-90-00-00` | MPLS-TP p2p | RFC 7213 |
| `01-00-5E-90-00-01` | BFD on Link Aggregation Group (LAG) interfaces | RFC 7130 |
| `01-00-5E-90-00-02`, `-03` | AllL1MI-ISs, AllL2MI-ISs | RFC 8202 |
| `01-00-5E-90-10-00` to `01-00-5E-90-10-FF` | Documentation (multicast) | RFC 9542 |

## Well-known group addresses

| Address | Name | Standard |
| --- | --- | --- |
| `01-80-C2-00-00-00` | Bridge Group address / Nearest Customer Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX |
| `01-80-C2-00-00-01` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-02` | IEEE 802.3 Slow_Protocols_Multicast address | IEEE 802.1Q, 802.1AX |
| `01-80-C2-00-00-03` | Nearest non-TPMR Bridge group address / IEEE Std 802.1X PAE address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX, 802.1BR |
| `01-80-C2-00-00-04` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-05`, `-06` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-07` | MEF Forum ELMI protocol group address (not exclusively reserved for this purpose) | IEEE 802.1Q |
| `01-80-C2-00-00-08` | Provider Bridge group address | IEEE 802.1Q |
| `01-80-C2-00-00-09`, `-0A` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0B` | EDE-SS PEP Address | IEEE 802.1Q, 802.1X, 802.1AE |
| `01-80-C2-00-00-0C` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0D` | Provider Bridge MVRP address | IEEE 802.1Q |
| `01-80-C2-00-00-0E` | Individual LAN Scope group address / Nearest Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AS |
| `01-80-C2-00-00-0F` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-14` | All Level 1 Intermediate Systems (IS-IS AllL1ISs) | ISO/IEC 10589 |
| `01-80-C2-00-00-15` | All Level 2 Intermediate Systems (IS-IS AllL2ISs) | ISO/IEC 10589 |
| `09-00-2B-00-00-04` | All End System Network Entities (ES-IS AllEndSystems) | ISO 9542 |
| `09-00-2B-00-00-05` | All Intermediate System Network Entities (AllIntermediateSystems) | ISO 9542 |

The names are the IEEE Registration Authority's, from its public listing of standard group MAC addresses. The IS-IS values match the constants table of RFC 1142, the 1990 republication of ISO DP 10589. For the 16 addresses `01-80-C2-00-00-00` to `0F`, the IEEE tutorial on standard group addresses says frames sent to them "are not relayed by MAC bridges conforming to IEEE 802.1D", and the tool adds that note. Other group addresses in `01-80-C2` (for example the `01-80-C2-00-00-30` to `3F` range for CCM and Linktrace messages) are not in the table yet and show as not in the MA-L snapshot.

## Formats it accepts

Colon (`00:1b:54:...`), hyphen (`00-1b-54-...`), Cisco dotted (`001b.5411.2233`), and unseparated (`001b5411...`) forms all work, in upper or lower case, as does a bare six-hex OUI. A bare OUI is matched to a standard meaning only where three bytes decide it (`33-33-xx` is always IPv6 multicast); `01-00-5E` alone could be IPv4 or MPLS multicast, so the tool needs the full address.

## About the data

The vendor names come from the IEEE MA-L (OUI) public listing, embedded here as a point-in-time snapshot. Because it is a snapshot, a very recently assigned block may not be present yet, and this build covers the MA-L (24-bit) registry, not the smaller MA-M (28-bit) or MA-S (36-bit) blocks. The snapshot is lazy-loaded when you do your first lookup, so opening the page is fast and nothing is ever fetched from a server at lookup time. The standard-defined addresses above are a small fixed table in the code, each row tied to its source.

## Using it

Type or paste a MAC address or an OUI. A locally administered or unknown address is reported honestly rather than guessed at.

## Share results

Under the reading, **Share results** builds a link to this page, only when you press it, that carries the MAC address or OUI as typed (`#input=00%3A1b%3A54%3A11%3A22%3A33`), and nothing else. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; an address is far shorter.
- **Opening a link.** The link is the same address other pages use to hand a MAC address to this tool: the value fills the field and is looked up as a paste would (the vendor table loads from this site on the first lookup, as it does for a paste). As with every link into this tool, the value stays after the `#` until you change or clear the field, and then leaves the address without a request.

## API

The same engine answers the `/api/v1/oui-lookup` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** The MAC address or OUI as text, in any notation the page accepts.
- **Response.** `ok`, `input`, `hex`, `formatted`, `oui`, `ouiFormatted`, `vendor` (or `null`), `multicast`, `local`, `isOuiOnly`, `notes` (sentences in English) and, when a standard or registry gives the address its meaning, `wellKnown`: `kind` (`ipv4-multicast`, `ipv6-multicast`, `vrrp-ipv4`, `vrrp-ipv6`, `iana-block` or `group-address`), `name`, `standard`, and by kind `ipv4Groups` (the 32 groups), `ipv6Low32`, `vrid` or `bridgeFiltered`.
- **Errors.** An input that is not a MAC or an OUI is not an HTTP error: the API answers `ok: false` with `error.message`.

`wellKnown` was added on 2026-10-19.

## Sources

- [IEEE Registration Authority: MA-L (OUI) public listing](https://standards-oui.ieee.org/oui/oui.csv) (snapshot of 2026-07-10)
- [RFC 1112: Host Extensions for IP Multicasting, section 6.4](https://www.rfc-editor.org/rfc/rfc1112) (read 2026-10-19)
- [RFC 2464: Transmission of IPv6 Packets over Ethernet Networks, section 7](https://www.rfc-editor.org/rfc/rfc2464) (read 2026-10-19)
- [RFC 9568: Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, section 7.3](https://www.rfc-editor.org/rfc/rfc9568) (read 2026-10-19)
- [RFC 9542: IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, sections 2.1.3, 2.1.4 and 2.3.1](https://www.rfc-editor.org/rfc/rfc9542) (read 2026-10-19)
- [IANA Ethernet Numbers registry: IANA Unicast and Multicast 48-bit MAC Addresses (last updated 2026-10-13)](https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.txt) (read 2026-10-19)
- [IEEE Registration Authority: Standards Group MAC public listing](https://standards.ieee.org/products-programs/regauth/grpmac/public/) (read 2026-10-19)
- [IEEE Registration Authority: Standard Group MAC Addresses: A Tutorial Guide (PDF)](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf) (read 2026-10-19)
- [RFC 1142: OSI IS-IS Intra-domain Routing Protocol (republication of ISO DP 10589)](https://www.rfc-editor.org/rfc/rfc1142) (read 2026-10-19)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
