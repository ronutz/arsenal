// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/stp-election-calculator/compute.ts
// ----------------------------------------------------------------------------
// SPANNING TREE ELECTION CALCULATOR - the pure, deterministic engine
// (08/11/2026, written for chapter 2.4 of the open course "LAN Switch
// Operations and Maintenance" and the Learn article
// spanning-tree-in-one-article).
//
// TWO QUESTIONS, TWO MODES.
//   election  For a small switched network described in a few lines of text
//             (bridges with a priority and a MAC address; links between
//             bridge ports with a speed or a cost), which bridge is the root,
//             which port of every other bridge is its root port, which port
//             is designated on every segment, and which ports are left as
//             alternate or backup ports, each step with the comparison that
//             decided it, in the order the course teaches (deck slide 258).
//   cost      For a link speed, the long (32-bit) and short (16-bit) port path
//             costs the documents read give, and each vendor's documented
//             default method and how to change it (costs.ts).
//
// THE RULES, each from a document read on 2026-11-08 (sources in index.ts):
//   - Bridge ID: a 4-bit priority, a 12-bit system ID extension and the
//     48-bit bridge address (IEEE 802.1Q RSTP YANG module, grouping
//     bridge-id); "On bridges supporting IEEE 802.1t or IEEE 802.1w,
//     permissible values are 0-61440, in steps of 4096" (RFC 4188
//     dot1dStpPriority; IEEE8021-SPANNING-TREE-MIB); the extension is the
//     VLAN ID in Cisco's per-VLAN trees ("a 12-bit extended system ID value
//     equal to the VLAN ID", Catalyst 9300 guide), and Arista's manual gives
//     the VLAN number for Rapid-PVST, the instance number for MST and 0 for
//     RST. The older 802.1D-1998 form is two octets of priority, 0 to 65535
//     (RFC 4188 dot1dStpPriority), as Extreme's dot1d priority mode and
//     RouterOS accept.
//   - Root bridge: "The bridge with the lowest bridge ID is elected as the
//     root bridge. If the bridge priorities are equal ..., the bridge with the
//     lowest MAC address is elected" (Juniper, spanning tree overview).
//   - Port ID: a 4-bit priority and a 12-bit port number (IEEE YANG, grouping
//     port-id); port priority 0 to 240 in steps of 16 on 802.1t bridges, and
//     one octet each of priority and port number in 802.1D-1998 (RFC 4188
//     dot1dStpPortPriority).
//   - Root path cost: the root's is 0; every other bridge's is "the sum of
//     the Port Path Costs on the least-cost path to the Root Bridge", the
//     receiving port's cost added to the cost the neighbour advertises
//     (MikroTik RouterOS 7.24, STP guide; IEEE YANG root-path-cost).
//   - Root port: the lowest root path cost; then the lowest bridge ID of the
//     upstream bridge; then the lowest port ID of the upstream port (MikroTik
//     RouterOS 7.24: "lowest Root port path cost, lowest bridge identifier,
//     and lowest bridge port ID in this particular order"); and, when two
//     ports of one bridge hear the same upstream port on a shared segment,
//     the lower port ID of the receiving port ("the interface with the lowest
//     interface number", Cisco Catalyst 9300 guide; "the port with the lower
//     interface number", Arista EOS manual).
//   - Designated port of a segment: the port whose bridge has the lowest root
//     path cost; then the lowest bridge ID ("If two bridges have the same path
//     cost to the root bridge, the bridge with the lowest bridge ID becomes
//     the designated bridge", Juniper); then the lowest port ID of that
//     bridge's ports on the segment (Cisco: "the port priority and port ID
//     are added together, and spanning tree disables the link with the highest
//     value"). Every port of the root bridge on its own segments is
//     designated, except a second port of the root on one segment.
//   - The rest: an alternate port receives the better BPDU from another
//     bridge, a backup port from another port of its own bridge on the same
//     segment ("A backup port can exist only where two or more bridge ports
//     connect to the same LAN for which the bridge serves as the designated
//     bridge", Juniper); both are "placed in the discarding state" (Juniper),
//     blocking in 802.1D's states (RFC 4188 dot1dStpPortState). Root and
//     designated ports forward. The port roles are those of the IEEE YANG
//     enumeration port-role (root, designated, alternate, backup).
//   - Port path costs (costs.ts): by speed from the method's documented
//     values, or typed on the link or the port; 1 to 200,000,000 (long) or 1
//     to 65,535 on a bridge using short costs (RFC 4188 dot1dStpPortPathCost
//     and ...PathCost32; Extreme: "the path cost range setting is 1 to
//     65,535" on 802.1D-1998 bridges).
//
// WHAT IT DOES NOT MODEL (said on the page): timers, convergence and the
// proposal and agreement handshake, edge ports, link types, topology changes,
// MSTP regions and instances, PVST+ beyond one VLAN's tree, failed links, and
// the guards (BPDU Guard, Root Guard, Loop Guard). It computes the stable
// result every bridge agrees on, not the order in which BPDUs arrive.
//
// PAGE LANGUAGE. Every sentence the engine writes is an EngineText
// (../engine-text.ts): runLocalisable() returns the reading with them in place
// (pack keys tools.stp-election-calculator.engine.<id>); run() and runApi()
// return plainText() of the same reading for the API and the golden vectors.
//
// Pure: no clock, no network, no randomness. Parsing uses anchored patterns
// with bounded repetition only (linear, ReDoS-safe), on text cut to the
// bounds below before any pattern runs.
// ============================================================================

import { say, plainText, withEngineText, listOf, EngineText, type EngineList } from "../engine-text"; // sentences with ids, lists, and the API's English projection
import { SPEEDS, VENDORS, MAX_COST, type CostMethod, type SpeedRow, type VendorRow } from "./costs"; // the documented cost tables and vendor defaults

export { SPEEDS, VENDORS, MAX_COST }; // re-exported for the page and the vectors
export type { CostMethod, SpeedRow, VendorRow, CostValue } from "./costs"; // and their shapes

// ----------------------------------------------------------------------------
// Bounds
// ----------------------------------------------------------------------------

/** The longest topology text the tool reads. */
export const MAX_TEXT = 4000; // characters
/** The most lines (including comments and blank lines). */
export const MAX_LINES = 80; // lines
/** The longest line. */
export const MAX_LINE = 200; // characters
/** The fewest bridges an election takes. */
export const MIN_BRIDGES = 2; // a root and one other
/** The most bridges the tool reads. */
export const MAX_BRIDGES = 16; // a small topology, readable on a phone
/** The most link lines. */
export const MAX_LINKS = 32; // segments
/** The most ports on one link line (more than two is a shared segment, a hub). */
export const MAX_SEGMENT_PORTS = 8; // ports
/** The most ports in all. */
export const MAX_PORTS = 128; // ports
/** The longest bridge name. */
export const MAX_NAME = 16; // characters
/** The longest speed text in cost mode. */
export const MAX_SPEED_TEXT = 24; // characters

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

/** The bridge priority formats: 802.1t's 4-bit priority with a system ID extension, or 802.1D-1998's 16 bits. */
export type PriorityFormat = "802.1t" | "802.1d"; // the two forms RFC 4188 describes

/** The port roles (IEEE 802.1Q YANG enumeration port-role, without disabled-port). */
export type PortRole = "root" | "designated" | "alternate" | "backup"; // the four roles a working port takes

/** What decided a comparison: the first field that differed from the runner-up's. */
export type Decider = "only" | "priority" | "mac" | "cost" | "senderBid" | "senderPort" | "receivingPort" | "bid" | "portId"; // the fields compared

/** Where a port's path cost came from. */
export type CostSource = "speed" | "link" | "port"; // the link's speed and the bridge's method, the link's cost, or a port line

/** The election-mode request. */
export interface ElectionRequest {
  /** Selects this mode. */
  mode: "election";
  /** The path cost method for link speeds: "long" (the default) or "short"; a bridge line may override it. */
  method?: CostMethod | string;
  /** The topology, one statement per line. */
  topology: string;
}

/** The cost-mode request. */
export interface CostRequest {
  /** Selects this mode. */
  mode: "cost";
  /** A link speed: a number and a unit, such as 1G, 100 Mb/s or 40 Gbps. */
  speed: string;
}

/** Any request. */
export type StpRequest = ElectionRequest | CostRequest; // the API body names its mode

