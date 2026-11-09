// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/ospf-cost-and-adjacency-checker/compute.ts
// ----------------------------------------------------------------------------
// OSPF COST AND ADJACENCY CHECKER - the pure, deterministic engine (08/11/2026,
// written for chapter 4.1 of the open course "LAN Switch Operations and
// Maintenance" and the Learn article ospf-primer).
//
// TWO QUESTIONS, TWO MODES.
//   cost       For one vendor, a reference bandwidth (or its default) and one
//              to eight interface speeds: what cost each interface gets by
//              that vendor's documented rule, which speeds collapse to the
//              same cost, and the smallest reference bandwidth that gives each
//              speed its own cost (vendors with a reference bandwidth only).
//   adjacency  For the two interfaces at the ends of one link: every
//              parameter that does not match, which packet each router drops
//              and under which check of RFC 2328 (OSPFv2) or RFC 5340
//              (OSPFv3), and the neighbour state each side stalls in.
//
// THE RULES, each from a document read on 2026-11-08 (sources in index.ts):
//   - RFC 2328 s8.2 (with verified erratum 3734): the Area ID, the source on
//     the receiving interface's subnet (not on point-to-point links), the
//     AuType of the interface, authentication, locally originated packets;
//     s10.5: Network Mask (ignored on point-to-point links), HelloInterval,
//     RouterDeadInterval and the E-bit, "Any mismatch causes processing to
//     stop and the packet to be dropped"; s10.4: who becomes adjacent; s10.6:
//     the Interface MTU of a Database Description packet, and the two ExStart
//     cases that decide Leader and Follower by Router ID; appendix D.5:
//     simple password and cryptographic verification; appendix C.3: the
//     interface parameters and "must always be greater than 0"; A.4.2: the
//     16-bit metric; s12.4.1.1, s12.4.1.2 and s16.1 step (2)(b): how each
//     network type is described and why a link described differently at its
//     two ends is not used; s6 "The backbone cannot be configured as a stub".
//   - RFC 5340 (OSPFv3) s2.4, s2.6, s4.2.2 and s4.2.2.1: Instance ID with the
//     Area ID, no Network Mask, no subnet check, authentication outside OSPF.
//   - RFC 3101 s2.1 (the N-bit) and s1.3 (the backbone is Type-5 capable);
//     RFC 5709 s3.2 and s3.4 (the Key ID implies the algorithm); RFC 6549 s3.1
//     (OSPFv2 Instance ID); RFC 7166 s4.2, s4.6 and s5 (OSPFv3 Authentication
//     Trailer); RFC 4552 s3 (OSPFv3 over IPsec).
//   - The vendors' cost rules: vendors.ts. Vendor-specific adjacency
//     behaviour (MTU ignore, Huawei's MTU 0 and its timer defaults) is
//     labelled with the vendor's own page.
//
// 2026-11-08b: Huawei VRP, Arista EOS and AOS-CX are reference vendors (their
// pages read in a browser that day); Cisco costs an interface faster than the
// reference at 1 (its auto-cost example); Arista's blank reference means
// "auto-cost reference-bandwidth not configured", every Ethernet interface at
// 10; the "fixed" kind and Huawei's "not read" path are gone.
//
// PAGE LANGUAGE. Every sentence the engine writes is an EngineText
// (../engine-text.ts): runLocalisable() returns the reading with them in place
// for the page (pack keys tools.ospf-cost-and-adjacency-checker.engine.<id>);
// run() and runApi() return plainText() of the same reading.
//
// Pure: no clock, no network, no randomness. Parsing uses anchored patterns
// with bounded repetition only (linear, ReDoS-safe); every field is at most
// MAX_FIELD characters, the speed list at most MAX_LIST.
// ============================================================================

import { say, plainText, withEngineText, listOf, EngineText, type EngineList } from "../engine-text"; // sentences with ids and the API's English projection
import { VENDORS, COMMANDS, type VendorId, type VendorRule, type ReferenceVendor } from "./vendors"; // each vendor's documented cost rule

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/** The longest text one field may hold. */
export const MAX_FIELD = 64; // characters
/** The longest speed list. */
export const MAX_LIST = 200; // characters
/** The fewest interface speeds the cost mode reads. */
export const MIN_LINKS = 1; // one interface
/** The most interface speeds the cost mode reads. */
export const MAX_LINKS = 8; // a bound on the form
/** The slowest interface the tool reads, bits per second (the tool's own bound). */
export const MIN_SPEED_BPS = 1_000n; // 1 kbit/s
/** The fastest interface the tool reads, bits per second (the tool's own bound). */
export const MAX_SPEED_BPS = 10_000_000_000_000n; // 10 Tbit/s
/** The largest cost a router-LSA can carry (RFC 2328 A.4.2: a 16-bit metric). */
export const MAX_COST = 65535; // 0xffff
/** How many candidate references the search examines before it gives up (the tool's own bound). */
export const SEARCH_LIMIT = 200_000; // candidates

// ----------------------------------------------------------------------------
// Public shapes: cost mode
// ----------------------------------------------------------------------------

/** The cost-mode request. */
export interface CostRequest {
  /** Selects this mode. */
  mode: "cost";
  /** The vendor (vendors.ts). */
  vendor: VendorId | string;
  /** The reference bandwidth as typed into the vendor's CLI; blank for the default (on Arista EOS: not configured). */
  reference?: string | number;
  /** One to eight interface speeds with a unit: a list, or one text separated by commas. */
  links: string | readonly string[];
}

/** How one interface's cost was found. */
export type CostBasis =
  | "whole" // the quotient is a whole number
  | "truncated" // the integer part of the quotient (Cisco's examples, Huawei's and Arista's stated rule)
  | "at-or-above" // the interface is at or above the reference: cost 1, documented
  | "fraction-undocumented" // the quotient is not whole and the vendor's pages do not say how it is rounded
  | "below-one-undocumented" // the interface is faster than the reference and the vendor's pages do not say what it costs
  | "above-max" // the quotient passes 65535, which a router-LSA cannot carry; the vendor's pages do not say what happens
  | "not-configured" // Arista EOS without auto-cost reference-bandwidth: every Ethernet interface at its default of 10
  | "table" // a row of the vendor's table
  | "not-in-table" // a speed the vendor's table does not list
  | "unknown"; // the vendor's pages state no default

/** One interface in the cost reading. */
export interface LinkCost<S = string> {
  /** Its position as entered, from 0. */
  index: number;
  /** Its speed as typed. */
  text: string;
  /** Its speed in bits per second (decimal text). */
  bps: string;
  /** Its speed in the largest unit that keeps it exact, e.g. "2.5 Gbit/s". */
  label: string;
  /** reference / speed, exact: a whole number, a finite decimal or a fraction p/q; null without a reference. */
  quotient: string | null;
  /** The cost, or null when the vendor's pages do not let the engine say. */
  cost: number | null;
  /** When the cost is not documented but bounded: the two whole numbers around the quotient. */
  range: [number, number] | null;
  /** How the cost was found. */
  basis: CostBasis;
}

/** The reference bandwidth used. */
export interface ReferenceUsed {
  /** Bits per second (decimal text). */
  bps: string;
  /** In the largest exact unit. */
  label: string;
  /** Whether it is the vendor's default because none was typed. */
  isDefault: boolean;
  /** The vendor's command with this value. */
  command: string;
}

/** The smallest reference that gives every interface its own cost. */
export interface SmallestReference {
  /** Bits per second (decimal text). */
  bps: string;
  /** In the largest exact unit. */
  label: string;
  /** The vendor's command with this value. */
  command: string;
  /** The cost of each interface at that reference, in the order entered. */
  costs: number[];
}

/** The cost-mode reading. */
export interface CostResult<S = string> {
  /** The mode. */
  mode: "cost";
  /** The vendor. */
  vendor: VendorId;
  /** The vendor's name and the documentation release read. */
  vendorLabel: string;
  /** The kind of rule: reference, table or unknown. */
  kind: VendorRule["kind"];
  /** The reference used (reference vendors only; null on Arista EOS while auto-cost reference-bandwidth is not configured). */
  reference: ReferenceUsed | null;
  /** Every interface, in the order entered. */
  links: LinkCost<S>[];
  /** Groups of interfaces (indices) that get the same documented cost. */
  groups: number[][];
  /** Pairs of interfaces whose documented ranges overlap, so they may share a cost. */
  possible: [number, number][];
  /** True when every interface has a documented cost of its own, false when two share one, null when not every cost is documented. */
  allDistinct: boolean | null;
  /** The smallest reference that gives every interface its own documented cost (reference vendors only). */
  smallest: SmallestReference | null;
  /** The command that sets an interface's cost by hand. */
  costCommand: string;
  /** The outcome in a sentence. */
  verdictText: S;
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

// ----------------------------------------------------------------------------
// Public shapes: adjacency mode
// ----------------------------------------------------------------------------

/** The OSPF network types the checker reads (RFC 2328 s1.2 and s9). */
export type NetworkType = "broadcast" | "point-to-point" | "nbma" | "point-to-multipoint"; // the interface types

/** The area types (stub flags in the Options field). */
export type AreaType = "normal" | "stub" | "nssa"; // E-bit set; E-bit clear; N-bit set (E clear)

/** Authentication as each version carries it. */
export type AuthKind =
  | "none" // OSPFv2 AuType 0, or OSPFv3 without authentication
  | "simple" // OSPFv2 AuType 1, simple password
  | "md5" // OSPFv2 AuType 2, Keyed-MD5 (RFC 2328 appendix D.3)
  | "hmac-sha-1" // OSPFv2 AuType 2 (RFC 5709) or the OSPFv3 Authentication Trailer (RFC 7166)
  | "hmac-sha-256" // idem
  | "hmac-sha-384" // idem
  | "hmac-sha-512" // idem
  | "ipsec"; // OSPFv3 over IPsec (RFC 4552)

/** One side of the link, as the request gives it. */
export interface SideInput {
  /** A label for the router (optional; A or B when blank). */
  name?: string;
  /** Its Router ID, dotted decimal (optional). */
  routerId?: string;
  /** The Area ID, dotted decimal or a decimal number. */
  area: string | number;
  /** normal, stub or nssa; normal when absent. */
  areaType?: AreaType | string;
  /** The OSPF network type of the interface. */
  network: NetworkType | string;
  /** OSPFv2 only: the interface address with its prefix length, e.g. 10.0.12.1/30. */
  address?: string;
  /** HelloInterval, seconds. */
  hello: string | number;
  /** RouterDeadInterval, seconds. */
  dead: string | number;
  /** The interface MTU, bytes. */
  mtu: string | number;
  /** Authentication; none when absent. */
  auth?: AuthKind | string;
  /** Key ID (OSPFv2 cryptographic, 0 to 255) or SA ID (OSPFv3 trailer, 0 to 65535). */
  keyId?: string | number;
  /** Router Priority as sent in its Hellos, 0 to 255 (optional). */
  priority?: string | number;
  /** Instance ID, 0 to 255; 0 when absent. */
  instance?: string | number;
}

/** The adjacency-mode request. */
export interface AdjacencyRequest {
  /** Selects this mode. */
  mode: "adjacency";
  /** 2 (RFC 2328) or 3 (RFC 5340); 2 when absent. */
  version?: 2 | 3 | string;
  /** One end of the link. */
  a: SideInput;
  /** The other end. */
  b: SideInput;
  /** Whether the two sides hold the same key (only asked, never the key itself); true when absent. */
  sameKey?: boolean | string;
}

/** Any request. */
export type OspfRequest = CostRequest | AdjacencyRequest; // the API body names its mode

/** Where a side's view of its neighbour stops. */
export type NeighborView =
  | "none" // no neighbour at all: every Hello from the other side is dropped
  | "Init" // the other side's Hellos arrive, but never list this router
  | "2-Way" // both see each other, and they do not try to become adjacent
  | "ExStart" // stuck negotiating the Database Description exchange
  | "Exchange" // stuck exchanging Database Descriptions (the other side rejects them)
  | "ExStart or Exchange" // one of the two, depending on which Router ID is higher (not given)
  | "Full"; // adjacent

/** One side as the reading reports it. */
export interface SideSummary {
  /** Its label. */
  name: string;
  /** Its Router ID, or null when not given. */
  routerId: string | null;
  /** Its Area ID in dotted decimal. */
  area: string;
  /** Its area type. */
  areaType: AreaType;
  /** Its network type. */
  network: NetworkType;
  /** OSPFv2: its address and prefix length; null in OSPFv3. */
  address: string | null;
  /** HelloInterval. */
  hello: number;
  /** RouterDeadInterval. */
  dead: number;
  /** MTU. */
  mtu: number;
  /** Authentication. */
  auth: AuthKind;
  /** Key ID or SA ID, or null. */
  keyId: number | null;
  /** Router Priority, or null when not given. */
  priority: number | null;
  /** Instance ID. */
  instance: number;
}

/** The checks the adjacency mode makes, in the order a router makes them. */
export type CheckId =
  | "own-address" // RFC 2328 s8.2: a packet from its own address is treated as locally originated
  | "area" // s8.2 / RFC 5340 s4.2.2: Area ID
  | "subnet" // s8.2: source on the receiving interface's subnet (not point-to-point)
  | "instance" // RFC 6549 s3.1 / RFC 5340 s4.2.2: Instance ID
  | "auth-type" // s8.2 (erratum 3734) / RFC 7166 s4.6 / RFC 4552 s3: the authentication type
  | "key-id" // appendix D.5.3 (1) / RFC 7166 s4.6: no key with that ID
  | "algorithm" // RFC 5709 s3.4 / RFC 7166: the Key ID implies the algorithm
  | "key" // appendix D.5.2 (2) / D.5.3 (3)(c) / RFC 7166 s4.6 / RFC 4552 s3: the key differs
  | "mask" // s10.5: Network Mask (OSPFv2, not on point-to-point)
  | "hello" // s10.5: HelloInterval
  | "dead" // s10.5: RouterDeadInterval
  | "area-type" // s10.5 E-bit, RFC 3101 s2.1 N-bit
  | "no-dr" // s10.4 with appendix C.3: no router eligible to be Designated Router
  | "router-id" // s10.6: equal Router IDs, so neither ExStart case can match
  | "mtu" // s10.6: the Interface MTU of a Database Description packet
  | "network-type"; // s12.4.1.1, s12.4.1.2, s16.1 (2)(b): the link is described differently at each end

/** One mismatch. */
export interface Finding<S = string> {
  /** The check. */
  check: CheckId;
  /** The packet it concerns: Hello (and every packet), Database Description, or none (routing). */
  stage: "hello" | "database" | "routing";
  /** Whether the routers get as far as this check: false when an earlier mismatch stops them first. */
  reached: boolean;
  /** Whether router A drops what B sends because of it. */
  dropsAtA: boolean;
  /** Whether router B drops what A sends because of it. */
  dropsAtB: boolean;
  /** What happens, with the rule, in a sentence. */
  text: S;
  /** Vendor-specific behaviour, each with its source. */
  vendor: S[];
}

/** The adjacency-mode reading. */
export interface AdjacencyResult<S = string> {
  /** The mode. */
  mode: "adjacency";
  /** 2 or 3. */
  version: 2 | 3;
  /** Router A. */
  a: SideSummary;
  /** Router B. */
  b: SideSummary;
  /** Every mismatch, in the order the routers check them. */
  findings: Finding<S>[];
  /** How far A gets with B. */
  viewA: NeighborView;
  /** How far B gets with A. */
  viewB: NeighborView;
  /** The overall outcome. */
  outcome: "full" | "full-unused" | "stalled" | "none";
  /** The outcome in a sentence. */
  verdictText: S;
  /** Warnings about one side's own settings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** Any reading. */
export type OspfResult<S = string> = CostResult<S> | AdjacencyResult<S>; // by mode

/** An input the engine refuses: its message is the English, its sentence travels with it for the page. */
export class OspfInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "OspfInputError"; // a readable name in stack traces
  } // constructor
} // OspfInputError

