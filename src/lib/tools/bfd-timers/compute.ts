// ============================================================================
// src/lib/tools/bfd-timers/compute.ts
// ----------------------------------------------------------------------------
// BFD timer calculator and control packet decoder: the pure engine (D-49:
// deterministic, local, no clock, no network, no randomness).
//
// TWO MODES, ONE MODULE
// ---------------------
//   * "timers" (the default): the two systems' Desired Min TX Interval,
//     Required Min RX Interval, Detect Mult, optional Required Min Echo RX
//     Interval and Demand mode, plus the session state (Up or not Up) and the
//     path (single hop or multihop). Out come, for each direction, the agreed
//     transmit interval, the jitter range applied to it, the packet rate, the
//     Detection Time the receiving system computes, whether Echo packets may
//     flow, and a plain-language explanation of every number with the section
//     of the standard it comes from.
//   * "decode": a BFD Control packet in hex (the 24-byte Mandatory Section and
//     an optional Authentication Section) read field by field, then run
//     through the receive checks of RFC 5880 section 6.8.6 in their order.
//
// THE RULES THIS ENGINE APPLIES (all read 2026-10-19 from the documents the
// manifest in ./index.ts lists, every one downloaded that day):
//   RFC 5880 s4.1   the field layout; intervals are 32-bit microsecond values;
//                   Desired Min TX 0 is reserved; Required Min RX 0 means "do
//                   not send me periodic Control packets"; Required Min Echo
//                   RX 0 means "I will not loop Echo packets".
//   RFC 5880 s6.8.3 when the session is not Up, bfd.DesiredMinTxInterval MUST
//                   be at least one second (1,000,000 microseconds).
//   RFC 5880 s6.8.7 a system MUST NOT transmit faster than the larger of its
//                   own Desired Min TX and the remote Required Min RX; every
//                   interval is reduced by a random 0 to 25% (jitter), and by
//                   10 to 25% when the sender's Detect Mult is 1.
//   RFC 5880 s6.8.4 Asynchronous mode: the receiver's Detection Time is the
//                   remote Detect Mult times the agreed transmit interval of
//                   the remote system. Demand mode: the local Detect Mult times
//                   the local agreed transmit interval, after a Poll Sequence.
//   RFC 5880 s6.6   Demand mode is active only when both systems see Up; the
//                   system receiving the Demand bit stops periodic packets.
//   RFC 5880 s6.8.9 Echo needs the session Up and a nonzero Required Min Echo
//                   RX from the system that loops the packets; a 25% jitter
//                   MAY apply.
//   RFC 5883 s3     the Echo function MUST NOT be used over multiple hops.
//   RFC 7419 s3     the Common Interval set: 3.3, 10, 20, 50, 100 ms and 1 s,
//                   plus 10 s for graceful restart; adjustment is always
//                   towards a larger interval.
//   FRRouting bfdd  receive-interval, transmit-interval and echo
//   documentation   receive-interval accept 10 to 4294967 milliseconds.
//   Junos OS 13.1   minimum-interval, minimum-receive-interval and
//   documentation   transmit-interval minimum-interval accept 1 to 255,000 ms.
// ============================================================================

/** Stable error codes; the UI maps each one to a localized message. */
export type BfdErrorCode =
  | "json" // the API body is not a JSON object
  | "field" // a required field is missing, has the wrong type, or is unknown
  | "interval-format" // an interval is not a number with a unit (us, ms or s)
  | "interval-range" // an interval does not fit the 32-bit microsecond field
  | "tx-zero" // Desired Min TX Interval 0 is reserved (RFC 5880 s4.1)
  | "mult-range" // Detect Mult outside 1..255 (nonzero, 8 bits)
  | "hex-format" // the packet text holds something other than hex digits and separators
  | "hex-length"; // the packet is shorter than 24 bytes, longer than 255, or has an odd digit count

/** A typed error carrying a stable code; the message is plain English for the API. */
export class BfdError extends Error {
  /** The stable code the UI translates. */
  readonly code: BfdErrorCode;
  /**
   * @param code the stable error code
   * @param message the English message the API returns
   */
  constructor(code: BfdErrorCode, message: string) {
    super(message); // the Error's own message, passed through by the Worker
    this.name = "BfdError"; // a readable name in stack traces
    this.code = code; // kept for the UI's translation lookup
  } // constructor
} // BfdError

// ---------------------------------------------------------------------------
// Constants, each with the document that fixes it
// ---------------------------------------------------------------------------

/** The largest value a 32-bit interval field holds, in microseconds (RFC 5880 s4.1). */
export const MAX_INTERVAL_US = 4294967295; // 2^32 - 1

/** One second in microseconds: the floor for a session that is not Up (RFC 5880 s6.8.3). */
export const ONE_SECOND_US = 1000000; // "not less than one second (1,000,000 microseconds)"

/** RFC 7419 section 3: the Common Interval set, in microseconds (3.3 ms is written 3300). */
export const COMMON_INTERVALS_US: readonly number[] = Object.freeze([3300, 10000, 20000, 50000, 100000, 1000000]); // 3.3, 10, 20, 50, 100 ms and 1 s

/** RFC 7419 section 3 and Appendix A: the 10-second interval recommended for graceful restart, outside the set. */
export const GRACEFUL_RESTART_INTERVAL_US = 10000000; // 10 s

/** A documented implementation floor: the smallest value a vendor document says its configuration accepts. */
export interface VendorFloor {
  /** Stable id used in warnings. */
  id: "frr" | "junos-13.1";
  /** The implementation and document, as a reader would name them. */
  label: string;
  /** The smallest accepted value, in microseconds. */
  minimumUs: number;
  /** The packet fields the documented knobs set. */
  fields: readonly IntervalField[];
} // VendorFloor

/** The three interval fields of a BFD Control packet, as RFC 5880 section 4.1 names them. */
export type IntervalField = "Desired Min TX Interval" | "Required Min RX Interval" | "Required Min Echo RX Interval";

/** Floors stated by vendor documents downloaded 2026-10-19 (see the manifest sources). */
export const VENDOR_FLOORS: readonly VendorFloor[] = Object.freeze([
  {
    id: "frr", // FRRouting bfdd, docs.frrouting.org/en/latest/bfd.html
    label: "FRRouting bfdd", // documentation: the undated "latest" page, read 2026-10-19
    minimumUs: 10000, // receive-interval (10-4294967), transmit-interval (10-4294967), echo receive-interval (10-4294967): milliseconds
    fields: ["Desired Min TX Interval", "Required Min RX Interval", "Required Min Echo RX Interval"], // the three knobs map to the three fields
  },
  {
    id: "junos-13.1", // Junos OS 13.1 bfd-liveness-detection (Protocols BGP), published 2013-08-15
    label: "Junos OS 13.1 (2013 documentation)", // published 2013-08-15: an old release, named as such
    minimumUs: 1000, // "Range: 1 through 255,000" milliseconds for minimum-interval and its two halves
    fields: ["Desired Min TX Interval", "Required Min RX Interval"], // no echo knob on that page
  },
]);

/** The longest interval string accepted, a bound that keeps parsing trivially linear. */
const MAX_INTERVAL_TEXT = 32; // "4294.967295 s" and friends fit easily

/**
 * An interval: digits, an optional fraction, optional spaces, then a unit.
 * Anchored, no nested quantifiers, bounded repetitions (ReDoS-safe).
 */
