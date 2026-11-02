## What it does

The Virtual Router Redundancy Protocol (VRRP) lets several routers on a LAN share one default gateway address. One of them, the Active Router, forwards for the virtual address and sends an ADVERTISEMENT every interval; the others, the Backups, wait, and the one that stops hearing ADVERTISEMENTs first takes over. How long that wait is, who wins, and which MAC address the hosts see are all fixed by the standard, and this calculator works them out exactly, in three modes:

- **Timers.** For a router's priority and the advertisement interval: Skew_Time and the time a Backup waits before it declares the Active Router down, with the arithmetic shown, and when a Backup at that priority takes over after a silent failure and after a clean shutdown.
- **Election.** For two to eight routers, each with a name, a priority, a primary address and whether it owns the virtual address, with Preempt_Mode on or off: who becomes the Active Router and why, who takes over when it fails silently or shuts down cleanly and how long that takes, what happens when it comes back, and every router's timers.
- **Virtual MAC.** For a Virtual Router Identifier (VRID) and an address family: the Virtual Router MAC address in three notations.

The rules are those of [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), VRRP version 3 for IPv4 and IPv6 (April 2024), which obsoletes RFC 5798, which had obsoleted RFC 3768 ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abstract). A switch at the top of the form selects VRRPv2 instead, with the rules of [RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt) (April 2004, obsoleted by RFC 5798 and now RFC 9568), for the older equipment that still runs it. Everything is computed in your browser, and nothing is rounded.

## Names: Active or Master

RFC 9568 renamed the forwarding router: "The term for the VRRP Router assuming forwarding responsibility has been changed to "Active Router" to be consistent with IETF inclusive terminology" ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 1.1). Its waiting time is Active_Down_Interval, timed by the Active_Down_Timer. RFC 3768, and RFC 5798 before RFC 9568 replaced it, say Master, Master_Down_Interval and Master_Down_Timer, and many routers' output still does. The page uses each version's own words: Active Router and Active_Down_Interval for VRRPv3, Master and Master_Down_Interval for VRRPv2.

## Timers: the inputs

