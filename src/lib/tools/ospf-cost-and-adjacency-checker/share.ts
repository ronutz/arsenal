// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/ospf-cost-and-adjacency-checker/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the OSPF cost and adjacency checker (posture
// "input-caution", the manifest's shareSafetyDefault "fragment": in adjacency
// mode the Router IDs, interface addresses and router labels name
// infrastructure on a private network, so the popover adds the tool's caution
// line there; vendors and speeds name nothing). The tool never takes a key, so
// no link can carry one. A form with nothing to paste (ROLLOUT 11.3): the link
// carries named values only, after the "#", the fields of the mode shown:
//   always      mode (cost or adjacency)
//   cost        vendor; reference when typed; links (the speeds as typed)
//   adjacency   version (2 or 3); samekey (1 or 0); a and b, each one side as
//               thirteen words in a fixed order (SIDE_FIELDS), "*" for a field
//               left blank
// A link exists once the page shows a reading; an input the engine refuses has
// none. The other mode's fields are not carried.
//
// Arrival (useShareArrival in OspfCostAndAdjacencyCheckerTool): the mode and
// its fields are set as typing would set them, the other mode keeps its values,
// and the page computes. An unknown mode, vendor, version, switch value, area
// type, network type or authentication, a field of the other mode, a missing
// required field, a value over two lines, or a side that is not thirteen words
// makes the whole share malformed. Field text is otherwise left to the engine,
// which refuses a bad speed, address or interval with its own message.
// ============================================================================

import { run, type OspfRequest } from "./compute"; // the page's own engine, to know whether there is a reading
import { VENDORS, type VendorId } from "./vendors"; // the vendor ids
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** One side of the link as the form holds it (every field as typed). */
export interface SideForm {
  /** Router label. */
  name: string;
  /** Router ID. */
  routerId: string;
  /** Area ID. */
  area: string;
  /** normal, stub or nssa. */
  areaType: string;
  /** broadcast, point-to-point, nbma or point-to-multipoint. */
  network: string;
  /** OSPFv2 address with prefix length. */
  address: string;
  /** HelloInterval. */
  hello: string;
  /** RouterDeadInterval. */
  dead: string;
  /** MTU. */
  mtu: string;
  /** Authentication kind. */
  auth: string;
  /** Key ID or SA ID. */
  keyId: string;
  /** Router Priority. */
  priority: string;
  /** Instance ID. */
  instance: string;
}

/** The order a side's words travel in. */
export const SIDE_FIELDS: readonly (keyof SideForm)[] = Object.freeze(["name", "routerId", "area", "areaType", "network", "address", "hello", "dead", "mtu", "auth", "keyId", "priority", "instance"] as const); // thirteen words

/** The state an arrival restores and the page encodes. */
export type OspfShareState =
  | { mode: "cost"; vendor: VendorId; reference: string; links: string } // the cost mode
  | { mode: "adjacency"; version: "2" | "3"; sameKey: boolean; a: SideForm; b: SideForm }; // the adjacency mode

/** The fields only each mode carries. */
const ONLY: Readonly<Record<OspfShareState["mode"], readonly string[]>> = Object.freeze({
  cost: ["vendor", "reference", "links"], // the cost mode
  adjacency: ["version", "samekey", "a", "b"], // the adjacency mode
}); // by mode

/** The blank-field marker (no accepted value is ever "*"). */
const BLANK = "*"; // a field left blank

/** The enumerations a side's words may take (besides the blank). */
const ENUMS: Readonly<Partial<Record<keyof SideForm, readonly string[]>>> = Object.freeze({
  areaType: ["normal", "stub", "nssa"], // area types
  network: ["broadcast", "point-to-point", "nbma", "point-to-multipoint"], // network types
  auth: ["none", "simple", "md5", "hmac-sha-1", "hmac-sha-256", "hmac-sha-384", "hmac-sha-512", "ipsec"], // authentication kinds
}); // by field

/**
 * The engine request for a state, as the page builds it.
 * @param s the state
 * @returns the request
 */
export function requestOf(s: OspfShareState): OspfRequest {
  if (s.mode === "cost") return { mode: "cost", vendor: s.vendor, reference: s.reference, links: s.links }; // cost
  return { mode: "adjacency", version: s.version, sameKey: s.sameKey, a: { ...s.a }, b: { ...s.b } }; // adjacency
} // requestOf

