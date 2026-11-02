## What it does

An Ethernet switch never sees an IP multicast group. It sees a destination MAC address computed from the group, and the computation throws bits away. This mapper does that computation both ways, in your browser:

- **A group to its MAC.** Type an IPv4 group (224.0.0.0 to 239.255.255.255) or an IPv6 group (ff00::/8) and the page shows its MAC address, which bits of the group reach the MAC and which are lost, where the group sits in IANA's registries, and, for IPv4, the 32 groups that share the same MAC.
- **A MAC to its groups.** Type a multicast MAC in colon (`01:00:5e:01:01:01`), hyphen (`01-00-5E-01-01-01`) or Cisco dot (`0100.5e01.0101`) notation. An IPv4 MAC gives the 32 groups that could have produced it, each with its block and IANA's name where it has one; an IPv6 MAC gives the pattern every matching group follows and the addresses IANA names with those last 32 bits.

Every MAC is shown in all three notations, each with a copy button, and **Read this MAC back** turns a group's reading into the reverse one. It is the arithmetic of the [Multicast: what it costs to not flood](/learn/multicast-what-it-costs-to-not-flood) article, and of chapter 4.7 of the open course LAN Switch Operations and Maintenance, where `show igmpsnooping mfdb` lists the MAC address of each group.

## IPv4: 23 bits of 28

