// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vrrp-timer-calculator/compute.ts
// ----------------------------------------------------------------------------
// VRRP TIMER, VIRTUAL MAC AND ELECTION CALCULATOR - the pure, deterministic
// engine (02/11/2026, written for chapter 4.2 of the open course "LAN Switch
// Operations and Maintenance" and the Learn article
// first-hop-redundancy-vrrp-and-hsrp).
//
// THREE QUESTIONS, THREE MODES.
//   timers    For a router's priority and the advertisement interval, what
//             are Skew_Time and the time a Backup waits before it declares
//             the Active Router down, with the arithmetic shown, and when does
//             a Backup take over after a silent failure or a clean shutdown?
//   election  For two to eight routers (name, priority, primary address,
//             whether it owns the virtual address), who is Active at the
//             start and why, who takes over when it fails silently or shuts
//             down cleanly, how long that takes, and what happens when it
//             comes back, with Preempt_Mode on or off?
//   mac       For a VRID and an address family, the Virtual Router MAC
//             address in three notations.
//
// THE RULES, each from a document read on 2026-11-02 (sources in index.ts):
//   - RFC 9568 (VRRP version 3, April 2024; it obsoletes RFC 5798, which had
//     obsoleted RFC 3768) s5.2.4 and s6.1: priority 255 for the router that
//     owns the virtual address, 1 to 254 for Backups (default 100), 0 reserved
//     for an Active Router relinquishing responsibility; VRID 1 to 255 with no
//     default; Advertisement_Interval in centiseconds, default 100; verified
//     erratum 8301: configurable 1 to 4095 centiseconds (the field is 12 bits,
//     s5.2.7);
//       Skew_Time            = (((256 - Priority) * Active_Adver_Interval) / 256)
//       Active_Down_Interval = (3 * Active_Adver_Interval) + Skew_Time
//     both in centiseconds; Preempt_Mode default True, "the router that owns
//     the IPvX address associated with the Virtual Router always preempts,
//     independent of the setting of this flag".
//   - RFC 9568 s6.4.1 to s6.4.3 (the state machine): the owner becomes Active
//     at once at startup, every other router starts as a Backup with its
//     Active_Down_Timer set to Active_Down_Interval; a Backup becomes Active
//     when the timer fires; an ADVERTISEMENT with priority 0 sets the timer to
//     Skew_Time; any other ADVERTISEMENT resets it when Preempt_Mode is False
//     or its priority is greater than or equal to the local one, and is
//     discarded otherwise; an Active Router returns to Backup on an
//     ADVERTISEMENT of higher priority, or of equal priority from a higher
//     primary address "based on an unsigned integer comparison of the IPvX
//     addresses in network byte order".
//   - RFC 9568 s1.7: in IPv6 the primary address is the link-local address
//     ADVERTISEMENTs are sent from (RFC 4291 s2.5.6: fe80::/10); s7.3: the
//     Virtual Router MAC is 00-00-5E-00-01-{VRID} for IPv4 and
//     00-00-5E-00-02-{VRID} for IPv6; s8.3.2: only one router SHOULD have
//     priority 255, and priorities SHOULD differ.
//   - RFC 3768 (VRRP version 2, IPv4 only, s1.2; obsoleted, read for older
//     equipment): Advertisement_Interval in whole seconds (an 8-bit field,
//     s5.1 and s5.3.7, default 1 second);
//       Skew_Time            = ( (256 - Priority) / 256 )
//       Master_Down_Interval = (3 * Advertisement_Interval) + Skew_time
//     in seconds: the skew does NOT scale with the interval, so the two
//     versions' arithmetic differs in more than its unit and never mixes.
//
// EXACTNESS. Every timer is a whole number of 256ths of the version's unit
// (centiseconds for VRRPv3, seconds for VRRPv2), held as an integer numerator
// over 256 and printed as an exact decimal (a power-of-two denominator always
// ends): nothing is rounded, because the RFC sets no rounding.
//
// PAGE LANGUAGE. Every sentence the engine writes is an EngineText
// (../engine-text.ts): runLocalisable() returns the reading with them in place
// for the page (pack keys tools.vrrp-timer-calculator.engine.<id>); run() and
// runApi() return plainText() of the same reading for the API and the golden
// vectors. Computed times never sit inside a sentence: the page prints them
// from the reading's own fields in its own number format.
//
// Pure: no clock, no network, no randomness. Parsing uses anchored patterns
// with bounded repetition only (linear, ReDoS-safe); every field is at most
// MAX_FIELD characters, router names at most MAX_NAME.
// ============================================================================

import { say, plainText, withEngineText, listOf, EngineText, type EngineList } from "../engine-text"; // sentences with ids, lists, and the API's English projection

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

/** The two VRRP versions the tool computes: 3 (RFC 9568) and 2 (RFC 3768). */
export type VrrpVersion = 2 | 3; // the versions in the field

/** The two address families (a Virtual Router is one or the other, never both). */
export type AddressFamily = "ipv4" | "ipv6"; // RFC 9568 Abstract

/** The unit a version keeps its timers in. */
export type TimerUnit = "cs" | "s"; // centiseconds (v3) or seconds (v2)

/** The timers-mode request: one router's priority and the interval. */
export interface TimersRequest {
  /** Selects this mode. */
  mode: "timers";
  /** 3 or 2 (a number or its text); 3 when absent. */
  version?: VrrpVersion | string;
  /** The router's priority, 1 to 255. */
  priority: number | string;
  /** The advertisement interval: bare (centiseconds for v3, seconds for v2) or with cs, ms or s; the default when blank. */
  interval?: number | string;
}

/** One router of the election-mode request. */
export interface RouterInput {
  /** Its name (letters, digits, dots, hyphens, underscores); R1, R2 ... when blank. */
  name?: string;
  /** Its priority, 1 to 255 (255 only for the owner); 255 when blank and owner. */
  priority?: number | string;
  /** Its primary address: IPv4, or an IPv6 link-local address. */
  address: string;
  /** Whether it owns the virtual address (true, false, or their text); false when absent. */
  owner?: boolean | string;
}

/** The election-mode request: the routers of one Virtual Router. */
export interface ElectionRequest {
  /** Selects this mode. */
  mode: "election";
  /** 3 or 2; 3 when absent. */
  version?: VrrpVersion | string;
  /** The advertisement interval, the same on every router; the default when blank. */
  interval?: number | string;
  /** Preempt_Mode on every router: true/false, on/off, 1/0; true (the RFC's default) when absent. */
  preempt?: boolean | string;
  /** Two to eight routers. */
  routers: readonly RouterInput[];
}

/** The MAC-mode request: a VRID and a family. */
export interface MacRequest {
  /** Selects this mode. */
  mode: "mac";
  /** 3 or 2; 3 when absent (VRRPv2 has no IPv6 block). */
  version?: VrrpVersion | string;
  /** The Virtual Router Identifier, 1 to 255. */
  vrid: number | string;
  /** "ipv4" or "ipv6"; "ipv4" when absent. */
  family?: AddressFamily | string;
}

/** Any request. */
export type VrrpRequest = TimersRequest | ElectionRequest | MacRequest; // the API body names its mode

/** The RFC names the reading uses for the version computed (so the page and the API print the version's own words). */
export interface TimerNames {
  /** The document whose rules apply: "RFC 9568" or "RFC 3768". */
  rfc: string;
  /** The interval a Backup times with: Active_Adver_Interval (v3) or Advertisement_Interval (v2). */
  interval: string;
  /** The waiting time: Active_Down_Interval (v3) or Master_Down_Interval (v2). */
  down: string;
  /** The timer that waits it: Active_Down_Timer (v3) or Master_Down_Timer (v2). */
  downTimer: string;
  /** The forwarding router: "Active Router" (v3) or "Master" (v2). */
  activeRole: string;
  /** The forwarding state: "Active" (v3) or "Master" (v2). */
  activeState: string;
}

/** The timers of one priority at one interval, as exact decimal text. */
export interface TimerFigures {
  /** Skew_Time in the version's unit. */
  skewTime: string;
  /** Skew_Time in seconds. */
  skewTimeSeconds: string;
  /** Active_Down_Interval (v3) or Master_Down_Interval (v2) in the version's unit. */
  downInterval: string;
  /** The same in seconds. */
  downIntervalSeconds: string;
}

