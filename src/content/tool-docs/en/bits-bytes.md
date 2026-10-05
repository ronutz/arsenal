## What it does

Three fields: a size, a rate and a time. Any one of them is explained on its own; any two give the third.

- **A size** ("1.5 GB", "700 MiB", "10K", "8 bits", "2 kilobytes") comes back as an exact number of bits and bytes, as a value in every unit of both conventions (bits with SI and binary prefixes, bytes with SI prefixes, bytes with IEC prefixes), and, when the label was an SI prefix on bytes, as the same label read both ways with the gap between them.
- **A rate** ("100 Mbit/s", "12.5 MB/s", "1 Gbps", "56k") comes back in bits and bytes per second, in every rate unit, and as the amount it moves in a minute, an hour and a day.
- **A time** ("90 s", "2h 30min", "1 day") is read exactly, to the millisecond. The units are ms, s, min, h and d, spelled out in English or Portuguese (seconds, minutes, hours, days; segundos, minutos, horas, dias).
- **Two of the three** give the third: size over rate is the transfer time (with its parts), size over time is the rate achieved, rate times time is the amount moved. With all three, the time is recomputed from size and rate.
- **Efficiency** scales the rate: a preset for TCP over IPv4 over Ethernet, TCP over IPv6, UDP over IPv4, or any percentage.
- **The connection table** answers the transfer-time question for a set of standard links at once, at the efficiency chosen.

## The two kinds of kilo

The prefixes have two meanings in computing, and the calculator keeps them apart by spelling, as the standards do:

- **SI prefixes are decimal.** k is 1000, M is 1 000 000 and so on; a kilobyte (kB) is 1000 bytes, a megabit (Mbit) is 1 000 000 bits. This is what the prefixes mean everywhere else in science, and what disk and network makers mean.
- **IEC binary prefixes are powers of 1024.** The IEC approved them in December 1998 (IEC 60027-2 Amendment 2, published 1999-01; now IEC 80000-13): kibi Ki 2^10, mebi Mi 2^20, gibi Gi 2^30, tebi Ti 2^40, pebi Pi 2^50, exbi Ei 2^60. A kibibyte (KiB) is 1024 bytes; a mebibyte (MiB) is 1 048 576 bytes. NIST notes these are not part of the SI.
- **The old habit.** Before 1998, and in some software still, "KB" and "MB" meant 1024 and 1 048 576 bytes. The gap grows with the prefix: 2.4 % at kilo, 4.86 % at mega, 7.37 % at giga, 10 % at tera, 12.6 % at peta. A "1 TB" disk holds 1 000 000 000 000 bytes, which a system counting in powers of 1024 shows as 931 GiB and may label "931 GB"; nothing is missing. The calculator prints both readings for any SI label on bytes so the question never has to be argued.

How the input is read:

- `b` is a bit and `B` a byte; `bit`, `bits`, `byte`, `bytes` and `octet` are accepted, and the spelled-out prefixes (kilobyte, mebibit).
- `k`, `K`, `M`, `G`, `T`, `P`, `E`, `Z` are decimal; `Ki`, `Mi`, `Gi`, `Ti`, `Pi`, `Ei`, `Zi` are binary.
- A bare prefix with no unit (`10K`, `1.5M`) is read as a power of 1024 of bytes, which is how `ls -h` and `du -h` print sizes (the GNU ls page: K, M, G, T, P, E, Z, Y, R, Q are powers of 1024, KB, MB and so on powers of 1000, and KiB equals K); the result says so.
- `Kb`, `Mb`, `Gb` (a capital prefix with a lower-case b) are read as bits, which is what the symbol says, and flagged, because some product sheets write bytes that way.
- A rate is a size followed by `/s` or `ps`: `Mbit/s`, `MB/s`, `Mbps`, `kbps`. A bare `56k` as a rate is 56 000 bit/s.
- A comma or a point serves as the decimal separator on input (`1,5 GB` and `1.5 GB` are the same size); results are printed with the separator of the page's language.

## Efficiency presets

A link's nominal rate counts every bit on the wire. Payload moves slower, because every frame carries headers, a preamble and a gap. For full 1500-byte frames:

| Preset | Payload per frame | On the wire per frame | Efficiency |
|---|---|---|---|
| TCP over IPv4 over Ethernet | 1500 - 20 (IPv4) - 20 (TCP) = 1460 | 1500 + 14 + 4 + 8 + 12 = 1538 | 94.93 % |
| TCP over IPv6 over Ethernet | 1500 - 40 (IPv6) - 20 (TCP) = 1440 | 1538 | 93.63 % |
| UDP over IPv4 over Ethernet | 1500 - 20 (IPv4) - 8 (UDP) = 1472 | 1538 | 95.71 % |