/**
 * Throw-ready input error carrying its sentence.
 * @param m the sentence
 * @returns the error
 */
function inputError(m: EngineText): OspfInputError {
  return withEngineText(new OspfInputError(m), m); // the class, the English message, and the sentence
} // inputError

/** A value a sentence template takes. */
type Arg = string | EngineText | EngineList; // what a {placeholder} holds

/**
 * A value as the English reads it.
 * @param a the value
 * @returns its English text
 */
function argText(a: Arg): string {
  if (typeof a === "string") return a; // plain text
  if (a instanceof EngineText) return a.text; // a sentence
  return a.items.map((i) => i.text).join(typeof a.sep === "string" ? a.sep : a.sep.text); // a list, joined as the English joins it
} // argText

/**
 * A sentence from an id, an English template with {placeholders} and its values (one id, never fragments).
 * @param id the stable id (the pack key under engine.*)
 * @param tpl the English template
 * @param args the values
 * @returns the sentence
 */
function sayT(id: string, tpl: string, args: Record<string, Arg>): EngineText {
  return say(id, tpl.replace(/\{(\w+)\}/g, (m: string, k: string) => (k in args ? argText(args[k]) : m)), args); // filled for the API, values kept for the page
} // sayT

/**
 * Names as one value: "A", "A and B", "A, B and C" (the page joins them in its own language).
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
// Exact arithmetic and formatting
// ----------------------------------------------------------------------------

/**
 * The greatest common divisor of two non-negative integers.
 * @param a one
 * @param b the other
 * @returns gcd(a, b)
 */
function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b]; // Euclid
  return a; // the divisor
} // gcd

/**
 * An exact quotient as text: a whole number, a finite decimal, or p/q in lowest terms.
 * @param n the numerator (positive)
 * @param d the denominator (positive)
 * @returns the text, with "." as the point
 */
export function exactQuotient(n: bigint, d: bigint): string {
  const g = gcd(n, d); // common factor
  const p = n / g; // reduced numerator
  let q = d / g; // reduced denominator
  if (q === 1n) return p.toString(); // whole
  let twos = 0; // factors of 2 in q
  let fives = 0; // factors of 5 in q
  while (q % 2n === 0n) { q /= 2n; twos++; } // strip 2s
  while (q % 5n === 0n) { q /= 5n; fives++; } // strip 5s
  if (q !== 1n) return `${p}/${d / g}`; // another prime: the decimal never ends
  const places = Math.max(twos, fives); // a finite decimal needs this many places
  const scaled = (p * 10n ** BigInt(places)) / (d / g); // exact, since the denominator divides 10^places
  const s = scaled.toString().padStart(places + 1, "0"); // at least one digit before the point
  return `${s.slice(0, -places)}.${s.slice(-places)}`.replace(/0+$/, ""); // the decimal, trailing zeros removed
} // exactQuotient

/** The units a speed is printed in, largest first. */
const UNITS: readonly (readonly [bigint, string])[] = [[1_000_000_000_000n, "Tbit/s"], [1_000_000_000n, "Gbit/s"], [1_000_000n, "Mbit/s"], [1_000n, "kbit/s"]]; // powers of ten

/**
 * A bandwidth in the largest unit it reaches, exactly: 2.5 Gbit/s, 1.544 Mbit/s, 9600 bit/s.
 * @param bps bits per second
 * @returns the label
 */
export function bandwidthLabel(bps: bigint): string {
  for (const [u, name] of UNITS) if (bps >= u) return `${exactQuotient(bps, u)} ${name}`; // a power of ten always ends
  return `${bps} bit/s`; // below 1 kbit/s
} // bandwidthLabel

// ----------------------------------------------------------------------------
// Parsing (anchored, bounded patterns; every refusal is a sentence)
// ----------------------------------------------------------------------------

/**
 * Text from an API field that may arrive as a number, bounded in length.
 * @param v the raw value
 * @param max the longest text allowed
 * @returns the trimmed text ("" for anything that is neither text nor a number)
 */
function fieldText(v: unknown, max: number = MAX_FIELD): string {
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NaN"; // a JSON number as its decimal text
  const s = typeof v === "string" ? v.trim() : ""; // text, trimmed; anything else counts as blank
  if (s.length > max) throw inputError(sayT("err.tooLong", "A field is longer than this tool reads ({max} characters).", { max: String(max) })); // bounded before any pattern runs
  return s; // the text
} // fieldText

/** A bandwidth: digits, optional decimals, an optional unit. Anchored, bounded: linear. */
const BANDWIDTH_RE = /^(\d{1,15})(?:\.(\d{1,12}))?\s{0,2}(?:([kmgt])(?:bit\/s|bps|b\/s|bits?)?|(bit\/s|bps|b\/s|bits?))?$/i; // 10G, 2.5 Gbit/s, 1544k, 9600 bps, 100000

/** The multiplier of each unit letter. */
const MULT: Readonly<Record<string, bigint>> = Object.freeze({ k: 1_000n, m: 1_000_000n, g: 1_000_000_000n, t: 1_000_000_000_000n }); // decimal prefixes

/**
 * A bandwidth in bits per second.
 * @param s the text (trimmed, bounded)
 * @param bare what a number without a unit means: "mbps", "bps", or null (a unit is required)
 * @returns bits per second, or null when it is not a bandwidth
 */
function parseBandwidth(s: string, bare: "mbps" | "bps" | null): { bps: bigint; whole: boolean } | null {
  const m = BANDWIDTH_RE.exec(s); // number and unit
  if (!m) return null; // not a bandwidth
  const letter = m[3]?.toLowerCase(); // k, m, g or t
  const plainBits = m[4] !== undefined; // "bps" or "bit/s" without a prefix
  if (!letter && !plainBits && bare === null) return null; // a unit is required here
  const mult = letter ? MULT[letter] : plainBits ? 1n : bare === "mbps" ? 1_000_000n : 1n; // the unit's size
  const frac = m[2] ?? ""; // the decimals
  const num = BigInt(m[1] + frac) * mult; // scaled
  const den = 10n ** BigInt(frac.length); // over a power of ten
  return { bps: num / den, whole: num % den === 0n }; // bits per second, and whether it is a whole number of them
} // parseBandwidth

/**
 * The vendor.
 * @param v the raw value
 * @returns the vendor id
 */
function parseVendor(v: unknown): VendorId {
  const s = fieldText(v).toLowerCase(); // as typed
  if (s in VENDORS) return s as VendorId; // known
  throw inputError(say("err.vendor", "Choose a vendor: cisco-ios-xe, juniper-junos, arista-eos, aruba-aos-cx, extreme-switch-engine, extreme-fabric-engine, huawei-vrp, mikrotik-routeros or frr.")); // anything else
} // parseVendor

/**
 * The interface speeds.
 * @param raw a list, or one text separated by commas, semicolons or new lines
 * @returns the speeds, with the text as typed
 */
function parseLinks(raw: unknown): { text: string; bps: bigint }[] {
  let parts: string[]; // the speeds as typed
  if (Array.isArray(raw)) { // a JSON list
    if (raw.length > MAX_LINKS) throw inputError(say("err.linksCount", "Enter from 1 to 8 interface speeds.")); // bounded before reading
    parts = raw.map((x: unknown) => fieldText(x)); // each, bounded
  } else { // one text
    const s = fieldText(raw, MAX_LIST); // bounded
    parts = s.split(/[,;\n]/).map((x) => x.trim()); // split on the separators
  } // forms
  parts = parts.filter((x) => x !== ""); // blanks dropped
  if (parts.length < MIN_LINKS || parts.length > MAX_LINKS) throw inputError(say("err.linksCount", "Enter from 1 to 8 interface speeds.")); // the bounds
  const out: { text: string; bps: bigint }[] = []; // the result
  for (const p of parts) { // each speed
    const b = parseBandwidth(p, null); // a unit is required
    if (!b) throw inputError(sayT("err.speedBad", "\"{value}\" is not an interface speed this tool reads: write a number and a unit, such as 100M, 1G, 2.5G, 10 Gbit/s or 1544k.", { value: p })); // not a speed
    if (!b.whole) throw inputError(sayT("err.speedFraction", "\"{value}\" is not a whole number of bits per second.", { value: p })); // a fraction of a bit
    if (b.bps < MIN_SPEED_BPS || b.bps > MAX_SPEED_BPS) throw inputError(sayT("err.speedRange", "\"{value}\" is outside what this tool reads: 1 kbit/s to 10 Tbit/s.", { value: p })); // the tool's bounds
    if (out.some((o) => o.bps === b.bps)) throw inputError(sayT("err.speedDup", "{value} appears twice: the same speed always gets the same cost, so enter each speed once.", { value: bandwidthLabel(b.bps) })); // one row per speed
    out.push({ text: p, bps: b.bps }); // read
  } // speeds
  return out; // in the order typed
} // parseLinks

/**
 * The reference bandwidth for a vendor that uses one.
 * @param raw the text or a JSON number; blank for the default
 * @param v the vendor's rule
 * @returns bits per second and whether it is the default
 */