/** The timers-mode reading. S: string for the API, EngineText for the page. */
export interface TimersResult<S = string> extends TimerFigures {
  /** The mode. */
  mode: "timers";
  /** The version computed. */
  version: VrrpVersion;
  /** The version's unit. */
  unit: TimerUnit;
  /** The RFC's names for this version. */
  names: TimerNames;
  /** The priority. */
  priority: number;
  /** Whether the priority is 255, the address owner's. */
  owner: boolean;
  /** The interval in the version's unit (whole number). */
  interval: string;
  /** The interval in seconds. */
  intervalSeconds: string;
  /** Whether the interval is the RFC's default because none was entered. */
  intervalDefault: boolean;
  /** The skew's numerator over 256: (256 - Priority) * interval for v3, 256 - Priority for v2. */
  skewNumerator: string;
  /** The arithmetic as text, with "." as the decimal point (for API readers; the page builds its own). */
  arithmetic: { skew: string; down: string };
  /** When a Backup at this priority takes over; null for the owner, which never waits as a Backup. */
  failover: null | {
    /** After a silent failure: earliest, counted from the failure (the down interval less one interval). */
    silentFrom: string;
    /** The same in seconds. */
    silentFromSeconds: string;
    /** After a silent failure: latest, counted from the failure (the whole down interval). */
    silentTo: string;
    /** The same in seconds. */
    silentToSeconds: string;
    /** After a clean shutdown (an ADVERTISEMENT with priority 0): Skew_Time. */
    shutdown: string;
    /** The same in seconds. */
    shutdownSeconds: string;
  };
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** One router of the election reading, in the order entered. */
export interface RouterRow extends TimerFigures {
  /** Its position as entered, from 0. */
  index: number;
  /** Its name (as entered, or R1, R2 ...). */
  name: string;
  /** Its priority. */
  priority: number;
  /** Its primary address, as entered (trimmed). */
  address: string;
  /** Whether it owns the virtual address. */
  owner: boolean;
  /** Its place in the election order, from 1 (priority first, then the higher address). */
  rank: number;
  /** Its state once the start has settled. */
  startState: "active" | "backup";
}

/** How a step of the election was decided. */
export type ElectionOutcome =
  // Start: the owner is Active at once.
  | "owner-at-start"
  // Start: the highest priority's timer fired first.
  | "elected-at-start"
  // Start: several routers shared the top priority; the highest address stayed Active.
  | "tie-at-start"
  // Silent failure: the best remaining Backup took over when its timer fired.
  | "failover"
  // Silent failure: several shared the best remaining priority; the highest address stayed.
  | "failover-tie"
  // Clean shutdown: the best remaining Backup took over after its Skew_Time.
  | "shutdown-handover"
  // Clean shutdown: several shared the best remaining priority; the highest address stayed.
  | "shutdown-tie"
  // Return: the owner took the role back at once.
  | "owner-preempts"
  // Return: a higher priority with Preempt_Mode on took the role back when its timer fired.
  | "preempts"
  // Return: a higher priority with Preempt_Mode off stayed Backup.
  | "stays-no-preempt"
  // Return: the same priority stayed Backup.
  | "stays-equal";

/** One step of the election: the start, a silent failure, a clean shutdown, or the return. */
export interface ElectionStep<S = string> {
  /** Which event. */
  event: "start" | "failure" | "shutdown" | "return";
  /** The rule that decided it. */
  outcome: ElectionOutcome;
  /** The router that is Active after this step (index). */
  active: number;
  /** Its name. */
  activeName: string;
  /** The router the event concerns (the one that failed, shut down or came back), or null at the start. */
  subject: number | null;
  /** The routers that shared the deciding priority (indices; empty when no tie decided it). */
  tied: number[];
  /** How long the change took, in the version's unit ("0" when immediate, null when nothing changed). */
  after: string | null;
  /** The same in seconds. */
  afterSeconds: string | null;
  /** Silent failure only: the earliest takeover counted from the failure (after less one interval). */
  from: string | null;
  /** The same in seconds. */
  fromSeconds: string | null;
  /** The step in a sentence. */
  text: S;
}

/** The election-mode reading. */
export interface ElectionResult<S = string> {
  /** The mode. */
  mode: "election";
  /** The version computed. */
  version: VrrpVersion;
  /** The version's unit. */
  unit: TimerUnit;
  /** The RFC's names for this version. */
  names: TimerNames;
  /** The address family of the routers. */
  family: AddressFamily;
  /** Preempt_Mode. */
  preempt: boolean;
  /** Whether Preempt_Mode is the RFC's default because none was given. */
  preemptDefault: boolean;
  /** The interval in the version's unit. */
  interval: string;
  /** The interval in seconds. */
  intervalSeconds: string;
  /** Whether the interval is the default. */
  intervalDefault: boolean;
  /** Every router, in the order entered. */
  routers: RouterRow[];
  /** Router indices in election order. */
  ranking: number[];
  /** The router that is Active once the start has settled. */
  active: number;
  /** Why: it owns the address, it has the highest priority, or the address broke a tie. */
  activeReason: "owner" | "priority" | "address-tie";
  /** The start, a silent failure of the Active Router, a clean shutdown of it, and its return. */
  steps: ElectionStep<S>[];
  /** The outcome in a sentence. */
  verdictText: S;
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** The MAC-mode reading. */
export interface MacResult<S = string> {
  /** The mode. */
  mode: "mac";
  /** The version. */
  version: VrrpVersion;
  /** The family. */
  family: AddressFamily;
  /** The VRID. */
  vrid: number;
  /** The VRID as two hexadecimal digits, upper case. */
  vridHex: string;
  /** The family's two-octet block after the OUI: "00-01" (IPv4) or "00-02" (IPv6). */
  block: string;
  /** Hyphens, upper case, as RFC 9568 s7.3 writes it: 00-00-5E-00-01-0A. */
  hyphen: string;
  /** Colons, lower case: 00:00:5e:00:01:0a. */
  colon: string;
  /** Three dotted groups of four, lower case: 0000.5e00.010a. */
  dotted: string;
  /** Where ADVERTISEMENTs are sent: 224.0.0.18 or ff02::12. */
  multicastGroup: string;
  /** The IP protocol (IPv6: Next Header) number of VRRP: 112. */
  ipProtocol: number;
  /** Notes. */
  notes: S[];
}

/** Any reading. */
export type VrrpResult<S = string> = TimersResult<S> | ElectionResult<S> | MacResult<S>; // by mode

/** An input the engine refuses: its message is the English, its sentence travels with it for the page. */
export class VrrpInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "VrrpInputError"; // a readable name in stack traces
  } // constructor
} // VrrpInputError

/**
 * Throw-ready input error carrying its sentence.
 * @param m the sentence
 * @returns the error
 */
function inputError(m: EngineText): VrrpInputError {
  return withEngineText(new VrrpInputError(m), m); // the class, the English message, and the sentence
} // inputError

/** A value a sentence template takes: plain text, a sentence, or a list of names. */
type Arg = string | EngineText | EngineList; // what a {placeholder} holds

/**
 * A value as the English reads it.
 * @param a the value
 * @returns its English text
 */
function argText(a: Arg): string {
  if (typeof a === "string") return a; // plain text
  if (a instanceof EngineText) return a.text; // a sentence
  const l = a; // a list
  return l.items.map((i) => i.text).join(typeof l.sep === "string" ? l.sep : l.sep.text); // joined as the English joins it
} // argText

/**
 * A sentence from an id, an English template with {placeholders} and its values: the English is the template filled,
 * and the page fills the pack's own template with the same values (one id, never fragments).
 * @param id the stable id (the pack key under engine.*)
 * @param tpl the English template, with ICU-style {names}
 * @param args the values
 * @returns the sentence
 */
function sayT(id: string, tpl: string, args: Record<string, Arg>): EngineText {
  return say(id, tpl.replace(/\{(\w+)\}/g, (m: string, k: string) => (k in args ? argText(args[k]) : m)), args); // filled for the API, values kept for the page
} // sayT

/**
 * Router names as one value: "R1", "R1 and R2", "R1, R2 and R3" (the page joins them in its own language).
 * @param names the names, in order
 * @returns the value
 */
