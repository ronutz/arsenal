// ============================================================================
// src/lib/tools/f5-irules-scan-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules scan explainer
// (set "f5-irules-scan-explainer-golden-2026-10-03").
//
// Each vector is a value, a scan format and the variable names. The pinned
// fields are the result, each variable's value, why scanning stopped, the
// note codes, and every step: directive, characters consumed, outcome, value
// and the variable it went to.
//
// Expected values were captured from compute.run() on 2026-10-03.
// The plain-Tcl part of every vector (10 checks) was also run in a real
// Tcl 8.4.6 interpreter, built from the tcltk/tcl tag core-8-4-6, on 2026-10-03:
// 10 of 10 agree. Nothing here is pinned from the engine alone where
// the reference can answer.
// ============================================================================

import { run, type ScanExplainerInput, type ScanExplainerResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-irules-scan-explainer-golden-2026-10-03";

/** The fields a vector pins. */
export type ScanExplainerPinned = { ok: boolean; result?: string; error?: string; command: string; assignments: ScanExplainerResult["assignments"]; stopped?: string; notes: string[]; directives: string[]; steps: (string | number | null)[][] };

/** One vector: a name, an input, and the pinned fields of its result. */
export interface ScanExplainerVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: ScanExplainerInput;
  // The pinned fields of the result.
  expect: ScanExplainerPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: ScanExplainerResult): ScanExplainerPinned {
  // The steps as compact rows: directive text, consumed, outcome, value, variable.
  const steps = r.steps.map((s) => [r.directives[s.directive].text, s.consumed, s.outcome, s.value ?? null, s.variable ?? null]);
  // The pinned fields.
  return { ok: r.ok, result: r.result, error: r.error, command: r.command, assignments: r.assignments, stopped: r.stopped, notes: r.notes, directives: r.directives.map((d) => d.text), steps };
}

