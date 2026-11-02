// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vrrp-timer-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the VRRP timer, virtual MAC and election
// calculator (posture "input-caution", the manifest's shareSafetyDefault
// "fragment": in election mode the router names and primary addresses name
// infrastructure on a private network, so the popover adds the tool's caution
// line there; priorities, intervals and VRIDs name nothing). A form with
// nothing to paste (ROLLOUT 11.3): the link carries named values only, after
// the "#", the fields of the mode shown as typed:
//   always      mode (timers, election or mac), version (3 or 2)
//   timers      priority; interval when typed
//   election    routers, one router per line, "<name> <priority> <address>"
//               and " owner" for the owner, "*" for a field left blank;
//               preempt (1 or 0); interval when typed
//   mac         vrid, family (ipv4 or ipv6)
// A link exists once the page shows a reading; an input the engine refuses has
// none. The other modes' fields are not carried.
//
// Arrival (useShareArrival in VrrpTimerCalculatorTool): the mode, the version
// and the mode's fields are set as typing would set them (an absent interval
// is blank, which the engine reads as the RFC's default; an absent preempt is
// on, the RFC's default), the other modes keep their values, and the page
// computes. An unknown mode, version, preempt value or family, a field of
// another mode, a missing required field, a value over two lines (routers
// excepted), or a router list that is not 2 to 8 lines of three or four words
// makes the whole share malformed. Field text is otherwise left to the engine,
// which refuses a bad priority, address or VRID with its own message, exactly
// as typing would.
// ============================================================================

import { run, MIN_ROUTERS, MAX_ROUTERS, type VrrpRequest } from "./compute"; // the page's own engine, to know whether there is a reading
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** One router as the form holds it. */
export interface RouterForm {
  /** Its name as typed ("" for the engine's R1, R2 ...). */
  name: string;
  /** Its priority as typed ("" for an owner's 255). */
  priority: string;
  /** Its primary address as typed. */
  address: string;
  /** Whether it owns the virtual address. */
  owner: boolean;
}

/** The state an arrival restores and the page encodes. */
export type VrrpShareState =
  | { mode: "timers"; version: "3" | "2"; priority: string; interval: string } // one router's timers
  | { mode: "election"; version: "3" | "2"; interval: string; preempt: boolean; routers: RouterForm[] } // the election
  | { mode: "mac"; version: "3" | "2"; vrid: string; family: "ipv4" | "ipv6" }; // the virtual MAC

/** The fields only each mode carries. */
const ONLY: Readonly<Record<VrrpShareState["mode"], readonly string[]>> = Object.freeze({
  timers: ["priority"], // interval is shared with election
  election: ["routers", "preempt"], // interval is shared with timers
  mac: ["vrid", "family"], // MAC only
}); // by mode

/** The blank-field marker in a router line (no name or priority ever reads "*"). */
const BLANK = "*"; // a field left blank

/**
 * The engine request for a state, as the page builds it.
 * @param s the state
 * @returns the request
 */
export function requestOf(s: VrrpShareState): VrrpRequest {
  if (s.mode === "timers") return { mode: "timers", version: s.version, priority: s.priority, interval: s.interval }; // timers
  if (s.mode === "mac") return { mode: "mac", version: s.version, vrid: s.vrid, family: s.family }; // the MAC
  return { mode: "election", version: s.version, interval: s.interval, preempt: s.preempt, routers: s.routers.map((r) => ({ name: r.name, priority: r.priority, address: r.address, owner: r.owner })) }; // the election
} // requestOf

/**
 * The routers as the link's text: one per line, "<name> <priority> <address>" and " owner", "*" for a blank field.
 * @param routers the rows
 * @returns the text
 */
export function routersText(routers: readonly RouterForm[]): string {
  return routers.map((r) => [r.name.trim() || BLANK, r.priority.trim() || BLANK, r.address.trim(), ...(r.owner ? ["owner"] : [])].join(" ")).join("\n"); // one line each
} // routersText

/**
 * The link's router text back to rows, strictly.
 * @param text the value
 * @returns the rows, or null when it is not 2 to 8 lines of three or four words
 */