function nameList(names: readonly string[]): EngineText {
  const items = names.map((n) => say("name", n, { value: n })); // each name as a pass-through sentence
  if (items.length === 1) return items[0]; // one name
  const head = listOf(items.slice(0, -1), ", "); // all but the last, with commas
  return sayT("list.and", "{head} and {last}", { head, last: items[items.length - 1] }); // and the last
} // nameList

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/** The longest text any field may hold. */
export const MAX_FIELD = 64; // characters
/** The longest router name. */
export const MAX_NAME = 32; // characters
/** The owner's priority (RFC 9568 s5.2.4). */
export const OWNER_PRIORITY = 255; // reserved for the address owner
/** The default Backup priority (RFC 9568 s5.2.4, s6.1). */
export const DEFAULT_PRIORITY = 100; // the RFC's default
/** VRRPv3's default interval in centiseconds (RFC 9568 s5.2.7, s6.1). */
export const V3_DEFAULT_INTERVAL_CS = 100; // one second
/** VRRPv3's largest interval in centiseconds (verified erratum 8301; the 12-bit field of s5.2.7). */
export const V3_MAX_INTERVAL_CS = 4095; // 40.95 seconds
/** VRRPv2's default interval in seconds (RFC 3768 s5.3.7, s6.1). */
export const V2_DEFAULT_INTERVAL_S = 1; // one second
/** VRRPv2's largest interval in seconds (the 8-bit Adver Int field, RFC 3768 s5.1). */
export const V2_MAX_INTERVAL_S = 255; // an 8-bit field
/** The fewest routers an election takes. */
export const MIN_ROUTERS = 2; // one Active, one Backup
/** The most routers the tool reads. */
export const MAX_ROUTERS = 8; // a bound on the form

/** The words of each version. */
const NAMES: Readonly<Record<VrrpVersion, TimerNames>> = Object.freeze({
  3: Object.freeze({ rfc: "RFC 9568", interval: "Active_Adver_Interval", down: "Active_Down_Interval", downTimer: "Active_Down_Timer", activeRole: "Active Router", activeState: "Active" }), // RFC 9568 s6.1, s6.2
  2: Object.freeze({ rfc: "RFC 3768", interval: "Advertisement_Interval", down: "Master_Down_Interval", downTimer: "Master_Down_Timer", activeRole: "Master", activeState: "Master" }), // RFC 3768 s6.1, s6.2
}); // by version

// ----------------------------------------------------------------------------
// Exact timer arithmetic (integers over 256)
// ----------------------------------------------------------------------------

/**
 * A non-negative rational with a power-of-two-and-five denominator as exact decimal text.
 * @param n the numerator (non-negative)
 * @param d the denominator (256 or 25600 here)
 * @returns the decimal, trailing zeros removed, "." as the point
 */
export function exactDecimal(n: bigint, d: bigint): string {
  const whole = n / d; // the integer part
  let rem = n % d; // what is left over
  if (rem === 0n) return whole.toString(); // a whole number
  let digits = ""; // the fraction's digits
  for (let i = 0; i < 24 && rem !== 0n; i++) { // long division, at most 24 places
    rem *= 10n; // next place
    digits += (rem / d).toString(); // its digit
    rem %= d; // carry on
  } // places
  if (rem !== 0n) throw new Error("exactDecimal: the fraction does not end"); // unreachable: 256 and 25600 divide a power of ten
  return `${whole}.${digits}`; // the exact decimal
} // exactDecimal

/** A timer as a whole number of 256ths of the version's unit. */
interface Ticks {
  /** The interval. */
  interval: bigint;
  /** Skew_Time. */
  skew: bigint;
  /** Active_Down_Interval or Master_Down_Interval. */
  down: bigint;
}

/**
 * The timers of a priority at an interval, in 256ths of the version's unit.
 * @param version 3 or 2
 * @param priority 1 to 255
 * @param interval whole centiseconds (v3) or whole seconds (v2)
 * @returns the three quantities
 */
function ticksOf(version: VrrpVersion, priority: number, interval: number): Ticks {
  const p = BigInt(priority); // the priority
  const i = BigInt(interval); // the interval
  const skew = version === 3 ? (256n - p) * i : 256n - p; // RFC 9568: ((256 - P) * I) / 256 cs; RFC 3768: (256 - P) / 256 s
  return { interval: 256n * i, skew, down: 3n * 256n * i + skew }; // (3 * I) + Skew_Time, all over 256
} // ticksOf

/**
 * A tick count in the version's unit.
 * @param t 256ths of the unit
 * @returns the exact decimal
 */
const inUnit = (t: bigint): string => exactDecimal(t, 256n); // over 256

/**
 * A tick count in seconds.
 * @param t 256ths of the unit
 * @param version 3 (centiseconds) or 2 (seconds)
 * @returns the exact decimal in seconds
 */
const inSeconds = (t: bigint, version: VrrpVersion): string => exactDecimal(t, version === 3 ? 25600n : 256n); // cs need another factor of 100

/**
 * The figures of a priority at an interval.
 * @param version 3 or 2
 * @param priority 1 to 255
 * @param interval in the version's unit
 * @returns Skew_Time and the down interval, in the unit and in seconds
 */
function figures(version: VrrpVersion, priority: number, interval: number): TimerFigures {
  const t = ticksOf(version, priority, interval); // exact
  return { skewTime: inUnit(t.skew), skewTimeSeconds: inSeconds(t.skew, version), downInterval: inUnit(t.down), downIntervalSeconds: inSeconds(t.down, version) }; // as text
} // figures

// ----------------------------------------------------------------------------
// Parsing (anchored, bounded patterns; every refusal is a sentence)
// ----------------------------------------------------------------------------

/**
 * Text from an API field that may arrive as a number, bounded in length.
 * @param v the raw value
 * @returns the trimmed text ("" for anything that is neither text nor a number)
 */
function fieldText(v: unknown): string {
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NaN"; // a JSON number as its decimal text
  const s = typeof v === "string" ? v.trim() : ""; // text, trimmed; anything else counts as blank
  if (s.length > MAX_FIELD) throw inputError(say("err.tooLong", "A field is longer than this tool reads (64 characters).")); // bounded before any pattern runs
  return s; // the text
} // fieldText

/**
 * The version.
 * @param v 3, 2, their text, or absent (3)
 * @returns the version
 */
function parseVersion(v: unknown): VrrpVersion {
  const s = v === undefined || v === null || v === "" ? "3" : String(v).trim(); // 3 by default
  if (s === "3") return 3; // RFC 9568
  if (s === "2") return 2; // RFC 3768
  throw inputError(say("err.version", "Choose VRRP version 3 (RFC 9568) or version 2 (RFC 3768, obsoleted by RFC 5798 and now RFC 9568, still found on older equipment).")); // anything else
} // parseVersion

/**
 * A priority.
 * @param raw the text or a JSON number
 * @returns 1 to 255
 */
function parsePriority(raw: unknown): number {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") throw inputError(say("err.priorityEmpty", "Enter the router's priority, a whole number from 1 to 255.")); // nothing typed
  if (!/^\d{1,6}$/.test(s)) throw inputError(say("err.priorityBad", `"${s}" is not a priority: enter a whole number from 1 to 255.`, { value: s })); // not a whole number
  const p = Number(s); // at most six digits: exact
  if (p === 0) throw inputError(say("err.priorityZero", "Priority 0 is never configured: RFC 9568 reserves it for the Active Router to indicate it is relinquishing responsibility for the Virtual Router. The Active Router sends it in its last ADVERTISEMENT when it shuts down, and the Backups then take over after Skew_Time (sections 5.2.4 and 6.1). Enter 1 to 254 for a Backup, or 255 for the address owner.")); // the reserved meaning of 0
  if (p > OWNER_PRIORITY) throw inputError(say("err.priorityRange", `Priority ${s} does not exist: the field is 8 bits, 1 to 254 for routers backing up the Virtual Router and 255 for the address owner (RFC 9568, sections 5.2.4 and 6.1).`, { value: s })); // past the 8-bit field
  return p; // 1 to 255
} // parsePriority

/** An interval: a decimal and an optional unit. Anchored, bounded: linear. */
const INTERVAL_RE = /^(\d{1,6})(?:\.(\d{1,6}))?\s{0,3}(cs|ms|s)?$/i; // e.g. 100, 1 s, 250 ms, 0.5 s

/**
 * The advertisement interval in the version's unit.
 * @param raw the text or a JSON number; blank means the RFC's default
 * @param version 3 (centiseconds) or 2 (whole seconds)
 * @returns the interval and whether it is the default
 */
