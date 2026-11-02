// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/snmp-counter-wrap-calculator/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the SNMP interface counter wrap and rate calculator.
//
// Every expected number below was derived on 2026-11-02 by a separate Python
// oracle (fractions.Fraction, the same rules written independently, in the
// build's work folder), not by running this engine, and is compared here as
// exact text: the engine prints exact rationals rounded half up to six
// decimals, trailing zeros removed. Each vector names where its numbers come
// from:
//   - the seven preset speeds x Counter32/Counter64 x octets/packets at line
//     rate (2^width x 8 / speed for octets; 2^width x 8 x 84 / speed for
//     packets, 84 octets being the smallest Ethernet frame on the wire, RFC
//     2544 Appendix B);
//   - RFC 2863 s3.1.6's thresholds at, just above and just below 20,000,000
//     and 650,000,000 bit/s (one of them a nanobit above 20,000,000, which a
//     double could not tell apart);
//   - RFC 2863 s3.1.6's own arithmetic (57 minutes at 10 Mb/s, 34 seconds at
//     1 Gb/s, about 57 minutes for 64-byte packets at 650 Mb/s, just under 5
//     years for a 64-bit octet counter at 1 Tb/s);
//   - the four poll verdicts and their exact boundaries;
//   - deltas with no wrap, with one 32-bit and one 64-bit wrap, an interval
//     long enough for a full cycle, a delta the interface could not count,
//     sysUpTime input, decimal seconds, and the refusals (zero and negative
//     intervals among them);
//   - the page's two Examples (D-83): the wrap Example, a 10 Gb/s port at 40 %
//     polled every 300 s with Counter32 (it goes round about 35 times between
//     polls), and the rate Example, two Counter64 readings 30000 sysUpTime
//     ticks apart;
//   - (set "b", 02/11/2026) pasted snmpget output: each documented form of a
//     counter line (named, numeric, full OID, value only, type removed) and of
//     a sysUpTime line (the default, value only, raw ticks with -Ot, full OID),
//     the readings and day-and-clock texts taken from Net-SNMP's own tutorial
//     and snmpcmd(1) pages where they print one; the expected numbers from the
//     same independent oracle (exact fractions); and the new refusals: a line
//     whose Counter32/Counter64 disagrees with the declared width, a type that
//     is not a counter, a Timeticks line with the times in seconds, the quick
//     form, and a field one character past the 144-character bound.
// GOLDEN_VECTOR_SET_ID changes whenever a vector changes (the api-sync rule).
// ============================================================================

import { run, runApi, type CounterRequest, type CounterResult } from "./compute"; // the engine's API entries
import { EXAMPLE_WRAP_REQUEST, EXAMPLE_RATE_REQUEST } from "./examples"; // the page's Examples, pinned below

/** The set id: dated, changed with any vector (scripts/check-api-sync.mjs compares it with scripts/api-sync.json). */
export const GOLDEN_VECTOR_SET_ID = "snmp-counter-wrap-calculator-golden-2026-11-02b"; // the second set: pasted snmpget lines (02/11/2026)

/** One vector: a request (or raw API text), and either the fields expected or the error expected. */
export interface CounterVector {
  /** A stable id. */
  id: string;
  /** Where the expected numbers come from. */
  note: string;
  /** The request object (run()). */
  request?: CounterRequest;
  /** Or the raw API body (runApi()). */
  api?: string;
  /** The fields expected, compared exactly as JSON (a subset of the reading; nested objects are subsets too). */
  expect?: Record<string, unknown>;
  /** Text every listed warning or note must contain, by list. */
  contains?: { warnings?: string[]; notes?: string[]; verdictText?: string; pollText?: string };
  /** The error expected, as a pattern over its message. */
  expectError?: RegExp;
}

/** The page's two Examples (D-83), shared with the component through examples.ts and re-exported here. */
export { EXAMPLE_WRAP_REQUEST, EXAMPLE_RATE_REQUEST }; // the wrap Example and the rate Example