function parseReference(raw: unknown, v: ReferenceVendor): { bps: bigint; isDefault: boolean } {
  const s = fieldText(raw); // bounded
  if (s === "") return { bps: v.defaultBps, isDefault: true }; // the vendor's default
  const b = parseBandwidth(s, v.bareUnit); // a bare number is the CLI's own unit
  const unitWord = v.bareUnit === "mbps" ? "whole Mbit/s" : "bits per second"; // for the message
  if (!b) throw inputError(sayT("err.referenceBad", "\"{value}\" is not a reference bandwidth: type it as {vendor} takes it (a bare number is {unit}), or with a unit, such as 10G.", { value: s, vendor: v.label, unit: unitWord })); // not a bandwidth
  if (!b.whole || b.bps % v.gridBps !== 0n) throw inputError(sayT("err.referenceGrid", "\"{value}\" is not a value {vendor} accepts: its reference bandwidth is set in {unit}.", { value: s, vendor: v.label, unit: unitWord })); // off the CLI's grid
  const inCli = (x: bigint): string => (v.bareUnit === "mbps" ? (x / 1_000_000n).toString() : x.toString()); // a value as the CLI takes it
  if (b.bps < v.minBps || b.bps > v.maxBps) throw inputError(sayT("err.referenceRange", "\"{value}\" is outside the range {vendor} documents: {min} to {max} {unit}.", { value: s, vendor: v.label, min: inCli(v.minBps), max: inCli(v.maxBps), unit: v.bareUnit === "mbps" ? "Mbit/s" : "bits per second" })); // the vendor's range, in its CLI unit
  return { bps: b.bps, isDefault: false }; // typed
} // parseReference

// ----------------------------------------------------------------------------
// Cost mode
// ----------------------------------------------------------------------------

/** One interface's cost under a vendor's reference rule. */
interface RefCost {
  /** The cost, or null. */
  cost: number | null;
  /** The two whole numbers around an undocumented fraction, or null. */
  range: [number, number] | null;
  /** How it was found. */
  basis: CostBasis;
}

/**
 * The cost of one interface at one reference, by the vendor's documented rule.
 * @param v the vendor's rule
 * @param ref the reference, bits per second
 * @param bps the interface, bits per second
 * @returns the cost, or why there is none
 */
export function referenceCost(v: ReferenceVendor, ref: bigint, bps: bigint): RefCost {
  const whole = ref / bps; // the integer part of the quotient
  const exact = ref % bps === 0n; // whether the quotient is whole
  if (ref <= bps) { // the interface is at or above the reference: quotient 1 or less
    if (ref === bps) return { cost: 1, range: null, basis: "whole" }; // exactly 1
    if (v.atOrAbove === "one") return { cost: 1, range: null, basis: "at-or-above" }; // documented: 1
    return { cost: null, range: null, basis: "below-one-undocumented" }; // the formula gives less than 1 and the pages do not say
  } // at or above
  if (exact) { // a whole quotient above 1
    if (whole > BigInt(MAX_COST)) return { cost: null, range: null, basis: "above-max" }; // past the 16-bit metric
    return { cost: Number(whole), range: null, basis: "whole" }; // exact
  } // whole
  if (v.fraction === "truncate") { // Cisco: the integer part
    if (whole > BigInt(MAX_COST)) return { cost: null, range: null, basis: "above-max" }; // past the 16-bit metric
    return { cost: Number(whole), range: null, basis: "truncated" }; // truncated
  } // truncate
  if (whole + 1n > BigInt(MAX_COST)) return { cost: null, range: null, basis: "above-max" }; // even the lower neighbour is out of range
  return { cost: null, range: [Number(whole), Number(whole) + 1], basis: "fraction-undocumented" }; // between two whole numbers, rounding not documented
} // referenceCost

/**
 * Whether a set of costs is fully documented and pairwise different.
 * @param cs the costs (null when not documented)
 * @returns true when every cost is a number and no two are equal
 */
function allDifferent(cs: readonly RefCost[]): boolean {
  const seen = new Set<number>(); // costs met
  for (const c of cs) { // each interface
    if (c.cost === null) return false; // not documented
    if (seen.has(c.cost)) return false; // shared
    seen.add(c.cost); // remember
  } // interfaces
  return true; // all different
} // allDifferent

/**
 * The smallest reference on the vendor's grid at which every interface has a documented cost of its own. Costs change
 * only where the reference crosses a whole multiple of an interface speed, so the candidates are those multiples
 * (rounded up to the grid) and the vendor's minimum, examined in increasing order from a lower bound: with n
 * interfaces sorted fastest first, the r-th needs a cost of at least r, so a reference of at least r times its speed.
 * @param v the vendor's rule
 * @param speeds the interface speeds, bits per second
 * @returns the reference and the costs, or null with the reason
 */
export function smallestReference(v: ReferenceVendor, speeds: readonly bigint[]): { bps: bigint; costs: number[] } | { reason: "range" | "limit" } {
  const sorted = [...speeds].sort((x, y) => (x > y ? -1 : x < y ? 1 : 0)); // fastest first
  let lower = v.minBps; // the vendor's floor
  sorted.forEach((b, i) => { // each interface by rank
    const need = BigInt(i + 1) * b; // the r-th fastest needs a quotient of at least r
    if ((i > 0 || v.atOrAbove === "undocumented") && need > lower) lower = need; // the fastest may sit at or above the reference when that costs 1
  }); // ranks
  const up = (x: bigint): bigint => ((x + v.gridBps - 1n) / v.gridBps) * v.gridBps; // round up to the grid
  let candidate = up(lower); // the first candidate is the bound itself, on the grid
  for (let n = 0; n < SEARCH_LIMIT; n++) { // bounded search
    if (candidate > v.maxBps) return { reason: "range" }; // past the vendor's range
    const cs = speeds.map((b) => referenceCost(v, candidate, b)); // the costs there
    if (allDifferent(cs)) return { bps: candidate, costs: cs.map((c) => c.cost as number) }; // found
    if (cs.some((c) => c.basis === "above-max")) return { reason: "range" }; // costs only grow from here: the slowest is past 65535
    let best = -1n; // the next candidate, none yet
    for (const b of speeds) { // each speed's next whole multiple above the candidate
      const g = up((candidate / b + 1n) * b); // the multiple, on the grid
      if (best < 0n || g < best) best = g; // the smallest
    } // speeds
    candidate = best; // move on (strictly larger: each multiple is above the candidate)
  } // search
  return { reason: "limit" }; // not found within the bound
} // smallestReference

/**
 * The vendor's command with a reference value.
 * @param v the vendor's rule
 * @param bps the reference, bits per second
 * @returns the command line
 */
function referenceCommand(v: ReferenceVendor, bps: bigint): string {
  if (v.bareUnit === "bps") return `${v.referenceStem} ${bps % 1_000_000_000n === 0n ? `${bps / 1_000_000_000n}g` : bps.toString()}`; // Junos: bits, or whole gigabits as the user guide writes 10g
  return `${v.referenceStem} ${bps / 1_000_000n}`; // the others: whole Mbit/s after the vendor's own command
} // referenceCommand

/**
 * The notes and warnings that belong to one vendor's rule (each from that vendor's own pages).
 * @param v the vendor's rule
 * @param unset whether the reference command is not configured (Arista EOS with a blank reference)
 * @param n how many interfaces were entered
 * @returns the notes and the warnings, in order
 */
function vendorTexts(v: ReferenceVendor, unset: boolean, n: number): { notes: EngineText[]; warnings: EngineText[] } {
  const notes: EngineText[] = []; // in order
  const warnings: EngineText[] = []; // in order
  if (v.id === "cisco-ios-xe") { // Cisco IOS XE: truncation from its examples, 1 above the reference from its auto-cost example
    notes.push(say("note.truncate.cisco", "Cisco's own examples keep the integer part of the quotient: a 64 kbit/s link gets 1562 (100,000,000 / 64,000 = 1562.5) and a T1 at 1544 kbit/s gets 64 (64.77), so the tool truncates.")); // Cisco's examples
    notes.push(say("note.atOrAbove.cisco", "An interface at or above the reference costs 1 on Cisco: the auto-cost example \"changes the cost of the FDDI link to 10, while the gigabit Ethernet link remains at a cost of 1\" at a reference of 1000, so a gigabit link, ten times faster than the default reference of 100 Mbit/s, costs 1 there too; the ip ospf cost list gives \"ATM-- Default cost is 1\", and RFC 2328 forbids 0 (appendix C.3).")); // Cisco IOS IP Routing: OSPF Command Reference, auto-cost and ip ospf cost
  } else if (v.id === "huawei-vrp") { // Huawei VRP: the rule as its two pages state it
    notes.push(say("note.huawei.rule", "Huawei's ospf cost and bandwidth-reference pages give the rule: \"Cost of the interface = Bandwidth reference value/Interface bandwidth. The integer of the calculated result is the cost of the interface. If the calculated result is smaller than 1, the cost is 1.\" The reference is set per OSPF process with bandwidth-reference, 1 to 2147483648 Mbit/s, default 100 Mbit/s; ospf cost sets 1 to 65535 by hand, and a loopback interface defaults to 0.")); // ospf cost, bandwidth-reference (OSPF)
    notes.push(say("note.huawei.trunk", "Eth-Trunk interfaces, as Huawei's two pages write it: ospf cost says \"No default cost is configured for trunk interfaces, because a trunk interface has multiple member interfaces that are in constant change\", and bandwidth-reference says that when it runs on an Eth-Trunk interface, \"the bandwidth of the Eth-Trunk interface is equal to the total bandwidth of all its member interfaces\". The tool reads each speed as one interface.")); // both statements, as written
  } else if (v.id === "arista-eos") { // Arista EOS: 10 until the command is set, then the formula
    notes.push(unset // which state the reference is in
      ? say("note.arista.unset", "auto-cost reference-bandwidth is not configured: \"When this parameter is not set, the default cost for Ethernet interfaces is the default ip ospf cost value of 10\", so every Ethernet interface costs 10 whatever its speed. Type a rate (1 to 4294967, whole Mbit/s) in the reference field to see the costs once the command is set.") // the sentence when the condition holds
      : say("note.arista.rule", "With auto-cost reference-bandwidth configured, EOS computes \"ospfv2-cost = (auto-cost value * 1 Mbps) / interface bandwidth\"; \"The switch uses a minimum ospfv2-cost of 1. The switch rounds down all non-integer results.\" Its own example: a 10 Gbit/s interface costs 1 at a rate of 100 and 5 at 59000.")); // otherwise this sentence
    notes.push(say("note.arista.interfaces", "The formula is documented for Ethernet interfaces only: the ip ospf cost page gives port channel and VLAN interfaces a default of 10.")); // ip ospf cost: Port channel 10, VLAN 10
    if (unset && n > 1) warnings.push(sayT("warn.unset", "With every Ethernet interface at 10, OSPF counts hops: a path through {count} interfaces of any speed costs the same as {count} of any other. Configure auto-cost reference-bandwidth, or set ip ospf cost on each interface, to make speed count.", { count: String(n) })); // hop count
  } else if (v.id === "aruba-aos-cx") { // AOS-CX: two pages that disagree
    warnings.push(say("warn.aruba.disagree", "The AOS-CX 10.16 pages disagree. reference-bandwidth says that \"If the OSPFv2 interface cost is not explicitly set, then the cost of all the OSPFv2 interfaces is recalculated based on the reference bandwidth and link speed of the interface\", default 100000 Mbps; the ip ospf cost page says \"Default: 1\". The tool computes the reference-bandwidth reading, and neither page states rounding or a minimum: check the cost the switch shows before relying on either.")); // both pages, as written
    notes.push(say("note.aruba.vlan", "\"For VLAN interfaces the link speed value is taken as 1 Gbps (if the OSPFv2 interface cost is not explicitly set)\": enter 1G for a VLAN interface.")); // reference-bandwidth
  } else { // Junos and FRRouting: 1 at or above the reference
    notes.push(sayT("note.atOrAbove.one", "{vendor} documents a cost of 1 for an interface at or above the reference bandwidth.", { vendor: v.label })); // documented minimum
  } // vendors
  return { notes, warnings }; // the vendor's own texts
} // vendorTexts