function parseInterval(raw: unknown, version: VrrpVersion): { value: number; defaulted: boolean } {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") return { value: version === 3 ? V3_DEFAULT_INTERVAL_CS : V2_DEFAULT_INTERVAL_S, defaulted: true }; // the RFC's default
  const m = INTERVAL_RE.exec(s); // number and unit
  if (!m) throw inputError(version === 3 // not an interval: the version's own hint
    ? say("err.intervalBad.v3", `"${s}" is not an advertisement interval: enter whole centiseconds from 1 to 4095, or a time with a unit, such as 100, 1 s or 250 ms.`, { value: s })
    : say("err.intervalBad.v2", `"${s}" is not an advertisement interval: enter whole seconds from 1 to 255, such as 1.`, { value: s }));
  const unit = (m[3] ?? (version === 3 ? "cs" : "s")).toLowerCase(); // a bare number is the version's own unit
  const frac = m[2] ?? ""; // the decimals, possibly none
  const num = BigInt(m[1] + frac); // the digits as one integer
  const den = 10n ** BigInt(frac.length); // over a power of ten
  if (version === 2) { // VRRPv2: whole seconds only
    if (unit !== "s") throw inputError(say("err.v2Unit", `"${s}" is a sub-second unit, and VRRPv2 counts the advertisement interval in whole seconds (RFC 3768, section 5.3.7); centisecond intervals are VRRPv3's (RFC 9568, section 5.2.7). The two versions' arithmetic does not mix: enter whole seconds, or choose VRRPv3.`, { value: s })); // mixed arithmetic
    if (num === 0n) throw inputError(say("err.v2Zero", "The advertisement interval cannot be zero: an ADVERTISEMENT every 0 seconds is no interval. RFC 3768 states no range in words; this tool reads 1 to 255 seconds, the values its 8-bit Adver Int field can carry (sections 5.1 and 5.3.7).")); // no interval
    if (num % den !== 0n) throw inputError(say("err.v2Whole", `"${s}" is not a whole number of seconds: the VRRPv2 Adver Int field carries whole seconds (RFC 3768, sections 5.1 and 5.3.7); for a sub-second interval choose VRRPv3.`, { value: s })); // a fraction of a second
    const sec = num / den; // whole seconds
    if (sec > BigInt(V2_MAX_INTERVAL_S)) throw inputError(say("err.v2Range", `"${s}" is more than the VRRPv2 Adver Int field can carry: it is 8 bits of whole seconds, at most 255 (RFC 3768, section 5.1).`, { value: s })); // past the field
    return { value: Number(sec), defaulted: false }; // seconds
  } // v2
  let n = num; // the numerator in centiseconds
  let d = den; // the denominator
  if (unit === "s") n *= 100n; // seconds to centiseconds
  else if (unit === "ms") d *= 10n; // milliseconds to centiseconds
  if (n === 0n) throw inputError(say("err.intervalZero", "The advertisement interval cannot be zero: verified erratum 8301 to RFC 9568 makes the range 1 to 4095 centiseconds, because a zero interval makes Skew_Time and Active_Down_Interval zero and every Backup times out at once.")); // erratum 8301
  if (n % d !== 0n) throw inputError(say("err.intervalFraction", `"${s}" is not a whole number of centiseconds: VRRPv3 carries the interval as whole centiseconds (RFC 9568, section 5.2.7).`, { value: s })); // a fraction of a centisecond
  const cs = n / d; // whole centiseconds
  if (cs > BigInt(V3_MAX_INTERVAL_CS)) throw inputError(say("err.intervalRange", `"${s}" is longer than VRRPv3 can carry: the interval field is 12 bits of centiseconds, 1 to 4095, at most 40.95 seconds (RFC 9568, section 5.2.7, and verified erratum 8301).`, { value: s })); // past the field
  return { value: Number(cs), defaulted: false }; // centiseconds
} // parseInterval

/**
 * A yes/no field.
 * @param v a boolean, or true/false, on/off, 1/0, yes/no
 * @returns the value, or null when absent
 * @param err the sentence to refuse anything else with
 */
function parseSwitch(v: unknown, err: EngineText): boolean | null {
  if (v === undefined || v === null || v === "") return null; // absent
  if (typeof v === "boolean") return v; // a JSON boolean
  const s = String(v).trim().toLowerCase(); // text
  if (s === "true" || s === "on" || s === "1" || s === "yes") return true; // on
  if (s === "false" || s === "off" || s === "0" || s === "no") return false; // off
  throw inputError(err); // anything else
} // parseSwitch

/** An IPv4 address: four dotted decimals. Anchored, bounded. */
const V4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/; // e.g. 10.1.10.2

/**
 * An IPv4 address as a 32-bit unsigned integer.
 * @param s the text
 * @returns the value, or null when it is not an IPv4 address (an octet over 255 or with a leading zero)
 */
function parseV4(s: string): bigint | null {
  const m = V4_RE.exec(s); // four parts
  if (!m) return null; // not dotted decimal
  let v = 0n; // the value
  for (const part of m.slice(1, 5)) { // each octet
    if (part.length > 1 && part.startsWith("0")) return null; // a leading zero reads as octal in some parsers: refused
    const o = Number(part); // the octet
    if (o > 255) return null; // not an octet
    v = (v << 8n) | BigInt(o); // network byte order
  } // octets
  return v; // 32 bits
} // parseV4

/**
 * An IPv6 address (RFC 4291 s2.2 text forms: eight groups, "::" once, an IPv4 tail) as a 128-bit unsigned integer.
 * @param s the text (no zone, no prefix length)
 * @returns the value, or null when it is not an IPv6 address
 */
function parseV6(s: string): bigint | null {
  if (s.length > 45 || !/^[0-9A-Fa-f:.]{2,45}$/.test(s)) return null; // the longest text form is 45 characters
  const halves = s.split("::"); // the compressed run, at most once
  if (halves.length > 2) return null; // "::" twice
  /** One side of the "::" as 16-bit groups (an IPv4 tail counts as two), or null. */
  const side = (t: string, last: boolean): bigint[] | null => {
    if (t === "") return []; // nothing on this side
    const parts = t.split(":"); // the groups
    const out: bigint[] = []; // the values
    for (let i = 0; i < parts.length; i++) { // each group
      const p = parts[i]; // its text
      if (p.includes(".")) { // an embedded IPv4 address
        if (!last || i !== parts.length - 1) return null; // only as the very last part
        const v4 = parseV4(p); // its value
        if (v4 === null) return null; // not IPv4
        out.push(v4 >> 16n, v4 & 0xffffn); // two groups
      } else { // a hexadecimal group
        if (!/^[0-9A-Fa-f]{1,4}$/.test(p)) return null; // one to four hex digits
        out.push(BigInt(`0x${p}`)); // its value
      } // group
    } // groups
    return out; // the values
  }; // side
  const head = side(halves[0], halves.length === 1); // before "::" (or the whole address)
  const tail = halves.length === 2 ? side(halves[1], true) : []; // after "::"
  if (!head || !tail) return null; // a bad group
  let groups: bigint[]; // the eight groups
  if (halves.length === 1) { // no compression
    if (head.length !== 8) return null; // exactly eight
    groups = head; // as written
  } else { // "::" stands for one or more zero groups
    if (head.length + tail.length > 7) return null; // it must stand for at least one
    groups = [...head, ...Array<bigint>(8 - head.length - tail.length).fill(0n), ...tail]; // filled
  } // forms
  return groups.reduce((acc, g) => (acc << 16n) | g, 0n); // network byte order
} // parseV6

/** A parsed primary address. */
interface Addr {
  /** Its family. */
  family: AddressFamily;
  /** Its value as an unsigned integer in network byte order. */
  value: bigint;
  /** Its text, trimmed. */
  text: string;
}

/**
 * A primary address.
 * @param raw the text
 * @returns the address
 */
function parseAddress(raw: unknown): Addr {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") throw inputError(say("err.addressEmpty", "Enter the router's primary address.")); // nothing typed
  const v4 = parseV4(s); // IPv4?
  if (v4 !== null) return { family: "ipv4", value: v4, text: s }; // IPv4
  const v6 = parseV6(s); // IPv6?
  if (v6 !== null) return { family: "ipv6", value: v6, text: s }; // IPv6
  throw inputError(say("err.addressBad", `"${s}" is not an IPv4 or IPv6 address this tool reads (write it without a prefix length or a zone).`, { value: s })); // neither
} // parseAddress

/** A router name: letters, digits, dots, hyphens and underscores. Anchored, bounded. */
const NAME_RE = /^[\p{L}\p{N}._-]{1,32}$/u; // e.g. SW-CORE-01

/**
 * The VRID.
 * @param raw the text or a JSON number
 * @returns 1 to 255
 */