/** The seven presets at line rate, both widths, both kinds: [label, width, kind, wrapSeconds, marginPollSeconds] from the oracle. */
const PRESET_TABLE: readonly [string, 32 | 64, "octets" | "packets", string, string][] = [
  ["100 Mb/s", 32, "octets", "343.597384", "171.798692"], // 2^32 x 8 / 10^8
  ["100 Mb/s", 32, "packets", "28862.180229", "14431.090115"], // 2^32 x 672 / 10^8
  ["100 Mb/s", 64, "octets", "1475739525896.764129", "737869762948.382065"], // 2^64 x 8 / 10^8
  ["100 Mb/s", 64, "packets", "123962120175328.18686", "61981060087664.09343"], // 2^64 x 672 / 10^8
  ["1 Gb/s", 32, "octets", "34.359738", "17.179869"], // RFC 2863 s3.1.6: "at 1Gbs, the minimum is 34 seconds"
  ["1 Gb/s", 32, "packets", "2886.218023", "1443.109011"], // 2^32 x 672 / 10^9
  ["1 Gb/s", 64, "octets", "147573952589.676413", "73786976294.838206"], // 2^64 x 8 / 10^9
  ["1 Gb/s", 64, "packets", "12396212017532.818686", "6198106008766.409343"], // 2^64 x 672 / 10^9
  ["10 Gb/s", 32, "octets", "3.435974", "1.717987"], // the Learn article's "under four seconds"
  ["10 Gb/s", 32, "packets", "288.621802", "144.310901"], // 14,880,952 frames/s, the 10 Gb/s scaling of RFC 2544 App. B's 14880
  ["10 Gb/s", 64, "octets", "14757395258.967641", "7378697629.483821"], // 2^64 x 8 / 10^10
  ["10 Gb/s", 64, "packets", "1239621201753.281869", "619810600876.640934"], // 2^64 x 672 / 10^10
  ["25 Gb/s", 32, "octets", "1.37439", "0.687195"], // 2^32 x 8 / 2.5 x 10^10
  ["25 Gb/s", 32, "packets", "115.448721", "57.72436"], // 2^32 x 672 / 2.5 x 10^10
  ["25 Gb/s", 64, "octets", "5902958103.587057", "2951479051.793528"], // 2^64 x 8 / 2.5 x 10^10
  ["25 Gb/s", 64, "packets", "495848480701.312747", "247924240350.656374"], // 2^64 x 672 / 2.5 x 10^10
  ["40 Gb/s", 32, "octets", "0.858993", "0.429497"], // 2^32 x 8 / 4 x 10^10
  ["40 Gb/s", 32, "packets", "72.155451", "36.077725"], // 2^32 x 672 / 4 x 10^10
  ["40 Gb/s", 64, "octets", "3689348814.74191", "1844674407.370955"], // 2^64 x 8 / 4 x 10^10
  ["40 Gb/s", 64, "packets", "309905300438.320467", "154952650219.160234"], // 2^64 x 672 / 4 x 10^10
  ["100 Gb/s", 32, "octets", "0.343597", "0.171799"], // 2^32 x 8 / 10^11
  ["100 Gb/s", 32, "packets", "28.86218", "14.43109"], // 2^32 x 672 / 10^11
  ["100 Gb/s", 64, "octets", "1475739525.896764", "737869762.948382"], // 2^64 x 8 / 10^11
  ["100 Gb/s", 64, "packets", "123962120175.328187", "61981060087.664093"], // 2^64 x 672 / 10^11
  ["400 Gb/s", 32, "octets", "0.085899", "0.04295"], // 2^32 x 8 / 4 x 10^11
  ["400 Gb/s", 32, "packets", "7.215545", "3.607773"], // 2^32 x 672 / 4 x 10^11
  ["400 Gb/s", 64, "octets", "368934881.474191", "184467440.737096"], // 2^64 x 8 / 4 x 10^11
  ["400 Gb/s", 64, "packets", "30990530043.832047", "15495265021.916023"], // 2^64 x 672 / 4 x 10^11
]; // 28 rows

/** The preset vectors, one per row. */
const PRESET_VECTORS: CounterVector[] = PRESET_TABLE.map(([speed, width, kind, wrap, margin]) => ({
  id: `preset-${speed.replace(/ /g, "").replace("/", "")}-c${width}-${kind}`, // e.g. preset-10Gbs-c32-octets
  note: `Line rate at ${speed}, Counter${width} of ${kind}: 2^${width} x 8${kind === "packets" ? " x 84" : ""} / speed (oracle).`, // the arithmetic
  request: { mode: "wrap", width, kind, speed }, // utilisation and packet size default to 100 and 84
  expect: { wrapSeconds: wrap, lineRateWrapSeconds: wrap, neverMissBelowSeconds: wrap, marginPollSeconds: margin, utilisationPercent: "100", packetOctets: kind === "packets" ? 84 : null }, // at line rate the two wrap times agree
})); // 28 vectors