/**
 * The cost-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function costLocalisable(r: CostRequest): CostResult<EngineText> {
  const vendor = parseVendor(r.vendor); // the vendor
  const rule = VENDORS[vendor]; // its documented rule
  const links = parseLinks(r.links); // the speeds
  const refText = fieldText(r.reference); // the reference as typed
  if (rule.kind !== "reference" && refText !== "") throw inputError(sayT("err.noReference", "{vendor} has no reference bandwidth in the documentation read, so there is nothing to set: leave the reference blank.", { vendor: rule.label })); // a reference where none exists
  const warnings: EngineText[] = []; // in order
  const notes: EngineText[] = []; // in order
  const label = (i: number): string => bandwidthLabel(links[i].bps); // an interface's name in sentences
  let reference: ReferenceUsed | null = null; // reference vendors only
  let rows: LinkCost<EngineText>[]; // the interfaces
  let smallest: SmallestReference | null = null; // reference vendors only

  if (rule.kind === "reference") { // cost = reference / bandwidth
    const unset = rule.unsetCost !== null && refText === ""; // Arista EOS with no reference typed: the command is not configured
    if (unset) { // every Ethernet interface at the vendor's default while the command is absent
      rows = links.map((l, index) => ({ index, text: l.text, bps: l.bps.toString(), label: bandwidthLabel(l.bps), quotient: null, cost: rule.unsetCost, range: null, basis: "not-configured" as const })); // each interface
    } else { // a reference applies: typed, or the vendor's default
      const ref = parseReference(r.reference, rule); // typed or default
      reference = { bps: ref.bps.toString(), label: bandwidthLabel(ref.bps), isDefault: ref.isDefault, command: referenceCommand(rule, ref.bps) }; // the reference used
      rows = links.map((l, index) => { const c = referenceCost(rule, ref.bps, l.bps); return { index, text: l.text, bps: l.bps.toString(), label: bandwidthLabel(l.bps), quotient: exactQuotient(ref.bps, l.bps), cost: c.cost, range: c.range, basis: c.basis }; }); // each interface
    } // configured or not
    const found = links.length > 1 ? smallestReference(rule, links.map((l) => l.bps)) : null; // the search, for two or more speeds (on Arista: the value to configure)
    if (found && "bps" in found) smallest = { bps: found.bps.toString(), label: bandwidthLabel(found.bps), command: referenceCommand(rule, found.bps), costs: found.costs }; // found
    else if (found) notes.push(found.reason === "range" // why not
      ? sayT("note.smallest.range", "No reference bandwidth within {vendor}'s documented range gives every interface its own documented cost below 65,536.", { vendor: rule.label }) // the sentence when the condition holds
      : say("note.smallest.limit", "The search for a reference that gives every interface its own cost stopped after 200,000 candidates without one; speeds this close together need a reference far above the fastest.")); // the tool's bound
    if (!unset) notes.push(sayT("note.formula", "{vendor} computes cost = reference bandwidth / interface bandwidth, with a default reference of {def}; a cost set on the interface by hand overrides it.", { vendor: rule.label, def: bandwidthLabel(rule.defaultBps) })); // the formula
    const own = vendorTexts(rule, unset, links.length); // the vendor's own notes and warnings
    notes.push(...own.notes); // its notes
    warnings.push(...own.warnings); // its warnings
    if (rows.some((x) => x.basis === "below-one-undocumented")) warnings.push(sayT("warn.belowOne", "{list}: faster than the reference, so the formula gives less than 1. RFC 2328 requires a cost greater than 0 (appendix C.3), and the {vendor} pages read do not say what such an interface costs, so the tool does not guess: raise the reference to at least the fastest speed, or set the cost by hand.", { list: nameList(rows.filter((x) => x.basis === "below-one-undocumented").map((x) => x.label)), vendor: rule.label })); // undocumented
    if (rows.some((x) => x.basis === "fraction-undocumented")) warnings.push(sayT("warn.fraction", "{list}: the quotient is not a whole number, and the {vendor} pages read do not say how it is rounded, so the tool gives the two whole numbers around it instead of a cost.", { list: nameList(rows.filter((x) => x.basis === "fraction-undocumented").map((x) => x.label)), vendor: rule.label })); // undocumented rounding
    if (rows.some((x) => x.basis === "above-max")) warnings.push(sayT("warn.aboveMax", "{list}: the quotient is above 65,535, the largest cost a router-LSA can carry (RFC 2328 appendix A.4.2: a 16-bit metric); the {vendor} pages read do not say what is advertised then.", { list: nameList(rows.filter((x) => x.basis === "above-max").map((x) => x.label)), vendor: rule.label })); // past the field
    notes.push(rule.mustMatch // consistency across routers
      ? say("note.mustMatch.frr", "FRRouting's documentation says the reference bandwidth \"MUST be consistent across all routers within the OSPF domain\".") // the sentence when the condition holds
      : sayT("note.mustMatch.other", "The {vendor} pages read do not say that the reference bandwidth must match on every router; FRRouting's documentation says it \"MUST be consistent across all routers within the OSPF domain\", because each router advertises its own interface costs and every router adds them up as one scale.", { vendor: rule.label })); // why it matters
  } else if (rule.kind === "table") { // a per-speed table
    rows = links.map((l, index) => { const hit = rule.table.find(([b]) => b === l.bps); return { index, text: l.text, bps: l.bps.toString(), label: bandwidthLabel(l.bps), quotient: null, cost: hit ? hit[1] : null, range: null, basis: hit ? "table" : "not-in-table" }; }); // each interface
    notes.push(rule.id === "extreme-switch-engine" // which table
      ? say("note.table.switchEngine", "Switch Engine does not divide a reference by the speed: \"automatic\", the default, takes the cost from the OSPF metric table (10 Mbit/s 10, 100 Mbit/s 5, 1 Gbit/s 4, 2.5 and 5 Gbit/s 3, 10, 25, 40 and 50 Gbit/s 2, 100 Gbit/s 1), which configure ospf metric-table changes.") // the sentence when the condition holds
      : say("note.table.fabricEngine", "Fabric Engine does not divide a reference by the speed: ip ospf default-cost sets one default per Ethernet speed (10 Mbit/s 100, 100 Mbit/s 10, and 1 for 1, 10, 25, 40 and 100 Gbit/s), and a VLAN interface defaults to 1.")); // the table
    if (rows.some((x) => x.basis === "not-in-table")) warnings.push(sayT("warn.notInTable", "{list}: not a speed the {vendor} table lists, so the pages read give no default cost for it.", { list: nameList(rows.filter((x) => x.basis === "not-in-table").map((x) => x.label)), vendor: rule.label })); // outside the table
  } else { // not computed: the pages read state no default
    rows = links.map((l, index) => ({ index, text: l.text, bps: l.bps.toString(), label: bandwidthLabel(l.bps), quotient: null, cost: null, range: null, basis: "unknown" as const })); // each interface
    warnings.push(sayT("warn.noDefault", "{vendor}: the interface-template page lists cost as \"Interface cost expressed as link state metric\" with no default and no reference bandwidth, and the other OSPF pages read state none, so the tool computes no cost.", { vendor: rule.label })); // why not
  } // kinds

  // ---- Which interfaces share a cost, or may. ----
  const byCost = new Map<number, number[]>(); // documented cost -> interfaces
  for (const x of rows) if (x.cost !== null) byCost.set(x.cost, [...(byCost.get(x.cost) ?? []), x.index]); // grouped
  const groups = [...byCost.values()].filter((g) => g.length > 1); // shared costs
  const possible: [number, number][] = []; // overlapping ranges
  const span = (x: LinkCost<EngineText>): [number, number] | null => (x.cost !== null ? [x.cost, x.cost] : x.range); // a cost as an interval
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) { // pairs
    const a = span(rows[i]); // one
    const b = span(rows[j]); // the other
    if (!a || !b || (rows[i].cost !== null && rows[j].cost !== null)) continue; // unknown, or both documented (already grouped or different)
    if (a[0] <= b[1] && b[0] <= a[1]) possible.push([i, j]); // the intervals overlap
  } // pairs
  const documented = rows.every((x) => x.cost !== null); // every cost known
  const allDistinct = documented ? groups.length === 0 : groups.length > 0 ? false : null; // the answer, or not known
  for (const g of groups) warnings.push(sayT("warn.shared", "{list} all cost {cost}: OSPF sees them as equal and cannot prefer the faster one.", { list: nameList(g.map(label)), cost: String(rows[g[0]].cost) })); // collapse
  for (const [i, j] of possible) warnings.push(sayT("warn.possible", "{first} and {second} may share a cost: their possible costs overlap and the rounding is not documented.", { first: label(i), second: label(j) })); // may collapse
  const n = String(rows.length); // how many
  const verdictText = rows.length === 1 // the outcome
    ? (rows[0].cost !== null ? sayT("verdict.one", "{speed} costs {cost}.", { speed: label(0), cost: String(rows[0].cost) }) : sayT("verdict.oneUnknown", "The cost of {speed} is not documented for {vendor}.", { speed: label(0), vendor: rule.label })) // the sentence when the condition holds
    : allDistinct === true // the next case
      ? sayT("verdict.distinct", "Every one of the {n} interfaces gets its own cost, so OSPF can tell each speed from the others.", { n }) // the sentence when the condition holds
      : allDistinct === false // the next case
        ? sayT("verdict.shared", "Some of the {n} interfaces share a cost, so OSPF cannot tell those speeds apart.", { n }) // the sentence when the condition holds
        : sayT("verdict.unknown", "Not every cost is documented for {vendor}, so the tool cannot say whether all {n} interfaces are told apart.", { vendor: rule.label, n }); // otherwise this sentence
  if (rule.kind === "reference" && smallest) notes.push(sayT("note.smallest.found", "The smallest reference bandwidth that gives every interface its own documented cost is {ref}. A larger reference can merge two costs again, and the slowest interface's cost must stay at or below 65,535; Juniper's user guide suggests a reference \"based on a multiple of the highest speed interface\".", { ref: bandwidthLabel(BigInt(smallest.bps)) })); // the suggestion and its limits
  notes.push(say("note.rfc", "RFC 2328 does not tie cost to bandwidth: the interface output cost is a configured number that \"must always be greater than 0\" (appendix C.3), carried in a 16-bit metric (appendix A.4.2), so 1 to 65535. The bandwidth formulas and tables are each vendor's own.")); // the standard's part
  return { // the reading
    mode: "cost", // the mode
    vendor, // the vendor
    vendorLabel: rule.label, // its name
    kind: rule.kind, // its kind of rule
    reference, // reference vendors only
    links: rows, // every interface
    groups, // shared costs
    possible, // overlapping ranges
    allDistinct, // the answer
    smallest, // the suggestion
    costCommand: COMMANDS[vendor].cost, // the override
    verdictText, // the outcome
    warnings, // warnings
    notes, // notes
  }; // the reading
} // costLocalisable

// ----------------------------------------------------------------------------
// Adjacency mode: parsing
// ----------------------------------------------------------------------------

/** A dotted-decimal IPv4 address or Router ID. Anchored, bounded. */
const DOTTED_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/; // e.g. 10.255.0.1

/**
 * Dotted decimal as a 32-bit unsigned integer.
 * @param s the text
 * @returns the value, or null (an octet over 255, or with a leading zero)
 */
function parseDotted(s: string): number | null {
  const m = DOTTED_RE.exec(s); // four parts
  if (!m) return null; // not dotted
  let v = 0; // the value
  for (const part of m.slice(1, 5)) { // each octet
    if (part.length > 1 && part.startsWith("0")) return null; // a leading zero reads as octal in some parsers: refused
    const o = Number(part); // the octet
    if (o > 255) return null; // not an octet
    v = v * 256 + o; // network byte order, exact below 2^32
  } // octets
  return v; // 32 bits
} // parseDotted

/**
 * A 32-bit value in dotted decimal.
 * @param v the value
 * @returns a.b.c.d
 */
function dotted(v: number): string {
  return [Math.floor(v / 16777216) % 256, Math.floor(v / 65536) % 256, Math.floor(v / 256) % 256, v % 256].join("."); // four octets
} // dotted

/**
 * A whole number within bounds, refusing anything else with the field's own sentence.
 * @param raw the value
 * @param lo the smallest allowed
 * @param hi the largest allowed
 * @param err the refusal, given the text typed
 * @returns the number
 */
function parseWhole(raw: unknown, lo: number, hi: number, err: (value: string) => EngineText): number {
  const s = fieldText(raw); // bounded
  if (!/^\d{1,10}$/.test(s)) throw inputError(err(s)); // not a whole number
  const n = Number(s); // exact at ten digits
  if (n < lo || n > hi) throw inputError(err(s)); // out of range
  return n; // the number
} // parseWhole