/** One bridge of the reading, in the order entered. */
export interface BridgeRow {
  /** Its position as entered, from 0. */
  index: number;
  /** Its name. */
  name: string;
  /** The priority as typed. */
  priority: number;
  /** The system ID extension added to it (the VLAN, or 0). */
  extension: number;
  /** The two-octet priority field of the bridge ID: priority plus extension. */
  priorityField: number;
  /** The MAC address, upper-case hyphen form. */
  mac: string;
  /** The bridge ID as switches print it: priority field, a dot, then the MAC. */
  bridgeId: string;
  /** The bridge ID as 16 hexadecimal digits (two octets of priority field, six of MAC). */
  bridgeIdHex: string;
  /** The cost method its ports' speeds use. */
  method: CostMethod;
  /** Whether its bridge line set the method (rather than the page's choice). */
  methodSet: boolean;
  /** Its place in bridge ID order, from 1 (1 is the root). */
  rank: number;
  /** Whether it is the root bridge. */
  isRoot: boolean;
  /** Its root path cost (0 for the root). */
  rootPathCost: number;
  /** Its root port (port index), or null for the root. */
  rootPort: number | null;
}

/** One port of the reading. */
export interface PortRow {
  /** Its position, from 0, in the order the link lines name ports. */
  index: number;
  /** Its bridge (index). */
  bridge: number;
  /** Its bridge's name. */
  bridgeName: string;
  /** Its port number. */
  number: number;
  /** Its port priority. */
  priority: number;
  /** The port ID as switches print it: priority, a dot, the number (128.4). */
  portId: string;
  /** The port ID as one 16-bit number. */
  portIdValue: number;
  /** The segment it attaches to (index). */
  segment: number;
  /** Its port path cost. */
  cost: number;
  /** Where that cost came from. */
  costSource: CostSource;
  /** The speed it came from, when it came from a speed (the speed id, such as "1G"). */
  speed: string | null;
  /** Its role. */
  role: PortRole;
  /** Whether it forwards (root and designated ports) or discards (alternate and backup ports). */
  forwarding: boolean;
  /** The designated port of its segment (port index). */
  designatedPort: number;
}

/** One segment: a link between two ports, or a shared segment of more. */
export interface SegmentRow {
  /** Its position, from 0, in the order of the link lines. */
  index: number;
  /** The topology line that declared it, from 1. */
  line: number;
  /** Its label: the ports joined by " ↔ ". */
  label: string;
  /** Its ports (indices), as written. */
  ports: number[];
  /** Whether it is shared (more than two ports). */
  shared: boolean;
  /** Its speed id, or null when a cost was typed. */
  speed: string | null;
  /** The cost typed on the link, or null when a speed was given. */
  linkCost: number | null;
  /** Its designated port (port index). */
  designatedPort: number;
  /** What decided the designated port. */
  decidedBy: Decider;
}

/** A port's claim to be its segment's designated port. */
export interface DesignatedCandidate {
  /** The port (index). */
  port: number;
  /** Its bridge's root path cost. */
  rootPathCost: number;
  /** Its bridge ID. */
  bridgeId: string;
  /** Its port ID. */
  portId: string;
}

/** A port's claim to be its bridge's root port: the BPDU it hears, with its own cost added. */
export interface RootPortCandidate {
  /** The receiving port (index). */
  port: number;
  /** The port it hears: its segment's designated port (index). */
  from: number;
  /** The sender's bridge name. */
  senderName: string;
  /** The root path cost the sender advertises. */
  senderCost: number;
  /** This port's path cost. */
  portCost: number;
  /** The root path cost through this port: the two added. */
  total: number;
  /** The sender's bridge ID. */
  senderBid: string;
  /** The sender's port ID. */
  senderPortId: string;
  /** This port's own port ID. */
  ownPortId: string;
}

/** The root bridge step. */
export interface RootStep<S = string> {
  /** The root (bridge index). */
  root: number;
  /** Bridge indices in bridge ID order. */
  ranking: number[];
  /** What separated the root from the runner-up: priority or mac. */
  decidedBy: Decider;
  /** The step in a sentence. */
  text: S;
}

/** One non-root bridge's root port step. */
export interface RootPortStep<S = string> {
  /** The bridge (index). */
  bridge: number;
  /** Its root port (port index). */
  rootPort: number;
  /** Its root path cost. */
  rootPathCost: number;
  /** What decided it. */
  decidedBy: Decider;
  /** Every port that hears another bridge, best first. */
  candidates: RootPortCandidate[];
  /** The step in a sentence. */
  text: S;
}

/** One segment's designated port step. */
export interface DesignatedStep<S = string> {
  /** The segment (index). */
  segment: number;
  /** Its designated port (port index). */
  designatedPort: number;
  /** What decided it. */
  decidedBy: Decider;
  /** Every port on the segment, best first. */
  candidates: DesignatedCandidate[];
  /** The step in a sentence. */
  text: S;
}

/** One port left out of the active topology. */
export interface BlockedStep<S = string> {
  /** The port (index). */
  port: number;
  /** alternate or backup. */
  role: "alternate" | "backup";
  /** The step in a sentence. */
  text: S;
}

/** The election-mode reading. S: string for the API, EngineText for the page. */
export interface ElectionResult<S = string> {
  /** The mode. */
  mode: "election";
  /** The page's method (a bridge line may override it). */
  method: CostMethod;
  /** Whether the method is the default because none was given. */
  methodDefault: boolean;
  /** The bridge priority format. */
  priorityFormat: PriorityFormat;
  /** The VLAN whose tree this is (the system ID extension), or null. */
  vlan: number | null;
  /** Every bridge, in the order entered. */
  bridges: BridgeRow[];
  /** Every port, in the order the link lines name them. */
  ports: PortRow[];
  /** Every segment, in the order of the link lines. */
  segments: SegmentRow[];
  /** The root bridge (index). */
  root: number;
  /** Step 1: the root bridge. */
  rootStep: RootStep<S>;
  /** Step 2: each non-root bridge's root port, in bridge ID order. */
  rootPortSteps: RootPortStep<S>[];
  /** Step 3: each segment's designated port, in link order. */
  designatedSteps: DesignatedStep<S>[];
  /** Step 4: the ports that discard, in port order. */
  blockedSteps: BlockedStep<S>[];
  /** Counts of each role. */
  counts: Record<PortRole, number>;
  /** The outcome in a sentence. */
  verdictText: S;
  /** Warnings. */
  warnings: S[];
  /** Notes. */
  notes: S[];
}

/** One vendor row of the cost reading, with its value at the speed asked when its documents give one. */
export interface CostVendorRow<S = string> extends VendorRow {
  /** The vendor's documented value at this speed for its default method, or null when its documents read give none. */
  valueAtSpeed: number | null;
  /** The row in a sentence. */
  text: S;
}

/** The cost-mode reading. */
export interface CostResult<S = string> {
  /** The mode. */
  mode: "cost";
  /** The speed row asked for. */
  speed: SpeedRow;
  /** Every speed row (for the page's table). */
  table: readonly SpeedRow[];
  /** Every vendor the course covers. */
  vendors: CostVendorRow<S>[];
  /** The outcome in a sentence. */
  verdictText: S;
  /** Notes. */
  notes: S[];
}

/** Any reading. */
export type StpResult<S = string> = ElectionResult<S> | CostResult<S>; // by mode

/** An input the engine refuses: its message is the English, its sentence travels with it for the page. */
export class StpInputError extends Error {
  /**
   * @param m the sentence the message is the English of
   */
  constructor(m: EngineText) {
    super(m.text); // the English, which is all the API reads
    this.name = "StpInputError"; // a readable name in stack traces
  } // constructor
} // StpInputError

/**
 * Throw-ready input error carrying its sentence.
 * @param m the sentence
 * @returns the error
 */