const INTERVAL_RE = /^(\d{1,10})(?:\.(\d{1,6}))?\s{0,3}(us|µs|μs|ms|s)$/; // µ is U+00B5, μ is U+03BC

/** Microseconds per unit, as BigInt so a ten-digit second count cannot overflow. */
const UNIT_SCALE: Readonly<Record<string, bigint>> = Object.freeze({
  us: 1n, // microseconds, the protocol's own unit
  "µs": 1n, // MICRO SIGN spelling
  "μs": 1n, // GREEK SMALL LETTER MU spelling
  ms: 1000n, // milliseconds, the unit configurations use
  s: 1000000n, // seconds
});

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse one interval into microseconds.
 * A JSON number is taken as microseconds (the protocol's unit); a string must
 * carry a unit: "300ms", "300 ms", "300000us", "3.3ms", "1s", except a bare "0".
 * @param value the value as given
 * @param where a label for the error message, e.g. "a.desiredMinTx"
 * @returns the interval in whole microseconds
 */
export function parseInterval(value: unknown, where: string): number {
  // A bare number: whole microseconds only.
  if (typeof value === "number") {
    // Integers only: the field carries whole microseconds.
    if (!Number.isInteger(value) || value < 0) throw new BfdError("interval-format", `${where}: a number is read as microseconds and must be a whole number of 0 or more`);
    // The 32-bit field bound.
    if (value > MAX_INTERVAL_US) throw new BfdError("interval-range", `${where}: ${value} us does not fit the 32-bit field (at most ${MAX_INTERVAL_US} us)`);
    return value; // already microseconds
  } // number
  // Anything else but a string is a type error.
  if (typeof value !== "string") throw new BfdError("field", `${where}: expected a string with a unit (for example "300ms") or a number of microseconds`);
  // Trim surrounding spaces once; the regular expression allows a few between number and unit.
  const text = value.trim();
  // A bare 0 needs no unit: zero is zero in every unit (and is the value that means "no packets").
  if (text === "0") return 0;
  // Length bound before the regular expression runs.
  if (text.length === 0 || text.length > MAX_INTERVAL_TEXT) throw new BfdError("interval-format", `${where}: write an interval such as 300ms, 300000us or 1s`);
  // Units are case-insensitive: lowercase the text (the micro signs are already lowercase letters and stay as they are).
  const m = INTERVAL_RE.exec(text.toLowerCase()); // "300MS" reads as "300ms"
  // No match: not a number with a unit.
  if (!m) throw new BfdError("interval-format", `${where}: "${text}" is not an interval; write a number and a unit (us, ms or s), such as 300ms`);
  // The unit's scale in microseconds.
  const scale = UNIT_SCALE[m[3]];
  // The fraction digits, if any, and their power of ten.
  const fracDigits = m[2] ?? ""; // "" when there is no fraction
  const fracDenominator = 10n ** BigInt(fracDigits.length); // 1 when there is no fraction
  // Exact arithmetic: (integer part * denominator + fraction) * scale / denominator.
  const numerator = (BigInt(m[1]) * fracDenominator + BigInt(fracDigits === "" ? "0" : fracDigits)) * scale; // scaled numerator
  // The value must come out as whole microseconds: the field has no finer unit.
  if (numerator % fracDenominator !== 0n) throw new BfdError("interval-format", `${where}: "${text}" is not a whole number of microseconds`);
  // The microsecond count.
  const us = numerator / fracDenominator;
  // The 32-bit field bound.
  if (us > BigInt(MAX_INTERVAL_US)) throw new BfdError("interval-range", `${where}: "${text}" is ${us} us, which does not fit the 32-bit field (at most ${MAX_INTERVAL_US} us)`);
  return Number(us); // safe: at most 2^32 - 1
} // parseInterval

/**
 * Parse a Detect Mult: an integer 1..255, given as a number or as digits.
 * @param value the value as given
 * @param where a label for the error message
 * @returns the multiplier
 */
export function parseDetectMult(value: unknown, where: string): number {
  // Digits in a string are accepted (form fields are strings).
  const n = typeof value === "string" && /^\s{0,3}\d{1,3}\s{0,3}$/.test(value) ? Number(value.trim()) : value; // a number, or the original value
  // Wrong type.
  if (typeof n !== "number" || !Number.isInteger(n)) throw new BfdError("field", `${where}: Detect Mult is a whole number from 1 to 255`);
  // RFC 5880 s6.8.1 "MUST be a nonzero integer", and the field is 8 bits wide (s4.1).
  if (n < 1 || n > 255) throw new BfdError("mult-range", `${where}: Detect Mult must be 1 to 255 (nonzero, RFC 5880 section 6.8.1; an 8-bit field, section 4.1); got ${n}`);
  return n; // the multiplier
} // parseDetectMult

// ---------------------------------------------------------------------------
// Formatting (shared with the UI, which passes its own decimal separator)
// ---------------------------------------------------------------------------

/**
 * Write a duration given in microseconds (possibly with a fraction, as jitter
 * bounds can have) in the largest readable unit: µs below 1 ms, ms below 1 s,
 * s from 1 s when the value is a whole number of milliseconds.
 * Exact: the value is turned into hundredths of a microsecond first.
 * @param us the duration in microseconds
 * @param decimalSeparator "." for English, "," for Portuguese
 * @returns e.g. "300 ms", "3.3 ms", "262.5 ms", "1 s", "500 µs"
 */
export function formatDuration(us: number, decimalSeparator = "."): string {
  // Zero needs no unit (and means "no packets" in the RX fields).
  if (us === 0) return "0";
  // Hundredths of a microsecond, an integer for every value this engine produces.
  const h = Math.round(us * 100);
  // Pick the unit and its size in hundredths of a microsecond.
  const [unit, size] =
    h < 100000 // under 1 ms
      ? ["µs", 100] // microseconds
      : h < 100000000 || h % 100000 !== 0 // under 1 s, or not a whole number of milliseconds
        ? ["ms", 100000] // milliseconds
        : ["s", 100000000]; // seconds
  // Whole part and remainder in that unit.
  const whole = Math.floor(h / size); // integer part
  const rest = h % size; // remainder in hundredths of a microsecond
  // The fraction digits, trimmed of trailing zeros (size is a power of ten).
  const digits = String(size).length - 1; // how many fraction digits the unit can need
  const frac = rest === 0 ? "" : String(rest).padStart(digits, "0").replace(/0+$/, ""); // e.g. "5" for 262.5
  // Assemble.
  return `${whole}${frac ? decimalSeparator + frac : ""} ${unit}`; // number, separator, unit
} // formatDuration

// ---------------------------------------------------------------------------
// The timers mode
// ---------------------------------------------------------------------------

/** One system's parameters as the request gives them. */
export interface SystemInput {
  /** Desired Min TX Interval: "300ms", "300000us", or a number of microseconds. */
  desiredMinTx: string | number;
  /** Required Min RX Interval; 0 means "send me no periodic Control packets". */
  requiredMinRx: string | number;
  /** Detect Mult, 1..255. */
  detectMult: string | number;
  /** Required Min Echo RX Interval; 0 or absent means "I will not loop Echo packets". */
  requiredMinEchoRx?: string | number;
  /** True when this system wants Demand mode (sets the D bit once the session is Up). */
  demand?: boolean;
} // SystemInput

/** The timers request. */
export interface TimersRequest {
  /** "timers", or absent. */
  mode?: "timers";
  /** System A. */
  a: SystemInput;
  /** System B. */
  b: SystemInput;
  /** Session state: true for Up (the default), false for any other state. */
  sessionUp?: boolean;
  /** "single-hop" (RFC 5881, the default) or "multihop" (RFC 5883). */
  path?: "single-hop" | "multihop";
} // TimersRequest

/** One explanation, warning or note: a stable id, its source, its numbers, and English text. */
export interface Explanation {
  /** Stable id; the UI renders explain.<id> (or warn.<id>, note.<id>) with params. */
  id: string;
  /** The document and section the statement comes from, or "computed: <rule>". */
  section: string;
  /** The numbers and names the text uses; keys ending in "Us" are microseconds. */
  params: Record<string, string | number>;
  /** The statement in English (the API's reading of it). */
  text: string;
} // Explanation

/** One system after parsing. */
export interface ResolvedSystem {
  /** "A" or "B". */
  name: "A" | "B";
  /** Desired Min TX Interval as configured, in microseconds. */
  desiredMinTxUs: number;
  /** The Desired Min TX the system advertises: raised to 1 s while the session is not Up (RFC 5880 s6.8.3). */
  advertisedMinTxUs: number;
  /** Required Min RX Interval, in microseconds. */
  requiredMinRxUs: number;
  /** Detect Mult. */
  detectMult: number;
  /** Required Min Echo RX Interval, in microseconds; 0 when absent. */
  requiredMinEchoRxUs: number;
  /** Demand mode requested by this system. */
  demandRequested: boolean;
  /** Demand mode in force: requested and the session Up (RFC 5880 s6.6). */
  demandActive: boolean;
} // ResolvedSystem

/** The Detection Time the receiving system computes for one direction. */
export interface Detection {
  /** "asynchronous" (RFC 5880 s6.8.4, first rule) or "demand" (second rule). */
  kind: "asynchronous" | "demand";
  /** The Detect Mult used: the remote's in asynchronous mode, the receiver's own in Demand mode. */
  detectMult: number;
  /** The interval multiplied, in microseconds. */
  intervalUs: number;
  /** Detect Mult times the interval, in microseconds. */
  timeUs: number;
} // Detection

/** What Echo packets may do in one direction (sent by `from`, looped back by `to`). */
export interface EchoResult {
  /** True when `from` may transmit Echo packets for `to` to loop back. */
  allowed: boolean;
  /** Why not, when not allowed. */
  reason: "session-not-up" | "receiver-zero" | "multihop" | null;
  /** The smallest interval between Echo packets, the receiver's Required Min Echo RX (RFC 5880 s6.8.9). */
  minIntervalUs: number | null;
  /** The shortest interval if the optional 25% jitter is applied: 75% of the minimum. */
  jitterMinUs: number | null;
} // EchoResult

/** Everything about Control packets flowing one way, from `from` to `to`. */
export interface DirectionResult {
  /** The sending system. */
  from: "A" | "B";
  /** The receiving system, which computes the Detection Time. */
  to: "A" | "B";
  /** True when the sender transmits periodic Control packets. */
  periodic: boolean;
  /** Why periodic packets do not flow, when they do not. */
  silentReason: "rx-zero" | "demand" | null;
  /** The agreed transmit interval: the larger of the sender's advertised Desired Min TX and the receiver's Required Min RX. */
  intervalUs: number;
  /** Which side set it: the sender's TX, the receiver's RX, or both (equal). */
  setBy: "sender" | "receiver" | "both";
  /** The jitter range applied to the interval (RFC 5880 s6.8.7). */
  jitter: {
    /** The shortest gap between packets, in microseconds. */
    minUs: number;
    /** The longest gap between packets, in microseconds. */
    maxUs: number;
    /** The average gap the RFC states (12.5% less), or null where it states none (Detect Mult 1). */
    averageUs: number | null;
    /** "standard" (0 to 25% reduction) or "detect-mult-1" (10 to 25% reduction). */
    rule: "standard" | "detect-mult-1";
  };
  /** Packets per second at the agreed interval, before jitter, rounded to 3 decimals (computed). */
  packetsPerSecond: number;
  /** The receiver's Detection Time, or null when the receiver asked for no periodic packets. */
  detection: Detection | null;
  /** True when the agreed interval is in RFC 7419's Common Interval set. */
  commonInterval: boolean;
  /** The next larger Common Interval (RFC 7419 s3 adjusts towards larger), or null when there is none or it is common. */
  nextCommonIntervalUs: number | null;
  /** Echo packets sent by `from` and looped back by `to`. */
  echo: EchoResult;
  /** Every number of this direction, explained, with its section. */
  explanations: Explanation[];
} // DirectionResult

/** The timers mode result. */
export interface TimersResult {
  /** Always "timers". */
  mode: "timers";
  /** The session state assumed. */
  sessionUp: boolean;
  /** The path kind assumed. */
  path: "single-hop" | "multihop";
  /** The two systems, parsed and resolved. */
  systems: { a: ResolvedSystem; b: ResolvedSystem };
  /** A to B, then B to A. */
  directions: [DirectionResult, DirectionResult];
  /** Conditions the reader should act on. */
  warnings: Explanation[];
  /** Context that explains the result as a whole. */
  notes: Explanation[];
} // TimersResult

/** The keys a system object may carry; anything else is refused so a typo cannot pass silently. */
const SYSTEM_KEYS = new Set(["desiredMinTx", "requiredMinRx", "detectMult", "requiredMinEchoRx", "demand"]);

/** The keys the timers request may carry. */
const TIMERS_KEYS = new Set(["mode", "a", "b", "sessionUp", "path"]);

/**
 * Parse one system's input.
 * @param raw the object as given
 * @param name "A" or "B"
 * @param sessionUp the session state, which decides the advertised TX and Demand mode
 * @returns the resolved system
 */
function resolveSystem(raw: unknown, name: "A" | "B", sessionUp: boolean): ResolvedSystem {
  // The key in the request, for error messages.
  const key = name.toLowerCase();
  // It must be a plain object.
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new BfdError("field", `${key}: expected an object with desiredMinTx, requiredMinRx and detectMult`);
  // The object, typed for reading.
  const o = raw as Record<string, unknown>;
  // Refuse unknown keys (a misspelt optional field would otherwise be ignored).
  for (const k of Object.keys(o)) if (!SYSTEM_KEYS.has(k)) throw new BfdError("field", `${key}.${k}: unknown field (expected desiredMinTx, requiredMinRx, detectMult, requiredMinEchoRx, demand)`);
  // The three required fields must be present.
  for (const k of ["desiredMinTx", "requiredMinRx", "detectMult"]) if (o[k] === undefined) throw new BfdError("field", `${key}.${k}: required`);
  // Desired Min TX Interval.
  const desiredMinTxUs = parseInterval(o.desiredMinTx, `${key}.desiredMinTx`);
  // RFC 5880 s4.1: "The value zero is reserved."
  if (desiredMinTxUs === 0) throw new BfdError("tx-zero", `${key}.desiredMinTx: the value zero is reserved (RFC 5880 section 4.1)`);
  // Required Min RX Interval (0 allowed: it means "no periodic packets, please").
  const requiredMinRxUs = parseInterval(o.requiredMinRx, `${key}.requiredMinRx`);
  // Detect Mult.
  const detectMult = parseDetectMult(o.detectMult, `${key}.detectMult`);
  // Required Min Echo RX Interval, 0 when absent.
  const requiredMinEchoRxUs = o.requiredMinEchoRx === undefined ? 0 : parseInterval(o.requiredMinEchoRx, `${key}.requiredMinEchoRx`);
  // Demand mode must be a boolean when given.
  if (o.demand !== undefined && typeof o.demand !== "boolean") throw new BfdError("field", `${key}.demand: expected true or false`);
  // Requested Demand mode.
  const demandRequested = o.demand === true;
  // RFC 5880 s6.8.3: while not Up, the advertised Desired Min TX is at least one second.
  const advertisedMinTxUs = sessionUp ? desiredMinTxUs : Math.max(desiredMinTxUs, ONE_SECOND_US);
  // RFC 5880 s6.6 and s6.8.7: the D bit is set only when both systems see the session Up.
  const demandActive = demandRequested && sessionUp;
  // The resolved system.
  return { name, desiredMinTxUs, advertisedMinTxUs, requiredMinRxUs, detectMult, requiredMinEchoRxUs, demandRequested, demandActive };
} // resolveSystem

/** English duration, the engine's own wording for the API text. */
const d = (us: number): string => formatDuration(us); // "." as the separator

/**
 * Round to three decimals without binary noise (for packets per second).
 * @param x the value
 * @returns x rounded to 3 decimals
 */
function round3(x: number): number {
  return Math.round(x * 1000) / 1000; // three decimals
} // round3

/**
 * Build one explanation record.
 * @param id stable id
 * @param section source section, or "computed: ..."
 * @param params the numbers and names used
 * @param text the English statement
 * @returns the record
 */
function ex(id: string, section: string, params: Record<string, string | number>, text: string): Explanation {
  return { id, section, params, text }; // a plain record, JSON-serialisable
} // ex

/**
 * Compute everything about Control packets flowing from `s` (sender) to `r` (receiver).
 * @param s the sending system
 * @param r the receiving system
 * @param sessionUp the session state
 * @param path the path kind
 * @returns the direction result
 */
function direction(s: ResolvedSystem, r: ResolvedSystem, sessionUp: boolean, path: "single-hop" | "multihop"): DirectionResult {
  // The explanations, in reading order.
  const out: Explanation[] = [];
  // RFC 5880 s6.8.7: the larger of the sender's Desired Min TX and the receiver's Required Min RX.
  const intervalUs = Math.max(s.advertisedMinTxUs, r.requiredMinRxUs);
  // Which side set it.
  const setBy: DirectionResult["setBy"] = s.advertisedMinTxUs === r.requiredMinRxUs ? "both" : s.advertisedMinTxUs > r.requiredMinRxUs ? "sender" : "receiver";
  // Slow start first, when it changed the sender's number (RFC 5880 s6.8.3).
  if (!sessionUp && s.desiredMinTxUs < ONE_SECOND_US) {
    out.push(ex("slow-start-tx", "RFC 5880 section 6.8.3", { from: s.name, configuredUs: s.desiredMinTxUs, advertisedUs: s.advertisedMinTxUs },
      `The session is not Up, so ${s.name} advertises a Desired Min TX of ${d(s.advertisedMinTxUs)} instead of its configured ${d(s.desiredMinTxUs)}: until the session is Up a system MUST use at least one second, which keeps the bandwidth of sessions that are not Up negligible.`));
  } // slow start
  // The agreed interval itself (RFC 5880 s6.8.2 and s6.8.7).
  out.push(ex(`interval-${setBy}`, "RFC 5880 sections 6.8.2 and 6.8.7", { from: s.name, to: r.name, txUs: s.advertisedMinTxUs, rxUs: r.requiredMinRxUs, intervalUs },
    `${s.name} may not send Control packets to ${r.name} faster than the larger of its own Desired Min TX (${d(s.advertisedMinTxUs)}) and ${r.name}'s Required Min RX (${d(r.requiredMinRxUs)}): ${d(intervalUs)}. ` +
      (setBy === "sender" ? `${s.name}, the slower side, sets the rate.` : setBy === "receiver" ? `${r.name}, the slower side, sets the rate.` : `Both ask for the same interval.`)));
  // Periodic transmission stops when the receiver asked for none (RFC 5880 s4.1, s6.8.7) or is in Demand mode (s6.6, s6.8.7).
  const silentReason: DirectionResult["silentReason"] = r.demandActive ? "demand" : r.requiredMinRxUs === 0 ? "rx-zero" : null;
  // Periodic when nothing stops it.
  const periodic = silentReason === null;
  // RFC 5880 s6.8.7 jitter: the sender's own Detect Mult chooses the rule.
  const multOne = s.detectMult === 1;
  // The jitter bounds: 75% to 100%, or 75% to 90% with Detect Mult 1; the average 87.5% in the general case.
  const jitter: DirectionResult["jitter"] = {
    minUs: (intervalUs * 3) / 4, // reduced by up to 25%: exact in binary (quarters)
    maxUs: multOne ? (intervalUs * 9) / 10 : intervalUs, // no more than 90% with Detect Mult 1
    averageUs: multOne ? null : (intervalUs * 7) / 8, // "roughly 12.5% less than that negotiated"
    rule: multOne ? "detect-mult-1" : "standard", // which sentence of s6.8.7 applies
  };
  // Packets per second at the agreed interval (computed, before jitter).
  const packetsPerSecond = round3(ONE_SECOND_US / intervalUs);
  // Explain the stop, or the jitter and the rate.
  if (silentReason === "rx-zero") {
    out.push(ex("silent-rx-zero", "RFC 5880 sections 4.1 and 6.8.7", { from: s.name, to: r.name },
      `${r.name} advertises a Required Min RX of 0: it does not want ${s.name} to send periodic Control packets, and ${s.name} MUST NOT send them. No detection time runs in this direction.`));
  } else if (silentReason === "demand") {
    out.push(ex("silent-demand", "RFC 5880 sections 6.6 and 6.8.7", { from: s.name, to: r.name },
      `${r.name} is in Demand mode and the session is Up, so ${s.name} MUST NOT send periodic Control packets; it answers ${r.name}'s Poll Sequences with the Final bit set.`));
  } else {
    // The jitter range, in the sentence of s6.8.7 that applies.
    out.push(multOne
      ? ex("jitter-mult-1", "RFC 5880 section 6.8.7", { from: s.name, minUs: jitter.minUs, maxUs: jitter.maxUs },
        `${s.name}'s Detect Mult is 1, so each gap between its packets MUST be no more than 90% and no less than 75% of the agreed interval: ${d(jitter.minUs)} to ${d(jitter.maxUs)}. That keeps the receiver's detection time from expiring before the next packet arrives.`)
      : ex("jitter", "RFC 5880 section 6.8.7", { from: s.name, minUs: jitter.minUs, maxUs: jitter.maxUs, averageUs: jitter.averageUs as number },
        `${s.name} shortens each interval by a random 0 to 25% to avoid self-synchronisation, so its packets leave every ${d(jitter.minUs)} to ${d(jitter.maxUs)}, about ${d(jitter.averageUs as number)} on average (roughly 12.5% less than the agreed interval).`));
    // The rate.
    out.push(ex("rate", "computed: 1 s divided by the agreed interval", { packetsPerSecond, intervalUs },
      `At ${d(intervalUs)} the rate before jitter is ${packetsPerSecond} per second, a little higher after it.`));
  } // stop, or jitter and rate
  // The Detection Time computed by the receiver (RFC 5880 s6.8.4).
  let detection: Detection | null = null; // null when no Detection Time runs
  if (r.demandActive) {
    // Demand mode: the receiver's own Detect Mult times its own agreed transmit interval.
    const ownIntervalUs = Math.max(r.advertisedMinTxUs, s.requiredMinRxUs); // the greater of bfd.DesiredMinTxInterval and bfd.RemoteMinRxInterval
    detection = { kind: "demand", detectMult: r.detectMult, intervalUs: ownIntervalUs, timeUs: r.detectMult * ownIntervalUs }; // after a Poll Sequence starts
    out.push(ex("detection-demand", "RFC 5880 sections 6.6 and 6.8.4", { to: r.name, from: s.name, detectMult: r.detectMult, intervalUs: ownIntervalUs, timeUs: detection.timeUs },
      `In Demand mode ${r.name} uses its own Detect Mult (${r.detectMult}) times its own agreed transmit interval (the larger of its Desired Min TX and ${s.name}'s Required Min RX, ${d(ownIntervalUs)}): ${d(detection.timeUs)}, counted from the start of a Poll Sequence it sends. The Poll works only if this is longer than the round-trip time.`));
  } else if (r.requiredMinRxUs > 0) {
    // Asynchronous mode: the sender's Detect Mult (received) times the agreed interval.
    detection = { kind: "asynchronous", detectMult: s.detectMult, intervalUs, timeUs: s.detectMult * intervalUs }; // the classic product
    out.push(ex("detection-async", "RFC 5880 section 6.8.4", { to: r.name, from: s.name, detectMult: s.detectMult, intervalUs, timeUs: detection.timeUs },
      `${r.name} declares the session Down, with diagnostic 1 (Control Detection Time Expired), after ${d(detection.timeUs)} without a valid packet from ${s.name}: ${s.name}'s Detect Mult (${s.detectMult}), which ${r.name} receives in every packet, times the agreed interval (${d(intervalUs)}). Roughly, ${s.detectMult} packets in a row must be lost.`));
  } // detection
  // RFC 7419 s3: is the agreed interval a Common Interval?
  const commonInterval = COMMON_INTERVALS_US.includes(intervalUs);
  // The next larger Common Interval, the direction RFC 7419 adjusts in.
  const nextCommonIntervalUs = commonInterval ? null : (COMMON_INTERVALS_US.find((c) => c > intervalUs) ?? null);
  // Explain it, once periodic packets flow.
  if (periodic) {
    if (commonInterval) {
      out.push(ex("common-interval", "RFC 7419 section 3", { intervalUs },
        `${d(intervalUs)} is in RFC 7419's Common Interval set (3.3, 10, 20, 50, 100 ms and 1 s), which every implementation should support from its fastest interval upwards.`));
    } else if (intervalUs === GRACEFUL_RESTART_INTERVAL_US) {
      out.push(ex("graceful-restart-interval", "RFC 7419 section 3 and Appendix A", { intervalUs },
        `${d(intervalUs)} is the interval RFC 7419 recommends for graceful restart, kept outside the Common Interval set; with Detect Mult 255 it gives 42.5 minutes.`));
    } else if (nextCommonIntervalUs !== null) {
      out.push(ex("not-common-interval", "RFC 7419 section 3", { intervalUs, nextUs: nextCommonIntervalUs },
        `${d(intervalUs)} is not in RFC 7419's Common Interval set. A hardware implementation that cannot run it adjusts towards a larger interval; the next Common Interval is ${d(nextCommonIntervalUs)}.`));
    } else {
      out.push(ex("above-common-intervals", "RFC 7419 section 3", { intervalUs },
        `${d(intervalUs)} is longer than every Common Interval in RFC 7419 (the largest is 1 s).`));
    } // which case
  } // common interval
  // Echo packets sent by s and looped back by r (RFC 5880 s6.8.9; RFC 5883 s3).
  const echoReason: EchoResult["reason"] = path === "multihop" ? "multihop" : !sessionUp ? "session-not-up" : r.requiredMinEchoRxUs === 0 ? "receiver-zero" : null;
  // Allowed when nothing forbids it.
  const echoAllowed = echoReason === null;
  // The echo result.
  const echo: EchoResult = {
    allowed: echoAllowed, // may s send Echo packets for r to loop?
    reason: echoReason, // why not
    minIntervalUs: echoAllowed ? r.requiredMinEchoRxUs : null, // r's Required Min Echo RX
    jitterMinUs: echoAllowed ? (r.requiredMinEchoRxUs * 3) / 4 : null, // the optional 25% jitter
  };
  // Explain the echo verdict.
  if (echoReason === "multihop") {
    out.push(ex("echo-multihop", "RFC 5883 section 3", { from: s.name }, `The Echo function MUST NOT be used over multiple hops: intermediate routers would send the packets back to ${s.name} without testing the whole path.`));
  } else if (echoReason === "session-not-up") {
    out.push(ex("echo-not-up", "RFC 5880 section 6.8.9", { from: s.name }, `Echo packets MUST NOT be sent while the session is not Up.`));
  } else if (echoReason === "receiver-zero") {
    out.push(ex("echo-receiver-zero", "RFC 5880 sections 4.1 and 6.8.9", { from: s.name, to: r.name }, `${r.name} advertises a Required Min Echo RX of 0: it will not loop Echo packets back, so ${s.name} sends none.`));
  } else {
    out.push(ex("echo-allowed", "RFC 5880 sections 6.8.5 and 6.8.9", { from: s.name, to: r.name, minUs: r.requiredMinEchoRxUs, jitterMinUs: echo.jitterMinUs as number },
      `${s.name} may send Echo packets for ${r.name} to loop back, no more often than every ${d(r.requiredMinEchoRxUs)} (${r.name}'s Required Min Echo RX), or every ${d(echo.jitterMinUs as number)} if it applies the optional 25% jitter. How many lost Echo packets mean failure is left to the implementation, so no Echo detection time is computed.`));
    // RFC 5880 s6.8.3: with Echo active, the control rate SHOULD drop to one second.
    if (s.requiredMinRxUs < ONE_SECOND_US) {
      out.push(ex("echo-control-rate", "RFC 5880 section 6.8.3", { from: s.name, rxUs: s.requiredMinRxUs },
        `If ${s.name} does run the Echo function, it SHOULD raise its own Required Min RX from ${d(s.requiredMinRxUs)} to at least 1 s, since the Echo packets then do the detecting.`));
    } // control rate
  } // echo
  // The whole direction.
  return { from: s.name, to: r.name, periodic, silentReason, intervalUs, setBy, jitter, packetsPerSecond, detection, commonInterval, nextCommonIntervalUs, echo, explanations: out };
} // direction

/**
 * The timers mode: both directions of one session.
 * @param req the request object
 * @returns the result
 */
export function computeTimers(req: TimersRequest): TimersResult {
  // The request must be an object.
  if (typeof req !== "object" || req === null || Array.isArray(req)) throw new BfdError("field", "expected an object with a and b");
  // Refuse unknown top-level keys.
  for (const k of Object.keys(req)) if (!TIMERS_KEYS.has(k)) throw new BfdError("field", `${k}: unknown field (expected mode, a, b, sessionUp, path)`);
  // sessionUp: boolean, default true.
  if (req.sessionUp !== undefined && typeof req.sessionUp !== "boolean") throw new BfdError("field", "sessionUp: expected true or false");
  // The state assumed.
  const sessionUp = req.sessionUp !== false;
  // path: one of two strings, default single-hop.
  if (req.path !== undefined && req.path !== "single-hop" && req.path !== "multihop") throw new BfdError("field", 'path: expected "single-hop" or "multihop"');
  // The path assumed.
  const path = req.path ?? "single-hop";
  // Both systems.
  const a = resolveSystem(req.a, "A", sessionUp); // system A
  const b = resolveSystem(req.b, "B", sessionUp); // system B
  // Both directions.
  const ab = direction(a, b, sessionUp, path); // A sends, B detects
  const ba = direction(b, a, sessionUp, path); // B sends, A detects
  // Warnings and notes for the session as a whole.
  const warnings: Explanation[] = []; // act on these
  const notes: Explanation[] = []; // context
  // Per system: Required Min RX 0, demand requested while not Up, vendor floors.
  for (const s of [a, b]) {
    // Required Min RX 0 (RFC 5880 s4.1).
    if (s.requiredMinRxUs === 0) warnings.push(ex("rx-zero", "RFC 5880 section 4.1", { system: s.name }, `${s.name}'s Required Min RX is 0: ${s.name} does not want the other system to send periodic Control packets, so nothing detects a failure towards ${s.name} in Asynchronous mode.`));
    // Demand requested but the session is not Up (RFC 5880 s6.6).
    if (s.demandRequested && !sessionUp) notes.push(ex("demand-not-up", "RFC 5880 section 6.6", { system: s.name }, `${s.name} asks for Demand mode, but the Demand bit MUST NOT be set until both systems see the session Up, so both directions run in Asynchronous mode for now.`));
    // The three interval fields, against each documented floor.
    const fields: [IntervalField, number][] = [["Desired Min TX Interval", s.desiredMinTxUs], ["Required Min RX Interval", s.requiredMinRxUs], ["Required Min Echo RX Interval", s.requiredMinEchoRxUs]]; // name, value
    for (const [field, valueUs] of fields) {
      // 0 is a meaning (no packets), not a value below a floor.
      if (valueUs === 0) continue;
      // Each vendor document that sets this field.
      for (const v of VENDOR_FLOORS) {
        // Only the fields that vendor's knobs set, and only values below its floor.
        if (!v.fields.includes(field) || valueUs >= v.minimumUs) continue;
        // The warning names the vendor, its document, and its floor.
        warnings.push(ex("below-vendor-minimum", v.id === "frr" ? "FRRouting, BFD (bfdd)" : "Junos OS 13.1, bfd-liveness-detection", { system: s.name, field, valueUs, vendor: v.label, minimumUs: v.minimumUs },
          `${s.name}'s ${field} of ${d(valueUs)} is below the smallest value ${v.label} accepts (${d(v.minimumUs)}); that implementation cannot be configured this fast.`));
      } // each vendor
    } // each field
  } // each system
  // Both in Demand mode: nothing flows (RFC 5880 s6.6).
  if (a.demandActive && b.demandActive) warnings.push(ex("demand-both", "RFC 5880 section 6.6", {}, "Both systems are in Demand mode: no periodic Control packets flow in either direction, and a failed path is noticed only when one of them starts a Poll Sequence or by whatever other means each uses to verify connectivity."));
  // Echo configured on a multihop session (RFC 5883 s3).
  if (path === "multihop" && (a.requiredMinEchoRxUs > 0 || b.requiredMinEchoRxUs > 0)) warnings.push(ex("echo-on-multihop", "RFC 5883 section 3", {}, "A Required Min Echo RX is set on a multihop session, where the Echo function MUST NOT be used."));
  // Slow start (RFC 5880 s6.8.3, s6.1).
  if (!sessionUp) notes.push(ex("slow-start", "RFC 5880 sections 6.1 and 6.8.3", { oneSecondUs: ONE_SECOND_US }, "The session is not Up: both systems advertise a Desired Min TX of at least 1 s until it is, so the numbers here are the slow start, not the running session. Set the state to Up to see the configured rates."));
  // Different Detection Times per direction (RFC 5880 s6.8.4).
  if (ab.detection && ba.detection && ab.detection.timeUs !== ba.detection.timeUs) notes.push(ex("asymmetric", "RFC 5880 section 6.8.4", { aToBUs: ab.detection.timeUs, bToAUs: ba.detection.timeUs }, `The two directions detect a failure at different times: B after ${d(ab.detection.timeUs)} without packets from A, A after ${d(ba.detection.timeUs)} without packets from B. The negotiation is independent in each direction.`));
  // The ports in use (RFC 5881 s4, RFC 5883 s5).
  notes.push(path === "multihop"
    ? ex("ports-multihop", "RFC 5883 section 5", {}, "Multihop Control packets use UDP destination port 4784.")
    : ex("ports-single-hop", "RFC 5881 sections 4 and 5", {}, "Single-hop Control packets use UDP destination port 3784 (Echo packets 3785) and, without authentication, a TTL or Hop Limit of 255."));
  // The result.
  return { mode: "timers", sessionUp, path, systems: { a, b }, directions: [ab, ba], warnings, notes };
} // computeTimers

// ---------------------------------------------------------------------------
// The decode mode
// ---------------------------------------------------------------------------

/** The decode request. */
export interface DecodeRequest {
  /** Always "decode". */
  mode: "decode";
  /** The packet as hex: spaces, colons, hyphens and dots between bytes are allowed; a leading 0x too. */
  packet: string;
} // DecodeRequest

/** The decode result. */
export interface DecodeResult {
  /** Always "decode". */
  mode: "decode";
  /** The bytes given, as lowercase hex without separators. */
  hex: string;
  /** How many bytes were given (taken as the UDP payload). */
  bytes: number;
  /** Version (3 bits). */
  version: number;
  /** Diagnostic (5 bits), with its registered name. */
  diagnostic: { code: number; name: string; registry: string };
  /** State (2 bits), with its name. */
  state: { code: number; name: "AdminDown" | "Down" | "Init" | "Up" };
  /** The six flag bits. */
  flags: { poll: boolean; final: boolean; controlPlaneIndependent: boolean; authenticationPresent: boolean; demand: boolean; multipoint: boolean };
  /** Detect Mult. */
  detectMult: number;
  /** Length, in bytes. */
  length: number;
  /** My Discriminator. */
  myDiscriminator: number;
  /** Your Discriminator. */
  yourDiscriminator: number;
  /** Desired Min TX Interval, in microseconds. */
  desiredMinTxUs: number;
  /** Required Min RX Interval, in microseconds. */
  requiredMinRxUs: number;
  /** Required Min Echo RX Interval, in microseconds. */
  requiredMinEchoRxUs: number;
  /** The Authentication Section's type and length, when the A bit is set and the bytes are there; its data is never shown. */
  auth: { type: number; name: string; length: number } | null;
  /** The first receive check of RFC 5880 s6.8.6 that discards this packet, or null when none does. */
  discardedBy: Explanation | null;
  /** Other findings: rules the sender broke, and what the field values mean. */
  findings: Explanation[];
} // DecodeResult

/** RFC 5880 s4.1 diagnostic names 0..8, and IANA's 9 (RFC 6428). */
const DIAG_NAMES: readonly string[] = Object.freeze([
  "No Diagnostic", // 0
  "Control Detection Time Expired", // 1
  "Echo Function Failed", // 2
  "Neighbor Signaled Session Down", // 3
  "Forwarding Plane Reset", // 4
  "Path Down", // 5
  "Concatenated Path Down", // 6
  "Administratively Down", // 7
  "Reverse Concatenated Path Down", // 8
  "mis-connectivity defect", // 9, IANA BFD Diagnostic Codes, RFC 6428
]);

/** RFC 5880 s4.1 state names. */
const STATE_NAMES: readonly ("AdminDown" | "Down" | "Init" | "Up")[] = Object.freeze(["AdminDown", "Down", "Init", "Up"]); // 0..3

/** RFC 5880 s4.1 authentication types 0..5, and IANA's 6..8. */
const AUTH_NAMES: readonly string[] = Object.freeze([
  "Reserved", // 0
  "Simple Password", // 1
  "Keyed MD5", // 2
  "Meticulous Keyed MD5", // 3
  "Keyed SHA1", // 4
  "Meticulous Keyed SHA1", // 5
  "NULL", // 6, IANA, RFC 9978 (Experimental)
  "Optimised MD5 Meticulous Keyed ISAAC Authentication", // 7, IANA, RFC 9986 (Experimental)
  "Optimised SHA-1 Meticulous Keyed ISAAC Authentication", // 8, IANA, RFC 9986 (Experimental)
]);

/** The longest packet text accepted: 255 bytes with a separator each, plus a prefix. */
const MAX_PACKET_TEXT = 1024; // generous and bounded

/**
 * Read a big-endian 32-bit unsigned integer.
 * @param b the bytes
 * @param i the offset
 * @returns the value
 */
function u32(b: Uint8Array, i: number): number {
  return ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3]; // unsigned, no sign bit trouble
} // u32