/** A router label: letters, digits, dots, hyphens, underscores. Anchored, bounded. */
const NAME_RE = /^[\p{L}\p{N}._-]{1,32}$/u; // e.g. SW-CORE-01

/** The authentication kinds of each version. */
const AUTH_V2: readonly AuthKind[] = ["none", "simple", "md5", "hmac-sha-1", "hmac-sha-256", "hmac-sha-384", "hmac-sha-512"]; // RFC 2328 appendix D and RFC 5709 s3
/** OSPFv3: none, the Authentication Trailer algorithms (RFC 7166 s4), or IPsec (RFC 4552). */
const AUTH_V3: readonly AuthKind[] = ["none", "hmac-sha-1", "hmac-sha-256", "hmac-sha-384", "hmac-sha-512", "ipsec"]; // RFC 7166 and RFC 4552

/** A side as the checks read it. */
interface Side extends SideSummary {
  /** The address as a number (OSPFv2), or null. */
  ip: number | null;
  /** The prefix length (OSPFv2), or null. */
  len: number | null;
  /** The Router ID as a number, or null. */
  rid: number | null;
}

/**
 * Run a parse step for one side, so that a refusal names it.
 * @param label the side's label
 * @param fn the step
 * @returns the step's value
 */
function inSide<T>(label: string, fn: () => T): T {
  try { // attempt
    return fn(); // the step
  } catch (e) { // refused
    const m = (e as { engineText?: EngineText }).engineText; // the sentence it carries
    if (e instanceof OspfInputError && m) throw inputError(sayT("err.inSide", "{side}: {message}", { side: label, message: m })); // named
    throw e; // anything else as it is
  } // caught
} // inSide

/**
 * One side, validated.
 * @param raw the side as sent
 * @param fallback its default label ("A" or "B")
 * @param version 2 or 3
 * @returns the side
 */
