// ============================================================================
// src/lib/tools/routing-table-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the routing table explainer (posture
// "input-caution"): a link carries the pasted table as the primary value and,
// when one is typed, the destination looked up, as a named value:
// #input=<table>&destination=192.0.2.77. The manifest says "a routing table
// reveals internal addresses and interface names" (shareSafetyDefault
// "fragment"), so the popover adds the tool's own caution line. Not carried:
// which route's field-by-field reading is open (a view choice the receiver
// makes).
//
// Arrival (useShareArrival in RoutingTableExplainerTool): the table fills the
// box as a paste would, the destination its field (cleared when the link has
// none), and the page parses and looks up. Any non-blank table is accepted; the
// page refuses a malformed destination with its own message, as typing would.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the table and the destination as typed. */
export interface RoutingTableShareState {
  /** The pasted `ip route`, `netstat -rn` or `route print` output. */
  input: string;
  /** The destination to look up ("" when none). */
  destination: string;
}

/** The spec. */
export const ROUTING_TABLE_SHARE: ShareSpec<RoutingTableShareState> = Object.freeze({
  tool: "routing-table-explainer", // the slug
  posture: "input-caution", // the paste as typed, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.routing-table-explainer.share.carries
  names: ["input", "destination"], // #input=<table>&destination=<address>
  /** The table, and the destination when one is typed; nothing while the box is blank. */
  encode(state: RoutingTableShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    const params: Record<string, string> = { input: state.input }; // the table
    if (state.destination.trim() !== "") params.destination = state.destination; // the lookup, when asked
    return { ok: true, params } as const; // one or two values
  },
  /** A non-blank table; the destination defaults to none when absent. */
  decode(values: Readonly<Record<string, string | null>>) {
    const input = values.input; // the table
    if (!input || input.trim() === "") return null; // nothing to fill
    return { input, destination: values.destination ?? "" }; // the state to fill
  },
});