function inputError(m: EngineText): StpInputError {
  return withEngineText(new StpInputError(m), m); // the class, the English message, and the sentence
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
  return a.items.map((i) => i.text).join(typeof a.sep === "string" ? a.sep : a.sep.text); // a list, joined as the English joins it
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

/**
 * A refusal tied to a topology line.
 * @param line the line number, from 1
 * @param m the reason
 * @returns the error to throw
 */
function lineError(line: number, m: EngineText): StpInputError {
  return inputError(sayT("err.atLine", "Line {line}: {message}", { line: String(line), message: m })); // the line, then the reason
} // lineError

// ----------------------------------------------------------------------------
// Small parsers (anchored, bounded)
// ----------------------------------------------------------------------------

/** A bridge name: a letter, then up to 15 letters, digits, dots, hyphens or underscores. */
const NAME_RE = /^[A-Za-z][A-Za-z0-9._-]{0,15}$/; // anchored, bounded
/** A whole number of at most nine digits. */
const INT_RE = /^[0-9]{1,9}$/; // anchored, bounded
/** A MAC address with colons or hyphens. */
const MAC_SEP_RE = /^([0-9A-Fa-f]{2})([:-])([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})$/; // six octets, one separator
/** A MAC address in three dotted groups of four. */
const MAC_DOT_RE = /^([0-9A-Fa-f]{4})\.([0-9A-Fa-f]{4})\.([0-9A-Fa-f]{4})$/; // Cisco's form
/** A MAC address as twelve bare hexadecimal digits (as Juniper prints it inside a bridge ID). */
const MAC_BARE_RE = /^[0-9A-Fa-f]{12}$/; // no separators
/** A port endpoint: bridge name, a colon, a port number. */
const ENDPOINT_RE = /^([A-Za-z][A-Za-z0-9._-]{0,15}):([0-9]{1,5})$/; // anchored, bounded
/** A speed: a number with up to three decimals, an optional space, and a unit. */
const SPEED_RE = /^([0-9]{1,5})(?:[.,]([0-9]{1,3}))?\s?(mbps|mbit\/s|mb\/s|mb|m|gbps|gbit\/s|gb\/s|gb|g|tbps|tbit\/s|tb\/s|tb|t)$/i; // anchored, bounded

/**
 * A MAC address as a 48-bit number, or null when the text is not one.
 * @param s the text
 * @returns the number (exact: below 2^53) or null
 */
export function parseMac(s: string): number | null {
  let hex: string | null = null; // twelve hex digits
  const a = MAC_SEP_RE.exec(s); // colons or hyphens
  if (a) hex = a[1] + a[3] + a[4] + a[5] + a[6] + a[7]; // the six octets
  const b = MAC_DOT_RE.exec(s); // dotted
  if (b) hex = b[1] + b[2] + b[3]; // the three groups
  if (MAC_BARE_RE.test(s)) hex = s; // bare digits
  return hex === null ? null : parseInt(hex, 16); // 48 bits fit exactly in a double
} // parseMac

/**
 * A 48-bit MAC address in the upper-case hyphen form RFC 9542 writes.
 * @param v the number
 * @returns 00-00-5E-00-53-01
 */
export function macText(v: number): string {
  const hex = v.toString(16).toUpperCase().padStart(12, "0"); // twelve digits
  return hex.match(/../g)!.join("-"); // six octets
} // macText

/**
 * A speed text as megabits per second, or null when it is not a number with a unit.
 * @param s the text
 * @returns the speed in Mb/s (rounded to a whole number) or null
 */
export function parseSpeed(s: string): number | null {
  const m = SPEED_RE.exec(s.trim()); // number and unit
  if (!m) return null; // not a speed
  const unit = m[3].toLowerCase()[0]; // m, g or t
  const scale = unit === "m" ? 1 : unit === "g" ? 1000 : 1000000; // to Mb/s
  const frac = m[2] ?? ""; // the decimals
  const milli = Number(m[1]) * 1000 + Number(frac.padEnd(3, "0") || "0"); // thousandths of the unit, exactly
  return (milli * scale) / 1000; // Mb/s (a whole number for every documented speed)
} // parseSpeed

/**
 * The documented row of a speed, or null.
 * @param mbps the speed in Mb/s
 * @returns the row or null
 */
export function speedRow(mbps: number): SpeedRow | null {
  return SPEEDS.find((r) => r.mbps === mbps) ?? null; // exact match only
} // speedRow

/** The documented speeds as one list for a refusal. */
const SPEED_LIST = SPEEDS.map((r) => r.id).join(", "); // 10M, 100M, ...

// ----------------------------------------------------------------------------
// The topology: parsing
// ----------------------------------------------------------------------------

/** A bridge as parsed. */
interface PBridge {
  /** As entered, from 0. */
  index: number;
  /** Its name. */
  name: string;
  /** Its priority. */
  priority: number;
  /** Its MAC as a number. */
  mac: number;
  /** Its method, when its line sets one. */
  method: CostMethod | null;
  /** Its line. */
  line: number;
}

/** A port as parsed. */
interface PPort {
  /** From 0, in link order. */
  index: number;
  /** Its bridge. */
  bridge: number;
  /** Its number. */
  number: number;
  /** Its priority (128 unless a port line sets it). */
  priority: number;
  /** Its segment. */
  segment: number;
  /** A cost from a port line, or null. */
  costOverride: number | null;
  /** Whether a port line set its priority. */
  priorityLine: number | null;
}

/** A segment as parsed. */
interface PSegment {
  /** From 0. */
  index: number;
  /** Its line. */
  line: number;
  /** Its ports. */
  ports: number[];
  /** Its speed row, or null. */
  speed: SpeedRow | null;
  /** The speed text as typed, for refusals. */
  speedText: string | null;
  /** Its typed cost, or null. */
  cost: number | null;
}

/** The parsed topology. */
interface Topology {
  /** The bridges. */
  bridges: PBridge[];
  /** The ports. */
  ports: PPort[];
  /** The segments. */
  segments: PSegment[];
  /** The VLAN, or null. */
  vlan: number | null;
  /** The priority format. */
  format: PriorityFormat;
}

/**
 * A whole number from a token, or null.
 * @param s the token
 * @returns the number or null
 */
function intOf(s: string): number | null {
  return INT_RE.test(s) ? Number(s) : null; // digits only
} // intOf

/**
 * Read the topology text into bridges, ports and segments, refusing anything out of shape with the line and the reason.
 * @param text the topology
 * @returns the parsed topology
 */
function parseTopology(text: string): Topology {
  if (typeof text !== "string" || text.trim() === "") throw inputError(say("err.empty", "Describe the topology: one bridge line per switch (bridge SW1 32768 00-00-5E-00-53-01: a name, a priority and a MAC address) and one link line per cable (link SW1:1 SW2:1 1G: two ports and a speed).")); // nothing typed
  if (text.length > MAX_TEXT) throw inputError(sayT("err.tooLong", "The topology is {length} characters long; the tool reads at most {max}.", { length: String(text.length), max: String(MAX_TEXT) })); // bounded
  const lines = text.replace(/\r/g, "").split("\n"); // one statement per line
  if (lines.length > MAX_LINES) throw inputError(sayT("err.tooManyLines", "The topology has {count} lines; the tool reads at most {max}.", { count: String(lines.length), max: String(MAX_LINES) })); // bounded
  const statements: { line: number; words: string[] }[] = []; // the lines that say something
  lines.forEach((raw, i) => { // each line
    if (raw.length > MAX_LINE) throw lineError(i + 1, sayT("err.lineTooLong", "the line is longer than {max} characters.", { max: String(MAX_LINE) })); // bounded before any pattern
    const body = raw.split("#")[0].trim(); // a comment runs to the end of the line
    if (body !== "") statements.push({ line: i + 1, words: body.split(/[ \t]+/) }); // the words
  }); // lines
  let format: PriorityFormat = "802.1t"; // the default form
  let vlan: number | null = null; // no VLAN unless a line names one
  let vlanLine = 0; // where it was named
  let formatLine = 0; // where the format was named
  // Pass 1: the format and the VLAN, which every bridge line depends on.
  for (const st of statements) { // each statement
    const kw = st.words[0].toLowerCase(); // its keyword
    if (kw === "priority-format") { // the bridge priority format
      if (formatLine) throw lineError(st.line, sayT("err.twice", "{keyword} is given twice (first on line {first}).", { keyword: "priority-format", first: String(formatLine) })); // once
      const v = (st.words[1] ?? "").toLowerCase(); // its value
      if (st.words.length !== 2 || (v !== "802.1t" && v !== "802.1d")) throw lineError(st.line, say("err.format", "Write priority-format 802.1t (a priority in steps of 4096 with the system ID extension, the default) or priority-format 802.1d (the 16-bit priority of 802.1D-1998, 0 to 65535).")); // two forms
      format = v; // the form
      formatLine = st.line; // remembered
    } else if (kw === "vlan") { // the VLAN whose tree this is
      if (vlanLine) throw lineError(st.line, sayT("err.twice", "{keyword} is given twice (first on line {first}).", { keyword: "vlan", first: String(vlanLine) })); // once
      const v = st.words.length === 2 ? intOf(st.words[1]) : null; // its number
      if (v === null || v < 1 || v > 4094) throw lineError(st.line, say("err.vlan", "Write vlan followed by a VLAN ID from 1 to 4094; its number becomes the system ID extension of every bridge ID.")); // 1 to 4094
      vlan = v; // the VLAN
      vlanLine = st.line; // remembered
    } // keywords
  } // pass 1
  if (format === "802.1d" && vlan !== null) throw lineError(vlanLine, say("err.vlanWith8021d", "A vlan line needs the 802.1t priority format: the 802.1D-1998 bridge ID has two octets of priority and no system ID extension to carry the VLAN (RFC 4188, dot1dStpPriority).")); // no extension in the old form
  // Pass 2: the bridges.
  const bridges: PBridge[] = []; // in order
  const byName = new Map<string, PBridge>(); // by lower-case name
  for (const st of statements) { // each statement
    if (st.words[0].toLowerCase() !== "bridge") continue; // bridges only
    const w = st.words; // the words
    if (w.length < 4 || w.length > 5) throw lineError(st.line, say("err.bridgeShape", "A bridge line is the word bridge, a name, a priority and a MAC address (bridge SW1 32768 00-00-5E-00-53-01), then optionally long or short for that bridge's path cost method.")); // the shape
    if (!NAME_RE.test(w[1])) throw lineError(st.line, sayT("err.bridgeName", "\"{name}\" is not a bridge name: start with a letter, then up to 15 letters, digits, dots, hyphens or underscores.", { name: w[1].slice(0, 32) })); // the name
    const key = w[1].toLowerCase(); // names compare without case
    const prior = byName.get(key); // already declared
    if (prior) throw lineError(st.line, sayT("err.bridgeDup", "A bridge called {name} is already declared on line {first}.", { name: w[1], first: String(prior.line) })); // one each
    const prio = intOf(w[2]); // the priority
    if (prio === null) throw lineError(st.line, sayT("err.priorityNotNumber", "{name}: \"{value}\" is not a bridge priority; write a whole number.", { name: w[1], value: w[2].slice(0, 16) })); // digits
    if (format === "802.1t") { // the 802.1t form
      if (prio > 61440 || prio % 4096 !== 0) throw lineError(st.line, sayT("err.priority8021t", "{name}: priority {value} is not a multiple of 4096 from 0 to 61440. With the system ID extension the priority keeps only four bits (RFC 4188, dot1dStpPriority: \"0-61440, in steps of 4096\"). For a bridge that uses the 16-bit priority of 802.1D-1998, add the line priority-format 802.1d.", { name: w[1], value: String(prio) })); // steps of 4096
    } else if (prio > 65535) { // the 802.1D-1998 form
      throw lineError(st.line, sayT("err.priority8021d", "{name}: priority {value} does not fit the two octets of an 802.1D-1998 bridge priority (0 to 65535, RFC 4188).", { name: w[1], value: String(prio) })); // 16 bits
    } // format
    const mac = parseMac(w[3]); // the bridge address
    if (mac === null) throw lineError(st.line, sayT("err.mac", "{name}: \"{value}\" is not a MAC address; write six octets with colons or hyphens (00-00-5E-00-53-01), three dotted groups (0000.5e00.5301) or twelve hexadecimal digits.", { name: w[1], value: w[3].slice(0, 32) })); // the address
    let method: CostMethod | null = null; // the bridge's own method
    if (w.length === 5) { // a method word
      const m = w[4].toLowerCase(); // the word
      if (m !== "long" && m !== "short") throw lineError(st.line, sayT("err.bridgeMethod", "{name}: \"{value}\" is not a path cost method; write long or short after the MAC address, or nothing.", { name: w[1], value: w[4].slice(0, 16) })); // two methods
      method = m; // the method
    } // method word
    const b: PBridge = { index: bridges.length, name: w[1], priority: prio, mac, method, line: st.line }; // the bridge
    bridges.push(b); // kept
    byName.set(key, b); // indexed
  } // bridges
  if (bridges.length < MIN_BRIDGES || bridges.length > MAX_BRIDGES) throw inputError(sayT("err.bridgeCount", "The topology declares {count} bridges; the tool elects among {min} to {max}.", { count: String(bridges.length), min: String(MIN_BRIDGES), max: String(MAX_BRIDGES) })); // bounded
  for (let i = 0; i < bridges.length; i++) for (let j = i + 1; j < bridges.length; j++) { // pairs
    if (bridges[i].mac === bridges[j].mac) throw lineError(bridges[j].line, sayT("err.macDup", "{second} has the same MAC address as {first}, {mac}. The bridge address is the part of the bridge ID that makes it unique (RFC 4188, dot1dBaseBridgeAddress: \"referred to in a unique fashion\"), so two bridges never share it, and with equal priorities their bridge IDs would be the same.", { first: bridges[i].name, second: bridges[j].name, mac: macText(bridges[j].mac) })); // unique addresses
  } // pairs
  // Pass 3: the links.
  const ports: PPort[] = []; // in order
  const segments: PSegment[] = []; // in order
  const portAt = new Map<string, PPort>(); // "bridge:number" to the port
  const portLine = new Map<PPort, number>(); // where each port was named
  for (const st of statements) { // each statement
    if (st.words[0].toLowerCase() !== "link") continue; // links only
    const w = st.words.slice(1); // after the keyword
    let speed: SpeedRow | null = null; // the speed row
    let speedText: string | null = null; // as typed
    let cost: number | null = null; // or a typed cost
    let ends: string[]; // the endpoint words
    if (w.length >= 2 && w[w.length - 2].toLowerCase() === "cost") { // a typed cost
      const c = intOf(w[w.length - 1]); // its value
      if (c === null || c < 1 || c > MAX_COST.long) throw lineError(st.line, sayT("err.linkCost", "\"{value}\" is not a port path cost: write a whole number from 1 to 200000000 (RFC 4188, dot1dStpPortPathCost32).", { value: w[w.length - 1].slice(0, 16) })); // 1 to 200,000,000
      cost = c; // the cost
      ends = w.slice(0, -2); // the endpoints
    } else { // a speed
      const last = w[w.length - 1] ?? ""; // the speed word
      if (w.length < 1 || ENDPOINT_RE.test(last)) throw lineError(st.line, say("err.linkShape", "A link line is the word link, two ports and a speed (link SW1:1 SW2:1 1G), or two ports and a typed cost (link SW1:1 SW2:1 cost 4000); list more than two ports for a shared segment.")); // no speed
      const mbps = parseSpeed(last); // the speed
      if (mbps === null) throw lineError(st.line, sayT("err.speedForm", "\"{value}\" is not a speed: write a number and a unit, such as 100M, 1G or 10G, or write the word cost and a number.", { value: last.slice(0, 24) })); // not a speed
      speed = speedRow(mbps); // the documented row
      if (!speed) throw lineError(st.line, sayT("err.speedUnknown", "No document read for this tool gives a port path cost for {value}; the speeds it knows are {list}. Write the word cost and the number your switches use instead.", { value: last.slice(0, 24), list: SPEED_LIST })); // undocumented speed
      speedText = last; // as typed
      ends = w.slice(0, -1); // the endpoints
    } // cost or speed
    if (ends.length < 2 || ends.length > MAX_SEGMENT_PORTS) throw lineError(st.line, sayT("err.linkPorts", "A link joins 2 to {max} ports (more than two is a shared segment); this one lists {count}.", { max: String(MAX_SEGMENT_PORTS), count: String(ends.length) })); // bounded
    if (segments.length >= MAX_LINKS) throw lineError(st.line, sayT("err.linkCount", "The tool reads at most {max} links.", { max: String(MAX_LINKS) })); // bounded
    const seg: PSegment = { index: segments.length, line: st.line, ports: [], speed, speedText, cost }; // the segment
    for (const e of ends) { // each endpoint
      const m = ENDPOINT_RE.exec(e); // bridge:port
      if (!m) throw lineError(st.line, sayT("err.endpoint", "\"{value}\" is not a port: write the bridge's name, a colon and the port number, such as SW1:24.", { value: e.slice(0, 24) })); // the shape
      const b = byName.get(m[1].toLowerCase()); // its bridge
      if (!b) throw lineError(st.line, sayT("err.unknownBridge", "{value} names a bridge, {name}, that no bridge line declares.", { value: e, name: m[1] })); // unknown bridge
      const num = Number(m[2]); // the port number
      const maxPort = format === "802.1t" ? 4095 : 255; // 12 bits, or one octet
      if (num < 1 || num > maxPort) throw lineError(st.line, sayT(format === "802.1t" ? "err.portNumber8021t" : "err.portNumber8021d", format === "802.1t" ? "{value}: the port number must be from 1 to 4095, the twelve bits of an 802.1t port ID (IEEE 802.1Q YANG, port-id)." : "{value}: the port number must be from 1 to 255, the one octet of an 802.1D-1998 port ID (RFC 4188, dot1dStpPortPriority).", { value: e })); // bounded
      const key = `${b.index}:${num}`; // the port's key
      const prev = portAt.get(key); // already used
      if (prev) throw lineError(st.line, sayT("err.portTwice", "{bridge}:{number} is already on the link of line {first}: a port attaches to one segment.", { bridge: b.name, number: String(num), first: String(portLine.get(prev)) })); // one segment per port
      if (ports.length >= MAX_PORTS) throw lineError(st.line, sayT("err.portCount", "The tool reads at most {max} ports in all.", { max: String(MAX_PORTS) })); // bounded
      const p: PPort = { index: ports.length, bridge: b.index, number: num, priority: 128, segment: seg.index, costOverride: null, priorityLine: null }; // the port, at the default priority
      ports.push(p); // kept
      portAt.set(key, p); // indexed
      portLine.set(p, st.line); // its line
      seg.ports.push(p.index); // on the segment
    } // endpoints
    if (cost !== null) for (const pi of seg.ports) { // a typed cost on a short-method bridge
      const b = bridges[ports[pi].bridge]; // the port's bridge
      if (b.method === "short" && cost > MAX_COST.short) throw lineError(st.line, sayT("err.costShortBridge", "{bridge} uses short path costs, whose range is 1 to 65535 (RFC 4188, dot1dStpPortPathCost; Extreme: \"the path cost range setting is 1 to 65,535\" on 802.1D-1998 bridges), so it cannot take cost {value}.", { bridge: b.name, value: String(cost) })); // 16 bits
    } // short bridges
    segments.push(seg); // kept
  } // links
  if (segments.length === 0) throw inputError(say("err.noLinks", "The topology has bridges but no link lines: write one link line per cable, such as link SW1:1 SW2:1 1G.")); // nothing joined
  // Pass 4: port lines, and anything unknown.
  for (const st of statements) { // each statement
    const kw = st.words[0].toLowerCase(); // its keyword
    if (kw === "bridge" || kw === "link" || kw === "vlan" || kw === "priority-format") continue; // done
    if (kw !== "port") throw lineError(st.line, sayT("err.keyword", "\"{word}\" is not a statement this tool reads: start each line with bridge, link, port, vlan or priority-format (a # starts a comment).", { word: st.words[0].slice(0, 24) })); // unknown
    const w = st.words; // the words
    if (w.length !== 4 && w.length !== 6) throw lineError(st.line, say("err.portShape", "A port line is the word port, a port and a priority (port SW1:2 priority 64), a cost (port SW1:2 cost 4000), or both pairs.")); // the shape
    const m = ENDPOINT_RE.exec(w[1]); // the port
    if (!m) throw lineError(st.line, sayT("err.endpoint", "\"{value}\" is not a port: write the bridge's name, a colon and the port number, such as SW1:24.", { value: w[1].slice(0, 24) })); // the shape
    const b = byName.get(m[1].toLowerCase()); // its bridge
    if (!b) throw lineError(st.line, sayT("err.unknownBridge", "{value} names a bridge, {name}, that no bridge line declares.", { value: w[1], name: m[1] })); // unknown bridge
    const p = portAt.get(`${b.index}:${Number(m[2])}`); // the port
    if (!p) throw lineError(st.line, sayT("err.portUnknown", "{value} is not on any link line; a port line sets a port that a link uses.", { value: w[1] })); // not linked
    for (let k = 2; k < w.length; k += 2) { // each pair
      const what = w[k].toLowerCase(); // priority or cost
      const v = intOf(w[k + 1]); // the value
      if (what === "priority") { // a port priority
        if (p.priorityLine !== null) throw lineError(st.line, sayT("err.portPriorityTwice", "{value} already has a priority from line {first}.", { value: w[1], first: String(p.priorityLine) })); // once
        if (format === "802.1t" && (v === null || v > 240 || v % 16 !== 0)) throw lineError(st.line, sayT("err.portPriority8021t", "{value}: a port priority is a multiple of 16 from 0 to 240 (RFC 4188, dot1dStpPortPriority: \"0-240, in steps of 16\").", { value: w[1] })); // steps of 16
        if (format === "802.1d" && (v === null || v > 255)) throw lineError(st.line, sayT("err.portPriority8021d", "{value}: an 802.1D-1998 port priority is one octet, 0 to 255 (RFC 4188, dot1dStpPortPriority).", { value: w[1] })); // one octet
        p.priority = v as number; // set
        p.priorityLine = st.line; // remembered
      } else if (what === "cost") { // a port path cost
        if (p.costOverride !== null) throw lineError(st.line, sayT("err.portCostTwice", "{value} already has a cost on this line.", { value: w[1] })); // once per line
        const max = b.method === "short" ? MAX_COST.short : MAX_COST.long; // the bridge's range
        if (v === null || v < 1 || v > max) throw lineError(st.line, sayT("err.portCost", "{value}: the port path cost must be a whole number from 1 to {max}.", { value: w[1], max: String(max) })); // the range
        p.costOverride = v; // set
      } else { // neither
        throw lineError(st.line, say("err.portShape", "A port line is the word port, a port and a priority (port SW1:2 priority 64), a cost (port SW1:2 cost 4000), or both pairs.")); // the shape
      } // pair
    } // pairs
  } // port lines
  return { bridges, ports, segments, vlan, format }; // parsed
} // parseTopology

// ----------------------------------------------------------------------------
// The election
// ----------------------------------------------------------------------------

/**
 * Compare two bridge IDs: the two-octet priority field first, then the MAC address.
 * @param a one bridge's [field, mac]
 * @param b another's
 * @returns negative when a is lower (better)
 */
function cmpBid(a: readonly [number, number], b: readonly [number, number]): number {
  return a[0] - b[0] || a[1] - b[1]; // priority field, then address
} // cmpBid

/**
 * The election-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function electionLocalisable(r: ElectionRequest): ElectionResult<EngineText> {
  // ---- The page's method. ----
  const mText = r.method === undefined || r.method === null || String(r.method).trim() === "" ? null : String(r.method).trim().toLowerCase(); // as given
  if (mText !== null && mText !== "long" && mText !== "short") throw inputError(say("err.method", "Choose the path cost method: long (the 32-bit values of 802.1t and 802.1D-2004) or short (the 16-bit values of 802.1D-1998).")); // two methods
  const method: CostMethod = mText === "short" ? "short" : "long"; // long by default
  const topo = parseTopology(r.topology); // parsed and validated
  const { bridges: pb, ports: pp, segments: ps, vlan, format } = topo; // its parts
  const ext = vlan ?? 0; // the system ID extension
  const bmethod = (b: PBridge): CostMethod => b.method ?? method; // a bridge's own method, else the page's

  // ---- Port path costs. ----
  const portCost: number[] = []; // by port
  const costSrc: CostSource[] = []; // by port
  for (const p of pp) { // each port
    const seg = ps[p.segment]; // its segment
    const b = pb[p.bridge]; // its bridge
    if (p.costOverride !== null) { portCost.push(p.costOverride); costSrc.push("port"); continue; } // a port line
    if (seg.cost !== null) { portCost.push(seg.cost); costSrc.push("link"); continue; } // a typed link cost
    const row = seg.speed as SpeedRow; // the speed row
    const v = bmethod(b) === "long" ? row.long : row.short; // the method's documented value
    if (!v) throw lineError(seg.line, sayT("err.speedNoShort", "{bridge} uses short path costs, and no document read for this tool gives a short cost for {speed} (they give one up to 100 Gb/s). Type a cost on this link, or use long costs.", { bridge: b.name, speed: row.label })); // undocumented
    portCost.push(v.value); // the cost
    costSrc.push("speed"); // from the speed
  } // ports

  // ---- Connectivity: every bridge must reach every other. ----
  const portsOf: number[][] = pb.map(() => []); // each bridge's ports
  for (const p of pp) portsOf[p.bridge].push(p.index); // grouped
  const reach = new Set<number>([0]); // from the first bridge
  const queue = [0]; // breadth first
  while (queue.length) { // until done
    const x = queue.shift() as number; // the next bridge
    for (const pi of portsOf[x]) for (const qi of ps[pp[pi].segment].ports) { // its neighbours
      const y = pp[qi].bridge; // a bridge on the same segment
      if (!reach.has(y)) { reach.add(y); queue.push(y); } // newly reached
    } // neighbours
  } // search
  if (reach.size < pb.length) { // some bridge is cut off
    const inside = pb.filter((b) => reach.has(b.index)).map((b) => b.name); // with the first bridge
    const outside = pb.filter((b) => !reach.has(b.index)).map((b) => b.name); // the rest
    throw inputError(sayT("err.disconnected", "The topology is not connected: {outside} cannot reach {inside} over any link. Each separate part would elect its own root, so the tool computes one connected network at a time.", { outside: nameList(outside), inside: nameList(inside) })); // one network
  } // connected

  // ---- Step 1: the root bridge, the lowest bridge ID. ----
  const bid = (i: number): [number, number] => [pb[i].priority + ext, pb[i].mac]; // priority field and address
  const ranking = pb.map((b) => b.index).sort((a, c) => cmpBid(bid(a), bid(c))); // lowest first
  const root = ranking[0]; // the root
  const runner = ranking[1]; // the next lowest
  const rootBy: Decider = bid(root)[0] !== bid(runner)[0] ? "priority" : "mac"; // what separated them
  const bidText = (i: number): string => `${pb[i].priority + ext}.${macText(pb[i].mac)}`; // as switches print it

  // ---- Root path costs (shortest paths, the receiving port's cost added). ----
  const INF = Number.POSITIVE_INFINITY; // not yet reached
  const dist = pb.map(() => INF); // by bridge
  dist[root] = 0; // the root's own
  const done = new Set<number>(); // settled bridges
  while (done.size < pb.length) { // Dijkstra over at most 16 bridges
    let x = -1; // the nearest unsettled bridge
    for (const b of pb) if (!done.has(b.index) && (x === -1 || dist[b.index] < dist[x])) x = b.index; // pick it
    done.add(x); // settled
    for (const pi of portsOf[x]) for (const qi of ps[pp[pi].segment].ports) { // every port sharing a segment with x
      const y = pp[qi].bridge; // its bridge
      if (y === x) continue; // x's own other ports
      const d = dist[x] + portCost[qi]; // through y's receiving port
      if (d < dist[y]) dist[y] = d; // shorter
    } // relax
  } // settled

  // ---- Step 3 (computed before the root ports need it): each segment's designated port. ----
  const pid = (p: PPort): number => p.priority * 256 + p.number; // the 16-bit port ID (both formats)
  const pidText = (p: PPort): string => `${p.priority}.${p.number}`; // as switches print it
  /** A port's claim on its segment: root path cost, bridge ID, port ID. */
  const dvec = (p: PPort): [number, number, number, number] => [dist[p.bridge], ...bid(p.bridge), pid(p)] as [number, number, number, number]; // the designated priority vector without the root ID
  const cmpD = (a: PPort, c: PPort): number => { const u = dvec(a); const v = dvec(c); return u[0] - v[0] || u[1] - v[1] || u[2] - v[2] || u[3] - v[3]; }; // lexicographic
  const designated: number[] = []; // by segment
  const dDecider: Decider[] = []; // by segment
  const dCands: PPort[][] = []; // by segment, best first
  for (const s of ps) { // each segment
    const cands = s.ports.map((i) => pp[i]).sort(cmpD); // best first
    const w = cands[0]; // the designated port
    const o = cands[1]; // the runner-up
    const dw = dvec(w); // its vector
    const dv = dvec(o); // the runner-up's
    designated.push(w.index); // kept
    dDecider.push(dw[0] !== dv[0] ? "cost" : dw[1] !== dv[1] || dw[2] !== dv[2] ? "bid" : "portId"); // the first field that differs
    dCands.push(cands); // kept
  } // segments

  // ---- Step 2: each non-root bridge's root port. ----
  /** What a port hears: the designated port of its segment, with this port's cost added. */
  const rvec = (q: PPort): [number, number, number, number, number] => { const d = pp[designated[q.segment]]; const [f, m] = bid(d.bridge); return [dist[d.bridge] + portCost[q.index], f, m, pid(d), pid(q)]; }; // the root path priority vector, without the root ID
  const cmpR = (a: PPort, c: PPort): number => { const u = rvec(a); const v = rvec(c); return u[0] - v[0] || u[1] - v[1] || u[2] - v[2] || u[3] - v[3] || u[4] - v[4]; }; // lexicographic
  const rootPort: (number | null)[] = pb.map(() => null); // by bridge
  const rDecider: (Decider | null)[] = pb.map(() => null); // by bridge
  const rCands: PPort[][] = pb.map(() => []); // by bridge, best first
  for (const b of pb) { // each bridge
    if (b.index === root) continue; // the root has none
    const hearing = portsOf[b.index].map((i) => pp[i]).filter((q) => pp[designated[q.segment]].bridge !== b.index).sort(cmpR); // ports that hear another bridge, best first
    const w = hearing[0]; // the root port (connectivity guarantees one)
    rootPort[b.index] = w.index; // kept
    rCands[b.index] = hearing; // kept
    if (hearing.length === 1) { rDecider[b.index] = "only"; } // a single way to the root
    else { // compare with the runner-up
      const u = rvec(w); // the winner's vector
      const v = rvec(hearing[1]); // the runner-up's
      rDecider[b.index] = u[0] !== v[0] ? "cost" : u[1] !== v[1] || u[2] !== v[2] ? "senderBid" : u[3] !== v[3] ? "senderPort" : "receivingPort"; // the first field that differs
    } // decided
    if (rvec(w)[0] !== dist[b.index]) throw new Error("stp-election-calculator: root port cost differs from the shortest path"); // an invariant; unreachable
  } // bridges

  // ---- Roles. ----
  const role: PortRole[] = pp.map((p) => { // each port
    const d = designated[p.segment]; // its segment's designated port
    if (d === p.index) return "designated"; // it is
    if (rootPort[p.bridge] === p.index) return "root"; // its bridge's root port
    return pp[d].bridge === p.bridge ? "backup" : "alternate"; // the better BPDU from its own bridge, or another
  }); // roles

  // ---- Sentences. ----
  const nm = (i: number): string => pb[i].name; // a bridge's name
  const pn = (p: PPort): string => `${nm(p.bridge)}:${p.number}`; // a port's name
  const rootB = pb[root]; // the root
  const allSamePriority = pb.every((b) => b.priority === rootB.priority); // whether priorities decided nothing
  const rootText = rootBy === "priority"
    ? sayT("step.root.priority", "{root} is the root bridge: its bridge ID, {bid}, is the lowest, and its priority field, {field}, is lower than the next bridge's, {next} ({nextField}), so the MAC address is not needed.", { root: rootB.name, bid: bidText(root), field: String(bid(root)[0]), next: nm(runner), nextField: String(bid(runner)[0]) })
    : sayT("step.root.mac", "{root} is the root bridge: its priority field, {field}, ties with {next}'s, and its MAC address, {mac}, is the lower, so its bridge ID, {bid}, is the lowest.", { root: rootB.name, field: String(bid(root)[0]), next: nm(runner), mac: macText(rootB.mac), bid: bidText(root) }); // decided by the address
  const rootStep: RootStep<EngineText> = { root, ranking, decidedBy: rootBy, text: rootText }; // step 1

  const rootPortSteps: RootPortStep<EngineText>[] = []; // step 2, in bridge ID order
  for (const bi of ranking) { // each bridge
    if (bi === root) continue; // not the root
    const hearing = rCands[bi]; // its candidates
    const w = hearing[0]; // the root port
    const sender = pp[designated[w.segment]]; // whom it hears
    const cands: RootPortCandidate[] = hearing.map((q) => { const d = pp[designated[q.segment]]; return { port: q.index, from: d.index, senderName: nm(d.bridge), senderCost: dist[d.bridge], portCost: portCost[q.index], total: dist[d.bridge] + portCost[q.index], senderBid: bidText(d.bridge), senderPortId: pidText(d), ownPortId: pidText(q) }; }); // each claim
    const by = rDecider[bi] as Decider; // what decided
    const o = hearing[1]; // the runner-up, if any
    const os = o ? pp[designated[o.segment]] : null; // its sender
    const base = { bridge: nm(bi), port: pn(w), cost: String(dist[bi]), sender: pn(sender), senderCost: String(dist[sender.bridge]), portCost: String(portCost[w.index]) }; // shared values
    let text: EngineText; // the sentence
    if (by === "only") text = sayT("step.rp.only", "{bridge} hears another bridge on one port only, {port}: it is the root port, at root path cost {cost} ({sender} advertises {senderCost}, and {port} adds {portCost}).", base);
    else if (by === "cost") text = sayT("step.rp.cost", "{bridge}: {port} has the lowest root path cost, {cost} ({sender} advertises {senderCost}, and {port} adds {portCost}); the next best, {other}, would cost {otherCost}. {port} is the root port.", { ...base, other: pn(o), otherCost: String(dist[(os as PPort).bridge] + portCost[o.index]) });
    else if (by === "senderBid") text = sayT("step.rp.senderBid", "{bridge}: {port} and {other} both reach the root at cost {cost}. The BPDU on {port} comes from {senderBridge}, bridge ID {senderBid}, lower than {otherBridge}'s, {otherBid}, so {port} is the root port.", { ...base, other: pn(o), senderBridge: nm(sender.bridge), senderBid: bidText(sender.bridge), otherBridge: nm((os as PPort).bridge), otherBid: bidText((os as PPort).bridge) });
    else if (by === "senderPort") text = sayT("step.rp.senderPort", "{bridge}: {port} and {other} both hear {senderBridge} at cost {cost}. {senderBridge} sends to {port} from port ID {senderPid} and to {other} from {otherPid}; the lower sender port ID wins, so {port} is the root port.", { ...base, other: pn(o), senderBridge: nm(sender.bridge), senderPid: pidText(sender), otherPid: pidText(os as PPort) });
    else text = sayT("step.rp.receivingPort", "{bridge}: {port} and {other} hear the same port, {sender}, at cost {cost}, on a shared segment. Their own port IDs decide: {ownPid} against {otherPid}, so {port} is the root port.", { ...base, other: pn(o), ownPid: pidText(w), otherPid: pidText(o) });
    rootPortSteps.push({ bridge: bi, rootPort: w.index, rootPathCost: dist[bi], decidedBy: by, candidates: cands, text }); // kept
  } // step 2

  const segLabel = (s: PSegment): string => s.ports.map((i) => pn(pp[i])).join(" ↔ "); // B1:1 ↔ B2:1
  const designatedSteps: DesignatedStep<EngineText>[] = ps.map((s) => { // step 3
    const cands = dCands[s.index]; // best first
    const w = cands[0]; // the designated port
    const o = cands[1]; // the runner-up
    const by = dDecider[s.index]; // what decided
    const v = { segment: segLabel(s), port: pn(w), bridge: nm(w.bridge), cost: String(dist[w.bridge]), other: pn(o), otherBridge: nm(o.bridge), otherCost: String(dist[o.bridge]) }; // shared values
    let text: EngineText; // the sentence
    if (by === "cost" && w.bridge === root) text = sayT("step.dp.root", "{segment}: {bridge} is the root, at root path cost 0, so its port {port} is designated.", v);
    else if (by === "cost") text = sayT("step.dp.cost", "{segment}: {bridge} reaches the root at {cost}, less than {otherBridge} at {otherCost}, so {port} is designated.", v);
    else if (by === "bid") text = sayT("step.dp.bid", "{segment}: {bridge} and {otherBridge} both reach the root at {cost}; {bridge}'s bridge ID, {bid}, is the lower (against {otherBid}), so {port} is designated.", { ...v, bid: bidText(w.bridge), otherBid: bidText(o.bridge) });
    else text = sayT("step.dp.portId", "{segment}: two ports of {bridge} are on this segment, {port} and {other}; {port} has the lower port ID, {pid} against {otherPid}, and is designated.", { ...v, pid: pidText(w), otherPid: pidText(o) });
    return { segment: s.index, designatedPort: w.index, decidedBy: by, candidates: cands.map((q) => ({ port: q.index, rootPathCost: dist[q.bridge], bridgeId: bidText(q.bridge), portId: pidText(q) })), text }; // the step
  }); // step 3

  const blockedSteps: BlockedStep<EngineText>[] = []; // step 4
  for (const p of pp) { // each port
    const rl = role[p.index]; // its role
    if (rl !== "alternate" && rl !== "backup") continue; // forwarding
    const d = pp[designated[p.segment]]; // the port it hears
    const rp = rootPort[p.bridge]; // its bridge's root port
    const v = { port: pn(p), bridge: nm(p.bridge), sender: pn(d), rootPort: rp === null ? "" : pn(pp[rp]) }; // shared values
    const text = rl === "backup" // the root's ports are designated or backup, so an alternate port always has a root port beside it
      ? sayT("step.block.backup", "{port} is a backup port: the better BPDU it hears comes from {sender}, another port of {bridge} on the same segment, so it discards and stands by for that designated port.", v)
      : sayT("step.block.alternate", "{port} is an alternate port: {sender} is designated on its segment and {bridge} already reaches the root through {rootPort}, so it discards, a ready second path if {rootPort} fails.", v); // another bridge's BPDU
    blockedSteps.push({ port: p.index, role: rl, text }); // kept
  } // step 4

  // ---- Rows. ----
  const rankOf = new Map(ranking.map((b, i) => [b, i + 1])); // 1 is the root
  const bridges: BridgeRow[] = pb.map((b) => ({
    index: b.index, // as entered
    name: b.name, // its name
    priority: b.priority, // as typed
    extension: ext, // the VLAN or 0
    priorityField: b.priority + ext, // the two octets
    mac: macText(b.mac), // hyphen form
    bridgeId: bidText(b.index), // printed form
    bridgeIdHex: (b.priority + ext).toString(16).toUpperCase().padStart(4, "0") + b.mac.toString(16).toUpperCase().padStart(12, "0"), // eight octets
    method: bmethod(b), // its method
    methodSet: b.method !== null, // from its line
    rank: rankOf.get(b.index) as number, // in bridge ID order
    isRoot: b.index === root, // the root
    rootPathCost: dist[b.index], // its cost
    rootPort: rootPort[b.index], // its root port
  })); // bridges
  const ports: PortRow[] = pp.map((p) => ({
    index: p.index, // in link order
    bridge: p.bridge, // its bridge
    bridgeName: nm(p.bridge), // its name
    number: p.number, // its number
    priority: p.priority, // its priority
    portId: pidText(p), // printed
    portIdValue: pid(p), // 16 bits
    segment: p.segment, // its segment
    cost: portCost[p.index], // its cost
    costSource: costSrc[p.index], // from where
    speed: costSrc[p.index] === "speed" ? (ps[p.segment].speed as SpeedRow).id : null, // the speed id
    role: role[p.index], // its role
    forwarding: role[p.index] === "root" || role[p.index] === "designated", // forwards
    designatedPort: designated[p.segment], // its segment's designated port
  })); // ports
  const segments: SegmentRow[] = ps.map((s) => ({ index: s.index, line: s.line, label: segLabel(s), ports: [...s.ports], shared: s.ports.length > 2, speed: s.speed ? s.speed.id : null, linkCost: s.cost, designatedPort: designated[s.index], decidedBy: dDecider[s.index] })); // segments
  const counts: Record<PortRole, number> = { root: 0, designated: 0, alternate: 0, backup: 0 }; // by role
  for (const rl of role) counts[rl] += 1; // counted

  // ---- Verdict, warnings, notes. ----
  const verdictText = sayT("verdict", "{root} is the root bridge. Forwarding: root ports {rootPorts}, designated ports {designatedPorts}. Discarding: alternate ports {alternates}, backup ports {backups}.", { root: rootB.name, rootPorts: String(counts.root), designatedPorts: String(counts.designated), alternates: String(counts.alternate), backups: String(counts.backup) }); // the outcome, counts after their labels (no plural forms needed)
  const warnings: EngineText[] = []; // in order
  const speedMethods = new Set(pp.filter((p) => costSrc[p.index] === "speed").map((p) => bmethod(pb[p.bridge]))); // the methods behind speed-derived costs
  if (speedMethods.size > 1) { // a mixed network
    const shortOnes = pb.filter((b) => bmethod(b) === "short").map((b) => b.name); // the short bridges
    const longOnes = pb.filter((b) => bmethod(b) === "long").map((b) => b.name); // the long bridges
    warnings.push(sayT("warn.mixed", "Path cost methods are mixed: short on {short}, long on {long}. A short-cost bridge advertises a root path cost thousands of times smaller, so paths through it look cheapest whatever their speed: Extreme warns that \"an 802.1D-1998 compliant bridge could become the most favorable transit path\", and Cisco's case 225591 fixed a root inconsistency by changing a switch from short to long. Set one method on every switch.", { short: nameList(shortOnes), long: nameList(longOnes) })); // Extreme, Cisco 225591
  } // mixed
  if (rootBy === "mac" && allSamePriority) warnings.push(sayT("warn.rootByMac", "Every bridge has priority {priority}, so the lowest MAC address chose the root, {root}, by accident rather than design. The course's advice is to lower the intended root's priority on purpose (4096, for example).", { priority: String(rootB.priority), root: rootB.name })); // chosen by accident
  for (const b of pb) if (Math.floor(b.mac / 2 ** 40) % 2 === 1) warnings.push(sayT("warn.groupMac", "{name}'s MAC address, {mac}, has the group (multicast) bit set: \"If it is zero, the MAC address is unicast\" (RFC 9542, section 2.1.1), and a bridge's own address is a unicast one. The election still compares it as a number.", { name: b.name, mac: macText(b.mac) })); // the M bit
  const notes: EngineText[] = []; // in order
  notes.push(mText === null
    ? say("note.methodDefault", "No path cost method was chosen, so link speeds use the long (32-bit) values; choose short for 802.1D-1998 bridges.")
    : method === "long"
      ? say("note.methodLong", "Link speeds use the long (32-bit) path costs of 802.1t, kept in 802.1D-2004: 2000000 for 10 Mb/s down to 2000 for 10 Gb/s.")
      : say("note.methodShort", "Link speeds use the short (16-bit) path costs of 802.1D-1998: 100 for 10 Mb/s, 19 for 100 Mb/s, 4 for 1 Gb/s and 2 for 10 Gb/s.")); // the method
  if (vlan !== null) notes.push(sayT("note.vlan", "VLAN {vlan} is added to every priority as the 12-bit system ID extension, as in Cisco's per-VLAN trees (\"a 12-bit extended system ID value equal to the VLAN ID\"): a bridge at priority 32768 has the priority field {example}.", { vlan: String(vlan), example: String(32768 + vlan) })); // the extension
  else if (format === "802.1t") notes.push(say("note.noVlan", "No vlan line: the system ID extension is 0, as in a single RSTP tree (Arista's manual gives the VLAN number for Rapid-PVST, the instance number for MST and 0 for RST). Add a vlan line (vlan 10) to compute one VLAN's tree as Cisco's Rapid PVST+ does.")); // no extension
  if (format === "802.1d") notes.push(say("note.format8021d", "priority-format 802.1d: bridge priorities are the two octets of 802.1D-1998 (0 to 65535), port priorities one octet and port numbers one octet (RFC 4188).")); // the old form
  if (pb.some((b) => b.method !== null)) notes.push(say("note.bridgeMethod", "A bridge line that ends in long or short uses that method for its own ports' speeds; the cost a port adds is always its own bridge's.")); // per-bridge methods
  if (ps.some((s) => s.ports.length > 2)) notes.push(say("note.shared", "A link line with more than two ports is a shared segment, as through a hub: one port on it is designated and every other port on it hears that one.")); // shared segments
  notes.push(say("note.states", "Root and designated ports forward. Alternate and backup ports are \"placed in the discarding state\" in RSTP (Juniper); classic 802.1D calls the same state blocking (RFC 4188, dot1dStpPortState).")); // the states
  notes.push(say("note.model", "The tool computes the stable result every bridge agrees on. It does not model timers and convergence, the proposal and agreement handshake, edge ports, link types, topology changes, MSTP regions and instances, failed links, or BPDU Guard, Root Guard and Loop Guard.")); // what it does not model
  return {
    mode: "election", // the mode
    method, // the page's method
    methodDefault: mText === null, // the default was used
    priorityFormat: format, // the format
    vlan, // the VLAN or null
    bridges, // rows
    ports, // rows
    segments, // rows
    root, // the root
    rootStep, // step 1
    rootPortSteps, // step 2
    designatedSteps, // step 3
    blockedSteps, // step 4
    counts, // by role
    verdictText, // the outcome
    warnings, // warnings
    notes, // notes
  }; // the reading
} // electionLocalisable

