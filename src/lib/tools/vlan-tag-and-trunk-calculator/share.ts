// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/vlan-tag-and-trunk-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the 802.1Q tag decoder and trunk VLAN calculator
// (posture "input-caution", the manifest's shareSafetyDefault "fragment": a
// frame's octets carry two MAC addresses, which identify devices, and a trunk
// port's lines carry interface and VLAN names, which describe a private
// network, so the popover adds the mode's caution line). The link carries,
// after the "#":
//   tag     input, the octets as typed (the primary value, so a link with
//           #input= alone opens the tag mode, as the language switcher's
//           does); start (tpid or mac) only when it is not auto
//   trunk   mode=trunk, avendor, aconfig, bvendor and bconfig as typed
// A link exists once the page shows a reading; an input the engine refuses has
// none. The other mode's fields are not carried.
//
// Arrival (useShareArrival in VlanTagAndTrunkCalculatorTool): the mode and its
// fields are set as typing would set them (an absent start is auto), the other
// mode keeps its values, and the page computes. An unknown mode, start or
// vendor (only the eight ids of VENDORS are vendors; arista-eos and huawei-vrp
// are among them since 2026-11-08b), a field of the other mode, a missing or
// blank field, a value over the engine's bounds (MAX_TEXT characters,
// MAX_LINES lines an end), or a start, mode or vendor on two lines makes the
// whole share malformed. The octets and the lines
// are otherwise left to the engine, which refuses a bad value with its own
// message, exactly as a paste would be.
// ============================================================================

import { run, VENDORS, MAX_TEXT, MAX_LINES, type VlanRequest, type VendorId } from "./compute"; // the page's own engine and its bounds
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state an arrival restores and the page encodes. */
export type VlanShareState =
  | { mode: "tag"; input: string; start: "auto" | "tpid" | "mac" } // the octets
  | { mode: "trunk"; avendor: VendorId; aconfig: string; bvendor: VendorId; bconfig: string }; // the two ends

/** The fields only each mode carries. */
const ONLY = Object.freeze({ tag: ["input", "start"], trunk: ["avendor", "aconfig", "bvendor", "bconfig"] } as const); // by mode

/**
 * The engine request for a state, as the page builds it.
 * @param s the state
 * @returns the request
 */
export function requestOf(s: VlanShareState): VlanRequest {
  if (s.mode === "tag") return { mode: "tag", input: s.input, start: s.start }; // the tag mode
  return { mode: "trunk", a: { vendor: s.avendor, config: s.aconfig }, b: { vendor: s.bvendor, config: s.bconfig } }; // the trunk mode
} // requestOf

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param computed whether the page has a reading (false while blank or refused)
 * @returns the mode's fields, or nothing
 */
export function encodeVlanShare(s: VlanShareState, computed: boolean): ShareEncoding {
  if (!computed) return { ok: false, reason: "empty" }; // no reading: nothing to share
  if (s.mode === "tag") { // the octets
    const params: Record<string, string> = { input: s.input }; // the primary value
    if (s.start !== "auto") params.start = s.start; // only when chosen
    return { ok: true, params }; // the values
  } // tag
  return { ok: true, params: { mode: "trunk", avendor: s.avendor, aconfig: s.aconfig, bvendor: s.bvendor, bconfig: s.bconfig } }; // the two ends
} // encodeVlanShare

/**
 * Whether a configuration text is within the engine's bounds.
 * @param t the text
 * @returns true when it fits
 */
const fits = (t: string): boolean => t.trim() !== "" && t.length <= MAX_TEXT && t.split("\n").length <= MAX_LINES; // bounded

/** The spec. */
export const VLAN_SHARE: ShareSpec<VlanShareState> = Object.freeze({
  tool: "vlan-tag-and-trunk-calculator", // the slug
  posture: "input-caution", // MAC addresses; interface and VLAN names
  carriesKey: "share.carries", // tools.vlan-tag-and-trunk-calculator.share.carries
  names: ["input", "mode", "start", "avendor", "aconfig", "bvendor", "bconfig"], // "input" first
  /** The mode's fields, or nothing (the spec asks the engine itself whether there is a reading). */
  encode(s: VlanShareState): ShareEncoding {
    let computed = false; // whether the engine reads the fields
    try { computed = !!run(requestOf(s)); } catch { computed = false; } // the engine throws on what it refuses
    return encodeVlanShare(s, computed); // encoded
  },
  /** The mode's fields, strictly: enumerations from the page's own choices, required fields present and bounded. */
  decode(v: Readonly<Record<string, string | null>>): VlanShareState | null {
    const has = (n: string): boolean => v[n] !== null && v[n] !== undefined; // carried
    const text = (n: string): string => v[n] ?? ""; // as typed, "" when absent
    if (["mode", "start", "avendor", "bvendor"].some((n) => /[\r\n]/.test(text(n)))) return null; // one line each
    const mode = v.mode ?? (has("input") ? "tag" : null); // #input= alone is the tag mode
    if (mode !== "tag" && mode !== "trunk") return null; // an unknown or missing mode
    const others = mode === "tag" ? ONLY.trunk : ONLY.tag; // the other mode's fields
    if (others.some(has)) return null; // a field of the other mode
    if (mode === "tag") { // the octets
      const input = text("input"); // as typed
      if (input.trim() === "" || input.length > MAX_TEXT) return null; // blank or over the bound
      const start = v.start ?? "auto"; // auto when absent
      if (start !== "auto" && start !== "tpid" && start !== "mac") return null; // an unknown start
      return { mode, input, start }; // the state
    } // tag
    const av = text("avendor"); const bv = text("bvendor"); // the vendors
    if (!(VENDORS as readonly string[]).includes(av) || !(VENDORS as readonly string[]).includes(bv)) return null; // a vendor the page offers
    const ac = text("aconfig").replace(/\r/g, ""); const bc = text("bconfig").replace(/\r/g, ""); // the lines
    if (!fits(ac) || !fits(bc)) return null; // blank or over the bounds
    return { mode, avendor: av as VendorId, aconfig: ac, bvendor: bv as VendorId, bconfig: bc }; // the state
  },
});
