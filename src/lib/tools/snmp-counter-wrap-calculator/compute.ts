// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/snmp-counter-wrap-calculator/compute.ts
// ----------------------------------------------------------------------------
// SNMP INTERFACE COUNTER WRAP AND RATE CALCULATOR - the pure, deterministic
// engine (02/11/2026, written for chapter 4.5 of the open course "LAN Switch
// Operations and Maintenance" and the Learn article snmp-on-network-devices).
//
// TWO QUESTIONS, TWO MODES.
//   wrap  How long does a Counter32 or Counter64 of octets or packets take to
//         go round at a given interface speed and utilisation, what is the
//         longest poll interval that cannot miss a wrap, and does RFC 2863
//         require 64-bit counters at that speed?
//   rate  Given two readings of one counter (value and time, the time in
//         seconds or as sysUpTime in hundredths of a second), what is the
//         delta (allowing for one wrap of the declared width), the rate in
//         bit/s or packets/s, and can that rate be trusted?
//
// THE RULES, each from a document read on 2026-11-02 (sources in index.ts):
//   - RFC 2578 s7.1.6 and s7.1.10: a Counter32 "monotonically increases until
//     it reaches a maximum value of 2^32-1 (4294967295 decimal), when it wraps
//     around and starts increasing again from zero"; a Counter64 the same at
//     2^64-1. "Counters have no defined "initial" value, and thus, a single
//     value of a Counter has (in general) no information content."
//   - RFC 2578 s7.1.8: TimeTicks count hundredths of a second "modulo 2^32".
//   - RFC 3418: sysUpTime is "The time (in hundredths of a second) since the
//     network management portion of the system was last re-initialized."
//   - RFC 2579 (TimeStamp): sysUpTime goes round after "approximately 497
//     days without a re-initialization".
//   - RFC 2863 s3.1.6: 32-bit counters at 20,000,000 bit/s or less; 64-bit
//     octet counters above 20,000,000 bit/s; 64-bit packet counters AND
//     64-bit octet counters at 650,000,000 bit/s or faster (quoted exactly in
//     the rfc.band.* sentences below).
//   - RFC 2863, the counter objects and ifCounterDiscontinuityTime:
//     discontinuities occur "at re-initialization of the management system,
//     and at other times as indicated by the value of
//     ifCounterDiscontinuityTime".
//   - RFC 2544 Appendix B: on Ethernet a frame of N octets takes a 64-bit
//     preamble, 8 x N bits and a 96-bit gap, so the smallest (64-octet) frame
//     takes 84 octets of line time: the default packet size here.
//
// PASTED SNMPGET LINES (added 02/11/2026). The two counter readings and, in
// ticks mode, the two times also take the output line of Net-SNMP's snmpget as
// printed, each form from Net-SNMP's own documents read on 2026-11-02:
//   - "<OID> = <Type>: <value>", the default (the snmpget tutorial:
//     "SNMPv2-MIB::sysUpTime.0 = Timeticks: (586731977) 67 days,
//     21:48:39.77"), with the OID named, numeric (-On), short (-Os) or full
//     (-Of), as snmpcmd(1)'s OUTPUT OPTIONS show;
//   - "<Type>: <value>", the value only (-Ov);
//   - "<OID> = <value>", the type removed (-OQ), and for TimeTicks the raw
//     number (-Ot: "SNMPv2-MIB::sysUpTime.0 = 14096763");
//   - the type labels as Net-SNMP 5.9.4's snmplib/mib.c prints them:
//     "Counter32: ", "Counter64: ", "Timeticks: (<ticks>) " followed by the
//     day and clock text, and "Gauge32: ", "INTEGER: ", "STRING: " and the
//     rest for the types that are not counters.
// A line that names Counter32 or Counter64 must agree with the declared width
// (the tool never switches it); any other Net-SNMP type is refused as not a
// counter; from a Timeticks line the number in brackets is taken. The quick
// form (-Oq: no "=" and no type) is not read.
//
// THE TOOL'S OWN CHOICES, stated as such in the result:
//   - the safety margin: poll at most every HALF the line-rate wrap time, so
//     that one lost poll (a doubled gap between the readings that remain)
//     still spans less than one wrap;
//   - "line rate" for octets is the interface speed divided by 8 (an
//     interface cannot count more octets per second than its bits carry), and
//     for packets the speed divided by 8 x the packet size given.
//
// EXACTNESS. 2^64 does not fit a double's integer range (2^53), so every
// quantity is an exact rational of two BigInts: speeds, percentages, times and
// counter values are parsed from their decimal text into BigInt numerator and
// power-of-ten denominator, and nothing is rounded until a result is printed.
// Printed decimals are rounded half up to six places, trailing zeros removed.
// Units: seconds, bit/s, octets/s, packets/s, percent.
//
// PAGE LANGUAGE. Every sentence the engine writes (verdicts, warnings, notes,
// input errors) is an EngineText (../engine-text.ts): a stable id, the English,
// and its values. runLocalisable() returns the reading with them in place for
// the page (pack keys tools.snmp-counter-wrap-calculator.engine.<id>); run()
// and runApi() return plainText() of the same reading for the API and the
// golden vectors. Computed numbers never sit inside a sentence: the page prints
// them from the reading's own fields in its own number format.
//
// Pure: no clock, no network, no randomness. Parsing uses anchored patterns
// with bounded repetition only (linear, ReDoS-safe); every field is at most
// MAX_FIELD characters.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids, and the API's English projection

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

/** A counter's width in bits: Counter32 or Counter64 (RFC 2578 s7.1.6, s7.1.10). */
export type CounterWidth = 32 | 64; // the two SMIv2 counter types

/** What the counter counts: octets (ifInOctets, ifHCInOctets ...) or packets (ifInUcastPkts, ifHCInUcastPkts ...). */
export type CounterKind = "octets" | "packets"; // the two families of interface counters

/** How the times of the two readings are written. */
export type TimeUnit = "s" | "ticks"; // seconds, or sysUpTime hundredths of a second

/** The wrap-mode request: the counter, the interface, and optionally the poll interval. */
export interface WrapRequest {
  /** Selects this mode. */
  mode: "wrap";
  /** 32 or 64 (a number or its decimal text). */
  width: CounterWidth | string;
  /** "octets" or "packets". */
  kind: CounterKind | string;
  /** The interface speed with a unit: "10 Gb/s", "100M", "2.5 Gbit/s", or bare bit/s. */
  speed: string;
  /** Utilisation in percent, above 0 and at most 100; "100" when absent. */
  utilisation?: string;
  /** Packets only: octets of line time per packet, 1 to 65535; "84" when absent. */
  packetOctets?: string;
  /** The poll interval: seconds, or a number and ms, s, min or h; no verdict when absent or blank. */
  poll?: string;
}