// ----------------------------------------------------------------------------
// Cost mode
// ----------------------------------------------------------------------------

/**
 * The cost-mode reading with sentences as EngineTexts (the page's entry).
 * @param r the request
 * @returns the reading
 */
export function costLocalisable(r: CostRequest): CostResult<EngineText> {
  const raw = typeof r.speed === "string" ? r.speed : String(r.speed ?? ""); // as given
  if (raw.trim() === "") throw inputError(say("err.speedEmpty", "Type a link speed, such as 1G, 100M or 40G.")); // nothing typed
  if (raw.length > MAX_SPEED_TEXT) throw inputError(sayT("err.speedTooLong", "A speed is at most {max} characters, such as 100 Mb/s.", { max: String(MAX_SPEED_TEXT) })); // bounded
  const mbps = parseSpeed(raw); // the speed
  if (mbps === null) throw inputError(sayT("err.speedFormCost", "\"{value}\" is not a speed: write a number and a unit, such as 100M, 1G, 40 Gb/s or 1T.", { value: raw.trim() })); // not a speed
  const row = speedRow(mbps); // the documented row
  if (!row) throw inputError(sayT("err.speedUnknownCost", "No document read for this tool gives a port path cost for {value}; the speeds it knows are {list}. A switch at another speed still has a cost: read it with its own show command.", { value: raw.trim(), list: SPEED_LIST })); // undocumented
  const vendors: CostVendorRow<EngineText>[] = VENDORS.map((v) => { // each vendor
    const at = (v.defaultMethod === "long" || v.defaultMethod === "conflict") && row.long && row.long.sources.some((s) => v.sources.includes(s)) ? row.long.value : null; // the value the vendor's own defaults table lists at this speed
    let text: EngineText; // the row's sentence
    switch (v.id) { // each vendor's documented behaviour
      case "extreme-se": text = say("vendor.extreme-se", "Long values by default since ExtremeXOS 11.6 (2,000,000 for 10 Mb/s down to 2,000 for 10 Gb/s; ExtremeXOS 11.5 and earlier used 100, 19, 4 and 2). There is no method switch: to match an 802.1D-1998 bridge, Extreme's advice is to type the old value on the port, 19 instead of 200,000 for 100 Mb/s."); break; // configure stpd ports cost
      case "extreme-fe": text = say("vendor.extreme-fe", "spanning-tree mstp pathcost-type sets the default path cost type to 16 or 32 bits; \"The default is 32 bits.\""); break; // Fabric Engine 9.4
      case "cisco": text = say("vendor.cisco", "The documents disagree. The Catalyst 9300 command reference (17.18 and 26.x) gives spanning-tree pathcost method a \"Command Default\" of short, and the configuration guides and the IOS XE 17 STP guide say \"The short path cost method is the default STP path cost method used\"; yet the guides' default-configuration tables list the long values (20000 for 1 Gbps), and the command reference's own show spanning-tree examples print \"Configured Pathcost method used is long\" and a port path cost of 20000. Read a switch's method with show spanning-tree summary, and pin it on every switch: spanning-tree pathcost method long, the change Cisco's case 225591 made."); break; // the conflict, with the command reference read in a browser on 2026-11-08
      case "aruba": text = say("vendor.aruba", "Long values by speed (10 Mbps 2,000,000 to 1 Tbps 20); the AOS-CX page read gives no command to change the method, only spanning-tree cost on the port (1 to 200,000,000)."); break; // AOS-CX 10.16
      case "juniper": text = say("vendor.juniper", "\"The link cost is determined by the link speed\", with no method statement in the pages read; the example output of show spanning-tree interface prints 20000 on a ge- (1 Gb/s) interface and 2000 on an xe- (10 Gb/s) one."); break; // Junos
      case "mikrotik": text = say("vendor.mikrotik", "port-cost-mode on the bridge, long or short, \"Default: long\"; RouterOS before 7.13 gave every port 10 whatever its speed."); break; // RouterOS 7.24
      case "arista": text = say("vendor.arista", "\"1 gigabit interfaces have a default cost of 20000\" and 10 gigabit ones 2000; no method setting appears in the manual read, only spanning-tree cost on the interface."); break; // EOS 4.37.0F
      default: text = say("vendor.huawei", "\"By default, the IEEE 802.1t is used to calculate the path cost\": the long values. stp pathcost-standard switches to dot1d-1998 (the short values) or to Huawei's own legacy scale (20 for 1 Gb/s, 2 for 10 Gb/s), and changing it puts every port's typed cost back to the default. Huawei's table gives one less for full duplex at 10 and 100 Mb/s (1,999,999 and 199,999 long, 99 and 18 short) and lower costs for aggregated links, so a Huawei port at those speeds can differ from the table here."); break; // Huawei S5700 and S6700 V200R025C00, stp pathcost-standard and stp cost, read in a browser on 2026-11-08
    } // vendors
    return { ...v, valueAtSpeed: at, text }; // the row
  }); // vendors
  const verdictText = row.short
    ? sayT("cost.verdict", "{speed}: long (32-bit) cost {long}, short (16-bit) cost {short}.", { speed: row.label, long: String(row.long?.value), short: String(row.short.value) })
    : sayT("cost.verdictNoShort", "{speed}: long (32-bit) cost {long}; no document read gives a short (16-bit) cost for it.", { speed: row.label, long: String(row.long?.value) }); // the outcome
  const notes: EngineText[] = []; // in order
  notes.push(say("cost.note.scales", "The long values are the 32-bit ones of 802.1t, kept in 802.1D-2004 (1 to 200,000,000, RFC 4188 dot1dStpPortPathCost32); the short ones are 802.1D-1998's 16-bit values (1 to 65,535, dot1dStpPortPathCost). Both fall as the speed rises, \"in inverse proportion to the speed of the attached LAN\".")); // RFC 4188
  if (row.mbps > 10000) notes.push(say("cost.note.fast", "Above 10 Gb/s the documents read agree less: the short values come from MikroTik's table (and, at 40 Gb/s, Huawei's), and some long ones from one or two vendors; each value lists the documents that give it.")); // fewer sources
  notes.push(say("cost.note.mixed", "Whatever the method, every switch in one network should use the same one: a short-cost switch advertises root path costs thousands of times smaller than a long-cost neighbour, and the tree bends towards it.")); // the advice
  return { mode: "cost", speed: row, table: SPEEDS, vendors, verdictText, notes }; // the reading
} // costLocalisable

