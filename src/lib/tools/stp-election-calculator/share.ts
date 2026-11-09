// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/stp-election-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the spanning tree election calculator (posture
// "input-caution", the manifest's shareSafetyDefault "fragment": in election
// mode the topology's bridge names and MAC addresses can describe a real
// network, so the popover adds the tool's caution line there; a speed names
// nothing). A form with a topology box: the link carries named values only,
// after the "#", the fields of the mode shown as typed:
//   always      mode (election or cost)
//   election    method (long or short), topology (the lines as typed)
//   cost        speed (as typed)
// A link exists once the page shows a reading; an input the engine refuses has
// none. The other mode's fields are not carried.
//
// Arrival (useShareArrival in StpElectionCalculatorTool): the mode and its
// fields are set as typing would set them (an absent method is long, the
// page's default), the other mode keeps its values, and the page computes. An
// unknown mode or method, a field of the other mode, a missing required field,
// a topology longer than the engine reads, or a speed on more than one line or
// longer than the engine reads makes the whole share malformed. Topology text
// is otherwise left to the engine, which refuses a bad line with its own
// message, exactly as typing would.
// ============================================================================

import { run, MAX_TEXT, MAX_SPEED_TEXT, type StpRequest } from "./compute"; // the page's own engine and its bounds
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state an arrival restores and the page encodes. */
export type StpShareState =
  | { mode: "election"; method: "long" | "short"; topology: string } // the election
  | { mode: "cost"; speed: string }; // the cost lookup

/**
 * The engine request for a state, as the page builds it.
 * @param s the state
 * @returns the request
 */
export function requestOf(s: StpShareState): StpRequest {
  return s.mode === "election" ? { mode: "election", method: s.method, topology: s.topology } : { mode: "cost", speed: s.speed }; // by mode
} // requestOf

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param computed whether the page has a reading (false while blank or refused)
 * @returns the mode's fields, or nothing
 */
export function encodeStpShare(s: StpShareState, computed: boolean): ShareEncoding {
  if (!computed) return { ok: false, reason: "empty" }; // no reading: nothing to share
  if (s.mode === "election") return { ok: true, params: { mode: "election", method: s.method, topology: s.topology } }; // the election's fields
  return { ok: true, params: { mode: "cost", speed: s.speed } }; // the speed
} // encodeStpShare

/** The spec. */
export const STP_SHARE: ShareSpec<StpShareState> = Object.freeze({
  tool: "stp-election-calculator", // the slug
  posture: "input-caution", // bridge names and MAC addresses can describe a real network
  carriesKey: "share.carries", // tools.stp-election-calculator.share.carries
  names: ["mode", "method", "topology", "speed"], // a form: no input (rollout 11.3)
  /** The mode's fields, or nothing (the spec asks the engine itself whether there is a reading). */
  encode(s: StpShareState): ShareEncoding {
    let computed = false; // whether the engine reads the fields
    try { computed = !!run(requestOf(s)); } catch { computed = false; } // the engine throws on what it refuses
    return encodeStpShare(s, computed); // encoded
  },
  /** The mode's fields, strictly: enumerations from the page's own choices, required fields present, bounded. */
  decode(v: Readonly<Record<string, string | null>>): StpShareState | null {
    const has = (n: string): boolean => v[n] !== null && v[n] !== undefined; // carried
    const text = (n: string): string => v[n] ?? ""; // as typed, "" when absent
    if (v.mode === "election") { // the election
      if (has("speed")) return null; // a field of the other mode
      const method = v.method ?? "long"; // long when absent, the page's default
      if (method !== "long" && method !== "short") return null; // an unknown method
      const topology = text("topology").replace(/\r/g, ""); // the lines
      if (topology.trim() === "" || topology.length > MAX_TEXT) return null; // required, and within the engine's bound
      return { mode: "election", method, topology }; // the state
    } // election
    if (v.mode === "cost") { // the cost lookup
      if (has("topology") || has("method")) return null; // fields of the other mode
      const speed = text("speed"); // as typed
      if (speed.trim() === "" || speed.length > MAX_SPEED_TEXT || /[\r\n]/.test(speed)) return null; // required, one short line
      return { mode: "cost", speed }; // the state
    } // cost
    return null; // an unknown or missing mode
  },
});