- **VRRP version**: VRRPv3 (RFC 9568) or VRRPv2 (RFC 3768).
- **Priority**: a whole number from 1 to 255. "The priority value for the VRRP Router that owns the IPvX address associated with the Virtual Router MUST be 255 (decimal)", and "VRRP Routers backing up a Virtual Router MUST use priority values between 1-254 (decimal). The default priority value for VRRP Routers backing up a Virtual Router is 100 (decimal)" ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 5.2.4). Four presets fill the field: 255 (the owner), 254, 100 (the default) and 1.
- **Advertisement interval**: for VRRPv3, centiseconds, or a time with a unit: `100`, `1 s`, `250 ms`, `0.5 s`. The field is 12 bits of centiseconds ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 5.2.7), and verified erratum 8301 makes the configurable range explicit: "Configurable value in the range 1-4095 (centiseconds). Default is 100 centiseconds (1 second)" ([RFC 9568 errata](https://www.rfc-editor.org/errata/rfc9568)). For VRRPv2, whole seconds from 1 to 255: the Adver Int field is 8 bits and "indicates the time interval (in seconds) between ADVERTISEMENTS. The default is 1 second" ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), sections 5.1 and 5.3.7). Blank means the version's default. Write decimals with a point.

## Timers: what it computes

For VRRPv3, the formulas of [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 6.1, in centiseconds:

```text
Skew_Time            = (((256 - Priority) * Active_Adver_Interval) / 256)
Active_Down_Interval = (3 * Active_Adver_Interval) + Skew_Time
```

Active_Adver_Interval is the interval a Backup reads in the Active Router's ADVERTISEMENTs; its "initial value is the same as Advertisement_Interval", the Backup's own setting (section 6.1), and a Backup moves to the advertised value whenever it accepts an ADVERTISEMENT (section 6.4.2). The page shows both formulas with your numbers in them: at priority 100 and 100 cs, (256 - 100) x 100 = 15,600, over 256 is 60.9375 cs, and 3 x 100 + 60.9375 is 360.9375 cs, 3.609375 seconds.

For VRRPv2, the formulas of [RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), section 6.1, in seconds:

```text
Skew_Time            = ( (256 - Priority) / 256 )
Master_Down_Interval = (3 * Advertisement_Interval) + Skew_time
```

The two versions differ in more than the unit. In VRRPv3 the skew is a fraction of the interval; in VRRPv2 it is a fraction of one second whatever the interval. At the 1-second default they give the same figures, but at 3 seconds a priority-100 VRRPv2 Backup waits 9.609375 s while a VRRPv3 Backup at 300 cs waits 1082.8125 cs (10.828125 s). That is why the two never mix in one calculation: a centisecond or millisecond interval with VRRPv2 is refused, as is a fraction of a second.

**Exact values.** Every timer is a whole number of 256ths of the version's unit, so it has an exact decimal, and the page prints it whole: 0.78125 cs at priority 254, 99.609375 cs at priority 1. "The RFC sets no rounding" is a fact about the standard, not a shortcut here: an implementation keeps its timers at its own resolution, so a router's own display may show a rounded figure.

**When a Backup at this priority takes over.**

- **After a silent failure.** The Active Router stops, and a Backup's Active_Down_Timer, "Timer that fires when a VRRP Advertisement has not been received for Active_Down_Interval" ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 6.2), fires one Active_Down_Interval after the last ADVERTISEMENT it heard. Counted from the failure itself, that is between one interval less than Active_Down_Interval (the failure fell just before the next ADVERTISEMENT was due) and the whole Active_Down_Interval (it fell just after one): 2.609375 s to 3.609375 s at priority 100 and 1 s.
- **After a clean shutdown.** An Active Router that shuts down sends "an ADVERTISEMENT with Priority = 0" (section 6.4.3), and a Backup that receives it sets its timer "to Skew_Time" (section 6.4.2): 0.609375 s at priority 100 and 1 s.

Propagation and processing delays are not included, nor is the time switches and hosts take to follow the virtual MAC to its new port.

**Priority 255.** The owner's timers are computed, but it never waits on them in a working network: at startup a router with priority 255 sends an ADVERTISEMENT and makes the transition "to the {Active} state" at once (section 6.4.1), and it preempts any lower priority "independent of the setting of this flag" (section 6.1). It would wait as a Backup only if a second router also claimed 255, and "only a single VRRP Router on the link SHOULD be configured with priority 255" (section 8.3.2).

**Sub-second intervals.** Below 100 cs the page adds RFC 9568's own warning: queueing delay longer than the interval can make a Backup promote itself and fall back, and "this process can repeat many times per second, causing a significant disruption of traffic" (section 2.5).

## Election: the inputs

- **VRRP version** and **Advertisement interval**, as above; the interval is the same on every router.
- **Preempt_Mode**: on (the default) or off, the same on every router. "Controls whether a (starting or restarting) higher-priority Backup Router preempts a lower-priority Active Router. Values are True to allow preemption and False to prohibit preemption. Default is True." ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 6.1).
- **Two to eight routers**, each with:
  - a **name**: up to 32 letters, digits, dots, hyphens or underscores, without spaces; a blank name reads R1, R2 and so on;
  - a **priority**, 1 to 254, or 255 for the owner;
  - its **primary address**: in IPv4 "an IPv4 address selected from the set of real interface addresses", and "In IPv6, the link-local address of the interface over which the packet is transmitted is used" ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 1.7), so an IPv6 primary address must be in fe80::/10 ([RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.txt), section 2.5.6);
  - **Owns the virtual address**: ticked for the router whose real interface address is the virtual address. Ticking it sets the priority to 255.

## Election: the rules it applies

The page plays RFC 9568's state machine (section 6.4) through four moments, all routers starting together and every ADVERTISEMENT arriving at once:

1. **At the start.** The owner sends an ADVERTISEMENT and makes the transition "to the {Active} state" at once; every other router starts as a Backup with its Active_Down_Timer set to Active_Down_Interval (section 6.4.1). Without an owner, the highest priority has the shortest Active_Down_Interval, so its timer fires first and it becomes Active; the others accept its ADVERTISEMENT, whose priority is higher than theirs, and stay Backup (section 6.4.2).
2. **A silent failure of the Active Router.** The best remaining Backup takes over when its own timer fires, with the times of the Timers mode.
3. **A clean shutdown of the Active Router.** Its priority-0 ADVERTISEMENT sets every Backup's timer to its own Skew_Time, and the best remaining Backup, with the shortest skew, takes over first.
4. **Its return.** The owner becomes Active again at once, whatever Preempt_Mode says. Any other router starts as a Backup: a Backup resets its timer on an ADVERTISEMENT "If Preempt_Mode is False, or if the Priority in the ADVERTISEMENT is greater than or equal to the local Priority", and otherwise discards it (section 6.4.2). So with Preempt_Mode on and a higher priority, it ignores the current Active Router's ADVERTISEMENTs, its own timer fires one Active_Down_Interval after it starts, and it takes over; the current Active Router, receiving a higher priority, returns to Backup (section 6.4.3). With Preempt_Mode off, or with the same priority as the current Active Router, it stays Backup.

**Ties.** Two Backups with the same top priority time out together and both become Active. An Active Router returns to Backup when "the Priority in the ADVERTISEMENT is equal to the local Priority and the primary IPvX address of the sender is greater than the local primary IPvX address (based on an unsigned integer comparison of the IPvX addresses in network byte order)" (section 6.4.3), so the higher primary address stays Active. The comparison is numeric: 192.0.2.10 beats 192.0.2.9, and fe80::1:0 beats fe80::ff. The address breaks a tie only between Active Routers, which is why a router that comes back with the same priority as the current Active Router stays Backup even when its address is higher. When two routers share a priority the page warns, because RFC 9568 asks that "all Virtual Routers SHOULD be configured with different priorities and with sufficient differences in the priorities" (section 8.3.2).

The result is the verdict (who is Active and why), the four moments in order with the rule and the time of each, and a table of the routers in election order with each one's Skew_Time and Active_Down_Interval.

## Virtual MAC

"IPv4 case: 00-00-5E-00-01-{VRID} (in hex, in network byte order)" and "IPv6 case: 00-00-5E-00-02-{VRID} (in hex, in network byte order)": "The first three octets are derived from the IANA's Organizationally Unique Identifier (OUI)", the next two are the block assigned to VRRP for the family, and the last is the VRID ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 7.3). The VRID is "Configurable value in the range 1-255 (decimal). There is no default" (section 6.1). The page writes the address three ways: with hyphens, as the RFC writes it (00-00-5E-00-01-0A); with colons (00:00:5e:00:01:0a); and in three dotted groups of four (0000.5e00.010a). It also gives the last octet in hexadecimal and where ADVERTISEMENTs are sent: 224.0.0.18 for IPv4, ff02::12 for IPv6, IP protocol 112 (sections 5.1.1 and 5.1.2). VRRPv2 uses the same IPv4 block ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), section 7.3) and has no IPv6 one.