/** The rate-mode request: two readings of one counter. */
export interface RateRequest {
  /** Selects this mode. */
  mode: "rate";
  /** 32 or 64. */
  width: CounterWidth | string;
  /** "octets" or "packets". */
  kind: CounterKind | string;
  /** The first counter value, decimal digits (a JSON string; a JSON number only while it is a safe integer). */
  first: string | number;
  /** The second counter value, as the first. */
  second: string | number;
  /** The time of the first reading: seconds (decimal) or sysUpTime hundredths (whole number). */
  firstTime: string | number;
  /** The time of the second reading, in the same unit. */
  secondTime: string | number;
  /** "s" (the default) or "ticks" (sysUpTime). */
  timeUnit?: TimeUnit | string;
  /** Optional: the interface speed, which enables the line-rate checks. */
  speed?: string;
  /** Packets only: octets of line time per packet for the line-rate checks; "84" when absent. */
  packetOctets?: string;
}

/** Either request. */
export type CounterRequest = WrapRequest | RateRequest; // the API body names its mode

/** RFC 2863 s3.1.6's three speed bands. */
export type Rfc2863Band = "up-to-20m" | "20m-to-650m" | "650m-and-above"; // at or below 20,000,000; between; at or above 650,000,000

/** What RFC 2863 requires at an interface speed. S: string for the API, EngineText for the page. */
export interface Rfc2863Reading<S = string> {
  /** The band the speed falls in. */
  band: Rfc2863Band;
  /** Whether 64-bit octet counters MUST be supported (above 20,000,000 bit/s). */
  octets64Required: boolean;
  /** Whether 64-bit packet counters MUST be supported (650,000,000 bit/s or faster). */
  packets64Required: boolean;
  /** Whether the counter asked about (its kind) must be 64-bit at this speed. */
  thisCounterRequires64: boolean;
  /** The band's sentence of RFC 2863 s3.1.6, quoted exactly. */
  quote: S;
}

/** A poll interval's verdict against the wrap times. */
export type PollVerdict = "safe" | "no-margin" | "burst" | "wraps"; // in order of growing risk

/** The wrap-mode reading. Every number is decimal text (exact, or rounded half up to six places). */
export interface WrapResult<S = string> {
  /** The mode. */
  mode: "wrap";
  /** The counter width. */
  width: CounterWidth;
  /** What it counts. */
  kind: CounterKind;
  /** 2^width: the count after which the value is back where it started. */
  modulus: string;
  /** 2^width - 1: the largest value the counter shows. */
  maxValue: string;
  /** The interface speed in bit/s. */
  speedBitsPerSecond: string;
  /** The utilisation in percent. */
  utilisationPercent: string;
  /** Packets: octets of line time per packet; null for octets. */
  packetOctets: number | null;
  /** Octets or packets counted per second at the stated utilisation. */
  countPerSecond: string;
  /** Octets or packets counted per second at line rate (100 %). */
  lineRateCountPerSecond: string;
  /** Seconds to count 2^width at the stated utilisation: the time between wraps. */
  wrapSeconds: string;
  /** Seconds to count 2^width at line rate: the shortest possible time between wraps. */
  lineRateWrapSeconds: string;
  /** The other width at the stated utilisation, for comparison. */
  otherWidth: { width: CounterWidth; wrapSeconds: string };
  /** A poll interval strictly below this many seconds can never miss a wrap (it equals lineRateWrapSeconds). */
  neverMissBelowSeconds: string;
  /** The tool's margin: half the line-rate wrap time. */
  marginPollSeconds: string;
  /** The poll interval's reading, when one was given. */
  poll: null | {
    /** The interval in seconds. */
    seconds: string;
    /** Octets or packets counted between two polls at the stated utilisation. */
    countPerPoll: string;
    /** That count divided by 2^width: 1 or more means at least one full cycle between polls. */
    cyclesPerPoll: string;
    /** The verdict. */
    verdict: PollVerdict;
    /** The verdict in a sentence. */
    text: S;
  };
  /** What RFC 2863 requires at this speed. */
  rfc2863: Rfc2863Reading<S>;
  /** Warnings (a 32-bit counter where the RFC requires 64). */
  warnings: S[];
  /** Notes (why one value means nothing, the margin, what line rate means here). */
  notes: S[];
}

/** The rate verdict: how far the delta can be trusted. */
export type RateVerdict = "ok" | "ok-unchecked" | "wrapped" | "unreliable" | "impossible"; // in order of growing doubt

/** The rate-mode reading. */
export interface RateResult<S = string> {
  /** The mode. */
  mode: "rate";
  /** The counter width. */
  width: CounterWidth;
  /** What it counts. */
  kind: CounterKind;
  /** 2^width. */
  modulus: string;
  /** 2^width - 1. */
  maxValue: string;
  /** The first value, as read (leading zeros removed). */
  first: string;
  /** The second value, as read. */
  second: string;
  /** The time unit of the readings. */
  timeUnit: TimeUnit;
  /** The interval between the readings, in seconds. */
  intervalSeconds: string;
  /** The counted increase, allowing for one wrap. */
  delta: string;
  /** Whether the second value was lower, so one wrap was assumed. */
  wrapped: boolean;
  /** Octets: the rate in bit/s (delta x 8 / interval); null for packets. */
  bitsPerSecond: string | null;
  /** Packets: the rate in packets/s (delta / interval); null for octets. */
  packetsPerSecond: string | null;
  /** The interface speed in bit/s, when given. */
  speedBitsPerSecond: string | null;
  /** Packets with a speed: octets of line time per packet; null otherwise. */
  packetOctets: number | null;
  /** Octets with a speed: the rate as a percentage of the speed; null otherwise. */
  utilisationPercent: string | null;
  /** With a speed: the most the counter can count in this interval at line rate; null otherwise. */
  lineRateMaxCount: string | null;
  /** With a speed: that maximum divided by 2^width; 1 or more means a full cycle was possible. */
  lineRateCycles: string | null;
  /** The verdict. */
  verdict: RateVerdict;
  /** The verdict in a sentence. */
  verdictText: S;
  /** What RFC 2863 requires at the speed, when one was given. */
  rfc2863: Rfc2863Reading<S> | null;
  /** Warnings (a 32-bit counter where the RFC requires 64). */
  warnings: S[];
  /** Notes (the wrap assumed, discontinuities, sysUpTime, why one value means nothing). */
  notes: S[];
}

/** Either reading. */
export type CounterResult<S = string> = WrapResult<S> | RateResult<S>; // by mode

