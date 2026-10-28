// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bigip-dns-gslb-simulator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BIG-IP DNS (GTM) GSLB simulator (posture
// "input"): a form with nothing to paste, so a link carries named values only,
// no "input" (ROLLOUT section 11.3), after the "#":
//   method    the wide IP's pool method, by its stable id (topology...);
//   region    the client region (left out when the field is empty);
//   requests  the request count N;
//   pools     one line per pool, its five fields separated by tabs: name,
//             ratio, region, up (1 or 0), member method;
//   members   one line per member, its five fields separated by tabs: the
//             number of its pool (1 for the first line of pools), name,
//             ratio, region, up (1 or 0); each pool's members in form order.
// Numbers are decimal integers, as the form's fields hold them. Names and
// regions are free text from one-line fields, which cannot hold a line break;
// a tab pasted into one travels as a space (the only change a link makes).
//
// Arrival (useShareArrival in the component): the whole form is replaced by
// the link's values and the page simulates them. Nothing is sent anywhere.
// decode is strict: an unknown method, a line without five fields, a ratio
// below 1, an up that is not 1 or 0, a member whose pool does not exist, a
// pool left without members (the form never allows one), or more pools or
// members than the simulator takes (30 pools, 50 members each) makes the whole
// share malformed, so a stale or edited link never opens a wrong form.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { DYNAMIC_METHODS, SIMULABLE_METHODS, type GslbMethod } from "./compute"; // the methods the form offers

/** One member row, as the form holds it. */
export interface GslbShareMember {
  /** The virtual server's name. */
  id: string;
  /** Member ratio, at least 1. */
  ratio: number;
  /** Region tag (may be empty). */
  region: string;
  /** Available. */
  up: boolean;
}

/** One pool, as the form holds it. */
export interface GslbSharePool {
  /** The pool's name. */
  id: string;
  /** Pool ratio, at least 1. */
  ratio: number;
  /** Region tag (may be empty). */
  region: string;
  /** Available. */
  up: boolean;
  /** Its member-selection method. */
  method: GslbMethod;
  /** Its members, in order (at least one). */
  members: GslbShareMember[];
}

/** The state a share carries: the whole form. */
export interface GslbSimShareState {
  /** The wide IP's pool method. */
  poolMethod: GslbMethod;
  /** The client region. */
  clientRegion: string;
  /** Request count. */
  requests: number;
  /** The pools, in order. */
  pools: GslbSharePool[];
}

/** The most pools the simulator takes (compute.ts MAX_POOLS). */
const MAX_POOLS = 30; // the engine's bound
/** The most members per pool it takes (compute.ts MAX_MEMBERS_PER_POOL). */
const MAX_MEMBERS = 50; // the engine's bound

/** Every method the form offers, by its stable id. */
const METHODS: ReadonlySet<string> = new Set<string>([...SIMULABLE_METHODS, ...DYNAMIC_METHODS]); // simulable and explained

/** A decimal integer as a form field holds it: 0, or up to nine digits without a leading zero. */
const INT_RE = /^(?:0|[1-9][0-9]{0,8})$/; // anchored, bounded

/**
 * A free-text field as it travels: a tab becomes a space (tabs separate the fields), and so would a line break.
 * @param s the field
 * @returns the field without tabs or line breaks
 */
function field(s: string): string {
  return s.replace(/[\t\r\n]/g, " "); // one character for one character
} // field

/**
 * A decimal integer with a floor, or null.
 * @param s the text
 * @param min the smallest value allowed
 * @returns the number, or null when it is not one the form would hold
 */
function int(s: string | null | undefined, min: number): number | null {
  if (s == null || !INT_RE.test(s)) return null; // not a decimal integer
  const n = Number(s); // the value
  return n >= min ? n : null; // within the form's floor
} // int

/**
 * A switch as it travels: "1" or "0", or null for anything else.
 * @param s the text
 * @returns the switch, or null
 */
function flag(s: string): boolean | null {
  return s === "1" ? true : s === "0" ? false : null; // nothing else is a switch
} // flag

/** The spec. */
export const GSLB_SIM_SHARE: ShareSpec<GslbSimShareState> = Object.freeze({
  tool: "bigip-dns-gslb-simulator", // the slug
  posture: "input", // the form as typed, with the standard warning
  carriesKey: "share.carries", // tools.bigip-dns-gslb-simulator.share.carries
  names: ["method", "region", "requests", "pools", "members"], // a form: named values only
  /** The whole form, once the simulator accepts it. */
  encode(state: GslbSimShareState): ShareEncoding {
    if (state.pools.length === 0 || state.pools.length > MAX_POOLS || state.pools.some((p) => p.members.length === 0 || p.members.length > MAX_MEMBERS)) return { ok: false, reason: "empty" }; // no simulation: nothing to share
    const pools = state.pools.map((p) => [field(p.id), p.ratio, field(p.region), p.up ? 1 : 0, p.method].join("\t")).join("\n"); // one line per pool
    const members = state.pools.flatMap((p, i) => p.members.map((m) => [i + 1, field(m.id), m.ratio, field(m.region), m.up ? 1 : 0].join("\t"))).join("\n"); // one line per member
    return { ok: true, params: { method: state.poolMethod, region: field(state.clientRegion), requests: String(state.requests), pools, members } }; // an empty region is left out by the link format
  },
  /** The five values, each as the form would hold it, or null. */
  decode(values: Readonly<Record<string, string | null>>): GslbSimShareState | null {
    const { method, region, requests, pools, members } = values; // the arriving values
    if (!method || !METHODS.has(method) || !pools || !members) return null; // a method the form does not offer, or no pools or members
    const n = int(requests, 0); // the request count
    if (n === null) return null; // not a number the form holds
    const poolLines = pools.split("\n"); // one pool per line
    if (poolLines.length > MAX_POOLS) return null; // more than the simulator takes
    const out: GslbSharePool[] = []; // the pools
    for (const line of poolLines) { // each pool
      const f = line.split("\t"); // its fields
      if (f.length !== 5) return null; // five, exactly
      const ratio = int(f[1], 1); // pool ratio
      const up = flag(f[3]); // availability
      if (ratio === null || up === null || !METHODS.has(f[4])) return null; // a value the form would not hold
      out.push({ id: f[0], ratio, region: f[2], up, method: f[4] as GslbMethod, members: [] }); // the pool, members to come
    } // pools
    for (const line of members.split("\n")) { // each member
      const f = line.split("\t"); // its fields
      if (f.length !== 5) return null; // five, exactly
      const pool = int(f[0], 1); // its pool's number
      const ratio = int(f[2], 1); // member ratio
      const up = flag(f[4]); // availability
      if (pool === null || pool > out.length || ratio === null || up === null) return null; // no such pool, or a value the form would not hold
      const target = out[pool - 1]; // its pool
      if (target.members.length >= MAX_MEMBERS) return null; // more than the simulator takes
      target.members.push({ id: f[1], ratio, region: f[3], up }); // the member
    } // members
    if (out.some((p) => p.members.length === 0)) return null; // the form never leaves a pool without members
    return { poolMethod: method as GslbMethod, clientRegion: region ?? "", requests: n, pools: out }; // the form
  },
});