The Active Router answers ARP and Neighbor Solicitations for the virtual address with this MAC, "The Active Router MUST NOT respond with its physical MAC address", which "allows the host to always use the same MAC address, regardless of the current Active Router" (sections 8.1.2 and 8.2.2).

## What it refuses, and why

- **Priority 0.** Never configured: "The priority value zero (0) has special meaning, indicating that the current Active Router has stopped participating in VRRP. This is used to trigger Backup Routers to quickly transition to the Active Router without having to wait for the current Active_Down_Interval" ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), section 5.2.4). The page says so and asks for 1 to 254, or 255 for the owner.
- **Priority above 255**, which the 8-bit field cannot hold, and anything that is not a whole number.
- **An owner whose priority is not 255**, and **priority 255 on a router not marked as the owner** (section 6.1 reserves it).
- **Two owners.** Only one SHOULD exist (section 8.3.2). As published, section 7.1 has a router discard any ADVERTISEMENT when it is itself the owner, so two owners both stay Active; verified erratum 8298 changes that check so that the higher primary address wins. The outcome depends on which text an implementation follows, so the page does not guess.
- **VRID 0 or above 255**, and a VRID in hexadecimal: the VRID is entered in decimal.
- **An interval of 0**, which verified erratum 8301 rules out because a zero interval makes every Backup time out at once; **above 4095 cs** (40.95 s) for VRRPv3 or **above 255 s** for VRRPv2; and **a fraction of the version's unit** (255 ms is 25.5 cs).
- **Mixed VRRPv2 and VRRPv3 arithmetic**: a centisecond or millisecond interval with VRRPv2, and IPv6 with VRRPv2, which "is intended for use with IPv4 routers only" ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), section 1.2).
- **Routers that mix IPv4 and IPv6** (a Virtual Router is one family, RFC 9568 Abstract), **an IPv6 primary address that is not link-local**, **two routers with the same primary address** (compared by value, so fe80::1 and fe80:0:0:0:0:0:0:1 are the same), two routers with the same name, fewer than two or more than eight routers, and an address with a prefix length or a zone.

## Worked examples

The Examples are the VRRP lab of chapter 4.2 of the open course [LAN Switch Operations and Maintenance](/materials/lan-switch-operations-and-maintenance): VRID 10 on VLAN 10, the virtual gateway 10.1.10.1, SW-CORE-01 at priority 110 with 10.1.10.2 and SW-CORE-02 at priority 100 with 10.1.10.3, preemption on, a one-second interval.