/** An input the engine refuses: its message is the English, its sentence travels with it for the page. */
export class SnmpCounterInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "SnmpCounterInputError"; // a readable name in stack traces
  } // constructor
} // SnmpCounterInputError

/**
 * Throw-ready input error carrying its sentence.
 * @param m the sentence
 * @returns the error
 */
function inputError(m: EngineText): SnmpCounterInputError {
  return withEngineText(new SnmpCounterInputError(m), m); // the class, the English message, and the sentence
} // inputError

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/**
 * The longest text any field may hold, checked before any pattern runs. 144 since 02/11/2026 (it was 64): the longest
 * line snmpget prints in a documented format for an IF-MIB counter is the full-OID form (-Of) of ifHCOutBroadcastPkts
 * or ifHCOutMulticastPkts at ifIndex 2147483647 (RFC 2863's largest InterfaceIndex) holding 2^64-1, 135 characters:
 * ".iso.org.dod.internet.mgmt.mib-2.ifMIB.ifMIBObjects.ifXTable.ifXEntry.ifHCOutBroadcastPkts.2147483647 = Counter64:
 * 18446744073709551615". The full-OID sysUpTime line at 2^32-1 ticks takes 98. The other nine characters cover the
 * up to three spaces or tabs the parser tolerates on each side of "=" and after the type's colon.
 */
export const MAX_FIELD = 144; // characters

/** The default packet size in octets of line time: the smallest Ethernet frame (RFC 2544 Appendix B: 8 + 64 + 12). */
export const DEFAULT_PACKET_OCTETS = 84; // 64-octet frame, 8-octet preamble, 12-octet gap

/** RFC 2863 s3.1.6: the upper bound of the 32-bit band, in bit/s ("20,000,000 (20 million) bits per second or less"). */
export const RFC2863_OCTETS_THRESHOLD = 20_000_000n; // above this, 64-bit octet counters MUST be supported

/** RFC 2863 s3.1.6: the start of the all-64-bit band, in bit/s ("650,000,000 bits/second or faster"). */
export const RFC2863_PACKETS_THRESHOLD = 650_000_000n; // at or above this, 64-bit packet counters MUST be supported too

/** The largest TimeTicks value (RFC 2578 s7.1.8: modulo 2^32). */
export const MAX_TICKS = 4294967295n; // 2^32 - 1 hundredths of a second

/** The preset interface speeds the page offers, in bit/s, with their labels. */
export const SPEED_PRESETS: readonly { label: string; bps: bigint }[] = Object.freeze([
  { label: "100 Mb/s", bps: 100_000_000n }, // Fast Ethernet
  { label: "1 Gb/s", bps: 1_000_000_000n }, // Gigabit Ethernet
  { label: "10 Gb/s", bps: 10_000_000_000n }, // 10 Gigabit Ethernet
  { label: "25 Gb/s", bps: 25_000_000_000n }, // 25 Gigabit Ethernet
  { label: "40 Gb/s", bps: 40_000_000_000n }, // 40 Gigabit Ethernet
  { label: "100 Gb/s", bps: 100_000_000_000n }, // 100 Gigabit Ethernet
  { label: "400 Gb/s", bps: 400_000_000_000n }, // 400 Gigabit Ethernet
]); // the presets

// ----------------------------------------------------------------------------
// Exact rational arithmetic on BigInt
// ----------------------------------------------------------------------------

/** An exact rational number: numerator over a positive denominator, always reduced. */
interface Q {
  /** The numerator (any sign). */
  n: bigint;
  /** The denominator (positive). */
  d: bigint;
}

/**
 * Greatest common divisor of two non-negative BigInts (Euclid).
 * @param a the first
 * @param b the second
 * @returns gcd(a, b)
 */
function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a; // the first, made non-negative
  let y = b < 0n ? -b : b; // the second, made non-negative
  while (y !== 0n) [x, y] = [y, x % y]; // Euclid's step until the remainder is zero
  return x; // the divisor
} // gcd

/**
 * Build a reduced rational.
 * @param n the numerator
 * @param d the denominator (non-zero)
 * @returns n/d reduced, with a positive denominator
 */
function q(n: bigint, d: bigint = 1n): Q {
  if (d < 0n) { n = -n; d = -d; } // the sign lives in the numerator
  const g = gcd(n, d) || 1n; // the common factor (1 for a zero numerator)
  return { n: n / g, d: d / g }; // reduced
} // q

/** a + b. */
const add = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d); // common denominator
/** a - b. */
const sub = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d); // common denominator
/** a x b. */
const mul = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d); // straight across
/** a / b (b non-zero). */
const div = (a: Q, b: Q): Q => q(a.n * b.d, a.d * b.n); // by the reciprocal
/** Compare: negative when a < b, zero when equal, positive when a > b. */
const cmp = (a: Q, b: Q): number => { const x = a.n * b.d - b.n * a.d; return x < 0n ? -1 : x > 0n ? 1 : 0; }; // cross-multiplied (denominators positive)

/** Ten to the power p, as a BigInt. */
const pow10 = (p: number): bigint => 10n ** BigInt(p); // exact

/**
 * Print a rational as decimal text, rounded half up (away from zero) to `places` decimals, trailing zeros removed.
 * @param x the rational
 * @param places how many decimals to keep (six throughout this engine)
 * @returns the text, with "." as the decimal point and no grouping
 */
export function decimalText(x: Q, places = 6): string {
  const neg = x.n < 0n; // the sign
  const n = neg ? -x.n : x.n; // the magnitude's numerator
  const scale = pow10(places); // 10^places
  const scaled = (n * scale * 2n + x.d) / (2n * x.d); // round(n / d x 10^places), half up
  const whole = scaled / scale; // the integer part
  const frac = (scaled % scale).toString().padStart(places, "0").replace(/0+$/, ""); // the fraction, trailing zeros removed
  const body = frac ? `${whole}.${frac}` : `${whole}`; // with or without a point
  return neg && scaled !== 0n ? `-${body}` : body; // the sign, unless it rounded to zero
} // decimalText

// ----------------------------------------------------------------------------
// Parsing (anchored, bounded patterns; every refusal is a sentence)
// ----------------------------------------------------------------------------

/**
 * Text from an API field that may arrive as a number, bounded in length.
 * @param v the raw value
 * @param asCounter whether it is a counter value (a JSON number past 2^53 has already lost digits)
 * @returns the trimmed text
 */
