## What it does

Paste a Cisco IOS or IOS XE IPv4 access list as you would copy it from a configuration, describe one packet, and the tool says which entry decides it. Every entry it tests before that one is shown with the first field that ruled it out (protocol, source address, source port, destination address, destination port, `established` or `fragments`); when nothing matches, the packet meets the implicit deny. A lint reads the whole list with or without a packet. Everything is computed in your browser from the text you paste; nothing is applied to a device.

The scope is deliberate: **v1 reads Cisco IOS and IOS XE IPv4 syntax only.** The end of a list is platform behaviour, not a standard: Juniper EX ends every filter in an implicit discard, while Extreme Switch Engine and Fabric Engine permit what no rule matched. The [ACL article](/learn/access-control-lists-on-switches-and-routers) sets the platforms side by side, with their sources.

## What it reads

- **Numbered lists**: `access-list` lines, standard 1 to 99 and 1300 to 1999, extended 100 to 199 and 2000 to 2699, and their `remark` lines.
- **Named lists**: an `ip access-list standard NAME` or `ip access-list extended NAME` block, entries with or without sequence numbers, `remark` lines. A name starts with a letter; a number in the right range names the same list as the `access-list` lines of that number. Several lists in one paste are read; buttons choose the one to evaluate.
- **Addresses**: `any` (0.0.0.0 255.255.255.255), `host A` (A 0.0.0.0), an address and its wildcard, and, in a standard entry, an address alone, which takes 0.0.0.0 as its mask. Wildcard bits set to 1 are ignored and need not be contiguous.
- **Protocols**: `ip` (every protocol), a number from 0 to 255, and the keywords whose number a source gives: `icmp` 1, `igmp` 2, `tcp` 6, `udp` 17, `gre` 47, `esp` 50, `eigrp` 88, `pim` 103 (IANA, the same keyword) and `ospf` 89 (RFC 2328). Cisco also accepts `ahp`, `ipinip`, `nos` and `pcp`; no source read gives their numbers, so a line using one is listed with that reason and you can write the number instead.
- **Ports**, after `tcp` or `udp` only: `eq` and `neq` with up to 10 ports, `lt`, `gt` and `range` (inclusive). An operator after the source tests the source port, after the destination the destination port. A port is 0 to 65535 or a name from the TCP or UDP list of Cisco's IOS XE 17.18.1 data model (`www` is TCP 80, `domain` 53 on either, `snmp` UDP 161 ...); a TCP name only works with `tcp`, a UDP name only with `udp`.
- **Options**: `established` (TCP only: a match needs ACK or RST set), `fragments` (the entry applies only to non-initial fragments), `log` and `log-input`.

Lines it does not read are listed under the result with the reason, never dropped: object groups, ICMP and IGMP message types, `dscp`, `precedence`, `tos`, `time-range`, `option`, `ttl`, TCP flags other than `established`, `dynamic` and reflexive entries, host names, `no` commands, `ip access-list resequence`, `ip access-group` (where a list is applied) and `show access-lists` output. When such a line looks like an entry, the result says the verdict covers only the entries that were read.

## The walk

Cisco evaluates a list **by sequence number**, and the first entry that matches decides; nothing after it is read. The tool tests the entries in that order:

- An entry typed without a number gets 10 more than the highest number in its list (10 for the first) and goes to the end. A number already in the list is refused (Cisco answers `Duplicate sequence number`), and an entry equal to one already there, apart from its number, changes nothing; both are listed as lines not read.
- In a **standard** list, Cisco hashes the entries that name one host and looks the source up in that table before it searches the other entries. The walk follows that order and says so when a host entry is tested ahead of a lower sequence number.
- A **standard** entry tests the source address only: the packet's protocol, destination and ports play no part.
- When nothing matches, the packet is denied by the implicit deny, which Cisco documents as the unwritten deny statement that ends every access list.
- A list with no entries gets no implicit deny verdict: Cisco documents that an interface with an empty access list applied to it permits all traffic.