- **Timers**, priority 100 at 100 cs: Skew_Time 60.9375 cs (0.609375 s), Active_Down_Interval 360.9375 cs (3.609375 s). A cut link moves the gateway 2.609375 s to 3.609375 s after the failure, the lab's "about 3.6 s"; an orderly shutdown moves it 0.609375 s after the priority-0 ADVERTISEMENT, the lab's "about 0.6 s".
- **Election**: SW-CORE-01 has the higher priority and becomes the Active Router 357.03125 cs (3.5703125 s) after both start; if it fails, SW-CORE-02 takes over as above; when SW-CORE-01 comes back with preemption on, it takes the role back 3.5703125 s after it starts. With preemption off it stays Backup, which is the lab's closing tip.
- **Virtual MAC**, VRID 10, IPv4: 00-00-5E-00-01-0A, the address the lab's hosts learn for 10.1.10.1.
- **The article's table**, at 100 cs: priority 254 waits 300.78125 cs, 200 waits 321.875 cs, 1 waits 399.609375 cs; at 1 cs a priority-254 Backup waits 3.0078125 cs, about 30 milliseconds.
- **The limits**: at 4095 cs a priority-1 Backup waits 16364.00390625 cs (163.6400390625 s); a VRRPv2 Backup at priority 1 and 255 s waits 765.99609375 s.
- **A tie**: two routers at priority 100 with 192.0.2.2 and 192.0.2.3 both become Active after 3.609375 s, and 192.0.2.3 stays Active; if it fails, 192.0.2.2 takes over, and when 192.0.2.3 comes back it stays Backup, with or without preemption.

## What it does not do

It does not talk to any router: the priorities, addresses and interval are yours. It assumes every router has the same interval and the same Preempt_Mode, that they start together, and that ADVERTISEMENTs arrive without delay. Tracking (lowering a priority when an uplink fails), preemption delays, Accept_Mode, the gratuitous ARP and how quickly switches relearn the MAC, VRRPv2 and VRRPv3 interoperation (RFC 9568, section 8.4) and HSRP are outside it. Vendor defaults and commands are not included: for those, read the vendor's documentation and the course's vendor slides. To play a sequence of failures and returns step by step, use the election lab in the [First-hop redundancy](/learn/first-hop-redundancy-vrrp-and-hsrp) article.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries the mode, the version and the fields of the mode shown, as typed, after the `#`: `mode` (`timers`, `election` or `mac`) and `version` (`3` or `2`) always; in Timers mode `priority`, and `interval` when typed; in Election mode `routers`, one router per line written as `<name> <priority> <address>` with ` owner` after the owner and `*` for a field left blank, `preempt` (`1` or `0`), and `interval` when typed; in Virtual MAC mode `vrid` and `family` (`ipv4` or `ipv6`). The other modes' fields are not carried. In Election mode the popover adds a caution: router names and primary addresses describe a private network, so read them before you send the link.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-02) has the fragment "separated from the rest of the URI prior to a dereference", so these values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; these fields are far shorter.
- **Opening a link.** The mode, the version and the mode's fields are set as typing would set them (an interval the link does not carry is left blank, which means the default; a missing `preempt` means on), the other modes keep their values, and the page computes. A link with an unknown mode, version, `preempt` value or family, a field of another mode, a missing required field, a value on two lines (the router list excepted), or a router list that is not two to eight lines of three or four words is ignored. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

## Provenance

The engine is fixed arithmetic and a fixed reading of the state machine, with no clock, no network and no randomness. It ships 133 golden vectors (set `vrrp-timer-calculator-golden-2026-11-02`): 26 timer rows (priorities 1, 100, 200, 254 and 255 at the default interval, at 1 cs and at 4095 cs, and VRRPv2 at 1 s and 255 s), 14 elections, 12 virtual MACs, the three Examples, interval spellings and defaults, the sentences that carry the rules, and 51 refusals. Every expected figure and every election outcome was derived by a separate implementation, not by running this engine: the timers by the RFC formulas in Python's exact fractions, and the elections by a discrete-event simulation of RFC 9568's state machine (timers, ADVERTISEMENTs, priority 0, preemption and the address tie-break) through the four moments, with Python's own address comparison. The errata were read the same day: RFC 9568 has six verified errata, of which 8301 (the 1 to 4095 range) and 8298 (two owners) shape this tool and the others (7947 and 7949 on the gratuitous ARP, 8299 and 8300 on receive checks) change no timer; RFC 3768 has none.

