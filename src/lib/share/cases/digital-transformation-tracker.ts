// ============================================================================
// src/lib/share/cases/digital-transformation-tracker.ts
// ----------------------------------------------------------------------------
// Share cases of the digital transformation tracker (wave 4C, 2026-11-01): the
// two chip rows by id, in the page's order; with no chip on there is nothing to
// share (the page as it opens).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TRACKER_SHARE, type TrackerShareState } from "../../tools/digital-transformation-tracker/share"; // the spec

/** The cases. */
export const TRACKER_SHARE_CASES = defineShareCases<TrackerShareState, TrackerShareState>({
  spec: TRACKER_SHARE, // the spec
  accept: [
    { id: "example-state-domain", state: { domains: ["state"], certainties: [] }, params: { domains: "state" }, restored: { domains: ["state"], certainties: [] } }, // the page's Example
    { id: "forecasts-only", state: { domains: [], certainties: ["forecast"] }, params: { certainties: "forecast" }, restored: { domains: [], certainties: ["forecast"] } }, // one tier across every domain
    { id: "clicked-out-of-order", state: { domains: ["state", "money"], certainties: ["contested", "scheduled"] }, params: { domains: "money,state", certainties: "scheduled,contested" }, restored: { domains: ["money", "state"], certainties: ["scheduled", "contested"] } }, // the page's order, whatever the order of the taps
  ],
  empty: [
    { id: "no-chip-on", state: { domains: [], certainties: [] } }, // the page as it opens
  ],
  blocked: [],
  reject: [
    { id: "nothing", values: {} }, // no row at all
    { id: "unknown-domain", values: { domains: "weather" } }, // a chip the page does not have
    { id: "unknown-tier", values: { certainties: "rumour" } }, // the same
    { id: "out-of-order", values: { domains: "state,money" } }, // the encoder writes the page's order only
    { id: "twice", values: { certainties: "forecast,forecast" } }, // a chip twice
  ],
});