function fieldText(v: unknown, asCounter = false): string {
  if (typeof v === "number") { // a JSON number
    if (asCounter && !Number.isSafeInteger(v)) throw inputError(say("err.unsafeNumber", "Send counter values above 9007199254740991 as JSON strings: a JSON number that large has already lost digits.")); // precision gone
    return String(v); // its decimal text
  } // number
  const s = typeof v === "string" ? v.trim() : ""; // a string, trimmed; anything else counts as blank
  if (s.length > MAX_FIELD) throw inputError(say("err.tooLong", `A field is longer than this tool reads (${MAX_FIELD} characters).`, { max: String(MAX_FIELD) })); // bounded before any pattern runs
  return s; // the text
} // fieldText

/**
 * The counter width.
 * @param v 32, 64, or their text
 * @returns the width
 */
function parseWidth(v: unknown): CounterWidth {
  const s = String(v ?? "").trim(); // as text
  if (s === "32") return 32; // Counter32
  if (s === "64") return 64; // Counter64
  throw inputError(say("err.width", "The counter width must be 32 (Counter32) or 64 (Counter64).")); // anything else
} // parseWidth

/**
 * What the counter counts.
 * @param v "octets" or "packets"
 * @returns the kind
 */
function parseKind(v: unknown): CounterKind {
  if (v === "octets" || v === "packets") return v; // one of the two
  throw inputError(say("err.kind", "Say what the counter counts: octets or packets.")); // anything else
} // parseKind

/** Decimal text: up to 15 integer digits, optionally a point and up to 9 decimals. Anchored, bounded: linear. */
const DECIMAL_RE = /^(\d{1,15})(?:\.(\d{1,9}))?$/; // the house decimal form, "." as the point

/**
 * Decimal text as an exact rational.
 * @param s the text (already trimmed)
 * @returns the rational, or null when it is not decimal text
 */
function decimal(s: string): Q | null {
  const m = DECIMAL_RE.exec(s); // integer and fraction
  if (!m) return null; // not a decimal
  const frac = m[2] ?? ""; // the decimals, possibly none
  return q(BigInt(m[1] + frac), pow10(frac.length)); // digits over a power of ten
} // decimal

/** A speed: a decimal, optional spaces, an optional SI prefix letter and an optional bit unit. Anchored, bounded. */
const SPEED_RE = /^(\d{1,15}(?:\.\d{1,9})?)\s{0,3}([kKmMgGtT])?\s{0,3}([A-Za-z/]{0,7})$/; // number, prefix, unit

/** The bit units a speed may end with (a lower-case b is a bit). */
const BIT_UNITS = new Set(["", "b", "bit", "bits", "b/s", "bit/s", "bits/s", "bps"]); // all mean bits per second

/** Byte units: refused, because an interface speed is written in bits. */
const BYTE_UNITS = new Set(["B", "B/s", "Bps", "byte", "bytes", "byte/s", "bytes/s"]); // a capital B is a byte

/** SI prefix multipliers (powers of 1000, as link speeds are written). */
const PREFIX: Readonly<Record<string, bigint>> = { k: 1_000n, m: 1_000_000n, g: 1_000_000_000n, t: 1_000_000_000_000n }; // kilo to tera

/**
 * An interface speed in bit/s.
 * @param raw the text, e.g. "10 Gb/s", "100M", "2.5 Gbit/s", "1000000000"
 * @returns the speed as an exact rational of bit/s
 */
export function parseSpeed(raw: unknown): Q {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") throw inputError(say("err.speedEmpty", "Enter the interface speed, for example 10 Gb/s.")); // nothing typed
  const m = SPEED_RE.exec(s); // number, prefix, unit
  if (m && BYTE_UNITS.has(m[3])) throw inputError(say("err.speedBytes", `"${s}" reads as bytes per second (a capital B). Enter the interface speed in bits per second, for example 10 Gb/s.`, { value: s })); // bytes, not bits
  if (!m || !BIT_UNITS.has(m[3])) throw inputError(say("err.speedBad", `"${s}" is not a speed this tool reads. Write a number with a point for decimals and a unit, for example 100 Mb/s, 2.5 Gb/s or 10G.`, { value: s })); // not a speed
  const value = decimal(m[1]) as Q; // the number (the pattern guarantees decimal text)
  const bps = mul(value, q(m[2] ? PREFIX[m[2].toLowerCase()] : 1n)); // times the prefix
  if (bps.n <= 0n) throw inputError(say("err.speedZero", "The interface speed must be above zero.")); // nothing to count
  return bps; // bit/s
} // parseSpeed

/** A percentage: up to three integer digits, up to six decimals, an optional percent sign. Anchored, bounded. */
const PERCENT_RE = /^(\d{1,3}(?:\.\d{1,6})?)\s{0,3}%?$/; // e.g. 40, 37.5, 100 %

/**
 * The utilisation in percent.
 * @param raw the text; blank means 100
 * @returns the percentage as a rational, above 0 and at most 100
 */
function parseUtilisation(raw: unknown): Q {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") return q(100n); // line rate by default
  const m = PERCENT_RE.exec(s); // the number
  if (!m) throw inputError(say("err.utilBad", `"${s}" is not a percentage. Enter the utilisation as a number above 0 and at most 100, with a point for decimals, for example 40.`, { value: s })); // not a number
  const u = decimal(m[1]) as Q; // exact
  if (u.n <= 0n || cmp(u, q(100n)) > 0) throw inputError(say("err.utilRange", `Utilisation must be above 0 and at most 100 percent; "${s}" is outside that range.`, { value: s })); // 0 never wraps; over 100 is impossible
  return u; // percent
} // parseUtilisation

/**
 * The packet size in octets of line time.
 * @param raw the text; blank means 84
 * @returns a whole number from 1 to 65535
 */
function parsePacketOctets(raw: unknown): number {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") return DEFAULT_PACKET_OCTETS; // the smallest Ethernet frame on the wire
  if (!/^\d{1,5}$/.test(s) || Number(s) < 1 || Number(s) > 65535) throw inputError(say("err.sizeBad", `"${s}" is not a packet size. Enter whole octets from 1 to 65535, for example 84.`, { value: s })); // out of range or not a whole number
  return Number(s); // octets
} // parsePacketOctets

/** A poll interval: a decimal and an optional unit. Anchored, bounded. */
const POLL_RE = /^(\d{1,12}(?:\.\d{1,6})?)\s{0,3}(ms|s|sec|secs|seconds?|min|mins|minutes?|h|hr|hrs|hours?)?$/i; // e.g. 300, 300 s, 5 min, 0.5 h

/**
 * The poll interval in seconds.
 * @param raw the text; blank means no interval
 * @returns the interval, or null when blank
 */
