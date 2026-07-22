// ============================================================================
// src/lib/tools/sorting-algorithm-stepper/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING SORTING ALGORITHM STEPPER - {manifest, run, vectors}.
// Numbers in, the algorithm's complete thought process out: every comparison,
// swap, and write with a one-line WHY, plus the counters that make Big-O
// growth tangible. Five textbook-canonical strategies (bubble with
// early-exit, selection, insertion, top-down merge, Lomuto quicksort with
// last-element pivot - whose sorted-input degradation is deliberately kept
// as a teaching feature). Vendor-neutral learning tool; paired with the
// algorithms primer. API-included (local-equivalent). (D-19.)
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, STEPPER_VECTORS } from "./golden-vectors";

export { run, parseList } from "./compute";
export type { SortTrace, SortStep, Strategy } from "./compute";
export { GOLDEN_VECTOR_SET_ID, STEPPER_VECTORS, verifyVectors } from "./golden-vectors";
export type { StepperVector } from "./golden-vectors";

/** The D-49 declarative manifest for the sorting-algorithm-stepper. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Algorithms",
  toolSlug: "sorting-algorithm-stepper",
  canonicalAliases: ["sort-stepper", "sorting-visualizer", "algorithm-stepper"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*-?\\d+(\\.\\d+)?([\\s,;]+-?\\d+(\\.\\d+)?){1,15}\\s*$",
      priority: 1, // deliberately low: bare number lists are ambiguous
      example: "5 3 8 1 9 2",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["16-item-cap", "400-step-cap", "per-token-anchored-errors", "output-sortedness-invariant-check"],
  shareSafetyDefault: "safe", // number lists carry no secrets

  // -- Teaching & provenance --
  learnLinks: ["learn/what-is-an-algorithm"],
  sources: [
    {
      id: "textbook-canon",
      label: "Textbook-canonical algorithm variants (bubble with early-exit, selection, insertion, top-down merge sort, Lomuto-partition quicksort with last-element pivot) as taught across standard curricula; no vendor specification exists or is claimed - correctness is enforced by the golden vectors and a per-run output-sortedness invariant",
      type: "primary-spec",
      url: "https://en.wikipedia.org/wiki/Sorting_algorithm",
      access_date: "2026-07-22",
      scope: "strategy definitions and canonical behaviors",
      status: "active",
    },
  ],
} as const);