function parseSide(raw: unknown, fallback: string, version: 2 | 3): Side {
  const o = (raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as SideInput; // an object, or nothing
  const typed = fieldText(o.name); // the label as typed
  if (typed !== "" && !NAME_RE.test(typed)) throw inputError(sayT("err.nameBad", "\"{value}\" is not a router label this tool reads: use up to 32 letters, digits, dots, hyphens or underscores, without spaces.", { value: typed })); // the label's form
  const name = typed === "" ? fallback : typed; // the label
  return inSide(name, () => { // every refusal below names the side
    const ridText = fieldText(o.routerId); // optional
    const rid = ridText === "" ? null : parseDotted(ridText); // a 32-bit number
    if (ridText !== "" && rid === null) throw inputError(sayT("err.routerId", "\"{value}\" is not a Router ID: write it in dotted decimal, such as 10.255.0.1 (a 32-bit number, RFC 2328 section 1.2).", { value: ridText })); // not dotted
    const areaText = fieldText(o.area); // required
    if (areaText === "") throw inputError(say("err.areaEmpty", "Enter the Area ID: dotted decimal, such as 0.0.0.0, or a decimal number, such as 0.")); // nothing typed
    let area: number | null = parseDotted(areaText); // dotted form
    if (area === null && /^\d{1,10}$/.test(areaText) && Number(areaText) <= 4294967295) area = Number(areaText); // decimal form
    if (area === null) throw inputError(sayT("err.area", "\"{value}\" is not an Area ID: it is a 32-bit number (RFC 2328 appendix A.3.1), written in dotted decimal or as a decimal from 0 to 4294967295.", { value: areaText })); // neither
    const areaTypeText = fieldText(o.areaType).toLowerCase() || "normal"; // normal by default
    if (areaTypeText !== "normal" && areaTypeText !== "stub" && areaTypeText !== "nssa") throw inputError(say("err.areaType", "Choose the area type: normal, stub or nssa.")); // anything else
    const areaType = areaTypeText as AreaType; // read
    if (area === 0 && areaType === "stub") throw inputError(say("err.backboneStub", "Area 0 cannot be a stub area: \"The backbone cannot be configured as a stub area\" (RFC 2328 section 6).")); // RFC 2328 s6
    if (area === 0 && areaType === "nssa") throw inputError(say("err.backboneNssa", "Area 0 cannot be an NSSA: \"The backbone is always a Type-5 capable area\" (RFC 3101 section 1.3).")); // RFC 3101 s1.3
    const netText = fieldText(o.network).toLowerCase(); // required
    if (!["broadcast", "point-to-point", "nbma", "point-to-multipoint"].includes(netText)) throw inputError(say("err.network", "Choose the network type: broadcast, point-to-point, nbma or point-to-multipoint.")); // anything else
    const network = netText as NetworkType; // read
    let ip: number | null = null; // OSPFv2 only
    let len: number | null = null; // idem
    const addrText = fieldText(o.address); // as typed
    if (version === 2) { // the address and mask matter
      const m = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/.exec(addrText); // address/length
      ip = m ? parseDotted(m[1]) : null; // the address
      len = m ? Number(m[2]) : null; // the length
      if (addrText === "") throw inputError(say("err.addressEmpty", "Enter the interface address with its prefix length, such as 10.0.12.1/30: OSPFv2 checks the subnet and the Network Mask (RFC 2328 sections 8.2 and 10.5).")); // nothing typed
      if (ip === null || len === null || len > 32) throw inputError(sayT("err.address", "\"{value}\" is not an IPv4 address with a prefix length, such as 10.0.12.1/30.", { value: addrText })); // not address/length
    } else if (addrText !== "") throw inputError(say("err.addressV3", "OSPFv3 has no Network Mask in its Hellos and no subnet check (RFC 5340 sections 4.2.2 and 4.2.2.1): leave the address out.")); // v3
    const hello = parseWhole(o.hello, 1, 65535, (value) => sayT("err.hello", "\"{value}\" is not a HelloInterval: whole seconds from 1 to 65535 (a 16-bit field).", { value })); // RFC 2328 A.3.2, RFC 5340 A.3.2
    const deadMax = version === 2 ? 4294967295 : 65535; // 32 bits in OSPFv2, 16 in OSPFv3
    const dead = parseWhole(o.dead, 1, deadMax, (value) => version === 2 // the version's own field width
      ? sayT("err.dead.v2", "\"{value}\" is not a RouterDeadInterval: whole seconds from 1 to 4294967295 (a 32-bit field in OSPFv2).", { value }) // the sentence when the condition holds
      : sayT("err.dead.v3", "\"{value}\" is not a RouterDeadInterval: whole seconds from 1 to 65535 (a 16-bit field in OSPFv3).", { value })); // otherwise this sentence
    const mtu = parseWhole(o.mtu, 1, 65535, (value) => sayT("err.mtu", "\"{value}\" is not an interface MTU: whole bytes from 1 to 65535 (the 16-bit Interface MTU field of a Database Description packet).", { value })); // A.3.3
    const authText = fieldText(o.auth).toLowerCase() || "none"; // none by default
    const kinds = version === 2 ? AUTH_V2 : AUTH_V3; // the version's kinds
    if (!kinds.includes(authText as AuthKind)) throw inputError(version === 2 // the version's own list
      ? say("err.auth.v2", "Choose OSPFv2 authentication: none, simple, md5, hmac-sha-1, hmac-sha-256, hmac-sha-384 or hmac-sha-512 (RFC 2328 appendix D, RFC 5709).") // the sentence when the condition holds
      : say("err.auth.v3", "Choose OSPFv3 authentication: none, an Authentication Trailer algorithm (hmac-sha-1, hmac-sha-256, hmac-sha-384 or hmac-sha-512, RFC 7166) or ipsec (RFC 4552). OSPFv3 has no simple password or MD5 (RFC 5340 section 2.6).")); // otherwise this sentence
    const auth = authText as AuthKind; // read
    const keyed = auth !== "none" && auth !== "simple" && auth !== "ipsec"; // a Key ID or SA ID applies
    const keyText = fieldText(o.keyId); // as typed
    let keyId: number | null = null; // none
    if (keyed) keyId = parseWhole(keyText, 0, version === 2 ? 255 : 65535, (value) => version === 2 // the field's width
      ? sayT("err.keyId.v2", "\"{value}\" is not a Key ID: a whole number from 0 to 255 (8 bits, RFC 5709 section 3.2).", { value }) // the sentence when the condition holds
      : sayT("err.keyId.v3", "\"{value}\" is not an SA ID: a whole number from 0 to 65535 (16 bits, RFC 7166 section 3).", { value })); // otherwise this sentence
    else if (keyText !== "") throw inputError(say("err.keyIdUnused", "A Key ID applies only to cryptographic authentication: leave it blank for none, simple or ipsec.")); // nothing to key
    const prText = fieldText(o.priority); // optional
    const priority = prText === "" ? null : parseWhole(prText, 0, 255, (value) => sayT("err.priority", "\"{value}\" is not a Router Priority: a whole number from 0 to 255 (8 bits, RFC 2328 appendix C.3).", { value })); // read
    const instText = fieldText(o.instance); // optional
    const instance = instText === "" ? 0 : parseWhole(instText, 0, 255, (value) => sayT("err.instance", "\"{value}\" is not an Instance ID: a whole number from 0 to 255 (8 bits).", { value })); // 0 by default
    return { name, routerId: rid === null ? null : dotted(rid), rid, area: dotted(area), areaType, network, address: version === 2 ? `${dotted(ip as number)}/${len}` : null, ip, len, hello, dead, mtu, auth, keyId, priority, instance }; // the side
  }); // named refusals
} // parseSide

/**
 * A prefix length as a 32-bit mask value.
 * @param len 0 to 32
 * @returns the mask
 */
function maskOf(len: number): number {
  return len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0; // leading ones
} // maskOf

/**
 * A prefix length as a dotted mask.
 * @param len 0 to 32
 * @returns a.b.c.d
 */
function maskText(len: number): string {
  return dotted(maskOf(len)); // dotted
} // maskText

// ----------------------------------------------------------------------------
// Adjacency mode: the checks
// ----------------------------------------------------------------------------

/** Words for a network type, as RFC 2328 names them. */
const NET_WORDS: Readonly<Record<NetworkType, string>> = Object.freeze({ broadcast: "broadcast", "point-to-point": "point-to-point", nbma: "NBMA", "point-to-multipoint": "Point-to-MultiPoint" }); // RFC 2328 s1.2

/** Words for an area type. */
const AREA_WORDS: Readonly<Record<AreaType, EngineText>> = Object.freeze({ normal: say("areaWord.normal", "a normal area (E-bit set)"), stub: say("areaWord.stub", "a stub area (E-bit clear)"), nssa: say("areaWord.nssa", "an NSSA (N-bit set, E-bit clear)") }); // RFC 2328 s10.5, RFC 3101 s2.1

/** Words for an authentication kind. */
const AUTH_WORDS: Readonly<Record<AuthKind, EngineText>> = Object.freeze({ none: say("authWord.none", "no authentication"), simple: say("authWord.simple", "a simple password"), md5: say("authWord.md5", "Keyed-MD5"), "hmac-sha-1": say("authWord.hmacSha1", "HMAC-SHA-1"), "hmac-sha-256": say("authWord.hmacSha256", "HMAC-SHA-256"), "hmac-sha-384": say("authWord.hmacSha384", "HMAC-SHA-384"), "hmac-sha-512": say("authWord.hmacSha512", "HMAC-SHA-512"), ipsec: say("authWord.ipsec", "IPsec") }); // as the RFCs name them

/**
 * The OSPFv2 AuType of an authentication kind (RFC 2328 appendix D: 0 null, 1 simple, 2 cryptographic).
 * @param k the kind
 * @returns 0, 1 or 2
 */
function auType(k: AuthKind): number {
  return k === "none" ? 0 : k === "simple" ? 1 : 2; // MD5 and every HMAC-SHA are cryptographic, AuType 2 (RFC 5709 s3)
} // auType

/** A finding under construction: which side drops, and why. */
interface Draft {
  /** The check. */
  check: CheckId;
  /** The stage. */
  stage: Finding["stage"];
  /** A drops B's packets. */
  dropsAtA: boolean;
  /** B drops A's packets. */
  dropsAtB: boolean;
  /** The sentence. */
  text: EngineText;
  /** Vendor notes. */
  vendor?: EngineText[];
}

/**
 * Which side or sides drop, in words.
 * @param d the draft
 * @param a A's label
 * @param b B's label
 * @param what Hellos or every packet
 * @returns the phrase, as a sentence
 */
function who(d: { dropsAtA: boolean; dropsAtB: boolean }, a: string, b: string, what: "hellos" | "packets"): EngineText {
  if (d.dropsAtA && d.dropsAtB) return what === "hellos" ? say("who.both.hellos", "each router drops the other's Hellos") : say("who.both.packets", "each router drops the other's packets"); // both
  const [receiver, sender] = d.dropsAtA ? [a, b] : [b, a]; // who drops whose
  return what === "hellos" ? sayT("who.one.hellos", "{receiver} drops {sender}'s Hellos", { receiver, sender }) : sayT("who.one.packets", "{receiver} drops {sender}'s packets", { receiver, sender }); // one side
} // who

/** Huawei VRP's Hello defaults, attached to a HelloInterval mismatch (Command Reference, ospf timer hello). */
const HUAWEI_HELLO = say("v.hello.huawei", "Huawei VRP (S5700/S6700 V200R025C00): ospf timer hello defaults to 10 s on point-to-point and broadcast interfaces and 30 s on NBMA and point-to-multipoint ones; when the Hello is set and the dead interval is not, \"the dead interval of an OSPF neighbor is four times the value of hello interval\", so a Hello changed on a Huawei side changes its dead interval too."); // ospf timer hello
/** Huawei VRP's dead-interval defaults, attached to a RouterDeadInterval mismatch (Command Reference, ospf timer dead). */
const HUAWEI_DEAD = say("v.dead.huawei", "Huawei VRP (S5700/S6700 V200R025C00): ospf timer dead defaults to 40 s on point-to-point and broadcast interfaces and 120 s on NBMA and point-to-multipoint ones (range 1 to 235926000 s), and to four times the Hello when only the Hello is set."); // ospf timer dead

/**
 * The checks every OSPF packet (and so every Hello) passes, in the order RFC 2328 s8.2, RFC 5340 s4.2.2 and s10.5 make
 * them, each in both directions.
 * @param version 2 or 3
 * @param A router A
 * @param B router B
 * @param sameKey whether the two hold the same key
 * @returns the mismatches
 */
function helloChecks(version: 2 | 3, A: Side, B: Side, sameKey: boolean): Draft[] {
  const out: Draft[] = []; // in order
  const an = A.name; // A's label
  const bn = B.name; // B's label
  // ---- Locally originated packets (OSPFv2): the same source address on both sides. ----
  if (version === 2 && A.ip === B.ip) out.push({ check: "own-address", stage: "hello", dropsAtA: true, dropsAtB: true, text: sayT("f.ownAddress", "Both interfaces have the address {addr}. Each router takes the other's packets, sent from its own address, for its own: \"Locally originated packets should not be passed on to OSPF\" (RFC 2328 section 8.2), so neither hears the other.", { addr: dotted(A.ip as number) }) }); // s8.2
  // ---- Area ID (and, in OSPFv3, Instance ID with it). ----
  if (A.area !== B.area) out.push({ check: "area", stage: "hello", dropsAtA: true, dropsAtB: true, text: version === 2 // a mismatch, worded per version
    ? sayT("f.area.v2", "Area ID: {a} is in area {areaA} and {b} in area {areaB}. \"The Area ID found in the OSPF header must be verified\" against the receiving interface's area, and the packet is discarded (RFC 2328 section 8.2; the backbone case applies only to virtual links, which this checker does not model). Every packet is dropped, Hellos included, so no neighbour appears.", { a: an, b: bn, areaA: A.area, areaB: B.area }) // the sentence when the condition holds
    : sayT("f.area.v3", "Area ID: {a} is in area {areaA} and {b} in area {areaB}. \"The Area ID and Instance ID found in the OSPF header must be verified\", and a packet that matches neither the link's area nor a virtual link \"should be discarded\" (RFC 5340 section 4.2.2). No neighbour appears.", { a: an, b: bn, areaA: A.area, areaB: B.area }) }); // s8.2, RFC 5340 s4.2.2
  // ---- Subnet (OSPFv2, not on point-to-point receivers). ----
  if (version === 2) { // the source must be on the receiving interface's subnet
    const off = (rx: Side, tx: Side): boolean => rx.network !== "point-to-point" && (((rx.ip as number) & maskOf(rx.len as number)) >>> 0) !== (((tx.ip as number) & maskOf(rx.len as number)) >>> 0); // masked with the receiver's mask
    const d = { dropsAtA: off(A, B), dropsAtB: off(B, A) }; // each direction
    if ((d.dropsAtA || d.dropsAtB) && A.area === B.area && A.ip !== B.ip) out.push({ check: "subnet", stage: "hello", ...d, text: sayT("f.subnet", "Subnet: {who}. With the Area ID matching, \"the packet's IP source address is required to be on the same network as the receiving interface\", checked by masking both addresses with the receiving interface's mask, a comparison that \"should not be performed on point-to-point networks\" (RFC 2328 section 8.2). {a} is {addrA} and {b} is {addrB}.", { who: who(d, an, bn, "packets"), a: an, b: bn, addrA: A.address as string, addrB: B.address as string }) }); // s8.2
  } // v2
  // ---- Instance ID. ----
  if (A.instance !== B.instance) out.push({ check: "instance", stage: "hello", dropsAtA: true, dropsAtB: true, text: version === 2 // a mismatch, worded per version
    ? sayT("f.instance.v2", "Instance ID: {a} uses {instA} and {b} uses {instB}. \"Received packets with an Instance ID not equal to one of the configured OSPFv2 Instance IDs on the receiving interface MUST be discarded\" (RFC 6549 section 3.1, which defines the field and its default of 0; a router without RFC 6549 reads those 8 bits as part of the AuType).", { a: an, b: bn, instA: String(A.instance), instB: String(B.instance) }) // the sentence when the condition holds
    : sayT("f.instance.v3", "Instance ID: {a} uses {instA} and {b} uses {instB}. The Instance ID is checked with the Area ID and a packet that matches no interface instance \"should be discarded\" (RFC 5340 sections 2.4 and 4.2.2); RFC 5838 reserves 0 to 31 for IPv6 unicast, 64 to 95 for IPv4 unicast.", { a: an, b: bn, instA: String(A.instance), instB: String(B.instance) }) }); // RFC 6549 s3.1, RFC 5340 s4.2.2
  // ---- Authentication. ----
  if (version === 2) { // RFC 2328 s8.2, appendix D, RFC 5709
    if (auType(A.auth) !== auType(B.auth)) out.push({ check: "auth-type", stage: "hello", dropsAtA: true, dropsAtB: true, text: sayT("f.authType.v2", "Authentication type: {a} uses {authA} (AuType {tA}) and {b} uses {authB} (AuType {tB}). \"The AuType specified in the packet must match the AuType specified for the associated interface\" (RFC 2328 section 8.2, as verified erratum 3734 corrects it), so every packet is discarded in both directions.", { a: an, b: bn, authA: AUTH_WORDS[A.auth], authB: AUTH_WORDS[B.auth], tA: String(auType(A.auth)), tB: String(auType(B.auth)) }) }); // AuType
    else if (A.auth === "simple" && !sameKey) out.push({ check: "key", stage: "hello", dropsAtA: true, dropsAtB: true, text: say("f.key.simple", "Simple password: the passwords differ. The 64-bit authentication field \"must be equal to the 64-bit password\" configured for the receiving interface (RFC 2328 appendix D.5.2), so every packet fails and is discarded in both directions.") }); // D.5.2
    else if (auType(A.auth) === 2) { // cryptographic
      if (A.keyId !== B.keyId) out.push({ check: "key-id", stage: "hello", dropsAtA: true, dropsAtB: true, text: sayT("f.keyId.v2", "Key ID: {a} signs with Key ID {kA} and {b} with Key ID {kB}. The receiver looks for its own key \"having Key ID equal to that specified in the received OSPF packet\" and, \"If the key is not found\", discards the packet (RFC 2328 appendix D.5.3, step 1), so with one key on each side every packet is dropped in both directions.", { a: an, b: bn, kA: String(A.keyId), kB: String(B.keyId) }) }); // D.5.3 (1)
      else if (A.auth !== B.auth) out.push({ check: "algorithm", stage: "hello", dropsAtA: true, dropsAtB: true, text: sayT("f.algorithm.v2", "Algorithm: Key ID {k} is {authA} on {a} and {authB} on {b}. \"The cryptographic algorithm/mode in use is indicated implicitly by the KeyID\" (RFC 5709 section 3.4), so each receiver computes the digest with its own algorithm, the digests differ, and \"the OSPF packet is discarded\" (RFC 2328 appendix D.5.3, step 3c) in both directions.", { k: String(A.keyId), a: an, b: bn, authA: AUTH_WORDS[A.auth], authB: AUTH_WORDS[B.auth] }) }); // RFC 5709 s3.4
      else if (!sameKey) out.push({ check: "key", stage: "hello", dropsAtA: true, dropsAtB: true, text: sayT("f.key.crypto", "Key: Key ID {k} uses {auth} on both sides, with different keys. The digest computed with the receiver's key does not match the one received, so \"the OSPF packet is discarded\" (RFC 2328 appendix D.5.3, step 3c; RFC 5709 section 3.4) in both directions. The key itself never crosses the wire (appendix D.3).", { k: String(A.keyId), auth: AUTH_WORDS[A.auth] }) }); // D.5.3 (3c)
    } // crypto
  } else { // OSPFv3: authentication is outside the OSPF header
    const trailer = (s: Side): boolean => s.auth !== "none" && s.auth !== "ipsec"; // RFC 7166
    if (A.auth !== B.auth && (A.auth === "ipsec" || B.auth === "ipsec" || A.auth === "none" || B.auth === "none")) { // different mechanisms
      const kinds = [A.auth, B.auth]; // the pair
      out.push({ check: "auth-type", stage: "hello", dropsAtA: true, dropsAtB: true, text: kinds.includes("ipsec") // IPsec or the trailer
        ? sayT("f.authType.v3.ipsec", "Authentication: {a} uses {authA} and {b} uses {authB}. With IPsec enabled, \"OSPFv3 packets that are not protected with AH or ESP MUST be silently discarded\" (RFC 4552 section 3); the other side does not take the IPsec-protected packets as OSPF, whose Next Header must be 89 (RFC 5340 section 4.2.2). Every packet is dropped in both directions.", { a: an, b: bn, authA: AUTH_WORDS[A.auth], authB: AUTH_WORDS[B.auth] }) // the sentence when the condition holds
        : sayT("f.authType.v3.trailer", "Authentication: {a} uses {authA} and {b} uses {authB}. A router with the Authentication Trailer configured drops \"Hello and Database Description packets with the AT-bit clear\" (RFC 7166 section 4.6); the trailer side omits the OSPFv3 header checksum (section 4.2), which the other side verifies (RFC 5340 section 4.2.2), unless it runs the transition mode of RFC 7166 section 5. Expect no neighbour on either side.", { a: an, b: bn, authA: AUTH_WORDS[A.auth], authB: AUTH_WORDS[B.auth] }) }); // RFC 4552 s3, RFC 7166 s4.6
    } else if (trailer(A) && trailer(B)) { // both trailer
      if (A.keyId !== B.keyId) out.push({ check: "key-id", stage: "hello", dropsAtA: true, dropsAtB: true, text: sayT("f.keyId.v3", "SA ID: {a} uses {kA} and {b} uses {kB}. \"If the SA is not found ... the OSPFv3 packet is dropped\" (RFC 7166 section 4.6), so with one SA on each side every packet is dropped in both directions.", { a: an, b: bn, kA: String(A.keyId), kB: String(B.keyId) }) }); // RFC 7166 s4.6
      else if (A.auth !== B.auth) out.push({ check: "algorithm", stage: "hello", dropsAtA: true, dropsAtB: true, text: sayT("f.algorithm.v3", "Algorithm: SA ID {k} is {authA} on {a} and {authB} on {b}. Each SA ID specifies the authentication algorithm and the key (RFC 7166 section 3), so the computed data does not match the received data and \"the packet MUST be discarded\" (section 4.6) in both directions.", { k: String(A.keyId), a: an, b: bn, authA: AUTH_WORDS[A.auth], authB: AUTH_WORDS[B.auth] }) }); // RFC 7166 s3, s4.6
      else if (!sameKey) out.push({ check: "key", stage: "hello", dropsAtA: true, dropsAtB: true, text: sayT("f.key.v3", "Key: SA ID {k} uses {auth} on both sides, with different keys, so the authentication data differs and \"the packet MUST be discarded\" (RFC 7166 section 4.6) in both directions.", { k: String(A.keyId), auth: AUTH_WORDS[A.auth] }) }); // RFC 7166 s4.6
    } else if (A.auth === "ipsec" && B.auth === "ipsec" && !sameKey) out.push({ check: "key", stage: "hello", dropsAtA: true, dropsAtB: true, text: say("f.key.ipsec", "IPsec keys: the two sides hold different keys, and \"OSPFv3 packets that fail the authentication checks MUST be silently discarded\" (RFC 4552 section 3), in both directions.") }); // RFC 4552 s3
  } // versions
  // ---- The Hello's own fields (RFC 2328 s10.5; RFC 5340 s4.2.2.1). ----
  if (version === 2) { // the Network Mask exists only in OSPFv2
    const dm = { dropsAtA: A.network !== "point-to-point" && A.len !== B.len, dropsAtB: B.network !== "point-to-point" && A.len !== B.len }; // ignored on point-to-point receivers
    if (dm.dropsAtA || dm.dropsAtB) out.push({ check: "mask", stage: "hello", ...dm, text: sayT("f.mask", "Network Mask: {a} sends {maskA} and {b} sends {maskB}, so {who}: the mask \"must be checked against the values configured for the receiving interface. Any mismatch causes processing to stop and the packet to be dropped\", except that \"on point-to-point networks and on virtual links, the Network Mask in the received Hello Packet should be ignored\" (RFC 2328 section 10.5).", { a: an, b: bn, maskA: maskText(A.len as number), maskB: maskText(B.len as number), who: who(dm, an, bn, "hellos") }) }); // s10.5
  } // v2
  if (A.hello !== B.hello) out.push({ check: "hello", stage: "hello", dropsAtA: true, dropsAtB: true, text: version === 2 // a mismatch, worded per version
    ? sayT("f.hello.v2", "HelloInterval: {a} sends every {hA} s and {b} every {hB} s. The HelloInterval in a received Hello \"must be checked against the values configured for the receiving interface. Any mismatch causes processing to stop and the packet to be dropped\" (RFC 2328 section 10.5), in both directions: no neighbour appears on either side.", { a: an, b: bn, hA: String(A.hello), hB: String(B.hello) }) // the sentence when the condition holds
    : sayT("f.hello.v3", "HelloInterval: {a} sends every {hA} s and {b} every {hB} s. OSPFv3 keeps the HelloInterval check of RFC 2328 section 10.5, \"Any mismatch causes processing to stop and the packet to be dropped\" (RFC 5340 section 4.2.2.1 lists only the differences), in both directions: no neighbour appears on either side.", { a: an, b: bn, hA: String(A.hello), hB: String(B.hello) }), vendor: [HUAWEI_HELLO] }); // s10.5, Huawei's defaults
  if (A.dead !== B.dead) out.push({ check: "dead", stage: "hello", dropsAtA: true, dropsAtB: true, text: version === 2 // a mismatch, worded per version
    ? sayT("f.dead.v2", "RouterDeadInterval: {a} advertises {dA} s and {b} {dB} s. Like the HelloInterval, it is checked against the receiving interface and \"Any mismatch causes processing to stop and the packet to be dropped\" (RFC 2328 section 10.5), in both directions.", { a: an, b: bn, dA: String(A.dead), dB: String(B.dead) }) // the sentence when the condition holds
    : sayT("f.dead.v3", "RouterDeadInterval: {a} advertises {dA} s and {b} {dB} s. OSPFv3 keeps the check of RFC 2328 section 10.5 (RFC 5340 section 4.2.2.1), so Hellos are dropped in both directions.", { a: an, b: bn, dA: String(A.dead), dB: String(B.dead) }), vendor: [HUAWEI_DEAD] }); // s10.5, Huawei's defaults
  if (A.areaType !== B.areaType && A.area === B.area) out.push({ check: "area-type", stage: "hello", dropsAtA: true, dropsAtB: true, text: A.areaType === "nssa" || B.areaType === "nssa" // NSSA or stub wording
    ? sayT("f.areaType.nssa", "Area type: {a} has area {area} as {typeA} and {b} as {typeB}. \"both the N-bit and the E-bit found in the Hello packet's option field\" must match the receiving area, and \"A mismatch in the options causes processing of the received Hello packet to stop and the packet to be dropped\" (RFC 3101 section 2.1), in both directions.", { a: an, b: bn, area: A.area, typeA: AREA_WORDS[A.areaType], typeB: AREA_WORDS[B.areaType] }) // the sentence when the condition holds
    : sayT("f.areaType.stub", "Area type: {a} has area {area} as {typeA} and {b} as {typeB}. \"If AS-external-LSAs are not flooded into/throughout the area (i.e, the area is a \"stub\") the E-bit must be clear in received Hello Packets, otherwise the E-bit must be set. A mismatch causes processing to stop and the packet to be dropped\" (RFC 2328 section 10.5), in both directions.", { a: an, b: bn, area: A.area, typeA: AREA_WORDS[A.areaType], typeB: AREA_WORDS[B.areaType] }) }); // s10.5, RFC 3101 s2.1
  return out; // every Hello-stage mismatch
} // helloChecks

/** The network types that describe the link to the neighbour as a point-to-point (Type 1) link. */
const P2P_LIKE: readonly NetworkType[] = ["point-to-point", "point-to-multipoint"]; // RFC 2328 s12.4.1.1 and s12.4.1.4

/**
 * Whether one side, by its own network type and the two priorities, tries to become adjacent (RFC 2328 s10.4).
 * @param me this side
 * @param other the neighbour
 * @returns true, false (no Designated Router can exist), or true when the priorities are not given
 */
function wantsAdjacency(me: Side, other: Side): boolean {
  if (P2P_LIKE.includes(me.network)) return true; // "always become adjacent"
  if (me.priority === 0 && other.priority === 0) return false; // neither eligible: no DR, no BDR, no adjacency
  return true; // with two routers, one of them is DR or BDR in this side's own election
} // wantsAdjacency

/**
 * The adjacency-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function adjacencyLocalisable(r: AdjacencyRequest): AdjacencyResult<EngineText> {
  const vText = r.version === undefined || r.version === null || r.version === "" ? "2" : String(r.version).trim(); // 2 by default
  if (vText !== "2" && vText !== "3") throw inputError(say("err.version", "Choose OSPF version 2 (RFC 2328, IPv4) or 3 (RFC 5340, IPv6).")); // anything else
  const version = Number(vText) as 2 | 3; // read
  const sk = r.sameKey; // the key switch
  let sameKey = true; // the default: the keys match
  if (sk !== undefined && sk !== null && sk !== "") { // given
    const s = String(sk).trim().toLowerCase(); // text or boolean
    if (s === "true" || s === "1" || s === "yes") sameKey = true; // the same
    else if (s === "false" || s === "0" || s === "no") sameKey = false; // different
    else throw inputError(say("err.sameKey", "Same key is true or false.")); // anything else
  } // switch
  const A = parseSide(r.a, "A", version); // one end
  const B = parseSide(r.b, "B", version); // the other
  if (A.name === B.name) throw inputError(sayT("err.nameDup", "Both routers are called \"{value}\": give each its own label.", { value: A.name })); // ambiguous
  const an = A.name; // labels
  const bn = B.name; // idem
  const helloDrafts = helloChecks(version, A, B, sameKey); // the Hello-stage mismatches, reached first
  const dropsAtA = helloDrafts.some((d) => d.dropsAtA); // A hears nothing from B
  const dropsAtB = helloDrafts.some((d) => d.dropsAtB); // B hears nothing from A
  const later: (Draft & { after: boolean })[] = []; // the Database Description and routing mismatches; after = an earlier one of them stops the routers first

  // ---- After 2-Way: who tries to become adjacent (RFC 2328 s10.4), then the Database Description checks (s10.6). ----
  const wA = wantsAdjacency(A, B); // A's decision
  const wB = wantsAdjacency(B, A); // B's decision
  let dbA: NeighborView = "Full"; // how far A would get once the Hellos pass
  let dbB: NeighborView = "Full"; // how far B would get
  if (!wA && !wB) { // neither is eligible to be DR
    dbA = "2-Way"; dbB = "2-Way"; // they stop there
    later.push({ after: false, check: "no-dr", stage: "database", dropsAtA: false, dropsAtB: false, text: sayT("f.noDr", "Router Priority: both {a} and {b} send priority 0, and \"A router whose Router Priority is set to 0 is ineligible to become Designated Router\" (RFC 2328 appendix C.3). On a {net} network routers become adjacent only with the Designated Router and the Backup Designated Router, so with neither elected \"the state of the neighbor communication stops at 2-Way\" (section 10.4).", { a: an, b: bn, net: NET_WORDS[A.network] }) }); // s10.4, C.3
  } else if (wA !== wB) { // one side tries, the other stays at 2-Way (only with differing network types)
    const tries = wA ? A : B; // the side that tries
    const stays = wA ? B : A; // the side that does not
    dbA = wA ? "ExStart" : "2-Way"; // the trying side waits in ExStart
    dbB = wB ? "ExStart" : "2-Way"; // the other ignores its Database Descriptions
    later.push({ after: false, check: "no-dr", stage: "database", dropsAtA: !wA, dropsAtB: !wB, text: sayT("f.oneSided", "{tries} always tries to become adjacent on its {netT} interface, but {stays}, on a {netS} interface with both priorities 0, elects no Designated Router and stays at 2-Way, where Database Description packets \"should be ignored\" (RFC 2328 sections 10.4 and 10.6): {tries} waits in ExStart.", { tries: tries.name, stays: stays.name, netT: NET_WORDS[tries.network], netS: NET_WORDS[stays.network] }) }); // s10.4, s10.6
  } // the adjacency decision
  const both = wA && wB; // both try: ExStart, then the Database Description checks
  const sameRid = A.rid !== null && B.rid !== null && A.rid === B.rid; // equal Router IDs
  if (sameRid) { // neither ExStart case can match
    if (both) { dbA = "ExStart"; dbB = "ExStart"; } // both stay in ExStart
    later.push({ after: !both, check: "router-id", stage: "database", dropsAtA: true, dropsAtB: true, text: sayT("f.routerId", "Router ID: both routers use {rid}. A Router ID \"uniquely identifies the router within an Autonomous System\" (RFC 2328 section 1.2), and ExStart ends only when the neighbour's Router ID is larger or smaller than the router's own (section 10.6); with equal IDs neither case matches, every Database Description packet is ignored, and both stay in ExStart.", { rid: A.routerId as string }) }); // s1.2, s10.6
  } // Router IDs
  if (A.mtu !== B.mtu) { // the MTU check
    const small = A.mtu < B.mtu ? A : B; // the side that rejects
    const large = small === A ? B : A; // the side whose packets are too big
    const largeView: NeighborView = A.rid === null || B.rid === null ? "ExStart or Exchange" : (large.rid as number) > (small.rid as number) ? "ExStart" : "Exchange"; // Leader (higher ID) stays in ExStart; Follower moves to Exchange
    if (both && !sameRid) { if (small === A) { dbA = "ExStart"; dbB = largeView; } else { dbB = "ExStart"; dbA = largeView; } } // per side, when it is the check that stops them
    const tail = largeView === "ExStart or Exchange" // what the larger side does
      ? say("f.mtu.tail.unknown", "Where the other side stops depends on the Router IDs: with the higher one it stays in ExStart as Leader, with the lower one it becomes Follower and moves to Exchange; give both Router IDs to see which.") // the sentence when the condition holds
      : largeView === "ExStart" // the next case
        ? sayT("f.mtu.tail.leader", "{large} has the higher Router ID, so it insists on being Leader and ignores {small}'s initial packet: both stay in ExStart.", { large: large.name, small: small.name }) // the sentence when the condition holds
        : sayT("f.mtu.tail.follower", "{large} has the lower Router ID, so it accepts {small}'s initial packet as Follower and moves to Exchange, while {small} keeps rejecting its replies and stays in ExStart.", { large: large.name, small: small.name }); // the derivation from s10.6
    later.push({ after: !both || sameRid, check: "mtu", stage: "database", dropsAtA: small === A, dropsAtB: small === B, text: sayT("f.mtu.main", "MTU: {small} has {mtuS} bytes and {large} {mtuL}. \"If the Interface MTU field in the Database Description packet indicates an IP datagram size that is larger than the router can accept on the receiving interface without fragmentation, the Database Description packet is rejected\" (RFC 2328 section 10.6; the same in OSPFv3, RFC 5340 section 4.2.2): {small} rejects {large}'s. Hellos carry no MTU, so the two reach 2-Way and the problem shows only after it. {tail}", { small: small.name, large: large.name, mtuS: String(small.mtu), mtuL: String(large.mtu), tail }), vendor: [ // the MTU finding and the vendors' notes
      say("v.mtu.cisco", "Cisco IOS XE: ip ospf mtu-ignore disables the check (\"OSPF MTU mismatch detection is enabled\" by default, and the check \"is performed when neighbors exchange DBD packets\"), Cisco IOS IP Routing: OSPF Command Reference."), // Cisco
      say("v.mtu.fabricEngine", "Extreme Fabric Engine 9.4: ip ospf mtu-ignore enable lets the switch \"accept OSPF database description (DBD) packets with a different MTU size\"; the same page says incoming DBD packets are dropped \"if their MTU is greater than 1500 bytes\"."), // Fabric Engine
      say("v.mtu.huawei", "Huawei VRP (S5700/S6700 V200R025C00): \"By default, an interface adds the MTU 0 (not the actual MTU) in DD packets to be sent and does not check the MTUs in received DD packets\", so a Huawei side left at its default neither rejects the other's packets nor sends a size the other could reject (RFC 2328 section 10.6 rejects only a larger one). ospf mtu-enable sends the actual MTU and checks \"whether the MTU in a received DD packet is greater than the local MTU\"; then \"If the interface MTU settings of the local and remote ends are different, an OSPF neighbor relationship cannot enter the Full state\", and configuring it restarts the OSPF process."), // Huawei: ospf mtu-enable
      say("v.mtu.others", "The Juniper OSPF User Guide, the Switch Engine command reference, the RouterOS interface-template page, the FRRouting OSPFv2 page and the Arista EOS OSPFv2 chapter read here document no setting to ignore it."), // what the others say (Arista: its 4.37.0F OSPFv2 chapter, read in a browser on 2026-11-08, mentions the MTU only in command output and for tunnel path-mtu-discovery)
    ] }); // s10.6, vendors
  } // MTU

  // ---- Network types that differ: the link is described differently at each end (s12.4.1, s16.1). ----
  let mixed = false; // one point-to-point-like end and one broadcast or NBMA end
  if (A.network !== B.network) { // differing types
    const p2pA = P2P_LIKE.includes(A.network); // A describes a Type 1 link
    const p2pB = P2P_LIKE.includes(B.network); // B describes a Type 1 link
    const args = { a: an, b: bn, netA: NET_WORDS[A.network], netB: NET_WORDS[B.network] }; // the sentence's values
    if (p2pA !== p2pB) { // one point-to-point-like, one broadcast or NBMA
      mixed = true; // not used for routing even at Full
      later.push({ after: false, check: "network-type", stage: "routing", dropsAtA: false, dropsAtB: false, text: sayT("f.network.mixed", "Network type: {a} runs {netA} and {b} runs {netB}. No Hello field carries the network type, so none of the receive checks catches it. The two then describe the link differently in their router-LSAs: a point-to-point side as a Type 1 link to the neighbour's Router ID (RFC 2328 section 12.4.1.1), a broadcast or NBMA side as a Type 2 link to the Designated Router's network (section 12.4.1.2). The shortest-path calculation skips a link whose far end \"does not have a link back\" (section 16.1, step 2b), so even when both reach Full, no route uses this link.", args) }); // s12.4.1.1, s12.4.1.2, s16.1
    } else if (p2pA && p2pB) { // point-to-point against Point-to-MultiPoint
      later.push({ after: false, check: "network-type", stage: "routing", dropsAtA: false, dropsAtB: false, text: sayT("f.network.p2pLike", "Network type: {a} runs {netA} and {b} runs {netB}. Both describe the link as a Type 1 link to the other's Router ID (RFC 2328 sections 12.4.1.1 and 12.4.1.4), so the shortest-path calculation can use it; the addresses are advertised differently (a stub link for the subnet or the neighbour's address on point-to-point, a host route for its own address on Point-to-MultiPoint), and only the Point-to-MultiPoint side checks the Network Mask (section 10.5).", args) }); // s12.4.1.1, s12.4.1.4
    } else { // broadcast against NBMA
      later.push({ after: false, check: "network-type", stage: "routing", dropsAtA: false, dropsAtB: false, text: sayT("f.network.bcastNbma", "Network type: {a} runs {netA} and {b} runs {netB}. Both elect a Designated Router and describe the link as a transit network (RFC 2328 section 12.4.1.2), but the NBMA side sends Hellos only to neighbours configured on it (section 9.5.1), so whether they meet depends on that configuration and on the implementation.", args) }); // s9.5.1, s12.4.1.2
    } // pairs
  } // network types

  // ---- Where each side stops: the Hellos first, then the rest. ----
  let viewA: NeighborView; // how far A gets
  let viewB: NeighborView; // how far B gets
  if (dropsAtA && dropsAtB) { viewA = "none"; viewB = "none"; } // neither hears the other
  else if (dropsAtA) { viewA = "none"; viewB = "Init"; } // B hears A, but A never lists B
  else if (dropsAtB) { viewA = "Init"; viewB = "none"; } // A hears B, but B never lists A
  else { viewA = dbA; viewB = dbB; } // both pass: the later checks decide
  const helloOk = !dropsAtA && !dropsAtB; // whether the later checks are reached
  const unused = mixed && viewA === "Full" && viewB === "Full"; // adjacent, yet not used
  const drafts: (Draft & { reached: boolean })[] = [...helloDrafts.map((d) => ({ ...d, reached: true })), ...later.map(({ after, ...d }) => ({ ...d, reached: helloOk && !after }))]; // every mismatch, with whether the routers get that far

  // ---- Warnings about one side's own settings, notes, and the verdict. ----
  const warnings: EngineText[] = []; // in order
  for (const s of [A, B]) { // each side
    if (s.dead <= s.hello) warnings.push(sayT("warn.deadShort", "{side}: a RouterDeadInterval of {dead} s is not longer than its HelloInterval of {hello} s, so the neighbour can be declared down between two Hellos; RFC 2328 says it \"should be some multiple of the HelloInterval (say 4)\" (appendix C.3).", { side: s.name, dead: String(s.dead), hello: String(s.hello) })); // C.3
    if (s.auth === "simple") warnings.push(sayT("warn.simple", "{side}: a simple password travels in clear: \"Anyone with physical access to the network can learn the password\" (RFC 2328 appendix D.2).", { side: s.name })); // D.2
    if (s.auth === "md5") warnings.push(sayT("warn.md5", "{side}: Keyed-MD5 is kept for compatibility; RFC 5709 makes HMAC-SHA-256 the algorithm implementations MUST support (section 3).", { side: s.name })); // RFC 5709 s3
  } // sides
  const notes: EngineText[] = []; // in order
  const shortDead = [A, B].filter((s) => s.dead < 20).map((s) => s.name); // sides whose dead interval Huawei would not honour as set (a Hello below 5 s matters only through a dead interval below 20 s)
  notes.push(say("note.order", "Each router checks a received packet in a fixed order: the IP-level tests and the OSPF header (Area ID, authentication) for every packet, then the Hello's own fields, then, only between routers that become adjacent, the Database Description exchange (RFC 2328 sections 8.2, 10.5 and 10.6). The first failure decides, but every mismatch is listed here, because fixing one reveals the next.")); // the order
  if (version === 3) notes.push(say("note.v3", "In OSPFv3, neighbours are identified by Router ID on every link type, the Hello has no Network Mask, and the source address need not be on the link's subnet, because \"IPv6 OSPF runs per-link instead of per-IP-subnet\" (RFC 5340 sections 4.2.2 and 4.2.2.1).")); // v3
  if (A.rid === null || B.rid === null) notes.push(say("note.noRid", "A Router ID was not given, so the checks that need both (equal IDs, and who becomes Leader in ExStart) are reported only as far as they can be.")); // missing IDs
  if ((A.priority === null || B.priority === null) && (!P2P_LIKE.includes(A.network) || !P2P_LIKE.includes(B.network))) notes.push(say("note.noPriority", "A Router Priority was not given: the checker assumes at least one side can be Designated Router (priority above 0).")); // assumption
  if (A.auth !== "none" && B.auth !== "none") notes.push(say("note.sameKey", "The checker never asks for a key: it asks only whether the two keys are the same, and a share link never carries one.")); // privacy
  if (shortDead.length > 0) notes.push(sayT("note.dead20.huawei", "{list}: on a Huawei VRP switch (S5700/S6700 V200R025C00) a dead interval below 20 s does not take effect as set: \"the actual dead interval of an OSPF neighbor is not shorter than 20s\" (ospf timer dead; ospf timer hello says the same of a Hello below 5 s), unless ospf timer hello is given its conservative keyword.", { list: nameList(shortDead) })); // Huawei's 20 s floor
  notes.push(say("note.vlink", "Virtual links, NBMA neighbour lists, more than one key per interface and multiple areas on one link are outside this checker.")); // the model's limits
  const stalled = viewA !== "Full" || viewB !== "Full"; // any side short of Full
  const outcome: AdjacencyResult["outcome"] = viewA === "none" && viewB === "none" ? "none" : stalled ? "stalled" : unused ? "full-unused" : "full"; // the outcome
  const STATE_WORDS: Record<NeighborView, EngineText> = { none: say("state.none", "no neighbour"), Init: say("state.Init", "Init"), "2-Way": say("state.twoWay", "2-Way"), ExStart: say("state.ExStart", "ExStart"), Exchange: say("state.Exchange", "Exchange"), "ExStart or Exchange": say("state.either", "ExStart or Exchange"), Full: say("state.Full", "Full") }; // words for each view
  const state = (v: NeighborView): EngineText => STATE_WORDS[v]; // a view as a sentence
  const verdictText = outcome === "none" // the outcome
    ? say("verdict.none", "No neighbour forms: each router drops every Hello the other sends, so neither lists the other, not even in Init.") // the sentence when the condition holds
    : outcome === "stalled" // the next case
      ? sayT("verdict.stalled", "The adjacency stalls: {a} sees {b} as {viewA}, and {b} sees {a} as {viewB}.", { a: an, b: bn, viewA: state(viewA), viewB: state(viewB) }) // the sentence when the condition holds
      : outcome === "full-unused" // the next case
        ? say("verdict.unused", "Both reach Full, but the two ends describe the link differently, so the shortest-path calculation does not use it.") // the sentence when the condition holds
        : drafts.length === 0 // the next case
          ? say("verdict.full", "Nothing checked here differs: these two interfaces can reach Full.") // the sentence when the condition holds
          : say("verdict.fullNote", "These two interfaces can reach Full; read the note on what differs."); // otherwise this sentence
  const summary = (s: Side): SideSummary => ({ name: s.name, routerId: s.routerId, area: s.area, areaType: s.areaType, network: s.network, address: s.address, hello: s.hello, dead: s.dead, mtu: s.mtu, auth: s.auth, keyId: s.keyId, priority: s.priority, instance: s.instance }); // without the internal numbers
  return { // the reading
    mode: "adjacency", // the mode
    version, // 2 or 3
    a: summary(A), // router A
    b: summary(B), // router B
    findings: drafts.map((d) => ({ check: d.check, stage: d.stage, reached: d.reached, dropsAtA: d.dropsAtA, dropsAtB: d.dropsAtB, text: d.text, vendor: d.vendor ?? [] })), // every mismatch
    viewA, // A's view
    viewB, // B's view
    outcome, // the outcome
    verdictText, // in a sentence
    warnings, // warnings
    notes, // notes
  }; // the reading
} // adjacencyLocalisable

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The page's entry: either mode, sentences as EngineTexts.
 * @param r the request (its mode picks the computation)
 * @returns the reading
 */
export function runLocalisable(r: OspfRequest): OspfResult<EngineText> {
  if (r && typeof r === "object" && r.mode === "cost") return costLocalisable(r); // cost
  if (r && typeof r === "object" && r.mode === "adjacency") return adjacencyLocalisable(r); // adjacency
  throw inputError(say("err.mode", "Choose a mode: cost or adjacency.")); // no mode
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param r the request
 * @returns the reading as the API returns it
 */
export function run(r: OspfRequest): OspfResult {
  return plainText(runLocalisable(r)) as OspfResult; // sentences as their English
} // run

/**
 * The API's entry: the request body as JSON text.
 * @param input the JSON text
 * @returns the reading
 */
export function runApi(input: string): OspfResult {
  let parsed: unknown; // the body
  try { // attempt
    parsed = JSON.parse(input); // the object
  } catch { // refused
    throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode: cost or adjacency.")); // a readable refusal
  } // parsed
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode: cost or adjacency.")); // not an object
  return run(parsed as OspfRequest); // the same engine as the page
} // runApi