function parsePoll(raw: unknown): Q | null {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") return null; // no verdict asked for
  const m = POLL_RE.exec(s); // number and unit
  if (!m) throw inputError(say("err.pollBad", `"${s}" is not a poll interval. Write a number of seconds, or a number and a unit (ms, s, min or h), with a point for decimals, for example 300 or 5 min.`, { value: s })); // not an interval
  const unit = (m[2] ?? "s").toLowerCase(); // seconds by default
  const factor = unit === "ms" ? q(1n, 1000n) : unit.startsWith("m") ? q(60n) : unit.startsWith("h") ? q(3600n) : q(1n); // to seconds
  const p = mul(decimal(m[1]) as Q, factor); // seconds
  if (p.n <= 0n) throw inputError(say("err.pollZero", "The poll interval must be above zero.")); // no interval
  return p; // seconds
} // parsePoll

/**
 * An snmpget output line: an OID with no space and no "=" (named, numeric, short or full), "=", then the value, as
 * snmpcmd(1)'s OUTPUT OPTIONS show it. The OID cannot hold "=" or a space, so the split is fixed; the value starts with
 * a non-space, so the spaces before it are never in doubt. Anchored, bounded: linear. Applied to text already at most
 * MAX_FIELD characters.
 */
const SNMP_LINE_RE = /^([^\s=]{1,120})[ \t]{0,3}=[ \t]{0,3}(\S.{0,63})$/; // OID, "=", value

/**
 * A typed value as Net-SNMP prints it: a type label, a colon, then the value ("Counter64: 1234", "Timeticks:
 * (586731977) 67 days, 21:48:39.77"). The label holds no space and the value starts with a non-space, so the match is
 * fixed. Anchored, bounded: linear.
 */
const SNMP_TYPED_RE = /^([A-Za-z][A-Za-z0-9-]{0,23}):[ \t]{0,3}(\S.{0,62})?$/; // label, colon, value

/** The two counter labels, exactly as Net-SNMP 5.9.4's snmplib/mib.c prints them ("Counter32: ", "Counter64: "). */
const COUNTER_LABEL_RE = /^Counter(32|64)$/; // the width the line names

/** The labels Net-SNMP 5.9.4's snmplib/mib.c prints for the types that are not counters: refused by name. */
const OTHER_SNMP_LABELS: ReadonlySet<string> = new Set(["Gauge32", "INTEGER", "STRING", "Hex-STRING", "OID", "Timeticks", "IpAddress", "BITS", "NsapAddress", "Opaque", "UInt64", "Int64"]); // gauges, integers, strings and the rest

/** The value of a Timeticks line: the ticks in brackets, then optionally the day and clock text ("67 days, 21:48:39.77"). Anchored, bounded. */
const TIMETICKS_VALUE_RE = /^\((\d{1,10})\)(?:[ \t][0-9A-Za-z ,:.]{0,40})?$/; // ticks, then the human-readable form

/**
 * A field split the way snmpget prints a value: the OID and "=" taken off when present, then the type label when
 * present. A bare value comes back as it is, with no label.
 * @param s the field's text (trimmed, at most MAX_FIELD characters)
 * @returns the type label (null when none) and the value text after it
 */
function snmpValue(s: string): { label: string | null; value: string } {
  const line = SNMP_LINE_RE.exec(s); // "<OID> = <value>"
  const v = line ? line[2] : s; // the value part, or the whole field
  const typed = SNMP_TYPED_RE.exec(v); // "<Type>: <value>"
  return typed ? { label: typed[1], value: typed[2] ?? "" } : { label: null, value: v }; // labelled or bare
} // snmpValue

/**
 * A counter value: digits, or an snmpget line or value that carries them.
 * @param raw the text or a safe JSON integer
 * @param which "first" or "second", for the message
 * @param width the declared width, for the range check and the line's own type
 * @returns the value as a BigInt
 */
function parseCounter(raw: unknown, which: "first" | "second", width: CounterWidth): bigint {
  const s = fieldText(raw, true); // trimmed, bounded, precision-checked
  if (s === "") throw inputError(say(`err.valueEmpty.${which}`, `Enter the ${which} counter reading.`)); // one sentence per field
  const { label, value } = snmpValue(s); // a pasted line or value, taken apart
  const named = label === null ? null : COUNTER_LABEL_RE.exec(label); // Counter32 or Counter64, when the line says so
  if (named && Number(named[1]) !== width) throw inputError(say(`err.widthMismatch.${which}`, `The ${which} reading says Counter${named[1]}, but the counter width is set to ${width} (Counter${width}): the tool does not change the width for you. Set the width to ${named[1]} if that is the counter you polled, or paste a Counter${width} reading.`, { lineWidth: named[1], width: String(width) })); // never a silent switch
  if (label !== null && !named && OTHER_SNMP_LABELS.has(label)) throw inputError(say(`err.notCounter.${which}`, `The ${which} reading has the type ${label}, which is not a counter: this tool computes rates from Counter32 and Counter64 readings, such as ifInOctets or ifHCInOctets.`, { type: label })); // a gauge, an integer, a string...
  if ((label !== null && !named) || !/^\d{1,20}$/.test(value)) throw inputError(say(`err.valueBad.${which}`, `"${s}" is not a counter reading (${which}): a counter value is a whole number written with digits only, or the snmpget output line that carries it (for example IF-MIB::ifHCInOctets.1 = Counter64: 1234).`, { value: s })); // digits only, or a line that carries them
  const v = BigInt(value); // exact
  const max = (1n << BigInt(width)) - 1n; // 2^width - 1
  if (v > max) throw inputError(say(`err.valueRange.${which}`, `"${value}" is more than a Counter${width} can hold (at most ${max}): check the counter width.`, { value, width: String(width), max: max.toString() })); // too large for the width
  return v; // the reading
} // parseCounter

/**
 * The time unit.
 * @param v "s" or "ticks"; absent means "s"
 * @returns the unit
 */
function parseTimeUnit(v: unknown): TimeUnit {
  if (v === undefined || v === null || v === "" || v === "s") return "s"; // seconds by default
  if (v === "ticks") return "ticks"; // sysUpTime
  throw inputError(say("err.timeUnit", "The time unit must be s (seconds) or ticks (sysUpTime, in hundredths of a second).")); // anything else
} // parseTimeUnit

/**
 * A reading's time.
 * @param raw the text or a JSON number
 * @param which "first" or "second", for the message
 * @param unit seconds or ticks
 * @returns the time as a rational of seconds (ticks are divided by 100)
 */