function parseVrid(raw: unknown): number {
  const s = fieldText(raw); // trimmed and bounded
  if (s === "") throw inputError(say("err.vridEmpty", "Enter the VRID, a whole number from 1 to 255.")); // nothing typed
  if (!/^\d{1,6}$/.test(s)) throw inputError(say("err.vridBad", `"${s}" is not a VRID: enter a whole number from 1 to 255, in decimal.`, { value: s })); // not a decimal
  const v = Number(s); // exact at six digits
  if (v === 0) throw inputError(say("err.vridZero", "VRID 0 does not exist: a Virtual Router Identifier is 1 to 255, with no default (RFC 9568, sections 1.7 and 6.1), so 00-00-5E-00-01-00 is not a VRRP address.")); // no VRID 0
  if (v > 255) throw inputError(say("err.vridRange", `"${s}" is more than a VRID can be: the field is 8 bits, 1 to 255 (RFC 9568, sections 5.1 and 6.1).`, { value: s })); // past the field
  return v; // 1 to 255
} // parseVrid

/**
 * The address family.
 * @param v "ipv4", "ipv6", or absent ("ipv4")
 * @returns the family
 */
function parseFamily(v: unknown): AddressFamily {
  const s = v === undefined || v === null || v === "" ? "ipv4" : String(v).trim().toLowerCase(); // IPv4 by default
  if (s === "ipv4" || s === "ipv6") return s; // one of the two
  throw inputError(say("err.family", "Choose the address family: ipv4 or ipv6.")); // anything else
} // parseFamily

// ----------------------------------------------------------------------------
// Shared sentences
// ----------------------------------------------------------------------------

/**
 * The note on the two versions' names for the same things.
 * @param version 3 or 2
 * @returns the sentence
 */
function termsNote(version: VrrpVersion): EngineText {
  return version === 3 // which document names what
    ? say("note.terms.v3", "RFC 9568 calls the forwarding router the Active Router and the waiting time Active_Down_Interval; RFC 5798, which it obsoletes, and RFC 3768 before it said Master and Master_Down_Interval, as many routers' output still does.")
    : say("note.terms.v2", "RFC 3768 calls the forwarding router the Master and the waiting time Master_Down_Interval; RFC 9568, which obsoletes RFC 5798 and through it RFC 3768, renamed them Active Router and Active_Down_Interval.");
} // termsNote

/**
 * The note on the default interval, when it was used.
 * @param version 3 or 2
 * @returns the sentence
 */
function defaultIntervalNote(version: VrrpVersion): EngineText {
  return version === 3 // the version's default
    ? say("note.defaultInterval.v3", "No interval entered: the default, 100 centiseconds (1 second), is used (RFC 9568, section 6.1).")
    : say("note.defaultInterval.v2", "No interval entered: the default, 1 second, is used (RFC 3768, section 6.1).");
} // defaultIntervalNote

/**
 * How a Backup learns the interval it times with.
 * @param version 3 or 2
 * @returns the sentence
 */
function intervalSourceNote(version: VrrpVersion): EngineText {
  return version === 3 // v3 learns it, v2 must match it
    ? say("note.learned.v3", "A Backup computes its timers from the interval the Active Router advertises (Active_Adver_Interval), which starts as its own Advertisement_Interval (RFC 9568, sections 6.1 and 6.4.2); a receiver SHOULD check that the two match (section 7.1).")
    : say("note.match.v2", "VRRPv2 routers of one VRID must share the interval: a router discards an ADVERTISEMENT whose Adver Int differs from its own (RFC 3768, section 7.1).");
} // intervalSourceNote

/** The sub-second warning of RFC 9568 s2.5 (VRRPv3 intervals under 100 centiseconds). */
const subSecondNote = (): EngineText => say("note.subSecond", 'Sub-second intervals are allowed, but RFC 9568 warns that queueing delay longer than the interval can make a Backup promote itself and fall back, a process that "can repeat many times per second, causing a significant disruption of traffic"; it suggests giving VRRP packets priority on egress queues (section 2.5).'); // RFC 9568 s2.5

// ----------------------------------------------------------------------------
// Timers mode
// ----------------------------------------------------------------------------

/**
 * The timers-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function timersLocalisable(r: TimersRequest): TimersResult<EngineText> {
  const version = parseVersion(r.version); // 3 or 2
  const names = NAMES[version]; // the version's words
  const priority = parsePriority(r.priority); // 1 to 255
  const iv = parseInterval(r.interval, version); // the interval
  const t = ticksOf(version, priority, iv.value); // exact, over 256
  const unit: TimerUnit = version === 3 ? "cs" : "s"; // the version's unit
  const f = figures(version, priority, iv.value); // as text
  const skewNumerator = version === 3 ? (256 - priority) * iv.value : 256 - priority; // over 256
  const owner = priority === OWNER_PRIORITY; // the address owner
  const arithmetic = version === 3 // the formulas with the values, as RFC 9568 s6.1 and RFC 3768 s6.1 write them
    ? { skew: `Skew_Time = ((256 - ${priority}) * ${iv.value}) / 256 = ${skewNumerator} / 256 = ${f.skewTime} cs`, down: `Active_Down_Interval = (3 * ${iv.value}) + ${f.skewTime} = ${f.downInterval} cs` }
    : { skew: `Skew_Time = (256 - ${priority}) / 256 = ${skewNumerator} / 256 = ${f.skewTime} s`, down: `Master_Down_Interval = (3 * ${iv.value}) + ${f.skewTime} = ${f.downInterval} s` };
  const failover = owner ? null : { // a Backup's view; the owner never waits as one
    silentFrom: inUnit(t.down - t.interval), // the failure just before the next ADVERTISEMENT was due
    silentFromSeconds: inSeconds(t.down - t.interval, version), // in seconds
    silentTo: f.downInterval, // the failure just after an ADVERTISEMENT
    silentToSeconds: f.downIntervalSeconds, // in seconds
    shutdown: f.skewTime, // priority 0: Skew_Time
    shutdownSeconds: f.skewTimeSeconds, // in seconds
  }; // failover
  const notes: EngineText[] = []; // in order
  const w = { activeRole: names.activeRole, rfc: names.rfc, down: names.down, downTimer: names.downTimer }; // the version's words
  if (owner) notes.push(sayT("note.owner", "Priority 255 belongs to the address owner, which becomes the {activeRole} at once when it starts and preempts any lower priority whatever Preempt_Mode says ({rfc}, sections 6.1 and 6.4.1). It waits on these timers only if it ever runs as a Backup, which takes a second router claiming 255, and only one SHOULD (RFC 9568, section 8.3.2).", w)); // the owner's case
  else notes.push(sayT("note.failover", "After a silent failure a Backup takes over when its {downTimer} fires, one {down} after the last ADVERTISEMENT it heard, so the takeover comes between one interval less than the {down} and the full {down} after the failure itself, depending on where in the interval the failure falls. After a clean shutdown the {activeRole} sends an ADVERTISEMENT with priority 0 and the Backup takes over after Skew_Time ({rfc}, sections 6.4.2 and 6.4.3). Propagation and processing delays are not included.", w)); // what the two figures mean
  if (version === 2) notes.push(say("note.skew.v2", "In VRRPv2, Skew_Time does not grow with the interval: it is (256 - Priority) / 256 of a second whatever the interval (RFC 3768, section 6.1). In VRRPv3 it is the same fraction of the interval (RFC 9568, section 6.1).")); // the difference beyond the unit
  notes.push(intervalSourceNote(version)); // learned (v3) or matched (v2)
  if (iv.defaulted) notes.push(defaultIntervalNote(version)); // the default was used
  if (version === 3 && iv.value < V3_DEFAULT_INTERVAL_CS) notes.push(subSecondNote()); // RFC 9568 s2.5
  notes.push(say("note.exact", "The RFC sets no rounding: every value here is exact (a whole number of 256ths of the interval's unit), and each implementation keeps its timers at its own resolution.")); // exactness
  notes.push(termsNote(version)); // the names
  return {
    mode: "timers", // the mode
    version, // the version
    unit, // cs or s
    names, // the version's words
    priority, // the priority
    owner, // 255
    interval: String(iv.value), // whole units
    intervalSeconds: inSeconds(t.interval, version), // in seconds
    intervalDefault: iv.defaulted, // the default was used
    ...f, // Skew_Time and the down interval
    skewNumerator: String(skewNumerator), // over 256
    arithmetic, // the formulas with the values
    failover, // a Backup's view
    warnings: [], // none in this mode
    notes, // notes
  }; // the reading
} // timersLocalisable

// ----------------------------------------------------------------------------
// Election mode
// ----------------------------------------------------------------------------

/** A router as the election reads it. */
interface ParsedRouter {
  /** Its position as entered. */
  index: number;
  /** Its name. */
  name: string;
  /** Its priority. */
  priority: number;
  /** Whether it owns the virtual address. */
  owner: boolean;
  /** Its primary address. */
  addr: Addr;
}