The test packet is an unfragmented packet: an entry with `fragments` never matches it.

## The lint

- **Shadowed**: an earlier entry matches every packet this one would, with the opposite action, so this one never decides anything.
- **Redundant**: an earlier entry matches every packet this one would with the same action; or a later entry does, and no entry between them decides any of those packets otherwise. Removing it changes nothing.
- **Only repeats the implicit deny**: a deny entry no later permit overlaps. It changes no verdict, though its counter (or its `log`) shows the traffic.
- **Never matches**: a port test no port passes, such as `lt 0`.
- **Non-contiguous wildcard**: legal on Cisco, flagged because no prefix length can express it and its addresses do not form one block.
- **Ignored bits**: an address with bits set where its wildcard ignores them (`10.1.1.5 0.0.0.255` matches 10.1.1.0/24).
- **A standard list's reach**: its entries test the source only, so each decides for everything those sources send.

The lint reasons about non-initial fragments as well as whole packets, because Cisco tests them differently: a deny entry with ports or `established` does not apply to a non-initial fragment, and the next entry is processed. An entry below such a deny is therefore called shadowed "for every unfragmented packet", with the reason, rather than shadowed outright.

Every address of every entry is shown as written, as its address and wildcard with the ignored bits cleared, as a prefix in RFC 4632 notation when the wildcard is contiguous, and with the number of addresses it matches.

## Things it cannot know

- What the device holds. The tool reads the text you paste; a line it does not read may still be an entry on the device.
- Where the list is applied, and in which direction. A port, VLAN or routed interface, inbound or outbound, changes which packets meet the list at all; the article explains the attachment points.
- Hardware limits. A list that reads correctly can still fail to fit the switch's TCAM.
- Other platforms. Their syntax and their end of list differ; v1 does not read them.

## Examples

The Example button loads the list of the course lab in chapter 4.3 of LAN Switch Operations and Maintenance: permit SSH from 10.1.10.0/24 to the management network 10.1.99.0/24, deny everything else to 10.1.99.0/24, permit the rest, as `ip access-list extended MGMT-PROTECT` with sequence numbers 10, 20 and 30. Its packet is SSH from VLAN 20 (TCP 10.1.20.25 port 51514 to 10.1.99.10 port 22): entry 10 fails on the source address and entry 20 denies it. Change the source to 10.1.10.25 and entry 10 permits it; swap the first two entries and SSH from VLAN 10 is denied, with the permit flagged as shadowed. The golden vectors cover first match on every field, every port operator at its edges, standard and extended lists, the hash order, sequence numbers out of order, both kinds of redundancy and the lines not read; one of them is Extreme Fabric Engine's own non-contiguous example (3.4.5.6 with 255.255.255.0 matches 192.168.1.6 and not 3.4.5.7) written the Cisco way.

## API

The same engine answers the `/api/v1/acl-first-match-evaluator` operation of the site's HTTP API, described in the OpenAPI contract on the [API page](/api), which also says whether this site serves the API.

