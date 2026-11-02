// ============================================================================
// src/lib/tools/fortios-flow-debug-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiOS debug flow builder (posture
// "input-caution", raised from "input" on 2026-11-01). The page is a form:
// the trace's address, source and destination address, port, source and
// destination port, protocol, VDOM and packet count, and two switches. Its
// filters name hosts, ports and a virtual domain of the reader's network, as
// the sniffer builder's do (its manifest: "A sniffer command can carry
// internal IPs / hostnames"), so the link carries a caution line. A form has
// nothing to paste, so the link carries named values only, never "input"
// (ROLLOUT 11.3), and every field, always (decisions of 2026-11-01: an old
// link keeps its meaning if a default changes): each text field as typed
// (an empty one is left out of the link, and an arrival empties it), the
// packet count as typed, and both switches as 1 or 0. The form holds no
// secret, so no check runs; the builder formats text and runs nothing.
//
// Arrival: the whole form is replaced by the link's values and the page
// builds the commands (nothing is contacted or run). A switch other than 1
// or 0, or a link without any filter (one the builder would refuse), is
// malformed and ignored whole.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The form's text fields, in the order the page shows them (each is also its name in the link). */
export const FLOW_DEBUG_FIELDS = ["addr", "saddr", "daddr", "port", "sport", "dport", "proto", "vdom", "count"] as const; // the nine fields

/** One text field's name. */
export type FlowDebugField = (typeof FLOW_DEBUG_FIELDS)[number]; // addr ... count

/** The filters: at least one is needed for the builder to build anything. */
const FILTERS: readonly FlowDebugField[] = ["addr", "saddr", "daddr", "port", "sport", "dport", "proto"]; // count and vdom are not filters

/** The state: the form. */
export interface FlowDebugShareState {
  /** The text fields as typed. */
  fields: Readonly<Record<FlowDebugField, string>>;
  /** "show iprope enable". */
  iprope: boolean;
  /** "console timestamp enable". */
  timestamp: boolean;
} // FlowDebugShareState

/**
 * Whether the builder has commands to share: at least one filter typed (the page shows its own message otherwise).
 * @param s the form
 * @returns true when the builder builds
 */
export function flowDebugHasResult(s: FlowDebugShareState): boolean {
  return FILTERS.some((k) => s.fields[k].trim() !== ""); // a filter, as the page tests it
} // flowDebugHasResult

/** The spec. */
export const FORTIOS_FLOW_DEBUG_SHARE: ShareSpec<FlowDebugShareState> = Object.freeze({
  tool: "fortios-flow-debug-builder", // the slug
  posture: "input-caution", // the form as typed, with a caution line
  carriesKey: "share.carries", // tools.fortios-flow-debug-builder.share.carries
  names: [...FLOW_DEBUG_FIELDS, "iprope", "timestamp"], // a form: named values only
  /** Every field, or nothing while no filter is typed. */
  encode(s: FlowDebugShareState): ShareEncoding {
    if (!flowDebugHasResult(s)) return { ok: false, reason: "empty" }; // nothing built: the button is disabled
    const params: Record<string, string> = {}; // the values
    for (const k of FLOW_DEBUG_FIELDS) params[k] = s.fields[k]; // each text field as typed (empty ones are left out of the link)
    params.iprope = s.iprope ? "1" : "0"; // a switch, always
    params.timestamp = s.timestamp ? "1" : "0"; // a switch, always
    return { ok: true, params }; // done
  },
  /** The whole form: absent text fields empty, switches 1 or 0 (absent: off), and at least one filter. */
  decode(v: Readonly<Record<string, string | null>>): FlowDebugShareState | null {
    const sw = (x: string | null): boolean | null => (x === null || x === "0" ? false : x === "1" ? true : null); // a switch, or malformed
    const iprope = sw(v.iprope); // the iprope switch
    const timestamp = sw(v.timestamp); // the timestamp switch
    if (iprope === null || timestamp === null) return null; // a switch other than 1 or 0
    const fields = Object.fromEntries(FLOW_DEBUG_FIELDS.map((k) => [k, v[k] ?? ""])) as Record<FlowDebugField, string>; // absent: empty
    const s: FlowDebugShareState = { fields, iprope, timestamp }; // the form
    return flowDebugHasResult(s) ? s : null; // a link without a filter is one the encoder never builds
  },
});
