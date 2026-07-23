// ============================================================================
// src/lib/tools/cable-run-planner/golden-vectors.ts
// ----------------------------------------------------------------------------
// FOURTEEN GOLDEN VECTORS pinning the rules table: every TIA-568 channel
// limit, every 802.3bz NBASE-T mapping, the Cat 6 10G 55 m ceiling, the
// Cat 8 30 m window, and the SR/LR optic reach ladder incl. exact-at-limit
// cases (OM3 at 300 m for 10G, OM3 at 70 m for 100G). Each vector asserts
// which media ids MUST appear and which MUST be excluded. (D-19.)
// ============================================================================

import { run, type PlannerInput } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "cable-run-planner-golden-v1";

export interface PlannerVector {
  name: string;
  input: PlannerInput;
  mustInclude: string[]; // option ids (copper) or id prefixes (fiber "om4-")
  mustExclude: string[]; // ids that must appear in `excluded`
}

export const PLANNER_VECTORS: PlannerVector[] = [
  { name: "1G / 90 m office: all horizontal categories pass",
    input: { speedMbps: 1000, distanceM: 90, environment: "office", poe: "none" },
    mustInclude: ["cat5e", "cat6", "cat6a"], mustExclude: ["cat8"] },
  { name: "10G / 80 m: Cat 6 excluded by the 55 m ceiling, Cat 6A carries",
    input: { speedMbps: 10000, distanceM: 80, environment: "office", poe: "none" },
    mustInclude: ["cat6a"], mustExclude: ["cat6", "cat5e"] },
  { name: "10G / 45 m: Cat 6 admissible inside its window",
    input: { speedMbps: 10000, distanceM: 45, environment: "office", poe: "none" },
    mustInclude: ["cat6", "cat6a"], mustExclude: ["cat5e"] },
  { name: "25G / 25 m data-center row: Cat 8 territory",
    input: { speedMbps: 25000, distanceM: 25, environment: "office", poe: "none" },
    mustInclude: ["cat8"], mustExclude: ["cat6a"] },
  { name: "25G / 60 m: past Cat 8; OM4 carries, OM3 (70 m) also carries",
    input: { speedMbps: 25000, distanceM: 60, environment: "office", poe: "none" },
    mustInclude: ["om3-25000", "om4-25000"], mustExclude: ["cat8"] },
  { name: "1G / 150 m: no copper at all; fiber run",
    input: { speedMbps: 1000, distanceM: 150, environment: "office", poe: "none" },
    mustInclude: ["om3-1000", "om4-1000", "smf-1000"],
    mustExclude: ["cat5e", "cat6", "cat6a"] },
  { name: "10G / 300 m: OM3 exactly at its SR limit",
    input: { speedMbps: 10000, distanceM: 300, environment: "office", poe: "none" },
    mustInclude: ["om3-10000", "om4-10000", "smf-10000"], mustExclude: ["cat6a"] },
  { name: "10G / 350 m: OM3 out (300 m), OM4 carries (400 m)",
    input: { speedMbps: 10000, distanceM: 350, environment: "office", poe: "none" },
    mustInclude: ["om4-10000", "smf-10000"], mustExclude: ["om3"] },
  { name: "2.5G / 100 m: Cat 5e per 802.3bz",
    input: { speedMbps: 2500, distanceM: 100, environment: "office", poe: "none" },
    mustInclude: ["cat5e", "cat6", "cat6a"], mustExclude: ["cat8"] },
  { name: "5G / 100 m: Cat 6 per 802.3bz; Cat 5e not specified",
    input: { speedMbps: 5000, distanceM: 100, environment: "office", poe: "none" },
    mustInclude: ["cat6", "cat6a"], mustExclude: ["cat5e"] },
  { name: "1G / 90 m industrial + PoE bt: shield + TSB-184-A notes attach",
    input: { speedMbps: 1000, distanceM: 90, environment: "industrial", poe: "bt" },
    mustInclude: ["cat5e", "cat6a"], mustExclude: ["cat8"] },
  { name: "10G / 90 m plenum + PoE at: Cat 6A with CMP note",
    input: { speedMbps: 10000, distanceM: 90, environment: "plenum", poe: "at" },
    mustInclude: ["cat6a"], mustExclude: ["cat6"] },
  { name: "40G / 25 m: Cat 8 window includes 40G",
    input: { speedMbps: 40000, distanceM: 25, environment: "office", poe: "none" },
    mustInclude: ["cat8", "om3-40000", "om4-40000"], mustExclude: [] },
  { name: "100G / 70 m: OM3 exactly at SR4 limit; no copper exists",
    input: { speedMbps: 100000, distanceM: 70, environment: "office", poe: "none" },
    mustInclude: ["om3-100000", "om4-100000", "smf-100000"],
    mustExclude: ["cat8", "cat6a"] },
];

/** Verify every vector; returns failures (empty array = all green). */
export function verifyVectors(): string[] {
  const fails: string[] = [];
  for (const v of PLANNER_VECTORS) {
    const r = run(v.input);
    const optIds = r.options.map((o) => o.id);
    const excIds = r.excluded.map((e) => e.id);
    for (const m of v.mustInclude)
      if (!optIds.includes(m)) fails.push(`${v.name}: missing option ${m} (got ${optIds.join(",")})`);
    for (const x of v.mustExclude)
      if (!excIds.includes(x)) fails.push(`${v.name}: expected exclusion ${x} (got ${excIds.join(",")})`);
    // Structural invariant: options and exclusions never overlap.
    for (const id of optIds)
      if (excIds.includes(id)) fails.push(`${v.name}: ${id} both included and excluded`);
  }
  return fails;
}