function parseTime(raw: unknown, which: "first" | "second", unit: TimeUnit): { seconds: Q; ticks: bigint | null } {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") throw inputError(say(`err.timeEmpty.${which}`, `Enter the time of the ${which} reading.`)); // one sentence per field
  const { label, value } = snmpValue(s); // a pasted line or value, taken apart
  if (unit === "ticks") { // sysUpTime
    const paren = label === "Timeticks" ? TIMETICKS_VALUE_RE.exec(value) : null; // "Timeticks: (<ticks>) ..."
    const digits = label === null ? value : paren ? paren[1] : ""; // bare or -Ot ("<OID> = 14096763"), the number in brackets, or nothing
    if (!/^\d{1,10}$/.test(digits) || BigInt(digits) > MAX_TICKS) throw inputError(say(`err.ticksBad.${which}`, `"${s}" is not a sysUpTime value (${which} reading): write hundredths of a second as a whole number from 0 to 4294967295, or paste the snmpget output line for sysUpTime.0 (for example SNMPv2-MIB::sysUpTime.0 = Timeticks: (586731977) 67 days, 21:48:39.77).`, { value: s })); // not TimeTicks
    const t = BigInt(digits); // hundredths of a second
    return { seconds: q(t, 100n), ticks: t }; // seconds, and the raw ticks for the backwards check
  } // ticks
  if (label === "Timeticks") throw inputError(say(`err.ticksInSeconds.${which}`, `The time of the ${which} reading is a sysUpTime line (Timeticks, hundredths of a second), but the times are set to seconds: set them to sysUpTime ticks to use it.`)); // never a silent switch of the unit
  const t = /^\d{1,15}(?:\.\d{1,6})?$/.test(s) ? decimal(s) : null; // seconds with up to six decimals
  if (!t) throw inputError(say(`err.timeBad.${which}`, `"${s}" is not a time in seconds (${which} reading): write seconds as a number with a point for decimals, for example 1793616304 or 0.`, { value: s })); // not seconds
  return { seconds: t, ticks: null }; // seconds
} // parseTime

// ----------------------------------------------------------------------------
// Shared readings
// ----------------------------------------------------------------------------

/**
 * What RFC 2863 s3.1.6 requires at an interface speed.
 * @param speed the speed in bit/s
 * @param kind the counter asked about
 * @returns the band, the two requirements and the quoted sentence
 */
function rfc2863At(speed: Q, kind: CounterKind): Rfc2863Reading<EngineText> {
  const aboveOctets = cmp(speed, q(RFC2863_OCTETS_THRESHOLD)) > 0; // "faster than 20,000,000 bits/second"
  const atPackets = cmp(speed, q(RFC2863_PACKETS_THRESHOLD)) >= 0; // "650,000,000 bits/second or faster"
  const band: Rfc2863Band = atPackets ? "650m-and-above" : aboveOctets ? "20m-to-650m" : "up-to-20m"; // the three bands
  const quote = band === "up-to-20m" // the band's sentence, verbatim from RFC 2863 s3.1.6
    ? say("rfc.band.low", 'RFC 2863, section 3.1.6: "For interfaces that operate at 20,000,000 (20 million) bits per second or less, 32-bit byte and packet counters MUST be supported."')
    : band === "20m-to-650m"
      ? say("rfc.band.mid", 'RFC 2863, section 3.1.6: "For interfaces that operate faster than 20,000,000 bits/second, and slower than 650,000,000 bits/second, 32-bit packet counters MUST be supported and 64-bit octet counters MUST be supported."')
      : say("rfc.band.high", 'RFC 2863, section 3.1.6: "For interfaces that operate at 650,000,000 bits/second or faster, 64-bit packet counters AND 64-bit octet counters MUST be supported."');
  const thisCounterRequires64 = kind === "octets" ? aboveOctets : atPackets; // the counter asked about
  return { band, octets64Required: aboveOctets, packets64Required: atPackets, thisCounterRequires64, quote }; // the reading
} // rfc2863At

/**
 * The warning for a 32-bit counter where RFC 2863 requires 64 bits.
 * @param kind octets or packets
 * @returns the sentence
 */
function use64Warning(kind: CounterKind): EngineText {
  return kind === "octets" // which counters to poll instead
    ? say("warn.use64.octets", "RFC 2863 requires 64-bit octet counters on an interface of this speed: poll ifHCInOctets and ifHCOutOctets (Counter64) instead of the 32-bit ifInOctets and ifOutOctets.")
    : say("warn.use64.packets", "RFC 2863 requires 64-bit packet counters on an interface of this speed: poll the ifHC packet counters (ifHCInUcastPkts, ifHCOutUcastPkts and their multicast and broadcast siblings, Counter64) instead of the 32-bit ones.");
} // use64Warning

/** Why a single counter value carries no information (RFC 2578 s7.1.6 and s7.1.10, quoted). */
const singleValueNote = (): EngineText => say("note.singleValue", 'A single counter value means nothing on its own: "Counters have no defined "initial" value, and thus, a single value of a Counter has (in general) no information content" (RFC 2578, sections 7.1.6 and 7.1.10). Only the difference between two readings of the same counter carries information.'); // the brief's teaching point

/**
 * Units counted per second at a share of line rate.
 * @param speed bit/s
 * @param percent utilisation in percent
 * @param kind octets or packets
 * @param packetOctets octets of line time per packet (packets only)
 * @returns octets/s or packets/s
 */
function countRate(speed: Q, percent: Q, kind: CounterKind, packetOctets: number): Q {
  const bitsPerSecond = div(mul(speed, percent), q(100n)); // the share of the line in use
  const bitsPerUnit = kind === "octets" ? 8n : 8n * BigInt(packetOctets); // 8 bits an octet, or 8 x the packet's octets
  return div(bitsPerSecond, q(bitsPerUnit)); // units per second
} // countRate

// ----------------------------------------------------------------------------
// Wrap mode
// ----------------------------------------------------------------------------

