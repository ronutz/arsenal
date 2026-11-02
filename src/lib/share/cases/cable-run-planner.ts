// ============================================================================
// src/lib/share/cases/cable-run-planner.ts
// ----------------------------------------------------------------------------
// Share cases of the cable run planner (wave 4C, 2026-11-01): four fields, all
// of them, the distance as typed. Values are the page's Example (golden
// vector "10G / 80 m office") and other golden-vector shapes.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CABLE_SHARE, type CableShareState } from "../../tools/cable-run-planner/share"; // the spec

/** The cases. */
export const CABLE_SHARE_CASES = defineShareCases<CableShareState, CableShareState>({
  spec: CABLE_SHARE, // the spec
  accept: [
    { id: "example-10g-80m", state: { speedMbps: 10000, distanceM: "80", environment: "office", poe: "none" }, params: { speed: "10000", distance: "80", environment: "office", poe: "none" }, restored: { speedMbps: 10000, distanceM: "80", environment: "office", poe: "none" } }, // the Example
    { id: "poe-bt-plenum", state: { speedMbps: 1000, distanceM: "95.5", environment: "plenum", poe: "bt" }, params: { speed: "1000", distance: "95.5", environment: "plenum", poe: "bt" }, restored: { speedMbps: 1000, distanceM: "95.5", environment: "plenum", poe: "bt" } }, // a decimal distance, as typed
    { id: "fiber-reach", state: { speedMbps: 100000, distanceM: "2000", environment: "outdoor", poe: "none" }, params: { speed: "100000", distance: "2000", environment: "outdoor", poe: "none" }, restored: { speedMbps: 100000, distanceM: "2000", environment: "outdoor", poe: "none" } }, // fibre only
  ],
  arrive: [
    { id: "speed-and-distance", values: { speed: "2500", distance: "100" }, restored: { speedMbps: 2500, distanceM: "100", environment: "office", poe: "none" } }, // the selects a link lacks take the starting choices
  ],
  empty: [
    { id: "no-distance", state: { speedMbps: 1000, distanceM: "", environment: "office", poe: "none" } }, // no plan yet
    { id: "refused-distance", state: { speedMbps: 1000, distanceM: "-5", environment: "office", poe: "none" } }, // the page shows its error
  ],
  blocked: [],
  reject: [
    { id: "unknown-speed", values: { speed: "3000", distance: "50" } }, // not a tier the select offers
    { id: "speed-spelling", values: { speed: "1e4", distance: "50" } }, // the select's own spelling only
    { id: "no-distance", values: { speed: "1000" } }, // the distance is required
    { id: "unknown-environment", values: { speed: "1000", distance: "50", environment: "underwater" } }, // not offered
    { id: "unknown-poe", values: { speed: "1000", distance: "50", poe: "ultra" } }, // not offered
  ],
});
