// ============================================================================
// src/lib/tools/timezone-meeting-planner/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the multi-time-zone meeting planner (posture
// "input": the manifest declares no share default, and an instant and a list
// of IANA zone names name nothing of the reader's). The page has two fields of
// different kinds, so the link names each as the reader knows it (ROLLOUT
// section 1, rule 3) and carries no "input": instant, and zones (one per
// line, as typed). A link is offered once the page has a plan.
//
// Arrival: both fields fill as the reader would type them, and the page plans
// with the opener's browser's own time-zone data. Both must be non-blank;
// anything else is malformed and ignored.
// ============================================================================

import { plan } from "./compute"; // the page's own engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the two fields. */
export interface PlannerShareState {
  /** The meeting instant, with Z or an offset. */
  instant: string;
  /** The zones, one per line, as typed. */
  zones: string;
}

/**
 * Encode from a plan the page already made.
 * @param s the state
 * @param planned whether the page has a plan (false while blank or refused)
 * @returns both fields, or nothing
 */
export function encodePlannerShare(s: PlannerShareState, planned: boolean): ShareEncoding {
  if (!planned) return { ok: false, reason: "empty" }; // no plan: nothing to share
  return { ok: true, params: { instant: s.instant, zones: s.zones } }; // both as typed
} // encodePlannerShare

/** The spec. */
export const PLANNER_SHARE: ShareSpec<PlannerShareState> = Object.freeze({
  tool: "timezone-meeting-planner", // the slug
  posture: "input", // an instant and zone names
  carriesKey: "share.carries", // tools.timezone-meeting-planner.share.carries
  names: ["instant", "zones"], // two fields of different kinds: no input
  /** Both fields, or nothing (the spec plans them itself, as the page does). */
  encode(s: PlannerShareState): ShareEncoding {
    let planned = false; // whether the engine reads them
    try { planned = (s.instant.trim() !== "" || s.zones.trim() !== "") && !!plan(s.instant, s.zones.split(/\n+/)); } catch { planned = false; } // the engine throws on what it refuses
    return encodePlannerShare(s, planned); // encoded
  },
  /** Both fields, non-blank; anything else is malformed. */
  decode(v: Readonly<Record<string, string | null>>): PlannerShareState | null {
    if (!v.instant || v.instant.trim() === "" || !v.zones || v.zones.trim() === "") return null; // a share carries both
    return { instant: v.instant, zones: v.zones }; // as typed
  },
});
