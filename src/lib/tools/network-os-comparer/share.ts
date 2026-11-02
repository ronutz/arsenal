// ============================================================================
// src/lib/tools/network-os-comparer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the network operating system comparer (posture
// "input", the inventory's, kept). Two selects: the system to profile, and an
// optional second one to compare it with. They name published products, nothing
// of the reader's. The link carries both, by their stable ids:
//   os     the first system (always carried, the page's default included, so a
//          link keeps its meaning if the starting system changes)
//   with   the second system; absent means "no second system" (the profile)
// Arrival: the selects are set and the page shows the profile or the
// comparison, as choosing them does.
// ============================================================================

import { NETWORK_OSES } from "./compute"; // the systems and their ids
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The two selects. */
export interface NetworkOsShareState {
  /** The first system's id. */
  os: string;
  /** The second system's id, or "" for none. */
  with: string;
}

/**
 * Whether an id names a system the page offers.
 * @param id the id
 * @returns true when it is one
 */
function known(id: string): boolean {
  return NETWORK_OSES.some((o) => o.id === id); // in the table
} // known

/** The spec. */
export const NETWORK_OS_SHARE: ShareSpec<NetworkOsShareState> = Object.freeze({
  tool: "network-os-comparer", // the slug
  posture: "input", // two choices
  carriesKey: "share.carries", // tools.network-os-comparer.share.carries
  names: ["os", "with"], // a form: no "input"
  /** The two choices (a profile or a comparison is always on the page). */
  encode(s: NetworkOsShareState): ShareEncoding {
    if (!known(s.os) || (s.with !== "" && (!known(s.with) || s.with === s.os))) return { ok: false, reason: "empty" }; // not a state the page shows
    return { ok: true, params: s.with === "" ? { os: s.os } : { os: s.os, with: s.with } }; // no second system: "with" carries nothing
  },
  /** Both ids strictly: each one the page offers, the second different from the first. */
  decode(v: Readonly<Record<string, string | null>>): NetworkOsShareState | null {
    if (!v.os || !known(v.os)) return null; // the first system is required
    const second = v.with ?? ""; // absent: the profile
    if (second !== "" && (!known(second) || second === v.os)) return null; // the second select never offers the first
    return { os: v.os, with: second }; // the state
  },
});