// ----------------------------------------------------------------------------
// Entry points
// ----------------------------------------------------------------------------

/**
 * The page's entry: either mode, sentences as EngineTexts.
 * @param r the request (its mode picks the computation)
 * @returns the reading
 */
export function runLocalisable(r: StpRequest): StpResult<EngineText> {
  if (r && typeof r === "object" && r.mode === "election") return electionLocalisable(r); // the election
  if (r && typeof r === "object" && r.mode === "cost") return costLocalisable(r); // the cost lookup
  throw inputError(say("err.mode", "Choose a mode: election or cost.")); // no mode
} // runLocalisable

/**
 * The engine's public entry (the golden vectors' and the registry's): the same reading, every sentence as its English.
 * @param r the request
 * @returns the reading as the API returns it
 */
export function run(r: StpRequest): StpResult {
  return plainText(runLocalisable(r)) as StpResult; // sentences as their English
} // run

/**
 * The API's entry: the request body as JSON text.
 * @param input the JSON text
 * @returns the reading
 */
export function runApi(input: string): StpResult {
  let parsed: unknown; // the body
  try {
    parsed = JSON.parse(input); // the object
  } catch {
    throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode, election or cost.")); // a readable refusal
  } // parsed
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw inputError(say("err.json", "The request body is not valid JSON: send one JSON object that names its mode, election or cost.")); // not an object
  return run(parsed as StpRequest); // the same engine as the page
} // runApi