/**
 * One side as the link's words.
 * @param side the form
 * @returns thirteen words joined by single spaces
 */
export function sideText(side: SideForm): string {
  return SIDE_FIELDS.map((k) => side[k].trim() || BLANK).join(" "); // "*" for a blank field
} // sideText

/**
 * The link's words back to a side, strictly.
 * @param text the value
 * @returns the side, or null when it is not thirteen words with valid enumerations
 */
export function parseSideText(text: string): SideForm | null {
  if (text.length > 400) return null; // a side is short
  const w = text.split(" "); // single spaces, as encode writes them
  if (w.length !== SIDE_FIELDS.length || w.some((x) => x === "")) return null; // thirteen words
  const out = {} as SideForm; // the side
  SIDE_FIELDS.forEach((k, i) => { out[k] = w[i] === BLANK ? "" : w[i]; }); // in order
  for (const [k, allowed] of Object.entries(ENUMS) as [keyof SideForm, readonly string[]][]) if (out[k] !== "" && !allowed.includes(out[k])) return null; // an unknown enumeration
  return out; // the side
} // parseSideText

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param computed whether the page has a reading (false while blank or refused)
 * @returns the mode's fields, or nothing
 */
export function encodeOspfShare(s: OspfShareState, computed: boolean): ShareEncoding {
  if (!computed) return { ok: false, reason: "empty" }; // no reading: nothing to share
  if (s.mode === "cost") { // the cost mode
    const params: Record<string, string> = { mode: "cost", vendor: s.vendor, links: s.links }; // always
    if (s.reference.trim() !== "") params.reference = s.reference; // when typed
    return { ok: true, params }; // the values
  } // cost
  return { ok: true, params: { mode: "adjacency", version: s.version, samekey: s.sameKey ? "1" : "0", a: sideText(s.a), b: sideText(s.b) } }; // the adjacency mode
} // encodeOspfShare

/** The spec. */
export const OSPF_SHARE: ShareSpec<OspfShareState> = Object.freeze({
  tool: "ospf-cost-and-adjacency-checker", // the slug
  posture: "input-caution", // Router IDs, addresses and labels name a private network
  carriesKey: "share.carries", // tools.ospf-cost-and-adjacency-checker.share.carries
  names: ["mode", "vendor", "reference", "links", "version", "samekey", "a", "b"], // a form: no input (11.3)
  /** The mode's fields, or nothing (the spec asks the engine itself whether there is a reading). */
  encode(s: OspfShareState): ShareEncoding {
    let computed = false; // whether the engine reads the fields
    try { computed = !!run(requestOf(s)); } catch { computed = false; } // the engine throws on what it refuses
    return encodeOspfShare(s, computed); // encoded
  },
  /** The mode's fields, strictly: enumerations from the page's own choices, required fields present, one line each. */
  decode(v: Readonly<Record<string, string | null>>): OspfShareState | null {
    const has = (n: string): boolean => v[n] !== null && v[n] !== undefined; // carried
    const text = (n: string): string => v[n] ?? ""; // as typed, "" when absent
    const filled = (n: string): boolean => has(n) && text(n).trim() !== ""; // present and not blank
    if (OSPF_SHARE.names.some((n) => /[\r\n]/.test(text(n)))) return null; // one line each
    const mode = v.mode; // the mode
    if (mode !== "cost" && mode !== "adjacency") return null; // an unknown or missing mode
    const other = mode === "cost" ? ONLY.adjacency : ONLY.cost; // the other mode's fields
    if (other.some(has)) return null; // a field of the other mode
    if (mode === "cost") { // the cost mode
      const vendor = v.vendor ?? ""; // required
      if (!(vendor in VENDORS)) return null; // an unknown vendor
      if (!filled("links")) return null; // the speeds are required
      return { mode, vendor: vendor as VendorId, reference: text("reference"), links: text("links") }; // the state
    } // cost
    const version = v.version ?? "2"; // version 2 when absent
    if (version !== "2" && version !== "3") return null; // an unknown version
    const samekey = v.samekey ?? "1"; // the same key when absent
    if (samekey !== "1" && samekey !== "0") return null; // a switch is 1 or 0
    if (!filled("a") || !filled("b")) return null; // both sides are required
    const a = parseSideText(text("a")); // one side
    const b = parseSideText(text("b")); // the other
    if (!a || !b) return null; // not a side
    return { mode, version, sameKey: samekey === "1", a, b }; // the state
  },
});
