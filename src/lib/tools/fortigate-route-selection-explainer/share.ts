// ============================================================================
// src/lib/tools/fortigate-route-selection-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiGate route selection explainer
// (posture "input-caution", raised from "input" on 2026-11-01). The box
// holds a destination and route: lines (prefix, gateway, device, distance,
// priority): the internal prefixes, next hops and interface names of a
// network, as a routing table is (the routing-table explainer's manifest:
// "a routing table reveals internal addresses and interface names"). So a
// link carries the box as pasted with a caution line. Before a link is
// offered, the box goes through the FortiOS check
// (../fortios-cli-config-explainer/fortios-secrets.ts), in case a
// configuration with credentials was pasted beside the routes: a credential
// blocks the link (code "secret"; the popover names its line); a value whose
// name only looks like a secret is named in a caution line.
//
// Arrival: the box fills as a paste would and the page reads it (nothing is
// contacted). Any non-blank text without a credential is accepted, exactly
// as a paste is; one holding a credential is a link this encoder never
// builds, and is ignored.
// ============================================================================

import { run, type RouteResult } from "./compute"; // the page's own reading (throws only on oversized input)
import { checkFortiosText, encodeFortiosBox, isSendableFortiosBox } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface RouteShareState {
  /** The box as pasted. */
  input: string;
} // RouteShareState

/**
 * Whether the page has a selection to share: a destination and at least one route evaluated.
 * @param r the page's result, or null while there is none
 * @returns true when there is something to share
 */
export function routeSelectionExplainerHasReading(r: RouteResult | null): boolean {
  return !!r && r.mode === "select" && r.evaluations.length > 0; // the page's reading
} // routeSelectionExplainerHasReading

/**
 * The page's result without throwing (an oversized box is refused with a message).
 * @param input the box
 * @returns the result, or null
 */
function reading(input: string): RouteResult | null {
  try { return input.trim() === "" ? null : run(input).result; } catch { return null; } // no result
} // reading

/** The spec. */
export const FORTIGATE_ROUTE_SELECTION_SHARE: ShareSpec<RouteShareState> = Object.freeze({
  tool: "fortigate-route-selection-explainer", // the slug
  posture: "input-caution", // the box as pasted, with a caution line of the tool's own, after the FortiOS check
  carriesKey: "share.carries", // tools.fortigate-route-selection-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: RouteShareState): ShareEncoding {
    return encodeFortiosBox(s.input, routeSelectionExplainerHasReading(reading(s.input)) ? checkFortiosText(s.input) : null); // read, checked, encoded
  },
  /** Any non-blank text without a credential: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): RouteShareState | null {
    return isSendableFortiosBox(v.input) ? { input: v.input } : null; // the text, or nothing
  },
});