/** The other vectors, written out. */
const OTHER_VECTORS: CounterVector[] = [
  // ---- RFC 2863 s3.1.6 thresholds -------------------------------------------------------------------------------
  {
    id: "rfc2863-20m-exact", // the top of the 32-bit band
    note: 'RFC 2863 s3.1.6: "20,000,000 (20 million) bits per second or less": 32-bit counters; 2^32 x 8 / 2 x 10^7 = 1717.986918 s (oracle).',
    request: { mode: "wrap", width: 32, kind: "octets", speed: "20000000" },
    expect: { wrapSeconds: "1717.986918", rfc2863: { band: "up-to-20m", octets64Required: false, packets64Required: false, thisCounterRequires64: false }, warnings: [] },
  },
  {
    id: "rfc2863-20m-plus-one", // one bit/s faster
    note: 'RFC 2863 s3.1.6: "faster than 20,000,000 bits/second ... 64-bit octet counters MUST be supported"; 1717.986833 s (oracle).',
    request: { mode: "wrap", width: 32, kind: "octets", speed: "20000001" },
    expect: { wrapSeconds: "1717.986833", rfc2863: { band: "20m-to-650m", octets64Required: true, packets64Required: false, thisCounterRequires64: true } },
    contains: { warnings: ["ifHCInOctets"] },
  },
  {
    id: "rfc2863-20m-plus-a-nanobit", // exactness: a double reads 20000000.000000001 as 20000000
    note: "A nanobit per second above 20,000,000 is already in the 64-bit octet band; the wrap time rounds to the 20 Mb/s value at six decimals (oracle).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "20000000.000000001" },
    expect: { speedBitsPerSecond: "20000000", wrapSeconds: "1717.986918", rfc2863: { band: "20m-to-650m", octets64Required: true } },
  },
  {
    id: "rfc2863-650m-minus-one-packets", // the top of the middle band, for packets
    note: 'RFC 2863 s3.1.6: below 650,000,000 bit/s "32-bit packet counters MUST be supported"; 2^32 x 672 / 649999999 = 4440.335427 s (oracle).',
    request: { mode: "wrap", width: 32, kind: "packets", speed: "649999999" },
    expect: { wrapSeconds: "4440.335427", rfc2863: { band: "20m-to-650m", octets64Required: true, packets64Required: false, thisCounterRequires64: false }, warnings: [] },
  },
  {
    id: "rfc2863-650m-exact-packets", // the start of the all-64-bit band
    note: 'RFC 2863 s3.1.6: "650,000,000 bits/second or faster, 64-bit packet counters AND 64-bit octet counters MUST be supported"; 4440.33542 s (oracle).',
    request: { mode: "wrap", width: 32, kind: "packets", speed: "650 Mb/s" },
    expect: { wrapSeconds: "4440.33542", rfc2863: { band: "650m-and-above", octets64Required: true, packets64Required: true, thisCounterRequires64: true } },
    contains: { warnings: ["ifHCInUcastPkts"] },
  },
  // ---- RFC 2863 s3.1.6's own arithmetic --------------------------------------------------------------------------
  {
    id: "rfc2863-text-10mbs-57-minutes", // "just over 57 minutes"
    note: 'RFC 2863 s3.1.6: "a 10Mbs stream of back-to-back, full-size packets causes ifInOctets to wrap in just over 57 minutes": 3435.973837 s = 57.27 min (oracle).',
    request: { mode: "wrap", width: 32, kind: "octets", speed: "10 Mb/s" },
    expect: { wrapSeconds: "3435.973837", rfc2863: { band: "up-to-20m" } },
  },
  {
    id: "rfc2863-text-1gbs-34-seconds", // "at 1Gbs, the minimum is 34 seconds"
    note: 'RFC 2863 s3.1.6: "at 1Gbs, the minimum is 34 seconds": 34.359738 s (oracle).',
    request: { mode: "wrap", width: 32, kind: "octets", speed: "1G" },
    expect: { speedBitsPerSecond: "1000000000", wrapSeconds: "34.359738" },
  },
  {
    id: "rfc2863-text-650m-64-byte-packets", // "about 57 minutes"
    note: 'RFC 2863 s3.1.6: "The 32-bit packet counters wrap in about 57 minutes when 64-byte packets are transmitted back-to-back on a 650,000,000 bit/second link": 3383.112701 s = 56.4 min, counting 64 octets a packet as the RFC does (oracle).',
    request: { mode: "wrap", width: 32, kind: "packets", speed: "650000000", packetOctets: "64" },
    expect: { wrapSeconds: "3383.112701", packetOctets: 64 },
    contains: { notes: ["less than the 84 octets"] },
  },
  {
    id: "rfc2863-text-1tbs-under-5-years", // "just under 5 years"
    note: 'RFC 2863 s3.1.6: "a 1-terabit/second (1,000 Gbs) link will cause a 64 bit octet counter to wrap in just under 5 years": 147573952.589676 s = 4.68 years of 365.25 days (oracle).',
    request: { mode: "wrap", width: 64, kind: "octets", speed: "1 Tb/s" },
    expect: { wrapSeconds: "147573952.589676", otherWidth: { width: 32, wrapSeconds: "0.03436" } },
  },
  // ---- The wrap Example (D-83) -----------------------------------------------------------------------------------
  {
    id: "example-10g-40pct-300s-c32", // the page's Example: it goes round about 35 times between polls
    note: "10 Gb/s at 40 % is 500,000,000 octets/s; 2^32 / 5 x 10^8 = 8.589935 s; 300 s count 1.5 x 10^11 octets = 34.924597 cycles; RFC 2863 requires 64-bit counters at this speed (oracle).",
    request: EXAMPLE_WRAP_REQUEST as unknown as CounterRequest,
    expect: { mode: "wrap", width: 32, kind: "octets", modulus: "4294967296", maxValue: "4294967295", speedBitsPerSecond: "10000000000", utilisationPercent: "40", packetOctets: null, countPerSecond: "500000000", lineRateCountPerSecond: "1250000000", wrapSeconds: "8.589935", lineRateWrapSeconds: "3.435974", otherWidth: { width: 64, wrapSeconds: "36893488147.419103" }, neverMissBelowSeconds: "3.435974", marginPollSeconds: "1.717987", poll: { seconds: "300", countPerPoll: "150000000000", cyclesPerPoll: "34.924597", verdict: "wraps" }, rfc2863: { band: "650m-and-above", octets64Required: true, packets64Required: true, thisCounterRequires64: true } },
    contains: { warnings: ["ifHCInOctets"], pollText: "at least one full cycle", notes: ["no information content", "tool's choice", "divided by 8"] },
  },
  // ---- Poll verdicts ---------------------------------------------------------------------------------------------
  {
    id: "poll-safe-100m-40pct-60s", // well inside the margin
    note: "100 Mb/s Counter32 octets: line-rate wrap 343.597384 s, margin 171.798692 s; 60 s count 3 x 10^8 octets at 40 % = 0.069849 cycles (oracle).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "100 Mb/s", utilisation: "40", poll: "60" },
    expect: { wrapSeconds: "858.993459", lineRateWrapSeconds: "343.597384", marginPollSeconds: "171.798692", otherWidth: { width: 64, wrapSeconds: "3689348814741.910323" }, poll: { seconds: "60", countPerPoll: "300000000", cyclesPerPoll: "0.069849", verdict: "safe" }, rfc2863: { band: "20m-to-650m" } },
    contains: { pollText: "cannot miss a wrap, even at line rate" },
  },
  {
    id: "poll-no-margin-100m-40pct-300s", // under the line-rate wrap, over the margin
    note: "300 s: 171.798692 <= 300 < 343.597384 (oracle).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "100 Mb/s", utilisation: "40", poll: "300" },
    expect: { poll: { seconds: "300", countPerPoll: "1500000000", cyclesPerPoll: "0.349246", verdict: "no-margin" } },
    contains: { pollText: "one lost poll" },
  },
  {
    id: "poll-burst-100m-40pct-600s", // under the load's wrap, over the line-rate wrap
    note: "600 s: 343.597384 <= 600 < 858.993459 (oracle).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "100 Mb/s", utilisation: "40", poll: "10 min" },
    expect: { poll: { seconds: "600", countPerPoll: "3000000000", cyclesPerPoll: "0.698492", verdict: "burst" } },
    contains: { pollText: "a burst towards line rate" },
  },
  {
    id: "poll-wraps-100m-40pct-900s", // over the load's wrap
    note: "900 s >= 858.993459 s: 4.5 x 10^9 octets = 1.047738 cycles (oracle).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "100 Mb/s", utilisation: "40", poll: "0.25 h" },
    expect: { poll: { seconds: "900", countPerPoll: "4500000000", cyclesPerPoll: "1.047738", verdict: "wraps" } },
  },
  {
    id: "poll-boundary-just-under-margin", // 8589934592 bit/s makes the line-rate wrap exactly 4 s
    note: "8589934592 bit/s = 2^30 octets/s: wrap exactly 4 s, margin exactly 2 s; 1.999999 s is safe (oracle).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "8589934592", poll: "1.999999" },
    expect: { wrapSeconds: "4", marginPollSeconds: "2", poll: { seconds: "1.999999", verdict: "safe" } },
  },
  {
    id: "poll-boundary-at-margin", // exactly the margin is not inside it
    note: "Exactly 2 s: the margin is a strict bound, so the verdict is no-margin; 0.5 cycles (oracle).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "8589934592", poll: "2" },
    expect: { poll: { seconds: "2", countPerPoll: "2147483648", cyclesPerPoll: "0.5", verdict: "no-margin" } },
  },
  {
    id: "poll-boundary-at-wrap", // exactly one cycle: the delta would read zero
    note: "Exactly 4 s at line rate counts exactly 2^32 octets, so the value comes back to where it was: wraps (oracle).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "8589934592", poll: "4000 ms" },
    expect: { poll: { seconds: "4", countPerPoll: "4294967296", cyclesPerPoll: "1", verdict: "wraps" } },
  },
  // ---- Packet sizes -----------------------------------------------------------------------------------------------
  {
    id: "packets-64-octets-10g", // RFC 2863's way of counting
    note: "10^10 / (8 x 64) = 19531250 packets/s; 2^32 / that = 219.902326 s (oracle).",
    request: { mode: "wrap", width: 32, kind: "packets", speed: "10 Gb/s", packetOctets: "64" },
    expect: { countPerSecond: "19531250", wrapSeconds: "219.902326", marginPollSeconds: "109.951163" },
    contains: { notes: ["takes 64 octets of line time", "less than the 84 octets"] },
  },
  {
    id: "packets-1500-octets-10g", // a large average packet
    note: "10^10 / (8 x 1500) = 833333.333333 packets/s; 2^32 / that = 5153.960755 s (oracle).",
    request: { mode: "wrap", width: 32, kind: "packets", speed: "10 Gb/s", packetOctets: "1500" },
    expect: { countPerSecond: "833333.333333", wrapSeconds: "5153.960755", packetOctets: 1500 },
    contains: { notes: ["takes 1500 octets of line time"] },
  },
  // ---- Speed and interval spellings -------------------------------------------------------------------------------
  {
    id: "speed-spelling-gbit", // decimal and long unit
    note: "2.5 Gbit/s is exactly 2,500,000,000 bit/s; 2^32 x 8 / 2.5 x 10^9 = 13.743895 s (oracle arithmetic).",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "2.5 Gbit/s" },
    expect: { speedBitsPerSecond: "2500000000", wrapSeconds: "13.743895" },
  },
  {
    id: "speed-spelling-mbps", // a lower-case prefix and bps
    note: "100 mbps reads as 100 Mb/s.",
    request: { mode: "wrap", width: 32, kind: "octets", speed: "100 mbps" },
    expect: { speedBitsPerSecond: "100000000", wrapSeconds: "343.597384" },
  },
  // ---- Rate mode ------------------------------------------------------------------------------------------------
  {
    id: "rate-no-wrap-c32", // the plain case
    note: "51,000,000 - 1,000,000 = 50,000,000 octets in 10 s = 40,000,000 bit/s = 40 % of 100 Mb/s; line rate counts 1.25 x 10^8 in 10 s = 0.029104 cycles (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "1000000", second: "51000000", firstTime: "0", secondTime: "10", speed: "100 Mb/s" },
    expect: { intervalSeconds: "10", delta: "50000000", wrapped: false, bitsPerSecond: "40000000", packetsPerSecond: null, utilisationPercent: "40", lineRateMaxCount: "125000000", lineRateCycles: "0.029104", verdict: "ok", rfc2863: { band: "20m-to-650m" } },
    contains: { verdictText: "usable rate", warnings: ["ifHCInOctets"], notes: ["ifCounterDiscontinuityTime", "no information content"] },
  },
  {
    id: "rate-one-wrap-c32", // a Counter32 that went round once
    note: "2^32 - 4,294,000,000 + 1,032,704 = 2,000,000 octets in 30 s = 533333.333333 bit/s; at 1 Gb/s line rate counts 3.75 x 10^9 < 2^32 in 30 s (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "4294000000", second: "1032704", firstTime: "0", secondTime: "30", speed: "1 Gb/s" },
    expect: { delta: "2000000", wrapped: true, bitsPerSecond: "533333.333333", utilisationPercent: "0.053333", lineRateMaxCount: "3750000000", lineRateCycles: "0.873115", verdict: "wrapped" },
    contains: { verdictText: "the only explanation is a wrap: it reached 4294967295" },
  },
  {
    id: "rate-one-wrap-c64", // a Counter64 that went round once (rare: the note says so)
    note: "2^64 - 18,446,744,073,709,551,000 + 1,000 = 1,616 octets in 300 s = 43.093333 bit/s (oracle).",
    request: { mode: "rate", width: 64, kind: "octets", first: "18446744073709551000", second: "1000", firstTime: "100", secondTime: "400", speed: "10 Gb/s" },
    expect: { modulus: "18446744073709551616", delta: "1616", wrapped: true, bitsPerSecond: "43.093333", verdict: "wrapped", warnings: [] },
    contains: { verdictText: "it reached 18446744073709551615", notes: ["far more likely a discontinuity"] },
  },
  {
    id: "rate-unreliable-long-interval", // a full cycle was possible
    note: "At 10 Gb/s a Counter32 of octets can count 3.75 x 10^11 in 300 s = 87.311491 cycles: the delta 199,900 cannot be trusted (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "100", second: "200000", firstTime: "0", secondTime: "300", speed: "10 Gb/s" },
    expect: { delta: "199900", bitsPerSecond: "5330.666667", lineRateMaxCount: "375000000000", lineRateCycles: "87.311491", verdict: "unreliable" },
    contains: { verdictText: "short by a multiple of 2^32" },
  },
  {
    id: "rate-example-sysuptime-c64", // the page's rate Example: sysUpTime input
    note: "30000 ticks = 300 s; 1.5 x 10^11 octets x 8 / 300 = 4 x 10^9 bit/s = 40 % of 10 Gb/s (oracle).",
    request: EXAMPLE_RATE_REQUEST as unknown as CounterRequest,
    expect: { timeUnit: "ticks", intervalSeconds: "300", delta: "150000000000", wrapped: false, bitsPerSecond: "4000000000", utilisationPercent: "40", lineRateMaxCount: "375000000000", lineRateCycles: "0", verdict: "ok", warnings: [] },
    contains: { notes: ["hundredths of a second", "497 days"] },
  },
  {
    id: "rate-packets-c64", // packets per second against the smallest-frame line rate
    note: "4,464,285 packets in 1 s; at 10 Gb/s with 84-octet packets the line rate is 14880952.380952 packets/s (oracle).",
    request: { mode: "rate", width: 64, kind: "packets", first: "0", second: "4464285", firstTime: "0", secondTime: "1", speed: "10 Gb/s" },
    expect: { packetsPerSecond: "4464285", bitsPerSecond: null, utilisationPercent: null, packetOctets: 84, lineRateMaxCount: "14880952.380952", verdict: "ok" },
  },
  {
    id: "rate-impossible-wrap-c64", // a lower Counter64 the interface could not have reached
    note: "A wrap would need 2^64 - 10^9 octets in 300 s; 10 Gb/s counts at most 3.75 x 10^11 (oracle).",
    request: { mode: "rate", width: 64, kind: "octets", first: "5000000000", second: "4000000000", firstTime: "0", secondTime: "300", speed: "10 Gb/s" },
    expect: { delta: "18446744072709551616", wrapped: true, verdict: "impossible" },
    contains: { verdictText: "a wrap cannot explain it", notes: ["the only explanation is a wrap"] },
  },
  {
    id: "rate-exceeds-speed-c32", // more than the interface could count
    note: "4 x 10^9 octets in 1 s at 1 Gb/s (at most 1.25 x 10^8): the readings do not belong together (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "0", second: "4000000000", firstTime: "0", secondTime: "1", speed: "1 Gb/s" },
    expect: { delta: "4000000000", wrapped: false, bitsPerSecond: "32000000000", utilisationPercent: "3200", verdict: "impossible" },
    contains: { verdictText: "do not belong together" },
  },
  {
    id: "rate-no-speed", // the checks need a speed
    note: "10 octets in 1 s = 80 bit/s; no speed, no line-rate check.",
    request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "0", secondTime: "1" },
    expect: { bitsPerSecond: "80", speedBitsPerSecond: null, utilisationPercent: null, lineRateMaxCount: null, rfc2863: null, verdict: "ok-unchecked" },
    contains: { notes: ["Enter the interface speed"] },
  },
  {
    id: "rate-wrap-no-speed", // one wrap, unchecked
    note: "2^32 - 4,294,967,000 + 704 = 1,000 octets in 60 s = 133.333333 bit/s (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "4294967000", second: "704", firstTime: "0", secondTime: "60" },
    expect: { delta: "1000", wrapped: true, bitsPerSecond: "133.333333", verdict: "wrapped" },
  },
  {
    id: "rate-decimal-seconds", // poller timestamps with fractions
    note: "62,500 octets in 0.5 s = 1,000,000 bit/s (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "1000", second: "63500", firstTime: "1793616304.25", secondTime: "1793616304.75" },
    expect: { intervalSeconds: "0.5", delta: "62500", bitsPerSecond: "1000000" },
  },
  {
    id: "rate-api-json-body", // the API's text entry
    note: "The same as rate-no-speed, through runApi(): the body is JSON text.",
    api: '{"mode":"rate","width":32,"kind":"octets","first":"10","second":"20","firstTime":0,"secondTime":1}',
    expect: { delta: "10", bitsPerSecond: "80", verdict: "ok-unchecked" },
  },
  // ---- Pasted snmpget output (set "b", 02/11/2026; forms from snmpcmd(1) and the snmpget tutorial) ----------------
  {
    id: "paste-line-named-c64", // the default output: MIB::object.index = Counter64: value
    note: "The rate Example's values pasted as snmpget prints them, times in seconds: 1.5 x 10^11 octets in 300 s = 4 x 10^9 bit/s = 40 % of 10 Gb/s (oracle).",
    request: { mode: "rate", width: 64, kind: "octets", first: "IF-MIB::ifHCInOctets.1 = Counter64: 9876543210123", second: "IF-MIB::ifHCInOctets.1 = Counter64: 10026543210123", firstTime: "0", secondTime: "300", speed: "10 Gb/s" },
    expect: { first: "9876543210123", second: "10026543210123", intervalSeconds: "300", delta: "150000000000", wrapped: false, bitsPerSecond: "4000000000", utilisationPercent: "40", lineRateMaxCount: "375000000000", lineRateCycles: "0", verdict: "ok" },
  },
  {
    id: "paste-line-numeric-oid-c32", // -On: the OID printed numerically (ifInOctets.1 is 1.3.6.1.2.1.2.2.1.10.1, RFC 2863)
    note: "rate-one-wrap-c32's readings pasted in the -On form: 2^32 - 4,294,000,000 + 1,032,704 = 2,000,000 octets in 30 s = 533333.333333 bit/s (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: ".1.3.6.1.2.1.2.2.1.10.1 = Counter32: 4294000000", second: ".1.3.6.1.2.1.2.2.1.10.1 = Counter32: 1032704", firstTime: "0", secondTime: "30", speed: "1 Gb/s" },
    expect: { first: "4294000000", second: "1032704", delta: "2000000", wrapped: true, bitsPerSecond: "533333.333333", utilisationPercent: "0.053333", lineRateMaxCount: "3750000000", lineRateCycles: "0.873115", verdict: "wrapped" },
  },
  {
    id: "paste-value-only-c32", // -Ov: the value without the OID
    note: "Counter32: 10 then Counter32: 20, one second apart: 10 octets = 80 bit/s (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "Counter32: 10", second: "Counter32: 20", firstTime: "0", secondTime: "1" },
    expect: { first: "10", second: "20", delta: "10", bitsPerSecond: "80", verdict: "ok-unchecked" },
  },
  {
    id: "paste-line-full-oid-135-chars", // -Of: the longest documented line for an IF-MIB counter (the MAX_FIELD bound)
    note: "The -Of line of ifHCOutBroadcastPkts at ifIndex 2147483647 holding 2^64-1 is 135 characters; then 999: one wrap, 2^64 - (2^64 - 1) + 999 = 1000 packets in 1 s (oracle).",
    request: { mode: "rate", width: 64, kind: "packets", first: ".iso.org.dod.internet.mgmt.mib-2.ifMIB.ifMIBObjects.ifXTable.ifXEntry.ifHCOutBroadcastPkts.2147483647 = Counter64: 18446744073709551615", second: ".iso.org.dod.internet.mgmt.mib-2.ifMIB.ifMIBObjects.ifXTable.ifXEntry.ifHCOutBroadcastPkts.2147483647 = Counter64: 999", firstTime: "0", secondTime: "1" },
    expect: { first: "18446744073709551615", second: "999", delta: "1000", wrapped: true, packetsPerSecond: "1000", bitsPerSecond: null, verdict: "wrapped" },
    contains: { notes: ["far more likely a discontinuity"] },
  },
  {
    id: "paste-line-type-removed-oq", // -OQ: "Removes the type information"
    note: "IF-MIB::ifInOctets.1 = 1000 then = 63500, two seconds apart: 62,500 octets = 250,000 bit/s (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "IF-MIB::ifInOctets.1 = 1000", second: "IF-MIB::ifInOctets.1 = 63500", firstTime: "0", secondTime: "2" },
    expect: { first: "1000", second: "63500", delta: "62500", bitsPerSecond: "250000" },
  },
  {
    id: "paste-sysuptime-tutorial-lines", // the two sysUpTime lines of Net-SNMP's snmpget tutorial, verbatim
    note: "Timeticks (586731977) and (586903243): 171,266 ticks = 1712.66 s; 171,266 octets x 8 / 1712.66 = 800 bit/s (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "0", second: "171266", firstTime: "SNMPv2-MIB::sysUpTime.0 = Timeticks: (586731977) 67 days, 21:48:39.77", secondTime: "SNMPv2-MIB::sysUpTime.0 = Timeticks: (586903243) 67 days, 22:17:12.43", timeUnit: "ticks" },
    expect: { timeUnit: "ticks", intervalSeconds: "1712.66", delta: "171266", bitsPerSecond: "800" },
    contains: { notes: ["hundredths of a second"] },
  },
  {
    id: "paste-sysuptime-value-only-and-raw-ticks", // -Ov (snmpcmd(1)'s own reading) and -Ot (raw ticks, the same page's example)
    note: "Timeticks: (14096763) 1 day, 15:09:27.63, then SNMPv2-MIB::sysUpTime.0 = 14126763: 30000 ticks = 300 s; the rate Example's counters give 4 x 10^9 bit/s (oracle).",
    request: { mode: "rate", width: 64, kind: "octets", first: "9876543210123", second: "10026543210123", firstTime: "Timeticks: (14096763) 1 day, 15:09:27.63", secondTime: "SNMPv2-MIB::sysUpTime.0 = 14126763", timeUnit: "ticks", speed: "10 Gb/s" },
    expect: { intervalSeconds: "300", delta: "150000000000", bitsPerSecond: "4000000000", utilisationPercent: "40", verdict: "ok" },
  },
  {
    id: "paste-sysuptime-full-oid", // -Of: the tutorial's full-OID sysUpTime line, and one 2000 ticks later
    note: "Timeticks (741998862) and (742000862): 20 s; 50,000,000 octets = 20,000,000 bit/s = 20 % of 100 Mb/s; line rate counts 2.5 x 10^8 = 0.058208 cycles (oracle).",
    request: { mode: "rate", width: 32, kind: "octets", first: "1000000", second: "51000000", firstTime: ".iso.org.dod.internet.mgmt.mib-2.system.sysUpTime.0 = Timeticks: (741998862) 85 days, 21:06:28.62", secondTime: ".iso.org.dod.internet.mgmt.mib-2.system.sysUpTime.0 = Timeticks: (742000862) 85 days, 21:06:48.62", timeUnit: "ticks", speed: "100 Mb/s" },
    expect: { intervalSeconds: "20", delta: "50000000", bitsPerSecond: "20000000", utilisationPercent: "20", lineRateMaxCount: "250000000", lineRateCycles: "0.058208", verdict: "ok" },
  },
  // ---- Refusals -------------------------------------------------------------------------------------------------
  { id: "err-zero-interval", note: "Both readings at the same time: no interval.", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "5", secondTime: "5" }, expectError: /same time, so there is no interval/ },
  { id: "err-negative-interval", note: "The second time is earlier.", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "10", secondTime: "5" }, expectError: /earlier than the first/ },
  { id: "err-ticks-backwards", note: "A lower second sysUpTime: re-initialised, or sysUpTime went round (RFC 3418, RFC 2579).", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "500", secondTime: "400", timeUnit: "ticks" }, expectError: /agent was re-initialised.*497 days/ },
  { id: "err-ticks-range", note: "TimeTicks stop at 4294967295 (RFC 2578 s7.1.8).", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "0", secondTime: "4294967296", timeUnit: "ticks" }, expectError: /not a sysUpTime value \(second reading\)/ },
  { id: "err-value-too-large-c32", note: "2^32 does not fit a Counter32 (RFC 2578 s7.1.6).", request: { mode: "rate", width: 32, kind: "octets", first: "4294967296", second: "20", firstTime: "0", secondTime: "1" }, expectError: /more than a Counter32 can hold \(at most 4294967295\)/ },
  { id: "err-value-digits-only", note: "Grouping separators are refused.", request: { mode: "rate", width: 32, kind: "octets", first: "12,345", second: "20", firstTime: "0", secondTime: "1" }, expectError: /digits only/ },
  { id: "err-value-empty", note: "The second reading is required.", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "", firstTime: "0", secondTime: "1" }, expectError: /Enter the second counter reading/ },
  { id: "err-unsafe-json-number", note: "A JSON number past 2^53 has lost digits.", api: '{"mode":"rate","width":64,"kind":"octets","first":18446744073709551000,"second":"1","firstTime":0,"secondTime":1}', expectError: /as JSON strings/ },
  { id: "err-time-bad", note: "Seconds are a number.", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "noon", secondTime: "1" }, expectError: /not a time in seconds \(first reading\)/ },
  { id: "err-time-unit", note: "Only s and ticks.", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "0", secondTime: "1", timeUnit: "ms" }, expectError: /time unit must be s/ },
  { id: "err-speed-bytes", note: "A capital B is a byte.", request: { mode: "wrap", width: 32, kind: "octets", speed: "125 MB/s" }, expectError: /bytes per second/ },
  { id: "err-speed-bad", note: "Not a speed.", request: { mode: "wrap", width: 32, kind: "octets", speed: "fast" }, expectError: /not a speed this tool reads/ },
  { id: "err-speed-comma", note: "A comma is not the decimal point here.", request: { mode: "wrap", width: 32, kind: "octets", speed: "2,5 Gb/s" }, expectError: /not a speed this tool reads/ },
  { id: "err-speed-zero", note: "Nothing counts at zero.", request: { mode: "wrap", width: 32, kind: "octets", speed: "0 Gb/s" }, expectError: /speed must be above zero/ },
  { id: "err-speed-empty", note: "The speed is required in wrap mode.", request: { mode: "wrap", width: 32, kind: "octets", speed: "" }, expectError: /Enter the interface speed/ },
  { id: "err-util-zero", note: "At 0 % the counter never moves.", request: { mode: "wrap", width: 32, kind: "octets", speed: "1G", utilisation: "0" }, expectError: /above 0 and at most 100 percent/ },
  { id: "err-util-over", note: "More than the line is impossible.", request: { mode: "wrap", width: 32, kind: "octets", speed: "1G", utilisation: "120" }, expectError: /above 0 and at most 100 percent/ },
  { id: "err-poll-zero", note: "No interval.", request: { mode: "wrap", width: 32, kind: "octets", speed: "1G", poll: "0" }, expectError: /poll interval must be above zero/ },
  { id: "err-poll-bad", note: "Not an interval.", request: { mode: "wrap", width: 32, kind: "octets", speed: "1G", poll: "often" }, expectError: /not a poll interval/ },
  { id: "err-size-zero", note: "A packet takes at least one octet.", request: { mode: "wrap", width: 32, kind: "packets", speed: "1G", packetOctets: "0" }, expectError: /not a packet size/ },
  { id: "err-width", note: "Only Counter32 and Counter64 exist (RFC 2578).", request: { mode: "wrap", width: "16", kind: "octets", speed: "1G" }, expectError: /32 \(Counter32\) or 64 \(Counter64\)/ },
  { id: "err-kind", note: "Octets or packets.", request: { mode: "wrap", width: 32, kind: "frames", speed: "1G" }, expectError: /octets or packets/ },
  { id: "err-mode", note: "The mode is required.", request: { width: 32, kind: "octets", speed: "1G" } as unknown as CounterRequest, expectError: /Choose a mode/ },
  { id: "err-json", note: "The API body must be JSON.", api: "{", expectError: /not valid JSON/ },
  { id: "err-paste-width-c64-in-c32", note: "A Counter64 line with the width set to 32: refused, never switched.", request: { mode: "rate", width: 32, kind: "octets", first: "IF-MIB::ifHCInOctets.1 = Counter64: 1234", second: "20", firstTime: "0", secondTime: "1" }, expectError: /first reading says Counter64, but the counter width is set to 32 \(Counter32\)/ },
  { id: "err-paste-width-c32-in-c64", note: "A Counter32 value with the width set to 64: refused, never switched.", request: { mode: "rate", width: 64, kind: "octets", first: "10", second: "Counter32: 20", firstTime: "0", secondTime: "1" }, expectError: /second reading says Counter32, but the counter width is set to 64 \(Counter64\)/ },
  { id: "err-paste-gauge", note: "ifSpeed is a Gauge32, not a counter.", request: { mode: "rate", width: 32, kind: "octets", first: "IF-MIB::ifSpeed.1 = Gauge32: 1000000000", second: "20", firstTime: "0", secondTime: "1" }, expectError: /first reading has the type Gauge32, which is not a counter/ },
  { id: "err-paste-integer", note: "INTEGER, as snmpcmd(1)'s -Oe example prints it, is not a counter.", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "IP-MIB::ipForwarding.0 = INTEGER: 1", firstTime: "0", secondTime: "1" }, expectError: /second reading has the type INTEGER, which is not a counter/ },
  { id: "err-paste-string", note: "The snmpget tutorial's sysORDescr.1 line: a STRING, not a counter.", request: { mode: "rate", width: 32, kind: "octets", first: "SNMPv2-MIB::sysORDescr.1 = STRING: The Mib module for SNMPv2 entities", second: "20", firstTime: "0", secondTime: "1" }, expectError: /first reading has the type STRING, which is not a counter/ },
  { id: "err-paste-timeticks-as-counter", note: "A sysUpTime line in a counter field: Timeticks is not a counter.", request: { mode: "rate", width: 32, kind: "octets", first: "SNMPv2-MIB::sysUpTime.0 = Timeticks: (586731977) 67 days, 21:48:39.77", second: "20", firstTime: "0", secondTime: "1" }, expectError: /first reading has the type Timeticks, which is not a counter/ },
  { id: "err-paste-ticks-in-seconds", note: "A Timeticks line with the times set to seconds: refused, the unit never switched.", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "SNMPv2-MIB::sysUpTime.0 = Timeticks: (586731977) 67 days, 21:48:39.77", secondTime: "1" }, expectError: /time of the first reading is a sysUpTime line .* set to seconds/ },
  { id: "err-paste-counter-as-ticks", note: "A counter line in a sysUpTime field.", request: { mode: "rate", width: 32, kind: "octets", first: "10", second: "20", firstTime: "IF-MIB::ifInOctets.1 = Counter32: 5", secondTime: "100", timeUnit: "ticks" }, expectError: /not a sysUpTime value \(first reading\)/ },
  { id: "err-paste-no-such-instance", note: "The SNMPv2c answer to a missing index (the snmpget tutorial) carries no value.", request: { mode: "rate", width: 64, kind: "octets", first: "IF-MIB::ifHCInOctets = No Such Instance currently exists", second: "20", firstTime: "0", secondTime: "1" }, expectError: /not a counter reading \(first\).*digits only/ },
  { id: "err-paste-quick-print", note: "-Oq (no equal sign, no type) is not read.", request: { mode: "rate", width: 64, kind: "octets", first: "IF-MIB::ifHCInOctets.1 1234", second: "2000", firstTime: "0", secondTime: "1" }, expectError: /not a counter reading \(first\)/ },
  { id: "err-paste-range-c32", note: "2^32 in a Counter32 line: more than it can hold; the message names the value, not the line.", request: { mode: "rate", width: 32, kind: "octets", first: "Counter32: 4294967296", second: "20", firstTime: "0", secondTime: "1" }, expectError: /^"4294967296" is more than a Counter32 can hold/ },
  { id: "err-too-long", note: "145 characters, one past MAX_FIELD (144), refused before any pattern runs.", request: { mode: "rate", width: 64, kind: "octets", first: ".iso.org.dod.internet.mgmt.mib-2.ifMIB.ifMIBObjects.ifXTable.ifXEntry.ifHCOutBroadcastPkts.21474836479999999999 = Counter64: 18446744073709551615", second: "20", firstTime: "0", secondTime: "1" }, expectError: /longer than this tool reads \(144 characters\)/ },
]; // the written-out vectors