## API

The same engine answers `/api/v1/vrrp-timer-calculator` on the site's HTTP API; the contract is on the [API page](/api), which also says whether this site serves the API.

- **Request.** A JSON object. Timers: `{"mode": "timers", "version": 3, "priority": 100, "interval": "100"}`; `version` (3 by default) and `interval` (the default when absent) are optional, and a bare interval is the version's unit. Election: `{"mode": "election", "version": 3, "interval": "100", "preempt": true, "routers": [{"name": "SW-CORE-01", "priority": 110, "address": "10.1.10.2"}, {"name": "SW-CORE-02", "priority": 100, "address": "10.1.10.3"}]}`; `preempt` (true by default), `name` and `owner` (false by default) are optional, and an owner's `priority` may be left out. Virtual MAC: `{"mode": "mac", "vrid": 10, "family": "ipv4"}`.
- **Response, timers.** `mode`, `version`, `unit` (`cs` or `s`), `names` (`rfc`, `interval`, `down`, `downTimer`, `activeRole`, `activeState`), `priority`, `owner`, `interval`, `intervalSeconds`, `intervalDefault`, `skewTime`, `skewTimeSeconds`, `downInterval`, `downIntervalSeconds`, `skewNumerator`, `arithmetic` (`skew`, `down`: the formulas with the values, such as `Skew_Time = ((256 - 100) * 100) / 256 = 15600 / 256 = 60.9375 cs`), `failover` (`silentFrom`, `silentTo`, `shutdown` and their `...Seconds`; null for priority 255), `warnings` and `notes`. Every time is exact decimal text with "." as the point.
- **Response, election.** `mode`, `version`, `unit`, `names`, `family`, `preempt`, `preemptDefault`, `interval`, `intervalSeconds`, `intervalDefault`, `routers` (each: `index`, `name`, `priority`, `address`, `owner`, `rank`, `startState`, `skewTime`, `skewTimeSeconds`, `downInterval`, `downIntervalSeconds`), `ranking`, `active`, `activeReason` (`owner`, `priority` or `address-tie`), `steps` (four: `event` `start`, `failure`, `shutdown` or `return`; `outcome`; `active`, `activeName`, `subject`, `tied`, `after`, `afterSeconds`, `from`, `fromSeconds`, `text`), `verdictText`, `warnings` and `notes`.
- **Response, virtual MAC.** `mode`, `version`, `family`, `vrid`, `vridHex`, `block`, `hyphen`, `colon`, `dotted`, `multicastGroup`, `ipProtocol` and `notes`.
- **Errors.** HTTP 400, `invalid_input`, with the engine's message, for example `Priority 0 is never configured: RFC 9568 reserves it for the Active Router to indicate it is relinquishing responsibility for the Virtual Router. ...`.

## Sources

- [RFC 9568, Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, April 2024](https://www.rfc-editor.org/rfc/rfc9568.txt) (read 2026-11-02): sections 1.1, 1.7, 2.5, 5.1, 5.2.4, 5.2.7, 6.1 to 6.4, 7.3, 8.1.2, 8.2.2 and 8.3.2. A Proposed Standard that obsoletes RFC 5798; neither obsoleted nor updated
- [RFC 9568 errata](https://www.rfc-editor.org/errata/rfc9568) (read 2026-11-02): six verified errata; 8301 (Advertisement_Interval 1 to 4095 centiseconds) and 8298 (an owner receiving ADVERTISEMENTs) apply here
- [RFC 3768, Virtual Router Redundancy Protocol (VRRP), April 2004](https://www.rfc-editor.org/rfc/rfc3768.txt) (read 2026-11-02): VRRP version 2, sections 1.2, 5.1, 5.3.7, 6.1, 6.4 and 7.3. A Draft Standard obsoleted by RFC 5798, itself obsoleted by RFC 9568; read for older equipment only; [errata page](https://www.rfc-editor.org/errata/rfc3768): no errata
- [RFC 4291, IP Version 6 Addressing Architecture, February 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (read 2026-11-02): sections 2.2 and 2.5.6
- [RFC Editor, RFC index (XML)](https://www.rfc-editor.org/rfc-index.xml) (read 2026-11-02): the status of RFC 9568, RFC 5798 (obsoleted by RFC 9568), RFC 3768 (obsoleted by RFC 5798) and RFC 4291
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-11-02): section 3.5, the fragment, which carries a Share results link's values