/**
 * The wrap-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function wrapLocalisable(r: WrapRequest): WrapResult<EngineText> {
  const width = parseWidth(r.width); // 32 or 64
  const kind = parseKind(r.kind); // octets or packets
  const speed = parseSpeed(r.speed); // bit/s
  const util = parseUtilisation(r.utilisation); // percent
  const packetOctets = kind === "packets" ? parsePacketOctets(r.packetOctets) : DEFAULT_PACKET_OCTETS; // only packets read it
  const poll = parsePoll(r.poll); // seconds, or null
  const modulus = q(1n << BigInt(width)); // 2^width
  const rate = countRate(speed, util, kind, packetOctets); // at the stated load
  const lineRate = countRate(speed, q(100n), kind, packetOctets); // at 100 %
  const wrap = div(modulus, rate); // seconds between wraps at the stated load
  const lineWrap = div(modulus, lineRate); // the shortest possible time between wraps
  const otherWidth: CounterWidth = width === 32 ? 64 : 32; // the comparison
  const otherWrap = div(q(1n << BigInt(otherWidth)), rate); // the other width at the same load
  const margin = div(lineWrap, q(2n)); // the tool's margin: half the line-rate wrap time
  let pollOut: WrapResult<EngineText>["poll"] = null; // no interval, no verdict
  if (poll) { // an interval was given
    const count = mul(rate, poll); // counted between two polls at the stated load
    const verdict: PollVerdict = cmp(poll, margin) < 0 ? "safe" : cmp(poll, lineWrap) < 0 ? "no-margin" : cmp(poll, wrap) < 0 ? "burst" : "wraps"; // strict comparisons: at exactly one cycle the delta reads zero
    const text = verdict === "safe" // the verdict's sentence
      ? say("poll.safe", "Polling at this interval cannot miss a wrap, even at line rate, and a single lost poll still spans less than one wrap.")
      : verdict === "no-margin"
        ? say("poll.noMargin", "This interval cannot miss a wrap at line rate, but one lost poll doubles the gap between readings, and a doubled gap could hide a wrap: the tool's margin is half the line-rate wrap time.")
        : verdict === "burst"
          ? say("poll.burst", "At the stated load the counter goes round less than once between polls, but a burst towards line rate could take it round a full cycle, and the delta would then be wrong without any sign.")
          : say("poll.wraps", "At the stated load the counter goes round at least one full cycle between polls, so the deltas are wrong and no rate computed from them can be trusted: poll more often, or use a 64-bit counter.");
    pollOut = { seconds: decimalText(poll), countPerPoll: decimalText(count), cyclesPerPoll: decimalText(div(count, modulus)), verdict, text }; // the reading
  } // poll
  const rfc = rfc2863At(speed, kind); // what the standard requires here
  const warnings: EngineText[] = []; // in order
  if (width === 32 && rfc.thisCounterRequires64) warnings.push(use64Warning(kind)); // a 32-bit counter where 64 is required
  const notes: EngineText[] = [singleValueNote()]; // always: why deltas, never values
  notes.push(say("note.margin", "The margin is the tool's choice, not a standard's: half the line-rate wrap time, so that one lost poll (a request that timed out) still leaves less than one wrap between the two readings that remain.")); // the margin, labelled as ours
  if (kind === "octets") notes.push(say("note.lineRateOctets", "Line rate here is the interface speed divided by 8: an interface cannot count more octets per second than its bits carry, so the line-rate figures are the fastest the counter can move.")); // what line rate means for octets
  else { // packets
    notes.push(say("note.packetSize", `Packet counters move fastest with the smallest packets. The packet rate here assumes each packet takes ${packetOctets} octets of line time; on Ethernet the smallest frame takes 84 (64 octets of frame, an 8-octet preamble and a 12-octet gap, RFC 2544 Appendix B).`, { octets: String(packetOctets) })); // what line rate means for packets
    if (packetOctets < DEFAULT_PACKET_OCTETS) notes.push(say("note.belowEthernetMinimum", `${packetOctets} octets is less than the 84 octets of line time the smallest Ethernet frame takes, so on Ethernet the real packet rate cannot be this high. RFC 2863's own example counts 64-byte packets this way, without the preamble and the gap.`, { octets: String(packetOctets) })); // a rate Ethernet cannot reach
  } // packets
  return {
    mode: "wrap", // the mode
    width, // the width
    kind, // the kind
    modulus: modulus.n.toString(), // 2^width
    maxValue: (modulus.n - 1n).toString(), // 2^width - 1
    speedBitsPerSecond: decimalText(speed), // bit/s
    utilisationPercent: decimalText(util), // percent
    packetOctets: kind === "packets" ? packetOctets : null, // packets only
    countPerSecond: decimalText(rate), // at the stated load
    lineRateCountPerSecond: decimalText(lineRate), // at 100 %
    wrapSeconds: decimalText(wrap), // at the stated load
    lineRateWrapSeconds: decimalText(lineWrap), // at 100 %
    otherWidth: { width: otherWidth, wrapSeconds: decimalText(otherWrap) }, // the comparison
    neverMissBelowSeconds: decimalText(lineWrap), // strictly below this, no wrap can be missed
    marginPollSeconds: decimalText(margin), // the tool's margin
    poll: pollOut, // the interval's reading
    rfc2863: rfc, // the standard's requirement
    warnings, // warnings
    notes, // notes
  }; // the reading
} // wrapLocalisable

// ----------------------------------------------------------------------------
// Rate mode
// ----------------------------------------------------------------------------

/**
 * The rate-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function rateLocalisable(r: RateRequest): RateResult<EngineText> {
  const width = parseWidth(r.width); // 32 or 64
  const kind = parseKind(r.kind); // octets or packets
  const v1 = parseCounter(r.first, "first", width); // the first value
  const v2 = parseCounter(r.second, "second", width); // the second value
  const unit = parseTimeUnit(r.timeUnit); // seconds or ticks
  const t1 = parseTime(r.firstTime, "first", unit); // the first time
  const t2 = parseTime(r.secondTime, "second", unit); // the second time
  const interval = sub(t2.seconds, t1.seconds); // seconds between the readings
  if (interval.n === 0n) throw inputError(say("err.zeroInterval", "Both readings carry the same time, so there is no interval and no rate.")); // zero interval
  if (interval.n < 0n) { // the second time is earlier
    if (unit === "ticks") throw inputError(say("err.ticksBackwards", "The second sysUpTime is lower than the first: either the agent was re-initialised between the readings, which restarts its counters and makes any delta meaningless, or sysUpTime passed 4294967295 hundredths of a second (about 497 days) and went round. The tool does not guess which.")); // RFC 3418, RFC 2579
    throw inputError(say("err.negativeInterval", "The second reading's time is earlier than the first: enter the readings in the order they were taken.")); // a negative interval
  } // backwards
  const speedText = fieldText(r.speed); // optional
  const speed = speedText === "" ? null : parseSpeed(speedText); // bit/s, or none
  const packetOctets = kind === "packets" ? parsePacketOctets(r.packetOctets) : DEFAULT_PACKET_OCTETS; // only packets read it
  const modulus = 1n << BigInt(width); // 2^width
  const wrapped = v2 < v1; // a lower second value: one wrap assumed
  const delta = wrapped ? modulus - v1 + v2 : v2 - v1; // RFC 2578: the counter reached 2^width - 1, went back to zero and counted on
  const perSecond = div(q(delta), interval); // units per second
  const bitsPerSecond = kind === "octets" ? mul(perSecond, q(8n)) : null; // octets x 8
  let lineRateMax: Q | null = null; // the most the counter can count in this interval
  let verdict: RateVerdict = wrapped ? "wrapped" : speed ? "ok" : "ok-unchecked"; // before the line-rate checks
  let verdictText: EngineText = wrapped // the default sentence
    ? say("note.wrapAssumed", `The second reading is lower than the first. Unless the counter had a discontinuity, the only explanation is a wrap: it reached ${modulus - 1n}, went back to zero and counted on, so the delta is 2^${width} minus the first reading plus the second.`, { max: (modulus - 1n).toString(), width: String(width) })
    : speed
      ? say("rate.okChecked", "The readings give a usable rate: at the interface speed the counter cannot go round a full cycle in this interval.")
      : say("rate.okUnchecked", "The second reading is higher than the first, so no wrap is assumed. Without the interface speed the tool cannot rule out a full cycle between them.");
  let rfc: Rfc2863Reading<EngineText> | null = null; // only with a speed
  const warnings: EngineText[] = []; // in order
  if (speed) { // the line-rate checks
    lineRateMax = mul(countRate(speed, q(100n), kind, packetOctets), interval); // line rate x interval
    if (cmp(q(delta), lineRateMax) > 0) { // more than the interface could count
      verdict = "impossible"; // the readings do not belong together
      verdictText = wrapped // which impossibility
        ? say("rate.wrapImpossible", "The second reading is lower, but at the interface speed the counter could not have gone round to it in this interval: a wrap cannot explain it. A discontinuity (an agent restart or a counter reset) is the likely cause, and the delta is meaningless.")
        : say("rate.exceedsSpeed", "The delta is more than the interface could count in this interval even at its full speed, so the two readings do not belong together: look for a counter discontinuity, a different interface or counter, or the wrong counter width.");
    } else if (cmp(lineRateMax, q(modulus)) >= 0) { // a full cycle was possible
      verdict = "unreliable"; // the delta may be short by whole cycles
      verdictText = say("rate.multipleWraps", `At the interface speed this counter can count a full cycle (2^${width}) or more in this interval, so it may have gone round more often than the readings show: the delta may be short by a multiple of 2^${width}, and this rate cannot be trusted.`, { width: String(width) });
    } // checks
    rfc = rfc2863At(speed, kind); // what the standard requires here
    if (width === 32 && rfc.thisCounterRequires64) warnings.push(use64Warning(kind)); // a 32-bit counter where 64 is required
  } // speed
  const notes: EngineText[] = []; // in order
  if (wrapped && verdict !== "wrapped") notes.push(say("note.wrapAssumed", `The second reading is lower than the first. Unless the counter had a discontinuity, the only explanation is a wrap: it reached ${modulus - 1n}, went back to zero and counted on, so the delta is 2^${width} minus the first reading plus the second.`, { max: (modulus - 1n).toString(), width: String(width) })); // the wrap, when the verdict says something else
  if (wrapped && width === 64) notes.push(say("note.rareWrap64", "A Counter64 takes years to go round even at the fastest interface speeds, so a lower second reading is far more likely a discontinuity (an agent restart or a counter reset) than a wrap: check ifCounterDiscontinuityTime before trusting this delta.")); // 64-bit wraps are rare
  if (!speed) notes.push(say("note.noSpeed", "Enter the interface speed to check whether the counter could have gone round more than once in this interval.")); // the checks need a speed
  notes.push(say("note.discontinuity", 'A counter discontinuity makes the delta meaningless. Interface counters can jump "at re-initialization of the management system, and at other times as indicated by the value of ifCounterDiscontinuityTime" (RFC 2863): read ifCounterDiscontinuityTime with every poll, and discard the pair if it changed between the two readings.')); // always
  if (unit === "ticks") notes.push(say("note.ticks", 'sysUpTime counts "hundredths of a second" since the agent\'s management system "was last re-initialized" (RFC 3418), and TimeTicks are kept "modulo 2^32" (RFC 2578), so it goes round after about 497 days (RFC 2579).')); // what sysUpTime is
  notes.push(singleValueNote()); // always: why deltas, never values
  return {
    mode: "rate", // the mode
    width, // the width
    kind, // the kind
    modulus: modulus.toString(), // 2^width
    maxValue: (modulus - 1n).toString(), // 2^width - 1
    first: v1.toString(), // as read
    second: v2.toString(), // as read
    timeUnit: unit, // seconds or ticks
    intervalSeconds: decimalText(interval), // seconds
    delta: delta.toString(), // exact
    wrapped, // one wrap assumed
    bitsPerSecond: bitsPerSecond ? decimalText(bitsPerSecond) : null, // octets
    packetsPerSecond: kind === "packets" ? decimalText(perSecond) : null, // packets
    speedBitsPerSecond: speed ? decimalText(speed) : null, // bit/s
    packetOctets: speed && kind === "packets" ? packetOctets : null, // the line-rate checks' packet size
    utilisationPercent: speed && bitsPerSecond ? decimalText(div(mul(bitsPerSecond, q(100n)), speed)) : null, // octets with a speed
    lineRateMaxCount: lineRateMax ? decimalText(lineRateMax) : null, // with a speed
    lineRateCycles: lineRateMax ? decimalText(div(lineRateMax, q(modulus))) : null, // with a speed
    verdict, // the verdict
    verdictText, // in a sentence
    rfc2863: rfc, // with a speed
    warnings, // warnings
    notes, // notes
  }; // the reading
} // rateLocalisable

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The page's entry: either mode, sentences as EngineTexts.
 * @param r the request (its mode picks the computation)
 * @returns the reading
 */
export function runLocalisable(r: CounterRequest): CounterResult<EngineText> {
  if (r && typeof r === "object" && r.mode === "wrap") return wrapLocalisable(r); // wrap time
  if (r && typeof r === "object" && r.mode === "rate") return rateLocalisable(r as RateRequest); // rate from two readings
  throw inputError(say("err.mode", "Choose a mode: wrap (time to wrap and poll interval) or rate (rate from two readings).")); // no mode
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param r the request
 * @returns the reading as the API returns it
 */
export function run(r: CounterRequest): CounterResult {
  return plainText(runLocalisable(r)) as CounterResult; // sentences as their English
} // run

/**
 * The API's entry: the request body as JSON text.
 * @param input the JSON text
 * @returns the reading
 */
export function runApi(input: string): CounterResult {
  let parsed: unknown; // the body
  try {
    parsed = JSON.parse(input); // the object
  } catch {
    throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode, wrap or rate.")); // a readable refusal, passed through by the Worker
  } // parsed
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode, wrap or rate.")); // not an object
  return run(parsed as CounterRequest); // the same engine as the page
} // runApi
