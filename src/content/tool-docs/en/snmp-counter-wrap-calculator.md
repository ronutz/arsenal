## What it does

An SNMP interface counter only ever counts up, and when it reaches its largest value it starts again from zero. A monitoring system turns those counters into traffic rates by reading them twice and dividing the difference by the time between the readings, which works only while the counter goes round less than once between two polls. This calculator answers the two questions that follow, exactly:

- **Wrap time.** For a Counter32 or Counter64 that counts octets or packets, at a given interface speed and utilisation: how long it takes to wrap at that load and at line rate, the longest poll interval that can never miss a wrap, a safer interval with the tool's margin, a verdict on your own poll interval, and what RFC 2863 requires at that speed.
- **Rate from two readings.** For two readings of one counter, with their times in seconds or as sysUpTime: the delta, allowing for one wrap of the counter's width, the rate in bit/s or packets/s, and, when you give the interface speed, whether that rate can be trusted at all.

Everything is computed in your browser with exact integer arithmetic: 2^64 does not fit the integer range of a JavaScript number (2^53), so every quantity is held as a fraction of two BigInts and rounded only when it is printed, to six decimals.

## Why one counter value means nothing

RFC 2578 defines both counter types the same way: a Counter32 "monotonically increases until it reaches a maximum value of 2^32-1 (4294967295 decimal), when it wraps around and starts increasing again from zero", and a Counter64 does the same at 2^64-1 (18446744073709551615). Both carry the same warning: "Counters have no defined "initial" value, and thus, a single value of a Counter has (in general) no information content" ([RFC 2578](https://www.rfc-editor.org/rfc/rfc2578.txt), sections 7.1.6 and 7.1.10). A reading of 4,000,000,000 on ifInOctets says nothing about how busy the port is; only the difference between two readings of the same counter does. The [SNMP on network devices](/learn/snmp-on-network-devices) article works the same arithmetic for a 10 Gb/s port: 2^32 octets go by in about 3.4 seconds at line rate.

## Wrap time: the inputs

- **Counter type**: Counter32 or Counter64.
- **Counts**: octets (ifInOctets, ifHCInOctets and their Out siblings) or packets (ifInUcastPkts, ifHCInUcastPkts and the rest).
- **Interface speed**: a number and a unit, with a point for decimals: `100M`, `2.5 Gb/s`, `10G`, `400 Gb/s`, `1 Tb/s`. The prefixes k, M, G and T are powers of 1000, and a bare number is bit/s, as ifSpeed reports it; ifHighSpeed reports units of 1,000,000 bits per second ([RFC 2863](https://www.rfc-editor.org/rfc/rfc2863.txt)), so an ifHighSpeed of 10000 is `10000M`. A capital B (`125 MB/s`) is refused: interface speeds are written in bits. Seven presets fill the field: 100 Mb/s, 1, 10, 25, 40, 100 and 400 Gb/s.
- **Utilisation**: a percentage above 0 and at most 100. Blank means 100.
- **Poll interval** (optional): seconds, or a number and a unit (`ms`, `s`, `min`, `h`): `300`, `5 min`, `0.25 h`. Without it there is no verdict.
- **Packet size** (packets only): whole octets from 1 to 65535. Blank means 84.

## Wrap time: what it computes

- **Counted per second**: for octets, the speed times the utilisation divided by 8; for packets, divided by 8 times the packet size.
- **Time to wrap at this load**: 2^32 or 2^64 divided by that rate. It is also the time between two wraps.
- **Time to wrap at line rate**: the same at 100 %, the shortest possible time between two wraps. Line rate for octets is the speed divided by 8: an interface cannot count more octets per second than its bits carry. For packets it is the speed divided by 8 times the packet size, and the default of 84 octets is the smallest Ethernet frame on the wire. RFC 2544 Appendix B gives an Ethernet frame of N octets as a 64-bit preamble, 8 x N bits and a 96-bit gap ([RFC 2544](https://www.rfc-editor.org/rfc/rfc2544.txt)), so a 64-octet frame takes 84 octets of line time, and its table gives 14880 frames per second at 10 Mb/s. Packet counters move fastest with the smallest packets, so the default is the worst case; a larger packet size gives the line-rate figures for packets of that size only.
- **The other width at this load**, for comparison: a Counter32 user sees what a Counter64 would give, and the other way round.
- **Never misses a wrap**: any poll interval strictly shorter than the line-rate wrap time. At exactly that interval the counter can come back to the same value, and the delta reads zero.
- **With the tool's margin**: half the line-rate wrap time. This margin is the tool's own choice, not a standard's: a lost poll (a request that timed out) doubles the gap between the two readings that remain, and at half the wrap time that doubled gap still spans less than one wrap.
- **Your interval**, when given: what the counter counts between two polls at this load, as a number and as cycles of 2^32 or 2^64, and a verdict:
  - **safe**: shorter than the margin;
  - **no margin**: shorter than the line-rate wrap time but not the margin, so one lost poll could hide a wrap;
  - **burst**: shorter than the wrap time at this load but not at line rate, so a burst towards line rate could take the counter round a full cycle without any sign;
  - **wraps**: at this load the counter goes round a full cycle or more between polls, and no delta can be trusted.

## Wrap time: what RFC 2863 requires

Section 3.1.6 of RFC 2863 sets three speed bands, quoted exactly on the page:

- "For interfaces that operate at 20,000,000 (20 million) bits per second or less, 32-bit byte and packet counters MUST be supported."
- "For interfaces that operate faster than 20,000,000 bits/second, and slower than 650,000,000 bits/second, 32-bit packet counters MUST be supported and 64-bit octet counters MUST be supported."
- "For interfaces that operate at 650,000,000 bits/second or faster, 64-bit packet counters AND 64-bit octet counters MUST be supported."

The page says which band the speed is in and whether 64-bit octet and packet counters are required. When you ask about a Counter32 where the band requires 64 bits for that kind of counter, it warns and names the counters to poll instead: ifHCInOctets and ifHCOutOctets, or the ifHC packet counters. The same section notes that when 64-bit counters are in use the 32-bit ones "MUST still be available" and "report the low 32-bits of the associated 64-bit count" ([RFC 2863](https://www.rfc-editor.org/rfc/rfc2863.txt)), which is why ifInOctets keeps wrapping on a port that also has ifHCInOctets.

The thresholds are compared exactly: 20,000,000 bit/s is in the 32-bit band, and 20,000,000.000000001 bit/s is already in the 64-bit octet band.

## Rate from two readings: the inputs

- **Counter type** and **Counts**, as above.
- **Two readings**: each a counter value (digits, at most 2^32-1 or 2^64-1, or the snmpget line that carries it: see below) and a time.
- **Times in**: seconds (a number with up to six decimals, such as a poller's Unix time) or sysUpTime ticks. sysUpTime is "The time (in hundredths of a second) since the network management portion of the system was last re-initialized" ([RFC 3418](https://www.rfc-editor.org/rfc/rfc3418.txt)); TimeTicks are kept "modulo 2^32" ([RFC 2578](https://www.rfc-editor.org/rfc/rfc2578.txt), section 7.1.8), so a tick value is a whole number from 0 to 4294967295.
- **Interface speed** (optional): it enables the checks below.
- **Packet size** (packets only, optional): the packet size for the line-rate check, 84 when blank.

## Pasting snmpget output

The counter readings, and the times when they are sysUpTime ticks, also take the line Net-SNMP's snmpget prints, so there is no need to cut it down to the digits. A counter reading can be the whole line, such as `IF-MIB::ifHCInOctets.1 = Counter64: 9876543210123`, with the OID named, numeric (`-On`) or in full (`-Of`); the value alone (`-Ov`: `Counter64: 9876543210123`); the line without its type (`-OQ`: `IF-MIB::ifHCInOctets.1 = 9876543210123`); or the digits. A line that names Counter32 or Counter64 must match the counter type you chose: a mismatch is refused, naming both, and the type is never switched for you. Gauge32, INTEGER, STRING, Timeticks and the other types are refused as not counters. A sysUpTime time can be the line `SNMPv2-MIB::sysUpTime.0 = Timeticks: (586731977) 67 days, 21:48:39.77`, the value alone, or the raw ticks of `-Ot` (`SNMPv2-MIB::sysUpTime.0 = 14096763`): the number in brackets is the hundredths of a second, and the days and clock after it are ignored. With the times in seconds, a Timeticks line is refused with a pointer to sysUpTime ticks. The quick form (`-Oq`, no `=` and no type) is not read. Each field holds at most 144 characters: the longest line in these forms for an IF-MIB counter, the full OID of ifHCOutBroadcastPkts at the largest ifIndex holding 2^64-1, takes 135. The forms are from Net-SNMP's [snmpget tutorial](https://www.net-snmp.org/wiki/index.php/TUT:snmpget), its [snmpcmd(1) manual page](https://www.net-snmp.org/docs/man/snmpcmd.html) (OUTPUT OPTIONS) and the value printers in the 5.9.4 source file [snmplib/mib.c](https://raw.githubusercontent.com/net-snmp/net-snmp/v5.9.4/snmplib/mib.c), read 2026-11-02.

## Rate from two readings: what it computes

- **Interval**: the second time minus the first, in seconds (ticks divided by 100). An interval of zero is refused. A negative interval is refused too: with seconds, the readings are out of order; with sysUpTime, either the agent was re-initialised between the readings, which restarts its counters, or sysUpTime went round after "approximately 497 days without a re-initialization" ([RFC 2579](https://www.rfc-editor.org/rfc/rfc2579.txt), TimeStamp), and the tool does not guess which.
- **Delta**: the second value minus the first. When the second value is lower, the only explanation the arithmetic can use is one wrap: the counter reached 2^32-1 (or 2^64-1), went back to zero and counted on, so the delta is 2^32 minus the first value plus the second. The page says so.
- **Rate**: for octets, the delta times 8 divided by the interval, in bit/s (with the speed, also as a percentage of it); for packets, the delta divided by the interval, in packets/s.
- **With the interface speed**, the most the counter could count in the interval at line rate, and two checks:
  - when that maximum reaches 2^32 (or 2^64), the counter could have gone round a full cycle more than the readings show, so the delta may be short by a multiple of 2^32 and the rate **cannot be trusted**;
  - when the delta is more than that maximum, the readings **do not belong together**: a discontinuity, another interface or counter, or the wrong width. With a lower second reading this means a wrap cannot explain it.
- **A Counter64 that wrapped**: the page adds that a 64-bit counter takes years to go round even at the fastest speeds (2^64 octets at 400 Gb/s take about 11.7 years), so a lower second reading is far more likely a discontinuity than a wrap.

**Discontinuities** make any delta meaningless. Interface counters can jump "at re-initialization of the management system, and at other times as indicated by the value of ifCounterDiscontinuityTime", which holds "The value of sysUpTime on the most recent occasion at which any one or more of this interface's counters suffered a discontinuity" ([RFC 2863](https://www.rfc-editor.org/rfc/rfc2863.txt)). Read ifCounterDiscontinuityTime with every poll and discard the pair when it changed; the tool cannot see it, so it says this with every rate.

## Worked examples

- **The Example (wrap time)**: a 10 Gb/s port at 40 % polled every 300 s with Counter32 octets. It counts 500,000,000 octets a second, so it wraps every 8.589935 s (3.435974 s at line rate). In 300 s it counts 150,000,000,000 octets, 34.92 cycles of 2^32: the verdict is that the deltas are wrong. A Counter64 at the same load would wrap after 36,893,488,147 s, about 1,170 years, and RFC 2863 requires 64-bit counters at this speed anyway.
- **RFC 2863's own figures**: Counter32 octets at 10 Mb/s wrap after 3435.973837 s, the RFC's "just over 57 minutes"; at 1 Gb/s after 34.359738 s, its "34 seconds"; Counter32 packets of 64 bytes at 650,000,000 bit/s after 3383.112701 s (56.4 minutes), its "about 57 minutes"; a Counter64 of octets at 1 Tb/s after 147,573,952.589676 s, 4.68 years of 365.25 days, its "just under 5 years".
- **Polling a 100 Mb/s port at 40 %** with Counter32 octets (wrap 858.993459 s at this load, 343.597384 s at line rate, margin 171.798692 s): 60 s is safe, 300 s has no margin, 600 s is exposed to a burst, 900 s wraps.
- **The Example (rate)**: two Counter64 readings, 9876543210123 and 10026543210123, at sysUpTime 123456700 and 123486700 on a 10 Gb/s port: 300 s, 150,000,000,000 octets, 4,000,000,000 bit/s, 40 % of the speed, and at line rate the counter could count 375,000,000,000 octets in that time, far below 2^64.
- **One 32-bit wrap**: 4294000000 then 1032704, 30 s apart, give a delta of 2,000,000 octets and 533,333.333333 bit/s; at 1 Gb/s a full cycle needs more than 30 s, so one wrap is the only reading.
- **A full cycle possible**: a Counter32 of octets read 300 s apart on a 10 Gb/s port could have counted 87.31 cycles, so whatever the two values say, the rate cannot be trusted.

## What it does not do

It does not poll anything: the readings are yours. It does not know which interface or counter they came from, whether ifCounterDiscontinuityTime changed between them, or whether your agent's ifSpeed or ifHighSpeed matches the port's real speed. Line rate is a bound computed from the speed you give: for octets it is the speed divided by 8, and for packets it assumes every packet takes the packet size you give. Durations of a year or more are shown in years of 365.25 days, a display convention; the exact seconds are always beside them.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries the mode, the counter and the fields of the mode shown, as typed, after the `#`: `mode` (`wrap` or `rate`), `width` (`32` or `64`) and `kind` (`octets` or `packets`) always; in wrap mode `speed`, and `utilisation` and `poll` when typed; in rate mode `first`, `second`, `firsttime`, `secondtime` and `timeunit` (`s` or `ticks`), and `speed` when typed; with packets, `packetsize` when typed. The other mode's fields are not carried. Interface speeds, percentages, intervals, counter values and times say nothing about you.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-02) has the fragment "separated from the rest of the URI prior to a dereference", so these values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; these fields are far shorter.
- **Opening a link.** The mode, the counter and the mode's fields are set as typing would set them (a field the link does not carry is left blank, which means its default), the other mode keeps its values, and the page computes. A link with an unknown mode, width, kind or time unit, a field of the other mode, a packet size with octets, a missing required field or a value on two lines is ignored. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

## Provenance

The engine is fixed arithmetic over the rules above, with no clock, no network and no randomness. It ships 105 golden vectors (set `snmp-counter-wrap-calculator-golden-2026-11-02b`): the seven preset speeds for both widths and both kinds at line rate, RFC 2863's thresholds at, above and below 20,000,000 and 650,000,000 bit/s, the section's own wrap times, the four poll verdicts and their exact boundaries, deltas with no wrap and with one 32-bit and one 64-bit wrap, an interval long enough for a full cycle, a delta the interface could not have counted, sysUpTime and decimal-second input, both Examples, each pasted snmpget form above, and 36 refusals, among them zero and negative intervals, a line whose counter type disagrees with the width, a type that is not a counter, and a field one character past the bound. Every expected number was derived by a separate implementation of the same rules (Python's exact fractions), not by running this engine. The errata were read the same day: RFC 2578 has none; RFC 2863's one verified erratum (4820) corrects the largest ifSpeed in section 3.1.7 to (2**32)-1 and changes nothing here; RFC 3418's concern a reference heading and a sysServices example; none of RFC 2579's or RFC 2544's touches TimeStamp or Appendix B.

## API

The same engine answers `/api/v1/snmp-counter-wrap-calculator` on the site's HTTP API; the contract is on the [API page](/api), which also says whether this site serves the API.

- **Request.** A JSON object. Wrap time: `{"mode": "wrap", "width": 32, "kind": "octets", "speed": "10 Gb/s", "utilisation": "40", "poll": "300"}`; `utilisation`, `poll` and, for packets, `packetOctets` are optional. Rate: `{"mode": "rate", "width": 64, "kind": "octets", "first": "9876543210123", "second": "10026543210123", "firstTime": "123456700", "secondTime": "123486700", "timeUnit": "ticks", "speed": "10 Gb/s"}`; `timeUnit` (`s` by default), `speed` and `packetOctets` are optional. Send counter values as strings: a JSON number above 9007199254740991 has already lost digits, and the API refuses one.
- **Response, wrap.** `mode`, `width`, `kind`, `modulus`, `maxValue`, `speedBitsPerSecond`, `utilisationPercent`, `packetOctets`, `countPerSecond`, `lineRateCountPerSecond`, `wrapSeconds`, `lineRateWrapSeconds`, `otherWidth` (`width`, `wrapSeconds`), `neverMissBelowSeconds`, `marginPollSeconds`, `poll` (`seconds`, `countPerPoll`, `cyclesPerPoll`, `verdict`: `safe`, `no-margin`, `burst` or `wraps`, and `text`), `rfc2863` (`band`: `up-to-20m`, `20m-to-650m` or `650m-and-above`, `octets64Required`, `packets64Required`, `thisCounterRequires64`, `quote`), `warnings` and `notes`. Every number is decimal text, exact or rounded half up to six decimals. For the Example the API answers `wrapSeconds` `8.589935` and `poll.verdict` `wraps`.
- **Response, rate.** `mode`, `width`, `kind`, `modulus`, `maxValue`, `first`, `second`, `timeUnit`, `intervalSeconds`, `delta`, `wrapped`, `bitsPerSecond` (octets) or `packetsPerSecond` (packets), `speedBitsPerSecond`, `packetOctets`, `utilisationPercent`, `lineRateMaxCount`, `lineRateCycles`, `verdict` (`ok`, `ok-unchecked`, `wrapped`, `unreliable` or `impossible`), `verdictText`, `rfc2863`, `warnings` and `notes`.
- **Errors.** HTTP 400, `invalid_input`, with the engine's message, for example `The second sysUpTime is lower than the first: ...` or `"125 MB/s" reads as bytes per second (a capital B). Enter the interface speed in bits per second, for example 10 Gb/s.`

## Sources

- [RFC 2578, Structure of Management Information Version 2 (SMIv2), April 1999 (STD 58)](https://www.rfc-editor.org/rfc/rfc2578.txt) (read 2026-11-02): sections 7.1.6 Counter32, 7.1.8 TimeTicks and 7.1.10 Counter64; [errata page](https://www.rfc-editor.org/errata/rfc2578): no errata
- [RFC 2863, The Interfaces Group MIB, June 2000](https://www.rfc-editor.org/rfc/rfc2863.txt) (read 2026-11-02): section 3.1.6 Counter Size; ifInOctets, ifHCInOctets, ifSpeed, ifHighSpeed and ifCounterDiscontinuityTime; [errata](https://www.rfc-editor.org/errata/rfc2863) (read 2026-11-02). A Draft Standard, updated by RFC 8892 on interface-type registration only
- [RFC 3418, Management Information Base (MIB) for the Simple Network Management Protocol (SNMP), December 2002 (STD 62)](https://www.rfc-editor.org/rfc/rfc3418.txt) (read 2026-11-02): sysUpTime
- [RFC 2579, Textual Conventions for SMIv2, April 1999 (STD 58)](https://www.rfc-editor.org/rfc/rfc2579.txt) (read 2026-11-02): TimeStamp, and sysUpTime going round after about 497 days
- [RFC 2544, Benchmarking Methodology for Network Interconnect Devices, March 1999](https://www.rfc-editor.org/rfc/rfc2544.txt) (read 2026-11-02): Appendix B, Maximum frame rates reference. Informational, updated by RFC 6201, 6815 and 9004
- [RFC Editor, RFC index (XML)](https://www.rfc-editor.org/rfc-index.xml) (read 2026-11-02): the current status of each RFC above; none is obsoleted
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-11-02): section 3.5, the fragment, which carries a Share results link's values
- [Net-SNMP Wiki, TUT:snmpget](https://www.net-snmp.org/wiki/index.php/TUT:snmpget) (read 2026-11-02): snmpget's default output line, `<MIB>::<object>.<index> = <Type>: <value>`, and sysUpTime printed as `Timeticks: (<ticks>) <days>, <h:mm:ss.cc>`
- [Net-SNMP, snmpcmd(1) manual page](https://www.net-snmp.org/docs/man/snmpcmd.html) (read 2026-11-02): OUTPUT OPTIONS, `-On`, `-Of`, `-Os`, `-OS`, `-Ov`, `-OQ`, `-Oq` and `-Ot`
- [Net-SNMP 5.9.4 source, snmplib/mib.c](https://raw.githubusercontent.com/net-snmp/net-snmp/v5.9.4/snmplib/mib.c) (read 2026-11-02): the type labels the value printers write, `Counter32: `, `Counter64: `, `Timeticks: (<ticks>) ` and the rest; 5.9.4 is the release [net-snmp.org](https://www.net-snmp.org/download.html) names as current