/**
 * Decode a BFD Control packet given in hex.
 * @param text the packet as hex
 * @returns the decoded fields and the receive checks
 */
export function decodePacket(text: string): DecodeResult {
  // Strings only.
  if (typeof text !== "string") throw new BfdError("field", "packet: expected a string of hex digits");
  // Length bound before any scanning.
  if (text.length > MAX_PACKET_TEXT) throw new BfdError("hex-length", `packet: at most ${MAX_PACKET_TEXT} characters`);
  // Drop a leading 0x and every separator.
  const cleaned = text.trim().replace(/^0x/i, "").replace(/[\s:.-]/g, ""); // hex digits only, if the input is valid
  // Anything left that is not hex is an error.
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) throw new BfdError("hex-format", "packet: only hex digits, with spaces, colons, hyphens or dots between bytes");
  // Whole bytes only.
  if (cleaned.length % 2 !== 0) throw new BfdError("hex-length", `packet: an odd number of hex digits (${cleaned.length})`);
  // The byte count.
  const n = cleaned.length / 2;
  // The Mandatory Section is 24 bytes; the Length field is 8 bits, so 255 is the most a packet can claim.
  if (n < 24 || n > 255) throw new BfdError("hex-length", `packet: ${n} bytes; a BFD Control packet has a 24-byte Mandatory Section and at most 255 bytes`);
  // The bytes.
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i++) b[i] = parseInt(cleaned.slice(2 * i, 2 * i + 2), 16); // two digits per byte
  // Byte 0: Vers (3 bits) and Diag (5 bits).
  const version = b[0] >> 5; // top three bits
  const diagCode = b[0] & 0x1f; // low five bits
  // Byte 1: Sta (2 bits) and P F C A D M.
  const stateCode = b[1] >> 6; // top two bits
  const flags = {
    poll: (b[1] & 0x20) !== 0, // P
    final: (b[1] & 0x10) !== 0, // F
    controlPlaneIndependent: (b[1] & 0x08) !== 0, // C
    authenticationPresent: (b[1] & 0x04) !== 0, // A
    demand: (b[1] & 0x02) !== 0, // D
    multipoint: (b[1] & 0x01) !== 0, // M
  };
  // Bytes 2 and 3: Detect Mult and Length.
  const detectMult = b[2]; // 8 bits
  const length = b[3]; // 8 bits
  // The five 32-bit fields.
  const myDiscriminator = u32(b, 4); // bytes 4..7
  const yourDiscriminator = u32(b, 8); // bytes 8..11
  const desiredMinTxUs = u32(b, 12); // bytes 12..15
  const requiredMinRxUs = u32(b, 16); // bytes 16..19
  const requiredMinEchoRxUs = u32(b, 20); // bytes 20..23
  // Names.
  const diagnostic = {
    code: diagCode, // the number
    name: diagCode < DIAG_NAMES.length ? DIAG_NAMES[diagCode] : "Unassigned", // 10..31 are unassigned in the IANA registry
    registry: diagCode <= 8 ? "RFC 5880 section 4.1" : "IANA BFD Diagnostic Codes", // where the name comes from
  };
  const state = { code: stateCode, name: STATE_NAMES[stateCode] }; // 0..3 always named
  // The Authentication Section's header, when present and given.
  const auth = flags.authenticationPresent && n >= 26 ? { type: b[24], name: b[24] < AUTH_NAMES.length ? AUTH_NAMES[b[24]] : "Unassigned", length: b[25] } : null; // data never shown
  // RFC 5880 s6.8.6, in order: the first failing check discards the packet.
  const minLength = flags.authenticationPresent ? 26 : 24; // "24 if the A bit is clear, or 26 if the A bit is set"
  const checks: [boolean, Explanation][] = [
    [version !== 1, ex("discard-version", "RFC 5880 section 6.8.6", { version }, `Version ${version} is not 1, so the packet MUST be discarded.`)],
    [length < minLength, ex("discard-length-short", "RFC 5880 section 6.8.6", { length, minimum: minLength }, `Length ${length} is less than the minimum of ${minLength} (24 with the A bit clear, 26 with it set), so the packet MUST be discarded.`)],
    [length > n, ex("discard-length-long", "RFC 5880 section 6.8.6", { length, bytes: n }, `Length ${length} is greater than the ${n} bytes given (taken as the UDP payload), so the packet MUST be discarded.`)],
    [detectMult === 0, ex("discard-mult-zero", "RFC 5880 section 6.8.6", {}, "Detect Mult is zero, so the packet MUST be discarded.")],
    [flags.multipoint, ex("discard-multipoint", "RFC 5880 section 6.8.6", {}, "The Multipoint (M) bit is set, so the packet MUST be discarded.")],
    [myDiscriminator === 0, ex("discard-my-disc-zero", "RFC 5880 section 6.8.6", {}, "My Discriminator is zero, so the packet MUST be discarded.")],
    [yourDiscriminator === 0 && stateCode > 1, ex("discard-your-disc-zero", "RFC 5880 section 6.8.6", { state: state.name }, `Your Discriminator is zero while the state is ${state.name} (not Down or AdminDown), so the packet MUST be discarded.`)],
  ];
  // The first failing check, if any.
  const discardedBy = checks.find(([failed]) => failed)?.[1] ?? null;
  // Other findings, in packet order.
  const findings: Explanation[] = [];
  // Diagnostic and state, in words.
  findings.push(ex("diag", diagnostic.registry === "RFC 5880 section 4.1" ? "RFC 5880 section 4.1" : "IANA, BFD Diagnostic Codes", { code: diagCode, name: diagnostic.name }, `Diagnostic ${diagCode}: ${diagnostic.name}, the sender's reason for the last change in its session state.`));
  // RFC 5880 s6.2: what each state means, in the sender's view.
  const stateMeaning: Record<string, string> = {
    AdminDown: "the sender holds the session administratively down, which says nothing about the forwarding path", // s6.2 AdminDown
    Down: "the session is down on the sender's side, or has just been created", // s6.2 Down
    Init: "the sender hears the other system and wants to bring the session up", // s6.2 Init
    Up: "the session is established, as the sender sees it", // s6.2 Up
  };
  findings.push(ex(`state-${state.name.toLowerCase()}`, "RFC 5880 sections 4.1 and 6.2", { state: state.name }, `State ${state.name}: ${stateMeaning[state.name]}.`));
  // Poll and Final together (RFC 5880 s6.5).
  if (flags.poll && flags.final) findings.push(ex("poll-and-final", "RFC 5880 section 6.5", {}, "The Poll and Final bits are both set; a BFD Control packet MUST NOT have both."));
  else if (flags.poll) findings.push(ex("poll", "RFC 5880 sections 4.1 and 6.5", {}, "Poll is set: the sender asks for verification of connectivity or of a parameter change and expects a packet with Final set in reply."));
  else if (flags.final) findings.push(ex("final", "RFC 5880 sections 4.1 and 6.5", {}, "Final is set: the sender answers a packet that had Poll set."));
  // The C bit.
  findings.push(flags.controlPlaneIndependent
    ? ex("c-set", "RFC 5880 section 4.1", {}, "Control Plane Independent (C) is set: the sender's BFD does not share fate with its control plane.")
    : ex("c-clear", "RFC 5880 section 4.1", {}, "Control Plane Independent (C) is clear: the sender's BFD shares fate with its control plane."));
  // The A bit and the Authentication Section.
  if (flags.authenticationPresent) {
    // Header present: type and length; otherwise say it is missing.
    findings.push(auth
      ? ex("auth", auth.type <= 5 ? "RFC 5880 sections 4.1 and 6.7" : "IANA, BFD Authentication Types", { type: auth.type, name: auth.name, length: auth.length }, `Authentication Present (A) is set: Auth Type ${auth.type} (${auth.name}), Auth Len ${auth.length}. The receiver MUST authenticate the packet under section 6.7, which needs the key; no authentication data is shown here.`)
      : ex("auth-missing", "RFC 5880 section 4.1", {}, "Authentication Present (A) is set, but the bytes given end before the Authentication Section."));
  } // A bit
  // The D bit (RFC 5880 s6.8.7: set only when both systems are Up).
  if (flags.demand) findings.push(stateCode === 3
    ? ex("demand", "RFC 5880 sections 4.1 and 6.6", {}, "Demand (D) is set: the sender is in Demand mode and tells the receiver to stop periodic Control packets.")
    : ex("demand-not-up", "RFC 5880 section 6.8.7", { state: state.name }, `Demand (D) is set while the state is ${state.name}; a system MUST NOT set it unless the session is Up on both sides.`));
  // Your Discriminator zero (meaning, when not a discard).
  if (yourDiscriminator === 0 && stateCode <= 1) findings.push(ex("your-disc-zero", "RFC 5880 section 4.1", {}, "Your Discriminator is zero: the sender has not yet learned the receiver's discriminator."));
  // Desired Min TX.
  if (desiredMinTxUs === 0) findings.push(ex("tx-zero", "RFC 5880 section 4.1", {}, "Desired Min TX Interval is zero, a reserved value."));
  else if (stateCode !== 3 && desiredMinTxUs < ONE_SECOND_US) findings.push(ex("tx-below-one-second", "RFC 5880 section 6.8.3", { txUs: desiredMinTxUs, state: state.name }, `The state is ${state.name} and Desired Min TX is ${d(desiredMinTxUs)}; while the session is not Up the sender MUST advertise at least 1 s.`));
  // Required Min RX zero.
  if (requiredMinRxUs === 0) findings.push(ex("rx-zero", "RFC 5880 section 4.1", {}, "Required Min RX Interval is zero: the sender does not want the receiver to send periodic Control packets."));
  // Required Min Echo RX zero or not.
  findings.push(requiredMinEchoRxUs === 0
    ? ex("echo-zero", "RFC 5880 section 4.1", {}, "Required Min Echo RX Interval is zero: the sender will not loop Echo packets back.")
    : ex("echo-nonzero", "RFC 5880 sections 4.1 and 6.8.9", { echoUs: requiredMinEchoRxUs }, `Required Min Echo RX Interval is ${d(requiredMinEchoRxUs)}: the sender will loop Echo packets sent no more often than that.`));
  // Bytes after Length are not part of the Control packet.
  if (length >= minLength && length < n) findings.push(ex("trailing-bytes", "RFC 5880 section 4.1", { length, bytes: n }, `The Length field says ${length} bytes; the bytes after them, up to the ${n} given, are not part of the Control packet.`));
  // The result.
  return { mode: "decode", hex: cleaned.toLowerCase(), bytes: n, version, diagnostic, state, flags, detectMult, length, myDiscriminator, yourDiscriminator, desiredMinTxUs, requiredMinRxUs, requiredMinEchoRxUs, auth, discardedBy, findings };
} // decodePacket

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/** Either request. */
export type BfdRequest = TimersRequest | DecodeRequest;