RFC 1112 defines host groups as the addresses with "1110" as their high-order four bits, 224.0.0.0 to 239.255.255.255; addresses that begin with "1111" are "reserved for future addressing modes", and 224.0.0.0 "is guaranteed not to be assigned to any group" (section 4). It maps a group onto Ethernet "by placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00 (hex)", and adds: "Because there are 28 significant bits in an IP host group address, more than one host group address may map to the same Ethernet multicast address" ([RFC 1112](https://www.rfc-editor.org/rfc/rfc1112.txt), section 6.4).

So the page splits the group's 32 bits into three parts: the four bits 1110 that mark every group, the next five bits, which no MAC carries, and the low 23 bits, which follow 01-00-5E. Five lost bits make 2^5 = 32 groups per MAC, and the page lists them in numeric order with the group you typed marked. 224.1.1.1, 239.1.1.1 (the course's lab group) and 239.129.1.1 all map to 01-00-5E-01-01-01.

IANA's half of its own OUI confirms the shape: 01-00-5E-00-00-00 to 01-00-5E-7F-FF-FF is assigned to IPv4 multicast, so the 25th bit of the MAC, the top bit of its fourth octet, is always 0 ([RFC 9542](https://www.rfc-editor.org/rfc/rfc9542.txt), section 2.1.3). RFC 9542 is the current version of these IANA rules; it obsoletes RFC 7042.

## What a switch can and cannot tell apart

RFC 4541 says IGMP snooping switches "may maintain forwarding tables based on either MAC addresses or IP addresses", and that "IP address based forwarding is preferred because the mapping between IP multicast addresses and link-layer multicast addresses is ambiguous. In the case of Ethernet, there is a multiplicity of 1 Ethernet address to 32 IP addresses" ([RFC 4541](https://www.rfc-editor.org/rfc/rfc4541.txt), section 2.1.2). Its questionnaire asks vendors whether 224.1.2.3 and 239.129.2.3, two groups on one MAC, are forwarded on the same ports (section 4). A table keyed on the MAC cannot keep the 32 groups apart; a table keyed on the IP address can. A host that joins one group can receive frames for the other 31, and its IP layer discards them "without generating any error report or log entry" (RFC 1112, sections 7.2 and 7.3).

The same RFC says that packets to the 224.0.0.X range "which are not IGMP must be forwarded on all ports" (section 2.1.2), and its questionnaire asks whether frames to 01:00:5E:00:00:01 to 01:00:5E:00:00:FF are forwarded on all ports whatever the joins (section 4). When a group shares its MAC with an address in 224.0.0.1 to 224.0.0.255 (225.0.0.1, 232.0.0.1, 239.128.0.1 and every other group whose low 23 bits are below 0x100), the page warns: a switch that floods by MAC floods that group too. RFC 4607 makes the same point for SSM: "SSM destinations in 232.0.0.0/24 and 232.128.0.0/24 use the same link-layer addresses as the reserved IP multicast group range 224.0.0.0/24" (section 9). 224.0.0.0 itself is never a destination, so a MAC shared only with it gets no warning.

## Where an IPv4 group sits

- **Block**, as IANA's IPv4 Multicast Address Space registry (last updated 2026-08-20) and RFC 5771 (sections 3 to 10) divide the space: Local Network Control (224.0.0.0/24), Internetwork Control (224.0.1.0/24), AD-HOC Blocks I, II and III, SDP/SAP (224.2.0.0/16), DIS Transient Groups (224.252.0.0/14), Source-Specific Multicast (232.0.0.0/8), GLOP (233.0.0.0 to 233.251.255.255), unicast-prefix-based (234.0.0.0/8), Administratively Scoped (239.0.0.0/8) and the reserved ranges between them.
- **Scope**, as RFC 2365 maps it (sections 6 and 8): link-local for 224.0.0.0/24, global for 224.0.1.0 to 238.255.255.255, and inside 239.0.0.0/8 the IPv4 Local Scope (239.255.0.0/16), the IPv4 Organization Local Scope (239.192.0.0/14), the ranges kept for each of them to grow into (239.253.0.0/16 and 239.254.0.0/16; 239.0.0.0/10, 239.64.0.0/10 and 239.128.0.0/10) and the rest, which RFC 2365 names no scope for.
- **IANA's name**, from the registry: every row of the Local Network Control and Internetwork Control blocks (224.0.0.5 is "OSPFIGP All Routers", 224.0.0.22 "IGMP", 224.0.1.129 "PTP-primary"), the SDP/SAP rows, the three SSM rows, MCAST-TEST-NET (233.252.0.0/24) and the relative addresses of the two scopes, counted down from 239.255.255.255 and 239.195.255.255 (RFC 2365, section 9: 239.255.255.250 is relative address 5, SSDP). Rows the registry marks Unassigned name nothing, and the AD-HOC blocks' assignments to organisations are named by their block only.
- **GLOP**: 233.X.Y.0/24 belongs to the 16-bit autonomous system X.Y ([RFC 3180](https://www.rfc-editor.org/rfc/rfc3180.txt), section 3); 233.22.30.1 is in the /24 of AS 5662, the RFC's own example.
- **Unicast-prefix-based**: a 234/8 group shifted left by 8 bits gives the unicast prefix of the organisation that may use it ([RFC 6034](https://www.rfc-editor.org/rfc/rfc6034.txt), section 3); 234.192.0.2 gives 192.0.2.0/24.
- Documentation addresses are marked as such: 233.252.0.0/24, relative offset 10 (239.255.255.245) and the GLOP prefixes of AS 64496 to 64511 ([RFC 6676](https://www.rfc-editor.org/rfc/rfc6676.txt), section 2).

## IPv6: 32 bits of 128

RFC 2464 sends an IPv6 multicast packet to "the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets of DST" ([RFC 2464](https://www.rfc-editor.org/rfc/rfc2464.txt), section 7); RFC 9542 confirms that 33-33-00-00-00-00 to 33-33-FF-FF-FF-FF is used for IPv6 multicast (section 2.3.1). The first 96 bits are lost: for each flags and scope value 2^(112 - 32) addresses, "more than 1.2e24", share a MAC (RFC 4541, section 3), 2^88 in all, so ff02::101 and ff05::101 share 33-33-00-00-01-01. RFC 3307 keeps group IDs, the low-order 32 bits, short enough that they "will generate unique link-layer addresses within a given multicast scope" ([RFC 3307](https://www.rfc-editor.org/rfc/rfc3307.txt), section 2), and RFC 4541 recommends that "IPv6 address based forwarding is preferred to MAC address based forwarding" (section 3).

The page also reads what the address says about itself:

- **Flags**, treated as separate bits as RFC 7371 requires (section 3): T = 0 for a "permanently-assigned ("well-known")" address and T = 1 for a transient one ([RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.txt), section 2.7); P for unicast-prefix-based addresses ([RFC 3306](https://www.rfc-editor.org/rfc/rfc3306.txt), section 4, where P = 1 requires T = 1); R for an embedded RP ([RFC 3956](https://www.rfc-editor.org/rfc/rfc3956.txt), as updated by [RFC 7371](https://www.rfc-editor.org/rfc/rfc7371.txt)); X, kept "for future assignment".
- **Scope**, by the table of RFC 4291 section 2.7 as updated by [RFC 7346](https://www.rfc-editor.org/rfc/rfc7346.txt) (scope 3 is Realm-Local), with RFC 4291's rules for scopes 0, 1 and F, and RFC 4541's note that ff00::/15 never appears on the link.
- **SSM**: P = 1, T = 1 and plen 0 make an SSM address ([RFC 4607](https://www.rfc-editor.org/rfc/rfc4607.txt), section 1), ff3x::/32 and, with the X flag set, ffbx::/32 too (RFC 7371). The group ID's range is named: invalid below 0x40000000, 0x40000000 reserved as a null value, IANA allocation to 0x7FFFFFFF, dynamic allocation by hosts above it (sections 1 and 4.3).
- **Unicast-prefix-based and embedded RP**: with P = 1 and plen 1 to 64, the prefix of the network that owns the group; with R = 1 too, the RP, made by copying "the first "plen" bits of the "network prefix"" to a zeroed address and putting the RIID in its last 4 bits (RFC 3956, section 4). An RIID of 0, an RP in fe80::/10, ::/16 or ff00::/8, a plen over 64 and non-zero reserved bits are flagged with the rule they break.
- **Solicited-node**: ff02::1:ffXX:XXXX is formed from "the low-order 24 bits of an address (unicast or anycast)" (RFC 4291, section 2.7.1), and the page names those 24 bits.
- **IANA's names**, from the IPv6 Multicast Address Space registry (last updated 2026-04-07): the node-local, link-local, site-local and variable-scope tables, ff0X::db8:0:0/96 for documentation (RFC 6676, section 3), and the Dynamic Multicast Group IDs registry that RFC 10028 created in August 2026 for group IDs of 0x80000000 and above (MADCAP, host allocation of SSM group addresses, private and experimental use, solicited-node).

An address may carry a zone index after `%`, such as `ff02::1%eth0` (RFC 9844 shows the same form, `fe80::1234%eth0`, on a Linux host). The tool sets it aside: zone identifiers "have purely local meaning within the node in which they are defined" ([RFC 9844](https://www.rfc-editor.org/rfc/rfc9844.txt), section 1, updating [RFC 4007](https://www.rfc-editor.org/rfc/rfc4007.txt), section 11), so the group and its MAC are the same without it. IPv6 groups are printed in RFC 5952's canonical text ([RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt), section 4).

## What it refuses, and why

- **A unicast address**: an IPv4 address below 224.0.0.0, or an IPv6 address that does not begin with ff. An IPv4-mapped IPv6 address such as `::ffff:224.0.0.1` does not begin with ff either (RFC 4291 lists it among the unicast addresses, section 2.5.5.2), so it is refused too.
- **240.0.0.0 and above**: these begin with 1111, reserved by RFC 1112.
- **A unicast MAC**: its group bit, the lowest bit of the first octet, is 0 ([RFC 9542](https://www.rfc-editor.org/rfc/rfc9542.txt), section 2.1.1).
- **The upper half of 01-00-5E** (01-00-5E-80-00-00 and above): the 25th bit is 1, so no IPv4 group maps there. The refusal names IANA's row from the IANA OUI Ethernet Numbers registry (last updated 2026-10-13): MPLS Multicast for 01-00-5E-80-00-00 to 01-00-5E-8F-FF-FF, the single assignments at 01-00-5E-90-00-00 to 01-00-5E-90-00-03 and 01-00-5E-90-01-00, documentation at 01-00-5E-90-10-00 to 01-00-5E-90-10-FF, and Unassigned elsewhere.
- **The broadcast address and other group MACs** (01-80-C2-00-00-00, an SPBM backbone group such as 03-00-10-00-00-64): no IP group maps to them. The page points to the [OUI / MAC vendor lookup](/tools/oui-lookup), which reads standard group addresses, and the [SPBM multicast address builder](/tools/extreme-spbm-multicast-mac), which computes SPBM's own.
- **Malformed text**: an octet over 255, a leading zero (some systems read it as octal), a prefix length, IPv6 text that breaks RFC 4291's rules, a MAC with five octets, mixed separators or bare hex, more than one line or more than 80 characters. Each refusal says what it expected.

## Worked examples

- **The Example, 233.252.0.1** (MCAST-TEST-NET, the Learn article's worked group): binary 1110 10011 11111000000000000000001; the five bits 10011 are lost and 0x7C0001 follows 01-00-5E, giving 01-00-5E-7C-00-01, which 224.124.0.1, 224.252.0.1, 239.124.0.1 and 239.252.0.1 share among the 32.
- **224.0.0.1** maps to 01-00-5E-00-00-01, shared with 239.128.0.1 (the article's pair); typing 239.128.0.1 brings the warning that a switch flooding 224.0.0.x by MAC floods it too.
- **01:00:5e:00:00:16**, the destination of the article's captured IGMPv3 report, reads back to 224.0.0.22, "IGMP", and 31 more, among them 232.0.0.22 and 232.128.0.22 in the SSM block.
- **ff02::1:ff0e:8c6c**, RFC 4291's solicited-node example, maps to 33-33-FF-0E-8C-6C; read back, that MAC names ff02::1:ff0e:8c6c and ff02::2:ff0e:8c6c (Node Information Queries).
- **ff02::9 and ff32::8000:9**, RFC 3307's two examples, map to 33-33-00-00-00-09 and 33-33-80-00-00-09.
- **ff7e:120:2001:db8::1234**, built from RFC 6676's embedded-RP example, gives the RP 2001:db8::1.

## What it does not do

It does not see your network: it cannot tell which of the 32 groups is actually in use, whether your switch keys its table by MAC or by IP address, or whether it floods 224.0.0.x by MAC. It maps on Ethernet only, as RFC 1112 and RFC 2464 define; RFC 6085 adds that an IPv6 multicast packet may in some circumstances be sent to a unicast MAC, and a receiver "MUST NOT drop the packet" for that ([RFC 6085](https://www.rfc-editor.org/rfc/rfc6085.txt), section 3), which the tool does not model. IANA's names are those of the registries as read on 2 November 2026; the registries change, and the AD-HOC blocks' assignments are named by block only. Administrative scopes are configured per network: the tool knows only the ranges RFC 2365 names, and computes relative addresses for the Local and Organization Local Scopes only.

## Share results

Under the headline, **Share results** builds a link to this page, only when you press it and only while the page shows a reading, that carries the field as typed after the `#`, as `input`. A multicast group or a multicast MAC names a group, not a host or a person; an input the tool refuses, a unicast address among them, gets no link.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-02) has the fragment "separated from the rest of the URI prior to a dereference", so the value is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; the field holds at most 80.
- **Opening a link.** The field is filled as a paste would fill it, and the page maps it. A value that is blank, on more than one line or longer than 80 characters is ignored. Accepted or not, the value then leaves the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

## Provenance

The engine is fixed arithmetic over the rules above and two packed tables generated from the IANA registries' XML, with no clock, no network and no randomness. It ships 140 golden vectors (set `multicast-mac-mapper-golden-2026-11-02`): both directions, both IP versions and all three MAC notations; every IPv4 block at its boundaries, every RFC 2365 scope, relative addresses, GLOP, UBM and MCAST-TEST-NET; the 32:1 collision with its 32 groups pinned for several MACs; IPv6 flags, scopes, SSM ranges, unicast-prefix and embedded-RP addresses, solicited-node addresses and IANA's names; and 42 refusals. Every expected value was derived by a separate implementation (Python's ipaddress module and plain integer arithmetic, with its own reading of the registries), not by running this engine, and a run comparing every field the oracle computes found no difference.

## API

The same engine answers `/api/v1/multicast-mac-mapper` on the site's HTTP API; the contract is on the [API page](/api), which also says whether this site serves the API.

- **Request.** Plain text, as typed in the field: `?input=233.252.0.1` on GET, or the value as the POST body.
- **Response.** `direction` (`forward` or `reverse`) and `family` (`ipv4` or `ipv6`), then by reading: an IPv4 group gives `group`, `groupHex`, `bits` (`prefix`, `lost`, `kept`), `keptHex`, `mac` (`colon`, `hyphen`, `dot`), `macBits`, `block`, `blockName`, `blockRange`, `scope`, `scopeName`, `registered`, `table`, `glopAs`, `ubmPrefix`, `relativeOffset`, `sharing` (32 objects with `group`, `block`, `scope`, `registered`, `table`), `sharesLocalControl`; an IPv4 MAC gives `notation`, `mac`, `macBits`, `kept`, `keptHex`, `pattern` and `candidates` (32 objects); an IPv6 group gives `group`, `exploded`, `zone`, `flags` (`bits`, `x`, `r`, `p`, `t`), `scope`, `scopeId`, `scopeName`, `lostHex`, `low32Hex`, `mac`, `macBits`, `groupId`, `dynamicRow`, `ssm`, `unicastPrefix`, `plen`, `embeddedRp`, `riid`, `solicitedLow24`, `documentation`, `registered` and `sameMac`; an IPv6 MAC gives `notation`, `mac`, `macBits`, `low32Hex`, `pattern`, `groupId`, `dynamicRow`, `ssm`, `solicited` and `candidates`. Every reading carries `warnings` and `notes`. For the Example the API answers `mac.hyphen` `01-00-5E-7C-00-01` and `bits.lost` `10011`.
- **Errors.** HTTP 400, `invalid_input`, with the engine's message, for example `10.0.0.1 is not a multicast group: ...` or `01-00-5E-80-00-00 has the 25th bit set ...`.

## Sources

- [RFC 1112, Host Extensions for IP Multicasting, August 1989 (STD 5)](https://www.rfc-editor.org/rfc/rfc1112.txt) (read 2026-11-02): sections 4, 6.4, 7.2 and 7.3
- [RFC 2464, Transmission of IPv6 Packets over Ethernet Networks, December 1998](https://www.rfc-editor.org/rfc/rfc2464.txt) (read 2026-11-02): section 7
- [RFC 6085, Address Mapping of IPv6 Multicast Packets on Ethernet, January 2011](https://www.rfc-editor.org/rfc/rfc6085.txt) (read 2026-11-02): section 3, updating RFC 2464
- [RFC 9542, IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, April 2024 (BCP 141)](https://www.rfc-editor.org/rfc/rfc9542.txt) (read 2026-11-02): sections 2.1.1, 2.1.3, 2.1.4 and 2.3.1; obsoletes [RFC 7042](https://www.rfc-editor.org/rfc/rfc7042.txt) (read the same day)
- [IANA, IANA OUI Ethernet Numbers registry](https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.xhtml), last updated 2026-10-13 (read 2026-11-02)
- [IANA, IPv4 Multicast Address Space registry](https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xhtml), last updated 2026-08-20 (read 2026-11-02)
- [RFC 5771, IANA Guidelines for IPv4 Multicast Address Assignments, March 2010 (BCP 51)](https://www.rfc-editor.org/rfc/rfc5771.txt) (read 2026-11-02): sections 3 to 10
- [RFC 2365, Administratively Scoped IP Multicast, July 1998 (BCP 23)](https://www.rfc-editor.org/rfc/rfc2365.txt) (read 2026-11-02): sections 3, 4, 6, 8 and 9
- [RFC 4607, Source-Specific Multicast for IP, August 2006](https://www.rfc-editor.org/rfc/rfc4607.txt) (read 2026-11-02): sections 1, 4.3 and 9
- [RFC 3180, GLOP Addressing in 233/8, September 2001 (BCP 53)](https://www.rfc-editor.org/rfc/rfc3180.txt) (read 2026-11-02): section 3
- [RFC 6034, Unicast-Prefix-Based IPv4 Multicast Addresses, October 2010](https://www.rfc-editor.org/rfc/rfc6034.txt) (read 2026-11-02): sections 3 and 4
- [RFC 6676, Multicast Addresses for Documentation, August 2012](https://www.rfc-editor.org/rfc/rfc6676.txt) (read 2026-11-02): sections 2 and 3
- [IANA, IPv6 Multicast Address Space registry](https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.xhtml), last updated 2026-04-07 (read 2026-11-02)
- [RFC 4291, IP Version 6 Addressing Architecture, February 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (read 2026-11-02): sections 2.5.5.2, 2.7 and 2.7.1
- [RFC 7346, IPv6 Multicast Address Scopes, August 2014](https://www.rfc-editor.org/rfc/rfc7346.txt) (read 2026-11-02): section 2
- [RFC 7371, Updates to the IPv6 Multicast Addressing Architecture, September 2014](https://www.rfc-editor.org/rfc/rfc7371.txt) (read 2026-11-02): sections 2 to 4
- [RFC 3306, Unicast-Prefix-based IPv6 Multicast Addresses, September 2002](https://www.rfc-editor.org/rfc/rfc3306.txt) (read 2026-11-02): section 4
- [RFC 3956, Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address, November 2004](https://www.rfc-editor.org/rfc/rfc3956.txt) (read 2026-11-02): sections 3, 4 and 6.3
- [RFC 3307, Allocation Guidelines for IPv6 Multicast Addresses, September 2002](https://www.rfc-editor.org/rfc/rfc3307.txt) (read 2026-11-02): sections 2 and 4
- [RFC 10028, Updates to Dynamic IPv6 Multicast Address Group IDs, August 2026](https://www.rfc-editor.org/rfc/rfc10028.txt) (read 2026-11-02): sections 3 and 6
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, August 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (read 2026-11-02): section 4
- [RFC 4007, IPv6 Scoped Address Architecture, March 2005](https://www.rfc-editor.org/rfc/rfc4007.txt) (read 2026-11-02): section 11
- [RFC 9844, Entering IPv6 Zone Identifiers in User Interfaces, August 2025](https://www.rfc-editor.org/rfc/rfc9844.txt) (read 2026-11-02): section 1
- [RFC 4541, Considerations for Internet Group Management Protocol (IGMP) and Multicast Listener Discovery (MLD) Snooping Switches, May 2006](https://www.rfc-editor.org/rfc/rfc4541.txt) (read 2026-11-02): sections 2.1.2, 3 and 4
- [RFC Editor, RFC index (XML)](https://www.rfc-editor.org/rfc-index.xml) (read 2026-11-02): the current status of each RFC above
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-11-02): section 3.5, the fragment, which carries a Share results link's value