The header minima are RFC 791 (IPv4, 20 octets), RFC 8200 (IPv6, 40 octets, stated in its section 8.3 as 20 octets longer than the minimum IPv4 header), RFC 9293 (TCP, 20 octets) and RFC 768 (UDP, 8 octets). The frame overhead is RFC 2544 Appendix C: "Preamble 64 bits, Frame 8 x N bits, Gap 96 bits", with N the frame including the 14-byte header and the 4-byte FCS; the same appendix's 812 frames per second of 1518 bytes at 10 Mb/s is 10 000 000 / (1538 x 8), and the golden vector `rfc2544-frame-time` reproduces it. These presets are ceilings: a real TCP transfer also spends capacity on acknowledgements, slow start and retransmission.

## The connection table

| Link | Nominal rate | Source |
|---|---|---|
| 56k modem | 56 000 bit/s downstream | ITU-T V.90 (09/98) |
| ISDN, one B channel | 64 kbit/s | the 2004 calculator's table |
| T1 | 1 544 kbit/s | ITU-T G.704 (10/98) |
| E1 | 2 048 kbit/s | ITU-T G.704 (10/98) |
| Ethernet 10 Mb/s to 400 Gb/s | 10, 100, 1000 Mb/s; 2.5, 5, 10, 25, 40, 100, 400 Gb/s | IEEE 802.3-2022 |

The rows marked 2004 were in the connection table of the bits-and-bytes calculator on nutzmann.net in 2004 and ntz.com.br in 2013, the oldest ancestor of the tools on this site. Its worked example is the Example button here: a "56k" file over a "56k" modem takes about 8.2 seconds, not one, because the file is 56 KiB (57 344 bytes, 458 752 bits) and the modem moves 56 000 bits a second: 8.192 s exactly.

## Exactness

Every quantity is held as an integer mantissa and a power of ten, and every rate and time as a ratio of two such numbers, so nothing is rounded until it is printed. Printed values keep up to six decimals; a value whose exact form does not terminate (one third of a second) is marked as rounded. Durations are broken into days, hours, minutes, seconds and milliseconds, half-up at the millisecond, and the total is also given in seconds to six decimals. A zettabyte in bits is written out in full.

## Limits

- Not modelled: TCP windows and round-trip time, loss, compression, and the gap between a link's nominal rate and what a provider delivers. The efficiency presets are per-frame ceilings.
- The calculator states what a label means under each convention. Which convention a particular operating system uses to display sizes is that system's documentation to state; the calculator does not claim it.
- Each field is cut at 64 characters and read by one anchored expression; the arithmetic is BigInt, so no value overflows.

## Sources

- [NIST: Prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html) (read 2026-10-04)
- [ls(1), GNU coreutils (man7.org)](https://man7.org/linux/man-pages/man1/ls.1.html) (read 2026-10-04): -h, --si and the SIZE argument
- [RFC 2544, Appendix C](https://www.rfc-editor.org/rfc/rfc2544#appendix-C) (read 2026-10-04)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791) (read 2026-10-04)
- [RFC 8200: IPv6, section 8.3](https://www.rfc-editor.org/rfc/rfc8200#section-8.3) (read 2026-10-04)
- [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) (read 2026-10-04)
- [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768) (read 2026-10-04)
- [ITU-T V.90 (09/98)](https://www.itu.int/rec/T-REC-V.90/en) (read 2026-10-04)
- [ITU-T G.704 (10/98)](https://www.itu.int/rec/T-REC-G.704/en) (read 2026-10-04)
- [IEEE 802.3-2022](https://standards.ieee.org/ieee/802.3/10422/) (read 2026-10-04)
- [nutzmann.net, Calculadora de bits e bytes (2004), Internet Archive](https://web.archive.org/web/20041009131549/http://nutzmann.net:80/bitsandbytes.htm) (read 2026-10-04): the 2004 calculator's worked example, its IEC note and its connection table
- [ntz.com.br, Calculadora e conversão de bits e bytes (2013), Internet Archive](https://web.archive.org/web/2013/http://ntz.com.br/bitsandbytes.html) (read 2026-10-04): the same calculator on the 2013 site, with its IEC prefix table