/**
 * Run a parse step for one router, so that a refusal names the router.
 * @param label the router's name (or R1, R2 ...)
 * @param fn the step
 * @returns the step's value
 */
function inRouter<T>(label: string, fn: () => T): T {
  try {
    return fn(); // the step
  } catch (e) {
    const m = (e as { engineText?: EngineText }).engineText; // the sentence it carries
    if (e instanceof VrrpInputError && m) throw inputError(say("err.inRouter", `${label}: ${m.text}`, { router: label, message: m })); // named
    throw e; // anything else as it is
  } // caught
} // inRouter

/**
 * The routers, validated.
 * @param raw the request's list
 * @param version the version (v2 refuses IPv6)
 * @returns the routers and their family
 */
function parseRouters(raw: unknown, version: VrrpVersion): { routers: ParsedRouter[]; family: AddressFamily } {
  if (!Array.isArray(raw)) throw inputError(say("err.routersList", "Send the routers as a list of objects, each with a priority and an address.")); // the API shape
  if (raw.length < MIN_ROUTERS || raw.length > MAX_ROUTERS) throw inputError(say("err.routersCount", "Enter from 2 to 8 routers: an election needs at least one Backup.")); // the bounds
  const routers: ParsedRouter[] = []; // the result
  raw.forEach((x: unknown, index: number) => { // each router
    const o = (x !== null && typeof x === "object" ? x : {}) as RouterInput; // an object, or nothing
    const typed = fieldText(o.name); // the name as typed
    const fallback = `R${index + 1}`; // the default name
    const label = typed === "" ? fallback : typed; // what a refusal calls it
    if (typed !== "" && !NAME_RE.test(typed)) throw inputError(say("err.nameBad", `"${typed}" is not a router name this tool reads: use up to 32 letters, digits, dots, hyphens or underscores, without spaces.`, { value: typed })); // the name's form
    const owner = inRouter(label, () => parseSwitch(o.owner, say("err.owner", "Owner is true or false.")) ?? false); // false when absent
    const pText = fieldText(o.priority); // the priority as typed
    const priority = owner && pText === "" ? OWNER_PRIORITY : inRouter(label, () => parsePriority(o.priority)); // an owner without one is 255
    if (owner && priority !== OWNER_PRIORITY) throw inputError(say("err.inRouter", `${label}: The address owner's priority MUST be 255 (RFC 9568, section 5.2.4), not ${priority}.`, { router: label, message: say("err.ownerPriority", `The address owner's priority MUST be 255 (RFC 9568, section 5.2.4), not ${priority}.`, { value: String(priority) }) })); // RFC 9568 s5.2.4
    if (!owner && priority === OWNER_PRIORITY) throw inputError(say("err.inRouter", `${label}: Priority 255 is reserved for the router that owns the virtual address (RFC 9568, section 6.1): mark this router as the owner, or give it 1 to 254.`, { router: label, message: say("err.reserved255", "Priority 255 is reserved for the router that owns the virtual address (RFC 9568, section 6.1): mark this router as the owner, or give it 1 to 254.") })); // RFC 9568 s6.1
    const addr = inRouter(label, () => parseAddress(o.address)); // the primary address
    routers.push({ index, name: label, priority, owner, addr }); // read
  }); // routers
  const names = new Set<string>(); // seen names
  for (const r of routers) { // duplicates
    if (names.has(r.name)) throw inputError(say("err.nameDup", `Two routers are called "${r.name}": give each router its own name.`, { value: r.name })); // ambiguous output
    names.add(r.name); // remember
  } // names
  const family = routers[0].addr.family; // the first router's family
  if (routers.some((r) => r.addr.family !== family)) throw inputError(say("err.familyMix", "The routers' addresses mix IPv4 and IPv6. A Virtual Router is IPv4 or IPv6, never both: the two families are always separate Virtual Router instances (RFC 9568, Abstract).")); // one family
  if (family === "ipv6" && version === 2) throw inputError(say("err.v2Ipv6", 'VRRPv2 is for IPv4 only (RFC 3768, section 1.2: "This protocol is intended for use with IPv4 routers only"); IPv6 needs VRRPv3 (RFC 9568). The two versions do not mix in one calculation: choose VRRPv3, or use IPv4 addresses.')); // mixed versions
  if (family === "ipv6") for (const r of routers) { // the link-local rule
    if (r.addr.value >> 118n !== 0x3fan) throw inputError(say("err.inRouter", `${r.name}: "${r.addr.text}" is not a link-local address. For IPv6 the primary address that breaks a tie is the link-local address ADVERTISEMENTs are sent from (RFC 9568, sections 1.7 and 5.1.2.1), in fe80::/10 (RFC 4291, section 2.5.6).`, { router: r.name, message: say("err.notLinkLocal", `"${r.addr.text}" is not a link-local address. For IPv6 the primary address that breaks a tie is the link-local address ADVERTISEMENTs are sent from (RFC 9568, sections 1.7 and 5.1.2.1), in fe80::/10 (RFC 4291, section 2.5.6).`, { value: r.addr.text }) })); // fe80::/10
  } // ipv6
  for (let i = 0; i < routers.length; i++) for (let j = i + 1; j < routers.length; j++) { // pairs
    if (routers[i].addr.value === routers[j].addr.value) throw inputError(say("err.addressDup", `${routers[i].name} and ${routers[j].name} have the same primary address, ${routers[j].addr.text}: two routers on one LAN cannot share it, and the tie-break needs them to differ.`, { first: routers[i].name, second: routers[j].name, value: routers[j].addr.text })); // one address each
  } // pairs
  const owners = routers.filter((r) => r.owner); // the owners
  if (owners.length > 1) throw inputError(say("err.twoOwners", `${owners[0].name} and ${owners[1].name} both claim to own the virtual address. Only one router SHOULD have priority 255 (RFC 9568, section 8.3.2): as published, an owner discards every ADVERTISEMENT it receives, so two owners both stay Active (section 7.1), and verified erratum 8298 changes that check so that the higher primary address wins. The outcome depends on which text an implementation follows, so the tool does not guess: keep one owner.`, { first: owners[0].name, second: owners[1].name })); // RFC 9568 s7.1, s8.3.2, erratum 8298
  return { routers, family }; // validated
} // parseRouters

/**
 * Election order: priority first, then the higher primary address (RFC 9568 s6.4.3).
 * @param a one router
 * @param b another
 * @returns negative when a ranks before b
 */
const byRank = (a: ParsedRouter, b: ParsedRouter): number => (b.priority - a.priority) || (b.addr.value > a.addr.value ? 1 : b.addr.value < a.addr.value ? -1 : 0); // descending

/**
 * Who among some routers becomes Active when their timers decide: the highest priority, ties to the higher address.
 * @param pool the routers taking part
 * @returns the winner and the routers that shared its priority (empty when it had it alone)
 */
function decide(pool: ParsedRouter[]): { winner: ParsedRouter; tied: ParsedRouter[] } {
  const sorted = [...pool].sort(byRank); // election order
  const winner = sorted[0]; // the first
  const tied = sorted.filter((r) => r.priority === winner.priority); // its priority's routers
  return { winner, tied: tied.length > 1 ? tied : [] }; // a tie only with two or more
} // decide

