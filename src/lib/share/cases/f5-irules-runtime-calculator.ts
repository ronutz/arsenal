// ============================================================================
// src/lib/share/cases/f5-irules-runtime-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules runtime calculator: the timing output and the
// three number fields go as typed, each number left out when empty.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_RUNTIME_CALCULATOR_SHARE, type RuntimeCalculatorShareState } from "../../tools/f5-irules-runtime-calculator/share"; // the spec and its state

/** The page's Example timing output (F5IrulesRuntimeCalculatorTool's EXAMPLE_TIMING, first event). */
const TIMING = `ltm rule-event myrule:HTTP_REQUEST {
    aborts 0
    avg-cycles 15.8K
    event-type HTTP_REQUEST
    failures 0
    max-cycles 4.1M
    min-cycles 15.8K
    name myrule
    priority 500
    total-executions 10.0K
}`;

/** The cases. */
export const IRULES_RUNTIME_CALCULATOR_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<RuntimeCalculatorShareState, RuntimeCalculatorShareState>>({ // typed, so the cases check as one list
  spec: IRULES_RUNTIME_CALCULATOR_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: TIMING, clock: "3400.606", cores: "2", override: "" }, params: { input: TIMING, clock: "3400.606", cores: "2" }, restored: { input: TIMING, clock: "3400.606", cores: "2", override: "" } }, // the Example's numbers; no override
    { id: "override", state: { input: TIMING, clock: "", cores: "", override: "8000000000" }, params: { input: TIMING, override: "8000000000" }, restored: { input: TIMING, clock: "", cores: "", override: "8000000000" } }, // an override instead of cores x clock
  ],
  empty: [ // nothing to share
    { id: "no-timing", state: { input: " \n", clock: "2133.48", cores: "4", override: "" } }, // numbers alone: no tables
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "no-timing", values: { input: null, clock: "2133.48" } }, // numbers alone
    { id: "blank-timing", values: { input: "  " } }, // only blanks
    { id: "long-number", values: { input: TIMING, clock: "1".repeat(33) } }, // not a number anyone types
  ],
}));
