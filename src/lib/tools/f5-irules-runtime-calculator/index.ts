// ============================================================================
// src/lib/tools/f5-irules-runtime-calculator/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING iRULES RUNTIME CALCULATOR — a {manifest, run, vectors} triple.
//
// Pure local arithmetic over pasted timing statistics: no network, no secrets,
// so executionClass is "localOnly", dangerousInputHandling is empty, and
// shareSafetyDefault is "safe" (cycle counts and clock speeds are not sensitive).
// ============================================================================

import { run as computeRuntime, type RuntimeCalcResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  F5_IRULES_RUNTIME_CALCULATOR_GOLDEN_VECTORS,
} from "./golden-vectors";

export { GOLDEN_VECTOR_SET_ID, F5_IRULES_RUNTIME_CALCULATOR_GOLDEN_VECTORS } from "./golden-vectors";
export { NOTES } from "./compute";
export type { RuntimeCalcResult, EventRow, RuntimeCalcInput } from "./compute";

/** The D-49 declarative manifest for the iRules runtime calculator. */
export const manifest = Object.freeze({
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-irules-runtime-calculator",
  canonicalAliases: [
    "irules-runtime-calculator",
    "irule-timing-calculator",
    "irule-cycles-to-time",
    "tcl-cycles-cpu",
    "irule-cpu-cost",
  ],
  inputDetectors: [
    {
      // The distinctive "Cycles (min, avg, max) = (...)" signature of tmsh output.
      kind: "regex",
      priority: 3,
      pattern: "Cycles\\s*\\(min,\\s*avg,\\s*max\\)",
      example:
        "HTTP_REQUEST 729 total 0 fail 0 abort | Cycles (min, avg, max) = (3693, 3959, 53936)",
    },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [],
  shareSafetyDefault: "safe",
  learnLinks: ["learn/irules-performance-and-timing"],
  sources: [
    {
      id: "dc-runtime-calc-sdk",
      label: "DevCentral — Generate the iRules Runtime Calculator Excel Spreadsheet with the Python SDK",
      type: "reference",
      url: "https://community.f5.com/kb/technicalarticles/generate-the-irules-runtime-calculator-excel-spreadsheet-with-the-python-sdk/285509",
      access_date: "2026-07-07",
      scope: "the calculator and its downloadable spreadsheet: Cycles/Sec as cores x MHz x 1,000,000, the field-fmt event statistics (avg/min/max-cycles, total-executions), and the table formulas reproduced here (cycles summed; microseconds = cycles x 1e6 / CyclesPerSec; % CPU = cycles / CyclesPerSec; max requests/sec = CyclesPerSec / cycles), each with min/avg/max, verified against the workbook's shipped example",
      status: "active",
    },
    {
      id: "dc-eval-perf",
      label: "DevCentral — Intermediate iRules: Evaluating Performance",
      type: "reference",
      url: "https://community.f5.com/kb/technicalarticles/intermediate-irules-evaluating-performance/290352",
      access_date: "2026-07-07",
      scope: "the timing command's Cycles (min, avg, max) output, average being the reliable metric, and discarding the compile-inflated maximum",
      status: "active",
    },
    {
      id: "irules-timing",
      label: "F5 clouddocs — iRules timing command",
      type: "reference",
      url: "https://clouddocs.f5.com/api/irules/timing.html",
      access_date: "2026-07-07",
      scope: "timing syntax and scope and on-by-default since 11.5.0",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/** run — the registry-facing entry point. */
export function run(input: {
  timingOutput: string;
  clockMhz: number;
  cores: number;
  cyclesPerSecOverride?: number | null;
}): RuntimeCalcResult {
  return computeRuntime(input);
}

export const goldenVectors = F5_IRULES_RUNTIME_CALCULATOR_GOLDEN_VECTORS;
export const rejectVectors = [];
