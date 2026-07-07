// ============================================================================
// src/lib/tools/f5-irules-runtime-calculator/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules Runtime Calculator
// (set id: "f5-irules-runtime-calculator/golden@1").
//
// Vector 1 reproduces DevCentral's shipped workbook example EXACTLY: its
// Cycles/Sec of 2,903,000,097 turns a 591,600-cycle request into 203.7892
// microseconds, 0.02037892% CPU, and 4,907.03 req/s, and every per-event and
// total cell matches the spreadsheet. Vector 2 exercises the field-fmt parser
// and its K/M/G suffix expansion (43.0K -> 43000). Vector 3 covers unparseable
// input. All expected values were captured from compute.run(); note strings are
// the shared NOTES constants.
// ============================================================================

import type { RuntimeCalcResult } from "./compute";
import { NOTES } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-irules-runtime-calculator/golden@1";

export interface RuntimeGoldenVector {
  name: string;
  input: {
    timingOutput: string;
    clockMhz: number;
    cores: number;
    cyclesPerSecOverride?: number | null;
  };
  expected: RuntimeCalcResult;
}

export const F5_IRULES_RUNTIME_CALCULATOR_GOLDEN_VECTORS: RuntimeGoldenVector[] = [
  {
    name: "devcentral-spreadsheet-example-override",
    input: {
      timingOutput:
        "Event_1 378 total 0 fail 0 abort | Cycles (min, avg, max) = (207800, 543700, 1900000)\nEvent_2 378 total 0 fail 0 abort | Cycles (min, avg, max) = (19000, 47900, 100900)",
      clockMhz: 0,
      cores: 0,
      cyclesPerSecOverride: 2903000097,
    },
    expected: {
      events: [
        {
          event: "Event_1",
          executions: 378,
          cyclesMin: 207800,
          cyclesAvg: 543700,
          cyclesMax: 1900000,
          usMin: 71.5811,
          usAvg: 187.289,
          usMax: 654.4953,
          cpuPctMin: 0.00715811,
          cpuPctAvg: 0.0187289,
          cpuPctMax: 0.06544953,
          reqAtMin: 13970.16,
          reqAtAvg: 5339.34,
          reqAtMax: 1527.89,
        },
        {
          event: "Event_2",
          executions: 378,
          cyclesMin: 19000,
          cyclesAvg: 47900,
          cyclesMax: 100900,
          usMin: 6.545,
          usAvg: 16.5002,
          usMax: 34.7571,
          cpuPctMin: 0.0006545,
          cpuPctAvg: 0.00165002,
          cpuPctMax: 0.00347571,
          reqAtMin: 152789.48,
          reqAtAvg: 60605.43,
          reqAtMax: 28771.06,
        },
      ],
      total: {
        event: "Total",
        executions: 378,
        cyclesMin: 226800,
        cyclesAvg: 591600,
        cyclesMax: 2000900,
        usMin: 78.1261,
        usAvg: 203.7892,
        usMax: 689.2525,
        cpuPctMin: 0.00781261,
        cpuPctAvg: 0.02037892,
        cpuPctMax: 0.06892525,
        reqAtMin: 12799.82,
        reqAtAvg: 4907.03,
        reqAtMax: 1450.85,
      },
      cyclesPerSec: 2903000097,
      cyclesPerSecSource: "override",
      clockMhz: 0,
      cores: 0,
      parsedCount: 2,
      notes: [NOTES.avgReliable, NOTES.cmpDemotion],
    },
  },
  {
    name: "field-fmt-k-suffixes",
    input: {
      timingOutput:
        "ltm rule-event event_order:HTTP_RESPONSE {\n    aborts 0\n    avg-cycles 43.0K\n    event-type HTTP_RESPONSE\n    failures 0\n    max-cycles 853.9K\n    min-cycles 6.5K\n    name event_order\n    priority 500\n    total-executions 2.0K\n}",
      clockMhz: 3400.606,
      cores: 2,
    },
    expected: {
      events: [
        {
          event: "HTTP_RESPONSE",
          executions: 2000,
          cyclesMin: 6500,
          cyclesAvg: 43000,
          cyclesMax: 853900,
          usMin: 0.9557,
          usAvg: 6.3224,
          usMax: 125.5512,
          cpuPctMin: 0.00009557,
          cpuPctAvg: 0.00063224,
          cpuPctMax: 0.01255512,
          reqAtMin: 1046340.31,
          reqAtAvg: 158167.72,
          reqAtMax: 7964.88,
        },
      ],
      total: {
        event: "Total",
        executions: 2000,
        cyclesMin: 6500,
        cyclesAvg: 43000,
        cyclesMax: 853900,
        usMin: 0.9557,
        usAvg: 6.3224,
        usMax: 125.5512,
        cpuPctMin: 0.00009557,
        cpuPctAvg: 0.00063224,
        cpuPctMax: 0.01255512,
        reqAtMin: 1046340.31,
        reqAtAvg: 158167.72,
        reqAtMax: 7964.88,
      },
      cyclesPerSec: 6801212000,
      cyclesPerSecSource: "cores-x-clock",
      clockMhz: 3400.606,
      cores: 2,
      parsedCount: 1,
      notes: [NOTES.avgReliable, NOTES.coresXClock, NOTES.cmpDemotion],
    },
  },
  {
    name: "no-parseable-lines",
    input: { timingOutput: "nope", clockMhz: 2000, cores: 4 },
    expected: {
      events: [],
      total: {
        event: "Total",
        executions: 0,
        cyclesMin: 0,
        cyclesAvg: 0,
        cyclesMax: 0,
        usMin: 0,
        usAvg: 0,
        usMax: 0,
        cpuPctMin: 0,
        cpuPctAvg: 0,
        cpuPctMax: 0,
        reqAtMin: 0,
        reqAtAvg: 0,
        reqAtMax: 0,
      },
      cyclesPerSec: 8000000000,
      cyclesPerSecSource: "cores-x-clock",
      clockMhz: 2000,
      cores: 4,
      parsedCount: 0,
      notes: [NOTES.noneRecognised],
    },
  },
];
