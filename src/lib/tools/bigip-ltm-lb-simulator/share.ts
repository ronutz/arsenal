// ============================================================================
// src/lib/tools/bigip-ltm-lb-simulator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BIG-IP LTM load balancing simulator
// (posture "input"): a form with nothing to paste, so a link carries named
// values only, no "input" (ROLLOUT section 11.3), after the "#":
//   members    one line per member row, its six fields separated by tabs:
//              name, node, ratio, node ratio, priority group, persistence
//              records (the form's own columns, in the form's order);
//   method     the method's stable id (round-robin, ratio-member...);
//   threshold  the priority group activation threshold (0 = disabled);
//   requests   the request count N.
// Numbers are decimal integers, as the form's fields hold them. A name or a
// node is free text from a one-line field, which cannot hold a line break; a
// tab pasted into one travels as a space (the only change a link makes).
//
// Arrival (useShareArrival in the component): the whole form is replaced by
// the link's values and the page simulates them. Nothing is sent anywhere.
// decode is strict: an unknown method, a row without six fields, a ratio
// below 1, a number that is not a decimal integer, or more rows than the
// simulator takes (100) makes the whole share malformed, so a stale or edited
// link never opens a wrong form.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { DYNAMIC_METHODS, SIMULABLE_METHODS, type Method } from "./compute"; // the methods the form offers

/** One member row, as the form holds it. */
export interface LtmShareRow {
  /** The member's name. */
  id: string;
  /** Its node (an address or a name). */
  node: string;
  /** Member ratio, at least 1. */
  ratio: number;
  /** Node ratio, at least 1. */
  nodeRatio: number;
  /** Priority group, 0 or more. */
  priority: number;
  /** Existing persistence records, 0 or more. */
  persistence: number;
}

/** The state a share carries: the whole form. */
export interface LtmShareState {
  /** The member rows, in order. */
  rows: LtmShareRow[];
  /** The method. */
  method: Method;
  /** Priority group activation threshold. */
  threshold: number;
  /** Request count. */
  requests: number;
}

/** The most rows the simulator takes (compute.ts MAX_MEMBERS); more is an error there, so no link here. */
const MAX_ROWS = 100; // the engine's bound

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

/** The spec. */
export const LTM_LB_SHARE: ShareSpec<LtmShareState> = Object.freeze({
  tool: "bigip-ltm-lb-simulator", // the slug
  posture: "input", // the form as typed, with the standard warning
  carriesKey: "share.carries", // tools.bigip-ltm-lb-simulator.share.carries
  names: ["members", "method", "threshold", "requests"], // a form: named values only
  /** The whole form, once the simulator accepts it. */
  encode(state: LtmShareState): ShareEncoding {
    if (state.rows.length === 0 || state.rows.length > MAX_ROWS) return { ok: false, reason: "empty" }; // no simulation: nothing to share
    const members = state.rows.map((r) => [field(r.id), field(r.node), r.ratio, r.nodeRatio, r.priority, r.persistence].join("\t")).join("\n"); // one line per row
    return { ok: true, params: { members, method: state.method, threshold: String(state.threshold), requests: String(state.requests) } }; // four values
  },
  /** The four values, each as the form would hold it, or null. */
  decode(values: Readonly<Record<string, string | null>>): LtmShareState | null {
    const { members, method, threshold, requests } = values; // the arriving values
    if (!members || !method || !METHODS.has(method)) return null; // no rows, or a method the form does not offer
    const t = int(threshold, 0); // the threshold
    const n = int(requests, 0); // the request count
    if (t === null || n === null) return null; // not numbers the form holds
    const lines = members.split("\n"); // one row per line
    if (lines.length > MAX_ROWS) return null; // more than the simulator takes
    const rows: LtmShareRow[] = []; // the rows
    for (const line of lines) { // each row
      const f = line.split("\t"); // its fields
      if (f.length !== 6) return null; // six, exactly
      const ratio = int(f[2], 1); // member ratio
      const nodeRatio = int(f[3], 1); // node ratio
      const priority = int(f[4], 0); // priority group
      const persistence = int(f[5], 0); // persistence records
      if (ratio === null || nodeRatio === null || priority === null || persistence === null) return null; // a number the form would not hold
      rows.push({ id: f[0], node: f[1], ratio, nodeRatio, priority, persistence }); // the row
    } // lines
    return { rows, method: method as Method, threshold: t, requests: n }; // the form
  },
});