/**
 * The election-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function electionLocalisable(r: ElectionRequest): ElectionResult<EngineText> {
  const version = parseVersion(r.version); // 3 or 2
  const names = NAMES[version]; // the version's words
  const iv = parseInterval(r.interval, version); // the interval, the same on every router
  const pm = parseSwitch(r.preempt, say("err.preempt", "Preempt_Mode is on or off (true or false).")); // Preempt_Mode, or null
  const preempt = pm ?? true; // the RFC's default: True
  const { routers, family } = parseRouters(r.routers, version); // validated
  const unit: TimerUnit = version === 3 ? "cs" : "s"; // the version's unit
  const tk = (p: number): Ticks => ticksOf(version, p, iv.value); // a priority's timers
  const t0 = tk(DEFAULT_PRIORITY).interval; // the interval in ticks (the same for every priority)
  const names2 = (rs: ParsedRouter[]): EngineText => nameList(rs.map((x) => x.name)); // the routers' names as one value
  /** A sentence with the version's words and the step's values. */
  const s = (id: string, tpl: string, args: Record<string, Arg>): EngineText => sayT(id, tpl, { rfc: names.rfc, activeRole: names.activeRole, activeState: names.activeState, down: names.down, downTimer: names.downTimer, ...args }); // one id, one template
  const at = (t: bigint | null) => (t === null ? { after: null, afterSeconds: null } : { after: inUnit(t), afterSeconds: inSeconds(t, version) }); // a duration as text

  // ---- The start: the owner at once, or the shortest timer. ----
  const owner = routers.find((x) => x.owner) ?? null; // at most one
  const start = owner ? { winner: owner, tied: [] as ParsedRouter[] } : decide(routers); // who is Active once the start settles
  const a = start.winner; // the Active Router
  const steps: ElectionStep<EngineText>[] = []; // the account
  steps.push({
    event: "start", // the start
    outcome: owner ? "owner-at-start" : start.tied.length ? "tie-at-start" : "elected-at-start", // the rule
    active: a.index, // who
    activeName: a.name, // its name
    subject: null, // no subject at the start
    tied: start.tied.map((x) => x.index), // the tie
    ...at(owner ? 0n : tk(a.priority).down), // at once, or one down interval
    from: null, // only failures have a window
    fromSeconds: null, // idem
    text: owner // the sentence
      ? s("step.start.owner", "{name} owns the virtual address (priority 255): it sends an ADVERTISEMENT and becomes the {activeRole} at once, and every other router starts as a Backup ({rfc}, section 6.4.1).", { name: a.name })
      : start.tied.length
        ? s("step.start.tie", "No router owns the virtual address, so every router starts as a Backup. {list} share the highest priority, {p}: their timers fire together and each of them turns {activeState}. One that hears an ADVERTISEMENT of the same priority from a higher primary address returns to Backup, so {name}, with the highest address, stays the {activeRole} ({rfc}, sections 6.4.1 and 6.4.3).", { list: names2(start.tied), p: String(a.priority), name: a.name })
        : s("step.start.elected", "No router owns the virtual address, so every router starts as a Backup with its {downTimer} running. {name} has the highest priority, {p}, and so the shortest {down}: its timer fires first and it becomes the {activeRole}. The others hear its ADVERTISEMENT, of a higher priority than theirs, and stay Backup ({rfc}, sections 6.4.1 and 6.4.2).", { name: a.name, p: String(a.priority) }),
  }); // start

  // ---- The Active Router fails silently, or shuts down cleanly: the best of the rest takes over. ----
  const rest = routers.filter((x) => x !== a); // the Backups
  const next = decide(rest); // who takes over
  const b = next.winner; // the new Active Router
  const tb = tk(b.priority); // its timers
  steps.push({
    event: "failure", // a silent failure
    outcome: next.tied.length ? "failover-tie" : "failover", // the rule
    active: b.index, // who
    activeName: b.name, // its name
    subject: a.index, // the one that failed
    tied: next.tied.map((x) => x.index), // the tie
    ...at(tb.down), // one down interval after the last ADVERTISEMENT heard
    from: inUnit(tb.down - t0), // the earliest, counted from the failure
    fromSeconds: inSeconds(tb.down - t0, version), // in seconds
    text: next.tied.length // the sentence
      ? s("step.failure.tie", "If {active} fails silently, {list} share the highest remaining priority, {p}: their timers fire together, each of them turns {activeState}, and {name}, with the higher primary address, stays the {activeRole} ({rfc}, sections 6.4.2 and 6.4.3).", { active: a.name, list: names2(next.tied), p: String(b.priority), name: b.name })
      : s("step.failure.one", "If {active} fails silently, the Backups stop hearing ADVERTISEMENTs. {name}, with the highest remaining priority, {p}, has the shortest {down}: its {downTimer} fires one {down} after the last ADVERTISEMENT it heard, and it becomes the {activeRole} ({rfc}, section 6.4.2).", { active: a.name, name: b.name, p: String(b.priority) }),
  }); // failure
  steps.push({
    event: "shutdown", // a clean shutdown
    outcome: next.tied.length ? "shutdown-tie" : "shutdown-handover", // the rule
    active: b.index, // who
    activeName: b.name, // its name
    subject: a.index, // the one that shut down
    tied: next.tied.map((x) => x.index), // the tie
    ...at(tb.skew), // Skew_Time after the priority-0 ADVERTISEMENT
    from: null, // a single moment
    fromSeconds: null, // idem
    text: next.tied.length // the sentence
      ? s("step.shutdown.tie", "If {active} shuts down cleanly, it sends an ADVERTISEMENT with priority 0. {list} share the highest remaining priority, {p}, and so the same Skew_Time: each of them turns {activeState} at the same moment, and {name}, with the higher primary address, stays the {activeRole} ({rfc}, sections 6.4.2 and 6.4.3).", { active: a.name, list: names2(next.tied), p: String(b.priority), name: b.name })
      : s("step.shutdown.one", "If {active} shuts down cleanly, it sends an ADVERTISEMENT with priority 0, and every Backup sets its timer to its own Skew_Time. {name}, with the highest remaining priority, {p}, has the shortest skew and becomes the {activeRole} ({rfc}, sections 6.4.2 and 6.4.3).", { active: a.name, name: b.name, p: String(b.priority) }),
  }); // shutdown

  // ---- The first Active Router comes back. ----
  let outcome: ElectionOutcome; // the rule that decides the return
  let text: EngineText; // its sentence
  let backTicks: bigint | null; // how long the change takes, or null when nothing changes
  if (a.owner) { // the owner always preempts
    outcome = "owner-preempts"; // at once
    backTicks = 0n; // immediately (RFC 9568 s6.4.1)
    text = s("step.return.owner", "When {name} comes back, it owns the virtual address: it becomes the {activeRole} at once and {current} returns to Backup, whatever Preempt_Mode says ({rfc}, sections 6.1 and 6.4.1).", { name: a.name, current: b.name }); // the owner's exception
  } else if (a.priority > b.priority && preempt) { // preemption
    outcome = "preempts"; // when its own timer fires
    backTicks = tk(a.priority).down; // one down interval after it starts
    text = s("step.return.preempts", "When {name} comes back, it starts as a Backup. Preempt_Mode is on and its priority, {p}, is higher than {current}'s, {pc}, so it discards {current}'s ADVERTISEMENTs; its own {downTimer} fires one {down} after it starts, it becomes the {activeRole}, and {current}, hearing a higher priority, returns to Backup ({rfc}, sections 6.4.2 and 6.4.3).", { name: a.name, p: String(a.priority), current: b.name, pc: String(b.priority) }); // RFC 9568 s6.4.2, s6.4.3
  } else if (a.priority > b.priority) { // no preemption
    outcome = "stays-no-preempt"; // nothing changes
    backTicks = null; // no change
    text = s("step.return.noPreempt", "When {name} comes back, it starts as a Backup. Its priority, {p}, is higher than {current}'s, {pc}, but Preempt_Mode is off: it resets its timer on every ADVERTISEMENT from {current} and stays Backup, and {current} stays the {activeRole} ({rfc}, section 6.4.2).", { name: a.name, p: String(a.priority), current: b.name, pc: String(b.priority) }); // RFC 9568 s6.4.2
  } else { // the same priority (it cannot be lower: it was first in the election order)
    outcome = "stays-equal"; // nothing changes
    backTicks = null; // no change
    text = s("step.return.equal", "When {name} comes back, it starts as a Backup with the same priority as {current}, {p}. A Backup resets its timer on any ADVERTISEMENT of equal or higher priority, and the primary address breaks a tie only between routers that are already {activeState}, so {name} stays Backup and {current} stays the {activeRole}, with or without preemption ({rfc}, sections 6.4.2 and 6.4.3).", { name: a.name, current: b.name, p: String(a.priority) }); // a tie is not preemption
  } // return cases
  const backActive = outcome === "owner-preempts" || outcome === "preempts" ? a : b; // who is Active afterwards
  const back: ElectionStep<EngineText> = { event: "return", outcome, active: backActive.index, activeName: backActive.name, subject: a.index, tied: [], ...at(backTicks), from: null, fromSeconds: null, text }; // the step, in the same field order as the others
  steps.push(back); // return

  // ---- The table, the verdict, warnings and notes. ----
  const order = [...routers].sort(byRank); // election order
  const rows: RouterRow[] = routers.map((x) => ({
    index: x.index, // as entered
    name: x.name, // its name
    priority: x.priority, // its priority
    address: x.addr.text, // as entered
    owner: x.owner, // the owner
    rank: order.indexOf(x) + 1, // from 1
    startState: x === a ? "active" : "backup", // once the start settles
    ...figures(version, x.priority, iv.value), // its timers
  })); // rows
  const activeReason = owner ? "owner" : start.tied.length ? "address-tie" : "priority"; // why
  const verdictText = owner // the outcome
    ? s("verdict.owner", "{name} is the {activeRole}: it owns the virtual address.", { name: a.name })
    : start.tied.length
      ? s("verdict.tie", "{name} is the {activeRole}: it shares the highest priority, {p}, and has the highest primary address.", { name: a.name, p: String(a.priority) })
      : s("verdict.priority", "{name} is the {activeRole}: it has the highest priority, {p}.", { name: a.name, p: String(a.priority) });
  const warnings: EngineText[] = []; // in order
  const byPriority = new Map<number, ParsedRouter[]>(); // routers per priority
  for (const x of order) byPriority.set(x.priority, [...(byPriority.get(x.priority) ?? []), x]); // grouped, in election order
  for (const [p, group] of byPriority) if (group.length > 1) warnings.push(s("warn.samePriority", '{list} have the same priority, {p}. RFC 9568 asks for different priorities, with "sufficient differences" so that Backups do not turn Active together (section 8.3.2); between them, the primary address decides only once both are Active.', { list: names2(group), p: String(p) })); // RFC 9568 s8.3.2
  const notes: EngineText[] = []; // in order
  notes.push(say("note.model", "The calculation assumes that every router has the same advertisement interval and the same Preempt_Mode, that they start together, and that ADVERTISEMENTs arrive without delay. Tracking, preemption delays and other vendor features are outside the RFC and outside this calculation.")); // the model's limits
  if (pm === null) notes.push(s("note.preemptDefault", "Preempt_Mode was not given: the default, True (on), is used ({rfc}, section 6.1).", {})); // the default
  if (owner && !preempt) notes.push(say("note.ownerPreempts", 'The owner preempts even with Preempt_Mode off: "the router that owns the IPvX address associated with the Virtual Router always preempts, independent of the setting of this flag" (RFC 9568, section 6.1).')); // the owner's exception
  if (start.tied.length || next.tied.length) notes.push(say("note.compare", "A tie between Active Routers goes to the higher primary address, compared as an unsigned integer in network byte order (RFC 9568, section 6.4.3).")); // how addresses compare
  if (family === "ipv6") notes.push(say("note.ipv6Primary", "For IPv6 the primary address is the link-local address ADVERTISEMENTs are sent from (RFC 9568, section 1.7), so it is the one compared in a tie, as an unsigned 128-bit number.")); // IPv6
  notes.push(intervalSourceNote(version)); // learned or matched
  if (iv.defaulted) notes.push(defaultIntervalNote(version)); // the default was used
  if (version === 3 && iv.value < V3_DEFAULT_INTERVAL_CS) notes.push(subSecondNote()); // RFC 9568 s2.5
  notes.push(termsNote(version)); // the names
  return {
    mode: "election", // the mode
    version, // the version
    unit, // cs or s
    names, // the version's words
    family, // IPv4 or IPv6
    preempt, // Preempt_Mode
    preemptDefault: pm === null, // the default was used
    interval: String(iv.value), // whole units
    intervalSeconds: inSeconds(t0, version), // in seconds
    intervalDefault: iv.defaulted, // the default was used
    routers: rows, // the table
    ranking: order.map((x) => x.index), // election order
    active: a.index, // Active once the start settles
    activeReason, // why
    steps, // the account
    verdictText, // the outcome
    warnings, // warnings
    notes, // notes
  }; // the reading
} // electionLocalisable

