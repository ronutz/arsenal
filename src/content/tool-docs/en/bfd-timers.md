## What it does

Bidirectional Forwarding Detection (BFD) sessions are configured with three intervals and a multiplier on each router, but the number that matters, the detection time, is never sent: each receiver computes it ([RFC 5880, section 6.8.4](https://www.rfc-editor.org/rfc/rfc5880.txt)). Enter both systems' values and the calculator works out, for each direction separately, the agreed transmit interval and which side set it, the jitter range applied to it, the packet rate, the detection time the receiving system computes, whether the interval is one of RFC 7419's Common Intervals, and whether Echo packets may flow. Every number comes with a plain-language explanation and the section of the standard it comes from. A second mode decodes a BFD Control packet given in hex. Everything is computed in your browser.

## The inputs

For each system, A and B:

- **Desired Min TX Interval**: how fast the system would like to send Control packets.
- **Required Min RX Interval**: how fast it can receive them. `0` means it does not want periodic Control packets at all.
- **Detect Mult**: 1 to 255.
- **Required Min Echo RX Interval** (optional): how fast it will loop Echo packets back. Empty or `0` means it will not loop them.
- **Demand mode**: whether the system asks for Demand mode.

Intervals take a unit: `us` (or `µs`), `ms` or `s`, as in `300ms`, `300000us`, `16.7ms` or `1s`. The protocol carries whole microseconds in 32-bit fields ([RFC 5880, section 4.1](https://www.rfc-editor.org/rfc/rfc5880.txt)), so a value must come out as a whole number of microseconds and at most 4294967295. A Desired Min TX of `0` is refused: the RFC reserves it.

Two choices apply to the whole session: the **session state**, Up or not Up, and the **path**, single hop ([RFC 5881](https://www.rfc-editor.org/rfc/rfc5881.txt)) or multihop ([RFC 5883](https://www.rfc-editor.org/rfc/rfc5883.txt)).

## The rules it applies

All from documents read on 2026-10-19:

- **Slow start.** While the session is not Up, each system advertises a Desired Min TX of at least one second: "When bfd.SessionState is not Up, the system MUST set bfd.DesiredMinTxInterval to a value of not less than one second (1,000,000 microseconds)" ([RFC 5880, section 6.8.3](https://www.rfc-editor.org/rfc/rfc5880.txt)). The calculator raises any smaller value and says so.
- **The agreed interval.** In each direction, the larger of the sender's Desired Min TX and the receiver's Required Min RX: "the system reporting the slower rate determines the transmission rate" ([RFC 5880, section 6.8.7](https://www.rfc-editor.org/rfc/rfc5880.txt)). The two directions are negotiated independently (section 6.8.2).
- **Jitter.** Each interval is reduced by a random 0 to 25%, so the gap between packets is 75% to 100% of the agreed interval, about 87.5% on average. When the sender's Detect Mult is 1, the gap must stay between 75% and 90% (section 6.8.7).
- **The detection time.** In Asynchronous mode, the receiver multiplies the Detect Mult it receives from the sender by the agreed interval. In Demand mode, the system in Demand mode uses its own Detect Mult times its own agreed transmit interval, counted from the start of a Poll Sequence (section 6.8.4).
- **When no periodic packets flow.** A Required Min RX of 0 stops the other side's periodic Control packets (sections 4.1 and 6.8.7), and so does Demand mode once the session is Up on both sides ([RFC 5880, section 6.6](https://www.rfc-editor.org/rfc/rfc5880.txt)). Demand mode requested while the session is not Up is reported but not applied.
- **Echo.** A system may send Echo packets only while the session is Up and the other system advertises a nonzero Required Min Echo RX, no more often than that value (a 25% jitter may apply) ([RFC 5880, section 6.8.9](https://www.rfc-editor.org/rfc/rfc5880.txt)); never over multiple hops ([RFC 5883, section 3](https://www.rfc-editor.org/rfc/rfc5883.txt)). The way Echo failures are detected is outside the scope of RFC 5880 (section 6.8.5), so no Echo detection time is computed. With Echo active a system SHOULD raise its own Required Min RX to at least one second (section 6.8.3), and the calculator reminds you when it is lower.
- **Common Intervals.** RFC 7419 defines the set 3.3, 10, 20, 50, 100 ms and 1 s, recommends 10 s for graceful restart, and says adjustment is "always towards larger (i.e., slower) interval values" ([RFC 7419, section 3](https://www.rfc-editor.org/rfc/rfc7419.txt)). The calculator says whether each agreed interval is in the set and, if not, which Common Interval is next above it.
- **Implementation floors.** A warning appears only where a downloaded vendor document states a minimum: FRRouting's bfdd accepts `receive-interval`, `transmit-interval` and `echo receive-interval` from 10 to 4294967 milliseconds ([FRRouting documentation, BFD](https://docs.frrouting.org/en/latest/bfd.html)), and the Junos OS 13.1 documentation, published 2013-08-15, gives 1 to 255,000 milliseconds for `minimum-interval` and its receive and transmit halves ([Juniper Networks, Junos OS 13.1](https://juniper.net/documentation/en_US/junos13.1/topics/reference/configuration-statement/bfd-liveness-detection-edit-protocols-bgp.html)). The Junos page is old and the warning names its release.

It also notes when the two directions detect at different times, and the UDP ports in use: 3784 for single-hop Control packets and 3785 for Echo ([RFC 5881, section 4](https://www.rfc-editor.org/rfc/rfc5881.txt)), 4784 for multihop ([RFC 5883, section 5](https://www.rfc-editor.org/rfc/rfc5883.txt)).

## Decode mode

Paste a BFD Control packet in hex: the 24-byte Mandatory Section, optionally followed by an Authentication Section. Spaces, colons, hyphens, dots and a leading `0x` are accepted. The decoder shows version, diagnostic (with its name from RFC 5880 section 4.1, or from the IANA registry for 9), state, the six flags P, F, C, A, D and M, Detect Mult, Length, both discriminators and the three intervals in microseconds and in readable units. It then applies the receive checks of RFC 5880 section 6.8.6 in their order (version 1, minimum Length, Length not beyond the bytes given, nonzero Detect Mult, M clear, nonzero My Discriminator, and Your Discriminator nonzero unless the state is Down or AdminDown) and reports the first one that discards the packet. Other findings include Poll and Final set together (section 6.5), the Demand bit set while not Up (section 6.8.7), and a Desired Min TX under one second while not Up (section 6.8.3). When the A bit is set it shows the Auth Type and Auth Len only; authentication data is never displayed.

## Worked examples

- FRRouting's defaults on both sides, 300 ms each way and multiplier 3: each direction agrees on 300 ms, packets leave every 225 to 300 ms (about 262.5 ms on average), 3.333 packets per second, and each side detects a failure after 900 ms. 300 ms is not a Common Interval; the next one up is 1 s.
- The Example button, FRRouting's own case: A at 300 ms with multiplier 3, B receiving at 200 ms. B detects after 900 ms, the number FRRouting's documentation gives.
- The same peers not Up, as in FRRouting's `show bfd peers` sample (local 300 ms, remote 1000 ms): both directions run at 1 s and the detection time is 3000 ms, the sample's `Detection timeout: 3000ms`; its `970ms` actual interval sits inside the 750 to 1000 ms jitter range.
- 100 ms with multiplier 9: 900 ms, RFC 7419's alternative to 3 times 300 ms. 10 s with multiplier 255: 2550 s, the 42.5 minutes of RFC 7419 Appendix A.
- A at 10 ms, B at 20 ms: both directions negotiate 20 ms, as in RFC 7419 section 2, and detect after 60 ms.
- A with a Required Min RX of 1000 ms against FRRouting defaults: A detects after 3000 ms, B after 900 ms.
- Decode `20 c0 03 18 00 00 00 01 00 00 00 02 00 04 93 e0 00 04 93 e0 00 00 00 00`: version 1, diagnostic 0, Up, no flags, Detect Mult 3, Length 24, discriminators 1 and 2, 300 ms each way, no Echo; no receive check discards it.

## Provenance

The engine is fixed arithmetic over the rules above, with no clock, no network and no randomness. It ships 42 golden vectors (set `bfd-timers-golden-2026-10-19`): 16 calculator cases, 13 decoder cases and 13 refusals. Each case names the document and section that fixes its expected numbers, among them FRRouting's 900 ms example and `show bfd peers` sample, RFC 7419's 20 ms, 9 times 100 ms and 42.5-minute cases, and RFC 5880's 16.7 ms session. The RFC 5880 errata were read the same day: none changes the timer arithmetic (5205 and 4410 are held for a future update; 7082 and 7083 order the authentication checks). RFC 7419 and RFC 5883 have no errata.

## API

The same engine answers the `/api/v1/bfd-timers` operation of the site's HTTP API, written out field by field in the OpenAPI contract on the [API page](/api), with examples taken from the golden vectors. The contract also says whether this site serves the API.

- **Request.** A JSON object. Calculator: `{"a": {...}, "b": {...}, "sessionUp": true, "path": "single-hop"}`, where each system has `desiredMinTx`, `requiredMinRx`, `detectMult`, and optionally `requiredMinEchoRx` and `demand`. Intervals are strings with a unit (`"300ms"`) or numbers of microseconds (`300000`). Decoder: `{"mode": "decode", "packet": "20 c0 03 18 ..."}`.
- **Response, calculator.** `mode` (`timers`), `sessionUp`, `path`, `systems` (each with the parsed microsecond values, the advertised Desired Min TX after the slow-start rule, and whether Demand mode is requested and active), `directions` (A to B, then B to A, each with `intervalUs`, `setBy`, `periodic`, `silentReason`, `jitter`, `packetsPerSecond`, `detection` with `kind`, `detectMult`, `intervalUs` and `timeUs`, `commonInterval`, `nextCommonIntervalUs`, `echo`, and `explanations`), `warnings` and `notes`. Every explanation, warning and note has an `id`, the `section` it comes from, its `params` and an English `text`. For FRRouting's example the API answers `intervalUs` 300000 and `detection.timeUs` 900000 from A to B.
- **Response, decoder.** `mode` (`decode`), `hex`, `bytes`, `version`, `diagnostic`, `state`, `flags`, `detectMult`, `length`, `myDiscriminator`, `yourDiscriminator`, `desiredMinTxUs`, `requiredMinRxUs`, `requiredMinEchoRxUs`, `auth`, `discardedBy` (the first failing receive check, or null) and `findings`.
- **Errors.** HTTP 400, `invalid_input`, with the engine's message, for example `a.desiredMinTx: "300" is not an interval; write a number and a unit (us, ms or s), such as 300ms`.

## Sources

- [RFC 5880, Bidirectional Forwarding Detection (BFD), June 2010](https://www.rfc-editor.org/rfc/rfc5880.txt) (read 2026-10-19): sections 4.1, 6.5, 6.6, 6.8.2, 6.8.3, 6.8.4, 6.8.5, 6.8.6, 6.8.7 and 6.8.9; [errata](https://www.rfc-editor.org/errata/rfc5880) (read 2026-10-19)
- [RFC 5881, Bidirectional Forwarding Detection (BFD) for IPv4 and IPv6 (Single Hop), June 2010](https://www.rfc-editor.org/rfc/rfc5881.txt) (read 2026-10-19): section 4
- [RFC 5883, Bidirectional Forwarding Detection (BFD) for Multihop Paths, June 2010](https://www.rfc-editor.org/rfc/rfc5883.txt) (read 2026-10-19): sections 3 and 5
- [RFC 7419, Common Interval Support in Bidirectional Forwarding Detection, December 2014](https://www.rfc-editor.org/rfc/rfc7419.txt) (read 2026-10-19): sections 2 and 3 and Appendix A; [errata page](https://www.rfc-editor.org/errata/rfc7419): no errata
- [FRRouting documentation, BFD (bfdd), latest](https://docs.frrouting.org/en/latest/bfd.html) (read 2026-10-19): Peer / Profile Configuration and Status
- [Juniper Networks, Junos OS 13.1, bfd-liveness-detection (Protocols BGP), published 2013-08-15](https://juniper.net/documentation/en_US/junos13.1/topics/reference/configuration-statement/bfd-liveness-detection-edit-protocols-bgp.html) (read 2026-10-19)
- [IANA, Bidirectional Forwarding Detection (BFD) Parameters](https://www.iana.org/assignments/bfd-parameters/bfd-parameters.xhtml) (read 2026-10-19): BFD Diagnostic Codes and BFD Authentication Types