- **Request.** The access list as text (read and linted), or a JSON object `{"acl": "...", "packet": {"protocol": "tcp", "source": "10.1.20.25", "destination": "10.1.99.10", "sourcePort": 51514, "destinationPort": 22, "ackOrRst": false}, "list": "MGMT-PROTECT"}` (and walked for that packet). `packet` and `list` are optional; ports may be numbers or strings.
- **Response.** `lists` (each with `name`, `kind`, `line`, `entries`, `evaluationOrder` and `remarks`; each entry with `seq`, `seqGiven`, `line`, `text`, `action`, `protocol`, `source`, `sourcePort`, `destination`, `destinationPort`, `established`, `fragments`, `log` and `hashed`; each address with `written`, `form`, `address`, `wildcard`, `base`, `contiguous`, `prefix`, `addresses` and `ignoredBitsSet`), `selected`, `issues` (`line`, `text`, `entryLike`, `reason`), `packet`, `packetErrors`, `steps` (`seq`, `line`, `text`, `action`, `matched`, `field`, `reason`), `verdict` (`action`, `by`: `entry`, `implicit-deny` or `empty-list`, `seq`, `line`, `text`, `sentence`), `lint` (`kind`, `seq`, `line`, `other`, `sentence`), `notes` and `counts`.
- **Errors.** HTTP 400 for a request that starts with `{` but is not valid JSON or has no `acl` string, and for a text over 65,536 characters or 4,000 lines. A line that cannot be read, or a packet that cannot be read, is not an HTTP error: `issues` and `packetErrors` say why.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries the access list as pasted (`input`) and the test packet as typed (`protocol`, `source`, `srcport`, `destination`, `dstport`, and `ackrst` when the box is ticked), plus `list` when you chose a list other than the first, after the `#`. Its popover says first what the link carries, then a caution of its own (an access list names internal networks and hosts and what may reach them), then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The list also goes through the site's secrets check: a value that is a credential by its format (a password in a URL, a PEM private key, a JWT) in a remark or anywhere else means no link, and the popover names its line. Put a placeholder in its place and press again.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-02) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The list and each packet field fill as typed and the page reads them; nothing is contacted. A packet value the tool cannot read shows the same message typing it would. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Sources

- [Cisco, Security and VPN Configuration Guide, Cisco IOS XE 17.x: IP Access List Entry Sequence Numbering](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-acl-seq-num.html) (read 2026-11-02): first match, "If no conditions match, the packet is dropped", the empty list, sequence numbers assigned 10 apart, duplicates refused, standard host entries hashed and looked up first
- [Cisco, ACLs Configuration Guide, Cisco IOS XE 17 (Catalyst 9000): Access Control Lists](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html) (read 2026-11-02): the sequence number "dictates the order in which ACEs are evaluated", remarks, numbered syntax and ranges, port operators, `established`
- [Cisco IOS Security Command Reference, Commands A to C](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-a2.html) (read 2026-11-02): `access-list (IP extended)` and `access-list (IP standard)`: protocols, wildcard bits, port operators and names, `established`, `fragments`, `log`, the implicit deny
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-acl](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-acl.yang) (read 2026-11-02): `eq` and `neq` with up to 10 ports, sequence numbers 1 to 2147483647, remarks of 1 to 100 characters
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-types](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-types.yang) (read 2026-11-02): list number ranges, TCP and UDP port names with their numbers
- [Cisco, End-of-Sale and End-of-Life Announcement for the Cisco IOS XE 17.18.x](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-17/ios-xe-17-18-x-eol.html) (read 2026-11-02): software maintenance releases until 29 April 2028, security fixes until 30 September 2029
- [RFC 4632, Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632.txt) (read 2026-11-02): prefix notation and contiguous masks
- [IANA, Assigned Internet Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv) (read 2026-11-02): the protocol numbers behind the keywords
- [RFC 2328, OSPF Version 2](https://www.rfc-editor.org/rfc/rfc2328.txt) (read 2026-11-02): "OSPF is IP protocol number 89"
- [Juniper Networks, Understanding how firewall filters are evaluated (EX Series)](https://www.juniper.net/documentation/us/en/software/junos/routing-policy/topics/concept/firewall-filter-ex-series-evaluation-understanding.html) (read 2026-11-02): the implicit discard at the end of every filter
- [Extreme Networks, Switch Engine v33.7.1 User Guide (PDF)](https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/downloads/Switch_Engine_33_7_1_User_Guide.pdf) (read 2026-11-02): "If a packet matches no rule entries in the ACL, it is permitted"
- [Extreme Networks, Fabric Engine v9.4 User Guide, access control lists](https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/access_control_lists.shtml) (read 2026-11-02): "The default action mode for ACLs is permit"
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (read 2026-11-02): the fragment, which Share results relies on