// ----------------------------------------------------------------------------
// MAC mode
// ----------------------------------------------------------------------------

/**
 * The MAC-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function macLocalisable(r: MacRequest): MacResult<EngineText> {
  const version = parseVersion(r.version); // 3 or 2
  const family = parseFamily(r.family); // IPv4 or IPv6
  if (version === 2 && family === "ipv6") throw inputError(say("err.macV2Ipv6", "VRRPv2 is for IPv4 only (RFC 3768, section 1.2), so it has no IPv6 virtual MAC: the 00-02 block belongs to VRRPv3 (RFC 9568, section 7.3). Choose VRRPv3 for IPv6.")); // mixed versions
  const vrid = parseVrid(r.vrid); // 1 to 255
  const hex = vrid.toString(16).toUpperCase().padStart(2, "0"); // the last octet
  const block = family === "ipv4" ? "01" : "02"; // RFC 9568 s7.3: 00-01 for IPv4, 00-02 for IPv6
  const rfc = version === 3 ? "RFC 9568" : "RFC 3768"; // the document that applies
  const notes: EngineText[] = []; // in order
  notes.push(say("note.mac.layout", `00-00-5E is the IANA's Organizationally Unique Identifier; the next two octets, 00-${block}, are the block assigned to VRRP for ${family === "ipv4" ? "IPv4" : "IPv6"}, and the last octet is the VRID in hexadecimal (${rfc}, section 7.3).`, { block: `00-${block}`, familyName: family === "ipv4" ? "IPv4" : "IPv6", rfc })); // the address's parts
  notes.push(family === "ipv4" // how hosts meet it
    ? say("note.mac.use.ipv4", "The Active Router sends its ADVERTISEMENTs from this address and answers ARP requests for the virtual IPv4 address with it, never with its own physical MAC, so hosts keep the same gateway MAC whichever router is active; after a takeover, switches learn it on the new router's port (RFC 9568, sections 7.2 and 8.1.2).")
    : say("note.mac.use.ipv6", "The Active Router sends its ADVERTISEMENTs from this address and answers Neighbor Solicitations for the virtual IPv6 address with it, never with its own physical MAC, so hosts keep the same gateway MAC whichever router is active; after a takeover, switches learn it on the new router's port (RFC 9568, sections 7.2 and 8.2.2)."));
  notes.push(family === "ipv4" // where ADVERTISEMENTs go
    ? say("note.mac.dest.ipv4", "ADVERTISEMENTs are sent to 224.0.0.18, IP protocol 112, with a TTL of 255 (RFC 9568, section 5.1.1; the same in RFC 3768, section 5.2).")
    : say("note.mac.dest.ipv6", "ADVERTISEMENTs are sent to ff02::12, Next Header 112, with a Hop Limit of 255, from the router's link-local address (RFC 9568, section 5.1.2)."));
  if (version === 2) notes.push(say("note.mac.v2", "VRRPv2 uses the same IPv4 block, 00-00-5E-00-01 followed by the VRID (RFC 3768, section 7.3).")); // v2's MAC
  notes.push(say("note.mac.notations", "The three forms are the same 48 bits written three ways: hyphens, as RFC 9568 writes it; colons; and three dotted groups of four hexadecimal digits.")); // the notations
  return {
    mode: "mac", // the mode
    version, // the version
    family, // the family
    vrid, // the VRID
    vridHex: hex, // two hex digits
    block: `00-${block}`, // the family's block
    hyphen: `00-00-5E-00-${block}-${hex}`, // RFC 9568 s7.3's form
    colon: `00:00:5e:00:${block}:${hex.toLowerCase()}`, // colons
    dotted: `0000.5e00.${block}${hex.toLowerCase()}`, // three groups of four
    multicastGroup: family === "ipv4" ? "224.0.0.18" : "ff02::12", // RFC 9568 s5.1.1.2, s5.1.2.2
    ipProtocol: 112, // RFC 9568 s5.1.1.4, s5.1.2.4
    notes, // notes
  }; // the reading
} // macLocalisable

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The page's entry: any mode, sentences as EngineTexts.
 * @param r the request (its mode picks the computation)
 * @returns the reading
 */
export function runLocalisable(r: VrrpRequest): VrrpResult<EngineText> {
  if (r && typeof r === "object" && r.mode === "timers") return timersLocalisable(r); // timers
  if (r && typeof r === "object" && r.mode === "election") return electionLocalisable(r); // election
  if (r && typeof r === "object" && r.mode === "mac") return macLocalisable(r); // virtual MAC
  throw inputError(say("err.mode", "Choose a mode: timers, election or mac.")); // no mode
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param r the request
 * @returns the reading as the API returns it
 */
export function run(r: VrrpRequest): VrrpResult {
  return plainText(runLocalisable(r)) as VrrpResult; // sentences as their English
} // run

/**
 * The API's entry: the request body as JSON text.
 * @param input the JSON text
 * @returns the reading
 */
export function runApi(input: string): VrrpResult {
  let parsed: unknown; // the body
  try {
    parsed = JSON.parse(input); // the object
  } catch {
    throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode: timers, election or mac.")); // a readable refusal, passed through by the Worker
  } // parsed
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode: timers, election or mac.")); // not an object
  return run(parsed as VrrpRequest); // the same engine as the page
} // runApi