/** The vectors. */
export const VECTORS: ScanExplainerVector[] = [
  // Two numbers around a literal colon.
  {
    id: "time",
    input: { input: "10:30", format: "%d:%d", vars: "hours minutes" },
    expect: {
      ok: true,
      result: "2",
      command: "scan 10:30 %d:%d hours minutes",
      assignments: [{ name: "hours", value: "10" }, { name: "minutes", value: "30" }],
      stopped: "format-end",
      notes: [],
      directives: ["%d", ":", "%d"],
      steps: [
        ["%d", "10", "assigned", "10", "hours"],
        [":", ":", "matched", null, null],
        ["%d", "30", "assigned", "30", "minutes"],
      ],
    },
  },
  // Four numbers separated by literal dots.
  {
    id: "ipv4",
    input: { input: "192.168.1.20", format: "%d.%d.%d.%d", vars: "a b c d" },
    expect: {
      ok: true,
      result: "4",
      command: "scan 192.168.1.20 %d.%d.%d.%d a b c d",
      assignments: [
        { name: "a", value: "192" },
        { name: "b", value: "168" },
        { name: "c", value: "1" },
        { name: "d", value: "20" },
      ],
      stopped: "format-end",
      notes: [],
      directives: ["%d", ".", "%d", ".", "%d", ".", "%d"],
      steps: [
        ["%d", "192", "assigned", "192", "a"],
        [".", ".", "matched", null, null],
        ["%d", "168", "assigned", "168", "b"],
        [".", ".", "matched", null, null],
        ["%d", "1", "assigned", "1", "c"],
        [".", ".", "matched", null, null],
        ["%d", "20", "assigned", "20", "d"],
      ],
    },
  },
  // Nothing converted: the result is 0, not -1.
  {
    id: "no-digits",
    input: { input: "abc", format: "%d", vars: "n" },
    expect: {
      ok: true,
      result: "0",
      command: "scan abc %d n",
      assignments: [{ name: "n", value: null }],
      stopped: "mismatch",
      notes: [],
      directives: ["%d"],
      steps: [["%d", "", "stopped", null, null]],
    },
  },
  // The input ran out before the first conversion: -1.
  {
    id: "empty-input",
    input: { input: "", format: "%d", vars: "n" },
    expect: {
      ok: true,
      result: "-1",
      command: "scan {} %d n",
      assignments: [{ name: "n", value: null }],
      stopped: "input-end",
      notes: ["minus-one"],
      directives: ["%d"],
      steps: [["%d", "", "out-of-input", null, null]],
    },
  },
  // A literal prefix, then %[^&] reads up to the ampersand.
  {
    id: "query-set",
    input: { input: "user=abc&x=1", format: "user=%[^&]", vars: "u" },
    expect: {
      ok: true,
      result: "1",
      command: "scan user=abc&x=1 {user=%[^&]} u",
      assignments: [{ name: "u", value: "abc" }],
      stopped: "format-end",
      notes: [],
      directives: ["user=", "%[^&]"],
      steps: [["user=", "user=", "matched", null, null], ["%[^&]", "abc", "assigned", "abc", "u"]],
    },
  },
  // %i reads 08 as octal: 0, then the 8 fails the colon.
  {
    id: "i-octal",
    input: { input: "08:15", format: "%i:%d", vars: "h m" },
    expect: {
      ok: true,
      result: "1",
      command: "scan 08:15 %i:%d h m",
      assignments: [{ name: "h", value: "0" }, { name: "m", value: null }],
      stopped: "mismatch",
      notes: ["i-prefix"],
      directives: ["%i", ":", "%d"],
      steps: [["%i", "0", "assigned", "0", "h"], [":", "8", "stopped", null, null]],
    },
  },
  // %d stores through a C int in Tcl 8.4: 3000000000 comes back negative.
  {
    id: "int32",
    input: { input: "3000000000", format: "%d", vars: "n" },
    expect: {
      ok: true,
      result: "1",
      command: "scan 3000000000 %d n",
      assignments: [{ name: "n", value: "-1294967296" }],
      stopped: "format-end",
      notes: ["int32"],
      directives: ["%d"],
      steps: [["%d", "3000000000", "assigned", "-1294967296", "n"]],
    },
  },
  // No variable names: scan returns the values as a list.
  {
    id: "inline",
    input: { input: "10:30", format: "%d:%d", vars: "" },
    expect: {
      ok: true,
      result: "10 30",
      command: "scan 10:30 %d:%d",
      assignments: [],
      stopped: "format-end",
      notes: ["inline"],
      directives: ["%d", ":", "%d"],
      steps: [
        ["%d", "10", "assigned", "10", "#1"],
        [":", ":", "matched", null, null],
        ["%d", "30", "assigned", "30", "#2"],
      ],
    },
  },
  // %s stops at white space.
  {
    id: "request-line",
    input: { input: "GET /index.html HTTP/1.1", format: "%s %s %s", vars: "method uri version" },
    expect: {
      ok: true,
      result: "3",
      command: "scan {GET /index.html HTTP/1.1} {%s %s %s} method uri version",
      assignments: [
        { name: "method", value: "GET" },
        { name: "uri", value: "/index.html" },
        { name: "version", value: "HTTP/1.1" },
      ],
      stopped: "format-end",
      notes: [],
      directives: ["%s", " ", "%s", " ", "%s"],
      steps: [
        ["%s", "GET", "assigned", "GET", "method"],
        [" ", " ", "matched", null, null],
        ["%s", "/index.html", "assigned", "/index.html", "uri"],
        [" ", " ", "matched", null, null],
        ["%s", "HTTP/1.1", "assigned", "HTTP/1.1", "version"],
      ],
    },
  },
  // %n counts bytes of UTF-8 in Tcl 8.4.6, so é counts 2.
  {
    id: "n-bytes",
    input: { input: "é1", format: "%c%n", vars: "c n" },
    expect: {
      ok: true,
      result: "2",
      command: "scan é1 %c%n c n",
      assignments: [{ name: "c", value: "233" }, { name: "n", value: "2" }],
      stopped: "format-end",
      notes: ["n-bytes"],
      directives: ["%c", "%n"],
      steps: [["%c", "é", "assigned", "233", "c"], ["%n", "", "assigned", "2", "n"]],
    },
  },
];

/** What verifyVectors reports (the shape scripts/run-golden-vectors.mts reads). */
export interface VerifyReport {
  // The set id.
  setId: string;
  // Vectors run.
  total: number;
  // Vectors whose pinned fields matched.
  passed: number;
  // The ones that did not, with the first difference.
  failures: { id: string; reason: string }[];
}

/** Run every vector and compare its pinned fields byte for byte. */
export function verifyVectors(): VerifyReport {
  // Failures found.
  const failures: { id: string; reason: string }[] = [];
  // Each vector.
  for (const v of VECTORS) {
    // A throw is a failure too.
    try {
      // Run and reduce (through JSON, as the expected values were captured).
      const got = JSON.stringify(pin(run(v.input)));
      // The expected text.
      const want = JSON.stringify(v.expect);
      // Compare.
      if (got !== want) {
        // The first differing character, for a readable reason.
        let k = 0;
        // Walk to it.
        while (k < got.length && got[k] === want[k]) k++;
        // Record.
        failures.push({ id: v.id, reason: `differs at ${k}: got ...${got.slice(Math.max(0, k - 30), k + 50)}... want ...${want.slice(Math.max(0, k - 30), k + 50)}...` });
      }
    } catch (e) {
      // The error.
      failures.push({ id: v.id, reason: `threw: ${(e as Error).message}` });
    }
  }
  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total: VECTORS.length, passed: VECTORS.length - failures.length, failures };
}