export function parseRoutersText(text: string): RouterForm[] | null {
  const lines = text.split("\n"); // one router per line
  if (lines.length < MIN_ROUTERS || lines.length > MAX_ROUTERS) return null; // the engine's bounds
  const out: RouterForm[] = []; // the rows
  for (const line of lines) { // each
    if (line.length > 128) return null; // a line is short: name, priority, address, owner
    const w = line.split(" "); // single spaces, as encode writes them
    if (w.length < 3 || w.length > 4 || w.some((x) => x === "")) return null; // three or four words
    if (w.length === 4 && w[3] !== "owner") return null; // the fourth word marks the owner
    out.push({ name: w[0] === BLANK ? "" : w[0], priority: w[1] === BLANK ? "" : w[1], address: w[2], owner: w.length === 4 }); // the row
  } // lines
  return out; // the rows
} // parseRoutersText

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param computed whether the page has a reading (false while blank or refused)
 * @returns the mode's fields, or nothing
 */
export function encodeVrrpShare(s: VrrpShareState, computed: boolean): ShareEncoding {
  if (!computed) return { ok: false, reason: "empty" }; // no reading: nothing to share
  const params: Record<string, string> = { mode: s.mode, version: s.version }; // always
  if (s.mode === "timers") { // timers
    params.priority = s.priority; // required
    if (s.interval.trim() !== "") params.interval = s.interval; // when typed
  } else if (s.mode === "election") { // the election
    params.routers = routersText(s.routers); // required
    params.preempt = s.preempt ? "1" : "0"; // always written
    if (s.interval.trim() !== "") params.interval = s.interval; // when typed
  } else { // the MAC
    params.vrid = s.vrid; // required
    params.family = s.family; // always written
  } // modes
  return { ok: true, params }; // the values
} // encodeVrrpShare

/** The spec. */
export const VRRP_SHARE: ShareSpec<VrrpShareState> = Object.freeze({
  tool: "vrrp-timer-calculator", // the slug
  posture: "input-caution", // the election's names and addresses name a private network
  carriesKey: "share.carries", // tools.vrrp-timer-calculator.share.carries
  names: ["mode", "version", "priority", "interval", "routers", "preempt", "vrid", "family"], // a form: no input (11.3)
  /** The mode's fields, or nothing (the spec asks the engine itself whether there is a reading). */
  encode(s: VrrpShareState): ShareEncoding {
    let computed = false; // whether the engine reads the fields
    try { computed = !!run(requestOf(s)); } catch { computed = false; } // the engine throws on what it refuses
    return encodeVrrpShare(s, computed); // encoded
  },
  /** The mode's fields, strictly: enumerations from the page's own choices, required fields present, one line each. */
  decode(v: Readonly<Record<string, string | null>>): VrrpShareState | null {
    const has = (n: string): boolean => v[n] !== null && v[n] !== undefined; // carried
    const text = (n: string): string => v[n] ?? ""; // as typed, "" when absent
    const filled = (n: string): boolean => has(n) && text(n).trim() !== ""; // present and not blank
    if (["priority", "interval", "preempt", "vrid", "family", "version"].some((n) => /[\r\n]/.test(text(n)))) return null; // one line each (the router list excepted)
    const version = v.version ?? "3"; // version 3 when absent
    if (version !== "3" && version !== "2") return null; // an unknown version
    const mode = v.mode; // the mode
    if (mode !== "timers" && mode !== "election" && mode !== "mac") return null; // an unknown or missing mode
    const others = (Object.keys(ONLY) as VrrpShareState["mode"][]).filter((m) => m !== mode).flatMap((m) => ONLY[m]); // the other modes' fields
    if (others.some(has)) return null; // a field of another mode
    if (mode === "timers") { // timers
      if (!filled("priority")) return null; // the priority is required
      return { mode, version, priority: text("priority"), interval: text("interval") }; // the state
    } // timers
    if (mode === "mac") { // the MAC
      if (has("interval") || !filled("vrid")) return null; // no interval here; the VRID is required
      const family = v.family ?? "ipv4"; // IPv4 when absent
      if (family !== "ipv4" && family !== "ipv6") return null; // an unknown family
      return { mode, version, vrid: text("vrid"), family }; // the state
    } // mac
    const preempt = v.preempt ?? "1"; // on when absent, the RFC's default
    if (preempt !== "1" && preempt !== "0") return null; // a switch is 1 or 0
    if (!filled("routers")) return null; // the routers are required
    const routers = parseRoutersText(text("routers").replace(/\r/g, "")); // the rows
    if (!routers) return null; // not a router list
    return { mode, version, interval: text("interval"), preempt: preempt === "1", routers }; // the state
  },
});
