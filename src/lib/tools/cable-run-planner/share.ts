// ============================================================================
// src/lib/tools/cable-run-planner/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the cable run planner (posture "input": the
// manifest's "safe", "link parameters carry no secrets"). Four fields: a speed
// tier, a one-way channel distance, an environment and a PoE class. The tool is
// a form with nothing to paste, so the link carries named values only (ROLLOUT
// 11.3), all four, always:
//   speed        the tier in Mb/s (100, 1000, 2500, 5000, 10000, 25000, 40000 or 100000)
//   distance     the distance in metres, as typed
//   environment  office, industrial, plenum or outdoor
//   poe          none, af, at or bt
// A share exists once the page shows a plan (a distance it accepts); a distance
// it refuses shows its own error, so it has nothing to share.
// Arrival: the four fields are set and the page plans, as a change does.
// ============================================================================

import { run, SPEEDS } from "./compute"; // the engine and its speed tiers
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The form as the page holds it. */
export interface CableShareState {
  /** The speed tier in Mb/s. */
  speedMbps: number;
  /** The distance in metres, as typed. */
  distanceM: string;
  /** The environment. */
  environment: string;
  /** The PoE class. */
  poe: string;
}

/** The environments the select offers. */
const ENVS = ["office", "industrial", "plenum", "outdoor"]; // the select's options
/** The PoE classes the select offers. */
const POES = ["none", "af", "at", "bt"]; // the select's options

/**
 * Whether the page shows a plan for a form (the same call it makes).
 * @param s the form
 * @returns true when it plans
 */
function plans(s: CableShareState): boolean {
  if (!s.distanceM.trim()) return false; // no distance yet
  try { run({ speedMbps: s.speedMbps, distanceM: Number(s.distanceM), environment: s.environment, poe: s.poe }); return true; } catch { return false; } // planned, or the page's error
} // plans

/** The spec. */
export const CABLE_SHARE: ShareSpec<CableShareState> = Object.freeze({
  tool: "cable-run-planner", // the slug
  posture: "input", // four values, no secrets
  carriesKey: "share.carries", // tools.cable-run-planner.share.carries
  names: ["speed", "distance", "environment", "poe"], // a form: no "input"
  /** All four fields of a form the page plans; nothing otherwise. */
  encode(s: CableShareState): ShareEncoding {
    if (!plans(s)) return { ok: false, reason: "empty" }; // no plan: nothing to share
    return { ok: true, params: { speed: String(s.speedMbps), distance: s.distanceM, environment: s.environment, poe: s.poe } }; // the four
  },
  /** The four fields strictly: a tier, environment or class the page does not offer, or a missing distance, is malformed. */
  decode(v: Readonly<Record<string, string | null>>): CableShareState | null {
    const speed = Number(v.speed); // the tier
    if (!v.speed || !(SPEEDS as readonly number[]).includes(speed) || String(speed) !== v.speed) return null; // one the select offers, in its own spelling
    if (!v.distance || /[\r\n]/.test(v.distance)) return null; // the distance is required, one line
    const environment = v.environment ?? "office"; // absent: the page's starting choice
    const poe = v.poe ?? "none"; // absent: the page's starting choice
    if (!ENVS.includes(environment) || !POES.includes(poe)) return null; // one the select offers
    return { speedMbps: speed, distanceM: v.distance, environment, poe }; // the form (the page refuses a bad distance as typing would)
  },
});
