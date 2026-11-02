// ============================================================================
// src/lib/share/cases/timezone-meeting-planner.ts
// ----------------------------------------------------------------------------
// Share cases of the multi-time-zone meeting planner: the instant and the
// zones, both as typed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PLANNER_SHARE, type PlannerShareState } from "../../tools/timezone-meeting-planner/share"; // the spec

/** The page's Example. */
const EXAMPLE: PlannerShareState = { instant: "2026-07-18T15:00Z", zones: "America/Sao_Paulo\nEurope/Berlin\nAsia/Tokyo\nAmerica/Los_Angeles" }; // verbatim

/** The cases. */
export const TIMEZONE_MEETING_PLANNER_SHARE_CASES = defineShareCases<PlannerShareState, PlannerShareState>({
  spec: PLANNER_SHARE, // the spec
  accept: [
    { id: "example", state: EXAMPLE, params: { instant: EXAMPLE.instant, zones: EXAMPLE.zones }, restored: EXAMPLE }, // the Example
    { id: "offset-and-two-zones", state: { instant: "2026-12-01T09:30:00-03:00", zones: "Asia/Kolkata\nAustralia/Sydney\n" }, params: { instant: "2026-12-01T09:30:00-03:00", zones: "Asia/Kolkata\nAustralia/Sydney\n" }, restored: { instant: "2026-12-01T09:30:00-03:00", zones: "Asia/Kolkata\nAustralia/Sydney\n" } }, // an offset, a trailing line feed kept
  ],
  empty: [
    { id: "blank", state: { instant: "", zones: "" } }, // nothing typed
    { id: "no-offset", state: { instant: "2026-07-18T15:00", zones: "Europe/Berlin" } }, // an instant without Z or an offset is refused
    { id: "unknown-zone", state: { instant: "2026-07-18T15:00Z", zones: "Mars/Olympus_Mons" } }, // not an IANA zone
  ],
  reject: [
    { id: "no-instant", values: { instant: null, zones: "Europe/Berlin" } }, // the instant is missing
    { id: "no-zones", values: { instant: "2026-07-18T15:00Z", zones: null } }, // the zones are missing
    { id: "blank-zones", values: { instant: "2026-07-18T15:00Z", zones: "  " } }, // white space
  ],
});
