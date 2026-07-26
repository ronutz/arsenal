// ============================================================================
// src/lib/tools/fortigate-route-selection-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS.
//
// These pin the DISTANCE-versus-PRIORITY distinction from both sides, because
// that is the confusion the tool exists to remove and an engine that got it
// backwards would still typecheck, still run, and give confidently wrong
// routing advice.
// ============================================================================

import { run } from "./compute";

export const SET_ID = "fortigate-route-selection-explainer/golden@1";

export interface RouteVector {
  readonly name: string;
  readonly input: string;
  /** Gateways of the selected route(s), in order. */
  readonly selected: readonly string[];
  readonly mustFind?: string;
}

export const VECTORS: readonly RouteVector[] = Object.freeze([
  {
    // Longest prefix beats a default route regardless of anything else.
    name: "longest prefix wins over the default route",
    input: `destination: 10.2.5.10
route: prefix=0.0.0.0/0, gw=192.0.2.1, dev=wan1, distance=10, priority=0
route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0`,
    selected: ["10.1.1.1"],
    mustFind: "longest matching prefix",
  },
  {
    // DIFFERENT distance -> the loser is NOT INSTALLED, not merely second.
    name: "higher distance is a floating backup, absent from the table",
    input: `destination: 10.2.5.10
route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0
route: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=20, priority=0`,
    selected: ["10.1.1.1"],
    mustFind: "NOT INSTALLED",
  },
  {
    // SAME distance -> both install, and PRIORITY chooses between them.
    name: "same distance means priority decides",
    input: `destination: 10.2.5.10
route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=10
route: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=10, priority=0`,
    selected: ["10.1.1.2"],
    mustFind: "lowest priority",
  },
  {
    // Complete tie -> ECMP.
    name: "a complete tie load shares by ECMP",
    input: `destination: 10.2.5.10
route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0
route: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=10, priority=0`,
    selected: ["10.1.1.1", "10.1.1.2"],
    mustFind: "ECMP",
  },
  {
    // The floating backup ACTIVATES when the primary is withdrawn. This is the
    // whole point of link health monitoring.
    name: "a down primary lets the floating backup take over",
    input: `destination: 10.2.5.10
route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0, status=down
route: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=20, priority=0`,
    selected: ["10.1.1.2"],
    mustFind: "link health monitoring",
  },
  {
    // A low priority CANNOT rescue a route that lost on distance. This is the
    // exact conflation the tool exists to correct.
    name: "priority does not rescue a route that lost on distance",
    input: `destination: 10.2.5.10
route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=100
route: prefix=10.2.0.0/16, gw=10.1.1.2, dev=port4, distance=20, priority=0`,
    selected: ["10.1.1.1"],
    mustFind: "NOT INSTALLED",
  },
  {
    name: "no covering route means the packet is unroutable",
    input: `destination: 172.16.5.1
route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0`,
    selected: [],
  },
  {
    name: "empty input yields the reference card",
    input: "",
    selected: [],
  },
]);

export function verifyVectors(): { ok: true; count: number } {
  for (const v of VECTORS) {
    const { result } = run(v.input);
    const got = result.selected.map((r) => r.gw ?? "").sort();
    const want = [...v.selected].sort();
    if (got.join(",") !== want.join(",")) {
      throw new Error(`[${SET_ID}] "${v.name}": expected selected [${want.join(",")}], got [${got.join(",")}]`);
    }
    if (v.mustFind) {
      const all = [...result.evaluations.map((e) => e.detail), ...result.notes].join(" | ");
      if (!all.includes(v.mustFind)) {
        throw new Error(`[${SET_ID}] "${v.name}": missing "${v.mustFind}". Got: ${all}`);
      }
    }
  }
  return { ok: true, count: VECTORS.length };
}