/** Every vector, in order. */
export const COUNTER_VECTORS: readonly CounterVector[] = Object.freeze([...PRESET_VECTORS, ...OTHER_VECTORS]); // 28 presets, then the rest

/**
 * Whether `actual` holds every field of `expected` with the same value (nested objects compared as subsets, arrays and
 * primitives exactly as JSON).
 * @param actual the reading's value
 * @param expected the vector's value
 * @returns true when it matches
 */
function matches(actual: unknown, expected: unknown): boolean {
  if (expected !== null && typeof expected === "object" && !Array.isArray(expected)) { // a subset object
    if (actual === null || typeof actual !== "object") return false; // nothing to compare with
    return Object.entries(expected as Record<string, unknown>).every(([k, v]) => matches((actual as Record<string, unknown>)[k], v)); // each field
  } // object
  return JSON.stringify(actual) === JSON.stringify(expected); // exact, as JSON
} // matches

/** The report verifyVectors returns. */
export interface VerifyReport {
  /** The set id. */
  setId: string;
  /** Vectors run. */
  total: number;
  /** Vectors that passed. */
  passed: number;
  /** One line per failure (empty when all pass). */
  failures: string[];
}

/**
 * Run every vector.
 * @returns the report (failures empty when all pass)
 */
export function verifyVectors(): VerifyReport {
  const failures: string[] = []; // collected
  for (const v of COUNTER_VECTORS) { // each vector
    let r: CounterResult | null = null; // the reading
    try {
      r = v.api !== undefined ? runApi(v.api) : run(v.request as CounterRequest); // the API text or the request
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e); // the refusal
      if (!v.expectError) failures.push(`${v.id}: unexpected error: ${msg}`); // should have computed
      else if (!v.expectError.test(msg)) failures.push(`${v.id}: error mismatch: ${msg}`); // the wrong refusal
      continue; // next vector
    } // ran
    if (v.expectError) { failures.push(`${v.id}: expected an error, got a reading`); continue; } // should have refused
    if (v.expect && !matches(r, v.expect)) failures.push(`${v.id}: fields differ: ${JSON.stringify(r).slice(0, 400)}`); // a number or a flag moved
    const c = v.contains ?? {}; // the texts expected
    const list = (xs: unknown): string[] => (Array.isArray(xs) ? (xs as string[]) : []); // a list of sentences
    for (const s of c.warnings ?? []) if (!list((r as { warnings?: unknown }).warnings).some((w) => w.includes(s))) failures.push(`${v.id}: no warning contains "${s}"`); // warnings
    for (const s of c.notes ?? []) if (!list((r as { notes?: unknown }).notes).some((n) => n.includes(s))) failures.push(`${v.id}: no note contains "${s}"`); // notes
    if (c.verdictText && !String((r as { verdictText?: unknown }).verdictText ?? "").includes(c.verdictText)) failures.push(`${v.id}: verdict text lacks "${c.verdictText}"`); // rate verdict
    if (c.pollText && !String((r as { poll?: { text?: unknown } | null }).poll?.text ?? "").includes(c.pollText)) failures.push(`${v.id}: poll verdict text lacks "${c.pollText}"`); // wrap verdict
  } // vectors
  return { setId: GOLDEN_VECTOR_SET_ID, total: COUNTER_VECTORS.length, passed: COUNTER_VECTORS.length - new Set(failures.map((f) => f.split(":")[0])).size, failures }; // the report
} // verifyVectors
