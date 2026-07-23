// ============================================================================
// src/lib/tools/cable-run-planner/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING CABLE RUN PLANNER - {manifest, run, vectors}.
// Speed + distance + environment + PoE in; every compliant medium out, each
// citing its governing rule (ANSI/TIA-568 channel limits, IEEE 802.3 clause
// reaches), with honest exclusions explaining exactly why the others fail.
// The rules table IS the tool; the 14 golden vectors pin it, including
// exact-at-limit optics cases. Closes GLOSSUP M4; paired with the
// structured-cabling article. API-included (local-equivalent). (D-19.)
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, PLANNER_VECTORS } from "./golden-vectors";

export { run, parseInput, SPEEDS } from "./compute";
export type {
  PlannerInput,
  PlannerResult,
  MediaOption,
  Exclusion,
  Environment,
  PoeClass,
  SpeedMbps,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, PLANNER_VECTORS, verifyVectors } from "./golden-vectors";
export type { PlannerVector } from "./golden-vectors";

/** The D-49 declarative manifest for the cable-run-planner. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Physical layer",
  toolSlug: "cable-run-planner",
  canonicalAliases: ["cable-chooser", "cabling-planner", "media-selector"],
  inputDetectors: [
    {
      kind: "structured-form",
      pattern: "speed + distance + environment + poe fields",
      priority: 1,
      example: '{"speedMbps":10000,"distanceM":80,"environment":"office","poe":"none"}',
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "enumerated-speed-tiers",
    "distance-range-guard-0-10km",
    "anchored-field-errors",
    "include-exclude-disjointness-invariant",
  ],
  shareSafetyDefault: "safe", // link parameters carry no secrets

  // -- Teaching & provenance --
  learnLinks: ["learn/structured-cabling", "learn/ieee-802-working-groups"],
  sources: [
    {
      id: "tia-568",
      label:
        "ANSI/TIA-568 family (TIA): 100 m twisted-pair channel (90 m permanent link + 10 m cords), category definitions Cat 5e/6/6A, and Category 8's 2000 MHz / 30 m channel (TIA-568.2-D)",
      type: "primary-spec",
      url: "https://tiaonline.org",
      access_date: "2026-07-22",
      scope: "copper channel limits and category definitions",
      status: "active",
    },
    {
      id: "ieee-802-3",
      label:
        "IEEE 802.3 clauses: 802.3bz (2.5G on Cat 5e / 5G on Cat 6 at 100 m), 802.3an 10GBASE-T, 802.3ae/by/ba/bm SR- and LR-class optic reaches (10G SR: 300 m OM3 / 400 m OM4; 25G SR: 70/100 m; 40G SR4: 100/150 m; 100G SR4: 70/100 m; LR class: 10 km OS2), 802.3af/at/bt PoE",
      type: "primary-spec",
      url: "https://www.ieee802.org/3/",
      access_date: "2026-07-22",
      scope: "speed-over-medium mappings and optic reach figures",
      status: "active",
    },
    {
      id: "tsb-155-184",
      label:
        "TIA TSB-155 (10GBASE-T over Cat 6: 37-55 m alien-crosstalk-dependent guidance) and TSB-184-A (PoE bundle heat-rise guidance for 802.3bt)",
      type: "supporting-guidance",
      url: "https://tiaonline.org",
      access_date: "2026-07-22",
      scope: "the Cat 6 10G ceiling and the bt thermal note",
      status: "active",
    },
  ],
} as const);
