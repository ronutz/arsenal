// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/snmp-counter-wrap-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the SNMP interface counter wrap and rate
// calculator (posture "input", the manifest's shareSafetyDefault "param":
// interface speeds, percentages, intervals, counter values and times name
// nothing about the reader). A form with nothing to paste (ROLLOUT 11.3): the
// link carries named values only, after the "#", the fields of the mode shown
// as typed:
//   always      mode (wrap or rate), width (32 or 64), kind (octets or packets)
//   wrap        speed; utilisation and poll when typed
//   rate        first, second, firsttime, secondtime, timeunit (s or ticks);
//               speed when typed
//   packets     packetsize when typed (never with octets)
// A link exists once the page shows a reading; an input the engine refuses has
// none. The other mode's fields are not carried.
//
// Arrival (useShareArrival in SnmpCounterWrapCalculatorTool): the mode, the
// counter and the mode's fields are set as typing would set them (an absent
// optional field is blank, which the engine reads as its default: 100 %, no
// poll interval, 84 octets, no speed), the other mode keeps its values, and
// the page computes. An unknown mode, width, kind or time unit, a field of the
// other mode, a packet size with octets, a missing required field or a value
// over two lines makes the whole share malformed. Field text is otherwise left
// to the engine, which refuses a malformed speed or reading with its own
// message, exactly as typing would.
// ============================================================================

import { run, type CounterRequest } from "./compute"; // the page's own engine, to know whether there is a reading
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The counter, shared by both modes. */
interface CounterFields {
  /** "32" or "64". */
  width: "32" | "64";
  /** "octets" or "packets". */
  kind: "octets" | "packets";
  /** Packets only: octets of line time per packet, as typed ("" for the default 84). */
  packetSize: string;
}

/** The state an arrival restores and the page encodes. */
export type SnmpCounterShareState =
  | (CounterFields & { mode: "wrap"; speed: string; utilisation: string; poll: string }) // wrap time
  | (CounterFields & { mode: "rate"; first: string; second: string; firstTime: string; secondTime: string; timeUnit: "s" | "ticks"; speed: string }); // rate from two readings

/** The fields only wrap mode carries. */
const WRAP_ONLY = ["utilisation", "poll"] as const; // speed is shared
/** The fields only rate mode carries. */
const RATE_ONLY = ["first", "second", "firsttime", "secondtime", "timeunit"] as const; // speed is shared

/**
 * The engine request for a state, as the page builds it.
 * @param s the state
 * @returns the request
 */
export function requestOf(s: SnmpCounterShareState): CounterRequest {
  if (s.mode === "wrap") return { mode: "wrap", width: s.width, kind: s.kind, speed: s.speed, utilisation: s.utilisation, poll: s.poll, packetOctets: s.packetSize }; // wrap time
  return { mode: "rate", width: s.width, kind: s.kind, first: s.first, second: s.second, firstTime: s.firstTime, secondTime: s.secondTime, timeUnit: s.timeUnit, speed: s.speed, packetOctets: s.packetSize }; // rate
} // requestOf

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param computed whether the page has a reading (false while blank or refused)
 * @returns the mode's fields, or nothing
 */
export function encodeSnmpCounterShare(s: SnmpCounterShareState, computed: boolean): ShareEncoding {
  if (!computed) return { ok: false, reason: "empty" }; // no reading: nothing to share
  const params: Record<string, string> = { mode: s.mode, width: s.width, kind: s.kind }; // always
  if (s.mode === "wrap") { // wrap time
    params.speed = s.speed; // required
    if (s.utilisation.trim() !== "") params.utilisation = s.utilisation; // when typed
    if (s.poll.trim() !== "") params.poll = s.poll; // when typed
  } else { // rate
    params.first = s.first; // required
    params.second = s.second; // required
    params.firsttime = s.firstTime; // required
    params.secondtime = s.secondTime; // required
    params.timeunit = s.timeUnit; // always written
    if (s.speed.trim() !== "") params.speed = s.speed; // when typed
  } // modes
  if (s.kind === "packets" && s.packetSize.trim() !== "") params.packetsize = s.packetSize; // packets only, when typed
  return { ok: true, params }; // the values
} // encodeSnmpCounterShare

/** The spec. */
export const SNMP_COUNTER_SHARE: ShareSpec<SnmpCounterShareState> = Object.freeze({
  tool: "snmp-counter-wrap-calculator", // the slug
  posture: "input", // speeds, percentages, intervals, counter values and times
  carriesKey: "share.carries", // tools.snmp-counter-wrap-calculator.share.carries
  names: ["mode", "width", "kind", "speed", "utilisation", "poll", "first", "second", "firsttime", "secondtime", "timeunit", "packetsize"], // a form: no input (11.3)
  /** The mode's fields, or nothing (the spec asks the engine itself whether there is a reading). */
  encode(s: SnmpCounterShareState): ShareEncoding {
    let computed = false; // whether the engine reads the fields
    try { computed = !!run(requestOf(s)); } catch { computed = false; } // the engine throws on what it refuses
    return encodeSnmpCounterShare(s, computed); // encoded
  },
  /** The mode's fields, strictly: enumerations from the page's own choices, required fields present, one line each. */
  decode(v: Readonly<Record<string, string | null>>): SnmpCounterShareState | null {
    const has = (n: string): boolean => v[n] !== null && v[n] !== undefined; // carried
    const text = (n: string): string => v[n] ?? ""; // as typed, "" when absent
    const filled = (n: string): boolean => has(n) && text(n).trim() !== ""; // present and not blank
    const names = ["speed", "utilisation", "poll", "first", "second", "firsttime", "secondtime", "timeunit", "packetsize"]; // the free-text fields
    if (names.some((n) => /[\r\n]/.test(text(n)))) return null; // every field is one line
    if (v.width !== "32" && v.width !== "64") return null; // Counter32 or Counter64
    if (v.kind !== "octets" && v.kind !== "packets") return null; // octets or packets
    if (v.kind === "octets" && has("packetsize")) return null; // a packet size with octets: not a link the page writes
    const counter: CounterFields = { width: v.width, kind: v.kind, packetSize: text("packetsize") }; // the counter
    if (v.mode === "wrap") { // wrap time
      if (RATE_ONLY.some(has)) return null; // a field of the other mode
      if (!filled("speed")) return null; // the speed is required
      return { mode: "wrap", ...counter, speed: text("speed"), utilisation: text("utilisation"), poll: text("poll") }; // the state
    } // wrap
    if (v.mode === "rate") { // rate
      if (WRAP_ONLY.some(has)) return null; // a field of the other mode
      if (!["first", "second", "firsttime", "secondtime"].every(filled)) return null; // both readings, both times
      const unit = v.timeunit ?? "s"; // seconds when absent
      if (unit !== "s" && unit !== "ticks") return null; // an unknown unit
      return { mode: "rate", ...counter, first: text("first"), second: text("second"), firstTime: text("firsttime"), secondTime: text("secondtime"), timeUnit: unit, speed: text("speed") }; // the state
    } // rate
    return null; // an unknown or missing mode
  },
});