/** Either result. */
export type BfdResult = TimersResult | DecodeResult;

/**
 * Run either mode from a request object.
 * @param req a timers request (mode absent or "timers") or a decode request
 * @returns the result of that mode
 */
export function run(req: BfdRequest): BfdResult {
  // An object is required.
  if (typeof req !== "object" || req === null || Array.isArray(req)) throw new BfdError("json", "expected a JSON object");
  // The mode, by its discriminator.
  const mode = (req as { mode?: unknown }).mode;
  // Decode mode: exactly mode and packet.
  if (mode === "decode") {
    // Refuse unknown keys.
    for (const k of Object.keys(req)) if (k !== "mode" && k !== "packet") throw new BfdError("field", `${k}: unknown field (decode takes mode and packet)`);
    return decodePacket((req as DecodeRequest).packet); // the decoder
  } // decode
  // Anything but timers is an unknown mode.
  if (mode !== undefined && mode !== "timers") throw new BfdError("field", 'mode: expected "timers" or "decode"');
  return computeTimers(req as TimersRequest); // the calculator
} // run

/**
 * The API entry point: the request body as a JSON string.
 * @param input the JSON text
 * @returns the result of the mode it names
 */
export function runApi(input: string): BfdResult {
  // Parse, turning a syntax error into this engine's own error (the Worker passes its message through).
  let parsed: unknown; // the parsed body
  try {
    parsed = JSON.parse(input); // the body
  } catch {
    throw new BfdError("json", 'the request body is not valid JSON; send an object such as {"a":{...},"b":{...}} or {"mode":"decode","packet":"..."}'); // a readable refusal
  } // parsed
  return run(parsed as BfdRequest); // the same engine the page uses
} // runApi
